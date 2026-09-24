const mongoose = require("mongoose");

const WalletHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
    },

    walletType: {
      type: String,
      enum: ["PKR", "GOLD", "USDT"],
      required: true,
    },

    type: {
      type: String,
      enum: ["Credit", "Debit"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    note: {
      type: String,
      default: "",
    },

    admin: {
      type: String,
      default: "Admin",
    },
  },
  {
    timestamps: true,
    collection: "wallet_histories",
  }
);

module.exports = mongoose.model("WalletHistory", WalletHistorySchema);