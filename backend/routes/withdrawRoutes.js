"use strict";

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const Withdraw = require("../models/Withdraw");
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const WalletHistory = require("../models/WalletHistory");
const Transaction = require("../models/Transaction");
const Settings = require("../models/Settings");

// ======================================================
// AUTH MIDDLEWARE
// ======================================================

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

// ======================================================
// WITHDRAW HELPER FUNCTIONS
// ======================================================

const cleanString = (value) => {
  return String(value ?? "").trim();
};

const toSafeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }
  }

  return fallback;
};

const normalizeWalletType = (value) => {
  return cleanString(value).toUpperCase();
};

const normalizeWithdrawStatus = (value) => {
  return cleanString(value).toUpperCase();
};

const formatWithdrawSettings = (settings = {}) => {
  return {
    withdrawalsEnabled: settings.withdrawalsEnabled !== false,

    minimumWithdrawPKR: toSafeNumber(
      settings.minimumWithdrawPKR,
      1
    ),

    maximumWithdrawPKR: toSafeNumber(
      settings.maximumWithdrawPKR,
      10000000
    ),

    minimumWithdrawUSDT: toSafeNumber(
      settings.minimumWithdrawUSDT,
      1
    ),

    maximumWithdrawUSDT: toSafeNumber(
      settings.maximumWithdrawUSDT,
      1000000
    ),

    minimumWithdrawGOLD: toSafeNumber(
      settings.minimumWithdrawGOLD,
      0.01
    ),

    maximumWithdrawGOLD: toSafeNumber(
      settings.maximumWithdrawGOLD,
      10000
    ),

    withdrawPaymentMethods: Array.isArray(
      settings.withdrawPaymentMethods
    )
      ? settings.withdrawPaymentMethods
      : [
          "PKR Bank",
          "ABA Bank",
          "Binance USDT",
          "Cash App",
        ],
  };
};

const getWithdrawSettings = async () => {
  const settings = await Settings.findOne({}).lean();

  return formatWithdrawSettings(settings || {});
};

const validateWithdrawAmount = ({
  walletType,
  amount,
  settings,
}) => {
  const normalizedWalletType =
    normalizeWalletType(walletType);

  const withdrawAmount = Number(amount);

  if (
    !Number.isFinite(withdrawAmount) ||
    withdrawAmount <= 0
  ) {
    return {
      valid: false,
      message:
        "Withdrawal amount must be greater than zero.",
    };
  }

  const normalizedSettings =
    formatWithdrawSettings(settings || {});

  let minimum = 0;
  let maximum = Infinity;

  switch (normalizedWalletType) {
    case "PKR":
      minimum =
        normalizedSettings.minimumWithdrawPKR;

      maximum =
        normalizedSettings.maximumWithdrawPKR;

      break;

    case "USDT":
      minimum =
        normalizedSettings.minimumWithdrawUSDT;

      maximum =
        normalizedSettings.maximumWithdrawUSDT;

      break;

    case "GOLD":
      minimum =
        normalizedSettings.minimumWithdrawGOLD;

      maximum =
        normalizedSettings.maximumWithdrawGOLD;

      break;

    default:
      return {
        valid: false,
        message: "Invalid wallet type.",
      };
  }

  if (withdrawAmount < minimum) {
    return {
      valid: false,
      message: `Minimum ${normalizedWalletType} withdrawal is ${minimum}.`,
    };
  }

  if (withdrawAmount > maximum) {
    return {
      valid: false,
      message: `Maximum ${normalizedWalletType} withdrawal is ${maximum}.`,
    };
  }

  return {
    valid: true,
    minimum,
    maximum,
  };
};

const getWallet = async ({
  userId,
  username,
  session = null,
}) => {
  const conditions = [];

  const safeUserId = cleanString(userId);
  const safeUsername =
    cleanString(username).toLowerCase();

  if (safeUserId) {
    conditions.push({
      userId: safeUserId,
    });

    if (
      mongoose.Types.ObjectId.isValid(safeUserId)
    ) {
      conditions.push({
        userId: new mongoose.Types.ObjectId(
          safeUserId
        ),
      });
    }
  }

  if (safeUsername) {
    conditions.push({
      username: safeUsername,
    });

    conditions.push({
      username: cleanString(username),
    });
  }

  if (conditions.length === 0) {
    return null;
  }

  let query = Wallet.findOne({
    $or: conditions,
  });

  if (session) {
    query = query.session(session);
  }

  return query;
};

const getWalletBalance = (
  wallet,
  walletType
) => {
  const type =
    normalizeWalletType(walletType);

  switch (type) {
    case "PKR":
      return toSafeNumber(
        wallet?.pkrBalance ??
          wallet?.balance ??
          0
      );

    case "USDT":
      return toSafeNumber(
        wallet?.usdtBalance
      );

    case "GOLD":
      return toSafeNumber(
        wallet?.goldBalance
      );

    default:
      return 0;
  }
};

const getLockedBalance = (
  wallet,
  walletType
) => {
  const type =
    normalizeWalletType(walletType);

  switch (type) {
    case "PKR":
      return toSafeNumber(
        wallet?.lockedPkr
      );

    case "USDT":
      return toSafeNumber(
        wallet?.lockedUsdt
      );

    case "GOLD":
      return toSafeNumber(
        wallet?.lockedGold
      );

    default:
      return 0;
  }
};

const getAvailableBalance = (
  wallet,
  walletType
) => {
  const balance = getWalletBalance(
    wallet,
    walletType
  );

  const locked = getLockedBalance(
    wallet,
    walletType
  );

  return Math.max(
    0,
    balance - locked
  );
};

const setLockedBalance = (
  wallet,
  walletType,
  value
) => {
  const type =
    normalizeWalletType(walletType);

  const safeValue = Math.max(
    0,
    toSafeNumber(value)
  );

  switch (type) {
    case "PKR":
      wallet.lockedPkr = safeValue;
      break;

    case "USDT":
      wallet.lockedUsdt = safeValue;
      break;

    case "GOLD":
      wallet.lockedGold = safeValue;
      break;

    default:
      throw new Error(
        `Invalid wallet type: ${type}`
      );
  }

  return wallet;
};

// ======================================================
// GET WITHDRAW SETTINGS
// ======================================================

router.get(
  "/settings",
  verifyToken,
  async (req, res) => {
    try {
      const settings =
        await Settings.findOne({}).lean();

      const withdrawSettings = {
        withdrawalsEnabled:
          settings?.withdrawalsEnabled !== false,

        minimumWithdrawPKR:
          Number(
            settings?.minimumWithdrawPKR ?? 1
          ),

        maximumWithdrawPKR:
          Number(
            settings?.maximumWithdrawPKR ??
              10000000
          ),

        minimumWithdrawUSDT:
          Number(
            settings?.minimumWithdrawUSDT ?? 1
          ),

        maximumWithdrawUSDT:
          Number(
            settings?.maximumWithdrawUSDT ??
              1000000
          ),

        minimumWithdrawGOLD:
          Number(
            settings?.minimumWithdrawGOLD ??
              0.01
          ),

        maximumWithdrawGOLD:
          Number(
            settings?.maximumWithdrawGOLD ??
              10000
          ),

        withdrawPaymentMethods:
          Array.isArray(
            settings?.withdrawPaymentMethods
          )
            ? settings.withdrawPaymentMethods
            : [
                "PKR Bank",
                "ABA Bank",
                "Binance USDT",
                "Cash App",
              ],
      };

      return res.status(200).json({
        success: true,
        settings: withdrawSettings,
      });
    } catch (error) {
      console.error(
        "GET /withdraw/settings error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load withdrawal settings.",
      });
    }
  }
);

// ======================================================
// UPDATE WITHDRAW SETTINGS
// ======================================================

router.patch(
  "/settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const body = req.body || {};

      const update = {};

      if (
        body.withdrawalsEnabled !==
        undefined
      ) {
        update.withdrawalsEnabled =
          toBoolean(
            body.withdrawalsEnabled
          );
      }

      if (
        body.minimumWithdrawPKR !==
        undefined
      ) {
        update.minimumWithdrawPKR =
          toSafeNumber(
            body.minimumWithdrawPKR
          );
      }

      if (
        body.maximumWithdrawPKR !==
        undefined
      ) {
        update.maximumWithdrawPKR =
          toSafeNumber(
            body.maximumWithdrawPKR
          );
      }

      if (
        body.minimumWithdrawUSDT !==
        undefined
      ) {
        update.minimumWithdrawUSDT =
          toSafeNumber(
            body.minimumWithdrawUSDT
          );
      }

      if (
        body.maximumWithdrawUSDT !==
        undefined
      ) {
        update.maximumWithdrawUSDT =
          toSafeNumber(
            body.maximumWithdrawUSDT
          );
      }

      if (
        body.minimumWithdrawGOLD !==
        undefined
      ) {
        update.minimumWithdrawGOLD =
          toSafeNumber(
            body.minimumWithdrawGOLD
          );
      }

      if (
        body.maximumWithdrawGOLD !==
        undefined
      ) {
        update.maximumWithdrawGOLD =
          toSafeNumber(
            body.maximumWithdrawGOLD
          );
      }

      if (
        body.withdrawPaymentMethods !==
        undefined
      ) {
        update.withdrawPaymentMethods =
          Array.isArray(
            body.withdrawPaymentMethods
          )
            ? body.withdrawPaymentMethods
            : [];
      }

      const settings =
        await Settings.findOneAndUpdate(
          {},
          {
            $set: update,
          },
          {
            new: true,
            upsert: true,
          }
        ).lean();

      return res.status(200).json({
        success: true,
        message:
          "Withdrawal settings updated successfully.",
        settings:
          formatWithdrawSettings(
            settings
          ),
      });
    } catch (error) {
      console.error(
        "PATCH /withdraw/settings error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to update withdrawal settings.",
      });
    }
  }
);
// ======================================================

