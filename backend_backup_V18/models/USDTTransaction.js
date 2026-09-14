const mongoose = require("mongoose");

const usdtTransactionSchema = new mongoose.Schema(
  {
    // ================= USER =================
    username: {
      type: String,
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ================= TRANSACTION TYPE =================
    transactionType: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },

    // ================= AMOUNTS =================
    pkrAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    usdtAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    rate: {
      type: Number,
      required: true,
    },

    network: {
      type: String,
      default: "TRC20",
      enum: ["TRC20", "BEP20", "ERC20"],
    },

    // ================= PAYMENT METHOD =================
    paymentMethod: {
      type: String,
      enum: ["BANK", "EASYPAISA", "NAYAPAY", "USDT"],
      required: true,
    },

    // User wallet address (BUY)
    walletAddress: {
      type: String,
      default: "",
    },

    // Payment details (SELL)
    accountTitle: {
      type: String,
      default: "",
    },

    accountNumber: {
      type: String,
      default: "",
    },

    bankName: {
      type: String,
      default: "",
    },

    // Receipt Upload
    receiptImage: {
      type: String,
      default: "",
    },

    // ================= STATUS =================
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    // ================= ADMIN INFO =================
    adminNote: {
      type: String,
      default: "",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "USDTTransaction",
  usdtTransactionSchema
);
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const User = require("../models/User");
const USDTTransaction = require("../models/USDTTransaction");

// ======================================================
// RECEIPT IMAGE UPLOAD
// uploads/usdt/
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/usdt/");
  },

  filename: (req, file, cb) => {
    const unique =
      Date.now() + "-" + Math.round(Math.random() * 1000000);

    cb(
      null,
      "receipt-" + unique + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// ======================================================
// LIVE BUY / SELL RATE
// GET /api/usdt/rate
// ======================================================

router.get("/rate", async (req, res) => {
  try {
    res.json({
      success: true,
      rate: {
        buyRate: 282.4,
        sellRate: 281.2,
        updatedAt: new Date(),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Unable to load USDT rate.",
    });
  }
});

// ======================================================
// BUY USDT REQUEST
// POST /api/usdt/buy
// ======================================================

router.post(
  "/buy",
  upload.single("receipt"),
  async (req, res) => {
    try {
      const {
        username,
        walletAddress,
        pkrAmount,
        usdtAmount,
        network,
        paymentMethod,
      } = req.body;

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const transaction = await USDTTransaction.create({
        username,
        userId: user._id,

        transactionType: "BUY",

        pkrAmount: Number(pkrAmount),
        usdtAmount: Number(usdtAmount),

        rate: 282.4,

        walletAddress,
        network: network || "TRC20",

        paymentMethod,

        receiptImage: req.file
          ? `/uploads/usdt/${req.file.filename}`
          : "",

        status: "Pending",
      });

      res.json({
        success: true,
        message: "Buy USDT request submitted successfully.",
        transaction,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Unable to submit Buy USDT request.",
      });
    }
  }
);
// ======================================================
// SELL USDT REQUEST
// POST /api/usdt/sell
// ======================================================

router.post("/sell", async (req, res) => {
  try {
    const {
      username,
      usdtAmount,
      pkrAmount,
      paymentMethod,
      accountTitle,
      accountNumber,
      bankName,
    } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check USDT Balance
    if ((user.usdtBalance || 0) < Number(usdtAmount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient USDT balance.",
      });
    }

    const transaction = await USDTTransaction.create({
      username,
      userId: user._id,

      transactionType: "SELL",

      usdtAmount: Number(usdtAmount),
      pkrAmount: Number(pkrAmount),

      rate: 281.2,

      paymentMethod,
      accountTitle,
      accountNumber,
      bankName,

      network: "TRC20",

      status: "Pending",
    });

    res.json({
      success: true,
      message: "Sell USDT request submitted successfully.",
      transaction,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to submit Sell USDT request.",
    });
  }
});

// ======================================================
// USER USDT HISTORY
// GET /api/usdt/history/:username
// ======================================================

router.get("/history/:username", async (req, res) => {
  try {
    const transactions = await USDTTransaction.find({
      username: req.params.username,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      total: transactions.length,
      transactions,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to load USDT history.",
    });
  }
});

// ======================================================
// ADMIN - ALL PENDING USDT REQUESTS
// GET /api/usdt/pending
// ======================================================

router.get("/pending", async (req, res) => {
  try {
    const transactions = await USDTTransaction.find({
      status: "Pending",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      total: transactions.length,
      transactions,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to load pending USDT requests.",
    });
  }
});

// ======================================================
// ADMIN - APPROVED USDT REQUESTS
// GET /api/usdt/approved
// ======================================================

router.get("/approved", async (req, res) => {
  try {
    const transactions = await USDTTransaction.find({
      status: "Approved",
    }).sort({ approvedAt: -1 });

    res.json({
      success: true,
      total: transactions.length,
      transactions,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to load approved USDT requests.",
    });
  }
});

// ======================================================
// ADMIN - REJECTED USDT REQUESTS
// GET /api/usdt/rejected
// ======================================================

router.get("/rejected", async (req, res) => {
  try {
    const transactions = await USDTTransaction.find({
      status: "Rejected",
    }).sort({ rejectedAt: -1 });

    res.json({
      success: true,
      total: transactions.length,
      transactions,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to load rejected USDT requests.",
    });
  }
});
// ======================================================
// ADMIN APPROVE USDT REQUEST
// PUT /api/usdt/:id/approve
// ======================================================

router.put("/:id/approve", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const transaction = await USDTTransaction.findById(req.params.id).session(session);

    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "USDT request not found.",
      });
    }

    if (transaction.status !== "Pending") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Request already processed.",
      });
    }

    const user = await User.findById(transaction.userId).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ================= BUY APPROVAL =================
    if (transaction.transactionType === "BUY") {
      user.usdtBalance = (user.usdtBalance || 0) + transaction.usdtAmount;
    }

    // ================= SELL APPROVAL =================
    if (transaction.transactionType === "SELL") {
      if ((user.usdtBalance || 0) < transaction.usdtAmount) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "User has insufficient USDT balance.",
        });
      }

      // Deduct USDT
      user.usdtBalance -= transaction.usdtAmount;

      // Credit PKR Wallet
      user.walletBalance =
        (user.walletBalance || 0) + transaction.pkrAmount;
    }

    await user.save({ session });

    transaction.status = "Approved";
    transaction.adminNote = req.body.adminNote || "";
    transaction.approvedAt = new Date();
    transaction.approvedBy = req.body.adminId || null;

    await transaction.save({ session });

    // Transaction History
    await Transaction.create(
      [
        {
          username: user.username,
          type:
            transaction.transactionType === "BUY"
              ? "USDT_BUY_APPROVED"
              : "USDT_SELL_APPROVED",

          amount: transaction.transactionType === "BUY"
            ? transaction.usdtAmount
            : transaction.pkrAmount,

          status: "Approved",

          description:
            transaction.transactionType === "BUY"
              ? `Admin approved BUY ${transaction.usdtAmount} USDT`
              : `Admin approved SELL ${transaction.usdtAmount} USDT`,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: `${transaction.transactionType} request approved successfully.`,
      walletBalance: user.walletBalance,
      usdtBalance: user.usdtBalance,
    });

  } catch (err) {
    await session.abortTransaction();

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to approve USDT request.",
    });

  } finally {
    session.endSession();
  }
});

// ======================================================
// ADMIN REJECT USDT REQUEST
// PUT /api/usdt/:id/reject
// ======================================================

router.put("/:id/reject", async (req, res) => {
  try {
    const transaction = await USDTTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "USDT request not found.",
      });
    }

    if (transaction.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed.",
      });
    }

    transaction.status = "Rejected";
    transaction.rejectedAt = new Date();
    transaction.rejectedBy = req.body.adminId || null;
    transaction.adminNote =
      req.body.adminNote || "Rejected by Admin";

    await transaction.save();

    res.json({
      success: true,
      message: `${transaction.transactionType} request rejected successfully.`,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to reject USDT request.",
    });
  }
});
// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;