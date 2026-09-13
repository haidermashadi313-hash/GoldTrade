// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/Transaction.ts
// SECTION 1/10
// IMPORTS + ENUMS + INTERFACES
// ======================================================

import mongoose, { Schema, Document, Model } from "mongoose";

// ======================================================
// TRANSACTION TYPE ENUM
// ======================================================

export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  BUY_GOLD = "BUY_GOLD",
  SELL_GOLD = "SELL_GOLD",
  REFERRAL_REWARD = "REFERRAL_REWARD",
  SIGNUP_BONUS = "SIGNUP_BONUS",
  CASHBACK = "CASHBACK",
  ADJUSTMENT = "ADJUSTMENT",
}

// ======================================================
// TRANSACTION STATUS ENUM
// ======================================================

export enum TransactionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
  UNDER_REVIEW = "UNDER_REVIEW",
}

// ======================================================
// PAYMENT METHOD ENUM
// ======================================================

export enum PaymentMethod {
  BANK_TRANSFER = "BANK_TRANSFER",
  EASYPAISA = "EASYPAISA",
  JAZZCASH = "JAZZCASH",
  BINANCE = "BINANCE",
  USDT_TRC20 = "USDT_TRC20",
  USDT_ERC20 = "USDT_ERC20",
  INTERNAL_WALLET = "INTERNAL_WALLET",
  REFERRAL = "REFERRAL",
  BONUS = "BONUS",
}

// ======================================================
// PAYMENT INFO INTERFACE
// ======================================================

export interface IPaymentInfo {
  [key: string]: any;

  method: PaymentMethod;

  senderName?: string;

  senderAccount?: string;

  receiverAccount?: string;

  bankName?: string;

  transactionReference?: string;

  receiptImage?: string;
}

// ======================================================
// GOLD TRADE INTERFACE
// ======================================================

export interface IGoldTrade {
  [key: string]: any;

  goldGrams: number;

  pricePerGram: number;

  totalAmount: number;

  spread: number;

  marketPrice: number;
}

// ======================================================
// ADMIN APPROVAL INTERFACE
// ======================================================

export interface IAdminApproval {
  [key: string]: any;

  approvedBy?: mongoose.Types.ObjectId;

  approvedAt?: Date;

  rejectedBy?: mongoose.Types.ObjectId;

  rejectedAt?: Date;

  rejectionReason?: string;

  adminNotes?: string;
}

// ======================================================
// SECURITY INTERFACE
// ======================================================

export interface ITransactionSecurity {
  [key: string]: any;

  ipAddress?: string;

  device?: string;

  country?: string;

  city?: string;

  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  amlFlag: boolean;

  fraudFlag: boolean;
}

// ======================================================
// MAIN TRANSACTION DOCUMENT INTERFACE
// ======================================================

export interface ITransaction extends Document {
  [key: string]: any;

  transactionId: string;

  user: mongoose.Types.ObjectId;

  wallet: mongoose.Types.ObjectId;

  type: TransactionType;

  status: TransactionStatus;

  amount: number;

  fee: number;

  netAmount: number;

  payment: IPaymentInfo;

  goldTrade?: IGoldTrade;

  approval: IAdminApproval;

  security: ITransactionSecurity;

  updateStatus(status: TransactionStatus): Promise<ITransaction>;
}

// ======================================================
// END OF SECTION 1/10
// NEXT SECTION: BASIC TRANSACTION SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/Transaction.ts
// SECTION 2/10
// BASIC TRANSACTION SCHEMA
// ======================================================

const TransactionSchema = new Schema<ITransaction>(
  {
    // ==================================================
    // TRANSACTION IDENTIFICATION
    // ==================================================

    transactionId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    referenceNumber: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
      index: true,
    },

    externalReference: {
      type: String,
      default: "",
      trim: true,
    },

    // ==================================================
    // USER & WALLET REFERENCES
    // ==================================================

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },

    // ==================================================
    // TRANSACTION INFORMATION
    // ==================================================

    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.PENDING,
      index: true,
    },

    currency: {
      type: String,
      default: "PKR",
      uppercase: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    fee: {
      type: Number,
      default: 0,
      min: 0,
    },

    tax: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    netAmount: {
      type: Number,
      default: 0,
    },

    // ==================================================
    // BALANCE SNAPSHOT
    // ==================================================

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

    // ==================================================
    // DESCRIPTION
    // ==================================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    // ==================================================
    // SOURCE INFORMATION
    // ==================================================

    source: {
      type: String,
      enum: [
        "MOBILE_APP",
        "WEB_APP",
        "ADMIN_PANEL",
        "SYSTEM",
        "API",
      ],
      default: "MOBILE_APP",
    },

    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // ==================================================
    // TIMESTAMPS
    // ==================================================

    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    completedAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },

