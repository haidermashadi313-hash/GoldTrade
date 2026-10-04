"use strict";

// ======================================================
// GoldTrade V18 - User Routes
// ======================================================

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

// ======================================================
// MIDDLEWARE
// ======================================================

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

// ======================================================
// HELPERS
// ======================================================

// ------------------------------------------------------
// NORMALIZE USERNAME
// ------------------------------------------------------

const normalizeUsername = (value) => {
  return String(value ?? "")
    .trim()
    .toLowerCase();
};

// ------------------------------------------------------
// SAFE NUMBER
// ------------------------------------------------------

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

// ------------------------------------------------------
// VALIDATE OBJECT ID
// ------------------------------------------------------

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ------------------------------------------------------
// SAFE USER SELECT
// ------------------------------------------------------

const safeUserQuery = (query) => {
  return query
    .select(
      "-password -sessions -loginHistory"
    );
};

// ------------------------------------------------------
// GET OR CREATE WALLET
// ------------------------------------------------------

const getOrCreateUserWallet = async (
  user
) => {
  if (!user?._id) {
    throw new Error(
      "Valid user is required."
    );
  }

  let wallet =
    await Wallet.findOne({
      userId: user._id,
    });

  if (!wallet) {
    wallet = await Wallet.create({
      userId: user._id,

      username:
        normalizeUsername(
          user.username
        ),

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
      totalWalletValue: 0,

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
// GET ALL USERS
// GET /api/users
// GET /api/admin/users
// ======================================================

router.get(
  "/",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const users =
        await User.find({})
          .select(
            "-password -sessions -loginHistory"
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      // ------------------------------------------------
      // LOAD WALLETS
      // ------------------------------------------------

      const userIds =
        users.map(
          (user) => user._id
        );

      const wallets =
        userIds.length > 0
          ? await Wallet.find({
              userId: {
                $in: userIds,
              },
            }).lean()
          : [];

      // ------------------------------------------------
      // WALLET MAP
      // ------------------------------------------------

      const walletMap =
        new Map();

      wallets.forEach(
        (wallet) => {
          walletMap.set(
            String(wallet.userId),
            wallet
          );
        }
      );

      // ------------------------------------------------
      // COMBINE USERS + WALLET
      // ------------------------------------------------

      const formattedUsers =
        users.map((user) => {
          const wallet =
            walletMap.get(
              String(user._id)
            );

          const pkrBalance =
            toNumber(
              wallet?.pkrBalance
            );

          const goldBalance =
            toNumber(
              wallet?.goldBalance
            );

          const usdtBalance =
            toNumber(
              wallet?.usdtBalance
            );

          const isFrozen =
            Boolean(
              wallet?.isFrozen
            );

          return {
            _id: user._id,

            username:
              user.username,

            email:
              user.email,

            role:
              user.role || "user",

            status:
              isFrozen ||
              !user.isActive
                ? "Frozen"
                : "Active",

            isActive:
              Boolean(
                user.isActive
              ),

            isFrozen,

            isVerified:
              Boolean(
                wallet?.isVerified
              ),

            wallet: {
              pkr:
                pkrBalance,

              gold:
                goldBalance,

              usdt:
                usdtBalance,
            },

            pkrBalance,
            goldBalance,
            usdtBalance,

            createdAt:
              user.createdAt,

            updatedAt:
              user.updatedAt,
          };
        });

      return res.status(200).json({
        success: true,

        totalUsers:
          formattedUsers.length,

        users:
          formattedUsers,
      });
    } catch (err) {
      console.error(
        "GET USERS ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch users.",
      });
    }
  }
);

// ======================================================
// GET USER STATISTICS
// GET /api/users/statistics
// GET /api/admin/users/statistics
// ======================================================

router.get(
  "/statistics",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const [
        totalUsers,
        activeUsers,
        frozenUsers,
        wallets,
      ] = await Promise.all([
        User.countDocuments({}),

        User.countDocuments({
          isActive: true,
        }),

        User.countDocuments({
          isActive: false,
        }),

        Wallet.find({})
          .select(
            "pkrBalance goldBalance usdtBalance isFrozen"
          )
          .lean(),
      ]);

      // ------------------------------------------------
      // TOTAL WALLET VALUES
      // ------------------------------------------------

      let totalPKR = 0;
      let totalGold = 0;
      let totalUSDT = 0;

      wallets.forEach(
        (wallet) => {
          totalPKR += toNumber(
            wallet.pkrBalance
          );

          totalGold += toNumber(
            wallet.goldBalance
          );

          totalUSDT += toNumber(
            wallet.usdtBalance
          );
        }
      );

      return res.status(200).json({
        success: true,

        statistics: {
          totalUsers,

          activeUsers,

          frozenUsers,

          totalPKR,

          totalGold,

          totalUSDT,
        },
      });
    } catch (err) {
      console.error(
        "GET USER STATISTICS ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch user statistics.",
      });
    }
  }
);

