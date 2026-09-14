// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/routes/adminRoutes.ts
// SECTION 1/10
// IMPORTS + ROUTER + JWT AUTH MIDDLEWARE
// ======================================================

import { Router } from "express";

// ================= AUTH MIDDLEWARE =================

import { verifyToken as verifyAdminToken } from "../../middleware/authMiddleware";

// ================= ADMIN CONTROLLERS =================

import {
  checkAdminAuth,
  getAdminDashboard,
  getActivityLogs,
  getDatabaseStatus,

  getAllUsers,
  searchUsers,
  getUserDetails,
  blockUser,
  unblockUser,
  updateWalletBalance,
  deleteUser,

  getPendingKycRequests,
  approveKyc,
  rejectKyc,
  getKycStatistics,
  getUserKycDetails,

  getAllDeposits,
  getDepositDetails,
  approveDeposit,
  rejectDeposit,
  getDepositStatistics,
  deleteDeposit,

  getAllWithdrawals,
  getWithdrawalDetails,
  approveWithdrawal,
  rejectWithdrawal,
  bulkApproveWithdrawals,
  getWithdrawalStatistics,
  deleteWithdrawal,

  getGoldPriceSettings,
  updateGoldPrice,
  getTradingSettings,
  updateTradingSettings,
  updateTradingSession,
  toggleTradingStatus,
  getTradingStatus,

  getReferralDashboard,
  updateReferralSettings,
  createPromoCode,
  updatePromoStatus,
  deletePromoCode,
  updateAffiliateCommission,
  launchBonusCampaign,
  getReferralLeaderboard,

  getRevenueReport,
  getMonthlyRevenueReport,
  getUserAnalytics,
  getTradingAnalytics,
  getActivityLogReport,
  exportUsersReport,
  exportDepositsReport,
  exportWithdrawalsReport,
  getDashboardSummary,

  getAdminSettings,
  updateAdminSettings,
  toggleMaintenanceMode,
  getSystemHealth,
  backupDatabase,
  clearApplicationCache,
  restartBackgroundWorkers,
  getQuickSummary,
  adminLogout,
} from "../controllers/adminController";

// ================= ROUTER =================

const router = Router();

// ======================================================
// GLOBAL ADMIN AUTH MIDDLEWARE
// Every route below requires SUPER_ADMIN JWT
// ======================================================

router.use(verifyAdminToken);

// ======================================================
// HEALTH CHECK ROUTE
// ======================================================

router.get("/auth/check", checkAdminAuth);

// ======================================================
// DASHBOARD ROUTES START IN SECTION 2
// ======================================================

// ======================================================
// END OF SECTION 1/10
// NEXT SECTION: DASHBOARD ROUTES
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/routes/adminRoutes.ts
// SECTION 2/10
// DASHBOARD ROUTES
// ======================================================

/**
 * ADMIN AUTH
 */

router.get("/auth/check", checkAdminAuth);

/**
 * DASHBOARD
 */

router.get("/dashboard", getAdminDashboard);

/**
 * QUICK SUMMARY
 */

router.get("/dashboard/summary", getDashboardSummary);

router.get("/dashboard/quick-summary", getQuickSummary);

/**
 * ACTIVITY LOGS
 */

router.get("/activity", getActivityLogs);

router.get("/activity/logs", getActivityLogReport);

/**
 * DATABASE STATUS
 */

router.get("/database/status", getDatabaseStatus);

/**
 * SYSTEM HEALTH
 */

router.get("/system/health", getSystemHealth);

/**
 * PLATFORM SETTINGS (READ ONLY)
 */

router.get("/settings", getAdminSettings);

/**
 * GOLD PRICE STATUS
 */

router.get("/gold-price", getGoldPriceSettings);

/**
 * TRADING STATUS
 */

router.get("/trading/status", getTradingStatus);

router.get("/trading/settings", getTradingSettings);

// ======================================================
// END OF SECTION 2/10
// NEXT SECTION: USER MANAGEMENT ROUTES
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/routes/adminRoutes.ts
// SECTION 3/10
// USER MANAGEMENT ROUTES
// ======================================================

/**
 * USER LIST
 */

router.get("/users", getAllUsers);

/**
 * USER SEARCH
 */

router.get("/users/search", searchUsers);

/**
 * USER DETAILS
 */

router.get("/users/:id", getUserDetails);

/**
 * USER WALLET MANAGEMENT
 */

router.patch("/users/:id/wallet", updateWalletBalance);

/**
 * BLOCK / UNBLOCK USER
 */

