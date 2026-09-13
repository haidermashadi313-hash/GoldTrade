const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    username: {
      type: String,
      required: true,
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    walletType: {
      type: String,
      enum: ["PKR", "USDT", "GOLD"],
      required: true,
    },

    action: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);const express = require("express");
const router = express.Router();

const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const { verifyToken } = require("../middleware/authMiddleware");

/* ================================
   ADMIN AUTH CHECK
================================ */

const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }
  next();
};

/* ================================
   GET ALL USERS FOR WALLET MANAGER
================================ */

router.get(
  "/users",
  verifyToken,
  adminOnly,
  async (req, res) => {
    try {
      const users = await User.find()
        .select(
          "username email role status walletBalance usdtBalance goldBalance"
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        users,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Unable to load users.",
      });
    }
  }
);

/* ================================
   CREDIT / DEBIT WALLET
================================ */

router.post(
  "/update",
  verifyToken,
  adminOnly,
  async (req, res) => {
    try {
      const {
        userId,
        walletType,
        action,
        amount,
        reason,
      } = req.body;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const value = Number(amount);

      if (value <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount.",
        });
      }

      let balanceField = "";

      switch (walletType) {
        case "PKR":
          balanceField = "walletBalance";
          break;

        case "USDT":
          balanceField = "usdtBalance";
          break;

        case "GOLD":
          balanceField = "goldBalance";
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Invalid wallet type.",
          });
      }

      if (action === "credit") {
        user[balanceField] += value;
      }

      if (action === "debit") {
        if (user[balanceField] < value) {
          return res.status(400).json({
            success: false,
            message: "Insufficient wallet balance.",
          });
        }

        user[balanceField] -= value;
      }

      await user.save();

      await WalletTransaction.create({
        userId: user._id,
        username: user.username,
        adminId: req.user._id,
        walletType,
        action: action.toUpperCase(),
        amount: value,
        reason,
        balanceAfter: user[balanceField],
      });

      res.json({
        success: true,
        message: `${walletType} wallet ${action} successful.`,
        balance: user[balanceField],
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Wallet update failed.",
      });
    }
  }
);

/* ================================
   WALLET TRANSACTION HISTORY
================================ */

router.get(
  "/history/:userId",
  verifyToken,
  adminOnly,
  async (req, res) => {
    try {
      const history = await WalletTransaction.find({
        userId: req.params.userId,
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        history,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Unable to fetch wallet history.",
      });
    }
  }
);

/* ================================
   ALL WALLET LOGS (ADMIN)
================================ */

router.get(
  "/logs",
  verifyToken,
  adminOnly,
  async (req, res) => {
    try {
      const logs = await WalletTransaction.find()
        .sort({ createdAt: -1 })
        .limit(200);

      res.json({
        success: true,
        logs,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Unable to load logs.",
      });
    }
  }
);

module.exports = router;