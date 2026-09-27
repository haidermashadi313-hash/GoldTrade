/*
========================================================
 GoldTrade V18 Enterprise Backend
 depositRoutes.js — PART 1/8
 Health + Status + Create Deposit APIs
 Production Ready (Render + PM2 + MongoDB Atlas)
========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const Deposit = require("../models/Deposit");
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const WalletHistory = require("../models/WalletHistory");
const Transaction = require("../models/Transaction");
const Settings = require("../models/Settings");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// DEFAULT SETTINGS
// ======================================================

const DEFAULT_DEPOSIT_SETTINGS = {
  depositsEnabled: true,
  minimumDeposit: 1000,
  maximumDeposit: 10000000,
};

// ======================================================
// GET SETTINGS
// ======================================================

const getDepositSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create(DEFAULT_DEPOSIT_SETTINGS);
    console.log("🟢 Default Deposit Settings Created");
  }

  return settings;
};

// ======================================================
// GET USER WALLET
// ======================================================

const getWallet = async (userId, username) => {
  let wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      username,
    });
  }

  return wallet;
};

// ======================================================
// HEALTH CHECK
// GET /api/deposit/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Deposit API",
    version: "18.0.0 Enterprise",
    status: "ONLINE",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// API STATUS
// GET /api/deposit/status
// ======================================================

router.get("/status", async (req, res) => {
  try {
    const settings = await getDepositSettings();

    return res.status(200).json({
      success: true,

      depositsEnabled: settings.depositsEnabled,
      minimumDeposit: Number(settings.minimumDeposit),
      maximumDeposit: Number(settings.maximumDeposit),

      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error("DEPOSIT STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit status.",
    });
  }
});

// ======================================================
// CREATE DEPOSIT REQUEST
// POST /api/deposit/create
// Used by frontend/app/deposit/page.tsx
// ======================================================

router.post("/create", verifyToken, async (req, res) => {
  try {
    const {
      walletType,
      amount,
      paymentMethod,
      senderName,
      senderAccount,
      receiverAccount,
      transactionId,
      referenceId,
      receiptImage,
      network,
      note,
    } = req.body;

    const depositAmount = Number(amount);

    // ---------------- VALIDATION ----------------

    if (!walletType || !paymentMethod || !depositAmount) {
      return res.status(400).json({
        success: false,
        message: "Wallet type, payment method and amount are required.",
      });
    }

    const settings = await getDepositSettings();

    if (!settings.depositsEnabled) {
      return res.status(403).json({
        success: false,
        message: "Deposits are currently disabled.",
      });
    }

    if (depositAmount < settings.minimumDeposit) {
      return res.status(400).json({
        success: false,
        message: `Minimum deposit is ${settings.minimumDeposit}.`,
      });
    }

    if (depositAmount > settings.maximumDeposit) {
      return res.status(400).json({
        success: false,
        message: `Maximum deposit is ${settings.maximumDeposit}.`,
      });
    }

    const walletCurrency = String(walletType).toUpperCase();

    if (!["PKR", "USDT"].includes(walletCurrency)) {
      return res.status(400).json({
        success: false,
        message: "Wallet type must be PKR or USDT.",
      });
    }

    // ---------------- USER ----------------

    const user = await User.findById(req.user.id)
      .select("_id username fullName email")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ---------------- WALLET ----------------

    const wallet = await getWallet(user._id, user.username);

    const walletBefore = {
      pkrBalance: Number(wallet.pkrBalance || 0),
      usdtBalance: Number(wallet.usdtBalance || 0),
      goldBalance: Number(wallet.goldBalance || 0),
    };

    // ---------------- CREATE REQUEST ----------------

    const deposit = await Deposit.create({
      userId: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,

      walletType: walletCurrency,
      amount: depositAmount,
      currency: walletCurrency,
      network: network || "",

      paymentMethod,
      senderName,
      senderAccount,
      receiverAccount,
      transactionId,
      referenceId,

      receiptImage: receiptImage || "",
      receiptUploaded: Boolean(receiptImage),

      walletBefore,

      note: note || "",

      ipAddress: req.ip,
      device: req.headers["user-agent"] || "",
    });

    // ---------------- TRANSACTION LOG ----------------

    await Transaction.create({
      userId: user._id,
      username: user.username,

      walletType: walletCurrency,
      transactionType: "DEPOSIT_REQUEST",
      transactionMode: "CREDIT",

      amount: depositAmount,
      balanceBefore:
        walletCurrency === "PKR"
          ? walletBefore.pkrBalance
          : walletBefore.usdtBalance,

      balanceAfter:
        walletCurrency === "PKR"
          ? walletBefore.pkrBalance
          : walletBefore.usdtBalance,

      status: "Pending",

      paymentMethod,
      referenceId: deposit._id.toString(),

      note: `Deposit request submitted (${walletCurrency})`,
    });

    // ---------------- RESPONSE ----------------

    return res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully.",

      deposit: {
        id: deposit._id,
        walletType: deposit.walletType,
        amount: deposit.amount,
        status: deposit.status,
        paymentMethod: deposit.paymentMethod,
        createdAt: deposit.createdAt,
      },
    });

  } catch (error) {
    console.error("CREATE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create deposit request.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js — PART 2/8
// Deposit History + Pending + Recent APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET CURRENT USER DEPOSIT HISTORY
// GET /api/deposit/history
// Used by frontend/app/deposit/history/page.tsx
// ======================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const total = await Deposit.countDocuments({
      userId: req.user.id,
    });

    const deposits = await Deposit.find({
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      history: deposits.map((deposit) => ({
        id: deposit._id,
        walletType: deposit.walletType,
        amount: Number(deposit.amount),
        currency: deposit.currency,
        network: deposit.network,

        paymentMethod: deposit.paymentMethod,
        senderName: deposit.senderName,
        senderAccount: deposit.senderAccount,
        receiverAccount: deposit.receiverAccount,

        transactionId: deposit.transactionId,
        referenceId: deposit.referenceId,

        receiptUploaded: deposit.receiptUploaded,
        receiptImage: deposit.receiptImage,

        status: deposit.status,
        note: deposit.note,
        rejectReason: deposit.rejectReason,

        createdAt: deposit.createdAt,
        updatedAt: deposit.updatedAt,
      })),
    });

  } catch (error) {
    console.error("GET DEPOSIT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET USER DEPOSIT HISTORY BY USERNAME
// GET /api/deposit/history/:username
// Admin or Same User
// ======================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    if (
      req.user.role !== "admin" &&
      req.user.username.toLowerCase() !== username
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const user = await User.findOne({ username })
      .select("_id username")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const total = await Deposit.countDocuments({
      userId: user._id,
    });

    const deposits = await Deposit.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,

      username: user.username,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      history: deposits,
    });

  } catch (error) {
    console.error("GET USER DEPOSIT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user deposit history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET PENDING DEPOSITS
// GET /api/deposit/pending
// Admin Dashboard
// ======================================================

router.get("/pending", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: deposits.length,
      pendingDeposits: deposits,
    });

  } catch (error) {
    console.error("GET PENDING DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending deposits.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET RECENT DEPOSITS
// GET /api/deposit/recent
// Dashboard Recent Activity
// ======================================================

router.get("/recent", verifyToken, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const query =
      req.user.role === "admin"
        ? {}
        : { userId: req.user.id };

    const deposits = await Deposit.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      total: deposits.length,
      recentDeposits: deposits,
    });

  } catch (error) {
    console.error("GET RECENT DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent deposits.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// FILTER DEPOSIT HISTORY
// GET /api/deposit/filter
// Query:
// ?status=PENDING
// ?walletType=PKR
// ?start=2026-01-01&end=2026-01-31
// ======================================================

router.get("/filter", verifyToken, async (req, res) => {
  try {
    const { status, walletType, start, end } = req.query;

    const query = {
      userId: req.user.id,
    };

    if (status) {
      query.status = String(status).toUpperCase();
    }

    if (walletType) {
      query.walletType = String(walletType).toUpperCase();
    }

    if (start || end) {
      query.createdAt = {};

      if (start) {
        query.createdAt.$gte = new Date(start);
      }

      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const deposits = await Deposit.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: deposits.length,
      history: deposits,
    });

  } catch (error) {
    console.error("FILTER DEPOSIT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to filter deposit history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js — PART 3/8
// Admin Deposit Approval APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// APPROVE DEPOSIT
// PATCH /api/deposit/:id/approve
// Used by frontend/app/admin/deposits/page.tsx
// ======================================================

router.patch("/:id/approve", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    if (deposit.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Deposit already ${deposit.status.toLowerCase()}.`,
      });
    }

    // ==================================================
    // USER WALLET
    // ==================================================

    const wallet = await getWallet(deposit.userId, deposit.username);

    deposit.walletBefore = {
      pkrBalance: Number(wallet.pkrBalance || 0),
      usdtBalance: Number(wallet.usdtBalance || 0),
      goldBalance: Number(wallet.goldBalance || 0),
    };

    // ==================================================
    // CREDIT WALLET
    // ==================================================

    if (deposit.walletType === "PKR") {
      wallet.pkrBalance += Number(deposit.amount);
      wallet.totalDeposit += Number(deposit.amount);
    }

    if (deposit.walletType === "USDT") {
      wallet.usdtBalance += Number(deposit.amount);
      wallet.totalUsdtDeposited += Number(deposit.amount);
    }

    wallet.lastDepositAt = new Date();

    await wallet.save();

    deposit.walletAfter = {
      pkrBalance: Number(wallet.pkrBalance),
      usdtBalance: Number(wallet.usdtBalance),
      goldBalance: Number(wallet.goldBalance),
    };

    // ==================================================
    // UPDATE DEPOSIT STATUS
    // ==================================================

    deposit.status = "APPROVED";
    deposit.approvedBy = req.user.id;
    deposit.approvedByUsername = req.user.username;
    deposit.approvedAt = new Date();

    await deposit.save();

    // ==================================================
    // WALLET HISTORY
    // ==================================================

    await WalletHistory.create({
      userId: deposit.userId,
      username: deposit.username,

      walletType: deposit.walletType,
      type: "DEPOSIT",

      amount: Number(deposit.amount),

      balanceBefore:
        deposit.walletType === "PKR"
          ? deposit.walletBefore.pkrBalance
          : deposit.walletBefore.usdtBalance,

      balanceAfter:
        deposit.walletType === "PKR"
          ? wallet.pkrBalance
          : wallet.usdtBalance,

      referenceId: deposit._id.toString(),
      admin: req.user.username,
      note: `Deposit approved by ${req.user.username}`,
    });

    // ==================================================
    // TRANSACTION LEDGER
    // ==================================================

    await Transaction.create({
      userId: deposit.userId,
      username: deposit.username,

      walletType: deposit.walletType,

      transactionType: "DEPOSIT_APPROVED",
      transactionMode: "CREDIT",

      amount: Number(deposit.amount),

      balanceBefore:
        deposit.walletType === "PKR"
          ? deposit.walletBefore.pkrBalance
          : deposit.walletBefore.usdtBalance,

      balanceAfter:
        deposit.walletType === "PKR"
          ? wallet.pkrBalance
          : wallet.usdtBalance,

      status: "Completed",

      paymentMethod: deposit.paymentMethod,
      referenceId: deposit._id.toString(),

      adminId: req.user.id,
      adminUsername: req.user.username,

      note: "Deposit approved successfully.",
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message: "Deposit approved successfully.",

      deposit: {
        id: deposit._id,
        username: deposit.username,
        walletType: deposit.walletType,
        amount: deposit.amount,
        status: deposit.status,
        approvedBy: deposit.approvedByUsername,
        approvedAt: deposit.approvedAt,
      },

      wallet: {
        pkrBalance: Number(wallet.pkrBalance),
        usdtBalance: Number(wallet.usdtBalance),
        goldBalance: Number(wallet.goldBalance),
      },
    });

  } catch (error) {
    console.error("APPROVE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve deposit.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js — PART 4A/8
// Reject Deposit API
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// REJECT DEPOSIT
// PATCH /api/deposit/:id/reject
// Used by frontend/app/admin/deposits/page.tsx
// ======================================================

router.patch("/:id/reject", verifyToken, isAdmin, async (req, res) => {
  try {
    const { rejectReason, note } = req.body;

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    if (deposit.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Deposit already ${deposit.status.toLowerCase()}.`,
      });
    }

    // ==================================================
    // UPDATE STATUS
    // ==================================================

    deposit.status = "REJECTED";
    deposit.rejectReason = rejectReason || "Deposit rejected by admin.";
    deposit.note = note || deposit.note;

    deposit.approvedBy = req.user.id;
    deposit.approvedByUsername = req.user.username;
    deposit.rejectedAt = new Date();

    await deposit.save();

    // ==================================================
    // TRANSACTION LEDGER
    // ======================================================

    await Transaction.create({
      userId: deposit.userId,
      username: deposit.username,

      walletType: deposit.walletType,

      transactionType: "DEPOSIT_REJECTED",
      transactionMode: "CREDIT",

      amount: Number(deposit.amount),

      balanceBefore:
        deposit.walletType === "PKR"
          ? Number(deposit.walletBefore?.pkrBalance || 0)
          : Number(deposit.walletBefore?.usdtBalance || 0),

      balanceAfter:
        deposit.walletType === "PKR"
          ? Number(deposit.walletBefore?.pkrBalance || 0)
          : Number(deposit.walletBefore?.usdtBalance || 0),

      status: "Rejected",

      paymentMethod: deposit.paymentMethod,
      referenceId: deposit._id.toString(),

      adminId: req.user.id,
      adminUsername: req.user.username,

      note: deposit.rejectReason,
    });

    // ==================================================
    // WALLET HISTORY (Audit Only)
    // ======================================================

    await WalletHistory.create({
      userId: deposit.userId,
      username: deposit.username,

      walletType: deposit.walletType,
      type: "DEPOSIT_REJECTED",

      amount: Number(deposit.amount),

      balanceBefore:
        deposit.walletType === "PKR"
          ? Number(deposit.walletBefore?.pkrBalance || 0)
          : Number(deposit.walletBefore?.usdtBalance || 0),

      balanceAfter:
        deposit.walletType === "PKR"
          ? Number(deposit.walletBefore?.pkrBalance || 0)
          : Number(deposit.walletBefore?.usdtBalance || 0),

      referenceId: deposit._id.toString(),

      admin: req.user.username,
      note: deposit.rejectReason,
    });

    // ==================================================
    // RESPONSE
    // ======================================================

    return res.status(200).json({
      success: true,
      message: "Deposit rejected successfully.",

      deposit: {
        id: deposit._id,
        username: deposit.username,
        walletType: deposit.walletType,
        amount: deposit.amount,
        status: deposit.status,
        rejectReason: deposit.rejectReason,
        rejectedAt: deposit.rejectedAt,
        rejectedBy: deposit.approvedByUsername,
      },
    });

  } catch (error) {
    console.error("REJECT DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject deposit.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js — PART 4B/8 FINAL
// Cancel Deposit + Admin Note + Duplicate Protection
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// CANCEL DEPOSIT (USER)
// PATCH /api/deposit/:id/cancel
// User can cancel only PENDING deposits
// ======================================================

router.patch("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    // User can cancel only their own deposit (unless admin)
    if (
      req.user.role !== "admin" &&
      deposit.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    if (deposit.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending deposits can be cancelled.",
      });
    }

    deposit.status = "CANCELLED";
    deposit.note = "Deposit cancelled by user.";
    deposit.rejectedAt = new Date();

    await deposit.save();

    // ================= TRANSACTION LOG =================

    await Transaction.create({
      userId: deposit.userId,
      username: deposit.username,

      walletType: deposit.walletType,

      transactionType: "DEPOSIT_REJECTED",
      transactionMode: "CREDIT",

      amount: Number(deposit.amount),

      balanceBefore:
        deposit.walletType === "PKR"
          ? Number(deposit.walletBefore?.pkrBalance || 0)
          : Number(deposit.walletBefore?.usdtBalance || 0),

      balanceAfter:
        deposit.walletType === "PKR"
          ? Number(deposit.walletBefore?.pkrBalance || 0)
          : Number(deposit.walletBefore?.usdtBalance || 0),

      status: "Rejected",

      paymentMethod: deposit.paymentMethod,
      referenceId: deposit._id.toString(),

      note: "Deposit cancelled by user.",
    });

    return res.status(200).json({
      success: true,
      message: "Deposit cancelled successfully.",

      deposit: {
        id: deposit._id,
        status: deposit.status,
        cancelledAt: deposit.rejectedAt,
      },
    });

  } catch (error) {
    console.error("CANCEL DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel deposit.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// UPDATE ADMIN NOTE
// PATCH /api/deposit/:id/note
// Admin can update internal note
// ======================================================

router.patch("/:id/note", verifyToken, isAdmin, async (req, res) => {
  try {
    const { note } = req.body;

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    deposit.note = note || "";
    await deposit.save();

    return res.status(200).json({
      success: true,
      message: "Deposit note updated successfully.",
      note: deposit.note,
    });

  } catch (error) {
    console.error("UPDATE DEPOSIT NOTE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update deposit note.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// CHECK DUPLICATE PENDING DEPOSIT
// GET /api/deposit/check-pending/:walletType
// Prevent multiple pending deposits
// ======================================================

router.get(
  "/check-pending/:walletType",
  verifyToken,
  async (req, res) => {
    try {
      const walletType = req.params.walletType.toUpperCase();

      const pendingDeposit = await Deposit.findOne({
        userId: req.user.id,
        walletType,
        status: "PENDING",
      }).lean();

      return res.status(200).json({
        success: true,
        hasPendingDeposit: !!pendingDeposit,
        pendingDeposit,
      });

    } catch (error) {
      console.error("CHECK PENDING DEPOSIT ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to check pending deposits.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// USER DEPOSIT SUMMARY
// GET /api/deposit/summary
// Dashboard Deposit Cards
// ======================================================

router.get("/summary", verifyToken, async (req, res) => {
  try {
    const deposits = await Deposit.find({
      userId: req.user.id,
    }).lean();

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let cancelled = 0;

    let totalPendingAmount = 0;
    let totalApprovedAmount = 0;

    deposits.forEach((deposit) => {
      switch (deposit.status) {
        case "PENDING":
          pending++;
          totalPendingAmount += Number(deposit.amount);
          break;

        case "APPROVED":
          approved++;
          totalApprovedAmount += Number(deposit.amount);
          break;

        case "REJECTED":
          rejected++;
          break;

        case "CANCELLED":
          cancelled++;
          break;
      }
    });

    return res.status(200).json({
      success: true,

      summary: {
        totalDeposits: deposits.length,

        pendingDeposits: pending,
        approvedDeposits: approved,
        rejectedDeposits: rejected,
        cancelledDeposits: cancelled,

        totalPendingAmount: Number(totalPendingAmount.toFixed(2)),
        totalApprovedAmount: Number(totalApprovedAmount.toFixed(2)),
      },
    });

  } catch (error) {
    console.error("DEPOSIT SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit summary.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js — PART 5A/8
// Admin Dashboard + Analytics APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// ADMIN DASHBOARD
// GET /api/deposit/admin/dashboard
// Used by frontend/app/admin/deposits/page.tsx
// ======================================================

router.get("/admin/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const [
      totalDeposits,
      pendingDeposits,
      approvedDeposits,
      rejectedDeposits,
      cancelledDeposits,
      recentDeposits,
    ] = await Promise.all([
      Deposit.countDocuments({}),
      Deposit.countDocuments({ status: "PENDING" }),
      Deposit.countDocuments({ status: "APPROVED" }),
      Deposit.countDocuments({ status: "REJECTED" }),
      Deposit.countDocuments({ status: "CANCELLED" }),
      Deposit.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const approvedList = await Deposit.find({
      status: "APPROVED",
    }).lean();

    const pendingList = await Deposit.find({
      status: "PENDING",
    }).lean();

    let totalApprovedAmount = 0;
    let totalPendingAmount = 0;
    let totalPkrDeposits = 0;
    let totalUsdtDeposits = 0;

    approvedList.forEach((deposit) => {
      totalApprovedAmount += Number(deposit.amount);

      if (deposit.walletType === "PKR") {
        totalPkrDeposits += Number(deposit.amount);
      }

      if (deposit.walletType === "USDT") {
        totalUsdtDeposits += Number(deposit.amount);
      }
    });

    pendingList.forEach((deposit) => {
      totalPendingAmount += Number(deposit.amount);
    });

    return res.status(200).json({
      success: true,

      dashboard: {
        totalDeposits,
        pendingDeposits,
        approvedDeposits,
        rejectedDeposits,
        cancelledDeposits,

        totalApprovedAmount: Number(totalApprovedAmount.toFixed(2)),
        totalPendingAmount: Number(totalPendingAmount.toFixed(2)),

        totalPkrDeposits: Number(totalPkrDeposits.toFixed(2)),
        totalUsdtDeposits: Number(totalUsdtDeposits.toFixed(6)),
      },

      recentDeposits,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("ADMIN DEPOSIT DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin deposit dashboard.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN ANALYTICS
// GET /api/deposit/admin/analytics
// Used by Dashboard Charts
// ======================================================

router.get("/admin/analytics", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({
      status: "APPROVED",
    }).lean();

    let totalAmount = 0;
    let totalPKR = 0;
    let totalUSDT = 0;

    const monthlyMap = {};

    deposits.forEach((deposit) => {
      const month = new Date(deposit.createdAt)
        .toISOString()
        .slice(0, 7);

      if (!monthlyMap[month]) {
        monthlyMap[month] = {
          month,
          deposits: 0,
          amount: 0,
          pkr: 0,
          usdt: 0,
        };
      }

      monthlyMap[month].deposits += 1;
      monthlyMap[month].amount += Number(deposit.amount);

      if (deposit.walletType === "PKR") {
        monthlyMap[month].pkr += Number(deposit.amount);
        totalPKR += Number(deposit.amount);
      }

      if (deposit.walletType === "USDT") {
        monthlyMap[month].usdt += Number(deposit.amount);
        totalUSDT += Number(deposit.amount);
      }

      totalAmount += Number(deposit.amount);
    });

    const monthlyAnalytics = Object.values(monthlyMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    return res.status(200).json({
      success: true,

      analytics: {
        totalApprovedDeposits: deposits.length,

        totalAmount: Number(totalAmount.toFixed(2)),
        totalPKR: Number(totalPKR.toFixed(2)),
        totalUSDT: Number(totalUSDT.toFixed(6)),

        averageDeposit:
          deposits.length > 0
            ? Number((totalAmount / deposits.length).toFixed(2))
            : 0,

        monthlyAnalytics,
      },
    });

  } catch (error) {
    console.error("DEPOSIT ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit analytics.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js — PART 5B/8 FINAL
// Admin Recent Deposits + Top Depositors + User Summary
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// ADMIN RECENT DEPOSITS
// GET /api/deposit/admin/recent
// ======================================================

router.get("/admin/recent", verifyToken, isAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const deposits = await Deposit.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      total: deposits.length,
      recentDeposits: deposits,
    });

  } catch (error) {
    console.error("ADMIN RECENT DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent deposits.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN TOP DEPOSITORS
// GET /api/deposit/admin/top-depositors
// ======================================================

router.get("/admin/top-depositors", verifyToken, isAdmin, async (req, res) => {
  try {
    const topDepositors = await Deposit.aggregate([
      { $match: { status: "APPROVED" } },
      {
        $group: {
          _id: "$username",
          totalDeposits: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          pkrDeposits: {
            $sum: {
              $cond: [{ $eq: ["$walletType", "PKR"] }, "$amount", 0],
            },
          },
          usdtDeposits: {
            $sum: {
              $cond: [{ $eq: ["$walletType", "USDT"] }, "$amount", 0],
            },
          },
          lastDeposit: { $max: "$createdAt" },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 20 },
    ]);

    return res.status(200).json({
      success: true,
      total: topDepositors.length,

      depositors: topDepositors.map((user, index) => ({
        rank: index + 1,
        username: user._id,
        totalDeposits: user.totalDeposits,
        totalAmount: Number(user.totalAmount.toFixed(2)),
        pkrDeposits: Number(user.pkrDeposits.toFixed(2)),
        usdtDeposits: Number(user.usdtDeposits.toFixed(6)),
        lastDeposit: user.lastDeposit,
      })),
    });

  } catch (error) {
    console.error("TOP DEPOSITORS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load top depositors.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN USER DEPOSIT SUMMARY
// GET /api/deposit/admin/user-summary/:username
// ======================================================

router.get(
  "/admin/user-summary/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username = req.params.username.trim().toLowerCase();

      const user = await User.findOne({ username })
        .select("_id username fullName email role createdAt")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const wallet = await Wallet.findOne({
        userId: user._id,
      }).lean();

      const deposits = await Deposit.find({
        userId: user._id,
      })
        .sort({ createdAt: -1 })
        .lean();

      let pendingAmount = 0;
      let approvedAmount = 0;
      let rejectedAmount = 0;
      let cancelledAmount = 0;

      let pendingCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      let cancelledCount = 0;

      deposits.forEach((deposit) => {
        switch (deposit.status) {
          case "PENDING":
            pendingCount++;
            pendingAmount += Number(deposit.amount);
            break;

          case "APPROVED":
            approvedCount++;
            approvedAmount += Number(deposit.amount);
            break;

          case "REJECTED":
            rejectedCount++;
            rejectedAmount += Number(deposit.amount);
            break;

          case "CANCELLED":
            cancelledCount++;
            cancelledAmount += Number(deposit.amount);
            break;
        }
      });

      return res.status(200).json({
        success: true,

        user: {
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          joinedAt: user.createdAt,
        },

        wallet: wallet
          ? {
              pkrBalance: Number(wallet.pkrBalance || 0),
              usdtBalance: Number(wallet.usdtBalance || 0),
              goldBalance: Number(wallet.goldBalance || 0),
            }
          : null,

        statistics: {
          totalDeposits: deposits.length,

          pendingCount,
          approvedCount,
          rejectedCount,
          cancelledCount,

          pendingAmount: Number(pendingAmount.toFixed(2)),
          approvedAmount: Number(approvedAmount.toFixed(2)),
          rejectedAmount: Number(rejectedAmount.toFixed(2)),
          cancelledAmount: Number(cancelledAmount.toFixed(2)),
        },

        recentDeposits: deposits.slice(0, 10),
      });

    } catch (error) {
      console.error("USER DEPOSIT SUMMARY ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load user deposit summary.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);
// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js — PART 6A/8
// Deposit Settings + Payment Settings APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET DEPOSIT SETTINGS
// GET /api/deposit/settings
// Admin Dashboard
// ======================================================

router.get("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getDepositSettings();

    return res.status(200).json({
      success: true,

      settings: {
        depositsEnabled: Boolean(settings.depositsEnabled),

        minimumDeposit: Number(settings.minimumDeposit),
        maximumDeposit: Number(settings.maximumDeposit),

        updatedAt: settings.updatedAt,
      },
    });

  } catch (error) {
    console.error("GET DEPOSIT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit settings.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// UPDATE DEPOSIT SETTINGS
// PATCH /api/deposit/settings
// Enable / Disable + Min / Max
// ======================================================

router.patch("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      depositsEnabled,
      minimumDeposit,
      maximumDeposit,
    } = req.body;

    const settings = await getDepositSettings();

    if (typeof depositsEnabled === "boolean") {
      settings.depositsEnabled = depositsEnabled;
    }

    if (minimumDeposit !== undefined) {
      settings.minimumDeposit = Number(minimumDeposit);
    }

    if (maximumDeposit !== undefined) {
      settings.maximumDeposit = Number(maximumDeposit);
    }

    if (
      Number(settings.minimumDeposit) >
      Number(settings.maximumDeposit)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum deposit cannot be greater than maximum deposit.",
      });
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Deposit settings updated successfully.",

      settings: {
        depositsEnabled: settings.depositsEnabled,
        minimumDeposit: settings.minimumDeposit,
        maximumDeposit: settings.maximumDeposit,
        updatedAt: settings.updatedAt,
      },
    });

  } catch (error) {
    console.error("UPDATE DEPOSIT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update deposit settings.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET PAYMENT SETTINGS
// GET /api/deposit/payment-settings
// Used by Deposit Page
// ======================================================

router.get("/payment-settings", async (req, res) => {
  try {
    const settings = await getDepositSettings();

    return res.status(200).json({
      success: true,

      paymentSettings: settings.paymentSettings || {
        bankName: "",
        accountTitle: "",
        accountNumber: "",

        usdtAddress: "",
        usdtNetwork: "TRC20",
      },
    });

  } catch (error) {
    console.error("GET PAYMENT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load payment settings.",
    });
  }
});

// ======================================================
// UPDATE PAYMENT SETTINGS
// PATCH /api/deposit/payment-settings
// Admin Only
// ======================================================

router.patch(
  "/payment-settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const {
        bankName,
        accountTitle,
        accountNumber,

        usdtAddress,
        usdtNetwork,
      } = req.body;

      const settings = await getDepositSettings();

      settings.paymentSettings = {
        bankName: bankName || "",
        accountTitle: accountTitle || "",
        accountNumber: accountNumber || "",

        usdtAddress: usdtAddress || "",
        usdtNetwork: usdtNetwork || "TRC20",
      };

      await settings.save();

      return res.status(200).json({
        success: true,
        message: "Payment settings updated successfully.",
        paymentSettings: settings.paymentSettings,
      });

    } catch (error) {
      console.error("UPDATE PAYMENT SETTINGS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update payment settings.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// GET PUBLIC PAYMENT DETAILS
// GET /api/deposit/payment-details
// User Deposit Page (No Login Required)
// ======================================================

router.get("/payment-details", async (req, res) => {
  try {
    const settings = await getDepositSettings();

    return res.status(200).json({
      success: true,

      bank: {
        bankName:
          settings.paymentSettings?.bankName || "",
        accountTitle:
          settings.paymentSettings?.accountTitle || "",
        accountNumber:
          settings.paymentSettings?.accountNumber || "",
      },

      usdt: {
        address:
          settings.paymentSettings?.usdtAddress || "",
        network:
          settings.paymentSettings?.usdtNetwork || "TRC20",
      },

      depositsEnabled: settings.depositsEnabled,
    });

  } catch (error) {
    console.error("GET PAYMENT DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load payment details.",
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js — PART 6B/8 FINAL
// Validation + Duplicate Protection + Helpers
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GENERATE REFERENCE ID
// ======================================================

const generateDepositReference = () => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DEP-${Date.now()}-${random}`;
};

// ======================================================
// VALIDATE PAYMENT METHOD
// ======================================================

const validatePaymentMethod = (walletType, paymentMethod, network = "") => {
  const type = String(walletType).toUpperCase();
  const method = String(paymentMethod).trim().toUpperCase();
  const chain = String(network).trim().toUpperCase();

  const PKR_METHODS = [
    "BANK",
    "BANK_TRANSFER",
    "JAZZCASH",
    "EASYPAISA",
    "NAYA PAY",
    "SADAPAY",
    "UPAY",
    "MANUAL",
  ];

  const USDT_METHODS = [
    "USDT",
    "CRYPTO",
    "BINANCE",
    "TRUST WALLET",
    "BYBIT",
    "OKX",
    "KUCOIN",
  ];

  const NETWORKS = [
    "TRC20",
    "ERC20",
    "BEP20",
    "POLYGON",
    "SOL",
  ];

  if (type === "PKR") {
    return PKR_METHODS.includes(method);
  }

  if (type === "USDT") {
    return (
      USDT_METHODS.includes(method) &&
      NETWORKS.includes(chain)
    );
  }

  return false;
};

// ======================================================
// VALIDATE RECEIPT
// ======================================================

const validateReceipt = (receiptImage) => {
  if (!receiptImage) {
    return {
      valid: false,
      message: "Deposit receipt is required.",
    };
  }

  if (typeof receiptImage !== "string") {
    return {
      valid: false,
      message: "Receipt must be a string.",
    };
  }

  if (receiptImage.length < 20) {
    return {
      valid: false,
      message: "Invalid receipt image.",
    };
  }

  return { valid: true };
};

// ======================================================
// DUPLICATE TRANSACTION CHECK
// ======================================================

const isDuplicateTransaction = async (transactionId, referenceId) => {
  if (!transactionId && !referenceId) {
    return false;
  }

  const existing = await Deposit.findOne({
    $or: [
      transactionId ? { transactionId } : null,
      referenceId ? { referenceId } : null,
    ].filter(Boolean),
  }).lean();

  return Boolean(existing);
};

// ======================================================
// VALIDATE DEPOSIT LIMITS
// ======================================================

const validateDepositLimits = (walletType, amount, settings) => {
  const value = Number(amount);

  if (Number.isNaN(value) || value <= 0) {
    return {
      valid: false,
      message: "Deposit amount must be greater than zero.",
    };
  }

  const minimum = Number(settings.minimumDeposit || 0);
  const maximum = Number(settings.maximumDeposit || Number.MAX_SAFE_INTEGER);

  if (value < minimum) {
    return {
      valid: false,
      message: `Minimum deposit is ${minimum}.`,
    };
  }

  if (value > maximum) {
    return {
      valid: false,
      message: `Maximum deposit is ${maximum}.`,
    };
  }

  if (
    String(walletType).toUpperCase() === "USDT" &&
    value > 1000000
  ) {
    return {
      valid: false,
      message: "USDT deposit exceeds allowed limit.",
    };
  }

  return { valid: true };
};

// ======================================================
// VERIFY PAYMENT CONFIGURATION
// ======================================================

const verifyPaymentConfiguration = async (walletType) => {
  const settings = await getDepositSettings();
  const payment = settings.paymentSettings || {};

  if (walletType === "PKR") {
    if (!payment.bankName || !payment.accountNumber) {
      return {
        valid: false,
        message: "PKR payment account is not configured.",
      };
    }
  }

  if (walletType === "USDT") {
    if (!payment.usdtAddress) {
      return {
        valid: false,
        message: "USDT wallet address is not configured.",
      };
    }
  }

  return { valid: true };
};

// ======================================================
// VALIDATE CREATE DEPOSIT REQUEST
// Used inside POST /api/deposit/create
// ======================================================

const validateDepositRequest = async ({
  walletType,
  amount,
  paymentMethod,
  network,
  receiptImage,
  transactionId,
  referenceId,
}) => {
  const settings = await getDepositSettings();

  const config = await verifyPaymentConfiguration(
    String(walletType).toUpperCase()
  );

  if (!config.valid) {
    return config;
  }

  const limits = validateDepositLimits(
    walletType,
    amount,
    settings
  );

  if (!limits.valid) {
    return limits;
  }

  if (
    !validatePaymentMethod(walletType, paymentMethod, network)
  ) {
    return {
      valid: false,
      message: "Invalid payment method or network.",
    };
  }

  const receipt = validateReceipt(receiptImage);

  if (!receipt.valid) {
    return receipt;
  }

  const duplicate = await isDuplicateTransaction(
    transactionId,
    referenceId
  );

  if (duplicate) {
    return {
      valid: false,
      message: "Duplicate transaction or reference detected.",
    };
  }

  return {
    valid: true,
    referenceId:
      referenceId ||
      transactionId ||
      generateDepositReference(),
  };
};
// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js — PART 7A/8
// Admin All Deposits + Search + Filters APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// ADMIN GET ALL DEPOSITS
// GET /api/deposit/admin/all
// Used by frontend/app/admin/deposits/page.tsx
// ======================================================

router.get("/admin/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const {
      status,
      walletType,
      username,
      paymentMethod,
      start,
      end,
    } = req.query;

    const query = {};

    if (status) query.status = String(status).toUpperCase();
    if (walletType) query.walletType = String(walletType).toUpperCase();

    if (username) {
      query.username = {
        $regex: username,
        $options: "i",
      };
    }

    if (paymentMethod) {
      query.paymentMethod = {
        $regex: paymentMethod,
        $options: "i",
      };
    }

    if (start || end) {
      query.createdAt = {};

      if (start) query.createdAt.$gte = new Date(start);

      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDate;
      }
    }

    const total = await Deposit.countDocuments(query);

    const deposits = await Deposit.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },

      deposits,
    });

  } catch (error) {
    console.error("ADMIN GET ALL DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposits.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN GET SINGLE DEPOSIT
// GET /api/deposit/admin/:id
// ======================================================

router.get("/admin/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id).lean();

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    const wallet = await Wallet.findOne({
      userId: deposit.userId,
    }).lean();

    return res.status(200).json({
      success: true,

      deposit,

      wallet: wallet
        ? {
            pkrBalance: Number(wallet.pkrBalance),
            usdtBalance: Number(wallet.usdtBalance),
            goldBalance: Number(wallet.goldBalance),
          }
        : null,
    });

  } catch (error) {
    console.error("ADMIN GET DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit details.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN SEARCH DEPOSITS
// GET /api/deposit/admin/search
// Query:
// ?reference=DEP-123
// ?transactionId=ABC123
// ======================================================

router.get("/admin/search", verifyToken, isAdmin, async (req, res) => {
  try {
    const { reference, transactionId } = req.query;

    const query = {};

    if (reference) {
      query.referenceId = {
        $regex: reference,
        $options: "i",
      };
    }

    if (transactionId) {
      query.transactionId = {
        $regex: transactionId,
        $options: "i",
      };
    }

    const deposits = await Deposit.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: deposits.length,
      deposits,
    });

  } catch (error) {
    console.error("ADMIN SEARCH DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search deposits.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN RECEIPT PREVIEW
// GET /api/deposit/admin/receipt/:id
// ======================================================

router.get(
  "/admin/receipt/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const deposit = await Deposit.findById(req.params.id)
        .select(
          "receiptImage receiptUploaded username walletType amount status createdAt"
        )
        .lean();

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message: "Deposit not found.",
        });
      }

      return res.status(200).json({
        success: true,
        receipt: deposit,
      });

    } catch (error) {
      console.error("RECEIPT PREVIEW ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load receipt.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);// ======================================================
// BULK APPROVE DEPOSITS
// PATCH /api/deposit/admin/bulk-approve
// Body: { depositIds: [] }
// ======================================================

router.patch(
  "/admin/bulk-approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { depositIds } = req.body;

      if (!Array.isArray(depositIds) || depositIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "depositIds array is required.",
        });
      }

      let approved = 0;
      let skipped = 0;
      const failed = [];

      for (const depositId of depositIds) {
        try {
          const deposit = await Deposit.findById(depositId);

          if (!deposit || deposit.status !== "PENDING") {
            skipped++;
            continue;
          }

          const wallet = await getWallet(
            deposit.userId,
            deposit.username
          );

          deposit.walletBefore = {
            pkrBalance: Number(wallet.pkrBalance || 0),
            usdtBalance: Number(wallet.usdtBalance || 0),
            goldBalance: Number(wallet.goldBalance || 0),
          };

          if (deposit.walletType === "PKR") {
            wallet.pkrBalance += Number(deposit.amount);
            wallet.totalDeposit += Number(deposit.amount);
          } else {
            wallet.usdtBalance += Number(deposit.amount);
            wallet.totalUsdtDeposited += Number(deposit.amount);
          }

          wallet.lastDepositAt = new Date();
          await wallet.save();

          deposit.walletAfter = {
            pkrBalance: Number(wallet.pkrBalance),
            usdtBalance: Number(wallet.usdtBalance),
            goldBalance: Number(wallet.goldBalance),
          };

          deposit.status = "APPROVED";
          deposit.approvedBy = req.user.id;
          deposit.approvedByUsername = req.user.username;
          deposit.approvedAt = new Date();

          await deposit.save();

          await WalletHistory.create({
            userId: deposit.userId,
            username: deposit.username,

            walletType: deposit.walletType,
            type: "DEPOSIT",

            amount: Number(deposit.amount),

            balanceBefore:
              deposit.walletType === "PKR"
                ? deposit.walletBefore.pkrBalance
                : deposit.walletBefore.usdtBalance,

            balanceAfter:
              deposit.walletType === "PKR"
                ? wallet.pkrBalance
                : wallet.usdtBalance,

            referenceId: deposit._id.toString(),

            admin: req.user.username,
            note: "Bulk deposit approved.",
          });

          await Transaction.create({
            userId: deposit.userId,
            username: deposit.username,

            walletType: deposit.walletType,

            transactionType: "DEPOSIT_APPROVED",
            transactionMode: "CREDIT",

            amount: Number(deposit.amount),

            balanceBefore:
              deposit.walletType === "PKR"
                ? deposit.walletBefore.pkrBalance
                : deposit.walletBefore.usdtBalance,

            balanceAfter:
              deposit.walletType === "PKR"
                ? wallet.pkrBalance
                : wallet.usdtBalance,

            status: "Completed",

            paymentMethod: deposit.paymentMethod,
            referenceId: deposit._id.toString(),

            adminId: req.user.id,
            adminUsername: req.user.username,

            note: "Bulk deposit approved.",
          });

          approved++;
        } catch (err) {
          failed.push({
            depositId,
            error: err.message,
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "Bulk approve completed.",

        result: {
          requested: depositIds.length,
          approved,
          skipped,
          failed: failed.length,
        },

        failed,
      });
    } catch (error) {
      console.error("BULK APPROVE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Bulk approval failed.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// BULK REJECT DEPOSITS
// PATCH /api/deposit/admin/bulk-reject
// Body: { depositIds: [], rejectReason }
// ======================================================

router.patch(
  "/admin/bulk-reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { depositIds, rejectReason } = req.body;

      if (!Array.isArray(depositIds) || depositIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "depositIds array is required.",
        });
      }

      let rejected = 0;
      let skipped = 0;
      const failed = [];

      for (const depositId of depositIds) {
        try {
          const deposit = await Deposit.findById(depositId);

          if (!deposit || deposit.status !== "PENDING") {
            skipped++;
            continue;
          }

          deposit.status = "REJECTED";
          deposit.rejectReason =
            rejectReason || "Bulk rejected by admin.";

          deposit.approvedBy = req.user.id;
          deposit.approvedByUsername = req.user.username;
          deposit.rejectedAt = new Date();

          await deposit.save();

          await WalletHistory.create({
            userId: deposit.userId,
            username: deposit.username,

            walletType: deposit.walletType,
            type: "DEPOSIT_REJECTED",

            amount: Number(deposit.amount),

            balanceBefore:
              deposit.walletType === "PKR"
                ? Number(deposit.walletBefore?.pkrBalance || 0)
                : Number(deposit.walletBefore?.usdtBalance || 0),

            balanceAfter:
              deposit.walletType === "PKR"
                ? Number(deposit.walletBefore?.pkrBalance || 0)
                : Number(deposit.walletBefore?.usdtBalance || 0),

            referenceId: deposit._id.toString(),

            admin: req.user.username,
            note: deposit.rejectReason,
          });

          await Transaction.create({
            userId: deposit.userId,
            username: deposit.username,

            walletType: deposit.walletType,

            transactionType: "DEPOSIT_REJECTED",
            transactionMode: "CREDIT",

            amount: Number(deposit.amount),

            balanceBefore:
              deposit.walletType === "PKR"
                ? Number(deposit.walletBefore?.pkrBalance || 0)
                : Number(deposit.walletBefore?.usdtBalance || 0),

            balanceAfter:
              deposit.walletType === "PKR"
                ? Number(deposit.walletBefore?.pkrBalance || 0)
                : Number(deposit.walletBefore?.usdtBalance || 0),

            status: "Rejected",

            paymentMethod: deposit.paymentMethod,
            referenceId: deposit._id.toString(),

            adminId: req.user.id,
            adminUsername: req.user.username,

            note: deposit.rejectReason,
          });

          rejected++;
        } catch (err) {
          failed.push({
            depositId,
            error: err.message,
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: "Bulk reject completed.",

        result: {
          rejected,
          skipped,
          failed: failed.length,
        },

        failed,
      });
    } catch (error) {
      console.error("BULK REJECT ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Bulk rejection failed.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// DEPOSIT STATISTICS
// GET /api/deposit/statistics
// Dashboard Cards
// ======================================================

router.get("/statistics", verifyToken, async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? {}
        : { userId: req.user.id };

    const deposits = await Deposit.find(query).lean();

    let pendingAmount = 0;
    let approvedAmount = 0;
    let rejectedAmount = 0;

    let pkrAmount = 0;
    let usdtAmount = 0;

    deposits.forEach((deposit) => {
      const amount = Number(deposit.amount || 0);

      switch (deposit.status) {
        case "PENDING":
          pendingAmount += amount;
          break;

        case "APPROVED":
          approvedAmount += amount;

          if (deposit.walletType === "PKR") {
            pkrAmount += amount;
          }

          if (deposit.walletType === "USDT") {
            usdtAmount += amount;
          }
          break;

        case "REJECTED":
          rejectedAmount += amount;
          break;
      }
    });

    return res.status(200).json({
      success: true,

      statistics: {
        totalDeposits: deposits.length,

        pendingAmount: Number(pendingAmount.toFixed(2)),
        approvedAmount: Number(approvedAmount.toFixed(2)),
        rejectedAmount: Number(rejectedAmount.toFixed(2)),

        totalPKRDeposits: Number(pkrAmount.toFixed(2)),
        totalUSDTDeposits: Number(usdtAmount.toFixed(6)),
      },

      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("DEPOSIT STATISTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load statistics.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN EXPORT DEPOSITS
// GET /api/deposit/admin/export
// Used by Admin Dashboard
// ======================================================

router.get("/admin/export", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({})
      .sort({ createdAt: -1 })
      .lean();

    const exportData = deposits.map((deposit) => ({
      id: deposit._id,
      username: deposit.username,
      walletType: deposit.walletType,
      amount: Number(deposit.amount),
      paymentMethod: deposit.paymentMethod,
      transactionId: deposit.transactionId,
      referenceId: deposit.referenceId,
      status: deposit.status,
      approvedBy: deposit.approvedByUsername || "",
      createdAt: deposit.createdAt,
      approvedAt: deposit.approvedAt,
    }));

    return res.status(200).json({
      success: true,
      total: exportData.length,
      deposits: exportData,
      exportedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("EXPORT DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to export deposits.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// DEPOSIT DEBUG
// GET /api/deposit/debug
// Backend Diagnostics
// ======================================================

router.get("/debug", verifyToken, async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? {}
        : { userId: req.user.id };

    const [
      wallet,
      depositCount,
      pendingCount,
      transactionCount,
      historyCount,
    ] = await Promise.all([
      Wallet.findOne({ userId: req.user.id }).lean(),

      Deposit.countDocuments(query),

      Deposit.countDocuments({
        ...query,
        status: "PENDING",
      }),

      Transaction.countDocuments({
        ...query,
        transactionType: {
          $regex: "^DEPOSIT",
        },
      }),

      WalletHistory.countDocuments({
        ...query,
        type: {
          $regex: "DEPOSIT",
        },
      }),
    ]);

    return res.status(200).json({
      success: true,

      diagnostics: {
        module: "Deposit API V18 Enterprise",

        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,

        walletExists: !!wallet,

        wallet: wallet
          ? {
              pkrBalance: Number(wallet.pkrBalance),
              usdtBalance: Number(wallet.usdtBalance),
              goldBalance: Number(wallet.goldBalance),
            }
          : null,

        totalDeposits: depositCount,
        pendingDeposits: pendingCount,

        transactionLedgerEntries: transactionCount,
        walletHistoryEntries: historyCount,
      },

      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error("DEPOSIT DEBUG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Diagnostics failed.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// API ROUTE LIST
// GET /api/deposit/routes
// Diagnostics
// ======================================================

router.get("/routes", (req, res) => {
  return res.status(200).json({
    success: true,

    module: "GoldTrade V18 Enterprise Deposit API",
    version: "18.0.0",

    routes: [
      // Health
      "GET /api/deposit/health",
      "GET /api/deposit/status",
      "GET /api/deposit/routes",
      "GET /api/deposit/debug",
      "GET /api/deposit/statistics",

      // User
      "POST /api/deposit/create",
      "GET /api/deposit/history",
      "GET /api/deposit/history/:username",
      "GET /api/deposit/filter",
      "GET /api/deposit/recent",
      "GET /api/deposit/summary",
      "PATCH /api/deposit/:id/cancel",

      // Settings
      "GET /api/deposit/payment-details",
      "GET /api/deposit/payment-settings",
      "PATCH /api/deposit/payment-settings",
      "GET /api/deposit/settings",
      "PATCH /api/deposit/settings",

      // Admin
      "GET /api/deposit/pending",
      "PATCH /api/deposit/:id/approve",
      "PATCH /api/deposit/:id/reject",
      "PATCH /api/deposit/:id/note",

      "GET /api/deposit/admin/dashboard",
      "GET /api/deposit/admin/analytics",
      "GET /api/deposit/admin/recent",
      "GET /api/deposit/admin/all",
      "GET /api/deposit/admin/search",
      "GET /api/deposit/admin/top-depositors",
      "GET /api/deposit/admin/user-summary/:username",
      "GET /api/deposit/admin/:id",
      "GET /api/deposit/admin/receipt/:id",
      "GET /api/deposit/admin/export",

      "PATCH /api/deposit/admin/bulk-approve",
      "PATCH /api/deposit/admin/bulk-reject",
    ],

    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// ROUTER EXPORT
// ======================================================

module.exports = router;