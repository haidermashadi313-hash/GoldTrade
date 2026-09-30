"use strict";

const express = require("express");
const router = express.Router();

// ======================================================
// MODELS
// ======================================================

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const UsdtTrade = require("../models/UsdtTrade");
const WalletHistory = require("../models/WalletHistory");
const Transaction = require("../models/Transaction");
const Settings = require("../models/Settings");

// ======================================================
// MIDDLEWARE
// ======================================================

const {
  verifyToken,
  isAdmin,
} = require("../middleware/auth");

// ======================================================
// DEFAULT USDT SETTINGS
// ======================================================

const DEFAULT_USDT_SETTINGS = {
  usdtBuyPrice: 320,
  usdtSellPrice: 318,

  usdtPriceUSD: 1,
  usdToPkr: 320,

  usdtTradingEnabled: true,
  marketStatus: "OPEN",

  minimumBuy: 10,
  minimumSell: 10,

  maximumBuy: 100000,
  maximumSell: 100000,

  network: "TRC20",
  walletAddress: "",
};

// ======================================================
// SAFE NUMBER
// ======================================================

const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

// ======================================================
// SAFE BOOLEAN
// ======================================================

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
};

// ======================================================
// NORMALIZE NETWORK
// ======================================================

const normalizeNetwork = (value) => {
  const network = String(value || "TRC20")
    .trim()
    .toUpperCase();

  return ["TRC20", "BEP20", "ERC20"].includes(network)
    ? network
    : "TRC20";
};

// ======================================================
// NORMALIZE MARKET STATUS
// ======================================================

const normalizeMarketStatus = (value) => {
  const status = String(value || "OPEN")
    .trim()
    .toUpperCase();

  return ["OPEN", "CLOSED", "MAINTENANCE"].includes(status)
    ? status
    : "OPEN";
};

// ======================================================
// GET SETTINGS OR CREATE DEFAULT
// ======================================================

const getUsdtSettings = async () => {
  let settings = await Settings.findOne();

  if (!settings) {
    settings = await Settings.create(
      DEFAULT_USDT_SETTINGS
    );

    console.log(
      "🟢 Default USDT Settings Created"
    );
  }

  return settings;
};

// ======================================================
// BUILD SETTINGS RESPONSE
// ======================================================

const buildUsdtSettingsResponse = (settings) => {
  const buyPrice = toNumber(
    settings.usdtBuyPrice,
    0
  );

  const sellPrice = toNumber(
    settings.usdtSellPrice,
    0
  );

  return {
    _id: settings._id,

    // Frontend-compatible names
    buyPrice,
    sellPrice,

    usdtPriceUSD: toNumber(
      settings.usdtPriceUSD,
      1
    ),

    usdToPkr: toNumber(
      settings.usdToPkr,
      0
    ),

    network: normalizeNetwork(
      settings.network
    ),

    marketStatus: normalizeMarketStatus(
      settings.marketStatus
    ),

    tradingEnabled: Boolean(
      settings.usdtTradingEnabled
    ),

    minimumBuy: toNumber(
      settings.minimumBuy,
      10
    ),

    minimumSell: toNumber(
      settings.minimumSell,
      10
    ),

    maximumBuy: toNumber(
      settings.maximumBuy,
      100000
    ),

    maximumSell: toNumber(
      settings.maximumSell,
      100000
    ),

    walletAddress: String(
      settings.walletAddress || ""
    ),

    // Backend-compatible names
    usdtBuyPrice: buyPrice,
    usdtSellPrice: sellPrice,
    usdtTradingEnabled: Boolean(
      settings.usdtTradingEnabled
    ),

    spread: Number(
      (buyPrice - sellPrice).toFixed(2)
    ),

    updatedAt: settings.updatedAt,

    updatedBy:
      settings.updatedByUsername ||
      "System",
  };
};

// ======================================================
// HEALTH CHECK
// GET /api/usdt/health
// ======================================================

router.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    module: "USDT Trading API",
    version: "18.0.0 Enterprise",
    status: "ONLINE",
    timestamp: new Date().toISOString(),
  });
});

// ======================================================
// API STATUS
// GET /api/usdt/status
// ======================================================

router.get("/status", async (req, res) => {
  try {
    const settings =
      await getUsdtSettings();

    return res.status(200).json({
      success: true,

      module: "USDT Trading API",
      version: "18.0.0 Enterprise",

      tradingEnabled: Boolean(
        settings.usdtTradingEnabled
      ),

      marketStatus:
        normalizeMarketStatus(
          settings.marketStatus
        ),

      serverTime:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "USDT STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load USDT API status.",
    });
  }
});

// ======================================================
// LIVE USDT PRICE
// GET /api/usdt/price
// GET /api/usdt/rates
// ======================================================

const sendUsdtResponse = async (
  req,
  res
) => {
  try {
    const settings =
      await getUsdtSettings();

    const response =
      buildUsdtSettingsResponse(
        settings
      );

    return res.status(200).json({
      success: true,

      buyPrice: response.buyPrice,
      sellPrice: response.sellPrice,

      usdtBuyPrice:
        response.usdtBuyPrice,

      usdtSellPrice:
        response.usdtSellPrice,

      usdtPriceUSD:
        response.usdtPriceUSD,

      usdToPkr:
        response.usdToPkr,

      tradingEnabled:
        response.tradingEnabled,

      marketStatus:
        response.marketStatus,

      network:
        response.network,

      spread:
        response.spread,

      updatedAt:
        response.updatedAt,

      serverTime:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "USDT PRICE API ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load USDT market price.",
    });
  }
};

router.get(
  "/price",
  sendUsdtResponse
);

router.get(
  "/rates",
  sendUsdtResponse
);

// ======================================================
// CURRENT USER WALLET
// GET /api/usdt/wallet
// ======================================================

router.get(
  "/wallet",
  verifyToken,
  async (req, res) => {
    try {
      const wallet =
        await Wallet.findOne({
          userId: req.user.id,
        }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: "Wallet not found.",
        });
      }

      return res.status(200).json({
        success: true,

        wallet: {
          pkrBalance:
            toNumber(wallet.pkrBalance),

          goldBalance:
            toNumber(wallet.goldBalance),

          usdtBalance:
            toNumber(wallet.usdtBalance),

          lockedPkr:
            toNumber(wallet.lockedPkr),

          lockedGold:
            toNumber(wallet.lockedGold),

          lockedUsdt:
            toNumber(wallet.lockedUsdt),

          portfolioValue:
            toNumber(wallet.portfolioValue),

          liveProfit:
            toNumber(wallet.liveProfit),

          liveProfitPercent:
            toNumber(
              wallet.liveProfitPercent
            ),
        },

        updatedAt:
          wallet.updatedAt,
      });
    } catch (error) {
      console.error(
        "GET USDT WALLET ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load USDT wallet.",
      });
    }
  }
);

// ======================================================
// CURRENT USER USDT BALANCE
// GET /api/usdt/balance
// ======================================================

router.get(
  "/balance",
  verifyToken,
  async (req, res) => {
    try {
      const wallet =
        await Wallet.findOne({
          userId: req.user.id,
        }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: "Wallet not found.",
        });
      }

      return res.status(200).json({
        success: true,

        username:
          req.user.username,

        balances: {
          pkrBalance:
            toNumber(wallet.pkrBalance),

          usdtBalance:
            toNumber(wallet.usdtBalance),

          goldBalance:
            toNumber(wallet.goldBalance),
        },

        available: {
          pkr:
            toNumber(
              wallet.availablePkr,
              wallet.pkrBalance
            ),

          usdt:
            toNumber(
              wallet.availableUsdt,
              wallet.usdtBalance
            ),
        },

        updatedAt:
          wallet.updatedAt,
      });
    } catch (error) {
      console.error(
        "GET USDT BALANCE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load wallet balance.",
      });
    }
  }
);
// ======================================================
// BUY USDT
// POST /api/usdt/buy
// ======================================================

