// =====================================================
// GoldTrade V18 Enterprise Backend
// SERVER.JS — PART 1/3
// Production Ready (Render + Vercel)
// =====================================================

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// =====================================================
// CORS CONFIGURATION (Production)
// =====================================================

const allowedOrigins = [
  "http://localhost:3000",
  "https://infotradewithzoyanet.org",
  "https://haidermashadi313-hash-goldtrade-git-main-flextrade-5000.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server requests
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS Origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Handle preflight requests
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
// DATABASE CONNECTION
// =====================================================

if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI missing inside .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(() => {
    console.log("====================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("====================================");
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
    environment:
      process.env.NODE_ENV || "development",

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
    environment:
      process.env.NODE_ENV || "development",

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

// ---------- PUBLIC ROUTES ----------
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

// ---------- ADMIN ROUTES ----------
const adminRoutes = require("./routes/adminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminUsersRoutes = require("./routes/adminUsersRoutes");
const adminGoldRoutes = require("./routes/adminGoldRoutes");
const adminUsdtRoutes = require("./routes/adminUsdtRoutes");

// =====================================================
// API REQUEST LOGGER (Optional)
// =====================================================

app.use("/api", (req, res, next) => {
  console.log(`📡 API -> ${req.method} ${req.originalUrl}`);
  next();
});

// =====================================================
// PUBLIC API ROUTES
// =====================================================

// ---------- Authentication ----------
app.use("/api/auth", authRoutes);

// ---------- Users ----------
app.use("/api/users", userRoutes);

// ---------- Wallet (USER + ADMIN) ----------
app.use("/api/wallet", walletRoutes);
app.use("/api/admin/wallet", walletRoutes);

// ---------- Gold ----------
app.use("/api/gold", goldRoutes);

// ---------- USDT ----------
app.use("/api/usdt", usdtRoutes);

// ---------- Deposits (USER + ADMIN) ----------
app.use("/api/deposit", depositRoutes);
app.use("/api/admin/deposits", depositRoutes);

// ---------- Withdraws (USER + ADMIN) ----------
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/admin/withdraws", withdrawRoutes);

// ---------- Market ----------
app.use("/api/market", marketRoutes);

// ---------- Settings ----------
app.use("/api/settings", settingsRoutes);

// ---------- Transactions ----------
app.use("/api/transactions", transactionRoutes);

// ---------- Payment Settings ----------
app.use("/api/payment-settings", paymentSettingsRoutes);

// =====================================================
// ADMIN API ROUTES
// =====================================================

// Authentication + Admin Panel
app.use("/api/admin", adminRoutes);

// Dashboard Statistics
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
  console.error(err);
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
  console.log(`🌐 Server     : http://0.0.0.0:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🗄️ MongoDB    : ${
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
// EXPORT EXPRESS APP
// =====================================================

module.exports = app;