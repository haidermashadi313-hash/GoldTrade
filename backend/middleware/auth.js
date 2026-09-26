// ======================================================
// GoldTrade V18 Enterprise Middleware
// PART 1/2
// JWT Authentication + Token Validation
// Render + Vercel + PM2 Compatible
// ======================================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ======================================================
// VERIFY USER TOKEN
// ======================================================

const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    // Authorization Header
    const authHeader =
      req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // x-access-token fallback
    if (!token && req.headers["x-access-token"]) {
      token = req.headers["x-access-token"];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token missing.",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find User
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token user.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account disabled.",
      });
    }

    // Attach user to request
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

    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }
};

// ======================================================
// EXPORT VERIFY TOKEN
// ======================================================

module.exports.verifyToken = verifyToken;
// ======================================================
// GoldTrade V18 Enterprise Middleware
// PART 2/2
// Admin Authorization + Optional Auth + Exports
// Render + PM2 + Ubuntu Compatible
// ======================================================

// ======================================================
// VERIFY ADMIN
// ======================================================

const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await User.findById(req.user.id).select("role isActive");

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

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Administrator access required.",
      });
    }

    next();
  } catch (error) {
    console.error("IS ADMIN ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authorization failed.",
    });
  }
};

// ======================================================
// VERIFY USER ROLE
// ======================================================

const isUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const user = await User.findById(req.user.id).select("role isActive");

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
      message: "Authorization failed.",
    });
  }
};

// ======================================================
// OPTIONAL AUTH
// Used for public routes that can also identify logged-in user
// ======================================================

const optionalAuth = async (req, res, next) => {
  try {
    let token = null;

    const authHeader =
      req.headers.authorization || req.headers.Authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select(
      "_id username email role isActive"
    );

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
    next();
  }
};

// ======================================================
// VERIFY ADMIN OR OWNER
// Allows admin OR same logged-in user
// ======================================================

const verifyAdminOrSelf = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const requestedUsername =
      req.params.username ||
      req.body.username ||
      req.query.username;

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
      message: "Authorization failed.",
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