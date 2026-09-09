"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Settings,
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  UserCog,
  LogOut,
} from "lucide-react";

const API = "http://localhost:5000";

// ======================================
// TYPES
// ======================================

interface DashboardStats {
  users: number;
  activeUsers: number;
  blockedUsers: number;
  totalDeposits: number;
  totalWithdraws: number;
  goldTrades: number;
}

interface MarketData {
  goldPriceUSD: number;
  usdToPkr: number;
  usdtRate: number;
  buyGoldPrice: number;
  sellGoldPrice: number;
  goldTradingEnabled: boolean;
}

interface UserInfo {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: string;
  walletBalance: number;
  usdtBalance: number;
  goldBalance: number;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    users: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalDeposits: 0,
    totalWithdraws: 0,
    goldTrades: 0,
  });

  const [market, setMarket] = useState<MarketData>({
    goldPriceUSD: 0,
    usdToPkr: 0,
    usdtRate: 0,
    buyGoldPrice: 0,
    sellGoldPrice: 0,
    goldTradingEnabled: true,
  });

  const [users, setUsers] = useState<UserInfo[]>([]);

  const [lastRefresh, setLastRefresh] = useState("");

  // ======================================
  // LOAD ADMIN DATA
  // ======================================

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [statsRes, marketRes, usersRes] = await Promise.all([
        fetch(`${API}/api/dashboard/stats`),
        fetch(`${API}/api/settings/market`),
        fetch(`${API}/api/users`),
      ]);

      const statsData = await statsRes.json();
      const marketData = await marketRes.json();
      const usersData = await usersRes.json();

      if (statsData.success) setStats(statsData.data);
      if (marketData.success) setMarket(marketData.data);
      if (usersData.success) setUsers(usersData.data);

      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
      alert("Dashboard Load Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 15000);

    return () => clearInterval(interval);
  }, []);

  const totalVolume = useMemo(() => {
    return stats.totalDeposits + stats.totalWithdraws;
  }, [stats]);

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex justify-center items-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" />
        Loading Admin Dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ================= HEADER ================= */}

      <div className="sticky top-0 bg-zinc-950 border-b border-yellow-500 z-50">

        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">

          <div>
            <h1 className="text-3xl font-bold text-yellow-400">
              GoldTrade Admin
            </h1>

            <p className="text-sm text-gray-400">
              Live Dashboard • Last Refresh {lastRefresh}
            </p>
          </div>

          <div className="flex gap-3">

            <button
              onClick={loadDashboard}
              className="bg-yellow-500 text-black px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

            <button
              onClick={logout}
              className="bg-red-600 px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ================= LIVE MARKET ================= */}

        <section className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400 rounded-3xl p-8 text-black mb-8">

          <div className="flex justify-between items-center">

            <div>

              <p className="font-semibold tracking-wider">
                LIVE GOLD MARKET
              </p>

              <h2 className="text-5xl font-bold mt-2">
                ${market.goldPriceUSD.toFixed(2)}
              </h2>

              <p className="mt-3">
                USD / PKR : {market.usdToPkr}
              </p>

              <p>
                USDT Rate : PKR {market.usdtRate}
              </p>

            </div>

            <Coins size={90} />

          </div>

          <div className="grid md:grid-cols-3 gap-5 mt-8">

            <div className="bg-green-700 rounded-2xl p-5 text-white">

              <p>BUY GOLD / Gram</p>

              <h3 className="text-3xl font-bold mt-2">
                PKR {market.buyGoldPrice.toLocaleString()}
              </h3>

            </div>

            <div className="bg-red-700 rounded-2xl p-5 text-white">

              <p>SELL GOLD / Gram</p>

              <h3 className="text-3xl font-bold mt-2">
                PKR {market.sellGoldPrice.toLocaleString()}
              </h3>

            </div>

            <div className="bg-zinc-900 rounded-2xl p-5 text-yellow-300">

              <p>Trading Status</p>

              <h3 className="text-3xl font-bold mt-2">
                {market.goldTradingEnabled ? "LIVE" : "OFF"}
              </h3>

            </div>

          </div>

        </section>

        {/* ================= STATS CARDS ================= */}

        <section className="grid md:grid-cols-3 lg:grid-cols-6 gap-5 mb-10">

          <AdminCard
            icon={<Users size={26} />}
            title="Users"
            value={stats.users.toString()}
            color="yellow"
          />

          <AdminCard
            icon={<ShieldCheck size={26} />}
            title="Active"
            value={stats.activeUsers.toString()}
            color="green"
          />

          <AdminCard
            icon={<ShieldX size={26} />}
            title="Blocked"
            value={stats.blockedUsers.toString()}
            color="red"
          />

          <AdminCard
            icon={<ArrowDownCircle size={26} />}
            title="Deposits"
            value={`PKR ${stats.totalDeposits.toLocaleString()}`}
            color="cyan"
          />

          <AdminCard
            icon={<ArrowUpCircle size={26} />}
            title="Withdraws"
            value={`PKR ${stats.totalWithdraws.toLocaleString()}`}
            color="purple"
          />

          <AdminCard
            icon={<Coins size={26} />}
            title="Gold Trades"
            value={stats.goldTrades.toString()}
            color="orange"
          />

        </section>

        {/* ================= FINANCIAL SUMMARY ================= */}

        <section className="grid md:grid-cols-3 gap-6 mb-10">

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

            <TrendingUp className="text-green-400 mb-4" size={30} />

            <p className="text-gray-400">Total Deposits</p>

            <h2 className="text-3xl font-bold text-green-400 mt-2">
              PKR {stats.totalDeposits.toLocaleString()}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">

            <TrendingDown className="text-red-400 mb-4" size={30} />

            <p className="text-gray-400">Total Withdraws</p>

            <h2 className="text-3xl font-bold text-red-400 mt-2">
              PKR {stats.totalWithdraws.toLocaleString()}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6">

            <Wallet className="text-cyan-400 mb-4" size={30} />

            <p className="text-gray-400">Trading Volume</p>

            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              PKR {totalVolume.toLocaleString()}
            </h2>

          </div>

        </section>

        {/* ================= QUICK ACTIONS ================= */}

        <section className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">

          <QuickButton
            title="Wallet Manager"
            icon={<Wallet size={22} />}
            href="/admin/wallets"
            color="yellow"
          />

          <QuickButton
            title="Users"
            icon={<Users size={22} />}
            href="/admin/users"
            color="green"
          />

          <QuickButton
            title="Deposits"
            icon={<ArrowDownCircle size={22} />}
            href="/admin/deposits"
            color="cyan"
          />

          <QuickButton
            title="Withdraws"
            icon={<ArrowUpCircle size={22} />}
            href="/admin/withdraws"
            color="red"
          />

          <QuickButton
            title="Transactions"
            icon={<History size={22} />}
            href="/transactions"
            color="purple"
          />

          <QuickButton
            title="Settings"
            icon={<Settings size={22} />}
            href="/admin/settings"
            color="orange"
          />

        </section>
                {/* ================= RECENT USERS TABLE ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-3">
              <UserCog size={24} />
              Recent Users
            </h2>

            <button
              onClick={() => (window.location.href = "/admin/users")}
              className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-semibold"
            >
              View All Users
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-yellow-600 text-yellow-400">

                <tr className="text-left">
                  <th className="py-3">Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>PKR Wallet</th>
                  <th>Gold</th>
                </tr>

              </thead>

              <tbody>

                {users.slice(0, 8).map((user) => (

                  <tr
                    key={user._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                  >

                    <td className="py-4 font-semibold text-yellow-300">
                      {user.username}
                    </td>

                    <td>{user.email}</td>

                    <td>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          user.role === "admin"
                            ? "bg-red-700 text-white"
                            : user.role === "manager"
                            ? "bg-blue-700 text-white"
                            : "bg-green-700 text-white"
                        }`}
                      >
                        {user.role.toUpperCase()}
                      </span>

                    </td>

                    <td>

                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          user.status === "Active"
                            ? "bg-green-700 text-white"
                            : "bg-red-700 text-white"
                        }`}
                      >
                        {user.status}
                      </span>

                    </td>

                    <td className="text-green-400 font-semibold">
                      PKR {user.walletBalance.toLocaleString()}
                    </td>

                    <td className="text-yellow-400 font-semibold">
                      {user.goldBalance.toFixed(2)} g
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

        {/* ================= SYSTEM STATUS ================= */}

        <section className="grid md:grid-cols-2 gap-6 mb-10">

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

            <h2 className="text-xl font-bold text-green-400 mb-5">
              System Status
            </h2>

            <div className="space-y-4">

              <StatusRow
                label="Gold Trading"
                active={market.goldTradingEnabled}
              />

              <StatusRow
                label="Deposit System"
                active={true}
              />

              <StatusRow
                label="Withdraw System"
                active={true}
              />

              <StatusRow
                label="Backend API"
                active={true}
              />

              <StatusRow
                label="MongoDB"
                active={true}
              />

            </div>

          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6">

            <h2 className="text-xl font-bold text-cyan-400 mb-5">
              Live Market Summary
            </h2>

            <div className="space-y-4">

              <SummaryRow
                label="Gold Price (USD)"
                value={`$ ${market.goldPriceUSD.toFixed(2)}`}
              />

              <SummaryRow
                label="USD / PKR"
                value={market.usdToPkr.toString()}
              />

              <SummaryRow
                label="USDT Rate"
                value={`PKR ${market.usdtRate}`}
              />

              <SummaryRow
                label="Buy Gold Price"
                value={`PKR ${market.buyGoldPrice.toLocaleString()}`}
              />

              <SummaryRow
                label="Sell Gold Price"
                value={`PKR ${market.sellGoldPrice.toLocaleString()}`}
              />

            </div>

          </div>

        </section>

        {/* ================= ADMIN SHORTCUTS ================= */}

        <section className="grid md:grid-cols-3 gap-6 mb-12">

          <ShortcutCard
            title="Wallet Manager"
            desc="Credit / Debit PKR, USDT & Gold Wallets"
            href="/admin/wallets"
            icon={<Wallet size={34} />}
            color="yellow"
          />

          <ShortcutCard
            title="Deposit Approval"
            desc="Approve or Reject User Deposits"
            href="/admin/deposits"
            icon={<ArrowDownCircle size={34} />}
            color="green"
          />

          <ShortcutCard
            title="Withdraw Approval"
            desc="Approve Withdraw Requests"
            href="/admin/withdraws"
            icon={<ArrowUpCircle size={34} />}
            color="red"
          />

          <ShortcutCard
            title="User Manager"
            desc="Block / Active / Change Roles"
            href="/admin/users"
            icon={<Users size={34} />}
            color="cyan"
          />

          <ShortcutCard
            title="Settings Manager"
            desc="Live Gold Price, Wallet & Trading Controls"
            href="/admin/settings"
            icon={<Settings size={34} />}
            color="orange"
          />

          <ShortcutCard
            title="Transactions"
            desc="View Complete Transaction History"
            href="/transactions"
            icon={<History size={34} />}
            color="purple"
          />

        </section>

      </div>
    </main>
  );
}

