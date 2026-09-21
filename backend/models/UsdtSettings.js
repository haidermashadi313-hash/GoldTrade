const mongoose = require("mongoose");

// ======================================================
// USDT SETTINGS SCHEMA
// GoldTrade V18 Enterprise
// ======================================================

const usdtSettingsSchema = new mongoose.Schema(
  {
    // Live Buy / Sell Rates
    buyUsdtPrice: {
      type: Number,
      required: true,
      default: 286,
      min: 1,
    },

    sellUsdtPrice: {
      type: Number,
      required: true,
      default: 284,
      min: 1,
    },

    // USD Market Price
    usdtPriceUSD: {
      type: Number,
      required: true,
      default: 1,
      min: 0.1,
    },

    // USD → PKR Rate
    usdToPkr: {
      type: Number,
      required: true,
      default: 285.5,
      min: 1,
    },

    // Market Control
    usdtTradingEnabled: {
      type: Boolean,
      default: true,
    },

    marketStatus: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },

    marketMessage: {
      type: String,
      default: "USDT Market is Open",
      trim: true,
    },

    // Buy Limits
    minimumBuyUsdt: {
      type: Number,
      default: 1,
      min: 0,
    },

    maximumBuyUsdt: {
      type: Number,
      default: 100000,
      min: 1,
    },

    // Sell Limits
    minimumSellUsdt: {
      type: Number,
      default: 1,
      min: 0,
    },

    maximumSellUsdt: {
      type: Number,
      default: 100000,
      min: 1,
    },

    // Enterprise Info
    lastUpdatedBy: {
      type: String,
      default: "System",
    },

    updateReason: {
      type: String,
      default: "Initial Configuration",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ======================================================
// SINGLETON SETTINGS DOCUMENT
// ======================================================

usdtSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();

  if (!settings) {
    settings = await this.create({});
  }

  return settings;
};

// ======================================================
// EXPORT MODEL
// ======================================================

module.exports = mongoose.model(
  "UsdtSettings",
  usdtSettingsSchema
);