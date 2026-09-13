"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { loginUser } from "@/lib/api";

// ==========================================
// GOLDTRADE API
// ==========================================
const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// ==========================================
// TYPES
// ==========================================
type User = {
  _id: string;
  username: string;
  email: string;
  walletBalance: number;
  usdtBalance: number;
  goldBalance: number;
  goldAveragePrice: number;
  goldProfitLoss: number;
  totalDeposit: number;
  totalWithdraw: number;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<User>({
    _id: "",
    username: "",
    email: "",
    walletBalance: 0,
    usdtBalance: 0,
    goldBalance: 0,
    goldAveragePrice: 0,
    goldProfitLoss: 0,
    totalDeposit: 0,
    totalWithdraw: 0,
  });

  const [market, setMarket] = useState<any>({});
  const [goldHistory, setGoldHistory] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState("");

  // =====================================
  // LOAD DASHBOARD
  // =====================================
  const loadDashboard = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const username = localStorage.getItem("username");

      if (!token || !username) {
        window.location.replace("/login");
        return;
      }

      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const [userRes, marketRes, goldRes, transactionRes] =
        await Promise.all([
          fetch(`${API}/api/users/${username}`, { headers }),
          fetch(`${API}/api/settings/market`, { headers }),
          fetch(`${API}/api/gold/history/${username}`, { headers }),
          fetch(`${API}/api/transactions/${username}`, { headers }),
        ]);

      if (!userRes.ok) {
        throw new Error(`Users API ${userRes.status}`);
      }

      const userData = await userRes.json();
      const marketData = marketRes.ok ? await marketRes.json() : {};
      const goldData = goldRes.ok ? await goldRes.json() : {};
      const transactionData = transactionRes.ok
        ? await transactionRes.json()
        : {};

      if (userData.success) setUser(userData.data);
      if (marketData.success) setMarket(marketData.data);
      if (goldData.success) setGoldHistory(goldData.data);
      if (transactionData.success) setTransactions(transactionData.data);

      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Dashboard Error:", err);
      alert("Failed to connect GoldTrade Server.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // PAGE LOAD
  // =====================================
  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  // =====================================
  // LIVE VALUES
  // =====================================
  const portfolioValue = useMemo(() => {
    return user.goldBalance * (market.sellGoldPrice || 0);
  }, [user.goldBalance, market.sellGoldPrice]);

  const totalAssets = useMemo(() => {
    return (
      user.walletBalance +
      portfolioValue +
      user.usdtBalance * (market.usdtRate || 0)
    );
  }, [user, market, portfolioValue]);

  // =====================================
  // LOADING SCREEN
  // =====================================
  if (loading) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin h-10 w-10 mb-4" />
        <h2 className="text-2xl font-bold">
          Loading GoldTrade Dashboard...
        </h2>
        <p className="text-gray-400 mt-2">
          Connecting to GoldTrade Server...
        </p>
      </main>
    );
  }

  // =====================================
  // DASHBOARD UI
  // =====================================
  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-yellow-400 mb-6">
        Welcome {user.username}
      </h1>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-zinc-900 rounded-2xl p-5 border border-yellow-500">
          <p className="text-gray-400">Wallet Balance</p>
          <h2 className="text-2xl font-bold text-green-400">
            PKR {user.walletBalance}
          </h2>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-5 border border-yellow-500">
          <p className="text-gray-400">Gold Balance</p>
          <h2 className="text-2xl font-bold text-yellow-400">
            {user.goldBalance} g
          </h2>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-5 border border-yellow-500">
          <p className="text-gray-400">USDT Balance</p>
          <h2 className="text-2xl font-bold text-cyan-400">
            {user.usdtBalance} USDT
          </h2>
        </div>

        <div className="bg-zinc-900 rounded-2xl p-5 border border-yellow-500">
          <p className="text-gray-400">Total Assets</p>
          <h2 className="text-2xl font-bold text-white">
            PKR {Math.round(totalAssets)}
          </h2>
        </div>
      </div>

      <div className="mt-8 bg-zinc-900 rounded-2xl p-5 border border-yellow-500">
        <h3 className="text-xl font-semibold text-yellow-400 mb-3">
          Live Market
        </h3>

        <p>Gold Buy: PKR {market.buyGoldPrice || 0}</p>
        <p>Gold Sell: PKR {market.sellGoldPrice || 0}</p>
        <p>USDT Rate: PKR {market.usdtRate || 0}</p>
        <p className="text-gray-400 mt-3">
          Last Update: {lastUpdate}
        </p>
      </div>
    </main>
  );
}