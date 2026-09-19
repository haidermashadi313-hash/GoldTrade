"use client";

import { useEffect, useState } from "react";
import axios from "axios";

// ==============================================
// GoldTrade V18 ADMIN API
// ==============================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==============================================
// TYPES
// ==============================================

interface GoldSettings {
  buyPrice: number;
  sellPrice: number;
  goldPriceUSD: number;
  UsdtoPkr: number;
  tradingEnabled: boolean;
  marketStatus: string;
}

interface UserData {
  _id: string;
  fullName: string;
  username: string;
  WalletBalance: number;
  goldBalance: number;
  goldAveragePrice: number;
}

export default function AdminGoldDashboard() {

  // ==============================================
  // AUTH
  // ==============================================

  const [token, setToken] = useState("");

  // ==============================================
  // GOLD SETTINGS
  // ==============================================

  const [settings, setSettings] = useState<GoldSettings>({
    buyPrice: 0,
    sellPrice: 0,
    goldPriceUSD: 0,
    UsdtoPkr: 0,
    tradingEnabled: true,
    marketStatus: "OPEN",
  });

  // ==============================================
  // USER SEARCH
  // ==============================================

  const [searchUsername, setSearchUsername] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // ==============================================
  // GOLD Wallet FORM
  // ==============================================

  const [goldAmount, setGoldAmount] = useState("");
  const [WalletReason, setWalletReason] = useState("");

  // ==============================================
  // UI STATES
  // ==============================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  // ==============================================
  // LOAD JWT TOKEN
  // ==============================================

  useEffect(() => {
    const savedToken = localStorage.getItem("token") || "";
    setToken(savedToken);
  }, []);

  // ==============================================
  // SEARCH USER
  // ==============================================

  const searchUser = async () => {
    const username = searchUsername.trim();

    if (!username) {
      setMessage("Enter a username to search.");
      setMessageType("error");
      return;
    }

    try {
      const res = await axios.get(`${API}/api/gold/admin/users/search`, {
        params: { username },
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token")}`,
        },
      });

      if (res.data.success) {
        setSelectedUser(res.data.data);
        setMessage("");
        return;
      }

      setSelectedUser(null);
      setMessage(res.data.message || "User not found.");
      setMessageType("error");
    } catch (error: any) {
      console.error("SEARCH USER ERROR:", error);
      setSelectedUser(null);
      setMessage(
        error.response?.data?.message || "Unable to search user."
      );
      setMessageType("error");
    }
  };

  // ==============================================
  // TOGGLE MARKET
  // ==============================================

  const toggleMarket = async () => {
    const nextTradingEnabled = !settings.tradingEnabled;
    const nextMarketStatus = nextTradingEnabled ? "OPEN" : "CLOSED";

    try {
      setSaving(true);

      await axios.put(
        `${API}/api/gold/admin/gold/settings`,
        {
          buyGoldPrice: settings.buyPrice,
          sellGoldPrice: settings.sellPrice,
          goldPriceUSD: settings.goldPriceUSD,
          UsdtoPkr: settings.UsdtoPkr,
          goldTradingEnabled: nextTradingEnabled,
          marketStatus: nextMarketStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem("token")}`,
          },
        }
      );

      setSettings((prev) => ({
        ...prev,
        tradingEnabled: nextTradingEnabled,
        marketStatus: nextMarketStatus,
      }));

      setMessage(
        nextTradingEnabled
          ? "Market opened successfully."
          : "Market closed successfully."
      );
      setMessageType("success");

      await fetchSettings();
    } catch (error: any) {
      console.error("TOGGLE MARKET ERROR:", error);
      setMessage(
        error.response?.data?.message || "Unable to update market status."
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // ==============================================
  // HANDLE SETTINGS INPUT
  // ==============================================

  const handleInput = (e: any) => {
    const { name, value } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

 // ==============================================
// FETCH GOLD SETTINGS (GoldTrade V18 FINAL)
// ==============================================

const fetchSettings = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token");

    const res = await axios.get(`${API}/api/gold/price`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.success) {
      const market = res.data.data;

      setSettings({
        buyPrice: Number(market.buyPrice ?? 0),
        sellPrice: Number(market.sellPrice ?? 0),
        goldPriceUSD: Number(market.goldPriceUSD ?? 0),
        UsdtoPkr: Number(market.UsdtoPkr ?? 0),
        tradingEnabled: market.tradingEnabled ?? true,
        marketStatus: market.marketStatus ?? "OPEN",
      });

      setMessage("");
    }

  } catch (error) {
    console.error("FETCH SETTINGS ERROR:", error);

    setMessage("Unable to load Gold Settings.");
    setMessageType("error");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchSettings();
}, []);

  // ==============================================
  // SAVE GOLD MARKET SETTINGS
  // ==============================================

  const saveSettings = async () => {
    try {
      setSaving(true);

      await axios.put(
        `${API}/api/gold/admin/gold/settings`,
        {
          buyGoldPrice: settings.buyPrice,
          sellGoldPrice: settings.sellPrice,
          goldPriceUSD: settings.goldPriceUSD,
          UsdtoPkr: settings.UsdtoPkr,
          goldTradingEnabled: settings.tradingEnabled,
          marketStatus: settings.marketStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Gold Market Settings Updated Successfully.");
      setMessageType("success");

      fetchSettings();

    } catch (error: any) {
      console.error("SAVE SETTINGS ERROR:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to update Gold Settings."
      );

      setMessageType("error");

    } finally {
      setSaving(false);
    }
  };

  // ==============================================
  // CREDIT / DEBIT GOLD Wallet
  // ==============================================

  const updateGoldWallet = async (
    action: "credit" | "debit"
  ) => {

    if (!selectedUser) {
      setMessage("Please search a user first.");
      setMessageType("error");
      return;
    }

    if (!goldAmount || Number(goldAmount) <= 0) {
      setMessage("Enter a valid gold amount.");
      setMessageType("error");
      return;
    }

    try {
      setSaving(true);

      const res = await axios.put(
        `${API}/api/gold/admin/gold/Wallet/${selectedUser._id}`,
        {
          amount: Number(goldAmount),
          action,
          reason: WalletReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        setMessage(
          action === "credit"
            ? "Gold credited successfully."
            : "Gold debited successfully."
        );

        setMessageType("success");

        setGoldAmount("");
        setWalletReason("");

        await searchUser();
      }

    } catch (error: any) {
      console.error("GOLD Wallet ERROR:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to update Gold Wallet."
      );

      setMessageType("error");

    } finally {
      setSaving(false);
    }
  };

  // ==============================================
  // REFRESH ALL DATA
  // ==============================================

  const refreshDashboard = async () => {
    await fetchSettings();

    if (selectedUser) {
      await searchUser();
    }
  };

  // ==============================================
  // AUTO REFRESH (30 Seconds)
  // ==============================================

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSettings();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ==============================================
  // LOADING SCREEN
  // ==============================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">

        <div className="text-center">

          <div className="h-16 w-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>

          <h2 className="text-yellow-400 text-3xl font-black">
            GOLD ADMIN PANEL
          </h2>

          <p className="text-gray-400 mt-2">
            Loading Market Settings...
          </p>

        </div>

      </div>
    );
  }

  // ==============================================
  // PAGE UI STARTS
  // ==============================================

  return (
    <div className="min-h-screen bg-[#070707] text-white p-6">
          {/* ============================================== */}
      {/* HEADER */}
      {/* ============================================== */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <div>
          <h1 className="text-5xl font-black text-yellow-400">
            GOLD ADMIN PANEL
          </h1>

          <p className="text-gray-400 mt-2">
            Enterprise GoldTrade V18 • Live Market Control
          </p>
        </div>

        <button
          onClick={refreshDashboard}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105"
        >
          🔄 Refresh
        </button>

      </div>

      {/* SUCCESS / ERROR MESSAGE */}

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

      {/* ============================================== */}
      {/* LIVE GOLD STATUS CARDS */}
      {/* ============================================== */}

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Live buy Price</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            Pkr {settings.buyPrice.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Live sell Price</p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            Pkr {settings.sellPrice.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Gold USD / Ounce</p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            ${settings.goldPriceUSD.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">USD → Pkr</p>

          <h2 className="text-3xl font-black text-cyan-400 mt-2">
            {settings.UsdtoPkr}
          </h2>
        </div>

      </div>

      {/* ============================================== */}
      {/* MARKET STATUS */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6 mb-8">

        <div className="flex justify-between items-center flex-wrap gap-4">

          <div>
            <p className="text-gray-400 text-sm">Market Status</p>

            <h2
              className={`text-3xl font-black mt-2 ${
                settings.tradingEnabled
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {settings.marketStatus}
            </h2>
          </div>

          <button
            onClick={toggleMarket}
            className={`px-6 py-3 rounded-xl font-bold transition ${
              settings.tradingEnabled
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-green-600 hover:bg-green-500 text-white"
            }`}
          >
            {settings.tradingEnabled
              ? "🔒 Close Market"
              : "🟢 Open Market"}
          </button>

        </div>

      </div>

      {/* ============================================== */}
      {/* GOLD MARKET SETTINGS */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-yellow-400 mb-8">
          Live Gold Market Settings
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          {/* buy PRICE */}

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              buy Gold Price (Pkr / Gram)
            </label>

            <input
              type="number"
              name="buyPrice"
              value={settings.buyPrice}
              onChange={handleInput}
              className="w-full bg-black border border-green-500 rounded-xl px-4 py-4 text-green-400 text-xl font-bold outline-none focus:border-green-400"
            />
          </div>

          {/* sell PRICE */}

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              sell Gold Price (Pkr / Gram)
            </label>

            <input
              type="number"
              name="sellPrice"
              value={settings.sellPrice}
              onChange={handleInput}
              className="w-full bg-black border border-red-500 rounded-xl px-4 py-4 text-red-400 text-xl font-bold outline-none focus:border-red-400"
            />
          </div>

          {/* USD GOLD PRICE */}

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              International Gold Price (USD / Ounce)
            </label>

            <input
              type="number"
              name="goldPriceUSD"
              value={settings.goldPriceUSD}
              onChange={handleInput}
              className="w-full bg-black border border-yellow-500 rounded-xl px-4 py-4 text-yellow-400 text-xl font-bold outline-none focus:border-yellow-400"
            />
          </div>

          {/* USD TO Pkr */}

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              USD → Pkr Exchange Rate
            </label>

            <input
              type="number"
              name="UsdtoPkr"
              value={settings.UsdtoPkr}
              onChange={handleInput}
              className="w-full bg-black border border-cyan-500 rounded-xl px-4 py-4 text-cyan-400 text-xl font-bold outline-none focus:border-cyan-400"
            />
          </div>

        </div>

        {/* SAVE SETTINGS BUTTON */}

        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full mt-8 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black text-xl font-black py-4 rounded-2xl transition-all duration-300"
        >
          {saving
            ? "Saving Gold Settings..."
            : "💾 SAVE MARKET SETTINGS"}
        </button>

      </div>
            {/* ============================================== */}
      {/* GOLD Wallet MANAGEMENT */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-blue-400 mb-6">
          Gold Wallet Management
        </h2>

        {/* SEARCH USER */}

        <div className="grid md:grid-cols-[2fr,1fr] gap-4 mb-6">

          <input
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            placeholder="Enter Username (Example: hashi90)"
            className="bg-black border border-zinc-700 rounded-xl px-4 py-4 text-white outline-none focus:border-yellow-500"
          />

          <button
            onClick={searchUser}
            className="bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-bold transition-all duration-300"
          >
            🔍 Search User
          </button>

        </div>

        {/* USER INFORMATION */}

        {selectedUser && (
          <div className="bg-black border border-zinc-700 rounded-2xl p-6 mb-8">

            <h3 className="text-2xl font-black text-yellow-400 mb-5">
              User Information
            </h3>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-700">
                <p className="text-gray-400 text-sm">Full Name</p>

                <h4 className="text-white font-bold mt-2">
                  {selectedUser.fullName}
                </h4>
              </div>

              <div className="bg-zinc-900 rounded-xl p-5 border border-zinc-700">
                <p className="text-gray-400 text-sm">Username</p>

                <h4 className="text-cyan-400 font-bold mt-2">
                  {selectedUser.username}
                </h4>
              </div>

              <div className="bg-zinc-900 rounded-xl p-5 border border-yellow-500">
                <p className="text-gray-400 text-sm">Gold Balance</p>

                <h4 className="text-yellow-400 font-bold text-xl mt-2">
                  {Number(selectedUser.goldBalance).toFixed(3)} g
                </h4>
              </div>

              <div className="bg-zinc-900 rounded-xl p-5 border border-green-500">
                <p className="text-gray-400 text-sm">Wallet Balance</p>

                <h4 className="text-green-400 font-bold text-xl mt-2">
                  Pkr{" "}
                  {Number(selectedUser.WalletBalance).toLocaleString()}
                </h4>
              </div>

            </div>

            {/* AVERAGE buy PRICE */}

            <div className="mt-6 bg-zinc-900 rounded-xl p-5 border border-blue-500">

              <p className="text-gray-400 text-sm">
                Average buy Price
              </p>

              <h4 className="text-blue-400 font-bold text-2xl mt-2">
                Pkr{" "}
                {Number(
                  selectedUser.goldAveragePrice || 0
                ).toLocaleString()}
              </h4>

            </div>

          </div>
        )}

        {/* Wallet UPDATE FORM */}

        <div className="grid md:grid-cols-2 gap-6">

          <div>

            <label className="block text-sm text-gray-400 mb-2">
              Gold Amount (Grams)
            </label>

            <input
              type="number"
              value={goldAmount}
              onChange={(e) => setGoldAmount(e.target.value)}
              placeholder="Enter Gold Amount"
              className="w-full bg-black border border-yellow-500 rounded-xl px-4 py-4 text-yellow-400 text-xl font-bold outline-none focus:border-yellow-400"
            />

          </div>

          <div>

            <label className="block text-sm text-gray-400 mb-2">
              Admin Reason (Optional)
            </label>

            <input
              value={WalletReason}
              onChange={(e) => setWalletReason(e.target.value)}
              placeholder="Bonus / Adjustment / Reward"
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-4 text-white outline-none focus:border-blue-500"
            />

          </div>

        </div>

        {/* LIVE PREVIEW */}

        <div className="mt-8 bg-black border border-zinc-700 rounded-2xl p-6">

          <h3 className="text-2xl font-black text-cyan-400 mb-5">
            Live Wallet Preview
          </h3>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-zinc-900 rounded-xl p-5 border border-yellow-500">
              <p className="text-gray-400 text-sm mb-2">
                Current Gold
              </p>

              <h3 className="text-yellow-400 text-2xl font-black">
                {selectedUser
                  ? Number(selectedUser.goldBalance).toFixed(3)
                  : "0.000"}{" "}
                g
              </h3>
            </div>

            <div className="bg-zinc-900 rounded-xl p-5 border border-green-500">
              <p className="text-gray-400 text-sm mb-2">
                After Credit
              </p>

              <h3 className="text-green-400 text-2xl font-black">
                {selectedUser
                  ? (
                      Number(selectedUser.goldBalance) +
                      Number(goldAmount || 0)
                    ).toFixed(3)
                  : "0.000"}{" "}
                g
              </h3>
            </div>

            <div className="bg-zinc-900 rounded-xl p-5 border border-red-500">
              <p className="text-gray-400 text-sm mb-2">
                After Debit
              </p>

              <h3 className="text-red-400 text-2xl font-black">
                {selectedUser
                  ? Math.max(
                      Number(selectedUser.goldBalance) -
                        Number(goldAmount || 0),
                      0
                    ).toFixed(3)
                  : "0.000"}{" "}
                g
              </h3>
            </div>

          </div>

        </div>

        {/* ACTION BUTTONS */}

        <div className="grid md:grid-cols-2 gap-5 mt-8">

          <button
            onClick={() => updateGoldWallet("credit")}
            disabled={saving || !selectedUser}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-black text-lg py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
          >
            🟢 CREDIT GOLD Wallet
          </button>

          <button
            onClick={() => updateGoldWallet("debit")}
            disabled={saving || !selectedUser}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-lg py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
          >
            🔴 DEBIT GOLD Wallet
          </button>

        </div>

      </div>      {/* ============================================== */}
      {/* SYSTEM STATUS */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-cyan-400 mb-6">
          GoldTrade Enterprise System Status
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* Trading Engine */}

          <div className="bg-black border border-green-500 rounded-2xl p-5 text-center">

            <div className="text-4xl mb-3">⚙️</div>

            <p className="text-gray-400 text-sm">
              Trading Engine
            </p>

            <h3 className="text-2xl font-black text-green-400 mt-2">
              ONLINE
            </h3>

          </div>

          {/* Market Status */}

          <div className="bg-black border border-yellow-500 rounded-2xl p-5 text-center">

            <div className="text-4xl mb-3">
              {settings.tradingEnabled ? "🟢" : "🔴"}
            </div>

            <p className="text-gray-400 text-sm">
              Market Status
            </p>

            <h3
              className={`text-2xl font-black mt-2 ${
                settings.tradingEnabled
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {settings.marketStatus}
            </h3>

          </div>

          {/* Gold API */}

          <div className="bg-black border border-blue-500 rounded-2xl p-5 text-center">

            <div className="text-4xl mb-3">🔗</div>

            <p className="text-gray-400 text-sm">
              Gold API
            </p>

            <h3 className="text-2xl font-black text-blue-400 mt-2">
              CONNECTED
            </h3>

          </div>

          {/* Auto Refresh */}

          <div className="bg-black border border-purple-500 rounded-2xl p-5 text-center">

            <div className="text-4xl mb-3">🔄</div>

            <p className="text-gray-400 text-sm">
              Auto Refresh
            </p>

            <h3 className="text-2xl font-black text-purple-400 mt-2">
              30 SEC
            </h3>

          </div>

        </div>

      </div>

      {/* ============================================== */}
      {/* ADMIN QUICK ACTIONS */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-green-500 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-green-400 mb-6">
          Admin Quick Actions
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          <button
            onClick={refreshDashboard}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-5 rounded-2xl transition-all duration-300 hover:scale-105"
          >
            🔄 Refresh Dashboard
          </button>

          <button
            onClick={toggleMarket}
            className={`font-bold py-5 rounded-2xl transition-all duration-300 hover:scale-105 ${
              settings.tradingEnabled
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-green-600 hover:bg-green-500 text-white"
            }`}
          >
            {settings.tradingEnabled
              ? "🔒 Close Market"
              : "🟢 Open Market"}
          </button>

          <button
            onClick={() => {
              setSearchUsername("");
              setSelectedUser(null);
              setGoldAmount("");
              setWalletReason("");
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl transition-all duration-300 hover:scale-105"
          >
            👤 Clear User
          </button>

          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold py-5 rounded-2xl transition-all duration-300 hover:scale-105"
          >
            💾 Save Settings
          </button>

        </div>

      </div>

      {/* ============================================== */}
      {/* LIVE MARKET SUMMARY */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-yellow-400 mb-6">
          Live Market Summary
        </h2>

        <div className="space-y-4">

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">buy Gold Price</span>

            <span className="text-green-400 font-bold">
              Pkr {settings.buyPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">sell Gold Price</span>

            <span className="text-red-400 font-bold">
              Pkr {settings.sellPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">
              Gold Price (USD / Ounce)
            </span>

            <span className="text-yellow-300 font-bold">
              ${settings.goldPriceUSD.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">
              USD → Pkr Rate
            </span>

            <span className="text-cyan-400 font-bold">
              {settings.UsdtoPkr}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">
              Trading Status
            </span>

            <span
              className={`font-bold ${
                settings.tradingEnabled
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {settings.marketStatus}
            </span>
          </div>

        </div>

      </div>

      {/* ============================================== */}
      {/* ENTERPRISE FOOTER */}
      {/* ============================================== */}

      <div className="mt-12 border-t border-zinc-800 pt-8 text-center text-gray-500 text-sm">

        <p className="font-semibold text-yellow-400 mb-2 text-lg">
          GoldTrade Enterprise V18 Admin Dashboard
        </p>

        <p>
          Live Gold Market • Wallet Management • Trading Control • Enterprise Security
        </p>

        <p className="mt-2">
          Powered by GoldTrade Enterprise Backend API
        </p>

        <div className="mt-5 flex justify-center gap-5 flex-wrap text-xs">

          <span className="text-green-400">
            🟢 Live Trading Enabled
          </span>

          <span className="text-yellow-400">
            ⚡ Enterprise V18
          </span>

          <span className="text-blue-400">
            🔒 JWT Protected
          </span>

          <span className="text-cyan-400">
            📊 Auto Refresh 30 Seconds
          </span>

          <span className="text-purple-400">
            👑 Admin Gold Control
          </span>

        </div>

      </div>

    </div>
  );
}