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
// CONSTANTS
// ======================================================

const ALLOWED_WALLET_TYPES = [
  "PKR",
  "GOLD",
  "USDT",
];

// ======================================================
// HELPER — SAFE NUMBER
// ======================================================

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

// ======================================================
// HELPER — NORMALIZE WALLET TYPE
// ======================================================

const normalizeWalletType = (value) => {
  return String(value ?? "")
    .trim()
    .toUpperCase();
};

// ======================================================
// HELPER — VALIDATE WALLET TYPE
// ======================================================

const isValidWalletType = (value) => {
  return ALLOWED_WALLET_TYPES.includes(
    normalizeWalletType(value)
  );
};

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

  // ====================================================
  // CREATE WALLET IF MISSING
  // ====================================================

  if (!wallet) {
    wallet = await Wallet.create({
      userId: user._id,

      username: String(user.username ?? "")
        .trim()
        .toLowerCase(),

      // ==============================================
      // MAIN BALANCES
      // ==============================================

      balance: 0,

      pkrBalance: 0,
      goldBalance: 0,
      usdtBalance: 0,

      // ==============================================
      // LOCKED BALANCES
      // ==============================================

      lockedPkr: 0,
      lockedGold: 0,
      lockedUsdt: 0,

      // ==============================================
      // PERFORMANCE
      // ==============================================

      portfolioValue: 0,
      liveProfit: 0,
      liveProfitPercent: 0,
      totalWalletValue: 0,

      // ==============================================
      // TOTALS
      // ==============================================

      totalDeposit: 0,
      totalWithdraw: 0,

      totalPkrDeposit: 0,
      totalPkrWithdraw: 0,

      totalGoldPurchased: 0,
      totalGoldSold: 0,

      totalUsdtDeposited: 0,
      totalUsdtWithdrawn: 0,

      // ==============================================
      // STATUS
      // ==============================================

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
// HELPER — GET LOGGED-IN USER
// ======================================================

const getLoggedInUser = async (req) => {
  const userId =
    req.user?.id ||
    req.user?._id;

  if (!userId) {
    throw new Error("AUTHENTICATION_REQUIRED");
  }

  const user = await User.findById(userId)
    .select("_id username email role")
    .lean();

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
};

// ======================================================
// HELPER — WALLET SNAPSHOT
// ======================================================

const buildWalletSnapshot = (
  wallet,
  user = null
) => {
  // ====================================================
  // MAIN BALANCES
  // ====================================================

  const pkrBalance = toNumber(
    wallet?.pkrBalance
  );

  const goldBalance = toNumber(
    wallet?.goldBalance
  );

  const usdtBalance = toNumber(
    wallet?.usdtBalance
  );

  // ====================================================
  // LOCKED BALANCES
  // ====================================================

  const lockedPkr = toNumber(
    wallet?.lockedPkr
  );

  const lockedGold = toNumber(
    wallet?.lockedGold
  );

  const lockedUsdt = toNumber(
    wallet?.lockedUsdt
  );

  // ====================================================
  // AVAILABLE BALANCES
  // ====================================================

  const availablePkr = Math.max(
    0,
    pkrBalance - lockedPkr
  );

  const availableGold = Math.max(
    0,
    goldBalance - lockedGold
  );

  const availableUsdt = Math.max(
    0,
    usdtBalance - lockedUsdt
  );

  // ====================================================
  // PERFORMANCE
  // ====================================================

  const portfolioValue = toNumber(
    wallet?.portfolioValue
  );

  const liveProfit = toNumber(
    wallet?.liveProfit
  );

  const liveProfitPercent = toNumber(
    wallet?.liveProfitPercent
  );

  const totalWalletValue = toNumber(
    wallet?.totalWalletValue ??
      portfolioValue
  );

  // ====================================================
  // SNAPSHOT
  // ====================================================

  return {
    userId:
      user?._id ??
      wallet?.userId ??
      null,

    username:
      wallet?.username ||
      user?.username ||
      "",

    email:
      user?.email ||
      "",

    role:
      user?.role ||
      "",

    // ================================================
    // BALANCES
    // ================================================

    pkrBalance,
    goldBalance,
    usdtBalance,

    lockedPkr,
    lockedGold,
    lockedUsdt,

    availablePkr,
    availableGold,
    availableUsdt,

    // ================================================
    // NESTED BALANCES
    // ================================================

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

    // ================================================
    // PERFORMANCE
    // ================================================

    portfolioValue,
    liveProfit,
    liveProfitPercent,
    totalWalletValue,

    performance: {
      portfolioValue,
      liveProfit,
      liveProfitPercent,
      totalWalletValue,
    },

    // ================================================
    // TOTALS
    // ================================================

    totalDeposit: toNumber(
      wallet?.totalDeposit
    ),

    totalWithdraw: toNumber(
      wallet?.totalWithdraw
    ),

    totalPkrDeposit: toNumber(
      wallet?.totalPkrDeposit
    ),

    totalPkrWithdraw: toNumber(
      wallet?.totalPkrWithdraw
    ),

    totalGoldPurchased: toNumber(
      wallet?.totalGoldPurchased
    ),

    totalGoldSold: toNumber(
      wallet?.totalGoldSold
    ),

    totalUsdtDeposited: toNumber(
      wallet?.totalUsdtDeposited
    ),

    totalUsdtWithdrawn: toNumber(
      wallet?.totalUsdtWithdrawn
    ),

    totals: {
      deposit: toNumber(
        wallet?.totalDeposit
      ),

      withdraw: toNumber(
        wallet?.totalWithdraw
      ),

      goldPurchased: toNumber(
        wallet?.totalGoldPurchased
      ),

      goldSold: toNumber(
        wallet?.totalGoldSold
      ),

      usdtDeposited: toNumber(
        wallet?.totalUsdtDeposited
      ),

      usdtWithdrawn: toNumber(
        wallet?.totalUsdtWithdrawn
      ),
    },

    // ================================================
    // STATUS
    // ================================================

    status:
      wallet?.status ||
      "Active",

    isVerified: Boolean(
      wallet?.isVerified
    ),

    isFrozen: Boolean(
      wallet?.isFrozen
    ),

    // ================================================
    // DATES
    // ================================================

    createdAt:
      wallet?.createdAt ??
      null,

    updatedAt:
      wallet?.updatedAt ??
      null,
  };
};

// ======================================================
// GET LOGGED-IN USER WALLET
// GET /api/wallet
//
// IMPORTANT:
// ROOT wallet route
// ======================================================

router.get(
  "/",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // GET LOGGED-IN USER
      // ==================================================

      const user = await getLoggedInUser(req);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // GET OR CREATE USER WALLET
      // ==================================================

      const wallet = await getOrCreateWallet(user);

      // ==================================================
      // BUILD WALLET SNAPSHOT
      // ==================================================

      const snapshot = buildWalletSnapshot(
        wallet,
        user
      );

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        username: snapshot.username,

        wallet: snapshot,

        updatedAt:
          wallet.updatedAt ||
          new Date(),
      });

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 GET ROOT WALLET ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (
        error?.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,
        message:
          "Unable to load wallet.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
        }),
      });
    }
  }
);

 // ======================================================