// ======================================================
// END OF SECTION 2/10
// NEXT SECTION: PAYMENT INFORMATION SCHEMA
// ======================================================
// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/Transaction.ts
// SECTION 3/10
// PAYMENT INFORMATION SCHEMA
// ======================================================

    // ==================================================
    // PAYMENT INFORMATION
    // ==================================================

    payment: {
      method: {
        type: String,
        enum: Object.values(PaymentMethod),
        required: true,
        index: true,
      },

      senderName: {
        type: String,
        default: "",
        trim: true,
      },

      senderAccount: {
        type: String,
        default: "",
        trim: true,
      },

      senderBankName: {
        type: String,
        default: "",
        trim: true,
      },

      receiverName: {
        type: String,
        default: "",
        trim: true,
      },

      receiverAccount: {
        type: String,
        default: "",
        trim: true,
      },

      receiverBankName: {
        type: String,
        default: "",
        trim: true,
      },

      transactionReference: {
        type: String,
        default: "",
        trim: true,
        index: true,
      },

      receiptImage: {
        type: String,
        default: "",
      },

      receiptImages: [
        {
          type: String,
        },
      ],

      paymentProofVerified: {
        type: Boolean,
        default: false,
      },

      paymentProofVerifiedAt: {
        type: Date,
      },

      paymentProofVerifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    },

    // ==================================================
    // BANK TRANSFER DETAILS
    // ==================================================

    bankTransfer: {
      bankName: {
        type: String,
        default: "",
      },

      accountTitle: {
        type: String,
        default: "",
      },

      accountNumber: {
        type: String,
        default: "",
      },

      iban: {
        type: String,
        default: "",
      },

      branchCode: {
        type: String,
        default: "",
      },

      swiftCode: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // EASYPAISA DETAILS
    // ==================================================

    easypaisa: {
      accountNumber: {
        type: String,
        default: "",
      },

      accountTitle: {
        type: String,
        default: "",
      },

      transactionId: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // JAZZCASH DETAILS
    // ==================================================

    jazzcash: {
      accountNumber: {
        type: String,
        default: "",
      },

      accountTitle: {
        type: String,
        default: "",
      },

      transactionId: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // BINANCE / USDT DETAILS
    // ==================================================

    crypto: {
      network: {
        type: String,
        enum: ["TRC20", "ERC20", "BEP20", "SOL", ""],
        default: "",
      },

      walletAddress: {
        type: String,
        default: "",
      },

      txHash: {
        type: String,
        default: "",
        index: true,
      },

      confirmations: {
        type: Number,
        default: 0,
      },

      exchangeRate: {
        type: Number,
        default: 0,
      },

      cryptoAmount: {
        type: Number,
        default: 0,
      },
    },

    // ==================================================
    // PAYMENT PROCESSING
    // ==================================================

    processing: {
      processingFee: {
        type: Number,
        default: 0,
      },

      gatewayFee: {
        type: Number,
        default: 0,
      },

      exchangeRateApplied: {
        type: Number,
        default: 1,
      },

      processingStatus: {
        type: String,
        enum: [
          "WAITING_PAYMENT",
          "PAYMENT_RECEIVED",
          "VERIFYING",
          "PROCESSING",
          "COMPLETED",
          "FAILED",
        ],
        default: "WAITING_PAYMENT",
      },

      processingStartedAt: {
        type: Date,
      },

      processingCompletedAt: {
        type: Date,
      },
    },

// ======================================================
// END OF SECTION 3/10
// NEXT SECTION: GOLD TRADING INFORMATION SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/Transaction.ts
// SECTION 4/10
// GOLD TRADING INFORMATION SCHEMA
// ======================================================

    // ==================================================
    // GOLD TRADING INFORMATION
    // ==================================================

    goldTrade: {
      goldGrams: {
        type: Number,
        default: 0,
        min: 0,
      },

      goldTola: {
        type: Number,
        default: 0,
        min: 0,
      },

      goldOunce: {
        type: Number,
        default: 0,
        min: 0,
      },

      pricePerGram: {
        type: Number,
        default: 0,
      },

      pricePerTola: {
        type: Number,
        default: 0,
      },

      marketPrice: {
        type: Number,
        default: 0,
      },

      spread: {
        type: Number,
        default: 0,
      },

      spreadPercentage: {
        type: Number,
        default: 0,
      },

      totalAmount: {
        type: Number,
        default: 0,
      },

      executionPrice: {
        type: Number,
        default: 0,
      },

      priceDifference: {
        type: Number,
        default: 0,
      },

      realizedProfit: {
        type: Number,
        default: 0,
      },

      unrealizedProfit: {
        type: Number,
        default: 0,
      },

      profitPercentage: {
        type: Number,
        default: 0,
      },
    },

    // ==================================================
    // MARKET SNAPSHOT
    // ==================================================

    marketSnapshot: {
      buyPrice: {
        type: Number,
        default: 0,
      },

      sellPrice: {
        type: Number,
        default: 0,
      },

      internationalGoldPrice: {
        type: Number,
        default: 0,
      },

      usdPkrRate: {
        type: Number,
        default: 0,
      },

      marketStatus: {
        type: String,
        enum: ["OPEN", "CLOSED", "PAUSED"],
        default: "OPEN",
      },

      sessionName: {
        type: String,
        enum: [
          "ASIA",
          "LONDON",
          "NEW_YORK",
          "PAKISTAN",
          "OFF_MARKET",
        ],
        default: "PAKISTAN",
      },

      snapshotTime: {
        type: Date,
        default: Date.now,
      },
    },

    // ==================================================
    // TRADE EXECUTION DETAILS
    // ==================================================

    execution: {
      executionStatus: {
        type: String,
        enum: [
          "PENDING",
          "EXECUTED",
          "PARTIALLY_EXECUTED",
          "FAILED",
          "CANCELLED",
        ],
        default: "PENDING",
      },

      executedQuantity: {
        type: Number,
        default: 0,
      },

      remainingQuantity: {
        type: Number,
        default: 0,
      },

      executedPrice: {
        type: Number,
        default: 0,
      },

      executionTime: {
        type: Date,
      },

      executionLatencyMs: {
        type: Number,
        default: 0,
      },

      orderSource: {
        type: String,
        enum: ["MOBILE", "WEB", "ADMIN", "SYSTEM"],
        default: "MOBILE",
      },
    },

    // ==================================================
    // TRADING SESSION INFORMATION
    // ==================================================

    session: {
      tradingSessionId: {
        type: String,
        default: "",
      },

      marketOpenTime: {
        type: Date,
      },

      marketCloseTime: {
        type: Date,
      },

      sessionDate: {
        type: Date,
        default: Date.now,
      },

      sessionVersion: {
        type: String,
        default: "V17",
      },
    },

// ======================================================
// END OF SECTION 4/10
// NEXT SECTION: ADMIN APPROVAL WORKFLOW SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/Transaction.ts
// SECTION 5/10
// ADMIN APPROVAL WORKFLOW SCHEMA
// ======================================================

    // ==================================================
    // ADMIN APPROVAL WORKFLOW
    // ==================================================

    approval: {
      currentStage: {
        type: String,
        enum: [
          "SUBMITTED",
          "UNDER_REVIEW",
          "PAYMENT_VERIFIED",
          "FINANCE_APPROVED",
          "FINAL_APPROVED",
          "REJECTED",
        ],
        default: "SUBMITTED",
        index: true,
      },

      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      approvedAt: {
        type: Date,
      },

      rejectedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      rejectedAt: {
        type: Date,
      },

      rejectionReason: {
        type: String,
        default: "",
        trim: true,
      },

      adminNotes: {
        type: String,
        default: "",
        trim: true,
      },

      reviewStartedAt: {
        type: Date,
      },

      reviewCompletedAt: {
        type: Date,
      },

      financeManager: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      kycVerifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      paymentVerifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      paymentVerifiedAt: {
        type: Date,
      },

      finalApprovedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      finalApprovedAt: {
        type: Date,
      },
    },

    // ==================================================
    // APPROVAL TIMELINE
    // ==================================================

    approvalTimeline: [
      {
        stage: {
          type: String,
          required: true,
        },

        action: {
          type: String,
          enum: [
            "CREATED",
            "UNDER_REVIEW",
            "PAYMENT_VERIFIED",
            "APPROVED",
            "REJECTED",
            "CANCELLED",
            "COMPLETED",
          ],
          required: true,
        },

        performedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        notes: {
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
    // PAYMENT VERIFICATION
    // ==================================================

    verification: {
      paymentVerified: {
        type: Boolean,
        default: false,
      },

      receiptVerified: {
        type: Boolean,
        default: false,
      },

      amountMatched: {
        type: Boolean,
        default: false,
      },

      senderMatched: {
        type: Boolean,
        default: false,
      },

      bankVerified: {
        type: Boolean,
        default: false,
      },

      verificationScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },

    // ==================================================
    // SLA / PROCESSING METRICS
    // ==================================================

    processingMetrics: {
      submittedAt: {
        type: Date,
        default: Date.now,
      },

      firstReviewedAt: {
        type: Date,
      },

      completedAt: {
        type: Date,
      },

      totalProcessingMinutes: {
        type: Number,
        default: 0,
      },

      priority: {
        type: String,
        enum: ["LOW", "NORMAL", "HIGH", "URGENT"],
        default: "NORMAL",
      },
    },

// ======================================================
// END OF SECTION 5/10
// NEXT SECTION: AML + FRAUD + SECURITY SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/Transaction.ts
// SECTION 6/10
// AML + FRAUD + SECURITY SCHEMA
// ======================================================

    // ==================================================
    // SECURITY INFORMATION
    // ==================================================

    security: {
      ipAddress: {
        type: String,
        default: "",
        index: true,
      },

      device: {
        type: String,
        default: "",
      },

      browser: {
        type: String,
        default: "",
      },

      operatingSystem: {
        type: String,
        default: "",
      },

      userAgent: {
        type: String,
        default: "",
      },

      country: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        default: "",
      },

      timezone: {
        type: String,
        default: "",
      },

      latitude: {
        type: Number,
        default: 0,
      },

      longitude: {
        type: Number,
        default: 0,
      },

      loginSessionId: {
        type: String,
        default: "",
      },

      riskLevel: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "LOW",
        index: true,
      },

      riskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      amlFlag: {
        type: Boolean,
        default: false,
        index: true,
      },

      fraudFlag: {
        type: Boolean,
        default: false,
        index: true,
      },

      suspiciousActivity: {
        type: Boolean,
        default: false,
      },

      vpnDetected: {
        type: Boolean,
        default: false,
      },

      proxyDetected: {
        type: Boolean,
        default: false,
      },

      torDetected: {
        type: Boolean,
        default: false,
      },

      newDeviceDetected: {
        type: Boolean,
        default: false,
      },

      impossibleTravelDetected: {
        type: Boolean,
        default: false,
      },

      velocityCheckFailed: {
        type: Boolean,
        default: false,
      },

      duplicateTransactionDetected: {
        type: Boolean,
        default: false,
      },
    },

    // ==================================================
    // AML COMPLIANCE
    // ==================================================

    amlCompliance: {
      amlStatus: {
        type: String,
        enum: [
          "CLEAR",
          "REVIEW_REQUIRED",
          "ESCALATED",
          "BLOCKED",
        ],
        default: "CLEAR",
      },

      complianceScore: {
        type: Number,
        default: 100,
        min: 0,
        max: 100,
      },

      sanctionsScreened: {
        type: Boolean,
        default: false,
      },

      sanctionsMatched: {
        type: Boolean,
        default: false,
      },

      pepScreened: {
        type: Boolean,
        default: false,
      },

      pepMatched: {
        type: Boolean,
        default: false,
      },

      sourceOfFundsVerified: {
        type: Boolean,
        default: false,
      },

      manualComplianceReview: {
        type: Boolean,
        default: false,
      },

      reviewedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      reviewedAt: {
        type: Date,
      },

      complianceNotes: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // FRAUD DETECTION
    // ==================================================

    fraudDetection: {
      duplicateAmountCount: {
        type: Number,
        default: 0,
      },

      transactionsLastHour: {
        type: Number,
        default: 0,
      },

      transactionsLast24Hours: {
        type: Number,
        default: 0,
      },

      unusualAmount: {
        type: Boolean,
        default: false,
      },

      unusualLocation: {
        type: Boolean,
        default: false,
      },

      unusualDevice: {
        type: Boolean,
        default: false,
      },

      accountTakeoverRisk: {
        type: Boolean,
        default: false,
      },

      highValueTransaction: {
        type: Boolean,
        default: false,
      },

      flaggedReason: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // COMPLIANCE HOLD
    // ==================================================

    complianceHold: {
      onHold: {
        type: Boolean,
        default: false,
      },

      holdReason: {
        type: String,
        default: "",
      },

      holdPlacedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      holdPlacedAt: {
        type: Date,
      },

      releasedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      releasedAt: {
        type: Date,
      },
    },

// ======================================================
// END OF SECTION 6/10
// NEXT SECTION: AUDIT TRAIL + NOTES SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/Transaction.ts
// SECTION 7/10
// AUDIT TRAIL + NOTES + NOTIFICATION + RECONCILIATION
// ======================================================

    // ==================================================
    // AUDIT TRAIL
    // ==================================================

    auditTrail: [
      {
        action: {
          type: String,
          required: true,
          enum: [
            "CREATED",
            "UPDATED",
            "UNDER_REVIEW",
            "PAYMENT_VERIFIED",
            "APPROVED",
            "REJECTED",
            "CANCELLED",
            "COMPLETED",
            "ON_HOLD",
            "RELEASED",
          ],
        },

        previousStatus: {
          type: String,
          default: "",
        },

        newStatus: {
          type: String,
          default: "",
        },

        performedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        role: {
          type: String,
          default: "",
        },

        notes: {
          type: String,
          default: "",
          trim: true,
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
        },
      },
    ],

    // ==================================================
    // ADMIN NOTES
    // ==================================================

    adminNotesHistory: [
      {
        admin: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        department: {
          type: String,
          enum: [
            "SUPPORT",
            "FINANCE",
            "KYC",
            "OPERATIONS",
            "SUPER_ADMIN",
          ],
          default: "SUPPORT",
        },

        note: {
          type: String,
          required: true,
          trim: true,
        },

        internalOnly: {
          type: Boolean,
          default: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==================================================
    // USER NOTES
    // ==================================================

    userNotes: [
      {
        message: {
          type: String,
          trim: true,
          required: true,
        },

        attachment: {
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
    // NOTIFICATION HISTORY
    // ==================================================

    notifications: {
      userNotified: {
        type: Boolean,
        default: false,
      },

      adminNotified: {
        type: Boolean,
        default: false,
      },

      emailSent: {
        type: Boolean,
        default: false,
      },

      smsSent: {
        type: Boolean,
        default: false,
      },

      pushSent: {
        type: Boolean,
        default: false,
      },

      whatsappSent: {
        type: Boolean,
        default: false,
      },

      lastNotificationAt: {
        type: Date,
      },

      notificationHistory: [
        {
          channel: {
            type: String,
            enum: [
              "EMAIL",
              "SMS",
              "PUSH",
              "WHATSAPP",
              "SYSTEM",
            ],
          },

          status: {
            type: String,
            enum: ["SENT", "FAILED", "PENDING"],
            default: "PENDING",
          },

          messageId: {
            type: String,
            default: "",
          },

          sentAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // ==================================================
    // RECONCILIATION HISTORY
    // ==================================================

    reconciliation: {
      reconciled: {
        type: Boolean,
        default: false,
      },

      reconciledBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      reconciledAt: {
        type: Date,
      },

      reconciliationStatus: {
        type: String,
        enum: [
          "PENDING",
          "MATCHED",
          "MISMATCH",
          "MANUAL_REVIEW",
        ],
        default: "PENDING",
      },

      bankReferenceMatched: {
        type: Boolean,
        default: false,
      },

      amountMatched: {
        type: Boolean,
        default: false,
      },

      notes: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // SYSTEM METADATA
    // ==================================================

    metadata: {
      apiVersion: {
        type: String,
        default: "V17",
      },

      appVersion: {
        type: String,
        default: "1.0.0",
      },

      environment: {
        type: String,
        enum: ["PRODUCTION", "STAGING", "DEVELOPMENT"],
        default: "PRODUCTION",
      },

      tags: [
        {
          type: String,
          trim: true,
        },
      ],
    },
  }
);

// ======================================================
// END OF SECTION 7/10
// NEXT SECTION: INDEXES + VIRTUAL FIELDS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/Transaction.ts
// SECTION 8/10
// INDEXES + VIRTUAL FIELDS
// ======================================================

// ======================================================
// PRIMARY DATABASE INDEXES
// ======================================================

TransactionSchema.index({ transactionId: 1 }, { unique: true });
TransactionSchema.index({ referenceNumber: 1 });
TransactionSchema.index({ externalReference: 1 });

// ======================================================
// USER & WALLET INDEXES
// ======================================================

TransactionSchema.index({ user: 1, transactionDate: -1 });
TransactionSchema.index({ wallet: 1, transactionDate: -1 });

// ======================================================
// TRANSACTION FILTER INDEXES
// ======================================================

TransactionSchema.index({ type: 1, status: 1 });
TransactionSchema.index({ status: 1, transactionDate: -1 });
TransactionSchema.index({ "payment.method": 1 });

// ======================================================
// ADMIN WORKFLOW INDEXES
// ======================================================

TransactionSchema.index({ "approval.currentStage": 1 });
TransactionSchema.index({ "approval.approvedBy": 1 });
TransactionSchema.index({ "approval.rejectedBy": 1 });

// ======================================================
// SECURITY / AML INDEXES
// ======================================================

TransactionSchema.index({ "security.riskLevel": 1 });
TransactionSchema.index({ "security.amlFlag": 1 });
TransactionSchema.index({ "security.fraudFlag": 1 });

// ======================================================
// PAYMENT SEARCH INDEXES
// ======================================================

TransactionSchema.index({ "payment.transactionReference": 1 });
TransactionSchema.index({ "crypto.txHash": 1 });
TransactionSchema.index({ "bankTransfer.iban": 1 });

// ======================================================
// FULL TEXT SEARCH INDEX
// ======================================================

TransactionSchema.index({
  title: "text",
  description: "text",
  remarks: "text",
  "payment.senderName": "text",
  "payment.receiverName": "text",
  transactionId: "text",
});

// ======================================================
// VIRTUAL : TOTAL DEDUCTION
// ======================================================

TransactionSchema.virtual("totalDeduction").get(function () {
  return this.fee + this.tax - this.discount;
});

// ======================================================
// VIRTUAL : FINAL RECEIVED AMOUNT
// ======================================================

TransactionSchema.virtual("finalAmount").get(function () {
  return this.amount - this.fee - this.tax + this.discount;
});

// ======================================================
// VIRTUAL : IS GOLD TRADE
// ======================================================

TransactionSchema.virtual("isGoldTrade").get(function () {
  return (
    this.type === TransactionType.BUY_GOLD ||
    this.type === TransactionType.SELL_GOLD
  );
});

// ======================================================
// VIRTUAL : IS DEPOSIT
// ======================================================

TransactionSchema.virtual("isDeposit").get(function () {
  return this.type === TransactionType.DEPOSIT;
});

// ======================================================
// VIRTUAL : IS WITHDRAWAL
// ======================================================

TransactionSchema.virtual("isWithdrawal").get(function () {
  return this.type === TransactionType.WITHDRAWAL;
});

// ======================================================
// VIRTUAL : IS SUCCESSFUL
// ======================================================

TransactionSchema.virtual("isSuccessful").get(function () {
  return (
    this.status === TransactionStatus.APPROVED ||
    this.status === TransactionStatus.COMPLETED
  );
});

// ======================================================
// VIRTUAL : IS PENDING REVIEW
// ======================================================

TransactionSchema.virtual("requiresReview").get(function () {
  return (
    this.status === TransactionStatus.UNDER_REVIEW ||
    this.approval.currentStage === "UNDER_REVIEW"
  );
});

// ======================================================
// VIRTUAL : PROCESSING TIME (MINUTES)
// ======================================================

TransactionSchema.virtual("processingMinutes").get(function () {
  if (!this.completedAt) return null;

  const diff =
    this.completedAt.getTime() -
    this.transactionDate.getTime();

  return Math.round(diff / (1000 * 60));
});

// ======================================================
// VIRTUAL : GOLD TRADE VALUE
// ======================================================

TransactionSchema.virtual("goldTradeValue").get(function () {
  if (!this.goldTrade) return 0;

  return (
    this.goldTrade.goldGrams *
    this.goldTrade.pricePerGram
  );
});

// ======================================================
// VIRTUAL : TRANSACTION SUMMARY
// ======================================================

TransactionSchema.virtual("summary").get(function () {
  return {
    id: this.transactionId,
    type: this.type,
    status: this.status,
    amount: this.amount,
    paymentMethod: this.payment.method,
    date: this.transactionDate,
  };
});

// ======================================================
// JSON / OBJECT OPTIONS
// ======================================================

TransactionSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

TransactionSchema.set("toObject", {
  virtuals: true,
});

// ======================================================
// END OF SECTION 8/10
// NEXT SECTION: PRE-SAVE HOOKS + METHODS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/Transaction.ts
// SECTION 9/10
// PRE-SAVE HOOKS + METHODS
// ======================================================

// ======================================================
// AUTO GENERATE TRANSACTION ID
// FORMAT: GTTX-2026-A1B2C3D4
// ======================================================

TransactionSchema.pre<ITransaction>("save", function (next) {
  if (!this.transactionId) {
    const random = Math.random()
      .toString(16)
      .substring(2, 10)
      .toUpperCase();

    const year = new Date().getFullYear();

    this.transactionId = `GTTX-${year}-${random}`;
  }

  next();
});

// ======================================================
// AUTO CALCULATE NET AMOUNT
// ======================================================

TransactionSchema.pre<ITransaction>("save", function (next) {
  this.netAmount =
    this.amount -
    this.fee -
    this.tax +
    this.discount;

  next();
});

// ======================================================
// AUTO UPDATE COMPLETED DATE
// ======================================================

TransactionSchema.pre<ITransaction>("save", function (next) {
  if (
    this.status === TransactionStatus.APPROVED ||
    this.status === TransactionStatus.COMPLETED
  ) {
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  }

  next();
});

// ======================================================
// AUTO CALCULATE PROCESSING MINUTES
// ======================================================

TransactionSchema.pre<ITransaction>("save", function (next) {
  if (this.completedAt) {
    const diff =
      this.completedAt.getTime() -
      this.transactionDate.getTime();

    this.processingMetrics.totalProcessingMinutes =
      Math.round(diff / (1000 * 60));

    this.processingMetrics.completedAt =
      this.completedAt;
  }

  next();
});

// ======================================================
// UPDATE STATUS METHOD
// ======================================================

TransactionSchema.methods.updateStatus = async function (
  status: TransactionStatus
): Promise<ITransaction> {
  this.status = status;

  if (
    status === TransactionStatus.APPROVED ||
    status === TransactionStatus.COMPLETED
  ) {
    this.completedAt = new Date();
  }

  if (status === TransactionStatus.REJECTED) {
    this.approval.rejectedAt = new Date();
  }

  return this.save();
};

// ======================================================
// ADD AUDIT ENTRY METHOD
// ======================================================

TransactionSchema.methods.addAuditEntry = async function ({
  action,
  performedBy,
  role,
  notes,
  ipAddress,
  device,
}: {
  action: string;
  performedBy?: mongoose.Types.ObjectId;
  role?: string;
  notes?: string;
  ipAddress?: string;
  device?: string;
}) {
  this.auditTrail.unshift({
    action,
    previousStatus: this.status,
    newStatus: this.status,
    performedBy,
    role,
    notes,
    ipAddress,
    device,
    createdAt: new Date(),
  });

  if (this.auditTrail.length > 200) {
    this.auditTrail = this.auditTrail.slice(0, 200);
  }

  return this.save();
};

// ======================================================
// ADD APPROVAL TIMELINE METHOD
// ======================================================

TransactionSchema.methods.addApprovalStage = async function ({
  stage,
  action,
  performedBy,
  notes,
}: {
  stage: string;
  action: string;
  performedBy?: mongoose.Types.ObjectId;
  notes?: string;
}) {
  this.approval.currentStage = stage;

  this.approvalTimeline.unshift({
    stage,
    action,
    performedBy,
    notes,
    createdAt: new Date(),
  });

  if (this.approvalTimeline.length > 100) {
    this.approvalTimeline =
      this.approvalTimeline.slice(0, 100);
  }

  return this.save();
};

// ======================================================
// APPROVE TRANSACTION METHOD
// ======================================================

TransactionSchema.methods.approveTransaction =
  async function (
    adminId: mongoose.Types.ObjectId,
    notes = ""
  ) {
    this.status = TransactionStatus.APPROVED;

    this.approval.approvedBy = adminId;
    this.approval.approvedAt = new Date();
    this.approval.adminNotes = notes;
    this.approval.currentStage = "FINAL_APPROVED";

    return this.save();
  };

// ======================================================
// REJECT TRANSACTION METHOD
// ======================================================

TransactionSchema.methods.rejectTransaction =
  async function (
    adminId: mongoose.Types.ObjectId,
    reason: string
  ) {
    this.status = TransactionStatus.REJECTED;

    this.approval.rejectedBy = adminId;
    this.approval.rejectedAt = new Date();
    this.approval.rejectionReason = reason;
    this.approval.currentStage = "REJECTED";

    return this.save();
  };

// ======================================================
// UPDATE RISK SCORE METHOD
// ======================================================

TransactionSchema.methods.updateRiskScore =
  async function () {
    let score = 0;

    if (this.security.vpnDetected) score += 15;
    if (this.security.proxyDetected) score += 10;
    if (this.security.torDetected) score += 30;
    if (this.security.newDeviceDetected) score += 10;
    if (this.security.impossibleTravelDetected)
      score += 25;
    if (this.security.velocityCheckFailed)
      score += 20;
    if (
      this.fraudDetection.highValueTransaction
    )
      score += 15;

    this.security.riskScore = Math.min(score, 100);

    if (score >= 75) {
      this.security.riskLevel = "CRITICAL";
    } else if (score >= 50) {
      this.security.riskLevel = "HIGH";
    } else if (score >= 25) {
      this.security.riskLevel = "MEDIUM";
    } else {
      this.security.riskLevel = "LOW";
    }

    return this.save();
  };

// ======================================================
// LIMIT AUDIT / NOTES HISTORY
// ======================================================

TransactionSchema.pre<ITransaction>("save", function (next) {
  if (this.adminNotesHistory.length > 200) {
    this.adminNotesHistory =
      this.adminNotesHistory.slice(0, 200);
  }

  if (this.userNotes.length > 100) {
    this.userNotes =
      this.userNotes.slice(0, 100);
  }

  next();
});

// ======================================================
// END OF SECTION 9/10
// NEXT SECTION: MODEL EXPORT + FINAL SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/Transaction.ts
// SECTION 10/10
// FINAL SCHEMA OPTIONS + MODEL EXPORT
// ======================================================

// ======================================================
// SCHEMA OPTIONS
// ======================================================

TransactionSchema.set("timestamps", true);

TransactionSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

TransactionSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
});

// ======================================================
// INSTANCE METHODS INTERFACE
// ======================================================

export interface ITransactionMethods {
  updateStatus(status: TransactionStatus): Promise<ITransaction>;

  approveTransaction(
    adminId: mongoose.Types.ObjectId,
    notes?: string
  ): Promise<ITransaction>;

  rejectTransaction(
    adminId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<ITransaction>;

  addAuditEntry(data: {
    action: string;
    performedBy?: mongoose.Types.ObjectId;
    role?: string;
    notes?: string;
    ipAddress?: string;
    device?: string;
  }): Promise<ITransaction>;

  addApprovalStage(data: {
    stage: string;
    action: string;
    performedBy?: mongoose.Types.ObjectId;
    notes?: string;
  }): Promise<ITransaction>;

  updateRiskScore(): Promise<ITransaction>;
}

// ======================================================
// STATIC METHODS INTERFACE
// ======================================================

export interface ITransactionModel extends Model<ITransaction> {
  findByTransactionId(
    transactionId: string
  ): Promise<ITransaction | null>;

  findPendingTransactions(): Promise<ITransaction[]>;

  findUserTransactions(
    userId: mongoose.Types.ObjectId
  ): Promise<ITransaction[]>;
}

// ======================================================
// STATIC METHODS
// ======================================================

TransactionSchema.statics.findByTransactionId =
  function (transactionId: string) {
    return this.findOne({
      transactionId: transactionId.toUpperCase(),
    });
  };

TransactionSchema.statics.findPendingTransactions =
  function () {
    return this.find({
      status: TransactionStatus.PENDING,
    }).sort({ transactionDate: -1 });
  };

TransactionSchema.statics.findUserTransactions =
  function (userId: mongoose.Types.ObjectId) {
    return this.find({
      user: userId,
    }).sort({ transactionDate: -1 });
  };

// ======================================================
// CREATE MODEL
// ======================================================

const Transaction =
  (mongoose.models.Transaction as ITransactionModel) ||
  mongoose.model<ITransaction, ITransactionModel>(
    "Transaction",
    TransactionSchema
  );

// ======================================================
// EXPORT MODEL
// ======================================================

export default Transaction;

// ======================================================
// END OF FILE
// backend/src/models/Transaction.ts
// GOLDTRADE V17 ENTERPRISE TRANSACTION MODEL COMPLETE
// ======================================================