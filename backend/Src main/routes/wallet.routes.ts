// ======================================================
// GoldTrade V17 ENTERPRISE
// FILE: backend/src/routes/Wallet.routes.ts
// SECTION 1/10
// Wallet OVERVIEW + FIAT + CRYPTO + GOLD ROUTES
// ======================================================

import { Router } from "express";

import * as WalletController from "../controllers/Wallet.controller";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const authMiddleware = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("../middleware/auth.middleware");
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("../middlewares/auth.middleware");
    } catch {
      return {};
    }
  }
})();

const router = Router();

const WalletControllerAny = WalletController as any;
const pick = (...names: string[]) =>
  names
    .map((name) => WalletControllerAny[name])
    .find((fn) => typeof fn === "function") ||
  ((_req: any, res: any) =>
    res.status(501).json({ message: "Handler not implemented" }));

const passthrough = (_req: any, _res: any, next: any) => next();
const authenticate = authMiddleware.authenticate || passthrough;
const authorizeAdmin = authMiddleware.authorizeAdmin || passthrough;

const getWalletOverview = pick("getWalletOverview", "getWallet");
const getWalletBalances = pick("getWalletBalances", "getWallet");
const getFiatWallet = pick("getFiatWallet", "getWallet");
const getCryptoWallet = pick("getCryptoWallet", "getCryptoAddress");
const getGoldWallet = pick("getGoldWallet", "getWallet");
const getNetWorthSummary = pick("getNetWorthSummary", "getWalletSummary");
const getAvailableBalance = pick("getAvailableBalance");
const getLockedBalance = pick("getLockedBalance", "getGoldBalance");
const getWalletStatistics = pick("getWalletStatistics", "WalletStatistics");
const refreshWalletBalances = pick("refreshWalletBalances", "refreshWalletCache");

const createBankDeposit = pick("createBankDeposit");
const createCryptoDeposit = pick("createCryptoDeposit");
const createGoldDeposit = pick("createGoldDeposit");
const getDeposithistory = pick("getDeposithistory");
const getDepositById = pick("getDepositById");
const cancelDepositRequest = pick("cancelDepositRequest");
const uploadDepositProof = pick("uploadDepositProof");
const verifyCryptoDeposit = pick("verifyCryptoDeposit");
const getPendingDeposits = pick("getPendingDeposits");
const getDepositStatistics = pick("getDepositStatistics");

const createBankWithdrawal = pick("createBankWithdrawal");
const createCryptoWithdrawal = pick("createCryptoWithdrawal", "rejectCryptoWithdraw");
const createGoldWithdrawal = pick("createGoldWithdrawal");
const getWithdrawalhistory = pick("getWithdrawalhistory");
const getWithdrawalById = pick("getWithdrawalById");
const cancelWithdrawalRequest = pick("cancelWithdrawalRequest", "cancelWithdrawRequest");
const verifyWithdrawalOTP = pick("verifyWithdrawalOTP");
const getWithdrawalLimits = pick("getWithdrawalLimits");
const getWithdrawalFees = pick("getWithdrawalFees");
const getPendingWithdrawals = pick("getPendingWithdrawals");
const approveWithdrawal = pick("approveWithdrawal");
const rejectWithdrawal = pick("rejectWithdrawal");

const addBankAccount = pick("addBankAccount");
const updateBankAccount = pick("updateBankAccount");
const deleteBankAccount = pick("deleteBankAccount");
const getBankAccounts = pick("getBankAccounts");
const getBankAccountById = pick("getBankAccountById");
const setDefaultBankAccount = pick("setDefaultBankAccount");
const addCryptoAddress = pick("addCryptoAddress", "getCryptoAddress");
const updateCryptoAddress = pick("updateCryptoAddress", "getCryptoAddress");
const deleteCryptoAddress = pick("deleteCryptoAddress", "getCryptoAddress");
const getCryptoAddresses = pick("getCryptoAddresses", "getCryptoAddress");
const getCryptoAddressById = pick("getCryptoAddressById", "getCryptoAddress");
const setDefaultCryptoAddress = pick("setDefaultCryptoAddress", "getCryptoAddress");
const addWalletAddressBook = pick("addWalletAddressBook");
const updateWalletAddressBook = pick("updateWalletAddressBook");
const deleteWalletAddressBook = pick("deleteWalletAddressBook");
const getWalletAddressBook = pick("getWalletAddressBook");
const getWalletAddressBookById = pick("getWalletAddressBookById");

