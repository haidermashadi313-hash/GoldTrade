"use strict";

// ======================================================
// GoldTrade V18 - Admin Wallet Routes (PART 1/4)
// ======================================================

const express = require("express");
const router = express.Router();

// ================= MODELS =================
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

// ================= MIDDLEWARE =================
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");

// ======================================================
// HEALTH CHECK
// GET /api/admin/wallet/health
// ======================================================

router.get("/health", verifyToken, isAdmin, (req, res) => {
  return res.json({
    success: true,
    message: "Admin Wallet API Working - GoldTrade V18",
    version: "V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// GET ALL USERS + WALLET BALANCES
// GET /api/admin/wallet/all
// ======================================================

router.get("/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("username fullName email status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const wallets = await Promise.all(
      users.map(async (user) => {
        const wallet = await Wallet.findOne({ userId: user._id }).lean();
        console.log("USER:", user.username);
        console.log("WALLET:", wallet);

        return {
          _id: user._id,
          username: user.username,
          fullName: user.fullName || "",
          email: user.email || "",
          status: user.status || "Active",

          walletBalance: Number((wallet?.pkrBalance ?? 0)),
            
          pkrBalance: Number(wallet?.pkrBalance ?? 0),
              

          goldBalance: Number(wallet?.goldBalance ?? 0),
             
          usdtBalance: Number(wallet?.usdtBalance ?? 0),
              

          updatedAt: wallet?.updatedAt || user.createdAt,
        };
      })
    );

    res.json({
      success: true,
      totalUsers: wallets.length,
      wallets,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to load wallet users.",
      error: err.message,
    });
  }
});
// ======================================================
// CREDIT PKR / GOLD / USDT WALLET
// POST /api/admin/wallet/credit
// ======================================================

router.post("/credit", verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, walletType, amount, note } = req.body;

    if (!username || !walletType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Username, walletType and amount are required.",
      });
    }

    const value = Number(amount);

    if (isNaN(value) || value <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount.",
      });
    }

    // Find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Find wallet
    let wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        pkrBalance: 0,
        goldBalance: 0,
        usdtBalance: 0,
      });
    }

    // Credit wallet
    switch (walletType) {
      case "PKR":
        wallet.pkrBalance += value;
        break;

      case "GOLD":
        wallet.goldBalance += value;
        break;

      case "USDT":
        wallet.usdtBalance += value;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid wallet type.",
        });
    }

    await wallet.save();

    // Save transaction history
    await WalletTransaction.create({
      userId: user._id,
        username: user.username,
        walletType: walletType.toUpperCase(),
        type: "CREDIT",
        amount: creditAmount,
        previousBalance,
        newBalance,

        admin: req.user.username,
        adminUsername: req.user.username,
        note: note || "Wallet credited by admin.",
        createdAt: new Date(),
    });

    return res.json({
      success: true,
      message: `${walletType} wallet credited successfully.`,
      balances: {
        pkr: wallet.pkrBalance,
        gold: wallet.goldBalance,
        usdt: wallet.usdtBalance,
      },
    });

  } catch (err) {
    console.error("CREDIT ROUTE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Wallet credit failed.",
      error: err.message,
    });
  }
});

// ======================================================
// DEBIT PKR / GOLD / USDT WALLET
// POST /api/admin/wallet/debit
// ======================================================

