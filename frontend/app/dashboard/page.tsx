"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QuickActions from "./QuickActions";

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
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com";

// ==========================================
// TYPES
// ==========================================

interface UserData {
  username: string;
  email: string;
  role: string;

  pkrBalance: number;
  usdtBalance: number;
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
    goldPriceUSD: 3420.5,
    UsdtoPkr: 305,
    marketStatus: "CLOSED",
  });

  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  // Individual wallet balances
  const [pkrBalance, setPkrBalance] = useState(0);
  const [goldBalance, setGoldBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);

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
  // FORMATTERS
  // ==========================================

  const money = (value: number = 0) =>
    Number(value).toLocaleString("en-PK");

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

    const [userRes, marketRes, walletHistoryRes] = await Promise.all([
      fetch(`${API}/api/users/${username}`, {
        headers,
        cache: "no-store",
      }),

      fetch(`${API}/api/gold/price`, {
        headers,
        cache: "no-store",
      }),

      fetch(`${API}/api/wallet/history/${username}`, {
        headers,
        cache: "no-store",
      }),
    ]);

    const userData = await userRes.json();
    const marketData = await marketRes.json();
    const walletHistoryData = await walletHistoryRes.json();

    console.log("USER API:", userData);
    console.log("MARKET API:", marketData);
    console.log("WALLET HISTORY API:", walletHistoryData);

    // ==========================================
    // USER DATA
    // ==========================================

    if (userRes.ok && userData.success) {
      const currentUser = userData.data || userData.user;

      setUser(currentUser);

      setPkrBalance(Number(currentUser?.pkrBalance ?? 0));
      setGoldBalance(Number(currentUser?.goldBalance ?? 0));
      setUsdtBalance(Number(currentUser?.usdtBalance ?? 0));

    } else {
      setUser(null);
      setPkrBalance(0);
      setGoldBalance(0);
      setUsdtBalance(0);
    }

    // ==========================================
    // MARKET DATA
    // ==========================================

    if (marketRes.ok && marketData.success) {
      setMarket({
        goldPriceUSD: Number(
          marketData.data?.goldPriceUSD ??
          marketData.goldPriceUSD ??
          3420.5
        ),

        UsdtoPkr: Number(
          marketData.data?.UsdtoPkr ??
          marketData.data?.usdToPkr ??
          marketData.UsdtoPkr ??
          marketData.usdToPkr ??
          305
        ),

        marketStatus:
          marketData.data?.marketStatus ??
          marketData.marketStatus ??
          "CLOSED",
      });

    } else {
      setMarket({
        goldPriceUSD: 3420.5,
        UsdtoPkr: 305,
        marketStatus: "CLOSED",
      });
    }

    // ==========================================
    // WALLET HISTORY
    // ==========================================

    if (walletHistoryRes.ok && walletHistoryData.success) {
      setTransactions(
        walletHistoryData.transactions ||
        walletHistoryData.data ||
        []
      );

    } else {
      setTransactions([]);
    }

  } catch (error) {
    console.error("Dashboard Load Error:", error);

    setUser(null);

    setPkrBalance(0);
    setGoldBalance(0);
    setUsdtBalance(0);

    setMarket({
      goldPriceUSD: 3420.5,
      UsdtoPkr: 305,
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
// TOTAL ASSETS
// ==========================================

const totalAssets =
  pkrBalance +
  usdtBalance * market.UsdtoPkr +
  goldBalance * market.goldPriceUSD * market.UsdtoPkr;
  // ==========================================
// DASHBOARD UI (FINAL V18)
// ==========================================

return (
  <main className="min-h-screen bg-black text-white p-6">

    {/* ========================================== */}
    {/* HEADER */}
    {/* ========================================== */}

    <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-yellow-400">
          Welcome, {user?.username}
        </h1>

        <p className="text-gray-400 mt-1">
          GoldTrade Enterprise Dashboard
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

    {/* ========================================== */}
    {/* WALLET CARDS */}
    {/* ========================================== */}

    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">

      <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">
        <Wallet className="text-green-400 mb-3 h-8 w-8" />
        <p className="text-gray-400 text-sm">PKR Wallet</p>

        <h2 className="text-2xl font-black text-green-400">
          PKR {money(pkrBalance)}
        </h2>
      </div>

      <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-5">
        <DollarSign className="text-cyan-400 mb-3 h-8 w-8" />
        <p className="text-gray-400 text-sm">USDT Wallet</p>

        <h2 className="text-2xl font-black text-cyan-400">
          {money(usdtBalance)} USDT
        </h2>
      </div>

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
        <Coins className="text-yellow-400 mb-3 h-8 w-8" />
        <p className="text-gray-400 text-sm">Gold Wallet</p>

        <h2 className="text-2xl font-black text-yellow-400">
          {money(goldBalance)} Gram
        </h2>
      </div>

      <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-5">
        <TrendingUp className="text-purple-400 mb-3 h-8 w-8" />
        <p className="text-gray-400 text-sm">Total Assets</p>

        <h2 className="text-2xl font-black text-purple-400">
          PKR {money(totalAssets)}
        </h2>
      </div>

    </div>

    {/* ========================================== */}
    {/* QUICK ACTIONS */}
    {/* ========================================== */}

    <QuickActions />

    {/* ========================================== */}
    {/* LIVE GOLD MARKET */}
    {/* ========================================== */}

    <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 my-8">

      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">

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

      <div className="grid md:grid-cols-2 gap-5">

        <div className="bg-black border border-zinc-700 rounded-2xl p-5">
          <p className="text-gray-400 text-sm mb-2">
            Gold Price (USD / Ounce)
          </p>

          <h2 className="text-4xl font-black text-yellow-400">
            ${market.goldPriceUSD}
          </h2>
        </div>

        <div className="bg-black border border-zinc-700 rounded-2xl p-5">
          <p className="text-gray-400 text-sm mb-2">
            USD to PKR Rate
          </p>

          <h2 className="text-4xl font-black text-green-400">
            PKR {market.UsdtoPkr}
          </h2>
        </div>

      </div>
    </div>

    {/* ========================================== */}
    {/* WALLET SUMMARY */}
    {/* ========================================== */}

    <div className="grid md:grid-cols-2 gap-5 mb-8">

      <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">
        <p className="text-green-400 text-sm mb-2">
          Total Deposit
        </p>

        <h2 className="text-3xl font-black">
          PKR {money(user?.totalDeposit ?? 0)}
        </h2>
      </div>

      <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">
        <p className="text-red-400 text-sm mb-2">
          Total Withdrawal
        </p>

        <h2 className="text-3xl font-black">
          PKR {money(user?.totalWithdraw ?? 0)}
        </h2>
      </div>

    </div>

    {/* ========================================== */}
    {/* WALLET TRANSACTION HISTORY */}
    {/* ========================================== */}

    <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">

        <h2 className="text-2xl font-black text-yellow-400">
          Wallet Transaction History
        </h2>

        <span className="text-sm text-gray-400">
          {transactions.length} Transactions
        </span>

      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No Wallet Transactions Found.
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

                  <td className="p-3 font-semibold">
                    {item.type}
                  </td>

                  <td className="p-3 text-green-400 font-bold">
                    PKR {money(item.amount)}
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

    {/* ========================================== */}
    {/* FOOTER */}
    {/* ========================================== */}

    <div className="mt-10 border-t border-zinc-800 pt-6 text-center">

      <p className="text-gray-500 text-sm">
        GoldTrade Enterprise V18
      </p>

      <p className="text-green-400 text-sm mt-2">
        Pakistan First International Gold • PKR • USDT Trading Platform
      </p>

    </div>

  </main>
);

}