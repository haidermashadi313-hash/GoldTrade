const express = require("express");
const router = express.Router();

const User = require("../models/User");
const GoldTransaction = require("../models/GoldTransaction");
const WalletTransaction = require("../models/WalletTransaction");

const { verifyToken } = require("../middleware/authMiddleware");

// =====================================
// ADMIN MIDDLEWARE
// =====================================
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }

  next();
};

// =====================================
// GET ALL USERS
// GET /api/gold/admin/users
// =====================================
router.get("/users", verifyToken, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.status === "Active").length,
        blockedUsers: users.filter((u) => u.status === "Blocked").length,
        frozenWallets: users.filter((u) => u.walletFrozen).length,
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

// =====================================
// GET USER PROFILE
// GET /api/gold/admin/profile/:id
// =====================================
router.get("/profile/:id", verifyToken, adminOnly, async (req, res) => {
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
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
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

// =====================================
// BLOCK / UNBLOCK USER
// PUT /api/gold/admin/block/:id
// =====================================
router.put("/block/:id", verifyToken, adminOnly, async (req, res) => {
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

    res.status(200).json({
      success: true,
      status: user.status,
      message: `User ${user.status} successfully.`,
    });
  } catch (error) {
    console.error("BLOCK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update user status.",
    });
  }
});

// =====================================
// FREEZE / UNFREEZE WALLET
// PUT /api/gold/admin/freeze/:id
// =====================================
router.put("/freeze/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.walletFrozen = !user.walletFrozen;

    await user.save();

    res.status(200).json({
      success: true,
      walletFrozen: user.walletFrozen,
      message: user.walletFrozen
        ? "Wallet frozen successfully."
        : "Wallet unfrozen successfully.",
    });
  } catch (error) {
    console.error("FREEZE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update wallet status.",
    });
  }
});

// =====================================
// SOFT DELETE USER
// DELETE /api/gold/admin/delete/:id
// =====================================
router.delete("/delete/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.status = "Blocked";

    await user.save();

    res.status(200).json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to delete user.",
    });
  }
});

// =====================================
// RESTORE USER
// PUT /api/gold/admin/restore/:id
// =====================================
router.put("/restore/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isDeleted = false;
    user.deletedAt = null;
    user.status = "Active";

    await user.save();

    res.status(200).json({
      success: true,
      message: "User restored successfully.",
    });
  } catch (error) {
    console.error("RESTORE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to restore user.",
    });
  }
});

// =====================================
// SEARCH USERS
// GET /api/gold/admin/search?q=hashi
// =====================================
router.get("/search", verifyToken, adminOnly, async (req, res) => {
  try {
    const keyword = req.query.q || "";

    const users = await User.find({
      isDeleted: false,
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
    }).select("-password");

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("SEARCH ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Search failed.",
    });
  }
});
// ==============================================
// UPDATE GOLD MARKET SETTINGS (ADMIN)
// PUT /api/gold/admin/gold/settings
// ==============================================

router.put("/gold/settings", verifyToken, adminOnly, async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    settings.buyGoldPrice = Number(req.body.buyGoldPrice);
    settings.sellGoldPrice = Number(req.body.sellGoldPrice);
    settings.goldPriceUSD = Number(req.body.goldPriceUSD);
    settings.usdToPkr = Number(req.body.usdToPkr);
    settings.goldTradingEnabled = req.body.goldTradingEnabled;
    settings.marketStatus = req.body.marketStatus;

    await settings.save();

    res.json({
      success: true,
      message: "Gold market settings updated successfully.",
      settings,
    });

  } catch (error) {
    console.error("ADMIN GOLD SETTINGS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});
// =====================================================
// UPDATE GOLD MARKET SETTINGS (ADMIN)
// PUT /api/gold/admin/gold/settings
// =====================================================

router.put("/gold/settings", verifyToken, adminOnly, async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    settings.buyGoldPrice = Number(req.body.buyGoldPrice);
    settings.sellGoldPrice = Number(req.body.sellGoldPrice);
    settings.goldPriceUSD = Number(req.body.goldPriceUSD);
    settings.usdToPkr = Number(req.body.usdToPkr);
    settings.goldTradingEnabled = Boolean(req.body.goldTradingEnabled);
    settings.marketStatus = req.body.marketStatus;

    await settings.save();

    return res.json({
      success: true,
      message: "Gold Market Settings Updated Successfully.",
      data: {
        buyPrice: settings.buyGoldPrice,
        sellPrice: settings.sellGoldPrice,
        goldPriceUSD: settings.goldPriceUSD,
        usdToPkr: settings.usdToPkr,
        tradingEnabled: settings.goldTradingEnabled,
        marketStatus: settings.marketStatus,
      },
    });

  } catch (error) {
    console.error("ADMIN GOLD SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update Gold Market Settings.",
    });
  }
});
// =====================================================
// ADMIN GOLD WALLET CREDIT / DEBIT
// PUT /api/gold/admin/gold/wallet/:id
// =====================================================

const GoldTrade = require("../models/GoldTrade");
const Transaction = require("../models/Transaction");

router.put("/gold/wallet/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const { amount, action, reason } = req.body;

    const grams = Number(amount);

    if (!grams || grams <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid gold amount.",
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
      user.goldBalance = Number(user.goldBalance || 0) + grams;
    } else if (action === "debit") {
      if (Number(user.goldBalance || 0) < grams) {
        return res.status(400).json({
          success: false,
          message: "Insufficient Gold Balance.",
        });
      }

      user.goldBalance = Number(user.goldBalance) - grams;

      if (user.goldBalance <= 0) {
        user.goldBalance = 0;
        user.goldAveragePrice = 0;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Action must be credit or debit.",
      });
    }

    await user.save();

    await GoldTrade.create({
      user: user._id,
      username: user.username,
      tradeType: action === "credit" ? "ADMIN CREDIT" : "ADMIN DEBIT",
      grams,
      pricePerGram: 0,
      totalPKR: 0,
      averageBuyPrice: user.goldAveragePrice,
      profitLoss: 0,
      status: "Completed",
    });

    await Transaction.create({
      username: user.username,
      type: "Admin Gold Wallet",
      amount: grams,
      transactionId: `AG${Date.now()}`,
      status: "Completed",
      reason: reason || "Admin Gold Wallet Update",
    });

    return res.json({
      success: true,
      message: `Gold wallet ${action} successful.`,
      goldBalance: user.goldBalance,
    });

  } catch (error) {
    console.error("ADMIN GOLD WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router;