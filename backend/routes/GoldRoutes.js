// =====================================================
// GOLDTRADE V19 - GOLD ROUTES (PART 1/8)
// Imports + Router + Middleware + Test Routes
// =====================================================

const express = require("express");
const router = express.Router();

// ================= Models =================
const User = require("../models/User");
const Settings = require("../models/Settings");
const GoldTrade = require("../models/Goldtrade");
const Transaction = require("../models/Transaction");

// ================= Middleware =================
const { verifyToken, isAdmin } = require("../middleware/auth");

// =====================================================
// TEST ROUTE
// GET /api/gold/test
// =====================================================
router.get("/test", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Gold Routes Working Successfully ✅",
    version: "V19",
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// HEALTH ROUTE
// GET /api/gold/health
// =====================================================
router.get("/health", async (req, res) => {
  try {
    const settings = await Settings.findOne();

    return res.status(200).json({
      success: true,
      service: "Gold API",
      database: settings ? "Connected" : "No Settings Found",
      version: "V19",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("GOLD HEALTH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Gold API Health Failed.",
      error: error.message,
    });
  }
});

// =====================================================
// HELPER FUNCTION
// Create default market settings if missing
// =====================================================
const getOrCreateSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create({
      buyPrice: 31250,
      sellPrice: 30980,
      goldPriceUSD: 3420.5,
      UsdtoPkr: 282.4,
      tradingEnabled: true,
      marketStatus: "open",
    });
  }

  return settings;
};

// =====================================================
// GOLDTRADE V19 - GOLD ROUTES (PART 2/8)
// MARKET SETTINGS (GET + PUT)
// =====================================================

// =====================================================
// GET LIVE MARKET SETTINGS
// GET /api/gold/price
// =====================================================
router.get("/price", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    return res.status(200).json({
      success: true,
      data: {
        buyPrice: settings.buyPrice,
        sellPrice: settings.sellPrice,
        goldPriceUSD: settings.goldPriceUSD,
        UsdtoPkr: settings.UsdtoPkr,
        tradingEnabled: settings.tradingEnabled,
        marketStatus: settings.marketStatus,
        updatedAt: settings.updatedAt,
      },
    });
  } catch (error) {
    console.error("GET GOLD PRICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load market settings.",
    });
  }
});

// =====================================================
// UPDATE LIVE MARKET SETTINGS
// PUT /api/gold/price
// ADMIN ONLY
// =====================================================
router.put("/price", verifyToken,isAdmin, async (req, res) => {
  try {
    console.log("✅ PUT /api/gold/price HIT");

    const settings = await getOrCreateSettings();

    const {
      buyPrice,
      sellPrice,
      goldPriceUSD,
      UsdtoPkr,
      tradingEnabled,
      marketStatus,
    } = req.body;

    // ---------------- Validation ----------------

    if (
      buyPrice === undefined ||
      sellPrice === undefined ||
      goldPriceUSD === undefined ||
      UsdtoPkr === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required market settings.",
      });
    }

    settings.buyPrice = Number(buyPrice);
    settings.sellPrice = Number(sellPrice);
    settings.goldPriceUSD = Number(goldPriceUSD);
    settings.UsdtoPkr = Number(UsdtoPkr);

    settings.tradingEnabled =
      tradingEnabled === undefined
        ? settings.tradingEnabled
        : Boolean(tradingEnabled);

    settings.marketStatus =
      marketStatus === "closed" ? "closed" : "open";

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Market settings updated successfully.",
      data: settings,
    });
  } catch (error) {
    console.error("UPDATE MARKET SETTINGS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update market settings.",
      error: error.message,
    });
  }
});

// =====================================================
// TOGGLE MARKET STATUS
// PUT /api/gold/market/status
// ADMIN ONLY
// =====================================================
router.put("/market/status", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    settings.marketStatus =
      settings.marketStatus === "open" ? "closed" : "open";

    await settings.save();

    return res.status(200).json({
      success: true,
      message: `Market is now ${settings.marketStatus.toUpperCase()}.`,
      marketStatus: settings.marketStatus,
    });
  } catch (error) {
    console.error("MARKET STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to change market status.",
    });
  }
});

