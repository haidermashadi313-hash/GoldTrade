const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");
const GoldTransaction = require("../models/GoldTransaction");

// ==========================================
// ADMIN DASHBOARD STATS
// GET /api/admin/dashboard
// ==========================================
router.get("/", async (req, res) => {
  try {
    // Total registered users
    const totalUsers = await User.countDocuments();

    // Pending deposits
    const pendingDeposits = await Deposit.countDocuments({
      status: "Pending",
    });

    // Pending withdrawals
    const pendingWithdrawals = await Withdraw.countDocuments({
      status: "Pending",
    });

    // Gold trades completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const goldTradesToday = await GoldTransaction.countDocuments({
      createdAt: { $gte: today },
    });

    // ==========================================
    // WALLET BALANCE (Total PKR in all user wallets)
    // ==========================================

    const walletResult = await User.aggregate([
      {
        $group: {
          _id: null,
          totalWalletBalance: {
            $sum: { $ifNull: ["$walletBalance", 0] },
          },
        },
      },
    ]);

    const walletBalance =
      walletResult.length > 0
        ? walletResult[0].totalWalletBalance
        : 0;

    // ==========================================
    // USDT EXCHANGE VOLUME
    // ==========================================

    const usdtResult = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsdtVolume: {
            $sum: { $ifNull: ["$usdtBalance", 0] },
          },
        },
      },
    ]);

    const usdtVolume =
      usdtResult.length > 0
        ? usdtResult[0].totalUsdtVolume
        : 0;

    // ==========================================
    // SEND DASHBOARD DATA
    // ==========================================

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        pendingDeposits,
        pendingWithdrawals,
        goldTradesToday,
        walletBalance,
        usdtVolume,
      },
    });

  } catch (error) {
    console.error("Admin Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard.",
      error: error.message,
    });
  }
});

module.exports = router;