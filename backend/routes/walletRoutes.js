const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const WalletHistory = require("../models/WalletHistory");

// ======================================================
// MIDDLEWARE
// ======================================================

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

// ======================================================
// HELPER — GET OR CREATE WALLET
// ======================================================

const getOrCreateWallet = async (user) => {
  if (!user?._id) {
    throw new Error("Valid user is required.");
  }

  let wallet = await Wallet.findOne({
    userId: user._id,
  });

  if (!wallet) {
    wallet = await Wallet.create({
      userId: user._id,

      username: String(
        user.username || ""
      ).trim().toLowerCase(),

      balance: 0,

      pkrBalance: 0,
      goldBalance: 0,
      usdtBalance: 0,

      lockedPkr: 0,
      lockedGold: 0,
      lockedUsdt: 0,

      portfolioValue: 0,
      liveProfit: 0,
      liveProfitPercent: 0,

      totalDeposit: 0,
      totalWithdraw: 0,

      totalPkrDeposit: 0,
      totalPkrWithdraw: 0,

      totalGoldPurchased: 0,
      totalGoldSold: 0,

      totalUsdtDeposited: 0,
      totalUsdtWithdrawn: 0,

      status: "Active",
      isVerified: true,
      isFrozen: false,
    });

    console.log(
      `GoldTrade V18: Wallet created for ${user.username}`
    );
  }

  return wallet;
};

// ======================================================
// HEALTH CHECK
// GET /api/wallet/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,

    module: "Wallet API",

    version:
      "GoldTrade V18 Enterprise",

    status: "ONLINE",

    environment:
      process.env.NODE_ENV ||
      "development",

    timestamp:
      new Date().toISOString(),
  });
});

// ======================================================
// GET LOGGED-IN USER WALLET
// GET /api/wallet/balance
//
// Used by:
// Dashboard
// Wallet
// Deposit
// Withdraw
// Gold
// USDT
// ======================================================

router.get(
  "/balance",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH VALIDATION
      // ==================================================

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // FIND LOGGED-IN USER
      // ==================================================

      const user = await User.findById(
        req.user.id
      )
        .select(
          "_id username email role"
        )
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // GET OR CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(user);

      // ==================================================
      // WALLET RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        username: wallet.username,

        wallet: {
          pkrBalance: Number(
            wallet.pkrBalance ?? 0
          ),

          goldBalance: Number(
            wallet.goldBalance ?? 0
          ),

          usdtBalance: Number(
            wallet.usdtBalance ?? 0
          ),

          lockedPkr: Number(
            wallet.lockedPkr ?? 0
          ),

          lockedGold: Number(
            wallet.lockedGold ?? 0
          ),

          lockedUsdt: Number(
            wallet.lockedUsdt ?? 0
          ),

          availablePkr: Number(
            wallet.availablePkr ?? 0
          ),

          availableGold: Number(
            wallet.availableGold ?? 0
          ),

          availableUsdt: Number(
            wallet.availableUsdt ?? 0
          ),

          portfolioValue: Number(
            wallet.portfolioValue ?? 0
          ),

          liveProfit: Number(
            wallet.liveProfit ?? 0
          ),

          liveProfitPercent: Number(
            wallet.liveProfitPercent ?? 0
          ),

          totalWalletValue: Number(
            wallet.totalWalletValue ?? 0
          ),

          status:
            wallet.status ||
            "Active",
        },

        updatedAt:
          wallet.updatedAt ||
          new Date(),
      });
    } catch (error) {
      console.error(
        "GOLDTRADE V18 GET WALLET BALANCE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load wallet balance.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error: error.message,
        }),
      });
    }
  }
);

// ======================================================
// GET USER WALLET BY USERNAME
// GET /api/wallet/:username
//
// User:
//   Can access own wallet.
//
// Admin:
//   Can access any user's wallet.
// ======================================================

router.get(
  "/:username",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH VALIDATION
      // ==================================================

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // NORMALIZE USERNAME
      // ==================================================

      const username = String(
        req.params.username || ""
      )
        .trim()
        .toLowerCase();

      if (!username) {
        return res.status(400).json({
          success: false,
          message:
            "Username is required.",
        });
      }

      // ==================================================
      // AUTHORIZATION
      // ==================================================

      const requesterUsername =
        String(
          req.user.username || ""
        )
          .trim()
          .toLowerCase();

      const requesterRole =
        String(
          req.user.role || ""
        )
          .trim()
          .toLowerCase();

      const isRequesterAdmin =
        requesterRole === "admin";

      const isOwnWallet =
        requesterUsername ===
        username;

      if (
        !isRequesterAdmin &&
        !isOwnWallet
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      // ==================================================
      // FIND USER
      // ==================================================

      const user =
        await User.findOne({
          username,
        })
          .select(
            "_id username email role"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // GET OR CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(user);

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        wallet: {
          username:
            wallet.username,

          email:
            user.email,

          role:
            user.role,

          pkrBalance: Number(
            wallet.pkrBalance ?? 0
          ),

          goldBalance: Number(
            wallet.goldBalance ?? 0
          ),

          usdtBalance: Number(
            wallet.usdtBalance ?? 0
          ),

          lockedPkr: Number(
            wallet.lockedPkr ?? 0
          ),

          lockedGold: Number(
            wallet.lockedGold ?? 0
          ),

          lockedUsdt: Number(
            wallet.lockedUsdt ?? 0
          ),

          availablePkr: Number(
            wallet.availablePkr ?? 0
          ),

          availableGold: Number(
            wallet.availableGold ?? 0
          ),

          availableUsdt: Number(
            wallet.availableUsdt ?? 0
          ),

          portfolioValue: Number(
            wallet.portfolioValue ?? 0
          ),

          liveProfit: Number(
            wallet.liveProfit ?? 0
          ),

          liveProfitPercent: Number(
            wallet.liveProfitPercent ?? 0
          ),

          totalWalletValue: Number(
            wallet.totalWalletValue ?? 0
          ),

          totalDeposit: Number(
            wallet.totalDeposit ?? 0
          ),

          totalWithdraw: Number(
            wallet.totalWithdraw ?? 0
          ),

          status:
            wallet.status ||
            "Active",

          createdAt:
            wallet.createdAt,

          updatedAt:
            wallet.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "GOLDTRADE V18 GET USER WALLET ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load wallet.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error: error.message,
        }),
      });
    }
  }
);

