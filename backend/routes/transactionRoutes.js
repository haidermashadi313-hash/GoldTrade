/*
========================================================
 GoldTrade V18 Enterprise
 Transaction Audit Routes
 Linux + Render + MongoDB Compatible
========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const Transaction = require("../models/Transaction");

// ======================================================
// MIDDLEWARE
// ======================================================

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

// ======================================================
// USER TRANSACTION HISTORY
// GET /api/transactions/history/:username
// ======================================================

router.get(
  "/history/:username",
  verifyToken,
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

      const loggedUsername =
        String(
          req.user?.username || ""
        )
          .trim()
          .toLowerCase();

      // User can only access their own history.
      if (
        username !==
        loggedUsername
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      const transactions =
        await Transaction.find({
          username,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,

        transactions,

        total:
          transactions.length,
      });
    } catch (error) {
      console.error(
        "USER TRANSACTION HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load transaction history.",

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
// USER TRANSACTION DETAILS
// GET /api/transactions/details/:id
// ======================================================

router.get(
  "/details/:id",
  verifyToken,
  async (req, res) => {
    try {
      const transaction =
        await Transaction.findById(
          req.params.id
        ).lean();

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message:
            "Transaction not found.",
        });
      }

      const transactionUsername =
        String(
          transaction.username || ""
        )
          .trim()
          .toLowerCase();

      const loggedUsername =
        String(
          req.user?.username || ""
        )
          .trim()
          .toLowerCase();

      const userRole =
        String(
          req.user?.role || ""
        )
          .trim()
          .toLowerCase();

      // Security check
      if (
        transactionUsername !==
          loggedUsername &&
        userRole !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      return res.status(200).json({
        success: true,

        transaction,
      });
    } catch (error) {
      console.error(
        "TRANSACTION DETAILS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load transaction details.",

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
// ADMIN TRANSACTION LIST
// GET /api/transactions/admin
//
// Enterprise Search + Filters
// ======================================================

router.get(
  "/admin",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const {
        username,
        walletType,
        transactionType,
        transactionMode,
        status,
        page = 1,
        limit = 25,
      } = req.query;

      // ==================================================
      // QUERY BUILDER
      // ==================================================

      const query = {};

      // ==================================================
      // USERNAME
      // ==================================================

      if (
        username &&
        String(username).trim() !== ""
      ) {
        query.username =
          String(username)
            .trim()
            .toLowerCase();
      }

      // ==================================================
      // WALLET TYPE
      // ==================================================

      const cleanWalletType =
        String(
          walletType || ""
        )
          .trim()
          .toUpperCase();

      if (
        ["PKR", "GOLD", "USDT"].includes(
          cleanWalletType
        )
      ) {
        query.walletType =
          cleanWalletType;
      }

      // ==================================================
      // TRANSACTION TYPE
      // ==================================================

      if (
        transactionType &&
        String(transactionType).trim() !== "" &&
        String(transactionType).toUpperCase() !==
          "ALL"
      ) {
        query.transactionType =
          String(
            transactionType
          )
            .trim()
            .toUpperCase();
      }

      // ==================================================
      // TRANSACTION MODE
      // ==================================================

      const cleanMode =
        String(
          transactionMode || ""
        )
          .trim()
          .toUpperCase();

      if (
        ["CREDIT", "DEBIT", "RELEASE"].includes(
          cleanMode
        )
      ) {
        query.transactionMode =
          cleanMode;
      }

      // ==================================================
      // STATUS
      // ==================================================

      if (
        status &&
        String(status).trim() !== "" &&
        String(status).toUpperCase() !==
          "ALL"
      ) {
        const cleanStatus =
          String(status)
            .trim()
            .toUpperCase();

        if (
          [
            "PENDING",
            "COMPLETED",
            "REJECTED",
            "FAILED",
          ].includes(cleanStatus)
        ) {
          query.status =
            cleanStatus === "PENDING"
              ? "Pending"
              : cleanStatus ===
                "COMPLETED"
              ? "Completed"
              : cleanStatus ===
                "REJECTED"
              ? "Rejected"
              : "Failed";
        }
      }

      // ==================================================
      // PAGINATION
      // ==================================================

      const requestedPage =
        Number(page);

      const requestedLimit =
        Number(limit);

      const currentPage =
        Number.isFinite(
          requestedPage
        ) &&
        requestedPage > 0
          ? Math.floor(
              requestedPage
            )
          : 1;

      const pageSize =
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
          : 25;

      // ==================================================
      // TOTAL
      // ==================================================

      const totalTransactions =
        await Transaction.countDocuments(
          query
        );

      // ==================================================
      // DATA
      // ==================================================

      const transactions =
        await Transaction.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(
            (currentPage - 1) *
              pageSize
          )
          .limit(pageSize)
          .lean();

      return res.status(200).json({
        success: true,

        transactions,

        total:
          totalTransactions,

        pagination: {
          currentPage,

          pageSize,

          totalTransactions,

          totalPages:
            Math.ceil(
              totalTransactions /
                pageSize
            ),
        },
      });
    } catch (error) {
      console.error(
        "ADMIN TRANSACTION LIST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load transactions.",

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
// ADMIN TRANSACTION BY USER
// GET /api/transactions/admin/user/:username
// ======================================================

router.get(
  "/admin/user/:username",
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

      const transactions =
        await Transaction.find({
          username,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,

        username,

        total:
          transactions.length,

        transactions,
      });
    } catch (error) {
      console.error(
        "ADMIN USER TRANSACTION ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load user transactions.",

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
// ADMIN TRANSACTION DASHBOARD STATS
// GET /api/transactions/admin/stats
// ======================================================

router.get(
  "/admin/stats",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // BASIC COUNTS
      // ==================================================

      const [
        totalTransactions,
        completedTransactions,
        pendingTransactions,
        rejectedTransactions,
        failedTransactions,
      ] = await Promise.all([
        Transaction.countDocuments(),

        Transaction.countDocuments({
          status: "Completed",
        }),

        Transaction.countDocuments({
          status: "Pending",
        }),

        Transaction.countDocuments({
          status: "Rejected",
        }),

        Transaction.countDocuments({
          status: "Failed",
        }),
      ]);

      // ==================================================
      // WALLET TOTALS
      // ==================================================

      const walletTotals =
        await Transaction.aggregate([
          {
            $match: {
              status: "Completed",
            },
          },

          {
            $group: {
              _id: "$walletType",

              totalAmount: {
                $sum: "$amount",
              },

              totalCount: {
                $sum: 1,
              },
            },
          },
        ]);

      const walletSummary = {
        PKR: {
          amount: 0,
          count: 0,
        },

        GOLD: {
          amount: 0,
          count: 0,
        },

        USDT: {
          amount: 0,
          count: 0,
        },
      };

      walletTotals.forEach(
        (item) => {
          if (
            walletSummary[
              item._id
            ]
          ) {
            walletSummary[
              item._id
            ] = {
              amount:
                Number(
                  item.totalAmount ||
                    0
                ),

              count:
                Number(
                  item.totalCount ||
                    0
                ),
            };
          }
        }
      );

      // ==================================================
      // TRANSACTION TYPE TOTALS
      // ==================================================

      const transactionTotals =
        await Transaction.aggregate([
          {
            $match: {
              status: "Completed",
            },
          },

          {
            $group: {
              _id:
                "$transactionType",

              totalAmount: {
                $sum: "$amount",
              },

              totalCount: {
                $sum: 1,
              },
            },
          },
        ]);

      const transactionSummary = {};

      transactionTotals.forEach(
        (item) => {
          transactionSummary[
            item._id
          ] = {
            amount:
              Number(
                item.totalAmount ||
                  0
              ),

            count:
              Number(
                item.totalCount ||
                  0
              ),
          };
        }
      );

      // ==================================================
      // LAST 24 HOURS
      // ==================================================

      const yesterday =
        new Date();

      yesterday.setHours(
        yesterday.getHours() - 24
      );

      const last24Hours =
        await Transaction.countDocuments({
          createdAt: {
            $gte: yesterday,
          },
        });

      const last24Volume =
        await Transaction.aggregate([
          {
            $match: {
              createdAt: {
                $gte: yesterday,
              },

              status:
                "Completed",
            },
          },

          {
            $group: {
              _id:
                "$walletType",

              totalAmount: {
                $sum: "$amount",
              },
            },
          },
        ]);

      const volume24 = {
        PKR: 0,
        GOLD: 0,
        USDT: 0,
      };

      last24Volume.forEach(
        (item) => {
          if (
            Object.prototype.hasOwnProperty.call(
              volume24,
              item._id
            )
          ) {
            volume24[
              item._id
            ] =
              Number(
                item.totalAmount ||
                  0
              );
          }
        }
      );

      // ==================================================
      // FRONTEND-FRIENDLY STATISTICS
      // ==================================================

      const totalDeposits =
        Number(
          transactionSummary
            ?.DEPOSIT_APPROVED
            ?.count ||
            transactionSummary
              ?.DEPOSIT_REQUEST
              ?.count ||
            0
        );

      const totalWithdraws =
        Number(
          transactionSummary
            ?.WITHDRAW_APPROVED
            ?.count ||
            transactionSummary
              ?.WITHDRAW_REQUEST
              ?.count ||
            0
        );

      const totalCredits =
        await Transaction.countDocuments({
          transactionMode:
            "CREDIT",
        });

      const totalDebits =
        await Transaction.countDocuments({
          transactionMode:
            "DEBIT",
        });

      const statistics = {
        totalTransactions,

        totalDeposits,

        totalWithdraws,

        totalCredits,

        totalDebits,

        totalPKR:
          Number(
            walletSummary.PKR
              .amount || 0
          ),

        totalGold:
          Number(
            walletSummary.GOLD
              .amount || 0
          ),

        totalUSDT:
          Number(
            walletSummary.USDT
              .amount || 0
          ),
      };

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        statistics,

        overview: {
          totalTransactions,

          completedTransactions,

          pendingTransactions,

          rejectedTransactions,

          failedTransactions,

          last24Hours,
        },

        walletSummary,

        transactionSummary,

        last24Volume: volume24,
      });
    } catch (error) {
      console.error(
        "TRANSACTION STATS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load transaction statistics.",

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
// ADMIN RECENT TRANSACTIONS
// GET /api/transactions/admin/recent
// ======================================================

router.get(
  "/admin/recent",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const transactions =
        await Transaction.find()
          .sort({
            createdAt: -1,
          })
          .limit(20)
          .lean();

      return res.status(200).json({
        success: true,

        transactions,

        total:
          transactions.length,
      });
    } catch (error) {
      console.error(
        "RECENT TRANSACTIONS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load recent transactions.",

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
// TRANSACTION HEALTH CHECK
// GET /api/transactions/health
// ======================================================

router.get(
  "/health",
  (req, res) => {
    return res.status(200).json({
      success: true,

      module:
        "Transaction Audit Manager",

      version:
        "GoldTrade V18 Enterprise",

      status:
        "Working",

      timestamp:
        new Date().toISOString(),

      routes: [
        "/api/transactions/history/:username",

        "/api/transactions/details/:id",

        "/api/transactions/admin",

        "/api/transactions/admin/user/:username",

        "/api/transactions/admin/stats",

        "/api/transactions/admin/recent",

        "/api/transactions/health",
      ],
    });
  }
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;