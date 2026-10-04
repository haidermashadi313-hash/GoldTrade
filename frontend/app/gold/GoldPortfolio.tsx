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

interface GoldTransaction {
  _id: string;
  tradeType: "buy" | "sell";
  grams: number;
  pricePerGram: number;
  totalPkr: number;
  profitLoss: number;
  status: string;
  createdAt: string;
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
  transactions: GoldTransaction[];
}

// ==========================================
// GOLD PORTFOLIO PAGE
// ==========================================

const GoldPortfolioPage: React.FC = () => {
  // ==========================================
  // USER + JWT
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
    transactions: [],
  });

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  // ==========================================
  // LOAD USER
  // ==========================================

  useEffect(() => {
    const savedUsername =
      localStorage.getItem("username") ||
      localStorage.getItem("goldtrade_username") ||
      "";

    const savedToken =
      localStorage.getItem("token") ||
      localStorage.getItem("goldtrade_token") ||
      "";

    setUsername(savedUsername);
    setToken(savedToken);
  }, []);

  // ==========================================
  // FETCH PORTFOLIO
  // ==========================================

  const fetchPortfolio = async () => {
    try {
      setLoading(true);

      // ----------------------------------------
      // GET LIVE GOLD PRICE
      // ----------------------------------------

      const priceRes = await axios.get(
        `${API}/api/gold/price`
      );

      if (priceRes.data?.success) {
        const priceData = priceRes.data?.data;

        if (priceData) {
          setGoldPrice({
            buyPrice: Number(
              priceData.buyPrice ?? 0
            ),

            sellPrice: Number(
              priceData.sellPrice ?? 0
            ),

            goldPriceUSD: Number(
              priceData.goldPriceUSD ?? 0
            ),

            UsdtoPkr: Number(
              priceData.UsdtoPkr ?? 0
            ),

            tradingEnabled: Boolean(
              priceData.tradingEnabled
            ),

            marketStatus: String(
              priceData.marketStatus ?? "CLOSED"
            ),
          });
        }
      }

      // ----------------------------------------
      // TOKEN CHECK
      // ----------------------------------------

      if (!token) {
        setMessage(
          "Authentication token not found."
        );

        setMessageType("error");

        return;
      }

      // ----------------------------------------
      // GET USER PORTFOLIO
      // ----------------------------------------

      const portfolioRes = await axios.get(
        `${API}/api/gold/portfolio`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (portfolioRes.data?.success) {
        const data =
          portfolioRes.data?.portfolio;

        if (data) {
          setPortfolio({
            goldBalance: Number(
              data.goldBalance ?? 0
            ),

            WalletBalance: Number(
              data.WalletBalance ?? 0
            ),

            averagebuyPrice: Number(
              data.averagebuyPrice ?? 0
            ),

            currentPrice: Number(
              data.currentPrice ?? 0
            ),

            portfolioValue: Number(
              data.portfolioValue ?? 0
            ),

            liveProfit: Number(
              data.liveProfit ?? 0
            ),

            totalProfitLoss: Number(
              data.totalProfitLoss ?? 0
            ),

            totalGoldbuy: Number(
              data.totalGoldbuy ?? 0
            ),

            totalGoldsell: Number(
              data.totalGoldsell ?? 0
            ),

            transactions: Array.isArray(
              data.transactions
            )
              ? data.transactions
              : [],
          });
        }

        setMessage("");
      }
    } catch (error: any) {
      console.error(
        "PORTFOLIO ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        setMessage(
          "Your session has expired. Please login again."
        );
      } else {
        setMessage(
          error?.response?.data?.message ||
            "Unable to load Gold Portfolio."
        );
      }

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL PORTFOLIO LOAD
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
  // LIVE PORTFOLIO CALCULATIONS
  // ==========================================

  const totalInvestment = useMemo(() => {
    return (
      Number(portfolio.goldBalance || 0) *
      Number(portfolio.averagebuyPrice || 0)
    );
  }, [
    portfolio.goldBalance,
    portfolio.averagebuyPrice,
  ]);

  const currentPortfolioValue = useMemo(() => {
    return (
      Number(portfolio.goldBalance || 0) *
      Number(goldPrice.sellPrice || 0)
    );
  }, [
    portfolio.goldBalance,
    goldPrice.sellPrice,
  ]);

  const unrealizedProfit = useMemo(() => {
    return (
      currentPortfolioValue -
      totalInvestment
    );
  }, [
    currentPortfolioValue,
    totalInvestment,
  ]);

  const profitPercentage = useMemo(() => {
    if (totalInvestment <= 0) {
      return 0;
    }

    return (
      (unrealizedProfit / totalInvestment) *
      100
    );
  }, [
    unrealizedProfit,
    totalInvestment,
  ]);

  const totalAssetsValue = useMemo(() => {
    return (
      Number(portfolio.WalletBalance || 0) +
      currentPortfolioValue
    );
  }, [
    portfolio.WalletBalance,
    currentPortfolioValue,
  ]);

  const goldWeightValue = useMemo(() => {
    return (
      Number(portfolio.goldBalance || 0) *
      Number(goldPrice.sellPrice || 0)
    );
  }, [
    portfolio.goldBalance,
    goldPrice.sellPrice,
  ]);

  // ==========================================
  // REFRESH DATA
  // ==========================================

  const refreshPortfolio = async () => {
    await fetchPortfolio();
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />

          <h2 className="text-3xl font-black text-yellow-400">
            GOLD PORTFOLIO
          </h2>

          <p className="mt-2 text-gray-400">
            Loading Portfolio...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // PAGE UI STARTS
  // ==========================================

  return (
    <div className="min-h-screen bg-[#070707] text-white p-6">
      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-5xl font-black text-yellow-400">
            GOLD PORTFOLIO
          </h1>

          <p className="text-gray-400 mt-2">
            Welcome back, {username}
          </p>
        </div>

        <button
          type="button"
          onClick={refreshPortfolio}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105"
        >
          Refresh
        </button>
      </div>

      {/* ==========================================
          SUCCESS / ERROR MESSAGE
      ========================================== */}

      {message && (
        <div
          className={`mb-6 rounded-xl p-4 font-semibold ${
            messageType === "success"
              ? "bg-green-600 text-white"
              : "bg-red-700 text-white"
          }`}
        >
          {message}
        </div>
      )}

      {/* ==========================================
          LIVE MARKET CARDS
      ========================================== */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {/* BUY PRICE */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Live Buy Price
          </p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR{" "}
            {Number(
              goldPrice.buyPrice
            ).toLocaleString()}
          </h2>
        </div>

        {/* SELL PRICE */}

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Live Sell Price
          </p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            PKR{" "}
            {Number(
              goldPrice.sellPrice
            ).toLocaleString()}
          </h2>
        </div>

        {/* MARKET STATUS */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Market Status
          </p>

          <h2 className="text-3xl font-black text-cyan-400 mt-2">
            {goldPrice.marketStatus}
          </h2>
        </div>

        {/* TRADING STATUS */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Trading Status
          </p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {goldPrice.tradingEnabled
              ? "OPEN"
              : "CLOSED"}
          </h2>
        </div>
      </div>

      {/* ==========================================
          MAIN PORTFOLIO SUMMARY
      ========================================== */}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {/* GOLD BALANCE */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Gold Balance
          </p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {Number(
              portfolio.goldBalance || 0
            ).toFixed(3)}{" "}
            g
          </h2>
        </div>

        {/* WALLET BALANCE */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Wallet Balance
          </p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR{" "}
            {Number(
              portfolio.WalletBalance || 0
            ).toLocaleString()}
          </h2>
        </div>

        {/* PORTFOLIO VALUE */}

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Portfolio Value
          </p>

          <h2 className="text-3xl font-black text-blue-400 mt-2">
            PKR{" "}
            {Number(
              currentPortfolioValue || 0
            ).toLocaleString()}
          </h2>
        </div>

        {/* LIVE PROFIT / LOSS */}

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Live Profit / Loss
          </p>

          <h2
            className={`text-3xl font-black mt-2 ${
              unrealizedProfit >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            PKR{" "}
            {Number(
              unrealizedProfit || 0
            ).toLocaleString()}
          </h2>
        </div>
      </div>

      {/* ==========================================
          INVESTMENT ANALYTICS
      ========================================== */}

      <h2 className="text-3xl font-black text-yellow-400 mb-5">
        Investment Analytics
      </h2>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        {/* TOTAL INVESTMENT */}

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Total Investment
          </p>

          <h2 className="text-3xl font-black text-blue-400 mt-2">
            PKR{" "}
            {Number(
              totalInvestment
            ).toLocaleString()}
          </h2>

          <p className="text-xs text-gray-500 mt-3">
            Gold Balance × Average Buy Price
          </p>
        </div>

        {/* CURRENT VALUE */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Current Gold Value
          </p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR{" "}
            {Number(
              currentPortfolioValue
            ).toLocaleString()}
          </h2>

          <p className="text-xs text-gray-500 mt-3">
            Gold Balance × Live Sell Price
          </p>
        </div>

        {/* TOTAL ASSETS */}

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Total Assets Value
          </p>

          <h2 className="text-3xl font-black text-purple-400 mt-2">
            PKR{" "}
            {Number(
              totalAssetsValue
            ).toLocaleString()}
          </h2>

          <p className="text-xs text-gray-500 mt-3">
            Wallet + Gold Portfolio
          </p>
        </div>

        {/* LIVE PROFIT */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Live Profit / Loss
          </p>

          <h2
            className={`text-3xl font-black mt-2 ${
              unrealizedProfit >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            PKR{" "}
            {Number(
              unrealizedProfit
            ).toLocaleString()}
          </h2>

          <p className="text-xs text-gray-500 mt-3">
            Unrealized Portfolio Gain/Loss
          </p>
        </div>

        {/* ROI */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Portfolio ROI
          </p>

          <h2
            className={`text-3xl font-black mt-2 ${
              profitPercentage >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {Number(
              profitPercentage
            ).toFixed(2)}
            %
          </h2>

          <p className="text-xs text-gray-500 mt-3">
            Return on Investment
          </p>
        </div>

        {/* REALIZED PROFIT */}

        <div className="bg-zinc-900 border border-pink-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Realized Profit / Loss
          </p>

          <h2
            className={`text-3xl font-black mt-2 ${
              Number(
                portfolio.totalProfitLoss || 0
              ) >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            PKR{" "}
            {Number(
              portfolio.totalProfitLoss || 0
            ).toLocaleString()}
          </h2>

          <p className="text-xs text-gray-500 mt-3">
            Completed Sell Transactions
          </p>
        </div>
      </div>
            {/* ==========================================
          GOLD MARKET INFORMATION
      ========================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">
        <h2 className="text-3xl font-black text-yellow-400 mb-6">
          Live Gold Market Information
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* LIVE BUY PRICE */}

          <div className="bg-black rounded-2xl p-5 border border-zinc-700">
            <p className="text-gray-400 text-sm mb-2">
              Live Buy Price
            </p>

            <h3 className="text-2xl font-black text-green-400">
              PKR{" "}
              {Number(
                goldPrice.buyPrice || 0
              ).toLocaleString()}
            </h3>
          </div>

          {/* LIVE SELL PRICE */}

          <div className="bg-black rounded-2xl p-5 border border-zinc-700">
            <p className="text-gray-400 text-sm mb-2">
              Live Sell Price
            </p>

            <h3 className="text-2xl font-black text-red-400">
              PKR{" "}
              {Number(
                goldPrice.sellPrice || 0
              ).toLocaleString()}
            </h3>
          </div>

          {/* GOLD PRICE USD */}

          <div className="bg-black rounded-2xl p-5 border border-zinc-700">
            <p className="text-gray-400 text-sm mb-2">
              Gold Price (USD / Ounce)
            </p>

            <h3 className="text-2xl font-black text-yellow-300">
              $
              {Number(
                goldPrice.goldPriceUSD || 0
              ).toLocaleString()}
            </h3>
          </div>

          {/* USD TO PKR */}

          <div className="bg-black rounded-2xl p-5 border border-zinc-700">
            <p className="text-gray-400 text-sm mb-2">
              USD → PKR Exchange Rate
            </p>

            <h3 className="text-2xl font-black text-cyan-400">
              {Number(
                goldPrice.UsdtoPkr || 0
              ).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* ==========================================
          PERFORMANCE SUMMARY
      ========================================== */}

      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 mb-10">
        <h2 className="text-3xl font-black text-yellow-400 mb-6">
          Gold Performance Summary
        </h2>

        <div className="space-y-5">
          {/* GOLD BALANCE */}

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">
              Gold Balance
            </span>

            <span className="text-yellow-400 font-bold">
              {Number(
                portfolio.goldBalance || 0
              ).toFixed(3)}{" "}
              g
            </span>
          </div>

          {/* AVERAGE BUY PRICE */}

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">
              Average Buy Price
            </span>

            <span className="text-green-400 font-bold">
              PKR{" "}
              {Number(
                portfolio.averagebuyPrice || 0
              ).toLocaleString()}
            </span>
          </div>

          {/* CURRENT SELL PRICE */}

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">
              Current Sell Price
            </span>

            <span className="text-red-400 font-bold">
              PKR{" "}
              {Number(
                goldPrice.sellPrice || 0
              ).toLocaleString()}
            </span>
          </div>

          {/* LIVE PROFIT PERCENTAGE */}

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">
              Live Profit Percentage
            </span>

            <span
              className={`font-bold ${
                profitPercentage >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {Number(
                profitPercentage
              ).toFixed(2)}
              %
            </span>
          </div>

          {/* TOTAL GOLD PURCHASED */}

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">
              Total Gold Purchased
            </span>

            <span className="text-green-400 font-bold">
              {Number(
                portfolio.totalGoldbuy || 0
              ).toFixed(3)}{" "}
              g
            </span>
          </div>

          {/* TOTAL GOLD SOLD */}

          <div className="flex justify-between">
            <span className="text-gray-400">
              Total Gold Sold
            </span>

            <span className="text-red-400 font-bold">
              {Number(
                portfolio.totalGoldsell || 0
              ).toFixed(3)}{" "}
              g
            </span>
          </div>
        </div>
      </div>

      {/* ==========================================
          RECENT GOLD TRANSACTIONS
      ========================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-3xl font-black text-yellow-400">
            Recent Gold Transactions
          </h2>

          <span className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold">
            {portfolio.transactions.length} Transactions
          </span>
        </div>

        {portfolio.transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-6xl mb-4">
              📋
            </div>

            <p className="text-xl font-bold">
              No Gold Transactions Found
            </p>

            <p className="text-sm mt-2">
              Your buy & sell history will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="border-b border-zinc-700 text-gray-400 text-sm">
                <tr>
                  <th className="py-3">
                    Type
                  </th>

                  <th className="py-3">
                    Grams
                  </th>

                  <th className="py-3">
                    Price / Gram
                  </th>

                  <th className="py-3">
                    Total PKR
                  </th>

                  <th className="py-3">
                    Profit / Loss
                  </th>

                  <th className="py-3">
                    Status
                  </th>

                  <th className="py-3">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {portfolio.transactions.map(
                  (trade) => (
                    <tr
                      key={trade._id}
                      className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                    >
                      {/* TYPE */}

                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            trade.tradeType === "buy"
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {trade.tradeType === "buy"
                            ? "BUY"
                            : "SELL"}
                        </span>
                      </td>

                      {/* GRAMS */}

                      <td className="py-4 font-semibold text-yellow-400">
                        {Number(
                          trade.grams || 0
                        ).toFixed(3)}{" "}
                        g
                      </td>

                      {/* PRICE */}

                      <td className="py-4 text-cyan-400 font-semibold">
                        PKR{" "}
                        {Number(
                          trade.pricePerGram || 0
                        ).toLocaleString()}
                      </td>

                      {/* TOTAL */}

                      <td className="py-4 font-semibold">
                        PKR{" "}
                        {Number(
                          trade.totalPkr || 0
                        ).toLocaleString()}
                      </td>

                      {/* PROFIT / LOSS */}

                      <td className="py-4">
                        <span
                          className={`font-bold ${
                            Number(
                              trade.profitLoss || 0
                            ) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          PKR{" "}
                          {Number(
                            trade.profitLoss || 0
                          ).toLocaleString()}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td className="py-4">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {trade.status}
                        </span>
                      </td>

                      {/* DATE */}

                      <td className="py-4 text-gray-400 text-sm">
                        {new Date(
                          trade.createdAt
                        ).toLocaleString()}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
            {/* ==========================================
          PORTFOLIO INSIGHTS
      ========================================== */}

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        {/* TOTAL GOLD PURCHASED */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Total Gold Purchased
          </p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            {Number(
              portfolio.totalGoldbuy || 0
            ).toFixed(3)}{" "}
            g
          </h2>
        </div>

        {/* TOTAL GOLD SOLD */}

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Total Gold Sold
          </p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            {Number(
              portfolio.totalGoldsell || 0
            ).toFixed(3)}{" "}
            g
          </h2>
        </div>

        {/* TOTAL ASSETS VALUE */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">
            Total Assets Value
          </p>

          <h2 className="text-3xl font-black text-purple-400 mt-2">
            PKR{" "}
            {Number(
              totalAssetsValue
            ).toLocaleString()}
          </h2>
        </div>
      </div>

      {/* ==========================================
          ENTERPRISE FOOTER
      ========================================== */}

      <div className="mt-12 border-t border-zinc-800 pt-8 text-center text-gray-500 text-sm">
        <p className="font-semibold text-yellow-400 mb-2 text-lg">
          GoldTrade Enterprise V18 Portfolio
        </p>

        <p>
          Live Portfolio • Buy & Sell History • Profit / Loss • JWT Protected
        </p>

        <p className="mt-2">
          Powered by GoldTrade Enterprise Backend API
        </p>

        <div className="mt-4 flex justify-center gap-6 flex-wrap text-xs">
          <span className="text-green-400">
            Live Portfolio
          </span>

          <span className="text-yellow-400">
            Auto Refresh 30 Seconds
          </span>

          <span className="text-blue-400">
            JWT Secure
          </span>

          <span className="text-purple-400">
            Real-Time Analytics
          </span>
        </div>
      </div>
    </div>
  );
};
// ======================================================
// END OF GOLD PORTFOLIO PAGE
// ======================================================

export default GoldPortfolioPage;