// @ts-nocheck
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

// ======================================================
// Generate Access Token
// ======================================================

const generateAccessToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    ACCESS_SECRET,
    { expiresIn: "30m" }
  );
};

// ======================================================
// Generate Refresh Token
// ======================================================

const generateRefreshToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id,
    },
    REFRESH_SECRET,
    { expiresIn: "30d" }
  );
};

// ======================================================
// REGISTER USER
// POST /api/v1/auth/register
// ======================================================

export const register = async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      username,
      email,
      password,
      country,
      referralCode,
    } = req.body;

    const exists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Username or Email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName,
      username,
      email,
      password: hashedPassword,
      country,
      referralCode,
      role: "USER",
      accountStatus: "ACTIVE",
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Registration successful.",
      accessToken,
      refreshToken,
      user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// LOGIN USER
// POST /api/v1/auth/login
// ======================================================

export const login = async (req: Request, res: Response) => {
  try {
    const { emailOrUsername, password } = req.body;

    const user = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();

    await user.save();

    res.json({
      success: true,
      message: "Login successful.",
      accessToken,
      refreshToken,
      user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/auth.controller.ts
// SECTION 2/10
// REFRESH TOKEN + LOGOUT + PROFILE + SESSION MANAGEMENT
// ======================================================

// ======================================================
// REFRESH ACCESS TOKEN
// POST /api/v1/auth/refresh-token
// ======================================================

export const refreshAccessToken = async (
  req: Request,
  res: Response
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const decoded: any = jwt.verify(refreshToken, REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

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
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Refresh token expired or invalid.",
    });
  }
};

// ======================================================
// LOGOUT USER
// POST /api/v1/auth/logout
// ======================================================

export const logout = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      refreshToken: null,
      lastLogout: new Date(),
    });

    res.json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET CURRENT USER PROFILE
// GET /api/v1/auth/me
// ======================================================

export const getMyProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .select("-password -refreshToken")
      .populate("wallet")
      .populate("portfolio")
      .populate("kyc");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SESSION INFORMATION
// GET /api/v1/auth/session
// ======================================================

export const getSessionInfo = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id).select(
      "lastLogin lastLogout role accountStatus createdAt"
    );

    res.json({
      success: true,
      session: {
        currentLogin: user?.lastLogin,
        lastLogout: user?.lastLogout,
        role: user?.role,
        accountStatus: user?.accountStatus,
        memberSince: user?.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE LAST ACTIVE TIME
// ======================================================

export const updateLastActive = async (
  req: Request,
  res: Response
) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      lastActiveAt: new Date(),
    });

    res.json({
      success: true,
      message: "Activity updated.",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GOLDTRADE V17 ENTERPRISE
// SECTION 3/10
// PASSWORD SECURITY ENGINE
// ======================================================

// ======================================================
// CHANGE PASSWORD
// POST /api/v1/auth/change-password
// ======================================================

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch)
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });

    const usedBefore = await Promise.all(
      (user.passwordHistory || []).map((hash) =>
        bcrypt.compare(newPassword, hash)
      )
    );

    if (usedBefore.includes(true))
      return res.status(400).json({
        success: false,
        message: "Use a new password. Previous passwords are not allowed.",
      });

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.passwordHistory.unshift(user.password);

    user.passwordHistory = user.passwordHistory.slice(0, 5);

    user.password = hashedPassword;

    user.passwordChangedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SET SECURITY PIN
// POST /api/v1/auth/security-pin
// ======================================================

