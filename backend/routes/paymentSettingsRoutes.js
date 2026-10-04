// ======================================================
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 1/6
//
// Core + Helpers + Health + User Deposit APIs
//
// FRONTEND CONTRACT:
//
// GET  /api/payment-settings/health
// GET  /api/payment-settings/deposit
// GET  /api/payment-settings/method/:method
// ======================================================

const express = require("express");

const router = express.Router();

// ======================================================
// MODEL
// ======================================================

const PaymentSettings = require("../models/PaymentSettings");

// ======================================================
// AUTH
// ======================================================

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

// ======================================================
// HELPERS
// ======================================================

// ------------------------------------------------------
// Clean string
// ------------------------------------------------------

const clean = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

// ------------------------------------------------------
// Boolean normalizer
// ------------------------------------------------------

const boolValue = (value, fallback = true) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") {
      return true;
    }

    if (normalized === "false") {
      return false;
    }
  }

  return Boolean(value);
};

// ======================================================
// NORMALIZE PAYMENT METHOD
// ======================================================
//
// Supported:
//
// BANK
// JAZZCASH
// EASYPAISA
// BINANCE
// USDT_BEP20
// USDT_ERC20
// ======================================================

const normalizeMethod = (value) => {
  const method = String(value || "")
    .trim()
    .toUpperCase();

  // ----------------------------------------------------
  // BANK
  // ----------------------------------------------------

  if (
    method === "BANK" ||
    method === "BANK TRANSFER" ||
    method === "BANK_TRANSFER"
  ) {
    return "BANK";
  }

  // ----------------------------------------------------
  // JAZZCASH
  // ----------------------------------------------------

  if (
    method === "JAZZCASH" ||
    method === "JAZZ CASH" ||
    method === "JAZZ_CASH"
  ) {
    return "JAZZCASH";
  }

  // ----------------------------------------------------
  // EASYPAISA
  // ----------------------------------------------------

  if (
    method === "EASYPAISA" ||
    method === "EASY PAISA" ||
    method === "EASY_PAISA"
  ) {
    return "EASYPAISA";
  }

  // ----------------------------------------------------
  // BINANCE / USDT TRC20
  // ----------------------------------------------------

  if (
    method === "BINANCE" ||
    method === "USDT" ||
    method === "USDT_TRC20" ||
    method === "USDT TRC20"
  ) {
    return "BINANCE";
  }

  // ----------------------------------------------------
  // USDT BEP20
  // ----------------------------------------------------

  if (
    method === "USDT_BEP20" ||
    method === "USDT BEP20"
  ) {
    return "USDT_BEP20";
  }

  // ----------------------------------------------------
  // USDT ERC20
  // ----------------------------------------------------

  if (
    method === "USDT_ERC20" ||
    method === "USDT ERC20"
  ) {
    return "USDT_ERC20";
  }

  return method;
};

// ======================================================
// FORMAT NEW V18 DEPOSIT METHOD
// ======================================================
//
// Converts PaymentSettings.depositMethods[] into the
// exact structure expected by the existing frontend.
//
// This is the NEW SOURCE OF TRUTH.
//
// ======================================================

const formatDepositMethod = (item, settingsId) => {
  if (!item || typeof item !== "object") {
    return null;
  }

  const method = normalizeMethod(
    item.method ||
      item.type ||
      ""
  );

  if (!method) {
    return null;
  }

  const enabled =
    item.enabled !== false;

  const title =
    clean(item.title);

  const accountTitle =
    clean(
      item.accountTitle ||
        item.accountName
    );

  const accountNumber =
    clean(item.accountNumber);

  const iban =
    clean(item.iban).toUpperCase();

  const walletAddress =
    clean(item.walletAddress);

  const network =
    clean(item.network).toUpperCase();

  const qrImage =
    clean(
      item.qrImage ||
        item.qrCode
    );

  // ====================================================
  // BANK
  // ====================================================

  if (method === "BANK") {
    return {
      _id:
        item._id ||
        `BANK_${settingsId}`,

      method: "BANK",

      title:
        title ||
        "Bank Transfer",

      enabled,

      bankName:
        clean(item.bankName) ||
        title ||
        "Bank Transfer",

      accountTitle,

      accountNumber,

      iban,

      walletAddress: "",

      network: "",

      qrImage,
    };
  }

  // ====================================================
  // JAZZCASH
  // ====================================================

  if (method === "JAZZCASH") {
    return {
      _id:
        item._id ||
        `JAZZCASH_${settingsId}`,

      method: "JAZZCASH",

      title:
        title ||
        "JazzCash",

      enabled,

      accountTitle,

      accountNumber,

      iban: "",

      walletAddress: "",

      network: "",

      qrImage,
    };
  }

  // ====================================================
  // EASYPAISA
  // ====================================================

  if (method === "EASYPAISA") {
    return {
      _id:
        item._id ||
        `EASYPAISA_${settingsId}`,

      method: "EASYPAISA",

      title:
        title ||
        "EasyPaisa",

      enabled,

      accountTitle,

      accountNumber,

      iban: "",

      walletAddress: "",

      network: "",

      qrImage,
    };
  }

  // ====================================================
  // BINANCE / USDT TRC20
  // ====================================================

  if (method === "BINANCE") {
    return {
      _id:
        item._id ||
        `BINANCE_${settingsId}`,

      method: "BINANCE",

      title:
        title ||
        "USDT TRC20",

      enabled,

      accountTitle: "",

      accountNumber: "",

      iban: "",

      walletAddress:
        walletAddress ||
        accountNumber,

      network:
        network ||
        "TRC20",

      qrImage,
    };
  }

  // ====================================================
  // USDT BEP20
  // ====================================================

  if (method === "USDT_BEP20") {
    return {
      _id:
        item._id ||
        `USDT_BEP20_${settingsId}`,

      method: "USDT_BEP20",

      title:
        title ||
        "USDT BEP20",

      enabled,

      accountTitle: "",

      accountNumber: "",

      iban: "",

      walletAddress:
        walletAddress ||
        accountNumber,

      network:
        network ||
        "BEP20",

      qrImage,
    };
  }

  // ====================================================
  // USDT ERC20
  // ====================================================

  if (method === "USDT_ERC20") {
    return {
      _id:
        item._id ||
        `USDT_ERC20_${settingsId}`,

      method: "USDT_ERC20",

      title:
        title ||
        "USDT ERC20",

      enabled,

      accountTitle: "",

      accountNumber: "",

      iban: "",

      walletAddress:
        walletAddress ||
        accountNumber,

      network:
        network ||
        "ERC20",

      qrImage,
    };
  }

  // ====================================================
  // GENERIC METHOD
  // ====================================================

  return {
    _id:
      item._id ||
      `${method}_${settingsId}`,

    method,

    title:
      title ||
      method,

    enabled,

    accountTitle,

    accountNumber,

    iban,

    walletAddress,

    network,

    qrImage,
  };
};

// ======================================================
// BUILD LEGACY METHODS
// ======================================================
//
// IMPORTANT:
//
// Old MongoDB documents may not have depositMethods[].
// Therefore we keep a legacy fallback.
//
// New documents:
//     depositMethods[]
//
// Old documents:
//     bankEnabled / jazzCashEnabled / etc.
//
// ======================================================

