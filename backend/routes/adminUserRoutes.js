const express = require("express");
const router = express.Router();

const { verifyToken, isAdmin } = require("../middleware/auth");

const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

// =====================================================
// GET ADMIN USERS DASHBOARD
// GET /api/admin/users
// =====================================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "username fullName email pkrBalance goldBalance usdtBalance walletFrozen createdAt"
      )
      .sort({ createdAt: -1 });

    const analytics = {
      totalUsers: users.length,

      activeWallets: users.filter((u) => !u.walletFrozen).length,

      frozenWallets: users.filter((u) => u.walletFrozen).length,

      totalPkrBalance: users.reduce(
        (sum, u) => sum + Number(u.pkrBalance || 0),
        0
      ),

      totalGoldBalance: users.reduce(
        (sum, u) => sum + Number(u.goldBalance || 0),
        0
      ),

      totalUsdtBalance: users.reduce(
        (sum, u) => sum + Number(u.usdtBalance || 0),
        0
      ),
    };

    return res.json({
      success: true,
      analytics,
      users,
    });
  } catch (error) {
    console.error("Admin Users Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load users dashboard.",
    });
  }
});

// =====================================================
// GET SINGLE USER
// GET /api/admin/users/:username
// =====================================================

router.get("/:username", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user details.",
    });
  }
});

// =====================================================
// SEARCH USERS
// GET /api/admin/users/search/:keyword
// =====================================================

router.get(
  "/search/:keyword",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const keyword = req.params.keyword;

      const users = await User.find({
        $or: [
          { username: { $regex: keyword, $options: "i" } },
          { fullName: { $regex: keyword, $options: "i" } },
          { email: { $regex: keyword, $options: "i" } },
        ],
      }).select(
        "username fullName email pkrBalance goldBalance usdtBalance walletFrozen createdAt"
      );

      return res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error("Search User Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to search users.",
      });
    }
  }
);
// =====================================================
// UPDATE USER WALLET
// POST /api/admin/users/:username/wallet
// =====================================================

router.post(
  "/:username/wallet",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { walletType, actionType, amount } = req.body;

      const user = await User.findOne({
        username: req.params.username,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const value = Number(amount);

      if (!value || value <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount.",
        });
      }

      let balanceField = "";

      switch (walletType) {
        case "PKR":
          balanceField = "pkrBalance";
          break;

        case "GOLD":
          balanceField = "goldBalance";
          break;

        case "USDT":
          balanceField = "usdtBalance";
          break;

        default:
          return res.status(400).json({
            success: false,
            message: "Invalid wallet type.",
          });
      }

      // CREDIT
      if (actionType === "credit") {
        user[balanceField] =
          Number(user[balanceField] || 0) + value;
      }

      // DEBIT
      if (actionType === "debit") {
        if (Number(user[balanceField] || 0) < value) {
          return res.status(400).json({
            success: false,
            message: "Insufficient wallet balance.",
          });
        }

        user[balanceField] =
          Number(user[balanceField] || 0) - value;
      }

      await user.save();

      // Wallet Transaction History
      await WalletTransaction.create({
        username: user.username,
        walletType,
        transactionType:
          actionType === "credit"
            ? "ADMIN_CREDIT"
            : "ADMIN_DEBIT",
        amount: value,
        status: "Completed",
        note: `Admin ${actionType} ${walletType} wallet.`,
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: `${walletType} wallet ${actionType} successful.`,
        balances: {
          pkrBalance: user.pkrBalance,
          goldBalance: user.goldBalance,
          usdtBalance: user.usdtBalance,
        },
      });
    } catch (error) {
      console.error("Wallet Update Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update wallet.",
      });
    }
  }
);

// =====================================================
// GET USER WALLET HISTORY
// GET /api/admin/users/:username/history
// =====================================================

router.get(
  "/:username/history",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const history = await WalletTransaction.find({
        username: req.params.username,
      })
        .sort({ createdAt: -1 })
        .limit(200);

      return res.json({
        success: true,
        history,
      });
    } catch (error) {
      console.error("Wallet History Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load wallet history.",
      });
    }
  }
);

// =====================================================
// RESET USER WALLET (ADMIN)
// POST /api/admin/users/:username/reset-wallet
// =====================================================

router.post(
  "/:username/reset-wallet",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const user = await User.findOne({
        username: req.params.username,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      user.pkrBalance = 0;
      user.goldBalance = 0;
      user.usdtBalance = 0;

      await user.save();

      await WalletTransaction.create({
        username: user.username,
        walletType: "SYSTEM",
        transactionType: "SYSTEM_UPDATE",
        amount: 0,
        status: "Completed",
        note: "Admin reset all wallet balances.",
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "User wallet reset successfully.",
      });
    } catch (error) {
      console.error("Reset Wallet Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to reset wallet.",
      });
    }
  }
);
// =====================================================
// FREEZE USER WALLET
// POST /api/admin/users/:username/freeze
// =====================================================

