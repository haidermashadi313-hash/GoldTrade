// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js — PART 1/8
// Health + Create Withdraw Request
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

"use strict";

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Withdraw = require("../models/Withdraw");
const WalletHistory = require("../models/WalletHistory");
const Transaction = require("../models/Transaction");
const Settings = require("../models/Settings");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// HEALTH CHECK
// GET /api/withdraw/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Withdraw API",
    version: "V18 Enterprise",
    status: "ONLINE",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// GET SETTINGS
// ======================================================

const getWithdrawSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({
      withdrawEnabled: true,
      minimumWithdraw: 100,
      maximumWithdraw: 10000000,
    });
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
      pkrBalance: 0,
      usdtBalance: 0,
      goldBalance: 0,
    });
  }

  return wallet;
};

// ======================================================
// GENERATE WITHDRAW REFERENCE
// ======================================================

const generateWithdrawReference = () => {
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `WTH-${Date.now()}-${random}`;
};

// ======================================================
// CREATE WITHDRAW REQUEST
// POST /api/withdraw/create
// Used by frontend/app/withdraw/page.tsx
// ======================================================

router.post("/create", verifyToken, async (req, res) => {
  try {
    const {
      walletType,
      amount,
      paymentMethod,
      receiverName,
      receiverAccount,
      receiverWalletAddress,
      bankName,
      iban,
      network,
      note,
    } = req.body;

    // Validate wallet type
    if (!["PKR", "USDT"].includes(String(walletType).toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet type.",
      });
    }

    const withdrawAmount = Number(amount);

    if (Number.isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw amount.",
      });
    }

    // Settings
    const settings = await getWithdrawSettings();

    if (!settings.withdrawEnabled) {
      return res.status(403).json({
        success: false,
        message: "Withdrawals are temporarily disabled.",
      });
    }

    if (withdrawAmount < Number(settings.minimumWithdraw)) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdraw is ${settings.minimumWithdraw}.`,
      });
    }

    if (withdrawAmount > Number(settings.maximumWithdraw)) {
      return res.status(400).json({
        success: false,
        message: `Maximum withdraw is ${settings.maximumWithdraw}.`,
      });
    }

    // User
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Wallet
    const wallet = await getWallet(user._id, user.username);

    const balance =
      walletType === "PKR"
        ? Number(wallet.pkrBalance)
        : Number(wallet.usdtBalance);

    if (balance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${walletType} balance.`,
      });
    }

    // Pending request protection
    const pending = await Withdraw.findOne({
      userId: user._id,
      walletType: walletType.toUpperCase(),
      status: "PENDING",
    });

    if (pending) {
      return res.status(400).json({
        success: false,
        message: `You already have a pending ${walletType} withdrawal.`,
      });
    }

    // Create request
    const withdraw = await Withdraw.create({
      userId: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,

      walletType: walletType.toUpperCase(),
      currency: walletType.toUpperCase(),

      amount: withdrawAmount,

      paymentMethod,
      receiverName,
      receiverAccount,
      receiverWalletAddress,
      bankName,
      iban,
      network,

      note,
      referenceId: generateWithdrawReference(),

      walletBefore: {
        pkrBalance: Number(wallet.pkrBalance),
        usdtBalance: Number(wallet.usdtBalance),
        goldBalance: Number(wallet.goldBalance),
      },

      ipAddress: req.ip,
      device: req.headers["user-agent"] || "",
    });

    // Transaction Ledger
    await Transaction.create({
      userId: user._id,
      username: user.username,

      walletType: walletType.toUpperCase(),

      transactionType: "WITHDRAW_REQUEST",
      transactionMode: "DEBIT",

      amount: withdrawAmount,

      balanceBefore: balance,
      balanceAfter: balance,

      status: "Pending",

      paymentMethod,
      referenceId: withdraw.referenceId,

      note: "Withdraw request created.",
    });

    return res.status(201).json({
      success: true,
      message: "Withdraw request submitted successfully.",

      withdraw: {
        id: withdraw._id,
        referenceId: withdraw.referenceId,
        walletType: withdraw.walletType,
        amount: withdraw.amount,
        status: withdraw.status,
        createdAt: withdraw.createdAt,
      },
    });

  } catch (error) {
    console.error("CREATE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create withdraw request.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js — PART 2/8
// Withdraw History + Pending + Summary APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET MY WITHDRAW HISTORY
// GET /api/withdraw/history
// Used by frontend/app/withdraw/history/page.tsx
// ======================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const total = await Withdraw.countDocuments({
      userId: req.user.id,
    });

    const history = await Withdraw.find({
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

      history,
    });

  } catch (error) {
    console.error("WITHDRAW HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET USER WITHDRAW HISTORY BY USERNAME
// GET /api/withdraw/history/:username
// Admin OR Same User
// ======================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    if (
      req.user.role !== "admin" &&
      req.user.username !== username
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const user = await User.findOne({ username }).select("_id username");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const history = await Withdraw.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      username: user.username,
      total: history.length,
      history,
    });

  } catch (error) {
    console.error("USER WITHDRAW HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user withdraw history.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET PENDING WITHDRAWALS
// GET /api/withdraw/pending
// User sees own pending, Admin sees all pending
// ======================================================

router.get("/pending", verifyToken, async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? { status: "PENDING" }
        : {
            userId: req.user.id,
            status: "PENDING",
          };

    const pending = await Withdraw.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: pending.length,
      pending,
    });

  } catch (error) {
    console.error("PENDING WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending withdrawals.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET MY WITHDRAW SUMMARY
// GET /api/withdraw/summary
// Dashboard Cards
// ======================================================

router.get("/summary", verifyToken, async (req, res) => {
  try {
    const withdrawals = await Withdraw.find({
      userId: req.user.id,
    }).lean();

    let pendingAmount = 0;
    let approvedAmount = 0;
    let rejectedAmount = 0;
    let cancelledAmount = 0;

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let cancelledCount = 0;

    let totalPKRWithdraw = 0;
    let totalUSDTWithdraw = 0;

    withdrawals.forEach((item) => {
      const amount = Number(item.amount || 0);

      switch (item.status) {
        case "PENDING":
          pendingCount++;
          pendingAmount += amount;
          break;

        case "APPROVED":
          approvedCount++;
          approvedAmount += amount;

          if (item.walletType === "PKR") {
            totalPKRWithdraw += amount;
          }

          if (item.walletType === "USDT") {
            totalUSDTWithdraw += amount;
          }
          break;

        case "REJECTED":
          rejectedCount++;
          rejectedAmount += amount;
          break;

        case "CANCELLED":
          cancelledCount++;
          cancelledAmount += amount;
          break;
      }
    });

    return res.status(200).json({
      success: true,

      summary: {
        totalWithdrawals: withdrawals.length,

        pendingWithdrawals: pendingCount,
        approvedWithdrawals: approvedCount,
        rejectedWithdrawals: rejectedCount,
        cancelledWithdrawals: cancelledCount,

        pendingAmount: Number(pendingAmount.toFixed(2)),
        approvedAmount: Number(approvedAmount.toFixed(2)),
        rejectedAmount: Number(rejectedAmount.toFixed(2)),
        cancelledAmount: Number(cancelledAmount.toFixed(2)),

        totalPKRWithdraw: Number(totalPKRWithdraw.toFixed(2)),
        totalUSDTWithdraw: Number(totalUSDTWithdraw.toFixed(6)),
      },
    });

  } catch (error) {
    console.error("WITHDRAW SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw summary.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET RECENT WITHDRAWALS
// GET /api/withdraw/recent
// Dashboard Widget
// ======================================================

router.get("/recent", verifyToken, async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? {}
        : { userId: req.user.id };

    const recent = await Withdraw.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      total: recent.length,
      recent,
    });

  } catch (error) {
    console.error("RECENT WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent withdrawals.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js — PART 3/8
// Admin Withdraw Approval API
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// APPROVE WITHDRAW
// PATCH /api/withdraw/:id/approve
// Used by frontend/app/admin/withdraw/page.tsx
// ======================================================

router.patch("/:id/approve", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Withdraw already ${withdraw.status.toLowerCase()}.`,
      });
    }

    // ==================================================
    // USER WALLET
    // ==================================================

    const wallet = await getWallet(
      withdraw.userId,
      withdraw.username
    );

    withdraw.walletBefore = {
      pkrBalance: Number(wallet.pkrBalance || 0),
      usdtBalance: Number(wallet.usdtBalance || 0),
      goldBalance: Number(wallet.goldBalance || 0),
    };

    const amount = Number(withdraw.amount);

    // ==================================================
    // BALANCE CHECK + DEDUCT
    // ==================================================

    if (withdraw.walletType === "PKR") {
      if (wallet.pkrBalance < amount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient PKR balance.",
        });
      }

      wallet.pkrBalance -= amount;
      wallet.totalWithdraw += amount;
    }

    if (withdraw.walletType === "USDT") {
      if (wallet.usdtBalance < amount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient USDT balance.",
        });
      }

      wallet.usdtBalance -= amount;
      wallet.totalUsdtWithdrawn += amount;
    }

    wallet.lastWithdrawAt = new Date();

    await wallet.save();

    withdraw.walletAfter = {
      pkrBalance: Number(wallet.pkrBalance),
      usdtBalance: Number(wallet.usdtBalance),
      goldBalance: Number(wallet.goldBalance),
    };

    // ==================================================
    // UPDATE WITHDRAW STATUS
    // ==================================================

    withdraw.status = "APPROVED";
    withdraw.approvedBy = req.user.id;
    withdraw.approvedByUsername = req.user.username;
    withdraw.approvedAt = new Date();

    await withdraw.save();

    // ==================================================
    // WALLET HISTORY
    // ==================================================

    await WalletHistory.create({
      userId: withdraw.userId,
      username: withdraw.username,

      walletType: withdraw.walletType,
      type: "WITHDRAW",

      amount,

      balanceBefore:
        withdraw.walletType === "PKR"
          ? withdraw.walletBefore.pkrBalance
          : withdraw.walletBefore.usdtBalance,

      balanceAfter:
        withdraw.walletType === "PKR"
          ? wallet.pkrBalance
          : wallet.usdtBalance,

      referenceId: withdraw.referenceId,

      admin: req.user.username,
      note: `Withdraw approved by ${req.user.username}`,
    });

    // ==================================================
    // TRANSACTION LEDGER
    // ==================================================

    await Transaction.create({
      userId: withdraw.userId,
      username: withdraw.username,

      walletType: withdraw.walletType,

      transactionType: "WITHDRAW_APPROVED",
      transactionMode: "DEBIT",

      amount,

      balanceBefore:
        withdraw.walletType === "PKR"
          ? withdraw.walletBefore.pkrBalance
          : withdraw.walletBefore.usdtBalance,

      balanceAfter:
        withdraw.walletType === "PKR"
          ? wallet.pkrBalance
          : wallet.usdtBalance,

      status: "Completed",

      paymentMethod: withdraw.paymentMethod,
      referenceId: withdraw.referenceId,

      adminId: req.user.id,
      adminUsername: req.user.username,

      note: "Withdraw approved successfully.",
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message: "Withdraw approved successfully.",

      withdraw: {
        id: withdraw._id,
        referenceId: withdraw.referenceId,
        username: withdraw.username,
        walletType: withdraw.walletType,
        amount: withdraw.amount,
        status: withdraw.status,
        approvedBy: withdraw.approvedByUsername,
        approvedAt: withdraw.approvedAt,
      },

      wallet: {
        pkrBalance: Number(wallet.pkrBalance),
        usdtBalance: Number(wallet.usdtBalance),
        goldBalance: Number(wallet.goldBalance),
      },
    });

  } catch (error) {
    console.error("APPROVE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve withdraw.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js — PART 4/8
// Reject Withdraw + Cancel Withdraw APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// REJECT WITHDRAW
// PATCH /api/withdraw/:id/reject
// Admin Only
// ======================================================

router.patch("/:id/reject", verifyToken, isAdmin, async (req, res) => {
  try {
    const { rejectReason, note } = req.body;

    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Withdraw already ${withdraw.status.toLowerCase()}.`,
      });
    }

    // ==============================================
    // UPDATE STATUS
    // ==============================================

    withdraw.status = "REJECTED";
    withdraw.rejectReason =
      rejectReason || "Withdraw rejected by admin.";
    withdraw.note = note || withdraw.note;

    withdraw.approvedBy = req.user.id;
    withdraw.approvedByUsername = req.user.username;
    withdraw.rejectedAt = new Date();

    await withdraw.save();

    // ==============================================
    // WALLET HISTORY (Audit Only)
    // ==============================================

    await WalletHistory.create({
      userId: withdraw.userId,
      username: withdraw.username,

      walletType: withdraw.walletType,
      type: "WITHDRAW_REJECTED",

      amount: Number(withdraw.amount),

      balanceBefore:
        withdraw.walletType === "PKR"
          ? Number(withdraw.walletBefore?.pkrBalance || 0)
          : Number(withdraw.walletBefore?.usdtBalance || 0),

      balanceAfter:
        withdraw.walletType === "PKR"
          ? Number(withdraw.walletBefore?.pkrBalance || 0)
          : Number(withdraw.walletBefore?.usdtBalance || 0),

      referenceId: withdraw.referenceId,

      admin: req.user.username,
      note: withdraw.rejectReason,
    });

    // ==============================================
    // TRANSACTION LEDGER
    // ==============================================

    await Transaction.create({
      userId: withdraw.userId,
      username: withdraw.username,

      walletType: withdraw.walletType,

      transactionType: "WITHDRAW_REJECTED",
      transactionMode: "DEBIT",

      amount: Number(withdraw.amount),

      balanceBefore:
        withdraw.walletType === "PKR"
          ? Number(withdraw.walletBefore?.pkrBalance || 0)
          : Number(withdraw.walletBefore?.usdtBalance || 0),

      balanceAfter:
        withdraw.walletType === "PKR"
          ? Number(withdraw.walletBefore?.pkrBalance || 0)
          : Number(withdraw.walletBefore?.usdtBalance || 0),

      status: "Rejected",

      paymentMethod: withdraw.paymentMethod,
      referenceId: withdraw.referenceId,

      adminId: req.user.id,
      adminUsername: req.user.username,

      note: withdraw.rejectReason,
    });

    return res.status(200).json({
      success: true,
      message: "Withdraw rejected successfully.",

      withdraw: {
        id: withdraw._id,
        referenceId: withdraw.referenceId,
        username: withdraw.username,
        walletType: withdraw.walletType,
        amount: withdraw.amount,
        status: withdraw.status,
        rejectedAt: withdraw.rejectedAt,
        rejectedBy: withdraw.approvedByUsername,
        rejectReason: withdraw.rejectReason,
      },
    });

  } catch (error) {
    console.error("REJECT WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject withdraw request.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// CANCEL WITHDRAW (USER)
// PATCH /api/withdraw/:id/cancel
// User can cancel only PENDING withdraws
// ======================================================

router.patch("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    // User can cancel only own request (Admin can cancel any)
    if (
      req.user.role !== "admin" &&
      withdraw.userId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    if (withdraw.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending withdraw requests can be cancelled.",
      });
    }

    withdraw.status = "CANCELLED";
    withdraw.cancelledAt = new Date();
    withdraw.note = "Withdraw cancelled by user.";

    await withdraw.save();

    // ==============================================
    // TRANSACTION LEDGER
    // ==============================================

    await Transaction.create({
      userId: withdraw.userId,
      username: withdraw.username,

      walletType: withdraw.walletType,

      transactionType: "WITHDRAW_REJECTED",
      transactionMode: "DEBIT",

      amount: Number(withdraw.amount),

      balanceBefore:
        withdraw.walletType === "PKR"
          ? Number(withdraw.walletBefore?.pkrBalance || 0)
          : Number(withdraw.walletBefore?.usdtBalance || 0),

      balanceAfter:
        withdraw.walletType === "PKR"
          ? Number(withdraw.walletBefore?.pkrBalance || 0)
          : Number(withdraw.walletBefore?.usdtBalance || 0),

      status: "Rejected",

      paymentMethod: withdraw.paymentMethod,
      referenceId: withdraw.referenceId,

      note: "Withdraw cancelled by user.",
    });

    // ==============================================
    // WALLET HISTORY (Audit Only)
    // ==============================================

    await WalletHistory.create({
      userId: withdraw.userId,
      username: withdraw.username,

      walletType: withdraw.walletType,
      type: "WITHDRAW_CANCELLED",

      amount: Number(withdraw.amount),

      balanceBefore:
        withdraw.walletType === "PKR"
          ? Number(withdraw.walletBefore?.pkrBalance || 0)
          : Number(withdraw.walletBefore?.usdtBalance || 0),

      balanceAfter:
        withdraw.walletType === "PKR"
          ? Number(withdraw.walletBefore?.pkrBalance || 0)
          : Number(withdraw.walletBefore?.usdtBalance || 0),

      referenceId: withdraw.referenceId,

      note: "Withdraw cancelled by user.",
    });

    return res.status(200).json({
      success: true,
      message: "Withdraw cancelled successfully.",

      withdraw: {
        id: withdraw._id,
        referenceId: withdraw.referenceId,
        status: withdraw.status,
        cancelledAt: withdraw.cancelledAt,
      },
    });

  } catch (error) {
    console.error("CANCEL WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel withdraw request.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js — PART 5/8
// Admin Dashboard + Analytics + User Summary APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// ADMIN WITHDRAW DASHBOARD
// GET /api/withdraw/admin/dashboard
// Used by frontend/app/admin/withdraw/page.tsx
// ======================================================

router.get("/admin/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const [
      totalWithdraws,
      pendingWithdraws,
      approvedWithdraws,
      rejectedWithdraws,
      cancelledWithdraws,
      recentWithdraws,
    ] = await Promise.all([
      Withdraw.countDocuments({}),
      Withdraw.countDocuments({ status: "PENDING" }),
      Withdraw.countDocuments({ status: "APPROVED" }),
      Withdraw.countDocuments({ status: "REJECTED" }),
      Withdraw.countDocuments({ status: "CANCELLED" }),
      Withdraw.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const approvedList = await Withdraw.find({
      status: "APPROVED",
    }).lean();

    const pendingList = await Withdraw.find({
      status: "PENDING",
    }).lean();

    let totalApprovedAmount = 0;
    let totalPendingAmount = 0;
    let totalPKRWithdraws = 0;
    let totalUSDTWithdraws = 0;

    approvedList.forEach((withdraw) => {
      const amount = Number(withdraw.amount || 0);

      totalApprovedAmount += amount;

      if (withdraw.walletType === "PKR") {
        totalPKRWithdraws += amount;
      }

      if (withdraw.walletType === "USDT") {
        totalUSDTWithdraws += amount;
      }
    });

    pendingList.forEach((withdraw) => {
      totalPendingAmount += Number(withdraw.amount || 0);
    });

    return res.status(200).json({
      success: true,

      dashboard: {
        totalWithdraws,
        pendingWithdraws,
        approvedWithdraws,
        rejectedWithdraws,
        cancelledWithdraws,

        totalApprovedAmount: Number(totalApprovedAmount.toFixed(2)),
        totalPendingAmount: Number(totalPendingAmount.toFixed(2)),

        totalPKRWithdraws: Number(totalPKRWithdraws.toFixed(2)),
        totalUSDTWithdraws: Number(totalUSDTWithdraws.toFixed(6)),
      },

      recentWithdraws,
      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("ADMIN WITHDRAW DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw dashboard.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN WITHDRAW ANALYTICS
// GET /api/withdraw/admin/analytics
// Used by Dashboard Charts
// ======================================================

router.get("/admin/analytics", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdraw.find({
      status: "APPROVED",
    }).lean();

    let totalAmount = 0;
    let totalPKR = 0;
    let totalUSDT = 0;

    const monthlyMap = {};

    withdrawals.forEach((withdraw) => {
      const amount = Number(withdraw.amount || 0);

      const month = new Date(withdraw.createdAt)
        .toISOString()
        .slice(0, 7);

      if (!monthlyMap[month]) {
        monthlyMap[month] = {
          month,
          withdrawals: 0,
          amount: 0,
          pkr: 0,
          usdt: 0,
        };
      }

      monthlyMap[month].withdrawals += 1;
      monthlyMap[month].amount += amount;

      if (withdraw.walletType === "PKR") {
        monthlyMap[month].pkr += amount;
        totalPKR += amount;
      }

      if (withdraw.walletType === "USDT") {
        monthlyMap[month].usdt += amount;
        totalUSDT += amount;
      }

      totalAmount += amount;
    });

    const monthlyAnalytics = Object.values(monthlyMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    return res.status(200).json({
      success: true,

      analytics: {
        totalApprovedWithdrawals: withdrawals.length,

        totalAmount: Number(totalAmount.toFixed(2)),
        totalPKR: Number(totalPKR.toFixed(2)),
        totalUSDT: Number(totalUSDT.toFixed(6)),

        averageWithdraw:
          withdrawals.length > 0
            ? Number((totalAmount / withdrawals.length).toFixed(2))
            : 0,

        monthlyAnalytics,
      },
    });

  } catch (error) {
    console.error("WITHDRAW ANALYTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw analytics.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN RECENT WITHDRAWS
// GET /api/withdraw/admin/recent
// ======================================================

router.get("/admin/recent", verifyToken, isAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);

    const withdrawals = await Withdraw.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      total: withdrawals.length,
      recentWithdraws: withdrawals,
    });

  } catch (error) {
    console.error("RECENT WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent withdrawals.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN TOP WITHDRAW USERS
// GET /api/withdraw/admin/top-users
// ======================================================

router.get("/admin/top-users", verifyToken, isAdmin, async (req, res) => {
  try {
    const topUsers = await Withdraw.aggregate([
      { $match: { status: "APPROVED" } },

      {
        $group: {
          _id: "$username",

          totalWithdrawals: { $sum: 1 },
          totalAmount: { $sum: "$amount" },

          pkrWithdrawals: {
            $sum: {
              $cond: [{ $eq: ["$walletType", "PKR"] }, "$amount", 0],
            },
          },

          usdtWithdrawals: {
            $sum: {
              $cond: [{ $eq: ["$walletType", "USDT"] }, "$amount", 0],
            },
          },

          lastWithdraw: { $max: "$createdAt" },
        },
      },

      { $sort: { totalAmount: -1 } },

      { $limit: 20 },
    ]);

    return res.status(200).json({
      success: true,
      total: topUsers.length,

      users: topUsers.map((user, index) => ({
        rank: index + 1,
        username: user._id,

        totalWithdrawals: user.totalWithdrawals,

        totalAmount: Number(user.totalAmount.toFixed(2)),

        pkrWithdrawals: Number(user.pkrWithdrawals.toFixed(2)),

        usdtWithdrawals: Number(user.usdtWithdrawals.toFixed(6)),

        lastWithdraw: user.lastWithdraw,
      })),
    });

  } catch (error) {
    console.error("TOP WITHDRAW USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load top withdraw users.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN USER WITHDRAW SUMMARY
// GET /api/withdraw/admin/user-summary/:username
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

      const withdrawals = await Withdraw.find({
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

      withdrawals.forEach((withdraw) => {
        const amount = Number(withdraw.amount || 0);

        switch (withdraw.status) {
          case "PENDING":
            pendingCount++;
            pendingAmount += amount;
            break;

          case "APPROVED":
            approvedCount++;
            approvedAmount += amount;
            break;

          case "REJECTED":
            rejectedCount++;
            rejectedAmount += amount;
            break;

          case "CANCELLED":
            cancelledCount++;
            cancelledAmount += amount;
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
          totalWithdrawals: withdrawals.length,

          pendingCount,
          approvedCount,
          rejectedCount,
          cancelledCount,

          pendingAmount: Number(pendingAmount.toFixed(2)),
          approvedAmount: Number(approvedAmount.toFixed(2)),
          rejectedAmount: Number(rejectedAmount.toFixed(2)),
          cancelledAmount: Number(cancelledAmount.toFixed(2)),
        },

        recentWithdrawals: withdrawals.slice(0, 10),
      });

    } catch (error) {
      console.error("USER WITHDRAW SUMMARY ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load user withdraw summary.",
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
// withdrawRoutes.js — PART 6/8
// Withdraw Settings + Payment Settings APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// GET WITHDRAW SETTINGS
// GET /api/withdraw/settings
// Admin Dashboard
// ======================================================

router.get("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getWithdrawSettings();

    return res.status(200).json({
      success: true,

      settings: {
        withdrawEnabled: Boolean(settings.withdrawEnabled),

        minimumWithdraw: Number(settings.minimumWithdraw),
        maximumWithdraw: Number(settings.maximumWithdraw),

        updatedAt: settings.updatedAt,
      },
    });

  } catch (error) {
    console.error("GET WITHDRAW SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw settings.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// UPDATE WITHDRAW SETTINGS
// PATCH /api/withdraw/settings
// Admin Only
// ======================================================

router.patch("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      withdrawEnabled,
      minimumWithdraw,
      maximumWithdraw,
    } = req.body;

    const settings = await getWithdrawSettings();

    if (typeof withdrawEnabled === "boolean") {
      settings.withdrawEnabled = withdrawEnabled;
    }

    if (minimumWithdraw !== undefined) {
      settings.minimumWithdraw = Number(minimumWithdraw);
    }

    if (maximumWithdraw !== undefined) {
      settings.maximumWithdraw = Number(maximumWithdraw);
    }

    if (
      Number(settings.minimumWithdraw) >
      Number(settings.maximumWithdraw)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum withdraw cannot be greater than maximum withdraw.",
      });
    }

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Withdraw settings updated successfully.",

      settings: {
        withdrawEnabled: settings.withdrawEnabled,
        minimumWithdraw: settings.minimumWithdraw,
        maximumWithdraw: settings.maximumWithdraw,
        updatedAt: settings.updatedAt,
      },
    });

  } catch (error) {
    console.error("UPDATE WITHDRAW SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update withdraw settings.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// GET WITHDRAW PAYMENT SETTINGS
// GET /api/withdraw/payment-settings
// Used by Withdraw Page
// ======================================================

router.get("/payment-settings", verifyToken, async (req, res) => {
  try {
    const settings = await getWithdrawSettings();

    return res.status(200).json({
      success: true,

      paymentSettings: settings.withdrawPaymentSettings || {
        bankName: "",
        accountTitle: "",
        accountNumber: "",
        iban: "",

        usdtNetwork: "TRC20",
        usdtAddress: "",
      },
    });

  } catch (error) {
    console.error("GET WITHDRAW PAYMENT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw payment settings.",
    });
  }
});

// ======================================================
// UPDATE WITHDRAW PAYMENT SETTINGS
// PATCH /api/withdraw/payment-settings
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
        iban,
        usdtNetwork,
        usdtAddress,
      } = req.body;

      const settings = await getWithdrawSettings();

      settings.withdrawPaymentSettings = {
        bankName: bankName || "",
        accountTitle: accountTitle || "",
        accountNumber: accountNumber || "",
        iban: iban || "",

        usdtNetwork: usdtNetwork || "TRC20",
        usdtAddress: usdtAddress || "",
      };

      await settings.save();

      return res.status(200).json({
        success: true,
        message: "Withdraw payment settings updated successfully.",
        paymentSettings: settings.withdrawPaymentSettings,
      });

    } catch (error) {
      console.error("UPDATE WITHDRAW PAYMENT SETTINGS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update withdraw payment settings.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// PUBLIC WITHDRAW PAYMENT DETAILS
// GET /api/withdraw/payment-details
// Used by frontend/app/withdraw/page.tsx
// ======================================================

router.get("/payment-details", async (req, res) => {
  try {
    const settings = await getWithdrawSettings();

    return res.status(200).json({
      success: true,

      withdrawEnabled: settings.withdrawEnabled,

      limits: {
        minimumWithdraw: Number(settings.minimumWithdraw),
        maximumWithdraw: Number(settings.maximumWithdraw),
      },

      bank: {
        bankName:
          settings.withdrawPaymentSettings?.bankName || "",
        accountTitle:
          settings.withdrawPaymentSettings?.accountTitle || "",
        accountNumber:
          settings.withdrawPaymentSettings?.accountNumber || "",
        iban:
          settings.withdrawPaymentSettings?.iban || "",
      },

      usdt: {
        network:
          settings.withdrawPaymentSettings?.usdtNetwork || "TRC20",
        address:
          settings.withdrawPaymentSettings?.usdtAddress || "",
      },
    });

  } catch (error) {
    console.error("GET WITHDRAW PAYMENT DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw payment details.",
    });
  }
});
// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js — PART 7/8
// Admin All Withdraw Requests + Search + Filters APIs
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// ADMIN GET ALL WITHDRAW REQUESTS
// GET /api/withdraw/admin/all
// Used by frontend/app/admin/withdraw/page.tsx
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

    const total = await Withdraw.countDocuments(query);

    const withdrawals = await Withdraw.find(query)
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

      withdrawals,
    });

  } catch (error) {
    console.error("ADMIN GET ALL WITHDRAWALS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdrawals.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN GET SINGLE WITHDRAW REQUEST
// GET /api/withdraw/admin/:id
// ======================================================

router.get("/admin/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id).lean();

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    const wallet = await Wallet.findOne({
      userId: withdraw.userId,
    }).lean();

    return res.status(200).json({
      success: true,

      withdraw,

      wallet: wallet
        ? {
            pkrBalance: Number(wallet.pkrBalance || 0),
            usdtBalance: Number(wallet.usdtBalance || 0),
            goldBalance: Number(wallet.goldBalance || 0),
          }
        : null,
    });

  } catch (error) {
    console.error("ADMIN GET WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw details.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// ADMIN SEARCH WITHDRAWALS
// GET /api/withdraw/admin/search
// ?reference=WTH-123
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

    const withdrawals = await Withdraw.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: withdrawals.length,
      withdrawals,
    });

  } catch (error) {
    console.error("ADMIN SEARCH WITHDRAWALS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search withdrawals.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// USER WITHDRAW REQUESTS BY USERNAME
// GET /api/withdraw/admin/user/:username
// ======================================================

router.get(
  "/admin/user/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username = req.params.username.trim().toLowerCase();

      const user = await User.findOne({ username }).select("_id username");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const withdrawals = await Withdraw.find({
        userId: user._id,
      })
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        username,
        total: withdrawals.length,
        withdrawals,
      });

    } catch (error) {
      console.error("USER WITHDRAW LIST ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load user withdrawals.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// WITHDRAW REQUEST PREVIEW
// GET /api/withdraw/admin/preview/:id
// ======================================================

router.get(
  "/admin/preview/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const withdraw = await Withdraw.findById(req.params.id).lean();

      if (!withdraw) {
        return res.status(404).json({
          success: false,
          message: "Withdraw request not found.",
        });
      }

      const wallet = await Wallet.findOne({
        userId: withdraw.userId,
      }).lean();

      return res.status(200).json({
        success: true,

        preview: {
          withdraw,

          walletBefore: withdraw.walletBefore,

          currentWallet: wallet
            ? {
                pkrBalance: Number(wallet.pkrBalance || 0),
                usdtBalance: Number(wallet.usdtBalance || 0),
                goldBalance: Number(wallet.goldBalance || 0),
              }
            : null,
        },
      });

    } catch (error) {
      console.error("WITHDRAW PREVIEW ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to preview withdrawal.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js — PART 8/8 FINAL
// Bulk Approve + Bulk Reject + Statistics + Debug + Export
// Production Ready (Render + PM2 + MongoDB Atlas)
// ======================================================

// ======================================================
// BULK APPROVE WITHDRAWALS
// PATCH /api/withdraw/admin/bulk-approve
// ======================================================

router.patch("/admin/bulk-approve", verifyToken, isAdmin, async (req, res) => {
  try {
    const { withdrawIds } = req.body;

    if (!Array.isArray(withdrawIds) || withdrawIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "withdrawIds array is required.",
      });
    }

    let approved = 0;
    let skipped = 0;
    const failed = [];

    for (const withdrawId of withdrawIds) {
      try {
        const withdraw = await Withdraw.findById(withdrawId);

        if (!withdraw || withdraw.status !== "PENDING") {
          skipped++;
          continue;
        }

        const wallet = await getWallet(withdraw.userId, withdraw.username);
        const amount = Number(withdraw.amount);

        withdraw.walletBefore = {
          pkrBalance: Number(wallet.pkrBalance || 0),
          usdtBalance: Number(wallet.usdtBalance || 0),
          goldBalance: Number(wallet.goldBalance || 0),
        };

        if (withdraw.walletType === "PKR") {
          if (wallet.pkrBalance < amount) {
            failed.push({
              withdrawId,
              error: "Insufficient PKR balance.",
            });
            continue;
          }

          wallet.pkrBalance -= amount;
          wallet.totalWithdraw += amount;
        } else {
          if (wallet.usdtBalance < amount) {
            failed.push({
              withdrawId,
              error: "Insufficient USDT balance.",
            });
            continue;
          }

          wallet.usdtBalance -= amount;
          wallet.totalUsdtWithdrawn += amount;
        }

        wallet.lastWithdrawAt = new Date();
        await wallet.save();

        withdraw.walletAfter = {
          pkrBalance: Number(wallet.pkrBalance),
          usdtBalance: Number(wallet.usdtBalance),
          goldBalance: Number(wallet.goldBalance),
        };

        withdraw.status = "APPROVED";
        withdraw.approvedBy = req.user.id;
        withdraw.approvedByUsername = req.user.username;
        withdraw.approvedAt = new Date();

        await withdraw.save();

        await WalletHistory.create({
          userId: withdraw.userId,
          username: withdraw.username,

          walletType: withdraw.walletType,
          type: "WITHDRAW",

          amount,

          balanceBefore:
            withdraw.walletType === "PKR"
              ? withdraw.walletBefore.pkrBalance
              : withdraw.walletBefore.usdtBalance,

          balanceAfter:
            withdraw.walletType === "PKR"
              ? wallet.pkrBalance
              : wallet.usdtBalance,

          referenceId: withdraw.referenceId,

          admin: req.user.username,
          note: "Bulk withdraw approved.",
        });

        await Transaction.create({
          userId: withdraw.userId,
          username: withdraw.username,

          walletType: withdraw.walletType,

          transactionType: "WITHDRAW_APPROVED",
          transactionMode: "DEBIT",

          amount,

          balanceBefore:
            withdraw.walletType === "PKR"
              ? withdraw.walletBefore.pkrBalance
              : withdraw.walletBefore.usdtBalance,

          balanceAfter:
            withdraw.walletType === "PKR"
              ? wallet.pkrBalance
              : wallet.usdtBalance,

          status: "Completed",

          paymentMethod: withdraw.paymentMethod,
          referenceId: withdraw.referenceId,

          adminId: req.user.id,
          adminUsername: req.user.username,

          note: "Bulk withdraw approved.",
        });

        approved++;

      } catch (err) {
        failed.push({
          withdrawId,
          error: err.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk withdraw approval completed.",

      result: {
        requested: withdrawIds.length,
        approved,
        skipped,
        failed: failed.length,
      },

      failed,
    });

  } catch (error) {
    console.error("BULK APPROVE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Bulk approval failed.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// BULK REJECT WITHDRAWALS
// PATCH /api/withdraw/admin/bulk-reject
// ======================================================

router.patch("/admin/bulk-reject", verifyToken, isAdmin, async (req, res) => {
  try {
    const { withdrawIds, rejectReason } = req.body;

    if (!Array.isArray(withdrawIds) || withdrawIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "withdrawIds array is required.",
      });
    }

    let rejected = 0;
    let skipped = 0;
    const failed = [];

    for (const withdrawId of withdrawIds) {
      try {
        const withdraw = await Withdraw.findById(withdrawId);

        if (!withdraw || withdraw.status !== "PENDING") {
          skipped++;
          continue;
        }

        withdraw.status = "REJECTED";
        withdraw.rejectReason =
          rejectReason || "Bulk rejected by admin.";

        withdraw.approvedBy = req.user.id;
        withdraw.approvedByUsername = req.user.username;
        withdraw.rejectedAt = new Date();

        await withdraw.save();

        await WalletHistory.create({
          userId: withdraw.userId,
          username: withdraw.username,

          walletType: withdraw.walletType,
          type: "WITHDRAW_REJECTED",

          amount: Number(withdraw.amount),

          balanceBefore:
            withdraw.walletType === "PKR"
              ? Number(withdraw.walletBefore?.pkrBalance || 0)
              : Number(withdraw.walletBefore?.usdtBalance || 0),

          balanceAfter:
            withdraw.walletType === "PKR"
              ? Number(withdraw.walletBefore?.pkrBalance || 0)
              : Number(withdraw.walletBefore?.usdtBalance || 0),

          referenceId: withdraw.referenceId,

          admin: req.user.username,
          note: withdraw.rejectReason,
        });

        await Transaction.create({
          userId: withdraw.userId,
          username: withdraw.username,

          walletType: withdraw.walletType,

          transactionType: "WITHDRAW_REJECTED",
          transactionMode: "DEBIT",

          amount: Number(withdraw.amount),

          balanceBefore:
            withdraw.walletType === "PKR"
              ? Number(withdraw.walletBefore?.pkrBalance || 0)
              : Number(withdraw.walletBefore?.usdtBalance || 0),

          balanceAfter:
            withdraw.walletType === "PKR"
              ? Number(withdraw.walletBefore?.pkrBalance || 0)
              : Number(withdraw.walletBefore?.usdtBalance || 0),

          status: "Rejected",

          paymentMethod: withdraw.paymentMethod,
          referenceId: withdraw.referenceId,

          adminId: req.user.id,
          adminUsername: req.user.username,

          note: withdraw.rejectReason,
        });

        rejected++;

      } catch (err) {
        failed.push({
          withdrawId,
          error: err.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Bulk withdraw rejection completed.",

      result: {
        requested: withdrawIds.length,
        rejected,
        skipped,
        failed: failed.length,
      },

      failed,
    });

  } catch (error) {
    console.error("BULK REJECT WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Bulk rejection failed.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});

// ======================================================
// WITHDRAW STATISTICS
// GET /api/withdraw/statistics
// ======================================================

router.get("/statistics", verifyToken, async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? {}
        : { userId: req.user.id };

    const withdrawals = await Withdraw.find(query).lean();

    let pendingAmount = 0;
    let approvedAmount = 0;
    let rejectedAmount = 0;
    let totalPKR = 0;
    let totalUSDT = 0;

    withdrawals.forEach((withdraw) => {
      const amount = Number(withdraw.amount || 0);

      switch (withdraw.status) {
        case "PENDING":
          pendingAmount += amount;
          break;

        case "APPROVED":
          approvedAmount += amount;

          if (withdraw.walletType === "PKR") totalPKR += amount;
          if (withdraw.walletType === "USDT") totalUSDT += amount;
          break;

        case "REJECTED":
          rejectedAmount += amount;
          break;
      }
    });

    return res.status(200).json({
      success: true,

      statistics: {
        totalWithdrawals: withdrawals.length,

        pendingAmount: Number(pendingAmount.toFixed(2)),
        approvedAmount: Number(approvedAmount.toFixed(2)),
        rejectedAmount: Number(rejectedAmount.toFixed(2)),

        totalPKRWithdrawals: Number(totalPKR.toFixed(2)),
        totalUSDTWithdrawals: Number(totalUSDT.toFixed(6)),
      },

      generatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("WITHDRAW STATISTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load statistics.",
    });
  }
});

// ======================================================
// WITHDRAW DEBUG
// GET /api/withdraw/debug
// ======================================================

router.get("/debug", verifyToken, async (req, res) => {
  try {
    const query =
      req.user.role === "admin"
        ? {}
        : { userId: req.user.id };

    const [
      wallet,
      withdrawCount,
      pendingCount,
      transactionCount,
      historyCount,
    ] = await Promise.all([
      Wallet.findOne({ userId: req.user.id }).lean(),

      Withdraw.countDocuments(query),

      Withdraw.countDocuments({
        ...query,
        status: "PENDING",
      }),

      Transaction.countDocuments({
        ...query,
        transactionType: { $regex: "^WITHDRAW" },
      }),

      WalletHistory.countDocuments({
        ...query,
        type: { $regex: "WITHDRAW" },
      }),
    ]);

    return res.status(200).json({
      success: true,

      diagnostics: {
        module: "Withdraw API V18 Enterprise",

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

        totalWithdrawals: withdrawCount,
        pendingWithdrawals: pendingCount,

        transactionLedgerEntries: transactionCount,
        walletHistoryEntries: historyCount,
      },

      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error("WITHDRAW DEBUG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Diagnostics failed.",
    });
  }
});

// ======================================================
// API ROUTES LIST
// GET /api/withdraw/routes
// ======================================================

router.get("/routes", (req, res) => {
  return res.status(200).json({
    success: true,

    module: "GoldTrade V18 Enterprise Withdraw API",
    version: "18.0.0",

    routes: [
      "GET /api/withdraw/health",
      "POST /api/withdraw/create",
      "GET /api/withdraw/history",
      "PATCH /api/withdraw/:id/approve",
      "PATCH /api/withdraw/:id/reject",
      "GET /api/withdraw/admin/dashboard",
      "GET /api/withdraw/admin/all",
      "PATCH /api/withdraw/admin/bulk-approve",
      "PATCH /api/withdraw/admin/bulk-reject",
    ],

    timestamp: new Date().toISOString(),
  });
})
module.exports = router;