router.post(
  "/buy",
  verifyToken,
  async (req, res) => {
    try {
      const usdtQty =
        toNumber(req.body?.quantity, 0);

      if (
        !Number.isFinite(usdtQty) ||
        usdtQty <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid USDT quantity is required.",
        });
      }

      const user =
        await User.findById(
          req.user.id
        )
          .select(
            "_id username email role"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const wallet =
        await Wallet.findOne({
          userId: user._id,
        });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: "Wallet not found.",
        });
      }

      const settings =
        await getUsdtSettings();

      // ================================================
      // MARKET CHECK
      // ================================================

      if (
        !settings.usdtTradingEnabled
      ) {
        return res.status(403).json({
          success: false,
          message:
            "USDT trading is currently disabled.",
        });
      }

      if (
        normalizeMarketStatus(
          settings.marketStatus
        ) !== "OPEN"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "USDT market is currently closed.",
        });
      }

      // ================================================
      // LIMIT CHECK
      // ================================================

      const minimumBuy =
        toNumber(
          settings.minimumBuy,
          10
        );

      const maximumBuy =
        toNumber(
          settings.maximumBuy,
          100000
        );

      if (usdtQty < minimumBuy) {
        return res.status(400).json({
          success: false,
          message:
            `Minimum buy is ${minimumBuy} USDT.`,
          minimumBuy,
        });
      }

      if (usdtQty > maximumBuy) {
        return res.status(400).json({
          success: false,
          message:
            `Maximum buy is ${maximumBuy} USDT.`,
          maximumBuy,
        });
      }

      // ================================================
      // PRICE
      // ================================================

      const buyPrice =
        toNumber(
          settings.usdtBuyPrice,
          0
        );

      if (buyPrice <= 0) {
        return res.status(500).json({
          success: false,
          message:
            "USDT buy price is not configured.",
        });
      }

      const totalAmount = Number(
        (
          usdtQty *
          buyPrice
        ).toFixed(2)
      );

      // ================================================
      // AVAILABLE PKR
      // ================================================

      const availablePkr =
        toNumber(
          wallet.availablePkr,
          wallet.pkrBalance
        );

      if (
        availablePkr <
        totalAmount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Insufficient PKR balance.",

          required:
            totalAmount,

          available:
            availablePkr,
        });
      }

      // ================================================
      // WALLET BEFORE
      // ================================================

      const walletBefore = {
        pkrBalance:
          toNumber(
            wallet.pkrBalance
          ),

        goldBalance:
          toNumber(
            wallet.goldBalance
          ),

        usdtBalance:
          toNumber(
            wallet.usdtBalance
          ),
      };

      // ================================================
      // WALLET UPDATE
      // ================================================

      wallet.pkrBalance =
        Number(
          (
            walletBefore.pkrBalance -
            totalAmount
          ).toFixed(2)
        );

      wallet.usdtBalance =
        Number(
          (
            walletBefore.usdtBalance +
            usdtQty
          ).toFixed(6)
        );

      wallet.totalUsdtDeposited =
        Number(
          (
            toNumber(
              wallet.totalUsdtDeposited
            ) +
            usdtQty
          ).toFixed(6)
        );

      wallet.lastTradeAt =
        new Date();

      await wallet.save();

      // ================================================
      // WALLET AFTER
      // ================================================

      const walletAfter = {
        pkrBalance:
          toNumber(
            wallet.pkrBalance
          ),

        goldBalance:
          toNumber(
            wallet.goldBalance
          ),

        usdtBalance:
          toNumber(
            wallet.usdtBalance
          ),
      };

      // ================================================
      // CREATE TRADE
      // ================================================

      const trade =
        await UsdtTrade.create({
          userId: user._id,
          username: user.username,

          tradeType: "BUY",

          quantity: usdtQty,
          remainingQuantity: usdtQty,
          soldQuantity: 0,

          buyPrice,
          marketPrice: buyPrice,

          usdToPkrRate:
            toNumber(
              settings.usdToPkr
            ),

          totalAmount,
          investedAmount:
            totalAmount,

          walletBefore,
          walletAfter,

          paymentMethod:
            "PKR Wallet",

          blockchainNetwork:
            normalizeNetwork(
              settings.network
            ),

          status: "COMPLETED",

          note:
            "USDT purchased successfully.",
        });

      // ================================================
      // TRANSACTION
      // ================================================

      await Transaction.create({
        userId: user._id,
        username: user.username,

        walletType: "PKR",
        transactionType:
          "BUY_USDT",
        transactionMode:
          "DEBIT",

        amount: totalAmount,

        balanceBefore:
          walletBefore.pkrBalance,

        balanceAfter:
          walletAfter.pkrBalance,

        status: "Completed",

        referenceId:
          trade._id.toString(),

        note:
          `Purchased ${usdtQty} USDT`,
      });

      // ================================================
      // WALLET HISTORY
      // ================================================

      await WalletHistory.create({
        userId: user._id,
        username: user.username,

        walletType: "USDT",
        type: "BUY",

        amount: usdtQty,

        balanceBefore:
          walletBefore.usdtBalance,

        balanceAfter:
          walletAfter.usdtBalance,

        referenceId:
          trade._id.toString(),

        note:
          `Purchased ${usdtQty} USDT`,
      });

      // ================================================
      // RESPONSE
      // ================================================

      return res.status(201).json({
        success: true,

        message:
          "USDT purchased successfully.",

        trade: {
          id: trade._id,
          quantity:
            trade.quantity,

          buyPrice:
            trade.buyPrice,

          totalAmount:
            trade.totalAmount,

          createdAt:
            trade.createdAt,
        },

        wallet: {
          pkrBalance:
            wallet.pkrBalance,

          goldBalance:
            wallet.goldBalance,

          usdtBalance:
            wallet.usdtBalance,
        },
      });
    } catch (error) {
      console.error(
        "BUY USDT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to purchase USDT.",
      });
    }
  }
);
// ======================================================
// SELL USDT
// POST /api/usdt/sell
// ======================================================

