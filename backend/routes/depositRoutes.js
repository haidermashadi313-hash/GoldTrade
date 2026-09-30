"use strict";

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");

// ======================================================
// MODELS
// ======================================================

const Deposit = require("../models/Deposit");
const Wallet = require("../models/Wallet");
const User = require("../models/User");
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
// MULTER - DEPOSIT RECEIPT UPLOAD
// ======================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = new Set([
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]);

    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(
        new Error(
          "Invalid receipt file. Only JPG, PNG, WEBP and PDF files are allowed."
        )
      );
    }

    return cb(null, true);
  },
});

// ======================================================
// DEFAULT DEPOSIT SETTINGS
// ======================================================

const DEFAULT_DEPOSIT_SETTINGS = Object.freeze({
  depositsEnabled: true,

  minimumDeposit: 1000,

  maximumDeposit: 10000000,

  depositPaymentMethods: [],
});

// ======================================================
// NORMALIZE PAYMENT METHODS
// ======================================================

const normalizeDepositPaymentMethods = (methods) => {
  if (!Array.isArray(methods)) {
    return [];
  }

  return methods
    .map((method) => {
      if (!method || typeof method !== "object") {
        return null;
      }

      const type = String(method.type || "")
        .trim()
        .toUpperCase();

      if (!type) {
        return null;
      }

      const accountName = String(
        method.accountName ?? ""
      ).trim();

      const accountNumber = String(
        method.accountNumber ?? ""
      ).trim();

      const qrCode = String(
        method.qrCode ?? ""
      ).trim();

      const instructions = String(
        method.instructions ?? ""
      ).trim();

      return {
        type,
        accountName,
        accountNumber,
        qrCode,
        instructions,
        enabled: method.enabled !== false,
      };
    })
    .filter(Boolean);
};

// ======================================================
// NORMALIZE DEPOSIT SETTINGS
// ======================================================

const normalizeDepositSettings = (settings) => {
  if (!settings || typeof settings !== "object") {
    return {
      ...DEFAULT_DEPOSIT_SETTINGS,
      depositPaymentMethods: [],
    };
  }

  const minimumDeposit = Number(
    settings.minimumDeposit
  );

  const maximumDeposit = Number(
    settings.maximumDeposit
  );

  let normalizedMinimum =
    Number.isFinite(minimumDeposit) &&
    minimumDeposit >= 0
      ? minimumDeposit
      : DEFAULT_DEPOSIT_SETTINGS.minimumDeposit;

  let normalizedMaximum =
    Number.isFinite(maximumDeposit) &&
    maximumDeposit > 0
      ? maximumDeposit
      : DEFAULT_DEPOSIT_SETTINGS.maximumDeposit;

  // ----------------------------------------------------
  // SAFETY CHECK
  // ----------------------------------------------------

  if (normalizedMinimum > normalizedMaximum) {
    normalizedMinimum =
      DEFAULT_DEPOSIT_SETTINGS.minimumDeposit;

    normalizedMaximum =
      DEFAULT_DEPOSIT_SETTINGS.maximumDeposit;
  }

  return {
    depositsEnabled:
      settings.depositsEnabled !== false,

    minimumDeposit:
      normalizedMinimum,

    maximumDeposit:
      normalizedMaximum,

    depositPaymentMethods:
      normalizeDepositPaymentMethods(
        settings.depositPaymentMethods
      ),
  };
};

// ======================================================
// GET / CREATE DEPOSIT SETTINGS
// ======================================================

const getDepositSettings = async () => {
  // ----------------------------------------------------
  // FIND EXISTING SETTINGS
  // ----------------------------------------------------

  let settings = await Settings.findOne();

  // ----------------------------------------------------
  // CREATE SETTINGS IF NOT EXISTS
  // ----------------------------------------------------

  if (!settings) {
    settings = await Settings.create({
      depositsEnabled:
        DEFAULT_DEPOSIT_SETTINGS.depositsEnabled,

      minimumDeposit:
        DEFAULT_DEPOSIT_SETTINGS.minimumDeposit,

      maximumDeposit:
        DEFAULT_DEPOSIT_SETTINGS.maximumDeposit,

      depositPaymentMethods:
        normalizeDepositPaymentMethods(
          DEFAULT_DEPOSIT_SETTINGS.depositPaymentMethods
        ),
    });

    console.log(
      "🟢 Default Deposit Settings Created"
    );

    return settings;
  }

  // ----------------------------------------------------
  // TRACK CHANGES
  // ----------------------------------------------------

  let changed = false;

  // ----------------------------------------------------
  // ENSURE depositsEnabled
  // ----------------------------------------------------

  if (
    typeof settings.depositsEnabled !==
    "boolean"
  ) {
    settings.depositsEnabled =
      DEFAULT_DEPOSIT_SETTINGS.depositsEnabled;

    changed = true;
  }

  // ----------------------------------------------------
  // ENSURE minimumDeposit
  // ----------------------------------------------------

  const currentMinimumDeposit = Number(
    settings.minimumDeposit
  );

  if (
    !Number.isFinite(currentMinimumDeposit) ||
    currentMinimumDeposit < 0
  ) {
    settings.minimumDeposit =
      DEFAULT_DEPOSIT_SETTINGS.minimumDeposit;

    changed = true;
  } else if (
    settings.minimumDeposit !==
    currentMinimumDeposit
  ) {
    settings.minimumDeposit =
      currentMinimumDeposit;

    changed = true;
  }

  // ----------------------------------------------------
  // ENSURE maximumDeposit
  // ----------------------------------------------------

  const currentMaximumDeposit = Number(
    settings.maximumDeposit
  );

  if (
    !Number.isFinite(currentMaximumDeposit) ||
    currentMaximumDeposit <= 0
  ) {
    settings.maximumDeposit =
      DEFAULT_DEPOSIT_SETTINGS.maximumDeposit;

    changed = true;
  } else if (
    settings.maximumDeposit !==
    currentMaximumDeposit
  ) {
    settings.maximumDeposit =
      currentMaximumDeposit;

    changed = true;
  }

  // ----------------------------------------------------
  // NORMALIZE PAYMENT METHODS
  // ----------------------------------------------------

  const existingMethods =
    Array.isArray(
      settings.depositPaymentMethods
    )
      ? settings.depositPaymentMethods
      : [];

  const normalizedMethods =
    normalizeDepositPaymentMethods(
      existingMethods
    );

  // ----------------------------------------------------
  // CHECK PAYMENT METHODS CHANGES
  // ----------------------------------------------------

  if (
    JSON.stringify(normalizedMethods) !==
    JSON.stringify(existingMethods)
  ) {
    settings.depositPaymentMethods =
      normalizedMethods;

    changed = true;
  }

  // ----------------------------------------------------
  // ENSURE MINIMUM <= MAXIMUM
  // ----------------------------------------------------

  const finalMinimumDeposit = Number(
    settings.minimumDeposit
  );

  const finalMaximumDeposit = Number(
    settings.maximumDeposit
  );

  if (
    finalMinimumDeposit >
    finalMaximumDeposit
  ) {
    settings.minimumDeposit =
      DEFAULT_DEPOSIT_SETTINGS.minimumDeposit;

    settings.maximumDeposit =
      DEFAULT_DEPOSIT_SETTINGS.maximumDeposit;

    changed = true;
  }

  // ----------------------------------------------------
  // SAVE ONLY WHEN CHANGED
  // ----------------------------------------------------

  if (changed) {
    await settings.save();
  }

  // ----------------------------------------------------
  // RETURN SETTINGS
  // ----------------------------------------------------

  return settings;
};

// ======================================================
// GET USER WALLET
// ======================================================

const getWallet = async (userId, username) => {
  if (!userId) {
    throw new Error(
      "User ID is required to load wallet."
    );
  }

  // ----------------------------------------------------
  // FIND EXISTING WALLET
  // ----------------------------------------------------

  let wallet = await Wallet.findOne({
    userId,
  });

  // ----------------------------------------------------
  // CREATE WALLET IF NOT EXISTS
  // ----------------------------------------------------

  if (!wallet) {
    wallet = await Wallet.create({
      userId,

      username: String(
        username || ""
      ).trim(),

      balance: 0,

      pkrBalance: 0,
      usdtBalance: 0,
      goldBalance: 0,

      lockedPkr: 0,
      lockedUsdt: 0,
      lockedGold: 0,

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
      `🟢 Wallet created for ${username || userId}`
    );
  }

  return wallet;
};

// ======================================================
// HEALTH CHECK
// GET /api/deposit/health
// ======================================================

router.get(
  "/health",
  (req, res) => {
    return res.status(200).json({
      success: true,

      module:
        "GoldTrade V18 Deposit API",

      version:
        "18.0.0",

      status:
        "ONLINE",

      timestamp:
        new Date().toISOString(),
    });
  }
);

// ======================================================
// API STATUS
// GET /api/deposit/status
// ======================================================

router.get(
  "/status",
  async (req, res) => {
    try {
      const settings =
        await getDepositSettings();

      const normalizedSettings =
        normalizeDepositSettings(
          settings
        );

      const methods =
        normalizedSettings
          .depositPaymentMethods
          .filter(
            (method) =>
              method.enabled !== false
          );

      return res.status(200).json({
        success: true,

        depositsEnabled:
          normalizedSettings.depositsEnabled,

        minimumDeposit:
          normalizedSettings.minimumDeposit,

        maximumDeposit:
          normalizedSettings.maximumDeposit,

        paymentMethodsCount:
          methods.length,

        serverTime:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "❌ DEPOSIT STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load deposit status.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              error:
                error.message,
            }
          : {}),
      });
    }
  }
);

// ======================================================
// GET DEPOSIT PAYMENT SETTINGS
// GET /api/deposit/settings
//
// USER + ADMIN
// ======================================================

router.get(
  "/settings",
  verifyToken,
  async (req, res) => {
    try {
      const settings =
        await getDepositSettings();

      const normalizedSettings =
        normalizeDepositSettings(
          settings
        );

      // ------------------------------------------------
      // ONLY ACTIVE METHODS FOR USER
      // ------------------------------------------------

      const methods =
        normalizedSettings
          .depositPaymentMethods
          .filter(
            (method) =>
              method.enabled !== false
          );

      return res.status(200).json({
        success: true,

        settings: {
          depositsEnabled:
            normalizedSettings.depositsEnabled,

          minimumDeposit:
            normalizedSettings.minimumDeposit,

          maximumDeposit:
            normalizedSettings.maximumDeposit,

          methods,
        },

        // ------------------------------------------------
        // TOP-LEVEL METHODS
        // FRONTEND COMPATIBILITY
        // ------------------------------------------------

        methods,

        total:
          methods.length,
      });
    } catch (error) {
      console.error(
        "❌ GET DEPOSIT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load deposit settings.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              error:
                error.message,
            }
          : {}),
      });
    }
  }
);

// ======================================================
// ADMIN UPDATE DEPOSIT PAYMENT METHODS
// PATCH /api/deposit/settings/payment-methods
// ======================================================

router.patch(
  "/settings/payment-methods",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const methods =
        req.body?.methods;

      // ------------------------------------------------
      // VALIDATE ARRAY
      // ------------------------------------------------

      if (!Array.isArray(methods)) {
        return res.status(400).json({
          success: false,

          message:
            "methods must be an array.",
        });
      }

      // ------------------------------------------------
      // MAXIMUM METHODS
      // ------------------------------------------------

      if (methods.length > 20) {
        return res.status(400).json({
          success: false,

          message:
            "Maximum 20 payment methods are allowed.",
        });
      }

      // ------------------------------------------------
      // NORMALIZE METHODS
      // ------------------------------------------------

      const normalizedMethods =
        normalizeDepositPaymentMethods(
          methods
        );

      // ------------------------------------------------
      // VALIDATE NORMALIZED RESULT
      // ------------------------------------------------

      if (
        normalizedMethods.length !==
        methods.length
      ) {
        return res.status(400).json({
          success: false,

          message:
            "One or more payment methods are invalid.",
        });
      }

      // ------------------------------------------------
      // DUPLICATE PAYMENT METHOD CHECK
      // ------------------------------------------------

      const methodTypes =
        normalizedMethods.map(
          (method) =>
            method.type
        );

      const uniqueMethodTypes =
        new Set(methodTypes);

      if (
        uniqueMethodTypes.size !==
        methodTypes.length
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Duplicate payment method types are not allowed.",
        });
      }

      // ------------------------------------------------
      // GET SETTINGS
      // ------------------------------------------------

      const settings =
        await getDepositSettings();

      // ------------------------------------------------
      // UPDATE METHODS
      // ------------------------------------------------

      settings.depositPaymentMethods =
        normalizedMethods;

      await settings.save();

      // ------------------------------------------------
      // RESPONSE SETTINGS
      // ------------------------------------------------

      const normalizedSettings =
        normalizeDepositSettings(
          settings
        );

      return res.status(200).json({
        success: true,

        message:
          "Deposit payment methods updated successfully.",

        settings: {
          depositsEnabled:
            normalizedSettings.depositsEnabled,

          minimumDeposit:
            normalizedSettings.minimumDeposit,

          maximumDeposit:
            normalizedSettings.maximumDeposit,

          methods:
            normalizedMethods,
        },

        // ------------------------------------------------
        // FRONTEND COMPATIBILITY
        // ------------------------------------------------

        methods:
          normalizedMethods,

        total:
          normalizedMethods.length,
      });
    } catch (error) {
      console.error(
        "❌ UPDATE DEPOSIT PAYMENT METHODS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to update deposit payment methods.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              error:
                error.message,
            }
          : {}),
      });
    }
  }
);
// ======================================================
// CREATE DEPOSIT
// POST /api/deposit/create
// ======================================================

