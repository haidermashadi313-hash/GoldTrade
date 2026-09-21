/*
========================================================
 GoldTrade V18 Enterprise
 Withdraw Model
 Linux + Render + MongoDB Compatible
========================================================
*/

"use strict";

const mongoose = require("mongoose");

// ======================================================
// WITHDRAW SCHEMA
// ======================================================

const withdrawSchema = new mongoose.Schema(
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

    // ================= WITHDRAW DETAILS =================

    withdrawAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    walletType: {
      type: String,
      required: true,
      enum: ["PKR", "GOLD", "USDT"],
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["JazzCash", "Easypaisa", "Bank", "USDT"],
    },

    // ================= DESTINATION =================

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

    walletAddress: {
      type: String,
      default: "",
      trim: true,
    },

    // ================= ADMIN REVIEW =================

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    // ================= SECURITY =================

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
    collection: "withdraws",
  }
);

// ======================================================
// INDEXES
// ======================================================

withdrawSchema.index({ username: 1, createdAt: -1 });
withdrawSchema.index({ status: 1, createdAt: -1 });
withdrawSchema.index({ walletType: 1, createdAt: -1 });

// ======================================================
// EXPORT MODEL
// ======================================================

module.exports = mongoose.model("Withdraw", withdrawSchema);