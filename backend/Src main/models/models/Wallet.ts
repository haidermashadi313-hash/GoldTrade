// ======================================================
// GoldTrade V17 ENTERPRISE
// FILE: backend/src/models/Wallet.ts
// SECTION 1/10
// IMPORTS + ENUMS + INTERFACES
// ======================================================

import mongoose, { Schema, Document, Model } from "mongoose";

// ======================================================
// Wallet STATUS ENUM
// ======================================================

export enum WalletStatus {
  ACTIVE = "ACTIVE",
  FROZEN = "FROZEN",
  SUSPENDED = "SUSPENDED",
  CLOSED = "CLOSED",
}

// ======================================================
// TRANSACTION TYPE ENUM
// ======================================================

export enum WalletTransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  buy_GOLD = "buy_GOLD",
  sell_GOLD = "sell_GOLD",
  REFERRAL = "REFERRAL",
  BONUS = "BONUS",
  ADJUSTMENT = "ADJUSTMENT",
}

// ======================================================
// TRANSACTION STATUS ENUM
// ======================================================

export enum WalletTransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

// ======================================================
// TRANSACTION INTERFACE
// ======================================================

export interface IWalletTransaction {
  [key: string]: any;

  transactionId: string;

  type: WalletTransactionType;

  status: WalletTransactionStatus;

  amount: number;

  goldAmount?: number;

  balanceBefore: number;

  balanceAfter: number;

  description: string;

  referenceId?: string;

  createdAt: Date;
}

// ======================================================
// PORTFOLIO INTERFACE
// ======================================================

export interface IPortfolio {
  [key: string]: any;

  totalInvestment: number;

  currentValue: number;

  realizedProfit: number;

  unrealizedProfit: number;

  dailyProfit: number;

  monthlyProfit: number;

  yearlyProfit: number;
}

// ======================================================
// SECURITY INTERFACE
// ======================================================

export interface IWalletSecurity {
  [key: string]: any;

  pinEnabled: boolean;

  transactionPin?: string;

  withdrawalLocked: boolean;

  tradingLocked: boolean;

  lastUpdatedAt?: Date;
}

// ======================================================
// MAIN Wallet DOCUMENT INTERFACE
// ======================================================

export interface IWallet extends Document {
  [key: string]: any;

  user: mongoose.Types.ObjectId;

  WalletNumber: string;

  status: WalletStatus;

  balance: number;

  goldBalance: number;

  lockedBalance: number;

  bonusBalance: number;

  totalDeposited: number;

  totalWithdrawn: number;

  totalGoldBought: number;

  totalGoldSold: number;

  portfolio: IPortfolio;

  security: IWalletSecurity;

  transactionhistory: IWalletTransaction[];

  creditBalance(amount: number): Promise<IWallet>;

  debitBalance(amount: number): Promise<IWallet>;
}

// ======================================================
// END OF SECTION 1/10
// NEXT SECTION: Wallet BALANCE SCHEMA
// ======================================================// ======================================================
// GoldTrade V17 ENTERPRISE
// FILE: backend/src/models/Wallet.ts
// SECTION 2/10
// Wallet BALANCE SCHEMA
// ======================================================