const buildLegacyDepositMethods = (settings) => {
  if (!settings) {
    return [];
  }

  const methods = [];

  // ====================================================
  // BANK
  // ====================================================

  if (
    settings.bankEnabled === true &&
    (
      settings.bankName ||
      settings.bankAccountTitle ||
      settings.bankAccountNumber ||
      settings.iban
    )
  ) {
    methods.push({
      _id:
        `BANK_${settings._id}`,

      method: "BANK",

      title:
        settings.bankName ||
        "Bank Transfer",

      enabled: true,

      bankName:
        settings.bankName || "",

      accountTitle:
        settings.bankAccountTitle || "",

      accountNumber:
        settings.bankAccountNumber || "",

      iban:
        settings.iban || "",

      walletAddress: "",

      network: "",

      qrImage:
        settings.bankQR || "",
    });
  }

  // ====================================================
  // JAZZCASH
  // ====================================================

  if (
    settings.jazzCashEnabled === true &&
    (
      settings.jazzCashNumber ||
      settings.jazzCashTitle
    )
  ) {
    methods.push({
      _id:
        `JAZZCASH_${settings._id}`,

      method: "JAZZCASH",

      title: "JazzCash",

      enabled: true,

      accountTitle:
        settings.jazzCashTitle || "",

      accountNumber:
        settings.jazzCashNumber || "",

      iban: "",

      walletAddress: "",

      network: "",

      qrImage:
        settings.jazzCashQR || "",
    });
  }

  // ====================================================
  // EASYPAISA
  // ====================================================

  if (
    settings.easypaisaEnabled === true &&
    (
      settings.easypaisaNumber ||
      settings.easypaisaTitle
    )
  ) {
    methods.push({
      _id:
        `EASYPAISA_${settings._id}`,

      method: "EASYPAISA",

      title: "EasyPaisa",

      enabled: true,

      accountTitle:
        settings.easypaisaTitle || "",

      accountNumber:
        settings.easypaisaNumber || "",

      iban: "",

      walletAddress: "",

      network: "",

      qrImage:
        settings.easypaisaQR || "",
    });
  }

  // ====================================================
  // USDT TRC20 / BINANCE
  // ====================================================

  if (
    settings.usdtEnabled === true &&
    settings.usdtTRC20
  ) {
    methods.push({
      _id:
        `BINANCE_${settings._id}`,

      method: "BINANCE",

      title: "USDT TRC20",

      enabled: true,

      accountTitle: "",

      accountNumber: "",

      iban: "",

      walletAddress:
        settings.usdtTRC20,

      network: "TRC20",

      qrImage:
        settings.binanceQR || "",
    });
  }

  // ====================================================
  // USDT BEP20
  // ====================================================

  if (
    settings.usdtEnabled === true &&
    settings.usdtBEP20
  ) {
    methods.push({
      _id:
        `USDT_BEP20_${settings._id}`,

      method: "USDT_BEP20",

      title: "USDT BEP20",

      enabled: true,

      accountTitle: "",

      accountNumber: "",

      iban: "",

      walletAddress:
        settings.usdtBEP20,

      network: "BEP20",

      qrImage:
        settings.binanceQR || "",
    });
  }

  // ====================================================
  // USDT ERC20
  // ====================================================

  if (
    settings.usdtEnabled === true &&
    settings.usdtERC20
  ) {
    methods.push({
      _id:
        `USDT_ERC20_${settings._id}`,

      method: "USDT_ERC20",

      title: "USDT ERC20",

      enabled: true,

      accountTitle: "",

      accountNumber: "",

      iban: "",

      walletAddress:
        settings.usdtERC20,

      network: "ERC20",

      qrImage:
        settings.binanceQR || "",
    });
  }

  return methods;
};

// ======================================================
// GET ACTIVE DEPOSIT METHODS
// ======================================================
//
// New source:
//     settings.depositMethods[]
//
// Fallback:
//     legacy MongoDB fields
//
// ======================================================

const getDepositMethods = (settings) => {
  if (!settings) {
    return [];
  }

  // ----------------------------------------------------
  // NEW V18 ARRAY
  // ----------------------------------------------------

  if (
    Array.isArray(settings.depositMethods) &&
    settings.depositMethods.length > 0
  ) {
    return settings.depositMethods
      .map((item) =>
        formatDepositMethod(
          item,
          settings._id
        )
      )
      .filter(Boolean);
  }

  // ----------------------------------------------------
  // LEGACY FALLBACK
  // ----------------------------------------------------

  return buildLegacyDepositMethods(
    settings
  );
};

// ======================================================
// HEALTH CHECK
// ======================================================
//
// GET /api/payment-settings/health
//
// No authentication required.
// ======================================================

router.get(
  "/health",
  (req, res) => {
    return res.status(200).json({
      success: true,

      module:
        "Payment Settings API",

      version:
        "V18 Enterprise",

      status:
        "ONLINE",

      timestamp:
        new Date().toISOString(),
    });
  }
);

// ======================================================
// USER DEPOSIT PAYMENT METHODS
// ======================================================
//
// GET /api/payment-settings/deposit
//
// Used by:
//
// frontend/app/deposit/page.tsx
//
// IMPORTANT:
//
// New V18 depositMethods[] is preferred.
//
// Only enabled payment methods are returned.
// ======================================================

router.get(
  "/deposit",
  verifyToken,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings
          .findOne()
          .lean();

      // ------------------------------------------------
      // NO SETTINGS
      // ------------------------------------------------

      if (!settings) {
        return res.status(200).json({
          success: true,

          total: 0,

          methods: [],

          updatedAt: null,
        });
      }

      // ------------------------------------------------
      // GET METHODS
      // ------------------------------------------------

      const allMethods =
        getDepositMethods(
          settings
        );

      // ------------------------------------------------
      // ONLY ENABLED METHODS
      // ------------------------------------------------

      const methods =
        allMethods.filter(
          (method) =>
            method.enabled !== false
        );

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        total:
          methods.length,

        methods,

        updatedAt:
          settings.updatedAt ||
          null,
      });
    } catch (error) {
      console.error(
        "GET USER DEPOSIT PAYMENT METHODS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load deposit payment methods.",
      });
    }
  }
);

// ======================================================
// SINGLE PAYMENT METHOD
// ======================================================
//
// GET /api/payment-settings/method/:method
//
// Examples:
//
// /api/payment-settings/method/BANK
// /api/payment-settings/method/JAZZCASH
// /api/payment-settings/method/EASYPAISA
// /api/payment-settings/method/BINANCE
// /api/payment-settings/method/USDT_BEP20
// /api/payment-settings/method/USDT_ERC20
// ======================================================

router.get(
  "/method/:method",
  verifyToken,
  async (req, res) => {
    try {
      const requestedMethod =
        normalizeMethod(
          req.params.method
        );

      const settings =
        await PaymentSettings
          .findOne()
          .lean();

      // ------------------------------------------------
      // SETTINGS NOT FOUND
      // ------------------------------------------------

      if (!settings) {
        return res.status(404).json({
          success: false,

          message:
            "Payment settings not found.",
        });
      }

      // ------------------------------------------------
      // LOAD ALL METHODS
      // ------------------------------------------------

      const methods =
        getDepositMethods(
          settings
        );

      // ------------------------------------------------
      // FIND REQUESTED METHOD
      // ------------------------------------------------

      const method =
        methods.find(
          (item) =>
            normalizeMethod(
              item.method
            ) === requestedMethod
        );

      // ------------------------------------------------
      // NOT FOUND
      // ------------------------------------------------

      if (!method) {
        return res.status(404).json({
          success: false,

          message:
            "Payment method not found.",
        });
      }

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        method,
      });
    } catch (error) {
      console.error(
        "GET SINGLE PAYMENT METHOD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load payment method.",
      });
    }
  }
);

// ======================================================
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 2/6
//
// Admin Payment Settings APIs
//
// FRONTEND CONTRACT:
//
// GET   /api/payment-settings/admin/all
// GET   /api/payment-settings/admin/raw
// GET   /api/payment-settings/admin/deposit
//
// IMPORTANT:
//
// PATCH /api/payment-settings/admin/deposit
// PART 4/6 mein hoga.
//
// ======================================================


// ======================================================
// GET COMPLETE PAYMENT SETTINGS
// ======================================================
//
// GET /api/payment-settings/admin/all
//
// Used by:
//
// frontend/app/admin/payment-settings/page.tsx
//
// Returns the complete MongoDB PaymentSettings document.
//
// ======================================================

