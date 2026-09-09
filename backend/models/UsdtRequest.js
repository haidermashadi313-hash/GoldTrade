const mongoose = require("mongoose");

const usdtRequestSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["Buy", "Sell"],
      required: true,
    },

    pkrAmount: {
      type: Number,
      required: true,
    },

    usdtAmount: {
      type: Number,
      required: true,
    },

    rate: {
      type: Number,
      required: true,
    },

    walletAddress: {
      type: String,
      default: "",
    },

    receiptImage: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.UsdtRequest ||
  mongoose.model("UsdtRequest", usdtRequestSchema);