const WalletSchema = new Schema<IWallet>(
  {
    // ==================================================
    // USER RELATIONSHIP
    // ==================================================

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    // ==================================================
    // Wallet IDENTIFICATION
    // ==================================================

    WalletNumber: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(WalletStatus),
      default: WalletStatus.ACTIVE,
      index: true,
    },

    currency: {
      type: String,
      default: "Pkr",
      uppercase: true,
    },

    // ==================================================
    // CASH Wallet
    // ==================================================

    balance: {
      type: Number,
      default: 0,
      min: 0,
    },

    availableBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    bonusBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    cashbackBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    referralBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==================================================
    // GOLD Wallet
    // ==================================================

    goldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    availableGoldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockedGoldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    pendingGoldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    averageGoldbuyPrice: {
      type: Number,
      default: 0,
    },

    currentGoldValue: {
      type: Number,
      default: 0,
    },

    // ==================================================
    // Wallet LIMITS
    // ==================================================

    minimumBalance: {
      type: Number,
      default: 0,
    },

    maximumBalance: {
      type: Number,
      default: 100000000,
    },

    minimumGoldHolding: {
      type: Number,
      default: 0,
    },

    maximumGoldHolding: {
      type: Number,
      default: 10000,
    },

// ======================================================
// END OF SECTION 2/10
// NEXT SECTION: DEPOSIT + WITHDRAWAL STATISTICS
// ======================================================// ======================================================
// GoldTrade V17 ENTERPRISE
// FILE: backend/src/models/Wallet.ts
// SECTION 3/10
// DEPOSIT + WITHDRAWAL STATISTICS SCHEMA
// ======================================================

    // ==================================================
    // DEPOSIT STATISTICS
    // ==================================================

    totalDeposited: {
      type: Number,
      default: 0,
      min: 0,
    },

    todayDeposited: {
      type: Number,
      default: 0,
      min: 0,
    },

    monthlyDeposited: {
      type: Number,
      default: 0,
      min: 0,
    },

    yearlyDeposited: {
      type: Number,
      default: 0,
      min: 0,
    },

    depositCount: {
      type: Number,
      default: 0,
    },

    lastDepositAmount: {
      type: Number,
      default: 0,
    },

    lastDepositDate: {
      type: Date,
    },

    // ==================================================
    // WITHDRAWAL STATISTICS
    // ==================================================

    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    todayWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    monthlyWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    yearlyWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    withdrawalCount: {
      type: Number,
      default: 0,
    },

    pendingWithdrawalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedWithdrawalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastWithdrawalAmount: {
      type: Number,
      default: 0,
    },

    lastWithdrawalDate: {
      type: Date,
    },

    // ==================================================
    // TRANSACTION FEES
    // ==================================================

    totalDepositFees: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalWithdrawalFees: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalTradingFees: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalReferralRewards: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalBonusReceived: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ==================================================
    // PROFIT & LOSS SUMMARY
    // ==================================================

    totalProfit: {
      type: Number,
      default: 0,
    },

    totalLoss: {
      type: Number,
      default: 0,
    },

    netProfit: {
      type: Number,
      default: 0,
    },

    highestProfit: {
      type: Number,
      default: 0,
    },

    highestLoss: {
      type: Number,
      default: 0,
    },

    // ==================================================
    // TRANSACTION COUNTERS
    // ==================================================

    totalTransactions: {
      type: Number,
      default: 0,
    },

    successfulTransactions: {
      type: Number,
      default: 0,
    },

    failedTransactions: {
      type: Number,
      default: 0,
    },

    cancelledTransactions: {
      type: Number,
      default: 0,
    },

    lastTransactionDate: {
      type: Date,
    },

// ======================================================
// END OF SECTION 3/10
// NEXT SECTION: GOLD PORTFOLIO SCHEMA
// ======================================================// ======================================================
// GoldTrade V17 ENTERPRISE
// FILE: backend/src/models/Wallet.ts
// SECTION 4/10
// GOLD PORTFOLIO + INVESTMENT SCHEMA
// ======================================================

    // ==================================================
    // GOLD PORTFOLIO
    // ==================================================

    portfolio: {
      totalInvestment: {
        type: Number,
        default: 0,
        min: 0,
      },

      currentValue: {
        type: Number,
        default: 0,
        min: 0,
      },

      realizedProfit: {
        type: Number,
        default: 0,
      },

      unrealizedProfit: {
        type: Number,
        default: 0,
      },

      dailyProfit: {
        type: Number,
        default: 0,
      },

      weeklyProfit: {
        type: Number,
        default: 0,
      },

      monthlyProfit: {
        type: Number,
        default: 0,
      },

      yearlyProfit: {
        type: Number,
        default: 0,
      },

      lifetimeProfit: {
        type: Number,
        default: 0,
      },

      highestPortfolioValue: {
        type: Number,
        default: 0,
      },

      lowestPortfolioValue: {
        type: Number,
        default: 0,
      },
    },

    // ==================================================
    // GOLD HOLDINGS SUMMARY
    // ==================================================

    holdings: {
      totalGoldBought: {
        type: Number,
        default: 0,
      },

      totalGoldSold: {
        type: Number,
        default: 0,
      },

      currentHoldingGrams: {
        type: Number,
        default: 0,
      },

      currentHoldingTola: {
        type: Number,
        default: 0,
      },

      averagebuyPrice: {
        type: Number,
        default: 0,
      },

      averagesellPrice: {
        type: Number,
        default: 0,
      },

      highestbuyPrice: {
        type: Number,
        default: 0,
      },

      lowestbuyPrice: {
        type: Number,
        default: 0,
      },

      highestsellPrice: {
        type: Number,
        default: 0,
      },

      lowestsellPrice: {
        type: Number,
        default: 0,
      },

      currentMarketPrice: {
        type: Number,
        default: 0,
      },

      marketValue: {
        type: Number,
        default: 0,
      },
    },

    // ==================================================
    // TRADING PERFORMANCE
    // ==================================================

    performance: {
      totalbuyTrades: {
        type: Number,
        default: 0,
      },

      totalsellTrades: {
        type: Number,
        default: 0,
      },

      profitableTrades: {
        type: Number,
        default: 0,
      },

      lossTrades: {
        type: Number,
        default: 0,
      },

      winRate: {
        type: Number,
        default: 0,
      },

      averageProfitPerTrade: {
        type: Number,
        default: 0,
      },

      averageLossPerTrade: {
        type: Number,
        default: 0,
      },

      largestProfitTrade: {
        type: Number,
        default: 0,
      },

      largestLossTrade: {
        type: Number,
        default: 0,
      },

      lastTradeProfit: {
        type: Number,
        default: 0,
      },

      lastTradeDate: {
        type: Date,
      },
    },

    // ==================================================
    // INVESTMENT SUMMARY
    // ==================================================

    investmentSummary: {
      totalInvestmentAmount: {
        type: Number,
        default: 0,
      },

      totalReturnAmount: {
        type: Number,
        default: 0,
      },

      roiPercentage: {
        type: Number,
        default: 0,
      },

      annualReturnPercentage: {
        type: Number,
        default: 0,
      },

      monthlyReturnPercentage: {
        type: Number,
        default: 0,
      },

      dailyReturnPercentage: {
        type: Number,
        default: 0,
      },
    },

// ======================================================
// END OF SECTION 4/10
// NEXT SECTION: TRANSACTION history SCHEMA
// ======================================================// ======================================================
// GoldTrade V17 ENTERPRISE
// FILE: backend/src/models/Wallet.ts
// SECTION 5/10
// TRANSACTION history + AUDIT SCHEMA
// ======================================================

    // ==================================================
    // TRANSACTION history
    // ==================================================

    transactionhistory: [
      {
        transactionId: {
          type: String,
          required: true,
          unique: true,
          uppercase: true,
          trim: true,
        },

        type: {
          type: String,
          enum: Object.values(WalletTransactionType),
          required: true,
          index: true,
        },

        status: {
          type: String,
          enum: Object.values(WalletTransactionStatus),
          default: WalletTransactionStatus.PENDING,
          index: true,
        },

        amount: {
          type: Number,
          required: true,
          min: 0,
        },

        goldAmount: {
          type: Number,
          default: 0,
          min: 0,
        },

        goldPrice: {
          type: Number,
          default: 0,
        },

        balanceBefore: {
          type: Number,
          default: 0,
        },

        balanceAfter: {
          type: Number,
          default: 0,
        },

        goldBalanceBefore: {
          type: Number,
          default: 0,
        },

        goldBalanceAfter: {
          type: Number,
          default: 0,
        },

        fee: {
          type: Number,
          default: 0,
        },

        description: {
          type: String,
          trim: true,
          default: "",
        },

        referenceId: {
          type: String,
          default: "",
        },

        paymentMethod: {
          type: String,
          enum: [
            "BANK_TRANSFER",
            "JAZZCASH",
            "EASYPAISA",
            "CRYPTO",
            "REFERRAL",
            "BONUS",
            "SYSTEM",
            "MANUAL",
          ],
          default: "BANK_TRANSFER",
        },

        source: {
          type: String,
          default: "SYSTEM",
        },

        approvedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        ipAddress: {
          type: String,
          default: "",
        },

        device: {
          type: String,
          default: "",
        },

        createdAt: {
          type: Date,
          default: Date.now,
          index: true,
        },

        completedAt: {
          type: Date,
        },
      },
    ],

    // ==================================================
    // RECENT TRANSACTION SUMMARY
    // ==================================================

    lastTransaction: {
      transactionId: {
        type: String,
        default: "",
      },

      type: {
        type: String,
        default: "",
      },

      amount: {
        type: Number,
        default: 0,
      },

      createdAt: {
        type: Date,
      },
    },

    // ==================================================
    // AUDIT history
    // ==================================================

    audithistory: [
      {
        action: {
          type: String,
          required: true,
        },

        performedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        previousBalance: {
          type: Number,
          default: 0,
        },

        newBalance: {
          type: Number,
          default: 0,
        },

        notes: {
          type: String,
          default: "",
        },

        ipAddress: {
          type: String,
          default: "",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

// ======================================================
// END OF SECTION 5/10
// NEXT SECTION: Wallet SECURITY + LIMITS SCHEMA
// ======================================================// ======================================================
// GoldTrade V17 ENTERPRISE
// FILE: backend/src/models/Wallet.ts
// SECTION 6/10
// Wallet SECURITY + LIMITS + RISK CONTROL SCHEMA
// ======================================================

    // ==================================================
    // Wallet SECURITY
    // ==================================================

    security: {
      pinEnabled: {
        type: Boolean,
        default: false,
      },

      transactionPin: {
        type: String,
        default: "",
        select: false,
      },

      withdrawalLocked: {
        type: Boolean,
        default: false,
      },

      tradingLocked: {
        type: Boolean,
        default: false,
      },

      WalletFrozen: {
        type: Boolean,
        default: false,
      },

      suspiciousActivity: {
        type: Boolean,
        default: false,
      },

      lastUpdatedAt: {
        type: Date,
        default: Date.now,
      },

      lastUpdatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // ==================================================
    // DAILY LIMITS
    // ==================================================

    limits: {
      dailyDepositLimit: {
        type: Number,
        default: 1000000,
      },

      dailyWithdrawalLimit: {
        type: Number,
        default: 500000,
      },

      dailyTradingLimit: {
        type: Number,
        default: 2000000,
      },

      monthlyDepositLimit: {
        type: Number,
        default: 10000000,
      },

      monthlyWithdrawalLimit: {
        type: Number,
        default: 5000000,
      },

      monthlyTradingLimit: {
        type: Number,
        default: 50000000,
      },

      singleDepositLimit: {
        type: Number,
        default: 1000000,
      },

      singleWithdrawalLimit: {
        type: Number,
        default: 500000,
      },

      singleTradeLimit: {
        type: Number,
        default: 2000000,
      },
    },

    // ==================================================
    // LIMIT USAGE TRACKER
    // ==================================================

    usage: {
      todayDeposited: {
        type: Number,
        default: 0,
      },

      todayWithdrawn: {
        type: Number,
        default: 0,
      },

      todayTraded: {
        type: Number,
        default: 0,
      },

      monthlyDeposited: {
        type: Number,
        default: 0,
      },

      monthlyWithdrawn: {
        type: Number,
        default: 0,
      },

      monthlyTraded: {
        type: Number,
        default: 0,
      },

      lastResetDate: {
        type: Date,
        default: Date.now,
      },
    },

    // ==================================================
    // RISK CONTROL
    // ==================================================

    riskControl: {
      riskLevel: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "LOW",
      },

      amlFlag: {
        type: Boolean,
        default: false,
      },

      fraudFlag: {
        type: Boolean,
        default: false,
      },

      manualReviewRequired: {
        type: Boolean,
        default: false,
      },

      blockedReason: {
        type: String,
        default: "",
      },

      blockedAt: {
        type: Date,
      },
    },

    // ==================================================
    // Wallet SETTINGS
    // ==================================================

    settings: {
      allowDeposits: {
        type: Boolean,
        default: true,
      },

      allowWithdrawals: {
        type: Boolean,
        default: true,
      },

      allowTrading: {
        type: Boolean,
        default: true,
      },

      allowReferralBonus: {
        type: Boolean,
        default: true,
      },

      autoConvertBonusToCash: {
        type: Boolean,
        default: false,
      },

      preferredGoldUnit: {
        type: String,
        enum: ["GRAM", "TOLA", "OUNCE"],
        default: "GRAM",
      },
    },
  },
);

// ======================================================
// END OF SECTION 6/10
// NEXT SECTION: INDEXES + VIRTUAL FIELDS
// ======================================================// ======================================================
// GoldTrade V17 ENTERPRISE
// FILE: backend/src/models/Wallet.ts
// SECTION 7/10
// INDEXES + VIRTUAL FIELDS
// ======================================================

// ======================================================
// DATABASE INDEXES
// ======================================================

// Primary indexes
WalletSchema.index({ user: 1 }, { unique: true });
WalletSchema.index({ WalletNumber: 1 }, { unique: true });
WalletSchema.index({ status: 1 });

// Financial indexes
WalletSchema.index({ balance: -1 });
WalletSchema.index({ goldBalance: -1 });
WalletSchema.index({ availableBalance: -1 });

// Portfolio indexes
WalletSchema.index({ "portfolio.currentValue": -1 });
WalletSchema.index({ "portfolio.lifetimeProfit": -1 });
WalletSchema.index({ "performance.winRate": -1 });

// Risk indexes
WalletSchema.index({ "riskControl.riskLevel": 1 });
WalletSchema.index({ "riskControl.amlFlag": 1 });
WalletSchema.index({ "riskControl.fraudFlag": 1 });

// Transaction indexes
WalletSchema.index({ "transactionhistory.transactionId": 1 });
WalletSchema.index({ "transactionhistory.type": 1 });
WalletSchema.index({ "transactionhistory.status": 1 });
WalletSchema.index({ "transactionhistory.createdAt": -1 });

// Timestamp indexes
WalletSchema.index({ createdAt: -1 });
WalletSchema.index({ updatedAt: -1 });

// ======================================================
// VIRTUAL FIELD : TOTAL Wallet VALUE
// Cash + Bonus + Cashback + Referral + Gold Market Value
// ======================================================

WalletSchema.virtual("totalWalletValue").get(function () {
  return (
    this.balance +
    this.bonusBalance +
    this.cashbackBalance +
    this.referralBalance +
    this.currentGoldValue
  );
});

// ======================================================
// VIRTUAL FIELD : AVAILABLE CASH BALANCE
// ======================================================

WalletSchema.virtual("availableCashBalance").get(function () {
  return (
    this.balance -
    this.lockedBalance -
    this.pendingWithdrawalAmount
  );
});

// ======================================================
// VIRTUAL FIELD : AVAILABLE GOLD
// ======================================================

WalletSchema.virtual("availableGold").get(function () {
  return (
    this.goldBalance -
    this.lockedGoldBalance -
    this.pendingGoldBalance
  );
});

// ======================================================
// VIRTUAL FIELD : PORTFOLIO PROFIT
// ======================================================

WalletSchema.virtual("portfolioProfit").get(function () {
  return (
    this.portfolio.realizedProfit +
    this.portfolio.unrealizedProfit
  );
});

// ======================================================
// VIRTUAL FIELD : ROI PERCENTAGE
// ======================================================

WalletSchema.virtual("roiPercentage").get(function () {
  if (this.portfolio.totalInvestment <= 0) return 0;

  return Number(
    (
      (this.portfolio.lifetimeProfit /
        this.portfolio.totalInvestment) *
      100
    ).toFixed(2)
  );
});

// ======================================================
// VIRTUAL FIELD : WIN RATE
// ======================================================

WalletSchema.virtual("tradingWinRate").get(function () {
  const total =
    this.performance.profitableTrades +
    this.performance.lossTrades;

  if (total === 0) return 0;

  return Number(
    (
      (this.performance.profitableTrades / total) *
      100
    ).toFixed(2)
  );
});

// ======================================================
// VIRTUAL FIELD : NET PROFIT
// ======================================================

WalletSchema.virtual("netProfit").get(function () {
  return this.totalProfit - this.totalLoss;
});

// ======================================================
// VIRTUAL FIELD : TOTAL ASSETS
// ======================================================

WalletSchema.virtual("totalAssets").get(function () {
  return {
    cash: this.balance,
    goldGrams: this.goldBalance,
    goldValue: this.currentGoldValue,
    bonus: this.bonusBalance,
    cashback: this.cashbackBalance,
    referral: this.referralBalance,
    totalValue:
      this.balance +
      this.currentGoldValue +
      this.bonusBalance +
      this.cashbackBalance +
      this.referralBalance,
  };
});

// ======================================================
// VIRTUAL FIELD : RISK STATUS
// ======================================================

WalletSchema.virtual("WalletRiskStatus").get(function () {
  if (this.security.WalletFrozen) return "FROZEN";
  if (this.riskControl.fraudFlag) return "FRAUD_ALERT";
  if (this.riskControl.amlFlag) return "AML_REVIEW";
  return "SAFE";
});

// ======================================================
// VIRTUAL FIELD : DAILY LIMIT REMAINING
// ======================================================

WalletSchema.virtual("remainingDailyWithdrawalLimit").get(function () {
  return Math.max(
    0,
    this.limits.dailyWithdrawalLimit -
      this.usage.todayWithdrawn
  );
});

WalletSchema.virtual("remainingDailyDepositLimit").get(function () {
  return Math.max(
    0,
    this.limits.dailyDepositLimit -
      this.usage.todayDeposited
  );
});

// ======================================================
// JSON / OBJECT SETTINGS
// ======================================================

WalletSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.security?.transactionPin;
    return ret;
  },
});

