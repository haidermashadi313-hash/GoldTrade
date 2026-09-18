const mongoose = require("mongoose");

const UsdtRequestSchema = new mongoose.Schema(
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

    PkrAmount: {
      type: Number,
      required: true,
    },

    UsdtAmount: {
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
  mongoose.model("UsdtRequest", UsdtRequestSchema);