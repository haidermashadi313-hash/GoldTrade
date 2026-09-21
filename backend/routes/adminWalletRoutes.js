/*
=========================================================
 GoldTrade V18 Enterprise
 Admin Wallet Routes
 PART 1/6
 Linux + Render + MongoDB Atlas Compatible
=========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();

// =====================================================
// MODELS
// =====================================================

const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");
const Deposit = require("../models/Deposit");
const Withdraw = require("../models/Withdraw");

// =====================================================
// AUTH MIDDLEWARE
// =====================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// HEALTH CHECK
// GET /api/admin/wallet/health
// =====================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Admin Wallet Manager",
    version: "GoldTrade V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// GET ALL WALLET USERS
// GET /api/admin/wallet/users
// =====================================================

router.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "username fullName email role walletFrozen pkrBalance goldBalance usdtBalance createdAt"
      )
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      totalUsers: users.length,
      users,
    });

  } catch (error) {
    console.error("GET WALLET USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet users.",
      error: error.message,
    });
  }
});

// =====================================================
// WALLET SUMMARY
// GET /api/admin/wallet/stats
// =====================================================

router.get("/stats", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).lean();

    let totalPKR = 0;
    let totalGold = 0;
    let totalUSDT = 0;

    let activeWallets = 0;
    let frozenWallets = 0;

    for (const user of users) {
      totalPKR += Number(user.pkrBalance || 0);
      totalGold += Number(user.goldBalance || 0);
      totalUSDT += Number(user.usdtBalance || 0);

      if (user.walletFrozen) {
        frozenWallets++;
      } else {
        activeWallets++;
      }
    }

    return res.status(200).json({
      success: true,

      totalUsers: users.length,
      activeWallets,
      frozenWallets,

      totalPKR,
      totalGold,
      totalUSDT,
    });

  } catch (error) {
    console.error("GET WALLET STATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet statistics.",
      error: error.message,
    });
  }
});

// =====================================================
// FREEZE / UNFREEZE USER WALLET
// POST /api/admin/wallet/freeze
// =====================================================

router.post("/freeze", verifyToken, isAdmin, async (req, res) => {
  try {
    const { username, freeze, reason } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    const user = await User.findOne({
      username: username.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.walletFrozen = Boolean(freeze);

    await user.save();

    await WalletTransaction.create({
      username: user.username,
      walletType: "SYSTEM",
      transactionType: freeze
        ? "WALLET_FREEZE"
        : "WALLET_UNFREEZE",

      amount: 0,

      status: "Completed",

      note:
        reason && reason.trim() !== ""
          ? reason.trim()
          : freeze
          ? "Wallet frozen by administrator."
          : "Wallet unfrozen by administrator.",

      createdBy: req.user.username,
    });

    return res.status(200).json({
      success: true,
      message: freeze
        ? "Wallet frozen successfully."
        : "Wallet unfrozen successfully.",

      walletFrozen: user.walletFrozen,
      username: user.username,
    });

  } catch (error) {
    console.error("FREEZE WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update wallet status.",
      error: error.message,
    });
  }
});

// =====================================================
// GET SINGLE USER WALLET
// GET /api/admin/wallet/user/:username
// =====================================================

router.get("/user/:username", verifyToken, isAdmin, async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    const user = await User.findOne({ username }).select(
      "username fullName email role pkrBalance goldBalance usdtBalance walletFrozen createdAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("GET USER WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet user.",
      error: error.message,
    });
  }
});

// =====================================================
// MANUAL CREDIT / DEBIT WALLET
// POST /api/admin/wallet/manual-transaction
// PKR / GOLD / USDT
// =====================================================

router.post("/manual-transaction", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      username,
      walletType,
      transactionType,
      amount,
      note,
    } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (!username || !walletType || !transactionType || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Username, walletType, transactionType and amount are required.",
      });
    }

    const wallet = walletType.trim().toUpperCase();
    const action = transactionType.trim().toLowerCase();
    const numericAmount = Number(amount);

    if (!["PKR", "GOLD", "USDT"].includes(wallet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet type.",
      });
    }

    if (!["credit", "debit"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type.",
      });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
      });
    }

    // ===============================
    // FIND USER
    // ===============================

    const user = await User.findOne({
      username: username.trim().toLowerCase(),
    });

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
    // WALLET FIELD
    // ===============================

    let balanceField;

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

    const oldBalance = Number(user[balanceField] || 0);
    let newBalance = oldBalance;

    // ===============================
    // CREDIT / DEBIT
    // ===============================

    if (action === "credit") {
      newBalance += numericAmount;
    } else {
      if (oldBalance < numericAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${wallet} balance.`,
          currentBalance: oldBalance,
        });
      }

      newBalance -= numericAmount;
    }

    user[balanceField] = newBalance;
    await user.save();

    // ===============================
    // SAVE AUDIT LOG
    // ===============================

    const transaction = await WalletTransaction.create({
      username: user.username,

      walletType: wallet,

      transactionType:
        action === "credit"
          ? "ADMIN_CREDIT"
          : "ADMIN_DEBIT",

      amount: numericAmount,

      oldBalance,
      newBalance,

      status: "Completed",

      note:
        note && note.trim() !== ""
          ? note.trim()
          : action === "credit"
          ? `${wallet} credited manually by admin.`
          : `${wallet} debited manually by admin.`,

      createdBy: req.user.username,
    });

    // ===============================
    // RESPONSE
    // ===============================

    return res.status(200).json({
      success: true,

      message:
        action === "credit"
          ? `${wallet} wallet credited successfully.`
          : `${wallet} wallet debited successfully.`,

      transaction,
      walletType: wallet,
      transactionType: action,

      previousBalance: oldBalance,
      newBalance,

      user: {
        username: user.username,
        pkrBalance: user.pkrBalance,
        goldBalance: user.goldBalance,
        usdtBalance: user.usdtBalance,
      },
    });

  } catch (error) {
    console.error("MANUAL WALLET TRANSACTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process wallet transaction.",
      error: error.message,
    });
  }
});

// =====================================================
// GET PENDING DEPOSITS
// GET /api/admin/wallet/deposits
// =====================================================

router.get("/deposits", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      totalDeposits: deposits.length,
      deposits,
    });

  } catch (error) {
    console.error("GET PENDING DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending deposits.",
      error: error.message,
    });
  }
});

// =====================================================
// APPROVE DEPOSIT
// POST /api/admin/wallet/deposits/:id/approve
// PKR WALLET CREDIT
// =====================================================

router.post("/deposits/:id/approve", verifyToken, isAdmin, async (req, res) => {
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
        message: `Deposit already ${deposit.status}.`,
      });
    }

    const user = await User.findOne({
      username: deposit.username.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const depositAmount = Number(deposit.requestAmount || 0);

    if (depositAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit amount.",
      });
    }

    const previousBalance = Number(user.pkrBalance || 0);
    const newBalance = previousBalance + depositAmount;

    // Wallet Credit
    user.pkrBalance = newBalance;
    user.totalPkrDeposited =
      Number(user.totalPkrDeposited || 0) + depositAmount;

    await user.save();

    // Deposit Status
    deposit.status = "Approved";
    deposit.reviewedBy = req.user.username;
    deposit.reviewedAt = new Date();
    deposit.adminNote =
      req.body.adminNote || "Deposit approved by administrator.";

    await deposit.save();

    // Wallet Transaction Audit
    await WalletTransaction.create({
      username: user.username,

      walletType: "PKR",
      transactionType: "DEPOSIT_APPROVED",

      amount: depositAmount,

      oldBalance: previousBalance,
      newBalance,

      status: "Completed",

      note:
        req.body.adminNote ||
        "Deposit approved and PKR wallet credited.",

      createdBy: req.user.username,
    });

    return res.status(200).json({
      success: true,
      message: "Deposit approved and PKR wallet credited successfully.",

      username: user.username,
      creditedAmount: depositAmount,

      previousBalance,
      newBalance,

      deposit,
    });

  } catch (error) {
    console.error("APPROVE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve deposit.",
      error: error.message,
    });
  }
});

// =====================================================
// DEPOSIT SUMMARY
// GET /api/admin/wallet/deposits/summary
// =====================================================

router.get("/deposits/summary", verifyToken, isAdmin, async (req, res) => {
  try {
    const pending = await Deposit.countDocuments({
      status: "Pending",
    });

    const approved = await Deposit.countDocuments({
      status: "Approved",
    });

    const rejected = await Deposit.countDocuments({
      status: "Rejected",
    });

    const approvedDeposits = await Deposit.find({
      status: "Approved",
    }).lean();

    const totalApprovedAmount = approvedDeposits.reduce(
      (sum, item) => sum + Number(item.requestAmount || 0),
      0
    );

    return res.status(200).json({
      success: true,

      pending,
      approved,
      rejected,

      totalApprovedAmount,
    });

  } catch (error) {
    console.error("DEPOSIT SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit summary.",
      error: error.message,
    });
  }
});

// =====================================================
// REJECT DEPOSIT
// POST /api/admin/wallet/deposits/:id/reject
// NO WALLET CREDIT
// =====================================================

router.post("/deposits/:id/reject", verifyToken, isAdmin, async (req, res) => {
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
        message: `Deposit already ${deposit.status}.`,
      });
    }

    deposit.status = "Rejected";
    deposit.reviewedBy = req.user.username;
    deposit.reviewedAt = new Date();
    deposit.adminNote =
      req.body.adminNote || "Deposit rejected by administrator.";

    await deposit.save();

    await WalletTransaction.create({
      username: deposit.username,
      walletType: "PKR",
      transactionType: "DEPOSIT_REJECTED",
      amount: Number(deposit.requestAmount || 0),
      status: "Completed",
      note: deposit.adminNote,
      createdBy: req.user.username,
    });

    return res.status(200).json({
      success: true,
      message: "Deposit rejected successfully.",
      deposit,
    });

  } catch (error) {
    console.error("REJECT DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject deposit.",
      error: error.message,
    });
  }
});

// =====================================================
// GET ALL PENDING WITHDRAW REQUESTS
// GET /api/admin/wallet/withdraws
// =====================================================

router.get("/withdraws", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      totalWithdraws: withdraws.length,
      withdraws,
    });

  } catch (error) {
    console.error("GET WITHDRAW REQUESTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw requests.",
      error: error.message,
    });
  }
});

// =====================================================
// WITHDRAW SUMMARY
// GET /api/admin/wallet/withdraws/summary
// =====================================================

router.get("/withdraws/summary", verifyToken, isAdmin, async (req, res) => {
  try {
    const pending = await Withdraw.countDocuments({ status: "Pending" });
    const approved = await Withdraw.countDocuments({ status: "Approved" });
    const rejected = await Withdraw.countDocuments({ status: "Rejected" });

    const approvedWithdraws = await Withdraw.find({
      status: "Approved",
    }).lean();

    const totalApprovedAmount = approvedWithdraws.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return res.status(200).json({
      success: true,
      pending,
      approved,
      rejected,
      totalApprovedAmount,
    });

  } catch (error) {
    console.error("WITHDRAW SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw summary.",
      error: error.message,
    });
  }
});

// =====================================================
// APPROVE WITHDRAW REQUEST
// POST /api/admin/wallet/withdraws/:id/approve
// WALLET ALREADY DEBITED AT REQUEST TIME
// =====================================================

router.post("/withdraws/:id/approve", verifyToken, isAdmin, async (req, res) => {
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
        message: `Withdraw already ${withdraw.status}.`,
      });
    }

    const user = await User.findOne({
      username: withdraw.username.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Only change status. Wallet was already debited.
    withdraw.status = "Approved";
    withdraw.approvedBy = req.user.username;
    withdraw.approvedAt = new Date();
    withdraw.adminNote =
      req.body.adminNote || "Withdraw approved by administrator.";

    await withdraw.save();

    await WalletTransaction.create({
      username: user.username,
      walletType: "PKR",
      transactionType: "WITHDRAW_APPROVED",
      amount: Number(withdraw.amount || 0),
      oldBalance: Number(user.pkrBalance || 0),
      newBalance: Number(user.pkrBalance || 0),
      status: "Completed",
      note: withdraw.adminNote,
      createdBy: req.user.username,
    });

    return res.status(200).json({
      success: true,
      message: "Withdraw approved successfully.",
      withdraw,
    });

  } catch (error) {
    console.error("APPROVE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve withdraw request.",
      error: error.message,
    });
  }
});

// =====================================================
// REJECT WITHDRAW REQUEST
// POST /api/admin/wallet/withdraws/:id/reject
// RETURN AMOUNT TO USER WALLET
// =====================================================

router.post("/withdraws/:id/reject", verifyToken, isAdmin, async (req, res) => {
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
        message: `Withdraw already ${withdraw.status}.`,
      });
    }

    const user = await User.findOne({
      username: withdraw.username.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const previousBalance = Number(user.pkrBalance || 0);
    const refundAmount = Number(withdraw.amount || 0);
    const newBalance = previousBalance + refundAmount;

    // Return amount
    user.pkrBalance = newBalance;
    await user.save();

    withdraw.status = "Rejected";
    withdraw.approvedBy = req.user.username;
    withdraw.approvedAt = new Date();
    withdraw.adminNote =
      req.body.adminNote || "Withdraw rejected and amount returned.";

    await withdraw.save();

    await WalletTransaction.create({
      username: user.username,
      walletType: "PKR",
      transactionType: "WITHDRAW_REJECTED",
      amount: refundAmount,
      oldBalance: previousBalance,
      newBalance,
      status: "Completed",
      note: withdraw.adminNote,
      createdBy: req.user.username,
    });

    return res.status(200).json({
      success: true,
      message: "Withdraw rejected and PKR returned to wallet.",
      refundedAmount: refundAmount,
      previousBalance,
      newBalance,
      withdraw,
    });

  } catch (error) {
    console.error("REJECT WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject withdraw request.",
      error: error.message,
    });
  }
});

// =====================================================
// USER WALLET TRANSACTION HISTORY
// GET /api/admin/wallet/history/:username
// =====================================================

router.get("/history/:username", verifyToken, isAdmin, async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    const transactions = await WalletTransaction.find({ username })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      totalTransactions: transactions.length,
      transactions,
    });

  } catch (error) {
    console.error("WALLET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet transaction history.",
      error: error.message,
    });
  }
});

// =====================================================
// ADMIN AUDIT LOG
// GET /api/admin/wallet/audit
// =====================================================

router.get("/audit", verifyToken, isAdmin, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 200);

    const logs = await WalletTransaction.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      totalLogs: logs.length,
      logs,
    });

  } catch (error) {
    console.error("AUDIT LOG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load audit log.",
      error: error.message,
    });
  }
});

// =====================================================
// USER WALLET SUMMARY
// GET /api/admin/wallet/summary/:username
// =====================================================

router.get("/summary/:username", verifyToken, isAdmin, async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    const user = await User.findOne({ username }).select(
      "username fullName email pkrBalance goldBalance usdtBalance walletFrozen totalPkrDeposited totalPkrWithdrawn totalGoldPurchased totalGoldSold totalUsdtDeposited totalUsdtWithdrawn"
    );

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
        fullName: user.fullName,
        email: user.email,
        walletFrozen: user.walletFrozen,

        balances: {
          pkr: Number(user.pkrBalance || 0),
          gold: Number(user.goldBalance || 0),
          usdt: Number(user.usdtBalance || 0),
        },

        totals: {
          totalPkrDeposited: Number(user.totalPkrDeposited || 0),
          totalPkrWithdrawn: Number(user.totalPkrWithdrawn || 0),

          totalGoldPurchased: Number(user.totalGoldPurchased || 0),
          totalGoldSold: Number(user.totalGoldSold || 0),

          totalUsdtDeposited: Number(user.totalUsdtDeposited || 0),
          totalUsdtWithdrawn: Number(user.totalUsdtWithdrawn || 0),
        },
      },
    });

  } catch (error) {
    console.error("WALLET SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet summary.",
      error: error.message,
    });
  }
});

// =====================================================
// ADMIN SEARCH USER WALLET
// GET /api/admin/wallet/search/:username
// =====================================================

router.get("/search/:username", verifyToken, isAdmin, async (req, res) => {
  try {
    const username = req.params.username.trim().toLowerCase();

    const users = await User.find({
      username: { $regex: username, $options: "i" },
    })
      .select(
        "username fullName email pkrBalance goldBalance usdtBalance walletFrozen createdAt"
      )
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      totalResults: users.length,
      users,
    });

  } catch (error) {
    console.error("SEARCH USER WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search wallet users.",
      error: error.message,
    });
  }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;