router.get(
  "/admin/all",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      let settings =
        await PaymentSettings
          .findOne()
          .lean();

      // ------------------------------------------------
      // CREATE SETTINGS DOCUMENT IF NONE EXISTS
      // ------------------------------------------------

      if (!settings) {
        const created =
          await PaymentSettings.create({});

        settings =
          created.toObject();
      }

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        settings,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "GET ADMIN PAYMENT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load payment settings.",
      });
    }
  }
);


// ======================================================
// GET ADMIN RAW SETTINGS
// ======================================================
//
// GET /api/payment-settings/admin/raw
//
// Diagnostic/admin use.
//
// This endpoint intentionally returns the raw
// PaymentSettings document.
//
// ======================================================

router.get(
  "/admin/raw",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings
          .findOne()
          .lean();

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        settings:
          settings || {},

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "GET ADMIN RAW PAYMENT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load raw payment settings.",
      });
    }
  }
);


// ======================================================
// GET ADMIN DEPOSIT METHODS
// ======================================================
//
// GET /api/payment-settings/admin/deposit
//
// Used by:
//
// frontend/app/admin/payment-settings/page.tsx
//
// IMPORTANT:
//
// NEW V18 SOURCE:
//
//     settings.depositMethods[]
//
// LEGACY FALLBACK:
//
//     bankEnabled
//     jazzCashEnabled
//     easypaisaEnabled
//     usdtEnabled
//
// PART 1 already provides:
//
//     getDepositMethods(settings)
//
// So this route does NOT duplicate the old
// BANK/JAZZCASH/EASYPAISA/USDT conversion logic.
//
// ======================================================

router.get(
  "/admin/deposit",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings
          .findOne()
          .lean();

      // ------------------------------------------------
      // NO SETTINGS DOCUMENT
      // ------------------------------------------------

      if (!settings) {
        return res.status(200).json({
          success: true,

          total: 0,

          methods: [],

          updatedAt: null,
        });
      }

      // ------------------------------------------------
      // LOAD METHODS
      // ------------------------------------------------
      //
      // PART 1 helper:
      //
      // getDepositMethods(settings)
      //
      // It first checks depositMethods[].
      //
      // If depositMethods[] is empty/missing,
      // it falls back to legacy fields.
      //
      // ------------------------------------------------

      const allMethods =
        getDepositMethods(
          settings
        );

      // ------------------------------------------------
      // ADMIN DISPLAY
      // ------------------------------------------------
      //
      // Admin should be able to see disabled methods
      // too, otherwise an OFF method could disappear
      // from the settings page.
      //
      // Therefore:
      //
      // DO NOT filter enabled === false here.
      //
      // ------------------------------------------------

      const methods =
        allMethods.map(
          (method) => ({
            ...method,

            enabled:
              method.enabled !== false,
          })
        );

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        total:
          methods.length,

        methods,

        updatedAt:
          settings.updatedAt ||
          null,
      });
    } catch (error) {
      console.error(
        "GET ADMIN DEPOSIT METHODS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load admin deposit methods.",
      });
    }
  }
);


// ======================================================
// ADMIN PAYMENT SETTINGS DEBUG
// ======================================================
//
// This small diagnostic endpoint is intentionally kept
// separate from /admin/raw.
//
// GET /api/payment-settings/admin/deposit/debug
//
// It helps verify:
//
// 1. MongoDB document exists
// 2. depositMethods[] exists
// 3. number of methods
// 4. methods stored in MongoDB
//
// Admin authentication required.
//
// ======================================================

router.get(
  "/admin/deposit/debug",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings
          .findOne()
          .lean();

      // ------------------------------------------------
      // NO SETTINGS
      // ------------------------------------------------

      if (!settings) {
        return res.status(200).json({
          success: true,

          exists: false,

          depositMethods: [],

          total: 0,
        });
      }

      // ------------------------------------------------
      // RAW NEW V18 ARRAY
      // ------------------------------------------------

      const storedMethods =
        Array.isArray(
          settings.depositMethods
        )
          ? settings.depositMethods
          : [];

      // ------------------------------------------------
      // FORMATTED METHODS
      // ------------------------------------------------

      const formattedMethods =
        getDepositMethods(
          settings
        );

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        exists: true,

        settingsId:
          settings._id || null,

        storedDepositMethods:
          storedMethods,

        storedTotal:
          storedMethods.length,

        formattedMethods,

        formattedTotal:
          formattedMethods.length,

        updatedAt:
          settings.updatedAt ||
          null,
      });
    } catch (error) {
      console.error(
        "GET ADMIN DEPOSIT DEBUG ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to debug payment settings.",
      });
    }
  }
);


// ======================================================
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 3/6
//
// Individual Payment Method APIs
//
// FRONTEND CONTRACT:
//
// PATCH /api/payment-settings/admin/deposit/BANK
// PATCH /api/payment-settings/admin/deposit/JAZZCASH
// PATCH /api/payment-settings/admin/deposit/EASYPAISA
// PATCH /api/payment-settings/admin/deposit/USDT
//
// These routes are kept for compatibility with existing
// admin/frontend integrations.
//
// MAIN V18 bulk save route remains:
//
// PATCH /api/payment-settings/admin/deposit
//
// That route will be provided in PART 4/6.
// ======================================================


// ======================================================
// SAVE JAZZCASH
// ======================================================
//
// PATCH /api/payment-settings/admin/deposit/JAZZCASH
//
// Body:
//
// {
//   accountTitle,
//   accountNumber,
//   qrImage,
//   enabled
// }
// ======================================================

router.patch(
  "/admin/deposit/JAZZCASH",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const body =
        req.body || {};

      // ------------------------------------------------
      // INPUTS
      // ------------------------------------------------

      const accountTitle =
        clean(
          body.accountTitle ||
          body.jazzCashTitle
        );

      const accountNumber =
        clean(
          body.accountNumber ||
          body.jazzCashNumber
        );

      const qrImage =
        clean(
          body.qrImage ||
          body.jazzCashQR
        );

      const enabled =
        boolValue(
          body.enabled,
          true
        );

      // ------------------------------------------------
      // SAVE LEGACY FIELDS
      // ------------------------------------------------

      const settings =
        await PaymentSettings.findOneAndUpdate(
          {},

          {
            $set: {
              jazzCashTitle:
                accountTitle,

              jazzCashNumber:
                accountNumber,

              jazzCashQR:
                qrImage,

              jazzCashEnabled:
                enabled,
            },
          },

          {
            new: true,

            upsert: true,

            setDefaultsOnInsert:
              true,

            runValidators:
              true,
          }
        ).lean();

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          "JazzCash settings saved successfully.",

        method: {
          method:
            "JAZZCASH",

          title:
            "JazzCash",

          enabled:
            settings.jazzCashEnabled === true,

          accountTitle:
            settings.jazzCashTitle || "",

          accountNumber:
            settings.jazzCashNumber || "",

          qrImage:
            settings.jazzCashQR || "",
        },

        settings,
      });
    } catch (error) {
      console.error(
        "SAVE JAZZCASH ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to save JazzCash settings.",
      });
    }
  }
);


// ======================================================
// SAVE EASYPAISA
// ======================================================
//
// PATCH /api/payment-settings/admin/deposit/EASYPAISA
// ======================================================

