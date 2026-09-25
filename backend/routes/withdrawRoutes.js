// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 1/7
// Production Ready (Render + PM2 + MongoDB)
// ======================================================

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const Withdraw = require("../models/Withdraw");
const User = require("../models/User");
const WalletHistory = require("../models/WalletHistory");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// HEALTH CHECK
// GET /api/withdraw/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Withdraw API",
    version: "V18 Enterprise",
    status: "ONLINE",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// GET USER WITHDRAW HISTORY
// GET /api/withdraw/history/:username
// Used By frontend/app/withdraw/page.tsx
// ======================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;

    const withdraws = await Withdraw.find({ username })
      .sort({ createdAt: -1 })
      .lean();

    const history = withdraws.map((item) => ({
      _id: item._id,
      username: item.username,

      amount: Number(item.amount),

      paymentMethod: item.paymentMethod,
      accountTitle: item.accountTitle || "",
      accountNumber: item.accountNumber || "",

      walletAddress: item.walletAddress || "",
      network: item.network || "",

      status: item.status,
      note: item.note || "",

      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      total: history.length,
      history,
    });

  } catch (error) {
    console.error("GET WITHDRAW HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw history.",
    });
  }
});

// ======================================================
// GET USER PENDING WITHDRAWS
// GET /api/withdraw/pending/:username
// ======================================================

router.get("/pending/:username", verifyToken, async (req, res) => {
  try {
    const pending = await Withdraw.find({
      username: req.params.username,
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: pending.length,
      withdraws: pending,
    });

  } catch (error) {
    console.error("GET PENDING WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending withdraw requests.",
    });
  }
});

// ======================================================
// GET USER WITHDRAW SUMMARY
// GET /api/withdraw/summary/:username
// Used By Dashboard + Withdraw Page
// ======================================================

router.get("/summary/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username;

    const withdraws = await Withdraw.find({ username }).lean();

    let totalWithdraws = 0;
    let approvedAmount = 0;
    let pendingAmount = 0;
    let rejectedAmount = 0;

    withdraws.forEach((item) => {
      totalWithdraws += 1;

      const amount = Number(item.amount);

      switch (item.status) {
        case "APPROVED":
          approvedAmount += amount;
          break;

        case "PENDING":
          pendingAmount += amount;
          break;

        case "REJECTED":
          rejectedAmount += amount;
          break;
      }
    });

    return res.status(200).json({
      success: true,
      summary: {
        username,
        totalWithdraws,
        approvedAmount,
        pendingAmount,
        rejectedAmount,
      },
    });

  } catch (error) {
    console.error("GET WITHDRAW SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw summary.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 2/7
// Create Withdraw Request API (Production)
// ======================================================

// POST /api/withdraw/create
// Used By frontend/app/withdraw/page.tsx

router.post("/create", verifyToken, async (req, res) => {
  try {
    const {
      amount,
      paymentMethod,
      accountTitle,
      accountNumber,
      walletAddress,
      network,
      note,
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Amount and payment method are required.",
      });
    }

    const withdrawAmount = Number(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw amount.",
      });
    }

    // ==================================================
    // FIND USER
    // ==================================================

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ==================================================
    // WALLET BALANCE CHECK
    // ==================================================

    if (!user.wallet) {
      user.wallet = {
        pkr: Number(user.pkrBalance || 0),
        gold: Number(user.goldBalance || 0),
        usdt: Number(user.usdtBalance || 0),
      };
    }

    const currentBalance = Number(user.wallet.pkr || 0);

    if (currentBalance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient PKR wallet balance.",
        walletBalance: currentBalance,
      });
    }

    // ==================================================
    // CHECK EXISTING PENDING REQUEST
    // ==================================================

    const existingPending = await Withdraw.findOne({
      userId: user._id,
      status: "PENDING",
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending withdrawal request. Please wait for admin approval.",
      });
    }

    // ==================================================
    // CREATE WITHDRAW REQUEST
    // ==================================================

    const withdraw = await Withdraw.create({
      userId: user._id,
      username: user.username,
      email: user.email,

      amount: withdrawAmount,

      paymentMethod: paymentMethod.toUpperCase(),

      accountTitle: accountTitle || "",
      accountNumber: accountNumber || "",

      walletAddress: walletAddress || "",
      network: network || "",

      note: note || "",

      status: "PENDING",
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,
      message:
        "Withdrawal request submitted successfully. Waiting for admin approval.",

      withdraw: {
        _id: withdraw._id,
        amount: withdraw.amount,
        paymentMethod: withdraw.paymentMethod,
        status: withdraw.status,
        createdAt: withdraw.createdAt,
      },

      walletBalance: currentBalance,
    });

  } catch (error) {
    console.error("CREATE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create withdraw request.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 3/7
// Withdraw Details API + User Withdraw Summary
// ======================================================

// ======================================================
// GET SINGLE WITHDRAW DETAILS
// GET /api/withdraw/details/:withdrawId
// Used By Withdraw Receipt / History Modal
// ======================================================

router.get("/details/:withdrawId", verifyToken, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.withdrawId).lean();

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    // User sirf apna withdraw dekh sakta hai
    if (
      withdraw.userId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      withdraw: {
        _id: withdraw._id,
        username: withdraw.username,
        amount: Number(withdraw.amount),

        paymentMethod: withdraw.paymentMethod,

        accountTitle: withdraw.accountTitle || "",
        accountNumber: withdraw.accountNumber || "",

        walletAddress: withdraw.walletAddress || "",
        network: withdraw.network || "",

        status: withdraw.status,
        note: withdraw.note || "",

        approvedBy: withdraw.approvedBy || "",
        rejectedBy: withdraw.rejectedBy || "",

        createdAt: withdraw.createdAt,
        updatedAt: withdraw.updatedAt,
      },
    });

  } catch (error) {
    console.error("GET WITHDRAW DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw details.",
    });
  }
});