router.post(
  "/create",
  verifyToken,
  async (req, res) => {
    try {
      const body = req.body || {};

      const {
        amount,
        walletType,
        paymentMethod,
        method,
        accountName,
        accountNumber,
        iban,
        walletAddress,
        network,
        note,
      } = body;

      // ==================================================
      // AUTH USER
      // ==================================================

      const userId = String(
        req.user?.id ||
          req.user?._id ||
          ""
      ).trim();

      const username = String(
        req.user?.username ||
          body.username ||
          ""
      ).trim();

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user ID is missing.",
        });
      }

      // ==================================================
      // NORMALIZE WALLET TYPE
      // ==================================================

      /*
       * Current wallet frontend may submit only
       * amount + method + walletAddress.
       *
       * Therefore PKR is used as the default wallet
       * type when walletType is not provided.
       */

      const normalizedWalletType = String(
        walletType || "PKR"
      )
        .trim()
        .toUpperCase();

      // ==================================================
      // NORMALIZE PAYMENT METHOD
      // ==================================================

      const normalizedPaymentMethod = String(
        paymentMethod ||
          method ||
          ""
      ).trim();

      // ==================================================
      // NORMALIZE AMOUNT
      // ==================================================

      const withdrawAmount =
        Number(amount);

      // ==================================================
      // WALLET TYPE VALIDATION
      // ==================================================

      if (
        ![
          "PKR",
          "USDT",
          "GOLD",
        ].includes(
          normalizedWalletType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid wallet type. Allowed: PKR, USDT, GOLD.",
        });
      }

      // ==================================================
      // AMOUNT VALIDATION
      // ==================================================

      if (
        !Number.isFinite(
          withdrawAmount
        ) ||
        withdrawAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Withdrawal amount must be greater than zero.",
        });
      }

      // ==================================================
      // WITHDRAW SETTINGS
      // ==================================================

      const settings =
        await getWithdrawSettings();

      if (
        settings.withdrawalsEnabled !==
        true
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Withdrawals are currently disabled.",
        });
      }

      // ==================================================
      // WITHDRAW LIMIT VALIDATION
      // ==================================================

      const amountValidation =
        validateWithdrawAmount({
          walletType:
            normalizedWalletType,

          amount:
            withdrawAmount,

          settings,
        });

      if (
        !amountValidation.valid
      ) {
        return res.status(400).json({
          success: false,
          message:
            amountValidation.message,
        });
      }

      // ==================================================
      // PAYMENT METHOD VALIDATION
      // ==================================================

      if (
        !normalizedPaymentMethod
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Payment method is required.",
        });
      }

      // ==================================================
      // BASIC PAYMENT INFORMATION
      // ==================================================

      const cleanedAccountName =
        String(
          accountName ||
            username ||
            ""
        ).trim();

      const cleanedWalletAddress =
        String(
          walletAddress ||
            ""
        ).trim();

      /*
       * For PKR withdrawals the current frontend
       * sends walletAddress. Use it as accountNumber
       * when an explicit accountNumber is not supplied.
       */

      const cleanedAccountNumber =
        String(
          accountNumber ||
            (
              normalizedWalletType ===
              "PKR"
                ? cleanedWalletAddress
                : ""
            ) ||
            ""
        ).trim();

      const cleanedIban =
        String(
          iban || ""
        ).trim();

      const cleanedNetwork =
        String(
          network || ""
        ).trim();

      const cleanedNote =
        String(
          note || ""
        ).trim();

      // ==================================================
      // PAYMENT METHOD SPECIFIC VALIDATION
      // ==================================================

      // --------------------------------------------------
      // PKR WITHDRAWAL
      // --------------------------------------------------

      if (
        normalizedWalletType ===
        "PKR"
      ) {
        if (
          !cleanedAccountName
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Account name is required for PKR withdrawal.",
          });
        }

        if (
          !cleanedAccountNumber &&
          !cleanedIban &&
          !cleanedWalletAddress
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Account number or IBAN is required for PKR withdrawal.",
          });
        }
      }

      // --------------------------------------------------
      // USDT WITHDRAWAL
      // --------------------------------------------------

      if (
        normalizedWalletType ===
        "USDT"
      ) {
        if (
          !cleanedWalletAddress
        ) {
          return res.status(400).json({
            success: false,
            message:
              "USDT wallet address is required.",
          });
        }

        if (
          !cleanedNetwork
        ) {
          return res.status(400).json({
            success: false,
            message:
              "USDT network is required.",
          });
        }
      }

      // ==================================================
      // FIND USER WALLET
      // ==================================================

      const wallet =
        await getWallet({
          userId,
          username,
        });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message:
            "Wallet not found.",
        });
      }

      // ==================================================
      // WALLET STATUS CHECK
      // ==================================================

      if (
        wallet.isFrozen === true
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your wallet is currently frozen. Withdrawal is not allowed.",
        });
      }

      if (
        String(
          wallet.status || ""
        ).toLowerCase() ===
        "frozen"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your wallet is currently frozen. Withdrawal is not allowed.",
        });
      }

      // ==================================================
      // AVAILABLE BALANCE
      // ==================================================

      const currentBalance =
        getWalletBalance(
          wallet,
          normalizedWalletType
        );

      const lockedBalance =
        getLockedBalance(
          wallet,
          normalizedWalletType
        );

      const availableBalance =
        getAvailableBalance(
          wallet,
          normalizedWalletType
        );

      // ==================================================
      // BALANCE CHECK
      // ==================================================

      if (
        withdrawAmount >
        availableBalance
      ) {
        return res.status(400).json({
          success: false,

          message:
            `Insufficient available ${normalizedWalletType} balance.`,

          balance: {
            current:
              currentBalance,

            locked:
              lockedBalance,

            available:
              availableBalance,

            requested:
              withdrawAmount,
          },
        });
      }

      // ==================================================
      // PREVENT DUPLICATE PENDING REQUEST
      // ==================================================

      const pendingConditions = [
        {
          userId,
          walletType:
            normalizedWalletType,

          status: {
            $in: [
              "PENDING",
              "Pending",
              "pending",
            ],
          },
        },
      ];

      if (username) {
        pendingConditions.push({
          username,
          walletType:
            normalizedWalletType,

          status: {
            $in: [
              "PENDING",
              "Pending",
              "pending",
            ],
          },
        });
      }

      const existingPending =
        await Withdraw.findOne({
          $or:
            pendingConditions,
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      if (existingPending) {
        return res.status(409).json({
          success: false,

          message:
            "You already have a pending withdrawal request for this wallet type.",

          existingWithdrawal: {
            id:
              existingPending._id,

            amount:
              existingPending.amount ||
              existingPending.requestAmount ||
              0,

            walletType:
              existingPending.walletType,

            status:
              existingPending.status,

            createdAt:
              existingPending.createdAt,
          },
        });
      }

      // ==================================================
      // REFERENCE ID
      // ==================================================

      const referenceId =
        `WDR-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase()}`;

      // ==================================================
      // SNAPSHOT BEFORE LOCK
      // ==================================================

      const walletBefore = {
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

        lockedGold:
          Number(
            wallet.lockedGold || 0
          ),
      };

      // ==================================================
      // LOCK REQUESTED AMOUNT
      // ==================================================

      const newLockedBalance =
        lockedBalance +
        withdrawAmount;

      setLockedBalance(
        wallet,
        normalizedWalletType,
        newLockedBalance
      );

      // ==================================================
      // SAVE WALLET
      // ==================================================

      await wallet.save();

      // ==================================================
      // SNAPSHOT AFTER LOCK
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

        lockedGold:
          Number(
            wallet.lockedGold || 0
          ),
      };

      // ==================================================
      // CREATE WITHDRAW REQUEST
      // ==================================================

      let withdraw;

      try {
        withdraw =
          await Withdraw.create({
            userId:
              userId,

            username:
              username,

            walletType:
              normalizedWalletType,

            amount:
              withdrawAmount,

            requestAmount:
              withdrawAmount,

            adminAmount:
              withdrawAmount,

            paymentMethod:
              normalizedPaymentMethod,

            accountName:
              cleanedAccountName,

            accountNumber:
              cleanedAccountNumber,

            iban:
              cleanedIban,

            walletAddress:
              cleanedWalletAddress,

            network:
              cleanedNetwork,

            note:
              cleanedNote,

            status:
              "PENDING",

            referenceId:
              referenceId,

            walletBefore:
              walletBefore,

            walletAfter:
              walletAfter,
          });
      } catch (createError) {
        // ==================================================
        // ROLLBACK WALLET LOCK
        // ==================================================

        setLockedBalance(
          wallet,
          normalizedWalletType,
          lockedBalance
        );

        await wallet.save();

        throw createError;
      }

      // ==================================================
      // WALLET HISTORY
      // ==================================================

      try {
        await WalletHistory.create({
          userId:
            userId,

          username:
            username,

          walletType:
            normalizedWalletType,

          type:
            "WITHDRAW",

          amount:
            withdrawAmount,

          balanceBefore:
            currentBalance,

          balanceAfter:
            currentBalance,

          referenceId:
            referenceId,

          note:
            "Withdrawal amount locked pending admin approval.",

          status:
            "PENDING",
        });
      } catch (historyError) {
        console.error(
          "WITHDRAW WALLET HISTORY ERROR:",
          historyError
        );
      }

      // ==================================================
      // TRANSACTION LEDGER
      // ==================================================

      try {
        await Transaction.create({
          userId:
            userId,

          username:
            username,

          walletType:
            normalizedWalletType,

          transactionType:
            "WITHDRAW_REQUEST",

          transactionMode:
            "HOLD",

          amount:
            withdrawAmount,

          balanceBefore:
            currentBalance,

          balanceAfter:
            currentBalance,

          referenceId:
            referenceId,

          status:
            "PENDING",

          note:
            "Withdrawal request created and amount locked.",
        });
      } catch (transactionError) {
        console.error(
          "WITHDRAW TRANSACTION ERROR:",
          transactionError
        );
      }

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(201).json({
        success: true,

        message:
          "Withdrawal request submitted successfully.",

        // ------------------------------------------------
        // WITHDRAWAL DETAILS
        // ------------------------------------------------

        withdrawal: {
          id:
            withdraw._id,

          referenceId:
            withdraw.referenceId,

          username:
            withdraw.username,

          walletType:
            withdraw.walletType,

          amount:
            withdraw.amount,

          paymentMethod:
            withdraw.paymentMethod,

          status:
            withdraw.status,

          createdAt:
            withdraw.createdAt,
        },

        // ------------------------------------------------
        // WALLET BALANCE
        // ------------------------------------------------

        wallet: {
          balance:
            currentBalance,

          locked:
            newLockedBalance,

          available:
            Math.max(
              0,
              currentBalance -
                newLockedBalance
            ),
        },
      });
    } catch (error) {
      // ==================================================
      // ERROR HANDLING
      // ==================================================

      console.error(
        "CREATE WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to create withdrawal request.",

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
// CHECK PENDING WITHDRAWAL
// ======================================================

router.get(
  "/check-pending/:walletType",
  verifyToken,
  async (req, res) => {
    try {
      const walletType =
        normalizeWalletType(
          req.params.walletType
        );

      const userId = cleanString(
        req.user?.id ||
          req.user?._id
      );

      const username = cleanString(
        req.user?.username
      );

      if (
        !["PKR", "USDT", "GOLD"].includes(
          walletType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid wallet type.",
        });
      }

      if (
        !userId &&
        !username
      ) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication information is missing.",
        });
      }

      const conditions = [];

      if (userId) {
        conditions.push({
          userId,
        });
      }

      if (username) {
        conditions.push({
          username,
        });
      }

      const pendingWithdraw =
        await Withdraw.findOne({
          $and: [
            {
              $or: conditions,
            },
            {
              walletType,
            },
            {
              status: {
                $in: [
                  "PENDING",
                  "Pending",
                  "pending",
                ],
              },
            },
          ],
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,
        pending: Boolean(
          pendingWithdraw
        ),
        withdrawal:
          pendingWithdraw || null,
      });
    } catch (error) {
      console.error(
        "CHECK PENDING WITHDRAW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to check pending withdrawal.",
      });
    }
  }
);

// ======================================================
// USER WITHDRAWAL HISTORY
// ======================================================

router.get(
  "/history",
  verifyToken,
  async (req, res) => {
    try {
      const userId = cleanString(
        req.user?.id ||
          req.user?._id
      );

      const username = cleanString(
        req.user?.username
      );

      if (
        !userId &&
        !username
      ) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication information is missing.",
        });
      }

      const page = Math.max(
        1,
        Number(
          req.query.page || 1
        )
      );

      const limit = Math.min(
        100,
        Math.max(
          1,
          Number(
            req.query.limit || 20
          )
        )
      );

      const skip =
        (page - 1) * limit;

      const walletType =
        cleanString(
          req.query.walletType
        );

      const status =
        cleanString(
          req.query.status
        );

      const conditions = [];

      if (userId) {
        conditions.push({
          userId,
        });
      }

      if (username) {
        conditions.push({
          username,
        });
      }

      const query = {
        $or: conditions,
      };

      if (walletType) {
        query.walletType =
          normalizeWalletType(
            walletType
          );
      }

      if (status) {
        query.status =
          normalizeWithdrawStatus(
            status
          );
      }

      const [
        withdrawals,
        total,
      ] = await Promise.all([
        Withdraw.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Withdraw.countDocuments(
          query
        ),
      ]);

      return res.status(200).json({
        success: true,

        withdrawals,

        history:
          withdrawals,

        pagination: {
          page,
          limit,
          total,
          totalPages:
            Math.ceil(
              total / limit
            ),
        },
      });
    } catch (error) {
      console.error(
        "GET WITHDRAW HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load withdrawal history.",
        withdrawals: [],
        history: [],
      });
    }
  }
);

// ======================================================
// WITHDRAWAL DETAILS
// ======================================================

router.get(
  "/details/:withdrawId",
  verifyToken,
  async (req, res) => {
    try {
      const withdrawId =
        cleanString(
          req.params.withdrawId
        );

      if (
        !mongoose.Types.ObjectId.isValid(
          withdrawId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal ID.",
        });
      }

      const userId = cleanString(
        req.user?.id ||
          req.user?._id
      );

      const username = cleanString(
        req.user?.username
      );

      const withdrawal =
        await Withdraw.findById(
          withdrawId
        ).lean();

      if (!withdrawal) {
        return res.status(404).json({
          success: false,
          message:
            "Withdrawal request not found.",
        });
      }

      const isOwner =
        (
          userId &&
          String(
            withdrawal.userId || ""
          ) === userId
        ) ||
        (
          username &&
          String(
            withdrawal.username ||
              ""
          ).toLowerCase() ===
            username.toLowerCase()
        );

      const isUserAdmin =
        req.user?.role ===
          "admin" ||
        req.user?.isAdmin === true;

      if (
        !isOwner &&
        !isUserAdmin
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to view this withdrawal.",
        });
      }

      return res.status(200).json({
        success: true,

        withdrawal,

        data:
          withdrawal,
      });
    } catch (error) {
      console.error(
        "GET WITHDRAW DETAILS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load withdrawal details.",
      });
    }
  }
);

// ======================================================
// USER WITHDRAWAL SUMMARY
// ======================================================

router.get(
  "/summary",
  verifyToken,
  async (req, res) => {
    try {
      const userId = cleanString(
        req.user?.id ||
          req.user?._id
      );

      const username = cleanString(
        req.user?.username
      );

      if (
        !userId &&
        !username
      ) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication information is missing.",
        });
      }

      const conditions = [];

      if (userId) {
        conditions.push({
          userId,
        });
      }

      if (username) {
        conditions.push({
          username,
        });
      }

      const query = {
        $or: conditions,
      };

      const withdrawals =
        await Withdraw.find(
          query
        ).lean();

      let totalRequests = 0;
      let pendingRequests = 0;
      let approvedRequests = 0;
      let rejectedRequests = 0;
      let cancelledRequests = 0;

      let totalAmount = 0;
      let pendingAmount = 0;
      let approvedAmount = 0;
      let rejectedAmount = 0;
      let cancelledAmount = 0;

      for (
        const withdrawal of withdrawals
      ) {
        const amount =
          toSafeNumber(
            withdrawal.amount ??
              withdrawal.requestAmount
          );

        const status =
          normalizeWithdrawStatus(
            withdrawal.status
          );

        totalRequests += 1;
        totalAmount += amount;

        switch (status) {
          case "PENDING":
            pendingRequests += 1;
            pendingAmount += amount;
            break;

          case "APPROVED":
            approvedRequests += 1;
            approvedAmount += amount;
            break;

          case "REJECTED":
            rejectedRequests += 1;
            rejectedAmount += amount;
            break;

          case "CANCELLED":
            cancelledRequests += 1;
            cancelledAmount += amount;
            break;

          default:
            break;
        }
      }

      return res.status(200).json({
        success: true,

        summary: {
          totalRequests,
          pendingRequests,
          approvedRequests,
          rejectedRequests,
          cancelledRequests,

          totalAmount,
          pendingAmount,
          approvedAmount,
          rejectedAmount,
          cancelledAmount,
        },
      });
    } catch (error) {
      console.error(
        "GET WITHDRAW SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load withdrawal summary.",
      });
    }
  }
);

// ======================================================
// USER WITHDRAWAL STATISTICS
// ======================================================

router.get(
  "/statistics",
  verifyToken,
  async (req, res) => {
    try {
      const userId = cleanString(
        req.user?.id ||
          req.user?._id
      );

      const username = cleanString(
        req.user?.username
      );

      if (
        !userId &&
        !username
      ) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication information is missing.",
        });
      }

      const conditions = [];

      if (userId) {
        conditions.push({
          userId,
        });
      }

      if (username) {
        conditions.push({
          username,
        });
      }

      const query = {
        $or: conditions,
      };

      const withdrawals =
        await Withdraw.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .lean();

      const statistics = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,

        totalAmount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        rejectedAmount: 0,
        cancelledAmount: 0,

        byWalletType: {
          PKR: {
            count: 0,
            amount: 0,
          },

          USDT: {
            count: 0,
            amount: 0,
          },

          GOLD: {
            count: 0,
            amount: 0,
          },
        },
      };

      for (
        const withdrawal of withdrawals
      ) {
        const amount =
          toSafeNumber(
            withdrawal.amount ??
              withdrawal.requestAmount
          );

        const status =
          normalizeWithdrawStatus(
            withdrawal.status
          );

        const walletType =
          normalizeWalletType(
            withdrawal.walletType
          );

        statistics.total += 1;
        statistics.totalAmount +=
          amount;

        switch (status) {
          case "PENDING":
            statistics.pending += 1;
            statistics.pendingAmount +=
              amount;
            break;

          case "APPROVED":
            statistics.approved += 1;
            statistics.approvedAmount +=
              amount;
            break;

          case "REJECTED":
            statistics.rejected += 1;
            statistics.rejectedAmount +=
              amount;
            break;

          case "CANCELLED":
            statistics.cancelled += 1;
            statistics.cancelledAmount +=
              amount;
            break;

          default:
            break;
        }

        if (
          statistics.byWalletType[
            walletType
          ]
        ) {
          statistics.byWalletType[
            walletType
          ].count += 1;

          statistics.byWalletType[
            walletType
          ].amount += amount;
        }
      }

      return res.status(200).json({
        success: true,
        statistics,
      });
    } catch (error) {
      console.error(
        "GET WITHDRAW STATISTICS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load withdrawal statistics.",
      });
    }
  }
);