router.post(
  "/sell",
  verifyToken,
  async (req, res) => {
    try {
      const usdtQty =
        toNumber(req.body?.quantity, 0);

      if (
        !Number.isFinite(usdtQty) ||
        usdtQty <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid USDT quantity is required.",
        });
      }

      const user =
        await User.findById(
          req.user.id
        )
          .select(
            "_id username email role"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const wallet =
        await Wallet.findOne({
          userId: user._id,
        });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: "Wallet not found.",
        });
      }

      const settings =
        await getUsdtSettings();

      // ================================================
      // MARKET
      // ================================================

      if (
        !settings.usdtTradingEnabled
      ) {
        return res.status(403).json({
          success: false,
          message:
            "USDT trading is currently disabled.",
        });
      }

      if (
        normalizeMarketStatus(
          settings.marketStatus
        ) !== "OPEN"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "USDT market is currently closed.",
        });
      }

      // ================================================
      // LIMITS
      // ================================================

      const minimumSell =
        toNumber(
          settings.minimumSell,
          10
        );

      const maximumSell =
        toNumber(
          settings.maximumSell,
          100000
        );

      if (usdtQty < minimumSell) {
        return res.status(400).json({
          success: false,
          message:
            `Minimum sell is ${minimumSell} USDT.`,
          minimumSell,
        });
      }

      if (usdtQty > maximumSell) {
        return res.status(400).json({
          success: false,
          message:
            `Maximum sell is ${maximumSell} USDT.`,
          maximumSell,
        });
      }

      // ================================================
      // BALANCE
      // ================================================

      const availableUsdt =
        toNumber(
          wallet.availableUsdt,
          wallet.usdtBalance
        );

      if (
        availableUsdt <
        usdtQty
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Insufficient USDT balance.",

          required:
            usdtQty,

          available:
            availableUsdt,
        });
      }

      // ================================================
      // PRICE
      // ================================================

      const sellPrice =
        toNumber(
          settings.usdtSellPrice,
          0
        );

      if (sellPrice <= 0) {
        return res.status(500).json({
          success: false,
          message:
            "USDT sell price is not configured.",
        });
      }

      const totalAmount =
        Number(
          (
            usdtQty *
            sellPrice
          ).toFixed(2)
        );

      // ================================================
      // FIFO BUY TRADES
      // ================================================

      const buyTrades =
        await UsdtTrade.find({
          userId: user._id,
          tradeType: "BUY",
          remainingQuantity: {
            $gt: 0,
          },
          status: {
            $in: [
              "COMPLETED",
              "Completed",
            ],
          },
        })
          .sort({
            createdAt: 1,
          });

      let availableFromTrades = 0;

      buyTrades.forEach(
        (trade) => {
          availableFromTrades +=
            toNumber(
              trade.remainingQuantity
            );
        }
      );

      // ================================================
      // PROTECT FIFO DATA
      // ================================================

      if (
        availableFromTrades <
        usdtQty
      ) {
        return res.status(400).json({
          success: false,
          message:
            "USDT holding records are insufficient for this sale.",
          available:
            Number(
              availableFromTrades.toFixed(
                6
              )
            ),
        });
      }

      // ================================================
      // WALLET BEFORE
      // ================================================

      const walletBefore = {
        pkrBalance:
          toNumber(
            wallet.pkrBalance
          ),

        goldBalance:
          toNumber(
            wallet.goldBalance
          ),

        usdtBalance:
          toNumber(
            wallet.usdtBalance
          ),
      };

      // ================================================
      // FIFO PROFIT / LOSS
      // ================================================

      let remainingToSell =
        usdtQty;

      let investedAmount = 0;

      for (
        const trade of buyTrades
      ) {
        if (
          remainingToSell <= 0
        ) {
          break;
        }

        const availableQty =
          toNumber(
            trade.remainingQuantity
          );

        if (
          availableQty <= 0
        ) {
          continue;
        }

        const sellQty =
          Math.min(
            availableQty,
            remainingToSell
          );

        investedAmount +=
          sellQty *
          toNumber(
            trade.buyPrice
          );

        trade.remainingQuantity =
          Number(
            (
              availableQty -
              sellQty
            ).toFixed(6)
          );

        trade.soldQuantity =
          Number(
            (
              toNumber(
                trade.soldQuantity
              ) +
              sellQty
            ).toFixed(6)
          );

        await trade.save();

        remainingToSell -=
          sellQty;
      }

      const profitLoss =
        Number(
          (
            totalAmount -
            investedAmount
          ).toFixed(2)
        );

      const profitLossPercent =
        investedAmount > 0
          ? Number(
              (
                (profitLoss /
                  investedAmount) *
                100
              ).toFixed(2)
            )
          : 0;

      // ================================================
      // UPDATE WALLET
      // ================================================

      wallet.usdtBalance =
        Number(
          (
            walletBefore.usdtBalance -
            usdtQty
          ).toFixed(6)
        );

      wallet.pkrBalance =
        Number(
          (
            walletBefore.pkrBalance +
            totalAmount
          ).toFixed(2)
        );

      wallet.totalUsdtWithdrawn =
        Number(
          (
            toNumber(
              wallet.totalUsdtWithdrawn
            ) +
            usdtQty
          ).toFixed(6)
        );

      wallet.lastTradeAt =
        new Date();

      wallet.portfolioValue =
        Number(
          (
            wallet.usdtBalance *
            sellPrice
          ).toFixed(2)
        );

      wallet.liveProfit =
        Number(
          (
            toNumber(
              wallet.liveProfit
            ) +
            profitLoss
          ).toFixed(2)
        );

      await wallet.save();

      const walletAfter = {
        pkrBalance:
          toNumber(
            wallet.pkrBalance
          ),

        goldBalance:
          toNumber(
            wallet.goldBalance
          ),

        usdtBalance:
          toNumber(
            wallet.usdtBalance
          ),
      };

      // ================================================
      // SELL TRADE
      // ================================================

      const sellTrade =
        await UsdtTrade.create({
          userId: user._id,
          username: user.username,

          tradeType: "SELL",

          quantity: usdtQty,
          soldQuantity: usdtQty,
          remainingQuantity: 0,

          sellPrice,
          marketPrice: sellPrice,

          usdToPkrRate:
            toNumber(
              settings.usdToPkr
            ),

          totalAmount,
          investedAmount,

          profitLoss,
          profitLossPercent,

          walletBefore,
          walletAfter,

          paymentMethod:
            "PKR Wallet",

          blockchainNetwork:
            normalizeNetwork(
              settings.network
            ),

          status: "COMPLETED",

          note:
            "USDT sold successfully.",
        });

      // ================================================
      // TRANSACTION
      // ================================================

      await Transaction.create({
        userId: user._id,
        username: user.username,

        walletType: "PKR",

        transactionType:
          "SELL_USDT",

        transactionMode:
          "CREDIT",

        amount:
          totalAmount,

        balanceBefore:
          walletBefore.pkrBalance,

        balanceAfter:
          walletAfter.pkrBalance,

        status: "Completed",

        referenceId:
          sellTrade._id.toString(),

        note:
          `Sold ${usdtQty} USDT`,
      });

      // ================================================
      // WALLET HISTORY
      // ================================================

      await WalletHistory.create({
        userId: user._id,
        username: user.username,

        walletType: "USDT",
        type: "SELL",

        amount: usdtQty,

        balanceBefore:
          walletBefore.usdtBalance,

        balanceAfter:
          walletAfter.usdtBalance,

        referenceId:
          sellTrade._id.toString(),

        note:
          `Sold ${usdtQty} USDT`,
      });

      return res.status(201).json({
        success: true,

        message:
          "USDT sold successfully.",

        trade: {
          id:
            sellTrade._id,

          quantity:
            sellTrade.quantity,

          sellPrice:
            sellTrade.sellPrice,

          totalAmount:
            sellTrade.totalAmount,

          investedAmount:
            sellTrade.investedAmount,

          profitLoss:
            sellTrade.profitLoss,

          profitLossPercent:
            sellTrade.profitLossPercent,

          createdAt:
            sellTrade.createdAt,
        },

        wallet: {
          pkrBalance:
            wallet.pkrBalance,

          goldBalance:
            wallet.goldBalance,

          usdtBalance:
            wallet.usdtBalance,

          portfolioValue:
            wallet.portfolioValue,

          liveProfit:
            wallet.liveProfit,
        },
      });
    } catch (error) {
      console.error(
        "SELL USDT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to sell USDT.",
      });
    }
  }
);

// ======================================================
// GET CURRENT USER PORTFOLIO
// GET /api/usdt/portfolio
// ======================================================

router.get(
  "/portfolio",
  verifyToken,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.id
        )
          .select(
            "_id username email role"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const wallet =
        await Wallet.findOne({
          userId: user._id,
        }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: "Wallet not found.",
        });
      }

      const settings =
        await getUsdtSettings();

      const holdings =
        await UsdtTrade.find({
          userId: user._id,

          tradeType: "BUY",

          remainingQuantity: {
            $gt: 0,
          },

          status: {
            $in: [
              "COMPLETED",
              "Completed",
            ],
          },
        })
          .sort({
            createdAt: 1,
          })
          .lean();

      let totalUsdt = 0;
      let investedAmount = 0;

      const positions =
        holdings.map(
          (trade) => {
            const qty =
              toNumber(
                trade.remainingQuantity
              );

            const buyPrice =
              toNumber(
                trade.buyPrice
              );

            totalUsdt += qty;

            investedAmount +=
              qty * buyPrice;

            const currentValue =
              qty *
              toNumber(
                settings.usdtSellPrice
              );

            const pnl =
              currentValue -
              qty * buyPrice;

            return {
              tradeId:
                trade._id,

              quantity: qty,

              buyPrice,

              currentPrice:
                toNumber(
                  settings.usdtSellPrice
                ),

              investedAmount:
                Number(
                  (
                    qty *
                    buyPrice
                  ).toFixed(2)
                ),

              currentValue:
                Number(
                  currentValue.toFixed(
                    2
                  )
                ),

              profitLoss:
                Number(
                  pnl.toFixed(2)
                ),

              createdAt:
                trade.createdAt,
            };
          }
        );

      const currentValue =
        Number(
          (
            totalUsdt *
            toNumber(
              settings.usdtSellPrice
            )
          ).toFixed(2)
        );

      const totalProfitLoss =
        Number(
          (
            currentValue -
            investedAmount
          ).toFixed(2)
        );

      const totalProfitPercent =
        investedAmount > 0
          ? Number(
              (
                (totalProfitLoss /
                  investedAmount) *
                100
              ).toFixed(2)
            )
          : 0;

      return res.status(200).json({
        success: true,

        portfolio: {
          username:
            user.username,

          usdtBalance:
            toNumber(
              wallet.usdtBalance
            ),

          totalUsdt:
            Number(
              totalUsdt.toFixed(6)
            ),

          buyPrice:
            toNumber(
              settings.usdtBuyPrice
            ),

          sellPrice:
            toNumber(
              settings.usdtSellPrice
            ),

          investedAmount:
            Number(
              investedAmount.toFixed(2)
            ),

          currentValue,

          profitLoss:
            totalProfitLoss,

          profitLossPercent:
            totalProfitPercent,

          totalPositions:
            positions.length,

          positions,

          updatedAt:
            new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(
        "GET USDT PORTFOLIO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load USDT portfolio.",
      });
    }
  }
);
// ======================================================
// GET PORTFOLIO BY USERNAME
// GET /api/usdt/portfolio/:username
// ======================================================

