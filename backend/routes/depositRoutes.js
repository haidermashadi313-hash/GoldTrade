const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Deposit = require("../models/Deposit");
const { verifyToken } = require("../middleware/authMiddleware");


/* ===========================================
   CREATE DEPOSIT REQUEST
   POST /api/deposit/create
=========================================== */

router.post("/create", verifyToken, async (req, res) => {
  try {
    const {
      amount,
      currency,
      method,
      transactionId,
      receiptImage,
    } = req.body;

    // Validation
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid deposit amount is required.",
      });
    }

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.status === "Blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked.",
      });
    }

    if (user.walletFrozen) {
      return res.status(403).json({
        success: false,
        message: "Your wallet has been frozen.",
      });
    }

    // Duplicate Transaction Check
    const existing = await Deposit.findOne({
      transactionId: transactionId.trim().toUpperCase(),
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Transaction ID already submitted.",
      });
    }

    // Create Deposit Request
    const deposit = await Deposit.create({
      userId: user._id,
      username: user.username,
      email: user.email,

      amount: Number(amount),
      currency: currency || "PKR",
      method,

      transactionId: transactionId.trim().toUpperCase(),
      receiptImage: receiptImage || "",

      status: "Pending",

      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully.",
      deposit,
    });
  } catch (err) {
    console.error("Deposit Create Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to submit deposit request.",
    });
  }
});

/* ===========================================
   USER DEPOSIT HISTORY
   GET /api/deposit/history
=========================================== */

router.get("/history", verifyToken, async (req, res) => {
  try {
    const deposits = await Deposit.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      total: deposits.length,
      deposits,
    });
  } catch (err) {
    console.error("Deposit History Error:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit history.",
    });
  }
});

/* ===========================================
   GET SINGLE DEPOSIT
   GET /api/deposit/:id
=========================================== */

router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit ID.",
      });
    }

    const deposit = await Deposit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    return res.json({
      success: true,
      deposit,
    });
  } catch (err) {
    console.error("Get Deposit Error:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit.",
    });
  }
});

/* ===========================================
   CANCEL PENDING DEPOSIT
   DELETE /api/deposit/:id
=========================================== */

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit ID.",
      });
    }

    const deposit = await Deposit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    if (deposit.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending deposits can be cancelled.",
      });
    }

   
    deposit.status = "Cancelled";
    deposit.cancelledAt = new Date();

    await deposit.save();

    return res.json({
      success: true,
      message: "Deposit request cancelled successfully.",
      deposit,
    });
  } catch (err) {
    console.error("Cancel Deposit Error:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel deposit request.",
    });
  }
});

module.exports = router;