router.post(
  "/create",
  verifyToken,
  upload.single("screenshot"),
  async (req, res) => {
    let createdDepositId = null;

    try {
      // ==================================================
      // USER
      // ==================================================

      const user = await User.findById(
        req.user.id
      )
        .select(
          "_id username fullName email"
        )
        .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // ==================================================
      // NORMALIZE FRONTEND INPUT
      // ==================================================

      const walletType = String(
        req.body?.walletType || "PKR"
      )
        .trim()
        .toUpperCase();

      const paymentMethod = String(
        req.body?.paymentMethod ||
          req.body?.method ||
          ""
      )
        .trim()
        .toUpperCase();

      const rawAmount =
        req.body?.amount ??
        req.body?.requestAmount;

      const depositAmount = Number(
        rawAmount
      );

      const senderName = String(
        req.body?.senderName || ""
      ).trim();

      const senderAccount = String(
        req.body?.senderAccount || ""
      ).trim();

      const receiverAccount = String(
        req.body?.receiverAccount || ""
      ).trim();

      const transactionId = String(
        req.body?.transactionId || ""
      ).trim();

      const referenceId = String(
        req.body?.referenceId || ""
      ).trim();

      const network = String(
        req.body?.network || ""
      ).trim();

      const note = String(
        req.body?.note ||
          req.body?.depositNote ||
          ""
      )
        .trim()
        .slice(0, 1000);

      // ==================================================
      // RECEIPT
      // ==================================================
      //
      // multer.memoryStorage() keeps the uploaded file
      // in req.file.buffer.
      //
      // This route does NOT pretend that a filename exists.
      // ==================================================

      const receiptImage = String(
        req.body?.receiptImage || ""
      ).trim();

      const receiptUploaded =
        Boolean(req.file) ||
        Boolean(receiptImage);

      // ==================================================
      // BASIC VALIDATION
      // ==================================================

      if (
        !Number.isFinite(depositAmount) ||
        depositAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid deposit amount.",
        });
      }

      // --------------------------------------------------
      // Prevent Infinity / NaN / unsafe precision
      // --------------------------------------------------

      if (
        !Number.isSafeInteger(
          Math.round(
            depositAmount * 100
          )
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid deposit amount.",
        });
      }

      // --------------------------------------------------
      // Wallet type
      // --------------------------------------------------

      if (
        !["PKR", "USDT"].includes(
          walletType
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Wallet type must be PKR or USDT.",
        });
      }

      // --------------------------------------------------
      // Payment method
      // --------------------------------------------------

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a payment method.",
        });
      }

      // ==================================================
      // DEPOSIT SETTINGS
      // ==================================================

      const settings =
        await getDepositSettings();

      const normalizedSettings =
        normalizeDepositSettings(
          settings
        );

      // --------------------------------------------------
      // DEPOSITS ENABLED
      // --------------------------------------------------

      if (
        normalizedSettings.depositsEnabled ===
        false
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Deposits are currently disabled.",
        });
      }

      const minimumDeposit =
        Number(
          normalizedSettings.minimumDeposit
        );

      const maximumDeposit =
        Number(
          normalizedSettings.maximumDeposit
        );

      // ==================================================
      // MINIMUM DEPOSIT
      // ==================================================

      if (
        Number.isFinite(
          minimumDeposit
        ) &&
        minimumDeposit > 0 &&
        depositAmount < minimumDeposit
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Minimum deposit is ${minimumDeposit}.`,
        });
      }

      // ==================================================
      // MAXIMUM DEPOSIT
      // ==================================================

      if (
        Number.isFinite(
          maximumDeposit
        ) &&
        maximumDeposit > 0 &&
        depositAmount > maximumDeposit
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Maximum deposit is ${maximumDeposit}.`,
        });
      }

      // ==================================================
      // PAYMENT METHOD VALIDATION
      // ==================================================

      const configuredMethods =
        normalizedSettings
          .depositPaymentMethods
          .filter(
            (method) =>
              method &&
              method.enabled !== false
          );

      if (
        configuredMethods.length === 0
      ) {
        return res.status(503).json({
          success: false,
          message:
            "No payment method is currently available. Please contact support.",
        });
      }

      const selectedMethod =
        configuredMethods.find(
          (method) =>
            String(
              method.type || ""
            )
              .trim()
              .toUpperCase() ===
            paymentMethod
        );

      if (!selectedMethod) {
        return res.status(400).json({
          success: false,
          message:
            "Selected payment method is not available.",
        });
      }

      // ==================================================
      // WALLET
      // ==================================================

      const wallet =
        await getWallet(
          user._id,
          user.username
        );

      // ==================================================
      // FROZEN WALLET
      // ==================================================

      if (
        wallet.isFrozen === true
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Your wallet is currently frozen.",
        });
      }

      // ==================================================
      // WALLET BEFORE SNAPSHOT
      //
      // IMPORTANT:
      // Pending deposit does NOT change balance.
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
      // DUPLICATE TRANSACTION ID
      // ==================================================

      if (transactionId) {
        const escapedTransactionId =
          transactionId.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

        const existingDeposit =
          await Deposit.findOne({
            userId: user._id,

            transactionId: {
              $regex:
                `^${escapedTransactionId}$`,
              $options: "i",
            },

            status: {
              $in: [
                "PENDING",
                "Pending",
                "pending",
                "APPROVED",
                "Approved",
                "approved",
              ],
            },
          })
            .select(
              "_id status amount walletType"
            )
            .lean();

        if (existingDeposit) {
          return res.status(409).json({
            success: false,

            message:
              "This transaction ID has already been submitted.",

            deposit: {
              id:
                existingDeposit._id,

              _id:
                existingDeposit._id,

              status:
                existingDeposit.status,

              amount:
                Number(
                  existingDeposit.amount ||
                    0
                ),

              walletType:
                existingDeposit.walletType,
            },
          });
        }
      }

      // ==================================================
      // CREATE PENDING DEPOSIT
      // ==================================================

      const deposit =
        await Deposit.create({
          userId:
            user._id,

          username:
            user.username,

          fullName:
            user.fullName || "",

          email:
            user.email || "",

          walletType,

          amount:
            depositAmount,

          currency:
            walletType,

          network,

          paymentMethod:
            selectedMethod.type,

          senderName,

          senderAccount,

          receiverAccount,

          transactionId,

          referenceId,

          receiptImage,

          receiptUploaded,

          walletBefore,

          note,

          status:
            "Pending",

          ipAddress:
            req.ip || "",

          device:
            req.headers[
              "user-agent"
            ] || "",
        });

      createdDepositId =
        deposit._id;

      // ==================================================
      // WALLET HISTORY
      //
      // REQUEST ONLY.
      // NO BALANCE CREDIT.
      // ==================================================

      await WalletHistory.create({
        userId:
          user._id,

        username:
          user.username,

        walletType,

        type:
          "DEPOSIT_REQUEST",

        transactionType:
          "DEPOSIT_REQUEST",

        transactionMode:
          "CREDIT",

        amount:
          depositAmount,

        balanceBefore:
          walletType === "PKR"
            ? walletBefore.pkrBalance
            : walletBefore.usdtBalance,

        balanceAfter:
          walletType === "PKR"
            ? walletBefore.pkrBalance
            : walletBefore.usdtBalance,

        referenceId:
          deposit._id.toString(),

        status:
          "Pending",

        note:
          `Deposit request submitted (${walletType})`,
      });

      // ==================================================
      // TRANSACTION LEDGER
      //
      // Balance remains unchanged.
      // Actual credit occurs on approval.
      // ==================================================

      await Transaction.create({
        userId:
          user._id,

        username:
          user.username,

        walletType,

        transactionType:
          "DEPOSIT_REQUEST",

        transactionMode:
          "CREDIT",

        amount:
          depositAmount,

        balanceBefore:
          walletType === "PKR"
            ? walletBefore.pkrBalance
            : walletBefore.usdtBalance,

        balanceAfter:
          walletType === "PKR"
            ? walletBefore.pkrBalance
            : walletBefore.usdtBalance,

        status:
          "Pending",

        paymentMethod:
          selectedMethod.type,

        referenceId:
          deposit._id.toString(),

        note:
          `Deposit request submitted (${walletType})`,
      });

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(201).json({
        success: true,

        message:
          "Deposit request submitted successfully.",

        deposit: {
          id:
            deposit._id,

          _id:
            deposit._id,

          walletType:
            deposit.walletType,

          amount:
            Number(
              deposit.amount || 0
            ),

          currency:
            deposit.currency,

          status:
            deposit.status,

          paymentMethod:
            deposit.paymentMethod,

          transactionId:
            deposit.transactionId,

          referenceId:
            deposit.referenceId,

          receiptImage:
            deposit.receiptImage,

          receiptUploaded:
            deposit.receiptUploaded,

          createdAt:
            deposit.createdAt,
        },

        wallet: {
          pkrBalance:
            walletBefore.pkrBalance,

          usdtBalance:
            walletBefore.usdtBalance,

          goldBalance:
            walletBefore.goldBalance,
        },
      });
    } catch (error) {
      console.error(
        "CREATE DEPOSIT ERROR:",
        error
      );

      // ==================================================
      // ROLLBACK
      // ==================================================

      if (createdDepositId) {
        try {
          await Deposit.findByIdAndDelete(
            createdDepositId
          );

          await WalletHistory.deleteMany({
            referenceId:
              createdDepositId.toString(),
          });

          await Transaction.deleteMany({
            referenceId:
              createdDepositId.toString(),
          });
        } catch (rollbackError) {
          console.error(
            "DEPOSIT ROLLBACK ERROR:",
            rollbackError
          );
        }
      }

      return res.status(500).json({
        success: false,

        message:
          "Unable to create deposit request.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              error:
                error.message,
            }
          : {}),
      });
    }
  }
);

// ======================================================
// GET CURRENT USER DEPOSIT HISTORY
// GET /api/deposit/history
//
// Used by:
// frontend/app/deposit/history/page.tsx
// ======================================================

router.get(
  "/history",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // PAGINATION
      // ==================================================

      const page = Math.max(
        parseInt(
          req.query.page,
          10
        ) || 1,
        1
      );

      const limit = Math.min(
        Math.max(
          parseInt(
            req.query.limit,
            10
          ) || 20,
          1
        ),
        100
      );

      const skip =
        (page - 1) * limit;

      // ==================================================
      // QUERY
      // ==================================================

      const query = {
        userId:
          req.user.id,
      };

      // ==================================================
      // COUNT + DATA
      // ==================================================

      const [
        total,
        deposits,
      ] = await Promise.all([
        Deposit.countDocuments(
          query
        ),

        Deposit.find(query)
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      const totalPages =
        Math.ceil(
          total / limit
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        username:
          req.user.username ||
          null,

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

        history:
          deposits.map(
            (deposit) => ({
              id:
                deposit._id,

              _id:
                deposit._id,

              walletType:
                deposit.walletType,

              amount:
                Number(
                  deposit.amount || 0
                ),

              currency:
                deposit.currency ||
                deposit.walletType,

              network:
                deposit.network ||
                "",

              paymentMethod:
                deposit.paymentMethod ||
                "",

              senderName:
                deposit.senderName ||
                "",

              senderAccount:
                deposit.senderAccount ||
                "",

              receiverAccount:
                deposit.receiverAccount ||
                "",

              transactionId:
                deposit.transactionId ||
                "",

              referenceId:
                deposit.referenceId ||
                "",

              receiptUploaded:
                deposit.receiptUploaded ===
                true,

              receiptImage:
                deposit.receiptImage ||
                "",

              status:
                String(
                  deposit.status ||
                    "PENDING"
                ).toUpperCase(),

              note:
                deposit.note ||
                "",

              rejectReason:
                deposit.rejectReason ||
                "",

              walletBefore:
                deposit.walletBefore ||
                null,

              walletAfter:
                deposit.walletAfter ||
                null,

              createdAt:
                deposit.createdAt,

              updatedAt:
                deposit.updatedAt,
            })
          ),
      });
    } catch (error) {
      console.error(
        "GET DEPOSIT HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load deposit history.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              error:
                error.message,
            }
          : {}),
      });
    }
  }
);

// ======================================================
// GET USER DEPOSIT HISTORY BY USERNAME
// GET /api/deposit/history/:username
//
// Admin or Same User
// ======================================================

