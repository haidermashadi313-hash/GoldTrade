/*
========================================================
 GoldTrade V18 Enterprise
 Transaction Audit Routes
 Linux + Render + MongoDB Compatible
========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const Transaction = require("../models/Transaction");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// USER TRANSACTION HISTORY
// GET /api/transactions/history/:username
// ======================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    // User can only access their own history.
    if (username !== req.user.username.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const transactions = await Transaction.find({ username })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      transactions,
      total: transactions.length,
    });
  } catch (error) {
    console.error("USER TRANSACTION HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load transaction history.",
      error: error.message,
    });
  }
});

// ======================================================
// USER TRANSACTION DETAILS
// GET /api/transactions/details/:id
// ======================================================

router.get("/details/:id", verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).lean();

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    // Security check
    if (
      transaction.username !== req.user.username.toLowerCase() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      transaction,
    });
  } catch (error) {
    console.error("TRANSACTION DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load transaction details.",
      error: error.message,
    });
  }
});
// ======================================================
// ADMIN TRANSACTION LIST
// GET /api/transactions/admin
// Enterprise Search + Filters
// ======================================================

router.get("/admin", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      username,
      walletType,
      transactionType,
      status,
      page = 1,
      limit = 25,
    } = req.query;

    // ================= QUERY BUILDER =================

    const query = {};

    if (username && username.trim() !== "") {
      query.username = username.trim().toLowerCase();
    }

    if (
      walletType &&
      ["PKR", "GOLD", "USDT"].includes(walletType)
    ) {
      query.walletType = walletType;
    }

    if (transactionType && transactionType !== "ALL") {
      query.transactionType = transactionType;
    }

    if (
      status &&
      ["Pending", "Completed", "Rejected", "Failed"].includes(status)
    ) {
      query.status = status;
    }

    // ================= PAGINATION =================

    const currentPage = Math.max(Number(page), 1);
    const pageSize = Math.min(Math.max(Number(limit), 1), 100);

    const totalTransactions = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return res.status(200).json({
      success: true,
      transactions,

      pagination: {
        currentPage,
        pageSize,
        totalTransactions,
        totalPages: Math.ceil(totalTransactions / pageSize),
      },
    });
  } catch (error) {
    console.error("ADMIN TRANSACTION LIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load transactions.",
      error: error.message,
    });
  }
});

// ======================================================
// ADMIN TRANSACTION BY USER
// GET /api/transactions/admin/user/:username
// ======================================================

router.get(
  "/admin/user/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username = req.params.username.trim().toLowerCase();

      const transactions = await Transaction.find({ username })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        username,
        total: transactions.length,
        transactions,
      });
    } catch (error) {
      console.error("ADMIN USER TRANSACTION ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load user transactions.",
        error: error.message,
      });
    }
  }
);
// ======================================================
// ADMIN TRANSACTION DASHBOARD STATS
// GET /api/transactions/admin/stats
// Enterprise Analytics
// ======================================================

router.get("/admin/stats", verifyToken, isAdmin, async (req, res) => {
  try {
    // ====================================================
    // BASIC COUNTS
    // ====================================================

    const totalTransactions = await Transaction.countDocuments();

    const completedTransactions = await Transaction.countDocuments({
      status: "Completed",
    });

    const pendingTransactions = await Transaction.countDocuments({
      status: "Pending",
    });

    const rejectedTransactions = await Transaction.countDocuments({
      status: "Rejected",
    });

    const failedTransactions = await Transaction.countDocuments({
      status: "Failed",
    });

    // ====================================================
    // WALLET TOTALS
    // ====================================================

    const walletTotals = await Transaction.aggregate([
      {
        $match: { status: "Completed" },
      },
      {
        $group: {
          _id: "$walletType",
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const walletSummary = {
      PKR: { amount: 0, count: 0 },
      GOLD: { amount: 0, count: 0 },
      USDT: { amount: 0, count: 0 },
    };

    walletTotals.forEach((item) => {
      walletSummary[item._id] = {
        amount: item.totalAmount,
        count: item.totalCount,
      };
    });

    // ====================================================
    // TRANSACTION TYPE TOTALS
    // ====================================================

    const transactionTotals = await Transaction.aggregate([
      {
        $match: { status: "Completed" },
      },
      {
        $group: {
          _id: "$transactionType",
          totalAmount: { $sum: "$amount" },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const transactionSummary = {};

    transactionTotals.forEach((item) => {
      transactionSummary[item._id] = {
        amount: item.totalAmount,
        count: item.totalCount,
      };
    });

    // ====================================================
    // LAST 24 HOURS
    // ====================================================

    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const last24Hours = await Transaction.countDocuments({
      createdAt: { $gte: yesterday },
    });

    const last24Volume = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterday },
          status: "Completed",
        },
      },
      {
        $group: {
          _id: "$walletType",
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const volume24 = {
      PKR: 0,
      GOLD: 0,
      USDT: 0,
    };

    last24Volume.forEach((item) => {
      volume24[item._id] = item.totalAmount;
    });

    // ====================================================
    // RESPONSE
    // ====================================================

    return res.status(200).json({
      success: true,

      overview: {
        totalTransactions,
        completedTransactions,
        pendingTransactions,
        rejectedTransactions,
        failedTransactions,
        last24Hours,
      },

      walletSummary,

      transactionSummary,

      last24Volume: volume24,
    });
  } catch (error) {
    console.error("TRANSACTION STATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load transaction statistics.",
      error: error.message,
    });
  }
});
// ======================================================
// ADMIN RECENT TRANSACTIONS
// GET /api/transactions/admin/recent
// Latest 20 completed transactions
// ======================================================

router.get("/admin/recent", verifyToken, isAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("RECENT TRANSACTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent transactions.",
      error: error.message,
    });
  }
});

// ======================================================
// TRANSACTION HEALTH CHECK
// GET /api/transactions/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Transaction Audit Manager",
    version: "GoldTrade V18 Enterprise",
    status: "Working",
    timestamp: new Date().toISOString(),
    routes: [
      "/api/transactions/history/:username",
      "/api/transactions/details/:id",
      "/api/transactions/admin",
      "/api/transactions/admin/user/:username",
      "/api/transactions/admin/stats",
      "/api/transactions/admin/recent",
      "/api/transactions/health",
    ],
  });
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;