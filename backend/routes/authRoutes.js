const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const User = require("../models/User");

const {
  verifyToken,
  generateToken,
} = require("../middleware/authMiddleware");

/* =====================================================
   SIGNUP
   POST /api/auth/signup
===================================================== */
router.post("/signup", async (req, res) => {
  try {
    let { username, email, password } = req.body;

    // Clean input
    username = username?.trim();
    email = email?.trim().toLowerCase();
    password = password?.trim();

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Username exists?
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // Email exists?
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: email === "admin@goldtrade.com" ? "admin" : "user",
      status: "Active",

      walletBalance: 0,
      usdtBalance: 0,
      goldBalance: 0,
      goldAveragePrice: 0,
      goldProfitLoss: 0,
      totalDeposit: 0,
      totalWithdraw: 0,
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Signup failed.",
    });
  }
});

/* =====================================================
   LOGIN
   POST /api/auth/login
===================================================== */
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

    const validPassword = await bcrypt.compare(password, user.password);

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

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        usdtBalance: user.usdtBalance,
        goldBalance: user.goldBalance,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message || "Login failed.",
    });
  }
});

/* =====================================================
   GET CURRENT USER
===================================================== */
router.get("/me", verifyToken, async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

/* =====================================================
   VERIFY TOKEN
===================================================== */
router.get("/verify", verifyToken, (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

/* =====================================================
   LOGOUT
===================================================== */
router.post("/logout", verifyToken, (req, res) => {
  return res.json({
    success: true,
    message: "Logout successful.",
  });
});

/* =====================================================
   EXPORT ROUTER
===================================================== */
module.exports = router;