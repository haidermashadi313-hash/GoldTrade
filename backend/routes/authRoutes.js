// ======================================================
// GoldTrade V18 Enterprise - Auth Routes
// PART 1/2 (Production)
// Render + Vercel + PM2 + Ubuntu Compatible
// ======================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

const User = require("../models/User");
const { verifyToken } = require("../middleware/auth");

// ======================================================
// JWT TOKEN GENERATOR
// ======================================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || "user",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "30d",
    }
  );
};

// ======================================================
// AUTH HEALTH CHECK
// GET /api/auth
// ======================================================

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GoldTrade V18 Auth API Running",
    version: "V18 Enterprise",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// USER SIGNUP
// POST /api/auth/signup
// ======================================================

router.post("/signup", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      phone,
      country,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required.",
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters.",
      });
    }

    const usernameExists = await User.findOne({
      username: cleanUsername,
    });

    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    const emailExists = await User.findOne({
      email: cleanEmail,
    });

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,

      fullName: fullName?.trim() || "",
      phone: phone?.trim() || "",
      country: country?.trim() || "",

      role: "user",
      isActive: true,

      wallet: 0,
      pkrBalance: 0,
      usdtBalance: 0,
      goldBalance: 0,
      lastLogin: null,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        wallet: newUser.wallet,
        pkrBalance: newUser.pkrBalance,
        usdtBalance: newUser.usdtBalance,
        goldBalance: newUser.goldBalance,
      },
    });

  } catch (error) {
    console.error("SIGNUP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Signup failed.",
      error: error.message,
    });
  }
});

// ======================================================
// USER LOGIN (PRODUCTION FIX)
// POST /api/auth/login
// ======================================================

router.post("/login", async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    username = username.trim().toLowerCase();
    password = password.toString();

    console.log("LOGIN REQUEST:", username);

    const user = await User.findOne({
      $or: [
        { username },
        { email: username },
      ],
    }).select("+password");

    if (!user) {
      console.log("LOGIN FAILED: USER NOT FOUND");

      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account disabled by administrator.",
      });
    }

    const passwordMatched = await bcrypt.compare(password, user.password);

    console.log("PASSWORD MATCH:", passwordMatched);

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName || "",
        phone: user.phone || "",
        country: user.country || "",
        wallet: user.wallet || 0,
        pkrBalance: user.pkrBalance || 0,
        usdtBalance: user.usdtBalance || 0,
        goldBalance: user.goldBalance || 0,
        lastLogin: user.lastLogin,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
});
// ======================================================
// AUTH CHECK
// GET /api/auth/check
// ======================================================

router.get("/check", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token is valid.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName || "",
        phone: user.phone || "",
        country: user.country || "",
        wallet: user.wallet || 0,
        pkrBalance: user.pkrBalance || 0,
        usdtBalance: user.usdtBalance || 0,
        goldBalance: user.goldBalance || 0,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error("AUTH CHECK ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
});

// ======================================================
// GET USER PROFILE
// GET /api/auth/profile
// ======================================================

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("PROFILE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to load profile.",
    });
  }
});

// ======================================================
// UPDATE USER PROFILE
// PUT /api/auth/profile
// ======================================================

router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { fullName, phone, country, email } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (typeof fullName === "string")
      user.fullName = fullName.trim();

    if (typeof phone === "string")
      user.phone = phone.trim();

    if (typeof country === "string")
      user.country = country.trim();

    if (typeof email === "string") {
      const cleanEmail = email.trim().toLowerCase();

      if (cleanEmail !== user.email) {
        const exists = await User.findOne({ email: cleanEmail });

        if (exists && exists._id.toString() !== user._id.toString()) {
          return res.status(409).json({
            success: false,
            message: "Email already exists.",
          });
        }

        user.email = cleanEmail;
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Profile update failed.",
    });
  }
});

// ======================================================
// CHANGE PASSWORD
// POST /api/auth/change-password
// ======================================================

router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must contain at least 6 characters.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const passwordMatched = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });

  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to change password.",
    });
  }
});

// ======================================================
// LOGOUT
// POST /api/auth/logout
// ======================================================

router.post("/logout", verifyToken, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Logout failed.",
    });
  }
});

// ======================================================
// DELETE ACCOUNT
// DELETE /api/auth/delete-account
// ======================================================

router.delete("/delete-account", verifyToken, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error.message);

    return res.status(500).json({
      success: false,
      message: "Delete account failed.",
    });
  }
});

// ======================================================
// AUTH API PING
// GET /api/auth/ping
// ======================================================

router.get("/ping", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GoldTrade V18 Auth API Working",
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ======================================================
// AUTH API 404 HANDLER
// ======================================================

router.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Auth API route not found.",
    route: req.originalUrl,
  });
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;