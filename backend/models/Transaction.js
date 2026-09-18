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
        "Gold buy",
        "Gold sell",
        "wallet Credit",
        "wallet Debit",
        "Referral Bonus",
        "Cashback",
      ],
      required: true,
    },

    amountPkr: {
      type: Number,
      default: 0,
    },

    amountGold: {
      type: Number,
      default: 0,
    },

    amountUsdt: {
      type: Number,
      default: 0,
    },

    provider: {
      type: String,
      default: "wallet",
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