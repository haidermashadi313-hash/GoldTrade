// =====================================================
// GoldTrade V18 - USDT Routes (PART 1/6)
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
const Wallet = require("../models/Wallet");
const WalletTransaction = require("../models/WalletTransaction");
const UsdtOrder = require("../models/UsdtOrder");
const Transaction = require("../models/Transaction");

// =====================================================
// MIDDLEWARE
// =====================================================

const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");

// =====================================================
// UPLOAD DIRECTORY
// uploads/usdt
// =====================================================

const uploadDir = path.join(__dirname, "../uploads/usdt");

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

// Live USDT Price (PKR)
// Later Admin Panel se dynamic ho jayega.

const USDT_RATE = 280;

// =====================================================
// GET LIVE USDT RATE
// GET /api/usdt/rate
// Frontend: Buy / Sell / Dashboard
// Public API (No Token)
// =====================================================

router.get("/rate", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      currency: "PKR",
      rate: USDT_RATE,
      buyRate: USDT_RATE,
      sellRate: USDT_RATE,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("USDT RATE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT rate.",
      error: error.message,
    });
  }
});

// =====================================================
// GET LIVE USDT PRICE
// GET /api/usdt/price
// Frontend Compatibility (OLD + NEW)
// Public API (No Token)
// =====================================================

router.get("/price", async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      currency: "PKR",
      rate: USDT_RATE,
      buyRate: USDT_RATE,
      sellRate: USDT_RATE,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("USDT PRICE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT price.",
      error: error.message,
    });
  }
});

// =====================================================
// BUY USDT
// POST /api/usdt/buy
// Wallet Purchase (PKR -> USDT)
// =====================================================

router.post("/buy", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { username, usdtAmount } = req.body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!username || !usdtAmount) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Username and USDT amount are required.",
      });
    }

    const amount = Number(usdtAmount);

    if (isNaN(amount) || amount <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Invalid USDT amount.",
      });
    }

    const totalPKR = amount * USDT_RATE;

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
    // FIND OR CREATE WALLET
    // =====================================================

    let wallet = await Wallet.findOne({
      userId: user._id,
    }).session(session);

    if (!wallet) {
      const createdWallet = await Wallet.create(
        [
          {
            userId: user._id,
            username: user.username,

            pkrBalance: Number(user.walletBalance || 0),
            usdtBalance: Number(user.usdtBalance || 0),
            goldBalance: Number(user.goldBalance || 0),
          },
        ],
        { session }
      );

      wallet = createdWallet[0];
    }

    // =====================================================
    // CHECK PKR BALANCE
    // =====================================================

    if (Number(wallet.pkrBalance) < totalPKR) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message: "Insufficient PKR balance.",
      });
    }

    const previousPKR = Number(wallet.pkrBalance);
    const previousUSDT = Number(wallet.usdtBalance || 0);

    // =====================================================
    // UPDATE WALLET
    // =====================================================

    wallet.pkrBalance = previousPKR - totalPKR;
    wallet.usdtBalance = previousUSDT + amount;

    await wallet.save({ session });

    // =====================================================
    // SYNC USER BALANCE
    // =====================================================

    user.walletBalance = wallet.pkrBalance;
    user.usdtBalance = wallet.usdtBalance;

    await user.save({ session });

    // =====================================================
    // PKR WALLET HISTORY
    // =====================================================

    await WalletTransaction.create(
      [
        {
          userId: user._id,
          username: user.username,

          walletType: "PKR",
          type: "DEBIT",

          amount: totalPKR,

          previousBalance: previousPKR,
          newBalance: wallet.pkrBalance,

          adminUsername: "SYSTEM",
          note: `Bought ${amount} USDT @ PKR ${USDT_RATE}`,

          createdAt: new Date(),
        },
      ],
      { session }
    );

    // =====================================================
    // USDT WALLET HISTORY
    // =====================================================

    await WalletTransaction.create(
      [
        {
          userId: user._id,
          username: user.username,

          walletType: "USDT",
          type: "CREDIT",

          amount,

          previousBalance: previousUSDT,
          newBalance: wallet.usdtBalance,

          adminUsername: "SYSTEM",
          note: `Purchased ${amount} USDT`,

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

          type: "USDT BUY",
          amount,

          method: "Wallet",
          status: "Completed",

          transactionId: `USDTBUY-${Date.now()}`,

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
      message: "USDT purchased successfully.",

      transaction: {
        type: "BUY",
        rate: USDT_RATE,
        usdtAmount: amount,
        totalPKR,
      },

      wallet: {
        pkrBalance: wallet.pkrBalance,
        usdtBalance: wallet.usdtBalance,
      },
    });

  } catch (error) {
    await session.abortTransaction();

    console.error("BUY USDT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to purchase USDT.",
      error: error.message,
    });

  } finally {
    session.endSession();
  }
});

