// ==========================
// ROOT API
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
    environment: process.env.NODE_ENV || "development",
    serverTime: new Date(),
  });
});

// ==========================
// HEALTH CHECK (MUST BE BEFORE API ROUTES & 404)
// ==========================
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "GoldTrade API Running",
    version: "V4 FINAL",
    status: "ONLINE",
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// ==========================
// STATUS API
// ==========================
app.get("/api/status", (req, res) => {
  res.status(200).json({
    success: true,
    version: "V4 FINAL",
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    mongodb:
      mongoose.connection.readyState === 1
        ? "Connected"
        : "Disconnected",
    timestamp: new Date(),
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
// 404 HANDLER (LAST ROUTE)
// ==========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Route Not Found",
    path: req.originalUrl,
    method: req.method,
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