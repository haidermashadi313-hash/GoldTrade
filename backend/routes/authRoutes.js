const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();
const User = require("../models/User");

// ===============================================
// GOLDTRADE V18 AUTH ROUTES
// ===============================================

// -----------------------------------------------
// SIGNUP
// POST /api/auth/signup
// -----------------------------------------------
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, phone, country } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required.",
      });
    }

    const usernameExist = await User.findOne({
      username: username.trim(),
    });

    if (usernameExist) {
      return res.status(400).json({
        success: false,
        message: "Username already exists.",
      });
    }

    const emailExist = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (emailExist) {
      return res.status(400).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      phone: phone || "",
      country: country || "Pakistan",
      role: "user",
      status: "Active",
      walletBalance: 0,
      UsdtBalance: 0,
      goldBalance: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==============================================
// LOGIN USER (GoldTrade V18 FINAL FIX)
// POST /api/auth/login
// ==============================================
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    // Username ya Email 
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

    // Password hash check
    if (!user.password) {
      return res.status(500).json({
        success: false,
        message: "Password hash missing in database.",
      });
    }

    // Compare password safely
    const passwordMatched = await bcrypt.compare(
      String(password),
      String(user.password)
    );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    // Blocked account
    if (user.status === "Blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account is blocked.",
      });
    }

    // JWT Token
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

    // Success response
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
        walletBalance: user.walletBalance || 0,
        UsdtBalance: user.UsdtBalance || 0,
        goldBalance: user.goldBalance || 0,
      },
    });
  } catch (err) {
    console.error("LOGIN ROUTE ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Internal server error.",
    });
  }
});

// -----------------------------------------------
// VERIFY TOKEN
// GET /api/auth/me
// -----------------------------------------------
router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("VERIFY TOKEN ERROR:", err);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
});

// ===============================================
// EXPORT ROUTER
// ===============================================
module.exports = router;