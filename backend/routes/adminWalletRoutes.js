const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { verifyToken } = require("../middleware/authMiddleware");

// ================================
// GET ALL USERS
// ================================
router.get("/users", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    const users = await User.find().select("-password");

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ================================
// UPDATE WALLET BALANCE
// ================================
router.put("/update/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    const {
      walletBalance,
      usdtBalance,
      goldBalance,
      reason,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.walletBalance = Number(walletBalance);
    user.usdtBalance = Number(usdtBalance);
    user.goldBalance = Number(goldBalance);

    await user.save();

    await Transaction.create({
      userId: user._id,
      username: user.username,
      type: "Wallet Update",
      amount: walletBalance,
      status: "Completed",
      description: reason || "Manual wallet update by Admin",
    });

    res.json({
      success: true,
      message: "Wallet updated successfully.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;