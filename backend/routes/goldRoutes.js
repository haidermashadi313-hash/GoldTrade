// ======================================================
// GoldTrade V18 Enterprise Backend
// goldRoutes.js — PART 1/8
// Health + Status + Live Gold Price API
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
const WalletHistory = require("../models/WalletHistory");
const GoldTrade = require("../models/GoldTrade");
const Transaction = require("../models/Transaction");
const Settings = require("../models/Settings");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// DEFAULT GOLD SETTINGS
// Auto-create if database is empty
// ======================================================

const DEFAULT_SETTINGS = {
  buyGoldPrice: 45000,
  sellGoldPrice: 44500,
  goldPriceUSD: 4300,
  usdToPkr: 320,
  goldTradingEnabled: true,
  marketStatus: "OPEN",
};

// ======================================================
// BOOLEAN HELPER
// ======================================================

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (
      ["true", "1", "yes", "on", "enabled"].includes(
        normalized
      )
    ) {
      return true;
    }

    if (
      ["false", "0", "no", "off", "disabled"].includes(
        normalized
      )
    ) {
      return false;
    }
  }

  return fallback;
};
// ======================================================
// GET SETTINGS OR CREATE DEFAULT
// ======================================================

const getGoldSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create(DEFAULT_SETTINGS);
    console.log("🟢 Default Gold Settings Created");
  }

  return settings;
};
// ======================================================
// HEALTH CHECK
// GET /api/gold/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Gold Trading API",
    version: "18.0.0 Enterprise",
    status: "ONLINE",
    timestamp: new Date().toISOString(),
  });
});
// ======================================================
// API STATUS
// GET /api/gold/status
// ======================================================

router.get("/status", async (req, res) => {
  try {
    const settings = await getGoldSettings();

    return res.status(200).json({
      success: true,
      module: "Gold Trading API",
      version: "18.0.0 Enterprise",
      tradingEnabled: settings.goldTradingEnabled,
      marketStatus: settings.marketStatus,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GOLD STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Gold API status.",
    });
  }
});
// ======================================================
// LIVE GOLD PRICE
// GET /api/gold/price
// Used by Dashboard / Gold Buy / Gold Sell
// ======================================================