// GET LOGGED-IN USER WALLET
// GET /api/wallet/balance
//
// Compatibility endpoint
// ======================================================

router.get(
  "/balance",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // GET LOGGED-IN USER
      // ==================================================

      const user = await getLoggedInUser(req);

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
      // BUILD WALLET SNAPSHOT
      // ==================================================

      const snapshot = buildWalletSnapshot(
        wallet,
        user
      );

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        username: snapshot.username,

        wallet: {
          pkrBalance:
            snapshot.pkrBalance,

          goldBalance:
            snapshot.goldBalance,

          usdtBalance:
            snapshot.usdtBalance,

          lockedPkr:
            snapshot.lockedPkr,

          lockedGold:
            snapshot.lockedGold,

          lockedUsdt:
            snapshot.lockedUsdt,

          availablePkr:
            snapshot.availablePkr,

          availableGold:
            snapshot.availableGold,

          availableUsdt:
            snapshot.availableUsdt,

          portfolioValue:
            snapshot.portfolioValue,

          liveProfit:
            snapshot.liveProfit,

          liveProfitPercent:
            snapshot.liveProfitPercent,

          totalWalletValue:
            snapshot.totalWalletValue,

          status:
            snapshot.status,

          isFrozen:
            snapshot.isFrozen,
        },

        updatedAt:
          wallet.updatedAt ||
          new Date(),
      });

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 GET WALLET BALANCE ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (
        error?.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,
        message:
          "Unable to load wallet balance.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
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
      // GET LOGGED-IN USER
      // ==================================================

      const user = await getLoggedInUser(req);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // GET / CREATE WALLET
      // ==================================================

      const wallet = await getOrCreateWallet(user);

      // ==================================================
      // BUILD WALLET SNAPSHOT
      // ==================================================

      const snapshot = buildWalletSnapshot(
        wallet,
        user
      );

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
          .sort({
            createdAt: -1,
          })
          .lean();

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        summary: {
          // ==============================================
          // USER
          // ==============================================

          userId: snapshot.userId,

          username: snapshot.username,

          // ==============================================
          // FLAT BALANCES
          // ==============================================

          pkrBalance: snapshot.pkrBalance,

          goldBalance: snapshot.goldBalance,

          usdtBalance: snapshot.usdtBalance,

          availablePkr: snapshot.availablePkr,

          availableGold: snapshot.availableGold,

          availableUsdt: snapshot.availableUsdt,

          lockedPkr: snapshot.lockedPkr,

          lockedGold: snapshot.lockedGold,

          lockedUsdt: snapshot.lockedUsdt,

          // ==============================================
          // PERFORMANCE
          // ==============================================

          portfolioValue: snapshot.portfolioValue,

          liveProfit: snapshot.liveProfit,

          liveProfitPercent:
            snapshot.liveProfitPercent,

          totalWalletValue:
            snapshot.totalWalletValue,

          // ==============================================
          // NESTED BALANCES
          // ==============================================

          balances: snapshot.balances,

          available: snapshot.available,

          locked: snapshot.locked,

          performance: snapshot.performance,

          // ==============================================
          // TOTALS
          // ==============================================

          totals: snapshot.totals,

          // ==============================================
          // TRANSACTIONS
          // ==============================================

          totalTransactions,

          // ------------------------------------------------
          // IMPORTANT:
          // Do NOT use formatHistoryItem() here because
          // that function is not defined/imported.
          // WalletHistory.findOne().lean() already returns
          // a plain JavaScript object suitable for JSON.
          // ------------------------------------------------

          lastTransaction:
            lastTransaction || null,

          // ==============================================
          // STATUS
          // ==============================================

          status: snapshot.status,

          isFrozen: snapshot.isFrozen,

          // ==============================================
          // UPDATED AT
          // ==============================================

          updatedAt:
            wallet.updatedAt ||
            new Date(),
        },
      });
    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 GET WALLET SUMMARY ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (
        error?.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to load wallet summary.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
        }),
      });
    }
  }
);
// ======================================================
// GET LOGGED-IN USER PORTFOLIO
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
      // GET LOGGED-IN USER
      // ==================================================

      const user = await getLoggedInUser(req);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // GET / CREATE WALLET
      // ==================================================

      const wallet = await getOrCreateWallet(user);

      // ==================================================
      // BUILD WALLET SNAPSHOT
      // ==================================================

      const snapshot = buildWalletSnapshot(
        wallet,
        user
      );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        portfolio: {
          // ==============================================
          // USER
          // ==============================================

          userId:
            snapshot.userId,

          username:
            snapshot.username,

          email:
            snapshot.email,

          role:
            snapshot.role,

          // ==============================================
          // FLAT BALANCES
          // ==============================================

          pkrBalance:
            snapshot.pkrBalance,

          goldBalance:
            snapshot.goldBalance,

          usdtBalance:
            snapshot.usdtBalance,

          availablePkr:
            snapshot.availablePkr,

          availableGold:
            snapshot.availableGold,

          availableUsdt:
            snapshot.availableUsdt,

          lockedPkr:
            snapshot.lockedPkr,

          lockedGold:
            snapshot.lockedGold,

          lockedUsdt:
            snapshot.lockedUsdt,

          // ==============================================
          // PERFORMANCE
          // ==============================================

          portfolioValue:
            snapshot.portfolioValue,

          liveProfit:
            snapshot.liveProfit,

          liveProfitPercent:
            snapshot.liveProfitPercent,

          totalWalletValue:
            snapshot.totalWalletValue,

          // ==============================================
          // NESTED BALANCES
          // ==============================================

          balances:
            snapshot.balances,

          available:
            snapshot.available,

          locked:
            snapshot.locked,

          // ==============================================
          // PERFORMANCE OBJECT
          // ==============================================

          performance:
            snapshot.performance,

          // ==============================================
          // TOTALS
          // ==============================================

          totals:
            snapshot.totals,

          // ==============================================
          // STATUS
          // ==============================================

          status:
            snapshot.status,

          isVerified:
            snapshot.isVerified,

          isFrozen:
            snapshot.isFrozen,

          // ==============================================
          // DATES
          // ==============================================

          createdAt:
            snapshot.createdAt,

          updatedAt:
            snapshot.updatedAt,
        },
      });

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 GET PORTFOLIO ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (
        error?.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to load portfolio.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
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
      // NORMALIZE REQUESTED USERNAME
      // ==================================================

      const username = String(
        req.params?.username ?? ""
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
      // REQUESTER INFORMATION
      // ==================================================

      const requesterRole = String(
        req.user?.role ?? ""
      )
        .trim()
        .toLowerCase();

      const requesterUsername = String(
        req.user?.username ?? ""
      )
        .trim()
        .toLowerCase();

      const requesterId =
        req.user?.id ||
        req.user?._id ||
        null;

      const isAdminUser =
        requesterRole === "admin";

      // ==================================================
      // FIND REQUESTED USER
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
      // CHECK OWNERSHIP
      // ==================================================

      const isOwnPortfolio =
        (
          requesterUsername &&
          requesterUsername ===
            String(
              user.username ?? ""
            )
              .trim()
              .toLowerCase()
        ) ||
        (
          requesterId &&
          String(requesterId) ===
            String(user._id)
        );

      // ==================================================
      // AUTHORIZATION
      // ==================================================

      if (
        !isAdminUser &&
        !isOwnPortfolio
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      // ==================================================
      // GET / CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(user);

      // ==================================================
      // BUILD WALLET SNAPSHOT
      // ==================================================

      const snapshot =
        buildWalletSnapshot(
          wallet,
          user
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        portfolio: {
          // ==============================================
          // USER
          // ==============================================

          userId:
            snapshot.userId,

          username:
            snapshot.username,

          email:
            snapshot.email,

          role:
            snapshot.role,

          // ==============================================
          // FLAT BALANCES
          // ==============================================

          pkrBalance:
            snapshot.pkrBalance,

          goldBalance:
            snapshot.goldBalance,

          usdtBalance:
            snapshot.usdtBalance,

          availablePkr:
            snapshot.availablePkr,

          availableGold:
            snapshot.availableGold,

          availableUsdt:
            snapshot.availableUsdt,

          lockedPkr:
            snapshot.lockedPkr,

          lockedGold:
            snapshot.lockedGold,

          lockedUsdt:
            snapshot.lockedUsdt,

          // ==============================================
          // PERFORMANCE
          // ==============================================

          portfolioValue:
            snapshot.portfolioValue,

          liveProfit:
            snapshot.liveProfit,

          liveProfitPercent:
            snapshot.liveProfitPercent,

          totalWalletValue:
            snapshot.totalWalletValue,

          // ==============================================
          // NESTED VALUES
          // ==============================================

          balances:
            snapshot.balances,

          available:
            snapshot.available,

          locked:
            snapshot.locked,

          performance:
            snapshot.performance,

          // ==============================================
          // TOTALS
          // ==============================================

          totals:
            snapshot.totals,

          // ==============================================
          // STATUS
          // ==============================================

          status:
            snapshot.status,

          isVerified:
            snapshot.isVerified,

          isFrozen:
            snapshot.isFrozen,

          // ==============================================
          // DATES
          // ==============================================

          createdAt:
            snapshot.createdAt,

          updatedAt:
            snapshot.updatedAt,
        },
      });

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 GET USER PORTFOLIO ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (
        error?.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to load user portfolio.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
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
// - Wallet Page
// - Dashboard
// ======================================================

router.get(
  "/history",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // GET LOGGED-IN USER
      // ==================================================

      const user =
        await getLoggedInUser(req);

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
        Number(req.query?.page);

      const requestedLimit =
        Number(req.query?.limit);

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
          : 20;

      const skip =
        (page - 1) * limit;

      // ==================================================
      // LOAD WALLET HISTORY
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
      // TOTAL TRANSACTIONS
      // ==================================================

      const total =
        await WalletHistory.countDocuments({
          userId: user._id,
        });

      // ==================================================
      // FORMAT HISTORY
      // ==================================================

      const formattedHistory =
        history.map(
          formatHistoryItem
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        userId:
          user._id,

        username:
          user.username || "",

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
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 GET WALLET HISTORY ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (
        error?.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to load wallet history.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
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
// - walletType
// - type
// - fromDate
// - toDate
// ======================================================

router.get(
  "/history/search",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // GET LOGGED-IN USER
      // ==================================================

      const user =
        await getLoggedInUser(req);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
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
        userId: user._id,
      };

      // ==================================================
      // WALLET TYPE FILTER
      // ==================================================

      if (
        typeof walletType ===
          "string" &&
        walletType.trim()
      ) {
        const normalizedWalletType =
          normalizeWalletType(
            walletType
          );

        if (
          !isValidWalletType(
            normalizedWalletType
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid wallet type.",
          });
        }

        query.walletType =
          normalizedWalletType;
      }

      // ==================================================
      // TRANSACTION TYPE FILTER
      // ==================================================

      if (
        typeof type ===
          "string" &&
        type.trim()
      ) {
        query.type =
          type
            .trim()
            .toUpperCase();
      }

      // ==================================================
      // FROM DATE
      // ==================================================

      if (
        typeof fromDate ===
          "string" &&
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
          ...(query.createdAt ||
            {}),
          $gte: startDate,
        };
      }

      // ==================================================
      // TO DATE
      // ==================================================

      if (
        typeof toDate ===
          "string" &&
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

        // ================================================
        // INCLUDE COMPLETE SELECTED DAY
        // ================================================

        endDate.setHours(
          23,
          59,
          59,
          999
        );

        query.createdAt = {
          ...(query.createdAt ||
            {}),
          $lte: endDate,
        };
      }

      // ==================================================
      // DATE RANGE VALIDATION
      // ==================================================

      if (
        query.createdAt?.$gte &&
        query.createdAt?.$lte &&
        query.createdAt.$gte >
          query.createdAt.$lte
      ) {
        return res.status(400).json({
          success: false,
          message:
            "fromDate cannot be later than toDate.",
        });
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
        history.map(
          formatHistoryItem
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        total:
          formattedHistory.length,

        filters: {
          walletType:
            walletType
              ? String(
                  walletType
                )
                  .trim()
                  .toUpperCase()
              : null,

          type:
            type
              ? String(
                  type
                )
                  .trim()
                  .toUpperCase()
              : null,

          fromDate:
            fromDate || null,

          toDate:
            toDate || null,
        },

        history:
          formattedHistory,
      });

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 SEARCH WALLET HISTORY ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (
        error?.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to search wallet history.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
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
      // GET LOGGED-IN USER
      // ==================================================

      const user =
        await getLoggedInUser(req);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // LIMIT
      // ==================================================

      const requestedLimit =
        Number(
          req.query?.limit
        );

      const limit =
        Number.isFinite(
          requestedLimit
        ) &&
        requestedLimit > 0
          ? Math.min(
              Math.floor(
                requestedLimit
              ),
              50
            )
          : 10;

      // ==================================================
      // LOAD RECENT TRANSACTIONS
      // ==================================================

      const recentTransactions =
        await WalletHistory.find({
          userId: user._id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      // ==================================================
      // FORMAT TRANSACTIONS
      // ==================================================

      const formattedTransactions =
        recentTransactions.map(
          formatHistoryItem
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

        // ================================================
        // COMPATIBILITY ALIAS
        // ================================================

        history:
          formattedTransactions,
      });

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 GET RECENT WALLET TRANSACTIONS ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (
        error?.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to load recent transactions.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
        }),
      });
    }
  }
);
// ======================================================
// ADMIN — CREDIT WALLET
// POST /api/wallet/admin/credit
//
// Admin only
// Supports:
// - PKR
// - GOLD
// - USDT
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

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
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

      const creditAmount =
        Number(amount);

      if (
        !Number.isFinite(
          creditAmount
        ) ||
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

      const walletKey =
        normalizeWalletType(
          walletType
        );

      if (
        !isValidWalletType(
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
        await User.findById(
          userId
        )
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
      // GET / CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(
          user
        );

      // ==================================================
      // WALLET FREEZE CHECK
      // ==================================================

      if (
        wallet.isFrozen === true ||
        String(
          wallet.status || ""
        )
          .trim()
          .toLowerCase() ===
          "frozen"
      ) {
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
          req.user?.username ||
            req.user?.email ||
            "Admin"
        ).trim();

      // ==================================================
      // BALANCE BEFORE / AFTER
      // ==================================================

      let balanceBefore = 0;
      let balanceAfter = 0;

      // ==================================================
      // UPDATE WALLET
      // ==================================================

      switch (walletKey) {
        // ================================================
        // PKR
        // ================================================

        case "PKR": {
          balanceBefore =
            toNumber(
              wallet.pkrBalance
            );

          wallet.pkrBalance =
            balanceBefore +
            creditAmount;

          wallet.totalDeposit =
            toNumber(
              wallet.totalDeposit
            ) + creditAmount;

          wallet.totalPkrDeposit =
            toNumber(
              wallet.totalPkrDeposit
            ) + creditAmount;

          wallet.lastDepositAt =
            new Date();

          balanceAfter =
            toNumber(
              wallet.pkrBalance
            );

          break;
        }

        // ================================================
        // GOLD
        // ================================================

        case "GOLD": {
          balanceBefore =
            toNumber(
              wallet.goldBalance
            );

          wallet.goldBalance =
            balanceBefore +
            creditAmount;

          wallet.totalGoldPurchased =
            toNumber(
              wallet.totalGoldPurchased
            ) + creditAmount;

          wallet.lastTradeAt =
            new Date();

          balanceAfter =
            toNumber(
              wallet.goldBalance
            );

          break;
        }

        // ================================================
        // USDT
        // ================================================

        case "USDT": {
          balanceBefore =
            toNumber(
              wallet.usdtBalance
            );

          wallet.usdtBalance =
            balanceBefore +
            creditAmount;

          wallet.totalUsdtDeposited =
            toNumber(
              wallet.totalUsdtDeposited
            ) + creditAmount;

          wallet.lastDepositAt =
            new Date();

          balanceAfter =
            toNumber(
              wallet.usdtBalance
            );

          break;
        }

        // ================================================
        // UNSUPPORTED TYPE
        // ================================================

        default: {
          return res.status(400).json({
            success: false,
            message:
              "Unsupported wallet type.",
          });
        }
      }

      // ==================================================
      // SAVE WALLET
      // ==================================================

      await wallet.save();
            // ==================================================
      // WALLET HISTORY
      // ==================================================

      await WalletHistory.create({
        userId:
          user._id,

        username:
          user.username,

        walletType:
          walletKey,

        type:
          "CREDIT",

        amount:
          creditAmount,

        balanceBefore:
          balanceBefore,

        balanceAfter:
          balanceAfter,

        note:
          String(
            note ??
              "Wallet credited by admin"
          ).trim(),

        admin:
          adminUsername,

        status:
          "COMPLETED",
      });

      // ==================================================
      // BUILD UPDATED WALLET SNAPSHOT
      // ==================================================

      const snapshot =
        buildWalletSnapshot(
          wallet,
          user
        );

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

        wallet:
          snapshot,
      });

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 ADMIN CREDIT WALLET ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to credit wallet.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
        }),
      });
    }
  }
);

