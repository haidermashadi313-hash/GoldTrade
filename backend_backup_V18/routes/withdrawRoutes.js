const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Withdraw = require("../models/Withdraw");
const User = require("../models/User");
const WalletTransaction = require("../models/WalletTransaction");

const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

// ======================================================
// USER CREATE WITHDRAW REQUEST
// POST /api/withdraw/request
// ======================================================

router.post("/request", verifyToken, async (req, res) => {
  try {
    const {
      amount,
      paymentMethod,
      bankName,
      accountTitle,
      accountNumber,
      iban,
      walletAddress,
      network,
      note,
    } = req.body;

    // Validate Amount
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid withdraw amount.",
      });
    }

    // Get Logged-in User
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Current Wallet Balance
    const walletBalance = Number(user.balance || user.walletBalance || 0);

    if (Number(amount) > walletBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    // Payment Validation
    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required.",
      });
    }

    // Bank Validation
    if (
      paymentMethod === "Bank" &&
      (!bankName || !accountTitle || !accountNumber)
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete bank account details are required.",
      });
    }

    // Crypto Validation
    if (paymentMethod === "USDT" && (!walletAddress || !network)) {
      return res.status(400).json({
        success: false,
        message: "Wallet address and network are required.",
      });
    }

    // Create Withdraw Request
    const withdraw = await Withdraw.create({
      userId: user._id,
      username: user.username,
      email: user.email,

      amount: Number(amount),
      currency: "PKR",

      paymentMethod,
      bankName: bankName || "",
      accountTitle: accountTitle || "",
      accountNumber: accountNumber || "",
      iban: iban || "",

      walletAddress: walletAddress || "",
      network: network || "",

      note: note || "",
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Withdraw request submitted successfully.",
      withdraw,
    });
  } catch (error) {
    console.error("WITHDRAW REQUEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit withdraw request.",
    });
  }
});
// ======================================================
// USER WITHDRAW HISTORY
// GET /api/withdraw/history
// ======================================================

router.get("/history", verifyToken, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalWithdraws: withdraws.length,
      withdraws,
    });

  } catch (error) {
    console.error("WITHDRAW HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw history.",
    });
  }
});

// ======================================================
// USER GET SINGLE WITHDRAW REQUEST
// GET /api/withdraw/:id
// ======================================================

router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw request ID.",
      });
    }

    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    // User sirf apni request dekh sakta hai
    if (
      withdraw.userId.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    return res.status(200).json({
      success: true,
      withdraw,
    });

  } catch (error) {
    console.error("GET SINGLE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw request.",
    });
  }
});

// ======================================================
// USER CANCEL WITHDRAW REQUEST
// DELETE /api/withdraw/:id
// ======================================================

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid withdraw request ID.",
      });
    }

    const withdraw = await Withdraw.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending withdraw requests can be cancelled.",
      });
    }

    withdraw.status = "Cancelled";
    withdraw.cancelledAt = new Date();

    await withdraw.save();

    return res.status(200).json({
      success: true,
      message: "Withdraw request cancelled successfully.",
      withdraw,
    });

  } catch (error) {
    console.error("CANCEL WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel withdraw request.",
    });
  }
});
// ======================================================
// ADMIN GET ALL WITHDRAW REQUESTS
// GET /api/withdraw/admin
// ======================================================

router.get("/admin", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraws = await Withdraw.find()
      .populate("userId", "username email phone balance walletBalance")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,

      stats: {
        totalWithdraws: withdraws.length,
        pendingWithdraws: withdraws.filter(w => w.status === "Pending").length,
        approvedWithdraws: withdraws.filter(w => w.status === "Approved").length,
        rejectedWithdraws: withdraws.filter(w => w.status === "Rejected").length,
        cancelledWithdraws: withdraws.filter(w => w.status === "Cancelled").length,
      },

      withdraws,
    });

  } catch (error) {
    console.error("ADMIN WITHDRAW LIST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load withdraw requests.",
    });
  }
});


// ======================================================
// ADMIN GET ONLY PENDING WITHDRAW REQUESTS
// GET /api/withdraw/admin/pending
// ======================================================

router.get("/admin/pending", verifyToken, isAdmin, async (req, res) => {
  try {
    const withdraws = await Withdraw.find({
      status: "Pending",
    })
      .populate("userId", "username email phone balance walletBalance")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: withdraws.length,
      withdraws,
    });

  } catch (error) {
    console.error("ADMIN PENDING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending withdraw requests.",
    });
  }
});


// ======================================================
// ADMIN SEARCH WITHDRAW REQUESTS
// GET /api/withdraw/admin/search?q=hashi
// ======================================================

router.get("/admin/search", verifyToken, isAdmin, async (req, res) => {
  try {
    const keyword = req.query.q || "";

    const withdraws = await Withdraw.find({
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { paymentMethod: { $regex: keyword, $options: "i" } },
        { status: { $regex: keyword, $options: "i" } },
      ],
    })
      .populate("userId", "username email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: withdraws.length,
      withdraws,
    });

  } catch (error) {
    console.error("ADMIN SEARCH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Search failed.",
    });
  }
});
// ======================================================
// ADMIN APPROVE WITHDRAW (MANUAL AMOUNT)
// PUT /api/withdraw/admin/:id/approve
// ======================================================