// ======================================================
// GET USER WITHDRAW SUMMARY
// GET /api/withdraw/summary/:username
// Used By Dashboard + Withdraw Page
// ======================================================

router.get("/summary/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username;

    const withdraws = await Withdraw.find({ username }).lean();

    let totalWithdraws = 0;
    let approvedAmount = 0;
    let pendingAmount = 0;
    let rejectedAmount = 0;

    withdraws.forEach((item) => {
      totalWithdraws += 1;

      const amount = Number(item.amount || 0);

      switch (item.status) {
        case "APPROVED":
          approvedAmount += amount;
          break;

        case "PENDING":
          pendingAmount += amount;
          break;

        case "REJECTED":
          rejectedAmount += amount;
          break;
      }
    });

    return res.status(200).json({
      success: true,
      summary: {
        username,
        totalWithdraws,
        approvedAmount,
        pendingAmount,
        rejectedAmount,
      },
    });

  } catch (error) {
    console.error("GET WITHDRAW SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw summary.",
    });
  }
});

// ======================================================
// GET USER WITHDRAW STATISTICS
// GET /api/withdraw/statistics/:username
// Used By Dashboard Cards
// ======================================================

router.get("/statistics/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username;

    const approved = await Withdraw.countDocuments({
      username,
      status: "APPROVED",
    });

    const pending = await Withdraw.countDocuments({
      username,
      status: "PENDING",
    });

    const rejected = await Withdraw.countDocuments({
      username,
      status: "REJECTED",
    });

    const latestWithdraw = await Withdraw.findOne({ username })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      statistics: {
        approved,
        pending,
        rejected,
        latestWithdraw,
      },
    });

  } catch (error) {
    console.error("GET WITHDRAW STATISTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw statistics.",
    });
  }
});

// ======================================================
// GET RECENT WITHDRAWS
// GET /api/withdraw/recent/:username
// Used By Dashboard Activity
// ======================================================

router.get("/recent/:username", verifyToken, async (req, res) => {
  try {
    const recent = await Withdraw.find({
      username: req.params.username,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      total: recent.length,
      withdraws: recent,
    });

  } catch (error) {
    console.error("GET RECENT WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent withdraws.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 4/7
// Admin Withdraw APIs (Production)
// ======================================================

// ======================================================
// GET ALL WITHDRAW REQUESTS
// GET /api/withdraw/admin/all
// Used By Admin Withdraw Page
// ======================================================

router.get("/admin/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: withdraws.length,
      withdraws,
    });

  } catch (error) {
    console.error("GET ALL WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw requests.",
    });
  }
});

// ======================================================
// GET PENDING WITHDRAW REQUESTS
// GET /api/withdraw/admin/pending
// ======================================================

router.get("/admin/pending", verifyToken, isAdmin, async (req, res) => {
  try {
    const pending = await Withdraw.find({
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: pending.length,
      withdraws: pending,
    });

  } catch (error) {
    console.error("GET PENDING WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending withdraw requests.",
    });
  }
});

// ======================================================
// SEARCH WITHDRAW REQUESTS
// GET /api/withdraw/admin/search/:keyword
// Search By Username / Email / Account Number
// ======================================================

