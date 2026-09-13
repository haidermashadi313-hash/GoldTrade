// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/GoldPrice.ts
// SECTION 1/10
// IMPORTS + ENUMS + INTERFACES
// ======================================================

import mongoose, { Schema, Document, Model } from "mongoose";

// ======================================================
// GOLD KARAT ENUM
// ======================================================

export enum GoldKarat {
  K24 = "24K",
  K22 = "22K",
  K21 = "21K",
  K18 = "18K",
}

// ======================================================
// MARKET SESSION ENUM
// ======================================================

export enum MarketSession {
  PAKISTAN = "PAKISTAN",
  ASIA = "ASIA",
  LONDON = "LONDON",
  NEW_YORK = "NEW_YORK",
  CLOSED = "CLOSED",
}

// ======================================================
// PRICE SOURCE ENUM
// ======================================================

export enum PriceSource {
  LIVE_API = "LIVE_API",
  ADMIN_OVERRIDE = "ADMIN_OVERRIDE",
  MANUAL = "MANUAL",
  SYSTEM = "SYSTEM",
}

// ======================================================
// MARKET STATUS ENUM
// ======================================================

export enum MarketStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  PAUSED = "PAUSED",
  MAINTENANCE = "MAINTENANCE",
}

// ======================================================
// GOLD PRICE STRUCTURE INTERFACE
// ======================================================

export interface IGoldRate {
  buyPriceGram: number;

  sellPriceGram: number;

  buyPriceTola: number;

  sellPriceTola: number;

  buyPriceOunce: number;

  sellPriceOunce: number;

  spread: number;

  spreadPercentage: number;
}

// ======================================================
// EXCHANGE RATE INTERFACE
// ======================================================

export interface IExchangeRate {
  usdPkr: number;

  eurPkr: number;

  aedPkr: number;

  sarPkr: number;

  gbpPkr: number;

  lastUpdated: Date;
}

// ======================================================
// OHLC CANDLE INTERFACE
// ======================================================

export interface IPriceCandle {
  timeframe: "1M" | "5M" | "15M" | "1H" | "4H" | "1D";

  open: number;

  high: number;

  low: number;

  close: number;

  volume: number;

  timestamp: Date;
}

// ======================================================
// PRICE SOURCE INFO
// ======================================================

export interface IPriceSourceInfo {
  source: PriceSource;

  provider: string;

  endpoint?: string;

  fetchedAt: Date;

  latencyMs?: number;

  responseStatus?: number;

  responseMessage?: string;
}

// ======================================================
// ADMIN OVERRIDE INTERFACE
// ======================================================

export interface IAdminOverride {
  enabled: boolean;

  overriddenBy?: mongoose.Types.ObjectId;

  overrideReason?: string;

  overrideBuyPrice?: number;

  overrideSellPrice?: number;

  overrideSpread?: number;

  overriddenAt?: Date;

  expiresAt?: Date;

  isTemporary?: boolean;
}

// ======================================================
// MAIN DOCUMENT INTERFACE
// ======================================================

export interface IGoldPrice extends Document, Record<string, any> {
  symbol: string;

  marketStatus: MarketStatus;

  session: MarketSession;

  currentPriceGram: number;

  currentPriceTola: number;

  currentPriceOunce: number;

  liveBuyPriceGram: number;

  liveSellPriceGram: number;

  liveBuyPriceTola: number;

  liveSellPriceTola: number;

  liveBuyPriceOunce: number;

  liveSellPriceOunce: number;

  k24: IGoldRate;

  k22: IGoldRate;

  k21: IGoldRate;

  k18: IGoldRate;

  exchangeRate: IExchangeRate;

  sourceInfo: IPriceSourceInfo;

  adminOverride: IAdminOverride;

  historicalCandles: IPriceCandle[];

  updateLivePrice(pricePerGram: number): Promise<IGoldPrice>;