router.get(
  "/portfolio/:username",
  verifyToken,
  async (req, res) => {
    try {
      const username =
        String(
          req.params.username || ""
        )
          .trim()
          .toLowerCase();

      if (!username) {
        return res.status(400).json({
          success: false,
          message:
            "Username is required.",
        });
      }

      const currentUsername =
        String(
          req.user.username || ""
        ).toLowerCase();

      if (
        req.user.role !== "admin" &&
        currentUsername !== username
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      const user =
        await User.findOne({
          username,
        })
          .select(
            "_id username email role"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const wallet =
        await Wallet.findOne({
          userId: user._id,
        }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message: "Wallet not found.",
        });
      }

      const settings =
        await getUsdtSettings();

      const holdings =
        await UsdtTrade.find({
          userId: user._id,

          tradeType: "BUY",

          remainingQuantity: {
            $gt: 0,
          },

          status: {
            $in: [
              "COMPLETED",
              "Completed",
            ],
          },
        }).lean();

      let totalUsdt = 0;
      let investedAmount = 0;

      holdings.forEach(
        (trade) => {
          const qty =
            toNumber(
              trade.remainingQuantity
            );

          const price =
            toNumber(
              trade.buyPrice
            );

          totalUsdt += qty;
          investedAmount +=
            qty * price;
        }
      );

      const sellPrice =
        toNumber(
          settings.usdtSellPrice
        );

      const currentValue =
        Number(
          (
            totalUsdt *
            sellPrice
          ).toFixed(2)
        );

      const profitLoss =
        Number(
          (
            currentValue -
            investedAmount
          ).toFixed(2)
        );

      const profitLossPercent =
        investedAmount > 0
          ? Number(
              (
                (profitLoss /
                  investedAmount) *
                100
              ).toFixed(2)
            )
          : 0;

      return res.status(200).json({
        success: true,

        portfolio: {
          username:
            user.username,

          email:
            user.email,

          role:
            user.role,

          usdtBalance:
            toNumber(
              wallet.usdtBalance
            ),

          totalUsdt:
            Number(
              totalUsdt.toFixed(6)
            ),

          investedAmount:
            Number(
              investedAmount.toFixed(2)
            ),

          currentValue,

          profitLoss,

          profitLossPercent,

          totalPositions:
            holdings.length,

          updatedAt:
            wallet.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "GET USER USDT PORTFOLIO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load user portfolio.",
      });
    }
  }
);

// ======================================================
// CURRENT USDT HOLDINGS
// GET /api/usdt/holdings
// ======================================================

router.get(
  "/holdings",
  verifyToken,
  async (req, res) => {
    try {
      const holdings =
        await UsdtTrade.find({
          userId: req.user.id,

          tradeType: "BUY",

          remainingQuantity: {
            $gt: 0,
          },

          status: {
            $in: [
              "COMPLETED",
              "Completed",
            ],
          },
        })
          .sort({
            createdAt: 1,
          })
          .lean();

      const settings =
        await getUsdtSettings();

      const currentPrice =
        toNumber(
          settings.usdtSellPrice
        );

      const data =
        holdings.map(
          (trade) => {
            const qty =
              toNumber(
                trade.remainingQuantity
              );

            return {
              tradeId:
                trade._id,

              quantity: qty,

              buyPrice:
                toNumber(
                  trade.buyPrice
                ),

              currentPrice,

              currentValue:
                Number(
                  (
                    qty *
                    currentPrice
                  ).toFixed(2)
                ),

              createdAt:
                trade.createdAt,
            };
          }
        );

      return res.status(200).json({
        success: true,

        total:
          data.length,

        holdings: data,

        updatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "GET USDT HOLDINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load USDT holdings.",
      });
    }
  }
);

// ======================================================
// GET CURRENT USER HISTORY
// GET /api/usdt/history
// ======================================================

router.get(
  "/history",
  verifyToken,
  async (req, res) => {
    try {
      const page =
        Math.max(
          toNumber(
            req.query.page,
            1
          ),
          1
        );

      const limit =
        Math.min(
          Math.max(
            toNumber(
              req.query.limit,
              20
            ),
            1
          ),
          100
        );

      const skip =
        (page - 1) *
        limit;

      const query = {
        userId:
          req.user.id,
      };

      const total =
        await UsdtTrade.countDocuments(
          query
        );

      const trades =
        await UsdtTrade.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean();

      return res.status(200).json({
        success: true,

        pagination: {
          page,
          limit,
          total,

          totalPages:
            Math.ceil(
              total / limit
            ),
        },

        history:
          trades.map(
            (trade) => ({
              id:
                trade._id,

              tradeType:
                trade.tradeType,

              quantity:
                toNumber(
                  trade.quantity
                ),

              remainingQuantity:
                toNumber(
                  trade.remainingQuantity
                ),

              buyPrice:
                toNumber(
                  trade.buyPrice
                ),

              sellPrice:
                toNumber(
                  trade.sellPrice
                ),

              marketPrice:
                toNumber(
                  trade.marketPrice
                ),

              totalAmount:
                toNumber(
                  trade.totalAmount
                ),

              investedAmount:
                toNumber(
                  trade.investedAmount
                ),

              profitLoss:
                toNumber(
                  trade.profitLoss
                ),

              profitLossPercent:
                toNumber(
                  trade.profitLossPercent
                ),

              status:
                trade.status,

              paymentMethod:
                trade.paymentMethod,

              blockchainNetwork:
                trade.blockchainNetwork,

              referenceId:
                trade.referenceId,

              createdAt:
                trade.createdAt,

              updatedAt:
                trade.updatedAt,
            })
          ),
      });
    } catch (error) {
      console.error(
        "GET USDT HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load USDT history.",
      });
    }
  }
);

// ======================================================
// HISTORY FILTER
// IMPORTANT: BEFORE /history/:username
// GET /api/usdt/history/filter
// ======================================================

router.get(
  "/history/filter",
  verifyToken,
  async (req, res) => {
    try {
      const query = {
        userId:
          req.user.id,
      };

      const {
        start,
        end,
      } = req.query;

      if (start || end) {
        query.createdAt = {};

        if (start) {
          const startDate =
            new Date(start);

          if (
            Number.isNaN(
              startDate.getTime()
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid start date.",
            });
          }

          query.createdAt.$gte =
            startDate;
        }

        if (end) {
          const endDate =
            new Date(end);

          if (
            Number.isNaN(
              endDate.getTime()
            )
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Invalid end date.",
            });
          }

          endDate.setHours(
            23,
            59,
            59,
            999
          );

          query.createdAt.$lte =
            endDate;
        }
      }

      const trades =
        await UsdtTrade.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,

        total:
          trades.length,

        history:
          trades,
      });
    } catch (error) {
      console.error(
        "FILTER USDT HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to filter USDT history.",
      });
    }
  }
);

// ======================================================
// HISTORY SEARCH
// GET /api/usdt/history/search
// ======================================================

router.get(
  "/history/search",
  verifyToken,
  async (req, res) => {
    try {
      const {
        type,
        status,
        reference,
      } = req.query;

      const query = {
        userId:
          req.user.id,
      };

      if (type) {
        query.tradeType =
          String(type)
            .trim()
            .toUpperCase();
      }

      if (status) {
        query.status =
          String(status)
            .trim()
            .toUpperCase();
      }

      if (reference) {
        query.referenceId = {
          $regex:
            String(reference),
          $options: "i",
        };
      }

      const trades =
        await UsdtTrade.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .lean();

      return res.status(200).json({
        success: true,

        total:
          trades.length,

        history:
          trades,
      });
    } catch (error) {
      console.error(
        "SEARCH USDT HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to search USDT history.",
      });
    }
  }
);

// ======================================================
// HISTORY SUMMARY
// GET /api/usdt/history/summary
// ======================================================

router.get(
  "/history/summary",
  verifyToken,
  async (req, res) => {
    try {
      const trades =
        await UsdtTrade.find({
          userId:
            req.user.id,

          status: {
            $in: [
              "COMPLETED",
              "Completed",
            ],
          },
        }).lean();

      let totalBuy = 0;
      let totalSell = 0;
      let totalInvested = 0;
      let totalReceived = 0;
      let totalProfit = 0;

      trades.forEach(
        (trade) => {
          if (
            trade.tradeType ===
            "BUY"
          ) {
            totalBuy +=
              toNumber(
                trade.quantity
              );

            totalInvested +=
              toNumber(
                trade.totalAmount
              );
          }

          if (
            trade.tradeType ===
            "SELL"
          ) {
            totalSell +=
              toNumber(
                trade.quantity
              );

            totalReceived +=
              toNumber(
                trade.totalAmount
              );

            totalProfit +=
              toNumber(
                trade.profitLoss
              );
          }
        }
      );

      return res.status(200).json({
        success: true,

        summary: {
          totalTrades:
            trades.length,

          totalBuyUSDT:
            Number(
              totalBuy.toFixed(6)
            ),

          totalSellUSDT:
            Number(
              totalSell.toFixed(6)
            ),

          investedAmount:
            Number(
              totalInvested.toFixed(2)
            ),

          receivedAmount:
            Number(
              totalReceived.toFixed(2)
            ),

          profitLoss:
            Number(
              totalProfit.toFixed(2)
            ),

          profitLossPercent:
            totalInvested > 0
              ? Number(
                  (
                    (totalProfit /
                      totalInvested) *
                    100
                  ).toFixed(2)
                )
              : 0,
        },

        generatedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "USDT HISTORY SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load USDT summary.",
      });
    }
  }
);
// ======================================================
// HISTORY BY USERNAME
// GET /api/usdt/history/:username
// ======================================================

