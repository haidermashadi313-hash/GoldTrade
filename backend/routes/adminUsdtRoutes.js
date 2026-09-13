const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const USDTTransaction = require("../models/USDTTransaction");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const { verifyToken } = require("../middleware/authMiddleware");

// =============================================
// ADMIN ONLY MIDDLEWARE
// =============================================

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access only.",
    });
  }

  next();
};

// =============================================
// GET ALL BUY / SELL REQUESTS
// GET /api/admin/usdt
// ?username=hashi
// ?status=Pending
// ?type=BUY
// =============================================

router.get("/", verifyToken, adminOnly, async (req, res) => {
  try {
    const { username, status, type } = req.query;

    const filter = {};

    if (username) {
      filter.username = {
        $regex: username,
        $options: "i",
      };
    }

    if (status && status !== "All") {
      filter.status = status;
    }

    if (type && type !== "All") {
      filter.transactionType = type;
    }

    const transactions = await USDTTransaction.find(filter).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      total: transactions.length,
      transactions,
    });
  } catch (err) {
    console.error("Load USDT Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load USDT requests.",
    });
  }
});

// =============================================
// USDT DASHBOARD STATS
// GET /api/admin/usdt/stats
// =============================================

router.get("/stats", verifyToken, adminOnly, async (req, res) => {
  try {
    const pendingBuy = await USDTTransaction.countDocuments({
      transactionType: "BUY",
      status: "Pending",
    });

    const pendingSell = await USDTTransaction.countDocuments({
      transactionType: "SELL",
      status: "Pending",
    });

    const approvedBuy = await USDTTransaction.aggregate([
      {
        $match: {
          transactionType: "BUY",
          status: "Approved",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$usdtAmount" },
        },
      },
    ]);

    const approvedSell = await USDTTransaction.aggregate([
      {
        $match: {
          transactionType: "SELL",
          status: "Approved",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$usdtAmount" },
        },
      },
    ]);

    res.json({
      success: true,

      stats: {
        pendingBuy,
        pendingSell,

        buyVolume: approvedBuy[0]?.total || 0,
        sellVolume: approvedSell[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error("USDT Stats Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load USDT stats.",
    });
  }
});

// =============================================
// GET SINGLE REQUEST
// GET /api/admin/usdt/:id
// =============================================

router.get("/:id", verifyToken, adminOnly, async (req, res) => {
  try {
    const transaction = await USDTTransaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "USDT request not found.",
      });
    }

    res.json({
      success: true,
      transaction,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to load request.",
    });
  }
});
// =============================================
// APPROVE BUY / SELL REQUEST
// PUT /api/admin/usdt/:id/approve
// BUY  -> Credit USDT Balance
// SELL -> Deduct USDT Balance
// =============================================

router.put("/:id/approve", verifyToken, adminOnly, async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const request = await USDTTransaction.findById(req.params.id).session(session);

    if (!request) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "USDT request not found.",
      });
    }

    if (request.status !== "Pending") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Request already processed.",
      });
    }

    const user = await User.findOne({
      username: request.username,
    }).session(session);

    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // BUY = Credit USDT
    if (request.transactionType === "BUY") {
      user.usdtBalance =
        (user.usdtBalance || 0) + request.usdtAmount;
    }

    // SELL = Deduct USDT
    if (request.transactionType === "SELL") {
      if ((user.usdtBalance || 0) < request.usdtAmount) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "User has insufficient USDT balance.",
        });
      }

      user.usdtBalance -= request.usdtAmount;
    }

    await user.save({ session });

    request.status = "Approved";
    request.adminNote = req.body.adminNote || "";
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();

    await request.save({ session });

    await Transaction.create(
      [
        {
          userId: user._id,
          username: user.username,
          type:
            request.transactionType === "BUY"
              ? "Buy USDT"
              : "Sell USDT",

          status: "Approved",

          amount: request.usdtAmount,

          description:
            request.transactionType === "BUY"
              ? "USDT credited by admin."
              : "USDT deducted after sell approval.",
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: `${request.transactionType} request approved successfully.`,
      usdtBalance: user.usdtBalance,
    });
  } catch (err) {
    await session.abortTransaction();

    console.error("Approve USDT Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to approve request.",
    });
  } finally {
    session.endSession();
  }
});

// =============================================
// REJECT BUY / SELL REQUEST
// PUT /api/admin/usdt/:id/reject
// =============================================

router.put("/:id/reject", verifyToken, adminOnly, async (req, res) => {
  try {
    const request = await USDTTransaction.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "USDT request not found.",
      });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Request already processed.",
      });
    }

    request.status = "Rejected";
    request.adminNote = req.body.adminNote || "";
    request.rejectedBy = req.user._id;
    request.rejectedAt = new Date();

    await request.save();

    res.json({
      success: true,
      message: `${request.transactionType} request rejected successfully.`,
    });
  } catch (err) {
    console.error("Reject USDT Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to reject request.",
    });
  }
});

// =============================================
// RECENT BUY / SELL REQUESTS
// GET /api/admin/usdt/recent
// =============================================

router.get("/recent", verifyToken, adminOnly, async (req, res) => {
  try {
    const transactions = await USDTTransaction.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      transactions,
    });
  } catch (err) {
    console.error("Recent USDT Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load recent USDT requests.",
    });
  }
});

// =============================================
// EXPORT ROUTER
// =============================================

module.exports = router;