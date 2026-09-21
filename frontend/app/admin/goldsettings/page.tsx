"use client";

/*
=========================================================
 GoldTrade V18 Enterprise
 Admin Gold Settings Page
 Section 1/4
 Linux + Vercel + TypeScript Safe
=========================================================
*/

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  Coins,
  DollarSign,
  Globe,
  RefreshCw,
  Save,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";

// ======================================================
// API URL
// ======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ======================================================
// TYPES
// ======================================================

interface GoldSettings {
  [x: string]:
  /*
  =========================================================
   GoldTrade V18 Enterprise
   Admin Gold Settings Page
   Section 1/4
   Linux + Vercel + TypeScript Safe
  =========================================================
  */
  any /*
=========================================================
 GoldTrade V18 Enterprise
 Admin Gold Settings Page
 Section 1/4
 Linux + Vercel + TypeScript Safe
=========================================================
*/;
  buyGoldPrice: number;
  sellGoldPrice: number;
  goldPriceUSD: number;
  usdToPkr: number;

  goldTradingEnabled: boolean;
  marketStatus: "OPEN" | "CLOSED";

  marketMessage: string;

  minimumBuyGram: number;
  maximumBuyGram: number;

  minimumSellGram: number;
  maximumSellGram: number;
}

// ======================================================
// COMPONENT
// ======================================================

