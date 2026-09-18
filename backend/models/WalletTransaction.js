const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["Deposit", "Withdraw", "Transfer", "Bonus", "Cashback", "CREDIT", "DEBIT",],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      default: "Completed",
    },

    note: String,
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.WalletTransaction ||
  mongoose.model("WalletTransaction", walletTransactionSchema);