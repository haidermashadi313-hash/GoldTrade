const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Settings = require("../models/Settings");
const GoldTrade = require("../models/GoldTrade");
const Transaction = require("../models/Transaction");

// ==============================================
// GET USER GOLD HISTORY
// GET /api/gold/history/:username
// ==============================================
router.get("/history/:username", async (req, res) => {
  try {
    const history = await GoldTrade.find({
      username: req.params.username,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==============================================
// BUY GOLD
// POST /api/gold/buy
// ==============================================
router.post("/buy", async (req, res) => {
  try {
    const { username, grams } = req.body;

    const goldGram = Number(grams);

    if (!goldGram || goldGram <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gold amount.",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const settings = await Settings.findOne();

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: "Gold settings not configured.",
      });
    }

    const buyPrice =
      settings.buyGoldPrice ||
      settings.goldPriceUSD * settings.usdToPkr;

    const totalCost = goldGram * buyPrice;

    if (user.walletBalance < totalCost) {
      return res.status(400).json({
        success: false,
        message: "Insufficient PKR Wallet Balance.",
      });
    }

    const currentGold = user.goldBalance || 0;
    const currentAverage = user.goldAveragePrice || 0;

    const newAverage =
      currentGold === 0
        ? buyPrice
        : (
            currentGold * currentAverage +
            goldGram * buyPrice
          ) /
          (currentGold + goldGram);

    user.walletBalance -= totalCost;
    user.goldBalance += goldGram;
    user.goldAveragePrice = Number(newAverage.toFixed(2));
    user.totalGoldBuy = (user.totalGoldBuy || 0) + goldGram;

    await user.save();

    await GoldTrade.create({
      username,
      tradeType: "BUY",
      grams: goldGram,
      pricePerGram: buyPrice,
      totalPKR: totalCost,
      averagePrice: user.goldAveragePrice,
      walletBefore: user.walletBalance + totalCost,
      walletAfter: user.walletBalance,
      goldBefore: currentGold,
      goldAfter: user.goldBalance,
      updatedBy: "System",
      status: "Completed",
    });

    await Transaction.create({
      username,
      type: "Gold Buy",
      amount: totalCost,
      method: "PKR Wallet",
      transactionId: `GB${Date.now()}`,
      status: "Completed",
      reason: `${goldGram}g Gold Purchased`,
    });

    res.json({
      success: true,
      message: "Gold Purchased Successfully.",
      data: {
        walletBalance: user.walletBalance,
        goldBalance: user.goldBalance,
        averagePrice: user.goldAveragePrice,
        totalCost,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==============================================
// SELL GOLD
// POST /api/gold/sell
// ==============================================
router.post("/sell", async (req, res) => {
  try {
    const { username, grams } = req.body;

    const goldGram = Number(grams);

    if (!goldGram || goldGram <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gold amount.",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const settings = await Settings.findOne();

    if (!settings) {
      return res.status(400).json({
        success: false,
        message: "Gold settings not configured.",
      });
    }

    const sellPrice =
      settings.sellGoldPrice ||
      settings.goldPriceUSD * settings.usdToPkr;

    if (user.goldBalance < goldGram) {
      return res.status(400).json({
        success: false,
        message: "Not enough gold balance.",
      });
    }

    const receiveAmount = goldGram * sellPrice;
    const buyValue = goldGram * user.goldAveragePrice;
    const profit = receiveAmount - buyValue;

    const previousWallet = user.walletBalance;
    const previousGold = user.goldBalance;

    user.goldBalance -= goldGram;
    user.walletBalance += receiveAmount;
    user.goldProfitLoss =
      (user.goldProfitLoss || 0) + profit;
    user.totalGoldSell =
      (user.totalGoldSell || 0) + goldGram;

    if (user.goldBalance <= 0) {
      user.goldAveragePrice = 0;
    }

    await user.save();

    await GoldTrade.create({
      username,
      tradeType: "SELL",
      grams: goldGram,
      pricePerGram: sellPrice,
      totalPKR: receiveAmount,
      profit,
      walletBefore: previousWallet,
      walletAfter: user.walletBalance,
      goldBefore: previousGold,
      goldAfter: user.goldBalance,
      updatedBy: "System",
      status: "Completed",
    });

    await Transaction.create({
      username,
      type: "Gold Sell",
      amount: receiveAmount,
      method: "PKR Wallet",
      transactionId: `GS${Date.now()}`,
      status: "Completed",
      reason: `${goldGram}g Gold Sold`,
    });

    res.json({
      success: true,
      message: "Gold Sold Successfully.",
      data: {
        receiveAmount,
        profit,
        walletBalance: user.walletBalance,
        goldBalance: user.goldBalance,
        totalProfitLoss: user.goldProfitLoss,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==============================================
// GOLD PORTFOLIO
// GET /api/gold/portfolio/:username
// ==============================================
router.get("/portfolio/:username", async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const settings = await Settings.findOne();

    const sellPrice =
      settings?.sellGoldPrice ||
      settings.goldPriceUSD * settings.usdToPkr;

    const portfolioValue =
      user.goldBalance * sellPrice;

    const liveProfit =
      (sellPrice - user.goldAveragePrice) *
      user.goldBalance;

    res.json({
      success: true,
      data: {
        username: user.username,
        walletBalance: user.walletBalance,
        goldBalance: user.goldBalance,
        averagePrice: user.goldAveragePrice,
        portfolioValue,
        liveProfit,
        totalProfitLoss: user.goldProfitLoss,
        buyPrice: settings.buyGoldPrice,
        sellPrice,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==============================================
// ADMIN GOLD CREDIT / DEBIT
// PUT /api/gold/admin/:id
// ==============================================
router.put("/admin/:id", async (req, res) => {
  try {
    const { amount, action, reason, updatedBy } = req.body;

    const grams = Number(amount);

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (action === "credit") {
      user.goldBalance += grams;
    } else if (action === "debit") {
      if (user.goldBalance < grams) {
        return res.status(400).json({
          success: false,
          message: "Gold balance too low.",
        });
      }

      user.goldBalance -= grams;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action.",
      });
    }

    await user.save();

    await Transaction.create({
      username: user.username,
      type: "Admin Gold Wallet",
      amount: grams,
      method: "Admin Manager",
      transactionId: `AG${Date.now()}`,
      status: action === "credit" ? "Credit" : "Debit",
      reason: reason || "Manual Gold Wallet Update",
      updatedBy: updatedBy || "Admin",
    });

    res.json({
      success: true,
      message: "Gold Wallet Updated Successfully.",
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;