const express = require("express");
const router = express.Router();

const Transaction = require("../models/Transaction");
const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================
// GET USER TRANSACTIONS
// ==========================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      transactions,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Unable to load transactions.",
    });
  }
});

// ==========================================
// CREATE TRANSACTION
// ==========================================
router.post("/", verifyToken, async (req, res) => {
  try {
    const { type, amount, asset, note } = req.body;

    const transaction = await Transaction.create({
      userId: req.user._id,
      username: req.user.username,
      type,
      amount,
      asset,
      note,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Transaction created.",
      transaction,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Transaction failed.",
    });
  }
});

module.exports = router;