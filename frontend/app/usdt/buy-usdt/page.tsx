"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  DollarSign,
  Wallet,
  TrendingUp,
  CheckCircle,
  AlertCircle,
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

  const configuredApi =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "";

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
    configuredApi ||
    "https://goldtrade-2.onrender.com"
  ).replace(/\/+$/, "");
};

const API = getApiUrl();

// ======================================================
// TYPES
// ======================================================

interface WalletData {
  walletBalance: number;
  usdtBalance: number;
}

interface UsdtRate {
  buyRate: number;
  sellRate?: number;
  tradingEnabled: boolean;
  marketStatus: "OPEN" | "CLOSED";
}

interface BuyHistory {
  _id: string;
  usdtAmount: number;
  pkrAmount: number;
  rate: number;
  type?: string;
  status?: string;
  createdAt: string;
}

// ======================================================
// DEFAULT VALUES
// ======================================================

const emptyWallet: WalletData = {
  walletBalance: 0,
  usdtBalance: 0,
};

const defaultRate: UsdtRate = {
  buyRate: 285,
  sellRate: 280,
  tradingEnabled: true,
  marketStatus: "OPEN",
};

// ======================================================
// PAGE
// ======================================================

export default function BuyUsdtPage() {
  // ====================================================
  // AUTH
  // ====================================================

  const [token, setToken] = useState("");

  // ====================================================
  // DATA
  // ====================================================

  const [wallet, setWallet] =
    useState<WalletData>(emptyWallet);

  const [market, setMarket] =
    useState<UsdtRate>(defaultRate);

  const [history, setHistory] =
    useState<BuyHistory[]>([]);

  // ====================================================
  // UI STATE
  // ====================================================

  const [loading, setLoading] = useState(true);
  const [buyLoading, setBuyLoading] = useState(false);

  const [usdtAmount, setUsdtAmount] = useState(100);

  const [searchTerm, setSearchTerm] = useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  // ====================================================
  // AUTH HEADERS
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
  // LOAD DATA
  // ====================================================

  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const headers = getHeaders();

      const [walletRes, rateRes, historyRes] =
        await Promise.all([
          fetch(`${API}/api/wallet/balance`, {
            method: "GET",
            headers,
            cache: "no-store",
          }),

          fetch(`${API}/api/usdt/price`, {
            method: "GET",
            cache: "no-store",
          }),

          fetch(`${API}/api/usdt/history`, {
            method: "GET",
            headers,
            cache: "no-store",
          }),
        ]);

      // ==================================================
      // READ RESPONSES SAFELY
      // ==================================================

      const walletData = await walletRes
        .json()
        .catch(() => ({}));

      const rateData = await rateRes
        .json()
        .catch(() => ({}));

      const historyData = await historyRes
        .json()
        .catch(() => ({}));

      // ==================================================
      // WALLET
      // ==================================================

      if (walletRes.ok) {
        const walletBalance = Number(
          walletData.walletBalance ??
          walletData.pkrBalance ??
          walletData.availablePkr ??
          0
        );

        const usdtBalance = Number(
          walletData.usdtBalance ??
          walletData.availableUsdt ??
          0
        );

        setWallet({
          walletBalance: Number.isFinite(walletBalance)
            ? walletBalance
            : 0,

          usdtBalance: Number.isFinite(usdtBalance)
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
      // USDT PRICE
      // ==================================================

      if (rateRes.ok) {
        const buyRate = Number(
          rateData.buyRate ??
          rateData.buyPrice ??
          285
        );

        const sellRate = Number(
          rateData.sellRate ??
          rateData.sellPrice ??
          280
        );

        const tradingEnabled =
          rateData.tradingEnabled ??
          rateData.usdtTradingEnabled ??
          true;

        const marketStatus =
          String(
            rateData.marketStatus ||
              "OPEN"
          ).toUpperCase() === "CLOSED"
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
              : 280,

          tradingEnabled:
            Boolean(tradingEnabled),

          marketStatus,
        });
      } else {
        console.error(
          "USDT Price API Error:",
          rateData
        );
      }

      // ==================================================
      // HISTORY
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
        "USDT Buy Load Error:",
        error
      );

      setErrorMessage(
        "Unable to load USDT trading data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // INITIAL AUTH + LOAD
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
  // LOAD AFTER TOKEN IS SET
  // ====================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    loadData();
  }, [token]);
    // ====================================================
  // CALCULATIONS
  // ====================================================

  const safeUsdtAmount =
    Number.isFinite(usdtAmount) &&
    usdtAmount > 0
      ? usdtAmount
      : 0;

  const safeBuyRate =
    Number.isFinite(market.buyRate) &&
    market.buyRate > 0
      ? market.buyRate
      : 0;

  const totalPkr = useMemo(() => {
    const total =
      safeUsdtAmount * safeBuyRate;

    return Number.isFinite(total)
      ? total
      : 0;
  }, [safeUsdtAmount, safeBuyRate]);

  const enoughBalance =
    wallet.walletBalance >= totalPkr &&
    totalPkr > 0;

  const marketOpen =
    market.marketStatus === "OPEN";

  const tradingAvailable =
    market.tradingEnabled &&
    marketOpen;

  // ====================================================
  // FILTER HISTORY
  // ====================================================

  const filteredHistory = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    if (!search) {
      return history;
    }

    return history.filter((item) => {
      const usdt =
        Number(item.usdtAmount || 0)
          .toString()
          .toLowerCase();

      const pkr =
        Number(item.pkrAmount || 0)
          .toString()
          .toLowerCase();

      const rate =
        Number(item.rate || 0)
          .toString()
          .toLowerCase();

      const date =
        item.createdAt
          ? new Date(item.createdAt)
              .toLocaleDateString()
              .toLowerCase()
          : "";

      return (
        usdt.includes(search) ||
        pkr.includes(search) ||
        rate.includes(search) ||
        date.includes(search)
      );
    });
  }, [history, searchTerm]);

  // ====================================================
  // HISTORY STATISTICS
  // ====================================================

  const totalPurchasedUsdt = useMemo(() => {
    return history.reduce(
      (sum, item) =>
        sum + Number(item.usdtAmount || 0),
      0
    );
  }, [history]);

  const totalSpentPkr = useMemo(() => {
    return history.reduce(
      (sum, item) =>
        sum + Number(item.pkrAmount || 0),
      0
    );
  }, [history]);

  const walletUsdtValue =
    wallet.usdtBalance * safeBuyRate;

  // ====================================================
  // MARKET VALIDATION
  // ====================================================

  const canBuyUsdt = () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!market.tradingEnabled) {
      setErrorMessage(
        "USDT trading is currently disabled by admin."
      );
      return false;
    }

    if (market.marketStatus !== "OPEN") {
      setErrorMessage(
        "USDT market is currently closed."
      );
      return false;
    }

    if (
      !Number.isFinite(usdtAmount) ||
      usdtAmount < 1
    ) {
      setErrorMessage(
        "Minimum purchase amount is 1 USDT."
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

    if (!enoughBalance) {
      setErrorMessage(
        "Insufficient PKR wallet balance."
      );
      return false;
    }

    return true;
  };

  // ====================================================
  // BUY USDT
  // ====================================================

  const buyUsdt = async () => {
    if (!canBuyUsdt()) {
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
              usdtAmount.toFixed(8)
            ),
          }),
        }
      );

      const data = await response
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

        await loadData();
      } else {
        setErrorMessage(
          data.message ||
            "USDT purchase failed."
        );
      }
    } catch (error) {
      console.error(
        "USDT Purchase Error:",
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
  // AMOUNT CHANGE
  // ====================================================

  const handleAmountChange = (
    value: string
  ) => {
    if (value === "") {
      setUsdtAmount(0);
      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      setUsdtAmount(0);
      return;
    }

    setUsdtAmount(numericValue);

    setErrorMessage("");
    setSuccessMessage("");
  };
    // ====================================================
  // LOADING SCREEN
  // ====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-blue-400">
        <RefreshCw
          className="animate-spin mr-3"
          size={26}
        />

        Loading USDT Buy Page...
      </main>
    );
  }

  // ====================================================
  // UI
  // ====================================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-blue-400">
              <DollarSign size={38} />

              Buy USDT
            </h1>

            <p className="text-gray-400 mt-2">
              Purchase USDT directly from your PKR wallet.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link
              href="/usdt"
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />

              USDT Dashboard
            </Link>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>
        </header>

        {/* ================= ERROR ================= */}

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

        {/* ================= SUCCESS ================= */}

        {successMessage && (
          <section className="bg-green-950 border border-green-500 rounded-2xl p-5">
            <div className="flex items-start gap-3 text-green-300">
              <CheckCircle
                size={24}
                className="mt-0.5 shrink-0"
              />

              <div>
                <h3 className="font-bold text-lg">
                  Purchase Successful
                </h3>

                <p className="mt-1">
                  {successMessage}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ================= TRADING STATUS ================= */}

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
                  ? "USDT Buying Enabled"
                  : "USDT Buying Unavailable"}
              </h2>

              <p className="text-gray-300 mt-2">
                {market.tradingEnabled
                  ? marketOpen
                    ? "You can purchase USDT using your PKR wallet."
                    : "USDT market is currently closed."
                  : "Buying has been disabled by the administrator."}
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

        {/* ================= WALLET CARDS ================= */}

        <section className="grid md:grid-cols-2 gap-5">

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Wallet
                className="text-green-400"
                size={28}
              />

              <h2 className="text-xl font-bold text-green-400">
                PKR Wallet Balance
              </h2>
            </div>

            <h3 className="text-3xl font-black">
              PKR{" "}
              {wallet.walletBalance.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 2,
                }
              )}
            </h3>

            <p className="text-sm text-gray-400 mt-2">
              Available balance for USDT purchase.
            </p>
          </div>

          <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <DollarSign
                className="text-blue-400"
                size={28}
              />

              <h2 className="text-xl font-bold text-blue-400">
                USDT Wallet Balance
              </h2>
            </div>

            <h3 className="text-3xl font-black">
              {wallet.usdtBalance.toFixed(2)} USDT
            </h3>

            <p className="text-sm text-gray-400 mt-2">
              Current USDT available in your wallet.
            </p>
          </div>

        </section>

        {/* ================= LIVE BUY RATE ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp
              className="text-cyan-400"
              size={28}
            />

            <h2 className="text-2xl font-black text-cyan-400">
              Live Buy Rate
            </h2>
          </div>

          <h3 className="text-5xl font-black text-cyan-400">
            PKR{" "}
            {market.buyRate.toLocaleString(
              undefined,
              {
                maximumFractionDigits: 4,
              }
            )}
          </h3>

          <p className="text-gray-400 mt-3">
            Current purchase price of 1 USDT.
          </p>
        </section>
                {/* ================= BUY FORM ================= */}

        <section className="bg-zinc-900 border border-blue-500 rounded-2xl p-6 space-y-5">

          <h2 className="text-2xl font-black text-blue-400">
            Buy USDT
          </h2>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Enter USDT Amount
            </label>

            <input
              type="number"
              min={1}
              step="0.01"
              value={
                usdtAmount === 0
                  ? ""
                  : usdtAmount
              }
              onChange={(e) =>
                handleAmountChange(
                  e.target.value
                )
              }
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-lg outline-none focus:border-blue-500"
              placeholder="Enter USDT amount"
            />
          </div>

          {/* Cost Calculation */}

          <div className="bg-zinc-800 rounded-xl p-5 space-y-3">

            <div className="flex justify-between">
              <span className="text-gray-400">
                Buy Rate
              </span>

              <span className="text-cyan-400 font-bold">
                PKR {market.buyRate}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">
                USDT Amount
              </span>

              <span className="text-blue-400 font-bold">
                {safeUsdtAmount.toFixed(2)} USDT
              </span>
            </div>

            <hr className="border-zinc-700" />

            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">
                Total PKR Required
              </span>

              <span className="text-3xl font-black text-green-400">
                PKR{" "}
                {totalPkr.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
            </div>

          </div>

          {/* Balance Check */}

          <div
            className={`rounded-xl p-4 border ${
              enoughBalance
                ? "bg-green-950 border-green-500"
                : "bg-red-950 border-red-500"
            }`}
          >
            {enoughBalance ? (
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle size={22} />

                <span className="font-semibold">
                  Sufficient PKR balance available.
                </span>
              </div>
            ) : (
              <div className="text-red-400 font-semibold">
                Insufficient PKR Wallet Balance.
              </div>
            )}
          </div>

          {/* Buy Button */}

          <button
            type="button"
            disabled={
              buyLoading ||
              !tradingAvailable ||
              !enoughBalance ||
              safeUsdtAmount < 1
            }
            onClick={buyUsdt}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-gray-400 py-4 rounded-xl text-lg font-bold transition"
          >
            {buyLoading
              ? "Processing Purchase..."
              : !market.tradingEnabled
              ? "USDT Trading Disabled"
              : !marketOpen
              ? "Market Closed"
              : !enoughBalance
              ? "Insufficient PKR Balance"
              : "Buy USDT Now"}
          </button>

        </section>

        {/* ================= PURCHASE SUMMARY ================= */}

        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-purple-400 mb-5">
            Purchase Summary
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">
                Buying
              </p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {safeUsdtAmount.toFixed(2)} USDT
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">
                Buy Rate
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR {market.buyRate}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-yellow-500">
              <p className="text-gray-400 text-sm">
                Total Cost
              </p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                PKR{" "}
                {totalPkr.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>
            </div>

          </div>
        </section>

        {/* ================= QUICK BUY BUTTONS ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            Quick Buy
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

            {[25, 50, 100, 250].map(
              (amount) => (
                <button
                  type="button"
                  key={amount}
                  onClick={() =>
                    setUsdtAmount(amount)
                  }
                  className={`rounded-xl p-4 font-bold transition ${
                    usdtAmount === amount
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-gray-300"
                  }`}
                >
                  {amount} USDT
                </button>
              )
            )}

          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">

            {[500, 1000, 2500, 5000].map(
              (amount) => (
                <button
                  type="button"
                  key={amount}
                  onClick={() =>
                    setUsdtAmount(amount)
                  }
                  className={`rounded-xl p-4 font-bold transition ${
                    usdtAmount === amount
                      ? "bg-green-600 text-white"
                      : "bg-zinc-800 hover:bg-zinc-700 text-gray-300"
                  }`}
                >
                  {amount} USDT
                </button>
              )
            )}

          </div>
        </section>
                {/* ================= RECENT BUY HISTORY ================= */}

        <section className="bg-zinc-900 border border-blue-500 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
            <h2 className="text-2xl font-black text-blue-400">
              Recent USDT Purchases
            </h2>

            <button
              type="button"
              onClick={loadData}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No USDT purchases found.
            </div>
          ) : (
            <div className="space-y-4">

              {history
                .slice(0, 5)
                .map((item) => (
                  <div
                    key={item._id}
                    className="bg-black border border-zinc-700 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-green-400 font-bold">
                        <CheckCircle size={18} />

                        BUY USDT
                      </div>

                      <p className="text-gray-400 text-sm mt-2">
                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleString()
                          : "N/A"}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-gray-400 text-sm">
                        Purchased
                      </p>

                      <h3 className="text-2xl font-black text-blue-400">
                        {Number(
                          item.usdtAmount || 0
                        ).toFixed(2)}{" "}
                        USDT
                      </h3>
                    </div>

                    <div className="text-center">
                      <p className="text-gray-400 text-sm">
                        Paid
                      </p>

                      <h3 className="text-2xl font-black text-green-400">
                        PKR{" "}
                        {Number(
                          item.pkrAmount || 0
                        ).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 2,
                          }
                        )}
                      </h3>
                    </div>

                    <div className="text-center">
                      <p className="text-gray-400 text-sm">
                        Rate
                      </p>

                      <h3 className="text-xl font-bold text-yellow-400">
                        PKR{" "}
                        {Number(
                          item.rate || 0
                        ).toLocaleString(
                          undefined,
                          {
                            maximumFractionDigits: 4,
                          }
                        )}
                      </h3>
                    </div>
                  </div>
                ))}

            </div>
          )}
        </section>

        {/* ================= BUY HISTORY STATISTICS ================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-green-400 mb-5">
            Purchase Statistics
          </h2>

          <div className="grid md:grid-cols-4 gap-5">

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">
                Total Purchases
              </p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {history.length}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">
                Total USDT Bought
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                {totalPurchasedUsdt.toFixed(2)}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-yellow-500">
              <p className="text-gray-400 text-sm">
                Total PKR Spent
              </p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                PKR{" "}
                {totalSpentPkr.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-purple-500">
              <p className="text-gray-400 text-sm">
                Wallet USDT Value
              </p>

              <h3 className="text-3xl font-black text-purple-400 mt-2">
                PKR{" "}
                {walletUsdtValue.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>
            </div>

          </div>
        </section>

        {/* ================= SEARCH HISTORY ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-5">

            <h2 className="text-2xl font-black text-cyan-400">
              Complete Buy History
            </h2>

            <input
              type="text"
              value={searchTerm}
              placeholder="Search by date or amount..."
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 w-full md:w-80 outline-none focus:border-cyan-500"
            />

          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-zinc-700 text-cyan-400">
                  <th className="p-3">#</th>
                  <th className="p-3">USDT</th>
                  <th className="p-3">Rate</th>
                  <th className="p-3">PKR Paid</th>
                  <th className="p-3">
                    Purchase Date
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-6 text-center text-gray-500"
                    >
                      No purchase history found.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(
                    (item, index) => (
                      <tr
                        key={item._id}
                        className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                      >

                        <td className="p-3 text-gray-400">
                          {index + 1}
                        </td>

                        <td className="p-3 text-blue-400 font-bold">
                          {Number(
                            item.usdtAmount || 0
                          ).toFixed(2)}{" "}
                          USDT
                        </td>

                        <td className="p-3 text-yellow-400 font-semibold">
                          PKR{" "}
                          {Number(
                            item.rate || 0
                          ).toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 4,
                            }
                          )}
                        </td>

                        <td className="p-3 text-green-400 font-semibold">
                          PKR{" "}
                          {Number(
                            item.pkrAmount || 0
                          ).toLocaleString(
                            undefined,
                            {
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>

                        <td className="p-3 text-gray-400 whitespace-nowrap">
                          {item.createdAt
                            ? new Date(
                                item.createdAt
                              ).toLocaleString()
                            : "N/A"}
                        </td>

                      </tr>
                    )
                  )
                )}

              </tbody>

            </table>
          </div>
        </section>
                {/* ================= BUY VALIDATION CARD ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Purchase Validation
          </h2>

          <div className="space-y-4">

            {/* Wallet Balance */}

            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700 gap-4">
              <span className="text-gray-400">
                PKR Wallet Balance
              </span>

              <span className="text-green-400 font-bold text-lg">
                PKR{" "}
                {wallet.walletBalance.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
            </div>

            {/* Total Required */}

            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700 gap-4">
              <span className="text-gray-400">
                Total Required
              </span>

              <span className="text-blue-400 font-bold text-lg">
                PKR{" "}
                {totalPkr.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
            </div>

            {/* Remaining Balance */}

            <div className="flex items-center justify-between bg-black rounded-xl p-4 border border-zinc-700 gap-4">
              <span className="text-gray-400">
                Remaining Balance After Purchase
              </span>

              <span
                className={`font-bold text-lg ${
                  wallet.walletBalance -
                    totalPkr >=
                  0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                PKR{" "}
                {(
                  wallet.walletBalance -
                  totalPkr
                ).toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </span>
            </div>

          </div>

          {/* Validation Status */}

          <div
            className={`mt-6 rounded-xl p-5 border ${
              enoughBalance &&
              tradingAvailable &&
              safeUsdtAmount >= 1
                ? "bg-green-950 border-green-500"
                : "bg-red-950 border-red-500"
            }`}
          >
            {enoughBalance &&
            tradingAvailable &&
            safeUsdtAmount >= 1 ? (
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle size={24} />

                <div>
                  <p className="font-bold text-lg">
                    Purchase Allowed
                  </p>

                  <p className="text-sm text-gray-300">
                    You have enough PKR balance and
                    USDT trading is available.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-red-400">
                <p className="font-bold text-lg">
                  Purchase Blocked
                </p>

                <p className="text-sm text-gray-300 mt-1">
                  {!tradingAvailable
                    ? "USDT trading is currently unavailable."
                    : safeUsdtAmount < 1
                    ? "Minimum purchase amount is 1 USDT."
                    : "Your PKR wallet balance is lower than the required amount."}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ================= SUCCESS INFO CARD ================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-green-400 mb-5">
            What Happens After Buying?
          </h2>

          <div className="space-y-4">

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={22}
              />

              <div>
                <p className="font-semibold text-white">
                  PKR Wallet Deduction
                </p>

                <p className="text-gray-400 text-sm">
                  The required PKR amount is automatically deducted from your PKR wallet after a successful purchase.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={22}
              />

              <div>
                <p className="font-semibold text-white">
                  USDT Wallet Credit
                </p>

                <p className="text-gray-400 text-sm">
                  Purchased USDT is credited to your USDT wallet after successful confirmation.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={22}
              />

              <div>
                <p className="font-semibold text-white">
                  Transaction History Updated
                </p>

                <p className="text-gray-400 text-sm">
                  Every purchase appears in your USDT transaction history.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={22}
              />

              <div>
                <p className="font-semibold text-white">
                  Portfolio Updated
                </p>

                <p className="text-gray-400 text-sm">
                  Your wallet and portfolio data refresh after the purchase.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ================= TRADING RULES ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            USDT Buying Rules
          </h2>

          <div className="space-y-4 text-gray-300">

            <div className="flex justify-between border-b border-zinc-800 pb-3 gap-4">
              <span>Minimum Buy</span>

              <span className="text-cyan-400 font-bold">
                1 USDT
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3 gap-4">
              <span>Maximum Buy</span>

              <span className="text-cyan-400 font-bold">
                Wallet Balance Limit
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3 gap-4">
              <span>Payment Source</span>

              <span className="text-cyan-400 font-bold">
                PKR Wallet
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-800 pb-3 gap-4">
              <span>Wallet Credit Time</span>

              <span className="text-cyan-400 font-bold">
                Instant
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>Trading Status</span>

              <span
                className={`font-bold ${
                  tradingAvailable
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {tradingAvailable
                  ? "Enabled"
                  : "Unavailable"}
              </span>
            </div>

          </div>
        </section>

        {/* ================= WALLET SUMMARY ================= */}

        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-purple-400 mb-5">
            Wallet Summary After Purchase
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">
                Current PKR Wallet
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR{" "}
                {wallet.walletBalance.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-red-500">
              <p className="text-gray-400 text-sm">
                Remaining After Buy
              </p>

              <h3
                className={`text-3xl font-black mt-2 ${
                  wallet.walletBalance -
                    totalPkr >=
                  0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                PKR{" "}
                {(
                  wallet.walletBalance -
                  totalPkr
                ).toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">
                New USDT Balance
              </p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {(
                  wallet.usdtBalance +
                  safeUsdtAmount
                ).toFixed(2)}{" "}
                USDT
              </h3>
            </div>

          </div>
        </section>

        {/* ================= MARKET INFORMATION ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            Live Market Information
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black rounded-xl p-5 border border-cyan-500">
              <p className="text-gray-400 text-sm">
                Buy Price
              </p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                PKR {market.buyRate}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">
                Purchase Amount
              </p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {safeUsdtAmount.toFixed(2)} USDT
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">
                Purchase Value
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR{" "}
                {totalPkr.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>
            </div>

          </div>
        </section>
                {/* ================= SECURITY NOTICE ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Trading Security
          </h2>

          <div className="space-y-3 text-gray-300">

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={20}
              />

              <p>
                USDT purchases are recorded in transaction history after successful confirmation.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={20}
              />

              <p>
                PKR wallet balance is deducted automatically after a successful purchase.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={20}
              />

              <p>
                USDT wallet balance updates after successful purchase confirmation.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-400 mt-1"
                size={20}
              />

              <p>
                Trade records remain available in your GoldTrade account history.
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}