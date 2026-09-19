"use strict";

// =======================================================
// GoldTrade V18 - Referral Routes
// Linux + Render Compatible
// =======================================================

const express = require("express");
const router = express.Router();

// =======================================================
// MODELS
// =======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Referral = require("../models/Referral");
const WalletTransaction = require("../models/WalletTransaction");
const Transaction = require("../models/Transaction");

// =======================================================
// MIDDLEWARE
// =======================================================

const { verifyToken, isAdmin } = require("../middleware/auth");

// =======================================================
// GENERATE UNIQUE REFERRAL CODE
// =======================================================

const generateReferralCode = (username) => {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${username.substring(0, 4).toUpperCase()}${random}`;
};

// =======================================================
// GET MY REFERRAL DASHBOARD
// GET /api/referral/me
// =======================================================

router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Create referral code if missing
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
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      referralCode: user.referralCode,
      referralCount: Number(user.referralCount || 0),
      pendingBonus: Number(user.pendingReferralBonus || 0),
      earnedBonus: Number(user.referralBonusEarned || 0),
      referrals,
    });

  } catch (err) {
    console.error("REFERRAL DASHBOARD ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load referral dashboard.",
      error: err.message,
    });
  }
});

// =======================================================
// APPLY REFERRAL CODE
// POST /api/referral/apply
// =======================================================

router.post("/apply", verifyToken, async (req, res) => {
  try {
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({
        success: false,
        message: "Referral code is required.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.referredBy) {
      return res.status(400).json({
        success: false,
        message: "Referral already applied.",
      });
    }

    const referrer = await User.findOne({
      referralCode: referralCode.trim().toUpperCase(),
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

    const existingReferral = await Referral.findOne({
      referredUser: user._id,
    });

    if (existingReferral) {
      return res.status(400).json({
        success: false,
        message: "Referral already exists.",
      });
    }

    user.referredBy = referrer.referralCode;
    await user.save();

    await Referral.create({
      referrer: referrer._id,
      referredUser: user._id,

      referrerUsername: referrer.username,
      referredUsername: user.username,

      referralCode: referrer.referralCode,

      bonusAmount: 500,
      status: "Pending",
      firstDepositCompleted: false,
    });

    return res.json({
      success: true,
      message: "Referral code applied successfully.",
    });

  } catch (err) {
    console.error("APPLY REFERRAL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to apply referral code.",
      error: err.message,
    });
  }
});
// =======================================================
// ADMIN - GET ALL REFERRALS
// GET /api/referral/admin
// =======================================================

router.get("/admin", verifyToken, isAdmin, async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate("referrer", "username email")
      .populate("referredUser", "username email")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      totalReferrals: referrals.length,
      referrals,
    });

  } catch (err) {
    console.error("GET REFERRALS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to load referrals.",
      error: err.message,
    });
  }
});

// =======================================================
// ADMIN - APPROVE REFERRAL BONUS
// POST /api/referral/approve/:id
// =======================================================

router.post("/approve/:id", verifyToken, isAdmin, async (req, res) => {
  try {
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

    const referrer = await User.findById(referral.referrer);

    if (!referrer) {
      return res.status(404).json({
        success: false,
        message: "Referrer not found.",
      });
    }

    let Wallet = await Wallet.findOne({ userId: referrer._id });

    if (!Wallet) {
      Wallet = await Wallet.create({
        userId: referrer._id,
        PkrBalance: 0,
        goldBalance: 0,
        UsdtBalance: 0,
      });
    }

    const previousBalance = Number(Wallet.PkrBalance || 0);
    const newBalance = previousBalance + Number(referral.bonusAmount);

    Wallet.PkrBalance = newBalance;
    await Wallet.save();

    referrer.pendingReferralBonus = Math.max(
      0,
      Number(referrer.pendingReferralBonus || 0) - Number(referral.bonusAmount)
    );

    referrer.referralBonusEarned =
      Number(referrer.referralBonusEarned || 0) + Number(referral.bonusAmount);

    await referrer.save();

    referral.status = "Approved";
    referral.approvedBy = req.user.id;
    referral.approvedAt = new Date();

    await referral.save();

    await WalletTransaction.create({
      userId: referrer._id,
      username: referrer.username,

      WalletType: "PKR",
      type: "CREDIT",

      amount: referral.bonusAmount,
      previousBalance,
      newBalance,

      adminId: req.user.id,
      adminUsername: req.user.username,

      note: `Referral Bonus (${referral.referredUsername})`,
      createdAt: new Date(),
    });

    await Transaction.create({
      userId: referrer._id,
      username: referrer.username,

      type: "Referral Bonus",
      amount: referral.bonusAmount,
      status: "Completed",

      description: `Referral reward approved for ${referral.referredUsername}`,
      createdAt: new Date(),
    });

    return res.json({
      success: true,
      message: "Referral bonus approved and credited successfully.",
      WalletBalance: newBalance,
    });

  } catch (err) {
    console.error("APPROVE REFERRAL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to approve referral bonus.",
      error: err.message,
    });
  }
});

// =======================================================
// ADMIN - REJECT REFERRAL BONUS
// POST /api/referral/reject/:id
// =======================================================

router.post("/reject/:id", verifyToken, isAdmin, async (req, res) => {
  try {
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

    const referrer = await User.findById(referral.referrer);

    if (referrer) {
      referrer.pendingReferralBonus = Math.max(
        0,
        Number(referrer.pendingReferralBonus || 0) -
          Number(referral.bonusAmount)
      );

      await referrer.save();
    }

    referral.status = "Rejected";
    referral.approvedBy = req.user.id;
    referral.approvedAt = new Date();

    await referral.save();

    return res.json({
      success: true,
      message: "Referral bonus rejected successfully.",
    });

  } catch (err) {
    console.error("REJECT REFERRAL ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to reject referral bonus.",
      error: err.message,
    });
  }
});

// =======================================================
// COMPLETE FIRST DEPOSIT
// POST /api/referral/complete-first-deposit/:userId
// Called automatically after Deposit Approval
// =======================================================

router.post(
  "/complete-first-deposit/:userId",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const referral = await Referral.findOne({
        referredUser: req.params.userId,
        firstDepositCompleted: false,
      });

      if (!referral) {
        return res.json({
          success: true,
          message: "No pending referral found.",
        });
      }

      referral.firstDepositCompleted = true;
      await referral.save();

      const referrer = await User.findById(referral.referrer);

      if (referrer) {
        referrer.pendingReferralBonus =
          Number(referrer.pendingReferralBonus || 0) +
          Number(referral.bonusAmount);

        referrer.referralCount =
          Number(referrer.referralCount || 0) + 1;

        await referrer.save();
      }

      return res.json({
        success: true,
        message: "First deposit completed. Referral is pending admin approval.",
      });

    } catch (err) {
      console.error("FIRST DEPOSIT REFERRAL ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Failed to complete first deposit referral.",
        error: err.message,
      });
    }
  }
);

// =======================================================
// HEALTH CHECK
// GET /api/referral/health
// =======================================================

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Referral API Working - GoldTrade V18",
    version: "V18 Enterprise",
    timestamp: new Date().toISOString(),
  });
});

// =======================================================
// EXPORT ROUTER
// =======================================================

module.exports = router;