/* ==========================================================
   REUSABLE COMPONENTS
========================================================== */

type AdminColor =
  | "green"
  | "yellow"
  | "red"
  | "cyan"
  | "purple"
  | "orange";

interface AdminCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: AdminColor;
}

function AdminCard({
  title,
  value,
  icon,
  color,
}: AdminCardProps) {

  const colors = {
    green: "border-green-600 text-green-400",
    yellow: "border-yellow-500 text-yellow-400",
    red: "border-red-600 text-red-400",
    cyan: "border-cyan-500 text-cyan-400",
    purple: "border-purple-500 text-purple-400",
    orange: "border-orange-500 text-orange-400",
  };

  return (
    <div
      className={`bg-zinc-900 rounded-3xl border ${colors[color]} p-5`}
    >
      <div className="mb-4">{icon}</div>

      <p className="text-gray-400 text-sm">{title}</p>

      <h3 className="text-2xl font-bold mt-2 break-words">
        {value}
      </h3>
    </div>
  );
}

interface QuickButtonProps {
  title: string;
  href: string;
  icon: React.ReactNode;
  color: AdminColor;
}

function QuickButton({
  title,
  href,
  icon,
  color,
}: QuickButtonProps) {

  const bg = {
    yellow: "bg-yellow-500 hover:bg-yellow-400 text-black",
    green: "bg-green-600 hover:bg-green-500",
    red: "bg-red-600 hover:bg-red-500",
    cyan: "bg-cyan-600 hover:bg-cyan-500",
    purple: "bg-purple-600 hover:bg-purple-500",
    orange: "bg-orange-500 hover:bg-orange-400 text-black",
  };

  return (
    <button
      onClick={() => (window.location.href = href)}
      className={`${bg[color]} rounded-2xl p-5 font-bold flex flex-col items-center justify-center gap-3 transition`}
    >
      {icon}
      <span>{title}</span>
    </button>
  );
}

