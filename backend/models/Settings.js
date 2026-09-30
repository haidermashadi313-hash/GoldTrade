// ======================================================
// GoldTrade V18 Enterprise - Settings Model
// ======================================================

"use strict";

const mongoose = require("mongoose");

// ======================================================
// DEPOSIT PAYMENT METHOD SCHEMA
// ======================================================

const depositPaymentMethodSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    accountName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },

    qrCode: {
      type: String,
      default: "",
      trim: true,
    },

    instructions: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: true,
    timestamps: false,
  }
);

// ======================================================
// SETTINGS SCHEMA
// ======================================================

const settingsSchema = new mongoose.Schema(
  {
    // ==================================================
    // GOLD / MARKET SETTINGS
    // ==================================================

    buyGoldPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellGoldPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    goldPriceUSD: {
      type: Number,
      default: 0,
      min: 0,
    },

    usdToPkr: {
      type: Number,
      default: 0,
      min: 0,
    },

    goldTradingEnabled: {
      type: Boolean,
      default: true,
    },

    marketStatus: {
      type: String,
      default: "OPEN",
      enum: ["OPEN", "CLOSED"],
      uppercase: true,
      trim: true,
    },

    // ==================================================
    // DEPOSIT SETTINGS
    // ==================================================

    depositsEnabled: {
      type: Boolean,
      default: true,
    },

    minimumDeposit: {
      type: Number,
      default: 1000,
      min: 0,
    },

    maximumDeposit: {
      type: Number,
      default: 10000000,
      min: 0,
    },

    // ==================================================
    // V18 DEPOSIT PAYMENT METHODS
    // ==================================================

    depositPaymentMethods: {
      type: [depositPaymentMethodSchema],
      default: [],
    },

    // ==================================================
    // LEGACY PAYMENT SETTINGS
    // Kept for compatibility with older frontend/routes
    // ==================================================

    paymentSettings: {
      bankName: {
        type: String,
        default: "",
        trim: true,
      },

      accountTitle: {
        type: String,
        default: "",
        trim: true,
      },

      accountNumber: {
        type: String,
        default: "",
        trim: true,
      },

      usdtAddress: {
        type: String,
        default: "",
        trim: true,
      },

      usdtNetwork: {
        type: String,
        default: "",
        trim: true,
      },
    },
  },
  {
    timestamps: true,
    collection: "settings",
    minimize: false,
  }
);

// ======================================================
// VALIDATION
// ======================================================

settingsSchema.pre("validate", function (next) {
  if (
    Number.isFinite(this.minimumDeposit) &&
    Number.isFinite(this.maximumDeposit) &&
    this.minimumDeposit > this.maximumDeposit
  ) {
    return next(
      new Error(
        "minimumDeposit cannot be greater than maximumDeposit."
      )
    );
  }

  next();
});

// ======================================================
// MODEL
// ======================================================

module.exports =
  mongoose.models.Settings ||
  mongoose.model("Settings", settingsSchema);