// ======================================================
// RECENT USER WITHDRAWALS
// ======================================================

router.get(
  "/recent",
  verifyToken,
  async (req, res) => {
    try {
      const userId = cleanString(
        req.user?.id ||
          req.user?._id
      );

      const username = cleanString(
        req.user?.username
      );

      if (
        !userId &&
        !username
      ) {
        return res.status(401).json({
          success: false,
          message:
            "User authentication information is missing.",
        });
      }

      const limit = Math.min(
        50,
        Math.max(
          1,
          Number(
            req.query.limit || 10
          )
        )
      );

      const conditions = [];

      if (userId) {
        conditions.push({
          userId,
        });
      }

      if (username) {
        conditions.push({
          username,
        });
      }

      const withdrawals =
        await Withdraw.find({
          $or: conditions,
        })
          .sort({
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      return res.status(200).json({
        success: true,

        withdrawals,

        data:
          withdrawals,
      });
    } catch (error) {
      console.error(
        "GET RECENT WITHDRAWALS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load recent withdrawals.",
        withdrawals: [],
        data: [],
      });
    }
  }
);
// ======================================================
// ADMIN - GET ALL WITHDRAWALS
// ======================================================

router.get(
  "/admin/all",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const page = Math.max(
        1,
        Number(req.query.page || 1)
      );

      const limit = Math.min(
        100,
        Math.max(
          1,
          Number(req.query.limit || 50)
        )
      );

      const skip =
        (page - 1) * limit;

      const status = cleanString(
        req.query.status
      );

      const walletType = cleanString(
        req.query.walletType
      );

      const username = cleanString(
        req.query.username
      );

      const search = cleanString(
        req.query.search
      );

      const query = {};

      // ==================================================
      // STATUS FILTER
      // ==================================================

      if (status) {
        query.status =
          normalizeWithdrawStatus(
            status
          );
      }

      // ==================================================
      // WALLET TYPE FILTER
      // ==================================================

      if (walletType) {
        query.walletType =
          normalizeWalletType(
            walletType
          );
      }

      // ==================================================
      // USERNAME FILTER
      // ==================================================

      if (username) {
        query.username = username;
      }

      // ==================================================
      // SEARCH FILTER
      // ==================================================

      if (search) {
        query.$or = [
          {
            username: {
              $regex: search,
              $options: "i",
            },
          },

          {
            referenceId: {
              $regex: search,
              $options: "i",
            },
          },

          {
            paymentMethod: {
              $regex: search,
              $options: "i",
            },
          },

          {
            walletAddress: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      // ==================================================
      // LOAD WITHDRAWALS
      // ==================================================

      const [
        withdrawals,
        total,
      ] = await Promise.all([
        Withdraw.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Withdraw.countDocuments(
          query
        ),
      ]);

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        withdrawals,

        data:
          withdrawals,

        pagination: {
          page,
          limit,
          total,

          totalPages:
            Math.ceil(
              total / limit
            ),
        },
      });
    } catch (error) {
      console.error(
        "ADMIN GET ALL WITHDRAWALS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to load withdrawals.",

        withdrawals: [],
        data: [],
      });
    }
  }
);

// ======================================================
// ADMIN - GET PENDING WITHDRAWALS
// ======================================================

router.get(
  "/admin/pending",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const page = Math.max(
        1,
        Number(req.query.page || 1)
      );

      const limit = Math.min(
        100,
        Math.max(
          1,
          Number(req.query.limit || 50)
        )
      );

      const skip =
        (page - 1) * limit;

      const walletType = cleanString(
        req.query.walletType
      );

      const query = {
        status: "PENDING",
      };

      // ==================================================
      // WALLET TYPE FILTER
      // ==================================================

      if (walletType) {
        query.walletType =
          normalizeWalletType(
            walletType
          );
      }

      // ==================================================
      // LOAD PENDING REQUESTS
      // ==================================================

      const [
        withdrawals,
        total,
      ] = await Promise.all([
        Withdraw.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Withdraw.countDocuments(
          query
        ),
      ]);

      // ==================================================
      // TOTAL PENDING AMOUNT
      // ==================================================

      const totalAmount =
        withdrawals.reduce(
          (
            sum,
            withdrawal
          ) => {
            return (
              sum +
              toSafeNumber(
                withdrawal.amount ??
                  withdrawal.requestAmount
              )
            );
          },
          0
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        withdrawals,

        data:
          withdrawals,

        totalAmount,

        count:
          withdrawals.length,

        pagination: {
          page,
          limit,
          total,

          totalPages:
            Math.ceil(
              total / limit
            ),
        },
      });
    } catch (error) {
      console.error(
        "ADMIN GET PENDING WITHDRAWALS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to load pending withdrawals.",

        withdrawals: [],
        data: [],
      });
    }
  }
);

// ======================================================
// ADMIN - GET WITHDRAWAL DETAILS
// ======================================================

router.get(
  "/admin/:withdrawId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const withdrawId =
        cleanString(
          req.params.withdrawId
        );

      // ==================================================
      // VALIDATE ID
      // ==================================================

      if (
        !mongoose.Types.ObjectId.isValid(
          withdrawId
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid withdrawal ID.",
        });
      }

      // ==================================================
      // LOAD WITHDRAWAL
      // ==================================================

      const withdrawal =
        await Withdraw.findById(
          withdrawId
        ).lean();

      if (!withdrawal) {
        return res.status(404).json({
          success: false,

          message:
            "Withdrawal request not found.",
        });
      }

      // ==================================================
      // LOAD USER
      // ==================================================

      let user = null;

      if (
        withdrawal.userId &&
        mongoose.Types.ObjectId.isValid(
          String(
            withdrawal.userId
          )
        )
      ) {
        user =
          await User.findById(
            withdrawal.userId
          )
            .select(
              "-password -passwordHash"
            )
            .lean();
      }

      // ==================================================
      // LOAD WALLET
      // ==================================================

      let wallet = null;

      if (
        withdrawal.userId
      ) {
        wallet =
          await getWallet({
            userId:
              withdrawal.userId,

            username:
              withdrawal.username,
          });

        if (wallet) {
          wallet =
            wallet.toObject
              ? wallet.toObject()
              : wallet;
        }
      }

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        withdrawal,

        data: {
          withdrawal,

          user,

          wallet,
        },
      });
    } catch (error) {
      console.error(
        "ADMIN GET WITHDRAWAL DETAILS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to load withdrawal details.",
      });
    }
  }
);

// ======================================================
// ADMIN - RECENT WITHDRAWALS
// ======================================================

router.get(
  "/admin/recent",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const limit = Math.min(
        100,
        Math.max(
          1,
          Number(
            req.query.limit || 20
          )
        )
      );

      const withdrawals =
        await Withdraw.find({})
          .sort({
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      return res.status(200).json({
        success: true,

        withdrawals,

        data:
          withdrawals,

        count:
          withdrawals.length,
      });
    } catch (error) {
      console.error(
        "ADMIN RECENT WITHDRAWALS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Failed to load recent withdrawals.",

        withdrawals: [],
        data: [],
      });
    }
  }
);
// ======================================================

