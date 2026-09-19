// ======================================================
// GoldTrade V18 Enterprise Admin Wallet Routes
// PART 1/4 - Imports + Router + Middleware
// ======================================================

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");

// Wallet history Model
const Wallethistory =
  mongoose.models.Wallethistory ||
  mongoose.model(
    "Wallethistory",
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
// CREATE Wallet history
// ======================================================

const createWallethistory = async ({
  username,
  action,
  amount,
  balanceBefore,
  balanceAfter,
  note,
  createdBy,
}) => {
  return Wallethistory.create({
    username,
    type: "Wallet",
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
// GET /api/admin/Wallet/statistics
// Wallet Analytics for Admin Dashboard
// ======================================================

router.get("/statistics", async (req, res) => {
  try {
    const users = await User.find({}, "WalletBalance totalDeposit totalWithdraw").lean();

    let totalPkrBalance = 0;
    let totalDeposits = 0;
    let totalWithdraws = 0;

    users.forEach((user) => {
      totalPkrBalance += Number(user.WalletBalance || 0);
      totalDeposits += Number(user.totalDeposit || 0);
      totalWithdraws += Number(user.totalWithdraw || 0);
    });

    const totalTransactions = await Wallethistory.countDocuments();

    const latestTransactions = await Wallethistory.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return successResponse(res, "Wallet statistics loaded successfully.", {
      totalUsers: users.length,
      totalPkrBalance,
      totalDeposits,
      totalWithdraws,
      totalTransactions,
      latestTransactions,
    });
  } catch (err) {
    console.error("Wallet Statistics Error:", err);
    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/Wallet/:username
// USER Wallet (Pkr + Usdt + GOLD)
// Requires Login Token
// ======================================================

router.get("/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username.trim();

    // Logged-in user can only access their own Wallet
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
      Wallet: {
        username: user.username,

        // Pkr Wallet
        PkrBalance: Number(user.WalletBalance || 0),

        // Usdt Wallet
        UsdtBalance: Number(user.UsdtBalance || 0),

        // Gold Wallet
        goldBalance: Number(user.goldBalance || 0),

        totalDeposit: Number(user.totalDeposit || 0),
        totalWithdraw: Number(user.totalWithdraw || 0),

        email: user.email || "",
        role: user.role || "user",
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("Wallet Load Error:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load Wallet.",
      error: err.message,
    });
  }
});
// ======================================================
// GET /api/admin/Wallet/users/search?username=ha
// Search Users (Optional)
// ======================================================

router.get("/users/search", async (req, res) => {
  try {
    const keyword = req.query.username || "";

    const users = await User.find({
      username: { $regex: keyword, $options: "i" },
    })
      .select("username WalletBalance role")
      .limit(20)
      .lean();

    return successResponse(res, "Users loaded successfully.", users);
  } catch (err) {
    console.error("Wallet Search Error:", err);
    return errorResponse(res, err.message);
  }
});

// ======================================================
// POST /api/admin/Wallet/update
// Manual Credit / Deduct Wallet
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

    const WalletAmount = Number(amount);

    if (WalletAmount <= 0 || Number.isNaN(WalletAmount)) {
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

    const balanceBefore = Number(user.WalletBalance || 0);
    let balanceAfter = balanceBefore;

    // ================= CREDIT =================

    if (action === "credit") {
      balanceAfter = balanceBefore + WalletAmount;
    }

    // ================= DEDUCT =================

    if (action === "deduct") {
      if (balanceBefore < WalletAmount) {
        await session.abortTransaction();

        return errorResponse(
          res,
          "Insufficient Wallet balance.",
          400
        );
      }

      balanceAfter = balanceBefore - WalletAmount;
    }

    // ================= UPDATE Wallet =================

    user.WalletBalance = balanceAfter;

    await user.save({ session });

    // ================= SAVE history =================

    await createWallethistory({
      username: user.username,
      action,
      amount: WalletAmount,
      balanceBefore,
      balanceAfter,
      note:
        note ||
        `Manual Wallet ${action} by admin.`,
      createdBy: req.user.username,
    });

    await session.commitTransaction();

    return successResponse(
      res,
      `Wallet ${action} successful.`,
      {
        username: user.username,
        WalletBalance: balanceAfter,
        amount: WalletAmount,
        action,
        balanceBefore,
        balanceAfter,
      }
    );

  } catch (err) {
    await session.abortTransaction();

    console.error("Wallet Update Error:", err);

    return errorResponse(res, err.message);

  } finally {
    session.endSession();
  }
});

// ======================================================
// GET /api/admin/Wallet/all
// Wallet Manager User List (FINAL V18)
// ======================================================

router.get("/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "username email role status WalletBalance goldBalance UsdtBalance totalDeposit totalWithdraw createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    const Wallets = users.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
      status: user.status || "Active",

      // Wallets
      PkrBalance: Number(user.WalletBalance || 0),
      goldBalance: Number(user.goldBalance || 0),
      UsdtBalance: Number(user.UsdtBalance || 0),

      // Totals
      totalDeposit: Number(user.totalDeposit || 0),
      totalWithdraw: Number(user.totalWithdraw || 0),

      createdAt: user.createdAt,
    }));

    return res.status(200).json({
      success: true,
      Wallets,
      stats: {
        totalUsers: Wallets.length,
        totalPkr: Wallets.reduce((sum, u) => sum + u.PkrBalance, 0),
        totalGold: Wallets.reduce((sum, u) => sum + u.goldBalance, 0),
        totalUsdt: Wallets.reduce((sum, u) => sum + u.UsdtBalance, 0),
      },
    });
  } catch (err) {
    console.error("ADMIN Wallet ALL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load Wallet users.",
    });
  }
});

