"use strict";

// =======================================================
// GoldTrade V18 Enterprise - SETTINGS ROUTES
// Linux + Render + Vercel Production Compatible
// =======================================================

const express = require("express");
const router = express.Router();

// =======================================================
// MODELS
// =======================================================

const Settings = require("../models/Settings");

// =======================================================
// AUTH MIDDLEWARE
// =======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =======================================================
// HEALTH CHECK
// GET /api/settings/health
// =======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "GoldTrade V18 Settings API Working",
    version: "V18 Enterprise",
    timestamp: new Date(),
  });
});

// =======================================================
// CREATE DEFAULT SETTINGS (AUTO CREATE + AUTO FIX)
// =======================================================

const getSettings = async () => {
  let settings = await Settings.findOne();

  // Create default settings if database is empty
  if (!settings) {
    settings = await Settings.create({
      buyGoldPrice: 312000,
      sellGoldPrice: 310000,
      goldPriceUSD: 3420.5,

      // USD → PKR Exchange Rate
      UsdtoPkr: 305,

      goldTradingEnabled: true,
      marketStatus: "OPEN",
      maintenanceMode: false,

      updatedBy: "SYSTEM",
    });

    return settings;
  }

  // =====================================================
  // AUTO FIX OLD DATABASE DOCUMENTS
  // =====================================================

  let changed = false;

  if (settings.UsdtoPkr === undefined || settings.UsdtoPkr === null) {
    settings.UsdtoPkr = 305;
    changed = true;
  }

  if (!settings.marketStatus) {
    settings.marketStatus = "OPEN";
    changed = true;
  }

  if (settings.goldTradingEnabled === undefined) {
    settings.goldTradingEnabled = true;
    changed = true;
  }

  if (settings.maintenanceMode === undefined) {
    settings.maintenanceMode = false;
    changed = true;
  }

  if (changed) {
    settings.updatedBy = "SYSTEM";
    await settings.save();
  }

  return settings;
};

// =======================================================
// SAFE NUMBER CONVERTER
// =======================================================

const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

// =======================================================
// PUBLIC SETTINGS
// GET /api/settings/public
// Used by Dashboard / Buy / Sell / Market
// =======================================================

router.get("/public", async (req, res) => {
  try {
    const settings = await getSettings();

    return res.status(200).json({
      success: true,

      buyGoldPrice: settings.buyGoldPrice,
      sellGoldPrice: settings.sellGoldPrice,
      goldPriceUSD: settings.goldPriceUSD,

      // Compatibility for all frontend pages
      UsdtoPkr: settings.UsdtoPkr,
      usdToPkr: settings.UsdtoPkr,

      goldTradingEnabled: settings.goldTradingEnabled,
      marketStatus: settings.marketStatus,
      maintenanceMode: settings.maintenanceMode,

      updatedBy: settings.updatedBy,
      updatedAt: settings.updatedAt,
    });

  } catch (error) {
    console.error("PUBLIC SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load public settings.",
    });
  }
});

// =======================================================
// ADMIN SETTINGS
// GET /api/settings
// =======================================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getSettings();

    return res.status(200).json({
      success: true,
      settings,
    });

  } catch (error) {
    console.error("GET SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load settings.",
    });
  }
});

// =======================================================
// GOLD PRICE API
// GET /api/settings/gold-price
// =======================================================

router.get("/gold-price", async (req, res) => {
  try {
    const settings = await getSettings();

    return res.status(200).json({
      success: true,

      buyPrice: settings.buyGoldPrice,
      sellPrice: settings.sellGoldPrice,

      usdPrice: settings.goldPriceUSD,

      UsdtoPkr: settings.UsdtoPkr,
      usdToPkr: settings.UsdtoPkr,

      marketStatus: settings.marketStatus,
      tradingEnabled: settings.goldTradingEnabled,
    });

  } catch (error) {
    console.error("GOLD PRICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load gold prices.",
    });
  }
});

// =======================================================
// MARKET STATUS API
// GET /api/settings/market-status
// =======================================================

router.get("/market-status", async (req, res) => {
  try {
    const settings = await getSettings();

    return res.status(200).json({
      success: true,

      marketStatus: settings.marketStatus,
      goldTradingEnabled: settings.goldTradingEnabled,
      maintenanceMode: settings.maintenanceMode,

      updatedBy: settings.updatedBy,
      updatedAt: settings.updatedAt,
    });

  } catch (error) {
    console.error("MARKET STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load market status.",
    });
  }
});
// =======================================================
// UPDATE SETTINGS
// PUT /api/settings/update
// =======================================================

