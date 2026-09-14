const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/User");
const Settings = require("../models/Settings");
const GoldTransaction = require("../models/GoldTransaction");

const { verifyToken } = require("../middleware/authMiddleware");

/* ===========================================
   GET USER TRADING HISTORY
   GET /api/trading/history
=========================================== */

router.get("/history", verifyToken, async (req, res) => {
  try {
    const transactions = await GoldTransaction.find({
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      transactions,
    });
  } catch (err) {
    console.error("History Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load trading history.",
    });
  }
});

/* ===========================================
   GET LIVE GOLD MARKET SETTINGS
   GET /api/trading/market
=========================================== */

router.get("/market", async (req, res) => {
  try {
    const settings = await Settings.findOne();

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: "Gold market settings not found.",
      });
    }

    res.json({
      success: true,
      market: {
        buyPrice: settings.buyGoldPrice,
        sellPrice: settings.sellGoldPrice,
        tradingEnabled: settings.goldTradingEnabled,
        cashbackRate: settings.cashbackRate,
        cashbackEnabled: settings.cashbackEnabled,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Unable to load market.",
    });
  }
});

/* ===========================================
   BUY / SELL GOLD
   POST /api/trading/gold
   (Section 2 starts from here...)
=========================================== *//* ===========================================
   BUY GOLD ENGINE
=========================================== */

router.post("/gold", verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { tradeType, quantity } = req.body;

    const goldQty = Number(quantity);

    if (!goldQty || goldQty <= 0) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid gold quantity.",
      });
    }

    const user = await User.findById(req.user._id).session(session);
    const settings = await Settings.findOne().session(session);

    if (!user || !settings) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "User or settings not found.",
      });
    }

    // ================= SECURITY CHECKS =================

    if (user.status === "Blocked") {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by Admin.",
      });
    }

    if (user.walletFrozen) {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        success: false,
        message: "Your wallet has been frozen.",
      });
    }

    if (!settings.goldTradingEnabled) {
      await session.abortTransaction();
      session.endSession();

      return res.status(403).json({
        success: false,
        message: "Gold market is currently closed.",
      });
    }

    // ================= BUY GOLD =================

    if (tradeType === "BUY") {
      const goldPrice = settings.buyGoldPrice;
      const totalAmount = goldPrice * goldQty;

      if ((user.walletBalance ?? 0) < totalAmount) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: "Insufficient PKR wallet balance.",
        });
      }

      // Wallet Update
      user.walletBalance -= totalAmount;
      user.goldBalance = (user.goldBalance ?? 0) + goldQty;

      // Average Gold Price
      const currentGold = user.goldBalance || goldQty;

      user.goldAveragePrice =
        ((user.goldAveragePrice ?? 0) *
          (currentGold - goldQty) +
          totalAmount) /
        currentGold;

      // Cashback
      let cashback = 0;

      if (settings.cashbackEnabled) {
        cashback =
          (totalAmount * settings.cashbackRate) / 100;

        user.cashbackEarned =
          (user.cashbackEarned ?? 0) + cashback;

        user.walletBalance += cashback;
      }

      // VIP Upgrade
      if (user.totalDeposit >= settings.vipDiamondAmount) {
        user.vipLevel = "Diamond";
      } else if (
        user.totalDeposit >= settings.vipGoldAmount
      ) {
        user.vipLevel = "Gold";
      } else if (
        user.totalDeposit >= settings.vipSilverAmount
      ) {
        user.vipLevel = "Silver";
      } else {
        user.vipLevel = "Standard";
      }

      await user.save({ session });

      // Save Transaction
      await GoldTransaction.create(
        [
          {
            userId: user._id,
            username: user.username,

            type: "BUY",

            quantity: goldQty,
            pricePerGram: goldPrice,

            amount: totalAmount,
            cashback,

            status: "Approved",
            description: `Bought ${goldQty} gram Gold at PKR ${goldPrice}/g`,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message: "Gold purchased successfully.",

        transaction: {
          type: "BUY",
          quantity: goldQty,
          pricePerGram: goldPrice,
          totalAmount,
          cashback,
        },

        wallet: {
          walletBalance: user.walletBalance,
          goldBalance: user.goldBalance,
          cashbackEarned: user.cashbackEarned,
          vipLevel: user.vipLevel,
        },
      });
    }

    // SELL LOGIC Section 3 me hoga...

    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      success: false,
      message: "Invalid trade type.",
    });

    /* ===========================================
       SELL GOLD ENGINE
    =========================================== */

    if (tradeType === "SELL") {

      const goldPrice = settings.sellGoldPrice;
      const totalAmount = goldPrice * goldQty;

      // Gold balance check
      if ((user.goldBalance ?? 0) < goldQty) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
          success: false,
          message: "Insufficient Gold balance.",
        });
      }

      // Profit / Loss Calculation
      const averagePrice = user.goldAveragePrice ?? goldPrice;
      const profitLoss = (goldPrice - averagePrice) * goldQty;

      // Wallet Update
      user.goldBalance -= goldQty;
      user.walletBalance += totalAmount;

      user.goldProfitLoss =
        (user.goldProfitLoss ?? 0) + profitLoss;

      // Reset average price if user sells all gold
      if (user.goldBalance <= 0) {
        user.goldBalance = 0;
        user.goldAveragePrice = 0;
      }

      await user.save({ session });

      // Save Transaction
      await GoldTransaction.create(
        [
          {
            userId: user._id,
            username: user.username,

            type: "SELL",

            quantity: goldQty,
            pricePerGram: goldPrice,

            amount: totalAmount,
            profitLoss,

            status: "Approved",

            description: `Sold ${goldQty} gram Gold at PKR ${goldPrice}/g`,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.json({
        success: true,
        message: "Gold sold successfully.",

        transaction: {
          type: "SELL",
          quantity: goldQty,
          pricePerGram: goldPrice,
          totalAmount,
          profitLoss,
        },

        wallet: {
          walletBalance: user.walletBalance,
          goldBalance: user.goldBalance,
          goldProfitLoss: user.goldProfitLoss,
        },
      });
    }

    // Invalid Trade Type
    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      success: false,
      message: "Invalid trade type.",
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("TRADING ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Gold trading failed.",
    });
  }
});/* ===========================================
   REWARD ENGINE
   Cashback + VIP + Referral + Lucky Draw
=========================================== */

