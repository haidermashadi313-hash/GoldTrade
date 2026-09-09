const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // ==========================================
    // LIVE MARKET SETTINGS
    // ==========================================
    goldPriceUSD: {
      type: Number,
      default: 3420.5,
      min: 0,
    },

    usdToPkr: {
      type: Number,
      default: 282.4,
      min: 0,
    },

    usdtRate: {
      type: Number,
      default: 282.4,
      min: 0,
    },

    goldSpread: {
      type: Number,
      default: 2,
      min: 0,
    },

    // ==========================================
    // GOLD BUY / SELL PRICE
    // ==========================================
    buyGoldPrice: {
      type: Number,
      default: 3488.91,
    },

    sellGoldPrice: {
      type: Number,
      default: 3352.09,
    },

    goldTradingEnabled: {
      type: Boolean,
      default: true,
    },

    // ==========================================
    // TRC20 USDT WALLET
    // ==========================================
    trc20Wallet: {
      type: String,
      default: "",
      trim: true,
    },

    trc20Qr: {
      type: String,
      default: "",
    },

    // ==========================================
    // DEPOSIT SETTINGS
    // ==========================================
    depositEnabled: {
      type: Boolean,
      default: true,
    },

    minimumDeposit: {
      type: Number,
      default: 1000,
    },

    maximumDeposit: {
      type: Number,
      default: 10000000,
    },

    // ==========================================
    // WITHDRAW SETTINGS
    // ==========================================
    withdrawEnabled: {
      type: Boolean,
      default: true,
    },

    minimumWithdraw: {
      type: Number,
      default: 500,
    },

    maximumWithdraw: {
      type: Number,
      default: 10000000,
    },

    withdrawFeePercent: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // WEBSITE CONTROL
    // ==========================================
    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    registrationEnabled: {
      type: Boolean,
      default: true,
    },

    loginEnabled: {
      type: Boolean,
      default: true,
    },

    // ==========================================
    // GOLD TRADE LIMITS
    // ==========================================
    minimumGoldBuyGram: {
      type: Number,
      default: 0.1,
    },

    minimumGoldSellGram: {
      type: Number,
      default: 0.1,
    },

    maximumGoldBuyGram: {
      type: Number,
      default: 1000,
    },

    maximumGoldSellGram: {
      type: Number,
      default: 1000,
    },

    // ==========================================
    // REFERRAL (Future Ready)
    // ==========================================
    referralEnabled: {
      type: Boolean,
      default: false,
    },

    referralBonusPKR: {
      type: Number,
      default: 500,
    },

    // ==========================================
    // ADMIN INFO
    // ==========================================
    updatedBy: {
      type: String,
      default: "Admin",
    },

    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "settings",
  }
);

// ==========================================
// AUTO CALCULATE BUY & SELL PRICE
// Every time settings are saved
// ==========================================
settingsSchema.pre("save", function (next) {
  const marketPrice = this.goldPriceUSD * this.usdToPkr;

  this.buyGoldPrice = Number(
    (marketPrice * (1 + this.goldSpread / 100)).toFixed(2)
  );

  this.sellGoldPrice = Number(
    (marketPrice * (1 - this.goldSpread / 100)).toFixed(2)
  );

  next();
});

module.exports =
  mongoose.models.Settings ||
  mongoose.model("Settings", settingsSchema);