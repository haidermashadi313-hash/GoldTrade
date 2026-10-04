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

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

// =======================================================
// HEALTH CHECK
// GET /api/market/health
// =======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message:
      "Market API Working - GoldTrade V18",
    version: "V18 Enterprise",
    timestamp:
      new Date().toISOString(),
  });
});

// =======================================================
// GET LIVE MARKET SETTINGS
// GET /api/market
// =======================================================

router.get("/", async (req, res) => {
  try {
    let settings =
      await Settings.findOne().lean();

    // ===================================================
    // CREATE DEFAULT SETTINGS IF NOT FOUND
    // ===================================================

    if (!settings) {
      const createdSettings =
        await Settings.create({
          buyGoldPrice: 31500,
          sellGoldPrice: 31200,
          UsdtRate: 280,
          goldPriceUSD: 3350,
          usdToPkr: 280,
          marketStatus: "OPEN",
          goldTradingEnabled: true,
        });

      settings =
        createdSettings.toObject();
    }

    // ===================================================
    // SUCCESS RESPONSE
    // ===================================================

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error(
      "GET MARKET ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to load market settings.",
      error: err.message,
    });
  }
});

// =======================================================
// UPDATE MARKET SETTINGS
// ADMIN ONLY
//
// PUT /api/market
// =======================================================

router.put(
  "/",
  verifyToken,
  isAdmin,
  async (req, res) => {
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

      // =================================================
      // PREPARE UPDATE DATA
      // =================================================

      const updateData = {};

      // =================================================
      // GOLD BUY PRICE
      // =================================================

      if (
        buyGoldPrice !== undefined
      ) {
        updateData.buyGoldPrice =
          Number(buyGoldPrice);
      }

      // =================================================
      // GOLD SELL PRICE
      // =================================================

      if (
        sellGoldPrice !== undefined
      ) {
        updateData.sellGoldPrice =
          Number(sellGoldPrice);
      }

      // =================================================
      // USDT RATE
      // =================================================

      if (
        UsdtRate !== undefined
      ) {
        updateData.UsdtRate =
          Number(UsdtRate);
      }

      // =================================================
      // GOLD PRICE USD
      // =================================================

      if (
        goldPriceUSD !== undefined
      ) {
        updateData.goldPriceUSD =
          Number(goldPriceUSD);
      }

      // =================================================
      // USD TO PKR
      // =================================================

      if (
        usdToPkr !== undefined
      ) {
        updateData.usdToPkr =
          Number(usdToPkr);
      }

      // =================================================
      // MARKET STATUS
      // =================================================

      if (
        marketStatus !== undefined
      ) {
        updateData.marketStatus =
          String(
            marketStatus
          ).toUpperCase();
      }

      // =================================================
      // GOLD TRADING ENABLED
      // =================================================

      if (
        goldTradingEnabled !== undefined
      ) {
        updateData.goldTradingEnabled =
          Boolean(
            goldTradingEnabled
          );
      }

      // =================================================
      // UPDATE DATABASE
      // =================================================

      const settings =
        await Settings.findOneAndUpdate(
          {},
          {
            $set: updateData,
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        );

      // =================================================
      // SUCCESS RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,
        message:
          "Market settings updated successfully.",
        settings,
      });
    } catch (err) {
      console.error(
        "UPDATE MARKET ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update market settings.",
        error: err.message,
      });
    }
  }
);

// =======================================================
// EXPORT ROUTER
// =======================================================

module.exports = router;