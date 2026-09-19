"use strict";

const mongoose = require("mongoose");

// =======================================================
// GoldTrade V18 - Gold Transaction Model
// Linux + Render Compatible
// =======================================================

const goldTradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },

    grams: {
      type: Number,
      required: true,
      min: 0,
    },

    pricePerGram: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    marketPrice: {
      type: Number,
      default: 0,
    },

    profitLoss: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Completed", "Pending", "Cancelled"],
      default: "Completed",
    },

    note: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    collection: "goldtrades",
  }
);

// Useful indexes
goldTradeSchema.index({ userId: 1, createdAt: -1 });
goldTradeSchema.index({ username: 1 });
goldTradeSchema.index({ type: 1 });

module.exports =
  mongoose.models.GoldTrade ||
  mongoose.model("GoldTrade", goldTradeSchema);