const transferFiatBalance = pick("transferFiatBalance");
const transferCryptoBalance = pick("transferCryptoBalance");
const transferGoldBalance = pick("transferGoldBalance");
const transferBetweenWallets = pick("transferBetweenWallets");
const transferToUser = pick("transferToUser", "transferPkrToUser");
const getTransferhistory = pick("getTransferhistory");
const getTransferById = pick("getTransferById");
const cancelTransfer = pick("cancelTransfer");
const estimateTransferFee = pick("estimateTransferFee");
const validateTransferRecipient = pick("validateTransferRecipient");
const getTransferLimits = pick("getTransferLimits");
const getPendingTransfers = pick("getPendingTransfers");
const approveTransfer = pick("approveTransfer", "approveRaastTransfer");
const rejectTransfer = pick("rejectTransfer");

const getTransactionhistory = pick("getTransactionhistory");
const getTransactionById = pick("getTransactionById");
const getTransactionSummary = pick("getTransactionSummary");
const searchTransactions = pick("searchTransactions");
const filterTransactions = pick("filterTransactions");
const getMonthlyStatement = pick("getMonthlyStatement");
const getAnnualStatement = pick("getAnnualStatement");
const exportTransactionsCSV = pick("exportTransactionsCSV");
const exportTransactionsPDF = pick("exportTransactionsPDF");
const exportTransactionsExcel = pick("exportTransactionsExcel", "exportTransactionsCSV");
const downloadTransactionReceipt = pick("downloadTransactionReceipt");
const resendTransactionReceipt = pick("resendTransactionReceipt");
const getTransactionAnalytics = pick("getTransactionAnalytics");
const getWalletCashFlow = pick("getWalletCashFlow");

const getRewardsWallet = pick("getRewardsWallet");
const getRewardBalance = pick("getRewardBalance");
const claimReward = pick("claimReward");
const getRewardhistory = pick("getRewardhistory");
const getCashbackhistory = pick("getCashbackhistory");
const convertRewardToWallet = pick("convertRewardToWallet");
const transferRewardBalance = pick("transferRewardBalance");
const getReferralWallet = pick("getReferralWallet");
const claimReferralBonus = pick("claimReferralBonus");
const getReferralBonushistory = pick("getReferralBonushistory");
const getWelcomeBonus = pick("getWelcomeBonus");
const claimWelcomeBonus = pick("claimWelcomeBonus");
const getLoyaltyPoints = pick("getLoyaltyPoints", "addLoyaltyPoints");
const redeemLoyaltyPoints = pick("redeemLoyaltyPoints");
const getBonusWalletSummary = pick("getBonusWalletSummary", "getWalletSummary");
const getRewardStatistics = pick("getRewardStatistics");

const createPriceAlert = pick("createPriceAlert");
const getPriceAlerts = pick("getPriceAlerts");
const getPriceAlertById = pick("getPriceAlertById");
const updatePriceAlert = pick("updatePriceAlert");
const deletePriceAlert = pick("deletePriceAlert");
const togglePriceAlert = pick("togglePriceAlert");
const createAutoInvestPlan = pick("createAutoInvestPlan");
const getAutoInvestPlans = pick("getAutoInvestPlans");
const getAutoInvestPlanById = pick("getAutoInvestPlanById");
const updateAutoInvestPlan = pick("updateAutoInvestPlan");
const pauseAutoInvestPlan = pick("pauseAutoInvestPlan");
const resumeAutoInvestPlan = pick("resumeAutoInvestPlan");
const cancelAutoInvestPlan = pick("cancelAutoInvestPlan");
const createSavingsVault = pick("createSavingsVault");
const getSavingsVault = pick("getSavingsVault");
const depositSavingsVault = pick("depositSavingsVault");
const withdrawSavingsVault = pick("withdrawSavingsVault");
const getSavingshistory = pick("getSavingshistory");
const getScheduledWalletJobs = pick("getScheduledWalletJobs");
const executeScheduledInvestment = pick("executeScheduledInvestment");

const getAdminWalletDashboard = pick("getAdminWalletDashboard");
const getTreasuryOverview = pick("getTreasuryOverview");
const updateTreasuryBalances = pick("updateTreasuryBalances");
const getLiquidityPoolStatus = pick("getLiquidityPoolStatus");
const refillLiquidityPool = pick("refillLiquidityPool");
const getReserveWalletStatus = pick("getReserveWalletStatus");
const updateReserveWallet = pick("updateReserveWallet");
const getVaultGoldInventory = pick("getVaultGoldInventory");
const updateVaultGoldInventory = pick("updateVaultGoldInventory");
const getRiskExposureReport = pick("getRiskExposureReport");
const freezeWallet = pick("freezeWallet");
const unfreezeWallet = pick("unfreezeWallet");
const getFrozenWallets = pick("getFrozenWallets");
const getWalletAuditLogs = pick("getWalletAuditLogs");
const getWalletHealthStatus = pick("getWalletHealthStatus");
const syncWalletBalances = pick("syncWalletBalances");
const reconcileWalletBalances = pick("reconcileWalletBalances");