router.get(
  "/history/:username",
  verifyToken,
  async (req, res) => {
    try {
      const username =
        String(
          req.params.username || ""
        )
          .trim()
          .toLowerCase();

      if (!username) {
        return res.status(400).json({
          success: false,
          message:
            "Username is required.",
        });
      }

      const currentUsername =
        String(
          req.user.username || ""
        ).toLowerCase();

      if (
        req.user.role !== "admin" &&
        currentUsername !== username
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      const user =
        await User.findOne({
          username,
        })
          .select(
            "_id username email role"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const page =
        Math.max(
          toNumber(
            req.query.page,
            1
          ),
          1
        );

      const limit =
        Math.min(
          Math.max(
            toNumber(
              req.query.limit,
              20
            ),
            1
          ),
          100
        );

      const skip =
        (page - 1) *
        limit;

      const query = {
        userId:
          user._id,
      };

      const total =
        await UsdtTrade.countDocuments(
          query
        );

      const trades =
        await UsdtTrade.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean();

      return res.status(200).json({
        success: true,

        username:
          user.username,

        pagination: {
          page,
          limit,
          total,

          totalPages:
            Math.ceil(
              total / limit
            ),
        },

        history:
          trades,
      });
    } catch (error) {
      console.error(
        "GET USER USDT HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load user USDT history.",
      });
    }
  }
);

// ======================================================
// RECENT USDT TRADES
// GET /api/usdt/recent
// ======================================================

router.get(
  "/recent",
  verifyToken,
  async (req, res) => {
    try {
      const limit =
        Math.min(
          Math.max(
            toNumber(
              req.query.limit,
              10
            ),
            1
          ),
          50
        );

      const trades =
        await UsdtTrade.find({
          userId:
            req.user.id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      return res.status(200).json({
        success: true,

        total:
          trades.length,

        recentTrades:
          trades,
      });
    } catch (error) {
      console.error(
        "GET RECENT USDT TRADES ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load recent trades.",
      });
    }
  }
);

// ======================================================
// ACTIVITY
// GET /api/usdt/activity
// ======================================================

router.get(
  "/activity",
  verifyToken,
  async (req, res) => {
    try {
      const trades =
        await UsdtTrade.find({
          userId:
            req.user.id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(15)
          .lean();

      const activity =
        trades.map(
          (trade) => ({
            id:
              trade._id,

            type:
              trade.tradeType,

            quantity:
              toNumber(
                trade.quantity
              ),

            amount:
              toNumber(
                trade.totalAmount
              ),

            status:
              trade.status,

            note:
              trade.note || "",

            createdAt:
              trade.createdAt,
          })
        );

      return res.status(200).json({
        success: true,

        total:
          activity.length,

        activity,
      });
    } catch (error) {
      console.error(
        "USDT ACTIVITY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load activity feed.",
      });
    }
  }
);

// ======================================================
// REFRESH USER PORTFOLIO
// GET /api/usdt/refresh
// ======================================================

router.get(
  "/refresh",
  verifyToken,
  async (req, res) => {
    try {
      const wallet =
        await Wallet.findOne({
          userId:
            req.user.id,
        }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message:
            "Wallet not found.",
        });
      }

      const settings =
        await getUsdtSettings();

      const sellPrice =
        toNumber(
          settings.usdtSellPrice
        );

      const portfolioValue =
        Number(
          (
            toNumber(
              wallet.usdtBalance
            ) *
            sellPrice
          ).toFixed(2)
        );

      return res.status(200).json({
        success: true,

        wallet: {
          pkrBalance:
            toNumber(
              wallet.pkrBalance
            ),

          usdtBalance:
            toNumber(
              wallet.usdtBalance
            ),

          goldBalance:
            toNumber(
              wallet.goldBalance
            ),

          portfolioValue,

          liveProfit:
            toNumber(
              wallet.liveProfit
            ),

          liveProfitPercent:
            toNumber(
              wallet.liveProfitPercent
            ),
        },

        market: {
          buyPrice:
            toNumber(
              settings.usdtBuyPrice
            ),

          sellPrice,

          marketStatus:
            normalizeMarketStatus(
              settings.marketStatus
            ),

          tradingEnabled:
            Boolean(
              settings.usdtTradingEnabled
            ),
        },

        refreshedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "REFRESH USDT PORTFOLIO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to refresh portfolio.",
      });
    }
  }
);

// ======================================================
// ADMIN REFRESH USER PORTFOLIO
// GET /api/usdt/admin/refresh/:username
// ======================================================

router.get(
  "/admin/refresh/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username =
        String(
          req.params.username || ""
        )
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          username,
        })
          .select(
            "_id username"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      const wallet =
        await Wallet.findOne({
          userId:
            user._id,
        }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message:
            "Wallet not found.",
        });
      }

      const settings =
        await getUsdtSettings();

      const sellPrice =
        toNumber(
          settings.usdtSellPrice
        );

      const portfolioValue =
        Number(
          (
            toNumber(
              wallet.usdtBalance
            ) *
            sellPrice
          ).toFixed(2)
        );

      return res.status(200).json({
        success: true,

        username,

        wallet: {
          pkrBalance:
            toNumber(
              wallet.pkrBalance
            ),

          usdtBalance:
            toNumber(
              wallet.usdtBalance
            ),

          goldBalance:
            toNumber(
              wallet.goldBalance
            ),

          portfolioValue,

          liveProfit:
            toNumber(
              wallet.liveProfit
            ),

          liveProfitPercent:
            toNumber(
              wallet.liveProfitPercent
            ),
        },

        refreshedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "ADMIN REFRESH USDT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to refresh user portfolio.",
      });
    }
  }
);

// ======================================================
// DEBUG
// GET /api/usdt/debug
// ======================================================

router.get(
  "/debug",
  verifyToken,
  async (req, res) => {
    try {
      const [
        wallet,
        tradeCount,
        transactionCount,
      ] = await Promise.all([
        Wallet.findOne({
          userId:
            req.user.id,
        }).lean(),

        UsdtTrade.countDocuments({
          userId:
            req.user.id,
        }),

        Transaction.countDocuments({
          userId:
            req.user.id,

          walletType:
            "USDT",
        }),
      ]);

      return res.status(200).json({
        success: true,

        diagnostics: {
          module:
            "USDT Trading API V18",

          userId:
            req.user.id,

          username:
            req.user.username,

          walletExists:
            Boolean(wallet),

          wallet: wallet
            ? {
                pkrBalance:
                  toNumber(
                    wallet.pkrBalance
                  ),

                usdtBalance:
                  toNumber(
                    wallet.usdtBalance
                  ),

                goldBalance:
                  toNumber(
                    wallet.goldBalance
                  ),
              }
            : null,

          totalTrades:
            tradeCount,

          totalTransactions:
            transactionCount,
        },

        serverTime:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "USDT DEBUG ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Diagnostics failed.",
      });
    }
  }
);// ======================================================
// HISTORY BY USERNAME
// GET /api/usdt/history/:username
// ======================================================

router.get(
  "/history/:username",
  verifyToken,
  async (req, res) => {
    try {
      const username =
        String(
          req.params.username || ""
        )
          .trim()
          .toLowerCase();

      if (!username) {
        return res.status(400).json({
          success: false,
          message:
            "Username is required.",
        });
      }

      const currentUsername =
        String(
          req.user.username || ""
        ).toLowerCase();

      if (
        req.user.role !== "admin" &&
        currentUsername !== username
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied.",
        });
      }

      const user =
        await User.findOne({
          username,
        })
          .select(
            "_id username email role"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const page =
        Math.max(
          toNumber(
            req.query.page,
            1
          ),
          1
        );

      const limit =
        Math.min(
          Math.max(
            toNumber(
              req.query.limit,
              20
            ),
            1
          ),
          100
        );

      const skip =
        (page - 1) *
        limit;

      const query = {
        userId:
          user._id,
      };

      const total =
        await UsdtTrade.countDocuments(
          query
        );

      const trades =
        await UsdtTrade.find(
          query
        )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean();

      return res.status(200).json({
        success: true,

        username:
          user.username,

        pagination: {
          page,
          limit,
          total,

          totalPages:
            Math.ceil(
              total / limit
            ),
        },

        history:
          trades,
      });
    } catch (error) {
      console.error(
        "GET USER USDT HISTORY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load user USDT history.",
      });
    }
  }
);

// ======================================================
// RECENT USDT TRADES
// GET /api/usdt/recent
// ======================================================