// =====================================================
// TOGGLE TRADING
// PUT /api/gold/trading/toggle
// ADMIN ONLY
// =====================================================
router.put("/trading/toggle", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    settings.tradingEnabled = !settings.tradingEnabled;

    await settings.save();

    return res.status(200).json({
      success: true,
      message: `Trading ${
        settings.tradingEnabled ? "Enabled" : "Disabled"
      } Successfully.`,
      tradingEnabled: settings.tradingEnabled,
    });
  } catch (error) {
    console.error("TRADING TOGGLE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to toggle trading.",
    });
  }
});

// =====================================================
// GOLDTRADE V19 - PART 3/8
// buy GOLD API
// POST /api/gold/buy
// =====================================================

router.post("/buy", verifyToken, async (req, res) => {
  try {
    const { grams } = req.body;

    if (!grams || Number(grams) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid gold quantity.",
      });
    }

    const settings = await getOrCreateSettings();

    if (!settings.tradingEnabled) {
      return res.status(400).json({
        success: false,
        message: "Gold trading is currently disabled.",
      });
    }

    if (settings.marketStatus !== "open") {
      return res.status(400).json({
        success: false,
        message: "Market is currently closed.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const quantity = Number(grams);
    const pricePerGram = Number(settings.buyPrice);
    const totalAmount = Number((quantity * pricePerGram).toFixed(2));

    if ((user.Pkrwallet || 0) < totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient Pkr wallet balance.",
      });
    }

    user.Pkrwallet = Number(user.Pkrwallet || 0) - totalAmount;
    user.goldwallet = Number(user.goldwallet || 0) + quantity;

    await user.save();

    const trade = await GoldTrade.create({
      userId: user._id,
      type: "buy",
      grams: quantity,
      pricePerGram,
      totalAmount,
      status: "COMPLETED",
    });

    await Transaction.create({
      userId: user._id,
      type: "buy_GOLD",
      amount: totalAmount,
      currency: "Pkr",
      description: `Purchased ${quantity}g gold @ Rs.${pricePerGram}/g`,
      status: "SUCCESS",
    });

    return res.status(200).json({
      success: true,
      message: "Gold purchased successfully.",
      trade,
      wallet: {
        Pkrwallet: user.Pkrwallet,
        goldwallet: user.goldwallet,
      },
    });
  } catch (error) {
    console.error("buy GOLD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to buy gold.",
      error: error.message,
    });
  }
});
// =====================================================
// GOLDTRADE V19 - PART 3B/8
// sell GOLD API
// POST /api/gold/sell
// =====================================================

router.post("/sell", verifyToken, async (req, res) => {
  try {
    const { grams } = req.body;

    // ---------------- Validation ----------------
    if (!grams || Number(grams) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid gold quantity.",
      });
    }

    const settings = await getOrCreateSettings();

    // Trading enabled?
    if (!settings.tradingEnabled) {
      return res.status(400).json({
        success: false,
        message: "Gold trading is currently disabled.",
      });
    }

    // Market open?
    if (settings.marketStatus !== "open") {
      return res.status(400).json({
        success: false,
        message: "Market is currently closed.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const quantity = Number(grams);

    // Gold wallet balance check
    if ((user.goldwallet || 0) < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient gold wallet balance.",
      });
    }

    const pricePerGram = Number(settings.sellPrice);
    const totalAmount = Number((quantity * pricePerGram).toFixed(2));

    // ---------------- wallet Update ----------------
    user.goldwallet = Number(user.goldwallet || 0) - quantity;
    user.Pkrwallet = Number(user.Pkrwallet || 0) + totalAmount;

    await user.save();

    // ---------------- Gold Trade Record ----------------
    const trade = await GoldTrade.create({
      userId: user._id,
      type: "sell",
      grams: quantity,
      pricePerGram,
      totalAmount,
      status: "COMPLETED",
    });

    // ---------------- Transaction Record ----------------
    await Transaction.create({
      userId: user._id,
      type: "sell_GOLD",
      amount: totalAmount,
      currency: "Pkr",
      description: `Sold ${quantity}g gold @ Rs.${pricePerGram}/g`,
      status: "SUCCESS",
    });

    // ---------------- Response ----------------
    return res.status(200).json({
      success: true,
      message: "Gold sold successfully.",
      trade,
      wallet: {
        Pkrwallet: Number(user.Pkrwallet.toFixed(2)),
        goldwallet: Number(user.goldwallet.toFixed(4)),
      },
    });

  } catch (error) {
    console.error("sell GOLD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to sell gold.",
      error: error.message,
    });
  }
});

