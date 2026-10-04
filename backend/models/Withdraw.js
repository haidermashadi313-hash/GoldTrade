/*
========================================================
 GoldTrade V18 Enterprise Backend
 Withdraw.js — PART 1/2
 Withdraw Request Model
 Production Ready (Render + PM2 + MongoDB Atlas)
========================================================
*/

"use strict";

const mongoose = require("mongoose");

// ======================================================
// WITHDRAW SCHEMA
// ======================================================

const WithdrawSchema = new mongoose.Schema(
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

    fullName: {
      type: String,
      default: "",
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    // ==================================================
    // WITHDRAW INFORMATION
    // ==================================================

    walletType: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["PKR", "USDT"],
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "PKR",
      uppercase: true,
      trim: true,
    },

    network: {
      type: String,
      enum: ["TRC20", "ERC20", "BEP20", "POLYGON", "SOL", ""],
      default: "",
    },

    // ==================================================
    // RECEIVER PAYMENT DETAILS
    // ==================================================

    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },

    receiverName: {
      type: String,
      default: "",
      trim: true,
    },

    receiverAccount: {
      type: String,
      default: "",
      trim: true,
    },

    receiverWalletAddress: {
      type: String,
      default: "",
      trim: true,
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    iban: {
      type: String,
      default: "",
      trim: true,
    },

    transactionId: {
      type: String,
      default: "",
      trim: true,
    },

    referenceId: {
      type: String,
      default: "",
      trim: true,
    },

    // ==================================================
    // STATUS
    // ==================================================

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "PROCESSING",
      ],
      default: "PENDING",
      uppercase: true,
      index: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    rejectReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    // ==================================================
    // WALLET SNAPSHOT
    // ==================================================

    walletBefore: {
      pkrBalance: {
        type: Number,
        default: 0,
      },

      usdtBalance: {
        type: Number,
        default: 0,
      },

      goldBalance: {
        type: Number,
        default: 0,
      },
    },

    walletAfter: {
      pkrBalance: {
        type: Number,
        default: 0,
      },

      usdtBalance: {
        type: Number,
        default: 0,
      },

      goldBalance: {
        type: Number,
        default: 0,
      },
    },

    // ==================================================
    // ADMIN AUDIT
    // ==================================================

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedByUsername: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    // ==================================================
    // SECURITY / AUDIT TRAIL
    // ==================================================

    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },

    device: {
      type: String,
      default: "",
      trim: true,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: "withdraws",
    versionKey: false,
  }
);

// ======================================================
// INDEXES (MongoDB Optimized)
// ======================================================

WithdrawSchema.index({
  username: 1,
  createdAt: -1,
});

WithdrawSchema.index({
  walletType: 1,
  createdAt: -1,
});

WithdrawSchema.index({
  status: 1,
  createdAt: -1,
});

WithdrawSchema.index({
  referenceId: 1,
});

// ======================================================
// PRE-SAVE MIDDLEWARE
// Auto uppercase / cleanup
// ======================================================

WithdrawSchema.pre("save", function (next) {
  if (this.walletType) {
    this.walletType = this.walletType.toUpperCase();
  }

  if (this.currency) {
    this.currency = this.currency.toUpperCase();
  }

  if (this.status) {
    this.status = this.status.toUpperCase();
  }

  if (this.username) {
    this.username = this.username.trim().toLowerCase();
  }

  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }

  if (this.approvedByUsername) {
    this.approvedByUsername =
      this.approvedByUsername.trim().toLowerCase();
  }

  next();
});

// ======================================================
// JSON RESPONSE CLEANUP
// ======================================================

WithdrawSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

// ======================================================
// SAFE EXPORT (Render Hot Reload Safe)
// ======================================================

module.exports =
  mongoose.models.Withdraw ||
  mongoose.model("Withdraw", WithdrawSchema);