// =====================================================
// BUY USDT REQUEST
// POST /api/usdt/buy/request
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
        pkrAmount,
        usdtAmount,
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

      if (!username || !pkrAmount || !usdtAmount || !walletAddress) {
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

        type: "BUY",

        network: network || "TRC20",
        paymentMethod: paymentMethod || "BANK",

        pkrAmount: Number(pkrAmount),
        usdtAmount: Number(usdtAmount),

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
        message: "USDT Buy Request Submitted Successfully.",
        order,
      });

    } catch (error) {
      console.error("BUY REQUEST ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to submit USDT Buy request.",
        error: error.message,
      });
    }
  }
);

// =====================================================
// SELL USDT REQUEST
// POST /api/usdt/sell
// User sells USDT to Company
// =====================================================

router.post("/sell", verifyToken, async (req, res) => {
  try {
    const {
      username,
      usdtAmount,
      pkrAmount,
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

    if (!username || !usdtAmount || !walletAddress) {
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

    const wallet = await Wallet.findOne({ userId: user._id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (Number(wallet.usdtBalance || 0) < Number(usdtAmount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient USDT balance.",
      });
    }

    // =====================================================
    // CREATE SELL ORDER
    // =====================================================

    const order = await UsdtOrder.create({
      username,

      type: "SELL",

      network: network || "TRC20",
      paymentMethod: paymentMethod || "BANK",

      usdtAmount: Number(usdtAmount),

      pkrAmount:
        Number(pkrAmount) || Number(usdtAmount) * USDT_RATE,

      walletAddress,

      bankName: bankName || "",
      accountName: accountName || "",
      accountNumber: accountNumber || "",

      status: "Pending",

      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "USDT Sell Request Submitted Successfully.",
      order,
    });

  } catch (error) {
    console.error("SELL REQUEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit USDT Sell request.",
      error: error.message,
    });
  }
});

// =====================================================
// GET USER USDT HISTORY
// GET /api/usdt/history/:username
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
    // FIND WALLET
    // =====================================================

    const wallet = await Wallet.findOne({ userId: user._id });

    // Wallet na ho to empty history return karo
    if (!wallet) {
      return res.status(200).json({
        success: true,
        username,
        transactionCount: 0,
        summary: {
          totalCredits: 0,
          totalDebits: 0,
          currentUSDT: 0,
        },
        transactions: [],
      });
    }

    // =====================================================
    // LOAD USDT TRANSACTIONS
    // =====================================================

    const history = await WalletTransaction.find({
      username,
      walletType: "USDT",
    })
      .sort({ createdAt: -1 })
      .lean();

    // =====================================================
    // FORMAT TRANSACTIONS
    // =====================================================

    const transactions = history.map((tx) => ({
      _id: tx._id,

      username: tx.username,

      walletType: tx.walletType || "USDT",
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
        currentUSDT: Number(wallet.usdtBalance || 0),
      },

      transactions,
    });

  } catch (error) {
    console.error("USDT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT history.",
      error: error.message,
    });
  }
});

// =====================================================
// GET USER USDT BALANCE
// GET /api/usdt/balance/:username
// Frontend Wallet Card Support
// =====================================================

