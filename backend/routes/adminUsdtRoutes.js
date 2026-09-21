const express = require("express");
const router = express.Router();

const { verifyToken, isAdmin } = require("../middleware/auth");

const Settings = require("../models/Settings");
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

// =====================================================
// GET USDT SETTINGS
// GET /api/admin/usdt/settings
// =====================================================

router.get("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        usdtBuyPrice: 285,
        usdtSellPrice: 283,
        usdtTradingEnabled: true,
      });
    }

    return res.json({
      success: true,
      settings: {
        buyPrice: settings.usdtBuyPrice,
        sellPrice: settings.usdtSellPrice,
        tradingEnabled: settings.usdtTradingEnabled,
      },
    });
  } catch (error) {
    console.error("USDT Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT settings.",
    });
  }
});

// =====================================================
// UPDATE USDT SETTINGS
// POST /api/admin/usdt/settings
// =====================================================

router.post("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    const { buyPrice, sellPrice, tradingEnabled } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    if (buyPrice !== undefined)
      settings.usdtBuyPrice = Number(buyPrice);

    if (sellPrice !== undefined)
      settings.usdtSellPrice = Number(sellPrice);

    if (tradingEnabled !== undefined)
      settings.usdtTradingEnabled = Boolean(tradingEnabled);

    await settings.save();

    return res.json({
      success: true,
      message: "USDT settings updated successfully.",
      settings: {
        buyPrice: settings.usdtBuyPrice,
        sellPrice: settings.usdtSellPrice,
        tradingEnabled: settings.usdtTradingEnabled,
      },
    });
  } catch (error) {
    console.error("Update USDT Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update USDT settings.",
    });
  }
});

// =====================================================
// ADMIN USDT DASHBOARD STATS
// GET /api/admin/usdt/dashboard
// =====================================================

router.get("/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const pendingDeposits = await Deposit.countDocuments({
      walletType: "USDT",
      status: "Pending",
    });

    const pendingWithdraws = await Withdraw.countDocuments({
      walletType: "USDT",
      status: "Pending",
    });

    const deposits = await Deposit.find({
      walletType: "USDT",
      status: "Pending",
    });

    const withdraws = await Withdraw.find({
      walletType: "USDT",
      status: "Pending",
    });

    const totalDepositAmount = deposits.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const totalWithdrawAmount = withdraws.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const settings = await Settings.findOne();

    return res.json({
      success: true,

      buyPrice: settings?.usdtBuyPrice || 0,
      sellPrice: settings?.usdtSellPrice || 0,
      tradingEnabled: settings?.usdtTradingEnabled ?? true,

      pendingDeposits,
      pendingWithdraws,

      totalDepositAmount,
      totalWithdrawAmount,
    });
  } catch (error) {
    console.error("USDT Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT dashboard.",
    });
  }
});
// =====================================================
// GET PENDING USDT DEPOSITS
// GET /api/admin/usdt/deposits
// =====================================================

router.get("/deposits", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({
      walletType: "USDT",
      status: "Pending",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      deposits,
    });
  } catch (error) {
    console.error("USDT Deposits Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT deposits.",
    });
  }
});

// =====================================================
// APPROVE USDT DEPOSIT
// POST /api/admin/usdt/deposits/:id/approve
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
          message: "Deposit request not found.",
        });
      }

      if (deposit.status !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "Deposit already processed.",
        });
      }

      const user = await User.findOne({
        username: deposit.username,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // Credit USDT Wallet
      user.usdtBalance =
        Number(user.usdtBalance || 0) + Number(deposit.amount);

      await user.save();

      // Update Deposit
      deposit.status = "Approved";
      deposit.approvedBy = req.user.username;
      deposit.approvedAt = new Date();

      await deposit.save();

      // Save Wallet History
      await WalletTransaction.create({
        username: user.username,
        walletType: "USDT",
        transactionType: "DEPOSIT_APPROVED",
        amount: Number(deposit.amount),
        status: "Completed",
        note: "USDT deposit approved by admin.",
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "USDT deposit approved successfully.",
        newBalance: user.usdtBalance,
      });
    } catch (error) {
      console.error("Approve USDT Deposit Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to approve USDT deposit.",
      });
    }
  }
);

// =====================================================
// REJECT USDT DEPOSIT
// POST /api/admin/usdt/deposits/:id/reject
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
          message: "Deposit request not found.",
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

      // Audit History
      await WalletTransaction.create({
        username: deposit.username,
        walletType: "USDT",
        transactionType: "DEPOSIT_REJECTED",
        amount: Number(deposit.amount),
        status: "Rejected",
        note: "USDT deposit rejected by admin.",
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "USDT deposit rejected successfully.",
      });
    } catch (error) {
      console.error("Reject USDT Deposit Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to reject USDT deposit.",
      });
    }
  }
);
// =====================================================
// GET PENDING USDT WITHDRAW REQUESTS
// GET /api/admin/usdt/withdraws
// =====================================================

