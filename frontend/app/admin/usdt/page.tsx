"use client";

/* ==========================================================
   GoldTrade V18 Enterprise
   Admin USDT Manager
   COMPLETE VERSION
   SECTION 1/4 - Foundation (Compile Safe)
========================================================== */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Wallet,
} from "lucide-react";

/* ==========================================================
   API URL
========================================================== */

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* ==========================================================
   Interfaces
========================================================== */

interface UsdtSettings {
  buyPrice: number;
  sellPrice: number;
  tradingEnabled: boolean;
}

interface UsdtTransaction {
  _id: string;
  username: string;
  amount: number;
  walletAddress: string;
  txHash?: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

/* ==========================================================
   Component
========================================================== */

export default function AdminUsdtPage() {
  /* ---------------- Loading ---------------- */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* ---------------- Settings ---------------- */

  const [settings, setSettings] = useState<UsdtSettings>({
    buyPrice: 0,
    sellPrice: 0,
    tradingEnabled: true,
  });

  /* ---------------- Transactions ---------------- */

  const [deposits, setDeposits] = useState<UsdtTransaction[]>([]);
  const [withdraws, setWithdraws] = useState<UsdtTransaction[]>([]);

  /* ---------------- Search ---------------- */

  const [search, setSearch] = useState("");

  /* ---------------- Pagination ---------------- */

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  /* ==========================================================
     JWT HEADER HELPER
  ========================================================== */

  const getHeaders = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : "";

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  /* ==========================================================
     LOAD USDT SETTINGS
     GET /api/admin/usdt/settings
  ========================================================== */

  const loadUsdtSettings = async () => {
    const response = await fetch(
      `${API}/api/admin/usdt/settings`,
      {
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load settings.");
    }

    setSettings({
      buyPrice: Number(data.settings?.buyPrice || 0),
      sellPrice: Number(data.settings?.sellPrice || 0),
      tradingEnabled: Boolean(data.settings?.tradingEnabled),
    });
  };

  /* ==========================================================
     LOAD PENDING DEPOSITS
  ========================================================== */

  const loadDeposits = async () => {
    const response = await fetch(
      `${API}/api/admin/usdt/deposits`,
      {
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load deposits.");
    }

    setDeposits(data.deposits || []);
  };

  /* ==========================================================
     LOAD PENDING WITHDRAWALS
  ========================================================== */

  const loadWithdraws = async () => {
    const response = await fetch(
      `${API}/api/admin/usdt/withdraws`,
      {
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to load withdrawals.");
    }

    setWithdraws(data.withdraws || []);
  };

  /* ==========================================================
     LOAD COMPLETE DASHBOARD
  ========================================================== */

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      await Promise.all([
        loadUsdtSettings(),
        loadDeposits(),
        loadWithdraws(),
      ]);
    } catch (error: any) {
      setErrorMessage(error.message || "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     REFRESH DASHBOARD
  ========================================================== */

  const refreshDashboard = async () => {
    try {
      setRefreshing(true);
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  };

  /* ==========================================================
     DEPOSIT ACTIONS
  ========================================================== */

  const approveDeposit = async (id: string) => {
    try {
      const response = await fetch(
        `${API}/api/admin/usdt/deposits/${id}/approve`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Approval failed.");
      }

      alert("Deposit Approved Successfully.");
      await loadDashboard();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const rejectDeposit = async (id: string) => {
    try {
      const response = await fetch(
        `${API}/api/admin/usdt/deposits/${id}/reject`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Rejection failed.");
      }

      alert("Deposit Rejected Successfully.");
      await loadDashboard();
    } catch (error: any) {
      alert(error.message);
    }
  };

  /* ==========================================================
     WITHDRAW ACTIONS
  ========================================================== */

  const approveWithdraw = async (id: string) => {
    try {
      const response = await fetch(
        `${API}/api/admin/usdt/withdraws/${id}/approve`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Approval failed.");
      }

      alert("Withdrawal Approved Successfully.");
      await loadDashboard();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const rejectWithdraw = async (id: string) => {
    try {
      const response = await fetch(
        `${API}/api/admin/usdt/withdraws/${id}/reject`,
        {
          method: "POST",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Rejection failed.");
      }

      alert("Withdrawal Rejected Successfully.");
      await loadDashboard();
    } catch (error: any) {
      alert(error.message);
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ==========================================================
     SEARCH FILTERS
  ========================================================== */

  const filteredDeposits = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return deposits.filter((item) => {
      if (!keyword) return true;

      return (
        item.username.toLowerCase().includes(keyword) ||
        item.walletAddress.toLowerCase().includes(keyword) ||
        item.txHash?.toLowerCase().includes(keyword)
      );
    });
  }, [search, deposits]);

  const filteredWithdraws = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return withdraws.filter((item) => {
      if (!keyword) return true;

      return (
        item.username.toLowerCase().includes(keyword) ||
        item.walletAddress.toLowerCase().includes(keyword) ||
        item.txHash?.toLowerCase().includes(keyword)
      );
    });
  }, [search, withdraws]);

  /* ==========================================================
     PAGINATION (Deposits)
  ========================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDeposits.length / rowsPerPage)
  );

  const paginatedDeposits = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;

    return filteredDeposits.slice(start, start + rowsPerPage);
  }, [filteredDeposits, currentPage]);

  /* ==========================================================
     ANALYTICS
  ========================================================== */

  const analytics = useMemo(() => {
    return {
      pendingDeposits: deposits.filter(
        (d) => d.status === "Pending"
      ).length,

      pendingWithdraws: withdraws.filter(
        (w) => w.status === "Pending"
      ).length,

      totalDepositAmount: deposits.reduce(
        (sum, d) => sum + Number(d.amount || 0),
        0
      ),

      totalWithdrawAmount: withdraws.reduce(
        (sum, w) => sum + Number(w.amount || 0),
        0
      ),
    };
  }, [deposits, withdraws]);

  /* ==========================================================
     LOADING SCREEN
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400 text-xl font-bold">
          <RefreshCw className="animate-spin" size={28} />
          Loading Admin USDT Dashboard...
        </div>
      </main>
    );
  }

  /* ==========================================================
     PAGE START
  ========================================================== */

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ============================================= */}
        {/* PAGE HEADER */}
        {/* ============================================= */}

        <header className="flex flex-wrap justify-between items-center gap-5">

          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-cyan-400">
              <DollarSign size={36} />
              Admin USDT Manager
            </h1>

            <p className="text-gray-400 mt-2">
              GoldTrade V18 Enterprise • Manage USDT Trading, Deposits & Withdrawals.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Link
              href="/admin"
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl font-bold transition"
            >
              Admin Dashboard
            </Link>

            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-700 disabled:cursor-not-allowed text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition"
            >
              <RefreshCw
                size={18}
                className={refreshing ? "animate-spin" : ""}
              />

              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

        </header>

        {/* ============================================= */}
        {/* ERROR MESSAGE */}
        {/* ============================================= */}

        {errorMessage && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 text-red-400 font-semibold">
            {errorMessage}
          </div>
        )}

        {/* ============================================= */}
        {/* LIVE USDT MARKET CARDS */}
        {/* ============================================= */}

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
            <TrendingUp className="text-green-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase tracking-wide">
              Buy Price
            </p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              PKR {settings.buyPrice.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">
            <TrendingDown className="text-red-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase tracking-wide">
              Sell Price
            </p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              PKR {settings.sellPrice.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">
            <ArrowDownRight className="text-cyan-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase tracking-wide">
              Pending Deposits
            </p>

            <h2 className="text-3xl font-black text-cyan-400 mt-2">
              {analytics.pendingDeposits}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">
            <ArrowUpRight className="text-orange-400 mb-3" size={28} />

            <p className="text-gray-500 text-sm uppercase tracking-wide">
              Pending Withdrawals
            </p>

            <h2 className="text-3xl font-black text-orange-400 mt-2">
              {analytics.pendingWithdraws}
            </h2>
          </div>

        </section>

        {/* ============================================= */}
        {/* MARKET ANALYTICS */}
        {/* ============================================= */}

        <section className="grid lg:grid-cols-2 gap-5">

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
            <p className="text-gray-500 text-sm uppercase tracking-wide">
              Total Pending Deposit Value
            </p>

            <h2 className="text-4xl font-black text-green-400 mt-3">
              {analytics.totalDepositAmount.toFixed(2)} USDT
            </h2>
          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-6">
            <p className="text-gray-500 text-sm uppercase tracking-wide">
              Total Pending Withdraw Value
            </p>

            <h2 className="text-4xl font-black text-orange-400 mt-3">
              {analytics.totalWithdrawAmount.toFixed(2)} USDT
            </h2>
          </div>

        </section>

        {/* ============================================= */}
        {/* TRADING STATUS PANEL */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 space-y-6">

          <div className="flex justify-between items-center flex-wrap gap-4">

            <div>
              <h2 className="text-2xl font-black text-cyan-400">
                USDT Trading Status
              </h2>

              <p className="text-gray-400 text-sm mt-2">
                Current market configuration used across GoldTrade.
              </p>
            </div>

            <div
              className={`px-5 py-3 rounded-xl font-bold ${
                settings.tradingEnabled
                  ? "bg-green-500/20 border border-green-500 text-green-400"
                  : "bg-red-500/20 border border-red-500 text-red-400"
              }`}
            >
              {settings.tradingEnabled
                ? "Trading Enabled"
                : "Trading Disabled"}
            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-black border border-green-500 rounded-xl p-5">
              <p className="text-gray-500 text-sm">Current Buy Rate</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR {settings.buyPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-red-500 rounded-xl p-5">
              <p className="text-gray-500 text-sm">Current Sell Rate</p>

              <h3 className="text-3xl font-black text-red-400 mt-2">
                PKR {settings.sellPrice.toLocaleString()}
              </h3>
            </div>

          </div>

          <div className="bg-black border border-zinc-700 rounded-xl p-5">
            <p className="text-gray-500 text-sm">Market Status</p>

            <h3
              className={`text-2xl font-black mt-3 ${
                settings.tradingEnabled
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {settings.tradingEnabled
                ? "USDT Market LIVE"
                : "USDT Market OFFLINE"}
            </h3>
          </div>

        </section>

        {/* ============================================= */}
        {/* SEARCH BAR */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 space-y-5">

          <div>
            <h2 className="text-2xl font-black text-cyan-400">
              Search Transactions
            </h2>

            <p className="text-gray-400 text-sm mt-2">
              Search by username, wallet address or transaction hash.
            </p>
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-4 text-gray-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search username, wallet address or TX Hash"
              className="w-full bg-black border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white focus:border-cyan-500 outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-3">

            <span className="bg-black border border-zinc-700 px-4 py-2 rounded-full text-sm">
              Search:
              <span className="text-cyan-400 font-bold ml-2">
                {search || "None"}
              </span>
            </span>

            <span className="bg-black border border-zinc-700 px-4 py-2 rounded-full text-sm">
              Deposits:
              <span className="text-green-400 font-bold ml-2">
                {filteredDeposits.length}
              </span>
            </span>

            <span className="bg-black border border-zinc-700 px-4 py-2 rounded-full text-sm">
              Withdrawals:
              <span className="text-orange-400 font-bold ml-2">
                {filteredWithdraws.length}
              </span>
            </span>

          </div>

        </section>

        {/* ============================================= */}
        {/* PENDING USDT DEPOSITS */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl overflow-hidden">

          <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-800 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-black text-green-400">
                Pending USDT Deposits
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Review and approve incoming USDT deposits.
              </p>
            </div>

            <span className="bg-green-500/20 border border-green-500 text-green-400 px-4 py-2 rounded-full text-sm font-bold">
              {filteredDeposits.length} Pending
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-black text-gray-400 text-sm">
                <tr>
                  <th className="text-left px-5 py-4">User</th>
                  <th className="text-left px-5 py-4">Wallet Address</th>
                  <th className="text-left px-5 py-4">TX Hash</th>
                  <th className="text-left px-5 py-4">Amount</th>
                  <th className="text-left px-5 py-4">Date</th>
                  <th className="text-center px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500">
                      No pending deposits found.
                    </td>
                  </tr>
                ) : (
                  paginatedDeposits.map((deposit) => (
                    <tr
                      key={deposit._id}
                      className="border-t border-zinc-800 hover:bg-zinc-800/40 transition"
                    >
                      <td className="px-5 py-4 font-bold text-white">
                        {deposit.username}
                      </td>

                      <td className="px-5 py-4 text-cyan-400 text-sm break-all">
                        {deposit.walletAddress}
                      </td>

                      <td className="px-5 py-4 text-purple-400 text-xs break-all">
                        {deposit.txHash || "No TX Hash"}
                      </td>

                      <td className="px-5 py-4">
                        <span className="bg-green-500/10 border border-green-500 text-green-400 px-3 py-2 rounded-lg font-bold">
                          {Number(deposit.amount).toFixed(2)} USDT
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-300 text-sm">
                        {new Date(deposit.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2 flex-wrap">

                          <button
                            onClick={() => approveDeposit(deposit._id)}
                            className="bg-green-500 hover:bg-green-400 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>

                          <button
                            onClick={() => rejectDeposit(deposit._id)}
                            className="bg-red-500 hover:bg-red-400 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden p-5 space-y-4">
            {paginatedDeposits.map((deposit) => (
              <div
                key={deposit._id}
                className="bg-black border border-zinc-700 rounded-xl p-5 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-lg text-white">
                      {deposit.username}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(deposit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase">Wallet Address</p>
                  <p className="text-cyan-400 text-sm break-all mt-1">
                    {deposit.walletAddress}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase">TX Hash</p>
                  <p className="text-purple-400 text-xs break-all mt-1">
                    {deposit.txHash || "No TX Hash"}
                  </p>
                </div>

                <div className="bg-zinc-900 border border-green-500 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">Deposit Amount</p>
                  <h3 className="text-2xl font-black text-green-400 mt-2">
                    {Number(deposit.amount).toFixed(2)} USDT
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => approveDeposit(deposit._id)}
                    className="bg-green-500 hover:bg-green-400 text-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>

                  <button
                    onClick={() => rejectDeposit(deposit._id)}
                    className="bg-red-500 hover:bg-red-400 text-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================= */}
        {/* PENDING USDT WITHDRAWALS */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-orange-500 rounded-2xl overflow-hidden">

          <div className="flex justify-between items-center px-6 py-5 border-b border-zinc-800 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl font-black text-orange-400">
                Pending USDT Withdrawals
              </h2>
              <p className="text-gray-400 text-sm mt-1">
                Review outgoing USDT withdrawal requests.
              </p>
            </div>

            <span className="bg-orange-500/20 border border-orange-500 text-orange-400 px-4 py-2 rounded-full text-sm font-bold">
              {filteredWithdraws.length} Pending
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-black text-gray-400 text-sm">
                <tr>
                  <th className="text-left px-5 py-4">User</th>
                  <th className="text-left px-5 py-4">Wallet Address</th>
                  <th className="text-left px-5 py-4">Amount</th>
                  <th className="text-left px-5 py-4">Date</th>
                  <th className="text-center px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredWithdraws.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-500">
                      No pending withdrawals found.
                    </td>
                  </tr>
                ) : (
                  filteredWithdraws.map((withdraw) => (
                    <tr
                      key={withdraw._id}
                      className="border-t border-zinc-800 hover:bg-zinc-800/40 transition"
                    >
                      <td className="px-5 py-4 font-bold text-white">
                        {withdraw.username}
                      </td>

                      <td className="px-5 py-4 text-cyan-400 text-sm break-all">
                        {withdraw.walletAddress}
                      </td>

                      <td className="px-5 py-4">
                        <span className="bg-orange-500/10 border border-orange-500 text-orange-400 px-3 py-2 rounded-lg font-bold">
                          {Number(withdraw.amount).toFixed(2)} USDT
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-300 text-sm">
                        {new Date(withdraw.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-center gap-2 flex-wrap">

                          <button
                            onClick={() => approveWithdraw(withdraw._id)}
                            className="bg-green-500 hover:bg-green-400 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>

                          <button
                            onClick={() => rejectWithdraw(withdraw._id)}
                            className="bg-red-500 hover:bg-red-400 text-black px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden p-5 space-y-4">
            {filteredWithdraws.map((withdraw) => (
              <div
                key={withdraw._id}
                className="bg-black border border-zinc-700 rounded-xl p-5 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-lg text-white">
                      {withdraw.username}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(withdraw.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase">Wallet Address</p>
                  <p className="text-cyan-400 text-sm break-all mt-1">
                    {withdraw.walletAddress}
                  </p>
                </div>

                <div className="bg-zinc-900 border border-orange-500 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">Withdraw Amount</p>
                  <h3 className="text-2xl font-black text-orange-400 mt-2">
                    {Number(withdraw.amount).toFixed(2)} USDT
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => approveWithdraw(withdraw._id)}
                    className="bg-green-500 hover:bg-green-400 text-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>

                  <button
                    onClick={() => rejectWithdraw(withdraw._id)}
                    className="bg-red-500 hover:bg-red-400 text-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ============================================= */}
        {/* PAGINATION */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 space-y-6">

          <div className="flex flex-wrap justify-between items-center gap-4">

            <div>
              <h2 className="text-2xl font-black text-cyan-400">
                USDT Deposit Pagination
              </h2>

              <p className="text-gray-400 text-sm mt-2">
                Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredDeposits.length)} of {filteredDeposits.length} deposits.
              </p>
            </div>

            <span className="bg-cyan-500/20 border border-cyan-500 text-cyan-400 px-4 py-2 rounded-full font-bold text-sm">
              Page {currentPage} / {totalPages}
            </span>

          </div>

          <div className="flex flex-wrap justify-center gap-2">

            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 font-bold"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-bold transition ${
                    currentPage === page
                      ? "bg-cyan-500 text-black"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              disabled={currentPage === totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(p + 1, totalPages))
              }
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 font-bold"
            >
              Next
            </button>

          </div>

        </section>

        {/* ============================================= */}
        {/* QUICK ACTIONS */}
        {/* ============================================= */}

        <section className="grid md:grid-cols-3 gap-5">

          <Link
            href="/admin/wallet"
            className="bg-zinc-900 border border-green-500 rounded-2xl p-6 hover:border-green-400 transition"
          >
            <Wallet className="text-green-400 mb-3" size={30} />

            <h3 className="font-black text-xl text-green-400">
              Wallet Manager
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Open PKR, Gold and USDT wallet management.
            </p>
          </Link>

          <Link
            href="/admin/gold"
            className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6 hover:border-yellow-400 transition"
          >
            <ShieldCheck className="text-yellow-400 mb-3" size={30} />

            <h3 className="font-black text-xl text-yellow-400">
              Gold Manager
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Manage Gold buy/sell market settings.
            </p>
          </Link>

          <Link
            href="/admin"
            className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6 hover:border-cyan-400 transition"
          >
            <DollarSign className="text-cyan-400 mb-3" size={30} />

            <h3 className="font-black text-xl text-cyan-400">
              Admin Dashboard
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              Return to GoldTrade Enterprise Dashboard.
            </p>
          </Link>

        </section>

        {/* ============================================= */}
        {/* SYSTEM SUMMARY */}
        {/* ============================================= */}

        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6 space-y-6">

          <h2 className="text-2xl font-black text-purple-400">
            USDT System Summary
          </h2>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-black border border-green-500 rounded-xl p-5 text-center">
              <p className="text-gray-500 text-xs uppercase">Buy Rate</p>
              <h3 className="text-2xl font-black text-green-400 mt-2">
                {settings.buyPrice}
              </h3>
            </div>

            <div className="bg-black border border-red-500 rounded-xl p-5 text-center">
              <p className="text-gray-500 text-xs uppercase">Sell Rate</p>
              <h3 className="text-2xl font-black text-red-400 mt-2">
                {settings.sellPrice}
              </h3>
            </div>

            <div className="bg-black border border-cyan-500 rounded-xl p-5 text-center">
              <p className="text-gray-500 text-xs uppercase">Pending Deposits</p>
              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                {analytics.pendingDeposits}
              </h3>
            </div>

            <div className="bg-black border border-orange-500 rounded-xl p-5 text-center">
              <p className="text-gray-500 text-xs uppercase">Pending Withdrawals</p>
              <h3 className="text-2xl font-black text-orange-400 mt-2">
                {analytics.pendingWithdraws}
              </h3>
            </div>

          </div>

        </section>

        {/* ============================================= */}
        {/* FOOTER */}
        {/* ============================================= */}

        <footer className="border-t border-zinc-800 pt-8 pb-6">

          <div className="grid md:grid-cols-3 gap-8">

            <div>
              <h3 className="text-lg font-black text-cyan-400 mb-3">
                GoldTrade V18 Enterprise
              </h3>

              <p className="text-gray-500 text-sm leading-6">
                Enterprise USDT management system for deposits, withdrawals, market pricing and trading controls.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-black text-green-400 mb-3">
                Admin Features
              </h3>

              <ul className="space-y-2 text-sm text-gray-500">
                <li>• Live Buy/Sell Rate</li>
                <li>• Trading Status</li>
                <li>• Deposit Approval</li>
                <li>• Withdraw Approval</li>
                <li>• Search Transactions</li>
                <li>• Mobile Responsive Dashboard</li>
                <li>• Pagination</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-black text-purple-400 mb-3">
                Market Status
              </h3>

              <div className="space-y-3 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-500">Trading</span>
                  <span
                    className={`font-bold ${
                      settings.tradingEnabled
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {settings.tradingEnabled ? "LIVE" : "OFFLINE"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Buy Price</span>
                  <span className="font-bold text-green-400">
                    PKR {settings.buyPrice}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">Sell Price</span>
                  <span className="font-bold text-red-400">
                    PKR {settings.sellPrice}
                  </span>
                </div>

              </div>
            </div>

          </div>

          <div className="border-t border-zinc-800 mt-8 pt-6 flex flex-wrap justify-between items-center gap-4">

            <p className="text-gray-500 text-sm">
              © 2026 GoldTrade V18 Enterprise Admin USDT Manager.
            </p>

            <button
              onClick={refreshDashboard}
              disabled={refreshing}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-700 disabled:cursor-not-allowed text-black px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
              {refreshing ? "Refreshing..." : "Refresh Dashboard"}
            </button>

          </div>

        </footer>

      </div>
    </main>
  );
}