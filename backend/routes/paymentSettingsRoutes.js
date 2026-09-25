// ======================================================
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 1/7
// Production Ready (Render + PM2 + MongoDB)
// ======================================================

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const PaymentSettings = require("../models/PaymentSettings");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// HEALTH CHECK
// GET /api/payment-settings/health
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
// GET DEPOSIT PAYMENT METHODS
// GET /api/payment-settings/deposit
// Used By frontend/app/deposit/page.tsx
// ======================================================

router.get("/deposit", verifyToken, async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne().lean();

    // Create default settings if database is empty
    if (!settings) {
      settings = await PaymentSettings.create({
        depositMethods: [
          {
            method: "BANK",
            title: "Bank Transfer",
            enabled: true,
            accountTitle: "",
            accountNumber: "",
            iban: "",
            qrImage: "",
          },
          {
            method: "JAZZCASH",
            title: "JazzCash",
            enabled: true,
            accountTitle: "",
            accountNumber: "",
            qrImage: "",
          },
          {
            method: "EASYPAISA",
            title: "EasyPaisa",
            enabled: true,
            accountTitle: "",
            accountNumber: "",
            qrImage: "",
          },
          {
            method: "BINANCE",
            title: "Binance USDT",
            enabled: true,
            walletAddress: "",
            network: "TRC20",
            qrImage: "",
          },
        ],
        withdrawMethods: [],
      });

      settings = settings.toObject();
    }

    const methods = (settings.depositMethods || [])
      .filter((item) => item.enabled === true)
      .map((item) => ({
        _id: item._id,
        method: item.method,
        title: item.title,
        enabled: item.enabled,

        accountTitle: item.accountTitle || "",
        accountNumber: item.accountNumber || "",
        iban: item.iban || "",

        walletAddress: item.walletAddress || "",
        network: item.network || "",

        qrImage: item.qrImage || "",
      }));

    return res.status(200).json({
      success: true,
      total: methods.length,
      methods,
    });

  } catch (error) {
    console.error("GET DEPOSIT METHODS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit payment methods.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 2/7
// Withdraw Methods + Public Payment Settings
// ======================================================

// ======================================================
// GET WITHDRAW PAYMENT METHODS
// GET /api/payment-settings/withdraw
// Used By frontend/app/withdraw/page.tsx
// ======================================================

router.get("/withdraw", verifyToken, async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne().lean();

    if (!settings) {
      settings = await PaymentSettings.create({
        depositMethods: [],
        withdrawMethods: [
          {
            method: "BANK",
            title: "Bank Transfer",
            enabled: true,
            processingTime: "1-24 Hours",
            minimumAmount: 1000,
            maximumAmount: 1000000,
          },
          {
            method: "JAZZCASH",
            title: "JazzCash",
            enabled: true,
            processingTime: "5-30 Minutes",
            minimumAmount: 500,
            maximumAmount: 200000,
          },
          {
            method: "EASYPAISA",
            title: "EasyPaisa",
            enabled: true,
            processingTime: "5-30 Minutes",
            minimumAmount: 500,
            maximumAmount: 200000,
          },
          {
            method: "BINANCE",
            title: "Binance USDT",
            enabled: true,
            processingTime: "5-15 Minutes",
            minimumAmount: 10,
            maximumAmount: 100000,
            network: "TRC20",
          },
        ],
      });

      settings = settings.toObject();
    }

    const methods = (settings.withdrawMethods || [])
      .filter((item) => item.enabled)
      .map((item) => ({
        _id: item._id,
        method: item.method,
        title: item.title,
        enabled: item.enabled,
        network: item.network || "",
        processingTime: item.processingTime || "Instant",
        minimumAmount: Number(item.minimumAmount || 0),
        maximumAmount: Number(item.maximumAmount || 999999999),
      }));

    return res.status(200).json({
      success: true,
      total: methods.length,
      methods,
    });

  } catch (error) {
    console.error("GET WITHDRAW METHODS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw payment methods.",
    });
  }
});

