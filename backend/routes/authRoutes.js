"use strict";

// =======================================================
// GoldTrade V18 - AUTH ROUTES
// Linux + Render Compatible
// =======================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// =======================================================
// MODELS
// =======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");

// =======================================================
// MIDDLEWARE
// =======================================================

const { verifyToken } = require("../middleware/auth");

// =======================================================
// SIGNUP
// POST /api/auth/signup
// =======================================================

router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, phone, country } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required.",
      });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      $or: [
        { username: cleanUsername },
        { email: cleanEmail },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.username === cleanUsername
            ? "Username already exists."
            : "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      phone: phone || "",
      country: country || "Pakistan",
      role: "user",
      status: "Active",
      lastLogin: null,
    });

    // Create Wallet Automatically
    await Wallet.create({
      userId: newUser._id,
      PkrBalance: 0,
      goldBalance: 0,
      UsdtBalance: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });

  } catch (err) {
    console.error("SIGNUP ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Signup failed.",
      error: err.message,
    });
  }
});

// =======================================================
// LOGIN USER (GoldTrade V18 FINAL FIX)
// POST /api/auth/login
// =======================================================

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username/Email and password are required.",
      });
    }

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: username.trim() },
        { email: username.trim().toLowerCase() },
      ],
    }).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Verify password
    const matched = await bcrypt.compare(password, user.password);

    if (!matched) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    // Check account status
    if (user.status === "Blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked.",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRE || "30d",
      }
    );

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Load wallet safely
    const wallet = await Wallet.findOne({ userId: user._id });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        PkrBalance: wallet?.PkrBalance || 0,
        goldBalance: wallet?.goldBalance || 0,
        UsdtBalance: wallet?.UsdtBalance || 0,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: err.message,
    });
  }
});
// =======================================================
// VERIFY CURRENT USER
// GET /api/auth/me
// =======================================================

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const Wallet = await Wallet.findOne({ userId: user._id }).lean();

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || "",
        country: user.country || "",
        role: user.role,
        status: user.status,
        lastLogin: user.lastLogin,

        PkrBalance: Number(Wallet?.PkrBalance ?? 0),
        goldBalance: Number(Wallet?.goldBalance ?? 0),
        UsdtBalance: Number(Wallet?.UsdtBalance ?? 0),
      },
    });

  } catch (err) {
    console.error("GET /me ERROR:", err);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
      error: err.message,
    });
  }
});

// =======================================================
// AUTH CHECK (ADMIN & USER)
// GET /api/auth/check
// =======================================================

router.get("/check", verifyToken, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      authenticated: true,

      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
      },
    });

  } catch (err) {
    console.error("AUTH CHECK ERROR:", err);

    return res.status(401).json({
      success: false,
      authenticated: false,
      message: "Authentication failed.",
    });
  }
});

// =======================================================
// LOGOUT
// POST /api/auth/logout
// =======================================================

router.post("/logout", verifyToken, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });

  } catch (err) {
    console.error("LOGOUT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
});

// =======================================================
// HEALTH CHECK
// GET /api/auth/health
// =======================================================

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth API Working - GoldTrade V18",
    version: "V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// EXPORT ROUTER
// =======================================================

module.exports = router;