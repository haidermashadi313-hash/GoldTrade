// ======================================================
// GoldTrade V18 - Gold Routes (PART 1/4)
// ======================================================

const express = require("express");
const router = express.Router();

const { verifyToken, isAdmin } = require("../middleware/auth");

const {
  getGoldPrice,
  buyGold,
  sellGold,
  getGoldHistory,
  getPortfolio,
  getSettings,
  updateSettings,
  getAdminDashboard,
} = require("../controllers/goldController");

// ======================================================
// GOLD API HEALTH CHECK
// GET /api/gold
// ======================================================

router.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "GoldTrade V18 Gold API Running",
    version: "V18",
    timestamp: new Date(),
  });
});

// ======================================================
// GET LIVE GOLD PRICE
// GET /api/gold/price
// ======================================================

router.get("/price", getGoldPrice);

// ======================================================
// GET GOLD SETTINGS
// GET /api/gold/settings
// ======================================================

router.get("/settings", getSettings);

// ======================================================
// BUY GOLD
// POST /api/gold/buy
// Protected Route
// ======================================================

router.post("/buy", verifyToken, buyGold);

// ======================================================
// SELL GOLD
// POST /api/gold/sell
// Protected Route
// ======================================================

router.post("/sell", verifyToken, sellGold);

// ======================================================
// USER PORTFOLIO
// GET /api/gold/portfolio/:username
// Protected Route
// ======================================================

router.get("/portfolio/:username", verifyToken, getPortfolio);

// ======================================================
// MY PORTFOLIO
// GET /api/gold/my-portfolio
// Protected Route
// ======================================================

router.get("/my-portfolio", verifyToken, async (req, res) => {
  try {
    // verifyToken middleware se username milta hai
    req.params.username = req.user.username;

    return getPortfolio(req, res);
  } catch (error) {
    console.error("MY PORTFOLIO ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================================
// GET USER GOLD BALANCE
// GET /api/gold/balance
// Protected Route
// ======================================================

router.get("/balance", verifyToken, async (req, res) => {
  try {
    const User = require("../models/User");

    const user = await User.findById(req.user.id).select(
      "wallet goldBalance pkrBalance usdtBalance username"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      wallet: user.wallet || 0,
      goldBalance: user.goldBalance || 0,
      pkrBalance: user.pkrBalance || 0,
      usdtBalance: user.usdtBalance || 0,
      username: user.username,
    });
  } catch (error) {
    console.error("GOLD BALANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================================
// GOLD HISTORY
// GET /api/gold/history/:username
// Protected Route
// ======================================================

router.get("/history/:username", verifyToken, getGoldHistory);

// ======================================================
// MY GOLD HISTORY
// GET /api/gold/my-history
// Protected Route
// ======================================================

router.get("/my-history", verifyToken, async (req, res) => {
  try {
    req.params.username = req.user.username;
    return getGoldHistory(req, res);
  } catch (error) {
    console.error("MY HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================================
// ADMIN DASHBOARD
// GET /api/gold/admin/dashboard
// Admin Only
// ======================================================

router.get(
  "/admin/dashboard",
  verifyToken,
  isAdmin,
  getAdminDashboard
);

// ======================================================
// UPDATE GOLD SETTINGS
// PUT /api/gold/admin/settings
// Admin Only
// ======================================================

router.put(
  "/admin/settings",
  verifyToken,
  isAdmin,
  updateSettings
);

// ======================================================
// GET ADMIN SETTINGS
// GET /api/gold/admin/settings
// Admin Only
// ======================================================

router.get(
  "/admin/settings",
  verifyToken,
  isAdmin,
  getSettings
);

// ======================================================
// MARKET STATUS
// GET /api/gold/market-status
// ======================================================

router.get("/market-status", async (req, res) => {
  try {
    const Settings = require("../models/Settings");

    const settings = await Settings.findOne();

    if (!settings) {
      return res.json({
        success: true,
        marketStatus: "OPEN",
        tradingEnabled: true,
      });
    }

    return res.json({
      success: true,
      marketStatus: settings.marketStatus || "OPEN",
      tradingEnabled:
        settings.goldTradingEnabled === undefined
          ? true
          : settings.goldTradingEnabled,
    });
  } catch (error) {
    console.error("MARKET STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================================
// GOLD STATS
// GET /api/gold/stats
// ======================================================

router.get("/stats", verifyToken, async (req, res) => {
  try {
    const User = require("../models/User");
    const GoldTrade = require("../models/GoldTrade");

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const totalTrades = await GoldTrade.countDocuments({
      userId: user._id,
    });

    const buyTrades = await GoldTrade.countDocuments({
      userId: user._id,
      type: "BUY",
    });

    const sellTrades = await GoldTrade.countDocuments({
      userId: user._id,
      type: "SELL",
    });

    const settings = await require("../models/Settings").findOne();

    const portfolioValue =
      (user.goldBalance || 0) * (settings?.sellGoldPrice || 0);

    return res.json({
      success: true,
      stats: {
        wallet: user.wallet || 0,
        goldBalance: user.goldBalance || 0,
        portfolioValue,
        totalTrades,
        buyTrades,
        sellTrades,
      },
    });
  } catch (error) {
    console.error("GOLD STATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================================
// REFRESH GOLD PRICE
// GET /api/gold/refresh-price
// ======================================================

router.get("/refresh-price", async (req, res) => {
  try {
    return getGoldPrice(req, res);
  } catch (error) {
    console.error("REFRESH PRICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================================
// ADMIN TEST ROUTE
// GET /api/gold/admin/ping
// ======================================================

router.get("/admin/ping", verifyToken, isAdmin, (req, res) => {
  return res.json({
    success: true,
    message: "Gold Admin API Working",
    admin: req.user.username,
    role: req.user.role,
  });
});

// ======================================================
// 404 HANDLER
// ======================================================

router.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Gold API route not found.",
  });
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;