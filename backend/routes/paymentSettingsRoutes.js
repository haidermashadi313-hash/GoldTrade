/*
========================================================
 GoldTrade V18 Enterprise
 Payment Settings Routes (PART 1/3)
 Linux + Render + Vercel Compatible
========================================================
*/

"use strict";

const express = require("express");
const router = express.Router();

// =============================
// MODELS
// =============================
const PaymentSettings = require("../models/PaymentSettings");

// =============================
// MIDDLEWARE
// =============================
const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// GET PAYMENT SETTINGS
// GET /api/payment-settings
// ======================================================

router.get("/", async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne().lean();

    // Auto create first settings document
    if (!settings) {
      settings = await PaymentSettings.create({});
      settings = settings.toObject();
    }

    return res.status(200).json({
      success: true,
      settings,
    });

  } catch (error) {
    console.error("PAYMENT SETTINGS LOAD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load payment settings.",
      error: error.message,
    });
  }
});

// ======================================================
// ADMIN HEALTH CHECK
// GET /api/payment-settings/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Payment Settings",
    version: "GoldTrade V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// ADMIN GET SETTINGS
// GET /api/payment-settings/admin
// Admin Only
// ======================================================

router.get(
  "/admin",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      let settings = await PaymentSettings.findOne().lean();

      if (!settings) {
        settings = await PaymentSettings.create({});
        settings = settings.toObject();
      }

      return res.status(200).json({
        success: true,
        settings,
      });

    } catch (error) {
      console.error("ADMIN PAYMENT SETTINGS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load admin payment settings.",
        error: error.message,
      });
    }
  }
);
// ======================================================
// UPDATE PAYMENT SETTINGS
// PUT /api/payment-settings
// Admin Only
// ======================================================

router.put("/", verifyToken, isAdmin, async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne();

    if (!settings) {
      settings = new PaymentSettings();
    }

    // =============================
    // PKR PAYMENT METHODS
    // =============================

    settings.jazzCashNumber =
      req.body.jazzCashNumber?.trim() || "";

    settings.jazzCashTitle =
      req.body.jazzCashTitle?.trim() || "";

    settings.easypaisaNumber =
      req.body.easypaisaNumber?.trim() || "";

    settings.easypaisaTitle =
      req.body.easypaisaTitle?.trim() || "";

    settings.bankName =
      req.body.bankName?.trim() || "";

    settings.bankAccountTitle =
      req.body.bankAccountTitle?.trim() || "";

    settings.bankAccountNumber =
      req.body.bankAccountNumber?.trim() || "";

    settings.iban =
      req.body.iban?.trim() || "";

    // =============================
    // USDT WALLETS
    // =============================

    settings.usdtTRC20 =
      req.body.usdtTRC20?.trim() || "";

    settings.usdtBEP20 =
      req.body.usdtBEP20?.trim() || "";

    settings.usdtERC20 =
      req.body.usdtERC20?.trim() || "";

    // =============================
    // GOLD WALLET
    // =============================

    settings.goldWalletAddress =
      req.body.goldWalletAddress?.trim() || "";

    settings.goldWalletTitle =
      req.body.goldWalletTitle?.trim() || "";

    // =============================
    // ENABLE / DISABLE METHODS
    // =============================

    settings.jazzCashEnabled =
      req.body.jazzCashEnabled ?? true;

    settings.easypaisaEnabled =
      req.body.easypaisaEnabled ?? true;

    settings.bankEnabled =
      req.body.bankEnabled ?? true;

    settings.usdtEnabled =
      req.body.usdtEnabled ?? true;

    settings.goldEnabled =
      req.body.goldEnabled ?? true;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Payment settings updated successfully.",
      settings,
    });

  } catch (error) {
    console.error("PAYMENT SETTINGS UPDATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update payment settings.",
      error: error.message,
    });
  }
});
// ======================================================
// UPDATE QR IMAGES
// PUT /api/payment-settings/qr
// Admin Only
// ======================================================

router.put("/qr", verifyToken, isAdmin, async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne();

    if (!settings) {
      settings = new PaymentSettings();
    }

    // QR Image URLs (Cloudinary / Render uploads)
    if (req.body.jazzCashQR !== undefined) {
      settings.jazzCashQR = req.body.jazzCashQR;
    }

    if (req.body.easypaisaQR !== undefined) {
      settings.easypaisaQR = req.body.easypaisaQR;
    }

    if (req.body.binanceQR !== undefined) {
      settings.binanceQR = req.body.binanceQR;
    }

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

// ======================================================
// RESET PAYMENT SETTINGS
// DELETE /api/payment-settings/reset
// Admin Only
// ======================================================

router.delete("/reset", verifyToken, isAdmin, async (req, res) => {
  try {
    await PaymentSettings.deleteMany({});

    const settings = await PaymentSettings.create({});

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

// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;