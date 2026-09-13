// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/User.ts
// SECTION 1/10
// IMPORTS + ENUMS + INTERFACES
// ======================================================

import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

// ======================================================
// ENUMS
// ======================================================

export enum UserRole {
  USER = "USER",
  SUPPORT_AGENT = "SUPPORT_AGENT",
  FINANCE_MANAGER = "FINANCE_MANAGER",
  KYC_MANAGER = "KYC_MANAGER",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export enum AccountStatus {
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
  SUSPENDED = "SUSPENDED",
  PENDING = "PENDING",
}

export enum KYCStatus {
  NOT_SUBMITTED = "NOT_SUBMITTED",
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

// ======================================================
// SUB DOCUMENT INTERFACES
// ======================================================

export interface IKYC {
  status: KYCStatus;

  documentType: "CNIC" | "PASSPORT";

  documentNumber?: string;

  fullNameOnDocument?: string;

  nationality?: string;

  issueDate?: Date;

  expiryDate?: Date;

  frontImage?: string;

  backImage?: string;

  selfieImage?: string;

  addressProofImage?: string;

  submittedAt?: Date;

  verifiedAt?: Date;

  verifiedBy?: mongoose.Types.ObjectId;

  rejectReason?: string;

  reviewNotes?: string;
}

export interface IReferral {
  referralCode?: string;

  referredBy?: mongoose.Types.ObjectId;

  totalReferrals: number;

  activeReferrals?: number;

  inactiveReferrals?: number;

  totalReward: number;

  pendingReward: number;

  paidReward?: number;

  lifetimeCommission?: number;

  todayCommission?: number;

  monthlyCommission?: number;
}

export interface ISecurity {
  emailVerified: boolean;

  phoneVerified: boolean;

  twoFactorEnabled?: boolean;

  otpCode?: string;

  otpPurpose?: string;

  otpExpires?: Date;

  otpAttempts?: number;

  loginAttempts: number;

  lockUntil?: Date;

  lastLogin?: Date;

  lastLoginIP?: string;

  lastDevice?: string;

  lastBrowser?: string;

  lastPlatform?: string;

  passwordChangedAt?: Date;

  passwordResetToken?: string;

  passwordResetExpires?: Date;
}

export interface ITradingProfile {
  totalTrades: number;

  successfulTrades: number;

  failedTrades?: number;

  totalBuyAmount: number;

  totalSellAmount: number;

  totalGoldBought: number;

  totalGoldSold: number;

  tradingVolume: number;

  averageBuyPrice?: number;

  averageSellPrice?: number;

  highestProfitTrade?: number;

  highestLossTrade?: number;

  lastTradeDate?: Date;

  tradingLevel?: string;

  isTradingEnabled?: boolean;
}

// ======================================================
// MAIN USER DOCUMENT INTERFACE
// ======================================================

export interface IUser extends Document {
  fullName: string;

  email: string;

  phone: string;

  password: string;

  dateOfBirth?: Date;

  gender?: "MALE" | "FEMALE" | "OTHER";

  country: string;

  city: string;

  address?: string;

  postalCode?: string;

  profileImage?: string;

  language?: "EN" | "UR" | "AR";

  timezone?: string;

  role: UserRole;

  accountStatus: AccountStatus;

  isActive?: boolean;

  isDeleted?: boolean;

  lastSeen?: Date;

  wallet?: mongoose.Types.ObjectId;

  kyc: IKYC;

  kycHistory?: Array<{
    status: KYCStatus;
    changedBy?: mongoose.Types.ObjectId;
    notes?: string;
    createdAt?: Date;
  }>;

  walletBalance?: number;

  goldBalance?: number;

  bonusBalance?: number;

  lockedBalance?: number;

  totalDeposited?: number;

  totalWithdrawn?: number;

  totalProfit?: number;

  totalLoss?: number;

  walletCurrency?: string;

  trading: ITradingProfile;

  portfolio?: {
    portfolioValue?: number;
    goldMarketValue?: number;
    cashAvailable?: number;
    unrealizedProfit?: number;
    realizedProfit?: number;
    dailyProfit?: number;
    monthlyProfit?: number;
  };

