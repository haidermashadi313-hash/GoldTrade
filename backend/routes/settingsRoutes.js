const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Settings = require("../models/Settings");

// ===============================================
// Upload Folder
// ===============================================
const uploadFolder = path.join(__dirname, "../uploads/settings");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder, { recursive: true });
}

// ===============================================
// Multer Storage
// ===============================================
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadFolder);
  },

  filename(req, file, cb) {
    cb(
      null,
      `trc20-qr-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// ===============================================
// Helper
// ===============================================
async function getSettings() {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({});
  }

  return settings;
}

// ===============================================
// GET SETTINGS
// GET /api/settings
// ===============================================
router.get("/", async (req, res) => {
  try {
    const settings = await getSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ===============================================
// UPDATE SETTINGS
// PUT /api/settings
// ===============================================
router.put("/", upload.single("qr"), async (req, res) => {
  try {
    const settings = await getSettings();

    // ----------------------------
    // Market
    // ----------------------------
    if (req.body.goldPriceUSD !== undefined)
      settings.goldPriceUSD = Number(req.body.goldPriceUSD);

    if (req.body.usdToPkr !== undefined)
      settings.usdToPkr = Number(req.body.usdToPkr);

    if (req.body.usdtRate !== undefined)
      settings.usdtRate = Number(req.body.usdtRate);

    if (req.body.goldSpread !== undefined)
      settings.goldSpread = Number(req.body.goldSpread);

    // ----------------------------
    // Trading
    // ----------------------------
    if (req.body.goldTradingEnabled !== undefined)
      settings.goldTradingEnabled =
        req.body.goldTradingEnabled === "true" ||
        req.body.goldTradingEnabled === true;

    if (req.body.depositEnabled !== undefined)
      settings.depositEnabled =
        req.body.depositEnabled === "true" ||
        req.body.depositEnabled === true;

    if (req.body.withdrawEnabled !== undefined)
      settings.withdrawEnabled =
        req.body.withdrawEnabled === "true" ||
        req.body.withdrawEnabled === true;

    if (req.body.registrationEnabled !== undefined)
      settings.registrationEnabled =
        req.body.registrationEnabled === "true" ||
        req.body.registrationEnabled === true;

    if (req.body.loginEnabled !== undefined)
      settings.loginEnabled =
        req.body.loginEnabled === "true" ||
        req.body.loginEnabled === true;

    if (req.body.maintenanceMode !== undefined)
      settings.maintenanceMode =
        req.body.maintenanceMode === "true" ||
        req.body.maintenanceMode === true;

    // ----------------------------
    // Limits
    // ----------------------------
    if (req.body.minimumDeposit !== undefined)
      settings.minimumDeposit = Number(req.body.minimumDeposit);

    if (req.body.maximumDeposit !== undefined)
      settings.maximumDeposit = Number(req.body.maximumDeposit);

    if (req.body.minimumWithdraw !== undefined)
      settings.minimumWithdraw = Number(req.body.minimumWithdraw);

    if (req.body.maximumWithdraw !== undefined)
      settings.maximumWithdraw = Number(req.body.maximumWithdraw);

    if (req.body.withdrawFeePercent !== undefined)
      settings.withdrawFeePercent = Number(req.body.withdrawFeePercent);

    if (req.body.minimumGoldBuyGram !== undefined)
      settings.minimumGoldBuyGram = Number(req.body.minimumGoldBuyGram);

    if (req.body.maximumGoldBuyGram !== undefined)
      settings.maximumGoldBuyGram = Number(req.body.maximumGoldBuyGram);

    if (req.body.minimumGoldSellGram !== undefined)
      settings.minimumGoldSellGram = Number(req.body.minimumGoldSellGram);

    if (req.body.maximumGoldSellGram !== undefined)
      settings.maximumGoldSellGram = Number(req.body.maximumGoldSellGram);

    // ----------------------------
    // Referral
    // ----------------------------
    if (req.body.referralEnabled !== undefined)
      settings.referralEnabled =
        req.body.referralEnabled === "true" ||
        req.body.referralEnabled === true;

    if (req.body.referralBonusPKR !== undefined)
      settings.referralBonusPKR = Number(req.body.referralBonusPKR);

    // ----------------------------
    // Wallet
    // ----------------------------
    if (req.body.trc20Wallet !== undefined)
      settings.trc20Wallet = req.body.trc20Wallet;

    if (req.file) {
      settings.trc20Qr = `/uploads/settings/${req.file.filename}`;
    }

    // ----------------------------
    // Admin Info
    // ----------------------------
    settings.updatedBy = req.body.updatedBy || "Admin";
    settings.note = req.body.note || "";

    // ----------------------------
    // AUTO CALCULATE GOLD PRICE (PER GRAM)
    // ----------------------------
    const ouncePricePKR =
      settings.goldPriceUSD * settings.usdToPkr;

    const gramPricePKR = ouncePricePKR / 31.1035;

    settings.buyGoldPrice = Number(
      (gramPricePKR * (1 + settings.goldSpread / 100)).toFixed(2)
    );

    settings.sellGoldPrice = Number(
      (gramPricePKR * (1 - settings.goldSpread / 100)).toFixed(2)
    );

    await settings.save();

    res.json({
      success: true,
      message: "GoldTrade Settings Updated Successfully.",
      data: settings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ===============================================
// MARKET DATA
// GET /api/settings/market
// ===============================================
router.get("/market", async (req, res) => {
  try {
    const settings = await getSettings();

    res.json({
      success: true,
      data: {
        goldPriceUSD: settings.goldPriceUSD,
        usdToPkr: settings.usdToPkr,
        usdtRate: settings.usdtRate,

        buyGoldPrice: settings.buyGoldPrice,
        sellGoldPrice: settings.sellGoldPrice,
        goldSpread: settings.goldSpread,

        goldTradingEnabled: settings.goldTradingEnabled,

        depositEnabled: settings.depositEnabled,
        withdrawEnabled: settings.withdrawEnabled,

        maintenanceMode: settings.maintenanceMode,

        trc20Wallet: settings.trc20Wallet,
        trc20Qr: settings.trc20Qr,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ===============================================
// QUICK TOGGLE APIs
// ===============================================

// Gold Trading ON/OFF
router.put("/toggle/gold", async (req, res) => {
  try {
    const settings = await getSettings();

    settings.goldTradingEnabled =
      !settings.goldTradingEnabled;

    await settings.save();

    res.json({
      success: true,
      goldTradingEnabled: settings.goldTradingEnabled,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Deposit ON/OFF
router.put("/toggle/deposit", async (req, res) => {
  try {
    const settings = await getSettings();

    settings.depositEnabled = !settings.depositEnabled;

    await settings.save();

    res.json({
      success: true,
      depositEnabled: settings.depositEnabled,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Withdraw ON/OFF
router.put("/toggle/withdraw", async (req, res) => {
  try {
    const settings = await getSettings();

    settings.withdrawEnabled =
      !settings.withdrawEnabled;

    await settings.save();

    res.json({
      success: true,
      withdrawEnabled: settings.withdrawEnabled,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Maintenance ON/OFF
router.put("/toggle/maintenance", async (req, res) => {
  try {
    const settings = await getSettings();

    settings.maintenanceMode =
      !settings.maintenanceMode;

    await settings.save();

    res.json({
      success: true,
      maintenanceMode: settings.maintenanceMode,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;