// ======================================================
// ADMIN — DEBIT WALLET
// POST /api/wallet/admin/debit
//
// Admin only
// Supports:
// - PKR
// - GOLD
// - USDT
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

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
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

      const debitAmount =
        Number(amount);

      if (
        !Number.isFinite(
          debitAmount
        ) ||
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

      const walletKey =
        normalizeWalletType(
          walletType
        );

      if (
        !isValidWalletType(
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
        await User.findById(
          userId
        )
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
      // GET / CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(
          user
        );

      // ==================================================
      // WALLET FREEZE CHECK
      // ==================================================

      if (
        wallet.isFrozen === true ||
        String(
          wallet.status || ""
        )
          .trim()
          .toLowerCase() ===
          "frozen"
      ) {
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
          req.user?.username ||
            req.user?.email ||
            "Admin"
        ).trim();

      // ==================================================
      // BALANCE VARIABLES
      // ==================================================

      let balanceBefore = 0;
      let balanceAfter = 0;

      // ==================================================
      // UPDATE WALLET
      // ==================================================

      switch (walletKey) {
        // ================================================
        // PKR
        // ================================================

        case "PKR": {
          balanceBefore =
            toNumber(
              wallet.pkrBalance
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
            toNumber(
              wallet.totalWithdraw
            ) + debitAmount;

          wallet.totalPkrWithdraw =
            toNumber(
              wallet.totalPkrWithdraw
            ) + debitAmount;

          wallet.lastWithdrawAt =
            new Date();

          balanceAfter =
            toNumber(
              wallet.pkrBalance
            );

          break;
        }

        // ================================================
        // GOLD
        // ================================================

        case "GOLD": {
          balanceBefore =
            toNumber(
              wallet.goldBalance
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
            toNumber(
              wallet.totalGoldSold
            ) + debitAmount;

          wallet.lastTradeAt =
            new Date();

          balanceAfter =
            toNumber(
              wallet.goldBalance
            );

          break;
        }

        // ================================================
        // USDT
        // ================================================

        case "USDT": {
          balanceBefore =
            toNumber(
              wallet.usdtBalance
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
            toNumber(
              wallet.totalUsdtWithdrawn
            ) + debitAmount;

          wallet.lastWithdrawAt =
            new Date();

          balanceAfter =
            toNumber(
              wallet.usdtBalance
            );

          break;
        }

        // ================================================
        // UNSUPPORTED TYPE
        // ================================================

        default: {
          return res.status(400).json({
            success: false,
            message:
              "Unsupported wallet type.",
          });
        }
      }

      // ==================================================
      // SAVE WALLET
      // ==================================================

      await wallet.save();

      // ==================================================
      // WALLET HISTORY
      // ==================================================

      await WalletHistory.create({
        userId:
          user._id,

        username:
          user.username,

        walletType:
          walletKey,

        type:
          "DEBIT",

        amount:
          debitAmount,

        balanceBefore:
          balanceBefore,

        balanceAfter:
          balanceAfter,

        note:
          String(
            note ??
              "Wallet debited by admin"
          ).trim(),

        admin:
          adminUsername,

        status:
          "COMPLETED",
      });

      // ==================================================
      // BUILD UPDATED SNAPSHOT
      // ==================================================

      const snapshot =
        buildWalletSnapshot(
          wallet,
          user
        );

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

        wallet:
          snapshot,
      });

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 ADMIN DEBIT WALLET ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to debit wallet.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
        }),
      });
    }
  }
);

