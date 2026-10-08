const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

/* ============================================================
   MODELS
============================================================ */

const User = require("../models/User");
const Settings = require("../models/Settings");
const GoldTransaction = require("../models/GoldTransaction");

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

/* ============================================================
   HELPERS
============================================================ */

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

const roundMoney = (value) =>
  Math.round(
    toNumber(value) * 100
  ) / 100;

const roundGold = (value) =>
  Math.round(
    toNumber(value) * 10000
  ) / 10000;

/* ============================================================
   MARKET FORMATTER

   Frontend expects:
   livePrice
   buyPrice
   sellPrice
   high24h
   low24h
   volume24h
   change24h
============================================================ */

const buildMarketResponse = (
  settings
) => {
  const buyPrice = toNumber(
    settings.buyGoldPrice
  );

  const sellPrice = toNumber(
    settings.sellGoldPrice
  );

  const midpoint =
    (buyPrice + sellPrice) / 2;

  /*
   * Support existing/new Settings fields
   * without forcing a schema migration.
   */
  const livePrice = toNumber(
    settings.livePrice ??
      settings.liveGoldPrice ??
      settings.goldPrice ??
      midpoint,
    midpoint
  );

  const high24h = toNumber(
    settings.high24h ??
      settings.high24H ??
      Math.max(
        buyPrice,
        sellPrice,
        livePrice
      ),
    Math.max(
      buyPrice,
      sellPrice,
      livePrice
    )
  );

  const low24h = toNumber(
    settings.low24h ??
      settings.low24H ??
      Math.min(
        buyPrice,
        sellPrice,
        livePrice
      ),
    Math.min(
      buyPrice,
      sellPrice,
      livePrice
    )
  );

  const volume24h = toNumber(
    settings.volume24h ??
      settings.volume24H ??
      0
  );

  const change24h = toNumber(
    settings.change24h ??
      settings.change24H ??
      0
  );

  return {
    livePrice,
    buyPrice,
    sellPrice,
    high24h,
    low24h,
    volume24h,
    change24h,

    tradingEnabled:
      Boolean(
        settings.goldTradingEnabled
      ),

    marketStatus:
      settings.marketStatus ??
      (
        settings.goldTradingEnabled
          ? "OPEN"
          : "CLOSED"
      ),

    cashbackRate:
      toNumber(
        settings.cashbackRate
      ),

    cashbackEnabled:
      Boolean(
        settings.cashbackEnabled
      ),
  };
};

/* ============================================================
   HISTORY FORMATTER

   Supports old GoldTransaction field names:
   type
   quantity
   pricePerGram
   amount

   And frontend expected names:
   type
   quantity
   price
   total
============================================================ */

const formatTransaction = (
  transaction
) => {
  const object =
    transaction?.toObject
      ? transaction.toObject()
      : transaction;

  const type =
    object.type === "sell"
      ? "sell"
      : "buy";

  const quantity =
    toNumber(
      object.quantity
    );

  const price =
    toNumber(
      object.pricePerGram ??
        object.price
    );

  const total =
    toNumber(
      object.amount ??
        object.total ??
        quantity * price
    );

  return {
    ...object,

    _id: String(
      object._id
    ),

    type,

    quantity,

    price,

    pricePerGram: price,

    total,

    totalAmount: total,

    createdAt:
      object.createdAt || null,
  };
};

/* ============================================================
   GET USER TRADING HISTORY

   GET /api/trading/history
============================================================ */

router.get(
  "/history",
  verifyToken,
  async (req, res) => {
    try {
      const transactions =
        await GoldTransaction.find({
          userId: req.user._id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(50)
          .lean();

      const history =
        transactions.map(
          formatTransaction
        );

      return res.json({
        success: true,

        /*
         * New frontend
         */
        history,

        /*
         * Backward compatibility
         */
        transactions: history,
      });
    } catch (err) {
      console.error(
        "Trading history error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load trading history.",
        history: [],
        transactions: [],
      });
    }
  }
);

/* ============================================================
   GET LIVE GOLD MARKET

   GET /api/trading/market
============================================================ */

router.get(
  "/market",
  async (req, res) => {
    try {
      const settings =
        await Settings.findOne().lean();

      if (!settings) {
        return res.status(404).json({
          success: false,
          message:
            "Gold market settings not found.",
        });
      }

      const market =
        buildMarketResponse(
          settings
        );

      return res.json({
        success: true,
        market,
      });
    } catch (err) {
      console.error(
        "Market error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load market.",
      });
    }
  }
);

