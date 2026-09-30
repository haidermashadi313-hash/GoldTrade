"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

// ======================================================
// API CONFIG
// ======================================================

const getApiUrl = () => {
  if (typeof window === "undefined") {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      "https://goldtrade-2.onrender.com"
    );
  }

  const hostname = window.location.hostname;

  // Local development
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  ) {
    return "http://localhost:5000";
  }

  // Production
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://goldtrade-2.onrender.com"
  ).replace(/\/+$/, "");
};

const API = getApiUrl();

// ======================================================
// TYPES
// ======================================================

interface WalletData {
  walletBalance: number;
  pkrBalance: number;
  usdtBalance: number;
}

interface UsdtMarket {
  buyRate: number;
  sellRate: number;
  tradingEnabled: boolean;
  marketStatus: "OPEN" | "CLOSED";
}

interface UsdtTransaction {
  _id: string;
  type: "BUY" | "SELL";
  usdtAmount: number;
  pkrAmount: number;
  rate?: number;
  status?: string;
  createdAt: string;
}

// ======================================================
// DEFAULT VALUES
// ======================================================

const defaultWallet: WalletData = {
  walletBalance: 0,
  pkrBalance: 0,
  usdtBalance: 0,
};

const defaultMarket: UsdtMarket = {
  buyRate: 285,
  sellRate: 283,
  tradingEnabled: true,
  marketStatus: "OPEN",
};

// ======================================================
// PAGE
// ======================================================

