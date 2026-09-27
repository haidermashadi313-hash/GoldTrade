// ======================================================
// GoldTrade V18 Enterprise Backend
// Wallet.js — PART 1/2
// Wallet Schema
// Production Ready (Render + MongoDB Atlas + Ubuntu)
// ======================================================

const mongoose = require("mongoose");

// ======================================================
// WALLET SCHEMA
// ======================================================

const WalletSchema = new mongoose.Schema(
  {
    // ==================================================
    // USER INFORMATION
    // ==================================================

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },

    // ==================================================
    // MAIN BALANCES
    // ==================================================

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    pkrBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    goldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    usdtBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==================================================
    // LOCKED BALANCES
    // ==================================================

    lockedPkr: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockedGold: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockedUsdt: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==================================================
    // PORTFOLIO VALUES
    // ==================================================

    portfolioValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    liveProfit: {
      type: Number,
      default: 0,
    },

    liveProfitPercent: {
      type: Number,
      default: 0,
    },

    // ==================================================
    // DEPOSIT / WITHDRAW TOTALS
    // ==================================================

    totalDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalWithdraw: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPkrDeposit: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPkrWithdraw: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalUsdtDeposited: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalUsdtWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalGoldPurchased: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalGoldSold: {
      type: Number,
      default: 0,
      min: 0,
    },
        // ==================================================
    // ACCOUNT STATUS
    // ==================================================

    status: {
      type: String,
      enum: ["Active", "Suspended", "Blocked"],
      default: "Active",
      index: true,
    },

    isVerified: {
      type: Boolean,
      default: true,
    },

    isFrozen: {
      type: Boolean,
      default: false,
    },

    // ==================================================
    // LAST ACTIVITY
    // ==================================================

    lastDepositAt: {
      type: Date,
      default: null,
    },

    lastWithdrawAt: {
      type: Date,
      default: null,
    },

    lastTradeAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "Wallets",
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ======================================================
// VIRTUALS
// ======================================================

// Available PKR
WalletSchema.virtual("availablePkr").get(function () {
  return Math.max(this.pkrBalance - this.lockedPkr, 0);
});

// Available Gold
WalletSchema.virtual("availableGold").get(function () {
  return Math.max(this.goldBalance - this.lockedGold, 0);
});

// Available USDT
WalletSchema.virtual("availableUsdt").get(function () {
  return Math.max(this.usdtBalance - this.lockedUsdt, 0);
});

// Total Wallet Value
WalletSchema.virtual("totalWalletValue").get(function () {
  return (
    Number(this.pkrBalance || 0) +
    Number(this.portfolioValue || 0) +
    Number(this.usdtBalance || 0)
  );
});

// ======================================================
// PRE SAVE MIDDLEWARE
// ======================================================

WalletSchema.pre("save", function (next) {
  const numberFields = [
    "balance",
    "pkrBalance",
    "goldBalance",
    "usdtBalance",
    "lockedPkr",
    "lockedGold",
    "lockedUsdt",
    "portfolioValue",
    "liveProfit",
    "liveProfitPercent",
    "totalDeposit",
    "totalWithdraw",
    "totalPkrDeposit",
    "totalPkrWithdraw",
    "totalUsdtDeposited",
    "totalUsdtWithdrawn",
    "totalGoldPurchased",
    "totalGoldSold",
  ];

  numberFields.forEach((field) => {
    if (this[field] === undefined || this[field] === null) {
      this[field] = 0;
    }
  });

  next();
});

// ======================================================
// JSON RESPONSE CLEANUP
// ======================================================

WalletSchema.set("toJSON", {
  virtuals: true,
  transform(doc, ret) {
    delete ret.__v;
    return ret;
  },
});

// ======================================================
// SAFE EXPORT (Render + Hot Reload)
// ======================================================

module.exports =
  mongoose.models.Wallet ||
  mongoose.model("Wallet", WalletSchema);