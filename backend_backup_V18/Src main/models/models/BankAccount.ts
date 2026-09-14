// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/BankAccount.ts
// SECTION 1/10 (UPDATED)
// IMPORTS + PAYMENT ENUMS + INTERFACES
// ======================================================

import mongoose, { Schema, Document, Model } from "mongoose";
import crypto from "crypto";

// ======================================================
// ACCOUNT TYPE
// ======================================================

export enum AccountType {
  BANK = "BANK",
  DIGITAL_WALLET = "DIGITAL_WALLET",
  INTERNATIONAL = "INTERNATIONAL",
  CRYPTO = "CRYPTO",
  RAAST = "RAAST",
}

// ======================================================
// ACCOUNT STATUS
// ======================================================

export enum BankAccountStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
  BLOCKED = "BLOCKED",
  SUSPENDED = "SUSPENDED",
}

// ======================================================
// PAKISTAN BANKS
// ======================================================

export enum PakistanBank {
  HBL = "HBL",
  MEEZAN_BANK = "MEEZAN_BANK",
  UBL = "UBL",
  MCB = "MCB",
  BANK_AL_HABIB = "BANK_AL_HABIB",
  ALLIED_BANK = "ALLIED_BANK",
  BANK_ALFALAH = "BANK_ALFALAH",
  ASKARI_BANK = "ASKARI_BANK",
  FAYSAL_BANK = "FAYSAL_BANK",
  HABIB_METRO = "HABIB_METRO",
  JS_BANK = "JS_BANK",
  SONERI_BANK = "SONERI_BANK",
  SILK_BANK = "SILK_BANK",
  NBP = "NBP",
  BANK_ISLAMI = "BANK_ISLAMI",
  STANDARD_CHARTERED = "STANDARD_CHARTERED",
  OTHER = "OTHER",
}

// ======================================================
// DIGITAL PAYMENT PROVIDERS
// ======================================================

export enum DigitalWalletProvider {
  JAZZCASH = "JAZZCASH",
  EASYPAISA = "EASYPAISA",
  NAYA_PAY = "NAYA_PAY",
  SADA_PAY = "SADA_PAY",
  RAAST = "RAAST",
  GOOGLE_PAY = "GOOGLE_PAY",
}

// ======================================================
// INTERNATIONAL PAYMENT PROVIDERS
// ======================================================

export enum InternationalProvider {
  PAYONEER = "PAYONEER",
  STRIPE = "STRIPE",
  WISE = "WISE",
  PAYPAL = "PAYPAL",
  REVOLUT = "REVOLUT",
}

// ======================================================
// CRYPTO NETWORKS
// ======================================================

export enum CryptoNetwork {
  TRC20 = "TRC20",
  ERC20 = "ERC20",
  BEP20 = "BEP20",
  SOLANA = "SOLANA",
  POLYGON = "POLYGON",
  BITCOIN = "BITCOIN",
  ARBITRUM = "ARBITRUM",
  OPTIMISM = "OPTIMISM",
}

// ======================================================
// CRYPTO CURRENCIES
// ======================================================

export enum CryptoCurrency {
  USDT = "USDT",
  BTC = "BTC",
  ETH = "ETH",
  BNB = "BNB",
  SOL = "SOL",
  XRP = "XRP",
  DOGE = "DOGE",
  LTC = "LTC",
}

// ======================================================
// ACCOUNT OWNERSHIP
// ======================================================

export enum OwnershipType {
  PERSONAL = "PERSONAL",
  BUSINESS = "BUSINESS",
  JOINT = "JOINT",
}

// ======================================================
// ACCOUNT PURPOSE
// ======================================================

export enum AccountPurpose {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  BOTH = "BOTH",
}

// ======================================================
// VERIFICATION METHOD
// ======================================================

export enum VerificationMethod {
  IBAN = "IBAN",
  OTP = "OTP",
  MICRO_DEPOSIT = "MICRO_DEPOSIT",
  MANUAL = "MANUAL",
  RAAST = "RAAST",
}

// ======================================================
// SUPPORTED CURRENCIES
// ======================================================

export enum SupportedCurrency {
  PKR = "PKR",
  USD = "USD",
  AED = "AED",
  EUR = "EUR",
  GBP = "GBP",
  USDT = "USDT",
  BTC = "BTC",
  ETH = "ETH",
}

// ======================================================
// BANK ACCOUNT DETAILS
// ======================================================

export interface IBankDetails {
  bankName: PakistanBank;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branchCode?: string;
  branchName?: string;
  swiftCode?: string;
}

// ======================================================
// DIGITAL WALLET DETAILS
// ======================================================

export interface IDigitalWalletDetails {
  provider: DigitalWalletProvider;
  walletId?: string;
  mobileNumber: string;
  accountTitle: string;
  verified: boolean;
}

// ======================================================
// INTERNATIONAL ACCOUNT DETAILS
// ======================================================

export interface IInternationalAccount {
  provider: InternationalProvider;
  accountEmail?: string;
  customerId?: string;
  merchantId?: string;
  verified: boolean;
}

// ======================================================
// CRYPTO WALLET DETAILS
// ======================================================

export interface ICryptoWallet {
  currency: CryptoCurrency;
  network: CryptoNetwork;
  walletAddress: string;
  memoTag?: string;
  provider?: string;
  verified: boolean;
}

// ======================================================
// TRANSACTION LIMITS
// ======================================================

export interface IAccountLimits {
  dailyDepositLimit: number;
  dailyWithdrawalLimit: number;
  monthlyDepositLimit: number;
  monthlyWithdrawalLimit: number;
}

// ======================================================
// VERIFICATION INFO
// ======================================================

export interface IVerificationInfo {
  status: BankAccountStatus;
  method: VerificationMethod;
  verifiedAt?: Date;
  verifiedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
}

// ======================================================
// AUDIT LOG ENTRY
// ======================================================

export interface IBankAuditEntry {
  action: string;
  performedBy?: mongoose.Types.ObjectId;
  notes?: string;
  ipAddress?: string;
  createdAt: Date;
}

// ======================================================
// MAIN BANK ACCOUNT DOCUMENT
// ======================================================

export interface IBankAccount extends Document {
  [key: string]: any;

  accountId: string;
  nickname?: string;
  user: mongoose.Types.ObjectId;

  accountType: AccountType;
  ownershipType: OwnershipType;
  purpose: AccountPurpose;
  currency: SupportedCurrency;

  isPrimary: boolean;
  isActive: boolean;
  isDefaultDeposit: boolean;
  isDefaultWithdrawal: boolean;

  status: BankAccountStatus;

  supportedCurrencies: SupportedCurrency[];
  tags: string[];
  notes: string;

  display: {
    bankLogo: string;
    accountColor: string;
    accountIcon: string;
  };

  bankDetails?: IBankDetails;
  digitalWallet?: IDigitalWalletDetails;
  internationalAccount?: IInternationalAccount;
  cryptoWallet?: ICryptoWallet;

  limits: IAccountLimits;
  verification: IVerificationInfo;
  auditTrail: IBankAuditEntry[];

