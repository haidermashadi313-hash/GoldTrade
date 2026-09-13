const mongoose = require("mongoose");

const goldTradeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    tradeType: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },

    grams: {
      type: Number,
      required: true,
    },

    pricePerGram: {
      type: Number,
      required: true,
    },

    totalPKR: {
      type: Number,
      required: true,
    },

    averageBuyPrice: {
      type: Number,
      default: 0,
    },

    profitLoss: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      default: "Completed",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.GoldTrade ||
  mongoose.model("GoldTrade", goldTradeSchema);