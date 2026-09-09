const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const User = require("../models/User");

const {
  verifyToken,
  generateToken,
} = require("../middleware/authMiddleware");

// =========================================
// SIGNUP
// POST /api/auth/signup
// =========================================
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const usernameExists = await User.findOne({ username });

    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: "Username already exists.",
      });
    }

    const emailExists = await User.findOne({
      email: email.toLowerCase(),
    });

    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const role =
      email.toLowerCase() === "admin@goldtrade.com"
        ? "admin"
        : "user";

    const user = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      status: "Active",
      walletBalance: 0,
      usdtBalance: 0,
      goldBalance: 0,
      goldAveragePrice: 0,
      goldProfitLoss: 0,
      totalDeposit: 0,
      totalWithdraw: 0,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Signup failed.",
    });
  }
});

// =========================================
// LOGIN
// POST /api/auth/login
// =========================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email not found.",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password.",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        usdtBalance: user.usdtBalance,
        goldBalance: user.goldBalance,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});
// =========================================
// GET CURRENT LOGGED-IN USER
// GET /api/auth/me
// =========================================
router.get("/me", verifyToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =========================================
// VERIFY TOKEN
// GET /api/auth/verify
// =========================================
router.get("/verify", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Token is valid.",
    user: req.user,
  });
});

// =========================================
// LOGOUT
// =========================================
router.post("/logout", verifyToken, (req, res) => {
  res.json({
    success: true,
    message: "Logout successful.",
  });
});

// =========================================
// REFRESH USER PROFILE
// =========================================
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =========================================
// EXPORT ROUTER
// =========================================
module.exports = router;