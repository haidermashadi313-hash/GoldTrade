// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/trade.controller.ts
// SECTION 1/10
// MARKET BUY / SELL ORDER ENGINE
// ======================================================

import { Request, Response } from "express";

// The model declarations in this project do not expose the nested wallet and
// trade fields used by this controller. Keep the controller's model handles
// runtime-compatible while avoiding incorrect compile-time schema inference.
const TradeOrder: any = require("../models/TradeOrder");
const Wallet: any = require("../models/Wallet");
const Portfolio: any = require("../models/Portfolio");
const GoldPrice: any = require("../models/GoldPrice");
const Transaction: any = require("../models/Transaction");

// ======================================================
// TRADING CONFIGURATION
// ======================================================

const TRADE_CONFIG = {
  BUY_FEE_PERCENT: 0.25,
  SELL_FEE_PERCENT: 0.25,
  MIN_GRAMS: 0.01,
  MAX_GRAMS: 1000,
};

// ======================================================
// GENERATE TRADE ORDER ID
// ======================================================

const generateTradeReference = () => {
  const random = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `TRD-${Date.now()}-${random}`;
};

// ======================================================
// GET LIVE MARKET PRICE
// ======================================================

const getMarketPrice = async (
  karat: string,
  currency: string
) => {
  const latest = await GoldPrice.findOne().sort({
    createdAt: -1,
  });

  if (!latest) throw new Error("Live market unavailable.");

  const price = latest.prices[karat]?.[currency];

  if (!price) {
    throw new Error("Unsupported market pair.");
  }

  return price;
};

// ======================================================
// CALCULATE TRADING FEE
// ======================================================

const calculateTradingFee = (
  amount: number,
  side: "BUY" | "SELL"
) => {
  const feePercent =
    side === "BUY"
      ? TRADE_CONFIG.BUY_FEE_PERCENT
      : TRADE_CONFIG.SELL_FEE_PERCENT;

  return Number(((amount * feePercent) / 100).toFixed(2));
};

// ======================================================
// PLACE MARKET BUY ORDER
// POST /api/v1/trade/market-buy
// ======================================================