// ======================================================
// REFRESH LOGGED-IN USER WALLET
// GET /api/wallet/refresh
//
// Dashboard Auto Refresh API
// ======================================================

router.get(
  "/refresh",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // GET LOGGED-IN USER
      // ==================================================

      const user =
        await getLoggedInUser(req);

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // GET / CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(
          user
        );

      if (!wallet) {
        return res.status(500).json({
          success: false,
          message:
            "Unable to load wallet.",
        });
      }

      // ==================================================
      // BUILD WALLET SNAPSHOT
      // ==================================================

      const snapshot =
        buildWalletSnapshot(
          wallet,
          user
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        username:
          snapshot.username,

        wallet:
          snapshot,

        refreshedAt:
          new Date().toISOString(),
      });

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 REFRESH WALLET ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (
        error?.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to refresh wallet.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
        }),
      });
    }
  }
);

// ======================================================
// ADMIN REFRESH USER WALLET
// GET /api/wallet/admin/refresh/:userId
//
// Admin only
// ======================================================

router.get(
  "/admin/refresh/:userId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // VALIDATE USER ID
      // ==================================================

      const userId =
        String(
          req.params?.userId ?? ""
        ).trim();

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      // ==================================================
      // VALIDATE MONGODB OBJECT ID
      // ==================================================

      if (
        !mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        });
      }

      // ==================================================
      // LOAD USER
      // ==================================================

      const user =
        await User.findById(
          userId
        )
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
      // GET / CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(
          user
        );

      if (!wallet) {
        return res.status(500).json({
          success: false,
          message:
            "Unable to load user wallet.",
        });
      }

      // ==================================================
      // BUILD WALLET SNAPSHOT
      // ==================================================

      const snapshot =
        buildWalletSnapshot(
          wallet,
          user
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        wallet:
          snapshot,

        refreshedAt:
          new Date().toISOString(),
      });

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 ADMIN REFRESH WALLET ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (
        error?.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to refresh admin wallet.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
        }),
      });
    }
  }
);

