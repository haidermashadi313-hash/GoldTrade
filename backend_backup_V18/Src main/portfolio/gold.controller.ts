// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/gold.controller.ts
// SECTION 1/10
// LIVE GOLD PRICE ENGINE + MARKET SUMMARY
// ======================================================

import { Request, Response } from "express";
import GoldPriceModel from "../models/GoldPrice";
import TransactionModel from "../models/Transaction";
import WalletModel from "../models/Wallet";
import PortfolioModel from "../models/Portfolio";
import UserModel from "../models/User";

// The embedded wallet and portfolio shapes are dynamic in the persistence
// models, so keep their controller-facing access permissive.
const GoldPrice: any = GoldPriceModel;
const Transaction: any = TransactionModel;
const Wallet: any = WalletModel;
const Portfolio: any = PortfolioModel;
const User: any = UserModel;

// ======================================================
// GET LATEST GOLD PRICE
// GET /api/v1/gold/live-price
// ======================================================

export const getLiveGoldPrice = async (
  req: Request,
  res: Response
) => {
  try {
    const price = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    if (!price) {
      return res.status(404).json({
        success: false,
        message: "Gold price unavailable.",
      });
    }

    return res.json({
      success: true,
      marketStatus: price.marketStatus,
      updatedAt: price.updatedAt,
      prices: price.prices,
      exchangeRates: price.exchangeRates,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET GOLD PRICE BY KARAT
// GET /api/v1/gold/price/:karat
// ======================================================

export const getGoldPriceByKarat = async (
  req: Request,
  res: Response
) => {
  try {
    const karat = String(req.params.karat).toUpperCase();

    const price = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    if (!price) {
      return res.status(404).json({
        success: false,
        message: "Price unavailable.",
      });
    }

    const selected = price.prices[karat];

    if (!selected) {
      return res.status(404).json({
        success: false,
        message: "Invalid karat.",
      });
    }

    return res.json({
      success: true,
      karat,
      updatedAt: price.updatedAt,
      price: selected,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET PRICE BY CURRENCY
// GET /api/v1/gold/currency/:currency
// ======================================================

export const getGoldPriceByCurrency = async (
  req: Request,
  res: Response
) => {
  try {
    const currency = String(req.params.currency).toUpperCase();

    const price = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    if (!price) {
      return res.status(404).json({
        success: false,
        message: "Price unavailable.",
      });
    }

    const response: any = {};

    Object.keys(price.prices).forEach((karat) => {
      response[karat] = price.prices[karat][currency];
    });

    return res.json({
      success: true,
      currency,
      updatedAt: price.updatedAt,
      prices: response,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// MARKET SUMMARY
// GET /api/v1/gold/market-summary
// ======================================================

export const getMarketSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const latest = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    if (!latest) {
      return res.status(404).json({
        success: false,
        message: "Market data unavailable.",
      });
    }

    return res.json({
      success: true,

      summary: {
        marketStatus: latest.marketStatus,
        lastUpdated: latest.updatedAt,

        gold24KPKR: latest.prices.K24.PKR,
        gold22KPKR: latest.prices.K22.PKR,
        gold21KPKR: latest.prices.K21.PKR,
        gold18KPKR: latest.prices.K18.PKR,

        usdRate: latest.exchangeRates.USD,
        aedRate: latest.exchangeRates.AED,
        sarRate: latest.exchangeRates.SAR,
        eurRate: latest.exchangeRates.EUR,
        gbpRate: latest.exchangeRates.GBP,
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
// PRICE HISTORY
// GET /api/v1/gold/history
// ======================================================

export const getGoldPriceHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const limit = Number(req.query.limit || 30);

    const history = await GoldPrice.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({
      success: true,
      total: history.length,
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
// GOLD MARKET STATUS
// GET /api/v1/gold/status
// ======================================================

export const getGoldMarketStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const latest = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    return res.json({
      success: true,

      market: {
        status: latest?.marketStatus || "CLOSED",
        updatedAt: latest?.updatedAt,
        exchangeRates: latest?.exchangeRates,
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
// GOLD PRICE CACHE
// GET /api/v1/gold/cache
// ======================================================

export const getGoldPriceCache = async (
  req: Request,
  res: Response
) => {
  try {
    const latest = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      cache: latest,
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
// BUY DIGITAL GOLD ENGINE
// ======================================================

// Supported currencies for gold purchase
const GOLD_PAYMENT_CURRENCIES = [
  "PKR",
  "USD",
  "AED",
  "SAR",
  "EUR",
  "GBP",
  "USDT",
];

// ======================================================
// GENERATE GOLD ORDER REFERENCE
// ======================================================

const generateGoldOrderReference = () => {
  const random = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `GTG-${Date.now()}-${random}`;
};

// ======================================================
// GET GOLD PRICE PER GRAM
// ======================================================

const getGoldGramPrice = async (
  karat: string,
  currency: string
) => {
  const latestPrice = await GoldPrice.findOne().sort({
    createdAt: -1,
  });

  if (!latestPrice) {
    throw new Error("Live gold price unavailable.");
  }

  const price = latestPrice.prices[karat]?.[currency];

  if (!price) {
    throw new Error("Invalid gold karat or currency.");
  }

  return price;
};

// ======================================================
// BUY DIGITAL GOLD
// POST /api/v1/gold/buy
// ======================================================

export const buyDigitalGold = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      karat,
      currency,
      grams,
    } = req.body;

    if (!["K24", "K22", "K21", "K18"].includes(karat)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gold karat.",
      });
    }

    if (!GOLD_PAYMENT_CURRENCIES.includes(currency)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported payment currency.",
      });
    }

    if (!grams || grams <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid gold quantity.",
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

    const gramPrice = await getGoldGramPrice(
      karat,
      currency
    );

    const totalAmount = Number(
      (grams * gramPrice).toFixed(2)
    );

    // Check balance
    if (currency === "USDT") {
      if (wallet.cryptoBalances.USDT < totalAmount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient USDT balance.",
        });
      }

      wallet.cryptoBalances.USDT -= totalAmount;
    } else {
      if (wallet.balances[currency] < totalAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${currency} balance.`,
        });
      }

      wallet.balances[currency] -= totalAmount;
    }

    // Update Gold Wallet
    wallet.goldBalance.totalGrams += grams;
    wallet.goldBalance.availableGrams += grams;

    // Update Portfolio
    portfolio.goldHoldings.totalGrams += grams;
    portfolio.goldHoldings[karat] += grams;

    portfolio.purchaseHistory.push({
      karat,
      grams,
      pricePerGram: gramPrice,
      currency,
      totalAmount,
      purchasedAt: new Date(),
    });

    const reference = generateGoldOrderReference();

    await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "BUY_GOLD",
      providerReference: reference,
      currency,
      amount: totalAmount,
      goldKarat: karat,
      goldGrams: grams,
      goldPricePerGram: gramPrice,
      status: "COMPLETED",
      description: `Purchased ${grams}g ${karat} gold`,
    });

    await wallet.save();
    await portfolio.save();

    return res.status(201).json({
      success: true,
      message: "Gold purchased successfully.",

      purchase: {
        reference,
        karat,
        grams,
        pricePerGram: gramPrice,
        currency,
        totalAmount,
      },

      walletBalance:
        currency === "USDT"
          ? wallet.cryptoBalances.USDT
          : wallet.balances[currency],

      goldBalance: wallet.goldBalance,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// BUY GOLD PREVIEW
// POST /api/v1/gold/buy/preview
// ======================================================

export const previewGoldPurchase = async (
  req: Request,
  res: Response
) => {
  try {
    const { karat, currency, grams } = req.body;

    const gramPrice = await getGoldGramPrice(
      karat,
      currency
    );

    const totalAmount = Number(
      (grams * gramPrice).toFixed(2)
    );

    return res.json({
      success: true,

      preview: {
        karat,
        grams,
        currency,
        pricePerGram: gramPrice,
        totalAmount,
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
// GET USER GOLD PURCHASE HISTORY
// GET /api/v1/gold/purchases
// ======================================================

export const getGoldPurchaseHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const purchases = await Transaction.find({
      wallet: wallet._id,
      transactionType: "BUY_GOLD",
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      total: purchases.length,
      purchases,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET CURRENT GOLD HOLDINGS
// GET /api/v1/gold/holdings
// ======================================================

export const getGoldHoldings = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    return res.json({
      success: true,

      holdings: {
        walletGold: wallet.goldBalance,
        portfolio: portfolio.goldHoldings,
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
// GET GOLD PURCHASE SUMMARY
// GET /api/v1/gold/purchase-summary
// ======================================================

export const getGoldPurchaseSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const purchases = portfolio.purchaseHistory;

    const totalSpent = purchases.reduce(
      (sum: number, item: any) => sum + item.totalAmount,
      0
    );

    const totalGrams = purchases.reduce(
      (sum: number, item: any) => sum + item.grams,
      0
    );

    return res.json({
      success: true,

      summary: {
        totalPurchases: purchases.length,
        totalGrams,
        totalSpent,
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
// SECTION 2/10 END
// ======================================================// ======================================================
// SECTION 3/10 START
// SELL DIGITAL GOLD ENGINE
// ======================================================

// ======================================================
// CALCULATE CURRENT GOLD VALUE
// ======================================================

const calculateGoldSellValue = async (
  karat: string,
  currency: string,
  grams: number
) => {
  const latestPrice = await GoldPrice.findOne().sort({
    createdAt: -1,
  });

  if (!latestPrice) {
    throw new Error("Live gold price unavailable.");
  }

  const currentPrice = latestPrice.prices[karat]?.[currency];

  if (!currentPrice) {
    throw new Error("Invalid karat or currency.");
  }

  return {
    pricePerGram: currentPrice,
    totalAmount: Number((currentPrice * grams).toFixed(2)),
  };
};

// ======================================================
// SELL DIGITAL GOLD
// POST /api/v1/gold/sell
// ======================================================

export const sellDigitalGold = async (
  req: Request,
  res: Response
) => {
  try {
    const { karat, currency, grams } = req.body;

    if (!["K24", "K22", "K21", "K18"].includes(karat)) {
      return res.status(400).json({
        success: false,
        message: "Invalid gold karat.",
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

    if (wallet.goldBalance.availableGrams < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient gold balance.",
      });
    }

    if (portfolio.goldHoldings[karat] < grams) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${karat} holdings.`,
      });
    }

    const currentValue = await calculateGoldSellValue(
      karat,
      currency,
      grams
    );

    // Average Buy Price
    const buyHistory = portfolio.purchaseHistory.filter(
      (item: any) => item.karat === karat
    );

    let averageBuyPrice = 0;

    if (buyHistory.length > 0) {
      const totalSpent = buyHistory.reduce(
        (sum: number, item: any) =>
          sum + item.pricePerGram * item.grams,
        0
      );

      const totalGramsBought = buyHistory.reduce(
        (sum: number, item: any) => sum + item.grams,
        0
      );

      averageBuyPrice = totalSpent / totalGramsBought;
    }

    const purchaseValue = Number(
      (averageBuyPrice * grams).toFixed(2)
    );

    const profitLoss = Number(
      (currentValue.totalAmount - purchaseValue).toFixed(2)
    );

    // Update Wallet Gold
    wallet.goldBalance.totalGrams -= grams;
    wallet.goldBalance.availableGrams -= grams;

    // Credit Wallet Currency
    if (currency === "USDT") {
      wallet.cryptoBalances.USDT += currentValue.totalAmount;
    } else {
      wallet.balances[currency] += currentValue.totalAmount;
    }

    // Update Portfolio
    portfolio.goldHoldings.totalGrams -= grams;
    portfolio.goldHoldings[karat] -= grams;

    portfolio.sellHistory.push({
      karat,
      grams,
      currency,
      soldPricePerGram: currentValue.pricePerGram,
      totalReceived: currentValue.totalAmount,
      averageBuyPrice,
      profitLoss,
      soldAt: new Date(),
    });

    const reference = generateGoldOrderReference();

    await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "SELL_GOLD",
      providerReference: reference,
      currency,
      amount: currentValue.totalAmount,
      goldKarat: karat,
      goldGrams: grams,
      goldPricePerGram: currentValue.pricePerGram,
      profitLoss,
      status: "COMPLETED",
      description: `Sold ${grams}g ${karat} gold`,
    });

    await wallet.save();
    await portfolio.save();

    return res.json({
      success: true,

      sale: {
        reference,
        karat,
        grams,
        currency,
        sellPricePerGram: currentValue.pricePerGram,
        totalReceived: currentValue.totalAmount,
        averageBuyPrice,
        purchaseValue,
        profitLoss,
      },

      walletBalance:
        currency === "USDT"
          ? wallet.cryptoBalances.USDT
          : wallet.balances[currency],

      goldBalance: wallet.goldBalance,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SELL PREVIEW
// POST /api/v1/gold/sell/preview
// ======================================================

export const previewGoldSell = async (
  req: Request,
  res: Response
) => {
  try {
    const { karat, currency, grams } = req.body;

    const currentValue = await calculateGoldSellValue(
      karat,
      currency,
      grams
    );

    return res.json({
      success: true,

      preview: {
        karat,
        grams,
        currency,
        sellPricePerGram: currentValue.pricePerGram,
        totalReceived: currentValue.totalAmount,
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
// SELL HISTORY
// GET /api/v1/gold/sales
// ======================================================

export const getGoldSalesHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const sales = await Transaction.find({
      wallet: wallet._id,
      transactionType: "SELL_GOLD",
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      total: sales.length,
      sales,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// PROFIT / LOSS SUMMARY
// GET /api/v1/gold/profit-loss
// ======================================================

export const getGoldProfitLoss = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const sales = portfolio.sellHistory;

    const totalProfit = sales.reduce(
      (sum: number, sale: any) =>
        sale.profitLoss > 0
          ? sum + sale.profitLoss
          : sum,
      0
    );

    const totalLoss = sales.reduce(
      (sum: number, sale: any) =>
        sale.profitLoss < 0
          ? sum + Math.abs(sale.profitLoss)
          : sum,
      0
    );

    return res.json({
      success: true,

      summary: {
        totalSales: sales.length,
        totalProfit,
        totalLoss,
        netProfit: Number(
          (totalProfit - totalLoss).toFixed(2)
        ),
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
// GOLD TRADE HISTORY (BUY + SELL)
// GET /api/v1/gold/trades
// ======================================================

export const getGoldTradeHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const trades = await Transaction.find({
      wallet: wallet._id,
      transactionType: {
        $in: ["BUY_GOLD", "SELL_GOLD"],
      },
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      total: trades.length,
      trades,
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
// SECTION 4/10 START
// GOLD VAULT TRANSFER + GIFT ENGINE
// ======================================================

// ======================================================
// GENERATE GOLD VAULT REFERENCE
// ======================================================

const generateVaultReference = () => {
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `GTV-${Date.now()}-${random}`;
};

// ======================================================
// TRANSFER GOLD TO ANOTHER USER
// POST /api/v1/gold/transfer
// ======================================================

export const transferGold = async (req: Request, res: Response) => {
  try {
    const { receiverUsername, karat, grams, note } = req.body;

    if (!receiverUsername || !grams || grams <= 0) {
      return res.status(400).json({
        success: false,
        message: "Receiver username and grams are required."
      });
    }

    const sender = await User.findById(req.user.id);
    const receiver = await User.findOne({ username: receiverUsername });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found."
      });
    }

    if (String(receiver._id) === String(sender._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot transfer gold to yourself."
      });
    }

    const senderWallet = await Wallet.findOne({ user: sender._id });
    const receiverWallet = await Wallet.findOne({ user: receiver._id });

    const senderPortfolio = await Portfolio.findOne({ user: sender._id });
    const receiverPortfolio = await Portfolio.findOne({ user: receiver._id });

    if (
      !senderWallet ||
      !receiverWallet ||
      !senderPortfolio ||
      !receiverPortfolio
    ) {
      return res.status(404).json({
        success: false,
        message: "Wallet or portfolio not found."
      });
    }

    if (senderWallet.goldBalance.availableGrams < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient available gold."
      });
    }

    if (senderPortfolio.goldHoldings[karat] < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient gold holdings."
      });
    }

    const reference = generateVaultReference();

    // Sender update
    senderWallet.goldBalance.totalGrams -= grams;
    senderWallet.goldBalance.availableGrams -= grams;
    senderPortfolio.goldHoldings.totalGrams -= grams;
    senderPortfolio.goldHoldings[karat] -= grams;

    // Receiver update
    receiverWallet.goldBalance.totalGrams += grams;
    receiverWallet.goldBalance.availableGrams += grams;
    receiverPortfolio.goldHoldings.totalGrams += grams;
    receiverPortfolio.goldHoldings[karat] += grams;

    await senderWallet.save();
    await receiverWallet.save();
    await senderPortfolio.save();
    await receiverPortfolio.save();

    await Transaction.create({
      user: sender._id,
      wallet: senderWallet._id,
      transactionType: "GOLD_TRANSFER_SENT",
      providerReference: reference,
      goldKarat: karat,
      goldGrams: grams,
      receiverUser: receiver._id,
      status: "COMPLETED",
      description: note || `Gold transferred to ${receiver.username}`
    });

    await Transaction.create({
      user: receiver._id,
      wallet: receiverWallet._id,
      transactionType: "GOLD_TRANSFER_RECEIVED",
      providerReference: reference,
      goldKarat: karat,
      goldGrams: grams,
      senderUser: sender._id,
      status: "COMPLETED",
      description: note || `Gold received from ${sender.username}`
    });

    return res.json({
      success: true,
      message: "Gold transferred successfully.",
      reference
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// GIFT GOLD
// POST /api/v1/gold/gift
// ======================================================

export const giftGold = async (req: Request, res: Response) => {
  try {
    const { receiverUsername, karat, grams, message } = req.body;

    const giftReference = generateVaultReference();

    await transferGold(req, res);

    await Transaction.create({
      user: req.user.id,
      transactionType: "GOLD_GIFT",
      providerReference: giftReference,
      goldKarat: karat,
      goldGrams: grams,
      status: "COMPLETED",
      description: message || "Gold Gift"
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// LOCK GOLD IN VAULT
// POST /api/v1/gold/vault/lock
// ======================================================

export const lockGoldInVault = async (
  req: Request,
  res: Response
) => {
  try {
    const { grams } = req.body;

    const wallet = await Wallet.findOne({
      user: req.user.id
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found."
      });
    }

    if (wallet.goldBalance.availableGrams < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient available gold."
      });
    }

    wallet.goldBalance.availableGrams -= grams;
    wallet.goldBalance.lockedGrams += grams;

    await wallet.save();

    return res.json({
      success: true,
      message: "Gold locked successfully.",
      goldBalance: wallet.goldBalance
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// UNLOCK GOLD FROM VAULT
// POST /api/v1/gold/vault/unlock
// ======================================================

export const unlockGoldFromVault = async (
  req: Request,
  res: Response
) => {
  try {
    const { grams } = req.body;

    const wallet = await Wallet.findOne({
      user: req.user.id
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found."
      });
    }

    if (wallet.goldBalance.lockedGrams < grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient locked gold."
      });
    }

    wallet.goldBalance.lockedGrams -= grams;
    wallet.goldBalance.availableGrams += grams;

    await wallet.save();

    return res.json({
      success: true,
      message: "Gold unlocked successfully.",
      goldBalance: wallet.goldBalance
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// GET VAULT STATUS
// GET /api/v1/gold/vault/status
// ======================================================

export const getVaultStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id
    }).select("goldBalance");

    return res.json({
      success: true,
      vault: wallet?.goldBalance
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// GOLD TRANSFER HISTORY
// GET /api/v1/gold/transfers
// ======================================================

export const getGoldTransferHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id
    });

    const transfers = await Transaction.find({
      wallet: wallet?._id,
      transactionType: {
        $in: [
          "GOLD_TRANSFER_SENT",
          "GOLD_TRANSFER_RECEIVED",
          "GOLD_GIFT"
        ]
      }
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      total: transfers.length,
      transfers
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// SECTION 4/10 END
// ======================================================// ======================================================
// SECTION 5/10 START
// GOLD SAVINGS PLAN (SIP) ENGINE
// ======================================================

// ======================================================
// SUPPORTED SIP FREQUENCIES
// ======================================================

const SIP_FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"];

// ======================================================
// CREATE GOLD SAVINGS PLAN
// POST /api/v1/gold/savings-plan
// ======================================================

export const createGoldSavingsPlan = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      frequency,
      currency,
      investmentAmount,
      karat,
      startDate,
    } = req.body;

    if (!SIP_FREQUENCIES.includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SIP frequency.",
      });
    }

    if (!GOLD_PAYMENT_CURRENCIES.includes(currency)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported currency.",
      });
    }

    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found.",
      });
    }

    const plan = {
      planId: generateGoldOrderReference(),
      frequency,
      currency,
      investmentAmount,
      karat,
      status: "ACTIVE",
      totalInvested: 0,
      totalGoldPurchased: 0,
      startDate: startDate ? new Date(startDate) : new Date(),
      nextExecutionDate: startDate
        ? new Date(startDate)
        : new Date(),
      createdAt: new Date(),
    };

    portfolio.savingsPlans.push(plan);
    await portfolio.save();

    return res.status(201).json({
      success: true,
      message: "Gold Savings Plan created successfully.",
      plan,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET USER SAVINGS PLANS
// GET /api/v1/gold/savings-plans
// ======================================================

export const getSavingsPlans = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    }).select("savingsPlans");

    return res.json({
      success: true,
      totalPlans: portfolio?.savingsPlans.length || 0,
      plans: portfolio?.savingsPlans || [],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// EXECUTE SIP PURCHASE
// INTERNAL FUNCTION
// ======================================================

export const executeSavingsPlanPurchase = async (
  planId: string,
  userId: string
) => {
  const wallet = await Wallet.findOne({ user: userId });
  const portfolio = await Portfolio.findOne({ user: userId });

  if (!wallet || !portfolio) return;

  const plan = portfolio.savingsPlans.find(
    (p: any) => p.planId === planId
  );

  if (!plan || plan.status !== "ACTIVE") return;

  const gramPrice = await getGoldGramPrice(
    plan.karat,
    plan.currency
  );

  const grams = Number(
    (plan.investmentAmount / gramPrice).toFixed(4)
  );

  // Deduct Wallet
  if (plan.currency === "USDT") {
    if (wallet.cryptoBalances.USDT < plan.investmentAmount) return;
    wallet.cryptoBalances.USDT -= plan.investmentAmount;
  } else {
    if (wallet.balances[plan.currency] < plan.investmentAmount)
      return;
    wallet.balances[plan.currency] -= plan.investmentAmount;
  }

  // Credit Gold
  wallet.goldBalance.totalGrams += grams;
  wallet.goldBalance.availableGrams += grams;

  portfolio.goldHoldings.totalGrams += grams;
  portfolio.goldHoldings[plan.karat] += grams;

  plan.totalInvested += plan.investmentAmount;
  plan.totalGoldPurchased += grams;
  plan.lastExecutionDate = new Date();

  // Next Execution Date
  const nextDate = new Date(plan.lastExecutionDate);

  if (plan.frequency === "DAILY") nextDate.setDate(nextDate.getDate() + 1);
  if (plan.frequency === "WEEKLY") nextDate.setDate(nextDate.getDate() + 7);
  if (plan.frequency === "MONTHLY") nextDate.setMonth(nextDate.getMonth() + 1);

  plan.nextExecutionDate = nextDate;

  await wallet.save();
  await portfolio.save();

  await Transaction.create({
    user: userId,
    wallet: wallet._id,
    transactionType: "SIP_GOLD_PURCHASE",
    currency: plan.currency,
    amount: plan.investmentAmount,
    goldKarat: plan.karat,
    goldGrams: grams,
    goldPricePerGram: gramPrice,
    providerReference: plan.planId,
    status: "COMPLETED",
    description: `${plan.frequency} Gold Savings Plan Purchase`,
  });
};

// ======================================================
// PAUSE SAVINGS PLAN
// PATCH /api/v1/gold/savings-plan/:planId/pause
// ======================================================

export const pauseSavingsPlan = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const plan = portfolio?.savingsPlans.find(
      (item: any) => item.planId === req.params.planId
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Savings plan not found.",
      });
    }

    plan.status = "PAUSED";

    await portfolio.save();

    return res.json({
      success: true,
      message: "Savings plan paused successfully.",
      plan,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// RESUME SAVINGS PLAN
// PATCH /api/v1/gold/savings-plan/:planId/resume
// ======================================================

export const resumeSavingsPlan = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const plan = portfolio?.savingsPlans.find(
      (item: any) => item.planId === req.params.planId
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Savings plan not found.",
      });
    }

    plan.status = "ACTIVE";

    await portfolio.save();

    return res.json({
      success: true,
      message: "Savings plan resumed successfully.",
      plan,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CANCEL SAVINGS PLAN
// DELETE /api/v1/gold/savings-plan/:planId
// ======================================================

export const cancelSavingsPlan = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    portfolio.savingsPlans = portfolio.savingsPlans.filter(
      (plan: any) => plan.planId !== req.params.planId
    );

    await portfolio.save();

    return res.json({
      success: true,
      message: "Savings plan cancelled successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SAVINGS PLAN SUMMARY
// GET /api/v1/gold/savings-plan/:planId
// ======================================================

export const getSavingsPlanSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const plan = portfolio?.savingsPlans.find(
      (item: any) => item.planId === req.params.planId
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Savings plan not found.",
      });
    }

    return res.json({
      success: true,
      plan,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 5/10 END
// ======================================================// ======================================================
// SECTION 6/10 START
// AUTO GOLD INVEST + SIP SCHEDULER ENGINE
// ======================================================

// ======================================================
// GET NEXT EXECUTION DATE
// ======================================================

const getNextExecutionDate = (
  frequency: "DAILY" | "WEEKLY" | "MONTHLY",
  currentDate: Date
): Date => {
  const next = new Date(currentDate);

  switch (frequency) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;

    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;

    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next;
};

// ======================================================
// AUTO EXECUTE ALL ACTIVE SIP PLANS
// INTERNAL SCHEDULER FUNCTION
// ======================================================

export const executePendingSavingsPlans = async () => {
  try {
    const portfolios = await Portfolio.find({
      "savingsPlans.status": "ACTIVE",
    });

    const today = new Date();

    for (const portfolio of portfolios) {
      for (const plan of portfolio.savingsPlans) {
        if (
          plan.status !== "ACTIVE" ||
          plan.nextExecutionDate > today
        ) {
          continue;
        }

        try {
          await executeSavingsPlanPurchase(
            plan.planId,
            String(portfolio.user)
          );

          plan.totalExecutions += 1;
          plan.lastExecutionStatus = "SUCCESS";
          plan.nextExecutionDate = getNextExecutionDate(
            plan.frequency,
            today
          );

        } catch (error: any) {
          plan.failedExecutions += 1;
          plan.lastExecutionStatus = "FAILED";
          plan.lastFailureReason = error.message;
        }
      }

      await portfolio.save();
    }

    return true;

  } catch (error) {
    console.error("Savings Plan Scheduler Error:", error);
    return false;
  }
};

// ======================================================
// EXECUTE SINGLE SIP MANUALLY
// POST /api/v1/gold/savings-plan/:planId/execute
// ======================================================

export const executeSavingsPlanNow = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const plan = portfolio?.savingsPlans.find(
      (item: any) => item.planId === req.params.planId
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Savings plan not found.",
      });
    }

    if (plan.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Savings plan is not active.",
      });
    }

    await executeSavingsPlanPurchase(
      plan.planId,
      req.user.id
    );

    return res.json({
      success: true,
      message: "Savings plan executed successfully.",
      nextExecutionDate: plan.nextExecutionDate,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// MISSED PAYMENT RETRY
// POST /api/v1/gold/savings-plan/:planId/retry
// ======================================================

export const retryFailedSavingsPlan = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const plan = portfolio?.savingsPlans.find(
      (item: any) => item.planId === req.params.planId
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Savings plan not found.",
      });
    }

    if (plan.lastExecutionStatus !== "FAILED") {
      return res.status(400).json({
        success: false,
        message: "No failed execution available.",
      });
    }

    await executeSavingsPlanPurchase(
      plan.planId,
      req.user.id
    );

    plan.lastExecutionStatus = "SUCCESS";
    plan.lastFailureReason = "";
    plan.nextExecutionDate = getNextExecutionDate(
      plan.frequency,
      new Date()
    );

    await portfolio.save();

    return res.json({
      success: true,
      message: "Failed SIP payment retried successfully.",
      plan,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET SIP EXECUTION HISTORY
// GET /api/v1/gold/savings-plan/:planId/history
// ======================================================

export const getSavingsPlanExecutionHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const history = await Transaction.find({
      wallet: wallet?._id,
      transactionType: "SIP_GOLD_PURCHASE",
      providerReference: req.params.planId,
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      totalExecutions: history.length,
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
// GET ALL UPCOMING SIP EXECUTIONS
// GET /api/v1/gold/savings-plan/upcoming
// ======================================================

export const getUpcomingSavingsExecutions = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const upcomingPlans =
      portfolio?.savingsPlans
        .filter((plan: any) => plan.status === "ACTIVE")
        .sort(
          (a: any, b: any) =>
            new Date(a.nextExecutionDate).getTime() -
            new Date(b.nextExecutionDate).getTime()
        ) || [];

    return res.json({
      success: true,
      totalUpcoming: upcomingPlans.length,
      upcomingPlans,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// AUTO DEBIT PREVIEW
// GET /api/v1/gold/savings-plan/:planId/debit-preview
// ======================================================

export const getSavingsPlanDebitPreview = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const plan = portfolio?.savingsPlans.find(
      (item: any) => item.planId === req.params.planId
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Savings plan not found.",
      });
    }

    const gramPrice = await getGoldGramPrice(
      plan.karat,
      plan.currency
    );

    const estimatedGold = Number(
      (plan.investmentAmount / gramPrice).toFixed(4)
    );

    return res.json({
      success: true,

      preview: {
        investmentAmount: plan.investmentAmount,
        currency: plan.currency,
        karat: plan.karat,
        estimatedGoldGrams: estimatedGold,
        currentGoldPrice: gramPrice,
        nextExecutionDate: plan.nextExecutionDate,
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
// ADMIN RUN SIP QUEUE
// POST /api/v1/admin/gold/run-scheduler
// ======================================================

export const runSavingsScheduler = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    await executePendingSavingsPlans();

    return res.json({
      success: true,
      message: "Gold Savings Scheduler executed successfully.",
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
// SECTION 6/10 END
// ======================================================// ======================================================
// SECTION 7/10 START
// PHYSICAL GOLD REDEMPTION ENGINE
// ======================================================

// ======================================================
// SUPPORTED PHYSICAL PRODUCTS
// ======================================================

const GOLD_REDEMPTION_PRODUCTS = [
  { code: "BAR_1G", name: "1 Gram Gold Bar", grams: 1 },
  { code: "BAR_2G", name: "2 Gram Gold Bar", grams: 2 },
  { code: "BAR_5G", name: "5 Gram Gold Bar", grams: 5 },
  { code: "BAR_10G", name: "10 Gram Gold Bar", grams: 10 },
  { code: "BAR_20G", name: "20 Gram Gold Bar", grams: 20 },
  { code: "BAR_50G", name: "50 Gram Gold Bar", grams: 50 },
  { code: "BAR_100G", name: "100 Gram Gold Bar", grams: 100 },
  { code: "COIN_1G", name: "1 Gram Gold Coin", grams: 1 },
  { code: "COIN_5G", name: "5 Gram Gold Coin", grams: 5 },
  { code: "COIN_10G", name: "10 Gram Gold Coin", grams: 10 },
];

// ======================================================
// DELIVERY METHODS
// ======================================================

const DELIVERY_METHODS = [
  "HOME_DELIVERY",
  "STORE_PICKUP",
  "VAULT_PICKUP",
];

// ======================================================
// GENERATE REDEMPTION REFERENCE
// ======================================================

const generateRedemptionReference = () => {
  const random = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `GTR-${Date.now()}-${random}`;
};

// ======================================================
// CREATE PHYSICAL GOLD REDEMPTION
// POST /api/v1/gold/redeem
// ======================================================

export const redeemPhysicalGold = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      productCode,
      deliveryMethod,
      shippingAddress,
      city,
      country,
      postalCode,
      phoneNumber,
    } = req.body;

    const product = GOLD_REDEMPTION_PRODUCTS.find(
      (item) => item.code === productCode
    );

    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Invalid redemption product.",
      });
    }

    if (!DELIVERY_METHODS.includes(deliveryMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery method.",
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

    if (wallet.goldBalance.availableGrams < product.grams) {
      return res.status(400).json({
        success: false,
        message: "Insufficient available gold balance.",
      });
    }

    const shippingFee = deliveryMethod === "HOME_DELIVERY" ? 2500 : 0;
    const handlingFee = 500;

    wallet.goldBalance.availableGrams -= product.grams;
    wallet.goldBalance.lockedGrams += product.grams;

    const reference = generateRedemptionReference();

    const redemption = {
      reference,
      productCode: product.code,
      productName: product.name,
      grams: product.grams,
      deliveryMethod,
      shippingAddress,
      city,
      country,
      postalCode,
      phoneNumber,
      shippingFee,
      handlingFee,
      status: "PENDING",
      createdAt: new Date(),
    };

    portfolio.redemptionHistory.push(redemption);

    await wallet.save();
    await portfolio.save();

    await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "GOLD_REDEMPTION_REQUEST",
      providerReference: reference,
      goldGrams: product.grams,
      status: "PENDING",
      description: `Physical Gold Redemption (${product.name})`,
    });

    return res.status(201).json({
      success: true,
      message: "Gold redemption request submitted.",
      redemption,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET USER REDEMPTION HISTORY
// GET /api/v1/gold/redemptions
// ======================================================

export const getRedemptionHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    }).select("redemptionHistory");

    return res.json({
      success: true,
      total: portfolio?.redemptionHistory.length || 0,
      history: portfolio?.redemptionHistory || [],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET REDEMPTION STATUS
// GET /api/v1/gold/redemption/:reference
// ======================================================

export const getRedemptionStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const redemption = portfolio?.redemptionHistory.find(
      (item: any) => item.reference === req.params.reference
    );

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: "Redemption request not found.",
      });
    }

    return res.json({
      success: true,
      redemption,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// TRACK SHIPMENT
// GET /api/v1/gold/shipment/:reference
// ======================================================

export const trackGoldShipment = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const redemption = portfolio?.redemptionHistory.find(
      (item: any) => item.reference === req.params.reference
    );

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: "Shipment not found.",
      });
    }

    return res.json({
      success: true,

      shipment: {
        reference: redemption.reference,
        status: redemption.status,
        trackingNumber: redemption.trackingNumber || null,
        courier: redemption.courier || null,
        estimatedDelivery: redemption.estimatedDelivery || null,
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
// CANCEL REDEMPTION REQUEST
// DELETE /api/v1/gold/redemption/:reference
// ======================================================

export const cancelRedemptionRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const redemption = portfolio?.redemptionHistory.find(
      (item: any) => item.reference === req.params.reference
    );

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: "Redemption request not found.",
      });
    }

    if (redemption.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending requests can be cancelled.",
      });
    }

    wallet.goldBalance.availableGrams += redemption.grams;
    wallet.goldBalance.lockedGrams -= redemption.grams;

    redemption.status = "CANCELLED";
    redemption.cancelledAt = new Date();

    await wallet.save();
    await portfolio.save();

    return res.json({
      success: true,
      message: "Redemption request cancelled successfully.",
      goldBalance: wallet.goldBalance,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN UPDATE REDEMPTION STATUS
// PATCH /api/v1/admin/gold/redemption/:reference/status
// ======================================================

export const updateRedemptionStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const { status, trackingNumber, courier } = req.body;

    const portfolio = await Portfolio.findOne({
      "redemptionHistory.reference": req.params.reference,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Redemption request not found.",
      });
    }

    const redemption = portfolio.redemptionHistory.find(
      (item: any) => item.reference === req.params.reference
    );

    redemption.status = status;
    redemption.trackingNumber = trackingNumber;
    redemption.courier = courier;
    redemption.updatedAt = new Date();

    if (status === "DELIVERED") {
      const wallet = await Wallet.findOne({
        user: portfolio.user,
      });

      wallet.goldBalance.lockedGrams -= redemption.grams;
      wallet.goldBalance.totalGrams -= redemption.grams;

      await wallet.save();
    }

    await portfolio.save();

    return res.json({
      success: true,
      message: "Redemption status updated successfully.",
      redemption,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET AVAILABLE REDEMPTION PRODUCTS
// GET /api/v1/gold/redemption-products
// ======================================================

export const getRedemptionProducts = async (
  req: Request,
  res: Response
) => {
  return res.json({
    success: true,
    products: GOLD_REDEMPTION_PRODUCTS,
    deliveryMethods: DELIVERY_METHODS,
  });
};

// ======================================================
// SECTION 7/10 END
// ======================================================// ======================================================
// SECTION 8/10 START
// GOLD CERTIFICATE + QR VERIFICATION ENGINE
// ======================================================

// ======================================================
// GENERATE GOLD CERTIFICATE ID
// ======================================================

const generateCertificateId = () => {
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `GTC-${Date.now()}-${random}`;
};

// ======================================================
// GENERATE CERTIFICATE QR CODE VALUE
// ======================================================

const generateCertificateQR = (certificateId: string) => {
  return `GOLDTRADE:${certificateId}`;
};

// ======================================================
// CREATE GOLD CERTIFICATE
// POST /api/v1/gold/certificate/create
// ======================================================

export const createGoldCertificate = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      transactionReference,
      karat,
      grams,
      purchasePrice,
      currency,
    } = req.body;

    const portfolio = await Portfolio.findOne({ user: req.user.id });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found.",
      });
    }

    const certificateId = generateCertificateId();
    const qrCode = generateCertificateQR(certificateId);

    const certificate = {
      certificateId,
      qrCode,
      hallmark: `999.${karat.replace("K", "")}`,
      transactionReference,
      owner: req.user.id,
      karat,
      grams,
      purchasePrice,
      currency,
      issuedAt: new Date(),
      status: "ACTIVE",
      verificationCount: 0,
    };

    portfolio.goldCertificates.push(certificate);
    await portfolio.save();

    return res.status(201).json({
      success: true,
      message: "Gold certificate generated successfully.",
      certificate,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET USER CERTIFICATES
// GET /api/v1/gold/certificates
// ======================================================

export const getGoldCertificates = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user.id });

    return res.json({
      success: true,
      totalCertificates: portfolio?.goldCertificates.length || 0,
      certificates: portfolio?.goldCertificates || [],
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET SINGLE CERTIFICATE
// GET /api/v1/gold/certificate/:certificateId
// ======================================================

export const getGoldCertificate = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user.id });

    const certificate = portfolio?.goldCertificates.find(
      (item: any) =>
        item.certificateId === req.params.certificateId
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found.",
      });
    }

    return res.json({
      success: true,
      certificate,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// VERIFY GOLD CERTIFICATE (PUBLIC)
// GET /api/v1/gold/certificate/verify/:certificateId
// ======================================================

export const verifyGoldCertificate = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      "goldCertificates.certificateId": req.params.certificateId,
    }).populate("user", "username fullName");

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found.",
      });
    }

    const certificate = portfolio.goldCertificates.find(
      (item: any) =>
        item.certificateId === req.params.certificateId
    );

    certificate.verificationCount += 1;
    certificate.lastVerifiedAt = new Date();

    await portfolio.save();

    return res.json({
      success: true,

      verification: {
        valid: certificate.status === "ACTIVE",
        certificateId: certificate.certificateId,
        owner: portfolio.user,
        karat: certificate.karat,
        grams: certificate.grams,
        hallmark: certificate.hallmark,
        issuedAt: certificate.issuedAt,
        verificationCount: certificate.verificationCount,
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
// VERIFY USING QR VALUE
// POST /api/v1/gold/certificate/verify-qr
// ======================================================

export const verifyCertificateQR = async (
  req: Request,
  res: Response
) => {
  try {
    const { qrCode } = req.body;

    if (!qrCode.startsWith("GOLDTRADE:")) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR code.",
      });
    }

    const certificateId = qrCode.replace("GOLDTRADE:", "");

    req.params.certificateId = certificateId;

    return verifyGoldCertificate(req, res);

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DOWNLOAD CERTIFICATE DATA
// GET /api/v1/gold/certificate/:certificateId/download
// ======================================================

export const downloadGoldCertificate = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.user.id });

    const certificate = portfolio?.goldCertificates.find(
      (item: any) =>
        item.certificateId === req.params.certificateId
    );

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found.",
      });
    }

    return res.json({
      success: true,

      certificatePDFData: {
        title: "GoldTrade Digital Gold Certificate",
        certificateId: certificate.certificateId,
        qrCode: certificate.qrCode,
        hallmark: certificate.hallmark,
        owner: req.user.id,
        karat: certificate.karat,
        grams: certificate.grams,
        purchasePrice: certificate.purchasePrice,
        currency: certificate.currency,
        issuedAt: certificate.issuedAt,
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
// REVOKE CERTIFICATE (ADMIN)
// PATCH /api/v1/admin/gold/certificate/:certificateId/revoke
// ======================================================

export const revokeGoldCertificate = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const portfolio = await Portfolio.findOne({
      "goldCertificates.certificateId": req.params.certificateId,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found.",
      });
    }

    const certificate = portfolio.goldCertificates.find(
      (item: any) =>
        item.certificateId === req.params.certificateId
    );

    certificate.status = "REVOKED";
    certificate.revokedAt = new Date();
    certificate.revokeReason =
      req.body.reason || "Revoked by administrator.";

    await portfolio.save();

    return res.json({
      success: true,
      message: "Certificate revoked successfully.",
      certificate,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CERTIFICATE VERIFICATION HISTORY
// GET /api/v1/gold/certificate-history
// ======================================================

export const getCertificateVerificationHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const history = portfolio?.goldCertificates.map(
      (certificate: any) => ({
        certificateId: certificate.certificateId,
        verificationCount: certificate.verificationCount,
        lastVerifiedAt: certificate.lastVerifiedAt,
        status: certificate.status,
      })
    );

    return res.json({
      success: true,
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
// SECTION 8/10 END
// ======================================================// ======================================================
// SECTION 9/10 START
// GOLD PORTFOLIO ANALYTICS ENGINE
// ======================================================

// ======================================================
// CALCULATE CURRENT PORTFOLIO VALUE
// ======================================================

const calculatePortfolioMarketValue = async (portfolio: any) => {
  const latestPrice = await GoldPrice.findOne().sort({ createdAt: -1 });

  if (!latestPrice) throw new Error("Gold price unavailable.");

  const holdings = portfolio.goldHoldings;

  const values = {
    K24: holdings.K24 * latestPrice.prices.K24.PKR,
    K22: holdings.K22 * latestPrice.prices.K22.PKR,
    K21: holdings.K21 * latestPrice.prices.K21.PKR,
    K18: holdings.K18 * latestPrice.prices.K18.PKR,
  };

  return {
    ...values,
    total: values.K24 + values.K22 + values.K21 + values.K18,
  };
};

// ======================================================
// GET GOLD PORTFOLIO DASHBOARD
// GET /api/v1/gold/portfolio/dashboard
// ======================================================

export const getGoldPortfolioDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: "Portfolio not found.",
      });
    }

    const marketValue = await calculatePortfolioMarketValue(
      portfolio
    );

    const totalInvestment = portfolio.purchaseHistory.reduce(
      (sum: number, item: any) => sum + item.totalAmount,
      0
    );

    const totalProfitLoss = Number(
      (marketValue.total - totalInvestment).toFixed(2)
    );

    const roi =
      totalInvestment > 0
        ? Number(
            (
              (totalProfitLoss / totalInvestment) *
              100
            ).toFixed(2)
          )
        : 0;

    return res.json({
      success: true,

      dashboard: {
        totalInvestment,
        currentMarketValue: marketValue.total,
        totalProfitLoss,
        roiPercentage: roi,
        totalGrams: portfolio.goldHoldings.totalGrams,
        holdings: portfolio.goldHoldings,
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
// HOLDINGS BREAKDOWN
// GET /api/v1/gold/portfolio/breakdown
// ======================================================

export const getGoldHoldingsBreakdown = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const marketValue = await calculatePortfolioMarketValue(
      portfolio
    );

    return res.json({
      success: true,

      breakdown: [
        {
          karat: "24K",
          grams: portfolio.goldHoldings.K24,
          valuePKR: marketValue.K24,
        },
        {
          karat: "22K",
          grams: portfolio.goldHoldings.K22,
          valuePKR: marketValue.K22,
        },
        {
          karat: "21K",
          grams: portfolio.goldHoldings.K21,
          valuePKR: marketValue.K21,
        },
        {
          karat: "18K",
          grams: portfolio.goldHoldings.K18,
          valuePKR: marketValue.K18,
        },
      ],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// MONTHLY GOLD ANALYTICS
// GET /api/v1/gold/portfolio/monthly
// ======================================================

export const getMonthlyGoldAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const purchases = portfolio.purchaseHistory.filter(
      (item: any) =>
        item.purchasedAt >= startDate &&
        item.purchasedAt <= endDate
    );

    const sales = portfolio.sellHistory.filter(
      (item: any) =>
        item.soldAt >= startDate &&
        item.soldAt <= endDate
    );

    return res.json({
      success: true,

      month,
      year,

      analytics: {
        purchases: purchases.length,
        sales: sales.length,

        purchasedGrams: purchases.reduce(
          (sum: number, item: any) => sum + item.grams,
          0
        ),

        soldGrams: sales.reduce(
          (sum: number, item: any) => sum + item.grams,
          0
        ),

        investedAmount: purchases.reduce(
          (sum: number, item: any) => sum + item.totalAmount,
          0
        ),

        receivedAmount: sales.reduce(
          (sum: number, item: any) => sum + item.totalReceived,
          0
        ),
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
// YEARLY GOLD ANALYTICS
// GET /api/v1/gold/portfolio/yearly
// ======================================================

export const getYearlyGoldAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    const year = Number(req.query.year);

    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const purchases = portfolio.purchaseHistory.filter(
      (item: any) =>
        new Date(item.purchasedAt).getFullYear() === year
    );

    const sales = portfolio.sellHistory.filter(
      (item: any) =>
        new Date(item.soldAt).getFullYear() === year
    );

    return res.json({
      success: true,

      year,

      analytics: {
        purchases: purchases.length,
        sales: sales.length,

        totalInvestment: purchases.reduce(
          (sum: number, item: any) => sum + item.totalAmount,
          0
        ),

        totalReceived: sales.reduce(
          (sum: number, item: any) => sum + item.totalReceived,
          0
        ),

        netProfit: sales.reduce(
          (sum: number, item: any) =>
            sum + item.profitLoss,
          0
        ),
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
// GOLD PERFORMANCE STATISTICS
// GET /api/v1/gold/portfolio/performance
// ======================================================

export const getGoldPerformanceStatistics = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const totalPurchases = portfolio.purchaseHistory.length;
    const totalSales = portfolio.sellHistory.length;

    const winningTrades = portfolio.sellHistory.filter(
      (trade: any) => trade.profitLoss > 0
    ).length;

    const losingTrades = portfolio.sellHistory.filter(
      (trade: any) => trade.profitLoss < 0
    ).length;

    const winRate =
      totalSales > 0
        ? Number(
            ((winningTrades / totalSales) * 100).toFixed(2)
          )
        : 0;

    return res.json({
      success: true,

      statistics: {
        totalPurchases,
        totalSales,
        winningTrades,
        losingTrades,
        winRate,
        averagePurchaseSize:
          totalPurchases > 0
            ? Number(
                (
                  portfolio.purchaseHistory.reduce(
                    (sum: number, item: any) =>
                      sum + item.grams,
                    0
                  ) / totalPurchases
                ).toFixed(4)
              )
            : 0,
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
// TOP WINNING / LOSING TRADES
// GET /api/v1/gold/portfolio/top-trades
// ======================================================

export const getTopGoldTrades = async (
  req: Request,
  res: Response
) => {
  try {
    const portfolio = await Portfolio.findOne({
      user: req.user.id,
    });

    const sorted = [...portfolio.sellHistory].sort(
      (a: any, b: any) =>
        b.profitLoss - a.profitLoss
    );

    return res.json({
      success: true,

      topWinningTrades: sorted.slice(0, 5),

      topLosingTrades: sorted
        .slice()
        .reverse()
        .slice(0, 5),
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GOLD PRICE PERFORMANCE GRAPH DATA
// GET /api/v1/gold/portfolio/chart
// ======================================================

export const getGoldPortfolioChartData = async (
  req: Request,
  res: Response
) => {
  try {
    const history = await GoldPrice.find()
      .sort({ createdAt: 1 })
      .limit(90);

    const chart = history.map((price: any) => ({
      date: price.createdAt,
      K24: price.prices.K24.PKR,
      K22: price.prices.K22.PKR,
      K21: price.prices.K21.PKR,
      K18: price.prices.K18.PKR,
    }));

    return res.json({
      success: true,
      points: chart.length,
      chart,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 9/10 END
// ======================================================// ======================================================
// SECTION 10/10 START
// ENTERPRISE GOLD ADMIN ENGINE
// ======================================================

// ======================================================
// UPDATE LIVE GOLD PRICE (ADMIN)
// PATCH /api/v1/admin/gold/live-price
// ======================================================

export const updateLiveGoldPrice = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN", "SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied."
      });
    }

    const latestPrice = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    if (!latestPrice) {
      return res.status(404).json({
        success: false,
        message: "Gold price record not found."
      });
    }

    latestPrice.prices = req.body.prices || latestPrice.prices;
    latestPrice.exchangeRates =
      req.body.exchangeRates || latestPrice.exchangeRates;

    latestPrice.marketStatus =
      req.body.marketStatus || latestPrice.marketStatus;

    latestPrice.updatedBy = admin._id;
    latestPrice.updatedAt = new Date();

    await latestPrice.save();

    return res.json({
      success: true,
      message: "Live gold price updated successfully.",
      goldPrice: latestPrice,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// CREATE PRICE SNAPSHOT
// POST /api/v1/admin/gold/price-snapshot
// ======================================================

export const createGoldPriceSnapshot = async (
  req: Request,
  res: Response
) => {
  try {
    const latest = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    if (!latest) {
      return res.status(404).json({
        success: false,
        message: "Live price unavailable."
      });
    }

    const snapshot = await GoldPrice.create({
      prices: latest.prices,
      exchangeRates: latest.exchangeRates,
      marketStatus: latest.marketStatus,
      source: req.body.source || "MANUAL",
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      snapshot,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// MARKET OPEN
// POST /api/v1/admin/gold/market/open
// ======================================================

export const openGoldMarket = async (
  req: Request,
  res: Response
) => {
  try {
    const latest = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    latest.marketStatus = "OPEN";
    latest.updatedAt = new Date();

    await latest.save();

    return res.json({
      success: true,
      message: "Gold market opened successfully."
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// MARKET CLOSE
// POST /api/v1/admin/gold/market/close
// ======================================================

export const closeGoldMarket = async (
  req: Request,
  res: Response
) => {
  try {
    const latest = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    latest.marketStatus = "CLOSED";
    latest.updatedAt = new Date();

    await latest.save();

    return res.json({
      success: true,
      message: "Gold market closed successfully."
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// GET GOLD INVENTORY
// GET /api/v1/admin/gold/inventory
// ======================================================

export const getGoldInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallets = await Wallet.find();

    const inventory = wallets.reduce(
      (acc: any, wallet: any) => {
        acc.totalGrams += wallet.goldBalance.totalGrams;
        acc.availableGrams += wallet.goldBalance.availableGrams;
        acc.lockedGrams += wallet.goldBalance.lockedGrams;
        return acc;
      },
      {
        totalGrams: 0,
        availableGrams: 0,
        lockedGrams: 0,
      }
    );

    return res.json({
      success: true,
      inventory,
      totalWallets: wallets.length,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// GET GOLD MARKET AUDIT LOG
// GET /api/v1/admin/gold/audit
// ======================================================

export const getGoldAuditLog = async (
  req: Request,
  res: Response
) => {
  try {
    const transactions = await Transaction.find({
      transactionType: {
        $in: [
          "BUY_GOLD",
          "SELL_GOLD",
          "GOLD_TRANSFER_SENT",
          "GOLD_TRANSFER_RECEIVED",
          "GOLD_REDEMPTION_REQUEST",
          "SIP_GOLD_PURCHASE",
        ],
      },
    })
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json({
      success: true,
      totalRecords: transactions.length,
      auditLog: transactions,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// UPDATE GOLD TRADING LIMITS
// PATCH /api/v1/admin/gold/trading-limits
// ======================================================

export const updateGoldTradingLimits = async (
  req: Request,
  res: Response
) => {
  try {
    const settings = {
      minimumBuyGram: req.body.minimumBuyGram,
      maximumBuyGram: req.body.maximumBuyGram,
      minimumSellGram: req.body.minimumSellGram,
      maximumSellGram: req.body.maximumSellGram,
      redemptionMinimumGram: req.body.redemptionMinimumGram,
      updatedAt: new Date(),
      updatedBy: req.user.id,
    };

    return res.json({
      success: true,
      message: "Trading limits updated successfully.",
      settings,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// GET GOLD MARKET DASHBOARD
// GET /api/v1/admin/gold/dashboard
// ======================================================

export const getGoldAdminDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    const totalBuyOrders = await Transaction.countDocuments({
      transactionType: "BUY_GOLD",
    });

    const totalSellOrders = await Transaction.countDocuments({
      transactionType: "SELL_GOLD",
    });

    const totalRedemptions = await Transaction.countDocuments({
      transactionType: "GOLD_REDEMPTION_REQUEST",
    });

    const pendingRedemptions = await Transaction.countDocuments({
      transactionType: "GOLD_REDEMPTION_REQUEST",
      status: "PENDING",
    });

    const activeCertificates = await Portfolio.aggregate([
      { $unwind: "$goldCertificates" },
      {
        $match: {
          "goldCertificates.status": "ACTIVE",
        },
      },
      { $count: "count" },
    ]);

    return res.json({
      success: true,

      dashboard: {
        totalBuyOrders,
        totalSellOrders,
        totalRedemptions,
        pendingRedemptions,
        activeCertificates:
          activeCertificates[0]?.count || 0,
        generatedAt: new Date(),
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// SYSTEM HEALTH
// GET /api/v1/admin/gold/system-health
// ======================================================

export const getGoldSystemHealth = async (
  req: Request,
  res: Response
) => {
  try {
    const latestPrice = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    const wallets = await Wallet.countDocuments();
    const portfolios = await Portfolio.countDocuments();

    return res.json({
      success: true,

      health: {
        module: "GoldTrade Enterprise Gold Engine",
        version: "17.0.0",
        marketStatus: latestPrice?.marketStatus,
        latestPriceUpdated: latestPrice?.updatedAt,
        totalWallets: wallets,
        totalPortfolios: portfolios,
        supportedKarats: [
          "24K",
          "22K",
          "21K",
          "18K",
        ],
        supportedCurrencies: [
          "PKR",
          "USD",
          "AED",
          "SAR",
          "EUR",
          "GBP",
          "USDT",
        ],
        redemptionProducts: 10,
        timestamp: new Date(),
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// SECTION 10/10 END
// GOLD CONTROLLER COMPLETE
// ======================================================