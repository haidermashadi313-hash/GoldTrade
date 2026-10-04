"use strict";

// ======================================================
// GoldTrade V18 Enterprise
// depositRoutes.js
// PART 1/3 — IMPORTS + HELPERS
// ======================================================

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const Deposit =
  require("../models/Deposit");

const Wallet =
  require("../models/Wallet");

const User =
  require("../models/User");

const WalletHistory =
  require("../models/WalletHistory");

const Transaction =
  require("../models/Transaction");

const Settings =
  require("../models/Settings");

const PaymentSettings =
  require("../models/PaymentSettings");

// ======================================================
// AUTH MIDDLEWARE
// ======================================================

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

// ======================================================
// MULTER
// Deposit receipt upload
// ======================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize:
      5 * 1024 * 1024,
  },

  fileFilter: (
    req,
    file,
    cb
  ) => {
    const allowedTypes =
      new Set([
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ]);

    if (
      !allowedTypes.has(
        file.mimetype
      )
    ) {
      return cb(
        new Error(
          "Invalid receipt file. Only JPG, PNG, WEBP and PDF files are allowed."
        )
      );
    }

    return cb(
      null,
      true
    );
  },
});

// ======================================================
// DEFAULT DEPOSIT SETTINGS
// ======================================================

const DEFAULT_DEPOSIT_SETTINGS =
  Object.freeze({
    depositsEnabled: true,

    minimumDeposit: 1000,

    maximumDeposit: 10000000,

    depositPaymentMethods: [],
  });

// ======================================================
// SAFE NUMBER
// ======================================================

const toSafeNumber = (
  value,
  fallback = 0
) => {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return fallback;
  }

  return number;
};

// ======================================================
// SAFE STRING
// ======================================================

const cleanString = (
  value,
  fallback = ""
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  return String(
    value
  ).trim();
};

// ======================================================
// BOOLEAN NORMALIZER
// ======================================================

const toBoolean = (
  value,
  fallback = true
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return fallback;
  }

  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      value
        .trim()
        .toLowerCase();

    if (
      normalized ===
      "true"
    ) {
      return true;
    }

    if (
      normalized ===
      "false"
    ) {
      return false;
    }
  }

  return Boolean(
    value
  );
};

// ======================================================
// PAYMENT METHOD NORMALIZER
//
// Supports:
// type / accountName / qrCode
//
// AND:
// method / title / accountTitle / qrImage
// ======================================================

const normalizeDepositPaymentMethods =
  (
    methods
  ) => {
    if (
      !Array.isArray(
        methods
      )
    ) {
      return [];
    }

    return methods
      .map(
        (item) => {
          if (
            !item ||
            typeof item !==
              "object"
          ) {
            return null;
          }

          const rawType =
            item.type ??
            item.method ??
            item.title ??
            "";

          const type =
            cleanString(
              rawType
            ).toUpperCase();

          if (!type) {
            return null;
          }

          const accountName =
            cleanString(
              item.accountName ??
                item.accountTitle ??
                ""
            );

          const accountNumber =
            cleanString(
              item.accountNumber ??
                ""
            );

          const walletAddress =
            cleanString(
              item.walletAddress ??
                ""
            );

          const iban =
            cleanString(
              item.iban ??
                ""
            );

          const network =
            cleanString(
              item.network ??
                ""
            );

          const qrCode =
            cleanString(
              item.qrCode ??
                item.qrImage ??
                ""
            );

          const instructions =
            cleanString(
              item.instructions ??
                ""
            );

          const enabled =
            item.enabled !==
            false;

          return {
            type,

            accountName,

            accountNumber,

            walletAddress,

            iban,

            network,

            qrCode,

            instructions,

            enabled,
          };
        }
      )
      .filter(Boolean)
      .slice(0, 20);
  };

// ======================================================
// PAYMENT METHOD RESPONSE NORMALIZER
// ======================================================

const formatPaymentMethod = (
  method
) => {
  if (
    !method ||
    typeof method !==
      "object"
  ) {
    return null;
  }

  const type =
    cleanString(
      method.type ??
        method.method ??
        ""
    ).toUpperCase();

  return {
    _id:
      method._id ??
      null,

    type,

    method:
      method.method ||
      type,

    title:
      method.title ||
      type,

    accountName:
      method.accountName ||
      method.accountTitle ||
      "",

    accountTitle:
      method.accountTitle ||
      method.accountName ||
      "",

    accountNumber:
      method.accountNumber ||
      "",

    walletAddress:
      method.walletAddress ||
      "",

    iban:
      method.iban ||
      "",

    network:
      method.network ||
      "",

    qrCode:
      method.qrCode ||
      method.qrImage ||
      "",

    qrImage:
      method.qrImage ||
      method.qrCode ||
      "",

    instructions:
      method.instructions ||
      "",

    enabled:
      method.enabled !==
      false,
  };
};

// ======================================================
// NORMALIZE SETTINGS RESPONSE
// ======================================================

const formatDepositSettings = (
  settings
) => {
  const minimumDeposit =
    toSafeNumber(
      settings?.minimumDeposit,
      DEFAULT_DEPOSIT_SETTINGS.minimumDeposit
    );

  const maximumDeposit =
    toSafeNumber(
      settings?.maximumDeposit,
      DEFAULT_DEPOSIT_SETTINGS.maximumDeposit
    );

  const rawMethods =
    Array.isArray(
      settings?.depositPaymentMethods
    )
      ? settings.depositPaymentMethods
      : [];

  const methods =
    rawMethods
      .map(
        formatPaymentMethod
      )
      .filter(Boolean);

  return {
    depositsEnabled:
      settings?.depositsEnabled !==
      false,

    minimumDeposit,

    maximumDeposit,

    methods,

    paymentMethods:
      methods,

    depositPaymentMethods:
      methods,

    updatedAt:
      settings?.updatedAt ||
      null,
  };
};
// ======================================================
// GET OR CREATE DEPOSIT SETTINGS
// ======================================================

const getDepositSettings =
  async () => {
    let settings =
      await Settings.findOne();

    // --------------------------------------------------
    // CREATE DEFAULT SETTINGS
    // --------------------------------------------------

    if (!settings) {
      settings =
        await Settings.create({
          depositsEnabled:
            DEFAULT_DEPOSIT_SETTINGS.depositsEnabled,

          minimumDeposit:
            DEFAULT_DEPOSIT_SETTINGS.minimumDeposit,

          maximumDeposit:
            DEFAULT_DEPOSIT_SETTINGS.maximumDeposit,

          depositPaymentMethods:
            [],
        });

      console.log(
        "🟢 Default deposit settings created."
      );

      return settings;
    }

    let changed = false;

    // --------------------------------------------------
    // depositsEnabled
    // --------------------------------------------------

    if (
      typeof settings.depositsEnabled !==
      "boolean"
    ) {
      settings.depositsEnabled =
        DEFAULT_DEPOSIT_SETTINGS.depositsEnabled;

      changed = true;
    }

    // --------------------------------------------------
    // minimumDeposit
    // --------------------------------------------------

    const minimumDeposit =
      toSafeNumber(
        settings.minimumDeposit,
        DEFAULT_DEPOSIT_SETTINGS.minimumDeposit
      );

    if (
      minimumDeposit < 0
    ) {
      settings.minimumDeposit =
        DEFAULT_DEPOSIT_SETTINGS.minimumDeposit;

      changed = true;
    } else if (
      settings.minimumDeposit !==
      minimumDeposit
    ) {
      settings.minimumDeposit =
        minimumDeposit;

      changed = true;
    }

    // --------------------------------------------------
    // maximumDeposit
    // --------------------------------------------------

    const maximumDeposit =
      toSafeNumber(
        settings.maximumDeposit,
        DEFAULT_DEPOSIT_SETTINGS.maximumDeposit
      );

    if (
      maximumDeposit <= 0
    ) {
      settings.maximumDeposit =
        DEFAULT_DEPOSIT_SETTINGS.maximumDeposit;

      changed = true;
    } else if (
      settings.maximumDeposit !==
      maximumDeposit
    ) {
      settings.maximumDeposit =
        maximumDeposit;

      changed = true;
    }

    // --------------------------------------------------
    // Fix minimum > maximum
    // --------------------------------------------------

    if (
      Number(
        settings.minimumDeposit
      ) >
      Number(
        settings.maximumDeposit
      )
    ) {
      settings.minimumDeposit =
        DEFAULT_DEPOSIT_SETTINGS.minimumDeposit;

      settings.maximumDeposit =
        DEFAULT_DEPOSIT_SETTINGS.maximumDeposit;

      changed = true;
    }

    // --------------------------------------------------
    // Normalize legacy payment methods
    // --------------------------------------------------

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

    if (
      JSON.stringify(
        existingMethods
      ) !==
      JSON.stringify(
        normalizedMethods
      )
    ) {
      settings.depositPaymentMethods =
        normalizedMethods;

      changed = true;
    }

    // --------------------------------------------------
    // Save only when required
    // --------------------------------------------------

    if (changed) {
      await settings.save();
    }

    return settings;
  };

