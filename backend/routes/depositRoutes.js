// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js
// PART 1/6
// Production Ready (Render + PM2 + MongoDB)
// ======================================================

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const Deposit = require("../models/Deposit");
const User = require("../models/User");

// ======================================================
// MIDDLEWARE
// ======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// ======================================================
// HEALTH CHECK
// GET /api/deposit/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "Deposit API",
    version: "V18 Enterprise",
    status: "ONLINE",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// GET USER DEPOSIT HISTORY
// GET /api/deposit/history/:username
// Used By Deposit Page
// ======================================================

router.get("/history/:username", verifyToken, async (req, res) => {
  try {
    const { username } = req.params;

    const deposits = await Deposit.find({ username })
      .sort({ createdAt: -1 })
      .lean();

    const history = deposits.map((deposit) => ({
      _id: deposit._id,
      username: deposit.username,
      amount: Number(deposit.amount),
      paymentMethod: deposit.paymentMethod,
      transactionId: deposit.transactionId,
      senderName: deposit.senderName || "",
      proofImage: deposit.proofImage || "",
      status: deposit.status,
      note: deposit.note || "",
      createdAt: deposit.createdAt,
    }));

    return res.status(200).json({
      success: true,
      total: history.length,
      history,
    });

  } catch (error) {
    console.error("GET DEPOSIT HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit history.",
    });
  }
});

// ======================================================
// GET USER PENDING DEPOSITS
// GET /api/deposit/pending/:username
// ======================================================

router.get("/pending/:username", verifyToken, async (req, res) => {
  try {
    const pending = await Deposit.find({
      username: req.params.username,
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: pending.length,
      deposits: pending,
    });

  } catch (error) {
    console.error("GET PENDING DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending deposits.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js
// PART 2/6
// Create Deposit API (Production)
// ======================================================

// POST /api/deposit/create
// Used By User Deposit Page

router.post("/create", verifyToken, async (req, res) => {
  try {
    const {
      amount,
      paymentMethod,
      transactionId,
      senderName,
      proofImage,
    } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!amount || !paymentMethod || !transactionId) {
      return res.status(400).json({
        success: false,
        message:
          "Amount, payment method and transaction ID are required.",
      });
    }

    const depositAmount = Number(amount);

    if (isNaN(depositAmount) || depositAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid deposit amount.",
      });
    }

    // ==================================================
    // FIND USER
    // ==================================================

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ==================================================
    // DUPLICATE TRANSACTION CHECK
    // ==================================================

    const duplicate = await Deposit.findOne({
      transactionId: transactionId.trim(),
    });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: "Transaction ID already submitted.",
      });
    }

    // ==================================================
    // CREATE DEPOSIT REQUEST
    // ==================================================

    const deposit = await Deposit.create({
      userId: user._id,
      username: user.username,
      email: user.email,

      amount: depositAmount,

      paymentMethod: paymentMethod.toUpperCase(),

      transactionId: transactionId.trim(),

      senderName: senderName?.trim() || "",

      proofImage: proofImage || "",

      status: "PENDING",

      note: "",
    });

    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    return res.status(201).json({
      success: true,
      message:
        "Deposit request submitted successfully. Waiting for admin approval.",

      deposit: {
        _id: deposit._id,
        amount: deposit.amount,
        paymentMethod: deposit.paymentMethod,
        transactionId: deposit.transactionId,
        status: deposit.status,
        createdAt: deposit.createdAt,
      },
    });

  } catch (error) {
    console.error("CREATE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create deposit request.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js
// PART 3/6
// Deposit Details API + User Deposit Summary
// ======================================================

// ======================================================
// GET SINGLE DEPOSIT DETAILS
// GET /api/deposit/details/:depositId
// Used By Deposit Receipt / History Modal
// ======================================================

router.get("/details/:depositId", verifyToken, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.depositId).lean();

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    // User sirf apna deposit dekh sakta hai
    if (
      deposit.userId.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      deposit: {
        _id: deposit._id,
        username: deposit.username,
        amount: Number(deposit.amount),
        paymentMethod: deposit.paymentMethod,
        transactionId: deposit.transactionId,
        senderName: deposit.senderName || "",
        proofImage: deposit.proofImage || "",
        status: deposit.status,
        note: deposit.note || "",
        createdAt: deposit.createdAt,
        updatedAt: deposit.updatedAt,
      },
    });

  } catch (error) {
    console.error("GET DEPOSIT DETAILS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit details.",
    });
  }
});

