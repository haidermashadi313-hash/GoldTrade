"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import GoldChart from "./GoldChart";

// ==============================================
// GoldTrade 
// ==============================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://https://goldtrade-2.onrender.com";

// ==============================================
// TYPES
// ==============================================

interface GoldPrice {
  buyPrice: number;
  sellPrice: number;
  goldPriceUSD: number;
  UsdtoPkr: number;
  tradingEnabled: boolean;
  marketStatus: string;
  updatedAt?: string;
}

interface Portfolio {
  WalletBalance: number;
  goldBalance: number;
  averagebuyPrice: number;
  currentsellPrice: number;
  totalInvested: number;
  currentValue: number;
  liveProfitLoss: number;
  totalProfitLoss: number;
  totalGoldbuy: number;
  totalGoldsell: number;
}

export default function GoldDashboard() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  const [goldPrice, setGoldPrice] = useState<GoldPrice>({
    buyPrice: 0,
    sellPrice: 0,
    goldPriceUSD: 0,
    UsdtoPkr: 0,
    tradingEnabled: true,
    marketStatus: "OPEN",
  });

  const [portfolio, setPortfolio] = useState<Portfolio>({
    WalletBalance: 0,
    goldBalance: 0,
    averagebuyPrice: 0,
    currentsellPrice: 0,
    totalInvested: 0,
    currentValue: 0,
    liveProfitLoss: 0,
    totalProfitLoss: 0,
    totalGoldbuy: 0,
    totalGoldsell: 0,
  });

  // ==============================================
  // LOAD USER FROM LOCAL STORAGE
  // ==============================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedUsername = localStorage.getItem("username") || "";
    setUsername(savedUsername);
  }, []);
  // ==============================================
  // FETCH DASHBOARD DATA
  // ==============================================

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      // -------------------------------
      // 1. Load Gold Price (No Login Required)
      // -------------------------------
      const priceRes = await axios.get(`${API}/api/gold/price`);

      if (priceRes.data.success) {
        const data = priceRes.data.data || {};

        setGoldPrice({
          buyPrice: Number(data.buyPrice || 0),
          sellPrice: Number(data.sellPrice || 0),
          goldPriceUSD: Number(data.goldPriceUSD || 0),
          UsdtoPkr: Number(data.UsdtoPkr || 0),
          tradingEnabled: Boolean(data.tradingEnabled),
          marketStatus: data.marketStatus || "OPEN",
          updatedAt: data.updatedAt,
        });
      }

      // -------------------------------
      // 2. Load Portfolio (JWT Required)
      // -------------------------------
      const token = localStorage.getItem("token");

      if (!token || token === "null" || token === "undefined") {
        console.log("No valid JWT token found. Portfolio skipped.");
        return;
      }

      const portfolioRes = await axios.get(`${API}/api/gold/portfolio`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (portfolioRes.data.success) {
        const data = portfolioRes.data.portfolio || {};

        setPortfolio({
          WalletBalance: Number(data.WalletBalance || 0),
          goldBalance: Number(data.goldBalance || 0),
          averagebuyPrice: Number(data.averagebuyPrice || 0),
          currentsellPrice: Number(data.currentsellPrice || 0),
          totalInvested: Number(data.totalInvested || 0),
          currentValue: Number(data.currentValue || 0),
          liveProfitLoss: Number(data.liveProfitLoss || 0),
          totalProfitLoss: Number(data.totalProfitLoss || 0),
          totalGoldbuy: Number(data.totalGoldbuy || 0),
          totalGoldsell: Number(data.totalGoldsell || 0),
        });
      }
    } catch (error: any) {
      console.error("Gold Dashboard Error:", error.response?.data || error.message);

      if (error.response?.status === 401) {
        console.log("User session expired.");
      }
    } finally {
      setLoading(false);
    }
  };
  // ==============================================
  // INITIAL LOAD
  // ==============================================

  useEffect(() => {
    fetchDashboard();

    // Auto Refresh Every 30 Seconds
    const interval = setInterval(fetchDashboard, 30000);

    return () => clearInterval(interval);
  }, []);

  // ==============================================
  // LOADING SCREEN
  // ==============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6" />

          <h2 className="text-yellow-400 text-3xl font-black">
            GoldTrade 
          </h2>

          <p className="text-gray-400 mt-2">
            Loading Live Dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
  {/* ============================================== */}
{/* LIVE MARKET INFORMATION */}
{/* ============================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-black text-yellow-400">
              Live Gold Market
            </h2>

            <p className="text-gray-400 mt-1">
              Gold Market Dashboard ?Auto Refresh Rates
            </p>
          </div>

          <button
            onClick={fetchDashboard}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105"
          >
             Refresh Live Data
          </button>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* buy PRICE */}

          <div className="bg-black rounded-2xl p-5 border border-green-600">
            <p className="text-gray-400 text-sm mb-2">Current buy Price</p>

            <h3 className="text-2xl font-black text-green-400">
              Pkr {goldPrice.buyPrice.toLocaleString()}
            </h3>
          </div>

          {/* sell PRICE */}

          <div className="bg-black rounded-2xl p-5 border border-red-600">
            <p className="text-gray-400 text-sm mb-2">Current sell Price</p>

            <h3 className="text-2xl font-black text-red-400">
              Pkr {goldPrice.sellPrice.toLocaleString()}
            </h3>
          </div>

          {/* AVERAGE buy PRICE */}

          <div className="bg-black rounded-2xl p-5 border border-blue-600">
            <p className="text-gray-400 text-sm mb-2">Average buy Price</p>

            <h3 className="text-2xl font-black text-blue-400">
              Pkr{" "}
              {portfolio.averagebuyPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>

          {/* USD PRICE */}

          <div className="bg-black rounded-2xl p-5 border border-yellow-600">
            <p className="text-gray-400 text-sm mb-2">Gold Price (USD/Ounce)</p>

            <h3 className="text-2xl font-black text-yellow-400">
              ${goldPrice.goldPriceUSD.toLocaleString()}
            </h3>

            <p className="text-gray-500 mt-2">International Gold Price</p>
          </div>

          {/* USD TO Pkr */}

          <div className="bg-black rounded-2xl p-5 border border-cyan-600">
            <p className="text-gray-400 text-sm mb-2">USD 鈫?Pkr Exchange Rate</p>

            <h3 className="text-2xl font-black text-cyan-400">
              {goldPrice.UsdtoPkr}
            </h3>

            <p className="text-gray-500 mt-2">Live Conversion Rate</p>
          </div>

          {/* MARKET STATUS */}

          <div className="bg-black rounded-2xl p-5 border border-purple-600">
            <p className="text-gray-400 text-sm mb-2">Market Status</p>

            <h3
              className={`text-2xl font-black ${
                goldPrice.marketStatus === "OPEN"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {goldPrice.marketStatus}
            </h3>

            <p className="text-gray-500 mt-2">
              Trading {goldPrice.tradingEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>

        {/* LAST UPDATE */}

        <div className="mt-6 bg-black rounded-2xl p-5 border border-zinc-700 flex justify-between items-center flex-wrap gap-3">
          <div>
            <p className="text-gray-400 text-sm">Last Market Update</p>

            <h3 className="text-lg font-bold text-yellow-300">
              {goldPrice.updatedAt
                ? new Date(goldPrice.updatedAt).toLocaleString()
                : "Live Market"}
            </h3>
          </div>

          <div className="text-green-400 font-bold"> Auto Refresh Enabled</div>
        </div>
      </div>

      {/* ============================================== */}
      {/* ACCOUNT SUMMARY */}
      {/* ============================================== */}

      <h2 className="text-3xl font-black text-yellow-400 mb-5">
        Account Summary
      </h2>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {/* TOTAL buy */}
        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Total Gold Bought</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            {portfolio.totalGoldbuy.toFixed(3)} g
          </h2>
        </div>

        {/* TOTAL sell */}
        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Total Gold Sold</p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            {portfolio.totalGoldsell.toFixed(3)} g
          </h2>
        </div>

        {/* INVESTMENT */}
        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Total Investment</p>

          <h2 className="text-3xl font-black text-blue-400 mt-2">
            Pkr {portfolio.totalInvested.toLocaleString()}
          </h2>
        </div>

        {/* CURRENT VALUE */}
        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Current Portfolio Value</p>

          <h2 className="text-3xl font-black text-purple-400 mt-2">
            Pkr {portfolio.currentValue.toLocaleString()}
          </h2>
        </div>
      </div>

      {/* ============================================== */}
      {/* QUICK MARKET SUMMARY */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">
        <h2 className="text-3xl font-black text-yellow-400 mb-6">
          Gold Market Summary
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">Market Status</span>

            <span className="text-green-400 font-bold">
              {goldPrice.marketStatus}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">Trading Availability</span>

            <span className="text-yellow-400 font-bold">
              {goldPrice.tradingEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">Live buy Price</span>

            <span className="text-green-400 font-bold">
              Pkr {goldPrice.buyPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">Live sell Price</span>

            <span className="text-red-400 font-bold">
              Pkr {goldPrice.sellPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">Gold Price (USD/Ounce)</span>

            <span className="text-yellow-300 font-bold">
              ${goldPrice.goldPriceUSD.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">USD Pkr</span>

            <span className="text-cyan-400 font-bold">
              {goldPrice.UsdtoPkr}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Total Realized Profit/Loss</span>

            <span
              className={`font-bold ${
                portfolio.totalProfitLoss >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              Pkr {portfolio.totalProfitLoss.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
                {/* ============================================== */}
                {/* FOOTER */}
                {/* ============================================== */}

      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        <p className="font-semibold text-yellow-400 mb-2 text-lg">
          GoldTrade Enterprise Dashboard
        </p>

        <p>
          Live Gold Trading • Portfolio • buy & sell • Transaction history
        </p>

        <p className="mt-2">
          Powered by GoldTrade Enterprise
        </p>

        <div className="mt-4 flex justify-center gap-6 flex-wrap text-xs">
          <span className="text-green-400"> Market Live</span>
          <span className="text-yellow-400"> Auto Refresh 30s</span>
          <span className="text-blue-400"> JWT Protected</span>
          <span className="text-purple-400"> Real-Time Portfolio</span>
        </div>
      </div>

    </div>
  );
}