router.patch("/users/:id/block", blockUser);

router.patch("/users/:id/unblock", unblockUser);

/**
 * DELETE USER
 */

router.delete("/users/:id", deleteUser);

/**
 * USER ANALYTICS
 */

router.get("/users/analytics", getUserAnalytics);

/**
 * USER EXPORT
 */

router.get("/users/export", exportUsersReport);

// ======================================================
// END OF SECTION 3/10
// NEXT SECTION: KYC MANAGEMENT ROUTES
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/routes/adminRoutes.ts
// SECTION 4/10
// KYC MANAGEMENT ROUTES
// ======================================================

/**
 * KYC DASHBOARD & STATISTICS
 */

// Get KYC statistics
router.get("/kyc/stats", getKycStatistics);

// Get pending KYC requests
router.get("/kyc/pending", getPendingKycRequests);

/**
 * USER KYC DETAILS
 */

// Get single user's KYC details
router.get("/kyc/user/:id", getUserKycDetails);

// Alias route for frontend compatibility
router.get("/users/:id/kyc", getUserKycDetails);

/**
 * KYC APPROVAL
 */

// Approve user KYC
router.patch("/kyc/approve/:id", approveKyc);

// Reject user KYC
router.patch("/kyc/reject/:id", rejectKyc);

/**
 * BULK KYC ROUTES (Future Ready)
 */

// Approve multiple KYC requests
router.patch("/kyc/bulk/approve", async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Bulk KYC approval will be available in Enterprise V18."
  });
});

// Reject multiple KYC requests
router.patch("/kyc/bulk/reject", async (req, res) => {
  res.status(501).json({
    success: false,
    message: "Bulk KYC rejection will be available in Enterprise V18."
  });
});

/**
 * KYC FILTER ROUTES
 */

// All verified users
router.get("/kyc/verified", async (req, res) => {
  req.query.status = "VERIFIED";
  return getPendingKycRequests(req, res);
});

// All rejected users
router.get("/kyc/rejected", async (req, res) => {
  req.query.status = "REJECTED";
  return getPendingKycRequests(req, res);
});

// ======================================================
// END OF SECTION 4/10
// NEXT SECTION: DEPOSIT MANAGEMENT ROUTES
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/routes/adminRoutes.ts
// SECTION 5/10
// DEPOSIT MANAGEMENT ROUTES
// ======================================================

/**
 * DEPOSIT LIST
 */

// Get all deposits
router.get("/deposits", getAllDeposits);

// Get deposits by status
router.get("/deposits/status/:status", getAllDeposits);

// Deposit statistics
router.get("/deposits/stats", getDepositStatistics);

/**
 * SINGLE DEPOSIT DETAILS
 */

// Get single deposit
router.get("/deposits/:id", getDepositDetails);

/**
 * DEPOSIT APPROVAL ROUTES
 */

// Approve deposit
router.patch("/deposits/:id/approve", approveDeposit);

// Reject deposit
router.patch("/deposits/:id/reject", rejectDeposit);

/**
 * BULK DEPOSIT ACTIONS (Future Ready)
 */

// Bulk approve deposits
router.patch("/deposits/bulk/approve", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Bulk deposit approval will be available in Enterprise V18."
  });
});

// Bulk reject deposits
router.patch("/deposits/bulk/reject", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Bulk deposit rejection will be available in Enterprise V18."
  });
});

/**
 * DELETE REJECTED DEPOSIT
 */

router.delete("/deposits/:id", deleteDeposit);

/**
 * DEPOSIT EXPORT ROUTES
 */

// Export deposits report
router.get("/reports/deposits/export", exportDepositsReport);

// Alias route for frontend compatibility
router.get("/deposits/export", exportDepositsReport);

/**
 * DEPOSIT FILTER ROUTES
 */

// Pending deposits
router.get("/deposits/pending", getAllDeposits);

// Approved deposits
router.get("/deposits/approved", getAllDeposits);

// Rejected deposits
router.get("/deposits/rejected", getAllDeposits);

// Today's deposits
router.get("/deposits/today", async (req, res) => {
  req.query.today = "true";
  return getAllDeposits(req, res);
});

// ======================================================
// END OF SECTION 5/10
// NEXT SECTION: WITHDRAWAL MANAGEMENT ROUTES
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/routes/adminRoutes.ts
// SECTION 6/10
// WITHDRAWAL MANAGEMENT ROUTES
// ======================================================

/**
 * WITHDRAWAL LIST
 */

