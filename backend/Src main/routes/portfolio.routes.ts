import { Router } from "express";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const portfolioController = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("../controllers/portfolio.controller");
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("../controllers/portfolio");
    } catch {
      return {};
    }
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

const controllerAny = portfolioController as any;
const pick = (...names: string[]) =>
  names
    .map((name) => controllerAny[name])
    .find((fn) => typeof fn === "function") ||
  ((_req: any, res: any) =>
    res.status(501).json({ message: "Handler not implemented" }));

const passthrough = (_req: any, _res: any, next: any) => next();
const authenticate = authMiddleware.authenticate || passthrough;
const authorizeAdmin = authMiddleware.authorizeAdmin || passthrough;

const register = (
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

// Dashboard
register("get", "/dashboard", ["getPortfolioDashboard"]);
register("get", "/summary", ["getPortfolioSummary"]);
register("get", "/net-worth", ["getPortfolioNetWorth"]);
register("get", "/balance", ["getPortfolioBalance"]);
register("get", "/holdings", ["getPortfolioHoldings"]);
register("get", "/allocation", ["getPortfolioAllocation"]);
register("get", "/settings", ["getPortfolioSettings"]);
register("put", "/settings", ["updatePortfolioSettings"]);
register("post", "/refresh", ["refreshPortfolio"]);

// Holdings
register("get", "/holdings/all", ["getAllHoldings", "getPortfolioHoldings"]);
register("get", "/holdings/:holdingId", ["getHoldingById", "getHoldingDetails"]);
register("post", "/holdings", ["createHolding"]);
register("put", "/holdings/:holdingId", ["updateHolding"]);
register("delete", "/holdings/:holdingId", ["deleteHolding"]);
register("post", "/holdings/buy", ["buyPortfolioAsset"]);
register("post", "/holdings/sell", ["sellPortfolioAsset"]);
register("get", "/holdings/statistics", ["getHoldingStatistics"]);
register("get", "/holdings/search", ["searchHoldings"]);
register("post", "/holdings/filter", ["filterHoldings"]);

// PnL
register("get", "/pnl", ["getPortfolioProfitLoss"]);
register("get", "/pnl/realized", ["getRealizedPortfolioPnL"]);
register("get", "/pnl/unrealized", ["getUnrealizedPortfolioPnL"]);
register("get", "/pnl/summary", ["getProfitLossSummary"]);
register("get", "/pnl/export/csv", ["exportPnLReportCSV", "exportPnLCSV"]);

// Allocation and exposure
register("get", "/allocation/dashboard", ["getAssetAllocationDashboard"]);
register("get", "/diversification/analysis", ["getDiversificationAnalysis"]);
register("get", "/exposure", ["getPortfolioExposure"]);
register("post", "/rebalancing/preview", ["previewPortfolioRebalancing"]);
register("post", "/rebalancing/execute", ["executePortfolioRebalancing"]);

// Performance
register("get", "/performance/dashboard", ["getPerformanceDashboard"]);
register("get", "/performance/benchmark", ["getPerformanceBenchmark"]);
register("get", "/performance/export/csv", ["exportPerformanceAnalyticsCSV", "exportPerformanceCSV"]);

// Goals and plans
register("get", "/goals", ["getInvestmentGoals"]);
register("get", "/goals/:goalId", ["getInvestmentGoalById"]);
register("post", "/goals", ["createInvestmentGoal"]);
register("put", "/goals/:goalId", ["updateInvestmentGoal"]);
register("delete", "/goals/:goalId", ["deleteInvestmentGoal"]);
register("get", "/auto-invest", ["getAutoInvestPlans"]);
register("post", "/auto-invest", ["createAutoInvestPlan"]);
register("put", "/auto-invest/:planId", ["updateAutoInvestPlan"]);
register("delete", "/auto-invest/:planId", ["cancelAutoInvestPlan"]);

// Watchlist and alerts
register("get", "/watchlist", ["getPortfolioWatchlist"]);
register("post", "/watchlist", ["addToWatchlist"]);
register("delete", "/watchlist/:watchId", ["removeWatchlistItem"]);
register("get", "/alerts", ["getPortfolioPriceAlerts"]);
register("post", "/alerts", ["createPortfolioPriceAlert"]);
register("put", "/alerts/:alertId", ["updatePortfolioPriceAlert"]);
register("delete", "/alerts/:alertId", ["deletePortfolioPriceAlert"]);

// Reports and exports
register("get", "/reports/dashboard", ["getPortfolioReportsDashboard"]);
register("post", "/reports/generate", ["generatePortfolioReport"]);
register("get", "/reports/:reportId", ["getPortfolioReportById"]);
register("delete", "/reports/:reportId", ["deletePortfolioReport"]);
register("get", "/export/history", ["getExportHistory"]);
register("get", "/export/portfolio/csv", ["exportPortfolioCSV"]);

// Health, cache, scheduler, webhooks
register("get", "/health", ["getPortfolioServiceHealth"], false);
register("get", "/version", ["getPortfolioServiceVersion"], false);
register("get", "/verify-integrity", ["verifyPortfolioIntegrity"]);
register("post", "/cache/refresh", ["refreshPortfolioCache"]);
register("post", "/cache/clear", ["clearPortfolioCache"]);
register("post", "/cache/warm", ["warmPortfolioCache"]);
register("post", "/webhooks/price-update", ["portfolioPriceWebhook"], false);
register("post", "/webhooks/holding-update", ["portfolioHoldingWebhook"], false);
register("post", "/webhooks/goal-update", ["portfolioGoalWebhook"], false);
register("post", "/webhooks/performance-update", ["portfolioPerformanceWebhook"], false);
register("post", "/webhooks/alert-triggered", ["portfolioAlertWebhook"], false);

// Admin
register("get", "/admin/dashboard", ["getPortfolioDashboard"], true, true);
register("get", "/admin/summary", ["getPortfolioSummary"], true, true);
register("get", "/admin/holdings", ["getAllHoldings", "getPortfolioHoldings"], true, true);
register("get", "/admin/pnl", ["getPortfolioProfitLoss"], true, true);
register("get", "/admin/performance/dashboard", ["getPerformanceDashboard"], true, true);
register("get", "/admin/goals", ["getInvestmentGoals"], true, true);
register("get", "/admin/watchlists", ["getPortfolioWatchlist"], true, true);
register("get", "/admin/reports/dashboard", ["getPortfolioReportsDashboard"], true, true);
register("get", "/admin/scheduler/status", ["getPortfolioSchedulerStatus"], true, true);
register("get", "/admin/scheduler/logs", ["getPortfolioSchedulerLogs"], true, true);
register("post", "/admin/scheduler/run", ["runPortfolioSchedulerNow"], true, true);
register("post", "/admin/scheduler/enable", ["enablePortfolioScheduler"], true, true);
register("post", "/admin/scheduler/disable", ["disablePortfolioScheduler"], true, true);
register("get", "/admin/system/statistics", ["getPortfolioSystemStatistics"], true, true);
register("post", "/admin/system/cleanup/snapshots", ["cleanupPortfolioSnapshots"], true, true);
register("post", "/admin/system/cleanup/reports", ["cleanupPortfolioReports"], true, true);
register("post", "/admin/system/cleanup/watchlists", ["cleanupWatchlists"], true, true);
register("post", "/admin/system/cleanup/goals", ["cleanupExpiredGoals"], true, true);
register("post", "/admin/system/rebuild-indexes", ["rebuildPortfolioIndexes"], true, true);
register("post", "/admin/system/sync-ledger", ["synchronizePortfolioLedger"], true, true);
register("post", "/admin/system/sync-holdings", ["synchronizePortfolioHoldings"], true, true);
register("post", "/admin/system/sync-performance", ["synchronizePortfolioPerformance"], true, true);

export default router;
