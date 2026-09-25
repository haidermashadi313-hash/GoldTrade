// ======================================================
// GoldTrade V18 - Gold Controller
// ======================================================

const User = require("../models/User");
const GoldTrade = require("../models/GoldTrade");
const Settings = require("../models/Settings");

// ======================================================
// GET LIVE GOLD PRICE
// ======================================================

const getGoldPrice = async (req, res) => {
  try {
    const settings = await Settings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Gold settings not found.",
      });
    }

    res.json({
      success: true,
      buyPrice: settings.buyGoldPrice || 0,
      sellPrice: settings.sellGoldPrice || 0,
      goldPriceUSD: settings.goldPriceUSD || 0,
      usdToPkr: settings.usdToPkr || 0,
      tradingEnabled: settings.goldTradingEnabled ?? true,
      marketStatus: settings.marketStatus || "OPEN",
    });
  } catch (err) {
    console.error("GET GOLD PRICE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// BUY GOLD
// ======================================================

const buyGold = async (req, res) => {
  try {
    const { grams } = req.body;

    const user = await User.findById(req.user.id);
    const settings = await Settings.findOne();

    if (!user || !settings) {
      return res.status(404).json({
        success: false,
        message: "User or settings not found.",
      });
    }

    const totalPrice = Number(grams) * Number(settings.buyGoldPrice);

    if ((user.wallet || 0) < totalPrice) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    user.wallet -= totalPrice;
    user.goldBalance = (user.goldBalance || 0) + Number(grams);
    await user.save();

    await GoldTrade.create({
      userId: user._id,
      username: user.username,
      type: "BUY",
      grams,
      pricePerGram: settings.buyGoldPrice,
      totalAmount: totalPrice,
    });

    res.json({
      success: true,
      message: "Gold purchased successfully.",
      wallet: user.wallet,
      goldBalance: user.goldBalance,
    });
  } catch (err) {
    console.error("BUY GOLD ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// SELL GOLD
// ======================================================

const sellGold = async (req, res) => {
  try {
    const { grams } = req.body;

    const user = await User.findById(req.user.id);
    const settings = await Settings.findOne();

    if (!user || !settings) {
      return res.status(404).json({
        success: false,
        message: "User or settings not found.",
      });
    }

    if ((user.goldBalance || 0) < Number(grams)) {
      return res.status(400).json({
        success: false,
        message: "Not enough gold balance.",
      });
    }

    const totalAmount = Number(grams) * Number(settings.sellGoldPrice);

    user.goldBalance -= Number(grams);
    user.wallet += totalAmount;
    await user.save();

    await GoldTrade.create({
      userId: user._id,
      username: user.username,
      type: "SELL",
      grams,
      pricePerGram: settings.sellGoldPrice,
      totalAmount,
    });

    res.json({
      success: true,
      message: "Gold sold successfully.",
      wallet: user.wallet,
      goldBalance: user.goldBalance,
    });
  } catch (err) {
    console.error("SELL GOLD ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// GOLD HISTORY
// ======================================================

const getGoldHistory = async (req, res) => {
  try {
    const username = req.params.username;

    const history = await GoldTrade.find({ username }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      history,
    });
  } catch (err) {
    console.error("HISTORY ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// GOLD PORTFOLIO
// ======================================================

const getPortfolio = async (req, res) => {
  try {
    const username = req.params.username;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const settings = await Settings.findOne();

    const currentValue =
      (user.goldBalance || 0) * (settings?.sellGoldPrice || 0);

    res.json({
      success: true,
      goldBalance: user.goldBalance || 0,
      wallet: user.wallet || 0,
      currentValue,
    });
  } catch (err) {
    console.error("PORTFOLIO ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// GET SETTINGS
// ======================================================

const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();

    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error("GET SETTINGS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// UPDATE SETTINGS (ADMIN)
// ======================================================

const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    Object.assign(settings, req.body);

    await settings.save();

    res.json({
      success: true,
      message: "Gold settings updated successfully.",
      settings,
    });
  } catch (err) {
    console.error("UPDATE SETTINGS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// ADMIN DASHBOARD
// ======================================================

const getAdminDashboard = async (req, res) => {
  try {
    const users = await User.countDocuments();
    const trades = await GoldTrade.countDocuments();

    const buyTrades = await GoldTrade.countDocuments({ type: "BUY" });
    const sellTrades = await GoldTrade.countDocuments({ type: "SELL" });

    res.json({
      success: true,
      totalUsers: users,
      totalTrades: trades,
      buyTrades,
      sellTrades,
    });
  } catch (err) {
    console.error("ADMIN DASHBOARD ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  getGoldPrice,
  buyGold,
  sellGold,
  getGoldHistory,
  getPortfolio,
  getSettings,
  updateSettings,
  getAdminDashboard,
};