"use strict";

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

console.log("USDT ROUTES LOADED");

// =====================================================
// MODELS
// =====================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const UsdtOrder = require("../models/UsdtOrder");
const Transaction = require("../models/Transaction");
const UsdtSettings = require("../models/UsdtSettings");

// =====================================================
// MIDDLEWARE
// =====================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDir = path.join(__dirname, "../uploads/usdt");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),

  filename: (req, file, cb) => {
    const filename =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1000000) +
      path.extname(file.originalname);

    cb(null, filename);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG and WEBP images are allowed.")
      );
    }

    cb(null, true);
  },
});

// =====================================================
// DEFAULT USDT SETTINGS
// =====================================================

const USDT_RATE = 280;

// =====================================================
// GET LIVE USDT RATE
// GET /api/usdt/rate
// PUBLIC ROUTE
// =====================================================

router.get("/rate", async (req, res) => {
  try {
    console.log("USDT RATE ROUTE HIT");

    let settings = await UsdtSettings.findOne();

    if (!settings) {
      settings = new UsdtSettings({
        buyRate: USDT_RATE,
        sellRate: USDT_RATE,
        marketStatus: "OPEN",
      });

      await settings.save();
    }

    return res.json({
      success: true,
      currency: "PKR",

      rate: Number(settings.buyRate),
      buyRate: Number(settings.buyRate),
      sellRate: Number(settings.sellRate),

      marketStatus: settings.marketStatus || "OPEN",
      updatedAt: settings.updatedAt || new Date(),
    });
  } catch (err) {
    console.error("USDT RATE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT rate.",
      error: err.message,
    });
  }
});

// =====================================================
// BACKWARD COMPATIBILITY
// GET /api/usdt/price
// =====================================================

router.get("/price", async (req, res) => {
  try {
    const settings = await UsdtSettings.findOne();

    return res.json({
      success: true,
      currency: "PKR",
      rate: Number(settings?.buyRate || DEFAULT_USDT_RATE),
      buyRate: Number(settings?.buyRate || DEFAULT_USDT_RATE),
      sellRate: Number(settings?.sellRate || DEFAULT_USDT_RATE),
      updatedAt: settings?.updatedAt || new Date(),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Unable to load USDT price.",
      error: err.message,
    });
  }
});

// =====================================================
// GET USDT SETTINGS
// GET /api/usdt/settings
// ADMIN ONLY
// =====================================================

router.get("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    console.log("USDT SETTINGS ROUTE HIT");

    let settings = await UsdtSettings.findOne();

    if (!settings) {
      settings = new UsdtSettings({
        buyRate: DEFAULT_USDT_RATE,
        sellRate: DEFAULT_USDT_RATE,
        marketStatus: "OPEN",
      });

      await settings.save();
    }

    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error("GET USDT SETTINGS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT settings.",
      error: err.message,
    });
  }
});
// =====================================================
// ADMIN USDT DASHBOARD
// GET /api/usdt/admin/dashboard
// =====================================================

router.get("/admin/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.countDocuments();

    const wallets = await Wallet.find();

    let totalUsdtBalance = 0;
    let totalPkrBalance = 0;

    wallets.forEach((wallet) => {
      totalUsdtBalance += Number(wallet.usdtBalance || 0);
      totalPkrBalance += Number(wallet.pkrBalance || 0);
    });

    const pendingBuy = await UsdtOrder.countDocuments({
      type: "buy",
      status: "pending",
    });

    const pendingSell = await UsdtOrder.countDocuments({
      type: "sell",
      status: "pending",
    });

    const completedOrders = await UsdtOrder.countDocuments({
      status: "completed",
    });

    const totalVolumeAgg = await UsdtOrder.aggregate([
      {
        $group: {
          _id: null,
          volume: { $sum: "$amount" },
        },
      },
    ]);

    const totalVolume =
      totalVolumeAgg.length > 0 ? totalVolumeAgg[0].volume : 0;

    return res.json({
      success: true,

      dashboard: {
        totalUsers: users,

        walletBalance: totalPkrBalance,

        usdtBalance: totalUsdtBalance,

        usdtRate: USDT_RATE,

        buyRate: USDT_RATE,

        sellRate: USDT_RATE,

        pendingBuyOrders: pendingBuy,

        pendingSellOrders: pendingSell,

        completedOrders,

        usdtVolume: totalVolume,

        portfolioValue: totalUsdtBalance * USDT_RATE,
      },
    });
  } catch (error) {
    console.error("USDT ADMIN DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard.",
      error: error.message,
    });
  }
});
// =====================================================
// ADMIN UPDATE USDT RATE
// PUT /api/usdt/settings
// ADMIN ONLY
// =====================================================

router.put("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    console.log("UPDATE USDT SETTINGS ROUTE HIT");

    const {
      buyRate,
      sellRate,
      marketStatus,
    } = req.body;

    let settings = await UsdtSettings.findOne();

    if (!settings) {
      settings = new UsdtSettings();
    }

    if (buyRate !== undefined)
      settings.buyRate = Number(buyRate);

    if (sellRate !== undefined)
      settings.sellRate = Number(sellRate);

    if (marketStatus)
      settings.marketStatus = marketStatus;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "USDT settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error("UPDATE USDT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update USDT settings.",
      error: error.message,
    });
  }
});
// =====================================================
// BUY USDT
// POST /api/usdt/buy
// USER ONLY
// =====================================================

