"use client";

// =====================================================
// GoldTrade V18 Enterprise
// USDT SETTINGS MANAGER
// PART 1/6
// Production Version
// Folder: frontend/app/admin/usdt/page.tsx
// =====================================================

import { useEffect, useMemo, useState } from "react";

import {
  Wallet,
  DollarSign,
  Save,
  RefreshCw,
  Shield,
  TrendingUp,
  TrendingDown,
  Settings,
  Search,
  CheckCircle,
  XCircle,
  Activity,
  Coins,
  ArrowUpDown,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

interface UsdtSettings {
  _id?: string;

  buyPrice: number;
  sellPrice: number;

  usdtPriceUSD: number;
  usdToPkr: number;

  network: "TRC20" | "BEP20" | "ERC20";

  marketStatus: "OPEN" | "CLOSED";
  tradingEnabled: boolean;

  minimumBuy: number;
  minimumSell: number;

  maximumBuy: number;
  maximumSell: number;

  walletAddress: string;

  updatedAt?: string;
}

interface UsdtStatistics {
  currentBuyPrice: number;
  currentSellPrice: number;

  spread: number;

  tradingEnabled: boolean;
  marketStatus: "OPEN" | "CLOSED";
}

// =====================================================
// COMPONENT
// =====================================================

export default function AdminUsdtPage() {

  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState("");
  const [adminName, setAdminName] =
    useState("Administrator");

  // ===================================================
  // SETTINGS
  // ===================================================

  const [settings, setSettings] =
    useState<UsdtSettings>({
      buyPrice: 0,
      sellPrice: 0,

      usdtPriceUSD: 1,
      usdToPkr: 0,

      network: "TRC20",

      marketStatus: "OPEN",
      tradingEnabled: true,

      minimumBuy: 10,
      minimumSell: 10,

      maximumBuy: 100000,
      maximumSell: 100000,

      walletAddress: "",
    });

  const [statistics, setStatistics] =
    useState<UsdtStatistics>({
      currentBuyPrice: 0,
      currentSellPrice: 0,
      spread: 0,
      tradingEnabled: true,
      marketStatus: "OPEN",
    });

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const [error, setError] = useState("");

  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] = useState("");

  // ===================================================
  // TOKEN LOAD
  // ===================================================

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) {
      window.location.href = "/login";
      return;
    }

    setToken(savedToken);
  }, []);

  // ===================================================
  // REQUEST HEADERS
  // ===================================================

  const adminHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  // ===================================================
  // FORMATTERS
  // ===================================================

  const formatMoney = (value: number = 0) =>
    Number(value).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatUsdt = (value: number = 0) =>
    Number(value).toFixed(2);

  const formatDate = (date?: string) => {
    if (!date) return "--";

    return new Date(date).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ===================================================
  // UPDATE FIELD
  // ===================================================

  const updateField = (
    field: keyof UsdtSettings,
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ===================================================
  // LIVE SPREAD
  // ===================================================

  const liveSpread = useMemo(() => {
    return Math.max(
      0,
      Number(settings.buyPrice) - Number(settings.sellPrice)
    );
  }, [settings.buyPrice, settings.sellPrice]);

  // ===================================================
  // SEARCH FILTERS
  // ===================================================

  const keyword = search.toLowerCase();

  const showPriceSection =
    keyword === "" ||
    "buy sell usdt price usd pkr spread".includes(keyword);

  const showLimitSection =
    keyword === "" ||
    "minimum maximum limit trading".includes(keyword);

  const showWalletSection =
    keyword === "" ||
    "wallet address trc20 bep20 erc20 network".includes(keyword);

  const showMarketSection =
    keyword === "" ||
    "market open closed trading enable".includes(keyword);
      // ===================================================
  // LOAD USDT SETTINGS
  // ===================================================

  const loadUsdtSettings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setRefreshing(false);
      setError("");

      const [settingsRes, dashboardRes] = await Promise.all([
        fetch(`${API}/api/admin/usdt/settings`, {
          headers: adminHeaders,
          cache: "no-store",
        }),

        fetch(`${API}/api/admin/usdt/dashboard`, {
          headers: adminHeaders,
          cache: "no-store",
        }),
      ]);

      const settingsData = await settingsRes.json();
      const dashboardData = await dashboardRes.json();

      console.log("USDT SETTINGS:", settingsData);
      console.log("USDT DASHBOARD:", dashboardData);

      // SETTINGS
      if (settingsRes.ok && settingsData.success) {
        setSettings({
          buyPrice: Number(settingsData.settings.buyPrice || 0),
          sellPrice: Number(settingsData.settings.sellPrice || 0),

          usdtPriceUSD: Number(settingsData.settings.usdtPriceUSD || 1),
          usdToPkr: Number(settingsData.settings.usdToPkr || 0),

          network: settingsData.settings.network || "TRC20",

          marketStatus: settingsData.settings.marketStatus || "OPEN",

          tradingEnabled:
            settingsData.settings.tradingEnabled ?? true,

          minimumBuy: Number(settingsData.settings.minimumBuy || 10),
          minimumSell: Number(settingsData.settings.minimumSell || 10),

          maximumBuy: Number(settingsData.settings.maximumBuy || 100000),
          maximumSell: Number(settingsData.settings.maximumSell || 100000),

          walletAddress: settingsData.settings.walletAddress || "",

          updatedAt: settingsData.settings.updatedAt,
        });
      } else {
        setError(
          settingsData.message || "Unable to load USDT settings."
        );
      }

      // DASHBOARD / STATISTICS
      if (dashboardRes.ok && dashboardData.success) {
        setStatistics({
          currentBuyPrice: Number(
            dashboardData.dashboard?.buyPrice ||
              dashboardData.settings?.buyPrice ||
              0
          ),

          currentSellPrice: Number(
            dashboardData.dashboard?.sellPrice ||
              dashboardData.settings?.sellPrice ||
              0
          ),

          spread: Number(
            dashboardData.dashboard?.spread ||
              Math.max(
                0,
                Number(
                  dashboardData.dashboard?.buyPrice ||
                    settingsData.settings.buyPrice ||
                    0
                ) -
                  Number(
                    dashboardData.dashboard?.sellPrice ||
                      settingsData.settings.sellPrice ||
                      0
                  )
              )
          ),

          marketStatus:
            dashboardData.dashboard?.marketStatus ||
            settingsData.settings.marketStatus ||
            "OPEN",

          tradingEnabled:
            dashboardData.dashboard?.tradingEnabled ??
            settingsData.settings.tradingEnabled ??
            true,
        });
      }

    } catch (err: any) {
      console.error("LOAD USDT SETTINGS ERROR:", err);

      setError(
        err.message || "Unable to load USDT settings."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // REFRESH USDT SETTINGS
  // ===================================================

  const refreshUsdtSettings = async () => {
    setRefreshing(true);
    await loadUsdtSettings();
  };

  // ===================================================
  // ADMIN AUTH CHECK
  // ===================================================

  const checkAdminAuth = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API}/api/admin/auth/check`,
        {
          headers: adminHeaders,
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("ADMIN AUTH:", data);

      if (!response.ok || !data.success) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      setAdminName(data.user?.username || "Administrator");

    } catch (error) {
      console.error("ADMIN AUTH ERROR:", error);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (!token) return;

    checkAdminAuth();
    loadUsdtSettings();
  }, [token]);

  // ===================================================
  // AUTO CLEAR MESSAGE
  // ===================================================

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [message]);
    // ===================================================
  // TOGGLE MARKET STATUS
  // ===================================================

  const toggleMarketStatus = () => {
    setSettings((prev) => ({
      ...prev,
      marketStatus:
        prev.marketStatus === "OPEN" ? "CLOSED" : "OPEN",
    }));
  };

  // ===================================================
  // TOGGLE USDT TRADING
  // ===================================================

  const toggleTrading = () => {
    setSettings((prev) => ({
      ...prev,
      tradingEnabled: !prev.tradingEnabled,
    }));
  };

  // ===================================================
  // AUTO CALCULATE SELL PRICE
  // Keeps minimum spread of 0.50 PKR
  // ===================================================

  useEffect(() => {
    if (!settings.buyPrice) return;

    const minimumSpread = 0.5;

    if (
      settings.sellPrice >= settings.buyPrice ||
      settings.buyPrice - settings.sellPrice < minimumSpread
    ) {
      setSettings((prev) => ({
        ...prev,
        sellPrice: Math.max(
          0,
          Number(prev.buyPrice) - minimumSpread
        ),
      }));
    }
  }, [settings.buyPrice]);

  // ===================================================
  // SAVE USDT SETTINGS
  // PUT /api/admin/usdt/settings
  // ===================================================

  const saveUsdtSettings = async () => {
    if (!token) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        buyPrice: Number(settings.buyPrice),
        sellPrice: Number(settings.sellPrice),

        usdtPriceUSD: Number(settings.usdtPriceUSD),
        usdToPkr: Number(settings.usdToPkr),

        network: settings.network,

        marketStatus: settings.marketStatus,
        tradingEnabled: settings.tradingEnabled,

        minimumBuy: Number(settings.minimumBuy),
        minimumSell: Number(settings.minimumSell),

        maximumBuy: Number(settings.maximumBuy),
        maximumSell: Number(settings.maximumSell),

        walletAddress: settings.walletAddress,
      };

      const response = await fetch(
        `${API}/api/admin/usdt/settings`,
        {
          method: "PUT",
          headers: adminHeaders,
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      console.log("SAVE USDT SETTINGS:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save USDT settings."
        );
      }

      setSettings((prev) => ({
        ...prev,
        updatedAt:
          data.settings?.updatedAt ||
          new Date().toISOString(),
      }));

      setStatistics((prev) => ({
        ...prev,
        currentBuyPrice: Number(settings.buyPrice),
        currentSellPrice: Number(settings.sellPrice),
        spread:
          Number(settings.buyPrice) -
          Number(settings.sellPrice),
        marketStatus: settings.marketStatus,
        tradingEnabled: settings.tradingEnabled,
      }));

      setMessage("USDT settings updated successfully.");
      setMessageType("success");

      await loadUsdtSettings();

    } catch (err: any) {
      console.error("SAVE USDT SETTINGS ERROR:", err);

      setMessage(
        err.message || "Unable to save USDT settings."
      );
      setMessageType("error");

    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // RESET USDT SETTINGS
  // ===================================================

  const resetUsdtSettings = async () => {
    await loadUsdtSettings();

    setMessage("USDT settings restored.");
    setMessageType("success");
  };

  // ===================================================
  // LAST UPDATED LABEL
  // ===================================================

  const lastUpdatedLabel = useMemo(() => {
    return settings.updatedAt
      ? formatDate(settings.updatedAt)
      : "Never Updated";
  }, [settings.updatedAt]);
    // =====================================================
  // PAGE UI START
  // =====================================================

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6">

      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div>
          <h1 className="text-3xl font-bold text-cyan-400">
            GoldTrade V18 • Enterprise USDT Manager
          </h1>

          <p className="text-gray-400 mt-2">
            Manage live USDT prices, wallet network, trading status and limits.
          </p>

          <p className="text-gray-500 text-sm mt-1">
            Logged in as{" "}
            <span className="text-green-400 font-semibold">
              {adminName}
            </span>
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">

          <button
            onClick={refreshUsdtSettings}
            disabled={refreshing}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 text-black font-semibold px-5 py-3 rounded-xl transition"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={saveUsdtSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl transition"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Settings"}
          </button>

        </div>

      </div>

      {/* ========================================== */}
      {/* SUCCESS / ERROR MESSAGE */}
      {/* ========================================== */}

      {message && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 border ${
            messageType === "success"
              ? "bg-green-600/20 border-green-500 text-green-300"
              : "bg-red-600/20 border-red-500 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl px-4 py-3 border border-red-600 bg-red-600/10 text-red-300">
          {error}
        </div>
      )}

      {/* ========================================== */}
      {/* LIVE USDT PRICE CARDS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* BUY PRICE */}

        <div className="rounded-2xl bg-[#111827] border border-green-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <TrendingUp className="text-green-400" size={28} />
            <span className="text-xs font-semibold text-green-400">
              BUY PRICE
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Current Buy USDT Price
          </p>

          <h2 className="text-3xl font-bold text-green-400 mt-2">
            PKR {formatMoney(statistics.currentBuyPrice)}
          </h2>

        </div>

        {/* SELL PRICE */}

        <div className="rounded-2xl bg-[#111827] border border-red-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <TrendingDown className="text-red-400" size={28} />
            <span className="text-xs font-semibold text-red-400">
              SELL PRICE
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Current Sell USDT Price
          </p>

          <h2 className="text-3xl font-bold text-red-400 mt-2">
            PKR {formatMoney(statistics.currentSellPrice)}
          </h2>

        </div>

        {/* SPREAD */}

        <div className="rounded-2xl bg-[#111827] border border-blue-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <ArrowUpDown className="text-blue-400" size={28} />
            <span className="text-xs font-semibold text-blue-400">
              SPREAD
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Buy / Sell Difference
          </p>

          <h2 className="text-3xl font-bold text-blue-400 mt-2">
            PKR {formatMoney(liveSpread)}
          </h2>

        </div>

        {/* MARKET */}

        <div className="rounded-2xl bg-[#111827] border border-purple-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <Activity className="text-purple-400" size={28} />
            <span className="text-xs font-semibold text-purple-400">
              MARKET
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            USDT Market Status
          </p>

          <h2
            className={`text-xl font-bold mt-2 ${
              settings.marketStatus === "OPEN"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {settings.marketStatus}
          </h2>

        </div>

      </div>

      {/* ========================================== */}
      {/* USD / PKR / NETWORK */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        {/* USDT USD */}

        <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <DollarSign className="text-cyan-400" size={24} />
            <span className="text-cyan-400 text-xs font-semibold">
              USDT USD
            </span>
          </div>

          <h3 className="text-2xl font-bold text-cyan-400">
            ${formatUsdt(settings.usdtPriceUSD)}
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Current USDT Value
          </p>

        </div>

        {/* USD TO PKR */}

        <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <Coins className="text-green-400" size={24} />
            <span className="text-green-400 text-xs font-semibold">
              USD → PKR
            </span>
          </div>

          <h3 className="text-2xl font-bold text-green-400">
            {formatMoney(settings.usdToPkr)}
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Exchange Rate
          </p>

        </div>

        {/* NETWORK */}

        <div className="rounded-2xl bg-[#111827] border border-orange-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <Wallet className="text-orange-400" size={24} />
            <span className="text-orange-400 text-xs font-semibold">
              NETWORK
            </span>
          </div>

          <h3 className="text-2xl font-bold text-orange-400">
            {settings.network}
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Active Wallet Network
          </p>

        </div>

      </div>

      {/* ========================================== */}
      {/* SEARCH */}
      {/* ========================================== */}

      <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">

        <div className="relative">

          <Search
            size={20}
            className="absolute left-4 top-3.5 text-gray-500"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search USDT Price, Network, Wallet, Market..."
            className="w-full bg-[#1F2937] border border-gray-600 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-cyan-500 transition"
          />

        </div>

      </div>

      {/* ========================================== */}
      {/* MARKET CONTROL PANEL */}
      {/* ========================================== */}

      <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

        <h2 className="text-xl font-bold text-cyan-400 mb-5">
          USDT Market Controls
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          {/* MARKET STATUS */}

          <div className="flex items-center justify-between rounded-xl bg-[#1F2937] p-5 border border-purple-500/20">

            <div>
              <p className="font-semibold text-white">
                USDT Market Status
              </p>

              <p className="text-gray-400 text-sm">
                Open or close USDT market.
              </p>
            </div>

            <button
              onClick={toggleMarketStatus}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                settings.marketStatus === "OPEN"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {settings.marketStatus}
            </button>

          </div>

          {/* TRADING */}

          <div className="flex items-center justify-between rounded-xl bg-[#1F2937] p-5 border border-green-500/20">

            <div>
              <p className="font-semibold text-white">
                USDT Trading
              </p>

              <p className="text-gray-400 text-sm">
                Enable or disable USDT Buy/Sell.
              </p>
            </div>

            <button
              onClick={toggleTrading}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                settings.tradingEnabled
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              {settings.tradingEnabled ? "ON" : "OFF"}
            </button>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* USDT SETTINGS FORMS START */}
      {/* ========================================== */}

      <div className="space-y-8">        {/* ========================================== */}
        {/* USDT BUY / SELL PRICE SETTINGS */}
        {/* ========================================== */}

        {showPriceSection && (
          <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-cyan-400" size={28} />
              <h2 className="text-2xl font-bold text-cyan-400">
                USDT Buy / Sell Prices
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

              {/* BUY PRICE */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Buy USDT Price (PKR)
                </label>

                <input
                  type="number"
                  value={settings.buyPrice}
                  onChange={(e) =>
                    updateField("buyPrice", Number(e.target.value))
                  }
                  placeholder="Enter Buy Price"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none"
                />

                <p className="text-cyan-400 text-xs mt-2">
                  Price users pay when buying USDT.
                </p>
              </div>

              {/* SELL PRICE */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Sell USDT Price (PKR)
                </label>

                <input
                  type="number"
                  value={settings.sellPrice}
                  onChange={(e) =>
                    updateField("sellPrice", Number(e.target.value))
                  }
                  placeholder="Enter Sell Price"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                />

                <p className="text-red-400 text-xs mt-2">
                  Price users receive when selling USDT.
                </p>
              </div>

            </div>

            {/* LIVE SPREAD */}

            <div className="mt-6 bg-[#1F2937] rounded-xl p-5 border border-blue-600/20">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-400 text-sm">
                    Current Spread
                  </p>

                  <h3 className="text-2xl font-bold text-blue-400 mt-1">
                    PKR {formatMoney(liveSpread)}
                  </h3>
                </div>

                <ArrowUpDown className="text-blue-400" size={32} />

              </div>

              <p className="text-gray-500 text-sm mt-3">
                Spread = Buy Price − Sell Price
              </p>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* USD PRICE + EXCHANGE RATE */}
        {/* ========================================== */}

        {showPriceSection && (
          <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="text-green-400" size={28} />
              <h2 className="text-2xl font-bold text-green-400">
                USDT USD & Exchange Rate
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

              {/* USD PRICE */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  USDT Price (USD)
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={settings.usdtPriceUSD}
                  onChange={(e) =>
                    updateField("usdtPriceUSD", Number(e.target.value))
                  }
                  placeholder="1.00"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                />
              </div>

              {/* USD TO PKR */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  USD to PKR Rate
                </label>

                <input
                  type="number"
                  value={settings.usdToPkr}
                  onChange={(e) =>
                    updateField("usdToPkr", Number(e.target.value))
                  }
                  placeholder="Enter Exchange Rate"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                />
              </div>

            </div>

            {/* LIVE CONVERSION */}

            <div className="mt-6 bg-[#1F2937] rounded-xl p-5 border border-green-500/20">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-400 text-sm">
                    Estimated PKR Value
                  </p>

                  <h3 className="text-2xl font-bold text-green-400 mt-1">
                    PKR{" "}
                    {formatMoney(
                      Number(settings.usdtPriceUSD) *
                        Number(settings.usdToPkr)
                    )}
                  </h3>
                </div>

                <Coins className="text-green-400" size={30} />

              </div>

              <p className="text-gray-500 text-sm mt-3">
                Live conversion using USD exchange rate.
              </p>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* NETWORK & WALLET SETTINGS */}
        {/* ========================================== */}

        {showWalletSection && (
          <div className="rounded-2xl bg-[#111827] border border-orange-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <Wallet className="text-orange-400" size={28} />
              <h2 className="text-2xl font-bold text-orange-400">
                Wallet Network Settings
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

              {/* NETWORK */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Active USDT Network
                </label>

                <select
                  value={settings.network}
                  onChange={(e) =>
                    updateField("network", e.target.value)
                  }
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                >
                  <option value="TRC20">TRC20</option>
                  <option value="BEP20">BEP20</option>
                  <option value="ERC20">ERC20</option>
                </select>
              </div>

              {/* WALLET ADDRESS */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Wallet Address
                </label>

                <textarea
                  value={settings.walletAddress}
                  onChange={(e) =>
                    updateField("walletAddress", e.target.value)
                  }
                  rows={3}
                  placeholder="Enter USDT Wallet Address"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 resize-none focus:border-orange-500 outline-none"
                />
              </div>

            </div>

            {/* WALLET PREVIEW */}

            <div className="mt-6 bg-[#1F2937] rounded-xl p-5 border border-orange-500/20">

              <p className="text-gray-400 text-sm mb-2">
                Current Deposit Wallet
              </p>

              <p className="text-orange-300 break-all font-mono text-sm">
                {settings.walletAddress || "No wallet address configured."}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/30 px-4 py-2 text-orange-300 text-sm font-semibold">
                <Wallet size={16} />
                Network: {settings.network}
              </div>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* USDT TRADING LIMITS */}
        {/* ========================================== */}

        {showLimitSection && (
          <div className="rounded-2xl bg-[#111827] border border-purple-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <Settings className="text-purple-400" size={28} />
              <h2 className="text-2xl font-bold text-purple-400">
                USDT Trading Limits
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

              {/* MIN BUY */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Minimum Buy USDT
                </label>

                <input
                  type="number"
                  value={settings.minimumBuy}
                  onChange={(e) =>
                    updateField("minimumBuy", Number(e.target.value))
                  }
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-purple-500 outline-none"
                />
              </div>

              {/* MIN SELL */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Minimum Sell USDT
                </label>

                <input
                  type="number"
                  value={settings.minimumSell}
                  onChange={(e) =>
                    updateField("minimumSell", Number(e.target.value))
                  }
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-purple-500 outline-none"
                />
              </div>

              {/* MAX BUY */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Maximum Buy USDT
                </label>

                <input
                  type="number"
                  value={settings.maximumBuy}
                  onChange={(e) =>
                    updateField("maximumBuy", Number(e.target.value))
                  }
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-purple-500 outline-none"
                />
              </div>

              {/* MAX SELL */}

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Maximum Sell USDT
                </label>

                <input
                  type="number"
                  value={settings.maximumSell}
                  onChange={(e) =>
                    updateField("maximumSell", Number(e.target.value))
                  }
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-purple-500 outline-none"
                />
              </div>

            </div>

            {/* LIMIT SUMMARY */}

            <div className="grid md:grid-cols-2 gap-5 mt-6">

              <div className="bg-[#1F2937] rounded-xl p-5 border border-green-600/20">

                <p className="text-gray-400 text-sm">
                  Buy Range
                </p>

                <h3 className="text-xl font-bold text-green-400 mt-2">
                  {formatUsdt(settings.minimumBuy)} USDT →{" "}
                  {formatUsdt(settings.maximumBuy)} USDT
                </h3>

              </div>

              <div className="bg-[#1F2937] rounded-xl p-5 border border-red-600/20">

                <p className="text-gray-400 text-sm">
                  Sell Range
                </p>

                <h3 className="text-xl font-bold text-red-400 mt-2">
                  {formatUsdt(settings.minimumSell)} USDT →{" "}
                  {formatUsdt(settings.maximumSell)} USDT
                </h3>

              </div>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* MARKET SUMMARY */}
        {/* ========================================== */}

        {showMarketSection && (
          <div className="rounded-2xl bg-[#111827] border border-blue-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-blue-400" size={28} />
              <h2 className="text-2xl font-bold text-blue-400">
                USDT Market Summary
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div className="bg-[#1F2937] rounded-xl p-5 border border-blue-500/20">

                <p className="text-gray-400 text-sm">
                  Market Status
                </p>

                <h3
                  className={`text-2xl font-bold mt-2 ${
                    settings.marketStatus === "OPEN"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {settings.marketStatus}
                </h3>

              </div>

              <div className="bg-[#1F2937] rounded-xl p-5 border border-green-500/20">

                <p className="text-gray-400 text-sm">
                  Trading Module
                </p>

                <h3
                  className={`text-2xl font-bold mt-2 ${
                    settings.tradingEnabled
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {settings.tradingEnabled
                    ? "ENABLED"
                    : "DISABLED"}
                </h3>

              </div>

            </div>

            <div className="mt-6 bg-[#1F2937] rounded-xl p-5 border border-cyan-500/20">

              <p className="text-gray-400 text-sm mb-2">
                Live Market Overview
              </p>

              <div className="grid md:grid-cols-3 gap-4">

                <div>
                  <p className="text-xs text-gray-500">BUY</p>
                  <p className="text-green-400 font-bold">
                    PKR {formatMoney(settings.buyPrice)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">SELL</p>
                  <p className="text-red-400 font-bold">
                    PKR {formatMoney(settings.sellPrice)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">SPREAD</p>
                  <p className="text-blue-400 font-bold">
                    PKR {formatMoney(liveSpread)}
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}        {/* ========================================== */}
        {/* LAST UPDATED CARD */}
        {/* ========================================== */}

        <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>
              <h2 className="text-xl font-bold text-cyan-400 mb-2">
                USDT Settings Information
              </h2>

              <p className="text-gray-400 text-sm">
                Last Updated
              </p>

              <p className="text-green-400 font-semibold mt-1">
                {lastUpdatedLabel}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">

              <button
                onClick={resetUsdtSettings}
                className="bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-xl font-semibold transition"
              >
                Reset Changes
              </button>

              <button
                onClick={saveUsdtSettings}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
              >
                <Save size={18} />

                {saving ? "Saving..." : "Save USDT Settings"}
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* LOADING OVERLAY */}
      {/* ========================================== */}

      {(loading || saving) && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">

          <div className="bg-[#111827] border border-cyan-500/30 rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-2xl">

            <RefreshCw
              size={36}
              className="animate-spin text-cyan-400"
            />

            <h3 className="text-xl font-bold text-cyan-400">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-300">
              {saving
                ? "Saving USDT settings..."
                : "Loading USDT settings..."}
            </p>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* FOOTER */}
      {/* ========================================== */}

      <footer className="mt-12 border-t border-gray-800 pt-6">

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">

          <div>

            <h3 className="text-cyan-400 font-bold text-lg">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-500 text-sm">
              USDT Trading Management Module
            </p>

          </div>

          <div className="flex flex-wrap gap-5 text-sm text-gray-400">

            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-400" />
              Secure USDT Configuration
            </div>

            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-cyan-400" />
              TRC20 • BEP20 • ERC20 Networks
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-400" />
              Buy / Sell Price Engine
            </div>

            <div className="flex items-center gap-2">
              <Activity size={16} className="text-blue-400" />
              Market Open / Closed Control
            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}