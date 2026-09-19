"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Wallet,
  Coins,
  DollarSign,
  TrendingUp,
} from "lucide-react";

// ==========================================
// GoldTrade API V18
// ==========================================
const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==========================================
// TYPES
// ==========================================
interface UserData {
  username: string;
  email: string;
  role: string;

  WalletBalance: number;
  UsdtBalance: number;
  goldBalance: number;

  totalDeposit: number;
  totalWithdraw: number;
}

interface MarketData {
  goldPriceUSD: number;
  UsdtoPkr: number;
  marketStatus: string;
}

interface WalletTransaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  note?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();

  // ==========================================
  // STATES
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [user, setUser] = useState<UserData | null>(null);

  const [market, setMarket] = useState<MarketData>({
    goldPriceUSD: 0,
    UsdtoPkr: 0,
    marketStatus: "CLOSED",
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // ==========================================
  // SESSION
  // ==========================================
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const username =
    typeof window !== "undefined"
      ? localStorage.getItem("username")
      : null;

  // ==========================================
  // AUTH HEADER
  // ==========================================
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // ==========================================
  // FORMAT MONEY
  // ==========================================
  const money = (value: number = 0) =>
    Number(value).toLocaleString("en-PK");

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-PK");

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = () => {
    localStorage.clear();
    router.replace("/login");
  };
   // ==========================================
// LOAD DASHBOARD DATA (FINAL V18 FIX)
// ==========================================

const loadDashboard = async () => {
  if (!token || !username) {
    router.replace("/login");
    return;
  }

  try {
    setLoading(true);
    setRefreshing(true);

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const [userRes, marketRes, WallethistoryRes] = await Promise.all([
      fetch(`${API}/api/users/${username}`, {
        method: "GET",
        headers,
        cache: "no-store",
      }),

      fetch(`${API}/api/gold/price`, {
        method: "GET",
        headers,
        cache: "no-store",
      }),

      fetch(`${API}/api/Wallet/history/${username}`, {
        method: "GET",
        headers,
        cache: "no-store",
      }),
    ]);
    
    const userData = await userRes.json();
    const marketData = await marketRes.json();
    const WallethistoryData = await WallethistoryRes.json();

    console.log("USER API:", userData);
    console.log("MARKET API:", marketData);
    console.log("Wallet history API:", WallethistoryData);

    // ================= USER =================
    if (userRes.ok && userData.success) {
      setUser(userData.data || userData.user || null);
    } else {
      setUser(null);
    }

    // ================= MARKET =================
    if (marketRes.ok && marketData.success) {
      setMarket({
        goldPriceUSD:
          Number(marketData.data?.goldPriceUSD ?? marketData.goldPriceUSD ?? 0),

        UsdtoPkr:
          Number(marketData.data?.UsdtoPkr ?? marketData.UsdtoPkr ?? 0),

        marketStatus:
          marketData.data?.marketStatus ??
          marketData.marketStatus ??
          "CLOSED",
      });
    } else {
      setMarket({
        goldPriceUSD: 0,
        UsdtoPkr: 0,
        marketStatus: "CLOSED",
      });
    }

    // ================= Wallet history =================
    if (WallethistoryRes.ok && WallethistoryData.success) {
      setTransactions(
        Array.isArray(WallethistoryData.transactions)
          ? WallethistoryData.transactions
          : Array.isArray(WallethistoryData.data)
          ? WallethistoryData.data
          : []
      );
    } else {
      setTransactions([]);
    }

  } catch (err: any) {
    console.error("Dashboard Load Error:", err);

    setUser(null);

    setMarket({
      goldPriceUSD: 0,
      UsdtoPkr: 0,
      marketStatus: "CLOSED",
    });

    setTransactions([]);
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    if (!token || !username) {
      router.replace("/login");
      return;
    }

    loadDashboard();
  }, []);

  // ==========================================
  // AUTO REFRESH EVERY 15 SECONDS
  // ==========================================
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboard();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // MANUAL REFRESH BUTTON
  // ==========================================
  const refreshDashboard = async () => {
    await loadDashboard();
  };

  // ==========================================
  // TOTAL ASSETS (LIVE CALCULATION)
  // ==========================================
  const totalAssets =
    (user?.WalletBalance || 0) +
    (user?.UsdtBalance || 0) * market.UsdtoPkr +
    (user?.goldBalance || 0) * market.goldPriceUSD * market.UsdtoPkr;
      // ==========================================
  // LOADING SCREEN
  // ==========================================
  if (loading) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin h-10 w-10 mb-4" />
        <h2 className="text-2xl font-bold">Loading GoldTrade Dashboard...</h2>
        <p className="text-gray-400 mt-2">
          Connecting to GoldTrade Server...
        </p>
      </main>
    );
  }

  // ==========================================
  // DASHBOARD UI
  // ==========================================
  return (
    <main className="min-h-screen bg-black text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-3 mb-8">
        <div>
          <h1 className="text-3xl font-black text-yellow-400">
            Welcome, {user?.username}
          </h1>

          <p className="text-gray-400 text-sm mt-1">
            GoldTrade Live Planet
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={refreshDashboard}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-bold"
          >
            Logout
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">
          <Wallet className="text-green-400 mb-3 h-8 w-8" />
          <p className="text-gray-400 text-sm">Wallet Balance</p>
          <h2 className="text-2xl font-black text-green-400">
            Pkr {money(user?.WalletBalance)}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-5">
          <DollarSign className="text-cyan-400 mb-3 h-8 w-8" />
          <p className="text-gray-400 text-sm">Usdt Balance</p>
          <h2 className="text-2xl font-black text-cyan-400">
            {money(user?.UsdtBalance)} Usdt
          </h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
          <Coins className="text-yellow-400 mb-3 h-8 w-8" />
          <p className="text-gray-400 text-sm">Gold Balance</p>
          <h2 className="text-2xl font-black text-yellow-400">
            {money(user?.goldBalance)} Gram
          </h2>
        </div>

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-5">
          <TrendingUp className="text-purple-400 mb-3 h-8 w-8" />
          <p className="text-gray-400 text-sm">Total Assets</p>
          <h2 className="text-2xl font-black text-purple-400">
            Pkr {money(totalAssets)}
          </h2>
        </div>

      </div>

      {/* LIVE MARKET */}
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-black text-yellow-400">
            Live Gold Market
          </h2>

          <span
            className={`px-4 py-2 rounded-full text-sm font-bold ${
              market.marketStatus === "OPEN"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {market.marketStatus}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-black rounded-2xl p-5 border border-zinc-700">
            <p className="text-gray-400">Gold Price (USD / Ounce)</p>

            <h3 className="text-4xl font-black text-yellow-400 mt-2">
              ${market.goldPriceUSD}
            </h3>
          </div>

          <div className="bg-black rounded-2xl p-5 border border-zinc-700">
            <p className="text-gray-400">USD → Pkr Exchange Rate</p>

            <h3 className="text-4xl font-black text-green-400 mt-2">
              Pkr {market.UsdtoPkr}
            </h3>
          </div>

        </div>
      </div>

      {/* Wallet SUMMARY */}
      <div className="grid md:grid-cols-2 gap-5 mb-10">

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-green-400 mb-3">
            Total Deposit
          </h3>

          <h2 className="text-3xl font-black">
            Pkr {money(user?.totalDeposit)}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <h3 className="text-xl font-bold text-red-400 mb-3">
            Total Withdrawal
          </h3>

          <h2 className="text-3xl font-black">
            Pkr {money(user?.totalWithdraw)}
          </h2>
        </div>

      </div>

      {/* TRANSACTION history */}
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
          <h2 className="text-2xl font-black text-yellow-400">
            Wallet Transaction history
          </h2>

          <span className="text-sm text-gray-400">
            {transactions.length} Transactions
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            No Wallet transactions.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-700">

            <table className="w-full text-left">

              <thead className="bg-black text-yellow-400">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((item) => (
                  <tr
                    key={item._id}
                    className="border-t border-zinc-800 hover:bg-zinc-800"
                  >
                    <td className="p-3 font-semibold">{item.type}</td>

                    <td className="p-3 text-green-400 font-bold">
                      Pkr {money(item.amount)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.status === "Completed"
                            ? "bg-green-700 text-white"
                            : "bg-yellow-700 text-white"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="p-3 text-gray-400">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="mt-10 border-t border-zinc-800 pt-6 text-center text-sm text-gray-500">
        <p>     GoldTrade•Inc </p>

        <p className="text-green-400 mt-2">
            Pakistan First International Trading Platform.
        </p>
      </div>

    </main>
  );
}