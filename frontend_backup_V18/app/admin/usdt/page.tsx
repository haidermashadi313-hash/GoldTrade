const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const Withdraw = require("../models/Withdraw");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const { verifyToken } = require("../middleware/authMiddleware");

// =============================================
// ADMIN ONLY MIDDLEWARE
// =============================================

const adminOnly = (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }
  next();
};

// =============================================
// GET ALL WITHDRAW REQUESTS
// GET /api/gold/admin/withdraw
// =============================================

router.get("/", verifyToken, adminOnly, async (req: any, res: any) => {
  try {
    const { username, status } = req.query;

    const filter: Record<string, any> = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (username) {
      filter.username = {
        $regex: username,
        $options: "i",
      };
    }

    const withdraws = await Withdraw.find(filter).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      total: withdraws.length,
      withdraws,
    });
  } catch (err) {
    console.error("Load Withdraw Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load withdraw requests.",
    });
  }
});

// =============================================
// WITHDRAW STATS
// GET /api/gold/admin/withdraw/stats
// =============================================

router.get("/stats", verifyToken, adminOnly, async (_req: any, res: any) => {
  try {
    const pending = await Withdraw.countDocuments({
      status: "Pending",
    });

    const approved = await Withdraw.countDocuments({
      status: "Approved",
    });

    const rejected = await Withdraw.countDocuments({
      status: "Rejected",
    });

    const totalAmount = await Withdraw.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: null,
          amount: { $sum: "$amount" },
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
    console.error("Withdraw Stats Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load withdraw stats.",
    });
  }
});

// =============================================
// APPROVE WITHDRAW
// PUT /api/gold/admin/withdraw/:id/approve
// Deduct Wallet Balance
// =============================================

router.put("/:id/approve", verifyToken, adminOnly, async (req: any, res: any) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const withdraw = await Withdraw.findById(req.params.id).session(session);

    if (!withdraw) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.status !== "Pending") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Withdraw already processed.",
      });
    }

    const user = await User.findOne({
      username: withdraw.username,
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if ((user.walletBalance || 0) < withdraw.amount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    // Deduct Wallet
    user.walletBalance -= withdraw.amount;
    await user.save({ session });

    // Update Withdraw Status
    withdraw.status = "Approved";
    withdraw.adminNote = req.body.adminNote || "";
    withdraw.approvedBy = req.user._id;
    withdraw.approvedAt = new Date();

    await withdraw.save({ session });

    // Transaction History
    await Transaction.create(
      [
        {
          userId: user._id,
          username: user.username,
          type: "Withdraw",
          status: "Approved",
          amount: withdraw.amount,
          description: "Withdraw approved by admin.",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Withdraw approved successfully.",
      walletBalance: user.walletBalance,
    });
  } catch (err) {
    await session.abortTransaction();

    console.error("Approve Withdraw Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to approve withdraw request.",
    });
  } finally {
    session.endSession();
  }
});

// =============================================
// REJECT WITHDRAW
// PUT /api/gold/admin/withdraw/:id/reject
// =============================================

router.put("/:id/reject", verifyToken, adminOnly, async (req: any, res: any) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Withdraw already processed.",
      });
    }

    withdraw.status = "Rejected";
    withdraw.adminNote = req.body.adminNote || "";
    withdraw.rejectedBy = req.user._id;
    withdraw.rejectedAt = new Date();

    await withdraw.save();

    res.json({
      success: true,
      message: "Withdraw rejected successfully.",
    });
  } catch (err) {
    console.error("Reject Withdraw Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to reject withdraw request.",
    });
  }
});

// =============================================
// RECENT WITHDRAW REQUESTS
// GET /api/gold/admin/withdraw/recent
// =============================================

router.get("/recent", verifyToken, adminOnly, async (req: any, res: any) => {
  try {
    const withdraws = await Withdraw.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      withdraws,
    });
  } catch (err) {
    console.error("Recent Withdraw Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load recent withdraw requests.",
    });
  }
});

module.exports = router;