const mongoose = require("mongoose");

const marketSettingsSchema = new mongoose.Schema(
  {
    goldPriceUSD: {
      type: Number,
      default: 3350,
    },

    usdToPkr: {
      type: Number,
      default: 282,
    },

    buyMargin: {
      type: Number,
      default: 250,
    },

    sellMargin: {
      type: Number,
      default: 250,
    },

    usdtRate: {
      type: Number,
      default: 281.5,
    },

    tradingEnabled: {
      type: Boolean,
      default: true,
    },

    autoUpdate: {
      type: Boolean,
      default: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "MarketSettings",
  marketSettingsSchema
);