router.get(
  "/summary",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH USER
      // ==================================================

      const userId = String(
        req.user?.id ||
          req.user?._id ||
          ""
      ).trim();

      const username = String(
        req.user?.username || ""
      )
        .trim()
        .toLowerCase();

      if (!userId && !username) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user information is missing.",
        });
      }

      // ==================================================
      // USER CONDITIONS
      // ==================================================

      const conditions = [];

      if (
        userId &&
        mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        conditions.push({
          userId:
            new mongoose.Types.ObjectId(
              userId
            ),
        });
      }

      if (username) {
        conditions.push({
          username,
        });
      }

      if (conditions.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Unable to identify user.",
        });
      }

      // ==================================================
      // BASE QUERY
      // ==================================================

      const baseQuery = {
        $or: conditions,
      };

      // ==================================================
      // LOAD SUMMARY DATA
      // ==================================================

      const [
        totalWithdraws,
        approvedResult,
        pendingResult,
        rejectedResult,
        cancelledResult,
      ] = await Promise.all([
        Withdraw.countDocuments(
          baseQuery
        ),

        Withdraw.aggregate([
          {
            $match: {
              ...baseQuery,
              status: "APPROVED",
            },
          },
          {
            $group: {
              _id: null,

              amount: {
                $sum: "$amount",
              },

              count: {
                $sum: 1,
              },
            },
          },
        ]),

        Withdraw.aggregate([
          {
            $match: {
              ...baseQuery,
              status: "PENDING",
            },
          },
          {
            $group: {
              _id: null,

              amount: {
                $sum: "$amount",
              },

              count: {
                $sum: 1,
              },
            },
          },
        ]),

        // ------------------------------------------------
        // REJECTED
        // ------------------------------------------------

        Withdraw.aggregate([
          {
            $match: {
              ...baseQuery,
              status: "REJECTED",
            },
          },
          {
            $group: {
              _id: null,

              amount: {
                $sum: "$amount",
              },

              count: {
                $sum: 1,
              },
            },
          },
        ]),

        // ------------------------------------------------
        // CANCELLED
        // ------------------------------------------------

        Withdraw.aggregate([
          {
            $match: {
              ...baseQuery,
              status: "CANCELLED",
            },
          },
          {
            $group: {
              _id: null,

              amount: {
                $sum: "$amount",
              },

              count: {
                $sum: 1,
              },
            },
          },
        ]),
      ]);

      // ==================================================
      // NORMALIZE RESULTS
      // ==================================================

      const approved =
        approvedResult[0] || {
          amount: 0,
          count: 0,
        };

      const pending =
        pendingResult[0] || {
          amount: 0,
          count: 0,
        };

      const rejected =
        rejectedResult[0] || {
          amount: 0,
          count: 0,
        };

      const cancelled =
        cancelledResult[0] || {
          amount: 0,
          count: 0,
        };

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        summary: {
          totalWithdraws,

          approvedAmount:
            toSafeNumber(
              approved.amount
            ),

          pendingAmount:
            toSafeNumber(
              pending.amount
            ),

          rejectedAmount:
            toSafeNumber(
              rejected.amount
            ),

          cancelledAmount:
            toSafeNumber(
              cancelled.amount
            ),

          approvedCount:
            approved.count || 0,

          pendingCount:
            pending.count || 0,

          rejectedCount:
            rejected.count || 0,

          cancelledCount:
            cancelled.count || 0,
        },
      });
    } catch (error) {
      // ==================================================
      // ERROR HANDLING
      // ==================================================

      console.error(
        "WITHDRAW SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load withdrawal summary.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// USER WITHDRAWAL STATISTICS
// GET /api/withdraw/statistics
// ======================================================

router.get(
  "/statistics",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH USER
      // ==================================================

      const userId = String(
        req.user?.id ||
          req.user?._id ||
          ""
      ).trim();

      const username = String(
        req.user?.username || ""
      )
        .trim()
        .toLowerCase();

      if (!userId && !username) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user information is missing.",
        });
      }

      // ==================================================
      // USER CONDITIONS
      // ==================================================

      const conditions = [];

      if (
        userId &&
        mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        conditions.push({
          userId:
            new mongoose.Types.ObjectId(
              userId
            ),
        });
      }

      if (username) {
        conditions.push({
          username,
        });
      }

      if (conditions.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Unable to identify user.",
        });
      }

      // ==================================================
      // BASE QUERY
      // ==================================================

      const query = {
        $or: conditions,
      };

      // ==================================================
      // LOAD STATISTICS
      // ==================================================

      const [
        approved,
        pending,
        rejected,
        latestWithdraw,
      ] = await Promise.all([
        // ------------------------------------------------
        // APPROVED COUNT
        // ------------------------------------------------

        Withdraw.countDocuments({
          ...query,
          status: "APPROVED",
        }),

        // ------------------------------------------------
        // PENDING COUNT
        // ------------------------------------------------

        Withdraw.countDocuments({
          ...query,
          status: "PENDING",
        }),

        // ------------------------------------------------
        // REJECTED COUNT
        // ------------------------------------------------

        Withdraw.countDocuments({
          ...query,
          status: "REJECTED",
        }),

        // ------------------------------------------------
        // LATEST WITHDRAWAL
        // ------------------------------------------------

        Withdraw.findOne(query)
          .sort({
            createdAt: -1,
          })
          .lean(),
      ]);

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        statistics: {
          approved,
          pending,
          rejected,

          latestWithdraw:
            latestWithdraw || null,
        },
      });
    } catch (error) {
      // ==================================================
      // ERROR HANDLING
      // ==================================================

      console.error(
        "WITHDRAW STATISTICS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load withdrawal statistics.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// RECENT USER WITHDRAWALS
// GET /api/withdraw/recent
// ======================================================

router.get(
  "/recent",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // AUTH USER
      // ==================================================

      const userId = String(
        req.user?.id ||
          req.user?._id ||
          ""
      ).trim();

      const username = String(
        req.user?.username || ""
      )
        .trim()
        .toLowerCase();

      if (!userId && !username) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user information is missing.",
        });
      }

      // ==================================================
      // USER CONDITIONS
      // ==================================================

      const conditions = [];

      if (
        userId &&
        mongoose.Types.ObjectId.isValid(
          userId
        )
      ) {
        conditions.push({
          userId:
            new mongoose.Types.ObjectId(
              userId
            ),
        });
      }

      if (username) {
        conditions.push({
          username,
        });
      }

      if (conditions.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Unable to identify user.",
        });
      }

      // ==================================================
      // LIMIT
      // ==================================================

      const limitValue =
        Number.parseInt(
          req.query.limit,
          10
        );

      const limit = Math.min(
        50,
        Math.max(
          1,
          Number.isFinite(limitValue)
            ? limitValue
            : 10
        )
      );

      // ==================================================
      // FETCH RECENT WITHDRAWALS
      // ==================================================

      const withdrawals =
        await Withdraw.find({
          $or: conditions,
        })
          .sort({
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        withdrawals,

        count:
          withdrawals.length,
      });
    } catch (error) {
      // ==================================================
      // ERROR HANDLING
      // ==================================================

      console.error(
        "RECENT WITHDRAWALS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load recent withdrawals.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// ADMIN — ALL WITHDRAWALS
// GET /api/withdraw/admin/all
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

      const page = Math.max(
        1,
        Number.parseInt(
          req.query.page,
          10
        ) || 1
      );

      const requestedLimit =
        Number.parseInt(
          req.query.limit,
          10
        );

      const limit = Math.min(
        100,
        Math.max(
          1,
          Number.isFinite(
            requestedLimit
          )
            ? requestedLimit
            : 20
        )
      );

      const skip =
        (page - 1) * limit;

      // ==================================================
      // FILTERS
      // ==================================================

      const walletType =
        normalizeWalletType(
          req.query.walletType
        );

      const status =
        normalizeWithdrawStatus(
          req.query.status
        );

      const search =
        cleanString(
          req.query.search
        );

      // ==================================================
      // BUILD QUERY
      // ==================================================

      const query = {};

      // --------------------------------------------------
      // WALLET TYPE FILTER
      // --------------------------------------------------

      if (
        [
          "PKR",
          "USDT",
          "GOLD",
        ].includes(walletType)
      ) {
        query.walletType =
          walletType;
      }

      // --------------------------------------------------
      // STATUS FILTER
      // --------------------------------------------------

      if (
        [
          "PENDING",
          "APPROVED",
          "REJECTED",
          "CANCELLED",
          "PROCESSING",
        ].includes(status)
      ) {
        query.status = status;
      }

      // --------------------------------------------------
      // SEARCH FILTER
      // --------------------------------------------------

      if (search) {
        query.$or = [
          {
            username: {
              $regex: search,
              $options: "i",
            },
          },

          {
            referenceId: {
              $regex: search,
              $options: "i",
            },
          },

          {
            paymentMethod: {
              $regex: search,
              $options: "i",
            },
          },

          {
            accountName: {
              $regex: search,
              $options: "i",
            },
          },

          {
            accountNumber: {
              $regex: search,
              $options: "i",
            },
          },

          {
            walletAddress: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      // ==================================================
      // FETCH WITHDRAWALS + TOTAL
      // ==================================================

      const [
        withdrawals,
        total,
      ] = await Promise.all([
        Withdraw.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Withdraw.countDocuments(
          query
        ),
      ]);

      // ==================================================
      // PAGINATION INFO
      // ==================================================

      const totalPages =
        Math.ceil(
          total / limit
        );

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        withdrawals,

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasNextPage:
            page < totalPages,

          hasPreviousPage:
            page > 1,
        },
      });
    } catch (error) {
      // ==================================================
      // ERROR HANDLING
      // ==================================================

      console.error(
        "ADMIN ALL WITHDRAWALS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load withdrawals.",

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
// ADMIN — PENDING WITHDRAWALS
// GET /api/withdraw/admin/pending
// ======================================================

router.get(
  "/admin/pending",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // PAGINATION
      // ==================================================

      const page = Math.max(
        1,
        Number.parseInt(
          req.query.page,
          10
        ) || 1
      );

      const requestedLimit =
        Number.parseInt(
          req.query.limit,
          10
        );

      const limit = Math.min(
        100,
        Math.max(
          1,
          Number.isFinite(
            requestedLimit
          )
            ? requestedLimit
            : 20
        )
      );

      const skip =
        (page - 1) * limit;

      // ==================================================
      // WALLET TYPE FILTER
      // ==================================================

      const walletType =
        normalizeWalletType(
          req.query.walletType
        );

      // ==================================================
      // BUILD QUERY
      // ==================================================

      const query = {
        status: "PENDING",
      };

      if (
        [
          "PKR",
          "USDT",
          "GOLD",
        ].includes(walletType)
      ) {
        query.walletType =
          walletType;
      }

      // ==================================================
      // FETCH PENDING WITHDRAWALS
      // ==================================================

      const [
        withdrawals,
        total,
      ] = await Promise.all([
        Withdraw.find(query)
          .sort({
            createdAt: 1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        Withdraw.countDocuments(
          query
        ),
      ]);

      // ==================================================
      // PAGINATION INFO
      // ==================================================

      const totalPages =
        Math.ceil(
          total / limit
        );

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        withdrawals,

        count:
          withdrawals.length,

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasNextPage:
            page < totalPages,

          hasPreviousPage:
            page > 1,
        },
      });
    } catch (error) {
      // ==================================================
      // ERROR HANDLING
      // ==================================================

      console.error(
        "ADMIN PENDING WITHDRAWALS ERROR:",
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
// ADMIN — WITHDRAWAL DETAILS
// GET /api/withdraw/admin/:withdrawId
// ======================================================

router.get(
  "/admin/:withdrawId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // WITHDRAWAL ID
      // ==================================================

      const withdrawId =
        String(
          req.params.withdrawId ||
            ""
        ).trim();

      // ==================================================
      // VALIDATE ID
      // ==================================================

      if (
        !mongoose.Types.ObjectId.isValid(
          withdrawId
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid withdrawal ID.",
        });
      }

      // ==================================================
      // FIND WITHDRAWAL
      // ==================================================

      const withdrawal =
        await Withdraw.findById(
          withdrawId
        ).lean();

      // ==================================================
      // NOT FOUND
      // ==================================================

      if (!withdrawal) {
        return res.status(404).json({
          success: false,

          message:
            "Withdrawal not found.",
        });
      }

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        withdrawal,
      });
    } catch (error) {
      // ==================================================
      // ERROR HANDLING
      // ==================================================

      console.error(
        "ADMIN WITHDRAW DETAILS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load withdrawal details.",

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
// ADMIN — RECENT WITHDRAWALS
// GET /api/withdraw/admin/recent
// ======================================================

router.get(
  "/admin/recent",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // LIMIT
      // ==================================================

      const limitValue =
        Number.parseInt(
          req.query.limit,
          10
        );

      const limit = Math.min(
        50,
        Math.max(
          1,
          Number.isFinite(
            limitValue
          )
            ? limitValue
            : 10
        )
      );

      // ==================================================
      // FETCH RECENT WITHDRAWALS
      // ==================================================

      const withdrawals =
        await Withdraw.find({})
          .sort({
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        withdrawals,

        count:
          withdrawals.length,
      });
    } catch (error) {
      // ==================================================
      // ERROR HANDLING
      // ==================================================

      console.error(
        "ADMIN RECENT WITHDRAWALS ERROR:",
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
// ADMIN — APPROVE WITHDRAWAL
// POST /api/withdraw/admin/:withdrawId/approve
// ======================================================

router.post(
  "/admin/:withdrawId/approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    let session;

    try {
      // ==================================================
      // VALIDATE WITHDRAWAL ID
      // ==================================================

      const withdrawId =
        String(
          req.params.withdrawId ||
            ""
        ).trim();

      if (
        !withdrawId ||
        !mongoose.Types.ObjectId.isValid(
          withdrawId
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid withdrawal ID.",
        });
      }

      // ==================================================
      // ADMIN INFORMATION
      // ==================================================

      const adminId =
        String(
          req.user?.id ||
            req.user?._id ||
            ""
        ).trim();

      const adminUsername =
        String(
          req.user?.username ||
            ""
        ).trim();

      // ==================================================
      // START DATABASE SESSION
      // ==================================================

      session =
        await mongoose.startSession();

      session.startTransaction();

      // ==================================================
      // FIND WITHDRAWAL
      // ==================================================

      const withdrawal =
        await Withdraw.findById(
          withdrawId
        ).session(session);

      if (!withdrawal) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,

          message:
            "Withdrawal request not found.",
        });
      }

      // ==================================================
      // VALIDATE CURRENT STATUS
      // ==================================================

      const currentStatus =
        normalizeWithdrawStatus(
          withdrawal.status
        );

      if (
        currentStatus !==
        "PENDING"
      ) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,

          message:
            `Withdrawal cannot be approved because its current status is ${
              currentStatus ||
              "UNKNOWN"
            }.`,
        });
      }

      // ==================================================
      // WITHDRAWAL USER DATA
      // ==================================================

      const withdrawalUserId =
        String(
          withdrawal.userId ||
            ""
        ).trim();

      const withdrawalUsername =
        String(
          withdrawal.username ||
            ""
        ).trim();

      // ==================================================
      // WALLET TYPE
      // ==================================================

      const walletType =
        normalizeWalletType(
          withdrawal.walletType
        );

      // ==================================================
      // WITHDRAWAL AMOUNT
      // ==================================================

      const amount =
        toSafeNumber(
          withdrawal.amount ??
            withdrawal.requestAmount
        );

      // ==================================================
      // VALIDATE WALLET TYPE
      // ==================================================

      if (
        ![
          "PKR",
          "USDT",
          "GOLD",
        ].includes(
          walletType
        )
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,

          message:
            "Withdrawal contains an invalid wallet type.",
        });
      }
            // ==================================================
      // VALIDATE AMOUNT
      // ==================================================

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message:
            "Withdrawal contains an invalid amount.",
        });
      }

      // ==================================================
      // GET USER WALLET
      // ==================================================

      const wallet =
        await getWallet({
          userId:
            withdrawalUserId,

          username:
            withdrawalUsername,

          session,
        });

      if (!wallet) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          message:
            "User wallet not found.",
        });
      }

      // ==================================================
      // CHECK WALLET FREEZE STATUS
      // ==================================================

      if (
        wallet.isFrozen === true ||
        String(
          wallet.status || ""
        ).toLowerCase() ===
          "frozen"
      ) {
        await session.abortTransaction();

        return res.status(403).json({
          success: false,
          message:
            "User wallet is frozen. Withdrawal cannot be approved.",
        });
      }

      // ==================================================
      // CURRENT WALLET BALANCES
      // ==================================================

      const currentBalance =
        getWalletBalance(
          wallet,
          walletType
        );

      const lockedBalance =
        getLockedBalance(
          wallet,
          walletType
        );

      // ==================================================
      // VALIDATE LOCKED AMOUNT
      // ==================================================

      if (
        lockedBalance < amount
      ) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,

          message:
            "Locked withdrawal amount is inconsistent with wallet records.",

          wallet: {
            balance:
              currentBalance,

            locked:
              lockedBalance,

            withdrawalAmount:
              amount,
          },
        });
      }

      // ==================================================
      // VALIDATE CURRENT BALANCE
      // ==================================================

      if (
        currentBalance < amount
      ) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,

          message:
            `Insufficient ${walletType} balance for final withdrawal settlement.`,

          wallet: {
            balance:
              currentBalance,

            locked:
              lockedBalance,

            withdrawalAmount:
              amount,
          },
        });
      }

      // ==================================================
      // WALLET BEFORE SNAPSHOT
      // ==================================================

      const walletBefore = {
        pkrBalance:
          toSafeNumber(
            wallet.pkrBalance
          ),

        usdtBalance:
          toSafeNumber(
            wallet.usdtBalance
          ),

        goldBalance:
          toSafeNumber(
            wallet.goldBalance
          ),

        lockedPkr:
          toSafeNumber(
            wallet.lockedPkr
          ),

        lockedUsdt:
          toSafeNumber(
            wallet.lockedUsdt
          ),

        lockedGold:
          toSafeNumber(
            wallet.lockedGold
          ),
      };

      // ==================================================
      // CALCULATE NEW BALANCES
      // ==================================================

      const newBalance =
        currentBalance -
        amount;

      const newLockedBalance =
        lockedBalance -
        amount;

      // ==================================================
      // UPDATE WALLET BALANCE
      // ==================================================

      /*
       * Keep the actual wallet balance deduction
       * separate from the locked-balance release.
       */

      const setWalletBalance = (
        walletDocument,
        type,
        value
      ) => {
        const normalizedType =
          normalizeWalletType(
            type
          );

        const safeValue =
          Math.max(
            0,
            toSafeNumber(value)
          );

        switch (
          normalizedType
        ) {
          case "PKR":
            walletDocument.pkrBalance =
              safeValue;
            break;

          case "USDT":
            walletDocument.usdtBalance =
              safeValue;
            break;

          case "GOLD":
            walletDocument.goldBalance =
              safeValue;
            break;

          default:
            throw new Error(
              `Invalid wallet type: ${normalizedType}`
            );
        }

        return walletDocument;
      };

      setWalletBalance(
        wallet,
        walletType,
        newBalance
      );

      setLockedBalance(
        wallet,
        walletType,
        newLockedBalance
      );

      // ==================================================
      // WALLET AFTER SNAPSHOT
      // ==================================================

      const walletAfter = {
        pkrBalance:
          toSafeNumber(
            wallet.pkrBalance
          ),

        usdtBalance:
          toSafeNumber(
            wallet.usdtBalance
          ),

        goldBalance:
          toSafeNumber(
            wallet.goldBalance
          ),

        lockedPkr:
          toSafeNumber(
            wallet.lockedPkr
          ),

        lockedUsdt:
          toSafeNumber(
            wallet.lockedUsdt
          ),

        lockedGold:
          toSafeNumber(
            wallet.lockedGold
          ),
      };

      // ==================================================
      // SAVE WALLET
      // ==================================================

      await wallet.save({
        session,
      });

      // ==================================================
      // UPDATE WITHDRAWAL
      // ==================================================

      withdrawal.status =
        "APPROVED";

      withdrawal.walletBefore =
        walletBefore;

      withdrawal.walletAfter =
        walletAfter;

      withdrawal.approvedBy =
        adminId || undefined;

      withdrawal.approvedByUsername =
        adminUsername ||
        undefined;

      withdrawal.approvedAt =
        new Date();

      withdrawal.processedAt =
        new Date();

      // ==================================================
      // SAVE WITHDRAWAL
      // ==================================================

      await withdrawal.save({
        session,
      });

      // ==================================================
      // WALLET HISTORY
      // ==================================================

      await WalletHistory.create(
        [
          {
            userId:
              withdrawalUserId,

            username:
              withdrawalUsername,

            walletType,

            type:
              "WITHDRAW",

            amount,

            balanceBefore:
              currentBalance,

            balanceAfter:
              newBalance,

            referenceId:
              withdrawal.referenceId,

            note:
              "Withdrawal approved and wallet amount settled.",

            status:
              "APPROVED",
          },
        ],
        {
          session,
        }
      );

      // ==================================================
      // TRANSACTION LEDGER
      // ==================================================

      await Transaction.create(
        [
          {
            userId:
              withdrawalUserId,

            username:
              withdrawalUsername,

            walletType,

            transactionType:
              "WITHDRAW",

            transactionMode:
              "DEBIT",

            amount,

            balanceBefore:
              currentBalance,

            balanceAfter:
              newBalance,

            referenceId:
              withdrawal.referenceId,

            status:
              "APPROVED",

            note:
              "Withdrawal approved and amount deducted from wallet.",
          },
        ],
        {
          session,
        }
      );

      // ==================================================
      // COMMIT TRANSACTION
      // ==================================================

      await session.commitTransaction();

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Withdrawal approved successfully.",

        withdrawal: {
          id:
            withdrawal._id,

          referenceId:
            withdrawal.referenceId,

          username:
            withdrawal.username,

          walletType:
            withdrawal.walletType,

          amount,

          status:
            withdrawal.status,

          approvedBy:
            adminUsername,

          approvedAt:
            withdrawal.approvedAt,
        },

        wallet: {
          balance:
            newBalance,

          locked:
            newLockedBalance,

          available:
            Math.max(
              0,
              newBalance -
                newLockedBalance
            ),
        },
      });
    } catch (error) {
      // ==================================================
      // TRANSACTION ROLLBACK
      // ==================================================

      try {
        if (
          session &&
          session.inTransaction()
        ) {
          await session.abortTransaction();
        }
      } catch (
        rollbackError
      ) {
        console.error(
          "APPROVE WITHDRAW ROLLBACK ERROR:",
          rollbackError
        );
      }

      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "APPROVE WITHDRAW ERROR:",
        error
      );

      // ==================================================
      // ERROR RESPONSE
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to approve withdrawal.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    } finally {
      // ==================================================
      // END DATABASE SESSION
      // ==================================================

      if (session) {
        await session.endSession();
      }
    }
  }
);

