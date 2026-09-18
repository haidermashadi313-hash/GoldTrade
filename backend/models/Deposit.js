const mongoose = require("mongoose");

// =============================================
// GOLDTRADE V18 - DEPOSIT MODEL (PRODUCTION)
// =============================================

const depositSchema = new mongoose.Schema(
  {
    // ================= USER INFO =================
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

    email: {
      type: String,
      default: "",
      lowercase: true,
    },

    // ================= USER REQUEST =================
    requestAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      enum: ["PKR", "USDT"],
      default: "PKR",
    },

    paymentMethod: {
      type: String,
      enum: [
        "Bank Transfer",
        "JazzCash",
        "EasyPaisa",
        "Binance",
        "USDT",
        "ABA Bank",
        "Other",
      ],
      default: "Bank Transfer",
    },

    senderName: {
      type: String,
      default: "",
      trim: true,
    },

    senderAccount: {
      type: String,
      default: "",
      trim: true,
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
    },

    receiptImage: {
      type: String,
      default: "",
    },

    note: {
      type: String,
      default: "",
      maxlength: 300,
    },

    // ================= ADMIN APPROVAL =================
    adminAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
      maxlength: 300,
    },

    approvedBy: {
      type: String,
      default: "",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    // ================= WALLET CREDIT =================
    walletUpdated: {
      type: Boolean,
      default: false,
    },

    walletTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =============================================
// INDEXES
// =============================================

depositSchema.index({ username: 1, createdAt: -1 });
depositSchema.index({ status: 1, createdAt: -1 });

// =============================================
// EXPORT MODEL
// =============================================

module.exports = mongoose.model("Deposit", depositSchema);