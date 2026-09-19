"use strict";

// =======================================================
// GoldTrade V18 - ADMIN USER ROUTES
// Linux + Render Compatible
// =======================================================

const express = require("express");
const router = express.Router();

// =======================================================
// MODEL
// =======================================================

const User = require("../models/User");

// =======================================================
// MIDDLEWARE
// =======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =======================================================
// ALL ROUTES REQUIRE ADMIN LOGIN
// =======================================================

router.use(verifyToken);
router.use(isAdmin);

// =======================================================
// HEALTH CHECK
// GET /api/admin/users/health
// =======================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Admin User Routes Working - GoldTrade V18",
    version: "V18 Enterprise",
  });
});

// =======================================================
// GET ALL USERS
// GET /api/admin/users
// =======================================================

router.get("/", async (req, res) => {
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

// =======================================================
// GET SINGLE USER
// GET /api/admin/users/:id
// =======================================================

router.get("/:id", async (req, res) => {
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

// =======================================================
// EXPORT ROUTER
// =======================================================

module.exports = router;