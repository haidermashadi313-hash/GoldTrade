"use strict";

const express = require("express");
const router = express.Router();

// =====================================================
// MODEL
// =====================================================

const User = require("../models/User");

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
    const users = await User.find({
      isDeleted: { $ne: true },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load users.",
    });
  }
});

// =====================================================
// GET SINGLE USER
// GET /api/admin/users/:id
// =====================================================

router.get("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("GET USER ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load user.",
    });
  }
});

// =====================================================
// HEALTH CHECK
// GET /api/admin/users/health
// =====================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Admin User Routes Working - GoldTrade V18",
    version: "V18 Enterprise",
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;