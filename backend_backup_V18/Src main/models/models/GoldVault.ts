import crypto from "crypto";
import mongoose, { Document, Model, Schema } from "mongoose";

export enum GoldPurity {
  GOLD_24K = "24K",
  GOLD_22K = "22K",
  GOLD_21K = "21K",
  GOLD_18K = "18K",
}

export enum GoldUnit {
  GRAM = "GRAM",
  TOLA = "TOLA",
  OUNCE = "OUNCE",
  KILOGRAM = "KILOGRAM",
}

export enum VaultType {
  DIGITAL = "DIGITAL",
  PHYSICAL = "PHYSICAL",
  HYBRID = "HYBRID",
}

export enum VaultStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  LOCKED = "LOCKED",
  FROZEN = "FROZEN",
  CLOSED = "CLOSED",
}

export enum GoldTransactionType {
  BUY = "BUY",
  SELL = "SELL",
  DEPOSIT = "DEPOSIT",
  WITHDRAW = "WITHDRAW",
  CONVERT = "CONVERT",
  BONUS = "BONUS",
  REWARD = "REWARD",
  TRANSFER = "TRANSFER",
}

export enum CustodianProvider {
  GOLDTRADE = "GOLDTRADE",
  MEEZAN_GOLD = "MEEZAN_GOLD",
  HBL_GOLD = "HBL_GOLD",
  BANK_AL_HABIB = "BANK_AL_HABIB",
  BRINKS = "BRINKS",
  MALCA_AMIT = "MALCA_AMIT",
  OTHER = "OTHER",
}

export enum InsuranceStatus {
  INSURED = "INSURED",
  NOT_INSURED = "NOT_INSURED",
  EXPIRED = "EXPIRED",
  CLAIM_PENDING = "CLAIM_PENDING",
}

export enum CertificateStatus {
  GENERATED = "GENERATED",
  VERIFIED = "VERIFIED",
  REVOKED = "REVOKED",
  EXPIRED = "EXPIRED",
}

export interface IGoldHolding {
  purity: GoldPurity;
  unit: GoldUnit;
  quantity: number;
  averageBuyPricePKR: number;
  averageBuyPriceUSD: number;
  currentValuePKR: number;
  currentValueUSD: number;
}

export interface IDigitalGoldBalance {
  grams: number;
  tola: number;
  ounce: number;
  kilogram: number;
  totalGoldGrams: number;
}

export interface IPhysicalVault {
  vaultId: string;
  vaultType: VaultType;
  custodian: CustodianProvider;
  vaultLocation: string;
  lockerNumber?: string;
  storageCountry: string;
  storageCity: string;
}

export interface IInsuranceInfo {
  status: InsuranceStatus;
  provider: string;
  policyNumber: string;
  insuredAmountPKR: number;
  insuredAmountUSD: number;
  expiryDate?: Date;
}

export interface IGoldCertificate {
  certificateNumber: string;
  status: CertificateStatus;
  qrCode: string;
  pdfUrl: string;
  issuedAt?: Date;
  expiresAt?: Date;
}

export interface IGoldLedgerEntry {
  transactionType: GoldTransactionType;
  purity: GoldPurity;
  unit: GoldUnit;
  quantity: number;
  pricePerGramPKR: number;
  totalAmountPKR: number;
  referenceId: string;
  createdAt: Date;
}

export interface IGoldAuditEntry {
  action: string;
  performedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

export interface IGoldVault extends Document {
  user: mongoose.Types.ObjectId;
  vaultNumber: string;
  vaultType: VaultType;
  status: VaultStatus;
  holdings: IGoldHolding[];
  digitalBalance: IDigitalGoldBalance;
  physicalVault?: IPhysicalVault;
  insurance?: IInsuranceInfo;
  certificate?: IGoldCertificate;
  ledger: IGoldLedgerEntry[];
  auditTrail: IGoldAuditEntry[];

