"use strict";

// ======================================================
// GOLDTRADE V18 SERVER (PART 1/4)
// Linux + Render + Vercel Compatible
// ======================================================

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");

const app = express();

// ======================================================
// MONGODB CONNECTION
// ======================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1);
  });

// ======================================================
// CORS CONFIG
// ======================================================

const allowedOrigins = [
  "http://localhost:3000",
  "https://frontend-cj9o6n761-flextrade-5000.vercel.app",
  "https://infotradewithzoyanet.org",
  "https://www.infotradewithzoyanet.org",
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS BLOCKED:", origin);
      return callback(new Error("CORS Not Allowed"));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ======================================================
// EXPRESS MIDDLEWARE
// ======================================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static Upload Folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// ======================================================
// GOLDTRADE V18 SERVER (PART 2/4)
// ROUTE IMPORTS (Linux + Render Safe)
// ======================================================

// ================= PUBLIC ROUTES =================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/UserRoutes");
const walletRoutes = require("./routes/WalletRoutes");

const depositRoutes = require("./routes/DepositRoutes");
const withdrawRoutes = require("./routes/WithdrawRoutes");

const goldRoutes = require("./routes/GoldRoutes");
const usdtRoutes = require("./routes/UsdtRoutes");

const tradingRoutes = require("./routes/TradingRoutes");
const marketRoutes = require("./routes/MarketRoutes");
const settingsRoutes = require("./routes/SettingsRoutes");

const transactionRoutes = require("./routes/TransactionRoutes");
const paymentSettingsRoutes = require("./routes/PaymentSettingsRoutes");

const referralRoutes = require("./routes/ReferralRoutes");
const historyRoutes = require("./routes/HistoryRoutes");

// ================= ADMIN ROUTES =================

const adminRoutes = require("./routes/adminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminDepositRoutes = require("./routes/adminDepositRoutes");
const adminWithdrawRoutes = require("./routes/adminWithdrawRoutes");
const adminWalletRoutes = require("./routes/adminWalletRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminUsdtRoutes = require("./routes/adminUsdtRoutes");

// ======================================================
// REGISTER ROUTES
// ======================================================

// Public APIs
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);

app.use("/api/deposit", depositRoutes);
app.use("/api/withdraw", withdrawRoutes);

app.use("/api/gold", goldRoutes);
app.use("/api/usdt", usdtRoutes);

app.use("/api/trading", tradingRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/settings", settingsRoutes);

app.use("/api/transactions", transactionRoutes);
app.use("/api/payment-settings", paymentSettingsRoutes);

app.use("/api/referrals", referralRoutes);
app.use("/api/history", historyRoutes);

// Admin APIs
app.use("/api/admin", adminRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/deposits", adminDepositRoutes);
app.use("/api/admin/withdraws", adminWithdrawRoutes);
app.use("/api/admin/wallet", adminWalletRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/usdt", adminUsdtRoutes);
// ======================================================
// GOLDTRADE V18 SERVER (PART 3/4)
// HEALTH + STATUS + DEFAULT ROUTES
// Linux + Render Safe
// ======================================================

// ================= ROOT ROUTE =================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    app: "GoldTrade V18 Enterprise",
    message: "GoldTrade Backend is Running Successfully 🚀",
    environment: process.env.NODE_ENV || "development",
    version: "V18",
    api: "/api/health",
  });
});

// ================= HEALTH CHECK =================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GoldTrade API Healthy",
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ================= STATUS =================

app.get("/api/status", (req, res) => {
  res.status(200).json({
    success: true,
    app: "GoldTrade V18 Enterprise",
    version: "V18",
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ================= API INFO =================

app.get("/api", (req, res) => {
  res.status(200).json({
    success: true,
    name: "GoldTrade Backend API",
    version: "V18",
    endpoints: {
      health: "/api/health",
      status: "/api/status",
      gold: "/api/gold/price",
      usdt: "/api/usdt/rate",
      wallet: "/api/wallet",
      trading: "/api/trading",
    },
  });
});

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
    path: req.originalUrl,
  });
});
// ======================================================
// GOLDTRADE V18 SERVER (PART 4/4)
// GLOBAL ERROR HANDLER + SERVER START
// Linux + Render Safe
// ======================================================

// ================= GLOBAL ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error("========================================");
  console.error("SERVER ERROR:", err.message);
  console.error(err.stack);
  console.error("========================================");

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ================= SERVER START =================

const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log("==============================================");
  console.log("🚀 GoldTrade V18 Backend Started Successfully");
  console.log("==============================================");
  console.log(`🌍 Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 Host        : ${HOST}`);
  console.log(`🚪 Port        : ${PORT}`);
  console.log(`❤️ Health API  : /api/health`);
  console.log(`📊 Status API  : /api/status`);
  console.log(`💰 Gold API    : /api/gold/price`);
  console.log(`💵 USDT API    : /api/usdt/rate`);
  console.log("==============================================");
});