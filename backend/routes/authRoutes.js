const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

const User = require("../models/User");
const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

// ======================================================
// JWT HELPERS
// ======================================================

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRE || "7d",
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role || "user",
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn:
        process.env.JWT_REFRESH_EXPIRE || "30d",
    }
  );
};

// ======================================================
// SIGNUP
// POST /api/auth/signup
// ======================================================

router.post(
  "/signup",
  async (req, res) => {
    try {
      const {
        username,
        fullName,
        email,
        password,
        phone,
      } = req.body;

      // ================================================
      // VALIDATION
      // ================================================

      if (
        !username ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Username, email and password are required.",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });
      }

      const normalizedUsername =
        username
          .trim()
          .toLowerCase();

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      // ================================================
      // EXISTING USER CHECK
      // ================================================

      const exists =
        await User.findOne({
          $or: [
            {
              username:
                normalizedUsername,
            },
            {
              email:
                normalizedEmail,
            },
          ],
        });

      if (exists) {
        return res.status(409).json({
          success: false,
          message:
            "Username or email already exists.",
        });
      }

      // ================================================
      // PASSWORD HASH
      // ================================================

      const hashedPassword =
        await bcrypt.hash(
          password,
          12
        );

      // ================================================
      // CREATE USER
      // ================================================

      const user =
        await User.create({
          username:
            normalizedUsername,

          fullName:
            fullName?.trim() || "",

          email:
            normalizedEmail,

          password:
            hashedPassword,

          phone:
            phone?.trim() || "",

          role: "user",

          isActive: true,
        });

      // ================================================
      // TOKENS
      // ================================================

      const token =
        generateAccessToken(user);

      const refreshToken =
        generateRefreshToken(user);

      return res.status(201).json({
        success: true,
        message:
          "Account created successfully.",

        token,

        refreshToken,

        user: {
          id: user._id,
          username:
            user.username,
          fullName:
            user.fullName,
          email:
            user.email,
          role:
            user.role,
        },
      });

    } catch (error) {
      console.error(
        "SIGNUP ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Signup failed.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        username,
        email,
        password,
      } = req.body;

      if (
        (!username && !email) ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Username/email and password are required.",
        });
      }

      const loginValue =
        (username || email)
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          $or: [
            {
              username:
                loginValue,
            },
            {
              email:
                loginValue,
            },
          ],
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      if (
        user.isActive === false
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Account disabled.",
        });
      }

      const passwordMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid password.",
        });
      }

      const token =
        generateAccessToken(user);

      const refreshToken =
        generateRefreshToken(user);

      return res.status(200).json({
        success: true,
        message:
          "Login successful.",

        token,

        refreshToken,

        user: {
          id: user._id,
          username:
            user.username,
          fullName:
            user.fullName,
          email:
            user.email,
          role:
            user.role,
        },
      });

    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Login failed.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// GET CURRENT USER
// GET /api/auth/me
// ======================================================

router.get(
  "/me",
  verifyToken,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.id
        )
          .select(
            "-password -__v"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });

    } catch (error) {
      console.error(
        "ME ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load user profile.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// GET PROFILE
// GET /api/auth/profile
// ======================================================

router.get(
  "/profile",
  verifyToken,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.id
        )
          .select(
            "-password -__v"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });

    } catch (error) {
      console.error(
        "PROFILE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load profile.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// AUTH CHECK
// GET /api/auth/check
// ======================================================

router.get(
  "/check",
  verifyToken,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.id
        )
          .select(
            "-password -__v"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      return res.status(200).json({
        success: true,

        user: {
          id: user._id,
          username:
            user.username,
          fullName:
            user.fullName,
          email:
            user.email,
          role:
            user.role,
        },
      });

    } catch (error) {
      console.error(
        "AUTH CHECK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Authentication check failed.",
      });
    }
  }
);
// ======================================================
// ADMIN AUTH CHECK
// ======================================================
// IMPORTANT:
// This route becomes /api/auth/admin/check
// when authRoutes is mounted at /api/auth.
// ======================================================

router.get(
  "/admin/check",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const admin =
        await User.findById(
          req.user.id
        )
          .select(
            "-password -__v"
          )
          .lean();

      if (!admin) {
        return res.status(404).json({
          success: false,
          message:
            "Admin account not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Admin authenticated.",

        user: {
          id: admin._id,
          username:
            admin.username,
          fullName:
            admin.fullName,
          email:
            admin.email,
          role:
            admin.role,
        },
      });

    } catch (error) {
      console.error(
        "ADMIN AUTH CHECK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Admin authentication failed.",
      });
    }
  }
);

// ======================================================
// REFRESH ACCESS TOKEN
// POST /api/auth/refresh
// ======================================================

router.post(
  "/refresh",
  async (req, res) => {
    try {
      const {
        refreshToken,
      } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message:
            "Refresh token missing.",
        });
      }

      const decoded =
        jwt.verify(
          refreshToken,
          process.env
            .JWT_REFRESH_SECRET
        );

      const user =
        await User.findById(
          decoded.id
        )
          .select(
            "_id username email role isActive"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      if (
        user.isActive === false
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Account disabled.",
        });
      }

      const token =
        generateAccessToken(user);

      return res.status(200).json({
        success: true,
        message:
          "Token refreshed successfully.",
        token,
      });

    } catch (error) {
      console.error(
        "REFRESH TOKEN ERROR:",
        error.message
      );

      return res.status(401).json({
        success: false,
        message:
          "Invalid or expired refresh token.",
      });
    }
  }
);

// ======================================================
// LOGOUT
// POST /api/auth/logout
// ======================================================

router.post(
  "/logout",
  verifyToken,
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "Logged out successfully.",
      timestamp:
        new Date().toISOString(),
    });
  }
);

// ======================================================
// AUTH API INFO
// GET /api/auth/status
// ======================================================

router.get(
  "/status",
  (req, res) => {
    return res.status(200).json({
      success: true,

      service:
        "GoldTrade Authentication API",

      version:
        "18.0.0",

      environment:
        process.env.NODE_ENV ||
        "development",

      timestamp:
        new Date().toISOString(),
    });
  }
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;