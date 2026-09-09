const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
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

    accountNumber: {
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

// Prevent OverwriteModelError
module.exports =
  mongoose.models.Withdraw ||
  mongoose.model("Withdraw", withdrawSchema);