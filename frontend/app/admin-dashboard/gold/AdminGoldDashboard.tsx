"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

// ==============================================
// GOLDTRADE V18 ADMIN API
// ==============================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// ==============================================
// TYPES
// ==============================================

interface GoldSettings {
  buyPrice: number;
  sellPrice: number;
  goldPriceUSD: number;
  usdToPkr: number;
  tradingEnabled: boolean;
  marketStatus: string;
}

interface UserData {
  _id: string;
  fullName: string;
  username: string;
  walletBalance: number;
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
    usdToPkr: 0,
    tradingEnabled: true,
    marketStatus: "OPEN",
  });

  // ==============================================
  // USER SEARCH
  // ==============================================

  const [searchUsername, setSearchUsername] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // ==============================================
  // GOLD WALLET FORM
  // ==============================================

  const [goldAmount, setGoldAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");

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

  // =====================================================
// FETCH LIVE GOLD SETTINGS (FINAL V18)
// =====================================================

const fetchSettings = async () => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token");

    const { data } = await axios.get(`${API}/api/gold/price`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (data.success) {
      setSettings({
        buyPrice: data.data.buyPrice,
        sellPrice: data.data.sellPrice,
        goldPriceUSD: data.data.goldPriceUSD,
        usdToPkr: data.data.usdToPkr,
        tradingEnabled: data.data.tradingEnabled,
        marketStatus: data.data.marketStatus,
      });

      setMessage("");
    }

  } catch (err) {
    console.error("FETCH SETTINGS ERROR:", err);
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
  // SEARCH USER
  // ==============================================

  const searchUser = async () => {
    if (!searchUsername) {
      setMessage("Enter username first.");
      setMessageType("error");
      return;
    }

    try {
      const res = await axios.get(
        `${API}/api/gold/admin/user/${searchUsername}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        setSelectedUser(res.data.user);

        setMessage("User loaded successfully.");
        setMessageType("success");
      }

    } catch (error: any) {
      console.error(error);

      setSelectedUser(null);

      setMessage(
        error.response?.data?.message || "User not found."
      );

      setMessageType("error");
    }
  };
    // ==============================================
  // INPUT CHANGE
  // ==============================================

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // ==============================================
  // TOGGLE MARKET STATUS
  // ==============================================

  const toggleMarket = () => {
    setSettings((prev) => ({
      ...prev,
      tradingEnabled: !prev.tradingEnabled,
      marketStatus: prev.tradingEnabled ? "CLOSED" : "OPEN",
    }));
  };

 // =====================================================
// SAVE MARKET SETTINGS (FINAL V18)
// =====================================================

const saveMarketSettings = async () => {
  try {
    const token = localStorage.getItem("token");

    const { data } = await axios.put(
      `${API}/api/gold/price`,
      {
        buyPrice: settings.buyPrice,
        sellPrice: settings.sellPrice,
        goldPriceUSD: settings.goldPriceUSD,
        usdToPkr: settings.usdToPkr,
        tradingEnabled: settings.tradingEnabled,
        marketStatus: settings.marketStatus,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (data.success) {
      setMessage("✅ Market Settings Saved Successfully");
      setMessageType("success");
      fetchSettings();
    }

  } catch (err) {
    console.error("SAVE SETTINGS ERROR:", err);
    setMessage("❌ Failed to save market settings.");
    setMessageType("error");
  }
};
  // ==============================================
  // CREDIT / DEBIT GOLD WALLET
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
        `${API}/api/gold/admin/gold/wallet/${selectedUser._id}`,
        {
          amount: Number(goldAmount),
          action,
          reason: walletReason,
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
      console.error("GOLD WALLET ERROR:", error);

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
          <p className="text-gray-400 text-sm">Live Buy Price</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            PKR {settings.buyPrice.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Live Sell Price</p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            PKR {settings.sellPrice.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Gold USD / Ounce</p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            ${settings.goldPriceUSD.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">USD → PKR</p>

          <h2 className="text-3xl font-black text-cyan-400 mt-2">
            {settings.usdToPkr}
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

          {/* BUY PRICE */}

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Buy Gold Price (PKR / Gram)
            </label>

            <input
              type="number"
              name="buyPrice"
              value={settings.buyPrice}
              onChange={handleInput}
              className="w-full bg-black border border-green-500 rounded-xl px-4 py-4 text-green-400 text-xl font-bold outline-none focus:border-green-400"
            />
          </div>

          {/* SELL PRICE */}

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Sell Gold Price (PKR / Gram)
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

          {/* USD TO PKR */}

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              USD → PKR Exchange Rate
            </label>

            <input
              type="number"
              name="usdToPkr"
              value={settings.usdToPkr}
              onChange={handleInput}
              className="w-full bg-black border border-cyan-500 rounded-xl px-4 py-4 text-cyan-400 text-xl font-bold outline-none focus:border-cyan-400"
            />
          </div>

        </div>

        {/* SAVE SETTINGS BUTTON */}

        <button
          onClick={saveMarketSettings}
          disabled={saving}
          className="w-full mt-8 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black text-xl font-black py-4 rounded-2xl transition-all duration-300"
        >
          {saving
            ? "Saving Gold Settings..."
            : "💾 SAVE MARKET SETTINGS"}
        </button>

      </div>
            {/* ============================================== */}
      {/* GOLD WALLET MANAGEMENT */}
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
                  PKR{" "}
                  {Number(selectedUser.walletBalance).toLocaleString()}
                </h4>
              </div>

            </div>

            {/* AVERAGE BUY PRICE */}

            <div className="mt-6 bg-zinc-900 rounded-xl p-5 border border-blue-500">

              <p className="text-gray-400 text-sm">
                Average Buy Price
              </p>

              <h4 className="text-blue-400 font-bold text-2xl mt-2">
                PKR{" "}
                {Number(
                  selectedUser.goldAveragePrice || 0
                ).toLocaleString()}
              </h4>

            </div>

          </div>
        )}

        {/* WALLET UPDATE FORM */}

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
              value={walletReason}
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
            🟢 CREDIT GOLD WALLET
          </button>

          <button
            onClick={() => updateGoldWallet("debit")}
            disabled={saving || !selectedUser}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black text-lg py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
          >
            🔴 DEBIT GOLD WALLET
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
            onClick={saveMarketSettings}
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
            <span className="text-gray-400">Buy Gold Price</span>

            <span className="text-green-400 font-bold">
              PKR {settings.buyPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between border-b border-zinc-800 pb-3">
            <span className="text-gray-400">Sell Gold Price</span>

            <span className="text-red-400 font-bold">
              PKR {settings.sellPrice.toLocaleString()}
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
              USD → PKR Rate
            </span>

            <span className="text-cyan-400 font-bold">
              {settings.usdToPkr}
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