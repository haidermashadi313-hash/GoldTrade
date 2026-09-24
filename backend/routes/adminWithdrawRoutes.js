// ======================================================
// GoldTrade V18 Enterprise
// Admin Withdraw Routes (PART 1/2)
// ======================================================

"use strict";

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");
const Withdraw = require("../models/Withdraw");

// ======================================================
// WALLET HISTORY MODEL
// ======================================================

const WalletHistory =
  mongoose.models.WalletHistory ||
  mongoose.model(
    "WalletHistory",
    new mongoose.Schema(
      {
        username: String,
        type: String,
        action: String,
        amount: Number,
        balanceBefore: Number,
        balanceAfter: Number,
        note: String,
        status: {
          type: String,
          default: "Completed",
        },
        createdBy: String,
      },
      { timestamps: true }
    )
  );

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// ADMIN AUTH
// ======================================================

router.use(verifyToken);
router.use(isAdmin);

// ======================================================
// HELPERS
// ======================================================

const success = (res, message, extra = {}) =>
  res.status(200).json({
    success: true,
    message,
    ...extra,
  });

const failure = (res, message, status = 500) =>
  res.status(status).json({
    success: false,
    message,
  });

// ======================================================
// SAVE WALLET HISTORY
// ======================================================

const saveWalletHistory = async ({
  username,
  amount,
  balanceBefore,
  balanceAfter,
  note,
  createdBy,
}) => {
  await WalletHistory.create({
    username,
    type: "Withdraw",
    action: "Debit",
    amount,
    balanceBefore,
    balanceAfter,
    note,
    createdBy,
    status: "Completed",
  });
};

// ======================================================
// GET ALL WITHDRAW REQUESTS
// GET /api/admin/withdraws
// ======================================================

router.get("/", async (req, res) => {
  try {
    const filter = {};

    if (req.query.username) {
      filter.username = new RegExp(req.query.username, "i");
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const withdraws = await Withdraw.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return success(res, "Withdraw requests loaded successfully.", {
      withdraws,
    });
  } catch (error) {
    console.error("GET WITHDRAW ERROR:", error);

    return failure(res, error.message);
  }
});

// ======================================================
// GET PENDING WITHDRAW REQUESTS
// GET /api/admin/withdraws/pending
// ======================================================

router.get("/pending", async (req, res) => {
  try {
    const withdraws = await Withdraw.find({
      status: "Pending",
    })
      .sort({ createdAt: -1 })
      .lean();

    return success(res, "Pending withdraw requests loaded successfully.", {
      withdraws,
    });
  } catch (error) {
    console.error("PENDING WITHDRAW ERROR:", error);

    return failure(res, error.message);
  }
});

// ======================================================
// GET SINGLE WITHDRAW REQUEST
// GET /api/admin/withdraws/:id
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id).lean();

    if (!withdraw) {
      return failure(res, "Withdraw request not found.", 404);
    }

    return success(res, "Withdraw details loaded successfully.", {
      withdraw,
    });
  } catch (error) {
    console.error("WITHDRAW DETAILS ERROR:", error);

    return failure(res, error.message);
  }
});
// ======================================================
// APPROVE WITHDRAW
// PUT /api/admin/withdraws/:id/approve
// ======================================================