export const placeMarketBuyOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { karat, currency, grams } = req.body;

    if (
      grams < TRADE_CONFIG.MIN_GRAMS ||
      grams > TRADE_CONFIG.MAX_GRAMS
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid trading quantity.",
      });
    }

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    if (!wallet || !portfolio) {
      return res.status(404).json({
        success: false,
        message: "Wallet or portfolio not found.",
      });
    }

    const marketPrice = await getMarketPrice(
      karat,
      currency
    );

    const tradeValue = Number(
      (marketPrice * grams).toFixed(2)
    );

    const fee = calculateTradingFee(tradeValue, "BUY");
    const totalCost = Number((tradeValue + fee).toFixed(2));

    if (currency === "USDT") {
      if (wallet.cryptoBalances.USDT < totalCost) {
        return res.status(400).json({
          success: false,
          message: "Insufficient USDT balance.",
        });
      }

      wallet.cryptoBalances.USDT -= totalCost;
    } else {
      if (wallet.balances[currency] < totalCost) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${currency} balance.`,
        });
      }

      wallet.balances[currency] -= totalCost;
    }

    wallet.goldBalance.totalGrams += grams;
    wallet.goldBalance.availableGrams += grams;

    portfolio.goldHoldings.totalGrams += grams;
    portfolio.goldHoldings[karat] += grams;

    const reference = generateTradeReference();

    const order = await TradeOrder.create({
      user: req.user.id,
      reference,
      orderType: "MARKET",
      side: "BUY",
      karat,
      currency,
      grams,
      executedPrice: marketPrice,
      tradeValue,
      tradingFee: fee,
      status: "FILLED",
      executedAt: new Date(),
    });

    await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "MARKET_BUY_ORDER",
      providerReference: reference,
      currency,
      amount: totalCost,
      goldKarat: karat,
      goldGrams: grams,
      goldPricePerGram: marketPrice,
      status: "COMPLETED",
      description: "Market Buy Order",
    });

    await wallet.save();
    await portfolio.save();

    return res.status(201).json({
      success: true,
      message: "Market buy order executed.",

      order: {
        reference,
        grams,
        karat,
        marketPrice,
        tradeValue,
        tradingFee: fee,
        totalCost,
        status: "FILLED",
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// PLACE MARKET SELL ORDER
// POST /api/v1/trade/market-sell
// ======================================================

export const placeMarketSellOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { karat, currency, grams } = req.body;

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    if (!wallet || !portfolio) {
      return res.status(404).json({
        success: false,
        message: "Wallet or portfolio not found.",
      });
    }

    if (wallet.goldBalance.availableGrams < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient gold balance.",
      });
    }

    if (portfolio.goldHoldings[karat] < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient holdings.",
      });
    }

    const marketPrice = await getMarketPrice(
      karat,
      currency
    );

    const tradeValue = Number(
      (marketPrice * grams).toFixed(2)
    );

    const fee = calculateTradingFee(tradeValue, "SELL");
    const receiveAmount = Number((tradeValue - fee).toFixed(2));

    wallet.goldBalance.totalGrams -= grams;
    wallet.goldBalance.availableGrams -= grams;

    portfolio.goldHoldings.totalGrams -= grams;
    portfolio.goldHoldings[karat] -= grams;

    if (currency === "USDT") {
      wallet.cryptoBalances.USDT += receiveAmount;
    } else {
      wallet.balances[currency] += receiveAmount;
    }

    const reference = generateTradeReference();

    const order = await TradeOrder.create({
      user: req.user.id,
      reference,
      orderType: "MARKET",
      side: "SELL",
      karat,
      currency,
      grams,
      executedPrice: marketPrice,
      tradeValue,
      tradingFee: fee,
      status: "FILLED",
      executedAt: new Date(),
    });

    await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "MARKET_SELL_ORDER",
      providerReference: reference,
      currency,
      amount: receiveAmount,
      goldKarat: karat,
      goldGrams: grams,
      goldPricePerGram: marketPrice,
      status: "COMPLETED",
      description: "Market Sell Order",
    });

    await wallet.save();
    await portfolio.save();

    return res.json({
      success: true,
      message: "Market sell order executed.",

      order: {
        reference,
        grams,
        karat,
        marketPrice,
        tradeValue,
        tradingFee: fee,
        receiveAmount,
        status: "FILLED",
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// PREVIEW MARKET ORDER
// POST /api/v1/trade/preview
// ======================================================

export const previewMarketOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { side, karat, currency, grams } = req.body;

    const marketPrice = await getMarketPrice(
      karat,
      currency
    );

    const tradeValue = Number(
      (marketPrice * grams).toFixed(2)
    );

    const fee = calculateTradingFee(
      tradeValue,
      side
    );

    return res.json({
      success: true,

      preview: {
        side,
        karat,
        grams,
        currency,
        marketPrice,
        tradeValue,
        tradingFee: fee,

        total:
          side === "BUY"
            ? tradeValue + fee
            : tradeValue - fee,
      },
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET MARKET ORDER HISTORY
// GET /api/v1/trade/market-orders
// ======================================================

export const getMarketOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const orders = await TradeOrder.find({
      user: req.user.id,
      orderType: "MARKET",
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      totalOrders: orders.length,
      orders,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET SINGLE MARKET ORDER
// GET /api/v1/trade/order/:reference
// ======================================================

export const getTradeOrderDetails = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await TradeOrder.findOne({
      reference: req.params.reference,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.json({
      success: true,
      order,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 1/10 END
// ======================================================// ======================================================
// SECTION 2/10 START
// LIMIT ORDER + ORDER BOOK ENGINE
// ======================================================

// ======================================================
// LIMIT ORDER CONFIG
// ======================================================

const LIMIT_ORDER_EXPIRY_DAYS = 30;

// ======================================================
// PLACE LIMIT BUY ORDER
// POST /api/v1/trade/limit-buy
// ======================================================

export const placeLimitBuyOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { karat, currency, grams, targetPrice } = req.body;

    if (!targetPrice || targetPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Target price is required.",
      });
    }

    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const tradeValue = Number((grams * targetPrice).toFixed(2));
    const fee = calculateTradingFee(tradeValue, "BUY");
    const reserveAmount = Number((tradeValue + fee).toFixed(2));

    if (currency === "USDT") {
      if (wallet.cryptoBalances.USDT < reserveAmount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient USDT balance.",
        });
      }

      wallet.cryptoBalances.USDT -= reserveAmount;
    } else {
      if (wallet.balances[currency] < reserveAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${currency} balance.`,
        });
      }

      wallet.balances[currency] -= reserveAmount;
    }

    const reference = generateTradeReference();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + LIMIT_ORDER_EXPIRY_DAYS);

    const order = await TradeOrder.create({
      user: req.user.id,
      reference,
      orderType: "LIMIT",
      side: "BUY",
      karat,
      currency,
      grams,
      targetPrice,
      reservedAmount: reserveAmount,
      remainingGrams: grams,
      filledGrams: 0,
      tradingFee: fee,
      status: "OPEN",
      expiresAt: expiryDate,
      createdAt: new Date(),
    });

    await wallet.save();

    return res.status(201).json({
      success: true,
      message: "Limit buy order placed successfully.",
      order,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// PLACE LIMIT SELL ORDER
// POST /api/v1/trade/limit-sell
// ======================================================

export const placeLimitSellOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { karat, currency, grams, targetPrice } = req.body;

    const wallet = await Wallet.findOne({ user: req.user.id });
    const portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!wallet || !portfolio) {
      return res.status(404).json({
        success: false,
        message: "Wallet or portfolio not found.",
      });
    }

    if (wallet.goldBalance.availableGrams < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient gold balance.",
      });
    }

    if (portfolio.goldHoldings[karat] < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient holdings.",
      });
    }

    wallet.goldBalance.availableGrams -= grams;
    wallet.goldBalance.lockedGrams += grams;

    const reference = generateTradeReference();

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + LIMIT_ORDER_EXPIRY_DAYS);

    const order = await TradeOrder.create({
      user: req.user.id,
      reference,
      orderType: "LIMIT",
      side: "SELL",
      karat,
      currency,
      grams,
      targetPrice,
      remainingGrams: grams,
      filledGrams: 0,
      status: "OPEN",
      expiresAt: expiryDate,
      createdAt: new Date(),
    });

    await wallet.save();

    return res.status(201).json({
      success: true,
      message: "Limit sell order placed successfully.",
      order,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// AUTO EXECUTE LIMIT ORDERS
// INTERNAL MATCHING FUNCTION
// ======================================================

export const executeEligibleLimitOrders = async () => {
  const openOrders = await TradeOrder.find({
    orderType: "LIMIT",
    status: "OPEN",
  });

  for (const order of openOrders) {
    try {
      const currentPrice = await getMarketPrice(
        order.karat,
        order.currency
      );

      const shouldExecute =
        (order.side === "BUY" && currentPrice <= order.targetPrice) ||
        (order.side === "SELL" && currentPrice >= order.targetPrice);

      if (!shouldExecute) continue;

      const wallet = await Wallet.findOne({ user: order.user });
      const portfolio = await Portfolio.findOne({ user: order.user });

      if (!wallet || !portfolio) continue;

      if (order.side === "BUY") {
        wallet.goldBalance.totalGrams += order.remainingGrams;
        wallet.goldBalance.availableGrams += order.remainingGrams;

        portfolio.goldHoldings.totalGrams += order.remainingGrams;
        portfolio.goldHoldings[order.karat] += order.remainingGrams;
      } else {
        wallet.goldBalance.lockedGrams -= order.remainingGrams;
        wallet.goldBalance.totalGrams -= order.remainingGrams;

        const tradeValue = Number(
          (order.remainingGrams * currentPrice).toFixed(2)
        );

        const fee = calculateTradingFee(tradeValue, "SELL");
        const receiveAmount = Number((tradeValue - fee).toFixed(2));

        if (order.currency === "USDT") {
          wallet.cryptoBalances.USDT += receiveAmount;
        } else {
          wallet.balances[order.currency] += receiveAmount;
        }

        portfolio.goldHoldings.totalGrams -= order.remainingGrams;
        portfolio.goldHoldings[order.karat] -= order.remainingGrams;
      }

      order.executedPrice = currentPrice;
      order.filledGrams = order.grams;
      order.remainingGrams = 0;
      order.status = "FILLED";
      order.executedAt = new Date();

      await wallet.save();
      await portfolio.save();
      await order.save();

      await Transaction.create({
        user: order.user,
        wallet: wallet._id,
        transactionType:
          order.side === "BUY"
            ? "LIMIT_BUY_FILLED"
            : "LIMIT_SELL_FILLED",
        providerReference: order.reference,
        currency: order.currency,
        amount: Number(
          (order.grams * currentPrice).toFixed(2)
        ),
        goldKarat: order.karat,
        goldGrams: order.grams,
        goldPricePerGram: currentPrice,
        status: "COMPLETED",
        description: `${order.side} Limit Order Filled`,
      });
    } catch {
      continue;
    }
  }
};

// ======================================================
// CANCEL LIMIT ORDER
// DELETE /api/v1/trade/order/:reference
// ======================================================

export const cancelLimitOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await TradeOrder.findOne({
      reference: req.params.reference,
      user: req.user.id,
      orderType: "LIMIT",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Limit order not found.",
      });
    }

    if (order.status !== "OPEN") {
      return res.status(400).json({
        success: false,
        message: "Only open orders can be cancelled.",
      });
    }

    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (order.side === "BUY") {
      if (order.currency === "USDT") {
        wallet.cryptoBalances.USDT += order.reservedAmount;
      } else {
        wallet.balances[order.currency] += order.reservedAmount;
      }
    } else {
      wallet.goldBalance.availableGrams += order.remainingGrams;
      wallet.goldBalance.lockedGrams -= order.remainingGrams;
    }

    order.status = "CANCELLED";
    order.cancelledAt = new Date();

    await wallet.save();
    await order.save();

    return res.json({
      success: true,
      message: "Limit order cancelled successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET OPEN LIMIT ORDERS
// GET /api/v1/trade/open-orders
// ======================================================

export const getOpenLimitOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const orders = await TradeOrder.find({
      user: req.user.id,
      orderType: "LIMIT",
      status: "OPEN",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      totalOpenOrders: orders.length,
      orders,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET PUBLIC ORDER BOOK
// GET /api/v1/trade/order-book
// ======================================================

export const getOrderBook = async (
  req: Request,
  res: Response
) => {
  try {
    const buyOrders = await TradeOrder.find({
      orderType: "LIMIT",
      side: "BUY",
      status: "OPEN",
    }).sort({ targetPrice: -1 });

    const sellOrders = await TradeOrder.find({
      orderType: "LIMIT",
      side: "SELL",
      status: "OPEN",
    }).sort({ targetPrice: 1 });

    return res.json({
      success: true,
      orderBook: {
        buyOrders,
        sellOrders,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// EXPIRE OLD LIMIT ORDERS
// INTERNAL CLEANUP FUNCTION
// ======================================================

export const expireLimitOrders = async () => {
  const expiredOrders = await TradeOrder.find({
    orderType: "LIMIT",
    status: "OPEN",
    expiresAt: { $lt: new Date() },
  });

  for (const order of expiredOrders) {
    const wallet = await Wallet.findOne({ user: order.user });

    if (!wallet) continue;

    if (order.side === "BUY") {
      if (order.currency === "USDT") {
        wallet.cryptoBalances.USDT += order.reservedAmount;
      } else {
        wallet.balances[order.currency] += order.reservedAmount;
      }
    } else {
      wallet.goldBalance.availableGrams += order.remainingGrams;
      wallet.goldBalance.lockedGrams -= order.remainingGrams;
    }

    order.status = "EXPIRED";
    order.expiredAt = new Date();

    await wallet.save();
    await order.save();
  }

  return expiredOrders.length;
};

// ======================================================
// SECTION 2/10 END
// ======================================================// ======================================================
// SECTION 3/10 START
// STOP LOSS + TAKE PROFIT + TRAILING STOP ENGINE
// ======================================================

// ======================================================
// RISK ORDER CONFIGURATION
// ======================================================

const RISK_ORDER_TYPES = [
  "STOP_LOSS",
  "TAKE_PROFIT",
  "TRAILING_STOP",
];

// ======================================================
// CREATE STOP LOSS ORDER
// POST /api/v1/trade/stop-loss
// ======================================================

export const createStopLossOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { karat, currency, grams, stopPrice } = req.body;

    const wallet = await Wallet.findOne({ user: req.user.id });
    const portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!wallet || !portfolio) {
      return res.status(404).json({
        success: false,
        message: "Wallet or portfolio not found.",
      });
    }

    if (portfolio.goldHoldings[karat] < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient gold holdings.",
      });
    }

    wallet.goldBalance.availableGrams -= grams;
    wallet.goldBalance.lockedGrams += grams;

    const order = await TradeOrder.create({
      user: req.user.id,
      reference: generateTradeReference(),
      orderType: "STOP_LOSS",
      side: "SELL",
      karat,
      currency,
      grams,
      stopPrice,
      remainingGrams: grams,
      status: "OPEN",
      createdAt: new Date(),
    });

    await wallet.save();

    return res.status(201).json({
      success: true,
      message: "Stop-loss order created.",
      order,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CREATE TAKE PROFIT ORDER
// POST /api/v1/trade/take-profit
// ======================================================

export const createTakeProfitOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { karat, currency, grams, targetPrice } = req.body;

    const wallet = await Wallet.findOne({ user: req.user.id });
    const portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!wallet || !portfolio) {
      return res.status(404).json({
        success: false,
        message: "Wallet or portfolio not found.",
      });
    }

    if (portfolio.goldHoldings[karat] < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient holdings.",
      });
    }

    wallet.goldBalance.availableGrams -= grams;
    wallet.goldBalance.lockedGrams += grams;

    const order = await TradeOrder.create({
      user: req.user.id,
      reference: generateTradeReference(),
      orderType: "TAKE_PROFIT",
      side: "SELL",
      karat,
      currency,
      grams,
      targetPrice,
      remainingGrams: grams,
      status: "OPEN",
      createdAt: new Date(),
    });

    await wallet.save();

    return res.status(201).json({
      success: true,
      message: "Take-profit order created.",
      order,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CREATE TRAILING STOP ORDER
// POST /api/v1/trade/trailing-stop
// ======================================================

export const createTrailingStopOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      karat,
      currency,
      grams,
      trailingDistance,
    } = req.body;

    const wallet = await Wallet.findOne({ user: req.user.id });
    const portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!wallet || !portfolio) {
      return res.status(404).json({
        success: false,
        message: "Wallet or portfolio not found.",
      });
    }

    if (portfolio.goldHoldings[karat] < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient holdings.",
      });
    }

    const currentPrice = await getMarketPrice(
      karat,
      currency
    );

    wallet.goldBalance.availableGrams -= grams;
    wallet.goldBalance.lockedGrams += grams;

    const order = await TradeOrder.create({
      user: req.user.id,
      reference: generateTradeReference(),
      orderType: "TRAILING_STOP",
      side: "SELL",
      karat,
      currency,
      grams,
      trailingDistance,
      highestMarketPrice: currentPrice,
      stopPrice: Number(
        (currentPrice - trailingDistance).toFixed(2)
      ),
      remainingGrams: grams,
      status: "OPEN",
      createdAt: new Date(),
    });

    await wallet.save();

    return res.status(201).json({
      success: true,
      message: "Trailing stop created.",
      order,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// EXECUTE RISK ORDERS
// INTERNAL TRIGGER ENGINE
// ======================================================

export const executeRiskOrders = async () => {
  const orders = await TradeOrder.find({
    orderType: {
      $in: RISK_ORDER_TYPES,
    },
    status: "OPEN",
  });

  for (const order of orders) {
    try {
      const currentPrice = await getMarketPrice(
        order.karat,
        order.currency
      );

      let shouldExecute = false;

      // Stop Loss
      if (
        order.orderType === "STOP_LOSS" &&
        currentPrice <= order.stopPrice
      ) {
        shouldExecute = true;
      }

      // Take Profit
      if (
        order.orderType === "TAKE_PROFIT" &&
        currentPrice >= order.targetPrice
      ) {
        shouldExecute = true;
      }

      // Trailing Stop
      if (order.orderType === "TRAILING_STOP") {
        if (currentPrice > order.highestMarketPrice) {
          order.highestMarketPrice = currentPrice;

          order.stopPrice = Number(
            (
              currentPrice - order.trailingDistance
            ).toFixed(2)
          );
        }

        if (currentPrice <= order.stopPrice) {
          shouldExecute = true;
        }
      }

      if (!shouldExecute) {
        await order.save();
        continue;
      }

      const wallet = await Wallet.findOne({
        user: order.user,
      });

      const portfolio = await Portfolio.findOne({
        user: order.user,
      });

      if (!wallet || !portfolio) continue;

      wallet.goldBalance.lockedGrams -= order.remainingGrams;
      wallet.goldBalance.totalGrams -= order.remainingGrams;

      portfolio.goldHoldings.totalGrams -= order.remainingGrams;
      portfolio.goldHoldings[order.karat] -= order.remainingGrams;

      const tradeValue = Number(
        (currentPrice * order.remainingGrams).toFixed(2)
      );

      const fee = calculateTradingFee(
        tradeValue,
        "SELL"
      );

      const receiveAmount = Number(
        (tradeValue - fee).toFixed(2)
      );

      if (order.currency === "USDT") {
        wallet.cryptoBalances.USDT += receiveAmount;
      } else {
        wallet.balances[order.currency] += receiveAmount;
      }

      order.executedPrice = currentPrice;
      order.executedAt = new Date();
      order.status = "FILLED";
      order.filledGrams = order.remainingGrams;
      order.remainingGrams = 0;

      await wallet.save();
      await portfolio.save();
      await order.save();

      await Transaction.create({
        user: order.user,
        wallet: wallet._id,
        transactionType: order.orderType,
        providerReference: order.reference,
        currency: order.currency,
        amount: receiveAmount,
        goldKarat: order.karat,
        goldGrams: order.grams,
        goldPricePerGram: currentPrice,
        status: "COMPLETED",
        description: `${order.orderType} Trigger Executed`,
      });

    } catch {
      continue;
    }
  }
};

// ======================================================
// CANCEL RISK ORDER
// DELETE /api/v1/trade/risk-order/:reference
// ======================================================

export const cancelRiskOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const order = await TradeOrder.findOne({
      reference: req.params.reference,
      user: req.user.id,
      orderType: {
        $in: RISK_ORDER_TYPES,
      },
    });

    if (!order || order.status !== "OPEN") {
      return res.status(404).json({
        success: false,
        message: "Risk order not found or already closed.",
      });
    }

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    wallet.goldBalance.availableGrams += order.remainingGrams;
    wallet.goldBalance.lockedGrams -= order.remainingGrams;

    order.status = "CANCELLED";
    order.cancelledAt = new Date();

    await wallet.save();
    await order.save();

    return res.json({
      success: true,
      message: "Risk order cancelled successfully.",
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET ACTIVE RISK ORDERS
// GET /api/v1/trade/risk-orders
// ======================================================

export const getRiskOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const orders = await TradeOrder.find({
      user: req.user.id,
      orderType: {
        $in: RISK_ORDER_TYPES,
      },
      status: "OPEN",
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      totalOrders: orders.length,
      orders,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET RISK ORDER HISTORY
// GET /api/v1/trade/risk-history
// ======================================================

export const getRiskOrderHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const history = await TradeOrder.find({
      user: req.user.id,
      orderType: {
        $in: RISK_ORDER_TYPES,
      },
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      totalHistory: history.length,
      history,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 3/10 END
// ======================================================// ======================================================
// SECTION 4/10 — PART 1/4 START
// ORDER MATCHING ENGINE FOUNDATION
// ======================================================

// ======================================================
// MATCHING ENGINE CONFIGURATION
// ======================================================

const MATCHING_BATCH_LIMIT = 100;

// ======================================================
// PRICE-TIME PRIORITY SORTING
// ======================================================

const sortBuyOrders = (orders: any[]) => {
  return orders.sort((a, b) => {
    if (a.targetPrice !== b.targetPrice) {
      return b.targetPrice - a.targetPrice; // Highest price first
    }
    return (
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
    );
  });
};

const sortSellOrders = (orders: any[]) => {
  return orders.sort((a, b) => {
    if (a.targetPrice !== b.targetPrice) {
      return a.targetPrice - b.targetPrice; // Lowest price first
    }
    return (
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
    );
  });
};

// ======================================================
// LOAD OPEN LIMIT ORDER BOOK
// ======================================================

const loadOpenOrderBook = async (
  karat: string,
  currency: string
) => {
  const buyOrders = await TradeOrder.find({
    orderType: "LIMIT",
    side: "BUY",
    karat,
    currency,
    status: "OPEN",
  }).limit(MATCHING_BATCH_LIMIT);

  const sellOrders = await TradeOrder.find({
    orderType: "LIMIT",
    side: "SELL",
    karat,
    currency,
    status: "OPEN",
  }).limit(MATCHING_BATCH_LIMIT);

  return {
    buyOrders: sortBuyOrders(buyOrders),
    sellOrders: sortSellOrders(sellOrders),
  };
};

// ======================================================
// CHECK PRICE MATCH CONDITION
// ======================================================

const canOrdersMatch = (buyOrder: any, sellOrder: any) => {
  return buyOrder.targetPrice >= sellOrder.targetPrice;
};

// ======================================================
// CALCULATE MATCH QUANTITY
// ======================================================

const calculateMatchedGrams = (
  buyOrder: any,
  sellOrder: any
) => {
  return Math.min(
    buyOrder.remainingGrams,
    sellOrder.remainingGrams
  );
};

// ======================================================
// EXECUTION PRICE RULE
// Earlier order price gets priority
// ======================================================

const determineExecutionPrice = (
  buyOrder: any,
  sellOrder: any
) => {
  return new Date(buyOrder.createdAt).getTime() <
    new Date(sellOrder.createdAt).getTime()
    ? buyOrder.targetPrice
    : sellOrder.targetPrice;
};

// ======================================================
// MATCH RESULT OBJECT
// ======================================================

const createMatchResult = (
  buyOrder: any,
  sellOrder: any,
  grams: number,
  executionPrice: number
) => {
  const tradeValue = Number((grams * executionPrice).toFixed(2));

  return {
    tradeReference: generateTradeReference(),

    buyReference: buyOrder.reference,
    sellReference: sellOrder.reference,

    karat: buyOrder.karat,
    currency: buyOrder.currency,

    grams,
    executionPrice,
    tradeValue,

    executedAt: new Date(),
  };
};

// ======================================================
// BUILD MATCHING QUEUE
// ======================================================

export const buildMatchingQueue = async (
  karat: string,
  currency: string
) => {
  const orderBook = await loadOpenOrderBook(
    karat,
    currency
  );

  const queue: any[] = [];

  let buyIndex = 0;
  let sellIndex = 0;

  while (
    buyIndex < orderBook.buyOrders.length &&
    sellIndex < orderBook.sellOrders.length
  ) {
    const buyOrder = orderBook.buyOrders[buyIndex];
    const sellOrder = orderBook.sellOrders[sellIndex];

    if (!canOrdersMatch(buyOrder, sellOrder)) {
      break;
    }

    const grams = calculateMatchedGrams(
      buyOrder,
      sellOrder
    );

    const executionPrice = determineExecutionPrice(
      buyOrder,
      sellOrder
    );

    queue.push(
      createMatchResult(
        buyOrder,
        sellOrder,
        grams,
        executionPrice
      )
    );

    buyOrder.remainingGrams -= grams;
    sellOrder.remainingGrams -= grams;

    if (buyOrder.remainingGrams <= 0) {
      buyIndex++;
    }

    if (sellOrder.remainingGrams <= 0) {
      sellIndex++;
    }
  }

  return queue;
};

// ======================================================
// SECTION 4/10 — PART 1/4 END
// ======================================================// ======================================================
// SECTION 4/10 — PART 2/4 START
// PARTIAL FILL SETTLEMENT ENGINE
// ======================================================

// ======================================================
// UPDATE BUY ORDER AFTER PARTIAL FILL
// ======================================================

const updateBuyOrderFill = async (
  buyOrder: any,
  matchedGrams: number,
  executionPrice: number
) => {
  buyOrder.filledGrams += matchedGrams;
  buyOrder.remainingGrams -= matchedGrams;

  buyOrder.executedPrice = executionPrice;
  buyOrder.lastExecutionPrice = executionPrice;
  buyOrder.lastExecutedAt = new Date();

  if (buyOrder.remainingGrams <= 0) {
    buyOrder.status = "FILLED";
    buyOrder.executedAt = new Date();
  } else {
    buyOrder.status = "PARTIALLY_FILLED";
  }

  await buyOrder.save();
};

// ======================================================
// UPDATE SELL ORDER AFTER PARTIAL FILL
// ======================================================

const updateSellOrderFill = async (
  sellOrder: any,
  matchedGrams: number,
  executionPrice: number
) => {
  sellOrder.filledGrams += matchedGrams;
  sellOrder.remainingGrams -= matchedGrams;

  sellOrder.executedPrice = executionPrice;
  sellOrder.lastExecutionPrice = executionPrice;
  sellOrder.lastExecutedAt = new Date();

  if (sellOrder.remainingGrams <= 0) {
    sellOrder.status = "FILLED";
    sellOrder.executedAt = new Date();
  } else {
    sellOrder.status = "PARTIALLY_FILLED";
  }

  await sellOrder.save();
};

// ======================================================
// CREDIT BUYER GOLD HOLDINGS
// ======================================================

const settleBuyerPortfolio = async (
  buyOrder: any,
  matchedGrams: number
) => {
  const wallet = await Wallet.findOne({
    user: buyOrder.user,
  });

  const portfolio = await Portfolio.findOne({
    user: buyOrder.user,
  });

  if (!wallet || !portfolio) {
    throw new Error("Buyer settlement failed.");
  }

  wallet.goldBalance.totalGrams += matchedGrams;
  wallet.goldBalance.availableGrams += matchedGrams;

  portfolio.goldHoldings.totalGrams += matchedGrams;
  portfolio.goldHoldings[buyOrder.karat] += matchedGrams;

  await wallet.save();
  await portfolio.save();

  return { wallet, portfolio };
};

// ======================================================
// CREDIT SELLER FIAT / USDT
// ======================================================

const settleSellerWallet = async (
  sellOrder: any,
  matchedGrams: number,
  executionPrice: number
) => {
  const wallet = await Wallet.findOne({
    user: sellOrder.user,
  });

  const portfolio = await Portfolio.findOne({
    user: sellOrder.user,
  });

  if (!wallet || !portfolio) {
    throw new Error("Seller settlement failed.");
  }

  const tradeValue = Number(
    (matchedGrams * executionPrice).toFixed(2)
  );

  const fee = calculateTradingFee(tradeValue, "SELL");

  const receiveAmount = Number(
    (tradeValue - fee).toFixed(2)
  );

  wallet.goldBalance.lockedGrams -= matchedGrams;
  wallet.goldBalance.totalGrams -= matchedGrams;

  portfolio.goldHoldings.totalGrams -= matchedGrams;
  portfolio.goldHoldings[sellOrder.karat] -= matchedGrams;

  if (sellOrder.currency === "USDT") {
    wallet.cryptoBalances.USDT += receiveAmount;
  } else {
    wallet.balances[sellOrder.currency] += receiveAmount;
  }

  await wallet.save();
  await portfolio.save();

  return {
    wallet,
    portfolio,
    tradeValue,
    tradingFee: fee,
    receiveAmount,
  };
};

// ======================================================
// CREATE BUY TRANSACTION
// ======================================================

const createBuyerTransaction = async (
  buyOrder: any,
  trade: any
) => {
  const wallet = await Wallet.findOne({
    user: buyOrder.user,
  });

  await Transaction.create({
    user: buyOrder.user,
    wallet: wallet?._id,

    transactionType: "LIMIT_BUY_FILLED",

    providerReference: trade.tradeReference,

    currency: buyOrder.currency,
    amount: trade.tradeValue,

    goldKarat: buyOrder.karat,
    goldGrams: trade.grams,
    goldPricePerGram: trade.executionPrice,

    status: "COMPLETED",

    description: "Limit Buy Order Settlement",
  });
};

// ======================================================
// CREATE SELL TRANSACTION
// ======================================================

const createSellerTransaction = async (
  sellOrder: any,
  trade: any,
  settlement: any
) => {
  await Transaction.create({
    user: sellOrder.user,
    wallet: settlement.wallet._id,

    transactionType: "LIMIT_SELL_FILLED",

    providerReference: trade.tradeReference,

    currency: sellOrder.currency,
    amount: settlement.receiveAmount,

    goldKarat: sellOrder.karat,
    goldGrams: trade.grams,
    goldPricePerGram: trade.executionPrice,

    status: "COMPLETED",

    description: "Limit Sell Order Settlement",
  });
};

// ======================================================
// SETTLE MATCHED TRADE
// ======================================================

export const settleMatchedTrade = async (
  buyOrder: any,
  sellOrder: any,
  matchedGrams: number,
  executionPrice: number
) => {
  const trade = createMatchResult(
    buyOrder,
    sellOrder,
    matchedGrams,
    executionPrice
  );

  const buyerSettlement =
    await settleBuyerPortfolio(
      buyOrder,
      matchedGrams
    );

  const sellerSettlement =
    await settleSellerWallet(
      sellOrder,
      matchedGrams,
      executionPrice
    );

  await updateBuyOrderFill(
    buyOrder,
    matchedGrams,
    executionPrice
  );

  await updateSellOrderFill(
    sellOrder,
    matchedGrams,
    executionPrice
  );

  await createBuyerTransaction(
    buyOrder,
    trade
  );

  await createSellerTransaction(
    sellOrder,
    trade,
    sellerSettlement
  );

  return {
    tradeReference: trade.tradeReference,

    buyer: buyOrder.user,
    seller: sellOrder.user,

    grams: matchedGrams,
    executionPrice,

    tradeValue: sellerSettlement.tradeValue,

    tradingFee: sellerSettlement.tradingFee,

    receiveAmount:
      sellerSettlement.receiveAmount,

    executedAt: trade.executedAt,
  };
};

// ======================================================
// SECTION 4/10 — PART 2/4 END
// ======================================================// ======================================================
// SECTION 4/10 — PART 3/4 START
// LIQUIDITY POOL + AUTO MATCHING QUEUE
// ======================================================

// ======================================================
// SYSTEM LIQUIDITY CONFIGURATION
// ======================================================

const SYSTEM_LIQUIDITY_USER = "SYSTEM_LIQUIDITY_POOL";
const MARKET_MAKER_SLIPPAGE = 0.0025; // 0.25%

// ======================================================
// GET SYSTEM LIQUIDITY WALLET
// ======================================================

const getLiquidityWallet = async () => {
  const wallet = await Wallet.findOne({
    accountType: SYSTEM_LIQUIDITY_USER,
  });

  if (!wallet) {
    throw new Error("Liquidity wallet not configured.");
  }

  return wallet;
};

// ======================================================
// CHECK AVAILABLE LIQUIDITY
// ======================================================

const hasLiquidity = async (
  side: "BUY" | "SELL",
  currency: string,
  grams: number,
  executionPrice: number
) => {
  const wallet = await getLiquidityWallet();

  const requiredAmount = Number((grams * executionPrice).toFixed(2));

  if (side === "BUY") {
    return wallet.goldBalance.availableGrams >= grams;
  }

  if (currency === "USDT") {
    return wallet.cryptoBalances.USDT >= requiredAmount;
  }

  return wallet.balances[currency] >= requiredAmount;
};

// ======================================================
// MARKET MAKER EXECUTION PRICE
// ======================================================

const calculateLiquidityExecutionPrice = (
  marketPrice: number,
  side: "BUY" | "SELL"
) => {
  if (side === "BUY") {
    return Number(
      (marketPrice * (1 + MARKET_MAKER_SLIPPAGE)).toFixed(2)
    );
  }

  return Number(
    (marketPrice * (1 - MARKET_MAKER_SLIPPAGE)).toFixed(2)
  );
};

// ======================================================
// EXECUTE BUY FROM SYSTEM LIQUIDITY
// ======================================================

const executeLiquidityBuy = async (
  buyOrder: any,
  marketPrice: number
) => {
  const liquidityWallet = await getLiquidityWallet();

  const executionPrice = calculateLiquidityExecutionPrice(
    marketPrice,
    "BUY"
  );

  const tradeValue = Number(
    (buyOrder.remainingGrams * executionPrice).toFixed(2)
  );

  const fee = calculateTradingFee(tradeValue, "BUY");

  liquidityWallet.goldBalance.availableGrams -= buyOrder.remainingGrams;
  liquidityWallet.goldBalance.totalGrams -= buyOrder.remainingGrams;

  if (buyOrder.currency === "USDT") {
    liquidityWallet.cryptoBalances.USDT += tradeValue;
  } else {
    liquidityWallet.balances[buyOrder.currency] += tradeValue;
  }

  await liquidityWallet.save();

  await settleBuyerPortfolio(
    buyOrder,
    buyOrder.remainingGrams
  );

  buyOrder.executedPrice = executionPrice;
  buyOrder.filledGrams = buyOrder.grams;
  buyOrder.remainingGrams = 0;
  buyOrder.tradingFee = fee;
  buyOrder.status = "FILLED";
  buyOrder.executedAt = new Date();

  await buyOrder.save();

  await Transaction.create({
    user: buyOrder.user,
    wallet: liquidityWallet._id,

    transactionType: "LIQUIDITY_BUY_EXECUTION",

    providerReference: buyOrder.reference,

    currency: buyOrder.currency,
    amount: tradeValue + fee,

    goldKarat: buyOrder.karat,
    goldGrams: buyOrder.grams,
    goldPricePerGram: executionPrice,

    status: "COMPLETED",

    description: "Executed through GoldTrade Liquidity Pool",
  });

  return buyOrder;
};

// ======================================================
// EXECUTE SELL TO SYSTEM LIQUIDITY
// ======================================================

const executeLiquiditySell = async (
  sellOrder: any,
  marketPrice: number
) => {
  const liquidityWallet = await getLiquidityWallet();

  const executionPrice = calculateLiquidityExecutionPrice(
    marketPrice,
    "SELL"
  );

  const tradeValue = Number(
    (sellOrder.remainingGrams * executionPrice).toFixed(2)
  );

  const fee = calculateTradingFee(tradeValue, "SELL");

  const receiveAmount = Number(
    (tradeValue - fee).toFixed(2)
  );

  liquidityWallet.goldBalance.totalGrams += sellOrder.remainingGrams;
  liquidityWallet.goldBalance.availableGrams += sellOrder.remainingGrams;

  if (sellOrder.currency === "USDT") {
    liquidityWallet.cryptoBalances.USDT -= receiveAmount;
  } else {
    liquidityWallet.balances[sellOrder.currency] -= receiveAmount;
  }

  await liquidityWallet.save();

  const sellerSettlement = await settleSellerWallet(
    sellOrder,
    sellOrder.remainingGrams,
    executionPrice
  );

  sellOrder.executedPrice = executionPrice;
  sellOrder.filledGrams = sellOrder.grams;
  sellOrder.remainingGrams = 0;
  sellOrder.tradingFee = fee;
  sellOrder.status = "FILLED";
  sellOrder.executedAt = new Date();

  await sellOrder.save();

  await Transaction.create({
    user: sellOrder.user,
    wallet: sellerSettlement.wallet._id,

    transactionType: "LIQUIDITY_SELL_EXECUTION",

    providerReference: sellOrder.reference,

    currency: sellOrder.currency,
    amount: receiveAmount,

    goldKarat: sellOrder.karat,
    goldGrams: sellOrder.grams,
    goldPricePerGram: executionPrice,

    status: "COMPLETED",

    description: "Sold to GoldTrade Liquidity Pool",
  });

  return sellOrder;
};

// ======================================================
// AUTO MATCH OPEN LIMIT ORDERS
// ======================================================

export const executeMatchingQueue = async (
  karat: string,
  currency: string
) => {
  const queue = await buildMatchingQueue(
    karat,
    currency
  );

  const executedTrades: any[] = [];

  for (const trade of queue) {
    const buyOrder = await TradeOrder.findOne({
      reference: trade.buyReference,
    });

    const sellOrder = await TradeOrder.findOne({
      reference: trade.sellReference,
    });

    if (!buyOrder || !sellOrder) continue;

    const settlement = await settleMatchedTrade(
      buyOrder,
      sellOrder,
      trade.grams,
      trade.executionPrice
    );

    executedTrades.push(settlement);
  }

  return executedTrades;
};

// ======================================================
// EXECUTE LIQUIDITY FALLBACK
// ======================================================

export const executeLiquidityFallbackOrders = async () => {
  const openOrders = await TradeOrder.find({
    orderType: "LIMIT",
    status: "OPEN",
  });

  for (const order of openOrders) {
    const marketPrice = await getMarketPrice(
      order.karat,
      order.currency
    );

    const eligible =
      (order.side === "BUY" &&
        marketPrice <= order.targetPrice) ||
      (order.side === "SELL" &&
        marketPrice >= order.targetPrice);

    if (!eligible) continue;

    const liquidityAvailable = await hasLiquidity(
      order.side,
      order.currency,
      order.remainingGrams,
      marketPrice
    );

    if (!liquidityAvailable) continue;

    if (order.side === "BUY") {
      await executeLiquidityBuy(order, marketPrice);
    } else {
      await executeLiquiditySell(order, marketPrice);
    }
  }
};

// ======================================================
// GET LIVE MATCHING QUEUE STATUS
// GET /api/v1/trade/matching-queue
// ======================================================

export const getMatchingQueueStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const buyOrders = await TradeOrder.countDocuments({
      orderType: "LIMIT",
      side: "BUY",
      status: "OPEN",
    });

    const sellOrders = await TradeOrder.countDocuments({
      orderType: "LIMIT",
      side: "SELL",
      status: "OPEN",
    });

    const partialOrders = await TradeOrder.countDocuments({
      status: "PARTIALLY_FILLED",
    });

    return res.json({
      success: true,

      queue: {
        openBuyOrders: buyOrders,
        openSellOrders: sellOrders,
        partiallyFilledOrders: partialOrders,
        timestamp: new Date(),
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 4/10 — PART 3/4 END
// ======================================================// ======================================================
// SECTION 4/10 — PART 4/4 START
// ADMIN MATCHING SCHEDULER + BATCH EXECUTION ENGINE
// ======================================================

// ======================================================
// PROCESS COMPLETE MATCHING CYCLE
// ======================================================

export const processMatchingCycle = async () => {
  const latestPrice = await GoldPrice.findOne().sort({
    createdAt: -1,
  });

  if (!latestPrice) {
    throw new Error("Live market unavailable.");
  }

  const supportedPairs = [
    { karat: "K24", currency: "PKR" },
    { karat: "K22", currency: "PKR" },
    { karat: "K21", currency: "PKR" },
    { karat: "K18", currency: "PKR" },

    { karat: "K24", currency: "USD" },
    { karat: "K22", currency: "USD" },
    { karat: "K24", currency: "AED" },
    { karat: "K24", currency: "USDT" },
  ];

  const summary = {
    executedTrades: 0,
    liquidityTrades: 0,
    expiredOrders: 0,
    pairsProcessed: 0,
  };

  for (const pair of supportedPairs) {
    const trades = await executeMatchingQueue(
      pair.karat,
      pair.currency
    );

    summary.executedTrades += trades.length;
    summary.pairsProcessed += 1;
  }

  await executeLiquidityFallbackOrders();

  summary.expiredOrders = await expireLimitOrders();

  return summary;
};

// ======================================================
// ADMIN RUN MATCHING ENGINE
// POST /api/v1/admin/trade/run-matching
// ======================================================

export const runTradeMatchingScheduler = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await processMatchingCycle();

    return res.json({
      success: true,
      message: "Trade matching engine executed successfully.",
      result,
      executedAt: new Date(),
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET MARKET DEPTH SUMMARY
// GET /api/v1/admin/trade/market-depth
// ======================================================

export const getMarketDepthSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const buyOrders = await TradeOrder.find({
      orderType: "LIMIT",
      side: "BUY",
      status: "OPEN",
    });

    const sellOrders = await TradeOrder.find({
      orderType: "LIMIT",
      side: "SELL",
      status: "OPEN",
    });

    const buyVolume = buyOrders.reduce(
      (sum: number, order: any) => sum + order.remainingGrams,
      0
    );

    const sellVolume = sellOrders.reduce(
      (sum: number, order: any) => sum + order.remainingGrams,
      0
    );

    return res.json({
      success: true,

      marketDepth: {
        buyOrders: buyOrders.length,
        sellOrders: sellOrders.length,
        buyVolume,
        sellVolume,
        totalVolume: buyVolume + sellVolume,
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET EXECUTION STATISTICS
// GET /api/v1/admin/trade/execution-stats
// ======================================================

export const getTradeExecutionStats = async (
  req: Request,
  res: Response
) => {
  try {
    const totalFilled = await TradeOrder.countDocuments({
      status: "FILLED",
    });

    const partialFilled = await TradeOrder.countDocuments({
      status: "PARTIALLY_FILLED",
    });

    const openOrders = await TradeOrder.countDocuments({
      status: "OPEN",
    });

    const cancelledOrders = await TradeOrder.countDocuments({
      status: "CANCELLED",
    });

    const expiredOrders = await TradeOrder.countDocuments({
      status: "EXPIRED",
    });

    return res.json({
      success: true,

      statistics: {
        totalFilled,
        partialFilled,
        openOrders,
        cancelledOrders,
        expiredOrders,
        generatedAt: new Date(),
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CLEANUP COMPLETED ORDERS
// POST /api/v1/admin/trade/cleanup
// ======================================================

export const cleanupCompletedOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const olderThanDays = Number(req.body.days || 90);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await TradeOrder.deleteMany({
      status: {
        $in: ["FILLED", "CANCELLED", "EXPIRED"],
      },
      updatedAt: {
        $lt: cutoff,
      },
    });

    return res.json({
      success: true,
      message: "Trade cleanup completed.",
      deletedOrders: result.deletedCount,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET MATCHING ENGINE HEALTH
// GET /api/v1/admin/trade/engine-health
// ======================================================

export const getMatchingEngineHealth = async (
  req: Request,
  res: Response
) => {
  try {
    const liquidityWallet = await getLiquidityWallet();

    return res.json({
      success: true,

      engine: {
        status: "ONLINE",
        version: "GoldTrade Matching Engine v17",

        liquidityGold:
          liquidityWallet.goldBalance.availableGrams,

        liquidityUSDT:
          liquidityWallet.cryptoBalances.USDT,

        timestamp: new Date(),
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 4/10 — PART 4/4 END
// SECTION 4/10 COMPLETE
// ======================================================// ======================================================
// SECTION 5/10 — PART 1/3 START
// ADVANCED ORDER TYPES (GTC / IOC / FOK)
// ======================================================

// ======================================================
// VALID TIME-IN-FORCE VALUES
// ======================================================

const TIME_IN_FORCE = ["GTC", "IOC", "FOK"];

// ======================================================
// CREATE ADVANCED LIMIT ORDER
// POST /api/v1/trade/advanced-limit-order
// ======================================================

export const placeAdvancedLimitOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      side,
      karat,
      currency,
      grams,
      targetPrice,
      timeInForce,
    } = req.body;

    if (!TIME_IN_FORCE.includes(timeInForce)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Time-In-Force value.",
      });
    }

    const wallet = await Wallet.findOne({ user: req.user.id });
    const portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!wallet || !portfolio) {
      return res.status(404).json({
        success: false,
        message: "Wallet or portfolio not found.",
      });
    }

    const tradeValue = Number((grams * targetPrice).toFixed(2));
    const fee = calculateTradingFee(tradeValue, side);

    if (side === "BUY") {
      const reserveAmount = tradeValue + fee;

      if (currency === "USDT") {
        if (wallet.cryptoBalances.USDT < reserveAmount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient USDT balance.",
          });
        }

        wallet.cryptoBalances.USDT -= reserveAmount;
      } else {
        if (wallet.balances[currency] < reserveAmount) {
          return res.status(400).json({
            success: false,
            message: `Insufficient ${currency} balance.`,
          });
        }

        wallet.balances[currency] -= reserveAmount;
      }
    } else {
      if (portfolio.goldHoldings[karat] < grams) {
        return res.status(400).json({
          success: false,
          message: "Insufficient gold holdings.",
        });
      }

      wallet.goldBalance.availableGrams -= grams;
      wallet.goldBalance.lockedGrams += grams;
    }

    const order = await TradeOrder.create({
      user: req.user.id,
      reference: generateTradeReference(),

      orderType: "LIMIT",
      side,

      karat,
      currency,

      grams,
      remainingGrams: grams,
      filledGrams: 0,

      targetPrice,
      tradingFee: fee,

      timeInForce,
      status: "OPEN",

      createdAt: new Date(),
    });

    await wallet.save();

    return res.status(201).json({
      success: true,
      message: "Advanced limit order placed.",
      order,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// IOC EXECUTION CHECK
// ======================================================

const executeIOCOrder = async (order: any) => {
  const marketPrice = await getMarketPrice(
    order.karat,
    order.currency
  );

  const eligible =
    (order.side === "BUY" &&
      marketPrice <= order.targetPrice) ||
    (order.side === "SELL" &&
      marketPrice >= order.targetPrice);

  if (!eligible) {
    order.status = "CANCELLED";
    order.cancelReason = "IOC_NOT_FILLED";
    order.cancelledAt = new Date();

    await order.save();

    return false;
  }

  return true;
};

// ======================================================
// FOK EXECUTION CHECK
// ======================================================

const executeFOKOrder = async (order: any) => {
  const orderBook = await loadOpenOrderBook(
    order.karat,
    order.currency
  );

  const oppositeOrders =
    order.side === "BUY"
      ? orderBook.sellOrders
      : orderBook.buyOrders;

  let availableGrams = 0;

  for (const opposite of oppositeOrders) {
    const eligible =
      order.side === "BUY"
        ? opposite.targetPrice <= order.targetPrice
        : opposite.targetPrice >= order.targetPrice;

    if (!eligible) continue;

    availableGrams += opposite.remainingGrams;

    if (availableGrams >= order.remainingGrams) break;
  }

  if (availableGrams < order.remainingGrams) {
    order.status = "CANCELLED";
    order.cancelReason = "FOK_INSUFFICIENT_LIQUIDITY";
    order.cancelledAt = new Date();

    await order.save();

    return false;
  }

  return true;
};

// ======================================================
// APPLY TIME-IN-FORCE RULES
// ======================================================

export const applyTimeInForceRules = async (order: any) => {
  switch (order.timeInForce) {
    case "IOC":
      return executeIOCOrder(order);

    case "FOK":
      return executeFOKOrder(order);

    case "GTC":
    default:
      return true;
  }
};

// ======================================================
// SECTION 5/10 — PART 1/3 END
// ======================================================// ======================================================
// SECTION 5/10 — PART 2/3 START
// MODIFY OPEN ORDERS ENGINE
// ======================================================

// ======================================================
// RECALCULATE RESERVED BUY BALANCE
// ======================================================

const recalculateReservedAmount = (
  grams: number,
  targetPrice: number,
  side: "BUY" | "SELL"
) => {
  const tradeValue = Number((grams * targetPrice).toFixed(2));
  const fee = calculateTradingFee(tradeValue, side);

  return {
    tradeValue,
    tradingFee: fee,
    reservedAmount: Number((tradeValue + fee).toFixed(2)),
  };
};

// ======================================================
// MODIFY LIMIT ORDER
// PATCH /api/v1/trade/order/:reference
// ======================================================

export const modifyLimitOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { targetPrice, grams } = req.body;

    const order = await TradeOrder.findOne({
      reference: req.params.reference,
      user: req.user.id,
      orderType: "LIMIT",
      status: { $in: ["OPEN", "PARTIALLY_FILLED"] },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Open limit order not found.",
      });
    }

    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const previousRemaining = order.remainingGrams;
    const previousReserved = order.reservedAmount || 0;

    // Remaining grams cannot be lower than already filled
    const newRemaining =
      grams !== undefined
        ? Math.max(grams - order.filledGrams, 0)
        : previousRemaining;

    const newGrams =
      grams !== undefined ? grams : order.grams;

    const newPrice =
      targetPrice !== undefined
        ? targetPrice
        : order.targetPrice;

    // BUY ORDER BALANCE RECALCULATION
    if (order.side === "BUY") {
      const recalculated = recalculateReservedAmount(
        newRemaining,
        newPrice,
        "BUY"
      );

      const difference =
        recalculated.reservedAmount - previousReserved;

      if (difference > 0) {
        // Need extra balance
        if (order.currency === "USDT") {
          if (wallet.cryptoBalances.USDT < difference) {
            return res.status(400).json({
              success: false,
              message: "Insufficient USDT balance.",
            });
          }

          wallet.cryptoBalances.USDT -= difference;
        } else {
          if (
            wallet.balances[order.currency] < difference
          ) {
            return res.status(400).json({
              success: false,
              message: `Insufficient ${order.currency} balance.`,
            });
          }

          wallet.balances[order.currency] -= difference;
        }
      } else if (difference < 0) {
        const refund = Math.abs(difference);

        if (order.currency === "USDT") {
          wallet.cryptoBalances.USDT += refund;
        } else {
          wallet.balances[order.currency] += refund;
        }
      }

      order.reservedAmount =
        recalculated.reservedAmount;

      order.tradingFee = recalculated.tradingFee;
    }

    // SELL ORDER GOLD RECALCULATION
    if (order.side === "SELL") {
      const gramDifference =
        newRemaining - previousRemaining;

      if (gramDifference > 0) {
        if (
          wallet.goldBalance.availableGrams <
          gramDifference
        ) {
          return res.status(400).json({
            success: false,
            message: "Insufficient available gold.",
          });
        }

        wallet.goldBalance.availableGrams -=
          gramDifference;

        wallet.goldBalance.lockedGrams += gramDifference;
      } else if (gramDifference < 0) {
        const release = Math.abs(gramDifference);

        wallet.goldBalance.availableGrams += release;
        wallet.goldBalance.lockedGrams -= release;
      }
    }

    order.targetPrice = newPrice;
    order.grams = newGrams;
    order.remainingGrams = newRemaining;

    order.updatedAt = new Date();

    await wallet.save();
    await order.save();

    return res.json({
      success: true,
      message: "Limit order modified successfully.",
      order,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CHANGE ONLY TARGET PRICE
// PATCH /api/v1/trade/order/:reference/price
// ======================================================

export const updateLimitOrderPrice = async (
  req: Request,
  res: Response
) => {
  req.body.grams = undefined;
  return modifyLimitOrder(req, res);
};

// ======================================================
// CHANGE ONLY QUANTITY
// PATCH /api/v1/trade/order/:reference/quantity
// ======================================================

export const updateLimitOrderQuantity = async (
  req: Request,
  res: Response
) => {
  req.body.targetPrice = undefined;
  return modifyLimitOrder(req, res);
};

// ======================================================
// EXTEND GTC ORDER EXPIRY
// PATCH /api/v1/trade/order/:reference/extend
// ======================================================

export const extendLimitOrderExpiry = async (
  req: Request,
  res: Response
) => {
  try {
    const { extraDays } = req.body;

    const order = await TradeOrder.findOne({
      reference: req.params.reference,
      user: req.user.id,
      orderType: "LIMIT",
      status: { $in: ["OPEN", "PARTIALLY_FILLED"] },
      timeInForce: "GTC",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "GTC order not found.",
      });
    }

    const days = Number(extraDays || 30);

    order.expiresAt = new Date(order.expiresAt);
    order.expiresAt.setDate(
      order.expiresAt.getDate() + days
    );

    order.updatedAt = new Date();

    await order.save();

    return res.json({
      success: true,
      message: "Order expiry extended successfully.",
      expiresAt: order.expiresAt,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// VALIDATE ORDER MODIFICATION
// ======================================================

export const validateOrderModification = async (
  req: Request,
  res: Response
) => {
  try {
    const { targetPrice, grams } = req.body;

    const order = await TradeOrder.findOne({
      reference: req.params.reference,
      user: req.user.id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const preview =
      recalculateReservedAmount(
        grams || order.remainingGrams,
        targetPrice || order.targetPrice,
        order.side
      );

    return res.json({
      success: true,
      preview,
      currentOrder: {
        grams: order.remainingGrams,
        targetPrice: order.targetPrice,
        reservedAmount: order.reservedAmount,
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 5/10 — PART 2/3 END
// ======================================================// ======================================================
// SECTION 5/10 — PART 3/3 START
// OPEN ORDERS DASHBOARD + BULK CANCEL ENGINE
// ======================================================

// ======================================================
// CANCEL ALL OPEN ORDERS
// DELETE /api/v1/trade/orders/cancel-all
// ======================================================

export const cancelAllOpenOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found."
      });
    }

    const orders = await TradeOrder.find({
      user: req.user.id,
      status: { $in: ["OPEN", "PARTIALLY_FILLED"] }
    });

    let cancelled = 0;
    let refundedAmount = 0;
    let releasedGold = 0;

    for (const order of orders) {
      if (order.side === "BUY") {
        const refund = order.reservedAmount || 0;

        if (order.currency === "USDT") {
          wallet.cryptoBalances.USDT += refund;
        } else {
          wallet.balances[order.currency] += refund;
        }

        refundedAmount += refund;
      }

      if (order.side === "SELL") {
        wallet.goldBalance.availableGrams += order.remainingGrams;
        wallet.goldBalance.lockedGrams -= order.remainingGrams;

        releasedGold += order.remainingGrams;
      }

      order.status = "CANCELLED";
      order.cancelReason = "USER_CANCELLED_ALL";
      order.cancelledAt = new Date();

      await order.save();
      cancelled++;
    }

    await wallet.save();

    return res.json({
      success: true,
      message: "All open orders cancelled successfully.",

      summary: {
        cancelledOrders: cancelled,
        refundedAmount,
        releasedGoldGrams: releasedGold
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// FILTER USER ORDERS
// GET /api/v1/trade/orders/filter
// ======================================================

export const filterTradeOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      status,
      side,
      orderType,
      karat,
      currency
    } = req.query;

    const query: any = {
      user: req.user.id
    };

    if (status) query.status = status;
    if (side) query.side = side;
    if (orderType) query.orderType = orderType;
    if (karat) query.karat = karat;
    if (currency) query.currency = currency;

    const orders = await TradeOrder.find(query).sort({
      createdAt: -1
    });

    return res.json({
      success: true,
      totalOrders: orders.length,
      filters: req.query,
      orders
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// OPEN ORDERS DASHBOARD
// GET /api/v1/trade/orders/dashboard
// ======================================================

export const getOpenOrdersDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    const openOrders = await TradeOrder.find({
      user: req.user.id,
      status: { $in: ["OPEN", "PARTIALLY_FILLED"] }
    }).sort({ createdAt: -1 });

    const buyOrders = openOrders.filter(
      (o: any) => o.side === "BUY"
    );

    const sellOrders = openOrders.filter(
      (o: any) => o.side === "SELL"
    );

    const buyVolume = buyOrders.reduce(
      (sum: number, o: any) => sum + o.remainingGrams,
      0
    );

    const sellVolume = sellOrders.reduce(
      (sum: number, o: any) => sum + o.remainingGrams,
      0
    );

    return res.json({
      success: true,

      dashboard: {
        totalOpenOrders: openOrders.length,

        buyOrders: buyOrders.length,
        sellOrders: sellOrders.length,

        buyVolume,
        sellVolume,

        openOrders
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// ORDER SUMMARY
// GET /api/v1/trade/orders/summary
// ======================================================

export const getTradeOrderSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const allOrders = await TradeOrder.find({
      user: req.user.id
    });

    const summary = {
      totalOrders: allOrders.length,

      openOrders: 0,
      filledOrders: 0,
      partiallyFilledOrders: 0,
      cancelledOrders: 0,
      expiredOrders: 0,

      buyOrders: 0,
      sellOrders: 0,

      totalBuyVolume: 0,
      totalSellVolume: 0
    };

    for (const order of allOrders) {
      if (order.side === "BUY") {
        summary.buyOrders++;
        summary.totalBuyVolume += order.grams;
      }

      if (order.side === "SELL") {
        summary.sellOrders++;
        summary.totalSellVolume += order.grams;
      }

      switch (order.status) {
        case "OPEN":
          summary.openOrders++;
          break;

        case "FILLED":
          summary.filledOrders++;
          break;

        case "PARTIALLY_FILLED":
          summary.partiallyFilledOrders++;
          break;

        case "CANCELLED":
          summary.cancelledOrders++;
          break;

        case "EXPIRED":
          summary.expiredOrders++;
          break;
      }
    }

    return res.json({
      success: true,
      summary
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// RECENT ORDER ACTIVITY
// GET /api/v1/trade/orders/activity
// ======================================================

export const getRecentOrderActivity = async (
  req: Request,
  res: Response
) => {
  try {
    const activity = await TradeOrder.find({
      user: req.user.id
    })
      .sort({ updatedAt: -1 })
      .limit(20);

    return res.json({
      success: true,
      totalActivities: activity.length,
      activity
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// GET RESERVED BALANCES
// GET /api/v1/trade/orders/reserved-balances
// ======================================================

export const getReservedTradingBalances = async (
  req: Request,
  res: Response
) => {
  try {
    const orders = await TradeOrder.find({
      user: req.user.id,
      status: { $in: ["OPEN", "PARTIALLY_FILLED"] }
    });

    let reservedGold = 0;

    const reservedCurrency: Record<string, number> = {};

    for (const order of orders) {
      if (order.side === "SELL") {
        reservedGold += order.remainingGrams;
      }

      if (order.side === "BUY") {
        reservedCurrency[order.currency] =
          (reservedCurrency[order.currency] || 0) +
          (order.reservedAmount || 0);
      }
    }

    return res.json({
      success: true,

      reserved: {
        goldGrams: reservedGold,
        currencies: reservedCurrency
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// SECTION 5/10 — PART 3/3 END
// SECTION 5/10 COMPLETE
// ======================================================// ======================================================
// SECTION 6/10 START
// TRADE HISTORY + PROFIT/LOSS LEDGER ENGINE
// ======================================================

// ======================================================
// CALCULATE REALIZED PROFIT / LOSS
// ======================================================

const calculateRealizedPL = (buyPrice:number,sellPrice:number,grams:number)=>{
    const investment = buyPrice * grams;
    const saleValue = sellPrice * grams;
    const grossProfit = saleValue - investment;

    const buyFee = calculateTradingFee(investment,"BUY");
    const sellFee = calculateTradingFee(saleValue,"SELL");

    const netProfit = grossProfit - buyFee - sellFee;

    return {
        investment:Number(investment.toFixed(2)),
        saleValue:Number(saleValue.toFixed(2)),
        grossProfit:Number(grossProfit.toFixed(2)),
        totalFees:Number((buyFee+sellFee).toFixed(2)),
        netProfit:Number(netProfit.toFixed(2)),
        roi:Number(((netProfit/investment)*100).toFixed(2))
    };
};

// ======================================================
// GET COMPLETE TRADE HISTORY
// GET /api/v1/trade/history
// ======================================================

export const getTradeHistory = async(req:Request,res:Response)=>{
try{

const trades = await TradeOrder.find({
user:req.user.id,
status:"FILLED"
}).sort({executedAt:-1});

return res.json({
success:true,
totalTrades:trades.length,
trades
});

}catch(error:any){
return res.status(500).json({
success:false,
message:error.message
});
}
};

// ======================================================
// TRADE HISTORY WITH FILTERS
// GET /api/v1/trade/history/filter
// ======================================================

export const getFilteredTradeHistory = async(req:Request,res:Response)=>{
try{

const {side,karat,currency,startDate,endDate} = req.query;

const query:any={
user:req.user.id,
status:"FILLED"
};

if(side) query.side=side;
if(karat) query.karat=karat;
if(currency) query.currency=currency;

if(startDate || endDate){
query.executedAt={};

if(startDate){
query.executedAt.$gte=new Date(String(startDate));
}

if(endDate){
query.executedAt.$lte=new Date(String(endDate));
}
}

const trades = await TradeOrder.find(query).sort({executedAt:-1});

return res.json({
success:true,
filters:req.query,
totalTrades:trades.length,
trades
});

}catch(error:any){
return res.status(500).json({
success:false,
message:error.message
});
}
};

// ======================================================
// TRADE PROFIT/LOSS LEDGER
// GET /api/v1/trade/pl-ledger
// ======================================================

export const getProfitLossLedger = async(req:Request,res:Response)=>{
try{

const sells = await TradeOrder.find({
user:req.user.id,
side:"SELL",
status:"FILLED"
}).sort({executedAt:-1});

const ledger:any[]=[];

let totalInvestment=0;
let totalSaleValue=0;
let totalFees=0;
let totalProfit=0;

for(const trade of sells){

const buyPrice=trade.averageBuyPrice || trade.executedPrice;

const pnl = calculateRealizedPL(
buyPrice,
trade.executedPrice,
trade.grams
);

ledger.push({
reference:trade.reference,
karat:trade.karat,
grams:trade.grams,
buyPrice,
sellPrice:trade.executedPrice,
...pnl,
date:trade.executedAt
});

totalInvestment+=pnl.investment;
totalSaleValue+=pnl.saleValue;
totalFees+=pnl.totalFees;
totalProfit+=pnl.netProfit;
}

return res.json({
success:true,

summary:{
totalInvestment:Number(totalInvestment.toFixed(2)),
totalSaleValue:Number(totalSaleValue.toFixed(2)),
totalFees:Number(totalFees.toFixed(2)),
totalNetProfit:Number(totalProfit.toFixed(2)),
roi:Number(((totalProfit/Math.max(totalInvestment,1))*100).toFixed(2))
},

ledger
});

}catch(error:any){
return res.status(500).json({
success:false,
message:error.message
});
}
};

// ======================================================
// MONTHLY REALIZED P/L REPORT
// GET /api/v1/trade/monthly-pl
// ======================================================

export const getMonthlyPLReport = async(req:Request,res:Response)=>{
try{

const year=Number(req.query.year);

const trades = await TradeOrder.find({
user:req.user.id,
side:"SELL",
status:"FILLED"
});

const report:any[]=[];

for(let month=0;month<12;month++){

const monthlyTrades=trades.filter((trade:any)=>{
const date=new Date(trade.executedAt);
return date.getFullYear()===year && date.getMonth()===month;
});

const profit = monthlyTrades.reduce((sum:number,trade:any)=>{
const pnl = calculateRealizedPL(
trade.averageBuyPrice || trade.executedPrice,
trade.executedPrice,
trade.grams
);
return sum+pnl.netProfit;
},0);

report.push({
month:month+1,
trades:monthlyTrades.length,
profit:Number(profit.toFixed(2))
});

}

return res.json({
success:true,
year,
report
});

}catch(error:any){
return res.status(500).json({
success:false,
message:error.message
});
}
};

// ======================================================
// YEARLY PROFIT/LOSS REPORT
// GET /api/v1/trade/yearly-pl
// ======================================================

export const getYearlyPLReport = async(req:Request,res:Response)=>{
try{

const trades = await TradeOrder.find({
user:req.user.id,
side:"SELL",
status:"FILLED"
});

const yearly:any={};

for(const trade of trades){

const year=new Date(trade.executedAt).getFullYear();

const pnl = calculateRealizedPL(
trade.averageBuyPrice || trade.executedPrice,
trade.executedPrice,
trade.grams
);

if(!yearly[year]){
yearly[year]={
year,
trades:0,
profit:0
};
}

yearly[year].trades++;
yearly[year].profit+=pnl.netProfit;

}

return res.json({
success:true,
years:Object.values(yearly)
});

}catch(error:any){
return res.status(500).json({
success:false,
message:error.message
});
}
};

// ======================================================
// TRADING FEES REPORT
// GET /api/v1/trade/fees
// ======================================================

export const getTradingFeesReport = async(req:Request,res:Response)=>{
try{

const trades = await TradeOrder.find({
user:req.user.id,
status:"FILLED"
});

let buyFees=0;
let sellFees=0;

const report = trades.map((trade:any)=>{

const tradeValue=trade.executedPrice * trade.grams;
const fee=calculateTradingFee(tradeValue,trade.side);

if(trade.side==="BUY") buyFees+=fee;
if(trade.side==="SELL") sellFees+=fee;

return{
reference:trade.reference,
side:trade.side,
grams:trade.grams,
currency:trade.currency,
tradeValue:Number(tradeValue.toFixed(2)),
fee:Number(fee.toFixed(2)),
date:trade.executedAt
};

});

return res.json({
success:true,

summary:{
buyFees:Number(buyFees.toFixed(2)),
sellFees:Number(sellFees.toFixed(2)),
totalFees:Number((buyFees+sellFees).toFixed(2))
},

report
});

}catch(error:any){
return res.status(500).json({
success:false,
message:error.message
});
}
};

// ======================================================
// EXPORT TRADE HISTORY (CSV/PDF READY DATA)
// GET /api/v1/trade/export
// ======================================================

export const exportTradeHistory = async(req:Request,res:Response)=>{
try{

const trades = await TradeOrder.find({
user:req.user.id,
status:"FILLED"
}).sort({executedAt:-1});

const exportData=trades.map((trade:any)=>({
TradeReference:trade.reference,
OrderType:trade.orderType,
Side:trade.side,
Karat:trade.karat,
Currency:trade.currency,
Grams:trade.grams,
ExecutedPrice:trade.executedPrice,
TradeValue:Number((trade.executedPrice*trade.grams).toFixed(2)),
TradingFee:trade.tradingFee,
ExecutedAt:trade.executedAt
}));

return res.json({
success:true,
format:"CSV_OR_PDF_READY",
records:exportData.length,
data:exportData
});

}catch(error:any){
return res.status(500).json({
success:false,
message:error.message
});
}
};

// ======================================================
// TAX SUMMARY
// GET /api/v1/trade/tax-summary
// ======================================================

export const getTaxSummary = async(req:Request,res:Response)=>{
try{

const year=Number(req.query.year);

const sells = await TradeOrder.find({
user:req.user.id,
side:"SELL",
status:"FILLED"
});

let taxableGain=0;
let deductibleLoss=0;
let totalFees=0;

for(const trade of sells){

const tradeYear=new Date(trade.executedAt).getFullYear();

if(year && tradeYear!==year) continue;

const pnl = calculateRealizedPL(
trade.averageBuyPrice || trade.executedPrice,
trade.executedPrice,
trade.grams
);

if(pnl.netProfit>0){
taxableGain+=pnl.netProfit;
}else{
deductibleLoss+=Math.abs(pnl.netProfit);
}

totalFees+=pnl.totalFees;

}

return res.json({
success:true,

taxSummary:{
year:year || "ALL",
taxableGain:Number(taxableGain.toFixed(2)),
deductibleLoss:Number(deductibleLoss.toFixed(2)),
tradingFees:Number(totalFees.toFixed(2)),
netCapitalGain:Number((taxableGain-deductibleLoss).toFixed(2))
}
});

}catch(error:any){
return res.status(500).json({
success:false,
message:error.message
});
}
};

// ======================================================
// SECTION 6/10 END
// TRADE HISTORY & PROFIT/LOSS ENGINE COMPLETE
// ======================================================// ======================================================
// SECTION 7/10 START
// TRADING POSITIONS + UNREALIZED P/L ENGINE
// ======================================================

// ======================================================
// BUILD USER POSITION SUMMARY
// ======================================================

const buildPositionSummary = async (userId: string) => {
  const portfolio = await Portfolio.findOne({ user: userId });

  if (!portfolio) {
    throw new Error("Portfolio not found.");
  }

  const latestPrice = await GoldPrice.findOne().sort({
    createdAt: -1,
  });

  if (!latestPrice) {
    throw new Error("Live gold price unavailable.");
  }

  const positions: any[] = [];

  const karats = ["K24", "K22", "K21", "K18"];

  for (const karat of karats) {
    const grams = portfolio.goldHoldings[karat] || 0;

    if (grams <= 0) continue;

    const buyTrades = await TradeOrder.find({
      user: userId,
      side: "BUY",
      karat,
      status: "FILLED",
    });

    const totalInvestment = buyTrades.reduce(
      (sum: number, trade: any) =>
        sum + trade.executedPrice * trade.grams,
      0
    );

    const totalGramsBought = buyTrades.reduce(
      (sum: number, trade: any) => sum + trade.grams,
      0
    );

    const averageBuyPrice =
      totalGramsBought > 0
        ? Number(
            (totalInvestment / totalGramsBought).toFixed(2)
          )
        : 0;

    const currentPrice = latestPrice.prices[karat].PKR;

    const marketValue = Number(
      (grams * currentPrice).toFixed(2)
    );

    const unrealizedPL = Number(
      ((currentPrice - averageBuyPrice) * grams).toFixed(2)
    );

    const roi =
      averageBuyPrice > 0
        ? Number(
            (
              ((currentPrice - averageBuyPrice) /
                averageBuyPrice) *
              100
            ).toFixed(2)
          )
        : 0;

    positions.push({
      karat,
      grams,
      averageBuyPrice,
      currentPrice,
      marketValue,
      unrealizedPL,
      roiPercentage: roi,
    });
  }

  return positions;
};

// ======================================================
// GET ALL OPEN POSITIONS
// GET /api/v1/trade/positions
// ======================================================

export const getTradingPositions = async (
  req: Request,
  res: Response
) => {
  try {
    const positions = await buildPositionSummary(req.user.id);

    return res.json({
      success: true,
      totalPositions: positions.length,
      positions,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SINGLE POSITION DETAILS
// GET /api/v1/trade/position/:karat
// ======================================================

export const getPositionDetails = async (
  req: Request,
  res: Response
) => {
  try {
    const positions = await buildPositionSummary(req.user.id);

    const position = positions.find(
      (item: any) => item.karat === req.params.karat
    );

    if (!position) {
      return res.status(404).json({
        success: false,
        message: "Position not found.",
      });
    }

    return res.json({
      success: true,
      position,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// PORTFOLIO EXPOSURE
// GET /api/v1/trade/portfolio-exposure
// ======================================================

export const getPortfolioExposure = async (
  req: Request,
  res: Response
) => {
  try {
    const positions = await buildPositionSummary(req.user.id);

    const totalMarketValue = positions.reduce(
      (sum: number, p: any) => sum + p.marketValue,
      0
    );

    const exposure = positions.map((position: any) => ({
      karat: position.karat,
      grams: position.grams,
      marketValue: position.marketValue,
      percentage:
        totalMarketValue > 0
          ? Number(
              (
                (position.marketValue / totalMarketValue) *
                100
              ).toFixed(2)
            )
          : 0,
    }));

    return res.json({
      success: true,

      totalMarketValue,
      exposure,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// UNREALIZED PROFIT / LOSS SUMMARY
// GET /api/v1/trade/unrealized-pl
// ======================================================

export const getUnrealizedPLSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const positions = await buildPositionSummary(req.user.id);

    const totalUnrealized = positions.reduce(
      (sum: number, item: any) => sum + item.unrealizedPL,
      0
    );

    const totalMarketValue = positions.reduce(
      (sum: number, item: any) => sum + item.marketValue,
      0
    );

    return res.json({
      success: true,

      summary: {
        totalUnrealizedPL: Number(
          totalUnrealized.toFixed(2)
        ),
        totalMarketValue,
        positions,
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// LIVE POSITION METRICS
// GET /api/v1/trade/live-position-metrics
// ======================================================

export const getLivePositionMetrics = async (
  req: Request,
  res: Response
) => {
  try {
    const positions = await buildPositionSummary(req.user.id);

    const metrics = positions.map((position: any) => ({
      karat: position.karat,
      livePrice: position.currentPrice,
      averageBuyPrice: position.averageBuyPrice,
      priceDifference: Number(
        (
          position.currentPrice -
          position.averageBuyPrice
        ).toFixed(2)
      ),
      unrealizedPL: position.unrealizedPL,
      roiPercentage: position.roiPercentage,
    }));

    return res.json({
      success: true,
      metrics,
      timestamp: new Date(),
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// POSITION PERFORMANCE HISTORY
// GET /api/v1/trade/position-history/:karat
// ======================================================

export const getPositionPerformanceHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const trades = await TradeOrder.find({
      user: req.user.id,
      karat: req.params.karat,
      status: "FILLED",
    }).sort({ executedAt: 1 });

    const history = trades.map((trade: any) => ({
      reference: trade.reference,
      side: trade.side,
      grams: trade.grams,
      executedPrice: trade.executedPrice,
      date: trade.executedAt,
    }));

    return res.json({
      success: true,
      karat: req.params.karat,
      history,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// PORTFOLIO ALLOCATION SUMMARY
// GET /api/v1/trade/portfolio-allocation
// ======================================================

export const getPortfolioAllocationSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const positions = await buildPositionSummary(req.user.id);

    const allocation = positions.map((position: any) => ({
      karat: position.karat,
      grams: position.grams,
      value: position.marketValue,
      unrealizedPL: position.unrealizedPL,
    }));

    const totalValue = allocation.reduce(
      (sum: number, item: any) => sum + item.value,
      0
    );

    return res.json({
      success: true,

      totalPortfolioValue: totalValue,
      allocation,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 7/10 END
// TRADING POSITIONS ENGINE COMPLETE
// ======================================================// ======================================================
// SECTION 8/10 START
// PRICE ALERT + WATCHLIST + NOTIFICATION ENGINE
// ======================================================

// ======================================================
// WATCHLIST CONFIG
// ======================================================

const MAX_WATCHLIST_ITEMS = 25;

// ======================================================
// ADD GOLD TO WATCHLIST
// POST /api/v1/trade/watchlist
// ======================================================

export const addToWatchlist = async (req: Request, res: Response) => {
  try {
    const { karat, currency } = req.body;

    const portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found."
      });
    }

    const exists = portfolio.watchlist.find(
      (item: any) =>
        item.karat === karat &&
        item.currency === currency
    );

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Already in watchlist."
      });
    }

    if (portfolio.watchlist.length >= MAX_WATCHLIST_ITEMS) {
      return res.status(400).json({
        success: false,
        message: "Watchlist limit reached."
      });
    }

    portfolio.watchlist.push({
      karat,
      currency,
      createdAt: new Date()
    });

    await portfolio.save();

    return res.json({
      success: true,
      message: "Added to watchlist.",
      watchlist: portfolio.watchlist
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// REMOVE WATCHLIST ITEM
// DELETE /api/v1/trade/watchlist/:karat/:currency
// ======================================================

export const removeFromWatchlist = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found."
      });
    }

    portfolio.watchlist = portfolio.watchlist.filter(
      (item: any) =>
        !(
          item.karat === req.params.karat &&
          item.currency === req.params.currency
        )
    );

    await portfolio.save();

    return res.json({
      success: true,
      message: "Removed from watchlist.",
      watchlist: portfolio.watchlist
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// GET WATCHLIST
// GET /api/v1/trade/watchlist
// ======================================================

export const getWatchlist = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found."
      });
    }

    const latestPrice = await GoldPrice.findOne().sort({
      createdAt: -1
    });

    const watchlist = portfolio.watchlist.map(
      (item: any) => ({
        karat: item.karat,
        currency: item.currency,
        livePrice:
          latestPrice.prices[item.karat][item.currency],
        addedAt: item.createdAt
      })
    );

    return res.json({
      success: true,
      totalItems: watchlist.length,
      watchlist
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// CREATE PRICE ALERT
// POST /api/v1/trade/price-alert
// ======================================================

export const createPriceAlert = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      karat,
      currency,
      targetPrice,
      direction
    } = req.body;

    const portfolio = await Portfolio.findOne({
      user: req.user.id
    });

    portfolio.priceAlerts.push({
      alertId: generateTradeReference(),
      karat,
      currency,
      targetPrice,
      direction, // ABOVE / BELOW
      status: "ACTIVE",
      createdAt: new Date()
    });

    await portfolio.save();

    return res.status(201).json({
      success: true,
      message: "Price alert created.",
      alerts: portfolio.priceAlerts
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// GET USER PRICE ALERTS
// GET /api/v1/trade/price-alerts
// ======================================================

export const getPriceAlerts = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id
    });

    return res.json({
      success: true,
      totalAlerts: portfolio.priceAlerts.length,
      alerts: portfolio.priceAlerts
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// DELETE PRICE ALERT
// DELETE /api/v1/trade/price-alert/:alertId
// ======================================================

export const deletePriceAlert = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id
    });

    portfolio.priceAlerts = portfolio.priceAlerts.filter(
      (alert: any) =>
        alert.alertId !== req.params.alertId
    );

    await portfolio.save();

    return res.json({
      success: true,
      message: "Price alert removed."
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// AUTO PRICE ALERT CHECK ENGINE
// INTERNAL JOB
// ======================================================

export const executePriceAlertEngine = async () => {
  const portfolios = await Portfolio.find();

  const latestPrice = await GoldPrice.findOne().sort({
    createdAt: -1
  });

  const triggeredAlerts: any[] = [];

  for (const portfolio of portfolios) {
    for (const alert of portfolio.priceAlerts) {
      if (alert.status !== "ACTIVE") continue;

      const livePrice =
        latestPrice.prices[alert.karat][alert.currency];

      const trigger =
        (alert.direction === "ABOVE" &&
          livePrice >= alert.targetPrice) ||
        (alert.direction === "BELOW" &&
          livePrice <= alert.targetPrice);

      if (!trigger) continue;

      alert.status = "TRIGGERED";
      alert.triggeredAt = new Date();

      triggeredAlerts.push({
        user: portfolio.user,
        alertId: alert.alertId,
        karat: alert.karat,
        currency: alert.currency,
        targetPrice: alert.targetPrice,
        livePrice
      });
    }

    await portfolio.save();
  }

  return triggeredAlerts;
};

// ======================================================
// MARKET MOVEMENT ALERTS
// GET /api/v1/trade/market-alerts
// ======================================================

export const getMarketAlerts = async (
  req: Request,
  res: Response
) => {
  try {
    const latestPrice = await GoldPrice.findOne().sort({
      createdAt: -1
    });

    return res.json({
      success: true,

      alerts: [
        {
          type: "LIVE_MARKET",
          marketStatus: latestPrice.marketStatus,
          updatedAt: latestPrice.updatedAt
        }
      ]
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// PRICE CHANGE SUMMARY
// GET /api/v1/trade/price-change-summary
// ======================================================

export const getPriceChangeSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const latest = await GoldPrice.findOne().sort({
      createdAt: -1
    });

    const previous = await GoldPrice.findOne({
      _id: { $ne: latest._id }
    }).sort({ createdAt: -1 });

    const summary: any[] = [];

    ["K24", "K22", "K21", "K18"].forEach((karat) => {
      ["PKR", "USD", "AED", "USDT"].forEach(
        (currency) => {
          const current =
            latest.prices[karat][currency];

          const old =
            previous?.prices?.[karat]?.[currency] || current;

          summary.push({
            karat,
            currency,
            previousPrice: old,
            currentPrice: current,
            change: Number((current - old).toFixed(2)),
            changePercent: Number(
              (((current - old) / old) * 100).toFixed(2)
            )
          });
        }
      );
    });

    return res.json({
      success: true,
      summary
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// SECTION 8/10 END
// PRICE ALERT ENGINE COMPLETE
// ======================================================// ======================================================
// SECTION 9/10 START
// ADMIN TRADING DASHBOARD + MARKET CONTROL ENGINE
// ======================================================

// ======================================================
// ADMIN MARKET CONFIGURATION
// ======================================================

const CIRCUIT_BREAKER_LIMIT = 8; // 8% movement
const MAX_LIQUIDITY_USAGE = 80;  // 80%

// ======================================================
// GET ADMIN TRADING DASHBOARD
// GET /api/v1/admin/trade/dashboard
// ======================================================

export const getAdminTradingDashboard = async (req: Request, res: Response) => {
  try {
    const totalOrders = await TradeOrder.countDocuments();
    const openOrders = await TradeOrder.countDocuments({ status: "OPEN" });
    const filledOrders = await TradeOrder.countDocuments({ status: "FILLED" });

    const buyVolume = await TradeOrder.aggregate([
      { $match: { side: "BUY", status: "FILLED" } },
      { $group: { _id: null, grams: { $sum: "$grams" } } }
    ]);

    const sellVolume = await TradeOrder.aggregate([
      { $match: { side: "SELL", status: "FILLED" } },
      { $group: { _id: null, grams: { $sum: "$grams" } } }
    ]);

    return res.json({
      success: true,
      dashboard: {
        totalOrders,
        openOrders,
        filledOrders,
        totalBuyVolume: buyVolume[0]?.grams || 0,
        totalSellVolume: sellVolume[0]?.grams || 0,
        generatedAt: new Date()
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================================
// LIQUIDITY STATUS
// GET /api/v1/admin/trade/liquidity
// ======================================================

export const getLiquidityStatus = async (req: Request, res: Response) => {
  try {
    const wallet = await getLiquidityWallet();

    return res.json({
      success: true,
      liquidity: {
        goldGrams: wallet.goldBalance.availableGrams,
        usdt: wallet.cryptoBalances.USDT,
        balances: wallet.balances,
        updatedAt: wallet.updatedAt
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================================
// UPDATE LIQUIDITY
// POST /api/v1/admin/trade/liquidity
// ======================================================

export const updateLiquidityPool = async (req: Request, res: Response) => {
  try {
    const { goldGrams, currency, amount } = req.body;

    const wallet = await getLiquidityWallet();

    if (goldGrams) {
      wallet.goldBalance.totalGrams += goldGrams;
      wallet.goldBalance.availableGrams += goldGrams;
    }

    if (currency && amount) {
      if (currency === "USDT") {
        wallet.cryptoBalances.USDT += amount;
      } else {
        wallet.balances[currency] += amount;
      }
    }

    await wallet.save();

    return res.json({
      success: true,
      message: "Liquidity updated successfully.",
      liquidityWallet: wallet
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================================
// CIRCUIT BREAKER ENGINE
// ======================================================

export const evaluateCircuitBreaker = async () => {
  const latest = await GoldPrice.findOne().sort({ createdAt: -1 });
  const previous = await GoldPrice.findOne({ _id: { $ne: latest._id } }).sort({
    createdAt: -1
  });

  if (!latest || !previous) return false;

  const current = latest.prices.K24.PKR;
  const old = previous.prices.K24.PKR;

  const movement = Math.abs(((current - old) / old) * 100);

  if (movement >= CIRCUIT_BREAKER_LIMIT) {
    latest.marketStatus = "HALTED";
    latest.circuitBreakerTriggered = true;
    latest.circuitBreakerPercent = Number(movement.toFixed(2));
    await latest.save();
    return true;
  }

  return false;
};

// ======================================================
// FREEZE MARKET
// POST /api/v1/admin/trade/freeze-market
// ======================================================

export const freezeMarket = async (req: Request, res: Response) => {
  try {
    const latest = await GoldPrice.findOne().sort({ createdAt: -1 });

    latest.marketStatus = "HALTED";
    latest.marketFreezeReason = req.body.reason || "ADMIN_FREEZE";
    latest.marketFrozenAt = new Date();

    await latest.save();

    return res.json({
      success: true,
      message: "Market frozen successfully.",
      marketStatus: latest.marketStatus
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================================
// RESUME MARKET
// POST /api/v1/admin/trade/resume-market
// ======================================================

export const resumeMarket = async (req: Request, res: Response) => {
  try {
    const latest = await GoldPrice.findOne().sort({ createdAt: -1 });

    latest.marketStatus = "OPEN";
    latest.marketFreezeReason = null;
    latest.marketFrozenAt = null;
    latest.circuitBreakerTriggered = false;

    await latest.save();

    return res.json({
      success: true,
      message: "Market resumed successfully.",
      marketStatus: latest.marketStatus
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================================
// TRADE MONITORING
// GET /api/v1/admin/trade/monitoring
// ======================================================

export const getTradeMonitoring = async (req: Request, res: Response) => {
  try {
    const recentTrades = await TradeOrder.find({ status: "FILLED" })
      .sort({ executedAt: -1 })
      .limit(25);

    const suspiciousOrders = await TradeOrder.find({
      grams: { $gte: 250 },
      status: { $in: ["OPEN", "FILLED"] }
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      monitoring: {
        recentTrades,
        suspiciousOrders,
        suspiciousCount: suspiciousOrders.length
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================================
// RISK DASHBOARD
// GET /api/v1/admin/trade/risk-dashboard
// ======================================================

export const getRiskDashboard = async (req: Request, res: Response) => {
  try {
    const liquidity = await getLiquidityWallet();

    const latestPrice = await GoldPrice.findOne().sort({ createdAt: -1 });

    const totalGoldLiquidity = liquidity.goldBalance.totalGrams;
    const availableGold = liquidity.goldBalance.availableGrams;

    const usage =
      totalGoldLiquidity > 0
        ? Number(
            (
              ((totalGoldLiquidity - availableGold) / totalGoldLiquidity) *
              100
            ).toFixed(2)
          )
        : 0;

    return res.json({
      success: true,
      risk: {
        marketStatus: latestPrice.marketStatus,
        circuitBreaker: latestPrice.circuitBreakerTriggered,
        liquidityUsage: usage,
        liquidityWarning: usage >= MAX_LIQUIDITY_USAGE,
        generatedAt: new Date()
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ======================================================
// SECTION 9/10 END
// ADMIN TRADING DASHBOARD COMPLETE
// ======================================================// ======================================================
// SECTION 10/10 START
// ENTERPRISE RISK ENGINE + FRAUD DETECTION + AUDIT LOGS
// ======================================================

// ======================================================
// RISK ENGINE CONFIGURATION
// ======================================================

const RISK_CONFIG = {
  MAX_SINGLE_ORDER_GRAMS: 500,
  MAX_DAILY_VOLUME_GRAMS: 2000,
  MAX_DAILY_TRADES: 100,
  HIGH_VALUE_ORDER_PKR: 5000000,
  RAPID_ORDER_WINDOW_MINUTES: 5,
  RAPID_ORDER_LIMIT: 10
};

// ======================================================
// CREATE AUDIT LOG
// ======================================================

const createAuditLog = async (
  userId: string,
  action: string,
  metadata: any = {}
) => {
  await Transaction.create({
    user: userId,
    transactionType: "AUDIT_LOG",
    providerReference: generateTradeReference(),
    status: "COMPLETED",
    description: action,
    metadata,
    createdAt: new Date()
  });
};

// ======================================================
// CHECK DAILY TRADING LIMITS
// ======================================================

const validateDailyTradingLimits = async (userId: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const orders = await TradeOrder.find({
    user: userId,
    createdAt: { $gte: today }
  });

  const totalGrams = orders.reduce(
    (sum: number, order: any) => sum + order.grams,
    0
  );

  return {
    totalTrades: orders.length,
    totalGrams,
    limitExceeded:
      orders.length >= RISK_CONFIG.MAX_DAILY_TRADES ||
      totalGrams >= RISK_CONFIG.MAX_DAILY_VOLUME_GRAMS
  };
};

// ======================================================
// FRAUD SCORE CALCULATION
// ======================================================

const calculateFraudScore = async (
  userId: string,
  grams: number,
  tradeValue: number
) => {
  let score = 0;
  const reasons: string[] = [];

  if (grams > RISK_CONFIG.MAX_SINGLE_ORDER_GRAMS) {
    score += 40;
    reasons.push("Large order size.");
  }

  if (tradeValue > RISK_CONFIG.HIGH_VALUE_ORDER_PKR) {
    score += 30;
    reasons.push("High value transaction.");
  }

  const recentWindow = new Date(
    Date.now() - RISK_CONFIG.RAPID_ORDER_WINDOW_MINUTES * 60 * 1000
  );

  const rapidOrders = await TradeOrder.countDocuments({
    user: userId,
    createdAt: { $gte: recentWindow }
  });

  if (rapidOrders >= RISK_CONFIG.RAPID_ORDER_LIMIT) {
    score += 30;
    reasons.push("Too many orders in short period.");
  }

  const daily = await validateDailyTradingLimits(userId);

  if (daily.limitExceeded) {
    score += 50;
    reasons.push("Daily trading limit exceeded.");
  }

  return {
    fraudScore: score,
    riskLevel:
      score >= 80
        ? "HIGH"
        : score >= 50
        ? "MEDIUM"
        : "LOW",
    reasons
  };
};

// ======================================================
// VALIDATE TRADE RISK BEFORE EXECUTION
// ======================================================

export const validateTradeRisk = async (
  req: Request,
  res: Response
) => {
  try {
    const { grams, tradeValue } = req.body;

    const risk = await calculateFraudScore(
      req.user.id,
      grams,
      tradeValue
    );

    await createAuditLog(req.user.id, "TRADE_RISK_CHECK", risk);

    return res.json({
      success: true,
      risk
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// GET USER RISK PROFILE
// GET /api/v1/trade/risk-profile
// ======================================================

export const getUserRiskProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const daily = await validateDailyTradingLimits(req.user.id);

    return res.json({
      success: true,
      profile: {
        dailyTrades: daily.totalTrades,
        dailyVolumeGrams: daily.totalGrams,
        limitsExceeded: daily.limitExceeded,
        generatedAt: new Date()
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// MARKET HEALTH REPORT
// GET /api/v1/admin/trade/market-health
// ======================================================

export const getMarketHealthReport = async (
  req: Request,
  res: Response
) => {
  try {
    const latest = await GoldPrice.findOne().sort({
      createdAt: -1
    });

    const totalOpenOrders = await TradeOrder.countDocuments({
      status: "OPEN"
    });

    const totalFilledToday = await TradeOrder.countDocuments({
      status: "FILLED",
      executedAt: {
        $gte: new Date(new Date().setHours(0,0,0,0))
      }
    });

    return res.json({
      success: true,
      health: {
        marketStatus: latest.marketStatus,
        circuitBreaker: latest.circuitBreakerTriggered,
        openOrders: totalOpenOrders,
        filledToday: totalFilledToday,
        lastPriceUpdate: latest.updatedAt,
        generatedAt: new Date()
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// ADMIN AUDIT LOGS
// GET /api/v1/admin/trade/audit-logs
// ======================================================

export const getAuditLogs = async (
  req: Request,
  res: Response
) => {
  try {
    const logs = await Transaction.find({
      transactionType: "AUDIT_LOG"
    })
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({
      success: true,
      totalLogs: logs.length,
      logs
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// FLAG SUSPICIOUS ACCOUNT
// POST /api/v1/admin/trade/flag-account
// ======================================================

export const flagSuspiciousAccount = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, reason } = req.body;

    await createAuditLog(userId, "ACCOUNT_FLAGGED", {
      reason,
      flaggedBy: req.user.id
    });

    return res.json({
      success: true,
      message: "Account flagged successfully."
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// TRADING ENGINE STATUS
// GET /api/v1/admin/trade/system-status
// ======================================================

export const getTradingEngineStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const liquidity = await getLiquidityWallet();
    const latestPrice = await GoldPrice.findOne().sort({
      createdAt: -1
    });

    return res.json({
      success: true,
      engine: {
        version: "GoldTrade V17 Enterprise",
        status: "ONLINE",
        matchingEngine: "ACTIVE",
        liquidityEngine: "ACTIVE",
        riskEngine: "ACTIVE",
        alertEngine: "ACTIVE",
        circuitBreaker: latestPrice.circuitBreakerTriggered,
        marketStatus: latestPrice.marketStatus,
        liquidityGold: liquidity.goldBalance.availableGrams,
        liquidityUSDT: liquidity.cryptoBalances.USDT,
        timestamp: new Date()
      }
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// FINAL TRADING ENGINE INITIALIZER
// ======================================================

export const initializeTradingEngine = async () => {
  await executeEligibleLimitOrders();
  await executeRiskOrders();
  await executePriceAlertEngine();
  await executeLiquidityFallbackOrders();
  await processMatchingCycle();
  await evaluateCircuitBreaker();

  return {
    initialized: true,
    version: "GoldTrade V17 Enterprise",
    timestamp: new Date()
  };
};

// ======================================================
// SECTION 10/10 END
// TRADE CONTROLLER COMPLETE
// ======================================================