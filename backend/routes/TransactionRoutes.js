"use strict";

// =======================================================
// GoldTrade V18 - Transaction Routes
// Linux + Render Compatible
// =======================================================

const express = require("express");
const router = express.Router();

// =======================================================
// MODEL
// =======================================================

const Transaction = require("../models/Transaction");

// =======================================================
// MIDDLEWARE
// =======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =======================================================
// HEALTH CHECK
// GET /api/transactions/health
// =======================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Transaction API Working - GoldTrade V18",
    version: "V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// GET USER TRANSACTIONS
// GET /api/transactions
// =======================================================

router.get("/", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      totalTransactions: transactions.length,
      transactions,
    });

  } catch (err) {
    console.error("GET USER TRANSACTIONS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load transactions.",
      error: err.message,
    });
  }
});

// =======================================================
// CREATE TRANSACTION
// POST /api/transactions
// =======================================================

router.post("/", verifyToken, async (req, res) => {
  try {
    const { type, amount, asset, note, description } = req.body;

    if (!type || !amount) {
      return res.status(400).json({
        success: false,
        message: "Transaction type and amount are required.",
      });
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      username: req.user.username,

      type,
      amount: Number(amount),
      asset: asset || "PKR",

      note: note || "",
      description: description || "",

      status: "Pending",
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Transaction created successfully.",
      transaction,
    });

  } catch (err) {
    console.error("CREATE TRANSACTION ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Transaction failed.",
      error: err.message,
    });
  }
});

// =======================================================
// GET ALL TRANSACTIONS (ADMIN)
// GET /api/transactions/admin/all
// =======================================================

router.get("/admin/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    return res.json({
      success: true,
      totalTransactions: transactions.length,
      transactions,
    });

  } catch (err) {
    console.error("ADMIN TRANSACTIONS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin transactions.",
      error: err.message,
    });
  }
});

// =======================================================
// EXPORT ROUTER
// =======================================================

module.exports = router;