// Get all withdrawals
router.get("/withdrawals", getAllWithdrawals);

// Get withdrawals by status
router.get("/withdrawals/status/:status", getAllWithdrawals);

// Withdrawal statistics
router.get("/withdrawals/stats", getWithdrawalStatistics);

/**
 * SINGLE WITHDRAWAL DETAILS
 */

// Get single withdrawal
router.get("/withdrawals/:id", getWithdrawalDetails);

/**
 * WITHDRAWAL APPROVAL ROUTES
 */

// Approve withdrawal
router.patch("/withdrawals/:id/approve", approveWithdrawal);

// Reject withdrawal
router.patch("/withdrawals/:id/reject", rejectWithdrawal);

/**
 * BULK WITHDRAWAL APPROVAL
 */

// Bulk approve pending withdrawals
router.patch("/withdrawals/bulk/approve", bulkApproveWithdrawals);

// Bulk reject withdrawals (Future Ready)
router.patch("/withdrawals/bulk/reject", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Bulk withdrawal rejection will be available in Enterprise V18.",
  });
});

/**
 * DELETE REJECTED WITHDRAWAL
 */

router.delete("/withdrawals/:id", deleteWithdrawal);

/**
 * WITHDRAWAL EXPORT ROUTES
 */

// Export withdrawals report
router.get("/reports/withdrawals/export", exportWithdrawalsReport);

// Alias route for frontend compatibility
router.get("/withdrawals/export", exportWithdrawalsReport);

/**
 * WITHDRAWAL FILTER ROUTES
 */

// Pending withdrawals
router.get("/withdrawals/pending", getAllWithdrawals);

// Approved withdrawals
router.get("/withdrawals/approved", getAllWithdrawals);

// Rejected withdrawals
router.get("/withdrawals/rejected", getAllWithdrawals);

// Today's withdrawals
router.get("/withdrawals/today", async (req, res) => {
  req.query.today = "true";
  return getAllWithdrawals(req, res);
});

// ======================================================
// END OF SECTION 6/10
// NEXT SECTION: GOLD PRICE + TRADING MANAGEMENT ROUTES
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/routes/adminRoutes.ts
// SECTION 7/10
// GOLD PRICE + TRADING MANAGEMENT ROUTES
// ======================================================

/**
 * GOLD PRICE ROUTES
 */

// Get current gold price
router.get("/gold-price", getGoldPriceSettings);

// Update gold price (Buy / Sell / USD Rate)
router.patch("/gold-price", updateGoldPrice);

// Refresh live gold price (Future API integration)
router.post("/gold-price/refresh", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Live Gold API refresh will be available in Enterprise V18.",
  });
});

/**
 * TRADING SETTINGS ROUTES
 */

// Get trading configuration
router.get("/trading/settings", getTradingSettings);

// Update trading configuration
router.patch("/trading/settings", updateTradingSettings);

// Get trading status
router.get("/trading/status", getTradingStatus);

/**
 * TRADING SESSION ROUTES
 */

// Update market session timing
router.patch("/trading/session", updateTradingSession);

/**
 * TRADING CONTROL ROUTES
 */

// Pause / Resume trading
router.patch("/trading/control", toggleTradingStatus);

// Pause all trading
router.patch("/trading/pause-all", async (req, res) => {
  req.body.action = "PAUSE_ALL";
  return toggleTradingStatus(req, res);
});

// Resume all trading
router.patch("/trading/resume-all", async (req, res) => {
  req.body.action = "RESUME_ALL";
  return toggleTradingStatus(req, res);
});

// Pause buy orders
router.patch("/trading/pause-buy", async (req, res) => {
  req.body.action = "PAUSE_BUY";
  return toggleTradingStatus(req, res);
});

// Resume buy orders
router.patch("/trading/resume-buy", async (req, res) => {
  req.body.action = "RESUME_BUY";
  return toggleTradingStatus(req, res);
});

// Pause sell orders
router.patch("/trading/pause-sell", async (req, res) => {
  req.body.action = "PAUSE_SELL";
  return toggleTradingStatus(req, res);
});

// Resume sell orders
router.patch("/trading/resume-sell", async (req, res) => {
  req.body.action = "RESUME_SELL";
  return toggleTradingStatus(req, res);
});

/**
 * MARKET SETTINGS ROUTES
 */

// Market spread settings (Future Ready)
router.patch("/market/spread", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Market spread configuration will be available in Enterprise V18.",
  });
});

// Market open / close status
router.get("/market/status", getTradingStatus);

