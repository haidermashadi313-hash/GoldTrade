// =====================================================
// GoldTrade V18 Enterprise
// AUTH ROUTES (PRODUCTION)
// PART 1/3
// Signup + Register FIXED
// =====================================================

const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Wallet = require("../models/Wallet");

const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// JWT CONFIG
// =====================================================

const JWT_SECRET =
  process.env.JWT_SECRET || "GoldTradeV18@JWT#2026";

const JWT_EXPIRE =
  process.env.JWT_EXPIRE || "7d";

// =====================================================
// RESPONSE HELPERS
// =====================================================

const success = (res, message, data = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    ...data,
  });
};

const failed = (res, status, message, errors = null) => {
  return res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
};

// =====================================================
// TOKEN GENERATOR
// =====================================================

const generateToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRE,
    }
  );

// =====================================================
// AUTH HEALTH
// =====================================================

router.get("/health", (req, res) => {
  return success(res, "GoldTrade Auth API Running.", {
    version: "GoldTrade V18 Enterprise",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// REGISTER / SIGNUP HANDLER
// Supports BOTH:
// POST /api/auth/register
// POST /api/auth/signup
// =====================================================

const registerHandler = async (req, res) => {
  try {
    let { username, fullName, email, password } = req.body;

    username = username?.trim().toLowerCase();
    fullName = fullName?.trim() || username;
    email = email?.trim().toLowerCase();

    if (!username || !email || !password) {
      return failed(
        res,
        400,
        "Username, Email and Password are required."
      );
    }

    if (password.length < 6) {
      return failed(
        res,
        400,
        "Password must be at least 6 characters."
      );
    }

    // Username / Email Exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return failed(
        res,
        409,
        "Username or Email already exists."
      );
    }

    // Password Hash
    const hashedPassword = await bcrypt.hash(password, 12);

    // =====================================================
    // CREATE USER
    // =====================================================

    const user = await User.create({
      username,
      fullName,
      email,
      password: hashedPassword,
      role: "user",
      lastLogin: new Date(),
    });

    // =====================================================
    // CREATE WALLET (FIXED)
    // userId added here
    // =====================================================

    const wallet = await Wallet.create({
      userId: user._id,          // ✅ REQUIRED FIX
      username: user.username,
      balance: 0,
      pkrBalance: 0,
      goldBalance: 0,
      usdtBalance: 0,
    });

    // =====================================================
    // JWT TOKEN
    // =====================================================

    const token = generateToken(user);

    return success(
      res,
      "Account created successfully.",
      {
        token,
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        wallet: {
          id: wallet._id,
          pkrBalance: wallet.pkrBalance,
          goldBalance: wallet.goldBalance,
          usdtBalance: wallet.usdtBalance,
        },
      },
      201
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return failed(
      res,
      500,
      error.message || "Registration failed."
    );
  }
};

// =====================================================
// SUPPORT BOTH ROUTES
// =====================================================

router.post("/register", registerHandler);
router.post("/signup", registerHandler);
// =====================================================
// LOGIN USER / ADMIN
// POST /api/auth/login
// =====================================================

router.post("/login", async (req, res) => {
  try {
    let { username, email, password } = req.body;

    const loginValue = (username || email || "")
      .trim()
      .toLowerCase();

    if (!loginValue || !password) {
      return failed(
        res,
        400,
        "Username/Email and password are required."
      );
    }

    // ---------------------------------------------
    // Find User
    // ---------------------------------------------
    const user = await User.findOne({
      $or: [
        { username: loginValue },
        { email: loginValue },
      ],
    });

    if (!user) {
      return failed(res, 401, "Invalid username or password.");
    }

    // ---------------------------------------------
    // Verify Password
    // ---------------------------------------------
    const matched = await bcrypt.compare(password, user.password);

    if (!matched) {
      return failed(res, 401, "Invalid username or password.");
    }

    // ---------------------------------------------
    // Update Last Login
    // ---------------------------------------------
    user.lastLogin = new Date();
    await user.save();

    // ---------------------------------------------
    // ENSURE WALLET EXISTS
    // IMPORTANT FIX
    // ---------------------------------------------
    let wallet = await Wallet.findOne({
      userId: user._id,
    });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        username: user.username,
        balance: 0,
        pkrBalance: 0,
        goldBalance: 0,
        usdtBalance: 0,
      });
    }

    // ---------------------------------------------
    // Generate Token
    // ---------------------------------------------
    const token = generateToken(user);

    return success(res, "Login successful.", {
      token,

      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },

      wallet: {
        id: wallet._id,
        pkrBalance: wallet.pkrBalance ?? wallet.balance ?? 0,
        goldBalance: wallet.goldBalance ?? 0,
        usdtBalance: wallet.usdtBalance ?? 0,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return failed(
      res,
      500,
      error.message || "Login failed."
    );
  }
});

// =====================================================
// GET CURRENT USER
// GET /api/auth/me
// =====================================================

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return failed(res, 404, "User not found.");
    }

    // ---------------------------------------------
    // Wallet Check
    // ---------------------------------------------
    let wallet = await Wallet.findOne({
      userId: user._id,
    });

    if (!wallet) {
      wallet = await Wallet.create({
        userId: user._id,
        username: user.username,
        balance: 0,
        pkrBalance: 0,
        goldBalance: 0,
        usdtBalance: 0,
      });
    }

    return success(res, "User profile loaded.", {
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },

      wallet: {
        id: wallet._id,
        pkrBalance: wallet.pkrBalance ?? wallet.balance ?? 0,
        goldBalance: wallet.goldBalance ?? 0,
        usdtBalance: wallet.usdtBalance ?? 0,
      },
    });
  } catch (error) {
    console.error("AUTH /ME ERROR:", error);

    return failed(
      res,
      500,
      "Unable to load user profile."
    );
  }
});

