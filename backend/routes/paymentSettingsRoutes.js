/* ==========================================================
   GoldTrade V18 Enterprise
   Payment Settings Routes (PART 1/4)
   Render + Vercel + MongoDB Compatible
========================================================== */

"use strict";

const express = require("express");
const router = express.Router();

const PaymentSettings = require("../models/PaymentSettings");
const { verifyToken, isAdmin } = require("../middleware/auth");

/* ==========================================================
   DEFAULT PAYMENT SETTINGS
========================================================== */

const defaultSettings = {
  // JazzCash
  jazzCashNumber: "",
  jazzCashTitle: "",

  // Easypaisa
  easypaisaNumber: "",
  easypaisaTitle: "",

  // Bank
  bankName: "",
  bankAccountTitle: "",
  bankAccountNumber: "",
  iban: "",

  // USDT Wallets
  usdtTRC20: "",
  usdtBEP20: "",
  usdtERC20: "",

  // Gold Wallet
  goldWalletAddress: "",
  goldWalletTitle: "",

  // QR Images
  jazzCashQR: "",
  easypaisaQR: "",
  binanceQR: "",

  // Enable / Disable Switches
  jazzCashEnabled: true,
  easypaisaEnabled: true,
  bankEnabled: true,
  usdtEnabled: true,
  goldEnabled: true,
};

/* ==========================================================
   HEALTH CHECK
   GET /api/payment-settings/health
========================================================== */

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Payment Settings",
    version: "GoldTrade V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

/* ==========================================================
   PUBLIC PAYMENT SETTINGS
   GET /api/payment-settings
   Used by Wallet Deposit Page
========================================================== */

router.get("/", async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne().lean();

    if (!settings) {
      const created = await PaymentSettings.create(defaultSettings);
      settings = created.toObject();
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("PUBLIC PAYMENT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load payment settings.",
      error: error.message,
    });
  }
});

/* ==========================================================
   ADMIN PAYMENT SETTINGS
   GET /api/payment-settings/admin
========================================================== */

router.get("/admin", verifyToken, isAdmin, async (req, res) => {
  try {
    console.log("ADMIN PAYMENT SETTINGS FETCH");
    console.log("USER:", req.user.username);
    console.log("ROLE:", req.user.role);

    let settings = await PaymentSettings.findOne().lean();

    if (!settings) {
      const created = await PaymentSettings.create(defaultSettings);
      settings = created.toObject();
    }

    return res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("ADMIN PAYMENT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin payment settings.",
      error: error.message,
    });
  }
});

router.put("/", verifyToken, isAdmin, async (req, res) => {
  try {
    console.log("====================================");
    console.log("PAYMENT SETTINGS SAVE REQUEST");
    console.log("USER:", req.user?.username);
    console.log("ROLE:", req.user?.role);
    console.log("BODY:", req.body);
    console.log("====================================");

    let settings = await PaymentSettings.findOne();

    if (!settings) {
      settings = new PaymentSettings(defaultSettings);
    }

    Object.assign(settings, req.body);
    settings.updatedAt = new Date();

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Payment settings updated successfully.",
      settings,
    });

  } catch (error) {
    console.error("Payment Settings UPDATE Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update payment settings.",
      error: error.message,
    });
  }
});

/* ==========================================================
   UPDATE QR IMAGE URLS
   PUT /api/payment-settings/qr
   Admin Only
========================================================== */

router.put("/qr", verifyToken, isAdmin, async (req, res) => {
  try {
    console.log("========== PAYMENT QR UPDATE ==========");
    console.log("USER :", req.user.username);
    console.log("ROLE :", req.user.role);

    let settings = await PaymentSettings.findOne();

    if (!settings) {
      settings = new PaymentSettings(defaultSettings);
    }

    settings.jazzCashQR =
      req.body.jazzCashQR ?? settings.jazzCashQR;

    settings.easypaisaQR =
      req.body.easypaisaQR ?? settings.easypaisaQR;

    settings.binanceQR =
      req.body.binanceQR ?? settings.binanceQR;

    settings.updatedAt = new Date();

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "QR images updated successfully.",
      settings,
    });

  } catch (error) {
    console.error("PAYMENT QR UPDATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update QR images.",
      error: error.message,
    });
  }
});

/* ==========================================================
   RESET PAYMENT SETTINGS
   DELETE /api/payment-settings/reset
   Admin Only
========================================================== */

router.delete("/reset", verifyToken, isAdmin, async (req, res) => {
  try {
    console.log("========== RESET PAYMENT SETTINGS ==========");
    console.log("USER :", req.user.username);
    console.log("ROLE :", req.user.role);

    await PaymentSettings.deleteMany({});

    const settings = await PaymentSettings.create(defaultSettings);

    return res.status(200).json({
      success: true,
      message: "Payment settings reset successfully.",
      settings,
    });

  } catch (error) {
    console.error("PAYMENT SETTINGS RESET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset payment settings.",
      error: error.message,
    });
  }
});

/* ==========================================================
   DEBUG ROUTE (Production Testing)
   GET /api/payment-settings/debug
========================================================== */

router.get("/debug", async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne();

    return res.status(200).json({
      success: true,
      exists: !!settings,
      settings,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* ==========================================================
   GOLDTRADE V18 ENTERPRISE
   FINAL ROUTES + EXPORT
========================================================== */

/* ==========================================================
   ADMIN AUTH TEST
   GET /api/payment-settings/auth-check
========================================================== */

router.get("/auth-check", verifyToken, isAdmin, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Admin authentication successful.",
      admin: {
        username: req.user.username,
        role: req.user.role,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("PAYMENT SETTINGS AUTH CHECK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Authentication check failed.",
      error: error.message,
    });
  }
});

/* ==========================================================
   DATABASE STATUS
   GET /api/payment-settings/status
========================================================== */

router.get("/status", async (req, res) => {
  try {
    const count = await PaymentSettings.countDocuments();
    const settings = await PaymentSettings.findOne().lean();

    return res.status(200).json({
      success: true,
      databaseConnected: true,
      totalDocuments: count,
      settingsExists: !!settings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("PAYMENT SETTINGS STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      databaseConnected: false,
      message: error.message,
    });
  }
});

/* ==========================================================
   ROUTE NOT FOUND
========================================================== */

router.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Payment Settings API Not Found: ${req.method} ${req.originalUrl}`,
  });
});

/* ==========================================================
   EXPORT ROUTER (ONLY ONCE - LAST LINE)
========================================================== */

module.exports = router;