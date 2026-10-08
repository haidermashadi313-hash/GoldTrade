"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Coins,
  DollarSign,
  Flame,
  Loader2,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet as WalletIcon,
  X,
} from "lucide-react";

/* ============================================================
   API
============================================================ */

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com";

/* ============================================================
   TYPES
============================================================ */

interface WalletData {
  WalletBalance: number;
  goldBalance: number;
  UsdtBalance: number;
}

interface MarketData {
  livePrice: number;
  buyPrice: number;
  sellPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  change24h: number;
}

interface TradeHistory {
  _id: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  total: number;
  createdAt: string;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/* ============================================================
   HELPERS
============================================================ */

const numberValue = (
  value: unknown,
  fallback = 0
): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
};

const formatMoney = (value: number) =>
  numberValue(value).toLocaleString("en-PK", {
    maximumFractionDigits: 2,
  });

const formatGold = (value: number) =>
  numberValue(value).toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

const formatDate = (value: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

/* ============================================================
   COMPONENT
============================================================ */

export default function TradingPage() {
  /* ==========================================================
     AUTH
  ========================================================== */

  const [token, setToken] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token") || "");
    }
  }, []);

  /* ==========================================================
     MAIN STATES
  ========================================================== */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [wallet, setWallet] =
    useState<WalletData>({
      WalletBalance: 0,
      goldBalance: 0,
      UsdtBalance: 0,
    });

  const [market, setMarket] =
    useState<MarketData>({
      livePrice: 35000,
      buyPrice: 35200,
      sellPrice: 34850,
      high24h: 35650,
      low24h: 34420,
      volume24h: 1250,
      change24h: 2.15,
    });

  const [tradeHistory, setTradeHistory] =
    useState<TradeHistory[]>([]);

  /* ==========================================================
     TRADE STATES
  ========================================================== */

  const [quantity, setQuantity] = useState("");

  const [tradeType, setTradeType] =
    useState<"buy" | "sell">("buy");

  const [tradeLoading, setTradeLoading] =
    useState(false);

  const [confirmTrade, setConfirmTrade] =
    useState(false);

  /* ==========================================================
     CHART STATES
  ========================================================== */

  const [timeframe, setTimeframe] =
    useState<"1H" | "4H" | "1D">("1D");

  const [chartMode, setChartMode] =
    useState<"candles" | "line">("candles");

  /* ==========================================================
     HISTORY SEARCH
  ========================================================== */

  const [historySearch, setHistorySearch] =
    useState("");

  /* ==========================================================
     LOAD DASHBOARD
  ========================================================== */

  const loadTradingDashboard = useCallback(
    async (silent = false) => {
      if (!token) {
        setLoading(false);
        setError("Authentication token not found.");
        return;
      }

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        /* ====================================================
           WALLET
        ==================================================== */

        const walletResponse = await fetch(
          `${API}/api/Wallet/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        const walletData =
          await walletResponse.json().catch(() => ({}));

        if (
          walletResponse.ok &&
          walletData?.success &&
          walletData?.Wallet
        ) {
          setWallet({
            WalletBalance: numberValue(
              walletData.Wallet.WalletBalance
            ),
            goldBalance: numberValue(
              walletData.Wallet.goldBalance
            ),
            UsdtBalance: numberValue(
              walletData.Wallet.UsdtBalance
            ),
          });
        } else if (
          walletResponse.status === 401 ||
          walletResponse.status === 403
        ) {
          setError(
            walletData?.message ||
              "Your session has expired. Please login again."
          );
        }

        /* ====================================================
           MARKET
        ==================================================== */

        const marketResponse = await fetch(
          `${API}/api/trading/market`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const marketData =
          await marketResponse.json().catch(() => ({}));

        if (
          marketResponse.ok &&
          marketData?.success &&
          marketData?.market
        ) {
          const incomingMarket =
            marketData.market;

          setMarket({
            livePrice: numberValue(
              incomingMarket.livePrice,
              35000
            ),
            buyPrice: numberValue(
              incomingMarket.buyPrice,
              35200
            ),
            sellPrice: numberValue(
              incomingMarket.sellPrice,
              34850
            ),
            high24h: numberValue(
              incomingMarket.high24h,
              35650
            ),
            low24h: numberValue(
              incomingMarket.low24h,
              34420
            ),
            volume24h: numberValue(
              incomingMarket.volume24h,
              0
            ),
            change24h: numberValue(
              incomingMarket.change24h,
              0
            ),
          });
        }

        /* ====================================================
           TRADE HISTORY
        ==================================================== */

        const historyResponse = await fetch(
          `${API}/api/trading/history`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        const historyData =
          await historyResponse.json().catch(() => ({}));

        if (
          historyResponse.ok &&
          historyData?.success &&
          Array.isArray(historyData.history)
        ) {
          setTradeHistory(
            historyData.history.map(
              (trade: TradeHistory) => ({
                _id: String(trade._id),
                type:
                  trade.type === "sell"
                    ? "sell"
                    : "buy",
                quantity: numberValue(
                  trade.quantity
                ),
                price: numberValue(
                  trade.price
                ),
                total: numberValue(
                  trade.total
                ),
                createdAt:
                  trade.createdAt || "",
              })
            )
          );
        }
      } catch (err) {
        console.error(
          "Trading dashboard error:",
          err
        );

        setError(
          "Unable to load trading data. Please try again."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token]
  );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    if (token) {
      loadTradingDashboard();
    }
  }, [token, loadTradingDashboard]);

  /* ==========================================================
     BUY CALCULATION
  ========================================================== */

  const totalCost = useMemo(() => {
    const qty = numberValue(quantity);

    if (qty <= 0) return 0;

    return qty * market.buyPrice;
  }, [quantity, market.buyPrice]);

  /* ==========================================================
     SELL CALCULATION
  ========================================================== */

  const totalSell = useMemo(() => {
    const qty = numberValue(quantity);

    if (qty <= 0) return 0;

    return qty * market.sellPrice;
  }, [quantity, market.sellPrice]);

  /* ==========================================================
     PORTFOLIO VALUE
  ========================================================== */

  const portfolioValue = useMemo(() => {
    return (
      wallet.WalletBalance +
      wallet.goldBalance * market.livePrice +
      wallet.UsdtBalance * 285
    );
  }, [wallet, market]);

  /* ==========================================================
     PROFIT / LOSS
  ========================================================== */

  const profitLoss = useMemo(() => {
    const currentGoldValue =
      wallet.goldBalance *
      market.livePrice;

    const investedValue =
      wallet.goldBalance *
      market.buyPrice;

    const profit =
      currentGoldValue -
      investedValue;

    const percent =
      investedValue === 0
        ? 0
        : Number(
            (
              (profit / investedValue) *
              100
            ).toFixed(2)
          );

    return {
      currentGoldValue,
      investedValue,
      profit,
      percent,
    };
  }, [
    wallet.goldBalance,
    market.livePrice,
    market.buyPrice,
  ]);

  /* ==========================================================
     FILTER HISTORY
  ========================================================== */

  const filteredHistory = useMemo(() => {
    const search =
      historySearch.trim().toLowerCase();

    if (!search) {
      return tradeHistory;
    }

    return tradeHistory.filter(
      (trade) =>
        trade.type
          .toLowerCase()
          .includes(search) ||
        String(trade.price)
          .includes(search) ||
        String(trade.quantity)
          .includes(search) ||
        String(trade.total)
          .includes(search)
    );
  }, [
    tradeHistory,
    historySearch,
  ]);

  /* ==========================================================
     CHART CANDLES
  ========================================================== */

  const candles = useMemo<Candle[]>(() => {
    const high = numberValue(
      market.high24h,
      market.livePrice
    );

    const low = numberValue(
      market.low24h,
      market.livePrice
    );

    const current = numberValue(
      market.livePrice,
      35000
    );

    const range =
      Math.max(high - low, current * 0.01);

    const total =
      timeframe === "1H"
        ? 12
        : timeframe === "4H"
        ? 24
        : 48;

    const result: Candle[] = [];

    let previousClose =
      current - range * 0.12;

    for (let i = 0; i < total; i++) {
      const progress =
        i / Math.max(total - 1, 1);

      const wave =
        Math.sin(i * 1.31) *
        range *
        0.075;

      const trend =
        (current - previousClose) *
        progress *
        0.18;

      const open =
        previousClose + wave;

      const close =
        i === total - 1
          ? current
          : open +
            Math.sin(i * 1.83) *
              range *
              0.055 +
            trend;

      const highPrice =
        Math.max(open, close) +
        range *
          (0.035 +
            Math.abs(
              Math.sin(i * 1.21)
            ) *
              0.035);

      const lowPrice =
        Math.min(open, close) -
        range *
          (0.035 +
            Math.abs(
              Math.cos(i * 1.17)
            ) *
              0.035);

      const boundedHigh = Math.min(
        Math.max(highPrice, high),
        Math.max(high, current)
      );

      const boundedLow = Math.max(
        Math.min(lowPrice, low),
        Math.min(low, current)
      );

      result.push({
        time: String(i + 1),
        open,
        high: Math.max(
          boundedHigh,
          open,
          close
        ),
        low: Math.min(
          boundedLow,
          open,
          close
        ),
        close,
        volume:
          80 +
          Math.abs(
            Math.sin(i * 0.91)
          ) *
            180,
      });

      previousClose = close;
    }

    return result;
  }, [
    market.high24h,
    market.low24h,
    market.livePrice,
    timeframe,
  ]);

  /* ==========================================================
     CHART MIN / MAX
  ========================================================== */

  const chartMin = useMemo(() => {
    const values = candles.flatMap(
      (candle) => [
        candle.high,
        candle.low,
      ]
    );

    return Math.min(...values);
  }, [candles]);

  const chartMax = useMemo(() => {
    const values = candles.flatMap(
      (candle) => [
        candle.high,
        candle.low,
      ]
    );

    return Math.max(...values);
  }, [candles]);

  const chartRange = Math.max(
    chartMax - chartMin,
    1
  );

  /* ==========================================================
     TRADE VALIDATION
  ========================================================== */

  const openTradeConfirmation = (
    type: "buy" | "sell"
  ) => {
    const qty = numberValue(quantity);

    if (!quantity || qty <= 0) {
      setError(
        "Please enter a valid gold quantity."
      );
      return;
    }

    if (type === "sell") {
      if (qty > wallet.goldBalance) {
        setError(
          "Insufficient gold balance."
        );
        return;
      }
    }

    if (type === "buy") {
      if (totalCost > wallet.WalletBalance) {
        setError(
          "Insufficient PKR wallet balance."
        );
        return;
      }
    }

    setError("");
    setTradeType(type);
    setConfirmTrade(true);
  };

  /* ==========================================================
     BUY GOLD
  ========================================================== */

  const buyGold = async () => {
    const qty = numberValue(quantity);

    if (!token || qty <= 0) {
      setError(
        "Please enter a valid gold quantity."
      );
      return;
    }

    try {
      setTradeLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/trading/buy`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: qty,
          }),
        }
      );

      const data =
        await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Gold purchase failed."
        );
      }

      setQuantity("");
      setConfirmTrade(false);

      await loadTradingDashboard(true);
    } catch (err) {
      console.error(
        "Buy gold error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gold purchase failed."
      );
    } finally {
      setTradeLoading(false);
    }
  };

  /* ==========================================================
     SELL GOLD
  ========================================================== */

  const sellGold = async () => {
    const qty = numberValue(quantity);

    if (!token || qty <= 0) {
      setError(
        "Please enter a valid gold quantity."
      );
      return;
    }

    try {
      setTradeLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/trading/sell`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: qty,
          }),
        }
      );

      const data =
        await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Gold sale failed."
        );
      }

      setQuantity("");
      setConfirmTrade(false);

      await loadTradingDashboard(true);
    } catch (err) {
      console.error(
        "Sell gold error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Gold sale failed."
      );
    } finally {
      setTradeLoading(false);
    }
  };

  /* ==========================================================
     CONFIRM TRADE
  ========================================================== */

  const confirmTradeAction = async () => {
    if (tradeType === "buy") {
      await buyGold();
    } else {
      await sellGold();
    }
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-yellow-400 font-bold">
          <RefreshCw
            size={24}
            className="animate-spin"
          />
          Loading Gold Market...
        </div>
      </main>
    );
  }
    return (
    <main className="min-h-screen bg-black text-white px-4 py-6 md:px-6">
      <div className="max-w-[1500px] mx-auto">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-6">

          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                <Flame
                  size={28}
                  className="text-yellow-400"
                />
              </div>

              <div>
                <h1 className="text-3xl md:text-4xl font-black text-yellow-400">
                  Gold Trading
                </h1>

                <p className="text-gray-500 text-sm mt-1">
                  Live market • Buy / Sell • Portfolio
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              loadTradingDashboard(true)
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black px-5 py-3 rounded-xl font-bold transition"
          >
            <RefreshCw
              size={18}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh Market"}
          </button>
        </div>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 flex items-start gap-3">
            <X
              size={20}
              className="text-red-400 mt-0.5"
            />

            <div className="flex-1">
              <p className="text-red-300 font-semibold">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* ====================================================
            WALLET CARDS
        ==================================================== */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          <div className="bg-zinc-950 border border-yellow-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">
                  PKR Wallet
                </p>

                <h2 className="text-2xl font-black text-yellow-400 mt-2">
                  PKR{" "}
                  {formatMoney(
                    wallet.WalletBalance
                  )}
                </h2>
              </div>

              <WalletIcon
                size={30}
                className="text-yellow-400"
              />
            </div>
          </div>

          <div className="bg-zinc-950 border border-green-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">
                  Gold Balance
                </p>

                <h2 className="text-2xl font-black text-green-400 mt-2">
                  {formatGold(
                    wallet.goldBalance
                  )}{" "}
                  g
                </h2>
              </div>

              <Coins
                size={30}
                className="text-green-400"
              />
            </div>
          </div>

          <div className="bg-zinc-950 border border-cyan-500/30 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">
                  USDT Balance
                </p>

                <h2 className="text-2xl font-black text-cyan-400 mt-2">
                  {numberValue(
                    wallet.UsdtBalance
                  ).toFixed(2)}{" "}
                  USDT
                </h2>
              </div>

              <DollarSign
                size={30}
                className="text-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* ====================================================
            MARKET HEADER
        ==================================================== */}

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden mb-6">

          <div className="px-5 py-4 border-b border-zinc-800 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

            <div className="flex items-center gap-4">

              <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Coins
                  size={23}
                  className="text-yellow-400"
                />
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-black text-xl">
                    XAU / PKR
                  </h2>

                  <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    LIVE
                  </span>
                </div>

                <p className="text-gray-500 text-xs mt-1">
                  Gold Trading Market
                </p>
              </div>
            </div>

            <div className="flex items-center gap-5">

              <div>
                <p className="text-gray-500 text-xs">
                  Last Price
                </p>

                <p className="text-2xl font-black text-white">
                  PKR{" "}
                  {formatMoney(
                    market.livePrice
                  )}
                </p>
              </div>

              <div
                className={
                  market.change24h >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }
              >
                {market.change24h >= 0 ? (
                  <TrendingUp size={22} />
                ) : (
                  <TrendingDown size={22} />
                )}

                <p className="font-bold text-sm mt-1">
                  {market.change24h >= 0
                    ? "+"
                    : ""}
                  {market.change24h.toFixed(
                    2
                  )}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* ==================================================
              CHART TOOLBAR
          ================================================== */}

          <div className="px-4 py-3 bg-[#0a0a0a] border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">

            <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1">

              {(
                ["1H", "4H", "1D"] as const
              ).map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() =>
                    setTimeframe(period)
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                    timeframe === period
                      ? "bg-yellow-500 text-black"
                      : "text-gray-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1">

              <button
                type="button"
                onClick={() =>
                  setChartMode("candles")
                }
                className={`px-3 py-1.5 rounded-md text-xs font-bold ${
                  chartMode === "candles"
                    ? "bg-zinc-700 text-white"
                    : "text-gray-500"
                }`}
              >
                Candles
              </button>

              <button
                type="button"
                onClick={() =>
                  setChartMode("line")
                }
                className={`px-3 py-1.5 rounded-md text-xs font-bold ${
                  chartMode === "line"
                    ? "bg-zinc-700 text-white"
                    : "text-gray-500"
                }`}
              >
                Line
              </button>
            </div>

            <div className="text-xs text-gray-500">
              PKR / gram
            </div>
          </div>

          {/* ==================================================
              TRADINGVIEW STYLE CHART
          ================================================== */}

          <div className="relative bg-[#070707] h-[430px] overflow-hidden">

            {/* GRID */}

            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:10%_20%]" />
            </div>

            {/* PRICE LABELS */}

            <div className="absolute right-0 top-5 bottom-16 w-[85px] flex flex-col justify-between pointer-events-none z-10">
              <span className="text-[10px] text-gray-500 bg-zinc-900/80 px-2 py-1">
                {formatMoney(
                  chartMax
                )}
              </span>

              <span className="text-[10px] text-gray-500 bg-zinc-900/80 px-2 py-1">
                {formatMoney(
                  chartMax -
                    chartRange * 0.25
                )}
              </span>

              <span className="text-[10px] text-gray-500 bg-zinc-900/80 px-2 py-1">
                {formatMoney(
                  chartMax -
                    chartRange * 0.5
                )}
              </span>

              <span className="text-[10px] text-gray-500 bg-zinc-900/80 px-2 py-1">
                {formatMoney(
                  chartMin
                )}
              </span>
            </div>

            {/* CURRENT PRICE */}

            <div
              className="absolute right-0 z-20 bg-yellow-500 text-black text-[10px] font-black px-2 py-1"
              style={{
                top: `${Math.max(
                  5,
                  Math.min(
                    94,
                    100 -
                      ((market.livePrice -
                        chartMin) /
                        chartRange) *
                        100
                  )
                )}%`,
              }}
            >
              {formatMoney(
                market.livePrice
              )}
            </div>

            {/* SVG CHART */}

            <svg
              viewBox="0 0 1200 430"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
            >
              {/* BUY LINE */}

              <line
                x1="0"
                x2="1200"
                y1={
                  430 -
                  ((market.buyPrice -
                    chartMin) /
                    chartRange) *
                    360
                }
                y2={
                  430 -
                  ((market.buyPrice -
                    chartMin) /
                    chartRange) *
                    360
                }
                stroke="#22c55e"
                strokeDasharray="8 8"
                strokeWidth="1"
                opacity="0.45"
              />

              {/* SELL LINE */}

              <line
                x1="0"
                x2="1200"
                y1={
                  430 -
                  ((market.sellPrice -
                    chartMin) /
                    chartRange) *
                    360
                }
                y2={
                  430 -
                  ((market.sellPrice -
                    chartMin) /
                    chartRange) *
                    360
                }
                stroke="#ef4444"
                strokeDasharray="8 8"
                strokeWidth="1"
                opacity="0.45"
              />

              {chartMode === "line" ? (
                <>
                  <polyline
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="3"
                    points={candles
                      .map(
                        (
                          candle,
                          index
                        ) => {
                          const x =
                            30 +
                            (index /
                              Math.max(
                                candles.length -
                                  1,
                                1
                              )) *
                              1110;

                          const y =
                            390 -
                            ((candle.close -
                              chartMin) /
                              chartRange) *
                              330;

                          return `${x},${y}`;
                        }
                      )
                      .join(" ")}
                  />

                  {candles.map(
                    (
                      candle,
                      index
                    ) => {
                      const x =
                        30 +
                        (index /
                          Math.max(
                            candles.length -
                              1,
                            1
                          )) *
                          1110;

                      const y =
                        390 -
                        ((candle.close -
                          chartMin) /
                          chartRange) *
                          330;

                      return (
                        <circle
                          key={`line-${index}`}
                          cx={x}
                          cy={y}
                          r="2.5"
                          fill="#facc15"
                        />
                      );
                    }
                  )}
                </>
              ) : (
                candles.map(
                  (
                    candle,
                    index
                  ) => {
                    const x =
                      30 +
                      (index /
                        Math.max(
                          candles.length -
                            1,
                          1
                        )) *
                        1110;

                    const openY =
                      390 -
                      ((candle.open -
                        chartMin) /
                        chartRange) *
                        330;

                    const closeY =
                      390 -
                      ((candle.close -
                        chartMin) /
                        chartRange) *
                        330;

                    const highY =
                      390 -
                      ((candle.high -
                        chartMin) /
                        chartRange) *
                        330;

                    const lowY =
                      390 -
                      ((candle.low -
                        chartMin) /
                        chartRange) *
                        330;

                    const bullish =
                      candle.close >=
                      candle.open;

                    const bodyTop =
                      Math.min(
                        openY,
                        closeY
                      );

                    const bodyHeight =
                      Math.max(
                        Math.abs(
                          closeY -
                            openY
                        ),
                        3
                      );

                    return (
                      <g
                        key={`candle-${index}`}
                      >
                        <line
                          x1={x}
                          x2={x}
                          y1={highY}
                          y2={lowY}
                          stroke={
                            bullish
                              ? "#22c55e"
                              : "#ef4444"
                          }
                          strokeWidth="2"
                        />

                        <rect
                          x={x - 5}
                          y={bodyTop}
                          width="10"
                          height={
                            bodyHeight
                          }
                          fill={
                            bullish
                              ? "#22c55e"
                              : "#ef4444"
                          }
                          rx="1"
                        />
                      </g>
                    );
                  }
                )
              )}
            </svg>

            {/* CURRENT PRICE BADGE */}

            <div className="absolute left-4 top-4 z-20">
              <div className="bg-black/80 backdrop-blur border border-zinc-800 rounded-xl px-3 py-2">
                <p className="text-[10px] text-gray-500">
                  GOLD / PKR
                </p>

                <p className="text-lg font-black text-yellow-400">
                  {formatMoney(
                    market.livePrice
                  )}
                </p>
              </div>
            </div>

            {/* BUY / SELL BADGES */}

            <div className="absolute left-4 bottom-16 z-20 flex gap-2">

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5">
                <span className="text-[10px] text-gray-500">
                  BUY
                </span>

                <span className="text-xs font-bold text-green-400 ml-2">
                  {formatMoney(
                    market.buyPrice
                  )}
                </span>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-1.5">
                <span className="text-[10px] text-gray-500">
                  SELL
                </span>

                <span className="text-xs font-bold text-red-400 ml-2">
                  {formatMoney(
                    market.sellPrice
                  )}
                </span>
              </div>
            </div>

            {/* TIME LABELS */}

            <div className="absolute bottom-0 left-0 right-[85px] h-10 flex justify-between items-center px-6 text-[10px] text-gray-600">
              <span>Open</span>
              <span>Market</span>
              <span>Recent</span>
              <span>Live</span>
            </div>
          </div>
        </div>

        {/* ====================================================
            MARKET STATS
        ==================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-gray-500">
              24H High
            </p>

            <p className="text-lg font-black text-green-400 mt-1">
              PKR{" "}
              {formatMoney(
                market.high24h
              )}
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-gray-500">
              24H Low
            </p>

            <p className="text-lg font-black text-red-400 mt-1">
              PKR{" "}
              {formatMoney(
                market.low24h
              )}
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-gray-500">
              24H Volume
            </p>

            <p className="text-lg font-black text-cyan-400 mt-1">
              {formatGold(
                market.volume24h
              )}{" "}
              g
            </p>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <p className="text-xs text-gray-500">
              Spread
            </p>

            <p className="text-lg font-black text-yellow-400 mt-1">
              PKR{" "}
              {formatMoney(
                Math.max(
                  market.buyPrice -
                    market.sellPrice,
                  0
                )
              )}
            </p>
          </div>
        </div>

        {/* ====================================================
            MAIN TRADING AREA
        ==================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_390px] gap-6 mb-6">

          {/* LEFT */}

          <div className="space-y-6">

            {/* PORTFOLIO */}

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">

              <div className="flex items-center justify-between mb-5">

                <div>
                  <h2 className="font-black text-xl">
                    Portfolio
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Current account valuation
                  </p>
                </div>

                <WalletIcon
                  size={22}
                  className="text-yellow-400"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>
                  <p className="text-xs text-gray-500">
                    Portfolio Value
                  </p>

                  <p className="text-2xl font-black text-white mt-1">
                    PKR{" "}
                    {formatMoney(
                      portfolioValue
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Gold Value
                  </p>

                  <p className="text-2xl font-black text-yellow-400 mt-1">
                    PKR{" "}
                    {formatMoney(
                      profitLoss.currentGoldValue
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    P/L
                  </p>

                  <p
                    className={`text-2xl font-black mt-1 ${
                      profitLoss.profit >=
                      0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {profitLoss.profit >=
                    0
                      ? "+"
                      : ""}
                    PKR{" "}
                    {formatMoney(
                      profitLoss.profit
                    )}
                  </p>

                  <p
                    className={`text-xs mt-1 ${
                      profitLoss.percent >=
                      0
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {profitLoss.percent >=
                    0
                      ? "+"
                      : ""}
                    {profitLoss.percent.toFixed(
                      2
                    )}
                    %
                  </p>
                </div>

              </div>
            </div>

            {/* QUICK MARKET INFO */}

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">

              <div className="flex items-center gap-3 mb-5">
                <Activity
                  size={20}
                  className="text-cyan-400"
                />

                <div>
                  <h2 className="font-black">
                    Market Overview
                  </h2>

                  <p className="text-xs text-gray-500">
                    Current execution prices
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Buy Price
                    </span>

                    <ArrowUpRight
                      size={18}
                      className="text-green-400"
                    />
                  </div>

                  <p className="text-2xl font-black text-green-400 mt-2">
                    PKR{" "}
                    {formatMoney(
                      market.buyPrice
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">
                      Sell Price
                    </span>

                    <ArrowDownRight
                      size={18}
                      className="text-red-400"
                    />
                  </div>

                  <p className="text-2xl font-black text-red-400 mt-2">
                    PKR{" "}
                    {formatMoney(
                      market.sellPrice
                    )}
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* ==================================================
              ORDER PANEL
          ================================================== */}

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden h-fit">

            <div className="p-5 border-b border-zinc-800">

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-black text-xl">
                    Trade Gold
                  </h2>

                  <p className="text-xs text-gray-500 mt-1">
                    Market execution
                  </p>
                </div>

                <Calculator
                  size={22}
                  className="text-yellow-400"
                />
              </div>
            </div>

            {/* BUY / SELL TABS */}

            <div className="grid grid-cols-2 p-3 gap-2">

              <button
                type="button"
                onClick={() =>
                  setTradeType("buy")
                }
                className={`py-3 rounded-xl font-black transition ${
                  tradeType === "buy"
                    ? "bg-green-600 text-white"
                    : "bg-zinc-900 text-gray-500 hover:text-white"
                }`}
              >
                Buy
              </button>

              <button
                type="button"
                onClick={() =>
                  setTradeType("sell")
                }
                className={`py-3 rounded-xl font-black transition ${
                  tradeType === "sell"
                    ? "bg-red-600 text-white"
                    : "bg-zinc-900 text-gray-500 hover:text-white"
                }`}
              >
                Sell
              </button>
            </div>

            <div className="p-5 pt-2">

              <label className="text-xs text-gray-500">
                Gold Quantity
              </label>

              <div className="relative mt-2">

                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  inputMode="decimal"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      event.target.value
                    )
                  }
                  placeholder="0.0000"
                  className="w-full bg-black border border-zinc-700 focus:border-yellow-500 outline-none rounded-xl px-4 py-4 pr-12 text-xl font-bold"
                />

                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                  gram
                </span>
              </div>

              <div className="mt-5 space-y-3">

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Execution Price
                  </span>

                  <span className="font-bold">
                    PKR{" "}
                    {formatMoney(
                      tradeType === "buy"
                        ? market.buyPrice
                        : market.sellPrice
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Quantity
                  </span>

                  <span className="font-bold">
                    {numberValue(
                      quantity
                    ).toFixed(4)}{" "}
                    g
                  </span>
                </div>

                <div className="border-t border-zinc-800 pt-3 flex justify-between">
                  <span className="text-gray-400 font-semibold">
                    Total
                  </span>

                  <span
                    className={`text-xl font-black ${
                      tradeType === "buy"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    PKR{" "}
                    {formatMoney(
                      tradeType === "buy"
                        ? totalCost
                        : totalSell
                    )}
                  </span>
                </div>
              </div>

              {/* BALANCE */}

              <div className="mt-5 rounded-xl bg-zinc-900 p-3 text-xs">

                {tradeType === "buy" ? (
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Available PKR
                    </span>

                    <span className="text-yellow-400 font-bold">
                      PKR{" "}
                      {formatMoney(
                        wallet.WalletBalance
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Available Gold
                    </span>

                    <span className="text-green-400 font-bold">
                      {formatGold(
                        wallet.goldBalance
                      )}{" "}
                      g
                    </span>
                  </div>
                )}
              </div>

              {/* EXECUTE */}

              <button
                type="button"
                disabled={
                  tradeLoading ||
                  !quantity
                }
                onClick={() =>
                  openTradeConfirmation(
                    tradeType
                  )
                }
                className={`w-full mt-5 py-4 rounded-xl font-black text-lg disabled:opacity-50 disabled:cursor-not-allowed transition ${
                  tradeType === "buy"
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {tradeLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Processing...
                  </span>
                ) : tradeType ===
                  "buy" ? (
                  "Buy Gold"
                ) : (
                  "Sell Gold"
                )}
              </button>

              <p className="text-[10px] text-gray-600 text-center mt-3">
                Order will use the current market execution price.
              </p>
            </div>
          </div>
        </div>
                {/* ====================================================
            TRADE HISTORY
        ==================================================== */}

        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden mb-6">

          <div className="p-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Clock3
                  size={20}
                  className="text-cyan-400"
                />
              </div>

              <div>
                <h2 className="font-black text-xl">
                  Trading History
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Your recent gold transactions
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-72">

              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600"
              />

              <input
                type="text"
                value={historySearch}
                onChange={(event) =>
                  setHistorySearch(
                    event.target.value
                  )
                }
                placeholder="Search history..."
                className="w-full bg-black border border-zinc-700 focus:border-cyan-500 outline-none rounded-xl py-2.5 pl-10 pr-4 text-sm"
              />
            </div>
          </div>

          {/* DESKTOP TABLE */}

          <div className="hidden md:block overflow-x-auto">

            <table className="w-full">

              <thead className="bg-black/60">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-5 py-4">
                    Type
                  </th>

                  <th className="px-5 py-4">
                    Quantity
                  </th>

                  <th className="px-5 py-4">
                    Price
                  </th>

                  <th className="px-5 py-4">
                    Total
                  </th>

                  <th className="px-5 py-4">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredHistory.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-gray-600"
                    >
                      No trading history found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(
                    (trade) => (
                      <tr
                        key={trade._id}
                        className="border-t border-zinc-900 hover:bg-zinc-900/40"
                      >
                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              trade.type ===
                              "buy"
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {trade.type ===
                            "buy" ? (
                              <ArrowUpRight
                                size={13}
                              />
                            ) : (
                              <ArrowDownRight
                                size={13}
                              />
                            )}

                            {trade.type.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-semibold">
                          {formatGold(
                            trade.quantity
                          )}{" "}
                          g
                        </td>

                        <td className="px-5 py-4">
                          PKR{" "}
                          {formatMoney(
                            trade.price
                          )}
                        </td>

                        <td className="px-5 py-4 font-bold">
                          PKR{" "}
                          {formatMoney(
                            trade.total
                          )}
                        </td>

                        <td className="px-5 py-4 text-gray-500 text-sm">
                          {formatDate(
                            trade.createdAt
                          )}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE HISTORY */}

          <div className="md:hidden">

            {filteredHistory.length ===
            0 ? (
              <div className="px-5 py-12 text-center text-gray-600">
                No trading history found.
              </div>
            ) : (
              <div className="divide-y divide-zinc-900">

                {filteredHistory.map(
                  (trade) => (
                    <div
                      key={trade._id}
                      className="p-4"
                    >
                      <div className="flex items-center justify-between">

                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            trade.type ===
                            "buy"
                              ? "bg-green-500/10 text-green-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {trade.type ===
                          "buy" ? (
                            <ArrowUpRight
                              size={13}
                            />
                          ) : (
                            <ArrowDownRight
                              size={13}
                            />
                          )}

                          {trade.type.toUpperCase()}
                        </span>

                        <span className="text-xs text-gray-600">
                          {formatDate(
                            trade.createdAt
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4">

                        <div>
                          <p className="text-[10px] text-gray-600">
                            Quantity
                          </p>

                          <p className="text-sm font-bold mt-1">
                            {formatGold(
                              trade.quantity
                            )}{" "}
                            g
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-gray-600">
                            Price
                          </p>

                          <p className="text-sm font-bold mt-1">
                            PKR{" "}
                            {formatMoney(
                              trade.price
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] text-gray-600">
                            Total
                          </p>

                          <p className="text-sm font-bold mt-1">
                            PKR{" "}
                            {formatMoney(
                              trade.total
                            )}
                          </p>
                        </div>

                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* ====================================================
            CONFIRMATION MODAL
        ==================================================== */}

        {confirmTrade && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">

            <div className="w-full max-w-md bg-zinc-950 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">

              <div className="p-5 border-b border-zinc-800 flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tradeType ===
                      "buy"
                        ? "bg-green-500/10"
                        : "bg-red-500/10"
                    }`}
                  >
                    <CheckCircle2
                      size={21}
                      className={
                        tradeType ===
                        "buy"
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    />
                  </div>

                  <div>
                    <h3 className="font-black text-lg">
                      Confirm{" "}
                      {tradeType ===
                      "buy"
                        ? "Buy"
                        : "Sell"}
                    </h3>

                    <p className="text-xs text-gray-500">
                      Review order before execution
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmTrade(false)
                  }
                  disabled={tradeLoading}
                  className="text-gray-500 hover:text-white disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-5">

                <div className="rounded-xl bg-black border border-zinc-800 p-4 space-y-4">

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Action
                    </span>

                    <span
                      className={`font-black ${
                        tradeType ===
                        "buy"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {tradeType ===
                      "buy"
                        ? "BUY GOLD"
                        : "SELL GOLD"}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Quantity
                    </span>

                    <span className="font-bold">
                      {numberValue(
                        quantity
                      ).toFixed(4)}{" "}
                      g
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      Price
                    </span>

                    <span className="font-bold">
                      PKR{" "}
                      {formatMoney(
                        tradeType ===
                          "buy"
                          ? market.buyPrice
                          : market.sellPrice
                      )}
                    </span>
                  </div>

                  <div className="border-t border-zinc-800 pt-4 flex justify-between">
                    <span className="font-semibold">
                      Total
                    </span>

                    <span className="text-xl font-black text-yellow-400">
                      PKR{" "}
                      {formatMoney(
                        tradeType ===
                          "buy"
                          ? totalCost
                          : totalSell
                      )}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">

                  <button
                    type="button"
                    onClick={() =>
                      setConfirmTrade(false)
                    }
                    disabled={
                      tradeLoading
                    }
                    className="py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={
                      confirmTradeAction
                    }
                    disabled={
                      tradeLoading
                    }
                    className={`py-3 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-50 ${
                      tradeType ===
                      "buy"
                        ? "bg-green-600 hover:bg-green-500"
                        : "bg-red-600 hover:bg-red-500"
                    }`}
                  >
                    {tradeLoading ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Processing
                      </>
                    ) : (
                      "Confirm Trade"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================
            FOOTER
        ==================================================== */}

        <footer className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <p className="font-black text-yellow-400">
                GoldTrade Market
              </p>

              <p className="text-xs text-gray-600 mt-1">
                Live Gold Trading Dashboard
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Activity size={14} />
              Market connected
            </div>

            <div className="text-xs text-gray-600">
              GoldTrade Enterprise
            </div>
          </div>
        </footer>

      </div>
    </main>
  );
}