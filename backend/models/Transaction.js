"use strict";

const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: {
      type: String,
      default: "",
    },

    transactionType: {
      type: String,
      enum: [
        "Deposit",
        "Withdraw",
        "Gold Buy",
        "Gold Sell",
        "Wallet Credit",
        "Wallet Debit",
        "Referral Bonus",
        "Cashback",
      ],
      required: true,
    },

    amountPKR: {
      type: Number,
      default: 0,
    },

    amountGold: {
      type: Number,
      default: 0,
    },

    amountUSDT: {
      type: Number,
      default: 0,
    },

    provider: {
      type: String,
      default: "Wallet",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Completed"],
      default: "Pending",
    },

    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);