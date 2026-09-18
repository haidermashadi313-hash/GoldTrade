const mongoose = require("mongoose");

const UsdtTransactionSchema = new mongoose.Schema(
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
      enum: ["buy", "sell"],
      required: true,
    },

    // ================= AMOUNTS =================
    PkrAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    UsdtAmount: {
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
      enum: ["BANK", "EASYPAISA", "NAYAPAY", "Usdt"],
      required: true,
    },

    // User wallet address (buy)
    walletAddress: {
      type: String,
      default: "",
    },

    // Payment details (sell)
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
  "UsdtTransaction",
  UsdtTransactionSchema
);
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const User = require("../models/User");
const UsdtTransaction = require("../models/UsdtTransaction");

// ======================================================
// RECEIPT IMAGE UPLOAD
// uploads/Usdt/
// ======================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/Usdt/");
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
// LIVE buy / sell RATE
// GET /api/Usdt/rate
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
      message: "Unable to load Usdt rate.",
    });
  }
});

// ======================================================
// buy Usdt REQUEST
// POST /api/Usdt/buy
// ======================================================

router.post(
  "/buy",
  upload.single("receipt"),
  async (req, res) => {
    try {
      const {
        username,
        walletAddress,
        PkrAmount,
        UsdtAmount,
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

      const transaction = await UsdtTransaction.create({
        username,
        userId: user._id,

        transactionType: "buy",

        PkrAmount: Number(PkrAmount),
        UsdtAmount: Number(UsdtAmount),

        rate: 282.4,

        walletAddress,
        network: network || "TRC20",

        paymentMethod,

        receiptImage: req.file
          ? `/uploads/Usdt/${req.file.filename}`
          : "",

        status: "Pending",
      });

      res.json({
        success: true,
        message: "buy Usdt request submitted successfully.",
        transaction,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        success: false,
        message: "Unable to submit buy Usdt request.",
      });
    }
  }
);
// ======================================================
// sell Usdt REQUEST
// POST /api/Usdt/sell
// ======================================================

router.post("/sell", async (req, res) => {
  try {
    const {
      username,
      UsdtAmount,
      PkrAmount,
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

    // Check Usdt Balance
    if ((user.UsdtBalance || 0) < Number(UsdtAmount)) {
      return res.status(400).json({
        success: false,
        message: "Insufficient Usdt balance.",
      });
    }

    const transaction = await UsdtTransaction.create({
      username,
      userId: user._id,

      transactionType: "sell",

      UsdtAmount: Number(UsdtAmount),
      PkrAmount: Number(PkrAmount),

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
      message: "sell Usdt request submitted successfully.",
      transaction,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to submit sell Usdt request.",
    });
  }
});

// ======================================================
// USER Usdt history
// GET /api/Usdt/history/:username
// ======================================================

router.get("/history/:username", async (req, res) => {
  try {
    const transactions = await UsdtTransaction.find({
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
      message: "Unable to load Usdt history.",
    });
  }
});

// ======================================================
// ADMIN - ALL PENDING Usdt REQUESTS
// GET /api/Usdt/pending
// ======================================================

router.get("/pending", async (req, res) => {
  try {
    const transactions = await UsdtTransaction.find({
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
      message: "Unable to load pending Usdt requests.",
    });
  }
});

// ======================================================
// ADMIN - APPROVED Usdt REQUESTS
// GET /api/Usdt/approved
// ======================================================

router.get("/approved", async (req, res) => {
  try {
    const transactions = await UsdtTransaction.find({
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
      message: "Unable to load approved Usdt requests.",
    });
  }
});

// ======================================================
// ADMIN - REJECTED Usdt REQUESTS
// GET /api/Usdt/rejected
// ======================================================

router.get("/rejected", async (req, res) => {
  try {
    const transactions = await UsdtTransaction.find({
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
      message: "Unable to load rejected Usdt requests.",
    });
  }
});
// ======================================================
// ADMIN APPROVE Usdt REQUEST
// PUT /api/Usdt/:id/approve Usdt REQUEST
// ======================================================

router.put("/:id/approve", async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const transaction = await UsdtTransaction.findById(req.params.id).session(session);

    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Usdt request not found.",
      });
    }

    if (transaction.status !== "Pending") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Usdt request already processed.",
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

    // ================= buy APPROVAL =================
    if (transaction.transactionType === "buy") {
      user.UsdtBalance = (user.UsdtBalance || 0) + transaction.UsdtAmount;
    }

    // ================= sell APPROVAL =================
    if (transaction.transactionType === "sell") {
      if ((user.UsdtBalance || 0) < transaction.UsdtAmount) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "User has insufficient Usdt balance.",
        });
      }

      // Deduct Usdt
      user.UsdtBalance -= transaction.UsdtAmount;

      // Credit Pkr wallet
      user.walletBalance =
        (user.walletBalance || 0) + transaction.PkrAmount;
    }

    await user.save({ session });

    transaction.status = "Approved";
    transaction.adminNote = req.body.adminNote || "";
    transaction.approvedAt = new Date();
    transaction.approvedBy = req.body.adminId || null;

    await transaction.save({ session });

    // Transaction history
    await Transaction.create(
      [
        {
          username: user.username,
          type:
            transaction.transactionType === "buy"
              ? "Usdt_buy_APPROVED"
              : "Usdt_sell_APPROVED",

          amount: transaction.transactionType === "buy"
            ? transaction.UsdtAmount
            : transaction.PkrAmount,

          status: "Approved",

          description:
            transaction.transactionType === "buy"
              ? `Admin approved buy ${transaction.UsdtAmount} Usdt`
              : `Admin approved sell ${transaction.UsdtAmount} Usdt`,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: `${transaction.transactionType} request approved successfully.`,
      walletBalance: user.walletBalance,
      UsdtBalance: user.UsdtBalance,
    });

  } catch (err) {
    await session.abortTransaction();

    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to approve Usdt request.",
    });

  } finally {
    session.endSession();
  }
});

// ======================================================
// ADMIN REJECT Usdt REQUEST
// PUT /api/Usdt/:id/reject Usdt REQUEST
// ======================================================

router.put("/:id/reject", async (req, res) => {
  try {
    const transaction = await UsdtTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Usdt request not found.",
      });
    }

    if (transaction.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Usdt request already processed.",
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
      message: "Unable to reject Usdt request.",
    });
  }
});
// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;