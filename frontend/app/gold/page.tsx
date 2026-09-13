"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import GoldChart from "./GoldChart";

// ==============================================
// GOLDTRADE V17 API CONFIG
// ==============================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// ==============================================
// TYPES
// ==============================================

interface GoldPrice {
  buyPrice: number;
  sellPrice: number;
  tradingEnabled: boolean;
  marketStatus: string;
}

interface Portfolio {
  goldBalance: number;
  walletBalance: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalInvested: number;
  portfolioValue: number;
  liveProfit: number;
  totalProfitLoss: number;
  totalGoldBuy: number;
  totalGoldSell: number;
}

export default function GoldDashboard() {
  const [username, setUsername] = useState("");

  const [loading, setLoading] = useState(true);

  const [goldPrice, setGoldPrice] = useState<GoldPrice>({
    buyPrice: 0,
    sellPrice: 0,
    tradingEnabled: true,
    marketStatus: "OPEN",
  });

  const [portfolio, setPortfolio] = useState<Portfolio>({
    goldBalance: 0,
    walletBalance: 0,
    averageBuyPrice: 0,
    currentPrice: 0,
    totalInvested: 0,
    portfolioValue: 0,
    liveProfit: 0,
    totalProfitLoss: 0,
    totalGoldBuy: 0,
    totalGoldSell: 0,
  });

  // ==============================================
  // LOAD USERNAME (SSR SAFE)
  // ==============================================

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUsername =
        localStorage.getItem("username") || "hashi90";

      setUsername(savedUsername);
    }
  }, []);

  // ==============================================
  // FETCH LIVE GOLD DATA
  // ==============================================

  const fetchDashboard = async () => {
    if (!username) return;

    try {
      setLoading(true);

      const [priceRes, portfolioRes] = await Promise.all([
        axios.get(`${API}/api/gold/price`),
        axios.get(`${API}/api/gold/portfolio/${username}`),
      ]);

      if (priceRes.data.success) {
        setGoldPrice(priceRes.data);
      }

      if (portfolioRes.data.success) {
        setPortfolio(portfolioRes.data);
      }
    } catch (err) {
      console.error("Gold Dashboard Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!username) return;

    fetchDashboard();
  }, [username]);

  // ==============================================
  // LOADING SCREEN
  // ==============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center text-yellow-400 text-2xl font-bold">
        Loading Gold Dashboard...
      </div>
    );
  }

  // ==============================================
  // PAGE START
  // ==============================================

  return (
    <div className="min-h-screen bg-[#070707] text-white p-6">

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <div>
          <h1 className="text-5xl font-black text-yellow-400">
            GOLD TRADE DASHBOARD
          </h1>

          <p className="text-gray-400 mt-2">
            Welcome, {username}
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold"
        >
          Refresh
        </button>

      </div>

      {/* LIVE GOLD PRICES */}

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
            PKR {portfolio.walletBalance.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Portfolio Value</p>

          <h2 className="text-3xl font-black text-blue-400 mt-2">
            PKR {portfolio.portfolioValue.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Live Profit / Loss</p>

          <h2
            className={`text-3xl font-black mt-2 ${
              portfolio.liveProfit >= 0
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            PKR {portfolio.liveProfit.toLocaleString()}
          </h2>
        </div>

      </div>

      {/* LIVE GOLD CHART */}

      <div className="mb-10">
        <GoldChart />
      </div>
            {/* ============================================== */}
      {/* GOLD TRADING SERVICES */}
      {/* ============================================== */}

      <h2 className="text-3xl font-black text-yellow-400 mb-5">
        Gold Trading Services
      </h2>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

        {/* BUY GOLD */}
        <Link href="/gold/buy">
          <div className="bg-zinc-900 border border-green-500 rounded-3xl p-7 cursor-pointer hover:bg-zinc-800 hover:scale-105 transition duration-300">

            <div className="text-5xl mb-5">🟢</div>

            <h3 className="text-2xl font-black text-green-400">
              Buy Gold
            </h3>

            <p className="text-gray-400 mt-3">
              Purchase gold instantly using your PKR Wallet.
            </p>

          </div>
        </Link>

        {/* SELL GOLD */}
        <Link href="/gold/sell">
          <div className="bg-zinc-900 border border-red-500 rounded-3xl p-7 cursor-pointer hover:bg-zinc-800 hover:scale-105 transition duration-300">

            <div className="text-5xl mb-5">🔴</div>

            <h3 className="text-2xl font-black text-red-400">
              Sell Gold
            </h3>

            <p className="text-gray-400 mt-3">
              Sell your gold instantly into your PKR Wallet.
            </p>

          </div>
        </Link>

        {/* PORTFOLIO */}
        <Link href="/gold/portfolio">
          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-7 cursor-pointer hover:bg-zinc-800 hover:scale-105 transition duration-300">

            <div className="text-5xl mb-5">🪙</div>

            <h3 className="text-2xl font-black text-yellow-400">
              Gold Portfolio
            </h3>

            <p className="text-gray-400 mt-3">
              View gold holdings, investment value and live profit/loss.
            </p>

          </div>
        </Link>

        {/* HISTORY */}
        <Link href="/gold/history">
          <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-7 cursor-pointer hover:bg-zinc-800 hover:scale-105 transition duration-300">

            <div className="text-5xl mb-5">📜</div>

            <h3 className="text-2xl font-black text-blue-400">
              Gold History
            </h3>

            <p className="text-gray-400 mt-3">
              Complete Buy & Sell transaction history.
            </p>

          </div>
        </Link>

      </div>

      {/* ============================================== */}
      {/* MARKET INFORMATION */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-yellow-400 mb-6">
          Live Market Information
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-black rounded-2xl p-5 border border-zinc-700">
            <p className="text-gray-400 text-sm mb-2">
              Current Buy Price
            </p>

            <h3 className="text-2xl font-black text-green-400">
              PKR {goldPrice.buyPrice.toLocaleString()}
            </h3>
          </div>

          <div className="bg-black rounded-2xl p-5 border border-zinc-700">
            <p className="text-gray-400 text-sm mb-2">
              Current Sell Price
            </p>

            <h3 className="text-2xl font-black text-red-400">
              PKR {goldPrice.sellPrice.toLocaleString()}
            </h3>
          </div>

          <div className="bg-black rounded-2xl p-5 border border-zinc-700">
            <p className="text-gray-400 text-sm mb-2">
              Average Buy Price
            </p>

            <h3 className="text-2xl font-black text-blue-400">
              PKR {portfolio.averageBuyPrice.toLocaleString()}
            </h3>
          </div>

          <div className="bg-black rounded-2xl p-5 border border-zinc-700">
            <p className="text-gray-400 text-sm mb-2">
              Market Session
            </p>

            <h3 className="text-2xl font-black text-cyan-400">
              {goldPrice.marketStatus}
            </h3>
          </div>

        </div>

      </div>

      {/* ============================================== */}
      {/* ACCOUNT SUMMARY */}
      {/* ============================================== */}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Total Gold Bought</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            {portfolio.totalGoldBuy.toFixed(3)} g
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Total Gold Sold</p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            {portfolio.totalGoldSell.toFixed(3)} g
          </h2>
        </div>

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Total Investment</p>

          <h2 className="text-3xl font-black text-blue-400 mt-2">
            PKR {portfolio.totalInvested.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Portfolio Value</p>

          <h2 className="text-3xl font-black text-purple-400 mt-2">
            PKR {portfolio.portfolioValue.toLocaleString()}
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
            <span className="text-gray-400">Live Buy Price</span>

            <span className="text-green-400 font-bold">
              PKR {goldPrice.buyPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Live Sell Price</span>

            <span className="text-red-400 font-bold">
              PKR {goldPrice.sellPrice.toLocaleString()}
            </span>
          </div>

        </div>

      </div>

      {/* ============================================== */}
      {/* FOOTER */}
      {/* ============================================== */}

      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        <p className="font-semibold text-yellow-400 mb-2">
          GoldTrade V17 Enterprise Dashboard
        </p>

        <p>
          Live Gold Trading • Portfolio • Buy & Sell • Transaction History
        </p>

        <p className="mt-2">
          Powered by GoldTrade Enterprise Backend API
        </p>
      </div>

    </div>
  );
}