router.get(
  "/recent",
  verifyToken,
  async (req, res) => {
    try {
      const limit =
        Math.min(
          Math.max(
            toNumber(
              req.query.limit,
              10
            ),
            1
          ),
          50
        );

      const trades =
        await UsdtTrade.find({
          userId:
            req.user.id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(limit)
          .lean();

      return res.status(200).json({
        success: true,

        total:
          trades.length,

        recentTrades:
          trades,
      });
    } catch (error) {
      console.error(
        "GET RECENT USDT TRADES ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load recent trades.",
      });
    }
  }
);

// ======================================================
// ACTIVITY
// GET /api/usdt/activity
// ======================================================

router.get(
  "/activity",
  verifyToken,
  async (req, res) => {
    try {
      const trades =
        await UsdtTrade.find({
          userId:
            req.user.id,
        })
          .sort({
            createdAt: -1,
          })
          .limit(15)
          .lean();

      const activity =
        trades.map(
          (trade) => ({
            id:
              trade._id,

            type:
              trade.tradeType,

            quantity:
              toNumber(
                trade.quantity
              ),

            amount:
              toNumber(
                trade.totalAmount
              ),

            status:
              trade.status,

            note:
              trade.note || "",

            createdAt:
              trade.createdAt,
          })
        );

      return res.status(200).json({
        success: true,

        total:
          activity.length,

        activity,
      });
    } catch (error) {
      console.error(
        "USDT ACTIVITY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load activity feed.",
      });
    }
  }
);

// ======================================================
// REFRESH USER PORTFOLIO
// GET /api/usdt/refresh
// ======================================================

router.get(
  "/refresh",
  verifyToken,
  async (req, res) => {
    try {
      const wallet =
        await Wallet.findOne({
          userId:
            req.user.id,
        }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message:
            "Wallet not found.",
        });
      }

      const settings =
        await getUsdtSettings();

      const sellPrice =
        toNumber(
          settings.usdtSellPrice
        );

      const portfolioValue =
        Number(
          (
            toNumber(
              wallet.usdtBalance
            ) *
            sellPrice
          ).toFixed(2)
        );

      return res.status(200).json({
        success: true,

        wallet: {
          pkrBalance:
            toNumber(
              wallet.pkrBalance
            ),

          usdtBalance:
            toNumber(
              wallet.usdtBalance
            ),

          goldBalance:
            toNumber(
              wallet.goldBalance
            ),

          portfolioValue,

          liveProfit:
            toNumber(
              wallet.liveProfit
            ),

          liveProfitPercent:
            toNumber(
              wallet.liveProfitPercent
            ),
        },

        market: {
          buyPrice:
            toNumber(
              settings.usdtBuyPrice
            ),

          sellPrice,

          marketStatus:
            normalizeMarketStatus(
              settings.marketStatus
            ),

          tradingEnabled:
            Boolean(
              settings.usdtTradingEnabled
            ),
        },

        refreshedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "REFRESH USDT PORTFOLIO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to refresh portfolio.",
      });
    }
  }
);

// ======================================================
// ADMIN REFRESH USER PORTFOLIO
// GET /api/usdt/admin/refresh/:username
// ======================================================

router.get(
  "/admin/refresh/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username =
        String(
          req.params.username || ""
        )
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          username,
        })
          .select(
            "_id username"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      const wallet =
        await Wallet.findOne({
          userId:
            user._id,
        }).lean();

      if (!wallet) {
        return res.status(404).json({
          success: false,
          message:
            "Wallet not found.",
        });
      }

      const settings =
        await getUsdtSettings();

      const sellPrice =
        toNumber(
          settings.usdtSellPrice
        );

      const portfolioValue =
        Number(
          (
            toNumber(
              wallet.usdtBalance
            ) *
            sellPrice
          ).toFixed(2)
        );

      return res.status(200).json({
        success: true,

        username,

        wallet: {
          pkrBalance:
            toNumber(
              wallet.pkrBalance
            ),

          usdtBalance:
            toNumber(
              wallet.usdtBalance
            ),

          goldBalance:
            toNumber(
              wallet.goldBalance
            ),

          portfolioValue,

          liveProfit:
            toNumber(
              wallet.liveProfit
            ),

          liveProfitPercent:
            toNumber(
              wallet.liveProfitPercent
            ),
        },

        refreshedAt:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "ADMIN REFRESH USDT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to refresh user portfolio.",
      });
    }
  }
);

// ======================================================
// DEBUG
// GET /api/usdt/debug
// ======================================================

router.get(
  "/debug",
  verifyToken,
  async (req, res) => {
    try {
      const [
        wallet,
        tradeCount,
        transactionCount,
      ] = await Promise.all([
        Wallet.findOne({
          userId:
            req.user.id,
        }).lean(),

        UsdtTrade.countDocuments({
          userId:
            req.user.id,
        }),

        Transaction.countDocuments({
          userId:
            req.user.id,

          walletType:
            "USDT",
        }),
      ]);

      return res.status(200).json({
        success: true,

        diagnostics: {
          module:
            "USDT Trading API V18",

          userId:
            req.user.id,

          username:
            req.user.username,

          walletExists:
            Boolean(wallet),

          wallet: wallet
            ? {
                pkrBalance:
                  toNumber(
                    wallet.pkrBalance
                  ),

                usdtBalance:
                  toNumber(
                    wallet.usdtBalance
                  ),

                goldBalance:
                  toNumber(
                    wallet.goldBalance
                  ),
              }
            : null,

          totalTrades:
            tradeCount,

          totalTransactions:
            transactionCount,
        },

        serverTime:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "USDT DEBUG ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Diagnostics failed.",
      });
    }
  }
);
// ======================================================
// ADMIN GET USDT SETTINGS
// GET /api/usdt/settings
// ======================================================

router.get(
  "/settings",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await getUsdtSettings();

      return res.status(200).json({
        success: true,

        settings:
          buildUsdtSettingsResponse(
            settings
          ),
      });
    } catch (error) {
      console.error(
        "GET USDT SETTINGS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load USDT settings.",
      });
    }
  }
);

// ======================================================
// ADMIN UPDATE USDT SETTINGS
// PATCH /api/usdt/settings
// PUT /api/usdt/settings
// ======================================================

const updateUsdtSettings = async (
  req,
  res
) => {
  try {
    const settings =
      await getUsdtSettings();

    // ==================================================
    // ACCEPT BOTH FRONTEND + BACKEND FIELD NAMES
    // ==================================================

    const buyPrice =
      req.body.buyPrice !== undefined
        ? toNumber(
            req.body.buyPrice
          )
        : req.body.usdtBuyPrice !==
          undefined
        ? toNumber(
            req.body.usdtBuyPrice
          )
        : toNumber(
            settings.usdtBuyPrice
          );

    const sellPrice =
      req.body.sellPrice !== undefined
        ? toNumber(
            req.body.sellPrice
          )
        : req.body.usdtSellPrice !==
          undefined
        ? toNumber(
            req.body.usdtSellPrice
          )
        : toNumber(
            settings.usdtSellPrice
          );

    const usdtPriceUSD =
      req.body.usdtPriceUSD !==
      undefined
        ? toNumber(
            req.body.usdtPriceUSD
          )
        : toNumber(
            settings.usdtPriceUSD,
            1
          );

    const usdToPkr =
      req.body.usdToPkr !==
      undefined
        ? toNumber(
            req.body.usdToPkr
          )
        : toNumber(
            settings.usdToPkr
          );

    const tradingEnabled =
      req.body.tradingEnabled !==
      undefined
        ? toBoolean(
            req.body.tradingEnabled
          )
        : req.body.usdtTradingEnabled !==
          undefined
        ? toBoolean(
            req.body.usdtTradingEnabled
          )
        : Boolean(
            settings.usdtTradingEnabled
          );

    const marketStatus =
      req.body.marketStatus !==
      undefined
        ? normalizeMarketStatus(
            req.body.marketStatus
          )
        : normalizeMarketStatus(
            settings.marketStatus
          );

    const minimumBuy =
      req.body.minimumBuy !==
      undefined
        ? toNumber(
            req.body.minimumBuy
          )
        : toNumber(
            settings.minimumBuy,
            10
          );

    const minimumSell =
      req.body.minimumSell !==
      undefined
        ? toNumber(
            req.body.minimumSell
          )
        : toNumber(
            settings.minimumSell,
            10
          );

    const maximumBuy =
      req.body.maximumBuy !==
      undefined
        ? toNumber(
            req.body.maximumBuy
          )
        : toNumber(
            settings.maximumBuy,
            100000
          );

    const maximumSell =
      req.body.maximumSell !==
      undefined
        ? toNumber(
            req.body.maximumSell
          )
        : toNumber(
            settings.maximumSell,
            100000
          );

    const network =
      req.body.network !==
      undefined
        ? normalizeNetwork(
            req.body.network
          )
        : normalizeNetwork(
            settings.network
          );

    const walletAddress =
      req.body.walletAddress !==
      undefined
        ? String(
            req.body.walletAddress ||
              ""
          ).trim()
        : String(
            settings.walletAddress ||
              ""
          );

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !Number.isFinite(
        buyPrice
      ) ||
      buyPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Buy price must be greater than 0.",
      });
    }

    if (
      !Number.isFinite(
        sellPrice
      ) ||
      sellPrice <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sell price must be greater than 0.",
      });
    }

    if (
      sellPrice >= buyPrice
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Sell price must be lower than buy price.",
      });
    }

    const spread =
      buyPrice - sellPrice;

    if (
      spread < 0.5
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum USDT spread is 0.50 PKR.",
      });
    }

    if (
      !Number.isFinite(
        usdtPriceUSD
      ) ||
      usdtPriceUSD <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "USDT USD price must be greater than 0.",
      });
    }

    if (
      !Number.isFinite(
        usdToPkr
      ) ||
      usdToPkr <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "USD to PKR rate must be greater than 0.",
      });
    }

    if (
      minimumBuy <= 0 ||
      minimumSell <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Minimum trading limits must be greater than 0.",
      });
    }

    if (
      maximumBuy <
      minimumBuy
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum buy cannot be lower than minimum buy.",
      });
    }

    if (
      maximumSell <
      minimumSell
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Maximum sell cannot be lower than minimum sell.",
      });
    }

    // ==================================================
    // SAVE
    // ==================================================

    settings.usdtBuyPrice =
      buyPrice;

    settings.usdtSellPrice =
      sellPrice;

    settings.usdtPriceUSD =
      usdtPriceUSD;

    settings.usdToPkr =
      usdToPkr;

    settings.usdtTradingEnabled =
      tradingEnabled;

    settings.marketStatus =
      marketStatus;

    settings.minimumBuy =
      minimumBuy;

    settings.minimumSell =
      minimumSell;

    settings.maximumBuy =
      maximumBuy;

    settings.maximumSell =
      maximumSell;

    settings.network =
      network;

    settings.walletAddress =
      walletAddress;

    settings.updatedBy =
      req.user.id;

    settings.updatedByUsername =
      req.user.username;

    await settings.save();

    return res.status(200).json({
      success: true,

      message:
        "USDT settings updated successfully.",

      settings:
        buildUsdtSettingsResponse(
          settings
        ),
    });
  } catch (error) {
    console.error(
      "UPDATE USDT SETTINGS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update USDT settings.",
    });
  }
};

