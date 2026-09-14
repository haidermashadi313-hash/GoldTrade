import mongoose, { Document, Model, Schema } from "mongoose";

export enum PortfolioStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  CLOSED = "CLOSED",
}

export enum PortfolioType {
  INDIVIDUAL = "INDIVIDUAL",
  BUSINESS = "BUSINESS",
  FAMILY = "FAMILY",
  VIP = "VIP",
}

export enum GoldPurity {
  GOLD_24K = "24K",
  GOLD_22K = "22K",
  GOLD_21K = "21K",
  GOLD_18K = "18K",
}

export enum VaultHoldingType {
  DIGITAL = "DIGITAL",
  PHYSICAL = "PHYSICAL",
  HYBRID = "HYBRID",
}

export interface IGoldHolding {
  purity: GoldPurity;
  vaultType: VaultHoldingType;
  grams: number;
  averageBuyPricePKR: number;
  averageBuyPriceUSD: number;
  marketPricePKR: number;
  marketValuePKR: number;
  profitLossPKR: number;
  roiPercentage: number;
  updatedAt: Date;
}

export interface ICashBalances {
  PKR: number;
  USD: number;
  AED: number;
  SAR: number;
  EUR: number;
  GBP: number;
  USDT: number;
}

export interface IGoldBalances {
  totalGrams: number;
  availableGrams: number;
  lockedGrams: number;
  pendingSettlementGrams: number;
  reservedGrams: number;
  stakedGrams: number;
  savingsGrams: number;
}

export interface IRewardBalance {
  cashbackGoldGram: number;
  loyaltyGoldGram: number;
  referralGoldGram: number;
  rewardPKR: number;
  loyaltyPoints: number;
}

export interface ILinkedAccounts {
  wallet?: mongoose.Types.ObjectId;
  goldVaults: mongoose.Types.ObjectId[];
  bankAccounts: mongoose.Types.ObjectId[];
  tradeOrders: mongoose.Types.ObjectId[];
  transactions: mongoose.Types.ObjectId[];
}

