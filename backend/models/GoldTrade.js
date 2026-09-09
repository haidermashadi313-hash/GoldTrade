const mongoose = require("mongoose");

const goldTradeSchema = new mongoose.Schema(
  {
    // ==============================
    // User Information
    // ==============================
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // ==============================
    // BUY / SELL
    // ==============================
    tradeType: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
      uppercase: true,
    },

    // ==============================
    // Gold Details
    // ==============================
    grams: {
      type: Number,
      required: true,
      min: 0,
    },

    pricePerGram: {
      type: Number,
      required: true,
      min: 0,
    },

    totalPKR: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==============================
    // Average Buy Price
    // ==============================
    averagePrice: {
      type: Number,
      default: 0,
    },

    // ==============================
    // Profit / Loss
    // ==============================
    profit: {
      type: Number,
      default: 0,
    },

    // ==============================
    // Wallet Snapshot
    // ==============================
    walletBefore: {
      type: Number,
      default: 0,
    },

    walletAfter: {
      type: Number,
      default: 0,
    },

    goldBefore: {
      type: Number,
      default: 0,
    },

    goldAfter: {
      type: Number,
      default: 0,
    },

    // ==============================
    // Admin / System Info
    // ==============================
    updatedBy: {
      type: String,
      default: "System",
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Completed", "Pending", "Cancelled"],
      default: "Completed",
    },
  },
  {
    timestamps: true,
    collection: "goldtrades",
  }
);

// ==============================
// Export Model (Very Important)
// ==============================
module.exports =
  mongoose.models.GoldTrade ||
  mongoose.model("GoldTrade", goldTradeSchema);