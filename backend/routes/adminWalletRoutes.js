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
// GET /api/admin/Wallet/health
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
// GET ALL USERS + Wallet BALANCES
// GET /api/admin/Wallet/all
// ======================================================

router.get("/all", async (req, res) => {
  try {
    const users = await User.find({})
      .select("username fullName email status createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const Wallets = await Promise.all(
      users.map(async (user) => {
        const Wallet = await Wallet.findOne({ userId: user._id }).lean();

        return {
          _id: user._id,
          username: user.username,
          fullName: user.fullName || "",
          email: user.email || "",
          status: user.status || "Active",

          WalletBalance: Number(Wallet?.PkrBalance ?? 0),
          PkrBalance: Number(Wallet?.PkrBalance ?? 0),
          goldBalance: Number(Wallet?.goldBalance ?? 0),
          UsdtBalance: Number(Wallet?.UsdtBalance ?? 0),

          updatedAt: Wallet?.updatedAt || user.createdAt,
        };
      })
    );

    res.json({
      success: true,
      totalUsers: Wallets.length,
      Wallets,
    });

  } catch (err) {
    console.error("GET ALL WalletS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Failed to load Wallet users.",
      error: err.message,
    });
  }
});

// ======================================================
// CREDIT PKR / GOLD / USDT Wallet
// POST /api/admin/Wallet/credit
// ======================================================

router.post("/credit", async (req, res) => {
  try {
    const { username, WalletType, amount, note } = req.body;

    if (!username || !WalletType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Username, WalletType and amount are required.",
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

    let Wallet = await Wallet.findOne({ userId: user._id });

    if (!Wallet) {
      Wallet = await Wallet.create({
        userId: user._id,
        PkrBalance: 0,
        goldBalance: 0,
        UsdtBalance: 0,
      });
    }

    let previousBalance = 0;
    let newBalance = 0;

    switch (WalletType.toUpperCase()) {

      case "PKR":
        previousBalance = Number(Wallet.PkrBalance || 0);
        Wallet.PkrBalance += creditAmount;
        newBalance = Wallet.PkrBalance;
        break;

      case "GOLD":
        previousBalance = Number(Wallet.goldBalance || 0);
        Wallet.goldBalance += creditAmount;
        newBalance = Wallet.goldBalance;
        break;

      case "USDT":
        previousBalance = Number(Wallet.UsdtBalance || 0);
        Wallet.UsdtBalance += creditAmount;
        newBalance = Wallet.UsdtBalance;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid Wallet type. Use PKR, GOLD or USDT.",
        });
    }

    await Wallet.save();

    await WalletTransaction.create({
      userId: user._id,
      username: user.username,

      WalletType: WalletType.toUpperCase(),
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
      message: `${WalletType.toUpperCase()} Wallet credited successfully.`,

      balances: {
        PkrBalance: Wallet.PkrBalance,
        goldBalance: Wallet.goldBalance,
        UsdtBalance: Wallet.UsdtBalance,
      },
    });

  } catch (err) {
    console.error("CREDIT Wallet ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Wallet credit failed.",
      error: err.message,
    });
  }
});
// ======================================================
// DEBIT PKR / GOLD / USDT Wallet
// POST /api/admin/Wallet/debit
// ======================================================

router.post("/debit", async (req, res) => {
  try {
    const { username, WalletType, amount, note } = req.body;

    if (!username || !WalletType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Username, WalletType and amount are required.",
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

    const Wallet = await Wallet.findOne({ userId: user._id });

    if (!Wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    let previousBalance = 0;
    let newBalance = 0;

    switch (WalletType.toUpperCase()) {

      case "PKR":
        previousBalance = Number(Wallet.PkrBalance || 0);

        if (previousBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient PKR balance.",
          });
        }

        Wallet.PkrBalance -= debitAmount;
        newBalance = Wallet.PkrBalance;
        break;

      case "GOLD":
        previousBalance = Number(Wallet.goldBalance || 0);

        if (previousBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient GOLD balance.",
          });
        }

        Wallet.goldBalance -= debitAmount;
        newBalance = Wallet.goldBalance;
        break;

      case "USDT":
        previousBalance = Number(Wallet.UsdtBalance || 0);

        if (previousBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient USDT balance.",
          });
        }

        Wallet.UsdtBalance -= debitAmount;
        newBalance = Wallet.UsdtBalance;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid Wallet type. Use PKR, GOLD or USDT.",
        });
    }

    await Wallet.save();

    await WalletTransaction.create({
      userId: user._id,
      username: user.username,

      WalletType: WalletType.toUpperCase(),
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
      message: `${WalletType.toUpperCase()} Wallet debited successfully.`,

      balances: {
        PkrBalance: Wallet.PkrBalance,
        goldBalance: Wallet.goldBalance,
        UsdtBalance: Wallet.UsdtBalance,
      },
    });

  } catch (error) {
    console.error("DEBIT Wallet ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Wallet debit failed.",
      error: error.message,
    });
  }
});

// ======================================================
// GET ALL Wallet TRANSACTIONS
// GET /api/admin/Wallet/history/all
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
    console.error("GET Wallet HISTORY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load Wallet history.",
      error: error.message,
    });
  }
});

// ======================================================
// GET SINGLE USER Wallet HISTORY
// GET /api/admin/Wallet/history/:username
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
    console.error("USER Wallet HISTORY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load user Wallet history.",
      error: error.message,
    });
  }
});

// ======================================================
// GET SINGLE USER Wallet
// GET /api/admin/Wallet/:username
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

    const Wallet = await Wallet.findOne({
      userId: user._id,
    }).lean();

    res.json({
      success: true,

      Wallet: {
        _id: user._id,
        username: user.username,
        fullName: user.fullName || "",
        email: user.email || "",
        status: user.status || "Active",

        WalletBalance: Number(Wallet?.PkrBalance ?? 0),
        PkrBalance: Number(Wallet?.PkrBalance ?? 0),
        goldBalance: Number(Wallet?.goldBalance ?? 0),
        UsdtBalance: Number(Wallet?.UsdtBalance ?? 0),

        updatedAt: Wallet?.updatedAt || user.createdAt,
      },
    });

  } catch (error) {
    console.error("GET SINGLE Wallet ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get Wallet.",
      error: error.message,
    });
  }
});

// ======================================================
// MODULE EXPORT
// ======================================================

module.exports = router;