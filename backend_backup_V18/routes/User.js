const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const ACCESS_SECRET = process.env.ACCESS_SECRET || "dev-access-secret";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "dev-refresh-secret";

// ======================================================
// USER SCHEMA
// ======================================================

const userSchema = new mongoose.Schema(
  {
    // Security
    passwordHistory: {
      type: [String],
      default: [],
    },

    securityPin: {
      type: String,
      default: null,
    },

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    accountLockedUntil: {
      type: Date,
      default: null,
    },

    passwordChangedAt: Date,

    forcePasswordReset: {
      type: Boolean,
      default: false,
    },

    // Account
    role: {
      type: String,
      enum: ["USER", "ADMIN", "SUPER_ADMIN"],
      default: "USER",
    },

    accountStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED", "BLOCKED"],
      default: "ACTIVE",
    },

    // Basic User Info
    fullName: {
      type: String,
      default: "",
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      default: "",
    },

    password: {
      type: String,
      required: true,
    },

    // Wallet
    walletBalance: {
      type: Number,
      default: 0,
    },

    usdtBalance: {
      type: Number,
      default: 0,
    },

    bonusBalance: {
      type: Number,
      default: 0,
    },

    // ==========================
    // GOLD WALLET (GoldTrade V17)
    // ==========================
    goldBalance: {
      type: Number,
      default: 0,
    },

    goldAveragePrice: {
      type: Number,
      default: 0,
    },

    goldProfitLoss: {
      type: Number,
      default: 0,
    },

    totalGoldBuy: {
      type: Number,
      default: 0,
    },

    totalGoldSell: {
      type: Number,
      default: 0,
    },

    // Referral
    referralCode: {
      type: String,
      default: "",
    },

    referredBy: {
      type: String,
      default: "",
    },

    referralIncome: {
      type: Number,
      default: 0,
    },

    // Sessions
    sessions: [
      {
        sessionId: String,
        refreshToken: String,
        deviceName: String,
        platform: String,
        browser: String,
        ipAddress: String,
        userAgent: String,
        location: String,
        loginAt: Date,
        lastActiveAt: Date,
        expiresAt: Date,

        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Login History
    loginHistory: [
      {
        loginAt: Date,
        ipAddress: String,
        deviceName: String,
        browser: String,
        platform: String,
        success: Boolean,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// ======================================================
// USER MODEL
// ======================================================

const User =
  mongoose.models.User || mongoose.model("User", userSchema);

// ======================================================
// BLACKLIST TOKEN MODEL
// ======================================================

const blacklistTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const BlacklistToken =
  mongoose.models.BlacklistToken ||
  mongoose.model("BlacklistToken", blacklistTokenSchema);

// ======================================================
// CREATE SESSION
// ======================================================

const createSession = async (user, req) => {
  const sessionId = crypto.randomUUID();

  const refreshToken = jwt.sign(
    {
      id: user._id,
      sessionId,
    },
    REFRESH_SECRET,
    {
      expiresIn: "30d",
    }
  );

  const session = {
    sessionId,
    refreshToken,
    deviceName: req.headers["x-device-name"] || "Unknown Device",
    platform: req.headers["x-platform"] || "Unknown",
    browser: req.headers["x-browser"] || "Unknown",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    location: req.headers["x-location"] || "Unknown",
    loginAt: new Date(),
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    isActive: true,
  };

  user.sessions.push(session);
  await user.save();

  return refreshToken;
};

// ======================================================
// ROTATE REFRESH TOKEN
// ======================================================

const rotateRefreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session.",
      });
    }

    const session = user.sessions.find(
      (s) => s.sessionId === decoded.sessionId && s.isActive
    );

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session expired.",
      });
    }

    session.isActive = false;

    const newRefreshToken = await createSession(user, req);

    const accessToken = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      ACCESS_SECRET,
      {
        expiresIn: "30m",
      }
    );

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Refresh token invalid.",
    });
  }
};

// ======================================================
// BLACKLIST TOKEN
// ======================================================

const blacklistToken = async (token) => {
  const decoded = jwt.decode(token);

  if (!decoded || !decoded.exp) return null;

  return BlacklistToken.create({
    token,
    expiresAt: new Date(decoded.exp * 1000),
  });
};

const isBlacklisted = async (token) => {
  return BlacklistToken.exists({ token });
};

// ======================================================
// LOGIN HISTORY
// ======================================================

const saveLoginHistory = async (user, req, success = true) => {
  user.loginHistory.unshift({
    loginAt: new Date(),
    ipAddress: req.ip,
    browser: req.headers["x-browser"] || "Unknown",
    platform: req.headers["x-platform"] || "Unknown",
    deviceName: req.headers["x-device-name"] || "Unknown",
    success,
  });

  user.loginHistory = user.loginHistory.slice(0, 100);

  await user.save();
};

// ======================================================
// ACTIVE SESSIONS
// ======================================================

const getSessions = async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    success: true,
    sessions: user.sessions.filter((s) => s.isActive),
  });
};

// ======================================================
// LOGOUT ONE DEVICE
// ======================================================

const logoutDevice = async (req, res) => {
  const user = await User.findById(req.user.id);

  const session = user.sessions.find(
    (s) => s.sessionId === req.params.sessionId
  );

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found.",
    });
  }

  session.isActive = false;

  await user.save();

  res.json({
    success: true,
    message: "Device logged out.",
  });
};

// ======================================================
// LOGOUT ALL DEVICES
// ======================================================

const logoutAllDevices = async (req, res) => {
  const user = await User.findById(req.user.id);

  user.sessions.forEach((session) => {
    session.isActive = false;
  });

  await user.save();

  res.json({
    success: true,
    message: "Logged out from all devices.",
  });
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = User;

module.exports.createSession = createSession;
module.exports.rotateRefreshToken = rotateRefreshToken;
module.exports.blacklistToken = blacklistToken;
module.exports.isBlacklisted = isBlacklisted;
module.exports.saveLoginHistory = saveLoginHistory;
module.exports.getSessions = getSessions;
module.exports.logoutDevice = logoutDevice;
module.exports.logoutAllDevices = logoutAllDevices;