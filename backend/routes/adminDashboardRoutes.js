"use strict";

const express = require("express");
const router = express.Router();

// =====================================================
// MODELS
// =====================================================

const User = require("../models/User");
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");
const Transaction = require("../models/Transaction");
const GoldTrade = require("../models/GoldTrade");
const UsdtTransaction = require("../models/UsdtTransaction");

// =====================================================
// MIDDLEWARE
// =====================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// ADMIN DASHBOARD SUMMARY
// GET /api/admin/dashboard
// =====================================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const activeUsers = await User.countDocuments({
      status: "Active",
    });

    const pendingDeposits = await Deposit.countDocuments({
      status: "Pending",
    });

    const pendingWithdrawals = await Withdraw.countDocuments({
      status: "Pending",
    });

    const totalDeposits = await Deposit.aggregate([
      { $match: { status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalWithdraws = await Withdraw.aggregate([
      { $match: { status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$requestAmount" } } },
    ]);

    const totalGoldTrades = await GoldTrade.countDocuments();

    const totalUsdtTransactions =
      await UsdtTransaction.countDocuments();

    res.json({
      success: true,
      dashboard: {
        totalUsers,
        activeUsers,
        pendingDeposits,
        pendingWithdrawals,
        totalGoldTrades,
        totalUsdtTransactions,
        totalDepositAmount: totalDeposits[0]?.total || 0,
        totalWithdrawAmount: totalWithdraws[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load dashboard.",
    });
  }
});
// =====================================================
// RECENT ACTIVITY
// GET /api/admin/dashboard/activity
// =====================================================

router.get(
  "/activity",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const deposits = await Deposit.find()
        .sort({ createdAt: -1 })
        .limit(5);

      const withdrawals = await Withdraw.find()
        .sort({ createdAt: -1 })
        .limit(5);

      const usdtTransactions = await UsdtTransaction.find()
        .sort({ createdAt: -1 })
        .limit(5);

      const GoldTrades = await GoldTrade.find()
        .sort({ createdAt: -1 })
        .limit(5);

      res.json({
        success: true,
        activity: {
          deposits,
          withdrawals,
          usdtTransactions,
          GoldTrades,
        },
      });
    } catch (error) {
      console.error("RECENT ACTIVITY ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load recent activity.",
      });
    }
  }
);

// =====================================================
// ALL USERS SUMMARY
// GET /api/admin/dashboard/users
// =====================================================

router.get(
  "/users",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const users = await User.find()
        .select(
          "username email WalletBalance UsdtBalance goldBalance createdAt status role"
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        total: users.length,
        users,
      });
    } catch (error) {
      console.error("USERS SUMMARY ERROR:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load users.",
      });
    }
  }
);

// =====================================================
// HEALTH CHECK
// GET /api/admin/dashboard/health
// =====================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Admin Dashboard Routes Working - GoldTrade V18",
    version: "V18 Enterprise",
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;