// =====================================================
// GOLDTRADE V19 - PART 4/8
// USER PORTFOLIO + history + PROFIT / LOSS
// =====================================================

// =====================================================
// USER GOLD PORTFOLIO
// GET /api/gold/portfolio
// =====================================================

router.get("/portfolio", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const settings = await getOrCreateSettings();

    const goldBalance = Number(user.goldwallet || 0);
    const currentbuyPrice = Number(settings.buyPrice || 0);
    const currentsellPrice = Number(settings.sellPrice || 0);

    const totalbuyValue = Number((goldBalance * currentbuyPrice).toFixed(2));
    const totalsellValue = Number((goldBalance * currentsellPrice).toFixed(2));

    return res.status(200).json({
      success: true,
      portfolio: {
        username: user.username,
        email: user.email,
        goldwallet: goldBalance,
        Pkrwallet: Number(user.Pkrwallet || 0),
        currentbuyPrice,
        currentsellPrice,
        totalbuyValue,
        totalsellValue,
        marketStatus: settings.marketStatus,
        tradingEnabled: settings.tradingEnabled,
      },
    });
  } catch (error) {
    console.error("PORTFOLIO ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load portfolio.",
    });
  }
});

// =====================================================
// USER GOLD history
// GET /api/gold/history
// =====================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const trades = await GoldTrade.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalTrades: trades.length,
      trades,
    });
  } catch (error) {
    console.error("GOLD history ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load gold history.",
    });
  }
});

// =====================================================
// USER GOLD TRANSACTIONS
// GET /api/gold/transactions
// =====================================================

router.get("/transactions", verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      userId: req.user.id,
      type: { $in: ["buy_GOLD", "sell_GOLD"] },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalTransactions: transactions.length,
      transactions,
    });
  } catch (error) {
    console.error("GOLD TRANSACTION history ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load transactions.",
    });
  }
});

// =====================================================
// USER PROFIT / LOSS SUMMARY
// GET /api/gold/profit-loss
// =====================================================

router.get("/profit-loss", verifyToken, async (req, res) => {
  try {
    const trades = await GoldTrade.find({
      userId: req.user.id,
    });

    const settings = await getOrCreateSettings();

    let totalBoughtGrams = 0;
    let totalBoughtAmount = 0;
    let totalSoldAmount = 0;

    trades.forEach((trade) => {
      if (trade.type === "buy") {
        totalBoughtGrams += Number(trade.grams);
        totalBoughtAmount += Number(trade.totalAmount);
      }

      if (trade.type === "sell") {
        totalSoldAmount += Number(trade.totalAmount);
      }
    });

    const averagebuyPrice =
      totalBoughtGrams > 0
        ? Number((totalBoughtAmount / totalBoughtGrams).toFixed(2))
        : 0;

    const currentGoldBalance = Number(
      (
        totalBoughtGrams -
        trades
          .filter((trade) => trade.type === "sell")
          .reduce((sum, trade) => sum + Number(trade.grams), 0)
      ).toFixed(4)
    );

    const currentValue = Number(
      (currentGoldBalance * Number(settings.sellPrice)).toFixed(2)
    );

    const unrealizedProfit = Number(
      (
        currentValue -
        currentGoldBalance * averagebuyPrice
      ).toFixed(2)
    );

    const realizedProfit = Number(
      (totalSoldAmount - totalBoughtAmount).toFixed(2)
    );

    return res.status(200).json({
      success: true,
      summary: {
        totalBoughtGrams,
        currentGoldBalance,
        averagebuyPrice,
        currentMarketPrice: Number(settings.sellPrice),
        currentValue,
        realizedProfit,
        unrealizedProfit,
      },
    });
  } catch (error) {
    console.error("PROFIT LOSS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate profit/loss.",
    });
  }
});

// =====================================================
// GOLDTRADE V19 - PART 5/8
// ADMIN DASHBOARD + GOLD STATISTICS
// =====================================================

// =====================================================
// ADMIN DASHBOARD SUMMARY
// GET /api/gold/admin/dashboard
// =====================================================

