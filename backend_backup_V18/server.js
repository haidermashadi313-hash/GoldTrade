require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ======================================================
// CORS CONFIG (Vercel + Localhost)
// ======================================================

const allowedOrigins = [
  "http://localhost:3000",
  "https://frontend-cj9o6n761-flextrade-5000.vercel.app",
  "https://infotradewithzoyanet.org",
  "https://www.infotradewithzoyanet.org",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS Not Allowed"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads Folder
app.use("/uploads", express.static("uploads"));

// ======================================================
// IMPORT ROUTES
// ======================================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const walletRoutes = require("./routes/walletRoutes");
const depositRoutes = require("./routes/depositRoutes");
const withdrawRoutes = require("./routes/withdrawRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const marketRoutes = require("./routes/marketRoutes");
const tradingRoutes = require("./routes/tradingRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const goldRoutes = require("./routes/goldRoutes");
const paymentSettingsRoutes = require("./routes/paymentSettingsRoutes");

// Admin Routes
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminDepositRoutes = require("./routes/adminDepositRoutes");
const adminWithdrawRoutes = require("./routes/adminWithdrawRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminWalletRoutes = require("./routes/adminWalletRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminDepositRoutes = require("./routes/adminDepositRoutes");
const adminWithdrawRoutes = require("./routes/adminWithdrawRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminWalletRoutes = require("./routes/adminWalletRoutes");
const paymentSettingsRoutes = require("./routes/paymentSettingsRoutes");

// ======================================================
// MONGODB CONNECTION
// ======================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

// ======================================================
// ROOT ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GoldTrade V18 Backend Running 🚀",
  });
});

// ======================================================
// HEALTH ROUTE
// ======================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GoldTrade API Healthy",
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    uptime: process.uptime(),
    version: "V18 Enterprise",
  });
});

// ======================================================
// ADMIN ROUTES
// ======================================================

// Dashboard
app.use("/api/gold/admin/dashboard", adminDashboardRoutes);

// Deposits
app.use("/api/gold/admin/deposits", adminDepositRoutes);

// Withdrawals
app.use("/api/gold/admin/withdraws", adminWithdrawRoutes);

// Users
app.use("/api/gold/admin/users", adminUserRoutes);

// Wallet
app.use("/api/gold/admin/wallet", adminWalletRoutes);

// Other Admin APIs
app.use("/api/gold/admin", adminRoutes);

// Payment Settings
app.use("/api/gold/admin/payment-settings", paymentSettingsRoutes);

// ======================================================
// USER API ROUTES
// ======================================================

// Authentication
app.use("/api/auth", authRoutes);

// Users
app.use("/api/users", userRoutes);

// Wallet
app.use("/api/wallets", walletRoutes);

// Deposit
app.use("/api/deposit", depositRoutes);

// Withdraw
app.use("/api/withdraw", withdrawRoutes);

// Trading
app.use("/api/trading", tradingRoutes);

// Market
app.use("/api/market", marketRoutes);

// Settings
app.use("/api/settings", settingsRoutes);

// Transactions
app.use("/api/transactions", transactionRoutes);

// Gold (ONLY ONE TIME)
app.use("/api/gold", goldRoutes);

// ======================================================
// 404 API ROUTE
// ======================================================

app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ======================================================
// SERVER START
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("========================================");
  console.log("🚀 GOLDTRADE BACKEND RUNNING");
  console.log(`🌐 Server : http://localhost:${PORT}`);
  console.log(`📦 API    : http://localhost:${PORT}/api`);
  console.log(`❤️ Health : http://localhost:${PORT}/api/health`);
  console.log("========================================");
});
// =====================================================
// GET GOLD PRICE
// GET /api/gold/price
// =====================================================
router.get("/price", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        buyPrice: 0,
        sellPrice: 0,
        goldPriceUSD: 0,
        usdToPkr: 0,
        tradingEnabled: true,
        marketStatus: "open",
      });
    }

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("GET PRICE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch market settings.",
    });
  }
});

// =====================================================
// UPDATE GOLD PRICE
// PUT /api/gold/price
// =====================================================
router.put("/price", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    settings.buyPrice = req.body.buyPrice;
    settings.sellPrice = req.body.sellPrice;
    settings.goldPriceUSD = req.body.goldPriceUSD;
    settings.usdToPkr = req.body.usdToPkr;
    settings.tradingEnabled = req.body.tradingEnabled;
    settings.marketStatus = req.body.marketStatus;

    await settings.save();

    res.json({
      success: true,
      message: "Market settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error("UPDATE PRICE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update market settings.",
    });
  }
});

module.exports = router;
