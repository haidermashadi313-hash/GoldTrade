const mongoose = require("mongoose");

const goldTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
    },

    tradeType: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
      index: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },

    pricePerGram: {
      type: Number,
      required: true,
      min: 1,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    walletType: {
      type: String,
      default: "PKR",
    },

    status: {
      type: String,
      enum: ["Completed", "Pending", "Cancelled"],
      default: "Completed",
      index: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Useful indexes
goldTransactionSchema.index({ createdAt: -1 });
goldTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model(
  "GoldTransaction",
  goldTransactionSchema
);