  applyAdminOverride(
    buyPrice: number,
    sellPrice: number,
    adminId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<IGoldPrice>;
}

// ======================================================
// END OF SECTION 1/10
// NEXT SECTION: CURRENT GOLD PRICE SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/GoldPrice.ts
// SECTION 2/10
// CURRENT GOLD PRICE SCHEMA
// ======================================================

const GoldPriceSchema = new Schema<any>(
  {
    // ==================================================
    // PRICE IDENTIFICATION
    // ==================================================

    symbol: {
      type: String,
      default: "XAU/PKR",
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },

    marketStatus: {
      type: String,
      enum: Object.values(MarketStatus),
      default: MarketStatus.OPEN,
      index: true,
    },

    session: {
      type: String,
      enum: Object.values(MarketSession),
      default: MarketSession.PAKISTAN,
      index: true,
    },

    // ==================================================
    // CURRENT LIVE GOLD PRICE
    // ==================================================

    currentPriceGram: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    currentPriceTola: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    currentPriceOunce: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    // ==================================================
    // LIVE BUY / SELL PRICE
    // ==================================================

    liveBuyPriceGram: {
      type: Number,
      default: 0,
    },

    liveSellPriceGram: {
      type: Number,
      default: 0,
    },

    liveBuyPriceTola: {
      type: Number,
      default: 0,
    },

    liveSellPriceTola: {
      type: Number,
      default: 0,
    },

    liveBuyPriceOunce: {
      type: Number,
      default: 0,
    },

    liveSellPriceOunce: {
      type: Number,
      default: 0,
    },

    // ==================================================
    // DAILY MARKET SUMMARY
    // ==================================================

    dailyOpen: {
      type: Number,
      default: 0,
    },

    dailyHigh: {
      type: Number,
      default: 0,
    },

    dailyLow: {
      type: Number,
      default: 0,
    },

    dailyClose: {
      type: Number,
      default: 0,
    },

    previousClose: {
      type: Number,
      default: 0,
    },

    // ==================================================
    // PRICE CHANGE METRICS
    // ==================================================

    priceChange: {
      type: Number,
      default: 0,
    },

    priceChangePercentage: {
      type: Number,
      default: 0,
    },

    dailyRange: {
      type: Number,
      default: 0,
    },

    weeklyChange: {
      type: Number,
      default: 0,
    },

    monthlyChange: {
      type: Number,
      default: 0,
    },

    yearlyChange: {
      type: Number,
      default: 0,
    },

    // ==================================================
    // MARKET ACTIVITY
    // ==================================================

    tradingVolume: {
      type: Number,
      default: 0,
    },

    totalTradesToday: {
      type: Number,
      default: 0,
    },

    buyersCount: {
      type: Number,
      default: 0,
    },

    sellersCount: {
      type: Number,
      default: 0,
    },

    // ==================================================
    // PRICE UPDATE METADATA
    // ==================================================

    lastPriceUpdate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    nextScheduledUpdate: {
      type: Date,
    },

    updateIntervalSeconds: {
      type: Number,
      default: 60,
    },

// ======================================================
// END OF SECTION 2/10
// NEXT SECTION: 24K / 22K / 21K / 18K PRICE STRUCTURE
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/GoldPrice.ts
// SECTION 3/10
// 24K / 22K / 21K / 18K PRICE STRUCTURE
// ======================================================

    // ==================================================
    // 24 KARAT GOLD PRICES
    // ==================================================

    k24: {
      buyPriceGram: { type: Number, default: 0 },
      sellPriceGram: { type: Number, default: 0 },

      buyPriceTola: { type: Number, default: 0 },
      sellPriceTola: { type: Number, default: 0 },

      buyPriceOunce: { type: Number, default: 0 },
      sellPriceOunce: { type: Number, default: 0 },

      spread: { type: Number, default: 0 },
      spreadPercentage: { type: Number, default: 0 },
    },

    // ==================================================
    // 22 KARAT GOLD PRICES
    // ==================================================

    k22: {
      buyPriceGram: { type: Number, default: 0 },
      sellPriceGram: { type: Number, default: 0 },

      buyPriceTola: { type: Number, default: 0 },
      sellPriceTola: { type: Number, default: 0 },

      buyPriceOunce: { type: Number, default: 0 },
      sellPriceOunce: { type: Number, default: 0 },

      spread: { type: Number, default: 0 },
      spreadPercentage: { type: Number, default: 0 },
    },

    // ==================================================
    // 21 KARAT GOLD PRICES
    // ==================================================

    k21: {
      buyPriceGram: { type: Number, default: 0 },
      sellPriceGram: { type: Number, default: 0 },

      buyPriceTola: { type: Number, default: 0 },
      sellPriceTola: { type: Number, default: 0 },

      buyPriceOunce: { type: Number, default: 0 },
      sellPriceOunce: { type: Number, default: 0 },

      spread: { type: Number, default: 0 },
      spreadPercentage: { type: Number, default: 0 },
    },

    // ==================================================
    // 18 KARAT GOLD PRICES
    // ==================================================

    k18: {
      buyPriceGram: { type: Number, default: 0 },
      sellPriceGram: { type: Number, default: 0 },

      buyPriceTola: { type: Number, default: 0 },
      sellPriceTola: { type: Number, default: 0 },

      buyPriceOunce: { type: Number, default: 0 },
      sellPriceOunce: { type: Number, default: 0 },

      spread: { type: Number, default: 0 },
      spreadPercentage: { type: Number, default: 0 },
    },

    // ==================================================
    // MARKET SPREAD CONFIGURATION
    // ==================================================

    spreadConfiguration: {
      defaultSpreadGram: {
        type: Number,
        default: 150,
      },

      defaultSpreadTola: {
        type: Number,
        default: 1750,
      },

      premiumPercentage: {
        type: Number,
        default: 0,
      },

      discountPercentage: {
        type: Number,
        default: 0,
      },

      autoCalculateSpread: {
        type: Boolean,
        default: true,
      },
    },

    // ==================================================
    // PRICE PRECISION SETTINGS
    // ==================================================

    precisionSettings: {
      gramDecimals: {
        type: Number,
        default: 2,
      },

      tolaDecimals: {
        type: Number,
        default: 2,
      },

      ounceDecimals: {
        type: Number,
        default: 2,
      },

      roundPrices: {
        type: Boolean,
        default: true,
      },
    },

// ======================================================
// END OF SECTION 3/10
// NEXT SECTION: MARKET SESSION + EXCHANGE RATE SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/GoldPrice.ts
// SECTION 4/10
// MARKET SESSION + EXCHANGE RATE SCHEMA
// ======================================================

    // ==================================================
    // LIVE EXCHANGE RATES
    // ==================================================

    exchangeRate: {
      usdPkr: {
        type: Number,
        default: 0,
      },

      eurPkr: {
        type: Number,
        default: 0,
      },

      aedPkr: {
        type: Number,
        default: 0,
      },

      sarPkr: {
        type: Number,
        default: 0,
      },

      gbpPkr: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // ==================================================
    // INTERNATIONAL GOLD MARKET
    // ==================================================

    internationalMarket: {
      spotPriceUSD: {
        type: Number,
        default: 0,
      },

      futurePriceUSD: {
        type: Number,
        default: 0,
      },

      comexPriceUSD: {
        type: Number,
        default: 0,
      },

      londonFixAM: {
        type: Number,
        default: 0,
      },

      londonFixPM: {
        type: Number,
        default: 0,
      },

      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },

    // ==================================================
    // ACTIVE MARKET SESSION
    // ==================================================

    marketSessionInfo: {
      activeSession: {
        type: String,
        enum: Object.values(MarketSession),
        default: MarketSession.PAKISTAN,
      },

      sessionStatus: {
        type: String,
        enum: Object.values(MarketStatus),
        default: MarketStatus.OPEN,
      },

      timezone: {
        type: String,
        default: "Asia/Karachi",
      },

      tradingDay: {
        type: String,
        default: "",
      },

      marketDate: {
        type: Date,
        default: Date.now,
      },
    },

    // ==================================================
    // SESSION TIMINGS
    // ==================================================

    sessionTiming: {
      pakistan: {
        opensAt: {
          type: String,
          default: "09:00",
        },

        closesAt: {
          type: String,
          default: "17:00",
        },
      },

      asia: {
        opensAt: {
          type: String,
          default: "06:00",
        },

        closesAt: {
          type: String,
          default: "15:00",
        },
      },

      london: {
        opensAt: {
          type: String,
          default: "13:00",
        },

        closesAt: {
          type: String,
          default: "22:00",
        },
      },

      newYork: {
        opensAt: {
          type: String,
          default: "18:00",
        },

        closesAt: {
          type: String,
          default: "03:00",
        },
      },
    },

    // ==================================================
    // MARKET INDICATORS
    // ==================================================

    indicators: {
      marketTrend: {
        type: String,
        enum: ["BULLISH", "BEARISH", "SIDEWAYS"],
        default: "SIDEWAYS",
      },

      volatilityLevel: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "EXTREME"],
        default: "LOW",
      },

      volatilityPercentage: {
        type: Number,
        default: 0,
      },

      momentum: {
        type: Number,
        default: 0,
      },

      liquidityScore: {
        type: Number,
        default: 100,
      },
    },

    // ==================================================
    // AUTO PRICE REFRESH SETTINGS
    // ==================================================

    autoRefresh: {
      enabled: {
        type: Boolean,
        default: true,
      },

      refreshIntervalSeconds: {
        type: Number,
        default: 60,
      },

      lastRefreshAt: {
        type: Date,
        default: Date.now,
      },

      nextRefreshAt: {
        type: Date,
      },

      failedRefreshAttempts: {
        type: Number,
        default: 0,
      },

      maxRetryAttempts: {
        type: Number,
        default: 5,
      },
    },

// ======================================================
// END OF SECTION 4/10
// NEXT SECTION: OHLC CANDLE + HISTORICAL PRICE SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/GoldPrice.ts
// SECTION 5/10
// OHLC CANDLE + HISTORICAL PRICE SCHEMA
// ======================================================

    // ==================================================
    // LIVE OHLC CANDLE HISTORY
    // ==================================================

    historicalCandles: [
      {
        timeframe: {
          type: String,
          enum: ["1M", "5M", "15M", "1H", "4H", "1D"],
          required: true,
          index: true,
        },

        open: {
          type: Number,
          required: true,
        },

        high: {
          type: Number,
          required: true,
        },

        low: {
          type: Number,
          required: true,
        },

        close: {
          type: Number,
          required: true,
        },

        volume: {
          type: Number,
          default: 0,
        },

        timestamp: {
          type: Date,
          default: Date.now,
          index: true,
        },
      },
    ],

    // ==================================================
    // DAILY HISTORICAL PRICES
    // ==================================================

    dailyHistory: [
      {
        date: {
          type: Date,
          required: true,
        },

        open: {
          type: Number,
          default: 0,
        },

        high: {
          type: Number,
          default: 0,
        },

        low: {
          type: Number,
          default: 0,
        },

        close: {
          type: Number,
          default: 0,
        },

        averagePrice: {
          type: Number,
          default: 0,
        },

        changeAmount: {
          type: Number,
          default: 0,
        },

        changePercentage: {
          type: Number,
          default: 0,
        },

        volume: {
          type: Number,
          default: 0,
        },
      },
    ],

    // ==================================================
    // WEEKLY HISTORICAL PRICES
    // ==================================================

    weeklyHistory: [
      {
        weekStart: {
          type: Date,
          required: true,
        },

        weekEnd: {
          type: Date,
          required: true,
        },

        open: Number,
        high: Number,
        low: Number,
        close: Number,

        averagePrice: {
          type: Number,
          default: 0,
        },

        weeklyChange: {
          type: Number,
          default: 0,
        },

        volume: {
          type: Number,
          default: 0,
        },
      },
    ],

    // ==================================================
    // MONTHLY HISTORICAL PRICES
    // ==================================================

    monthlyHistory: [
      {
        month: {
          type: String,
          required: true,
        },

        year: {
          type: Number,
          required: true,
        },

        open: Number,
        high: Number,
        low: Number,
        close: Number,

        averagePrice: {
          type: Number,
          default: 0,
        },

        monthlyChange: {
          type: Number,
          default: 0,
        },

        volume: {
          type: Number,
          default: 0,
        },
      },
    ],

    // ==================================================
    // YEARLY HISTORICAL PRICES
    // ==================================================

    yearlyHistory: [
      {
        year: {
          type: Number,
          required: true,
        },

        open: Number,
        high: Number,
        low: Number,
        close: Number,

        highestPrice: {
          type: Number,
          default: 0,
        },

        lowestPrice: {
          type: Number,
          default: 0,
        },

        yearlyChange: {
          type: Number,
          default: 0,
        },

        averagePrice: {
          type: Number,
          default: 0,
        },

        volume: {
          type: Number,
          default: 0,
        },
      },
    ],

    // ==================================================
    // PRICE STATISTICS
    // ==================================================

    statistics: {
      allTimeHigh: {
        type: Number,
        default: 0,
      },

      allTimeLow: {
        type: Number,
        default: 0,
      },

      last30DayHigh: {
        type: Number,
        default: 0,
      },

      last30DayLow: {
        type: Number,
        default: 0,
      },

      movingAverage7: {
        type: Number,
        default: 0,
      },

      movingAverage30: {
        type: Number,
        default: 0,
      },

      movingAverage90: {
        type: Number,
        default: 0,
      },

      averageDailyVolume: {
        type: Number,
        default: 0,
      },
    },

// ======================================================
// END OF SECTION 5/10
// NEXT SECTION: ADMIN OVERRIDE + SOURCE TRACKING
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/GoldPrice.ts
// SECTION 6/10
// ADMIN OVERRIDE + PRICE SOURCE TRACKING
// ======================================================

    // ==================================================
    // PRICE SOURCE INFORMATION
    // ==================================================

    sourceInfo: {
      source: {
        type: String,
        enum: Object.values(PriceSource),
        default: PriceSource.LIVE_API,
        index: true,
      },

      provider: {
        type: String,
        default: "SYSTEM",
      },

      endpoint: {
        type: String,
        default: "",
      },

      fetchedAt: {
        type: Date,
        default: Date.now,
      },

      latencyMs: {
        type: Number,
        default: 0,
      },

      responseStatus: {
        type: Number,
        default: 200,
      },

      responseMessage: {
        type: String,
        default: "OK",
      },
    },

    // ==================================================
    // ADMIN PRICE OVERRIDE
    // ==================================================

    adminOverride: {
      enabled: {
        type: Boolean,
        default: false,
        index: true,
      },

      overriddenBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      overrideReason: {
        type: String,
        default: "",
        trim: true,
      },

      overrideBuyPrice: {
        type: Number,
        default: 0,
      },

      overrideSellPrice: {
        type: Number,
        default: 0,
      },

      overrideSpread: {
        type: Number,
        default: 0,
      },

      overriddenAt: {
        type: Date,
      },

      expiresAt: {
        type: Date,
      },

      isTemporary: {
        type: Boolean,
        default: true,
      },
    },

    // ==================================================
    // PRICE UPDATE HISTORY
    // ==================================================

    updateHistory: [
      {
        source: {
          type: String,
          enum: Object.values(PriceSource),
          required: true,
        },

        previousPrice: {
          type: Number,
          default: 0,
        },

        newPrice: {
          type: Number,
          default: 0,
        },

        changeAmount: {
          type: Number,
          default: 0,
        },

        changePercentage: {
          type: Number,
          default: 0,
        },

        provider: {
          type: String,
          default: "",
        },

        updatedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        reason: {
          type: String,
          default: "",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==================================================
    // PRICE ROLLBACK SUPPORT
    // ==================================================

    rollback: {
      previousGramPrice: {
        type: Number,
        default: 0,
      },

      previousTolaPrice: {
        type: Number,
        default: 0,
      },

      previousOuncePrice: {
        type: Number,
        default: 0,
      },

      rollbackAvailable: {
        type: Boolean,
        default: false,
      },

      rollbackReason: {
        type: String,
        default: "",
      },

      rolledBackBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      rolledBackAt: {
        type: Date,
      },
    },

    // ==================================================
    // SYSTEM HEALTH
    // ==================================================

    systemHealth: {
      apiHealthy: {
        type: Boolean,
        default: true,
      },

      websocketHealthy: {
        type: Boolean,
        default: true,
      },

      lastSuccessfulFetch: {
        type: Date,
        default: Date.now,
      },

      consecutiveFailures: {
        type: Number,
        default: 0,
      },

      lastFailureReason: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // PRICE ALERTS
    // ==================================================

    alerts: {
      highVolatilityAlert: {
        type: Boolean,
        default: false,
      },

      largePriceMovementAlert: {
        type: Boolean,
        default: false,
      },

      manualOverrideAlert: {
        type: Boolean,
        default: false,
      },

      alertThresholdPercentage: {
        type: Number,
        default: 2,
      },

      lastAlertAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// ======================================================
// END OF SECTION 6/10
// NEXT SECTION: INDEXES + VIRTUAL FIELDS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/GoldPrice.ts
// SECTION 7/10
// INDEXES + VIRTUAL FIELDS
// ======================================================

// ======================================================
// PRIMARY DATABASE INDEXES
// ======================================================

GoldPriceSchema.index({ symbol: 1 }, { unique: true });
GoldPriceSchema.index({ marketStatus: 1 });
GoldPriceSchema.index({ session: 1 });

// ======================================================
// PRICE UPDATE INDEXES
// ======================================================

GoldPriceSchema.index({ lastPriceUpdate: -1 });
GoldPriceSchema.index({ "sourceInfo.source": 1 });
GoldPriceSchema.index({ "sourceInfo.provider": 1 });

// ======================================================
// ADMIN OVERRIDE INDEXES
// ======================================================

GoldPriceSchema.index({ "adminOverride.enabled": 1 });
GoldPriceSchema.index({ "adminOverride.overriddenBy": 1 });

// ======================================================
// HISTORICAL DATA INDEXES
// ======================================================

GoldPriceSchema.index({ "historicalCandles.timestamp": -1 });
GoldPriceSchema.index({ "historicalCandles.timeframe": 1 });
GoldPriceSchema.index({ "dailyHistory.date": -1 });

// ======================================================
// MARKET HEALTH INDEXES
// ======================================================

GoldPriceSchema.index({ "systemHealth.apiHealthy": 1 });
GoldPriceSchema.index({ "alerts.highVolatilityAlert": 1 });

// ======================================================
// VIRTUAL : CURRENT MARKET SPREAD
// ======================================================

GoldPriceSchema.virtual("currentSpreadGram").get(function () {
  const self: any = this;
  return self.liveSellPriceGram - self.liveBuyPriceGram;
});

GoldPriceSchema.virtual("currentSpreadTola").get(function () {
  const self: any = this;
  return self.liveSellPriceTola - self.liveBuyPriceTola;
});

GoldPriceSchema.virtual("currentSpreadOunce").get(function () {
  const self: any = this;
  return self.liveSellPriceOunce - self.liveBuyPriceOunce;
});

// ======================================================
// VIRTUAL : MARKET DIRECTION
// ======================================================

GoldPriceSchema.virtual("marketDirection").get(function () {
  const self: any = this;
  if (self.priceChange > 0) return "UP";
  if (self.priceChange < 0) return "DOWN";
  return "FLAT";
});

// ======================================================
// VIRTUAL : IS MARKET OPEN
// ======================================================

GoldPriceSchema.virtual("isMarketOpen").get(function () {
  const self: any = this;
  return self.marketStatus === MarketStatus.OPEN;
});

// ======================================================
// VIRTUAL : DAILY CHANGE SUMMARY
// ======================================================

GoldPriceSchema.virtual("dailyChangeSummary").get(function () {
  const self: any = this;
  return {
    amount: self.priceChange,
    percentage: self.priceChangePercentage,
    direction:
      self.priceChange > 0
        ? "UP"
        : self.priceChange < 0
        ? "DOWN"
        : "FLAT",
  };
});

// ======================================================
// VIRTUAL : PRICE RANGE PERCENTAGE
// ======================================================

GoldPriceSchema.virtual("dailyRangePercentage").get(function () {
  const self: any = this;
  if (self.dailyOpen === 0) return 0;

  return Number(
    (((self.dailyHigh - self.dailyLow) / self.dailyOpen) * 100).toFixed(2)
  );
});

// ======================================================
// VIRTUAL : LIVE BUY / SELL SUMMARY
// ======================================================

GoldPriceSchema.virtual("liveTradingPrice").get(function () {
  const self: any = this;
  return {
    buyGram: self.liveBuyPriceGram,
    sellGram: self.liveSellPriceGram,
    buyTola: self.liveBuyPriceTola,
    sellTola: self.liveSellPriceTola,
    buyOunce: self.liveBuyPriceOunce,
    sellOunce: self.liveSellPriceOunce,
  };
});

// ======================================================
// VIRTUAL : PRICE AGE (SECONDS)
// ======================================================

GoldPriceSchema.virtual("priceAgeSeconds").get(function () {
  const self: any = this;
  return Math.floor(
    (Date.now() - new Date(self.lastPriceUpdate).getTime()) / 1000
  );
});

// ======================================================
// VIRTUAL : ACTIVE PRICE SOURCE
// ======================================================

GoldPriceSchema.virtual("activePriceSource").get(function () {
  const self: any = this;
  if (self.adminOverride && self.adminOverride.enabled) {
    return PriceSource.ADMIN_OVERRIDE;
  }

  return self.sourceInfo && self.sourceInfo.source;
});

// ======================================================
// VIRTUAL : VOLATILITY STATUS
// ======================================================

GoldPriceSchema.virtual("volatilityStatus").get(function () {
  const self: any = this;
  const change = Math.abs(self.priceChangePercentage || 0);

  if (change >= 5) return "EXTREME";
  if (change >= 2) return "HIGH";
  if (change >= 1) return "MEDIUM";
  return "LOW";
});

// ======================================================
// VIRTUAL : SESSION DISPLAY
// ======================================================

GoldPriceSchema.virtual("sessionDisplay").get(function () {
  const self: any = this;
  return {
    session: self.session,
    status: self.marketStatus,
    timezone: self.marketSessionInfo && self.marketSessionInfo.timezone,
  };
});

// ======================================================
// JSON / OBJECT OPTIONS
// ======================================================

GoldPriceSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

GoldPriceSchema.set("toObject", {
  virtuals: true,
});

// ======================================================
// END OF SECTION 7/10
// NEXT SECTION: PRICE UPDATE METHODS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/GoldPrice.ts
// SECTION 8/10
// PRICE UPDATE METHODS
// ======================================================

// ======================================================
// UPDATE LIVE PRICE
// ======================================================

GoldPriceSchema.methods.updateLivePrice = async function (
  pricePerGram: number
): Promise<IGoldPrice> {
  const previousPrice = this.currentPriceGram;

  this.currentPriceGram = pricePerGram;
  this.currentPriceTola = Number((pricePerGram * 11.664).toFixed(2));
  this.currentPriceOunce = Number((pricePerGram * 31.1035).toFixed(2));

  this.lastPriceUpdate = new Date();
  this.sourceInfo.fetchedAt = new Date();

  // Daily High / Low
  if (this.dailyHigh === 0 || pricePerGram > this.dailyHigh) {
    this.dailyHigh = pricePerGram;
  }

  if (this.dailyLow === 0 || pricePerGram < this.dailyLow) {
    this.dailyLow = pricePerGram;
  }

  this.dailyClose = pricePerGram;

  // Change Metrics
  this.priceChange = Number((pricePerGram - previousPrice).toFixed(2));

  if (previousPrice > 0) {
    this.priceChangePercentage = Number(
      (((pricePerGram - previousPrice) / previousPrice) * 100).toFixed(2)
    );
  }

  this.dailyRange = Number((this.dailyHigh - this.dailyLow).toFixed(2));

  return this.save();
};

// ======================================================
// CALCULATE BUY / SELL SPREAD
// ======================================================

GoldPriceSchema.methods.calculateSpread = async function (): Promise<IGoldPrice> {
  const spreadGram = this.spreadConfiguration.defaultSpreadGram;
  const spreadTola = this.spreadConfiguration.defaultSpreadTola;

  this.liveBuyPriceGram = this.currentPriceGram;
  this.liveSellPriceGram = this.currentPriceGram + spreadGram;

  this.liveBuyPriceTola = this.currentPriceTola;
  this.liveSellPriceTola = this.currentPriceTola + spreadTola;

  this.liveBuyPriceOunce = this.currentPriceOunce;
  this.liveSellPriceOunce = Number(
    (this.currentPriceOunce + spreadGram * 31.1035).toFixed(2)
  );

  return this.save();
};

// ======================================================
// UPDATE EXCHANGE RATE
// ======================================================

GoldPriceSchema.methods.updateExchangeRate = async function ({
  usdPkr,
  eurPkr,
  aedPkr,
  sarPkr,
  gbpPkr,
}: {
  usdPkr: number;
  eurPkr: number;
  aedPkr: number;
  sarPkr: number;
  gbpPkr: number;
}) {
  this.exchangeRate.usdPkr = usdPkr;
  this.exchangeRate.eurPkr = eurPkr;
  this.exchangeRate.aedPkr = aedPkr;
  this.exchangeRate.sarPkr = sarPkr;
  this.exchangeRate.gbpPkr = gbpPkr;
  this.exchangeRate.lastUpdated = new Date();

  return this.save();
};

// ======================================================
// CREATE OHLC CANDLE
// ======================================================

GoldPriceSchema.methods.createCandle = async function ({
  timeframe,
  open,
  high,
  low,
  close,
  volume,
}: {
  timeframe: "1M" | "5M" | "15M" | "1H" | "4H" | "1D";
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}) {
  this.historicalCandles.unshift({
    timeframe,
    open,
    high,
    low,
    close,
    volume,
    timestamp: new Date(),
  });

  if (this.historicalCandles.length > 10000) {
    this.historicalCandles = this.historicalCandles.slice(0, 10000);
  }

  return this.save();
};

// ======================================================
// APPLY ADMIN OVERRIDE
// ======================================================

GoldPriceSchema.methods.applyAdminOverride = async function (
  buyPrice: number,
  sellPrice: number,
  adminId: mongoose.Types.ObjectId,
  reason: string
): Promise<IGoldPrice> {
  this.adminOverride.enabled = true;
  this.adminOverride.overriddenBy = adminId;
  this.adminOverride.overrideReason = reason;
  this.adminOverride.overrideBuyPrice = buyPrice;
  this.adminOverride.overrideSellPrice = sellPrice;
  this.adminOverride.overrideSpread = sellPrice - buyPrice;
  this.adminOverride.overriddenAt = new Date();

  this.liveBuyPriceGram = buyPrice;
  this.liveSellPriceGram = sellPrice;

  return this.save();
};

// ======================================================
// REMOVE ADMIN OVERRIDE
// ======================================================

GoldPriceSchema.methods.removeAdminOverride = async function (): Promise<IGoldPrice> {
  this.adminOverride.enabled = false;
  this.adminOverride.overriddenBy = undefined;
  this.adminOverride.overrideReason = "";
  this.adminOverride.overrideBuyPrice = 0;
  this.adminOverride.overrideSellPrice = 0;
  this.adminOverride.overrideSpread = 0;
  this.adminOverride.overriddenAt = undefined;
  this.adminOverride.expiresAt = undefined;

  await this.calculateSpread();

  return this.save();
};

// ======================================================
// SAVE PRICE UPDATE HISTORY
// ======================================================

GoldPriceSchema.methods.recordPriceUpdate = async function ({
  previousPrice,
  newPrice,
  source,
  provider,
  updatedBy,
  reason,
}: {
  previousPrice: number;
  newPrice: number;
  source: PriceSource;
  provider: string;
  updatedBy?: mongoose.Types.ObjectId;
  reason?: string;
}) {
  const changeAmount = Number((newPrice - previousPrice).toFixed(2));

  const changePercentage =
    previousPrice > 0
      ? Number((((newPrice - previousPrice) / previousPrice) * 100).toFixed(2))
      : 0;

  this.updateHistory.unshift({
    source,
    previousPrice,
    newPrice,
    changeAmount,
    changePercentage,
    provider,
    updatedBy,
    reason,
    createdAt: new Date(),
  });

  if (this.updateHistory.length > 1000) {
    this.updateHistory = this.updateHistory.slice(0, 1000);
  }

  return this.save();
};

// ======================================================
// ROLLBACK TO PREVIOUS PRICE
// ======================================================

GoldPriceSchema.methods.rollbackPrice = async function (
  adminId: mongoose.Types.ObjectId,
  reason: string
): Promise<IGoldPrice> {
  this.currentPriceGram = this.rollback.previousGramPrice;
  this.currentPriceTola = this.rollback.previousTolaPrice;
  this.currentPriceOunce = this.rollback.previousOuncePrice;

  this.rollback.rollbackAvailable = false;
  this.rollback.rollbackReason = reason;
  this.rollback.rolledBackBy = adminId;
  this.rollback.rolledBackAt = new Date();

  await this.calculateSpread();

  return this.save();
};

// ======================================================
// END OF SECTION 8/10
// NEXT SECTION: PRE-SAVE HOOKS + AUTO CALCULATIONS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/GoldPrice.ts
// SECTION 9/10
// PRE-SAVE HOOKS + AUTO CALCULATIONS
// ======================================================

// ======================================================
// AUTO CALCULATE TOLA & OUNCE PRICE
// ======================================================

GoldPriceSchema.pre("save", function (next) {
  const self: any = this;
  self.currentPriceTola = Number(
    (self.currentPriceGram * 11.664).toFixed(2)
  );

  self.currentPriceOunce = Number(
    (self.currentPriceGram * 31.1035).toFixed(2)
  );

  next();
});

// ======================================================
// AUTO CALCULATE 22K / 21K / 18K FROM 24K
// ======================================================

GoldPriceSchema.pre("save", function (next) {
  const self: any = this;
  const baseBuy = self.liveBuyPriceGram;
  const baseSell = self.liveSellPriceGram;

  const convert = (purity: number) => ({
    buy: Number((baseBuy * purity).toFixed(2)),
    sell: Number((baseSell * purity).toFixed(2)),
  });

  const k22 = convert(22 / 24);
  const k21 = convert(21 / 24);
  const k18 = convert(18 / 24);

  // 24K
  self.k24.buyPriceGram = baseBuy;
  self.k24.sellPriceGram = baseSell;
  self.k24.buyPriceTola = Number((baseBuy * 11.664).toFixed(2));
  self.k24.sellPriceTola = Number((baseSell * 11.664).toFixed(2));
  self.k24.buyPriceOunce = Number((baseBuy * 31.1035).toFixed(2));
  self.k24.sellPriceOunce = Number((baseSell * 31.1035).toFixed(2));
  self.k24.spread = Number((baseSell - baseBuy).toFixed(2));
  self.k24.spreadPercentage =
    baseBuy > 0
      ? Number((((baseSell - baseBuy) / baseBuy) * 100).toFixed(2))
      : 0;

  // 22K
  self.k22.buyPriceGram = k22.buy;
  self.k22.sellPriceGram = k22.sell;
  self.k22.buyPriceTola = Number((k22.buy * 11.664).toFixed(2));
  self.k22.sellPriceTola = Number((k22.sell * 11.664).toFixed(2));
  self.k22.buyPriceOunce = Number((k22.buy * 31.1035).toFixed(2));
  self.k22.sellPriceOunce = Number((k22.sell * 31.1035).toFixed(2));
  self.k22.spread = Number((k22.sell - k22.buy).toFixed(2));
  self.k22.spreadPercentage =
    k22.buy > 0
      ? Number((((k22.sell - k22.buy) / k22.buy) * 100).toFixed(2))
      : 0;

  // 21K
  self.k21.buyPriceGram = k21.buy;
  self.k21.sellPriceGram = k21.sell;
  self.k21.buyPriceTola = Number((k21.buy * 11.664).toFixed(2));
  self.k21.sellPriceTola = Number((k21.sell * 11.664).toFixed(2));
  self.k21.buyPriceOunce = Number((k21.buy * 31.1035).toFixed(2));
  self.k21.sellPriceOunce = Number((k21.sell * 31.1035).toFixed(2));
  self.k21.spread = Number((k21.sell - k21.buy).toFixed(2));
  self.k21.spreadPercentage =
    k21.buy > 0
      ? Number((((k21.sell - k21.buy) / k21.buy) * 100).toFixed(2))
      : 0;

  // 18K
  self.k18.buyPriceGram = k18.buy;
  self.k18.sellPriceGram = k18.sell;
  self.k18.buyPriceTola = Number((k18.buy * 11.664).toFixed(2));
  self.k18.sellPriceTola = Number((k18.sell * 11.664).toFixed(2));
  self.k18.buyPriceOunce = Number((k18.buy * 31.1035).toFixed(2));
  self.k18.sellPriceOunce = Number((k18.sell * 31.1035).toFixed(2));
  self.k18.spread = Number((k18.sell - k18.buy).toFixed(2));
  self.k18.spreadPercentage =
    k18.buy > 0
      ? Number((((k18.sell - k18.buy) / k18.buy) * 100).toFixed(2))
      : 0;

  next();
});

// ======================================================
// AUTO CALCULATE DAILY CHANGE
// ======================================================

GoldPriceSchema.pre("save", function (next) {
  const self: any = this;
  self.priceChange = Number(
    (self.dailyClose - self.previousClose).toFixed(2)
  );

  if (self.previousClose > 0) {
    self.priceChangePercentage = Number(
      (
        ((self.dailyClose - self.previousClose) / self.previousClose) *
        100
      ).toFixed(2)
    );
  } else {
    self.priceChangePercentage = 0;
  }

  self.dailyRange = Number(
    (self.dailyHigh - self.dailyLow).toFixed(2)
  );

  next();
});

// ======================================================
// AUTO DETECT MARKET TREND
// ======================================================

GoldPriceSchema.pre("save", function (next) {
  const self: any = this;
  if (self.priceChangePercentage >= 1.5) {
    self.indicators.marketTrend = "BULLISH";
  } else if (self.priceChangePercentage <= -1.5) {
    self.indicators.marketTrend = "BEARISH";
  } else {
    self.indicators.marketTrend = "SIDEWAYS";
  }

  next();
});

// ======================================================
// AUTO CALCULATE VOLATILITY
// ======================================================

GoldPriceSchema.pre("save", function (next) {
  const self: any = this;
  if (self.dailyOpen > 0) {
    const volatility = Number(
      (
        ((self.dailyHigh - self.dailyLow) / self.dailyOpen) *
        100
      ).toFixed(2)
    );

    self.indicators.volatilityPercentage = volatility;

    if (volatility >= 5) {
      self.indicators.volatilityLevel = "EXTREME";
    } else if (volatility >= 3) {
      self.indicators.volatilityLevel = "HIGH";
    } else if (volatility >= 1) {
      self.indicators.volatilityLevel = "MEDIUM";
    } else {
      self.indicators.volatilityLevel = "LOW";
    }
  }

  next();
});

// ======================================================
// AUTO DETECT ACTIVE MARKET SESSION
// Pakistan Time (24h)
// ======================================================

GoldPriceSchema.pre("save", function (next) {
  const self: any = this;
  const hour = new Date().getHours();

  if (hour >= 9 && hour < 17) {
    self.session = MarketSession.PAKISTAN;
  } else if (hour >= 6 && hour < 15) {
    self.session = MarketSession.ASIA;
  } else if (hour >= 13 && hour < 22) {
    self.session = MarketSession.LONDON;
  } else if (hour >= 18 || hour < 3) {
    self.session = MarketSession.NEW_YORK;
  } else {
    self.session = MarketSession.CLOSED;
  }

  next();
});

// ======================================================
// AUTO SET MARKET STATUS
// ======================================================

GoldPriceSchema.pre("save", function (next) {
  const self: any = this;
  self.marketStatus =
    self.session === MarketSession.CLOSED
      ? MarketStatus.CLOSED
      : MarketStatus.OPEN;

  next();
});

// ======================================================
// UPDATE MOVING AVERAGES
// ======================================================

GoldPriceSchema.pre("save", function (next) {
  const self: any = this;
  const prices = (self.dailyHistory || [])
    .map((item: any) => item.close)
    .slice(0, 90);

  const average = (count: number) => {
    const values = prices.slice(0, count);

    if (!values.length) return 0;

    const total = values.reduce((sum: number, value: number) => sum + value, 0);

    return Number((total / values.length).toFixed(2));
  };

  self.statistics.movingAverage7 = average(7);
  self.statistics.movingAverage30 = average(30);
  self.statistics.movingAverage90 = average(90);

  next();
});

// ======================================================
// LIMIT HISTORY SIZE
// ======================================================

GoldPriceSchema.pre("save", function (next) {
  const self: any = this;
  if ((self.historicalCandles || []).length > 10000) {
    self.historicalCandles = self.historicalCandles.slice(0, 10000);
  }

  if ((self.dailyHistory || []).length > 365) {
    self.dailyHistory = self.dailyHistory.slice(0, 365);
  }

  if ((self.weeklyHistory || []).length > 260) {
    self.weeklyHistory = self.weeklyHistory.slice(0, 260);
  }

  if ((self.monthlyHistory || []).length > 120) {
    self.monthlyHistory = self.monthlyHistory.slice(0, 120);
  }

  if ((self.yearlyHistory || []).length > 25) {
    self.yearlyHistory = self.yearlyHistory.slice(0, 25);
  }

  if ((self.updateHistory || []).length > 1000) {
    self.updateHistory = self.updateHistory.slice(0, 1000);
  }

  next();
});

// ======================================================
// END OF SECTION 9/10
// NEXT SECTION: MODEL EXPORT + FINAL SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/GoldPrice.ts
// SECTION 10/10
// FINAL SCHEMA OPTIONS + MODEL EXPORT
// ======================================================

// ======================================================
// SCHEMA OPTIONS
// ======================================================

GoldPriceSchema.set("timestamps", true);

GoldPriceSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

GoldPriceSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
});

// ======================================================
// INSTANCE METHODS INTERFACE
// ======================================================

export interface IGoldPriceMethods {
  updateLivePrice(pricePerGram: number): Promise<IGoldPrice>;

  calculateSpread(): Promise<IGoldPrice>;

  updateExchangeRate(data: {
    usdPkr: number;
    eurPkr: number;
    aedPkr: number;
    sarPkr: number;
    gbpPkr: number;
  }): Promise<IGoldPrice>;

  createCandle(data: {
    timeframe: "1M" | "5M" | "15M" | "1H" | "4H" | "1D";
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }): Promise<IGoldPrice>;

  applyAdminOverride(
    buyPrice: number,
    sellPrice: number,
    adminId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<IGoldPrice>;

  removeAdminOverride(): Promise<IGoldPrice>;

  recordPriceUpdate(data: {
    previousPrice: number;
    newPrice: number;
    source: PriceSource;
    provider: string;
    updatedBy?: mongoose.Types.ObjectId;
    reason?: string;
  }): Promise<IGoldPrice>;

  rollbackPrice(
    adminId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<IGoldPrice>;
}

// ======================================================
// STATIC METHODS INTERFACE
// ======================================================

export interface IGoldPriceModel extends Model<IGoldPrice> {
  getCurrentPrice(): Promise<IGoldPrice | null>;

  getMarketSession(session: MarketSession): Promise<IGoldPrice[]>;

  getLatestHistory(limit?: number): Promise<IGoldPrice[]>;
}

// ======================================================
// STATIC METHODS
// ======================================================

GoldPriceSchema.statics.getCurrentPrice = function () {
  return this.findOne({
    symbol: "XAU/PKR",
  }).sort({ updatedAt: -1 });
};

GoldPriceSchema.statics.getMarketSession = function (
  session: MarketSession
) {
  return this.find({
    session,
    marketStatus: MarketStatus.OPEN,
  }).sort({ lastPriceUpdate: -1 });
};

GoldPriceSchema.statics.getLatestHistory = function (
  limit = 30
) {
  return this.find()
    .sort({ lastPriceUpdate: -1 })
    .limit(limit);
};

// ======================================================
// CREATE MODEL
// ======================================================

const GoldPrice =
  (mongoose.models.GoldPrice as IGoldPriceModel) ||
  mongoose.model<IGoldPrice, IGoldPriceModel>(
    "GoldPrice",
    GoldPriceSchema
  );

// ======================================================
// EXPORT MODEL
// ======================================================

export default GoldPrice;

// ======================================================
// END OF FILE
// backend/src/models/GoldPrice.ts
// GOLDTRADE V17 ENTERPRISE GOLD PRICE MODEL COMPLETE
// ======================================================