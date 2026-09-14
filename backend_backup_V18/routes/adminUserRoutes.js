const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { verifyToken } = require("../middleware/authMiddleware");

// Admin check
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }
  next();
};

// GET ALL USERS
router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ isDeleted: false }).select("-password");

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Unable to load users.",
    });
  }
});

module.exports = router;