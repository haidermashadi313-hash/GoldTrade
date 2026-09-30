// ======================================================
// GoldTrade V18 Enterprise
// PaymentSettings.js
// PART 1/4
// Production Ready
// ======================================================

const mongoose = require("mongoose");

// ======================================================
// DEPOSIT METHOD SCHEMA
// ======================================================

const depositMethodSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    // Bank / JazzCash / EasyPaisa
    accountTitle: {
      type: String,
      default: "",
      trim: true,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    iban: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    // USDT / Binance
    walletAddress: {
      type: String,
      default: "",
      trim: true,
    },

    network: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    // QR
    qrImage: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
  }
);

// ======================================================
// WITHDRAW METHOD SCHEMA
// ======================================================

const withdrawMethodSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    enabled: {
      type: Boolean,
      default: true,
    },

    processingTime: {
      type: String,
      default: "Instant",
      trim: true,
    },

    minimumAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maximumAmount: {
      type: Number,
      default: 999999999,
      min: 0,
    },

    accountTitle: {
      type: String,
      default: "",
      trim: true,
    },

    accountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    walletAddress: {
      type: String,
      default: "",
      trim: true,
    },

    network: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    qrImage: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
  }
);

// ======================================================
// MAIN PAYMENT SETTINGS SCHEMA
// ======================================================

const paymentSettingsSchema = new mongoose.Schema(
  {
    // ====================================================
    // DEPOSIT METHODS
    // ====================================================

    depositMethods: {
      type: [depositMethodSchema],
      default: [],
    },

    // ====================================================
    // WITHDRAW METHODS
    // ====================================================

    withdrawMethods: {
      type: [withdrawMethodSchema],
      default: [],
    },

    // ====================================================
    // LEGACY / DIRECT PAYMENT FIELDS
    // Kept for compatibility with older frontend modules
    // ====================================================

    jazzCashNumber: {
      type: String,
      default: "",
      trim: true,
    },

    jazzCashTitle: {
      type: String,
      default: "",
      trim: true,
    },

    easypaisaNumber: {
      type: String,
      default: "",
      trim: true,
    },

    easypaisaTitle: {
      type: String,
      default: "",
      trim: true,
    },

    bankName: {
      type: String,
      default: "",
      trim: true,
    },

    bankAccountTitle: {
      type: String,
      default: "",
      trim: true,
    },

    bankAccountNumber: {
      type: String,
      default: "",
      trim: true,
    },

    iban: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    usdtTRC20: {
      type: String,
      default: "",
      trim: true,
    },

    usdtBEP20: {
      type: String,
      default: "",
      trim: true,
    },

    usdtERC20: {
      type: String,
      default: "",
      trim: true,
    },

    goldWalletAddress: {
      type: String,
      default: "",
      trim: true,
    },

    goldWalletTitle: {
      type: String,
      default: "",
      trim: true,
    },

    jazzCashQR: {
      type: String,
      default: "",
      trim: true,
    },

    easypaisaQR: {
      type: String,
      default: "",
      trim: true,
    },

    binanceQR: {
      type: String,
      default: "",
      trim: true,
    },

    jazzCashEnabled: {
      type: Boolean,
      default: true,
    },

    easypaisaEnabled: {
      type: Boolean,
      default: true,
    },

    bankEnabled: {
      type: Boolean,
      default: true,
    },

    usdtEnabled: {
      type: Boolean,
      default: true,
    },

    goldEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "payment_settings",
  }
);

// ======================================================
// DEFAULT DEPOSIT METHODS
// ======================================================

paymentSettingsSchema.statics.getDefaultDepositMethods =
  function () {
    return [
      {
        method: "BANK",
        title: "Bank Transfer",
        enabled: true,
        accountTitle: "",
        accountNumber: "",
        iban: "",
        walletAddress: "",
        network: "",
        qrImage: "",
      },
      {
        method: "JAZZCASH",
        title: "JazzCash",
        enabled: true,
        accountTitle: "",
        accountNumber: "",
        iban: "",
        walletAddress: "",
        network: "",
        qrImage: "",
      },
      {
        method: "EASYPAISA",
        title: "EasyPaisa",
        enabled: true,
        accountTitle: "",
        accountNumber: "",
        iban: "",
        walletAddress: "",
        network: "",
        qrImage: "",
      },
      {
        method: "BINANCE",
        title: "Binance USDT",
        enabled: true,
        accountTitle: "",
        accountNumber: "",
        iban: "",
        walletAddress: "",
        network: "TRC20",
        qrImage: "",
      },
    ];
  };

// ======================================================
// DEFAULT WITHDRAW METHODS
// ======================================================

paymentSettingsSchema.statics.getDefaultWithdrawMethods =
  function () {
    return [
      {
        method: "BANK",
        title: "Bank Transfer",
        enabled: true,
        processingTime: "1-24 Hours",
        minimumAmount: 1000,
        maximumAmount: 1000000,
        accountTitle: "",
        accountNumber: "",
        walletAddress: "",
        network: "",
        qrImage: "",
      },
      {
        method: "JAZZCASH",
        title: "JazzCash",
        enabled: true,
        processingTime: "5-30 Minutes",
        minimumAmount: 500,
        maximumAmount: 200000,
        accountTitle: "",
        accountNumber: "",
        walletAddress: "",
        network: "",
        qrImage: "",
      },
      {
        method: "EASYPAISA",
        title: "EasyPaisa",
        enabled: true,
        processingTime: "5-30 Minutes",
        minimumAmount: 500,
        maximumAmount: 200000,
        accountTitle: "",
        accountNumber: "",
        walletAddress: "",
        network: "",
        qrImage: "",
      },
      {
        method: "BINANCE",
        title: "Binance USDT",
        enabled: true,
        processingTime: "5-15 Minutes",
        minimumAmount: 10,
        maximumAmount: 100000,
        accountTitle: "",
        accountNumber: "",
        walletAddress: "",
        network: "TRC20",
        qrImage: "",
      },
    ];
  };

// ======================================================
// SINGLETON HELPER
// ======================================================

paymentSettingsSchema.statics.getOrCreateSettings =
  async function () {
    let settings = await this.findOne();

    if (!settings) {
      settings = await this.create({
        depositMethods: this.getDefaultDepositMethods(),
        withdrawMethods: this.getDefaultWithdrawMethods(),
      });
    } else {
      let changed = false;

      if (
        !Array.isArray(settings.depositMethods) ||
        settings.depositMethods.length === 0
      ) {
        settings.depositMethods =
          this.getDefaultDepositMethods();
        changed = true;
      }

      if (
        !Array.isArray(settings.withdrawMethods) ||
        settings.withdrawMethods.length === 0
      ) {
        settings.withdrawMethods =
          this.getDefaultWithdrawMethods();
        changed = true;
      }

      if (changed) {
        await settings.save();
      }
    }

    return settings;
  };

// ======================================================
// EXPORT
// ======================================================

module.exports =
  mongoose.models.PaymentSettings ||
  mongoose.model(
    "PaymentSettings",
    paymentSettingsSchema
  );