// ======================================================
// ADMIN — REJECT WITHDRAWAL
// POST /api/withdraw/admin/:withdrawId/reject
// ======================================================

router.post(
  "/admin/:withdrawId/reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    let session;

    try {
      // ==================================================
      // VALIDATE WITHDRAWAL ID
      // ==================================================

      const withdrawId =
        String(
          req.params.withdrawId ||
            ""
        ).trim();

      if (
        !withdrawId ||
        !mongoose.Types.ObjectId.isValid(
          withdrawId
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid withdrawal ID.",
        });
      }

      // ==================================================
      // ADMIN INFORMATION
      // ==================================================

      const adminId =
        String(
          req.user?.id ||
            req.user?._id ||
            ""
        ).trim();

      const adminUsername =
        String(
          req.user?.username ||
            ""
        ).trim();

      // ==================================================
      // REJECTION REASON
      // ==================================================

      const rejectionReason =
        cleanString(
          req.body?.reason ||
            req.body?.rejectionReason ||
            "Withdrawal rejected by admin."
        ) ||
        "Withdrawal rejected by admin.";

      // ==================================================
      // START MONGODB SESSION
      // ==================================================

      session =
        await mongoose.startSession();

      session.startTransaction();

      // ==================================================
      // FIND WITHDRAWAL
      // ==================================================

      const withdrawal =
        await Withdraw.findById(
          withdrawId
        ).session(session);

      if (!withdrawal) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,

          message:
            "Withdrawal request not found.",
        });
      }

      // ==================================================
      // CHECK WITHDRAWAL STATUS
      // ==================================================

      const currentStatus =
        normalizeWithdrawStatus(
          withdrawal.status
        );

      if (
        currentStatus !==
        "PENDING"
      ) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,

          message:
            `Withdrawal cannot be rejected because its current status is ${
              currentStatus ||
              "UNKNOWN"
            }.`,
        });
      }

      // ==================================================
      // WITHDRAWAL USER INFORMATION
      // ==================================================

      const withdrawalUserId =
        String(
          withdrawal.userId ||
            ""
        ).trim();

      const withdrawalUsername =
        String(
          withdrawal.username ||
            ""
        ).trim();

      // ==================================================
      // WALLET TYPE
      // ==================================================

      const walletType =
        normalizeWalletType(
          withdrawal.walletType
        );

      // ==================================================
      // WITHDRAWAL AMOUNT
      // ==================================================

      const amount =
        toSafeNumber(
          withdrawal.amount ??
            withdrawal.requestAmount
        );

      // ==================================================
      // VALIDATE WALLET TYPE
      // ==================================================

      if (
        ![
          "PKR",
          "USDT",
          "GOLD",
        ].includes(
          walletType
        )
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,

          message:
            "Invalid withdrawal wallet type.",
        });
      }

      // ==================================================
      // VALIDATE WITHDRAWAL AMOUNT
      // ==================================================

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,

          message:
            "Invalid withdrawal amount.",
        });
      }

      // ==================================================
      // FIND USER WALLET
      // ==================================================

      const wallet =
        await getWallet({
          userId:
            withdrawalUserId,

          username:
            withdrawalUsername,

          session,
        });

      if (!wallet) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,

          message:
            "User wallet not found.",
        });
      }
      // ======================================================
// CHECK LOCKED BALANCE
// ======================================================

      const lockedBalance =
        getLockedBalance(
          wallet,
          walletType
        );

      // ==================================================
      // WALLET BEFORE SNAPSHOT
      // ==================================================

      const walletBefore = {
        pkrBalance:
          toSafeNumber(
            wallet.pkrBalance
          ),

        usdtBalance:
          toSafeNumber(
            wallet.usdtBalance
          ),

        goldBalance:
          toSafeNumber(
            wallet.goldBalance
          ),

        lockedPkr:
          toSafeNumber(
            wallet.lockedPkr
          ),

        lockedUsdt:
          toSafeNumber(
            wallet.lockedUsdt
          ),

        lockedGold:
          toSafeNumber(
            wallet.lockedGold
          ),
      };

      // ==================================================
      // RELEASE LOCKED AMOUNT
      // ==================================================

      const newLockedBalance =
        Math.max(
          0,
          lockedBalance -
            amount
        );

      setLockedBalance(
        wallet,
        walletType,
        newLockedBalance
      );

      // ==================================================
      // WALLET AFTER SNAPSHOT
      // ==================================================

      const walletAfter = {
        pkrBalance:
          toSafeNumber(
            wallet.pkrBalance
          ),

        usdtBalance:
          toSafeNumber(
            wallet.usdtBalance
          ),

        goldBalance:
          toSafeNumber(
            wallet.goldBalance
          ),

        lockedPkr:
          toSafeNumber(
            wallet.lockedPkr
          ),

        lockedUsdt:
          toSafeNumber(
            wallet.lockedUsdt
          ),

        lockedGold:
          toSafeNumber(
            wallet.lockedGold
          ),
      };

      // ==================================================
      // SAVE WALLET
      // ==================================================

      await wallet.save({
        session,
      });

      // ==================================================
      // UPDATE WITHDRAWAL
      // ==================================================

      withdrawal.status =
        "REJECTED";

      withdrawal.rejectionReason =
        rejectionReason;

      withdrawal.rejectedBy =
        adminId || undefined;

      withdrawal.rejectedByUsername =
        adminUsername ||
        undefined;

      withdrawal.rejectedAt =
        new Date();

      withdrawal.processedAt =
        new Date();

      withdrawal.walletBefore =
        walletBefore;

      withdrawal.walletAfter =
        walletAfter;

      // ==================================================
      // SAVE WITHDRAWAL
      // ==================================================

      await withdrawal.save({
        session,
      });

      // ==================================================
      // WALLET HISTORY
      // ==================================================

      await WalletHistory.create(
        [
          {
            userId:
              withdrawalUserId,

            username:
              withdrawalUsername,

            walletType,

            type:
              "WITHDRAW",

            amount: 0,

            balanceBefore:
              getWalletBalance(
                wallet,
                walletType
              ),

            balanceAfter:
              getWalletBalance(
                wallet,
                walletType
              ),

            referenceId:
              withdrawal.referenceId,

            note:
              `Withdrawal rejected. Locked amount released. Reason: ${rejectionReason}`,

            status:
              "REJECTED",
          },
        ],
        {
          session,
        }
      );

      // ==================================================
      // TRANSACTION LEDGER
      // ==================================================

      await Transaction.create(
        [
          {
            userId:
              withdrawalUserId,

            username:
              withdrawalUsername,

            walletType,

            transactionType:
              "WITHDRAW_REJECTED",

            transactionMode:
              "RELEASE",

            amount: 0,

            balanceBefore:
              getWalletBalance(
                wallet,
                walletType
              ),

            balanceAfter:
              getWalletBalance(
                wallet,
                walletType
              ),

            referenceId:
              withdrawal.referenceId,

            status:
              "REJECTED",

            note:
              `Withdrawal rejected and locked balance released. Reason: ${rejectionReason}`,
          },
        ],
        {
          session,
        }
      );

      // ==================================================
      // COMMIT TRANSACTION
      // ==================================================

      await session.commitTransaction();

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Withdrawal rejected successfully.",

        withdrawal: {
          id:
            withdrawal._id,

          referenceId:
            withdrawal.referenceId,

          username:
            withdrawal.username,

          walletType:
            withdrawal.walletType,

          amount:
            withdrawal.amount,

          status:
            withdrawal.status,

          rejectionReason:
            withdrawal.rejectionReason,

          rejectedBy:
            adminUsername,

          rejectedAt:
            withdrawal.rejectedAt,
        },

        wallet: {
          balance:
            getWalletBalance(
              wallet,
              walletType
            ),

          locked:
            newLockedBalance,

          available:
            getAvailableBalance(
              wallet,
              walletType
            ),
        },
      });
    } catch (error) {
      // ==================================================
      // TRANSACTION ROLLBACK
      // ==================================================

      try {
        if (
          session &&
          session.inTransaction()
        ) {
          await session.abortTransaction();
        }
      } catch (
        rollbackError
      ) {
        console.error(
          "REJECT WITHDRAW ROLLBACK ERROR:",
          rollbackError
        );
      }

      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "REJECT WITHDRAW ERROR:",
        error
      );

      // ==================================================
      // ERROR RESPONSE
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to reject withdrawal.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    } finally {
      // ==================================================
      // END DATABASE SESSION
      // ==================================================

      if (session) {
        await session.endSession();
      }
    }
  }
);

// ADMIN — CANCEL WITHDRAWAL
// POST /api/withdraw/admin/:withdrawId/cancel
// ======================================================