// ======================================================
// GET PUBLIC PAYMENT SETTINGS
// GET /api/payment-settings/public
// Used By Dashboard / Landing Page
// ======================================================

router.get("/public", async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne().lean();

    if (!settings) {
      return res.status(200).json({
        success: true,
        depositMethods: [],
        withdrawMethods: [],
      });
    }

    const depositMethods = (settings.depositMethods || [])
      .filter((item) => item.enabled)
      .map((item) => ({
        method: item.method,
        title: item.title,
        network: item.network || "",
      }));

    const withdrawMethods = (settings.withdrawMethods || [])
      .filter((item) => item.enabled)
      .map((item) => ({
        method: item.method,
        title: item.title,
        network: item.network || "",
        processingTime: item.processingTime || "Instant",
        minimumAmount: Number(item.minimumAmount || 0),
        maximumAmount: Number(item.maximumAmount || 999999999),
      }));

    return res.status(200).json({
      success: true,
      depositMethods,
      withdrawMethods,
      updatedAt: settings.updatedAt,
    });

  } catch (error) {
    console.error("PUBLIC PAYMENT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load payment settings.",
    });
  }
});

// ======================================================
// GET SINGLE PAYMENT METHOD
// GET /api/payment-settings/method/:method
// Used By Deposit / Withdraw Details
// ======================================================

router.get("/method/:method", verifyToken, async (req, res) => {
  try {
    const methodName = req.params.method.toUpperCase();

    const settings = await PaymentSettings.findOne().lean();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Payment settings not found.",
      });
    }

    const method =
      settings.depositMethods?.find((m) => m.method === methodName) ||
      settings.withdrawMethods?.find((m) => m.method === methodName);

    if (!method) {
      return res.status(404).json({
        success: false,
        message: "Payment method not found.",
      });
    }

    return res.status(200).json({
      success: true,
      method,
    });

  } catch (error) {
    console.error("GET PAYMENT METHOD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load payment method.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 3/7
// Admin Get Payment Settings APIs
// ======================================================

// ======================================================
// GET COMPLETE PAYMENT SETTINGS (ADMIN)
// GET /api/payment-settings/admin/all
// Used By Admin Payment Settings Page
// ======================================================

router.get("/admin/all", verifyToken, isAdmin, async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne().lean();

    if (!settings) {
      settings = await PaymentSettings.create({
        depositMethods: [],
        withdrawMethods: [],
      });

      settings = settings.toObject();
    }

    return res.status(200).json({
      success: true,
      settings,
    });

  } catch (error) {
    console.error("GET ADMIN PAYMENT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load payment settings.",
    });
  }
});

// ======================================================
// GET ADMIN DEPOSIT METHODS
// GET /api/payment-settings/admin/deposit
// ======================================================

router.get("/admin/deposit", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne().lean();

    return res.status(200).json({
      success: true,
      methods: settings?.depositMethods || [],
    });

  } catch (error) {
    console.error("GET ADMIN DEPOSIT METHODS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit methods.",
    });
  }
});

// ======================================================
// GET ADMIN WITHDRAW METHODS
// GET /api/payment-settings/admin/withdraw
// ======================================================

router.get("/admin/withdraw", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne().lean();

    return res.status(200).json({
      success: true,
      methods: settings?.withdrawMethods || [],
    });

  } catch (error) {
    console.error("GET ADMIN WITHDRAW METHODS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw methods.",
    });
  }
});

// ======================================================
// ADMIN PAYMENT SETTINGS STATISTICS
// GET /api/payment-settings/admin/statistics
// ======================================================