// ======================================================
// WALLET HELPER
// ======================================================

const getWallet = async (
  userId,
  username = ""
) => {
  if (!userId) {
    throw new Error(
      "User ID is required."
    );
  }

  let wallet =
    await Wallet.findOne({
      userId,
    });

  if (!wallet) {
    wallet =
      await Wallet.create({
        userId,

        username:
          cleanString(
            username
          ),

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
      `🟢 Wallet created for ${
        username || userId
      }`
    );
  }

  return wallet;
};

// ======================================================
// V18 PAYMENT METHODS
//
// SOURCE OF TRUTH:
// PaymentSettings.depositMethods[]
//
// IMPORTANT:
// This helper MUST exist before any route
// that calls getV18DepositMethods().
// ======================================================

const getV18DepositMethods =
  async () => {
    const paymentSettings =
      await PaymentSettings
        .findOne()
        .lean();

    if (
      !paymentSettings
    ) {
      return [];
    }

    const methods =
      Array.isArray(
        paymentSettings.depositMethods
      )
        ? paymentSettings.depositMethods
        : [];

    return methods
      .filter(
        (method) =>
          method &&
          method.enabled === true
      )
      .map(
        (method) => ({
          _id:
            method._id ||
            `${method.method}_${paymentSettings._id}`,

          type:
            method.method ||
            "",

          method:
            method.method ||
            "",

          title:
            method.title ||
            method.method ||
            "",

          accountName:
            method.accountTitle ||
            "",

          accountTitle:
            method.accountTitle ||
            "",

          accountNumber:
            method.accountNumber ||
            "",

          walletAddress:
            method.walletAddress ||
            "",

          iban:
            method.iban ||
            "",

          network:
            method.network ||
            "",

          qrCode:
            method.qrImage ||
            "",

          qrImage:
            method.qrImage ||
            "",

          instructions:
            method.instructions ||
            "",

          enabled: true,
        })
      );
  };

// ======================================================
// HEALTH
// GET /api/deposit/health
// ======================================================

router.get(
  "/health",
  (req, res) => {
    return res.status(200).json({
      success: true,

      module:
        "GoldTrade V18 Enterprise Deposit API",

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
// STATUS
// GET /api/deposit/status
// ======================================================

router.get(
  "/status",
  async (req, res) => {
    try {
      const settings =
        await getDepositSettings();

      const methods =
        await getV18DepositMethods();

      return res.status(200).json({
        success: true,

        depositsEnabled:
          settings.depositsEnabled !==
          false,

        minimumDeposit:
          toSafeNumber(
            settings.minimumDeposit,
            DEFAULT_DEPOSIT_SETTINGS.minimumDeposit
          ),

        maximumDeposit:
          toSafeNumber(
            settings.maximumDeposit,
            DEFAULT_DEPOSIT_SETTINGS.maximumDeposit
          ),

        paymentMethodsCount:
          methods.length,

        serverTime:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "DEPOSIT STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load deposit status.",

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
// GET DEPOSIT SETTINGS
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

      const formatted =
        formatDepositSettings(
          settings
        );

      const methods =
        await getV18DepositMethods();

      return res.status(200).json({
        success: true,

        settings: {
          ...formatted,

          methods,

          paymentMethods:
            methods,
        },

        methods,

        paymentMethods:
          methods,

        total:
          methods.length,

        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "GET DEPOSIT SETTINGS ERROR:",
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
// GET DEPOSIT PAYMENT SETTINGS
// GET /api/deposit/payment-settings
//
// USER + ADMIN
//
// Used by:
// frontend/app/deposit/page.tsx
//
// V18 SOURCE OF TRUTH:
// PaymentSettings.depositMethods[]
// ======================================================

router.get(
  "/payment-settings",
  async (req, res) => {
    try {
      // ------------------------------------------------
      // GENERAL DEPOSIT SETTINGS
      // ------------------------------------------------

      const settings =
        await getDepositSettings();

      // ------------------------------------------------
      // V18 PAYMENT METHODS
      // ------------------------------------------------

      const methods =
        await getV18DepositMethods();

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        methods,

        paymentMethods:
          methods,

        total:
          methods.length,

        depositsEnabled:
          settings.depositsEnabled !==
          false,

        minimumDeposit:
          toSafeNumber(
            settings.minimumDeposit,
            DEFAULT_DEPOSIT_SETTINGS.minimumDeposit
          ),

        maximumDeposit:
          toSafeNumber(
            settings.maximumDeposit,
            DEFAULT_DEPOSIT_SETTINGS.maximumDeposit
          ),

        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "GET DEPOSIT PAYMENT SETTINGS ERROR:",
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
// PATCH DEPOSIT SETTINGS
//
// PATCH /api/deposit/settings
//
// Used by:
// Admin Payment Settings
//
// Body:
// {
//   depositsEnabled: true,
//   minimumDeposit: 1000,
//   maximumDeposit: 10000000
// }
// ======================================================

router.patch(
  "/settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const body =
        req.body || {};

      // --------------------------------------------------
      // GET CURRENT SETTINGS
      // --------------------------------------------------

      const settings =
        await getDepositSettings();

      // --------------------------------------------------
      // DEPOSITS ENABLED
      // --------------------------------------------------

      if (
        body.depositsEnabled !==
        undefined
      ) {
        settings.depositsEnabled =
          toBoolean(
            body.depositsEnabled,
            settings.depositsEnabled !== false
          );
      }

      // --------------------------------------------------
      // MINIMUM DEPOSIT
      // --------------------------------------------------

      if (
        body.minimumDeposit !==
        undefined
      ) {
        const minimum =
          Number(
            body.minimumDeposit
          );

        if (
          !Number.isFinite(
            minimum
          ) ||
          minimum <= 0
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Minimum deposit must be a valid number greater than 0.",
          });
        }

        settings.minimumDeposit =
          minimum;
      }

      // --------------------------------------------------
      // MAXIMUM DEPOSIT
      // --------------------------------------------------

      if (
        body.maximumDeposit !==
        undefined
      ) {
        const maximum =
          Number(
            body.maximumDeposit
          );

        if (
          !Number.isFinite(
            maximum
          ) ||
          maximum <= 0
        ) {
          return res.status(400).json({
            success: false,

            message:
              "Maximum deposit must be a valid number greater than 0.",
          });
        }

        settings.maximumDeposit =
          maximum;
      }

      // --------------------------------------------------
      // FINAL VALIDATION
      // --------------------------------------------------

      const finalMinimum =
        Number(
          settings.minimumDeposit
        );

      const finalMaximum =
        Number(
          settings.maximumDeposit
        );

      if (
        !Number.isFinite(
          finalMinimum
        ) ||
        !Number.isFinite(
          finalMaximum
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Deposit limits must be valid numbers.",
        });
      }

      if (
        finalMinimum <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Minimum deposit must be greater than 0.",
        });
      }

      if (
        finalMaximum <= 0
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Maximum deposit must be greater than 0.",
        });
      }

      if (
        finalMinimum >
        finalMaximum
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Minimum deposit cannot be greater than maximum deposit.",
        });
      }

      // --------------------------------------------------
      // SAVE
      // --------------------------------------------------

      settings.minimumDeposit =
        finalMinimum;

      settings.maximumDeposit =
        finalMaximum;

      await settings.save();

      // --------------------------------------------------
      // GENERAL FORMATTED SETTINGS
      // --------------------------------------------------

      const formatted =
        formatDepositSettings(
          settings
        );

      
      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          "Deposit settings updated successfully.",

        settings: {
          ...formatted,

          methods,

          paymentMethods:
            methods,
        },

        methods,

        paymentMethods:
          methods,

        total:
          methods.length,

        updatedAt:
          settings.updatedAt ||
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "PATCH DEPOSIT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to update deposit settings.",

        error:
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// GET PAYMENT METHODS
// GET /api/deposit/settings/payment-methods
//
// USER + ADMIN
//
// V18 SOURCE OF TRUTH:
// PaymentSettings.depositMethods[]
// ======================================================

router.get(
  "/settings/payment-methods",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // V18 PAYMENT SETTINGS
      // ==================================================

      const methods =
        await getV18DepositMethods();

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        methods,

        paymentMethods:
          methods,

        total:
          methods.length,

        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "GET PAYMENT METHODS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load payment methods.",

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
// PATCH PAYMENT METHODS
//
// PATCH /api/deposit/settings/payment-methods
//
// Body:
// {
//   methods: []
// }
//
// V18 SOURCE OF TRUTH:
// PaymentSettings.depositMethods[]
// ======================================================

router.patch(
  "/settings/payment-methods",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // REQUEST METHODS
      // ==================================================

      const incoming =
        req.body?.methods;

      if (
        !Array.isArray(
          incoming
        )
      ) {
        return res.status(400).json({
          success: false,

          message:
            "methods must be an array.",
        });
      }

      // ==================================================
      // MAXIMUM METHODS
      // ==================================================

      if (
        incoming.length >
        20
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Maximum 20 payment methods are allowed.",
        });
      }

      // ==================================================
      // NORMALIZE METHODS
      // ==================================================

      const methods =
        normalizeDepositPaymentMethods(
          incoming
        );

      // ==================================================
      // VALIDATION
      // ==================================================

      if (
        methods.length !==
        incoming.length
      ) {
        return res.status(400).json({
          success: false,

          message:
            "One or more payment methods are invalid.",
        });
      }

      // ==================================================
      // LOAD V18 PAYMENT SETTINGS
      // ==================================================

      let paymentSettings =
        await PaymentSettings.findOne();

      // ==================================================
      // CREATE SETTINGS IF MISSING
      // ==================================================

      if (!paymentSettings) {
        paymentSettings =
          new PaymentSettings();
      }

      // ==================================================
      // V18 SOURCE OF TRUTH
      // ==================================================

      paymentSettings.depositMethods =
        methods;

      // ==================================================
      // SAVE
      // ==================================================

      await paymentSettings.save();

      // ==================================================
      // FORMAT RESPONSE
      // ==================================================

      const formatted =
        methods.map(
          formatPaymentMethod
        );

      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Deposit payment methods updated successfully.",

        methods:
          formatted,

        paymentMethods:
          formatted,

        total:
          formatted.length,

        updatedAt:
          paymentSettings.updatedAt ||
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "PATCH PAYMENT METHODS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to update payment methods.",

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
// GoldTrade V18 Enterprise
// depositRoutes.js
// PART 2/6
// CREATE DEPOSIT REQUEST
// ======================================================


router.post(
  "/create",
  verifyToken,
  upload.single("screenshot"),
  async (req, res) => {
    let createdDepositId = null;

    try {
      // ==================================================
      // GET USER
      // ==================================================

      const user =
        await User.findById(
          req.user.id
        )
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
      // NORMALIZE INPUT
      // ==================================================

      const walletType =
        cleanString(
          req.body?.walletType ||
            "PKR"
        ).toUpperCase();

      const paymentMethod =
        cleanString(
          req.body?.paymentMethod ||
            req.body?.method ||
            ""
        ).toUpperCase();

      const rawAmount =
        req.body?.amount ??
        req.body?.requestAmount;

      const depositAmount =
        Number(rawAmount);

      const senderName =
        cleanString(
          req.body?.senderName
        );

      const senderAccount =
        cleanString(
          req.body?.senderAccount
        );

      const receiverAccount =
        cleanString(
          req.body?.receiverAccount
        );

      const transactionId =
        cleanString(
          req.body?.transactionId
        );

      const referenceId =
        cleanString(
          req.body?.referenceId
        );

      const network =
        cleanString(
          req.body?.network
        );

      const note =
        cleanString(
          req.body?.note ||
            req.body?.depositNote
        );

      // ==================================================
      // WALLET TYPE VALIDATION
      // ==================================================

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

      // ==================================================
      // AMOUNT VALIDATION
      // ==================================================

      if (
        !Number.isFinite(
          depositAmount
        ) ||
        depositAmount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid deposit amount.",
        });
      }

      // --------------------------------------------------
      // Maximum precision:
      // 2 decimal places
      // --------------------------------------------------

      const roundedAmount =
        Math.round(
          depositAmount * 100
        ) / 100;

      if (
        roundedAmount !==
        depositAmount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Deposit amount can have maximum 2 decimal places.",
        });
      }

      // ==================================================
      // PAYMENT METHOD VALIDATION
      // ==================================================

      if (!paymentMethod) {
        return res.status(400).json({
          success: false,
          message:
            "Please select a payment method.",
        });
      }

      // ==================================================
      // TRANSACTION ID VALIDATION
      // ==================================================

      if (!transactionId) {
        return res.status(400).json({
          success: false,
          message:
            "Transaction ID is required.",
        });
      }

      if (
        transactionId.length >
        150
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Transaction ID is too long.",
        });
      }

      // ==================================================
      // DEPOSIT SETTINGS
      // ==================================================

      const settings =
        await getDepositSettings();

      // ==================================================
      // CHECK DEPOSITS ENABLED
      // ==================================================

      if (
        settings.depositsEnabled ===
        false
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Deposits are currently disabled.",
        });
      }

      // ==================================================
      // MINIMUM DEPOSIT
      // ==================================================

      const minimumDeposit =
        Number(
          settings.minimumDeposit
        );

      if (
        Number.isFinite(
          minimumDeposit
        ) &&
        minimumDeposit > 0 &&
        depositAmount <
          minimumDeposit
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Minimum deposit is ${minimumDeposit}.`,
          minimumDeposit,
        });
      }

      // ==================================================
      // MAXIMUM DEPOSIT
      // ==================================================

      const maximumDeposit =
        Number(
          settings.maximumDeposit
        );

      if (
        Number.isFinite(
          maximumDeposit
        ) &&
        maximumDeposit > 0 &&
        depositAmount >
          maximumDeposit
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Maximum deposit is ${maximumDeposit}.`,
          maximumDeposit,
        });
      }

      // ==================================================
      // PAYMENT METHODS
      // ==================================================

      const configuredMethods =
        await getV18DepositMethods();

      if (
        configuredMethods.length ===
        0
      ) {
        return res.status(503).json({
          success: false,
          message:
            "No payment method is currently available. Please contact support.",
        });
      }

      // ==================================================
      // FIND SELECTED METHOD
      // ==================================================

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
      // GET WALLET
      // ==================================================

      const wallet =
        await getWallet(
          user._id,
          user.username
        );

      // ==================================================
      // CHECK WALLET STATUS
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
      // NO BALANCE CREDIT HERE
      // ==================================================

      const walletBefore = {
        pkrBalance:
          toSafeNumber(
            wallet.pkrBalance,
            0
          ),

        usdtBalance:
          toSafeNumber(
            wallet.usdtBalance,
            0
          ),

        goldBalance:
          toSafeNumber(
            wallet.goldBalance,
            0
          ),

        lockedPkr:
          toSafeNumber(
            wallet.lockedPkr,
            0
          ),

        lockedUsdt:
          toSafeNumber(
            wallet.lockedUsdt,
            0
          ),

        lockedGold:
          toSafeNumber(
            wallet.lockedGold,
            0
          ),
      };

      // ==================================================
      // PREVENT DUPLICATE TRANSACTION
      //
      // Same user's same transaction ID cannot be
      // submitted again while an existing record exists.
      // ==================================================

      const existingTransaction =
        await Deposit.findOne({
          userId:
            user._id,

          transactionId,
        })
          .select(
            "_id status amount walletType transactionId"
          )
          .lean();

      if (existingTransaction) {
        return res.status(409).json({
          success: false,
          message:
            "A deposit with this transaction ID already exists.",

          deposit: {
            id:
              existingTransaction._id,

            _id:
              existingTransaction._id,

            status:
              existingTransaction.status,

            amount:
              Number(
                existingTransaction.amount
              ),

            walletType:
              existingTransaction.walletType,

            transactionId:
              existingTransaction.transactionId,
          },
        });
      }

      // ==================================================
      // RECEIPT
      //
      // If frontend sends receiptImage directly,
      // preserve it.
      //
      // If multipart file is uploaded, convert it into
      // a data URL so no invalid multer filename is stored.
      // ==================================================

      let receiptImage =
        cleanString(
          req.body?.receiptImage
        );

      if (
        !receiptImage &&
        req.file &&
        req.file.buffer
      ) {
        const mimeType =
          req.file.mimetype ||
          "application/octet-stream";

        const base64 =
          req.file.buffer.toString(
            "base64"
          );

        receiptImage =
          `data:${mimeType};base64,${base64}`;
      }

      const receiptUploaded =
        Boolean(
          receiptImage
        );

      // ==================================================
      // CREATE DEPOSIT
      // ==================================================

      const depositData = {
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

        paymentMethod,

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
      };

      const deposit =
        await Deposit.create(
          depositData
        );

      createdDepositId =
        deposit._id;

      // ==================================================
      // WALLET HISTORY
      //
      // REQUEST ONLY
      //
      // IMPORTANT:
      // balanceBefore === balanceAfter
      // because wallet is NOT credited yet.
      // ==================================================

      try {
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

          status:
            "Pending",

          paymentMethod,

          referenceId:
            deposit._id.toString(),

          note:
            `Deposit request submitted (${walletType})`,
        });
      } catch (historyError) {
        // ------------------------------------------------
        // History failure must not silently break the
        // deposit record. Log it for backend debugging.
        // ------------------------------------------------

        console.error(
          "DEPOSIT WALLET HISTORY ERROR:",
          historyError
        );
      }

      // ==================================================
      // TRANSACTION LEDGER
      //
      // Balance is unchanged until admin approval.
      // ==================================================

      try {
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

          paymentMethod,

          referenceId:
            deposit._id.toString(),

          note:
            `Deposit request submitted (${walletType})`,
        });
      } catch (transactionError) {
        // ------------------------------------------------
        // Do not destroy an otherwise valid deposit
        // request because of an optional ledger error.
        // ------------------------------------------------

        console.error(
          "DEPOSIT TRANSACTION LEDGER ERROR:",
          transactionError
        );
      }

      // ==================================================
      // SUCCESS RESPONSE
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

          userId:
            deposit.userId,

          username:
            deposit.username,

          walletType:
            deposit.walletType,

          amount:
            Number(
              deposit.amount
            ),

          currency:
            deposit.currency,

          network:
            deposit.network,

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

          status:
            deposit.status,

          note:
            deposit.note,

          createdAt:
            deposit.createdAt,

          updatedAt:
            deposit.updatedAt,
        },

        wallet: {
          pkrBalance:
            walletBefore.pkrBalance,

          usdtBalance:
            walletBefore.usdtBalance,

          goldBalance:
            walletBefore.goldBalance,
        },

        settings: {
          minimumDeposit,

          maximumDeposit,
        },
      });
    } catch (error) {
      console.error(
        "❌ CREATE DEPOSIT ERROR:",
        error
      );

      // ==================================================
      // CLEANUP NOTE
      //
      // Deposit creation happens before optional ledger
      // operations. If the actual Deposit.create() failed,
      // createdDepositId remains null.
      // ==================================================

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

        depositId:
          createdDepositId,
      });
    }
  }
);

