const mongoose = require("mongoose");

const goldTradeSchema = new mongoose.Schema(
  {
    username: String,

    tradeType: {
      type: String,
      enum: ["buy", "sell"],
    },

    grams: Number,

    pricePerGram: Number,

    totalPkr: Number,

    walletUsed: {
      type: String,
      default: "Pkr",
    },

    status: {
      type: String,
      default: "Completed",
    },

    createdBy: {
      type: String,
      default: "User",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.GoldTrade ||
  mongoose.model("GoldTrade", goldTradeSchema);