// ======================================================
// USER TRANSACTION HISTORY
// GET /api/users/:username/history
// ======================================================

router.get(
  "/:username/history",
  verifyToken,
  async (req, res) => {
    try {
      const username =
        normalizeUsername(
          req.params.username
        );

      if (!username) {
        return res.status(400).json({
          success: false,
          message:
            "Username is required.",
        });
      }

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

      // ------------------------------------------------
      // USER ACCESS CONTROL
      // ------------------------------------------------

      const requesterRole =
        String(
          req.user?.role ?? ""
        )
          .trim()
          .toLowerCase();

      const requesterId =
        req.user?.id ||
        req.user?._id;

      const requesterUsername =
        normalizeUsername(
          req.user?.username
        );

      const isAdminUser =
        requesterRole ===
        "admin";

      const isOwnUser =
        (
          requesterId &&
          String(
            requesterId
          ) ===
            String(user._id)
        ) ||
        (
          requesterUsername &&
          requesterUsername ===
            username
        );

      if (
        !isAdminUser &&
        !isOwnUser
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      // ------------------------------------------------
      // HISTORY
      // ------------------------------------------------

      const history =
        await Transaction.find({
          userId: user._id,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,

        user: {
          _id: user._id,
          username:
            user.username,
          email:
            user.email,
          role:
            user.role,
        },

        total:
          history.length,

        history,
      });
    } catch (err) {
      console.error(
        "USER HISTORY ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load user history.",
      });
    }
  }
);

// ======================================================
// HEALTH CHECK
// GET /api/users/health
// ======================================================

router.get(
  "/health",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "User Routes Working - GoldTrade V18",
      version: "V18",
    });
  }
);
// ======================================================
// ADMIN UPDATE USER WALLET
// POST /api/admin/users/:id/wallet
// PUT  /api/admin/users/:id/wallet
// ======================================================

