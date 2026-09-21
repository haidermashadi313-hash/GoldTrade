const mongoose = require("mongoose");

const paymentSettingsSchema = new mongoose.Schema(
  {
    // PKR Payment Methods
    jazzCashNumber: {
      type: String,
      default: "",
      trim: true,
    },

    jazzCashTitle: {
      type: String,
      default: "",
      trim: true,
    },

    easypaisaNumber: {
      type: String,
      default: "",
      trim: true,
    },

    easypaisaTitle: {
      type: String,
      default: "",
      trim: true,
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    bankAccountTitle: {
      type: String,
      default: "",
      trim: true,
    },

    bankAccountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    iban: {
      type: String,
      default: "",
      trim: true,
    },

    // USDT Wallets
    usdtTRC20: {
      type: String,
      default: "",
      trim: true,
    },

    usdtBEP20: {
      type: String,
      default: "",
      trim: true,
    },

    usdtERC20: {
      type: String,
      default: "",
      trim: true,
    },

    // Gold Wallet
    goldWalletAddress: {
      type: String,
      default: "",
      trim: true,
    },

    goldWalletTitle: {
      type: String,
      default: "",
      trim: true,
    },

    // QR Images
    jazzCashQR: {
      type: String,
      default: "",
    },

    easypaisaQR: {
      type: String,
      default: "",
    },

    binanceQR: {
      type: String,
      default: "",
    },

    // Enable / Disable
    jazzCashEnabled: {
      type: Boolean,
      default: true,
    },

    easypaisaEnabled: {
      type: Boolean,
      default: true,
    },

    bankEnabled: {
      type: Boolean,
      default: true,
    },

    usdtEnabled: {
      type: Boolean,
      default: true,
    },

    goldEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "payment_settings",
  }
);

module.exports = mongoose.model(
  "PaymentSettings",
  paymentSettingsSchema
);