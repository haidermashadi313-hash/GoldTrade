import crypto from "crypto";
import mongoose, { Document, Model, Schema } from "mongoose";

export enum OrderSide {
  BUY = "BUY",
  SELL = "SELL",
}

export enum OrderType {
  MARKET = "MARKET",
  LIMIT = "LIMIT",
  STOP_LOSS = "STOP_LOSS",
  TAKE_PROFIT = "TAKE_PROFIT",
  SIP = "SIP",
}

export enum OrderStatus {
  PENDING = "PENDING",
  OPEN = "OPEN",
  PARTIALLY_FILLED = "PARTIALLY_FILLED",
  FILLED = "FILLED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  REJECTED = "REJECTED",
  FAILED = "FAILED",
}

export enum TimeInForce {
  GTC = "GOOD_TILL_CANCELLED",
  IOC = "IMMEDIATE_OR_CANCEL",
  FOK = "FILL_OR_KILL",
  DAY = "DAY",
}

export enum TradeGoldPurity {
  GOLD_24K = "24K",
  GOLD_22K = "22K",
  GOLD_21K = "21K",
  GOLD_18K = "18K",
}

export enum TradeGoldUnit {
  GRAM = "GRAM",
  TOLA = "TOLA",
  OUNCE = "OUNCE",
  KILOGRAM = "KILOGRAM",
}

export enum PaymentMethodType {
  WALLET = "WALLET",
  BANK = "BANK",
  RAAST = "RAAST",
  JAZZCASH = "JAZZCASH",
  EASYPAISA = "EASYPAISA",
  NAYAPAY = "NAYAPAY",
  SADAPAY = "SADAPAY",
  PAYONEER = "PAYONEER",
  STRIPE = "STRIPE",
  CRYPTO = "CRYPTO",
}

export enum SIPFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
}

export enum ExecutionSource {
  MOBILE = "MOBILE",
  WEB = "WEB",
  API = "API",
  ADMIN = "ADMIN",
}

export interface IOrderPriceSnapshot {
  marketPricePKR: number;
  marketPriceUSD: number;
  spreadPKR: number;
  exchangeRateUSD: number;
  capturedAt: Date;
}

export interface ISIPConfiguration {
  enabled: boolean;
  frequency: SIPFrequency;
  nextExecutionDate?: Date;
  amountPKR: number;
  goldQuantityGram: number;
  totalExecutions: number;
  completedExecutions: number;
  paused?: boolean;
}

export interface IOrderFill {
  fillId: string;
  quantityGram: number;
  executedPricePKR: number;
  executedPriceUSD: number;
  feePKR: number;
  executedAt: Date;
}

export interface IOrderTimeline {
  status: OrderStatus;
  note?: string;
  createdAt: Date;
}

export interface ITradeOrder extends Document {
  user: mongoose.Types.ObjectId;
  wallet: mongoose.Types.ObjectId;
  goldVault: mongoose.Types.ObjectId;
  orderNumber: string;
  clientOrderId?: string;
  side: OrderSide;
  orderType: OrderType;
  status: OrderStatus;
  executionSource: ExecutionSource;
  purity: TradeGoldPurity;
  unit: TradeGoldUnit;
  quantityGram: number;
  requestedPricePKR: number;
  triggerPricePKR?: number;
  timeInForce: TimeInForce;
  paymentMethod: PaymentMethodType;
  paymentStatus: "UNPAID" | "PENDING" | "AUTHORIZED" | "PAID" | "FAILED" | "REFUNDED";
  executedQuantityGram: number;
  remainingQuantityGram: number;
  averageExecutionPricePKR: number;
  priceSnapshot: IOrderPriceSnapshot;
  sip?: ISIPConfiguration;
  fills: IOrderFill[];
  timeline: IOrderTimeline[];

  placedAt?: Date;
  executedAt?: Date;
  lastUpdatedAt?: Date;

  estimatedOrderValuePKR: number;
  estimatedOrderValueUSD: number;
  executionValuePKR: number;
  executionValueUSD: number;

  marketOrder: any;
  limitOrder: any;
  stopLoss: any;
  takeProfit: any;
  feeEngine: any;
  spreadEngine: any;
  gatewayFees: any;
  taxEngine: any;
  vipBenefits: any;
  cashbackRewards: any;
  settlementEngine: any;
  recoveryEngine: any;
  riskEngine: any;
  partialFills: any[];
  matchingHistory: any[];
  sipExecutions: any[];
  auditTrail: any[];

