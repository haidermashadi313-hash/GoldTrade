// ======================================================
// GoldTrade V18 Enterprise Backend
// server.js — PART 1/4
// Production Ready (Render + Ubuntu + PM2 + Vercel)
// ======================================================

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const app = express();

// ======================================================
// APP CONFIGURATION
// ======================================================

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";

// ======================================================
// TRUST PROXY (Render / Nginx / PM2)
// ======================================================

app.set("trust proxy", 1);
app.disable("x-powered-by");

// ======================================================
// SECURITY MIDDLEWARE
// ======================================================

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

app.use(compression());

// ======================================================
// BODY PARSER
// ======================================================

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ======================================================
// LOGGER
// ======================================================

app.use(
  morgan(NODE_ENV === "production" ? "combined" : "dev")
);

// ======================================================
// RATE LIMITER
// ======================================================

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === "production" ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use("/api", apiLimiter);
// ======================================================
// CORS CONFIGURATION
// PART 2/4
// Render + Vercel + Localhost Safe
// ======================================================

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",

  // Production Domain
  "https://infotradewithzoyanet.org",
  "https://www.infotradewithzoyanet.org",
];

// Allow *.vercel.app preview deployments
const vercelPreviewRegex = /^https:\/\/.*\.vercel\.app$/;

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman, Mobile Apps, Server-to-Server requests
      if (!origin) return callback(null, true);

      if (
        allowedOrigins.includes(origin) ||
        vercelPreviewRegex.test(origin)
      ) {
        return callback(null, true);
      }

      console.warn(`❌ Blocked CORS Origin: ${origin}`);

      return callback(
        new Error(`CORS blocked for origin: ${origin}`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
    ],
  })
);

// Handle Preflight Requests
app.options("*", cors());

// ======================================================
// EXTRA SECURITY HEADERS
// ======================================================

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader(
    "Referrer-Policy",
    "strict-origin-when-cross-origin"
  );

  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  next();
});

// ======================================================
// HEALTH ROUTES
// ======================================================

// Root Route
app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    application: "GoldTrade V18 Enterprise Backend",
    version: "18.0.0",
    environment: NODE_ENV,
    status: "ONLINE",
    mongodb:
      mongoose.connection.readyState === 1
        ? "CONNECTED"
        : "DISCONNECTED",
    timestamp: new Date().toISOString(),
  });
});

