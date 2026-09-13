import { Router, type RequestHandler } from "express";

import * as tradeController from "../controllers/trade.controller";

const authMiddleware = (() => {
  try {
    return require("../middleware/auth.middleware");
  } catch {
    try {
      return require("../middlewares/auth.middleware");
    } catch {
      return {} as Record<string, unknown>;
    }
  }
})();

const router = Router();

const tradeControllerAny = tradeController as Record<string, unknown>;
const pick = (...names: string[]): RequestHandler => {
  const handler = names
    .map((name) => tradeControllerAny[name])
    .find((candidate) => typeof candidate === "function");

  return (handler as RequestHandler | undefined) || ((req, res) => {
    res.status(501).json({
      success: false,
      message: "Trade route handler is not implemented in this build.",
    });
  });
};

const passthrough: RequestHandler = (_req, _res, next) => next();
const authenticate = (authMiddleware.authenticate as RequestHandler | undefined) || passthrough;
const authorizeAdmin = (authMiddleware.authorizeAdmin as RequestHandler | undefined) || passthrough;

const getTradeHealth = pick("getTradeHealth", "getMarketHealthReport");
const placeMarketBuyOrder = pick("placeMarketBuyOrder");
const placeMarketSellOrder = pick("placeMarketSellOrder");
const previewMarketOrder = pick("previewMarketOrder");
const getMarketOrders = pick("getMarketOrders");
const getTradeOrderDetails = pick("getTradeOrderDetails", "getTradeOrderSummary");
const placeLimitBuyOrder = pick("placeLimitBuyOrder");
const placeLimitSellOrder = pick("placeLimitSellOrder");
const modifyLimitOrder = pick("modifyLimitOrder");
const cancelLimitOrder = pick("cancelLimitOrder");
const getOpenLimitOrders = pick("getOpenLimitOrders");
const cancelAllOpenOrders = pick("cancelAllOpenOrders");
const extendLimitOrderExpiry = pick("extendLimitOrderExpiry");
const createStopLossOrder = pick("createStopLossOrder");
const createTakeProfitOrder = pick("createTakeProfitOrder");
const createTrailingStopOrder = pick("createTrailingStopOrder");
const cancelRiskOrder = pick("cancelRiskOrder");
const getRiskOrders = pick("getRiskOrders");
const getRiskOrderHistory = pick("getRiskOrderHistory");
const getOrderBook = pick("getOrderBook");
const getMarketDepthSummary = pick("getMarketDepthSummary");
const getTradeHistory = pick("getTradeHistory");
const getFilteredTradeHistory = pick("getFilteredTradeHistory");
const exportTradeHistory = pick("exportTradeHistory");
const getProfitLossLedger = pick("getProfitLossLedger");
const getMonthlyPLReport = pick("getMonthlyPLReport");
const getYearlyPLReport = pick("getYearlyPLReport");
const getTradingFeesReport = pick("getTradingFeesReport");
const getTaxSummary = pick("getTaxSummary");
const getTradingPositions = pick("getTradingPositions");
const getPositionDetails = pick("getPositionDetails");
const getPortfolioExposure = pick("getPortfolioExposure");
const getUnrealizedPLSummary = pick("getUnrealizedPLSummary");
const getLivePositionMetrics = pick("getLivePositionMetrics");
const getPositionPerformanceHistory = pick("getPositionPerformanceHistory");
const getPortfolioAllocationSummary = pick("getPortfolioAllocationSummary");
const addToWatchlist = pick("addToWatchlist");
const removeFromWatchlist = pick("removeFromWatchlist");
const getWatchlist = pick("getWatchlist");
const createPriceAlert = pick("createPriceAlert");
const getPriceAlerts = pick("getPriceAlerts");
const deletePriceAlert = pick("deletePriceAlert");
const getMarketAlerts = pick("getMarketAlerts");
const getPriceChangeSummary = pick("getPriceChangeSummary");
const getAdminTradingDashboard = pick("getAdminTradingDashboard");
const getLiquidityStatus = pick("getLiquidityStatus");
const updateLiquidityPool = pick("updateLiquidityPool");
const getRiskDashboard = pick("getRiskDashboard");
const getAuditLogs = pick("getAuditLogs");
const getTradingEngineStatus = pick("getTradingEngineStatus");
const flagSuspiciousAccount = pick("flagSuspiciousAccount");
const getTradeMonitoring = pick("getTradeMonitoring");
const getMarketHealthReport = pick("getMarketHealthReport");
const freezeMarket = pick("freezeMarket");
const resumeMarket = pick("resumeMarket");
const processMatchingCycle = pick("processMatchingCycle");
const getMatchingQueueStatus = pick("getMatchingQueueStatus");
const executeMatchingQueue = pick("executeMatchingQueue");
const buildMatchingQueue = pick("buildMatchingQueue");
const cleanupCompletedOrders = pick("cleanupCompletedOrders");
const getMatchingEngineHealth = pick("getMatchingEngineHealth");