router.post(
  "/admin/:withdrawId/cancel",
  verifyToken,
  isAdmin,
  async (req, res) => {
    let session;

    try {
      // ==================================================
      // VALIDATE WITHDRAWAL ID
      // ==================================================

      const withdrawId = String(
        req.params.withdrawId || ""
      ).trim();

      if (
        !withdrawId ||
        !mongoose.Types.ObjectId.isValid(
          withdrawId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid withdrawal ID.",
        });
      }

      // ==================================================
      // ADMIN INFORMATION
      // ==================================================

      const adminId = String(
        req.user?.id ||
          req.user?._id ||
          ""
      ).trim();

      const adminUsername = String(
        req.user?.username || ""
      ).trim();

      // ==================================================
      // CANCELLATION REASON
      // ==================================================

      const cancelReason =
        cleanString(
          req.body?.reason ||
            req.body?.cancelReason ||
            "Withdrawal cancelled by admin."
        ) ||
        "Withdrawal cancelled by admin.";

      // ==================================================
      // START MONGODB SESSION
      // ==================================================

      session =
        await mongoose.startSession();

      session.startTransaction();

      // ==================================================
      // FIND WITHDRAWAL
      // ==================================================

      const withdrawal =
        await Withdraw.findById(
          withdrawId
        ).session(session);

      if (!withdrawal) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          message:
            "Withdrawal request not found.",
        });
      }

      // ==================================================
      // VALIDATE CURRENT STATUS
      // ==================================================

      const currentStatus =
        normalizeWithdrawStatus(
          withdrawal.status
        );

      if (currentStatus !== "PENDING") {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,
          message:
            `Withdrawal cannot be cancelled because its current status is ${
              currentStatus || "UNKNOWN"
            }.`,
          status:
            withdrawal.status,
        });
      }

      // ==================================================
      // WITHDRAWAL USER INFORMATION
      // ==================================================

      const withdrawalUserId =
        String(
          withdrawal.userId || ""
        ).trim();

      const withdrawalUsername =
        String(
          withdrawal.username || ""
        ).trim();

      // ==================================================
      // WALLET TYPE
      // ==================================================

      const walletType =
        normalizeWalletType(
          withdrawal.walletType
        );

      // ==================================================
      // WITHDRAWAL AMOUNT
      // ==================================================

      const amount =
        toSafeNumber(
          withdrawal.amount ??
            withdrawal.requestAmount
        );

      // ==================================================
      // VALIDATE WALLET TYPE
      // ==================================================

      if (
        !["PKR", "USDT", "GOLD"].includes(
          walletType
        )
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal wallet type.",
        });
      }

      // ==================================================
      // VALIDATE AMOUNT
      // ==================================================

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message:
            "Invalid withdrawal amount.",
        });
      }

      // ==================================================
      // GET USER WALLET
      // ==================================================

      const wallet =
        await getWallet({
          userId:
            withdrawalUserId,
          username:
            withdrawalUsername,
          session,
        });

      if (!wallet) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          message:
            "User wallet not found.",
        });
      }

      // ==================================================
      // GET CURRENT BALANCES
      // ==================================================

      const currentBalance =
        getWalletBalance(
          wallet,
          walletType
        );

      const lockedBalance =
        getLockedBalance(
          wallet,
          walletType
        );

      // ==================================================
      // VALIDATE LOCKED BALANCE
      // ==================================================

      if (
        lockedBalance < amount
      ) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,
          message:
            "Locked withdrawal amount is inconsistent with wallet records.",

          wallet: {
            balance:
              currentBalance,

            locked:
              lockedBalance,

            withdrawalAmount:
              amount,
          },
        });
      }

      // ==================================================
      // WALLET BEFORE SNAPSHOT
      // ==================================================

      const walletBefore = {
        pkrBalance:
          toSafeNumber(
            wallet.pkrBalance
          ),

        usdtBalance:
          toSafeNumber(
            wallet.usdtBalance
          ),

        goldBalance:
          toSafeNumber(
            wallet.goldBalance
          ),

        lockedPkr:
          toSafeNumber(
            wallet.lockedPkr
          ),

        lockedUsdt:
          toSafeNumber(
            wallet.lockedUsdt
          ),

        lockedGold:
          toSafeNumber(
            wallet.lockedGold
          ),
      };

      // ==================================================
      // RELEASE LOCKED AMOUNT
      // ==================================================
      // Cancellation does NOT deduct wallet balance.
      // Only the locked amount is released.
      // ==================================================

      const newLockedBalance =
        lockedBalance - amount;

      setLockedBalance(
        wallet,
        walletType,
        newLockedBalance
      );

      // ==================================================
      // WALLET AFTER SNAPSHOT
      // ==================================================

      const walletAfter = {
        pkrBalance:
          toSafeNumber(
            wallet.pkrBalance
          ),

        usdtBalance:
          toSafeNumber(
            wallet.usdtBalance
          ),

        goldBalance:
          toSafeNumber(
            wallet.goldBalance
          ),

        lockedPkr:
          toSafeNumber(
            wallet.lockedPkr
          ),

        lockedUsdt:
          toSafeNumber(
            wallet.lockedUsdt
          ),

        lockedGold:
          toSafeNumber(
            wallet.lockedGold
          ),
      };

      // ==================================================
      // SAVE WALLET
      // ==================================================

      await wallet.save({
        session,
      });

      // ==================================================
      // UPDATE WITHDRAWAL
      // ==================================================

      withdrawal.status =
        "CANCELLED";

      withdrawal.walletBefore =
        walletBefore;

      withdrawal.walletAfter =
        walletAfter;

      withdrawal.cancelledBy =
        adminId || undefined;

      withdrawal.cancelledByUsername =
        adminUsername || undefined;

      withdrawal.cancelReason =
        cancelReason;

      withdrawal.cancelledAt =
        new Date();

      withdrawal.processedAt =
        new Date();

      // ==================================================
      // SAVE WITHDRAWAL
      // ==================================================

      await withdrawal.save({
        session,
      });

      // ==================================================
      // WALLET HISTORY
      // ==================================================

      await WalletHistory.create(
        [
          {
            userId:
              withdrawalUserId,

            username:
              withdrawalUsername,

            walletType,

            type: "WITHDRAW",

            amount,

            balanceBefore:
              currentBalance,

            balanceAfter:
              currentBalance,

            referenceId:
              withdrawal.referenceId,

            note:
              `Withdrawal cancelled. Locked amount released. Reason: ${cancelReason}`,

            status:
              "CANCELLED",
          },
        ],
        {
          session,
        }
      );

      // ==================================================
      // TRANSACTION LEDGER
      // ==================================================

      await Transaction.create(
        [
          {
            userId:
              withdrawalUserId,

            username:
              withdrawalUsername,

            walletType,

            transactionType:
              "WITHDRAW",

            transactionMode:
              "CANCEL",

            amount,

            balanceBefore:
              currentBalance,

            balanceAfter:
              currentBalance,

            referenceId:
              withdrawal.referenceId,

            status:
              "CANCELLED",

            note:
              `Withdrawal cancelled and locked balance released. Reason: ${cancelReason}`,
          },
        ],
        {
          session,
        }
      );

      // ==================================================
      // COMMIT TRANSACTION
      // ==================================================

      await session.commitTransaction();

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Withdrawal cancelled successfully.",

        withdrawal: {
          id:
            withdrawal._id,

          referenceId:
            withdrawal.referenceId,

          username:
            withdrawal.username,

          walletType:
            withdrawal.walletType,

          amount:
            withdrawal.amount,

          status:
            withdrawal.status,

          cancellationReason:
            withdrawal.cancelReason,

          cancelledBy:
            adminUsername,

          cancelledAt:
            withdrawal.cancelledAt,
        },

        wallet: {
          balance:
            currentBalance,

          locked:
            newLockedBalance,

          available:
            Math.max(
              0,
              currentBalance -
                newLockedBalance
            ),
        },
      });
    } catch (error) {
      // ==================================================
      // ROLLBACK TRANSACTION
      // ==================================================

      if (
        session?.inTransaction()
      ) {
        try {
          await session.abortTransaction();
        } catch (rollbackError) {
          console.error(
            "CANCEL WITHDRAW ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "CANCEL WITHDRAW ERROR:",
        error
      );

      // ==================================================
      // ERROR RESPONSE
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to cancel withdrawal.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    } finally {
      // ==================================================
      // END MONGODB SESSION
      // ==================================================

      if (session) {
        await session.endSession();
      }
    }
  }
);

// ======================================================
// ADMIN — DELETE WITHDRAWAL
// DELETE /api/withdraw/admin/:withdrawId
// ======================================================

router.delete(
  "/admin/:withdrawId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    let session;

    try {
      // ==================================================
      // VALIDATE WITHDRAWAL ID
      // ==================================================

      const withdrawId = String(
        req.params.withdrawId || ""
      ).trim();

      if (
        !withdrawId ||
        !mongoose.Types.ObjectId.isValid(
          withdrawId
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid withdrawal ID.",
        });
      }

      // ==================================================
      // START MONGODB SESSION
      // ==================================================

      session =
        await mongoose.startSession();

      session.startTransaction();

      // ==================================================
      // FIND WITHDRAWAL
      // ==================================================

      const withdrawal =
        await Withdraw.findById(
          withdrawId
        ).session(session);

      if (!withdrawal) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,
          message: "Withdrawal not found.",
        });
      }

      // ==================================================
      // NORMALIZE CURRENT STATUS
      // ==================================================

      const currentStatus =
        normalizeWithdrawStatus(
          withdrawal.status
        );

      // ==================================================
      // NEVER DELETE APPROVED
      // FINANCIAL RECORD
      // ==================================================

      if (currentStatus === "APPROVED") {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,
          message:
            "Approved withdrawal records cannot be deleted.",
        });
      }

      // ==================================================
      // WITHDRAWAL USER INFORMATION
      // ==================================================

      const withdrawalUserId =
        String(
          withdrawal.userId || ""
        ).trim();

      const withdrawalUsername =
        String(
          withdrawal.username || ""
        ).trim();

      // ==================================================
      // WALLET TYPE
      // ==================================================

      const walletType =
        normalizeWalletType(
          withdrawal.walletType
        );

      // ==================================================
      // WITHDRAWAL AMOUNT
      // ==================================================

      const amount =
        toSafeNumber(
          withdrawal.amount ??
            withdrawal.requestAmount
        );

      // ==================================================
      // VALIDATE AMOUNT
      // ==================================================

      if (
        !Number.isFinite(amount) ||
        amount < 0
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message:
            "Withdrawal contains an invalid amount. Withdrawal was not deleted.",
        });
      }

      // ==================================================
      // PENDING WITHDRAWAL
      // RELEASE LOCK BEFORE DELETE
      // ==================================================

      if (
        currentStatus === "PENDING" &&
        ["PKR", "USDT", "GOLD"].includes(
          walletType
        ) &&
        amount > 0
      ) {
        // ----------------------------------------------
        // GET USER WALLET
        // ----------------------------------------------

        const wallet =
          await getWallet({
            userId:
              withdrawalUserId,
            username:
              withdrawalUsername,
            session,
          });

        if (!wallet) {
          await session.abortTransaction();

          return res.status(404).json({
            success: false,
            message:
              "User wallet not found. Pending withdrawal was not deleted.",
          });
        }

        // ----------------------------------------------
        // GET LOCKED BALANCE
        // ----------------------------------------------

        const lockedBalance =
          getLockedBalance(
            wallet,
            walletType
          );

        // ----------------------------------------------
        // VALIDATE LOCK
        // ----------------------------------------------

        if (
          lockedBalance < amount
        ) {
          await session.abortTransaction();

          return res.status(409).json({
            success: false,
            message:
              "Wallet lock is inconsistent. Withdrawal was not deleted.",

            wallet: {
              locked:
                lockedBalance,

              withdrawalAmount:
                amount,
            },
          });
        }

        // ----------------------------------------------
        // RELEASE LOCK
        // ----------------------------------------------

        const newLockedBalance =
          lockedBalance - amount;

        setLockedBalance(
          wallet,
          walletType,
          newLockedBalance
        );

        // ----------------------------------------------
        // SAVE WALLET
        // ----------------------------------------------

        await wallet.save({
          session,
        });
      }

      // ==================================================
      // DELETE WITHDRAWAL
      // ==================================================

      const deleteResult =
        await Withdraw.deleteOne(
          {
            _id: withdrawId,
          },
          {
            session,
          }
        );

      // ==================================================
      // VERIFY DELETE
      // ==================================================

      if (
        deleteResult.deletedCount !== 1
      ) {
        throw new Error(
          "Withdrawal could not be deleted."
        );
      }

      // ==================================================
      // COMMIT TRANSACTION
      // ==================================================

      await session.commitTransaction();

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Withdrawal deleted successfully.",

        deletedWithdrawalId:
          withdrawId,
      });
    } catch (error) {
      // ==================================================
      // ROLLBACK TRANSACTION
      // ==================================================

      if (
        session?.inTransaction()
      ) {
        try {
          await session.abortTransaction();
        } catch (rollbackError) {
          console.error(
            "DELETE WITHDRAW ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "DELETE WITHDRAW ERROR:",
        error
      );

      // ==================================================
      // ERROR RESPONSE
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to delete withdrawal.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    } finally {
      // ==================================================
      // END MONGODB SESSION
      // ==================================================

      if (session) {
        await session.endSession();
      }
    }
  }
);

// ======================================================
// ADMIN — BULK APPROVE
// POST /api/withdraw/admin/bulk-approve
// ======================================================

router.post(
  "/admin/bulk-approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    let session;

    try {
      // ==================================================
      // ADMIN INFORMATION
      // ==================================================

      const adminId = String(
        req.user?.id ||
          req.user?._id ||
          ""
      ).trim();

      const adminUsername = String(
        req.user?.username || ""
      ).trim();

      // ==================================================
      // GET WITHDRAWAL IDS
      // ==================================================

      const withdrawalIds = Array.isArray(
        req.body?.withdrawalIds
      )
        ? req.body.withdrawalIds
            .map((id) =>
              String(id || "").trim()
            )
            .filter(Boolean)
        : [];

      // ==================================================
      // VALIDATE ARRAY
      // ==================================================

      if (withdrawalIds.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "withdrawalIds array is required.",
        });
      }

      // ==================================================
      // MAXIMUM BULK LIMIT
      // ==================================================

      if (withdrawalIds.length > 50) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum 50 withdrawals can be approved at once.",
        });
      }

      // ==================================================
      // REMOVE DUPLICATE IDS
      // ==================================================

      const validIds = [
        ...new Set(
          withdrawalIds.filter((id) =>
            mongoose.Types.ObjectId.isValid(
              id
            )
          )
        ),
      ];

      // ==================================================
      // VALIDATE IDS
      // ==================================================

      if (validIds.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No valid withdrawal IDs were provided.",
        });
      }

      // ==================================================
      // START MONGODB SESSION
      // ==================================================

      session =
        await mongoose.startSession();

      session.startTransaction();

      // ==================================================
      // RESULTS
      // ==================================================

      const results = [];

      // ==================================================
      // PROCESS EACH WITHDRAWAL
      // ==================================================

      for (const withdrawalId of validIds) {
        try {
          // ----------------------------------------------
          // FIND WITHDRAWAL
          // ----------------------------------------------

          const withdrawal =
            await Withdraw.findById(
              withdrawalId
            ).session(session);

          if (!withdrawal) {
            throw new Error(
              "Withdrawal request not found."
            );
          }

          // ----------------------------------------------
          // CURRENT STATUS
          // ----------------------------------------------

          const currentStatus =
            normalizeWithdrawStatus(
              withdrawal.status
            );

          if (
            currentStatus !== "PENDING"
          ) {
            throw new Error(
              `Withdrawal cannot be approved because its current status is ${
                currentStatus || "UNKNOWN"
              }.`
            );
          }

          // ----------------------------------------------
          // USER INFORMATION
          // ----------------------------------------------

          const withdrawalUserId =
            String(
              withdrawal.userId || ""
            ).trim();

          const withdrawalUsername =
            String(
              withdrawal.username || ""
            ).trim();

          // ----------------------------------------------
          // WALLET TYPE
          // ----------------------------------------------

          const walletType =
            normalizeWalletType(
              withdrawal.walletType
            );

          if (
            !["PKR", "USDT", "GOLD"].includes(
              walletType
            )
          ) {
            throw new Error(
              "Invalid withdrawal wallet type."
            );
          }

          // ----------------------------------------------
          // WITHDRAWAL AMOUNT
          // ----------------------------------------------

          const amount =
            toSafeNumber(
              withdrawal.amount ??
                withdrawal.requestAmount
            );

          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            throw new Error(
              "Invalid withdrawal amount."
            );
          }

          // ----------------------------------------------
          // GET WALLET
          // ----------------------------------------------

          const wallet =
            await getWallet({
              userId:
                withdrawalUserId,
              username:
                withdrawalUsername,
              session,
            });

          if (!wallet) {
            throw new Error(
              "User wallet not found."
            );
          }

          // ----------------------------------------------
          // CURRENT BALANCE
          // ----------------------------------------------

          const currentBalance =
            getWalletBalance(
              wallet,
              walletType
            );

          // ----------------------------------------------
          // CURRENT LOCKED BALANCE
          // ----------------------------------------------

          const lockedBalance =
            getLockedBalance(
              wallet,
              walletType
            );

          // ----------------------------------------------
          // VALIDATE LOCKED AMOUNT
          // ----------------------------------------------

          if (
            lockedBalance < amount
          ) {
            throw new Error(
              "Locked withdrawal amount is inconsistent with wallet records."
            );
          }

          // ----------------------------------------------
          // WALLET BEFORE SNAPSHOT
          // ----------------------------------------------

          const walletBefore = {
            pkrBalance:
              toSafeNumber(
                wallet.pkrBalance
              ),

            usdtBalance:
              toSafeNumber(
                wallet.usdtBalance
              ),

            goldBalance:
              toSafeNumber(
                wallet.goldBalance
              ),

            lockedPkr:
              toSafeNumber(
                wallet.lockedPkr
              ),

            lockedUsdt:
              toSafeNumber(
                wallet.lockedUsdt
              ),

            lockedGold:
              toSafeNumber(
                wallet.lockedGold
              ),
          };

          // ----------------------------------------------
          // DEDUCT WITHDRAWAL AMOUNT
          // ----------------------------------------------

          const newBalance =
            currentBalance - amount;

          if (newBalance < 0) {
            throw new Error(
              "Insufficient wallet balance."
            );
          }

          switch (walletType) {
            case "PKR":
              wallet.pkrBalance =
                newBalance;
              break;

            case "USDT":
              wallet.usdtBalance =
                newBalance;
              break;

            case "GOLD":
              wallet.goldBalance =
                newBalance;
              break;

            default:
              throw new Error(
                "Invalid wallet type."
              );
          }

          // ----------------------------------------------
          // RELEASE LOCKED AMOUNT
          // ----------------------------------------------

          const newLockedBalance =
            Math.max(
              0,
              lockedBalance - amount
            );

          setLockedBalance(
            wallet,
            walletType,
            newLockedBalance
          );

          // ----------------------------------------------
          // WALLET AFTER SNAPSHOT
          // ----------------------------------------------

          const walletAfter = {
            pkrBalance:
              toSafeNumber(
                wallet.pkrBalance
              ),

            usdtBalance:
              toSafeNumber(
                wallet.usdtBalance
              ),

            goldBalance:
              toSafeNumber(
                wallet.goldBalance
              ),

            lockedPkr:
              toSafeNumber(
                wallet.lockedPkr
              ),

            lockedUsdt:
              toSafeNumber(
                wallet.lockedUsdt
              ),

            lockedGold:
              toSafeNumber(
                wallet.lockedGold
              ),
          };

          // ----------------------------------------------
          // SAVE WALLET
          // ----------------------------------------------

          await wallet.save({
            session,
          });

          // ----------------------------------------------
          // UPDATE WITHDRAWAL
          // ----------------------------------------------

          withdrawal.status =
            "APPROVED";

          withdrawal.walletBefore =
            walletBefore;

          withdrawal.walletAfter =
            walletAfter;

          withdrawal.approvedBy =
            adminId || undefined;

          withdrawal.approvedByUsername =
            adminUsername || undefined;

          withdrawal.approvedAt =
            new Date();

          withdrawal.processedAt =
            new Date();

          // ----------------------------------------------
          // SAVE WITHDRAWAL
          // ----------------------------------------------

          await withdrawal.save({
            session,
          });

          // ----------------------------------------------
          // WALLET HISTORY
          // ----------------------------------------------

          await WalletHistory.create(
            [
              {
                userId:
                  withdrawalUserId,

                username:
                  withdrawalUsername,

                walletType,

                type:
                  "WITHDRAW",

                amount,

                balanceBefore:
                  currentBalance,

                balanceAfter:
                  newBalance,

                referenceId:
                  withdrawal.referenceId,

                note:
                  "Bulk withdrawal approval.",

                status:
                  "APPROVED",
              },
            ],
            {
              session,
            }
          );

          // ----------------------------------------------
          // TRANSACTION LEDGER
          // ----------------------------------------------

          await Transaction.create(
            [
              {
                userId:
                  withdrawalUserId,

                username:
                  withdrawalUsername,

                walletType,

                transactionType:
                  "WITHDRAW",

                transactionMode:
                  "DEBIT",

                amount,

                balanceBefore:
                  currentBalance,

                balanceAfter:
                  newBalance,

                referenceId:
                  withdrawal.referenceId,

                status:
                  "APPROVED",

                note:
                  "Bulk withdrawal approval.",
              },
            ],
            {
              session,
            }
          );

          // ----------------------------------------------
          // SUCCESS RESULT
          // ----------------------------------------------

          results.push({
            id:
              withdrawalId,

            success:
              true,

            status:
              "APPROVED",

            amount,

            walletType,
          });
        } catch (itemError) {
          // ----------------------------------------------
          // ITEM ERROR
          // ----------------------------------------------

          throw new Error(
            `Withdrawal ${withdrawalId} failed: ${
              itemError.message ||
              "Unable to process withdrawal."
            }`
          );
        }
      }

      // ==================================================
      // TRANSACTION COMMIT
      // ==================================================

      await session.commitTransaction();

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      const successful =
        results.filter(
          (item) =>
            item.success === true
        ).length;

      const failed =
        results.length -
        successful;

      return res.status(200).json({
        success: true,

        message:
          "Bulk withdrawal approval completed.",

        summary: {
          requested:
            validIds.length,

          total:
            results.length,

          successful,

          failed,
        },

        results,
      });
    } catch (error) {
      // ==================================================
      // ROLLBACK TRANSACTION
      // ==================================================

      if (
        session?.inTransaction()
      ) {
        try {
          await session.abortTransaction();
        } catch (rollbackError) {
          console.error(
            "BULK APPROVE WITHDRAW ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "BULK APPROVE WITHDRAW ERROR:",
        error
      );

      // ==================================================
      // ERROR RESPONSE
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to bulk approve withdrawals.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    } finally {
      // ==================================================
      // END MONGODB SESSION
      // ==================================================

      if (session) {
        await session.endSession();
      }
    }
  }
);

