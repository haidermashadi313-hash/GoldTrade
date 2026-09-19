"use strict";

// =======================================================
// GoldTrade V18 - ADMIN USDT ROUTES
// Linux + Render Compatible
// =======================================================

const express = require("express");
const router = express.Router();

// =======================================================
// MODELS
// =======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const UsdtRequest = require("../models/UsdtRequest");
const Transaction = require("../models/Transaction");

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
// TEST ROUTE
// GET /api/admin/usdt/test
// =======================================================

router.get("/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin USDT Routes Working Successfully",
    admin: req.user.username,
  });
});

// =======================================================
// GET ALL USDT REQUESTS
// GET /api/admin/usdt/requests
// =======================================================

router.get("/requests", async (req, res) => {
  try {
    const requests = await UsdtRequest.find()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      total: requests.length,
      requests,
    });
  } catch (error) {
    console.error("USDT Requests Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load USDT requests.",
    });
  }
});

// =======================================================
// EXPORT ROUTER
// =======================================================

module.exports = router;