/*
========================================================
 GoldTrade V18 Enterprise Backend
 Settings.js — PART 1/2
 Global Application Settings Model
 Production Ready (Render + PM2 + MongoDB Atlas)
========================================================
*/

"use strict";

const mongoose = require("mongoose");

// ======================================================
// SETTINGS SCHEMA
// ======================================================

const SettingsSchema = new mongoose.Schema(
  {
    // ==================================================
    // GOLD MARKET SETTINGS
    // ==================================================

    buyGoldPrice: {
      type: Number,
      default: 45000,
      min: 0,
    },

    sellGoldPrice: {
      type: Number,
      default: 44500,
      min: 0,
    },

    goldPriceUSD: {
      type: Number,
      default: 4300,
      min: 0,
    },

    usdToPkr: {
      type: Number,
      default: 320,
      min: 0,
    },

    goldTradingEnabled: {
      type: Boolean,
      default: true,
    },

    marketStatus: {
      type: String,
      enum: ["OPEN", "CLOSED", "MAINTENANCE"],
      default: "OPEN",
      index: true,
    },

    // ==================================================
    // USDT SETTINGS
    // ==================================================

    usdtBuyPrice: {
      type: Number,
      default: 320,
      min: 0,
    },

    usdtSellPrice: {
      type: Number,
      default: 318,
      min: 0,
    },

    usdtTradingEnabled: {
      type: Boolean,
      default: true,
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
    // WITHDRAW SETTINGS
    // ==================================================

    withdrawEnabled: {
      type: Boolean,
      default: true,
    },

    minimumWithdraw: {
      type: Number,
      default: 1000,
      min: 0,
    },

    maximumWithdraw: {
      type: Number,
      default: 10000000,
      min: 0,
    },

    withdrawFeePercent: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==================================================
    // SYSTEM SETTINGS
    // ==================================================

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    registrationEnabled: {
      type: Boolean,
      default: true,
    },

    appVersion: {
      type: String,
      default: "18.0.0",
      trim: true,
    },
        // ==================================================
    // ADMIN AUDIT
    // ==================================================

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedByUsername: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    // ==================================================
    // EXTRA METADATA
    // ==================================================

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "settings",
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ======================================================
// COMPOSITE INDEXES (No Duplicate Index Warning)
// ======================================================

SettingsSchema.index({ updatedAt: -1 });

// ======================================================
// PRE SAVE MIDDLEWARE
// ======================================================

SettingsSchema.pre("save", function (next) {
  this.buyGoldPrice = Number(this.buyGoldPrice || 0);
  this.sellGoldPrice = Number(this.sellGoldPrice || 0);

  this.goldPriceUSD = Number(this.goldPriceUSD || 0);
  this.usdToPkr = Number(this.usdToPkr || 0);

  this.usdtBuyPrice = Number(this.usdtBuyPrice || 0);
  this.usdtSellPrice = Number(this.usdtSellPrice || 0);

  this.minimumDeposit = Number(this.minimumDeposit || 0);
  this.maximumDeposit = Number(this.maximumDeposit || 0);

  this.minimumWithdraw = Number(this.minimumWithdraw || 0);
  this.maximumWithdraw = Number(this.maximumWithdraw || 0);

  this.withdrawFeePercent = Number(this.withdrawFeePercent || 0);

  if (this.marketStatus) {
    this.marketStatus = this.marketStatus.toUpperCase();
  }

  next();
});

// ======================================================
// JSON CLEANUP
// ======================================================

SettingsSchema.set("toJSON", {
  virtuals: true,
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

// ======================================================
// SAFE EXPORT (Render + Nodemon + PM2 Safe)
// ======================================================

module.exports =
  mongoose.models.Settings ||
  mongoose.model("Settings", SettingsSchema);