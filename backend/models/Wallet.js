// =====================================================
// GoldTrade V18 Enterprise
// Wallet Model (Render + Vercel Production)
// =====================================================

const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    // =====================================================
    // USER LINK
    // =====================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
      index: true,
    },

    // =====================================================
    // WALLET BALANCES
    // =====================================================

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    pkrBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    goldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    usdtBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // TOTALS
    // =====================================================

    totalDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalWithdraw: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPkrDeposit: {
      type: Number,
      default: 0,
    },

    totalPkrWithdraw: {
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

    totalUsdtDeposited: {
      type: Number,
      default: 0,
    },

    totalUsdtWithdrawn: {
      type: Number,
      default: 0,
    },

    // =====================================================
    // STATUS
    // =====================================================

    status: {
      type: String,
      enum: ["Active", "Suspended"],
      default: "Active",
    },
  },
  {
    timestamps: true,
    collection: "Wallets",
  }
);

// =====================================================
// SAFE EXPORT (Render Hot Reload)
// =====================================================

module.exports =
  mongoose.models.Wallet ||
  mongoose.model("Wallet", WalletSchema);