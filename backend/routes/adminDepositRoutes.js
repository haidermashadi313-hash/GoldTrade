// ======================================================
// GoldTrade V18 Enterprise Admin Deposit Routes
// PART 1/4 - Imports + Router + Middleware
// ======================================================

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// ================= MODELS =================

const User = require("../models/User");
const Deposit = require("../models/Deposit");

// Wallet history model (create if not exists)
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
// CREATE WALLET HISTORY
// ======================================================

const createWalletHistory = async ({
  username,
  amount,
  balanceBefore,
  balanceAfter,
  note,
  createdBy,
}) => {
  await WalletHistory.create({
    username,
    type: "Deposit",
    action: "credit",
    amount,
    balanceBefore,
    balanceAfter,
    note,
    createdBy,
    status: "Completed",
  });
};

// ======================================================
// ALL ROUTES BELOW REQUIRE ADMIN LOGIN
// ======================================================

router.use(verifyToken);
router.use(isAdmin);

// ======================================================
// GET /api/admin/deposits/pending
// Dashboard Pending Deposits
// ======================================================

router.get("/pending", async (req, res) => {
  try {
    const pendingDeposits = await Deposit.find({
      status: "Pending",
    })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(
      res,
      "Pending deposits loaded successfully.",
      pendingDeposits
    );
  } catch (err) {
    console.error("Pending Deposit Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/admin/deposits/all
// All Deposit Requests
// Optional Search:
// /api/admin/deposits/all?username=hashi
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

    const deposits = await Deposit.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(
      res,
      "Deposit history loaded successfully.",
      deposits
    );
  } catch (err) {
    console.error("Deposit History Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/admin/deposits/:id
// Single Deposit Details
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id).lean();

    if (!deposit) {
      return errorResponse(res, "Deposit request not found.", 404);
    }

    return successResponse(
      res,
      "Deposit details loaded successfully.",
      deposit
    );
  } catch (err) {
    console.error("Deposit Details Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// POST /api/admin/deposits/:id/approve
// Approve Deposit + Credit Wallet
// ======================================================

router.post("/:id/approve", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const deposit = await Deposit.findById(req.params.id).session(session);

    if (!deposit) {
      await session.abortTransaction();
      return errorResponse(res, "Deposit request not found.", 404);
    }

    if (deposit.status === "Approved") {
      await session.abortTransaction();
      return errorResponse(res, "Deposit already approved.", 400);
    }

    const user = await User.findOne({
      username: deposit.username,
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return errorResponse(res, "User not found.", 404);
    }

    const balanceBefore = Number(user.walletBalance || 0);
    const depositAmount = Number(deposit.requestAmount || 0);

    const balanceAfter = balanceBefore + depositAmount;

    // Wallet Credit
    user.walletBalance = balanceAfter;

    // Deposit Statistics
    user.totalDeposit = Number(user.totalDeposit || 0) + depositAmount;

    await user.save({ session });

    // Deposit Status Update
    deposit.status = "Approved";
    deposit.approvedBy = req.user.username;
    deposit.approvedAt = new Date();

    await deposit.save({ session });

    // Wallet History
    await createWalletHistory({
      username: user.username,
      amount: depositAmount,
      balanceBefore,
      balanceAfter,
      note: `Deposit Approved (#${deposit._id})`,
      createdBy: req.user.username,
    });

    await session.commitTransaction();

    return successResponse(res, "Deposit approved successfully.", {
      username: user.username,
      walletBalance: balanceAfter,
      depositStatus: deposit.status,
      amount: depositAmount,
    });
  } catch (err) {
    await session.abortTransaction();

    console.error("Approve Deposit Error:", err);

    return errorResponse(res, err.message);
  } finally {
    session.endSession();
  }
});

// ======================================================
// POST /api/admin/deposits/:id/reject
// Reject Deposit Request
// ======================================================

router.post("/:id/reject", async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return errorResponse(res, "Deposit request not found.", 404);
    }

    if (deposit.status !== "Pending") {
      return errorResponse(
        res,
        `Deposit already ${deposit.status}.`,
        400
      );
    }

    deposit.status = "Rejected";
    deposit.rejectedBy = req.user.username;
    deposit.rejectedAt = new Date();

    if (req.body.note) {
      deposit.adminNote = req.body.note;
    }

    await deposit.save();

    return successResponse(res, "Deposit rejected successfully.", {
      depositId: deposit._id,
      username: deposit.username,
      status: deposit.status,
    });
  } catch (err) {
    console.error("Reject Deposit Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/admin/deposits/statistics
// Deposit Statistics for Admin Dashboard
// ======================================================

router.get("/statistics", async (req, res) => {
  try {
    const [totalDeposits, pendingDeposits, approvedDeposits, rejectedDeposits] =
      await Promise.all([
        Deposit.countDocuments(),
        Deposit.countDocuments({ status: "Pending" }),
        Deposit.countDocuments({ status: "Approved" }),
        Deposit.countDocuments({ status: "Rejected" }),
      ]);

    const totalAmountResult = await Deposit.aggregate([
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

    return successResponse(res, "Deposit statistics loaded successfully.", {
      totalDeposits,
      pendingDeposits,
      approvedDeposits,
      rejectedDeposits,
      totalAmount,
    });
  } catch (err) {
    console.error("Deposit Statistics Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/admin/deposits/recent
// Latest Deposit Requests
// ======================================================

router.get("/recent", async (req, res) => {
  try {
    const deposits = await Deposit.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return successResponse(
      res,
      "Recent deposits loaded successfully.",
      deposits
    );
  } catch (err) {
    console.error("Recent Deposits Error:", err);

    return errorResponse(res, err.message);
  }
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;