WalletSchema.set("toObject", {
  virtuals: true,
});

// ======================================================
// END OF SECTION 7/10
// NEXT SECTION: Wallet METHODS
// ======================================================// ======================================================
// GoldTrade V17 ENTERPRISE
// FILE: backend/src/models/Wallet.ts
// SECTION 8/10
// Wallet METHODS
// ======================================================

// ======================================================
// CREDIT CASH BALANCE
// ======================================================

WalletSchema.methods.creditBalance = async function (
  amount: number
): Promise<IWallet> {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  this.balance += amount;
  this.availableBalance += amount;

  return this.save();
};

// ======================================================
// DEBIT CASH BALANCE
// ======================================================

WalletSchema.methods.debitBalance = async function (
  amount: number
): Promise<IWallet> {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  if (this.availableBalance < amount) {
    throw new Error("Insufficient Wallet balance.");
  }

  this.balance -= amount;
  this.availableBalance -= amount;

  return this.save();
};

// ======================================================
// ADD GOLD TO Wallet
// ======================================================

WalletSchema.methods.creditGold = async function (
  grams: number,
  pricePerGram: number
): Promise<IWallet> {
  if (grams <= 0) {
    throw new Error("Gold amount must be greater than zero.");
  }

  const previousValue =
    this.averageGoldbuyPrice * this.goldBalance;

  this.goldBalance += grams;
  this.availableGoldBalance += grams;

  const newInvestment = previousValue + grams * pricePerGram;

  this.averageGoldbuyPrice =
    this.goldBalance === 0
      ? 0
      : Number((newInvestment / this.goldBalance).toFixed(2));

  this.totalGoldBought += grams;

  return this.save();
};

