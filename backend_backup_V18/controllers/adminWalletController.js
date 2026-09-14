const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

// =======================================
// GET ALL USERS FOR WALLET MANAGER
// =======================================
exports.getWalletUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "username email role status walletBalance usdtBalance goldBalance totalDeposit totalWithdraw"
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
// CREDIT / DEBIT WALLET
// =======================================
exports.updateWallet = async (req, res) => {
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

    // PKR Wallet
    if (walletType === "PKR") {
      previousBalance = user.walletBalance;

      newBalance =
        action === "credit"
          ? previousBalance + value
          : previousBalance - value;

      if (newBalance < 0) newBalance = 0;

      user.walletBalance = newBalance;
    }

    // USDT Wallet
    if (walletType === "USDT") {
      previousBalance = user.usdtBalance;

      newBalance =
        action === "credit"
          ? previousBalance + value
          : previousBalance - value;

      if (newBalance < 0) newBalance = 0;

      user.usdtBalance = newBalance;
    }

    // GOLD Wallet
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

    await WalletTransaction.create({
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
      message: "Wallet updated successfully.",
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
// WALLET HISTORY
// =======================================
exports.walletHistory = async (req, res) => {
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