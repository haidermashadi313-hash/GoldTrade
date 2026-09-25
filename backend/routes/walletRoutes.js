// ======================================================
// GoldTrade V18 Enterprise Backend
// walletRoutes.js
// PART 1/5
// Production Ready (Render + PM2 + MongoDB)
// ======================================================

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");
const WalletHistory = require("../models/WalletHistory");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// HEALTH CHECK
// GET /api/wallet/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Wallet API",
    version: "V18 Enterprise",
    status: "ONLINE",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// GET LOGGED-IN USER WALLET BALANCE
// GET /api/wallet/balance
// Used By:
// Dashboard
// Deposit Page
// Withdraw Page
// Wallet Page
// Gold & USDT Modules
// ======================================================

router.get("/balance", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = {
      pkrBalance: Number(user.wallet?.pkr ?? user.pkrBalance ?? 0),
      goldBalance: Number(user.wallet?.gold ?? user.goldBalance ?? 0),
      usdtBalance: Number(user.wallet?.usdt ?? user.usdtBalance ?? 0),
    };

    return res.status(200).json({
      success: true,
      username: user.username,
      wallet,
      pkrBalance: wallet.pkrBalance,
      goldBalance: wallet.goldBalance,
      usdtBalance: wallet.usdtBalance,
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("GET WALLET BALANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet balance.",
    });
  }
});

// ======================================================
// GET USER WALLET BY USERNAME
// GET /api/wallet/:username
// Used by Admin/User Profile
// ======================================================

router.get("/:username", verifyToken, async (req, res) => {
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

    return res.status(200).json({
      success: true,
      wallet: {
        username: user.username,
        email: user.email,
        role: user.role || "user",

        pkrBalance: Number(user.wallet?.pkr ?? user.pkrBalance ?? 0),
        goldBalance: Number(user.wallet?.gold ?? user.goldBalance ?? 0),
        usdtBalance: Number(user.wallet?.usdt ?? user.usdtBalance ?? 0),

        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error("GET USER WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// walletRoutes.js
// PART 2/5
// Wallet History + Wallet Summary APIs
// ======================================================

// ======================================================
// GET WALLET SUMMARY
// GET /api/wallet/summary
// Used By Dashboard
// ======================================================

router.get("/summary", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const pkrBalance = Number(user.wallet?.pkr ?? user.pkrBalance ?? 0);
    const goldBalance = Number(user.wallet?.gold ?? user.goldBalance ?? 0);
    const usdtBalance = Number(user.wallet?.usdt ?? user.usdtBalance ?? 0);

    const totalTransactions = await WalletHistory.countDocuments({
      userId: user._id,
    });

    const lastTransaction = await WalletHistory.findOne({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      summary: {
        username: user.username,
        pkrBalance,
        goldBalance,
        usdtBalance,
        totalTransactions,
        lastTransaction,
      },
    });

  } catch (error) {
    console.error("GET WALLET SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet summary.",
    });
  }
});

// ======================================================
// GET WALLET HISTORY
// GET /api/wallet/history
// Used By Wallet Page
// ======================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const history = await WalletHistory.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const formattedHistory = history.map((item) => ({
      _id: item._id,
      walletType: item.walletType,
      type: item.type,
      amount: Number(item.amount),
      balanceAfter: Number(item.balanceAfter ?? 0),
      note: item.note || "",
      admin: item.admin || "",
      createdAt: item.createdAt,
    }));

    return res.status(200).json({
      success: true,
      total: formattedHistory.length,
      history: formattedHistory,
    });

  } catch (error) {
    console.error("GET WALLET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet history.",
    });
  }
});