/* ============================================================
   INTERNAL TRADE ENGINE

   Used by:
   POST /gold
   POST /buy
   POST /sell

   Existing /gold route remains supported.
============================================================ */

const executeGoldTrade = async (
  req,
  res,
  forcedTradeType = null
) => {
  const session =
    await mongoose.startSession();

  try {
    session.startTransaction();

    /* ========================================================
       INPUT
    ======================================================== */

    const requestedTradeType =
      forcedTradeType ||
      req.body.tradeType;

    const tradeType =
      String(
        requestedTradeType || ""
      )
        .trim()
        .toLowerCase();

    const goldQty =
      Number(
        req.body.quantity ??
          req.body.grams
      );

    /* ========================================================
       VALIDATE TYPE
    ======================================================== */

    if (
      !["buy", "sell"].includes(
        tradeType
      )
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Invalid trade type.",
      });
    }

    /* ========================================================
       VALIDATE QUANTITY
    ======================================================== */

    if (
      !Number.isFinite(goldQty) ||
      goldQty <= 0
    ) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Invalid gold quantity.",
      });
    }

    const quantity =
      roundGold(goldQty);

    if (quantity <= 0) {
      await session.abortTransaction();

      return res.status(400).json({
        success: false,
        message:
          "Gold quantity is too small.",
      });
    }

    /* ========================================================
       GET USER
    ======================================================== */

    const user =
      await User.findById(
        req.user._id
      ).session(session);

    /* ========================================================
       GET SETTINGS
    ======================================================== */

    const settings =
      await Settings.findOne()
        .session(session);

    if (!user || !settings) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message:
          "User or settings not found.",
      });
    }

    /* ========================================================
       SECURITY
    ======================================================== */

    if (user.status === "Blocked") {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,
        message:
          "Your account has been blocked by Admin.",
      });
    }

    if (user.WalletFrozen) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,
        message:
          "Your Wallet has been frozen.",
      });
    }

    if (!settings.goldTradingEnabled) {
      await session.abortTransaction();

      return res.status(403).json({
        success: false,
        message:
          "Gold market is currently closed.",
      });
    }

    /* ========================================================
       BUY GOLD
    ======================================================== */

    if (tradeType === "buy") {
      const goldPrice =
        toNumber(
          settings.buyGoldPrice
        );

      if (
        !Number.isFinite(
          goldPrice
        ) ||
        goldPrice <= 0
      ) {
        await session.abortTransaction();

        return res.status(503).json({
          success: false,
          message:
            "Gold buy price is not configured.",
        });
      }

      const totalAmount =
        roundMoney(
          goldPrice * quantity
        );

      const currentWallet =
        toNumber(
          user.WalletBalance
        );

      if (
        currentWallet <
        totalAmount
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message:
            "Insufficient Pkr Wallet balance.",
        });
      }

      /* ======================================================
         EXISTING GOLD BALANCE
      ====================================================== */

      const oldGoldBalance =
        toNumber(
          user.goldBalance
        );

      const oldAveragePrice =
        toNumber(
          user.GoldAveragePrice
        );

      const newGoldBalance =
        roundGold(
          oldGoldBalance +
            quantity
        );

      /* ======================================================
         AVERAGE PRICE

         Important:
         old balance × old average
         +
         new quantity × current price
      ====================================================== */

      const oldGoldCost =
        oldGoldBalance *
        oldAveragePrice;

      const newGoldCost =
        quantity *
        goldPrice;

      const newAveragePrice =
        newGoldBalance > 0
          ? roundMoney(
              (
                oldGoldCost +
                newGoldCost
              ) /
                newGoldBalance
            )
          : 0;

      /* ======================================================
         WALLET UPDATE
      ====================================================== */

      user.WalletBalance =
        roundMoney(
          currentWallet -
            totalAmount
        );

      user.goldBalance =
        newGoldBalance;

      user.GoldAveragePrice =
        newAveragePrice;

      /* ======================================================
         CASHBACK
      ====================================================== */

      let cashback = 0;

      if (
        settings.cashbackEnabled
      ) {
        const cashbackRate =
          toNumber(
            settings.cashbackRate
          );

        if (
          cashbackRate > 0
        ) {
          cashback =
            roundMoney(
              (
                totalAmount *
                cashbackRate
              ) / 100
            );

          user.cashbackEarned =
            roundMoney(
              toNumber(
                user.cashbackEarned
              ) + cashback
            );

          user.WalletBalance =
            roundMoney(
              user.WalletBalance +
                cashback
            );
        }
      }

      /* ======================================================
         VIP LEVEL
      ====================================================== */

      const depositAmount =
        toNumber(
          user.totalDeposit
        );

      if (
        depositAmount >=
        toNumber(
          settings.vipDiamondAmount
        )
      ) {
        user.vipLevel =
          "Diamond";
      } else if (
        depositAmount >=
        toNumber(
          settings.vipGoldAmount
        )
      ) {
        user.vipLevel =
          "Gold";
      } else if (
        depositAmount >=
        toNumber(
          settings.vipSilverAmount
        )
      ) {
        user.vipLevel =
          "Silver";
      } else {
        user.vipLevel =
          "Standard";
      }

      /* ======================================================
         SAVE USER
      ====================================================== */

      await user.save({
        session,
      });

      /* ======================================================
         SAVE TRANSACTION
      ====================================================== */

      const createdTransactions =
        await GoldTransaction.create(
          [
            {
              userId:
                user._id,

              username:
                user.username,

              type: "buy",

              quantity,

              pricePerGram:
                goldPrice,

              amount:
                totalAmount,

              cashback,

              status:
                "Approved",

              description:
                `Bought ${quantity} gram Gold at Pkr ${goldPrice}/g`,
            },
          ],
          {
            session,
          }
        );

      /* ======================================================
         COMMIT
      ====================================================== */

      await session.commitTransaction();

      const transaction =
        formatTransaction(
          createdTransactions[0]
        );

      return res.json({
        success: true,

        message:
          "Gold purchased successfully.",

        trade: {
          type: "buy",
          quantity,
          grams: quantity,
          price:
            goldPrice,
          pricePerGram:
            goldPrice,
          total:
            totalAmount,
          totalPkr:
            totalAmount,
          cashback,
          status:
            "Approved",
        },

        transaction,

        Wallet: {
          WalletBalance:
            user.WalletBalance,

          GoldBalance:
            user.goldBalance,

          goldBalance:
            user.goldBalance,

          UsdtBalance:
            toNumber(
              user.UsdtBalance
            ),

          cashbackEarned:
            toNumber(
              user.cashbackEarned
            ),

          vipLevel:
            user.vipLevel,
        },
      });
    }

    /* ========================================================
       SELL GOLD
    ======================================================== */

    if (tradeType === "sell") {
      const goldPrice =
        toNumber(
          settings.sellGoldPrice
        );

      if (
        !Number.isFinite(
          goldPrice
        ) ||
        goldPrice <= 0
      ) {
        await session.abortTransaction();

        return res.status(503).json({
          success: false,
          message:
            "Gold sell price is not configured.",
        });
      }

      const totalAmount =
        roundMoney(
          goldPrice * quantity
        );

      const currentGoldBalance =
        toNumber(
          user.goldBalance
        );

      if (
        currentGoldBalance <
        quantity
      ) {
        await session.abortTransaction();

        return res.status(400).json({
          success: false,
          message:
            "Insufficient Gold balance.",
        });
      }

      /* ======================================================
         PROFIT / LOSS
      ====================================================== */

      const averagePrice =
        toNumber(
          user.GoldAveragePrice,
          goldPrice
        );

      const profitLoss =
        roundMoney(
          (
            goldPrice -
            averagePrice
          ) * quantity
        );

      /* ======================================================
         WALLET UPDATE
      ====================================================== */

      const newGoldBalance =
        roundGold(
          currentGoldBalance -
            quantity
        );

      user.goldBalance =
        Math.max(
          0,
          newGoldBalance
        );

      user.WalletBalance =
        roundMoney(
          toNumber(
            user.WalletBalance
          ) + totalAmount
        );

      user.goldProfitLoss =
        roundMoney(
          toNumber(
            user.goldProfitLoss
          ) + profitLoss
        );

      /* ======================================================
         RESET AVERAGE IF ALL GOLD SOLD
      ====================================================== */

      if (
        user.goldBalance <= 0.00000001
      ) {
        user.goldBalance = 0;
        user.GoldAveragePrice = 0;
      }

      /* ======================================================
         VIP LEVEL
      ====================================================== */

      const depositAmount =
        toNumber(
          user.totalDeposit
        );

      if (
        depositAmount >=
        toNumber(
          settings.vipDiamondAmount
        )
      ) {
        user.vipLevel =
          "Diamond";
      } else if (
        depositAmount >=
        toNumber(
          settings.vipGoldAmount
        )
      ) {
        user.vipLevel =
          "Gold";
      } else if (
        depositAmount >=
        toNumber(
          settings.vipSilverAmount
        )
      ) {
        user.vipLevel =
          "Silver";
      } else {
        user.vipLevel =
          "Standard";
      }

      /* ======================================================
         SAVE USER
      ====================================================== */

      await user.save({
        session,
      });

      /* ======================================================
         SAVE TRANSACTION
      ====================================================== */

      const createdTransactions =
        await GoldTransaction.create(
          [
            {
              userId:
                user._id,

              username:
                user.username,

              type: "sell",

              quantity,

              pricePerGram:
                goldPrice,

              amount:
                totalAmount,

              profitLoss,

              status:
                "Approved",

              description:
                `Sold ${quantity} gram Gold at Pkr ${goldPrice}/g`,
            },
          ],
          {
            session,
          }
        );

      /* ======================================================
         COMMIT
      ====================================================== */

      await session.commitTransaction();

      const transaction =
        formatTransaction(
          createdTransactions[0]
        );

      return res.json({
        success: true,

        message:
          "Gold sold successfully.",

        trade: {
          type: "sell",
          quantity,
          grams: quantity,
          price:
            goldPrice,
          pricePerGram:
            goldPrice,
          total:
            totalAmount,
          totalPkr:
            totalAmount,
          profitLoss,
          status:
            "Approved",
        },

        transaction,

        Wallet: {
          WalletBalance:
            user.WalletBalance,

          GoldBalance:
            user.goldBalance,

          goldBalance:
            user.goldBalance,

          UsdtBalance:
            toNumber(
              user.UsdtBalance
            ),

          goldProfitLoss:
            toNumber(
              user.goldProfitLoss
            ),

          vipLevel:
            user.vipLevel,
        },
      });
    }

    /* ========================================================
       FALLBACK
    ======================================================== */

    await session.abortTransaction();

    return res.status(400).json({
      success: false,
      message:
        "Invalid trade type.",
    });
  } catch (err) {
    console.error(
      "TRADING ERROR:",
      err
    );

    try {
      if (
        session.inTransaction()
      ) {
        await session.abortTransaction();
      }
    } catch (abortError) {
      console.error(
        "Transaction abort error:",
        abortError
      );
    }

    return res.status(500).json({
      success: false,
      message:
        err?.message ||
        "Gold trading failed.",
    });
  } finally {
    await session.endSession();
  }
};

