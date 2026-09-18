// ======================================================
// GoldTrade V18 Enterprise Admin wallet Routes
// PART 1/4 - Imports + Router + Middleware
// ======================================================

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");

// wallet history Model
const wallethistory =
  mongoose.models.wallethistory ||
  mongoose.model(
    "wallethistory",
    new mongoose.Schema(
      {
        username: {
          type: String,
          required: true,
        },

        type: {
          type: String,
          required: true,
        },

        action: {
          type: String,
          enum: ["credit", "deduct"],
          required: true,
        },

        amount: {
          type: Number,
          required: true,
        },

        balanceBefore: Number,
        balanceAfter: Number,

        note: String,

        createdBy: String,

        status: {
          type: String,
          default: "Completed",
        },
      },
      {
        timestamps: true,
      }
    )
  );

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

router.use(verifyToken);
router.use(isAdmin);

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
  action,
  amount,
  balanceBefore,
  balanceAfter,
  note,
  createdBy,
}) => {
  return wallethistory.create({
    username,
    type: "wallet",
    action,
    amount,
    balanceBefore,
    balanceAfter,
    note,
    createdBy,
    status: "Completed",
  });
};

// ======================================================
// GET /api/admin/wallet/statistics
// wallet Analytics for Admin Dashboard
// ======================================================

router.get("/statistics", async (req, res) => {
  try {
    const users = await User.find({}, "walletBalance totalDeposit totalWithdraw").lean();

    let totalPkrBalance = 0;
    let totalDeposits = 0;
    let totalWithdraws = 0;

    users.forEach((user) => {
      totalPkrBalance += Number(user.walletBalance || 0);
      totalDeposits += Number(user.totalDeposit || 0);
      totalWithdraws += Number(user.totalWithdraw || 0);
    });

    const totalTransactions = await wallethistory.countDocuments();

    const latestTransactions = await wallethistory.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return successResponse(res, "wallet statistics loaded successfully.", {
      totalUsers: users.length,
      totalPkrBalance,
      totalDeposits,
      totalWithdraws,
      totalTransactions,
      latestTransactions,
    });
  } catch (err) {
    console.error("wallet Statistics Error:", err);
    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/wallet/:username
// USER wallet (Pkr + Usdt + GOLD)
// Requires Login Token
// ======================================================

router.get("/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username.trim();

    // Logged-in user can only access their own wallet
    if (req.user.username !== username && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    const user = await User.findOne({ username }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      wallet: {
        username: user.username,

        // Pkr wallet
        PkrBalance: Number(user.walletBalance || 0),

        // Usdt wallet
        UsdtBalance: Number(user.UsdtBalance || 0),

        // Gold wallet
        goldBalance: Number(user.goldBalance || 0),

        totalDeposit: Number(user.totalDeposit || 0),
        totalWithdraw: Number(user.totalWithdraw || 0),

        email: user.email || "",
        role: user.role || "user",
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("wallet Load Error:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet.",
      error: err.message,
    });
  }
});
// ======================================================
// GET /api/admin/wallet/users/search?username=ha
// Search Users (Optional)
// ======================================================

router.get("/users/search", async (req, res) => {
  try {
    const keyword = req.query.username || "";

    const users = await User.find({
      username: { $regex: keyword, $options: "i" },
    })
      .select("username walletBalance role")
      .limit(20)
      .lean();

    return successResponse(res, "Users loaded successfully.", users);
  } catch (err) {
    console.error("wallet Search Error:", err);
    return errorResponse(res, err.message);
  }
});

// ======================================================
// POST /api/admin/wallet/update
// Manual Credit / Deduct wallet
// ======================================================

router.post("/update", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { username, amount, action, note } = req.body;

    // ================= VALIDATION =================

    if (!username || !amount || !action) {
      await session.abortTransaction();
      return errorResponse(
        res,
        "Username, amount and action are required.",
        400
      );
    }

    if (!["credit", "deduct"].includes(action)) {
      await session.abortTransaction();
      return errorResponse(
        res,
        "Action must be credit or deduct.",
        400
      );
    }

    const walletAmount = Number(amount);

    if (walletAmount <= 0 || Number.isNaN(walletAmount)) {
      await session.abortTransaction();
      return errorResponse(
        res,
        "Amount must be greater than zero.",
        400
      );
    }

    // ================= FIND USER =================

    const user = await User.findOne({
      username: username.trim(),
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return errorResponse(res, "User not found.", 404);
    }

    const balanceBefore = Number(user.walletBalance || 0);
    let balanceAfter = balanceBefore;

    // ================= CREDIT =================

    if (action === "credit") {
      balanceAfter = balanceBefore + walletAmount;
    }

    // ================= DEDUCT =================

    if (action === "deduct") {
      if (balanceBefore < walletAmount) {
        await session.abortTransaction();

        return errorResponse(
          res,
          "Insufficient wallet balance.",
          400
        );
      }

      balanceAfter = balanceBefore - walletAmount;
    }

    // ================= UPDATE wallet =================

    user.walletBalance = balanceAfter;

    await user.save({ session });

    // ================= SAVE history =================

    await createwallethistory({
      username: user.username,
      action,
      amount: walletAmount,
      balanceBefore,
      balanceAfter,
      note:
        note ||
        `Manual wallet ${action} by admin.`,
      createdBy: req.user.username,
    });

    await session.commitTransaction();

    return successResponse(
      res,
      `wallet ${action} successful.`,
      {
        username: user.username,
        walletBalance: balanceAfter,
        amount: walletAmount,
        action,
        balanceBefore,
        balanceAfter,
      }
    );

  } catch (err) {
    await session.abortTransaction();

    console.error("wallet Update Error:", err);

    return errorResponse(res, err.message);

  } finally {
    session.endSession();
  }
});

// ======================================================
// GET /api/admin/wallet/all
// wallet Manager User List (FINAL V18)
// ======================================================

router.get("/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "username email role status walletBalance goldBalance UsdtBalance totalDeposit totalWithdraw createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const wallets = users.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
      status: user.status || "Active",

      // wallets
      PkrBalance: Number(user.walletBalance || 0),
      goldBalance: Number(user.goldBalance || 0),
      UsdtBalance: Number(user.UsdtBalance || 0),

      // Totals
      totalDeposit: Number(user.totalDeposit || 0),
      totalWithdraw: Number(user.totalWithdraw || 0),

      createdAt: user.createdAt,
    }));

    return res.status(200).json({
      success: true,
      wallets,
      stats: {
        totalUsers: wallets.length,
        totalPkr: wallets.reduce((sum, u) => sum + u.PkrBalance, 0),
        totalGold: wallets.reduce((sum, u) => sum + u.goldBalance, 0),
        totalUsdt: wallets.reduce((sum, u) => sum + u.UsdtBalance, 0),
      },
    });
  } catch (err) {
    console.error("ADMIN wallet ALL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet users.",
    });
  }
});

