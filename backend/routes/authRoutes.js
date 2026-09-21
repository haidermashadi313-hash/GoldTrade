
const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();

const User = require("../models/User");

const {
  verifyToken,
  generateAccessToken,
  generateRefreshToken,
  createLoginResponse,
} = require("../middleware/auth");

// =====================================================
// REGISTER USER
// POST /api/auth/register
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      username,
      fullName,
      email,
      password,
      phone,
      country,
      city,
    } = req.body;

    // Required fields
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, Full Name, Email and Password are required.",
      });
    }

    // Username already exists
    const existingUsername = await User.findOne({
      username: username.toLowerCase(),
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // Email already exists
    const existingEmail = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    // Create user
    const user = new User({
      username: username.toLowerCase(),
      fullName,
      email: email.toLowerCase(),
      password,
      phone,
      country,
      city,

      role: "user",

      pkrBalance: 0,
      goldBalance: 0,
      usdtBalance: 0,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
    });

  } catch (error) {
    console.error("Register Error:", error);

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
    });
  }
});

// =====================================================
// LOGIN USER
// POST /api/auth/login
// =====================================================

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and Password are required.",
      });
    }

    // Username OR Email login
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // Account disabled
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled.",
      });
    }

    // Account locked
    if (user.isAccountLocked()) {
      return res.status(403).json({
        success: false,
        message:
          "Account temporarily locked after multiple failed login attempts.",
      });
    }

    // Compare password
    const passwordMatched = await user.comparePassword(password);

    if (!passwordMatched) {
      await user.recordFailedLogin();

      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // Successful login
    await user.recordLogin(req.ip);

    // Save refresh token
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    const loginResponse = createLoginResponse(user);

    return res.json(loginResponse);

  } catch (error) {
    console.error("Login Error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});
// =====================================================
// REFRESH ACCESS TOKEN
// POST /api/auth/refresh-token
// =====================================================

router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required.",
      });
    }

    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token.",
      });
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (String(decoded.id) !== String(user._id)) {
      return res.status(401).json({
        success: false,
        message: "Refresh token does not belong to this user.",
      });
    }

    const newAccessToken = generateAccessToken(user);

    return res.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);

    return res.status(401).json({
      success: false,
      message: "Refresh token expired or invalid.",
    });
  }
});

// =====================================================
// LOGOUT USER
// POST /api/auth/logout
// =====================================================

router.post("/logout", verifyToken, async (req, res) => {
  try {
    req.user.refreshToken = "";
    await req.user.save();

    return res.json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error("Logout Error:", error);

    return res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
});

// =====================================================
// CURRENT LOGGED-IN USER
// GET /api/auth/me
// =====================================================

router.get("/me", verifyToken, async (req, res) => {
  try {
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

        kycStatus: req.user.kycStatus,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Current User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user profile.",
    });
  }
});

// =====================================================
// AUTH CHECK (Used by Frontend)
// GET /api/auth/check
// =====================================================

router.get("/check", verifyToken, async (req, res) => {
  try {
    return res.json({
      success: true,
      authenticated: true,
      user: {
        username: req.user.username,
        role: req.user.role,
        walletFrozen: req.user.walletFrozen,
      },
    });
  } catch (error) {
    console.error("Auth Check Error:", error);

    return res.status(401).json({
      success: false,
      authenticated: false,
      message: "Authentication failed.",
    });
  }
});
// =====================================================
// UPDATE USER PROFILE
// PUT /api/auth/profile
// =====================================================

router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { fullName, phone, country, city, address } = req.body;

    const user = req.user;

    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (country !== undefined) user.country = country;
    if (city !== undefined) user.city = city;
    if (address !== undefined) user.address = address;

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Profile Update Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile.",
    });
  }
});

// =====================================================
// CHANGE PASSWORD
// POST /api/auth/change-password
// =====================================================

router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    const passwordMatched = await req.user.comparePassword(currentPassword);

    if (!passwordMatched) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    req.user.password = newPassword;
    await req.user.save();

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change password.",
    });
  }
});

// =====================================================
// UPDATE EMAIL
// PUT /api/auth/email
// =====================================================

router.put("/email", verifyToken, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const exists = await User.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.user._id },
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Email already in use.",
      });
    }

    req.user.email = email.toLowerCase();
    req.user.emailVerified = false;

    await req.user.save();

    return res.json({
      success: true,
      message: "Email updated successfully.",
    });
  } catch (error) {
    console.error("Email Update Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update email.",
    });
  }
});

// =====================================================
// UPDATE PHONE
// PUT /api/auth/phone
// =====================================================

router.put("/phone", verifyToken, async (req, res) => {
  try {
    const { phone } = req.body;

    req.user.phone = phone;
    req.user.phoneVerified = false;

    await req.user.save();

    return res.json({
      success: true,
      message: "Phone number updated successfully.",
    });
  } catch (error) {
    console.error("Phone Update Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update phone number.",
    });
  }
});

// =====================================================
// UPDATE PROFILE IMAGE
// PUT /api/auth/profile-image
// =====================================================

router.put("/profile-image", verifyToken, async (req, res) => {
  try {
    const { profileImage } = req.body;

    req.user.profileImage = profileImage || "";

    await req.user.save();

    return res.json({
      success: true,
      message: "Profile image updated successfully.",
      profileImage: req.user.profileImage,
    });
  } catch (error) {
    console.error("Profile Image Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update profile image.",
    });
  }
});
// =====================================================
// FORGOT PASSWORD (Demo / Future Email Integration)
// POST /api/auth/forgot-password
// =====================================================

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: email?.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Future: Send email OTP or reset link here.
    return res.json({
      success: true,
      message: "Password reset request received.",
    });

  } catch (error) {
    console.error("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process password reset request.",
    });
  }
});

// =====================================================
// RESET PASSWORD (Admin/OTP Ready)
// POST /api/auth/reset-password
// =====================================================

router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email and new password are required.",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.password = newPassword;
    user.loginAttempts = 0;
    user.accountLockedUntil = null;
    user.refreshToken = "";

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successfully.",
    });

  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  }
});

// =====================================================
// DEACTIVATE ACCOUNT
// POST /api/auth/deactivate
// =====================================================

router.post("/deactivate", verifyToken, async (req, res) => {
  try {
    req.user.isActive = false;
    req.user.refreshToken = "";

    await req.user.save();

    return res.json({
      success: true,
      message: "Account deactivated successfully.",
    });

  } catch (error) {
    console.error("Deactivate Account Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to deactivate account.",
    });
  }
});

// =====================================================
// REACTIVATE ACCOUNT (Admin / Future OTP)
// POST /api/auth/reactivate
// =====================================================

router.post("/reactivate", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({
      email: email?.toLowerCase(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.isActive = true;
    user.loginAttempts = 0;
    user.accountLockedUntil = null;

    await user.save();

    return res.json({
      success: true,
      message: "Account reactivated successfully.",
    });

  } catch (error) {
    console.error("Reactivate Account Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reactivate account.",
    });
  }
});

// =====================================================
// LOGIN HISTORY
// GET /api/auth/login-history
// =====================================================

router.get("/login-history", verifyToken, async (req, res) => {
  try {
    return res.json({
      success: true,
      history: {
        lastLogin: req.user.lastLogin,
        lastLoginIP: req.user.lastLoginIP,
        loginAttempts: req.user.loginAttempts,
        accountLockedUntil: req.user.accountLockedUntil,
      },
    });

  } catch (error) {
    console.error("Login History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load login history.",
    });
  }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;``