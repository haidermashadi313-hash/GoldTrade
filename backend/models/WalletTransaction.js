"use strict";

const mongoose = require("mongoose");

// =====================================================
// WALLET TRANSACTION SCHEMA
// GoldTrade V18
// =====================================================

const walletTransactionSchema = new mongoose.Schema(
  {
    // Username
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // Transaction Type
    type: {
      type: String,
      enum: [
        "Deposit",
        "Withdraw",
        "Transfer",
        "Bonus",
        "Cashback",
        "CREDIT",
        "DEBIT",
      ],
      required: true,
      trim: true,
    },

    // Transaction Amount
    amount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // Transaction Status
    status: {
      type: String,
      enum: ["Pending", "Completed", "Approved", "Rejected"],
      default: "Completed",
      trim: true,
    },

    // Optional Note
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
    collection: "wallettransactions",
  }
);

// =====================================================
// EXPORT MODEL (Linux + Render + Hot Reload Safe)
// =====================================================

module.exports =
  mongoose.models.WalletTransaction ||
  mongoose.model("WalletTransaction", walletTransactionSchema);