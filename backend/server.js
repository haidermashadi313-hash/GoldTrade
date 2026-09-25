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
// BASIC CONFIG
// ======================================================

const PORT = process.env.PORT || 5000;
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

if (NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );
  next();
});

// ======================================================
// CORS CONFIGURATION
// ======================================================

const allowedOrigins = [
  "http://localhost:3000",
  "https://goldtrade-v18.vercel.app",
  "https://infotradewithzoyanet.org",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS Origin:", origin);

      return callback(
        new Error(`CORS Not Allowed : ${origin}`),
        false
      );
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "Accept",
    ],
  })
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    project: "GoldTrade V18 Enterprise",
    version: "18.0.0",
    environment: NODE_ENV,
    status: "ONLINE",
    serverTime: new Date().toISOString(),
  });
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// server.js
// PART 2/5
// MongoDB Connection + Route Imports + API Registration
// ======================================================

// ======================================================
// DATABASE CONNECTION
// ======================================================

mongoose.set("strictQuery", true);

const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.DB_NAME || "goldtrade_v18",
      autoIndex: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 20,
      minPoolSize: 5,
    });

    console.log("======================================");
    console.log("MongoDB Connected Successfully");
    console.log("Database :", mongoose.connection.name);
    console.log("Host     :", mongoose.connection.host);
    console.log("======================================");
  } catch (error) {
    console.error("MongoDB Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

connectDatabase();

// ======================================================
// DATABASE EVENTS
// ======================================================

mongoose.connection.on("connected", () => {
  console.log("MongoDB Event : Connected");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB Event Error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB Event : Disconnected");
});

// ======================================================
// ROUTE IMPORTS
// ======================================================

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const walletRoutes = require("./routes/walletRoutes");
const depositRoutes = require("./routes/depositRoutes");
const withdrawRoutes = require("./routes/withdrawRoutes");
const paymentSettingsRoutes = require("./routes/paymentSettingsRoutes");

const goldRoutes = require("./routes/goldRoutes");
const usdtRoutes = require("./routes/usdtRoutes");
const marketRoutes = require("./routes/marketRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

// ======================================================
// API ROUTE REGISTRATION
// ======================================================

// Authentication
app.use("/api/auth", authRoutes);

// Wallet APIs
app.use("/api/wallet", walletRoutes);

// Deposit APIs
app.use("/api/deposit", depositRoutes);

// Withdraw APIs
app.use("/api/withdraw", withdrawRoutes);

// Payment Settings APIs
app.use("/api/payment-settings", paymentSettingsRoutes);

// Gold Trading APIs
app.use("/api/gold", goldRoutes);

// USDT Trading APIs
app.use("/api/usdt", usdtRoutes);

// Market APIs
app.use("/api/market", marketRoutes);

// Settings APIs
app.use("/api/settings", settingsRoutes);

// Transaction APIs
app.use("/api/transactions", transactionRoutes);

// Admin APIs
app.use("/api/admin", adminRoutes);

// ======================================================
// ROUTE REGISTRATION COMPLETE
// ======================================================

console.log("API Routes Registered Successfully");

// ======================================================
// GoldTrade V18 Enterprise Backend
// server.js
// PART 3/5
// API Health + Route Debugger + 404 Handler
// ======================================================

// ======================================================
// API HEALTH CHECK
// GET /api/health
// ======================================================

app.get("/api/health", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      status: "ONLINE",
      version: "V18 Enterprise",
      environment: NODE_ENV,
      database:
        mongoose.connection.readyState === 1
          ? "CONNECTED"
          : "DISCONNECTED",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ======================================================
// API ROUTE DEBUGGER
// GET /api/routes
// ======================================================

app.get("/api/routes", (req, res) => {
  const routes = [];

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path,
      });
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            method: Object.keys(handler.route.methods)[0].toUpperCase(),
            path: handler.route.path,
          });
        }
      });
    }
  });

  res.json({
    success: true,
    totalRoutes: routes.length,
    routes,
  });
});

// ======================================================
// DATABASE STATUS
// GET /api/database/status
// ======================================================

app.get("/api/database/status", (req, res) => {
  res.json({
    success: true,
    readyState: mongoose.connection.readyState,
    database: mongoose.connection.name,
    host: mongoose.connection.host,
    connected: mongoose.connection.readyState === 1,
  });
});

// ======================================================
// REQUEST NOT FOUND LOGGER
// ======================================================

app.use("/api", (req, res, next) => {
  console.log(
    `API REQUEST -> ${req.method} ${req.originalUrl}`
  );
  next();
});

// ======================================================
// PRODUCTION 404 HANDLER
// ======================================================