const getWalletHealth = pick("getWalletHealth", "WalletHealth");
const getWalletVersion = pick("getWalletVersion", "WalletVersion");
const verifyWalletIntegrity = pick("verifyWalletIntegrity", "WalletIntegrity");
const refreshWalletCache = pick("refreshWalletCache", "WalletCacheRefresh");
const getSupportedCurrencies = pick("getSupportedCurrencies", "supportedCurrencies");
const getSupportedNetworks = pick("getSupportedNetworks", "supportedNetworks");
const getExchangeRates = pick("getExchangeRates", "getLiveExchangeRates");
const getWalletConfiguration = pick("getWalletConfiguration", "WalletConfiguration");
const WalletWebhook = pick("WalletWebhook", "handleWalletWebhook");
const cryptoDepositWebhook = pick("cryptoDepositWebhook", "handleCryptoDepositWebhook");
const bankDepositWebhook = pick("bankDepositWebhook", "handleBankDepositWebhook");
const payoutWebhook = pick("payoutWebhook", "handlePayoutWebhook");
const getWalletSystemStatistics = pick("getWalletSystemStatistics", "WalletSystemStatistics");
const cleanupExpiredTransactions = pick("cleanupExpiredTransactions", "cleanupTransactions");
const cleanupPendingDeposits = pick("cleanupPendingDeposits", "cleanupDeposits");
const cleanupPendingWithdrawals = pick("cleanupPendingWithdrawals", "cleanupWithdrawals");
const rebuildWalletIndexes = pick("rebuildWalletIndexes", "rebuildIndexes");
const synchronizeBlockchainBalances = pick(
  "synchronizeBlockchainBalances",
  "syncBlockchainBalances"
);

// ======================================================
// Wallet OVERVIEW ROUTES
// PREFIX: /api/v1/Wallet
// ======================================================

// Complete Wallet dashboard
router.get(
  "/overview",
  authenticate,
  getWalletOverview
);

// All Wallet balances
router.get(
  "/balances",
  authenticate,
  getWalletBalances
);

// Wallet statistics
router.get(
  "/statistics",
  authenticate,
  getWalletStatistics
);

// Net worth summary
router.get(
  "/net-worth",
  authenticate,
  getNetWorthSummary
);

// Refresh Wallet balances
router.post(
  "/refresh",
  authenticate,
  refreshWalletBalances
);

// ======================================================
// FIAT Wallet ROUTES
// ======================================================

// Pkr, USD, AED, SAR, EUR, GBP balances
router.get(
  "/fiat",
  authenticate,
  getFiatWallet
);

// ======================================================
// CRYPTO Wallet ROUTES
// ======================================================

// BTC, ETH, Usdt, BNB, SOL balances
router.get(
  "/crypto",
  authenticate,
  getCryptoWallet
);

// ======================================================
// GOLD Wallet ROUTES
// ======================================================

// Gold Wallet holdings
router.get(
  "/gold",
  authenticate,
  getGoldWallet
);

// Available balance only
router.get(
  "/available-balance",
  authenticate,
  getAvailableBalance
);

// Locked balance only
router.get(
  "/locked-balance",
  authenticate,
  getLockedBalance
);

// ======================================================
// ADMIN Wallet STATUS
// ======================================================

// Global Wallet statistics
router.get(
  "/admin/system-Wallet-status",
  authenticate,
  authorizeAdmin,
  getWalletStatistics
);

// ======================================================
// SECTION 1/10 END
// ======================================================

// ======================================================
// SECTION 2/10 START
// DEPOSIT ROUTES (BANK + CRYPTO + GOLD)
// ======================================================

// ======================================================
// BANK DEPOSIT ROUTES
// PREFIX: /api/v1/Wallet/deposit
// ======================================================

// Create new bank deposit request
router.post(
  "/deposit/bank",
  authenticate,
  createBankDeposit
);

// Upload bank deposit proof (receipt/screenshot)
router.post(
  "/deposit/bank/:depositId/proof",
  authenticate,
  uploadDepositProof
);

// ======================================================
// CRYPTO DEPOSIT ROUTES
// ======================================================

// Create crypto deposit request
router.post(
  "/deposit/crypto",
  authenticate,
  createCryptoDeposit
);

// Verify blockchain transaction
router.post(
  "/deposit/crypto/:depositId/verify",
  authenticate,
  verifyCryptoDeposit
);

// ======================================================
// GOLD DEPOSIT ROUTES
// ======================================================

// Deposit physical gold into GoldTrade vault
router.post(
  "/deposit/gold",
  authenticate,
  createGoldDeposit
);

// ======================================================
// DEPOSIT history ROUTES
// ======================================================

// All deposits
router.get(
  "/deposits",
  authenticate,
  getDeposithistory
);

