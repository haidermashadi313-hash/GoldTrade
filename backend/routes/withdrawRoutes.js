// =====================================================
// GoldTrade V18 Enterprise
// Withdraw Routes (PART 1/6)
// Production Version
// =====================================================

const express = require("express");
const router = express.Router();

// =====================================================
// MODELS
// =====================================================

const Withdraw = require("../models/Withdraw");
const User = require("../models/User");
const WalletHistory = require("../models/WalletHistory");

// =====================================================
// MIDDLEWARE
// =====================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// HEALTH CHECK
// GET /api/admin/withdraws/health/check
// =====================================================

router.get("/health/check", verifyToken, isAdmin, (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Withdraw API",
    version: "GoldTrade V18 Enterprise",
    status: "Running",
    timestamp: new Date(),
  });
});

// =====================================================
// WITHDRAW STATISTICS
// GET /api/admin/withdraws/statistics
// =====================================================

router.get("/statistics", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdraw.find().lean();

    const statistics = {
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalRequests: withdrawals.length,

      pendingAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0,

      totalPKR: 0,
      totalGold: 0,
      totalUSDT: 0,
    };

    for (const withdraw of withdrawals) {
      const amount = Number(withdraw.amount || withdraw.requestAmount || 0);
      const wallet = String(withdraw.walletType || "PKR").toUpperCase();
      const status = String(withdraw.status || "Pending");

      // Status counters
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

      // Wallet totals
      if (wallet === "PKR") statistics.totalPKR += amount;
      if (wallet === "GOLD") statistics.totalGold += amount;
      if (wallet === "USDT") statistics.totalUSDT += amount;
    }

    return res.status(200).json({
      success: true,
      statistics,
    });

  } catch (error) {
    console.error("WITHDRAW STATISTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================================
// WITHDRAW DASHBOARD SUMMARY
// GET /api/admin/withdraws/dashboard
// =====================================================

router.get("/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdraw.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const pending = withdrawals.filter((w) => w.status === "Pending");
    const approved = withdrawals.filter((w) => w.status === "Approved");
    const rejected = withdrawals.filter((w) => w.status === "Rejected");

    return res.status(200).json({
      success: true,

      summary: {
        pendingCount: pending.length,
        approvedCount: approved.length,
        rejectedCount: rejected.length,

        pendingAmount: pending.reduce(
          (sum, item) =>
            sum + Number(item.amount || item.requestAmount || 0),
          0
        ),

        approvedAmount: approved.reduce(
          (sum, item) =>
            sum + Number(item.amount || item.requestAmount || 0),
          0
        ),

        rejectedAmount: rejected.reduce(
          (sum, item) =>
            sum + Number(item.amount || item.requestAmount || 0),
          0
        ),
      },

      recentWithdraws: withdrawals,
    });

  } catch (error) {
    console.error("WITHDRAW DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// =====================================================
// GET PENDING WITHDRAW REQUESTS
// GET /api/admin/withdraws
// =====================================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdraw.find({ status: "Pending" })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      withdrawals,
    });

  } catch (error) {
    console.error("GET PENDING WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load pending withdraw requests.",
    });
  }
});

// =====================================================
// GET WITHDRAW HISTORY
// GET /api/admin/withdraws/history
// =====================================================

router.get("/history", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdraw.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      withdrawals,
    });

  } catch (error) {
    console.error("GET WITHDRAW HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load withdraw history.",
    });
  }
});

// =====================================================
// GET RECENT WITHDRAW REQUESTS
// GET /api/admin/withdraws/recent
// =====================================================

router.get("/recent", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdraw.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.status(200).json({
      success: true,
      withdrawals,
    });

  } catch (error) {
    console.error("GET RECENT WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load recent withdraw requests.",
    });
  }
});

// =====================================================
// GET ALL WITHDRAW REQUESTS
// GET /api/admin/withdraws/all
// Used by Admin Withdraw Manager Page
// =====================================================