// ======================================================
// GoldTrade V18 Enterprise
// depositRoutes.js
// PART 3/6
// ======================================================


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

      const skip =
        (page - 1) * limit;

      // ==================================================
      // USER QUERY
      // ==================================================

      const query = {
        userId: req.user.id,
      };

      // ==================================================
      // COUNT + DATA
      // ==================================================

      const [
        total,
        deposits,
      ] = await Promise.all([
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

        username:
          req.user.username || null,

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
                deposit.network || "",

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
                deposit.note || "",

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
// GET USER DEPOSIT HISTORY BY USERNAME
//
// GET /api/deposit/history/:username
//
// Admin OR same user only
// ======================================================

router.get(
  "/history/:username",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // NORMALIZE USERNAME
      // ==================================================

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

      // ==================================================
      // CURRENT USER
      // ==================================================

      const currentRole =
        String(
          req.user.role || ""
        )
          .trim()
          .toLowerCase();

      const currentUsername =
        String(
          req.user.username || ""
        )
          .trim()
          .toLowerCase();

      // ==================================================
      // ACCESS CONTROL
      // ==================================================

      const isAdminUser =
        currentRole === "admin";

      const isSameUser =
        currentUsername === username;

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

      const skip =
        (page - 1) * limit;

      // ==================================================
      // QUERY
      // ==================================================

      const query = {
        userId: user._id,
      };

      // ==================================================
      // COUNT + DATA
      // ==================================================

      const [
        total,
        deposits,
      ] = await Promise.all([
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

        username:
          user.username,

        userId:
          user._id,

        user: {
          _id:
            user._id,

          username:
            user.username,

          fullName:
            user.fullName || "",

          email:
            user.email || "",
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
                deposit.network || "",

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
                deposit.note || "",

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
// GET PENDING DEPOSITS
//
// GET /api/deposit/pending
//
// ADMIN ONLY
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

      const skip =
        (page - 1) * limit;

      // ==================================================
      // PENDING STATUS COMPATIBILITY
      //
      // Supports:
      // PENDING
      // Pending
      // pending
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

      const [
        total,
        deposits,
      ] = await Promise.all([
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

        pendingDeposits:
          deposits.map(
            (deposit) => ({
              ...deposit,

              id:
                deposit._id,

              _id:
                deposit._id,

              amount:
                Number(
                  deposit.amount || 0
                ),

              status:
                String(
                  deposit.status ||
                  "PENDING"
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
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// GET RECENT DEPOSITS
//
// GET /api/deposit/recent
//
// ADMIN:
//   returns recent deposits from all users
//
// USER:
//   returns only own deposits
// ======================================================

router.get(
  "/recent",
  verifyToken,
  async (req, res) => {
    try {
      // ==================================================
      // LIMIT
      // ==================================================

      const limit = Math.min(
        Math.max(
          parseInt(req.query.limit, 10) || 10,
          1
        ),
        50
      );

      // ==================================================
      // ROLE
      // ==================================================

      const isAdminUser =
        String(
          req.user.role || ""
        )
          .trim()
          .toLowerCase() ===
        "admin";

      // ==================================================
      // QUERY
      // ==================================================

      const query =
        isAdminUser
          ? {}
          : {
              userId:
                req.user.id,
            };

      // ==================================================
      // LOAD DATA
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

        total:
          deposits.length,

        recentDeposits:
          deposits.map(
            (deposit) => ({
              ...deposit,

              id:
                deposit._id,

              _id:
                deposit._id,

              amount:
                Number(
                  deposit.amount || 0
                ),

              status:
                String(
                  deposit.status ||
                  "PENDING"
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
          process.env.NODE_ENV ===
          "production"
            ? undefined
            : error.message,
      });
    }
  }
);


// ======================================================
// FILTER DEPOSIT HISTORY
//
// GET /api/deposit/filter
//
// Query:
// ?status=PENDING
// ?walletType=PKR
// ?start=2026-01-01
// ?end=2026-01-31
// ?page=1
// ?limit=20
//
// USER:
//   own deposits only
//
// ADMIN:
//   all deposits
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

      const skip =
        (page - 1) * limit;

      // ==================================================
      // QUERY PARAMETERS
      // ==================================================

      const {
        status,
        walletType,
        start,
        end,
      } = req.query;

      // ==================================================
      // ROLE
      // ==================================================

      const isAdminUser =
        String(
          req.user.role || ""
        )
          .trim()
          .toLowerCase() ===
        "admin";

      // ==================================================
      // BASE QUERY
      //
      // ADMIN:
      //   all deposits
      //
      // USER:
      //   own deposits only
      // ==================================================

      const query =
        isAdminUser
          ? {}
          : {
              userId:
                req.user.id,
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

        // ------------------------------------------------
        // Support old records with different casing
        // ------------------------------------------------

        query.status = {
          $in: [
            normalizedStatus,

            normalizedStatus
              .charAt(0) +
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
          ![
            "PKR",
            "USDT",
          ].includes(
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

        // ------------------------------------------------
        // START DATE
        // ------------------------------------------------

        if (start) {
          const startDate =
            new Date(
              String(start)
            );

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

        // ------------------------------------------------
        // END DATE
        // ------------------------------------------------

        if (end) {
          const endDate =
            new Date(
              String(end)
            );

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

        // ------------------------------------------------
        // DATE RANGE VALIDATION
        // ------------------------------------------------

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

      const [
        total,
        deposits,
      ] = await Promise.all([
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
          status:
            status
              ? String(status)
                  .trim()
                  .toUpperCase()
              : null,

          walletType:
            walletType
              ? String(walletType)
                  .trim()
                  .toUpperCase()
              : null,

          start:
            start || null,

          end:
            end || null,
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

        history:
          deposits.map(
            (deposit) => ({
              id:
                deposit._id,

              _id:
                deposit._id,

              userId:
                deposit.userId,

              username:
                deposit.username ||
                "",

              fullName:
                deposit.fullName ||
                "",

              email:
                deposit.email ||
                "",

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
                deposit.note || "",

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
        "FILTER DEPOSIT HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to filter deposit history.",

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
// GoldTrade V18 Enterprise
// depositRoutes.js
// PART 4/6
// ======================================================


// ======================================================
// APPROVE DEPOSIT
//
// PATCH /api/deposit/:id/approve
//
// ADMIN ONLY
//
// IMPORTANT:
// Approval atomically updates:
//
// 1. Deposit
// 2. Wallet
// 3. WalletHistory
// 4. Transaction
//
// Wallet is credited ONLY here.
// ======================================================

router.patch(
  "/:id/approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    // ==================================================
    // VALIDATE DEPOSIT ID
    // ==================================================

    const depositId =
      String(
        req.params.id || ""
      ).trim();

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
    // START SESSION
    // ==================================================

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
          //
          // Supports:
          // PENDING
          // Pending
          // pending
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
                `Deposit already ${(
                  currentStatus ||
                  "processed"
                ).toLowerCase()}.`
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
            ![
              "PKR",
              "USDT",
            ].includes(
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
            !Number.isFinite(
              amount
            ) ||
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
          // FIND USER WALLET
          //
          // IMPORTANT:
          // Read wallet inside the same MongoDB session.
          // ==============================================

          const wallet =
            await Wallet.findOne({
              userId:
                deposit.userId,
            }).session(session);

          if (!wallet) {
            const error =
              new Error(
                "User wallet not found."
              );

            error.statusCode = 404;

            throw error;
          }

          // ==============================================
          // FROZEN WALLET
          // ==============================================

          if (
            wallet.isFrozen === true
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
          // SAVE WALLET BEFORE SNAPSHOT
          // ==============================================

          deposit.walletBefore =
            walletBefore;

          // ==============================================
          // CREDIT PKR
          // ==============================================

          if (
            walletType ===
            "PKR"
          ) {
            wallet.pkrBalance =
              walletBefore.pkrBalance +
              amount;

            wallet.totalDeposit =
              Number(
                wallet.totalDeposit || 0
              ) + amount;

            wallet.totalPkrDeposit =
              Number(
                wallet.totalPkrDeposit || 0
              ) + amount;
          }

          // ==============================================
          // CREDIT USDT
          // ==============================================

          if (
            walletType ===
            "USDT"
          ) {
            wallet.usdtBalance =
              walletBefore.usdtBalance +
              amount;

            wallet.totalDeposit =
              Number(
                wallet.totalDeposit || 0
              ) + amount;

            wallet.totalUsdtDeposited =
              Number(
                wallet.totalUsdtDeposited || 0
              ) + amount;
          }

          // ==============================================
          // LAST DEPOSIT
          // ==============================================

          wallet.lastDepositAt =
            new Date();

          // ==============================================
          // SAVE WALLET
          // ==============================================

          await wallet.save({
            session,
          });

          // ==============================================
          // WALLET AFTER
          // ==============================================

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

          // ==============================================
          // SAVE WALLET AFTER
          // ==============================================

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

          // ==============================================
          // SAVE DEPOSIT
          // ==============================================

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
                  "DEPOSIT",

                transactionType:
                  "DEPOSIT_REJECTED",

                transactionMode:
                  "RELEASE",

                amount,

                balanceBefore:
                  walletType ===
                  "PKR"
                    ? walletBefore.pkrBalance
                    : walletBefore.usdtBalance,

                balanceAfter:
                  walletType ===
                  "PKR"
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
                  "FAILED",

                note:
                  `Deposit rejected by ${
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
                  "DEPOSIT_REJECTED",

                transactionMode:
                  "RELEASE",

                amount,

                balanceBefore:
                  walletType ===
                  "PKR"
                    ? walletBefore.pkrBalance
                    : walletBefore.usdtBalance,

                balanceAfter:
                  walletType ===
                  "PKR"
                    ? walletAfter.pkrBalance
                    : walletAfter.usdtBalance,

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
                   `Deposit rejected by ${
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
          // RESPONSE DATA
          // ==============================================

          responseData = {
            deposit: {
              id:
                deposit._id,

              _id:
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

      // ==================================================
      // SUCCESS
      // ==================================================

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
        Number(
          error.statusCode
        ) || 500;

      return res
        .status(statusCode)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to approve deposit.",

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
// REJECT DEPOSIT
//
// PATCH /api/deposit/:id/reject
//
// ADMIN ONLY
//
// IMPORTANT:
// Rejection NEVER changes wallet balance.
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
    // REJECTION REASON
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

    const note =
      noteProvided
        ? String(
            req.body.note || ""
          )
            .trim()
            .slice(0, 1000)
        : null;

    // ==================================================
    // START SESSION
    // ==================================================

    const session =
      await mongoose.startSession();

    try {
      let responseDeposit =
        null;

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
          // STATUS
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
                `Deposit already ${(
                  currentStatus ||
                  "processed"
                ).toLowerCase()}.`
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
            ![
              "PKR",
              "USDT",
            ].includes(
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
            !Number.isFinite(
              amount
            ) ||
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
          // FIND CURRENT WALLET
          //
          // No balance mutation.
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
          // CURRENT WALLET SNAPSHOT
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

          // ==============================================
          // PRESERVE SNAPSHOTS
          // ==============================================

          if (
            !deposit.walletBefore
          ) {
            deposit.walletBefore =
              currentWallet;
          }

          deposit.walletAfter =
            currentWallet;

          // ==============================================
          // UPDATE DEPOSIT
          // ==============================================

          deposit.status =
            "REJECTED";

          deposit.rejectReason =
            rejectReason;

          // IMPORTANT:
          // Rejection uses rejectedBy fields.
          // ==============================================

          deposit.rejectedBy =
            req.user.id;

          deposit.rejectedByUsername =
            req.user.username ||
            "Admin";

          deposit.rejectedAt =
            new Date();

          if (
            noteProvided
          ) {
            deposit.note =
              note;
          }

          // ==============================================
          // SAVE DEPOSIT
          // ==============================================

          await deposit.save({
            session,
          });

          // ==============================================
          // WALLET HISTORY
          //
          // NO BALANCE CHANGE
          // ==============================================

          await WalletHistory.create(
            [
              {
                userId:
                  deposit.userId,

                username:
                  deposit.username,

                walletType,

                // FIXED:
                // WalletHistory enum requires DEPOSIT
                type:
                  "DEPOSIT",

                // Keep audit transaction name
                transactionType:
                  "DEPOSIT_REJECTED",

                // FIXED:
                // RELEASE is not valid for this model
                transactionMode:
                  "CREDIT",

                amount,

                balanceBefore:
                  walletType ===
                  "PKR"
                    ? currentWallet.pkrBalance
                    : currentWallet.usdtBalance,

                balanceAfter:
                  walletType ===
                  "PKR"
                    ? currentWallet.pkrBalance
                    : currentWallet.usdtBalance,

                referenceId:
                  deposit._id.toString(),

                admin:
                  req.user.username ||
                  "Admin",

                adminId:
                  req.user.id,

                // FIXED:
                // WalletHistory status enum
                status:
                  "FAILED",

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
          //
          // NO BALANCE CHANGE
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

                // FIXED:
                // RELEASE was causing validation error
                transactionMode:
                  "CREDIT",

                amount,

                balanceBefore:
                  walletType ===
                  "PKR"
                    ? currentWallet.pkrBalance
                    : currentWallet.usdtBalance,

                balanceAfter:
                  walletType ===
                  "PKR"
                    ? currentWallet.pkrBalance
                    : currentWallet.usdtBalance,

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
                  rejectReason,
              },
            ],
            {
              session,
            }
          );
                    // ==============================================
          // RESPONSE DATA
          // ==============================================

          responseDeposit = {
            id:
              deposit._id,

            _id:
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

      // ==================================================
      // SUCCESS
      // ==================================================

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

      const statusCode =
        Number(
          error.statusCode
        ) || 500;

      return res
        .status(statusCode)
        .json({
          success: false,

          message:
            error.message ||
            "Unable to reject deposit.",

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
// CANCEL DEPOSIT
//
// PATCH /api/deposit/:id/cancel
//
// USER:
//   Own pending deposits only
//
// ADMIN:
//   Any pending deposit
//
// IMPORTANT:
// Cancellation NEVER changes wallet balance.
// ======================================================

router.patch(
  "/:id/cancel",
  verifyToken,
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
          "Invalid deposit ID.",
      });
    }

    // ==================================================
    // START SESSION
    // ==================================================

    const session =
      await mongoose.startSession();

    try {
      let responseData =
        null;

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
          // ROLE
          // ==============================================

          const isAdminUser =
            String(
              req.user?.role || ""
            )
              .trim()
              .toLowerCase() ===
            "admin";

          // ==============================================
          // OWNERSHIP
          // ==============================================

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
            )
              .trim()
              .toUpperCase();

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
            )
              .trim()
              .toUpperCase();

          if (
            ![
              "PKR",
              "USDT",
            ].includes(
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
            !Number.isFinite(
              amount
            ) ||
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
          // FIND WALLET
          //
          // Read only.
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

          const walletSnapshot = {
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

          const balanceBefore =
            walletType ===
            "PKR"
              ? walletSnapshot.pkrBalance
              : walletSnapshot.usdtBalance;

          // ==============================================
          // UPDATE DEPOSIT
          // ==============================================

          deposit.status =
            "CANCELLED";

          deposit.walletBefore =
            deposit.walletBefore ||
            walletSnapshot;

          deposit.walletAfter =
            walletSnapshot;

          deposit.note =
            isAdminUser
              ? "Deposit cancelled by admin."
              : "Deposit cancelled by user.";

          // ==============================================
          // OPTIONAL CANCELLATION TIMESTAMP
          // ==============================================

          if (
            "cancelledAt" in
            deposit
          ) {
            deposit.cancelledAt =
              new Date();
          }

          // ==============================================
          // ADMIN AUDIT
          // ==============================================

          if (
            isAdminUser
          ) {
            deposit.rejectedBy =
              req.user.id;

            deposit.rejectedByUsername =
              req.user.username ||
              "Admin";

            deposit.rejectedAt =
              new Date();
          }

          // ==============================================
          // SAVE
          // ==============================================

          await deposit.save({
            session,
          });

          // ==============================================
          // WALLET HISTORY
          //
          // NO BALANCE CHANGE
          // ==============================================

          await WalletHistory.create(
            [
              {
                userId:
                  deposit.userId,

                username:
                  deposit.username,

                walletType,

                // FIXED:
                // WalletHistory.type enum
                type:
                  "DEPOSIT",

                // Keep audit transaction name
                transactionType:
                  "DEPOSIT_CANCELLED",

                // Cancellation remains RELEASE
                transactionMode:
                  "RELEASE",

                amount,

                balanceBefore,

                balanceAfter:
                  balanceBefore,

                // FIXED:
                // WalletHistory.status enum
                status:
                  "CANCELLED",

                referenceId:
                  deposit._id.toString(),

                paymentMethod:
                  deposit.paymentMethod ||
                  "",

                adminId:
                  isAdminUser
                    ? req.user.id
                    : undefined,

                adminUsername:
                  isAdminUser
                    ? req.user.username
                    : undefined,

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
                  "DEPOSIT_CANCELLED",

                // KEEP RELEASE
                //
                // Cancellation does not credit/debit
                // the wallet balance.
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

                adminId:
                  isAdminUser
                    ? req.user.id
                    : undefined,

                adminUsername:
                  isAdminUser
                    ? req.user.username
                    : undefined,

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

            _id:
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

      // ==================================================
      // SUCCESS
      // ==================================================

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
        Number(
          error.statusCode
        ) >= 400
          ? Number(
              error.statusCode
            )
          : 500;

      return res
        .status(statusCode)
        .json({
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
// PART 5/6
// ADMIN DEPOSIT MANAGEMENT
// GoldTrade V18 Enterprise
// ======================================================


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

      let page = Number(req.query.page);
      let limit = Number(req.query.limit);

      if (!Number.isFinite(page) || page < 1) {
        page = 1;
      }

      if (!Number.isFinite(limit) || limit < 1) {
        limit = 20;
      }

      page = Math.floor(page);
      limit = Math.min(Math.floor(limit), 100);

      const skip = (page - 1) * limit;

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
        const normalizedStatus = String(status)
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

        if (!statusMap[normalizedStatus]) {
          return res.status(400).json({
            success: false,
            message: "Invalid deposit status.",
          });
        }

        query.status = {
          $in: statusMap[normalizedStatus],
        };
      }

      // ==================================================
      // WALLET TYPE
      // ==================================================

      if (walletType) {
        const normalizedWalletType = String(
          walletType
        )
          .trim()
          .toUpperCase();

        if (
          !["PKR", "USDT"].includes(
            normalizedWalletType
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid wallet type.",
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
          String(username).trim();

        if (cleanUsername) {
          query.username = {
            $regex: cleanUsername.replace(
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
          String(paymentMethod).trim();

        if (cleanMethod) {
          query.paymentMethod = {
            $regex: cleanMethod.replace(
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

        // ==================================================
        // START DATE
        // ==================================================

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
              message: "Invalid start date.",
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

        // ==================================================
        // END DATE
        // ==================================================

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
              message: "Invalid end date.",
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
        // DATE RANGE VALIDATION
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
              "Start date cannot be greater than end date.",
          });
        }
      }

      // ==================================================
      // DATABASE QUERY
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
      // NORMALIZE
      // ==================================================

      const normalizedDeposits =
        deposits.map((deposit) => ({
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
        }));

      const totalPages =
        total > 0
          ? Math.ceil(total / limit)
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
            // ==================================================
      // END SUCCESS
      // ==================================================

    } catch (error) {
      // ==================================================
      // ERROR LOG
      // ==================================================

      console.error(
        "ADMIN GET ALL DEPOSITS ERROR:",
        error
      );

      // ==================================================
      // ERROR RESPONSE
      // ==================================================

      return res.status(500).json({
        success: false,

        message:
          "Unable to load deposits.",

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
      // LOAD DEPOSIT
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

      // ==================================================
      // LOAD WALLET
      // ==================================================

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
        const rawPkrBalance =
          Number(
            wallet.pkrBalance || 0
          );

        const rawUsdtBalance =
          Number(
            wallet.usdtBalance || 0
          );

        const rawGoldBalance =
          Number(
            wallet.goldBalance || 0
          );

        const rawLockedPkr =
          Number(
            wallet.lockedPkr || 0
          );

        const rawLockedUsdt =
          Number(
            wallet.lockedUsdt || 0
          );

        const rawLockedGold =
          Number(
            wallet.lockedGold || 0
          );

        const pkrBalance =
          Number.isFinite(
            rawPkrBalance
          )
            ? rawPkrBalance
            : 0;

        const usdtBalance =
          Number.isFinite(
            rawUsdtBalance
          )
            ? rawUsdtBalance
            : 0;

        const goldBalance =
          Number.isFinite(
            rawGoldBalance
          )
            ? rawGoldBalance
            : 0;

        const lockedPkr =
          Number.isFinite(
            rawLockedPkr
          )
            ? rawLockedPkr
            : 0;

        const lockedUsdt =
          Number.isFinite(
            rawLockedUsdt
          )
            ? rawLockedUsdt
            : 0;

        const lockedGold =
          Number.isFinite(
            rawLockedGold
          )
            ? rawLockedGold
            : 0;

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

      const rawAmount =
        Number(
          deposit.amount || 0
        );

      const safeAmount =
        Number.isFinite(
          rawAmount
        )
          ? rawAmount
          : 0;

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
          safeAmount.toFixed(6)
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
      // ==================================================
      // ERROR
      // ==================================================

      console.error(
        "ADMIN GET DEPOSIT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load deposit details.",

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
      // VALIDATE SEARCH
      // ==================================================

      if (
        !reference &&
        !transactionId
      ) {
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
      // REFERENCE
      // ==================================================

      if (reference) {
        query.referenceId = {
          $regex:
            escapeRegex(reference),
          $options: "i",
        };
      }

      // ==================================================
      // TRANSACTION ID
      // ==================================================

      if (transactionId) {
        query.transactionId = {
          $regex:
            escapeRegex(transactionId),
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
        deposits.map((deposit) => {
          const rawAmount =
            Number(
              deposit.amount || 0
            );

          const safeAmount =
            Number.isFinite(
              rawAmount
            )
              ? rawAmount
              : 0;

          return {
            ...deposit,

            id: deposit._id,

            status: String(
              deposit.status || ""
            ).toUpperCase(),

            walletType: String(
              deposit.walletType || ""
            ).toUpperCase(),

            amount: Number(
              safeAmount.toFixed(6)
            ),
          };
        });

      // ==================================================
      // SUCCESS
      // ==================================================

      return res.status(200).json({
        success: true,

        total:
          normalizedDeposits.length,

        deposits:
          normalizedDeposits,
      });

    } catch (error) {
      // ==================================================
      // ERROR
      // ==================================================

      console.error(
        "ADMIN SEARCH DEPOSITS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to search deposits.",

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
      // NORMALIZE AMOUNT
      // ==================================================

      const rawAmount =
        Number(
          deposit.amount || 0
        );

      const safeAmount =
        Number.isFinite(
          rawAmount
        )
          ? rawAmount
          : 0;

      // ==================================================
      // NORMALIZE RECEIPT
      // ==================================================

      const receipt = {
        ...deposit,

        id: deposit._id,

        receiptImage:
          typeof deposit.receiptImage ===
          "string"
            ? deposit.receiptImage
            : "",

        receiptUploaded:
          deposit.receiptUploaded ===
          true,

        status: String(
          deposit.status || ""
        ).toUpperCase(),

        walletType: String(
          deposit.walletType || ""
        ).toUpperCase(),

        amount: Number(
          safeAmount.toFixed(6)
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
      // ==================================================
      // ERROR
      // ==================================================

      console.error(
        "RECEIPT PREVIEW ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load receipt.",

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
// BULK APPROVE DEPOSITS
// PATCH /api/deposit/admin/bulk-approve
//
// Body:
// {
//   "depositIds": ["id1", "id2"]
// }
//
// Only PENDING deposits are approved.
// Each deposit uses its own MongoDB transaction.
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
      // MAXIMUM
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
      // UNIQUE IDS
      // ==================================================

      const depositIds = [
        ...new Set(
          rawDepositIds.map(
            (id) => String(id).trim()
          )
        ),
      ];

      // ==================================================
      // VALIDATE IDS
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

      for (
        const depositId of depositIds
      ) {
        const session =
          await mongoose.startSession();

        try {
          let processed = false;

          await session.withTransaction(
            async () => {
              // ========================================
              // FIND DEPOSIT
              // ========================================

              const deposit =
                await Deposit.findById(
                  depositId
                ).session(session);

              if (!deposit) {
                skipped += 1;
                return;
              }

              // ========================================
              // STATUS
              // ========================================

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

              // ========================================
              // WALLET TYPE
              // ========================================

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
                throw new Error(
                  "Invalid wallet type."
                );
              }

              // ========================================
              // AMOUNT
              // ========================================

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

              // ========================================
              // WALLET
              // ========================================

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

              // ========================================
              // FROZEN CHECK
              // ========================================

              if (
                wallet.isFrozen === true
              ) {
                throw new Error(
                  "User wallet is frozen."
                );
              }

              // ========================================
              // WALLET BEFORE
              // ========================================

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

              const balanceBefore =
                walletType === "PKR"
                  ? walletBefore.pkrBalance
                  : walletBefore.usdtBalance;

              // ========================================
              // CREDIT WALLET
              // ========================================

              if (
                walletType === "PKR"
              ) {
                wallet.pkrBalance =
                  walletBefore.pkrBalance +
                  amount;

                wallet.totalPkrDeposit =
                  Number(
                    wallet.totalPkrDeposit || 0
                  ) + amount;

              } else {
                wallet.usdtBalance =
                  walletBefore.usdtBalance +
                  amount;

                wallet.totalUsdtDeposited =
                  Number(
                    wallet.totalUsdtDeposited || 0
                  ) + amount;
              }

              // ========================================
              // COMMON TOTAL
              // ========================================

              wallet.totalDeposit =
                Number(
                  wallet.totalDeposit || 0
                ) + amount;

              wallet.lastDepositAt =
                new Date();

              // ========================================
              // WALLET AFTER
              // ========================================

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

              const balanceAfter =
                walletType === "PKR"
                  ? walletAfter.pkrBalance
                  : walletAfter.usdtBalance;

              // ========================================
              // SAVE WALLET
              // ========================================

              await wallet.save({
                session,
              });

              // ========================================
              // UPDATE DEPOSIT
              // ========================================

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
                            // ========================================
              // WALLET HISTORY
              // ========================================

              await WalletHistory.create(
                [
                  {
                    userId:
                      deposit.userId,

                    username:
                      deposit.username,

                    walletType,

                    // FIXED:
                    // WalletHistory enum allows DEPOSIT,
                    // not DEPOSIT_APPROVED.
                    type:
                      "DEPOSIT",

                    transactionType:
                      "DEPOSIT_APPROVED",

                    transactionMode:
                      "CREDIT",

                    amount,

                    balanceBefore,

                    balanceAfter,

                    // FIXED:
                    // WalletHistory enum allows SUCCESS,
                    // not Completed.
                    status:
                      "SUCCESS",

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

              // ========================================
              // TRANSACTION
              // ========================================

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
      // SUCCESS
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
          process.env.NODE_ENV ===
          "production"
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

      if (
        depositIds.length > 100
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum 100 deposits can be rejected at once.",
        });
      }

      // ==================================================
      // REASON
      // ==================================================

      const reason =
        typeof rejectReason === "string"
          ? rejectReason.trim()
          : "";

      const finalReason =
        reason ||
        "Bulk rejected by admin.";

      if (
        finalReason.length > 500
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Reject reason cannot exceed 500 characters.",
        });
      }

      // ==================================================
      // UNIQUE IDS
      // ==================================================

      const uniqueDepositIds = [
        ...new Set(
          depositIds.map(
            (id) => String(id).trim()
          )
        ),
      ];

      // ==================================================
      // VALIDATE IDS
      // ==================================================

      const invalidIds =
        uniqueDepositIds.filter(
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

      let rejected = 0;
      let skipped = 0;

      const failed = [];

      // ==================================================
      // PROCESS
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
              // ========================================
              // FIND DEPOSIT
              // ========================================

              const deposit =
                await Deposit.findById(
                  depositId
                ).session(session);

              if (!deposit) {
                skipped += 1;
                return;
              }

              // ========================================
              // STATUS
              // ========================================

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

              // ========================================
              // WALLET TYPE
              // ========================================

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
                throw new Error(
                  "Invalid deposit wallet type."
                );
              }

              // ========================================
              // AMOUNT
              // ========================================

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

              // ========================================
              // WALLET SNAPSHOT
              // ========================================

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

              const balanceBefore =
                walletType === "PKR"
                  ? walletBefore.pkrBalance
                  : walletBefore.usdtBalance;

              // ========================================
              // UPDATE DEPOSIT
              // ========================================

              deposit.walletBefore =
                deposit.walletBefore ||
                walletBefore;

              deposit.walletAfter =
                walletBefore;

              deposit.status =
                "REJECTED";

              deposit.rejectReason =
                finalReason;

              deposit.rejectedBy =
                req.user.id;

              deposit.rejectedByUsername =
                req.user.username ||
                "Admin";

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

                           // ==================================================
              // WALLET HISTORY
              // ==================================================

              await WalletHistory.create(
                [
                  {
                    userId:
                      deposit.userId,

                    username:
                      deposit.username,

                    walletType,

                    // FIX:
                    // WalletHistory enum = DEPOSIT
                    type: "DEPOSIT",

                    transactionType:
                      "DEPOSIT_REJECTED",

                    transactionMode:
                      "RELEASE",

                    amount,

                    balanceBefore,

                    balanceAfter:
                      balanceBefore,

                    // FIX:
                    // WalletHistory status enum
                    status: "FAILED",

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

              // ==================================================
              // TRANSACTION
              // ==================================================

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
          )
            .trim()
            .toUpperCase();

        const walletType =
          String(
            deposit.walletType || ""
          )
            .trim()
            .toUpperCase();

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
              typeof deposit.username === "string"
                ? deposit.username
                : "",

            walletType:
              String(
                deposit.walletType || ""
              )
                .trim()
                .toUpperCase(),

            amount:
              Number(
                Number(
                  deposit.amount || 0
                ).toFixed(6)
              ),

            currency:
              deposit.currency || "",

            paymentMethod:
              deposit.paymentMethod || "",

            transactionId:
              deposit.transactionId || "",

            referenceId:
              deposit.referenceId || "",

            status:
              String(
                deposit.status || ""
              )
                .trim()
                .toUpperCase(),

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
//
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
        )
          .trim()
          .toLowerCase();

      // ==================================================
      // AUTH CHECK
      // ==================================================

      if (!userId) {
        return res.status(401).json({
          success: false,

          message:
            "Authenticated user ID is missing.",
        });
      }

      // ==================================================
      // DEPOSIT QUERY
      //
      // ADMIN = ALL
      // USER  = OWN
      // ==================================================

      const depositQuery =
        role === "admin"
          ? {}
          : {
              userId,
            };

      // ==================================================
      // TRANSACTION QUERY
      // ==================================================

      const transactionQuery =
        role === "admin"
          ? {}
          : {
              $or: [
                {
                  userId,
                },
                ...(username
                  ? [
                      {
                        username,
                      },
                    ]
                  : []),
              ],
            };

      // ==================================================
      // HISTORY QUERY
      // ==================================================

      const historyQuery =
        role === "admin"
          ? {}
          : {
              $or: [
                {
                  userId,
                },
                ...(username
                  ? [
                      {
                        username,
                      },
                    ]
                  : []),
              ],
            };

      // ==================================================
      // STATUS QUERIES
      // ==================================================

      const pendingStatusQuery = {
        ...depositQuery,

        status: "PENDING",
      };

      const approvedStatusQuery = {
        ...depositQuery,

        status: "APPROVED",
      };

      const rejectedStatusQuery = {
        ...depositQuery,

        status: "REJECTED",
      };

      const cancelledStatusQuery = {
        ...depositQuery,

        status: "CANCELLED",
      };

      // ==================================================
      // PARALLEL DIAGNOSTICS
      // ==================================================

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

        Deposit.countDocuments(
          approvedStatusQuery
        ),

        Deposit.countDocuments(
          rejectedStatusQuery
        ),

        Deposit.countDocuments(
          cancelledStatusQuery
        ),

        Transaction.countDocuments({
          ...transactionQuery,

          transactionType: {
            $regex: /^DEPOSIT/i,
          },
        }),

        WalletHistory.countDocuments({
          ...historyQuery,

          type: "DEPOSIT",
        }),
      ]);

      // ==================================================
      // SAFE WALLET SNAPSHOT
      // ==================================================

      const pkrBalance =
        wallet
          ? Number(
              wallet.pkrBalance || 0
            )
          : 0;

      const usdtBalance =
        wallet
          ? Number(
              wallet.usdtBalance || 0
            )
          : 0;

      const goldBalance =
        wallet
          ? Number(
              wallet.goldBalance || 0
            )
          : 0;

      const lockedPkr =
        wallet
          ? Number(
              wallet.lockedPkr || 0
            )
          : 0;

      const lockedUsdt =
        wallet
          ? Number(
              wallet.lockedUsdt || 0
            )
          : 0;

      const lockedGold =
        wallet
          ? Number(
              wallet.lockedGold || 0
            )
          : 0;

      const walletDiagnostics =
        wallet
          ? {
              walletId:
                wallet._id,

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

            // ==================================================
      // RESPONSE
      // ==================================================

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
          process.env.NODE_ENV === "production"
            ? undefined
            : error.message,
      });
    }
  }
);

// ======================================================
// API ROUTE LIST
// GET /api/deposit/routes
//
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
        // ==================================================
        // HEALTH / DIAGNOSTICS
        // ==================================================

        health: [
          "GET /api/deposit/health",
          "GET /api/deposit/status",
          "GET /api/deposit/routes",
          "GET /api/deposit/debug",
          "GET /api/deposit/statistics",
        ],

        // ==================================================
        // USER
        // ==================================================

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

        // ==================================================
        // SETTINGS / PAYMENT
        // ==================================================

        settings: [
          "GET /api/deposit/settings",
          "PATCH /api/deposit/settings",

          "GET /api/deposit/settings/payment-methods",
          "PATCH /api/deposit/settings/payment-methods",

          "GET /api/deposit/payment-details",

          "GET /api/deposit/payment-settings",
          "PATCH /api/deposit/payment-settings",
        ],

        // ==================================================
        // ADMIN
        // ==================================================

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