// Health Check (Render/UptimeRobot)
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    status: "OK",
    uptime: Math.floor(process.uptime()),
    mongodb:
      mongoose.connection.readyState === 1
        ? "CONNECTED"
        : "DISCONNECTED",
    memory: {
      rss: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
    },
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// API Status
app.get("/api/status", (req, res) => {
  return res.status(200).json({
    success: true,
    backend: "GoldTrade V18 Enterprise",
    version: "18.0.0",
    mongodb:
      mongoose.connection.readyState === 1
        ? "CONNECTED"
        : "DISCONNECTED",
    uptime: Math.floor(process.uptime()),
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// MONGODB CONNECTION
// Atlas + Render Safe
// ======================================================

const connectMongoDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is missing.");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 20,
    });

    console.log("✅ MongoDB Atlas Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

// Connect Database
connectMongoDB();

// ======================================================
// MONGOOSE EVENTS
// ======================================================

mongoose.connection.on("connected", () => {
  console.log("🟢 MongoDB Connected");
});

mongoose.connection.on("disconnected", () => {
  console.log("🟡 MongoDB Disconnected");
});

mongoose.connection.on("error", (error) => {
  console.error("🔴 MongoDB Error:", error.message);
});
// ======================================================
// ROUTES IMPORT
// PART 3/4
// GoldTrade V18 Enterprise
// ======================================================

// ---------------- AUTH ----------------
const authRoutes = require("./routes/authRoutes");

// ---------------- USERS ----------------
const userRoutes = require("./routes/userRoutes");

// ---------------- WALLET ----------------
const walletRoutes = require("./routes/walletRoutes");

// ---------------- DEPOSIT ----------------
const depositRoutes = require("./routes/depositRoutes");

// ---------------- WITHDRAW ----------------
const withdrawRoutes = require("./routes/withdrawRoutes");

// ---------------- GOLD ----------------
const goldRoutes = require("./routes/goldRoutes");

// ---------------- MARKET ----------------
const marketRoutes = require("./routes/marketRoutes");

// ---------------- TRANSACTIONS ----------------
const transactionRoutes = require("./routes/transactionRoutes");

// ---------------- USDT ----------------
const usdtRoutes = require("./routes/usdtRoutes");

// ---------------- ADMIN ----------------
const adminRoutes = require("./routes/adminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
// ---------------- PAYMENT SETTINGS ----------------
const paymentSettingsRoutes = require("./routes/paymentSettingsRoutes");

// ======================================================
// API ROUTES
// GoldTrade V18 Enterprise
// ======================================================

// ---------- AUTH ----------
app.use("/api/auth", authRoutes);

// ---------- USER ----------
app.use("/api/user", userRoutes);

// ---------- WALLET ----------
app.use("/api/wallet", walletRoutes);

// ---------- DEPOSIT ----------
app.use("/api/deposit", depositRoutes);

// ---------- WITHDRAW (User + Admin) ----------
app.use("/api/withdraw", withdrawRoutes);
app.use("/api/gold/admin/withdraws", withdrawRoutes);

// ---------- GOLD ----------
app.use("/api/gold", goldRoutes);

// ---------- MARKET ----------
app.use("/api/market", marketRoutes);

// ---------- TRANSACTIONS ----------
app.use("/api/transactions", transactionRoutes);

// ---------- USDT ----------
app.use("/api/usdt", usdtRoutes);

// ---------- ADMIN DASHBOARD ----------
app.use("/api/admin/dashboard", adminDashboardRoutes);

// ---------- OTHER ADMIN ----------
app.use("/api/admin", adminRoutes);

// ---------- PAYMENT SETTINGS ----------
app.use("/api/payment-settings", paymentSettingsRoutes);

// ======================================================
// API ROUTES LIST (Debug Only)
// ======================================================

app.get("/api/routes", (req, res) => {
  return res.status(200).json({
    success: true,
    version: "GoldTrade V18 Enterprise",
    totalRoutes: 13,

    routes: {
      auth: "/api/auth",
      user: "/api/user",
      wallet: "/api/wallet",

      deposit: "/api/deposit",
      withdraw: "/api/withdraw",

      gold: "/api/gold",
      usdt: "/api/usdt",
      market: "/api/market",

      transactions: "/api/transactions",

      admin: "/api/admin",
      adminDashboard: "/api/admin/dashboard", 
      paymentSettings: "/api/payment-settings",
    },

    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// 404 NOT FOUND HANDLER
// ======================================================

app.use((req, res) => {
  return res.status(404).json({
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
  console.error("SERVER ERROR:", err);

  return res.status(err.status || 500).json({
    success: false,
    message:
      NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
    timestamp: new Date().toISOString(),
  });
});
// ======================================================
// START SERVER
// PART 4/4 FINAL
// Production Ready (Render + PM2 + Ubuntu Linux)
// ======================================================

const startServer = async () => {
  try {
    const server = app.listen(PORT, HOST, () => {
      console.log("==================================================");
      console.log("🚀 GoldTrade V18 Enterprise Backend Started");
      console.log(`🌐 Server : http://${HOST}:${PORT}`);
      console.log(`📦 Environment : ${NODE_ENV}`);
      console.log(`🟢 MongoDB : ${mongoose.connection.readyState === 1 ? "CONNECTED" : "CONNECTING"}`);
      console.log(`🛡️ PM2 : ${process.env.pm_id ? "Enabled" : "Disabled"}`);
      console.log("==================================================");
    });

    // ======================================================
    // SERVER EVENTS
    // ======================================================

    server.on("listening", () => {
      console.log(`✅ Backend Listening on Port ${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use.`);
      } else {
        console.error("❌ Server Error:", error.message);
      }

      process.exit(1);
    });

    // ======================================================
    // GRACEFUL SHUTDOWN
    // ======================================================

    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 ${signal} received. Shutting down GoldTrade Backend...`);

      try {
        await new Promise((resolve) => server.close(resolve));
        console.log("✅ HTTP Server Closed");

        if (mongoose.connection.readyState !== 0) {
          await mongoose.connection.close();
          console.log("✅ MongoDB Connection Closed");
        }

        console.log("👋 GoldTrade Backend Shutdown Complete");
        process.exit(0);
      } catch (shutdownError) {
        console.error("❌ Shutdown Error:", shutdownError.message);
        process.exit(1);
      }
    };

    // ======================================================
    // PROCESS SIGNALS
    // ======================================================

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2"));

    // ======================================================
    // UNHANDLED ERRORS
    // ======================================================

    process.on("unhandledRejection", (reason) => {
      console.error("❌ UNHANDLED REJECTION");
      console.error(reason);
    });

    process.on("uncaughtException", (error) => {
      console.error("❌ UNCAUGHT EXCEPTION");
      console.error(error);

      process.exit(1);
    });

    // ======================================================
    // KEEP ALIVE LOGS (Render Safe)
    // ======================================================

    process.on("beforeExit", (code) => {
      console.log(`⚠️ beforeExit with code ${code}`);
    });

    process.on("exit", (code) => {
      console.log(`🔴 GoldTrade Backend exited with code ${code}`);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// ======================================================
// START APPLICATION
// ======================================================

startServer();