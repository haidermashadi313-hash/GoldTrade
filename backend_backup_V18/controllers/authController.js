const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ===============================
// REGISTER
// ===============================
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const exists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "User already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      walletBalance: 0,
      usdtBalance: 0,
      goldBalance: 0,
      totalDeposit: 0,
      totalWithdraw: 0,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      data: user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// LOGIN
// ===============================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// PROFILE
// ===============================
exports.getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Profile API Working",
      data: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        walletBalance: req.user.walletBalance,
        usdtBalance: req.user.usdtBalance,
        goldBalance: req.user.goldBalance,
        totalDeposit: req.user.totalDeposit,
        totalWithdraw: req.user.totalWithdraw,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};