router.get(
  "/history/:username",
  verifyToken,
  async (req, res) => {
    try {
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
      // CURRENT USER
      // ==================================================

      const currentRole =
        String(
          req.user?.role || ""
        )
          .trim()
          .toLowerCase();

      const currentUsername =
        String(
          req.user?.username || ""
        )
          .trim()
          .toLowerCase();

      // ==================================================
      // ACCESS CONTROL
      // ==================================================

      const isAdminUser =
        currentRole ===
        "admin";

      const isSameUser =
        currentUsername ===
        username;

      if (
        !isAdminUser &&
        !isSameUser
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
            "_id username fullName email"
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

      const page = Math.max(
        parseInt(
          req.query.page,
          10
        ) || 1,
        1
      );

      const limit = Math.min(
        Math.max(
          parseInt(
            req.query.limit,
            10
          ) || 20,
          1
        ),
        100
      );

      const skip =
        (page - 1) * limit;

      // ==================================================
      // QUERY
      // ==================================================

      const query = {
        userId:
          user._id,
      };

      // ==================================================
      // COUNT + DATA
      // ==================================================

      const [
        total,
        deposits,
      ] = await Promise.all([
        Deposit.countDocuments(
          query
        ),

        Deposit.find(query)
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      const totalPages =
        Math.ceil(
          total / limit
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        username:
          user.username,

        userId:
          user._id,

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

        history:
          deposits.map(
            (deposit) => ({
              id:
                deposit._id,

              _id:
                deposit._id,

              walletType:
                deposit.walletType,

              amount:
                Number(
                  deposit.amount || 0
                ),

              currency:
                deposit.currency ||
                deposit.walletType,

              network:
                deposit.network ||
                "",

              paymentMethod:
                deposit.paymentMethod ||
                "",

              senderName:
                deposit.senderName ||
                "",

              senderAccount:
                deposit.senderAccount ||
                "",

              receiverAccount:
                deposit.receiverAccount ||
                "",

              transactionId:
                deposit.transactionId ||
                "",

              referenceId:
                deposit.referenceId ||
                "",

              receiptUploaded:
                deposit.receiptUploaded ===
                true,

              receiptImage:
                deposit.receiptImage ||
                "",

              status:
                String(
                  deposit.status ||
                    "PENDING"
                ).toUpperCase(),

              note:
                deposit.note ||
                "",

              rejectReason:
                deposit.rejectReason ||
                "",

              walletBefore:
                deposit.walletBefore ||
                null,

              walletAfter:
                deposit.walletAfter ||
                null,

              createdAt:
                deposit.createdAt,

              updatedAt:
                deposit.updatedAt,
            })
          ),
      });
    } catch (error) {
      console.error(
        "GET USER DEPOSIT HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load user deposit history.",

        ...(process.env.NODE_ENV !==
        "production"
          ? {
              error:
                error.message,
            }
          : {}),
      });
    }
  }
);
// ======================================================
// GET PENDING DEPOSITS
// GET /api/deposit/pending
// Admin Dashboard
// ======================================================

router.get(
  "/pending",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // PAGINATION
      // ==================================================

      const page = Math.max(
        parseInt(req.query.page, 10) || 1,
        1
      );

      const limit = Math.min(
        Math.max(
          parseInt(req.query.limit, 10) || 50,
          1
        ),
        100
      );

      const skip = (page - 1) * limit;

      // ==================================================
      // STATUS COMPATIBILITY
      // ==================================================

      const query = {
        status: {
          $in: [
            "PENDING",
            "Pending",
            "pending",
          ],
        },
      };

      // ==================================================
      // COUNT + DATA
      // ==================================================

      const [total, deposits] = await Promise.all([
        Deposit.countDocuments(query),

        Deposit.find(query)
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      const totalPages = Math.ceil(total / limit);

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

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

        total,

        pendingDeposits: deposits.map(
          (deposit) => ({
            ...deposit,

            id: deposit._id,

            amount: Number(
              deposit.amount || 0
            ),

            status: String(
              deposit.status || "PENDING"
            ).toUpperCase(),
          })
        ),
      });
    } catch (error) {
      console.error(
        "GET PENDING DEPOSITS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load pending deposits.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// GET RECENT DEPOSITS
// GET /api/deposit/recent
// Dashboard Recent Activity
// ======================================================

router.get(
  "/recent",
  verifyToken,
  async (req, res) => {
    try {
      const limit = Math.min(
        Math.max(
          parseInt(req.query.limit, 10) || 10,
          1
        ),
        50
      );

      // ==================================================
      // USER / ADMIN QUERY
      // ==================================================

      const isAdminUser =
        String(req.user?.role || "").toLowerCase() ===
        "admin";

      const query = isAdminUser
        ? {}
        : {
            userId: req.user.id,
          };

      // ==================================================
      // LOAD RECENT DEPOSITS
      // ==================================================

      const deposits =
        await Deposit.find(query)
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(limit)
          .lean();

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        total: deposits.length,

        recentDeposits: deposits.map(
          (deposit) => ({
            ...deposit,

            id: deposit._id,

            amount: Number(
              deposit.amount || 0
            ),

            status: String(
              deposit.status || "PENDING"
            ).toUpperCase(),
          })
        ),
      });
    } catch (error) {
      console.error(
        "GET RECENT DEPOSITS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load recent deposits.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// FILTER DEPOSIT HISTORY
// GET /api/deposit/filter
//
// Query:
// ?status=PENDING
// ?walletType=PKR
// ?start=2026-01-01
// ?end=2026-01-31
// ?page=1
// ?limit=20
// ======================================================

router.get(
  "/filter",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // PAGINATION
      // ==================================================

      const page = Math.max(
        parseInt(req.query.page, 10) || 1,
        1
      );

      const limit = Math.min(
        Math.max(
          parseInt(req.query.limit, 10) || 20,
          1
        ),
        100
      );

      const skip = (page - 1) * limit;

      // ==================================================
      // QUERY PARAMETERS
      // ==================================================

      const {
        status,
        walletType,
        start,
        end,
      } = req.query;

      const query = {
        userId: req.user.id,
      };

      // ==================================================
      // STATUS FILTER
      // ==================================================

      if (status) {
        const normalizedStatus =
          String(status)
            .trim()
            .toUpperCase();

        const allowedStatuses = [
          "PENDING",
          "APPROVED",
          "REJECTED",
          "CANCELLED",
        ];

        if (
          !allowedStatuses.includes(
            normalizedStatus
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Invalid deposit status.",
          });
        }

        query.status = {
          $in: [
            normalizedStatus,

            normalizedStatus.charAt(0) +
              normalizedStatus
                .slice(1)
                .toLowerCase(),

            normalizedStatus.toLowerCase(),
          ],
        };
      }

      // ==================================================
      // WALLET TYPE FILTER
      // ==================================================

      if (walletType) {
        const normalizedWalletType =
          String(walletType)
            .trim()
            .toUpperCase();

        if (
          !["PKR", "USDT"].includes(
            normalizedWalletType
          )
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Wallet type must be PKR or USDT.",
          });
        }

        query.walletType =
          normalizedWalletType;
      }

      // ==================================================
      // DATE FILTER
      // ==================================================

      if (start || end) {
        query.createdAt = {};

        if (start) {
          const startDate =
            new Date(String(start));

          if (
            Number.isNaN(
              startDate.getTime()
            )
          ) {
            return res.status(400).json({
              success: false,

              message:
                "Invalid start date.",
            });
          }

          startDate.setHours(
            0,
            0,
            0,
            0
          );

          query.createdAt.$gte =
            startDate;
        }

        if (end) {
          const endDate =
            new Date(String(end));

          if (
            Number.isNaN(
              endDate.getTime()
            )
          ) {
            return res.status(400).json({
              success: false,

              message:
                "Invalid end date.",
            });
          }

          endDate.setHours(
            23,
            59,
            59,
            999
          );

          query.createdAt.$lte =
            endDate;
        }

        // ==================================================
        // INVALID DATE RANGE
        // ==================================================

        if (
          query.createdAt.$gte &&
          query.createdAt.$lte &&
          query.createdAt.$gte >
            query.createdAt.$lte
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Start date cannot be after end date.",
          });
        }
      }

      // ==================================================
      // COUNT + DATA
      // ==================================================

      const [total, deposits] =
        await Promise.all([
          Deposit.countDocuments(query),

          Deposit.find(query)
            .sort({
              createdAt: -1,
              _id: -1,
            })
            .skip(skip)
            .limit(limit)
            .lean(),
        ]);

      const totalPages =
        Math.ceil(total / limit);

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        filters: {
          status: status
            ? String(status)
                .trim()
                .toUpperCase()
            : null,

          walletType: walletType
            ? String(walletType)
                .trim()
                .toUpperCase()
            : null,

          start: start || null,

          end: end || null,
        },

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

        total,

        history: deposits.map(
          (deposit) => ({
            id:
              deposit._id,

            _id:
              deposit._id,

            walletType:
              deposit.walletType,

            amount:
              Number(
                deposit.amount || 0
              ),

            currency:
              deposit.currency ||
              deposit.walletType,

            network:
              deposit.network || "",

            paymentMethod:
              deposit.paymentMethod || "",

            transactionId:
              deposit.transactionId || "",

            referenceId:
              deposit.referenceId || "",

            receiptUploaded:
              deposit.receiptUploaded === true,

            receiptImage:
              deposit.receiptImage || "",

            status:
              String(
                deposit.status ||
                  "PENDING"
              ).toUpperCase(),

            note:
              deposit.note || "",

            rejectReason:
              deposit.rejectReason || "",

            createdAt:
              deposit.createdAt,

            updatedAt:
              deposit.updatedAt,
          })
        ),
      });
    } catch (error) {
      console.error(
        "FILTER DEPOSIT HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to filter deposit history.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// APPROVE DEPOSIT
// PATCH /api/deposit/:id/approve
//
// IMPORTANT:
// Deposit
// + Wallet
// + WalletHistory
// + Transaction
//
// are committed together.
// ======================================================

router.patch(
  "/:id/approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    const depositId =
      String(
        req.params.id || ""
      ).trim();

    // ==================================================
    // VALIDATE ID
    // ==================================================

    if (
      !mongoose.Types.ObjectId.isValid(
        depositId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid deposit request ID.",
      });
    }

    const session =
      await mongoose.startSession();

    try {
      let responseData = null;

      await session.withTransaction(
        async () => {
          // ==============================================
          // FIND DEPOSIT
          // ==============================================

          const deposit =
            await Deposit.findById(
              depositId
            ).session(session);

          if (!deposit) {
            const error =
              new Error(
                "Deposit request not found."
              );

            error.statusCode = 404;

            throw error;
          }

          // ==============================================
          // STATUS CHECK
          // ==============================================

          const currentStatus =
            String(
              deposit.status || ""
            )
              .trim()
              .toUpperCase();

          if (
            currentStatus !==
            "PENDING"
          ) {
            const error =
              new Error(
                `Deposit already ${currentStatus.toLowerCase()}.`
              );

            error.statusCode = 409;

            throw error;
          }

          // ==============================================
          // WALLET TYPE
          // ==============================================

          const walletType =
            String(
              deposit.walletType || ""
            )
              .trim()
              .toUpperCase();

          if (
            !["PKR", "USDT"].includes(
              walletType
            )
          ) {
            const error =
              new Error(
                "Invalid deposit wallet type."
              );

            error.statusCode = 400;

            throw error;
          }

          // ==============================================
          // AMOUNT
          // ==============================================

          const amount =
            Number(deposit.amount);

          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            const error =
              new Error(
                "Invalid deposit amount."
              );

            error.statusCode = 400;

            throw error;
          }

          // ==============================================
          // USER WALLET
          // ==============================================

          const walletDoc =
            await Wallet.findOne({
              userId:
                deposit.userId,
            }).session(session);

          if (!walletDoc) {
            const error =
              new Error(
                "User wallet not found."
              );

            error.statusCode = 404;

            throw error;
          }

          // ==============================================
          // FROZEN WALLET CHECK
          // ==============================================

          if (
            walletDoc.isFrozen === true
          ) {
            const error =
              new Error(
                "User wallet is frozen."
              );

            error.statusCode = 403;

            throw error;
          }

          // ==============================================
          // WALLET BEFORE
          // ==============================================

          const walletBefore = {
            pkrBalance:
              Number(
                walletDoc.pkrBalance || 0
              ),

            usdtBalance:
              Number(
                walletDoc.usdtBalance || 0
              ),

            goldBalance:
              Number(
                walletDoc.goldBalance || 0
              ),

            lockedPkr:
              Number(
                walletDoc.lockedPkr || 0
              ),

            lockedUsdt:
              Number(
                walletDoc.lockedUsdt || 0
              ),

            lockedGold:
              Number(
                walletDoc.lockedGold || 0
              ),
          };

          deposit.walletBefore =
            walletBefore;

          // ==============================================
          // CREDIT WALLET
          // ==============================================

          if (
            walletType === "PKR"
          ) {
            walletDoc.pkrBalance =
              walletBefore.pkrBalance +
              amount;

            walletDoc.totalDeposit =
              Number(
                walletDoc.totalDeposit || 0
              ) + amount;

            walletDoc.totalPkrDeposit =
              Number(
                walletDoc.totalPkrDeposit || 0
              ) + amount;
          }

          if (
            walletType === "USDT"
          ) {
            walletDoc.usdtBalance =
              walletBefore.usdtBalance +
              amount;

            walletDoc.totalDeposit =
              Number(
                walletDoc.totalDeposit || 0
              ) + amount;

            walletDoc.totalUsdtDeposited =
              Number(
                walletDoc.totalUsdtDeposited || 0
              ) + amount;
          }

          walletDoc.lastDepositAt =
            new Date();

          await walletDoc.save({
            session,
          });

          // ==============================================
          // WALLET AFTER
          // ==============================================

          const walletAfter = {
            pkrBalance:
              Number(
                walletDoc.pkrBalance || 0
              ),

            usdtBalance:
              Number(
                walletDoc.usdtBalance || 0
              ),

            goldBalance:
              Number(
                walletDoc.goldBalance || 0
              ),

            lockedPkr:
              Number(
                walletDoc.lockedPkr || 0
              ),

            lockedUsdt:
              Number(
                walletDoc.lockedUsdt || 0
              ),

            lockedGold:
              Number(
                walletDoc.lockedGold || 0
              ),
          };

          deposit.walletAfter =
            walletAfter;

          // ==============================================
          // UPDATE DEPOSIT
          // ==============================================

          deposit.status =
            "APPROVED";

          deposit.approvedBy =
            req.user.id;

          deposit.approvedByUsername =
            req.user.username ||
            "Admin";

          deposit.approvedAt =
            new Date();

          await deposit.save({
            session,
          });

          // ==============================================
          // WALLET HISTORY
          // ==============================================

          await WalletHistory.create(
            [
              {
                userId:
                  deposit.userId,

                username:
                  deposit.username,

                walletType,

                type:
                  "DEPOSIT_APPROVED",

                transactionType:
                  "DEPOSIT_APPROVED",

                transactionMode:
                  "CREDIT",

                amount,

                balanceBefore:
                  walletType === "PKR"
                    ? walletBefore.pkrBalance
                    : walletBefore.usdtBalance,

                balanceAfter:
                  walletType === "PKR"
                    ? walletAfter.pkrBalance
                    : walletAfter.usdtBalance,

                referenceId:
                  deposit._id.toString(),

                admin:
                  req.user.username ||
                  "Admin",

                adminId:
                  req.user.id,

                status:
                  "Completed",

                note:
                  `Deposit approved by ${
                    req.user.username ||
                    "Admin"
                  }`,
              },
            ],
            {
              session,
            }
          );

          // ==============================================
          // TRANSACTION LEDGER
          // ==============================================

          await Transaction.create(
            [
              {
                userId:
                  deposit.userId,

                username:
                  deposit.username,

                walletType,

                transactionType:
                  "DEPOSIT_APPROVED",

                transactionMode:
                  "CREDIT",

                amount,

                balanceBefore:
                  walletType === "PKR"
                    ? walletBefore.pkrBalance
                    : walletBefore.usdtBalance,

                balanceAfter:
                  walletType === "PKR"
                    ? walletAfter.pkrBalance
                    : walletAfter.usdtBalance,

                status:
                  "Completed",

                paymentMethod:
                  deposit.paymentMethod,

                referenceId:
                  deposit._id.toString(),

                adminId:
                  req.user.id,

                adminUsername:
                  req.user.username ||
                  "Admin",

                note:
                  "Deposit approved successfully.",
              },
            ],
            {
              session,
            }
          );

          // ==============================================
          // RESPONSE DATA
          // ==============================================

          responseData = {
            deposit: {
              id:
                deposit._id,

              username:
                deposit.username,

              walletType,

              amount,

              status:
                deposit.status,

              approvedBy:
                deposit.approvedByUsername,

              approvedAt:
                deposit.approvedAt,

              paymentMethod:
                deposit.paymentMethod,

              transactionId:
                deposit.transactionId,

              referenceId:
                deposit.referenceId,
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

              availablePkr:
                Math.max(
                  walletAfter.pkrBalance -
                    walletAfter.lockedPkr,
                  0
                ),

              availableUsdt:
                Math.max(
                  walletAfter.usdtBalance -
                    walletAfter.lockedUsdt,
                  0
                ),
            },
          };
        }
      );

      return res.status(200).json({
        success: true,

        message:
          "Deposit approved successfully.",

        ...responseData,
      });
    } catch (error) {
      console.error(
        "APPROVE DEPOSIT ERROR:",
        error
      );

      const statusCode =
        Number(error.statusCode) || 500;

      return res.status(statusCode).json({
        success: false,

        message:
          error.message ||
          "Unable to approve deposit.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    } finally {
      await session.endSession();
    }
  }
);


// ======================================================
// REJECT DEPOSIT
// PATCH /api/deposit/:id/reject
//
// IMPORTANT:
// Rejection does NOT change wallet balance.
// ======================================================

router.patch(
  "/:id/reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    const depositId =
      String(
        req.params.id || ""
      ).trim();

    // ==================================================
    // VALIDATE ID
    // ==================================================

    if (
      !mongoose.Types.ObjectId.isValid(
        depositId
      )
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid deposit request ID.",
      });
    }

    // ==================================================
    // INPUT
    // ==================================================

    const rejectReason =
      String(
        req.body?.rejectReason ||
          "Deposit rejected by admin."
      )
        .trim()
        .slice(0, 500);

    const noteProvided =
      req.body?.note !== undefined;

    const note = noteProvided
      ? String(req.body.note || "")
          .trim()
          .slice(0, 1000)
      : null;

    const session =
      await mongoose.startSession();

    try {
      let responseDeposit = null;

      await session.withTransaction(
        async () => {
          // ==============================================
          // FIND DEPOSIT
          // ==============================================

          const deposit =
            await Deposit.findById(
              depositId
            ).session(session);

          if (!deposit) {
            const error =
              new Error(
                "Deposit request not found."
              );

            error.statusCode = 404;

            throw error;
          }

          // ==============================================
          // STATUS CHECK
          // ==============================================

          const currentStatus =
            String(
              deposit.status || ""
            )
              .trim()
              .toUpperCase();

          if (
            currentStatus !== "PENDING"
          ) {
            const error =
              new Error(
                `Deposit already ${currentStatus.toLowerCase()}.`
              );

            error.statusCode = 409;

            throw error;
          }

          // ==============================================
          // WALLET TYPE
          // ==============================================

          const walletType =
            String(
              deposit.walletType || ""
            )
              .trim()
              .toUpperCase();

          if (
            !["PKR", "USDT"].includes(
              walletType
            )
          ) {
            const error =
              new Error(
                "Invalid deposit wallet type."
              );

            error.statusCode = 400;

            throw error;
          }

          // ==============================================
          // AMOUNT
          // ==============================================

          const amount =
            Number(deposit.amount);

          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            const error =
              new Error(
                "Invalid deposit amount."
              );

            error.statusCode = 400;

            throw error;
          }

          // ==============================================
          // CURRENT WALLET
          // ==============================================

          const wallet =
            await Wallet.findOne({
              userId:
                deposit.userId,
            })
              .select(
                "pkrBalance usdtBalance goldBalance lockedPkr lockedUsdt lockedGold isFrozen"
              )
              .session(session)
              .lean();

          if (!wallet) {
            const error =
              new Error(
                "User wallet not found."
              );

            error.statusCode = 404;

            throw error;
          }

          // ==============================================
          // WALLET SNAPSHOT
          // ==============================================

          const currentWallet = {
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

          deposit.walletAfter =
            currentWallet;

          // ==============================================
          // UPDATE DEPOSIT
          // ==============================================

          deposit.status =
            "REJECTED";

          deposit.rejectReason =
            rejectReason;

          deposit.rejectedBy =
            req.user.id;

          deposit.rejectedByUsername =
            req.user.username ||
            "Admin";

          deposit.rejectedAt =
            new Date();

          if (noteProvided) {
            deposit.note = note;
          }

          await deposit.save({
            session,
          });

          // ==============================================
          // WALLET HISTORY
          // ==============================================

          await WalletHistory.create(
            [
              {
                userId:
                  deposit.userId,

                username:
                  deposit.username,

                walletType,

                type:
                  "DEPOSIT_REJECTED",

                transactionType:
                  "DEPOSIT_REJECTED",

                transactionMode:
                  "RELEASE",

                amount,

                balanceBefore:
                  walletType === "PKR"
                    ? currentWallet.pkrBalance
                    : currentWallet.usdtBalance,

                balanceAfter:
                  walletType === "PKR"
                    ? currentWallet.pkrBalance
                    : currentWallet.usdtBalance,

                referenceId:
                  deposit._id.toString(),

                admin:
                  req.user.username ||
                  "Admin",

                adminId:
                  req.user.id,

                status:
                  "Rejected",

                note:
                  rejectReason,
              },
            ],
            {
              session,
            }
          );

          // ==============================================
          // TRANSACTION LEDGER
          // ==============================================

          await Transaction.create(
            [
              {
                userId:
                  deposit.userId,

                username:
                  deposit.username,

                walletType,

                transactionType:
                  "DEPOSIT_REJECTED",

                transactionMode:
                  "RELEASE",

                amount,

                balanceBefore:
                  walletType === "PKR"
                    ? currentWallet.pkrBalance
                    : currentWallet.usdtBalance,

                balanceAfter:
                  walletType === "PKR"
                    ? currentWallet.pkrBalance
                    : currentWallet.usdtBalance,

                status:
                  "Rejected",

                paymentMethod:
                  deposit.paymentMethod,

                referenceId:
                  deposit._id.toString(),

                adminId:
                  req.user.id,

                adminUsername:
                  req.user.username ||
                  "Admin",

                note:
                  rejectReason,
              },
            ],
            {
              session,
            }
          );

          // ==============================================
          // RESPONSE
          // ==============================================

          responseDeposit = {
            id:
              deposit._id,

            username:
              deposit.username,

            walletType,

            amount,

            status:
              deposit.status,

            paymentMethod:
              deposit.paymentMethod,

            transactionId:
              deposit.transactionId,

            referenceId:
              deposit.referenceId,

            rejectReason:
              deposit.rejectReason,

            rejectedBy:
              deposit.rejectedByUsername,

            rejectedAt:
              deposit.rejectedAt,

            note:
              deposit.note || "",

            wallet: {
              pkrBalance:
                currentWallet.pkrBalance,

              usdtBalance:
                currentWallet.usdtBalance,

              goldBalance:
                currentWallet.goldBalance,

              lockedPkr:
                currentWallet.lockedPkr,

              lockedUsdt:
                currentWallet.lockedUsdt,

              availablePkr:
                Math.max(
                  currentWallet.pkrBalance -
                    currentWallet.lockedPkr,
                  0
                ),

              availableUsdt:
                Math.max(
                  currentWallet.usdtBalance -
                    currentWallet.lockedUsdt,
                  0
                ),
            },
          };
        }
      );

      return res.status(200).json({
        success: true,

        message:
          "Deposit rejected successfully.",

        deposit:
          responseDeposit,
      });
    } catch (error) {
      console.error(
        "REJECT DEPOSIT ERROR:",
        error
      );

      return res.status(
        Number(error.statusCode) || 500
      ).json({
        success: false,

        message:
          error.message ||
          "Unable to reject deposit.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    } finally {
      await session.endSession();
    }
  }
);