/* ============================================================
   MAIN LEGACY TRADE ROUTE

   POST /api/trading/gold

   Body:
   {
     "tradeType": "buy",
     "quantity": 2
   }
============================================================ */

router.post(
  "/gold",
  verifyToken,
  async (req, res) => {
    return executeGoldTrade(
      req,
      res
    );
  }
);

/* ============================================================
   FRONTEND BUY ROUTE

   POST /api/trading/buy

   Body:
   {
     "quantity": 2
   }
============================================================ */

router.post(
  "/buy",
  verifyToken,
  async (req, res) => {
    return executeGoldTrade(
      req,
      res,
      "buy"
    );
  }
);

/* ============================================================
   FRONTEND SELL ROUTE

   POST /api/trading/sell

   Body:
   {
     "quantity": 2
   }
============================================================ */

router.post(
  "/sell",
  verifyToken,
  async (req, res) => {
    return executeGoldTrade(
      req,
      res,
      "sell"
    );
  }
);

/* ============================================================
   REWARD ENGINE

   Cashback + VIP + Referral + Lucky Draw
============================================================ */

const applyTradingRewards = async (
  user,
  settings,
  tradeAmount,
  session
) => {
  let cashback = 0;
  let referralBonus = 0;
  let luckyDrawEligible =
    false;

  const amount =
    toNumber(tradeAmount);

  /* ==========================================================
     CASHBACK
  ========================================================== */

  if (
    settings.cashbackEnabled &&
    toNumber(
      settings.cashbackRate
    ) > 0
  ) {
    cashback =
      roundMoney(
        (
          amount *
          toNumber(
            settings.cashbackRate
          )
        ) / 100
      );

    user.cashbackEarned =
      roundMoney(
        toNumber(
          user.cashbackEarned
        ) + cashback
      );

    user.WalletBalance =
      roundMoney(
        toNumber(
          user.WalletBalance
        ) + cashback
      );
  }

  /* ==========================================================
     VIP LEVEL
  ========================================================== */

  const depositAmount =
    toNumber(
      user.totalDeposit
    );

  if (
    depositAmount >=
    toNumber(
      settings.vipDiamondAmount
    )
  ) {
    user.vipLevel =
      "Diamond";
  } else if (
    depositAmount >=
    toNumber(
      settings.vipGoldAmount
    )
  ) {
    user.vipLevel =
      "Gold";
  } else if (
    depositAmount >=
    toNumber(
      settings.vipSilverAmount
    )
  ) {
    user.vipLevel =
      "Silver";
  } else {
    user.vipLevel =
      "Standard";
  }

  /* ==========================================================
     REFERRAL BONUS
  ========================================================== */

  if (user.referredBy) {
    const referrer =
      await User.findById(
        user.referredBy
      ).session(session);

    if (referrer) {
      referralBonus =
        roundMoney(
          toNumber(
            settings.referralBonus
          )
        );

      if (
        referralBonus > 0
      ) {
        referrer.WalletBalance =
          roundMoney(
            toNumber(
              referrer.WalletBalance
            ) + referralBonus
          );

        referrer.referralBonus =
          roundMoney(
            toNumber(
              referrer.referralBonus
            ) + referralBonus
          );

        referrer.totalReferrals =
          toNumber(
            referrer.totalReferrals
          ) + 1;

        referrer.activeReferrals =
          toNumber(
            referrer.activeReferrals
          ) + 1;

        await referrer.save({
          session,
        });
      }
    }
  }

  /* ==========================================================
     LUCKY DRAW
  ========================================================== */

  if (
    settings.luckyDrawEnabled &&
    amount >= 5000
  ) {
    luckyDrawEligible =
      true;
  }

  /* ==========================================================
     SAVE USER
  ========================================================== */

  await user.save({
    session,
  });

  return {
    cashback,
    referralBonus,
    luckyDrawEligible,
    vipLevel:
      user.vipLevel,
  };
};
/* ============================================================
   VIP BENEFITS
============================================================ */

