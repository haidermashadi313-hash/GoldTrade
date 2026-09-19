"use strict";

const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
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
    },

    // ================= DEPOSIT =================
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      enum: ["Pkr", "USDT"],
      default: "Pkr",
    },

    paymentMethod: {
      type: String,
      enum: [
        "BANK",
        "EASYPAISA",
        "JAZZCASH",
        "NAYAPAY",
        "SADAPAY",
        "RAAST",
        "ABA",
        "BINANCE",
        "USDT_TRC20",
      ],
      required: true,
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

    // ================= STATUS =================
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    adminNote: {
      type: String,
      default: "",
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
    collection: "deposits",
  }
);

// =====================================================
// LINUX + RENDER SAFE EXPORT
// =====================================================

module.exports =
  mongoose.models.Deposit ||
  mongoose.model("Deposit", depositSchema);