// ======================================================
// REMOVE GOLD FROM Wallet
// ======================================================

WalletSchema.methods.debitGold = async function (
  grams: number
): Promise<IWallet> {
  if (grams <= 0) {
    throw new Error("Gold amount must be greater than zero.");
  }

  if (this.availableGoldBalance < grams) {
    throw new Error("Insufficient gold balance.");
  }

  this.goldBalance -= grams;
  this.availableGoldBalance -= grams;
  this.totalGoldSold += grams;

  return this.save();
};

// ======================================================
// LOCK CASH BALANCE
// ======================================================

WalletSchema.methods.lockBalance = async function (
  amount: number
): Promise<IWallet> {
  if (this.availableBalance < amount) {
    throw new Error("Insufficient available balance.");
  }

  this.availableBalance -= amount;
  this.lockedBalance += amount;

  return this.save();
};

// ======================================================
// UNLOCK CASH BALANCE
// ======================================================

WalletSchema.methods.unlockBalance = async function (
  amount: number
): Promise<IWallet> {
  if (this.lockedBalance < amount) {
    throw new Error("Locked balance is insufficient.");
  }

  this.lockedBalance -= amount;
  this.availableBalance += amount;

  return this.save();
};

// ======================================================
// LOCK GOLD BALANCE
// ======================================================