// ======================================================
// ADMIN — BULK REJECT
// POST /api/withdraw/admin/bulk-reject
// ======================================================

router.post(
  "/admin/bulk-reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    let session;

    try {
      // ==================================================
      // ADMIN INFORMATION
      // ==================================================

      const adminId = String(
        req.user?.id ||
          req.user?._id ||
          ""
      ).trim();

      const adminUsername = String(
        req.user?.username || ""
      ).trim();

      // ==================================================
      // WITHDRAWAL IDS
      // ==================================================

      const withdrawalIds =
        Array.isArray(
          req.body?.withdrawalIds
        )
          ? req.body.withdrawalIds
              .map((id) =>
                String(id || "").trim()
              )
              .filter(Boolean)
          : [];

      // ==================================================
      // VALIDATE ARRAY
      // ==================================================

      if (
        withdrawalIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "withdrawalIds array is required.",
        });
      }

      // ==================================================
      // MAXIMUM BULK LIMIT
      // ==================================================

      if (
        withdrawalIds.length > 50
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum 50 withdrawals can be rejected at once.",
        });
      }

      // ==================================================
      // REMOVE DUPLICATES
      // ==================================================

      const validIds = [
        ...new Set(
          withdrawalIds.filter(
            (id) =>
              mongoose.Types.ObjectId.isValid(
                id
              )
          )
        ),
      ];

      // ==================================================
      // VALIDATE IDS
      // ==================================================

      if (
        validIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No valid withdrawal IDs were provided.",
        });
      }

      // ==================================================
      // START MONGODB SESSION
      // ==================================================

      session =
        await mongoose.startSession();

      session.startTransaction();

      // ==================================================
      // RESULTS
      // ==================================================

      const results = [];

      // ==================================================
      // PROCESS EACH WITHDRAWAL
      // ==================================================

      for (
        const withdrawalId of validIds
      ) {
        try {
          // ----------------------------------------------
          // FIND WITHDRAWAL
          // ----------------------------------------------

          const withdrawal =
            await Withdraw.findById(
              withdrawalId
            ).session(session);

          if (!withdrawal) {
            throw new Error(
              "Withdrawal request not found."
            );
          }

          // ----------------------------------------------
          // CURRENT STATUS
          // ----------------------------------------------

          const currentStatus =
            normalizeWithdrawStatus(
              withdrawal.status
            );

          if (
            currentStatus !== "PENDING"
          ) {
            throw new Error(
              `Withdrawal cannot be rejected because its current status is ${
                currentStatus ||
                "UNKNOWN"
              }.`
            );
          }

          // ----------------------------------------------
          // USER INFORMATION
          // ----------------------------------------------

          const withdrawalUserId =
            String(
              withdrawal.userId || ""
            ).trim();

          const withdrawalUsername =
            String(
              withdrawal.username || ""
            ).trim();

          // ----------------------------------------------
          // WALLET TYPE
          // ----------------------------------------------

          const walletType =
            normalizeWalletType(
              withdrawal.walletType
            );

          if (
            ![
              "PKR",
              "USDT",
              "GOLD",
            ].includes(walletType)
          ) {
            throw new Error(
              "Invalid withdrawal wallet type."
            );
          }

          // ----------------------------------------------
          // WITHDRAWAL AMOUNT
          // ----------------------------------------------

          const amount =
            toSafeNumber(
              withdrawal.amount ??
                withdrawal.requestAmount
            );

          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            throw new Error(
              "Invalid withdrawal amount."
            );
          }

          // ----------------------------------------------
          // GET WALLET
          // ----------------------------------------------

          const wallet =
            await getWallet({
              userId:
                withdrawalUserId,
              username:
                withdrawalUsername,
              session,
            });

          if (!wallet) {
            throw new Error(
              "User wallet not found."
            );
          }

          // ----------------------------------------------
          // CURRENT BALANCE
          // ----------------------------------------------

          const currentBalance =
            getWalletBalance(
              wallet,
              walletType
            );

          // ----------------------------------------------
          // CURRENT LOCKED BALANCE
          // ----------------------------------------------

          const lockedBalance =
            getLockedBalance(
              wallet,
              walletType
            );

          // ----------------------------------------------
          // VALIDATE LOCKED AMOUNT
          // ----------------------------------------------

          if (
            lockedBalance < amount
          ) {
            throw new Error(
              "Locked withdrawal amount is inconsistent with wallet records."
            );
          }

          // ----------------------------------------------
          // RELEASE LOCK
          // ----------------------------------------------

          const newLockedBalance =
            lockedBalance - amount;

          setLockedBalance(
            wallet,
            walletType,
            newLockedBalance
          );

          // ----------------------------------------------
          // SAVE WALLET
          // ----------------------------------------------

          await wallet.save({
            session,
          });

          // ----------------------------------------------
          // REJECTION REASON
          // ----------------------------------------------

          const rejectionReason =
            cleanString(
              req.body?.reason ||
                req.body?.rejectionReason ||
                "Withdrawal rejected by admin."
            ) ||
            "Withdrawal rejected by admin.";

          // ----------------------------------------------
          // UPDATE WITHDRAWAL
          // ----------------------------------------------

          withdrawal.status =
            "REJECTED";

          withdrawal.rejectionReason =
            rejectionReason;

          withdrawal.rejectedBy =
            adminId || undefined;

          withdrawal.rejectedByUsername =
            adminUsername || undefined;

          withdrawal.rejectedAt =
            new Date();

          withdrawal.processedAt =
            new Date();

          // ----------------------------------------------
          // SAVE WITHDRAWAL
          // ----------------------------------------------

          await withdrawal.save({
            session,
          });

          // ----------------------------------------------
          // WALLET HISTORY
          // ----------------------------------------------

          await WalletHistory.create(
            [
              {
                userId:
                  withdrawalUserId,

                username:
                  withdrawalUsername,

                walletType,

                type:
                  "WITHDRAW",

                amount,

                balanceBefore:
                  currentBalance,

                balanceAfter:
                  currentBalance,

                referenceId:
                  withdrawal.referenceId,

                note:
                  `Bulk withdrawal rejection. Reason: ${rejectionReason}`,

                status:
                  "REJECTED",
              },
            ],
            {
              session,
            }
          );

          // ----------------------------------------------
          // TRANSACTION LEDGER
          // ----------------------------------------------

          await Transaction.create(
            [
              {
                userId:
                  withdrawalUserId,

                username:
                  withdrawalUsername,

                walletType,

                transactionType:
                  "WITHDRAW",

                transactionMode:
                  "RELEASE",

                amount,

                balanceBefore:
                  currentBalance,

                balanceAfter:
                  currentBalance,

                referenceId:
                  withdrawal.referenceId,

                status:
                  "REJECTED",

                note:
                  `Bulk withdrawal rejection. Reason: ${rejectionReason}`,
              },
            ],
            {
              session,
            }
          );

          // ----------------------------------------------
          // SUCCESS RESULT
          // ----------------------------------------------

          results.push({
            id:
              withdrawalId,

            success:
              true,

            status:
              "REJECTED",

            amount,

            walletType,
          });
        } catch (itemError) {
          // ----------------------------------------------
          // ITEM ERROR
          // ----------------------------------------------

          throw new Error(
            `Withdrawal ${withdrawalId} failed: ${
              itemError.message ||
              "Unable to reject withdrawal."
            }`
          );
        }
      }

      // ==================================================
      // COMMIT TRANSACTION
      // ==================================================

      await session.commitTransaction();

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      const successful =
        results.filter(
          (item) =>
            item.success === true
        ).length;

      const failed =
        results.length -
        successful;

      return res.status(200).json({
        success: true,

        message:
          "Bulk withdrawal rejection completed.",

        summary: {
          requested:
            validIds.length,

          total:
            results.length,

          successful,

          failed,
        },

        results,
      });
    } catch (error) {
      // ==================================================
      // ROLLBACK TRANSACTION
      // ==================================================

      if (
        session?.inTransaction()
      ) {
        try {
          await session.abortTransaction();
        } catch (rollbackError) {
          console.error(
            "BULK REJECT WITHDRAW ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "BULK REJECT WITHDRAW ERROR:",
        error
      );

      // ==================================================
      // ERROR RESPONSE
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to bulk reject withdrawals.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    } finally {
      // ==================================================
      // END MONGODB SESSION
      // ==================================================

      if (session) {
        await session.endSession();
      }
    }
  }
);

// ======================================================
// ADMIN — PENDING COUNT
// GET /api/withdraw/admin/pending-count
// ======================================================

router.get(
  "/admin/pending-count",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // COUNT PENDING WITHDRAWALS
      // ==================================================

      const count =
        await Withdraw.countDocuments({
          status: "PENDING",
        });

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        count,

        pendingCount:
          count,
      });
    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "PENDING WITHDRAW COUNT ERROR:",
        error
      );

      // ==================================================
      // ERROR RESPONSE
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to load pending withdrawal count.",

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
// ADMIN — BULK REJECT
// POST /api/withdraw/admin/bulk-reject
// ======================================================

