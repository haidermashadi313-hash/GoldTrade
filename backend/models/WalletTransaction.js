const express = require("express");
const router = express.Router();

const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const { verifyToken } = require("../middleware/authMiddleware");

/* ==========================================
   ADMIN ONLY MIDDLEWARE
========================================== */

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }

  next();
};

/* ==========================================
   GET ALL USERS FOR WALLET MANAGER
========================================== */

router.get(
  "/users",
  verifyToken,
  adminOnly,
  async (req, res) => {
    try {
      const users = await User.find()
        .select(
          "username email role status walletBalance usdtBalance goldBalance createdAt"
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        users,
      });
    } catch (err) {
      console.error("LOAD USERS ERROR:", err);

      res.status(500).json({
        success: false,
        message: "Unable to load users.",
      });
    }
  }
);

/* ==========================================
   CREDIT / DEBIT WALLET
========================================== */

router.post(
  "/update",
  verifyToken,
  adminOnly,
  async (req, res) => {
    try {
      let {
        userId,
        walletType,
        action,
        amount,
        reason,
      } = req.body;

      walletType = String(walletType).toUpperCase();
      action = String(action).toUpperCase();

      const value = Number(amount);

      if (!reason || reason.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Reason is required.",
        });
      }

      if (isNaN(value) || value <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount.",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      let balanceField;

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

      const beforeBalance = Number(user[balanceField] || 0);

      if (action === "CREDIT") {
        user[balanceField] = beforeBalance + value;
      }

      if (action === "DEBIT") {
        if (beforeBalance < value) {
          return res.status(400).json({
            success: false,
            message: "Insufficient wallet balance.",
          });
        }

        user[balanceField] = beforeBalance - value;
      }

      const afterBalance = Number(user[balanceField]);

      await user.save();

      await WalletTransaction.create({
        userId: user._id,
        username: user.username,
        adminId: req.user._id,
        walletType,
        action,
        amount: value,
        reason,
        balanceBefore: beforeBalance,
        balanceAfter: afterBalance,
      });

      res.json({
        success: true,
        message: `${walletType} wallet ${action.toLowerCase()} successful.`,
        balance: afterBalance,
        user: user.username,
      });
    } catch (err) {
      console.error("WALLET UPDATE ERROR:", err);

      res.status(500).json({
        success: false,
        message: "Wallet update failed.",
      });
    }
  }
);

/* ==========================================
   WALLET HISTORY OF USER
========================================== */

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
      console.error("HISTORY ERROR:", err);

      res.status(500).json({
        success: false,
        message: "Unable to fetch wallet history.",
      });
    }
  }
);

/* ==========================================
   ALL WALLET LOGS
========================================== */

router.get(
  "/logs",
  verifyToken,
  adminOnly,
  async (req, res) => {
    try {
      const logs = await WalletTransaction.find()
        .populate("adminId", "username")
        .sort({ createdAt: -1 })
        .limit(500);

      res.json({
        success: true,
        logs,
      });
    } catch (err) {
      console.error("LOG ERROR:", err);

      res.status(500).json({
        success: false,
        message: "Unable to load wallet logs.",
      });
    }
  }
);

module.exports = router;