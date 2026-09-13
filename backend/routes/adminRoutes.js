const express = require("express");
const router = express.Router();

const User = require("../models/User");
const GoldTransaction = require("../models/GoldTransaction");
const WalletTransaction = require("../models/WalletTransaction");

const { verifyToken } = require("../middleware/authMiddleware");

// ==============================
// ADMIN CHECK
// ==============================
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }
  next();
};

// =======================================================
// GET ALL USERS
// GET /api/admin/users
// =======================================================
router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === "Active").length,
      blockedUsers: users.filter(u => u.status === "Blocked").length,
      frozenWallets: users.filter(u => u.walletFrozen).length,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to load users.",
    });
  }
});

// =======================================================
// USER PROFILE DETAILS
// GET /api/admin/users/profile/:id
// =======================================================
router.get("/profile/:id", verifyToken, adminOnly, async (req, res) => {
  try {

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const goldHistory = await GoldTransaction.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const walletHistory = await WalletTransaction.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      profile: user,
      goldHistory,
      walletHistory,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to load profile.",
    });
  }
});

// =======================================================
// BLOCK / UNBLOCK USER
// PUT /api/admin/users/block/:id
// =======================================================
router.put("/block/:id", verifyToken, adminOnly, async (req, res) => {
  try {

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.status =
      user.status === "Active"
        ? "Blocked"
        : "Active";

    await user.save();

    res.json({
      success: true,
      message: `User ${user.status}.`,
      status: user.status,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to update user status.",
    });
  }
});

// =======================================================
// FREEZE / UNFREEZE WALLET
// PUT /api/admin/users/freeze/:id
// =======================================================
router.put("/freeze/:id", verifyToken, adminOnly, async (req, res) => {
  try {

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.walletFrozen = !user.walletFrozen;

    await user.save();

    res.json({
      success: true,
      walletFrozen: user.walletFrozen,
      message: user.walletFrozen
        ? "Wallet Frozen Successfully."
        : "Wallet Unfrozen Successfully.",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to update wallet status.",
    });
  }
});

// =======================================================
// SOFT DELETE USER
// DELETE /api/admin/users/delete/:id
// =======================================================
router.delete("/delete/:id", verifyToken, adminOnly, async (req, res) => {
  try {

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.status = "Blocked";

    await user.save();

    res.json({
      success: true,
      message: "User deleted successfully.",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to delete user.",
    });
  }
});

// =======================================================
// RESTORE USER
// PUT /api/admin/users/restore/:id
// =======================================================
router.put("/restore/:id", verifyToken, adminOnly, async (req, res) => {
  try {

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isDeleted = false;
    user.deletedAt = null;
    user.status = "Active";

    await user.save();

    res.json({
      success: true,
      message: "User restored successfully.",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to restore user.",
    });
  }
});

// =======================================================
// SEARCH USERS
// GET /api/admin/users/search?q=hashi
// =======================================================
router.get("/search", verifyToken, adminOnly, async (req, res) => {
  try {

    const keyword = req.query.q || "";

    const users = await User.find({
      isDeleted: false,
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
    }).select("-password");

    res.json({
      success: true,
      users,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Search failed.",
    });
  }
});

module.exports = router;