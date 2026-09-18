const express = require("express");
const router = express.Router();

const Deposit = require("../models/Deposit");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");

// =====================================================
// CREATE DEPOSIT REQUEST
// POST /api/deposit
// =====================================================
router.post("/", verifyToken, async (req, res) => {
  try {
    const {
      requestAmount,
      currency,
      paymentMethod,
      senderName,
      senderAccount,
      transactionId,
      receiptImage,
      note,
    } = req.body;

    if (!requestAmount || Number(requestAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Deposit amount is required.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const deposit = await Deposit.create({
      userId: user._id,
      username: user.username,
      email: user.email,

      requestAmount: Number(requestAmount),
      currency: currency || "PKR",
      paymentMethod: paymentMethod || "Bank Transfer",

      senderName,
      senderAccount,
      transactionId,
      receiptImage,
      note,

      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Deposit request submitted successfully.",
      data: deposit,
    });
  } catch (err) {
    console.error("CREATE DEPOSIT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// =====================================================
// USER DEPOSIT HISTORY
// GET /api/deposit/history
// =====================================================
router.get("/history", verifyToken, async (req, res) => {
  try {
    const deposits = await Deposit.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: deposits.length,
      data: deposits,
    });
  } catch (err) {
    console.error("DEPOSIT HISTORY ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// GET SINGLE DEPOSIT
// GET /api/deposit/:id
// =====================================================
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const deposit = await Deposit.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    return res.json({
      success: true,
      data: deposit,
    });
  } catch (err) {
    console.error("GET DEPOSIT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;