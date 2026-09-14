const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const User = require("../models/User");
const Settings = require("../models/Settings");
const GoldTrade = require("../models/GoldTrade");
const Transaction = require("../models/Transaction");
const WalletTransaction = require("../models/WalletTransaction");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// =====================================================
// API HEALTH CHECK
// GET /api/gold/test
// =====================================================

router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Gold Routes Working Successfully ✅",
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// GET LIVE GOLD PRICE
// GET /api/gold/price
// =====================================================

router.get("/price", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        buyGoldPrice: 31250,
        sellGoldPrice: 30980,
        goldPriceUSD: 108.45,
        usdToPkr: 290,
        goldTradingEnabled: true,
        marketStatus: "OPEN",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        buyPrice: Number(settings.buyGoldPrice),
        sellPrice: Number(settings.sellGoldPrice),
        goldPriceUSD: Number(settings.goldPriceUSD || 0),
        usdToPkr: Number(settings.usdToPkr || 0),
        tradingEnabled: settings.goldTradingEnabled,
        marketStatus: settings.marketStatus,
        updatedAt: settings.updatedAt,
      },
    });

  } catch (error) {
    console.error("GET GOLD PRICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load gold price.",
    });
  }
});

// =====================================================
// ADMIN UPDATE GOLD SETTINGS
// PUT /api/gold/admin/settings
// =====================================================

router.put("/admin/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      buyGoldPrice,
      sellGoldPrice,
      goldPriceUSD,
      usdToPkr,
      goldTradingEnabled,
      marketStatus,
    } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    if (buyGoldPrice !== undefined)
      settings.buyGoldPrice = Number(buyGoldPrice);

    if (sellGoldPrice !== undefined)
      settings.sellGoldPrice = Number(sellGoldPrice);

    if (goldPriceUSD !== undefined)
      settings.goldPriceUSD = Number(goldPriceUSD);

    if (usdToPkr !== undefined)
      settings.usdToPkr = Number(usdToPkr);

    if (goldTradingEnabled !== undefined)
      settings.goldTradingEnabled = goldTradingEnabled;

    if (marketStatus !== undefined)
      settings.marketStatus = marketStatus;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Gold settings updated successfully.",
      settings,
    });

  } catch (error) {
    console.error("UPDATE GOLD SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update gold settings.",
    });
  }
});
// =====================================================
// BUY GOLD
// POST /api/gold/buy
// =====================================================

router.post("/buy", verifyToken, async (req, res) => {
  try {
    const { grams } = req.body;

    const quantity = Number(grams);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid gold quantity.",
      });
    }

    // Logged-in User
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Wallet Frozen Check
    if (user.walletFrozen) {
      return res.status(403).json({
        success: false,
        message: "Your wallet is frozen. Please contact admin.",
      });
    }

    // Gold Settings
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    // Market Status Check
    if (!settings.goldTradingEnabled || settings.marketStatus !== "OPEN") {
      return res.status(400).json({
        success: false,
        message: "Gold market is currently closed.",
      });
    }

    const buyPrice = Number(settings.buyGoldPrice);
    const totalCost = quantity * buyPrice;

    const previousWallet = Number(user.balance || user.walletBalance || 0);

    if (previousWallet < totalCost) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    const previousGold = Number(user.goldBalance || 0);
    const previousAverage = Number(user.goldAveragePrice || 0);

    // Average Buy Price Calculation
    const averagePrice =
      previousGold === 0
        ? buyPrice
        : (
            previousGold * previousAverage +
            quantity * buyPrice
          ) / (previousGold + quantity);

    // Wallet Update
    const newWalletBalance = previousWallet - totalCost;

    user.balance = newWalletBalance;

    if ("walletBalance" in user) {
      user.walletBalance = newWalletBalance;
    }

    user.goldBalance = previousGold + quantity;
    user.goldAveragePrice = Number(averagePrice.toFixed(2));
    user.totalGoldBuy = Number(user.totalGoldBuy || 0) + quantity;

    await user.save();

    // Gold Trade History
    const trade = await GoldTrade.create({
      userId: user._id,
      username: user.username,
      tradeType: "BUY",
      grams: quantity,
      pricePerGram: buyPrice,
      totalPKR: totalCost,
      averageBuyPrice: user.goldAveragePrice,
      profitLoss: 0,
      status: "Completed",
    });

    // Transaction History
    await Transaction.create({
      userId: user._id,
      username: user.username,
      type: "Gold Buy",
      amount: totalCost,
      transactionId: `GB${Date.now()}`,
      status: "Completed",
      reason: `${quantity} Gram Gold Purchased`,
    });

    // Wallet Transaction History
    await WalletTransaction.create({
      userId: user._id,
      username: user.username,
      type: "Gold Buy",
      amount: totalCost,
      status: "Completed",
      balanceBefore: previousWallet,
      balanceAfter: newWalletBalance,
      referenceId: trade._id,
      description: `${quantity}g Gold Buy @ PKR ${buyPrice}/g`,
    });

    return res.status(200).json({
      success: true,
      message: "Gold purchased successfully.",

      trade,

      wallet: {
        previousBalance: previousWallet,
        currentBalance: newWalletBalance,
      },

      gold: {
        previousGold,
        currentGold: user.goldBalance,
        averageBuyPrice: user.goldAveragePrice,
      },

      totalCost,
    });

  } catch (error) {
    console.error("BUY GOLD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to buy gold.",
    });
  }
});
// =====================================================
// SELL GOLD
// POST /api/gold/sell
// =====================================================

