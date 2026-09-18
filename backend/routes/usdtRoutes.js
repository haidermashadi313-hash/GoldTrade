// =====================================================
// GoldTrade V18 - Usdt Routes (PART 1/6)
// Imports • Models • Middleware • Multer • Rate APIs
// =====================================================

const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// =====================================================
// MODELS
// =====================================================

const User = require("../models/User");
const wallet = require("../models/wallet");
const walletTransaction = require("../models/walletTransaction");
const UsdtOrder = require("../models/UsdtOrder");
const Transaction = require("../models/Transaction");

// =====================================================
// MIDDLEWARE
// =====================================================

const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");

// =====================================================
// UPLOAD DIRECTORY
// uploads/Usdt
// =====================================================

const uploadDir = path.join(__dirname, "../uploads/Usdt");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1000000) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// =====================================================
// FILE FILTER
// =====================================================

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPG, PNG and WEBP images are allowed.")
      );
    }

    cb(null, true);
  },
});

// =====================================================
// CONSTANTS
// =====================================================

// Live Usdt price (Pkr)
// Later Admin Panel se dynamic ho jayega.

const Usdt_RATE = 280;

// =====================================================
// GET LIVE Usdt RATE
// GET /api/Usdt/rate
// Public API (NO TOKEN)
// Used by buy Usdt, sell Usdt, Dashboard
// =====================================================

router.get("/rate", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      currency: "Pkr",
      rate: Number(Usdt_RATE),
      buyRate: Number(Usdt_RATE),
      sellRate: Number(Usdt_RATE),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Usdt RATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Usdt rate.",
      error: error.message,
    });
  }
});

// =====================================================
// GET LIVE Usdt PRICE
// GET /api/Usdt/price
// Public API (NO TOKEN)
// Backward compatibility for Usdt
// =====================================================

router.get("/price", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      currency: "Pkr",
      rate: Number(Usdt_RATE),
      buyRate: Number(Usdt_RATE),
      sellRate: Number(Usdt_RATE),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Usdt PRICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Usdt price.",
      error: error.message,
    });
  }
});

// =====================================================
// HEALTH CHECK
// GET /api/Usdt/health
// Public API (NO TOKEN)
// =====================================================

router.get("/health", async (req, res) => {
  return res.status(200).json({
    success: true,
    module: "GoldTrade V18 Usdt API",
    version: "V18 Final",
    status: "Running",
    endpoints: {
      rate: "/api/Usdt/rate",
      price: "/api/Usdt/price",
      buy: "/api/Usdt/buy",
      sell: "/api/Usdt/sell",
      history: "/api/Usdt/history/:username",
      balance: "/api/Usdt/balance/:username",
    },
    timestamp: new Date(),
  });
});

// =====================================================
// buy Usdt
// POST /api/Usdt/buy
// wallet Purchase (Pkr -> Usdt)
// =====================================================

