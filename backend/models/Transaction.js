"use strict";

const mongoose = require("mongoose");

// =====================================================
// TRANSACTION SCHEMA
// GoldTrade V18
// PKR + USDT + GOLD + Deposit + Withdraw
// =====================================================

const transactionSchema = new mongoose.Schema(
  {
    // ================= USER =================

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
      index: true,
    },

    // ================= TRANSACTION TYPE =================

    type: {
      type: String,
      enum: [
        "Deposit",
        "Withdraw",
        "Buy Gold",
        "Sell Gold",
        "Buy Usdt",
        "Sell Usdt",
        "Transfer",
        "Bonus",
        "Credit",
        "Debit",
      ],
      required: true,
    },

    // ================= CURRENCY =================

    currency: {
      type: String,
      enum: ["Pkr", "Gold", "Usdt"],
      required: true,
    },

    // ================= AMOUNTS =================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    rate: {
      type: Number,
      default: 0,
      min: 0,
    },

    total: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ================= STATUS =================

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Completed",
    },

    // ================= DESCRIPTION =================

    description: {
      type: String,
      default: "",
      trim: true,
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
    },

    paymentMethod: {
      type: String,
      default: "",
      trim: true,
    },

    // ================= ADMIN =================

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "transactions",
  }
);

// =====================================================
// EXPORT MODEL (Linux + Render Safe)
// =====================================================

module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);