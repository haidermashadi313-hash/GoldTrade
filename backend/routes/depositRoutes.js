const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const Deposit = require("../models/Deposit");
const Transaction = require("../models/Transaction");

// ================= Upload Receipt =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/receipts/");
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

// ================= Create Deposit =================
router.post("/", upload.single("receipt"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Receipt image is required.",
      });
    }

    const deposit = await Deposit.create({
      username: req.body.username,
      amount: Number(req.body.amount),
      method: req.body.method,
      transactionId: req.body.transactionId,
      receiptImage: req.file.filename,
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Deposit submitted successfully.",
      data: deposit,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ================= Get Deposits =================
router.get("/", async (req, res) => {
  try {
    const deposits = await Deposit.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: deposits,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// ================= Approve / Reject =================
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    if (deposit.status !== "Pending") {
      return res.json({
        success: false,
        message: "Deposit already processed.",
      });
    }

    deposit.status = status;
    await deposit.save();

    // Save transaction only
    await Transaction.create({
      username: deposit.username,
      type: "Deposit",
      amount: deposit.amount,
      method: deposit.method,
      status,
      transactionId: deposit.transactionId,
    });

    res.json({
      success: true,
      message: `Deposit ${status}. Wallet balance will be updated manually by Admin Wallet Manager.`,
      data: deposit,
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