router.get("/price", async (req, res) => {
  try {
    const settings = await getGoldSettings();

    return res.status(200).json({
      success: true,

      buyPrice: Number(settings.buyGoldPrice),
      sellPrice: Number(settings.sellGoldPrice),

      goldPriceUSD: Number(settings.goldPriceUSD),

      usdToPkr: Number(settings.usdToPkr),
      UsdtoPkr: Number(settings.usdToPkr),

      tradingEnabled: Boolean(settings.goldTradingEnabled),
      marketStatus: settings.marketStatus,

      spread:
        Number(settings.buyGoldPrice) -
        Number(settings.sellGoldPrice),

      updatedAt: settings.updatedAt,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET GOLD PRICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load gold price.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GET CURRENT USER WALLET FOR GOLD MODULE
// GET /api/gold/wallet
// Used by Buy/Sell Gold Page
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
        pkrBalance: wallet.pkrBalance,
        goldBalance: wallet.goldBalance,
        usdtBalance: wallet.usdtBalance,

        lockedPkr: wallet.lockedPkr,
        lockedGold: wallet.lockedGold,
        lockedUsdt: wallet.lockedUsdt,

        portfolioValue: wallet.portfolioValue,
        liveProfit: wallet.liveProfit,
        liveProfitPercent: wallet.liveProfitPercent,
      },

      updatedAt: wallet.updatedAt,
    });
  } catch (error) {
    console.error("GET GOLD WALLET ERROR:", error);

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
// goldRoutes.js — PART 2/8
// BUY GOLD API + Wallet + Transaction Sync
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// BUY GOLD
// POST /api/gold/buy
// Used by frontend/app/gold/buy/page.tsx
// ======================================================

router.post("/buy", verifyToken, async (req, res) => {
  try {
    const { quantity } = req.body;

    const goldQty = Number(quantity);

    if (!Number.isFinite(goldQty) || goldQty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid gold quantity is required.",
      });
    }

    // ------------------------------------------
    // User + Wallet
    // ------------------------------------------

    const user = await User.findById(req.user.id)
      .select("_id username email")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await Wallet.findOne({
      userId: user._id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    // ------------------------------------------
    // Gold Settings
    // ------------------------------------------

    const settings = await getGoldSettings();

    if (!settings.goldTradingEnabled) {
      return res.status(403).json({
        success: false,
        message: "Gold trading is currently disabled.",
      });
    }

    if (settings.marketStatus !== "OPEN") {
      return res.status(403).json({
        success: false,
        message: "Gold market is currently closed.",
      });
    }

    const buyPrice = Number(settings.buyGoldPrice);
    const totalAmount = Number(
      (goldQty * buyPrice).toFixed(2)
    );

    // ------------------------------------------
    // Balance Check
    // ------------------------------------------

    if (wallet.availablePkr < totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient PKR balance.",
        required: totalAmount,
        available: wallet.availablePkr,
      });
    }

    const beforeWallet = {
      pkrBalance: wallet.pkrBalance,
      goldBalance: wallet.goldBalance,
      usdtBalance: wallet.usdtBalance,
    };

    // ------------------------------------------
    // Wallet Update
    // ------------------------------------------

    wallet.pkrBalance -= totalAmount;
    wallet.goldBalance += goldQty;

    wallet.totalDeposit += 0;
    wallet.totalGoldPurchased += goldQty;

    wallet.lastTradeAt = new Date();

    await wallet.save();

    const afterWallet = {
      pkrBalance: wallet.pkrBalance,
      goldBalance: wallet.goldBalance,
      usdtBalance: wallet.usdtBalance,
    };

    // ------------------------------------------
    // Gold Trade Entry
    // ------------------------------------------

    const trade = await GoldTrade.create({
      userId: user._id,
      username: user.username,

      tradeType: "BUY",
      status: "COMPLETED",

      quantity: goldQty,
      remainingQuantity: goldQty,

      buyPrice,
      marketGoldPrice: Number(settings.goldPriceUSD),
      usdToPkrRate: Number(settings.usdToPkr),

      totalAmount,
      investedAmount: totalAmount,

      walletBefore: beforeWallet,
      walletAfter: afterWallet,

      note: "Gold purchased successfully.",
    });

    // ------------------------------------------
    // Transaction Ledger
    // ------------------------------------------

    await Transaction.create({
      userId: user._id,
      username: user.username,

      walletType: "PKR",
      transactionType: "BUY_GOLD",
      transactionMode: "DEBIT",

      amount: totalAmount,
      balanceBefore: beforeWallet.pkrBalance,
      balanceAfter: afterWallet.pkrBalance,

      status: "Completed",
      referenceId: trade._id.toString(),
      note: `Purchased ${goldQty}g Gold`,
    });

    // ------------------------------------------
    // Wallet History
    // ------------------------------------------

    await WalletHistory.create({
      userId: user._id,
      username: user.username,

      walletType: "GOLD",
      type: "BUY",

      amount: goldQty,
      balanceBefore: beforeWallet.goldBalance,
      balanceAfter: afterWallet.goldBalance,

      note: `Purchased ${goldQty}g Gold`,
      referenceId: trade._id.toString(),
    });

    // ------------------------------------------
    // Response
    // ------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Gold purchased successfully.",

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
    console.error("BUY GOLD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to purchase gold.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// goldRoutes.js — PART 3/8
// SELL GOLD API + Wallet + Profit/Loss Sync
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// SELL GOLD
// POST /api/gold/sell
// Used by frontend/app/gold/sell/page.tsx
// ======================================================

router.post("/sell", verifyToken, async (req, res) => {
  try {
    const { quantity } = req.body;

    const goldQty = Number(quantity);

    if (!Number.isFinite(goldQty) || goldQty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid gold quantity is required.",
      });
    }

    // ==================================================
    // USER + WALLET
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

    const wallet = await Wallet.findOne({
      userId: user._id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    // ==================================================
    // GOLD SETTINGS
    // ==================================================

    const settings = await getGoldSettings();

    if (!settings.goldTradingEnabled) {
      return res.status(403).json({
        success: false,
        message: "Gold trading is currently disabled.",
      });
    }

    if (settings.marketStatus !== "OPEN") {
      return res.status(403).json({
        success: false,
        message: "Gold market is currently closed.",
      });
    }

    // ==================================================
    // GOLD BALANCE CHECK
    // ==================================================

    if (wallet.availableGold < goldQty) {
      return res.status(400).json({
        success: false,
        message: "Insufficient Gold balance.",
        required: goldQty,
        available: wallet.availableGold,
      });
    }

    const sellPrice = Number(settings.sellGoldPrice);

    const totalAmount = Number(
      (goldQty * sellPrice).toFixed(2)
    );

    // ==================================================
    // CALCULATE PROFIT / LOSS (FIFO)
    // ==================================================

    const buyTrades = await GoldTrade.find({
      userId: user._id,
      tradeType: "BUY",
      remainingQuantity: { $gt: 0 },
      status: "COMPLETED",
    }).sort({ createdAt: 1 });

    let remainingToSell = goldQty;
    let investedAmount = 0;

    for (const trade of buyTrades) {
      if (remainingToSell <= 0) {
        break;
      }

      const availableQty = trade.remainingQuantity;

      if (availableQty <= 0) {
        continue;
      }

      const sellQty = Math.min(
        availableQty,
        remainingToSell
      );

      investedAmount += sellQty * trade.buyPrice;

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
        ? Number(
            ((profitLoss / investedAmount) * 100).toFixed(2)
          )
        : 0;

    // ==================================================
    // WALLET SNAPSHOT
    // ==================================================

    const walletBefore = {
      pkrBalance: wallet.pkrBalance,
      goldBalance: wallet.goldBalance,
      usdtBalance: wallet.usdtBalance,
    };

    wallet.goldBalance -= goldQty;
    wallet.pkrBalance += totalAmount;

    wallet.totalGoldSold += goldQty;
    wallet.lastTradeAt = new Date();

    wallet.portfolioValue = Number(
      (
        wallet.goldBalance * settings.buyGoldPrice
      ).toFixed(2)
    );

    wallet.liveProfit += profitLoss;

    await wallet.save();

    const walletAfter = {
      pkrBalance: wallet.pkrBalance,
      goldBalance: wallet.goldBalance,
      usdtBalance: wallet.usdtBalance,
    };

    // ==================================================
    // CREATE GOLD TRADE
    // ==================================================

    const sellTrade = await GoldTrade.create({
      userId: user._id,
      username: user.username,

      tradeType: "SELL",
      status: "COMPLETED",

      quantity: goldQty,
      soldQuantity: goldQty,
      remainingQuantity: 0,

      sellPrice,
      marketGoldPrice: Number(settings.goldPriceUSD),
      usdToPkrRate: Number(settings.usdToPkr),

      totalAmount,
      investedAmount,

      profitLoss,
      profitLossPercent,

      walletBefore,
      walletAfter,

      note: "Gold sold successfully.",
    });

    // ==================================================
    // TRANSACTION LEDGER
    // ==================================================

    await Transaction.create({
      userId: user._id,
      username: user.username,

      walletType: "PKR",
      transactionType: "SELL_GOLD",
      transactionMode: "CREDIT",

      amount: totalAmount,
      balanceBefore: walletBefore.pkrBalance,
      balanceAfter: walletAfter.pkrBalance,

      status: "Completed",

      referenceId: sellTrade._id.toString(),
      note: `Sold ${goldQty}g Gold`,
    });

    // ==================================================
    // WALLET HISTORY
    // ==================================================

    await WalletHistory.create({
      userId: user._id,
      username: user.username,

      walletType: "GOLD",
      type: "SELL",

      amount: goldQty,
      balanceBefore: walletBefore.goldBalance,
      balanceAfter: walletAfter.goldBalance,

      referenceId: sellTrade._id.toString(),
      note: `Sold ${goldQty}g Gold`,
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,
      message: "Gold sold successfully.",

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
    console.error("SELL GOLD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to sell gold.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// goldRoutes.js — PART 4/8
// Gold Portfolio APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET CURRENT USER GOLD PORTFOLIO
// GET /api/gold/portfolio
// Used by frontend/app/gold/portfolio/page.tsx
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

    const wallet = await Wallet.findOne({
      userId: user._id,
    }).lean();

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const settings = await getGoldSettings();

    // Active BUY trades only.
    const holdings = await GoldTrade.find({
      userId: user._id,
      tradeType: "BUY",
      remainingQuantity: { $gt: 0 },
      status: "COMPLETED",
    })
      .sort({ createdAt: 1 })
      .lean();

    // Recent transactions for the Gold Portfolio UI.
    const recentTrades = await GoldTrade.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    let totalGold = 0;
    let investedAmount = 0;

    const positions = holdings.map((trade) => {
      const qty = Number(
        trade.remainingQuantity || 0
      );

      const buyPrice = Number(
        trade.buyPrice || 0
      );

      const currentPrice = Number(
        settings.sellGoldPrice || 0
      );

      totalGold += qty;
      investedAmount += qty * buyPrice;

      const currentValue =
        qty * currentPrice;

      const pnl =
        currentValue -
        qty * buyPrice;

      return {
        tradeId: trade._id,
        quantity: qty,
        buyPrice,
        currentPrice,

        investedAmount: Number(
          (qty * buyPrice).toFixed(2)
        ),

        currentValue: Number(
          currentValue.toFixed(2)
        ),

        profitLoss: Number(
          pnl.toFixed(2)
        ),

        createdAt: trade.createdAt,
      };
    });

    const currentValue = Number(
      (
        totalGold *
        Number(settings.sellGoldPrice || 0)
      ).toFixed(2)
    );

    const unrealizedProfitLoss = Number(
      (
        currentValue -
        investedAmount
      ).toFixed(2)
    );

    const totalProfitPercent =
      investedAmount > 0
        ? Number(
            (
              (unrealizedProfitLoss /
                investedAmount) *
              100
            ).toFixed(2)
          )
        : 0;

    const totalGoldBought = Number(
      wallet.totalGoldPurchased ??
        recentTrades
          .filter(
            (trade) =>
              trade.tradeType === "BUY"
          )
          .reduce(
            (sum, trade) =>
              sum +
              Number(
                trade.quantity || 0
              ),
            0
          )
    );

    const totalGoldSold = Number(
      wallet.totalGoldSold ??
        recentTrades
          .filter(
            (trade) =>
              trade.tradeType === "SELL"
          )
          .reduce(
            (sum, trade) =>
              sum +
              Number(
                trade.quantity || 0
              ),
            0
          )
    );

    const averageBuyPrice =
      totalGold > 0
        ? Number(
            (
              investedAmount /
              totalGold
            ).toFixed(2)
          )
        : 0;

    const transactions =
      recentTrades.map((trade) => {
        const isSell =
          trade.tradeType === "SELL";

        return {
          _id: trade._id,

          tradeType: String(
            trade.tradeType || ""
          ).toLowerCase(),

          grams: Number(
            trade.quantity || 0
          ),

          pricePerGram: Number(
            (
              isSell
                ? trade.sellPrice
                : trade.buyPrice
            ) || 0
          ),

          totalPkr: Number(
            trade.totalAmount || 0
          ),

          profitLoss: Number(
            trade.profitLoss || 0
          ),

          status:
            trade.status ||
            "COMPLETED",

          createdAt:
            trade.createdAt,
        };
      });

    return res.status(200).json({
      success: true,

      portfolio: {
        username: user.username,

        // Existing Gold API fields.
        goldBalance: Number(
          wallet.goldBalance || 0
        ),

        totalGold: Number(
          totalGold.toFixed(4)
        ),

        buyPrice: Number(
          settings.buyGoldPrice || 0
        ),

        sellPrice: Number(
          settings.sellGoldPrice || 0
        ),

        investedAmount: Number(
          investedAmount.toFixed(2)
        ),

        currentValue,

        profitLoss:
          unrealizedProfitLoss,

        profitLossPercent:
          totalProfitPercent,

        totalPositions:
          positions.length,

        positions,

        // Frontend GoldPortfolio
        // compatibility fields.
        WalletBalance: Number(
          wallet.pkrBalance || 0
        ),

        averagebuyPrice:
          averageBuyPrice,

        currentsellPrice: Number(
          settings.sellGoldPrice || 0
        ),

        totalInvested: Number(
          investedAmount.toFixed(2)
        ),

        liveProfitLoss:
          unrealizedProfitLoss,

        totalProfitLoss: Number(
          wallet.liveProfit || 0
        ),

        totalGoldbuy:
          totalGoldBought,

        totalGoldsell:
          totalGoldSold,

        transactions,

        updatedAt:
          new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(
      "GET GOLD PORTFOLIO ERROR:",
      error
    );

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
// GET /api/gold/portfolio/:username
// Admin or Same User
// ======================================================

router.get(
  "/portfolio/:username",
  verifyToken,
  async (req, res) => {
    try {
      const username =
        req.params.username
          .trim()
          .toLowerCase();

      if (
        req.user.role !== "admin" &&
        req.user.username.toLowerCase() !==
          username
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      const user = await User.findOne({
        username,
      })
        .select("_id username email role")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const wallet =
        await Wallet.findOne({
          userId: user._id,
        }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: "Wallet not found.",
        });
      }

      const settings =
        await getGoldSettings();

      const holdings =
        await GoldTrade.find({
          userId: user._id,
          tradeType: "BUY",
          remainingQuantity: {
            $gt: 0,
          },
          status: "COMPLETED",
        }).lean();

      let totalGold = 0;
      let investedAmount = 0;

      holdings.forEach((trade) => {
        totalGold += Number(
          trade.remainingQuantity || 0
        );

        investedAmount +=
          Number(
            trade.remainingQuantity || 0
          ) *
          Number(
            trade.buyPrice || 0
          );
      });

      const currentValue =
        Number(
          (
            totalGold *
            settings.sellGoldPrice
          ).toFixed(2)
        );

      const profitLoss =
        Number(
          (
            currentValue -
            investedAmount
          ).toFixed(2)
        );

      const profitLossPercent =
        investedAmount > 0
          ? Number(
              (
                (profitLoss /
                  investedAmount) *
                100
              ).toFixed(2)
            )
          : 0;

      return res.status(200).json({
        success: true,

        portfolio: {
          username: user.username,
          email: user.email,
          role: user.role,

          goldBalance:
            wallet.goldBalance,

          totalGold: Number(
            totalGold.toFixed(4)
          ),

          investedAmount: Number(
            investedAmount.toFixed(2)
          ),

          currentValue,

          profitLoss,
          profitLossPercent,

          totalPositions:
            holdings.length,

          updatedAt:
            wallet.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "GET USER GOLD PORTFOLIO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load user portfolio.",
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
// goldRoutes.js — PART 5/8
// Gold History APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET CURRENT USER GOLD HISTORY
// GET /api/gold/history
// Used by frontend/app/gold/history/page.tsx
// ======================================================

router.get(
  "/history",
  verifyToken,
  async (req, res) => {
    try {
      const page = Math.max(
        Number(req.query.page) || 1,
        1
      );

      const limit = Math.min(
        Number(req.query.limit) || 20,
        100
      );

      const skip =
        (page - 1) * limit;

      const total =
        await GoldTrade.countDocuments({
          userId: req.user.id,
        });

      const trades =
        await GoldTrade.find({
          userId: req.user.id,
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

      const history =
        trades.map((trade) => ({
          id: trade._id,
          _id: trade._id,

          tradeType:
            String(
              trade.tradeType || ""
            ).toLowerCase(),

          status: trade.status,

          quantity: Number(
            trade.quantity || 0
          ),

          grams: Number(
            trade.quantity || 0
          ),

          remainingQuantity:
            Number(
              trade.remainingQuantity ||
                0
            ),

          buyPrice: Number(
            trade.buyPrice || 0
          ),

          sellPrice: Number(
            trade.sellPrice || 0
          ),

          pricePerGram: Number(
            (
              trade.tradeType ===
              "SELL"
                ? trade.sellPrice
                : trade.buyPrice
            ) || 0
          ),

          marketGoldPrice:
            Number(
              trade.marketGoldPrice ||
                0
            ),

          totalAmount: Number(
            trade.totalAmount || 0
          ),

          totalPkr: Number(
            trade.totalAmount || 0
          ),

          investedAmount:
            Number(
              trade.investedAmount ||
                0
            ),

          profitLoss: Number(
            trade.profitLoss || 0
          ),

          profitLossPercent:
            Number(
              trade.profitLossPercent ||
                0
            ),

          note: trade.note || "",

          createdAt:
            trade.createdAt,
        }));

      return res.status(200).json({
        success: true,
        total,
        page,
        totalPages:
          Math.ceil(
            total / limit
          ),
        history,
      });
    } catch (error) {
      console.error(
        "GET GOLD HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load gold history.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// SEARCH GOLD HISTORY
// GET /api/gold/history/search
// Filters: tradeType, status, fromDate, toDate
//
// IMPORTANT:
// This route is intentionally BEFORE
// /history/:username so "search" is not
// interpreted as a username.
// ======================================================

router.get(
  "/history/search",
  verifyToken,
  async (req, res) => {
    try {
      const {
        tradeType,
        status,
        fromDate,
        toDate,
      } = req.query;

      const query = {
        userId: req.user.id,
      };

      if (tradeType) {
        query.tradeType =
          String(tradeType).toUpperCase();
      }

      if (status) {
        query.status =
          String(status).toUpperCase();
      }

      if (fromDate || toDate) {
        query.createdAt = {};

        if (fromDate) {
          query.createdAt.$gte =
            new Date(fromDate);
        }

        if (toDate) {
          query.createdAt.$lte =
            new Date(toDate);
        }
      }

      const history =
        await GoldTrade.find(query)
          .sort({ createdAt: -1 })
          .limit(200)
          .lean();

      return res.status(200).json({
        success: true,
        total: history.length,

        filters: {
          tradeType,
          status,
          fromDate,
          toDate,
        },

        history,
      });
    } catch (error) {
      console.error(
        "SEARCH GOLD HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to search gold history.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// GET GOLD HISTORY BY USERNAME
// GET /api/gold/history/:username
// Admin or Same User
// ======================================================

router.get(
  "/history/:username",
  verifyToken,
  async (req, res) => {
    try {
      const username =
        req.params.username
          .trim()
          .toLowerCase();

      if (
        req.user.role !== "admin" &&
        req.user.username.toLowerCase() !==
          username
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      const user =
        await User.findOne({
          username,
        })
          .select("_id username")
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const page = Math.max(
        Number(req.query.page) || 1,
        1
      );

      const limit = Math.min(
        Number(req.query.limit) || 50,
        100
      );

      const skip =
        (page - 1) * limit;

      const total =
        await GoldTrade.countDocuments({
          userId: user._id,
        });

      const history =
        await GoldTrade.find({
          userId: user._id,
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

      return res.status(200).json({
        success: true,
        username: user.username,
        total,
        page,
        totalPages:
          Math.ceil(
            total / limit
          ),
        history,
      });
    } catch (error) {
      console.error(
        "GET USER GOLD HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load user gold history.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// GET RECENT GOLD TRADES
// GET /api/gold/recent
// Dashboard Recent Activity
// ======================================================

router.get(
  "/recent",
  verifyToken,
  async (req, res) => {
    try {
      const trades =
        await GoldTrade.find({
          userId: req.user.id,
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

      return res.status(200).json({
        success: true,
        total: trades.length,
        trades,
      });
    } catch (error) {
      console.error(
        "GET RECENT GOLD TRADES ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load recent trades.",
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
// goldRoutes.js — PART 6/8
// Admin Gold Settings APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET GOLD SETTINGS
// GET /api/gold/settings
// Used by Admin Dashboard
// ======================================================

router.get(
  "/settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await getGoldSettings();

      return res.status(200).json({
        success: true,

        settings: {
          buyGoldPrice: Number(
            settings.buyGoldPrice
          ),

          sellGoldPrice: Number(
            settings.sellGoldPrice
          ),

          goldPriceUSD: Number(
            settings.goldPriceUSD
          ),

          usdToPkr: Number(
            settings.usdToPkr
          ),

          goldTradingEnabled:
            Boolean(
              settings.goldTradingEnabled
            ),

          marketStatus:
            settings.marketStatus,

          updatedAt:
            settings.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "GET GOLD SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load gold settings.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// UPDATE GOLD SETTINGS
// PATCH /api/gold/settings
// Used by Admin Dashboard
// ======================================================

router.put(
  "/settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await getGoldSettings();

      const {
        buyGoldPrice,
        sellGoldPrice,
        goldPriceUSD,
        usdToPkr,
        goldTradingEnabled,
        marketStatus,
      } = req.body;

      if (
        buyGoldPrice !== undefined
      ) {
        settings.buyGoldPrice =
          Number(buyGoldPrice);
      }

      if (
        sellGoldPrice !== undefined
      ) {
        settings.sellGoldPrice =
          Number(sellGoldPrice);
      }

      if (
        goldPriceUSD !== undefined
      ) {
        settings.goldPriceUSD =
          Number(goldPriceUSD);
      }

      if (
        usdToPkr !== undefined
      ) {
        settings.usdToPkr =
          Number(usdToPkr);
      }

      if (
        goldTradingEnabled !==
        undefined
      ) {
        settings.goldTradingEnabled =
          toBoolean(
            goldTradingEnabled,
            settings.goldTradingEnabled
          );
      }

      if (
        marketStatus !== undefined
      ) {
        const allowed = [
          "OPEN",
          "CLOSED",
          "MAINTENANCE",
        ];

        if (
          !allowed.includes(
            String(
              marketStatus
            ).toUpperCase()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid market status.",
          });
        }

        settings.marketStatus =
          String(
            marketStatus
          ).toUpperCase();
      }

      await settings.save();

      return res.status(200).json({
        success: true,
        message:
          "Gold settings updated successfully.",

        settings: {
          buyGoldPrice:
            settings.buyGoldPrice,

          sellGoldPrice:
            settings.sellGoldPrice,

          goldPriceUSD:
            settings.goldPriceUSD,

          usdToPkr:
            settings.usdToPkr,

          goldTradingEnabled:
            settings.goldTradingEnabled,

          marketStatus:
            settings.marketStatus,

          updatedAt:
            settings.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "UPDATE GOLD SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update gold settings.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// MARKET STATUS TOGGLE
// PATCH /api/gold/market
// ======================================================

router.patch(
  "/market",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { marketStatus } =
        req.body;

      const allowed = [
        "OPEN",
        "CLOSED",
        "MAINTENANCE",
      ];

      if (
        !allowed.includes(
          String(
            marketStatus
          ).toUpperCase()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid market status.",
        });
      }

      const settings =
        await getGoldSettings();

      settings.marketStatus =
        String(
          marketStatus
        ).toUpperCase();

      await settings.save();

      return res.status(200).json({
        success: true,

        message: `Market status changed to ${settings.marketStatus}.`,

        marketStatus:
          settings.marketStatus,
      });
    } catch (error) {
      console.error(
        "MARKET STATUS UPDATE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update market status.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// GOLD TRADING ENABLE / DISABLE
// PATCH /api/gold/trading
// ======================================================

router.patch(
  "/trading",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { enabled } = req.body;

      const settings =
        await getGoldSettings();

      settings.goldTradingEnabled =
        toBoolean(
          enabled,
          settings.goldTradingEnabled
        );

      await settings.save();

      return res.status(200).json({
        success: true,

        message:
          settings.goldTradingEnabled
            ? "Gold trading enabled."
            : "Gold trading disabled.",

        tradingEnabled:
          settings.goldTradingEnabled,

        marketStatus:
          settings.marketStatus,
      });
    } catch (error) {
      console.error(
        "GOLD TRADING TOGGLE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update trading status.",
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
// goldRoutes.js — PART 7/8
// Admin Gold Dashboard Analytics APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// ADMIN GOLD DASHBOARD
// GET /api/gold/admin/dashboard
// Used by frontend/app/admin/gold/page.tsx
// ======================================================

router.get(
  "/admin/dashboard",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await getGoldSettings();

      const [
        totalTrades,
        totalBuyTrades,
        totalSellTrades,
        completedTrades,
        pendingTrades,
        totalUsers,
        walletStats,
        recentTrades,
      ] = await Promise.all([
        GoldTrade.countDocuments(),

        GoldTrade.countDocuments({
          tradeType: "BUY",
        }),

        GoldTrade.countDocuments({
          tradeType: "SELL",
        }),

        GoldTrade.countDocuments({
          status: "COMPLETED",
        }),

        GoldTrade.countDocuments({
          status: "PENDING",
        }),

        User.countDocuments({
          role: "user",
        }),

        Wallet.aggregate([
          {
            $group: {
              _id: null,

              totalPKR: {
                $sum: "$pkrBalance",
              },

              totalGold: {
                $sum: "$goldBalance",
              },

              totalUSDT: {
                $sum: "$usdtBalance",
              },

              totalPortfolio: {
                $sum: "$portfolioValue",
              },

              totalLiveProfit: {
                $sum: "$liveProfit",
              },
            },
          },
        ]),

        GoldTrade.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .select(
            "username tradeType quantity buyPrice sellPrice totalAmount profitLoss createdAt"
          )
          .lean(),
      ]);

      const walletSummary =
        walletStats[0] || {
          totalPKR: 0,
          totalGold: 0,
          totalUSDT: 0,
          totalPortfolio: 0,
          totalLiveProfit: 0,
        };

      return res.status(200).json({
        success: true,

        dashboard: {
          market: {
            buyGoldPrice:
              settings.buyGoldPrice,

            sellGoldPrice:
              settings.sellGoldPrice,

            goldPriceUSD:
              settings.goldPriceUSD,

            usdToPkr:
              settings.usdToPkr,

            tradingEnabled:
              settings.goldTradingEnabled,

            marketStatus:
              settings.marketStatus,
          },

          statistics: {
            totalUsers,
            totalTrades,
            totalBuyTrades,
            totalSellTrades,
            completedTrades,
            pendingTrades,
          },

          wallet: {
            totalPKR:
              Number(
                walletSummary.totalPKR
              ).toFixed(2) *
                1,

            totalGold:
              Number(
                walletSummary.totalGold
              ).toFixed(4) *
                1,

            totalUSDT:
              Number(
                walletSummary.totalUSDT
              ).toFixed(2) *
                1,

            totalPortfolio:
              Number(
                walletSummary.totalPortfolio
              ).toFixed(2) *
                1,

            totalLiveProfit:
              Number(
                walletSummary.totalLiveProfit
              ).toFixed(2) *
                1,
          },
                    recentTrades,

          updatedAt:
            new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(
        "ADMIN GOLD DASHBOARD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load admin dashboard.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// TOP GOLD TRADERS
// GET /api/gold/admin/top-traders
// ======================================================

router.get(
  "/admin/top-traders",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const traders =
        await Wallet.aggregate([
          {
            $project: {
              username: 1,
              goldBalance: 1,
              portfolioValue: 1,
              liveProfit: 1,
            },
          },
          {
            $sort: {
              goldBalance: -1,
            },
          },
          {
            $limit: 20,
          },
        ]);

      return res.status(200).json({
        success: true,
        total: traders.length,
        traders,
      });
    } catch (error) {
      console.error(
        "TOP TRADERS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load top traders.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// GOLD ANALYTICS
// GET /api/gold/admin/analytics
// ======================================================

router.get(
  "/admin/analytics",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const analytics =
        await GoldTrade.aggregate([
          {
            $group: {
              _id: "$tradeType",

              totalQuantity: {
                $sum: "$quantity",
              },

              totalAmount: {
                $sum: "$totalAmount",
              },

              totalProfit: {
                $sum: "$profitLoss",
              },

              trades: {
                $sum: 1,
              },
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        analytics,
        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "GOLD ANALYTICS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load analytics.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// USER GOLD SUMMARY
// GET /api/gold/admin/user-summary/:username
// ======================================================

router.get(
  "/admin/user-summary/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username =
        req.params.username
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          username,
        })
          .select(
            "_id username email role"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      const wallet =
        await Wallet.findOne({
          userId: user._id,
        }).lean();

      const trades =
        await GoldTrade.find({
          userId: user._id,
        })
          .sort({ createdAt: -1 })
          .lean();

      const totalBuyQuantity =
        trades
          .filter(
            (t) =>
              t.tradeType === "BUY"
          )
          .reduce(
            (sum, t) =>
              sum +
              Number(
                t.quantity || 0
              ),
            0
          );

      const totalSellQuantity =
        trades
          .filter(
            (t) =>
              t.tradeType === "SELL"
          )
          .reduce(
            (sum, t) =>
              sum +
              Number(
                t.quantity || 0
              ),
            0
          );

      const totalProfit =
        trades.reduce(
          (sum, t) =>
            sum +
            Number(
              t.profitLoss || 0
            ),
          0
        );

      return res.status(200).json({
        success: true,

        summary: {
          username:
            user.username,

          email:
            user.email,

          wallet: {
            pkrBalance:
              wallet?.pkrBalance || 0,

            goldBalance:
              wallet?.goldBalance || 0,

            usdtBalance:
              wallet?.usdtBalance || 0,

            portfolioValue:
              wallet?.portfolioValue ||
              0,

            liveProfit:
              wallet?.liveProfit ||
              0,
          },

          trading: {
            totalTrades:
              trades.length,

            totalBuyQuantity,

            totalSellQuantity,

            totalProfit,
          },

          recentTrades:
            trades.slice(0, 5),
        },
      });
    } catch (error) {
      console.error(
        "USER GOLD SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load user summary.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// ADMIN CANCEL GOLD TRADE
// PATCH /api/gold/admin/cancel/:tradeId
// ======================================================

router.patch(
  "/admin/cancel/:tradeId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const trade =
        await GoldTrade.findById(
          req.params.tradeId
        );

      if (!trade) {
        return res.status(404).json({
          success: false,
          message:
            "Trade not found.",
        });
      }

      if (
        trade.status ===
        "CANCELLED"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Trade already cancelled.",
        });
      }

      trade.status =
        "CANCELLED";

      trade.note =
        `Cancelled by ${req.user.username}`;

      trade.adminId =
        req.user.id;

      trade.adminUsername =
        req.user.username;

      await trade.save();

      return res.status(200).json({
        success: true,
        message:
          "Trade cancelled successfully.",
        trade,
      });
    } catch (error) {
      console.error(
        "CANCEL GOLD TRADE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to cancel trade.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// ADMIN UPDATE GOLD TRADE NOTE
// PATCH /api/gold/admin/trade-note/:tradeId
// ======================================================

router.patch(
  "/admin/trade-note/:tradeId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { note } =
        req.body;

      const trade =
        await GoldTrade.findById(
          req.params.tradeId
        );

      if (!trade) {
        return res.status(404).json({
          success: false,
          message:
            "Trade not found.",
        });
      }

      trade.note = note || "";

      trade.adminId =
        req.user.id;

      trade.adminUsername =
        req.user.username;

      await trade.save();

      return res.status(200).json({
        success: true,
        message:
          "Trade note updated successfully.",
        trade,
      });
    } catch (error) {
      console.error(
        "UPDATE GOLD TRADE NOTE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update trade note.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// REFRESH GOLD PORTFOLIO
// GET /api/gold/refresh
// ======================================================

router.get(
  "/refresh",
  verifyToken,
  async (req, res) => {
    try {
      const wallet =
        await Wallet.findOne({
          userId: req.user.id,
        }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message:
            "Wallet not found.",
        });
      }

      const settings =
        await getGoldSettings();

      const portfolioValue =
        Number(
          (
            wallet.goldBalance *
            settings.sellGoldPrice
          ).toFixed(2)
        );

      return res.status(200).json({
        success: true,

        wallet: {
          pkrBalance:
            wallet.pkrBalance,

          goldBalance:
            wallet.goldBalance,

          usdtBalance:
            wallet.usdtBalance,

          portfolioValue,

          liveProfit:
            wallet.liveProfit,
        },

        market: {
          buyPrice:
            settings.buyGoldPrice,

          sellPrice:
            settings.sellGoldPrice,

          marketStatus:
            settings.marketStatus,
        },

        refreshedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "REFRESH GOLD PORTFOLIO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to refresh portfolio.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// USER GOLD STATISTICS
// GET /api/gold/stats
// ======================================================

router.get(
  "/stats",
  verifyToken,
  async (req, res) => {
    try {
      const trades =
        await GoldTrade.find({
          userId: req.user.id,
          status: "COMPLETED",
        }).lean();

      const totalBuyTrades =
        trades.filter(
          (t) =>
            t.tradeType === "BUY"
        ).length;

      const totalSellTrades =
        trades.filter(
          (t) =>
            t.tradeType === "SELL"
        ).length;

      const totalProfit =
        trades.reduce(
          (sum, t) =>
            sum +
            Number(
              t.profitLoss || 0
            ),
          0
        );

      const totalInvested =
        trades.reduce(
          (sum, t) =>
            sum +
            Number(
              t.investedAmount || 0
            ),
          0
        );

      return res.status(200).json({
        success: true,

        stats: {
          totalTrades:
            trades.length,

          totalBuyTrades,

          totalSellTrades,

          totalInvested:
            Number(
              totalInvested.toFixed(2)
            ),

          totalProfit:
            Number(
              totalProfit.toFixed(2)
            ),

          averageProfit:
            trades.length > 0
              ? Number(
                  (
                    totalProfit /
                    trades.length
                  ).toFixed(2)
                )
              : 0,
        },
      });
    } catch (error) {
      console.error(
        "GET GOLD STATS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load gold statistics.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// GOLD DIAGNOSTICS
// GET /api/gold/debug
// Used for Backend Testing
// ======================================================

router.get(
  "/debug",
  verifyToken,
  async (req, res) => {
    try {
      const [
        wallet,
        totalTrades,
        totalTransactions,
      ] = await Promise.all([
        Wallet.findOne({
          userId: req.user.id,
        }).lean(),

        GoldTrade.countDocuments({
          userId: req.user.id,
        }),

        Transaction.countDocuments({
          userId: req.user.id,
        }),
      ]);

      return res.status(200).json({
        success: true,
        module:
          "Gold API V18 Enterprise",

        diagnostics: {
          userId:
            req.user.id,

          username:
            req.user.username,

          walletExists:
            !!wallet,

          wallet: wallet
            ? {
                pkrBalance:
                  wallet.pkrBalance,

                goldBalance:
                  wallet.goldBalance,

                usdtBalance:
                  wallet.usdtBalance,

                portfolioValue:
                  wallet.portfolioValue,

                liveProfit:
                  wallet.liveProfit,
              }
            : null,

          totalTrades,
          totalTransactions,
        },

        checkedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "GOLD DEBUG ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Diagnostics failed.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// ADMIN REFRESH USER PORTFOLIO
// GET /api/gold/admin/refresh/:username
// ======================================================

router.get(
  "/admin/refresh/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username =
        req.params.username
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          username,
        })
          .select("_id username")
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      const wallet =
        await Wallet.findOne({
          userId: user._id,
        }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message:
            "Wallet not found.",
        });
      }

      const settings =
        await getGoldSettings();

      const portfolioValue =
        Number(
          (
            wallet.goldBalance *
            settings.sellGoldPrice
          ).toFixed(2)
        );

      return res.status(200).json({
        success: true,

        username,

        wallet: {
          pkrBalance:
            wallet.pkrBalance,

          goldBalance:
            wallet.goldBalance,

          usdtBalance:
            wallet.usdtBalance,

          portfolioValue,

          liveProfit:
            wallet.liveProfit,
        },

        refreshedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "ADMIN REFRESH PORTFOLIO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to refresh user portfolio.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// GOLD ROUTE LIST
// GET /api/gold/routes
// Used for API Diagnostics
// ======================================================

router.get("/routes", (req, res) => {
  return res.status(200).json({
    success: true,
    module:
      "GoldTrade V18 Enterprise",
    version: "18.0.0",

    routes: [
      "GET /api/gold/health",
      "GET /api/gold/status",
      "GET /api/gold/price",
      "GET /api/gold/wallet",

      "POST /api/gold/buy",
      "POST /api/gold/sell",

      "GET /api/gold/portfolio",
      "GET /api/gold/portfolio/:username",

      "GET /api/gold/history",
      "GET /api/gold/history/search",
      "GET /api/gold/history/:username",
      "GET /api/gold/recent",

      "GET /api/gold/settings",
      "PATCH /api/gold/settings",
      "PATCH /api/gold/market",
      "PATCH /api/gold/trading",

      "GET /api/gold/admin/dashboard",
      "GET /api/gold/admin/top-traders",
      "GET /api/gold/admin/analytics",
      "GET /api/gold/admin/user-summary/:username",

      "PATCH /api/gold/admin/cancel/:tradeId",
      "PATCH /api/gold/admin/trade-note/:tradeId",
      "GET /api/gold/admin/refresh/:username",

      "GET /api/gold/refresh",
      "GET /api/gold/stats",
      "GET /api/gold/debug",
    ],

    timestamp:
      new Date().toISOString(),
  });
});

// ======================================================
// ROUTER EXPORT
// ======================================================

module.exports = router;