router.get("/admin/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    const [
      totalUsers,
      totalTrades,
      completedTrades,
      buyTrades,
      sellTrades,
      users,
    ] = await Promise.all([
      User.countDocuments(),
      GoldTrade.countDocuments(),
      GoldTrade.countDocuments({ status: "COMPLETED" }),
      GoldTrade.find({ type: "buy", status: "COMPLETED" }),
      GoldTrade.find({ type: "sell", status: "COMPLETED" }),
      User.find({}, "goldwallet Pkrwallet"),
    ]);

    let totalGoldInwallets = 0;
    let totalPkrInwallets = 0;

    users.forEach((user) => {
      totalGoldInwallets += Number(user.goldwallet || 0);
      totalPkrInwallets += Number(user.Pkrwallet || 0);
    });

    const totalGoldBought = buyTrades.reduce(
      (sum, trade) => sum + Number(trade.grams),
      0
    );

    const totalGoldSold = sellTrades.reduce(
      (sum, trade) => sum + Number(trade.grams),
      0
    );

    const totalbuyAmount = buyTrades.reduce(
      (sum, trade) => sum + Number(trade.totalAmount),
      0
    );

    const totalsellAmount = sellTrades.reduce(
      (sum, trade) => sum + Number(trade.totalAmount),
      0
    );

    return res.status(200).json({
      success: true,
      dashboard: {
        totalUsers,
        totalTrades,
        completedTrades,

        marketStatus: settings.marketStatus,
        tradingEnabled: settings.tradingEnabled,

        buyPrice: settings.buyPrice,
        sellPrice: settings.sellPrice,
        goldPriceUSD: settings.goldPriceUSD,
        UsdtoPkr: settings.UsdtoPkr,

        totalGoldBought: Number(totalGoldBought.toFixed(4)),
        totalGoldSold: Number(totalGoldSold.toFixed(4)),
        totalGoldInwallets: Number(totalGoldInwallets.toFixed(4)),

        totalbuyAmount: Number(totalbuyAmount.toFixed(2)),
        totalsellAmount: Number(totalsellAmount.toFixed(2)),
        totalPkrInwallets: Number(totalPkrInwallets.toFixed(2)),
      },
    });

  } catch (error) {
    console.error("ADMIN DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard.",
      error: error.message,
    });
  }
});

// =====================================================
// ADMIN LIVE MARKET INFO
// GET /api/gold/admin/market
// =====================================================

router.get("/admin/market", verifyToken, isAdmin, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    return res.status(200).json({
      success: true,
      market: {
        buyPrice: settings.buyPrice,
        sellPrice: settings.sellPrice,
        goldPriceUSD: settings.goldPriceUSD,
        UsdtoPkr: settings.UsdtoPkr,
        marketStatus: settings.marketStatus,
        tradingEnabled: settings.tradingEnabled,
        updatedAt: settings.updatedAt,
      },
    });

  } catch (error) {
    console.error("ADMIN MARKET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load market information.",
    });
  }
});

// =====================================================
// ADMIN RECENT GOLD TRADES
// GET /api/gold/admin/recent-trades
// =====================================================

router.get("/admin/recent-trades", verifyToken, isAdmin, async (req, res) => {
  try {
    const trades = await GoldTrade.find()
      .populate("userId", "username email phone")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      total: trades.length,
      trades,
    });

  } catch (error) {
    console.error("RECENT GOLD TRADES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load recent trades.",
    });
  }
});

// =====================================================
// ADMIN GOLD VOLUME SUMMARY
// GET /api/gold/admin/volume
// =====================================================

router.get("/admin/volume", verifyToken, isAdmin, async (req, res) => {
  try {
    const buyTrades = await GoldTrade.find({
      type: "buy",
      status: "COMPLETED",
    });

    const sellTrades = await GoldTrade.find({
      type: "sell",
      status: "COMPLETED",
    });

    const buyVolume = buyTrades.reduce(
      (sum, trade) => sum + Number(trade.grams),
      0
    );

    const sellVolume = sellTrades.reduce(
      (sum, trade) => sum + Number(trade.grams),
      0
    );

    return res.status(200).json({
      success: true,
      volume: {
        buyVolume: Number(buyVolume.toFixed(4)),
        sellVolume: Number(sellVolume.toFixed(4)),
        netVolume: Number((buyVolume - sellVolume).toFixed(4)),
      },
    });

  } catch (error) {
    console.error("GOLD VOLUME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load gold volume summary.",
    });
  }
});

