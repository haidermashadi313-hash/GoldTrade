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

    // Pkr wallet (MAIN FIELD)
    PkrBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // GOLD wallet
    goldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Usdt wallet
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

    // wallet Status
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

module.exports =
  mongoose.models.wallet ||
  mongoose.model("wallet", walletSchema);