WalletSchema.methods.lockGold = async function (
  grams: number
): Promise<IWallet> {
  if (this.availableGoldBalance < grams) {
    throw new Error("Insufficient available gold.");
  }

  this.availableGoldBalance -= grams;
  this.lockedGoldBalance += grams;

  return this.save();
};

// ======================================================
// UNLOCK GOLD BALANCE
// ======================================================

WalletSchema.methods.unlockGold = async function (
  grams: number
): Promise<IWallet> {
  if (this.lockedGoldBalance < grams) {
    throw new Error("Locked gold balance is insufficient.");
  }

  this.lockedGoldBalance -= grams;
  this.availableGoldBalance += grams;

  return this.save();
};

// ======================================================
// RECORD TRANSACTION
// ======================================================

WalletSchema.methods.recordTransaction = async function ({
  transactionId,
  type,
  status,
  amount,
  goldAmount = 0,
  goldPrice = 0,
  description = "",
  referenceId = "",
  paymentMethod = "SYSTEM",
  approvedBy,
}: {
  transactionId: string;
  type: WalletTransactionType;
  status: WalletTransactionStatus;
  amount: number;
  goldAmount?: number;
  goldPrice?: number;
  description?: string;
  referenceId?: string;
  paymentMethod?: string;
  approvedBy?: mongoose.Types.ObjectId;
}) {
  this.transactionhistory.unshift({
    transactionId,
    type,
    status,
    amount,
    goldAmount,
    goldPrice,
    balanceBefore: this.balance,
    balanceAfter: this.balance,
    goldBalanceBefore: this.goldBalance,
    goldBalanceAfter: this.goldBalance,
    fee: 0,
    description,
    referenceId,
    paymentMethod,
    source: "SYSTEM",
    approvedBy,
    ipAddress: "",
    device: "",
    createdAt: new Date(),
  });

  this.totalTransactions += 1;
  this.lastTransactionDate = new Date();

  if (status === WalletTransactionStatus.COMPLETED) {
    this.successfulTransactions += 1;
  }

  if (status === WalletTransactionStatus.FAILED) {
    this.failedTransactions += 1;
  }

  if (status === WalletTransactionStatus.CANCELLED) {
    this.cancelledTransactions += 1;
  }

  this.lastTransaction = {
    transactionId,
    type,
    amount,
    createdAt: new Date(),
  };

  if (this.transactionhistory.length > 100) {
    this.transactionhistory = this.transactionhistory.slice(0, 100);
  }

  return this.save();
};

