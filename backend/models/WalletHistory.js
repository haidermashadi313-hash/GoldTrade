// ======================================================
// GoldTrade V18 Enterprise Backend
// WalletHistory.js
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
      enum: [
        "PKR",
        "USDT",
        "GOLD",
      ],
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
    // TRANSACTION IDENTIFICATION
    // ==================================================

    transactionType: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      index: true,
    },

    transactionMode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },

    // ==================================================
    // PAYMENT DETAILS
    // ==================================================

    paymentMethod: {
      type: String,
      trim: true,
      default: "",
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
    // ADMIN / AUDIT DETAILS
    // ==================================================

    admin: {
      type: String,
      trim: true,
      default: "",
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminUsername: {
      type: String,
      trim: true,
      default: "",
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

    // ==================================================
    // STATUS
    // ==================================================
    //
    // IMPORTANT:
    // WithdrawRoutes uses:
    // PENDING
    // APPROVED
    // REJECTED
    // CANCELLED
    //
    // Therefore APPROVED and REJECTED
    // must be allowed here.
    // ==================================================

    status: {
      type: String,
      uppercase: true,
      enum: [
        "PENDING",
        "SUCCESS",
        "FAILED",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ],
      default: "SUCCESS",
      index: true,
    },

    // ==================================================
    // SOURCE
    // ==================================================

    source: {
      type: String,
      uppercase: true,
      enum: [
        "USER",
        "ADMIN",
        "SYSTEM",
      ],
      default: "SYSTEM",
    },

    // ==================================================
    // REQUEST / DEVICE INFORMATION
    // ==================================================

    ipAddress: {
      type: String,
      default: "",
    },

    device: {
      type: String,
      default: "",
    },

    // ==================================================
    // EXTRA METADATA
    // ==================================================

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
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
// ======================================================

// User history
WalletHistorySchema.index({
  userId: 1,
  createdAt: -1,
});

// Wallet type history
WalletHistorySchema.index({
  walletType: 1,
  createdAt: -1,
});

// Transaction type history
WalletHistorySchema.index({
  type: 1,
  createdAt: -1,
});

// Status history
WalletHistorySchema.index({
  status: 1,
  createdAt: -1,
});

// ======================================================
// PRE SAVE MIDDLEWARE
// ======================================================

WalletHistorySchema.pre(
  "save",
  function (next) {
    // ==================================================
    // NORMALIZE NUMERIC VALUES
    // ==================================================

    this.amount = Number(
      this.amount || 0
    );

    this.balanceBefore = Number(
      this.balanceBefore || 0
    );

    this.balanceAfter = Number(
      this.balanceAfter || 0
    );

    this.fee = Number(
      this.fee || 0
    );

    // ==================================================
    // NET AMOUNT
    // ==================================================

    if (
      this.netAmount === null ||
      this.netAmount === undefined
    ) {
      this.netAmount =
        this.amount - this.fee;
    }

    // ==================================================
    // CONTINUE
    // ==================================================

    next();
  }
);

// ======================================================
// JSON RESPONSE CLEANUP
// ======================================================

WalletHistorySchema.set(
  "toJSON",
  {
    virtuals: true,

    transform(doc, ret) {
      delete ret.__v;

      return ret;
    },
  }
);

// ======================================================
// SAFE EXPORT
// Render + Nodemon + PM2 Safe
// ======================================================

module.exports =
  mongoose.models.WalletHistory ||
  mongoose.model(
    "WalletHistory",
    WalletHistorySchema
  );