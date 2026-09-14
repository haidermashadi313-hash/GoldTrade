const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Transaction = require("../models/Transaction");

// =======================================
// GET ALL USERS (Admin Panel)
// =======================================
router.get("/", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      totalUsers: users.length,
      data: users,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
});

// =======================================
// GET USER BY USERNAME
// =======================================
router.get("/:username", async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error.",
    });
  }
});

// =======================================
// MANUAL WALLET UPDATE (PKR / TRC20)
// =======================================
router.put("/:id/wallet", async (req, res) => {
  try {
    const {
      walletType,
      action,
      amount,
      reason,
      updatedBy,
    } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const value = Number(amount);

    if (!value || value <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter valid amount.",
      });
    }

    if (
      walletType !== "walletBalance" &&
      walletType !== "usdtBalance"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet type.",
      });
    }

    // CREDIT
    if (action === "add") {
      user[walletType] += value;
    }

    // DEBIT
    if (action === "deduct") {
      if (user[walletType] < value) {
        return res.status(400).json({
          success: false,
          message: "Insufficient balance.",
        });
      }

      user[walletType] -= value;
    }

    await user.save();

    // Finance Log
    await Transaction.create({
      username: user.username,

      wallet:
        walletType === "walletBalance"
          ? "PKR"
          : "TRC20",

      type:
        walletType === "walletBalance"
          ? action === "add"
            ? "Wallet Credit"
            : "Wallet Debit"
          : action === "add"
          ? "USDT Credit"
          : "USDT Debit",

      amount: value,

      method: "Admin Manager",

      transactionId: `GT-${Date.now()}`,

      status: "Completed",

      reason: reason || "",

      updatedBy: updatedBy || "Admin",
    });

    res.json({
      success: true,
      message: "Wallet updated successfully.",
      data: user,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Wallet update failed.",
    });
  }
});

// =======================================
// BLOCK / UNBLOCK USER
// =======================================
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Active", "Blocked"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: `User ${status} successfully.`,
      data: user,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Status update failed.",
    });
  }
});

// =======================================
// CHANGE USER ROLE
// user → manager → admin
// =======================================
router.put("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "manager", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: `Role changed to ${role}.`,
      data: user,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Role update failed.",
    });
  }
});

// =======================================
// DELETE USER
// =======================================
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Protect Admin Account
    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin account cannot be deleted.",
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "Delete failed.",
    });
  }
});

// =======================================
// USER WALLET HISTORY
// =======================================
router.get("/:username/history", async (req, res) => {
  try {
    const history = await Transaction.find({
      username: req.params.username,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      total: history.length,
      data: history,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: "History fetch failed.",
    });
  }
});

module.exports = router;