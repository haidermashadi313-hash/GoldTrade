// ======================================================
// GoldTrade V18 Enterprise Authentication Middleware
// File: backend/middleware/auth.js
// ======================================================

const jwt = require("jsonwebtoken");

// ======================================================
// VERIFY JWT TOKEN
// ======================================================

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token missing.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT Verify Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// ======================================================
// ADMIN CHECK
// ======================================================

const isAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin Middleware Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authorization failed.",
    });
  }
};

// ======================================================
// OPTIONAL USER CHECK
// ======================================================

const isUser = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authorization failed.",
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  verifyToken,
  isAdmin,
  isUser,
};