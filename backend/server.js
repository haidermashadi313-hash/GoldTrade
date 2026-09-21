require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} | ${req.method} | ${req.originalUrl}`
  );
  next();
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GoldTrade V18 Enterprise Backend Running",
    version: "V18 Enterprise",
    status: "ONLINE",
  });
});
// =====================================================
// DATABASE CONNECTION
// =====================================================

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/goldtrade";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err.message);
    process.exit(1);
  });

// =====================================================
// ROUTE IMPORTS
// =====================================================

// Authentication
const authRoutes = require("./routes/authRoutes");

// User
const userRoutes = require("./routes/userRoutes");

// Wallet
const walletRoutes = require("./routes/walletRoutes");

// Deposit / Withdraw
const depositRoutes = require("./routes/depositRoutes");
const withdrawRoutes = require("./routes/withdrawRoutes");

// Gold
const goldRoutes = require("./routes/goldRoutes");

// Market / Settings
const marketRoutes = require("./routes/marketRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

// Transactions
const transactionRoutes = require("./routes/transactionRoutes");

// ================= ADMIN ROUTES =================

const adminRoutes = require("./routes/adminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminWalletRoutes = require("./routes/adminWalletRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminGoldRoutes = require("./routes/adminGoldRoutes");
const adminUsdtRoutes = require("./routes/adminUsdtRoutes");

// =====================================================
// API ROUTES
// =====================================================

// PUBLIC ROUTES

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/api/deposit", depositRoutes);
app.use("/api/withdraw", withdrawRoutes);

app.use("/api/gold", goldRoutes);

app.use("/api/market", marketRoutes);
app.use("/api/settings", settingsRoutes);

app.use("/api/transactions", transactionRoutes);

// =====================================================
// ADMIN ROUTES
// =====================================================

app.use("/api/admin", adminRoutes);

app.use("/api/admin/dashboard", adminDashboardRoutes);

app.use("/api/admin/wallet", adminWalletRoutes);

app.use("/api/admin/users", adminUserRoutes);

app.use("/api/admin/gold", adminGoldRoutes);

app.use("/api/admin/usdt", adminUsdtRoutes);

// =====================================================
// ROUTE TEST API
// =====================================================

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    backend: "GoldTrade V18 Enterprise",
    database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    uptime: process.uptime(),
  });
});
// =====================================================
// CORS HEADERS (FRONTEND + RENDER + VERCEL)
// =====================================================

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// =====================================================
// TOKEN / AUTH ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  if (
    err.name === "UnauthorizedError" ||
    err.name === "JsonWebTokenError"
  ) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }

  next(err);
});

// =====================================================
// VALIDATION ERROR HANDLER
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
// MONGODB CAST ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format.",
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
  console.error("GLOBAL SERVER ERROR");
  console.error(err);

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
// =====================================================
// SERVER CONFIGURATION
// =====================================================

const PORT = process.env.PORT || 5000;

// =====================================================
// START SERVER
// =====================================================

const server = app.listen(PORT, () => {
  console.log("=========================================");
  console.log("🚀 GoldTrade V18 Enterprise Backend");
  console.log("=========================================");
  console.log(`🌐 Server URL : http://localhost:${PORT}`);
  console.log(`📦 Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`🕒 Started At : ${new Date().toLocaleString()}`);
  console.log("=========================================");
});

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Closing server...`);

  try {
    server.close(() => {
      console.log("✅ HTTP Server Closed");
    });

    await mongoose.connection.close();
    console.log("✅ MongoDB Connection Closed");

    process.exit(0);
  } catch (error) {
    console.error("Shutdown Error:", error);
    process.exit(1);
  }
};

// =====================================================
// PROCESS EVENTS
// =====================================================

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// =====================================================
// UNCAUGHT ERROR HANDLING
// =====================================================

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION");
  console.error(error);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED PROMISE REJECTION");
  console.error(reason);
});

// =====================================================
// EXPORT APP (Optional for testing)
// =====================================================

module.exports = app;