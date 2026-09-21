/*
========================================================
 GoldTrade V18 Enterprise
 Deposit Routes
 Linux + Render + MongoDB Compatible
========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();

// =============================
// MODELS
// =============================

const Deposit = require("../models/Deposit");
const User = require("../models/User");

// =============================
// MIDDLEWARE
// =============================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// HEALTH CHECK
// GET /api/deposit/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Deposit Manager",
    version: "GoldTrade V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// CREATE DEPOSIT REQUEST
// POST /api/deposit
// USER ONLY
// ======================================================

router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      requestAmount,
      paymentMethod,
      transactionId,
      receiptImage,
    } = req.body;

    if (!requestAmount || Number(requestAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Deposit amount is required.",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required.",
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
      username: user.username.toLowerCase(),
      requestAmount: Number(requestAmount),
      paymentMethod,
      transactionId: transactionId || "",
      receiptImage: receiptImage || "",
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully.",
      deposit,
    });

  } catch (error) {
    console.error("CREATE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit deposit request.",
      error: error.message,
    });
  }
});

// ======================================================
// USER DEPOSIT HISTORY
// GET /api/deposit/history/:username
// ======================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    const deposits = await Deposit.find({ username })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      deposits,
    });

  } catch (error) {
    console.error("DEPOSIT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit history.",
      error: error.message,
    });
  }
});

// ======================================================
// ADMIN GET ALL DEPOSITS
// GET /api/deposit/admin
// ======================================================

router.get("/admin", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: deposits.length,
      deposits,
    });

  } catch (error) {
    console.error("ADMIN DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposits.",
      error: error.message,
    });
  }
});
// ======================================================
// APPROVE DEPOSIT
// PUT /api/deposit/admin/:id/approve
// STATUS ONLY (NO WALLET CREDIT)
// ======================================================

router.put(
  "/admin/:id/approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const deposit = await Deposit.findById(req.params.id);

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message: "Deposit request not found.",
        });
      }

      if (deposit.status !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "Deposit already processed.",
        });
      }

      deposit.status = "Approved";
      deposit.reviewedBy = req.user.id;
      deposit.reviewedAt = new Date();
      deposit.adminNote = req.body.adminNote || "";

      await deposit.save();

      return res.status(200).json({
        success: true,
        message: "Deposit approved successfully.",
        deposit,
      });

    } catch (error) {
      console.error("APPROVE DEPOSIT ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to approve deposit.",
        error: error.message,
      });
    }
  }
);

// ======================================================
// REJECT DEPOSIT
// PUT /api/deposit/admin/:id/reject
// STATUS ONLY (NO WALLET DEBIT)
// ======================================================

router.put(
  "/admin/:id/reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const deposit = await Deposit.findById(req.params.id);

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message: "Deposit request not found.",
        });
      }

      if (deposit.status !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "Deposit already processed.",
        });
      }

      deposit.status = "Rejected";
      deposit.reviewedBy = req.user.id;
      deposit.reviewedAt = new Date();
      deposit.adminNote = req.body.adminNote || "";

      await deposit.save();

      return res.status(200).json({
        success: true,
        message: "Deposit rejected successfully.",
        deposit,
      });

    } catch (error) {
      console.error("REJECT DEPOSIT ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to reject deposit.",
        error: error.message,
      });
    }
  }
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;