"use strict";

// =======================================================
// GoldTrade V18 - Deposit Routes
// Linux + Render Compatible
// =======================================================

const express = require("express");
const router = express.Router();

// =======================================================
// MODELS
// =======================================================

const Deposit = require("../models/Deposit");
const User = require("../models/User");

// =======================================================
// MIDDLEWARE
// =======================================================

const { verifyToken } = require("../middleware/auth");

// =======================================================
// ALL ROUTES REQUIRE LOGIN
// =======================================================

router.use(verifyToken);

// =======================================================
// HEALTH CHECK
// GET /api/deposit/health
// =======================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Deposit API Working - GoldTrade V18",
    version: "V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// CREATE DEPOSIT REQUEST
// POST /api/deposit
// =======================================================

router.post("/", async (req, res) => {
  try {
    const {
      requestAmount,
      currency,
      paymentMethod,
      senderName,
      senderAccount,
      transactionId,
      receiptImage,
      note,
    } = req.body;

    const amount = Number(requestAmount);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid deposit amount is required.",
      });
    }

    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const deposit = await Deposit.create({
      userId: user._id,
      username: user.username,
      email: user.email,

      requestAmount: amount,
      currency: (currency || "PKR").toUpperCase(),
      paymentMethod: paymentMethod || "Bank Transfer",

      senderName: senderName || "",
      senderAccount: senderAccount || "",
      transactionId: transactionId || "",
      receiptImage: receiptImage || "",
      note: note || "",

      status: "Pending",
      approvedBy: null,
      approvedAt: null,
    });

    return res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully.",
      deposit,
    });

  } catch (err) {
    console.error("CREATE DEPOSIT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Deposit request failed.",
      error: err.message,
    });
  }
});

// =======================================================
// USER DEPOSIT HISTORY
// GET /api/deposit/history
// =======================================================

router.get("/history", async (req, res) => {
  try {
    const deposits = await Deposit.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      totalDeposits: deposits.length,
      deposits,
    });

  } catch (err) {
    console.error("DEPOSIT HISTORY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load deposit history.",
      error: err.message,
    });
  }
});

// =======================================================
// GET SINGLE DEPOSIT
// GET /api/deposit/:id
// =======================================================

router.get("/:id", async (req, res) => {
  try {
    const deposit = await Deposit.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    return res.json({
      success: true,
      deposit,
    });

  } catch (err) {
    console.error("GET DEPOSIT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load deposit.",
      error: err.message,
    });
  }
});

// =======================================================
// EXPORT ROUTER
// =======================================================

module.exports = router;