// =====================================================
// VERIFY TOKEN
// GET /api/auth/verify
// =====================================================

router.get("/verify", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return failed(res, 404, "User not found.");
    }

    return success(res, "Token verified successfully.", {
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("VERIFY TOKEN ERROR:", error);

    return failed(res, 401, "Invalid or expired token.");
  }
});
// =====================================================
// LOGOUT
// POST /api/auth/logout
// =====================================================

router.post("/logout", verifyToken, async (req, res) => {
  try {
    return success(res, "Logout successful.");
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return failed(res, 500, "Logout failed.");
  }
});

// =====================================================
// ADMIN AUTH CHECK
// GET /api/auth/admin/check
// =====================================================

router.get(
  "/admin/check",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const admin = await User.findById(req.user.id).select("-password");

      if (!admin) {
        return failed(res, 404, "Admin account not found.");
      }

      return success(res, "Admin authenticated.", {
        user: {
          id: admin._id,
          username: admin.username,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt,
        },
      });
    } catch (error) {
      console.error("ADMIN AUTH ERROR:", error);
      return failed(res, 500, "Admin authentication failed.");
    }
  }
);

// =====================================================
// BACKWARD COMPATIBILITY
// GET /api/admin/auth/check
// Existing frontend admin pages will continue working.
// =====================================================

router.get(
  "/../admin/auth/check",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const admin = await User.findById(req.user.id).select("-password");

      if (!admin) {
        return failed(res, 404, "Admin account not found.");
      }

      return success(res, "Admin authenticated.", {
        user: {
          id: admin._id,
          username: admin.username,
          fullName: admin.fullName,
          email: admin.email,
          role: admin.role,
        },
      });
    } catch (error) {
      console.error("ADMIN AUTH ERROR:", error);
      return failed(res, 500, "Admin authentication failed.");
    }
  }
);

// =====================================================
// AUTH HEALTH CHECK
// GET /api/auth/health
// =====================================================

router.get("/health", (req, res) => {
  return success(res, "GoldTrade Auth API Running.", {
    version: "GoldTrade V18 Enterprise",
    environment: process.env.NODE_ENV || "development",
    server: "Render Production",
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// ROUTE NOT FOUND
// =====================================================

router.use((req, res) => {
  return failed(
    res,
    404,
    `Auth API Not Found: ${req.method} ${req.originalUrl}`
  );
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;