router.get("/admin/statistics", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne().lean();

    const depositMethods = settings?.depositMethods || [];
    const withdrawMethods = settings?.withdrawMethods || [];

    const statistics = {
      totalDepositMethods: depositMethods.length,
      enabledDepositMethods: depositMethods.filter(m => m.enabled).length,

      totalWithdrawMethods: withdrawMethods.length,
      enabledWithdrawMethods: withdrawMethods.filter(m => m.enabled).length,

      lastUpdated: settings?.updatedAt || null,
    };

    return res.status(200).json({
      success: true,
      statistics,
    });

  } catch (error) {
    console.error("PAYMENT SETTINGS STATISTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load statistics.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 4/7
// Admin Update Deposit Methods (Production)
// ======================================================

// ======================================================
// UPDATE ALL DEPOSIT METHODS
// PATCH /api/payment-settings/admin/deposit
// Used By Admin Payment Settings Page
// ======================================================

router.patch("/admin/deposit", verifyToken, isAdmin, async (req, res) => {
  try {
    const { depositMethods } = req.body;

    if (!Array.isArray(depositMethods)) {
      return res.status(400).json({
        success: false,
        message: "depositMethods must be an array.",
      });
    }

    let settings = await PaymentSettings.findOne();

    if (!settings) {
      settings = await PaymentSettings.create({
        depositMethods: [],
        withdrawMethods: [],
      });
    }

    settings.depositMethods = depositMethods.map((item) => ({
      method: String(item.method || "").toUpperCase(),
      title: item.title || "",
      enabled: Boolean(item.enabled),

      accountTitle: item.accountTitle || "",
      accountNumber: item.accountNumber || "",
      iban: item.iban || "",

      walletAddress: item.walletAddress || "",
      network: item.network || "",

      qrImage: item.qrImage || "",
    }));

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Deposit payment methods updated successfully.",
      methods: settings.depositMethods,
    });

  } catch (error) {
    console.error("UPDATE DEPOSIT METHODS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update deposit payment methods.",
    });
  }
});

// ======================================================
// UPDATE SINGLE DEPOSIT METHOD
// PATCH /api/payment-settings/admin/deposit/:method
// ======================================================

router.patch(
  "/admin/deposit/:method",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const methodName = req.params.method.toUpperCase();

      const settings = await PaymentSettings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Payment settings not found.",
        });
      }

      const index = settings.depositMethods.findIndex(
        (item) => item.method === methodName
      );

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: "Deposit method not found.",
        });
      }

      settings.depositMethods[index] = {
        ...settings.depositMethods[index].toObject(),
        ...req.body,
        method: methodName,
      };

      await settings.save();

      return res.status(200).json({
        success: true,
        message: `${methodName} deposit method updated.`,
        method: settings.depositMethods[index],
      });

    } catch (error) {
      console.error("UPDATE SINGLE DEPOSIT METHOD ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update deposit method.",
      });
    }
  }
);

// ======================================================
// TOGGLE DEPOSIT METHOD
// PATCH /api/payment-settings/admin/deposit/:method/toggle
// ======================================================

router.patch(
  "/admin/deposit/:method/toggle",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const methodName = req.params.method.toUpperCase();

      const settings = await PaymentSettings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Payment settings not found.",
        });
      }

      const method = settings.depositMethods.find(
        (item) => item.method === methodName
      );

      if (!method) {
        return res.status(404).json({
          success: false,
          message: "Deposit method not found.",
        });
      }

      method.enabled = !method.enabled;

      await settings.save();

      return res.status(200).json({
        success: true,
        message: `${methodName} is now ${
          method.enabled ? "Enabled" : "Disabled"
        }.`,
        enabled: method.enabled,
      });

    } catch (error) {
      console.error("TOGGLE DEPOSIT METHOD ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to toggle deposit method.",
      });
    }
  }
);

// ======================================================
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 5/7
// Admin Update Withdraw Methods (Production)
// ======================================================

// ======================================================
// UPDATE ALL WITHDRAW METHODS
// PATCH /api/payment-settings/admin/withdraw
// Used By Admin Payment Settings Page
// ======================================================

