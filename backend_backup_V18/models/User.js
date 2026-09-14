const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // ==========================
    // BASIC USER INFO
    // ==========================
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      default: "",
    },

    country: {
      type: String,
      default: "Pakistan",
    },

    // ==========================
    // USER ROLE
    // ==========================
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

    // ==========================
    // WALLET BALANCES
    // ==========================
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    usdtBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    goldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==========================
    // GOLD ANALYTICS (Admin Use)
    // ==========================
    goldAveragePrice: {
      type: Number,
      default: 0,
    },

    goldProfitLoss: {
      type: Number,
      default: 0,
    },

    // ==========================
    // TOTALS
    // ==========================
    totalDeposit: {
      type: Number,
      default: 0,
    },

    totalWithdraw: {
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

    // ==========================
    // REFERRAL SYSTEM
    // ==========================
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
    },

    referralCount: {
      type: Number,
      default: 0,
    },

    pendingReferralBonus: {
      type: Number,
      default: 0,
    },

    referralBonusEarned: {
      type: Number,
      default: 0,
    },

    // ==========================
    // REWARD SYSTEM
    // ==========================
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

    // ==========================
    // VIP MEMBERSHIP
    // ==========================
    vipLevel: {
      type: String,
      enum: ["None", "Silver", "Gold", "Diamond"],
      default: "None",
    },

    vipActivatedAt: {
      type: Date,
      default: null,
    },

    // ==========================
    // SECURITY
    // ==========================
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

    profileImage: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// ==========================
// INDEXES
// ==========================
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// ==========================
// EXPORT
// ==========================
module.exports = mongoose.model("User", userSchema);