router.post("/buy", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { username, UsdtAmount } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!username || !UsdtAmount) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Username and Usdt amount are required.",
      });
    }

    const amount = Number(UsdtAmount);

    if (isNaN(amount) || amount <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid Usdt amount.",
      });
    }

    const totalPkr = amount * Usdt_RATE;

    // =====================================================
    // FIND USER
    // =====================================================

    const user = await User.findOne({ username }).session(session);

    if (!user) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // =====================================================
    // FIND OR CREATE wallet
    // =====================================================

    let wallet = await wallet.findOne({
      userId: user._id,
    }).session(session);

    if (!wallet) {
      const createdwallet = await wallet.create(
        [
          {
            userId: user._id,
            username: user.username,

            PkrBalance: Number(user.walletBalance || 0),
            UsdtBalance: Number(user.UsdtBalance || 0),
            goldBalance: Number(user.goldBalance || 0),
          },
        ],
        { session }
      );

      wallet = createdwallet[0];
    }

    // =====================================================
    // CHECK Pkr BALANCE
    // =====================================================

    if (Number(wallet.PkrBalance) < totalPkr) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Insufficient Pkr balance.",
      });
    }

    const previousPkr = Number(wallet.PkrBalance);
    const previousUsdt = Number(wallet.UsdtBalance || 0);

    // =====================================================
    // UPDATE wallet
    // =====================================================

    wallet.PkrBalance = previousPkr - totalPkr;
    wallet.UsdtBalance = previousUsdt + amount;

    await wallet.save({ session });

    // =====================================================
    // SYNC USER BALANCE
    // =====================================================

    user.walletBalance = wallet.PkrBalance;
    user.UsdtBalance = wallet.UsdtBalance;

    await user.save({ session });

    // =====================================================
    // Pkr wallet history
    // =====================================================

    await walletTransaction.create(
      [
        {
          userId: user._id,
          username: user.username,

          walletType: "Pkr",
          type: "DEBIT",

          amount: totalPkr,

          previousBalance: previousPkr,
          newBalance: wallet.PkrBalance,

          adminUsername: "SYSTEM",
          note: `Bought ${amount} Usdt @ Pkr ${Usdt_RATE}`,

          createdAt: new Date(),
        },
      ],
      { session }
    );

    // =====================================================
    // Usdt wallet history
    // =====================================================

    await walletTransaction.create(
      [
        {
          userId: user._id,
          username: user.username,

          walletType: "Usdt",
          type: "CREDIT",

          amount,

          previousBalance: previousUsdt,
          newBalance: wallet.UsdtBalance,

          adminUsername: "SYSTEM",
          note: `Purchased ${amount} Usdt`,

          createdAt: new Date(),
        },
      ],
      { session }
    );

    // =====================================================
    // GLOBAL TRANSACTION LOG
    // =====================================================

    await Transaction.create(
      [
        {
          username: user.username,

          type: "Usdt buy",
          amount,

          method: "wallet",
          status: "Completed",

          transactionId: `Usdtbuy-${Date.now()}`,

          createdAt: new Date(),
        },
      ],
      { session }
    );

    // =====================================================
    // COMMIT
    // =====================================================

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: "Usdt purchased successfully.",

      transaction: {
        type: "Usdt buy",
        rate: Usdt_RATE,
        UsdtAmount: amount,
        totalPkr,
      },

      wallet: {
        PkrBalance: wallet.PkrBalance,
        UsdtBalance: wallet.UsdtBalance,
      },
    });

  } catch (error) {
    await session.abortTransaction();

    console.error("buy Usdt ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to purchase Usdt.",
      error: error.message,
    });

  } finally {
    session.endSession();
  }
});

// =====================================================
// buy Usdt REQUEST
// POST /api/Usdt/buy/request
// Bank Transfer / TRC20 Receipt Upload
// =====================================================