// ======================================================
// UPDATE CURRENT GOLD MARKET VALUE
// ======================================================

WalletSchema.methods.updateGoldMarketValue = async function (
  currentPricePerGram: number
): Promise<IWallet> {
  this.currentGoldValue = Number(
    (this.goldBalance * currentPricePerGram).toFixed(2)
  );

  this.holdings.currentMarketPrice = currentPricePerGram;
  this.holdings.marketValue = this.currentGoldValue;

  this.portfolio.currentValue =
    this.currentGoldValue + this.balance;

  this.portfolio.unrealizedProfit = Number(
    (
      this.currentGoldValue -
      this.goldBalance * this.averageGoldbuyPrice
    ).toFixed(2)
  );

  this.portfolio.lifetimeProfit =
    this.portfolio.realizedProfit +
    this.portfolio.unrealizedProfit;

  return this.save();
};

// ======================================================
// FREEZE / UNFREEZE Wallet
// ======================================================

WalletSchema.methods.freezeWallet = async function (
  reason: string
): Promise<IWallet> {
  this.status = WalletStatus.FROZEN;
  this.security.WalletFrozen = true;
  this.security.withdrawalLocked = true;
  this.security.tradingLocked = true;

  this.riskControl.manualReviewRequired = true;
  this.riskControl.blockedReason = reason;
  this.riskControl.blockedAt = new Date();

  return this.save();
};