router.put("/:id/approve", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const withdraw = await Withdraw.findById(req.params.id).session(session);

    if (!withdraw) {
      await session.abortTransaction();
      return failure(res, "Withdraw request not found.", 404);
    }

    if (withdraw.status !== "Pending") {
      await session.abortTransaction();
      return failure(res, `Withdraw already ${withdraw.status}.`, 400);
    }

    const user = await User.findOne({
      username: withdraw.username,
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return failure(res, "User not found.", 404);
    }

    // GoldTrade V18 Wallet Balance
    const balanceBefore = Number(user.pkrBalance || 0);

    const amount =
      Number(withdraw.amount || withdraw.requestAmount || 0);

    if (balanceBefore < amount) {
      await session.abortTransaction();
      return failure(res, "Insufficient wallet balance.", 400);
    }

    const balanceAfter = balanceBefore - amount;

    // Deduct PKR Wallet
    user.pkrBalance = balanceAfter;

    user.totalWithdraw =
      Number(user.totalWithdraw || 0) + amount;

    await user.save({ session });

    // Update Withdraw Request
    withdraw.status = "Approved";
    withdraw.approvedBy = req.user.username;
    withdraw.approvedAt = new Date();

    await withdraw.save({ session });

    // Wallet History
    await saveWalletHistory({
      username: user.username,
      amount,
      balanceBefore,
      balanceAfter,
      note: `Withdraw Approved (#${withdraw._id})`,
      createdBy: req.user.username,
    });

    await session.commitTransaction();

    return success(res, "Withdraw approved successfully.", {
      withdraw,
      walletBalance: balanceAfter,
    });

  } catch (error) {
    await session.abortTransaction();

    console.error("APPROVE WITHDRAW ERROR:", error);

    return failure(res, error.message);

  } finally {
    session.endSession();
  }
});

// ======================================================
// REJECT WITHDRAW
// PUT /api/admin/withdraws/:id/reject
// ======================================================

router.put("/:id/reject", async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return failure(res, "Withdraw request not found.", 404);
    }

    if (withdraw.status !== "Pending") {
      return failure(
        res,
        `Withdraw already ${withdraw.status}.`,
        400
      );
    }

    withdraw.status = "Rejected";
    withdraw.rejectedBy = req.user.username;
    withdraw.rejectedAt = new Date();

    if (req.body.note) {
      withdraw.adminNote = req.body.note;
    }

    await withdraw.save();

    return success(res, "Withdraw rejected successfully.", {
      withdraw,
    });

  } catch (error) {
    console.error("REJECT WITHDRAW ERROR:", error);

    return failure(res, error.message);
  }
});

// ======================================================
// WITHDRAW STATISTICS
// GET /api/admin/withdraws/statistics
// ======================================================

router.get("/statistics", async (req, res) => {
  try {
    const [
      totalWithdraws,
      pendingWithdraws,
      approvedWithdraws,
      rejectedWithdraws,
    ] = await Promise.all([
      Withdraw.countDocuments(),
      Withdraw.countDocuments({ status: "Pending" }),
      Withdraw.countDocuments({ status: "Approved" }),
      Withdraw.countDocuments({ status: "Rejected" }),
    ]);

    const totalAmountResult = await Withdraw.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: null,
          totalAmount: {
            $sum: {
              $ifNull: ["$amount", "$requestAmount"],
            },
          },
        },
      },
    ]);

    const totalAmount =
      totalAmountResult.length > 0
        ? Number(totalAmountResult[0].totalAmount)
        : 0;

    return success(res, "Withdraw statistics loaded successfully.", {
      statistics: {
        totalWithdraws,
        pendingWithdraws,
        approvedWithdraws,
        rejectedWithdraws,
        totalAmount,
      },
    });

  } catch (error) {
    console.error("WITHDRAW STATISTICS ERROR:", error);

    return failure(res, error.message);
  }
});

// ======================================================
// RECENT WITHDRAW REQUESTS
// GET /api/admin/withdraws/recent
// ======================================================

router.get("/recent", async (req, res) => {
  try {
    const withdraws = await Withdraw.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return success(res, "Recent withdraw requests loaded successfully.", {
      withdraws,
    });

  } catch (error) {
    console.error("RECENT WITHDRAW ERROR:", error);

    return failure(res, error.message);
  }
});

// ======================================================
// HEALTH CHECK
// GET /api/admin/withdraws/health
// ======================================================

router.get("/health", (req, res) => {
  return success(res, "Withdraw module is working.", {
    version: "GoldTrade V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;