router.post(
  "/:username/freeze",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const user = await User.findOne({
        username: req.params.username,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (user.walletFrozen) {
        return res.status(400).json({
          success: false,
          message: "Wallet is already frozen.",
        });
      }

      user.walletFrozen = true;
      await user.save();

      await WalletTransaction.create({
        username: user.username,
        walletType: "SYSTEM",
        transactionType: "WALLET_FREEZE",
        amount: 0,
        status: "Completed",
        note: "Wallet frozen by admin.",
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "Wallet frozen successfully.",
        walletFrozen: true,
      });

    } catch (error) {
      console.error("Freeze Wallet Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to freeze wallet.",
      });
    }
  }
);

// =====================================================
// UNFREEZE USER WALLET
// POST /api/admin/users/:username/unfreeze
// =====================================================

router.post(
  "/:username/unfreeze",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const user = await User.findOne({
        username: req.params.username,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      if (!user.walletFrozen) {
        return res.status(400).json({
          success: false,
          message: "Wallet is already active.",
        });
      }

      user.walletFrozen = false;
      await user.save();

      await WalletTransaction.create({
        username: user.username,
        walletType: "SYSTEM",
        transactionType: "WALLET_UNFREEZE",
        amount: 0,
        status: "Completed",
        note: "Wallet unfrozen by admin.",
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "Wallet unfrozen successfully.",
        walletFrozen: false,
      });

    } catch (error) {
      console.error("Unfreeze Wallet Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to unfreeze wallet.",
      });
    }
  }
);

// =====================================================
// GET USER STATUS
// GET /api/admin/users/:username/status
// =====================================================

router.get(
  "/:username/status",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const user = await User.findOne({
        username: req.params.username,
      }).select(
        "username walletFrozen pkrBalance goldBalance usdtBalance createdAt"
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      return res.json({
        success: true,
        status: {
          username: user.username,
          walletFrozen: user.walletFrozen,
          pkrBalance: user.pkrBalance,
          goldBalance: user.goldBalance,
          usdtBalance: user.usdtBalance,
          createdAt: user.createdAt,
        },
      });

    } catch (error) {
      console.error("User Status Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load user status.",
      });
    }
  }
);

// =====================================================
// DELETE USER (ADMIN)
// DELETE /api/admin/users/:username
// =====================================================

router.delete(
  "/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const user = await User.findOne({
        username: req.params.username,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      await WalletTransaction.create({
        username: user.username,
        walletType: "SYSTEM",
        transactionType: "SYSTEM_UPDATE",
        amount: 0,
        status: "Completed",
        note: "User deleted by admin.",
        createdBy: req.user.username,
      });

      await User.deleteOne({ username: user.username });

      return res.json({
        success: true,
        message: "User deleted successfully.",
      });

    } catch (error) {
      console.error("Delete User Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to delete user.",
      });
    }
  }
);
// =====================================================
// USER ANALYTICS
// GET /api/admin/users/analytics
// =====================================================

router.get(
  "/analytics",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const users = await User.find({});

      const analytics = {
        totalUsers: users.length,

        activeWallets: users.filter((u) => !u.walletFrozen).length,

        frozenWallets: users.filter((u) => u.walletFrozen).length,

        totalPkrBalance: users.reduce(
          (sum, u) => sum + Number(u.pkrBalance || 0),
          0
        ),

        totalGoldBalance: users.reduce(
          (sum, u) => sum + Number(u.goldBalance || 0),
          0
        ),

        totalUsdtBalance: users.reduce(
          (sum, u) => sum + Number(u.usdtBalance || 0),
          0
        ),
      };

      return res.json({
        success: true,
        analytics,
      });

    } catch (error) {
      console.error("User Analytics Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load analytics.",
      });
    }
  }
);

// =====================================================
// RECENT WALLET TRANSACTIONS
// GET /api/admin/users/transactions
// =====================================================

router.get(
  "/transactions",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const transactions = await WalletTransaction.find({})
        .sort({ createdAt: -1 })
        .limit(300);

      return res.json({
        success: true,
        transactions,
      });

    } catch (error) {
      console.error("Transactions Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load transactions.",
      });
    }
  }
);

// =====================================================
// ADMIN AUDIT LOG
// GET /api/admin/users/audit
// =====================================================

router.get(
  "/audit",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const logs = await WalletTransaction.find({
        transactionType: {
          $in: [
            "ADMIN_CREDIT",
            "ADMIN_DEBIT",
            "WALLET_FREEZE",
            "WALLET_UNFREEZE",
            "SYSTEM_UPDATE",
          ],
        },
      })
        .sort({ createdAt: -1 })
        .limit(500);

      return res.json({
        success: true,
        logs,
      });

    } catch (error) {
      console.error("Audit Log Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load audit log.",
      });
    }
  }
);

// =====================================================
// USER WALLET SUMMARY
// GET /api/admin/users/wallet-summary
// =====================================================

router.get(
  "/wallet-summary",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const users = await User.find({});

      const summary = {
        totalUsers: users.length,

        totalPKR: users.reduce(
          (sum, u) => sum + Number(u.pkrBalance || 0),
          0
        ),

        totalGold: users.reduce(
          (sum, u) => sum + Number(u.goldBalance || 0),
          0
        ),

        totalUSDT: users.reduce(
          (sum, u) => sum + Number(u.usdtBalance || 0),
          0
        ),
      };

      return res.json({
        success: true,
        summary,
      });

    } catch (error) {
      console.error("Wallet Summary Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load wallet summary.",
      });
    }
  }
);

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;