router.post("/sell", verifyToken, async (req, res) => {
  try {
    const { grams } = req.body;

    const quantity = Number(grams);

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid gold quantity.",
      });
    }

    // Logged-in User
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Wallet Frozen Check
    if (user.walletFrozen) {
      return res.status(403).json({
        success: false,
        message: "Your wallet is frozen. Please contact admin.",
      });
    }

    // Gold Settings
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    // Market Status Check
    if (!settings.goldTradingEnabled || settings.marketStatus !== "OPEN") {
      return res.status(400).json({
        success: false,
        message: "Gold market is currently closed.",
      });
    }

    const currentGoldBalance = Number(user.goldBalance || 0);

    if (currentGoldBalance < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient gold balance.",
      });
    }

    const sellPrice = Number(settings.sellGoldPrice);
    const receiveAmount = quantity * sellPrice;

    const previousWallet = Number(user.balance || user.walletBalance || 0);
    const averageBuyPrice = Number(user.goldAveragePrice || 0);

    const profitLoss = (sellPrice - averageBuyPrice) * quantity;

    // Wallet Credit
    const newWalletBalance = previousWallet + receiveAmount;

    user.balance = newWalletBalance;

    if ("walletBalance" in user) {
      user.walletBalance = newWalletBalance;
    }

    user.goldBalance = currentGoldBalance - quantity;
    user.totalGoldSell = Number(user.totalGoldSell || 0) + quantity;
    user.goldProfitLoss =
      Number(user.goldProfitLoss || 0) + profitLoss;

    // Reset average if no gold left
    if (user.goldBalance <= 0) {
      user.goldBalance = 0;
      user.goldAveragePrice = 0;
    }

    await user.save();

    // Gold Trade History
    const trade = await GoldTrade.create({
      userId: user._id,
      username: user.username,
      tradeType: "SELL",
      grams: quantity,
      pricePerGram: sellPrice,
      totalPKR: receiveAmount,
      averageBuyPrice,
      profitLoss,
      status: "Completed",
    });

    // Transaction History
    await Transaction.create({
      userId: user._id,
      username: user.username,
      type: "Gold Sell",
      amount: receiveAmount,
      transactionId: `GS${Date.now()}`,
      status: "Completed",
      reason: `${quantity} Gram Gold Sold`,
    });

    // Wallet Transaction History
    await WalletTransaction.create({
      userId: user._id,
      username: user.username,
      type: "Gold Sell",
      amount: receiveAmount,
      status: "Completed",
      balanceBefore: previousWallet,
      balanceAfter: newWalletBalance,
      referenceId: trade._id,
      description: `${quantity}g Gold Sell @ PKR ${sellPrice}/g`,
    });

    return res.status(200).json({
      success: true,
      message: "Gold sold successfully.",

      trade,

      wallet: {
        previousBalance: previousWallet,
        currentBalance: newWalletBalance,
      },

      gold: {
        previousGold: currentGoldBalance,
        currentGold: user.goldBalance,
        averageBuyPrice: user.goldAveragePrice,
      },

      receiveAmount,
      profitLoss,
    });

  } catch (error) {
    console.error("SELL GOLD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to sell gold.",
    });
  }
});

