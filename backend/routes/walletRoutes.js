const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Transaction = require("../models/Transaction");

const {
  verifyToken,
  verifyManager,
} = require("../middleware/authMiddleware");

// ==========================================
// WALLET UPDATE FUNCTION
// ==========================================
const updateWalletHistory = async (
  user,
  walletType,
  action,
  amount,
  reason,
  updatedBy
) => {
  await Transaction.create({
    username: user.username,
    type: `${walletType} Wallet`,
    amount: Number(amount),
    method: "Admin Wallet Manager",
    transactionId: `WM${Date.now()}`,
    status: action === "credit" ? "Credit" : "Debit",
    reason: reason || "Manual Wallet Update",
    updatedBy: updatedBy || "Admin",
  });
};

// ==========================================
// PKR WALLET CREDIT / DEBIT
// PUT /api/wallets/pkr/:id
// ==========================================
router.put(
  "/pkr/:id",
  verifyToken,
  verifyManager,
  async (req, res) => {
    try {
      const { amount, action, reason, updatedBy } = req.body;

      const value = Number(amount);

      if (!value || value <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount.",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (action === "credit") {
        user.walletBalance += value;
        user.totalDeposit += value;
      } else if (action === "debit") {
        if (user.walletBalance < value) {
          return res.status(400).json({
            success: false,
            message: "Insufficient PKR wallet balance.",
          });
        }

        user.walletBalance -= value;
        user.totalWithdraw += value;
      }

      await user.save();

      await updateWalletHistory(
        user,
        "PKR",
        action,
        value,
        reason,
        updatedBy
      );

      res.json({
        success: true,
        message: `PKR Wallet ${action} successful.`,
        data: user,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ==========================================
// USDT WALLET CREDIT / DEBIT
// PUT /api/wallets/usdt/:id
// ==========================================
router.put(
  "/usdt/:id",
  verifyToken,
  verifyManager,
  async (req, res) => {
    try {
      const { amount, action, reason, updatedBy } = req.body;

      const value = Number(amount);

      if (!value || value <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount.",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (action === "credit") {
        user.usdtBalance += value;
      } else if (action === "debit") {
        if (user.usdtBalance < value) {
          return res.status(400).json({
            success: false,
            message: "Insufficient USDT balance.",
          });
        }

        user.usdtBalance -= value;
      }

      await user.save();

      await updateWalletHistory(
        user,
        "USDT",
        action,
        value,
        reason,
        updatedBy
      );

      res.json({
        success: true,
        message: `USDT Wallet ${action} successful.`,
        data: user,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);
// ==========================================
// GOLD WALLET CREDIT / DEBIT
// PUT /api/wallets/gold/:id
// ==========================================
router.put(
  "/gold/:id",
  verifyToken,
  verifyManager,
  async (req, res) => {
    try {
      const { amount, action, reason, updatedBy } = req.body;

      const grams = Number(amount);

      if (!grams || grams <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid gold amount.",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (action === "credit") {
        user.goldBalance += grams;
      } else if (action === "debit") {
        if (user.goldBalance < grams) {
          return res.status(400).json({
            success: false,
            message: "Insufficient Gold Balance.",
          });
        }

        user.goldBalance -= grams;

        if (user.goldBalance <= 0) {
          user.goldBalance = 0;
          user.goldAveragePrice = 0;
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Action must be credit or debit.",
        });
      }

      await user.save();

      await updateWalletHistory(
        user,
        "Gold",
        action,
        grams,
        reason,
        updatedBy
      );

      res.json({
        success: true,
        message: `Gold Wallet ${action} successful.`,
        data: user,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ==========================================
// GET USER WALLET HISTORY
// GET /api/wallets/history/:username
// ==========================================
router.get(
  "/history/:username",
  verifyToken,
  verifyManager,
  async (req, res) => {
    try {
      const history = await Transaction.find({
        username: req.params.username,
        method: "Admin Wallet Manager",
      }).sort({ createdAt: -1 });

      res.json({
        success: true,
        count: history.length,
        data: history,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ==========================================
// GET ALL WALLET HISTORY
// GET /api/wallets/history
// ==========================================
router.get(
  "/history",
  verifyToken,
  verifyManager,
  async (req, res) => {
    try {
      const history = await Transaction.find({
        method: "Admin Wallet Manager",
      })
        .sort({ createdAt: -1 })
        .limit(200);

      res.json({
        success: true,
        count: history.length,
        data: history,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ==========================================
// GET LIVE USER WALLET BALANCES
// GET /api/wallets/balances
// ==========================================
router.get(
  "/balances",
  verifyToken,
  verifyManager,
  async (req, res) => {
    try {
      const users = await User.find()
        .select(
          "username email role status walletBalance usdtBalance goldBalance totalDeposit totalWithdraw updatedAt"
        )
        .sort({ updatedAt: -1 });

      res.json({
        success: true,
        count: users.length,
        data: users,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ==========================================
// GET SINGLE USER WALLET
// GET /api/wallets/:username
// ==========================================
router.get(
  "/:username",
  verifyToken,
  async (req, res) => {
    try {
      const user = await User.findOne({
        username: req.params.username,
      }).select(
        "username email role status walletBalance usdtBalance goldBalance goldAveragePrice goldProfitLoss totalDeposit totalWithdraw"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // Normal user sirf apna wallet dekh sakta hai
      if (
        req.user.role === "user" &&
        req.user.username !== user.username
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  }
);

// ==========================================
// MODULE EXPORT
// ==========================================
module.exports = router;