// ======================================================
// WALLET SUMMARY
// GET /api/wallet/summary
//
// Logged-in user only
// ======================================================

router.get(
  "/summary",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH CHECK
      // ==================================================

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // ==================================================
      // FIND USER
      // ==================================================

      const user = await User.findById(req.user.id)
        .select("_id username")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // GET OR CREATE WALLET
      // ==================================================

      const wallet = await getOrCreateWallet(user);

      // ==================================================
      // TRANSACTION COUNT
      // ==================================================

      const totalTransactions =
        await WalletHistory.countDocuments({
          userId: user._id,
        });

      // ==================================================
      // LAST TRANSACTION
      // ==================================================

      const lastTransaction =
        await WalletHistory.findOne({
          userId: user._id,
        })
          .sort({ createdAt: -1 })
          .lean();

      // ==================================================
      // NORMALIZED VALUES
      // ==================================================

      const pkrBalance = Number(
        wallet.pkrBalance ?? 0
      );

      const goldBalance = Number(
        wallet.goldBalance ?? 0
      );

      const usdtBalance = Number(
        wallet.usdtBalance ?? 0
      );

      const availablePkr = Number(
        wallet.availablePkr ?? 0
      );

      const availableGold = Number(
        wallet.availableGold ?? 0
      );

      const availableUsdt = Number(
        wallet.availableUsdt ?? 0
      );

      const lockedPkr = Number(
        wallet.lockedPkr ?? 0
      );

      const lockedGold = Number(
        wallet.lockedGold ?? 0
      );

      const lockedUsdt = Number(
        wallet.lockedUsdt ?? 0
      );

      const portfolioValue = Number(
        wallet.portfolioValue ?? 0
      );

      const liveProfit = Number(
        wallet.liveProfit ?? 0
      );

      const liveProfitPercent = Number(
        wallet.liveProfitPercent ?? 0
      );

      const totalWalletValue = Number(
        wallet.totalWalletValue ?? 0
      );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        summary: {
          username: wallet.username,

          // ----------------------------------------------
          // FLAT VALUES
          // Frontend compatibility
          // ----------------------------------------------

          pkrBalance,
          goldBalance,
          usdtBalance,

          availablePkr,
          availableGold,
          availableUsdt,

          lockedPkr,
          lockedGold,
          lockedUsdt,

          portfolioValue,
          liveProfit,
          liveProfitPercent,
          totalWalletValue,

          // ----------------------------------------------
          // NESTED BALANCES
          // ----------------------------------------------

          balances: {
            pkr: pkrBalance,
            gold: goldBalance,
            usdt: usdtBalance,
          },

          available: {
            pkr: availablePkr,
            gold: availableGold,
            usdt: availableUsdt,
          },

          locked: {
            pkr: lockedPkr,
            gold: lockedGold,
            usdt: lockedUsdt,
          },

          performance: {
            portfolioValue,
            liveProfit,
            liveProfitPercent,
            totalWalletValue,
          },

          totals: {
            deposit: Number(
              wallet.totalDeposit ?? 0
            ),

            withdraw: Number(
              wallet.totalWithdraw ?? 0
            ),

            goldPurchased: Number(
              wallet.totalGoldPurchased ?? 0
            ),

            goldSold: Number(
              wallet.totalGoldSold ?? 0
            ),

            usdtDeposited: Number(
              wallet.totalUsdtDeposited ?? 0
            ),

            usdtWithdrawn: Number(
              wallet.totalUsdtWithdrawn ?? 0
            ),
          },

          totalTransactions,

          lastTransaction,

          status:
            wallet.status || "Active",

          updatedAt:
            wallet.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "GOLDTRADE V18 GET WALLET SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load wallet summary.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error: error.message,
        }),
      });
    }
  }
);

// ======================================================
// GET DASHBOARD PORTFOLIO
// GET /api/wallet/portfolio
//
// Logged-in user only
// Used by Dashboard / Portfolio
// ======================================================

router.get(
  "/portfolio",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH CHECK
      // ==================================================

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // ==================================================
      // FIND USER
      // ==================================================

      const user = await User.findById(req.user.id)
        .select("_id username email role")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // GET OR CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(user);

      // ==================================================
      // NORMALIZED VALUES
      // ==================================================

      const pkrBalance = Number(
        wallet.pkrBalance ?? 0
      );

      const goldBalance = Number(
        wallet.goldBalance ?? 0
      );

      const usdtBalance = Number(
        wallet.usdtBalance ?? 0
      );

      const availablePkr = Number(
        wallet.availablePkr ?? 0
      );

      const availableGold = Number(
        wallet.availableGold ?? 0
      );

      const availableUsdt = Number(
        wallet.availableUsdt ?? 0
      );

      const lockedPkr = Number(
        wallet.lockedPkr ?? 0
      );

      const lockedGold = Number(
        wallet.lockedGold ?? 0
      );

      const lockedUsdt = Number(
        wallet.lockedUsdt ?? 0
      );

      const portfolioValue = Number(
        wallet.portfolioValue ?? 0
      );

      const liveProfit = Number(
        wallet.liveProfit ?? 0
      );

      const liveProfitPercent = Number(
        wallet.liveProfitPercent ?? 0
      );

      const totalWalletValue = Number(
        wallet.totalWalletValue ?? 0
      );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        portfolio: {
          username: wallet.username,

          // ----------------------------------------------
          // FLAT VALUES
          // ----------------------------------------------

          pkrBalance,
          goldBalance,
          usdtBalance,

          availablePkr,
          availableGold,
          availableUsdt,

          lockedPkr,
          lockedGold,
          lockedUsdt,

          portfolioValue,
          liveProfit,
          liveProfitPercent,
          totalWalletValue,

          // ----------------------------------------------
          // NESTED VALUES
          // ----------------------------------------------

          balances: {
            pkr: pkrBalance,
            gold: goldBalance,
            usdt: usdtBalance,
          },

          available: {
            pkr: availablePkr,
            gold: availableGold,
            usdt: availableUsdt,
          },

          locked: {
            pkr: lockedPkr,
            gold: lockedGold,
            usdt: lockedUsdt,
          },

          // ----------------------------------------------
          // TOTALS
          // ----------------------------------------------

          totalDeposit: Number(
            wallet.totalDeposit ?? 0
          ),

          totalWithdraw: Number(
            wallet.totalWithdraw ?? 0
          ),

          totalGoldPurchased: Number(
            wallet.totalGoldPurchased ?? 0
          ),

          totalGoldSold: Number(
            wallet.totalGoldSold ?? 0
          ),

          totalUsdtDeposited: Number(
            wallet.totalUsdtDeposited ?? 0
          ),

          totalUsdtWithdrawn: Number(
            wallet.totalUsdtWithdrawn ?? 0
          ),

          status:
            wallet.status || "Active",

          updatedAt:
            wallet.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "GOLDTRADE V18 GET PORTFOLIO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load portfolio.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error: error.message,
        }),
      });
    }
  }
);