const getVipBenefits = (
  vipLevel
) => {
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

/* ============================================================
   USER REWARD SUMMARY

   GET /api/trading/rewards
============================================================ */

router.get(
  "/rewards",
  verifyToken,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user._id
        ).lean();

      const settings =
        await Settings.findOne().lean();

      if (!user || !settings) {
        return res.status(404).json({
          success: false,
          message:
            "Reward data not found.",
        });
      }

      const vipLevel =
        user.vipLevel ||
        "Standard";

      const vipBenefits =
        getVipBenefits(
          vipLevel
        );

      return res.json({
        success: true,

        rewards: {
          cashbackEarned:
            toNumber(
              user.cashbackEarned
            ),

          referralBonus:
            toNumber(
              user.referralBonus
            ),

          totalReferrals:
            toNumber(
              user.totalReferrals
            ),

          activeReferrals:
            toNumber(
              user.activeReferrals
            ),

          vipLevel,

          cashbackRate:
            toNumber(
              settings.cashbackRate
            ),

          luckyDrawEnabled:
            Boolean(
              settings.luckyDrawEnabled
            ),

          luckyDrawPrize:
            settings.luckyDrawPrize ||
            "10 Gram Gold",

          vipBenefits,
        },
      });
    } catch (err) {
      console.error(
        "Reward Error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load reward summary.",
      });
    }
  }
);

