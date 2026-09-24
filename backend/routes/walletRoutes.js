// =====================================================
// GoldTrade V18 Enterprise
// Admin Wallet Routes
// PART 1/5
// =====================================================

const express = require("express");
const router = express.Router();

// =====================================================
// MODELS
// =====================================================

const User = require("../models/User");
const WalletHistory = require("../models/WalletHistory");

// =====================================================
// MIDDLEWARE
// =====================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// GET ALL WALLET USERS
// GET /api/admin/wallet/all
// =====================================================

router.get("/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "username email role status wallet pkrBalance goldBalance usdtBalance createdAt"
      )
      .sort({ createdAt: -1 });

    const formattedUsers = users.map((user) => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
      status: user.status || "Active",

      wallet: {
        pkr: Number(user.wallet?.pkr ?? user.pkrBalance ?? 0),
        gold: Number(user.wallet?.gold ?? user.goldBalance ?? 0),
        usdt: Number(user.wallet?.usdt ?? user.usdtBalance ?? 0),
      },

      pkrBalance: Number(user.wallet?.pkr ?? user.pkrBalance ?? 0),
      goldBalance: Number(user.wallet?.gold ?? user.goldBalance ?? 0),
      usdtBalance: Number(user.wallet?.usdt ?? user.usdtBalance ?? 0),

      createdAt: user.createdAt,
    }));

    return res.status(200).json({
      success: true,
      users: formattedUsers,
    });

  } catch (error) {
    console.error("GET WALLET USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load wallet users.",
    });
  }
});
// =====================================================
// GET WALLET STATISTICS
// GET /api/admin/wallet/statistics
// =====================================================

router.get("/statistics", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select(
      "wallet pkrBalance goldBalance usdtBalance"
    );

    const statistics = users.reduce(
      (totals, user) => {
        totals.pkrBalance += Number(
          user.wallet?.pkr ?? user.pkrBalance ?? 0
        );

        totals.goldBalance += Number(
          user.wallet?.gold ?? user.goldBalance ?? 0
        );

        totals.usdtBalance += Number(
          user.wallet?.usdt ?? user.usdtBalance ?? 0
        );

        totals.users += 1;

        return totals;
      },
      {
        pkrBalance: 0,
        goldBalance: 0,
        usdtBalance: 0,
        users: 0,
      }
    );

    return res.status(200).json({
      success: true,
      statistics,
    });

  } catch (error) {
    console.error("GET WALLET STATISTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet statistics.",
    });
  }
});

// =====================================================
// GET USER WALLET HISTORY
// GET /api/admin/wallet/history/:userId
// =====================================================

router.get("/history/:userId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("username");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const history = await WalletHistory.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedHistory = history.map((item) => ({
      _id: item._id,
      username: user.username,
      walletType: item.walletType,
      type: item.type,
      amount: Number(item.amount),
      note: item.note || "",
      admin: item.admin || "",
      createdAt: item.createdAt,
    }));

    return res.status(200).json({
      success: true,
      history: formattedHistory,
    });

  } catch (error) {
    console.error("GET WALLET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet history.",
    });
  }
});
// =====================================================
// GoldTrade V18 Enterprise
// PART 3/5
// CREDIT WALLET API
// =====================================================

// POST /api/admin/wallet/credit

router.post("/credit", verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId, walletType, amount, note } = req.body;

    if (!userId || !walletType || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "User ID, wallet type and amount are required.",
      });
    }

    const creditAmount = Number(amount);

    if (isNaN(creditAmount) || creditAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
      });
    }

    const wallet = String(walletType).toUpperCase();

    if (!["PKR", "GOLD", "USDT"].includes(wallet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet type.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Make sure wallet object exists
    if (!user.wallet) {
      user.wallet = {
        pkr: Number(user.pkrBalance || 0),
        gold: Number(user.goldBalance || 0),
        usdt: Number(user.usdtBalance || 0),
      };
    }

    // Credit selected wallet
    switch (wallet) {
      case "PKR":
        user.wallet.pkr = Number(user.wallet.pkr || 0) + creditAmount;
        user.pkrBalance = user.wallet.pkr;
        break;

      case "GOLD":
        user.wallet.gold = Number(user.wallet.gold || 0) + creditAmount;
        user.goldBalance = user.wallet.gold;
        break;

      case "USDT":
        user.wallet.usdt = Number(user.wallet.usdt || 0) + creditAmount;
        user.usdtBalance = user.wallet.usdt;
        break;
    }

    await user.save();

    // Save wallet history
    await WalletHistory.create({
      userId: user._id,
      username: user.username,
      walletType: wallet,
      type: "Credit",
      amount: creditAmount,
      note: note || "",
      admin: req.user?.username || "Admin",
    });

    return res.status(200).json({
      success: true,
      message: `${wallet} wallet credited successfully.`,
      wallet: user.wallet,
    });

  } catch (error) {
    console.error("CREDIT WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Wallet credit failed.",
    });
  }
});
// =====================================================
// GoldTrade V18 Enterprise
// PART 4/5
// DEBIT WALLET API
// =====================================================