const applyTradingRewards = async (
  user,
  settings,
  tradeAmount,
  session
) => {
  let cashback = 0;
  let referralBonus = 0;
  let luckyDrawEligible = false;

  // ================= CASHBACK =================

  if (
    settings.cashbackEnabled &&
    Number(settings.cashbackRate) > 0
  ) {
    cashback =
      (tradeAmount * Number(settings.cashbackRate)) / 100;

    user.cashbackEarned =
      (user.cashbackEarned ?? 0) + cashback;

    // Cashback directly wallet me credit
    user.walletBalance =
      (user.walletBalance ?? 0) + cashback;
  }

  // ================= VIP LEVEL AUTO UPGRADE =================

  const depositAmount = user.totalDeposit ?? 0;

  if (depositAmount >= settings.vipDiamondAmount) {
    user.vipLevel = "Diamond";
  } else if (depositAmount >= settings.vipGoldAmount) {
    user.vipLevel = "Gold";
  } else if (depositAmount >= settings.vipSilverAmount) {
    user.vipLevel = "Silver";
  } else {
    user.vipLevel = "Standard";
  }

  // ================= REFERRAL BONUS =================

  if (user.referredBy) {
    const referrer = await User.findById(user.referredBy).session(session);

    if (referrer) {
      referralBonus = Number(settings.referralBonus ?? 0);

      referrer.walletBalance =
        (referrer.walletBalance ?? 0) + referralBonus;

      referrer.referralBonus =
        (referrer.referralBonus ?? 0) + referralBonus;

      referrer.totalReferrals =
        (referrer.totalReferrals ?? 0) + 1;

      referrer.activeReferrals =
        (referrer.activeReferrals ?? 0) + 1;

      await referrer.save({ session });
    }
  }

  // ================= LUCKY DRAW =================

  if (
    settings.luckyDrawEnabled &&
    tradeAmount >= 5000
  ) {
    luckyDrawEligible = true;
  }

  // Save updated user
  await user.save({ session });

  return {
    cashback,
    referralBonus,
    luckyDrawEligible,
    vipLevel: user.vipLevel,
  };
};

/* ===========================================
   VIP BENEFITS (Helper)
=========================================== */

const getVipBenefits = (vipLevel) => {
  switch (vipLevel) {
    case "Diamond":
      return {
        cashbackMultiplier: 2,
        priorityWithdraw: true,
        luckyDrawEntries: 5,
      };

    case "Gold":
      return {
        cashbackMultiplier: 1.5,
        priorityWithdraw: true,
        luckyDrawEntries: 3,
      };

    case "Silver":
      return {
        cashbackMultiplier: 1.2,
        priorityWithdraw: false,
        luckyDrawEntries: 2,
      };

    default:
      return {
        cashbackMultiplier: 1,
        priorityWithdraw: false,
        luckyDrawEntries: 1,
      };
  }
};