// ======================================================
// GET USER DEPOSIT SUMMARY
// GET /api/deposit/summary/:username
// Used By Dashboard + Deposit Page
// ======================================================

router.get("/summary/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username;

    const deposits = await Deposit.find({ username }).lean();

    let totalDeposits = 0;
    let approvedAmount = 0;
    let pendingAmount = 0;
    let rejectedAmount = 0;

    deposits.forEach((deposit) => {
      totalDeposits += 1;

      const amount = Number(deposit.amount);

      switch (deposit.status) {
        case "APPROVED":
          approvedAmount += amount;
          break;

        case "PENDING":
          pendingAmount += amount;
          break;

        case "REJECTED":
          rejectedAmount += amount;
          break;
      }
    });

    return res.status(200).json({
      success: true,
      summary: {
        username,
        totalDeposits,
        approvedAmount,
        pendingAmount,
        rejectedAmount,
      },
    });

  } catch (error) {
    console.error("GET DEPOSIT SUMMARY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit summary.",
    });
  }
});

// ======================================================
// GET USER DEPOSIT STATISTICS
// GET /api/deposit/statistics/:username
// Used By Dashboard Cards
// ======================================================

router.get("/statistics/:username", verifyToken, async (req, res) => {
  try {
    const username = req.params.username;

    const approved = await Deposit.countDocuments({
      username,
      status: "APPROVED",
    });

    const pending = await Deposit.countDocuments({
      username,
      status: "PENDING",
    });

    const rejected = await Deposit.countDocuments({
      username,
      status: "REJECTED",
    });

    const latestDeposit = await Deposit.findOne({ username })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      statistics: {
        approved,
        pending,
        rejected,
        latestDeposit,
      },
    });

  } catch (error) {
    console.error("GET DEPOSIT STATISTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit statistics.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js
// PART 4/6
// Admin Deposit APIs (Production)
// ======================================================

// ======================================================
// GET ALL DEPOSITS
// GET /api/admin/deposits
// Used By Admin Deposit Page
// ======================================================

router.get("/admin/all", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: deposits.length,
      deposits,
    });

  } catch (error) {
    console.error("GET ALL DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposits.",
    });
  }
});

// ======================================================
// GET PENDING DEPOSITS
// GET /api/admin/deposits/pending
// ======================================================

router.get("/admin/pending", verifyToken, isAdmin, async (req, res) => {
  try {
    const pending = await Deposit.find({
      status: "PENDING",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: pending.length,
      deposits: pending,
    });

  } catch (error) {
    console.error("GET PENDING DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending deposits.",
    });
  }
});

// ======================================================
// SEARCH DEPOSITS
// GET /api/admin/deposits/search/:keyword
// Search by Username / Email / Transaction ID
// ======================================================

router.get("/admin/search/:keyword", verifyToken, isAdmin, async (req, res) => {
  try {
    const keyword = req.params.keyword;

    const deposits = await Deposit.find({
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } },
        { transactionId: { $regex: keyword, $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      total: deposits.length,
      deposits,
    });

  } catch (error) {
    console.error("SEARCH DEPOSITS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to search deposits.",
    });
  }
});

// ======================================================
// DEPOSIT STATISTICS
// GET /api/admin/deposits/statistics
// Used By Admin Dashboard
// ======================================================