router.put("/update", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getSettings();

    const {
      buyGoldPrice,
      sellGoldPrice,
      goldPriceUSD,
      UsdtoPkr,
      usdToPkr,
      goldTradingEnabled,
      marketStatus,
      maintenanceMode,
    } = req.body;

    // GOLD BUY PRICE
    if (buyGoldPrice !== undefined) {
      settings.buyGoldPrice = toNumber(
        buyGoldPrice,
        settings.buyGoldPrice
      );
    }

    // GOLD SELL PRICE
    if (sellGoldPrice !== undefined) {
      settings.sellGoldPrice = toNumber(
        sellGoldPrice,
        settings.sellGoldPrice
      );
    }

    // GOLD USD PRICE
    if (goldPriceUSD !== undefined) {
      settings.goldPriceUSD = toNumber(
        goldPriceUSD,
        settings.goldPriceUSD
      );
    }

    // USD → PKR (support both names)
    if (UsdtoPkr !== undefined || usdToPkr !== undefined) {
      settings.UsdtoPkr = toNumber(
        UsdtoPkr ?? usdToPkr,
        settings.UsdtoPkr
      );
    }

    // GOLD TRADING ENABLE / DISABLE
    if (goldTradingEnabled !== undefined) {
      settings.goldTradingEnabled = Boolean(goldTradingEnabled);
    }

    // MARKET STATUS
    if (marketStatus !== undefined) {
      settings.marketStatus =
        String(marketStatus).toUpperCase() === "CLOSED"
          ? "CLOSED"
          : "OPEN";
    }

    // MAINTENANCE MODE
    if (maintenanceMode !== undefined) {
      settings.maintenanceMode = Boolean(maintenanceMode);
    }

    // UPDATED BY
    settings.updatedBy =
      req.user.username || req.user.email || "ADMIN";

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully.",
      settings,
    });

  } catch (error) {
    console.error("UPDATE SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update settings.",
      error: error.message,
    });
  }
});

// =======================================================
// RESET SETTINGS
// POST /api/settings/reset
// =======================================================

router.post("/reset", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getSettings();

    settings.buyGoldPrice = 31250;
    settings.sellGoldPrice = 30950;
    settings.goldPriceUSD = 3420.5;
    settings.UsdtoPkr = 305;

    settings.goldTradingEnabled = true;
    settings.marketStatus = "OPEN";
    settings.maintenanceMode = false;

    settings.updatedBy =
      req.user.username || req.user.email || "ADMIN";

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Settings reset successfully.",
      settings,
    });

  } catch (error) {
    console.error("RESET SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to reset settings.",
      error: error.message,
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

    await settings.save();

    return res.status(200).json({
      success: true,
      message: `Market is now ${settings.marketStatus}.`,
      marketStatus: settings.marketStatus,
      goldTradingEnabled: settings.goldTradingEnabled,
    });

  } catch (error) {
    console.error("TOGGLE MARKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to toggle market status.",
      error: error.message,
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

    await settings.save();

    return res.status(200).json({
      success: true,
      message: settings.goldTradingEnabled
        ? "Gold Trading Enabled Successfully."
        : "Gold Trading Disabled Successfully.",
      goldTradingEnabled: settings.goldTradingEnabled,
      marketStatus: settings.marketStatus,
    });

  } catch (error) {
    console.error("TOGGLE TRADING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update trading status.",
      error: error.message,
    });
  }
});

// =======================================================
// UPDATE USD → PKR ONLY
// PUT /api/settings/usdt-rate
// =======================================================

router.put("/usdt-rate", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getSettings();

    // Support all frontend variable names
    const rate =
      req.body.UsdtoPkr ??
      req.body.usdToPkr ??
      req.body.usdtToPkr;

    if (rate === undefined || rate === null || isNaN(Number(rate))) {
      return res.status(400).json({
        success: false,
        message: "Valid USD to PKR rate is required.",
      });
    }

    settings.UsdtoPkr = Number(rate);
    settings.updatedBy = req.user.username || req.user.email || "ADMIN";

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "USD to PKR rate updated successfully.",

      // Return both names for frontend compatibility
      UsdtoPkr: settings.UsdtoPkr,
      usdToPkr: settings.UsdtoPkr,

      settings,
    });
  } catch (error) {
    console.error("USD TO PKR UPDATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update USD to PKR rate.",
      error: error.message,
    });
  }
});

// =======================================================
// MODULE EXPORT
// =======================================================

module.exports = router;