app.use("/api/*", (req, res) => {
  console.log(
    `404 API Route -> ${req.method} ${req.originalUrl}`
  );

  return res.status(404).json({
    success: false,
    message: "API Route Not Found",
    route: req.originalUrl,
    method: req.method,
    suggestion: "Check server.js route registration.",
  });
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// server.js
// PART 4/5
// Global Error Handler + PM2 Safe Startup
// ======================================================

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error("======================================");
  console.error("SERVER ERROR");
  console.error("URL     :", req.originalUrl);
  console.error("METHOD  :", req.method);
  console.error("MESSAGE :", err.message);
  console.error("======================================");

  if (res.headersSent) {
    return next(err);
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    route: req.originalUrl,
  });
});

// ======================================================
// START SERVER (PM2 SAFE)
// ======================================================

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("======================================");
  console.log("GoldTrade V18 Enterprise Backend");
  console.log(`Server Running : http://0.0.0.0:${PORT}`);
  console.log(`Environment    : ${NODE_ENV}`);
  console.log(`PM2 Mode       : ${process.env.pm_id ? "YES" : "NO"}`);
  console.log("======================================");
});

// ======================================================
// SERVER EVENTS
// ======================================================

server.on("error", (error) => {
  console.error("SERVER START ERROR:", error.message);
});

server.on("listening", () => {
  console.log(`Listening on Port ${PORT}`);
});

// ======================================================
// PM2 GRACEFUL SHUTDOWN
// ======================================================

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Closing GoldTrade Backend...`);

  server.close(async () => {
    try {
      await mongoose.connection.close(false);
      console.log("MongoDB Connection Closed");
    } catch (error) {
      console.error("MongoDB Close Error:", error.message);
    }

    console.log("HTTP Server Closed");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("Force Shutdown Timeout");
    process.exit(1);
  }, 10000);
};

// ======================================================
// PROCESS SIGNALS
// ======================================================

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// ======================================================
// UNCAUGHT ERRORS
// ======================================================

process.on("uncaughtException", (error) => {
  console.error("======================================");
  console.error("UNCAUGHT EXCEPTION");
  console.error(error);
  console.error("======================================");
});

process.on("unhandledRejection", (reason) => {
  console.error("======================================");
  console.error("UNHANDLED REJECTION");
  console.error(reason);
  console.error("======================================");
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// server.js
// PART 5/5
// Production Diagnostics + Startup Summary + Export
// ======================================================

// ======================================================
// PRODUCTION DIAGNOSTICS
// ======================================================

app.get("/api/system/info", (req, res) => {
  res.status(200).json({
    success: true,
    project: "GoldTrade V18 Enterprise",
    version: "18.0.0",
    environment: NODE_ENV,

    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,

    uptimeSeconds: Math.floor(process.uptime()),

    memory: {
      rss: process.memoryUsage().rss,
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
    },

    mongodb: {
      connected: mongoose.connection.readyState === 1,
      database: mongoose.connection.name,
      host: mongoose.connection.host,
    },

    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// ROUTE SUMMARY (Console Only)
// ======================================================

const printStartupSummary = () => {
  console.log("=============================================");
  console.log(" GoldTrade V18 Enterprise Backend Started");
  console.log("=============================================");
  console.log(` Environment : ${NODE_ENV}`);
  console.log(` Port        : ${PORT}`);
  console.log(` Frontend    : ${process.env.FRONTEND_URL || "Not Set"}`);
  console.log(` MongoDB     : ${mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"}`);
  console.log("---------------------------------------------");
  console.log(" Registered APIs");
  console.log("---------------------------------------------");
  console.log("/api/auth");
  console.log("/api/wallet");
  console.log("/api/deposit");
  console.log("/api/withdraw");
  console.log("/api/payment-settings");
  console.log("/api/gold");
  console.log("/api/usdt");
  console.log("/api/market");
  console.log("/api/settings");
  console.log("/api/transactions");
  console.log("/api/admin");
  console.log("/api/health");
  console.log("/api/system/info");
  console.log("/api/routes");
  console.log("=============================================");
};

mongoose.connection.once("open", () => {
  printStartupSummary();
});

// ======================================================
// KEEP RENDER / PM2 ALIVE
// ======================================================

setInterval(() => {
  if (mongoose.connection.readyState === 1) {
    console.log(
      `[KEEPALIVE] ${new Date().toLocaleTimeString()} MongoDB Connected`
    );
  } else {
    console.warn(
      `[KEEPALIVE] ${new Date().toLocaleTimeString()} MongoDB Disconnected`
    );
  }
}, 1000 * 60 * 15); // Every 15 Minutes

// ======================================================
// EXPORT EXPRESS APP
// ======================================================

module.exports = app;