  calculateOrderValue(): void;
  calculateTradingFees(): void;
  validateQuantity(): boolean;
  validatePrice(): boolean;
  validateTriggers(): boolean;
  validateSlippage(): boolean;
  updateExecutionStatus(): void;
  calculateRiskScore(): void;
  runAMLChecks(): void;
}

export interface ITradeOrderMethods {
  calculateOrderValue(): void;
  calculateTradingFees(): void;
  validateQuantity(): boolean;
  validatePrice(): boolean;
  validateTriggers(): boolean;
  validateSlippage(): boolean;
  updateExecutionStatus(): void;
  calculateRiskScore(): void;
  runAMLChecks(): void;
}

export interface ITradeOrderModel extends Model<ITradeOrder, {}, ITradeOrderMethods> {
  findUserOrders(userId: mongoose.Types.ObjectId): Promise<ITradeOrder[]>;
  findOpenOrders(userId?: mongoose.Types.ObjectId): Promise<ITradeOrder[]>;
  findPendingSettlementOrders(): Promise<ITradeOrder[]>;
  findLimitOrders(): Promise<ITradeOrder[]>;
  findSIPOrders(): Promise<ITradeOrder[]>;
  findHighRiskOrders(): Promise<ITradeOrder[]>;
  findOrdersByPaymentMethod(method: PaymentMethodType): Promise<ITradeOrder[]>;
  findOrdersByVault(vaultId: mongoose.Types.ObjectId): Promise<ITradeOrder[]>;
  findTodayOrders(): Promise<ITradeOrder[]>;
  findLargeOrders(minPKR: number): Promise<ITradeOrder[]>;
}

