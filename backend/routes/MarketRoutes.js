"use strict";

// =======================================================
// GoldTrade V18 - Market Routes
// Linux + Render Compatible
// =======================================================

const express = require("express");
const router = express.Router();

// =======================================================
// MODEL
// =======================================================

const Settings = require("../models/Settings");

// =======================================================
// MIDDLEWARE
// =======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =======================================================
// HEALTH CHECK
// GET /api/market/health
// =======================================================

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Market API Working - GoldTrade V18",
    version: "V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// GET LIVE MARKET SETTINGS
// GET /api/market
// =======================================================

router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne().lean();

    if (!settings) {
      settings = await Settings.create({
        buyGoldPrice: 31500,
        sellGoldPrice: 31200,
        UsdtRate: 280,
        goldPriceUSD: 3350,
        usdToPkr: 280,
        marketStatus: "OPEN",
        goldTradingEnabled: true,
      });

      settings = settings.toObject();
    }

    return res.status(200).json({
      success: true,
      settings,
    });

  } catch (err) {
    console.error("GET MARKET ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load market settings.",
      error: err.message,
    });
  }
});

// =======================================================
// UPDATE MARKET SETTINGS (ADMIN ONLY)
// PUT /api/market
// =======================================================

router.put("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      buyGoldPrice,
      sellGoldPrice,
      UsdtRate,
      goldPriceUSD,
      usdToPkr,
      marketStatus,
      goldTradingEnabled,
    } = req.body;

    const updateData = {};

    if (buyGoldPrice !== undefined)
      updateData.buyGoldPrice = Number(buyGoldPrice);

    if (sellGoldPrice !== undefined)
      updateData.sellGoldPrice = Number(sellGoldPrice);

    if (UsdtRate !== undefined)
      updateData.UsdtRate = Number(UsdtRate);

    if (goldPriceUSD !== undefined)
      updateData.goldPriceUSD = Number(goldPriceUSD);

    if (usdToPkr !== undefined)
      updateData.usdToPkr = Number(usdToPkr);

    if (marketStatus !== undefined)
      updateData.marketStatus = String(marketStatus).toUpperCase();

    if (goldTradingEnabled !== undefined)
      updateData.goldTradingEnabled = Boolean(goldTradingEnabled);

    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Market settings updated successfully.",
      settings,
    });

  } catch (err) {
    console.error("UPDATE MARKET ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to update market settings.",
      error: err.message,
    });
  }
});

// =======================================================
// EXPORT ROUTER
// =======================================================

module.exports = router;