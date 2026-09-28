// ======================================================
// GoldTrade V18 Enterprise Backend
// usdtRoutes.js — PART 1/8
// Health + Status + Live USDT Price APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

"use strict";

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const UsdtTrade = require("../models/UsdtTrade");
const WalletHistory = require("../models/WalletHistory");
const Transaction = require("../models/Transaction");
const Settings = require("../models/Settings");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// DEFAULT USDT SETTINGS
// Auto-create if Settings document doesn't exist
// ======================================================

const DEFAULT_USDT_SETTINGS = {
  usdtBuyPrice: 320,
  usdtSellPrice: 318,
  usdToPkr: 320,
  usdtTradingEnabled: true,
};

// ======================================================
// GET SETTINGS OR CREATE DEFAULT
// ======================================================

const getUsdtSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create(DEFAULT_USDT_SETTINGS);
    console.log("🟢 Default USDT Settings Created");
  }

  return settings;
};

// ======================================================
// HEALTH CHECK
// GET /api/usdt/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "USDT Trading API",
    version: "18.0.0 Enterprise",
    status: "ONLINE",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// API STATUS
// GET /api/usdt/status
// ======================================================

router.get("/status", async (req, res) => {
  try {
    const settings = await getUsdtSettings();

    return res.status(200).json({
      success: true,
      module: "USDT Trading API",
      version: "18.0.0 Enterprise",

      tradingEnabled: settings.usdtTradingEnabled,
      marketStatus: settings.marketStatus,

      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error("USDT STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT API status.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise
// LIVE USDT PRICE API (IQ1000 FINAL)
// GET /api/usdt/price
// GET /api/usdt/rates
// Used by Dashboard / Buy USDT / Sell USDT / Admin
// ======================================================

const sendUsdtResponse = async (req, res) => {
  try {
    const settings = await getUsdtSettings();

    const buyPrice = Number(settings.usdtBuyPrice || 0);
    const sellPrice = Number(settings.usdtSellPrice || 0);

    return res.status(200).json({
      success: true,

      buyPrice,
      sellPrice,

      // Compatibility with dashboard
      usdtBuyPrice: buyPrice,
      usdtSellPrice: sellPrice,

      usdToPkr: Number(settings.usdToPkr || 0),

      tradingEnabled: Boolean(settings.usdtTradingEnabled),
      marketStatus: settings.marketStatus || "OPEN",

      spread: buyPrice - sellPrice,

      updatedAt: settings.updatedAt,
      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error("USDT PRICE API ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT market price.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
};

// ======================================================
// GET /api/usdt/price
// ======================================================

router.get("/price", sendUsdtResponse);

// ======================================================
// GET /api/usdt/rates
// (Alias for Admin Dashboard & Frontend)
// ======================================================

router.get("/rates", sendUsdtResponse);

// ======================================================
// GET CURRENT USER WALLET
// GET /api/usdt/wallet
// Used by frontend/app/usdt/* pages
// ======================================================

router.get("/wallet", verifyToken, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({
      userId: req.user.id,
    }).lean();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.status(200).json({
      success: true,

      wallet: {
        pkrBalance: Number(wallet.pkrBalance),
        goldBalance: Number(wallet.goldBalance),
        usdtBalance: Number(wallet.usdtBalance),

        lockedPkr: Number(wallet.lockedPkr),
        lockedGold: Number(wallet.lockedGold),
        lockedUsdt: Number(wallet.lockedUsdt),

        portfolioValue: Number(wallet.portfolioValue),
        liveProfit: Number(wallet.liveProfit),
        liveProfitPercent: Number(wallet.liveProfitPercent),
      },

      updatedAt: wallet.updatedAt,
    });

  } catch (error) {
    console.error("GET USDT WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT wallet.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET CURRENT USER USDT BALANCE
// GET /api/usdt/balance
// Used by Dashboard Cards
// ======================================================

router.get("/balance", verifyToken, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({
      userId: req.user.id,
    }).lean();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.status(200).json({
      success: true,

      username: req.user.username,

      balances: {
        pkrBalance: Number(wallet.pkrBalance),
        usdtBalance: Number(wallet.usdtBalance),
        goldBalance: Number(wallet.goldBalance),
      },

      available: {
        pkr: Number(wallet.availablePkr),
        usdt: Number(wallet.availableUsdt),
      },

      updatedAt: wallet.updatedAt,
    });

  } catch (error) {
    console.error("GET USDT BALANCE ERROR:", error);

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
// GoldTrade V18 Enterprise Backend
// usdtRoutes.js — PART 2/8
// BUY USDT API + Wallet + Transaction Sync
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// BUY USDT
// POST /api/usdt/buy
// Used by frontend/app/usdt/buy/page.tsx
// ======================================================

router.post("/buy", verifyToken, async (req, res) => {
  try {
    const { quantity } = req.body;

    const usdtQty = Number(quantity);

    if (!Number.isFinite(usdtQty) || usdtQty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid USDT quantity is required.",
      });
    }

    // --------------------------------------------------
    // USER
    // --------------------------------------------------

    const user = await User.findById(req.user.id)
      .select("_id username email")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // --------------------------------------------------
    // WALLET
    // --------------------------------------------------

    const wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    // --------------------------------------------------
    // SETTINGS
    // --------------------------------------------------

    const settings = await getUsdtSettings();

    if (!settings.usdtTradingEnabled) {
      return res.status(403).json({
        success: false,
        message: "USDT trading is currently disabled.",
      });
    }

    if (settings.marketStatus !== "OPEN") {
      return res.status(403).json({
        success: false,
        message: "USDT market is currently closed.",
      });
    }

    const buyPrice = Number(settings.usdtBuyPrice);

    const totalAmount = Number((usdtQty * buyPrice).toFixed(2));

    // --------------------------------------------------
    // BALANCE CHECK
    // --------------------------------------------------

    if (wallet.availablePkr < totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient PKR balance.",
        required: totalAmount,
        available: wallet.availablePkr,
      });
    }

    // --------------------------------------------------
    // WALLET SNAPSHOT BEFORE
    // --------------------------------------------------

    const walletBefore = {
      pkrBalance: wallet.pkrBalance,
      goldBalance: wallet.goldBalance,
      usdtBalance: wallet.usdtBalance,
    };

    // --------------------------------------------------
    // UPDATE WALLET
    // --------------------------------------------------

    wallet.pkrBalance -= totalAmount;
    wallet.usdtBalance += usdtQty;

    wallet.totalUsdtDeposited += usdtQty;
    wallet.lastTradeAt = new Date();

    await wallet.save();

    const walletAfter = {
      pkrBalance: wallet.pkrBalance,
      goldBalance: wallet.goldBalance,
      usdtBalance: wallet.usdtBalance,
    };

    // --------------------------------------------------
    // CREATE USDT TRADE
    // --------------------------------------------------

    const trade = await UsdtTrade.create({
      userId: user._id,
      username: user.username,

      tradeType: "BUY",
      quantity: usdtQty,
      remainingQuantity: usdtQty,

      buyPrice,
      marketPrice: buyPrice,
      usdToPkrRate: Number(settings.usdToPkr),

      totalAmount,
      investedAmount: totalAmount,

      walletBefore,
      walletAfter,

      paymentMethod: "PKR Wallet",
      blockchainNetwork: "TRC20",

      note: "USDT purchased successfully.",
    });

    // --------------------------------------------------
    // TRANSACTION LEDGER
    // --------------------------------------------------

    await Transaction.create({
      userId: user._id,
      username: user.username,

      walletType: "PKR",
      transactionType: "BUY_USDT",
      transactionMode: "DEBIT",

      amount: totalAmount,
      balanceBefore: walletBefore.pkrBalance,
      balanceAfter: walletAfter.pkrBalance,

      status: "Completed",

      referenceId: trade._id.toString(),
      note: `Purchased ${usdtQty} USDT`,
    });

    // --------------------------------------------------
    // WALLET HISTORY
    // --------------------------------------------------

    await WalletHistory.create({
      userId: user._id,
      username: user.username,

      walletType: "USDT",
      type: "BUY",

      amount: usdtQty,
      balanceBefore: walletBefore.usdtBalance,
      balanceAfter: walletAfter.usdtBalance,

      referenceId: trade._id.toString(),
      note: `Purchased ${usdtQty} USDT`,
    });

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "USDT purchased successfully.",

      trade: {
        id: trade._id,
        quantity: trade.quantity,
        buyPrice: trade.buyPrice,
        totalAmount: trade.totalAmount,
        createdAt: trade.createdAt,
      },

      wallet: {
        pkrBalance: wallet.pkrBalance,
        goldBalance: wallet.goldBalance,
        usdtBalance: wallet.usdtBalance,
      },
    });

  } catch (error) {
    console.error("BUY USDT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to purchase USDT.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// usdtRoutes.js — PART 3/8
// SELL USDT API + FIFO Profit/Loss + Wallet Sync
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// SELL USDT
// POST /api/usdt/sell
// Used by frontend/app/usdt/sell/page.tsx
// ======================================================

router.post("/sell", verifyToken, async (req, res) => {
  try {
    const { quantity } = req.body;

    const usdtQty = Number(quantity);

    if (!Number.isFinite(usdtQty) || usdtQty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid USDT quantity is required.",
      });
    }

    // ==================================================
    // USER
    // ==================================================

    const user = await User.findById(req.user.id)
      .select("_id username email")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ==================================================
    // WALLET
    // ==================================================

    const wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    // ==================================================
    // SETTINGS
    // ==================================================

    const settings = await getUsdtSettings();

    if (!settings.usdtTradingEnabled) {
      return res.status(403).json({
        success: false,
        message: "USDT trading is currently disabled.",
      });
    }

    if (settings.marketStatus !== "OPEN") {
      return res.status(403).json({
        success: false,
        message: "USDT market is currently closed.",
      });
    }

    // ==================================================
    // BALANCE CHECK
    // ==================================================

    if (wallet.availableUsdt < usdtQty) {
      return res.status(400).json({
        success: false,
        message: "Insufficient USDT balance.",
        required: usdtQty,
        available: wallet.availableUsdt,
      });
    }

    const sellPrice = Number(settings.usdtSellPrice);
    const totalAmount = Number((usdtQty * sellPrice).toFixed(2));

    // ==================================================
    // FIFO PROFIT / LOSS CALCULATION
    // ==================================================

    const buyTrades = await UsdtTrade.find({
      userId: user._id,
      tradeType: "BUY",
      remainingQuantity: { $gt: 0 },
      status: "COMPLETED",
    }).sort({ createdAt: 1 });

    let remainingToSell = usdtQty;
    let investedAmount = 0;

    for (const trade of buyTrades) {
      if (remainingToSell <= 0) break;

      const availableQty = Number(trade.remainingQuantity || 0);

      if (availableQty <= 0) continue;

      const sellQty = Math.min(availableQty, remainingToSell);

      investedAmount += sellQty * Number(trade.buyPrice);

      trade.remainingQuantity -= sellQty;
      trade.soldQuantity += sellQty;

      await trade.save();

      remainingToSell -= sellQty;
    }

    const profitLoss = Number(
      (totalAmount - investedAmount).toFixed(2)
    );

    const profitLossPercent =
      investedAmount > 0
        ? Number(((profitLoss / investedAmount) * 100).toFixed(2))
        : 0;

    // ==================================================
    // WALLET SNAPSHOT
    // ==================================================

    const walletBefore = {
      pkrBalance: wallet.pkrBalance,
      goldBalance: wallet.goldBalance,
      usdtBalance: wallet.usdtBalance,
    };

    wallet.usdtBalance -= usdtQty;
    wallet.pkrBalance += totalAmount;

    wallet.totalUsdtWithdrawn += usdtQty;
    wallet.lastTradeAt = new Date();

    wallet.portfolioValue = Number(
      (wallet.usdtBalance * settings.usdtSellPrice).toFixed(2)
    );

    wallet.liveProfit += profitLoss;

    await wallet.save();

    const walletAfter = {
      pkrBalance: wallet.pkrBalance,
      goldBalance: wallet.goldBalance,
      usdtBalance: wallet.usdtBalance,
    };

    // ==================================================
    // CREATE SELL TRADE
    // ==================================================

    const sellTrade = await UsdtTrade.create({
      userId: user._id,
      username: user.username,

      tradeType: "SELL",

      quantity: usdtQty,
      soldQuantity: usdtQty,
      remainingQuantity: 0,

      sellPrice,
      marketPrice: sellPrice,
      usdToPkrRate: Number(settings.usdToPkr),

      totalAmount,
      investedAmount,

      profitLoss,
      profitLossPercent,

      walletBefore,
      walletAfter,

      paymentMethod: "PKR Wallet",
      blockchainNetwork: "TRC20",

      note: "USDT sold successfully.",
    });

    // ==================================================
    // TRANSACTION LEDGER
    // ==================================================

    await Transaction.create({
      userId: user._id,
      username: user.username,

      walletType: "PKR",
      transactionType: "SELL_USDT",
      transactionMode: "CREDIT",

      amount: totalAmount,
      balanceBefore: walletBefore.pkrBalance,
      balanceAfter: walletAfter.pkrBalance,

      status: "Completed",

      referenceId: sellTrade._id.toString(),
      note: `Sold ${usdtQty} USDT`,
    });

    // ==================================================
    // WALLET HISTORY
    // ==================================================

    await WalletHistory.create({
      userId: user._id,
      username: user.username,

      walletType: "USDT",
      type: "SELL",

      amount: usdtQty,
      balanceBefore: walletBefore.usdtBalance,
      balanceAfter: walletAfter.usdtBalance,

      referenceId: sellTrade._id.toString(),
      note: `Sold ${usdtQty} USDT`,
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,
      message: "USDT sold successfully.",

      trade: {
        id: sellTrade._id,
        quantity: sellTrade.quantity,
        sellPrice: sellTrade.sellPrice,
        totalAmount: sellTrade.totalAmount,
        investedAmount: sellTrade.investedAmount,
        profitLoss: sellTrade.profitLoss,
        profitLossPercent: sellTrade.profitLossPercent,
        createdAt: sellTrade.createdAt,
      },

      wallet: {
        pkrBalance: wallet.pkrBalance,
        goldBalance: wallet.goldBalance,
        usdtBalance: wallet.usdtBalance,
        portfolioValue: wallet.portfolioValue,
        liveProfit: wallet.liveProfit,
      },
    });

  } catch (error) {
    console.error("SELL USDT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to sell USDT.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// usdtRoutes.js — PART 4/8
// USDT Portfolio APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET CURRENT USER USDT PORTFOLIO
// GET /api/usdt/portfolio
// Used by frontend/app/usdt/portfolio/page.tsx
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

    const wallet = await Wallet.findOne({ userId: user._id }).lean();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const settings = await getUsdtSettings();

    // Active BUY trades only
    const holdings = await UsdtTrade.find({
      userId: user._id,
      tradeType: "BUY",
      remainingQuantity: { $gt: 0 },
      status: "COMPLETED",
    })
      .sort({ createdAt: 1 })
      .lean();

    let totalUsdt = 0;
    let investedAmount = 0;

    const positions = holdings.map((trade) => {
      const qty = Number(trade.remainingQuantity || 0);

      totalUsdt += qty;
      investedAmount += qty * Number(trade.buyPrice);

      const currentValue = qty * Number(settings.usdtSellPrice);
      const pnl = currentValue - qty * Number(trade.buyPrice);

      return {
        tradeId: trade._id,
        quantity: qty,

        buyPrice: Number(trade.buyPrice),
        currentPrice: Number(settings.usdtSellPrice),

        investedAmount: Number((qty * trade.buyPrice).toFixed(2)),
        currentValue: Number(currentValue.toFixed(2)),

        profitLoss: Number(pnl.toFixed(2)),
        createdAt: trade.createdAt,
      };
    });

    const currentValue = Number(
      (totalUsdt * settings.usdtSellPrice).toFixed(2)
    );

    const totalProfitLoss = Number(
      (currentValue - investedAmount).toFixed(2)
    );

    const totalProfitPercent =
      investedAmount > 0
        ? Number(
            ((totalProfitLoss / investedAmount) * 100).toFixed(2)
          )
        : 0;

    return res.status(200).json({
      success: true,

      portfolio: {
        username: user.username,

        usdtBalance: Number(wallet.usdtBalance),
        totalUsdt: Number(totalUsdt.toFixed(6)),

        buyPrice: Number(settings.usdtBuyPrice),
        sellPrice: Number(settings.usdtSellPrice),

        investedAmount: Number(investedAmount.toFixed(2)),
        currentValue,

        profitLoss: totalProfitLoss,
        profitLossPercent: totalProfitPercent,

        totalPositions: positions.length,
        positions,

        updatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error("GET USDT PORTFOLIO ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT portfolio.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET USER PORTFOLIO BY USERNAME
// GET /api/usdt/portfolio/:username
// Admin or Same User
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

    const wallet = await Wallet.findOne({ userId: user._id }).lean();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const settings = await getUsdtSettings();

    const holdings = await UsdtTrade.find({
      userId: user._id,
      tradeType: "BUY",
      remainingQuantity: { $gt: 0 },
      status: "COMPLETED",
    }).lean();

    let totalUsdt = 0;
    let investedAmount = 0;

    holdings.forEach((trade) => {
      totalUsdt += Number(trade.remainingQuantity || 0);
      investedAmount +=
        Number(trade.remainingQuantity || 0) * Number(trade.buyPrice);
    });

    const currentValue = Number(
      (totalUsdt * settings.usdtSellPrice).toFixed(2)
    );

    const profitLoss = Number(
      (currentValue - investedAmount).toFixed(2)
    );

    const profitLossPercent =
      investedAmount > 0
        ? Number(((profitLoss / investedAmount) * 100).toFixed(2))
        : 0;

    return res.status(200).json({
      success: true,

      portfolio: {
        username: user.username,
        email: user.email,
        role: user.role,

        usdtBalance: Number(wallet.usdtBalance),
        totalUsdt: Number(totalUsdt.toFixed(6)),

        investedAmount: Number(investedAmount.toFixed(2)),
        currentValue,

        profitLoss,
        profitLossPercent,

        totalPositions: holdings.length,

        updatedAt: wallet.updatedAt,
      },
    });

  } catch (error) {
    console.error("GET USER USDT PORTFOLIO ERROR:", error);

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
// GET CURRENT USDT HOLDINGS
// GET /api/usdt/holdings
// Used by Dashboard Cards
// ======================================================

router.get("/holdings", verifyToken, async (req, res) => {
  try {
    const holdings = await UsdtTrade.find({
      userId: req.user.id,
      tradeType: "BUY",
      remainingQuantity: { $gt: 0 },
      status: "COMPLETED",
    })
      .sort({ createdAt: 1 })
      .lean();

    const settings = await getUsdtSettings();

    const data = holdings.map((trade) => {
      const qty = Number(trade.remainingQuantity || 0);

      return {
        tradeId: trade._id,
        quantity: qty,
        buyPrice: Number(trade.buyPrice),
        currentPrice: Number(settings.usdtSellPrice),
        currentValue: Number((qty * settings.usdtSellPrice).toFixed(2)),
        createdAt: trade.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      total: data.length,
      holdings: data,
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("GET USDT HOLDINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT holdings.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// usdtRoutes.js — PART 5A/8
// USDT History APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET CURRENT USER USDT HISTORY
// GET /api/usdt/history
// Used by frontend/app/usdt/history/page.tsx
// ======================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const total = await UsdtTrade.countDocuments({
      userId: req.user.id,
    });

    const trades = await UsdtTrade.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      history: trades.map((trade) => ({
        id: trade._id,
        tradeType: trade.tradeType,
        quantity: Number(trade.quantity),
        remainingQuantity: Number(trade.remainingQuantity || 0),

        buyPrice: Number(trade.buyPrice || 0),
        sellPrice: Number(trade.sellPrice || 0),
        marketPrice: Number(trade.marketPrice || 0),

        totalAmount: Number(trade.totalAmount),
        investedAmount: Number(trade.investedAmount || 0),

        profitLoss: Number(trade.profitLoss || 0),
        profitLossPercent: Number(trade.profitLossPercent || 0),

        status: trade.status,
        paymentMethod: trade.paymentMethod,
        blockchainNetwork: trade.blockchainNetwork,
        referenceId: trade.referenceId,

        createdAt: trade.createdAt,
        updatedAt: trade.updatedAt,
      })),
    });

  } catch (error) {
    console.error("GET USDT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET USER HISTORY BY USERNAME
// GET /api/usdt/history/:username
// Admin or Same User
// ======================================================

router.get("/history/:username", verifyToken, async (req, res) => {
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
      .select("_id username")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const total = await UsdtTrade.countDocuments({
      userId: user._id,
    });

    const trades = await UsdtTrade.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,

      username: user.username,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      history: trades,
    });

  } catch (error) {
    console.error("GET USER USDT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user USDT history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET HISTORY BY DATE RANGE
// GET /api/usdt/history/filter
// Query:
// ?start=2026-01-01&end=2026-01-31
// ======================================================

router.get("/history/filter", verifyToken, async (req, res) => {
  try {
    const { start, end } = req.query;

    const query = {
      userId: req.user.id,
    };

    if (start || end) {
      query.createdAt = {};

      if (start) {
        query.createdAt.$gte = new Date(start);
      }

      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const trades = await UsdtTrade.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: trades.length,
      history: trades,
    });

  } catch (error) {
    console.error("FILTER USDT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to filter USDT history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// usdtRoutes.js — PART 5B/8 FINAL
// Recent Trades + Search + Dashboard Activity + Summary
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET RECENT USDT TRADES
// GET /api/usdt/recent
// Dashboard Recent Activity
// ======================================================

router.get("/recent", verifyToken, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const trades = await UsdtTrade.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      total: trades.length,
      recentTrades: trades,
    });

  } catch (error) {
    console.error("GET RECENT USDT TRADES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent trades.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// SEARCH USDT HISTORY
// GET /api/usdt/history/search
// Query:
// ?type=BUY
// ?status=COMPLETED
// ?reference=ABC123
// ======================================================

router.get("/history/search", verifyToken, async (req, res) => {
  try {
    const { type, status, reference } = req.query;

    const query = {
      userId: req.user.id,
    };

    if (type) {
      query.tradeType = String(type).toUpperCase();
    }

    if (status) {
      query.status = String(status).toUpperCase();
    }

    if (reference) {
      query.referenceId = {
        $regex: reference,
        $options: "i",
      };
    }

    const trades = await UsdtTrade.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: trades.length,
      history: trades,
    });

  } catch (error) {
    console.error("SEARCH USDT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search USDT history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// DASHBOARD ACTIVITY FEED
// GET /api/usdt/activity
// Used by Dashboard Activity Widget
// ======================================================

router.get("/activity", verifyToken, async (req, res) => {
  try {
    const trades = await UsdtTrade.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    const activity = trades.map((trade) => ({
      id: trade._id,
      type: trade.tradeType,
      quantity: Number(trade.quantity),
      amount: Number(trade.totalAmount),
      status: trade.status,
      note: trade.note || "",
      createdAt: trade.createdAt,
    }));

    return res.status(200).json({
      success: true,
      total: activity.length,
      activity,
    });

  } catch (error) {
    console.error("USDT ACTIVITY ERROR:", error);

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
// USDT HISTORY SUMMARY
// GET /api/usdt/history/summary
// Dashboard Statistics Cards
// ======================================================

router.get("/history/summary", verifyToken, async (req, res) => {
  try {
    const trades = await UsdtTrade.find({
      userId: req.user.id,
      status: "COMPLETED",
    }).lean();

    let totalBuy = 0;
    let totalSell = 0;
    let totalInvested = 0;
    let totalReceived = 0;
    let totalProfit = 0;

    trades.forEach((trade) => {
      if (trade.tradeType === "BUY") {
        totalBuy += Number(trade.quantity);
        totalInvested += Number(trade.totalAmount);
      }

      if (trade.tradeType === "SELL") {
        totalSell += Number(trade.quantity);
        totalReceived += Number(trade.totalAmount);
        totalProfit += Number(trade.profitLoss || 0);
      }
    });

    return res.status(200).json({
      success: true,

      summary: {
        totalTrades: trades.length,

        totalBuyUSDT: Number(totalBuy.toFixed(6)),
        totalSellUSDT: Number(totalSell.toFixed(6)),

        investedAmount: Number(totalInvested.toFixed(2)),
        receivedAmount: Number(totalReceived.toFixed(2)),

        profitLoss: Number(totalProfit.toFixed(2)),

        profitLossPercent:
          totalInvested > 0
            ? Number(
                ((totalProfit / totalInvested) * 100).toFixed(2)
              )
            : 0,
      },

      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("USDT HISTORY SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT summary.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// usdtRoutes.js — PART 6/8
// Admin USDT Settings + Market Management APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET USDT SETTINGS
// GET /api/usdt/settings
// Admin Dashboard
// ======================================================

router.get("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getUsdtSettings();

    return res.status(200).json({
      success: true,

      settings: {
        usdtBuyPrice: Number(settings.usdtBuyPrice),
        usdtSellPrice: Number(settings.usdtSellPrice),
        usdToPkr: Number(settings.usdToPkr),

        usdtTradingEnabled: Boolean(settings.usdtTradingEnabled),
        marketStatus: settings.marketStatus,

        updatedAt: settings.updatedAt,
        updatedBy: settings.updatedByUsername || "System",
      },
    });

  } catch (error) {
    console.error("GET USDT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT settings.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// UPDATE USDT SETTINGS
// PATCH /api/usdt/settings
// Admin Dashboard
// ======================================================

router.patch("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      usdtBuyPrice,
      usdtSellPrice,
      usdToPkr,
    } = req.body;

    const settings = await getUsdtSettings();

    if (usdtBuyPrice !== undefined) {
      settings.usdtBuyPrice = Number(usdtBuyPrice);
    }

    if (usdtSellPrice !== undefined) {
      settings.usdtSellPrice = Number(usdtSellPrice);
    }

    if (usdToPkr !== undefined) {
      settings.usdToPkr = Number(usdToPkr);
    }

    settings.updatedBy = req.user.id;
    settings.updatedByUsername = req.user.username;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "USDT settings updated successfully.",

      settings: {
        usdtBuyPrice: settings.usdtBuyPrice,
        usdtSellPrice: settings.usdtSellPrice,
        usdToPkr: settings.usdToPkr,
        updatedAt: settings.updatedAt,
      },
    });

  } catch (error) {
    console.error("UPDATE USDT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update USDT settings.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// UPDATE USDT MARKET STATUS
// PATCH /api/usdt/market
// OPEN / CLOSED / MAINTENANCE
// ======================================================

router.patch("/market", verifyToken, isAdmin, async (req, res) => {
  try {
    const { marketStatus } = req.body;

    const validStatus = ["OPEN", "CLOSED", "MAINTENANCE"];

    if (!validStatus.includes(String(marketStatus).toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid market status.",
      });
    }

    const settings = await getUsdtSettings();

    settings.marketStatus = String(marketStatus).toUpperCase();
    settings.updatedBy = req.user.id;
    settings.updatedByUsername = req.user.username;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: `USDT market is now ${settings.marketStatus}.`,
      marketStatus: settings.marketStatus,
    });

  } catch (error) {
    console.error("UPDATE USDT MARKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update market status.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ENABLE / DISABLE USDT TRADING
// PATCH /api/usdt/trading
// ======================================================

router.patch("/trading", verifyToken, isAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "enabled must be true or false.",
      });
    }

    const settings = await getUsdtSettings();

    settings.usdtTradingEnabled = enabled;
    settings.updatedBy = req.user.id;
    settings.updatedByUsername = req.user.username;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: enabled
        ? "USDT trading enabled successfully."
        : "USDT trading disabled successfully.",

      tradingEnabled: settings.usdtTradingEnabled,
      updatedAt: settings.updatedAt,
    });

  } catch (error) {
    console.error("UPDATE USDT TRADING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update trading status.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// QUICK MARKET PRICE UPDATE
// PATCH /api/usdt/price
// Admin Live Price Update
// ======================================================

router.patch("/price", verifyToken, isAdmin, async (req, res) => {
  try {
    const { buyPrice, sellPrice } = req.body;

    const settings = await getUsdtSettings();

    if (buyPrice !== undefined) {
      settings.usdtBuyPrice = Number(buyPrice);
    }

    if (sellPrice !== undefined) {
      settings.usdtSellPrice = Number(sellPrice);
    }

    settings.updatedBy = req.user.id;
    settings.updatedByUsername = req.user.username;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "USDT market prices updated successfully.",

      prices: {
        buyPrice: settings.usdtBuyPrice,
        sellPrice: settings.usdtSellPrice,
        spread: settings.usdtBuyPrice - settings.usdtSellPrice,
      },

      updatedAt: settings.updatedAt,
    });

  } catch (error) {
    console.error("UPDATE USDT PRICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update USDT prices.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// usdtRoutes.js — PART 7A/8
// Admin Dashboard + Analytics APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// ADMIN DASHBOARD
// GET /api/usdt/admin/dashboard
// Used by frontend/app/admin/usdt/page.tsx
// ======================================================

router.get("/admin/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const [
      totalUsers,
      totalWallets,
      totalTrades,
      completedTrades,
      pendingTrades,
      cancelledTrades,
      wallets,
      recentTrades,
      settings,
    ] = await Promise.all([
      User.countDocuments({}),
      Wallet.countDocuments({}),
      UsdtTrade.countDocuments({}),
      UsdtTrade.countDocuments({ status: "COMPLETED" }),
      UsdtTrade.countDocuments({ status: "PENDING" }),
      UsdtTrade.countDocuments({ status: "CANCELLED" }),
      Wallet.find({}).lean(),
      UsdtTrade.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      getUsdtSettings(),
    ]);

    let totalUsdtBalance = 0;
    let totalPkrBalance = 0;
    let totalPortfolioValue = 0;
    let totalLiveProfit = 0;

    wallets.forEach((wallet) => {
      totalUsdtBalance += Number(wallet.usdtBalance || 0);
      totalPkrBalance += Number(wallet.pkrBalance || 0);
      totalPortfolioValue += Number(wallet.portfolioValue || 0);
      totalLiveProfit += Number(wallet.liveProfit || 0);
    });

    let totalBuyVolume = 0;
    let totalSellVolume = 0;
    let totalProfit = 0;

    recentTrades.forEach((trade) => {
      if (trade.tradeType === "BUY") {
        totalBuyVolume += Number(trade.totalAmount || 0);
      } else {
        totalSellVolume += Number(trade.totalAmount || 0);
      }

      totalProfit += Number(trade.profitLoss || 0);
    });

    return res.status(200).json({
      success: true,

      dashboard: {
        totalUsers,
        totalWallets,

        totalTrades,
        completedTrades,
        pendingTrades,
        cancelledTrades,

        totalUsdtBalance: Number(totalUsdtBalance.toFixed(6)),
        totalPkrBalance: Number(totalPkrBalance.toFixed(2)),

        totalPortfolioValue: Number(totalPortfolioValue.toFixed(2)),
        totalLiveProfit: Number(totalLiveProfit.toFixed(2)),

        totalBuyVolume: Number(totalBuyVolume.toFixed(2)),
        totalSellVolume: Number(totalSellVolume.toFixed(2)),
        totalProfit: Number(totalProfit.toFixed(2)),

        market: {
          buyPrice: Number(settings.usdtBuyPrice),
          sellPrice: Number(settings.usdtSellPrice),
          tradingEnabled: settings.usdtTradingEnabled,
          marketStatus: settings.marketStatus,
        },
      },

      recentTrades,
      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error("ADMIN USDT DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin dashboard.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN ANALYTICS
// GET /api/usdt/admin/analytics
// Used by Dashboard Charts
// ======================================================

router.get("/admin/analytics", verifyToken, isAdmin, async (req, res) => {
  try {
    const trades = await UsdtTrade.find({
      status: "COMPLETED",
    }).lean();

    let buyVolume = 0;
    let sellVolume = 0;
    let totalProfit = 0;

    const monthlyMap = {};

    trades.forEach((trade) => {
      const month = new Date(trade.createdAt).toISOString().slice(0, 7);

      if (!monthlyMap[month]) {
        monthlyMap[month] = {
          month,
          buyVolume: 0,
          sellVolume: 0,
          profit: 0,
          trades: 0,
        };
      }

      monthlyMap[month].trades += 1;
      monthlyMap[month].profit += Number(trade.profitLoss || 0);

      if (trade.tradeType === "BUY") {
        buyVolume += Number(trade.totalAmount || 0);
        monthlyMap[month].buyVolume += Number(trade.totalAmount || 0);
      } else {
        sellVolume += Number(trade.totalAmount || 0);
        monthlyMap[month].sellVolume += Number(trade.totalAmount || 0);
      }

      totalProfit += Number(trade.profitLoss || 0);
    });

    const monthlyAnalytics = Object.values(monthlyMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    return res.status(200).json({
      success: true,

      analytics: {
        totalTrades: trades.length,

        buyVolume: Number(buyVolume.toFixed(2)),
        sellVolume: Number(sellVolume.toFixed(2)),

        totalVolume: Number((buyVolume + sellVolume).toFixed(2)),

        totalProfit: Number(totalProfit.toFixed(2)),

        averageProfit:
          trades.length > 0
            ? Number((totalProfit / trades.length).toFixed(2))
            : 0,

        monthlyAnalytics,
      },
    });

  } catch (error) {
    console.error("ADMIN ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load analytics.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// usdtRoutes.js — PART 7B/8 FINAL
// Admin Top Traders + User Summary APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// ADMIN TOP TRADERS
// GET /api/usdt/admin/top-traders
// ======================================================

router.get("/admin/top-traders", verifyToken, isAdmin, async (req, res) => {
  try {
    const trades = await UsdtTrade.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: "$username",
          totalTrades: { $sum: 1 },
          totalBuyVolume: {
            $sum: {
              $cond: [
                { $eq: ["$tradeType", "BUY"] },
                "$totalAmount",
                0,
              ],
            },
          },
          totalSellVolume: {
            $sum: {
              $cond: [
                { $eq: ["$tradeType", "SELL"] },
                "$totalAmount",
                0,
              ],
            },
          },
          totalProfit: { $sum: "$profitLoss" },
          totalUsdt: { $sum: "$quantity" },
        },
      },
      { $sort: { totalProfit: -1 } },
      { $limit: 20 },
    ]);

    return res.status(200).json({
      success: true,
      total: trades.length,
      traders: trades.map((t, index) => ({
        rank: index + 1,
        username: t._id,
        totalTrades: t.totalTrades,
        totalBuyVolume: Number(t.totalBuyVolume.toFixed(2)),
        totalSellVolume: Number(t.totalSellVolume.toFixed(2)),
        totalProfit: Number(t.totalProfit.toFixed(2)),
        totalUsdt: Number(t.totalUsdt.toFixed(6)),
      })),
    });

  } catch (error) {
    console.error("TOP TRADERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load top traders.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN USER SUMMARY
// GET /api/usdt/admin/user-summary/:username
// ======================================================

router.get(
  "/admin/user-summary/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username = req.params.username.trim().toLowerCase();

      const user = await User.findOne({ username })
        .select("_id username email role createdAt")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const wallet = await Wallet.findOne({
        userId: user._id,
      }).lean();

      const trades = await UsdtTrade.find({
        userId: user._id,
      })
        .sort({ createdAt: -1 })
        .lean();

      let buyTrades = 0;
      let sellTrades = 0;
      let investedAmount = 0;
      let receivedAmount = 0;
      let totalProfit = 0;

      trades.forEach((trade) => {
        if (trade.tradeType === "BUY") {
          buyTrades++;
          investedAmount += Number(trade.totalAmount);
        }

        if (trade.tradeType === "SELL") {
          sellTrades++;
          receivedAmount += Number(trade.totalAmount);
          totalProfit += Number(trade.profitLoss || 0);
        }
      });

      return res.status(200).json({
        success: true,

        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          joinedAt: user.createdAt,
        },

        wallet: wallet
          ? {
              pkrBalance: Number(wallet.pkrBalance),
              usdtBalance: Number(wallet.usdtBalance),
              goldBalance: Number(wallet.goldBalance),
              portfolioValue: Number(wallet.portfolioValue),
              liveProfit: Number(wallet.liveProfit),
            }
          : null,

        statistics: {
          totalTrades: trades.length,
          buyTrades,
          sellTrades,

          investedAmount: Number(investedAmount.toFixed(2)),
          receivedAmount: Number(receivedAmount.toFixed(2)),

          totalProfit: Number(totalProfit.toFixed(2)),

          profitPercent:
            investedAmount > 0
              ? Number(
                  ((totalProfit / investedAmount) * 100).toFixed(2)
                )
              : 0,
        },

        recentTrades: trades.slice(0, 10),
      });

    } catch (error) {
      console.error("USER SUMMARY ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load user summary.",
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
// usdtRoutes.js — PART 8/8 FINAL
// Diagnostics + Admin Refresh + Route List + Export
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// REFRESH USER USDT PORTFOLIO
// GET /api/usdt/refresh
// Used by Dashboard / Portfolio Page
// ======================================================

router.get("/refresh", verifyToken, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({
      userId: req.user.id,
    }).lean();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const settings = await getUsdtSettings();

    const portfolioValue = Number(
      (wallet.usdtBalance * settings.usdtSellPrice).toFixed(2)
    );

    return res.status(200).json({
      success: true,

      wallet: {
        pkrBalance: Number(wallet.pkrBalance),
        usdtBalance: Number(wallet.usdtBalance),
        goldBalance: Number(wallet.goldBalance),

        portfolioValue,

        liveProfit: Number(wallet.liveProfit || 0),
        liveProfitPercent: Number(wallet.liveProfitPercent || 0),
      },

      market: {
        buyPrice: Number(settings.usdtBuyPrice),
        sellPrice: Number(settings.usdtSellPrice),
        marketStatus: settings.marketStatus,
        tradingEnabled: settings.usdtTradingEnabled,
      },

      refreshedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("REFRESH USDT PORTFOLIO ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh portfolio.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN REFRESH USER PORTFOLIO
// GET /api/usdt/admin/refresh/:username
// ======================================================

router.get(
  "/admin/refresh/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username = req.params.username.trim().toLowerCase();

      const user = await User.findOne({ username })
        .select("_id username")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const wallet = await Wallet.findOne({
        userId: user._id,
      }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: "Wallet not found.",
        });
      }

      const settings = await getUsdtSettings();

      const portfolioValue = Number(
        (wallet.usdtBalance * settings.usdtSellPrice).toFixed(2)
      );

      return res.status(200).json({
        success: true,

        username,

        wallet: {
          pkrBalance: Number(wallet.pkrBalance),
          usdtBalance: Number(wallet.usdtBalance),
          goldBalance: Number(wallet.goldBalance),

          portfolioValue,

          liveProfit: Number(wallet.liveProfit || 0),
          liveProfitPercent: Number(wallet.liveProfitPercent || 0),
        },

        refreshedAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error("ADMIN REFRESH USDT ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to refresh user portfolio.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// USDT DIAGNOSTICS
// GET /api/usdt/debug
// Backend Testing
// ======================================================

router.get("/debug", verifyToken, async (req, res) => {
  try {
    const [wallet, tradeCount, transactionCount] = await Promise.all([
      Wallet.findOne({ userId: req.user.id }).lean(),

      UsdtTrade.countDocuments({
        userId: req.user.id,
      }),

      Transaction.countDocuments({
        userId: req.user.id,
        walletType: "USDT",
      }),
    ]);

    return res.status(200).json({
      success: true,

      diagnostics: {
        module: "USDT Trading API V18",

        userId: req.user.id,
        username: req.user.username,

        walletExists: !!wallet,

        wallet: wallet
          ? {
              pkrBalance: Number(wallet.pkrBalance),
              usdtBalance: Number(wallet.usdtBalance),
              goldBalance: Number(wallet.goldBalance),
            }
          : null,

        totalTrades: tradeCount,
        totalTransactions: transactionCount,
      },

      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error("USDT DEBUG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Diagnostics failed.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// API ROUTE LIST
// GET /api/usdt/routes
// Diagnostics
// ======================================================

router.get("/routes", (req, res) => {
  return res.status(200).json({
    success: true,

    module: "GoldTrade V18 Enterprise USDT API",
    version: "18.0.0",

    routes: [
      // Health
      "GET /api/usdt/health",
      "GET /api/usdt/status",
      "GET /api/usdt/routes",
      "GET /api/usdt/debug",

      // Prices
      "GET /api/usdt/price",
      "GET /api/usdt/settings",
      "PATCH /api/usdt/settings",
      "PATCH /api/usdt/price",
      "PATCH /api/usdt/market",
      "PATCH /api/usdt/trading",

      // Wallet
      "GET /api/usdt/wallet",
      "GET /api/usdt/balance",
      "GET /api/usdt/refresh",

      // Trading
      "POST /api/usdt/buy",
      "POST /api/usdt/sell",

      // Portfolio
      "GET /api/usdt/portfolio",
      "GET /api/usdt/portfolio/:username",
      "GET /api/usdt/holdings",

      // History
      "GET /api/usdt/history",
      "GET /api/usdt/history/:username",
      "GET /api/usdt/history/filter",
      "GET /api/usdt/history/search",
      "GET /api/usdt/history/summary",
      "GET /api/usdt/recent",
      "GET /api/usdt/activity",

      // Admin
      "GET /api/usdt/admin/dashboard",
      "GET /api/usdt/admin/analytics",
      "GET /api/usdt/admin/top-traders",
      "GET /api/usdt/admin/user-summary/:username",
      "GET /api/usdt/admin/refresh/:username",
    ],

    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// ROUTER EXPORT
// ======================================================

module.exports = router;