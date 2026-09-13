require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Uploads Folder
app.use("/uploads", express.static("uploads"));

// ======================================================
// IMPORT ROUTES
// ======================================================

// User Routes
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
    message: "GoldTrade V17 Backend Running",
  });
});

// ======================================================
// STATUS ROUTE
// ======================================================

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    uptime: process.uptime(),
    version: "V17 Enterprise",
  });
});

// ======================================================
// ADMIN ROUTES
// ======================================================

// Dashboard
app.use("/api/admin/dashboard", adminDashboardRoutes);

// Deposits
app.use("/api/admin/deposits", adminDepositRoutes);

// Withdraws
app.use("/api/admin/withdraws", adminWithdrawRoutes);

// Users
app.use("/api/admin/users", adminUserRoutes);

// Wallet
app.use("/api/admin/wallet", adminWalletRoutes);

// Other Admin APIs
app.use("/api/admin", adminRoutes);

app.use("/api/admin/payment-settings", paymentSettingsRoutes);

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

// Gold
app.use("/api/gold", goldRoutes);

// ======================================================
// 404 ROUTE
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
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
  console.log(`🪙 Gold   : http://localhost:${PORT}/api/gold`);
  console.log("========================================");
});