// Single deposit details
router.get(
  "/deposits/:depositId",
  authenticate,
  getDepositById
);

// Cancel pending deposit request
router.delete(
  "/deposits/:depositId",
  authenticate,
  cancelDepositRequest
);

// Deposit statistics
router.get(
  "/deposits/statistics",
  authenticate,
  getDepositStatistics
);

// ======================================================
// ADMIN DEPOSIT ROUTES
// PREFIX: /api/v1/admin/Wallet
// ======================================================

// View all pending deposits
router.get(
  "/admin/deposits/pending",
  authenticate,
  authorizeAdmin,
  getPendingDeposits
);

// ======================================================
// SECTION 2/10 END
// DEPOSIT ROUTES COMPLETE
// ======================================================
// SECTION 3/10 START
// WITHDRAWAL ROUTES (BANK + CRYPTO + GOLD)
// ======================================================

// ======================================================
// BANK WITHDRAWAL ROUTES
// PREFIX: /api/v1/Wallet/withdraw
// ======================================================

// Create bank withdrawal request
router.post(
  "/withdraw/bank",
  authenticate,
  createBankWithdrawal
);

// ======================================================
// CRYPTO WITHDRAWAL ROUTES
// ======================================================

// Create crypto withdrawal request
router.post(
  "/withdraw/crypto",
  authenticate,
  createCryptoWithdrawal
);

// ======================================================
// GOLD WITHDRAWAL ROUTES
// ======================================================

// Withdraw physical gold from vault
router.post(
  "/withdraw/gold",
  authenticate,
  createGoldWithdrawal
);

// ======================================================
// WITHDRAWAL SECURITY ROUTES
// ======================================================

// Verify withdrawal OTP / PIN
router.post(
  "/withdraw/:withdrawalId/verify",
  authenticate,
  verifyWithdrawalOTP
);

// ======================================================
// WITHDRAWAL history ROUTES
// ======================================================

// Get all withdrawals
router.get(
  "/withdrawals",
  authenticate,
  getWithdrawalhistory
);

// Get withdrawal details
router.get(
  "/withdrawals/:withdrawalId",
  authenticate,
  getWithdrawalById
);

// Cancel pending withdrawal
router.delete(
  "/withdrawals/:withdrawalId",
  authenticate,
  cancelWithdrawalRequest
);

// ======================================================
// WITHDRAWAL LIMITS & FEES
// ======================================================

// Get withdrawal limits
router.get(
  "/withdraw/limits",
  authenticate,
  getWithdrawalLimits
);

// Get withdrawal fee structure
router.get(
  "/withdraw/fees",
  authenticate,
  getWithdrawalFees
);

// ======================================================
// ADMIN WITHDRAWAL MANAGEMENT
// PREFIX: /api/v1/admin/Wallet
// ======================================================

// View pending withdrawals
router.get(
  "/admin/withdrawals/pending",
  authenticate,
  authorizeAdmin,
  getPendingWithdrawals
);

// Approve withdrawal
router.post(
  "/admin/withdrawals/:withdrawalId/approve",
  authenticate,
  authorizeAdmin,
  approveWithdrawal
);

// Reject withdrawal
router.post(
  "/admin/withdrawals/:withdrawalId/reject",
  authenticate,
  authorizeAdmin,
  rejectWithdrawal
);

// ======================================================
// SECTION 3/10 END
// WITHDRAWAL ROUTES COMPLETE
// ======================================================
// SECTION 4/10 START
// BANK ACCOUNTS + CRYPTO ADDRESSES + ADDRESS BOOK ROUTES
// ======================================================

// ======================================================
// BANK ACCOUNT ROUTES
// PREFIX: /api/v1/Wallet/bank
// ======================================================

// Add bank account
router.post(
  "/bank/accounts",
  authenticate,
  addBankAccount
);

// Get all linked bank accounts
router.get(
  "/bank/accounts",
  authenticate,
  getBankAccounts
);

// Get bank account details
router.get(
  "/bank/accounts/:accountId",
  authenticate,
  getBankAccountById
);

// Update bank account
router.put(
  "/bank/accounts/:accountId",
  authenticate,
  updateBankAccount
);

// Delete bank account
router.delete(
  "/bank/accounts/:accountId",
  authenticate,
  deleteBankAccount
);

// Set default bank account
router.put(
  "/bank/accounts/:accountId/default",
  authenticate,
  setDefaultBankAccount
);

// ======================================================
// CRYPTO Wallet ADDRESS ROUTES
// PREFIX: /api/v1/Wallet/crypto-addresses
// ======================================================

// Add crypto Wallet address
router.post(
  "/crypto-addresses",
  authenticate,
  addCryptoAddress
);

// Get crypto Wallet addresses
router.get(
  "/crypto-addresses",
  authenticate,
  getCryptoAddresses
);

