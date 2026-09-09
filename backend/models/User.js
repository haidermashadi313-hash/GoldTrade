const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =========================
    // User Information
    // =========================
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // =========================
    // User Role
    // =========================
    role: {
      type: String,
      enum: ["user", "manager", "admin"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["Active", "Blocked"],
      default: "Active",
    },

    // =========================
    // PKR Wallet
    // =========================
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =========================
    // TRC20 USDT Wallet
    // =========================
    usdtBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =========================
    // Gold Wallet (Grams)
    // =========================
    goldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Average Buy Price Per Gram
    goldAveragePrice: {
      type: Number,
      default: 0,
    },

    // Running Profit / Loss
    goldProfitLoss: {
      type: Number,
      default: 0,
    },

    // =========================
    // Finance Summary
    // =========================
    totalDeposit: {
      type: Number,
      default: 0,
    },

    totalWithdraw: {
      type: Number,
      default: 0,
    },

    totalGoldBuy: {
      type: Number,
      default: 0,
    },

    totalGoldSell: {
      type: Number,
      default: 0,
    },

    // =========================
    // Referral System
    // =========================
    referralCode: {
      type: String,
      default: "",
    },

    referredBy: {
      type: String,
      default: "",
    },

    referralBonus: {
      type: Number,
      default: 0,
    },

    // =========================
    // Admin Tracking
    // =========================
    lastWalletUpdateBy: {
      type: String,
      default: "",
    },

    lastWalletUpdateAt: {
      type: Date,
      default: null,
    },

    // =========================
    // Account Security
    // =========================
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);