// Market session info
router.get("/market/session", getTradingStatus);

/**
 * TRADING ANALYTICS ROUTES
 */

// Trading analytics report
router.get("/reports/trading", getTradingAnalytics);

// Gold price history (Future Ready)
router.get("/gold-price/history", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Gold price history API will be available in Enterprise V18.",
  });
});

// ======================================================
// END OF SECTION 7/10
// NEXT SECTION: REFERRAL + COMMISSION MANAGEMENT ROUTES
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/routes/adminRoutes.ts
// SECTION 8/10
// REFERRAL + COMMISSION + PROMO CODE ROUTES
// ======================================================

/**
 * REFERRAL DASHBOARD ROUTES
 */

// Referral dashboard summary
router.get("/referrals/dashboard", getReferralDashboard);

// Referral leaderboard
router.get("/referrals/leaderboard", getReferralLeaderboard);

// Update referral settings
router.patch("/referrals/settings", updateReferralSettings);

/**
 * PROMO CODE MANAGEMENT ROUTES
 */

// Create promo code
router.post("/promo-codes", createPromoCode);

// Enable / Disable promo code
router.patch("/promo-codes/:code/status", updatePromoStatus);

// Delete promo code
router.delete("/promo-codes/:code", deletePromoCode);

/**
 * PROMO CODE LIST (Future Ready)
 */

router.get("/promo-codes", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Promo code listing API will be available in Enterprise V18."
  });
});

router.get("/promo-codes/:code", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Promo code details API will be available in Enterprise V18."
  });
});

/**
 * AFFILIATE COMMISSION ROUTES
 */

// Update affiliate commission settings
router.patch("/affiliate/settings", updateAffiliateCommission);

// Affiliate commission summary (Future Ready)
router.get("/affiliate/summary", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Affiliate summary API will be available in Enterprise V18."
  });
});

// Affiliate payout history (Future Ready)
router.get("/affiliate/payouts", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Affiliate payout API will be available in Enterprise V18."
  });
});

/**
 * BONUS CAMPAIGN ROUTES
 */

// Launch bonus campaign
router.post("/bonus-campaigns", launchBonusCampaign);

// List bonus campaigns (Future Ready)
router.get("/bonus-campaigns", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Bonus campaign listing API will be available in Enterprise V18."
  });
});

// Stop bonus campaign (Future Ready)
router.patch("/bonus-campaigns/:id/stop", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Bonus campaign stop API will be available in Enterprise V18."
  });
});

/**
 * REFERRAL REPORT ROUTES
 */

// Referral analytics
router.get("/reports/referrals", getReferralDashboard);

// Referral export (Future Ready)
router.get("/reports/referrals/export", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Referral export API will be available in Enterprise V18."
  });
});

// Commission report (Future Ready)
router.get("/reports/commissions", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Commission report API will be available in Enterprise V18."
  });
});

// ======================================================
// END OF SECTION 8/10
// NEXT SECTION: REPORTS + ANALYTICS ROUTES
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/routes/adminRoutes.ts
// SECTION 9/10
// REPORTS + ANALYTICS + ACTIVITY LOG ROUTES
// ======================================================

/**
 * DASHBOARD REPORTS
 */

// Complete dashboard summary
router.get("/reports/dashboard", getDashboardSummary);

// Quick dashboard summary
router.get("/reports/dashboard/quick", getQuickSummary);

/**
 * REVENUE REPORTS
 */

// Overall revenue report
router.get("/reports/revenue", getRevenueReport);

// Monthly revenue report
router.get("/reports/revenue/monthly", getMonthlyRevenueReport);

// Daily revenue report (Future Ready)
router.get("/reports/revenue/daily", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Daily revenue report will be available in Enterprise V18."
  });
});

/**
 * USER ANALYTICS
 */

// User analytics
router.get("/reports/users", getUserAnalytics);

// User growth report (Future Ready)
router.get("/reports/users/growth", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "User growth analytics will be available in Enterprise V18."
  });
});

// Active users report (Future Ready)
router.get("/reports/users/active", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Active users analytics will be available in Enterprise V18."
  });
});

/**
 * TRADING ANALYTICS
 */

// Trading analytics
router.get("/reports/trading", getTradingAnalytics);

// Gold trading volume (Future Ready)
router.get("/reports/trading/volume", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Trading volume analytics will be available in Enterprise V18."
  });
});

/**
 * DEPOSIT REPORTS
 */

// Deposit statistics
router.get("/reports/deposits", getDepositStatistics);

