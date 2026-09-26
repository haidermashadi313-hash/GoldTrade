// ======================================================
// GoldTrade V18 Enterprise Backend
// server.js
// PART 1/5
// Production Ready (Render + Ubuntu + PM2 + Vercel)
// ======================================================

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const app = express();

// ======================================================
// BASIC CONFIG (DECLARE ONLY ONCE)
// ======================================================

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || "0.0.0.0";
const NODE_ENV = process.env.NODE_ENV || "development";

// ======================================================
// SECURITY MIDDLEWARE
// ======================================================

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(compression());

// ======================================================
// BODY PARSER
// ======================================================

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ======================================================
// REQUEST LOGGER
// ======================================================

app.use(
  morgan(NODE_ENV === "production" ? "combined" : "dev")
);

// ======================================================
// CORS CONFIGURATION (RENDER + VERCEL SAFE)
// PART 2/5
// ======================================================

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",

  // Vercel Frontend
  "https://infotradewithzoyanet.org",
  "https://www.infotradewithzoyanet.org",

  // Vercel Preview URLs
  /\.vercel\.app$/,
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const allowed = allowedOrigins.some((item) => {
        if (item instanceof RegExp) return item.test(origin);
        return item === origin;
      });

      if (allowed) {
        return callback(null, true);
      }

      console.warn("Blocked CORS Origin:", origin);
      return callback(new Error("CORS Not Allowed"));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-requested-with",
    ],
  })
);

// Handle OPTIONS requests
app.options("*", cors());

// ======================================================
// HEALTH CHECK ROUTES
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GoldTrade V18 Backend Running",
    environment: NODE_ENV,
    status: "OK",
    version: "18.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    mongodb:
      mongoose.connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// MONGODB CONNECTION (ATLAS + RENDER SAFE)
// ======================================================

const connectMongoDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables.");
    }

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log("MongoDB Atlas Connected Successfully");

  } catch (error) {
    console.error("MongoDB Connection Error:", error.message);

    // Render restart karega
    process.exit(1);
  }
};

// Connect immediately
connectMongoDB();

// MongoDB Events
mongoose.connection.on("connected", () => {
  console.log("MongoDB Connected");
});

mongoose.connection.on("error", (error) => {
  console.error("MongoDB Error:", error.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB Disconnected");
});
// ======================================================
// ROUTES IMPORT (PART 3/5)
// ======================================================

// Authentication
const authRoutes = require("./routes/authRoutes");

// User
const userRoutes = require("./routes/userRoutes");

// Wallet
const walletRoutes = require("./routes/walletRoutes");

// Deposit
const depositRoutes = require("./routes/depositRoutes");

// Withdraw
const withdrawRoutes = require("./routes/withdrawRoutes");

// Gold Trading
const goldRoutes = require("./routes/goldRoutes");

// Market
const marketRoutes = require("./routes/marketRoutes");

// Transactions
const transactionRoutes = require("./routes/transactionRoutes");

// Admin
const adminRoutes = require("./routes/adminRoutes");

// Payment Settings
const paymentSettingsRoutes = require("./routes/paymentSettingsRoutes");

// ======================================================
// API ROUTES
// ======================================================

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

app.use("/api/wallet", walletRoutes);
app.use("/api/deposit", depositRoutes);
app.use("/api/withdraw", withdrawRoutes);

app.use("/api/gold", goldRoutes);
app.use("/api/market", marketRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/admin", adminRoutes);
app.use("/api/payment-settings", paymentSettingsRoutes);

// ======================================================
// API STATUS ROUTE
// ======================================================

app.get("/api/status", (req, res) => {
  res.json({
    success: true,
    backend: "GoldTrade V18 Enterprise",
    environment: NODE_ENV,
    mongodb:
      mongoose.connection.readyState === 1
        ? "CONNECTED"
        : "DISCONNECTED",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
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
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(err.status || 500).json({
    success: false,
    message:
      NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});
// ======================================================
// TRUST PROXY (RENDER SAFE)
// ======================================================

// Render reverse proxy ke peeche chalta hai
app.set("trust proxy", 1);

// ======================================================
// RATE LIMITER
// ======================================================

const rateLimit = require("express-rate-limit");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
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
// SECURITY HEADERS
// ======================================================

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ======================================================
// REQUEST LOGGER
// ======================================================

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );
  next();
});
// ======================================================
// START SERVER (FINAL PRODUCTION)
// PART 5/5
// ======================================================

const server = app.listen(PORT, HOST, () => {
  console.log("======================================");
  console.log("🚀 GoldTrade V18 Enterprise Backend");
  console.log(`Server Running : http://${HOST}:${PORT}`);
  console.log(`Environment    : ${NODE_ENV}`);
  console.log(`PM2 Mode       : ${process.env.pm_id ? "YES" : "NO"}`);
  console.log("======================================");
});

// ======================================================
// SERVER EVENTS
// ======================================================

server.on("listening", () => {
  console.log(`✅ Listening on Port ${PORT}`);
});

server.on("error", (error) => {
  console.error("❌ SERVER START ERROR:", error.message);
});

// ======================================================
// GRACEFUL SHUTDOWN (RENDER / PM2 SAFE)
// ======================================================

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Closing GoldTrade Backend...`);

  server.close(async () => {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.close(false);
        console.log("MongoDB Connection Closed");
      }
    } catch (error) {
      console.error("MongoDB Close Error:", error.message);
    }

    console.log("HTTP Server Closed");
    process.exit(0);
  });
};

// ======================================================
// PROCESS EVENTS
// ======================================================

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

process.on("unhandledRejection", (error) => {
  console.error("UNHANDLED REJECTION:", error);
});

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);
});