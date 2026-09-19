require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path"); 

const app = express();

// ======================================================
// APP CONFIGURATION
// ======================================================

app.use(cors());

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ======================================================
// STATIC UPLOADS
// ======================================================

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ======================================================
// BODY PARSER
// ======================================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// ======================================================
// IMPORT ROUTES (GoldTrade V18 - Linux Safe)
// ======================================================

// USER ROUTES
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/UserRoutes");
const walletRoutes = require("./routes/WalletRoutes");
const depositRoutes = require("./routes/DepositRoutes");
const withdrawRoutes = require("./routes/WithdrawRoutes");
const goldRoutes = require("./routes/GoldRoutes");
const usdtRoutes = require("./routes/UsdtRoutes");
const tradingRoutes = require("./routes/TradingRoutes");
const marketRoutes = require("./routes/MarketRoutes");
const settingsRoutes = require("./routes/SettingsRoutes");
const transactionRoutes = require("./routes/TransactionRoutes");
const paymentSettingsRoutes = require("./routes/PaymentSettingsRoutes");
const referralRoutes = require("./routes/ReferralRoutes");
const historyRoutes = require("./routes/HistoryRoutes");

// ADMIN ROUTES
const adminRoutes = require("./routes/adminRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const adminDepositRoutes = require("./routes/adminDepositRoutes");
const adminUsdtRoutes = require("./routes/adminUsdtRoutes");
const adminWalletRoutes = require("./routes/adminWalletRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");
const adminWithdrawRoutes = require("./routes/adminWithdrawRoutes");

// ==========================================
// MongoDB Atlas Connection (GoldTrade V18)
// ==========================================
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    family: 4, // Force IPv4 (TLS issue fix)
    retryWrites: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
    process.exit(1);
  });
// ======================================================
// ROOT ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "GoldTrade V18 Backend Running 🚀",
  });
});

// ======================================================
// CORS CONFIG (GoldTrade V18)
// Localhost + Vercel + Custom Domain + Render
// ======================================================

const allowedOrigins = [
  "http://localhost:3000",
  "https://frontend-cj9o6n761-flextrade-5000.vercel.app",
  "https://infotradewithzoyanet.org",
  "https://www.infotradewithzoyanet.org",
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow Postman, mobile apps and server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("CORS BLOCKED:", origin);

      return callback(new Error("CORS Not Allowed"));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ======================================================
// BODY PARSER
// ======================================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


// ======================================================
// PUBLIC API ROUTES (GoldTrade V18 Final)
// ======================================================

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/wallet", walletRoutes);

app.use("/api/deposit", depositRoutes);

app.use("/api/withdraw", withdrawRoutes);

app.use("/api/usdt", usdtRoutes);

app.use("/api/gold", goldRoutes);

app.use("/api/trading", tradingRoutes);

app.use("/api/market", marketRoutes);

app.use("/api/settings", settingsRoutes);

app.use("/api/transactions", transactionRoutes);

app.use("/api/payment-settings", paymentSettingsRoutes);

app.use("/api/referrals", referralRoutes);

app.use("/api/history", historyRoutes);

// ======================================================
// ADMIN API ROUTES
// ======================================================

app.use("/api/admin", adminRoutes);

app.use("/api/admin/dashboard", adminDashboardRoutes);

app.use("/api/admin/deposits", adminDepositRoutes);

app.use("/api/admin/withdraws", adminWithdrawRoutes);

app.use("/api/admin/wallet", adminWalletRoutes);

app.use("/api/admin/users", adminUserRoutes);

app.use("/api/admin/usdt", adminUsdtRoutes);

// ======================================================
// 404 API ROUTE
// ======================================================

app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});
// ===========================================
// TEMP FIX Pkr wallet (DELETE AFTER USE)
// ===========================================
const wallet = require("./models/wallet");

app.get("/fix-Pkr", async (req, res) => {
  try {
    const result = await wallet.updateMany(
      { PkrBalance: { $exists: false } },
      { $set: { PkrBalance: 0 } }
    );

    res.json({
      success: true,
      repaired: result.modifiedCount,
      matched: result.matchedCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});
// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ======================================================
// SERVER START (GoldTrade V18)
// ======================================================

const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log("==================================================");
  console.log("🚀 GoldTrade V18 Backend Started Successfully");
  console.log("==================================================");
  console.log(`🌍 Environment : ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 Host        : ${HOST}`);
  console.log(`🚪 Port        : ${PORT}`);
  console.log(`❤️ Health API  : /api/health`);
  console.log(`📊 Status API  : /api/status`);
  console.log(`💰 Gold API    : /api/gold/price`);
  console.log(`💵 USDT API    : /api/usdt/rate`);
  console.log("==================================================");
});