WalletSchema.methods.unfreezeWallet = async function (): Promise<IWallet> {
  this.status = WalletStatus.ACTIVE;
  this.security.WalletFrozen = false;
  this.security.withdrawalLocked = false;
  this.security.tradingLocked = false;

  this.riskControl.manualReviewRequired = false;
  this.riskControl.blockedReason = "";
  this.riskControl.blockedAt = undefined;

  return this.save();
};

// ======================================================
// END OF SECTION 8/10
// NEXT SECTION: PRE-SAVE HOOKS
// ======================================================// ======================================================
// GoldTrade V17 ENTERPRISE
// FILE: backend/src/models/Wallet.ts
// SECTION 9/10
// PRE-SAVE HOOKS + AUTO CALCULATIONS
// ======================================================

// ======================================================
// AUTO GENERATE Wallet NUMBER
// Format: GTW-2026-8F4A9C21
// ======================================================

WalletSchema.pre<IWallet>("save", function (next) {
  if (!this.WalletNumber) {
    const random = Math.random()
      .toString(16)
      .substring(2, 10)
      .toUpperCase();

    const year = new Date().getFullYear();

    this.WalletNumber = `GTW-${year}-${random}`;
  }

  next();
});

// ======================================================
// UPDATE AVAILABLE CASH BALANCE
// ======================================================

WalletSchema.pre<IWallet>("save", function (next) {
  this.availableBalance = Math.max(
    0,
    this.balance - this.lockedBalance - this.pendingBalance
  );

  next();
});

// ======================================================
// UPDATE AVAILABLE GOLD BALANCE
// ======================================================

WalletSchema.pre<IWallet>("save", function (next) {
  this.availableGoldBalance = Math.max(
    0,
    this.goldBalance -
      this.lockedGoldBalance -
      this.pendingGoldBalance
  );

  next();
});

// ======================================================
// AUTO CALCULATE PORTFOLIO VALUE
// ======================================================

WalletSchema.pre<IWallet>("save", function (next) {
  this.portfolio.currentValue =
    this.balance + this.currentGoldValue;

  this.portfolio.lifetimeProfit =
    this.portfolio.realizedProfit +
    this.portfolio.unrealizedProfit;

  next();
});

// ======================================================
// AUTO CALCULATE ROI
// ======================================================

WalletSchema.pre<IWallet>("save", function (next) {
  if (this.portfolio.totalInvestment > 0) {
    this.investmentSummary.roiPercentage = Number(
      (
        (this.portfolio.lifetimeProfit /
          this.portfolio.totalInvestment) *
        100
      ).toFixed(2)
    );
  } else {
    this.investmentSummary.roiPercentage = 0;
  }

  next();
});

// ======================================================
// UPDATE WIN RATE
// ======================================================

WalletSchema.pre<IWallet>("save", function (next) {
  const totalTrades =
    this.performance.profitableTrades +
    this.performance.lossTrades;

  if (totalTrades > 0) {
    this.performance.winRate = Number(
      (
        (this.performance.profitableTrades /
          totalTrades) *
        100
      ).toFixed(2)
    );
  } else {
    this.performance.winRate = 0;
  }

  next();
});