export default function GoldSettingsPage() {
  // ===========================================
  // PAGE STATE
  // ===========================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ===========================================
  // SETTINGS STATE
  // ===========================================

  const [settings, setSettings] = useState<GoldSettings>({
    buyGoldPrice: 32500,
    sellGoldPrice: 31900,

    goldPriceUSD: 3420,
    usdToPkr: 285.5,

    goldTradingEnabled: true,
    marketStatus: "OPEN",

    marketMessage: "Gold Market is Open",

    minimumBuyGram: 0.01,
    maximumBuyGram: 1000,

    minimumSellGram: 0.01,
    maximumSellGram: 1000,
  });

  // ===========================================
  // AUTH HEADER
  // ===========================================

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // ===========================================
  // LOAD SETTINGS
  // ===========================================

  const loadSettings = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `${API}/api/gold/settings`,
        {
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load Gold Market settings."
        );
      }

      setSettings({
        buyGoldPrice: data.settings.buyGoldPrice,
        sellGoldPrice: data.settings.sellGoldPrice,

        goldPriceUSD: data.settings.goldPriceUSD,
        usdToPkr: data.settings.usdToPkr,

        goldTradingEnabled: data.settings.goldTradingEnabled,
        marketStatus: data.settings.marketStatus,

        marketMessage: data.settings.marketMessage,

        minimumBuyGram: data.settings.minimumBuyGram,
        maximumBuyGram: data.settings.maximumBuyGram,

        minimumSellGram: data.settings.minimumSellGram,
        maximumSellGram: data.settings.maximumSellGram,
      });
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error.message || "Failed to load Gold Market settings."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // SAVE SETTINGS
  // ===========================================

  const saveSettings = async () => {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(
        `${API}/api/gold/settings`,
        {
          method: "PUT",
          headers: getHeaders(),

          body: JSON.stringify({
            ...settings,
            updateReason: "Admin updated Gold Market Settings",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save settings."
        );
      }

      setSuccessMessage(
        "Gold Market settings updated successfully."
      );

      loadSettings();
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error.message || "Failed to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===========================================
  // LOAD PAGE
  // ===========================================

  useEffect(() => {
    loadSettings();
  }, []);
    // ======================================================
  // LOADING SCREEN
  // ======================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-4 text-cyan-400 text-xl font-bold">
          <RefreshCw className="animate-spin" size={30} />
          Loading USDT Market Settings...
        </div>
      </main>
    );
  }

  // ======================================================
  // PAGE START
  // ======================================================

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-cyan-400">
              <Wallet size={38} />
              USDT Market Settings
            </h1>

            <p className="text-gray-400 mt-2">
              Configure live USDT market rates, trading status and limits.
            </p>

          </div>

          <div className="flex gap-3 flex-wrap">

            <Link
              href="/admin-dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 transition px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <button
              type="button"
              onClick={loadSettings}
              disabled={loading}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-700 disabled:cursor-not-allowed text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />

              Refresh
            </button>

          </div>

        </header>

        {/* ================================================= */}
        {/* SUCCESS / ERROR MESSAGE */}
        {/* ================================================= */}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 rounded-xl p-4 font-semibold">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-xl p-4 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* ================================================= */}
        {/* LIVE USDT PRICE CARDS */}
        {/* ================================================= */}

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* BUY PRICE */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                Buy USDT Price
              </p>

              <TrendingUp className="text-cyan-400" size={24} />

            </div>

            <h2 className="text-3xl font-black text-cyan-400 mt-3">
              PKR {settings.buyUsdtPrice.toLocaleString()}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              User Buy Rate
            </p>

          </div>

          {/* SELL PRICE */}

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                Sell USDT Price
              </p>

              <DollarSign className="text-green-400" size={24} />

            </div>

            <h2 className="text-3xl font-black text-green-400 mt-3">
              PKR {settings.sellUsdtPrice.toLocaleString()}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              User Sell Rate
            </p>

          </div>

          {/* USD PRICE */}

          <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                USDT USD Price
              </p>

              <Globe className="text-blue-400" size={24} />

            </div>

            <h2 className="text-3xl font-black text-blue-400 mt-3">
              ${settings.usdtPriceUSD.toFixed(2)}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Global Market Price
            </p>

          </div>

          {/* USD TO PKR */}

          <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                USD → PKR
              </p>

              <Globe className="text-purple-400" size={24} />

            </div>

            <h2 className="text-3xl font-black text-purple-400 mt-3">
              {settings.usdToPkr}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Exchange Rate
            </p>

          </div>

        </section>

        {/* ================================================= */}
        {/* LIVE MARKET STATUS */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <div className="flex flex-wrap justify-between items-center gap-5">

            <div>

              <h2 className="flex items-center gap-3 text-2xl font-black text-cyan-400">
                <ShieldCheck size={28} />
                Live USDT Market Status
              </h2>

              <p className="text-gray-400 mt-2">
                Current trading status across GoldTrade V18 Enterprise.
              </p>

            </div>

            <div className="flex gap-3 flex-wrap">

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  settings.marketStatus === "OPEN"
                    ? "bg-green-500/20 text-green-400 border border-green-500"
                    : "bg-red-500/20 text-red-400 border border-red-500"
                }`}
              >
                Market {settings.marketStatus}
              </span>

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  settings.goldTradingEnabled
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500"
                    : "bg-red-500/20 text-red-400 border border-red-500"
                }`}
              >
                Trading {settings.goldTradingEnabled ? "Enabled" : "Disabled"}
              </span>

            </div>

          </div>

          {/* MARKET MESSAGE */}

          <div className="mt-6 bg-black border border-zinc-700 rounded-xl p-5">

            <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">
              Market Message Preview
            </p>

            <p className="text-xl font-bold text-cyan-300">
              {settings.marketMessage}
            </p>

          </div>

        </section>


  
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <Coins size={38} />
              Gold Market Settings
            </h1>

            <p className="mt-2 text-gray-400">
              Enterprise Gold Market configuration for GoldTrade V18.
            </p>

          </div>

          <div className="flex gap-3 flex-wrap">

            <Link
              href="/admin-dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <button
              type="button"
              onClick={loadSettings}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

          </div>

        </header>

        {/* ================================================= */}
        {/* SUCCESS MESSAGE */}
        {/* ================================================= */}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500 rounded-xl p-4 text-green-400 font-semibold">
            {successMessage}
          </div>
        )}

        {/* ================================================= */}
        {/* ERROR MESSAGE */}
        {/* ================================================= */}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 text-red-400 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* ================================================= */}
        {/* LIVE MARKET SUMMARY CARDS */}
        {/* ================================================= */}

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* BUY PRICE */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                Buy Gold Price
              </p>

              <Coins className="text-yellow-400" size={24} />

            </div>

            <h2 className="text-3xl font-black text-yellow-400 mt-3">
              PKR {settings.buyGoldPrice.toLocaleString()}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Price per gram
            </p>

          </div>

          {/* SELL PRICE */}

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                Sell Gold Price
              </p>

              <TrendingUp className="text-green-400" size={24} />

            </div>

            <h2 className="text-3xl font-black text-green-400 mt-3">
              PKR {settings.sellGoldPrice.toLocaleString()}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Price per gram
            </p>

          </div>

          {/* GOLD USD */}

          <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                Gold USD Price
              </p>

              <DollarSign className="text-blue-400" size={24} />

            </div>

            <h2 className="text-3xl font-black text-blue-400 mt-3">
              ${settings.goldPriceUSD.toLocaleString()}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              International market price
            </p>

          </div>

          {/* USD TO PKR */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

            <div className="flex items-center justify-between">

              <p className="text-gray-400 text-sm">
                USD → PKR Rate
              </p>

              <Globe className="text-cyan-400" size={24} />

            </div>

            <h2 className="text-3xl font-black text-cyan-400 mt-3">
              {settings.usdToPkr}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Exchange rate
            </p>

          </div>

        </section>

        {/* ================================================= */}
        {/* MARKET STATUS PANEL */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">

          <div className="flex flex-wrap justify-between items-center gap-5">

            <div>

              <h2 className="flex items-center gap-3 text-2xl font-black text-yellow-400">
                <ShieldCheck size={28} />
                Gold Market Status
              </h2>

              <p className="text-gray-400 mt-2">
                Current trading status and market visibility.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  settings.marketStatus === "OPEN"
                    ? "bg-green-500/20 text-green-400 border border-green-500"
                    : "bg-red-500/20 text-red-400 border border-red-500"
                }`}
              >
                Market {settings.marketStatus}
              </span>

              <span
                className={`px-4 py-2 rounded-full font-bold ${
                  settings.goldTradingEnabled
                    ? "bg-green-500/20 text-green-400 border border-green-500"
                    : "bg-red-500/20 text-red-400 border border-red-500"
                }`}
              >
                Trading {settings.goldTradingEnabled ? "Enabled" : "Disabled"}
              </span>

            </div>

          </div>

          <div className="mt-5 bg-black rounded-xl border border-zinc-800 p-4">

            <p className="text-xs uppercase tracking-widest text-gray-500">
              Market Message
            </p>

            <p className="text-lg font-semibold text-yellow-300 mt-2">
              {settings.marketMessage}
            </p>

          </div>

        </section>
                <section className="grid lg:grid-cols-2 gap-6">

          {/* ================================================ */}
          {/* PRICE SETTINGS */}
          {/* ================================================ */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6 space-y-5">

            <h2 className="flex items-center gap-2 text-2xl font-black text-yellow-400">
              <Coins size={26} />
              Gold Price Settings
            </h2>

            {/* BUY PRICE */}

            <div>
              <label className="block mb-2 text-yellow-400 font-semibold">
                Buy Gold Price (PKR / Gram)
              </label>

              <input
                type="number"
                value={settings.buyGoldPrice}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    buyGoldPrice: Number(e.target.value),
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            {/* SELL PRICE */}

            <div>
              <label className="block mb-2 text-green-400 font-semibold">
                Sell Gold Price (PKR / Gram)
              </label>

              <input
                type="number"
                value={settings.sellGoldPrice}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    sellGoldPrice: Number(e.target.value),
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-green-500"
              />
            </div>

            {/* USD PRICE */}

            <div>
              <label className="block mb-2 text-blue-400 font-semibold">
                Gold Price USD
              </label>

              <input
                type="number"
                value={settings.goldPriceUSD}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    goldPriceUSD: Number(e.target.value),
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            {/* USD RATE */}

            <div>
              <label className="block mb-2 text-cyan-400 font-semibold">
                USD → PKR Exchange Rate
              </label>

              <input
                type="number"
                step="0.01"
                value={settings.usdToPkr}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    usdToPkr: Number(e.target.value),
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-500"
              />
            </div>

          </div>

          {/* ================================================ */}
          {/* MARKET CONTROL */}
          {/* ================================================ */}

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6 space-y-5">

            <h2 className="flex items-center gap-2 text-2xl font-black text-green-400">
              <ShieldCheck size={26} />
              Market Control
            </h2>

            {/* TRADING SWITCH */}

            <div className="bg-black border border-zinc-700 rounded-xl p-4 flex justify-between items-center">

              <div>
                <p className="font-bold text-white">
                  Gold Trading
                </p>

                <p className="text-sm text-gray-500">
                  Enable or disable Gold trading platform-wide.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    goldTradingEnabled: !prev.goldTradingEnabled,
                  }))
                }
                className={`px-5 py-2 rounded-xl font-bold transition ${
                  settings.goldTradingEnabled
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {settings.goldTradingEnabled
                  ? "Enabled"
                  : "Disabled"}
              </button>

            </div>

            {/* MARKET STATUS */}

            <div>
              <label className="block mb-2 text-yellow-400 font-semibold">
                Market Status
              </label>

              <select
                value={settings.marketStatus}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    marketStatus: e.target.value as "OPEN" | "CLOSED",
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              >
                <option value="OPEN">
                  OPEN
                </option>

                <option value="CLOSED">
                  CLOSED
                </option>

              </select>
            </div>

            {/* MARKET MESSAGE */}

            <div>
              <label className="block mb-2 text-cyan-400 font-semibold">
                Market Message
              </label>

              <textarea
                rows={4}
                value={settings.marketMessage}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    marketMessage: e.target.value,
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none resize-none focus:border-cyan-500"
                placeholder="Gold Market is Open..."
              />
            </div>

            {/* PREVIEW */}

            <div className="bg-black border border-zinc-700 rounded-xl p-4">

              <p className="text-xs uppercase tracking-wider text-gray-500">
                Live Preview
              </p>

              <p className="text-lg font-bold text-yellow-300 mt-2">
                {settings.marketMessage}
              </p>

              <div className="flex gap-3 mt-4 flex-wrap">

                <span
                  className={`px-3 py-2 rounded-full text-sm font-bold ${
                    settings.marketStatus === "OPEN"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {settings.marketStatus}
                </span>

                <span
                  className={`px-3 py-2 rounded-full text-sm font-bold ${
                    settings.goldTradingEnabled
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  Trading {settings.goldTradingEnabled ? "ON" : "OFF"}
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* BUY & SELL LIMIT SETTINGS */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-blue-500 rounded-2xl p-6">

          <h2 className="flex items-center gap-2 text-2xl font-black text-blue-400 mb-6">
            <Globe size={26} />
            Gold Trading Limits
          </h2>

          <div className="grid md:grid-cols-2 gap-5">

            {/* MIN BUY */}

            <div>

              <label className="block mb-2 text-yellow-400 font-semibold">
                Minimum Buy (Gram)
              </label>

              <input
                type="number"
                step="0.01"
                value={settings.minimumBuyGram}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    minimumBuyGram: Number(e.target.value),
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              />

            </div>

            {/* MAX BUY */}

            <div>

              <label className="block mb-2 text-yellow-400 font-semibold">
                Maximum Buy (Gram)
              </label>

              <input
                type="number"
                step="0.01"
                value={settings.maximumBuyGram}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    maximumBuyGram: Number(e.target.value),
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              />

            </div>

            {/* MIN SELL */}

            <div>

              <label className="block mb-2 text-green-400 font-semibold">
                Minimum Sell (Gram)
              </label>

              <input
                type="number"
                step="0.01"
                value={settings.minimumSellGram}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    minimumSellGram: Number(e.target.value),
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-green-500"
              />

            </div>

            {/* MAX SELL */}

            <div>

              <label className="block mb-2 text-green-400 font-semibold">
                Maximum Sell (Gram)
              </label>

              <input
                type="number"
                step="0.01"
                value={settings.maximumSellGram}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    maximumSellGram: Number(e.target.value),
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-green-500"
              />

            </div>

          </div>

          {/* LIMIT PREVIEW */}

          <div className="grid md:grid-cols-2 gap-4 mt-6">

            <div className="bg-black border border-yellow-500 rounded-xl p-4">

              <p className="text-gray-400 text-sm">
                Buy Range
              </p>

              <h3 className="text-xl font-black text-yellow-400 mt-2">
                {settings.minimumBuyGram}g — {settings.maximumBuyGram}g
              </h3>

            </div>

            <div className="bg-black border border-green-500 rounded-xl p-4">

              <p className="text-gray-400 text-sm">
                Sell Range
              </p>

              <h3 className="text-xl font-black text-green-400 mt-2">
                {settings.minimumSellGram}g — {settings.maximumSellGram}g
              </h3>

            </div>

          </div>

        </section>
                <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-yellow-400 mb-6">
            Live Gold Market Summary
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-black border border-yellow-500 rounded-xl p-4">
              <p className="text-gray-500 text-sm">Buy Price</p>

              <h3 className="text-2xl font-black text-yellow-400 mt-2">
                PKR {settings.buyGoldPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-green-500 rounded-xl p-4">
              <p className="text-gray-500 text-sm">Sell Price</p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {settings.sellGoldPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-blue-500 rounded-xl p-4">
              <p className="text-gray-500 text-sm">Gold USD</p>

              <h3 className="text-2xl font-black text-blue-400 mt-2">
                ${settings.goldPriceUSD.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-cyan-500 rounded-xl p-4">
              <p className="text-gray-500 text-sm">USD → PKR</p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                {settings.usdToPkr}
              </h3>
            </div>

          </div>

          {/* MARKET STATUS SUMMARY */}

          <div className="grid md:grid-cols-2 gap-5 mt-6">

            <div className="bg-black border border-zinc-700 rounded-xl p-4">

              <p className="text-gray-500 text-sm mb-2">
                Trading Status
              </p>

              <span
                className={`inline-flex px-4 py-2 rounded-full font-bold ${
                  settings.goldTradingEnabled
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {settings.goldTradingEnabled
                  ? "Trading Enabled"
                  : "Trading Disabled"}
              </span>

            </div>

            <div className="bg-black border border-zinc-700 rounded-xl p-4">

              <p className="text-gray-500 text-sm mb-2">
                Market Status
              </p>

              <span
                className={`inline-flex px-4 py-2 rounded-full font-bold ${
                  settings.marketStatus === "OPEN"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {settings.marketStatus}
              </span>

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* SAVE SETTINGS BUTTON */}
        {/* ================================================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-green-400 mb-5">
            Save Gold Market Settings
          </h2>

          <p className="text-gray-400 mb-6">
            Changes will immediately update Gold Buy/Sell prices and market
            status across the GoldTrade V18 platform.
          </p>

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-700 disabled:cursor-not-allowed text-black py-4 rounded-xl flex items-center justify-center gap-3 text-lg font-black transition"
          >
            {saving ? (
              <>
                <RefreshCw className="animate-spin" size={22} />
                Saving Gold Market...
              </>
            ) : (
              <>
                <Save size={22} />
                Save Gold Market Settings
              </>
            )}
          </button>

        </section>

        {/* ================================================= */}
        {/* ENTERPRISE INFORMATION */}
        {/* ================================================= */}

        <section className="grid md:grid-cols-3 gap-5">

          <div className="bg-zinc-900 border border-yellow-500 rounded-xl p-5">

            <Coins className="text-yellow-400 mb-3" size={30} />

            <h3 className="font-bold text-yellow-400 mb-2">
              Live Gold Pricing
            </h3>

            <p className="text-sm text-gray-400">
              Buy and Sell prices are controlled by Admin and applied instantly
              to every GoldTrade transaction.
            </p>

          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-xl p-5">

            <ShieldCheck className="text-green-400 mb-3" size={30} />

            <h3 className="font-bold text-green-400 mb-2">
              Trading Protection
            </h3>

            <p className="text-sm text-gray-400">
              Market can be opened or closed without restarting the backend.
              Trading can also be disabled instantly.
            </p>

          </div>

          <div className="bg-zinc-900 border border-cyan-500 rounded-xl p-5">

            <Globe className="text-cyan-400 mb-3" size={30} />

            <h3 className="font-bold text-cyan-400 mb-2">
              Enterprise Settings
            </h3>

            <p className="text-sm text-gray-400">
              All settings are stored securely in MongoDB and synchronized with
              Gold Portfolio, Buy/Sell Engine and Admin Dashboard.
            </p>

          </div>

        </section>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <footer className="border-t border-zinc-800 pt-6 text-center">

          <p className="text-yellow-500 font-bold text-lg">
            GoldTrade V18 Enterprise — Gold Market Settings
          </p>

          <p className="text-gray-500 text-sm mt-2">
            Linux Safe • TypeScript Safe • Render Ready • Vercel Ready
          </p>

        </footer>

      </div>
    </main>
  );
}