// ======================================================
// GoldTrade V18 Enterprise Backend
// Wallet.js — PART 1/2
// Wallet Schema
// Production Ready
// Render + MongoDB Atlas + Ubuntu
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

    // Legacy / compatibility balance
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // PKR wallet
    pkrBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Gold wallet
    goldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // USDT wallet
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

    // ==================================================
    // GOLD TOTALS
    // ==================================================

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
    // USDT TOTALS
    // ==================================================

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

    // ==================================================
    // ACCOUNT STATUS
    // ==================================================

    status: {
      type: String,
      enum: [
        "Active",
        "Suspended",
        "Blocked",
      ],
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

  // ====================================================
  // SCHEMA OPTIONS
  // ====================================================

  {
    timestamps: true,

    collection: "Wallets",

    versionKey: false,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  }
);
// ======================================================
// VIRTUALS
// ======================================================

// ======================================================
// AVAILABLE PKR
// ======================================================

WalletSchema.virtual("availablePkr").get(function () {
  return Math.max(
    Number(this.pkrBalance || 0) -
      Number(this.lockedPkr || 0),
    0
  );
});

// ======================================================
// AVAILABLE GOLD
// ======================================================

WalletSchema.virtual("availableGold").get(function () {
  return Math.max(
    Number(this.goldBalance || 0) -
      Number(this.lockedGold || 0),
    0
  );
});

// ======================================================
// AVAILABLE USDT
// ======================================================

WalletSchema.virtual("availableUsdt").get(function () {
  return Math.max(
    Number(this.usdtBalance || 0) -
      Number(this.lockedUsdt || 0),
    0
  );
});

// ======================================================
// TOTAL WALLET VALUE
// ======================================================
//
// PKR + Portfolio Value + USDT
// ======================================================

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
//
// Normalize numeric fields before saving.
// ======================================================

WalletSchema.pre("save", function (next) {
  try {
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

      "totalGoldPurchased",
      "totalGoldSold",

      "totalUsdtDeposited",
      "totalUsdtWithdrawn",
    ];

    // --------------------------------------------------
    // NORMALIZE NUMERIC FIELDS
    // --------------------------------------------------

    for (const field of numberFields) {
      const value = this[field];

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        this[field] = 0;
        continue;
      }

      const numericValue = Number(value);

      if (!Number.isFinite(numericValue)) {
        return next(
          new Error(
            `Invalid numeric value for wallet field: ${field}`
          )
        );
      }

      this[field] = numericValue;
    }

    // --------------------------------------------------
    // NORMALIZE USERNAME
    // --------------------------------------------------

    if (
      typeof this.username === "string"
    ) {
      this.username =
        this.username
          .trim()
          .toLowerCase();
    }

    // --------------------------------------------------
    // NORMALIZE STATUS
    // --------------------------------------------------

    if (!this.status) {
      this.status = "Active";
    }

    next();
  } catch (error) {
    next(error);
  }
});


// ======================================================
// JSON RESPONSE CLEANUP
// ======================================================
//
// Virtuals remain available in API responses.
// MongoDB internal __v is removed.
// ======================================================

WalletSchema.set(
  "toJSON",
  {
    virtuals: true,

    transform(doc, ret) {
      delete ret.__v;

      return ret;
    },
  }
);


// ======================================================
// OBJECT RESPONSE CLEANUP
// ======================================================

WalletSchema.set(
  "toObject",
  {
    virtuals: true,

    transform(doc, ret) {
      delete ret.__v;

      return ret;
    },
  }
);


// ======================================================
// SAFE EXPORT
// ======================================================
//
// Prevents OverwriteModelError during
// Render / hot reload / repeated imports.
// ======================================================

module.exports =
  mongoose.models.Wallet ||
  mongoose.model(
    "Wallet",
    WalletSchema
  );