  totalGoldGrams: number;
  availableGoldGrams: number;
  lockedGoldGrams: number;
  pendingSettlementGrams: number;
  reservedGoldGrams: number;
  livePriceEngine: any;
  portfolioValue: any;
  profitLoss: any;
  allTimeStats: any;
  qrVerification: any;
  reserveAudit: any;
  holdingStatistics: any;
  priceHistory: any[];
  valuationHistory: any[];
  certificateVerificationHistory: any[];
  ownershipTransfers: any[];
  frozenAt?: Date;
  lastTransactionAt?: Date;
  lastAuditAt?: Date;
}

export interface IGoldVaultMethods {
  buyGold(grams: number, pricePKR: number): void;
  sellGold(grams: number, pricePKR: number): void;
  convertGoldUnits(): void;
  recalculatePortfolio(): void;
  updateROI(): void;
  updateAllTimeStats(): void;
  generateCertificateQR(): string;
  freezeVault(adminId: mongoose.Types.ObjectId, reason: string): void;
  unfreezeVault(adminId: mongoose.Types.ObjectId): void;
  updateReserveAudit(grams: number, auditor: string): void;
}

export interface IGoldVaultModel extends Model<IGoldVault, {}, IGoldVaultMethods> {
  findUserVault(userId: mongoose.Types.ObjectId): Promise<IGoldVault | null>;
  findPrimaryVault(userId: mongoose.Types.ObjectId): Promise<IGoldVault | null>;
  findByVaultNumber(vaultNumber: string): Promise<IGoldVault | null>;
  findByCertificateNumber(certificateNumber: string): Promise<IGoldVault | null>;
  findPhysicalVaults(): Promise<IGoldVault[]>;
  findHighValueVaults(minValuePKR: number): Promise<IGoldVault[]>;
  findExpiringInsurance(days: number): Promise<IGoldVault[]>;
  findPendingAudits(): Promise<IGoldVault[]>;
}

const GoldVaultSchema = new Schema<IGoldVault, IGoldVaultModel, IGoldVaultMethods>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    vaultNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    vaultType: { type: String, enum: Object.values(VaultType), default: VaultType.DIGITAL, index: true },
    status: { type: String, enum: Object.values(VaultStatus), default: VaultStatus.PENDING, index: true },
    isPrimaryVault: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },

    totalGoldGrams: { type: Number, default: 0, min: 0 },
    availableGoldGrams: { type: Number, default: 0, min: 0 },
    lockedGoldGrams: { type: Number, default: 0, min: 0 },
    pendingSettlementGrams: { type: Number, default: 0, min: 0 },
    reservedGoldGrams: { type: Number, default: 0, min: 0 },

    digitalBalance: {
      grams: { type: Number, default: 0 },
      tola: { type: Number, default: 0 },
      ounce: { type: Number, default: 0 },
      kilogram: { type: Number, default: 0 },
      totalGoldGrams: { type: Number, default: 0 },
    },

    holdings: [
      {
        purity: { type: String, enum: Object.values(GoldPurity), default: GoldPurity.GOLD_24K },
        unit: { type: String, enum: Object.values(GoldUnit), default: GoldUnit.GRAM },
        quantity: { type: Number, default: 0 },
        averageBuyPricePKR: { type: Number, default: 0 },
        averageBuyPriceUSD: { type: Number, default: 0 },
        currentValuePKR: { type: Number, default: 0 },
        currentValueUSD: { type: Number, default: 0 },
      },
    ],

    physicalVault: {
      vaultId: { type: String, default: "", uppercase: true },
      vaultType: { type: String, enum: Object.values(VaultType), default: VaultType.PHYSICAL },
      custodian: { type: String, enum: Object.values(CustodianProvider), default: CustodianProvider.GOLDTRADE },
      vaultLocation: { type: String, default: "" },
      lockerNumber: { type: String, default: "" },
      storageCountry: { type: String, default: "Pakistan" },
      storageCity: { type: String, default: "" },
    },

    insurance: {
      status: { type: String, enum: Object.values(InsuranceStatus), default: InsuranceStatus.NOT_INSURED },
      provider: { type: String, default: "" },
      policyNumber: { type: String, default: "" },
      insuredAmountPKR: { type: Number, default: 0 },
      insuredAmountUSD: { type: Number, default: 0 },
      expiryDate: Date,
    },

    certificate: {
      certificateNumber: { type: String, uppercase: true, index: true },
      status: { type: String, enum: Object.values(CertificateStatus), default: CertificateStatus.GENERATED },
      qrCode: { type: String, default: "" },
      pdfUrl: { type: String, default: "" },
      issuedAt: Date,
      expiresAt: Date,
    },

    qrVerification: {
      qrEnabled: { type: Boolean, default: true },
      qrPayloadHash: { type: String, default: "" },
      lastGeneratedAt: Date,
    },

    livePriceEngine: {
      price24KPKRGram: { type: Number, default: 0 },
      exchangeRateUSD: { type: Number, default: 0 },
      exchangeRateAED: { type: Number, default: 0 },
      exchangeRateSAR: { type: Number, default: 0 },
      exchangeRateEUR: { type: Number, default: 0 },
      updatedAt: Date,
    },

    portfolioValue: {
      totalGoldGrams: { type: Number, default: 0 },
      totalValuePKR: { type: Number, default: 0 },
      totalValueUSD: { type: Number, default: 0 },
      totalValueAED: { type: Number, default: 0 },
      totalValueSAR: { type: Number, default: 0 },
      totalValueEUR: { type: Number, default: 0 },
      lastCalculatedAt: Date,
    },

    profitLoss: {
      investedAmountPKR: { type: Number, default: 0 },
      currentMarketValuePKR: { type: Number, default: 0 },
      unrealizedProfitPKR: { type: Number, default: 0 },
      realizedProfitPKR: { type: Number, default: 0 },
      roiPercentage: { type: Number, default: 0 },
      updatedAt: Date,
    },

    allTimeStats: {
      highestPortfolioValuePKR: { type: Number, default: 0 },
      lowestPortfolioValuePKR: { type: Number, default: 0 },
      highestGoldPricePKRGram: { type: Number, default: 0 },
      lowestGoldPricePKRGram: { type: Number, default: 0 },
      highestRecordedAt: Date,
      lowestRecordedAt: Date,
    },

    reserveAudit: {
      audited: { type: Boolean, default: false },
      auditorName: { type: String, default: "" },
      reserveMatched: { type: Boolean, default: false },
      totalAuditedGrams: { type: Number, default: 0 },
      auditedAt: Date,
    },

    holdingStatistics: {
      totalBuyTransactions: { type: Number, default: 0 },
      totalSellTransactions: { type: Number, default: 0 },
      totalGoldPurchasedGrams: { type: Number, default: 0 },
      totalGoldSoldGrams: { type: Number, default: 0 },
    },

    ledger: [{
      transactionType: { type: String, enum: Object.values(GoldTransactionType), required: true },
      purity: { type: String, enum: Object.values(GoldPurity), default: GoldPurity.GOLD_24K },
      unit: { type: String, enum: Object.values(GoldUnit), default: GoldUnit.GRAM },
      quantity: { type: Number, default: 0 },
      pricePerGramPKR: { type: Number, default: 0 },
      totalAmountPKR: { type: Number, default: 0 },
      referenceId: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now },
    }],

    auditTrail: [{
      action: { type: String, required: true },
      performedBy: { type: Schema.Types.ObjectId, ref: "User" },
      notes: String,
      createdAt: { type: Date, default: Date.now },
    }],

    priceHistory: [{ createdAt: { type: Date, default: Date.now } }],
    valuationHistory: [{ createdAt: { type: Date, default: Date.now } }],
    certificateVerificationHistory: [{ createdAt: { type: Date, default: Date.now } }],
    ownershipTransfers: [{ createdAt: { type: Date, default: Date.now } }],

    frozenAt: Date,
    lastTransactionAt: Date,
    lastAuditAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

