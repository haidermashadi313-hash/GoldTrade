// ======================================================
// GoldTrade V18 Enterprise Backend
// walletRoutes.js — PART 1/5
// Wallet API (Health + Balance + Auto Wallet Creation)
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const WalletHistory = require("../models/WalletHistory");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// HELPER — GET OR CREATE WALLET
// ======================================================

const getOrCreateWallet = async (user) => {
  let wallet = await Wallet.findOne({ userId: user._id });

  if (!wallet) {
    wallet = await Wallet.create({
      userId: user._id,
      username: user.username.toLowerCase(),

      balance: 0,
      pkrBalance: 0,
      goldBalance: 0,
      usdtBalance: 0,

      lockedPkr: 0,
      lockedGold: 0,
      lockedUsdt: 0,

      portfolioValue: 0,
      liveProfit: 0,
      liveProfitPercent: 0,

      totalDeposit: 0,
      totalWithdraw: 0,
      totalPkrDeposit: 0,
      totalPkrWithdraw: 0,
      totalGoldPurchased: 0,
      totalGoldSold: 0,
      totalUsdtDeposited: 0,
      totalUsdtWithdrawn: 0,

      status: "Active",
      isVerified: true,
      isFrozen: false,
    });

    console.log(`🆕 Wallet created for ${user.username}`);
  }

  return wallet;
};

// ======================================================
// HEALTH CHECK
// GET /api/wallet/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Wallet API",
    version: "GoldTrade V18 Enterprise",
    status: "ONLINE",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// GET LOGGED-IN USER WALLET
// GET /api/wallet/balance
// Used by Dashboard / Wallet / Deposit / Withdraw / Gold
// ======================================================

