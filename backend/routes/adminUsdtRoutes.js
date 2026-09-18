// =======================================================
// GoldTrade V18 - ADMIN USDT ROUTES (PART 1/4)
// =======================================================

const express = require("express");
const router = express.Router();

// ================= MODELS =================
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const UsdtRequest = require("../models/UsdtRequest");
const Transaction = require("../models/Transaction");

// ================= MIDDLEWARE =================
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");

// =======================================================
// ALL ROUTES REQUIRE ADMIN LOGIN
// =======================================================
router.use(verifyToken);
router.use(isAdmin);

// =======================================================
// HEALTH CHECK
// GET /api/admin/usdt/health
// =======================================================
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Admin USDT API Working",
    admin: req.user?.username || "Admin",
  });
});

// =======================================================
// GET ALL USDT REQUESTS
// GET /api/admin/usdt/all
// =======================================================

router.get("/all", async (req, res) => {
  try {
    const requests = await UsdtRequest.find()
      .populate("userId", "username email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      requests,
    });
  } catch (err) {
    console.error("GET USDT REQUESTS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load USDT requests.",
    });
  }
});

// =======================================================
// GET USDT DASHBOARD STATS
// GET /api/admin/usdt/stats
// =======================================================

router.get("/stats", async (req, res) => {
  try {
    const requests = await UsdtRequest.find();

    const pending = requests.filter((r) => r.status === "Pending");
    const approved = requests.filter((r) => r.status === "Approved");
    const rejected = requests.filter((r) => r.status === "Rejected");

    const pendingTotal = pending.reduce(
      (sum, r) => sum + Number(r.amount || 0),
      0
    );

    const approvedTotal = approved.reduce(
      (sum, r) => sum + Number(r.adminAmount || r.amount || 0),
      0
    );

    return res.json({
      success: true,
      stats: {
        totalRequests: requests.length,
        pendingRequests: pending.length,
        approvedRequests: approved.length,
        rejectedRequests: rejected.length,
        pendingTotal,
        approvedTotal,
      },
    });
  } catch (err) {
    console.error("USDT STATS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard stats.",
    });
  }
});

// ======================================================
// APPROVE USDT REQUEST
// PUT /api/admin/usdt/:id/approve
// ======================================================

router.put("/:id/approve", verifyToken, isAdmin, async (req, res) => {
  try {
    const { adminAmount, adminNote } = req.body;

    const order = await UsdtOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "USDT request not found.",
      });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed.",
      });
    }

    const user = await User.findOne({ username: order.username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    // Credit USDT
    const creditAmount = Number(adminAmount || order.amount);

    wallet.usdtBalance =
      Number(wallet.usdtBalance || 0) + creditAmount;

    user.usdtBalance = wallet.usdtBalance;

    await wallet.save();
    await user.save();

    // Update Order
    order.status = "Approved";
    order.adminAmount = creditAmount;
    order.adminNote = adminNote || "Approved by Admin";
    order.approvedAt = new Date();

    await order.save();

    return res.json({
      success: true,
      message: "USDT request approved successfully.",
      wallet: {
        usdtBalance: wallet.usdtBalance,
      },
    });

  } catch (err) {
    console.error("APPROVE USDT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Approval failed.",
      error: err.message,
    });
  }
});
// ======================================================
// REJECT USDT REQUEST
// PUT /api/admin/usdt/:id/reject
// ======================================================

router.put("/:id/reject", verifyToken, isAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;

    const order = await UsdtOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "USDT request not found.",
      });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed.",
      });
    }

    order.status = "Rejected";
    order.adminNote = adminNote || "Rejected by Admin";
    order.rejectedAt = new Date();

    await order.save();

    return res.json({
      success: true,
      message: "USDT request rejected successfully.",
    });

  } catch (err) {
    console.error("REJECT USDT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Reject failed.",
      error: err.message,
    });
  }
});

// =======================================================
// GET SINGLE USDT REQUEST
// GET /api/admin/usdt/:id
// =======================================================

router.get("/:id", async (req, res) => {
  try {
    const request = await UsdtRequest.findById(req.params.id).populate(
      "userId",
      "username email"
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "USDT request not found.",
      });
    }

    return res.json({
      success: true,
      request,
    });
  } catch (err) {
    console.error("GET SINGLE USDT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load request.",
    });
  }
});

// =======================================================
// MODULE EXPORT
// =======================================================

module.exports = router;