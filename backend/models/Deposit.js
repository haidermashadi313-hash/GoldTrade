const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    email: String,

    amount: {
      type: Number,
      required: true,
    },

    network: {
      type: String,
      default: "USDT TRC20",
    },

    walletAddress: {
      type: String,
      required: true,
    },

    receipt: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    adminNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Deposit", depositSchema);