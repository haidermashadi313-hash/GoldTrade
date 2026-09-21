const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    // =====================================================
    // GOLD MARKET SETTINGS
    // =====================================================

    buyGoldPrice: {
      type: Number,
      default: 312000,
    },

    sellGoldPrice: {
      type: Number,
      default: 310000,
    },

    goldPriceUSD: {
      type: Number,
      default: 3350,
    },

    usdToPkr: {
      type: Number,
      default: 285,
    },

    goldTradingEnabled: {
      type: Boolean,
      default: true,
    },

    marketStatus: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },

    // =====================================================
    // USDT MARKET SETTINGS
    // =====================================================

    usdtBuyPrice: {
      type: Number,
      default: 285,
    },

    usdtSellPrice: {
      type: Number,
      default: 283,
    },

    usdtTradingEnabled: {
      type: Boolean,
      default: true,
    },

    // =====================================================
    // PLATFORM SETTINGS
    // =====================================================

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    registrationEnabled: {
      type: Boolean,
      default: true,
    },

    depositsEnabled: {
      type: Boolean,
      default: true,
    },

    withdrawalsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Always keep only one settings document.
module.exports = mongoose.model("Settings", SettingsSchema);