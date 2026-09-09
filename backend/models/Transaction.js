const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    username: String,

    wallet: {
      type: String,
      default: "PKR",
    },

    type: String,

    amount: Number,

    reason: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Completed",
    },

    transactionId: String,

    method: String,

    updatedBy: {
      type: String,
      default: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);