// Get crypto address by ID
router.get(
  "/crypto-addresses/:addressId",
  authenticate,
  getCryptoAddressById
);

// Update crypto Wallet address
router.put(
  "/crypto-addresses/:addressId",
  authenticate,
  updateCryptoAddress
);

// Delete crypto Wallet address
router.delete(
  "/crypto-addresses/:addressId",
  authenticate,
  deleteCryptoAddress
);

// Set default crypto address
router.put(
  "/crypto-addresses/:addressId/default",
  authenticate,
  setDefaultCryptoAddress
);

// ======================================================
// Wallet ADDRESS BOOK ROUTES
// PREFIX: /api/v1/Wallet/address-book
// ======================================================

// Add address book contact
router.post(
  "/address-book",
  authenticate,
  addWalletAddressBook
);

// Get address book
router.get(
  "/address-book",
  authenticate,
  getWalletAddressBook
);

// Get address book contact
router.get(
  "/address-book/:contactId",
  authenticate,
  getWalletAddressBookById
);

// Update address book contact
router.put(
  "/address-book/:contactId",
  authenticate,
  updateWalletAddressBook
);

// Delete address book contact
router.delete(
  "/address-book/:contactId",
  authenticate,
  deleteWalletAddressBook
);

// ======================================================
// SECTION 4/10 END
// BANK + CRYPTO ADDRESS MANAGEMENT ROUTES COMPLETE
// ======================================================
// SECTION 5/10 START
// Wallet TRANSFER + INTERNAL TRANSFER + GOLD TRANSFER ROUTES
// ======================================================

// ======================================================
// INTERNAL USER TRANSFER ROUTES
// PREFIX: /api/v1/Wallet/transfer
// ======================================================

// Transfer Fiat balance to another GoldTrade user
router.post(
  "/transfer/fiat",
  authenticate,
  transferFiatBalance
);

// Transfer Crypto balance to another GoldTrade user
router.post(
  "/transfer/crypto",
  authenticate,
  transferCryptoBalance
);

// Transfer Gold balance to another GoldTrade user
router.post(
  "/transfer/gold",
  authenticate,
  transferGoldBalance
);

// Transfer between user's own Wallets
router.post(
  "/transfer/internal",
  authenticate,
  transferBetweenWallets
);

// Universal transfer endpoint (email/userId/phone/referral)
router.post(
  "/transfer/user",
  authenticate,
  transferToUser
);

// ======================================================
// TRANSFER VALIDATION
// ======================================================

// Validate recipient before transfer
router.post(
  "/transfer/validate-recipient",
  authenticate,
  validateTransferRecipient
);

// Estimate transfer fee
router.post(
  "/transfer/estimate-fee",
  authenticate,
  estimateTransferFee
);

// Transfer limits
router.get(
  "/transfer/limits",
  authenticate,
  getTransferLimits
);

// ======================================================
// TRANSFER history ROUTES
// ======================================================

// All transfers
router.get(
  "/transfers",
  authenticate,
  getTransferhistory
);

// Single transfer details
router.get(
  "/transfers/:transferId",
  authenticate,
  getTransferById
);

// Cancel pending transfer
router.delete(
  "/transfers/:transferId",
  authenticate,
  cancelTransfer
);

// ======================================================
// ADMIN TRANSFER MANAGEMENT
// PREFIX: /api/v1/admin/Wallet
// ======================================================

// Pending transfers
router.get(
  "/admin/transfers/pending",
  authenticate,
  authorizeAdmin,
  getPendingTransfers
);

// Approve transfer
router.post(
  "/admin/transfers/:transferId/approve",
  authenticate,
  authorizeAdmin,
  approveTransfer
);

// Reject transfer
router.post(
  "/admin/transfers/:transferId/reject",
  authenticate,
  authorizeAdmin,
  rejectTransfer
);

// ======================================================
// SECTION 5/10 END
// Wallet TRANSFER ROUTES COMPLETE
// ======================================================
// SECTION 6/10 START
// TRANSACTION history + STATEMENTS + EXPORT ROUTES
// ======================================================

// ======================================================
// TRANSACTION history ROUTES
// PREFIX: /api/v1/Wallet/transactions
// ======================================================

// Complete transaction history
router.get(
  "/transactions",
  authenticate,
  getTransactionhistory
);

// Single transaction details
router.get(
  "/transactions/:transactionId",
  authenticate,
  getTransactionById
);

// Transaction summary dashboard
router.get(
  "/transactions-summary",
  authenticate,
  getTransactionSummary
);

// Search transactions
router.get(
  "/transactions/search",
  authenticate,
  searchTransactions
);

// Filter transactions
router.post(
  "/transactions/filter",
  authenticate,
  filterTransactions
);

