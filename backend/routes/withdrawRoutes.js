// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 1/6
// Production Ready (Render + PM2 + MongoDB Atlas + Linux)
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
// HELPERS
// ======================================================

const getWalletBalance = (user, walletType = "PKR") => {
  const wallet = user.wallet || {};

  switch (walletType.toUpperCase()) {
    case "USDT":
      return Number(wallet.usdt ?? user.usdtBalance ?? 0);

    case "GOLD":
      return Number(wallet.gold ?? user.goldBalance ?? 0);

    default:
      return Number(wallet.pkr ?? user.pkrBalance ?? 0);
  }
};

const calculateSummary = (withdraws = []) => {
  const summary = {
    totalWithdraws: withdraws.length,

    approvedAmount: 0,
    pendingAmount: 0,
    rejectedAmount: 0,

    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
  };

  withdraws.forEach((item) => {
    const amount = Number(item.amount || 0);

    switch ((item.status || "").toUpperCase()) {
      case "APPROVED":
        summary.approvedCount += 1;
        summary.approvedAmount += amount;
        break;

      case "REJECTED":
        summary.rejectedCount += 1;
        summary.rejectedAmount += amount;
        break;

      default:
        summary.pendingCount += 1;
        summary.pendingAmount += amount;
        break;
    }
  });

  return summary;
};

// ======================================================
// HEALTH CHECK
// GET /api/gold/admin/withdraws/health
// ======================================================