router.get("/admin/search/:keyword", verifyToken, isAdmin, async (req, res) => {
  try {
    const keyword = req.params.keyword;

    const withdraws = await Withdraw.find({
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        { accountNumber: { $regex: keyword, $options: "i" } },
        { walletAddress: { $regex: keyword, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: withdraws.length,
      withdraws,
    });

  } catch (error) {
    console.error("SEARCH WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search withdraw requests.",
    });
  }
});

// ======================================================
// GET WITHDRAW STATISTICS
// GET /api/withdraw/admin/statistics
// Used By Admin Dashboard
// ======================================================

router.get("/admin/statistics", verifyToken, isAdmin, async (req, res) => {
  try {
    const total = await Withdraw.countDocuments();

    const pending = await Withdraw.countDocuments({
      status: "PENDING",
    });

    const approved = await Withdraw.countDocuments({
      status: "APPROVED",
    });

    const rejected = await Withdraw.countDocuments({
      status: "REJECTED",
    });

    const approvedWithdraws = await Withdraw.find({
      status: "APPROVED",
    }).select("amount");

    const totalApprovedAmount = approvedWithdraws.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const pendingWithdraws = await Withdraw.find({
      status: "PENDING",
    }).select("amount");

    const totalPendingAmount = pendingWithdraws.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return res.status(200).json({
      success: true,
      statistics: {
        total,
        pending,
        approved,
        rejected,
        totalApprovedAmount,
        totalPendingAmount,
      },
    });

  } catch (error) {
    console.error("WITHDRAW STATISTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw statistics.",
    });
  }
});

// ======================================================
// GET SINGLE USER WITHDRAW REQUESTS
// GET /api/withdraw/admin/user/:username
// ======================================================

router.get("/admin/user/:username", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({
      username: req.params.username,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      username: req.params.username,
      total: withdraws.length,
      withdraws,
    });

  } catch (error) {
    console.error("GET USER WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user withdraw requests.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 5/7
// Admin Approve Withdraw API (Production)
// ======================================================

// PATCH /api/withdraw/approve/:withdrawId
// Used By Admin Withdraw Page

router.patch("/approve/:withdrawId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { withdrawId } = req.params;
    const { note } = req.body;

    // ==================================================
    // FIND WITHDRAW REQUEST
    // ==================================================

    const withdraw = await Withdraw.findById(withdrawId);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Withdraw request already approved.",
      });
    }

    // ==================================================
    // FIND USER
    // ==================================================

    const user = await User.findById(withdraw.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ==================================================
    // ENSURE WALLET EXISTS
    // ==================================================

    if (!user.wallet) {
      user.wallet = {
        pkr: Number(user.pkrBalance || 0),
        gold: Number(user.goldBalance || 0),
        usdt: Number(user.usdtBalance || 0),
      };
    }

    const withdrawAmount = Number(withdraw.amount);
    const currentBalance = Number(user.wallet.pkr || 0);

    // ==================================================
    // BALANCE VALIDATION
    // ==================================================

    if (currentBalance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient PKR wallet balance.",
        walletBalance: currentBalance,
      });
    }

    // ==================================================
    // DEBIT USER PKR WALLET
    // ==================================================

    user.wallet.pkr = currentBalance - withdrawAmount;
    user.pkrBalance = user.wallet.pkr;

    await user.save();

    // ==================================================
    // UPDATE WITHDRAW STATUS
    // ==================================================

    withdraw.status = "APPROVED";
    withdraw.note = note || "Withdraw approved by Admin";
    withdraw.approvedBy = req.user.username || "Admin";
    withdraw.approvedAt = new Date();

    await withdraw.save();

    // ==================================================
    // CREATE WALLET HISTORY ENTRY
    // ==================================================

    await WalletHistory.create({
      userId: user._id,
      username: user.username,
      walletType: "PKR",
      type: "DEBIT",
      amount: withdrawAmount,
      balanceAfter: Number(user.wallet.pkr),
      note: `Withdraw Approved (${withdraw.paymentMethod})`,
      admin: req.user.username || "Admin",
    });

    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return res.status(200).json({
      success: true,
      message: "Withdraw approved successfully.",

      withdraw: {
        _id: withdraw._id,
        status: withdraw.status,
        approvedBy: withdraw.approvedBy,
        approvedAt: withdraw.approvedAt,
      },

      walletBalance: {
        pkrBalance: Number(user.wallet.pkr),
        goldBalance: Number(user.wallet.gold || 0),
        usdtBalance: Number(user.wallet.usdt || 0),
      },
    });

  } catch (error) {
    console.error("APPROVE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve withdraw request.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 6/7
// Reject Withdraw API + Cancel Withdraw API
// ======================================================

// ======================================================
// REJECT WITHDRAW REQUEST
// PATCH /api/withdraw/reject/:withdrawId
// Used By Admin Withdraw Page
// ======================================================

router.patch("/reject/:withdrawId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { withdrawId } = req.params;
    const { note } = req.body;

    const withdraw = await Withdraw.findById(withdrawId);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Approved withdraw request cannot be rejected.",
      });
    }

    if (withdraw.status === "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Withdraw request already rejected.",
      });
    }

    withdraw.status = "REJECTED";
    withdraw.note = note || "Withdraw rejected by Admin";
    withdraw.rejectedBy = req.user.username || "Admin";
    withdraw.rejectedAt = new Date();

    await withdraw.save();

    return res.status(200).json({
      success: true,
      message: "Withdraw request rejected successfully.",
      withdraw: {
        _id: withdraw._id,
        status: withdraw.status,
        rejectedBy: withdraw.rejectedBy,
        rejectedAt: withdraw.rejectedAt,
        note: withdraw.note,
      },
    });

  } catch (error) {
    console.error("REJECT WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject withdraw request.",
    });
  }
});

