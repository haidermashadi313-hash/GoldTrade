const express = require("express");
const router = express.Router();

const MarketSettings = require("../models/MarketSettings");
const { verifyToken } = require("../middleware/authMiddleware");

// GET MARKET SETTINGS
router.get("/", async (req, res) => {
  try {
    let market = await MarketSettings.findOne();

    if (!market) {
      market = await MarketSettings.create({});
    }

    const ounceToGram = market.goldPriceUSD / 31.1035;
    const gold24K = Math.round(ounceToGram * market.usdToPkr);

    res.json({
      success: true,
      data: {
        goldPriceUSD: market.goldPriceUSD,
        usdToPkr: market.usdToPkr,
        usdtRate: market.usdtRate,
        gold24K,
        gold22K: Math.round(gold24K * 0.916),
        gold21K: Math.round(gold24K * 0.875),
        gold18K: Math.round(gold24K * 0.75),
        buyGoldPrice: gold24K + market.buyMargin,
        sellGoldPrice: gold24K - market.sellMargin,
        tradingEnabled: market.tradingEnabled,
        autoUpdate: market.autoUpdate,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// UPDATE MARKET (ADMIN)
router.put("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    let market = await MarketSettings.findOne();

    if (!market) {
      market = await MarketSettings.create({});
    }

    Object.assign(market, req.body);
    market.lastUpdated = new Date();
    market.updatedBy = req.user._id;

    await market.save();

    res.json({
      success: true,
      message: "Market updated successfully.",
      data: market,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;