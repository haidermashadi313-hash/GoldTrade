"use strict";

// =======================================================
// GoldTrade V18 - Payment Settings Routes
// Linux + Render Compatible
// =======================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =======================================================
// MODEL
// =======================================================

const PaymentSettings = require("../models/PaymentSettings");

// =======================================================
// MIDDLEWARE
// =======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =======================================================
// UPLOAD DIRECTORY (AUTO CREATE)
// =======================================================

const uploadDir = path.join(__dirname, "../uploads/payment");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =======================================================
// MULTER STORAGE
// =======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),

  filename: (req, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1000000);

    cb(null, `payment-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// =======================================================
// HEALTH CHECK
// GET /api/payment-settings/health
// =======================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Payment Settings API Working - GoldTrade V18",
    version: "V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// GET PAYMENT SETTINGS
// GET /api/payment-settings
// =======================================================

router.get("/", async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne({ active: true }).lean();

    if (!settings) {
      settings = await PaymentSettings.create({
        active: true,
        UsdtbuyRate: 280,
        UsdtsellRate: 278,

        bank: {},
        easyPaisa: {},
        nayaPay: {},
        Usdtwallet: {},
      });

      settings = settings.toObject();
    }

    return res.json({
      success: true,
      settings,
    });

  } catch (err) {
    console.error("GET PAYMENT SETTINGS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Unable to load payment settings.",
      error: err.message,
    });
  }
});

// =======================================================
// UPDATE PAYMENT SETTINGS (ADMIN)
// PUT /api/payment-settings
// =======================================================

router.put(
  "/",
  verifyToken,
  isAdmin,
  upload.fields([
    { name: "bankQR", maxCount: 1 },
    { name: "easyPaisaQR", maxCount: 1 },
    { name: "nayaPayQR", maxCount: 1 },
    { name: "UsdtQR", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      let settings = await PaymentSettings.findOne({ active: true });

      if (!settings) {
        settings = new PaymentSettings({ active: true });
      }

      // Ensure nested objects exist
      settings.bank = settings.bank || {};
      settings.easyPaisa = settings.easyPaisa || {};
      settings.nayaPay = settings.nayaPay || {};
      settings.Usdtwallet = settings.Usdtwallet || {};

      // USDT Rates
      if (req.body.UsdtbuyRate !== undefined)
        settings.UsdtbuyRate = Number(req.body.UsdtbuyRate);

      if (req.body.UsdtsellRate !== undefined)
        settings.UsdtsellRate = Number(req.body.UsdtsellRate);

      // Bank
      settings.bank.bankName = req.body.bankName || settings.bank.bankName;
      settings.bank.accountTitle =
        req.body.bankTitle || settings.bank.accountTitle;
      settings.bank.accountNumber =
        req.body.bankAccount || settings.bank.accountNumber;
      settings.bank.iban = req.body.bankIBAN || settings.bank.iban;

      // EasyPaisa
      settings.easyPaisa.accountTitle =
        req.body.easyTitle || settings.easyPaisa.accountTitle;
      settings.easyPaisa.mobileNumber =
        req.body.easyNumber || settings.easyPaisa.mobileNumber;

      // NayaPay
      settings.nayaPay.accountTitle =
        req.body.nayaTitle || settings.nayaPay.accountTitle;
      settings.nayaPay.mobileNumber =
        req.body.nayaNumber || settings.nayaPay.mobileNumber;

      // USDT Wallet
      settings.Usdtwallet.network =
        req.body.network || settings.Usdtwallet.network;
      settings.Usdtwallet.walletAddress =
        req.body.walletAddress || settings.Usdtwallet.walletAddress;

      // QR Uploads
      if (req.files?.bankQR?.length) {
        settings.bank.qrCode =
          "/uploads/payment/" + req.files.bankQR[0].filename;
      }

      if (req.files?.easyPaisaQR?.length) {
        settings.easyPaisa.qrCode =
          "/uploads/payment/" + req.files.easyPaisaQR[0].filename;
      }

      if (req.files?.nayaPayQR?.length) {
        settings.nayaPay.qrCode =
          "/uploads/payment/" + req.files.nayaPayQR[0].filename;
      }

      if (req.files?.UsdtQR?.length) {
        settings.Usdtwallet.qrCode =
          "/uploads/payment/" + req.files.UsdtQR[0].filename;
      }

      settings.updatedBy = req.user.id;

      await settings.save();

      return res.json({
        success: true,
        message: "Payment settings updated successfully.",
        settings,
      });

    } catch (err) {
      console.error("UPDATE PAYMENT SETTINGS ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Unable to update payment settings.",
        error: err.message,
      });
    }
  }
);

// =======================================================
// EXPORT ROUTER
// =======================================================

module.exports = router;