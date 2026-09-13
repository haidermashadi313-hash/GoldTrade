const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Deposit = require("../models/Deposit");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const { verifyToken } = require("../middleware/authMiddleware");

// =============================================
// ADMIN ONLY MIDDLEWARE
// =============================================

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }

  next();
};

// =============================================
// GET ALL DEPOSITS
// GET /api/admin/deposits
// Supports:
// ?username=hashi
// ?status=Pending
// =============================================

router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const { username, status } = req.query;

    let filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (username) {
      filter.username = {
        $regex: username,
        $options: "i",
      };
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
    console.error("Load Deposits Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load deposits.",
    });
  }
});

// =============================================
// DEPOSIT STATS
// GET /api/admin/deposits/stats
// =============================================

router.get("/stats", verifyToken, adminOnly, async (req, res) => {
  try {
    const pending = await Deposit.countDocuments({
      status: "Pending",
    });

    const approved = await Deposit.countDocuments({
      status: "Approved",
    });

    const rejected = await Deposit.countDocuments({
      status: "Rejected",
    });

    const totalAmount = await Deposit.aggregate([
      {
        $match: {
          status: "Approved",
        },
      },
      {
        $group: {
          _id: null,
          amount: {
            $sum: "$amount",
          },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        pending,
        approved,
        rejected,
        totalAmount: totalAmount[0]?.amount || 0,
      },
    });
  } catch (err) {
    console.error("Deposit Stats Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load stats.",
    });
  }
});

// =============================================
// GET SINGLE DEPOSIT
// =============================================

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
// =============================================
// APPROVE DEPOSIT
// PUT /api/admin/deposits/:id/approve
// Wallet Credit + Transaction History
// =============================================

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

    const user = await User.findOne({
      username: deposit.username,
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Wallet Credit
    user.walletBalance = (user.walletBalance || 0) + deposit.amount;
    await user.save({ session });

    // Deposit Update
    deposit.status = "Approved";
    deposit.adminNote = req.body.adminNote || "";
    deposit.approvedBy = req.user._id;
    deposit.approvedAt = new Date();
    await deposit.save({ session });

    // Transaction History
    await Transaction.create(
      [
        {
          userId: user._id,
          username: user.username,
          type: "Deposit",
          status: "Approved",
          amount: deposit.amount,
          description: "Deposit approved by admin.",
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

    console.error("Approve Deposit Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to approve deposit.",
    });
  } finally {
    session.endSession();
  }
});

// =============================================
// REJECT DEPOSIT
// PUT /api/admin/deposits/:id/reject
// =============================================

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
    deposit.adminNote = req.body.adminNote || "";
    deposit.rejectedBy = req.user._id;
    deposit.rejectedAt = new Date();

    await deposit.save();

    res.json({
      success: true,
      message: "Deposit rejected successfully.",
    });
  } catch (err) {
    console.error("Reject Deposit Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to reject deposit.",
    });
  }
});

// =============================================
// RECENT DEPOSITS
// GET /api/admin/deposits/recent
// =============================================

router.get("/recent", verifyToken, adminOnly, async (req, res) => {
  try {
    const deposits = await Deposit.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      deposits,
    });
  } catch (err) {
    console.error("Recent Deposits Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load recent deposits.",
    });
  }
});

// =============================================
// EXPORT ROUTER
// =============================================

module.exports = router;