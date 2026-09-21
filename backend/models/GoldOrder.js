const mongoose = require("mongoose");

const GoldOrderSchema = new mongoose.Schema(
  {
    // =====================================================
    // USER INFORMATION
    // =====================================================

    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    fullName: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // ORDER TYPE
    // BUY | SELL
    // =====================================================

    orderType: {
      type: String,
      required: true,
      enum: ["BUY", "SELL"],
    },

    // =====================================================
    // GOLD ORDER DETAILS
    // =====================================================

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // =====================================================
    // ORDER STATUS
    // =====================================================

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // =====================================================
    // PAYMENT INFORMATION
    // =====================================================

    paymentMethod: {
      type: String,
      default: "PKR Wallet",
    },

    walletType: {
      type: String,
      enum: ["PKR", "GOLD", "USDT"],
      default: "PKR",
    },
        // =====================================================
    // MARKET INFORMATION
    // =====================================================

    goldPriceUSD: {
      type: Number,
      default: 0,
      min: 0,
    },

    usdToPkr: {
      type: Number,
      default: 0,
      min: 0,
    },

    marketStatus: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },

    // =====================================================
    // PAYMENT / TRANSACTION INFORMATION
    // =====================================================

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    transactionHash: {
      type: String,
      default: "",
      trim: true,
    },

    walletAddress: {
      type: String,
      default: "",
      trim: true,
    },

    network: {
      type: String,
      default: "TRC20",
      trim: true,
    },

    // =====================================================
    // ADMIN APPROVAL INFORMATION
    // =====================================================

    approvedBy: {
      type: String,
      default: "",
      trim: true,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedReason: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // USER NOTE
    // =====================================================

    note: {
      type: String,
      default: "",
      trim: true,
    },
        // =====================================================
    // PRICE SNAPSHOT (Order Time)
    // =====================================================

    buyGoldPriceSnapshot: {
      type: Number,
      default: 0,
      min: 0,
    },

    sellGoldPriceSnapshot: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =====================================================
    // WALLET BALANCE SNAPSHOT
    // =====================================================

    beforePkrBalance: {
      type: Number,
      default: 0,
    },

    afterPkrBalance: {
      type: Number,
      default: 0,
    },

    beforeGoldBalance: {
      type: Number,
      default: 0,
    },

    afterGoldBalance: {
      type: Number,
      default: 0,
    },

    beforeUsdtBalance: {
      type: Number,
      default: 0,
    },

    afterUsdtBalance: {
      type: Number,
      default: 0,
    },

    // =====================================================
    // ADMIN AUDIT INFORMATION
    // =====================================================

    createdBy: {
      type: String,
      default: "USER",
      trim: true,
    },

    lastUpdatedBy: {
      type: String,
      default: "",
      trim: true,
    },

    lastUpdatedAt: {
      type: Date,
      default: null,
    },

    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },

    deviceInfo: {
      type: String,
      default: "",
      trim: true,
    },

    // =====================================================
    // ORDER FLAGS
    // =====================================================

    isCancelled: {
      type: Boolean,
      default: false,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    isAdminOrder: {
      type: Boolean,
      default: false,
    },  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// =====================================================
// DATABASE INDEXES
// =====================================================

GoldOrderSchema.index({ username: 1, createdAt: -1 });
GoldOrderSchema.index({ orderType: 1, status: 1 });
GoldOrderSchema.index({ status: 1, createdAt: -1 });
GoldOrderSchema.index({ approvedBy: 1 });
// =====================================================
// VIRTUAL: ORDER SUMMARY
// =====================================================

GoldOrderSchema.virtual("orderSummary").get(function () {
  return {
    username: this.username,
    orderType: this.orderType,
    quantity: this.quantity,
    totalAmount: this.totalAmount,
    status: this.status,
  };
});

// =====================================================
// HELPER METHOD: APPROVE ORDER
// =====================================================

GoldOrderSchema.methods.approveOrder = function (adminUsername) {
  this.status = "Approved";
  this.approvedBy = adminUsername;
  this.approvedAt = new Date();
  this.lastUpdatedBy = adminUsername;
  this.lastUpdatedAt = new Date();

  return this.save();
};

// =====================================================
// HELPER METHOD: REJECT ORDER
// =====================================================

GoldOrderSchema.methods.rejectOrder = function (
  adminUsername,
  reason = ""
) {
  this.status = "Rejected";
  this.rejectedReason = reason;
  this.approvedBy = adminUsername;
  this.approvedAt = new Date();
  this.lastUpdatedBy = adminUsername;
  this.lastUpdatedAt = new Date();

  return this.save();
};

// =====================================================
// HELPER METHOD: CANCEL ORDER
// =====================================================

GoldOrderSchema.methods.cancelOrder = function () {
  this.isCancelled = true;
  this.status = "Rejected";
  this.lastUpdatedAt = new Date();

  return this.save();
};

// =====================================================
// PRE-SAVE MIDDLEWARE
// =====================================================

GoldOrderSchema.pre("save", function (next) {
  // Auto calculate total amount
  if (
    this.isModified("quantity") ||
    this.isModified("price")
  ) {
    this.totalAmount =
      Number(this.quantity || 0) *
      Number(this.price || 0);
  }

  // Update last modified date
  this.lastUpdatedAt = new Date();

  next();
});

// =====================================================
// TO JSON CONFIGURATION
// =====================================================

GoldOrderSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

GoldOrderSchema.set("toObject", {
  virtuals: true,
});

// =====================================================
// EXPORT MODEL
// =====================================================

module.exports = mongoose.model(
  "GoldOrder",
  GoldOrderSchema
);