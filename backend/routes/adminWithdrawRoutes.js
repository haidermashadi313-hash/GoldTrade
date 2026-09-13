const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Withdraw = require("../models/Withdraw");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { verifyToken } = require("../middleware/authMiddleware");

/* ===========================================
   ADMIN MIDDLEWARE
=========================================== */

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }
  next();
};

/* ===========================================
   GET ALL WITHDRAW REQUESTS
   GET /api/admin/withdraw
=========================================== */

router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
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
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to load withdraw requests.",
    });
  }
});

/* ===========================================
   APPROVE WITHDRAW
   PUT /api/admin/withdraw/:id/approve
=========================================== */

router.put("/:id/approve", verifyToken, adminOnly, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const withdraw = await Withdraw.findById(req.params.id).session(session);

    if (!withdraw) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.status !== "Pending") {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Withdraw already processed.",
      });
    }

    const user = await User.findById(withdraw.userId).session(session);

    if (!user) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if ((user.walletBalance || 0) < withdraw.amount) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "User wallet balance is insufficient.",
      });
    }

    // Wallet Deduct
    user.walletBalance -= withdraw.amount;
    user.totalWithdraw = (user.totalWithdraw || 0) + withdraw.amount;

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
          username: user.username,
          type: "WITHDRAW",
          amount: withdraw.amount,
          status: "Approved",
          description: "Withdraw approved by admin.",
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Withdraw approved successfully.",
      walletBalance: user.walletBalance,
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to approve withdraw.",
    });
  }
});

/* ===========================================
   REJECT WITHDRAW
   PUT /api/admin/withdraw/:id/reject
=========================================== */

router.put("/:id/reject", verifyToken, adminOnly, async (req, res) => {
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
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to reject withdraw.",
    });
  }
});

/* ===========================================
   WITHDRAW DASHBOARD STATS
   GET /api/admin/withdraw/stats
=========================================== */

router.get("/stats", verifyToken, adminOnly, async (req, res) => {
  try {
    const pending = await Withdraw.countDocuments({ status: "Pending" });
    const approved = await Withdraw.countDocuments({ status: "Approved" });
    const rejected = await Withdraw.countDocuments({ status: "Rejected" });

    const totalAmount = await Withdraw.aggregate([
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
      message: "Unable to load withdraw stats.",
    });
  }
});

module.exports = router;