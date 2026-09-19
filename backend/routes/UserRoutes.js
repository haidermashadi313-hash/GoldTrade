"use strict";

const express = require("express");
const router = express.Router();

// ================= MODELS =================
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

// ================= MIDDLEWARE =================
const { verifyToken, isAdmin } = require("../middleware/auth");

// =======================================
// GET ALL USERS
// GET /api/users
// =======================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -sessions -loginHistory")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      totalUsers: users.length,
      users,
    });
  } catch (err) {
    console.error("GET USERS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
});

// =======================================
// GET USER BY USERNAME
// GET /api/users/:username
// =======================================

router.get("/:username", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase(),
    }).select("-password -sessions");

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
    console.error("GET USER ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

// =======================================
// ADMIN UPDATE WALLET
// PUT /api/users/:id/wallet
// =======================================

router.put("/:id/wallet", verifyToken, isAdmin, async (req, res) => {
  try {
    const { walletType, action, amount, reason } = req.body;

    const wallet = await Wallet.findOne({ userId: req.params.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const value = Number(amount);

    if (isNaN(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount.",
      });
    }

    if (!["PkrBalance", "UsdtBalance", "goldBalance"].includes(walletType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet type.",
      });
    }

    if (action === "add") {
      wallet[walletType] += value;
    } else if (action === "deduct") {
      if (wallet[walletType] < value) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance.",
        });
      }

      wallet[walletType] -= value;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action.",
      });
    }

    await wallet.save();

    const user = await User.findById(req.params.id);

    await Transaction.create({
      userId: user._id,
      username: user.username,
      wallet: walletType,
      type: action === "add" ? "CREDIT" : "DEBIT",
      amount: value,
      status: "Completed",
      note: reason || "Admin Wallet Update",
    });

    res.json({
      success: true,
      message: "Wallet updated successfully.",
      wallet,
    });
  } catch (err) {
    console.error("UPDATE WALLET ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});// =======================================
// BLOCK / UNBLOCK USER
// PUT /api/users/:id/status
// =======================================

router.put("/:id/status", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["ACTIVE", "SUSPENDED", "BLOCKED", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: status },
      { new: true }
    ).select("-password -sessions");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: `User status updated to ${status}.`,
      user,
    });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================================
// CHANGE USER ROLE
// PUT /api/users/:id/role
// =======================================

router.put("/:id/role", verifyToken, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!["USER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password -sessions");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: `Role updated to ${role}.`,
      user,
    });
  } catch (err) {
    console.error("UPDATE ROLE ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================================
// DELETE USER
// DELETE /api/users/:id
// =======================================

router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Super Admin account cannot be deleted.",
      });
    }

    await Wallet.findOneAndDelete({ userId: user._id });
    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (err) {
    console.error("DELETE USER ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================================
// USER TRANSACTION HISTORY
// GET /api/users/:username/history
// =======================================

router.get("/:username/history", verifyToken, async (req, res) => {
  try {
    const history = await Transaction.find({
      username: req.params.username.toLowerCase(),
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      total: history.length,
      history,
    });
  } catch (err) {
    console.error("USER HISTORY ERROR:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================================
// HEALTH CHECK
// GET /api/users/health
// =======================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "User Routes Working - GoldTrade V18",
    version: "V18",
  });
});

// =======================================
// EXPORT ROUTER (Linux + Render Safe)
// =======================================

module.exports = router;