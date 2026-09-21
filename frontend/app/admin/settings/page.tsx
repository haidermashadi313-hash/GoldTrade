"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Save,
  Coins,
  DollarSign,
  Wallet,
  ShieldCheck,
} from "lucide-react";

// ========================================
// API URL (Render + Local Safe)
// ========================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://goldtrade-api.onrender.com";

// ========================================
// SETTINGS TYPE
// ========================================

interface MarketSettings {
  buyGoldPrice: number;
  sellGoldPrice: number;
  buyUsdtRate: number;
  sellUsdtRate: number;
  usdToPkr: number;
  goldTradingEnabled: boolean;
  usdtTradingEnabled: boolean;
  marketStatus: boolean;
}

const defaultSettings: MarketSettings = {
  buyGoldPrice: 31250,
  sellGoldPrice: 30980,
  buyUsdtRate: 285,
  sellUsdtRate: 283,
  usdToPkr: 285,
  goldTradingEnabled: true,
  usdtTradingEnabled: true,
  marketStatus: true,
};

export default function AdminSettingsPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [settings, setSettings] =
    useState<MarketSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ========================================
  // LOAD SETTINGS
  // ========================================

  const loadSettings = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/gold/settings`,
        {
          headers,
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSettings({
          buyGoldPrice: data.settings.buyGoldPrice || 31250,
          sellGoldPrice: data.settings.sellGoldPrice || 30980,
          buyUsdtRate: data.settings.buyUsdtRate || 285,
          sellUsdtRate: data.settings.sellUsdtRate || 283,
          usdToPkr: data.settings.usdToPkr || 285,
          goldTradingEnabled:
            data.settings.goldTradingEnabled ?? true,
          usdtTradingEnabled:
            data.settings.usdtTradingEnabled ?? true,
          marketStatus:
            data.settings.marketStatus ?? true,
        });
      }
    } catch (err) {
      console.error("Settings Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadSettings();
  }, []);

  // ========================================
  // SAVE SETTINGS
  // ========================================

  const saveSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch(
        `${API}/api/gold/settings`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Market Settings Updated Successfully.");
      } else {
        alert(data.message || "Update Failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading Market Settings...
      </main>
    );
  }  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <ShieldCheck size={38} />
              GoldTrade Market Settings
            </h1>

            <p className="text-gray-400 mt-2">
              Control Gold prices, USDT rates and trading status.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin-dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <button
              onClick={loadSettings}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </header>

        {/* ================= GOLD PRICE SETTINGS ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Coins className="text-yellow-400" size={28} />
            <h2 className="text-2xl font-black text-yellow-400">
              Gold Price Settings
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div>
              <label className="block text-gray-400 mb-2">
                Gold Buy Price (PKR)
              </label>

              <input
                type="number"
                value={settings.buyGoldPrice}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    buyGoldPrice: Number(e.target.value),
                  })
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">
                Gold Sell Price (PKR)
              </label>

              <input
                type="number"
                value={settings.sellGoldPrice}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sellGoldPrice: Number(e.target.value),
                  })
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none"
              />
            </div>

          </div>
        </section>

        {/* ================= USDT RATE SETTINGS ================= */}

        <section className="bg-zinc-900 border border-blue-500 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <DollarSign className="text-blue-400" size={28} />
            <h2 className="text-2xl font-black text-blue-400">
              USDT Rate Settings
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div>
              <label className="block text-gray-400 mb-2">
                USDT Buy Rate (PKR)
              </label>

              <input
                type="number"
                value={settings.buyUsdtRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    buyUsdtRate: Number(e.target.value),
                  })
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-2">
                USDT Sell Rate (PKR)
              </label>

              <input
                type="number"
                value={settings.sellUsdtRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    sellUsdtRate: Number(e.target.value),
                  })
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
              />
            </div>

          </div>
        </section>

        {/* ================= USD TO PKR RATE ================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Wallet className="text-green-400" size={28} />
            <h2 className="text-2xl font-black text-green-400">
              USD 鈫?PKR Exchange Rate
            </h2>
          </div>

          <div>
            <label className="block text-gray-400 mb-2">
              1 USD = PKR
            </label>

            <input
              type="number"
              value={settings.usdToPkr}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  usdToPkr: Number(e.target.value),
                })
              }
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
            />
          </div>
        </section>

        {/* ================= TRADING SWITCHES ================= */}

        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6 space-y-6">
          <h2 className="text-2xl font-black text-purple-400">
            Trading Controls
          </h2>

          {/* Gold Trading */}
          <div className="flex justify-between items-center bg-black rounded-xl p-4 border border-zinc-700">
            <div>
              <p className="font-semibold text-white">
                Gold Trading
              </p>
              <p className="text-sm text-gray-400">
                Enable or disable Gold Buy/Sell.
              </p>
            </div>

            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  goldTradingEnabled:
                    !settings.goldTradingEnabled,
                })
              }
              className={`px-5 py-2 rounded-full font-bold ${
                settings.goldTradingEnabled
                  ? "bg-green-600"
                  : "bg-red-600"
              }`}
            >
              {settings.goldTradingEnabled
                ? "Enabled"
                : "Disabled"}
            </button>
          </div>

          {/* USDT Trading */}
          <div className="flex justify-between items-center bg-black rounded-xl p-4 border border-zinc-700">
            <div>
              <p className="font-semibold text-white">
                USDT Trading
              </p>
              <p className="text-sm text-gray-400">
                Enable or disable USDT Buy/Sell.
              </p>
            </div>

            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  usdtTradingEnabled:
                    !settings.usdtTradingEnabled,
                })
              }
              className={`px-5 py-2 rounded-full font-bold ${
                settings.usdtTradingEnabled
                  ? "bg-green-600"
                  : "bg-red-600"
              }`}
            >
              {settings.usdtTradingEnabled
                ? "Enabled"
                : "Disabled"}
            </button>
          </div>

          {/* Market Status */}
          <div className="flex justify-between items-center bg-black rounded-xl p-4 border border-zinc-700">
            <div>
              <p className="font-semibold text-white">
                Complete Market Status
              </p>
              <p className="text-sm text-gray-400">
                Open or close the entire trading market.
              </p>
            </div>

            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  marketStatus: !settings.marketStatus,
                })
              }
              className={`px-5 py-2 rounded-full font-bold ${
                settings.marketStatus
                  ? "bg-green-600"
                  : "bg-red-600"
              }`}
            >
              {settings.marketStatus
                ? "Market Open"
                : "Market Closed"}
            </button>
          </div>

        </section>        {/* ================= LIVE MARKET PREVIEW ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            Live Market Preview
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black rounded-xl p-5 border border-yellow-500">
              <p className="text-gray-400 text-sm">Gold Buy Price</p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                Pkr {settings.buyGoldPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-orange-500">
              <p className="text-gray-400 text-sm">Gold Sell Price</p>

              <h3 className="text-3xl font-black text-orange-400 mt-2">
                Pkr {settings.sellGoldPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-blue-500">
              <p className="text-gray-400 text-sm">Gold Spread</p>

              <h3 className="text-3xl font-black text-blue-400 mt-2">
                PKR{" "}
                {(
                  settings.buyGoldPrice -
                  settings.sellGoldPrice
                ).toLocaleString()}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-cyan-500">
              <p className="text-gray-400 text-sm">USDT Buy Rate</p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                PKR {settings.buyUsdtRate}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-purple-500">
              <p className="text-gray-400 text-sm">USDT Sell Rate</p>

              <h3 className="text-3xl font-black text-purple-400 mt-2">
                PKR {settings.sellUsdtRate}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm">USD 鈫?PKR Rate</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR {settings.usdToPkr}
              </h3>
            </div>

          </div>
        </section>

        {/* ================= MARKET STATUS SUMMARY ================= */}

        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-purple-400 mb-5">
            Current Trading Status
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div
              className={`rounded-xl p-5 border ${
                settings.goldTradingEnabled
                  ? "bg-green-950 border-green-500"
                  : "bg-red-950 border-red-500"
              }`}
            >
              <p className="text-gray-300 text-sm">
                Gold Trading
              </p>

              <h3
                className={`text-2xl font-black mt-2 ${
                  settings.goldTradingEnabled
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {settings.goldTradingEnabled
                  ? "Enabled"
                  : "Disabled"}
              </h3>
            </div>

            <div
              className={`rounded-xl p-5 border ${
                settings.usdtTradingEnabled
                  ? "bg-green-950 border-green-500"
                  : "bg-red-950 border-red-500"
              }`}
            >
              <p className="text-gray-300 text-sm">
                USDT Trading
              </p>

              <h3
                className={`text-2xl font-black mt-2 ${
                  settings.usdtTradingEnabled
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {settings.usdtTradingEnabled
                  ? "Enabled"
                  : "Disabled"}
              </h3>
            </div>

            <div
              className={`rounded-xl p-5 border ${
                settings.marketStatus
                  ? "bg-green-950 border-green-500"
                  : "bg-red-950 border-red-500"
              }`}
            >
              <p className="text-gray-300 text-sm">
                Complete Market
              </p>

              <h3
                className={`text-2xl font-black mt-2 ${
                  settings.marketStatus
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {settings.marketStatus
                  ? "OPEN"
                  : "CLOSED"}
              </h3>
            </div>

          </div>
        </section>

        {/* ================= SAVE SETTINGS BUTTON ================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:text-gray-400 py-4 rounded-xl text-xl font-bold flex items-center justify-center gap-3 transition"
          >
            <Save size={22} />

            {saving
              ? "Saving Market Settings..."
              : "Save Market Settings"}
          </button>

          <p className="text-center text-gray-400 mt-4 text-sm">
            Changes will update Gold and USDT prices across the entire GoldTrade platform instantly.
          </p>
        </section>

        {/* ================= ADMIN NOTES ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Admin Notes
          </h2>

          <div className="space-y-4 text-gray-300">

            <div className="flex items-start gap-3">
              <ShieldCheck
                className="text-green-400 mt-1"
                size={20}
              />
              <p>
                Gold Buy and Sell prices update immediately on the user dashboard.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck
                className="text-green-400 mt-1"
                size={20}
              />
              <p>
                USDT Buy and Sell rates are applied instantly for all users.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck
                className="text-green-400 mt-1"
                size={20}
              />
              <p>
                Turning Market Status OFF blocks Gold and USDT trading across the platform.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck
                className="text-green-400 mt-1"
                size={20}
              />
              <p>
                Trading switches affect Buy, Sell, Wallet and Dashboard pages instantly after saving.
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}