GoldVaultSchema.index({ user: 1 });
GoldVaultSchema.index({ vaultNumber: 1 }, { unique: true });
GoldVaultSchema.index({ vaultType: 1 });
GoldVaultSchema.index({ status: 1 });
GoldVaultSchema.index({ "certificate.certificateNumber": 1 }, { unique: true, sparse: true });
GoldVaultSchema.index({ "ledger.createdAt": -1 });
GoldVaultSchema.index({ "auditTrail.createdAt": -1 });

GoldVaultSchema.virtual("availableGoldBalance").get(function (this: any) {
  return Math.max(
    (this.totalGoldGrams || 0) - (this.lockedGoldGrams || 0) - (this.pendingSettlementGrams || 0) - (this.reservedGoldGrams || 0),
    0
  );
});

GoldVaultSchema.virtual("isInsured").get(function (this: any) {
  return this.insurance?.status === InsuranceStatus.INSURED;
});

GoldVaultSchema.pre<IGoldVault>("save", function (next) {
  if (!this.vaultNumber) {
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    this.vaultNumber = `GTVLT-${year}-${random}`;
  }

  if (!this.certificate) {
    (this as any).certificate = {};
  }

  if (!this.certificate?.certificateNumber) {
    const year = new Date().getFullYear();
    const random = crypto.randomBytes(5).toString("hex").toUpperCase();
    this.certificate.certificateNumber = `GTCERT-${year}-${random}`;
    this.certificate.issuedAt = new Date();
  }

  this.vaultNumber = this.vaultNumber.toUpperCase();
  if (this.certificate?.certificateNumber) {
    this.certificate.certificateNumber = this.certificate.certificateNumber.toUpperCase();
  }

  next();
});

