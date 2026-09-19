"use strict";

const mongoose = require("mongoose");

// =====================================================
// SETTINGS SCHEMA
// GoldTrade V18
// =====================================================

const settingsSchema = new mongoose.Schema(
  {
    // ================= GOLD MARKET =================

    buyGoldPrice: {
      type: Number,
      default: 31200,
      min: 0,
    },

    sellGoldPrice: {
      type: Number,
      default: 30900,
      min: 0,
    },

    goldPriceUSD: {
      type: Number,
      default: 105,
      min: 0,
    },

    usdToPkr: {
      type: Number,
      default: 280,
      min: 0,
    },

    // ================= USDT MARKET =================

    usdtRate: {
      type: Number,
      default: 280,
      min: 0,
    },

    // ================= MARKET STATUS =================

    marketStatus: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },

    goldTradingEnabled: {
      type: Boolean,
      default: true,
    },

    usdtTradingEnabled: {
      type: Boolean,
      default: true,
    },

    walletEnabled: {
      type: Boolean,
      default: true,
    },

    // ================= PLATFORM SETTINGS =================

    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    maintenanceMessage: {
      type: String,
      default: "",
      trim: true,
    },

    appVersion: {
      type: String,
      default: "V18",
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "settings",
  }
);

// =====================================================
// EXPORT MODEL (Linux + Render Safe)
// =====================================================

module.exports =
  mongoose.models.Settings ||
  mongoose.model("Settings", settingsSchema);