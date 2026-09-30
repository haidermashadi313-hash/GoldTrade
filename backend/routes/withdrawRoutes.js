"use strict";

const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Withdraw = require("../models/Withdraw");
const WalletHistory = require("../models/WalletHistory");
const Transaction = require("../models/Transaction");
const Settings = require("../models/Settings");

// ======================================================
// MIDDLEWARE
// ======================================================

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

// ======================================================
// HEALTH CHECK
// GET /api/withdraw/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Withdraw API",
    version: "V18 Enterprise",
    status: "ONLINE",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// HELPERS
// ======================================================

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

// ======================================================
// GET WITHDRAW SETTINGS
// ======================================================

const getWithdrawSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({
      withdrawEnabled: true,
      minimumWithdraw: 100,
      maximumWithdraw: 10000000,
    });
  }

  return settings;
};

// ======================================================
// GET / CREATE USER WALLET
// ======================================================

const getWallet = async (userId, username) => {
  let wallet = await Wallet.findOne({
    userId,
  });

  if (!wallet) {
    wallet = await Wallet.create({
      userId,
      username,

      pkrBalance: 0,
      usdtBalance: 0,
      goldBalance: 0,

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
  }

  return wallet;
};

// ======================================================
// GENERATE WITHDRAW REFERENCE
// ======================================================

const generateWithdrawReference = () => {
  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `WTH-${Date.now()}-${random}`;
};

// ======================================================
// CREATE WITHDRAW REQUEST
// POST /api/withdraw/create
// Frontend: /withdraw
// ======================================================

router.post(
  "/create",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH
      // ==================================================

      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // ==================================================
      // REQUEST DATA
      // ==================================================

      const {
        walletType,
        amount,
        paymentMethod,
        receiverName,
        receiverAccount,
        receiverWalletAddress,
        bankName,
        iban,
        network,
        note,
      } = req.body || {};

      const normalizedWalletType =
        String(walletType || "")
          .trim()
          .toUpperCase();

      // ==================================================
      // WALLET TYPE VALIDATION
      // ==================================================

      if (
        !["PKR", "USDT"].includes(
          normalizedWalletType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid wallet type. Use PKR or USDT.",
        });
      }

      // ==================================================
      // AMOUNT VALIDATION
      // ==================================================

      const withdrawAmount = Number(amount);

      if (
        !Number.isFinite(withdrawAmount) ||
        withdrawAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid withdraw amount.",
        });
      }

      // ==================================================
      // USER
      // ==================================================

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // SETTINGS
      // ==================================================

      const settings =
        await getWithdrawSettings();

      const withdrawEnabled =
        settings.withdrawEnabled !== false;

      if (!withdrawEnabled) {
        return res.status(403).json({
          success: false,
          message:
            "Withdrawals are temporarily disabled.",
        });
      }

      const minimumWithdraw =
        toNumber(
          settings.minimumWithdraw,
          100
        );

      const maximumWithdraw =
        toNumber(
          settings.maximumWithdraw,
          10000000
        );

      if (
        withdrawAmount < minimumWithdraw
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Minimum withdraw is ${minimumWithdraw}.`,
        });
      }

      if (
        withdrawAmount > maximumWithdraw
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Maximum withdraw is ${maximumWithdraw}.`,
        });
      }

      // ==================================================
      // WALLET
      // ==================================================

      const wallet = await getWallet(
        user._id,
        user.username
      );

      // ==================================================
      // WALLET STATUS
      // ==================================================

      if (wallet.isFrozen === true) {
        return res.status(403).json({
          success: false,
          message:
            "Your wallet is currently frozen.",
        });
      }

      if (
        wallet.status &&
        String(wallet.status).toLowerCase() ===
          "frozen"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your wallet is currently frozen.",
        });
      }

      // ==================================================
      // CURRENT BALANCE
      // ==================================================

      const balance =
        normalizedWalletType === "PKR"
          ? toNumber(wallet.pkrBalance)
          : toNumber(wallet.usdtBalance);

      // ==================================================
      // LOCKED BALANCE
      // ==================================================

      const lockedBalance =
        normalizedWalletType === "PKR"
          ? toNumber(wallet.lockedPkr)
          : toNumber(wallet.lockedUsdt);

      // ==================================================
      // AVAILABLE BALANCE
      // ==================================================

      const availableBalance =
        Math.max(
          balance - lockedBalance,
          0
        );

      if (
        availableBalance <
        withdrawAmount
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Insufficient available ${normalizedWalletType} balance.`,
          availableBalance,
          requestedAmount:
            withdrawAmount,
        });
      }

      // ==================================================
      // PENDING WITHDRAWAL PROTECTION
      // ==================================================

      const pending =
        await Withdraw.findOne({
          userId: user._id,
          walletType:
            normalizedWalletType,
          status: "PENDING",
        }).lean();

      if (pending) {
        return res.status(400).json({
          success: false,
          message:
            `You already have a pending ${normalizedWalletType} withdrawal.`,
          referenceId:
            pending.referenceId || null,
        });
      }

      // ==================================================
      // BALANCE SNAPSHOT
      // ==================================================

      const balanceBefore = {
        pkrBalance:
          toNumber(wallet.pkrBalance),

        goldBalance:
          toNumber(wallet.goldBalance),

        usdtBalance:
          toNumber(wallet.usdtBalance),
      };

      // ==================================================
      // GENERATE REFERENCE
      // ==================================================

      const referenceId =
        generateWithdrawReference();

      // ==================================================
      // CREATE WITHDRAW REQUEST
      // ==================================================

      const withdraw =
        await Withdraw.create({
          userId: user._id,

          username:
            user.username || "",

          fullName:
            user.fullName || "",

          email:
            user.email || "",

          walletType:
            normalizedWalletType,

          currency:
            normalizedWalletType,

          amount:
            withdrawAmount,

          paymentMethod:
            paymentMethod || "",

          receiverName:
            receiverName || "",

          receiverAccount:
            receiverAccount || "",

          receiverWalletAddress:
            receiverWalletAddress || "",

          bankName:
            bankName || "",

          iban:
            iban || "",

          network:
            network || "",

          note:
            note || "",

          referenceId,

          walletBefore:
            balanceBefore,

          ipAddress:
            req.ip || "",

          device:
            req.headers["user-agent"] || "",
        });

      // ==================================================
      // RESERVE / LOCK BALANCE
      // ==================================================

      if (
        normalizedWalletType === "PKR"
      ) {
        wallet.lockedPkr =
          toNumber(wallet.lockedPkr) +
          withdrawAmount;
      }

      if (
        normalizedWalletType === "USDT"
      ) {
        wallet.lockedUsdt =
          toNumber(wallet.lockedUsdt) +
          withdrawAmount;
      }

      await wallet.save();

      // ==================================================
      // WALLET HISTORY
      // ==================================================

      try {
        await WalletHistory.create({
          userId: user._id,
          username: user.username,

          walletType:
            normalizedWalletType,

          transactionType:
            "WITHDRAW_REQUEST",

          transactionMode:
            "LOCK",

          amount:
            withdrawAmount,

          balanceBefore:
            balance,

          balanceAfter:
            balance,

          referenceId,

          status: "Pending",

          note:
            "Withdrawal amount reserved.",
        });
      } catch (historyError) {
        console.error(
          "WITHDRAW WALLET HISTORY ERROR:",
          historyError
        );

        // Do not fail the withdrawal request
        // only because history logging failed.
      }

      // ==================================================
      // TRANSACTION LEDGER
      // ==================================================

      try {
        await Transaction.create({
          userId: user._id,

          username:
            user.username,

          walletType:
            normalizedWalletType,

          transactionType:
            "WITHDRAW_REQUEST",

          transactionMode:
            "DEBIT",

          amount:
            withdrawAmount,

          balanceBefore:
            balance,

          balanceAfter:
            balance,

          status:
            "Pending",

          paymentMethod:
            paymentMethod || "",

          referenceId,

          note:
            "Withdraw request created and balance reserved.",
        });
      } catch (transactionError) {
        console.error(
          "WITHDRAW TRANSACTION LEDGER ERROR:",
          transactionError
        );

        // Withdrawal itself remains created.
        // Admin can still process it from Withdraw module.
      }

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(201).json({
        success: true,

        message:
          "Withdraw request submitted successfully.",

        withdraw: {
          id:
            withdraw._id,

          referenceId:
            withdraw.referenceId,

          walletType:
            withdraw.walletType,

          amount:
            withdraw.amount,

          status:
            withdraw.status,

          createdAt:
            withdraw.createdAt,
        },

        wallet: {
          walletType:
            normalizedWalletType,

          balance:
            balance,

          lockedBalance:
            lockedBalance +
            withdrawAmount,

          availableBalance:
            Math.max(
              availableBalance -
                withdrawAmount,
              0
            ),
        },
      });

    } catch (error) {
      console.error(
        "CREATE WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to create withdraw request.",

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
// GET MY WITHDRAW HISTORY
// GET /api/withdraw/history
// Used by frontend/app/withdraw/history/page.tsx
// ======================================================

router.get(
  "/history",
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      // --------------------------------------------------
      // PAGINATION
      // --------------------------------------------------

      const requestedPage = Number.parseInt(
        req.query.page,
        10
      );

      const requestedLimit = Number.parseInt(
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
          : 20;

      const skip = (page - 1) * limit;

      // --------------------------------------------------
      // QUERY
      // --------------------------------------------------

      const filter = {
        userId,
      };

      const [total, history] =
        await Promise.all([
          Withdraw.countDocuments(filter),

          Withdraw.find(filter)
            .sort({
              createdAt: -1,
              _id: -1,
            })
            .skip(skip)
            .limit(limit)
            .lean(),
        ]);

      return res.status(200).json({
        success: true,

        pagination: {
          page,
          limit,
          total,
          totalPages:
            total > 0
              ? Math.ceil(total / limit)
              : 0,

          hasNextPage:
            page * limit < total,

          hasPreviousPage:
            page > 1,
        },

        history,
      });

    } catch (error) {
      console.error(
        "WITHDRAW HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load withdraw history.",
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
// GET USER WITHDRAW HISTORY BY USERNAME
// GET /api/withdraw/history/:username
// Admin OR Same User
// ======================================================

router.get(
  "/history/:username",
  verifyToken,
  async (req, res) => {
    try {
      const requestedUsername = String(
        req.params.username || ""
      )
        .trim()
        .toLowerCase();

      if (!requestedUsername) {
        return res.status(400).json({
          success: false,
          message: "Username is required.",
        });
      }

      const currentUsername = String(
        req.user?.username || ""
      )
        .trim()
        .toLowerCase();

      const currentRole = String(
        req.user?.role || ""
      )
        .trim()
        .toLowerCase();

      // --------------------------------------------------
      // AUTHORIZATION
      // --------------------------------------------------

      if (
        currentRole !== "admin" &&
        currentUsername !== requestedUsername
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      // --------------------------------------------------
      // USER
      // --------------------------------------------------

      const user = await User.findOne({
        username: requestedUsername,
      })
        .select("_id username")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // --------------------------------------------------
      // HISTORY
      // --------------------------------------------------

      const history =
        await Withdraw.find({
          userId: user._id,
        })
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(100)
          .lean();

      return res.status(200).json({
        success: true,

        username:
          user.username,

        total:
          history.length,

        history,
      });

    } catch (error) {
      console.error(
        "USER WITHDRAW HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load user withdraw history.",
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
// GET PENDING WITHDRAWALS
// GET /api/withdraw/pending
// User = Own Pending
// Admin = All Pending
// ======================================================

router.get(
  "/pending",
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      const role = String(
        req.user?.role || ""
      )
        .trim()
        .toLowerCase();

      const query =
        role === "admin"
          ? {
              status: "PENDING",
            }
          : {
              userId,
              status: "PENDING",
            };

      const pending =
        await Withdraw.find(query)
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(100)
          .lean();

      return res.status(200).json({
        success: true,

        total:
          pending.length,

        pending,
      });

    } catch (error) {
      console.error(
        "PENDING WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load pending withdrawals.",
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
// GET MY WITHDRAW SUMMARY
// GET /api/withdraw/summary
// Dashboard Cards
// ======================================================

router.get(
  "/summary",
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      const withdrawals =
        await Withdraw.find({
          userId,
        })
          .select(
            "amount walletType status"
          )
          .lean();

      let pendingAmount = 0;
      let approvedAmount = 0;
      let rejectedAmount = 0;
      let cancelledAmount = 0;

      let pendingCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      let cancelledCount = 0;

      let totalPKRWithdraw = 0;
      let totalUSDTWithdraw = 0;

      // --------------------------------------------------
      // PROCESS SUMMARY
      // --------------------------------------------------

      withdrawals.forEach((item) => {
        const amount = Number(
          item.amount || 0
        );

        if (
          !Number.isFinite(amount) ||
          amount <= 0
        ) {
          return;
        }

        const status = String(
          item.status || ""
        )
          .trim()
          .toUpperCase();

        const walletType = String(
          item.walletType || ""
        )
          .trim()
          .toUpperCase();

        switch (status) {
          case "PENDING":
            pendingCount++;
            pendingAmount += amount;
            break;

          case "APPROVED":
            approvedCount++;
            approvedAmount += amount;

            if (walletType === "PKR") {
              totalPKRWithdraw +=
                amount;
            }

            if (walletType === "USDT") {
              totalUSDTWithdraw +=
                amount;
            }

            break;

          case "REJECTED":
            rejectedCount++;
            rejectedAmount += amount;
            break;

          case "CANCELLED":
            cancelledCount++;
            cancelledAmount += amount;
            break;

          default:
            break;
        }
      });

      return res.status(200).json({
        success: true,

        summary: {
          totalWithdrawals:
            withdrawals.length,

          pendingWithdrawals:
            pendingCount,

          approvedWithdrawals:
            approvedCount,

          rejectedWithdrawals:
            rejectedCount,

          cancelledWithdrawals:
            cancelledCount,

          pendingAmount:
            Number(
              pendingAmount.toFixed(2)
            ),

          approvedAmount:
            Number(
              approvedAmount.toFixed(2)
            ),

          rejectedAmount:
            Number(
              rejectedAmount.toFixed(2)
            ),

          cancelledAmount:
            Number(
              cancelledAmount.toFixed(2)
            ),

          totalPKRWithdraw:
            Number(
              totalPKRWithdraw.toFixed(2)
            ),

          totalUSDTWithdraw:
            Number(
              totalUSDTWithdraw.toFixed(6)
            ),
        },
      });

    } catch (error) {
      console.error(
        "WITHDRAW SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load withdraw summary.",
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
// GET RECENT WITHDRAWALS
// GET /api/withdraw/recent
// Dashboard Widget
// ======================================================

router.get(
  "/recent",
  verifyToken,
  async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      const role = String(
        req.user?.role || ""
      )
        .trim()
        .toLowerCase();

      const query =
        role === "admin"
          ? {}
          : {
              userId,
            };

      const recent =
        await Withdraw.find(query)
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(10)
          .lean();

      return res.status(200).json({
        success: true,

        total:
          recent.length,

        recent,
      });

    } catch (error) {
      console.error(
        "RECENT WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load recent withdrawals.",
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
// APPROVE WITHDRAW
// PATCH /api/withdraw/:id/approve
// Used by frontend/app/admin/withdraw/page.tsx
// ======================================================

router.patch(
  "/:id/approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // VALIDATE REQUEST ID
      // ==================================================

      const withdrawId = String(
        req.params.id || ""
      ).trim();

      if (!withdrawId) {
        return res.status(400).json({
          success: false,
          message: "Withdraw ID is required.",
        });
      }

      // ==================================================
      // FIND WITHDRAW
      // ==================================================

      const withdraw =
        await Withdraw.findById(
          withdrawId
        );

      if (!withdraw) {
        return res.status(404).json({
          success: false,
          message:
            "Withdraw request not found.",
        });
      }

      // ==================================================
      // NORMALIZE STATUS
      // ==================================================

      const withdrawStatus =
        String(
          withdraw.status || ""
        )
          .trim()
          .toUpperCase();

      if (withdrawStatus !== "PENDING") {
        return res.status(400).json({
          success: false,
          message:
            `Withdraw already ${withdrawStatus.toLowerCase()}.`,
        });
      }

      // ==================================================
      // NORMALIZE WALLET TYPE
      // ==================================================

      const walletType =
        String(
          withdraw.walletType || ""
        )
          .trim()
          .toUpperCase();

      if (
        !["PKR", "USDT"].includes(
          walletType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal wallet type.",
        });
      }

      // ==================================================
      // VALIDATE AMOUNT
      // ==================================================

      const amount = Number(
        withdraw.amount
      );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal amount.",
        });
      }

      // ==================================================
      // USER WALLET
      // ==================================================

      const wallet =
        await getWallet(
          withdraw.userId,
          withdraw.username
        );

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message:
            "User wallet not found.",
        });
      }

      // ==================================================
      // WALLET STATUS
      // ==================================================

      if (wallet.isFrozen === true) {
        return res.status(403).json({
          success: false,
          message:
            "User wallet is frozen.",
        });
      }

      if (
        wallet.status &&
        String(wallet.status)
          .trim()
          .toLowerCase() ===
          "frozen"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "User wallet is frozen.",
        });
      }

      // ==================================================
      // CURRENT BALANCES
      // ==================================================

      const currentPkrBalance =
        Number(
          wallet.pkrBalance || 0
        );

      const currentUsdtBalance =
        Number(
          wallet.usdtBalance || 0
        );

      const currentGoldBalance =
        Number(
          wallet.goldBalance || 0
        );

      const currentLockedPkr =
        Number(
          wallet.lockedPkr || 0
        );

      const currentLockedUsdt =
        Number(
          wallet.lockedUsdt || 0
        );

      // ==================================================
      // APPROVE PKR WITHDRAW
      // ==================================================

      if (walletType === "PKR") {
        // ----------------------------------------------
        // Verify reserved amount
        // ----------------------------------------------

        if (
          currentLockedPkr < amount
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Reserved PKR withdrawal amount is insufficient.",
            lockedPkr:
              currentLockedPkr,
            requestedAmount:
              amount,
          });
        }

        // ----------------------------------------------
        // Verify actual balance
        // ----------------------------------------------

        if (
          currentPkrBalance < amount
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Insufficient PKR balance.",
            balance:
              currentPkrBalance,
            requestedAmount:
              amount,
          });
        }

        // ----------------------------------------------
        // Deduct actual balance
        // ----------------------------------------------

        wallet.pkrBalance =
          currentPkrBalance -
          amount;

        // ----------------------------------------------
        // Release consumed lock
        // ----------------------------------------------

        wallet.lockedPkr =
          currentLockedPkr -
          amount;

        // ----------------------------------------------
        // Update totals
        // ----------------------------------------------

        wallet.totalWithdraw =
          Number(
            wallet.totalWithdraw || 0
          ) + amount;

        wallet.totalPkrWithdraw =
          Number(
            wallet.totalPkrWithdraw || 0
          ) + amount;
      }

      // ==================================================
      // APPROVE USDT WITHDRAW
      // ==================================================

      if (walletType === "USDT") {
        // ----------------------------------------------
        // Verify reserved amount
        // ----------------------------------------------

        if (
          currentLockedUsdt < amount
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Reserved USDT withdrawal amount is insufficient.",
            lockedUsdt:
              currentLockedUsdt,
            requestedAmount:
              amount,
          });
        }

        // ----------------------------------------------
        // Verify actual balance
        // ----------------------------------------------

        if (
          currentUsdtBalance < amount
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Insufficient USDT balance.",
            balance:
              currentUsdtBalance,
            requestedAmount:
              amount,
          });
        }

        // ----------------------------------------------
        // Deduct actual balance
        // ----------------------------------------------

        wallet.usdtBalance =
          currentUsdtBalance -
          amount;

        // ----------------------------------------------
        // Release consumed lock
        // ----------------------------------------------

        wallet.lockedUsdt =
          currentLockedUsdt -
          amount;

        // ----------------------------------------------
        // Update totals
        // ----------------------------------------------

        wallet.totalWithdraw =
          Number(
            wallet.totalWithdraw || 0
          ) + amount;

        wallet.totalUsdtWithdrawn =
          Number(
            wallet.totalUsdtWithdrawn || 0
          ) + amount;
      }

      // ==================================================
      // TIMESTAMP
      // ==================================================

      wallet.lastWithdrawAt =
        new Date();

      // ==================================================
      // SAVE WALLET
      // ==================================================

      await wallet.save();

      // ==================================================
      // WALLET AFTER SNAPSHOT
      // ==================================================

      const walletAfter = {
        pkrBalance:
          Number(
            wallet.pkrBalance || 0
          ),

        usdtBalance:
          Number(
            wallet.usdtBalance || 0
          ),

        goldBalance:
          Number(
            wallet.goldBalance || 0
          ),

        lockedPkr:
          Number(
            wallet.lockedPkr || 0
          ),

        lockedUsdt:
          Number(
            wallet.lockedUsdt || 0
          ),
      };

      // ==================================================
      // UPDATE WITHDRAW
      // ==================================================

      withdraw.walletBefore = {
        pkrBalance:
          currentPkrBalance,

        usdtBalance:
          currentUsdtBalance,

        goldBalance:
          currentGoldBalance,
      };

      withdraw.walletAfter = {
        pkrBalance:
          walletAfter.pkrBalance,

        usdtBalance:
          walletAfter.usdtBalance,

        goldBalance:
          walletAfter.goldBalance,
      };

      withdraw.status =
        "APPROVED";

      withdraw.approvedBy =
        req.user.id;

      withdraw.approvedByUsername =
        req.user.username ||
        "Admin";

      withdraw.approvedAt =
        new Date();

      await withdraw.save();

      // ==================================================
      // WALLET HISTORY
      // ==================================================

      try {
        await WalletHistory.create({
          userId:
            withdraw.userId,

          username:
            withdraw.username,

          walletType,

          type:
            "WITHDRAW",

          transactionType:
            "WITHDRAW_APPROVED",

          transactionMode:
            "DEBIT",

          amount,

          balanceBefore:
            walletType === "PKR"
              ? currentPkrBalance
              : currentUsdtBalance,

          balanceAfter:
            walletType === "PKR"
              ? walletAfter.pkrBalance
              : walletAfter.usdtBalance,

          referenceId:
            withdraw.referenceId,

          status:
            "Completed",

          admin:
            req.user.username ||
            "Admin",

          adminId:
            req.user.id,

          note:
            `Withdraw approved by ${
              req.user.username ||
              "Admin"
            }`,
        });
      } catch (historyError) {
        console.error(
          "APPROVE WITHDRAW WALLET HISTORY ERROR:",
          historyError
        );
      }

      // ==================================================
      // TRANSACTION LEDGER
      // ==================================================

      try {
        await Transaction.create({
          userId:
            withdraw.userId,

          username:
            withdraw.username,

          walletType,

          transactionType:
            "WITHDRAW_APPROVED",

          transactionMode:
            "DEBIT",

          amount,

          balanceBefore:
            walletType === "PKR"
              ? currentPkrBalance
              : currentUsdtBalance,

          balanceAfter:
            walletType === "PKR"
              ? walletAfter.pkrBalance
              : walletAfter.usdtBalance,

          status:
            "Completed",

          paymentMethod:
            withdraw.paymentMethod ||
            "",

          referenceId:
            withdraw.referenceId,

          adminId:
            req.user.id,

          adminUsername:
            req.user.username ||
            "Admin",

          note:
            "Withdraw approved successfully.",
        });
      } catch (transactionError) {
        console.error(
          "APPROVE WITHDRAW TRANSACTION ERROR:",
          transactionError
        );
      }

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Withdraw approved successfully.",

        withdraw: {
          id:
            withdraw._id,

          referenceId:
            withdraw.referenceId,

          username:
            withdraw.username,

          walletType,

          amount,

          status:
            withdraw.status,

          approvedBy:
            withdraw.approvedByUsername,

          approvedAt:
            withdraw.approvedAt,
        },

        wallet: {
          pkrBalance:
            walletAfter.pkrBalance,

          usdtBalance:
            walletAfter.usdtBalance,

          goldBalance:
            walletAfter.goldBalance,

          lockedPkr:
            walletAfter.lockedPkr,

          lockedUsdt:
            walletAfter.lockedUsdt,
        },
      });

    } catch (error) {
      console.error(
        "APPROVE WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to approve withdraw.",

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
// REJECT WITHDRAW
// PATCH /api/withdraw/:id/reject
// Admin Only
// ======================================================

router.patch(
  "/:id/reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // VALIDATE ID
      // ==================================================

      const withdrawId = String(
        req.params.id || ""
      ).trim();

      if (!withdrawId) {
        return res.status(400).json({
          success: false,
          message: "Withdraw ID is required.",
        });
      }

      // ==================================================
      // REQUEST
      // ==================================================

      const {
        rejectReason,
        note,
      } = req.body || {};

      const withdraw =
        await Withdraw.findById(
          withdrawId
        );

      if (!withdraw) {
        return res.status(404).json({
          success: false,
          message:
            "Withdraw request not found.",
        });
      }

      // ==================================================
      // STATUS CHECK
      // ==================================================

      const currentStatus =
        String(
          withdraw.status || ""
        )
          .trim()
          .toUpperCase();

      if (currentStatus !== "PENDING") {
        return res.status(400).json({
          success: false,
          message:
            `Withdraw already ${currentStatus.toLowerCase()}.`,
        });
      }

      // ==================================================
      // WALLET TYPE
      // ==================================================

      const walletType =
        String(
          withdraw.walletType || ""
        )
          .trim()
          .toUpperCase();

      if (
        !["PKR", "USDT"].includes(
          walletType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal wallet type.",
        });
      }

      // ==================================================
      // AMOUNT
      // ==================================================

      const amount = Number(
        withdraw.amount
      );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal amount.",
        });
      }

      // ==================================================
      // USER WALLET
      // ==================================================

      const wallet =
        await getWallet(
          withdraw.userId,
          withdraw.username
        );

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message:
            "User wallet not found.",
        });
      }

      // ==================================================
      // CURRENT WALLET STATE
      // ==================================================

      const pkrBalance =
        Number(
          wallet.pkrBalance || 0
        );

      const usdtBalance =
        Number(
          wallet.usdtBalance || 0
        );

      const goldBalance =
        Number(
          wallet.goldBalance || 0
        );

      const lockedPkr =
        Number(
          wallet.lockedPkr || 0
        );

      const lockedUsdt =
        Number(
          wallet.lockedUsdt || 0
        );

      // ==================================================
      // RELEASE RESERVED BALANCE
      // ==================================================

      if (walletType === "PKR") {
        if (lockedPkr < amount) {
          return res.status(400).json({
            success: false,
            message:
              "Reserved PKR withdrawal amount is insufficient.",
            lockedPkr,
            requestedAmount: amount,
          });
        }

        wallet.lockedPkr =
          lockedPkr - amount;
      }

      if (walletType === "USDT") {
        if (lockedUsdt < amount) {
          return res.status(400).json({
            success: false,
            message:
              "Reserved USDT withdrawal amount is insufficient.",
            lockedUsdt,
            requestedAmount: amount,
          });
        }

        wallet.lockedUsdt =
          lockedUsdt - amount;
      }

      // ==================================================
      // SAVE WALLET
      // ==================================================

      await wallet.save();

      // ==================================================
      // WALLET AFTER
      // ==================================================

      const walletAfter = {
        pkrBalance:
          Number(
            wallet.pkrBalance || 0
          ),

        usdtBalance:
          Number(
            wallet.usdtBalance || 0
          ),

        goldBalance:
          Number(
            wallet.goldBalance || 0
          ),

        lockedPkr:
          Number(
            wallet.lockedPkr || 0
          ),

        lockedUsdt:
          Number(
            wallet.lockedUsdt || 0
          ),
      };

      // ==================================================
      // REJECTION DETAILS
      // ==================================================

      const finalRejectReason =
        String(
          rejectReason || ""
        ).trim() ||
        "Withdraw rejected by admin.";

      withdraw.status =
        "REJECTED";

      withdraw.rejectReason =
        finalRejectReason;

      if (
        String(note || "").trim()
      ) {
        withdraw.note =
          String(note).trim();
      }

      withdraw.rejectedBy =
        req.user.id;

      withdraw.rejectedByUsername =
        req.user.username ||
        "Admin";

      withdraw.rejectedAt =
        new Date();

      await withdraw.save();

      // ==================================================
      // WALLET HISTORY
      // ==================================================

      try {
        await WalletHistory.create({
          userId:
            withdraw.userId,

          username:
            withdraw.username,

          walletType,

          type:
            "WITHDRAW_REJECTED",

          transactionType:
            "WITHDRAW_REJECTED",

          transactionMode:
            "RELEASE",

          amount,

          balanceBefore:
            walletType === "PKR"
              ? pkrBalance
              : usdtBalance,

          balanceAfter:
            walletType === "PKR"
              ? pkrBalance
              : usdtBalance,

          referenceId:
            withdraw.referenceId,

          status:
            "Rejected",

          admin:
            req.user.username ||
            "Admin",

          adminId:
            req.user.id,

          note:
            finalRejectReason,
        });
      } catch (historyError) {
        console.error(
          "REJECT WITHDRAW HISTORY ERROR:",
          historyError
        );
      }

      // ==================================================
      // TRANSACTION LEDGER
      // ==================================================

      try {
        await Transaction.create({
          userId:
            withdraw.userId,

          username:
            withdraw.username,

          walletType,

          transactionType:
            "WITHDRAW_REJECTED",

          transactionMode:
            "RELEASE",

          amount,

          balanceBefore:
            walletType === "PKR"
              ? pkrBalance
              : usdtBalance,

          balanceAfter:
            walletType === "PKR"
              ? pkrBalance
              : usdtBalance,

          status:
            "Rejected",

          paymentMethod:
            withdraw.paymentMethod ||
            "",

          referenceId:
            withdraw.referenceId,

          adminId:
            req.user.id,

          adminUsername:
            req.user.username ||
            "Admin",

          note:
            finalRejectReason,
        });
      } catch (transactionError) {
        console.error(
          "REJECT WITHDRAW TRANSACTION ERROR:",
          transactionError
        );
      }

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Withdraw rejected successfully.",

        withdraw: {
          id:
            withdraw._id,

          referenceId:
            withdraw.referenceId,

          username:
            withdraw.username,

          walletType,

          amount,

          status:
            withdraw.status,

          rejectedAt:
            withdraw.rejectedAt,

          rejectedBy:
            withdraw.rejectedByUsername,

          rejectReason:
            withdraw.rejectReason,
        },

        wallet: {
          pkrBalance:
            walletAfter.pkrBalance,

          usdtBalance:
            walletAfter.usdtBalance,

          goldBalance:
            walletAfter.goldBalance,

          lockedPkr:
            walletAfter.lockedPkr,

          lockedUsdt:
            walletAfter.lockedUsdt,
        },
      });

    } catch (error) {
      console.error(
        "REJECT WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to reject withdraw request.",
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
// CANCEL WITHDRAW
// PATCH /api/withdraw/:id/cancel
// User can cancel own PENDING withdrawal
// Admin can cancel any PENDING withdrawal
// ======================================================

router.patch(
  "/:id/cancel",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // VALIDATE ID
      // ==================================================

      const withdrawId = String(
        req.params.id || ""
      ).trim();

      if (!withdrawId) {
        return res.status(400).json({
          success: false,
          message: "Withdraw ID is required.",
        });
      }

      // ==================================================
      // FIND WITHDRAW
      // ==================================================

      const withdraw =
        await Withdraw.findById(
          withdrawId
        );

      if (!withdraw) {
        return res.status(404).json({
          success: false,
          message:
            "Withdraw request not found.",
        });
      }

      // ==================================================
      // AUTHORIZATION
      // ==================================================

      const role = String(
        req.user?.role || ""
      )
        .trim()
        .toLowerCase();

      const currentUserId =
        String(
          req.user?.id || ""
        );

      const withdrawUserId =
        String(
          withdraw.userId || ""
        );

      const isAdmin =
        role === "admin";

      const isOwner =
        withdrawUserId ===
        currentUserId;

      if (!isAdmin && !isOwner) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      // ==================================================
      // STATUS CHECK
      // ==================================================

      const currentStatus =
        String(
          withdraw.status || ""
        )
          .trim()
          .toUpperCase();

      if (currentStatus !== "PENDING") {
        return res.status(400).json({
          success: false,
          message:
            "Only pending withdraw requests can be cancelled.",
        });
      }

      // ==================================================
      // WALLET TYPE
      // ==================================================

      const walletType =
        String(
          withdraw.walletType || ""
        )
          .trim()
          .toUpperCase();

      if (
        !["PKR", "USDT"].includes(
          walletType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal wallet type.",
        });
      }

      // ==================================================
      // AMOUNT
      // ==================================================

      const amount = Number(
        withdraw.amount
      );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal amount.",
        });
      }

      // ==================================================
      // USER WALLET
      // ==================================================

      const wallet =
        await getWallet(
          withdraw.userId,
          withdraw.username
        );

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message:
            "User wallet not found.",
        });
      }

      // ==================================================
      // CURRENT BALANCES
      // ==================================================

      const pkrBalance =
        Number(
          wallet.pkrBalance || 0
        );

      const usdtBalance =
        Number(
          wallet.usdtBalance || 0
        );

      const goldBalance =
        Number(
          wallet.goldBalance || 0
        );

      const lockedPkr =
        Number(
          wallet.lockedPkr || 0
        );

      const lockedUsdt =
        Number(
          wallet.lockedUsdt || 0
        );

      // ==================================================
      // RELEASE LOCK
      // ==================================================

      if (walletType === "PKR") {
        if (lockedPkr < amount) {
          return res.status(400).json({
            success: false,
            message:
              "Reserved PKR withdrawal amount is insufficient.",
            lockedPkr,
            requestedAmount: amount,
          });
        }

        wallet.lockedPkr =
          lockedPkr - amount;
      }

      if (walletType === "USDT") {
        if (lockedUsdt < amount) {
          return res.status(400).json({
            success: false,
            message:
              "Reserved USDT withdrawal amount is insufficient.",
            lockedUsdt,
            requestedAmount: amount,
          });
        }

        wallet.lockedUsdt =
          lockedUsdt - amount;
      }

      // ==================================================
      // SAVE WALLET
      // ==================================================

      await wallet.save();

      // ==================================================
      // WALLET AFTER
      // ==================================================

      const walletAfter = {
        pkrBalance:
          Number(
            wallet.pkrBalance || 0
          ),

        usdtBalance:
          Number(
            wallet.usdtBalance || 0
          ),

        goldBalance:
          Number(
            wallet.goldBalance || 0
          ),

        lockedPkr:
          Number(
            wallet.lockedPkr || 0
          ),

        lockedUsdt:
          Number(
            wallet.lockedUsdt || 0
          ),
      };

      // ==================================================
      // UPDATE WITHDRAW
      // ==================================================

      withdraw.status =
        "CANCELLED";

      withdraw.cancelledAt =
        new Date();

      withdraw.cancelledBy =
        req.user.id;

      withdraw.cancelledByUsername =
        req.user.username ||
        (isAdmin ? "Admin" : withdraw.username);

      withdraw.note =
        isAdmin
          ? "Withdraw cancelled by admin."
          : "Withdraw cancelled by user.";

      await withdraw.save();

      // ==================================================
      // TRANSACTION LEDGER
      // ==================================================

      try {
        await Transaction.create({
          userId:
            withdraw.userId,

          username:
            withdraw.username,

          walletType,

          transactionType:
            "WITHDRAW_CANCELLED",

          transactionMode:
            "RELEASE",

          amount,

          balanceBefore:
            walletType === "PKR"
              ? pkrBalance
              : usdtBalance,

          balanceAfter:
            walletType === "PKR"
              ? pkrBalance
              : usdtBalance,

          status:
            "Cancelled",

          paymentMethod:
            withdraw.paymentMethod ||
            "",

          referenceId:
            withdraw.referenceId,

          adminId:
            isAdmin
              ? req.user.id
              : undefined,

          adminUsername:
            isAdmin
              ? req.user.username
              : undefined,

          note:
            withdraw.note,
        });
      } catch (transactionError) {
        console.error(
          "CANCEL WITHDRAW TRANSACTION ERROR:",
          transactionError
        );
      }

      // ==================================================
      // WALLET HISTORY
      // ==================================================

      try {
        await WalletHistory.create({
          userId:
            withdraw.userId,

          username:
            withdraw.username,

          walletType,

          type:
            "WITHDRAW_CANCELLED",

          transactionType:
            "WITHDRAW_CANCELLED",

          transactionMode:
            "RELEASE",

          amount,

          balanceBefore:
            walletType === "PKR"
              ? pkrBalance
              : usdtBalance,

          balanceAfter:
            walletType === "PKR"
              ? pkrBalance
              : usdtBalance,

          referenceId:
            withdraw.referenceId,

          status:
            "Cancelled",

          admin:
            isAdmin
              ? req.user.username
              : undefined,

          adminId:
            isAdmin
              ? req.user.id
              : undefined,

          note:
            withdraw.note,
        });
      } catch (historyError) {
        console.error(
          "CANCEL WITHDRAW HISTORY ERROR:",
          historyError
        );
      }

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Withdraw cancelled successfully.",

        withdraw: {
          id:
            withdraw._id,

          referenceId:
            withdraw.referenceId,

          username:
            withdraw.username,

          walletType,

          amount,

          status:
            withdraw.status,

          cancelledAt:
            withdraw.cancelledAt,

          cancelledBy:
            withdraw.cancelledByUsername,
        },

        wallet: {
          pkrBalance:
            walletAfter.pkrBalance,

          usdtBalance:
            walletAfter.usdtBalance,

          goldBalance:
            walletAfter.goldBalance,

          lockedPkr:
            walletAfter.lockedPkr,

          lockedUsdt:
            walletAfter.lockedUsdt,
        },
      });

    } catch (error) {
      console.error(
        "CANCEL WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to cancel withdraw request.",
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
// ADMIN WITHDRAW DASHBOARD
// GET /api/withdraw/admin/dashboard
// Used by frontend/app/admin/withdraw/page.tsx
// ======================================================

router.get(
  "/admin/dashboard",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const [
        totalWithdraws,
        pendingWithdraws,
        approvedWithdraws,
        rejectedWithdraws,
        cancelledWithdraws,
        recentWithdraws,
      ] = await Promise.all([
        Withdraw.countDocuments({}),

        Withdraw.countDocuments({
          status: "PENDING",
        }),

        Withdraw.countDocuments({
          status: "APPROVED",
        }),

        Withdraw.countDocuments({
          status: "REJECTED",
        }),

        Withdraw.countDocuments({
          status: "CANCELLED",
        }),

        Withdraw.find({})
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(10)
          .lean(),
      ]);

      // --------------------------------------------------
      // APPROVED TOTALS
      // --------------------------------------------------

      const approvedStats =
        await Withdraw.aggregate([
          {
            $match: {
              status: "APPROVED",
            },
          },

          {
            $group: {
              _id: null,

              totalAmount: {
                $sum: {
                  $convert: {
                    input: "$amount",
                    to: "double",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },

              totalPKR: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        {
                          $toUpper: {
                            $ifNull: [
                              "$walletType",
                              "",
                            ],
                          },
                        },
                        "PKR",
                      ],
                    },

                    {
                      $convert: {
                        input: "$amount",
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },

                    0,
                  ],
                },
              },

              totalUSDT: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        {
                          $toUpper: {
                            $ifNull: [
                              "$walletType",
                              "",
                            ],
                          },
                        },
                        "USDT",
                      ],
                    },

                    {
                      $convert: {
                        input: "$amount",
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },

                    0,
                  ],
                },
              },
            },
          },
        ]);

      // --------------------------------------------------
      // PENDING TOTAL
      // --------------------------------------------------

      const pendingStats =
        await Withdraw.aggregate([
          {
            $match: {
              status: "PENDING",
            },
          },

          {
            $group: {
              _id: null,

              totalAmount: {
                $sum: {
                  $convert: {
                    input: "$amount",
                    to: "double",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
            },
          },
        ]);

      const approvedData =
        approvedStats[0] || {};

      const pendingData =
        pendingStats[0] || {};

      const totalApprovedAmount =
        Number(
          approvedData.totalAmount || 0
        );

      const totalPendingAmount =
        Number(
          pendingData.totalAmount || 0
        );

      const totalPKRWithdraws =
        Number(
          approvedData.totalPKR || 0
        );

      const totalUSDTWithdraws =
        Number(
          approvedData.totalUSDT || 0
        );

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(200).json({
        success: true,

        dashboard: {
          totalWithdraws,

          pendingWithdraws,

          approvedWithdraws,

          rejectedWithdraws,

          cancelledWithdraws,

          totalApprovedAmount:
            Number(
              totalApprovedAmount.toFixed(2)
            ),

          totalPendingAmount:
            Number(
              totalPendingAmount.toFixed(2)
            ),

          totalPKRWithdraws:
            Number(
              totalPKRWithdraws.toFixed(2)
            ),

          totalUSDTWithdraws:
            Number(
              totalUSDTWithdraws.toFixed(6)
            ),
        },

        recentWithdraws,

        generatedAt:
          new Date().toISOString(),
      });

    } catch (error) {
      console.error(
        "ADMIN WITHDRAW DASHBOARD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load withdraw dashboard.",
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
// ADMIN WITHDRAW ANALYTICS
// GET /api/withdraw/admin/analytics
// Used by Dashboard Charts
// ======================================================

router.get(
  "/admin/analytics",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const withdrawals =
        await Withdraw.find({
          status: "APPROVED",
        })
          .select(
            "amount walletType createdAt approvedAt"
          )
          .lean();

      let totalAmount = 0;
      let totalPKR = 0;
      let totalUSDT = 0;

      const monthlyMap = {};

      // --------------------------------------------------
      // PROCESS APPROVED WITHDRAWALS
      // --------------------------------------------------

      withdrawals.forEach(
        (withdraw) => {
          const amount = Number(
            withdraw.amount || 0
          );

          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            return;
          }

          // Use approval date when available.
          // Fallback to createdAt.
          const dateValue =
            withdraw.approvedAt ||
            withdraw.createdAt;

          const date =
            new Date(dateValue);

          if (
            Number.isNaN(
              date.getTime()
            )
          ) {
            return;
          }

          const month =
            date.toISOString().slice(0, 7);

          if (!monthlyMap[month]) {
            monthlyMap[month] = {
              month,

              withdrawals: 0,

              amount: 0,

              pkr: 0,

              usdt: 0,
            };
          }

          monthlyMap[month]
            .withdrawals += 1;

          monthlyMap[month]
            .amount += amount;

          const walletType =
            String(
              withdraw.walletType || ""
            )
              .trim()
              .toUpperCase();

          if (
            walletType === "PKR"
          ) {
            monthlyMap[month]
              .pkr += amount;

            totalPKR += amount;
          }

          if (
            walletType === "USDT"
          ) {
            monthlyMap[month]
              .usdt += amount;

            totalUSDT += amount;
          }

          totalAmount += amount;
        }
      );

      // --------------------------------------------------
      // FORMAT MONTHLY ANALYTICS
      // --------------------------------------------------

      const monthlyAnalytics =
        Object.values(
          monthlyMap
        )
          .sort((a, b) =>
            a.month.localeCompare(
              b.month
            )
          )
          .map((item) => ({
            month:
              item.month,

            withdrawals:
              Number(
                item.withdrawals || 0
              ),

            amount:
              Number(
                Number(
                  item.amount || 0
                ).toFixed(2)
              ),

            pkr:
              Number(
                Number(
                  item.pkr || 0
                ).toFixed(2)
              ),

            usdt:
              Number(
                Number(
                  item.usdt || 0
                ).toFixed(6)
              ),
          }));

      // --------------------------------------------------
      // AVERAGE
      // --------------------------------------------------

      const averageWithdraw =
        withdrawals.length > 0
          ? totalAmount /
            withdrawals.length
          : 0;

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(200).json({
        success: true,

        analytics: {
          totalApprovedWithdrawals:
            withdrawals.length,

          totalAmount:
            Number(
              totalAmount.toFixed(2)
            ),

          totalPKR:
            Number(
              totalPKR.toFixed(2)
            ),

          totalUSDT:
            Number(
              totalUSDT.toFixed(6)
            ),

          averageWithdraw:
            Number(
              averageWithdraw.toFixed(2)
            ),

          monthlyAnalytics,
        },
      });

    } catch (error) {
      console.error(
        "WITHDRAW ANALYTICS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load withdraw analytics.",
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
// ADMIN RECENT WITHDRAWS
// GET /api/withdraw/admin/recent
// ======================================================

router.get(
  "/admin/recent",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const requestedLimit =
        Number.parseInt(
          req.query.limit,
          10
        );

      const limit =
        Number.isFinite(
          requestedLimit
        ) &&
        requestedLimit > 0
          ? Math.min(
              requestedLimit,
              100
            )
          : 20;

      const withdrawals =
        await Withdraw.find({})
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(limit)
          .lean();

      return res.status(200).json({
        success: true,

        total:
          withdrawals.length,

        limit,

        recentWithdraws:
          withdrawals,
      });

    } catch (error) {
      console.error(
        "RECENT WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load recent withdrawals.",
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
// ADMIN TOP WITHDRAW USERS
// GET /api/withdraw/admin/top-users
// ======================================================

router.get(
  "/admin/top-users",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const topUsers =
        await Withdraw.aggregate([
          // --------------------------------------------
          // ONLY APPROVED WITHDRAWALS
          // --------------------------------------------

          {
            $match: {
              status: "APPROVED",
            },
          },

          // --------------------------------------------
          // GROUP
          // --------------------------------------------

          {
            $group: {
              _id: "$username",

              totalWithdrawals: {
                $sum: 1,
              },

              totalAmount: {
                $sum: {
                  $convert: {
                    input: "$amount",
                    to: "double",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },

              pkrWithdrawals: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        {
                          $toUpper: {
                            $ifNull: [
                              "$walletType",
                              "",
                            ],
                          },
                        },
                        "PKR",
                      ],
                    },

                    {
                      $convert: {
                        input:
                          "$amount",
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },

                    0,
                  ],
                },
              },

              usdtWithdrawals: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        {
                          $toUpper: {
                            $ifNull: [
                              "$walletType",
                              "",
                            ],
                          },
                        },
                        "USDT",
                      ],
                    },

                    {
                      $convert: {
                        input:
                          "$amount",
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },

                    0,
                  ],
                },
              },

              lastWithdraw: {
                $max: "$approvedAt",
              },
            },
          },

          // --------------------------------------------
          // SORT
          // --------------------------------------------

          {
            $sort: {
              totalAmount: -1,
              _id: 1,
            },
          },

          // --------------------------------------------
          // LIMIT
          // --------------------------------------------

          {
            $limit: 20,
          },
        ]);

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(200).json({
        success: true,

        total:
          topUsers.length,

        users:
          topUsers.map(
            (user, index) => ({
              rank:
                index + 1,

              username:
                user._id ||
                "Unknown",

              totalWithdrawals:
                Number(
                  user.totalWithdrawals ||
                    0
                ),

              totalAmount:
                Number(
                  Number(
                    user.totalAmount || 0
                  ).toFixed(2)
                ),

              pkrWithdrawals:
                Number(
                  Number(
                    user.pkrWithdrawals ||
                      0
                  ).toFixed(2)
                ),

              usdtWithdrawals:
                Number(
                  Number(
                    user.usdtWithdrawals ||
                      0
                  ).toFixed(6)
                ),

              lastWithdraw:
                user.lastWithdraw ||
                null,
            })
          ),
      });

    } catch (error) {
      console.error(
        "TOP WITHDRAW USERS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load top withdraw users.",
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
// ADMIN USER WITHDRAW SUMMARY
// GET /api/withdraw/admin/user-summary/:username
// ======================================================

router.get(
  "/admin/user-summary/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username =
        String(
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

      // --------------------------------------------------
      // USER
      // --------------------------------------------------

      const user =
        await User.findOne({
          username,
        })
          .select(
            "_id username fullName email role createdAt"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // --------------------------------------------------
      // WALLET + WITHDRAWALS
      // --------------------------------------------------

      const [
        wallet,
        withdrawals,
      ] = await Promise.all([
        Wallet.findOne({
          userId: user._id,
        }).lean(),

        Withdraw.find({
          userId: user._id,
        })
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(100)
          .lean(),
      ]);

      // --------------------------------------------------
      // STATISTICS
      // --------------------------------------------------

      let pendingAmount = 0;
      let approvedAmount = 0;
      let rejectedAmount = 0;
      let cancelledAmount = 0;

      let pendingCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      let cancelledCount = 0;

      withdrawals.forEach(
        (withdraw) => {
          const amount =
            Number(
              withdraw.amount || 0
            );

          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            return;
          }

          const status =
            String(
              withdraw.status || ""
            )
              .trim()
              .toUpperCase();

          switch (status) {
            case "PENDING":
              pendingCount++;
              pendingAmount += amount;
              break;

            case "APPROVED":
              approvedCount++;
              approvedAmount += amount;
              break;

            case "REJECTED":
              rejectedCount++;
              rejectedAmount += amount;
              break;

            case "CANCELLED":
              cancelledCount++;
              cancelledAmount += amount;
              break;

            default:
              break;
          }
        }
      );

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(200).json({
        success: true,

        user: {
          id:
            user._id,

          username:
            user.username,

          fullName:
            user.fullName || "",

          email:
            user.email || "",

          role:
            user.role || "user",

          joinedAt:
            user.createdAt || null,
        },

        wallet: wallet
          ? {
              pkrBalance:
                Number(
                  wallet.pkrBalance ||
                    0
                ),

              usdtBalance:
                Number(
                  wallet.usdtBalance ||
                    0
                ),

              goldBalance:
                Number(
                  wallet.goldBalance ||
                    0
                ),

              lockedPkr:
                Number(
                  wallet.lockedPkr ||
                    0
                ),

              lockedUsdt:
                Number(
                  wallet.lockedUsdt ||
                    0
                ),

              availablePkr:
                Math.max(
                  Number(
                    wallet.pkrBalance ||
                      0
                  ) -
                    Number(
                      wallet.lockedPkr ||
                        0
                    ),
                  0
                ),

              availableUsdt:
                Math.max(
                  Number(
                    wallet.usdtBalance ||
                      0
                  ) -
                    Number(
                      wallet.lockedUsdt ||
                        0
                    ),
                  0
                ),
            }
          : null,

        statistics: {
          totalWithdrawals:
            withdrawals.length,

          pendingCount,

          approvedCount,

          rejectedCount,

          cancelledCount,

          pendingAmount:
            Number(
              pendingAmount.toFixed(2)
            ),

          approvedAmount:
            Number(
              approvedAmount.toFixed(2)
            ),

          rejectedAmount:
            Number(
              rejectedAmount.toFixed(2)
            ),

          cancelledAmount:
            Number(
              cancelledAmount.toFixed(2)
            ),
        },

        recentWithdrawals:
          withdrawals.slice(0, 10),
      });

    } catch (error) {
      console.error(
        "USER WITHDRAW SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load user withdraw summary.",
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
// WITHDRAW PAYMENT DEFAULTS
// ======================================================

const DEFAULT_WITHDRAW_PAYMENT_SETTINGS = {
  bankName: "",
  accountTitle: "",
  accountNumber: "",
  iban: "",

  usdtNetwork: "TRC20",
  usdtAddress: "",
};

// ======================================================
// NORMALIZE WITHDRAW PAYMENT SETTINGS
// ======================================================

const normalizeWithdrawPaymentSettings = (
  paymentSettings
) => {
  const source =
    paymentSettings || {};

  const network =
    String(
      source.usdtNetwork ||
        "TRC20"
    )
      .trim()
      .toUpperCase();

  return {
    bankName:
      String(
        source.bankName || ""
      ).trim(),

    accountTitle:
      String(
        source.accountTitle || ""
      ).trim(),

    accountNumber:
      String(
        source.accountNumber || ""
      ).trim(),

    iban:
      String(
        source.iban || ""
      ).trim(),

    usdtNetwork:
      ["TRC20", "ERC20", "BEP20"].includes(
        network
      )
        ? network
        : "TRC20",

    usdtAddress:
      String(
        source.usdtAddress || ""
      ).trim(),
  };
};

// ======================================================
// GET WITHDRAW SETTINGS
// GET /api/withdraw/settings
// Admin Dashboard
// ======================================================

router.get(
  "/settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await getWithdrawSettings();

      const minimumWithdraw =
        Number(
          settings.minimumWithdraw
        );

      const maximumWithdraw =
        Number(
          settings.maximumWithdraw
        );

      return res.status(200).json({
        success: true,

        settings: {
          withdrawEnabled:
            settings.withdrawEnabled !== false,

          minimumWithdraw:
            Number.isFinite(
              minimumWithdraw
            )
              ? minimumWithdraw
              : 100,

          maximumWithdraw:
            Number.isFinite(
              maximumWithdraw
            )
              ? maximumWithdraw
              : 10000000,

          updatedAt:
            settings.updatedAt ||
            null,
        },
      });

    } catch (error) {
      console.error(
        "GET WITHDRAW SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load withdraw settings.",
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
// UPDATE WITHDRAW SETTINGS
// PATCH /api/withdraw/settings
// Admin Only
// ======================================================

router.patch(
  "/settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const {
        withdrawEnabled,
        minimumWithdraw,
        maximumWithdraw,
      } = req.body || {};

      const settings =
        await getWithdrawSettings();

      // --------------------------------------------------
      // WITHDRAW ENABLED
      // --------------------------------------------------

      if (
        withdrawEnabled !==
        undefined
      ) {
        if (
          typeof withdrawEnabled !==
          "boolean"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "withdrawEnabled must be true or false.",
          });
        }

        settings.withdrawEnabled =
          withdrawEnabled;
      }

      // --------------------------------------------------
      // CURRENT VALUES
      // --------------------------------------------------

      let finalMinimum =
        Number(
          settings.minimumWithdraw
        );

      let finalMaximum =
        Number(
          settings.maximumWithdraw
        );

      if (
        !Number.isFinite(
          finalMinimum
        ) ||
        finalMinimum <= 0
      ) {
        finalMinimum = 100;
      }

      if (
        !Number.isFinite(
          finalMaximum
        ) ||
        finalMaximum <= 0
      ) {
        finalMaximum =
          10000000;
      }

      // --------------------------------------------------
      // MINIMUM WITHDRAW
      // --------------------------------------------------

      if (
        minimumWithdraw !==
        undefined
      ) {
        const newMinimum =
          Number(
            minimumWithdraw
          );

        if (
          !Number.isFinite(
            newMinimum
          ) ||
          newMinimum <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Minimum withdraw must be a valid number greater than 0.",
          });
        }

        finalMinimum =
          newMinimum;
      }

      // --------------------------------------------------
      // MAXIMUM WITHDRAW
      // --------------------------------------------------

      if (
        maximumWithdraw !==
        undefined
      ) {
        const newMaximum =
          Number(
            maximumWithdraw
          );

        if (
          !Number.isFinite(
            newMaximum
          ) ||
          newMaximum <= 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Maximum withdraw must be a valid number greater than 0.",
          });
        }

        finalMaximum =
          newMaximum;
      }

      // --------------------------------------------------
      // RANGE VALIDATION
      // --------------------------------------------------

      if (
        finalMinimum >
        finalMaximum
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Minimum withdraw cannot be greater than maximum withdraw.",
        });
      }

      // --------------------------------------------------
      // SAVE
      // --------------------------------------------------

      settings.minimumWithdraw =
        finalMinimum;

      settings.maximumWithdraw =
        finalMaximum;

      await settings.save();

      return res.status(200).json({
        success: true,

        message:
          "Withdraw settings updated successfully.",

        settings: {
          withdrawEnabled:
            settings.withdrawEnabled !== false,

          minimumWithdraw:
            Number(
              settings.minimumWithdraw
            ),

          maximumWithdraw:
            Number(
              settings.maximumWithdraw
            ),

          updatedAt:
            settings.updatedAt ||
            null,
        },
      });

    } catch (error) {
      console.error(
        "UPDATE WITHDRAW SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update withdraw settings.",
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
// GET WITHDRAW PAYMENT SETTINGS
// GET /api/withdraw/payment-settings
// Used by Withdraw Page
// ======================================================

router.get(
  "/payment-settings",
  verifyToken,
  async (req, res) => {
    try {
      const settings =
        await getWithdrawSettings();

      const paymentSettings =
        normalizeWithdrawPaymentSettings(
          settings.withdrawPaymentSettings
        );

      return res.status(200).json({
        success: true,

        paymentSettings,
      });

    } catch (error) {
      console.error(
        "GET WITHDRAW PAYMENT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load withdraw payment settings.",
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
// UPDATE WITHDRAW PAYMENT SETTINGS
// PATCH /api/withdraw/payment-settings
// Admin Only
// ======================================================

router.patch(
  "/payment-settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const {
        bankName,
        accountTitle,
        accountNumber,
        iban,
        usdtNetwork,
        usdtAddress,
      } = req.body || {};

      const settings =
        await getWithdrawSettings();

      // --------------------------------------------------
      // NETWORK
      // --------------------------------------------------

      const network =
        String(
          usdtNetwork ||
            "TRC20"
        )
          .trim()
          .toUpperCase();

      const allowedNetworks = [
        "TRC20",
        "ERC20",
        "BEP20",
      ];

      if (
        !allowedNetworks.includes(
          network
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid USDT network. Allowed: TRC20, ERC20, BEP20.",
        });
      }

      // --------------------------------------------------
      // NORMALIZE VALUES
      // --------------------------------------------------

      const normalized = {
        bankName:
          String(
            bankName || ""
          ).trim(),

        accountTitle:
          String(
            accountTitle || ""
          ).trim(),

        accountNumber:
          String(
            accountNumber || ""
          ).trim(),

        iban:
          String(
            iban || ""
          ).trim(),

        usdtNetwork:
          network,

        usdtAddress:
          String(
            usdtAddress || ""
          ).trim(),
      };

      // --------------------------------------------------
      // OPTIONAL ADDRESS VALIDATION
      // --------------------------------------------------

      if (
        normalized.usdtAddress
          .length > 200
      ) {
        return res.status(400).json({
          success: false,
          message:
            "USDT wallet address is too long.",
        });
      }

      if (
        normalized.bankName.length >
        150
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Bank name is too long.",
        });
      }

      if (
        normalized.accountTitle
          .length > 150
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Account title is too long.",
        });
      }

      // --------------------------------------------------
      // SAVE
      // --------------------------------------------------

      settings.withdrawPaymentSettings =
        normalized;

      await settings.save();

      return res.status(200).json({
        success: true,

        message:
          "Withdraw payment settings updated successfully.",

        paymentSettings:
          normalizeWithdrawPaymentSettings(
            settings.withdrawPaymentSettings
          ),
      });

    } catch (error) {
      console.error(
        "UPDATE WITHDRAW PAYMENT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update withdraw payment settings.",
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
// PUBLIC WITHDRAW PAYMENT DETAILS
// GET /api/withdraw/payment-details
// Used by frontend/app/withdraw/page.tsx
// ======================================================

router.get(
  "/payment-details",
  async (req, res) => {
    try {
      const settings =
        await getWithdrawSettings();

      const paymentSettings =
        normalizeWithdrawPaymentSettings(
          settings.withdrawPaymentSettings
        );

      const minimumWithdraw =
        Number(
          settings.minimumWithdraw
        );

      const maximumWithdraw =
        Number(
          settings.maximumWithdraw
        );

      return res.status(200).json({
        success: true,

        withdrawEnabled:
          settings.withdrawEnabled !==
          false,

        limits: {
          minimumWithdraw:
            Number.isFinite(
              minimumWithdraw
            )
              ? minimumWithdraw
              : 100,

          maximumWithdraw:
            Number.isFinite(
              maximumWithdraw
            )
              ? maximumWithdraw
              : 10000000,
        },

        bank: {
          bankName:
            paymentSettings.bankName,

          accountTitle:
            paymentSettings.accountTitle,

          accountNumber:
            paymentSettings.accountNumber,

          iban:
            paymentSettings.iban,
        },

        usdt: {
          network:
            paymentSettings.usdtNetwork,

          address:
            paymentSettings.usdtAddress,
        },
      });

    } catch (error) {
      console.error(
        "GET WITHDRAW PAYMENT DETAILS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load withdraw payment details.",
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
// ADMIN GET ALL WITHDRAW REQUESTS
// GET /api/withdraw/admin/all
// Used by frontend/app/admin/withdraw/page.tsx
// ======================================================

router.get("/admin/all", verifyToken, isAdmin, async (req, res) => {
  try {
    // --------------------------------------------------
    // PAGINATION
    // --------------------------------------------------

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );

    const skip = (page - 1) * limit;

    // --------------------------------------------------
    // QUERY PARAMETERS
    // --------------------------------------------------

    const {
      status,
      walletType,
      username,
      paymentMethod,
      start,
      end,
    } = req.query;

    const query = {};

    // --------------------------------------------------
    // STATUS
    // --------------------------------------------------

    if (status) {
      const normalizedStatus = String(status).trim().toUpperCase();

      const allowedStatuses = [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
      ];

      if (allowedStatuses.includes(normalizedStatus)) {
        query.status = normalizedStatus;
      }
    }

    // --------------------------------------------------
    // WALLET TYPE
    // --------------------------------------------------

    if (walletType) {
      const normalizedWalletType = String(walletType)
        .trim()
        .toUpperCase();

      const allowedWalletTypes = ["PKR", "USDT"];

      if (allowedWalletTypes.includes(normalizedWalletType)) {
        query.walletType = normalizedWalletType;
      }
    }

    // --------------------------------------------------
    // USERNAME SEARCH
    // --------------------------------------------------

    if (username) {
      const usernameSearch = String(username).trim();

      if (usernameSearch) {
        const escapedUsername = usernameSearch.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        query.username = {
          $regex: escapedUsername,
          $options: "i",
        };
      }
    }

    // --------------------------------------------------
    // PAYMENT METHOD SEARCH
    // --------------------------------------------------

    if (paymentMethod) {
      const paymentMethodSearch = String(paymentMethod).trim();

      if (paymentMethodSearch) {
        const escapedPaymentMethod = paymentMethodSearch.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        query.paymentMethod = {
          $regex: escapedPaymentMethod,
          $options: "i",
        };
      }
    }

    // --------------------------------------------------
    // DATE FILTER
    // --------------------------------------------------

    if (start || end) {
      query.createdAt = {};

      if (start) {
        const startDate = new Date(String(start));

        if (!Number.isNaN(startDate.getTime())) {
          startDate.setHours(0, 0, 0, 0);
          query.createdAt.$gte = startDate;
        }
      }

      if (end) {
        const endDate = new Date(String(end));

        if (!Number.isNaN(endDate.getTime())) {
          endDate.setHours(23, 59, 59, 999);
          query.createdAt.$lte = endDate;
        }
      }

      // Remove empty date object
      if (Object.keys(query.createdAt).length === 0) {
        delete query.createdAt;
      }
    }

    // --------------------------------------------------
    // DATABASE QUERY
    // --------------------------------------------------

    const [total, withdrawals] = await Promise.all([
      Withdraw.countDocuments(query),

      Withdraw.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // --------------------------------------------------
    // RESPONSE
    // --------------------------------------------------

    return res.status(200).json({
      success: true,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },

      filters: {
        status: status
          ? String(status).trim().toUpperCase()
          : null,

        walletType: walletType
          ? String(walletType).trim().toUpperCase()
          : null,

        username: username
          ? String(username).trim()
          : null,

        paymentMethod: paymentMethod
          ? String(paymentMethod).trim()
          : null,

        start: start || null,
        end: end || null,
      },

      withdrawals,
    });
  } catch (error) {
    console.error("ADMIN GET ALL WITHDRAWALS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdrawals.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});


// ======================================================
// ADMIN GET SINGLE WITHDRAW REQUEST
// GET /api/withdraw/admin/:id
// ======================================================

router.get("/admin/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    // --------------------------------------------------
    // VALIDATE ID
    // --------------------------------------------------

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw request ID.",
      });
    }

    // --------------------------------------------------
    // FIND WITHDRAW
    // --------------------------------------------------

    const withdraw = await Withdraw.findById(id).lean();

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    // --------------------------------------------------
    // FIND USER WALLET
    // --------------------------------------------------

    const wallet = await Wallet.findOne({
      userId: withdraw.userId,
    }).lean();

    // --------------------------------------------------
    // WALLET DATA
    // --------------------------------------------------

    const walletData = wallet
      ? {
          pkrBalance: Number(wallet.pkrBalance || 0),
          usdtBalance: Number(wallet.usdtBalance || 0),
          goldBalance: Number(wallet.goldBalance || 0),

          lockedPkr: Number(wallet.lockedPkr || 0),
          lockedUsdt: Number(wallet.lockedUsdt || 0),
          lockedGold: Number(wallet.lockedGold || 0),

          availablePkr: Math.max(
            Number(wallet.pkrBalance || 0) -
              Number(wallet.lockedPkr || 0),
            0
          ),

          availableUsdt: Math.max(
            Number(wallet.usdtBalance || 0) -
              Number(wallet.lockedUsdt || 0),
            0
          ),

          availableGold: Math.max(
            Number(wallet.goldBalance || 0) -
              Number(wallet.lockedGold || 0),
            0
          ),
        }
      : null;

    return res.status(200).json({
      success: true,

      withdraw,

      wallet: walletData,
    });
  } catch (error) {
    console.error("ADMIN GET WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw details.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});


// ======================================================
// ADMIN SEARCH WITHDRAWALS
// GET /api/withdraw/admin/search
//
// ?reference=WTH-123
// ?transactionId=ABC123
// ======================================================

router.get("/admin/search", verifyToken, isAdmin, async (req, res) => {
  try {
    const { reference, transactionId } = req.query;

    const query = {};

    // --------------------------------------------------
    // REFERENCE SEARCH
    // --------------------------------------------------

    if (reference) {
      const referenceSearch = String(reference).trim();

      if (referenceSearch) {
        const escapedReference = referenceSearch.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        // Support both common field names
        query.$or = [
          {
            referenceId: {
              $regex: escapedReference,
              $options: "i",
            },
          },
          {
            reference: {
              $regex: escapedReference,
              $options: "i",
            },
          },
        ];
      }
    }

    // --------------------------------------------------
    // TRANSACTION ID SEARCH
    // --------------------------------------------------

    if (transactionId) {
      const transactionSearch = String(transactionId).trim();

      if (transactionSearch) {
        const escapedTransactionId = transactionSearch.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        const transactionQuery = {
          $or: [
            {
              transactionId: {
                $regex: escapedTransactionId,
                $options: "i",
              },
            },
          ],
        };

        // Combine with reference search safely
        if (query.$or) {
          query.$and = [
            { $or: query.$or },
            transactionQuery,
          ];

          delete query.$or;
        } else {
          Object.assign(query, transactionQuery);
        }
      }
    }

    // --------------------------------------------------
    // LIMIT SEARCH RESULT
    // --------------------------------------------------

    const withdrawals = await Withdraw.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .lean();

    return res.status(200).json({
      success: true,
      total: withdrawals.length,
      withdrawals,
    });
  } catch (error) {
    console.error("ADMIN SEARCH WITHDRAWALS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search withdrawals.",
      error:
        process.env.NODE_ENV === "production"
          ? undefined
          : error.message,
    });
  }
});


// ======================================================
// USER WITHDRAW REQUESTS BY USERNAME
// GET /api/withdraw/admin/user/:username
// ======================================================

router.get(
  "/admin/user/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ------------------------------------------------
      // NORMALIZE USERNAME
      // ------------------------------------------------

      const username = String(req.params.username || "")
        .trim()
        .toLowerCase();

      if (!username) {
        return res.status(400).json({
          success: false,
          message: "Username is required.",
        });
      }

      // ------------------------------------------------
      // FIND USER
      // ------------------------------------------------

      const user = await User.findOne({
        username,
      })
        .select("_id username")
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ------------------------------------------------
      // FIND WITHDRAWALS
      // ------------------------------------------------

      const withdrawals = await Withdraw.find({
        userId: user._id,
      })
        .sort({ createdAt: -1, _id: -1 })
        .limit(500)
        .lean();

      return res.status(200).json({
        success: true,

        username: user.username,

        userId: user._id,

        total: withdrawals.length,

        withdrawals,
      });
    } catch (error) {
      console.error("USER WITHDRAW LIST ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load user withdrawals.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// WITHDRAW REQUEST PREVIEW
// GET /api/withdraw/admin/preview/:id
// ======================================================

router.get(
  "/admin/preview/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ------------------------------------------------
      // VALIDATE ID
      // ------------------------------------------------

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid withdraw request ID.",
        });
      }

      // ------------------------------------------------
      // FIND WITHDRAW
      // ------------------------------------------------

      const withdraw = await Withdraw.findById(id).lean();

      if (!withdraw) {
        return res.status(404).json({
          success: false,
          message: "Withdraw request not found.",
        });
      }

      // ------------------------------------------------
      // FIND CURRENT WALLET
      // ------------------------------------------------

      const wallet = await Wallet.findOne({
        userId: withdraw.userId,
      }).lean();

      // ------------------------------------------------
      // CURRENT WALLET SNAPSHOT
      // ------------------------------------------------

      const currentWallet = wallet
        ? {
            pkrBalance: Number(wallet.pkrBalance || 0),
            usdtBalance: Number(wallet.usdtBalance || 0),
            goldBalance: Number(wallet.goldBalance || 0),

            lockedPkr: Number(wallet.lockedPkr || 0),
            lockedUsdt: Number(wallet.lockedUsdt || 0),
            lockedGold: Number(wallet.lockedGold || 0),

            availablePkr: Math.max(
              Number(wallet.pkrBalance || 0) -
                Number(wallet.lockedPkr || 0),
              0
            ),

            availableUsdt: Math.max(
              Number(wallet.usdtBalance || 0) -
                Number(wallet.lockedUsdt || 0),
              0
            ),

            availableGold: Math.max(
              Number(wallet.goldBalance || 0) -
                Number(wallet.lockedGold || 0),
              0
            ),
          }
        : null;

      return res.status(200).json({
        success: true,

        preview: {
          withdraw,

          walletBefore: withdraw.walletBefore || null,

          walletAfter: withdraw.walletAfter || null,

          currentWallet,
        },
      });
    } catch (error) {
      console.error("WITHDRAW PREVIEW ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to preview withdrawal.",
        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// BULK APPROVE WITHDRAWALS
// PATCH /api/withdraw/admin/bulk-approve
// ======================================================

router.patch(
  "/admin/bulk-approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { withdrawIds } = req.body;

      // --------------------------------------------------
      // VALIDATE REQUEST
      // --------------------------------------------------

      if (!Array.isArray(withdrawIds) || withdrawIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "withdrawIds array is required.",
        });
      }

      // Prevent extremely large bulk requests
      if (withdrawIds.length > 100) {
        return res.status(400).json({
          success: false,
          message: "Maximum 100 withdrawals can be processed at once.",
        });
      }

      // Remove duplicates
      const uniqueWithdrawIds = [
        ...new Set(
          withdrawIds
            .map((id) => String(id || "").trim())
            .filter(Boolean)
        ),
      ];

      let approved = 0;
      let skipped = 0;

      const failed = [];

      // --------------------------------------------------
      // PROCESS EACH WITHDRAWAL
      // --------------------------------------------------

      for (const withdrawId of uniqueWithdrawIds) {
        try {
          // ----------------------------------------------
          // VALIDATE OBJECT ID
          // ----------------------------------------------

          if (!mongoose.Types.ObjectId.isValid(withdrawId)) {
            failed.push({
              withdrawId,
              error: "Invalid withdrawal ID.",
            });

            continue;
          }

          // ----------------------------------------------
          // FIND WITHDRAWAL
          // ----------------------------------------------

          const withdraw = await Withdraw.findById(withdrawId);

          if (!withdraw) {
            skipped++;

            continue;
          }

          // ----------------------------------------------
          // ONLY PENDING CAN BE APPROVED
          // ----------------------------------------------

          if (
            String(withdraw.status || "").toUpperCase() !==
            "PENDING"
          ) {
            skipped++;

            continue;
          }

          // ----------------------------------------------
          // NORMALIZE WALLET TYPE
          // ----------------------------------------------

          const walletType = String(
            withdraw.walletType || ""
          )
            .trim()
            .toUpperCase();

          if (!["PKR", "USDT"].includes(walletType)) {
            failed.push({
              withdrawId,
              error: "Invalid wallet type.",
            });

            continue;
          }

          // ----------------------------------------------
          // VALIDATE AMOUNT
          // ----------------------------------------------

          const amount = Number(withdraw.amount);

          if (!Number.isFinite(amount) || amount <= 0) {
            failed.push({
              withdrawId,
              error: "Invalid withdrawal amount.",
            });

            continue;
          }

          // ----------------------------------------------
          // GET WALLET
          // ----------------------------------------------

          const wallet = await getWallet(
            withdraw.userId,
            withdraw.username
          );

          // ----------------------------------------------
          // FROZEN WALLET CHECK
          // ----------------------------------------------

          if (wallet.isFrozen === true) {
            failed.push({
              withdrawId,
              error: "User wallet is frozen.",
            });

            continue;
          }

          // ----------------------------------------------
          // CURRENT BALANCES
          // ----------------------------------------------

          const currentPkrBalance = Number(
            wallet.pkrBalance || 0
          );

          const currentUsdtBalance = Number(
            wallet.usdtBalance || 0
          );

          const currentGoldBalance = Number(
            wallet.goldBalance || 0
          );

          const currentLockedPkr = Number(
            wallet.lockedPkr || 0
          );

          const currentLockedUsdt = Number(
            wallet.lockedUsdt || 0
          );

          const currentLockedGold = Number(
            wallet.lockedGold || 0
          );

          // ----------------------------------------------
          // VALIDATE LOCK
          // ----------------------------------------------

          if (walletType === "PKR") {
            if (currentLockedPkr < amount) {
              failed.push({
                withdrawId,
                error:
                  "Insufficient locked PKR amount for approval.",
              });

              continue;
            }

            if (currentPkrBalance < amount) {
              failed.push({
                withdrawId,
                error: "Insufficient PKR balance.",
              });

              continue;
            }
          }

          if (walletType === "USDT") {
            if (currentLockedUsdt < amount) {
              failed.push({
                withdrawId,
                error:
                  "Insufficient locked USDT amount for approval.",
              });

              continue;
            }

            if (currentUsdtBalance < amount) {
              failed.push({
                withdrawId,
                error: "Insufficient USDT balance.",
              });

              continue;
            }
          }

          // ----------------------------------------------
          // WALLET BEFORE SNAPSHOT
          // ----------------------------------------------

          withdraw.walletBefore = {
            pkrBalance: currentPkrBalance,
            usdtBalance: currentUsdtBalance,
            goldBalance: currentGoldBalance,

            lockedPkr: currentLockedPkr,
            lockedUsdt: currentLockedUsdt,
            lockedGold: currentLockedGold,
          };

          // ----------------------------------------------
          // APPLY APPROVAL
          //
          // Balance decreases.
          // Locked amount also decreases.
          // ----------------------------------------------

          if (walletType === "PKR") {
            wallet.pkrBalance =
              currentPkrBalance - amount;

            wallet.lockedPkr =
              currentLockedPkr - amount;

            wallet.totalWithdraw =
              Number(wallet.totalWithdraw || 0) + amount;

            wallet.totalPkrWithdraw =
              Number(wallet.totalPkrWithdraw || 0) + amount;
          }

          if (walletType === "USDT") {
            wallet.usdtBalance =
              currentUsdtBalance - amount;

            wallet.lockedUsdt =
              currentLockedUsdt - amount;

            wallet.totalWithdraw =
              Number(wallet.totalWithdraw || 0) + amount;

            wallet.totalUsdtWithdrawn =
              Number(wallet.totalUsdtWithdrawn || 0) + amount;
          }

          wallet.lastWithdrawAt = new Date();

          await wallet.save();

          // ----------------------------------------------
          // WALLET AFTER SNAPSHOT
          // ----------------------------------------------

          withdraw.walletAfter = {
            pkrBalance: Number(
              wallet.pkrBalance || 0
            ),

            usdtBalance: Number(
              wallet.usdtBalance || 0
            ),

            goldBalance: Number(
              wallet.goldBalance || 0
            ),

            lockedPkr: Number(
              wallet.lockedPkr || 0
            ),

            lockedUsdt: Number(
              wallet.lockedUsdt || 0
            ),

            lockedGold: Number(
              wallet.lockedGold || 0
            ),
          };

          // ----------------------------------------------
          // UPDATE WITHDRAW REQUEST
          // ----------------------------------------------

          withdraw.walletType = walletType;

          withdraw.status = "APPROVED";

          withdraw.approvedBy = req.user.id;

          withdraw.approvedByUsername =
            req.user.username;

          withdraw.approvedAt = new Date();

          await withdraw.save();

          // ----------------------------------------------
          // WALLET HISTORY
          // ----------------------------------------------

          await WalletHistory.create({
            userId: withdraw.userId,
            username: withdraw.username,

            walletType,

            type: "WITHDRAW_APPROVED",

            transactionType: "WITHDRAW_APPROVED",
            transactionMode: "DEBIT",

            amount,

            balanceBefore:
              walletType === "PKR"
                ? withdraw.walletBefore.pkrBalance
                : withdraw.walletBefore.usdtBalance,

            balanceAfter:
              walletType === "PKR"
                ? withdraw.walletAfter.pkrBalance
                : withdraw.walletAfter.usdtBalance,

            referenceId:
              withdraw.referenceId ||
              withdraw.reference ||
              undefined,

            admin: req.user.username,

            adminId: req.user.id,

            status: "Completed",

            note: "Bulk withdraw approved.",
          });

          // ----------------------------------------------
          // TRANSACTION LEDGER
          // ----------------------------------------------

          await Transaction.create({
            userId: withdraw.userId,
            username: withdraw.username,

            walletType,

            transactionType: "WITHDRAW_APPROVED",
            transactionMode: "DEBIT",

            amount,

            balanceBefore:
              walletType === "PKR"
                ? withdraw.walletBefore.pkrBalance
                : withdraw.walletBefore.usdtBalance,

            balanceAfter:
              walletType === "PKR"
                ? withdraw.walletAfter.pkrBalance
                : withdraw.walletAfter.usdtBalance,

            status: "Completed",

            paymentMethod:
              withdraw.paymentMethod,

            referenceId:
              withdraw.referenceId ||
              withdraw.reference ||
              undefined,

            adminId: req.user.id,

            adminUsername:
              req.user.username,

            note: "Bulk withdraw approved.",
          });

          approved++;
        } catch (err) {
          console.error(
            `BULK APPROVE ITEM ERROR [${withdrawId}]:`,
            err
          );

          failed.push({
            withdrawId,
            error: err.message || "Approval failed.",
          });
        }
      }

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(200).json({
        success: true,

        message: "Bulk withdraw approval completed.",

        result: {
          requested: uniqueWithdrawIds.length,
          approved,
          skipped,
          failed: failed.length,
        },

        failed,
      });
    } catch (error) {
      console.error(
        "BULK APPROVE WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Bulk approval failed.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// BULK REJECT WITHDRAWALS
// PATCH /api/withdraw/admin/bulk-reject
// ======================================================

router.patch(
  "/admin/bulk-reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const {
        withdrawIds,
        rejectReason,
      } = req.body;

      // --------------------------------------------------
      // VALIDATE REQUEST
      // --------------------------------------------------

      if (
        !Array.isArray(withdrawIds) ||
        withdrawIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "withdrawIds array is required.",
        });
      }

      if (withdrawIds.length > 100) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum 100 withdrawals can be processed at once.",
        });
      }

      const uniqueWithdrawIds = [
        ...new Set(
          withdrawIds
            .map((id) => String(id || "").trim())
            .filter(Boolean)
        ),
      ];

      const reason =
        String(
          rejectReason ||
            "Bulk rejected by admin."
        ).trim().slice(0, 500);

      let rejected = 0;
      let skipped = 0;

      const failed = [];

      // --------------------------------------------------
      // PROCESS EACH WITHDRAWAL
      // --------------------------------------------------

      for (const withdrawId of uniqueWithdrawIds) {
        try {
          // ----------------------------------------------
          // VALIDATE ID
          // ----------------------------------------------

          if (
            !mongoose.Types.ObjectId.isValid(
              withdrawId
            )
          ) {
            failed.push({
              withdrawId,
              error: "Invalid withdrawal ID.",
            });

            continue;
          }

          // ----------------------------------------------
          // FIND WITHDRAWAL
          // ----------------------------------------------

          const withdraw =
            await Withdraw.findById(
              withdrawId
            );

          if (!withdraw) {
            skipped++;

            continue;
          }

          // ----------------------------------------------
          // ONLY PENDING CAN BE REJECTED
          // ----------------------------------------------

          if (
            String(withdraw.status || "").toUpperCase() !==
            "PENDING"
          ) {
            skipped++;

            continue;
          }

          // ----------------------------------------------
          // NORMALIZE WALLET TYPE
          // ----------------------------------------------

          const walletType = String(
            withdraw.walletType || ""
          )
            .trim()
            .toUpperCase();

          if (!["PKR", "USDT"].includes(walletType)) {
            failed.push({
              withdrawId,
              error: "Invalid wallet type.",
            });

            continue;
          }

          // ----------------------------------------------
          // VALIDATE AMOUNT
          // ----------------------------------------------

          const amount = Number(
            withdraw.amount
          );

          if (!Number.isFinite(amount) || amount <= 0) {
            failed.push({
              withdrawId,
              error: "Invalid withdrawal amount.",
            });

            continue;
          }

          // ----------------------------------------------
          // GET WALLET
          // ----------------------------------------------

          const wallet = await getWallet(
            withdraw.userId,
            withdraw.username
          );

          // ----------------------------------------------
          // WALLET BEFORE
          // ----------------------------------------------

          const currentPkrBalance = Number(
            wallet.pkrBalance || 0
          );

          const currentUsdtBalance = Number(
            wallet.usdtBalance || 0
          );

          const currentGoldBalance = Number(
            wallet.goldBalance || 0
          );

          const currentLockedPkr = Number(
            wallet.lockedPkr || 0
          );

          const currentLockedUsdt = Number(
            wallet.lockedUsdt || 0
          );

          const currentLockedGold = Number(
            wallet.lockedGold || 0
          );

          // ----------------------------------------------
          // VERIFY LOCK EXISTS
          // ----------------------------------------------

          if (walletType === "PKR") {
            if (currentLockedPkr < amount) {
              failed.push({
                withdrawId,
                error:
                  "Insufficient locked PKR amount for rejection.",
              });

              continue;
            }
          }

          if (walletType === "USDT") {
            if (currentLockedUsdt < amount) {
              failed.push({
                withdrawId,
                error:
                  "Insufficient locked USDT amount for rejection.",
              });

              continue;
            }
          }

          // ----------------------------------------------
          // SAVE WITHDRAW BEFORE SNAPSHOT
          // ----------------------------------------------

          withdraw.walletBefore = {
            pkrBalance: currentPkrBalance,
            usdtBalance: currentUsdtBalance,
            goldBalance: currentGoldBalance,

            lockedPkr: currentLockedPkr,
            lockedUsdt: currentLockedUsdt,
            lockedGold: currentLockedGold,
          };

          // ----------------------------------------------
          // RELEASE LOCK
          //
          // IMPORTANT:
          // Rejection does NOT reduce actual balance.
          // It only releases reserved/locked amount.
          // ----------------------------------------------

          if (walletType === "PKR") {
            wallet.lockedPkr =
              currentLockedPkr - amount;
          }

          if (walletType === "USDT") {
            wallet.lockedUsdt =
              currentLockedUsdt - amount;
          }

          wallet.lastWithdrawAt = new Date();

          await wallet.save();

          // ----------------------------------------------
          // WALLET AFTER
          // ----------------------------------------------

          withdraw.walletAfter = {
            pkrBalance: Number(
              wallet.pkrBalance || 0
            ),

            usdtBalance: Number(
              wallet.usdtBalance || 0
            ),

            goldBalance: Number(
              wallet.goldBalance || 0
            ),

            lockedPkr: Number(
              wallet.lockedPkr || 0
            ),

            lockedUsdt: Number(
              wallet.lockedUsdt || 0
            ),

            lockedGold: Number(
              wallet.lockedGold || 0
            ),
          };

          // ----------------------------------------------
          // UPDATE WITHDRAW
          // ----------------------------------------------

          withdraw.status = "REJECTED";

          withdraw.rejectReason = reason;

          withdraw.rejectedBy = req.user.id;

          withdraw.rejectedByUsername =
            req.user.username;

          withdraw.rejectedAt = new Date();

          await withdraw.save();

          // ----------------------------------------------
          // WALLET HISTORY
          // ----------------------------------------------

          await WalletHistory.create({
            userId: withdraw.userId,
            username: withdraw.username,

            walletType,

            type: "WITHDRAW_REJECTED",

            transactionType: "WITHDRAW_REJECTED",
            transactionMode: "RELEASE",

            amount,

            balanceBefore:
              walletType === "PKR"
                ? withdraw.walletBefore.pkrBalance
                : withdraw.walletBefore.usdtBalance,

            balanceAfter:
              walletType === "PKR"
                ? withdraw.walletAfter.pkrBalance
                : withdraw.walletAfter.usdtBalance,

            referenceId:
              withdraw.referenceId ||
              withdraw.reference ||
              undefined,

            admin: req.user.username,

            adminId: req.user.id,

            status: "Rejected",

            note: reason,
          });

          // ----------------------------------------------
          // TRANSACTION LEDGER
          // ----------------------------------------------

          await Transaction.create({
            userId: withdraw.userId,
            username: withdraw.username,

            walletType,

            transactionType: "WITHDRAW_REJECTED",
            transactionMode: "RELEASE",

            amount,

            balanceBefore:
              walletType === "PKR"
                ? withdraw.walletBefore.pkrBalance
                : withdraw.walletBefore.usdtBalance,

            balanceAfter:
              walletType === "PKR"
                ? withdraw.walletAfter.pkrBalance
                : withdraw.walletAfter.usdtBalance,

            status: "Rejected",

            paymentMethod:
              withdraw.paymentMethod,

            referenceId:
              withdraw.referenceId ||
              withdraw.reference ||
              undefined,

            adminId: req.user.id,

            adminUsername:
              req.user.username,

            note: reason,
          });

          rejected++;
        } catch (err) {
          console.error(
            `BULK REJECT ITEM ERROR [${withdrawId}]:`,
            err
          );

          failed.push({
            withdrawId,
            error:
              err.message || "Rejection failed.",
          });
        }
      }

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          "Bulk withdraw rejection completed.",

        result: {
          requested: uniqueWithdrawIds.length,
          rejected,
          skipped,
          failed: failed.length,
        },

        failed,
      });
    } catch (error) {
      console.error(
        "BULK REJECT WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Bulk rejection failed.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// WITHDRAW STATISTICS
// GET /api/withdraw/statistics
// ======================================================

router.get(
  "/statistics",
  verifyToken,
  async (req, res) => {
    try {
      const isAdminUser =
        String(req.user.role || "").toLowerCase() ===
        "admin";

      const query = isAdminUser
        ? {}
        : {
            userId: req.user.id,
          };

      // --------------------------------------------------
      // AGGREGATE STATISTICS
      // --------------------------------------------------

      const statisticsResult =
        await Withdraw.aggregate([
          {
            $match: query,
          },

          {
            $group: {
              _id: null,

              totalWithdrawals: {
                $sum: 1,
              },

              pendingAmount: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "PENDING",
                      ],
                    },
                    {
                      $convert: {
                        input: "$amount",
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },
                    0,
                  ],
                },
              },

              approvedAmount: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "APPROVED",
                      ],
                    },
                    {
                      $convert: {
                        input: "$amount",
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },
                    0,
                  ],
                },
              },

              rejectedAmount: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$status",
                        "REJECTED",
                      ],
                    },
                    {
                      $convert: {
                        input: "$amount",
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },
                    0,
                  ],
                },
              },

              totalPKR: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: [
                            "$status",
                            "APPROVED",
                          ],
                        },
                        {
                          $eq: [
                            "$walletType",
                            "PKR",
                          ],
                        },
                      ],
                    },
                    {
                      $convert: {
                        input: "$amount",
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },
                    0,
                  ],
                },
              },

              totalUSDT: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        {
                          $eq: [
                            "$status",
                            "APPROVED",
                          ],
                        },
                        {
                          $eq: [
                            "$walletType",
                            "USDT",
                          ],
                        },
                      ],
                    },
                    {
                      $convert: {
                        input: "$amount",
                        to: "double",
                        onError: 0,
                        onNull: 0,
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        ]);

      const stats =
        statisticsResult[0] || {};

      return res.status(200).json({
        success: true,

        statistics: {
          totalWithdrawals: Number(
            stats.totalWithdrawals || 0
          ),

          pendingAmount: Number(
            Number(
              stats.pendingAmount || 0
            ).toFixed(2)
          ),

          approvedAmount: Number(
            Number(
              stats.approvedAmount || 0
            ).toFixed(2)
          ),

          rejectedAmount: Number(
            Number(
              stats.rejectedAmount || 0
            ).toFixed(2)
          ),

          totalPKRWithdrawals: Number(
            Number(
              stats.totalPKR || 0
            ).toFixed(2)
          ),

          totalUSDTWithdrawals: Number(
            Number(
              stats.totalUSDT || 0
            ).toFixed(6)
          ),
        },

        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "WITHDRAW STATISTICS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to load statistics.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// WITHDRAW DEBUG
// GET /api/withdraw/debug
// ======================================================

router.get(
  "/debug",
  verifyToken,
  async (req, res) => {
    try {
      const isAdminUser =
        String(req.user.role || "").toLowerCase() ===
        "admin";

      const query = isAdminUser
        ? {}
        : {
            userId: req.user.id,
          };

      // --------------------------------------------------
      // CURRENT USER WALLET
      // --------------------------------------------------

      const wallet =
        await Wallet.findOne({
          userId: req.user.id,
        }).lean();

      // --------------------------------------------------
      // COUNTS
      // --------------------------------------------------

      const [
        withdrawCount,
        pendingCount,
        transactionCount,
        historyCount,
      ] = await Promise.all([
        Withdraw.countDocuments(query),

        Withdraw.countDocuments({
          ...query,
          status: "PENDING",
        }),

        Transaction.countDocuments({
          ...query,
          transactionType: {
            $regex: "^WITHDRAW",
            $options: "i",
          },
        }),

        WalletHistory.countDocuments({
          ...query,
          $or: [
            {
              type: {
                $regex: "WITHDRAW",
                $options: "i",
              },
            },
            {
              transactionType: {
                $regex: "WITHDRAW",
                $options: "i",
              },
            },
          ],
        }),
      ]);

      // --------------------------------------------------
      // SAFE WALLET DIAGNOSTICS
      // --------------------------------------------------

      const walletDiagnostics = wallet
        ? {
            pkrBalance: Number(
              wallet.pkrBalance || 0
            ),

            usdtBalance: Number(
              wallet.usdtBalance || 0
            ),

            goldBalance: Number(
              wallet.goldBalance || 0
            ),

            lockedPkr: Number(
              wallet.lockedPkr || 0
            ),

            lockedUsdt: Number(
              wallet.lockedUsdt || 0
            ),

            lockedGold: Number(
              wallet.lockedGold || 0
            ),

            availablePkr: Math.max(
              Number(wallet.pkrBalance || 0) -
                Number(wallet.lockedPkr || 0),
              0
            ),

            availableUsdt: Math.max(
              Number(wallet.usdtBalance || 0) -
                Number(wallet.lockedUsdt || 0),
              0
            ),

            availableGold: Math.max(
              Number(wallet.goldBalance || 0) -
                Number(wallet.lockedGold || 0),
              0
            ),

            isFrozen:
              wallet.isFrozen === true,

            status:
              wallet.status || "Active",
          }
        : null;

      return res.status(200).json({
        success: true,

        diagnostics: {
          module:
            "Withdraw API V18 Enterprise",

          userId: req.user.id,

          username:
            req.user.username || null,

          role:
            req.user.role || null,

          walletExists: !!wallet,

          wallet: walletDiagnostics,

          totalWithdrawals:
            withdrawCount,

          pendingWithdrawals:
            pendingCount,

          transactionLedgerEntries:
            transactionCount,

          walletHistoryEntries:
            historyCount,
        },

        serverTime:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "WITHDRAW DEBUG ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Diagnostics failed.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// API ROUTES LIST
// GET /api/withdraw/routes
// ======================================================

router.get("/routes", (req, res) => {
  return res.status(200).json({
    success: true,

    module:
      "GoldTrade V18 Enterprise Withdraw API",

    version: "18.0.0",

    routes: [
      "GET /api/withdraw/health",

      "POST /api/withdraw/create",

      "GET /api/withdraw/settings",
      "PATCH /api/withdraw/settings",

      "GET /api/withdraw/payment-settings",
      "PATCH /api/withdraw/payment-settings",
      "GET /api/withdraw/payment-details",

      "GET /api/withdraw/history",
      "GET /api/withdraw/history/:username",

      "GET /api/withdraw/pending",
      "GET /api/withdraw/recent",
      "GET /api/withdraw/summary",

      "PATCH /api/withdraw/:id/approve",
      "PATCH /api/withdraw/:id/reject",
      "PATCH /api/withdraw/:id/cancel",

      "GET /api/withdraw/admin/dashboard",
      "GET /api/withdraw/admin/analytics",
      "GET /api/withdraw/admin/recent",
      "GET /api/withdraw/admin/top-users",
      "GET /api/withdraw/admin/user-summary/:username",

      "GET /api/withdraw/admin/all",
      "GET /api/withdraw/admin/:id",
      "GET /api/withdraw/admin/search",
      "GET /api/withdraw/admin/user/:username",
      "GET /api/withdraw/admin/preview/:id",

      "PATCH /api/withdraw/admin/bulk-approve",
      "PATCH /api/withdraw/admin/bulk-reject",

      "GET /api/withdraw/statistics",
      "GET /api/withdraw/debug",
      "GET /api/withdraw/routes",
    ],

    timestamp:
      new Date().toISOString(),
  });
});


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;