export default function UsdtDashboardPage() {
  // ====================================================
  // AUTH
  // ====================================================

  const [token, setToken] = useState("");

  // ====================================================
  // DATA
  // ====================================================

  const [wallet, setWallet] =
    useState<WalletData>(defaultWallet);

  const [market, setMarket] =
    useState<UsdtMarket>(defaultMarket);

  const [history, setHistory] =
    useState<UsdtTransaction[]>([]);

  // ====================================================
  // UI STATE
  // ====================================================

  const [loading, setLoading] = useState(true);

  const [buyAmount, setBuyAmount] =
    useState(100);

  const [sellAmount, setSellAmount] =
    useState(50);

  const [buyLoading, setBuyLoading] =
    useState(false);

  const [sellLoading, setSellLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ====================================================
  // HEADERS
  // ====================================================

  const getHeaders = (): HeadersInit => {
    const currentToken =
      token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("token") || ""
        : "");

    return {
      Authorization: `Bearer ${currentToken}`,
      "Content-Type": "application/json",
    };
  };
    // ====================================================
  // LOAD DASHBOARD
  // ====================================================

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const headers = getHeaders();

      const [
        walletRes,
        marketRes,
        historyRes,
      ] = await Promise.all([
        // ----------------------------------------------
        // WALLET
        // ----------------------------------------------

        fetch(`${API}/api/wallet/balance`, {
          method: "GET",
          headers,
          cache: "no-store",
        }),

        // ----------------------------------------------
        // USDT MARKET
        // ----------------------------------------------

        fetch(`${API}/api/usdt/price`, {
          method: "GET",
          cache: "no-store",
        }),

        // ----------------------------------------------
        // USDT HISTORY
        // ----------------------------------------------

        fetch(`${API}/api/usdt/history`, {
          method: "GET",
          headers,
          cache: "no-store",
        }),
      ]);

      const walletData =
        await walletRes.json().catch(() => ({}));

      const marketData =
        await marketRes.json().catch(() => ({}));

      const historyData =
        await historyRes.json().catch(() => ({}));

      // ==================================================
      // WALLET RESPONSE
      // ==================================================

      if (walletRes.ok) {
        const walletBalance = Number(
          walletData.walletBalance ??
          walletData.availablePkr ??
          walletData.pkrBalance ??
          0
        );

        const pkrBalance = Number(
          walletData.pkrBalance ??
          walletData.walletBalance ??
          walletData.availablePkr ??
          0
        );

        const usdtBalance = Number(
          walletData.usdtBalance ??
          walletData.availableUsdt ??
          0
        );

        setWallet({
          walletBalance:
            Number.isFinite(walletBalance)
              ? walletBalance
              : 0,

          pkrBalance:
            Number.isFinite(pkrBalance)
              ? pkrBalance
              : 0,

          usdtBalance:
            Number.isFinite(usdtBalance)
              ? usdtBalance
              : 0,
        });
      } else {
        console.error(
          "Wallet API Error:",
          walletData
        );
      }

      // ==================================================
      // MARKET RESPONSE
      // ==================================================

      if (marketRes.ok) {
        const buyRate = Number(
          marketData.buyRate ??
          marketData.buyPrice ??
          285
        );

        const sellRate = Number(
          marketData.sellRate ??
          marketData.sellPrice ??
          283
        );

        const tradingEnabled =
          marketData.tradingEnabled ??
          marketData.usdtTradingEnabled ??
          true;

        const normalizedMarketStatus =
          String(
            marketData.marketStatus ||
              "OPEN"
          ).toUpperCase();

        const marketStatus =
          normalizedMarketStatus === "CLOSED"
            ? "CLOSED"
            : "OPEN";

        setMarket({
          buyRate:
            Number.isFinite(buyRate) &&
            buyRate > 0
              ? buyRate
              : 285,

          sellRate:
            Number.isFinite(sellRate) &&
            sellRate > 0
              ? sellRate
              : 283,

          tradingEnabled:
            Boolean(tradingEnabled),

          marketStatus,
        });
      } else {
        console.error(
          "USDT Price API Error:",
          marketData
        );
      }

      // ==================================================
      // HISTORY RESPONSE
      // ==================================================

      if (historyRes.ok) {
        const serverHistory =
          Array.isArray(historyData.history)
            ? historyData.history
            : Array.isArray(historyData.data)
            ? historyData.data
            : [];

        setHistory(serverHistory);
      } else {
        console.error(
          "USDT History API Error:",
          historyData
        );
      }
    } catch (error) {
      console.error(
        "USDT Dashboard Error:",
        error
      );

      setErrorMessage(
        "Unable to load USDT dashboard data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // INITIAL AUTH
  // ====================================================

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedToken =
      localStorage.getItem("token") || "";

    if (!storedToken) {
      window.location.href = "/login";
      return;
    }

    setToken(storedToken);
  }, []);

  // ====================================================
  // LOAD AFTER TOKEN
  // ====================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    loadDashboard();
  }, [token]);
    // ====================================================
  // MARKET AVAILABILITY
  // ====================================================

  const marketOpen =
    market.marketStatus === "OPEN";

  const tradingAvailable =
    market.tradingEnabled &&
    marketOpen;

  // ====================================================
  // SAFE AMOUNTS
  // ====================================================

  const safeBuyAmount =
    Number.isFinite(buyAmount) &&
    buyAmount > 0
      ? buyAmount
      : 0;

  const safeSellAmount =
    Number.isFinite(sellAmount) &&
    sellAmount > 0
      ? sellAmount
      : 0;

  // ====================================================
  // BUY COST
  // ====================================================

  const buyCost = useMemo(() => {
    const result =
      safeBuyAmount * market.buyRate;

    return Number.isFinite(result)
      ? result
      : 0;
  }, [
    safeBuyAmount,
    market.buyRate,
  ]);

  // ====================================================
  // SELL VALUE
  // ====================================================

  const sellValue = useMemo(() => {
    const result =
      safeSellAmount * market.sellRate;

    return Number.isFinite(result)
      ? result
      : 0;
  }, [
    safeSellAmount,
    market.sellRate,
  ]);

  // ====================================================
  // BUY BALANCE CHECK
  // ====================================================

  const enoughPkrBalance =
    wallet.pkrBalance >= buyCost &&
    buyCost > 0;

  // ====================================================
  // SELL BALANCE CHECK
  // ====================================================

  const enoughUsdtBalance =
    wallet.usdtBalance >=
      safeSellAmount &&
    safeSellAmount > 0;

  // ====================================================
  // BUY VALIDATION
  // ====================================================

  const validateBuy = () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!market.tradingEnabled) {
      setErrorMessage(
        "USDT trading is currently disabled by admin."
      );
      return false;
    }

    if (!marketOpen) {
      setErrorMessage(
        "USDT market is currently closed."
      );
      return false;
    }

    if (
      !Number.isFinite(buyAmount) ||
      buyAmount < 1
    ) {
      setErrorMessage(
        "Minimum USDT purchase is 1 USDT."
      );
      return false;
    }

    if (
      !Number.isFinite(market.buyRate) ||
      market.buyRate <= 0
    ) {
      setErrorMessage(
        "USDT buy rate is currently unavailable."
      );
      return false;
    }

    if (!enoughPkrBalance) {
      setErrorMessage(
        "Insufficient PKR wallet balance."
      );
      return false;
    }

    return true;
  };

  // ====================================================
  // SELL VALIDATION
  // ====================================================

  const validateSell = () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!market.tradingEnabled) {
      setErrorMessage(
        "USDT trading is currently disabled by admin."
      );
      return false;
    }

    if (!marketOpen) {
      setErrorMessage(
        "USDT market is currently closed."
      );
      return false;
    }

    if (
      !Number.isFinite(sellAmount) ||
      sellAmount < 1
    ) {
      setErrorMessage(
        "Minimum USDT sale is 1 USDT."
      );
      return false;
    }

    if (
      !Number.isFinite(market.sellRate) ||
      market.sellRate <= 0
    ) {
      setErrorMessage(
        "USDT sell rate is currently unavailable."
      );
      return false;
    }

    if (!enoughUsdtBalance) {
      setErrorMessage(
        "Insufficient USDT wallet balance."
      );
      return false;
    }

    return true;
  };

  // ====================================================
  // BUY USDT
  // ====================================================

  const buyUsdt = async () => {
    if (!validateBuy()) {
      return;
    }

    try {
      setBuyLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `${API}/api/usdt/buy`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            usdtAmount: Number(
              buyAmount.toFixed(8)
            ),
          }),
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (
        response.ok &&
        data.success
      ) {
        setSuccessMessage(
          data.message ||
            "USDT purchased successfully."
        );

        await loadDashboard();
      } else {
        setErrorMessage(
          data.message ||
            "USDT purchase failed."
        );
      }
    } catch (error) {
      console.error(
        "USDT Buy Error:",
        error
      );

      setErrorMessage(
        "Server error while processing USDT purchase."
      );
    } finally {
      setBuyLoading(false);
    }
  };

  // ====================================================
  // SELL USDT
  // ====================================================

  const sellUsdt = async () => {
    if (!validateSell()) {
      return;
    }

    try {
      setSellLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `${API}/api/usdt/sell`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            usdtAmount: Number(
              sellAmount.toFixed(8)
            ),
          }),
        }
      );

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (
        response.ok &&
        data.success
      ) {
        setSuccessMessage(
          data.message ||
            "USDT sold successfully."
        );

        await loadDashboard();
      } else {
        setErrorMessage(
          data.message ||
            "USDT sale failed."
        );
      }
    } catch (error) {
      console.error(
        "USDT Sell Error:",
        error
      );

      setErrorMessage(
        "Server error while processing USDT sale."
      );
    } finally {
      setSellLoading(false);
    }
  };

  // ====================================================
  // LOADING SCREEN
  // ====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw
          className="animate-spin mr-3"
          size={26}
        />

        Loading USDT Dashboard...
      </main>
    );
  }
    // ====================================================
  // UI
  // ====================================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-blue-400">
              <DollarSign size={38} />

              USDT Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Buy, sell and manage your USDT wallet.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">

            <Link
              href="/dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />

              Dashboard
            </Link>

            <button
              type="button"
              onClick={loadDashboard}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw size={18} />

              Refresh
            </button>

          </div>
        </header>

        {/* ==================================================
            ERROR MESSAGE
        ================================================== */}

        {errorMessage && (
          <section className="bg-red-950 border border-red-500 rounded-2xl p-5">

            <div className="flex items-start gap-3 text-red-300">

              <AlertCircle
                size={24}
                className="mt-0.5 shrink-0"
              />

              <div>
                <h3 className="font-bold text-lg">
                  Transaction Notice
                </h3>

                <p className="mt-1">
                  {errorMessage}
                </p>
              </div>

            </div>

          </section>
        )}

        {/* ==================================================
            SUCCESS MESSAGE
        ================================================== */}

        {successMessage && (
          <section className="bg-green-950 border border-green-500 rounded-2xl p-5">

            <div className="flex items-start gap-3 text-green-300">

              <CheckCircle
                size={24}
                className="mt-0.5 shrink-0"
              />

              <div>
                <h3 className="font-bold text-lg">
                  Transaction Successful
                </h3>

                <p className="mt-1">
                  {successMessage}
                </p>
              </div>

            </div>

          </section>
        )}

        {/* ==================================================
            MARKET STATUS
        ================================================== */}

        <section
          className={`rounded-2xl p-5 border ${
            tradingAvailable
              ? "bg-green-950 border-green-500"
              : "bg-red-950 border-red-500"
          }`}
        >

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h2 className="text-xl font-bold">
                {tradingAvailable
                  ? "USDT Trading Active"
                  : "USDT Trading Unavailable"}
              </h2>

              <p className="text-gray-300 mt-2">
                {market.tradingEnabled
                  ? marketOpen
                    ? "You can buy and sell USDT."
                    : "USDT market is currently closed."
                  : "Trading is currently disabled by admin."}
              </p>

            </div>

            <div
              className={`px-4 py-2 rounded-full font-bold ${
                tradingAvailable
                  ? "bg-green-700 text-green-100"
                  : "bg-red-700 text-red-100"
              }`}
            >
              {market.tradingEnabled
                ? market.marketStatus
                : "DISABLED"}
            </div>

          </div>

        </section>

        {/* ==================================================
            WALLET SUMMARY
        ================================================== */}

        <section className="grid md:grid-cols-3 gap-5">

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

            <p className="text-gray-500 text-sm">
              USDT Balance
            </p>

            <h3 className="text-2xl font-black text-cyan-400 mt-2">
              {wallet.usdtBalance.toFixed(2)} USDT
            </h3>

          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <p className="text-gray-500 text-sm">
              PKR Wallet
            </p>

            <h3 className="text-2xl font-black text-yellow-400 mt-2">
              PKR{" "}
              {wallet.pkrBalance.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 2,
                }
              )}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

            <p className="text-gray-500 text-sm">
              USDT Wallet Value
            </p>

            <h3 className="text-2xl font-black text-green-400 mt-2">
              PKR{" "}
              {(
                wallet.usdtBalance *
                market.sellRate
              ).toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 2,
                }
              )}
            </h3>

          </div>

        </section>

        {/* ==================================================
            LIVE MARKET RATES
        ================================================== */}

        <section className="grid md:grid-cols-2 gap-5">

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

            <div className="flex items-center gap-3 mb-3">

              <TrendingUp
                className="text-cyan-400"
                size={24}
              />

              <h2 className="text-xl font-bold text-cyan-400">
                Buy Rate
              </h2>

            </div>

            <h3 className="text-4xl font-black text-cyan-400">
              PKR{" "}
              {market.buyRate.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 4,
                }
              )}
            </h3>

            <p className="text-gray-400 mt-2">
              Price per 1 USDT
            </p>

          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-6">

            <div className="flex items-center gap-3 mb-3">

              <TrendingDown
                className="text-orange-400"
                size={24}
              />

              <h2 className="text-xl font-bold text-orange-400">
                Sell Rate
              </h2>

            </div>

            <h3 className="text-4xl font-black text-orange-400">
              PKR{" "}
              {market.sellRate.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 4,
                }
              )}
            </h3>

            <p className="text-gray-400 mt-2">
              Price per 1 USDT
            </p>

          </div>

        </section>
                {/* ==================================================
            QUICK ACTIONS
        ================================================== */}

        <section className="grid md:grid-cols-2 gap-5">

          <Link
            href="/usdt/buy-usdt"
            className="bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl p-6 transition flex items-center justify-between"
          >

            <div>

              <p className="text-sm font-semibold">
                Buy USDT
              </p>

              <h3 className="text-2xl font-black mt-2">
                Buy Now
              </h3>

            </div>

            <ArrowUpRight size={34} />

          </Link>

          <Link
            href="/usdt/sell-usdt"
            className="bg-green-500 hover:bg-green-400 text-black rounded-2xl p-6 transition flex items-center justify-between"
          >

            <div>

              <p className="text-sm font-semibold">
                Sell USDT
              </p>

              <h3 className="text-2xl font-black mt-2">
                Sell Now
              </h3>

            </div>

            <ArrowDownRight size={34} />

          </Link>

        </section>

        {/* ==================================================
            BUY / SELL PANELS
        ================================================== */}

        <section className="grid lg:grid-cols-2 gap-6">

          {/* ==================================================
              BUY
          ================================================== */}

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6 space-y-5">

            <div className="flex items-center gap-3">

              <ArrowDownCircle
                className="text-green-400"
                size={28}
              />

              <h2 className="text-2xl font-black text-green-400">
                Buy USDT
              </h2>

            </div>

            <input
              type="number"
              min={1}
              step="0.01"
              value={
                buyAmount === 0
                  ? ""
                  : buyAmount
              }
              onChange={(e) => {
                const value =
                  e.target.value;

                setBuyAmount(
                  value === ""
                    ? 0
                    : Number(value)
                );

                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-green-500"
              placeholder="USDT Amount"
            />

            <div className="bg-zinc-800 rounded-xl p-4">

              <p className="text-gray-400">
                You Pay
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR{" "}
                {buyCost.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>

            </div>

            <div className="text-sm text-gray-400">
              Available PKR:{" "}
              <span className="text-yellow-400 font-bold">
                PKR{" "}
                {wallet.pkrBalance.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
            </div>

            <button
              type="button"
              disabled={
                !tradingAvailable ||
                buyLoading ||
                !enoughPkrBalance ||
                safeBuyAmount < 1
              }
              onClick={buyUsdt}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-gray-400 py-3 rounded-xl font-bold"
            >
              {buyLoading
                ? "Processing..."
                : !market.tradingEnabled
                ? "Trading Disabled"
                : !marketOpen
                ? "Market Closed"
                : !enoughPkrBalance
                ? "Insufficient PKR"
                : "Buy USDT"}
            </button>

          </div>

          {/* ==================================================
              SELL
          ================================================== */}

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-6 space-y-5">

            <div className="flex items-center gap-3">

              <ArrowUpCircle
                className="text-red-400"
                size={28}
              />

              <h2 className="text-2xl font-black text-red-400">
                Sell USDT
              </h2>

            </div>

            <input
              type="number"
              min={1}
              step="0.01"
              value={
                sellAmount === 0
                  ? ""
                  : sellAmount
              }
              onChange={(e) => {
                const value =
                  e.target.value;

                setSellAmount(
                  value === ""
                    ? 0
                    : Number(value)
                );

                setErrorMessage("");
                setSuccessMessage("");
              }}
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-red-500"
              placeholder="USDT Amount"
            />

            <div className="bg-zinc-800 rounded-xl p-4">

              <p className="text-gray-400">
                You Receive
              </p>

              <h3 className="text-3xl font-black text-red-400 mt-2">
                PKR{" "}
                {sellValue.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>

            </div>

            <div className="text-sm text-gray-400">
              Available USDT:{" "}
              <span className="text-cyan-400 font-bold">
                {wallet.usdtBalance.toFixed(2)} USDT
              </span>
            </div>

            <button
              type="button"
              disabled={
                !tradingAvailable ||
                sellLoading ||
                !enoughUsdtBalance ||
                safeSellAmount < 1
              }
              onClick={sellUsdt}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-700 disabled:text-gray-400 py-3 rounded-xl font-bold"
            >
              {sellLoading
                ? "Processing..."
                : !market.tradingEnabled
                ? "Trading Disabled"
                : !marketOpen
                ? "Market Closed"
                : !enoughUsdtBalance
                ? "Insufficient USDT"
                : "Sell USDT"}
            </button>

          </div>

        </section>

        {/* ==================================================
            BUY SUMMARY
        ================================================== */}

        <section className="bg-zinc-900 border border-blue-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-blue-400 mb-5">
            Buy Summary
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black rounded-xl p-5 border border-cyan-500">

              <p className="text-gray-400 text-sm">
                Buying
              </p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                {safeBuyAmount.toFixed(2)} USDT
              </h3>

            </div>

            <div className="bg-black rounded-xl p-5 border border-yellow-500">

              <p className="text-gray-400 text-sm">
                Buy Rate
              </p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                PKR{" "}
                {market.buyRate.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">

              <p className="text-gray-400 text-sm">
                Total Cost
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR{" "}
                {buyCost.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>

            </div>

          </div>

        </section>

        {/* ==================================================
            SELL SUMMARY
        ================================================== */}

        <section className="bg-zinc-900 border border-red-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-red-400 mb-5">
            Sell Summary
          </h2>

          <div className="grid md:grid-cols-4 gap-5">

            <div className="bg-black rounded-xl p-5 border border-cyan-500">

              <p className="text-gray-400 text-sm">
                Selling
              </p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                {safeSellAmount.toFixed(2)} USDT
              </h3>

            </div>

            <div className="bg-black rounded-xl p-5 border border-yellow-500">

              <p className="text-gray-400 text-sm">
                Sell Rate
              </p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                PKR{" "}
                {market.sellRate.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">

              <p className="text-gray-400 text-sm">
                You'll Receive
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR{" "}
                {sellValue.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>

            </div>

            <div className="bg-black rounded-xl p-5 border border-purple-500">

              <p className="text-gray-400 text-sm">
                Available USDT
              </p>

              <h3 className="text-3xl font-black text-purple-400 mt-2">
                {wallet.usdtBalance.toFixed(2)}
              </h3>

            </div>

          </div>

        </section>
                {/* ==================================================
            TRANSACTION HISTORY
        ================================================== */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">

            <h2 className="text-2xl font-black text-cyan-400">
              USDT Transaction History
            </h2>

            <Link
              href="/usdt/history"
              className="text-cyan-400 hover:text-cyan-300 font-bold"
            >
              View Full History →
            </Link>

          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No USDT transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b border-zinc-700 text-cyan-400">

                    <th className="p-3">
                      Type
                    </th>

                    <th className="p-3">
                      USDT
                    </th>

                    <th className="p-3">
                      PKR
                    </th>

                    <th className="p-3">
                      Rate
                    </th>

                    <th className="p-3">
                      Status
                    </th>

                    <th className="p-3">
                      Date
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {history
                    .slice(0, 10)
                    .map((item) => {

                      const usdtAmount =
                        Number(
                          item.usdtAmount || 0
                        );

                      const pkrAmount =
                        Number(
                          item.pkrAmount || 0
                        );

                      const calculatedRate =
                        item.rate !== undefined
                          ? Number(item.rate)
                          : usdtAmount > 0
                          ? pkrAmount /
                            usdtAmount
                          : 0;

                      const normalizedType =
                        String(
                          item.type || "BUY"
                        ).toUpperCase();

                      return (
                        <tr
                          key={item._id}
                          className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                        >

                          {/* TYPE */}

                          <td className="p-3">

                            {normalizedType ===
                            "BUY" ? (
                              <span className="inline-flex items-center gap-2 text-green-400 font-semibold">

                                <ArrowDownCircle
                                  size={16}
                                />

                                BUY

                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 text-red-400 font-semibold">

                                <ArrowUpCircle
                                  size={16}
                                />

                                SELL

                              </span>
                            )}

                          </td>

                          {/* USDT */}

                          <td className="p-3 text-blue-400 font-bold">

                            {usdtAmount.toFixed(2)}{" "}
                            USDT

                          </td>

                          {/* PKR */}

                          <td className="p-3 text-green-400 font-semibold">

                            PKR{" "}
                            {pkrAmount.toLocaleString(
                              undefined,
                              {
                                maximumFractionDigits: 2,
                              }
                            )}

                          </td>

                          {/* RATE */}

                          <td className="p-3 text-yellow-400 font-semibold">

                            PKR{" "}
                            {Number.isFinite(
                              calculatedRate
                            )
                              ? calculatedRate.toFixed(
                                  2
                                )
                              : "0.00"}

                          </td>

                          {/* STATUS */}

                          <td className="p-3">

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                String(
                                  item.status ||
                                    "COMPLETED"
                                ).toUpperCase() ===
                                "COMPLETED"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-yellow-500/20 text-yellow-400"
                              }`}
                            >
                              {String(
                                item.status ||
                                  "COMPLETED"
                              ).toUpperCase()}
                            </span>

                          </td>

                          {/* DATE */}

                          <td className="p-3 text-gray-400 whitespace-nowrap">

                            {item.createdAt
                              ? new Date(
                                  item.createdAt
                                ).toLocaleString()
                              : "N/A"}

                          </td>

                        </tr>
                      );
                    })}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ==================================================
            MARKET INFORMATION
        ================================================== */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Live USDT Market Information
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            {/* BUY PRICE */}

            <div className="bg-black rounded-xl p-5 border border-cyan-500">

              <p className="text-gray-400 text-sm">
                Buy Price
              </p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">

                PKR{" "}
                {market.buyRate.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 4,
                  }
                )}

              </h3>

              <p className="text-gray-500 mt-1">
                Per 1 USDT
              </p>

            </div>

            {/* SELL PRICE */}

            <div className="bg-black rounded-xl p-5 border border-orange-500">

              <p className="text-gray-400 text-sm">
                Sell Price
              </p>

              <h3 className="text-3xl font-black text-orange-400 mt-2">

                PKR{" "}
                {market.sellRate.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 4,
                  }
                )}

              </h3>

              <p className="text-gray-500 mt-1">
                Per 1 USDT
              </p>

            </div>

            {/* WALLET VALUE */}

            <div className="bg-black rounded-xl p-5 border border-blue-500">

              <p className="text-gray-400 text-sm">
                Wallet Value
              </p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">

                PKR{" "}
                {(
                  wallet.usdtBalance *
                  market.sellRate
                ).toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}

              </h3>

              <p className="text-gray-500 mt-1">
                {wallet.usdtBalance.toFixed(2)}{" "}
                USDT Available
              </p>

            </div>

          </div>

        </section>

        {/* ==================================================
            MARKET STATUS DETAIL
        ================================================== */}

        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h2 className="text-2xl font-black text-purple-400">
                USDT Market Status
              </h2>

              <p className="text-gray-400 mt-2">
                Current trading availability
              </p>

            </div>

            <div className="flex gap-3 flex-wrap">

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  marketOpen
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                Market{" "}
                {marketOpen
                  ? "OPEN"
                  : "CLOSED"}
              </span>

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  market.tradingEnabled
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                Trading{" "}
                {market.tradingEnabled
                  ? "Enabled"
                  : "Disabled"}
              </span>

            </div>

          </div>

        </section>
                {/* ==================================================
            TRADING RULES
        ================================================== */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            USDT Trading Rules
          </h2>

          <div className="space-y-4 text-gray-300">

            <div className="flex justify-between border-b border-zinc-800 pb-3 gap-4">
              <span>
                Minimum Buy
              </span>

              <span className="text-cyan-400 font-bold">
                1 USDT
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3 gap-4">
              <span>
                Minimum Sell
              </span>

              <span className="text-cyan-400 font-bold">
                1 USDT
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3 gap-4">
              <span>
                Buy Payment Source
              </span>

              <span className="text-cyan-400 font-bold">
                PKR Wallet
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3 gap-4">
              <span>
                Sell Payment
              </span>

              <span className="text-cyan-400 font-bold">
                PKR Wallet
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3 gap-4">
              <span>
                Maximum Buy
              </span>

              <span className="text-cyan-400 font-bold">
                PKR Wallet Limit
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3 gap-4">
              <span>
                Maximum Sell
              </span>

              <span className="text-cyan-400 font-bold">
                USDT Wallet Limit
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>
                Trading Status
              </span>

              <span
                className={`font-bold ${
                  tradingAvailable
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {tradingAvailable
                  ? "Available"
                  : "Unavailable"}
              </span>
            </div>

          </div>

        </section>

        {/* ==================================================
            SECURITY NOTICE
        ================================================== */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Trading Security
          </h2>

          <div className="space-y-4 text-gray-300">

            <div className="flex items-start gap-3">

              <CheckCircle
                className="text-green-400 mt-1 shrink-0"
                size={20}
              />

              <p>
                Every USDT buy and sell operation is sent to the authenticated GoldTrade account.
              </p>

            </div>

            <div className="flex items-start gap-3">

              <CheckCircle
                className="text-green-400 mt-1 shrink-0"
                size={20}
              />

              <p>
                Buy transactions are checked against the available PKR wallet balance.
              </p>

            </div>

            <div className="flex items-start gap-3">

              <CheckCircle
                className="text-green-400 mt-1 shrink-0"
                size={20}
              />

              <p>
                Sell transactions are checked against the available USDT wallet balance.
              </p>

            </div>

            <div className="flex items-start gap-3">

              <CheckCircle
                className="text-green-400 mt-1 shrink-0"
                size={20}
              />

              <p>
                Trading is blocked automatically when the market is closed or trading is disabled.
              </p>

            </div>

            <div className="flex items-start gap-3">

              <CheckCircle
                className="text-green-400 mt-1 shrink-0"
                size={20}
              />

              <p>
                The dashboard refreshes wallet and transaction information after a successful trade.
              </p>

            </div>

          </div>

        </section>

        {/* ==================================================
            FOOTER ACTIONS
        ================================================== */}

        <section className="flex flex-wrap justify-center gap-4 pb-8">

          <Link
            href="/usdt/buy-usdt"
            className="bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-xl font-bold"
          >
            Open Buy USDT
          </Link>

          <Link
            href="/usdt/sell-usdt"
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-bold"
          >
            Open Sell USDT
          </Link>

          <Link
            href="/usdt/portfolio"
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold"
          >
            Open Portfolio
          </Link>

          <Link
            href="/usdt/history"
            className="bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-xl font-bold"
          >
            Open History
          </Link>

        </section>

      </div>
    </main>
  );
}