router.patch("/admin/withdraw", verifyToken, isAdmin, async (req, res) => {
  try {
    const { withdrawMethods } = req.body;

    if (!Array.isArray(withdrawMethods)) {
      return res.status(400).json({
        success: false,
        message: "withdrawMethods must be an array.",
      });
    }

    let settings = await PaymentSettings.findOne();

    if (!settings) {
      settings = await PaymentSettings.create({
        depositMethods: [],
        withdrawMethods: [],
      });
    }

    settings.withdrawMethods = withdrawMethods.map((item) => ({
      method: String(item.method || "").toUpperCase(),
      title: item.title || "",
      enabled: Boolean(item.enabled),

      processingTime: item.processingTime || "Instant",
      minimumAmount: Number(item.minimumAmount || 0),
      maximumAmount: Number(item.maximumAmount || 999999999),

      accountTitle: item.accountTitle || "",
      accountNumber: item.accountNumber || "",

      walletAddress: item.walletAddress || "",
      network: item.network || "",
      qrImage: item.qrImage || "",
    }));

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Withdraw payment methods updated successfully.",
      methods: settings.withdrawMethods,
    });

  } catch (error) {
    console.error("UPDATE WITHDRAW METHODS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update withdraw payment methods.",
    });
  }
});

// ======================================================
// UPDATE SINGLE WITHDRAW METHOD
// PATCH /api/payment-settings/admin/withdraw/:method
// ======================================================

router.patch(
  "/admin/withdraw/:method",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const methodName = req.params.method.toUpperCase();

      const settings = await PaymentSettings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Payment settings not found.",
        });
      }

      const index = settings.withdrawMethods.findIndex(
        (item) => item.method === methodName
      );

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: "Withdraw method not found.",
        });
      }

      settings.withdrawMethods[index] = {
        ...settings.withdrawMethods[index].toObject(),
        ...req.body,
        method: methodName,
      };

      await settings.save();

      return res.status(200).json({
        success: true,
        message: `${methodName} withdraw method updated successfully.`,
        method: settings.withdrawMethods[index],
      });

    } catch (error) {
      console.error("UPDATE SINGLE WITHDRAW METHOD ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update withdraw method.",
      });
    }
  }
);

// ======================================================
// ENABLE / DISABLE WITHDRAW METHOD
// PATCH /api/payment-settings/admin/withdraw/:method/toggle
// ======================================================

router.patch(
  "/admin/withdraw/:method/toggle",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const methodName = req.params.method.toUpperCase();

      const settings = await PaymentSettings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Payment settings not found.",
        });
      }

      const method = settings.withdrawMethods.find(
        (item) => item.method === methodName
      );

      if (!method) {
        return res.status(404).json({
          success: false,
          message: "Withdraw method not found.",
        });
      }

      method.enabled = !method.enabled;

      await settings.save();

      return res.status(200).json({
        success: true,
        message: `${methodName} is now ${
          method.enabled ? "Enabled" : "Disabled"
        }.`,
        enabled: method.enabled,
      });

    } catch (error) {
      console.error("TOGGLE WITHDRAW METHOD ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to toggle withdraw method.",
      });
    }
  }
);

// ======================================================
// UPDATE WITHDRAW LIMITS
// PATCH /api/payment-settings/admin/withdraw/:method/limits
// ======================================================

router.patch(
  "/admin/withdraw/:method/limits",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const methodName = req.params.method.toUpperCase();
      const { minimumAmount, maximumAmount, processingTime } = req.body;

      const settings = await PaymentSettings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Payment settings not found.",
        });
      }

      const method = settings.withdrawMethods.find(
        (item) => item.method === methodName
      );

      if (!method) {
        return res.status(404).json({
          success: false,
          message: "Withdraw method not found.",
        });
      }

      if (minimumAmount !== undefined)
        method.minimumAmount = Number(minimumAmount);

      if (maximumAmount !== undefined)
        method.maximumAmount = Number(maximumAmount);

      if (processingTime !== undefined)
        method.processingTime = processingTime;

      await settings.save();

      return res.status(200).json({
        success: true,
        message: `${methodName} limits updated successfully.`,
        method,
      });

    } catch (error) {
      console.error("UPDATE WITHDRAW LIMITS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update withdraw limits.",
      });
    }
  }
);

// ======================================================
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 6/7
// QR Image + Wallet Address Update APIs (Production)
// ======================================================

