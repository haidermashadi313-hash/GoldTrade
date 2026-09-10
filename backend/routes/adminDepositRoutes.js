const express = require("express");
const router = express.Router();

const Deposit = require("../models/Deposit");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { verifyToken } = require("../middleware/authMiddleware");

// =============================
// GET ALL DEPOSITS (ADMIN)
// =============================
router.get("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const deposits = await Deposit.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      deposits,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to load deposits.",
    });
  }
});

// =============================
// APPROVE DEPOSIT
// =============================
router.put("/approve/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    if (deposit.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Deposit already processed.",
      });
    }

    const user = await User.findById(deposit.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Wallet Credit
    user.walletBalance += deposit.amount;
    user.totalDeposit += deposit.amount;

    await user.save();

    deposit.status = "Approved";
    await deposit.save();

    // Transaction Entry
    await Transaction.create({
      userId: user._id,
      username: user.username,
      type: "Deposit",
      amount: deposit.amount,
      status: "Approved",
      description: "USDT Deposit Approved",
    });

    res.json({
      success: true,
      message: "Deposit Approved Successfully.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Approval failed.",
    });
  }
});

// =============================
// REJECT DEPOSIT
// =============================
router.put("/reject/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    deposit.status = "Rejected";
    await deposit.save();

    res.json({
      success: true,
      message: "Deposit Rejected.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Reject failed.",
    });
  }
});

module.exports = router;