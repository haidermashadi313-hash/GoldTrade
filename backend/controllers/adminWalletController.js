const User = require("../models/User");
const walletTransaction = require("../models/walletTransaction");

// =======================================
// GET ALL USERS FOR wallet MANAGER
// =======================================
exports.getwalletUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "username email role status walletBalance UsdtBalance goldBalance totalDeposit totalWithdraw"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =======================================
// CREDIT / DEBIT wallet
// =======================================
exports.updatewallet = async (req, res) => {
  try {
    const {
      userId,
      walletType,
      action,
      amount,
      reason,
    } = req.body;

    if (
      !userId ||
      !walletType ||
      !action ||
      !amount
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const value = Number(amount);

    if (value <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
      });
    }

    let previousBalance = 0;
    let newBalance = 0;

    // Pkr wallet
    if (walletType === "Pkr") {
      previousBalance = user.walletBalance;

      newBalance =
        action === "credit"
          ? previousBalance + value
          : previousBalance - value;

      if (newBalance < 0) newBalance = 0;

      user.walletBalance = newBalance;
    }

    // Usdt wallet
    if (walletType === "Usdt") {
      previousBalance = user.UsdtBalance;

      newBalance =
        action === "credit"
          ? previousBalance + value
          : previousBalance - value;

      if (newBalance < 0) newBalance = 0;

      user.UsdtBalance = newBalance;
    }

    // GOLD wallet
    if (walletType === "GOLD") {
      previousBalance = user.goldBalance;

      newBalance =
        action === "credit"
          ? previousBalance + value
          : previousBalance - value;

      if (newBalance < 0) newBalance = 0;

      user.goldBalance = newBalance;
    }

    await user.save();

    await walletTransaction.create({
      user: user._id,
      admin: req.user.id,
      walletType,
      action,
      amount: value,
      previousBalance,
      newBalance,
      reason,
    });

    res.json({
      success: true,
      message: "wallet updated successfully.",
      walletType,
      previousBalance,
      newBalance,
      user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =======================================
// wallet history
// =======================================
exports.wallethistory = async (req, res) => {
  try {
    const history = await walletTransaction.find()
      .populate("user", "username email")
      .populate("admin", "username email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      history,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};