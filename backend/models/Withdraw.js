"use strict";

const mongoose = require("mongoose");

// =====================================================
// WITHDRAW SCHEMA
// GoldTrade V18
// =====================================================

const withdrawSchema = new mongoose.Schema(
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

    // ================= WITHDRAW DETAILS =================
    amount: {
      type: Number,
      required: true,
      min: 1,
      default: 0,
    },

    currency: {
      type: String,
      enum: ["PKR", "USDT"],
      default: "PKR",
      uppercase: true,
      trim: true,
    },

    // ================= PAYMENT METHOD =================
    paymentMethod: {
      type: String,
      enum: [
        "BANK",
        "EASYPAISA",
        "JAZZCASH",
        "NAYAPAY",
        "SADAPAY",
        "RAAST",
        "USDT_TRC20",
      ],
      required: true,
      uppercase: true,
      trim: true,
    },

    // ================= PAYMENT DETAILS =================
    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    accountTitle: {
      type: String,
      required: true,
      trim: true,
    },

    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },

    iban: {
      type: String,
      default: "",
      trim: true,
    },

    WalletAddress: {
      type: String,
      default: "",
      trim: true,
    },

    network: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    // ================= STATUS =================
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      trim: true,
    },

    // ================= ADMIN ACTION =================
    adminNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    // ================= RECEIPT =================
    receiptImage: {
      type: String,
      default: "",
      trim: true,
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "withdraws",
  }
);

// =====================================================
// EXPORT MODEL (Linux + Render + Hot Reload Safe)
// =====================================================

module.exports =
  mongoose.models.Withdraw ||
  mongoose.model("Withdraw", withdrawSchema);