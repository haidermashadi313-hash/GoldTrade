const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");
const Transaction = require("../models/Transaction");
const GoldOrder = require("../models/GoldOrder");
const USDTTransaction = require("../models/USDTTransaction");

const { verifyToken } = require("../middleware/authMiddleware");

// =============================================
// ADMIN ONLY MIDDLEWARE
// =============================================

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }

  next();
};

// =====================================================
// ADMIN DASHBOARD SUMMARY
// GET /api/gold/admin/dashboard
// =====================================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const User = require("../models/User");
    const Deposit = require("../models/Deposit");
    const Withdraw = require("../models/Withdraw");
    const GoldTrade = require("../models/GoldTrade");

    const totalUsers = await User.countDocuments();

    const pendingDeposits = await Deposit.countDocuments({
      status: "Pending",
    });

    const pendingWithdrawals = await Withdraw.countDocuments({
      status: "Pending",
    });

    const goldTradesToday = await GoldTrade.countDocuments();

    const usdtVolume = 0;
    const walletBalance = 0;

    return res.status(200).json({
      success: true,
      dashboard: {
        totalUsers,
        pendingDeposits,
        pendingWithdrawals,
        goldTradesToday,
        usdtVolume,
        walletBalance,
      },
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard.",
    });
  }
});

// =============================================
// RECENT ACTIVITY
// GET /api/gold/admin/dashboard/activity
// =============================================

router.get(
  "/dashboard/activity",
  verifyToken,
  adminOnly,
  async (req, res) => {
    try {
      const deposits = await Deposit.find()
        .sort({ createdAt: -1 })
        .limit(5);

      const withdraws = await Withdraw.find()
        .sort({ createdAt: -1 })
        .limit(5);

      const usdt = await USDTTransaction.find()
        .sort({ createdAt: -1 })
        .limit(5);

      const goldOrders = await GoldOrder.find()
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,

        activity: {
          deposits,
          withdraws,
          usdt,
          goldOrders,
        },
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Unable to load recent activity.",
      });
    }
  }
);

// =============================================
// ALL USERS SUMMARY
// GET /api/gold/admin/dashboard/users
// =============================================

router.get(
  "/dashboard/users",
  verifyToken,
  adminOnly,
  async (req, res) => {
    try {
      const users = await User.find()
        .select(
          "username email walletBalance usdtBalance goldBalance createdAt status role"
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        total: users.length,
        users,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Unable to load users.",
      });
    }
  }
);

module.exports = router;