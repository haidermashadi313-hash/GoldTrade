"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// ==========================================
// GoldTrade V18 API CONFIG
// ==========================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==========================================
// TYPES
// ==========================================

interface GoldPrice {
  buyPrice: number;
  sellPrice: number;
  goldPriceUSD: number;
  UsdtoPkr: number;
  tradingEnabled: boolean;
  marketStatus: string;
}

interface Portfolio {
  goldBalance: number;
  WalletBalance: number;
  averagebuyPrice: number;
  currentPrice: number;
  portfolioValue: number;
  liveProfit: number;
  totalProfitLoss: number;
  totalGoldbuy: number;
  totalGoldsell: number;
}

const GoldsellPage: React.FC = () => {
  // ==========================================
  // USER STATES
  // ==========================================

  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");

  // ==========================================
  // GOLD PRICE
  // ==========================================

  const [goldPrice, setGoldPrice] = useState<GoldPrice>({
    buyPrice: 0,
    sellPrice: 0,
    goldPriceUSD: 0,
    UsdtoPkr: 0,
    tradingEnabled: true,
    marketStatus: "OPEN",
  });

  // ==========================================
  // PORTFOLIO
  // ==========================================

  const [portfolio, setPortfolio] = useState<Portfolio>({
    goldBalance: 0,
    WalletBalance: 0,
    averagebuyPrice: 0,
    currentPrice: 0,
    portfolioValue: 0,
    liveProfit: 0,
    totalProfitLoss: 0,
    totalGoldbuy: 0,
    totalGoldsell: 0,
  });

  // ==========================================
  // sell STATES
  // ==========================================

  const [grams, setGrams] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [showConfirm, setShowConfirm] = useState(false);

  // ==========================================
  // LOAD USER + JWT
  // ==========================================

  useEffect(() => {
    const savedUsername = localStorage.getItem("username") || "";
    const savedToken = localStorage.getItem("token") || "";

    setUsername(savedUsername);
    setToken(savedToken);
  }, []);

  // ==========================================
  // FETCH LIVE DATA
  // ==========================================

  const fetchPortfolio = async () => {
    try {
      setLoading(true);

      // Gold Price
      const priceRes = await axios.get(`${API}/api/gold/price`);

      if (priceRes.data.success) {
        setGoldPrice(priceRes.data.data);
      }

      // JWT Required
      if (!token) return;

      const portfolioRes = await axios.get(`${API}/api/gold/portfolio`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (portfolioRes.data.success) {
        setPortfolio(portfolioRes.data.portfolio);
      }
    } catch (error: any) {
      console.error(
        "sell PAGE ERROR:",
        error.response?.data || error.message
      );

      setMessage(
        error.response?.data?.message ||
          "Unable to connect with GoldTrade Server."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchPortfolio();
  }, [token]);

  // Auto Refresh Every 30 Seconds

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchPortfolio();
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  // Auto Clear Messages

  useEffect(() => {
    if (!message) return;

    const timeout = setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => clearTimeout(timeout);
  }, [message]);

    // ==========================================
  // LIVE sell CALCULATIONS
  // ==========================================

  const sellValue = useMemo(() => {
    const qty = Number(grams);

    if (!qty || qty <= 0) return 0;

    return qty * goldPrice.sellPrice;
  }, [grams, goldPrice.sellPrice]);

  // Estimated Profit / Loss

  const estimatedProfit = useMemo(() => {
    const qty = Number(grams);

    if (!qty || qty <= 0) return 0;

    return qty * (goldPrice.sellPrice - portfolio.averagebuyPrice);
  }, [grams, goldPrice.sellPrice, portfolio.averagebuyPrice]);

  // Wallet After selling

  const WalletAftersell = useMemo(() => {
    return portfolio.WalletBalance + sellValue;
  }, [portfolio.WalletBalance, sellValue]);

  // Remaining Gold

  const remainingGold = useMemo(() => {
    const qty = Number(grams);

    return Math.max(portfolio.goldBalance - qty, 0);
  }, [portfolio.goldBalance, grams]);

  // ==========================================
  // QUICK GRAM BUTTONS
  // ==========================================

  const quickGrams = [0.1, 0.25, 0.5, 1, 2, 5, 10];

  const selectGram = (value: number) => {
    setGrams(value.toString());
  };

  // ==========================================
  // INPUT VALIDATION
  // ==========================================

  const handleGramInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;

    if (value === "") {
      setGrams("");
      return;
    }

    const qty = Number(value);

    if (qty < 0) return;

    setGrams(value);
  };

  // ==========================================
  // OPEN CONFIRMATION MODAL
  // ==========================================

  const openConfirmation = () => {
    const qty = Number(grams);

    if (!goldPrice.tradingEnabled) {
      setMessage("Gold trading is currently closed.");
      setMessageType("error");
      return;
    }

    if (!qty || qty <= 0) {
      setMessage("Please enter valid gold grams.");
      setMessageType("error");
      return;
    }

    if (qty > portfolio.goldBalance) {
      setMessage("Insufficient Gold Balance.");
      setMessageType("error");
      return;
    }

    setShowConfirm(true);
  };

  // ==========================================
  // sell GOLD API (JWT SECURE)
  // ==========================================

  const sellGold = async () => {
    try {
      setProcessing(true);
      setShowConfirm(false);

      const qty = Number(grams);

      const response = await axios.post(
        `${API}/api/gold/sell`,
        {
          grams: qty,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage("Gold sold successfully.");
        setMessageType("success");

        setGrams("");

        await fetchPortfolio();
      } else {
        setMessage(response.data.message);
        setMessageType("error");
      }

    } catch (error: any) {
      console.error("sell GOLD ERROR:", error);

      setMessage(
        error.response?.data?.message || "Gold selling failed."
      );

      setMessageType("error");

    } finally {
      setProcessing(false);
    }
  };

    // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>

          <h2 className="text-red-400 text-3xl font-black">
            GoldTrade V18
          </h2>

          <p className="text-gray-400 mt-2">
            Loading sell Gold Page...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE UI
  // ==========================================

  return (
    <div className="min-h-screen bg-[#070707] text-white p-6">

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <div>
          <h1 className="text-4xl font-black text-red-400">
            sell GOLD
          </h1>

          <p className="text-gray-400 mt-2">
            sell your gold instantly into your Pkr Wallet.
          </p>
        </div>

        <button
          onClick={fetchPortfolio}
          className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-3 rounded-xl transition-all duration-300 hover:scale-105"
        >
          🔄 Refresh
        </button>

      </div>

      {/* SUCCESS / ERROR MESSAGE */}

      {message && (
        <div
          className={`mb-6 rounded-2xl p-4 font-semibold ${
            messageType === "success"
              ? "bg-green-600 text-white"
              : "bg-red-700 text-white"
          }`}
        >
          {message}
        </div>
      )}

      {/* LIVE MARKET */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">sell Price</p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            Pkr {goldPrice.sellPrice.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Average buy Price</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            Pkr {portfolio.averagebuyPrice.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Market Status</p>

          <h2 className="text-3xl font-black text-cyan-400 mt-2">
            {goldPrice.marketStatus}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Trading Status</p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {goldPrice.tradingEnabled ? "OPEN" : "CLOSED"}
          </h2>
        </div>

      </div>

      {/* PORTFOLIO SUMMARY */}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Gold Balance</p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {portfolio.goldBalance.toFixed(3)} g
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Wallet Balance</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            Pkr {portfolio.WalletBalance.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Portfolio Value</p>

          <h2 className="text-3xl font-black text-blue-400 mt-2">
            Pkr {portfolio.portfolioValue.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Realized Profit / Loss</p>

          <h2
            className={`text-3xl font-black mt-2 ${
              portfolio.totalProfitLoss >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            Pkr {portfolio.totalProfitLoss.toLocaleString()}
          </h2>
        </div>

      </div>

      {/* sell PANEL */}

      <div className="bg-zinc-900 border border-red-500 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-red-400 mb-6">
          Gold selling Panel
        </h2>

        <label className="block text-gray-300 mb-3">
          Gold Quantity (Grams)
        </label>

        <input
          type="number"
          value={grams}
          onChange={handleGramInput}
          placeholder="Enter grams to sell..."
          className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-4 text-white outline-none focus:border-red-500 mb-6"
        />

        {/* QUICK GRAM BUTTONS */}

        <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-6">
          {quickGrams.map((item) => (
            <button
              key={item}
              onClick={() => selectGram(item)}
              className={`rounded-xl py-3 font-bold transition-all duration-300 ${
                grams === item.toString()
                  ? "bg-red-500 text-white"
                  : "bg-zinc-800 hover:bg-red-700"
              }`}
            >
              {item}g
            </button>
          ))}
        </div>

        {/* LIVE CALCULATOR */}

        <div className="bg-black rounded-2xl p-5 border border-zinc-700 mb-6 space-y-4">

          <div className="flex justify-between">
            <span className="text-gray-400">Gold Quantity</span>

            <span className="text-yellow-400 font-bold">
              {grams || "0"} g
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">sell Price / Gram</span>

            <span className="text-red-400 font-bold">
              Pkr {goldPrice.sellPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Average buy Price</span>

            <span className="text-green-400 font-bold">
              Pkr {portfolio.averagebuyPrice.toLocaleString()}
            </span>
          </div>

          <div className="border-t border-zinc-700 pt-3 flex justify-between text-lg">
            <span>Total Receive Amount</span>

            <span className="text-yellow-400 font-black">
              Pkr {sellValue.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-lg">
            <span>Estimated Profit / Loss</span>

            <span
              className={`font-black ${
                estimatedProfit >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              Pkr {estimatedProfit.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-lg">
            <span>Wallet After selling</span>

            <span className="text-cyan-400 font-black">
              Pkr {WalletAftersell.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-lg">
            <span>Remaining Gold</span>

            <span className="text-yellow-400 font-black">
              {remainingGold.toFixed(3)} g
            </span>
          </div>

        </div>        {/* sell BUTTON */}

        <button
          onClick={openConfirmation}
          disabled={processing || !goldPrice.tradingEnabled}
          className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xl py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
        >
          {processing ? "Processing sell..." : "sell GOLD NOW"}
        </button>
      </div>

      {/* sell INFORMATION */}

      <div className="grid md:grid-cols-2 gap-6 mb-10">

        {/* sellING RULES */}

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">

          <h3 className="text-xl font-black text-red-400 mb-5">
            selling Rules
          </h3>

          <ul className="space-y-3 text-gray-300 text-sm">
            <li>• Gold is sold at the Live sell Price.</li>
            <li>• Pkr Wallet is credited instantly after selling.</li>
            <li>• Gold balance decreases immediately.</li>
            <li>• Profit/Loss is calculated automatically.</li>
            <li>• Every sell trade is saved in Gold history.</li>
            <li>• Trading must be OPEN to sell gold.</li>
          </ul>

        </div>

        {/* Wallet PREVIEW */}

        <div className="bg-zinc-900 border border-yellow-600 rounded-3xl p-6">

          <h3 className="text-xl font-black text-yellow-400 mb-5">
            Wallet Preview
          </h3>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span className="text-gray-400">Current Wallet</span>

              <span className="text-green-400 font-bold">
                Pkr {portfolio.WalletBalance.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Receive Amount</span>

              <span className="text-yellow-400 font-bold">
                + Pkr {sellValue.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-t border-zinc-700 pt-3">
              <span className="text-gray-400">Wallet After sell</span>

              <span className="text-cyan-400 font-black">
                Pkr {WalletAftersell.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Remaining Gold Balance</span>

              <span className="text-yellow-400 font-bold">
                {remainingGold.toFixed(3)} g
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Profit / Loss</span>

              <span
                className={`font-bold ${
                  estimatedProfit >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                Pkr {estimatedProfit.toLocaleString()}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* sell CONFIRMATION MODAL */}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">

          <div className="bg-zinc-900 border border-red-500 rounded-3xl w-full max-w-md p-6">

            <h2 className="text-2xl font-black text-red-400 mb-5">
              Confirm Gold Sale
            </h2>

            <div className="space-y-3 text-gray-300">

              <div className="flex justify-between">
                <span>Gold Quantity</span>
                <span>{grams} g</span>
              </div>

              <div className="flex justify-between">
                <span>sell Price</span>
                <span>Pkr {goldPrice.sellPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Average buy Price</span>
                <span>Pkr {portfolio.averagebuyPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-yellow-400 font-bold text-lg border-t border-zinc-700 pt-3">
                <span>You Will Receive</span>
                <span>Pkr {sellValue.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Estimated Profit / Loss</span>

                <span
                  className={`font-bold ${
                    estimatedProfit >= 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  Pkr {estimatedProfit.toLocaleString()}
                </span>
              </div>

            </div>

            <div className="flex gap-4 mt-8">

              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 rounded-xl font-bold transition"
              >
                Cancel
              </button>

              <button
                onClick={sellGold}
                disabled={processing}
                className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold text-white transition disabled:opacity-50"
              >
                {processing ? "selling..." : "Confirm sell"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ENTERPRISE FOOTER */}

      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">

        <p className="font-semibold text-red-400 mb-2 text-lg">
          GoldTrade Enterprise V18
        </p>

        <p>
          sell Gold Module • Live Market • JWT Protected • Real-Time Portfolio
        </p>

        <p className="mt-2">
          Powered by GoldTrade Enterprise Backend API
        </p>

        <div className="mt-4 flex justify-center gap-6 flex-wrap text-xs">

          <span className="text-red-400">🔴 Live sell Market</span>

          <span className="text-yellow-400">🟡 Auto Refresh 30s</span>

          <span className="text-blue-400">🔒 Secure JWT Authentication</span>

          <span className="text-green-400">💰 Instant Wallet Credit</span>

        </div>

      </div>

    </div>
  );
};

export default GoldsellPage;