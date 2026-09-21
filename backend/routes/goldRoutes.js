const express = require("express");
const router = express.Router();

const User = require("../models/User");
const GoldOrder = require("../models/GoldOrder");
const Settings = require("../models/Settings");
const WalletTransaction = require("../models/WalletTransaction");

const {
  verifyToken,
  checkWalletStatus,
} = require("../middleware/auth");

// =====================================================
// GET LIVE GOLD PRICE
// GET /api/gold/price
// =====================================================

router.get("/price", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        buyGoldPrice: 312000,
        sellGoldPrice: 310000,
        goldPriceUSD: 3350,
        usdToPkr: 295,
        goldTradingEnabled: true,
        marketStatus: "OPEN",
      });
    }

    return res.json({
      success: true,
      buyPrice: settings.buyGoldPrice,
      sellPrice: settings.sellGoldPrice,
      goldPriceUSD: settings.goldPriceUSD,
      usdToPkr: settings.usdToPkr,
      tradingEnabled: settings.goldTradingEnabled,
      marketStatus: settings.marketStatus,
    });
  } catch (error) {
    console.error("Gold Price Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load gold price.",
    });
  }
});

// =====================================================
// BUY GOLD
// POST /api/gold/buy
// =====================================================

router.post("/buy", verifyToken, checkWalletStatus, async (req, res) => {
  try {
    const { quantity } = req.body;

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity.",
      });
    }

    const settings = await Settings.findOne();

    if (!settings || !settings.goldTradingEnabled) {
      return res.status(400).json({
        success: false,
        message: "Gold trading is currently disabled.",
      });
    }

    if (settings.marketStatus !== "OPEN") {
      return res.status(400).json({
        success: false,
        message: "Market is closed.",
      });
    }

    const totalAmount = qty * Number(settings.buyGoldPrice);

    if (req.user.pkrBalance < totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient PKR balance.",
      });
    }

    req.user.pkrBalance -= totalAmount;
    req.user.goldBalance += qty;
    req.user.totalGoldPurchased += qty;
    req.user.totalTradingVolume += totalAmount;
    req.user.totalTransactions += 1;

    await req.user.save();

    await GoldOrder.create({
      username: req.user.username,
      fullName: req.user.fullName,
      orderType: "BUY",
      quantity: qty,
      price: settings.buyGoldPrice,
      totalAmount,
      status: "Approved",
      paymentStatus: "Paid",
      approvedBy: "SYSTEM",
      approvedAt: new Date(),
    });

    await WalletTransaction.create({
      username: req.user.username,
      walletType: "GOLD",
      transactionType: "BUY_GOLD",
      amount: totalAmount,
      status: "Completed",
      note: `Bought ${qty} gram gold.`,
    });

    return res.json({
      success: true,
      message: "Gold purchased successfully.",
      balances: {
        pkrBalance: req.user.pkrBalance,
        goldBalance: req.user.goldBalance,
      },
    });
  } catch (error) {
    console.error("Buy Gold Error:", error);

    return res.status(500).json({
      success: false,
      message: "Gold purchase failed.",
    });
  }
});

// =====================================================
// SELL GOLD
// POST /api/gold/sell
// =====================================================

router.post("/sell", verifyToken, checkWalletStatus, async (req, res) => {
  try {
    const { quantity } = req.body;

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity.",
      });
    }

    const settings = await Settings.findOne();

    if (!settings || !settings.goldTradingEnabled) {
      return res.status(400).json({
        success: false,
        message: "Gold trading is disabled.",
      });
    }

    if (req.user.goldBalance < qty) {
      return res.status(400).json({
        success: false,
        message: "Insufficient Gold balance.",
      });
    }

    const totalAmount = qty * Number(settings.sellGoldPrice);

    req.user.goldBalance -= qty;
    req.user.pkrBalance += totalAmount;
    req.user.totalGoldSold += qty;
    req.user.totalTradingVolume += totalAmount;
    req.user.totalTransactions += 1;

    await req.user.save();

    await GoldOrder.create({
      username: req.user.username,
      fullName: req.user.fullName,
      orderType: "SELL",
      quantity: qty,
      price: settings.sellGoldPrice,
      totalAmount,
      status: "Approved",
      paymentStatus: "Paid",
      approvedBy: "SYSTEM",
      approvedAt: new Date(),
    });

    await WalletTransaction.create({
      username: req.user.username,
      walletType: "GOLD",
      transactionType: "SELL_GOLD",
      amount: totalAmount,
      status: "Completed",
      note: `Sold ${qty} gram gold.`,
    });

    return res.json({
      success: true,
      message: "Gold sold successfully.",
      balances: {
        pkrBalance: req.user.pkrBalance,
        goldBalance: req.user.goldBalance,
      },
    });
  } catch (error) {
    console.error("Sell Gold Error:", error);

    return res.status(500).json({
      success: false,
      message: "Gold selling failed.",
    });
  }
});

// =====================================================
// USER GOLD HISTORY
// GET /api/gold/history
// =====================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const history = await GoldOrder.find({
      username: req.user.username,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Gold History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load history.",
    });
  }
});

// =====================================================
// USER GOLD PORTFOLIO
// GET /api/gold/portfolio
// =====================================================

router.get("/portfolio", verifyToken, async (req, res) => {
  try {
    const settings = await Settings.findOne();

    const currentPrice = settings?.sellGoldPrice || 0;

    const portfolioValue =
      Number(req.user.goldBalance || 0) * currentPrice;

    return res.json({
      success: true,
      portfolio: {
        goldBalance: req.user.goldBalance,
        currentPrice,
        portfolioValue,
      },
    });
  } catch (error) {
    console.error("Portfolio Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load portfolio.",
    });
  }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;