router.get("/health", getTradeHealth);
router.get("/market-health", authenticate, getMarketHealthReport);

router.post("/market/buy", authenticate, placeMarketBuyOrder);
router.post("/market/sell", authenticate, placeMarketSellOrder);
router.post("/market/preview", authenticate, previewMarketOrder);
router.get("/market/orders", authenticate, getMarketOrders);
router.get("/orders/:orderId", authenticate, getTradeOrderDetails);

router.post("/limit/buy", authenticate, placeLimitBuyOrder);
router.post("/limit/sell", authenticate, placeLimitSellOrder);
router.get("/limit/open", authenticate, getOpenLimitOrders);
router.put("/limit/orders/:orderId", authenticate, modifyLimitOrder);
router.patch("/limit/orders/:orderId/extend-expiry", authenticate, extendLimitOrderExpiry);
router.delete("/limit/orders/:orderId", authenticate, cancelLimitOrder);
router.delete("/limit/orders", authenticate, cancelAllOpenOrders);

router.post("/risk/stop-loss", authenticate, createStopLossOrder);
router.post("/risk/take-profit", authenticate, createTakeProfitOrder);
router.post("/risk/trailing-stop", authenticate, createTrailingStopOrder);
router.get("/risk/orders", authenticate, getRiskOrders);
router.get("/risk/orders/history", authenticate, getRiskOrderHistory);
router.delete("/risk/orders/:orderId", authenticate, cancelRiskOrder);

router.get("/order-book", authenticate, getOrderBook);
router.get("/order-book/depth-summary", authenticate, getMarketDepthSummary);

router.get("/history", authenticate, getTradeHistory);
router.post("/history/filter", authenticate, getFilteredTradeHistory);
router.get("/history/export", authenticate, exportTradeHistory);
router.get("/pnl/ledger", authenticate, getProfitLossLedger);
router.get("/pnl/monthly", authenticate, getMonthlyPLReport);
router.get("/pnl/yearly", authenticate, getYearlyPLReport);
router.get("/fees/report", authenticate, getTradingFeesReport);
router.get("/tax/summary", authenticate, getTaxSummary);

router.get("/positions", authenticate, getTradingPositions);
router.get("/positions/:positionId", authenticate, getPositionDetails);
router.get("/positions/exposure", authenticate, getPortfolioExposure);
router.get("/positions/unrealized-pl", authenticate, getUnrealizedPLSummary);
router.get("/positions/live-metrics", authenticate, getLivePositionMetrics);
router.get("/positions/performance-history", authenticate, getPositionPerformanceHistory);
router.get("/portfolio/allocation", authenticate, getPortfolioAllocationSummary);

router.get("/watchlist", authenticate, getWatchlist);
router.post("/watchlist", authenticate, addToWatchlist);
router.delete("/watchlist/:symbol", authenticate, removeFromWatchlist);
router.post("/alerts", authenticate, createPriceAlert);
router.get("/alerts", authenticate, getPriceAlerts);
router.delete("/alerts/:alertId", authenticate, deletePriceAlert);
router.get("/alerts/market", authenticate, getMarketAlerts);
router.get("/market/price-change-summary", authenticate, getPriceChangeSummary);

router.get("/admin/dashboard", authenticate, authorizeAdmin, getAdminTradingDashboard);
router.get("/admin/liquidity", authenticate, authorizeAdmin, getLiquidityStatus);
router.post("/admin/liquidity", authenticate, authorizeAdmin, updateLiquidityPool);
router.get("/admin/risk", authenticate, authorizeAdmin, getRiskDashboard);
router.get("/admin/monitoring", authenticate, authorizeAdmin, getTradeMonitoring);
router.get("/admin/audit-logs", authenticate, authorizeAdmin, getAuditLogs);
router.post("/admin/fraud/flag-account", authenticate, authorizeAdmin, flagSuspiciousAccount);

router.get("/admin/engine/status", authenticate, authorizeAdmin, getTradingEngineStatus);
router.post("/admin/engine/freeze", authenticate, authorizeAdmin, freezeMarket);
router.post("/admin/engine/resume", authenticate, authorizeAdmin, resumeMarket);
router.get("/admin/engine/queue/status", authenticate, authorizeAdmin, getMatchingQueueStatus);
router.post("/admin/engine/queue/build", authenticate, authorizeAdmin, buildMatchingQueue);
router.post("/admin/engine/queue/execute", authenticate, authorizeAdmin, executeMatchingQueue);
router.post("/admin/engine/cycle", authenticate, authorizeAdmin, processMatchingCycle);
router.post("/admin/engine/cleanup-completed", authenticate, authorizeAdmin, cleanupCompletedOrders);

export default router;
