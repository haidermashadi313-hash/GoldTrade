const express = require("express");
const router = express.Router();
const Settings = require("../models/Settings");

// ==========================================
// GET LIVE MARKET
// ==========================================
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        buyGoldPrice: 31500,
        sellGoldPrice: 31200,
        usdtRate: 280,
        marketStatus: "OPEN",
      });
    }

    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// ==========================================
// UPDATE MARKET (ADMIN)
// ==========================================
router.put("/", async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      {},
      req.body,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;