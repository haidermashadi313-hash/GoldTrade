"use strict";

// =======================================================
// GoldTrade V18 - History Routes
// Linux + Render Compatible
// =======================================================

const express = require("express");
const router = express.Router();

// =======================================================
// MODELS
// =======================================================

const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");

// =======================================================
// MIDDLEWARE
// =======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =======================================================
// HEALTH CHECK
// GET /api/history/health
// =======================================================

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "History API Working - GoldTrade V18",
    version: "V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// ALL REMAINING ROUTES REQUIRE ADMIN LOGIN
// =======================================================

router.use(verifyToken);
router.use(isAdmin);

// =======================================================
// GET COMPLETE HISTORY (ADMIN)
// GET /api/history
// =======================================================

router.get("/", async (req, res) => {
  try {
    const deposits = await Deposit.find({})
      .sort({ createdAt: -1 })
      .lean();

    const withdrawals = await Withdraw.find({})
      .sort({ createdAt: -1 })
      .lean();

    const history = [
      ...deposits.map((deposit) => ({
        ...deposit,
        type: "DEPOSIT",
      })),
      ...withdrawals.map((withdraw) => ({
        ...withdraw,
        type: "WITHDRAW",
      })),
    ].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.status(200).json({
      success: true,

      totalDeposits: deposits.length,
      totalWithdrawals: withdrawals.length,
      totalRecords: history.length,

      history,
    });

  } catch (err) {
    console.error("HISTORY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load history.",
      error: err.message,
    });
  }
});

// =======================================================
// EXPORT ROUTER
// =======================================================

module.exports = router;