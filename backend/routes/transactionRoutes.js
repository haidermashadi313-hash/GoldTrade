const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // ==============================
    // User Info
    // ==============================
    username: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    // ==============================
    // Transaction Type
    // ==============================
    type: {
      type: String,
      required: true,
      enum: [
        "Deposit",
        "Withdraw",
        "Gold Buy",
        "Gold Sell",
        "PKR Wallet Update",
        "USDT Wallet Update",
        "Gold Wallet Update",
        "Admin Gold Wallet",
        "Referral Bonus",
      ],
    },

    // ==============================
    // Wallet / Payment Method
    // ==============================
    method: {
      type: String,
      default: "System",
      trim: true,
    },

    // ==============================
    // Amount
    // ==============================
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      enum: ["PKR", "USDT", "GOLD"],
      default: "PKR",
    },

    // ==============================
    // Gold Fields
    // ==============================
    grams: {
      type: Number,
      default: 0,
    },

    goldPrice: {
      type: Number,
      default: 0,
    },

    profit: {
      type: Number,
      default: 0,
    },

    // ==============================
    // Wallet Snapshot
    // ==============================
    walletBefore: {
      type: Number,
      default: 0,
    },

    walletAfter: {
      type: Number,
      default: 0,
    },

    usdtBefore: {
      type: Number,
      default: 0,
    },

    usdtAfter: {
      type: Number,
      default: 0,
    },

    goldBefore: {
      type: Number,
      default: 0,
    },

    goldAfter: {
      type: Number,
      default: 0,
    },

    // ==============================
    // Receipt / TXID
    // ==============================
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    receiptImage: {
      type: String,
      default: "",
    },

    txHash: {
      type: String,
      default: "",
    },

    // ==============================
    // Status
    // ==============================
    status: {
      type: String,
      enum: [
        "Pending",
        "Completed",
        "Rejected",
        "Credit",
        "Debit",
      ],
      default: "Pending",
    },

    // ==============================
    // Admin Info
    // ==============================
    reason: {
      type: String,
      default: "",
      trim: true,
    },

    updatedBy: {
      type: String,
      default: "System",
    },

    // ==============================
    // Extra
    // ==============================
    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "transactions",
  }
);

module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);