const mongoose = require("mongoose");

const UsdtOrderSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
    },

    network: {
      type: String,
      default: "TRC20",
    },

    PkrAmount: {
      type: Number,
      required: true,
    },

    UsdtAmount: {
      type: Number,
      required: true,
    },

    WalletAddress: {
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
  mongoose.model("UsdtOrder", UsdtOrderSchema);