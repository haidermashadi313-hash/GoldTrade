const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

/* =========================================================
   GOLDTRADE V4 FINAL - PRODUCTION SERVER
========================================================= */

// ==========================
// Routes
// ==========================
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

// ==========================
// Upload Folders
// ==========================
const uploadFolder = path.join(__dirname, "uploads");
const folders = [
  uploadFolder,
  path.join(uploadFolder, "receipts"),
  path.join(uploadFolder, "qr"),
  path.join(uploadFolder, "settings"),
];

folders.forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

// ==========================
// CORS
// ==========================
const allowedOrigins = [
  "http://localhost:3000",
  "https://goldtrade.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("⚠️ CORS Request:", origin);
      return callback(null, true);
    },
    credentials: true,
  })
);

// ==========================
// Middleware
// ==========================
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ==========================
// Static Files
// ==========================
app.use("/uploads", express.static(uploadFolder));

// ==========================
// Root Health Check
// ==========================
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
    time: new Date(),
  });
});

// ==========================
// API Status
// ==========================
app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    environment: process.env.NODE_ENV,
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    uptime: process.uptime(),
    version: "V4 FINAL",
  });
});

// ==========================
// API Routes
// ==========================
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

// ==========================
// 404 Handler
// ==========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
    route: req.originalUrl,
  });
});

// ==========================
// Global Error Handler
// ==========================
app.use((err, req, res, next) => {
  console.error("❌ GLOBAL SERVER ERROR");
  console.error(err.stack || err.message);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : undefined,
  });
});

// ==========================
// MongoDB Connection
// ==========================
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
  })
  .then(() => {
    console.log("====================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("====================================");

    const PORT = process.env.PORT || 10000;

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log("====================================");
      console.log("🚀 GOLDTRADE BACKEND LIVE");
      console.log(`🌐 Port: ${PORT}`);
      console.log(`🌍 Mode: ${process.env.NODE_ENV}`);
      console.log("💰 Gold Trading API Enabled");
      console.log("👑 Wallet API Enabled");
      console.log("🪙 USDT API Enabled");
      console.log("====================================");
    });

    // Render 502 timeout fix
    server.keepAliveTimeout = 120000;
    server.headersTimeout = 121000;
  })
  .catch((err) => {
    console.error("====================================");
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
    console.error("====================================");
    process.exit(1);
  });