router.get("/balance/:username", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const wallet = await Wallet.findOne({
      userId: user._id,
    });

    return res.status(200).json({
      success: true,

      balance: {
        usdt: Number(wallet?.usdtBalance || 0),
        pkr: Number(wallet?.pkrBalance || 0),
        gold: Number(wallet?.goldBalance || 0),
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
// ADMIN APPROVE / REJECT USDT ORDER
// PUT /api/usdt/:id
// GoldTrade V18 Production
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
        message: "USDT order not found.",
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
    // FIND OR CREATE WALLET
    // =====================================================

    let wallet = await Wallet.findOne({
      userId: user._id,
    }).session(session);

    if (!wallet) {
      const createdWallet = await Wallet.create(
        [
          {
            userId: user._id,
            username: user.username,

            pkrBalance: Number(user.walletBalance || 0),
            usdtBalance: Number(user.usdtBalance || 0),
            goldBalance: Number(user.goldBalance || 0),
          },
        ],
        { session }
      );

      wallet = createdWallet[0];
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
        message: "USDT order rejected successfully.",
        order,
      });
    }

    // =====================================================
    // APPROVE ORDER
    // =====================================================

    const previousPKR = Number(wallet.pkrBalance || 0);
    const previousUSDT = Number(wallet.usdtBalance || 0);

    // ---------- BUY ORDER ----------
    if (order.type === "BUY") {
      wallet.usdtBalance += Number(order.usdtAmount);

      await WalletTransaction.create(
        [
          {
            userId: user._id,
            username: user.username,

            walletType: "USDT",
            type: "CREDIT",

            amount: Number(order.usdtAmount),

            previousBalance: previousUSDT,
            newBalance: wallet.usdtBalance,

            adminUsername: req.user.username,
            note: "USDT Buy Order Approved",

            createdAt: new Date(),
          },
        ],
        { session }
      );
    }

    // ---------- SELL ORDER ----------
    if (order.type === "SELL") {
      if (previousUSDT < Number(order.usdtAmount)) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message: "Insufficient USDT balance.",
        });
      }

      wallet.usdtBalance -= Number(order.usdtAmount);
      wallet.pkrBalance += Number(order.pkrAmount);

      // USDT Debit History
      await WalletTransaction.create(
        [
          {
            userId: user._id,
            username: user.username,

            walletType: "USDT",
            type: "DEBIT",

            amount: Number(order.usdtAmount),

            previousBalance: previousUSDT,
            newBalance: wallet.usdtBalance,

            adminUsername: req.user.username,
            note: "USDT Sell Order Approved",

            createdAt: new Date(),
          },
        ],
        { session }
      );

      // PKR Credit History
      await WalletTransaction.create(
        [
          {
            userId: user._id,
            username: user.username,

            walletType: "PKR",
            type: "CREDIT",

            amount: Number(order.pkrAmount),

            previousBalance: previousPKR,
            newBalance: wallet.pkrBalance,

            adminUsername: req.user.username,
            note: "PKR Credited Against USDT Sell",

            createdAt: new Date(),
          },
        ],
        { session }
      );
    }

    // =====================================================
    // SAVE WALLET
    // =====================================================

    await wallet.save({ session });

    // =====================================================
    // SYNC USER BALANCES
    // =====================================================

    user.walletBalance = wallet.pkrBalance;
    user.usdtBalance = wallet.usdtBalance;

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
            order.type === "BUY"
              ? "USDT Buy Approved"
              : "USDT Sell Approved",

          amount: Number(order.usdtAmount),

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
      message: `USDT ${order.type} order approved successfully.`,

      wallet: {
        pkrBalance: wallet.pkrBalance,
        usdtBalance: wallet.usdtBalance,
      },

      order,
    });

  } catch (error) {
    await session.abortTransaction();

    console.error("USDT ORDER APPROVAL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process USDT order.",
      error: error.message,
    });

  } finally {
    session.endSession();
  }
});

// =====================================================
// GET ALL USDT ORDERS (ADMIN)
// GET /api/usdt
// Frontend Admin USDT Page Compatible
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
    console.error("GET USDT ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load USDT orders.",
      error: error.message,
    });
  }
});

// =====================================================
// GET SINGLE USDT ORDER (ADMIN)
// GET /api/usdt/:id
// =====================================================

router.get("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const order = await UsdtOrder.findById(req.params.id).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "USDT order not found.",
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
      message: "Unable to load USDT order.",
      error: error.message,
    });
  }
});

// =====================================================
// DELETE USDT ORDER (ADMIN)
// DELETE /api/usdt/:id
// Only Pending Orders Can Be Deleted
// =====================================================

router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const order = await UsdtOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "USDT order not found.",
      });
    }

    if (order.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Approved orders cannot be deleted.",
      });
    }

    await UsdtOrder.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "USDT order deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE USDT ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete USDT order.",
      error: error.message,
    });
  }
});

// =====================================================
// ADMIN DASHBOARD SUMMARY
// GET /api/usdt/dashboard
// =====================================================

router.get("/dashboard", verifyToken, isAdmin, async (req, res) => {
  try {
    const pending = await UsdtOrder.countDocuments({ status: "Pending" });
    const approved = await UsdtOrder.countDocuments({ status: "Approved" });
    const rejected = await UsdtOrder.countDocuments({ status: "Rejected" });

    const totalBuy = await UsdtOrder.aggregate([
      { $match: { type: "BUY", status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$usdtAmount" } } },
    ]);

    const totalSell = await UsdtOrder.aggregate([
      { $match: { type: "SELL", status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$usdtAmount" } } },
    ]);

    return res.status(200).json({
      success: true,

      stats: {
        pendingOrders: pending,
        approvedOrders: approved,
        rejectedOrders: rejected,

        totalBuyUSDT: totalBuy[0]?.total || 0,
        totalSellUSDT: totalSell[0]?.total || 0,

        currentRate: USDT_RATE,
      },
    });

  } catch (error) {
    console.error("USDT DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard statistics.",
      error: error.message,
    });
  }
});

// =====================================================
// HEALTH CHECK
// GET /api/usdt/health
// =====================================================

router.get("/health", async (req, res) => {
  return res.status(200).json({
    success: true,
    module: "GoldTrade V18 USDT API",
    version: "V18 Final",

    status: "Running",

    endpoints: {
      rate: "/api/usdt/rate",
      price: "/api/usdt/price",
      buy: "/api/usdt/buy",
      buyRequest: "/api/usdt/buy/request",
      sell: "/api/usdt/sell",
      history: "/api/usdt/history/:username",
      balance: "/api/usdt/balance/:username",
      adminOrders: "/api/usdt",
      adminDashboard: "/api/usdt/dashboard",
    },

    timestamp: new Date(),
  });
});

// =====================================================
// MODULE EXPORT
// =====================================================

module.exports = router;