import { Router } from "express";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const authController = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("../controllers/auth.controller");
  } catch {
    return {};
  }
})();

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
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require("../middleware/auth");
      } catch {
        return {};
      }
    }
  }
})();

const router = Router();

const controllerAny = authController as any;
const pick = (...names: string[]) =>
  names
    .map((name) => controllerAny[name])
    .find((fn) => typeof fn === "function") ||
  ((_req: any, res: any) =>
    res.status(501).json({ message: "Handler not implemented" }));

const passthrough = (_req: any, _res: any, next: any) => next();
const authenticate = authMiddleware.authenticate || passthrough;
const authorizeAdmin = authMiddleware.authorizeAdmin || passthrough;

const registerRoute = (
  method: "get" | "post" | "put" | "patch" | "delete",
  path: string,
  handlerNames: string[],
  needsAuth = true,
  needsAdmin = false
) => {
  const middlewares = [] as any[];
  if (needsAuth) middlewares.push(authenticate);
  if (needsAdmin) middlewares.push(authorizeAdmin);
  (router as any)[method](path, ...middlewares, pick(...handlerNames));
};

// Public auth
registerRoute("post", "/register", ["register"], false);
registerRoute("post", "/login", ["login"], false);
registerRoute("post", "/refresh-token", ["refreshToken"], false);
registerRoute("post", "/logout", ["logout"], false);
registerRoute("get", "/app-info", ["getPublicApplicationInfo"], false);

// Profile and account
registerRoute("get", "/profile", ["getProfile", "getMyProfile"]);
registerRoute("put", "/profile", ["updateProfile"]);
registerRoute("put", "/change-password", ["changePassword"]);
registerRoute("post", "/account/deactivate", ["deactivateAccount"]);
registerRoute("post", "/account/reactivate", ["reactivateAccount"]);

// Password recovery and security
registerRoute("post", "/forgot-password", ["forgotPassword"], false);
registerRoute("post", "/verify-reset-token", ["verifyResetToken"], false);
registerRoute("post", "/reset-password", ["resetPassword"], false);
registerRoute("post", "/resend-reset-token", ["resendResetToken"], false);
registerRoute("post", "/verify-password", ["verifyPassword"]);
registerRoute("get", "/security-settings", ["getSecuritySettings"]);
registerRoute("put", "/security-pin", ["updateSecurityPin"]);
registerRoute("post", "/security-pin/verify", ["verifySecurityPin"]);
registerRoute("post", "/biometric/enable", ["enableBiometricLogin"]);
registerRoute("post", "/biometric/disable", ["disableBiometricLogin"]);

// Sessions and devices
registerRoute("get", "/sessions", ["getMySessions"]);
registerRoute("get", "/sessions/:sessionId", ["getSessionById"]);
registerRoute("post", "/sessions/logout-current", ["logoutCurrentSession"]);
registerRoute("post", "/sessions/logout-all", ["logoutAllSessions"]);
registerRoute("delete", "/sessions/:sessionId", ["revokeSession"]);
registerRoute("post", "/sessions/logout-others", ["revokeOtherSessions"]);
registerRoute("get", "/devices", ["getTrustedDevices"]);
registerRoute("put", "/devices/:deviceId", ["renameTrustedDevice"]);
registerRoute("delete", "/devices/:deviceId", ["removeTrustedDevice"]);
registerRoute("get", "/login-history", ["getLoginHistory"]);

// KYC
registerRoute("post", "/kyc/submit", ["submitKYC"]);
registerRoute("get", "/kyc/status", ["getKYCStatus"]);
registerRoute("get", "/kyc/profile", ["getKYCProfile", "getMyProfile"]);
registerRoute("put", "/kyc/update", ["updateKYC"]);
registerRoute("post", "/kyc/upload/cnic-front", ["uploadCNICFront"]);
registerRoute("post", "/kyc/upload/cnic-back", ["uploadCNICBack"]);
registerRoute("post", "/kyc/upload/passport", ["uploadPassport"]);
registerRoute("post", "/kyc/upload/selfie", ["uploadSelfie"]);
registerRoute("post", "/kyc/upload/proof-address", ["uploadProofOfAddress"]);
registerRoute("delete", "/kyc/document/:documentType", ["deleteKYCDocument"]);

// Referral
registerRoute("get", "/referral/profile", ["getMyReferralProfile"]);
registerRoute("post", "/referral/generate-code", ["generateReferralCode"]);
registerRoute("post", "/referral/apply", ["applyReferralCode"]);
registerRoute("get", "/referral/validate/:code", ["validateReferralCode"]);
registerRoute("get", "/referral/stats", ["getReferralStats"]);
registerRoute("get", "/referral/history", ["getReferralHistory"]);
registerRoute("get", "/referral/rewards", ["getReferralRewardHistory"]);
registerRoute("post", "/referral/claim-reward", ["claimReferralReward"]);
registerRoute("post", "/referral/send-invite", ["sendReferralInvite"]);
registerRoute("get", "/referral/leaderboard", ["getReferralLeaderboard"]);

