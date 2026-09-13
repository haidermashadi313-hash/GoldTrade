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

// =============================================
// ADMIN DASHBOARD STATS
// GET /api/admin/dashboard
// =============================================

router.get("/dashboard", verifyToken, adminOnly, async (req, res) => {
  try {
    const [
      totalUsers,
      pendingDeposits,
      approvedDeposits,
      pendingWithdraws,
      approvedWithdraws,
      totalDeposits,
      totalWithdraws,
      pendingUSDT,
      completedTransactions,
    ] = await Promise.all([
      User.countDocuments(),
      Deposit.countDocuments({ status: "Pending" }),
      Deposit.countDocuments({ status: "Approved" }),
      Withdraw.countDocuments({ status: "Pending" }),
      Withdraw.countDocuments({ status: "Approved" }),

      Deposit.aggregate([
        { $match: { status: "Approved" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),

      Withdraw.aggregate([
        { $match: { status: "Approved" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),

      USDTTransaction.countDocuments({ status: "Pending" }),
      Transaction.countDocuments(),
    ]);

    const latestTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,

      stats: {
        totalUsers,

        pendingDeposits,
        approvedDeposits,

        pendingWithdraws,
        approvedWithdraws,

        pendingUSDT,

        totalDepositAmount: totalDeposits[0]?.total || 0,
        totalWithdrawAmount: totalWithdraws[0]?.total || 0,

        completedTransactions,
      },

      latestTransactions,
    });
  } catch (err) {
    console.error("Admin Dashboard Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load dashboard.",
    });
  }
});

// =============================================
// RECENT ACTIVITY
// GET /api/admin/dashboard/activity
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
// GET /api/admin/dashboard/users
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