// Export deposits
router.get("/reports/deposits/export", exportDepositsReport);

/**
 * WITHDRAWAL REPORTS
 */

// Withdrawal statistics
router.get("/reports/withdrawals", getWithdrawalStatistics);

// Export withdrawals
router.get("/reports/withdrawals/export", exportWithdrawalsReport);

/**
 * REFERRAL REPORTS
 */

// Referral dashboard report
router.get("/reports/referrals", getReferralDashboard);

// Referral leaderboard report
router.get("/reports/referrals/leaderboard", getReferralLeaderboard);

/**
 * ACTIVITY LOG ROUTES
 */

// All activity logs
router.get("/reports/activity", getActivityLogReport);

// Recent activity logs
router.get("/reports/activity/recent", getActivityLogs);

// Activity logs export (Future Ready)
router.get("/reports/activity/export", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Activity log export will be available in Enterprise V18."
  });
});

/**
 * EXPORT CENTER ROUTES
 */

// Export users
router.get("/reports/export/users", exportUsersReport);

// Export deposits
router.get("/reports/export/deposits", exportDepositsReport);

// Export withdrawals
router.get("/reports/export/withdrawals", exportWithdrawalsReport);

// Export revenue PDF (Future Ready)
router.get("/reports/export/revenue-pdf", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Revenue PDF export will be available in Enterprise V18."
  });
});

// Export activity CSV (Future Ready)
router.get("/reports/export/activity-csv", async (req, res) => {
  return res.status(501).json({
    success: false,
    message: "Activity CSV export will be available in Enterprise V18."
  });
});

// ======================================================
// END OF SECTION 9/10
// NEXT SECTION: SETTINGS + MAINTENANCE + BACKUP ROUTES
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/routes/adminRoutes.ts
// SECTION 10/10
// SETTINGS + MAINTENANCE + BACKUP + SYSTEM ROUTES
// ======================================================

/**
 * PLATFORM SETTINGS
 */

// Get platform settings
router.get("/settings", getAdminSettings);

// Update platform settings
router.patch("/settings", updateAdminSettings);

/**
 * MAINTENANCE MODE
 */

// Get maintenance status
router.get("/maintenance", getAdminSettings);

// Enable / Disable maintenance mode
router.patch("/maintenance", toggleMaintenanceMode);

/**
 * SYSTEM HEALTH
 */

// Complete server health
router.get("/system/health", getSystemHealth);

// Database health
router.get("/system/database", getDatabaseStatus);

// Dashboard quick summary
router.get("/system/summary", getQuickSummary);

/**
 * CACHE MANAGEMENT
 */

// Clear application cache
router.post("/system/cache/clear", clearApplicationCache);

/**
 * BACKGROUND WORKERS
 */

// Restart background workers
router.post("/system/restart-workers", restartBackgroundWorkers);

/**
 * DATABASE BACKUP
 */

// Generate backup summary
router.get("/database/backup", backupDatabase);

// Download backup (Future Ready)
router.get("/database/backup/download", async (req, res) => {
  return res.status(501).json({
    success: false,
    message:
      "Database download backup will be available in Enterprise V18."
  });
});

// Restore backup (Future Ready)
router.post("/database/backup/restore", async (req, res) => {
  return res.status(501).json({
    success: false,
    message:
      "Database restore will be available in Enterprise V18."
  });
});

/**
 * SECURITY ROUTES
 */

// Force logout all users (Future Ready)
router.post("/security/logout-all-users", async (req, res) => {
  return res.status(501).json({
    success: false,
    message:
      "Force logout all users will be available in Enterprise V18."
  });
});

// Generate new JWT secret notice (Future Ready)
router.post("/security/rotate-jwt", async (req, res) => {
  return res.status(501).json({
    success: false,
    message:
      "JWT secret rotation will be available in Enterprise V18."
  });
});
/**
 * ADMIN LOGOUT
 */

router.post("/logout", adminLogout);

/**
 * API VERSION
 */

router.get("/", async (req, res) => {
  return res.status(200).json({
    success: true,
    application: "GoldTrade Pakistan Enterprise",
    version: "V17 Enterprise",
    backend: "Node.js + Express + MongoDB + TypeScript",
    authentication: "JWT Protected",
    status: "Running",
  });
});

// ======================================================
// EXPORT ROUTER
// ======================================================

export default router;

// ======================================================
// END OF FILE
// backend/src/routes/adminRoutes.ts
// GOLDTRADE V17 ENTERPRISE ROUTES COMPLETE
// ======================================================