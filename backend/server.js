const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

/* =========================================================
   GOLDTRADE V4 FINAL - RENDER + VERCEL PRODUCTION SERVER
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

[
  uploadFolder,
  path.join(uploadFolder, "receipts"),
  path.join(uploadFolder, "qr"),
  path.join(uploadFolder, "settings"),
].forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
});

// ==========================
// CORS
// ==========================
const allowedOrigins = [
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.DOMAIN_URL,
  "https://www.infotradewithzoyanet.org",
  "https://infotradewithzoyanet.org",
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
// Static Uploads
// ==========================
app.use("/uploads", express.static(uploadFolder));

// ==========================
// ROOT API
// ==========================
app.get("/", (req, res) => {
  res.json({
    success: true,
    app: "GoldTrade Backend",
    version: "V4 FINAL",
    status: "ONLINE",
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    environment: process.env.NODE_ENV || "development",
    serverTime: new Date(),
  });
});

// ==========================
// HEALTH CHECK (IMPORTANT FIX)
// ==========================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GoldTrade API Running",
    version: "V4 FINAL",
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date(),
  });
});

// ==========================
// STATUS API
// ==========================
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

// ==========================
// API ROUTES
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
// 404 HANDLER
// ==========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
    path: req.originalUrl,
    timestamp: new Date(),
  });
});

// ==========================
// GLOBAL ERROR HANDLER
// ==========================
app.use((err, req, res, next) => {
  console.error("====================================");
  console.error("❌ GLOBAL SERVER ERROR");
  console.error(err.stack || err.message);
  console.error("====================================");

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
// PORT
// ==========================
const PORT = process.env.PORT || 10000;

// ==========================
// START SERVER
// ==========================
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("====================================");
  console.log("🚀 GOLDTRADE BACKEND STARTED");
  console.log(`🌍 Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 Listening on Port : ${PORT}`);
  console.log("====================================");
});

// Render Keep Alive
server.keepAliveTimeout = 120000;
server.headersTimeout = 121000;

// ==========================
// MONGODB CONNECTION
// ==========================
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
  })
  .then(() => {
    console.log("====================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("====================================");
  })
  .catch((err) => {
    console.error("====================================");
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
    console.error("====================================");
  });

// ==========================
// GRACEFUL SHUTDOWN
// ==========================
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Closing server...");

  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB Closed.");
      process.exit(0);
    });
  });
});