/*
========================================================
 GoldTrade V18 Enterprise
 Transaction Ledger Model
 Linux + Render + MongoDB Compatible
========================================================
*/

"use strict";

const mongoose = require("mongoose");

// ======================================================
// TRANSACTION SCHEMA
// ======================================================

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
      lowercase: true,
      index: true,
    },

    // ================= TRANSACTION =================

    walletType: {
      type: String,
      required: true,
      enum: ["PKR", "GOLD", "USDT"],
      index: true,
    },

    transactionType: {
      type: String,
      required: true,
      enum: [
        "DEPOSIT_REQUEST",
        "DEPOSIT_APPROVED",
        "DEPOSIT_REJECTED",

        "WITHDRAW_REQUEST",
        "WITHDRAW_APPROVED",
        "WITHDRAW_REJECTED",

        "BUY_GOLD",
        "SELL_GOLD",

        "BUY_USDT",
        "SELL_USDT",

        "ADMIN_CREDIT",
        "ADMIN_DEBIT",

        "PKR_TRANSFER",
        "USDT_TRANSFER",
      ],
      index: true,
    },

    transactionMode: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceBefore: {
      type: Number,
      default: 0,
    },

    balanceAfter: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Completed", "Rejected", "Failed"],
      default: "Completed",
      index: true,
    },

    // ================= DETAILS =================

    paymentMethod: {
      type: String,
      default: "",
      trim: true,
    },

    referenceId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    // ================= ADMIN AUDIT =================

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    adminUsername: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    ipAddress: {
      type: String,
      default: "",
    },

    device: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "transactions",
  }
);

// ======================================================
// INDEXES (Linux / MongoDB Optimized)
// ======================================================

transactionSchema.index({ username: 1, createdAt: -1 });
transactionSchema.index({ walletType: 1, createdAt: -1 });
transactionSchema.index({ transactionType: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ referenceId: 1 });

// ======================================================
// EXPORT MODEL
// ======================================================

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);