/* ============================================================
   DASHBOARD SUMMARY API

   GET /api/trading/dashboard
============================================================ */

router.get(
  "/dashboard",
  verifyToken,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user._id
        ).lean();

      const settings =
        await Settings.findOne().lean();

      if (!user || !settings) {
        return res.status(404).json({
          success: false,
          message:
            "Dashboard data not found.",
        });
      }

      /* ======================================================
         RECENT TRANSACTIONS
      ====================================================== */

      const recentRaw =
        await GoldTransaction.find({
          userId: user._id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(10)
          .lean();

      const recentTransactions =
        recentRaw.map(
          formatTransaction
        );

      /* ======================================================
         MARKET
      ====================================================== */

      const market =
        buildMarketResponse(
          settings
        );

      /* ======================================================
         GOLD CURRENT VALUE

         Sell price = executable
         current value.
      ====================================================== */

      const goldBalance =
        toNumber(
          user.goldBalance
        );

      const currentGoldValue =
        roundMoney(
          goldBalance *
            market.sellPrice
        );

      /* ======================================================
         PORTFOLIO

         IMPORTANT:
         UsdtBalance is kept as USDT here.
         We do not silently treat 1 USDT as
         1 PKR.
      ====================================================== */

      const usdtBalance =
        toNumber(
          user.UsdtBalance
        );

      const usdToPkr =
        toNumber(
          settings.usdToPkr,
          1
        );

      const usdtValuePkr =
        roundMoney(
          usdtBalance *
            usdToPkr
        );

      const portfolioValue =
        roundMoney(
          toNumber(
            user.WalletBalance
          ) +
            usdtValuePkr +
            currentGoldValue
        );

      /* ======================================================
         TRADING STATISTICS
      ====================================================== */

      const tradingStats =
        await GoldTransaction.aggregate(
          [
            {
              $match: {
                userId:
                  user._id,
              },
            },
            {
              $group: {
                _id: "$type",

                totalAmount: {
                  $sum: {
                    $ifNull: [
                      "$amount",
                      0,
                    ],
                  },
                },

                totalQuantity: {
                  $sum: {
                    $ifNull: [
                      "$quantity",
                      0,
                    ],
                  },
                },

                totalTrades: {
                  $sum: 1,
                },
              },
            },
          ]
        );

      const buyStats =
        tradingStats.find(
          (item) =>
            item._id === "buy"
        ) || {};

      const sellStats =
        tradingStats.find(
          (item) =>
            item._id === "sell"
        ) || {};

      /* ======================================================
         RESPONSE
      ====================================================== */

      return res.json({
        success: true,

        dashboard: {
          user: {
            username:
              user.username,

            email:
              user.email,

            role:
              user.role,

            vipLevel:
              user.vipLevel ||
              "Standard",
          },

          Wallet: {
            WalletBalance:
              toNumber(
                user.WalletBalance
              ),

            UsdtBalance:
              usdtBalance,

            goldBalance:
              goldBalance,

            cashbackEarned:
              toNumber(
                user.cashbackEarned
              ),

            referralBonus:
              toNumber(
                user.referralBonus
              ),
          },

          market: {
            ...market,

            usdToPkr,
          },

          portfolio: {
            goldCurrentValue:
              currentGoldValue,

            usdtCurrentValue:
              usdtValuePkr,

            totalPortfolioValue:
              portfolioValue,

            goldProfitLoss:
              toNumber(
                user.goldProfitLoss
              ),
          },

          statistics: {
            totalBuyTrades:
              buyStats.totalTrades ||
              0,

            totalSellTrades:
              sellStats.totalTrades ||
              0,

            /*
             * Backward-compatible
             * old property names.
             */
            totalbuyTrades:
              buyStats.totalTrades ||
              0,

            totalsellTrades:
              sellStats.totalTrades ||
              0,

            totalGoldBought:
              toNumber(
                buyStats.totalQuantity
              ),

            totalGoldSold:
              toNumber(
                sellStats.totalQuantity
              ),

            totalBuyVolume:
              toNumber(
                buyStats.totalAmount
              ),

            totalSellVolume:
              toNumber(
                sellStats.totalAmount
              ),

            totalbuyVolume:
              toNumber(
                buyStats.totalAmount
              ),

            totalsellVolume:
              toNumber(
                sellStats.totalAmount
              ),
          },

          recentTransactions,
        },
      });
    } catch (err) {
      console.error(
        "Dashboard Error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load dashboard.",
      });
    }
  }
);

