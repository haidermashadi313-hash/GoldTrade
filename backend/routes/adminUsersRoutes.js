// =====================================================
// GoldTrade V18 Enterprise
// Admin Users Routes (PART 1/6)
// =====================================================

const express = require("express");
const router = express.Router();

// =====================================================
// MODELS
// =====================================================

const User = require("../models/User");
const WalletHistory = require("../models/WalletHistory");

// =====================================================
// MIDDLEWARE
// =====================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// GET ALL USERS
// GET /api/admin/users
// =====================================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load users.",
    });
  }
});

// =====================================================
// GET USER STATISTICS
// GET /api/admin/users/statistics
// =====================================================

router.get("/statistics", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).lean();

    const statistics = {
      totalUsers: users.length,
      activeUsers: 0,
      frozenUsers: 0,
      totalPKR: 0,
      totalGold: 0,
      totalUSDT: 0,
    };

    users.forEach((user) => {
      if (user.status === "Frozen") {
        statistics.frozenUsers++;
      } else {
        statistics.activeUsers++;
      }

      statistics.totalPKR += Number(user.wallet?.pkr || user.pkrBalance || 0);
      statistics.totalGold += Number(user.wallet?.gold || user.goldBalance || 0);
      statistics.totalUSDT += Number(user.wallet?.usdt || user.usdtBalance || 0);
    });

    return res.json({
      success: true,
      statistics,
    });
  } catch (error) {
    console.error("USER STATISTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load user statistics.",
    });
  }
});

// =====================================================
// EXPORT ROUTER (temporary)
// =====================================================

module.exports = router;