"use strict";

const express = require("express");
const router = express.Router();

// Models
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");

// Middleware
const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// GET COMPLETE HISTORY (ADMIN)
// GET /api/history
// ======================================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 });
    const withdrawals = await Withdraw.find().sort({ createdAt: -1 });

    const history = [
      ...deposits.map((deposit) => ({
        type: "Deposit",
        ...deposit.toObject(),
      })),
      ...withdrawals.map((withdraw) => ({
        type: "Withdraw",
        ...withdraw.toObject(),
      })),
    ].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.json({
      success: true,
      history,
      totalDeposits: deposits.length,
      totalWithdrawals: withdrawals.length,
      totalRecords: history.length,
    });
  } catch (err) {
    console.error("HISTORY ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load history.",
    });
  }
});

// ======================================================
// HEALTH CHECK
// GET /api/history/health
// ======================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "History Routes Working - GoldTrade V18",
    version: "V18",
  });
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;