// =====================================================
// GOLDTRADE V19 - PART 6/8
// ADMIN USER SEARCH + USER GOLD DETAILS
// =====================================================

// =====================================================
// ADMIN SEARCH USER
// GET /api/gold/admin/user/search?q=username/email/phone
// =====================================================

router.get("/admin/user/search", verifyToken, isAdmin, async (req, res) => {
  try {
    const query = (req.query.q || "").trim();

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search keyword is required.",
      });
    }

    const user = await User.findOne({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error("ADMIN SEARCH USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search user.",
      error: error.message,
    });
  }
});

// =====================================================
// ADMIN GET USER GOLD wallet
// GET /api/gold/admin/user/:id
// =====================================================

router.get("/admin/user/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const settings = await getOrCreateSettings();

    const goldBalance = Number(user.goldwallet || 0);

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,

        goldwallet: goldBalance,
        Pkrwallet: Number(user.Pkrwallet || 0),

        currentbuyValue: Number(
          (goldBalance * settings.buyPrice).toFixed(2)
        ),

        currentsellValue: Number(
          (goldBalance * settings.sellPrice).toFixed(2)
        ),

        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error("ADMIN USER GOLD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user wallet.",
    });
  }
});

// =====================================================
// ADMIN USER GOLD history
// GET /api/gold/admin/user/:id/history
// =====================================================

router.get(
  "/admin/user/:id/history",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const trades = await GoldTrade.find({
        userId: req.params.id,
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        totalTrades: trades.length,
        trades,
      });

    } catch (error) {
      console.error("ADMIN USER history ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load user trade history.",
      });
    }
  }
);

// =====================================================
// ADMIN USER GOLD TRANSACTIONS
// GET /api/gold/admin/user/:id/transactions
// =====================================================

router.get(
  "/admin/user/:id/transactions",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const transactions = await Transaction.find({
        userId: req.params.id,
        type: { $in: ["buy_GOLD", "sell_GOLD"] },
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        totalTransactions: transactions.length,
        transactions,
      });

    } catch (error) {
      console.error("ADMIN USER TRANSACTION ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load user transactions.",
      });
    }
  }
);

// =====================================================
// ADMIN USER GOLD SUMMARY
// GET /api/gold/admin/user/:id/summary
// =====================================================

router.get(
  "/admin/user/:id/summary",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const settings = await getOrCreateSettings();

      const trades = await GoldTrade.find({
        userId: user._id,
        status: "COMPLETED",
      });

      let totalBought = 0;
      let totalSold = 0;

      trades.forEach((trade) => {
        if (trade.type === "buy") totalBought += Number(trade.grams);
        if (trade.type === "sell") totalSold += Number(trade.grams);
      });

      const balance = Number(user.goldwallet || 0);

      return res.status(200).json({
        success: true,
        summary: {
          username: user.username,
          email: user.email,

          goldwallet: balance,
          Pkrwallet: Number(user.Pkrwallet || 0),

          totalBought: Number(totalBought.toFixed(4)),
          totalSold: Number(totalSold.toFixed(4)),

          currentValue: Number(
            (balance * settings.sellPrice).toFixed(2)
          ),

          buyPrice: settings.buyPrice,
          sellPrice: settings.sellPrice,
        },
      });

    } catch (error) {
      console.error("ADMIN USER SUMMARY ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load user summary.",
      });
    }
  }
);

// =====================================================
// GOLDTRADE V19 - PART 7/8
// ADMIN CREDIT / DEBIT GOLD wallet
// PUT /api/gold/admin/user/:id/wallet
// =====================================================