// ======================================================
// GET USER PORTFOLIO BY USERNAME
// GET /api/wallet/portfolio/:username
//
// Admin:
//   Can access any user's portfolio.
//
// User:
//   Can access only own portfolio.
// ======================================================

router.get(
  "/portfolio/:username",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH CHECK
      // ==================================================

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // ==================================================
      // NORMALIZE USERNAMES
      // ==================================================

      const username = String(
        req.params.username || ""
      )
        .trim()
        .toLowerCase();

      const requesterUsername = String(
        req.user.username || ""
      )
        .trim()
        .toLowerCase();

      const requesterRole = String(
        req.user.role || ""
      )
        .trim()
        .toLowerCase();

      // ==================================================
      // VALIDATE USERNAME
      // ==================================================

      if (!username) {
        return res.status(400).json({
          success: false,
          message:
            "Username is required.",
        });
      }

      // ==================================================
      // AUTHORIZATION
      // ==================================================

      const isAdminUser =
        requesterRole === "admin";

      const isOwnPortfolio =
        requesterUsername === username;

      if (
        !isAdminUser &&
        !isOwnPortfolio
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      // ==================================================
      // FIND USER
      // ==================================================

      const user =
        await User.findOne({
          username,
        })
          .select(
            "_id username email role"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // GET OR CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(user);

      // ==================================================
      // NORMALIZED VALUES
      // ==================================================

      const pkrBalance = Number(
        wallet.pkrBalance ?? 0
      );

      const goldBalance = Number(
        wallet.goldBalance ?? 0
      );

      const usdtBalance = Number(
        wallet.usdtBalance ?? 0
      );

      const availablePkr = Number(
        wallet.availablePkr ?? 0
      );

      const availableGold = Number(
        wallet.availableGold ?? 0
      );

      const availableUsdt = Number(
        wallet.availableUsdt ?? 0
      );

      const lockedPkr = Number(
        wallet.lockedPkr ?? 0
      );

      const lockedGold = Number(
        wallet.lockedGold ?? 0
      );

      const lockedUsdt = Number(
        wallet.lockedUsdt ?? 0
      );

      const portfolioValue = Number(
        wallet.portfolioValue ?? 0
      );

      const liveProfit = Number(
        wallet.liveProfit ?? 0
      );

      const liveProfitPercent = Number(
        wallet.liveProfitPercent ?? 0
      );

      const totalWalletValue = Number(
        wallet.totalWalletValue ?? 0
      );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        portfolio: {
          username: wallet.username,

          email: user.email,

          role: user.role,

          // ----------------------------------------------
          // FLAT VALUES
          // ----------------------------------------------

          pkrBalance,
          goldBalance,
          usdtBalance,

          availablePkr,
          availableGold,
          availableUsdt,

          lockedPkr,
          lockedGold,
          lockedUsdt,

          portfolioValue,
          liveProfit,
          liveProfitPercent,
          totalWalletValue,

          // ----------------------------------------------
          // NESTED VALUES
          // ----------------------------------------------

          balances: {
            pkr: pkrBalance,
            gold: goldBalance,
            usdt: usdtBalance,
          },

          available: {
            pkr: availablePkr,
            gold: availableGold,
            usdt: availableUsdt,
          },

          locked: {
            pkr: lockedPkr,
            gold: lockedGold,
            usdt: lockedUsdt,
          },

          // ----------------------------------------------
          // TOTALS
          // ----------------------------------------------

          totals: {
            deposit: Number(
              wallet.totalDeposit ?? 0
            ),

            withdraw: Number(
              wallet.totalWithdraw ?? 0
            ),

            goldPurchased: Number(
              wallet.totalGoldPurchased ?? 0
            ),

            goldSold: Number(
              wallet.totalGoldSold ?? 0
            ),

            usdtDeposited: Number(
              wallet.totalUsdtDeposited ?? 0
            ),

            usdtWithdrawn: Number(
              wallet.totalUsdtWithdrawn ?? 0
            ),
          },

          status:
            wallet.status || "Active",

          createdAt:
            wallet.createdAt,

          updatedAt:
            wallet.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "GOLDTRADE V18 GET USER PORTFOLIO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load user portfolio.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error: error.message,
        }),
      });
    }
  }
);


// ======================================================
// GET LOGGED-IN USER WALLET HISTORY
// GET /api/wallet/history
//
// Used by:
// Wallet Page
// Dashboard
// ======================================================

