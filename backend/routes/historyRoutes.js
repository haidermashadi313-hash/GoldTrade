const express = require("express");
const router = express.Router();

const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");
const { verifyToken } = require("../middleware/authMiddleware");

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }
  next();
};

// GET COMPLETE HISTORY
router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 });
    const withdrawals = await Withdraw.find().sort({ createdAt: -1 });

    const history = [
      ...deposits.map((d) => ({
        type: "Deposit",
        ...d.toObject(),
      })),
      ...withdrawals.map((w) => ({
        type: "Withdraw",
        ...w.toObject(),
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      history,
      deposits: deposits.length,
      withdrawals: withdrawals.length,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unable to load history.",
    });
  }
});

module.exports = router;