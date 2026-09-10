const express = require("express");
const router = express.Router();

const User = require("../models/User");
const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================
// GET WALLET
// ==========================================
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      wallet: {
        walletBalance: user.walletBalance || 0,
        usdtBalance: user.usdtBalance || 0,
        goldBalance: user.goldBalance || 0,
        goldAveragePrice: user.goldAveragePrice || 0,
        goldProfitLoss: user.goldProfitLoss || 0,
        totalDeposit: user.totalDeposit || 0,
        totalWithdraw: user.totalWithdraw || 0,
      },
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Wallet loading failed.",
    });
  }
});

// ==========================================
// REFRESH WALLET
// ==========================================
router.get("/refresh", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    return res.json({
      success: true,
      wallet: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Refresh failed.",
    });
  }
});

module.exports = router;