GoldVaultSchema.methods.generateCertificateQR = function (this: any): string {
  const payload = JSON.stringify({
    certificate: this.certificate?.certificateNumber,
    vault: this.vaultNumber,
    user: this.user?.toString?.(),
    grams: this.totalGoldGrams || 0,
  });

  const hash = crypto.createHash("sha256").update(payload).digest("hex");
  this.qrVerification = this.qrVerification || {};
  this.qrVerification.qrPayloadHash = hash;
  this.qrVerification.lastGeneratedAt = new Date();
  return hash;
};

GoldVaultSchema.methods.convertGoldUnits = function (this: any): void {
  const grams = Number(this.totalGoldGrams || 0);
  this.digitalBalance = this.digitalBalance || {};
  this.digitalBalance.grams = grams;
  this.digitalBalance.tola = Number((grams / 11.6638).toFixed(3));
  this.digitalBalance.ounce = Number((grams / 31.1034768).toFixed(3));
  this.digitalBalance.kilogram = Number((grams / 1000).toFixed(6));
  this.digitalBalance.totalGoldGrams = grams;
};

GoldVaultSchema.methods.recalculatePortfolio = function (this: any): void {
  const price = Number(this.livePriceEngine?.price24KPKRGram || 0);
  this.portfolioValue = this.portfolioValue || {};
  this.portfolioValue.totalGoldGrams = Number(this.totalGoldGrams || 0);
  this.portfolioValue.totalValuePKR = this.portfolioValue.totalGoldGrams * price;

  const usdRate = Number(this.livePriceEngine?.exchangeRateUSD || 1);
  const aedRate = Number(this.livePriceEngine?.exchangeRateAED || 0);
  const sarRate = Number(this.livePriceEngine?.exchangeRateSAR || 0);
  const eurRate = Number(this.livePriceEngine?.exchangeRateEUR || 0);

  this.portfolioValue.totalValueUSD = this.portfolioValue.totalValuePKR / usdRate;
  this.portfolioValue.totalValueAED = this.portfolioValue.totalValueUSD * aedRate;
  this.portfolioValue.totalValueSAR = this.portfolioValue.totalValueUSD * sarRate;
  this.portfolioValue.totalValueEUR = this.portfolioValue.totalValueUSD * eurRate;
  this.portfolioValue.lastCalculatedAt = new Date();
};