// ======================================================
// USER CANCEL PENDING WITHDRAW
// DELETE /api/withdraw/cancel/:withdrawId
// User can cancel only PENDING withdraw request
// ======================================================

router.delete("/cancel/:withdrawId", verifyToken, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.withdrawId);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    if (withdraw.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending withdraw requests can be cancelled.",
      });
    }

    await Withdraw.findByIdAndDelete(withdraw._id);

    return res.status(200).json({
      success: true,
      message: "Withdraw request cancelled successfully.",
    });

  } catch (error) {
    console.error("CANCEL WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel withdraw request.",
    });
  }
});

// ======================================================
// ADMIN DELETE WITHDRAW REQUEST
// DELETE /api/withdraw/admin/:withdrawId
// Optional Super Admin Feature
// ======================================================

router.delete("/admin/:withdrawId", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.withdrawId);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    await Withdraw.findByIdAndDelete(withdraw._id);

    return res.status(200).json({
      success: true,
      message: "Withdraw request deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete withdraw request.",
    });
  }
});

// ======================================================
// GET REJECTED WITHDRAW REQUESTS
// GET /api/withdraw/admin/rejected
// Used By Admin Filters
// ======================================================

router.get("/admin/rejected", verifyToken, isAdmin, async (req, res) => {
  try {
    const rejected = await Withdraw.find({
      status: "REJECTED",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: rejected.length,
      withdraws: rejected,
    });

  } catch (error) {
    console.error("GET REJECTED WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load rejected withdraw requests.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 7/7 FINAL
// Diagnostics + Refresh APIs + Router Export
// ======================================================

// ======================================================
// WITHDRAW DEBUG API
// GET /api/withdraw/debug
// Used For Production Diagnostics
// ======================================================

router.get("/debug", verifyToken, isAdmin, async (req, res) => {
  try {
    const totalWithdraws = await Withdraw.countDocuments();

    const pendingWithdraws = await Withdraw.countDocuments({
      status: "PENDING",
    });

    const approvedWithdraws = await Withdraw.countDocuments({
      status: "APPROVED",
    });

    const rejectedWithdraws = await Withdraw.countDocuments({
      status: "REJECTED",
    });

    return res.status(200).json({
      success: true,
      module: "Withdraw API",
      version: "V18 Enterprise",
      environment: process.env.NODE_ENV || "development",

      statistics: {
        totalWithdraws,
        pendingWithdraws,
        approvedWithdraws,
        rejectedWithdraws,
      },

      databaseConnected: true,
      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error("WITHDRAW DEBUG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Withdraw diagnostics failed.",
    });
  }
});

// ======================================================
// REFRESH USER WALLET AFTER WITHDRAW
// GET /api/withdraw/refresh/:username
// Used By Dashboard
// ======================================================

router.get("/refresh/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username;

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
        pkrBalance: Number(user.wallet?.pkr ?? user.pkrBalance ?? 0),
        goldBalance: Number(user.wallet?.gold ?? user.goldBalance ?? 0),
        usdtBalance: Number(user.wallet?.usdt ?? user.usdtBalance ?? 0),
      },
      username: user.username,
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("REFRESH WITHDRAW WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh wallet.",
    });
  }
});

// ======================================================
// ADMIN REFRESH WITHDRAW DASHBOARD
// GET /api/withdraw/admin/refresh
// ======================================================

router.get("/admin/refresh", verifyToken, isAdmin, async (req, res) => {
  try {
    const pending = await Withdraw.find({ status: "PENDING" })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      totalPending: pending.length,
      pendingWithdraws: pending,
      refreshedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("ADMIN REFRESH WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh withdraw dashboard.",
    });
  }
});

// ======================================================
// GET RAW WITHDRAW DATA (ADMIN BACKUP)
// GET /api/withdraw/admin/raw
// ======================================================

router.get("/admin/raw", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: withdraws.length,
      withdraws,
    });

  } catch (error) {
    console.error("RAW WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load raw withdraw data.",
    });
  }
});

// ======================================================
// ROUTER EXPORT
// ======================================================

module.exports = router;