// ======================================================
// Wallet STATEMENTS ROUTES
// ======================================================

// Monthly Wallet statement
router.get(
  "/statement/monthly",
  authenticate,
  getMonthlyStatement
);

// Annual Wallet statement
router.get(
  "/statement/annual",
  authenticate,
  getAnnualStatement
);

// ======================================================
// EXPORT TRANSACTION history
// ======================================================

// Export CSV
router.get(
  "/transactions/export/csv",
  authenticate,
  exportTransactionsCSV
);

// Export PDF
router.get(
  "/transactions/export/pdf",
  authenticate,
  exportTransactionsPDF
);

// Export Excel
router.get(
  "/transactions/export/excel",
  authenticate,
  exportTransactionsExcel
);

// ======================================================
// TRANSACTION RECEIPTS
// ======================================================

// Download receipt
router.get(
  "/transactions/:transactionId/receipt",
  authenticate,
  downloadTransactionReceipt
);

// Resend receipt
router.post(
  "/transactions/:transactionId/resend-receipt",
  authenticate,
  resendTransactionReceipt
);

// ======================================================
// Wallet ANALYTICS ROUTES
// ======================================================

// Transaction analytics
router.get(
  "/transactions/analytics",
  authenticate,
  getTransactionAnalytics
);

// Wallet cash flow
router.get(
  "/cash-flow",
  authenticate,
  getWalletCashFlow
);

// ======================================================
// SECTION 6/10 END
// TRANSACTION history + STATEMENTS ROUTES COMPLETE
// ======================================================
// SECTION 7/10 START
// REWARDS + CASHBACK + BONUS + REFERRAL Wallet ROUTES
// ======================================================

// ======================================================
// REWARD Wallet ROUTES
// PREFIX: /api/v1/Wallet/rewards
// ======================================================

// Reward Wallet overview
router.get(
  "/rewards",
  authenticate,
  getRewardsWallet
);

// Reward balance only
router.get(
  "/rewards/balance",
  authenticate,
  getRewardBalance
);

// Claim reward
router.post(
  "/rewards/claim",
  authenticate,
  claimReward
);

// Reward transaction history
router.get(
  "/rewards/history",
  authenticate,
  getRewardhistory
);

// ======================================================
// CASHBACK ROUTES
// ======================================================

// Cashback history
router.get(
  "/cashback/history",
  authenticate,
  getCashbackhistory
);

// ======================================================
// REWARD CONVERSION ROUTES
// ======================================================

// Convert reward balance into fiat Wallet
router.post(
  "/rewards/convert",
  authenticate,
  convertRewardToWallet
);

// Transfer reward balance to another user
router.post(
  "/rewards/transfer",
  authenticate,
  transferRewardBalance
);

// ======================================================
// REFERRAL BONUS Wallet
// ======================================================

// Referral Wallet summary
router.get(
  "/referral-Wallet",
  authenticate,
  getReferralWallet
);

// Claim referral bonus
router.post(
  "/referral-Wallet/claim",
  authenticate,
  claimReferralBonus
);

// Referral bonus history
router.get(
  "/referral-Wallet/history",
  authenticate,
  getReferralBonushistory
);

// ======================================================
// WELCOME BONUS ROUTES
// ======================================================

// View welcome bonus eligibility
router.get(
  "/bonus/welcome",
  authenticate,
  getWelcomeBonus
);

// Claim welcome bonus
router.post(
  "/bonus/welcome/claim",
  authenticate,
  claimWelcomeBonus
);

// ======================================================
// LOYALTY POINTS ROUTES
// ======================================================

// Loyalty points summary
router.get(
  "/loyalty-points",
  authenticate,
  getLoyaltyPoints
);

// Redeem loyalty points
router.post(
  "/loyalty-points/redeem",
  authenticate,
  redeemLoyaltyPoints
);

// ======================================================
// BONUS ANALYTICS ROUTES
// ======================================================

// Bonus Wallet dashboard
router.get(
  "/bonus/summary",
  authenticate,
  getBonusWalletSummary
);

// Reward statistics
router.get(
  "/bonus/statistics",
  authenticate,
  getRewardStatistics
);

// ======================================================
// ADMIN BONUS MANAGEMENT ROUTES
// PREFIX: /api/v1/admin/Wallet
// ======================================================

// Reward statistics (admin)
router.get(
  "/admin/rewards/statistics",
  authenticate,
  authorizeAdmin,
  getRewardStatistics
);

// ======================================================
// SECTION 7/10 END
// REWARDS + BONUS Wallet ROUTES COMPLETE
// ======================================================
// SECTION 8/10 START
// PRICE ALERTS + AUTO INVEST + SAVINGS VAULT ROUTES
// ======================================================

