require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const multer = require("multer");
const path = require("path");

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
// IMPORT ROUTES (GoldTrade V18 Final)
// ======================================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const walletRoutes = require("./routes/walletRoutes");

const depositRoutes = require("./routes/depositRoutes");
const withdrawRoutes = require("./routes/withdrawRoutes");

const goldRoutes = require("./routes/goldRoutes");
const usdtRoutes = require("./routes/usdtRoutes");
const tradingRoutes = require("./routes/tradingRoutes");

const marketRoutes = require("./routes/marketRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const paymentSettingsRoutes = require("./routes/paymentSettingsRoutes");
const referralRoutes = require("./routes/referralRoutes");
const historyRoutes = require("./routes/historyRoutes");

// ================= ADMIN ROUTES =================
const adminRoutes = require("./routes/adminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminDepositRoutes = require("./routes/adminDepositRoutes");
const adminUsdtRoutes = require("./routes/adminUsdtRoutes");
const adminWalletRoutes = require("./routes/adminWalletRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");

// ==========================================
// MongoDB Atlas Connection (GoldTrade V18)
// ==========================================
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    family: 4, // Force IPv4 (TLS issue fix)
    retryWrites: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
    process.exit(1);
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
// PUBLIC API ROUTES
// ======================================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/admin/withdraws", withdrawRoutes);
app.use("/api/usdt", usdtRoutes);
app.use("/api/gold", goldRoutes);
app.use("/api/trading", tradingRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/payment-settings", paymentSettingsRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/history", historyRoutes);

// ======================================================
// ADMIN API ROUTES
// ======================================================

app.use("/api/admin", adminRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/deposits", adminDepositRoutes);
app.use("/api/admin/wallet", adminWalletRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/admin/usdt", adminUsdtRoutes);

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
// ===========================================
// TEMP FIX PKR WALLET (DELETE AFTER USE)
// ===========================================
const Wallet = require("./models/Wallet");

app.get("/fix-pkr", async (req, res) => {
  try {
    const result = await Wallet.updateMany(
      { pkrBalance: { $exists: false } },
      { $set: { pkrBalance: 0 } }
    );

    res.json({
      success: true,
      repaired: result.modifiedCount,
      matched: result.matchedCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
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
