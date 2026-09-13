const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

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
// GET ALL USERS WALLET
// GET /api/admin/wallet
// Search by username
// =============================================

router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const { username } = req.query;

    const filter = {};

    if (username) {
      filter.username = {
        $regex: username,
        $options: "i",
      };
    }

    const users = await User.find(filter).select(
      "username email walletBalance usdtBalance goldBalance createdAt"
    );

    res.json({
      success: true,
      total: users.length,
      users,
    });
  } catch (err) {
    console.error("Wallet Load Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load users.",
    });
  }
});

// =============================================
// GET SINGLE USER WALLET
// GET /api/admin/wallet/:id
// =============================================

router.get("/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "username email walletBalance usdtBalance goldBalance"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to load wallet.",
    });
  }
});
// =============================================
// MANUAL WALLET UPDATE
// PUT /api/admin/wallet/:id/update
// Credit / Debit PKR, USDT & GOLD Wallet
// =============================================

router.put("/:id/update", verifyToken, adminOnly, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { walletType, action, amount, adminNote } = req.body;

    const value = Number(amount);

    if (!walletType || !action || !value || value <= 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Invalid request data.",
      });
    }

    const user = await User.findById(req.params.id).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let currentBalance = 0;
    let transactionType = "";

    // Wallet Selection
    switch (walletType) {
      case "PKR":
        currentBalance = user.walletBalance || 0;

        if (action === "credit") {
          user.walletBalance += value;
        } else {
          if (currentBalance < value) {
            await session.abortTransaction();
            return res.status(400).json({
              success: false,
              message: "Insufficient PKR balance.",
            });
          }

          user.walletBalance -= value;
        }

        transactionType = "Wallet PKR";
        break;

      case "USDT":
        currentBalance = user.usdtBalance || 0;

        if (action === "credit") {
          user.usdtBalance += value;
        } else {
          if (currentBalance < value) {
            await session.abortTransaction();
            return res.status(400).json({
              success: false,
              message: "Insufficient USDT balance.",
            });
          }

          user.usdtBalance -= value;
        }

        transactionType = "Wallet USDT";
        break;

      case "GOLD":
        currentBalance = user.goldBalance || 0;

        if (action === "credit") {
          user.goldBalance += value;
        } else {
          if (currentBalance < value) {
            await session.abortTransaction();
            return res.status(400).json({
              success: false,
              message: "Insufficient Gold balance.",
            });
          }

          user.goldBalance -= value;
        }

        transactionType = "Wallet GOLD";
        break;

      default:
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Invalid wallet type.",
        });
    }

    await user.save({ session });

    // Save Transaction History
    await Transaction.create(
      [
        {
          userId: user._id,
          username: user.username,
          type: transactionType,
          status: "Completed",
          amount: value,
          description: `Admin ${action} ${value} ${walletType}.`,
          adminNote: adminNote || "",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: `${walletType} wallet ${action} successful.`,
      balances: {
        walletBalance: user.walletBalance,
        usdtBalance: user.usdtBalance,
        goldBalance: user.goldBalance,
      },
    });
  } catch (err) {
    await session.abortTransaction();

    console.error("Wallet Update Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to update wallet.",
    });
  } finally {
    session.endSession();
  }
});

// =============================================
// WALLET TRANSACTION HISTORY
// GET /api/admin/wallet/history
// =============================================

router.get("/history", verifyToken, adminOnly, async (req, res) => {
  try {
    const { username } = req.query;

    const filter = {};

    if (username) {
      filter.username = {
        $regex: username,
        $options: "i",
      };
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      total: transactions.length,
      transactions,
    });
  } catch (err) {
    console.error("Wallet History Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load wallet history.",
    });
  }
});

// =============================================
// RECENT WALLET CHANGES
// GET /api/admin/wallet/recent
// =============================================

router.get("/recent", verifyToken, adminOnly, async (req, res) => {
  try {
    const recent = await Transaction.find({
      type: { $regex: "Wallet" },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      recent,
    });
  } catch (err) {
    console.error("Recent Wallet Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load recent wallet updates.",
    });
  }
});

// =============================================
// EXPORT ROUTER
// =============================================

module.exports = router;