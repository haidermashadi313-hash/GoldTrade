const express = require("express");
const router = express.Router();

const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// GET ALL WALLET USERS
// GET /api/admin/wallet/users
// =====================================================

router.get(
  "/users",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const users = await User.find({})
        .select(
          "username fullName email pkrBalance goldBalance usdtBalance walletFrozen createdAt"
        )
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error("Wallet Users Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load wallet users.",
      });
    }
  }
);

// =====================================================
// WALLET SUMMARY STATS
// GET /api/admin/wallet/stats
// =====================================================

router.get(
  "/stats",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const users = await User.find({});

      let totalPKR = 0;
      let totalGold = 0;
      let totalUSDT = 0;

      let activeWallets = 0;
      let frozenWallets = 0;

      users.forEach((user) => {
        totalPKR += Number(user.pkrBalance || 0);
        totalGold += Number(user.goldBalance || 0);
        totalUSDT += Number(user.usdtBalance || 0);

        if (user.walletFrozen) {
          frozenWallets++;
        } else {
          activeWallets++;
        }
      });

      res.json({
        success: true,

        totalUsers: users.length,
        activeWallets,
        frozenWallets,

        totalPKR,
        totalGold,
        totalUSDT,
      });
    } catch (error) {
      console.error("Wallet Stats Error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to load wallet statistics.",
      });
    }
  }
);// =====================================================
// FREEZE / UNFREEZE USER WALLET
// POST /api/admin/wallet/freeze
// =====================================================

router.post(
  "/freeze",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { username, freeze, reason } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          message: "Username is required.",
        });
      }

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // Update wallet status
      user.walletFrozen = Boolean(freeze);
      await user.save();

      // Create audit transaction (optional but recommended)
      await WalletTransaction.create({
        username: user.username,
        walletType: "SYSTEM",
        transactionType: freeze ? "WALLET_FREEZE" : "WALLET_UNFREEZE",
        amount: 0,
        status: "Completed",
        note:
          reason && reason.trim() !== ""
            ? reason.trim()
            : freeze
            ? "Wallet frozen by admin."
            : "Wallet unfrozen by admin.",
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: freeze
          ? "Wallet frozen successfully."
          : "Wallet unfrozen successfully.",
        walletFrozen: user.walletFrozen,
      });

    } catch (error) {
      console.error("Freeze Wallet Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update wallet status.",
      });
    }
  }
);

// =====================================================
// GET SINGLE USER WALLET
// GET /api/admin/wallet/user/:username
// =====================================================

router.get(
  "/user/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const user = await User.findOne({
        username: req.params.username,
      }).select(
        "username fullName email pkrBalance goldBalance usdtBalance walletFrozen createdAt"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.json({
        success: true,
        user,
      });

    } catch (error) {
      console.error("Get Wallet User Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load wallet user.",
      });
    }
  }
);// =====================================================
// MANUAL CREDIT / DEBIT WALLET
// POST /api/admin/wallet/manual-transaction
// =====================================================

router.post(
  "/manual-transaction",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const {
        username,
        walletType,
        transactionType,
        amount,
        note,
      } = req.body;

      // ===============================
      // Validation
      // ===============================

      if (!username || !walletType || !transactionType) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields.",
        });
      }

      const numericAmount = Number(amount);

      if (!numericAmount || numericAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount.",
        });
      }

      const wallet = walletType.toUpperCase();

      if (!["PKR", "GOLD", "USDT"].includes(wallet)) {
        return res.status(400).json({
          success: false,
          message: "Invalid wallet type.",
        });
      }

      if (!["credit", "debit"].includes(transactionType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid transaction type.",
        });
      }

      // ===============================
      // Find User
      // ===============================

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (user.walletFrozen) {
        return res.status(403).json({
          success: false,
          message: "Wallet is frozen.",
        });
      }

      // ===============================
      // Select Balance Field
      // ===============================

      let balanceField = "";

      switch (wallet) {
        case "PKR":
          balanceField = "pkrBalance";
          break;

        case "GOLD":
          balanceField = "goldBalance";
          break;

        case "USDT":
          balanceField = "usdtBalance";
          break;
      }

      let currentBalance = Number(user[balanceField] || 0);

      // ===============================
      // Credit / Debit Logic
      // ===============================

      if (transactionType === "credit") {
        currentBalance += numericAmount;
      } else {
        if (currentBalance < numericAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient wallet balance.",
          });
        }

        currentBalance -= numericAmount;
      }

      user[balanceField] = currentBalance;

      await user.save();

      // ===============================
      // Save Transaction History
      // ===============================

      await WalletTransaction.create({
        username: user.username,
        walletType: wallet,
        transactionType:
          transactionType === "credit"
            ? "ADMIN_CREDIT"
            : "ADMIN_DEBIT",

        amount: numericAmount,

        status: "Completed",

        note:
          note && note.trim() !== ""
            ? note.trim()
            : transactionType === "credit"
            ? "Wallet credited by admin."
            : "Wallet debited by admin.",

        createdBy: req.user.username,
      });

      // ===============================
      // Success Response
      // ===============================

      return res.json({
        success: true,
        message:
          transactionType === "credit"
            ? "Wallet credited successfully."
            : "Wallet debited successfully.",

        walletType: wallet,

        newBalance: currentBalance,
      });

    } catch (error) {
      console.error("Manual Wallet Transaction Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to process wallet transaction.",
      });
    }
  }
);