router.post(
  "/buy/request",
  verifyToken,
  upload.single("receipt"),
  async (req, res) => {
    try {
      const {
        username,
        PkrAmount,
        UsdtAmount,
        walletAddress,
        network,
        paymentMethod,
        bankName,
        accountName,
        accountNumber,
        trxId,
      } = req.body;

      // =====================================================
      // VALIDATION
      // =====================================================

      if (!username || !PkrAmount || !UsdtAmount || !walletAddress) {
        return res.status(400).json({
          success: false,
          message: "All required fields must be filled.",
        });
      }

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      // =====================================================
      // CREATE ORDER
      // =====================================================

      const order = await UsdtOrder.create({
        username,

        type: "buy",

        network: network || "TRC20",
        paymentMethod: paymentMethod || "BANK",

        PkrAmount: Number(PkrAmount),
        UsdtAmount: Number(UsdtAmount),

        walletAddress,

        bankName: bankName || "",
        accountName: accountName || "",
        accountNumber: accountNumber || "",
        trxId: trxId || "",

        receiptImage: req.file ? req.file.filename : "",

        status: "Pending",

        createdAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: "Usdt buy request submitted successfully.",
        order,
      });

    } catch (error) {
      console.error("buy REQUEST ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to submit Usdt buy request.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// sell Usdt REQUEST
// POST /api/Usdt/sell
// User sells Usdt to Company
// =====================================================

router.post("/sell", verifyToken, async (req, res) => {
  try {
    const {
      username,
      UsdtAmount,
      PkrAmount,
      walletAddress,
      network,
      paymentMethod,
      bankName,
      accountName,
      accountNumber,
    } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!username || !UsdtAmount || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled.",
      });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await wallet.findOne({ userId: user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "wallet not found.",
      });
    }

    if (Number(wallet.UsdtBalance || 0) < Number(UsdtAmount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient Usdt balance.",
      });
    }

    // =====================================================
    // CREATE sell ORDER
    // =====================================================

    const order = await UsdtOrder.create({
      username,

      type: "sell",

      network: network || "TRC20",
      paymentMethod: paymentMethod || "BANK",

      UsdtAmount: Number(UsdtAmount),

      PkrAmount:
        Number(PkrAmount) || Number(UsdtAmount) * Usdt_RATE,

      walletAddress,

      bankName: bankName || "",
      accountName: accountName || "",
      accountNumber: accountNumber || "",

      status: "Pending",

      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Usdt sell Request Submitted Successfully.",
      order,
    });

  } catch (error) {
    console.error("sell REQUEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit Usdt sell request.",
      error: error.message,
    });
  }
});

// =====================================================
// GET USER Usdt history
// GET /api/Usdt/history/:username
// GoldTrade V18 - Frontend Compatible
// =====================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;

    // =====================================================
    // FIND USER
    // =====================================================

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // =====================================================
    // FIND wallet
    // =====================================================

    const Wallet = require("../models/Wallet");

    const userWallet = await Wallet.findOne({
      userId: user._id,
    });

    
    if (!userWallet) {
      return res.status(200).json({
        success: true,
        username,
        transactionCount: 0,
        summary: {
          totalCredits: 0,
          totalDebits: 0,
          currentUsdt: 0,
        },
        transactions: [],
      });
    }

    // =====================================================
    // LOAD Usdt TRANSACTIONS
    // =====================================================

    const history = await walletTransaction.find({
      username,
      walletType: "Usdt",
    })
      .sort({ createdAt: -1 })
      .lean();

    // =====================================================
    // FORMAT TRANSACTIONS
    // =====================================================

    const transactions = history.map((tx) => ({
      _id: tx._id,

      username: tx.username,

      walletType: tx.walletType || "Usdt",
      type: tx.type || "CREDIT",

      amount: Number(tx.amount || 0),

      previousBalance: Number(tx.previousBalance || 0),
      newBalance: Number(tx.newBalance || 0),

      note: tx.note || "",
      adminUsername: tx.adminUsername || "SYSTEM",

      createdAt: tx.createdAt,
    }));

    // =====================================================
    // SUMMARY
    // =====================================================

    const totalCredits = transactions
      .filter((tx) => tx.type === "CREDIT")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalDebits = transactions
      .filter((tx) => tx.type === "DEBIT")
      .reduce((sum, tx) => sum + tx.amount, 0);

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      username,

      transactionCount: transactions.length,

      summary: {
        totalCredits,
        totalDebits,
        currentUsdt: Number(userWallet.UsdtBalance || 0),
      },

      transactions,
    });

  } catch (error) {
    console.error("Usdt history ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Usdt history.",
      error: error.message,
    });
  }
});

// =====================================================
// GET USER USDT BALANCE
// GET /api/usdt/balance/:username
// GoldTrade V18 FINAL FIX
// =====================================================

