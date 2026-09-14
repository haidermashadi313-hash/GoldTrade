const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Deposit = require("../models/Deposit");
const User = require("../models/User");

// Auth Middleware
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// ===========================================
// CREATE DEPOSIT
// POST /api/deposit
// ===========================================
router.post("/", verifyToken, async (req, res) => {
  try {
    const { amount, walletType, transactionId, screenshot } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Deposit amount is required.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const deposit = await Deposit.create({
      userId: user._id,
      amount: Number(amount),
      walletType: walletType || "USDT",
      transactionId: transactionId || "",
      screenshot: screenshot || "",
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Deposit submitted successfully.",
      deposit,
    });
  } catch (error) {
    console.error("CREATE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});
// ===========================================
// ADMIN APPROVE DEPOSIT
// PUT /api/deposit/admin/:id/approve
// ===========================================

router.put("/admin/:id/approve", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    if (deposit.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Deposit already approved.",
      });
    }

    const user = await User.findById(deposit.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Admin can approve custom amount
    const approvedAmount =
      Number(req.body.approvedAmount) || Number(deposit.amount);

    // Credit Wallet
    const previousBalance = Number(user.balance || user.walletBalance || 0);
    const newBalance = previousBalance + approvedAmount;

    user.balance = newBalance;
    if ("walletBalance" in user) {
      user.walletBalance = newBalance;
    }

    await user.save();

    // Update Deposit
    deposit.status = "Approved";
    deposit.approvedAmount = approvedAmount;
    deposit.approvedBy = req.user._id;
    deposit.approvedAt = new Date();

    await deposit.save();

    return res.status(200).json({
      success: true,
      message: "Deposit approved successfully.",
      deposit,
      previousBalance,
      newBalance,
    });

  } catch (error) {
    console.error("APPROVE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});
// ===========================================
// ADMIN REJECT DEPOSIT
// PUT /api/deposit/admin/:id/reject
// ===========================================

router.put("/admin/:id/reject", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    if (deposit.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Approved deposit cannot be rejected.",
      });
    }

    deposit.status = "Rejected";
    deposit.rejectedReason = req.body.reason || "Rejected by admin";
    deposit.rejectedBy = req.user._id;
    deposit.rejectedAt = new Date();

    await deposit.save();

    return res.status(200).json({
      success: true,
      message: "Deposit rejected successfully.",
      deposit,
    });

  } catch (error) {
    console.error("REJECT DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});
// ===========================================
// EXPORT ROUTER
// ===========================================
module.exports = router;