router.get("/balance", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("_id username email role")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await getOrCreateWallet(user);

    return res.status(200).json({
      success: true,
      username: wallet.username,

      wallet: {
        pkrBalance: wallet.pkrBalance,
        goldBalance: wallet.goldBalance,
        usdtBalance: wallet.usdtBalance,

        lockedPkr: wallet.lockedPkr,
        lockedGold: wallet.lockedGold,
        lockedUsdt: wallet.lockedUsdt,

        availablePkr: wallet.availablePkr,
        availableGold: wallet.availableGold,
        availableUsdt: wallet.availableUsdt,

        portfolioValue: wallet.portfolioValue,
        liveProfit: wallet.liveProfit,
        liveProfitPercent: wallet.liveProfitPercent,

        totalWalletValue: wallet.totalWalletValue,
        status: wallet.status,
      },

      updatedAt: wallet.updatedAt,
    });

  } catch (error) {
    console.error("GET WALLET BALANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet balance.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET USER WALLET BY USERNAME
// GET /api/wallet/:username
// User can access own wallet, Admin can access any wallet
// ======================================================

router.get("/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    if (
      req.user.role !== "admin" &&
      req.user.username !== username
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const user = await User.findOne({ username })
      .select("_id username email role")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await getOrCreateWallet(user);

    return res.status(200).json({
      success: true,

      wallet: {
        username: wallet.username,
        email: user.email,
        role: user.role,

        pkrBalance: wallet.pkrBalance,
        goldBalance: wallet.goldBalance,
        usdtBalance: wallet.usdtBalance,

        lockedPkr: wallet.lockedPkr,
        lockedGold: wallet.lockedGold,
        lockedUsdt: wallet.lockedUsdt,

        availablePkr: wallet.availablePkr,
        availableGold: wallet.availableGold,
        availableUsdt: wallet.availableUsdt,

        portfolioValue: wallet.portfolioValue,
        liveProfit: wallet.liveProfit,
        liveProfitPercent: wallet.liveProfitPercent,

        totalWalletValue: wallet.totalWalletValue,
        totalDeposit: wallet.totalDeposit,
        totalWithdraw: wallet.totalWithdraw,

        status: wallet.status,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
    });

  } catch (error) {
    console.error("GET USER WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// walletRoutes.js — PART 2/5 FINAL FIXED
// Wallet Summary + Dashboard Portfolio APIs
// IQ1000 • Render • PM2 • Ubuntu • MongoDB Atlas
// ======================================================

// ======================================================
// GET WALLET SUMMARY
// GET /api/wallet/summary
// ======================================================

router.get("/summary", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("_id username")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // IMPORTANT: Don't use .lean() wallet here
    const wallet = await getOrCreateWallet(user);

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
        username: wallet.username,

        balances: {
          pkr: wallet.pkrBalance,
          gold: wallet.goldBalance,
          usdt: wallet.usdtBalance,
        },

        available: {
          pkr: wallet.availablePkr,
          gold: wallet.availableGold,
          usdt: wallet.availableUsdt,
        },

        locked: {
          pkr: wallet.lockedPkr,
          gold: wallet.lockedGold,
          usdt: wallet.lockedUsdt,
        },

        performance: {
          portfolioValue: wallet.portfolioValue,
          liveProfit: wallet.liveProfit,
          liveProfitPercent: wallet.liveProfitPercent,
          totalWalletValue: wallet.totalWalletValue,
        },

        totals: {
          deposit: wallet.totalDeposit,
          withdraw: wallet.totalWithdraw,
          goldPurchased: wallet.totalGoldPurchased,
          goldSold: wallet.totalGoldSold,
          usdtDeposited: wallet.totalUsdtDeposited,
          usdtWithdrawn: wallet.totalUsdtWithdrawn,
        },

        totalTransactions,
        lastTransaction,
        status: wallet.status,
        updatedAt: wallet.updatedAt,
      },
    });

  } catch (error) {
    console.error("GET WALLET SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet summary.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET DASHBOARD PORTFOLIO
// GET /api/wallet/portfolio
// Dashboard Page API
// ======================================================

router.get("/portfolio", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("_id username")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await getOrCreateWallet(user);

    return res.status(200).json({
      success: true,

      portfolio: {
        username: wallet.username,

        balances: {
          pkr: wallet.pkrBalance,
          gold: wallet.goldBalance,
          usdt: wallet.usdtBalance,
        },

        available: {
          pkr: wallet.availablePkr,
          gold: wallet.availableGold,
          usdt: wallet.availableUsdt,
        },

        locked: {
          pkr: wallet.lockedPkr,
          gold: wallet.lockedGold,
          usdt: wallet.lockedUsdt,
        },

        portfolioValue: wallet.portfolioValue,
        liveProfit: wallet.liveProfit,
        liveProfitPercent: wallet.liveProfitPercent,
        totalWalletValue: wallet.totalWalletValue,

        totalDeposit: wallet.totalDeposit,
        totalWithdraw: wallet.totalWithdraw,
        totalGoldPurchased: wallet.totalGoldPurchased,
        totalGoldSold: wallet.totalGoldSold,
        totalUsdtDeposited: wallet.totalUsdtDeposited,
        totalUsdtWithdrawn: wallet.totalUsdtWithdrawn,

        status: wallet.status,
        updatedAt: wallet.updatedAt,
      },
    });

  } catch (error) {
    console.error("GET PORTFOLIO ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load portfolio.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET USER PORTFOLIO BY USERNAME
// GET /api/wallet/portfolio/:username
// Admin OR Same User
// ======================================================

router.get("/portfolio/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    if (
      req.user.role !== "admin" &&
      req.user.username.toLowerCase() !== username
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const user = await User.findOne({ username })
      .select("_id username email role")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await getOrCreateWallet(user);

    return res.status(200).json({
      success: true,

      portfolio: {
        username: wallet.username,
        email: user.email,
        role: user.role,

        balances: {
          pkr: wallet.pkrBalance,
          gold: wallet.goldBalance,
          usdt: wallet.usdtBalance,
        },

        available: {
          pkr: wallet.availablePkr,
          gold: wallet.availableGold,
          usdt: wallet.availableUsdt,
        },

        locked: {
          pkr: wallet.lockedPkr,
          gold: wallet.lockedGold,
          usdt: wallet.lockedUsdt,
        },

        portfolioValue: wallet.portfolioValue,
        liveProfit: wallet.liveProfit,
        liveProfitPercent: wallet.liveProfitPercent,
        totalWalletValue: wallet.totalWalletValue,

        totals: {
          deposit: wallet.totalDeposit,
          withdraw: wallet.totalWithdraw,
          goldPurchased: wallet.totalGoldPurchased,
          goldSold: wallet.totalGoldSold,
          usdtDeposited: wallet.totalUsdtDeposited,
          usdtWithdrawn: wallet.totalUsdtWithdrawn,
        },

        status: wallet.status,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
    });

  } catch (error) {
    console.error("GET USER PORTFOLIO ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user portfolio.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// walletRoutes.js — PART 3/5
// Wallet History APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET LOGGED-IN USER WALLET HISTORY
// GET /api/wallet/history
// Used by Wallet Page & Dashboard
// ======================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const history = await WalletHistory.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await WalletHistory.countDocuments({
      userId: req.user.id,
    });

    const formattedHistory = history.map((item) => ({
      id: item._id,
      walletType: item.walletType,
      type: item.type,
      amount: Number(item.amount || 0),
      balanceAfter: Number(item.balanceAfter || 0),
      note: item.note || "",
      admin: item.admin || "",
      createdAt: item.createdAt,
    }));

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      history: formattedHistory,
    });

  } catch (error) {
    console.error("GET WALLET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET WALLET HISTORY BY USERNAME
// GET /api/wallet/history/:username
// Admin or Same User
// ======================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();

    if (
      req.user.role !== "admin" &&
      req.user.username !== username
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const user = await User.findOne({ username })
      .select("_id username email role")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;

    const history = await WalletHistory.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await WalletHistory.countDocuments({
      userId: user._id,
    });

    return res.status(200).json({
      success: true,
      username: user.username,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      history,
    });

  } catch (error) {
    console.error("GET USER WALLET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user wallet history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET RECENT WALLET TRANSACTIONS
// GET /api/wallet/recent
// Dashboard Recent Activity
// ======================================================

router.get("/recent", verifyToken, async (req, res) => {
  try {
    const recentTransactions = await WalletHistory.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      total: recentTransactions.length,
      transactions: recentTransactions,
    });

  } catch (error) {
    console.error("GET RECENT WALLET TRANSACTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent transactions.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// SEARCH WALLET HISTORY
// GET /api/wallet/history/search
// Filters: walletType, type, fromDate, toDate
// ======================================================

router.get("/history/search", verifyToken, async (req, res) => {
  try {
    const { walletType, type, fromDate, toDate } = req.query;

    const query = {
      userId: req.user.id,
    };

    if (walletType) {
      query.walletType = walletType.toUpperCase();
    }

    if (type) {
      query.type = type.toUpperCase();
    }

    if (fromDate || toDate) {
      query.createdAt = {};

      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }

      if (toDate) {
        query.createdAt.$lte = new Date(toDate);
      }
    }

    const history = await WalletHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json({
      success: true,
      total: history.length,
      filters: {
        walletType,
        type,
        fromDate,
        toDate,
      },
      history,
    });

  } catch (error) {
    console.error("SEARCH WALLET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search wallet history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// walletRoutes.js — PART 4/5
// Admin Credit / Debit Wallet APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// ADMIN CREDIT WALLET
// POST /api/wallet/admin/credit
// ======================================================

router.post("/admin/credit", verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId, walletType, amount, note } = req.body;

    if (!userId || !walletType || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "User ID, wallet type and amount are required.",
      });
    }

    const creditAmount = Number(amount);

    if (!Number.isFinite(creditAmount) || creditAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
      });
    }

    const walletKey = walletType.toUpperCase();

    if (!["PKR", "GOLD", "USDT"].includes(walletKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet type.",
      });
    }

    const user = await User.findById(userId)
      .select("_id username")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await getOrCreateWallet(user);

    let balanceAfter = 0;

    switch (walletKey) {
      case "PKR":
        wallet.pkrBalance += creditAmount;
        wallet.totalDeposit += creditAmount;
        wallet.totalPkrDeposit += creditAmount;
        wallet.lastDepositAt = new Date();
        balanceAfter = wallet.pkrBalance;
        break;

      case "GOLD":
        wallet.goldBalance += creditAmount;
        wallet.totalGoldPurchased += creditAmount;
        wallet.lastTradeAt = new Date();
        balanceAfter = wallet.goldBalance;
        break;

      case "USDT":
        wallet.usdtBalance += creditAmount;
        wallet.totalUsdtDeposited += creditAmount;
        wallet.lastDepositAt = new Date();
        balanceAfter = wallet.usdtBalance;
        break;
    }

    await wallet.save();

    await WalletHistory.create({
      userId: user._id,
      username: user.username,
      walletType: walletKey,
      type: "CREDIT",
      amount: creditAmount,
      balanceAfter,
      note: note || "Wallet credited by admin",
      admin: req.user.username,
    });

    return res.status(200).json({
      success: true,
      message: `${walletKey} wallet credited successfully.`,
      walletType: walletKey,
      creditedAmount: creditAmount,
      balanceAfter,

      wallet: {
        pkrBalance: wallet.pkrBalance,
        goldBalance: wallet.goldBalance,
        usdtBalance: wallet.usdtBalance,
        portfolioValue: wallet.portfolioValue,
      },
    });

  } catch (error) {
    console.error("ADMIN CREDIT WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to credit wallet.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN DEBIT WALLET
// POST /api/wallet/admin/debit
// ======================================================

router.post("/admin/debit", verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId, walletType, amount, note } = req.body;

    if (!userId || !walletType || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "User ID, wallet type and amount are required.",
      });
    }

    const debitAmount = Number(amount);

    if (!Number.isFinite(debitAmount) || debitAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
      });
    }

    const walletKey = walletType.toUpperCase();

    if (!["PKR", "GOLD", "USDT"].includes(walletKey)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet type.",
      });
    }

    const user = await User.findById(userId)
      .select("_id username")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await getOrCreateWallet(user);

    let balanceAfter = 0;

    switch (walletKey) {
      case "PKR":
        if (wallet.availablePkr < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient PKR wallet balance.",
          });
        }

        wallet.pkrBalance -= debitAmount;
        wallet.totalWithdraw += debitAmount;
        wallet.totalPkrWithdraw += debitAmount;
        wallet.lastWithdrawAt = new Date();
        balanceAfter = wallet.pkrBalance;
        break;

      case "GOLD":
        if (wallet.availableGold < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient Gold wallet balance.",
          });
        }

        wallet.goldBalance -= debitAmount;
        wallet.totalGoldSold += debitAmount;
        wallet.lastTradeAt = new Date();
        balanceAfter = wallet.goldBalance;
        break;

      case "USDT":
        if (wallet.availableUsdt < debitAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient USDT wallet balance.",
          });
        }

        wallet.usdtBalance -= debitAmount;
        wallet.totalUsdtWithdrawn += debitAmount;
        wallet.lastWithdrawAt = new Date();
        balanceAfter = wallet.usdtBalance;
        break;
    }

    await wallet.save();

    await WalletHistory.create({
      userId: user._id,
      username: user.username,
      walletType: walletKey,
      type: "DEBIT",
      amount: debitAmount,
      balanceAfter,
      note: note || "Wallet debited by admin",
      admin: req.user.username,
    });

    return res.status(200).json({
      success: true,
      message: `${walletKey} wallet debited successfully.`,
      walletType: walletKey,
      debitedAmount: debitAmount,
      balanceAfter,

      wallet: {
        pkrBalance: wallet.pkrBalance,
        goldBalance: wallet.goldBalance,
        usdtBalance: wallet.usdtBalance,
        portfolioValue: wallet.portfolioValue,
      },
    });

  } catch (error) {
    console.error("ADMIN DEBIT WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to debit wallet.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// walletRoutes.js — PART 5/5 FINAL
// Wallet Refresh + Dashboard Sync + Diagnostics
// Production Ready (Render + PM2 + Ubuntu Linux)
// ======================================================

// ======================================================
// REFRESH LOGGED-IN USER WALLET
// GET /api/wallet/refresh
// Dashboard Auto Refresh API
// ======================================================

router.get("/refresh", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("_id username")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await getOrCreateWallet(user);

    return res.status(200).json({
      success: true,
      username: wallet.username,

      wallet: {
        pkrBalance: wallet.pkrBalance,
        goldBalance: wallet.goldBalance,
        usdtBalance: wallet.usdtBalance,

        lockedPkr: wallet.lockedPkr,
        lockedGold: wallet.lockedGold,
        lockedUsdt: wallet.lockedUsdt,

        availablePkr: wallet.availablePkr,
        availableGold: wallet.availableGold,
        availableUsdt: wallet.availableUsdt,

        portfolioValue: wallet.portfolioValue,
        liveProfit: wallet.liveProfit,
        liveProfitPercent: wallet.liveProfitPercent,

        totalWalletValue: wallet.totalWalletValue,
        status: wallet.status,
      },

      refreshedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("REFRESH WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh wallet.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN REFRESH USER WALLET
// GET /api/wallet/admin/refresh/:userId
// ======================================================

router.get(
  "/admin/refresh/:userId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId)
        .select("_id username email role")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const wallet = await getOrCreateWallet(user);

      return res.status(200).json({
        success: true,

        wallet: {
          username: wallet.username,
          email: user.email,
          role: user.role,

          pkrBalance: wallet.pkrBalance,
          goldBalance: wallet.goldBalance,
          usdtBalance: wallet.usdtBalance,

          availablePkr: wallet.availablePkr,
          availableGold: wallet.availableGold,
          availableUsdt: wallet.availableUsdt,

          lockedPkr: wallet.lockedPkr,
          lockedGold: wallet.lockedGold,
          lockedUsdt: wallet.lockedUsdt,

          portfolioValue: wallet.portfolioValue,
          liveProfit: wallet.liveProfit,
          liveProfitPercent: wallet.liveProfitPercent,

          totalWalletValue: wallet.totalWalletValue,

          totalDeposit: wallet.totalDeposit,
          totalWithdraw: wallet.totalWithdraw,

          status: wallet.status,
          updatedAt: wallet.updatedAt,
        },
      });

    } catch (error) {
      console.error("ADMIN REFRESH WALLET ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to refresh admin wallet.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// WALLET DIAGNOSTICS
// GET /api/wallet/debug
// Used for Backend Testing
// ======================================================

router.get("/debug", verifyToken, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({
      userId: req.user.id,
    }).lean();

    const historyCount = await WalletHistory.countDocuments({
      userId: req.user.id,
    });

    return res.status(200).json({
      success: true,

      module: "GoldTrade Wallet API V18 Enterprise",

      serverTime: new Date().toISOString(),

      authenticatedUser: req.user,

      walletExists: Boolean(wallet),

      wallet,

      walletHistoryCount: historyCount,

      mongodbReady: true,
    });

  } catch (error) {
    console.error("WALLET DEBUG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Wallet diagnostics failed.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN WALLET LIST
// GET /api/wallet/admin/all
// ======================================================

router.get("/admin/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 25, 100);
    const skip = (page - 1) * limit;

    const wallets = await Wallet.find()
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Wallet.countDocuments();

    return res.status(200).json({
      success: true,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      wallets,
    });

  } catch (error) {
    console.error("ADMIN WALLET LIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallets.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// WALLET MODULE STATUS
// GET /api/wallet/status
// ======================================================

router.get("/status", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Wallet API",
    version: "18.0.0 Enterprise",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;