router.get("/health", async (_req, res) => {
  try {
    const totalWithdraws = await Withdraw.countDocuments();

    return res.status(200).json({
      success: true,
      module: "Withdraw API",
      version: "GoldTrade V18 Enterprise",
      status: "ONLINE",
      totalWithdraws,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("WITHDRAW HEALTH ERROR:", error);

    return res.status(500).json({
      success: false,
      module: "Withdraw API",
      status: "ERROR",
      message: error.message,
    });
  }
});

// ======================================================
// USER WITHDRAW HISTORY
// GET /history/:username
// Used By frontend/app/withdraw/page.tsx
// ======================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;

    const withdraws = await Withdraw.find({ username })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: withdraws.length,

      history: withdraws.map((item) => ({
        _id: item._id,
        username: item.username,
        email: item.email || "",

        amount: Number(item.amount || 0),

        currency: item.currency || "PKR",
        paymentMethod: item.paymentMethod || "BANK",

        accountTitle: item.accountTitle || "",
        accountNumber: item.accountNumber || "",
        bankName: item.bankName || "",

        walletAddress: item.walletAddress || "",
        network: item.network || "",

        status: item.status || "PENDING",
        note: item.note || "",

        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
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
// USER PENDING WITHDRAW REQUESTS
// GET /pending/:username
// ======================================================

router.get("/pending/:username", verifyToken, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({
      username: req.params.username,
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: withdraws.length,
      withdraws,
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
// USER WITHDRAW SUMMARY (ONLY ONE ROUTE)
// GET /summary/:username
// ======================================================

router.get("/summary/:username", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;

    const withdraws = await Withdraw.find({ username }).lean();

    const summary = calculateSummary(withdraws);

    return res.status(200).json({
      success: true,

      summary: {
        username,
        ...summary,
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
// USER WITHDRAW STATISTICS
// GET /statistics/:username
// ======================================================

router.get("/statistics/:username", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;

    const withdraws = await Withdraw.find({ username }).lean();

    const latestWithdraw =
      withdraws.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )[0] || null;

    const summary = calculateSummary(withdraws);

    return res.status(200).json({
      success: true,

      statistics: {
        approved: summary.approvedCount,
        pending: summary.pendingCount,
        rejected: summary.rejectedCount,
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
// USER RECENT WITHDRAW REQUESTS
// GET /recent/:username
// ======================================================

router.get("/recent/:username", verifyToken, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({
      username: req.params.username,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      total: withdraws.length,
      withdraws,
    });

  } catch (error) {
    console.error("GET RECENT WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent withdraw requests.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 2/6
// CREATE WITHDRAW REQUEST API
// Production Ready
// ======================================================

// POST /create
// Used By frontend/app/withdraw/page.tsx

router.post("/create", verifyToken, async (req, res) => {
  try {
    const {
      amount,
      currency = "PKR",
      paymentMethod,
      bankName,
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

    if (Number.isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw amount.",
      });
    }

    const withdrawCurrency = String(currency).toUpperCase();

    if (!["PKR", "USDT", "GOLD"].includes(withdrawCurrency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid currency selected.",
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
    // INITIALIZE WALLET
    // ==================================================

    if (!user.wallet) {
      user.wallet = {
        pkr: Number(user.pkrBalance || 0),
        usdt: Number(user.usdtBalance || 0),
        gold: Number(user.goldBalance || 0),
      };
    }

    const walletBalance = getWalletBalance(user, withdrawCurrency);

    // ==================================================
    // MINIMUM LIMITS
    // ==================================================

    const minimumAmount = {
      PKR: 1000,
      USDT: 10,
      GOLD: 0.1,
    };

    if (withdrawAmount < minimumAmount[withdrawCurrency]) {
      return res.status(400).json({
        success: false,
        message: `Minimum ${withdrawCurrency} withdrawal is ${minimumAmount[withdrawCurrency]}.`,
      });
    }

    // ==================================================
    // WALLET BALANCE CHECK
    // ==================================================

    if (walletBalance < withdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${withdrawCurrency} wallet balance.`,
        walletBalance,
      });
    }

    // ==================================================
    // ONLY ONE PENDING REQUEST PER CURRENCY
    // ==================================================

    const existingPending = await Withdraw.findOne({
      userId: user._id,
      currency: withdrawCurrency,
      status: "PENDING",
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: `You already have a pending ${withdrawCurrency} withdrawal request.`,
      });
    }

    // ==================================================
    // CREATE WITHDRAW REQUEST
    // ==================================================

    const withdraw = await Withdraw.create({
      userId: user._id,

      username: user.username,
      email: user.email,

      currency: withdrawCurrency,
      amount: withdrawAmount,

      paymentMethod: String(paymentMethod).toUpperCase(),

      bankName: bankName || "",

      accountTitle: accountTitle || "",
      accountNumber: accountNumber || "",

      walletAddress: walletAddress || "",
      network: network || "",

      note: note || "",

      status: "PENDING",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // ==================================================
    // RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,
      message: `${withdrawCurrency} withdrawal request submitted successfully.`,

      withdraw: {
        _id: withdraw._id,
        username: withdraw.username,

        currency: withdraw.currency,
        amount: withdraw.amount,

        paymentMethod: withdraw.paymentMethod,
        status: withdraw.status,

        createdAt: withdraw.createdAt,
      },

      walletBalance,
    });

  } catch (error) {
    console.error("CREATE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create withdraw request.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 3/6
// Withdraw Details + Recent + Refresh Wallet APIs
// Production Ready
// ======================================================

// ======================================================
// GET SINGLE WITHDRAW DETAILS
// GET /details/:withdrawId
// Used By Withdraw Receipt / History Modal
// ======================================================

router.get("/details/:withdrawId", verifyToken, async (req, res) => {
  try {
    const { withdrawId } = req.params;

    const withdraw = await Withdraw.findById(withdrawId).lean();

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    // ==================================================
    // ACCESS VALIDATION
    // ==================================================

    const isOwner =
      withdraw.userId?.toString() === req.user.id;

    const adminAccess =
      req.user.role === "admin";

    if (!isOwner && !adminAccess) {
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
        email: withdraw.email || "",

        currency: withdraw.currency || "PKR",
        amount: Number(withdraw.amount || 0),

        paymentMethod: withdraw.paymentMethod || "BANK",

        bankName: withdraw.bankName || "",

        accountTitle: withdraw.accountTitle || "",
        accountNumber: withdraw.accountNumber || "",

        walletAddress: withdraw.walletAddress || "",
        network: withdraw.network || "",

        status: withdraw.status || "PENDING",

        note: withdraw.note || "",

        approvedBy: withdraw.approvedBy || "",
        approvedAt: withdraw.approvedAt || null,

        rejectedBy: withdraw.rejectedBy || "",
        rejectedAt: withdraw.rejectedAt || null,

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
// GET RECENT USER WITHDRAWS
// GET /recent/:username
// Used By Dashboard Activity
// ======================================================

router.get("/recent/:username", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;

    const withdraws = await Withdraw.find({ username })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      total: withdraws.length,
      withdraws,
    });

  } catch (error) {
    console.error("GET RECENT WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent withdraw requests.",
    });
  }
});

// ======================================================
// REFRESH USER WALLET
// GET /refresh/:username
// Used By Dashboard + Withdraw Page
// ======================================================

router.get("/refresh/:username", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;

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
        pkrBalance: Number(
          user.wallet?.pkr ?? user.pkrBalance ?? 0
        ),

        usdtBalance: Number(
          user.wallet?.usdt ?? user.usdtBalance ?? 0
        ),

        goldBalance: Number(
          user.wallet?.gold ?? user.goldBalance ?? 0
        ),
      },

      username: user.username,
      updatedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("REFRESH WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh wallet.",
    });
  }
});

// ======================================================
// USER WALLET SNAPSHOT
// GET /wallet/:username
// Used By Withdraw Page Balance Cards
// ======================================================

router.get("/wallet/:username", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,

      balances: {
        PKR: Number(user.wallet?.pkr ?? user.pkrBalance ?? 0),
        USDT: Number(user.wallet?.usdt ?? user.usdtBalance ?? 0),
        GOLD: Number(user.wallet?.gold ?? user.goldBalance ?? 0),
      },
    });

  } catch (error) {
    console.error("GET WALLET SNAPSHOT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet balances.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 4/6
// ADMIN WITHDRAW APIs
// Production Ready (Render + Linux)
// ======================================================

// ======================================================
// ADMIN - GET ALL WITHDRAW REQUESTS
// GET /api/gold/admin/withdraws/all
// Used By frontend/app/admin/withdraw/page.tsx
// ======================================================

router.get("/all", verifyToken, isAdmin, async (req, res) => {
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
    console.error("ADMIN GET ALL WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw requests.",
    });
  }
});

// ======================================================
// ADMIN - GET DASHBOARD STATISTICS
// GET /api/gold/admin/withdraws/stats
// Used By Withdraw Manager Cards
// ======================================================

router.get("/stats", verifyToken, isAdmin, async (_req, res) => {
  try {
    const withdraws = await Withdraw.find({}).lean();

    const stats = {
      totalCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,

      totalAmount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0,
    };

    withdraws.forEach((item) => {
      const amount = Number(item.amount || 0);

      stats.totalCount += 1;
      stats.totalAmount += amount;

      switch ((item.status || "").toUpperCase()) {
        case "APPROVED":
          stats.approvedCount += 1;
          stats.approvedAmount += amount;
          break;

        case "REJECTED":
          stats.rejectedCount += 1;
          stats.rejectedAmount += amount;
          break;

        default:
          stats.pendingCount += 1;
          stats.pendingAmount += amount;
          break;
      }
    });

    return res.status(200).json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error("ADMIN WITHDRAW STATS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw statistics.",
    });
  }
});

// ======================================================
// ADMIN - GET PENDING REQUESTS
// GET /api/gold/admin/withdraws/pending
// ======================================================

router.get("/pending", verifyToken, isAdmin, async (_req, res) => {
  try {
    const withdraws = await Withdraw.find({
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: withdraws.length,
      withdraws,
    });

  } catch (error) {
    console.error("ADMIN PENDING WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending withdraw requests.",
    });
  }
});

// ======================================================
// ADMIN - SEARCH WITHDRAW REQUESTS
// GET /api/gold/admin/withdraws/search/:keyword
// Search username / email / bank / wallet
// ======================================================

router.get("/search/:keyword", verifyToken, isAdmin, async (req, res) => {
  try {
    const keyword = req.params.keyword.trim();

    const withdraws = await Withdraw.find({
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        { bankName: { $regex: keyword, $options: "i" } },
        { accountTitle: { $regex: keyword, $options: "i" } },
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
    console.error("ADMIN SEARCH WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search withdraw requests.",
    });
  }
});

// ======================================================
// ADMIN - GET USER WITHDRAW REQUESTS
// GET /api/gold/admin/withdraws/user/:username
// ======================================================

router.get("/user/:username", verifyToken, isAdmin, async (req, res) => {
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
    console.error("ADMIN USER WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user withdraw requests.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// withdrawRoutes.js
// PART 5/6
// ADMIN APPROVE + REJECT + CANCEL + DELETE
// Production Ready (Render + Linux)
// ======================================================

// ======================================================
// ADMIN APPROVE WITHDRAW REQUEST
// PATCH /api/gold/admin/withdraws/approve/:withdrawId
// ======================================================

router.patch("/approve/:withdrawId", verifyToken, isAdmin, async (req, res) => {
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
        message: "Withdraw request already approved.",
      });
    }

    const user = await User.findById(withdraw.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.wallet) {
      user.wallet = {
        pkr: Number(user.pkrBalance || 0),
        usdt: Number(user.usdtBalance || 0),
        gold: Number(user.goldBalance || 0),
      };
    }

    const currency = (withdraw.currency || "PKR").toUpperCase();
    const amount = Number(withdraw.amount || 0);

    let balance = getWalletBalance(user, currency);

    if (balance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${currency} wallet balance.`,
        walletBalance: balance,
      });
    }

    // Debit wallet
    switch (currency) {
      case "USDT":
        user.wallet.usdt = balance - amount;
        user.usdtBalance = user.wallet.usdt;
        break;

      case "GOLD":
        user.wallet.gold = balance - amount;
        user.goldBalance = user.wallet.gold;
        break;

      default:
        user.wallet.pkr = balance - amount;
        user.pkrBalance = user.wallet.pkr;
    }

    await user.save();

    withdraw.status = "APPROVED";
    withdraw.note = note || "Withdraw approved by Admin";
    withdraw.approvedBy = req.user.username || "Admin";
    withdraw.approvedAt = new Date();

    await withdraw.save();

    await WalletHistory.create({
      userId: user._id,
      username: user.username,

      walletType: currency,
      type: "DEBIT",

      amount,
      balanceAfter: getWalletBalance(user, currency),

      note: `Withdraw Approved (${withdraw.paymentMethod})`,
      admin: req.user.username || "Admin",
    });

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
        pkrBalance: Number(user.wallet.pkr || 0),
        usdtBalance: Number(user.wallet.usdt || 0),
        goldBalance: Number(user.wallet.gold || 0),
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
// ADMIN REJECT WITHDRAW REQUEST
// PATCH /api/gold/admin/withdraws/reject/:withdrawId
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
// DELETE /api/gold/admin/withdraws/cancel/:withdrawId
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
// DELETE /api/gold/admin/withdraws/delete/:withdrawId
// ======================================================

router.delete("/delete/:withdrawId", verifyToken, isAdmin, async (req, res) => {
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
// ADMIN GET REJECTED WITHDRAW REQUESTS
// GET /api/gold/admin/withdraws/rejected
// ======================================================

router.get("/rejected", verifyToken, isAdmin, async (_req, res) => {
  try {
    const withdraws = await Withdraw.find({
      status: "REJECTED",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: withdraws.length,
      withdraws,
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
// PART 6/6 FINAL
// Debug + Admin Refresh + Raw Backup + Router Export
// Production Ready (Render + PM2 + Linux)
// ======================================================

// ======================================================
// DEBUG API
// GET /api/gold/admin/withdraws/debug
// ======================================================

router.get("/debug", verifyToken, isAdmin, async (_req, res) => {
  try {
    const stats = {
      totalWithdraws: await Withdraw.countDocuments(),
      pendingWithdraws: await Withdraw.countDocuments({
        status: "PENDING",
      }),
      approvedWithdraws: await Withdraw.countDocuments({
        status: "APPROVED",
      }),
      rejectedWithdraws: await Withdraw.countDocuments({
        status: "REJECTED",
      }),
    };

    return res.status(200).json({
      success: true,
      module: "Withdraw API",
      version: "GoldTrade V18 Enterprise",
      environment: process.env.NODE_ENV || "development",
      databaseConnected: true,
      serverTime: new Date().toISOString(),
      statistics: stats,
    });

  } catch (error) {
    console.error("WITHDRAW DEBUG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Withdraw diagnostics failed.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});

// ======================================================
// ADMIN REFRESH DASHBOARD
// GET /api/gold/admin/withdraws/refresh
// ======================================================

router.get("/refresh", verifyToken, isAdmin, async (_req, res) => {
  try {
    const pendingWithdraws = await Withdraw.find({
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const stats = {
      totalCount: await Withdraw.countDocuments(),
      pendingCount: await Withdraw.countDocuments({
        status: "PENDING",
      }),
      approvedCount: await Withdraw.countDocuments({
        status: "APPROVED",
      }),
      rejectedCount: await Withdraw.countDocuments({
        status: "REJECTED",
      }),
    };

    return res.status(200).json({
      success: true,
      refreshedAt: new Date().toISOString(),
      stats,
      totalPending: pendingWithdraws.length,
      pendingWithdraws,
    });

  } catch (error) {
    console.error("ADMIN REFRESH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to refresh withdraw dashboard.",
    });
  }
});

// ======================================================
// RAW WITHDRAW DATA (ADMIN BACKUP)
// GET /api/gold/admin/withdraws/raw
// ======================================================

router.get("/raw", verifyToken, isAdmin, async (_req, res) => {
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
// ADMIN RECENT ACTIVITY
// GET /api/gold/admin/withdraws/activity
// ======================================================

router.get("/activity", verifyToken, isAdmin, async (_req, res) => {
  try {
    const activity = await Withdraw.find({})
      .sort({ updatedAt: -1 })
      .limit(15)
      .select(
        "username currency amount status paymentMethod approvedBy rejectedBy updatedAt createdAt"
      )
      .lean();

    return res.status(200).json({
      success: true,
      total: activity.length,
      activity,
    });

  } catch (error) {
    console.error("WITHDRAW ACTIVITY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw activity.",
    });
  }
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;