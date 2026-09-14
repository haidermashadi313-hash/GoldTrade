const mongoose = require("mongoose");

const withdrawSchema = new mongoose.Schema(
  {
    // ================= USER =================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    username: {
      type: String,
      required: true,
    },

    // ================= WITHDRAW AMOUNT =================
    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "PKR",
    },

    // ================= PAYMENT METHOD =================
    paymentMethod: {
      type: String,
      enum: [
        "BANK",
        "EASYPAISA",
        "NAYAPAY",
        "JAZZCASH",
        "SADAPAY",
        "RAAST",
        "USDT_TRC20",
      ],
      required: true,
    },

    // ================= PAYMENT DETAILS =================
    bankName: {
      type: String,
      default: "",
    },

    accountTitle: {
      type: String,
      required: true,
    },

    accountNumber: {
      type: String,
      required: true,
    },

    iban: {
      type: String,
      default: "",
    },

    walletAddress: {
      type: String,
      default: "",
    },

    network: {
      type: String,
      default: "",
    },

    // ================= STATUS =================
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // ================= ADMIN =================
    adminNote: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedBy: {
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

    // ================= PAYMENT RECEIPT =================
    receiptImage: {
      type: String,
      default: "",
    },

    transactionId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Withdraw", withdrawSchema);