router.get(
  "/history",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH CHECK
      // ==================================================

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // ==================================================
      // PAGINATION
      // ==================================================

      const requestedPage = Number(
        req.query.page
      );

      const requestedLimit = Number(
        req.query.limit
      );

      const page =
        Number.isFinite(requestedPage) &&
        requestedPage > 0
          ? Math.floor(requestedPage)
          : 1;

      const limit =
        Number.isFinite(requestedLimit) &&
        requestedLimit > 0
          ? Math.min(
              Math.floor(requestedLimit),
              100
            )
          : 20;

      const skip = (page - 1) * limit;

      // ==================================================
      // LOAD HISTORY
      // ==================================================

      const history =
        await WalletHistory.find({
          userId: req.user.id,
        })
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean();

      // ==================================================
      // TOTAL
      // ==================================================

      const total =
        await WalletHistory.countDocuments({
          userId: req.user.id,
        });

      // ==================================================
      // FORMAT HISTORY
      // ==================================================

      const formattedHistory =
        history.map((item) => ({
          id: String(item._id),

          _id: item._id,

          walletType:
            item.walletType || "",

          type:
            item.type || "",

          amount: Number(
            item.amount ?? 0
          ),

          balanceAfter: Number(
            item.balanceAfter ?? 0
          ),

          note:
            item.note || "",

          admin:
            item.admin || "",

          reference:
            item.reference ||
            item.referenceId ||
            "",

          status:
            item.status || "",

          createdAt:
            item.createdAt,
        }));

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        username:
          req.user.username || "",

        total,

        page,

        limit,

        totalPages:
          total > 0
            ? Math.ceil(total / limit)
            : 0,

        history:
          formattedHistory,
      });
    } catch (error) {
      console.error(
        "GOLDTRADE V18 GET WALLET HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load wallet history.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error: error.message,
        }),
      });
    }
  }
);

// ======================================================
// SEARCH WALLET HISTORY
// GET /api/wallet/history/search
//
// Filters:
// walletType
// type
// fromDate
// toDate
// ======================================================

router.get(
  "/history/search",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH CHECK
      // ==================================================

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // ==================================================
      // QUERY PARAMETERS
      // ==================================================

      const {
        walletType,
        type,
        fromDate,
        toDate,
      } = req.query;

      // ==================================================
      // BASE QUERY
      // ==================================================

      const query = {
        userId: req.user.id,
      };

      // ==================================================
      // WALLET TYPE FILTER
      // ==================================================

      if (
        typeof walletType === "string" &&
        walletType.trim()
      ) {
        query.walletType =
          walletType
            .trim()
            .toUpperCase();
      }

      // ==================================================
      // TRANSACTION TYPE FILTER
      // ==================================================

      if (
        typeof type === "string" &&
        type.trim()
      ) {
        query.type =
          type
            .trim()
            .toUpperCase();
      }

      // ==================================================
      // DATE FILTER
      // ==================================================

      if (
        typeof fromDate === "string" &&
        fromDate.trim()
      ) {
        const startDate =
          new Date(
            fromDate.trim()
          );

        if (
          Number.isNaN(
            startDate.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid fromDate.",
          });
        }

        query.createdAt = {
          ...(query.createdAt || {}),
          $gte: startDate,
        };
      }

      if (
        typeof toDate === "string" &&
        toDate.trim()
      ) {
        const endDate =
          new Date(
            toDate.trim()
          );

        if (
          Number.isNaN(
            endDate.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid toDate.",
          });
        }

        // Include the entire selected day
        endDate.setHours(
          23,
          59,
          59,
          999
        );

        query.createdAt = {
          ...(query.createdAt || {}),
          $lte: endDate,
        };
      }

      // ==================================================
      // LOAD RESULTS
      // ==================================================

      const history =
        await WalletHistory.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .limit(200)
          .lean();

      // ==================================================
      // FORMAT RESULTS
      // ==================================================

      const formattedHistory =
        history.map((item) => ({
          id: String(item._id),

          _id: item._id,

          walletType:
            item.walletType || "",

          type:
            item.type || "",

          amount: Number(
            item.amount ?? 0
          ),

          balanceAfter: Number(
            item.balanceAfter ?? 0
          ),

          note:
            item.note || "",

          admin:
            item.admin || "",

          reference:
            item.reference ||
            item.referenceId ||
            "",

          status:
            item.status || "",

          createdAt:
            item.createdAt,
        }));

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        total:
          formattedHistory.length,

        filters: {
          walletType:
            walletType || null,

          type:
            type || null,

          fromDate:
            fromDate || null,

          toDate:
            toDate || null,
        },

        history:
          formattedHistory,
      });
    } catch (error) {
      console.error(
        "GOLDTRADE V18 SEARCH WALLET HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to search wallet history.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error: error.message,
        }),
      });
    }
  }
);

// ======================================================
// GET RECENT WALLET TRANSACTIONS
// GET /api/wallet/recent
//
// Dashboard Recent Activity
// ======================================================

router.get(
  "/recent",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH CHECK
      // ==================================================

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // ==================================================
      // LOAD RECENT TRANSACTIONS
      // ==================================================

      const recentTransactions =
        await WalletHistory.find({
          userId: req.user.id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(10)
          .lean();

      // ==================================================
      // FORMAT
      // ==================================================

      const formattedTransactions =
        recentTransactions.map(
          (item) => ({
            id: String(item._id),

            _id: item._id,

            walletType:
              item.walletType || "",

            type:
              item.type || "",

            amount: Number(
              item.amount ?? 0
            ),

            balanceAfter: Number(
              item.balanceAfter ?? 0
            ),

            note:
              item.note || "",

            admin:
              item.admin || "",

            reference:
              item.reference ||
              item.referenceId ||
              "",

            status:
              item.status || "",

            createdAt:
              item.createdAt,
          })
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        total:
          formattedTransactions.length,

        transactions:
          formattedTransactions,
      });
    } catch (error) {
      console.error(
        "GOLDTRADE V18 GET RECENT WALLET TRANSACTIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load recent transactions.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error: error.message,
        }),
      });
    }
  }
);

// ======================================================
// GET WALLET HISTORY BY USERNAME
// GET /api/wallet/history/:username
//
// Admin:
//   Can access any user's history.
//
// User:
//   Can access only own history.
// ======================================================

