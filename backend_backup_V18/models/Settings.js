const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // ===============================
    // GOLD MARKET SETTINGS
    // ===============================
    buyGoldPrice: {
      type: Number,
      default: 31250,
      min: 1,
    },

    sellGoldPrice: {
      type: Number,
      default: 30980,
      min: 1,
    },

    //  REQUIRED FOR PORTFOLIO API
    goldPriceUSD: {
      type: Number,
      default: 108.45,
    },

    usdToPkr: {
      type: Number,
      default: 290,
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

    // Cashback
    cashbackEnabled: {
      type: Boolean,
      default: true,
    },

    cashbackRate: {
      type: Number,
      default: 2,
    },

    // Referral
    referralEnabled: {
      type: Boolean,
      default: true,
    },

    referralBonus: {
      type: Number,
      default: 500,
    },

    // Deposit / Withdraw
    minimumDeposit: {
      type: Number,
      default: 1000,
    },

    minimumWithdraw: {
      type: Number,
      default: 1000,
    },

    withdrawEnabled: {
      type: Boolean,
      default: true,
    },

    depositEnabled: {
      type: Boolean,
      default: true,
    },

    // Platform
    platformName: {
      type: String,
      default: "GoldTrade",
    },

    maintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Settings ||
  mongoose.model("Settings", settingsSchema);