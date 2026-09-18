"use strict";

// =======================================================
// GoldTrade V18 - SETTINGS ROUTES (PART 1/4)
// =======================================================

const express = require("express");
const router = express.Router();

// ================= MODELS =================
const Settings = require("../models/Settings");

// ================= MIDDLEWARE =================
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");

// =======================================================
// HEALTH CHECK
// GET /api/settings/health
// =======================================================

router.get("/health", (req, res) => {
  return res.json({
    success: true,
    message: "Settings API Working - GoldTrade V18",
    timestamp: new Date(),
  });
});

// =======================================================
// CREATE DEFAULT SETTINGS (AUTO)
// =======================================================

const getSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({
      buyGoldPrice: 31250,
      sellGoldPrice: 30950,
      goldPriceUSD: 3350,
      usdToPkr: 305,
      goldTradingEnabled: true,
      marketStatus: "OPEN",
      maintenanceMode: false,
      updatedBy: "SYSTEM",
    });
  }

  return settings;
};
// =======================================================
// GET PUBLIC SETTINGS
// GET /api/settings/public
// Used by Gold Dashboard / Buy / Sell Pages
// =======================================================

router.get("/public", async (req, res) => {
  try {
    const settings = await getSettings();

    return res.json({
      success: true,
      buyGoldPrice: settings.buyGoldPrice,
      sellGoldPrice: settings.sellGoldPrice,
      goldPriceUSD: settings.goldPriceUSD,
      usdToPkr: settings.usdToPkr,
      goldTradingEnabled: settings.goldTradingEnabled,
      marketStatus: settings.marketStatus,
      maintenanceMode: settings.maintenanceMode,
      updatedAt: settings.updatedAt,
    });
  } catch (err) {
    console.error("PUBLIC SETTINGS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load public settings.",
    });
  }
});

// =======================================================
// GET COMPLETE SETTINGS (ADMIN)
// GET /api/settings
// =======================================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getSettings();

    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error("GET SETTINGS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load settings.",
    });
  }
});

// =======================================================
// GET GOLD PRICE ONLY
// GET /api/settings/gold-price
// =======================================================

router.get("/gold-price", async (req, res) => {
  try {
    const settings = await getSettings();

    return res.json({
      success: true,
      buyPrice: settings.buyGoldPrice,
      sellPrice: settings.sellGoldPrice,
      usdPrice: settings.goldPriceUSD,
      usdToPkr: settings.usdToPkr,
      marketStatus: settings.marketStatus,
      tradingEnabled: settings.goldTradingEnabled,
    });
  } catch (err) {
    console.error("GOLD PRICE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load gold prices.",
    });
  }
});

// =======================================================
// UPDATE SETTINGS
// PUT /api/settings/update
// =======================================================

router.put("/update", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      buyGoldPrice,
      sellGoldPrice,
      goldPriceUSD,
      usdToPkr,
      goldTradingEnabled,
      marketStatus,
      maintenanceMode,
    } = req.body;

    let settings = await getSettings();

    // ---------- GOLD BUY PRICE ----------
    if (buyGoldPrice !== undefined) {
      settings.buyGoldPrice = Number(buyGoldPrice);
    }

    // ---------- GOLD SELL PRICE ----------
    if (sellGoldPrice !== undefined) {
      settings.sellGoldPrice = Number(sellGoldPrice);
    }

    // ---------- LIVE GOLD USD PRICE ----------
    if (goldPriceUSD !== undefined) {
      settings.goldPriceUSD = Number(goldPriceUSD);
    }

    // ---------- USD TO PKR RATE ----------
    if (usdToPkr !== undefined) {
      settings.usdToPkr = Number(usdToPkr);
    }

    // ---------- ENABLE / DISABLE GOLD TRADING ----------
    if (goldTradingEnabled !== undefined) {
      settings.goldTradingEnabled = Boolean(goldTradingEnabled);
    }

    // ---------- MARKET OPEN / CLOSE ----------
    if (marketStatus !== undefined) {
      settings.marketStatus =
        marketStatus === "CLOSED" ? "CLOSED" : "OPEN";
    }

    // ---------- MAINTENANCE MODE ----------
    if (maintenanceMode !== undefined) {
      settings.maintenanceMode = Boolean(maintenanceMode);
    }

    // ---------- ADMIN INFO ----------
    settings.updatedBy =
      req.user.username || req.user.email || "ADMIN";

    settings.updatedAt = new Date();

    await settings.save();

    return res.json({
      success: true,
      message: "Settings updated successfully.",
      settings,
    });
  } catch (err) {
    console.error("UPDATE SETTINGS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update settings.",
      error: err.message,
    });
  }
});

// =======================================================
// RESET SETTINGS TO DEFAULT
// POST /api/settings/reset
// =======================================================

router.post("/reset", verifyToken, isAdmin, async (req, res) => {
  try {
    let settings = await getSettings();

    settings.buyGoldPrice = 31250;
    settings.sellGoldPrice = 30950;
    settings.goldPriceUSD = 3350;
    settings.usdToPkr = 305;
    settings.goldTradingEnabled = true;
    settings.marketStatus = "OPEN";
    settings.maintenanceMode = false;
    settings.updatedBy =
      req.user.username || req.user.email || "ADMIN";
    settings.updatedAt = new Date();

    await settings.save();

    return res.json({
      success: true,
      message: "Settings reset successfully.",
      settings,
    });
  } catch (err) {
    console.error("RESET SETTINGS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to reset settings.",
      error: err.message,
    });
  }
});

// =======================================================
// GET MARKET STATUS
// GET /api/settings/market-status
// =======================================================

router.get("/market-status", async (req, res) => {
  try {
    const settings = await getSettings();

    return res.json({
      success: true,
      marketStatus: settings.marketStatus,
      goldTradingEnabled: settings.goldTradingEnabled,
      maintenanceMode: settings.maintenanceMode,
      updatedAt: settings.updatedAt,
    });
  } catch (err) {
    console.error("MARKET STATUS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load market status.",
    });
  }
});

// =======================================================
// TOGGLE MARKET STATUS
// PUT /api/settings/toggle-market
// =======================================================

router.put("/toggle-market", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getSettings();

    settings.marketStatus =
      settings.marketStatus === "OPEN" ? "CLOSED" : "OPEN";

    settings.updatedBy =
      req.user.username || req.user.email || "ADMIN";

    settings.updatedAt = new Date();

    await settings.save();

    return res.json({
      success: true,
      message: `Market is now ${settings.marketStatus}.`,
      marketStatus: settings.marketStatus,
    });
  } catch (err) {
    console.error("TOGGLE MARKET ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to toggle market status.",
    });
  }
});

// =======================================================
// TOGGLE GOLD TRADING
// PUT /api/settings/toggle-trading
// =======================================================

router.put("/toggle-trading", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getSettings();

    settings.goldTradingEnabled = !settings.goldTradingEnabled;

    settings.updatedBy =
      req.user.username || req.user.email || "ADMIN";

    settings.updatedAt = new Date();

    await settings.save();

    return res.json({
      success: true,
      message: settings.goldTradingEnabled
        ? "Gold Trading Enabled."
        : "Gold Trading Disabled.",
      goldTradingEnabled: settings.goldTradingEnabled,
    });
  } catch (err) {
    console.error("TOGGLE TRADING ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update trading status.",
    });
  }
});

// =======================================================
// MODULE EXPORT
// =======================================================

module.exports = router;