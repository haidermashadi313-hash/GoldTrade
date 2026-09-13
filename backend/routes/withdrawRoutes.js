const express = require("express");
const router = express.Router();

const Withdraw = require("../models/Withdraw");
const User = require("../models/User");
const { verifyToken } = require("../middleware/authMiddleware");

/* ======================================================
   USER CREATE WITHDRAW REQUEST
   POST /api/withdraw/request
====================================================== */

router.post("/request", verifyToken, async (req, res) => {
  try {
    const {
      amount,
      paymentMethod,
      bankName,
      accountTitle,
      accountNumber,
      iban,
      walletAddress,
      network,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Validation
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid withdraw amount.",
      });
    }

    if (Number(amount) > (user.walletBalance || 0)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    if (!paymentMethod || !accountTitle || !accountNumber) {
      return res.status(400).json({
        success: false,
        message: "Payment details are incomplete.",
      });
    }

    const withdraw = await Withdraw.create({
      userId: user._id,
      username: user.username,

      amount: Number(amount),
      currency: "PKR",

      paymentMethod,
      bankName: bankName || "",
      accountTitle,
      accountNumber,
      iban: iban || "",
      walletAddress: walletAddress || "",
      network: network || "",

      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Withdraw request submitted successfully.",
      withdraw,
    });

  } catch (err) {
    console.error("Withdraw Request Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to submit withdraw request.",
    });
  }
});

/* ======================================================
   USER WITHDRAW HISTORY
   GET /api/withdraw/history/:username
====================================================== */

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({
      username: req.params.username,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      total: withdraws.length,
      withdraws,
    });

  } catch (err) {
    console.error("Withdraw History Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load withdraw history.",
    });
  }
});

/* ======================================================
   USER SINGLE WITHDRAW REQUEST
   GET /api/withdraw/:id
====================================================== */

router.get("/:id", verifyToken, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    // User sirf apni request dekh sakta hai
    if (
      withdraw.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    res.json({
      success: true,
      withdraw,
    });

  } catch (err) {
    console.error("Single Withdraw Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load withdraw request.",
    });
  }
});

module.exports = router;