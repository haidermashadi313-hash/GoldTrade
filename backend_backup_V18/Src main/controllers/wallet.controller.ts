// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/wallet.controller.ts
// SECTION 1/10
// WALLET FOUNDATION + MULTI-CURRENCY DASHBOARD
// ======================================================

import { Request, Response } from "express";
import Wallet from "../models/Wallet";
import Transaction from "../models/Transaction";
import { TransactionStatus } from "../models/Transaction";
import Portfolio from "../models/Portfolio";
import User from "../models/User";
import GoldPrice from "../models/GoldPrice";

// Wallet.goldBalance is stored as a numeric gram balance.
const goldGrams = (balance: number) => ({
  totalGrams: balance,
  availableGrams: balance,
  lockedGrams: 0,
});

// ======================================================
// GET USER WALLET
// GET /api/v1/wallet
// ======================================================

export const getWallet = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.json({
      success: true,
      wallet,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET WALLET DASHBOARD
// GET /api/v1/wallet/dashboard
// ======================================================

export const getWalletDashboard = async (
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

    if (!wallet || !portfolio) {
      return res.status(404).json({
        success: false,
        message: "Wallet data not found.",
      });
    }

    return res.json({
      success: true,

      dashboard: {
        totalBalancePKR: wallet.balances.PKR,
        totalBalanceUSD: wallet.balances.USD,
        totalBalanceAED: wallet.balances.AED,
        totalBalanceSAR: wallet.balances.SAR,
        totalBalanceEUR: wallet.balances.EUR,
        totalBalanceGBP: wallet.balances.GBP,
        totalBalanceUSDT: wallet.balances.USDT,

        goldGrams: goldGrams(wallet.goldBalance).totalGrams,
        availableGold: goldGrams(wallet.goldBalance).availableGrams,
        lockedGold: goldGrams(wallet.goldBalance).lockedGrams,

        portfolioValue:
          portfolio.portfolioValuation.totalValuePKR,

        netWorth: portfolio.wealthSummary.netWorthPKR,

        updatedAt: wallet.updatedAt,
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
// GET MULTI-CURRENCY BALANCES
// GET /api/v1/wallet/balances
// ======================================================

export const getBalances = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    }).select("balances goldBalance");

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.json({
      success: true,

      balances: {
        PKR: wallet.balances.PKR,
        USD: wallet.balances.USD,
        AED: wallet.balances.AED,
        SAR: wallet.balances.SAR,
        EUR: wallet.balances.EUR,
        GBP: wallet.balances.GBP,
        USDT: wallet.balances.USDT,

        gold: goldGrams(wallet.goldBalance),
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
// GET GOLD BALANCE
// GET /api/v1/wallet/gold-balance
// ======================================================

export const getGoldBalance = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    }).select("goldBalance");

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.json({
      success: true,
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
// GET WALLET SUMMARY
// GET /api/v1/wallet/summary
// ======================================================

export const getWalletSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const transactionCount =
      await Transaction.countDocuments({
        wallet: wallet._id,
      });

    const completedTransactions =
      await Transaction.countDocuments({
        wallet: wallet._id,
        status: "COMPLETED",
      });

    return res.json({
      success: true,

      summary: {
        walletStatus: wallet.walletStatus,
        transactionCount,
        completedTransactions,

        totalCashBalance:
          wallet.balances.PKR +
          wallet.balances.USD +
          wallet.balances.AED +
          wallet.balances.SAR +
          wallet.balances.EUR +
          wallet.balances.GBP,

        totalCryptoBalance: wallet.balances.USDT,

        totalGoldGram: wallet.goldBalance,

        availableGold: wallet.goldBalance,

        lockedGold: 0,
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
// WALLET HEALTH CHECK
// GET /api/v1/wallet/health
// ======================================================

export const walletHealth = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.json({
      success: true,

      health: {
        walletStatus: wallet.walletStatus,

        isActive:
          wallet.walletStatus === "ACTIVE",

        availableGold: wallet.goldBalance,

        lockedGold: 0,

        lastUpdated: wallet.updatedAt,

        supportedCurrencies: [
          "PKR",
          "USD",
          "AED",
          "SAR",
          "EUR",
          "GBP",
          "USDT",
        ],
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
// WALLET STATISTICS
// GET /api/v1/wallet/statistics
// ======================================================

export const walletStatistics = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const transactions =
      await Transaction.find({
        wallet: wallet._id,
      }).sort({ createdAt: -1 });

    const deposits = transactions.filter(
      (tx) => tx.transactionType === "DEPOSIT"
    ).length;

    const withdrawals = transactions.filter(
      (tx) => tx.transactionType === "WITHDRAW"
    ).length;

    return res.json({
      success: true,

      statistics: {
        totalTransactions: transactions.length,
        deposits,
        withdrawals,
        currentWalletStatus: wallet.walletStatus,
        updatedAt: wallet.updatedAt,
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
// SECTION 1/10 END
// ======================================================// ======================================================
// SECTION 2/10 START
// PKR DEPOSIT REQUEST ENGINE
// ======================================================

// Supported Deposit Providers
const SUPPORTED_PKR_PROVIDERS = [
  "MEEZAN_BANK",
  "HBL_BANK",
  "UBL_BANK",
  "MCB_BANK",
  "BANK_AL_HABIB",
  "RAAST",
  "JAZZCASH",
  "EASYPAISA",
  "NAYAPAY",
  "SADAPAY",
];

// ======================================================
// GENERATE DEPOSIT REFERENCE
// ======================================================

const generateDepositReference = () => {
  const random = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `GTD-${Date.now()}-${random}`;
};

// ======================================================
// CREATE PKR DEPOSIT REQUEST
// POST /api/v1/wallet/deposit/pkr
// ======================================================

export const createPKRDepositRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const { provider, amount, senderName, senderAccount } = req.body;

    if (!SUPPORTED_PKR_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported payment provider.",
      });
    }

    if (!amount || amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Minimum deposit amount is PKR 100.",
      });
    }

    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const reference = generateDepositReference();

    const transaction = await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "DEPOSIT",
      currency: "PKR",
      amountPKR: amount,
      provider,
      providerReference: reference,
      senderName,
      senderAccount,
      status: "PENDING",
      description: `Deposit request via ${provider}`,
    });

    return res.status(201).json({
      success: true,
      message: "Deposit request created successfully.",
      reference,
      transactionId: transaction._id,
      status: "PENDING",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET USER DEPOSIT REQUESTS
// GET /api/v1/wallet/deposits
// ======================================================

export const getDepositRequests = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const deposits = await Transaction.find({
      wallet: wallet._id,
      transactionType: "DEPOSIT",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      total: deposits.length,
      deposits,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET DEPOSIT BY REFERENCE
// GET /api/v1/wallet/deposit/:reference
// ======================================================

export const getDepositByReference = async (
  req: Request,
  res: Response
) => {
  try {
    const transaction = await Transaction.findOne({
      providerReference: req.params.reference,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    return res.json({
      success: true,
      transaction,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CANCEL PENDING DEPOSIT
// DELETE /api/v1/wallet/deposit/:reference
// ======================================================

export const cancelDepositRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const transaction = await Transaction.findOne({
      providerReference: req.params.reference,
      user: req.user.id,
      transactionType: "DEPOSIT",
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Deposit request not found.",
      });
    }

    if (transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending deposits can be cancelled.",
      });
    }

    transaction.status = TransactionStatus.CANCELLED;
    transaction.cancelledAt = new Date();

    await transaction.save();

    return res.json({
      success: true,
      message: "Deposit request cancelled successfully.",
      reference: transaction.providerReference,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN APPROVE DEPOSIT
// PATCH /api/v1/wallet/admin/deposit/:transactionId/approve
// ======================================================

export const approveDepositRequest = async (
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

    const transaction = await Transaction.findById(
      req.params.transactionId
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Deposit transaction not found.",
      });
    }

    if (transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Deposit already processed.",
      });
    }

    const wallet = await Wallet.findById(transaction.wallet);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    wallet.balances.PKR += transaction.amountPKR;

    transaction.status = TransactionStatus.COMPLETED;
    transaction.completedAt = new Date();
    transaction.approvedBy = admin._id;

    await wallet.save();
    await transaction.save();

    return res.json({
      success: true,
      message: "Deposit approved successfully.",
      newBalancePKR: wallet.balances.PKR,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN REJECT DEPOSIT
// PATCH /api/v1/wallet/admin/deposit/:transactionId/reject
// ======================================================

export const rejectDepositRequest = async (
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

    const transaction = await Transaction.findById(
      req.params.transactionId
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Deposit transaction not found.",
      });
    }

    if (transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Deposit already processed.",
      });
    }

    transaction.status = TransactionStatus.REJECTED;
    transaction.rejectedAt = new Date();
    transaction.rejectionReason =
      req.body.reason || "Rejected by admin.";

    transaction.approvedBy = admin._id;

    await transaction.save();

    return res.json({
      success: true,
      message: "Deposit rejected successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// LIST SUPPORTED PKR PROVIDERS
// GET /api/v1/wallet/deposit/providers
// ======================================================

export const getPKRDepositProviders = async (
  req: Request,
  res: Response
) => {
  return res.json({
    success: true,
    providers: SUPPORTED_PKR_PROVIDERS,
  });
};

// ======================================================
// SECTION 2/10 END
// ======================================================// ======================================================
// SECTION 3/10 START
// PKR WITHDRAWAL ENGINE
// ======================================================

// ======================================================
// SUPPORTED PKR WITHDRAW PROVIDERS
// ======================================================

const SUPPORTED_WITHDRAW_PROVIDERS = [
  "MEEZAN_BANK",
  "HBL_BANK",
  "UBL_BANK",
  "MCB_BANK",
  "BANK_AL_HABIB",
  "RAAST",
  "JAZZCASH",
  "EASYPAISA",
  "NAYAPAY",
  "SADAPAY",
];

// ======================================================
// GENERATE WITHDRAW REFERENCE
// ======================================================

const generateWithdrawReference = () => {
  const random = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `GTW-${Date.now()}-${random}`;
};

// ======================================================
// CREATE WITHDRAW REQUEST
// POST /api/v1/wallet/withdraw/pkr
// ======================================================

export const createPKRWithdrawRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      provider,
      amount,
      accountTitle,
      accountNumber,
      iban,
    } = req.body;

    if (!SUPPORTED_WITHDRAW_PROVIDERS.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported withdrawal provider.",
      });
    }

    if (!amount || amount < 500) {
      return res.status(400).json({
        success: false,
        message: "Minimum withdrawal amount is PKR 500.",
      });
    }

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (wallet.walletStatus !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Wallet is not active.",
      });
    }

    if (wallet.balances.PKR < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient PKR balance.",
      });
    }

    const reference = generateWithdrawReference();

    const transaction = await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "WITHDRAW",
      currency: "PKR",
      amountPKR: amount,
      provider,
      providerReference: reference,
      receiverName: accountTitle,
      receiverAccount: accountNumber,
      iban,
      status: "PENDING",
      description: `Withdrawal request via ${provider}`,
    });

    wallet.balances.PKR -= amount;
    wallet.pendingWithdrawalPKR += amount;

    await wallet.save();

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted.",
      reference,
      transactionId: transaction._id,
      status: "PENDING",
      remainingBalance: wallet.balances.PKR,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET USER WITHDRAW REQUESTS
// GET /api/v1/wallet/withdrawals
// ======================================================

export const getWithdrawRequests = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const withdrawals = await Transaction.find({
      wallet: wallet._id,
      transactionType: "WITHDRAW",
    }).sort({
      createdAt: -1,
    });

    return res.json({
      success: true,
      total: withdrawals.length,
      withdrawals,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET WITHDRAW REQUEST BY REFERENCE
// GET /api/v1/wallet/withdraw/:reference
// ======================================================

export const getWithdrawByReference = async (
  req: Request,
  res: Response
) => {
  try {
    const transaction = await Transaction.findOne({
      providerReference: req.params.reference,
      user: req.user.id,
      transactionType: "WITHDRAW",
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found.",
      });
    }

    return res.json({
      success: true,
      transaction,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CANCEL PENDING WITHDRAWAL
// DELETE /api/v1/wallet/withdraw/:reference
// ======================================================

export const cancelWithdrawRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const transaction = await Transaction.findOne({
      providerReference: req.params.reference,
      user: req.user.id,
      transactionType: "WITHDRAW",
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal request not found.",
      });
    }

    if (transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Only pending withdrawals can be cancelled.",
      });
    }

    const wallet = await Wallet.findById(transaction.wallet);

    wallet.balances.PKR += transaction.amountPKR;
    wallet.pendingWithdrawalPKR -= transaction.amountPKR;

    transaction.status = TransactionStatus.CANCELLED;
    transaction.cancelledAt = new Date();

    await wallet.save();
    await transaction.save();

    return res.json({
      success: true,
      message: "Withdrawal cancelled successfully.",
      restoredBalance: wallet.balances.PKR,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN APPROVE WITHDRAWAL
// PATCH /api/v1/wallet/admin/withdraw/:transactionId/approve
// ======================================================

export const approveWithdrawRequest = async (
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

    const transaction = await Transaction.findById(
      req.params.transactionId
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal transaction not found.",
      });
    }

    if (transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal already processed.",
      });
    }

    const wallet = await Wallet.findById(transaction.wallet);

    wallet.pendingWithdrawalPKR -= transaction.amountPKR;

    transaction.status = TransactionStatus.COMPLETED;
    transaction.completedAt = new Date();
    transaction.approvedBy = admin._id;

    await wallet.save();
    await transaction.save();

    return res.json({
      success: true,
      message: "Withdrawal approved successfully.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN REJECT WITHDRAWAL
// PATCH /api/v1/wallet/admin/withdraw/:transactionId/reject
// ======================================================

export const rejectWithdrawRequest = async (
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

    const transaction = await Transaction.findById(
      req.params.transactionId
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Withdrawal transaction not found.",
      });
    }

    if (transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Withdrawal already processed.",
      });
    }

    const wallet = await Wallet.findById(transaction.wallet);

    wallet.balances.PKR += transaction.amountPKR;
    wallet.pendingWithdrawalPKR -= transaction.amountPKR;

    transaction.status = TransactionStatus.REJECTED;
    transaction.rejectedAt = new Date();
    transaction.rejectionReason =
      req.body.reason || "Rejected by admin.";
    transaction.approvedBy = admin._id;

    await wallet.save();
    await transaction.save();

    return res.json({
      success: true,
      message: "Withdrawal rejected and amount returned to wallet.",
      currentBalance: wallet.balances.PKR,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// LIST SUPPORTED WITHDRAW PROVIDERS
// GET /api/v1/wallet/withdraw/providers
// ======================================================

export const getWithdrawProviders = async (
  req: Request,
  res: Response
) => {
  return res.json({
    success: true,
    providers: SUPPORTED_WITHDRAW_PROVIDERS,
    minimumWithdrawalPKR: 500,
  });
};

// ======================================================
// SECTION 3/10 END
// ======================================================// ======================================================
// SECTION 4/10 START
// INTERNAL WALLET TRANSFER + RAAST TRANSFER ENGINE
// ======================================================

// ======================================================
// GENERATE TRANSFER REFERENCE
// ======================================================

const generateTransferReference = () => {
  const random = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `GTT-${Date.now()}-${random}`;
};

// ======================================================
// INTERNAL USER TO USER PKR TRANSFER
// POST /api/v1/wallet/transfer/internal
// ======================================================

export const transferPKRToUser = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      receiverUsername,
      amount,
      note,
    } = req.body;

    if (!receiverUsername || !amount) {
      return res.status(400).json({
        success: false,
        message: "Receiver username and amount are required.",
      });
    }

    if (amount < 10) {
      return res.status(400).json({
        success: false,
        message: "Minimum transfer amount is PKR 10.",
      });
    }

    const sender = await User.findById(req.user.id);
    const receiver = await User.findOne({
      username: receiverUsername,
    });

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found.",
      });
    }

    if (String(receiver._id) === String(sender._id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot transfer to yourself.",
      });
    }

    const senderWallet = await Wallet.findOne({
      user: sender._id,
    });

    const receiverWallet = await Wallet.findOne({
      user: receiver._id,
    });

    if (!senderWallet || !receiverWallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (senderWallet.balances.PKR < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance.",
      });
    }

    const reference = generateTransferReference();

    senderWallet.balances.PKR -= amount;
    receiverWallet.balances.PKR += amount;

    await senderWallet.save();
    await receiverWallet.save();

    await Transaction.create({
      user: sender._id,
      wallet: senderWallet._id,
      transactionType: "TRANSFER_SENT",
      currency: "PKR",
      amountPKR: amount,
      providerReference: reference,
      receiverUser: receiver._id,
      status: "COMPLETED",
      description: note || `Transfer to ${receiver.fullName}`,
    });

    await Transaction.create({
      user: receiver._id,
      wallet: receiverWallet._id,
      transactionType: "TRANSFER_RECEIVED",
      currency: "PKR",
      amountPKR: amount,
      providerReference: reference,
      senderUser: sender._id,
      status: "COMPLETED",
      description: note || `Received from ${sender.fullName}`,
    });

    return res.json({
      success: true,
      message: "Transfer completed successfully.",
      reference,
      senderBalance: senderWallet.balances.PKR,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET TRANSFER HISTORY
// GET /api/v1/wallet/transfers
// ======================================================

export const getTransferHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const transfers = await Transaction.find({
      wallet: wallet._id,
      transactionType: {
        $in: [
          "TRANSFER_SENT",
          "TRANSFER_RECEIVED",
        ],
      },
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      total: transfers.length,
      transfers,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// RAAST TRANSFER REQUEST
// POST /api/v1/wallet/transfer/raast
// ======================================================

export const createRaastTransferRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      amount,
      receiverIBAN,
      receiverName,
      note,
    } = req.body;

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: "Minimum Raast transfer is PKR 100.",
      });
    }

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (wallet.balances.PKR < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient PKR balance.",
      });
    }

    const reference = generateTransferReference();

    wallet.balances.PKR -= amount;
    wallet.pendingTransferPKR += amount;

    await wallet.save();

    const transaction = await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "RAAST_TRANSFER",
      currency: "PKR",
      amountPKR: amount,
      provider: "RAAST",
      providerReference: reference,
      receiverName,
      receiverAccount: receiverIBAN,
      status: "PENDING",
      description: note || "Raast Transfer",
    });

    return res.status(201).json({
      success: true,
      message: "Raast transfer request created.",
      reference,
      transactionId: transaction._id,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN APPROVE RAAST TRANSFER
// PATCH /api/v1/wallet/admin/raast/:transactionId/approve
// ======================================================

export const approveRaastTransfer = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN","SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const transaction = await Transaction.findById(
      req.params.transactionId
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    if (transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Already processed.",
      });
    }

    const wallet = await Wallet.findById(transaction.wallet);

    wallet.pendingTransferPKR -= transaction.amountPKR;

    transaction.status = TransactionStatus.COMPLETED;
    transaction.completedAt = new Date();
    transaction.approvedBy = admin._id;

    await wallet.save();
    await transaction.save();

    return res.json({
      success: true,
      message: "Raast transfer approved successfully.",
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN REJECT RAAST TRANSFER
// PATCH /api/v1/wallet/admin/raast/:transactionId/reject
// ======================================================

export const rejectRaastTransfer = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = await User.findById(req.user.id);

    if (!admin || !["ADMIN","SUPER_ADMIN"].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    const transaction = await Transaction.findById(
      req.params.transactionId
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    if (transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Already processed.",
      });
    }

    const wallet = await Wallet.findById(transaction.wallet);

    wallet.balances.PKR += transaction.amountPKR;
    wallet.pendingTransferPKR -= transaction.amountPKR;

    transaction.status = TransactionStatus.REJECTED;
    transaction.rejectedAt = new Date();
    transaction.rejectionReason =
      req.body.reason || "Rejected by admin.";

    await wallet.save();
    await transaction.save();

    return res.json({
      success: true,
      message: "Raast transfer rejected. Amount refunded.",
      balance: wallet.balances.PKR,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET RAAST TRANSFER HISTORY
// GET /api/v1/wallet/raast/history
// ======================================================

export const getRaastTransferHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const history = await Transaction.find({
      wallet: wallet._id,
      transactionType: "RAAST_TRANSFER",
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      total: history.length,
      transfers: history,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// SECTION 4/10 END
// ======================================================// ======================================================
// SECTION 5/10 START
// MULTI-CURRENCY WALLET + EXCHANGE ENGINE
// ======================================================

// ======================================================
// SUPPORTED FIAT CURRENCIES
// ======================================================

const SUPPORTED_FIAT_CURRENCIES = [
  "PKR",
  "USD",
  "AED",
  "SAR",
  "EUR",
  "GBP",
];

// ======================================================
// GET EXCHANGE RATE FROM DATABASE
// ======================================================

const getExchangeRate = async (
  fromCurrency: string,
  toCurrency: string
) => {
  if (fromCurrency === toCurrency) return 1;

  const rates = await GoldPrice.findOne().sort({
    createdAt: -1,
  });

  if (!rates) {
    throw new Error("Exchange rates unavailable.");
  }

  const table: Record<string, number> = {
    PKR: 1,
    USD: rates.exchangeRates.USD,
    AED: rates.exchangeRates.AED,
    SAR: rates.exchangeRates.SAR,
    EUR: rates.exchangeRates.EUR,
    GBP: rates.exchangeRates.GBP,
  };

  const pkrAmount = table[fromCurrency];
  const targetAmount = table[toCurrency];

  if (!pkrAmount || !targetAmount) {
    throw new Error("Unsupported currency.");
  }

  return targetAmount / pkrAmount;
};

// ======================================================
// GET ALL CURRENCY BALANCES
// GET /api/v1/wallet/currencies
// ======================================================

export const getCurrencyWallets = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    }).select("balances");

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.json({
      success: true,

      currencies: wallet.balances,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET SINGLE CURRENCY BALANCE
// GET /api/v1/wallet/currency/:currency
// ======================================================

export const getCurrencyBalance = async (
  req: Request,
  res: Response
) => {
  try {
    const currency = String(req.params.currency).toUpperCase();

    if (!SUPPORTED_FIAT_CURRENCIES.includes(currency) && currency !== "USDT") {
      return res.status(400).json({
        success: false,
        message: "Unsupported currency.",
      });
    }

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.json({
      success: true,
      currency,
      balance: wallet.balances[currency],
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CONVERT CURRENCY (INTERNAL WALLET)
// POST /api/v1/wallet/convert
// ======================================================

export const convertCurrency = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      fromCurrency,
      toCurrency,
      amount,
    } = req.body;

    if (
      !SUPPORTED_FIAT_CURRENCIES.includes(fromCurrency) ||
      !SUPPORTED_FIAT_CURRENCIES.includes(toCurrency)
    ) {
      return res.status(400).json({
        success: false,
        message: "Unsupported currency pair.",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero.",
      });
    }

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (wallet.balances[fromCurrency] < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance.",
      });
    }

    const rate = await getExchangeRate(
      fromCurrency,
      toCurrency
    );

    const convertedAmount = Number(
      (amount * rate).toFixed(2)
    );

    wallet.balances[fromCurrency] -= amount;
    wallet.balances[toCurrency] += convertedAmount;

    await wallet.save();

    await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "CURRENCY_CONVERSION",
      currency: fromCurrency,
      amountPKR: amount,
      providerReference: generateTransferReference(),
      status: "COMPLETED",
      description: `${amount} ${fromCurrency} converted to ${convertedAmount} ${toCurrency}`,
    });

    return res.json({
      success: true,

      conversion: {
        fromCurrency,
        toCurrency,
        amount,
        exchangeRate: rate,
        convertedAmount,
      },

      balances: wallet.balances,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// EXCHANGE RATE PREVIEW
// POST /api/v1/wallet/exchange-preview
// ======================================================

export const exchangePreview = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      fromCurrency,
      toCurrency,
      amount,
    } = req.body;

    const rate = await getExchangeRate(
      fromCurrency,
      toCurrency
    );

    const convertedAmount = Number(
      (amount * rate).toFixed(2)
    );

    return res.json({
      success: true,

      preview: {
        fromCurrency,
        toCurrency,
        amount,
        exchangeRate: rate,
        convertedAmount,
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
// GET LIVE EXCHANGE RATES
// GET /api/v1/wallet/exchange-rates
// ======================================================

export const getLiveExchangeRates = async (
  req: Request,
  res: Response
) => {
  try {
    const rates = await GoldPrice.findOne().sort({
      createdAt: -1,
    });

    if (!rates) {
      return res.status(404).json({
        success: false,
        message: "Exchange rates unavailable.",
      });
    }

    return res.json({
      success: true,

      exchangeRates: rates.exchangeRates,

      updatedAt: rates.updatedAt,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET CONVERSION HISTORY
// GET /api/v1/wallet/conversion-history
// ======================================================

export const getConversionHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const history = await Transaction.find({
      wallet: wallet._id,
      transactionType: "CURRENCY_CONVERSION",
    }).sort({
      createdAt: -1,
    });

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
// SECTION 5/10 END
// ======================================================// ======================================================
// SECTION 6/10 START
// CRYPTO WALLET ENGINE
// ======================================================

// ======================================================
// SUPPORTED CRYPTO COINS
// ======================================================

const SUPPORTED_CRYPTO = [
  "USDT",
  "BTC",
  "ETH",
  "BNB",
  "SOL",
];

// ======================================================
// SUPPORTED NETWORKS
// ======================================================

const SUPPORTED_NETWORKS = [
  "TRC20",
  "ERC20",
  "BEP20",
  "SOLANA",
  "BITCOIN",
];

// ======================================================
// GET USER CRYPTO ADDRESSES
// GET /api/v1/wallet/crypto/addresses
// ======================================================

export const getCryptoAddresses = async (req: Request, res: Response) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id }).select(
      "cryptoAddresses"
    );

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    return res.json({
      success: true,
      cryptoAddresses: wallet.cryptoAddresses,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET SINGLE CRYPTO ADDRESS
// GET /api/v1/wallet/crypto/address/:coin/:network
// ======================================================

export const getCryptoAddress = async (req: Request, res: Response) => {
  try {
    const coin = String(req.params.coin).toUpperCase();
    const network = String(req.params.network).toUpperCase();

    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const address = wallet.cryptoAddresses.find(
      (item: any) =>
        item.coin === coin && item.network === network
    );

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Crypto address not found.",
      });
    }

    return res.json({
      success: true,
      address,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CREATE CRYPTO DEPOSIT REQUEST
// POST /api/v1/wallet/crypto/deposit
// ======================================================

export const createCryptoDepositRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      coin,
      network,
      amount,
      txHash,
      senderAddress,
    } = req.body;

    if (!SUPPORTED_CRYPTO.includes(coin)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported crypto coin.",
      });
    }

    if (!SUPPORTED_NETWORKS.includes(network)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported blockchain network.",
      });
    }

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const reference = generateDepositReference();

    const transaction = await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "CRYPTO_DEPOSIT",
      currency: coin,
      cryptoNetwork: network,
      cryptoAmount: amount,
      txHash,
      senderAddress,
      provider: "CRYPTO",
      providerReference: reference,
      status: "PENDING",
      description: `${coin} deposit via ${network}`,
    });

    return res.status(201).json({
      success: true,
      reference,
      transactionId: transaction._id,
      status: "PENDING",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN APPROVE CRYPTO DEPOSIT
// PATCH /api/v1/wallet/admin/crypto/deposit/:id/approve
// ======================================================

export const approveCryptoDeposit = async (
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

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction.",
      });
    }

    const wallet = await Wallet.findById(transaction.wallet);

    wallet.cryptoBalances[transaction.currency] += transaction.cryptoAmount;

    transaction.status = TransactionStatus.COMPLETED;
    transaction.completedAt = new Date();
    transaction.approvedBy = admin._id;

    await wallet.save();
    await transaction.save();

    return res.json({
      success: true,
      message: "Crypto deposit approved.",
      cryptoBalances: wallet.cryptoBalances,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CREATE CRYPTO WITHDRAW REQUEST
// POST /api/v1/wallet/crypto/withdraw
// ======================================================

export const createCryptoWithdrawRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      coin,
      network,
      amount,
      receiverAddress,
    } = req.body;

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    if (wallet.cryptoBalances[coin] < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient crypto balance.",
      });
    }

    wallet.cryptoBalances[coin] -= amount;

    const reference = generateWithdrawReference();

    const transaction = await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "CRYPTO_WITHDRAW",
      currency: coin,
      cryptoAmount: amount,
      cryptoNetwork: network,
      receiverAddress,
      provider: "CRYPTO",
      providerReference: reference,
      status: "PENDING",
      description: `${coin} withdrawal via ${network}`,
    });

    await wallet.save();

    return res.status(201).json({
      success: true,
      reference,
      transactionId: transaction._id,
      status: "PENDING",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN REJECT CRYPTO WITHDRAW
// PATCH /api/v1/wallet/admin/crypto/withdraw/:id/reject
// ======================================================

export const rejectCryptoWithdraw = async (
  req: Request,
  res: Response
) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction.",
      });
    }

    const wallet = await Wallet.findById(transaction.wallet);

    wallet.cryptoBalances[transaction.currency] += transaction.cryptoAmount;

    transaction.status = TransactionStatus.REJECTED;
    transaction.rejectedAt = new Date();

    await wallet.save();
    await transaction.save();

    return res.json({
      success: true,
      message: "Withdrawal rejected and crypto refunded.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET CRYPTO TRANSACTION HISTORY
// GET /api/v1/wallet/crypto/history
// ======================================================

export const getCryptoHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const history = await Transaction.find({
      wallet: wallet._id,
      transactionType: {
        $in: [
          "CRYPTO_DEPOSIT",
          "CRYPTO_WITHDRAW",
        ],
      },
    }).sort({ createdAt: -1 });

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
// SECTION 6/10 END
// ======================================================// ======================================================
// SECTION 7/10 START
// INTERNATIONAL PAYMENT GATEWAY ENGINE
// ======================================================

// ======================================================
// SUPPORTED INTERNATIONAL GATEWAYS
// ======================================================

const SUPPORTED_GATEWAYS = [
  "STRIPE",
  "PAYONEER",
  "PAYPAL",
  "GOOGLE_PAY",
  "APPLE_PAY",
  "WISE",
  "REVOLUT",
];

// ======================================================
// GENERATE PAYMENT REFERENCE
// ======================================================

const generateGatewayReference = () => {
  const random = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `GTP-${Date.now()}-${random}`;
};

// ======================================================
// CREATE INTERNATIONAL DEPOSIT REQUEST
// POST /api/v1/wallet/gateway/deposit
// ======================================================

export const createGatewayDeposit = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      gateway,
      currency,
      amount,
      payerEmail,
      payerName,
    } = req.body;

    if (!SUPPORTED_GATEWAYS.includes(gateway)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported payment gateway.",
      });
    }

    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const reference = generateGatewayReference();

    const transaction = await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "GATEWAY_DEPOSIT",
      provider: gateway,
      currency,
      gatewayReference: reference,
      gatewayStatus: "PENDING",
      amount,
      senderName: payerName,
      senderEmail: payerEmail,
      status: "PENDING",
      description: `${gateway} deposit request`,
    });

    return res.status(201).json({
      success: true,
      reference,
      transactionId: transaction._id,
      gateway,
      status: "PENDING",
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// CREATE INTERNATIONAL WITHDRAW REQUEST
// POST /api/v1/wallet/gateway/withdraw
// ======================================================

export const createGatewayWithdraw = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      gateway,
      currency,
      amount,
      receiverEmail,
      receiverName,
    } = req.body;

    if (!SUPPORTED_GATEWAYS.includes(gateway)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported gateway.",
      });
    }

    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    if (wallet.balances[currency] < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${currency} balance.`,
      });
    }

    wallet.balances[currency] -= amount;

    const reference = generateGatewayReference();

    const transaction = await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "GATEWAY_WITHDRAW",
      provider: gateway,
      currency,
      gatewayReference: reference,
      gatewayStatus: "PENDING",
      amount,
      receiverEmail,
      receiverName,
      status: "PENDING",
      description: `${gateway} withdrawal request`,
    });

    await wallet.save();

    return res.status(201).json({
      success: true,
      reference,
      transactionId: transaction._id,
      gateway,
      status: "PENDING",
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN APPROVE GATEWAY DEPOSIT
// PATCH /api/v1/wallet/admin/gateway/deposit/:id/approve
// ======================================================

export const approveGatewayDeposit = async (
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

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction.",
      });
    }

    const wallet = await Wallet.findById(transaction.wallet);

    wallet.balances[transaction.currency] += transaction.amount;

    transaction.status = TransactionStatus.COMPLETED;
    transaction.gatewayStatus = "SUCCESS";
    transaction.completedAt = new Date();
    transaction.approvedBy = admin._id;

    await wallet.save();
    await transaction.save();

    return res.json({
      success: true,
      message: "Gateway deposit approved.",
      balance: wallet.balances[transaction.currency],
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN APPROVE GATEWAY WITHDRAW
// PATCH /api/v1/wallet/admin/gateway/withdraw/:id/approve
// ======================================================

export const approveGatewayWithdraw = async (
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

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction.",
      });
    }

    transaction.status = TransactionStatus.COMPLETED;
    transaction.gatewayStatus = "SUCCESS";
    transaction.completedAt = new Date();
    transaction.approvedBy = admin._id;

    await transaction.save();

    return res.json({
      success: true,
      message: "Gateway withdrawal approved.",
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// ADMIN REJECT GATEWAY WITHDRAW
// PATCH /api/v1/wallet/admin/gateway/withdraw/:id/reject
// ======================================================

export const rejectGatewayWithdraw = async (
  req: Request,
  res: Response
) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction || transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction.",
      });
    }

    const wallet = await Wallet.findById(transaction.wallet);

    wallet.balances[transaction.currency] += transaction.amount;

    transaction.status = TransactionStatus.REJECTED;
    transaction.gatewayStatus = "FAILED";
    transaction.rejectedAt = new Date();
    transaction.rejectionReason =
      req.body.reason || "Rejected by admin.";

    await wallet.save();
    await transaction.save();

    return res.json({
      success: true,
      message: "Gateway withdrawal rejected and balance refunded.",
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GATEWAY PAYMENT STATUS
// GET /api/v1/wallet/gateway/status/:reference
// ======================================================

export const getGatewayPaymentStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const transaction = await Transaction.findOne({
      gatewayReference: req.params.reference,
      user: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Gateway transaction not found.",
      });
    }

    return res.json({
      success: true,
      gateway: transaction.provider,
      reference: transaction.gatewayReference,
      status: transaction.gatewayStatus,
      amount: transaction.amount,
      currency: transaction.currency,
      createdAt: transaction.createdAt,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// LIST SUPPORTED INTERNATIONAL GATEWAYS
// GET /api/v1/wallet/gateway/providers
// ======================================================

export const getSupportedGateways = async (
  req: Request,
  res: Response
) => {
  return res.json({
    success: true,
    providers: SUPPORTED_GATEWAYS,
    supportedCurrencies: [
      "USD",
      "EUR",
      "GBP",
      "AED",
      "SAR",
      "PKR",
      "USDT",
    ],
  });
};

// ======================================================
// GATEWAY TRANSACTION HISTORY
// GET /api/v1/wallet/gateway/history
// ======================================================

export const getGatewayHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const history = await Transaction.find({
      wallet: wallet._id,
      transactionType: {
        $in: [
          "GATEWAY_DEPOSIT",
          "GATEWAY_WITHDRAW",
        ],
      },
    }).sort({ createdAt: -1 });

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
// SECTION 7/10 END
// ======================================================// ======================================================
// SECTION 8/10 START
// CASHBACK + REFERRAL + LOYALTY + PROMO ENGINE
// ======================================================

// ======================================================
// DEFAULT REWARD CONFIGURATION
// ======================================================

const REWARD_CONFIG = {
  cashbackPercent: 0.5,       // 0.5%
  referralBonusPKR: 500,
  loyaltyPer1000PKR: 10,
  welcomeBonusPKR: 1000,
};

// ======================================================
// APPLY CASHBACK AFTER COMPLETED PURCHASE
// ======================================================

export const applyCashbackReward = async (
  userId: string,
  purchaseAmount: number
) => {
  const wallet = await Wallet.findOne({ user: userId });

  if (!wallet || purchaseAmount <= 0) return null;

  const cashback = Number(
    ((purchaseAmount * REWARD_CONFIG.cashbackPercent) / 100).toFixed(2)
  );

  wallet.balances.PKR += cashback;
  wallet.rewardWallet.cashbackBalance += cashback;
  wallet.rewardWallet.totalCashbackEarned += cashback;

  await wallet.save();

  await Transaction.create({
    user: userId,
    wallet: wallet._id,
    transactionType: "CASHBACK_REWARD",
    currency: "PKR",
    amountPKR: cashback,
    status: "COMPLETED",
    description: `Cashback reward on PKR ${purchaseAmount}`,
  });

  return cashback;
};

// ======================================================
// GET CASHBACK WALLET
// GET /api/v1/wallet/cashback
// ======================================================

export const getCashbackWallet = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    return res.json({
      success: true,
      cashbackWallet: wallet.rewardWallet,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// APPLY REFERRAL BONUS
// ======================================================

export const rewardReferral = async (
  referrerId: string,
  newUserId: string
) => {
  const wallet = await Wallet.findOne({ user: referrerId });

  if (!wallet) return;

  wallet.balances.PKR += REWARD_CONFIG.referralBonusPKR;
  wallet.rewardWallet.referralBalance += REWARD_CONFIG.referralBonusPKR;
  wallet.rewardWallet.totalReferralEarned += REWARD_CONFIG.referralBonusPKR;

  await wallet.save();

  await Transaction.create({
    user: referrerId,
    wallet: wallet._id,
    transactionType: "REFERRAL_REWARD",
    currency: "PKR",
    amountPKR: REWARD_CONFIG.referralBonusPKR,
    status: "COMPLETED",
    description: `Referral reward for user ${newUserId}`,
  });

  await User.findByIdAndUpdate(referrerId, {
    $inc: {
      totalReferrals: 1,
    },
  });
};

// ======================================================
// GET REFERRAL DASHBOARD
// GET /api/v1/wallet/referral
// ======================================================

export const getReferralDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    const user = await User.findById(req.user.id);
    const wallet = await Wallet.findOne({ user: req.user.id });

    return res.json({
      success: true,

      referral: {
        referralCode: user.referral.referralCode,
        referredUsers: user.referral.totalReferrals,
        earnedPKR: wallet.rewardWallet.totalReferralEarned,
        balancePKR: wallet.rewardWallet.referralBalance,
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
// ADD LOYALTY POINTS
// ======================================================

export const addLoyaltyPoints = async (
  userId: string,
  purchaseAmount: number
) => {
  const wallet = await Wallet.findOne({ user: userId });

  if (!wallet) return;

  const points = Math.floor(
    purchaseAmount / 1000
  ) * REWARD_CONFIG.loyaltyPer1000PKR;

  wallet.rewardWallet.loyaltyPoints += points;
  wallet.rewardWallet.totalLoyaltyPoints += points;

  await wallet.save();

  return points;
};

// ======================================================
// GET LOYALTY DASHBOARD
// GET /api/v1/wallet/loyalty
// ======================================================

export const getLoyaltyDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    return res.json({
      success: true,

      loyalty: {
        availablePoints: wallet.rewardWallet.loyaltyPoints,
        lifetimePoints: wallet.rewardWallet.totalLoyaltyPoints,
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
// REDEEM LOYALTY POINTS
// POST /api/v1/wallet/loyalty/redeem
// ======================================================

export const redeemLoyaltyPoints = async (
  req: Request,
  res: Response
) => {
  try {
    const { points } = req.body;

    const wallet = await Wallet.findOne({ user: req.user.id });

    if (wallet.rewardWallet.loyaltyPoints < points) {
      return res.status(400).json({
        success: false,
        message: "Insufficient loyalty points.",
      });
    }

    const rewardAmount = Number((points * 2).toFixed(2));

    wallet.rewardWallet.loyaltyPoints -= points;
    wallet.balances.PKR += rewardAmount;

    await wallet.save();

    await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "LOYALTY_REDEEM",
      currency: "PKR",
      amountPKR: rewardAmount,
      status: "COMPLETED",
      description: `Redeemed ${points} loyalty points`,
    });

    return res.json({
      success: true,
      redeemedPoints: points,
      rewardPKR: rewardAmount,
      currentBalance: wallet.balances.PKR,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// PROMO CODE LIST
// ======================================================

const PROMO_CODES = [
  {
    code: "WELCOME1000",
    rewardPKR: 1000,
    expires: "2027-12-31",
  },
  {
    code: "GOLD500",
    rewardPKR: 500,
    expires: "2027-12-31",
  },
  {
    code: "TRADE250",
    rewardPKR: 250,
    expires: "2027-12-31",
  },
];

// ======================================================
// APPLY PROMO CODE
// POST /api/v1/wallet/promo/apply
// ======================================================

export const applyPromoCode = async (
  req: Request,
  res: Response
) => {
  try {
    const { code } = req.body;

    const wallet = await Wallet.findOne({ user: req.user.id });

    const promo = PROMO_CODES.find(
      (item) => item.code === code.toUpperCase()
    );

    if (!promo) {
      return res.status(404).json({
        success: false,
        message: "Invalid promo code.",
      });
    }

    if (
      wallet.rewardWallet.usedPromoCodes.includes(promo.code)
    ) {
      return res.status(400).json({
        success: false,
        message: "Promo code already used.",
      });
    }

    wallet.balances.PKR += promo.rewardPKR;
    wallet.rewardWallet.promoBalance += promo.rewardPKR;
    wallet.rewardWallet.usedPromoCodes.push(promo.code);

    await wallet.save();

    await Transaction.create({
      user: req.user.id,
      wallet: wallet._id,
      transactionType: "PROMO_REWARD",
      currency: "PKR",
      amountPKR: promo.rewardPKR,
      status: "COMPLETED",
      description: `Promo reward (${promo.code})`,
    });

    return res.json({
      success: true,
      promoCode: promo.code,
      rewardPKR: promo.rewardPKR,
      balancePKR: wallet.balances.PKR,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// GET REWARD HISTORY
// GET /api/v1/wallet/rewards/history
// ======================================================

export const getRewardHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    const history = await Transaction.find({
      wallet: wallet._id,
      transactionType: {
        $in: [
          "CASHBACK_REWARD",
          "REFERRAL_REWARD",
          "LOYALTY_REDEEM",
          "PROMO_REWARD",
        ],
      },
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      totalRewards: history.length,
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
// GET REWARD SUMMARY
// GET /api/v1/wallet/rewards/summary
// ======================================================

export const getRewardSummary = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user.id });

    return res.json({
      success: true,

      summary: {
        cashbackBalance: wallet.rewardWallet.cashbackBalance,
        referralBalance: wallet.rewardWallet.referralBalance,
        promoBalance: wallet.rewardWallet.promoBalance,

        totalCashbackEarned:
          wallet.rewardWallet.totalCashbackEarned,

        totalReferralEarned:
          wallet.rewardWallet.totalReferralEarned,

        loyaltyPoints:
          wallet.rewardWallet.loyaltyPoints,

        lifetimePoints:
          wallet.rewardWallet.totalLoyaltyPoints,
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
// SECTION 8/10 END
// ======================================================// ======================================================
// SECTION 9/10 START
// WALLET STATEMENTS + REPORTS + EXPORT ENGINE
// ======================================================

// ======================================================
// GET ALL TRANSACTIONS (FILTERABLE)
// GET /api/v1/wallet/transactions
// ======================================================

export const getWalletTransactions = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      type,
      currency,
      status,
      fromDate,
      toDate,
      page = 1,
      limit = 20,
    } = req.query;

    const wallet = await Wallet.findOne({ user: req.user.id });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found.",
      });
    }

    const query: any = { wallet: wallet._id };

    if (type) query.transactionType = type;
    if (currency) query.currency = currency;
    if (status) query.status = status;

    if (fromDate || toDate) {
      query.createdAt = {};

      if (fromDate) query.createdAt.$gte = new Date(String(fromDate));
      if (toDate) query.createdAt.$lte = new Date(String(toDate));
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Transaction.countDocuments(query);

    return res.json({
      success: true,

      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },

      transactions,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// MONTHLY WALLET REPORT
// GET /api/v1/wallet/report/monthly
// ======================================================

export const getMonthlyWalletReport = async (
  req: Request,
  res: Response
) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const startDate = new Date(year, month - 1, 1);

    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      wallet: wallet._id,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    const report = {
      deposits: 0,
      withdrawals: 0,
      transfers: 0,
      cashback: 0,
      rewards: 0,
      conversions: 0,
    };

    transactions.forEach((tx: any) => {
      switch (tx.transactionType) {
        case "DEPOSIT":
          report.deposits += tx.amountPKR || 0;
          break;

        case "WITHDRAW":
          report.withdrawals += tx.amountPKR || 0;
          break;

        case "TRANSFER_SENT":
          report.transfers += tx.amountPKR || 0;
          break;

        case "CASHBACK_REWARD":
          report.cashback += tx.amountPKR || 0;
          break;

        case "REFERRAL_REWARD":
        case "PROMO_REWARD":
          report.rewards += tx.amountPKR || 0;
          break;

        case "CURRENCY_CONVERSION":
          report.conversions += 1;
          break;
      }
    });

    return res.json({
      success: true,

      month,
      year,

      totalTransactions: transactions.length,

      report,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// WALLET STATEMENT
// GET /api/v1/wallet/statement
// ======================================================

export const getWalletStatement = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const transactions = await Transaction.find({
      wallet: wallet._id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,

      statement: {
        walletStatus: wallet.walletStatus,
        balances: wallet.balances,
        goldBalance: wallet.goldBalance,
        rewardWallet: wallet.rewardWallet,
        totalTransactions: transactions.length,
      },

      transactions,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DOWNLOAD CSV DATA (JSON READY)
// GET /api/v1/wallet/export/csv
// ======================================================

export const exportTransactionsCSV = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const transactions = await Transaction.find({
      wallet: wallet._id,
    }).sort({ createdAt: -1 });

    const csvRows = transactions.map((tx: any) => ({
      Date: tx.createdAt,
      Type: tx.transactionType,
      Currency: tx.currency,
      Amount: tx.amountPKR || tx.cryptoAmount || tx.amount,
      Status: tx.status,
      Reference: tx.providerReference,
      Provider: tx.provider,
      Description: tx.description,
    }));

    return res.json({
      success: true,
      exportType: "CSV",
      rows: csvRows,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DOWNLOAD PDF DATA (JSON READY)
// GET /api/v1/wallet/export/pdf
// ======================================================

export const exportTransactionsPDF = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const transactions = await Transaction.find({
      wallet: wallet._id,
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,

      exportType: "PDF",

      generatedAt: new Date(),

      statement: {
        balances: wallet.balances,
        goldBalance: wallet.goldBalance,
        rewardWallet: wallet.rewardWallet,
      },

      transactions,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================================
// DAILY SUMMARY
// GET /api/v1/wallet/report/daily
// ======================================================

export const getDailySummary = async (
  req: Request,
  res: Response
) => {
  try {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);

    tomorrow.setDate(today.getDate() + 1);

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const transactions = await Transaction.find({
      wallet: wallet._id,
      createdAt: {
        $gte: today,
        $lt: tomorrow,
      },
    });

    const deposits = transactions.filter(
      (tx: any) => tx.transactionType === "DEPOSIT"
    );

    const withdrawals = transactions.filter(
      (tx: any) => tx.transactionType === "WITHDRAW"
    );

    return res.json({
      success: true,

      summary: {
        totalTransactions: transactions.length,

        deposits: deposits.reduce(
          (sum: number, tx: any) => sum + (tx.amountPKR || 0),
          0
        ),

        withdrawals: withdrawals.reduce(
          (sum: number, tx: any) => sum + (tx.amountPKR || 0),
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
// YEARLY SUMMARY
// GET /api/v1/wallet/report/yearly
// ======================================================

export const getYearlySummary = async (
  req: Request,
  res: Response
) => {
  try {
    const year = Number(req.query.year);

    const start = new Date(year, 0, 1);

    const end = new Date(year, 11, 31, 23, 59, 59);

    const wallet = await Wallet.findOne({
      user: req.user.id,
    });

    const transactions = await Transaction.find({
      wallet: wallet._id,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    });

    return res.json({
      success: true,
      year,
      totalTransactions: transactions.length,
      transactions,
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
// ENTERPRISE WALLET ADMIN + FRAUD + LIMITS + HEALTH
// ======================================================

// ======================================================
// GET ADMIN WALLET DASHBOARD
// GET /api/v1/admin/wallet/dashboard
// ======================================================

export const getAdminWalletDashboard = async (
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

    const totalWallets = await Wallet.countDocuments();

    const activeWallets = await Wallet.countDocuments({
      walletStatus: "ACTIVE"
    });

    const frozenWallets = await Wallet.countDocuments({
      walletStatus: "FROZEN"
    });

    const totalTransactions = await Transaction.countDocuments();

    const pendingTransactions = await Transaction.countDocuments({
      status: "PENDING"
    });

    return res.json({
      success: true,
      dashboard: {
        totalWallets,
        activeWallets,
        frozenWallets,
        totalTransactions,
        pendingTransactions,
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
// FREEZE USER WALLET
// PATCH /api/v1/admin/wallet/:walletId/freeze
// ======================================================

export const freezeWallet = async (
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

    const wallet = await Wallet.findById(req.params.walletId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found."
      });
    }

    wallet.walletStatus = "FROZEN";
    wallet.frozenAt = new Date();
    wallet.frozenBy = admin._id;
    wallet.freezeReason =
      req.body.reason || "Frozen by administrator.";

    await wallet.save();

    return res.json({
      success: true,
      message: "Wallet frozen successfully.",
      walletStatus: wallet.walletStatus
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// UNFREEZE USER WALLET
// PATCH /api/v1/admin/wallet/:walletId/unfreeze
// ======================================================

export const unfreezeWallet = async (
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

    const wallet = await Wallet.findById(req.params.walletId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found."
      });
    }

    wallet.walletStatus = "ACTIVE";
    wallet.unfrozenAt = new Date();
    wallet.freezeReason = "";

    await wallet.save();

    return res.json({
      success: true,
      message: "Wallet activated successfully.",
      walletStatus: wallet.walletStatus
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// UPDATE WALLET LIMITS
// PATCH /api/v1/admin/wallet/:walletId/limits
// ======================================================

export const updateWalletLimits = async (
  req: Request,
  res: Response
) => {
  try {
    const { dailyDeposit, dailyWithdraw, dailyTransfer } =
      req.body;

    const wallet = await Wallet.findById(req.params.walletId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found."
      });
    }

    wallet.limits.dailyDepositPKR = dailyDeposit;
    wallet.limits.dailyWithdrawalPKR = dailyWithdraw;
    wallet.limits.dailyTransferPKR = dailyTransfer;

    await wallet.save();

    return res.json({
      success: true,
      message: "Wallet limits updated.",
      limits: wallet.limits
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// GET WALLET LIMITS
// GET /api/v1/wallet/limits
// ======================================================

export const getWalletLimits = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findOne({
      user: req.user.id
    }).select("limits");

    return res.json({
      success: true,
      limits: wallet?.limits
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// FRAUD RISK CHECK
// GET /api/v1/admin/wallet/:walletId/fraud-check
// ======================================================

export const fraudRiskCheck = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findById(req.params.walletId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found."
      });
    }

    const pendingCount = await Transaction.countDocuments({
      wallet: wallet._id,
      status: "PENDING"
    });

    const rejectedCount = await Transaction.countDocuments({
      wallet: wallet._id,
      status: "REJECTED"
    });

    let riskLevel = "LOW";

    if (pendingCount >= 5 || rejectedCount >= 3) {
      riskLevel = "MEDIUM";
    }

    if (pendingCount >= 10 || rejectedCount >= 5) {
      riskLevel = "HIGH";
    }

    return res.json({
      success: true,
      fraud: {
        riskLevel,
        pendingTransactions: pendingCount,
        rejectedTransactions: rejectedCount,
        walletStatus: wallet.walletStatus
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
// RESET DAILY LIMIT USAGE
// POST /api/v1/admin/wallet/reset-daily-limits
// ======================================================

export const resetDailyUsage = async (
  req: Request,
  res: Response
) => {
  try {
    await Wallet.updateMany(
      {},
      {
        $set: {
          "dailyUsage.depositPKR": 0,
          "dailyUsage.withdrawPKR": 0,
          "dailyUsage.transferPKR": 0,
          "dailyUsage.lastReset": new Date()
        }
      }
    );

    return res.json({
      success: true,
      message: "All wallet daily limits reset successfully."
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// WALLET HEALTH CHECK
// GET /api/v1/admin/wallet/:walletId/health
// ======================================================

export const walletHealthCheck = async (
  req: Request,
  res: Response
) => {
  try {
    const wallet = await Wallet.findById(req.params.walletId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found."
      });
    }

    const totalTransactions = await Transaction.countDocuments({
      wallet: wallet._id
    });

    const pendingTransactions = await Transaction.countDocuments({
      wallet: wallet._id,
      status: "PENDING"
    });

    return res.json({
      success: true,
      health: {
        walletStatus: wallet.walletStatus,
        balances: wallet.balances,
        goldBalance: wallet.goldBalance,
        rewardWallet: wallet.rewardWallet,
        totalTransactions,
        pendingTransactions,
        limits: wallet.limits,
        dailyUsage: wallet.dailyUsage,
        lastUpdated: wallet.updatedAt
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
// ADMIN SEARCH WALLET
// GET /api/v1/admin/wallet/search
// ======================================================

export const searchWallets = async (
  req: Request,
  res: Response
) => {
  try {
    const keyword = String(req.query.keyword || "").trim();

    const users = await User.find({
      $or: [
        { username: { $regex: keyword, $options: "i" } },
        { fullName: { $regex: keyword, $options: "i" } },
        { email: { $regex: keyword, $options: "i" } }
      ]
    }).select("_id username fullName email");

    const wallets = await Wallet.find({
      user: { $in: users.map((u) => u._id) }
    }).populate("user", "username fullName email");

    return res.json({
      success: true,
      total: wallets.length,
      wallets
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ======================================================
// WALLET SYSTEM INFO
// GET /api/v1/wallet/system-info
// ======================================================

export const walletSystemInfo = async (
  req: Request,
  res: Response
) => {
  return res.json({
    success: true,

    system: {
      module: "GoldTrade Wallet Enterprise",
      version: "17.0.0",

      supportedBanks: [
        "Meezan Bank",
        "HBL",
        "UBL",
        "MCB",
        "Bank Al Habib",
        "Raast"
      ],

      supportedWallets: [
        "JazzCash",
        "EasyPaisa",
        "NayaPay",
        "SadaPay"
      ],

      internationalGateways: [
        "Stripe",
        "Payoneer",
        "PayPal",
        "Google Pay",
        "Apple Pay",
        "Wise",
        "Revolut"
      ],

      cryptoSupport: [
        "USDT",
        "BTC",
        "ETH",
        "BNB",
        "SOL"
      ],

      supportedCurrencies: [
        "PKR",
        "USD",
        "AED",
        "SAR",
        "EUR",
        "GBP",
        "USDT"
      ],

      timestamp: new Date()
    }
  });
};

// ======================================================
// SECTION 10/10 END
// GOLDTRADE WALLET CONTROLLER COMPLETE
// ======================================================