router.patch(
  "/admin/deposit/EASYPAISA",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const body =
        req.body || {};

      // ------------------------------------------------
      // INPUTS
      // ------------------------------------------------

      const accountTitle =
        clean(
          body.accountTitle ||
          body.easypaisaTitle
        );

      const accountNumber =
        clean(
          body.accountNumber ||
          body.easypaisaNumber
        );

      const qrImage =
        clean(
          body.qrImage ||
          body.easypaisaQR
        );

      const enabled =
        boolValue(
          body.enabled,
          true
        );

      // ------------------------------------------------
      // SAVE
      // ------------------------------------------------

      const settings =
        await PaymentSettings.findOneAndUpdate(
          {},

          {
            $set: {
              easypaisaTitle:
                accountTitle,

              easypaisaNumber:
                accountNumber,

              easypaisaQR:
                qrImage,

              easypaisaEnabled:
                enabled,
            },
          },

          {
            new: true,

            upsert: true,

            setDefaultsOnInsert:
              true,

            runValidators:
              true,
          }
        ).lean();

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          "EasyPaisa settings saved successfully.",

        method: {
          method:
            "EASYPAISA",

          title:
            "EasyPaisa",

          enabled:
            settings.easypaisaEnabled === true,

          accountTitle:
            settings.easypaisaTitle || "",

          accountNumber:
            settings.easypaisaNumber || "",

          qrImage:
            settings.easypaisaQR || "",
        },

        settings,
      });
    } catch (error) {
      console.error(
        "SAVE EASYPAISA ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to save EasyPaisa settings.",
      });
    }
  }
);


// ======================================================
// SAVE BANK
// ======================================================
//
// PATCH /api/payment-settings/admin/deposit/BANK
//
// Body:
//
// {
//   bankName,
//   accountTitle,
//   accountNumber,
//   iban,
//   qrImage,
//   enabled
// }
// ======================================================

router.patch(
  "/admin/deposit/BANK",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const body =
        req.body || {};

      // ------------------------------------------------
      // INPUTS
      // ------------------------------------------------

      const bankName =
        clean(
          body.bankName ||
          body.title
        );

      const accountTitle =
        clean(
          body.accountTitle ||
          body.bankAccountTitle
        );

      const accountNumber =
        clean(
          body.accountNumber ||
          body.bankAccountNumber
        );

      const iban =
        clean(
          body.iban
        ).toUpperCase();

      const qrImage =
        clean(
          body.qrImage ||
          body.bankQR
        );

      const enabled =
        boolValue(
          body.enabled,
          true
        );

      // ------------------------------------------------
      // SAVE
      // ------------------------------------------------

      const settings =
        await PaymentSettings.findOneAndUpdate(
          {},

          {
            $set: {
              bankName:
                bankName,

              bankAccountTitle:
                accountTitle,

              bankAccountNumber:
                accountNumber,

              iban:
                iban,

              bankQR:
                qrImage,

              bankEnabled:
                enabled,
            },
          },

          {
            new: true,

            upsert: true,

            setDefaultsOnInsert:
              true,

            runValidators:
              true,
          }
        ).lean();

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          "Bank settings saved successfully.",

        method: {
          method:
            "BANK",

          title:
            settings.bankName ||
            "Bank Transfer",

          enabled:
            settings.bankEnabled === true,

          bankName:
            settings.bankName || "",

          accountTitle:
            settings.bankAccountTitle || "",

          accountNumber:
            settings.bankAccountNumber || "",

          iban:
            settings.iban || "",

          qrImage:
            settings.bankQR || "",
        },

        settings,
      });
    } catch (error) {
      console.error(
        "SAVE BANK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to save bank settings.",
      });
    }
  }
);


// ======================================================
// SAVE USDT
// ======================================================
//
// PATCH /api/payment-settings/admin/deposit/USDT
//
// Supports:
//
// TRC20
// BEP20
// ERC20
//
// Body example:
//
// {
//   network: "TRC20",
//   walletAddress: "...",
//   qrImage: "...",
//   enabled: true
// }
// ======================================================