// ======================================================
// CANCEL DEPOSIT
// PATCH /api/deposit/:id/cancel
//
// User can cancel only their own PENDING deposit.
// Admin can also cancel a PENDING deposit.
// Wallet balance is NOT changed.
// ======================================================

router.patch(
  "/:id/cancel",
  verifyToken,
  async (req, res) => {
    const session =
      await mongoose.startSession();

    try {
      // ==================================================
      // VALIDATE ID
      // ==================================================

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid deposit ID.",
        });
      }

      let responseData = null;

      await session.withTransaction(
        async () => {
          // ==============================================
          // FIND DEPOSIT
          // ==============================================

          const deposit =
            await Deposit.findById(
              req.params.id
            ).session(session);

          if (!deposit) {
            const error =
              new Error(
                "Deposit request not found."
              );

            error.statusCode = 404;

            throw error;
          }

          // ==============================================
          // OWNERSHIP
          // ==============================================

          const isAdminUser =
            String(
              req.user?.role || ""
            ).toLowerCase() ===
            "admin";

          const depositUserId =
            String(
              deposit.userId || ""
            );

          const requestUserId =
            String(
              req.user?.id || ""
            );

          if (
            !isAdminUser &&
            depositUserId !==
              requestUserId
          ) {
            const error =
              new Error(
                "Access denied."
              );

            error.statusCode = 403;

            throw error;
          }

          // ==============================================
          // STATUS
          // ==============================================

          const currentStatus =
            String(
              deposit.status || ""
            ).toUpperCase();

          if (
            currentStatus !==
            "PENDING"
          ) {
            const error =
              new Error(
                "Only pending deposits can be cancelled."
              );

            error.statusCode = 400;

            throw error;
          }

          // ==============================================
          // WALLET TYPE
          // ==============================================

          const walletType =
            String(
              deposit.walletType ||
                "PKR"
            ).toUpperCase();

          if (
            !["PKR", "USDT"].includes(
              walletType
            )
          ) {
            const error =
              new Error(
                "Invalid deposit wallet type."
              );

            error.statusCode = 400;

            throw error;
          }

          // ==============================================
          // AMOUNT
          // ==============================================

          const amount =
            Number(
              deposit.amount
            );

          if (
            !Number.isFinite(amount) ||
            amount <= 0
          ) {
            const error =
              new Error(
                "Invalid deposit amount."
              );

            error.statusCode = 400;

            throw error;
          }

          // ==============================================
          // WALLET
          // ==============================================

          const wallet =
            await Wallet.findOne({
              userId:
                deposit.userId,
            })
              .session(session)
              .lean();

          if (!wallet) {
            const error =
              new Error(
                "User wallet not found."
              );

            error.statusCode = 404;

            throw error;
          }

          // ==============================================
          // WALLET SNAPSHOT
          // ==============================================

          const balanceBefore =
            walletType === "PKR"
              ? Number(
                  wallet.pkrBalance ??
                    wallet.balance ??
                    0
                )
              : Number(
                  wallet.usdtBalance || 0
                );

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

          // ==============================================
          // UPDATE DEPOSIT
          // ==============================================

          deposit.status =
            "CANCELLED";

          deposit.walletBefore =
            deposit.walletBefore ||
            walletBefore;

          deposit.walletAfter =
            walletBefore;

          deposit.note =
            isAdminUser
              ? "Deposit cancelled by admin."
              : "Deposit cancelled by user.";

          deposit.rejectedAt =
            new Date();

          if (
            Object.prototype.hasOwnProperty.call(
              deposit.toObject(),
              "cancelledAt"
            )
          ) {
            deposit.cancelledAt =
              new Date();
          }

          if (isAdminUser) {
            deposit.rejectedBy =
              req.user.id;

            deposit.rejectedByUsername =
              req.user.username ||
              "Admin";
          }

          await deposit.save({
            session,
          });

          // ==============================================
          // WALLET HISTORY
          // ==============================================

          await WalletHistory.create(
            [
              {
                userId:
                  deposit.userId,

                username:
                  deposit.username,

                walletType,

                type:
                  "DEPOSIT_CANCELLED",

                transactionType:
                  "DEPOSIT_CANCELLED",

                transactionMode:
                  "RELEASE",

                amount,

                balanceBefore,

                balanceAfter:
                  balanceBefore,

                status:
                  "Cancelled",

                referenceId:
                  deposit._id.toString(),

                paymentMethod:
                  deposit.paymentMethod ||
                  "",

                note:
                  isAdminUser
                    ? "Deposit cancelled by admin."
                    : "Deposit cancelled by user.",

                adminId:
                  isAdminUser
                    ? req.user.id
                    : undefined,

                adminUsername:
                  isAdminUser
                    ? req.user.username
                    : undefined,
              },
            ],
            {
              session,
            }
          );

          // ==============================================
          // TRANSACTION LOG
          // ==============================================

          await Transaction.create(
            [
              {
                userId:
                  deposit.userId,

                username:
                  deposit.username,

                walletType,

                transactionType:
                  "DEPOSIT_CANCELLED",

                transactionMode:
                  "RELEASE",

                amount,

                balanceBefore,

                balanceAfter:
                  balanceBefore,

                status:
                  "Cancelled",

                paymentMethod:
                  deposit.paymentMethod ||
                  "",

                referenceId:
                  deposit._id.toString(),

                note:
                  isAdminUser
                    ? "Deposit cancelled by admin."
                    : "Deposit cancelled by user.",
              },
            ],
            {
              session,
            }
          );

          // ==============================================
          // RESPONSE
          // ==============================================

          responseData = {
            id:
              deposit._id,

            status:
              deposit.status,

            walletType,

            amount,

            cancelledAt:
              deposit.cancelledAt ||
              deposit.rejectedAt ||
              new Date(),
          };
        }
      );

      return res.status(200).json({
        success: true,

        message:
          "Deposit cancelled successfully.",

        deposit:
          responseData,
      });
    } catch (error) {
      console.error(
        "CANCEL DEPOSIT ERROR:",
        error
      );

      const statusCode =
        Number(error.statusCode) >= 400
          ? error.statusCode
          : 500;

      return res.status(
        statusCode
      ).json({
        success: false,

        message:
          statusCode === 500
            ? "Unable to cancel deposit."
            : error.message,

        error:
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    } finally {
      await session.endSession();
    }
  }
);


// ======================================================
// UPDATE ADMIN NOTE
// PATCH /api/deposit/:id/note
// ======================================================