/* ============================================================
   USER PORTFOLIO API

   GET /api/trading/portfolio
============================================================ */

router.get(
  "/portfolio",
  verifyToken,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user._id
        ).lean();

      const settings =
        await Settings.findOne().lean();

      if (!user || !settings) {
        return res.status(404).json({
          success: false,
          message:
            "Portfolio not found.",
        });
      }

      const market =
        buildMarketResponse(
          settings
        );

      const walletBalance =
        toNumber(
          user.WalletBalance
        );

      const usdtBalance =
        toNumber(
          user.UsdtBalance
        );

      const goldBalance =
        toNumber(
          user.goldBalance
        );

      const usdToPkr =
        toNumber(
          settings.usdToPkr,
          1
        );

      const goldValue =
        roundMoney(
          goldBalance *
            market.sellPrice
        );

      const usdtValue =
        roundMoney(
          usdtBalance *
            usdToPkr
        );

      const totalPortfolioValue =
        roundMoney(
          walletBalance +
            usdtValue +
            goldValue
        );

      return res.json({
        success: true,

        portfolio: {
          WalletBalance:
            walletBalance,

          UsdtBalance:
            usdtBalance,

          goldBalance,

          goldValue,

          usdtValue,

          totalPortfolioValue,

          cashbackEarned:
            toNumber(
              user.cashbackEarned
            ),

          referralBonus:
            toNumber(
              user.referralBonus
            ),

          goldProfitLoss:
            toNumber(
              user.goldProfitLoss
            ),

          vipLevel:
            user.vipLevel ||
            "Standard",

          market: {
            buyPrice:
              market.buyPrice,

            sellPrice:
              market.sellPrice,

            livePrice:
              market.livePrice,

            tradingEnabled:
              market.tradingEnabled,
          },

          usdToPkr,
        },
      });
    } catch (err) {
      console.error(
        "Portfolio Error:",
        err
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load portfolio.",
      });
    }
  }
);

/* ============================================================
   ADMIN CHECK HELPER

   Kept available if future trading admin
   routes use this router.
============================================================ */

router.get(
  "/admin/check",
  verifyToken,
  isAdmin,
  async (req, res) => {
    return res.json({
      success: true,
      message:
        "Trading admin access verified.",
    });
  }
);

/* ============================================================
   MODULE EXPORT
============================================================ */

module.exports = router;