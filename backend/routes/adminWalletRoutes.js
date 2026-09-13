const express = require("express");
const router = express.Router();

const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const Transaction = require("../models/Transaction");
const { verifyToken } = require("../middleware/authMiddleware");

// ======================================================
// GET ALL USERS WITH WALLET BALANCES
// ======================================================

router.get("/users", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const users = await User.find()
      .select(
        "username email role status walletBalance usdtBalance goldBalance totalDeposit totalWithdraw createdAt"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ======================================================
// GET SINGLE USER WALLET
// ======================================================

router.get("/user/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ======================================================
// CREDIT / DEBIT WALLET
// ======================================================

router.post("/update", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const {
      userId,
      walletType,
      action,
      amount,
      reason,
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const value = Number(amount);

    if (!value || value <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount.",
      });
    }

    let previousBalance = 0;
    let newBalance = 0;

    // Wallet selection
    if (walletType === "PKR") {
      previousBalance = Number(user.walletBalance || 0);
    }

    if (walletType === "USDT") {
      previousBalance = Number(user.usdtBalance || 0);
    }

    if (walletType === "GOLD") {
      previousBalance = Number(user.goldBalance || 0);
    }

    // Debit Validation
    if (action === "debit" && value > previousBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    // Credit / Debit Logic
    if (action === "credit") {
      newBalance = previousBalance + value;
    } else {
      newBalance = previousBalance - value;
    }    // ================= SAVE NEW BALANCE =================

    switch (walletType) {
      case "PKR":
        user.walletBalance = newBalance;
        break;

      case "USDT":
        user.usdtBalance = newBalance;
        break;

      case "GOLD":
        user.goldBalance = newBalance;
        break;
    }

    await user.save();

    // ================= WALLET HISTORY =================

    await WalletTransaction.create({
      user: user._id,
      admin: req.user._id,
      walletType,
      action,
      amount: value,
      previousBalance,
      newBalance,
      reason: reason || "Manual wallet update by Admin",
    });

    // ================= TRANSACTION HISTORY =================

    await Transaction.create({
      userId: user._id,
      username: user.username,
      type:
        action === "credit"
          ? `${walletType} Wallet Credit`
          : `${walletType} Wallet Debit`,
      amount: value,
      status: "Completed",
      description:
        reason || `Manual ${action} by Admin (${walletType})`,
    });

    // ================= RESPONSE =================

    res.json({
      success: true,
      message: `${walletType} wallet ${action} successful.`,
      walletType,
      action,
      previousBalance,
      newBalance,
      user: {
        username: user.username,
        walletBalance: user.walletBalance,
        usdtBalance: user.usdtBalance,
        goldBalance: user.goldBalance,
      },
    });

  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ======================================================
// WALLET TRANSACTION HISTORY
// ======================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const history = await WalletTransaction.find()
      .populate("user", "username email")
      .populate("admin", "username")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      history,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ======================================================
// USER WALLET HISTORY
// ======================================================

router.get("/history/:userId", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const history = await WalletTransaction.find({
      user: req.params.userId,
    })
      .populate("admin", "username")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      history,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;