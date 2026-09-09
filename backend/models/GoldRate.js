const mongoose = require("mongoose");

const goldTradeSchema = new mongoose.Schema(
  {
    username: String,

    tradeType: {
      type: String,
      enum: ["BUY", "SELL"],
    },

    grams: Number,

    pricePerGram: Number,

    totalPKR: Number,

    walletUsed: {
      type: String,
      default: "PKR",
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