const mongoose = require("mongoose");

const depositSchema = new mongoose.Schema(
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

    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      enum: ["PKR", "USDT"],
      default: "PKR",
    },

    method: {
      type: String,
      enum: ["Bank Transfer", "JazzCash", "Easypaisa", "USDT (TRC20)"],
      required: true,
    },

    transactionId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    receiptImage: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    ipAddress: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate transaction IDs
depositSchema.index({ transactionId: 1 }, { unique: true });

// Latest deposits first
depositSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Deposit", depositSchema);