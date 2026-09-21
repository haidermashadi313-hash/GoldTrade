/*
========================================================
 GoldTrade V18 Enterprise
 Withdraw Routes
 Linux + Render Compatible
========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();

// ================= MODELS =================
const Withdraw = require("../models/Withdraw");

// ================= MIDDLEWARE =================
const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// USER CREATE WITHDRAW REQUEST
// POST /api/withdraw
// ======================================================

router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      withdrawAmount,
      walletType,
      paymentMethod,
      accountTitle,
      accountNumber,
      iban,
      walletAddress,
    } = req.body;

    if (
      !withdrawAmount ||
      !walletType ||
      !paymentMethod ||
      !accountTitle ||
      !accountNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are missing.",
      });
    }

    const amount = Number(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw amount.",
      });
    }

    const request = await Withdraw.create({
      userId: req.user.id,
      username: req.user.username.toLowerCase(),

      withdrawAmount: amount,
      walletType,
      paymentMethod,

      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),

      iban: iban || "",
      walletAddress: walletAddress || "",

      status: "Pending",

      ipAddress: req.ip || "",
      device: req.headers["user-agent"] || "",
    });

    return res.status(201).json({
      success: true,
      message: "Withdraw request submitted successfully.",
      request,
    });
  } catch (error) {
    console.error("CREATE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit withdraw request.",
      error: error.message,
    });
  }
});

// ======================================================
// USER WITHDRAW HISTORY
// GET /api/withdraw/history/:username
// ======================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    if (username !== req.user.username.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const history = await Withdraw.find({ username })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("WITHDRAW HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw history.",
      error: error.message,
    });
  }
});

// ======================================================
// ADMIN GET ALL WITHDRAW REQUESTS
// GET /api/withdraw/admin
// ======================================================

router.get("/admin", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraws = await Withdraw.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      withdraws,
    });
  } catch (error) {
    console.error("ADMIN WITHDRAW LIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw requests.",
      error: error.message,
    });
  }
});
// ======================================================
// ADMIN APPROVE WITHDRAW REQUEST
// PUT /api/withdraw/admin/:id/approve
// ======================================================

router.put("/admin/:id/approve", verifyToken, isAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;

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
        message: `Withdraw request already ${withdraw.status}.`,
      });
    }

    // Enterprise Rule:
    // ONLY update request status.
    withdraw.status = "Approved";
    withdraw.adminNote = adminNote || "Approved by Admin";
    withdraw.reviewedBy = req.user.id;
    withdraw.reviewedAt = new Date();

    await withdraw.save();

    return res.status(200).json({
      success: true,
      message: "Withdraw request approved successfully.",
      withdraw,
    });
  } catch (error) {
    console.error("APPROVE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve withdraw request.",
      error: error.message,
    });
  }
});

// ======================================================
// ADMIN REJECT WITHDRAW REQUEST
// PUT /api/withdraw/admin/:id/reject
// ======================================================

router.put("/admin/:id/reject", verifyToken, isAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;

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
        message: `Withdraw request already ${withdraw.status}.`,
      });
    }

    withdraw.status = "Rejected";
    withdraw.adminNote = adminNote || "Rejected by Admin";
    withdraw.reviewedBy = req.user.id;
    withdraw.reviewedAt = new Date();

    await withdraw.save();

    return res.status(200).json({
      success: true,
      message: "Withdraw request rejected successfully.",
      withdraw,
    });
  } catch (error) {
    console.error("REJECT WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject withdraw request.",
      error: error.message,
    });
  }
});

// ======================================================
// ADMIN SINGLE WITHDRAW DETAILS
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

    return res.status(200).json({
      success: true,
      withdraw,
    });
  } catch (error) {
    console.error("WITHDRAW DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw details.",
      error: error.message,
    });
  }
});

// ======================================================
// HEALTH CHECK
// GET /api/withdraw/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Withdraw Manager Enterprise",
    version: "GoldTrade V18",
    status: "Working",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;