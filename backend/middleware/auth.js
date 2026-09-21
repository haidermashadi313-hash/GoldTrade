const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =====================================================
// VERIFY JWT TOKEN
// =====================================================

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing.",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "goldtrade_v18_secret"
    );

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// =====================================================
// ADMIN CHECK
// =====================================================

const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }

  next();
};

// =====================================================
// USER CHECK
// =====================================================

const isUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  next();
};

// =====================================================
// WALLET FREEZE CHECK
// =====================================================

const checkWalletStatus = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.walletFrozen) {
    return res.status(403).json({
      success: false,
      message: "Your wallet has been frozen by administrator.",
    });
  }

  next();
};

// =====================================================
// SELF OR ADMIN CHECK
// =====================================================

const isSelfOrAdmin = (req, res, next) => {
  const username = req.params.username;

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (
    req.user.role === "admin" ||
    req.user.username === username
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied.",
  });
};

// =====================================================
// ACCESS TOKEN
// =====================================================

const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET || "goldtrade_v18_secret",
    {
      expiresIn: process.env.JWT_EXPIRE || "7d",
    }
  );
};

// =====================================================
// REFRESH TOKEN
// =====================================================

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET ||
      "goldtrade_v18_refresh_secret",
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
    }
  );
};

// =====================================================
// VERIFY REFRESH TOKEN
// =====================================================

const verifyRefreshToken = (token) => {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET ||
      "goldtrade_v18_refresh_secret"
  );
};

// =====================================================
// CREATE LOGIN RESPONSE
// =====================================================

const createLoginResponse = (user) => {
  return {
    success: true,
    message: "Login successful.",

    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user),

    user: {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,

      walletFrozen: user.walletFrozen,

      pkrBalance: Number(user.pkrBalance || 0),
      goldBalance: Number(user.goldBalance || 0),
      usdtBalance: Number(user.usdtBalance || 0),
    },
  };
};

// =====================================================
// EXTRACT TOKEN
// =====================================================

const extractToken = (req) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7);
};
// =====================================================
// OPTIONAL ADMIN OR OWNER CHECK BY USER ID
// =====================================================

const isOwnerOrAdminById = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  const requestedUserId = req.params.userId || req.params.id;

  if (
    req.user.role === "admin" ||
    String(req.user._id) === String(requestedUserId)
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied.",
  });
};

// =====================================================
// ADMIN + ACTIVE WALLET CHECK
// =====================================================

const isAdminWithActiveWallet = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }

  if (req.user.walletFrozen) {
    return res.status(403).json({
      success: false,
      message: "Admin wallet is frozen.",
    });
  }

  next();
};

// =====================================================
// AUTH INFO (DEBUG)
// =====================================================

const getAuthInfo = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  return res.json({
    success: true,
    user: {
      id: req.user._id,
      username: req.user.username,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,

      walletFrozen: req.user.walletFrozen,

      balances: {
        pkr: Number(req.user.pkrBalance || 0),
        gold: Number(req.user.goldBalance || 0),
        usdt: Number(req.user.usdtBalance || 0),
      },
    },
  });
};

// =====================================================
// FINAL EXPORT (ONLY ONE MODULE.EXPORTS)
// =====================================================

module.exports = {
  // Authentication
  verifyToken,

  // Authorization
  isAdmin,
  isUser,
  isSelfOrAdmin,
  isOwnerOrAdminById,
  isAdminWithActiveWallet,

  // Wallet Protection
  checkWalletStatus,

  // Token Helpers
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  createLoginResponse,
  extractToken,

  // Debug
  getAuthInfo,
};