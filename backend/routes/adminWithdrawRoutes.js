// ======================================================
// GoldTrade V18 Enterprise Admin Withdraw Routes
// PART 1/4 - Imports + Router + Middleware
// ======================================================

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// ================= MODELS =================

const User = require("../models/User");
const Withdraw = require("../models/Withdraw");

// wallet history Model (Reuse existing model if already loaded)

const wallethistory =
  mongoose.models.wallethistory ||
  mongoose.model(
    "wallethistory",
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

// ================= MIDDLEWARE =================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// RESPONSE HELPERS
// ======================================================

const successResponse = (res, message, data = {}) => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message, status = 500) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

// ======================================================
// CREATE wallet history
// ======================================================

const createwallethistory = async ({
  username,
  amount,
  balanceBefore,
  balanceAfter,
  note,
  createdBy,
}) => {
  await wallethistory.create({
    username,
    type: "Withdraw",
    action: "deduct",
    amount,
    balanceBefore,
    balanceAfter,
    note,
    createdBy,
    status: "Completed",
  });
};

// ======================================================
// ALL ROUTES REQUIRE ADMIN LOGIN
// ======================================================

router.use(verifyToken);
router.use(isAdmin);

// ======================================================
// GET /api/admin/withdraws/pending
// Dashboard Pending Withdraw Requests
// ======================================================

router.get("/pending", async (req, res) => {
  try {
    const pendingWithdraws = await Withdraw.find({
      status: "Pending",
    })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(
      res,
      "Pending withdraw requests loaded successfully.",
      pendingWithdraws
    );
  } catch (err) {
    console.error("Pending Withdraw Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/admin/withdraws/all
// All Withdraw Requests
// Optional Search:
// /api/admin/withdraws/all?username=hashi
// ======================================================

router.get("/all", async (req, res) => {
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

    return successResponse(
      res,
      "Withdraw history loaded successfully.",
      withdraws
    );
  } catch (err) {
    console.error("Withdraw history Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/admin/withdraws/:id
// Single Withdraw Details
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id).lean();

    if (!withdraw) {
      return errorResponse(res, "Withdraw request not found.", 404);
    }

    return successResponse(
      res,
      "Withdraw details loaded successfully.",
      withdraw
    );
  } catch (err) {
    console.error("Withdraw Details Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// POST /api/admin/withdraws/:id/approve
// Approve Withdraw + Deduct wallet
// ======================================================

router.post("/:id/approve", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find Withdraw Request
    const withdraw = await Withdraw.findById(req.params.id).session(session);

    if (!withdraw) {
      await session.abortTransaction();
      return errorResponse(res, "Withdraw request not found.", 404);
    }

    if (withdraw.status === "Approved") {
      await session.abortTransaction();
      return errorResponse(res, "Withdraw already approved.", 400);
    }

    // Find User
    const user = await User.findOne({
      username: withdraw.username,
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return errorResponse(res, "User not found.", 404);
    }

    const balanceBefore = Number(user.walletBalance || 0);
    const withdrawAmount = Number(withdraw.requestAmount || 0);

    // Balance Check
    if (balanceBefore < withdrawAmount) {
      await session.abortTransaction();
      return errorResponse(
        res,
        "Insufficient wallet balance for withdrawal.",
        400
      );
    }

    const balanceAfter = balanceBefore - withdrawAmount;

    // Deduct wallet
    user.walletBalance = balanceAfter;

    // Update User Statistics
    user.totalWithdraw =
      Number(user.totalWithdraw || 0) + withdrawAmount;

    await user.save({ session });

    // Update Withdraw Request
    withdraw.status = "Approved";
    withdraw.approvedBy = req.user.username;
    withdraw.approvedAt = new Date();

    await withdraw.save({ session });

    // Save wallet history
    await createwallethistory({
      username: user.username,
      amount: withdrawAmount,
      balanceBefore,
      balanceAfter,
      note: `Withdraw Approved (#${withdraw._id})`,
      createdBy: req.user.username,
    });

    await session.commitTransaction();

    return successResponse(res, "Withdraw approved successfully.", {
      username: user.username,
      walletBalance: balanceAfter,
      withdrawStatus: withdraw.status,
      amount: withdrawAmount,
    });

  } catch (err) {
    await session.abortTransaction();

    console.error("Approve Withdraw Error:", err);

    return errorResponse(res, err.message);

  } finally {
    session.endSession();
  }
});

// ======================================================
// POST /api/admin/withdraws/:id/reject
// Reject Withdraw Request
// ======================================================

router.post("/:id/reject", async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return errorResponse(res, "Withdraw request not found.", 404);
    }

    if (withdraw.status !== "Pending") {
      return errorResponse(
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

    return successResponse(res, "Withdraw rejected successfully.", {
      withdrawId: withdraw._id,
      username: withdraw.username,
      status: withdraw.status,
    });
  } catch (err) {
    console.error("Reject Withdraw Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/admin/withdraws/statistics
// Withdraw Statistics for Admin Dashboard
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
          totalAmount: { $sum: "$requestAmount" },
        },
      },
    ]);

    const totalAmount =
      totalAmountResult.length > 0
        ? Number(totalAmountResult[0].totalAmount)
        : 0;

    return successResponse(
      res,
      "Withdraw statistics loaded successfully.",
      {
        totalWithdraws,
        pendingWithdraws,
        approvedWithdraws,
        rejectedWithdraws,
        totalAmount,
      }
    );
  } catch (err) {
    console.error("Withdraw Statistics Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/admin/withdraws/recent
// Latest Withdraw Requests
// ======================================================

router.get("/recent", async (req, res) => {
  try {
    const withdraws = await Withdraw.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return successResponse(
      res,
      "Recent withdraw requests loaded successfully.",
      withdraws
    );
  } catch (err) {
    console.error("Recent Withdraw Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;