router.patch(
  "/admin/deposit/USDT",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const body =
        req.body || {};

      // ------------------------------------------------
      // INPUTS
      // ------------------------------------------------

      const network =
        clean(
          body.network
        ).toUpperCase();

      const walletAddress =
        clean(
          body.walletAddress ||
          body.address
        );

      const trc20 =
        clean(
          body.trc20 ||
          body.usdtTRC20
        );

      const bep20 =
        clean(
          body.bep20 ||
          body.usdtBEP20
        );

      const erc20 =
        clean(
          body.erc20 ||
          body.usdtERC20
        );

      const qrImage =
        clean(
          body.qrImage ||
          body.binanceQR
        );

      const enabled =
        boolValue(
          body.enabled,
          true
        );

      // ------------------------------------------------
      // BUILD UPDATE
      // ------------------------------------------------

      const update = {};

      // ------------------------------------------------
      // TRC20
      // ------------------------------------------------

      if (
        network === "TRC20"
      ) {
        update.usdtTRC20 =
          walletAddress ||
          trc20;
      }

      // ------------------------------------------------
      // BEP20
      // ------------------------------------------------

      if (
        network === "BEP20"
      ) {
        update.usdtBEP20 =
          walletAddress ||
          bep20;
      }

      // ------------------------------------------------
      // ERC20
      // ------------------------------------------------

      if (
        network === "ERC20"
      ) {
        update.usdtERC20 =
          walletAddress ||
          erc20;
      }

      // ------------------------------------------------
      // NO NETWORK
      //
      // Save all explicitly supplied addresses.
      // ------------------------------------------------

      if (!network) {
        if (trc20) {
          update.usdtTRC20 =
            trc20;
        }

        if (bep20) {
          update.usdtBEP20 =
            bep20;
        }

        if (erc20) {
          update.usdtERC20 =
            erc20;
        }
      }

      // ------------------------------------------------
      // SHARED QR
      // ------------------------------------------------

      if (qrImage) {
        update.binanceQR =
          qrImage;
      }

      // ------------------------------------------------
      // MASTER USDT STATUS
      // ------------------------------------------------

      update.usdtEnabled =
        enabled;

      // ------------------------------------------------
      // SAVE
      // ------------------------------------------------

      const settings =
        await PaymentSettings.findOneAndUpdate(
          {},

          {
            $set: update,
          },

          {
            new: true,

            upsert: true,

            setDefaultsOnInsert:
              true,

            runValidators:
              true,
          }
        ).lean();

      // ------------------------------------------------
      // RESPONSE METHODS
      // ------------------------------------------------

      const methods = [];

      // TRC20

      if (
        settings.usdtTRC20
      ) {
        methods.push({
          method:
            "BINANCE",

          title:
            "USDT TRC20",

          enabled:
            settings.usdtEnabled === true,

          walletAddress:
            settings.usdtTRC20,

          network:
            "TRC20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // BEP20

      if (
        settings.usdtBEP20
      ) {
        methods.push({
          method:
            "USDT_BEP20",

          title:
            "USDT BEP20",

          enabled:
            settings.usdtEnabled === true,

          walletAddress:
            settings.usdtBEP20,

          network:
            "BEP20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // ERC20

      if (
        settings.usdtERC20
      ) {
        methods.push({
          method:
            "USDT_ERC20",

          title:
            "USDT ERC20",

          enabled:
            settings.usdtEnabled === true,

          walletAddress:
            settings.usdtERC20,

          network:
            "ERC20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          "USDT settings saved successfully.",

        methods,

        settings,
      });
    } catch (error) {
      console.error(
        "SAVE USDT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to save USDT settings.",
      });
    }
  }
);


// ======================================================
// PART 4/6
// MAIN ADMIN DEPOSIT METHODS SAVE
// PATCH /api/payment-settings/admin/deposit
// ======================================================

router.patch(
  "/admin/deposit",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ==================================================
      // VALIDATE REQUEST BODY
      // ==================================================

      const { depositMethods } = req.body;

      if (!Array.isArray(depositMethods)) {
        return res.status(400).json({
          success: false,
          message: "depositMethods must be an array",
        });
      }

      // ==================================================
      // SAFETY LIMIT
      // ==================================================

      if (depositMethods.length > 20) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum 20 deposit methods are allowed",
        });
      }

      // ==================================================
      // SUPPORTED METHODS
      // ==================================================

      const supportedMethods = new Set([
        "BANK",
        "JAZZCASH",
        "EASYPAISA",
        "BINANCE",
        "USDT_BEP20",
        "USDT_ERC20",
      ]);

      // ==================================================
      // NORMALIZE + VALIDATE METHODS
      // ==================================================

      const normalizedDepositMethods = [];
      const seenMethods = new Set();

      for (const rawMethod of depositMethods) {
        if (
          !rawMethod ||
          typeof rawMethod !== "object"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid deposit method format",
          });
        }

        // ----------------------------------------------
        // METHOD
        // ----------------------------------------------

        const method = normalizeMethod(
          rawMethod.method ||
            rawMethod.type ||
            rawMethod.name
        );

        if (!method) {
          return res.status(400).json({
            success: false,
            message:
              "Deposit method is required",
          });
        }

        // ----------------------------------------------
        // SUPPORTED METHOD CHECK
        // ----------------------------------------------

        if (!supportedMethods.has(method)) {
          return res.status(400).json({
            success: false,
            message:
              `Unsupported deposit method: ${method}`,
          });
        }

        // ----------------------------------------------
        // DUPLICATE METHOD CHECK
        // ----------------------------------------------

        if (seenMethods.has(method)) {
          return res.status(400).json({
            success: false,
            message:
              `Duplicate deposit method: ${method}`,
          });
        }

        seenMethods.add(method);

        // ----------------------------------------------
        // COMMON FIELDS
        // ----------------------------------------------

        const normalized = {
          method,

          title: clean(
            rawMethod.title ||
              rawMethod.name ||
              rawMethod.label
          ),

          enabled: boolValue(
            rawMethod.enabled
          ),

          accountTitle: clean(
            rawMethod.accountTitle
          ),

          accountNumber: clean(
            rawMethod.accountNumber
          ),

          iban: clean(
            rawMethod.iban
          ).toUpperCase(),

          walletAddress: clean(
            rawMethod.walletAddress ||
              rawMethod.address
          ),

          network: clean(
            rawMethod.network
          ).toUpperCase(),

          qrImage: clean(
            rawMethod.qrImage ||
              rawMethod.qr ||
              rawMethod.qrCode
          ),
        };

        // ==================================================
        // BANK
        // ==================================================

        if (method === "BANK") {
          normalized.title = clean(
            rawMethod.title ||
              rawMethod.bankName ||
              "Bank Transfer"
          );

          normalized.accountTitle = clean(
            rawMethod.accountTitle ||
              rawMethod.bankAccountTitle ||
              rawMethod.accountName
          );

          normalized.accountNumber = clean(
            rawMethod.accountNumber ||
              rawMethod.bankAccountNumber
          );

          normalized.iban = clean(
            rawMethod.iban
          ).toUpperCase();

          normalized.qrImage = clean(
            rawMethod.qrImage ||
              rawMethod.bankQR ||
              rawMethod.qr ||
              rawMethod.qrCode
          );
        }

        // ==================================================
        // JAZZCASH
        // ==================================================

        if (method === "JAZZCASH") {
          normalized.title = clean(
            rawMethod.title ||
              rawMethod.jazzCashTitle ||
              "JazzCash"
          );

          normalized.accountTitle = clean(
            rawMethod.accountTitle ||
              rawMethod.jazzCashTitle ||
              rawMethod.accountName
          );

          normalized.accountNumber = clean(
            rawMethod.accountNumber ||
              rawMethod.jazzCashNumber ||
              rawMethod.number
          );

          normalized.qrImage = clean(
            rawMethod.qrImage ||
              rawMethod.jazzCashQR ||
              rawMethod.qr ||
              rawMethod.qrCode
          );
        }

        // ==================================================
        // EASYPAISA
        // ==================================================

        if (method === "EASYPAISA") {
          normalized.title = clean(
            rawMethod.title ||
              rawMethod.easypaisaTitle ||
              "EasyPaisa"
          );

          normalized.accountTitle = clean(
            rawMethod.accountTitle ||
              rawMethod.easypaisaTitle ||
              rawMethod.accountName
          );

          normalized.accountNumber = clean(
            rawMethod.accountNumber ||
              rawMethod.easypaisaNumber ||
              rawMethod.number
          );

          normalized.qrImage = clean(
            rawMethod.qrImage ||
              rawMethod.easypaisaQR ||
              rawMethod.qr ||
              rawMethod.qrCode
          );
        }

        // ==================================================
        // USDT TRC20 / BINANCE
        // ==================================================

        if (method === "BINANCE") {
          normalized.title = clean(
            rawMethod.title ||
              "USDT TRC20"
          );

          normalized.walletAddress = clean(
            rawMethod.walletAddress ||
              rawMethod.usdtTRC20 ||
              rawMethod.address ||
              rawMethod.accountNumber
          );

          normalized.network =
            clean(
              rawMethod.network
            ).toUpperCase() ||
            "TRC20";

          normalized.qrImage = clean(
            rawMethod.qrImage ||
              rawMethod.binanceQR ||
              rawMethod.qr ||
              rawMethod.qrCode
          );
        }

        // ==================================================
        // USDT BEP20
        // ==================================================

        if (method === "USDT_BEP20") {
          normalized.title = clean(
            rawMethod.title ||
              "USDT BEP20"
          );

          normalized.walletAddress = clean(
            rawMethod.walletAddress ||
              rawMethod.usdtBEP20 ||
              rawMethod.address ||
              rawMethod.accountNumber
          );

          normalized.network =
            clean(
              rawMethod.network
            ).toUpperCase() ||
            "BEP20";

          normalized.qrImage = clean(
            rawMethod.qrImage ||
              rawMethod.binanceQR ||
              rawMethod.qr ||
              rawMethod.qrCode
          );
        }

        // ==================================================
        // USDT ERC20
        // ==================================================

        if (method === "USDT_ERC20") {
          normalized.title = clean(
            rawMethod.title ||
              "USDT ERC20"
          );

          normalized.walletAddress = clean(
            rawMethod.walletAddress ||
              rawMethod.usdtERC20 ||
              rawMethod.address ||
              rawMethod.accountNumber
          );

          normalized.network =
            clean(
              rawMethod.network
            ).toUpperCase() ||
            "ERC20";

          normalized.qrImage = clean(
            rawMethod.qrImage ||
              rawMethod.binanceQR ||
              rawMethod.qr ||
              rawMethod.qrCode
          );
        }

        // ==================================================
        // REMOVE EMPTY OPTIONAL VALUES
        // ==================================================

        if (!normalized.title) {
          delete normalized.title;
        }

        if (!normalized.accountTitle) {
          delete normalized.accountTitle;
        }

        if (!normalized.accountNumber) {
          delete normalized.accountNumber;
        }

        if (!normalized.iban) {
          delete normalized.iban;
        }

        if (!normalized.walletAddress) {
          delete normalized.walletAddress;
        }

        if (!normalized.network) {
          delete normalized.network;
        }

        if (!normalized.qrImage) {
          delete normalized.qrImage;
        }

        // ==================================================
        // IMPORTANT
        // DO NOT SAVE FRONTEND _id DIRECTLY
        // Mongoose will create ObjectIds.
        // ==================================================

        normalizedDepositMethods.push(
          normalized
        );
      }

      // ==================================================
      // BUILD LEGACY COMPATIBILITY FIELDS
      // ==================================================
      //
      // IMPORTANT:
      // We build these directly from the normalized
      // V18 depositMethods[].
      //
      // DO NOT call:
      //
      // buildLegacyDepositMethods(
      //   normalizedDepositMethods
      // );
      //
      // because that helper expects a SETTINGS OBJECT,
      // not an ARRAY.
      // ==================================================

      const legacyMethods = {
        // ------------------------------------------------
        // BANK
        // ------------------------------------------------

        bankName: "",
        bankAccountTitle: "",
        bankAccountNumber: "",
        iban: "",
        bankQR: "",
        bankEnabled: false,

        // ------------------------------------------------
        // JAZZCASH
        // ------------------------------------------------

        jazzCashNumber: "",
        jazzCashTitle: "",
        jazzCashQR: "",
        jazzCashEnabled: false,

        // ------------------------------------------------
        // EASYPAISA
        // ------------------------------------------------

        easypaisaNumber: "",
        easypaisaTitle: "",
        easypaisaQR: "",
        easypaisaEnabled: false,

        // ------------------------------------------------
        // USDT
        // ------------------------------------------------

        usdtTRC20: "",
        usdtBEP20: "",
        usdtERC20: "",
        binanceQR: "",
      };

      // ==================================================
      // MAP NORMALIZED METHODS → LEGACY FIELDS
      // ==================================================

      for (const item of normalizedDepositMethods) {
        // ------------------------------------------------
        // BANK
        // ------------------------------------------------

        if (item.method === "BANK") {
          legacyMethods.bankName =
            item.title || "";

          legacyMethods.bankAccountTitle =
            item.accountTitle || "";

          legacyMethods.bankAccountNumber =
            item.accountNumber || "";

          legacyMethods.iban =
            item.iban || "";

          legacyMethods.bankQR =
            item.qrImage || "";

          legacyMethods.bankEnabled =
            item.enabled === true;
        }

        // ------------------------------------------------
        // JAZZCASH
        // ------------------------------------------------

        if (item.method === "JAZZCASH") {
          legacyMethods.jazzCashNumber =
            item.accountNumber || "";

          legacyMethods.jazzCashTitle =
            item.accountTitle ||
            item.title ||
            "";

          legacyMethods.jazzCashQR =
            item.qrImage || "";

          legacyMethods.jazzCashEnabled =
            item.enabled === true;
        }

        // ------------------------------------------------
        // EASYPAISA
        // ------------------------------------------------

        if (item.method === "EASYPAISA") {
          legacyMethods.easypaisaNumber =
            item.accountNumber || "";

          legacyMethods.easypaisaTitle =
            item.accountTitle ||
            item.title ||
            "";

          legacyMethods.easypaisaQR =
            item.qrImage || "";

          legacyMethods.easypaisaEnabled =
            item.enabled === true;
        }

        // ------------------------------------------------
        // USDT TRC20
        // ------------------------------------------------

        if (item.method === "BINANCE") {
          legacyMethods.usdtTRC20 =
            item.walletAddress || "";

          if (item.qrImage) {
            legacyMethods.binanceQR =
              item.qrImage;
          }
        }

        // ------------------------------------------------
        // USDT BEP20
        // ------------------------------------------------

        if (item.method === "USDT_BEP20") {
          legacyMethods.usdtBEP20 =
            item.walletAddress || "";

          if (
            !legacyMethods.binanceQR &&
            item.qrImage
          ) {
            legacyMethods.binanceQR =
              item.qrImage;
          }
        }

        // ------------------------------------------------
        // USDT ERC20
        // ------------------------------------------------

        if (item.method === "USDT_ERC20") {
          legacyMethods.usdtERC20 =
            item.walletAddress || "";

          if (
            !legacyMethods.binanceQR &&
            item.qrImage
          ) {
            legacyMethods.binanceQR =
              item.qrImage;
          }
        }
      }

      // ==================================================
      // USDT MASTER ENABLED FLAG
      // ==================================================
      //
      // TRUE if ANY USDT network is enabled.
      // ==================================================

      const usdtMethods =
        normalizedDepositMethods.filter(
          (item) =>
            item.method === "BINANCE" ||
            item.method === "USDT_BEP20" ||
            item.method === "USDT_ERC20"
        );

      const usdtEnabled =
        usdtMethods.some(
          (item) =>
            item.enabled === true
        );

      // ==================================================
      // UPDATE OBJECT
      // ==================================================

      const update = {
        // ----------------------------------------------
        // V18 SOURCE OF TRUTH
        // ----------------------------------------------

        depositMethods:
          normalizedDepositMethods,

        // ----------------------------------------------
        // LEGACY BANK
        // ----------------------------------------------

        bankName:
          legacyMethods.bankName || "",

        bankAccountTitle:
          legacyMethods.bankAccountTitle || "",

        bankAccountNumber:
          legacyMethods.bankAccountNumber || "",

        iban:
          legacyMethods.iban || "",

        bankQR:
          legacyMethods.bankQR || "",

        bankEnabled:
          legacyMethods.bankEnabled === true,

        // ----------------------------------------------
        // LEGACY JAZZCASH
        // ----------------------------------------------

        jazzCashNumber:
          legacyMethods.jazzCashNumber || "",

        jazzCashTitle:
          legacyMethods.jazzCashTitle || "",

        jazzCashQR:
          legacyMethods.jazzCashQR || "",

        jazzCashEnabled:
          legacyMethods.jazzCashEnabled === true,

        // ----------------------------------------------
        // LEGACY EASYPAISA
        // ----------------------------------------------

        easypaisaNumber:
          legacyMethods.easypaisaNumber || "",

        easypaisaTitle:
          legacyMethods.easypaisaTitle || "",

        easypaisaQR:
          legacyMethods.easypaisaQR || "",

        easypaisaEnabled:
          legacyMethods.easypaisaEnabled === true,

        // ----------------------------------------------
        // LEGACY USDT
        // ----------------------------------------------

        usdtTRC20:
          legacyMethods.usdtTRC20 || "",

        usdtBEP20:
          legacyMethods.usdtBEP20 || "",

        usdtERC20:
          legacyMethods.usdtERC20 || "",

        binanceQR:
          legacyMethods.binanceQR || "",

        usdtEnabled,
      };

      // ==================================================
      // SAVE TO DATABASE
      // ==================================================

      const settings =
        await PaymentSettings.findOneAndUpdate(
          {},
          {
            $set: update,
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
            runValidators: true,
          }
        ).lean();

      // ==================================================
      // FORMAT RESPONSE
      // ==================================================

      const savedMethods =
        getDepositMethods(
          settings
        );

      // ==================================================
      // SUCCESS RESPONSE
      // ==================================================

      return res.status(200).json({
        success: true,

        message:
          "Deposit payment settings saved successfully",

        total:
          savedMethods.length,

        methods:
          savedMethods,

        settings,
      });
    } catch (error) {
      console.error(
        "ADMIN DEPOSIT SETTINGS SAVE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to save deposit payment settings",

        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      });
    }
  }
);
// ======================================================
// PART 5/6
// TOGGLE APIs
// WITHDRAW METHODS
// PUBLIC SETTINGS
// ADMIN DEBUG
// ======================================================