router.put(
  "/admin/user/:id/wallet",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { amount, action, reason } = req.body;

      // ---------------- Validation ----------------
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid gold amount.",
        });
      }

      if (!["credit", "debit"].includes(action)) {
        return res.status(400).json({
          success: false,
          message: "Invalid wallet action.",
        });
      }

      // ---------------- User ----------------
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const goldAmount = Number(amount);

      // ---------------- Credit ----------------
      if (action === "credit") {
        user.goldwallet = Number(user.goldwallet || 0) + goldAmount;
      }

      // ---------------- Debit ----------------
      if (action === "debit") {
        if (Number(user.goldwallet || 0) < goldAmount) {
          return res.status(400).json({
            success: false,
            message: "User has insufficient gold balance.",
          });
        }

        user.goldwallet = Number(user.goldwallet || 0) - goldAmount;
      }

      await user.save();

      // ---------------- Transaction Record ----------------
      await Transaction.create({
        userId: user._id,
        type: action === "credit" ? "ADMIN_GOLD_CREDIT" : "ADMIN_GOLD_DEBIT",
        amount: goldAmount,
        currency: "GOLD",
        status: "SUCCESS",
        description:
          reason ||
          `Admin ${action}ed ${goldAmount} grams of gold.`,
      });

      // ---------------- Audit Log ----------------
      await GoldTrade.create({
        userId: user._id,
        type: action === "credit" ? "ADMIN_CREDIT" : "ADMIN_DEBIT",
        grams: goldAmount,
        pricePerGram: 0,
        totalAmount: 0,
        status: "COMPLETED",
        adminAction: true,
        notes:
          reason ||
          `Admin ${action}ed ${goldAmount} grams.`,
      });

      return res.status(200).json({
        success: true,
        message:
          action === "credit"
            ? "Gold credited successfully."
            : "Gold debited successfully.",

        wallet: {
          goldwallet: Number(user.goldwallet.toFixed(4)),
          Pkrwallet: Number((user.Pkrwallet || 0).toFixed(2)),
        },
      });

    } catch (error) {
      console.error("ADMIN GOLD wallet ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update gold wallet.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// ADMIN GET GOLD wallet LOGS
// GET /api/gold/admin/wallet/logs
// =====================================================

router.get(
  "/admin/wallet/logs",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const logs = await Transaction.find({
        type: {
          $in: ["ADMIN_GOLD_CREDIT", "ADMIN_GOLD_DEBIT"],
        },
      })
        .populate("userId", "username email phone")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        totalLogs: logs.length,
        logs,
      });

    } catch (error) {
      console.error("ADMIN wallet LOG ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load wallet logs.",
      });
    }
  }
);

// =====================================================
// GOLDTRADE V19 - PART 8/8
// FINAL CLEANUP + EXPORT
// =====================================================

// =====================================================
// ADMIN DELETE GOLD TRADE
// DELETE /api/gold/admin/trade/:id
// =====================================================

router.delete(
  "/admin/trade/:id",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const trade = await GoldTrade.findById(req.params.id);

      if (!trade) {
        return res.status(404).json({
          success: false,
          message: "Trade not found.",
        });
      }

      await GoldTrade.findByIdAndDelete(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Gold trade deleted successfully.",
      });

    } catch (error) {
      console.error("DELETE GOLD TRADE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to delete trade.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// ADMIN RESET MARKET SETTINGS
// PUT /api/gold/admin/reset-market
// =====================================================

router.put(
  "/admin/reset-market",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      let settings = await getOrCreateSettings();

      settings.buyPrice = 31250;
      settings.sellPrice = 30980;
      settings.goldPriceUSD = 3420.5;
      settings.UsdtoPkr = 282.4;
      settings.marketStatus = "open";
      settings.tradingEnabled = true;

      await settings.save();

      return res.status(200).json({
        success: true,
        message: "Market settings reset successfully.",
        settings,
      });

    } catch (error) {
      console.error("RESET MARKET ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to reset market settings.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// GOLD API INFORMATION
// GET /api/gold/info
// =====================================================

router.get("/info", async (req, res) => {
  try {
    const settings = await getOrCreateSettings();

    return res.status(200).json({
      success: true,
      api: "GoldTrade Gold API",
      version: "V19 FINAL",
      endpoints: {
        marketPrice: "/api/gold/price",
        buyGold: "/api/gold/buy",
        sellGold: "/api/gold/sell",
        portfolio: "/api/gold/portfolio",
        history: "/api/gold/history",
        adminDashboard: "/api/gold/admin/dashboard",
        adminwallet: "/api/gold/admin/user/:id/wallet",
      },
      market: {
        buyPrice: settings.buyPrice,
        sellPrice: settings.sellPrice,
        marketStatus: settings.marketStatus,
        tradingEnabled: settings.tradingEnabled,
      },
      serverTime: new Date().toISOString(),
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to load API information.",
    });
  }
});

// =====================================================
// GOLD ROUTES 404 HANDLER
// (Must stay LAST route)
// =====================================================

router.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API Route Not Found",
    path: req.originalUrl,
    method: req.method,
  });
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;