router.patch(
  "/settings",
  verifyToken,
  isAdmin,
  updateUsdtSettings
);

router.put(
  "/settings",
  verifyToken,
  isAdmin,
  updateUsdtSettings
);

// ======================================================
// ADMIN MARKET STATUS
// PATCH /api/usdt/market
// ======================================================

router.patch(
  "/market",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const status =
        normalizeMarketStatus(
          req.body.marketStatus
        );

      const settings =
        await getUsdtSettings();

      settings.marketStatus =
        status;

      settings.updatedBy =
        req.user.id;

      settings.updatedByUsername =
        req.user.username;

      await settings.save();

      return res.status(200).json({
        success: true,

        message:
          `USDT market is now ${status}.`,

        marketStatus:
          status,

        updatedAt:
          settings.updatedAt,
      });
    } catch (error) {
      console.error(
        "UPDATE USDT MARKET ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update market status.",
      });
    }
  }
);

// ======================================================
// ADMIN TRADING STATUS
// PATCH /api/usdt/trading
// ======================================================

router.patch(
  "/trading",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      if (
        typeof req.body.enabled !==
        "boolean"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "enabled must be true or false.",
        });
      }

      const settings =
        await getUsdtSettings();

      settings.usdtTradingEnabled =
        req.body.enabled;

      settings.updatedBy =
        req.user.id;

      settings.updatedByUsername =
        req.user.username;

      await settings.save();

      return res.status(200).json({
        success: true,

        message:
          req.body.enabled
            ? "USDT trading enabled successfully."
            : "USDT trading disabled successfully.",

        tradingEnabled:
          settings.usdtTradingEnabled,

        updatedAt:
          settings.updatedAt,
      });
    } catch (error) {
      console.error(
        "UPDATE USDT TRADING ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update trading status.",
      });
    }
  }
);

// ======================================================
// QUICK PRICE UPDATE
// PATCH /api/usdt/price
// ======================================================

router.patch(
  "/price",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const settings =
        await getUsdtSettings();

      if (
        req.body.buyPrice !==
        undefined
      ) {
        settings.usdtBuyPrice =
          toNumber(
            req.body.buyPrice
          );
      }

      if (
        req.body.sellPrice !==
        undefined
      ) {
        settings.usdtSellPrice =
          toNumber(
            req.body.sellPrice
          );
      }

      if (
        settings.usdtBuyPrice <= 0 ||
        settings.usdtSellPrice <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Prices must be greater than 0.",
        });
      }

      if (
        settings.usdtSellPrice >=
        settings.usdtBuyPrice
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Sell price must be lower than buy price.",
        });
      }

      settings.updatedBy =
        req.user.id;

      settings.updatedByUsername =
        req.user.username;

      await settings.save();

      return res.status(200).json({
        success: true,

        message:
          "USDT market prices updated successfully.",

        prices: {
          buyPrice:
            settings.usdtBuyPrice,

          sellPrice:
            settings.usdtSellPrice,

          spread:
            Number(
              (
                settings.usdtBuyPrice -
                settings.usdtSellPrice
              ).toFixed(2)
            ),
        },

        updatedAt:
          settings.updatedAt,
      });
    } catch (error) {
      console.error(
        "UPDATE USDT PRICE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update USDT prices.",
      });
    }
  }
);

// ======================================================
// ADMIN DASHBOARD
// GET /api/usdt/admin/dashboard
// ======================================================

router.get(
  "/admin/dashboard",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalWallets,
        totalTrades,
        completedTrades,
        pendingTrades,
        cancelledTrades,
        wallets,
        recentTrades,
        settings,
      ] = await Promise.all([
        User.countDocuments({}),

        Wallet.countDocuments({}),

        UsdtTrade.countDocuments({}),

        UsdtTrade.countDocuments({
          status: {
            $in: [
              "COMPLETED",
              "Completed",
            ],
          },
        }),

        UsdtTrade.countDocuments({
          status: "PENDING",
        }),

        UsdtTrade.countDocuments({
          status: "CANCELLED",
        }),

        Wallet.find({})
          .select(
            "usdtBalance pkrBalance portfolioValue liveProfit"
          )
          .lean(),

        UsdtTrade.find({})
          .sort({
            createdAt: -1,
          })
          .limit(10)
          .lean(),

        getUsdtSettings(),
      ]);

      let totalUsdtBalance = 0;
      let totalPkrBalance = 0;
      let totalPortfolioValue = 0;
      let totalLiveProfit = 0;

      wallets.forEach(
        (wallet) => {
          totalUsdtBalance +=
            toNumber(
              wallet.usdtBalance
            );

          totalPkrBalance +=
            toNumber(
              wallet.pkrBalance
            );

          totalPortfolioValue +=
            toNumber(
              wallet.portfolioValue
            );

          totalLiveProfit +=
            toNumber(
              wallet.liveProfit
            );
        }
      );

      let totalBuyVolume = 0;
      let totalSellVolume = 0;
      let totalProfit = 0;

      recentTrades.forEach(
        (trade) => {
          if (
            trade.tradeType ===
            "BUY"
          ) {
            totalBuyVolume +=
              toNumber(
                trade.totalAmount
              );
          }

          if (
            trade.tradeType ===
            "SELL"
          ) {
            totalSellVolume +=
              toNumber(
                trade.totalAmount
              );
          }

          totalProfit +=
            toNumber(
              trade.profitLoss
            );
        }
      );

      const usdtSettings =
        buildUsdtSettingsResponse(
          settings
        );

      return res.status(200).json({
        success: true,

        dashboard: {
          totalUsers,
          totalWallets,

          totalTrades,
          completedTrades,
          pendingTrades,
          cancelledTrades,

          totalUsdtBalance:
            Number(
              totalUsdtBalance.toFixed(
                6
              )
            ),

          totalPkrBalance:
            Number(
              totalPkrBalance.toFixed(
                2
              )
            ),

          totalPortfolioValue:
            Number(
              totalPortfolioValue.toFixed(
                2
              )
            ),

          totalLiveProfit:
            Number(
              totalLiveProfit.toFixed(
                2
              )
            ),

          totalBuyVolume:
            Number(
              totalBuyVolume.toFixed(
                2
              )
            ),

          totalSellVolume:
            Number(
              totalSellVolume.toFixed(
                2
              )
            ),

          totalProfit:
            Number(
              totalProfit.toFixed(
                2
              )
            ),

          buyPrice:
            usdtSettings.buyPrice,

          sellPrice:
            usdtSettings.sellPrice,

          spread:
            usdtSettings.spread,

          marketStatus:
            usdtSettings.marketStatus,

          tradingEnabled:
            usdtSettings.tradingEnabled,
        },

        // Compatibility
        settings:
          usdtSettings,

        recentTrades,

        serverTime:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        "ADMIN USDT DASHBOARD ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load admin dashboard.",
      });
    }
  }
);

// ======================================================
// ADMIN ANALYTICS
// GET /api/usdt/admin/analytics
// ======================================================

