// ======================================================
// GoldTrade V18 - GoldTrade Model
// ======================================================

const mongoose = require("mongoose");

const goldTradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    type: {
      type: String,
      required: true,
      enum: ["BUY", "SELL"],
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

    status: {
      type: String,
      default: "COMPLETED",
      enum: ["PENDING", "COMPLETED", "CANCELLED"],
    },
  },
  {
    timestamps: true,
    collection: "goldtrades",
  }
);

module.exports = mongoose.model("GoldTrade", goldTradeSchema);