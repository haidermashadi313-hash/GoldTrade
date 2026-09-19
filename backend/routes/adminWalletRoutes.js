"use strict";

// ======================================================
// GoldTrade V18 - Admin Wallet Routes
// Linux + Render Compatible
// ======================================================

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// ALL ROUTES REQUIRE ADMIN LOGIN
// ======================================================

router.use(verifyToken);
router.use(isAdmin);

// ======================================================
// HEALTH CHECK
// GET /api/admin/wallet/health
// ======================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Admin Wallet API Working - GoldTrade V18",
    version: "V18 Enterprise",
    admin: req.user.username,
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// GET ALL USERS + WALLET BALANCES
// GET /api/admin/wallet/all
// ======================================================

router.get("/all", async (req, res) => {
  try {
    const users = await User.find({})
      .select("username fullName email status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const wallets = await Promise.all(
      users.map(async (user) => {
        const wallet = await Wallet.findOne({ userId: user._id }).lean();

        return {
          _id: user._id,
          username: user.username,
          fullName: user.fullName || "",
          email: user.email || "",
          status: user.status || "Active",

          walletBalance: Number(wallet?.PkrBalance ?? 0),
          PkrBalance: Number(wallet?.PkrBalance ?? 0),
          goldBalance: Number(wallet?.goldBalance ?? 0),
          UsdtBalance: Number(wallet?.UsdtBalance ?? 0),

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
    console.error("GET ALL WALLETS ERROR:", err);

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

router.post("/credit", async (req, res) => {
  try {
    const { username, walletType, amount, note } = req.body;

    if (!username || !walletType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Username, walletType and amount are required.",
      });
    }

    const creditAmount = Number(amount);

    if (isNaN(creditAmount) || creditAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount.",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        PkrBalance: 0,
        goldBalance: 0,
        UsdtBalance: 0,
      });
    }

    let previousBalance = 0;
    let newBalance = 0;

    switch (walletType.toUpperCase()) {

      case "PKR":
        previousBalance = Number(wallet.PkrBalance || 0);
        wallet.PkrBalance += creditAmount;
        newBalance = wallet.PkrBalance;
        break;

      case "GOLD":
        previousBalance = Number(wallet.goldBalance || 0);
        wallet.goldBalance += creditAmount;
        newBalance = wallet.goldBalance;
        break;

      case "USDT":
        previousBalance = Number(wallet.UsdtBalance || 0);
        wallet.UsdtBalance += creditAmount;
        newBalance = wallet.UsdtBalance;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid wallet type. Use PKR, GOLD or USDT.",
        });
    }

    await wallet.save();

    await WalletTransaction.create({
      userId: user._id,
      username: user.username,

      walletType: walletType.toUpperCase(),
      type: "CREDIT",

      amount: creditAmount,
      previousBalance,
      newBalance,

      adminId: req.user.id,
      adminUsername: req.user.username,

      note: note || "Wallet credited by admin.",
      createdAt: new Date(),
    });

    res.json({
      success: true,
      message: `${walletType.toUpperCase()} wallet credited successfully.`,

      balances: {
        PkrBalance: wallet.PkrBalance,
        goldBalance: wallet.goldBalance,
        UsdtBalance: wallet.UsdtBalance,
      },
    });

  } catch (err) {
    console.error("CREDIT WALLET ERROR:", err);

    res.status(500).json({
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

router.post("/debit", async (req, res) => {
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

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    let previousBalance = 0;
    let newBalance = 0;

    switch (walletType.toUpperCase()) {

      case "PKR":
        previousBalance = Number(wallet.PkrBalance || 0);

        if (previousBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient PKR balance.",
          });
        }

        wallet.PkrBalance -= debitAmount;
        newBalance = wallet.PkrBalance;
        break;

      case "GOLD":
        previousBalance = Number(wallet.goldBalance || 0);

        if (previousBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient GOLD balance.",
          });
        }

        wallet.goldBalance -= debitAmount;
        newBalance = wallet.goldBalance;
        break;

      case "USDT":
        previousBalance = Number(wallet.UsdtBalance || 0);

        if (previousBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient USDT balance.",
          });
        }

        wallet.UsdtBalance -= debitAmount;
        newBalance = wallet.UsdtBalance;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid wallet type. Use PKR, GOLD or USDT.",
        });
    }

    await wallet.save();

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

    res.json({
      success: true,
      message: `${walletType.toUpperCase()} wallet debited successfully.`,

      balances: {
        PkrBalance: wallet.PkrBalance,
        goldBalance: wallet.goldBalance,
        UsdtBalance: wallet.UsdtBalance,
      },
    });

  } catch (error) {
    console.error("DEBIT WALLET ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Wallet debit failed.",
      error: error.message,
    });
  }
});

// ======================================================
// GET ALL WALLET TRANSACTIONS
// GET /api/admin/wallet/history/all
// ======================================================

router.get("/history/all", async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      success: true,
      totalTransactions: transactions.length,
      transactions,
    });

  } catch (error) {
    console.error("GET WALLET HISTORY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load wallet history.",
      error: error.message,
    });
  }
});

// ======================================================
// GET SINGLE USER WALLET HISTORY
// GET /api/admin/wallet/history/:username
// ======================================================

router.get("/history/:username", async (req, res) => {
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

    res.json({
      success: true,
      username: user.username,
      totalTransactions: transactions.length,
      transactions,
    });

  } catch (error) {
    console.error("USER WALLET HISTORY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load user wallet history.",
      error: error.message,
    });
  }
});

// ======================================================
// GET SINGLE USER WALLET
// GET /api/admin/wallet/:username
// ======================================================

router.get("/:username", async (req, res) => {
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

    res.json({
      success: true,

      wallet: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName || "",
        email: user.email || "",
        status: user.status || "Active",

        walletBalance: Number(wallet?.PkrBalance ?? 0),
        PkrBalance: Number(wallet?.PkrBalance ?? 0),
        goldBalance: Number(wallet?.goldBalance ?? 0),
        UsdtBalance: Number(wallet?.UsdtBalance ?? 0),

        updatedAt: wallet?.updatedAt || user.createdAt,
      },
    });

  } catch (error) {
    console.error("GET SINGLE WALLET ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get wallet.",
      error: error.message,
    });
  }
});

// ======================================================
// MODULE EXPORT
// ======================================================

module.exports = router;