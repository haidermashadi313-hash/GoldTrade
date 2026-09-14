"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// ==========================================
// GOLDTRADE V18 API CONFIG
// ==========================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// ==========================================
// TYPES
// ==========================================

interface GoldPrice {
  buyPrice: number;
  sellPrice: number;
  goldPriceUSD: number;
  usdToPkr: number;
  tradingEnabled: boolean;
  marketStatus: string;
}

interface Portfolio {
  goldBalance: number;
  walletBalance: number;
  averageBuyPrice: number;
  currentPrice: number;
  portfolioValue: number;
  liveProfit: number;
  totalProfitLoss: number;
  totalGoldBuy: number;
  totalGoldSell: number;
}

const GoldBuyPage: React.FC = () => {
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
    usdToPkr: 0,
    tradingEnabled: true,
    marketStatus: "OPEN",
  });

  // ==========================================
  // PORTFOLIO
  // ==========================================

  const [portfolio, setPortfolio] = useState<Portfolio>({
    goldBalance: 0,
    walletBalance: 0,
    averageBuyPrice: 0,
    currentPrice: 0,
    portfolioValue: 0,
    liveProfit: 0,
    totalProfitLoss: 0,
    totalGoldBuy: 0,
    totalGoldSell: 0,
  });

  // ==========================================
  // BUY STATES
  // ==========================================

  const [grams, setGrams] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // Buy Confirmation Modal
  const [showConfirm, setShowConfirm] = useState(false);

  // ==========================================
  // LOAD USER FROM LOCAL STORAGE
  // ==========================================

  useEffect(() => {
    const savedUsername = localStorage.getItem("username") || "";
    const savedToken = localStorage.getItem("token") || "";

    setUsername(savedUsername);
    setToken(savedToken);
  }, []);

  // ==========================================
  // FETCH LIVE GOLD PRICE + PORTFOLIO
  // ==========================================

  const fetchPortfolio = async () => {
    try {
      setLoading(true);

      // -------------------------
      // LIVE GOLD PRICE
      // -------------------------

      const priceRes = await axios.get(`${API}/api/gold/price`);

      if (priceRes.data.success) {
        setGoldPrice(priceRes.data.data);
      }

      // -------------------------
      // JWT CHECK
      // -------------------------

      if (!token) {
        console.log("JWT not found. Portfolio skipped.");
        return;
      }

      // -------------------------
      // USER PORTFOLIO
      // -------------------------

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
        "BUY PAGE ERROR:",
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

  // ==========================================
  // AUTO LOAD PAGE
  // ==========================================

  useEffect(() => {
    if (!token) return;

    fetchPortfolio();
  }, [token]);

  // ==========================================
  // AUTO REFRESH EVERY 30 SECONDS
  // ==========================================

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      fetchPortfolio();
    }, 30000);

    return () => clearInterval(interval);
  }, [token]);

  // ==========================================
  // CLEAR MESSAGE AFTER 4 SECONDS
  // ==========================================

  useEffect(() => {
    if (!message) return;

    const timeout = setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => clearTimeout(timeout);
  }, [message]);

    // ==========================================
  // LIVE BUY CALCULATIONS
  // ==========================================

  const buyValue = useMemo(() => {
    const qty = Number(grams);

    if (!qty || qty <= 0) return 0;

    return qty * goldPrice.buyPrice;
  }, [grams, goldPrice.buyPrice]);

  const remainingWallet = useMemo(() => {
    return Math.max(portfolio.walletBalance - buyValue, 0);
  }, [portfolio.walletBalance, buyValue]);

  const newGoldBalance = useMemo(() => {
    return portfolio.goldBalance + Number(grams || 0);
  }, [portfolio.goldBalance, grams]);

  const newAveragePrice = useMemo(() => {
    const qty = Number(grams);

    if (!qty || qty <= 0) return portfolio.averageBuyPrice;

    if (portfolio.goldBalance === 0) {
      return goldPrice.buyPrice;
    }

    const totalCost =
      portfolio.goldBalance * portfolio.averageBuyPrice +
      qty * goldPrice.buyPrice;

    const totalGold = portfolio.goldBalance + qty;

    return totalCost / totalGold;
  }, [grams, portfolio, goldPrice.buyPrice]);

  // ==========================================
  // QUICK GRAM BUTTONS
  // ==========================================

  const quickGrams = [
    0.1,
    0.25,
    0.5,
    1,
    2,
    5,
    10,
  ];

  const selectGram = (value: number) => {
    setGrams(value.toString());
  };

  // ==========================================
  // OPEN BUY CONFIRMATION
  // ==========================================

  const openConfirmation = () => {
    if (!goldPrice.tradingEnabled) {
      setMessage("Gold trading is currently closed.");
      setMessageType("error");
      return;
    }

    const qty = Number(grams);

    if (!qty || qty <= 0) {
      setMessage("Please enter valid gold grams.");
      setMessageType("error");
      return;
    }

    if (buyValue > portfolio.walletBalance) {
      setMessage("Insufficient PKR Wallet Balance.");
      setMessageType("error");
      return;
    }

    setShowConfirm(true);
  };

  // ==========================================
  // BUY GOLD API
  // ==========================================

  const buyGold = async () => {
    try {
      setProcessing(true);
      setShowConfirm(false);

      const qty = Number(grams);

      const response = await axios.post(
        `${API}/api/gold/buy`,
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
        setMessage("Gold purchased successfully.");
        setMessageType("success");

        setGrams("");

        await fetchPortfolio();
      } else {
        setMessage(response.data.message);
        setMessageType("error");
      }

    } catch (error: any) {
      console.error("BUY GOLD ERROR:", error);

      setMessage(
        error.response?.data?.message || "Gold purchase failed."
      );

      setMessageType("error");

    } finally {
      setProcessing(false);
    }
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
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />

          <h2 className="text-green-400 text-3xl font-black">
            GOLDTRADE V18
          </h2>

          <p className="text-gray-400 mt-2">
            Loading Buy Gold Page...
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
          <h1 className="text-4xl font-black text-green-400">
            BUY GOLD
          </h1>

          <p className="text-gray-400 mt-2">
            Purchase Gold instantly using your PKR Wallet.
          </p>
        </div>

        <button
          onClick={fetchPortfolio}
          className="bg-green-600 hover:bg-green-500 text-white font-bold px-5 py-3 rounded-xl transition-all duration-300 hover:scale-105"
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
        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Buy Price</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR {goldPrice.buyPrice.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Sell Price</p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            PKR {goldPrice.sellPrice.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Market Status</p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {goldPrice.marketStatus}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Trading</p>

          <h2 className="text-3xl font-black text-cyan-400 mt-2">
            {goldPrice.tradingEnabled ? "OPEN" : "CLOSED"}
          </h2>
        </div>
      </div>

      {/* PORTFOLIO SUMMARY */}

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Gold Balance</p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {portfolio.goldBalance.toFixed(3)} g
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Wallet Balance</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR {portfolio.walletBalance.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Average Buy Price</p>

          <h2 className="text-3xl font-black text-blue-400 mt-2">
            PKR {portfolio.averageBuyPrice.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* BUY PANEL */}

      <div className="bg-zinc-900 border border-green-500 rounded-3xl p-8 mb-10">
        <h2 className="text-3xl font-black text-green-400 mb-6">
          Gold Buying Panel
        </h2>

        <label className="block text-gray-300 mb-2">
          Gold Quantity (Grams)
        </label>

        <input
          type="number"
          value={grams}
          onChange={handleGramInput}
          placeholder="Enter grams to buy..."
          className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-4 text-white outline-none focus:border-green-500 mb-5"
        />

        {/* QUICK GRAM BUTTONS */}

        <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-6">
          {quickGrams.map((item) => (
            <button
              key={item}
              onClick={() => selectGram(item)}
              className={`rounded-xl py-3 font-bold transition ${
                grams === item.toString()
                  ? "bg-green-500 text-black"
                  : "bg-zinc-800 hover:bg-green-700"
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
            <span className="text-gray-400">Live Buy Price</span>

            <span className="text-green-400 font-bold">
              PKR {goldPrice.buyPrice.toLocaleString()}
            </span>
          </div>

          <div className="border-t border-zinc-700 pt-4 flex justify-between text-lg">
            <span>Total Purchase Cost</span>

            <span className="text-green-400 font-black">
              PKR {buyValue.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-lg">
            <span>Wallet After Purchase</span>

            <span className="text-yellow-400 font-black">
              PKR {remainingWallet.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between text-lg">
            <span>Gold Balance After Buy</span>

            <span className="text-yellow-400 font-black">
              {newGoldBalance.toFixed(3)} g
            </span>
          </div>

          <div className="flex justify-between text-lg">
            <span>New Average Buy Price</span>

            <span className="text-blue-400 font-black">
              PKR {Math.round(newAveragePrice).toLocaleString()}
            </span>
          </div>
        </div>

        <button
          onClick={openConfirmation}
          disabled={processing || !goldPrice.tradingEnabled}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black text-xl py-4 rounded-2xl transition-all duration-300"
        >
          {processing ? "Processing..." : "BUY GOLD NOW"}
        </button>
      </div>

      {/* CONFIRMATION MODAL */}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-zinc-900 border border-green-500 rounded-3xl w-full max-w-md p-6">
            <h2 className="text-2xl font-black text-green-400 mb-4">
              Confirm Gold Purchase
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Quantity</span>

                <span>{grams} g</span>
              </div>

              <div className="flex justify-between">
                <span>Price / Gram</span>

                <span>PKR {goldPrice.buyPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-green-400 font-bold text-lg">
                <span>Total Cost</span>

                <span>PKR {buyValue.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 py-3 rounded-xl font-bold"
              >
                Cancel
              </button>

              <button
                onClick={buyGold}
                className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold"
              >
                Confirm Buy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}

      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        <p className="font-semibold text-green-400 mb-2 text-lg">
          GoldTrade Enterprise V18
        </p>

        <p>Buy Gold Module • Secure JWT • Live Gold Market</p>

        <p className="mt-2">
          Powered by GoldTrade Enterprise Backend API
        </p>
      </div>

    </div>
  );
};

export default GoldBuyPage;