// ======================================================
// GET /api/admin/wallet/history/:username
// wallet history of Single User
// ======================================================

router.get("/history/:username", async (req, res) => {
  try {
    const username = req.params.username.trim();

    const history = await wallethistory.find({ username })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(
      res,
      "User wallet history loaded successfully.",
      history
    );
  } catch (err) {
    console.error("User wallet history Error:", err);
    return errorResponse(res, err.message);
  }
});

// ======================================================
// DELETE /api/admin/wallet/history/:id
// Delete wallet history Record (Admin Only)
// ======================================================

router.delete("/history/:id", async (req, res) => {
  try {
    const history = await wallethistory.findById(req.params.id);

    if (!history) {
      return errorResponse(
        res,
        "wallet history record not found.",
        404
      );
    }

    await wallethistory.findByIdAndDelete(req.params.id);

    return successResponse(
      res,
      "wallet history deleted successfully."
    );
  } catch (err) {
    console.error("Delete wallet history Error:", err);
    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/admin/wallet/summary
// Dashboard wallet Summary
// ======================================================

router.get("/summary", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "walletBalance totalDeposit totalWithdraw"
    ).lean();

    let totalwalletBalance = 0;
    let totalDeposits = 0;
    let totalWithdraws = 0;

    users.forEach((user) => {
      totalwalletBalance += Number(user.walletBalance || 0);
      totalDeposits += Number(user.totalDeposit || 0);
      totalWithdraws += Number(user.totalWithdraw || 0);
    });

    const totalTransactions = await wallethistory.countDocuments();

    return successResponse(
      res,
      "wallet summary loaded successfully.",
      {
        totalUsers: users.length,
        totalwalletBalance,
        totalDeposits,
        totalWithdraws,
        totalTransactions,
      }
    );
  } catch (err) {
    console.error("wallet Summary Error:", err);
    return errorResponse(res, err.message);
  }
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;