router.post("/debit", verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, walletType, amount, note } = req.body;

    if (!username || !walletType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Username, walletType and amount are required.",
      });
    }

    const debitAmount = Number(amount);

    if (isNaN(debitAmount) || debitAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid debit amount.",
      });
    }

    // Find User
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Find Wallet
    const wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    let previousBalance = 0;
    let newBalance = 0;

    // =====================================================
    // DEBIT WALLET (FIXED PKR + GOLD + USDT)
    // =====================================================

    switch ((walletType || "PKR").toUpperCase()) {

      case "PKR":
        previousBalance = Number(
          wallet.pkrBalance ??
          wallet.walletBalance ??
          wallet.balance ??
          0
        );

        if (previousBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient PKR balance.",
          });
        }

        newBalance = previousBalance - debitAmount;
        wallet.pkrBalance = newBalance;
        break;

      case "GOLD":
        previousBalance = Number(wallet.goldBalance || 0);

        if (previousBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient Gold balance.",
          });
        }

        newBalance = previousBalance - debitAmount;
        wallet.goldBalance = newBalance;
        break;

      case "USDT":
        previousBalance = Number(wallet.usdtBalance || 0);

        if (previousBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient USDT balance.",
          });
        }

        newBalance = previousBalance - debitAmount;
        wallet.usdtBalance = newBalance;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid wallet type.",
        });
    }

    // Save wallet
    await wallet.save();

    // Save transaction history
    await WalletTransaction.create({
      userId: user._id,
      username: user.username,

      walletType: walletType.toUpperCase(),
      type: "DEBIT",

      amount: debitAmount,
      previousBalance,
      newBalance,

      adminId: req.user.id,
      adminUsername: req.user.username,

      note: note || "Wallet debited by admin.",
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `${walletType.toUpperCase()} wallet debited successfully.`,

      balances: {
        pkr: wallet.pkrBalance,
        gold: wallet.goldBalance,
        usdt: wallet.usdtBalance,
      },

      wallet: {
        username: user.username,
        walletBalance: wallet.pkrBalance,
        pkrBalance: wallet.pkrBalance,
        goldBalance: wallet.goldBalance,
        usdtBalance: wallet.usdtBalance,
      },
    });

  } catch (error) {
    console.error("DEBIT WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Wallet debit failed.",
      error: error.message,
    });
  }
});

// ======================================================
// GET ALL WALLET TRANSACTIONS (ADMIN)
// GET /api/admin/wallet/history/all
// ======================================================

router.get("/history/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const history = transactions.map((tx) => ({
      _id: tx._id,

      username: tx.username || "Unknown",
      walletType: tx.walletType || "PKR",
      type: tx.type || "CREDIT",

      amount: Number(tx.amount || 0),
      previousBalance: Number(tx.previousBalance || 0),
      newBalance: Number(tx.newBalance || 0),

      adminUsername: tx.adminUsername || tx.admin || "Admin",
      note: tx.note || "",
      createdAt: tx.createdAt,
    }));

    return res.status(200).json({
      success: true,
      totalTransactions: history.length,
      transactions: history,   // Frontend isi key ko use karega
    });

  } catch (error) {
    console.error("WALLET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load wallet history.",
      error: error.message,
    });
  }
});


// ======================================================
// SINGLE USER WALLET HISTORY
// GET /api/admin/wallet/history/:username
// ======================================================

router.get("/history/:username", verifyToken, isAdmin, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const transactions = await WalletTransaction.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      success: true,
      username: user.username,
      totalTransactions: transactions.length,
      transactions,
    });

  } catch (error) {
    console.error("USER WALLET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load wallet history.",
      error: error.message,
    });
  }
});


// ======================================================
// GET SINGLE USER WALLET
// GET /api/admin/wallet/:username
// ======================================================

router.get("/:username", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await Wallet.findOne({
      userId: user._id,
    }).lean();

    return res.status(200).json({
      success: true,
      wallet: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName || "",
        email: user.email || "",
        status: user.status || "Active",

        // PKR (GoldTrade V18 compatible)
        walletBalance: Number(
          wallet?.pkrBalance ??
          wallet?.walletBalance ??
          wallet?.balance ??
          0
        ),
        pkrBalance: Number(
          wallet?.pkrBalance ??
          wallet?.walletBalance ??
          wallet?.balance ??
          0
        ),

        // GOLD
        goldBalance: Number(wallet?.goldBalance ?? 0),

        // USDT
        usdtBalance: Number(wallet?.usdtBalance ?? 0),

        updatedAt: wallet?.updatedAt || user.createdAt,
      },
    });

  } catch (error) {
    console.error("GET WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get user wallet.",
      error: error.message,
    });
  }
});


// ======================================================
// MODULE EXPORT
// ======================================================

module.exports = router;