  referral: IReferral;

  referralHistory?: Array<{
    referredUser: mongoose.Types.ObjectId;
    referralLevel?: number;
    rewardAmount?: number;
    commissionPercentage?: number;
    status?: "PENDING" | "PAID" | "CANCELLED";
    transactionId?: string;
    createdAt?: Date;
  }>;

  bonus?: {
    signupBonusReceived?: boolean;
    signupBonusAmount?: number;
    firstDepositBonusReceived?: boolean;
    firstDepositBonusAmount?: number;
    promotionalBonus?: number;
    loyaltyBonus?: number;
    cashbackBonus?: number;
    totalBonusEarned?: number;
  };

  bonusHistory?: Array<{
    title: string;
    amount?: number;
    type?: "SIGNUP" | "FIRST_DEPOSIT" | "REFERRAL" | "LOYALTY" | "PROMOTION" | "CASHBACK";
    status?: "PENDING" | "APPROVED" | "EXPIRED";
    createdAt?: Date;
  }>;

  security: ISecurity;

  loginHistory?: Array<{
    loginTime?: Date;
    ipAddress?: string;
    device?: string;
    browser?: string;
    operatingSystem?: string;
    location?: { country?: string; city?: string };
    status?: "SUCCESS" | "FAILED";
  }>;

  trustedDevices?: Array<{
    deviceId: string;
    deviceName?: string;
    platform?: string;
    browser?: string;
    ipAddress?: string;
    addedAt?: Date;
    lastUsedAt?: Date;
  }>;

  permissions?: {
    dashboard?: boolean;
    userManagement?: boolean;
    walletManagement?: boolean;
    kycManagement?: boolean;
    depositManagement?: boolean;
    withdrawalManagement?: boolean;
    tradingManagement?: boolean;
    referralManagement?: boolean;
    reportsAccess?: boolean;
    systemSettings?: boolean;
    backupManagement?: boolean;
    activityLogs?: boolean;
    adminManagement?: boolean;
  };

  adminProfile?: {
    employeeId?: string;
    department?: "ADMIN" | "FINANCE" | "KYC" | "SUPPORT" | "OPERATIONS" | "MARKETING";
    designation?: string;
    canApproveDeposits?: boolean;
    canApproveWithdrawals?: boolean;
    canApproveKYC?: boolean;
    canUpdateGoldPrice?: boolean;
    canManageUsers?: boolean;
    canViewReports?: boolean;
    canManageSettings?: boolean;
    joinedAsAdminAt?: Date;
  };

  notifications?: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
    whatsappNotifications?: boolean;
    depositAlerts?: boolean;
    withdrawalAlerts?: boolean;
    kycAlerts?: boolean;
    referralAlerts?: boolean;
    marketingNotifications?: boolean;
  };

  preferences?: {
    darkMode?: boolean;
    biometricLogin?: boolean;
    preferredCurrency?: string;
    preferredGoldUnit?: "GRAM" | "TOLA" | "OUNCE";
    language?: "EN" | "UR" | "AR";
  };

  comparePassword(password: string): Promise<boolean>;

  generateReferralCode(): string;
}

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateReferralCode(): string;
  generateOTP(purpose?: string): string;
  verifyOTP(otp: string): boolean;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<IUser>;
  resetLoginAttempts(): Promise<IUser>;
  recordSuccessfulLogin(
    ip: string,
    device: string,
    browser: string
  ): Promise<IUser>;
  generatePasswordResetToken(): string;
}

export interface IUserModel extends Model<IUser> {
  findByReferralCode(code: string): Promise<IUser | null>;
}

// ======================================================
// END OF SECTION 1/10
// NEXT SECTION: PERSONAL INFORMATION SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/User.ts
// SECTION 2/10
// PERSONAL INFORMATION SCHEMA
// ======================================================