export const setSecurityPin = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    const { securityPin } = req.body;

    user.securityPin = await bcrypt.hash(securityPin, 10);

    await user.save();

    res.json({
      success: true,
      message: "Security PIN saved successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// FORGOT PASSWORD (NO EMAIL / NO OTP)
// POST /api/v1/auth/forgot-password
// ======================================================

export const forgotPassword = async (req, res) => {
  try {
    const { username, securityPin, newPassword } = req.body;

    const user = await User.findOne({ username });

    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });

    const pinMatch = await bcrypt.compare(
      securityPin,
      user.securityPin
    );

    if (!pinMatch)
      return res.status(401).json({
        success: false,
        message: "Invalid security PIN.",
      });

    user.password = await bcrypt.hash(newPassword, 12);

    user.passwordChangedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: "Password reset successful.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// LOGIN ATTEMPT TRACKER
// ======================================================

export const updateLoginAttempts = async (user, success) => {
  if (success) {
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
    return user.save();
  }

  user.failedLoginAttempts += 1;

  if (user.failedLoginAttempts >= 5) {
    const lockMinutes = 30;

    user.accountLockedUntil = new Date(
      Date.now() + lockMinutes * 60 * 1000
    );

    user.failedLoginAttempts = 0;
  }

  await user.save();
};

// ======================================================
// CHECK ACCOUNT LOCK
// ======================================================

export const isAccountLocked = (user) => {
  if (!user.accountLockedUntil) return false;

  return user.accountLockedUntil > new Date();
};

// ======================================================
// UNLOCK ACCOUNT
// ======================================================

export const unlockAccount = async (req, res) => {
  try {
    const { username, securityPin } = req.body;

    const user = await User.findOne({ username });

    if (!user)
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });

    const pinMatch = await bcrypt.compare(
      securityPin,
      user.securityPin
    );

    if (!pinMatch)
      return res.status(401).json({
        success: false,
        message: "Invalid Security PIN.",
      });

    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;

    await user.save();

    res.json({
      success: true,
      message: "Account unlocked successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// FORCE PASSWORD RESET FLAG
// ======================================================

export const forcePasswordReset = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.forcePasswordReset = true;

    await user.save();

    res.json({
      success: true,
      message: "Password reset required on next login.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};// ======================================================
// SECTION 4/10 START
// ROLE MANAGEMENT + ACCOUNT STATUS APIS
// ======================================================

// ======================================================
// GET CURRENT USER ROLE
// GET /api/v1/auth/my-role
// ======================================================

export const getMyRole = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select(
      "role accountStatus fullName username email"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      role: user.role,
      accountStatus: user.accountStatus,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE USER ROLE (SUPER ADMIN)
// PATCH /api/v1/auth/update-role/:id
// ======================================================

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || admin.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can change roles.",
      });
    }

    const { role } = req.body;

    if (!["USER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password -refreshToken");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      message: "Role updated successfully.",
      user: updatedUser,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE ACCOUNT STATUS
// PATCH /api/v1/auth/account-status/:id
// ======================================================

export const updateAccountStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const { accountStatus } = req.body;

    const allowedStatus = [
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
      "BLOCKED",
    ];

    if (!allowedStatus.includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        accountStatus,
        accountStatusUpdatedAt: new Date(),
      },
      { new: true }
    ).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      message: "Account status updated.",
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ACCOUNT STATUS
// GET /api/v1/auth/account-status
// ======================================================

export const getAccountStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id).select(
      "accountStatus role lastLogin lastActiveAt"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      accountStatus: user.accountStatus,
      role: user.role,
      lastLogin: user.lastLogin,
      lastActiveAt: user.lastActiveAt,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DEACTIVATE OWN ACCOUNT
// PATCH /api/v1/auth/deactivate
// ======================================================

export const deactivateMyAccount = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        accountStatus: "INACTIVE",
        refreshToken: null,
        lastLogout: new Date(),
      },
      { new: true }
    ).select("-password -refreshToken");

    return res.json({
      success: true,
      message: "Your account has been deactivated.",
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// REACTIVATE ACCOUNT
// PATCH /api/v1/auth/reactivate
// ======================================================

export const reactivateMyAccount = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        accountStatus: "ACTIVE",
      },
      { new: true }
    ).select("-password -refreshToken");

    return res.json({
      success: true,
      message: "Account reactivated successfully.",
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN - GET USER SUMMARY
// GET /api/v1/auth/user-summary/:id
// ======================================================

export const getUserSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const user = await User.findById(req.params.id)
      .select("-password -refreshToken")
      .populate("wallet")
      .populate("portfolio")
      .populate("kyc");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 4/10 END
// ======================================================// ======================================================
// SECTION 5/10 START
// DEVICE SESSION MANAGEMENT + LOGIN HISTORY
// ======================================================

import crypto from "crypto";

// ======================================================
// GENERATE UNIQUE SESSION ID
// ======================================================

const generateSessionId = () => {
  return crypto.randomBytes(16).toString("hex");
};

// ======================================================
// CREATE LOGIN SESSION
// ======================================================

export const createLoginSession = async (
  user: any,
  req: Request
) => {
  const sessionId = generateSessionId();

  const refreshToken = jwt.sign(
    {
      id: user._id,
      sessionId,
    },
    REFRESH_SECRET,
    { expiresIn: "30d" }
  );

  const session = {
    sessionId,
    refreshToken,
    deviceName:
      req.headers["x-device-name"] || "Unknown Device",
    platform:
      req.headers["x-platform"] || "Unknown Platform",
    browser:
      req.headers["x-browser"] || "Unknown Browser",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"] || "",
    loginAt: new Date(),
    lastActiveAt: new Date(),
    expiresAt: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ),
    isActive: true,
  };

  user.sessions.push(session);

  user.loginHistory.unshift({
    loginAt: new Date(),
    ipAddress: req.ip,
    browser: session.browser,
    platform: session.platform,
    deviceName: session.deviceName,
    success: true,
  });

  user.loginHistory = user.loginHistory.slice(0, 100);

  await user.save();

  return { sessionId, refreshToken };
};

// ======================================================
// REFRESH TOKEN ROTATION
// POST /api/v1/auth/refresh-token
// ======================================================

export const rotateRefreshToken = async (
  req: Request,
  res: Response
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required.",
      });
    }

    const decoded: any = jwt.verify(
      refreshToken,
      REFRESH_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session.",
      });
    }

    const oldSession = user.sessions.find(
      (s: any) =>
        s.sessionId === decoded.sessionId &&
        s.isActive === true
    );

    if (!oldSession) {
      return res.status(401).json({
        success: false,
        message: "Session expired.",
      });
    }

    oldSession.isActive = false;

    const sessionId = generateSessionId();

    const newRefreshToken = jwt.sign(
      {
        id: user._id,
        sessionId,
      },
      REFRESH_SECRET,
      { expiresIn: "30d" }
    );

    user.sessions.push({
      sessionId,
      refreshToken: newRefreshToken,
      deviceName: oldSession.deviceName,
      platform: oldSession.platform,
      browser: oldSession.browser,
      ipAddress: oldSession.ipAddress,
      userAgent: oldSession.userAgent,
      loginAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ),
      isActive: true,
    });

    const accessToken = generateAccessToken(user);

    await user.save();

    return res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: "Refresh token expired.",
    });
  }
};