// =====================================================
// USER GOLD PORTFOLIO DASHBOARD
// GET /api/gold/portfolio
// =====================================================

router.get("/portfolio", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    const currentSellPrice = Number(settings.sellGoldPrice);

    const goldBalance = Number(user.goldBalance || 0);
    const averageBuyPrice = Number(user.goldAveragePrice || 0);
    const walletBalance = Number(user.balance || user.walletBalance || 0);

    const totalInvested = goldBalance * averageBuyPrice;
    const currentValue = goldBalance * currentSellPrice;
    const liveProfitLoss = currentValue - totalInvested;

    const recentTrades = await GoldTrade.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      portfolio: {
        walletBalance,
        goldBalance,
        averageBuyPrice,
        currentSellPrice,
        totalInvested,
        currentValue,
        liveProfitLoss,
        totalGoldBuy: Number(user.totalGoldBuy || 0),
        totalGoldSell: Number(user.totalGoldSell || 0),
        totalProfitLoss: Number(user.goldProfitLoss || 0),
      },
      recentTrades,
    });

  } catch (error) {
    console.error("PORTFOLIO ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load portfolio.",
    });
  }
});


// =====================================================
// USER GOLD HISTORY
// GET /api/gold/history
// =====================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const history = await GoldTrade.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalTransactions: history.length,
      transactions: history,
    });

  } catch (error) {
    console.error("GOLD HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load gold history.",
    });
  }
});


// =====================================================
// USER DASHBOARD SUMMARY
// GET /api/gold/dashboard
// =====================================================

router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const settings = await Settings.findOne();

    const currentSellPrice = Number(settings?.sellGoldPrice || 0);
    const currentBuyPrice = Number(settings?.buyGoldPrice || 0);

    const walletBalance = Number(user.balance || user.walletBalance || 0);
    const goldBalance = Number(user.goldBalance || 0);
    const averageBuyPrice = Number(user.goldAveragePrice || 0);

    const portfolioValue = goldBalance * currentSellPrice;
    const investedAmount = goldBalance * averageBuyPrice;
    const liveProfitLoss = portfolioValue - investedAmount;

    return res.status(200).json({
      success: true,

      dashboard: {
        walletBalance,
        goldBalance,

        buyPrice: currentBuyPrice,
        sellPrice: currentSellPrice,

        portfolioValue,
        investedAmount,
        liveProfitLoss,

        totalGoldBuy: Number(user.totalGoldBuy || 0),
        totalGoldSell: Number(user.totalGoldSell || 0),
        realizedProfitLoss: Number(user.goldProfitLoss || 0),
      },
    });

  } catch (error) {
    console.error("GOLD DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard.",
    });
  }
});


// =====================================================
// USER PROFIT / LOSS SUMMARY
// GET /api/gold/profit-loss
// =====================================================

router.get("/profit-loss", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const settings = await Settings.findOne();

    const sellPrice = Number(settings?.sellGoldPrice || 0);
    const goldBalance = Number(user.goldBalance || 0);
    const averageBuyPrice = Number(user.goldAveragePrice || 0);

    const invested = goldBalance * averageBuyPrice;
    const currentValue = goldBalance * sellPrice;
    const unrealizedProfit = currentValue - invested;

    return res.status(200).json({
      success: true,

      summary: {
        goldBalance,
        averageBuyPrice,
        currentSellPrice: sellPrice,

        investedAmount: invested,
        currentValue,

        unrealizedProfit,
        realizedProfit: Number(user.goldProfitLoss || 0),
        totalProfit:
          Number(user.goldProfitLoss || 0) + unrealizedProfit,
      },
    });

  } catch (error) {
    console.error("PROFIT LOSS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load profit/loss summary.",
    });
  }
});
// =====================================================
// ADMIN DASHBOARD SUMMARY
// GET /api/gold/admin/dashboard
// =====================================================