// ======================================================
// UPDATE QR IMAGE
// PATCH /api/payment-settings/admin/deposit/:method/qr
// ======================================================

router.patch(
  "/admin/deposit/:method/qr",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const methodName = req.params.method.toUpperCase();
      const { qrImage } = req.body;

      if (!qrImage) {
        return res.status(400).json({
          success: false,
          message: "QR image is required.",
        });
      }

      const settings = await PaymentSettings.findOne();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: "Payment settings not found.",
        });
      }

      const method = settings.depositMethods.find(
        (item) => item.method === methodName
      );

      if (!method) {
        return res.status(404).json({
          success: false,
          message: "Deposit method not found.",
        });
      }

      method.qrImage = qrImage;

      await settings.save();

      return res.status(200).json({
        success: true,
        message: `${methodName} QR updated successfully.`,
        qrImage: method.qrImage,
      });

    } catch (error) {
      console.error("UPDATE QR IMAGE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update QR image.",
      });
    }
  }
);

// ======================================================
// UPDATE BANK DETAILS
// PATCH /api/payment-settings/admin/deposit/BANK/details
// ======================================================

router.patch(
  "/admin/deposit/BANK/details",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { accountTitle, accountNumber, iban } = req.body;

      const settings = await PaymentSettings.findOne();

      const bank = settings.depositMethods.find(
        (item) => item.method === "BANK"
      );

      if (!bank) {
        return res.status(404).json({
          success: false,
          message: "Bank method not found.",
        });
      }

      bank.accountTitle = accountTitle || bank.accountTitle;
      bank.accountNumber = accountNumber || bank.accountNumber;
      bank.iban = iban || bank.iban;

      await settings.save();

      return res.json({
        success: true,
        message: "Bank details updated successfully.",
        method: bank,
      });

    } catch (error) {
      console.error("BANK DETAILS UPDATE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update bank details.",
      });
    }
  }
);

// ======================================================
// UPDATE JAZZCASH DETAILS
// PATCH /api/payment-settings/admin/deposit/JAZZCASH/details
// ======================================================

router.patch(
  "/admin/deposit/JAZZCASH/details",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { accountTitle, accountNumber } = req.body;

      const settings = await PaymentSettings.findOne();

      const method = settings.depositMethods.find(
        (item) => item.method === "JAZZCASH"
      );

      if (!method) {
        return res.status(404).json({
          success: false,
          message: "JazzCash method not found.",
        });
      }

      method.accountTitle = accountTitle || method.accountTitle;
      method.accountNumber = accountNumber || method.accountNumber;

      await settings.save();

      return res.json({
        success: true,
        message: "JazzCash updated successfully.",
        method,
      });

    } catch (error) {
      console.error("JAZZCASH UPDATE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update JazzCash.",
      });
    }
  }
);

// ======================================================
// UPDATE EASYPAISA DETAILS
// PATCH /api/payment-settings/admin/deposit/EASYPAISA/details
// ======================================================

router.patch(
  "/admin/deposit/EASYPAISA/details",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { accountTitle, accountNumber } = req.body;

      const settings = await PaymentSettings.findOne();

      const method = settings.depositMethods.find(
        (item) => item.method === "EASYPAISA"
      );

      if (!method) {
        return res.status(404).json({
          success: false,
          message: "EasyPaisa method not found.",
        });
      }

      method.accountTitle = accountTitle || method.accountTitle;
      method.accountNumber = accountNumber || method.accountNumber;

      await settings.save();

      return res.json({
        success: true,
        message: "EasyPaisa updated successfully.",
        method,
      });

    } catch (error) {
      console.error("EASYPAISA UPDATE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update EasyPaisa.",
      });
    }
  }
);

// ======================================================
// UPDATE BINANCE WALLET
// PATCH /api/payment-settings/admin/deposit/BINANCE/wallet
// ======================================================

