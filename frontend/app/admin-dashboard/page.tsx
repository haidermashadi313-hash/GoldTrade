"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Coins,
  DollarSign,
  TrendingUp,
  RefreshCw,
  ShieldCheck,
  Settings,
  Clock,
  Activity,
} from "lucide-react";

// ==========================================
// API URL
// ==========================================
const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==========================================
// TYPES
// ==========================================
interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number;
  totalWithdraws: number;
  pendingDeposits: number;
  pendingWithdraws: number;
  WalletBalance: number;
  totalTransactions: number;
}

interface MarketSettings {
  goldPriceUSD: number;
  UsdtoPkr: number;
  buyGoldPrice: number;
  sellGoldPrice: number;
  marketStatus: string;
}

interface DepositItem {
  _id: string;
  username: string;
  requestAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface WithdrawItem {
  _id: string;
  username: string;
  requestAmount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface WalletTransaction {
  _id: string;
  username: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboard() {
  // ==========================================
  // AUTH
  // ==========================================
  const [token, setToken] = useState("");
  const [adminName, setAdminName] = useState("");

  // ==========================================
  // UI
  // ==========================================
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");
    

  // ==========================================
  // DASHBOARD STATS
  // ==========================================
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDeposits: 0,
    totalWithdraws: 0,
    pendingDeposits: 0,
    pendingWithdraws: 0,
    WalletBalance: 0,
    totalTransactions: 0,
  });

  // ==========================================
  // MARKET SETTINGS (SAFE DEFAULTS)
  // ==========================================
  const [settings, setSettings] = useState<MarketSettings>({
    goldPriceUSD: 0,
    UsdtoPkr: 0,
    buyGoldPrice: 0,
    sellGoldPrice: 0,
    marketStatus: "CLOSED",
  });
// ==========================================
// MANUAL Wallet MANAGER STATES
// ==========================================
const [WalletUsername, setWalletUsername] = useState("");
const [WalletAmount, setWalletAmount] = useState("");
const [WalletNote, setWalletNote] = useState("");
const [WalletLoading, setWalletLoading] = useState(false);
const [WalletBalance, setWalletBalance] = useState(0);

// ==========================================
// HYDRATION SAFE STATES
// ==========================================
const [mounted, setMounted] = useState(false);

const [currentTime, setCurrentTime] = useState("");

const [currentDateTime, setCurrentDateTime] = useState("");

// ================== YAHAN SE PASTE KARO ==================
const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const [WalletUser, setWalletUser] = useState({
  username: "",
  WalletBalance: 0,
  totalDeposit: 0,
  totalWithdraw: 0,
  email: "",
  role: "",
});

const [WalletStats, setWalletStats] = useState({
  totalUsers: 0,
  totalPkrBalance: 0,
  totalDeposits: 0,
  totalWithdraws: 0,
  totalTransactions: 0,
});

const [Wallethistory, setWallethistory] = useState([]);
// ================== YAHAN TAK PASTE KARO ==================

  // ==========================================
  // TABLE DATA
  // ==========================================
  const [pendingDeposits, setPendingDeposits] = useState<DepositItem[]>([]);
  const [pendingWithdraws, setPendingWithdraws] = useState<WithdrawItem[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    // ==========================================
  // ADMIN AUTH CHECK
  // ==========================================
  useEffect(() => {
    const jwt = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");

    if (!jwt) {
      window.location.href = "/login";
      return;
    }

    if (role !== "admin") {
      window.location.href = "/dashboard";
      return;
    }

    setToken(jwt);
    setAdminName(username || "Administrator");
  }, []);

  // ==========================================
  // LOAD MARKET SETTINGS
  // ==========================================
  const loadMarketSettings = async (jwt: string) => {
    try {
      const response = await fetch(`${API}/api/gold/price`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) return;

      setSettings({
        goldPriceUSD: Number(result.data?.goldPriceUSD || 0),
        UsdtoPkr: Number(result.data?.UsdtoPkr || 0),
        buyGoldPrice: Number(result.data?.buyGoldPrice || 0),
        sellGoldPrice: Number(result.data?.sellGoldPrice || 0),
        marketStatus: result.data?.marketStatus || "CLOSED",
      });
    } catch (err) {
      console.error("Market Settings Error:", err);
    }
  };

  // ==========================================
  // LOAD DASHBOARD STATS
  // ==========================================
  const loadDashboardStats = async (jwt: string) => {
    try {
      const response = await fetch(`${API}/api/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) return;

      const data = result.data || {};

      setStats({
        totalUsers: Number(data.totalUsers || 0),
        activeUsers: Number(data.activeUsers || 0),
        totalDeposits: Number(data.totalDeposits || 0),
        totalWithdraws: Number(data.totalWithdraws || 0),
        pendingDeposits: Number(data.pendingDeposits || 0),
        pendingWithdraws: Number(data.pendingWithdraws || 0),
        WalletBalance: Number(data.WalletBalance || 0),
        totalTransactions: Number(data.totalTransactions || 0),
      });
    } catch (err) {
      console.error("Dashboard Stats Error:", err);
    }
  };

  // ==========================================
  // LOAD PENDING DEPOSITS
  // ==========================================
  const loadPendingDeposits = async (jwt: string) => {
    try {
      const response = await fetch(`${API}/api/admin/deposits`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) return;

      setPendingDeposits(result.data || []);
    } catch (err) {
      console.error("Pending Deposits Error:", err);
    }
  };

  // ==========================================
  // LOAD PENDING WITHDRAWS
  // ==========================================
  const loadPendingWithdraws = async (jwt: string) => {
    try {
      const response = await fetch(`${API}/api/admin/withdraws/pending`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) return;

      setPendingWithdraws(result.data || []);
    } catch (err) {
      console.error("Pending Withdraw Error:", err);
    }
  };

  // ==========================================
  // LOAD RECENT Wallet TRANSACTIONS
  // ==========================================
  const loadTransactions = async (jwt: string) => {
    try {
      const response = await fetch(`${API}/api/admin/wallet/history`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) return;

      setTransactions(result.data || []);
    } catch (err) {
      console.error("Wallet Transaction Error:", err);
    }
  };

  // ==========================================
  // LOAD COMPLETE DASHBOARD
  // ==========================================
  const loadDashboard = async () => {
    const jwt = localStorage.getItem("token");

    if (!jwt) return;

    try {
      setLoading(true);

      await Promise.all([
        loadDashboardStats(jwt),
        loadMarketSettings(jwt),
        loadPendingDeposits(jwt),
        loadPendingWithdraws(jwt),
        loadTransactions(jwt),
      ]);
    } catch (err) {
      console.error("Dashboard Load Error:", err);

      setMessageType("error");
      setMessage("Unable to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // AUTO LOAD
  // ==========================================
  useEffect(() => {
    if (token) {
      loadDashboard();
    }
  }, [token]);

  // ==========================================
  // REFRESH DASHBOARD
  // ==========================================
  const refreshDashboard = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // ==========================================
  // MANUAL Wallet CREDIT / DEDUCT
  // ==========================================
  const updateWallet = async (type: "credit" | "deduct") => {
    const jwt = localStorage.getItem("token");

    if (!jwt) return;

    if (!WalletUsername.trim() || !WalletAmount) {
      alert("Username aur amount required hai.");
      return;
    }

    try {
      setWalletLoading(true);

      const response = await fetch(`${API}/api/admin/Wallet/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          username: WalletUsername.trim(),
          amount: Number(WalletAmount),
          note: WalletNote.trim(),
          action: type,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Wallet update failed.");
      }

      alert(result.message);

      setWalletBalance(Number(result.WalletBalance ?? 0));
      setWalletAmount("");
      setWalletNote("");

      await loadDashboard();
    } catch (err: any) {
      alert(err.message || "Wallet update failed.");
    } finally {
      setWalletLoading(false);
    }
  };
    // ==========================================
  // ADMIN DASHBOARD UI START
  // ==========================================
  return (
    <div className="min-h-screen bg-black text-white p-6">

      {/* ==========================================
          HEADER
      ========================================== */}
      <div className="flex justify-between items-center flex-wrap gap-5 mb-8">

        <div>
          <h1 className="text-4xl font-black text-yellow-400">
            GoldTrade V18 Admin Dashboard
          </h1>

          <p className="text-gray-400 mt-2">
            Welcome back,
            <span className="text-cyan-400 font-bold ml-2">
              {adminName}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">

          {/* Market Status */}
          <div
            className={`px-4 py-2 rounded-full font-bold text-sm ${
              settings.marketStatus === "OPEN"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            Market : {settings.marketStatus}
          </div>

          {/* Refresh */}
          <button
            onClick={refreshDashboard}
            disabled={refreshing}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

        </div>

      </div>

      {/* ==========================================
          MESSAGE BOX
      ========================================== */}
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

      {/* ==========================================
          QUICK ACTION CARDS
      ========================================== */}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5 mb-10">

        {/* USERS */}
        <Link href="/admin/users">
          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5 hover:border-cyan-400 hover:scale-[1.03] transition cursor-pointer">

            <Users size={38} className="text-cyan-400 mb-4" />

            <h3 className="font-bold text-lg text-white">
              Users
            </h3>

            <p className="text-gray-400 text-sm">
              Manage registered users
            </p>

          </div>
        </Link>

        {/* DEPOSITS */}
        <Link href="/admin/deposit">
          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5 hover:border-green-400 hover:scale-[1.03] transition cursor-pointer">

            <ArrowUpCircle size={38} className="text-green-400 mb-4" />

            <h3 className="font-bold text-lg text-white">
              Deposits
            </h3>

            <p className="text-gray-400 text-sm">
              Review pending deposits
            </p>

          </div>
        </Link>

        {/* WITHDRAWS */}
        <Link href="/admin/withdraw">
          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5 hover:border-red-400 hover:scale-[1.03] transition cursor-pointer">

            <ArrowDownCircle size={38} className="text-red-400 mb-4" />

            <h3 className="font-bold text-lg text-white">
              Withdraws
            </h3>

            <p className="text-gray-400 text-sm">
              Approve or reject withdrawals
            </p>

          </div>
        </Link>

        {/* Wallet MANAGER */}
        <Link href="/admin/Wallet-manager">
          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5 hover:border-yellow-400 hover:scale-[1.03] transition cursor-pointer">

            <Wallet size={38} className="text-yellow-400 mb-4" />

            <h3 className="font-bold text-lg text-white">
              Wallet Manager
            </h3>

            <p className="text-gray-400 text-sm">
              Credit or deduct Wallet balance
            </p>

          </div>
        </Link>

        {/* SETTINGS */}
        <Link href="/admin/settings">
          <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5 hover:border-purple-400 hover:scale-[1.03] transition cursor-pointer">

            <Settings size={38} className="text-purple-400 mb-4" />

            <h3 className="font-bold text-lg text-white">
              Settings
            </h3>

            <p className="text-gray-400 text-sm">
              Market and payment settings
            </p>

          </div>
        </Link>

      </div>      {/* ==========================================
          DASHBOARD STATISTICS
      ========================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">

        {/* TOTAL USERS */}
        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-5">
          <div className="flex justify-between items-center mb-4">
            <Users size={32} className="text-cyan-400" />
            <span className="text-cyan-400 text-sm font-semibold">
              Users
            </span>
          </div>

          <h2 className="text-3xl font-black text-white">
            {(stats.totalUsers ?? 0).toLocaleString()}
          </h2>

          <p className="text-gray-500 text-sm mt-2">
            Active Users: {(stats.activeUsers ?? 0).toLocaleString()}
          </p>
        </div>

        {/* TOTAL Wallet */}
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
          <div className="flex justify-between items-center mb-4">
            <Wallet size={32} className="text-yellow-400" />
            <span className="text-yellow-400 text-sm font-semibold">
              Wallet
            </span>
          </div>

          <h2 className="text-3xl font-black text-yellow-400">
            Pkr {(stats.WalletBalance ?? 0).toLocaleString()}
          </h2>

          <p className="text-gray-500 text-sm mt-2">
            Platform Wallet Balance
          </p>
        </div>

        {/* TOTAL DEPOSITS */}
        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">
          <div className="flex justify-between items-center mb-4">
            <ArrowUpCircle size={32} className="text-green-400" />
            <span className="text-green-400 text-sm font-semibold">
              DEPOSITS
            </span>
          </div>

          <h2 className="text-3xl font-black text-green-400">
            Pkr {(stats.totalDeposits ?? 0).toLocaleString()}
          </h2>

          <p className="text-gray-500 text-sm mt-2">
            Pending: {(stats.pendingDeposits ?? 0).toLocaleString()}
          </p>
        </div>

        {/* TOTAL WITHDRAWS */}
        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-5">
          <div className="flex justify-between items-center mb-4">
            <ArrowDownCircle size={32} className="text-red-400" />
            <span className="text-red-400 text-sm font-semibold">
              Withdraws
            </span>
          </div>

          <h2 className="text-3xl font-black text-red-400">
            Pkr {(stats.totalWithdraws ?? 0).toLocaleString()}
          </h2>

          <p className="text-gray-500 text-sm mt-2">
            Pending: {(stats.pendingWithdraws ?? 0).toLocaleString()}
          </p>
        </div>

      </div>

      {/* ==========================================
          SECOND ROW STATS
      ========================================== */}

      <div className="grid md:grid-cols-3 gap-5 mb-10">

        {/* TRANSACTIONS */}
        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-5">
          <div className="flex justify-between items-center mb-4">
            <Activity size={30} className="text-purple-400" />
            <span className="text-purple-400 text-sm font-semibold">
              TRANSACTIONS
            </span>
          </div>

          <h2 className="text-3xl font-black text-purple-400">
            {(stats.totalTransactions ?? 0).toLocaleString()}
          </h2>

          <p className="text-gray-500 text-sm mt-2">
            Wallet Transaction Records
          </p>
        </div>

        {/* GOLD PRICE USD */}
        <div className="bg-zinc-900 border border-amber-500 rounded-3xl p-5">
          <div className="flex justify-between items-center mb-4">
            <Coins size={30} className="text-amber-400" />
            <span className="text-amber-400 text-sm font-semibold">
              GOLD USD
            </span>
          </div>

          <h2 className="text-3xl font-black text-amber-400">
            ${Number(settings.goldPriceUSD ?? 0).toLocaleString()}
          </h2>

          <p className="text-gray-500 text-sm mt-2">
            International Gold Price
          </p>
        </div>

        {/* USD TO Pkr */}
        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-5">
          <div className="flex justify-between items-center mb-4">
            <DollarSign size={30} className="text-blue-400" />
            <span className="text-blue-400 text-sm font-semibold">
              USD / Pkr
            </span>
          </div>

          <h2 className="text-3xl font-black text-blue-400">
            Pkr {Number(settings.UsdtoPkr ?? 0).toLocaleString()}
          </h2>

          <p className="text-gray-500 text-sm mt-2">
            Live Exchange Rate
          </p>
        </div>

      </div>      {/* ==========================================
          LIVE GOLD MARKET PANEL
      ========================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

        <div className="flex justify-between items-center flex-wrap gap-3 mb-6">

          <div>
            <h2 className="text-3xl font-black text-yellow-400">
              Live Gold Market
            </h2>

            <p className="text-gray-400">
              International Gold & Pkr Market Settings
            </p>
          </div>

          <div
            className={`px-5 py-2 rounded-full font-bold ${
              settings.marketStatus === "OPEN"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {settings.marketStatus === "OPEN"
              ? "🟢 MARKET OPEN"
              : "🔴 MARKET CLOSED"}
          </div>

        </div>

        {/* ==========================================
            GOLD MARKET CARDS
        ========================================== */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* buy PRICE */}
          <div className="bg-black border border-green-500 rounded-2xl p-5">

            <div className="flex justify-between items-center mb-4">
              <TrendingUp size={30} className="text-green-400" />

              <span className="text-green-400 font-bold text-sm">
                buy GOLD
              </span>
            </div>

            <h3 className="text-3xl font-black text-green-400">
              Pkr {(settings.buyGoldPrice ?? 0).toLocaleString()}
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              Customer buy Price (Per Gram)
            </p>

          </div>

          {/* sell PRICE */}
          <div className="bg-black border border-red-500 rounded-2xl p-5">

            <div className="flex justify-between items-center mb-4">
              <TrendingUp size={30} className="text-red-400 rotate-180" />

              <span className="text-red-400 font-bold text-sm">
                sell GOLD
              </span>
            </div>

            <h3 className="text-3xl font-black text-red-400">
              Pkr {(settings.sellGoldPrice ?? 0).toLocaleString()}
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              Customer sell Price (Per Gram)
            </p>

          </div>

          {/* GOLD USD */}
          <div className="bg-black border border-amber-500 rounded-2xl p-5">

            <div className="flex justify-between items-center mb-4">
              <Coins size={30} className="text-amber-400" />

              <span className="text-amber-400 font-bold text-sm">
                Gold USD
              </span>
            </div>

            <h3 className="text-3xl font-black text-amber-400">
              ${Number(settings.goldPriceUSD ?? 0).toLocaleString()}
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              International Spot Gold Price
            </p>

          </div>

          {/* USD Pkr */}
          <div className="bg-black border border-blue-500 rounded-2xl p-5">

            <div className="flex justify-between items-center mb-4">
              <DollarSign size={30} className="text-blue-400" />

              <span className="text-blue-400 font-bold text-sm">
                USD / Pkr
              </span>
            </div>

            <h3 className="text-3xl font-black text-blue-400">
              Pkr {Number(settings.UsdtoPkr ?? 0).toLocaleString()}
            </h3>

            <p className="text-gray-500 text-sm mt-2">
              Live USD Exchange Rate
            </p>

          </div>

        </div>

        {/* ==========================================
            MARKET INFORMATION BAR
        ========================================== */}

        <div className="grid md:grid-cols-3 gap-4 mt-6">

          <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
            <p className="text-gray-400 text-sm">
              Trading Status
            </p>

            <h4
              className={`text-xl font-bold mt-2 ${
                settings.marketStatus === "OPEN"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {settings.marketStatus}
            </h4>
          </div>

          <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
            <p className="text-gray-400 text-sm">
              Gold Spread
            </p>

            <h4 className="text-xl font-bold text-yellow-400 mt-2">
              Pkr{" "}
              {(
                (settings.buyGoldPrice ?? 0) -
                (settings.sellGoldPrice ?? 0)
              ).toLocaleString()}
            </h4>
          </div>

          <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
            <p className="text-gray-400 text-sm">
              Last Refresh
            </p>

            <h4 className="text-xl font-bold text-cyan-400 mt-2">
              <span suppressHydrationWarning>
  {mounted ? currentTime : "--:--:--"}
</span>
            </h4>
          </div>

        </div>

      </div>      {/* ==========================================
          OPERATIONS PANEL
      ========================================== */}

      <div className="grid xl:grid-cols-2 gap-6 mb-10">

        {/* ==========================================
            PENDING DEPOSITS
        ========================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">

          <div className="flex justify-between items-center mb-5">

            <h2 className="text-2xl font-black text-green-400">
              Pending Deposits
            </h2>

            <Link href="/admin/deposit">
              <button className="text-green-400 hover:text-green-300 text-sm font-semibold">
                View All →
              </button>
            </Link>

          </div>

          {pendingDeposits.length === 0 ? (

            <div className="text-center text-gray-500 py-8">
              No pending deposits.
            </div>

          ) : (

            <div className="space-y-3">

              {pendingDeposits.slice(0, 5).map((deposit) => (

                <div
                  key={deposit._id}
                  className="bg-black border border-green-800 rounded-xl p-4 flex justify-between items-center"
                >

                  <div>

                    <p className="font-bold text-white">
                      {deposit.username}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(deposit.createdAt).toLocaleString()}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="font-bold text-green-400">
                      {deposit.currency}{" "}
                      {Number(deposit.requestAmount).toLocaleString()}
                    </p>

                    <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">
                      {deposit.status}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* ==========================================
            PENDING WITHDRAWS
        ========================================== */}

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-5">

          <div className="flex justify-between items-center mb-5">

            <h2 className="text-2xl font-black text-red-400">
              Pending Withdraws
            </h2>

            <Link href="/admin/withdraw">
              <button className="text-red-400 hover:text-red-300 text-sm font-semibold">
                View All →
              </button>
            </Link>

          </div>

          {pendingWithdraws.length === 0 ? (

            <div className="text-center text-gray-500 py-8">
              No pending withdraw requests.
            </div>

          ) : (

            <div className="space-y-3">

              {pendingWithdraws.slice(0, 5).map((withdraw) => (

                <div
                  key={withdraw._id}
                  className="bg-black border border-red-800 rounded-xl p-4 flex justify-between items-center"
                >

                  <div>

                    <p className="font-bold text-white">
                      {withdraw.username}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(withdraw.createdAt).toLocaleString()}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="font-bold text-red-400">
                      {withdraw.currency}{" "}
                      {Number(withdraw.requestAmount).toLocaleString()}
                    </p>

                    <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">
                      {withdraw.status}
                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      </div>

      {/* ==========================================
          QUICK OPERATIONS SUMMARY
      ========================================== */}

      <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mb-10">

        <div className="flex items-center gap-3 mb-6">

          <Activity size={28} className="text-cyan-400" />

          <h2 className="text-2xl font-black text-cyan-400">
            Operations Summary
          </h2>

        </div>

        <div className="grid md:grid-cols-4 gap-5">

          <div className="bg-black rounded-xl p-5 border border-green-700">

            <p className="text-gray-400 text-sm">
              Pending Deposits
            </p>

            <h3 className="text-3xl font-black text-green-400 mt-2">
              {pendingDeposits.length}
            </h3>

          </div>

          <div className="bg-black rounded-xl p-5 border border-red-700">

            <p className="text-gray-400 text-sm">
              Pending Withdraws
            </p>

            <h3 className="text-3xl font-black text-red-400 mt-2">
              {pendingWithdraws.length}
            </h3>

          </div>

          <div className="bg-black rounded-xl p-5 border border-yellow-700">

            <p className="text-gray-400 text-sm">
              Total Operations
            </p>

            <h3 className="text-3xl font-black text-yellow-400 mt-2">
              {pendingDeposits.length + pendingWithdraws.length}
            </h3>

          </div>

          <div className="bg-black rounded-xl p-5 border border-cyan-700">

            <p className="text-gray-400 text-sm">
              System Status
            </p>

            <h3 className="text-xl font-black text-cyan-400 mt-2">
              LIVE
            </h3>

          </div>

        </div>

      </div>      {/* ==========================================
          RECENT Wallet TRANSACTIONS
      ========================================== */}

      <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6 mb-10">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

          <div className="flex items-center gap-3">
            <Activity size={28} className="text-purple-400" />

            <h2 className="text-2xl font-black text-purple-400">
              Recent Wallet Transactions
            </h2>
          </div>

          <Link href="/admin/Wallet-history">
            <button className="text-purple-400 hover:text-purple-300 text-sm font-semibold">
              View Full history →
            </button>
          </Link>

        </div>

        {/* Empty State */}
        {transactions.length === 0 ? (

          <div className="text-center py-10 text-gray-500">
            No Wallet transactions found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full min-w-[950px] text-sm">

              <thead className="border-b border-zinc-700 text-purple-300">

                <tr className="text-left">

                  <th className="py-3 px-2">User</th>
                  <th className="py-3 px-2">Type</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Date & Time</th>

                </tr>

              </thead>

              <tbody>

                {transactions.slice(0, 10).map((tx) => (

                  <tr
                    key={tx._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800/40"
                  >

                    {/* Username */}
                    <td className="py-4 px-2">
                      <div className="font-semibold text-cyan-400">
                        {tx.username}
                      </div>
                    </td>

                    {/* Transaction Type */}
                    <td className="py-4 px-2">

                      {tx.type === "Deposit" && (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                          Deposit
                        </span>
                      )}

                      {tx.type === "Withdraw" && (
                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                          Withdraw
                        </span>
                      )}

                      {tx.type === "Adjustment" && (
                        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                          Adjustment
                        </span>
                      )}

                    </td>

                    {/* Amount */}
                    <td className="py-4 px-2">

                      <span
                        className={`font-bold ${
                          tx.type === "Withdraw"
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        Pkr {Number(tx.amount ?? 0).toLocaleString()}
                      </span>

                    </td>

                    {/* Status */}
                    <td className="py-4 px-2">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tx.status === "Completed"
                            ? "bg-green-500/20 text-green-400"
                            : tx.status === "Pending"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {tx.status}
                      </span>

                    </td>

                    {/* Date */}
                    <td className="py-4 px-2 text-gray-400">

                      {new Date(tx.createdAt).toLocaleString()}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ==========================================
          TRANSACTION SUMMARY BAR
      ========================================== */}

      <div className="grid md:grid-cols-4 gap-5 mb-10">

        {/* Total Records */}
        <div className="bg-zinc-900 border border-purple-500 rounded-2xl p-5">

          <p className="text-gray-400 text-sm">
            Total Records
          </p>

          <h3 className="text-3xl font-black text-purple-400 mt-2">
            {transactions.length}
          </h3>

        </div>

        {/* Deposits */}
        <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

          <p className="text-gray-400 text-sm">
            Deposit Records
          </p>

          <h3 className="text-3xl font-black text-green-400 mt-2">
            {transactions.filter((tx) => tx.type === "Deposit").length}
          </h3>

        </div>

        {/* Withdraws */}
        <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">

          <p className="text-gray-400 text-sm">
            Withdraw Records
          </p>

          <h3 className="text-3xl font-black text-red-400 mt-2">
            {transactions.filter((tx) => tx.type === "Withdraw").length}
          </h3>

        </div>

        {/* Adjustments */}
        <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

          <p className="text-gray-400 text-sm">
            Manual Adjustments
          </p>

          <h3 className="text-3xl font-black text-yellow-400 mt-2">
            {transactions.filter((tx) => tx.type === "Adjustment").length}
          </h3>

        </div>

      </div>      {/* ==========================================
          SYSTEM HEALTH & Wallet ANALYTICS
      ========================================== */}

      <div className="grid xl:grid-cols-2 gap-6 mb-10">

        {/* ==========================================
            Wallet ANALYTICS
        ========================================== */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

          <div className="flex items-center gap-3 mb-6">
            <Wallet size={28} className="text-yellow-400" />

            <h2 className="text-2xl font-black text-yellow-400">
              Wallet Analytics
            </h2>
          </div>

          <div className="space-y-4">

            {/* Total Wallet */}
            <div className="bg-black border border-yellow-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm">
                  Total Pkr Wallet
                </p>

                <h3 className="text-2xl font-black text-yellow-400">
                  Pkr {(stats.WalletBalance ?? 0).toLocaleString()}
                </h3>
              </div>

              <Wallet size={34} className="text-yellow-400" />
            </div>

            {/* Deposits */}
            <div className="bg-black border border-green-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm">
                  Total Deposits
                </p>

                <h3 className="text-2xl font-black text-green-400">
                  Pkr {(stats.totalDeposits ?? 0).toLocaleString()}
                </h3>
              </div>

              <ArrowUpCircle size={34} className="text-green-400" />
            </div>

            {/* Withdraws */}
            <div className="bg-black border border-red-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm">
                  Total Withdraws
                </p>

                <h3 className="text-2xl font-black text-red-400">
                  Pkr {(stats.totalWithdraws ?? 0).toLocaleString()}
                </h3>
              </div>

              <ArrowDownCircle size={34} className="text-red-400" />
            </div>

            {/* Pending Operations */}
            <div className="bg-black border border-cyan-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm">
                  Pending Operations
                </p>

                <h3 className="text-2xl font-black text-cyan-400">
                  {(stats.pendingDeposits ?? 0) +
                    (stats.pendingWithdraws ?? 0)}
                </h3>
              </div>

              <Clock size={34} className="text-cyan-400" />
            </div>

          </div>

        </div>

        {/* ==========================================
            SYSTEM HEALTH
        ========================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">

          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck size={28} className="text-green-400" />

            <h2 className="text-2xl font-black text-green-400">
              System Health
            </h2>
          </div>

          <div className="space-y-4">

            {/* API */}
            <div className="bg-black border border-green-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm">
                  Backend API
                </p>

                <h3 className="text-green-400 font-bold">
                  Connected
                </h3>
              </div>

              <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
            </div>

            {/* Database */}
            <div className="bg-black border border-blue-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm">
                  MongoDB Database
                </p>

                <h3 className="text-blue-400 font-bold">
                  Online
                </h3>
              </div>

              <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
            </div>

            {/* JWT */}
            <div className="bg-black border border-yellow-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm">
                  JWT Authentication
                </p>

                <h3 className="text-yellow-400 font-bold">
                  Active
                </h3>
              </div>

              <div className="h-3 w-3 rounded-full bg-yellow-500 animate-pulse"></div>
            </div>

            {/* Trading */}
            <div className="bg-black border border-purple-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm">
                  Gold Trading Engine
                </p>

                <h3
                  className={`font-bold ${
                    settings.marketStatus === "OPEN"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {settings.marketStatus === "OPEN"
                    ? "Running"
                    : "Stopped"}
                </h3>
              </div>

              <div
                className={`h-3 w-3 rounded-full ${
                  settings.marketStatus === "OPEN"
                    ? "bg-green-500 animate-pulse"
                    : "bg-red-500"
                }`}
              ></div>
            </div>

          </div>

        </div>

      </div>
      {/* ==========================================
          GOLD MARKET ANALYTICS
      ========================================== */}

      <div className="bg-zinc-900 border border-amber-500 rounded-3xl p-6 mb-10">

        <div className="flex items-center gap-3 mb-6">
          <Coins size={28} className="text-amber-400" />

          <h2 className="text-2xl font-black text-amber-400">
            Gold Market Analytics
          </h2>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* Gold USD */}
          <div className="bg-black rounded-xl border border-amber-700 p-5">

            <p className="text-gray-400 text-sm">
              Gold USD Price
            </p>

            <h3 className="text-2xl font-black text-amber-400 mt-2">
              ${Number(settings.goldPriceUSD ?? 0).toLocaleString()}
            </h3>

          </div>

          {/* USD Pkr */}
          <div className="bg-black rounded-xl border border-blue-700 p-5">

            <p className="text-gray-400 text-sm">
              USD / Pkr
            </p>

            <h3 className="text-2xl font-black text-blue-400 mt-2">
              Pkr {Number(settings.UsdtoPkr ?? 0).toLocaleString()}
            </h3>

          </div>

          {/* buy */}
          <div className="bg-black rounded-xl border border-green-700 p-5">

            <p className="text-gray-400 text-sm">
              buy Gold
            </p>

            <h3 className="text-2xl font-black text-green-400 mt-2">
              Pkr {(settings.buyGoldPrice ?? 0).toLocaleString()}
            </h3>

          </div>

          {/* sell */}
          <div className="bg-black rounded-xl border border-red-700 p-5">

            <p className="text-gray-400 text-sm">
              sell Gold
            </p>

            <h3 className="text-2xl font-black text-red-400 mt-2">
              Pkr {(settings.sellGoldPrice ?? 0).toLocaleString()}
            </h3>

          </div>

        </div>

        {/* Spread */}
        <div className="mt-6 bg-black border border-yellow-700 rounded-xl p-5 flex justify-between items-center flex-wrap gap-3">

          <div>
            <p className="text-gray-400 text-sm">
              Gold Trading Spread
            </p>

            <h3 className="text-3xl font-black text-yellow-400 mt-1">
              Pkr{" "}
              {(
                (settings.buyGoldPrice ?? 0) -
                (settings.sellGoldPrice ?? 0)
              ).toLocaleString()}
            </h3>
          </div>

          <div className="text-right">
            <p className="text-gray-400 text-sm">
              Market Status
            </p>

            <span
              className={`px-5 py-2 rounded-full font-bold ${
                settings.marketStatus === "OPEN"
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {settings.marketStatus}
            </span>
          </div>

        </div>

      </div>      {/* ==========================================
          ADMIN CONTROL CENTER
      ========================================== */}

      <div className="grid xl:grid-cols-2 gap-6 mb-10">

        {/* ==========================================
            QUICK SYSTEM CONTROLS
        ========================================== */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">

          <div className="flex items-center gap-3 mb-6">
            <Settings size={28} className="text-cyan-400" />
            <h2 className="text-2xl font-black text-cyan-400">
              Quick System Controls
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <Link href="/admin/users">
              <button className="w-full bg-cyan-600 hover:bg-cyan-500 rounded-xl p-4 text-white font-bold transition">
                👥 Manage Users
              </button>
            </Link>

            <Link href="/admin/deposit">
              <button className="w-full bg-green-600 hover:bg-green-500 rounded-xl p-4 text-white font-bold transition">
                💳 Deposit Panel
              </button>
            </Link>

            <Link href="/admin/withdraw">
              <button className="w-full bg-red-600 hover:bg-red-500 rounded-xl p-4 text-white font-bold transition">
                💸 Withdraw Panel
              </button>
            </Link>

            <Link href="/admin/Wallet-manager">
              <button className="w-full bg-yellow-600 hover:bg-yellow-500 rounded-xl p-4 text-white font-bold transition">
                💰 Wallet Manager
              </button>
            </Link>

            <Link href="/admin/settings">
              <button className="w-full bg-purple-600 hover:bg-purple-500 rounded-xl p-4 text-white font-bold transition">
                ⚙️ Gold Settings
              </button>
            </Link>

            <Link href="/admin/payment-settings">
              <button className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl p-4 text-white font-bold transition">
                🏦 Payment Settings
              </button>
            </Link>

            <Link href="/admin/Usdt">
              <button className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-xl p-4 text-white font-bold transition">
                🪙 Usdt Settings
              </button>
            </Link>

            <Link href="/admin/history">
              <button className="w-full bg-orange-600 hover:bg-orange-500 rounded-xl p-4 text-white font-bold transition">
                📜 history Center
              </button>
            </Link>

          </div>

        </div>

        {/* ==========================================
            ADMIN ACTIVITY CENTER
        ========================================== */}

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6">

          <div className="flex items-center gap-3 mb-6">
            <Activity size={28} className="text-purple-400" />
            <h2 className="text-2xl font-black text-purple-400">
              Admin Activity Center
            </h2>
          </div>

          <div className="space-y-4">

            <div className="bg-black border border-green-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">
                  Dashboard Loaded Successfully
                </p>
                <p className="text-xs text-gray-500">
                  GoldTrade backend connected.
                </p>
              </div>

              <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                LIVE
              </span>
            </div>

            <div className="bg-black border border-yellow-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">
                  Market Status
                </p>
                <p className="text-xs text-gray-500">
                  Gold trading engine state.
                </p>
              </div>

              <span
                className={`text-xs px-3 py-1 rounded-full font-bold ${
                  settings.marketStatus === "OPEN"
                    ? "bg-green-600 text-white"
                    : "bg-red-600 text-white"
                }`}
              >
                {settings.marketStatus}
              </span>
            </div>

            <div className="bg-black border border-cyan-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">
                  Pending Deposits
                </p>
                <p className="text-xs text-gray-500">
                  Waiting for admin approval.
                </p>
              </div>

              <span className="bg-cyan-500 text-black text-xs px-3 py-1 rounded-full font-bold">
                {pendingDeposits.length}
              </span>
            </div>

            <div className="bg-black border border-red-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">
                  Pending Withdraws
                </p>
                <p className="text-xs text-gray-500">
                  Waiting for Wallet deduction.
                </p>
              </div>

              <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                {pendingWithdraws.length}
              </span>
            </div>

            <div className="bg-black border border-yellow-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">
                  Logged In Admin
                </p>
                <p className="text-xs text-gray-500">
                  Current administrator session.
                </p>
              </div>

              <span className="bg-yellow-500 text-black text-xs px-3 py-1 rounded-full font-bold">
                {adminName}
              </span>
            </div>

            <div className="bg-black border border-blue-700 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="text-white font-semibold">
                  Last Dashboard Refresh
                </p>
                <p className="text-xs text-gray-500">
                  System synchronization time.
                </p>
              </div>

              <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                <span suppressHydrationWarning>
               {mounted ? currentTime : "--:--:--"}
              </span>
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* ==========================================
          ADMIN SECURITY PANEL
      ========================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck size={28} className="text-yellow-400" />
          <h2 className="text-2xl font-black text-yellow-400">
            Security & Session Information
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">

          <div className="bg-black rounded-xl border border-yellow-700 p-5">
            <p className="text-gray-400 text-sm">Logged In User</p>

            <h3 className="text-xl font-bold text-yellow-400 mt-2">
              {adminName}
            </h3>
          </div>

          <div className="bg-black rounded-xl border border-green-700 p-5">
            <p className="text-gray-400 text-sm">Role</p>

            <h3 className="text-xl font-bold text-green-400 mt-2">
              Administrator
            </h3>
          </div>

          <div className="bg-black rounded-xl border border-cyan-700 p-5">
            <p className="text-gray-400 text-sm">Session</p>

            <h3 className="text-xl font-bold text-cyan-400 mt-2">
              Active
            </h3>
          </div>

        </div>

        {/* Logout Button */}

        <button
          onClick={() => {
            localStorage.clear();
            window.location.href = "/login";
          }}
          className="mt-6 w-full bg-red-600 hover:bg-red-500 rounded-xl py-3 text-white font-bold transition"
        >
          Logout Administrator
        </button>

      </div>      {/* ==========================================
          GoldTrade SYSTEM FOOTER
      ========================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck size={30} className="text-yellow-400" />

          <h2 className="text-2xl font-black text-yellow-400">
            GoldTrade V18 Enterprise Platform
          </h2>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          {/* VERSION */}
          <div className="bg-black border border-yellow-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Version</p>

            <h3 className="text-xl font-bold text-yellow-400 mt-2">
              V18 Enterprise
            </h3>
          </div>

          {/* API */}
          <div className="bg-black border border-green-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Backend API</p>

            <h3 className="text-xl font-bold text-green-400 mt-2">
              Connected
            </h3>
          </div>

          {/* DATABASE */}
          <div className="bg-black border border-blue-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Database</p>

            <h3 className="text-xl font-bold text-blue-400 mt-2">
              MongoDB Atlas
            </h3>
          </div>

          {/* STATUS */}
          <div className="bg-black border border-purple-700 rounded-xl p-4">
            <p className="text-gray-400 text-sm">Trading Engine</p>

            <h3
              className={`text-xl font-bold mt-2 ${
                settings.marketStatus === "OPEN"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {settings.marketStatus}
            </h3>
          </div>

        </div>

        {/* Footer Info */}
        <div className="border-t border-zinc-700 mt-8 pt-6">

          <div className="grid md:grid-cols-3 gap-5">

            <div>
              <p className="text-gray-500 text-sm">
                Administrator
              </p>

              <p className="text-cyan-400 font-bold mt-1">
                {adminName}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Current Session
              </p>

              <p className="text-green-400 font-bold mt-1">
                Active
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm">
                Last Updated
              </p>
              <p className="text-yellow-400 font-bold mt-1">
                <span suppressHydrationWarning>
                  {mounted ? currentDateTime : "--:--:--"}
                </span>
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* ==========================================
          COPYRIGHT
      ========================================== */}

      <div className="text-center py-8 border-t border-zinc-800">

        <h3 className="text-yellow-400 font-black text-xl mb-2">
          GoldTrade Enterprise V18
        </h3>

        <p className="text-gray-500 text-sm">
          Pkr • GOLD • Usdt Multi Wallet Trading Platform
        </p>

        <p className="text-gray-600 text-xs mt-3">
          © 2026 GoldTrade Enterprise — All Rights Reserved.
        </p>

      </div>

    </div>
  );
}