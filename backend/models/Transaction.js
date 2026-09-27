/*
========================================================
 GoldTrade V18 Enterprise Backend
 Transaction.js — PART 1/2
 Transaction Ledger Model
 Production Ready (Render + PM2 + MongoDB Atlas)
========================================================
*/

"use strict";

const mongoose = require("mongoose");

// ======================================================
// TRANSACTION SCHEMA
// ======================================================

const transactionSchema = new mongoose.Schema(
  {
    // ==================================================
    // USER INFORMATION
    // ==================================================

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

    // ==================================================
    // WALLET INFORMATION
    // ==================================================

    walletType: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["PKR", "GOLD", "USDT"],
      index: true,
    },

    transactionType: {
      type: String,
      required: true,
      uppercase: true,
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
      required: true,
      uppercase: true,
      enum: ["CREDIT", "DEBIT"],
      index: true,
    },

    // ==================================================
    // AMOUNTS
    // ==================================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    balanceBefore: {
      type: Number,
      default: 0,
      min: 0,
    },

    balanceAfter: {
      type: Number,
      default: 0,
      min: 0,
    },

    fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    netAmount: {
      type: Number,
      default: 0,
    },

    // ==================================================
    // STATUS
    // ==================================================

    status: {
      type: String,
      enum: ["Pending", "Completed", "Rejected", "Failed"],
      default: "Completed",
      index: true,
    },

    // ==================================================
    // PAYMENT / REFERENCE
    // ==================================================

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

    transactionId: {
      type: String,
      default: "",
      trim: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    // ==================================================
    // ADMIN AUDIT
    // ==================================================

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

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "transactions",
    versionKey: false,
  }
);
// ======================================================
// GoldTrade V18 Enterprise Backend
// Transaction.js — PART 2/2 FINAL
// Indexes + Middleware + JSON Cleanup + Safe Export
// ======================================================

// ======================================================
// COMPOSITE INDEXES (Performance Optimized)
// NOTE:
// Do NOT create indexes already defined with index:true
// ======================================================

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ walletType: 1, createdAt: -1 });
transactionSchema.index({ transactionType: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

// ======================================================
// PRE SAVE MIDDLEWARE
// ======================================================

transactionSchema.pre("save", function (next) {
  this.amount = Number(this.amount || 0);
  this.balanceBefore = Number(this.balanceBefore || 0);
  this.balanceAfter = Number(this.balanceAfter || 0);
  this.fee = Number(this.fee || 0);

  // Auto calculate net amount
  this.netAmount = this.amount - this.fee;

  // Normalize values
  if (this.walletType) {
    this.walletType = this.walletType.toUpperCase();
  }

  if (this.transactionMode) {
    this.transactionMode = this.transactionMode.toUpperCase();
  }

  if (this.transactionType) {
    this.transactionType = this.transactionType.toUpperCase();
  }

  next();
});

// ======================================================
// JSON RESPONSE CLEANUP
// ======================================================

transactionSchema.set("toJSON", {
  virtuals: true,
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

// ======================================================
// SAFE EXPORT (Render + Nodemon + PM2 Safe)
// ======================================================

module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);