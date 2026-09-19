"use strict";

const express = require("express");
const router = express.Router();

// =====================================================
// MODELS
// =====================================================

const User = require("../models/User");
const GoldTransaction = require("../models/GoldTransaction");
const WalletTransaction = require("../models/WalletTransaction");
const Settings = require("../models/Settings");
const GoldTrade = require("../models/GoldTrade");
const Transaction = require("../models/Transaction");

// =====================================================
// MIDDLEWARE
// =====================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// GET ALL USERS
// GET /api/admin/users
// =====================================================

router.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.status === "Active").length,
        blockedUsers: users.filter((u) => u.status === "Blocked").length,
        suspendedUsers: users.filter((u) => u.status === "Suspended").length,
      },
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load users.",
    });
  }
});

// =====================================================
// GET USER PROFILE
// GET /api/admin/profile/:id
// =====================================================

router.get("/profile/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const goldHistory = await GoldTransaction.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const walletHistory = await WalletTransaction.find({
      username: user.username,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      profile: user,
      goldHistory,
      walletHistory,
    });
  } catch (error) {
    console.error("PROFILE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load profile.",
    });
  }
});
// =====================================================
// BLOCK / UNBLOCK USER
// PUT /api/admin/block/:id
// =====================================================

router.put("/block/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.status = user.status === "Active" ? "Blocked" : "Active";
    await user.save();

    res.json({
      success: true,
      message: `User ${user.status} successfully.`,
      status: user.status,
    });
  } catch (error) {
    console.error("BLOCK USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update user status.",
    });
  }
});

// =====================================================
// FREEZE / UNFREEZE WALLET
// PUT /api/admin/freeze/:id
// =====================================================

router.put("/freeze/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isWalletFrozen = !user.isWalletFrozen;
    await user.save();

    res.json({
      success: true,
      message: user.isWalletFrozen
        ? "Wallet frozen successfully."
        : "Wallet unfrozen successfully.",
      walletFrozen: user.isWalletFrozen,
    });
  } catch (error) {
    console.error("FREEZE WALLET ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update wallet status.",
    });
  }
});

// =====================================================
// DELETE USER
// DELETE /api/admin/delete/:id
// =====================================================

router.delete("/delete/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin account cannot be deleted.",
      });
    }

    await User.findByIdAndDelete(user._id);

    res.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete user.",
    });
  }
});

// =====================================================
// SEARCH USERS
// GET /api/admin/search?q=hashi
// =====================================================

router.get("/search", verifyToken, isAdmin, async (req, res) => {
  try {
    const keyword = req.query.q || "";

    const users = await User.find({
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
    }).select("-password");

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("SEARCH USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Search failed.",
    });
  }
});

// =====================================================
// UPDATE GOLD MARKET SETTINGS (ONLY ONE ROUTE)
// PUT /api/admin/gold/settings
// =====================================================

router.put("/gold/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    settings.buyGoldPrice = Number(req.body.buyGoldPrice || 0);
    settings.sellGoldPrice = Number(req.body.sellGoldPrice || 0);
    settings.goldPriceUSD = Number(req.body.goldPriceUSD || 0);
    settings.usdToPkr = Number(req.body.usdToPkr || 0);
    settings.goldTradingEnabled =
      req.body.goldTradingEnabled === true ||
      req.body.goldTradingEnabled === "true";
    settings.marketStatus = req.body.marketStatus || "OPEN";

    await settings.save();

    res.json({
      success: true,
      message: "Gold market settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error("GOLD SETTINGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update Gold market settings.",
    });
  }
});

// =====================================================
// ADMIN GOLD WALLET CREDIT / DEBIT
// PUT /api/admin/gold/wallet/:id
// =====================================================

router.put("/gold/wallet/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { amount, action, reason } = req.body;

    const grams = Number(amount);

    if (!grams || grams <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gold amount.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (action === "credit") {
      user.goldBalance += grams;
    } else if (action === "debit") {
      if (user.goldBalance < grams) {
        return res.status(400).json({
          success: false,
          message: "Insufficient Gold balance.",
        });
      }

      user.goldBalance -= grams;
    } else {
      return res.status(400).json({
        success: false,
        message: "Action must be credit or debit.",
      });
    }

    await user.save();

    await GoldTrade.create({
      userId: user._id,
      username: user.username,
      type: action === "credit" ? "ADMIN CREDIT" : "ADMIN DEBIT",
      grams,
      status: "Completed",
    });

    await Transaction.create({
      userId: user._id,
      username: user.username,
      type: action === "credit" ? "CREDIT" : "DEBIT",
      amount: grams,
      status: "Completed",
      note: reason || "Admin Gold Wallet Update",
    });

    res.json({
      success: true,
      message: `Gold wallet ${action} successful.`,
      goldBalance: user.goldBalance,
    });
  } catch (error) {
    console.error("GOLD WALLET ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update Gold wallet.",
    });
  }
});

// =====================================================
// HEALTH CHECK
// GET /api/admin/health
// =====================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Admin Routes Working - GoldTrade V18",
    version: "V18 Enterprise",
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;