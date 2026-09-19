"use strict";

const mongoose = require("mongoose");

// =====================================================
// USDT REQUEST SCHEMA
// GoldTrade V18
// =====================================================

const usdtRequestSchema = new mongoose.Schema(
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

    // ================= REQUEST TYPE =================

    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },

    // ================= REQUEST VALUES =================

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

    // ================= PAYMENT DETAILS =================

    paymentMethod: {
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
    collection: "usdtrequests",
  }
);

// =====================================================
// EXPORT MODEL (Linux + Render Safe)
// =====================================================

module.exports =
  mongoose.models.UsdtRequest ||
  mongoose.model("UsdtRequest", usdtRequestSchema);