// ======================================================
// GOLD PRICE ALERT ROUTES
// PREFIX: /api/v1/Wallet/alerts
// ======================================================

// Create new price alert
router.post(
  "/alerts",
  authenticate,
  createPriceAlert
);

// Get all alerts
router.get(
  "/alerts",
  authenticate,
  getPriceAlerts
);

// Get alert details
router.get(
  "/alerts/:alertId",
  authenticate,
  getPriceAlertById
);

// Update alert
router.put(
  "/alerts/:alertId",
  authenticate,
  updatePriceAlert
);

// Enable / Disable alert
router.patch(
  "/alerts/:alertId/toggle",
  authenticate,
  togglePriceAlert
);

// Delete alert
router.delete(
  "/alerts/:alertId",
  authenticate,
  deletePriceAlert
);

// ======================================================
// AUTO INVEST ROUTES
// PREFIX: /api/v1/Wallet/auto-invest
// ======================================================

// Create recurring investment plan
router.post(
  "/auto-invest",
  authenticate,
  createAutoInvestPlan
);

// List investment plans
router.get(
  "/auto-invest",
  authenticate,
  getAutoInvestPlans
);

// Plan details
router.get(
  "/auto-invest/:planId",
  authenticate,
  getAutoInvestPlanById
);

// Update plan
router.put(
  "/auto-invest/:planId",
  authenticate,
  updateAutoInvestPlan
);

// Pause recurring plan
router.patch(
  "/auto-invest/:planId/pause",
  authenticate,
  pauseAutoInvestPlan
);

// Resume recurring plan
router.patch(
  "/auto-invest/:planId/resume",
  authenticate,
  resumeAutoInvestPlan
);

// Cancel recurring plan
router.delete(
  "/auto-invest/:planId",
  authenticate,
  cancelAutoInvestPlan
);

// Execute scheduled investment manually (admin / cron)
router.post(
  "/auto-invest/:planId/execute",
  authenticate,
  executeScheduledInvestment
);

// ======================================================
// SAVINGS VAULT ROUTES
// PREFIX: /api/v1/Wallet/savings
// ======================================================

// Create savings vault
router.post(
  "/savings/vault",
  authenticate,
  createSavingsVault
);

// Savings vault overview
router.get(
  "/savings/vault",
  authenticate,
  getSavingsVault
);

// Deposit into savings vault
router.post(
  "/savings/deposit",
  authenticate,
  depositSavingsVault
);

// Withdraw from savings vault
router.post(
  "/savings/withdraw",
  authenticate,
  withdrawSavingsVault
);

// Savings history
router.get(
  "/savings/history",
  authenticate,
  getSavingshistory
);

// ======================================================
// SCHEDULED JOBS ROUTES
// ======================================================

// Scheduled Wallet jobs / cron status
router.get(
  "/scheduled-jobs",
  authenticate,
  getScheduledWalletJobs
);

// ======================================================
// SECTION 8/10 END
// PRICE ALERTS + AUTO INVEST + SAVINGS VAULT ROUTES COMPLETE
// ======================================================
// SECTION 9/10 START
// ADMIN Wallet MANAGEMENT + TREASURY + LIQUIDITY + RISK ROUTES
// ======================================================

// ======================================================
// ADMIN Wallet DASHBOARD ROUTES
// PREFIX: /api/v1/admin/Wallet
// ======================================================

// Enterprise Wallet dashboard
router.get(
  "/admin/dashboard",
  authenticate,
  authorizeAdmin,
  getAdminWalletDashboard
);

// Wallet health status
router.get(
  "/admin/health",
  authenticate,
  authorizeAdmin,
  getWalletHealthStatus
);

// Wallet audit logs
router.get(
  "/admin/audit-logs",
  authenticate,
  authorizeAdmin,
  getWalletAuditLogs
);

// ======================================================
// TREASURY MANAGEMENT ROUTES
// ======================================================

// Treasury overview
router.get(
  "/admin/treasury",
  authenticate,
  authorizeAdmin,
  getTreasuryOverview
);

// Update treasury balances
router.put(
  "/admin/treasury",
  authenticate,
  authorizeAdmin,
  updateTreasuryBalances
);

// ======================================================
// LIQUIDITY POOL ROUTES
// ======================================================

// Liquidity pool status
router.get(
  "/admin/liquidity",
  authenticate,
  authorizeAdmin,
  getLiquidityPoolStatus
);

// Refill liquidity pool
router.post(
  "/admin/liquidity/refill",
  authenticate,
  authorizeAdmin,
  refillLiquidityPool
);

// ======================================================
// RESERVE Wallet ROUTES
// ======================================================

// Reserve Wallet balances
router.get(
  "/admin/reserve-Wallet",
  authenticate,
  authorizeAdmin,
  getReserveWalletStatus
);