router.post(
  "/admin/bulk-reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    let session;

    try {
      // ==================================================
      // ADMIN INFORMATION
      // ==================================================

      const adminId =
        String(
          req.user?.id ||
            req.user?._id ||
            ""
        ).trim();

      const adminUsername =
        String(
          req.user?.username ||
            ""
        ).trim();

      // ==================================================
      // GET WITHDRAWAL IDS
      // ==================================================

      const withdrawalIds =
        Array.isArray(
          req.body?.withdrawalIds
        )
          ? req.body.withdrawalIds
          : [];

      // ==================================================
      // VALIDATE ARRAY
      // ==================================================

      if (
        withdrawalIds.length === 0
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "withdrawalIds array is required.",
        });
      }

      // ==================================================
      // MAXIMUM BULK LIMIT
      // ==================================================

      if (
        withdrawalIds.length > 50
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "Maximum 50 withdrawals can be rejected at once.",
        });
      }

      // ==================================================
      // CLEAN + VALIDATE IDS
      // ==================================================

      const validIds = [
        ...new Set(
          withdrawalIds
            .map(
              (id) =>
                String(
                  id || ""
                ).trim()
            )
            .filter(
              (id) =>
                mongoose.Types.ObjectId.isValid(
                  id
                )
            )
        ),
      ];

      // ==================================================
      // VALIDATE IDS
      // ==================================================

      if (
        validIds.length === 0
      ) {
        return res.status(400).json({
          success:
            false,

          message:
            "No valid withdrawal IDs were provided.",
        });
      }

      // ==================================================
      // REJECTION REASON
      // ==================================================

      const rejectionReason =
        cleanString(
          req.body?.reason ||
            req.body?.rejectionReason ||
            "Withdrawal rejected by admin."
        ) ||
        "Withdrawal rejected by admin.";

      // ==================================================
      // START MONGODB TRANSACTION
      // ==================================================

      session =
        await mongoose.startSession();

      session.startTransaction();

      // ==================================================
      // RESULT COLLECTION
      // ==================================================

      const results = [];

      // ==================================================
      // PROCESS EACH WITHDRAWAL
      // ==================================================

      for (
        const withdrawalId of validIds
      ) {
        try {
          // ----------------------------------------------
          // FIND WITHDRAWAL
          // ----------------------------------------------

          const withdrawal =
            await Withdraw.findById(
              withdrawalId
            ).session(
              session
            );

          if (!withdrawal) {
            results.push({
              id:
                withdrawalId,

              success:
                false,

              message:
                "Withdrawal not found.",
            });

            continue;
          }

          // ----------------------------------------------
          // CHECK STATUS
          // ----------------------------------------------

          const currentStatus =
            normalizeWithdrawStatus(
              withdrawal.status
            );

          if (
            currentStatus !==
            "PENDING"
          ) {
            results.push({
              id:
                withdrawalId,

              success:
                false,

              message:
                `Current status is ${
                  currentStatus ||
                  "UNKNOWN"
                }.`,
            });

            continue;
          }

          // ----------------------------------------------
          // WALLET TYPE
          // ----------------------------------------------

          const walletType =
            normalizeWalletType(
              withdrawal.walletType
            );

          // ----------------------------------------------
          // AMOUNT
          // ----------------------------------------------

          const amount =
            toSafeNumber(
              withdrawal.amount ??
                withdrawal.requestAmount
            );

          // ----------------------------------------------
          // VALIDATE WALLET TYPE
          // ----------------------------------------------

          if (
            ![
              "PKR",
              "USDT",
              "GOLD",
            ].includes(
              walletType
            )
          ) {
            results.push({
              id:
                withdrawalId,

              success:
                false,

              message:
                "Invalid withdrawal wallet type.",
            });

            continue;
          }

          // ----------------------------------------------
          // VALIDATE AMOUNT
          // ----------------------------------------------

          if (
            !Number.isFinite(
              amount
            ) ||
            amount <= 0
          ) {
            results.push({
              id:
                withdrawalId,

              success:
                false,

              message:
                "Invalid withdrawal amount.",
            });

            continue;
          }

          // ----------------------------------------------
          // GET USER WALLET
          // ----------------------------------------------

          const wallet =
            await getWallet({
              userId:
                String(
                  withdrawal.userId ||
                    ""
                ).trim(),

              username:
                String(
                  withdrawal.username ||
                    ""
                ).trim(),

              session,
            });

          if (!wallet) {
            results.push({
              id:
                withdrawalId,

              success:
                false,

              message:
                "User wallet not found.",
            });

            continue;
          }

          // ----------------------------------------------
          // GET LOCKED BALANCE
          // ----------------------------------------------

          const lockedBalance =
            getLockedBalance(
              wallet,
              walletType
            );

          // ----------------------------------------------
          // VALIDATE LOCKED BALANCE
          // ----------------------------------------------

          if (
            lockedBalance <
            amount
          ) {
            results.push({
              id:
                withdrawalId,

              success:
                false,

              message:
                "Locked balance is insufficient.",
            });

            continue;
          }

          // ----------------------------------------------
          // RELEASE LOCK
          // ----------------------------------------------

          const newLockedBalance =
            lockedBalance -
            amount;

          setLockedBalance(
            wallet,
            walletType,
            newLockedBalance
          );

          // ----------------------------------------------
          // WALLET BEFORE SNAPSHOT
          // ----------------------------------------------

          const walletBefore = {
            pkrBalance:
              toSafeNumber(
                wallet.pkrBalance
              ),

            usdtBalance:
              toSafeNumber(
                wallet.usdtBalance
              ),

            goldBalance:
              toSafeNumber(
                wallet.goldBalance
              ),

            lockedPkr:
              toSafeNumber(
                wallet.lockedPkr
              ),

            lockedUsdt:
              toSafeNumber(
                wallet.lockedUsdt
              ),

            lockedGold:
              toSafeNumber(
                wallet.lockedGold
              ),
          };

          // ----------------------------------------------
          // SAVE WALLET
          // ----------------------------------------------

          await wallet.save({
            session,
          });

          // ----------------------------------------------
          // WALLET AFTER SNAPSHOT
          // ----------------------------------------------

          const walletAfter = {
            pkrBalance:
              toSafeNumber(
                wallet.pkrBalance
              ),

            usdtBalance:
              toSafeNumber(
                wallet.usdtBalance
              ),

            goldBalance:
              toSafeNumber(
                wallet.goldBalance
              ),

            lockedPkr:
              toSafeNumber(
                wallet.lockedPkr
              ),

            lockedUsdt:
              toSafeNumber(
                wallet.lockedUsdt
              ),

            lockedGold:
              toSafeNumber(
                wallet.lockedGold
              ),
          };

          // ----------------------------------------------
          // UPDATE WITHDRAWAL
          // ----------------------------------------------

          withdrawal.status =
            "REJECTED";

          withdrawal.walletBefore =
            walletBefore;

          withdrawal.walletAfter =
            walletAfter;

          withdrawal.rejectionReason =
            rejectionReason;

          withdrawal.rejectedBy =
            adminId ||
            undefined;

          withdrawal.rejectedByUsername =
            adminUsername ||
            undefined;

          withdrawal.rejectedAt =
            new Date();

          withdrawal.processedAt =
            new Date();

          // ----------------------------------------------
          // SAVE WITHDRAWAL
          // ----------------------------------------------

          await withdrawal.save({
            session,
          });

          // ----------------------------------------------
          // WALLET HISTORY
          // ----------------------------------------------

          await WalletHistory.create(
            [
              {
                userId:
                  String(
                    withdrawal.userId ||
                      ""
                  ).trim(),

                username:
                  String(
                    withdrawal.username ||
                      ""
                  ).trim(),

                walletType,

                type:
                  "WITHDRAW",

                amount: 0,

                balanceBefore:
                  getWalletBalance(
                    wallet,
                    walletType
                  ),

                balanceAfter:
                  getWalletBalance(
                    wallet,
                    walletType
                  ),

                referenceId:
                  withdrawal.referenceId,

                note:
                  `Withdrawal rejected through bulk admin action. Locked amount released. Reason: ${rejectionReason}`,

                status:
                  "REJECTED",
              },
            ],
            {
              session,
            }
          );

          // ----------------------------------------------
          // TRANSACTION LEDGER
          // ----------------------------------------------

          await Transaction.create(
            [
              {
                userId:
                  String(
                    withdrawal.userId ||
                      ""
                  ).trim(),

                username:
                  String(
                    withdrawal.username ||
                      ""
                  ).trim(),

                walletType,

                transactionType:
                  "WITHDRAW_REJECTED",

                transactionMode:
                  "RELEASE",

                amount: 0,

                balanceBefore:
                  getWalletBalance(
                    wallet,
                    walletType
                  ),

                balanceAfter:
                  getWalletBalance(
                    wallet,
                    walletType
                  ),

                referenceId:
                  withdrawal.referenceId,

                status:
                  "REJECTED",

                note:
                  `Withdrawal rejected through bulk admin action. Locked amount released. Reason: ${rejectionReason}`,
              },
            ],
            {
              session,
            }
          );

          // ----------------------------------------------
          // SUCCESS RESULT
          // ----------------------------------------------

          results.push({
            id:
              withdrawalId,

            success:
              true,

            message:
              "Withdrawal rejected successfully.",

            amount,

            referenceId:
              withdrawal.referenceId,
          });
        } catch (itemError) {
          // ----------------------------------------------
          // INDIVIDUAL ITEM ERROR
          // ----------------------------------------------

          console.error(
            `BULK REJECT ITEM ERROR [${withdrawalId}]:`,
            itemError
          );

          results.push({
            id:
              withdrawalId,

            success:
              false,

            message:
              itemError.message ||
              "Failed to reject withdrawal.",
          });
        }
      }

      // ==================================================
      // RESULT SUMMARY
      // ==================================================

      const successful =
        results.filter(
          (item) =>
            item.success ===
            true
        );

      const failed =
        results.filter(
          (item) =>
            item.success !==
            true
        );

      // ==================================================
      // COMMIT TRANSACTION
      // ==================================================

      await session.commitTransaction();

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success:
          successful.length > 0,

        message:
          `Bulk rejection completed. ${successful.length} rejected, ${failed.length} failed.`,

        total:
          results.length,

        rejected:
          successful.length,

        failed:
          failed.length,

        results,
      });
    } catch (error) {
      // ==================================================
      // ROLLBACK TRANSACTION
      // ==================================================

      if (
        session?.inTransaction()
      ) {
        try {
          await session.abortTransaction();
        } catch (
          rollbackError
        ) {
          console.error(
            "BULK REJECT ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "BULK REJECT WITHDRAW ERROR:",
        error
      );

      // ==================================================
      // ERROR RESPONSE
      // ==================================================

      return res.status(500).json({
        success:
          false,

        message:
          "Unable to process bulk withdrawal rejection.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    } finally {
      // ==================================================
      // END MONGODB SESSION
      // ==================================================

      if (session) {
        await session.endSession();
      }
    }
  }
);
// ======================================================
// ADMIN — DELETE WITHDRAWAL
// DELETE /api/withdraw/admin/:withdrawId
// ======================================================

router.delete(
  "/admin/:withdrawId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    let session;

    try {
      // ==================================================
      // VALIDATE WITHDRAWAL ID
      // ==================================================

      const withdrawId =
        String(
          req.params.withdrawId ||
            ""
        ).trim();

      if (
        !withdrawId ||
        !mongoose.Types.ObjectId.isValid(
          withdrawId
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid withdrawal ID.",
        });
      }

      // ==================================================
      // START SESSION
      // ==================================================

      session =
        await mongoose.startSession();

      session.startTransaction();

      // ==================================================
      // FIND WITHDRAWAL
      // ==================================================

      const withdrawal =
        await Withdraw.findById(
          withdrawId
        ).session(session);

      if (!withdrawal) {
        await session.abortTransaction();

        return res.status(404).json({
          success: false,

          message:
            "Withdrawal request not found.",
        });
      }

      // ==================================================
      // STATUS CHECK
      // ==================================================

      const status =
        normalizeWithdrawStatus(
          withdrawal.status
        );

      /*
       * Pending withdrawals must not be deleted
       * because they may still have a locked balance.
       */

      if (
        status === "PENDING"
      ) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,

          message:
            "Pending withdrawal cannot be deleted. Reject or cancel it first.",
        });
      }

      // ==================================================
      // DELETE WITHDRAWAL
      // ==================================================

      await Withdraw.deleteOne(
        {
          _id:
            withdrawal._id,
        },
        {
          session,
        }
      );

      // ==================================================
      // COMMIT
      // ==================================================

      await session.commitTransaction();

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Withdrawal deleted successfully.",

        withdrawalId:
          withdrawId,
      });
    } catch (error) {
      // ==================================================
      // ROLLBACK
      // ==================================================

      try {
        if (
          session &&
          session.inTransaction()
        ) {
          await session.abortTransaction();
        }
      } catch (
        rollbackError
      ) {
        console.error(
          "DELETE WITHDRAW ROLLBACK ERROR:",
          rollbackError
        );
      }

      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "DELETE WITHDRAW ERROR:",
        error
      );

      // ==================================================
      // ERROR RESPONSE
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to delete withdrawal.",

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    } finally {
      // ==================================================
      // END SESSION
      // ==================================================

      if (session) {
        await session.endSession();
      }
    }
  }
);

// ======================================================
// ADMIN — PENDING WITHDRAWAL COUNT
// GET /api/withdraw/admin/pending-count
// ======================================================

router.get(
  "/admin/pending-count",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // WALLET TYPE FILTER
      // ==================================================

      const walletType =
        normalizeWalletType(
          req.query.walletType
        );

      const query = {
        status: "PENDING",
      };

      if (
        [
          "PKR",
          "USDT",
          "GOLD",
        ].includes(
          walletType
        )
      ) {
        query.walletType =
          walletType;
      }

      // ==================================================
      // COUNT PENDING REQUESTS
      // ==================================================

      const count =
        await Withdraw.countDocuments(
          query
        );

      // ==================================================
      // TOTAL PENDING AMOUNT
      // ==================================================

      const pendingAmountResult =
        await Withdraw.aggregate([
          {
            $match:
              query,
          },

          {
            $group: {
              _id: null,

              amount: {
                $sum: {
                  $ifNull: [
                    "$amount",
                    0,
                  ],
                },
              },
            },
          },
        ]);

      const pendingAmount =
        toSafeNumber(
          pendingAmountResult?.[0]
            ?.amount,
          0
        );

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        count,

        pendingCount:
          count,

        pendingAmount,
      });
    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "ADMIN PENDING COUNT ERROR:",
        error
      );

      // ==================================================
      // ERROR RESPONSE
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to load pending withdrawal count.",

        count: 0,

        pendingCount: 0,

        pendingAmount: 0,

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
// WITHDRAW ROUTER ERROR HANDLER
// ======================================================

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "WITHDRAW ROUTER ERROR:",
      error
    );

    if (
      res.headersSent
    ) {
      return next(error);
    }

    return res.status(500).json({
      success: false,

      message:
        "Internal withdrawal service error.",

      error:
        process.env.NODE_ENV ===
        "production"
          ? undefined
          : error.message,
    });
  }
);

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports =
  router;