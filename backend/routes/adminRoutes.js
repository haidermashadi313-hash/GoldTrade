const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");
const Transaction = require("../models/Transaction");

// ==============================
// ADMIN DASHBOARD ANALYTICS
// ==============================
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalDeposits = await Deposit.aggregate([
      { $match: { status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalWithdraws = await Withdraw.aggregate([
      { $match: { status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const pendingDeposits = await Deposit.countDocuments({
      status: "Pending",
    });

    const pendingWithdraws = await Withdraw.countDocuments({
      status: "Pending",
    });

    const walletBalance = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$walletBalance" } } },
    ]);

    const usdtBalance = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$usdtBalance" } } },
    ]);

    const latestTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDeposits: totalDeposits[0]?.total || 0,
        totalWithdraws: totalWithdraws[0]?.total || 0,
        pendingDeposits,
        pendingWithdraws,
        walletBalance: walletBalance[0]?.total || 0,
        usdtBalance: usdtBalance[0]?.total || 0,
        latestTransactions,
      },
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Analytics failed.",
    });
  }
});

module.exports = router;