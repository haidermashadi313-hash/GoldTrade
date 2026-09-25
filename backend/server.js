// =====================================================
// GoldTrade V18 Enterprise Backend
// SERVER.JS - PART 1/4
// =====================================================

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// =====================================================
// CORS CONFIGURATION
// =====================================================

const allowedOrigins = [
  "https://infotradewithzoyanet.org",
  "https://www.infotradewithzoyanet.org",

  "https://haidermashadi313-hash-goldtrade-git-main-flextrade-5000.vercel.app",
  "https://haidermashadi313-hash-goldtrade-8hhubh2uq-flextrade-5000.vercel.app",

  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        console.log("✅ Allowed CORS:", origin);
        return callback(null, true);
      }

      console.log("❌ Blocked CORS:", origin);
      callback(new Error("CORS policy does not allow this origin"));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "Accept",
    ],
  })
);

// OPTIONS Requests
app.options("*", cors());

// =====================================================
// BODY PARSER
// =====================================================

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );
  next();
});
// =====================================================
// GoldTrade V18 Enterprise Backend
// SERVER.JS — PART 2/4
// MongoDB + Health APIs + Route Imports
// =====================================================

// =====================================================
// DATABASE CONNECTION
// =====================================================

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI is missing.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("========================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("========================================");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
    process.exit(1);
  });

// =====================================================
// ROOT HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    backend: "GoldTrade V18 Enterprise",
    version: "V18",
    status: "ONLINE",
    environment: process.env.NODE_ENV || "development",
    database:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// API STATUS
// =====================================================

app.get("/api/status", (req, res) => {
  res.status(200).json({
    success: true,
    backend: "GoldTrade V18 Enterprise",
    version: "V18 Enterprise",
    environment: process.env.NODE_ENV || "development",
    database:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// ROUTE IMPORTS
// =====================================================

// PUBLIC ROUTES
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const walletRoutes = require("./routes/walletRoutes");
const depositRoutes = require("./routes/depositRoutes");
const withdrawRoutes = require("./routes/withdrawRoutes");
const goldRoutes = require("./routes/goldRoutes");
const usdtRoutes = require("./routes/usdtRoutes");
const marketRoutes = require("./routes/marketRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const paymentSettingsRoutes = require("./routes/paymentSettingsRoutes");

// ADMIN ROUTES
const adminRoutes = require("./routes/adminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminUsersRoutes = require("./routes/adminUsersRoutes");
const adminGoldRoutes = require("./routes/adminGoldRoutes");
const adminUsdtRoutes = require("./routes/adminUsdtRoutes");

// =====================================================
// API LOGGER
// =====================================================

app.use("/api", (req, res, next) => {
  console.log(`📡 API -> ${req.method} ${req.originalUrl}`);
  next();
});
// =====================================================
// GoldTrade V18 Enterprise Backend
// SERVER.JS — PART 3/4
// ALL API ROUTES (USER + ADMIN)
// =====================================================

// =====================================================
// PUBLIC API ROUTES
// =====================================================

// Authentication
app.use("/api/auth", authRoutes);

// Users
app.use("/api/users", userRoutes);

// Wallet
app.use("/api/wallet", walletRoutes);
app.use("/api/admin/wallet", walletRoutes);

// Gold Trading
app.use("/api/gold", goldRoutes);

// USDT Trading
app.use("/api/usdt", usdtRoutes);

// Deposits
app.use("/api/deposit", depositRoutes);
app.use("/api/admin/deposits", depositRoutes);

// Withdraws
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/admin/withdraws", withdrawRoutes);

// Market
app.use("/api/market", marketRoutes);

// Settings
app.use("/api/settings", settingsRoutes);

// Transactions
app.use("/api/transactions", transactionRoutes);

// Payment Settings
app.use("/api/payment-settings", paymentSettingsRoutes);

// =====================================================
// ADMIN API ROUTES
// =====================================================

// Main Admin Routes
app.use("/api/admin", adminRoutes);

// Dashboard
app.use("/api/admin/dashboard", adminDashboardRoutes);

// Users Management
app.use("/api/admin/users", adminUsersRoutes);

// Gold Management
app.use("/api/admin/gold", adminGoldRoutes);

// USDT Management
app.use("/api/admin/usdt", adminUsdtRoutes);

// =====================================================
// PAYMENT SETTINGS LOGGER
// =====================================================

app.use("/api/payment-settings", (req, res, next) => {
  console.log(
    `💳 PAYMENT SETTINGS -> ${req.method} ${req.originalUrl}`
  );
  next();
});
// =====================================================
// GoldTrade V18 Enterprise Backend
// SERVER.JS — PART 4/4 (FINAL)
// Error Handlers + Server Start + Shutdown
// =====================================================

// =====================================================
// JWT / AUTH ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  if (
    err.name === "JsonWebTokenError" ||
    err.name === "TokenExpiredError" ||
    err.name === "UnauthorizedError"
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token.",
    });
  }

  next(err);
});

// =====================================================
// MONGOOSE VALIDATION ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed.",
      errors: err.errors,
    });
  }

  next(err);
});

// =====================================================
// INVALID MONGODB OBJECT ID HANDLER
// =====================================================

app.use((err, req, res, next) => {
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid MongoDB Object ID.",
    });
  }

  next(err);
});

// =====================================================
// 404 API HANDLER
// =====================================================

app.use("/api/*", (req, res) => {
  return res.status(404).json({
    success: false,
    message: `API Not Found: ${req.originalUrl}`,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("========================================");
  console.error("GLOBAL SERVER ERROR");
  console.error(err.message || err);
  console.error("========================================");

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// =====================================================
// SERVER START
// =====================================================

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");
  console.log("🚀 GoldTrade V18 Enterprise Backend");
  console.log("========================================");
  console.log(`🌐 Server      : http://0.0.0.0:${PORT}`);
  console.log(`📦 Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🗄️ MongoDB      : ${
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Connecting..."
    }`
  );
  console.log("========================================");
});

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Closing server...`);

  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log("✅ MongoDB Connection Closed");
    } catch (error) {
      console.error("MongoDB Close Error:", error.message);
    }

    console.log("✅ HTTP Server Closed");
    process.exit(0);
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// =====================================================
// UNHANDLED ERRORS
// =====================================================

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION");
  console.error(error);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION");
  console.error(reason);
});

// =====================================================
// EXPORT APP
// =====================================================

module.exports = app;