router.post("/buy", verifyToken, async (req, res) => {
  try {
    console.log("BUY USDT ROUTE HIT");

    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid USDT amount.",
      });
    }

    const settings = await UsdtSettings.findOne();

    const buyRate = Number(settings?.buyRate || USDT_RATE);
    const totalPKR = Number(amount) * buyRate;

    const wallet = await Wallet.findOne({ username: req.user.username });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (Number(wallet.pkrBalance || 0) < totalPKR) {
      return res.status(400).json({
        success: false,
        message: "Insufficient PKR balance.",
      });
    }

    wallet.pkrBalance -= totalPKR;
    wallet.usdtBalance += Number(amount);

    await wallet.save();

    const order = await UsdtOrder.create({
      username: req.user.username,
      type: "BUY",
      amount: Number(amount),
      rate: buyRate,
      total: totalPKR,
      status: "Completed",
    });

    await WalletTransaction.create({
      username: req.user.username,
      type: "BUY_USDT",
      currency: "USDT",
      amount: Number(amount),
      rate: buyRate,
      total: totalPKR,
      status: "Completed",
    });

    return res.json({
      success: true,
      message: "USDT purchased successfully.",
      order,
      balances: {
        pkrBalance: wallet.pkrBalance,
        usdtBalance: wallet.usdtBalance,
      },
    });
  } catch (error) {
    console.error("BUY USDT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to buy USDT.",
      error: error.message,
    });
  }
});

// =====================================================
// SELL USDT
// POST /api/usdt/sell
// USER ONLY
// =====================================================

router.post("/sell", verifyToken, async (req, res) => {
  try {
    console.log("SELL USDT ROUTE HIT");

    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid USDT amount.",
      });
    }

    const settings = await UsdtSettings.findOne();

    const sellRate = Number(settings?.sellRate || USDT_RATE);
    const totalPKR = Number(amount) * sellRate;

    const wallet = await Wallet.findOne({ username: req.user.username });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (Number(wallet.usdtBalance || 0) < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient USDT balance.",
      });
    }

    wallet.usdtBalance -= Number(amount);
    wallet.pkrBalance += totalPKR;

    await wallet.save();

    const order = await UsdtOrder.create({
      username: req.user.username,
      type: "SELL",
      amount: Number(amount),
      rate: sellRate,
      total: totalPKR,
      status: "Completed",
    });

    await WalletTransaction.create({
      username: req.user.username,
      type: "SELL_USDT",
      currency: "USDT",
      amount: Number(amount),
      rate: sellRate,
      total: totalPKR,
      status: "Completed",
    });

    return res.json({
      success: true,
      message: "USDT sold successfully.",
      order,
      balances: {
        pkrBalance: wallet.pkrBalance,
        usdtBalance: wallet.usdtBalance,
      },
    });
  } catch (error) {
    console.error("SELL USDT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to sell USDT.",
      error: error.message,
    });
  }
});

// =====================================================
// USER USDT HISTORY
// GET /api/usdt/history/:username
// USER / ADMIN
// =====================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username;

    if (
      req.user.role !== "admin" &&
      req.user.username !== username
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const history = await UsdtOrder.find({ username })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("USDT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT history.",
      error: error.message,
    });
  }
});
// =====================================================
// USER USDT PORTFOLIO
// GET /api/usdt/portfolio/:username
// USER / ADMIN
// =====================================================

router.get("/portfolio/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username;

    if (
      req.user.role !== "admin" &&
      req.user.username !== username
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const wallet = await Wallet.findOne({ username });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const settings = await UsdtSettings.findOne();

    const buyRate = Number(settings?.buyRate || USDT_RATE);
    const sellRate = Number(settings?.sellRate || USDT_RATE);

    const usdtBalance = Number(wallet.usdtBalance || 0);

    return res.status(200).json({
      success: true,

      portfolio: {
        username,
        usdtBalance,
        pkrBalance: Number(wallet.pkrBalance || 0),

        buyRate,
        sellRate,

        portfolioValue: usdtBalance * USDT_RATE,
      },
    });

  } catch (error) {
    console.error("USDT PORTFOLIO ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load portfolio.",
      error: error.message,
    });
  }
});

// =====================================================
// ADMIN ALL USDT ORDERS
// GET /api/usdt/orders
// ADMIN ONLY
// =====================================================

router.get("/orders", verifyToken, isAdmin, async (req, res) => {
  try {
    const orders = await UsdtOrder.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: orders.length,
      orders,
    });

  } catch (error) {
    console.error("USDT ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT orders.",
      error: error.message,
    });
  }
});

// =====================================================
// ADMIN DELETE USDT ORDER
// DELETE /api/usdt/order/:id
// ADMIN ONLY
// =====================================================

router.delete("/order/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const order = await UsdtOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    await order.deleteOne();

    return res.status(200).json({
      success: true,
      message: "USDT order deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE USDT ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete USDT order.",
      error: error.message,
    });
  }
});

// =====================================================
// ADMIN HEALTH CHECK
// GET /api/usdt/health
// =====================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "USDT",
    version: "GoldTrade V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;