// ======================================================
// TOGGLE JAZZCASH
// PATCH /api/payment-settings/admin/deposit/JAZZCASH/toggle
// ======================================================

router.patch(
  "/admin/deposit/JAZZCASH/toggle",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Payment settings not found.",
        });
      }

      const enabled =
        !Boolean(settings.jazzCashEnabled);

      settings.jazzCashEnabled = enabled;

      // ----------------------------------------------
      // Keep V18 depositMethods synchronized
      // ----------------------------------------------

      if (Array.isArray(settings.depositMethods)) {
        for (const item of settings.depositMethods) {
          if (
            normalizeMethod(item.method) ===
            "JAZZCASH"
          ) {
            item.enabled = enabled;
          }
        }
      }

      await settings.save();

      return res.status(200).json({
        success: true,
        method: "JAZZCASH",
        enabled,
        message:
          "JazzCash status updated successfully.",
      });
    } catch (error) {
      console.error(
        "TOGGLE JAZZCASH ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update JazzCash status.",
      });
    }
  }
);


// ======================================================
// TOGGLE EASYPAISA
// PATCH /api/payment-settings/admin/deposit/EASYPAISA/toggle
// ======================================================

router.patch(
  "/admin/deposit/EASYPAISA/toggle",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Payment settings not found.",
        });
      }

      const enabled =
        !Boolean(settings.easypaisaEnabled);

      settings.easypaisaEnabled = enabled;

      // ----------------------------------------------
      // Keep V18 depositMethods synchronized
      // ----------------------------------------------

      if (Array.isArray(settings.depositMethods)) {
        for (const item of settings.depositMethods) {
          if (
            normalizeMethod(item.method) ===
            "EASYPAISA"
          ) {
            item.enabled = enabled;
          }
        }
      }

      await settings.save();

      return res.status(200).json({
        success: true,
        method: "EASYPAISA",
        enabled,
        message:
          "EasyPaisa status updated successfully.",
      });
    } catch (error) {
      console.error(
        "TOGGLE EASYPAISA ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update EasyPaisa status.",
      });
    }
  }
);


