import { Router } from "express";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const goldController = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("../controllers/gold.controller");
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

const controllerAny = goldController as any;
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

// Live prices and market
register("get", "/live-prices", ["getLiveGoldPrices", "getLiveGoldPrice"]);
register("get", "/spot-price", ["getSpotGoldPrice", "getLiveGoldPrice"]);
register("get", "/market-overview", ["getGoldMarketOverview", "getGoldMarketStatus"]);
register("get", "/market-status", ["getGoldMarketStatus", "getMarketStatus"]);
register("get", "/price-summary", ["getGoldPriceSummary", "getGoldPurchaseSummary"]);
register("post", "/refresh-prices", ["refreshGoldPrices"]);
register("get", "/last-update", ["getGoldPriceTimestamp"]);
register("get", "/karat/:karat", ["getGoldPriceByKarat"]);
register("get", "/prices/:currency", ["getGoldPriceByCurrency"]);
register("get", "/supported-currencies", ["getSupportedCurrencies"]);

// Historical and charts
register("get", "/history", ["getHistoricalGoldPrices", "getGoldPriceHistory"]);
register("get", "/history/range", ["getPriceHistoryRange", "getGoldPriceHistory"]);
register("get", "/history/statistics", ["getHistoricalPriceStatistics"]);
register("get", "/history/export/csv", ["exportHistoricalPricesCSV"]);
register("get", "/charts/candlestick", ["getCandlestickData", "getCandlestickChartData"]);
register("get", "/charts/technical-summary", ["getTechnicalIndicatorSummary"]);
register("get", "/charts/export/csv", ["exportChartDataCSV"]);

// Pricing tools
register("get", "/premium", ["getGoldPremiumRates"]);
register("get", "/spread", ["getGoldSpreadRates"]);
register("post", "/buy/calculate", ["calculateBuyPrice"]);
register("post", "/sell/calculate", ["calculateSellPrice"]);
register("post", "/currency/convert", ["convertGoldPriceCurrency", "getGoldPriceByCurrency"]);
register("post", "/trade-estimation", ["estimateTradeValue"]);

// Alerts and watchlist
register("post", "/alerts", ["createGoldPriceAlert", "createPriceAlert"]);
register("get", "/alerts", ["getGoldPriceAlerts", "getPriceAlerts"]);
register("put", "/alerts/:alertId", ["updateGoldPriceAlert"]);
register("delete", "/alerts/:alertId", ["deleteGoldPriceAlert", "deletePriceAlert"]);
register("post", "/watchlist", ["createWatchlistItem", "addToWatchlist"]);
register("get", "/watchlist", ["getGoldWatchlist", "getWatchlist"]);
register("delete", "/watchlist/:watchId", ["removeWatchlistItem", "removeFromWatchlist"]);

// News and analytics
register("get", "/news", ["getLatestGoldNews"]);
register("get", "/news/sentiment", ["getNewsSentimentAnalysis"]);
register("get", "/analytics", ["getMarketAnalytics"]);
register("get", "/analytics/volatility-index", ["getVolatilityIndex"]);
register("get", "/analytics/ai-signals", ["getAITradingSignals"]);
register("get", "/analytics/export/csv", ["exportMarketAnalytics"]);

// Health and system
register("get", "/health", ["getGoldServiceHealth"], false);
register("get", "/version", ["getGoldServiceVersion"], false);
register("get", "/verify-integrity", ["verifyGoldPriceIntegrity"]);
register("post", "/cache/refresh", ["refreshGoldPriceCache"]);
register("post", "/cache/clear", ["clearGoldPriceCache"]);
register("post", "/cache/warm", ["warmGoldPriceCache"]);
register("post", "/webhooks/gold-price", ["goldPriceWebhook"], false);
register("post", "/webhooks/metal-price", ["metalPriceWebhook"], false);
register("post", "/webhooks/exchange-rate", ["exchangeRateWebhook"], false);
register("post", "/webhooks/market-status", ["marketStatusWebhook"], false);

// Admin
register("get", "/admin/dashboard", ["getAdminGoldDashboard"], true, true);
register("post", "/admin/refresh-live-prices", ["refreshGoldPrices"], true, true);
register("put", "/admin/live-price/:karat", ["updateLiveGoldPrice"], true, true);
register("put", "/admin/live-prices/bulk", ["bulkUpdateGoldPrices"], true, true);
register("get", "/admin/liquidity", ["getLiquidityPoolOverview", "getLiquidityStatus"], true, true);
register("put", "/admin/liquidity", ["updateLiquidityPool"], true, true);
register("post", "/admin/liquidity/refill", ["refillLiquidityPool"], true, true);
register("get", "/admin/vault", ["getVaultInventory"], true, true);
register("put", "/admin/vault", ["updateVaultInventory"], true, true);
register("get", "/admin/risk-exposure", ["getGoldRiskExposure"], true, true);
register("get", "/admin/audit-logs", ["getGoldAuditLogs"], true, true);
register("post", "/admin/trading/enable", ["enableGoldTrading"], true, true);
register("post", "/admin/trading/disable", ["disableGoldTrading"], true, true);
register("get", "/admin/scheduler/status", ["getSchedulerStatus"], true, true);
register("get", "/admin/scheduler/logs", ["getSchedulerLogs"], true, true);
register("post", "/admin/scheduler/run", ["runPriceSchedulerNow"], true, true);
register("post", "/admin/scheduler/enable", ["enableScheduler"], true, true);
register("post", "/admin/scheduler/disable", ["disableScheduler"], true, true);
register("get", "/admin/system/statistics", ["getGoldSystemStatistics"], true, true);
register("post", "/admin/system/cleanup/history", ["cleanupHistoricalPrices"], true, true);
register("post", "/admin/system/cleanup/alerts", ["cleanupExpiredAlerts"], true, true);
register("post", "/admin/system/rebuild-indexes", ["rebuildGoldIndexes"], true, true);
register("post", "/admin/system/sync-global-prices", ["syncGlobalGoldPrices"], true, true);
register("post", "/admin/system/sync-exchange-rates", ["syncExchangeRates"], true, true);
register("post", "/admin/system/sync-metal-prices", ["syncMetalPrices"], true, true);

export default router;
