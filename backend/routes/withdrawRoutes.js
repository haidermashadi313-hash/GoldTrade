const express = require("express");
const router = express.Router();

const Withdraw = require("../models/Withdraw");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// =============================
// CREATE WITHDRAW REQUEST
// =============================
router.post("/", async (req, res) => {
  try {
    const { username, amount, method, accountNumber } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Balance Check
    if (user.walletBalance < Number(amount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    const withdraw = await Withdraw.create({
      username,
      amount: Number(amount),
      method,
      accountNumber,
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Withdraw request submitted.",
      data: withdraw,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =============================
// GET ALL WITHDRAW REQUESTS
// =============================
router.get("/", async (req, res) => {
  try {
    const withdraws = await Withdraw.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: withdraws,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =============================
// APPROVE / REJECT WITHDRAW
// =============================
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    // Prevent duplicate action
    if (withdraw.status !== "Pending") {
      return res.json({
        success: false,
        message: `Withdraw already ${withdraw.status}.`,
      });
    }

    withdraw.status = status;
    await withdraw.save();

    // =============================
    // APPROVED
    // =============================
    if (status === "Approved") {
      const user = await User.findOne({
        username: withdraw.username,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (user.walletBalance < withdraw.amount) {
        return res.status(400).json({
          success: false,
          message: "Wallet balance is insufficient.",
        });
      }

      user.walletBalance -= Number(withdraw.amount);
      user.totalWithdraw += Number(withdraw.amount);

      await user.save();

      await Transaction.create({
        username: withdraw.username,
        type: "Withdraw",
        amount: withdraw.amount,
        method: withdraw.method,
        transactionId: withdraw._id.toString(),
        status: "Approved",
      });
    }

    // =============================
    // REJECTED
    // =============================
    if (status === "Rejected") {
      await Transaction.create({
        username: withdraw.username,
        type: "Withdraw",
        amount: withdraw.amount,
        method: withdraw.method,
        transactionId: withdraw._id.toString(),
        status: "Rejected",
      });
    }

    res.json({
      success: true,
      message: `Withdraw ${status} successfully.`,
      data: withdraw,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;