"use strict";

const mongoose = require("mongoose");

// =====================================================
// USER SCHEMA (GoldTrade V18 Enterprise)
// Linux + Render + MongoDB Safe
// =====================================================

const userSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC USER INFORMATION
    // =====================================================

    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email address"],
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    phone: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "Pakistan",
    },

    profileImage: {
      type: String,
      default: "",
    },

    // =====================================================
    // USER ROLE & ACCOUNT STATUS
    // =====================================================

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["Active", "Blocked", "Suspended"],
      default: "Active",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    // =====================================================
    // WALLET BALANCES (V18 Compatibility)
    // =====================================================

    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    UsdtBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    goldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // GOLD ANALYTICS
    // =====================================================

    goldAveragePrice: {
      type: Number,
      default: 0,
    },

    goldProfitLoss: {
      type: Number,
      default: 0,
    },

    totalGoldPurchased: {
      type: Number,
      default: 0,
    },

    totalGoldSold: {
      type: Number,
      default: 0,
    },

    // =====================================================
    // DEPOSIT / WITHDRAW STATS
    // =====================================================

    totalDeposit: {
      type: Number,
      default: 0,
    },

    totalWithdraw: {
      type: Number,
      default: 0,
    },

    // =====================================================
    // REFERRAL SYSTEM
    // =====================================================

    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },

    referredBy: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },

    referralCount: {
      type: Number,
      default: 0,
    },

    pendingReferralBonus: {
      type: Number,
      default: 0,
      min: 0,
    },

    referralBonusEarned: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // REWARD SYSTEM
    // =====================================================

    cashbackEarned: {
      type: Number,
      default: 0,
    },

    luckyDrawEntries: {
      type: Number,
      default: 0,
    },

    rewardPoints: {
      type: Number,
      default: 0,
    },

    // =====================================================
    // VIP MEMBERSHIP
    // =====================================================

    vipLevel: {
      type: String,
      enum: ["None", "Silver", "Gold", "Diamond"],
      default: "None",
    },

    vipActivatedAt: {
      type: Date,
      default: null,
    },

    // =====================================================
    // SECURITY
    // =====================================================

    isKYCVerified: {
      type: Boolean,
      default: false,
    },

    isWalletFrozen: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// =====================================================
// INDEXES (NO DUPLICATE WARNINGS)
// =====================================================

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLogin: -1 });

// =====================================================
// EXPORT MODEL (Render + Linux Safe)
// =====================================================

module.exports =
  mongoose.models.User ||
  mongoose.model("User", userSchema);