const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const PaymentSettings = require("../models/PaymentSettings");
const { verifyToken } = require("../middleware/authMiddleware");

// ======================================================
// ADMIN MIDDLEWARE
// ======================================================

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }
  next();
};

// ======================================================
// QR CODE UPLOAD
// uploads/payment/
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/payment/");
  },

  filename: (req, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1000000);

    cb(
      null,
      "payment-" + unique + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ======================================================
// GET PAYMENT SETTINGS
// GET /api/admin/payment-settings
// ======================================================

router.get("/", async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne({ active: true });

    if (!settings) {
      settings = await PaymentSettings.create({});
    }

    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to load payment settings.",
    });
  }
});

// ======================================================
// UPDATE PAYMENT SETTINGS
// PUT /api/admin/payment-settings
// ======================================================

router.put(
  "/",
  verifyToken,
  adminOnly,
  upload.fields([
    { name: "bankQR", maxCount: 1 },
    { name: "easyPaisaQR", maxCount: 1 },
    { name: "nayaPayQR", maxCount: 1 },
    { name: "usdtQR", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      let settings = await PaymentSettings.findOne({ active: true });

      if (!settings) {
        settings = new PaymentSettings();
      }

      // USDT Rates
      settings.usdtBuyRate = req.body.usdtBuyRate;
      settings.usdtSellRate = req.body.usdtSellRate;

      // Bank
      settings.bank.bankName = req.body.bankName;
      settings.bank.accountTitle = req.body.bankTitle;
      settings.bank.accountNumber = req.body.bankAccount;
      settings.bank.iban = req.body.bankIBAN;

      // EasyPaisa
      settings.easyPaisa.accountTitle = req.body.easyTitle;
      settings.easyPaisa.mobileNumber = req.body.easyNumber;

      // NayaPay
      settings.nayaPay.accountTitle = req.body.nayaTitle;
      settings.nayaPay.mobileNumber = req.body.nayaNumber;

      // USDT Wallet
      settings.usdtWallet.network = req.body.network;
      settings.usdtWallet.walletAddress = req.body.walletAddress;

      // QR Uploads
      if (req.files.bankQR) {
        settings.bank.qrCode =
          "/uploads/payment/" + req.files.bankQR[0].filename;
      }

      if (req.files.easyPaisaQR) {
        settings.easyPaisa.qrCode =
          "/uploads/payment/" + req.files.easyPaisaQR[0].filename;
      }

      if (req.files.nayaPayQR) {
        settings.nayaPay.qrCode =
          "/uploads/payment/" + req.files.nayaPayQR[0].filename;
      }

      if (req.files.usdtQR) {
        settings.usdtWallet.qrCode =
          "/uploads/payment/" + req.files.usdtQR[0].filename;
      }

      settings.updatedBy = req.user._id;

      await settings.save();

      res.json({
        success: true,
        message: "Payment settings updated successfully.",
        settings,
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Unable to update payment settings.",
      });
    }
  }
);

module.exports = router;