// ======================================================
// TOGGLE BANK
// PATCH /api/payment-settings/admin/deposit/BANK/toggle
// ======================================================

router.patch(
  "/admin/deposit/BANK/toggle",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Payment settings not found.",
        });
      }

      const enabled =
        !Boolean(settings.bankEnabled);

      settings.bankEnabled = enabled;

      // ----------------------------------------------
      // Keep V18 depositMethods synchronized
      // ----------------------------------------------

      if (Array.isArray(settings.depositMethods)) {
        for (const item of settings.depositMethods) {
          if (
            normalizeMethod(item.method) ===
            "BANK"
          ) {
            item.enabled = enabled;
          }
        }
      }

      await settings.save();

      return res.status(200).json({
        success: true,
        method: "BANK",
        enabled,
        message:
          "Bank payment status updated successfully.",
      });
    } catch (error) {
      console.error(
        "TOGGLE BANK ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update bank status.",
      });
    }
  }
);


// ======================================================
// TOGGLE USDT MASTER
// PATCH /api/payment-settings/admin/deposit/USDT/toggle
// ======================================================

router.patch(
  "/admin/deposit/USDT/toggle",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Payment settings not found.",
        });
      }

      const enabled =
        !Boolean(settings.usdtEnabled);

      settings.usdtEnabled = enabled;

      // ----------------------------------------------
      // Keep all USDT V18 methods synchronized
      // ----------------------------------------------

      if (Array.isArray(settings.depositMethods)) {
        for (const item of settings.depositMethods) {
          const method =
            normalizeMethod(item.method);

          if (
            method === "BINANCE" ||
            method === "USDT_BEP20" ||
            method === "USDT_ERC20"
          ) {
            item.enabled = enabled;
          }
        }
      }

      await settings.save();

      return res.status(200).json({
        success: true,
        method: "USDT",
        enabled,
        message:
          "USDT payment status updated successfully.",
      });
    } catch (error) {
      console.error(
        "TOGGLE USDT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update USDT status.",
      });
    }
  }
);


// ======================================================
// EXPLICIT PAYMENT METHOD STATUS
//
// PATCH /api/payment-settings/admin/deposit/status
//
// Body:
// {
//   method: "BANK",
//   enabled: true
// }
// ======================================================

router.patch(
  "/admin/deposit/status",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const method =
        normalizeMethod(
          req.body?.method
        );

      const enabled =
        boolValue(
          req.body?.enabled,
          true
        );

      if (!method) {
        return res.status(400).json({
          success: false,
          message:
            "Payment method is required.",
        });
      }

      const supportedMethods = new Set([
        "BANK",
        "JAZZCASH",
        "EASYPAISA",
        "BINANCE",
        "USDT_BEP20",
        "USDT_ERC20",
      ]);

      if (!supportedMethods.has(method)) {
        return res.status(400).json({
          success: false,
          message:
            `Unsupported payment method: ${method}`,
        });
      }

      // ----------------------------------------------
      // Legacy field
      // ----------------------------------------------

      const legacyFieldMap = {
        BANK: "bankEnabled",
        JAZZCASH: "jazzCashEnabled",
        EASYPAISA: "easypaisaEnabled",
        BINANCE: "usdtEnabled",
        USDT_BEP20: "usdtEnabled",
        USDT_ERC20: "usdtEnabled",
      };

      const update = {
        [legacyFieldMap[method]]: enabled,
      };

      // ----------------------------------------------
      // Update V18 depositMethods
      // ----------------------------------------------

      const settings =
        await PaymentSettings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message:
            "Payment settings not found.",
        });
      }

      if (Array.isArray(settings.depositMethods)) {
        for (const item of settings.depositMethods) {
          const itemMethod =
            normalizeMethod(item.method);

          if (method === itemMethod) {
            item.enabled = enabled;
          }

          // USDT master compatibility
          if (
            method === "BINANCE" ||
            method === "USDT_BEP20" ||
            method === "USDT_ERC20"
          ) {
            if (
              itemMethod === "BINANCE" ||
              itemMethod === "USDT_BEP20" ||
              itemMethod === "USDT_ERC20"
            ) {
              item.enabled = enabled;
            }
          }
        }
      }

      Object.assign(
        settings,
        update
      );

      await settings.save();

      return res.status(200).json({
        success: true,
        method,
        enabled,
        methods:
          getDepositMethods(settings),
        settings,
        message:
          "Payment method status updated successfully.",
      });
    } catch (error) {
      console.error(
        "SET PAYMENT METHOD STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update payment method status.",
      });
    }
  }
);


// ======================================================
// USER WITHDRAW PAYMENT METHODS
//
// GET /api/payment-settings/withdraw
// ======================================================

router.get(
  "/withdraw",
  verifyToken,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne().lean();

      if (!settings) {
        return res.status(200).json({
          success: true,
          total: 0,
          methods: [],
        });
      }

      const methods = [];

      // ==================================================
      // BANK
      // ==================================================

      if (
        settings.bankEnabled === true &&
        (
          settings.bankAccountNumber ||
          settings.iban
        )
      ) {
        methods.push({
          method: "BANK",

          title:
            settings.bankName ||
            "Bank Transfer",

          enabled: true,

          accountTitle:
            settings.bankAccountTitle || "",

          accountNumber:
            settings.bankAccountNumber || "",

          iban:
            settings.iban || "",

          network: "PKR",
        });
      }

      // ==================================================
      // JAZZCASH
      // ==================================================

      if (
        settings.jazzCashEnabled === true &&
        settings.jazzCashNumber
      ) {
        methods.push({
          method: "JAZZCASH",

          title: "JazzCash",

          enabled: true,

          accountTitle:
            settings.jazzCashTitle || "",

          accountNumber:
            settings.jazzCashNumber || "",

          network: "PKR",
        });
      }

      // ==================================================
      // EASYPAISA
      // ==================================================

      if (
        settings.easypaisaEnabled === true &&
        settings.easypaisaNumber
      ) {
        methods.push({
          method: "EASYPAISA",

          title: "EasyPaisa",

          enabled: true,

          accountTitle:
            settings.easypaisaTitle || "",

          accountNumber:
            settings.easypaisaNumber || "",

          network: "PKR",
        });
      }

      // ==================================================
      // USDT TRC20
      // ==================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtTRC20
      ) {
        methods.push({
          method: "BINANCE",

          title: "USDT TRC20",

          enabled: true,

          walletAddress:
            settings.usdtTRC20,

          network: "TRC20",
        });
      }

      // ==================================================
      // USDT BEP20
      // ==================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtBEP20
      ) {
        methods.push({
          method: "USDT_BEP20",

          title: "USDT BEP20",

          enabled: true,

          walletAddress:
            settings.usdtBEP20,

          network: "BEP20",
        });
      }

      // ==================================================
      // USDT ERC20
      // ==================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtERC20
      ) {
        methods.push({
          method: "USDT_ERC20",

          title: "USDT ERC20",

          enabled: true,

          walletAddress:
            settings.usdtERC20,

          network: "ERC20",
        });
      }

      return res.status(200).json({
        success: true,
        total: methods.length,
        methods,
      });
    } catch (error) {
      console.error(
        "WITHDRAW PAYMENT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load withdraw payment settings.",
      });
    }
  }
);


