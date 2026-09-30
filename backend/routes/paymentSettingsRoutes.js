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
// HEALTH CHECK
// ======================================================
//
// GET /api/payment-settings/health
//
// No authentication required.
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Payment Settings API",
    version: "V18 Enterprise",
    status: "ONLINE",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// USER DEPOSIT PAYMENT METHODS
// ======================================================
//
// GET /api/payment-settings/deposit
//
// Used by:
// frontend/app/deposit/page.tsx
//
// IMPORTANT:
// Only enabled payment methods are returned.
// ======================================================

router.get(
  "/deposit",
  verifyToken,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne().lean();

      // ------------------------------------------------
      // No settings document
      // ------------------------------------------------

      if (!settings) {
        return res.status(200).json({
          success: true,
          total: 0,
          methods: [],
          updatedAt: null,
        });
      }

      const methods = [];

      // =================================================
      // BANK
      // =================================================

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
          _id: `BANK_${settings._id}`,

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

      // =================================================
      // JAZZCASH
      // =================================================

      if (
        settings.jazzCashEnabled === true &&
        (
          settings.jazzCashNumber ||
          settings.jazzCashTitle
        )
      ) {
        methods.push({
          _id: `JAZZCASH_${settings._id}`,

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

      // =================================================
      // EASYPAISA
      // =================================================

      if (
        settings.easypaisaEnabled === true &&
        (
          settings.easypaisaNumber ||
          settings.easypaisaTitle
        )
      ) {
        methods.push({
          _id: `EASYPAISA_${settings._id}`,

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

      // =================================================
      // USDT TRC20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtTRC20
      ) {
        methods.push({
          _id: `BINANCE_${settings._id}`,

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

      // =================================================
      // USDT BEP20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtBEP20
      ) {
        methods.push({
          _id: `USDT_BEP20_${settings._id}`,

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

      // =================================================
      // USDT ERC20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtERC20
      ) {
        methods.push({
          _id: `USDT_ERC20_${settings._id}`,

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

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        total: methods.length,

        methods,

        updatedAt:
          settings.updatedAt || null,
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
// ======================================================

router.get(
  "/method/:method",
  verifyToken,
  async (req, res) => {
    try {
      const methodName =
        normalizeMethod(req.params.method);

      const settings =
        await PaymentSettings.findOne().lean();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message:
            "Payment settings not found.",
        });
      }

      let method = null;

      // =================================================
      // BANK
      // =================================================

      if (methodName === "BANK") {
        method = {
          _id: `BANK_${settings._id}`,

          method: "BANK",

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

          walletAddress: "",

          network: "",

          qrImage:
            settings.bankQR || "",
        };
      }

      // =================================================
      // JAZZCASH
      // =================================================

      if (methodName === "JAZZCASH") {
        method = {
          _id: `JAZZCASH_${settings._id}`,

          method: "JAZZCASH",

          title: "JazzCash",

          enabled:
            settings.jazzCashEnabled === true,

          accountTitle:
            settings.jazzCashTitle || "",

          accountNumber:
            settings.jazzCashNumber || "",

          iban: "",

          walletAddress: "",

          network: "",

          qrImage:
            settings.jazzCashQR || "",
        };
      }

      // =================================================
      // EASYPAISA
      // =================================================

      if (methodName === "EASYPAISA") {
        method = {
          _id: `EASYPAISA_${settings._id}`,

          method: "EASYPAISA",

          title: "EasyPaisa",

          enabled:
            settings.easypaisaEnabled === true,

          accountTitle:
            settings.easypaisaTitle || "",

          accountNumber:
            settings.easypaisaNumber || "",

          iban: "",

          walletAddress: "",

          network: "",

          qrImage:
            settings.easypaisaQR || "",
        };
      }

      // =================================================
      // BINANCE / USDT TRC20
      // =================================================

      if (methodName === "BINANCE") {
        method = {
          _id: `BINANCE_${settings._id}`,

          method: "BINANCE",

          title: "USDT TRC20",

          enabled:
            settings.usdtEnabled === true,

          accountTitle: "",

          accountNumber: "",

          iban: "",

          walletAddress:
            settings.usdtTRC20 || "",

          network: "TRC20",

          qrImage:
            settings.binanceQR || "",
        };
      }

      // =================================================
      // USDT BEP20
      // =================================================

      if (methodName === "USDT_BEP20") {
        method = {
          _id: `USDT_BEP20_${settings._id}`,

          method: "USDT_BEP20",

          title: "USDT BEP20",

          enabled:
            settings.usdtEnabled === true,

          accountTitle: "",

          accountNumber: "",

          iban: "",

          walletAddress:
            settings.usdtBEP20 || "",

          network: "BEP20",

          qrImage:
            settings.binanceQR || "",
        };
      }

      // =================================================
      // USDT ERC20
      // =================================================

      if (methodName === "USDT_ERC20") {
        method = {
          _id: `USDT_ERC20_${settings._id}`,

          method: "USDT_ERC20",

          title: "USDT ERC20",

          enabled:
            settings.usdtEnabled === true,

          accountTitle: "",

          accountNumber: "",

          iban: "",

          walletAddress:
            settings.usdtERC20 || "",

          network: "ERC20",

          qrImage:
            settings.binanceQR || "",
        };
      }

      // =================================================
      // NOT FOUND
      // =================================================

      if (!method) {
        return res.status(404).json({
          success: false,
          message:
            "Payment method not found.",
        });
      }

      // =================================================
      // RESPONSE
      // =================================================

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
// PATCH /api/payment-settings/admin/deposit
// ======================================================


// ======================================================
// GET COMPLETE PAYMENT SETTINGS
// ======================================================
//
// GET /api/payment-settings/admin/all
//
// Used by:
// frontend/app/admin/payment-settings/page.tsx
//
// Returns the complete MongoDB PaymentSettings document.
// ======================================================

router.get(
  "/admin/all",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      let settings =
        await PaymentSettings.findOne().lean();

      // ------------------------------------------------
      // Create settings document if none exists
      // ------------------------------------------------

      if (!settings) {
        const created =
          await PaymentSettings.create({});

        settings =
          created.toObject();
      }

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
// ======================================================

router.get(
  "/admin/raw",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne().lean();

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
// Returns the same payment-method structure that the
// Admin frontend can directly display.
//
// IMPORTANT:
// This reads the SAME MongoDB fields that the save route
// below writes.
// ======================================================

router.get(
  "/admin/deposit",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne().lean();

      // ------------------------------------------------
      // No settings
      // ------------------------------------------------

      if (!settings) {
        return res.status(200).json({
          success: true,

          total: 0,

          methods: [],
        });
      }

      const methods = [];

      // =================================================
      // BANK
      // =================================================

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

          method:
            "BANK",

          title:
            settings.bankName ||
            "Bank Transfer",

          enabled:
            true,

          bankName:
            settings.bankName || "",

          accountTitle:
            settings.bankAccountTitle || "",

          accountNumber:
            settings.bankAccountNumber || "",

          iban:
            settings.iban || "",

          walletAddress:
            "",

          network:
            "",

          qrImage:
            settings.bankQR || "",
        });
      }

      // =================================================
      // JAZZCASH
      // =================================================

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

          method:
            "JAZZCASH",

          title:
            "JazzCash",

          enabled:
            true,

          accountTitle:
            settings.jazzCashTitle || "",

          accountNumber:
            settings.jazzCashNumber || "",

          iban:
            "",

          walletAddress:
            "",

          network:
            "",

          qrImage:
            settings.jazzCashQR || "",
        });
      }

      // =================================================
      // EASYPAISA
      // =================================================

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

          method:
            "EASYPAISA",

          title:
            "EasyPaisa",

          enabled:
            true,

          accountTitle:
            settings.easypaisaTitle || "",

          accountNumber:
            settings.easypaisaNumber || "",

          iban:
            "",

          walletAddress:
            "",

          network:
            "",

          qrImage:
            settings.easypaisaQR || "",
        });
      }

      // =================================================
      // USDT TRC20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtTRC20
      ) {
        methods.push({
          _id:
            `BINANCE_${settings._id}`,

          method:
            "BINANCE",

          title:
            "USDT TRC20",

          enabled:
            true,

          accountTitle:
            "",

          accountNumber:
            "",

          iban:
            "",

          walletAddress:
            settings.usdtTRC20,

          network:
            "TRC20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // =================================================
      // USDT BEP20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtBEP20
      ) {
        methods.push({
          _id:
            `USDT_BEP20_${settings._id}`,

          method:
            "USDT_BEP20",

          title:
            "USDT BEP20",

          enabled:
            true,

          accountTitle:
            "",

          accountNumber:
            "",

          iban:
            "",

          walletAddress:
            settings.usdtBEP20,

          network:
            "BEP20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // =================================================
      // USDT ERC20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtERC20
      ) {
        methods.push({
          _id:
            `USDT_ERC20_${settings._id}`,

          method:
            "USDT_ERC20",

          title:
            "USDT ERC20",

          enabled:
            true,

          accountTitle:
            "",

          accountNumber:
            "",

          iban:
            "",

          walletAddress:
            settings.usdtERC20,

          network:
            "ERC20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        total:
          methods.length,

        methods,
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
// MAIN ADMIN SAVE
// ======================================================
//
// PATCH /api/payment-settings/admin/deposit
//
// THIS IS THE IMPORTANT ROUTE.
//
// Frontend sends:
//
// {
//   depositMethods: [
//     {
//       method,
//       title,
//       enabled,
//       accountTitle,
//       accountNumber,
//       iban,
//       walletAddress,
//       network,
//       qrImage
//     }
//   ]
// }
//
// We convert that structure into the existing
// PaymentSettings MongoDB model.
// ======================================================

router.patch(
  "/admin/deposit",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      // ------------------------------------------------
      // REQUEST BODY
      // ------------------------------------------------

      const body =
        req.body || {};

      const depositMethods =
        Array.isArray(
          body.depositMethods
        )
          ? body.depositMethods
          : null;

      // ------------------------------------------------
      // VALIDATION
      // ------------------------------------------------

      if (!depositMethods) {
        return res.status(400).json({
          success: false,

          message:
            "depositMethods must be an array.",
        });
      }

      // ------------------------------------------------
      // MAX METHODS
      // ------------------------------------------------

      if (
        depositMethods.length > 20
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Maximum 20 payment methods are allowed.",
        });
      }

      // ------------------------------------------------
      // LOAD EXISTING SETTINGS
      // ------------------------------------------------

      const existing =
        await PaymentSettings.findOne().lean();

      // ------------------------------------------------
      // START WITH SAFE VALUES
      //
      // IMPORTANT:
      // Methods that are removed from Admin UI should
      // NOT remain active from old MongoDB values.
      // ------------------------------------------------

      const update = {
        // ----------------------------------------------
        // BANK
        // ----------------------------------------------

        bankName:
          "",

        bankAccountTitle:
          "",

        bankAccountNumber:
          "",

        iban:
          "",

        bankQR:
          "",

        bankEnabled:
          false,

        // ----------------------------------------------
        // JAZZCASH
        // ----------------------------------------------

        jazzCashNumber:
          "",

        jazzCashTitle:
          "",

        jazzCashQR:
          "",

        jazzCashEnabled:
          false,

        // ----------------------------------------------
        // EASYPAISA
        // ----------------------------------------------

        easypaisaNumber:
          "",

        easypaisaTitle:
          "",

        easypaisaQR:
          "",

        easypaisaEnabled:
          false,

        // ----------------------------------------------
        // USDT
        // ----------------------------------------------

        usdtTRC20:
          "",

        usdtBEP20:
          "",

        usdtERC20:
          "",

        binanceQR:
          "",

        usdtEnabled:
          false,
      };

      // =================================================
      // PROCESS FRONTEND METHODS
      // =================================================

      for (
        const item of depositMethods
      ) {
        if (
          !item ||
          typeof item !== "object"
        ) {
          continue;
        }

        const method =
          normalizeMethod(
            item.method ||
            item.type ||
            ""
          );

        const enabled =
          boolValue(
            item.enabled,
            true
          );

        const title =
          clean(
            item.title
          );

        const accountTitle =
          clean(
            item.accountTitle ||
            item.accountName
          );

        const accountNumber =
          clean(
            item.accountNumber
          );

        const iban =
          clean(
            item.iban
          ).toUpperCase();

        const walletAddress =
          clean(
            item.walletAddress
          );

        const network =
          clean(
            item.network
          ).toUpperCase();

        const qrImage =
          clean(
            item.qrImage ||
            item.qrCode
          );

        // =================================================
        // BANK
        // =================================================

        if (
          method === "BANK"
        ) {
          update.bankName =
            clean(
              item.bankName
            ) ||
            title ||
            "Bank Transfer";

          update.bankAccountTitle =
            accountTitle;

          update.bankAccountNumber =
            accountNumber;

          update.iban =
            iban;

          update.bankQR =
            qrImage;

          update.bankEnabled =
            enabled;

          continue;
        }

        // =================================================
        // JAZZCASH
        // =================================================

        if (
          method === "JAZZCASH"
        ) {
          update.jazzCashTitle =
            accountTitle ||
            title ||
            "JazzCash";

          update.jazzCashNumber =
            accountNumber;

          update.jazzCashQR =
            qrImage;

          update.jazzCashEnabled =
            enabled;

          continue;
        }

        // =================================================
        // EASYPAISA
        // =================================================

        if (
          method === "EASYPAISA"
        ) {
          update.easypaisaTitle =
            accountTitle ||
            title ||
            "EasyPaisa";

          update.easypaisaNumber =
            accountNumber;

          update.easypaisaQR =
            qrImage;

          update.easypaisaEnabled =
            enabled;

          continue;
        }

        // =================================================
        // BINANCE / USDT TRC20
        // =================================================

        if (
          method === "BINANCE"
        ) {
          update.usdtTRC20 =
            walletAddress ||
            accountNumber;

          update.binanceQR =
            qrImage;

          update.usdtEnabled =
            enabled;

          continue;
        }

        // =================================================
        // USDT BEP20
        // =================================================

        if (
          method === "USDT_BEP20"
        ) {
          update.usdtBEP20 =
            walletAddress ||
            accountNumber;

          // ----------------------------------------------
          // QR is shared between USDT networks.
          // ----------------------------------------------

          if (qrImage) {
            update.binanceQR =
              qrImage;
          }

          update.usdtEnabled =
            enabled;

          continue;
        }

        // =================================================
        // USDT ERC20
        // =================================================

        if (
          method === "USDT_ERC20"
        ) {
          update.usdtERC20 =
            walletAddress ||
            accountNumber;

          if (qrImage) {
            update.binanceQR =
              qrImage;
          }

          update.usdtEnabled =
            enabled;

          continue;
        }
      }

      // =================================================
      // PRESERVE UNRELATED SETTINGS
      // =================================================
      //
      // We only modify payment-method fields here.
      // Gold wallet and other settings remain untouched.
      // =================================================

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

      // =================================================
      // BUILD SAVED METHODS FOR RESPONSE
      // =================================================

      const savedMethods = [];

      // -------------------------------------------------
      // BANK
      // -------------------------------------------------

      if (
        settings.bankEnabled === true &&
        (
          settings.bankName ||
          settings.bankAccountTitle ||
          settings.bankAccountNumber ||
          settings.iban
        )
      ) {
        savedMethods.push({
          _id:
            `BANK_${settings._id}`,

          method:
            "BANK",

          title:
            settings.bankName ||
            "Bank Transfer",

          enabled:
            true,

          bankName:
            settings.bankName || "",

          accountTitle:
            settings.bankAccountTitle || "",

          accountNumber:
            settings.bankAccountNumber || "",

          iban:
            settings.iban || "",

          walletAddress:
            "",

          network:
            "",

          qrImage:
            settings.bankQR || "",
        });
      }

      // -------------------------------------------------
      // JAZZCASH
      // -------------------------------------------------

      if (
        settings.jazzCashEnabled === true &&
        (
          settings.jazzCashNumber ||
          settings.jazzCashTitle
        )
      ) {
        savedMethods.push({
          _id:
            `JAZZCASH_${settings._id}`,

          method:
            "JAZZCASH",

          title:
            "JazzCash",

          enabled:
            true,

          accountTitle:
            settings.jazzCashTitle || "",

          accountNumber:
            settings.jazzCashNumber || "",

          iban:
            "",

          walletAddress:
            "",

          network:
            "",

          qrImage:
            settings.jazzCashQR || "",
        });
      }

      // -------------------------------------------------
      // EASYPAISA
      // -------------------------------------------------

      if (
        settings.easypaisaEnabled === true &&
        (
          settings.easypaisaNumber ||
          settings.easypaisaTitle
        )
      ) {
        savedMethods.push({
          _id:
            `EASYPAISA_${settings._id}`,

          method:
            "EASYPAISA",

          title:
            "EasyPaisa",

          enabled:
            true,

          accountTitle:
            settings.easypaisaTitle || "",

          accountNumber:
            settings.easypaisaNumber || "",

          iban:
            "",

          walletAddress:
            "",

          network:
            "",

          qrImage:
            settings.easypaisaQR || "",
        });
      }

      // -------------------------------------------------
      // USDT TRC20
      // -------------------------------------------------

      if (
        settings.usdtEnabled === true &&
        settings.usdtTRC20
      ) {
        savedMethods.push({
          _id:
            `BINANCE_${settings._id}`,

          method:
            "BINANCE",

          title:
            "USDT TRC20",

          enabled:
            true,

          accountTitle:
            "",

          accountNumber:
            "",

          iban:
            "",

          walletAddress:
            settings.usdtTRC20,

          network:
            "TRC20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // -------------------------------------------------
      // USDT BEP20
      // -------------------------------------------------

      if (
        settings.usdtEnabled === true &&
        settings.usdtBEP20
      ) {
        savedMethods.push({
          _id:
            `USDT_BEP20_${settings._id}`,

          method:
            "USDT_BEP20",

          title:
            "USDT BEP20",

          enabled:
            true,

          accountTitle:
            "",

          accountNumber:
            "",

          iban:
            "",

          walletAddress:
            settings.usdtBEP20,

          network:
            "BEP20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // -------------------------------------------------
      // USDT ERC20
      // -------------------------------------------------

      if (
        settings.usdtEnabled === true &&
        settings.usdtERC20
      ) {
        savedMethods.push({
          _id:
            `USDT_ERC20_${settings._id}`,

          method:
            "USDT_ERC20",

          title:
            "USDT ERC20",

          enabled:
            true,

          accountTitle:
            "",

          accountNumber:
            "",

          iban:
            "",

          walletAddress:
            settings.usdtERC20,

          network:
            "ERC20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // =================================================
      // SUCCESS RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        message:
          "Deposit payment methods saved successfully.",

        total:
          savedMethods.length,

        methods:
          savedMethods,

        settings,

        timestamp:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "PATCH ADMIN DEPOSIT PAYMENT METHODS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to save deposit payment methods.",

        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
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
// ======================================================


// ======================================================
// NORMALIZE PAYMENT METHOD
// ======================================================
//
// Converts different frontend names into one standard
// backend method name.
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
  const method = String(
    value || ""
  )
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
// Body examples:
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

      const network =
        clean(
          body.network
        ).toUpperCase();

      const walletAddress =
        clean(
          body.walletAddress
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

      const update = {};

      // ------------------------------------------------
      // Explicit TRC20
      // ------------------------------------------------

      if (
        network === "TRC20"
      ) {
        update.usdtTRC20 =
          walletAddress ||
          trc20;
      }

      // ------------------------------------------------
      // Explicit BEP20
      // ------------------------------------------------

      if (
        network === "BEP20"
      ) {
        update.usdtBEP20 =
          walletAddress ||
          bep20;
      }

      // ------------------------------------------------
      // Explicit ERC20
      // ------------------------------------------------

      if (
        network === "ERC20"
      ) {
        update.usdtERC20 =
          walletAddress ||
          erc20;
      }

      // ------------------------------------------------
      // If network is not provided, save supplied fields
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
      // QR + master USDT status
      // ------------------------------------------------

      if (qrImage) {
        update.binanceQR =
          qrImage;
      }

      update.usdtEnabled =
        enabled;

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

      return res.status(200).json({
        success: true,

        message:
          "USDT settings saved successfully.",

        methods: [
          {
            method:
              "BINANCE",

            title:
              "USDT TRC20",

            enabled:
              settings.usdtEnabled === true,

            walletAddress:
              settings.usdtTRC20 || "",

            network:
              "TRC20",

            qrImage:
              settings.binanceQR || "",
          },

          {
            method:
              "USDT_BEP20",

            title:
              "USDT BEP20",

            enabled:
              settings.usdtEnabled === true,

            walletAddress:
              settings.usdtBEP20 || "",

            network:
              "BEP20",

            qrImage:
              settings.binanceQR || "",
          },

          {
            method:
              "USDT_ERC20",

            title:
              "USDT ERC20",

            enabled:
              settings.usdtEnabled === true,

            walletAddress:
              settings.usdtERC20 || "",

            network:
              "ERC20",

            qrImage:
              settings.binanceQR || "",
          },
        ].filter(
          (item) =>
            Boolean(
              item.walletAddress
            )
        ),

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
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 4/6
//
// Individual Method Read + Toggle APIs
// ======================================================


// ======================================================
// GET SINGLE PAYMENT METHOD
// ======================================================
//
// GET /api/payment-settings/method/:method
//
// Supported:
//
// BANK
// JAZZCASH
// EASYPAISA
// BINANCE
// USDT
// USDT_TRC20
// USDT_BEP20
// USDT_ERC20
// ======================================================

router.get(
  "/method/:method",
  verifyToken,
  async (req, res) => {
    try {
      const methodName =
        normalizeMethod(
          req.params.method
        );

      const settings =
        await PaymentSettings.findOne().lean();

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

      let method = null;

      // =================================================
      // BANK
      // =================================================

      if (
        methodName === "BANK"
      ) {
        method = {
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
        };
      }

      // =================================================
      // JAZZCASH
      // =================================================

      if (
        methodName === "JAZZCASH"
      ) {
        method = {
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

          iban:
            "",

          walletAddress:
            "",

          network:
            "",

          qrImage:
            settings.jazzCashQR || "",
        };
      }

      // =================================================
      // EASYPAISA
      // =================================================

      if (
        methodName === "EASYPAISA"
      ) {
        method = {
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

          iban:
            "",

          walletAddress:
            "",

          network:
            "",

          qrImage:
            settings.easypaisaQR || "",
        };
      }

      // =================================================
      // USDT TRC20 / BINANCE
      // =================================================

      if (
        methodName === "BINANCE"
      ) {
        method = {
          method:
            "BINANCE",

          title:
            "USDT TRC20",

          enabled:
            settings.usdtEnabled === true,

          accountTitle:
            "",

          accountNumber:
            "",

          walletAddress:
            settings.usdtTRC20 || "",

          network:
            "TRC20",

          qrImage:
            settings.binanceQR || "",
        };
      }

      // =================================================
      // USDT BEP20
      // =================================================

      if (
        methodName === "USDT_BEP20"
      ) {
        method = {
          method:
            "USDT_BEP20",

          title:
            "USDT BEP20",

          enabled:
            settings.usdtEnabled === true,

          accountTitle:
            "",

          accountNumber:
            "",

          walletAddress:
            settings.usdtBEP20 || "",

          network:
            "BEP20",

          qrImage:
            settings.binanceQR || "",
        };
      }

      // =================================================
      // USDT ERC20
      // =================================================

      if (
        methodName === "USDT_ERC20"
      ) {
        method = {
          method:
            "USDT_ERC20",

          title:
            "USDT ERC20",

          enabled:
            settings.usdtEnabled === true,

          accountTitle:
            "",

          accountNumber:
            "",

          walletAddress:
            settings.usdtERC20 || "",

          network:
            "ERC20",

          qrImage:
            settings.binanceQR || "",
        };
      }

      // =================================================
      // METHOD NOT FOUND
      // =================================================

      if (!method) {
        return res.status(404).json({
          success: false,

          message:
            "Payment method not found.",
        });
      }

      // =================================================
      // RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        method,

        timestamp:
          new Date().toISOString(),
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
// TOGGLE JAZZCASH
// ======================================================
//
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

          message:
            "Payment settings not found.",
        });
      }

      settings.jazzCashEnabled =
        !Boolean(
          settings.jazzCashEnabled
        );

      await settings.save();

      return res.status(200).json({
        success: true,

        method:
          "JAZZCASH",

        enabled:
          settings.jazzCashEnabled,

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
// ======================================================
//
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

          message:
            "Payment settings not found.",
        });
      }

      settings.easypaisaEnabled =
        !Boolean(
          settings.easypaisaEnabled
        );

      await settings.save();

      return res.status(200).json({
        success: true,

        method:
          "EASYPAISA",

        enabled:
          settings.easypaisaEnabled,

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
// ======================================================
//
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

          message:
            "Payment settings not found.",
        });
      }

      settings.bankEnabled =
        !Boolean(
          settings.bankEnabled
        );

      await settings.save();

      return res.status(200).json({
        success: true,

        method:
          "BANK",

        enabled:
          settings.bankEnabled,

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
// TOGGLE USDT
// ======================================================
//
// PATCH /api/payment-settings/admin/deposit/USDT/toggle
//
// This controls the master USDT switch.
//
// TRC20 / BEP20 / ERC20 all follow this status.
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

          message:
            "Payment settings not found.",
        });
      }

      settings.usdtEnabled =
        !Boolean(
          settings.usdtEnabled
        );

      await settings.save();

      return res.status(200).json({
        success: true,

        method:
          "USDT",

        enabled:
          settings.usdtEnabled,

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
// EXPLICIT SET STATUS
// ======================================================
//
// PATCH /api/payment-settings/admin/deposit/status
//
// Optional endpoint for frontend.
//
// Body:
//
// {
//   method: "BANK",
//   enabled: true
// }
//
// Unlike toggle, this explicitly sets the desired state.
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

      const fieldMap = {
        BANK:
          "bankEnabled",

        JAZZCASH:
          "jazzCashEnabled",

        EASYPAISA:
          "easypaisaEnabled",

        BINANCE:
          "usdtEnabled",

        USDT_BEP20:
          "usdtEnabled",

        USDT_ERC20:
          "usdtEnabled",
      };

      const field =
        fieldMap[method];

      if (!field) {
        return res.status(400).json({
          success: false,

          message:
            `Unsupported payment method: ${method}`,
        });
      }

      const settings =
        await PaymentSettings.findOneAndUpdate(
          {},

          {
            $set: {
              [field]:
                enabled,
            },
          },

          {
            new: true,

            upsert: true,

            setDefaultsOnInsert:
              true,
          }
        ).lean();

      return res.status(200).json({
        success: true,

        method,

        enabled,

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
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 5/6
//
// User Deposit Final API
// Withdraw API
// Public API
// Diagnostics
// ======================================================


// ======================================================
// USER DEPOSIT METHODS
// ======================================================
//
// GET /api/payment-settings/deposit
//
// IMPORTANT:
// Ye endpoint USER frontend ka source of truth hai.
//
// Sirf enabled methods return honge.
//
// MongoDB fields:
//
// BANK
// JAZZCASH
// EASYPAISA
// USDT TRC20
// USDT BEP20
// USDT ERC20
// ======================================================

router.get(
  "/deposit",
  verifyToken,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne().lean();

      // ------------------------------------------------
      // No settings document
      // ------------------------------------------------

      if (!settings) {
        return res.status(200).json({
          success: true,
          total: 0,
          methods: [],
          updatedAt: null,
        });
      }

      const methods = [];

      // =================================================
      // BANK
      // =================================================

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

          method:
            "BANK",

          title:
            settings.bankName ||
            "Bank Transfer",

          enabled:
            true,

          bankName:
            settings.bankName || "",

          accountTitle:
            settings.bankAccountTitle || "",

          accountNumber:
            settings.bankAccountNumber || "",

          iban:
            settings.iban || "",

          walletAddress:
            "",

          network:
            "",

          qrImage:
            settings.bankQR || "",
        });
      }

      // =================================================
      // JAZZCASH
      // =================================================

      if (
        settings.jazzCashEnabled === true &&
        (
          settings.jazzCashTitle ||
          settings.jazzCashNumber
        )
      ) {
        methods.push({
          _id:
            `JAZZCASH_${settings._id}`,

          method:
            "JAZZCASH",

          title:
            "JazzCash",

          enabled:
            true,

          accountTitle:
            settings.jazzCashTitle || "",

          accountNumber:
            settings.jazzCashNumber || "",

          iban:
            "",

          walletAddress:
            "",

          network:
            "",

          qrImage:
            settings.jazzCashQR || "",
        });
      }

      // =================================================
      // EASYPAISA
      // =================================================

      if (
        settings.easypaisaEnabled === true &&
        (
          settings.easypaisaTitle ||
          settings.easypaisaNumber
        )
      ) {
        methods.push({
          _id:
            `EASYPAISA_${settings._id}`,

          method:
            "EASYPAISA",

          title:
            "EasyPaisa",

          enabled:
            true,

          accountTitle:
            settings.easypaisaTitle || "",

          accountNumber:
            settings.easypaisaNumber || "",

          iban:
            "",

          walletAddress:
            "",

          network:
            "",

          qrImage:
            settings.easypaisaQR || "",
        });
      }

      // =================================================
      // USDT TRC20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        clean(
          settings.usdtTRC20
        )
      ) {
        methods.push({
          _id:
            `BINANCE_${settings._id}`,

          method:
            "BINANCE",

          title:
            "USDT TRC20",

          enabled:
            true,

          accountTitle:
            "",

          accountNumber:
            "",

          iban:
            "",

          walletAddress:
            settings.usdtTRC20,

          network:
            "TRC20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // =================================================
      // USDT BEP20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        clean(
          settings.usdtBEP20
        )
      ) {
        methods.push({
          _id:
            `USDT_BEP20_${settings._id}`,

          method:
            "USDT_BEP20",

          title:
            "USDT BEP20",

          enabled:
            true,

          accountTitle:
            "",

          accountNumber:
            "",

          iban:
            "",

          walletAddress:
            settings.usdtBEP20,

          network:
            "BEP20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // =================================================
      // USDT ERC20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        clean(
          settings.usdtERC20
        )
      ) {
        methods.push({
          _id:
            `USDT_ERC20_${settings._id}`,

          method:
            "USDT_ERC20",

          title:
            "USDT ERC20",

          enabled:
            true,

          accountTitle:
            "",

          accountNumber:
            "",

          iban:
            "",

          walletAddress:
            settings.usdtERC20,

          network:
            "ERC20",

          qrImage:
            settings.binanceQR || "",
        });
      }

      // =================================================
      // FINAL RESPONSE
      // =================================================

      return res.status(200).json({
        success: true,

        total:
          methods.length,

        methods,

        updatedAt:
          settings.updatedAt || null,
      });
    } catch (error) {
      console.error(
        "USER DEPOSIT METHODS ERROR:",
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
// WITHDRAW PAYMENT METHODS
// ======================================================
//
// GET /api/payment-settings/withdraw
//
// User Withdraw page can use this endpoint.
//
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

      // =================================================
      // BANK
      // =================================================

      if (
        settings.bankEnabled === true &&
        (
          settings.bankAccountNumber ||
          settings.iban
        )
      ) {
        methods.push({
          method:
            "BANK",

          title:
            settings.bankName ||
            "Bank Transfer",

          enabled:
            true,

          accountTitle:
            settings.bankAccountTitle || "",

          accountNumber:
            settings.bankAccountNumber || "",

          iban:
            settings.iban || "",

          network:
            "PKR",
        });
      }

      // =================================================
      // JAZZCASH
      // =================================================

      if (
        settings.jazzCashEnabled === true &&
        settings.jazzCashNumber
      ) {
        methods.push({
          method:
            "JAZZCASH",

          title:
            "JazzCash",

          enabled:
            true,

          accountTitle:
            settings.jazzCashTitle || "",

          accountNumber:
            settings.jazzCashNumber || "",

          network:
            "PKR",
        });
      }

      // =================================================
      // EASYPAISA
      // =================================================

      if (
        settings.easypaisaEnabled === true &&
        settings.easypaisaNumber
      ) {
        methods.push({
          method:
            "EASYPAISA",

          title:
            "EasyPaisa",

          enabled:
            true,

          accountTitle:
            settings.easypaisaTitle || "",

          accountNumber:
            settings.easypaisaNumber || "",

          network:
            "PKR",
        });
      }

      // =================================================
      // USDT TRC20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtTRC20
      ) {
        methods.push({
          method:
            "BINANCE",

          title:
            "USDT TRC20",

          enabled:
            true,

          walletAddress:
            settings.usdtTRC20,

          network:
            "TRC20",
        });
      }

      // =================================================
      // USDT BEP20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtBEP20
      ) {
        methods.push({
          method:
            "USDT_BEP20",

          title:
            "USDT BEP20",

          enabled:
            true,

          walletAddress:
            settings.usdtBEP20,

          network:
            "BEP20",
        });
      }

      // =================================================
      // USDT ERC20
      // =================================================

      if (
        settings.usdtEnabled === true &&
        settings.usdtERC20
      ) {
        methods.push({
          method:
            "USDT_ERC20",

          title:
            "USDT ERC20",

          enabled:
            true,

          walletAddress:
            settings.usdtERC20,

          network:
            "ERC20",
        });
      }

      return res.status(200).json({
        success: true,

        total:
          methods.length,

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
// ======================================================
//
// GET /api/payment-settings/public
//
// No JWT required.
//
// IMPORTANT:
// Sensitive account numbers/wallet addresses are NOT
// returned here.
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

          updatedAt:
            null,
        });
      }

      const depositMethods = [];

      // =================================================
      // BANK
      // =================================================

      if (
        settings.bankEnabled === true &&
        (
          settings.bankAccountNumber ||
          settings.iban
        )
      ) {
        depositMethods.push({
          method:
            "BANK",

          title:
            settings.bankName ||
            "Bank Transfer",

          network:
            "PKR",
        });
      }

      // =================================================
      // JAZZCASH
      // =================================================

      if (
        settings.jazzCashEnabled === true &&
        settings.jazzCashNumber
      ) {
        depositMethods.push({
          method:
            "JAZZCASH",

          title:
            "JazzCash",

          network:
            "PKR",
        });
      }

      // =================================================
      // EASYPAISA
      // =================================================

      if (
        settings.easypaisaEnabled === true &&
        settings.easypaisaNumber
      ) {
        depositMethods.push({
          method:
            "EASYPAISA",

          title:
            "EasyPaisa",

          network:
            "PKR",
        });
      }

      // =================================================
      // USDT
      // =================================================

      if (
        settings.usdtEnabled === true &&
        (
          settings.usdtTRC20 ||
          settings.usdtBEP20 ||
          settings.usdtERC20
        )
      ) {
        depositMethods.push({
          method:
            "USDT",

          title:
            "USDT",

          network:
            "TRC20/BEP20/ERC20",
        });
      }

      return res.status(200).json({
        success: true,

        depositMethods,

        updatedAt:
          settings.updatedAt ||
          null,
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
// ======================================================
//
// GET /api/payment-settings/debug
//
// Admin only.
//
// Use this after deployment to verify MongoDB data.
// ======================================================

router.get(
  "/debug",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await PaymentSettings.findOne().lean();

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
        // BANK
        // ----------------------------------------------

        hasBank:
          Boolean(
            settings?.bankName ||
            settings?.bankAccountNumber ||
            settings?.iban
          ),

        bankEnabled:
          settings?.bankEnabled === true,

        // ----------------------------------------------
        // JAZZCASH
        // ----------------------------------------------

        hasJazzCash:
          Boolean(
            settings?.jazzCashNumber ||
            settings?.jazzCashTitle
          ),

        jazzCashEnabled:
          settings?.jazzCashEnabled === true,

        // ----------------------------------------------
        // EASYPAISA
        // ----------------------------------------------

        hasEasyPaisa:
          Boolean(
            settings?.easypaisaNumber ||
            settings?.easypaisaTitle
          ),

        easypaisaEnabled:
          settings?.easypaisaEnabled === true,

        // ----------------------------------------------
        // USDT
        // ----------------------------------------------

        hasUSDTTRC20:
          Boolean(
            settings?.usdtTRC20
          ),

        hasUSDTBEP20:
          Boolean(
            settings?.usdtBEP20
          ),

        hasUSDTERC20:
          Boolean(
            settings?.usdtERC20
          ),

        usdtEnabled:
          settings?.usdtEnabled === true,

        // ----------------------------------------------
        // TIMESTAMP
        // ----------------------------------------------

        updatedAt:
          settings?.updatedAt ||
          null,

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
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 6/6 — FINAL
//
// Reset + Final Safety + Router Export
// ======================================================


// ======================================================
// RESET PAYMENT SETTINGS
// ======================================================
//
// POST /api/payment-settings/admin/reset
//
// IMPORTANT:
// Ye sirf admin ke manual reset ke liye hai.
//
// Is route ko normal Save button se call nahi kiya jata.
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
              // BANK
              // ------------------------------------------

              bankName:
                "",

              bankAccountTitle:
                "",

              bankAccountNumber:
                "",

              iban:
                "",

              bankQR:
                "",

              bankEnabled:
                false,

              // ------------------------------------------
              // JAZZCASH
              // ------------------------------------------

              jazzCashNumber:
                "",

              jazzCashTitle:
                "",

              jazzCashQR:
                "",

              jazzCashEnabled:
                false,

              // ------------------------------------------
              // EASYPAISA
              // ------------------------------------------

              easypaisaNumber:
                "",

              easypaisaTitle:
                "",

              easypaisaQR:
                "",

              easypaisaEnabled:
                false,

              // ------------------------------------------
              // USDT
              // ------------------------------------------

              usdtTRC20:
                "",

              usdtBEP20:
                "",

              usdtERC20:
                "",

              binanceQR:
                "",

              usdtEnabled:
                false,
            },
          },

          {
            new:
              true,

            upsert:
              true,

            setDefaultsOnInsert:
              true,

            runValidators:
              true,
          }
        ).lean();

      return res.status(200).json({
        success:
          true,

        message:
          "Payment settings reset successfully.",

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
        success:
          false,

        message:
          "Unable to reset payment settings.",
      });
    }
  }
);


// ======================================================
// ADMIN PAYMENT SETTINGS SUMMARY
// ======================================================
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

      if (!settings) {
        return res.status(200).json({
          success:
            true,

          totalMethods:
            0,

          activeMethods:
            0,

          methods: [],
        });
      }

      const methods = [];

      // ------------------------------------------------
      // BANK
      // ------------------------------------------------

      if (
        settings.bankName ||
        settings.bankAccountNumber ||
        settings.iban
      ) {
        methods.push({
          method:
            "BANK",

          title:
            settings.bankName ||
            "Bank Transfer",

          enabled:
            settings.bankEnabled === true,
        });
      }

      // ------------------------------------------------
      // JAZZCASH
      // ------------------------------------------------

      if (
        settings.jazzCashNumber ||
        settings.jazzCashTitle
      ) {
        methods.push({
          method:
            "JAZZCASH",

          title:
            "JazzCash",

          enabled:
            settings.jazzCashEnabled === true,
        });
      }

      // ------------------------------------------------
      // EASYPAISA
      // ------------------------------------------------

      if (
        settings.easypaisaNumber ||
        settings.easypaisaTitle
      ) {
        methods.push({
          method:
            "EASYPAISA",

          title:
            "EasyPaisa",

          enabled:
            settings.easypaisaEnabled === true,
        });
      }

      // ------------------------------------------------
      // TRC20
      // ------------------------------------------------

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
        });
      }

      // ------------------------------------------------
      // BEP20
      // ------------------------------------------------

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
        });
      }

      // ------------------------------------------------
      // ERC20
      // ------------------------------------------------

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
        });
      }

      const activeMethods =
        methods.filter(
          (item) =>
            item.enabled === true
        );

      return res.status(200).json({
        success:
          true,

        totalMethods:
          methods.length,

        activeMethods:
          activeMethods.length,

        inactiveMethods:
          methods.length -
          activeMethods.length,

        methods,

        updatedAt:
          settings.updatedAt ||
          null,
      });
    } catch (error) {
      console.error(
        "GET PAYMENT SETTINGS SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success:
          false,

        message:
          "Unable to load payment settings summary.",
      });
    }
  }
);


// ======================================================
// API ROUTE INFORMATION
// ======================================================
//
// GET /api/payment-settings
//
// Simple endpoint to confirm that the router is mounted.
// ======================================================

router.get(
  "/",
  (req, res) => {
    return res.status(200).json({
      success:
        true,

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

        adminDeposit:
          "GET /api/payment-settings/admin/deposit",

        adminSave:
          "PATCH /api/payment-settings/admin/deposit",

        adminDebug:
          "GET /api/payment-settings/debug",
      },

      timestamp:
        new Date().toISOString(),
    });
  }
);


// ======================================================
// FINAL ROUTER EXPORT
// ======================================================
//
// IMPORTANT:
// Ye line file ke bilkul end mein honi chahiye.
// ======================================================

module.exports =
  router;