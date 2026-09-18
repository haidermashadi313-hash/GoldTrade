// =======================================================
// GoldTrade V18 - ADMIN Usdt ROUTES (PART 1/4)
// =======================================================

const express = require("express");
const router = express.Router();

// ================= MODELS =================
const User = require("../models/User");
const wallet = require("../models/Wallet");
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
// GET /api/admin/Usdt/health
// =======================================================
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Admin Usdt API Working",
    admin: req.user?.username || "Admin",
  });
});

// =======================================================
// GET ALL Usdt REQUESTS
// GET /api/admin/Usdt/all
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
    console.error("GET Usdt REQUESTS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load Usdt requests.",
    });
  }
});

// =======================================================
// GET Usdt DASHBOARD STATS
// GET /api/admin/Usdt/stats
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
    console.error("Usdt STATS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard stats.",
    });
  }
});

// ======================================================
// APPROVE Usdt REQUEST
// PUT /api/admin/Usdt/:id/approve
// ======================================================

router.put("/:id/approve", verifyToken, isAdmin, async (req, res) => {
  try {
    const { adminAmount, adminNote } = req.body;

    const order = await UsdtRequest.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Usdt request not found.",
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

    const wallet = await wallet.findOne({ userId: user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "wallet not found.",
      });
    }

    // Credit Usdt
    const creditAmount = Number(adminAmount || order.amount);

    wallet.UsdtBalance =
      Number(wallet.UsdtBalance || 0) + creditAmount;

    user.UsdtBalance = wallet.UsdtBalance;

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
      message: "Usdt request approved successfully.",
      wallet: {
        UsdtBalance: wallet.UsdtBalance,
      },
    });

  } catch (err) {
    console.error("APPROVE Usdt ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Approval failed.",
      error: err.message,
    });
  }
});
// ======================================================
// REJECT Usdt REQUEST
// PUT /api/admin/Usdt/:id/reject
// ======================================================

router.put("/:id/reject", verifyToken, isAdmin, async (req, res) => {
  try {
    const { adminNote } = req.body;

    const order = await UsdtOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Usdt request not found.",
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
      message: "Usdt request rejected successfully.",
    });

  } catch (err) {
    console.error("REJECT Usdt ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Reject failed.",
      error: err.message,
    });
  }
});

// =======================================================
// GET SINGLE Usdt REQUEST
// GET /api/admin/Usdt/:id
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
        message: "Usdt request not found.",
      });
    }

    return res.json({
      success: true,
      request,
    });
  } catch (err) {
    console.error("GET SINGLE Usdt ERROR:", err);

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