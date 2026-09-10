const express = require("express");
const router = express.Router();

const Withdraw = require("../models/Withdraw");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const WalletTransaction = require("../models/WalletTransaction");

const { verifyToken } = require("../middleware/authMiddleware");

// =======================================
// GET ALL WITHDRAW REQUESTS (ADMIN)
// =======================================
router.get("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    const withdraws = await Withdraw.find()
      .sort({ createdAt: -1 })
      .populate("userId", "username email walletBalance");

    res.json({
      success: true,
      withdraws,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================================
// APPROVE WITHDRAW (DEBIT WALLET)
// =======================================
router.post("/approve/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    const { amount, reason } = req.body;

    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Withdraw already processed.",
      });
    }

    const user = await User.findById(withdraw.userId);

    const debitAmount = Number(amount);

    if (user.walletBalance < debitAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    const previousBalance = user.walletBalance;
    const newBalance = previousBalance - debitAmount;

    user.walletBalance = newBalance;
    user.totalWithdraw += debitAmount;

    await user.save();

    withdraw.status = "Approved";
    withdraw.approvedAmount = debitAmount;
    withdraw.approvedBy = req.user._id;
    withdraw.reason = reason;
    withdraw.approvedAt = new Date();

    await withdraw.save();

    await WalletTransaction.create({
      user: user._id,
      admin: req.user._id,
      walletType: "PKR",
      action: "debit",
      amount: debitAmount,
      previousBalance,
      newBalance,
      reason,
    });

    await Transaction.create({
      userId: user._id,
      username: user.username,
      type: "Withdraw Debit",
      amount: debitAmount,
      status: "Completed",
      description: reason,
    });

    res.json({
      success: true,
      message: "Withdraw approved successfully.",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================================
// REJECT WITHDRAW
// =======================================
router.post("/reject/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    withdraw.status = "Rejected";
    withdraw.rejectedBy = req.user._id;
    withdraw.rejectedAt = new Date();

    await withdraw.save();

    res.json({
      success: true,
      message: "Withdraw rejected successfully.",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;