router.get("/balance/:username", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;

    // Find User
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Find Wallet
    let userWallet = await Wallet.findOne({ userId: user._id });

    // Create wallet if it doesn't exist
    if (!userWallet) {
      userWallet = await Wallet.create({
        userId: user._id,
        username: user.username,
        PkrBalance: Number(user.walletBalance || 0),
        UsdtBalance: 0,
        goldBalance: 0,
        usdtHistory: [],
      });
    }

    return res.status(200).json({
      success: true,
      balance: {
        PkrBalance: Number(userWallet.PkrBalance || 0),
        UsdtBalance: Number(userWallet.UsdtBalance || 0),
        goldBalance: Number(userWallet.goldBalance || 0),
      },
    });
  } catch (error) {
    console.error("USDT BALANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet balance.",
      error: error.message,
    });
  }
});

// =====================================================
// ADMIN APPROVE / REJECT Usdt ORDER
// PUT /api/Usdt/:id
// GoldTrade v18 Production
// =====================================================

router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { status } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!["Approved", "Rejected"].includes(status)) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    // =====================================================
    // FIND ORDER
    // =====================================================

    const order = await UsdtOrder.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "Usdt order not found.",
      });
    }

    if (order.status !== "Pending") {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Order already processed.",
      });
    }

    // =====================================================
    // FIND USER
    // =====================================================

    const user = await User.findOne({
      username: order.username,
    }).session(session);

    if (!user) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // =====================================================
    // FIND OR CREATE wallet
    // =====================================================

    let wallet = await Wallet.findOne({
      userId: user._id,
    }).session(session);

    if (!wallet) {
      const createdwallet = await Wallet.create(
        [
          {
            userId: user._id,
            username: user.username,

            PkrBalance: Number(user.walletBalance || 0),
            UsdtBalance: Number(user.UsdtBalance || 0),
            goldBalance: Number(user.goldBalance || 0),
          },
        ],
        { session }
      );

      wallet = createdwallet[0];
    }

    // =====================================================
    // REJECT ORDER
    // =====================================================

    if (status === "Rejected") {
      order.status = "Rejected";
      order.processedBy = req.user.username;
      order.processedAt = new Date();

      await order.save({ session });

      await session.commitTransaction();

      return res.status(200).json({
        success: true,
        message: "Usdt order rejected successfully.",
        order,
      });
    }

    // =====================================================
    // APPROVE ORDER
    // =====================================================

    const previousPkr = Number(wallet.PkrBalance || 0);
    const previousUsdt = Number(wallet.UsdtBalance || 0);
    const UsdtTransaction = require("../models/UsdtTransaction");

    // ---------- buy ORDER ----------
    if (order.type === "buy") {
      wallet.UsdtBalance += Number(order.UsdtAmount);

      await WalletTransaction.create(
        [
          {
            userId: user._id,
            username: user.username,

            walletType: "Usdt",
            type: "CREDIT",

            amount: Number(order.UsdtAmount),

            previousBalance: previousUsdt,
            newBalance: wallet.UsdtBalance,

            adminUsername: req.user.username,
            note: "Usdt buy Order Approved",

            createdAt: new Date(),
          },
        ],
        { session }
      );
    }

    // ---------- sell ORDER ----------
    if (order.type === "sell") {
      if (previousUsdt < Number(order.UsdtAmount)) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "Insufficient Usdt balance.",
        });
      }

      wallet.UsdtBalance -= Number(order.UsdtAmount);
      wallet.PkrBalance += Number(order.PkrAmount);

      // Usdt Debit history
      await WalletTransaction.create(
        [
          {
            userId: user._id,
            username: user.username,

            walletType: "Usdt",
            type: "DEBIT",

            amount: Number(order.UsdtAmount),

            previousBalance: previousUsdt,
            newBalance: wallet.UsdtBalance,

            adminUsername: req.user.username,
            note: "Usdt sell Order Approved",

            createdAt: new Date(),
          },
        ],
        { session }
      );

      // Pkr Credit history
      await WalletTransaction.create(
        [
          {
            userId: user._id,
            username: user.username,

            walletType: "Pkr",
            type: "CREDIT",

            amount: Number(order.PkrAmount),

            previousBalance: previousPkr,
            newBalance: wallet.PkrBalance,

            adminUsername: req.user.username,
            note: "Pkr Credited Against Usdt sell",

            createdAt: new Date(),
          },
        ],
        { session }
      );
    }

    // =====================================================
    // SAVE wallet
    // =====================================================

    await wallet.save({ session });

    // =====================================================
    // SYNC USER BALANCES
    // =====================================================

    user.walletBalance = wallet.PkrBalance;
    user.UsdtBalance = wallet.UsdtBalance;

    await user.save({ session });

    // =====================================================
    // UPDATE ORDER STATUS
    // =====================================================

    order.status = "Approved";
    order.processedBy = req.user.username;
    order.processedAt = new Date();

    await order.save({ session });

    // =====================================================
    // GLOBAL TRANSACTION LOG
    // =====================================================

    await Transaction.create(
      [
        {
          username: order.username,

          type:
            order.type === "buy"
              ? "Usdt buy Approved"
              : "Usdt sell Approved",

          amount: Number(order.UsdtAmount),

          method: order.network || "TRC20",
          status: "Approved",

          transactionId: order._id.toString(),

          createdAt: new Date(),
        },
      ],
      { session }
    );

    // =====================================================
    // COMMIT TRANSACTION
    // =====================================================

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message: `Usdt ${order.type} order approved successfully.`,

      wallet: {
        PkrBalance: wallet.PkrBalance,
        UsdtBalance: wallet.UsdtBalance,
      },

      order,
    });

  } catch (error) {
    await session.abortTransaction();

    console.error("Usdt ORDER APPROVAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process Usdt order.",
      error: error.message,
    });

  } finally {
    session.endSession();
  }
});

