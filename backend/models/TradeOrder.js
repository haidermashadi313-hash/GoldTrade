const mongoose = require("mongoose");

/* ============================================================
   TRADE ORDER SCHEMA
   GoldTrade Buy / Sell Orders
============================================================ */

const tradeOrderSchema = new mongoose.Schema(
  {
    /* ==========================================================
       USER
    ========================================================== */

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    /* ==========================================================
       TRADE TYPE
    ========================================================== */

    tradeType: {
      type: String,
      enum: ["buy", "sell"],
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /* ==========================================================
       GOLD QUANTITY
       Unit: grams
    ========================================================== */

    grams: {
      type: Number,
      required: true,
      min: [0.0001, "Gold quantity must be greater than 0"],
    },

    /* ==========================================================
       PRICE
       PKR per gram
    ========================================================== */

    pricePerGram: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },

    /* ==========================================================
       TOTAL
       grams × pricePerGram
    ========================================================== */

    totalPkr: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },

    /* ==========================================================
       ORDER STATUS
    ========================================================== */

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
      ],
      default: "Pending",
      index: true,
    },

    /* ==========================================================
       ADMIN NOTE
    ========================================================== */

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },

    /* ==========================================================
       APPROVAL
    ========================================================== */

    approvedAt: {
      type: Date,
      default: null,
    },

    /* ==========================================================
       REJECTION
    ========================================================== */

    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   VALIDATION
   Make sure totalPkr matches grams × pricePerGram.
   Small rounding tolerance is allowed.
============================================================ */

tradeOrderSchema.pre("validate", function (next) {
  const grams = Number(this.grams);
  const pricePerGram = Number(
    this.pricePerGram
  );
  const totalPkr = Number(this.totalPkr);

  if (
    !Number.isFinite(grams) ||
    grams <= 0
  ) {
    return next(
      new Error(
        "Invalid gold quantity."
      )
    );
  }

  if (
    !Number.isFinite(pricePerGram) ||
    pricePerGram < 0
  ) {
    return next(
      new Error(
        "Invalid gold price."
      )
    );
  }

  if (
    !Number.isFinite(totalPkr) ||
    totalPkr < 0
  ) {
    return next(
      new Error(
        "Invalid total PKR amount."
      )
    );
  }

  const calculatedTotal =
    grams * pricePerGram;

  const difference = Math.abs(
    calculatedTotal - totalPkr
  );

  /*
   * Allow a very small floating-point
   * rounding difference.
   */
  if (difference > 0.01) {
    return next(
      new Error(
        "Total PKR does not match gold quantity × price per gram."
      )
    );
  }

  next();
});

/* ============================================================
   APPROVAL / REJECTION SAFETY
============================================================ */

tradeOrderSchema.pre(
  "save",
  function (next) {
    if (
      this.status === "Approved" &&
      !this.approvedAt
    ) {
      this.approvedAt = new Date();
    }

    if (
      this.status !== "Approved"
    ) {
      this.approvedAt = null;
    }

    if (
      this.status === "Rejected"
    ) {
      if (!this.rejectedAt) {
        this.rejectedAt = new Date();
      }
    } else {
      this.rejectedAt = null;
    }

    next();
  }
);

/* ============================================================
   EXPORT
============================================================ */

module.exports =
  mongoose.model(
    "TradeOrder",
    tradeOrderSchema
  );