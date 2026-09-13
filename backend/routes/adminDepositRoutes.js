const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Deposit = require("../models/Deposit");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const { verifyToken } = require("../middleware/authMiddleware");

// ======================================================
// ADMIN MIDDLEWARE
// ======================================================

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }

  next();
};

// ======================================================
// DASHBOARD STATS
// GET /api/admin/deposits/stats
// ======================================================

router.get("/stats", async (req, res) => {
  try {
    const pending = await Deposit.countDocuments({ status: "Pending" });
    const approved = await Deposit.countDocuments({ status: "Approved" });
    const rejected = await Deposit.countDocuments({ status: "Rejected" });

    const totalAmount = await Deposit.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        pending,
        approved,
        rejected,
        totalAmount: totalAmount[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to load dashboard stats.",
    });
  }
});

// ======================================================
// PENDING DEPOSITS
// GET /api/admin/deposits/pending
// ======================================================

router.get("/pending", async (req, res) => {
  try {
    const deposits = await Deposit.find({ status: "Pending" }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      total: deposits.length,
      deposits,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to load pending deposits.",
    });
  }
});

// ======================================================
// APPROVED DEPOSITS
// GET /api/admin/deposits/approved
// ======================================================

router.get("/approved", async (req, res) => {
  try {
    const deposits = await Deposit.find({ status: "Approved" }).sort({
      approvedAt: -1,
    });

    res.json({
      success: true,
      total: deposits.length,
      deposits,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to load approved deposits.",
    });
  }
});

// ======================================================
// REJECTED DEPOSITS
// GET /api/admin/deposits/rejected
// ======================================================

router.get("/rejected", async (req, res) => {
  try {
    const deposits = await Deposit.find({ status: "Rejected" }).sort({
      rejectedAt: -1,
    });

    res.json({
      success: true,
      total: deposits.length,
      deposits,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to load rejected deposits.",
    });
  }
});

// ======================================================
// GET ALL DEPOSITS
// GET /api/admin/deposits
// ======================================================

router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const deposits = await Deposit.find(filter).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      total: deposits.length,
      deposits,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to load deposits.",
    });
  }
});

// ======================================================
// GET SINGLE DEPOSIT
// GET /api/admin/deposits/:id
// ======================================================

router.get("/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    res.json({
      success: true,
      deposit,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to load deposit.",
    });
  }
});

// ======================================================
// APPROVE DEPOSIT
// PUT /api/admin/deposits/:id/approve
// ======================================================

router.put("/:id/approve", verifyToken, adminOnly, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const deposit = await Deposit.findById(req.params.id).session(session);

    if (!deposit) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    if (deposit.status !== "Pending") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Deposit already processed.",
      });
    }

    const user = await User.findById(deposit.userId).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.walletBalance = (user.walletBalance || 0) + deposit.amount;
    user.totalDeposit = (user.totalDeposit || 0) + deposit.amount;

    await user.save({ session });

    deposit.status = "Approved";
    deposit.approvedAt = new Date();
    deposit.approvedBy = req.user._id;
    deposit.adminNote = req.body.adminNote || "";

    await deposit.save({ session });

    await Transaction.create(
      [
        {
          username: user.username,
          type: "DEPOSIT_CREDIT",
          amount: deposit.amount,
          status: "Approved",
          description: "Admin approved deposit.",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Deposit approved successfully.",
      walletBalance: user.walletBalance,
    });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to approve deposit.",
    });
  } finally {
    session.endSession();
  }
});

// ======================================================
// REJECT DEPOSIT
// PUT /api/admin/deposits/:id/reject
// ======================================================

router.put("/:id/reject", verifyToken, adminOnly, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    if (deposit.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Deposit already processed.",
      });
    }

    deposit.status = "Rejected";
    deposit.rejectedAt = new Date();
    deposit.rejectedBy = req.user._id;
    deposit.adminNote = req.body.adminNote || "Rejected by Admin";

    await deposit.save();

    res.json({
      success: true,
      message: "Deposit rejected successfully.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to reject deposit.",
    });
  }
});

// ======================================================
// MANUAL WALLET CREDIT / DEDUCT
// POST /api/admin/deposits/wallet-update
// ======================================================

router.post("/wallet-update", verifyToken, adminOnly, async (req, res) => {
  try {
    const { username, amount, action, reason } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const value = Number(amount);

    if (action === "CREDIT") {
      user.walletBalance = (user.walletBalance || 0) + value;
    } else {
      if ((user.walletBalance || 0) < value) {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance.",
        });
      }

      user.walletBalance -= value;
    }

    await user.save();

        await Transaction.create({
      username,
      type: action,
      amount: value,
      status: "Completed",
      description: reason || "Admin wallet update",
    });

    res.json({
      success: true,
      message: `Wallet ${action.toLowerCase()} successful.`,
      walletBalance: user.walletBalance,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Wallet update failed.",
    });
  }
});

module.exports = router;