// =====================================================
// GET USER WALLET TRANSACTION HISTORY
// GET /api/admin/wallet/history/:username
// =====================================================

router.get(
  "/history/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const transactions = await WalletTransaction.find({
        username: req.params.username,
      }).sort({ createdAt: -1 });

      return res.json({
        success: true,
        transactions,
      });

    } catch (error) {
      console.error("Wallet History Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load wallet history.",
      });
    }
  }
);const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");

// =====================================================
// GET PENDING DEPOSITS
// GET /api/admin/wallet/deposits
// =====================================================

router.get("/deposits", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({ status: "Pending" }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      deposits,
    });
  } catch (error) {
    console.error("Pending Deposits Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending deposits.",
    });
  }
});

// =====================================================
// APPROVE DEPOSIT
// POST /api/admin/wallet/deposits/:id/approve
// =====================================================

router.post(
  "/deposits/:id/approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const deposit = await Deposit.findById(req.params.id);

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message: "Deposit not found.",
        });
      }

      if (deposit.status !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "Deposit already processed.",
        });
      }

      const user = await User.findOne({ username: deposit.username });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      user.pkrBalance += Number(deposit.amount);
      await user.save();

      deposit.status = "Approved";
      deposit.approvedBy = req.user.username;
      deposit.approvedAt = new Date();
      await deposit.save();

      await WalletTransaction.create({
        username: user.username,
        walletType: "PKR",
        transactionType: "DEPOSIT_APPROVED",
        amount: deposit.amount,
        status: "Completed",
        note: "Deposit approved by admin.",
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "Deposit approved successfully.",
      });
    } catch (error) {
      console.error("Approve Deposit Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to approve deposit.",
      });
    }
  }
);

// =====================================================
// REJECT DEPOSIT
// POST /api/admin/wallet/deposits/:id/reject
// =====================================================

router.post(
  "/deposits/:id/reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const deposit = await Deposit.findById(req.params.id);

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message: "Deposit not found.",
        });
      }

      if (deposit.status !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "Deposit already processed.",
        });
      }

      deposit.status = "Rejected";
      deposit.approvedBy = req.user.username;
      deposit.approvedAt = new Date();
      await deposit.save();

      return res.json({
        success: true,
        message: "Deposit rejected successfully.",
      });
    } catch (error) {
      console.error("Reject Deposit Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to reject deposit.",
      });
    }
  }
);

// =====================================================
// GET PENDING WITHDRAW REQUESTS
// GET /api/admin/wallet/withdraws
// =====================================================

router.get("/withdraws", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({ status: "Pending" }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      withdraws,
    });
  } catch (error) {
    console.error("Pending Withdraw Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw requests.",
    });
  }
});

// =====================================================
// APPROVE WITHDRAW
// POST /api/admin/wallet/withdraws/:id/approve
// =====================================================

router.post(
  "/withdraws/:id/approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
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

      withdraw.status = "Approved";
      withdraw.approvedBy = req.user.username;
      withdraw.approvedAt = new Date();
      await withdraw.save();

      await WalletTransaction.create({
        username: withdraw.username,
        walletType: "PKR",
        transactionType: "WITHDRAW_APPROVED",
        amount: withdraw.amount,
        status: "Completed",
        note: "Withdraw approved by admin.",
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "Withdraw approved successfully.",
      });
    } catch (error) {
      console.error("Approve Withdraw Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to approve withdraw request.",
      });
    }
  }
);

// =====================================================
// REJECT WITHDRAW
// POST /api/admin/wallet/withdraws/:id/reject
// =====================================================

router.post(
  "/withdraws/:id/reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
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

      const user = await User.findOne({ username: withdraw.username });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      user.pkrBalance += Number(withdraw.amount);
      await user.save();

      withdraw.status = "Rejected";
      withdraw.approvedBy = req.user.username;
      withdraw.approvedAt = new Date();
      await withdraw.save();

      await WalletTransaction.create({
        username: user.username,
        walletType: "PKR",
        transactionType: "WITHDRAW_REJECTED",
        amount: withdraw.amount,
        status: "Completed",
        note: "Withdraw rejected and amount returned to wallet.",
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "Withdraw rejected and amount returned.",
      });
    } catch (error) {
      console.error("Reject Withdraw Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to reject withdraw request.",
      });
    }
  }
);

// =====================================================
// AUDIT LOG
// GET /api/admin/wallet/audit
// =====================================================

router.get("/audit", verifyToken, isAdmin, async (req, res) => {
  try {
    const logs = await WalletTransaction.find({})
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Audit Log Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load audit log.",
    });
  }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;