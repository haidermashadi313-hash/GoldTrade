/*
========================================================
 GoldTrade V18 Enterprise Backend
 adminDashboardRoutes.js — PART 1/6
 Admin Dashboard Summary APIs
 Production Ready (Render + PM2 + MongoDB Atlas)
========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");
const GoldTrade = require("../models/GoldTrade");
const UsdtTrade = require("../models/UsdtTrade");
const Transaction = require("../models/Transaction");
const WalletHistory = require("../models/WalletHistory");
const Settings = require("../models/Settings");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// HEALTH CHECK
// GET /api/admin/dashboard/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Admin Dashboard API",
    version: "V18 Enterprise",
    status: "ONLINE",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// DASHBOARD SUMMARY
// GET /api/admin/dashboard
// Used by frontend/app/admin/dashboard/page.tsx
// ======================================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const [
      users,
      wallets,
      pendingDeposits,
      pendingWithdraws,
      approvedDeposits,
      approvedWithdraws,
      goldTrades,
      usdtTrades,
      settings,
    ] = await Promise.all([
      User.countDocuments(),
      Wallet.find({}).lean(),
      Deposit.countDocuments({ status: "PENDING" }),
      Withdraw.countDocuments({ status: "PENDING" }),
      Deposit.find({ status: "APPROVED" }).lean(),
      Withdraw.find({ status: "APPROVED" }).lean(),
      GoldTrade.find({}).lean(),
      UsdtTrade.find({}).lean(),
      Settings.findOne().lean(),
    ]);

    // ==================================================
    // WALLET TOTALS
    // ==================================================

    let totalPKRBalance = 0;
    let totalUSDTBalance = 0;
    let totalGoldBalance = 0;

    wallets.forEach((wallet) => {
      totalPKRBalance += Number(wallet.pkrBalance || 0);
      totalUSDTBalance += Number(wallet.usdtBalance || 0);
      totalGoldBalance += Number(wallet.goldBalance || 0);
    });

    // ==================================================
    // DEPOSIT TOTALS
    // ==================================================

    let totalDepositAmount = 0;

    approvedDeposits.forEach((deposit) => {
      totalDepositAmount += Number(deposit.amount || 0);
    });

    // ==================================================
    // WITHDRAW TOTALS
    // ==================================================

    let totalWithdrawAmount = 0;

    approvedWithdraws.forEach((withdraw) => {
      totalWithdrawAmount += Number(withdraw.amount || 0);
    });

    // ==================================================
    // GOLD TRADE TOTALS
    // ==================================================

    let totalGoldBuyVolume = 0;
    let totalGoldSellVolume = 0;

    goldTrades.forEach((trade) => {
      const qty = Number(trade.quantity || trade.goldQuantity || 0);

      if (trade.tradeType === "BUY") {
        totalGoldBuyVolume += qty;
      }

      if (trade.tradeType === "SELL") {
        totalGoldSellVolume += qty;
      }
    });

    // ==================================================
    // USDT TRADE TOTALS
    // ==================================================

    let totalUsdtBuyVolume = 0;
    let totalUsdtSellVolume = 0;

    usdtTrades.forEach((trade) => {
      const qty = Number(trade.amount || trade.quantity || 0);

      if (trade.tradeType === "BUY") {
        totalUsdtBuyVolume += qty;
      }

      if (trade.tradeType === "SELL") {
        totalUsdtSellVolume += qty;
      }
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,

      dashboard: {
        users,
        wallets: wallets.length,

        pendingDeposits,
        pendingWithdraws,

        totalDepositAmount: Number(totalDepositAmount.toFixed(2)),
        totalWithdrawAmount: Number(totalWithdrawAmount.toFixed(2)),

        totalPKRBalance: Number(totalPKRBalance.toFixed(2)),
        totalUSDTBalance: Number(totalUSDTBalance.toFixed(6)),
        totalGoldBalance: Number(totalGoldBalance.toFixed(6)),

        totalGoldBuyVolume: Number(totalGoldBuyVolume.toFixed(6)),
        totalGoldSellVolume: Number(totalGoldSellVolume.toFixed(6)),

        totalUsdtBuyVolume: Number(totalUsdtBuyVolume.toFixed(6)),
        totalUsdtSellVolume: Number(totalUsdtSellVolume.toFixed(6)),

        goldTradingEnabled:
          settings?.goldTradingEnabled ?? true,

        usdtTradingEnabled:
          settings?.usdtTradingEnabled ?? true,

        marketStatus:
          settings?.marketStatus || "OPEN",
      },

      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("ADMIN DASHBOARD SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard summary.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// adminDashboardRoutes.js — PART 2/6
// Revenue Analytics + Portfolio + Charts APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// REVENUE ANALYTICS
// GET /api/admin/dashboard/revenue
// Used by Admin Revenue Cards
// ======================================================

router.get("/revenue", verifyToken, isAdmin, async (req, res) => {
  try {
    const [
      approvedDeposits,
      approvedWithdraws,
      goldTrades,
      usdtTrades,
      wallets,
    ] = await Promise.all([
      Deposit.find({ status: "APPROVED" }).lean(),
      Withdraw.find({ status: "APPROVED" }).lean(),
      GoldTrade.find({}).lean(),
      UsdtTrade.find({}).lean(),
      Wallet.find({}).lean(),
    ]);

    let depositRevenue = 0;
    let withdrawRevenue = 0;
    let goldBuyValue = 0;
    let goldSellValue = 0;
    let usdtBuyValue = 0;
    let usdtSellValue = 0;

    approvedDeposits.forEach((item) => {
      depositRevenue += Number(item.amount || 0);
    });

    approvedWithdraws.forEach((item) => {
      withdrawRevenue += Number(item.amount || 0);
    });

    goldTrades.forEach((trade) => {
      const value = Number(trade.totalAmount || trade.totalPrice || 0);

      if (trade.tradeType === "BUY") goldBuyValue += value;
      if (trade.tradeType === "SELL") goldSellValue += value;
    });

    usdtTrades.forEach((trade) => {
      const value = Number(trade.totalAmount || trade.amount || 0);

      if (trade.tradeType === "BUY") usdtBuyValue += value;
      if (trade.tradeType === "SELL") usdtSellValue += value;
    });

    const walletTotals = wallets.reduce(
      (acc, wallet) => {
        acc.pkr += Number(wallet.pkrBalance || 0);
        acc.usdt += Number(wallet.usdtBalance || 0);
        acc.gold += Number(wallet.goldBalance || 0);
        return acc;
      },
      { pkr: 0, usdt: 0, gold: 0 }
    );

    return res.status(200).json({
      success: true,

      revenue: {
        deposits: Number(depositRevenue.toFixed(2)),
        withdrawals: Number(withdrawRevenue.toFixed(2)),

        goldBuyValue: Number(goldBuyValue.toFixed(2)),
        goldSellValue: Number(goldSellValue.toFixed(2)),

        usdtBuyValue: Number(usdtBuyValue.toFixed(2)),
        usdtSellValue: Number(usdtSellValue.toFixed(2)),

        totalTradingVolume: Number(
          (
            goldBuyValue +
            goldSellValue +
            usdtBuyValue +
            usdtSellValue
          ).toFixed(2)
        ),

        netCashFlow: Number(
          (depositRevenue - withdrawRevenue).toFixed(2)
        ),
      },

      walletTotals: {
        pkrBalance: Number(walletTotals.pkr.toFixed(2)),
        usdtBalance: Number(walletTotals.usdt.toFixed(6)),
        goldBalance: Number(walletTotals.gold.toFixed(6)),
      },

      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("ADMIN REVENUE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load revenue analytics.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// PORTFOLIO TOTALS
// GET /api/admin/dashboard/portfolio
// Used by Dashboard Portfolio Cards
// ======================================================

router.get("/portfolio", verifyToken, isAdmin, async (req, res) => {
  try {
    const wallets = await Wallet.find({}).lean();

    let totalPKR = 0;
    let totalUSDT = 0;
    let totalGold = 0;

    let totalDeposit = 0;
    let totalWithdraw = 0;

    wallets.forEach((wallet) => {
      totalPKR += Number(wallet.pkrBalance || 0);
      totalUSDT += Number(wallet.usdtBalance || 0);
      totalGold += Number(wallet.goldBalance || 0);

      totalDeposit += Number(wallet.totalDeposit || 0);
      totalWithdraw += Number(wallet.totalWithdraw || 0);
    });

    return res.status(200).json({
      success: true,

      portfolio: {
        totalPKRBalance: Number(totalPKR.toFixed(2)),
        totalUSDTBalance: Number(totalUSDT.toFixed(6)),
        totalGoldBalance: Number(totalGold.toFixed(6)),

        totalDeposit: Number(totalDeposit.toFixed(2)),
        totalWithdraw: Number(totalWithdraw.toFixed(2)),

        activeWallets: wallets.length,
      },
    });

  } catch (error) {
    console.error("PORTFOLIO TOTALS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load portfolio totals.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// DASHBOARD CHART DATA
// GET /api/admin/dashboard/charts
// Monthly Deposits / Withdrawals / Gold / USDT
// ======================================================

router.get("/charts", verifyToken, isAdmin, async (req, res) => {
  try {
    const [deposits, withdrawals, goldTrades, usdtTrades] =
      await Promise.all([
        Deposit.find({ status: "APPROVED" }).lean(),
        Withdraw.find({ status: "APPROVED" }).lean(),
        GoldTrade.find({}).lean(),
        UsdtTrade.find({}).lean(),
      ]);

    const monthly = {};

    const ensureMonth = (month) => {
      if (!monthly[month]) {
        monthly[month] = {
          month,
          deposits: 0,
          withdrawals: 0,
          goldBuy: 0,
          goldSell: 0,
          usdtBuy: 0,
          usdtSell: 0,
        };
      }
    };

    deposits.forEach((item) => {
      const month = new Date(item.createdAt)
        .toISOString()
        .slice(0, 7);

      ensureMonth(month);

      monthly[month].deposits += Number(item.amount || 0);
    });

    withdrawals.forEach((item) => {
      const month = new Date(item.createdAt)
        .toISOString()
        .slice(0, 7);

      ensureMonth(month);

      monthly[month].withdrawals += Number(item.amount || 0);
    });

    goldTrades.forEach((trade) => {
      const month = new Date(trade.createdAt)
        .toISOString()
        .slice(0, 7);

      ensureMonth(month);

      const qty = Number(trade.quantity || trade.goldQuantity || 0);

      if (trade.tradeType === "BUY") monthly[month].goldBuy += qty;
      if (trade.tradeType === "SELL") monthly[month].goldSell += qty;
    });

    usdtTrades.forEach((trade) => {
      const month = new Date(trade.createdAt)
        .toISOString()
        .slice(0, 7);

      ensureMonth(month);

      const qty = Number(trade.amount || trade.quantity || 0);

      if (trade.tradeType === "BUY") monthly[month].usdtBuy += qty;
      if (trade.tradeType === "SELL") monthly[month].usdtSell += qty;
    });

    const charts = Object.values(monthly).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    return res.status(200).json({
      success: true,
      charts,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("DASHBOARD CHART ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard charts.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// LIVE BALANCE SUMMARY
// GET /api/admin/dashboard/live-balances
// Used by Dashboard Balance Widgets
// ======================================================

router.get("/live-balances", verifyToken, isAdmin, async (req, res) => {
  try {
    const wallets = await Wallet.find({}).lean();

    let pkr = 0;
    let usdt = 0;
    let gold = 0;

    wallets.forEach((wallet) => {
      pkr += Number(wallet.pkrBalance || 0);
      usdt += Number(wallet.usdtBalance || 0);
      gold += Number(wallet.goldBalance || 0);
    });

    return res.status(200).json({
      success: true,

      balances: {
        pkr: Number(pkr.toFixed(2)),
        usdt: Number(usdt.toFixed(6)),
        gold: Number(gold.toFixed(6)),
      },

      wallets: wallets.length,
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("LIVE BALANCE SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load live balances.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// adminDashboardRoutes.js — PART 3A/6
// Recent Activity Feed APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// RECENT ACTIVITY FEED
// GET /api/admin/dashboard/activity
// Used by Admin Dashboard Timeline
// ======================================================

router.get("/activity", verifyToken, isAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const [
      deposits,
      withdrawals,
      goldTrades,
      usdtTrades,
    ] = await Promise.all([
      Deposit.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),

      Withdraw.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),

      GoldTrade.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),

      UsdtTrade.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    const activities = [];

    // ============================
    // Deposit Activity
    // ============================

    deposits.forEach((item) => {
      activities.push({
        type: "DEPOSIT",
        status: item.status,
        username: item.username,
        walletType: item.walletType,
        amount: Number(item.amount || 0),
        paymentMethod: item.paymentMethod,
        referenceId: item.referenceId,
        createdAt: item.createdAt,
      });
    });

    // ============================
    // Withdraw Activity
    // ============================

    withdrawals.forEach((item) => {
      activities.push({
        type: "WITHDRAW",
        status: item.status,
        username: item.username,
        walletType: item.walletType,
        amount: Number(item.amount || 0),
        paymentMethod: item.paymentMethod,
        referenceId: item.referenceId,
        createdAt: item.createdAt,
      });
    });

    // ============================
    // Gold Trade Activity
    // ============================

    goldTrades.forEach((trade) => {
      activities.push({
        type: "GOLD_TRADE",
        status: "COMPLETED",
        username: trade.username,
        tradeType: trade.tradeType,
        quantity: Number(trade.quantity || trade.goldQuantity || 0),
        totalAmount: Number(trade.totalAmount || trade.totalPrice || 0),
        createdAt: trade.createdAt,
      });
    });

    // ============================
    // USDT Trade Activity
    // ============================

    usdtTrades.forEach((trade) => {
      activities.push({
        type: "USDT_TRADE",
        status: "COMPLETED",
        username: trade.username,
        tradeType: trade.tradeType,
        quantity: Number(trade.amount || trade.quantity || 0),
        totalAmount: Number(trade.totalAmount || trade.amount || 0),
        createdAt: trade.createdAt,
      });
    });

    // ============================
    // Sort Latest First
    // ============================

    activities.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,
      total: activities.length,
      activity: activities.slice(0, limit),
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("ADMIN ACTIVITY FEED ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load activity feed.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// RECENT DEPOSITS
// GET /api/admin/dashboard/recent-deposits
// Dashboard Widget
// ======================================================

router.get(
  "/recent-deposits",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 50);

      const deposits = await Deposit.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return res.status(200).json({
        success: true,
        total: deposits.length,
        deposits,
      });

    } catch (error) {
      console.error("RECENT DEPOSITS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load recent deposits.",
      });
    }
  }
);

// ======================================================
// RECENT WITHDRAWALS
// GET /api/admin/dashboard/recent-withdrawals
// Dashboard Widget
// ======================================================

router.get(
  "/recent-withdrawals",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 50);

      const withdrawals = await Withdraw.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return res.status(200).json({
        success: true,
        total: withdrawals.length,
        withdrawals,
      });

    } catch (error) {
      console.error("RECENT WITHDRAWALS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load recent withdrawals.",
      });
    }
  }
);
// ======================================================
// GoldTrade V18 Enterprise Backend
// adminDashboardRoutes.js — PART 3B/6 FINAL
// Recent Gold Trades + USDT Trades + User Activity Filters
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// RECENT GOLD TRADES
// GET /api/admin/dashboard/recent-gold-trades
// ======================================================

router.get(
  "/recent-gold-trades",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 50);

      const trades = await GoldTrade.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return res.status(200).json({
        success: true,
        total: trades.length,
        trades,
      });

    } catch (error) {
      console.error("RECENT GOLD TRADES ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load recent gold trades.",
      });
    }
  }
);

// ======================================================
// RECENT USDT TRADES
// GET /api/admin/dashboard/recent-usdt-trades
// ======================================================

router.get(
  "/recent-usdt-trades",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 50);

      const trades = await UsdtTrade.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return res.status(200).json({
        success: true,
        total: trades.length,
        trades,
      });

    } catch (error) {
      console.error("RECENT USDT TRADES ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load recent USDT trades.",
      });
    }
  }
);

// ======================================================
// USER ACTIVITY TIMELINE
// GET /api/admin/dashboard/activity/:username
// ======================================================

router.get(
  "/activity/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username = req.params.username.trim().toLowerCase();

      const [
        deposits,
        withdrawals,
        goldTrades,
        usdtTrades,
      ] = await Promise.all([
        Deposit.find({ username }).lean(),
        Withdraw.find({ username }).lean(),
        GoldTrade.find({ username }).lean(),
        UsdtTrade.find({ username }).lean(),
      ]);

      const activity = [];

      deposits.forEach((item) => {
        activity.push({
          category: "DEPOSIT",
          status: item.status,
          walletType: item.walletType,
          amount: Number(item.amount || 0),
          paymentMethod: item.paymentMethod,
          referenceId: item.referenceId,
          createdAt: item.createdAt,
        });
      });

      withdrawals.forEach((item) => {
        activity.push({
          category: "WITHDRAW",
          status: item.status,
          walletType: item.walletType,
          amount: Number(item.amount || 0),
          paymentMethod: item.paymentMethod,
          referenceId: item.referenceId,
          createdAt: item.createdAt,
        });
      });

      goldTrades.forEach((trade) => {
        activity.push({
          category: "GOLD_TRADE",
          status: "COMPLETED",
          tradeType: trade.tradeType,
          quantity: Number(trade.quantity || trade.goldQuantity || 0),
          totalAmount: Number(trade.totalAmount || trade.totalPrice || 0),
          createdAt: trade.createdAt,
        });
      });

      usdtTrades.forEach((trade) => {
        activity.push({
          category: "USDT_TRADE",
          status: "COMPLETED",
          tradeType: trade.tradeType,
          quantity: Number(trade.amount || trade.quantity || 0),
          totalAmount: Number(trade.totalAmount || trade.amount || 0),
          createdAt: trade.createdAt,
        });
      });

      activity.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      return res.status(200).json({
        success: true,
        username,
        total: activity.length,
        activity,
      });

    } catch (error) {
      console.error("USER ACTIVITY TIMELINE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load user activity timeline.",
      });
    }
  }
);

// ======================================================
// FILTER ACTIVITY
// GET /api/admin/dashboard/activity-filter
// Query:
// ?type=DEPOSIT
// ?status=PENDING
// ?username=hashi
// ======================================================

router.get(
  "/activity-filter",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { type, status, username } = req.query;

      const activity = [];

      // =========================
      // Deposit Filter
      // =========================

      if (!type || type === "DEPOSIT") {
        const query = {};

        if (status) query.status = status.toUpperCase();

        if (username) {
          query.username = username.toLowerCase();
        }

        const deposits = await Deposit.find(query).lean();

        deposits.forEach((item) => {
          activity.push({
            category: "DEPOSIT",
            username: item.username,
            status: item.status,
            walletType: item.walletType,
            amount: Number(item.amount || 0),
            createdAt: item.createdAt,
          });
        });
      }

      // =========================
      // Withdraw Filter
      // =========================

      if (!type || type === "WITHDRAW") {
        const query = {};

        if (status) query.status = status.toUpperCase();

        if (username) {
          query.username = username.toLowerCase();
        }

        const withdrawals = await Withdraw.find(query).lean();

        withdrawals.forEach((item) => {
          activity.push({
            category: "WITHDRAW",
            username: item.username,
            status: item.status,
            walletType: item.walletType,
            amount: Number(item.amount || 0),
            createdAt: item.createdAt,
          });
        });
      }

      // =========================
      // Gold Trade Filter
      // =========================

      if (!type || type === "GOLD_TRADE") {
        const query = {};

        if (username) query.username = username.toLowerCase();

        const trades = await GoldTrade.find(query).lean();

        trades.forEach((trade) => {
          activity.push({
            category: "GOLD_TRADE",
            username: trade.username,
            status: "COMPLETED",
            tradeType: trade.tradeType,
            quantity: Number(trade.quantity || trade.goldQuantity || 0),
            totalAmount: Number(trade.totalAmount || trade.totalPrice || 0),
            createdAt: trade.createdAt,
          });
        });
      }

      // =========================
      // USDT Trade Filter
      // =========================

      if (!type || type === "USDT_TRADE") {
        const query = {};

        if (username) query.username = username.toLowerCase();

        const trades = await UsdtTrade.find(query).lean();

        trades.forEach((trade) => {
          activity.push({
            category: "USDT_TRADE",
            username: trade.username,
            status: "COMPLETED",
            tradeType: trade.tradeType,
            quantity: Number(trade.amount || trade.quantity || 0),
            totalAmount: Number(trade.totalAmount || trade.amount || 0),
            createdAt: trade.createdAt,
          });
        });
      }

      activity.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      return res.status(200).json({
        success: true,
        total: activity.length,
        filters: {
          type: type || "ALL",
          status: status || "ALL",
          username: username || "ALL",
        },
        activity,
      });

    } catch (error) {
      console.error("FILTER ACTIVITY ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to filter dashboard activity.",
      });
    }
  }
);
// ======================================================
// GoldTrade V18 Enterprise Backend
// adminDashboardRoutes.js — PART 4/6
// Monthly Analytics + Growth + Charts APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// MONTHLY ANALYTICS
// GET /api/admin/dashboard/monthly
// ======================================================

router.get("/monthly", verifyToken, isAdmin, async (req, res) => {
  try {
    const [deposits, withdrawals, goldTrades, usdtTrades, users] =
      await Promise.all([
        Deposit.find({ status: "APPROVED" }).lean(),
        Withdraw.find({ status: "APPROVED" }).lean(),
        GoldTrade.find({}).lean(),
        UsdtTrade.find({}).lean(),
        User.find({}).lean(),
      ]);

    const monthly = {};

    const getMonthKey = (date) =>
      new Date(date).toISOString().slice(0, 7);

    const ensureMonth = (month) => {
      if (!monthly[month]) {
        monthly[month] = {
          month,
          deposits: 0,
          withdrawals: 0,
          goldBuy: 0,
          goldSell: 0,
          usdtBuy: 0,
          usdtSell: 0,
          newUsers: 0,
        };
      }
    };

    deposits.forEach((item) => {
      const month = getMonthKey(item.createdAt);
      ensureMonth(month);
      monthly[month].deposits += Number(item.amount || 0);
    });

    withdrawals.forEach((item) => {
      const month = getMonthKey(item.createdAt);
      ensureMonth(month);
      monthly[month].withdrawals += Number(item.amount || 0);
    });

    goldTrades.forEach((trade) => {
      const month = getMonthKey(trade.createdAt);
      ensureMonth(month);

      const qty = Number(trade.quantity || trade.goldQuantity || 0);

      if (trade.tradeType === "BUY") monthly[month].goldBuy += qty;
      if (trade.tradeType === "SELL") monthly[month].goldSell += qty;
    });

    usdtTrades.forEach((trade) => {
      const month = getMonthKey(trade.createdAt);
      ensureMonth(month);

      const qty = Number(trade.amount || trade.quantity || 0);

      if (trade.tradeType === "BUY") monthly[month].usdtBuy += qty;
      if (trade.tradeType === "SELL") monthly[month].usdtSell += qty;
    });

    users.forEach((user) => {
      const month = getMonthKey(user.createdAt);
      ensureMonth(month);
      monthly[month].newUsers += 1;
    });

    return res.status(200).json({
      success: true,
      analytics: Object.values(monthly).sort((a, b) =>
        a.month.localeCompare(b.month)
      ),
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("MONTHLY ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load monthly analytics.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// DAILY / WEEKLY / MONTHLY GROWTH
// GET /api/admin/dashboard/growth
// ======================================================

router.get("/growth", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({ status: "APPROVED" }).lean();

    const now = new Date();

    const daily = new Date(now);
    daily.setDate(now.getDate() - 1);

    const weekly = new Date(now);
    weekly.setDate(now.getDate() - 7);

    const monthly = new Date(now);
    monthly.setMonth(now.getMonth() - 1);

    const growth = {
      daily: 0,
      weekly: 0,
      monthly: 0,
    };

    deposits.forEach((deposit) => {
      const created = new Date(deposit.createdAt);
      const amount = Number(deposit.amount || 0);

      if (created >= daily) growth.daily += amount;
      if (created >= weekly) growth.weekly += amount;
      if (created >= monthly) growth.monthly += amount;
    });

    return res.status(200).json({
      success: true,
      growth: {
        daily: Number(growth.daily.toFixed(2)),
        weekly: Number(growth.weekly.toFixed(2)),
        monthly: Number(growth.monthly.toFixed(2)),
      },
    });

  } catch (error) {
    console.error("GROWTH ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load growth analytics.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// DEPOSIT VS WITHDRAW CHART
// GET /api/admin/dashboard/deposit-vs-withdraw
// ======================================================

router.get(
  "/deposit-vs-withdraw",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const [deposits, withdrawals] = await Promise.all([
        Deposit.find({ status: "APPROVED" }).lean(),
        Withdraw.find({ status: "APPROVED" }).lean(),
      ]);

      const monthly = {};

      const ensureMonth = (month) => {
        if (!monthly[month]) {
          monthly[month] = {
            month,
            deposits: 0,
            withdrawals: 0,
          };
        }
      };

      deposits.forEach((item) => {
        const month = new Date(item.createdAt)
          .toISOString()
          .slice(0, 7);

        ensureMonth(month);

        monthly[month].deposits += Number(item.amount || 0);
      });

      withdrawals.forEach((item) => {
        const month = new Date(item.createdAt)
          .toISOString()
          .slice(0, 7);

        ensureMonth(month);

        monthly[month].withdrawals += Number(item.amount || 0);
      });

      return res.status(200).json({
        success: true,
        chart: Object.values(monthly).sort((a, b) =>
          a.month.localeCompare(b.month)
        ),
      });

    } catch (error) {
      console.error("DEPOSIT VS WITHDRAW CHART ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load deposit vs withdraw chart.",
      });
    }
  }
);

// ======================================================
// GOLD VS USDT VOLUME CHART
// GET /api/admin/dashboard/trading-volume
// ======================================================

router.get(
  "/trading-volume",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const [goldTrades, usdtTrades] = await Promise.all([
        GoldTrade.find({}).lean(),
        UsdtTrade.find({}).lean(),
      ]);

      const monthly = {};

      const ensureMonth = (month) => {
        if (!monthly[month]) {
          monthly[month] = {
            month,
            goldBuy: 0,
            goldSell: 0,
            usdtBuy: 0,
            usdtSell: 0,
          };
        }
      };

      goldTrades.forEach((trade) => {
        const month = new Date(trade.createdAt)
          .toISOString()
          .slice(0, 7);

        ensureMonth(month);

        const qty = Number(trade.quantity || trade.goldQuantity || 0);

        if (trade.tradeType === "BUY") monthly[month].goldBuy += qty;
        if (trade.tradeType === "SELL") monthly[month].goldSell += qty;
      });

      usdtTrades.forEach((trade) => {
        const month = new Date(trade.createdAt)
          .toISOString()
          .slice(0, 7);

        ensureMonth(month);

        const qty = Number(trade.amount || trade.quantity || 0);

        if (trade.tradeType === "BUY") monthly[month].usdtBuy += qty;
        if (trade.tradeType === "SELL") monthly[month].usdtSell += qty;
      });

      return res.status(200).json({
        success: true,
        chart: Object.values(monthly).sort((a, b) =>
          a.month.localeCompare(b.month)
        ),
      });

    } catch (error) {
      console.error("TRADING VOLUME CHART ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load trading volume chart.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// GoldTrade V18 Enterprise Backend
// adminDashboardRoutes.js — PART 5/6
// Leaderboards + Pending Summary APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// TOP DEPOSIT USERS
// GET /api/admin/dashboard/top-deposit-users
// ======================================================

router.get("/top-deposit-users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await Deposit.aggregate([
      { $match: { status: "APPROVED" } },
      {
        $group: {
          _id: "$username",
          totalDeposits: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          lastDeposit: { $max: "$createdAt" },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 20 },
    ]);

    return res.status(200).json({
      success: true,
      total: users.length,
      users: users.map((user, index) => ({
        rank: index + 1,
        username: user._id,
        totalDeposits: user.totalDeposits,
        totalAmount: Number(user.totalAmount.toFixed(2)),
        lastDeposit: user.lastDeposit,
      })),
    });

  } catch (error) {
    console.error("TOP DEPOSIT USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load top deposit users.",
    });
  }
});

// ======================================================
// TOP WITHDRAW USERS
// GET /api/admin/dashboard/top-withdraw-users
// ======================================================

router.get("/top-withdraw-users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await Withdraw.aggregate([
      { $match: { status: "APPROVED" } },
      {
        $group: {
          _id: "$username",
          totalWithdrawals: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          lastWithdraw: { $max: "$createdAt" },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 20 },
    ]);

    return res.status(200).json({
      success: true,
      total: users.length,
      users: users.map((user, index) => ({
        rank: index + 1,
        username: user._id,
        totalWithdrawals: user.totalWithdrawals,
        totalAmount: Number(user.totalAmount.toFixed(2)),
        lastWithdraw: user.lastWithdraw,
      })),
    });

  } catch (error) {
    console.error("TOP WITHDRAW USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load top withdraw users.",
    });
  }
});

// ======================================================
// TOP GOLD TRADERS
// GET /api/admin/dashboard/top-gold-traders
// ======================================================

router.get("/top-gold-traders", verifyToken, isAdmin, async (req, res) => {
  try {
    const traders = await GoldTrade.aggregate([
      {
        $group: {
          _id: "$username",
          trades: { $sum: 1 },
          goldVolume: {
            $sum: {
              $ifNull: ["$quantity", "$goldQuantity"],
            },
          },
          totalAmount: {
            $sum: {
              $ifNull: ["$totalAmount", "$totalPrice"],
            },
          },
          lastTrade: { $max: "$createdAt" },
        },
      },
      { $sort: { goldVolume: -1 } },
      { $limit: 20 },
    ]);

    return res.status(200).json({
      success: true,
      total: traders.length,
      traders: traders.map((trader, index) => ({
        rank: index + 1,
        username: trader._id,
        trades: trader.trades,
        goldVolume: Number((trader.goldVolume || 0).toFixed(6)),
        totalAmount: Number((trader.totalAmount || 0).toFixed(2)),
        lastTrade: trader.lastTrade,
      })),
    });

  } catch (error) {
    console.error("TOP GOLD TRADERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load top gold traders.",
    });
  }
});

// ======================================================
// TOP USDT TRADERS
// GET /api/admin/dashboard/top-usdt-traders
// ======================================================

router.get("/top-usdt-traders", verifyToken, isAdmin, async (req, res) => {
  try {
    const traders = await UsdtTrade.aggregate([
      {
        $group: {
          _id: "$username",
          trades: { $sum: 1 },
          usdtVolume: {
            $sum: {
              $ifNull: ["$amount", "$quantity"],
            },
          },
          totalAmount: {
            $sum: {
              $ifNull: ["$totalAmount", "$amount"],
            },
          },
          lastTrade: { $max: "$createdAt" },
        },
      },
      { $sort: { usdtVolume: -1 } },
      { $limit: 20 },
    ]);

    return res.status(200).json({
      success: true,
      total: traders.length,
      traders: traders.map((trader, index) => ({
        rank: index + 1,
        username: trader._id,
        trades: trader.trades,
        usdtVolume: Number((trader.usdtVolume || 0).toFixed(6)),
        totalAmount: Number((trader.totalAmount || 0).toFixed(2)),
        lastTrade: trader.lastTrade,
      })),
    });

  } catch (error) {
    console.error("TOP USDT TRADERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load top USDT traders.",
    });
  }
});

// ======================================================
// TOP WALLET HOLDERS
// GET /api/admin/dashboard/top-wallets
// ======================================================

router.get("/top-wallets", verifyToken, isAdmin, async (req, res) => {
  try {
    const wallets = await Wallet.find({})
      .sort({ pkrBalance: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      total: wallets.length,
      wallets: wallets.map((wallet, index) => ({
        rank: index + 1,
        username: wallet.username,
        pkrBalance: Number(wallet.pkrBalance || 0),
        usdtBalance: Number(wallet.usdtBalance || 0),
        goldBalance: Number(wallet.goldBalance || 0),
        totalDeposit: Number(wallet.totalDeposit || 0),
        totalWithdraw: Number(wallet.totalWithdraw || 0),
      })),
    });

  } catch (error) {
    console.error("TOP WALLET HOLDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet leaderboard.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// adminDashboardRoutes.js — PART 6/6 FINAL
// Debug + Export + Health + Routes + Final Export
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// DASHBOARD EXPORT SUMMARY
// GET /api/admin/dashboard/export
// ======================================================

router.get("/export", verifyToken, isAdmin, async (req, res) => {
  try {
    const [
      users,
      wallets,
      deposits,
      withdrawals,
      goldTrades,
      usdtTrades,
    ] = await Promise.all([
      User.countDocuments(),
      Wallet.countDocuments(),
      Deposit.countDocuments(),
      Withdraw.countDocuments(),
      GoldTrade.countDocuments(),
      UsdtTrade.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      exportedAt: new Date().toISOString(),
      summary: {
        users,
        wallets,
        deposits,
        withdrawals,
        goldTrades,
        usdtTrades,
      },
    });
  } catch (error) {
    console.error("DASHBOARD EXPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to export dashboard summary.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// DASHBOARD DEBUG
// GET /api/admin/dashboard/debug
// ======================================================

router.get("/debug", verifyToken, isAdmin, async (req, res) => {
  try {
    const [
      users,
      wallets,
      deposits,
      withdrawals,
      transactions,
      walletHistory,
      settings,
    ] = await Promise.all([
      User.countDocuments(),
      Wallet.countDocuments(),
      Deposit.countDocuments(),
      Withdraw.countDocuments(),
      Transaction.countDocuments(),
      WalletHistory.countDocuments(),
      Settings.findOne().lean(),
    ]);

    return res.status(200).json({
      success: true,
      diagnostics: {
        module: "Admin Dashboard API V18 Enterprise",

        authenticatedAdmin: req.user.username,
        adminRole: req.user.role,

        users,
        wallets,
        deposits,
        withdrawals,
        transactions,
        walletHistory,

        goldTradingEnabled:
          settings?.goldTradingEnabled ?? true,

        usdtTradingEnabled:
          settings?.usdtTradingEnabled ?? true,

        marketStatus:
          settings?.marketStatus || "OPEN",
      },
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("ADMIN DASHBOARD DEBUG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to run diagnostics.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ROUTES LIST
// GET /api/admin/dashboard/routes
// ======================================================

router.get("/routes", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "GoldTrade V18 Enterprise Admin Dashboard API",
    version: "18.0.0",

    routes: [
      // Health
      "GET /api/admin/dashboard/health",
      "GET /api/admin/dashboard/routes",
      "GET /api/admin/dashboard/debug",
      "GET /api/admin/dashboard/export",

      // Summary
      "GET /api/admin/dashboard",
      "GET /api/admin/dashboard/revenue",
      "GET /api/admin/dashboard/portfolio",
      "GET /api/admin/dashboard/live-balances",

      // Charts
      "GET /api/admin/dashboard/charts",
      "GET /api/admin/dashboard/monthly",
      "GET /api/admin/dashboard/growth",
      "GET /api/admin/dashboard/deposit-vs-withdraw",
      "GET /api/admin/dashboard/trading-volume",
      "GET /api/admin/dashboard/user-growth",

      // Activity
      "GET /api/admin/dashboard/activity",
      "GET /api/admin/dashboard/activity/:username",
      "GET /api/admin/dashboard/activity-filter",
      "GET /api/admin/dashboard/recent-deposits",
      "GET /api/admin/dashboard/recent-withdrawals",
      "GET /api/admin/dashboard/recent-gold-trades",
      "GET /api/admin/dashboard/recent-usdt-trades",

      // Leaderboards
      "GET /api/admin/dashboard/top-deposit-users",
      "GET /api/admin/dashboard/top-withdraw-users",
      "GET /api/admin/dashboard/top-gold-traders",
      "GET /api/admin/dashboard/top-usdt-traders",
      "GET /api/admin/dashboard/top-wallets",

      // Pending + System
      "GET /api/admin/dashboard/pending-summary",
      "GET /api/admin/dashboard/system-overview",
    ],

    totalRoutes: 24,
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// HEALTH DIAGNOSTICS
// GET /api/admin/dashboard/status
// ======================================================

router.get("/status", verifyToken, isAdmin, async (req, res) => {
  try {
    const mongoReady = !!Settings.db.readyState;

    return res.status(200).json({
      success: true,
      service: "GoldTrade V18 Admin Dashboard",
      backend: "ONLINE",
      mongodb: mongoReady ? "CONNECTED" : "DISCONNECTED",
      nodeEnv: process.env.NODE_ENV || "development",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      backend: "ONLINE",
      mongodb: "UNKNOWN",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// FINAL ROUTER EXPORT
// ======================================================

module.exports = router;