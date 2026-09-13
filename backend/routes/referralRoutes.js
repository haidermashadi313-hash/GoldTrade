const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Referral = require("../models/Referral");
const WalletTransaction = require("../models/WalletTransaction");
const Transaction = require("../models/Transaction");

const { verifyToken } = require("../middleware/authMiddleware");

// =====================================================
// Generate Unique Referral Code
// =====================================================

const generateReferralCode = (username) => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${username.substring(0, 4).toUpperCase()}${random}`;
};

// =====================================================
// GET MY REFERRAL DASHBOARD
// =====================================================

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    // Generate referral code if missing
    if (!user.referralCode) {
      let code = generateReferralCode(user.username);

      while (await User.findOne({ referralCode: code })) {
        code = generateReferralCode(user.username);
      }

      user.referralCode = code;
      await user.save();
    }

    const referrals = await Referral.find({
      referrer: user._id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      referralCode: user.referralCode,
      referralCount: user.referralCount,
      pendingBonus: user.pendingReferralBonus,
      earnedBonus: user.referralBonusEarned,
      referrals,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// APPLY REFERRAL CODE
// =====================================================

router.post("/apply", verifyToken, async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: "Referral code required.",
      });
    }

    const user = await User.findById(req.user._id);

    if (user.referredBy) {
      return res.status(400).json({
        success: false,
        message: "Referral already applied.",
      });
    }

    const referrer = await User.findOne({
      referralCode: referralCode.toUpperCase(),
    });

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: "Invalid referral code.",
      });
    }

    if (String(referrer._id) === String(user._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot refer yourself.",
      });
    }

    // Prevent duplicate record
    const existing = await Referral.findOne({
      referredUser: user._id,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Referral already exists.",
      });
    }

    user.referredBy = referralCode.toUpperCase();
    await user.save();

    await Referral.create({
      referrer: referrer._id,
      referredUser: user._id,
      referrerUsername: referrer.username,
      referredUsername: user.username,
      referralCode: referralCode.toUpperCase(),
      bonusAmount: 500,
      status: "Pending",
    });

    res.json({
      success: true,
      message: "Referral code applied successfully.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});
// =====================================================
// ADMIN - GET ALL REFERRALS
// =====================================================

router.get("/admin", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    const referrals = await Referral.find()
      .populate("referrer", "username email")
      .populate("referredUser", "username email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      referrals,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// ADMIN - APPROVE REFERRAL BONUS
// =====================================================

router.post("/approve/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found.",
      });
    }

    if (referral.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Referral already approved.",
      });
    }

    const user = await User.findById(referral.referrer);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Referrer user not found.",
      });
    }

    const previousBalance = user.walletBalance;
    const newBalance = previousBalance + referral.bonusAmount;

    // Wallet Credit
    user.walletBalance = newBalance;
    user.pendingReferralBonus -= referral.bonusAmount;
    user.referralBonusEarned += referral.bonusAmount;

    await user.save();

    // Update Referral Status
    referral.status = "Approved";
    referral.approvedBy = req.user._id;
    referral.approvedAt = new Date();
    await referral.save();

    // Wallet History
    await WalletTransaction.create({
      user: user._id,
      admin: req.user._id,
      walletType: "PKR",
      action: "credit",
      amount: referral.bonusAmount,
      previousBalance,
      newBalance,
      reason: `Referral Bonus (${referral.referredUsername})`,
    });

    // Transaction History
    await Transaction.create({
      userId: user._id,
      username: user.username,
      type: "Referral Bonus",
      amount: referral.bonusAmount,
      status: "Completed",
      description: `Referral reward approved for ${referral.referredUsername}`,
    });

    res.json({
      success: true,
      message: "Referral bonus approved and credited.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// ADMIN - REJECT REFERRAL BONUS
// =====================================================

router.post("/reject/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    const referral = await Referral.findById(req.params.id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: "Referral not found.",
      });
    }

    if (referral.status === "Rejected") {
      return res.status(400).json({
        success: false,
        message: "Referral already rejected.",
      });
    }

    const user = await User.findById(referral.referrer);

    if (user && user.pendingReferralBonus >= referral.bonusAmount) {
      user.pendingReferralBonus -= referral.bonusAmount;
      await user.save();
    }

    referral.status = "Rejected";
    referral.approvedBy = req.user._id;
    referral.approvedAt = new Date();

    await referral.save();

    res.json({
      success: true,
      message: "Referral bonus rejected.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =====================================================
// COMPLETE FIRST DEPOSIT (Called after Deposit Approval)
// =====================================================

router.post("/complete-first-deposit/:userId", async (req, res) => {
  try {
    const referral = await Referral.findOne({
      referredUser: req.params.userId,
      firstDepositCompleted: false,
    });

    if (!referral) {
      return res.json({
        success: true,
        message: "No referral pending.",
      });
    }

    referral.firstDepositCompleted = true;
    await referral.save();

    const referrer = await User.findById(referral.referrer);

    referrer.pendingReferralBonus += referral.bonusAmount;
    referrer.referralCount += 1;

    await referrer.save();

    res.json({
      success: true,
      message: "Referral marked pending approval.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;