"use strict";

const mongoose = require("mongoose");

// =====================================================
// USDT TRANSACTION SCHEMA
// GoldTrade V18
// =====================================================

const usdtTransactionSchema = new mongoose.Schema(
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

    // ================= TRANSACTION =================
    type: {
      type: String,
      enum: ["BUY", "SELL", "CREDIT", "DEBIT"],
      required: true,
    },

    usdtAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    pkrAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    rate: {
      type: Number,
      required: true,
      min: 0,
    },

    // ================= STATUS =================
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
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

    // ================= OPTIONAL =================
    transactionId: {
      type: String,
      default: "",
      trim: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "usdttransactions",
  }
);

// =====================================================
// EXPORT MODEL (Linux + Render Safe)
// =====================================================

module.exports =
  mongoose.models.UsdtTransaction ||
  mongoose.model("UsdtTransaction", usdtTransactionSchema);