// ======================================================
// ADMIN WALLET LIST
// GET /api/wallet/admin/all
//
// Admin only
// Pagination supported
// ======================================================

router.get(
  "/admin/all",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // PAGINATION
      // ==================================================

      const requestedPage =
        Number.parseInt(
          req.query?.page,
          10
        );

      const requestedLimit =
        Number.parseInt(
          req.query?.limit,
          10
        );

      const page =
        Number.isFinite(
          requestedPage
        ) &&
        requestedPage > 0
          ? requestedPage
          : 1;

      const limit =
        Number.isFinite(
          requestedLimit
        ) &&
        requestedLimit > 0
          ? Math.min(
              requestedLimit,
              100
            )
          : 25;

      const skip =
        (page - 1) * limit;

      // ==================================================
      // LOAD WALLETS + TOTAL
      // ==================================================

      const [
        wallets,
        total,
      ] = await Promise.all([
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

      // ==================================================
      // NORMALIZE WALLET DATA
      // ==================================================

      const normalizedWallets =
        wallets.map(
          (wallet) => {
            const snapshot =
              buildWalletSnapshot(
                wallet,
                null
              );

            return {
              _id:
                wallet._id,

              userId:
                wallet.userId,

              username:
                snapshot.username,

              // ==========================================
              // FLAT BALANCES
              // ==========================================

              pkrBalance:
                snapshot.pkrBalance,

              goldBalance:
                snapshot.goldBalance,

              usdtBalance:
                snapshot.usdtBalance,

              lockedPkr:
                snapshot.lockedPkr,

              lockedGold:
                snapshot.lockedGold,

              lockedUsdt:
                snapshot.lockedUsdt,

              availablePkr:
                snapshot.availablePkr,

              availableGold:
                snapshot.availableGold,

              availableUsdt:
                snapshot.availableUsdt,

              // ==========================================
              // PERFORMANCE
              // ==========================================

              portfolioValue:
                snapshot.portfolioValue,

              liveProfit:
                snapshot.liveProfit,

              liveProfitPercent:
                snapshot.liveProfitPercent,

              totalWalletValue:
                snapshot.totalWalletValue,

              performance:
                snapshot.performance,

              // ==========================================
              // TOTALS
              // ==========================================

              totalDeposit:
                snapshot.totalDeposit,

              totalWithdraw:
                snapshot.totalWithdraw,

              totalPkrDeposit:
                snapshot.totalPkrDeposit,

              totalPkrWithdraw:
                snapshot.totalPkrWithdraw,

              totalGoldPurchased:
                snapshot.totalGoldPurchased,

              totalGoldSold:
                snapshot.totalGoldSold,

              totalUsdtDeposited:
                snapshot.totalUsdtDeposited,

              totalUsdtWithdrawn:
                snapshot.totalUsdtWithdrawn,

              totals:
                snapshot.totals,

              // ==========================================
              // STATUS
              // ==========================================

              status:
                snapshot.status,

              isVerified:
                snapshot.isVerified,

              isFrozen:
                snapshot.isFrozen,

              // ==========================================
              // DATES
              // ==========================================

              createdAt:
                snapshot.createdAt,

              updatedAt:
                snapshot.updatedAt,
            };
          }
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        total,

        page,

        limit,

        totalPages:
          total > 0
            ? Math.ceil(
                total / limit
              )
            : 0,

        hasNextPage:
          page * limit < total,

        hasPreviousPage:
          page > 1,

        wallets:
          normalizedWallets,
      });

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "GOLDTRADE V18 ADMIN WALLET LIST ERROR:",
        error
      );

      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error?.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to load wallets.",

        ...(process.env.NODE_ENV !==
          "production" && {
          error:
            error?.message ||
            "Unknown server error.",
        }),
      });
    }
  }
);

