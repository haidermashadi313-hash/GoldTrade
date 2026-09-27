/*
========================================================
 GoldTrade V18 Enterprise Backend
 Deposit.js — PART 1/2
 Deposit Request Model
 Production Ready (Render + PM2 + MongoDB Atlas)
========================================================
*/

"use strict";

const mongoose = require("mongoose");

// ======================================================
// DEPOSIT SCHEMA
// ======================================================

const DepositSchema = new mongoose.Schema(
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
    // DEPOSIT INFORMATION
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
      enum: ["TRC20", "ERC20", "BEP20", "SOL", "POLYGON", ""],
      default: "",
    },

    // ==================================================
    // PAYMENT DETAILS
    // ==================================================

    paymentMethod: {
      type: String,
      required: true,
      trim: true,
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

    receiverAccount: {
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
      index: true,
    },

    // ==================================================
    // RECEIPT / SCREENSHOT
    // ==================================================

    receiptImage: {
      type: String,
      default: "",
      trim: true,
    },

    receiptUploaded: {
      type: Boolean,
      default: false,
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
    // ADMIN APPROVAL
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

    // ==================================================
    // SECURITY / AUDIT
    // ==================================================

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
    collection: "deposits",
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ======================================================
// COMPOSITE INDEXES (Duplicate Warning Free)
// ======================================================

DepositSchema.index({ userId: 1, createdAt: -1 });
DepositSchema.index({ walletType: 1, status: 1 });
DepositSchema.index({ status: 1, createdAt: -1 });

// ======================================================
// PRE SAVE MIDDLEWARE
// ======================================================

DepositSchema.pre("save", function (next) {
  this.amount = Number(this.amount || 0);

  if (this.walletType) {
    this.walletType = this.walletType.toUpperCase();
  }

  if (this.currency) {
    this.currency = this.currency.toUpperCase();
  }

  if (this.status) {
    this.status = this.status.toUpperCase();
  }

  this.receiptUploaded = Boolean(this.receiptImage);

  next();
});

// ======================================================
// JSON CLEANUP
// ======================================================

DepositSchema.set("toJSON", {
  virtuals: true,
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

// ======================================================
// SAFE EXPORT (Render + PM2 + Nodemon Safe)
// ======================================================

module.exports =
  mongoose.models.Deposit ||
  mongoose.model("Deposit", DepositSchema);