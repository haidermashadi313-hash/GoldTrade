const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    // User Link
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // PKR Wallet
    PkrBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Gold Wallet
    goldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // USDT Wallet
    UsdtBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Totals
    totalDeposit: {
      type: Number,
      default: 0,
    },

    totalWithdraw: {
      type: Number,
      default: 0,
    },

    // Wallet Status
    status: {
      type: String,
      enum: ["Active", "Suspended"],
      default: "Active",
    },
  },
  {
    timestamps: true,
    collection: "wallets",
  }
);

// Render / Hot Reload Safe Export
module.exports =
  mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);