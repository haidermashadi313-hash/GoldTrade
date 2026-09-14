"use client";

// ======================================================
// GOLDTRADE V19 ADMIN DASHBOARD
// PART 1/8 - IMPORTS + TYPES + STATES
// ======================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

// ======================================================
// API CONFIG
// ======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// ======================================================
// TYPES
// ======================================================

interface MarketSettings {
  buyPrice: number;
  sellPrice: number;
  goldPriceUSD: number;
  usdToPkr: number;
  tradingEnabled: boolean;
  marketStatus: string;
}

interface DashboardSummary {
  totalUsers: number;
  totalTrades: number;
  completedTrades: number;
  totalGoldBought: number;
  totalGoldSold: number;
  totalGoldInWallets: number;
  totalBuyAmount: number;
  totalSellAmount: number;
  totalPKRInWallets: number;
}

interface UserData {
  _id: string;
  username: string;
  email: string;
  phone: string;
  goldWallet: number;
  pkrWallet: number;
  currentBuyValue: number;
  currentSellValue: number;
}

interface TradeData {
  _id: string;
  type: string;
  grams: number;
  pricePerGram: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  userId?: {
    username: string;
    email: string;
  };
}

// ======================================================
// COMPONENT
// ======================================================

export default function AdminDashboard() {
  const router = useRouter();

  // ---------------- Auth ----------------

  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  // ---------------- UI ----------------

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | "info"
  >("info");

  // ---------------- Market ----------------

  const [settings, setSettings] = useState<MarketSettings>({
    buyPrice: 0,
    sellPrice: 0,
    goldPriceUSD: 0,
    usdToPkr: 0,
    tradingEnabled: true,
    marketStatus: "OPEN",
  });

  // ---------------- Dashboard ----------------

  const [dashboard, setDashboard] = useState<DashboardSummary>({
    totalUsers: 0,
    totalTrades: 0,
    completedTrades: 0,
    totalGoldBought: 0,
    totalGoldSold: 0,
    totalGoldInWallets: 0,
    totalBuyAmount: 0,
    totalSellAmount: 0,
    totalPKRInWallets: 0,
  });

  // ---------------- Search User ----------------

  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // ---------------- Wallet ----------------

  const [goldAmount, setGoldAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");

  // ---------------- Trades ----------------

  const [recentTrades, setRecentTrades] = useState<TradeData[]>([]);
  // ======================================================
// GOLDTRADE V19 ADMIN DASHBOARD
// PART 2/8 - AUTH + DASHBOARD LOAD + MARKET FETCH
// ======================================================

// ----------------------------------------------
// Logout
// ----------------------------------------------
const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  router.push("/admin-login");
};

// ----------------------------------------------
// Load Market Settings
// ----------------------------------------------
const fetchMarketSettings = async (authToken: string) => {
  try {
    const { data } = await axios.get(`${API}/api/gold/price`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (data.success) {
      setSettings(data.data);
    }
  } catch (error) {
    console.error("MARKET FETCH ERROR:", error);
  }
};

// ----------------------------------------------
// Load Dashboard Summary
// ----------------------------------------------
const fetchDashboardSummary = async (authToken: string) => {
  try {
    const { data } = await axios.get(`${API}/api/gold/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (data.success) {
      setDashboard(data.dashboard);
    }
  } catch (error) {
    console.error("DASHBOARD FETCH ERROR:", error);
  }
};

// ----------------------------------------------
// Load Recent Trades
// ----------------------------------------------
const fetchRecentTrades = async (authToken: string) => {
  try {
    const { data } = await axios.get(
      `${API}/api/gold/admin/recent-trades`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (data.success) {
      setRecentTrades(data.trades);
    }
  } catch (error) {
    console.error("RECENT TRADES ERROR:", error);
  }
};

// =====================================================
// LOAD ADMIN DASHBOARD (FINAL BUG-FREE V19)
// =====================================================

const loadDashboard = async () => {
  try {
    setLoading(true);
    setMessage("");

    const savedToken = localStorage.getItem("token");
    const savedRole = localStorage.getItem("role");
    const savedUsername = localStorage.getItem("username");
    const normalizedRole = savedRole || "";

    // ---------------- Login Check ----------------
    if (!savedToken) {
      router.push("/admin-login");
      return;
    }

    if (normalizedRole.toLowerCase() !== "admin") {
      router.push("/login");
      return;
    }

    setToken(savedToken);
    setRole(normalizedRole);
    setUsername(savedUsername || "");

    const headers = {
      Authorization: `Bearer ${savedToken}`,
      "Content-Type": "application/json",
    };

    // =====================================================
    // 1. DASHBOARD SUMMARY
    // GET /api/gold/admin/dashboard
    // =====================================================

    const dashboardRes = await axios.get(
      `${API}/api/gold/admin/dashboard`,
      { headers }
    );

    if (dashboardRes.data.success) {
      setDashboard(dashboardRes.data.dashboard);
    }

    // =====================================================
    // 2. LIVE MARKET SETTINGS
    // GET /api/gold/price
    // =====================================================

    const marketRes = await axios.get(
      `${API}/api/gold/price`,
      { headers }
    );

    if (marketRes.data.success) {
      setSettings(marketRes.data.data);
    }

    // =====================================================
    // 3. RECENT GOLD TRADES
    // GET /api/gold/admin/recent-trades
    // =====================================================

    const tradesRes = await axios.get(
      `${API}/api/gold/admin/recent-trades`,
      { headers }
    );

    if (tradesRes.data.success) {
      setRecentTrades(tradesRes.data.trades || []);
    }

  } catch (error: any) {
    console.error("LOAD DASHBOARD ERROR:", error);

    setMessage(
      error.response?.data?.message ||
      "Failed to load Admin Dashboard."
    );

    setMessageType("error");
  } finally {
    setLoading(false);
  }
};

// ----------------------------------------------
// Auto Load Dashboard
// ----------------------------------------------

useEffect(() => {
  console.log("✅ Dashboard useEffect running");
  loadDashboard();
}, []);
// ----------------------------------------------
// Auto Refresh Every 30 Seconds
// ----------------------------------------------
useEffect(() => {
  if (!token) return;

  const interval = setInterval(() => {
    fetchMarketSettings(token);
    fetchDashboardSummary(token);
    fetchRecentTrades(token);
  }, 30000);

  return () => clearInterval(interval);
}, [token]);

// ======================================================
// GOLDTRADE V19 ADMIN DASHBOARD
// PART 3/8 - SAVE MARKET SETTINGS
// ======================================================

const saveMarketSettings = async () => {
  try {
    setSaving(true);
    setMessage("");

    if (!token) {
      setMessage("Admin token not found. Please login again.");
      setMessageType("error");
      return;
    }

    const payload = {
      buyPrice: Number(settings.buyPrice),
      sellPrice: Number(settings.sellPrice),
      goldPriceUSD: Number(settings.goldPriceUSD),
      usdToPkr: Number(settings.usdToPkr),
      tradingEnabled: settings.tradingEnabled,
      marketStatus: settings.marketStatus,
    };

    const { data } = await axios.put(
      `${API}/api/gold/price`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (data.success) {
      setSettings(data.data);

      setMessage("✅ Market settings saved successfully.");
      setMessageType("success");

      // Dashboard refresh
      await fetchDashboardSummary(token);
      await fetchMarketSettings(token);
    } else {
      setMessage(data.message || "Unable to save market settings.");
      setMessageType("error");
    }
  } catch (error: any) {
    console.error("SAVE MARKET SETTINGS ERROR:", error);

    const status = error.response?.status;

    if (status === 401) {
      setMessage("Session expired. Please login again.");
    } else if (status === 403) {
      setMessage("Only admin can update market settings.");
    } else if (status === 404) {
      setMessage("Market settings API not found.");
    } else {
      setMessage(
        error.response?.data?.message || "Failed to save market settings."
      );
    }

    setMessageType("error");
  } finally {
    setSaving(false);
  }
};

// ======================================================
// INPUT CHANGE HANDLER
// ======================================================

const updateSetting = (
  field: keyof MarketSettings,
  value: string | boolean
) => {
  setSettings((prev) => ({
    ...prev,
    [field]:
      typeof value === "boolean" ? value : Number(value),
  }));
};
// ======================================================
// GOLDTRADE V19 ADMIN DASHBOARD
// PART 4/8 - SEARCH USER + LOAD USER WALLET
// ======================================================

// ----------------------------------------------
// SEARCH USER
// ----------------------------------------------
const searchUser = async () => {
  try {
    setMessage("");

    if (!token) {
      setMessage("Please login again.");
      setMessageType("error");
      return;
    }

    if (!searchText.trim()) {
      setMessage("Enter username, email or phone.");
      setMessageType("error");
      return;
    }

    const { data } = await axios.get(
      `${API}/api/gold/admin/user/search?q=${encodeURIComponent(searchText)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (data.success) {
      setSelectedUser(data.user);

      setMessage("✅ User found successfully.");
      setMessageType("success");

      // Refresh complete wallet details
      await loadUserWallet(data.user._id);
    }
  } catch (error: any) {
    console.error("SEARCH USER ERROR:", error);

    setSelectedUser(null);

    setMessage(
      error.response?.data?.message || "User not found."
    );
    setMessageType("error");
  }
};

// ----------------------------------------------
// LOAD USER GOLD WALLET
// ----------------------------------------------
const loadUserWallet = async (userId: string) => {
  try {
    const { data } = await axios.get(
      `${API}/api/gold/admin/user/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (data.success) {
      setSelectedUser(data.user);
    }
  } catch (error) {
    console.error("LOAD USER WALLET ERROR:", error);
  }
};

// ----------------------------------------------
// CLEAR SEARCH
// ----------------------------------------------
const clearSearch = () => {
  setSearchText("");
  setSelectedUser(null);
  setGoldAmount("");
  setWalletReason("");
  setMessage("");
};

// ----------------------------------------------
// REFRESH SELECTED USER
// ----------------------------------------------
const refreshSelectedUser = async () => {
  if (!selectedUser) return;

  await loadUserWallet(selectedUser._id);
};

// ======================================================
// SEARCH USER UI
// ======================================================

const SearchUserSection = () => (
  <div className="bg-white rounded-xl shadow-md p-5 mb-6">
    <h2 className="text-xl font-bold mb-4 text-gray-800">
      Search User
    </h2>

    <div className="flex gap-3">
      <input
        type="text"
        placeholder="Username / Email / Phone"
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        className="flex-1 border rounded-lg px-4 py-2 outline-none"
      />

      <button
        onClick={searchUser}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-lg"
      >
        Search
      </button>

      <button
        onClick={clearSearch}
        className="bg-gray-500 hover:bg-gray-600 text-white px-5 rounded-lg"
      >
        Clear
      </button>
    </div>

    {selectedUser && (
      <div className="mt-6 border rounded-xl p-4 bg-gray-50">
        <h3 className="font-semibold text-lg mb-3 text-green-700">
          User Details
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">

          <div>
            <p className="text-gray-500">Username</p>
            <p className="font-semibold">{selectedUser.username}</p>
          </div>

          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-semibold">{selectedUser.email}</p>
          </div>

          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-semibold">{selectedUser.phone}</p>
          </div>

          <div>
            <p className="text-gray-500">Gold Wallet</p>
            <p className="font-semibold text-yellow-600">
              {selectedUser.goldWallet.toFixed(4)} g
            </p>
          </div>

          <div>
            <p className="text-gray-500">PKR Wallet</p>
            <p className="font-semibold text-green-600">
              PKR {selectedUser.pkrWallet.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Current Buy Value</p>
            <p className="font-semibold">
              PKR {selectedUser.currentBuyValue.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Current Sell Value</p>
            <p className="font-semibold">
              PKR {selectedUser.currentSellValue.toLocaleString()}
            </p>
          </div>

        </div>

        <button
          onClick={refreshSelectedUser}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          Refresh Wallet
        </button>
      </div>
    )}
  </div>
);

// ======================================================
// GOLDTRADE V19 ADMIN DASHBOARD
// PART 5/8 - CREDIT / DEBIT GOLD WALLET
// ======================================================

// ----------------------------------------------
// UPDATE GOLD WALLET (Credit / Debit)
// ----------------------------------------------
const updateGoldWallet = async (
  action: "credit" | "debit"
) => {
  try {
    setSaving(true);
    setMessage("");

    if (!token) {
      setMessage("Please login again.");
      setMessageType("error");
      return;
    }

    if (!selectedUser) {
      setMessage("Please search a user first.");
      setMessageType("error");
      return;
    }

    const amount = Number(goldAmount);

    if (!amount || amount <= 0) {
      setMessage("Enter a valid gold amount.");
      setMessageType("error");
      return;
    }

    const payload = {
      amount,
      action,
      reason: walletReason.trim(),
    };

    const { data } = await axios.put(
      `${API}/api/gold/admin/user/${selectedUser._id}/wallet`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (data.success) {
      setMessage(data.message);
      setMessageType("success");

      // Refresh wallet
      await loadUserWallet(selectedUser._id);

      // Refresh dashboard stats
      await fetchDashboardSummary(token);

      setGoldAmount("");
      setWalletReason("");
    }

  } catch (error: any) {
    console.error("GOLD WALLET ERROR:", error);

    setMessage(
      error.response?.data?.message ||
      "Unable to update gold wallet."
    );
    setMessageType("error");

  } finally {
    setSaving(false);
  }
};

// ----------------------------------------------
// CREDIT GOLD
// ----------------------------------------------
const creditGold = async () => {
  await updateGoldWallet("credit");
};

// ----------------------------------------------
// DEBIT GOLD
// ----------------------------------------------
const debitGold = async () => {
  await updateGoldWallet("debit");
};

// ======================================================
// GOLD WALLET UI SECTION
// ======================================================

const GoldWalletSection = () => (
  <div className="bg-white rounded-xl shadow-md p-5 mt-6">
    <h2 className="text-xl font-bold mb-4 text-gray-800">
      Gold Wallet Management
    </h2>

    {!selectedUser ? (
      <div className="bg-yellow-100 text-yellow-700 p-3 rounded-lg">
        Search a user before crediting or debiting gold.
      </div>
    ) : (
      <>
        <div className="grid grid-cols-2 gap-4 mb-4">

          <div>
            <label className="block text-sm mb-1 font-medium">
              Gold Amount (Grams)
            </label>

            <input
              type="number"
              step="0.0001"
              value={goldAmount}
              onChange={(e) => setGoldAmount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Enter grams"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-medium">
              Reason
            </label>

            <input
              type="text"
              value={walletReason}
              onChange={(e) => setWalletReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Optional reason"
            />
          </div>

        </div>

        <div className="flex gap-3">

          <button
            disabled={saving}
            onClick={creditGold}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Processing..." : "Credit Gold"}
          </button>

          <button
            disabled={saving}
            onClick={debitGold}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Processing..." : "Debit Gold"}
          </button>

        </div>

        <div className="mt-5 border-t pt-4">
          <p className="text-sm text-gray-500">Current Gold Wallet</p>

          <p className="text-2xl font-bold text-yellow-600">
            {selectedUser.goldWallet.toFixed(4)} g
          </p>

          <p className="text-sm text-gray-500 mt-2">
            PKR Wallet Balance
          </p>

          <p className="text-xl font-semibold text-green-600">
            PKR {selectedUser.pkrWallet.toLocaleString()}
          </p>
        </div>
      </>
    )}
  </div>
);

// ======================================================
// GOLDTRADE V19 ADMIN DASHBOARD
// PART 6/8 - DASHBOARD CARDS + LIVE MARKET UI
// ======================================================

if (loading) {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-yellow-600">
          GoldTrade Admin Dashboard
        </h2>
        <p className="mt-2 text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gray-100 p-6">

    {/* ===================================== */}
    {/* HEADER */}
    {/* ===================================== */}

    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-yellow-600">
          GoldTrade Admin Dashboard
        </h1>

        <p className="text-gray-600">
          Welcome, <span className="font-semibold">{username}</span>
        </p>
      </div>

      <button
        onClick={logout}
        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
      >
        Logout
      </button>
    </div>

    {/* ===================================== */}
    {/* MESSAGE ALERT */}
    {/* ===================================== */}

    {message && (
      <div
        className={`mb-5 rounded-lg px-4 py-3 text-white font-medium ${
          messageType === "success"
            ? "bg-green-600"
            : messageType === "error"
            ? "bg-red-600"
            : "bg-blue-600"
        }`}
      >
        {message}
      </div>
    )}

    {/* ===================================== */}
    {/* DASHBOARD SUMMARY CARDS */}
    {/* ===================================== */}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-sm text-gray-500">Total Users</p>
        <h2 className="text-3xl font-bold text-blue-600">
          {dashboard.totalUsers}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-sm text-gray-500">Total Trades</p>
        <h2 className="text-3xl font-bold text-purple-600">
          {dashboard.totalTrades}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-sm text-gray-500">Completed Trades</p>
        <h2 className="text-3xl font-bold text-green-600">
          {dashboard.completedTrades}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-sm text-gray-500">Gold in Wallets</p>
        <h2 className="text-3xl font-bold text-yellow-600">
          {dashboard.totalGoldInWallets.toFixed(2)} g
        </h2>
      </div>

    </div>

    {/* ===================================== */}
    {/* LIVE MARKET SETTINGS */}
    {/* ===================================== */}

    <div className="bg-white rounded-xl shadow-md p-6 mb-8">

      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-gray-800">
          Live Gold Market
        </h2>

        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            settings.marketStatus === "OPEN"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {settings.marketStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Buy Price */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Buy Gold Price (PKR)
          </label>

          <input
            type="number"
            value={settings.buyPrice}
            onChange={(e) =>
              updateSetting("buyPrice", e.target.value)
            }
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        {/* Sell Price */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Sell Gold Price (PKR)
          </label>

          <input
            type="number"
            value={settings.sellPrice}
            onChange={(e) =>
              updateSetting("sellPrice", e.target.value)
            }
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        {/* Gold USD */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Gold Price (USD/Ounce)
          </label>

          <input
            type="number"
            value={settings.goldPriceUSD}
            onChange={(e) =>
              updateSetting("goldPriceUSD", e.target.value)
            }
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

        {/* USD PKR */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            USD to PKR
          </label>

          <input
            type="number"
            value={settings.usdToPkr}
            onChange={(e) =>
              updateSetting("usdToPkr", e.target.value)
            }
            className="w-full border rounded-lg px-4 py-2"
          />
        </div>

      </div>

      {/* Trading Toggle */}

      <div className="mt-5 flex flex-wrap items-center gap-4">

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.tradingEnabled}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                tradingEnabled: e.target.checked,
              }))
            }
          />

          <span className="font-medium">
            Trading Enabled
          </span>
        </label>

        <button
          onClick={() =>
            setSettings((prev) => ({
              ...prev,
              marketStatus:
                prev.marketStatus === "OPEN" ? "CLOSED" : "OPEN",
            }))
          }
          className={`px-4 py-2 rounded-lg text-white ${
            settings.marketStatus === "OPEN"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {settings.marketStatus === "OPEN"
            ? "Market Open"
            : "Market Closed"}
        </button>

        <button
          disabled={saving}
          onClick={saveMarketSettings}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-5 py-2 rounded-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Market Settings"}
        </button>

      </div>

      {/* Live Summary */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500">Buy Price</p>
          <h3 className="font-bold text-lg text-green-600">
            PKR {settings.buyPrice.toLocaleString()}
          </h3>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500">Sell Price</p>
          <h3 className="font-bold text-lg text-red-600">
            PKR {settings.sellPrice.toLocaleString()}
          </h3>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500">Spread</p>
          <h3 className="font-bold text-lg text-yellow-600">
            PKR {(settings.buyPrice - settings.sellPrice).toLocaleString()}
          </h3>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500">USD/PKR</p>
          <h3 className="font-bold text-lg text-blue-600">
            PKR {settings.usdToPkr}
          </h3>
        </div>

      </div>

    </div>

    {/* ===================================== */}
    {/* SEARCH USER SECTION */}
    {/* ===================================== */}

    <SearchUserSection />

    {/* ===================================== */}
    {/* GOLD WALLET SECTION */}
    {/* ===================================== */}

    <GoldWalletSection />
        {/* ===================================== */}
    {/* RECENT GOLD TRADES */}
    {/* ===================================== */}

    <div className="bg-white rounded-xl shadow-md p-6 mt-8">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-gray-800">
          Recent Gold Trades
        </h2>

        <button
          onClick={() => fetchRecentTrades(token)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          Refresh
        </button>
      </div>

      {recentTrades.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No recent gold trades found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-yellow-500 text-black">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Grams</th>
                <th className="px-4 py-3 text-center">Price / Gram</th>
                <th className="px-4 py-3 text-center">Total Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Date</th>
              </tr>
            </thead>

            <tbody>
              {recentTrades.map((trade) => (
                <tr
                  key={trade._id}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold">
                      {trade.userId?.username || "Unknown User"}
                    </div>

                    <div className="text-xs text-gray-500">
                      {trade.userId?.email}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                        trade.type === "BUY"
                          ? "bg-green-600"
                          : trade.type === "SELL"
                          ? "bg-red-600"
                          : "bg-blue-600"
                      }`}
                    >
                      {trade.type}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center font-semibold">
                    {Number(trade.grams).toFixed(4)} g
                  </td>

                  <td className="px-4 py-3 text-center">
                    PKR {Number(trade.pricePerGram).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-center font-semibold text-green-700">
                    PKR {Number(trade.totalAmount).toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-xs ${
                        trade.status === "COMPLETED"
                          ? "bg-green-600"
                          : "bg-orange-500"
                      }`}
                    >
                      {trade.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {new Date(trade.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* ===================================== */}
    {/* DASHBOARD TOTALS */}
    {/* ===================================== */}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-sm text-gray-500">Total Buy Volume</p>

        <h2 className="text-2xl font-bold text-green-600">
          {dashboard.totalGoldBought.toFixed(4)} g
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-sm text-gray-500">Total Sell Volume</p>

        <h2 className="text-2xl font-bold text-red-600">
          {dashboard.totalGoldSold.toFixed(4)} g
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-sm text-gray-500">Buy Value</p>

        <h2 className="text-2xl font-bold text-blue-700">
          PKR {dashboard.totalBuyAmount.toLocaleString()}
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-sm text-gray-500">Sell Value</p>

        <h2 className="text-2xl font-bold text-purple-700">
          PKR {dashboard.totalSellAmount.toLocaleString()}
        </h2>
      </div>

    </div>

    {/* ===================================== */}
    {/* SYSTEM STATUS */}
    {/* ===================================== */}

    <div className="bg-white rounded-xl shadow-md p-6 mt-8 mb-8">

      <h2 className="text-xl font-bold text-gray-800 mb-4">
        System Status
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-500">Market Status</p>

          <p
            className={`text-lg font-bold ${
              settings.marketStatus === "OPEN"
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {settings.marketStatus}
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-500">Trading</p>

          <p
            className={`text-lg font-bold ${
              settings.tradingEnabled
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {settings.tradingEnabled ? "Enabled" : "Disabled"}
          </p>
        </div>

        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-500">Users PKR Wallet</p>

          <p className="text-lg font-bold text-blue-600">
            PKR {dashboard.totalPKRInWallets.toLocaleString()}
          </p>
        </div>

      </div>

    </div>
        {/* ===================================== */}
    {/* FOOTER */}
    {/* ===================================== */}

    <div className="mt-10 border-t pt-6 text-center text-sm text-gray-500">
      <p className="font-semibold text-yellow-600">
        GoldTrade V19 Admin Dashboard
      </p>

      <p>Live Gold Trading Management Panel</p>

      <p className="mt-2">
        Market Status:
        <span
          className={`ml-2 font-semibold ${
            settings.marketStatus === "OPEN"
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {settings.marketStatus}
        </span>
      </p>

      <p>
        Trading:
        <span
          className={`ml-2 font-semibold ${
            settings.tradingEnabled
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {settings.tradingEnabled ? "Enabled" : "Disabled"}
        </span>
      </p>
    </div>
  </div>
);
}