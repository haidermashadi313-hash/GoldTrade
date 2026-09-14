const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const UsdtOrder = require("../models/UsdtOrder");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

// ==========================================
// Upload Receipt
// ==========================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/usdt/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        "-" +
        Math.round(Math.random() * 1000000) +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

// ==========================================
// BUY USDT REQUEST
// ==========================================
router.post("/buy", upload.single("receipt"), async (req, res) => {
  try {
    const order = await UsdtOrder.create({
      username: req.body.username,
      type: "BUY",
      network: "TRC20",
      pkrAmount: Number(req.body.pkrAmount),
      usdtAmount: Number(req.body.usdtAmount),
      walletAddress: req.body.walletAddress,
      receiptImage: req.file ? req.file.filename : "",
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "USDT Buy Request Submitted",
      data: order,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==========================================
// SELL USDT REQUEST
// ==========================================
router.post("/sell", async (req, res) => {
  try {
    const order = await UsdtOrder.create({
      username: req.body.username,
      type: "SELL",
      network: "TRC20",
      pkrAmount: Number(req.body.pkrAmount),
      usdtAmount: Number(req.body.usdtAmount),
      walletAddress: req.body.walletAddress,
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "USDT Sell Request Submitted",
      data: order,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==========================================
// GET ALL USDT ORDERS (Admin)
// ==========================================
router.get("/", async (req, res) => {
  try {
    const orders = await UsdtOrder.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ==========================================
// APPROVE / REJECT USDT ORDER
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await UsdtOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.status !== "Pending") {
      return res.json({
        success: false,
        message: "Order already processed.",
      });
    }

    order.status = status;
    await order.save();

    const user = await User.findOne({
      username: order.username,
    });

    if (status === "Approved" && user) {
      // BUY = Credit USDT
      if (order.type === "BUY") {
        user.usdtBalance += Number(order.usdtAmount);
      }

      // SELL = Debit USDT
      if (order.type === "SELL") {
        if (user.usdtBalance < order.usdtAmount) {
          return res.json({
            success: false,
            message: "Insufficient USDT Balance.",
          });
        }

        user.usdtBalance -= Number(order.usdtAmount);
      }

      await user.save();

      await Transaction.create({
        username: order.username,
        type: order.type === "BUY" ? "USDT Buy" : "USDT Sell",
        amount: order.usdtAmount,
        method: "TRC20",
        status: "Approved",
        transactionId: order._id.toString(),
      });
    }

    if (status === "Rejected") {
      await Transaction.create({
        username: order.username,
        type: order.type === "BUY" ? "USDT Buy" : "USDT Sell",
        amount: order.usdtAmount,
        method: "TRC20",
        status: "Rejected",
        transactionId: order._id.toString(),
      });
    }

    res.json({
      success: true,
      message: `Order ${status} Successfully.`,
      data: order,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;