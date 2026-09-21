const mongoose = require("mongoose");

const WalletTransactionSchema = new mongoose.Schema(
  {
    // =====================================================
    // USER INFORMATION
    // =====================================================

    username: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    // =====================================================
    // WALLET TYPE
    // PKR | GOLD | USDT | SYSTEM
    // =====================================================

    walletType: {
      type: String,
      required: true,
      enum: ["PKR", "GOLD", "USDT", "SYSTEM"],
    },

    // =====================================================
    // TRANSACTION TYPE
    // =====================================================

    transactionType: {
      type: String,
      required: true,
      enum: [
        // Manual Wallet
        "ADMIN_CREDIT",
        "ADMIN_DEBIT",
        "WALLET_FREEZE",
        "WALLET_UNFREEZE",

        // Deposits
        "DEPOSIT_PENDING",
        "DEPOSIT_APPROVED",
        "DEPOSIT_REJECTED",

        // Withdrawals
        "WITHDRAW_PENDING",
        "WITHDRAW_APPROVED",
        "WITHDRAW_REJECTED",

        // Trading
        "BUY_GOLD",
        "SELL_GOLD",
        "BUY_USDT",
        "SELL_USDT",

        // Transfers
        "TRANSFER_IN",
        "TRANSFER_OUT",

        // Other
        "SYSTEM_UPDATE",
      ],
    },

    // =====================================================
    // AMOUNT
    // =====================================================

    amount: {
      type: Number,
      required: true,
      default: 0,
    },

    // =====================================================
    // STATUS
    // =====================================================

    status: {
      type: String,
      enum: ["Pending", "Completed", "Rejected"],
      default: "Completed",
    },

    // =====================================================
    // OPTIONAL INFORMATION
    // =====================================================

    note: {
      type: String,
      default: "",
      trim: true,
    },

    txHash: {
      type: String,
      default: "",
      trim: true,
    },

    walletAddress: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // ADMIN INFORMATION
    // =====================================================

    createdBy: {
      type: String,
      default: "SYSTEM",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Useful indexes for admin history pages
WalletTransactionSchema.index({ walletType: 1, createdAt: -1 });
WalletTransactionSchema.index({ username: 1, createdAt: -1 });

module.exports = mongoose.model(
  "WalletTransaction",
  WalletTransactionSchema
);