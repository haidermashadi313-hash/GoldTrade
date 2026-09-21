const express = require("express");
const router = express.Router();

const { verifyToken, isAdmin } = require("../middleware/auth");

const Settings = require("../models/Settings");
const GoldOrder = require("../models/GoldOrder");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

// =====================================================
// GET GOLD SETTINGS
// GET /api/admin/gold/settings
// =====================================================

router.get("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({
        buyGoldPrice: 312000,
        sellGoldPrice: 310000,
        goldPriceUSD: 3350,
        usdToPkr: 285,
        goldTradingEnabled: true,
        marketStatus: "OPEN",
      });
    }

    return res.json({
      success: true,
      settings: {
        buyGoldPrice: settings.buyGoldPrice,
        sellGoldPrice: settings.sellGoldPrice,
        goldPriceUSD: settings.goldPriceUSD,
        usdToPkr: settings.usdToPkr,
        goldTradingEnabled: settings.goldTradingEnabled,
        marketStatus: settings.marketStatus,
      },
    });
  } catch (error) {
    console.error("Gold Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Gold settings.",
    });
  }
});

// =====================================================
// UPDATE GOLD SETTINGS
// POST /api/admin/gold/settings
// =====================================================

router.post("/settings", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      buyGoldPrice,
      sellGoldPrice,
      goldPriceUSD,
      usdToPkr,
      goldTradingEnabled,
      marketStatus,
    } = req.body;

    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings();
    }

    if (buyGoldPrice !== undefined)
      settings.buyGoldPrice = Number(buyGoldPrice);

    if (sellGoldPrice !== undefined)
      settings.sellGoldPrice = Number(sellGoldPrice);

    if (goldPriceUSD !== undefined)
      settings.goldPriceUSD = Number(goldPriceUSD);

    if (usdToPkr !== undefined)
      settings.usdToPkr = Number(usdToPkr);

    if (goldTradingEnabled !== undefined)
      settings.goldTradingEnabled = Boolean(goldTradingEnabled);

    if (marketStatus !== undefined)
      settings.marketStatus = marketStatus;

    await settings.save();

    return res.json({
      success: true,
      message: "Gold settings updated successfully.",
      settings,
    });
  } catch (error) {
    console.error("Update Gold Settings Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update Gold settings.",
    });
  }
});

// =====================================================
// GOLD DASHBOARD ANALYTICS
// GET /api/admin/gold/dashboard
// =====================================================

router.get("/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const pendingBuy = await GoldOrder.countDocuments({
      orderType: "BUY",
      status: "Pending",
    });

    const pendingSell = await GoldOrder.countDocuments({
      orderType: "SELL",
      status: "Pending",
    });

    const buyOrders = await GoldOrder.find({
      orderType: "BUY",
      status: "Pending",
    });

    const sellOrders = await GoldOrder.find({
      orderType: "SELL",
      status: "Pending",
    });

    const totalBuyVolume = buyOrders.reduce(
      (sum, order) => sum + Number(order.quantity || 0),
      0
    );

    const totalSellVolume = sellOrders.reduce(
      (sum, order) => sum + Number(order.quantity || 0),
      0
    );

    const settings = await Settings.findOne();

    return res.json({
      success: true,

      pendingBuy,
      pendingSell,

      totalBuyVolume,
      totalSellVolume,

      settings: {
        buyGoldPrice: settings?.buyGoldPrice || 0,
        sellGoldPrice: settings?.sellGoldPrice || 0,
        goldPriceUSD: settings?.goldPriceUSD || 0,
        usdToPkr: settings?.usdToPkr || 0,
        goldTradingEnabled: settings?.goldTradingEnabled ?? true,
        marketStatus: settings?.marketStatus || "OPEN",
      },
    });
  } catch (error) {
    console.error("Gold Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Gold dashboard.",
    });
  }
});
// =====================================================
// GET PENDING GOLD BUY ORDERS
// GET /api/admin/gold/buy-orders
// =====================================================

router.get("/buy-orders", verifyToken, isAdmin, async (req, res) => {
  try {
    const orders = await GoldOrder.find({
      orderType: "BUY",
      status: "Pending",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Gold Buy Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load buy orders.",
    });
  }
});

