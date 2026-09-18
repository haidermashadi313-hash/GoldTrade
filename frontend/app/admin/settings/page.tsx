"use client";

// ======================================================
// GoldTrade V18 - Admin Settings Page (PART 1/4)
// ======================================================

import { useEffect, useState } from "react";
import {
  Save,
  RotateCcw,
  RefreshCw,
  DollarSign,
  Gem,
  Globe,
  Power,
  ShieldCheck,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ======================================================
// TYPES
// ======================================================

interface GoldSettings {
  buyGoldPrice: number;
  sellGoldPrice: number;
  goldPriceUSD: number;
  UsdtoPkr: number;
  goldTradingEnabled: boolean;
  marketStatus: "OPEN" | "CLOSED";
  maintenanceMode: boolean;
  updatedAt?: string;
}

export default function AdminSettingsPage() {
  // ======================================================
  // STATES
  // ======================================================

  const [token, setToken] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const [settings, setSettings] = useState<GoldSettings>({
    buyGoldPrice: 0,
    sellGoldPrice: 0,
    goldPriceUSD: 0,
    UsdtoPkr: 0,
    goldTradingEnabled: true,
    marketStatus: "OPEN",
    maintenanceMode: false,
  });

  // ======================================================
  // AUTH HEADER
  // ======================================================

  const getAdminHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  // ======================================================
  // LOAD TOKEN
  // ======================================================

  useEffect(() => {
    const jwt = localStorage.getItem("token");

    if (!jwt) {
      window.location.href = "/login";
      return;
    }

    setToken(jwt);
  }, []);
    // ======================================================
  // LOAD SETTINGS FROM BACKEND
  // ======================================================

  const loadSettings = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch(`${API}/api/settings`, {
        method: "GET",
        headers: getAdminHeaders(),
        cache: "no-store",
      });

      const result = await response.json();

      console.log("SETTINGS RESPONSE:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load settings.");
      }

      setSettings(result.settings);
    } catch (err: any) {
      console.error("LOAD SETTINGS ERROR:", err);

      setMessageType("error");
      setMessage(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // SAVE SETTINGS
  // ======================================================

  const saveSettings = async () => {
    if (!token) return;

    try {
      setSaving(true);

      const response = await fetch(`${API}/api/settings/update`, {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify(settings),
      });

      const result = await response.json();

      console.log("SAVE SETTINGS:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save settings.");
      }

      setSettings(result.settings);

      setMessageType("success");
      setMessage("Settings saved successfully.");
    } catch (err: any) {
      console.error("SAVE SETTINGS ERROR:", err);

      setMessageType("error");
      setMessage(err.message || "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // RESET DEFAULT SETTINGS
  // ======================================================

  const resetSettings = async () => {
    if (!token) return;

    const confirmReset = window.confirm(
      "Reset GoldTrade settings to default values?"
    );

    if (!confirmReset) return;

    try {
      const response = await fetch(`${API}/api/settings/reset`, {
        method: "POST",
        headers: getAdminHeaders(),
      });

      const result = await response.json();

      console.log("RESET SETTINGS:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to reset settings.");
      }

      setSettings(result.settings);

      setMessageType("success");
      setMessage("Default settings restored.");
    } catch (err: any) {
      console.error("RESET SETTINGS ERROR:", err);

      setMessageType("error");
      setMessage(err.message || "Unable to reset settings.");
    }
  };

  // ======================================================
  // REFRESH DATA
  // ======================================================

  const refreshData = () => {
    loadSettings();
  };

  // ======================================================
  // AUTO LOAD SETTINGS AFTER TOKEN
  // ======================================================

  useEffect(() => {
    if (token) {
      loadSettings();
    }
  }, [token]);
    // ======================================================
  // INPUT CHANGE HANDLER
  // ======================================================

  const updateField = (
    field: keyof GoldSettings,
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ======================================================
  // MARKET OPEN / CLOSE
  // ======================================================

  const toggleMarket = () => {
    setSettings((prev) => ({
      ...prev,
      marketStatus:
        prev.marketStatus === "OPEN" ? "CLOSED" : "OPEN",
    }));
  };

  // ======================================================
  // GOLD TRADING ENABLE / DISABLE
  // ======================================================

  const toggleTrading = () => {
    setSettings((prev) => ({
      ...prev,
      goldTradingEnabled: !prev.goldTradingEnabled,
    }));
  };

  // ======================================================
  // MAINTENANCE MODE
  // ======================================================

  const toggleMaintenance = () => {
    setSettings((prev) => ({
      ...prev,
      maintenanceMode: !prev.maintenanceMode,
    }));
  };

  // ======================================================
  // CLEAR SUCCESS / ERROR MESSAGE
  // ======================================================

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  // ======================================================
  // LOADING SCREEN
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <RefreshCw className="animate-spin text-yellow-400 mx-auto" size={42} />
          <h2 className="text-2xl font-bold text-yellow-400">
            Loading GoldTrade Settings...
          </h2>
        </div>
      </div>
    );
  }
    // ======================================================
  // PAGE UI START (FINAL V18)
  // ======================================================

  return (
    <div className="min-h-screen bg-black text-white p-6">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">

        <div>
          <h1 className="text-4xl font-black text-yellow-400">
            GoldTrade Settings
          </h1>

          <p className="text-gray-400 mt-2">
            GoldTrade V18 • Market Control Center
          </p>
        </div>

        <button
          onClick={refreshData}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Refresh
        </button>

      </div>

      {/* ================= MESSAGE ================= */}
      {message && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 font-semibold ${
            messageType === "success"
              ? "bg-green-600/20 border border-green-500 text-green-400"
              : "bg-red-600/20 border border-red-500 text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      {/* ================= PRICE CARDS ================= */}
      <div className="grid lg:grid-cols-4 gap-5 mb-10">

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
          <Gem className="text-yellow-400 mb-3" size={30} />
          <p className="text-gray-400 text-sm">Gold buy Price</p>
          <h2 className="text-2xl font-black text-yellow-400">
            Pkr {Number(settings.buyGoldPrice).toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">
          <Gem className="text-green-400 mb-3" size={30} />
          <p className="text-gray-400 text-sm">Gold sell Price</p>
          <h2 className="text-2xl font-black text-green-400">
            Pkr {Number(settings.sellGoldPrice).toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-5">
          <DollarSign className="text-cyan-400 mb-3" size={30} />
          <p className="text-gray-400 text-sm">Gold Price (USD)</p>
          <h2 className="text-2xl font-black text-cyan-400">
            ${Number(settings.goldPriceUSD).toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-5">
          <Globe className="text-purple-400 mb-3" size={30} />
          <p className="text-gray-400 text-sm">USD → Pkr</p>
          <h2 className="text-2xl font-black text-purple-400">
            {Number(settings.UsdtoPkr).toLocaleString()}
          </h2>
        </div>

      </div>

      {/* ================= SETTINGS FORM ================= */}
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

        <h2 className="text-2xl font-black text-yellow-400 mb-6">
          Gold Market Configuration
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          {/* buy Price */}
          <div>
            <label className="text-yellow-400 text-sm font-semibold block mb-2">
              Gold buy Price (Pkr)
            </label>

            <input
              type="number"
              value={settings.buyGoldPrice}
              onChange={(e) =>
                updateField("buyGoldPrice", Number(e.target.value))
              }
              className="w-full bg-black border border-yellow-500 rounded-xl px-4 py-3 outline-none text-white focus:border-yellow-400"
            />
          </div>

          {/* sell Price */}
          <div>
            <label className="text-green-400 text-sm font-semibold block mb-2">
              Gold sell Price (Pkr)
            </label>

            <input
              type="number"
              value={settings.sellGoldPrice}
              onChange={(e) =>
                updateField("sellGoldPrice", Number(e.target.value))
              }
              className="w-full bg-black border border-green-500 rounded-xl px-4 py-3 outline-none text-white focus:border-green-400"
            />
          </div>

          {/* USD Price */}
          <div>
            <label className="text-cyan-400 text-sm font-semibold block mb-2">
              Gold Price USD
            </label>

            <input
              type="number"
              step="0.01"
              value={settings.goldPriceUSD}
              onChange={(e) =>
                updateField("goldPriceUSD", Number(e.target.value))
              }
              className="w-full bg-black border border-cyan-500 rounded-xl px-4 py-3 outline-none text-white focus:border-cyan-400"
            />
          </div>

          {/* USD Pkr */}
          <div>
            <label className="text-purple-400 text-sm font-semibold block mb-2">
              USD → Pkr Rate
            </label>

            <input
              type="number"
              step="0.01"
              value={settings.UsdtoPkr}
              onChange={(e) =>
                updateField("UsdtoPkr", Number(e.target.value))
              }
              className="w-full bg-black border border-purple-500 rounded-xl px-4 py-3 outline-none text-white focus:border-purple-400"
            />
          </div>

        </div>

      </div>

      {/* ================= TOGGLE SWITCHES ================= */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">

        {/* Market Status */}
        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-5">

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-blue-400">Market Status</h3>

            <Power size={22} className="text-blue-400" />
          </div>

          <p className="text-sm text-gray-400 mb-4">
            Current Status
          </p>

          <button
            onClick={toggleMarket}
            className={`w-full py-3 rounded-xl font-bold transition ${
              settings.marketStatus === "OPEN"
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-red-600 hover:bg-red-500 text-white"
            }`}
          >
            {settings.marketStatus}
          </button>

        </div>

        {/* Trading */}
        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-green-400">
              Gold Trading
            </h3>

            <ShieldCheck size={22} className="text-green-400" />
          </div>

          <p className="text-sm text-gray-400 mb-4">
            Trading Permission
          </p>

          <button
            onClick={toggleTrading}
            className={`w-full py-3 rounded-xl font-bold transition ${
              settings.goldTradingEnabled
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-zinc-700 hover:bg-zinc-600 text-white"
            }`}
          >
            {settings.goldTradingEnabled ? "ENABLED" : "DISABLED"}
          </button>

        </div>

        {/* Maintenance */}
        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-5">

          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-red-400">
              Maintenance Mode
            </h3>

            <Power size={22} className="text-red-400" />
          </div>

          <p className="text-sm text-gray-400 mb-4">
            Website Maintenance
          </p>

          <button
            onClick={toggleMaintenance}
            className={`w-full py-3 rounded-xl font-bold transition ${
              settings.maintenanceMode
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-zinc-700 hover:bg-zinc-600 text-white"
            }`}
          >
            {settings.maintenanceMode ? "ACTIVE" : "OFF"}
          </button>

        </div>

      </div>

      {/* ================= ACTION BUTTONS ================= */}
      <div className="flex flex-wrap gap-4">

        <button
          onClick={saveSettings}
          disabled={saving}
          className="bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-700 text-black font-black px-8 py-4 rounded-2xl flex items-center gap-3"
        >
          <Save size={20} />
          {saving ? "Saving..." : "Save Settings"}
        </button>

        <button
          onClick={resetSettings}
          className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-2xl flex items-center gap-3"
        >
          <RotateCcw size={20} />
          Reset Default
        </button>

      </div>

      {/* ================= LAST UPDATE ================= */}
      <div className="mt-10 text-sm text-gray-500 border-t border-zinc-800 pt-5">
        Last Updated:{" "}
        {settings.updatedAt
          ? new Date(settings.updatedAt).toLocaleString()
          : "Never"}
      </div>

    </div>
  );
}