// ======================================================
// RESET DAILY LIMIT USAGE
// ======================================================

WalletSchema.pre<IWallet>("save", function (next) {
  const now = new Date();
  const lastReset = new Date(this.usage.lastResetDate);

  const isNewDay =
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getDate() !== lastReset.getDate();

  if (isNewDay) {
    this.usage.todayDeposited = 0;
    this.usage.todayWithdrawn = 0;
    this.usage.todayTraded = 0;

    this.portfolio.dailyProfit = 0;

    this.usage.lastResetDate = now;
  }

  next();
});

// ======================================================
// RESET MONTHLY LIMIT USAGE
// ======================================================

WalletSchema.pre<IWallet>("save", function (next) {
  const now = new Date();
  const lastReset = new Date(this.usage.lastResetDate);

  const isNewMonth =
    now.getFullYear() !== lastReset.getFullYear() ||
    now.getMonth() !== lastReset.getMonth();

  if (isNewMonth) {
    this.usage.monthlyDeposited = 0;
    this.usage.monthlyWithdrawn = 0;
    this.usage.monthlyTraded = 0;

    this.portfolio.monthlyProfit = 0;
  }

  next();
});

// ======================================================
// UPDATE SECURITY TIMESTAMP
// ======================================================

WalletSchema.pre<IWallet>("save", function (next) {
  this.security.lastUpdatedAt = new Date();
  next();
});

// ======================================================
// KEEP TRANSACTION history LIMITED
// ======================================================

WalletSchema.pre<IWallet>("save", function (next) {
  if (this.transactionhistory.length > 1000) {
    this.transactionhistory =
      this.transactionhistory.slice(0, 1000);
  }

  if (this.audithistory.length > 500) {
    this.audithistory =
      this.audithistory.slice(0, 500);
  }

  next();
});

// ======================================================
// END OF SECTION 9/10
// NEXT SECTION: MODEL EXPORT + FINAL SCHEMA
// ======================================================// ======================================================
// GoldTrade V17 ENTERPRISE
// FILE: backend/src/models/Wallet.ts
// SECTION 10/10
// FINAL SCHEMA OPTIONS + MODEL EXPORT
// ======================================================

// ======================================================
// SCHEMA OPTIONS
// ======================================================

WalletSchema.set("timestamps", true);

WalletSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.security?.transactionPin;
    return ret;
  },
});

WalletSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
});

// ======================================================
// STATIC METHODS INTERFACE
// ======================================================

export interface IWalletModel extends Model<IWallet> {
  findByWalletNumber(WalletNumber: string): Promise<IWallet | null>;

  findActiveWallet(userId: mongoose.Types.ObjectId): Promise<IWallet | null>;
}

// ======================================================
// STATIC METHODS
// ======================================================

WalletSchema.statics.findByWalletNumber = function (
  WalletNumber: string
) {
  return this.findOne({
    WalletNumber: WalletNumber.toUpperCase(),
  });
};

WalletSchema.statics.findActiveWallet = function (
  userId: mongoose.Types.ObjectId
) {
  return this.findOne({
    user: userId,
    status: WalletStatus.ACTIVE,
  });
};

// ======================================================
// INSTANCE METHODS TYPES
// ======================================================

export interface IWalletMethods {
  creditBalance(amount: number): Promise<IWallet>;

  debitBalance(amount: number): Promise<IWallet>;

  creditGold(grams: number, pricePerGram: number): Promise<IWallet>;

  debitGold(grams: number): Promise<IWallet>;

  lockBalance(amount: number): Promise<IWallet>;

  unlockBalance(amount: number): Promise<IWallet>;

  lockGold(grams: number): Promise<IWallet>;

  unlockGold(grams: number): Promise<IWallet>;

  recordTransaction(data: unknown): Promise<IWallet>;

  updateGoldMarketValue(pricePerGram: number): Promise<IWallet>;

  freezeWallet(reason: string): Promise<IWallet>;

  unfreezeWallet(): Promise<IWallet>;
}

// ======================================================
// CREATE MODEL
// ======================================================

const Wallet =
  (mongoose.models.Wallet as IWalletModel) ||
  mongoose.model<IWallet, IWalletModel>(
    "Wallet",
    WalletSchema
  );

// ======================================================
// EXPORT MODEL
// ======================================================

export default Wallet;

// ======================================================
// END OF FILE
// backend/src/models/Wallet.ts
// GoldTrade V17 ENTERPRISE Wallet MODEL COMPLETE
// ======================================================