// =====================================================
// APPROVE GOLD BUY ORDER
// POST /api/admin/gold/buy-orders/:id/approve
// =====================================================

router.post(
  "/buy-orders/:id/approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const order = await GoldOrder.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Buy order not found.",
        });
      }

      if (order.status !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "Buy order already processed.",
        });
      }

      const user = await User.findOne({
        username: order.username,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // Credit Gold Wallet
      user.goldBalance =
        Number(user.goldBalance || 0) + Number(order.quantity);

      await user.save();

      // Update Order
      order.status = "Approved";
      order.approvedBy = req.user.username;
      order.approvedAt = new Date();

      await order.save();

      // Transaction History
      await WalletTransaction.create({
        username: user.username,
        walletType: "GOLD",
        transactionType: "BUY_GOLD",
        amount: Number(order.quantity),
        status: "Completed",
        note: `Buy Gold Approved (${order.quantity} g).`,
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "Gold buy order approved successfully.",
        newGoldBalance: user.goldBalance,
      });

    } catch (error) {
      console.error("Approve Gold Buy Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to approve buy order.",
      });
    }
  }
);

// =====================================================
// REJECT GOLD BUY ORDER
// POST /api/admin/gold/buy-orders/:id/reject
// =====================================================

router.post(
  "/buy-orders/:id/reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const order = await GoldOrder.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Buy order not found.",
        });
      }

      if (order.status !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "Buy order already processed.",
        });
      }

      order.status = "Rejected";
      order.approvedBy = req.user.username;
      order.approvedAt = new Date();

      await order.save();

      // Audit History
      await WalletTransaction.create({
        username: order.username,
        walletType: "GOLD",
        transactionType: "SYSTEM_UPDATE",
        amount: Number(order.quantity),
        status: "Rejected",
        note: `Gold buy order rejected (${order.quantity} g).`,
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "Gold buy order rejected successfully.",
      });

    } catch (error) {
      console.error("Reject Gold Buy Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to reject buy order.",
      });
    }
  }
);
// =====================================================
// GET PENDING GOLD SELL ORDERS
// GET /api/admin/gold/sell-orders
// =====================================================

router.get("/sell-orders", verifyToken, isAdmin, async (req, res) => {
  try {
    const orders = await GoldOrder.find({
      orderType: "SELL",
      status: "Pending",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Gold Sell Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load sell orders.",
    });
  }
});

// =====================================================
// APPROVE GOLD SELL ORDER
// POST /api/admin/gold/sell-orders/:id/approve
// =====================================================

router.post(
  "/sell-orders/:id/approve",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const order = await GoldOrder.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Sell order not found.",
        });
      }

      if (order.status !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "Sell order already processed.",
        });
      }

      const user = await User.findOne({
        username: order.username,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // Check Gold Balance
      if (Number(user.goldBalance || 0) < Number(order.quantity)) {
        return res.status(400).json({
          success: false,
          message: "Insufficient Gold balance.",
        });
      }

      // Deduct Gold
      user.goldBalance =
        Number(user.goldBalance || 0) - Number(order.quantity);

      // Credit PKR Wallet
      user.pkrBalance =
        Number(user.pkrBalance || 0) + Number(order.totalAmount);

      await user.save();

      // Update Order
      order.status = "Approved";
      order.approvedBy = req.user.username;
      order.approvedAt = new Date();

      await order.save();

      // Wallet History
      await WalletTransaction.create({
        username: user.username,
        walletType: "GOLD",
        transactionType: "SELL_GOLD",
        amount: Number(order.quantity),
        status: "Completed",
        note: `Gold sell approved (${order.quantity} g → PKR ${order.totalAmount}).`,
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "Gold sell order approved successfully.",
        newGoldBalance: user.goldBalance,
        newPkrBalance: user.pkrBalance,
      });
    } catch (error) {
      console.error("Approve Gold Sell Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to approve sell order.",
      });
    }
  }
);

// =====================================================
// REJECT GOLD SELL ORDER
// POST /api/admin/gold/sell-orders/:id/reject
// =====================================================

