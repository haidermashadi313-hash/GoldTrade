const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    method: {
      type: String,
      required: true,
    },

    transactionId: {
      type: String,
      required: true,
    },

    receiptImage: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Deposit ||
  mongoose.model("Deposit", depositSchema);