const TradeOrderSchema = new Schema<ITradeOrder, ITradeOrderModel, ITradeOrderMethods>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    wallet: { type: Schema.Types.ObjectId, ref: "Wallet", required: true, index: true },
    goldVault: { type: Schema.Types.ObjectId, ref: "GoldVault", required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    clientOrderId: { type: String, uppercase: true, trim: true, index: true },

    side: { type: String, enum: Object.values(OrderSide), required: true, index: true },
    orderType: { type: String, enum: Object.values(OrderType), default: OrderType.MARKET, index: true },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING, index: true },
    timeInForce: { type: String, enum: Object.values(TimeInForce), default: TimeInForce.GTC },
    executionSource: { type: String, enum: Object.values(ExecutionSource), default: ExecutionSource.WEB },

    purity: { type: String, enum: Object.values(TradeGoldPurity), default: TradeGoldPurity.GOLD_24K },
    unit: { type: String, enum: Object.values(TradeGoldUnit), default: TradeGoldUnit.GRAM },
    quantityGram: { type: Number, required: true, min: 0.001 },
    requestedPricePKR: { type: Number, required: true },

    paymentMethod: { type: String, enum: Object.values(PaymentMethodType), default: PaymentMethodType.WALLET },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PENDING", "AUTHORIZED", "PAID", "FAILED", "REFUNDED"],
      default: "UNPAID",
    },

    executedQuantityGram: { type: Number, default: 0 },
    remainingQuantityGram: { type: Number, default: 0 },
    averageExecutionPricePKR: { type: Number, default: 0 },
    executionValuePKR: { type: Number, default: 0 },
    executionValueUSD: { type: Number, default: 0 },
    estimatedOrderValuePKR: { type: Number, default: 0 },
    estimatedOrderValueUSD: { type: Number, default: 0 },

    priceSnapshot: {
      marketPricePKR: { type: Number, default: 0 },
      marketPriceUSD: { type: Number, default: 0 },
      spreadPKR: { type: Number, default: 0 },
      exchangeRateUSD: { type: Number, default: 0 },
      capturedAt: { type: Date, default: Date.now },
    },

    marketOrder: {
      slippageTolerancePercent: { type: Number, default: 0.5 },
      actualSlippagePercent: { type: Number, default: 0 },
    },

    limitOrder: {
      enabled: { type: Boolean, default: false },
      limitPricePKR: { type: Number, default: 0 },
    },

    stopLoss: {
      enabled: { type: Boolean, default: false },
      triggerPricePKR: { type: Number, default: 0 },
    },

    takeProfit: {
      enabled: { type: Boolean, default: false },
      targetPricePKR: { type: Number, default: 0 },
    },

    sip: {
      enabled: { type: Boolean, default: false, index: true },
      frequency: { type: String, enum: Object.values(SIPFrequency), default: SIPFrequency.MONTHLY },
      nextExecutionDate: Date,
      amountPKR: { type: Number, default: 0 },
      goldQuantityGram: { type: Number, default: 0 },
      totalExecutions: { type: Number, default: 0 },
      completedExecutions: { type: Number, default: 0 },
      paused: { type: Boolean, default: false },
    },

    settlementEngine: {
      settlementStatus: {
        type: String,
        enum: ["PENDING", "PROCESSING", "SETTLED", "FAILED", "REVERSED"],
        default: "PENDING",
      },
    },

    recoveryEngine: {
      retryCount: { type: Number, default: 0 },
    },

    feeEngine: {
      buyFeePercent: { type: Number, default: 0.2 },
      sellFeePercent: { type: Number, default: 0.2 },
      minimumFeePKR: { type: Number, default: 10 },
      maximumFeePKR: { type: Number, default: 5000 },
      calculatedFeePKR: { type: Number, default: 0 },
    },

    spreadEngine: {
      finalSpreadPKR: { type: Number, default: 0 },
    },

    gatewayFees: {
      gatewayFeePKR: { type: Number, default: 0 },
    },

    taxEngine: {
      totalTaxPKR: { type: Number, default: 0 },
    },

    vipBenefits: {
      vipLevel: { type: String, default: "STANDARD" },
      discountPercent: { type: Number, default: 0 },
      feeSavedPKR: { type: Number, default: 0 },
      cashbackMultiplier: { type: Number, default: 1 },
    },

    cashbackRewards: {
      cashbackPKR: { type: Number, default: 0 },
      cashbackGoldGram: { type: Number, default: 0 },
      loyaltyPoints: { type: Number, default: 0 },
      rewardCampaign: { type: String, default: "" },
    },

    riskEngine: {
      riskScore: { type: Number, default: 0 },
      riskLevel: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "LOW" },
      amlChecked: { type: Boolean, default: false },
      amlCheckedAt: Date,
      manualReviewRequired: { type: Boolean, default: false },
      fraudSuspected: { type: Boolean, default: false },
      riskFlags: [String],
    },

    fills: [
      {
        fillId: String,
        quantityGram: Number,
        executedPricePKR: Number,
        executedPriceUSD: Number,
        feePKR: Number,
        executedAt: { type: Date, default: Date.now },
      },
    ],

    partialFills: [{ createdAt: { type: Date, default: Date.now } }],
    matchingHistory: [{ createdAt: { type: Date, default: Date.now } }],
    sipExecutions: [{ createdAt: { type: Date, default: Date.now } }],
    timeline: [
      {
        status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
        note: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    auditTrail: [
      {
        action: String,
        performedBy: { type: Schema.Types.ObjectId, ref: "User" },
        notes: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    placedAt: { type: Date, default: Date.now, index: true },
    executedAt: Date,
    lastUpdatedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  }
);

TradeOrderSchema.index({ user: 1, status: 1 });
TradeOrderSchema.index({ orderNumber: 1 }, { unique: true });
TradeOrderSchema.index({ clientOrderId: 1 });
TradeOrderSchema.index({ placedAt: -1 });
TradeOrderSchema.index({ executedAt: -1 });
TradeOrderSchema.index({ side: 1, orderType: 1, status: 1, requestedPricePKR: -1, placedAt: 1 });
TradeOrderSchema.index({ "limitOrder.enabled": 1, "limitOrder.limitPricePKR": 1 });
TradeOrderSchema.index({ "stopLoss.enabled": 1, "stopLoss.triggerPricePKR": 1 });
TradeOrderSchema.index({ "takeProfit.enabled": 1, "takeProfit.targetPricePKR": 1 });
TradeOrderSchema.index({ "sip.enabled": 1, "sip.nextExecutionDate": 1 });
TradeOrderSchema.index({ "settlementEngine.settlementStatus": 1 });
TradeOrderSchema.index({ paymentMethod: 1, paymentStatus: 1 });
TradeOrderSchema.index({ executionValuePKR: -1 });
TradeOrderSchema.index({ "feeEngine.calculatedFeePKR": -1 });

TradeOrderSchema.virtual("remainingQuantity").get(function (this: any) {
  return Math.max((this.quantityGram || 0) - (this.executedQuantityGram || 0), 0);
});

TradeOrderSchema.virtual("completionPercentage").get(function (this: any) {
  if (!this.quantityGram) return 0;
  return Number((((this.executedQuantityGram || 0) / this.quantityGram) * 100).toFixed(2));
});

TradeOrderSchema.virtual("isCompleted").get(function (this: any) {
  return this.status === OrderStatus.FILLED;
});

TradeOrderSchema.virtual("effectiveExecutionPrice").get(function (this: any) {
  return this.averageExecutionPricePKR || this.requestedPricePKR || 0;
});

TradeOrderSchema.methods.calculateOrderValue = function (this: any): void {
  this.estimatedOrderValuePKR = (this.quantityGram || 0) * (this.requestedPricePKR || 0);
  this.executionValuePKR = (this.executedQuantityGram || 0) * (this.averageExecutionPricePKR || this.requestedPricePKR || 0);

  if (this.priceSnapshot?.exchangeRateUSD > 0) {
    this.estimatedOrderValueUSD = this.estimatedOrderValuePKR / this.priceSnapshot.exchangeRateUSD;
    this.executionValueUSD = this.executionValuePKR / this.priceSnapshot.exchangeRateUSD;
  }
};

TradeOrderSchema.methods.validateQuantity = function (this: any): boolean {
  if ((this.quantityGram || 0) < 0.001) throw new Error("Minimum tradable quantity is 0.001 gram.");
  if (this.quantityGram > 100000) throw new Error("Maximum order quantity exceeded.");
  return true;
};

TradeOrderSchema.methods.validatePrice = function (this: any): boolean {
  if ((this.requestedPricePKR || 0) <= 0) throw new Error("Invalid order price.");
  if (this.orderType === OrderType.LIMIT && this.limitOrder?.enabled && (this.limitOrder.limitPricePKR || 0) <= 0) {
    throw new Error("Limit price required.");
  }
  return true;
};

TradeOrderSchema.methods.validateTriggers = function (this: any): boolean {
  if (this.stopLoss?.enabled && (this.stopLoss.triggerPricePKR || 0) <= 0) throw new Error("Invalid Stop Loss trigger.");
  if (this.takeProfit?.enabled && (this.takeProfit.targetPricePKR || 0) <= 0) throw new Error("Invalid Take Profit target.");
  return true;
};

TradeOrderSchema.methods.validateSlippage = function (this: any): boolean {
  const marketPrice = Number(this.priceSnapshot?.marketPricePKR || 0);
  const requested = Number(this.requestedPricePKR || 0);
  if (!marketPrice) return true;

  const percent = (Math.abs(marketPrice - requested) / marketPrice) * 100;
  if (percent > Number(this.marketOrder?.slippageTolerancePercent || 0)) throw new Error("Slippage tolerance exceeded.");

  this.marketOrder = this.marketOrder || {};
  this.marketOrder.actualSlippagePercent = Number(percent.toFixed(2));
  return true;
};

TradeOrderSchema.methods.updateExecutionStatus = function (this: any): void {
  if ((this.executedQuantityGram || 0) === 0) this.status = OrderStatus.OPEN;
  else if (this.executedQuantityGram < this.quantityGram) this.status = OrderStatus.PARTIALLY_FILLED;
  else {
    this.status = OrderStatus.FILLED;
    this.executedAt = new Date();
  }

  this.remainingQuantityGram = Math.max((this.quantityGram || 0) - (this.executedQuantityGram || 0), 0);
};

TradeOrderSchema.methods.calculateTradingFees = function (this: any): void {
  const rate = this.side === OrderSide.BUY ? Number(this.feeEngine?.buyFeePercent || 0) : Number(this.feeEngine?.sellFeePercent || 0);
  let fee = (Number(this.executionValuePKR || 0) * rate) / 100;
  fee = Math.max(fee, Number(this.feeEngine?.minimumFeePKR || 0));
  fee = Math.min(fee, Number(this.feeEngine?.maximumFeePKR || fee));

  this.feeEngine = this.feeEngine || {};
  this.feeEngine.calculatedFeePKR = Number(fee.toFixed(2));
};

TradeOrderSchema.methods.calculateRiskScore = function (this: any): void {
  let score = 0;
  if ((this.quantityGram || 0) >= 100) score += 25;
  if ((this.estimatedOrderValuePKR || 0) >= 5000000) score += 25;
  if (this.paymentMethod === PaymentMethodType.CRYPTO) score += 15;
  if ((this.marketOrder?.actualSlippagePercent || 0) > 1) score += 20;
  if ((this.recoveryEngine?.retryCount || 0) >= 3) score += 15;

  this.riskEngine = this.riskEngine || {};
  this.riskEngine.riskScore = score;
  this.riskEngine.riskLevel = score >= 70 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";
};

TradeOrderSchema.methods.runAMLChecks = function (this: any): void {
  this.riskEngine = this.riskEngine || { riskFlags: [] };
  this.riskEngine.riskFlags = this.riskEngine.riskFlags || [];

  this.riskEngine.amlChecked = true;
  this.riskEngine.amlCheckedAt = new Date();

  if ((this.estimatedOrderValuePKR || 0) >= 10000000) {
    this.riskEngine.manualReviewRequired = true;
    this.riskEngine.riskFlags.push("HIGH_VALUE_TRANSACTION");
  }

  if (this.paymentMethod === PaymentMethodType.CRYPTO) {
    this.riskEngine.riskFlags.push("CRYPTO_SETTLEMENT");
  }
};

TradeOrderSchema.pre<ITradeOrder>("save", function (next) {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    this.orderNumber = `GTORD-${year}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
  }

  if (!this.clientOrderId) {
    this.clientOrderId = crypto.randomBytes(8).toString("hex").toUpperCase();
  }

  (this as any).validateQuantity?.();
  (this as any).validatePrice?.();
  (this as any).validateTriggers?.();
  (this as any).calculateOrderValue?.();
  (this as any).calculateTradingFees?.();
  (this as any).updateExecutionStatus?.();
  (this as any).calculateRiskScore?.();
  (this as any).runAMLChecks?.();

  this.orderNumber = this.orderNumber.toUpperCase();
  if (this.clientOrderId) this.clientOrderId = this.clientOrderId.toUpperCase();
  this.lastUpdatedAt = new Date();

  if (this.fills?.length > 500) this.fills = this.fills.slice(0, 500);
  if (this.partialFills?.length > 500) this.partialFills = this.partialFills.slice(0, 500);
  if (this.matchingHistory?.length > 1000) this.matchingHistory = this.matchingHistory.slice(0, 1000);
  if (this.timeline?.length > 300) this.timeline = this.timeline.slice(0, 300);
  if (this.auditTrail?.length > 500) this.auditTrail = this.auditTrail.slice(0, 500);
  if (this.sipExecutions?.length > 365) this.sipExecutions = this.sipExecutions.slice(0, 365);

  next();
});

TradeOrderSchema.statics.findUserOrders = function (userId: mongoose.Types.ObjectId) {
  return this.find({ user: userId }).sort({ placedAt: -1 });
};

TradeOrderSchema.statics.findOpenOrders = function (userId?: mongoose.Types.ObjectId) {
  const filter: any = { status: { $in: [OrderStatus.OPEN, OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED] } };
  if (userId) filter.user = userId;
  return this.find(filter).sort({ placedAt: 1 });
};

TradeOrderSchema.statics.findPendingSettlementOrders = function () {
  return this.find({ "settlementEngine.settlementStatus": "PENDING" }).sort({ executedAt: 1 });
};

TradeOrderSchema.statics.findLimitOrders = function () {
  return this.find({ orderType: OrderType.LIMIT, status: { $in: [OrderStatus.OPEN, OrderStatus.PENDING] } }).sort({ requestedPricePKR: 1, placedAt: 1 });
};

TradeOrderSchema.statics.findSIPOrders = function () {
  return this.find({ "sip.enabled": true, "sip.paused": false }).sort({ "sip.nextExecutionDate": 1 });
};

TradeOrderSchema.statics.findHighRiskOrders = function () {
  return this.find({ "riskEngine.riskLevel": { $in: ["HIGH", "CRITICAL"] } }).sort({ "riskEngine.riskScore": -1 });
};

TradeOrderSchema.statics.findOrdersByPaymentMethod = function (method: PaymentMethodType) {
  return this.find({ paymentMethod: method }).sort({ placedAt: -1 });
};

TradeOrderSchema.statics.findOrdersByVault = function (vaultId: mongoose.Types.ObjectId) {
  return this.find({ goldVault: vaultId }).sort({ placedAt: -1 });
};

TradeOrderSchema.statics.findTodayOrders = function () {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return this.find({ placedAt: { $gte: start } }).sort({ placedAt: -1 });
};

TradeOrderSchema.statics.findLargeOrders = function (minPKR = 500000) {
  return this.find({ estimatedOrderValuePKR: { $gte: minPKR } }).sort({ estimatedOrderValuePKR: -1 });
};

const TradeOrder =
  (mongoose.models.TradeOrder as ITradeOrderModel) ||
  mongoose.model<ITradeOrder, ITradeOrderModel>("TradeOrder", TradeOrderSchema);

export default TradeOrder;
