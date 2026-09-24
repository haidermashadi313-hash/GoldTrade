"use client";

// =====================================================
// GoldTrade V18 Enterprise
// GOLD SETTINGS MANAGER
// PART 1/6
// Production Version
// Folder: frontend/app/admin/goldsetting/page.tsx
// =====================================================

import { useEffect, useMemo, useState } from "react";

import {
  Coins,
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
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

interface GoldSettings {
  _id?: string;

  buyGoldPrice: number;
  sellGoldPrice: number;

  goldPriceUSD: number;
  usdToPkr: number;

  marketStatus: "OPEN" | "CLOSED";
  goldTradingEnabled: boolean;

  minimumBuyGold: number;
  minimumSellGold: number;

  maximumBuyGold: number;
  maximumSellGold: number;

  updatedAt?: string;
}

interface GoldStatistics {
  currentBuyPrice: number;
  currentSellPrice: number;

  spread: number;

  marketStatus: "OPEN" | "CLOSED";

  tradingEnabled: boolean;
}

// =====================================================
// COMPONENT
// =====================================================

export default function GoldSettingsPage() {

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
    useState<GoldSettings>({
      buyGoldPrice: 0,
      sellGoldPrice: 0,

      goldPriceUSD: 0,
      usdToPkr: 0,

      marketStatus: "OPEN",
      goldTradingEnabled: true,

      minimumBuyGold: 0.1,
      minimumSellGold: 0.1,

      maximumBuyGold: 100,
      maximumSellGold: 100,
    });

  const [statistics, setStatistics] =
    useState<GoldStatistics>({
      currentBuyPrice: 0,
      currentSellPrice: 0,
      spread: 0,
      marketStatus: "OPEN",
      tradingEnabled: true,
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

  const formatGold = (value: number = 0) =>
    Number(value).toFixed(3);

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
    field: keyof GoldSettings,
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
      Number(settings.buyGoldPrice) -
        Number(settings.sellGoldPrice)
    );
  }, [settings.buyGoldPrice, settings.sellGoldPrice]);

  // ===================================================
  // SEARCH FILTERS
  // ===================================================

  const keyword = search.toLowerCase();

  const showPriceSection =
    keyword === "" ||
    "buy sell price market usd pkr spread".includes(keyword);

  const showLimitSection =
    keyword === "" ||
    "minimum maximum limit trading".includes(keyword);

  const showMarketSection =
    keyword === "" ||
    "market open closed trading enable".includes(keyword);
      // ===================================================
  // LOAD GOLD SETTINGS
  // ===================================================

  const loadGoldSettings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setRefreshing(false);
      setError("");

      const [settingsRes, statsRes] = await Promise.all([
        fetch(`${API}/api/gold/settings`, {
          headers: adminHeaders,
          cache: "no-store",
        }),

        fetch(`${API}/api/gold/admin/dashboard`, {
          headers: adminHeaders,
          cache: "no-store",
        }),
      ]);

      const settingsData = await settingsRes.json();
      const statsData = await statsRes.json();

      console.log("GOLD SETTINGS:", settingsData);
      console.log("GOLD DASHBOARD:", statsData);

      // SETTINGS
      if (settingsRes.ok && settingsData.success) {
        setSettings({
          buyGoldPrice: Number(settingsData.settings.buyGoldPrice || 0),
          sellGoldPrice: Number(settingsData.settings.sellGoldPrice || 0),

          goldPriceUSD: Number(settingsData.settings.goldPriceUSD || 0),
          usdToPkr: Number(settingsData.settings.usdToPkr || 0),

          marketStatus: settingsData.settings.marketStatus || "OPEN",

          goldTradingEnabled:
            settingsData.settings.goldTradingEnabled ?? true,

          minimumBuyGold: Number(settingsData.settings.minimumBuyGold || 0.1),
          minimumSellGold: Number(settingsData.settings.minimumSellGold || 0.1),

          maximumBuyGold: Number(settingsData.settings.maximumBuyGold || 100),
          maximumSellGold: Number(settingsData.settings.maximumSellGold || 100),

          updatedAt: settingsData.settings.updatedAt,
        });
      } else {
        setError(
          settingsData.message || "Unable to load Gold settings."
        );
      }

      // DASHBOARD / STATISTICS
      if (statsRes.ok && statsData.success) {
        setStatistics({
          currentBuyPrice: Number(
            statsData.dashboard?.buyGoldPrice ||
              statsData.settings?.buyGoldPrice ||
              0
          ),

          currentSellPrice: Number(
            statsData.dashboard?.sellGoldPrice ||
              statsData.settings?.sellGoldPrice ||
              0
          ),

          spread: Number(
            statsData.dashboard?.spread ||
              Math.max(
                0,
                Number(
                  statsData.dashboard?.buyGoldPrice ||
                    settingsData.settings.buyGoldPrice ||
                    0
                ) -
                  Number(
                    statsData.dashboard?.sellGoldPrice ||
                      settingsData.settings.sellGoldPrice ||
                      0
                  )
              )
          ),

          marketStatus:
            statsData.dashboard?.marketStatus ||
            settingsData.settings.marketStatus ||
            "OPEN",

          tradingEnabled:
            statsData.dashboard?.goldTradingEnabled ??
            settingsData.settings.goldTradingEnabled ??
            true,
        });
      }

    } catch (err: any) {
      console.error("LOAD GOLD SETTINGS ERROR:", err);

      setError(
        err.message || "Unable to load Gold settings."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // REFRESH GOLD SETTINGS
  // ===================================================

  const refreshGoldSettings = async () => {
    setRefreshing(true);
    await loadGoldSettings();
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
    loadGoldSettings();
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
      marketStatus: prev.marketStatus === "OPEN" ? "CLOSED" : "OPEN",
    }));
  };

  // ===================================================
  // TOGGLE GOLD TRADING
  // ===================================================

  const toggleGoldTrading = () => {
    setSettings((prev) => ({
      ...prev,
      goldTradingEnabled: !prev.goldTradingEnabled,
    }));
  };

  // ===================================================
  // AUTO CALCULATE SELL PRICE
  // (Keeps minimum spread of 100 PKR)
  // ===================================================

  useEffect(() => {
    if (!settings.buyGoldPrice) return;

    const minimumSpread = 100;

    if (
      settings.sellGoldPrice >= settings.buyGoldPrice ||
      settings.buyGoldPrice - settings.sellGoldPrice < minimumSpread
    ) {
      setSettings((prev) => ({
        ...prev,
        sellGoldPrice: Math.max(
          0,
          Number(prev.buyGoldPrice) - minimumSpread
        ),
      }));
    }
  }, [settings.buyGoldPrice]);

  // ===================================================
  // SAVE GOLD SETTINGS
  // PUT /api/gold/settings
  // ===================================================

  const saveGoldSettings = async () => {
    if (!token) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        buyGoldPrice: Number(settings.buyGoldPrice),
        sellGoldPrice: Number(settings.sellGoldPrice),

        goldPriceUSD: Number(settings.goldPriceUSD),
        usdToPkr: Number(settings.usdToPkr),

        marketStatus: settings.marketStatus,
        goldTradingEnabled: settings.goldTradingEnabled,

        minimumBuyGold: Number(settings.minimumBuyGold),
        minimumSellGold: Number(settings.minimumSellGold),

        maximumBuyGold: Number(settings.maximumBuyGold),
        maximumSellGold: Number(settings.maximumSellGold),
      };

      const response = await fetch(`${API}/api/gold/settings`, {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      console.log("SAVE GOLD SETTINGS:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save Gold settings."
        );
      }

      setSettings((prev) => ({
        ...prev,
        updatedAt:
          data.settings?.updatedAt || new Date().toISOString(),
      }));

      setStatistics((prev) => ({
        ...prev,
        currentBuyPrice: Number(settings.buyGoldPrice),
        currentSellPrice: Number(settings.sellGoldPrice),
        spread:
          Number(settings.buyGoldPrice) -
          Number(settings.sellGoldPrice),
        marketStatus: settings.marketStatus,
        tradingEnabled: settings.goldTradingEnabled,
      }));

      setMessage("Gold settings updated successfully.");
      setMessageType("success");

      await loadGoldSettings();

    } catch (err: any) {
      console.error("SAVE GOLD SETTINGS ERROR:", err);

      setMessage(
        err.message || "Unable to save Gold settings."
      );
      setMessageType("error");

    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // RESET GOLD SETTINGS
  // ===================================================

  const resetGoldSettings = async () => {
    await loadGoldSettings();

    setMessage("Gold settings restored.");
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
          <h1 className="text-3xl font-bold text-yellow-400">
            GoldTrade V18 • Enterprise Gold Settings
          </h1>

          <p className="text-gray-400 mt-2">
            Manage live Gold prices, trading status and market configuration.
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
            onClick={refreshGoldSettings}
            disabled={refreshing}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black font-semibold px-5 py-3 rounded-xl transition"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={saveGoldSettings}
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
      {/* LIVE PRICE CARDS */}
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

          <p className="text-gray-400 text-sm">Current Buy Gold Price</p>

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

          <p className="text-gray-400 text-sm">Current Sell Gold Price</p>

          <h2 className="text-3xl font-bold text-red-400 mt-2">
            PKR {formatMoney(statistics.currentSellPrice)}
          </h2>

        </div>

        {/* SPREAD */}

        <div className="rounded-2xl bg-[#111827] border border-blue-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <Activity className="text-blue-400" size={28} />
            <span className="text-xs font-semibold text-blue-400">
              SPREAD
            </span>
          </div>

          <p className="text-gray-400 text-sm">Buy / Sell Difference</p>

          <h2 className="text-3xl font-bold text-blue-400 mt-2">
            PKR {formatMoney(liveSpread)}
          </h2>

        </div>

        {/* MARKET */}

        <div className="rounded-2xl bg-[#111827] border border-purple-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <Settings className="text-purple-400" size={28} />
            <span className="text-xs font-semibold text-purple-400">
              MARKET
            </span>
          </div>

          <p className="text-gray-400 text-sm">Market Status</p>

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
      {/* USD / PKR / TRADING STATUS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        {/* GOLD USD */}

        <div className="rounded-2xl bg-[#111827] border border-yellow-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <Coins className="text-yellow-400" size={24} />
            <span className="text-yellow-400 text-xs font-semibold">
              GOLD USD
            </span>
          </div>

          <h3 className="text-2xl font-bold text-yellow-400">
            ${formatMoney(settings.goldPriceUSD)}
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            International Gold Price
          </p>

        </div>

        {/* USD TO PKR */}

        <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <DollarSign className="text-cyan-400" size={24} />
            <span className="text-cyan-400 text-xs font-semibold">
              USD → PKR
            </span>
          </div>

          <h3 className="text-2xl font-bold text-cyan-400">
            {formatMoney(settings.usdToPkr)}
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Exchange Rate
          </p>

        </div>

        {/* TRADING */}

        <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <Shield className="text-green-400" size={24} />
            <span className="text-green-400 text-xs font-semibold">
              TRADING
            </span>
          </div>

          <h3
            className={`text-2xl font-bold ${
              settings.goldTradingEnabled
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {settings.goldTradingEnabled
              ? "ENABLED"
              : "DISABLED"}
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Gold Buy / Sell Module
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
            placeholder="Search Buy Price, Sell Price, USD, PKR, Market..."
            className="w-full bg-[#1F2937] border border-gray-600 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-yellow-500 transition"
          />

        </div>

      </div>

      {/* ========================================== */}
      {/* MARKET CONTROL PANEL */}
      {/* ========================================== */}

      <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

        <h2 className="text-xl font-bold text-yellow-400 mb-5">
          Gold Market Controls
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          {/* MARKET STATUS */}

          <div className="flex items-center justify-between rounded-xl bg-[#1F2937] p-5 border border-purple-500/20">

            <div>
              <p className="font-semibold text-white">
                Gold Market Status
              </p>

              <p className="text-gray-400 text-sm">
                Open or close Gold trading market.
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

          {/* TRADING ENABLE */}

          <div className="flex items-center justify-between rounded-xl bg-[#1F2937] p-5 border border-green-500/20">

            <div>
              <p className="font-semibold text-white">
                Gold Trading
              </p>

              <p className="text-gray-400 text-sm">
                Enable or disable Buy/Sell transactions.
              </p>
            </div>

            <button
              onClick={toggleGoldTrading}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                settings.goldTradingEnabled
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              {settings.goldTradingEnabled ? "ON" : "OFF"}
            </button>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* GOLD SETTINGS FORMS START */}
      {/* ========================================== */}

      <div className="space-y-8">        {/* ========================================== */}
        {/* GOLD PRICE SETTINGS */}
        {/* ========================================== */}

        {showPriceSection && (
          <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-green-400" size={28} />
              <h2 className="text-2xl font-bold text-green-400">
                Gold Buy / Sell Prices
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

              {/* BUY PRICE */}

              <div>

                <label className="block text-sm text-gray-300 mb-2">
                  Buy Gold Price (PKR)
                </label>

                <input
                  type="number"
                  value={settings.buyGoldPrice}
                  onChange={(e) =>
                    updateField("buyGoldPrice", Number(e.target.value))
                  }
                  placeholder="Enter Buy Price"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                />

                <p className="text-green-400 text-xs mt-2">
                  Price users pay when buying Gold.
                </p>

              </div>

              {/* SELL PRICE */}

              <div>

                <label className="block text-sm text-gray-300 mb-2">
                  Sell Gold Price (PKR)
                </label>

                <input
                  type="number"
                  value={settings.sellGoldPrice}
                  onChange={(e) =>
                    updateField("sellGoldPrice", Number(e.target.value))
                  }
                  placeholder="Enter Sell Price"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-red-500 outline-none"
                />

                <p className="text-red-400 text-xs mt-2">
                  Price users receive when selling Gold.
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

                <Activity className="text-blue-400" size={32} />

              </div>

              <p className="text-gray-500 text-sm mt-3">
                Spread = Buy Price − Sell Price
              </p>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* INTERNATIONAL GOLD PRICE */}
        {/* ========================================== */}

        {showPriceSection && (
          <div className="rounded-2xl bg-[#111827] border border-yellow-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <Coins className="text-yellow-400" size={28} />
              <h2 className="text-2xl font-bold text-yellow-400">
                International Gold Price
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

              <div>

                <label className="block text-sm text-gray-300 mb-2">
                  Gold Price (USD)
                </label>

                <input
                  type="number"
                  value={settings.goldPriceUSD}
                  onChange={(e) =>
                    updateField("goldPriceUSD", Number(e.target.value))
                  }
                  placeholder="USD Gold Price"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none"
                />

              </div>

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
                  placeholder="Exchange Rate"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none"
                />

              </div>

            </div>

            {/* LIVE CONVERSION */}

            <div className="mt-6 bg-[#1F2937] rounded-xl p-5 border border-cyan-600/20">

              <div className="flex justify-between items-center">

                <div>
                  <p className="text-gray-400 text-sm">
                    Estimated PKR Value
                  </p>

                  <h3 className="text-2xl font-bold text-cyan-400 mt-1">
                    PKR{" "}
                    {formatMoney(
                      Number(settings.goldPriceUSD) *
                        Number(settings.usdToPkr)
                    )}
                  </h3>
                </div>

                <DollarSign className="text-cyan-400" size={30} />

              </div>

              <p className="text-gray-500 text-sm mt-3">
                Live conversion from USD Gold price.
              </p>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* GOLD TRADING LIMITS */}
        {/* ========================================== */}

        {showLimitSection && (
          <div className="rounded-2xl bg-[#111827] border border-orange-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <Settings className="text-orange-400" size={28} />
              <h2 className="text-2xl font-bold text-orange-400">
                Trading Limits
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

              {/* MIN BUY */}

              <div>

                <label className="block text-sm text-gray-300 mb-2">
                  Minimum Buy Gold
                </label>

                <input
                  type="number"
                  step="0.001"
                  value={settings.minimumBuyGold}
                  onChange={(e) =>
                    updateField(
                      "minimumBuyGold",
                      Number(e.target.value)
                    )
                  }
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                />

                <p className="text-gray-500 text-xs mt-2">
                  Minimum Gold user can buy.
                </p>

              </div>

              {/* MIN SELL */}

              <div>

                <label className="block text-sm text-gray-300 mb-2">
                  Minimum Sell Gold
                </label>

                <input
                  type="number"
                  step="0.001"
                  value={settings.minimumSellGold}
                  onChange={(e) =>
                    updateField(
                      "minimumSellGold",
                      Number(e.target.value)
                    )
                  }
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                />

              </div>

              {/* MAX BUY */}

              <div>

                <label className="block text-sm text-gray-300 mb-2">
                  Maximum Buy Gold
                </label>

                <input
                  type="number"
                  step="0.001"
                  value={settings.maximumBuyGold}
                  onChange={(e) =>
                    updateField(
                      "maximumBuyGold",
                      Number(e.target.value)
                    )
                  }
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
                />

              </div>

              {/* MAX SELL */}

              <div>

                <label className="block text-sm text-gray-300 mb-2">
                  Maximum Sell Gold
                </label>

                <input
                  type="number"
                  step="0.001"
                  value={settings.maximumSellGold}
                  onChange={(e) =>
                    updateField(
                      "maximumSellGold",
                      Number(e.target.value)
                    )
                  }
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-orange-500 outline-none"
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
                  {formatGold(settings.minimumBuyGold)} Gold →{" "}
                  {formatGold(settings.maximumBuyGold)} Gold
                </h3>

              </div>

              <div className="bg-[#1F2937] rounded-xl p-5 border border-red-600/20">

                <p className="text-gray-400 text-sm">
                  Sell Range
                </p>

                <h3 className="text-xl font-bold text-red-400 mt-2">
                  {formatGold(settings.minimumSellGold)} Gold →{" "}
                  {formatGold(settings.maximumSellGold)} Gold
                </h3>

              </div>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* MARKET INFORMATION CARD */}
        {/* ========================================== */}

        {showMarketSection && (
          <div className="rounded-2xl bg-[#111827] border border-purple-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-purple-400" size={28} />
              <h2 className="text-2xl font-bold text-purple-400">
                Market Configuration
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div className="bg-[#1F2937] rounded-xl p-5 border border-purple-500/20">

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
                    settings.goldTradingEnabled
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {settings.goldTradingEnabled
                    ? "ENABLED"
                    : "DISABLED"}
                </h3>

              </div>

            </div>

            <div className="mt-6 bg-[#1F2937] rounded-xl p-5 border border-blue-500/20">

              <p className="text-gray-400 text-sm mb-2">
                Live Market Summary
              </p>

              <div className="grid md:grid-cols-3 gap-4">

                <div>
                  <p className="text-xs text-gray-500">BUY</p>
                  <p className="text-green-400 font-bold">
                    PKR {formatMoney(settings.buyGoldPrice)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">SELL</p>
                  <p className="text-red-400 font-bold">
                    PKR {formatMoney(settings.sellGoldPrice)}
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
              <h2 className="text-xl font-bold text-yellow-400 mb-2">
                Gold Settings Information
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
                onClick={resetGoldSettings}
                className="bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-xl font-semibold transition"
              >
                Reset Changes
              </button>

              <button
                onClick={saveGoldSettings}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
              >
                <Save size={18} />

                {saving ? "Saving..." : "Save Gold Settings"}
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

          <div className="bg-[#111827] border border-yellow-500/30 rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-2xl">

            <RefreshCw
              size={36}
              className="animate-spin text-yellow-400"
            />

            <h3 className="text-xl font-bold text-yellow-400">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-300">
              {saving
                ? "Saving Gold settings..."
                : "Loading Gold settings..."}
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

            <h3 className="text-yellow-400 font-bold text-lg">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-500 text-sm">
              Gold Settings Management Module
            </p>

          </div>

          <div className="flex flex-wrap gap-5 text-sm text-gray-400">

            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-400" />
              Secure Gold Trading Configuration
            </div>

            <div className="flex items-center gap-2">
              <Coins size={16} className="text-yellow-400" />
              Live Gold Price Engine
            </div>

            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-green-400" />
              Buy / Sell Price Management
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