// ======================================================
// GET USER WALLET BY USERNAME
// GET /api/wallet/:username
// ======================================================

router.get(
  "/:username",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // GET REQUESTER
      // ==================================================

      const requester = await getLoggedInUser(req);

      // ==================================================
      // NORMALIZE USERNAME
      // ==================================================

      const username = String(
        req.params.username ?? ""
      )
        .trim()
        .toLowerCase();

      if (!username) {
        return res.status(400).json({
          success: false,
          message: "Username is required.",
        });
      }

      // ==================================================
      // REQUESTER INFORMATION
      // ==================================================

      const requesterRole = String(
        requester.role ?? ""
      )
        .trim()
        .toLowerCase();

      const requesterUsername = String(
        requester.username ?? ""
      )
        .trim()
        .toLowerCase();

      const requesterId =
        requester._id ?? null;

      const isRequesterAdmin =
        requesterRole === "admin";

      // ==================================================
      // FIND REQUESTED USER
      // ==================================================

      const user = await User.findOne({
        username,
      })
        .select("_id username email role")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // OWN WALLET CHECK
      // ==================================================

      const isOwnWallet =
        requesterUsername ===
          String(user.username ?? "")
            .trim()
            .toLowerCase() ||
        (
          requesterId &&
          String(requesterId) ===
            String(user._id)
        );

      // ==================================================
      // AUTHORIZATION
      // ==================================================

      if (
        !isRequesterAdmin &&
        !isOwnWallet
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      // ==================================================
      // GET / CREATE WALLET
      // ==================================================

      const wallet =
        await getOrCreateWallet(user);

      // ==================================================
      // BUILD STANDARD WALLET SNAPSHOT
      // ==================================================

      const snapshot =
        buildWalletSnapshot(
          wallet,
          user
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        username:
          snapshot.username,

        wallet: snapshot,

        updatedAt:
          wallet.updatedAt ??
          new Date(),
      });
    } catch (error) {
      // ==================================================
      // AUTHENTICATION ERROR
      // ==================================================

      if (
        error.message ===
        "AUTHENTICATION_REQUIRED"
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      // ==================================================
      // USER NOT FOUND
      // ==================================================

      if (
        error.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Authenticated user not found.",
        });
      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      console.error(
        "GET WALLET BY USERNAME ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load user wallet.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// FINAL EXPORT
// ======================================================

module.exports = router;