GoldVaultSchema.methods.updateROI = function (this: any): void {
  this.profitLoss = this.profitLoss || {};
  const invested = Number(this.profitLoss.investedAmountPKR || 0);
  const current = Number(this.portfolioValue?.totalValuePKR || 0);

  this.profitLoss.currentMarketValuePKR = current;
  this.profitLoss.unrealizedProfitPKR = current - invested;
  this.profitLoss.roiPercentage = invested > 0 ? Number((((current - invested) / invested) * 100).toFixed(2)) : 0;
  this.profitLoss.updatedAt = new Date();
};

GoldVaultSchema.methods.updateAllTimeStats = function (this: any): void {
  this.allTimeStats = this.allTimeStats || {};

  const value = Number(this.portfolioValue?.totalValuePKR || 0);
  const price = Number(this.livePriceEngine?.price24KPKRGram || 0);

  if (value > Number(this.allTimeStats.highestPortfolioValuePKR || 0)) {
    this.allTimeStats.highestPortfolioValuePKR = value;
    this.allTimeStats.highestRecordedAt = new Date();
  }

  if (!this.allTimeStats.lowestPortfolioValuePKR || value < Number(this.allTimeStats.lowestPortfolioValuePKR)) {
    this.allTimeStats.lowestPortfolioValuePKR = value;
    this.allTimeStats.lowestRecordedAt = new Date();
  }

  if (price > Number(this.allTimeStats.highestGoldPricePKRGram || 0)) {
    this.allTimeStats.highestGoldPricePKRGram = price;
  }

  if (!this.allTimeStats.lowestGoldPricePKRGram || price < Number(this.allTimeStats.lowestGoldPricePKRGram)) {
    this.allTimeStats.lowestGoldPricePKRGram = price;
  }
};

GoldVaultSchema.methods.buyGold = function (this: any, grams: number, pricePKR: number): void {
  this.totalGoldGrams = Number(this.totalGoldGrams || 0) + grams;
  this.availableGoldGrams = Number(this.availableGoldGrams || 0) + grams;

  this.holdingStatistics = this.holdingStatistics || {};
  this.holdingStatistics.totalGoldPurchasedGrams = Number(this.holdingStatistics.totalGoldPurchasedGrams || 0) + grams;
  this.holdingStatistics.totalBuyTransactions = Number(this.holdingStatistics.totalBuyTransactions || 0) + 1;

  this.profitLoss = this.profitLoss || {};
  this.profitLoss.investedAmountPKR = Number(this.profitLoss.investedAmountPKR || 0) + grams * pricePKR;

  this.lastTransactionAt = new Date();
  this.convertGoldUnits();
  this.recalculatePortfolio();
  this.updateROI();
};

GoldVaultSchema.methods.sellGold = function (this: any, grams: number, pricePKR: number): void {
  if (Number(this.availableGoldGrams || 0) < grams) {
    throw new Error("Insufficient available gold.");
  }

  this.totalGoldGrams = Number(this.totalGoldGrams || 0) - grams;
  this.availableGoldGrams = Number(this.availableGoldGrams || 0) - grams;

  this.holdingStatistics = this.holdingStatistics || {};
  this.holdingStatistics.totalGoldSoldGrams = Number(this.holdingStatistics.totalGoldSoldGrams || 0) + grams;
  this.holdingStatistics.totalSellTransactions = Number(this.holdingStatistics.totalSellTransactions || 0) + 1;

  this.profitLoss = this.profitLoss || {};
  this.profitLoss.realizedProfitPKR = Number(this.profitLoss.realizedProfitPKR || 0) + grams * pricePKR;

  this.lastTransactionAt = new Date();
  this.convertGoldUnits();
  this.recalculatePortfolio();
  this.updateROI();
};

