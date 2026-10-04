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
      enum: [
        "PKR",
        "GOLD",
        "USDT",
      ],
      index: true,
    },

    // ==================================================
    // TRANSACTION TYPE
    // ==================================================

    transactionType: {
      type: String,
      required: true,
      uppercase: true,

      enum: [
        // ----------------------------------------------
        // DEPOSIT
        // ----------------------------------------------

        "DEPOSIT_REQUEST",
        "DEPOSIT_APPROVED",
        "DEPOSIT_REJECTED",

        // ----------------------------------------------
        // WITHDRAW
        // ----------------------------------------------
        // WITHDRAW is used by the current
        // withdrawRoutes.js approval/rejection logic.

        "WITHDRAW",
        "WITHDRAW_REQUEST",
        "WITHDRAW_APPROVED",
        "WITHDRAW_REJECTED",
        "WITHDRAW_CANCELLED",

        // ----------------------------------------------
        // GOLD
        // ----------------------------------------------

        "BUY_GOLD",
        "SELL_GOLD",

        // ----------------------------------------------
        // USDT
        // ----------------------------------------------

        "BUY_USDT",
        "SELL_USDT",

        // ----------------------------------------------
        // ADMIN
        // ----------------------------------------------

        "ADMIN_CREDIT",
        "ADMIN_DEBIT",

        // ----------------------------------------------
        // TRANSFERS
        // ----------------------------------------------

        "PKR_TRANSFER",
        "USDT_TRANSFER",
      ],

      index: true,
    },

    // ==================================================
    // TRANSACTION MODE
    // ==================================================

    transactionMode: {
      type: String,
      required: true,
      uppercase: true,

      enum: [
        "CREDIT",
        "DEBIT",
        "RELEASE",
      ],

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
    //
    // IMPORTANT:
    //
    // Existing system already uses:
    // Pending
    // Completed
    // Rejected
    // Failed
    //
    // Current withdrawRoutes.js also uses:
    // APPROVED
    // REJECTED
    // CANCELLED
    //
    // Both formats are kept for compatibility.
    // ==================================================

    status: {
      type: String,

      enum: [
        // ----------------------------------------------
        // EXISTING / LEGACY VALUES
        // ----------------------------------------------

        "Pending",
        "Completed",
        "Rejected",
        "Failed",

        // ----------------------------------------------
        // CURRENT WITHDRAW VALUES
        // ----------------------------------------------

        "APPROVED",
        "REJECTED",
        "CANCELLED",

        // ----------------------------------------------
        // CURRENT UPPERCASE PENDING/SUCCESS/FAILED
        // Compatibility with newer ledger operations.
        // ----------------------------------------------

        "PENDING",
        "SUCCESS",
        "FAILED",
      ],

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

    // ==================================================
    // EXTRA METADATA
    // ==================================================

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    collection: "transactions",
    versionKey: false,
  }
);

// ======================================================
// COMPOSITE INDEXES
// ======================================================

transactionSchema.index({
  userId: 1,
  createdAt: -1,
});

transactionSchema.index({
  walletType: 1,
  createdAt: -1,
});

transactionSchema.index({
  transactionType: 1,
  createdAt: -1,
});

transactionSchema.index({
  status: 1,
  createdAt: -1,
});
// ======================================================
// PRE SAVE MIDDLEWARE
// ======================================================

transactionSchema.pre(
  "save",
  function (next) {
    // ==================================================
    // NORMALIZE NUMERIC VALUES
    // ==================================================

    this.amount =
      Number(this.amount || 0);

    this.balanceBefore =
      Number(this.balanceBefore || 0);

    this.balanceAfter =
      Number(this.balanceAfter || 0);

    this.fee =
      Number(this.fee || 0);

    // ==================================================
    // AUTO CALCULATE NET AMOUNT
    // ==================================================

    this.netAmount =
      this.amount - this.fee;

    // ==================================================
    // NORMALIZE WALLET TYPE
    // ==================================================

    if (this.walletType) {
      this.walletType =
        String(
          this.walletType
        ).toUpperCase();
    }

    // ==================================================
    // NORMALIZE TRANSACTION MODE
    // ==================================================

    if (this.transactionMode) {
      this.transactionMode =
        String(
          this.transactionMode
        ).toUpperCase();
    }

    // ==================================================
    // NORMALIZE TRANSACTION TYPE
    // ==================================================

    if (this.transactionType) {
      this.transactionType =
        String(
          this.transactionType
        ).toUpperCase();
    }

    // ==================================================
    // NORMALIZE STATUS
    // ==================================================
    //
    // Do NOT force status to uppercase here because
    // existing legacy transactions use:
    //
    // "Pending"
    // "Completed"
    // "Rejected"
    // "Failed"
    //
    // Current withdraw routes can use:
    //
    // "APPROVED"
    // "REJECTED"
    // "CANCELLED"
    //
    // Therefore the original value is preserved.
    // ==================================================

    if (this.status) {
      this.status =
        String(
          this.status
        ).trim();
    }

    // ==================================================
    // CONTINUE
    // ==================================================

    next();
  }
);

// ======================================================
// JSON RESPONSE CLEANUP
// ======================================================

transactionSchema.set(
  "toJSON",
  {
    virtuals: true,

    transform(doc, ret) {
      delete ret.__v;

      return ret;
    },
  }
);

// ======================================================
// SAFE EXPORT
// Render + Nodemon + PM2 Safe
// ======================================================

module.exports =
  mongoose.models.Transaction ||
  mongoose.model(
    "Transaction",
    transactionSchema
  );