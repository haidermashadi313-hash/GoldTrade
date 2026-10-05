"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

// ==========================================
// GoldTrade V18 API CONFIG
// ==========================================

const API = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com"
).replace(/\/+$/, "");

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

// ==========================================
// PAGE
// ==========================================

const GoldbuyPage: React.FC = () => {
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
  // BUY STATES
  // ==========================================

  const [grams, setGrams] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  // ==========================================
  // BUY CONFIRMATION MODAL
  // ==========================================

  const [showConfirm, setShowConfirm] = useState(false);

  // ==========================================
  // LOAD USER FROM LOCAL STORAGE
  // ==========================================

  useEffect(() => {
    const savedUsername =
      localStorage.getItem("goldtrade_username") ||
      localStorage.getItem("username") ||
      "";

    const savedToken =
      localStorage.getItem("goldtrade_token") ||
      localStorage.getItem("token") ||
      "";

    setUsername(savedUsername);
    setToken(savedToken);
  }, []);

  // ==========================================
  // FETCH LIVE GOLD PRICE + PORTFOLIO
  // ==========================================

  const fetchPortfolio = async () => {
    try {
      setLoading(true);

      // ------------------------------------------
      // LIVE GOLD PRICE
      // ------------------------------------------

      const priceRes = await axios.get(
        `${API}/api/gold/price`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (priceRes.data?.success) {
        const priceData =
          priceRes.data?.data || {};

        setGoldPrice({
          buyPrice:
            Number(priceData.buyPrice) || 0,

          sellPrice:
            Number(priceData.sellPrice) || 0,

          goldPriceUSD:
            Number(priceData.goldPriceUSD) || 0,

          UsdtoPkr:
            Number(
              priceData.UsdtoPkr ??
                priceData.usdToPkr
            ) || 0,

          tradingEnabled:
            priceData.tradingEnabled !== false,

          marketStatus:
            priceData.marketStatus || "OPEN",
        });
      }

      // ------------------------------------------
      // JWT CHECK
      // ------------------------------------------

      if (!token) {
        console.log(
          "JWT not found. Portfolio skipped."
        );

        return;
      }

      // ------------------------------------------
      // USER PORTFOLIO
      // ------------------------------------------

      const portfolioRes = await axios.get(
        `${API}/api/gold/portfolio`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (portfolioRes.data?.success) {
        const portfolioData =
          portfolioRes.data?.portfolio || {};

        setPortfolio({
          goldBalance:
            Number(
              portfolioData.goldBalance
            ) || 0,

          WalletBalance:
            Number(
              portfolioData.WalletBalance ??
                portfolioData.walletBalance
            ) || 0,

          averagebuyPrice:
            Number(
              portfolioData.averagebuyPrice ??
                portfolioData.averageBuyPrice
            ) || 0,

          currentPrice:
            Number(
              portfolioData.currentPrice
            ) || 0,

          portfolioValue:
            Number(
              portfolioData.portfolioValue
            ) || 0,

          liveProfit:
            Number(
              portfolioData.liveProfit
            ) || 0,

          totalProfitLoss:
            Number(
              portfolioData.totalProfitLoss
            ) || 0,

          totalGoldbuy:
            Number(
              portfolioData.totalGoldbuy
            ) || 0,

          totalGoldsell:
            Number(
              portfolioData.totalGoldsell
            ) || 0,
        });
      }
    } catch (error: any) {
      console.error(
        "BUY PAGE ERROR:",
        error?.response?.data ||
          error?.message
      );

      setMessage(
        error?.response?.data?.message ||
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

    const interval = window.setInterval(() => {
      fetchPortfolio();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [token]);

  // ==========================================
  // CLEAR MESSAGE AFTER 4 SECONDS
  // ==========================================

  useEffect(() => {
    if (!message) return;

    const timeout = window.setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [message]);

  // ==========================================
  // LIVE BUY CALCULATIONS
  // ==========================================

  const buyValue = useMemo(() => {
    const qty = Number(grams);

    if (!qty || qty <= 0) {
      return 0;
    }

    return qty * goldPrice.buyPrice;
  }, [grams, goldPrice.buyPrice]);

  const remainingWallet = useMemo(() => {
    return Math.max(
      portfolio.WalletBalance - buyValue,
      0
    );
  }, [
    portfolio.WalletBalance,
    buyValue,
  ]);

  const newGoldBalance = useMemo(() => {
    return (
      portfolio.goldBalance +
      Number(grams || 0)
    );
  }, [
    portfolio.goldBalance,
    grams,
  ]);

  const newAveragePrice = useMemo(() => {
    const qty = Number(grams);

    if (!qty || qty <= 0) {
      return portfolio.averagebuyPrice;
    }

    if (portfolio.goldBalance === 0) {
      return goldPrice.buyPrice;
    }

    const totalCost =
      portfolio.goldBalance *
        portfolio.averagebuyPrice +
      qty * goldPrice.buyPrice;

    const totalGold =
      portfolio.goldBalance + qty;

    return totalGold > 0
      ? totalCost / totalGold
      : portfolio.averagebuyPrice;
  }, [
    grams,
    portfolio.goldBalance,
    portfolio.averagebuyPrice,
    goldPrice.buyPrice,
  ]);

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
      setMessage(
        "Gold trading is currently closed."
      );

      setMessageType("error");

      return;
    }

    const qty = Number(grams);

    if (!qty || qty <= 0) {
      setMessage(
        "Please enter valid gold grams."
      );

      setMessageType("error");

      return;
    }

    if (buyValue > portfolio.WalletBalance) {
      setMessage(
        "Insufficient PKR Wallet Balance."
      );

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
      if (!token) {
        setMessage(
          "Authentication token is missing."
        );

        setMessageType("error");

        return;
      }

      setProcessing(true);
      setShowConfirm(false);

      const qty = Number(grams);

      if (!qty || qty <= 0) {
        setMessage(
          "Please enter valid gold grams."
        );

        setMessageType("error");

        return;
      }

      const response = await axios.post(
        `${API}/api/gold/buy`,
        {
          grams: qty,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data?.success) {
        setMessage(
          "Gold purchased successfully."
        );

        setMessageType("success");

        setGrams("");

        await fetchPortfolio();
      } else {
        setMessage(
          response.data?.message ||
            "Gold purchase failed."
        );

        setMessageType("error");
      }
    } catch (error: any) {
      console.error(
        "BUY GOLD ERROR:",
        error?.response?.data || error
      );

      setMessage(
        error?.response?.data?.message ||
          "Gold purchase failed."
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

    if (!Number.isFinite(qty) || qty < 0) {
      return;
    }

    setGrams(value);
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-green-400 border-t-transparent" />

          <h2 className="text-3xl font-black text-green-400">
            GoldTrade V18
          </h2>

          <p className="mt-2 text-gray-400">
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
      {/* ========================================
          HEADER
      ======================================== */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black text-green-400">
            Buy GOLD
          </h1>

          <p className="text-gray-400 mt-2">
            Purchase Gold instantly using your PKR Wallet.
          </p>

          {username && (
            <p className="text-gray-500 text-sm mt-1">
              Account:{" "}
              <span className="text-green-400 font-semibold">
                {username}
              </span>
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={fetchPortfolio}
          disabled={processing}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold px-5 py-3 rounded-xl transition-all duration-300 hover:scale-105"
        >
          🔄 Refresh
        </button>
      </div>

      {/* ========================================
          SUCCESS / ERROR MESSAGE
      ======================================== */}

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

      {/* ========================================
          LIVE MARKET
      ======================================== */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {/* BUY PRICE */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Buy Price
          </p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR{" "}
            {goldPrice.buyPrice.toLocaleString(
              "en-PK",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </h2>
        </div>

        {/* SELL PRICE */}

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Sell Price
          </p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            PKR{" "}
            {goldPrice.sellPrice.toLocaleString(
              "en-PK",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </h2>
        </div>

        {/* MARKET STATUS */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Market Status
          </p>

          <h2
            className={`text-3xl font-black mt-2 ${
              goldPrice.marketStatus === "OPEN"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {goldPrice.marketStatus}
          </h2>
        </div>

        {/* TRADING STATUS */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Trading
          </p>

          <h2
            className={`text-3xl font-black mt-2 ${
              goldPrice.tradingEnabled
                ? "text-cyan-400"
                : "text-red-400"
            }`}
          >
            {goldPrice.tradingEnabled
              ? "OPEN"
              : "CLOSED"}
          </h2>
        </div>
      </div>

      {/* ========================================
          PORTFOLIO SUMMARY
      ======================================== */}

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {/* GOLD BALANCE */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Gold Balance
          </p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {portfolio.goldBalance.toFixed(3)} g
          </h2>
        </div>

        {/* WALLET BALANCE */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Wallet Balance
          </p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR{" "}
            {portfolio.WalletBalance.toLocaleString(
              "en-PK",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </h2>
        </div>

        {/* AVERAGE BUY PRICE */}

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Average Buy Price
          </p>

          <h2 className="text-3xl font-black text-blue-400 mt-2">
            PKR{" "}
            {portfolio.averagebuyPrice.toLocaleString(
              "en-PK",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </h2>
        </div>
      </div>

      {/* ========================================
          BUY PANEL
      ======================================== */}

      <div className="bg-zinc-900 border border-green-500 rounded-3xl p-8 mb-10">
        <h2 className="text-3xl font-black text-green-400 mb-6">
          Gold Buying Panel
        </h2>

        {/* GOLD QUANTITY INPUT */}

        <label
          htmlFor="gold-grams"
          className="block text-gray-300 mb-2"
        >
          Gold Quantity (Grams)
        </label>

        <input
          id="gold-grams"
          type="number"
          min="0"
          step="0.001"
          value={grams}
          onChange={handleGramInput}
          placeholder="Enter grams to buy..."
          disabled={
            processing ||
            !goldPrice.tradingEnabled
          }
          className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-4 text-white outline-none focus:border-green-500 disabled:opacity-50 mb-5"
        />

        {/* ========================================
            QUICK GRAM BUTTONS
        ======================================== */}

        <div className="grid grid-cols-4 md:grid-cols-7 gap-3 mb-6">
          {quickGrams.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => selectGram(item)}
              disabled={
                processing ||
                !goldPrice.tradingEnabled
              }
              className={`rounded-xl py-3 font-bold transition ${
                grams === item.toString()
                  ? "bg-green-500 text-black"
                  : "bg-zinc-800 hover:bg-green-700"
              } disabled:opacity-50`}
            >
              {item}g
            </button>
          ))}
        </div>

        {/* ========================================
            LIVE CALCULATOR
        ======================================== */}

        <div className="bg-black rounded-2xl p-5 border border-zinc-700 mb-6 space-y-4">
          {/* GOLD QUANTITY */}

          <div className="flex justify-between">
            <span className="text-gray-400">
              Gold Quantity
            </span>

            <span className="text-yellow-400 font-bold">
              {grams || "0"} g
            </span>
          </div>

          {/* LIVE BUY PRICE */}

          <div className="flex justify-between">
            <span className="text-gray-400">
              Live Buy Price
            </span>

            <span className="text-green-400 font-bold">
              PKR{" "}
              {goldPrice.buyPrice.toLocaleString(
                "en-PK",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </span>
          </div>

          {/* TOTAL PURCHASE COST */}

          <div className="border-t border-zinc-700 pt-4 flex justify-between text-lg">
            <span>
              Total Purchase Cost
            </span>

            <span className="text-green-400 font-black">
              PKR{" "}
              {buyValue.toLocaleString(
                "en-PK",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </span>
          </div>

          {/* WALLET AFTER PURCHASE */}

          <div className="flex justify-between text-lg">
            <span>
              Wallet After Purchase
            </span>

            <span className="text-yellow-400 font-black">
              PKR{" "}
              {remainingWallet.toLocaleString(
                "en-PK",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </span>
          </div>

          {/* GOLD BALANCE AFTER BUY */}

          <div className="flex justify-between text-lg">
            <span>
              Gold Balance After Buy
            </span>

            <span className="text-yellow-400 font-black">
              {newGoldBalance.toFixed(3)} g
            </span>
          </div>

          {/* NEW AVERAGE PRICE */}

          <div className="flex justify-between text-lg">
            <span>
              New Average Buy Price
            </span>

            <span className="text-blue-400 font-black">
              PKR{" "}
              {Math.round(
                newAveragePrice
              ).toLocaleString("en-PK")}
            </span>
          </div>
        </div>

        {/* BUY BUTTON */}

        <button
          type="button"
          onClick={openConfirmation}
          disabled={
            processing ||
            !goldPrice.tradingEnabled
          }
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black text-xl py-4 rounded-2xl transition-all duration-300"
        >
          {processing
            ? "Processing..."
            : "Buy GOLD NOW"}
        </button>
      </div>
            {/* ========================================
          CONFIRMATION MODAL
      ======================================== */}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 p-4">
          <div className="bg-zinc-900 border border-green-500 rounded-3xl w-full max-w-md p-6">
            <h2 className="text-2xl font-black text-green-400 mb-4">
              Confirm Gold Purchase
            </h2>

            <div className="space-y-3">
              {/* QUANTITY */}

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Quantity
                </span>

                <span className="font-bold">
                  {grams} g
                </span>
              </div>

              {/* PRICE PER GRAM */}

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Price / Gram
                </span>

                <span className="font-bold">
                  PKR{" "}
                  {goldPrice.buyPrice.toLocaleString(
                    "en-PK",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>

              {/* TOTAL COST */}

              <div className="flex justify-between text-green-400 font-bold text-lg border-t border-zinc-700 pt-3">
                <span>
                  Total Cost
                </span>

                <span>
                  PKR{" "}
                  {buyValue.toLocaleString(
                    "en-PK",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>

              {/* WALLET AFTER PURCHASE */}

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Wallet After Purchase
                </span>

                <span className="text-yellow-400 font-semibold">
                  PKR{" "}
                  {remainingWallet.toLocaleString(
                    "en-PK",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </div>
            </div>

            {/* MODAL ACTIONS */}

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() =>
                  setShowConfirm(false)
                }
                disabled={processing}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 py-3 rounded-xl font-bold transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={buyGold}
                disabled={processing}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 py-3 rounded-xl font-bold transition"
              >
                {processing
                  ? "Processing..."
                  : "Confirm Buy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          ADDITIONAL PORTFOLIO INFORMATION
      ======================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {/* PORTFOLIO VALUE */}

        <div className="bg-zinc-900 border border-blue-500/50 rounded-2xl p-5">
          <p className="text-gray-400 text-sm">
            Portfolio Value
          </p>

          <h3 className="text-2xl font-black text-blue-400 mt-2">
            PKR{" "}
            {portfolio.portfolioValue.toLocaleString(
              "en-PK",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </h3>
        </div>

        {/* LIVE PROFIT */}

        <div className="bg-zinc-900 border border-green-500/50 rounded-2xl p-5">
          <p className="text-gray-400 text-sm">
            Live Profit
          </p>

          <h3
            className={`text-2xl font-black mt-2 ${
              portfolio.liveProfit >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            PKR{" "}
            {portfolio.liveProfit.toLocaleString(
              "en-PK",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </h3>
        </div>

        {/* TOTAL PROFIT / LOSS */}

        <div className="bg-zinc-900 border border-purple-500/50 rounded-2xl p-5">
          <p className="text-gray-400 text-sm">
            Total Profit / Loss
          </p>

          <h3
            className={`text-2xl font-black mt-2 ${
              portfolio.totalProfitLoss >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            PKR{" "}
            {portfolio.totalProfitLoss.toLocaleString(
              "en-PK",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </h3>
        </div>

        {/* CURRENT GOLD PRICE */}

        <div className="bg-zinc-900 border border-yellow-500/50 rounded-2xl p-5">
          <p className="text-gray-400 text-sm">
            Current Gold Price
          </p>

          <h3 className="text-2xl font-black text-yellow-400 mt-2">
            PKR{" "}
            {portfolio.currentPrice.toLocaleString(
              "en-PK",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )}
          </h3>
        </div>
      </div>

      {/* ========================================
          GOLD TRANSACTION SUMMARY
      ======================================== */}

      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 mb-10">
        <h2 className="text-2xl font-black text-white mb-5">
          Gold Transaction Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* TOTAL GOLD BOUGHT */}

          <div className="bg-black rounded-2xl p-5 border border-green-500/30">
            <p className="text-gray-400 text-sm">
              Total Gold Bought
            </p>

            <p className="text-2xl font-black text-green-400 mt-2">
              {portfolio.totalGoldbuy.toFixed(3)} g
            </p>
          </div>

          {/* TOTAL GOLD SOLD */}

          <div className="bg-black rounded-2xl p-5 border border-red-500/30">
            <p className="text-gray-400 text-sm">
              Total Gold Sold
            </p>

            <p className="text-2xl font-black text-red-400 mt-2">
              {portfolio.totalGoldsell.toFixed(3)} g
            </p>
          </div>
        </div>
      </div>
            {/* ========================================
          MARKET INFORMATION
      ======================================== */}

      <div className="bg-zinc-900 border border-cyan-500/30 rounded-3xl p-6 mb-10">
        <h2 className="text-2xl font-black text-cyan-400 mb-5">
          Gold Market Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* GOLD USD */}

          <div className="bg-black rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              Gold Price USD
            </p>

            <p className="text-xl font-bold text-yellow-400 mt-2">
              $
              {goldPrice.goldPriceUSD.toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </p>
          </div>

          {/* USD TO PKR */}

          <div className="bg-black rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              USD to PKR
            </p>

            <p className="text-xl font-bold text-cyan-400 mt-2">
              {goldPrice.UsdtoPkr.toLocaleString(
                "en-PK",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )}
            </p>
          </div>

          {/* MARKET STATE */}

          <div className="bg-black rounded-2xl p-5">
            <p className="text-gray-400 text-sm">
              Trading Status
            </p>

            <p
              className={`text-xl font-bold mt-2 ${
                goldPrice.tradingEnabled
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {goldPrice.tradingEnabled
                ? "ENABLED"
                : "DISABLED"}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================
          FOOTER
      ======================================== */}

      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        <p className="font-semibold text-green-400 mb-2 text-lg">
          GoldTrade Enterprises
        </p>

        <p>
          Buy Gold Module • Secure Cobra • Live Gold Market
        </p>

        <p className="mt-2">
          Powered by GoldTrade Enterprises.
        </p>
      </div>
    </div>
  );
};

export default GoldbuyPage;