// POST /api/admin/wallet/debit

router.post("/debit", verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId, walletType, amount, note } = req.body;

    // -------------------------------
    // Validation
    // -------------------------------

    if (!userId || !walletType || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "User ID, wallet type and amount are required.",
      });
    }

    const debitAmount = Number(amount);

    if (isNaN(debitAmount) || debitAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
      });
    }

    const wallet = String(walletType).toUpperCase();

    if (!["PKR", "GOLD", "USDT"].includes(wallet)) {
      return res.status(400).json({
        success: false,
        message: "Invalid wallet type.",
      });
    }

    // -------------------------------
    // Find User
    // -------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.wallet) {
      user.wallet = {
        pkr: Number(user.pkrBalance || 0),
        gold: Number(user.goldBalance || 0),
        usdt: Number(user.usdtBalance || 0),
      };
    }

    // -------------------------------
    // Check Balance
    // -------------------------------

    let currentBalance = 0;

    switch (wallet) {
      case "PKR":
        currentBalance = Number(user.wallet.pkr || 0);
        break;

      case "GOLD":
        currentBalance = Number(user.wallet.gold || 0);
        break;

      case "USDT":
        currentBalance = Number(user.wallet.usdt || 0);
        break;
    }

    if (currentBalance < debitAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${wallet} balance.`,
        currentBalance,
      });
    }

    // -------------------------------
    // Debit Wallet
    // -------------------------------

    switch (wallet) {
      case "PKR":
        user.wallet.pkr = currentBalance - debitAmount;
        user.pkrBalance = user.wallet.pkr;
        break;

      case "GOLD":
        user.wallet.gold = currentBalance - debitAmount;
        user.goldBalance = user.wallet.gold;
        break;

      case "USDT":
        user.wallet.usdt = currentBalance - debitAmount;
        user.usdtBalance = user.wallet.usdt;
        break;
    }

    await user.save();

    // -------------------------------
    // Save Wallet History
    // -------------------------------

    await WalletHistory.create({
      userId: user._id,
      username: user.username,
      walletType: wallet,
      type: "Debit",
      amount: debitAmount,
      note: note || "",
      admin: req.user?.username || "Admin",
    });

    return res.status(200).json({
      success: true,
      message: `${wallet} wallet debited successfully.`,
      wallet: user.wallet,
    });

  } catch (error) {
    console.error("DEBIT WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Wallet debit failed.",
    });
  }
});
// =====================================================
// GoldTrade V18 Enterprise
// PART 5/5
// DELETE HISTORY + GET ALL HISTORY + EXPORT ROUTER
// =====================================================

// DELETE /api/admin/wallet/history/:historyId

router.delete(
  "/history/:historyId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { historyId } = req.params;

      const history = await WalletHistory.findById(historyId);

      if (!history) {
        return res.status(404).json({
          success: false,
          message: "Wallet history not found.",
        });
      }

      await WalletHistory.findByIdAndDelete(historyId);

      return res.status(200).json({
        success: true,
        message: "Wallet history deleted successfully.",
      });
    } catch (error) {
      console.error("DELETE WALLET HISTORY ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to delete wallet history.",
      });
    }
  }
);

// =====================================================
// GET COMPLETE WALLET HISTORY (ADMIN)
// GET /api/admin/wallet/history
// =====================================================

router.get("/history", verifyToken, isAdmin, async (req, res) => {
  try {
    const history = await WalletHistory.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("GET ALL WALLET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet history.",
    });
  }
});

// =====================================================
// HEALTH CHECK
// GET /api/admin/wallet
// =====================================================

router.get("/", verifyToken, isAdmin, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "GoldTrade V18 Wallet API Working",
    version: "V18 Enterprise",
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;