export interface IPortfolio extends Document {
  user: mongoose.Types.ObjectId;
  portfolioNumber: string;
  portfolioName: string;
  portfolioType: PortfolioType;
  status: PortfolioStatus;
  isPrimaryPortfolio: boolean;
  holdings: IGoldHolding[];
  cashBalances: ICashBalances;
  goldBalances: IGoldBalances;
  rewardBalance: IRewardBalance;
  linkedAccounts: ILinkedAccounts;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface IPortfolioMethods {
  calculateGoldBalances(): number;
  calculatePortfolioValue(): number;
  calculateROI(): void;
  calculateDailyPerformance(): void;
  calculateAllocation(): void;
  calculateRisk(): void;
  updateHealthSummary(): void;
  updateDashboardSummary(): void;
  createDailySnapshot(): void;
  syncReferences(data: {
    walletId?: mongoose.Types.ObjectId;
    vaultIds?: mongoose.Types.ObjectId[];
    bankIds?: mongoose.Types.ObjectId[];
  }): void;
}

export interface IPortfolioModel extends Model<IPortfolio> {
  findUserPortfolio(userId: mongoose.Types.ObjectId): Promise<IPortfolio | null>;
  findActivePortfolios(): Promise<IPortfolio[]>;
  findVIPPortfolios(): Promise<IPortfolio[]>;
  findTopInvestors(limit?: number): Promise<IPortfolio[]>;
  findHighNetWorthPortfolios(minPKR?: number): Promise<IPortfolio[]>;
  findRiskyPortfolios(): Promise<IPortfolio[]>;
  findRebalanceRequiredPortfolios(): Promise<IPortfolio[]>;
  findPortfoliosByInvestorGrade(grade: string): Promise<IPortfolio[]>;
  findTopReferralPortfolios(limit?: number): Promise<IPortfolio[]>;
  findTopCashbackPortfolios(limit?: number): Promise<IPortfolio[]>;
  findTodayUpdatedPortfolios(): Promise<IPortfolio[]>;
}

const holdingSchema = new Schema<IGoldHolding>(
  {
    purity: { type: String, enum: Object.values(GoldPurity), required: true },
    vaultType: { type: String, enum: Object.values(VaultHoldingType), required: true },
    grams: { type: Number, default: 0 },
    averageBuyPricePKR: { type: Number, default: 0 },
    averageBuyPriceUSD: { type: Number, default: 0 },
    marketPricePKR: { type: Number, default: 0 },
    marketValuePKR: { type: Number, default: 0 },
    profitLossPKR: { type: Number, default: 0 },
    roiPercentage: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const PortfolioSchema = new Schema<IPortfolio, IPortfolioModel, IPortfolioMethods>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    portfolioNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    portfolioName: { type: String, default: "Primary Portfolio", trim: true, maxlength: 100 },
    portfolioType: { type: String, enum: Object.values(PortfolioType), default: PortfolioType.INDIVIDUAL, index: true },
    status: { type: String, enum: Object.values(PortfolioStatus), default: PortfolioStatus.ACTIVE, index: true },
    isPrimaryPortfolio: { type: Boolean, default: true },
    holdings: { type: [holdingSchema], default: [] },

    cashBalances: {
      PKR: { type: Number, default: 0 },
      USD: { type: Number, default: 0 },
      AED: { type: Number, default: 0 },
      SAR: { type: Number, default: 0 },
      EUR: { type: Number, default: 0 },
      GBP: { type: Number, default: 0 },
      USDT: { type: Number, default: 0 },
    },

    goldBalances: {
      totalGrams: { type: Number, default: 0 },
      availableGrams: { type: Number, default: 0 },
      lockedGrams: { type: Number, default: 0 },
      pendingSettlementGrams: { type: Number, default: 0 },
      reservedGrams: { type: Number, default: 0 },
      stakedGrams: { type: Number, default: 0 },
      savingsGrams: { type: Number, default: 0 },
    },

    rewardBalance: {
      cashbackGoldGram: { type: Number, default: 0 },
      loyaltyGoldGram: { type: Number, default: 0 },
      referralGoldGram: { type: Number, default: 0 },
      rewardPKR: { type: Number, default: 0 },
      loyaltyPoints: { type: Number, default: 0 },
    },

    linkedAccounts: {
      wallet: { type: Schema.Types.ObjectId, ref: "Wallet" },
      goldVaults: [{ type: Schema.Types.ObjectId, ref: "GoldVault" }],
      bankAccounts: [{ type: Schema.Types.ObjectId, ref: "BankAccount" }],
      tradeOrders: [{ type: Schema.Types.ObjectId, ref: "TradeOrder" }],
      transactions: [{ type: Schema.Types.ObjectId, ref: "Transaction" }],
    },

    assetClassAllocation: {
      goldAssetsPKR: { type: Number, default: 0 },
      cashAssetsPKR: { type: Number, default: 0 },
      cryptoAssetsPKR: { type: Number, default: 0 },
      rewardAssetsPKR: { type: Number, default: 0 },
      goldPercentage: { type: Number, default: 0 },
      cashPercentage: { type: Number, default: 0 },
      cryptoPercentage: { type: Number, default: 0 },
      rewardPercentage: { type: Number, default: 0 },
    },

    diversification: {
      diversificationScore: { type: Number, default: 0 },
      concentrationRiskPercent: { type: Number, default: 0 },
    },

    cryptoAllocation: {
      totalCryptoValuePKR: { type: Number, default: 0 },
      totalCryptoPercentage: { type: Number, default: 0 },
    },

    portfolioValuation: {
      totalValuePKR: { type: Number, default: 0 },
      totalValueUSD: { type: Number, default: 0 },
    },

    goldValuation: {
      totalGoldValuePKR: { type: Number, default: 0 },
      totalGoldValueUSD: { type: Number, default: 0 },
      totalGoldGrams: { type: Number, default: 0 },
      digitalGoldValuePKR: { type: Number, default: 0 },
      physicalGoldValuePKR: { type: Number, default: 0 },
      hybridGoldValuePKR: { type: Number, default: 0 },
    },

    cashValuation: {
      totalCashPKR: { type: Number, default: 0 },
      totalCashUSD: { type: Number, default: 0 },
    },

    rewardValuation: {
      rewardValuePKR: { type: Number, default: 0 },
      cashbackValuePKR: { type: Number, default: 0 },
      loyaltyValuePKR: { type: Number, default: 0 },
      referralValuePKR: { type: Number, default: 0 },
    },

    dailyPerformance: {
      todayOpenValuePKR: { type: Number, default: 0 },
      currentValuePKR: { type: Number, default: 0 },
      gainLossPKR: { type: Number, default: 0 },
      gainLossPercent: { type: Number, default: 0 },
      updatedAt: { type: Date },
    },

    wealthSummary: {
      netWorthPKR: { type: Number, default: 0 },
      investableAssetsPKR: { type: Number, default: 0 },
      liquidAssetsPKR: { type: Number, default: 0 },
      lockedAssetsPKR: { type: Number, default: 0 },
      rewardAssetsPKR: { type: Number, default: 0 },
      wealthRankScore: { type: Number, default: 0 },
    },

    investmentSummary: {
      totalInvestmentPKR: { type: Number, default: 0 },
      totalInvestmentUSD: { type: Number, default: 0 },
      totalGoldPurchasedGram: { type: Number, default: 0 },
      totalGoldSoldGram: { type: Number, default: 0 },
      averageBuyPricePKR: { type: Number, default: 0 },
      averageSellPricePKR: { type: Number, default: 0 },
      firstInvestmentDate: { type: Date },
      latestInvestmentDate: { type: Date },
    },

    profitLoss: {
      realizedProfitPKR: { type: Number, default: 0 },
      unrealizedProfitPKR: { type: Number, default: 0 },
      realizedProfitUSD: { type: Number, default: 0 },
      unrealizedProfitUSD: { type: Number, default: 0 },
      totalProfitPKR: { type: Number, default: 0 },
      totalLossPKR: { type: Number, default: 0 },
      netProfitPKR: { type: Number, default: 0 },
      updatedAt: { type: Date },
    },

    roiAnalytics: {
      roiPercentage: { type: Number, default: 0 },
      roiAmountPKR: { type: Number, default: 0 },
      roiAmountUSD: { type: Number, default: 0 },
      annualizedROI: { type: Number, default: 0 },
      monthlyROI: { type: Number, default: 0 },
      weeklyROI: { type: Number, default: 0 },
      dailyROI: { type: Number, default: 0 },
    },

    tradeAnalytics: {
      totalTrades: { type: Number, default: 0 },
      winningTrades: { type: Number, default: 0 },
      losingTrades: { type: Number, default: 0 },
      winRatePercent: { type: Number, default: 0 },
      lossRatePercent: { type: Number, default: 0 },
      averageProfitPerTradePKR: { type: Number, default: 0 },
      averageLossPerTradePKR: { type: Number, default: 0 },
    },

    investorGrade: {
      grade: {
        type: String,
        enum: ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "BLACK_DIAMOND"],
        default: "BRONZE",
      },
      gradeScore: { type: Number, default: 0 },
      nextGradeTarget: { type: String, default: "SILVER" },
      progressToNextGradePercent: { type: Number, default: 0 },
    },

    portfolioRisk: {
      overallRiskScore: { type: Number, default: 0, min: 0, max: 100 },
      riskLevel: {
        type: String,
        enum: ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
        default: "LOW",
      },
      healthScore: { type: Number, default: 100, min: 0, max: 100 },
      lastCalculatedAt: { type: Date },
    },

    investmentHealth: {
      overallHealth: {
        type: String,
        enum: ["EXCELLENT", "GOOD", "AVERAGE", "POOR", "CRITICAL"],
        default: "GOOD",
      },
      diversificationHealth: { type: Number, default: 0 },
      liquidityHealth: { type: Number, default: 0 },
      profitabilityHealth: { type: Number, default: 0 },
      volatilityHealth: { type: Number, default: 0 },
      aiScore: { type: Number, default: 0 },
      recommendationSummary: { type: String, default: "" },
    },

    autoRebalancing: {
      enabled: { type: Boolean, default: false },
      strategy: {
        type: String,
        enum: ["CONSERVATIVE", "BALANCED", "AGGRESSIVE", "CUSTOM"],
        default: "BALANCED",
      },
      thresholdPercent: { type: Number, default: 5 },
      rebalanceRequired: { type: Boolean, default: false },
      recommendedBuyGoldGram: { type: Number, default: 0 },
      recommendedSellGoldGram: { type: Number, default: 0 },
      estimatedRebalanceCostPKR: { type: Number, default: 0 },
      nextRebalanceDate: { type: Date },
      lastRebalancedAt: { type: Date },
    },

    dashboardSummary: {
      totalNetWorthPKR: { type: Number, default: 0 },
      todayProfitPKR: { type: Number, default: 0 },
      todayProfitPercent: { type: Number, default: 0 },
      monthlyProfitPKR: { type: Number, default: 0 },
      yearlyProfitPKR: { type: Number, default: 0 },
      availableGoldGram: { type: Number, default: 0 },
      availableCashPKR: { type: Number, default: 0 },
      updatedAt: { type: Date },
    },

    referralAnalytics: {
      totalReferrals: { type: Number, default: 0 },
      activeReferrals: { type: Number, default: 0 },
      referralIncomePKR: { type: Number, default: 0 },
      referralGoldGram: { type: Number, default: 0 },
      referralRank: { type: Number, default: 0 },
    },

    cashbackAnalytics: {
      totalCashbackPKR: { type: Number, default: 0 },
      totalCashbackGoldGram: { type: Number, default: 0 },
      monthlyCashbackPKR: { type: Number, default: 0 },
      yearlyCashbackPKR: { type: Number, default: 0 },
    },

    vipAnalytics: {
      vipLevel: {
        type: String,
        enum: ["STANDARD", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "BLACK"],
        default: "STANDARD",
      },
      totalFeeSavedPKR: { type: Number, default: 0 },
      vipBenefitsUsed: { type: Number, default: 0 },
      nextVIPTargetVolumePKR: { type: Number, default: 0 },
    },

    leaderboard: {
      portfolioRank: { type: Number, default: 0 },
      roiRank: { type: Number, default: 0 },
      referralRank: { type: Number, default: 0 },
      cashbackRank: { type: Number, default: 0 },
      wealthRank: { type: Number, default: 0 },
      investorScoreRank: { type: Number, default: 0 },
    },

    dailySnapshots: { type: [Schema.Types.Mixed], default: [] },
    weeklySnapshots: { type: [Schema.Types.Mixed], default: [] },
    monthlySnapshots: { type: [Schema.Types.Mixed], default: [] },
    yearlySnapshots: { type: [Schema.Types.Mixed], default: [] },
    performanceTimeline: { type: [Schema.Types.Mixed], default: [] },
    valuationHistory: { type: [Schema.Types.Mixed], default: [] },
    achievements: { type: [Schema.Types.Mixed], default: [] },
    riskAlerts: { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

PortfolioSchema.index({ user: 1 }, { unique: true });
PortfolioSchema.index({ portfolioNumber: 1 }, { unique: true });
PortfolioSchema.index({ status: 1 });
PortfolioSchema.index({ portfolioType: 1 });
PortfolioSchema.index({ createdAt: -1 });
PortfolioSchema.index({ "holdings.purity": 1, "holdings.vaultType": 1 });
PortfolioSchema.index({ "goldBalances.totalGrams": -1 });
PortfolioSchema.index({ "portfolioValuation.totalValuePKR": -1 });
PortfolioSchema.index({ "profitLoss.netProfitPKR": -1 });
PortfolioSchema.index({ "roiAnalytics.roiPercentage": -1 });
PortfolioSchema.index({ "investorGrade.grade": 1 });
PortfolioSchema.index({ "rewardBalance.loyaltyPoints": -1 });
PortfolioSchema.index({ "referralAnalytics.totalReferrals": -1 });

PortfolioSchema.virtual("netWorth").get(function (this: any) {
  return this.portfolioValuation?.totalValuePKR || 0;
});

PortfolioSchema.virtual("todayProfit").get(function (this: any) {
  return this.dailyPerformance?.gainLossPKR || 0;
});

PortfolioSchema.virtual("todayProfitPercent").get(function (this: any) {
  return this.dailyPerformance?.gainLossPercent || 0;
});

PortfolioSchema.virtual("totalGoldWeight").get(function (this: any) {
  return this.goldBalances?.totalGrams || 0;
});

PortfolioSchema.virtual("availableGoldWeight").get(function (this: any) {
  return this.goldBalances?.availableGrams || 0;
});

PortfolioSchema.virtual("lockedGoldWeight").get(function (this: any) {
  return this.goldBalances?.lockedGrams || 0;
});

PortfolioSchema.virtual("rewardValue").get(function (this: any) {
  return this.rewardValuation?.rewardValuePKR || 0;
});

PortfolioSchema.virtual("cashValue").get(function (this: any) {
  return this.cashValuation?.totalCashPKR || 0;
});

PortfolioSchema.virtual("cryptoValue").get(function (this: any) {
  return this.cryptoAllocation?.totalCryptoValuePKR || 0;
});

PortfolioSchema.virtual("roi").get(function (this: any) {
  return this.roiAnalytics?.roiPercentage || 0;
});

PortfolioSchema.virtual("netProfit").get(function (this: any) {
  return this.profitLoss?.netProfitPKR || 0;
});

PortfolioSchema.virtual("portfolioCompletion").get(function (this: any) {
  let completed = 0;
  if ((this.goldBalances?.totalGrams || 0) > 0) completed += 25;
  if ((this.cashValuation?.totalCashPKR || 0) > 0) completed += 20;
  if (this.linkedAccounts?.wallet) completed += 15;
  if ((this.linkedAccounts?.bankAccounts?.length || 0) > 0) completed += 15;
  if ((this.linkedAccounts?.goldVaults?.length || 0) > 0) completed += 15;
  if ((this.tradeAnalytics?.totalTrades || 0) > 0) completed += 10;
  return Math.min(completed, 100);
});

PortfolioSchema.virtual("allocationSummary").get(function (this: any) {
  return {
    gold: this.assetClassAllocation?.goldPercentage || 0,
    cash: this.assetClassAllocation?.cashPercentage || 0,
    crypto: this.assetClassAllocation?.cryptoPercentage || 0,
    rewards: this.assetClassAllocation?.rewardPercentage || 0,
  };
});

PortfolioSchema.virtual("healthSummary").get(function (this: any) {
  return {
    score: this.portfolioRisk?.healthScore || 0,
    level: this.portfolioRisk?.riskLevel || "LOW",
    diversification: this.diversification?.diversificationScore || 0,
    aiHealth: this.investmentHealth?.overallHealth || "GOOD",
  };
});

PortfolioSchema.virtual("investorBadge").get(function (this: any) {
  return {
    grade: this.investorGrade?.grade || "BRONZE",
    score: this.investorGrade?.gradeScore || 0,
    nextGrade: this.investorGrade?.nextGradeTarget || "SILVER",
    progress: this.investorGrade?.progressToNextGradePercent || 0,
  };
});

PortfolioSchema.virtual("dashboardCards").get(function (this: any) {
  return {
    netWorth: this.portfolioValuation?.totalValuePKR || 0,
    todayProfit: this.dailyPerformance?.gainLossPKR || 0,
    roi: this.roiAnalytics?.roiPercentage || 0,
    goldGram: this.goldBalances?.totalGrams || 0,
    rewards: this.rewardValuation?.rewardValuePKR || 0,
    riskScore: this.portfolioRisk?.overallRiskScore || 0,
  };
});

PortfolioSchema.virtual("quickStats").get(function (this: any) {
  return {
    totalTrades: this.tradeAnalytics?.totalTrades || 0,
    referrals: this.referralAnalytics?.totalReferrals || 0,
    loyaltyPoints: this.rewardBalance?.loyaltyPoints || 0,
    vipLevel: this.vipAnalytics?.vipLevel || "STANDARD",
    portfolioRank: this.leaderboard?.portfolioRank || 0,
  };
});

PortfolioSchema.set("toJSON", { virtuals: true, versionKey: false });
PortfolioSchema.set("toObject", { virtuals: true, versionKey: false });

const generatePortfolioSuffix = () => {
  const a = Math.random().toString(16).slice(2, 7).toUpperCase();
  const b = Math.random().toString(16).slice(2, 7).toUpperCase();
  return `${a}${b}`;
};

PortfolioSchema.pre<IPortfolio>("save", function (next) {
  if (!this.portfolioNumber) {
    const year = new Date().getFullYear();
    const random = generatePortfolioSuffix();
    this.portfolioNumber = `GTPORT-${year}-${random}`;
  }
  next();
});

PortfolioSchema.methods.calculateGoldBalances = function () {
  const holdings = Array.isArray(this.holdings) ? this.holdings : [];
  const total = holdings.reduce((sum: number, holding: any) => sum + (holding?.grams || 0), 0);

  this.goldBalances.totalGrams = Number(total.toFixed(3));
  if (this.goldBalances.availableGrams > total) {
    this.goldBalances.availableGrams = total;
  }

  return total;
};

PortfolioSchema.methods.calculatePortfolioValue = function () {
  const gold = this.goldValuation.totalGoldValuePKR || 0;
  const cash = this.cashValuation.totalCashPKR || 0;
  const cryptoValue = this.cryptoAllocation.totalCryptoValuePKR || 0;
  const reward = this.rewardValuation.rewardValuePKR || 0;

  const total = gold + cash + cryptoValue + reward;
  this.portfolioValuation.totalValuePKR = Number(total.toFixed(2));
  this.wealthSummary.netWorthPKR = total;

  return total;
};

PortfolioSchema.methods.calculateROI = function () {
  const invested = this.investmentSummary.totalInvestmentPKR || 0;
  const current = this.portfolioValuation.totalValuePKR || 0;

  if (invested <= 0) {
    this.roiAnalytics.roiPercentage = 0;
    this.roiAnalytics.roiAmountPKR = 0;
    return;
  }

  const roi = ((current - invested) / invested) * 100;
  this.roiAnalytics.roiPercentage = Number(roi.toFixed(2));
  this.roiAnalytics.roiAmountPKR = Number((current - invested).toFixed(2));
};

PortfolioSchema.methods.calculateDailyPerformance = function () {
  const open = this.dailyPerformance.todayOpenValuePKR || 0;
  const current = this.portfolioValuation.totalValuePKR || 0;
  const pnl = current - open;

  this.dailyPerformance.currentValuePKR = current;
  this.dailyPerformance.gainLossPKR = Number(pnl.toFixed(2));

  if (open > 0) {
    this.dailyPerformance.gainLossPercent = Number(((pnl / open) * 100).toFixed(2));
  } else {
    this.dailyPerformance.gainLossPercent = 0;
  }

  this.dailyPerformance.updatedAt = new Date();
};

PortfolioSchema.methods.calculateAllocation = function () {
  const total = this.portfolioValuation.totalValuePKR || 1;
  const gold = this.goldValuation.totalGoldValuePKR || 0;
  const cash = this.cashValuation.totalCashPKR || 0;
  const cryptoValue = this.cryptoAllocation.totalCryptoValuePKR || 0;
  const rewards = this.rewardValuation.rewardValuePKR || 0;

  this.assetClassAllocation.goldPercentage = Number(((gold / total) * 100).toFixed(2));
  this.assetClassAllocation.cashPercentage = Number(((cash / total) * 100).toFixed(2));
  this.assetClassAllocation.cryptoPercentage = Number(((cryptoValue / total) * 100).toFixed(2));
  this.assetClassAllocation.rewardPercentage = Number(((rewards / total) * 100).toFixed(2));
};

PortfolioSchema.methods.calculateRisk = function () {
  let score = 100;

  if (this.assetClassAllocation.goldPercentage > 85) score -= 20;
  if (this.assetClassAllocation.cryptoPercentage > 20) score -= 20;
  if ((this.diversification.concentrationRiskPercent || 0) > 60) score -= 15;
  if (this.goldBalances.lockedGrams > this.goldBalances.availableGrams) score -= 10;

  score = Math.max(score, 0);
  this.portfolioRisk.healthScore = score;
  this.portfolioRisk.overallRiskScore = 100 - score;

  if (score >= 90) this.portfolioRisk.riskLevel = "VERY_LOW";
  else if (score >= 75) this.portfolioRisk.riskLevel = "LOW";
  else if (score >= 60) this.portfolioRisk.riskLevel = "MEDIUM";
  else if (score >= 40) this.portfolioRisk.riskLevel = "HIGH";
  else this.portfolioRisk.riskLevel = "VERY_HIGH";

  this.portfolioRisk.lastCalculatedAt = new Date();
};

PortfolioSchema.methods.updateHealthSummary = function () {
  const score = this.portfolioRisk.healthScore || 0;

  if (score >= 90) this.investmentHealth.overallHealth = "EXCELLENT";
  else if (score >= 75) this.investmentHealth.overallHealth = "GOOD";
  else if (score >= 60) this.investmentHealth.overallHealth = "AVERAGE";
  else if (score >= 40) this.investmentHealth.overallHealth = "POOR";
  else this.investmentHealth.overallHealth = "CRITICAL";

  this.investmentHealth.aiScore = score;
};

PortfolioSchema.methods.updateDashboardSummary = function () {
  this.dashboardSummary.totalNetWorthPKR = this.portfolioValuation.totalValuePKR || 0;
  this.dashboardSummary.todayProfitPKR = this.dailyPerformance.gainLossPKR || 0;
  this.dashboardSummary.todayProfitPercent = this.dailyPerformance.gainLossPercent || 0;
  this.dashboardSummary.availableGoldGram = this.goldBalances.availableGrams || 0;
  this.dashboardSummary.availableCashPKR = this.cashValuation.totalCashPKR || 0;
  this.dashboardSummary.updatedAt = new Date();
};

PortfolioSchema.methods.createDailySnapshot = function () {
  this.dailySnapshots.unshift({
    snapshotDate: new Date(),
    portfolioValuePKR: this.portfolioValuation.totalValuePKR || 0,
    portfolioValueUSD: this.portfolioValuation.totalValueUSD || 0,
    goldValuePKR: this.goldValuation.totalGoldValuePKR || 0,
    cashValuePKR: this.cashValuation.totalCashPKR || 0,
    cryptoValuePKR: this.cryptoAllocation.totalCryptoValuePKR || 0,
    rewardValuePKR: this.rewardValuation.rewardValuePKR || 0,
    gainLossPKR: this.dailyPerformance.gainLossPKR || 0,
    gainLossPercent: this.dailyPerformance.gainLossPercent || 0,
    totalGoldGram: this.goldBalances.totalGrams || 0,
  });

  this.dailySnapshots = this.dailySnapshots.slice(0, 365);
};

PortfolioSchema.methods.syncReferences = function ({ walletId, vaultIds, bankIds }: any) {
  if (walletId) this.linkedAccounts.wallet = walletId;
  if (vaultIds) this.linkedAccounts.goldVaults = vaultIds;
  if (bankIds) this.linkedAccounts.bankAccounts = bankIds;
};

PortfolioSchema.pre<IPortfolio>("save", function (next) {
  this.calculateGoldBalances();
  this.calculatePortfolioValue();
  this.calculateROI();
  this.calculateDailyPerformance();
  this.calculateAllocation();
  this.calculateRisk();
  this.updateHealthSummary();
  this.updateDashboardSummary();
  this.createDailySnapshot();
  next();
});

PortfolioSchema.pre<IPortfolio>("save", function (next) {
  if (this.portfolioNumber) this.portfolioNumber = this.portfolioNumber.toUpperCase();
  if (this.portfolioName) this.portfolioName = this.portfolioName.trim();
  next();
});

PortfolioSchema.pre<IPortfolio>("save", function (next) {
  if (this.dailySnapshots.length > 365) this.dailySnapshots = this.dailySnapshots.slice(0, 365);
  if (this.weeklySnapshots.length > 104) this.weeklySnapshots = this.weeklySnapshots.slice(0, 104);
  if (this.monthlySnapshots.length > 120) this.monthlySnapshots = this.monthlySnapshots.slice(0, 120);
  if (this.yearlySnapshots.length > 25) this.yearlySnapshots = this.yearlySnapshots.slice(0, 25);
  if (this.performanceTimeline.length > 1000) this.performanceTimeline = this.performanceTimeline.slice(0, 1000);
  if (this.valuationHistory.length > 1000) this.valuationHistory = this.valuationHistory.slice(0, 1000);
  if (this.achievements.length > 200) this.achievements = this.achievements.slice(0, 200);
  if (this.riskAlerts.length > 200) this.riskAlerts = this.riskAlerts.slice(0, 200);
  next();
});

PortfolioSchema.statics.findUserPortfolio = function (userId: mongoose.Types.ObjectId) {
  return this.findOne({ user: userId });
};

PortfolioSchema.statics.findActivePortfolios = function () {
  return this.find({ status: PortfolioStatus.ACTIVE }).sort({ updatedAt: -1 });
};

PortfolioSchema.statics.findVIPPortfolios = function () {
  return this.find({ portfolioType: PortfolioType.VIP }).sort({ "portfolioValuation.totalValuePKR": -1 });
};

PortfolioSchema.statics.findTopInvestors = function (limit = 50) {
  return this.find({ status: PortfolioStatus.ACTIVE })
    .sort({ "portfolioValuation.totalValuePKR": -1 })
    .limit(limit);
};

PortfolioSchema.statics.findHighNetWorthPortfolios = function (minPKR = 10000000) {
  return this.find({ "portfolioValuation.totalValuePKR": { $gte: minPKR } }).sort({
    "portfolioValuation.totalValuePKR": -1,
  });
};

PortfolioSchema.statics.findRiskyPortfolios = function () {
  return this.find({ "portfolioRisk.riskLevel": { $in: ["HIGH", "VERY_HIGH"] } }).sort({
    "portfolioRisk.overallRiskScore": -1,
  });
};

PortfolioSchema.statics.findRebalanceRequiredPortfolios = function () {
  return this.find({ "autoRebalancing.rebalanceRequired": true }).sort({ updatedAt: -1 });
};

PortfolioSchema.statics.findPortfoliosByInvestorGrade = function (grade: string) {
  return this.find({ "investorGrade.grade": grade }).sort({ "investorGrade.gradeScore": -1 });
};

PortfolioSchema.statics.findTopReferralPortfolios = function (limit = 25) {
  return this.find().sort({ "referralAnalytics.referralIncomePKR": -1 }).limit(limit);
};

PortfolioSchema.statics.findTopCashbackPortfolios = function (limit = 25) {
  return this.find().sort({ "cashbackAnalytics.totalCashbackPKR": -1 }).limit(limit);
};

PortfolioSchema.statics.findTodayUpdatedPortfolios = function () {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  return this.find({ updatedAt: { $gte: start } }).sort({ updatedAt: -1 });
};

const Portfolio =
  (mongoose.models.Portfolio as IPortfolioModel) ||
  mongoose.model<IPortfolio, IPortfolioModel>("Portfolio", PortfolioSchema);

export default Portfolio;
