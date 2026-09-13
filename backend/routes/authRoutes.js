const express = require("express");
const router = express.Router();

const User = require("../models/User");
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

// ==========================================
// AUTH ROUTES
// ==========================================

// Register
router.post("/register", authController.register);

// Login
router.post("/login", authController.login);

// Profile (Controller)
router.get("/profile", verifyToken, authController.getProfile);

// ==========================================
// CURRENT USER
// GET /api/auth/me
// ==========================================
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

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
  } catch (err) {
    console.error("Get Current User Error:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load current user.",
    });
  }
});

// ==========================================
// LOGOUT
// ==========================================
router.post("/logout", verifyToken, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

module.exports = router;