router.get("/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdrawals = await Withdraw.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      withdrawals,
    });

  } catch (error) {
    console.error("GET ALL WITHDRAWS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load withdraw requests.",
    });
  }
});
// =====================================================
// APPROVE WITHDRAW REQUEST
// POST /api/admin/withdraws/:id/approve
// =====================================================

router.post("/:id/approve", verifyToken, isAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;

    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    // Prevent duplicate processing
    if (withdraw.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Withdraw already ${withdraw.status}.`,
      });
    }

    const user = await User.findById(withdraw.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Create wallet object if missing
    if (!user.wallet) {
      user.wallet = {
        pkr: Number(user.pkrBalance || 0),
        gold: Number(user.goldBalance || 0),
        usdt: Number(user.usdtBalance || 0),
      };
    }

    const walletType = String(withdraw.walletType || "PKR").toUpperCase();

    const requestAmount = Number(
      withdraw.requestAmount || withdraw.amount || 0
    );

    const adminAmount = Number(
      withdraw.adminAmount || requestAmount
    );

    // =====================================================
    // BALANCE CHECK + WALLET DEBIT
    // =====================================================

    switch (walletType) {
      case "PKR":
        if (user.wallet.pkr < adminAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient PKR balance.",
          });
        }

        user.wallet.pkr -= adminAmount;
        user.pkrBalance = user.wallet.pkr;
        break;

      case "GOLD":
        if (user.wallet.gold < adminAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient GOLD balance.",
          });
        }

        user.wallet.gold -= adminAmount;
        user.goldBalance = user.wallet.gold;
        break;

      case "USDT":
        if (user.wallet.usdt < adminAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient USDT balance.",
          });
        }

        user.wallet.usdt -= adminAmount;
        user.usdtBalance = user.wallet.usdt;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid wallet type.",
        });
    }

    // Save updated wallet
    await user.save();

    // =====================================================
    // UPDATE WITHDRAW REQUEST
    // =====================================================

    withdraw.status = "Approved";
    withdraw.adminAmount = adminAmount;
    withdraw.adminNote = adminNote || "";
    withdraw.approvedBy = req.user.username;
    withdraw.approvedAt = new Date();

    await withdraw.save();

    // =====================================================
    // SAVE WALLET HISTORY
    // =====================================================

    await WalletHistory.create({
      userId: user._id,
      username: user.username,
      walletType,
      type: "Debit",
      amount: adminAmount,
      note: adminNote || "Withdraw Approved",
      admin: req.user.username,
      createdAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `${walletType} withdraw approved successfully.`,
      wallet: user.wallet,
      withdraw,
    });

  } catch (error) {
    console.error("APPROVE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// =====================================================
// REJECT WITHDRAW REQUEST
// POST /api/admin/withdraws/:id/reject
// =====================================================

router.post("/:id/reject", verifyToken, isAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;

    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    // Prevent duplicate processing
    if (withdraw.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Withdraw already ${withdraw.status}.`,
      });
    }

    withdraw.status = "Rejected";
    withdraw.adminNote = adminNote || "";
    withdraw.rejectedBy = req.user.username;
    withdraw.rejectedAt = new Date();

    await withdraw.save();

    return res.status(200).json({
      success: true,
      message: "Withdraw rejected successfully.",
      withdraw,
    });

  } catch (error) {
    console.error("REJECT WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =====================================================
// DELETE WITHDRAW REQUEST
// DELETE /api/admin/withdraws/:id
// =====================================================

router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    // Approved withdraws cannot be deleted
    if (withdraw.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Approved withdraw requests cannot be deleted.",
      });
    }

    await Withdraw.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Withdraw request deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
// =====================================================
// GET SINGLE WITHDRAW DETAILS
// GET /api/admin/withdraws/:id
// IMPORTANT: Keep this route near the end.
// =====================================================

router.get("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraw = await Withdraw.findById(req.params.id).lean();

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      withdraw,
    });

  } catch (error) {
    console.error("GET SINGLE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});
module.exports = router;