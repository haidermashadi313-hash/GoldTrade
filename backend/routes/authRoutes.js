// =====================================================
// GoldTrade V18 Enterprise
// AUTH ROUTES
// PART 1/5
// Production Version
// =====================================================

const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// =====================================================
// MODELS
// =====================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");

// =====================================================
// MIDDLEWARE
// =====================================================

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

// =====================================================
// JWT CONFIG
// =====================================================

const JWT_SECRET =
  process.env.JWT_SECRET || "goldtrade_v18_secret";

// =====================================================
// RESPONSE HELPERS
// =====================================================

const success = (res, message, data = {}) => {
  return res.status(200).json({
    success: true,
    message,
    ...data,
  });
};

const failed = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
  });
};
// =====================================================
// SIGNUP ALIAS
// POST /api/auth/signup
// Same handler as /register
// =====================================================

router.post("/signup", async (req, res) => {
  try {
    const {
      username,
      fullName,
      email,
      password,
    } = req.body;

    if (!username || !password) {
      return failed(
        res,
        400,
        "Username and password are required."
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email ? email.trim().toLowerCase() : "";

    const usernameExists = await User.findOne({
      username: cleanUsername,
    });

    if (usernameExists) {
      return failed(res, 409, "Username already exists.");
    }

    if (cleanEmail) {
      const emailExists = await User.findOne({
        email: cleanEmail,
      });

      if (emailExists) {
        return failed(res, 409, "Email already exists.");
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: cleanUsername,
      fullName: fullName?.trim() || cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: "user",
    });

    await Wallet.create({
      username: cleanUsername,
      balance: 0,
      pkrBalance: 0,
      goldBalance: 0,
      usdtBalance: 0,
    });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    return success(res, "Registration successful.", {
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    return failed(res, 500, "Registration failed.");
  }
});
// =====================================================
// LOGIN USER / ADMIN
// POST /api/auth/login
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // -----------------------------
    // Validation
    // -----------------------------

    if (!username || !password) {
      return failed(
        res,
        400,
        "Username/Email and password are required."
      );
    }

    const loginValue = username.trim().toLowerCase();

    // -----------------------------
    // Find User (Username or Email)
    // -----------------------------

    const user = await User.findOne({
      $or: [
        { username: loginValue },
        { email: loginValue },
      ],
    });

    if (!user) {
      return failed(
        res,
        401,
        "Invalid username or password."
      );
    }

    // -----------------------------
    // Password Verify
    // -----------------------------

    const passwordMatched = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatched) {
      return failed(
        res,
        401,
        "Invalid username or password."
      );
    }

    // -----------------------------
    // Update Last Login
    // -----------------------------

    user.lastLogin = new Date();
    await user.save();

    // -----------------------------
    // JWT TOKEN
    // -----------------------------

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      JWT_SECRET,
      {
        expiresIn: "30d",
      }
    );

    // -----------------------------
    // Wallet Check
    // -----------------------------

    let wallet = await Wallet.findOne({
      username: user.username,
    });

    if (!wallet) {
      wallet = await Wallet.create({
        username: user.username,
        balance: 0,
        pkrBalance: 0,
        goldBalance: 0,
        usdtBalance: 0,
      });
    }

    // -----------------------------
    // SUCCESS RESPONSE
    // -----------------------------

    return success(res, "Login successful.", {
      token,

      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },

      wallet: {
        pkrBalance: wallet.pkrBalance || wallet.balance || 0,
        goldBalance: wallet.goldBalance || 0,
        usdtBalance: wallet.usdtBalance || 0,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return failed(
      res,
      500,
      "Login failed."
    );
  }
});
// =====================================================
// GET CURRENT USER
// GET /api/auth/me
// Used by User Dashboard
// =====================================================

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return failed(res, 404, "User not found.");
    }

    const wallet = await Wallet.findOne({
      username: user.username,
    });

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
        pkrBalance: wallet?.pkrBalance ?? wallet?.balance ?? 0,
        goldBalance: wallet?.goldBalance ?? 0,
        usdtBalance: wallet?.usdtBalance ?? 0,
      },
    });

  } catch (error) {
    console.error("AUTH /ME ERROR:", error);

    return failed(res, 500, "Unable to load user profile.");
  }
});

// =====================================================
// ADMIN AUTH CHECK
// GET /api/admin/auth/check
// Used by Admin Dashboard
// =====================================================

router.get(
  "/admin/auth/check",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const admin = await User.findById(req.user.id).select("-password");

      if (!admin) {
        return failed(res, 404, "Admin not found.");
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

      return failed(
        res,
        500,
        "Admin authentication failed."
      );
    }
  }
);
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
// VERIFY TOKEN
// GET /api/auth/verify
// =====================================================

router.get("/verify", verifyToken, async (req, res) => {
  try {
    return success(res, "Token is valid.", {
      user: req.user,
    });
  } catch (error) {
    console.error("VERIFY TOKEN ERROR:", error);

    return failed(res, 401, "Invalid token.");
  }
});

// =====================================================
// HEALTH CHECK
// GET /api/auth/health
// =====================================================

router.get("/health", (req, res) => {
  return success(res, "GoldTrade Auth API Running.", {
    version: "GoldTrade V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// ROUTER EXPORT
// =====================================================

module.exports = router;