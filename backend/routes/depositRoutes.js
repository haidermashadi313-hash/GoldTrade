const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Deposit = require("../models/Deposit");
const User = require("../models/User");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// ===========================================
// CREATE DEPOSIT
// POST /api/deposit
// ===========================================

router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      amount,
      walletType,
      transactionId,
      screenshot,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Deposit amount is required.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const deposit = await Deposit.create({
      userId: user._id,
      amount: Number(amount),
      walletType: walletType || "USDT",
      transactionId: transactionId || "",
      screenshot: screenshot || "",
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Deposit submitted successfully.",
      deposit,
    });

  } catch (err) {
    console.error("Deposit Create Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// ===========================================
// USER DEPOSIT HISTORY
// GET /api/deposit/history
// ===========================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const deposits = await Deposit.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      deposits,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Unable to load history.",
    });
  }
});

// ===========================================
// GET SINGLE DEPOSIT
// GET /api/deposit/:id
// ===========================================

router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Deposit ID.",
      });
    }

    const deposit = await Deposit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    return res.json({
      success: true,
      deposit,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});
// ===========================================
// CANCEL DEPOSIT
// DELETE /api/deposit/:id
// ===========================================

router.delete("/:id", verifyToken, async (req, res) => {
  try {

    const deposit = await Deposit.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    if (deposit.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending deposits can be cancelled.",
      });
    }

    deposit.status = "Cancelled";
    await deposit.save();

    return res.json({
      success: true,
      message: "Deposit cancelled successfully.",
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// ===========================================
// ADMIN GET ALL DEPOSITS
// GET /api/deposit/admin
// ===========================================

router.get("/admin", verifyToken, isAdmin, async (req, res) => {
  try {

    const deposits = await Deposit.find()
      .populate("userId", "username email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      deposits,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposits.",
    });
  }
});

// ===========================================
// ADMIN APPROVE
// PUT /api/deposit/admin/:id/approve
// ===========================================

router.put("/admin/:id/approve", verifyToken, isAdmin, async (req, res) => {
  try {

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    deposit.status = "Approved";
    deposit.approvedAmount = req.body.approvedAmount || deposit.amount;

    await deposit.save();

    return res.json({
      success: true,
      message: "Deposit approved successfully.",
      deposit,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

// ===========================================
// ADMIN REJECT
// PUT /api/deposit/admin/:id/reject
// ===========================================

router.put("/admin/:id/reject", verifyToken, isAdmin, async (req, res) => {
  try {

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    deposit.status = "Rejected";
    await deposit.save();

    return res.json({
      success: true,
      message: "Deposit rejected successfully.",
      deposit,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
});

module.exports = router;