// ======================================================
// GET ALL ACTIVE DEVICES
// GET /api/v1/auth/devices
// ======================================================

export const getMyDevices = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id).select(
      "sessions"
    );

    return res.json({
      success: true,
      totalDevices:
        user.sessions.filter((s: any) => s.isActive).length,
      devices: user.sessions.filter((s: any) => s.isActive),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE LAST ACTIVE DEVICE
// ======================================================

export const updateDeviceActivity = async (
  req: Request,
  res: Response
) => {
  try {
    const { sessionId } = req.body;

    const user = await User.findById(req.user.id);

    const session = user.sessions.find(
      (s: any) =>
        s.sessionId === sessionId &&
        s.isActive
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    session.lastActiveAt = new Date();

    await user.save();

    return res.json({
      success: true,
      message: "Session updated.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// LOGOUT SINGLE DEVICE
// DELETE /api/v1/auth/device/:sessionId
// ======================================================

export const logoutDevice = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id);

    const session = user.sessions.find(
      (s: any) =>
        s.sessionId === req.params.sessionId
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Device not found.",
      });
    }

    session.isActive = false;
    session.lastActiveAt = new Date();

    await user.save();

    return res.json({
      success: true,
      message: "Device logged out successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// LOGOUT ALL DEVICES
// POST /api/v1/auth/logout-all
// ======================================================

export const logoutAllDevices = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id);

    user.sessions.forEach((session: any) => {
      session.isActive = false;
      session.lastActiveAt = new Date();
    });

    user.refreshToken = null;
    user.lastLogout = new Date();

    await user.save();

    return res.json({
      success: true,
      message: "Logged out from all devices.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET LOGIN HISTORY
// GET /api/v1/auth/login-history
// ======================================================

export const getLoginHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id).select(
      "loginHistory"
    );

    return res.json({
      success: true,
      totalLogins: user.loginHistory.length,
      history: user.loginHistory,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 5/10 END
// ======================================================// ======================================================
// SECTION 6/10 START
// AUTO USER REGISTRATION BUSINESS LOGIC
// ======================================================

// Wallet, Portfolio, GoldVault aur Referral models ko file ke top imports me add karo.
import Wallet from "../models/Wallet";
import Portfolio from "../models/Portfolio";
import GoldVault from "../models/GoldVault";
import Transaction from "../models/Transaction";

// ======================================================
// GENERATE REFERRAL CODE
// ======================================================

const generateReferralCode = (username: string) => {
  const random = Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase();

  return `GT-${username.substring(0, 3).toUpperCase()}-${random}`;
};

// ======================================================
// CREATE DEFAULT WALLET
// ======================================================

const createDefaultWallet = async (userId: string) => {
  return await Wallet.create({
    user: userId,

    balances: {
      PKR: 0,
      USD: 0,
      AED: 0,
      SAR: 0,
      EUR: 0,
      GBP: 0,
      USDT: 0,
    },

    goldBalance: {
      totalGrams: 0,
      availableGrams: 0,
      lockedGrams: 0,
    },

    walletStatus: "ACTIVE",
  });
};

// ======================================================
// CREATE DEFAULT PORTFOLIO
// ======================================================

const createDefaultPortfolio = async (
  userId: string,
  walletId: string
) => {
  return await Portfolio.create({
    user: userId,

    portfolioName: "Primary Portfolio",

    portfolioType: "INDIVIDUAL",

    status: "ACTIVE",

    linkedAccounts: {
      wallet: walletId,
      goldVaults: [],
      bankAccounts: [],
      tradeOrders: [],
      transactions: [],
    },
  });
};

// ======================================================
// CREATE DEFAULT GOLD VAULT
// ======================================================

const createDefaultGoldVault = async (
  userId: string,
  walletId: string
) => {
  return await GoldVault.create({
    user: userId,

    wallet: walletId,

    vaultName: "Main Gold Vault",

    vaultType: "DIGITAL",

    totalGoldGram: 0,

    availableGoldGram: 0,

    lockedGoldGram: 0,

    vaultStatus: "ACTIVE",
  });
};

// ======================================================
// CREATE WELCOME BONUS
// ======================================================

const createWelcomeBonus = async (
  userId: string,
  walletId: string
) => {
  const bonusPKR = 1000;
  const bonusGoldGram = 0.05;

  await Wallet.findByIdAndUpdate(walletId, {
    $inc: {
      "balances.PKR": bonusPKR,
      "goldBalance.totalGrams": bonusGoldGram,
      "goldBalance.availableGrams": bonusGoldGram,
    },
  });

  await Transaction.create({
    user: userId,

    wallet: walletId,

    transactionType: "WELCOME_BONUS",

    amountPKR: bonusPKR,

    goldGram: bonusGoldGram,

    status: "COMPLETED",

    description: "GoldTrade Welcome Bonus",
  });
};

// ======================================================
// APPLY REFERRAL BONUS
// ======================================================

const applyReferralBonus = async (
  newUserId: string,
  referralCode: string
) => {
  const referrer = await User.findOne({ referralCode });

  if (!referrer) return;

  const referrerWallet = await Wallet.findOne({
    user: referrer._id,
  });

  const referralBonusPKR = 500;
  const referralBonusGoldGram = 0.02;

  await Wallet.findByIdAndUpdate(referrerWallet._id, {
    $inc: {
      "balances.PKR": referralBonusPKR,
      "goldBalance.totalGrams": referralBonusGoldGram,
      "goldBalance.availableGrams": referralBonusGoldGram,
    },
  });

  await User.findByIdAndUpdate(referrer._id, {
    $inc: {
      totalReferrals: 1,
    },
  });

  await Transaction.create({
    user: referrer._id,

    wallet: referrerWallet._id,

    transactionType: "REFERRAL_BONUS",

    amountPKR: referralBonusPKR,

    goldGram: referralBonusGoldGram,

    status: "COMPLETED",

    description: `Referral bonus from user ${newUserId}`,
  });

  await User.findByIdAndUpdate(newUserId, {
    referredBy: referrer._id,
  });
};

// ======================================================
// COMPLETE USER REGISTRATION SETUP
// ======================================================

const completeRegistrationSetup = async (
  user: any,
  referralCode?: string
) => {
  // Wallet
  const wallet = await createDefaultWallet(user._id);

  // Portfolio
  const portfolio = await createDefaultPortfolio(
    user._id,
    wallet._id
  );

  // Gold Vault
  const vault = await createDefaultGoldVault(
    user._id,
    wallet._id
  );

  // Welcome Bonus
  await createWelcomeBonus(user._id, wallet._id);

  // Referral
  if (referralCode) {
    await applyReferralBonus(user._id, referralCode);
  }

  // Update User References
  user.wallet = wallet._id;
  user.portfolio = portfolio._id;
  user.goldVault = vault._id;

  user.referralCode = generateReferralCode(user.username);

  await user.save();

  return {
    wallet,
    portfolio,
    vault,
  };
};

// Registration setup is intentionally invoked from inside register().

// ======================================================
// SECTION 6/10 END
// ======================================================// ======================================================
// SECTION 7/10 START
// LOGIN ANALYTICS + USER ACTIVITY + SECURITY EVENTS
// ======================================================

// ======================================================
// UPDATE USER LAST ACTIVE
// PATCH /api/v1/auth/activity
// ======================================================

export const updateUserActivity = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.lastActiveAt = new Date();

    if (user.sessions?.length) {
      const session = user.sessions.find(
        (s: any) => s.isActive === true
      );

      if (session) {
        session.lastActiveAt = new Date();
      }
    }

    await user.save();

    return res.json({
      success: true,
      message: "Activity updated successfully.",
      lastActiveAt: user.lastActiveAt,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET LOGIN ANALYTICS
// GET /api/v1/auth/login-analytics
// ======================================================

export const getLoginAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id).select(
      "loginHistory lastLogin createdAt sessions"
    );

    const successfulLogins =
      user.loginHistory.filter((l: any) => l.success).length;

    const failedLogins =
      user.loginHistory.filter((l: any) => !l.success).length;

    const activeSessions =
      user.sessions.filter((s: any) => s.isActive).length;

    return res.json({
      success: true,

      analytics: {
        accountCreatedAt: user.createdAt,
        lastLogin: user.lastLogin,
        successfulLogins,
        failedLogins,
        activeSessions,
        totalLoginRecords: user.loginHistory.length,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET RECENT LOGIN DEVICES
// GET /api/v1/auth/recent-devices
// ======================================================

export const getRecentDevices = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id).select(
      "loginHistory"
    );

    const recentDevices = user.loginHistory.slice(0, 10);

    return res.json({
      success: true,
      devices: recentDevices,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// RECORD FAILED LOGIN
// ======================================================

export const recordFailedLogin = async (
  username: string,
  req: Request
) => {
  try {
    const user = await User.findOne({ username });

    if (!user) return;

    user.loginHistory.unshift({
      loginAt: new Date(),
      ipAddress: req.ip,
      browser: req.headers["x-browser"] || "Unknown Browser",
      platform: req.headers["x-platform"] || "Unknown Platform",
      deviceName:
        req.headers["x-device-name"] || "Unknown Device",
      success: false,
    });

    user.loginHistory = user.loginHistory.slice(0, 100);

    await user.save();
  } catch (error) {
    console.error("Failed login history error:", error);
  }
};

// ======================================================
// GET ACCOUNT SECURITY EVENTS
// GET /api/v1/auth/security-events
// ======================================================

export const getSecurityEvents = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id).select(
      "loginHistory failedLoginAttempts accountLockedUntil passwordChangedAt lastLogout"
    );

    return res.json({
      success: true,

      security: {
        failedLoginAttempts: user.failedLoginAttempts,
        accountLockedUntil: user.accountLockedUntil,
        passwordChangedAt: user.passwordChangedAt,
        lastLogout: user.lastLogout,
        recentEvents: user.loginHistory.slice(0, 20),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CLEAR LOGIN HISTORY
// DELETE /api/v1/auth/login-history
// ======================================================

export const clearLoginHistory = async (
  req: Request,
  res: Response
) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      loginHistory: [],
    });

    return res.json({
      success: true,
      message: "Login history cleared successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ACCOUNT OVERVIEW
// GET /api/v1/auth/account-overview
// ======================================================

export const getAccountOverview = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id)
      .select(
        "fullName username email role accountStatus lastLogin lastActiveAt createdAt loginHistory sessions"
      )
      .populate("wallet")
      .populate("portfolio");

    return res.json({
      success: true,

      overview: {
        profile: {
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
        },

        activity: {
          lastLogin: user.lastLogin,
          lastActiveAt: user.lastActiveAt,
          memberSince: user.createdAt,
        },

        security: {
          activeDevices: user.sessions.filter((s: any) => s.isActive).length,
          loginHistoryCount: user.loginHistory.length,
        },

        wallet: user.wallet,
        portfolio: user.portfolio,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 7/10 END
// ======================================================// ======================================================
// SECTION 8/10 START
// ADMIN AUTHENTICATION + ADMIN DASHBOARD ACCESS
// ======================================================

// ======================================================
// ADMIN LOGIN
// POST /api/v1/auth/admin/login
// ======================================================

export const adminLogin = async (
  req: Request,
  res: Response
) => {
  try {
    const { emailOrUsername, password } = req.body;

    const admin = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername },
      ],
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin account not found.",
      });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "This account is not an admin account.",
      });
    }

    if (admin.accountStatus !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: `Account is ${admin.accountStatus}.`,
      });
    }

    const passwordMatched = await bcrypt.compare(
      password,
      admin.password
    );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid password.",
      });
    }

    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);

    admin.refreshToken = refreshToken;
    admin.lastLogin = new Date();

    await admin.save();

    return res.json({
      success: true,
      message: "Admin login successful.",
      accessToken,
      refreshToken,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN PROFILE
// GET /api/v1/auth/admin/profile
// ======================================================

export const getAdminProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id).select(
      "-password -refreshToken"
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    return res.json({
      success: true,
      admin,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN DASHBOARD SUMMARY
// GET /api/v1/auth/admin/dashboard-summary
// ======================================================

export const getAdminDashboardSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      accountStatus: "ACTIVE",
    });
    const suspendedUsers = await User.countDocuments({
      accountStatus: "SUSPENDED",
    });
    const blockedUsers = await User.countDocuments({
      accountStatus: "BLOCKED",
    });

    const totalAdmins = await User.countDocuments({
      role: "ADMIN",
    });

    const totalSuperAdmins = await User.countDocuments({
      role: "SUPER_ADMIN",
    });

    return res.json({
      success: true,
      dashboard: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        blockedUsers,
        totalAdmins,
        totalSuperAdmins,
        generatedAt: new Date(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET USERS LIST
// GET /api/v1/auth/admin/users
// ======================================================

export const getAllUsers = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    return res.json({
      success: true,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
      users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SEARCH USERS
// GET /api/v1/auth/admin/search-users
// ======================================================

export const searchUsers = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const keyword = String(req.query.keyword || "").trim();

    const users = await User.find({
      $or: [
        { fullName: { $regex: keyword, $options: "i" } },
        { username: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
      ],
    }).select("-password -refreshToken");

    return res.json({
      success: true,
      totalResults: users.length,
      users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN ACCOUNT VALIDATION
// GET /api/v1/auth/admin/validate
// ======================================================

export const validateAdminSession = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id).select(
      "role accountStatus lastLogin lastActiveAt"
    );

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        valid: false,
        message: "Invalid admin session.",
      });
    }

    return res.json({
      success: true,
      valid: true,
      adminRole: admin.role,
      accountStatus: admin.accountStatus,
      lastLogin: admin.lastLogin,
      lastActiveAt: admin.lastActiveAt,
    });
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      valid: false,
      message: "Session validation failed.",
    });
  }
};

// ======================================================
// SUPER ADMIN ACCOUNT LIST
// GET /api/v1/auth/admin/super-admins
// ======================================================

export const getSuperAdminList = async (
  req: Request,
  res: Response
) => {
  try {
    const currentAdmin = await User.findById(req.user.id);

    if (!currentAdmin || currentAdmin.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can access this resource.",
      });
    }

    const superAdmins = await User.find({
      role: "SUPER_ADMIN",
    }).select("-password -refreshToken");

    return res.json({
      success: true,
      total: superAdmins.length,
      superAdmins,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN LOGOUT
// POST /api/v1/auth/admin/logout
// ======================================================

export const adminLogout = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found.",
      });
    }

    admin.refreshToken = null;
    admin.lastLogout = new Date();

    if (admin.sessions?.length) {
      admin.sessions.forEach((session: any) => {
        session.isActive = false;
      });
    }

    await admin.save();

    return res.json({
      success: true,
      message: "Admin logged out successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 8/10 END
// ======================================================// ======================================================
// SECTION 9/10 START
// KYC APPROVAL + USER STATUS MANAGEMENT + ADMIN AUDIT
// ======================================================

// ======================================================
// GET PENDING KYC USERS
// GET /api/v1/auth/admin/pending-kyc
// ======================================================

export const getPendingKYCUsers = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const users = await User.find({
      kycStatus: "PENDING",
    })
      .select(
        "fullName username email phone kycStatus createdAt country"
      )
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// APPROVE KYC
// PATCH /api/v1/auth/admin/kyc/:userId/approve
// ======================================================

export const approveKYC = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.kycStatus = "APPROVED";
    user.kycApprovedAt = new Date();
    user.kycApprovedBy = admin._id;

    user.auditLogs.unshift({
      action: "KYC_APPROVED",
      performedBy: admin._id,
      performedByRole: admin.role,
      performedAt: new Date(),
      note: "KYC approved by admin.",
    });

    user.auditLogs = user.auditLogs.slice(0, 300);

    await user.save();

    return res.json({
      success: true,
      message: "KYC approved successfully.",
      kycStatus: user.kycStatus,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// REJECT KYC
// PATCH /api/v1/auth/admin/kyc/:userId/reject
// ======================================================

export const rejectKYC = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const { reason } = req.body;

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.kycStatus = "REJECTED";
    user.kycRejectedReason = reason || "No reason provided.";
    user.kycRejectedAt = new Date();

    user.auditLogs.unshift({
      action: "KYC_REJECTED",
      performedBy: admin._id,
      performedByRole: admin.role,
      performedAt: new Date(),
      note: reason || "KYC rejected.",
    });

    await user.save();

    return res.json({
      success: true,
      message: "KYC rejected.",
      reason: user.kycRejectedReason,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UPDATE USER ACCOUNT STATUS
// PATCH /api/v1/auth/admin/account-status/:userId
// ======================================================

export const updateUserAccountStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const { accountStatus, reason } = req.body;

    const allowed = [
      "ACTIVE",
      "INACTIVE",
      "SUSPENDED",
      "BLOCKED",
    ];

    if (!allowed.includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status.",
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.accountStatus = accountStatus;
    user.accountStatusUpdatedAt = new Date();

    user.auditLogs.unshift({
      action: `ACCOUNT_${accountStatus}`,
      performedBy: admin._id,
      performedByRole: admin.role,
      performedAt: new Date(),
      note: reason || `Account changed to ${accountStatus}`,
    });

    await user.save();

    return res.json({
      success: true,
      message: `Account ${accountStatus.toLowerCase()} successfully.`,
      accountStatus: user.accountStatus,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET USER AUDIT LOGS
// GET /api/v1/auth/admin/audit/:userId
// ======================================================

export const getUserAuditLogs = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const user = await User.findById(req.params.userId).select(
      "fullName username auditLogs"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user: {
        fullName: user.fullName,
        username: user.username,
      },
      totalLogs: user.auditLogs.length,
      auditLogs: user.auditLogs,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DELETE USER (SUPER ADMIN ONLY)
// DELETE /api/v1/auth/admin/user/:userId
// ======================================================

export const deleteUserAccount = async (
  req: Request,
  res: Response
) => {
  try {
    const superAdmin = await User.findById(req.user.id);

    if (!superAdmin || superAdmin.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only Super Admin can delete users.",
      });
    }

    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role === "SUPER_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Super Admin account cannot be deleted.",
      });
    }

    await User.findByIdAndDelete(user._id);

    return res.json({
      success: true,
      message: "User deleted successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ACCOUNT STATUS COUNTS
// GET /api/v1/auth/admin/account-summary
// ======================================================

export const getAccountSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const summary = {
      active: await User.countDocuments({
        accountStatus: "ACTIVE",
      }),
      inactive: await User.countDocuments({
        accountStatus: "INACTIVE",
      }),
      suspended: await User.countDocuments({
        accountStatus: "SUSPENDED",
      }),
      blocked: await User.countDocuments({
        accountStatus: "BLOCKED",
      }),
      pendingKYC: await User.countDocuments({
        kycStatus: "PENDING",
      }),
      approvedKYC: await User.countDocuments({
        kycStatus: "APPROVED",
      }),
      rejectedKYC: await User.countDocuments({
        kycStatus: "REJECTED",
      }),
    };

    return res.json({
      success: true,
      summary,
      generatedAt: new Date(),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 9/10 END
// ======================================================// ======================================================
// SECTION 10/10 START
// PROFILE UPDATE + ACCOUNT DELETION REQUEST + HEALTH CHECK
// ======================================================

// ======================================================
// UPDATE USER PROFILE
// PATCH /api/v1/auth/profile
// ======================================================

export const updateProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const allowedFields = [
      "fullName",
      "username",
      "country",
      "city",
      "address",
      "profileImage",
      "dateOfBirth",
    ];

    const updates: Record<string, any> = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...updates,
        updatedAt: new Date(),
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DELETE ACCOUNT REQUEST
// POST /api/v1/auth/delete-account-request
// ======================================================

export const requestAccountDeletion = async (
  req: Request,
  res: Response
) => {
  try {
    const { password, reason } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const passwordMatched = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password.",
      });
    }

    user.deletionRequest = {
      requested: true,
      requestedAt: new Date(),
      reason: reason || "User requested account deletion.",
      status: "PENDING",
    };

    await user.save();

    return res.json({
      success: true,
      message: "Account deletion request submitted.",
      status: "PENDING",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CANCEL ACCOUNT DELETION REQUEST
// DELETE /api/v1/auth/delete-account-request
// ======================================================

export const cancelAccountDeletionRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.deletionRequest = {
      requested: false,
      requestedAt: null,
      reason: "",
      status: "CANCELLED",
    };

    await user.save();

    return res.json({
      success: true,
      message: "Deletion request cancelled.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ACCOUNT HEALTH
// GET /api/v1/auth/health
// ======================================================

export const getAuthHealth = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id).select(
      "accountStatus role lastLogin lastActiveAt sessions failedLoginAttempts kycStatus"
    );

    const activeSessions = user.sessions.filter(
      (s: any) => s.isActive
    ).length;

    return res.json({
      success: true,
      health: {
        accountStatus: user.accountStatus,
        role: user.role,
        kycStatus: user.kycStatus,
        lastLogin: user.lastLogin,
        lastActiveAt: user.lastActiveAt,
        activeSessions,
        failedLoginAttempts: user.failedLoginAttempts,
        serverTime: new Date(),
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// VERIFY ACCESS TOKEN
// GET /api/v1/auth/verify-token
// ======================================================

export const verifyAccessToken = async (
  req: Request,
  res: Response
) => {
  return res.json({
    success: true,
    valid: true,
    userId: req.user.id,
    role: req.user.role,
    timestamp: new Date(),
  });
};

// ======================================================
// LOGOUT CURRENT SESSION ONLY
// POST /api/v1/auth/logout-current-session
// ======================================================

export const logoutCurrentSession = async (
  req: Request,
  res: Response
) => {
  try {
    const { sessionId } = req.body;

    const user = await User.findById(req.user.id);

    const session = user.sessions.find(
      (s: any) => s.sessionId === sessionId && s.isActive
    );

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found.",
      });
    }

    session.isActive = false;
    session.lastActiveAt = new Date();

    await user.save();

    return res.json({
      success: true,
      message: "Current session logged out.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// AUTH SYSTEM INFO
// GET /api/v1/auth/system-info
// ======================================================

export const getAuthSystemInfo = async (
  req: Request,
  res: Response
) => {
  return res.json({
    success: true,
    system: {
      application: "GoldTrade V17 Enterprise",
      authVersion: "v17.0.0",
      authentication: "JWT Access + Refresh Token",
      emailVerification: false,
      phoneVerification: false,
      refreshRotation: true,
      multiDeviceSupport: true,
      accountLockProtection: true,
      roles: ["USER", "ADMIN", "SUPER_ADMIN"],
      timestamp: new Date(),
    },
  });
};