router.put("/admin/:id/approve", verifyToken, isAdmin, async (req, res) => {
  try {
    const { approvedAmount, adminNote } = req.body;

    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    // Duplicate protection
    if (withdraw.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Withdraw already approved.",
      });
    }

    if (withdraw.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Rejected withdraw cannot be approved.",
      });
    }

    const user = await User.findById(withdraw.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Admin enters amount manually
    const finalAmount =
      Number(approvedAmount) || Number(withdraw.amount);

    if (finalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Approved amount must be greater than zero.",
      });
    }

    const currentBalance = Number(user.balance || user.walletBalance || 0);

    if (finalAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: "User has insufficient wallet balance.",
      });
    }

    // Deduct wallet balance
    const newBalance = currentBalance - finalAmount;

    user.balance = newBalance;

    if ("walletBalance" in user) {
      user.walletBalance = newBalance;
    }

    await user.save();

    // Update withdraw request
    withdraw.status = "Approved";
    withdraw.approvedAmount = finalAmount;
    withdraw.adminNote = adminNote || "";
    withdraw.approvedBy = req.user._id;
    withdraw.approvedAt = new Date();

    await withdraw.save();

    // Wallet Transaction Record
    await WalletTransaction.create({
      userId: user._id,
      username: user.username,
      type: "Withdraw",
      amount: finalAmount,
      status: "Completed",
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      referenceId: withdraw._id,
      description: `Withdraw approved by admin (${req.user.username})`,
    });

    return res.status(200).json({
      success: true,
      message: "Withdraw approved successfully.",
      approvedAmount: finalAmount,
      previousBalance: currentBalance,
      remainingBalance: newBalance,
      withdraw,
    });

  } catch (error) {
    console.error("ADMIN APPROVE WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to approve withdraw request.",
    });
  }
});
// ======================================================
// ADMIN REJECT WITHDRAW REQUEST
// PUT /api/withdraw/admin/:id/reject
// ======================================================

router.put("/admin/:id/reject", verifyToken, isAdmin, async (req, res) => {
  try {
    const { reason, adminNote } = req.body;

    const withdraw = await Withdraw.findById(req.params.id);

    if (!withdraw) {
      return res.status(404).json({
        success: false,
        message: "Withdraw request not found.",
      });
    }

    if (withdraw.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Approved withdraw cannot be rejected.",
      });
    }

    if (withdraw.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Withdraw already rejected.",
      });
    }

    withdraw.status = "Rejected";
    withdraw.rejectedReason = reason || "Rejected by admin";
    withdraw.adminNote = adminNote || "";
    withdraw.rejectedBy = req.user._id;
    withdraw.rejectedAt = new Date();

    await withdraw.save();

    return res.status(200).json({
      success: true,
      message: "Withdraw rejected successfully.",
      withdraw,
    });

  } catch (error) {
    console.error("ADMIN REJECT WITHDRAW ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to reject withdraw request.",
    });
  }
});


// ======================================================
// ADMIN MANUAL ADD BALANCE
// PUT /api/withdraw/admin/user/:id/add-balance
// ======================================================

router.put("/admin/user/:id/add-balance", verifyToken, isAdmin, async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid amount.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const previousBalance = Number(user.balance || user.walletBalance || 0);
    const newBalance = previousBalance + Number(amount);

    user.balance = newBalance;

    if ("walletBalance" in user) {
      user.walletBalance = newBalance;
    }

    await user.save();

    await WalletTransaction.create({
      userId: user._id,
      username: user.username,
      type: "Admin Credit",
      amount: Number(amount),
      status: "Completed",
      balanceBefore: previousBalance,
      balanceAfter: newBalance,
      description: note || `Balance added by admin (${req.user.username})`,
    });

    return res.status(200).json({
      success: true,
      message: "Balance added successfully.",
      previousBalance,
      newBalance,
    });

  } catch (error) {
    console.error("ADMIN ADD BALANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add balance.",
    });
  }
});


// ======================================================
// ADMIN MANUAL DEDUCT BALANCE
// PUT /api/withdraw/admin/user/:id/deduct-balance
// ======================================================

router.put("/admin/user/:id/deduct-balance", verifyToken, isAdmin, async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid amount.",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const previousBalance = Number(user.balance || user.walletBalance || 0);

    if (Number(amount) > previousBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance.",
      });
    }

    const newBalance = previousBalance - Number(amount);

    user.balance = newBalance;

    if ("walletBalance" in user) {
      user.walletBalance = newBalance;
    }

    await user.save();

    await WalletTransaction.create({
      userId: user._id,
      username: user.username,
      type: "Admin Debit",
      amount: Number(amount),
      status: "Completed",
      balanceBefore: previousBalance,
      balanceAfter: newBalance,
      description: note || `Balance deducted by admin (${req.user.username})`,
    });

    return res.status(200).json({
      success: true,
      message: "Balance deducted successfully.",
      previousBalance,
      newBalance,
    });

  } catch (error) {
    console.error("ADMIN DEDUCT BALANCE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to deduct balance.",
    });
  }
});


// ======================================================
// ADMIN WALLET TRANSACTION HISTORY
// GET /api/withdraw/admin/wallet-history/:id
// ======================================================

router.get("/admin/wallet-history/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const history = await WalletTransaction.find({
      userId: req.params.id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalTransactions: history.length,
      history,
    });

  } catch (error) {
    console.error("WALLET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load wallet history.",
    });
  }
});


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;