router.get(
  "/history/:username",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH CHECK
      // ==================================================

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // ==================================================
      // NORMALIZE USERNAME
      // ==================================================

      const username = String(
        req.params.username || ""
      )
        .trim()
        .toLowerCase();

      const requesterUsername =
        String(
          req.user.username || ""
        )
          .trim()
          .toLowerCase();

      const requesterRole =
        String(
          req.user.role || ""
        )
          .trim()
          .toLowerCase();

      // ==================================================
      // VALIDATION
      // ==================================================

      if (!username) {
        return res.status(400).json({
          success: false,
          message:
            "Username is required.",
        });
      }

      // ==================================================
      // AUTHORIZATION
      // ==================================================

      const isAdminUser =
        requesterRole === "admin";

      const isOwnHistory =
        requesterUsername ===
        username;

      if (
        !isAdminUser &&
        !isOwnHistory
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      // ==================================================
      // FIND USER
      // ==================================================

      const user =
        await User.findOne({
          username,
        })
          .select(
            "_id username email role"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // PAGINATION
      // ==================================================

      const requestedPage =
        Number(req.query.page);

      const requestedLimit =
        Number(req.query.limit);

      const page =
        Number.isFinite(
          requestedPage
        ) &&
        requestedPage > 0
          ? Math.floor(
              requestedPage
            )
          : 1;

      const limit =
        Number.isFinite(
          requestedLimit
        ) &&
        requestedLimit > 0
          ? Math.min(
              Math.floor(
                requestedLimit
              ),
              100
            )
          : 50;

      const skip =
        (page - 1) * limit;

      // ==================================================
      // LOAD HISTORY
      // ==================================================

      const history =
        await WalletHistory.find({
          userId: user._id,
        })
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean();

      // ==================================================
      // TOTAL
      // ==================================================

      const total =
        await WalletHistory.countDocuments({
          userId: user._id,
        });

      // ==================================================
      // FORMAT
      // ==================================================

      const formattedHistory =
        history.map((item) => ({
          id: String(item._id),

          _id: item._id,

          walletType:
            item.walletType || "",

          type:
            item.type || "",

          amount: Number(
            item.amount ?? 0
          ),

          balanceAfter: Number(
            item.balanceAfter ?? 0
          ),

          note:
            item.note || "",

          admin:
            item.admin || "",

          reference:
            item.reference ||
            item.referenceId ||
            "",

          status:
            item.status || "",

          createdAt:
            item.createdAt,
        }));

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        username:
          user.username,

        total,

        page,

        limit,

        totalPages:
          total > 0
            ? Math.ceil(
                total / limit
              )
            : 0,

        history:
          formattedHistory,
      });
    } catch (error) {
      console.error(
        "GOLDTRADE V18 GET USER WALLET HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load user wallet history.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error: error.message,
        }),
      });
    }
  }
);


// ======================================================
// ADMIN CREDIT WALLET
// POST /api/wallet/admin/credit
//
// Admin only
// Supports:
// PKR
// GOLD
// USDT
// ======================================================

router.post(
  "/admin/credit",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // ADMIN AUTH CHECK
      // ==================================================

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // ==================================================
      // REQUEST DATA
      // ==================================================

      const {
        userId,
        walletType,
        amount,
        note,
      } = req.body || {};

      // ==================================================
      // REQUIRED FIELDS
      // ==================================================

      if (
        !userId ||
        !walletType ||
        amount === undefined ||
        amount === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "User ID, wallet type and amount are required.",
        });
      }

      // ==================================================
      // NORMALIZE AMOUNT
      // ==================================================

      const creditAmount = Number(amount);

      if (
        !Number.isFinite(creditAmount) ||
        creditAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Amount must be a valid number greater than zero.",
        });
      }

      // ==================================================
      // NORMALIZE WALLET TYPE
      // ==================================================

      const walletKey = String(
        walletType
      )
        .trim()
        .toUpperCase();

      if (
        !["PKR", "GOLD", "USDT"].includes(
          walletKey
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid wallet type. Allowed: PKR, GOLD, USDT.",
        });
      }

      // ==================================================
      // FIND USER
      // ==================================================

      const user =
        await User.findById(userId)
          .select("_id username")
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // GET / CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(user);

      // ==================================================
      // WALLET FREEZE CHECK
      // ==================================================

      if (wallet.isFrozen === true) {
        return res.status(403).json({
          success: false,
          message:
            "This wallet is frozen and cannot be credited.",
        });
      }

      // ==================================================
      // ADMIN NAME
      // ==================================================

      const adminUsername =
        String(
          req.user.username ||
            req.user.email ||
            "Admin"
        ).trim();

      // ==================================================
      // UPDATE WALLET
      // ==================================================

      let balanceBefore = 0;
      let balanceAfter = 0;

      switch (walletKey) {
        case "PKR": {
          balanceBefore = Number(
            wallet.pkrBalance ?? 0
          );

          wallet.pkrBalance =
            balanceBefore +
            creditAmount;

          wallet.totalDeposit =
            Number(
              wallet.totalDeposit ?? 0
            ) + creditAmount;

          wallet.totalPkrDeposit =
            Number(
              wallet.totalPkrDeposit ?? 0
            ) + creditAmount;

          wallet.lastDepositAt =
            new Date();

          balanceAfter =
            Number(
              wallet.pkrBalance
            );

          break;
        }

        case "GOLD": {
          balanceBefore = Number(
            wallet.goldBalance ?? 0
          );

          wallet.goldBalance =
            balanceBefore +
            creditAmount;

          wallet.totalGoldPurchased =
            Number(
              wallet.totalGoldPurchased ?? 0
            ) + creditAmount;

          wallet.lastTradeAt =
            new Date();

          balanceAfter =
            Number(
              wallet.goldBalance
            );

          break;
        }

        case "USDT": {
          balanceBefore = Number(
            wallet.usdtBalance ?? 0
          );

          wallet.usdtBalance =
            balanceBefore +
            creditAmount;

          wallet.totalUsdtDeposited =
            Number(
              wallet.totalUsdtDeposited ?? 0
            ) + creditAmount;

          wallet.lastDepositAt =
            new Date();

          balanceAfter =
            Number(
              wallet.usdtBalance
            );

          break;
        }

        default:
          return res.status(400).json({
            success: false,
            message:
              "Unsupported wallet type.",
          });
      }

      // ==================================================
      // SAVE WALLET
      // ==================================================

      await wallet.save();

      // ==================================================
      // WALLET HISTORY
      // ==================================================

      await WalletHistory.create({
        userId: user._id,

        username:
          user.username,

        walletType:
          walletKey,

        type:
          "CREDIT",

        amount:
          creditAmount,

        balanceAfter:
          balanceAfter,

        note:
          String(
            note ||
              "Wallet credited by admin"
          ).trim(),

        admin:
          adminUsername,
      });

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          `${walletKey} wallet credited successfully.`,

        walletType:
          walletKey,

        creditedAmount:
          creditAmount,

        balanceBefore:
          balanceBefore,

        balanceAfter:
          balanceAfter,

        wallet: {
          pkrBalance: Number(
            wallet.pkrBalance ?? 0
          ),

          goldBalance: Number(
            wallet.goldBalance ?? 0
          ),

          usdtBalance: Number(
            wallet.usdtBalance ?? 0
          ),

          portfolioValue: Number(
            wallet.portfolioValue ?? 0
          ),

          liveProfit: Number(
            wallet.liveProfit ?? 0
          ),

          status:
            wallet.status ||
            "Active",
        },
      });
    } catch (error) {
      console.error(
        "GOLDTRADE V18 ADMIN CREDIT WALLET ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to credit wallet.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error: error.message,
        }),
      });
    }
  }
);