router.get("/admin/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find();

    const settings = await Settings.findOne();

    const totalGoldBalance = users.reduce(
      (sum, user) => sum + Number(user.goldBalance || 0),
      0
    );

    const totalWalletBalance = users.reduce(
      (sum, user) => sum + Number(user.balance || user.walletBalance || 0),
      0
    );

    const totalProfitLoss = users.reduce(
      (sum, user) => sum + Number(user.goldProfitLoss || 0),
      0
    );

    const totalTrades = await GoldTrade.countDocuments();
    const buyTrades = await GoldTrade.countDocuments({ tradeType: "BUY" });
    const sellTrades = await GoldTrade.countDocuments({ tradeType: "SELL" });

    return res.status(200).json({
      success: true,

      dashboard: {
        totalUsers: users.length,
        totalGoldBalance,
        totalWalletBalance,
        totalProfitLoss,
        totalTrades,
        buyTrades,
        sellTrades,

        buyGoldPrice: Number(settings?.buyGoldPrice || 0),
        sellGoldPrice: Number(settings?.sellGoldPrice || 0),
        marketStatus: settings?.marketStatus || "OPEN",
        tradingEnabled: settings?.goldTradingEnabled || false,
      },
    });

  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin dashboard.",
    });
  }
});


// =====================================================
// ADMIN GET ALL GOLD TRADES
// GET /api/gold/admin/trades
// =====================================================

router.get("/admin/trades", verifyToken, isAdmin, async (req, res) => {
  try {
    const trades = await GoldTrade.find()
      .populate("userId", "username email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalTrades: trades.length,
      trades,
    });

  } catch (error) {
    console.error("ADMIN GOLD TRADES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load gold trades.",
    });
  }
});


// =====================================================
// ADMIN MANUAL GOLD CREDIT / DEBIT
// PUT /api/gold/admin/user/:id/wallet
// =====================================================

router.put(
  "/admin/user/:id/wallet",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { amount, action, reason } = req.body;

      const grams = Number(amount);

      if (!grams || grams <= 0) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid gold amount.",
        });
      }

      if (!["credit", "debit"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Action must be credit or debit.",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const previousGold = Number(user.goldBalance || 0);

      let newGoldBalance = previousGold;

      if (action === "credit") {
        newGoldBalance = previousGold + grams;
      }

      if (action === "debit") {
        if (grams > previousGold) {
          return res.status(400).json({
            success: false,
            message: "Insufficient gold balance.",
          });
        }

        newGoldBalance = previousGold - grams;
      }

      user.goldBalance = newGoldBalance;

      if (newGoldBalance === 0) {
        user.goldAveragePrice = 0;
      }

      await user.save();

      await GoldTrade.create({
        userId: user._id,
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
        userId: user._id,
        username: user.username,
        type: "Admin Gold Wallet",
        amount: grams,
        transactionId: `AG${Date.now()}`,
        status: "Completed",
        reason: reason || `Gold ${action} by admin`,
        updatedBy: req.user.username,
      });

      return res.status(200).json({
        success: true,
        message: `Gold ${action} completed successfully.`,

        wallet: {
          previousGold,
          currentGold: newGoldBalance,
        },
      });

    } catch (error) {
      console.error("ADMIN GOLD WALLET ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update gold wallet.",
      });
    }
  }
);


// =====================================================
// ADMIN RESET GOLD SETTINGS
// POST /api/gold/admin/reset-settings
// =====================================================

router.post(
  "/admin/reset-settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      let settings = await Settings.findOne();

      if (!settings) {
        settings = await Settings.create({});
      }

      settings.buyGoldPrice = 31250;
      settings.sellGoldPrice = 30980;
      settings.goldPriceUSD = 108.45;
      settings.usdToPkr = 290;
      settings.goldTradingEnabled = true;
      settings.marketStatus = "OPEN";

      await settings.save();

      return res.status(200).json({
        success: true,
        message: "Gold settings reset successfully.",
        settings,
      });

    } catch (error) {
      console.error("RESET SETTINGS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to reset gold settings.",
      });
    }
  }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;