  verifyAccount(adminId: mongoose.Types.ObjectId): Promise<IBankAccount>;
  rejectAccount(
    adminId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<IBankAccount>;
  freezeAccount(
    adminId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<IBankAccount>;
  unfreezeAccount(adminId: mongoose.Types.ObjectId): Promise<IBankAccount>;
  makePrimary(): Promise<IBankAccount>;
  validateIBAN(): boolean;
  validateMobileWallet(): boolean;
  validateRaast(): boolean;
  validateCryptoWallet(): boolean;
  calculateRisk(): number;
  resetDailyLimits(): void;
  consumeDepositLimit(amount: number): void;
  consumeWithdrawalLimit(amount: number): void;
}// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/BankAccount.ts
// SECTION 2/10
// BASIC BANK ACCOUNT SCHEMA
// ======================================================

const BankAccountSchema = new Schema<any>(
  {
    // ==================================================
    // USER RELATIONSHIP
    // ==================================================

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==================================================
    // ACCOUNT IDENTIFICATION
    
    // ==================================================

    accountId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    nickname: {
      type: String,
      default: "",
      trim: true,
      maxlength: 40,
    },

    accountType: {
      type: String,
      enum: Object.values(AccountType),
      required: true,
      index: true,
    },

    ownershipType: {
      type: String,
      enum: Object.values(OwnershipType),
      default: OwnershipType.PERSONAL,
    },

    purpose: {
      type: String,
      enum: Object.values(AccountPurpose),
      default: AccountPurpose.BOTH,
    },

    // ==================================================
    // ACCOUNT STATUS
    // ==================================================

    status: {
      type: String,
      enum: Object.values(BankAccountStatus),
      default: BankAccountStatus.PENDING,
      index: true,
    },

    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDefaultDeposit: {
      type: Boolean,
      default: false,
    },

    isDefaultWithdrawal: {
      type: Boolean,
      default: false,
    },

    // ==================================================
    // MULTI-CURRENCY SUPPORT
    // ==================================================

    currency: {
      type: String,
      enum: Object.values(SupportedCurrency),
      default: SupportedCurrency.PKR,
      index: true,
    },

    supportedCurrencies: [
      {
        type: String,
        enum: Object.values(SupportedCurrency),
      },
    ],

    // ==================================================
    // ACCOUNT LABELS
    // ==================================================

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    notes: {
      type: String,
      default: "",
      maxlength: 500,
    },

    // ==================================================
    // DISPLAY INFORMATION
    // ==================================================

    display: {
      bankLogo: {
        type: String,
        default: "",
      },

      accountColor: {
        type: String,
        default: "#16A34A",
      },

      accountIcon: {
        type: String,
        default: "bank",
      },
    },

    // ==================================================
    // ACCOUNT LIMITS
    // ==================================================

    limits: {
      dailyDepositLimit: {
        type: Number,
        default: 1000000,
        min: 0,
      },

      dailyWithdrawalLimit: {
        type: Number,
        default: 1000000,
        min: 0,
      },

      monthlyDepositLimit: {
        type: Number,
        default: 10000000,
        min: 0,
      },

      monthlyWithdrawalLimit: {
        type: Number,
        default: 10000000,
        min: 0,
      },

      singleTransactionLimit: {
        type: Number,
        default: 500000,
        min: 0,
      },
    },

    // ==================================================
    // ACCOUNT VERIFICATION
    // ==================================================

    verification: {
      status: {
        type: String,
        enum: Object.values(BankAccountStatus),
        default: BankAccountStatus.PENDING,
      },

      method: {
        type: String,
        enum: Object.values(VerificationMethod),
        default: VerificationMethod.MANUAL,
      },

      verifiedAt: Date,

      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      rejectionReason: {
        type: String,
        default: "",
      },

      verificationAttempts: {
        type: Number,
        default: 0,
      },

      maxVerificationAttempts: {
        type: Number,
        default: 5,
      },
    },

    // ==================================================
    // ACCOUNT USAGE STATISTICS
    // ==================================================

    statistics: {
      totalDeposits: {
        type: Number,
        default: 0,
      },

      totalWithdrawals: {
        type: Number,
        default: 0,
      },

      depositCount: {
        type: Number,
        default: 0,
      },

      withdrawalCount: {
        type: Number,
        default: 0,
      },

      lastDepositAt: Date,

      lastWithdrawalAt: Date,

      lastTransactionAt: Date,
    },

    // ==================================================
    // DEVICE / SOURCE INFORMATION
    // ==================================================

    metadata: {
      createdFrom: {
        type: String,
        enum: ["WEB", "ANDROID", "IOS", "ADMIN_PANEL", "API"],
        default: "WEB",
      },

      appVersion: {
        type: String,
        default: "1.0.0",
      },

      ipAddress: {
        type: String,
        default: "",
      },

      deviceId: {
        type: String,
        default: "",
      },

      deviceName: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // TIMESTAMPS
    // ==================================================

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    activatedAt: Date,

    suspendedAt: Date,

    deletedAt: Date,// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/BankAccount.ts
// SECTION 3/10
// PAKISTAN BANKS + IBAN + RAAST DETAILS
// ======================================================

    // ==================================================
    // BANK ACCOUNT DETAILS
    // ==================================================

    bankDetails: {
      bankName: {
        type: String,
        enum: Object.values(PakistanBank),
        default: PakistanBank.OTHER,
        index: true,
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
        index: true,
      },

      iban: {
        type: String,
        default: "",
        uppercase: true,
        trim: true,
        index: true,
      },

      branchName: {
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

      accountHolderCNIC: {
        type: String,
        default: "",
      },

      accountHolderPhone: {
        type: String,
        default: "",
      },

      accountHolderEmail: {
        type: String,
        default: "",
      },

      // ==========================================
      // IBAN VALIDATION
      // ==========================================

      ibanValidation: {
        valid: {
          type: Boolean,
          default: false,
        },

        checksumValid: {
          type: Boolean,
          default: false,
        },

        countryCode: {
          type: String,
          default: "PK",
        },

        bankCode: {
          type: String,
          default: "",
        },

        branchIdentifier: {
          type: String,
          default: "",
        },

        validatedAt: Date,
      },

      // ==========================================
      // BANK VERIFICATION
      // ==========================================

      bankVerification: {
        verified: {
          type: Boolean,
          default: false,
        },

        verifiedAt: Date,

        verificationReference: {
          type: String,
          default: "",
        },

        verificationMethod: {
          type: String,
          enum: ["IBAN", "MICRO_DEPOSIT", "MANUAL", "OTP"],
          default: "MANUAL",
        },

        microDepositAmount: {
          type: Number,
          default: 0,
        },

        microDepositVerified: {
          type: Boolean,
          default: false,
        },
      },
    },

    // ==================================================
    // RAAST DETAILS
    // ==================================================

    raastDetails: {
      enabled: {
        type: Boolean,
        default: false,
      },

      raastId: {
        type: String,
        default: "",
        trim: true,
        index: true,
      },

      linkedMobileNumber: {
        type: String,
        default: "",
      },

      linkedIBAN: {
        type: String,
        default: "",
      },

      linkedBank: {
        type: String,
        enum: Object.values(PakistanBank),
        default: PakistanBank.OTHER,
      },

      aliasType: {
        type: String,
        enum: ["MOBILE", "IBAN", "CNIC"],
        default: "MOBILE",
      },

      verified: {
        type: Boolean,
        default: false,
      },

      verifiedAt: Date,

      active: {
        type: Boolean,
        default: true,
      },
    },

    // ==================================================
    // PAKISTAN BANK METADATA
    // ==================================================

    pakistanBankMetadata: {
      isIslamicBank: {
        type: Boolean,
        default: false,
      },

      supportsRaast: {
        type: Boolean,
        default: true,
      },

      supportsIBAN: {
        type: Boolean,
        default: true,
      },

      supportsInstantTransfer: {
        type: Boolean,
        default: true,
      },

      supportsWithdrawals: {
        type: Boolean,
        default: true,
      },

      supportsDeposits: {
        type: Boolean,
        default: true,
      },
    },

    // ==================================================
    // BANK ACCOUNT HISTORY
    // ==================================================

    bankHistory: [
      {
        bankName: {
          type: String,
          enum: Object.values(PakistanBank),
        },

        accountNumber: String,

        iban: String,

        changedAt: {
          type: Date,
          default: Date.now,
        },

        changedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        reason: String,
      },
    ],// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/BankAccount.ts
// SECTION 4/10
// DIGITAL WALLETS + INTERNATIONAL PAYMENT GATEWAYS
// ======================================================

    // ==================================================
    // DIGITAL WALLET DETAILS
    // JazzCash, EasyPaisa, NayaPay, SadaPay, Google Pay
    // ==================================================

    digitalWallet: {
      provider: {
        type: String,
        enum: Object.values(DigitalWalletProvider),
        index: true,
      },

      walletId: {
        type: String,
        default: "",
        trim: true,
      },

      mobileNumber: {
        type: String,
        default: "",
        trim: true,
        index: true,
      },

      accountTitle: {
        type: String,
        default: "",
        trim: true,
      },

      email: {
        type: String,
        default: "",
        lowercase: true,
        trim: true,
      },

      verified: {
        type: Boolean,
        default: false,
      },

      verifiedAt: Date,

      active: {
        type: Boolean,
        default: true,
      },

      // ===============================
      // OTP VERIFICATION
      // ===============================

      otpVerification: {
        otpVerified: {
          type: Boolean,
          default: false,
        },

        otpSentAt: Date,

        otpVerifiedAt: Date,

        verificationAttempts: {
          type: Number,
          default: 0,
        },

        maxAttempts: {
          type: Number,
          default: 5,
        },
      },

      // ===============================
      // QR PAYMENT SUPPORT
      // ===============================

      qrPayment: {
        qrEnabled: {
          type: Boolean,
          default: false,
        },

        qrCodeImage: {
          type: String,
          default: "",
        },

        qrReferenceId: {
          type: String,
          default: "",
        },

        lastGeneratedAt: Date,
      },
    },

    // ==================================================
    // INTERNATIONAL PAYMENT PROVIDERS
    // Payoneer, Stripe, Wise, PayPal, Revolut
    // ==================================================

    internationalAccount: {
      provider: {
        type: String,
        enum: Object.values(InternationalProvider),
        index: true,
      },

      accountEmail: {
        type: String,
        default: "",
        lowercase: true,
        trim: true,
      },

      customerId: {
        type: String,
        default: "",
      },

      merchantId: {
        type: String,
        default: "",
      },

      accountHolderName: {
        type: String,
        default: "",
      },

      accountCountry: {
        type: String,
        default: "",
      },

      accountCurrency: {
        type: String,
        enum: Object.values(SupportedCurrency),
        default: SupportedCurrency.USD,
      },

      verified: {
        type: Boolean,
        default: false,
      },

      verifiedAt: Date,

      active: {
        type: Boolean,
        default: true,
      },

      // ===============================
      // API / WEBHOOK SUPPORT
      // ===============================

      apiIntegration: {
        webhookEnabled: {
          type: Boolean,
          default: false,
        },

        webhookSecret: {
          type: String,
          default: "",
        },

        webhookUrl: {
          type: String,
          default: "",
        },

        apiKeyLastUpdated: Date,
      },
    },

    // ==================================================
    // PAYMENT GATEWAY FEATURES
    // ==================================================

    paymentGatewaySettings: {
      acceptsDeposits: {
        type: Boolean,
        default: true,
      },

      allowsWithdrawals: {
        type: Boolean,
        default: true,
      },

      instantSettlement: {
        type: Boolean,
        default: false,
      },

      settlementTimeHours: {
        type: Number,
        default: 24,
      },

      minimumDeposit: {
        type: Number,
        default: 0,
      },

      maximumDeposit: {
        type: Number,
        default: 5000000,
      },

      minimumWithdrawal: {
        type: Number,
        default: 500,
      },

      maximumWithdrawal: {
        type: Number,
        default: 5000000,
      },
    },

    // ==================================================
    // PROVIDER TRANSACTION METADATA
    // ==================================================

    providerMetadata: {
      providerAccountId: {
        type: String,
        default: "",
      },

      providerCustomerReference: {
        type: String,
        default: "",
      },

      providerStatus: {
        type: String,
        default: "ACTIVE",
      },

      lastSyncAt: Date,

      syncSuccessful: {
        type: Boolean,
        default: false,
      },

      syncFailureReason: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // DIGITAL WALLET HISTORY
    // ==================================================

    walletHistory: [
      {
        provider: {
          type: String,
          enum: Object.values(DigitalWalletProvider),
        },

        mobileNumber: String,

        accountTitle: String,

        verified: Boolean,

        changedAt: {
          type: Date,
          default: Date.now,
        },

        changedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        reason: String,
      },
    ],// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/BankAccount.ts
// SECTION 5/10
// ENTERPRISE CRYPTO WALLET SCHEMA
// ======================================================

    // ==================================================
    // CRYPTO WALLET DETAILS
    // ==================================================

    cryptoWallet: {
      currency: {
        type: String,
        enum: Object.values(CryptoCurrency),
        index: true,
      },

      network: {
        type: String,
        enum: Object.values(CryptoNetwork),
        index: true,
      },

      walletAddress: {
        type: String,
        default: "",
        trim: true,
        index: true,
      },

      memoTag: {
        type: String,
        default: "",
      },

      accountLabel: {
        type: String,
        default: "",
      },

      verified: {
        type: Boolean,
        default: false,
      },

      verifiedAt: Date,

      active: {
        type: Boolean,
        default: true,
      },

      // ==========================================
      // WALLET TYPE
      // ==========================================

      walletType: {
        type: String,
        enum: [
          "HOT_WALLET",
          "COLD_WALLET",
          "EXCHANGE_WALLET",
          "HARDWARE_WALLET",
        ],
        default: "HOT_WALLET",
      },

      provider: {
        type: String,
        enum: [
          "BINANCE",
          "BYBIT",
          "OKX",
          "TRUST_WALLET",
          "METAMASK",
          "LEDGER",
          "TREZOR",
          "OTHER",
        ],
        default: "OTHER",
      },

      // ==========================================
      // ADDRESS VALIDATION
      // ==========================================

      addressValidation: {
        validAddress: {
          type: Boolean,
          default: false,
        },

        checksumValid: {
          type: Boolean,
          default: false,
        },

        networkMatched: {
          type: Boolean,
          default: false,
        },

        validatedAt: Date,

        validationProvider: {
          type: String,
          default: "",
        },
      },

      // ==========================================
      // QR CODE SUPPORT
      // ==========================================

      qrCode: {
        enabled: {
          type: Boolean,
          default: true,
        },

        qrImage: {
          type: String,
          default: "",
        },

        generatedAt: Date,
      },

      // ==========================================
      // ADDRESS ROTATION
      // ==========================================

      depositAddressRotation: {
        enabled: {
          type: Boolean,
          default: false,
        },

        currentAddressIndex: {
          type: Number,
          default: 0,
        },

        rotationIntervalHours: {
          type: Number,
          default: 24,
        },

        lastRotatedAt: Date,
      },
    },

    // ==================================================
    // NETWORK CONFIGURATION
    // ==================================================

    networkConfiguration: {
      confirmationsRequired: {
        type: Number,
        default: 12,
      },

      minimumDepositAmount: {
        type: Number,
        default: 0,
      },

      minimumWithdrawalAmount: {
        type: Number,
        default: 0,
      },

      withdrawalFee: {
        type: Number,
        default: 0,
      },

      networkFeePaidByUser: {
        type: Boolean,
        default: true,
      },

      estimatedConfirmationMinutes: {
        type: Number,
        default: 10,
      },

      supportsMemoTag: {
        type: Boolean,
        default: false,
      },

      supportsSmartContract: {
        type: Boolean,
        default: true,
      },
    },

    // ==================================================
    // BLOCKCHAIN METADATA
    // ==================================================

    blockchainMetadata: {
      chainId: {
        type: Number,
        default: 0,
      },

      rpcNetworkName: {
        type: String,
        default: "",
      },

      explorerName: {
        type: String,
        default: "",
      },

      explorerTransactionPrefix: {
        type: String,
        default: "",
      },

      explorerAddressPrefix: {
        type: String,
        default: "",
      },

      nativeCurrencySymbol: {
        type: String,
        default: "",
      },

      smartContractAddress: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // SECURITY SETTINGS
    // ==================================================

    cryptoSecurity: {
      whitelistEnabled: {
        type: Boolean,
        default: false,
      },

      addressWhitelisted: {
        type: Boolean,
        default: false,
      },

      withdrawalLocked: {
        type: Boolean,
        default: false,
      },

      requires2FA: {
        type: Boolean,
        default: true,
      },

      requiresEmailConfirmation: {
        type: Boolean,
        default: true,
      },

      suspiciousAddress: {
        type: Boolean,
        default: false,
      },

      blacklistMatch: {
        type: Boolean,
        default: false,
      },

      riskScore: {
        type: Number,
        default: 0,
      },
    },

    // ==================================================
    // WALLET BALANCE CACHE
    // ==================================================

    balanceCache: {
      availableBalance: {
        type: Number,
        default: 0,
      },

      pendingBalance: {
        type: Number,
        default: 0,
      },

      lockedBalance: {
        type: Number,
        default: 0,
      },

      totalBalance: {
        type: Number,
        default: 0,
      },

      lastBalanceSyncAt: Date,
    },

    // ==================================================
    // CRYPTO TRANSACTION HISTORY
    // ==================================================

    cryptoHistory: [
      {
        txHash: {
          type: String,
          index: true,
        },

        currency: {
          type: String,
          enum: Object.values(CryptoCurrency),
        },

        network: {
          type: String,
          enum: Object.values(CryptoNetwork),
        },

        amount: Number,

        confirmations: {
          type: Number,
          default: 0,
        },

        status: {
          type: String,
          enum: [
            "PENDING",
            "CONFIRMING",
            "CONFIRMED",
            "FAILED",
            "REJECTED",
          ],
          default: "PENDING",
        },

        blockNumber: Number,

        networkFee: Number,

        createdAt: {
          type: Date,
          default: Date.now,
        },

        confirmedAt: Date,
      },
    ],// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/BankAccount.ts
// SECTION 6/10
// VERIFICATION + DEPOSIT / WITHDRAWAL LIMITS
// ======================================================

    // ==================================================
    // ACCOUNT VERIFICATION WORKFLOW
    // ==================================================

    verificationWorkflow: {
      verificationLevel: {
        type: String,
        enum: ["LEVEL_0", "LEVEL_1", "LEVEL_2", "LEVEL_3", "LEVEL_4"],
        default: "LEVEL_0",
        index: true,
      },

      kycRequired: {
        type: Boolean,
        default: true,
      },

      kycVerified: {
        type: Boolean,
        default: false,
      },

      bankVerified: {
        type: Boolean,
        default: false,
      },

      mobileWalletVerified: {
        type: Boolean,
        default: false,
      },

      cryptoWalletVerified: {
        type: Boolean,
        default: false,
      },

      adminApproved: {
        type: Boolean,
        default: false,
      },

      approvedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      approvedAt: Date,

      rejectedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      rejectedAt: Date,

      rejectionReason: {
        type: String,
        default: "",
      },
    },

    // ==================================================
    // DEPOSIT LIMITS
    // ==================================================

    depositLimits: {
      dailyLimitPKR: {
        type: Number,
        default: 100000,
      },

      weeklyLimitPKR: {
        type: Number,
        default: 500000,
      },

      monthlyLimitPKR: {
        type: Number,
        default: 2000000,
      },

      yearlyLimitPKR: {
        type: Number,
        default: 24000000,
      },

      minimumDepositPKR: {
        type: Number,
        default: 500,
      },

      maximumSingleDepositPKR: {
        type: Number,
        default: 500000,
      },

      remainingDailyLimitPKR: {
        type: Number,
        default: 100000,
      },

      remainingMonthlyLimitPKR: {
        type: Number,
        default: 2000000,
      },
    },

    // ==================================================
    // WITHDRAWAL LIMITS
    // ==================================================

    withdrawalLimits: {
      dailyLimitPKR: {
        type: Number,
        default: 100000,
      },

      weeklyLimitPKR: {
        type: Number,
        default: 500000,
      },

      monthlyLimitPKR: {
        type: Number,
        default: 2000000,
      },

      yearlyLimitPKR: {
        type: Number,
        default: 24000000,
      },

      minimumWithdrawalPKR: {
        type: Number,
        default: 1000,
      },

      maximumSingleWithdrawalPKR: {
        type: Number,
        default: 500000,
      },

      remainingDailyLimitPKR: {
        type: Number,
        default: 100000,
      },

      remainingMonthlyLimitPKR: {
        type: Number,
        default: 2000000,
      },
    },

    // ==================================================
    // RAAST / INSTANT TRANSFER LIMITS
    // ==================================================

    raastLimits: {
      instantTransferEnabled: {
        type: Boolean,
        default: true,
      },

      dailyTransferLimitPKR: {
        type: Number,
        default: 500000,
      },

      monthlyTransferLimitPKR: {
        type: Number,
        default: 5000000,
      },

      maxSingleTransferPKR: {
        type: Number,
        default: 200000,
      },

      lastTransferAt: Date,
    },

    // ==================================================
    // DIGITAL WALLET LIMITS
    // JazzCash / EasyPaisa / NayaPay / SadaPay
    // ==================================================

    walletLimits: {
      dailyWalletDepositPKR: {
        type: Number,
        default: 100000,
      },

      dailyWalletWithdrawalPKR: {
        type: Number,
        default: 100000,
      },

      monthlyWalletLimitPKR: {
        type: Number,
        default: 1500000,
      },

      qrPaymentLimitPKR: {
        type: Number,
        default: 50000,
      },

      otpRequiredAbovePKR: {
        type: Number,
        default: 25000,
      },
    },

    // ==================================================
    // CRYPTO LIMITS
    // ==================================================

    cryptoLimits: {
      dailyCryptoDepositUSD: {
        type: Number,
        default: 10000,
      },

      dailyCryptoWithdrawalUSD: {
        type: Number,
        default: 10000,
      },

      monthlyCryptoLimitUSD: {
        type: Number,
        default: 100000,
      },

      minimumConfirmations: {
        type: Number,
        default: 12,
      },

      travelRuleRequiredAboveUSD: {
        type: Number,
        default: 1000,
      },
    },

    // ==================================================
    // FAILED VERIFICATION TRACKER
    // ==================================================

    failedVerification: {
      attempts: {
        type: Number,
        default: 0,
      },

      maxAttempts: {
        type: Number,
        default: 5,
      },

      lastAttemptAt: Date,

      lockedUntil: Date,

      lastFailureReason: {
        type: String,
        default: "",
      },

      accountTemporarilyLocked: {
        type: Boolean,
        default: false,
      },
    },

    // ==================================================
    // ADMIN ACTION HISTORY
    // ==================================================

    adminVerificationHistory: [
      {
        action: {
          type: String,
          enum: [
            "SUBMITTED",
            "VERIFIED",
            "REJECTED",
            "SUSPENDED",
            "UNBLOCKED",
            "LIMIT_UPDATED",
            "FREEZE",
            "UNFREEZE",
          ],
        },

        admin: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        notes: {
          type: String,
          default: "",
        },

        previousStatus: String,

        newStatus: String,

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==================================================
    // FREEZE / UNFREEZE ACCOUNT
    // ==================================================

    accountSecurity: {
      frozen: {
        type: Boolean,
        default: false,
      },

      freezeReason: {
        type: String,
        default: "",
      },

      frozenBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      frozenAt: Date,

      unfrozenBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      unfrozenAt: Date,

      withdrawalsBlocked: {
        type: Boolean,
        default: false,
      },

      depositsBlocked: {
        type: Boolean,
        default: false,
      },
    },// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/BankAccount.ts
// SECTION 7/10
// FRAUD DETECTION + RISK FLAGS + AUDIT LOGS
// ======================================================

    // ==================================================
    // FRAUD DETECTION ENGINE
    // ==================================================

    fraudDetection: {
      riskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
        index: true,
      },

      riskLevel: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "LOW",
        index: true,
      },

      suspiciousActivityDetected: {
        type: Boolean,
        default: false,
      },

      manualReviewRequired: {
        type: Boolean,
        default: false,
      },

      lastRiskEvaluationAt: Date,

      riskReasons: [
        {
          type: String,
        },
      ],
    },

    // ==================================================
    // VELOCITY CHECKS
    // ==================================================

    velocityChecks: {
      depositsLast24Hours: {
        type: Number,
        default: 0,
      },

      withdrawalsLast24Hours: {
        type: Number,
        default: 0,
      },

      transactionsLastHour: {
        type: Number,
        default: 0,
      },

      velocityLimitExceeded: {
        type: Boolean,
        default: false,
      },

      lastVelocityResetAt: Date,
    },

    // ==================================================
    // DEVICE & IP SECURITY
    // ==================================================

    securitySignals: {
      lastIPAddress: {
        type: String,
        default: "",
      },

      lastDeviceId: {
        type: String,
        default: "",
      },

      newDeviceDetected: {
        type: Boolean,
        default: false,
      },

      newIPDetected: {
        type: Boolean,
        default: false,
      },

      deviceMismatch: {
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

      lastSecurityCheckAt: Date,
    },

    // ==================================================
    // GEO LOCATION CHECKS
    // ==================================================

    geoSecurity: {
      country: {
        type: String,
        default: "",
      },

      city: {
        type: String,
        default: "",
      },

      latitude: Number,
      longitude: Number,

      geoMismatchDetected: {
        type: Boolean,
        default: false,
      },

      impossibleTravelDetected: {
        type: Boolean,
        default: false,
      },

      lastKnownCountry: {
        type: String,
        default: "",
      },

      lastKnownCity: {
        type: String,
        default: "",
      },

      checkedAt: Date,
    },

    // ==================================================
    // AML MONITORING
    // ==================================================

    amlMonitoring: {
      amlRiskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },

      amlRiskLevel: {
        type: String,
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        default: "LOW",
      },

      sourceOfFundsVerified: {
        type: Boolean,
        default: false,
      },

      largeTransactionFlag: {
        type: Boolean,
        default: false,
      },

      structuringDetected: {
        type: Boolean,
        default: false,
      },

      sanctionsHit: {
        type: Boolean,
        default: false,
      },

      pepHit: {
        type: Boolean,
        default: false,
      },

      lastAMLCheckAt: Date,
    },

    // ==================================================
    // BLACKLIST / WHITELIST
    // ==================================================

    complianceFlags: {
      blacklisted: {
        type: Boolean,
        default: false,
      },

      whitelisted: {
        type: Boolean,
        default: false,
      },

      blacklistReason: {
        type: String,
        default: "",
      },

      flaggedWalletAddress: {
        type: Boolean,
        default: false,
      },

      flaggedBankAccount: {
        type: Boolean,
        default: false,
      },

      flaggedMobileWallet: {
        type: Boolean,
        default: false,
      },

      updatedAt: Date,
    },

    // ==================================================
    // SECURITY EVENTS
    // ==================================================

    securityEvents: [
      {
        eventType: {
          type: String,
          enum: [
            "NEW_DEVICE",
            "NEW_IP",
            "VPN_DETECTED",
            "PROXY_DETECTED",
            "TOR_DETECTED",
            "GEO_MISMATCH",
            "VELOCITY_LIMIT",
            "AML_FLAG",
            "ACCOUNT_FROZEN",
            "ACCOUNT_UNFROZEN",
          ],
        },

        severity: {
          type: String,
          enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
          default: "LOW",
        },

        description: String,

        ipAddress: String,

        deviceId: String,

        city: String,

        country: String,

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ==================================================
    // AUDIT LOGS
    // ==================================================

    auditTrail: [
      {
        action: {
          type: String,
          required: true,
        },

        category: {
          type: String,
          enum: [
            "ACCOUNT",
            "VERIFICATION",
            "SECURITY",
            "LIMITS",
            "COMPLIANCE",
            "PAYMENT",
          ],
          default: "ACCOUNT",
        },

        performedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },

        notes: String,

        ipAddress: String,

        deviceId: String,

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  }
);

// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/BankAccount.ts
// SECTION 8/10
// INDEXES + VIRTUAL FIELDS
// ======================================================

// ======================================================
// PRIMARY DATABASE INDEXES
// ======================================================

BankAccountSchema.index({ user: 1 });
BankAccountSchema.index({ accountId: 1 }, { unique: true });

BankAccountSchema.index({ accountType: 1 });
BankAccountSchema.index({ status: 1 });
BankAccountSchema.index({ currency: 1 });

// ======================================================
// BANK INDEXES
// ======================================================

BankAccountSchema.index({ "bankDetails.bankName": 1 });
BankAccountSchema.index({ "bankDetails.accountNumber": 1 });
BankAccountSchema.index({ "bankDetails.iban": 1 });

// ======================================================
// DIGITAL WALLET INDEXES
// ======================================================

BankAccountSchema.index({ "digitalWallet.provider": 1 });
BankAccountSchema.index({ "digitalWallet.mobileNumber": 1 });

// ======================================================
// INTERNATIONAL PROVIDER INDEXES
// ======================================================

BankAccountSchema.index({ "internationalAccount.provider": 1 });
BankAccountSchema.index({ "internationalAccount.accountEmail": 1 });

// ======================================================
// CRYPTO WALLET INDEXES
// ======================================================

BankAccountSchema.index({ "cryptoWallet.walletAddress": 1 });
BankAccountSchema.index({ "cryptoWallet.currency": 1 });
BankAccountSchema.index({ "cryptoWallet.network": 1 });

// ======================================================
// RAAST INDEXES
// ======================================================

BankAccountSchema.index({ "raastDetails.raastId": 1 });
BankAccountSchema.index({ "raastDetails.linkedMobileNumber": 1 });

// ======================================================
// RISK & SECURITY INDEXES
// ======================================================

BankAccountSchema.index({ "fraudDetection.riskLevel": 1 });
BankAccountSchema.index({ "fraudDetection.riskScore": -1 });

BankAccountSchema.index({ "amlMonitoring.amlRiskLevel": 1 });
BankAccountSchema.index({ "accountSecurity.frozen": 1 });

// ======================================================
// TIMESTAMP INDEXES
// ======================================================

BankAccountSchema.index({ submittedAt: -1 });
BankAccountSchema.index({ activatedAt: -1 });

// ======================================================
// VIRTUAL : IS VERIFIED
// ======================================================

BankAccountSchema.virtual("isVerified").get(function (this: any) {
  return (
    this.status === BankAccountStatus.VERIFIED &&
    this.verificationWorkflow.adminApproved
  );
});

// ======================================================
// VIRTUAL : IS FROZEN
// ======================================================

BankAccountSchema.virtual("isFrozen").get(function (this: any) {
  return this.accountSecurity.frozen === true;
});

// ======================================================
// VIRTUAL : IS HIGH RISK
// ======================================================

BankAccountSchema.virtual("isHighRisk").get(function (this: any) {
  return ["HIGH", "CRITICAL"].includes(
    this.fraudDetection.riskLevel
  );
});

// ======================================================
// VIRTUAL : IS DEPOSIT ENABLED
// ======================================================

BankAccountSchema.virtual("canDeposit").get(function (this: any) {
  return (
    this.isActive &&
    !this.accountSecurity.depositsBlocked &&
    this.status === BankAccountStatus.VERIFIED
  );
});

// ======================================================
// VIRTUAL : IS WITHDRAWAL ENABLED
// ======================================================

BankAccountSchema.virtual("canWithdraw").get(function (this: any) {
  return (
    this.isActive &&
    !this.accountSecurity.withdrawalsBlocked &&
    !this.accountSecurity.frozen &&
    this.status === BankAccountStatus.VERIFIED
  );
});

// ======================================================
// VIRTUAL : ACCOUNT DISPLAY NAME
// ======================================================

BankAccountSchema.virtual("displayName").get(function (this: any) {
  switch (this.accountType) {
    case AccountType.BANK:
      return `${this.bankDetails.bankName} ••••${this.bankDetails.accountNumber.slice(-4)}`;

    case AccountType.DIGITAL_WALLET:
      return `${this.digitalWallet.provider} ••••${this.digitalWallet.mobileNumber.slice(-4)}`;

    case AccountType.RAAST:
      return `Raast • ${this.raastDetails.linkedMobileNumber}`;

    case AccountType.CRYPTO:
      return `${this.cryptoWallet.currency} (${this.cryptoWallet.network})`;

    case AccountType.INTERNATIONAL:
      return `${this.internationalAccount.provider}`;

    default:
      return "Payment Account";
  }
});

// ======================================================
// VIRTUAL : MASKED ACCOUNT NUMBER
// ======================================================

BankAccountSchema.virtual("maskedAccountNumber").get(function (this: any) {
  if (!this.bankDetails?.accountNumber) return "";

  const account = this.bankDetails.accountNumber;

  return account.length > 4
    ? `**** **** ${account.slice(-4)}`
    : account;
});

// ======================================================
// VIRTUAL : MASKED IBAN
// ======================================================

BankAccountSchema.virtual("maskedIBAN").get(function (this: any) {
  if (!this.bankDetails?.iban) return "";

  const iban = this.bankDetails.iban;

  return `${iban.slice(0, 4)} **** **** ${iban.slice(-4)}`;
});

// ======================================================
// VIRTUAL : MASKED WALLET ADDRESS
// ======================================================

BankAccountSchema.virtual("maskedWalletAddress").get(function (this: any) {
  if (!this.cryptoWallet?.walletAddress) return "";

  const address = this.cryptoWallet.walletAddress;

  return `${address.slice(0, 6)}...${address.slice(-6)}`;
});

// ======================================================
// VIRTUAL : AVAILABLE LIMIT SUMMARY
// ======================================================

BankAccountSchema.virtual("availableLimits").get(function (this: any) {
  return {
    depositToday:
      this.depositLimits.remainingDailyLimitPKR,

    withdrawalToday:
      this.withdrawalLimits.remainingDailyLimitPKR,

    depositMonth:
      this.depositLimits.remainingMonthlyLimitPKR,

    withdrawalMonth:
      this.withdrawalLimits.remainingMonthlyLimitPKR,
  };
});

// ======================================================
// VIRTUAL : VERIFICATION SUMMARY
// ======================================================

BankAccountSchema.virtual("verificationSummary").get(function (this: any) {
  return {
    verified: this.isVerified,

    kycVerified:
      this.verificationWorkflow.kycVerified,

    bankVerified:
      this.verificationWorkflow.bankVerified,

    walletVerified:
      this.verificationWorkflow.mobileWalletVerified,

    cryptoVerified:
      this.verificationWorkflow.cryptoWalletVerified,

    adminApproved:
      this.verificationWorkflow.adminApproved,
  };
});

// ======================================================
// VIRTUAL : CRYPTO SUMMARY
// ======================================================

BankAccountSchema.virtual("cryptoSummary").get(function (this: any) {
  if (this.accountType !== AccountType.CRYPTO) return null;

  return {
    currency: this.cryptoWallet.currency,

    network: this.cryptoWallet.network,

    address: this.maskedWalletAddress,

    provider: this.cryptoWallet.provider,
  };
});

// ======================================================
// VIRTUAL : PAYMENT PROVIDER SUMMARY
// ======================================================

BankAccountSchema.virtual("providerSummary").get(function (this: any) {
  return {
    accountType: this.accountType,

    currency: this.currency,

    primary: this.isPrimary,

    active: this.isActive,

    verified: this.isVerified,
  };
});

// ======================================================
// VIRTUAL : ACCOUNT HEALTH SCORE
// ======================================================

BankAccountSchema.virtual("healthScore").get(function (this: any) {
  let score = 100;

  if (this.accountSecurity.frozen) score -= 30;

  if (this.fraudDetection.riskLevel === "HIGH") score -= 20;

  if (this.fraudDetection.riskLevel === "CRITICAL") score -= 40;

  if (
    this.failedVerification.accountTemporarilyLocked
  )
    score -= 20;

  return Math.max(score, 0);
});

// ======================================================
// JSON / OBJECT OPTIONS
// ======================================================

BankAccountSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

BankAccountSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
});

// ======================================================
// END OF SECTION 8/10
// NEXT SECTION: PRE-SAVE HOOKS + VALIDATION METHODS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/BankAccount.ts
// SECTION 9/10
// PRE-SAVE HOOKS + VALIDATION METHODS
// ======================================================

// ======================================================
// AUTO GENERATE ACCOUNT ID
// FORMAT: GTBANK-2026-AB12CD34
// ======================================================

BankAccountSchema.pre<IBankAccount>("save", function (next) {
  if (!this.accountId) {
    const year = new Date().getFullYear();

    const random = crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase();

    this.accountId = `GTBANK-${year}-${random}`;
  }

  next();
});

// ======================================================
// AUTO UPDATE LAST TRANSACTION DATE
// ======================================================

BankAccountSchema.pre<IBankAccount>("save", function (next) {
  this.statistics.lastTransactionAt = new Date();
  next();
});

// ======================================================
// PAKISTAN IBAN VALIDATION
// ======================================================

BankAccountSchema.methods.validateIBAN = function (): boolean {
  const iban = this.bankDetails?.iban?.replace(/\s+/g, "").toUpperCase();

  if (!iban) return false;

  const pattern = /^PK[0-9]{2}[A-Z]{4}[A-Z0-9]{16}$/;

  const valid = pattern.test(iban);

  this.bankDetails.ibanValidation.valid = valid;

  this.bankDetails.ibanValidation.countryCode = "PK";

  this.bankDetails.ibanValidation.validatedAt = new Date();

  return valid;
};

// ======================================================
// PAKISTANI MOBILE NUMBER VALIDATION
// JazzCash / EasyPaisa / NayaPay / SadaPay / Raast
// ======================================================

BankAccountSchema.methods.validateMobileWallet = function (): boolean {
  const number = this.digitalWallet?.mobileNumber?.replace(/\D/g, "");

  if (!number) return false;

  const pattern = /^(92|0)?3[0-9]{9}$/;

  const valid = pattern.test(number);

  this.digitalWallet.verified = valid;

  return valid;
};

// ======================================================
// RAAST VALIDATION
// ======================================================

BankAccountSchema.methods.validateRaast = function (): boolean {
  if (!this.raastDetails.enabled) return false;

  const raastId = this.raastDetails.raastId;

  const mobile = this.raastDetails.linkedMobileNumber;

  const valid =
    !!raastId &&
    /^(92|0)?3[0-9]{9}$/.test(mobile.replace(/\D/g, ""));

  this.raastDetails.verified = valid;

  if (valid) {
    this.raastDetails.verifiedAt = new Date();
  }

  return valid;
};

// ======================================================
// CRYPTO WALLET ADDRESS VALIDATION
// ======================================================

BankAccountSchema.methods.validateCryptoWallet = function (): boolean {
  if (!this.cryptoWallet?.walletAddress) return false;

  const address = this.cryptoWallet.walletAddress.trim();

  let valid = false;

  switch (this.cryptoWallet.network) {
    case CryptoNetwork.TRC20:
      valid = /^T[a-zA-Z0-9]{33}$/.test(address);
      break;

    case CryptoNetwork.ERC20:
    case CryptoNetwork.BEP20:
    case CryptoNetwork.POLYGON:
    case CryptoNetwork.ARBITRUM:
    case CryptoNetwork.OPTIMISM:
      valid = /^0x[a-fA-F0-9]{40}$/.test(address);
      break;

    case CryptoNetwork.BITCOIN:
      valid = /^(bc1|1|3)[a-zA-Z0-9]{25,62}$/.test(address);
      break;

    case CryptoNetwork.SOLANA:
      valid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
      break;

    default:
      valid = address.length >= 26;
  }

  this.cryptoWallet.addressValidation.validAddress = valid;
  this.cryptoWallet.addressValidation.validatedAt = new Date();

  return valid;
};

// ======================================================
// AUTO PRIMARY ACCOUNT ENFORCEMENT
// ======================================================

BankAccountSchema.methods.makePrimary = async function () {
  await mongoose.model("BankAccount").updateMany(
    { user: this.user, _id: { $ne: this._id } },
    {
      $set: {
        isPrimary: false,
      },
    }
  );

  this.isPrimary = true;

  return this.save();
};

// ======================================================
// AUTO FRAUD RISK CALCULATION
// ======================================================

BankAccountSchema.methods.calculateRisk = function (): number {
  let score = 0;

  if (this.securitySignals.newDeviceDetected) score += 10;

  if (this.securitySignals.newIPDetected) score += 10;

  if (this.securitySignals.vpnDetected) score += 20;

  if (this.securitySignals.proxyDetected) score += 15;

  if (this.geoSecurity.geoMismatchDetected) score += 20;

  if (this.velocityChecks.velocityLimitExceeded) score += 15;

  if (this.complianceFlags.blacklisted) score += 40;

  if (this.amlMonitoring.largeTransactionFlag) score += 15;

  score = Math.min(score, 100);

  this.fraudDetection.riskScore = score;

  if (score >= 75) {
    this.fraudDetection.riskLevel = "CRITICAL";
  } else if (score >= 50) {
    this.fraudDetection.riskLevel = "HIGH";
  } else if (score >= 25) {
    this.fraudDetection.riskLevel = "MEDIUM";
  } else {
    this.fraudDetection.riskLevel = "LOW";
  }

  return score;
};

// ======================================================
// FREEZE ACCOUNT
// ======================================================

BankAccountSchema.methods.freezeAccount = async function (
  adminId: mongoose.Types.ObjectId,
  reason: string
) {
  this.accountSecurity.frozen = true;

  this.accountSecurity.freezeReason = reason;

  this.accountSecurity.frozenBy = adminId;

  this.accountSecurity.frozenAt = new Date();

  this.status = BankAccountStatus.BLOCKED;

  this.auditTrail.unshift({
    action: "FREEZE_ACCOUNT",
    category: "SECURITY",
    performedBy: adminId,
    notes: reason,
    createdAt: new Date(),
  });

  return this.save();
};

// ======================================================
// UNFREEZE ACCOUNT
// ======================================================

BankAccountSchema.methods.unfreezeAccount = async function (
  adminId: mongoose.Types.ObjectId
) {
  this.accountSecurity.frozen = false;

  this.accountSecurity.freezeReason = "";

  this.accountSecurity.unfrozenBy = adminId;

  this.accountSecurity.unfrozenAt = new Date();

  this.status = BankAccountStatus.VERIFIED;

  this.auditTrail.unshift({
    action: "UNFREEZE_ACCOUNT",
    category: "SECURITY",
    performedBy: adminId,
    notes: "Account restored by administrator.",
    createdAt: new Date(),
  });

  return this.save();
};

// ======================================================
// VERIFY ACCOUNT
// ======================================================

BankAccountSchema.methods.verifyAccount = async function (
  adminId: mongoose.Types.ObjectId
) {
  this.status = BankAccountStatus.VERIFIED;

  this.verification.status = BankAccountStatus.VERIFIED;

  this.verification.verifiedBy = adminId;

  this.verification.verifiedAt = new Date();

  this.verificationWorkflow.adminApproved = true;

  this.verificationWorkflow.approvedBy = adminId;

  this.verificationWorkflow.approvedAt = new Date();

  this.auditTrail.unshift({
    action: "VERIFY_ACCOUNT",
    category: "VERIFICATION",
    performedBy: adminId,
    notes: "Payment account verified successfully.",
    createdAt: new Date(),
  });

  return this.save();
};

// ======================================================
// REJECT ACCOUNT
// ======================================================

BankAccountSchema.methods.rejectAccount = async function (
  adminId: mongoose.Types.ObjectId,
  reason: string
) {
  this.status = BankAccountStatus.REJECTED;

  this.verification.status = BankAccountStatus.REJECTED;

  this.verification.rejectionReason = reason;

  this.verificationWorkflow.rejectedBy = adminId;

  this.verificationWorkflow.rejectedAt = new Date();

  this.verificationWorkflow.rejectionReason = reason;

  this.auditTrail.unshift({
    action: "REJECT_ACCOUNT",
    category: "VERIFICATION",
    performedBy: adminId,
    notes: reason,
    createdAt: new Date(),
  });

  return this.save();
};

// ======================================================
// RESET DAILY LIMITS
// ======================================================

BankAccountSchema.methods.resetDailyLimits = function () {
  this.depositLimits.remainingDailyLimitPKR =
    this.depositLimits.dailyLimitPKR;

  this.withdrawalLimits.remainingDailyLimitPKR =
    this.withdrawalLimits.dailyLimitPKR;

  this.walletLimits.dailyWalletDepositPKR =
    this.depositLimits.dailyLimitPKR;

  this.walletLimits.dailyWalletWithdrawalPKR =
    this.withdrawalLimits.dailyLimitPKR;
};

// ======================================================
// UPDATE REMAINING LIMITS
// ======================================================

BankAccountSchema.methods.consumeDepositLimit = function (amount: number) {
  this.depositLimits.remainingDailyLimitPKR = Math.max(
    this.depositLimits.remainingDailyLimitPKR - amount,
    0
  );
};

BankAccountSchema.methods.consumeWithdrawalLimit = function (amount: number) {
  this.withdrawalLimits.remainingDailyLimitPKR = Math.max(
    this.withdrawalLimits.remainingDailyLimitPKR - amount,
    0
  );
};

// ======================================================
// END OF SECTION 9/10
// NEXT SECTION: STATIC METHODS + MODEL EXPORT
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/BankAccount.ts
// SECTION 10/10
// STATIC METHODS + MODEL EXPORT
// ======================================================

// ======================================================
// SCHEMA OPTIONS
// ======================================================

BankAccountSchema.set("timestamps", true);

BankAccountSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
});

BankAccountSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
});

// ======================================================
// INSTANCE METHODS INTERFACE
// ======================================================

export interface IBankAccountMethods {
  verifyAccount(adminId: mongoose.Types.ObjectId): Promise<IBankAccount>;

  rejectAccount(
    adminId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<IBankAccount>;

  freezeAccount(
    adminId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<IBankAccount>;

  unfreezeAccount(adminId: mongoose.Types.ObjectId): Promise<IBankAccount>;

  makePrimary(): Promise<IBankAccount>;

  validateIBAN(): boolean;

  validateMobileWallet(): boolean;

  validateRaast(): boolean;

  validateCryptoWallet(): boolean;

  calculateRisk(): number;

  resetDailyLimits(): void;

  consumeDepositLimit(amount: number): void;

  consumeWithdrawalLimit(amount: number): void;
}

// ======================================================
// STATIC MODEL INTERFACE
// ======================================================

export interface IBankAccountModel extends Model<IBankAccount> {
  findPrimaryAccount(userId: mongoose.Types.ObjectId): Promise<IBankAccount | null>;

  findVerifiedAccounts(userId: mongoose.Types.ObjectId): Promise<IBankAccount[]>;

  findHighRiskAccounts(): Promise<IBankAccount[]>;

  findFrozenAccounts(): Promise<IBankAccount[]>;

  findByIBAN(iban: string): Promise<IBankAccount | null>;

  findByWalletAddress(walletAddress: string): Promise<IBankAccount | null>;

  findByMobileWallet(mobile: string): Promise<IBankAccount | null>;
}

// ======================================================
// STATIC METHODS
// ======================================================

// Primary Account
BankAccountSchema.statics.findPrimaryAccount = function (userId) {
  return this.findOne({
    user: userId,
    isPrimary: true,
    isActive: true,
  });
};

// All Verified Accounts
BankAccountSchema.statics.findVerifiedAccounts = function (userId) {
  return this.find({
    user: userId,
    status: BankAccountStatus.VERIFIED,
    isActive: true,
  }).sort({ isPrimary: -1, createdAt: -1 });
};

// High Risk Accounts
BankAccountSchema.statics.findHighRiskAccounts = function () {
  return this.find({
    "fraudDetection.riskLevel": {
      $in: ["HIGH", "CRITICAL"],
    },
  }).sort({
    "fraudDetection.riskScore": -1,
  });
};

// Frozen Accounts
BankAccountSchema.statics.findFrozenAccounts = function () {
  return this.find({
    "accountSecurity.frozen": true,
  }).sort({
    "accountSecurity.frozenAt": -1,
  });
};

// Search by IBAN
BankAccountSchema.statics.findByIBAN = function (iban) {
  return this.findOne({
    "bankDetails.iban": iban.toUpperCase().trim(),
  });
};

// Search by Crypto Wallet Address
BankAccountSchema.statics.findByWalletAddress = function (walletAddress) {
  return this.findOne({
    "cryptoWallet.walletAddress": walletAddress.trim(),
  });
};

// Search by Mobile Wallet Number
BankAccountSchema.statics.findByMobileWallet = function (mobile) {
  return this.findOne({
    "digitalWallet.mobileNumber": mobile.replace(/\D/g, ""),
  });
};

// ======================================================
// PRE SAVE CLEANUP
// ======================================================

BankAccountSchema.pre<IBankAccount>("save", function (next) {
  // Trim wallet number
  if (this.digitalWallet?.mobileNumber) {
    this.digitalWallet.mobileNumber =
      this.digitalWallet.mobileNumber.replace(/\s+/g, "");
  }

  // Uppercase IBAN
  if (this.bankDetails?.iban) {
    this.bankDetails.iban =
      this.bankDetails.iban.replace(/\s+/g, "").toUpperCase();
  }

  // Uppercase Account ID
  if (this.accountId) {
    this.accountId = this.accountId.toUpperCase();
  }

  next();
});

// ======================================================
// AUTO LIMIT HISTORY SIZE
// ======================================================

BankAccountSchema.pre<IBankAccount>("save", function (next) {
  if (this.auditTrail.length > 250) {
    this.auditTrail = this.auditTrail.slice(0, 250);
  }

  if (this.securityEvents.length > 250) {
    this.securityEvents = this.securityEvents.slice(0, 250);
  }

  if (this.walletHistory.length > 100) {
    this.walletHistory = this.walletHistory.slice(0, 100);
  }

  if (this.bankHistory.length > 100) {
    this.bankHistory = this.bankHistory.slice(0, 100);
  }

  if (this.cryptoHistory.length > 500) {
    this.cryptoHistory = this.cryptoHistory.slice(0, 500);
  }

  next();
});

// ======================================================
// MODEL CREATE
// ======================================================

const BankAccount =
  (mongoose.models.BankAccount as IBankAccountModel) ||
  mongoose.model<IBankAccount, IBankAccountModel>(
    "BankAccount",
    BankAccountSchema
  );

// ======================================================
// EXPORT MODEL
// ======================================================

export default BankAccount;

// ======================================================
// END OF FILE
// backend/src/models/BankAccount.ts
// GOLDTRADE V17 ENTERPRISE BANK ACCOUNT MODEL COMPLETE
// ======================================================