router.get("/admin/statistics", verifyToken, isAdmin, async (req, res) => {
  try {
    const total = await Deposit.countDocuments();

    const pending = await Deposit.countDocuments({
      status: "PENDING",
    });

    const approved = await Deposit.countDocuments({
      status: "APPROVED",
    });

    const rejected = await Deposit.countDocuments({
      status: "REJECTED",
    });

    const approvedDeposits = await Deposit.find({
      status: "APPROVED",
    }).select("amount");

    const totalApprovedAmount = approvedDeposits.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    return res.status(200).json({
      success: true,
      statistics: {
        total,
        pending,
        approved,
        rejected,
        totalApprovedAmount,
      },
    });

  } catch (error) {
    console.error("DEPOSIT STATISTICS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load deposit statistics.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js
// PART 5/6
// Approve Deposit + Credit Wallet (Production)
// ======================================================

// PATCH /api/deposit/approve/:depositId
// Used internally by Admin Routes

router.patch("/approve/:depositId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { depositId } = req.params;

    const deposit = await Deposit.findById(depositId);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    if (deposit.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Deposit already approved.",
      });
    }

    const user = await User.findById(deposit.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Create wallet object if missing
    if (!user.wallet) {
      user.wallet = {
        pkr: Number(user.pkrBalance || 0),
        gold: Number(user.goldBalance || 0),
        usdt: Number(user.usdtBalance || 0),
      };
    }

    // Credit PKR Wallet
    user.wallet.pkr =
      Number(user.wallet.pkr || 0) + Number(deposit.amount);

    user.pkrBalance = user.wallet.pkr;

    await user.save();

    // Update Deposit Status
    deposit.status = "APPROVED";
    deposit.note = req.body.note || "Deposit approved by Admin";
    deposit.approvedBy = req.user.username;
    deposit.approvedAt = new Date();

    await deposit.save();

    // Wallet History Entry
    await WalletHistory.create({
      userId: user._id,
      username: user.username,
      walletType: "PKR",
      type: "CREDIT",
      amount: Number(deposit.amount),
      balanceAfter: Number(user.wallet.pkr),
      note: `Deposit Approved (${deposit.paymentMethod})`,
      admin: req.user.username,
    });

    return res.status(200).json({
      success: true,
      message: "Deposit approved successfully.",
      walletBalance: {
        pkrBalance: Number(user.wallet.pkr),
        goldBalance: Number(user.wallet.gold || 0),
        usdtBalance: Number(user.wallet.usdt || 0),
      },
      deposit,
    });

  } catch (error) {
    console.error("APPROVE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve deposit.",
    });
  }
});

// ======================================================
// GoldTrade V18 Enterprise Backend
// depositRoutes.js
// PART 6/6
// Reject Deposit + Cancel Pending Deposit + Export Router
// ======================================================

// ======================================================
// REJECT DEPOSIT
// PATCH /api/deposit/reject/:depositId
// Used By Admin Panel
// ======================================================

router.patch("/reject/:depositId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { depositId } = req.params;
    const { note } = req.body;

    const deposit = await Deposit.findById(depositId);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    if (deposit.status === "APPROVED") {
      return res.status(400).json({
        success: false,
        message: "Approved deposit cannot be rejected.",
      });
    }

    if (deposit.status === "REJECTED") {
      return res.status(400).json({
        success: false,
        message: "Deposit already rejected.",
      });
    }

    deposit.status = "REJECTED";
    deposit.note = note || "Deposit rejected by Admin";
    deposit.rejectedBy = req.user.username;
    deposit.rejectedAt = new Date();

    await deposit.save();

    return res.status(200).json({
      success: true,
      message: "Deposit rejected successfully.",
      deposit,
    });

  } catch (error) {
    console.error("REJECT DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject deposit.",
    });
  }
});

// ======================================================
// USER CANCEL PENDING DEPOSIT
// DELETE /api/deposit/cancel/:depositId
// User can cancel only PENDING deposit
// ======================================================

router.delete("/cancel/:depositId", verifyToken, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.depositId);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    if (deposit.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    if (deposit.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending deposits can be cancelled.",
      });
    }

    await Deposit.findByIdAndDelete(deposit._id);

    return res.status(200).json({
      success: true,
      message: "Deposit request cancelled successfully.",
    });

  } catch (error) {
    console.error("CANCEL DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel deposit.",
    });
  }
});

// ======================================================
// ADMIN DELETE DEPOSIT (OPTIONAL)
// DELETE /api/deposit/admin/:depositId
// ======================================================

router.delete("/admin/:depositId", verifyToken, isAdmin, async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.depositId);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    await Deposit.findByIdAndDelete(deposit._id);

    return res.status(200).json({
      success: true,
      message: "Deposit deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE DEPOSIT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete deposit.",
    });
  }
});

// ======================================================
// ROUTER EXPORT
// ======================================================

module.exports = router;