// ======================================================
// GET WALLET HISTORY BY USERNAME
// GET /api/wallet/history/:username
// Used By Admin/User Profile
// ======================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).select("_id username");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const history = await WalletHistory.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      username: user.username,
      total: history.length,
      history,
    });

  } catch (error) {
    console.error("GET USER WALLET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user wallet history.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// walletRoutes.js
// PART 3/5
// Admin Credit Wallet API (Production)
// ======================================================

// POST /api/admin/wallet/credit

router.post("/credit", verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId, walletType, amount, note } = req.body;

    if (!userId || !walletType || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "User ID, wallet type and amount are required.",
      });
    }

    const creditAmount = Number(amount);

    if (isNaN(creditAmount) || creditAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
      });
    }

    const wallet = String(walletType).toUpperCase();

    if (!["PKR", "GOLD", "USDT"].includes(wallet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet type.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Ensure wallet object exists
    if (!user.wallet) {
      user.wallet = {
        pkr: Number(user.pkrBalance || 0),
        gold: Number(user.goldBalance || 0),
        usdt: Number(user.usdtBalance || 0),
      };
    }

    let balanceAfter = 0;

    switch (wallet) {
      case "PKR":
        user.wallet.pkr = Number(user.wallet.pkr || 0) + creditAmount;
        user.pkrBalance = user.wallet.pkr;
        balanceAfter = user.wallet.pkr;
        break;

      case "GOLD":
        user.wallet.gold = Number(user.wallet.gold || 0) + creditAmount;
        user.goldBalance = user.wallet.gold;
        balanceAfter = user.wallet.gold;
        break;

      case "USDT":
        user.wallet.usdt = Number(user.wallet.usdt || 0) + creditAmount;
        user.usdtBalance = user.wallet.usdt;
        balanceAfter = user.wallet.usdt;
        break;
    }

    await user.save();

    // Wallet History Entry
    await WalletHistory.create({
      userId: user._id,
      username: user.username,
      walletType: wallet,
      type: "CREDIT",
      amount: creditAmount,
      balanceAfter,
      note: note || "Wallet credited by admin",
      admin: req.user.username || "Admin",
    });

    return res.status(200).json({
      success: true,
      message: `${wallet} wallet credited successfully.`,
      wallet,
      balanceAfter,
      walletBalance: {
        pkrBalance: Number(user.wallet.pkr || 0),
        goldBalance: Number(user.wallet.gold || 0),
        usdtBalance: Number(user.wallet.usdt || 0),
      },
    });

  } catch (error) {
    console.error("ADMIN CREDIT WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to credit wallet.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// walletRoutes.js
// PART 4/5
// Admin Debit Wallet API (Production)
// ======================================================

// POST /api/admin/wallet/debit

router.post("/debit", verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId, walletType, amount, note } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!userId || !walletType || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "User ID, wallet type and amount are required.",
      });
    }

    const debitAmount = Number(amount);

    if (isNaN(debitAmount) || debitAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
      });
    }

    const wallet = String(walletType).toUpperCase();

    if (!["PKR", "GOLD", "USDT"].includes(wallet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet type.",
      });
    }

    // ==================================================
    // FIND USER
    // ==================================================

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Create wallet object if missing
    if (!user.wallet) {
      user.wallet = {
        pkr: Number(user.pkrBalance || 0),
        gold: Number(user.goldBalance || 0),
        usdt: Number(user.usdtBalance || 0),
      };
    }

    let currentBalance = 0;
    let balanceAfter = 0;

    // ==================================================
    // DEBIT WALLET
    // ==================================================

    switch (wallet) {
      case "PKR":
        currentBalance = Number(user.wallet.pkr || 0);

        if (currentBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient PKR wallet balance.",
          });
        }

        user.wallet.pkr = currentBalance - debitAmount;
        user.pkrBalance = user.wallet.pkr;
        balanceAfter = user.wallet.pkr;
        break;

      case "GOLD":
        currentBalance = Number(user.wallet.gold || 0);

        if (currentBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient Gold wallet balance.",
          });
        }

        user.wallet.gold = currentBalance - debitAmount;
        user.goldBalance = user.wallet.gold;
        balanceAfter = user.wallet.gold;
        break;

      case "USDT":
        currentBalance = Number(user.wallet.usdt || 0);

        if (currentBalance < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient USDT wallet balance.",
          });
        }

        user.wallet.usdt = currentBalance - debitAmount;
        user.usdtBalance = user.wallet.usdt;
        balanceAfter = user.wallet.usdt;
        break;
    }

    await user.save();

    // ==================================================
    // SAVE WALLET HISTORY
    // ==================================================

    await WalletHistory.create({
      userId: user._id,
      username: user.username,
      walletType: wallet,
      type: "DEBIT",
      amount: debitAmount,
      balanceAfter,
      note: note || "Wallet debited by admin",
      admin: req.user.username || "Admin",
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message: `${wallet} wallet debited successfully.`,
      wallet,
      debitedAmount: debitAmount,
      balanceAfter,
      walletBalance: {
        pkrBalance: Number(user.wallet.pkr || 0),
        goldBalance: Number(user.wallet.gold || 0),
        usdtBalance: Number(user.wallet.usdt || 0),
      },
    });

  } catch (error) {
    console.error("ADMIN DEBIT WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to debit wallet.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// walletRoutes.js
// PART 5/5
// Wallet Sync + Admin Refresh + Export Router
// ======================================================

// ======================================================
// REFRESH WALLET FROM DATABASE
// GET /api/wallet/refresh
// Used By Dashboard / Deposit / Withdraw
// ======================================================

router.get("/refresh", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = {
      pkrBalance: Number(user.wallet?.pkr ?? user.pkrBalance ?? 0),
      goldBalance: Number(user.wallet?.gold ?? user.goldBalance ?? 0),
      usdtBalance: Number(user.wallet?.usdt ?? user.usdtBalance ?? 0),
    };

    return res.status(200).json({
      success: true,
      username: user.username,
      wallet,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("REFRESH WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh wallet.",
    });
  }
});

// ======================================================
// ADMIN WALLET REFRESH
// GET /api/admin/wallet/refresh/:userId
// ======================================================

router.get("/refresh/:userId", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      wallet: {
        username: user.username,
        pkrBalance: Number(user.wallet?.pkr ?? user.pkrBalance ?? 0),
        goldBalance: Number(user.wallet?.gold ?? user.goldBalance ?? 0),
        usdtBalance: Number(user.wallet?.usdt ?? user.usdtBalance ?? 0),
      },
    });

  } catch (error) {
    console.error("ADMIN REFRESH WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh admin wallet.",
    });
  }
});

// ======================================================
// WALLET DIAGNOSTICS
// GET /api/wallet/debug
// ======================================================

router.get("/debug", verifyToken, async (req, res) => {
  try {
    const totalHistory = await WalletHistory.countDocuments({
      userId: req.user.id,
    });

    return res.json({
      success: true,
      userId: req.user.id,
      walletHistory: totalHistory,
      serverTime: new Date().toISOString(),
      module: "Wallet API V18 Enterprise",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================================
// ROUTER EXPORT
// ======================================================

module.exports = router;
