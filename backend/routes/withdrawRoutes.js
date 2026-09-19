"use strict";

const express = require("express");
const router = express.Router();

// =====================================================
// MODELS
// =====================================================

const Withdraw = require("../models/Withdraw");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

// =====================================================
// MIDDLEWARE
// =====================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// USER CREATE WITHDRAW REQUEST
// POST /api/withdraw/create
// =====================================================

router.post("/create", verifyToken, async (req, res) => {
  try {
    const { amount, paymentMethod, accountTitle, accountNumber } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw amount.",
      });
    }

    // Find user wallet
    const userWallet = await Wallet.findOne({
      userId: req.user.id,
    });

    if (!userWallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    // Check PKR balance
    if (userWallet.PkrBalance < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient PKR balance.",
      });
    }

    // Create withdraw request
    const withdraw = await Withdraw.create({
      userId: req.user.id,
      username: req.user.username,
      amount: Number(amount),
      currency: "Pkr",
      paymentMethod,
      accountTitle,
      accountNumber,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Withdraw request submitted successfully.",
      withdraw,
    });
  } catch (err) {
    console.error("CREATE WITHDRAW ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// ADMIN GET ALL WITHDRAW REQUESTS
// GET /api/admin/withdraws/all
// =====================================================

router.get("/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdraw.find()
      .populate("userId", "username email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: withdrawals.length,
      withdrawals,
    });
  } catch (err) {
    console.error("GET ALL WITHDRAWS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// USER GET MY WITHDRAW HISTORY
// GET /api/withdraw/history
// =====================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const withdrawals = await Withdraw.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      withdrawals,
    });
  } catch (err) {
    console.error("WITHDRAW HISTORY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// USER GET SINGLE WITHDRAW REQUEST
// GET /api/withdraw/:id
// =====================================================

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const withdraw = await Withdraw.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      withdraw,
    });
  } catch (err) {
    console.error("GET SINGLE WITHDRAW ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// =====================================================
// ADMIN REJECT WITHDRAW
// PUT /api/admin/withdraws/:id/reject
// =====================================================

router.put("/:id/reject", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Withdraw request already processed.",
      });
    }

    withdraw.status = "Rejected";
    withdraw.adminNote = req.body.adminNote || "Rejected by Admin";
    withdraw.rejectedBy = req.user.id;
    withdraw.rejectedAt = new Date();

    await withdraw.save();

    return res.json({
      success: true,
      message: "Withdraw rejected successfully.",
      withdraw,
    });
  } catch (err) {
    console.error("REJECT WITHDRAW ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// USER WITHDRAW HISTORY
// GET /api/admin/withdraws/history
// =====================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const withdrawals = await Withdraw.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      withdrawals,
    });
  } catch (err) {
    console.error("WITHDRAW HISTORY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// USER GET SINGLE WITHDRAW
// GET /api/admin/withdraws/:id
// =====================================================

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const withdraw = await Withdraw.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    return res.json({
      success: true,
      withdraw,
    });
  } catch (err) {
    console.error("GET WITHDRAW ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// ADMIN PENDING WITHDRAW SUMMARY
// GET /api/admin/withdraws/pending
// =====================================================

router.get("/pending", verifyToken, isAdmin, async (req, res) => {
  try {
    const pendingCount = await Withdraw.countDocuments({
      status: "Pending",
    });

    const pendingAmount = await Withdraw.aggregate([
      { $match: { status: "Pending" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return res.json({
      success: true,
      pendingCount,
      pendingAmount: pendingAmount[0]?.total || 0,
    });
  } catch (err) {
    console.error("PENDING WITHDRAW ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// ADMIN DELETE WITHDRAW
// DELETE /api/admin/withdraws/:id
// =====================================================

router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    await Withdraw.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Withdraw deleted successfully.",
    });
  } catch (err) {
    console.error("DELETE WITHDRAW ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// ADMIN WITHDRAW STATISTICS
// GET /api/admin/withdraws/stats
// =====================================================

router.get("/stats", verifyToken, isAdmin, async (req, res) => {
  try {
    const totalRequests = await Withdraw.countDocuments();
    const pending = await Withdraw.countDocuments({ status: "Pending" });
    const approved = await Withdraw.countDocuments({ status: "Approved" });
    const rejected = await Withdraw.countDocuments({ status: "Rejected" });

    const approvedAmount = await Withdraw.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return res.json({
      success: true,
      stats: {
        totalRequests,
        pending,
        approved,
        rejected,
        totalApprovedAmount: approvedAmount[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("WITHDRAW STATS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// HEALTH CHECK
// GET /api/admin/withdraws/health
// =====================================================

router.get("/health", (req, res) => {
  return res.json({
    success: true,
    message: "Withdraw Routes Working - GoldTrade V18",
    version: "V18",
  });
});

// =====================================================
// EXPORT ROUTER (Linux + Render Safe)
// =====================================================

module.exports = router;