GoldVaultSchema.methods.freezeVault = function (this: any, adminId: mongoose.Types.ObjectId, reason: string): void {
  this.status = VaultStatus.FROZEN;
  this.frozenAt = new Date();
  this.auditTrail = this.auditTrail || [];
  this.auditTrail.unshift({ action: "VAULT_FROZEN", performedBy: adminId, notes: reason, createdAt: new Date() });
};

GoldVaultSchema.methods.unfreezeVault = function (this: any, adminId: mongoose.Types.ObjectId): void {
  this.status = VaultStatus.ACTIVE;
  this.frozenAt = undefined;
  this.auditTrail = this.auditTrail || [];
  this.auditTrail.unshift({ action: "VAULT_UNFROZEN", performedBy: adminId, notes: "Vault restored.", createdAt: new Date() });
};

GoldVaultSchema.methods.updateReserveAudit = function (this: any, grams: number, auditor: string): void {
  this.reserveAudit = this.reserveAudit || {};
  this.reserveAudit.audited = true;
  this.reserveAudit.reserveMatched = grams === Number(this.totalGoldGrams || 0);
  this.reserveAudit.totalAuditedGrams = grams;
  this.reserveAudit.auditorName = auditor;
  this.reserveAudit.auditedAt = new Date();
  this.lastAuditAt = new Date();
};

GoldVaultSchema.pre<IGoldVault>("save", function (next) {
  (this as any).convertGoldUnits?.();
  (this as any).recalculatePortfolio?.();
  (this as any).updateROI?.();
  (this as any).updateAllTimeStats?.();

  if (this.ledger?.length > 1000) this.ledger = this.ledger.slice(0, 1000);
  if (this.auditTrail?.length > 500) this.auditTrail = this.auditTrail.slice(0, 500);
  if (this.priceHistory?.length > 3650) this.priceHistory = this.priceHistory.slice(0, 3650);
  if (this.valuationHistory?.length > 1000) this.valuationHistory = this.valuationHistory.slice(0, 1000);
  if (this.certificateVerificationHistory?.length > 500) this.certificateVerificationHistory = this.certificateVerificationHistory.slice(0, 500);
  if (this.ownershipTransfers?.length > 250) this.ownershipTransfers = this.ownershipTransfers.slice(0, 250);

  next();
});

GoldVaultSchema.statics.findUserVault = function (userId: mongoose.Types.ObjectId) {
  return this.findOne({ user: userId, isActive: true });
};

GoldVaultSchema.statics.findPrimaryVault = function (userId: mongoose.Types.ObjectId) {
  return this.findOne({ user: userId, isPrimaryVault: true, isActive: true });
};

GoldVaultSchema.statics.findByVaultNumber = function (vaultNumber: string) {
  return this.findOne({ vaultNumber: vaultNumber.toUpperCase().trim() });
};

GoldVaultSchema.statics.findByCertificateNumber = function (certificateNumber: string) {
  return this.findOne({ "certificate.certificateNumber": certificateNumber.toUpperCase().trim() });
};

GoldVaultSchema.statics.findPhysicalVaults = function () {
  return this.find({ vaultType: VaultType.PHYSICAL, isActive: true });
};

GoldVaultSchema.statics.findHighValueVaults = function (minValuePKR = 1000000) {
  return this.find({ "portfolioValue.totalValuePKR": { $gte: minValuePKR }, isActive: true }).sort({ "portfolioValue.totalValuePKR": -1 });
};

GoldVaultSchema.statics.findExpiringInsurance = function (days = 30) {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);

  return this.find({
    "insurance.expiryDate": { $lte: expiry },
    "insurance.status": InsuranceStatus.INSURED,
  });
};

GoldVaultSchema.statics.findPendingAudits = function () {
  return this.find({ "reserveAudit.audited": false, vaultType: VaultType.PHYSICAL });
};

const GoldVault =
  (mongoose.models.GoldVault as IGoldVaultModel) ||
  mongoose.model<IGoldVault, IGoldVaultModel>("GoldVault", GoldVaultSchema);

export default GoldVault;
