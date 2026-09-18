"use strict";

const express = require("express");
const router = express.Router();

const Withdraw = require("../models/Withdraw");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

const { verifyToken, isAdmin } = require("../middleware/Auth");

// =====================================================
// USER CREATE WITHDRAW REQUEST
// POST /api/withdraw/create
// =====================================================

router.post("/create", verifyToken, async (req, res) => {
  try {
    const { amount, method, account } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw amount.",
      });
    }

    const wallet = await Wallet.findOne({ userId: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (wallet.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    const withdraw = await Withdraw.create({
      userId: req.user.id,
      username: req.user.username,
      requestAmount: amount,
      currency: "PKR",
      paymentMethod: method,
      senderAccount: account,
      status: "Pending",
    });

    return res.json({
      success: true,
      withdraw,
      message: "Withdraw request submitted successfully.",
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

    return res.json({
      success: true,
      withdrawals,
    });
  } catch (err) {
    console.error("GET ALL WITHDRAWS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});// =====================================================
// ADMIN APPROVE WITHDRAW
// PUT /api/admin/withdraws/:id/approve
// =====================================================

router.put("/:id/approve", verifyToken, isAdmin, async (req, res) => {
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
        message: "This withdraw request is already processed.",
      });
    }

    const wallet = await Wallet.findOne({ userId: withdraw.userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (wallet.walletBalance < withdraw.requestAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    // Deduct balance
    wallet.walletBalance -= withdraw.requestAmount;
    await wallet.save();

    // Update withdraw status
    withdraw.status = "Approved";
    withdraw.adminNote = req.body.adminNote || "Approved by Admin";
    withdraw.adminAmount = withdraw.requestAmount;
    await withdraw.save();

    // Save transaction
    await Transaction.create({
      userId: withdraw.userId,
      username: withdraw.username,
      transactionType: "Withdraw",
      amountPKR: withdraw.requestAmount,
      status: "Approved",
      provider: withdraw.paymentMethod,
      description: "Withdraw approved by admin",
    });

    return res.json({
      success: true,
      message: "Withdraw approved successfully.",
      withdraw,
    });
  } catch (err) {
    console.error("APPROVE WITHDRAW ERROR:", err);

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
        message: "This withdraw request is already processed.",
      });
    }

    withdraw.status = "Rejected";
    withdraw.adminNote = req.body.adminNote || "Rejected by Admin";
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
});// =====================================================
// USER GET MY WITHDRAW HISTORY
// GET /api/withdraw/history
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

    return res.json({
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
// ADMIN GET PENDING WITHDRAW COUNT
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
          total: { $sum: "$requestAmount" },
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
});// =====================================================
// ADMIN DELETE WITHDRAW REQUEST
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
      message: "Withdraw request deleted successfully.",
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

    const pending = await Withdraw.countDocuments({
      status: "Pending",
    });

    const approved = await Withdraw.countDocuments({
      status: "Approved",
    });

    const rejected = await Withdraw.countDocuments({
      status: "Rejected",
    });

    const totalApprovedAmount = await Withdraw.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$requestAmount" },
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
        totalApprovedAmount: totalApprovedAmount[0]?.total || 0,
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
// EXPORT ROUTER
// =====================================================

module.exports = router;