// ======================================================
// GoldTrade V18 Enterprise Middleware
// auth.js — PART 1/2
// JWT Authentication + Token Validation
// Production Ready (Render + Vercel + PM2)
// ======================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ======================================================
// GET TOKEN FROM REQUEST
// ======================================================

const getTokenFromRequest = (req) => {
  const authHeader =
    req.headers.authorization || req.headers.Authorization;

  if (
    authHeader &&
    typeof authHeader === "string" &&
    authHeader.startsWith("Bearer ")
  ) {
    return authHeader.substring(7).trim();
  }

  if (req.headers["x-access-token"]) {
    return req.headers["x-access-token"];
  }

  return null;
};

// ======================================================
// VERIFY JWT TOKEN
// ======================================================

const verifyToken = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is missing.");
    }

    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("_id username email role isActive")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account disabled.",
      });
    }

    req.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("VERIFY TOKEN ERROR:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Authentication failed."
          : error.message,
    });
  }
};
// ======================================================
// VERIFY ADMIN
// GOLDTRADE V18 ENTERPRISE — FINAL
// Supports: id / _id + normalized admin roles
// ======================================================

const isAdmin = async (req, res, next) => {
  try {
    // ====================================================
    // GET USER ID
    // Supports both req.user.id and req.user._id
    // ====================================================

    const userId =
      req.user?.id ||
      req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // ====================================================
    // LOAD USER FROM DATABASE
    // ====================================================

    const user = await User.findById(userId)
      .select("_id username role isActive")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    // ====================================================
    // ACTIVE ACCOUNT CHECK
    // ====================================================

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account disabled.",
      });
    }

    // ====================================================
    // NORMALIZE ROLE
    // ====================================================

    const role = String(user.role || "")
      .trim()
      .toLowerCase();

    // ====================================================
    // ACCEPTED ADMIN ROLES
    // ====================================================

    const adminRoles = [
      "admin",
      "administrator",
      "superadmin",
      "super_admin",
    ];

    if (!adminRoles.includes(role)) {
      console.error("ADMIN ACCESS DENIED:", {
        userId: String(user._id),
        username: user.username || null,
        role: user.role || null,
      });

      return res.status(403).json({
        success: false,
        message: "Administrator access required.",
        role: user.role || null,
      });
    }

    // ====================================================
    // NORMALIZE req.user
    // ====================================================

    req.user = {
      ...req.user,

      id: String(user._id),

      _id: user._id,

      username: user.username,

      role: "admin",

      isActive: user.isActive,
    };

    // ====================================================
    // ADMIN VERIFIED
    // ====================================================

    next();

  } catch (error) {
    console.error(
      "IS ADMIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Authorization failed."
          : error.message,
    });
  }
};

// ======================================================
// VERIFY USER (USER OR ADMIN)
// ======================================================

const isUser = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await User.findById(req.user.id)
      .select("_id role isActive")
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account disabled.",
      });
    }

    if (!["user", "admin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "User access denied.",
      });
    }

    next();
  } catch (error) {
    console.error("IS USER ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Authorization failed."
          : error.message,
    });
  }
};

// ======================================================
// OPTIONAL AUTH
// Public routes can identify logged-in users
// ======================================================

const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id)
      .select("_id username email role isActive")
      .lean();

    if (user && user.isActive !== false) {
      req.user = {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
      };
    }

    next();
  } catch {
    // Ignore invalid token on optional auth
    next();
  }
};

// ======================================================
// VERIFY ADMIN OR OWNER
// Admin OR same logged-in username
// ======================================================

const verifyAdminOrSelf = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const requestedUsername =
      req.params.username ||
      req.body.username ||
      req.query.username;

    if (!requestedUsername) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    if (
      req.user.role === "admin" ||
      req.user.username === requestedUsername
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "Access denied.",
    });
  } catch (error) {
    console.error("VERIFY ADMIN OR SELF ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Authorization failed."
          : error.message,
    });
  }
};

// ======================================================
// EXPORT ALL MIDDLEWARE
// ======================================================

module.exports = {
  verifyToken,
  isAdmin,
  isUser,
  optionalAuth,
  verifyAdminOrSelf,
};