router.patch(
  "/:id/note",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // VALIDATE ID
      // ==================================================

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Invalid deposit ID.",
        });
      }

      // ==================================================
      // READ NOTE
      // ==================================================

      const rawNote =
        typeof req.body?.note ===
        "string"
          ? req.body.note
          : "";

      const note =
        rawNote.trim();

      if (note.length > 1000) {
        return res.status(400).json({
          success: false,

          message:
            "Note cannot exceed 1000 characters.",
        });
      }

      // ==================================================
      // FIND DEPOSIT
      // ==================================================

      const deposit =
        await Deposit.findById(
          req.params.id
        );

      if (!deposit) {
        return res.status(404).json({
          success: false,

          message:
            "Deposit request not found.",
        });
      }

      // ==================================================
      // UPDATE
      // ==================================================

      deposit.note =
        note;

      await deposit.save();

      return res.status(200).json({
        success: true,

        message:
          "Deposit note updated successfully.",

        depositId:
          deposit._id,

        note:
          deposit.note,
      });
    } catch (error) {
      console.error(
        "UPDATE DEPOSIT NOTE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to update deposit note.",

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
// CHECK DUPLICATE PENDING DEPOSIT
// GET /api/deposit/check-pending/:walletType
// ======================================================

router.get(
  "/check-pending/:walletType",
  verifyToken,
  async (req, res) => {
    try {
      const walletType =
        String(
          req.params.walletType || ""
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
            "Invalid wallet type. Use PKR or USDT.",
        });
      }

      // ==================================================
      // FIND PENDING
      // ==================================================

      const pendingDeposit =
        await Deposit.findOne({
          userId:
            req.user.id,

          walletType,

          status: {
            $in: [
              "PENDING",
              "Pending",
              "pending",
            ],
          },
        })
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,

        hasPendingDeposit:
          Boolean(
            pendingDeposit
          ),

        pendingDeposit:
          pendingDeposit
            ? {
                id:
                  pendingDeposit._id,

                walletType:
                  pendingDeposit.walletType,

                amount:
                  Number(
                    pendingDeposit.amount ||
                      0
                  ),

                status:
                  String(
                    pendingDeposit.status ||
                      ""
                  ).toUpperCase(),

                paymentMethod:
                  pendingDeposit.paymentMethod ||
                  "",

                transactionId:
                  pendingDeposit.transactionId ||
                  "",

                referenceId:
                  pendingDeposit.referenceId ||
                  pendingDeposit._id?.toString(),

                createdAt:
                  pendingDeposit.createdAt ||
                  null,
              }
            : null,
      });
    } catch (error) {
      console.error(
        "CHECK PENDING DEPOSIT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to check pending deposits.",

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
// USER DEPOSIT SUMMARY
// GET /api/deposit/summary
// ======================================================

router.get(
  "/summary",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // GET USER DEPOSITS
      // ==================================================

      const deposits =
        await Deposit.find({
          userId:
            req.user.id,
        })
          .select(
            "status amount walletType createdAt paymentMethod transactionId referenceId"
          )
          .lean();

      // ==================================================
      // COUNTERS
      // ==================================================

      let pending = 0;
      let approved = 0;
      let rejected = 0;
      let cancelled = 0;

      let totalPendingAmount = 0;
      let totalApprovedAmount = 0;

      // ==================================================
      // PROCESS
      // ==================================================

      for (
        const deposit of deposits
      ) {
        const status =
          String(
            deposit.status || ""
          ).toUpperCase();

        const amount =
          Number(
            deposit.amount
          );

        const safeAmount =
          Number.isFinite(
            amount
          ) && amount > 0
            ? amount
            : 0;

        switch (status) {
          case "PENDING":
            pending += 1;
            totalPendingAmount +=
              safeAmount;
            break;

          case "APPROVED":
            approved += 1;
            totalApprovedAmount +=
              safeAmount;
            break;

          case "REJECTED":
            rejected += 1;
            break;

          case "CANCELLED":
            cancelled += 1;
            break;

          default:
            break;
        }
      }

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        summary: {
          totalDeposits:
            deposits.length,

          pendingDeposits:
            pending,

          approvedDeposits:
            approved,

          rejectedDeposits:
            rejected,

          cancelledDeposits:
            cancelled,

          totalPendingAmount:
            Number(
              totalPendingAmount.toFixed(
                2
              )
            ),

          totalApprovedAmount:
            Number(
              totalApprovedAmount.toFixed(
                2
              )
            ),
        },

        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "DEPOSIT SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load deposit summary.",

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
// ADMIN DEPOSIT DASHBOARD
// GET /api/deposit/admin/dashboard
// ======================================================

router.get(
  "/admin/dashboard",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // STATUS COUNTS
      // ==================================================

      const [
        totalDeposits,
        pendingDeposits,
        approvedDeposits,
        rejectedDeposits,
        cancelledDeposits,
        recentDeposits,
      ] = await Promise.all([
        Deposit.countDocuments({}),

        Deposit.countDocuments({
          status: {
            $in: [
              "PENDING",
              "Pending",
              "pending",
            ],
          },
        }),

        Deposit.countDocuments({
          status: {
            $in: [
              "APPROVED",
              "Approved",
              "approved",
            ],
          },
        }),

        Deposit.countDocuments({
          status: {
            $in: [
              "REJECTED",
              "Rejected",
              "rejected",
            ],
          },
        }),

        Deposit.countDocuments({
          status: {
            $in: [
              "CANCELLED",
              "Cancelled",
              "cancelled",
            ],
          },
        }),

        Deposit.find({})
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(10)
          .lean(),
      ]);

      // ==================================================
      // APPROVED TOTALS
      // ==================================================

      const approvedAggregation =
        await Deposit.aggregate([
          {
            $match: {
              status: {
                $in: [
                  "APPROVED",
                  "Approved",
                  "approved",
                ],
              },
            },
          },

          {
            $project: {
              amount: {
                $convert: {
                  input: "$amount",

                  to: "double",

                  onError: 0,

                  onNull: 0,
                },
              },

              walletType: {
                $toUpper: {
                  $ifNull: [
                    "$walletType",
                    "",
                  ],
                },
              },
            },
          },

          {
            $group: {
              _id: null,

              totalApprovedAmount: {
                $sum:
                  "$amount",
              },

              totalPkrDeposits: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$walletType",
                        "PKR",
                      ],
                    },

                    "$amount",

                    0,
                  ],
                },
              },

              totalUsdtDeposits: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$walletType",
                        "USDT",
                      ],
                    },

                    "$amount",

                    0,
                  ],
                },
              },
            },
          },
        ]);

      // ==================================================
      // PENDING TOTAL
      // ==================================================

      const pendingAggregation =
        await Deposit.aggregate([
          {
            $match: {
              status: {
                $in: [
                  "PENDING",
                  "Pending",
                  "pending",
                ],
              },
            },
          },

          {
            $project: {
              amount: {
                $convert: {
                  input: "$amount",

                  to: "double",

                  onError: 0,

                  onNull: 0,
                },
              },
            },
          },

          {
            $group: {
              _id: null,

              totalPendingAmount: {
                $sum:
                  "$amount",
              },
            },
          },
        ]);

      // ==================================================
      // NORMALIZE TOTALS
      // ==================================================

      const approvedTotals =
        approvedAggregation[0] ||
        {};

      const pendingTotals =
        pendingAggregation[0] ||
        {};

      const totalApprovedAmount =
        Number(
          approvedTotals
            .totalApprovedAmount ||
            0
        );

      const totalPendingAmount =
        Number(
          pendingTotals
            .totalPendingAmount ||
            0
        );

      const totalPkrDeposits =
        Number(
          approvedTotals
            .totalPkrDeposits ||
            0
        );

      const totalUsdtDeposits =
        Number(
          approvedTotals
            .totalUsdtDeposits ||
            0
        );

      // ==================================================
      // NORMALIZE RECENT DEPOSITS
      // ==================================================

      const normalizedRecentDeposits =
        recentDeposits.map(
          (deposit) => ({
            ...deposit,

            id:
              deposit._id,

            status:
              String(
                deposit.status || ""
              ).toUpperCase(),

            amount:
              Number(
                Number(
                  deposit.amount || 0
                ).toFixed(6)
              ),

            walletType:
              String(
                deposit.walletType ||
                  ""
              ).toUpperCase(),
          })
        );

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        dashboard: {
          totalDeposits,

          pendingDeposits,

          approvedDeposits,

          rejectedDeposits,

          cancelledDeposits,

          totalApprovedAmount,

          totalPendingAmount,

          totalPkrDeposits,

          totalUsdtDeposits,

          recentDeposits:
            normalizedRecentDeposits,
        },

        totalDeposits,

        pendingDeposits,

        approvedDeposits,

        rejectedDeposits,

        cancelledDeposits,

        totalApprovedAmount,

        totalPendingAmount,

        totalPkrDeposits,

        totalUsdtDeposits,

        recentDeposits:
          normalizedRecentDeposits,
      });
    } catch (error) {
      console.error(
        "ADMIN DEPOSIT DASHBOARD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load admin deposit dashboard.",

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
// ADMIN DEPOSIT ANALYTICS
// GET /api/deposit/admin/analytics
//
// Used by Dashboard Charts
// ======================================================

router.get(
  "/admin/analytics",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // APPROVED DEPOSITS ONLY
      // ==================================================

      const deposits =
        await Deposit.find({
          status: {
            $in: [
              "APPROVED",
              "Approved",
              "approved",
            ],
          },
        })
          .select(
            "amount walletType createdAt"
          )
          .lean();

      // ==================================================
      // TOTALS
      // ==================================================

      let totalAmount = 0;
      let totalPKR = 0;
      let totalUSDT = 0;

      const monthlyMap = {};

      // ==================================================
      // PROCESS APPROVED DEPOSITS
      // ==================================================

      for (
        const deposit of deposits
      ) {
        const amount =
          Number(
            deposit.amount
          );

        if (
          !Number.isFinite(amount) ||
          amount <= 0
        ) {
          continue;
        }

        const walletType =
          String(
            deposit.walletType || ""
          ).toUpperCase();

        // ==================================================
        // DATE SAFETY
        // ==================================================

        const createdAt =
          deposit.createdAt
            ? new Date(
                deposit.createdAt
              )
            : null;

        if (
          !createdAt ||
          Number.isNaN(
            createdAt.getTime()
          )
        ) {
          continue;
        }

        const month =
          createdAt
            .toISOString()
            .slice(0, 7);

        // ==================================================
        // CREATE MONTH
        // ==================================================

        if (
          !monthlyMap[month]
        ) {
          monthlyMap[month] = {
            month,

            deposits: 0,

            amount: 0,

            pkr: 0,

            usdt: 0,
          };
        }

        // ==================================================
        // MONTHLY TOTAL
        // ==================================================

        monthlyMap[month].deposits += 1;

        monthlyMap[month].amount +=
          amount;

        // ==================================================
        // PKR
        // ==================================================

        if (
          walletType === "PKR"
        ) {
          monthlyMap[month].pkr +=
            amount;

          totalPKR += amount;
        }

        // ==================================================
        // USDT
        // ==================================================

        if (
          walletType === "USDT"
        ) {
          monthlyMap[month].usdt +=
            amount;

          totalUSDT += amount;
        }

        // ==================================================
        // ALL DEPOSITS TOTAL
        // ==================================================

        totalAmount += amount;
      }

      // ==================================================
      // SORT MONTHS
      // ==================================================

      const monthlyAnalytics =
        Object.values(
          monthlyMap
        )
          .sort(
            (a, b) =>
              a.month.localeCompare(
                b.month
              )
          )
          .map(
            (item) => ({
              month:
                item.month,

              deposits:
                item.deposits,

              amount:
                Number(
                  item.amount.toFixed(
                    2
                  )
                ),

              pkr:
                Number(
                  item.pkr.toFixed(
                    2
                  )
                ),

              usdt:
                Number(
                  item.usdt.toFixed(
                    6
                  )
                ),
            })
          );

      // ==================================================
      // AVERAGE DEPOSIT
      // ==================================================

      const averageDeposit =
        deposits.length > 0
          ? totalAmount /
            deposits.length
          : 0;

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        analytics: {
          totalApprovedDeposits:
            deposits.length,

          totalAmount:
            Number(
              totalAmount.toFixed(
                2
              )
            ),

          totalPKR:
            Number(
              totalPKR.toFixed(
                2
              )
            ),

          totalUSDT:
            Number(
              totalUSDT.toFixed(
                6
              )
            ),

          averageDeposit:
            Number(
              averageDeposit.toFixed(
                2
              )
            ),

          monthlyAnalytics,
        },

        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "DEPOSIT ANALYTICS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load deposit analytics.",

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
// ADMIN RECENT DEPOSITS
// GET /api/deposit/admin/recent
// ======================================================

router.get(
  "/admin/recent",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // SAFE LIMIT
      // ==================================================

      let limit =
        Number(
          req.query.limit
        );

      if (
        !Number.isFinite(limit) ||
        limit <= 0
      ) {
        limit = 20;
      }

      limit =
        Math.min(
          Math.floor(limit),
          100
        );

      // ==================================================
      // GET RECENT DEPOSITS
      // ==================================================

      const deposits =
        await Deposit.find({})
          .select(
            [
              "_id",
              "userId",
              "username",
              "fullName",
              "email",
              "walletType",
              "amount",
              "currency",
              "paymentMethod",
              "transactionId",
              "referenceId",
              "receiptImage",
              "receiptUploaded",
              "status",
              "note",
              "rejectReason",
              "approvedBy",
              "approvedByUsername",
              "approvedAt",
              "rejectedBy",
              "rejectedByUsername",
              "rejectedAt",
              "cancelledAt",
              "createdAt",
              "updatedAt",
            ].join(" ")
          )
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .limit(limit)
          .lean();

      // ==================================================
      // NORMALIZE RESPONSE
      // ==================================================

      const recentDeposits =
        deposits.map(
          (deposit) => ({
            ...deposit,

            id:
              deposit._id,

            status:
              String(
                deposit.status ||
                  ""
              ).toUpperCase(),

            walletType:
              String(
                deposit.walletType ||
                  ""
              ).toUpperCase(),

            amount:
              Number(
                Number(
                  deposit.amount || 0
                ).toFixed(6)
              ),
          })
        );

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        total:
          recentDeposits.length,

        limit,

        recentDeposits,
      });
    } catch (error) {
      console.error(
        "ADMIN RECENT DEPOSITS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load recent deposits.",

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
// ADMIN TOP DEPOSITORS
// GET /api/deposit/admin/top-depositors
//
// Approved deposits only.
// ======================================================

router.get(
  "/admin/top-depositors",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const topDepositors =
        await Deposit.aggregate([
          // =================================================
          // ONLY APPROVED
          // =================================================

          {
            $match: {
              status: {
                $in: [
                  "APPROVED",
                  "Approved",
                  "approved",
                ],
              },
            },
          },

          // =================================================
          // NORMALIZE FIELDS
          // =================================================

          {
            $project: {
              username: {
                $ifNull: [
                  "$username",
                  "Unknown",
                ],
              },

              amount: {
                $convert: {
                  input:
                    "$amount",

                  to: "double",

                  onError: 0,

                  onNull: 0,
                },
              },

              walletType: {
                $toUpper: {
                  $ifNull: [
                    "$walletType",
                    "",
                  ],
                },
              },

              createdAt: 1,
            },
          },

          // =================================================
          // GROUP BY USERNAME
          // =================================================

          {
            $group: {
              _id:
                "$username",

              totalDeposits: {
                $sum: 1,
              },

              totalAmount: {
                $sum:
                  "$amount",
              },

              pkrDeposits: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$walletType",
                        "PKR",
                      ],
                    },

                    "$amount",

                    0,
                  ],
                },
              },

              usdtDeposits: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$walletType",
                        "USDT",
                      ],
                    },

                    "$amount",

                    0,
                  ],
                },
              },

              lastDeposit: {
                $max:
                  "$createdAt",
              },
            },
          },

          // =================================================
          // SORT
          // =================================================

          {
            $sort: {
              totalAmount: -1,

              lastDeposit: -1,
            },
          },

          // =================================================
          // TOP 20
          // =================================================

          {
            $limit: 20,
          },
        ]);

      // ==================================================
      // NORMALIZE RESPONSE
      // ==================================================

      const depositors =
        topDepositors.map(
          (
            user,
            index
          ) => ({
            rank:
              index + 1,

            username:
              user._id ||
              "Unknown",

            totalDeposits:
              Number(
                user.totalDeposits ||
                  0
              ),

            totalAmount:
              Number(
                Number(
                  user.totalAmount ||
                    0
                ).toFixed(2)
              ),

            pkrDeposits:
              Number(
                Number(
                  user.pkrDeposits ||
                    0
                ).toFixed(2)
              ),

            usdtDeposits:
              Number(
                Number(
                  user.usdtDeposits ||
                    0
                ).toFixed(6)
              ),

            lastDeposit:
              user.lastDeposit ||
              null,
          })
        );

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        total:
          depositors.length,

        depositors,
      });
    } catch (error) {
      console.error(
        "TOP DEPOSITORS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load top depositors.",

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
// ADMIN USER DEPOSIT SUMMARY
// GET /api/deposit/admin/user-summary/:username
// ======================================================

router.get(
  "/admin/user-summary/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // VALIDATE USERNAME
      // ==================================================

      const rawUsername =
        String(
          req.params.username || ""
        ).trim();

      if (!rawUsername) {
        return res.status(400).json({
          success: false,

          message:
            "Username is required.",
        });
      }

      const username =
        rawUsername.toLowerCase();

      // ==================================================
      // FIND USER
      // ==================================================

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

      // ==================================================
      // LOAD WALLET + DEPOSITS
      // ==================================================

      const [
        wallet,
        deposits,
      ] = await Promise.all([
        Wallet.findOne({
          userId:
            user._id,
        }).lean(),

        Deposit.find({
          userId:
            user._id,
        })
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .lean(),
      ]);

      // ==================================================
      // STATISTICS
      // ==================================================

      let pendingAmount = 0;
      let approvedAmount = 0;
      let rejectedAmount = 0;
      let cancelledAmount = 0;

      let pendingCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      let cancelledCount = 0;

      let approvedPKR = 0;
      let approvedUSDT = 0;

      // ==================================================
      // PROCESS DEPOSITS
      // ==================================================

      for (
        const deposit of deposits
      ) {
        const status =
          String(
            deposit.status || ""
          ).toUpperCase();

        const walletType =
          String(
            deposit.walletType ||
              ""
          ).toUpperCase();

        const amount =
          Number(
            deposit.amount
          );

        const safeAmount =
          Number.isFinite(
            amount
          ) && amount > 0
            ? amount
            : 0;

        // ================================================
        // PENDING
        // ================================================

        if (
          status === "PENDING"
        ) {
          pendingCount += 1;

          pendingAmount +=
            safeAmount;
        }

        // ================================================
        // APPROVED
        // ================================================

        else if (
          status === "APPROVED"
        ) {
          approvedCount += 1;

          approvedAmount +=
            safeAmount;

          if (
            walletType ===
            "PKR"
          ) {
            approvedPKR +=
              safeAmount;
          }

          if (
            walletType ===
            "USDT"
          ) {
            approvedUSDT +=
              safeAmount;
          }
        }

        // ================================================
        // REJECTED
        // ================================================

        else if (
          status === "REJECTED"
        ) {
          rejectedCount += 1;

          rejectedAmount +=
            safeAmount;
        }

        // ================================================
        // CANCELLED
        // ================================================

        else if (
          status === "CANCELLED"
        ) {
          cancelledCount += 1;

          cancelledAmount +=
            safeAmount;
        }
      }

      // ==================================================
      // WALLET RESPONSE
      // ==================================================

      let walletData = null;

      if (wallet) {
        const pkrBalance =
          Number(
            wallet.pkrBalance ||
              0
          );

        const usdtBalance =
          Number(
            wallet.usdtBalance ||
              0
          );

        const goldBalance =
          Number(
            wallet.goldBalance ||
              0
          );

        const lockedPkr =
          Number(
            wallet.lockedPkr ||
              0
          );

        const lockedUsdt =
          Number(
            wallet.lockedUsdt ||
              0
          );

        const lockedGold =
          Number(
            wallet.lockedGold ||
              0
          );

        walletData = {
          pkrBalance,

          usdtBalance,

          goldBalance,

          lockedPkr,

          lockedUsdt,

          lockedGold,

          availablePkr:
            Math.max(
              0,
              pkrBalance -
                lockedPkr
            ),

          availableUsdt:
            Math.max(
              0,
              usdtBalance -
                lockedUsdt
            ),

          availableGold:
            Math.max(
              0,
              goldBalance -
                lockedGold
            ),

          status:
            wallet.status ||
            "Active",

          isFrozen:
            Boolean(
              wallet.isFrozen
            ),
        };
      }

      // ==================================================
      // NORMALIZE RECENT DEPOSITS
      // ==================================================

      const recentDeposits =
        deposits
          .slice(0, 10)
          .map(
            (deposit) => ({
              ...deposit,

              id:
                deposit._id,

              status:
                String(
                  deposit.status ||
                    ""
                ).toUpperCase(),

              walletType:
                String(
                  deposit.walletType ||
                    ""
                ).toUpperCase(),

              amount:
                Number(
                  Number(
                    deposit.amount ||
                      0
                  ).toFixed(6)
                ),
            })
          );

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        user: {
          id:
            user._id,

          username:
            user.username,

          fullName:
            user.fullName ||
            "",

          email:
            user.email ||
            "",

          role:
            user.role ||
            "user",

          joinedAt:
            user.createdAt ||
            null,
        },

        wallet:
          walletData,

        statistics: {
          totalDeposits:
            deposits.length,

          pendingCount,

          approvedCount,

          rejectedCount,

          cancelledCount,

          pendingAmount:
            Number(
              pendingAmount.toFixed(
                2
              )
            ),

          approvedAmount:
            Number(
              approvedAmount.toFixed(
                2
              )
            ),

          rejectedAmount:
            Number(
              rejectedAmount.toFixed(
                2
              )
            ),

          cancelledAmount:
            Number(
              cancelledAmount.toFixed(
                2
              )
            ),

          approvedPKR:
            Number(
              approvedPKR.toFixed(
                2
              )
            ),

          approvedUSDT:
            Number(
              approvedUSDT.toFixed(
                6
              )
            ),
        },

        recentDeposits,

        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "USER DEPOSIT SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load user deposit summary.",

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
// GET ADMIN DEPOSIT SETTINGS
// GET /api/deposit/settings
// ======================================================

router.get(
  "/settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await getDepositSettings();

      // ==================================================
      // NORMALIZE PAYMENT METHODS
      // ==================================================

      const methods =
        normalizeDepositPaymentMethods(
          settings.depositPaymentMethods ||
            []
        );

      return res.status(200).json({
        success: true,

        settings: {
          depositsEnabled:
            Boolean(
              settings.depositsEnabled
            ),

          minimumDeposit:
            Number(
              settings.minimumDeposit ||
                0
            ),

          maximumDeposit:
            Number(
              settings.maximumDeposit ||
                0
            ),

          methods,

          paymentMethods:
            methods,

          updatedAt:
            settings.updatedAt ||
            null,
        },
      });
    } catch (error) {
      console.error(
        "GET ADMIN DEPOSIT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load deposit settings.",

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
// GET PAYMENT SETTINGS
// GET /api/deposit/payment-settings
//
// Public endpoint used by Deposit Page.
// ======================================================

router.get(
  "/payment-settings",
  async (req, res) => {
    try {
      const settings =
        await getDepositSettings();

      // ==================================================
      // V18 PAYMENT METHODS
      // ==================================================

      const methods =
        normalizeDepositPaymentMethods(
          settings.depositPaymentMethods || []
        ).filter(
          (method) =>
            method.enabled !== false
        );

      // ==================================================
      // LEGACY PAYMENT SETTINGS
      // ==================================================

      const legacy =
        settings.paymentSettings || {};

      return res.status(200).json({
        success: true,

        // ==================================================
        // V18 STRUCTURE
        // ==================================================

        methods,

        paymentMethods:
          methods,

        total:
          methods.length,

        // ==================================================
        // LEGACY STRUCTURE
        // ==================================================

        paymentSettings: {
          bankName:
            legacy.bankName || "",

          accountTitle:
            legacy.accountTitle || "",

          accountNumber:
            legacy.accountNumber || "",

          usdtAddress:
            legacy.usdtAddress || "",

          usdtNetwork:
            legacy.usdtNetwork ||
            "TRC20",
        },

        depositsEnabled:
          Boolean(
            settings.depositsEnabled
          ),

        minimumDeposit:
          Number(
            settings.minimumDeposit || 0
          ),

        maximumDeposit:
          Number(
            settings.maximumDeposit || 0
          ),
      });
    } catch (error) {
      console.error(
        "GET PAYMENT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load payment settings.",

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
// UPDATE PAYMENT SETTINGS
// PATCH /api/deposit/payment-settings
//
// Admin Only
//
// Supports:
// - V18 paymentMethods
// - Legacy bank fields
// - Legacy USDT fields
// ======================================================

router.patch(
  "/payment-settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const {
        methods,
        paymentMethods,

        bankName,
        accountTitle,
        accountNumber,

        usdtAddress,
        usdtNetwork,
      } = req.body || {};

      const settings =
        await getDepositSettings();

      // ==================================================
      // NEW V18 PAYMENT METHODS
      // ==================================================

      const suppliedMethods =
        Array.isArray(
          paymentMethods
        )
          ? paymentMethods
          : Array.isArray(methods)
          ? methods
          : null;

      if (
        suppliedMethods !== null
      ) {
        if (
          suppliedMethods.length >
          20
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Maximum 20 payment methods are allowed.",
          });
        }

        const normalizedMethods =
          normalizeDepositPaymentMethods(
            suppliedMethods
          );

        // ==================================================
        // DUPLICATE METHOD CHECK
        // ==================================================

        const methodTypes =
          normalizedMethods.map(
            (method) =>
              String(
                method.type || ""
              )
                .trim()
                .toUpperCase()
          );

        const uniqueTypes =
          new Set(
            methodTypes
          );

        if (
          uniqueTypes.size !==
          methodTypes.length
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Duplicate payment method types are not allowed.",
          });
        }

        settings.depositPaymentMethods =
          normalizedMethods;
      }

      // ==================================================
      // LEGACY PAYMENT SETTINGS
      //
      // Keep these fields so old frontend/admin
      // screens remain compatible.
      // ==================================================

      const currentLegacy =
        settings.paymentSettings ||
        {};

      const hasLegacyFields =
        bankName !== undefined ||
        accountTitle !== undefined ||
        accountNumber !== undefined ||
        usdtAddress !== undefined ||
        usdtNetwork !== undefined;

      if (
        hasLegacyFields
      ) {
        settings.paymentSettings = {
          bankName:
            bankName !== undefined
              ? String(
                  bankName
                ).trim()
              : currentLegacy.bankName ||
                "",

          accountTitle:
            accountTitle !== undefined
              ? String(
                  accountTitle
                ).trim()
              : currentLegacy.accountTitle ||
                "",

          accountNumber:
            accountNumber !== undefined
              ? String(
                  accountNumber
                ).trim()
              : currentLegacy.accountNumber ||
                "",

          usdtAddress:
            usdtAddress !== undefined
              ? String(
                  usdtAddress
                ).trim()
              : currentLegacy.usdtAddress ||
                "",

          usdtNetwork:
            usdtNetwork !== undefined
              ? String(
                  usdtNetwork
                ).trim()
              : currentLegacy.usdtNetwork ||
                "TRC20",
        };
      }

      // ==================================================
      // SAVE
      // ==================================================

      await settings.save();

      // ==================================================
      // FINAL METHODS
      // ==================================================

      const finalMethods =
        normalizeDepositPaymentMethods(
          settings.depositPaymentMethods ||
            []
        );

      const finalLegacy =
        settings.paymentSettings ||
        {};

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Payment settings updated successfully.",

        methods:
          finalMethods,

        paymentMethods:
          finalMethods,

        total:
          finalMethods.length,

        paymentSettings: {
          bankName:
            finalLegacy.bankName ||
            "",

          accountTitle:
            finalLegacy.accountTitle ||
            "",

          accountNumber:
            finalLegacy.accountNumber ||
            "",

          usdtAddress:
            finalLegacy.usdtAddress ||
            "",

          usdtNetwork:
            finalLegacy.usdtNetwork ||
            "TRC20",
        },

        updatedAt:
          settings.updatedAt ||
          null,
      });
    } catch (error) {
      console.error(
        "UPDATE PAYMENT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to update payment settings.",

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
// GET PUBLIC PAYMENT DETAILS
// GET /api/deposit/payment-details
//
// User Deposit Page
// No Login Required
// ======================================================

router.get(
  "/payment-details",
  async (req, res) => {
    try {
      const settings =
        await getDepositSettings();

      // ==================================================
      // V18 PAYMENT METHODS
      // ==================================================

      const methods =
        normalizeDepositPaymentMethods(
          settings.depositPaymentMethods ||
            []
        ).filter(
          (method) =>
            method.enabled !== false
        );

      // ==================================================
      // LEGACY PAYMENT SETTINGS
      // ==================================================

      const payment =
        settings.paymentSettings ||
        {};

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        depositsEnabled:
          Boolean(
            settings.depositsEnabled
          ),

        minimumDeposit:
          Number(
            settings.minimumDeposit ||
              0
          ),

        maximumDeposit:
          Number(
            settings.maximumDeposit ||
              0
          ),

        // ==================================================
        // V18
        // ==================================================

        methods,

        paymentMethods:
          methods,

        total:
          methods.length,

        // ==================================================
        // LEGACY
        // ==================================================

        bank: {
          bankName:
            payment.bankName ||
            "",

          accountTitle:
            payment.accountTitle ||
            "",

          accountNumber:
            payment.accountNumber ||
            "",
        },

        usdt: {
          address:
            payment.usdtAddress ||
            "",

          network:
            payment.usdtNetwork ||
            "TRC20",
        },
      });
    } catch (error) {
      console.error(
        "GET PAYMENT DETAILS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load payment details.",

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
// GENERATE DEPOSIT REFERENCE ID
// ======================================================

const generateDepositReference = () => {
  const random =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  return `DEP-${Date.now()}-${random}`;
};


// ======================================================
// VALIDATE PAYMENT METHOD
//
// V18:
// Primary validation is against configured
// depositPaymentMethods.
//
// Legacy hard-coded methods remain fallback.
// ======================================================

const validatePaymentMethod = (
  walletType,
  paymentMethod,
  network = "",
  configuredMethods = []
) => {
  const type =
    String(
      walletType || ""
    )
      .trim()
      .toUpperCase();

  const method =
    String(
      paymentMethod || ""
    )
      .trim()
      .toUpperCase();

  const chain =
    String(
      network || ""
    )
      .trim()
      .toUpperCase();

  // ==================================================
  // BASIC VALIDATION
  // ==================================================

  if (
    !["PKR", "USDT"].includes(
      type
    )
  ) {
    return false;
  }

  if (!method) {
    return false;
  }

  // ==================================================
  // CONFIGURED V18 METHODS
  // ==================================================

  if (
    Array.isArray(
      configuredMethods
    ) &&
    configuredMethods.length > 0
  ) {
    const normalizedMethods =
      normalizeDepositPaymentMethods(
        configuredMethods
      );

    const activeMethods =
      normalizedMethods.filter(
        (item) =>
          item.enabled !== false
      );

    const matched =
      activeMethods.find(
        (item) => {
          const configuredType =
            String(
              item.type || ""
            )
              .trim()
              .toUpperCase();

          return (
            configuredType ===
              method ||
            configuredType ===
              `${type}_${method}` ||
            configuredType ===
              `${method}_${type}`
          );
        }
      );

    if (!matched) {
      return false;
    }

    // ==================================================
    // USDT NETWORK VALIDATION
    // ==================================================

    if (
      type === "USDT" &&
      chain
    ) {
      const allowedNetworks = [
        "TRC20",
        "ERC20",
        "BEP20",
        "POLYGON",
        "SOL",
      ];

      if (
        !allowedNetworks.includes(
          chain
        )
      ) {
        return false;
      }
    }

    return true;
  }

  // ==================================================
  // LEGACY FALLBACK
  // ==================================================

  const PKR_METHODS = [
    "BANK",
    "BANK_TRANSFER",
    "JAZZCASH",
    "EASYPAISA",
    "NAYA PAY",
    "SADAPAY",
    "UPAY",
    "MANUAL",
  ];

  const USDT_METHODS = [
    "USDT",
    "CRYPTO",
    "BINANCE",
    "TRUST WALLET",
    "BYBIT",
    "OKX",
    "KUCOIN",
  ];

  const NETWORKS = [
    "TRC20",
    "ERC20",
    "BEP20",
    "POLYGON",
    "SOL",
  ];

  if (
    type === "PKR"
  ) {
    return PKR_METHODS.includes(
      method
    );
  }

  if (
    type === "USDT"
  ) {
    return (
      USDT_METHODS.includes(
        method
      ) &&
      NETWORKS.includes(
        chain
      )
    );
  }

  return false;
};


// ======================================================
// VALIDATE RECEIPT
//
// Supports:
// - data URL
// - normal image URL
// - stored receipt path
// ======================================================

const validateReceipt = (
  receiptImage
) => {
  if (!receiptImage) {
    return {
      valid: false,

      message:
        "Deposit receipt is required.",
    };
  }

  if (
    typeof receiptImage !==
    "string"
  ) {
    return {
      valid: false,

      message:
        "Receipt must be a string.",
    };
  }

  const receipt =
    receiptImage.trim();

  if (
    receipt.length < 20
  ) {
    return {
      valid: false,

      message:
        "Invalid receipt image.",
    };
  }

  // ==================================================
  // DATA URL CHECK
  // ==================================================

  if (
    receipt.startsWith(
      "data:image/"
    )
  ) {
    const validDataUrl =
      /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(
        receipt
      );

    if (!validDataUrl) {
      return {
        valid: false,

        message:
          "Invalid image data.",
      };
    }
  }

  return {
    valid: true,
  };
};


// ======================================================
// DUPLICATE TRANSACTION CHECK
//
// Checks transactionId and referenceId.
// ======================================================

const isDuplicateTransaction =
  async (
    transactionId,
    referenceId
  ) => {
    const cleanTransactionId =
      String(
        transactionId || ""
      ).trim();

    const cleanReferenceId =
      String(
        referenceId || ""
      ).trim();

    if (
      !cleanTransactionId &&
      !cleanReferenceId
    ) {
      return false;
    }

    const conditions = [];

    if (
      cleanTransactionId
    ) {
      conditions.push({
        transactionId:
          cleanTransactionId,
      });
    }

    if (
      cleanReferenceId
    ) {
      conditions.push({
        referenceId:
          cleanReferenceId,
      });
    }

    if (
      conditions.length === 0
    ) {
      return false;
    }

    const existing =
      await Deposit.findOne({
        $or: conditions,
      })
        .select(
          "_id status"
        )
        .lean();

    return Boolean(
      existing
    );
  };


// ======================================================
// VALIDATE DEPOSIT LIMITS
//
// Uses global configured minimum/maximum.
// ======================================================

const validateDepositLimits = (
  walletType,
  amount,
  settings
) => {
  const type =
    String(
      walletType || ""
    )
      .trim()
      .toUpperCase();

  const value =
    Number(amount);

  // ==================================================
  // WALLET TYPE
  // ==================================================

  if (
    !["PKR", "USDT"].includes(
      type
    )
  ) {
    return {
      valid: false,

      message:
        "Invalid wallet type.",
    };
  }

  // ==================================================
  // AMOUNT
  // ==================================================

  if (
    !Number.isFinite(
      value
    ) ||
    value <= 0
  ) {
    return {
      valid: false,

      message:
        "Deposit amount must be greater than zero.",
    };
  }

  // ==================================================
  // SETTINGS
  // ==================================================

  const minimum =
    Number(
      settings?.minimumDeposit
    );

  const maximum =
    Number(
      settings?.maximumDeposit
    );

  if (
    !Number.isFinite(
      minimum
    ) ||
    minimum <= 0
  ) {
    return {
      valid: false,

      message:
        "Deposit minimum is not configured correctly.",
    };
  }

  if (
    !Number.isFinite(
      maximum
    ) ||
    maximum <= 0
  ) {
    return {
      valid: false,

      message:
        "Deposit maximum is not configured correctly.",
    };
  }

  if (
    minimum > maximum
  ) {
    return {
      valid: false,

      message:
        "Deposit limits are configured incorrectly.",
    };
  }

  // ==================================================
  // MINIMUM
  // ==================================================

  if (
    value < minimum
  ) {
    return {
      valid: false,

      message:
        `Minimum deposit is ${minimum}.`,
    };
  }

  // ==================================================
  // MAXIMUM
  // ==================================================

  if (
    value > maximum
  ) {
    return {
      valid: false,

      message:
        `Maximum deposit is ${maximum}.`,
    };
  }

  // ==================================================
  // USDT SAFETY LIMIT
  // ==================================================

  if (
    type === "USDT" &&
    value > 1000000
  ) {
    return {
      valid: false,

      message:
        "USDT deposit exceeds allowed limit.",
    };
  }

  return {
    valid: true,
  };
};


// ======================================================
// VERIFY PAYMENT CONFIGURATION
//
// V18:
// depositPaymentMethods = primary
// paymentSettings = legacy fallback
// ======================================================

const verifyPaymentConfiguration =
  async (
    walletType,
    paymentMethod = ""
  ) => {
    const type =
      String(
        walletType || ""
      )
        .trim()
        .toUpperCase();

    const method =
      String(
        paymentMethod || ""
      )
        .trim()
        .toUpperCase();

    // ==================================================
    // VALIDATE WALLET TYPE
    // ==================================================

    if (
      !["PKR", "USDT"].includes(
        type
      )
    ) {
      return {
        valid: false,

        message:
          "Invalid wallet type.",
      };
    }

    // ==================================================
    // LOAD SETTINGS
    // ==================================================

    const settings =
      await getDepositSettings();

    // ==================================================
    // DEPOSITS ENABLED
    // ==================================================

    if (
      !settings.depositsEnabled
    ) {
      return {
        valid: false,

        message:
          "Deposits are currently disabled.",
      };
    }

// ==================================================
// V18 PAYMENT METHODS
// ==================================================

const methods =
  normalizeDepositPaymentMethods(
    settings.depositPaymentMethods || []
  ).filter(
    (item) =>
      item.enabled !== false
  );

// ==================================================
// IF V18 METHODS ARE CONFIGURED
// ==================================================

if (
  methods.length > 0
) {
  // -----------------------------------------------
  // Specific method supplied
  // -----------------------------------------------

  if (method) {
    const matched =
      methods.find(
        (item) => {
          const configured =
            String(
              item.type || ""
            )
              .trim()
              .toUpperCase();

          return (
            configured ===
              method ||
            configured ===
              `${type}_${method}` ||
            configured ===
              `${method}_${type}`
          );
        }
      );

    if (!matched) {
      return {
        valid: false,

        message:
          "Selected payment method is not available.",
      };
    }

    return {
      valid: true,

      method:
        matched,
    };
  }

  // -----------------------------------------------
  // No method supplied
  // -----------------------------------------------

  const hasTypeMethod =
    methods.some(
      (item) => {
        const configured =
          String(
            item.type || ""
          )
            .trim()
            .toUpperCase();

        return (
          configured.includes(
            type
          ) ||

          (
            type === "PKR" &&
            [
              "BANK",
              "BANK_TRANSFER",
              "JAZZCASH",
              "EASYPAISA",
              "NAYA PAY",
              "SADAPAY",
              "UPAY",
              "MANUAL",
            ].includes(
              configured
            )
          ) ||

          (
            type === "USDT" &&
            [
              "USDT",
              "CRYPTO",
              "BINANCE",
              "TRUST WALLET",
              "BYBIT",
              "OKX",
              "KUCOIN",
            ].includes(
              configured
            )
          )
        );
      }
    );

  if (!hasTypeMethod) {
    return {
      valid: false,

      message:
        `No active ${type} payment method is configured.`,
    };
  }

  return {
    valid: true,
  };
}

// ==================================================
// LEGACY PAYMENT SETTINGS FALLBACK
// ==================================================

const payment =
  settings.paymentSettings || {};

if (type === "PKR") {
  if (
    !payment.bankName ||
    !payment.accountNumber
  ) {
    return {
      valid: false,

      message:
        "PKR payment account is not configured.",
    };
  }
}

if (type === "USDT") {
  if (!payment.usdtAddress) {
    return {
      valid: false,

      message:
        "USDT wallet address is not configured.",
    };
  }
}

return {
  valid: true,
};
};
  
 // ======================================================
// ADMIN GET ALL DEPOSITS
// GET /api/deposit/admin/all
//
// Used by:
// frontend/app/admin/deposits/page.tsx
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

      let page =
        Number(req.query.page);

      let limit =
        Number(req.query.limit);

      if (
        !Number.isFinite(page) ||
        page < 1
      ) {
        page = 1;
      }

      if (
        !Number.isFinite(limit) ||
        limit < 1
      ) {
        limit = 20;
      }

      page = Math.floor(page);

      limit = Math.min(
        Math.floor(limit),
        100
      );

      const skip =
        (page - 1) * limit;

      // ==================================================
      // FILTERS
      // ==================================================

      const {
        status,
        walletType,
        username,
        paymentMethod,
        start,
        end,
      } = req.query;

      const query = {};

      // ==================================================
      // STATUS
      // ==================================================

      if (status) {
        const normalizedStatus =
          String(status)
            .trim()
            .toUpperCase();

        const statusMap = {
          PENDING: [
            "PENDING",
            "Pending",
            "pending",
          ],

          APPROVED: [
            "APPROVED",
            "Approved",
            "approved",
          ],

          REJECTED: [
            "REJECTED",
            "Rejected",
            "rejected",
          ],

          CANCELLED: [
            "CANCELLED",
            "Cancelled",
            "cancelled",
          ],
        };

        if (
          statusMap[
            normalizedStatus
          ]
        ) {
          query.status = {
            $in:
              statusMap[
                normalizedStatus
              ],
          };
        } else {
          return res.status(400).json({
            success: false,
            message:
              "Invalid deposit status.",
          });
        }
      }

      // ==================================================
      // WALLET TYPE
      // ==================================================

      if (walletType) {
        const normalizedWalletType =
          String(walletType)
            .trim()
            .toUpperCase();

        if (
          !["PKR", "USDT"].includes(
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
      // USERNAME
      // ==================================================

      if (username) {
        const cleanUsername =
          String(username)
            .trim();

        if (cleanUsername) {
          query.username = {
            $regex:
              cleanUsername.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              ),
            $options: "i",
          };
        }
      }

      // ==================================================
      // PAYMENT METHOD
      // ==================================================

      if (paymentMethod) {
        const cleanMethod =
          String(paymentMethod)
            .trim();

        if (cleanMethod) {
          query.paymentMethod = {
            $regex:
              cleanMethod.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              ),
            $options: "i",
          };
        }
      }

      // ==================================================
      // DATE FILTER
      // ==================================================

      if (start || end) {
        query.createdAt = {};

        if (start) {
          const startDate =
            new Date(start);

          if (
            Number.isNaN(
              startDate.getTime()
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid start date.",
            });
          }

          startDate.setHours(
            0,
            0,
            0,
            0
          );

          query.createdAt.$gte =
            startDate;
        }

        if (end) {
          const endDate =
            new Date(end);

          if (
            Number.isNaN(
              endDate.getTime()
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid end date.",
            });
          }

          endDate.setHours(
            23,
            59,
            59,
            999
          );

          query.createdAt.$lte =
            endDate;
        }

        // ----------------------------------------------
        // START > END
        // ----------------------------------------------

        if (
          query.createdAt.$gte &&
          query.createdAt.$lte &&
          query.createdAt.$gte >
            query.createdAt.$lte
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Start date cannot be greater than end date.",
          });
        }
      }

      // ==================================================
      // QUERY DATABASE
      // ==================================================

      const [
        total,
        deposits,
      ] = await Promise.all([
        Deposit.countDocuments(query),

        Deposit.find(query)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),
      ]);

      // ==================================================
      // NORMALIZE RESPONSE
      // ==================================================

      const normalizedDeposits =
        deposits.map(
          (deposit) => ({
            ...deposit,

            id: deposit._id,

            status: String(
              deposit.status || ""
            ).toUpperCase(),

            walletType: String(
              deposit.walletType || ""
            ).toUpperCase(),

            amount: Number(
              Number(
                deposit.amount || 0
              ).toFixed(6)
            ),
          })
        );

      const totalPages =
        total > 0
          ? Math.ceil(
              total / limit
            )
          : 0;

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        pagination: {
          page,
          limit,
          total,
          totalPages,

          hasNext:
            page < totalPages,

          hasPrevious:
            page > 1 &&
            totalPages > 0,
        },

        deposits:
          normalizedDeposits,

        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "ADMIN GET ALL DEPOSITS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load deposits.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// ADMIN GET SINGLE DEPOSIT
// GET /api/deposit/admin/:id
// ======================================================

router.get(
  "/admin/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // VALIDATE ID
      // ==================================================

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid deposit ID.",
        });
      }

      // ==================================================
      // LOAD DEPOSIT + WALLET
      // ==================================================

      const deposit =
        await Deposit.findById(
          req.params.id
        ).lean();

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message:
            "Deposit not found.",
        });
      }

      const wallet =
        await Wallet.findOne({
          userId:
            deposit.userId,
        }).lean();

      // ==================================================
      // WALLET DATA
      // ==================================================

      let walletData = null;

      if (wallet) {
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

        const lockedGold =
          Number(
            wallet.lockedGold || 0
          );

        walletData = {
          pkrBalance,

          usdtBalance,

          goldBalance,

          lockedPkr,

          lockedUsdt,

          lockedGold,

          availablePkr:
            Math.max(
              0,
              pkrBalance -
                lockedPkr
            ),

          availableUsdt:
            Math.max(
              0,
              usdtBalance -
                lockedUsdt
            ),

          availableGold:
            Math.max(
              0,
              goldBalance -
                lockedGold
            ),

          status:
            wallet.status ||
            "Active",

          isFrozen:
            Boolean(
              wallet.isFrozen
            ),
        };
      }

      // ==================================================
      // NORMALIZED DEPOSIT
      // ==================================================

      const normalizedDeposit = {
        ...deposit,

        id: deposit._id,

        status: String(
          deposit.status || ""
        ).toUpperCase(),

        walletType: String(
          deposit.walletType || ""
        ).toUpperCase(),

        amount: Number(
          Number(
            deposit.amount || 0
          ).toFixed(6)
        ),
      };

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        deposit:
          normalizedDeposit,

        wallet:
          walletData,

        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "ADMIN GET DEPOSIT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load deposit details.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// ADMIN SEARCH DEPOSITS
