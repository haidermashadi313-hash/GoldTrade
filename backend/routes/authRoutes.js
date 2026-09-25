// ======================================================
// GoldTrade V18 - Auth Routes (PART 1/4)
// Secure Authentication API
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
      id: user._id,
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
// HEALTH CHECK
// GET /api/auth
// ======================================================

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GoldTrade V18 Auth API Running",
    version: "V18",
    timestamp: new Date(),
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

    // ----------------------------
    // Validation
    // ----------------------------

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
        message: "Password must be at least 6 characters.",
      });
    }

    // ----------------------------
    // Check Existing Username
    // ----------------------------

    const usernameExists = await User.findOne({
      username: cleanUsername,
    });

    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // ----------------------------
    // Check Existing Email
    // ----------------------------

    const emailExists = await User.findOne({
      email: cleanEmail,
    });

    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    // ----------------------------
    // Hash Password
    // ----------------------------

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

       // ======================================================
    // CREATE NEW USER
    // ======================================================

    const newUser = new User({
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,

      fullName: fullName || "",
      phone: phone || "",
      country: country || "",

      role: "user",
      isActive: true,

      wallet: 0,
      pkrBalance: 0,
      usdtBalance: 0,
      goldBalance: 0,

      createdAt: new Date(),
    });

    await newUser.save();

    // ======================================================
    // GENERATE JWT
    // ======================================================

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
// USER LOGIN
// POST /api/auth/login
// GoldTrade V18 Enterprise
// ======================================================

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    const loginValue = username.trim().toLowerCase();

    // Find user by username OR email
    const user = await User.findOne({
      $or: [
        { username: loginValue },
        { email: loginValue },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // Check account status
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "Account has been disabled.",
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = generateToken(user);

    // Success Response
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
        goldBalance: user.goldBalance || 0,
        usdtBalance: user.usdtBalance || 0,
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

    return res.json({
      success: true,
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
        goldBalance: user.goldBalance || 0,
        usdtBalance: user.usdtBalance || 0,
      },
    });
  } catch (error) {
    console.error("AUTH CHECK ERROR:", error);

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
        goldBalance: user.goldBalance || 0,
        usdtBalance: user.usdtBalance || 0,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("PROFILE ERROR:", error);

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

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (country !== undefined) user.country = country.trim();

    if (email && email.trim().toLowerCase() !== user.email) {
      const exists = await User.findOne({
        email: email.trim().toLowerCase(),
      });

      if (exists && exists._id.toString() !== user._id.toString()) {
        return res.status(409).json({
          success: false,
          message: "Email already exists.",
        });
      }

      user.email = email.trim().toLowerCase();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
        country: user.country,
      },
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

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
        message: "Current and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);

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
    console.error("LOGOUT ERROR:", error);

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
    console.error("DELETE ACCOUNT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Delete account failed.",
    });
  }
});

// ======================================================
// AUTH API HEALTH CHECK
// GET /api/auth/ping
// ======================================================

router.get("/ping", (req, res) => {
  return res.json({
    success: true,
    message: "GoldTrade V18 Auth API Working",
    timestamp: new Date(),
  });
});

// ======================================================
// 404 HANDLER
// ======================================================

router.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Auth API route not found.",
  });
});

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;