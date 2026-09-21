const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// =====================================================
// GOLDTRADE V18 ENTERPRISE USER MODEL
// =====================================================

const UserSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC INFORMATION
    // =====================================================

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      default: "",
      trim: true,
    },

    country: {
      type: String,
      default: "Pakistan",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // LOGIN
    // =====================================================

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    // =====================================================
    // ACCOUNT STATUS
    // =====================================================

    isActive: {
      type: Boolean,
      default: true,
    },

    walletFrozen: {
      type: Boolean,
      default: false,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },
        // =====================================================
    // PKR WALLET
    // =====================================================

    pkrBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPkrDeposited: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalPkrWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // GOLD WALLET
    // =====================================================

    goldBalance: {
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

    // =====================================================
    // USDT WALLET
    // =====================================================

    usdtBalance: {
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

    // =====================================================
    // TRADING PROFIT & LOSS
    // =====================================================

    totalProfit: {
      type: Number,
      default: 0,
    },

    totalLoss: {
      type: Number,
      default: 0,
    },

    totalTradingVolume: {
      type: Number,
      default: 0,
    },

    totalTransactions: {
      type: Number,
      default: 0,
    },

    // =====================================================
    // REFERRAL SYSTEM
    // =====================================================

    referralCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    referredBy: {
      type: String,
      default: "",
      trim: true,
    },

    referralBonus: {
      type: Number,
      default: 0,
    },

    referralCount: {
      type: Number,
      default: 0,
    },

    // =====================================================
    // ACCOUNT LIMITS
    // =====================================================

    dailyDepositLimit: {
      type: Number,
      default: 1000000,
    },

    dailyWithdrawLimit: {
      type: Number,
      default: 1000000,
    },

    dailyTradingLimit: {
      type: Number,
      default: 5000000,
    },
        // =====================================================
    // PROFILE INFORMATION
    // =====================================================

    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Male",
    },

    address: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // KYC INFORMATION
    // =====================================================

    kycStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },

    kycDocumentType: {
      type: String,
      default: "",
      trim: true,
    },

    kycDocumentNumber: {
      type: String,
      default: "",
      trim: true,
    },

    kycFrontImage: {
      type: String,
      default: "",
    },

    kycBackImage: {
      type: String,
      default: "",
    },

    // =====================================================
    // BANK DETAILS
    // =====================================================

    bankName: {
      type: String,
      default: "",
      trim: true,
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

    iban: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // CRYPTO WALLET ADDRESSES
    // =====================================================

    usdtTRC20Address: {
      type: String,
      default: "",
      trim: true,
    },

    usdtERC20Address: {
      type: String,
      default: "",
      trim: true,
    },

    btcAddress: {
      type: String,
      default: "",
      trim: true,
    },

    ethAddress: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // SECURITY
    // =====================================================

    lastLogin: {
      type: Date,
      default: null,
    },

    lastLoginIP: {
      type: String,
      default: "",
      trim: true,
    },

    loginAttempts: {
      type: Number,
      default: 0,
    },

    accountLockedUntil: {
      type: Date,
      default: null,
    },

    refreshToken: {
      type: String,
      default: "",
    },

    // =====================================================
    // NOTIFICATIONS
    // =====================================================

    emailNotifications: {
      type: Boolean,
      default: true,
    },

    smsNotifications: {
      type: Boolean,
      default: true,
    },

    pushNotifications: {
      type: Boolean,
      default: true,
    },
      },
  {
    timestamps: true,
    versionKey: false,
  }
);

// =====================================================
// DATABASE INDEXES
// =====================================================

UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ walletFrozen: 1 });
UserSchema.index({ kycStatus: 1 });
UserSchema.index({ createdAt: -1 });

// =====================================================
// PASSWORD HASH MIDDLEWARE
// =====================================================

UserSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

    next();
  } catch (error) {
    next(error);
  }
});

// =====================================================
// PASSWORD COMPARE METHOD
// =====================================================

UserSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// =====================================================
// ACCOUNT LOCK CHECK
// =====================================================

UserSchema.methods.isAccountLocked = function () {
  if (!this.accountLockedUntil) return false;

  return this.accountLockedUntil > new Date();
};

// =====================================================
// LOGIN SUCCESS
// =====================================================

UserSchema.methods.recordLogin = async function (ipAddress = "") {
  this.lastLogin = new Date();
  this.lastLoginIP = ipAddress;
  this.loginAttempts = 0;
  this.accountLockedUntil = null;

  return this.save();
};

// =====================================================
// LOGIN FAILURE
// =====================================================

UserSchema.methods.recordFailedLogin = async function () {
  this.loginAttempts += 1;

  if (this.loginAttempts >= 5) {
    const lockMinutes = 30;

    this.accountLockedUntil = new Date(
      Date.now() + lockMinutes * 60 * 1000
    );
  }

  return this.save();
};

// =====================================================
// WALLET TOTAL VALUE (VIRTUAL)
// =====================================================

UserSchema.virtual("walletSummary").get(function () {
  return {
    pkrBalance: Number(this.pkrBalance || 0),
    goldBalance: Number(this.goldBalance || 0),
    usdtBalance: Number(this.usdtBalance || 0),

    totalTransactions: Number(this.totalTransactions || 0),
    totalTradingVolume: Number(this.totalTradingVolume || 0),
  };
});

// =====================================================
// SAFE JSON OUTPUT
// =====================================================

UserSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.refreshToken;
    delete ret.__v;

    return ret;
  },
});

UserSchema.set("toObject", {
  virtuals: true,
});

// =====================================================
// EXPORT MODEL
// =====================================================

module.exports = mongoose.model("User", UserSchema);