// ======================================================
// GoldTrade V18 - Settings Model
// ======================================================

const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    buyGoldPrice: {
      type: Number,
      default: 0,
    },

    sellGoldPrice: {
      type: Number,
      default: 0,
    },

    goldPriceUSD: {
      type: Number,
      default: 0,
    },

    usdToPkr: {
      type: Number,
      default: 0,
    },

    goldTradingEnabled: {
      type: Boolean,
      default: true,
    },

    marketStatus: {
      type: String,
      default: "OPEN",
      enum: ["OPEN", "CLOSED"],
    },
  },
  {
    timestamps: true,
    collection: "settings",
  }
);

module.exports = mongoose.model("Settings", settingsSchema);