const updateUserWalletHandler = async (
  req,
  res
) => {
  try {
    // ------------------------------------------------
    // VALIDATE USER ID
    // ------------------------------------------------

    const userId = req.params.id;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID.",
      });
    }

    // ------------------------------------------------
    // REQUEST DATA
    // ------------------------------------------------

    const {
      pkr,
      gold,
      usdt,
      walletType,
      action,
      amount,
      reason,
    } = req.body || {};

    // ------------------------------------------------
    // FIND USER
    // ------------------------------------------------

    const user =
      await User.findById(userId)
        .select(
          "_id username email role isActive"
        );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    // ------------------------------------------------
    // GET / CREATE WALLET
    // ------------------------------------------------

    const wallet =
      await getOrCreateUserWallet(
        user
      );

    // ------------------------------------------------
    // MODE 1
    // FULL BALANCE UPDATE
    //
    // Used by:
    // POST /api/admin/users/:id/wallet
    // ------------------------------------------------

    const hasDirectBalanceUpdate =
      pkr !== undefined ||
      gold !== undefined ||
      usdt !== undefined;

    if (hasDirectBalanceUpdate) {
      const newPkr =
        Number(
          pkr ??
            wallet.pkrBalance ??
            0
        );

      const newGold =
        Number(
          gold ??
            wallet.goldBalance ??
            0
        );

      const newUsdt =
        Number(
          usdt ??
            wallet.usdtBalance ??
            0
        );

      // ------------------------------------------------
      // VALIDATE NUMBERS
      // ------------------------------------------------

      if (
        !Number.isFinite(newPkr) ||
        !Number.isFinite(newGold) ||
        !Number.isFinite(newUsdt)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Wallet balances must be valid numbers.",
        });
      }

      // ------------------------------------------------
      // NEGATIVE BALANCE PROTECTION
      // ------------------------------------------------

      if (
        newPkr < 0 ||
        newGold < 0 ||
        newUsdt < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Wallet balances cannot be negative.",
        });
      }

      // ------------------------------------------------
      // FROZEN WALLET
      // ------------------------------------------------

      if (wallet.isFrozen) {
        return res.status(403).json({
          success: false,
          message:
            "Wallet is frozen.",
        });
      }

      // ------------------------------------------------
      // UPDATE BALANCES
      // ------------------------------------------------

      wallet.pkrBalance =
        newPkr;

      wallet.goldBalance =
        newGold;

      wallet.usdtBalance =
        newUsdt;

      await wallet.save();

      return res.status(200).json({
        success: true,

        message:
          "Wallet updated successfully.",

        wallet: {
          _id: wallet._id,
          userId: wallet.userId,
          username:
            wallet.username ||
            user.username,

          pkrBalance:
            toNumber(
              wallet.pkrBalance
            ),

          goldBalance:
            toNumber(
              wallet.goldBalance
            ),

          usdtBalance:
            toNumber(
              wallet.usdtBalance
            ),

          lockedPkr:
            toNumber(
              wallet.lockedPkr
            ),

          lockedGold:
            toNumber(
              wallet.lockedGold
            ),

          lockedUsdt:
            toNumber(
              wallet.lockedUsdt
            ),

          isFrozen:
            Boolean(
              wallet.isFrozen
            ),

          status:
            wallet.status ||
            "Active",

          updatedAt:
            wallet.updatedAt,
        },
      });
    }

    // ------------------------------------------------
    // MODE 2
    // ADD / DEDUCT SINGLE WALLET
    // ------------------------------------------------

    const normalizedWalletType =
      String(
        walletType ?? ""
      )
        .trim()
        .toUpperCase();

    const normalizedAction =
      String(
        action ?? ""
      )
        .trim()
        .toLowerCase();

    if (
      !["PKR", "GOLD", "USDT"].includes(
        normalizedWalletType
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid wallet type. Use PKR, GOLD or USDT.",
      });
    }

    if (
      !["add", "deduct"].includes(
        normalizedAction
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid action. Use add or deduct.",
      });
    }

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid amount.",
      });
    }

    if (wallet.isFrozen) {
      return res.status(403).json({
        success: false,
        message:
          "Wallet is frozen.",
      });
    }

    // ------------------------------------------------
    // SELECT BALANCE FIELD
    // ------------------------------------------------

    let balanceField;

    if (
      normalizedWalletType ===
      "PKR"
    ) {
      balanceField =
        "pkrBalance";
    } else if (
      normalizedWalletType ===
      "GOLD"
    ) {
      balanceField =
        "goldBalance";
    } else {
      balanceField =
        "usdtBalance";
    }

    const balanceBefore =
      toNumber(
        wallet[balanceField]
      );

    // ------------------------------------------------
    // ADD
    // ------------------------------------------------

    if (
      normalizedAction ===
      "add"
    ) {
      wallet[balanceField] =
        balanceBefore +
        numericAmount;
    }

    // ------------------------------------------------
    // DEDUCT
    // ------------------------------------------------

    if (
      normalizedAction ===
      "deduct"
    ) {
      if (
        balanceBefore <
        numericAmount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Insufficient balance.",
        });
      }

      wallet[balanceField] =
        balanceBefore -
        numericAmount;
    }

    // ------------------------------------------------
    // SAVE WALLET
    // ------------------------------------------------

    await wallet.save();

    // ------------------------------------------------
    // TRANSACTION HISTORY
    // ------------------------------------------------

    try {
      await Transaction.create({
        userId: user._id,

        username:
          user.username,

        walletType:
          normalizedWalletType,

        type:
          normalizedAction ===
          "add"
            ? "CREDIT"
            : "DEBIT",

        amount:
          numericAmount,

        balanceBefore,

        balanceAfter:
          toNumber(
            wallet[balanceField]
          ),

        status:
          "COMPLETED",

        note:
          String(
            reason ??
              "Admin Wallet Update"
          ).trim(),
      });
    } catch (transactionError) {
      console.error(
        "WALLET TRANSACTION LOG ERROR:",
        transactionError
      );
    }

    // ------------------------------------------------
    // RESPONSE
    // ------------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Wallet updated successfully.",

      wallet: {
        _id: wallet._id,

        userId:
          wallet.userId,

        username:
          wallet.username ||
          user.username,

        pkrBalance:
          toNumber(
            wallet.pkrBalance
          ),

        goldBalance:
          toNumber(
            wallet.goldBalance
          ),

        usdtBalance:
          toNumber(
            wallet.usdtBalance
          ),

        lockedPkr:
          toNumber(
            wallet.lockedPkr
          ),

        lockedGold:
          toNumber(
            wallet.lockedGold
          ),

        lockedUsdt:
          toNumber(
            wallet.lockedUsdt
          ),

        status:
          wallet.status ||
          "Active",

        isFrozen:
          Boolean(
            wallet.isFrozen
          ),

        updatedAt:
          wallet.updatedAt,
      },
    });
  } catch (err) {
    console.error(
      "UPDATE USER WALLET ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update user wallet.",
      error:
        process.env.NODE_ENV ===
        "production"
          ? undefined
          : err.message,
    });
  }
};

