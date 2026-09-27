// ======================================================
// GoldTrade V18 Enterprise Backend
// WalletHistory.js — PART 1/2
// Wallet Transaction History Model
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

const mongoose = require("mongoose");

// ======================================================
// WALLET HISTORY SCHEMA
// ======================================================

const WalletHistorySchema = new mongoose.Schema(
  {
    // ==================================================
    // USER INFORMATION
    // ==================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    // ==================================================
    // WALLET TYPE
    // ==================================================

    walletType: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["PKR", "USDT", "GOLD"],
      index: true,
    },

    // ==================================================
    // TRANSACTION TYPE
    // ==================================================

    type: {
      type: String,
      required: true,
      uppercase: true,
      enum: [
        "CREDIT",
        "DEBIT",
        "BUY",
        "SELL",
        "DEPOSIT",
        "WITHDRAW",
        "TRANSFER",
        "BONUS",
        "REFUND",
        "FEE",
      ],
      index: true,
    },

    // ==================================================
    // TRANSACTION DETAILS
    // ==================================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceBefore: {
      type: Number,
      default: 0,
      min: 0,
    },

    balanceAfter: {
      type: Number,
      default: 0,
      min: 0,
    },

    fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    netAmount: {
      type: Number,
      default: 0,
    },

    // ==================================================
    // REFERENCE DETAILS
    // ==================================================

    referenceId: {
      type: String,
      trim: true,
      default: null,
    },

    transactionId: {
      type: String,
      trim: true,
      default: null,
    },

    depositId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deposit",
      default: null,
    },

    withdrawId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Withdraw",
      default: null,
    },

    goldTradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoldTrade",
      default: null,
    },

    usdtTradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UsdtTrade",
      default: null,
    },

    // ==================================================
    // DESCRIPTION
    // ==================================================

    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    admin: {
      type: String,
      trim: true,
      default: "",
    },
        // ==================================================
    // STATUS
    // ==================================================

    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
      default: "SUCCESS",
      index: true,
    },

    source: {
      type: String,
      enum: ["USER", "ADMIN", "SYSTEM"],
      default: "SYSTEM",
    },

    ipAddress: {
      type: String,
      default: "",
    },

    device: {
      type: String,
      default: "",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "WalletHistory",
    versionKey: false,
  }
);

// ======================================================
// PERFORMANCE INDEXES
// (Do NOT duplicate indexes already defined in fields.)
// ======================================================

WalletHistorySchema.index({ userId: 1, createdAt: -1 });
WalletHistorySchema.index({ walletType: 1, createdAt: -1 });
WalletHistorySchema.index({ type: 1, createdAt: -1 });
WalletHistorySchema.index({ status: 1, createdAt: -1 });

// ======================================================
// PRE SAVE MIDDLEWARE
// ======================================================

WalletHistorySchema.pre("save", function (next) {
  this.amount = Number(this.amount || 0);
  this.balanceBefore = Number(this.balanceBefore || 0);
  this.balanceAfter = Number(this.balanceAfter || 0);
  this.fee = Number(this.fee || 0);

  if (!this.netAmount) {
    this.netAmount = this.amount - this.fee;
  }

  next();
});

// ======================================================
// JSON RESPONSE CLEANUP
// ======================================================

WalletHistorySchema.set("toJSON", {
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
  mongoose.models.WalletHistory ||
  mongoose.model("WalletHistory", WalletHistorySchema);