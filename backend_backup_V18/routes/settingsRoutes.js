const express = require("express");
const router = express.Router();

const Settings = require("../models/Settings");
const { verifyToken } = require("../middleware/authMiddleware");

/* ==========================================================
   GET PUBLIC SETTINGS
   User Dashboard
   GET /api/settings/public
========================================================== */

router.get("/public", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    return res.json({
      success: true,
      settings: {
        buyGoldPrice: settings.buyGoldPrice,
        sellGoldPrice: settings.sellGoldPrice,
        goldTradingEnabled: settings.goldTradingEnabled,

        cashbackEnabled: settings.cashbackEnabled,
        cashbackRate: settings.cashbackRate,

        luckyDrawEnabled: settings.luckyDrawEnabled,
        luckyDrawPrize: settings.luckyDrawPrize,

        invitationCode: settings.invitationCode,

        referralBonus: settings.referralBonus,

        vipSilverAmount: settings.vipSilverAmount,
        vipGoldAmount: settings.vipGoldAmount,
        vipDiamondAmount: settings.vipDiamondAmount,

        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        supportWhatsapp: settings.supportWhatsapp,
        supportTelegram: settings.supportTelegram,
      },
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Unable to load settings.",
    });
  }
});

/* ==========================================================
   GET ALL SETTINGS (ADMIN)
   GET /api/settings/admin
========================================================== */

router.get("/admin", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Unable to load admin settings.",
    });
  }
});

/* ==========================================================
   UPDATE SETTINGS (ADMIN ONLY)
   PUT /api/settings/admin
========================================================== */

router.put("/admin", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    const fields = [
      "buyGoldPrice",
      "sellGoldPrice",
      "goldTradingEnabled",
      "marketStatus",

      "cashbackEnabled",
      "cashbackRate",

      "luckyDrawEnabled",
      "luckyDrawPrize",
      "luckyDrawDate",

      "invitationCode",
      "invitationEnabled",

      "referralEnabled",
      "referralBonus",

      "vipEnabled",
      "vipSilverAmount",
      "vipGoldAmount",
      "vipDiamondAmount",

      "minimumDeposit",
      "minimumWithdraw",
      "depositEnabled",
      "withdrawEnabled",

      "supportEmail",
      "supportWhatsapp",
      "supportTelegram",

      "maintenanceMode",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        settings[field] = req.body[field];
      }
    });

    await settings.save();

    return res.json({
      success: true,
      message: "Settings updated successfully.",
      settings,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Unable to update settings.",
    });
  }
});

/* ==========================================================
   UPDATE GOLD PRICE ONLY
   PUT /api/settings/gold-price
========================================================== */

router.put("/gold-price", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const { buyGoldPrice, sellGoldPrice } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    if (buyGoldPrice !== undefined)
      settings.buyGoldPrice = Number(buyGoldPrice);

    if (sellGoldPrice !== undefined)
      settings.sellGoldPrice = Number(sellGoldPrice);

    await settings.save();

    return res.json({
      success: true,
      message: "Gold prices updated successfully.",
      buyGoldPrice: settings.buyGoldPrice,
      sellGoldPrice: settings.sellGoldPrice,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Unable to update gold price.",
    });
  }
});

/* ==========================================================
   TOGGLE MARKET OPEN / CLOSE
   PUT /api/settings/market-status
========================================================== */

router.put("/market-status", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const { goldTradingEnabled } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    settings.goldTradingEnabled = goldTradingEnabled;
    settings.marketStatus = goldTradingEnabled ? "OPEN" : "CLOSED";

    await settings.save();

    return res.json({
      success: true,
      message: `Gold Market ${
        goldTradingEnabled ? "Opened" : "Closed"
      } Successfully.`,
      goldTradingEnabled: settings.goldTradingEnabled,
      marketStatus: settings.marketStatus,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Unable to update market status.",
    });
  }
});

/* ==========================================================
   UPDATE INVITATION CODE (ADMIN ONLY)
   PUT /api/settings/invitation-code
========================================================== */

router.put("/invitation-code", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    const { invitationCode } = req.body;

    if (!invitationCode) {
      return res.status(400).json({
        success: false,
        message: "Invitation code is required.",
      });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    settings.invitationCode = invitationCode.toUpperCase().trim();

    await settings.save();

    return res.json({
      success: true,
      message: "Invitation code updated successfully.",
      invitationCode: settings.invitationCode,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Unable to update invitation code.",
    });
  }
});

module.exports = router;