interface ShortcutCardProps {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  color: AdminColor;
}

function ShortcutCard({
  title,
  desc,
  href,
  icon,
  color,
}: ShortcutCardProps) {

  const border = {
    yellow: "border-yellow-500 text-yellow-400",
    green: "border-green-500 text-green-400",
    red: "border-red-500 text-red-400",
    cyan: "border-cyan-500 text-cyan-400",
    purple: "border-purple-500 text-purple-400",
    orange: "border-orange-500 text-orange-400",
  };

  return (
    <button
      onClick={() => (window.location.href = href)}
      className={`bg-zinc-900 rounded-3xl border ${border[color]} p-6 text-left hover:bg-zinc-800 transition`}
    >
      <div className="mb-4">{icon}</div>

      <h3 className="text-xl font-bold mb-2">{title}</h3>

      <p className="text-gray-400 text-sm">{desc}</p>
    </button>
  );
}

interface StatusRowProps {
  label: string;
  active: boolean;
}

function StatusRow({
  label,
  active,
}: StatusRowProps) {
  return (
    <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
      <span className="text-gray-400">{label}</span>

      <span
        className={`px-3 py-1 rounded-full text-sm font-bold ${
          active
            ? "bg-green-700 text-white"
            : "bg-red-700 text-white"
        }`}
      >
        {active ? "ONLINE" : "OFFLINE"}
      </span>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({
  label,
  value,
}: SummaryRowProps) {
  return (
    <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
      <span className="text-gray-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}