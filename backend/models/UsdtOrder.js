const mongoose = require("mongoose");

const usdtOrderSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },

    network: {
      type: String,
      default: "TRC20",
    },

    pkrAmount: {
      type: Number,
      required: true,
    },

    usdtAmount: {
      type: Number,
      required: true,
    },

    walletAddress: {
      type: String,
      required: true,
    },

    receiptImage: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.UsdtOrder ||
  mongoose.model("UsdtOrder", usdtOrderSchema);