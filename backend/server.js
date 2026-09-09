const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// =======================================
// Import Routes
// =======================================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const depositRoutes = require("./routes/depositRoutes");
const withdrawRoutes = require("./routes/withdrawRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const walletRoutes = require("./routes/walletRoutes");
const goldRoutes = require("./routes/goldRoutes"); // ⭐ Gold Trading Engine

// =======================================
// Create Upload Folders Automatically
// =======================================
const uploadFolder = path.join(__dirname, "uploads");
const receiptFolder = path.join(uploadFolder, "receipts");
const qrFolder = path.join(uploadFolder, "qr");

if (!fs.existsSync(uploadFolder)) {
  fs.mkdirSync(uploadFolder);
}

if (!fs.existsSync(receiptFolder)) {
  fs.mkdirSync(receiptFolder, { recursive: true });
}

if (!fs.existsSync(qrFolder)) {
  fs.mkdirSync(qrFolder, { recursive: true });
}

// =======================================
// Middleware
// =======================================
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// =======================================
// Static Upload Files
// =======================================
app.use("/uploads", express.static(uploadFolder));

// =======================================
// API Routes
// =======================================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/deposit", depositRoutes);
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/transactions", transactionRoutes);

app.use("/api/admin", adminRoutes);

// Settings (Gold Price, TRC20 Wallet, Rates)
app.use("/api/settings", settingsRoutes);

// Manual Wallet Manager (PKR / USDT / GOLD)
app.use("/api/wallets", walletRoutes);

// ⭐ Gold Trading APIs
app.use("/api/gold", goldRoutes);

// =======================================
// Health Check
// =======================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    app: "GoldTrade Backend",
    version: "V4 FINAL",
    status: "Online",
    database:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    serverTime: new Date(),
  });
});

// =======================================
// API Status
// =======================================
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    uptime: process.uptime(),
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    environment: process.env.NODE_ENV || "development",
    version: "V4 FINAL",
  });
});

// =======================================
// 404 Handler
// =======================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
    path: req.originalUrl,
  });
});

// =======================================
// Global Error Handler
// =======================================
app.use((err, req, res, next) => {
  console.error("❌ Global Server Error");
  console.error(err);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : undefined,
  });
});

// =======================================
// MongoDB Connection
// =======================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log("");
      console.log("========================================");
      console.log("🚀 GoldTrade Backend Started");
      console.log(`🌍 Server      : http://localhost:${PORT}`);
      console.log("📦 Version     : V4 FINAL");
      console.log("💾 MongoDB     : Connected");
      console.log("💰 Gold Trading: Enabled");
      console.log("👑 Wallet APIs : Enabled");
      console.log("🪙 TRC20 Wallet: Enabled");
      console.log("========================================");
      console.log("");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
    process.exit(1);
  });