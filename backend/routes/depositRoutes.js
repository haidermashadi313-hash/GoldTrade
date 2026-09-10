const express = require("express");
const router = express.Router();

const Deposit = require("../models/Deposit");
const upload = require("../middleware/uploadMiddleware");
const { verifyToken } = require("../middleware/authMiddleware");

// =======================================
// CREATE DEPOSIT
// =======================================
router.post(
  "/",
  verifyToken,
  upload.single("receipt"),
  async (req, res) => {
    try {
      const { amount } = req.body;

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount.",
        });
      }

      const deposit = await Deposit.create({
        userId: req.user._id,
        username: req.user.username,
        email: req.user.email,
        amount: Number(amount),

        walletAddress:
          process.env.USDT_WALLET ||
          "TN5Dxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",

        receipt: req.file
          ? `/uploads/deposits/${req.file.filename}`
          : "",
      });

      return res.status(201).json({
        success: true,
        message: "Deposit submitted successfully.",
        deposit,
      });
    } catch (err) {
      console.error(err);

      return res.status(500).json({
        success: false,
        message: "Deposit failed.",
      });
    }
  }
);

// =======================================
// USER DEPOSITS
// =======================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const deposits = await Deposit.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      deposits,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unable to load deposits.",
    });
  }
});

module.exports = router;