// ======================================================
// ADMIN DEBIT WALLET
// POST /api/wallet/admin/debit
//
// Admin only
// Supports:
// PKR
// GOLD
// USDT
// ======================================================

router.post(
  "/admin/debit",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // ADMIN AUTH CHECK
      // ==================================================

      if (!req.user?.id) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // ==================================================
      // REQUEST DATA
      // ==================================================

      const {
        userId,
        walletType,
        amount,
        note,
      } = req.body || {};

      // ==================================================
      // REQUIRED FIELDS
      // ==================================================

      if (
        !userId ||
        !walletType ||
        amount === undefined ||
        amount === null
      ) {
        return res.status(400).json({
          success: false,
          message:
            "User ID, wallet type and amount are required.",
        });
      }

      // ==================================================
      // NORMALIZE AMOUNT
      // ==================================================

      const debitAmount = Number(amount);

      if (
        !Number.isFinite(debitAmount) ||
        debitAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Amount must be a valid number greater than zero.",
        });
      }

      // ==================================================
      // NORMALIZE WALLET TYPE
      // ==================================================

      const walletKey = String(
        walletType
      )
        .trim()
        .toUpperCase();

      if (
        !["PKR", "GOLD", "USDT"].includes(
          walletKey
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid wallet type. Allowed: PKR, GOLD, USDT.",
        });
      }

      // ==================================================
      // FIND USER
      // ==================================================

      const user =
        await User.findById(userId)
          .select("_id username")
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // GET / CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(user);

      // ==================================================
      // WALLET FREEZE CHECK
      // ==================================================

      if (wallet.isFrozen === true) {
        return res.status(403).json({
          success: false,
          message:
            "This wallet is frozen and cannot be debited.",
        });
      }

      // ==================================================
      // ADMIN NAME
      // ==================================================

      const adminUsername =
        String(
          req.user.username ||
            req.user.email ||
            "Admin"
        ).trim();

      // ==================================================
      // UPDATE WALLET
      // ==================================================

      let balanceBefore = 0;
      let balanceAfter = 0;

      switch (walletKey) {
        case "PKR": {
          balanceBefore = Number(
            wallet.pkrBalance ?? 0
          );

          if (
            balanceBefore <
            debitAmount
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Insufficient PKR wallet balance.",
              availableBalance:
                balanceBefore,
              requestedAmount:
                debitAmount,
            });
          }

          wallet.pkrBalance =
            balanceBefore -
            debitAmount;

          wallet.totalWithdraw =
            Number(
              wallet.totalWithdraw ?? 0
            ) + debitAmount;

          wallet.totalPkrWithdraw =
            Number(
              wallet.totalPkrWithdraw ?? 0
            ) + debitAmount;

          wallet.lastWithdrawAt =
            new Date();

          balanceAfter =
            Number(
              wallet.pkrBalance
            );

          break;
        }

        case "GOLD": {
          balanceBefore = Number(
            wallet.goldBalance ?? 0
          );

          if (
            balanceBefore <
            debitAmount
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Insufficient Gold wallet balance.",
              availableBalance:
                balanceBefore,
              requestedAmount:
                debitAmount,
            });
          }

          wallet.goldBalance =
            balanceBefore -
            debitAmount;

          wallet.totalGoldSold =
            Number(
              wallet.totalGoldSold ?? 0
            ) + debitAmount;

          wallet.lastTradeAt =
            new Date();

          balanceAfter =
            Number(
              wallet.goldBalance
            );

          break;
        }

        case "USDT": {
          balanceBefore = Number(
            wallet.usdtBalance ?? 0
          );

          if (
            balanceBefore <
            debitAmount
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Insufficient USDT wallet balance.",
              availableBalance:
                balanceBefore,
              requestedAmount:
                debitAmount,
            });
          }

          wallet.usdtBalance =
            balanceBefore -
            debitAmount;

          wallet.totalUsdtWithdrawn =
            Number(
              wallet.totalUsdtWithdrawn ?? 0
            ) + debitAmount;

          wallet.lastWithdrawAt =
            new Date();

          balanceAfter =
            Number(
              wallet.usdtBalance
            );

          break;
        }

        default:
          return res.status(400).json({
            success: false,
            message:
              "Unsupported wallet type.",
          });
      }

      // ==================================================
      // SAVE WALLET
      // ==================================================

      await wallet.save();

      // ==================================================
      // WALLET HISTORY
      // ==================================================

      await WalletHistory.create({
        userId: user._id,

        username:
          user.username,

        walletType:
          walletKey,

        type:
          "DEBIT",

        amount:
          debitAmount,

        balanceAfter:
          balanceAfter,

        note:
          String(
            note ||
              "Wallet debited by admin"
          ).trim(),

        admin:
          adminUsername,
      });

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          `${walletKey} wallet debited successfully.`,

        walletType:
          walletKey,

        debitedAmount:
          debitAmount,

        balanceBefore:
          balanceBefore,

        balanceAfter:
          balanceAfter,

        wallet: {
          pkrBalance: Number(
            wallet.pkrBalance ?? 0
          ),

          goldBalance: Number(
            wallet.goldBalance ?? 0
          ),

          usdtBalance: Number(
            wallet.usdtBalance ?? 0
          ),

          portfolioValue: Number(
            wallet.portfolioValue ?? 0
          ),

          liveProfit: Number(
            wallet.liveProfit ?? 0
          ),

          status:
            wallet.status ||
            "Active",
        },
      });
    } catch (error) {
      console.error(
        "GOLDTRADE V18 ADMIN DEBIT WALLET ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to debit wallet.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error: error.message,
        }),
      });
    }
  }
);