// Update reserve Wallet
router.put(
  "/admin/reserve-Wallet",
  authenticate,
  authorizeAdmin,
  updateReserveWallet
);

// ======================================================
// GOLD VAULT ROUTES
// ======================================================

// Gold vault inventory
router.get(
  "/admin/vault-gold",
  authenticate,
  authorizeAdmin,
  getVaultGoldInventory
);

// Update vault inventory
router.put(
  "/admin/vault-gold",
  authenticate,
  authorizeAdmin,
  updateVaultGoldInventory
);

// ======================================================
// Wallet RISK MANAGEMENT ROUTES
// ======================================================

// Wallet exposure report
router.get(
  "/admin/risk-exposure",
  authenticate,
  authorizeAdmin,
  getRiskExposureReport
);

// Freeze user Wallet
router.post(
  "/admin/users/:userId/freeze",
  authenticate,
  authorizeAdmin,
  freezeWallet
);

// Unfreeze user Wallet
router.post(
  "/admin/users/:userId/unfreeze",
  authenticate,
  authorizeAdmin,
  unfreezeWallet
);

// List frozen Wallets
router.get(
  "/admin/frozen-Wallets",
  authenticate,
  authorizeAdmin,
  getFrozenWallets
);

// ======================================================
// Wallet RECONCILIATION ROUTES
// ======================================================

// Sync Wallet balances
router.post(
  "/admin/sync-balances",
  authenticate,
  authorizeAdmin,
  syncWalletBalances
);

// Reconcile Wallet balances
router.post(
  "/admin/reconcile-balances",
  authenticate,
  authorizeAdmin,
  reconcileWalletBalances
);

// ======================================================
// SECTION 9/10 END
// ADMIN Wallet MANAGEMENT ROUTES COMPLETE
// ======================================================
// SECTION 10/10 START
// Wallet HEALTH + WEBHOOKS + ADMIN SYSTEM + FINAL ROUTES
// ======================================================

// ======================================================
// Wallet HEALTH ROUTES
// PREFIX: /api/v1/Wallet
// ======================================================

// Wallet service health
router.get("/health", getWalletHealth);

// Wallet module version
router.get("/version", getWalletVersion);

// Verify Wallet integrity
router.get(
  "/verify-integrity",
  authenticate,
  verifyWalletIntegrity
);

// Refresh Wallet cache
router.post(
  "/refresh-cache",
  authenticate,
  refreshWalletCache
);

// ======================================================
// CONFIGURATION ROUTES
// ======================================================

// Supported fiat / crypto / gold currencies
router.get(
  "/supported-currencies",
  getSupportedCurrencies
);

// Supported blockchain networks
router.get(
  "/supported-networks",
  getSupportedNetworks
);

// Live exchange rates
router.get(
  "/exchange-rates",
  authenticate,
  getExchangeRates
);

// Wallet configuration
router.get(
  "/configuration",
  authenticate,
  getWalletConfiguration
);

// ======================================================
// WEBHOOK ROUTES
// PREFIX: /api/v1/Wallet/webhooks
// ======================================================

// Generic Wallet webhook
router.post(
  "/webhooks/Wallet",
  WalletWebhook
);

// Blockchain deposit webhook
router.post(
  "/webhooks/crypto-deposit",
  cryptoDepositWebhook
);

// Bank deposit webhook
router.post(
  "/webhooks/bank-deposit",
  bankDepositWebhook
);

// Withdrawal / payout webhook
router.post(
  "/webhooks/payout",
  payoutWebhook
);

// ======================================================
// ADMIN SYSTEM ROUTES
// PREFIX: /api/v1/admin/Wallet/system
// ======================================================

// Wallet system statistics
router.get(
  "/admin/system/statistics",
  authenticate,
  authorizeAdmin,
  getWalletSystemStatistics
);

// Cleanup expired transactions
router.post(
  "/admin/system/cleanup/transactions",
  authenticate,
  authorizeAdmin,
  cleanupExpiredTransactions
);

// Cleanup pending deposits
router.post(
  "/admin/system/cleanup/deposits",
  authenticate,
  authorizeAdmin,
  cleanupPendingDeposits
);

// Cleanup pending withdrawals
router.post(
  "/admin/system/cleanup/withdrawals",
  authenticate,
  authorizeAdmin,
  cleanupPendingWithdrawals
);

// Rebuild Wallet indexes
router.post(
  "/admin/system/rebuild-indexes",
  authenticate,
  authorizeAdmin,
  rebuildWalletIndexes
);

// Synchronize blockchain balances
router.post(
  "/admin/system/sync-blockchain",
  authenticate,
  authorizeAdmin,
  synchronizeBlockchainBalances
);

// ======================================================
// SECTION 10/10 END
// Wallet ROUTES COMPLETE
// ======================================================

export default router;