const UserSchema: Schema<IUser, IUserModel, IUserMethods> = new Schema<IUser, IUserModel, IUserMethods>(
  {
    // ==================================================
    // PERSONAL INFORMATION
    // ==================================================

    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    dateOfBirth: {
      type: Date,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      default: "MALE",
    },

    country: {
      type: String,
      required: true,
      default: "Pakistan",
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    postalCode: {
      type: String,
      trim: true,
      default: "",
    },

    profileImage: {
      type: String,
      default: "",
    },

    language: {
      type: String,
      enum: ["EN", "UR", "AR"],
      default: "EN",
    },

    timezone: {
      type: String,
      default: "Asia/Karachi",
    },

    // ==================================================
    // ACCOUNT INFORMATION
    // ==================================================

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      index: true,
    },

    accountStatus: {
      type: String,
      enum: Object.values(AccountStatus),
      default: AccountStatus.ACTIVE,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    wallet: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      index: true,
    },

// ======================================================
// END OF SECTION 2/10
// NEXT SECTION: KYC SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/User.ts
// SECTION 3/10
// KYC SCHEMA
// ======================================================

    // ==================================================
    // KYC INFORMATION
    // ==================================================

    kyc: {
      status: {
        type: String,
        enum: Object.values(KYCStatus),
        default: KYCStatus.NOT_SUBMITTED,
        index: true,
      },

      documentType: {
        type: String,
        enum: ["CNIC", "PASSPORT"],
        default: "CNIC",
      },

      documentNumber: {
        type: String,
        trim: true,
        default: "",
      },

      fullNameOnDocument: {
        type: String,
        trim: true,
        default: "",
      },

      nationality: {
        type: String,
        trim: true,
        default: "Pakistan",
      },

      issueDate: {
        type: Date,
      },

      expiryDate: {
        type: Date,
      },

      frontImage: {
        type: String,
        default: "",
      },

      backImage: {
        type: String,
        default: "",
      },

      selfieImage: {
        type: String,
        default: "",
      },

      addressProofImage: {
        type: String,
        default: "",
      },

      submittedAt: {
        type: Date,
      },

      verifiedAt: {
        type: Date,
      },

      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      rejectReason: {
        type: String,
        trim: true,
        default: "",
      },

      reviewNotes: {
        type: String,
        trim: true,
        default: "",
      },
    },

    // ==================================================
    // KYC HISTORY
    // ==================================================

    kycHistory: [
      {
        status: {
          type: String,
          enum: Object.values(KYCStatus),
        },

        changedBy: {
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

// ======================================================
// END OF SECTION 3/10
// NEXT SECTION: WALLET + TRADING SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/User.ts
// SECTION 4/10
// WALLET + TRADING SCHEMA
// ======================================================

    // ==================================================
    // WALLET INFORMATION
    // ==================================================

    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    goldBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    bonusBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    lockedBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalDeposited: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalWithdrawn: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalProfit: {
      type: Number,
      default: 0,
    },

    totalLoss: {
      type: Number,
      default: 0,
    },

    walletCurrency: {
      type: String,
      default: "PKR",
      uppercase: true,
    },

    // ==================================================
    // TRADING PROFILE
    // ==================================================

    trading: {
      totalTrades: {
        type: Number,
        default: 0,
      },

      successfulTrades: {
        type: Number,
        default: 0,
      },

      failedTrades: {
        type: Number,
        default: 0,
      },

      totalBuyAmount: {
        type: Number,
        default: 0,
      },

      totalSellAmount: {
        type: Number,
        default: 0,
      },

      totalGoldBought: {
        type: Number,
        default: 0,
      },

      totalGoldSold: {
        type: Number,
        default: 0,
      },

      tradingVolume: {
        type: Number,
        default: 0,
      },

      averageBuyPrice: {
        type: Number,
        default: 0,
      },

      averageSellPrice: {
        type: Number,
        default: 0,
      },

      highestProfitTrade: {
        type: Number,
        default: 0,
      },

      highestLossTrade: {
        type: Number,
        default: 0,
      },

      lastTradeDate: {
        type: Date,
      },

      tradingLevel: {
        type: String,
        enum: [
          "BEGINNER",
          "SILVER",
          "GOLD",
          "PLATINUM",
          "DIAMOND",
        ],
        default: "BEGINNER",
      },

      isTradingEnabled: {
        type: Boolean,
        default: true,
      },
    },

    // ==================================================
    // PORTFOLIO INFORMATION
    // ==================================================

    portfolio: {
      portfolioValue: {
        type: Number,
        default: 0,
      },

      goldMarketValue: {
        type: Number,
        default: 0,
      },

      cashAvailable: {
        type: Number,
        default: 0,
      },

      unrealizedProfit: {
        type: Number,
        default: 0,
      },

      realizedProfit: {
        type: Number,
        default: 0,
      },

      dailyProfit: {
        type: Number,
        default: 0,
      },

      monthlyProfit: {
        type: Number,
        default: 0,
      },
    },

// ======================================================
// END OF SECTION 4/10
// NEXT SECTION: REFERRAL + REWARD SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/User.ts
// SECTION 5/10
// REFERRAL + REWARD SCHEMA
// ======================================================

    // ==================================================
    // REFERRAL INFORMATION
    // ==================================================

    referral: {
      referralCode: {
        type: String,
        unique: true,
        uppercase: true,
        trim: true,
        index: true,
      },

      referredBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      totalReferrals: {
        type: Number,
        default: 0,
      },

      activeReferrals: {
        type: Number,
        default: 0,
      },

      inactiveReferrals: {
        type: Number,
        default: 0,
      },

      totalReward: {
        type: Number,
        default: 0,
      },

      pendingReward: {
        type: Number,
        default: 0,
      },

      paidReward: {
        type: Number,
        default: 0,
      },

      lifetimeCommission: {
        type: Number,
        default: 0,
      },

      todayCommission: {
        type: Number,
        default: 0,
      },

      monthlyCommission: {
        type: Number,
        default: 0,
      },
    },

    // ==================================================
    // REFERRAL HISTORY
    // ==================================================

    referralHistory: [
      {
        referredUser: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        referralLevel: {
          type: Number,
          enum: [1, 2, 3],
          default: 1,
        },

        rewardAmount: {
          type: Number,
          default: 0,
        },

        commissionPercentage: {
          type: Number,
          default: 0,
        },

        status: {
          type: String,
          enum: ["PENDING", "PAID", "CANCELLED"],
          default: "PENDING",
        },

        transactionId: {
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
    // BONUS INFORMATION
    // ==================================================

    bonus: {
      signupBonusReceived: {
        type: Boolean,
        default: false,
      },

      signupBonusAmount: {
        type: Number,
        default: 0,
      },

      firstDepositBonusReceived: {
        type: Boolean,
        default: false,
      },

      firstDepositBonusAmount: {
        type: Number,
        default: 0,
      },

      promotionalBonus: {
        type: Number,
        default: 0,
      },

      loyaltyBonus: {
        type: Number,
        default: 0,
      },

      cashbackBonus: {
        type: Number,
        default: 0,
      },

      totalBonusEarned: {
        type: Number,
        default: 0,
      },
    },

    // ==================================================
    // BONUS HISTORY
    // ==================================================

    bonusHistory: [
      {
        title: {
          type: String,
          required: true,
        },

        amount: {
          type: Number,
          default: 0,
        },

        type: {
          type: String,
          enum: [
            "SIGNUP",
            "FIRST_DEPOSIT",
            "REFERRAL",
            "LOYALTY",
            "PROMOTION",
            "CASHBACK",
          ],
        },

        status: {
          type: String,
          enum: ["PENDING", "APPROVED", "EXPIRED"],
          default: "APPROVED",
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

// ======================================================
// END OF SECTION 5/10
// NEXT SECTION: SECURITY + OTP SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/User.ts
// SECTION 6/10
// SECURITY + OTP + DEVICE + LOGIN SCHEMA
// ======================================================

    // ==================================================
    // SECURITY INFORMATION
    // ==================================================

    security: {
      emailVerified: {
        type: Boolean,
        default: false,
      },

      phoneVerified: {
        type: Boolean,
        default: false,
      },

      twoFactorEnabled: {
        type: Boolean,
        default: false,
      },

      otpCode: {
        type: String,
        default: "",
        select: false,
      },

      otpPurpose: {
        type: String,
        enum: [
          "EMAIL_VERIFICATION",
          "PHONE_VERIFICATION",
          "LOGIN",
          "PASSWORD_RESET",
          "WITHDRAWAL",
        ],
        default: "LOGIN",
      },

      otpExpires: {
        type: Date,
      },

      otpAttempts: {
        type: Number,
        default: 0,
      },

      loginAttempts: {
        type: Number,
        default: 0,
      },

      lockUntil: {
        type: Date,
      },

      lastLogin: {
        type: Date,
      },

      lastLoginIP: {
        type: String,
        default: "",
      },

      lastDevice: {
        type: String,
        default: "",
      },

      lastBrowser: {
        type: String,
        default: "",
      },

      lastPlatform: {
        type: String,
        default: "",
      },

      passwordChangedAt: {
        type: Date,
      },

      passwordResetToken: {
        type: String,
        default: "",
        select: false,
      },

      passwordResetExpires: {
        type: Date,
      },
    },

    // ==================================================
    // LOGIN HISTORY
    // ==================================================

    loginHistory: [
      {
        loginTime: {
          type: Date,
          default: Date.now,
        },

        ipAddress: {
          type: String,
          default: "",
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

        location: {
          country: {
            type: String,
            default: "",
          },

          city: {
            type: String,
            default: "",
          },
        },

        status: {
          type: String,
          enum: ["SUCCESS", "FAILED"],
          default: "SUCCESS",
        },
      },
    ],

    // ==================================================
    // TRUSTED DEVICES
    // ==================================================

    trustedDevices: [
      {
        deviceId: {
          type: String,
          required: true,
        },

        deviceName: {
          type: String,
          default: "",
        },

        platform: {
          type: String,
          default: "",
        },

        browser: {
          type: String,
          default: "",
        },

        ipAddress: {
          type: String,
          default: "",
        },

        addedAt: {
          type: Date,
          default: Date.now,
        },

        lastUsedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

// ======================================================
// END OF SECTION 6/10
// NEXT SECTION: ADMIN ROLES + PERMISSIONS SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/User.ts
// SECTION 7/10
// ADMIN ROLES + PERMISSIONS + NOTIFICATION SCHEMA
// ======================================================

    // ==================================================
    // ADMIN PERMISSIONS
    // ==================================================

    permissions: {
      dashboard: {
        type: Boolean,
        default: true,
      },

      userManagement: {
        type: Boolean,
        default: false,
      },

      walletManagement: {
        type: Boolean,
        default: false,
      },

      kycManagement: {
        type: Boolean,
        default: false,
      },

      depositManagement: {
        type: Boolean,
        default: false,
      },

      withdrawalManagement: {
        type: Boolean,
        default: false,
      },

      tradingManagement: {
        type: Boolean,
        default: false,
      },

      referralManagement: {
        type: Boolean,
        default: false,
      },

      reportsAccess: {
        type: Boolean,
        default: false,
      },

      systemSettings: {
        type: Boolean,
        default: false,
      },

      backupManagement: {
        type: Boolean,
        default: false,
      },

      activityLogs: {
        type: Boolean,
        default: false,
      },

      adminManagement: {
        type: Boolean,
        default: false,
      },
    },

    // ==================================================
    // ADMIN PROFILE
    // ==================================================

    adminProfile: {
      employeeId: {
        type: String,
        default: "",
        trim: true,
      },

      department: {
        type: String,
        enum: [
          "ADMIN",
          "FINANCE",
          "KYC",
          "SUPPORT",
          "OPERATIONS",
          "MARKETING",
        ],
        default: "SUPPORT",
      },

      designation: {
        type: String,
        default: "",
      },

      canApproveDeposits: {
        type: Boolean,
        default: false,
      },

      canApproveWithdrawals: {
        type: Boolean,
        default: false,
      },

      canApproveKYC: {
        type: Boolean,
        default: false,
      },

      canUpdateGoldPrice: {
        type: Boolean,
        default: false,
      },

      canManageUsers: {
        type: Boolean,
        default: false,
      },

      canViewReports: {
        type: Boolean,
        default: false,
      },

      canManageSettings: {
        type: Boolean,
        default: false,
      },

      joinedAsAdminAt: {
        type: Date,
      },
    },

    // ==================================================
    // NOTIFICATION PREFERENCES
    // ==================================================

    notifications: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },

      smsNotifications: {
        type: Boolean,
        default: false,
      },

      pushNotifications: {
        type: Boolean,
        default: true,
      },

      whatsappNotifications: {
        type: Boolean,
        default: true,
      },

      depositAlerts: {
        type: Boolean,
        default: true,
      },

      withdrawalAlerts: {
        type: Boolean,
        default: true,
      },

      kycAlerts: {
        type: Boolean,
        default: true,
      },

      referralAlerts: {
        type: Boolean,
        default: true,
      },

      marketingNotifications: {
        type: Boolean,
        default: false,
      },
    },

    // ==================================================
    // USER PREFERENCES
    // ==================================================

    preferences: {
      darkMode: {
        type: Boolean,
        default: false,
      },

      biometricLogin: {
        type: Boolean,
        default: false,
      },

      preferredCurrency: {
        type: String,
        default: "PKR",
      },

      preferredGoldUnit: {
        type: String,
        enum: ["GRAM", "TOLA", "OUNCE"],
        default: "GRAM",
      },

      language: {
        type: String,
        enum: ["EN", "UR", "AR"],
        default: "EN",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ======================================================
// END OF SECTION 7/10
// NEXT SECTION: INDEXES + VIRTUAL FIELDS
// ======================================================
// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/User.ts
// SECTION 8/10
// INDEXES + VIRTUAL FIELDS
// ======================================================

// ======================================================
// COLLECTION INDEXES
// ======================================================

// Authentication
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1 }, { unique: true });

// Referral
UserSchema.index({ "referral.referralCode": 1 }, { unique: true });

// Role & Status
UserSchema.index({ role: 1 });
UserSchema.index({ accountStatus: 1 });
UserSchema.index({ "kyc.status": 1 });

// Search Optimization
UserSchema.index({ fullName: "text", email: "text", phone: "text" });

// Date Indexes
UserSchema.index({ createdAt: -1 });
UserSchema.index({ updatedAt: -1 });
UserSchema.index({ lastSeen: -1 });

// Trading
UserSchema.index({ "trading.tradingVolume": -1 });
UserSchema.index({ walletBalance: -1 });
UserSchema.index({ goldBalance: -1 });

// ======================================================
// VIRTUAL FIELD : ACCOUNT LOCK STATUS
// ======================================================

UserSchema.virtual("isAccountLocked").get(function () {
  return !!(
    this.security.lockUntil &&
    this.security.lockUntil > new Date()
  );
});

// ======================================================
// VIRTUAL FIELD : FULL WALLET VALUE
// ======================================================

UserSchema.virtual("totalWalletValue").get(function () {
  const walletBalance = Number(this.walletBalance ?? 0);
  const bonusBalance = Number(this.bonusBalance ?? 0);
  const goldMarketValue = Number(this.portfolio?.goldMarketValue ?? 0);

  return walletBalance + bonusBalance + goldMarketValue;
});

// ======================================================
// VIRTUAL FIELD : TOTAL PORTFOLIO PROFIT
// ======================================================

UserSchema.virtual("portfolioProfit").get(function () {
  const realizedProfit = Number(this.portfolio?.realizedProfit ?? 0);
  const unrealizedProfit = Number(this.portfolio?.unrealizedProfit ?? 0);

  return realizedProfit + unrealizedProfit;
});

// ======================================================
// VIRTUAL FIELD : SUCCESS RATE
// ======================================================

UserSchema.virtual("tradeSuccessRate").get(function () {
  const totalTrades = Number(this.trading?.totalTrades ?? 0);

  if (totalTrades === 0) {
    return 0;
  }

  const successfulTrades = Number(this.trading?.successfulTrades ?? 0);

  return Math.round((successfulTrades / totalTrades) * 100);
});

// ======================================================
// VIRTUAL FIELD : USER DISPLAY NAME
// ======================================================

UserSchema.virtual("displayName").get(function () {
  return `${this.fullName} (${this.phone})`;
});

// ======================================================
// VIRTUAL FIELD : KYC VERIFIED
// ======================================================

UserSchema.virtual("isKycVerified").get(function () {
  return this.kyc.status === KYCStatus.VERIFIED;
});

// ======================================================
// VIRTUAL FIELD : PROFILE COMPLETION
// ======================================================

UserSchema.virtual("profileCompletion").get(function () {
  let score = 0;

  if (this.fullName) score += 10;
  if (this.email) score += 10;
  if (this.phone) score += 10;
  if (this.profileImage) score += 10;
  if (this.country) score += 10;
  if (this.city) score += 10;
  if (this.dateOfBirth) score += 10;

  if (this.kyc.frontImage) score += 10;
  if (this.kyc.backImage) score += 10;
  if (this.kyc.selfieImage) score += 10;

  return score;
});

// ======================================================
// VIRTUAL FIELD : REFERRAL SUMMARY
// ======================================================

UserSchema.virtual("referralSummary").get(function () {
  return {
    code: this.referral.referralCode,
    referrals: this.referral.totalReferrals,
    earned: this.referral.totalReward,
    pending: this.referral.pendingReward,
  };
});

// ======================================================
// SCHEMA OPTIONS
// ======================================================

UserSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    const serialized = ret as Record<string, any>;

    if ("password" in serialized) {
      delete serialized.password;
    }

    if (serialized.security && "otpCode" in serialized.security) {
      delete serialized.security.otpCode;
    }

    if (serialized.security && "passwordResetToken" in serialized.security) {
      delete serialized.security.passwordResetToken;
    }

    return serialized;
  },
});

UserSchema.set("toObject", {
  virtuals: true,
});

// ======================================================
// END OF SECTION 8/10
// NEXT SECTION: PRE-SAVE HOOKS + METHODS
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/User.ts
// SECTION 9/10
// PRE-SAVE HOOKS + PASSWORD METHODS + SECURITY METHODS
// ======================================================

// ======================================================
// PASSWORD HASHING BEFORE SAVE
// ======================================================

UserSchema.pre<IUser>("save", async function (next) {
  try {
    // Hash password only if modified
    if (!this.isModified("password")) {
      return next();
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    this.security.passwordChangedAt = new Date();

    next();
  } catch (error) {
    next(error as Error);
  }
});

// ======================================================
// AUTO GENERATE REFERRAL CODE
// ======================================================

UserSchema.pre<IUser>("save", function (next) {
  if (!this.referral.referralCode) {
    const randomCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    this.referral.referralCode = `GT${randomCode}`;
  }

  next();
});

// ======================================================
// UPDATE LAST SEEN ON SAVE
// ======================================================

UserSchema.pre<IUser>("save", function (next) {
  this.lastSeen = new Date();
  next();
});

// ======================================================
// PASSWORD COMPARE METHOD
// ======================================================

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ======================================================
// GENERATE REFERRAL CODE METHOD
// ======================================================

UserSchema.methods.generateReferralCode = function (): string {
  const randomCode = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `GT${randomCode}`;
};

// ======================================================
// OTP METHODS
// ======================================================

UserSchema.methods.generateOTP = function (
  purpose: string = "LOGIN"
): string {
  const security = this.security;

  if (!security) {
    return "";
  }

  const otp = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  security.otpCode = otp;
  security.otpPurpose = purpose;
  security.otpAttempts = 0;

  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 10);

  security.otpExpires = expiry;

  return otp;
};

UserSchema.methods.verifyOTP = function (
  otp: string
): boolean {
  const security = this.security;

  if (!security) return false;
  if (!security.otpCode) return false;
  if (!security.otpExpires) return false;
  if (new Date() > security.otpExpires) return false;
  if ((security.otpAttempts ?? 0) >= 5) return false;

  security.otpAttempts = (security.otpAttempts ?? 0) + 1;

  if (security.otpCode === otp) {
    security.otpCode = "";
    security.otpExpires = undefined;
    security.otpAttempts = 0;
    return true;
  }

  return false;
};

// ======================================================
// ACCOUNT LOCK METHODS
// ======================================================

UserSchema.methods.isLocked = function (): boolean {
  return !!(
    this.security.lockUntil &&
    this.security.lockUntil > new Date()
  );
};

UserSchema.methods.incrementLoginAttempts = async function () {
  if (
    this.security.lockUntil &&
    this.security.lockUntil < new Date()
  ) {
    this.security.loginAttempts = 1;
    this.security.lockUntil = undefined;
    return this.save();
  }

  this.security.loginAttempts += 1;

  if (this.security.loginAttempts >= 5) {
    const lockTime = new Date();
    lockTime.setMinutes(lockTime.getMinutes() + 30);

    this.security.lockUntil = lockTime;
  }

  return this.save();
};

UserSchema.methods.resetLoginAttempts = async function () {
  this.security.loginAttempts = 0;
  this.security.lockUntil = undefined;
  return this.save();
};

// ======================================================
// LOGIN SUCCESS METHOD
// ======================================================

UserSchema.methods.recordSuccessfulLogin = async function (
  ip: string,
  device: string,
  browser: string
) {
  const security = this.security;

  if (!security) {
    throw new Error("User security data is missing");
  }

  security.lastLogin = new Date();
  security.lastLoginIP = ip;
  security.lastDevice = device;
  security.lastBrowser = browser;

  security.loginAttempts = 0;
  security.lockUntil = undefined;

  const loginHistory = this.loginHistory ?? [];
  loginHistory.unshift({
    loginTime: new Date(),
    ipAddress: ip,
    device,
    browser,
    operatingSystem: device,
    location: {
      country: "",
      city: "",
    },
    status: "SUCCESS",
  });

  this.loginHistory = loginHistory.slice(0, 20);

  return this.save();
};

// ======================================================
// PASSWORD RESET TOKEN
// ======================================================

UserSchema.methods.generatePasswordResetToken = function (): string {
  const token = Math.random()
    .toString(36)
    .substring(2) + Date.now().toString(36);

  this.security.passwordResetToken = token;

  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 30);

  this.security.passwordResetExpires = expiry;

  return token;
};

// ======================================================
// END OF SECTION 9/10
// NEXT SECTION: MODEL EXPORT + FINAL SCHEMA
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/models/User.ts
// SECTION 10/10
// FINAL SCHEMA OPTIONS + MODEL EXPORT
// ======================================================

// ======================================================
// SCHEMA TIMESTAMPS & OPTIONS
// ======================================================

UserSchema.set("timestamps", true);

UserSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: any) => {
    if ("password" in ret) {
      delete ret.password;
    }

    if (ret.security) {
      delete ret.security.otpCode;
      delete ret.security.passwordResetToken;
      delete ret.security.otpAttempts;
      delete ret.security.loginAttempts;
    }

    return ret;
  },
});

UserSchema.set("toObject", {
  virtuals: true,
  versionKey: false,
});

// ======================================================
// INSTANCE METHODS TYPES
// ======================================================

export interface IUserMethods {
  comparePassword(password: string): Promise<boolean>;
  generateReferralCode(): string;
  generateOTP(purpose?: string): string;
  verifyOTP(otp: string): boolean;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<IUser>;
  resetLoginAttempts(): Promise<IUser>;
  recordSuccessfulLogin(
    ip: string,
    device: string,
    browser: string
  ): Promise<IUser>;
  generatePasswordResetToken(): string;
}

// ======================================================
// STATIC METHODS
// ======================================================

export interface IUserModel extends Model<IUser> {
  findByReferralCode(code: string): Promise<IUser | null>;
}

UserSchema.statics.findByReferralCode = function (
  code: string
) {
  return this.findOne({
    "referral.referralCode": code.toUpperCase(),
  });
};

// ======================================================
// MONGOOSE MODEL EXPORT
// ======================================================

const User =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUser, IUserModel>(
    "User",
    UserSchema
  );

export default User;

// ======================================================
// END OF FILE
// backend/src/models/User.ts
// GOLDTRADE V17 ENTERPRISE USER MODEL COMPLETE
// ======================================================