// GET /api/deposit/admin/search
//
// Query:
// ?reference=DEP-123
// ?transactionId=ABC123
// ======================================================

router.get(
  "/admin/search",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const reference = String(
        req.query.reference || ""
      ).trim();

      const transactionId = String(
        req.query.transactionId || ""
      ).trim();

      // ==================================================
      // AT LEAST ONE SEARCH FIELD
      // ==================================================

      if (!reference && !transactionId) {
        return res.status(400).json({
          success: false,
          message:
            "Reference or transactionId is required.",
        });
      }

      const query = {};

      // ==================================================
      // ESCAPE REGEX
      // ==================================================

      const escapeRegex = (value) =>
        value.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

      // ==================================================
      // REFERENCE SEARCH
      // ==================================================

      if (reference) {
        query.referenceId = {
          $regex:
            escapeRegex(reference),
          $options: "i",
        };
      }

      // ==================================================
      // TRANSACTION ID SEARCH
      // ==================================================

      if (transactionId) {
        query.transactionId = {
          $regex:
            escapeRegex(
              transactionId
            ),
          $options: "i",
        };
      }

      // ==================================================
      // SEARCH
      // ==================================================

      const deposits =
        await Deposit.find(query)
          .sort({
            createdAt: -1,
          })
          .limit(100)
          .lean();

      // ==================================================
      // NORMALIZE
      // ==================================================

      const normalizedDeposits =
        deposits.map(
          (deposit) => ({
            ...deposit,

            id: deposit._id,

            status: String(
              deposit.status || ""
            ).toUpperCase(),

            walletType: String(
              deposit.walletType || ""
            ).toUpperCase(),

            amount: Number(
              Number(
                deposit.amount || 0
              ).toFixed(6)
            ),
          })
        );

      return res.status(200).json({
        success: true,

        total:
          normalizedDeposits.length,

        deposits:
          normalizedDeposits,
      });
    } catch (error) {
      console.error(
        "ADMIN SEARCH DEPOSITS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to search deposits.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// ADMIN RECEIPT PREVIEW
// GET /api/deposit/admin/receipt/:id
// ======================================================

router.get(
  "/admin/receipt/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // VALIDATE ID
      // ==================================================

      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid deposit ID.",
        });
      }

      // ==================================================
      // FIND RECEIPT
      // ==================================================

      const deposit =
        await Deposit.findById(
          req.params.id
        )
          .select(
            [
              "_id",
              "receiptImage",
              "receiptUploaded",
              "username",
              "walletType",
              "amount",
              "status",
              "transactionId",
              "referenceId",
              "paymentMethod",
              "createdAt",
            ].join(" ")
          )
          .lean();

      if (!deposit) {
        return res.status(404).json({
          success: false,
          message:
            "Deposit not found.",
        });
      }

      // ==================================================
      // NORMALIZE
      // ==================================================

      const receipt = {
        ...deposit,

        id: deposit._id,

        status: String(
          deposit.status || ""
        ).toUpperCase(),

        walletType: String(
          deposit.walletType || ""
        ).toUpperCase(),

        amount: Number(
          Number(
            deposit.amount || 0
          ).toFixed(6)
        ),
      };

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        receipt,
      });
    } catch (error) {
      console.error(
        "RECEIPT PREVIEW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load receipt.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// BULK APPROVE DEPOSITS
// PATCH /api/deposit/admin/bulk-approve
//
// Body:
// {
//   "depositIds": ["id1", "id2"]
// }
//
// Only PENDING deposits are approved.
// Each deposit is processed in its own MongoDB
// transaction so one failure cannot partially approve
// that particular deposit.
// ======================================================

router.patch(
  "/admin/bulk-approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const rawDepositIds =
        req.body?.depositIds;

      // ==================================================
      // VALIDATE ARRAY
      // ==================================================

      if (
        !Array.isArray(
          rawDepositIds
        ) ||
        rawDepositIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "depositIds array is required.",
        });
      }

      // ==================================================
      // LIMIT BULK REQUEST
      // ==================================================

      if (
        rawDepositIds.length > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum 100 deposits can be approved at once.",
        });
      }

      // ==================================================
      // REMOVE DUPLICATES
      // ==================================================

      const depositIds = [
        ...new Set(
          rawDepositIds.map(
            (id) => String(id).trim()
          )
        ),
      ];

      // ==================================================
      // VALIDATE ALL OBJECT IDS
      // ==================================================

      const invalidIds =
        depositIds.filter(
          (id) =>
            !mongoose.Types.ObjectId.isValid(
              id
            )
        );

      if (
        invalidIds.length > 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "One or more deposit IDs are invalid.",

          invalidIds,
        });
      }

      // ==================================================
      // COUNTERS
      // ==================================================

      let approved = 0;
      let skipped = 0;

      const failed = [];

      // ==================================================
      // PROCESS EACH DEPOSIT
      // ==================================================

      for (const depositId of depositIds) {
        const session =
          await mongoose.startSession();

        try {
          let processed = false;

          await session.withTransaction(
            async () => {
              // ==========================================
              // FIND DEPOSIT
              // ==========================================

              const deposit =
                await Deposit.findById(
                  depositId
                ).session(session);

              if (!deposit) {
                skipped += 1;
                return;
              }

              // ==========================================
              // STATUS
              // ==========================================

              const currentStatus =
                String(
                  deposit.status || ""
                ).toUpperCase();

              if (
                currentStatus !==
                "PENDING"
              ) {
                skipped += 1;
                return;
              }

              // ==========================================
              // WALLET TYPE
              // ==========================================

              const walletType =
                String(
                  deposit.walletType ||
                    ""
                )
                  .trim()
                  .toUpperCase();

              if (
                !["PKR", "USDT"].includes(
                  walletType
                )
              ) {
                throw new Error(
                  "Invalid wallet type."
                );
              }

              // ==========================================
              // AMOUNT
              // ==========================================

              const amount =
                Number(
                  deposit.amount
                );

              if (
                !Number.isFinite(
                  amount
                ) ||
                amount <= 0
              ) {
                throw new Error(
                  "Invalid deposit amount."
                );
              }

              // ==========================================
              // FIND WALLET
              // ==========================================

              const wallet =
                await Wallet.findOne({
                  userId:
                    deposit.userId,
                }).session(session);

              if (!wallet) {
                throw new Error(
                  "User wallet not found."
                );
              }

              // ==========================================
              // FROZEN WALLET CHECK
              // ==========================================

              if (
                wallet.isFrozen === true
              ) {
                throw new Error(
                  "User wallet is frozen."
                );
              }

              // ==========================================
              // WALLET BEFORE
              // ==========================================

              const walletBefore = {
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

                lockedGold:
                  Number(
                    wallet.lockedGold ||
                      0
                  ),
              };

              // ==========================================
              // BALANCE BEFORE
              // ==========================================

              const balanceBefore =
                walletType === "PKR"
                  ? walletBefore.pkrBalance
                  : walletBefore.usdtBalance;

              // ==========================================
              // CREDIT WALLET
              // ==========================================

              if (
                walletType === "PKR"
              ) {
                wallet.pkrBalance =
                  walletBefore.pkrBalance +
                  amount;

                wallet.totalPkrDeposit =
                  Number(
                    wallet.totalPkrDeposit ||
                      0
                  ) + amount;
              } else {
                wallet.usdtBalance =
                  walletBefore.usdtBalance +
                  amount;

                wallet.totalUsdtDeposited =
                  Number(
                    wallet.totalUsdtDeposited ||
                      0
                  ) + amount;
              }

              // ==========================================
              // COMMON TOTAL
              // ==========================================

              wallet.totalDeposit =
                Number(
                  wallet.totalDeposit ||
                    0
                ) + amount;

              wallet.lastDepositAt =
                new Date();

              // ==========================================
              // WALLET AFTER
              // ==========================================

              const walletAfter = {
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

                lockedGold:
                  Number(
                    wallet.lockedGold ||
                      0
                  ),
              };

              const balanceAfter =
                walletType === "PKR"
                  ? walletAfter.pkrBalance
                  : walletAfter.usdtBalance;

              // ==========================================
              // SAVE WALLET
              // ==========================================

              await wallet.save({
                session,
              });

              // ==========================================
              // UPDATE DEPOSIT
              // ==========================================

              deposit.walletBefore =
                walletBefore;

              deposit.walletAfter =
                walletAfter;

              deposit.status =
                "APPROVED";

              deposit.approvedBy =
                req.user.id;

              deposit.approvedByUsername =
                req.user.username ||
                "Admin";

              deposit.approvedAt =
                new Date();

              await deposit.save({
                session,
              });

              // ==========================================
              // WALLET HISTORY
              // ==========================================

              await WalletHistory.create(
                [
                  {
                    userId:
                      deposit.userId,

                    username:
                      deposit.username,

                    walletType,

                    type:
                      "DEPOSIT_APPROVED",

                    transactionType:
                      "DEPOSIT_APPROVED",

                    transactionMode:
                      "CREDIT",

                    amount,

                    balanceBefore,

                    balanceAfter,

                    status:
                      "Completed",

                    paymentMethod:
                      deposit.paymentMethod ||
                      "",

                    referenceId:
                      deposit._id.toString(),

                    admin:
                      req.user.username ||
                      "Admin",

                    adminId:
                      req.user.id,

                    adminUsername:
                      req.user.username ||
                      "Admin",

                    note:
                      "Bulk deposit approved.",
                  },
                ],
                {
                  session,
                }
              );

              // ==========================================
              // TRANSACTION
              // ==========================================

              await Transaction.create(
                [
                  {
                    userId:
                      deposit.userId,

                    username:
                      deposit.username,

                    walletType,

                    transactionType:
                      "DEPOSIT_APPROVED",

                    transactionMode:
                      "CREDIT",

                    amount,

                    balanceBefore,

                    balanceAfter,

                    status:
                      "Completed",

                    paymentMethod:
                      deposit.paymentMethod ||
                      "",

                    referenceId:
                      deposit._id.toString(),

                    adminId:
                      req.user.id,

                    adminUsername:
                      req.user.username ||
                      "Admin",

                    note:
                      "Bulk deposit approved.",
                  },
                ],
                {
                  session,
                }
              );

              processed = true;
            }
          );

          if (processed) {
            approved += 1;
          }
        } catch (err) {
          console.error(
            `BULK APPROVE ${depositId} ERROR:`,
            err
          );

          failed.push({
            depositId,

            error:
              err.message ||
              "Unable to approve deposit.",
          });
        } finally {
          await session.endSession();
        }
      }

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Bulk approve completed.",

        result: {
          requested:
            depositIds.length,

          approved,

          skipped,

          failed:
            failed.length,
        },

        failed,
      });
    } catch (error) {
      console.error(
        "BULK APPROVE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Bulk approval failed.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// BULK REJECT DEPOSITS
// PATCH /api/deposit/admin/bulk-reject
//
// Body:
// {
//   depositIds: [],
//   rejectReason: "Reason"
// }
//
// Only PENDING deposits can be rejected.
// Wallet balance is NOT changed.
// ======================================================

router.patch(
  "/admin/bulk-reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const {
        depositIds,
        rejectReason,
      } = req.body || {};

      // ==================================================
      // VALIDATE ARRAY
      // ==================================================

      if (
        !Array.isArray(depositIds) ||
        depositIds.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "depositIds array is required.",
        });
      }

      // ==================================================
      // LIMIT
      // ==================================================

      if (depositIds.length > 100) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum 100 deposits can be rejected at once.",
        });
      }

      // ==================================================
      // REJECTION REASON
      // ==================================================

      const reason =
        typeof rejectReason === "string"
          ? rejectReason.trim()
          : "";

      const finalReason =
        reason ||
        "Bulk rejected by admin.";

      if (finalReason.length > 500) {
        return res.status(400).json({
          success: false,
          message:
            "Reject reason cannot exceed 500 characters.",
        });
      }

      // ==================================================
      // REMOVE DUPLICATES
      // ==================================================

      const uniqueDepositIds = [
        ...new Set(
          depositIds.map(
            (id) => String(id).trim()
          )
        ),
      ];

      // ==================================================
      // VALIDATE OBJECT IDS
      // ==================================================

      const invalidIds =
        uniqueDepositIds.filter(
          (id) =>
            !mongoose.Types.ObjectId.isValid(
              id
            )
        );

      if (invalidIds.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "One or more deposit IDs are invalid.",
          invalidIds,
        });
      }

      // ==================================================
      // COUNTERS
      // ==================================================

      let rejected = 0;
      let skipped = 0;

      const failed = [];

      // ==================================================
      // PROCESS EACH DEPOSIT
      // ==================================================

      for (
        const depositId of uniqueDepositIds
      ) {
        const session =
          await mongoose.startSession();

        try {
          let processed = false;

          await session.withTransaction(
            async () => {
              // ==========================================
              // FIND DEPOSIT
              // ==========================================

              const deposit =
                await Deposit.findById(
                  depositId
                ).session(session);

              if (!deposit) {
                skipped += 1;
                return;
              }

              // ==========================================
              // STATUS CHECK
              // ==========================================

              const currentStatus =
                String(
                  deposit.status || ""
                ).toUpperCase();

              if (
                currentStatus !==
                "PENDING"
              ) {
                skipped += 1;
                return;
              }

              // ==========================================
              // WALLET TYPE
              // ==========================================

              const walletType =
                String(
                  deposit.walletType ||
                    ""
                )
                  .trim()
                  .toUpperCase();

              if (
                !["PKR", "USDT"].includes(
                  walletType
                )
              ) {
                throw new Error(
                  "Invalid deposit wallet type."
                );
              }

              // ==========================================
              // AMOUNT
              // ==========================================

              const amount =
                Number(
                  deposit.amount
                );

              if (
                !Number.isFinite(
                  amount
                ) ||
                amount <= 0
              ) {
                throw new Error(
                  "Invalid deposit amount."
                );
              }

              // ==========================================
              // WALLET
              // ==========================================

              const wallet =
                await Wallet.findOne({
                  userId:
                    deposit.userId,
                })
                  .session(session)
                  .lean();

              if (!wallet) {
                throw new Error(
                  "User wallet not found."
                );
              }

              // ==========================================
              // WALLET SNAPSHOT
              // ==========================================

              const walletBefore = {
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

                lockedGold:
                  Number(
                    wallet.lockedGold ||
                      0
                  ),
              };

              const balanceBefore =
                walletType === "PKR"
                  ? walletBefore.pkrBalance
                  : walletBefore.usdtBalance;

              // ==========================================
              // DEPOSIT UPDATE
              // ==========================================

              deposit.walletBefore =
                deposit.walletBefore ||
                walletBefore;

              deposit.walletAfter =
                walletBefore;

              deposit.status =
                "REJECTED";

              deposit.rejectReason =
                finalReason;

              // IMPORTANT:
              // Rejection uses rejection fields,
              // NOT approvedBy.
              if (
                "rejectedBy" in deposit
              ) {
                deposit.rejectedBy =
                  req.user.id;
              }

              if (
                "rejectedByUsername" in
                deposit
              ) {
                deposit.rejectedByUsername =
                  req.user.username ||
                  "Admin";
              }

              deposit.rejectedAt =
                new Date();

              if (
                finalReason &&
                typeof deposit.note ===
                  "string"
              ) {
                deposit.note =
                  finalReason;
              }

              await deposit.save({
                session,
              });

              // ==========================================
              // WALLET HISTORY
              // ==========================================

              await WalletHistory.create(
                [
                  {
                    userId:
                      deposit.userId,

                    username:
                      deposit.username,

                    walletType,

                    type:
                      "DEPOSIT_REJECTED",

                    transactionType:
                      "DEPOSIT_REJECTED",

                    transactionMode:
                      "RELEASE",

                    amount,

                    balanceBefore,

                    balanceAfter:
                      balanceBefore,

                    status:
                      "Rejected",

                    paymentMethod:
                      deposit.paymentMethod ||
                      "",

                    referenceId:
                      deposit._id.toString(),

                    admin:
                      req.user.username ||
                      "Admin",

                    adminId:
                      req.user.id,

                    adminUsername:
                      req.user.username ||
                      "Admin",

                    note:
                      finalReason,
                  },
                ],
                {
                  session,
                }
              );

              // ==========================================
              // TRANSACTION
              // ==========================================

              await Transaction.create(
                [
                  {
                    userId:
                      deposit.userId,

                    username:
                      deposit.username,

                    walletType,

                    transactionType:
                      "DEPOSIT_REJECTED",

                    transactionMode:
                      "RELEASE",

                    amount,

                    balanceBefore,

                    balanceAfter:
                      balanceBefore,

                    status:
                      "Rejected",

                    paymentMethod:
                      deposit.paymentMethod ||
                      "",

                    referenceId:
                      deposit._id.toString(),

                    adminId:
                      req.user.id,

                    adminUsername:
                      req.user.username ||
                      "Admin",

                    note:
                      finalReason,
                  },
                ],
                {
                  session,
                }
              );

              processed = true;
            }
          );

          if (processed) {
            rejected += 1;
          }
        } catch (err) {
          console.error(
            `BULK REJECT ${depositId} ERROR:`,
            err
          );

          failed.push({
            depositId,

            error:
              err.message ||
              "Unable to reject deposit.",
          });
        } finally {
          await session.endSession();
        }
      }

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Bulk reject completed.",

        result: {
          requested:
            uniqueDepositIds.length,

          rejected,

          skipped,

          failed:
            failed.length,
        },

        failed,
      });
    } catch (error) {
      console.error(
        "BULK REJECT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Bulk rejection failed.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);
// ======================================================
// DEPOSIT STATISTICS
// GET /api/deposit/statistics
//
// Dashboard Cards
//
// Admin:
//   All deposits
//
// User:
//   Own deposits only
// ======================================================

router.get(
  "/statistics",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // USER / ADMIN QUERY
      // ==================================================

      const isAdminUser =
        String(
          req.user?.role || ""
        ).toLowerCase() === "admin";

      const query = isAdminUser
        ? {}
        : {
            userId: req.user.id,
          };

      // ==================================================
      // GET DEPOSITS
      // ==================================================

      const deposits =
        await Deposit.find(query)
          .select(
            "status amount walletType"
          )
          .lean();

      // ==================================================
      // TOTALS
      // ==================================================

      let pendingAmount = 0;
      let approvedAmount = 0;
      let rejectedAmount = 0;
      let cancelledAmount = 0;

      let pendingCount = 0;
      let approvedCount = 0;
      let rejectedCount = 0;
      let cancelledCount = 0;

      let pkrAmount = 0;
      let usdtAmount = 0;

      // ==================================================
      // PROCESS
      // ==================================================

      for (const deposit of deposits) {
        const status =
          String(
            deposit.status || ""
          ).toUpperCase();

        const walletType =
          String(
            deposit.walletType || ""
          ).toUpperCase();

        const amount =
          Number(
            deposit.amount
          );

        const safeAmount =
          Number.isFinite(amount) &&
          amount > 0
            ? amount
            : 0;

        // ================================================
        // PENDING
        // ================================================

        if (
          status === "PENDING"
        ) {
          pendingCount += 1;

          pendingAmount +=
            safeAmount;

          continue;
        }

        // ================================================
        // APPROVED
        // ================================================

        if (
          status === "APPROVED"
        ) {
          approvedCount += 1;

          approvedAmount +=
            safeAmount;

          if (
            walletType === "PKR"
          ) {
            pkrAmount +=
              safeAmount;
          }

          if (
            walletType === "USDT"
          ) {
            usdtAmount +=
              safeAmount;
          }

          continue;
        }

        // ================================================
        // REJECTED
        // ================================================

        if (
          status === "REJECTED"
        ) {
          rejectedCount += 1;

          rejectedAmount +=
            safeAmount;

          continue;
        }

        // ================================================
        // CANCELLED
        // ================================================

        if (
          status === "CANCELLED"
        ) {
          cancelledCount += 1;

          cancelledAmount +=
            safeAmount;
        }
      }

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        statistics: {
          totalDeposits:
            deposits.length,

          pendingDeposits:
            pendingCount,

          approvedDeposits:
            approvedCount,

          rejectedDeposits:
            rejectedCount,

          cancelledDeposits:
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

          totalPKRDeposits:
            Number(
              pkrAmount.toFixed(2)
            ),

          totalUSDTDeposits:
            Number(
              usdtAmount.toFixed(6)
            ),
        },

        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "DEPOSIT STATISTICS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load statistics.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// ADMIN EXPORT DEPOSITS
// GET /api/deposit/admin/export
//
// Used by Admin Dashboard
// ======================================================

router.get(
  "/admin/export",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // GET DEPOSITS
      // ==================================================

      const deposits =
        await Deposit.find({})
          .select(
            [
              "_id",
              "username",
              "walletType",
              "amount",
              "currency",
              "paymentMethod",
              "transactionId",
              "referenceId",
              "status",
              "approvedByUsername",
              "approvedAt",
              "rejectedByUsername",
              "rejectedAt",
              "cancelledAt",
              "rejectReason",
              "createdAt",
              "updatedAt",
            ].join(" ")
          )
          .sort({
            createdAt: -1,
          })
          .lean();

      // ==================================================
      // NORMALIZE EXPORT DATA
      // ==================================================

      const exportData =
        deposits.map(
          (deposit) => ({
            id: deposit._id,

            username:
              deposit.username || "",

            walletType:
              String(
                deposit.walletType ||
                  ""
              ).toUpperCase(),

            amount: Number(
              Number(
                deposit.amount || 0
              ).toFixed(6)
            ),

            currency:
              deposit.currency ||
              "",

            paymentMethod:
              deposit.paymentMethod ||
              "",

            transactionId:
              deposit.transactionId ||
              "",

            referenceId:
              deposit.referenceId ||
              "",

            status:
              String(
                deposit.status || ""
              ).toUpperCase(),

            approvedBy:
              deposit.approvedByUsername ||
              "",

            approvedAt:
              deposit.approvedAt ||
              null,

            rejectedBy:
              deposit.rejectedByUsername ||
              "",

            rejectedAt:
              deposit.rejectedAt ||
              null,

            cancelledAt:
              deposit.cancelledAt ||
              null,

            rejectReason:
              deposit.rejectReason ||
              "",

            createdAt:
              deposit.createdAt ||
              null,

            updatedAt:
              deposit.updatedAt ||
              null,
          })
        );

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        total:
          exportData.length,

        deposits:
          exportData,

        exportedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "EXPORT DEPOSITS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to export deposits.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);
// ======================================================
// DEPOSIT DEBUG
// GET /api/deposit/debug
// Backend Diagnostics - V18 Enterprise
// ======================================================

router.get(
  "/debug",
  verifyToken,
  async (req, res) => {
    try {
      const userId =
        String(
          req.user?.id || ""
        ).trim();

      const username =
        String(
          req.user?.username || ""
        ).trim();

      const role =
        String(
          req.user?.role || ""
        ).trim()
        .toLowerCase();

      // --------------------------------------------------
      // VALIDATE USER ID
      // --------------------------------------------------

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Authenticated user ID is missing.",
        });
      }

      // --------------------------------------------------
      // ADMIN = ALL DEPOSITS
      // USER  = OWN DEPOSITS ONLY
      // --------------------------------------------------

      const depositQuery =
        role === "admin"
          ? {}
          : {
              userId,
            };

      // --------------------------------------------------
      // TRANSACTION / HISTORY USER FILTER
      // --------------------------------------------------

      const transactionQuery =
        role === "admin"
          ? {}
          : {
              $or: [
                {
                  userId,
                },
                {
                  username,
                },
              ],
            };

      const historyQuery =
        role === "admin"
          ? {}
          : {
              $or: [
                {
                  userId,
                },
                {
                  username,
                },
              ],
            };

      // --------------------------------------------------
      // SAFE STATUS FILTER
      // --------------------------------------------------

      const pendingStatusQuery = {
        ...depositQuery,

        status: {
          $in: [
            "PENDING",
            "Pending",
            "pending",
          ],
        },
      };

      // --------------------------------------------------
      // PARALLEL DIAGNOSTICS
      // --------------------------------------------------

      const [
        wallet,
        depositCount,
        pendingCount,
        approvedCount,
        rejectedCount,
        cancelledCount,
        transactionCount,
        historyCount,
      ] = await Promise.all([
        Wallet.findOne({
          userId,
        }).lean(),

        Deposit.countDocuments(
          depositQuery
        ),

        Deposit.countDocuments(
          pendingStatusQuery
        ),

        Deposit.countDocuments({
          ...depositQuery,

          status: {
            $in: [
              "APPROVED",
              "Approved",
              "approved",
            ],
          },
        }),

        Deposit.countDocuments({
          ...depositQuery,

          status: {
            $in: [
              "REJECTED",
              "Rejected",
              "rejected",
            ],
          },
        }),

        Deposit.countDocuments({
          ...depositQuery,

          status: {
            $in: [
              "CANCELLED",
              "Cancelled",
              "cancelled",
            ],
          },
        }),

        Transaction.countDocuments({
          ...transactionQuery,

          transactionType: {
            $regex: /^DEPOSIT/i,
          },
        }),

        WalletHistory.countDocuments({
          ...historyQuery,

          $or: [
            {
              type: {
                $regex: /DEPOSIT/i,
              },
            },

            {
              transactionType: {
                $regex: /DEPOSIT/i,
              },
            },
          ],
        }),
      ]);

      // --------------------------------------------------
      // SAFE WALLET SNAPSHOT
      // --------------------------------------------------

      const walletDiagnostics =
        wallet
          ? {
              walletId:
                wallet._id,

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

              lockedGold:
                Number(
                  wallet.lockedGold ||
                    0
                ),

              availablePkr:
                Number(
                  wallet.pkrBalance ||
                    0
                ) -
                Number(
                  wallet.lockedPkr ||
                    0
                ),

              availableUsdt:
                Number(
                  wallet.usdtBalance ||
                    0
                ) -
                Number(
                  wallet.lockedUsdt ||
                    0
                ),

              availableGold:
                Number(
                  wallet.goldBalance ||
                    0
                ) -
                Number(
                  wallet.lockedGold ||
                    0
                ),

              totalDeposit:
                Number(
                  wallet.totalDeposit ||
                    0
                ),

              totalPkrDeposit:
                Number(
                  wallet.totalPkrDeposit ||
                    0
                ),

              totalUsdtDeposited:
                Number(
                  wallet.totalUsdtDeposited ||
                    0
                ),

              totalWithdraw:
                Number(
                  wallet.totalWithdraw ||
                    0
                ),

              status:
                wallet.status ||
                "Active",

              isVerified:
                wallet.isVerified !==
                false,

              isFrozen:
                wallet.isFrozen ===
                true,
            }
          : null;

      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(200).json({
        success: true,

        diagnostics: {
          module:
            "Deposit API V18 Enterprise",

          version:
            "18.0.0",

          userId,

          username,

          role,

          walletExists:
            !!wallet,

          wallet:
            walletDiagnostics,

          deposits: {
            total:
              depositCount,

            pending:
              pendingCount,

            approved:
              approvedCount,

            rejected:
              rejectedCount,

            cancelled:
              cancelledCount,
          },

          ledger: {
            transactionEntries:
              transactionCount,

            walletHistoryEntries:
              historyCount,
          },
        },

        serverTime:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "DEPOSIT DEBUG ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Deposit diagnostics failed.",

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
// API ROUTE LIST
// GET /api/deposit/routes
// Diagnostics - V18 Enterprise
// ======================================================

router.get(
  "/routes",
  (req, res) => {
    return res.status(200).json({
      success: true,

      module:
        "GoldTrade V18 Enterprise Deposit API",

      version:
        "18.0.0",

      routes: {
        // ------------------------------------------------
        // HEALTH / DIAGNOSTICS
        // ------------------------------------------------

        health: [
          "GET /api/deposit/health",
          "GET /api/deposit/status",
          "GET /api/deposit/routes",
          "GET /api/deposit/debug",
          "GET /api/deposit/statistics",
        ],

        // ------------------------------------------------
        // USER
        // ------------------------------------------------

        user: [
          "POST /api/deposit/create",

          "GET /api/deposit/history",

          "GET /api/deposit/history/:username",

          "GET /api/deposit/filter",

          "GET /api/deposit/recent",

          "GET /api/deposit/summary",

          "GET /api/deposit/check-pending/:walletType",

          "PATCH /api/deposit/:id/cancel",

          "PATCH /api/deposit/:id/note",
        ],

        // ------------------------------------------------
        // SETTINGS / PAYMENT
        // ------------------------------------------------

        settings: [
          "GET /api/deposit/settings",

          "PATCH /api/deposit/settings",

          "GET /api/deposit/settings/payment-methods",

          "PATCH /api/deposit/settings/payment-methods",

          "GET /api/deposit/payment-details",

          "GET /api/deposit/payment-settings",

          "PATCH /api/deposit/payment-settings",
        ],

        // ------------------------------------------------
        // ADMIN
        // ------------------------------------------------

        admin: [
          "GET /api/deposit/pending",

          "PATCH /api/deposit/:id/approve",

          "PATCH /api/deposit/:id/reject",

          "GET /api/deposit/admin/dashboard",

          "GET /api/deposit/admin/analytics",

          "GET /api/deposit/admin/recent",

          "GET /api/deposit/admin/all",

          "GET /api/deposit/admin/search",

          "GET /api/deposit/admin/top-depositors",

          "GET /api/deposit/admin/user-summary/:username",

          "GET /api/deposit/admin/:id",

          "GET /api/deposit/admin/receipt/:id",

          "GET /api/deposit/admin/export",

          "PATCH /api/deposit/admin/bulk-approve",

          "PATCH /api/deposit/admin/bulk-reject",
        ],
      },

      timestamp:
        new Date().toISOString(),
    });
  }
);


// ======================================================
// ROUTER EXPORT
// ======================================================

module.exports = router;