// ======================================================
// PUBLIC PAYMENT SETTINGS
//
// GET /api/payment-settings/public
//
// No JWT required.
// Sensitive account details are NOT returned.
// ======================================================

router.get(
  "/public",
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne().lean();

      if (!settings) {
        return res.status(200).json({
          success: true,
          depositMethods: [],
          updatedAt: null,
        });
      }

      const depositMethods = [];

      // ==================================================
      // BANK
      // ==================================================

      if (
        settings.bankEnabled === true &&
        (
          settings.bankAccountNumber ||
          settings.iban
        )
      ) {
        depositMethods.push({
          method: "BANK",

          title:
            settings.bankName ||
            "Bank Transfer",

          network: "PKR",
        });
      }

      // ==================================================
      // JAZZCASH
      // ==================================================

      if (
        settings.jazzCashEnabled === true &&
        settings.jazzCashNumber
      ) {
        depositMethods.push({
          method: "JAZZCASH",
          title: "JazzCash",
          network: "PKR",
        });
      }

      // ==================================================
      // EASYPAISA
      // ==================================================

      if (
        settings.easypaisaEnabled === true &&
        settings.easypaisaNumber
      ) {
        depositMethods.push({
          method: "EASYPAISA",
          title: "EasyPaisa",
          network: "PKR",
        });
      }

      // ==================================================
      // USDT
      // ==================================================

      if (
        settings.usdtEnabled === true &&
        (
          settings.usdtTRC20 ||
          settings.usdtBEP20 ||
          settings.usdtERC20
        )
      ) {
        depositMethods.push({
          method: "USDT",
          title: "USDT",
          network:
            "TRC20/BEP20/ERC20",
        });
      }

      return res.status(200).json({
        success: true,
        depositMethods,
        updatedAt:
          settings.updatedAt || null,
      });
    } catch (error) {
      console.error(
        "PUBLIC PAYMENT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load public payment settings.",
      });
    }
  }
);


// ======================================================
// ADMIN PAYMENT SETTINGS DEBUG
//
// GET /api/payment-settings/debug
// ======================================================

router.get(
  "/debug",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne().lean();

      const methods =
        settings
          ? getDepositMethods(settings)
          : [];

      return res.status(200).json({
        success: true,

        module:
          "Payment Settings API",

        version:
          "V18 Enterprise",

        databaseConnected:
          true,

        settingsExists:
          Boolean(settings),

        // ----------------------------------------------
        // V18 SOURCE OF TRUTH
        // ----------------------------------------------

        depositMethods:
          settings?.depositMethods || [],

        formattedMethods:
          methods,

        totalMethods:
          methods.length,

        activeMethods:
          methods.filter(
            (item) =>
              item.enabled === true
          ).length,

        // ----------------------------------------------
        // LEGACY STATUS
        // ----------------------------------------------

        bankEnabled:
          settings?.bankEnabled === true,

        jazzCashEnabled:
          settings?.jazzCashEnabled === true,

        easypaisaEnabled:
          settings?.easypaisaEnabled === true,

        usdtEnabled:
          settings?.usdtEnabled === true,

        // ----------------------------------------------
        // TIMESTAMPS
        // ----------------------------------------------

        updatedAt:
          settings?.updatedAt || null,

        serverTime:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "PAYMENT SETTINGS DEBUG ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Payment settings diagnostics failed.",
      });
    }
  }
);
// ======================================================
// PART 6/6 — FINAL
// RESET
// ADMIN SUMMARY
// ROUTER INFO
// FINAL EXPORT
// ======================================================


// ======================================================
// RESET PAYMENT SETTINGS
//
// POST /api/payment-settings/admin/reset
//
// IMPORTANT:
// Ye manual admin reset hai.
// Normal Save button is route ko call nahi karta.
// ======================================================

router.post(
  "/admin/reset",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOneAndUpdate(
          {},

          {
            $set: {
              // ------------------------------------------
              // V18 SOURCE OF TRUTH
              // ------------------------------------------

              depositMethods: [],

              // ------------------------------------------
              // BANK
              // ------------------------------------------

              bankName: "",
              bankAccountTitle: "",
              bankAccountNumber: "",
              iban: "",
              bankQR: "",
              bankEnabled: false,

              // ------------------------------------------
              // JAZZCASH
              // ------------------------------------------

              jazzCashNumber: "",
              jazzCashTitle: "",
              jazzCashQR: "",
              jazzCashEnabled: false,

              // ------------------------------------------
              // EASYPAISA
              // ------------------------------------------

              easypaisaNumber: "",
              easypaisaTitle: "",
              easypaisaQR: "",
              easypaisaEnabled: false,

              // ------------------------------------------
              // USDT
              // ------------------------------------------

              usdtTRC20: "",
              usdtBEP20: "",
              usdtERC20: "",
              binanceQR: "",
              usdtEnabled: false,
            },
          },

          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
            runValidators: true,
          }
        ).lean();

      return res.status(200).json({
        success: true,

        message:
          "Payment settings reset successfully.",

        total: 0,

        methods: [],

        settings,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "RESET PAYMENT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to reset payment settings.",
      });
    }
  }
);


// ======================================================
// ADMIN PAYMENT SETTINGS SUMMARY
//
// GET /api/payment-settings/admin/summary
//
// Lightweight endpoint for admin dashboard/cards.
// ======================================================

router.get(
  "/admin/summary",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne().lean();

      // ----------------------------------------------
      // NO SETTINGS
      // ----------------------------------------------

      if (!settings) {
        return res.status(200).json({
          success: true,

          totalMethods: 0,

          activeMethods: 0,

          inactiveMethods: 0,

          methods: [],
        });
      }

      // ----------------------------------------------
      // V18 SOURCE OF TRUTH
      // ----------------------------------------------

      const methods =
        getDepositMethods(settings);

      // ----------------------------------------------
      // ACTIVE METHODS
      // ----------------------------------------------

      const activeMethods =
        methods.filter(
          (item) =>
            item.enabled === true
        );

      return res.status(200).json({
        success: true,

        totalMethods:
          methods.length,

        activeMethods:
          activeMethods.length,

        inactiveMethods:
          methods.length -
          activeMethods.length,

        methods,

        updatedAt:
          settings.updatedAt || null,
      });
    } catch (error) {
      console.error(
        "GET PAYMENT SETTINGS SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load payment settings summary.",
      });
    }
  }
);


// ======================================================
// API ROUTE INFORMATION
//
// GET /api/payment-settings
//
// Simple endpoint to confirm router is mounted.
// ======================================================

router.get(
  "/",
  (req, res) => {
    return res.status(200).json({
      success: true,

      module:
        "GoldTrade V18 Payment Settings API",

      version:
        "V18 Enterprise",

      status:
        "ONLINE",

      endpoints: {
        health:
          "GET /api/payment-settings/health",

        userDeposit:
          "GET /api/payment-settings/deposit",

        userWithdraw:
          "GET /api/payment-settings/withdraw",

        public:
          "GET /api/payment-settings/public",

        adminAll:
          "GET /api/payment-settings/admin/all",

        adminRaw:
          "GET /api/payment-settings/admin/raw",

        adminDeposit:
          "GET /api/payment-settings/admin/deposit",

        adminDebug:
          "GET /api/payment-settings/admin/deposit/debug",

        adminSave:
          "PATCH /api/payment-settings/admin/deposit",

        adminStatus:
          "PATCH /api/payment-settings/admin/deposit/status",

        adminSummary:
          "GET /api/payment-settings/admin/summary",

        adminReset:
          "POST /api/payment-settings/admin/reset",

        debug:
          "GET /api/payment-settings/debug",
      },

      timestamp:
        new Date().toISOString(),
    });
  }
);


// ======================================================
// FINAL ROUTER EXPORT
//
// IMPORTANT:
// Ye file ki LAST LINE honi chahiye.
// Iske neeche kuch bhi nahi.
// ======================================================

module.exports = router;