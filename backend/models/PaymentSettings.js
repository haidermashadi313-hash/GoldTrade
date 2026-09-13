const mongoose = require("mongoose");

const paymentSettingsSchema = new mongoose.Schema(
  {
    // ================= LIVE USDT RATES =================
    usdtBuyRate: {
      type: Number,
      default: 282.4,
    },

    usdtSellRate: {
      type: Number,
      default: 281.2,
    },

    // ================= BANK =================
    bank: {
      bankName: {
        type: String,
        default: "Meezan Bank",
      },

      accountTitle: {
        type: String,
        default: "GoldTrade Pvt Ltd",
      },

      accountNumber: {
        type: String,
        default: "",
      },

      iban: {
        type: String,
        default: "",
      },

      qrCode: {
        type: String,
        default: "",
      },
    },

    // ================= EASYPAISA =================
    easyPaisa: {
      accountTitle: {
        type: String,
        default: "GoldTrade Pvt Ltd",
      },

      mobileNumber: {
        type: String,
        default: "",
      },

      qrCode: {
        type: String,
        default: "",
      },
    },

    // ================= NAYAPAY =================
    nayaPay: {
      accountTitle: {
        type: String,
        default: "GoldTrade Pvt Ltd",
      },

      mobileNumber: {
        type: String,
        default: "",
      },

      qrCode: {
        type: String,
        default: "",
      },
    },

    // ================= USDT WALLET =================
    usdtWallet: {
      network: {
        type: String,
        default: "TRC20",
      },

      walletAddress: {
        type: String,
        default: "",
      },

      qrCode: {
        type: String,
        default: "",
      },
    },

    // ================= STATUS =================
    active: {
      type: Boolean,
      default: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "PaymentSettings",
  paymentSettingsSchema
);