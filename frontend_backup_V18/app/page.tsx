"use client";

import { useEffect, useMemo, useState } from "react";



import {
  Wallet,
  Coins,
  RefreshCw,
  LogOut,
  DollarSign,
  TrendingUp,
  ArrowUpCircle,
  History,
} from "lucide-react";



// ==========================================
// GOLDTRADE V17 API CONFIG
// ==========================================

  
  const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";


// ===============================
// TYPES
// ===============================
interface UserData {
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
}

interface MarketData {
  goldPriceUSD: number;
  usdToPkr: number;
  usdtRate: number;
  buyGoldPrice: number;
  sellGoldPrice: number;
  goldSpread: number;
  goldTradingEnabled: boolean;
}

interface TradeHistory {
  _id: string;
  tradeType: "BUY" | "SELL";
  grams: number;
  totalPKR: number;
  pricePerGram: number;
  createdAt: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  reason: string;
}

interface BalanceCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
}

function BalanceCard({ title, value, icon, color = "text-white" }: BalanceCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400">{title}</span>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

interface MarketCardProps {
  buyPrice: number;
  sellPrice: number;
  usdtRate: number;
  spread: number;
}

function MarketCard({ buyPrice, sellPrice, usdtRate, spread }: MarketCardProps) {
  const format = (value: number) => `PKR ${value.toLocaleString()}`;

  return (
    <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">Live Market</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div><p className="text-gray-400 text-sm">Buy Price</p><p className="font-bold text-green-400">{format(buyPrice)}</p></div>
        <div><p className="text-gray-400 text-sm">Sell Price</p><p className="font-bold text-red-400">{format(sellPrice)}</p></div>
        <div><p className="text-gray-400 text-sm">Spread</p><p className="font-bold">{format(spread)}</p></div>
        <div><p className="text-gray-400 text-sm">USDT Rate</p><p className="font-bold text-cyan-400">{format(usdtRate)}</p></div>
      </div>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">Quick Actions</h2>
      <div className="flex flex-col gap-3">
        <a href="/buy-gold" className="rounded-xl bg-green-600 hover:bg-green-500 px-4 py-3 text-center font-semibold">Buy Gold</a>
        <a href="/sell-gold" className="rounded-xl bg-red-600 hover:bg-red-500 px-4 py-3 text-center font-semibold">Sell Gold</a>
      </div>
    </div>
  );
}

function TransactionTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 overflow-x-auto">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">Recent Transactions</h2>
      {transactions.length === 0 ? (
        <p className="text-gray-400">No transactions found.</p>
      ) : (
        <table className="w-full text-left">
          <thead><tr className="border-b border-zinc-700 text-gray-400"><th className="py-3">Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>{transactions.map((transaction) => (
            <tr key={transaction._id} className="border-b border-zinc-800 last:border-0">
              <td className="py-3">{transaction.type}</td>
              <td>PKR {Number(transaction.amount).toLocaleString()}</td>
              <td>{transaction.status}</td>
              <td>{new Date(transaction.createdAt).toLocaleString()}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState<UserData>({
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

  const [market, setMarket] = useState<MarketData>({
    goldPriceUSD: 0,
    usdToPkr: 0,
    usdtRate: 0,
    buyGoldPrice: 0,
    sellGoldPrice: 0,
    goldSpread: 0,
    goldTradingEnabled: true,
  });

  const [goldHistory, setGoldHistory] = useState<TradeHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastUpdate, setLastUpdate] = useState("");

  // =====================================
  // AUTH HELPERS
  // =====================================
  const getToken = () => localStorage.getItem("token") || "";
  const loadDashboard = async () => {
  try {
    setLoading(true);

    const username = localStorage.getItem("username");
    const token = localStorage.getItem("token");

    if (!username || !token) {
      window.location.href = "/login";
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const [userRes, marketRes, goldRes, transactionRes] =
      await Promise.all([
        fetch(`${API}/api/users/${username}`, { headers }),
        fetch(`${API}/api/settings/market`, { headers }),
        fetch(`${API}/api/gold/history/${username}`, { headers }),
        fetch(`${API}/api/transactions/${username}`, { headers }),
      ]);

    const userData = await userRes.json();
    const marketData = await marketRes.json();
    const goldData = await goldRes.json();
    const transactionData = await transactionRes.json();

    if (userData.success) setUser(userData.data);
    if (marketData.success) setMarket(marketData.data);
    if (goldData.success) setGoldHistory(goldData.data);
    if (transactionData.success) setTransactions(transactionData.data);

    setLastUpdate(new Date().toLocaleTimeString());

  } catch (err) {
    console.error("Dashboard Error:", err);
    setLoading(false);
  } finally {
    setLoading(false);
  }
  };
    // =====================================
  // INITIAL LOAD
  // =====================================
  useEffect(() => {
    const token = getToken();

    if (!token) {
      window.location.replace("/login");
      return;
    }

    loadDashboard();

    const interval = setInterval(() => {
      loadDashboard();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // =====================================
  // PORTFOLIO CALCULATIONS
  // =====================================
  const portfolioValue = useMemo(() => {
    return user.goldBalance * market.sellGoldPrice;
  }, [user.goldBalance, market.sellGoldPrice]);

  const liveProfit = useMemo(() => {
    return (
      (market.sellGoldPrice - user.goldAveragePrice) *
      user.goldBalance
    );
  }, [market.sellGoldPrice, user.goldAveragePrice, user.goldBalance]);

  const totalAssets = useMemo(() => {
    return (
      user.walletBalance +
      portfolioValue +
      user.usdtBalance * market.usdtRate
    );
  }, [user.walletBalance, portfolioValue, user.usdtBalance, market.usdtRate]);

  // =====================================
  // LOGOUT
  // =====================================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

    window.location.replace("/login");
  };

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

        <button
          onClick={loadDashboard}
          className="mt-6 px-5 py-2 bg-yellow-500 text-black rounded-lg font-semibold hover:bg-yellow-400 transition"
        >
          Retry Connection
        </button>
      </main>
    );
  };

  // =====================================
  // MAIN PAGE START
  // =====================================
  return (
  <main className="min-h-screen bg-black text-white p-5">
    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold text-yellow-400">
          GoldTrade Dashboard
        </h1>

        <p className="text-gray-400 mt-1">
          Welcome back, <span className="text-yellow-400">{user.username}</span>
        </p>

        <p className="text-xs text-gray-500 mt-1">
          Last Update: {lastUpdate || "Loading..."}
        </p>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-semibold"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>

    {/* Wallet Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
      <BalanceCard
        title="Wallet Balance"
        value={`PKR ${Number(user.walletBalance).toLocaleString()}`}
        icon={<Wallet className="text-yellow-400" size={28} />}
      />

      <BalanceCard
        title="USDT Balance"
        value={`${Number(user.usdtBalance).toFixed(2)} USDT`}
        icon={<DollarSign className="text-green-400" size={28} />}
        color="text-green-400"
      />

      <BalanceCard
        title="Gold Balance"
        value={`${Number(user.goldBalance).toFixed(3)} g`}
        icon={<Coins className="text-yellow-400" size={28} />}
      />

      <BalanceCard
        title="Portfolio Value"
        value={`PKR ${Number(portfolioValue).toLocaleString()}`}
        icon={<TrendingUp className="text-cyan-400" size={28} />}
        color="text-cyan-400"
      />
    </div>

    {/* Market + Quick Actions */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <div className="xl:col-span-2">
        <MarketCard
          buyPrice={Number(market.buyGoldPrice || 0)}
          sellPrice={Number(market.sellGoldPrice || 0)}
          usdtRate={Number(market.usdtRate || 0)}
          spread={Number(market.sellGoldPrice || 0) - Number(market.buyGoldPrice || 0)}
        />
      </div>

      <QuickActions />
    </div>

    {/* Profit & Assets */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <TrendingUp className="text-green-400" />
          <h2 className="text-yellow-400 text-xl font-bold">
            Live Profit / Loss
          </h2>
        </div>

        <p
          className={`text-3xl font-bold ${
            liveProfit >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          PKR {Number(liveProfit).toLocaleString()}
        </p>

        <p className="text-gray-400 mt-2">
          Based on current live gold selling price.
        </p>
      </div>

      <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Wallet className="text-cyan-400" />
          <h2 className="text-yellow-400 text-xl font-bold">
            Total Assets
          </h2>
        </div>

        <p className="text-3xl font-bold text-cyan-400">
          PKR {Number(totalAssets).toLocaleString()}
        </p>

        <p className="text-gray-400 mt-2">
          Wallet + Gold + USDT combined value.
        </p>
      </div>
    </div>

    {/* Gold Summary */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-5">
        <div className="flex items-center gap-2 text-yellow-400 mb-2">
          <Coins size={20} />
          Average Gold Price
        </div>

        <p className="text-2xl font-bold">
          PKR {Number(user.goldAveragePrice).toLocaleString()}
        </p>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-5">
        <div className="flex items-center gap-2 text-green-400 mb-2">
          <ArrowUpCircle size={20} />
          Gold Profit
        </div>

        <p className="text-2xl font-bold text-green-400">
          PKR {Number(user.goldProfitLoss || 0).toLocaleString()}
        </p>
      </div>

      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 p-5">
        <div className="flex items-center gap-2 text-cyan-400 mb-2">
          <History size={20} />
          Total Deposits
        </div>

        <p className="text-2xl font-bold text-cyan-400">
          PKR {Number(user.totalDeposit || 0).toLocaleString()}
        </p>
      </div>
    </div>

    {/* Recent Transactions */}
    <div className="mb-8">
      <TransactionTable transactions={transactions} />
    </div>

    {/* Refresh Button */}
    <div className="flex justify-center">
      <button
        onClick={loadDashboard}
        disabled={loading}
        className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
      >
        <RefreshCw
          size={18}
          className={loading ? "animate-spin" : ""}
        />

        {loading ? "Refreshing..." : "Refresh Dashboard"}
      </button>
   </div>
  </main>
);
}