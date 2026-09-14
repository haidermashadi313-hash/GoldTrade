const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: String,

    type: {
      type: String,
      enum: [
        "Deposit",
        "Withdraw",
        "Buy Gold",
        "Sell Gold",
        "Buy USDT",
        "Sell USDT",
      ],
      required: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    asset: {
      type: String,
      default: "PKR",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    note: String,

    receipt: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);