// ======================================================
// GET /api/admin/Wallet/history/:username
// Wallet history of Single User
// ======================================================

router.get("/history/:username", async (req, res) => {
  try {
    const username = req.params.username.trim();

    const history = await Wallethistory.find({ username })
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(
      res,
      "User Wallet history loaded successfully.",
      history
    );
  } catch (err) {
    console.error("User Wallet history Error:", err);
    return errorResponse(res, err.message);
  }
});

// ======================================================
// DELETE /api/admin/Wallet/history/:id
// Delete Wallet history Record (Admin Only)
// ======================================================

router.delete("/history/:id", async (req, res) => {
  try {
    const history = await Wallethistory.findById(req.params.id);

    if (!history) {
      return errorResponse(
        res,
        "Wallet history record not found.",
        404
      );
    }

    await Wallethistory.findByIdAndDelete(req.params.id);

    return successResponse(
      res,
      "Wallet history deleted successfully."
    );
  } catch (err) {
    console.error("Delete Wallet history Error:", err);
    return errorResponse(res, err.message);
  }
});

// ======================================================
// GET /api/admin/Wallet/summary
// Dashboard Wallet Summary
// ======================================================

router.get("/summary", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "WalletBalance totalDeposit totalWithdraw"
    ).lean();

    let totalWalletBalance = 0;
    let totalDeposits = 0;
    let totalWithdraws = 0;

    users.forEach((user) => {
      totalWalletBalance += Number(user.WalletBalance || 0);
      totalDeposits += Number(user.totalDeposit || 0);
      totalWithdraws += Number(user.totalWithdraw || 0);
    });

    const totalTransactions = await Wallethistory.countDocuments();

    return successResponse(
      res,
      "Wallet summary loaded successfully.",
      {
        totalUsers: users.length,
        totalWalletBalance,
        totalDeposits,
        totalWithdraws,
        totalTransactions,
      }
    );
  } catch (err) {
    console.error("Wallet Summary Error:", err);
    return errorResponse(res, err.message);
  }
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;