router.get(
  "/admin/analytics",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const trades =
        await UsdtTrade.find({
          status: {
            $in: [
              "COMPLETED",
              "Completed",
            ],
          },
        }).lean();

      let buyVolume = 0;
      let sellVolume = 0;
      let totalProfit = 0;

      const monthlyMap = {};

      trades.forEach(
        (trade) => {
          const date =
            new Date(
              trade.createdAt
            );

          const month =
            Number.isNaN(
              date.getTime()
            )
              ? "UNKNOWN"
              : date
                  .toISOString()
                  .slice(0, 7);

          if (!monthlyMap[month]) {
            monthlyMap[month] = {
              month,

              buyVolume: 0,
              sellVolume: 0,

              profit: 0,
              trades: 0,
            };
          }

          monthlyMap[
            month
          ].trades += 1;

          monthlyMap[
            month
          ].profit +=
            toNumber(
              trade.profitLoss
            );

          if (
            trade.tradeType ===
            "BUY"
          ) {
            const amount =
              toNumber(
                trade.totalAmount
              );

            buyVolume +=
              amount;

            monthlyMap[
              month
            ].buyVolume +=
              amount;
          }

          if (
            trade.tradeType ===
            "SELL"
          ) {
            const amount =
              toNumber(
                trade.totalAmount
              );

            sellVolume +=
              amount;

            monthlyMap[
              month
            ].sellVolume +=
              amount;
          }

          totalProfit +=
            toNumber(
              trade.profitLoss
            );
        }
      );

      const monthlyAnalytics =
        Object.values(
          monthlyMap
        ).sort(
          (a, b) =>
            a.month.localeCompare(
              b.month
            )
        );

      return res.status(200).json({
        success: true,

        analytics: {
          totalTrades:
            trades.length,

          buyVolume:
            Number(
              buyVolume.toFixed(2)
            ),

          sellVolume:
            Number(
              sellVolume.toFixed(2)
            ),

          totalVolume:
            Number(
              (
                buyVolume +
                sellVolume
              ).toFixed(2)
            ),

          totalProfit:
            Number(
              totalProfit.toFixed(2)
            ),

          averageProfit:
            trades.length > 0
              ? Number(
                  (
                    totalProfit /
                    trades.length
                  ).toFixed(2)
                )
              : 0,

          monthlyAnalytics,
        },
      });
    } catch (error) {
      console.error(
        "ADMIN ANALYTICS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load analytics.",
      });
    }
  }
);
// ======================================================
// ADMIN TOP TRADERS
// GET /api/usdt/admin/top-traders
// ======================================================

router.get(
  "/admin/top-traders",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const traders =
        await UsdtTrade.aggregate([
          {
            $match: {
              status: {
                $in: [
                  "COMPLETED",
                  "Completed",
                ],
              },
            },
          },

          {
            $group: {
              _id: "$username",

              totalTrades: {
                $sum: 1,
              },

              totalBuyVolume: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$tradeType",
                        "BUY",
                      ],
                    },

                    "$totalAmount",

                    0,
                  ],
                },
              },

              totalSellVolume: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$tradeType",
                        "SELL",
                      ],
                    },

                    "$totalAmount",

                    0,
                  ],
                },
              },

              totalProfit: {
                $sum: "$profitLoss",
              },

              totalUsdt: {
                $sum: "$quantity",
              },
            },
          },

          {
            $sort: {
              totalProfit: -1,
            },
          },

          {
            $limit: 20,
          },
        ]);

      return res.status(200).json({
        success: true,

        total:
          traders.length,

        traders:
          traders.map(
            (trader, index) => ({
              rank:
                index + 1,

              username:
                trader._id,

              totalTrades:
                trader.totalTrades,

              totalBuyVolume:
                Number(
                  toNumber(
                    trader.totalBuyVolume
                  ).toFixed(2)
                ),

              totalSellVolume:
                Number(
                  toNumber(
                    trader.totalSellVolume
                  ).toFixed(2)
                ),

              totalProfit:
                Number(
                  toNumber(
                    trader.totalProfit
                  ).toFixed(2)
                ),

              totalUsdt:
                Number(
                  toNumber(
                    trader.totalUsdt
                  ).toFixed(6)
                ),
            })
          ),
      });
    } catch (error) {
      console.error(
        "TOP TRADERS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load top traders.",
      });
    }
  }
);

// ======================================================
// ADMIN USER SUMMARY
// GET /api/usdt/admin/user-summary/:username
// ======================================================

router.get(
  "/admin/user-summary/:username",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const username =
        String(
          req.params.username || ""
        )
          .trim()
          .toLowerCase();

      const user =
        await User.findOne({
          username,
        })
          .select(
            "_id username email role createdAt"
          )
          .lean();

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });
      }

      const [
        wallet,
        trades,
      ] = await Promise.all([
        Wallet.findOne({
          userId:
            user._id,
        }).lean(),

        UsdtTrade.find({
          userId:
            user._id,
        })
          .sort({
            createdAt: -1,
          })
          .lean(),
      ]);

      let buyTrades = 0;
      let sellTrades = 0;

      let investedAmount = 0;
      let receivedAmount = 0;
      let totalProfit = 0;

      trades.forEach(
        (trade) => {
          if (
            trade.tradeType ===
            "BUY"
          ) {
            buyTrades++;

            investedAmount +=
              toNumber(
                trade.totalAmount
              );
          }

          if (
            trade.tradeType ===
            "SELL"
          ) {
            sellTrades++;

            receivedAmount +=
              toNumber(
                trade.totalAmount
              );

            totalProfit +=
              toNumber(
                trade.profitLoss
              );
          }
        }
      );

      return res.status(200).json({
        success: true,

        user: {
          username:
            user.username,

          email:
            user.email,

          role:
            user.role,

          joinedAt:
            user.createdAt,
        },

        wallet: wallet
          ? {
              pkrBalance:
                toNumber(
                  wallet.pkrBalance
                ),

              usdtBalance:
                toNumber(
                  wallet.usdtBalance
                ),

              goldBalance:
                toNumber(
                  wallet.goldBalance
                ),

              portfolioValue:
                toNumber(
                  wallet.portfolioValue
                ),

              liveProfit:
                toNumber(
                  wallet.liveProfit
                ),
            }
          : null,

        statistics: {
          totalTrades:
            trades.length,

          buyTrades,

          sellTrades,

          investedAmount:
            Number(
              investedAmount.toFixed(
                2
              )
            ),

          receivedAmount:
            Number(
              receivedAmount.toFixed(
                2
              )
            ),

          totalProfit:
            Number(
              totalProfit.toFixed(
                2
              )
            ),

          profitPercent:
            investedAmount > 0
              ? Number(
                  (
                    (totalProfit /
                      investedAmount) *
                    100
                  ).toFixed(2)
                )
              : 0,
        },

        recentTrades:
          trades.slice(
            0,
            10
          ),
      });
    } catch (error) {
      console.error(
        "USER SUMMARY ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load user summary.",
      });
    }
  }
);

// ======================================================
// ROUTE LIST
// GET /api/usdt/routes
// ======================================================

router.get(
  "/routes",
  (req, res) => {
    return res.status(200).json({
      success: true,

      module:
        "GoldTrade V18 Enterprise USDT API",

      version:
        "18.0.0",

      routes: [
        // Health
        "GET /api/usdt/health",
        "GET /api/usdt/status",
        "GET /api/usdt/routes",

        // Prices
        "GET /api/usdt/price",
        "GET /api/usdt/rates",

        // Settings
        "GET /api/usdt/settings",
        "PATCH /api/usdt/settings",
        "PUT /api/usdt/settings",

        // Market
        "PATCH /api/usdt/price",
        "PATCH /api/usdt/market",
        "PATCH /api/usdt/trading",

        // Wallet
        "GET /api/usdt/wallet",
        "GET /api/usdt/balance",
        "GET /api/usdt/refresh",

        // Trading
        "POST /api/usdt/buy",
        "POST /api/usdt/sell",

        // Portfolio
        "GET /api/usdt/portfolio",
        "GET /api/usdt/portfolio/:username",
        "GET /api/usdt/holdings",

        // History
        "GET /api/usdt/history",
        "GET /api/usdt/history/filter",
        "GET /api/usdt/history/search",
        "GET /api/usdt/history/summary",
        "GET /api/usdt/history/:username",
        "GET /api/usdt/recent",
        "GET /api/usdt/activity",

        // Admin
        "GET /api/usdt/admin/dashboard",
        "GET /api/usdt/admin/analytics",
        "GET /api/usdt/admin/top-traders",
        "GET /api/usdt/admin/user-summary/:username",
        "GET /api/usdt/admin/refresh/:username",

        // Debug
        "GET /api/usdt/debug",
      ],

      timestamp:
        new Date().toISOString(),
    });
  }
);

// ======================================================
// ROUTER EXPORT
// ======================================================

module.exports = router;