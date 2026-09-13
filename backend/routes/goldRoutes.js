const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Settings = require("../models/Settings");
const GoldTrade = require("../models/GoldTrade");
const Transaction = require("../models/Transaction");

// =====================================================
// GET LIVE GOLD PRICE
// GET /api/gold/price
// =====================================================
router.get("/price", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.json({
      success: true,
      buyPrice: settings.buyGoldPrice,
      sellPrice: settings.sellGoldPrice,
      tradingEnabled: settings.goldTradingEnabled,
      marketStatus: settings.marketStatus,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// GET USER GOLD HISTORY
// GET /api/gold/history/:username
// =====================================================
router.get("/history/:username", async (req, res) => {
  try {
    const history = await GoldTrade.find({
      username: req.params.username,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      transactions: history,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// BUY GOLD
// POST /api/gold/buy
// =====================================================
router.post("/buy", async (req, res) => {
  try {
    const { username, grams } = req.body;

    const quantity = Number(grams);

    if (!username || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Username and valid grams are required.",
      });
    }

    const user = await User.findOne({ username });

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

    if (!settings.goldTradingEnabled) {
      return res.status(400).json({
        success: false,
        message: "Gold trading is currently disabled.",
      });
    }

    const buyPrice = Number(settings.buyGoldPrice);
    const totalCost = quantity * buyPrice;

    if ((user.walletBalance || 0) < totalCost) {
      return res.status(400).json({
        success: false,
        message: "Insufficient PKR wallet balance.",
      });
    }

    const previousWallet = Number(user.walletBalance || 0);
    const previousGold = Number(user.goldBalance || 0);
    const previousAverage = Number(user.goldAveragePrice || 0);

    const averagePrice =
      previousGold === 0
        ? buyPrice
        : (
            previousGold * previousAverage +
            quantity * buyPrice
          ) / (previousGold + quantity);

    user.walletBalance = previousWallet - totalCost;
    user.goldBalance = previousGold + quantity;
    user.goldAveragePrice = Number(averagePrice.toFixed(2));
    user.totalGoldBuy = (user.totalGoldBuy || 0) + quantity;

    await user.save();

    await GoldTrade.create({
      user: user._id,
      username: user.username,
      tradeType: "BUY",
      grams: quantity,
      pricePerGram: buyPrice,
      totalPKR: totalCost,
      averageBuyPrice: user.goldAveragePrice,
      profitLoss: 0,
      status: "Completed",
    });

    await Transaction.create({
      username: user.username,
      type: "Gold Buy",
      amount: totalCost,
      transactionId: `GB${Date.now()}`,
      status: "Completed",
      reason: `${quantity}g Gold Purchased`,
    });

    res.json({
      success: true,
      message: "Gold purchased successfully.",
      walletBalance: user.walletBalance,
      goldBalance: user.goldBalance,
      averageBuyPrice: user.goldAveragePrice,
      totalCost,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// =====================================================
// SELL GOLD
// POST /api/gold/sell
// =====================================================
router.post("/sell", async (req, res) => {
  try {
    const { username, grams } = req.body;

    const quantity = Number(grams);

    if (!username || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Username and valid grams are required.",
      });
    }

    const user = await User.findOne({ username });

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

    if (!settings.goldTradingEnabled) {
      return res.status(400).json({
        success: false,
        message: "Gold trading is currently disabled.",
      });
    }

    if ((user.goldBalance || 0) < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient gold balance.",
      });
    }

    const sellPrice = Number(settings.sellGoldPrice);
    const receiveAmount = quantity * sellPrice;

    const previousWallet = Number(user.walletBalance || 0);
    const previousGold = Number(user.goldBalance || 0);
    const averageBuyPrice = Number(user.goldAveragePrice || 0);

    const profitLoss = (sellPrice - averageBuyPrice) * quantity;

    user.walletBalance = previousWallet + receiveAmount;
    user.goldBalance = previousGold - quantity;
    user.goldProfitLoss =
      Number(user.goldProfitLoss || 0) + profitLoss;
    user.totalGoldSell =
      Number(user.totalGoldSell || 0) + quantity;

    if (user.goldBalance <= 0) {
      user.goldBalance = 0;
      user.goldAveragePrice = 0;
    }

    await user.save();

    await GoldTrade.create({
      user: user._id,
      username: user.username,
      tradeType: "SELL",
      grams: quantity,
      pricePerGram: sellPrice,
      totalPKR: receiveAmount,
      averageBuyPrice,
      profitLoss,
      status: "Completed",
    });

    await Transaction.create({
      username: user.username,
      type: "Gold Sell",
      amount: receiveAmount,
      transactionId: `GS${Date.now()}`,
      status: "Completed",
      reason: `${quantity}g Gold Sold`,
    });

    res.json({
      success: true,
      message: "Gold sold successfully.",
      walletBalance: user.walletBalance,
      goldBalance: user.goldBalance,
      averageBuyPrice: user.goldAveragePrice,
      receiveAmount,
      profitLoss,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// GOLD PORTFOLIO
// GET /api/gold/portfolio/:username
// =====================================================
router.get("/portfolio/:username", async (req, res) => {
  try {
    const username = req.params.username;

    const user = await User.findOne({ username });

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

    const currentPrice = Number(settings.sellGoldPrice);

    const goldBalance = Number(user.goldBalance || 0);
    const averageBuyPrice = Number(user.goldAveragePrice || 0);

    const totalInvested = goldBalance * averageBuyPrice;
    const portfolioValue = goldBalance * currentPrice;
    const liveProfit = portfolioValue - totalInvested;

    const transactions = await GoldTrade.find({ username })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      goldBalance,
      averageBuyPrice,
      currentPrice,
      walletBalance: Number(user.walletBalance || 0),
      totalInvested,
      portfolioValue,
      liveProfit,
      totalProfitLoss: Number(user.goldProfitLoss || 0),
      totalGoldBuy: Number(user.totalGoldBuy || 0),
      totalGoldSell: Number(user.totalGoldSell || 0),
      transactions,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// ADMIN GOLD CREDIT / DEBIT
// PUT /api/gold/admin/:id
// =====================================================
router.put("/admin/:id", async (req, res) => {
  try {
    const { amount, action, reason, updatedBy } = req.body;

    const grams = Number(amount);

    if (grams <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gold amount.",
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

    if (action === "credit") {
      user.goldBalance = previousGold + grams;
    } else if (action === "debit") {
      if (previousGold < grams) {
        return res.status(400).json({
          success: false,
          message: "Gold balance is too low.",
        });
      }

      user.goldBalance = previousGold - grams;

      if (user.goldBalance === 0) {
        user.goldAveragePrice = 0;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Action must be credit or debit.",
      });
    }

    await user.save();

    // Save Transaction
    await Transaction.create({
      username: user.username,
      type: "Admin Gold Wallet",
      amount: grams,
      transactionId: `AG${Date.now()}`,
      status: action === "credit" ? "Credit" : "Debit",
      reason: reason || "Manual Gold Wallet Update",
      updatedBy: updatedBy || "Admin",
    });

    res.json({
      success: true,
      message: "Gold wallet updated successfully.",
      data: {
        username: user.username,
        goldBalance: user.goldBalance,
        averageBuyPrice: user.goldAveragePrice,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// RESET GOLD SETTINGS (OPTIONAL ADMIN TOOL)
// POST /api/gold/reset-settings
// =====================================================
router.post("/reset-settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    settings.buyGoldPrice = 31250;
    settings.sellGoldPrice = 30980;
    settings.goldTradingEnabled = true;
    settings.marketStatus = "OPEN";

    await settings.save();

    res.json({
      success: true,
      message: "Gold settings reset successfully.",
      settings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// API HEALTH CHECK
// GET /api/gold/test
// =====================================================
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Gold Routes Working Successfully ✅",
    timestamp: new Date().toISOString(),
  });
});
// =====================================================
// CREATE / RESET GOLD SETTINGS
// GET /api/gold/reset-settings
// =====================================================
router.get("/reset-settings", async (req, res) => {
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

    res.json({
      success: true,
      message: "Gold settings created successfully.",
      settings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;