// ======================================================
// REGISTER WALLET UPDATE ROUTES
// ======================================================

router.post(
  "/:id/wallet",
  verifyToken,
  isAdmin,
  updateUserWalletHandler
);

router.put(
  "/:id/wallet",
  verifyToken,
  isAdmin,
  updateUserWalletHandler
);

// ======================================================
// BLOCK / UNBLOCK USER
// POST /api/admin/users/:id/status
// PUT  /api/admin/users/:id/status
// ======================================================

const updateUserStatusHandler = async (
  req,
  res
) => {
  try {
    const userId =
      req.params.id;

    if (
      !isValidObjectId(userId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID.",
      });
    }

    const requestedStatus =
      String(
        req.body?.status ?? ""
      )
        .trim()
        .toLowerCase();

    let isActive;

    // ------------------------------------------------
    // ACTIVE
    // ------------------------------------------------

    if (
      requestedStatus ===
      "active"
    ) {
      isActive = true;
    }

    // ------------------------------------------------
    // FROZEN / SUSPENDED / BLOCKED / INACTIVE
    // ------------------------------------------------

    else if (
      [
        "frozen",
        "suspended",
        "blocked",
        "inactive",
      ].includes(
        requestedStatus
      )
    ) {
      isActive = false;
    }

    else {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Use Active or Frozen.",
      });
    }

    // ------------------------------------------------
    // UPDATE USER
    // ------------------------------------------------

    const user =
      await User.findByIdAndUpdate(
        userId,
        {
          isActive,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select(
        "-password -sessions -loginHistory"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    // ------------------------------------------------
    // UPDATE WALLET STATUS
    // ------------------------------------------------

    const wallet =
      await Wallet.findOneAndUpdate(
        {
          userId:
            user._id,
        },
        {
          isFrozen:
            !isActive,

          status:
            isActive
              ? "Active"
              : "Frozen",
        },
        {
          new: true,
        }
      ).lean();

    return res.status(200).json({
      success: true,

      message:
        `User ${
          isActive
            ? "activated"
            : "frozen"
        } successfully.`,

      user: {
        _id:
          user._id,

        username:
          user.username,

        email:
          user.email,

        role:
          user.role,

        isActive:
          Boolean(
            user.isActive
          ),

        status:
          isActive
            ? "Active"
            : "Frozen",
      },

      wallet: wallet
        ? {
            isFrozen:
              Boolean(
                wallet.isFrozen
              ),

            status:
              wallet.status ||
              "Active",
          }
        : null,
    });
  } catch (err) {
    console.error(
      "UPDATE USER STATUS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update user status.",
      error:
        process.env.NODE_ENV ===
        "production"
          ? undefined
          : err.message,
    });
  }
};

router.post(
  "/:id/status",
  verifyToken,
  isAdmin,
  updateUserStatusHandler
);

router.put(
  "/:id/status",
  verifyToken,
  isAdmin,
  updateUserStatusHandler
);

// ======================================================
// CHANGE USER ROLE
// POST /api/admin/users/:id/role
// PUT  /api/admin/users/:id/role
// ======================================================

const updateUserRoleHandler = async (
  req,
  res
) => {
  try {
    const userId =
      req.params.id;

    if (
      !isValidObjectId(userId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID.",
      });
    }

    const requestedRole =
      String(
        req.body?.role ?? ""
      )
        .trim()
        .toLowerCase();

    if (
      !["user", "admin"].includes(
        requestedRole
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Use user or admin.",
      });
    }

    // ------------------------------------------------
    // PREVENT ADMIN FROM DEMOTING SELF
    // ------------------------------------------------

    const currentAdminId =
      req.user?.id ||
      req.user?._id;

    if (
      currentAdminId &&
      String(
        currentAdminId
      ) === String(userId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own admin role.",
      });
    }

    const user =
      await User.findByIdAndUpdate(
        userId,
        {
          role:
            requestedRole,
        },
        {
          new: true,
          runValidators: true,
        }
      ).select(
        "-password -sessions -loginHistory"
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    return res.status(200).json({
      success: true,

      message:
        `User role updated to ${requestedRole}.`,

      user,
    });
  } catch (err) {
    console.error(
      "UPDATE USER ROLE ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update user role.",
      error:
        process.env.NODE_ENV ===
        "production"
          ? undefined
          : err.message,
    });
  }
};