router.patch(
  "/admin/deposit/BINANCE/wallet",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { walletAddress, network, qrImage } = req.body;

      const settings = await PaymentSettings.findOne();

      const method = settings.depositMethods.find(
        (item) => item.method === "BINANCE"
      );

      if (!method) {
        return res.status(404).json({
          success: false,
          message: "Binance method not found.",
        });
      }

      method.walletAddress = walletAddress || method.walletAddress;
      method.network = network || method.network;
      method.qrImage = qrImage || method.qrImage;

      await settings.save();

      return res.json({
        success: true,
        message: "Binance wallet updated successfully.",
        method,
      });

    } catch (error) {
      console.error("BINANCE UPDATE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update Binance wallet.",
      });
    }
  }
);

// ======================================================
// GoldTrade V18 Enterprise Backend
// paymentSettingsRoutes.js
// PART 7/7 FINAL
// Reset + Diagnostics + Router Export
// ======================================================

// ======================================================
// RESET PAYMENT SETTINGS TO DEFAULT
// POST /api/payment-settings/admin/reset
// Used By Super Admin
// ======================================================

router.post("/admin/reset", verifyToken, isAdmin, async (req, res) => {
  try {
    let settings = await PaymentSettings.findOne();

    if (!settings) {
      settings = new PaymentSettings();
    }

    settings.depositMethods = [
      {
        method: "BANK",
        title: "Bank Transfer",
        enabled: true,
        accountTitle: "",
        accountNumber: "",
        iban: "",
        qrImage: "",
      },
      {
        method: "JAZZCASH",
        title: "JazzCash",
        enabled: true,
        accountTitle: "",
        accountNumber: "",
        qrImage: "",
      },
      {
        method: "EASYPAISA",
        title: "EasyPaisa",
        enabled: true,
        accountTitle: "",
        accountNumber: "",
        qrImage: "",
      },
      {
        method: "BINANCE",
        title: "Binance USDT",
        enabled: true,
        walletAddress: "",
        network: "TRC20",
        qrImage: "",
      },
    ];

    settings.withdrawMethods = [
      {
        method: "BANK",
        title: "Bank Transfer",
        enabled: true,
        processingTime: "1-24 Hours",
        minimumAmount: 1000,
        maximumAmount: 1000000,
      },
      {
        method: "JAZZCASH",
        title: "JazzCash",
        enabled: true,
        processingTime: "5-30 Minutes",
        minimumAmount: 500,
        maximumAmount: 200000,
      },
      {
        method: "EASYPAISA",
        title: "EasyPaisa",
        enabled: true,
        processingTime: "5-30 Minutes",
        minimumAmount: 500,
        maximumAmount: 200000,
      },
      {
        method: "BINANCE",
        title: "Binance USDT",
        enabled: true,
        processingTime: "5-15 Minutes",
        minimumAmount: 10,
        maximumAmount: 100000,
        network: "TRC20",
      },
    ];

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Payment settings reset successfully.",
      settings,
    });

  } catch (error) {
    console.error("RESET PAYMENT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reset payment settings.",
    });
  }
});

// ======================================================
// PAYMENT SETTINGS DIAGNOSTICS
// GET /api/payment-settings/debug
// ======================================================

router.get("/debug", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne().lean();

    return res.status(200).json({
      success: true,
      module: "Payment Settings API",
      version: "V18 Enterprise",
      environment: process.env.NODE_ENV || "development",

      depositMethods: settings?.depositMethods?.length || 0,
      withdrawMethods: settings?.withdrawMethods?.length || 0,

      databaseConnected: true,
      updatedAt: settings?.updatedAt || null,
      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    console.error("PAYMENT SETTINGS DEBUG ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Diagnostics failed.",
    });
  }
});

// ======================================================
// GET RAW SETTINGS (ADMIN BACKUP)
// GET /api/payment-settings/admin/raw
// ======================================================

router.get("/admin/raw", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne().lean();

    return res.status(200).json({
      success: true,
      settings: settings || {},
    });

  } catch (error) {
    console.error("RAW PAYMENT SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load raw settings.",
    });
  }
});

// ======================================================
// ROUTER EXPORT
// ======================================================

module.exports = router;