router.get("/withdraws", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({
      walletType: "USDT",
      status: "Pending",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      withdraws,
    });
  } catch (error) {
    console.error("USDT Withdraws Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT withdraw requests.",
    });
  }
});

// =====================================================
// APPROVE USDT WITHDRAW
// POST /api/admin/usdt/withdraws/:id/approve
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
          message: "Withdraw request already processed.",
        });
      }

      const user = await User.findOne({
        username: withdraw.username,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // Safety check (balance should already be reserved)
      if (Number(user.usdtBalance || 0) < Number(withdraw.amount)) {
        return res.status(400).json({
          success: false,
          message: "User has insufficient USDT balance.",
        });
      }

      // Deduct balance
      user.usdtBalance =
        Number(user.usdtBalance || 0) - Number(withdraw.amount);

      await user.save();

      // Update request
      withdraw.status = "Approved";
      withdraw.approvedBy = req.user.username;
      withdraw.approvedAt = new Date();

      await withdraw.save();

      // Wallet History
      await WalletTransaction.create({
        username: user.username,
        walletType: "USDT",
        transactionType: "WITHDRAW_APPROVED",
        amount: Number(withdraw.amount),
        status: "Completed",
        note: "USDT withdrawal approved by admin.",
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "USDT withdrawal approved successfully.",
        newBalance: user.usdtBalance,
      });

    } catch (error) {
      console.error("Approve USDT Withdraw Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to approve USDT withdrawal.",
      });
    }
  }
);

// =====================================================
// REJECT USDT WITHDRAW
// POST /api/admin/usdt/withdraws/:id/reject
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
          message: "Withdraw request already processed.",
        });
      }

      const user = await User.findOne({
        username: withdraw.username,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // Refund amount back to wallet
      user.usdtBalance =
        Number(user.usdtBalance || 0) + Number(withdraw.amount);

      await user.save();

      // Update request
      withdraw.status = "Rejected";
      withdraw.approvedBy = req.user.username;
      withdraw.approvedAt = new Date();

      await withdraw.save();

      // Wallet History
      await WalletTransaction.create({
        username: user.username,
        walletType: "USDT",
        transactionType: "WITHDRAW_REJECTED",
        amount: Number(withdraw.amount),
        status: "Completed",
        note: "USDT withdrawal rejected and refunded.",
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "USDT withdrawal rejected and refunded.",
        newBalance: user.usdtBalance,
      });

    } catch (error) {
      console.error("Reject USDT Withdraw Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to reject USDT withdrawal.",
      });
    }
  }
);
// =====================================================
// USDT TRANSACTION HISTORY
// GET /api/admin/usdt/history
// =====================================================

router.get("/history", verifyToken, isAdmin, async (req, res) => {
  try {
    const history = await WalletTransaction.find({
      walletType: "USDT",
    })
      .sort({ createdAt: -1 })
      .limit(500);

    return res.json({
      success: true,
      history,
    });

  } catch (error) {
    console.error("USDT History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT transaction history.",
    });
  }
});

// =====================================================
// USER USDT ANALYTICS
// GET /api/admin/usdt/users
// =====================================================

router.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "username fullName email usdtBalance walletFrozen createdAt"
      )
      .sort({ usdtBalance: -1 });

    const totalUsers = users.length;

    const totalUsdtBalance = users.reduce(
      (sum, user) => sum + Number(user.usdtBalance || 0),
      0
    );

    const frozenWallets = users.filter(
      (user) => user.walletFrozen
    ).length;

    const activeWallets = totalUsers - frozenWallets;

    return res.json({
      success: true,

      analytics: {
        totalUsers,
        activeWallets,
        frozenWallets,
        totalUsdtBalance,
      },

      users,
    });

  } catch (error) {
    console.error("USDT User Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT user analytics.",
    });
  }
});

// =====================================================
// ADMIN USDT AUDIT LOG
// GET /api/admin/usdt/audit
// =====================================================

router.get("/audit", verifyToken, isAdmin, async (req, res) => {
  try {
    const logs = await WalletTransaction.find({
      walletType: "USDT",
    })
      .sort({ createdAt: -1 })
      .limit(300);

    return res.json({
      success: true,
      logs,
    });

  } catch (error) {
    console.error("USDT Audit Error:", error);

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