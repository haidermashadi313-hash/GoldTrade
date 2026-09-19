"use strict";

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Models
const PaymentSettings = require("../models/PaymentSettings");

// Middleware
const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// MULTER STORAGE
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/payment/");
  },

  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1000000);

    cb(null, "payment-" + unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// ======================================================
// GET PAYMENT SETTINGS
// GET /api/payment-settings
// ======================================================

router.get("/", async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne({ active: true });

    if (!settings) {
      settings = await PaymentSettings.create({ active: true });
    }

    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error("GET PAYMENT SETTINGS ERROR:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load payment settings.",
    });
  }
});

// ======================================================
// UPDATE PAYMENT SETTINGS
// PUT /api/payment-settings
// ======================================================

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

      // USDT Rates
      settings.UsdtbuyRate = Number(req.body.UsdtbuyRate || 0);
      settings.UsdtsellRate = Number(req.body.UsdtsellRate || 0);

      // Bank
      settings.bank.bankName = req.body.bankName || "";
      settings.bank.accountTitle = req.body.bankTitle || "";
      settings.bank.accountNumber = req.body.bankAccount || "";
      settings.bank.iban = req.body.bankIBAN || "";

      // EasyPaisa
      settings.easyPaisa.accountTitle = req.body.easyTitle || "";
      settings.easyPaisa.mobileNumber = req.body.easyNumber || "";

      // NayaPay
      settings.nayaPay.accountTitle = req.body.nayaTitle || "";
      settings.nayaPay.mobileNumber = req.body.nayaNumber || "";

      // USDT Wallet
      settings.Usdtwallet.network = req.body.network || "";
      settings.Usdtwallet.walletAddress = req.body.walletAddress || "";

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

      settings.updatedBy = req.user._id;

      await settings.save();

      res.json({
        success: true,
        message: "Payment settings updated successfully.",
        settings,
      });
    } catch (err) {
      console.error("UPDATE PAYMENT SETTINGS ERROR:", err);

      res.status(500).json({
        success: false,
        message: "Unable to update payment settings.",
      });
    }
  }
);

// ======================================================
// HEALTH CHECK
// ======================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Payment Settings Routes Working - GoldTrade V18",
  });
});

module.exports = router;