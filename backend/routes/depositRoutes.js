// =====================================================
// GoldTrade V18 Enterprise
// Deposit Routes (PART 1/5)
// Production Version
// =====================================================

const express = require("express");
const router = express.Router();

// =====================================================
// MODELS
// =====================================================

const Deposit = require("../models/Deposit");
const User = require("../models/User");
const WalletHistory = require("../models/WalletHistory");

// =====================================================
// MIDDLEWARE
// =====================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// HEALTH CHECK
// GET /api/admin/deposits/health/check
// =====================================================

router.get("/health/check", verifyToken, isAdmin, (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Deposit API",
    version: "GoldTrade V18 Enterprise",
    status: "Running",
    timestamp: new Date(),
  });
});

// =====================================================
// GET DEPOSIT STATISTICS
// IMPORTANT: STATIC ROUTE FIRST
// GET /api/admin/deposits/statistics
// =====================================================

router.get("/statistics", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find().lean();

    const statistics = {
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalRequests: deposits.length,

      pendingAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0,

      totalPKR: 0,
      totalGold: 0,
      totalUSDT: 0,
    };

    for (const deposit of deposits) {
      const amount = Number(deposit.amount || 0);
      const wallet = String(deposit.walletType || "PKR").toUpperCase();
      const status = String(deposit.status || "Pending");

      if (status === "Pending") {
        statistics.pendingRequests++;
        statistics.pendingAmount += amount;
      }

      if (status === "Approved") {
        statistics.approvedRequests++;
        statistics.approvedAmount += amount;
      }

      if (status === "Rejected") {
        statistics.rejectedRequests++;
        statistics.rejectedAmount += amount;
      }

      if (wallet === "PKR") statistics.totalPKR += amount;
      if (wallet === "GOLD") statistics.totalGold += amount;
      if (wallet === "USDT") statistics.totalUSDT += amount;
    }

    return res.json({
      success: true,
      statistics,
    });

  } catch (error) {
    console.error("DEPOSIT STATISTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================================
// GET DASHBOARD SUMMARY
// GET /api/admin/deposits/dashboard
// =====================================================

router.get("/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const pending = deposits.filter((d) => d.status === "Pending");
    const approved = deposits.filter((d) => d.status === "Approved");
    const rejected = deposits.filter((d) => d.status === "Rejected");

    return res.json({
      success: true,

      summary: {
        pendingCount: pending.length,
        approvedCount: approved.length,
        rejectedCount: rejected.length,

        pendingAmount: pending.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        ),

        approvedAmount: approved.reduce(
          (sum, item) => sum + Number(item.amount || 0),
          0
        ),
      },

      recentDeposits: deposits,
    });

  } catch (error) {
    console.error("DEPOSIT DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// =====================================================
// GET PENDING DEPOSITS
// GET /api/admin/deposits
// =====================================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      deposits,
    });

  } catch (error) {
    console.error("GET PENDING DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load pending deposits.",
    });
  }
});

// =====================================================
// GET ALL DEPOSIT HISTORY
// GET /api/admin/deposits/history
// =====================================================

router.get("/history", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      deposits,
    });

  } catch (error) {
    console.error("GET DEPOSIT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load deposit history.",
    });
  }
});

// =====================================================
// GET RECENT DEPOSITS
// GET /api/admin/deposits/recent
// =====================================================

router.get("/recent", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      deposits,
    });

  } catch (error) {
    console.error("GET RECENT DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load recent deposits.",
    });
  }
});

// =====================================================
// GET ALL DEPOSITS (Pending + Approved + Rejected)
// GET /api/admin/deposits/all
// Used by Admin Deposit Manager page
// =====================================================

router.get("/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      deposits,
    });

  } catch (error) {
    console.error("GET ALL DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load deposits.",
    });
  }
});
// =====================================================
// APPROVE DEPOSIT
// POST /api/admin/deposits/:id/approve
// =====================================================

router.post("/:id/approve", verifyToken, isAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    // Already processed
    if (deposit.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Deposit already ${deposit.status}.`,
      });
    }

    // Find User
    const user = await User.findById(deposit.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Create wallet if missing
    if (!user.wallet) {
      user.wallet = {
        pkr: Number(user.pkrBalance || 0),
        gold: Number(user.goldBalance || 0),
        usdt: Number(user.usdtBalance || 0),
      };
    }

    const walletType = String(deposit.walletType).toUpperCase();
    const amount = Number(deposit.amount || 0);

    // Credit wallet
    switch (walletType) {
      case "PKR":
        user.wallet.pkr += amount;
        user.pkrBalance = user.wallet.pkr;
        break;

      case "GOLD":
        user.wallet.gold += amount;
        user.goldBalance = user.wallet.gold;
        break;

      case "USDT":
        user.wallet.usdt += amount;
        user.usdtBalance = user.wallet.usdt;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid wallet type.",
        });
    }

    await user.save();

    // Update deposit
    deposit.status = "Approved";
    deposit.adminNote = adminNote || "";
    deposit.approvedBy = req.user.username;
    deposit.approvedAt = new Date();

    await deposit.save();

    // Save Wallet History
    await WalletHistory.create({
      userId: user._id,
      username: user.username,
      walletType,
      type: "Credit",
      amount,
      note: adminNote || "Deposit Approved",
      admin: req.user.username,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `${walletType} deposit approved successfully.`,
      wallet: user.wallet,
      deposit,
    });

  } catch (error) {
    console.error("APPROVE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// =====================================================
// REJECT DEPOSIT
// POST /api/admin/deposits/:id/reject
// =====================================================

router.post("/:id/reject", verifyToken, isAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    // Prevent duplicate reject/approve
    if (deposit.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Deposit already ${deposit.status}.`,
      });
    }

    deposit.status = "Rejected";
    deposit.adminNote = adminNote || "";
    deposit.rejectedBy = req.user.username;
    deposit.rejectedAt = new Date();

    await deposit.save();

    return res.status(200).json({
      success: true,
      message: "Deposit rejected successfully.",
      deposit,
    });

  } catch (error) {
    console.error("REJECT DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================================
// DELETE DEPOSIT REQUEST
// DELETE /api/admin/deposits/:id
// =====================================================

router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    // Safety: Approved deposits cannot be deleted
    if (deposit.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Approved deposits cannot be deleted.",
      });
    }

    await Deposit.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Deposit request deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// =====================================================
// GET SINGLE DEPOSIT DETAILS
// IMPORTANT: KEEP THIS ROUTE LAST
// GET /api/admin/deposits/:id
// =====================================================

router.get("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id).lean();

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      deposit,
    });

  } catch (error) {
    console.error("GET SINGLE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;