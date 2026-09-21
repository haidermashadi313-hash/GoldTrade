/*
========================================================
 GoldTrade V18 Enterprise
 Deposit Model
 Linux + Render + MongoDB Compatible
========================================================
*/

"use strict";

const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    // User Information
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

    // Deposit Information
    requestAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ["JazzCash", "Easypaisa", "Bank", "USDT"],
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
    },

    receiptImage: {
      type: String,
      default: "",
      trim: true,
    },

    // Admin Status
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
  },
  {
    timestamps: true,
    collection: "deposits",
  }
);

// Useful indexes
depositSchema.index({ username: 1, createdAt: -1 });
depositSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Deposit", depositSchema);