router.post(
  "/:id/role",
  verifyToken,
  isAdmin,
  updateUserRoleHandler
);

router.put(
  "/:id/role",
  verifyToken,
  isAdmin,
  updateUserRoleHandler
);

// ======================================================
// DELETE USER
// DELETE /api/admin/users/:id
// DELETE /api/users/:id
// ======================================================

router.delete(
  "/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const userId =
        req.params.id;

      if (
        !isValidObjectId(userId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID.",
        });
      }

      const user =
        await User.findById(
          userId
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ------------------------------------------------
      // PREVENT SELF DELETE
      // ------------------------------------------------

      const currentAdminId =
        req.user?.id ||
        req.user?._id;

      if (
        currentAdminId &&
        String(
          currentAdminId
        ) === String(user._id)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot delete your own account.",
        });
      }

      // ------------------------------------------------
      // PREVENT ADMIN ACCOUNT DELETE
      // ------------------------------------------------

      if (
        String(
          user.role ?? ""
        ).toLowerCase() ===
        "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin account cannot be deleted from this module.",
        });
      }

      // ------------------------------------------------
      // DELETE WALLET
      // ------------------------------------------------

      await Wallet.deleteOne({
        userId:
          user._id,
      });

      // ------------------------------------------------
      // DELETE USER
      // ------------------------------------------------

      await User.deleteOne({
        _id:
          user._id,
      });

      return res.status(200).json({
        success: true,
        message:
          "User deleted successfully.",
      });
    } catch (err) {
      console.error(
        "DELETE USER ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete user.",
        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : err.message,
      });
    }
  }
);

// ======================================================
// GET USER BY USERNAME
// GET /api/users/:username
// ======================================================

router.get(
  "/:username",
  verifyToken,
  async (req, res) => {
    try {
      const username =
        normalizeUsername(
          req.params.username
        );

      if (!username) {
        return res.status(400).json({
          success: false,
          message:
            "Username is required.",
        });
      }

      const user =
        await User.findOne({
          username,
        })
          .select(
            "-password -sessions -loginHistory"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      // ------------------------------------------------
      // ACCESS CONTROL
      // ------------------------------------------------

      const requesterRole =
        String(
          req.user?.role ?? ""
        )
          .trim()
          .toLowerCase();

      const requesterId =
        req.user?.id ||
        req.user?._id;

      const requesterUsername =
        normalizeUsername(
          req.user?.username
        );

      const isAdminUser =
        requesterRole ===
        "admin";

      const isOwnUser =
        (
          requesterId &&
          String(
            requesterId
          ) ===
            String(user._id)
        ) ||
        (
          requesterUsername &&
          requesterUsername ===
            username
        );

      if (
        !isAdminUser &&
        !isOwnUser
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Access denied.",
        });
      }

      // ------------------------------------------------
      // WALLET
      // ------------------------------------------------

      const wallet =
        await Wallet.findOne({
          userId:
            user._id,
        }).lean();

      return res.status(200).json({
        success: true,

        user: {
          _id:
            user._id,

          username:
            user.username,

          email:
            user.email,

          role:
            user.role,

          fullName:
            user.fullName || "",

          phone:
            user.phone || "",

          country:
            user.country || "",

          isActive:
            Boolean(
              user.isActive
            ),

          status:
            wallet?.isFrozen ||
            !user.isActive
              ? "Frozen"
              : "Active",

          createdAt:
            user.createdAt,

          updatedAt:
            user.updatedAt,
        },

        wallet: wallet
          ? {
              pkrBalance:
                toNumber(
                  wallet.pkrBalance
                ),

              goldBalance:
                toNumber(
                  wallet.goldBalance
                ),

              usdtBalance:
                toNumber(
                  wallet.usdtBalance
                ),

              lockedPkr:
                toNumber(
                  wallet.lockedPkr
                ),

              lockedGold:
                toNumber(
                  wallet.lockedGold
                ),

              lockedUsdt:
                toNumber(
                  wallet.lockedUsdt
                ),

              isFrozen:
                Boolean(
                  wallet.isFrozen
                ),

              status:
                wallet.status ||
                "Active",

              updatedAt:
                wallet.updatedAt,
            }
          : null,
      });
    } catch (err) {
      console.error(
        "GET USER ERROR:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load user.",
        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : err.message,
      });
    }
  }
);

// ======================================================
// FINAL EXPORT
// ======================================================

module.exports = router;