// ======================================================
// REFRESH LOGGED-IN USER WALLET
// GET /api/wallet/refresh
// Dashboard Auto Refresh API
// ======================================================

router.get("/refresh", verifyToken, async (req, res) => {
  try {
    // --------------------------------------------------
    // AUTH VALIDATION
    // --------------------------------------------------

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // --------------------------------------------------
    // LOAD USER
    // --------------------------------------------------

    const user = await User.findById(userId)
      .select("_id username email role")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // --------------------------------------------------
    // GET / CREATE WALLET
    // --------------------------------------------------

    const wallet = await getOrCreateWallet(user);

    if (!wallet) {
      return res.status(500).json({
        success: false,
        message: "Unable to load wallet.",
      });
    }

    // --------------------------------------------------
    // NORMALIZE WALLET VALUES
    // --------------------------------------------------

    const pkrBalance = Number(wallet.pkrBalance || 0);
    const goldBalance = Number(wallet.goldBalance || 0);
    const usdtBalance = Number(wallet.usdtBalance || 0);

    const lockedPkr = Number(wallet.lockedPkr || 0);
    const lockedGold = Number(wallet.lockedGold || 0);
    const lockedUsdt = Number(wallet.lockedUsdt || 0);

    const availablePkr = Math.max(
      pkrBalance - lockedPkr,
      0
    );

    const availableGold = Math.max(
      goldBalance - lockedGold,
      0
    );

    const availableUsdt = Math.max(
      usdtBalance - lockedUsdt,
      0
    );

    const portfolioValue = Number(
      wallet.portfolioValue || 0
    );

    const liveProfit = Number(
      wallet.liveProfit || 0
    );

    const liveProfitPercent = Number(
      wallet.liveProfitPercent || 0
    );

    const totalWalletValue = Number(
      wallet.totalWalletValue || portfolioValue
    );

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      username: wallet.username || user.username,

      wallet: {
        pkrBalance,
        goldBalance,
        usdtBalance,

        lockedPkr,
        lockedGold,
        lockedUsdt,

        availablePkr,
        availableGold,
        availableUsdt,

        portfolioValue,
        liveProfit,
        liveProfitPercent,

        totalWalletValue,

        totalDeposit: Number(wallet.totalDeposit || 0),
        totalWithdraw: Number(wallet.totalWithdraw || 0),

        totalPkrDeposit: Number(
          wallet.totalPkrDeposit || 0
        ),

        totalPkrWithdraw: Number(
          wallet.totalPkrWithdraw || 0
        ),

        totalGoldPurchased: Number(
          wallet.totalGoldPurchased || 0
        ),

        totalGoldSold: Number(
          wallet.totalGoldSold || 0
        ),

        totalUsdtDeposited: Number(
          wallet.totalUsdtDeposited || 0
        ),

        totalUsdtWithdrawn: Number(
          wallet.totalUsdtWithdrawn || 0
        ),

        status: wallet.status || "Active",

        isVerified: Boolean(
          wallet.isVerified
        ),

        isFrozen: Boolean(
          wallet.isFrozen
        ),

        updatedAt: wallet.updatedAt || null,
      },

      refreshedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error(
      "REFRESH WALLET ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to refresh wallet.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});


// ======================================================
// ADMIN REFRESH USER WALLET
// GET /api/wallet/admin/refresh/:userId
// ======================================================

router.get(
  "/admin/refresh/:userId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ------------------------------------------------
      // VALIDATE USER ID
      // ------------------------------------------------

      const userId = req.params.userId;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "User ID is required.",
        });
      }

      // ------------------------------------------------
      // LOAD USER
      // ------------------------------------------------

      const user = await User.findById(userId)
        .select("_id username email role")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ------------------------------------------------
      // GET / CREATE WALLET
      // ------------------------------------------------

      const wallet = await getOrCreateWallet(user);

      if (!wallet) {
        return res.status(500).json({
          success: false,
          message: "Unable to load user wallet.",
        });
      }

      // ------------------------------------------------
      // NORMALIZE BALANCES
      // ------------------------------------------------

      const pkrBalance = Number(
        wallet.pkrBalance || 0
      );

      const goldBalance = Number(
        wallet.goldBalance || 0
      );

      const usdtBalance = Number(
        wallet.usdtBalance || 0
      );

      const lockedPkr = Number(
        wallet.lockedPkr || 0
      );

      const lockedGold = Number(
        wallet.lockedGold || 0
      );

      const lockedUsdt = Number(
        wallet.lockedUsdt || 0
      );

      const availablePkr = Math.max(
        pkrBalance - lockedPkr,
        0
      );

      const availableGold = Math.max(
        goldBalance - lockedGold,
        0
      );

      const availableUsdt = Math.max(
        usdtBalance - lockedUsdt,
        0
      );

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        wallet: {
          userId: user._id,
          username:
            wallet.username || user.username,

          email: user.email || "",
          role: user.role || "user",

          pkrBalance,
          goldBalance,
          usdtBalance,

          availablePkr,
          availableGold,
          availableUsdt,

          lockedPkr,
          lockedGold,
          lockedUsdt,

          portfolioValue: Number(
            wallet.portfolioValue || 0
          ),

          liveProfit: Number(
            wallet.liveProfit || 0
          ),

          liveProfitPercent: Number(
            wallet.liveProfitPercent || 0
          ),

          totalWalletValue: Number(
            wallet.totalWalletValue ||
              wallet.portfolioValue ||
              0
          ),

          totalDeposit: Number(
            wallet.totalDeposit || 0
          ),

          totalWithdraw: Number(
            wallet.totalWithdraw || 0
          ),

          totalPkrDeposit: Number(
            wallet.totalPkrDeposit || 0
          ),

          totalPkrWithdraw: Number(
            wallet.totalPkrWithdraw || 0
          ),

          totalGoldPurchased: Number(
            wallet.totalGoldPurchased || 0
          ),

          totalGoldSold: Number(
            wallet.totalGoldSold || 0
          ),

          totalUsdtDeposited: Number(
            wallet.totalUsdtDeposited || 0
          ),

          totalUsdtWithdrawn: Number(
            wallet.totalUsdtWithdrawn || 0
          ),

          status:
            wallet.status || "Active",

          isVerified: Boolean(
            wallet.isVerified
          ),

          isFrozen: Boolean(
            wallet.isFrozen
          ),

          updatedAt:
            wallet.updatedAt || null,
        },
      });

    } catch (error) {
      console.error(
        "ADMIN REFRESH WALLET ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to refresh admin wallet.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// WALLET DIAGNOSTICS
// GET /api/wallet/debug
// Backend Testing
// ======================================================

router.get("/debug", verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // --------------------------------------------------
    // LOAD WALLET
    // --------------------------------------------------

    const wallet = await Wallet.findOne({
      userId,
    }).lean();

    // --------------------------------------------------
    // HISTORY COUNT
    // --------------------------------------------------

    const historyCount =
      await WalletHistory.countDocuments({
        userId,
      });

    // --------------------------------------------------
    // USER
    // --------------------------------------------------

    const user = await User.findById(userId)
      .select("_id username role")
      .lean();

    // --------------------------------------------------
    // DEBUG RESPONSE
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      module:
        "GoldTrade Wallet API V18 Enterprise",

      serverTime:
        new Date().toISOString(),

      authenticatedUser: {
        id: req.user?.id || null,
        role: req.user?.role || null,
        username: req.user?.username || null,
      },

      databaseUser: user
        ? {
            id: user._id,
            username: user.username,
            role: user.role,
          }
        : null,

      walletExists: Boolean(wallet),

      wallet: wallet
        ? {
            id: wallet._id,
            userId: wallet.userId,
            username: wallet.username,

            pkrBalance: Number(
              wallet.pkrBalance || 0
            ),

            goldBalance: Number(
              wallet.goldBalance || 0
            ),

            usdtBalance: Number(
              wallet.usdtBalance || 0
            ),

            lockedPkr: Number(
              wallet.lockedPkr || 0
            ),

            lockedGold: Number(
              wallet.lockedGold || 0
            ),

            lockedUsdt: Number(
              wallet.lockedUsdt || 0
            ),

            status:
              wallet.status || "Active",

            isVerified: Boolean(
              wallet.isVerified
            ),

            isFrozen: Boolean(
              wallet.isFrozen
            ),
          }
        : null,

      walletHistoryCount: historyCount,

      mongodbReady: true,
    });

  } catch (error) {
    console.error(
      "WALLET DEBUG ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Wallet diagnostics failed.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});


// ======================================================
// ADMIN WALLET LIST
// GET /api/wallet/admin/all
// ======================================================

router.get(
  "/admin/all",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ------------------------------------------------
      // PAGINATION
      // ------------------------------------------------

      const requestedPage =
        Number.parseInt(
          req.query.page,
          10
        );

      const requestedLimit =
        Number.parseInt(
          req.query.limit,
          10
        );

      const page =
        Number.isFinite(requestedPage) &&
        requestedPage > 0
          ? requestedPage
          : 1;

      const limit =
        Number.isFinite(requestedLimit) &&
        requestedLimit > 0
          ? Math.min(requestedLimit, 100)
          : 25;

      const skip =
        (page - 1) * limit;

      // ------------------------------------------------
      // LOAD WALLETS
      // ------------------------------------------------

      const [wallets, total] =
        await Promise.all([
          Wallet.find({})
            .sort({
              updatedAt: -1,
              _id: -1,
            })
            .skip(skip)
            .limit(limit)
            .lean(),

          Wallet.countDocuments({}),
        ]);

      // ------------------------------------------------
      // NORMALIZE WALLET DATA
      // ------------------------------------------------

      const normalizedWallets =
        wallets.map((wallet) => ({
          _id: wallet._id,
          userId: wallet.userId,
          username: wallet.username,

          pkrBalance: Number(
            wallet.pkrBalance || 0
          ),

          goldBalance: Number(
            wallet.goldBalance || 0
          ),

          usdtBalance: Number(
            wallet.usdtBalance || 0
          ),

          lockedPkr: Number(
            wallet.lockedPkr || 0
          ),

          lockedGold: Number(
            wallet.lockedGold || 0
          ),

          lockedUsdt: Number(
            wallet.lockedUsdt || 0
          ),

          portfolioValue: Number(
            wallet.portfolioValue || 0
          ),

          liveProfit: Number(
            wallet.liveProfit || 0
          ),

          liveProfitPercent: Number(
            wallet.liveProfitPercent || 0
          ),

          totalWalletValue: Number(
            wallet.totalWalletValue ||
              wallet.portfolioValue ||
              0
          ),

          totalDeposit: Number(
            wallet.totalDeposit || 0
          ),

          totalWithdraw: Number(
            wallet.totalWithdraw || 0
          ),

          status:
            wallet.status || "Active",

          isVerified: Boolean(
            wallet.isVerified
          ),

          isFrozen: Boolean(
            wallet.isFrozen
          ),

          createdAt:
            wallet.createdAt || null,

          updatedAt:
            wallet.updatedAt || null,
        }));

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        total,

        page,

        limit,

        totalPages:
          total > 0
            ? Math.ceil(total / limit)
            : 0,

        hasNextPage:
          page * limit < total,

        hasPreviousPage:
          page > 1,

        wallets:
          normalizedWallets,
      });

    } catch (error) {
      console.error(
        "ADMIN WALLET LIST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load wallets.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// WALLET MODULE STATUS
// GET /api/wallet/status
// Public Health Check
// ======================================================

router.get("/status", (req, res) => {
  return res.status(200).json({
    success: true,

    module: "Wallet API",

    version: "18.0.0 Enterprise",

    environment:
      process.env.NODE_ENV ||
      "development",

    timestamp:
      new Date().toISOString(),
  });
});


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;