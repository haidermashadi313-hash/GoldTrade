const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// =======================================================
// IMPORT ROUTES
// =======================================================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const walletRoutes = require("./routes/walletRoutes");
const depositRoutes = require("./routes/depositRoutes");
const withdrawRoutes = require("./routes/withdrawRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const usdtRoutes = require("./routes/usdtRoutes");
const goldRoutes = require("./routes/goldRoutes");

// =======================================================
// CREATE UPLOAD FOLDERS
// =======================================================
const uploadFolder = path.join(__dirname, "uploads");
const receiptFolder = path.join(uploadFolder, "receipts");
const qrFolder = path.join(uploadFolder, "qr");
const settingsFolder = path.join(uploadFolder, "settings");

[uploadFolder, receiptFolder, qrFolder, settingsFolder].forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

// =======================================================
// CORS (LOCAL + VERCEL + DOMAIN)
// =======================================================
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  process.env.DOMAIN_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Launch version
      }
    },
    credentials: true,
  })
);

// =======================================================
// EXPRESS MIDDLEWARE
// =======================================================
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// =======================================================
// STATIC FILES
// =======================================================
app.use("/uploads", express.static(uploadFolder));

// =======================================================
// HEALTH CHECK
// =======================================================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    app: "GoldTrade Backend",
    version: "V4 FINAL",
    status: "ONLINE",
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    serverTime: new Date(),
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    version: "V4 FINAL",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
  });
});

// =======================================================
// API ROUTES
// =======================================================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallets", walletRoutes);

app.use("/api/deposit", depositRoutes);
app.use("/api/withdraw", withdrawRoutes);

app.use("/api/settings", settingsRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/usdt", usdtRoutes);
app.use("/api/gold", goldRoutes);
// =======================================================
// 404 API HANDLER
// =======================================================
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API Route Not Found",
    path: req.originalUrl,
    timestamp: new Date(),
  });
});

// =======================================================
// GLOBAL ERROR HANDLER
// =======================================================
app.use((err, req, res, next) => {
  console.error("======================================");
  console.error("❌ GLOBAL SERVER ERROR");
  console.error(err.stack || err.message);
  console.error("======================================");

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : undefined,
  });
});

// =======================================================
// CONNECT MONGODB & START SERVER
// =======================================================
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log("");
      console.log("========================================");
      console.log("🚀 GoldTrade Backend Started");
      console.log(`🌍 Port        : ${PORT}`);
      console.log(`🌐 Environment : ${process.env.NODE_ENV || "development"}`);
      console.log("💾 MongoDB     : Connected");
      console.log("💰 Gold Trading: Enabled");
      console.log("👑 Wallet APIs : Enabled");
      console.log("🪙 TRC20 Wallet: Enabled");
      console.log("========================================");
      console.log("");
    });
  })
  .catch((err) => {
    console.error("========================================");
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
    console.error("========================================");
    process.exit(1);
  });