router.post(
  "/sell-orders/:id/reject",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const order = await GoldOrder.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Sell order not found.",
        });
      }

      if (order.status !== "Pending") {
        return res.status(400).json({
          success: false,
          message: "Sell order already processed.",
        });
      }

      order.status = "Rejected";
      order.approvedBy = req.user.username;
      order.approvedAt = new Date();

      await order.save();

      // Audit History
      await WalletTransaction.create({
        username: order.username,
        walletType: "GOLD",
        transactionType: "SYSTEM_UPDATE",
        amount: Number(order.quantity),
        status: "Rejected",
        note: `Gold sell order rejected (${order.quantity} g).`,
        createdBy: req.user.username,
      });

      return res.json({
        success: true,
        message: "Gold sell order rejected successfully.",
      });
    } catch (error) {
      console.error("Reject Gold Sell Error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to reject sell order.",
      });
    }
  }
);
// =====================================================
// GOLD TRANSACTION HISTORY
// GET /api/admin/gold/history
// =====================================================

router.get("/history", verifyToken, isAdmin, async (req, res) => {
  try {
    const history = await WalletTransaction.find({
      walletType: "GOLD",
    })
      .sort({ createdAt: -1 })
      .limit(500);

    return res.json({
      success: true,
      history,
    });

  } catch (error) {
    console.error("Gold History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Gold transaction history.",
    });
  }
});

// =====================================================
// GOLD USER ANALYTICS
// GET /api/admin/gold/users
// =====================================================

router.get("/users", verifyToken, isAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "username fullName email goldBalance pkrBalance walletFrozen createdAt"
      )
      .sort({ goldBalance: -1 });

    const totalUsers = users.length;

    const totalGoldBalance = users.reduce(
      (sum, user) => sum + Number(user.goldBalance || 0),
      0
    );

    const totalPkrBalance = users.reduce(
      (sum, user) => sum + Number(user.pkrBalance || 0),
      0
    );

    const frozenWallets = users.filter(
      (user) => user.walletFrozen
    ).length;

    const activeWallets = totalUsers - frozenWallets;

    return res.json({
      success: true,

      analytics: {
        totalUsers,
        activeWallets,
        frozenWallets,
        totalGoldBalance,
        totalPkrBalance,
      },

      users,
    });

  } catch (error) {
    console.error("Gold Users Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Gold user analytics.",
    });
  }
});

// =====================================================
// GOLD AUDIT LOG
// GET /api/admin/gold/audit
// =====================================================

router.get("/audit", verifyToken, isAdmin, async (req, res) => {
  try {
    const logs = await WalletTransaction.find({
      walletType: "GOLD",
    })
      .sort({ createdAt: -1 })
      .limit(300);

    return res.json({
      success: true,
      logs,
    });

  } catch (error) {
    console.error("Gold Audit Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Gold audit log.",
    });
  }
});

// =====================================================
// GOLD COMPLETE ANALYTICS
// GET /api/admin/gold/analytics
// =====================================================

router.get("/analytics", verifyToken, isAdmin, async (req, res) => {
  try {
    const approvedBuy = await GoldOrder.countDocuments({
      orderType: "BUY",
      status: "Approved",
    });

    const approvedSell = await GoldOrder.countDocuments({
      orderType: "SELL",
      status: "Approved",
    });

    const rejectedOrders = await GoldOrder.countDocuments({
      status: "Rejected",
    });

    const pendingOrders = await GoldOrder.countDocuments({
      status: "Pending",
    });

    const buyVolume = await GoldOrder.aggregate([
      { $match: { orderType: "BUY", status: "Approved" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantity" },
        },
      },
    ]);

    const sellVolume = await GoldOrder.aggregate([
      { $match: { orderType: "SELL", status: "Approved" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantity" },
        },
      },
    ]);

    return res.json({
      success: true,

      analytics: {
        approvedBuyOrders: approvedBuy,
        approvedSellOrders: approvedSell,
        rejectedOrders,
        pendingOrders,

        totalBuyVolume: buyVolume[0]?.total || 0,
        totalSellVolume: sellVolume[0]?.total || 0,
      },
    });

  } catch (error) {
    console.error("Gold Analytics Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Gold analytics.",
    });
  }
});

// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;