// Preferences and notifications
registerRoute("get", "/preferences", ["getAccountPreferences"]);
registerRoute("put", "/preferences", ["updateAccountPreferences"]);
registerRoute("get", "/notifications/settings", ["getNotificationSettings"]);
registerRoute("put", "/notifications/settings", ["updateNotificationSettings"]);
registerRoute("post", "/notifications/push/enable", ["enablePushNotifications"]);
registerRoute("post", "/notifications/push/disable", ["disablePushNotifications"]);
registerRoute("put", "/preferences/language", ["updateLanguagePreference"]);
registerRoute("put", "/preferences/currency", ["updateCurrencyPreference"]);
registerRoute("put", "/preferences/theme", ["updateThemePreference"]);
registerRoute("put", "/preferences/timezone", ["updateTimezonePreference"]);
registerRoute("put", "/preferences/privacy", ["updatePrivacySettings"]);

// Activity and security monitoring
registerRoute("get", "/activity", ["getAccountActivity"]);
registerRoute("get", "/activity/timeline", ["getAccountTimeline"]);
registerRoute("get", "/activity/login-devices", ["getRecentLoginDevices"]);
registerRoute("get", "/security/audit-logs", ["getSecurityAuditLogs"]);
registerRoute("get", "/security/tokens", ["getActiveTokens"]);
registerRoute("delete", "/security/tokens/:tokenId", ["revokeAccessToken"]);
registerRoute("post", "/security/tokens/revoke-all", ["revokeAllAccessTokens"]);
registerRoute("get", "/security/suspicious-activities", ["getSuspiciousActivities"]);
registerRoute("post", "/security/report-activity", ["reportSuspiciousActivity"]);
registerRoute("get", "/security/notifications", ["getSecurityNotifications"]);
registerRoute("delete", "/security/notifications", ["clearSecurityNotifications"]);
registerRoute("get", "/security/account-health", ["getAccountHealthStatus"]);
registerRoute("get", "/verify-token", ["verifyJWTToken"]);
registerRoute("post", "/refresh-permissions", ["refreshUserPermissions"]);

// Admin users and KYC
registerRoute("get", "/admin/auth/users", ["getAllUsers"], true, true);
registerRoute("get", "/admin/auth/users/:userId", ["getUserById"], true, true);
registerRoute("put", "/admin/auth/users/:userId/role", ["updateUserRole"], true, true);
registerRoute("post", "/admin/auth/users/:userId/suspend", ["suspendUser"], true, true);
registerRoute("post", "/admin/auth/users/:userId/unsuspend", ["unsuspendUser"], true, true);
registerRoute("delete", "/admin/auth/users/:userId", ["deleteUser"], true, true);
registerRoute("get", "/admin/auth/kyc/pending", ["getPendingKYC"], true, true);
registerRoute("post", "/admin/auth/kyc/:userId/approve", ["approveKYC"], true, true);
registerRoute("post", "/admin/auth/kyc/:userId/reject", ["rejectKYC"], true, true);
registerRoute("get", "/admin/auth/kyc/statistics", ["getKYCStatistics"], true, true);
registerRoute("get", "/admin/auth/users/:userId/security-logs", ["getUserSecurityLogs"], true, true);
registerRoute("post", "/admin/auth/users/:userId/force-logout", ["forceLogoutUser"], true, true);
registerRoute("post", "/admin/auth/users/:userId/reset-password", ["resetUserPasswordByAdmin"], true, true);

// Admin compliance and risk
registerRoute("get", "/admin/auth/compliance/status", ["getComplianceStatus"], true, true);
registerRoute("get", "/admin/auth/compliance/statistics", ["getComplianceStatistics"], true, true);
registerRoute("get", "/admin/auth/compliance/export", ["exportComplianceReport"], true, true);
registerRoute("get", "/admin/auth/audit-logs", ["getAuditLogs"], true, true);
registerRoute("get", "/admin/auth/users/:userId/audit-logs", ["getUserAuditLogs"], true, true);
registerRoute("get", "/admin/auth/audit-logs/export", ["exportAuditLogs"], true, true);
registerRoute("get", "/admin/auth/users/:userId/risk-profile", ["getRiskProfile"], true, true);
registerRoute("put", "/admin/auth/users/:userId/risk-profile", ["updateRiskProfile"], true, true);
registerRoute("get", "/admin/auth/fraud-alerts", ["getFraudAlerts"], true, true);
registerRoute("put", "/admin/auth/fraud-alerts/:alertId/review", ["markFraudAlertReviewed"], true, true);
registerRoute("get", "/admin/auth/blocked-users", ["getBlockedUsers"], true, true);
registerRoute("post", "/admin/auth/users/:userId/unblock", ["unblockUser"], true, true);
registerRoute("get", "/admin/auth/security-dashboard", ["getAdminSecurityDashboard"], true, true);
registerRoute("get", "/admin/auth/security-events", ["getSystemSecurityEvents"], true, true);

// Service and admin system
registerRoute("get", "/health", ["getAuthHealth"], false);
registerRoute("get", "/version", ["getAuthVersion"], false);
registerRoute("get", "/admin/auth/system/statistics", ["getSystemAuthStatistics"], true, true);
registerRoute("get", "/admin/auth/system/configuration", ["getAuthConfiguration"], true, true);
registerRoute("post", "/admin/auth/system/cleanup/sessions", ["cleanupExpiredSessions"], true, true);
registerRoute("post", "/admin/auth/system/cleanup/tokens", ["cleanupRevokedTokens"], true, true);
registerRoute("post", "/admin/auth/system/cleanup/reset-tokens", ["cleanupExpiredResetTokens"], true, true);
registerRoute("post", "/admin/auth/system/cleanup/devices", ["cleanupInactiveDevices"], true, true);

export default router;
