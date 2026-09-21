const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

// =======================================
// GET ALL USERS FOR Wallet MANAGER
// =======================================
exports.getWalletUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "username email role status WalletBalance UsdtBalance goldBalance totalDeposit totalWithdraw"
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
// CREDIT / DEBIT Wallet
// =======================================
exports.updateWallet = async (req, res) => {
  try {
    const {
      userId,
      WalletType,
      action,
      amount,
      reason,
    } = req.body;

    if (
      !userId ||
      !WalletType ||
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

    // Pkr Wallet
    if (WalletType === "Pkr") {
      previousBalance = user.WalletBalance;

      newBalance =
        action === "credit"
          ? previousBalance + value
          : previousBalance - value;

      if (newBalance < 0) newBalance = 0;

      user.WalletBalance = newBalance;
    }

    // Usdt Wallet
    if (WalletType === "Usdt") {
      previousBalance = user.UsdtBalance;

      newBalance =
        action === "credit"
          ? previousBalance + value
          : previousBalance - value;

      if (newBalance < 0) newBalance = 0;

      user.UsdtBalance = newBalance;
    }

    // Gold Wallet
    if (WalletType === "Gold") {
      previousBalance = user.GoldBalance;

      newBalance =
        action === "credit"
          ? previousBalance + value
          : previousBalance - value;

      if (newBalance < 0) newBalance = 0;

      user.GoldBalance = newBalance;
    }

    await user.save();

    await WalletTransaction.create({
      user: user._id,
      admin: req.user.id,
      WalletType,
      action,
      amount: value,
      previousBalance,
      newBalance,
      reason,
    });

    res.json({
      success: true,
      message: "Wallet updated successfully.",
      WalletType,
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
// Wallet history
// =======================================
exports.Wallethistory = async (req, res) => {
  try {
    const history = await WalletTransaction.find()
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