// =====================================================
// GET ALL Usdt ORDERS (ADMIN)
// GET /api/Usdt
// Frontend Admin Usdt Page Compatible
// =====================================================

router.get("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const orders = await UsdtOrder.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      totalOrders: orders.length,

      // Frontend Compatibility
      requests: orders,
      orders,
    });

  } catch (error) {
    console.error("GET Usdt ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Usdt orders.",
      error: error.message,
    });
  }
});

// =====================================================
// GET SINGLE Usdt ORDER (ADMIN)
// GET /api/Usdt/:id
// =====================================================

router.get("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const order = await UsdtOrder.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Usdt order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {
    console.error("GET SINGLE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load Usdt order.",
      error: error.message,
    });
  }
});

// =====================================================
// DELETE Usdt ORDER (ADMIN)
// DELETE /api/Usdt/:id
// Only Pending Orders Can Be Deleted
// =====================================================

router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const order = await UsdtOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Usdt order not found.",
      });
    }

    if (order.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Approved Usdt orders cannot be deleted.",
      });
    }

    await UsdtOrder.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Usdt order deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE Usdt ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete Usdt order.",
      error: error.message,
    });
  }
});

// =====================================================
// ADMIN DASHBOARD SUMMARY
// GET /api/Usdt/dashboard
// =====================================================

router.get("/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const pending = await UsdtOrder.countDocuments({ status: "Pending" });
    const approved = await UsdtOrder.countDocuments({ status: "Approved" });
    const rejected = await UsdtOrder.countDocuments({ status: "Rejected" });

    const totalbuy = await UsdtOrder.aggregate([
      { $match: { type: "buy", status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$UsdtAmount" } } },
    ]);

    const totalsell = await UsdtOrder.aggregate([
      { $match: { type: "sell", status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$UsdtAmount" } } },
    ]);

    return res.status(200).json({
      success: true,

      stats: {
        pendingOrders: pending,
        approvedOrders: approved,
        rejectedOrders: rejected,

        totalbuyUsdt: totalbuy[0]?.total || 0,
        totalsellUsdt: totalsell[0]?.total || 0,

        currentRate: Usdt_RATE,
      },
    });

  } catch (error) {
    console.error("Usdt dashboard ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard statistics.",
      error: error.message,
    });
  }
});

// =====================================================
// MODULE EXPORT
// =====================================================

module.exports = router;