/* ===========================================
   USER REWARD SUMMARY
   GET /api/trading/rewards
=========================================== */

router.get("/rewards", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const settings = await Settings.findOne();

    if (!user || !settings) {
      return res.status(404).json({
        success: false,
        message: "Reward data not found.",
      });
    }

    const vipBenefits = getVipBenefits(
      user.vipLevel || "Standard"
    );

    res.json({
      success: true,

      rewards: {
        cashbackEarned: user.cashbackEarned ?? 0,
        referralBonus: user.referralBonus ?? 0,

        totalReferrals: user.totalReferrals ?? 0,
        activeReferrals: user.activeReferrals ?? 0,

        vipLevel: user.vipLevel || "Standard",

        cashbackRate: settings.cashbackRate ?? 0,

        luckyDrawEnabled:
          settings.luckyDrawEnabled ?? false,

        luckyDrawPrize:
          settings.luckyDrawPrize ?? "10 Gram Gold",

        vipBenefits,
      },
    });

  } catch (err) {
    console.error("Reward Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load reward summary.",
    });
  }
});/* ===========================================
   DASHBOARD SUMMARY API
   GET /api/trading/dashboard
=========================================== */

router.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const settings = await Settings.findOne();

    if (!user || !settings) {
      return res.status(404).json({
        success: false,
        message: "Dashboard data not found.",
      });
    }

    // Recent 10 transactions
    const recentTransactions = await GoldTransaction.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Gold current value
    const currentGoldValue =
      (user.goldBalance ?? 0) * (settings.sellGoldPrice ?? 0);

    // Total Portfolio Value
    const portfolioValue =
      (user.walletBalance ?? 0) +
      (user.usdtBalance ?? 0) +
      currentGoldValue;

    // Total Trading Volume
    const tradingStats = await GoldTransaction.aggregate([
      { $match: { userId: user._id } },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          totalQuantity: { $sum: "$quantity" },
          totalTrades: { $sum: 1 },
        },
      },
    ]);

    const buyStats =
      tradingStats.find((t) => t._id === "BUY") || {};

    const sellStats =
      tradingStats.find((t) => t._id === "SELL") || {};

    res.json({
      success: true,

      dashboard: {
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          vipLevel: user.vipLevel || "Standard",
        },

        wallet: {
          walletBalance: user.walletBalance ?? 0,
          usdtBalance: user.usdtBalance ?? 0,
          goldBalance: user.goldBalance ?? 0,

          cashbackEarned: user.cashbackEarned ?? 0,
          referralBonus: user.referralBonus ?? 0,
        },

        market: {
          buyPrice: settings.buyGoldPrice,
          sellPrice: settings.sellGoldPrice,
          tradingEnabled: settings.goldTradingEnabled,
        },

        portfolio: {
          goldCurrentValue: currentGoldValue,
          totalPortfolioValue: portfolioValue,
          goldProfitLoss: user.goldProfitLoss ?? 0,
        },

        statistics: {
          totalBuyTrades: buyStats.totalTrades ?? 0,
          totalSellTrades: sellStats.totalTrades ?? 0,

          totalGoldBought:
            buyStats.totalQuantity ?? 0,

          totalGoldSold:
            sellStats.totalQuantity ?? 0,

          totalBuyVolume:
            buyStats.totalAmount ?? 0,

          totalSellVolume:
            sellStats.totalAmount ?? 0,
        },

        recentTransactions,
      },
    });

  } catch (err) {
    console.error("Dashboard Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load dashboard.",
    });
  }
});

/* ===========================================
   USER PORTFOLIO API
   GET /api/trading/portfolio
=========================================== */

router.get("/portfolio", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const settings = await Settings.findOne();

    if (!user || !settings) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found.",
      });
    }

    const goldValue =
      (user.goldBalance ?? 0) * settings.sellGoldPrice;

    res.json({
      success: true,

      portfolio: {
        walletBalance: user.walletBalance ?? 0,
        usdtBalance: user.usdtBalance ?? 0,

        goldBalance: user.goldBalance ?? 0,
        goldValue,

        cashbackEarned: user.cashbackEarned ?? 0,
        referralBonus: user.referralBonus ?? 0,

        totalPortfolioValue:
          (user.walletBalance ?? 0) +
          (user.usdtBalance ?? 0) +
          goldValue,

        goldProfitLoss: user.goldProfitLoss ?? 0,

        vipLevel: user.vipLevel || "Standard",
      },
    });

  } catch (err) {
    console.error("Portfolio Error:", err);

    res.status(500).json({
      success: false,
      message: "Unable to load portfolio.",
    });
  }
});

/* ===========================================
   MODULE EXPORT
=========================================== */

module.exports = router;