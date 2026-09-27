/*
========================================================
 GoldTrade V18 Enterprise Backend
 UsdtTrade.js — PART 1/2
 USDT Trading Ledger Model
 Production Ready (Render + PM2 + MongoDB Atlas)
========================================================
*/

"use strict";

const mongoose = require("mongoose");

// ======================================================
// USDT TRADE SCHEMA
// ======================================================

const UsdtTradeSchema = new mongoose.Schema(
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
    // TRADE INFORMATION
    // ==================================================

    tradeType: {
      type: String,
      required: true,
      uppercase: true,
      enum: ["BUY", "SELL"],
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "CANCELLED", "FAILED"],
      default: "COMPLETED",
      index: true,
    },

    // ==================================================
    // USDT QUANTITY
    // ==================================================

    quantity: {
      type: Number,
      required: true,
      min: 0.000001,
    },

    remainingQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    soldQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==================================================
    // PRICE SNAPSHOT
    // ==================================================

    buyPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    marketPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    usdToPkrRate: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==================================================
    // TRADE VALUE
    // ==================================================

    totalAmount: {
      type: Number,
      required: true,
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
    // PROFIT / LOSS
    // ==================================================

    investedAmount: {
      type: Number,
      default: 0,
    },

    profitLoss: {
      type: Number,
      default: 0,
    },

    profitLossPercent: {
      type: Number,
      default: 0,
    },

    // ==================================================
    // WALLET SNAPSHOT
    // ==================================================

    walletBefore: {
      pkrBalance: { type: Number, default: 0 },
      goldBalance: { type: Number, default: 0 },
      usdtBalance: { type: Number, default: 0 },
    },

    walletAfter: {
      pkrBalance: { type: Number, default: 0 },
      goldBalance: { type: Number, default: 0 },
      usdtBalance: { type: Number, default: 0 },
    },

    // ==================================================
    // REFERENCE INFORMATION
    // ==================================================

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

    paymentMethod: {
      type: String,
      default: "",
      trim: true,
    },

    blockchainNetwork: {
      type: String,
      enum: ["TRC20", "ERC20", "BEP20", "SOL", "POLYGON", ""],
      default: "TRC20",
    },

    walletAddress: {
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

    // ==================================================
    // EXTRA METADATA
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
    collection: "usdt_trades",
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ======================================================
// PERFORMANCE INDEXES
// (Only composite indexes — no duplicate warnings)
// ======================================================

UsdtTradeSchema.index({ userId: 1, createdAt: -1 });
UsdtTradeSchema.index({ tradeType: 1, createdAt: -1 });
UsdtTradeSchema.index({ status: 1, createdAt: -1 });

// ======================================================
// VIRTUALS
// ======================================================

// Remaining USDT available for selling
UsdtTradeSchema.virtual("activeQuantity").get(function () {
  return Math.max(this.quantity - this.soldQuantity, 0);
});

// Current market value of remaining USDT
UsdtTradeSchema.virtual("currentValue").get(function () {
  return this.activeQuantity * this.marketPrice;
});

// ======================================================
// PRE SAVE MIDDLEWARE
// ======================================================

UsdtTradeSchema.pre("save", function (next) {
  this.quantity = Number(this.quantity || 0);
  this.remainingQuantity = Number(
    this.remainingQuantity || this.quantity
  );
  this.soldQuantity = Number(this.soldQuantity || 0);

  this.buyPrice = Number(this.buyPrice || 0);
  this.sellPrice = Number(this.sellPrice || 0);
  this.marketPrice = Number(this.marketPrice || 0);
  this.usdToPkrRate = Number(this.usdToPkrRate || 0);

  this.totalAmount = Number(this.totalAmount || 0);
  this.fee = Number(this.fee || 0);

  // Auto calculate net amount
  this.netAmount = this.totalAmount - this.fee;

  // Keep remaining quantity updated
  this.remainingQuantity = Math.max(
    this.quantity - this.soldQuantity,
    0
  );

  // Normalize values
  if (this.tradeType) {
    this.tradeType = this.tradeType.toUpperCase();
  }

  if (this.status) {
    this.status = this.status.toUpperCase();
  }

  next();
});

// ======================================================
// JSON CLEANUP
// ======================================================

UsdtTradeSchema.set("toJSON", {
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
  mongoose.models.UsdtTrade ||
  mongoose.model("UsdtTrade", UsdtTradeSchema);