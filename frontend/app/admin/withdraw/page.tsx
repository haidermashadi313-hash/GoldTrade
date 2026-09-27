"use client";

// ==========================================================
// GoldTrade V18 Enterprise
// ADMIN WITHDRAW MANAGER
// PART 1/10
// Production Ready (Render + Vercel + Linux)
// ==========================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getSession,
  logout,
  type GoldTradeUser,
} from "@/lib/auth";

import { API } from "@/lib/api";

import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  Search,
  Filter,
  DollarSign,
  Gem,
  Coins,
} from "lucide-react";

// ==========================================================
// TYPES
// ==========================================================

type WithdrawStatus = "pending" | "approved" | "rejected";
type WithdrawCurrency = "PKR" | "GOLD" | "USDT";

interface WithdrawRequest {
  _id: string;

  username: string;
  email?: string;

  currency: WithdrawCurrency;

  amount: number;

  walletAddress?: string;
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;

  status: WithdrawStatus;

  createdAt: string;
  updatedAt?: string;

  note?: string;
}

interface WithdrawStats {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  totalCount: number;

  pendingAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  totalAmount: number;
}

interface WithdrawResponse {
  success: boolean;
  message?: string;
  withdrawals?: WithdrawRequest[];
}

interface StatsResponse {
  success: boolean;
  message?: string;
  stats?: WithdrawStats;
}

// ==========================================================
// COMPONENT START
// ==========================================================

export default function AdminWithdrawPage() {
  const router = useRouter();

  // ========================================================
  // ADMIN SESSION
  // ========================================================

  const [admin, setAdmin] = useState<GoldTradeUser | null>(null);
  const [token, setToken] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  // ========================================================
  // UI STATE
  // ========================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error" | ""
  >("");

  // ========================================================
  // WITHDRAW DATA
  // ========================================================

  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);

  const [stats, setStats] = useState<WithdrawStats>({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalCount: 0,

    pendingAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0,
    totalAmount: 0,
  });

  // ========================================================
  // SEARCH + FILTER
  // ========================================================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<WithdrawStatus | "all">("all");

  const [currencyFilter, setCurrencyFilter] =
    useState<WithdrawCurrency | "all">("all");

  // ========================================================
  // PAGINATION
  // ========================================================

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // ========================================================
  // PAGE TITLE
  // ========================================================

  useEffect(() => {
    document.title =
      "Admin Withdraw Manager • GoldTrade V18 Enterprise";
  }, []);
    // ========================================================
  // NETWORK STATUS
  // ========================================================

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateNetworkStatus();

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  // ========================================================
  // ADMIN SESSION CHECK (JWT + ROLE)
  // ========================================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const session = getSession();

      if (!session || !session.token || !session.user) {
        logout();
        return;
      }

      if (session.user.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      setToken(session.token);
      setAdmin(session.user);
    } catch (error) {
      console.error("ADMIN SESSION ERROR:", error);
      logout();
    } finally {
      setCheckingSession(false);
    }
  }, [router]);

  // ========================================================
  // AUTH HEADERS
  // ========================================================

  const getHeaders = useCallback(() => {
    const session = getSession();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.token || token}`,
    };
  }, [token]);

  // ========================================================
  // FORMAT DATE
  // ========================================================

  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, []);

  // ========================================================
  // FORMAT AMOUNT
  // ========================================================

  const formatAmount = useCallback(
    (amount: number, currency: WithdrawCurrency) => {
      if (currency === "GOLD") {
        return `${Number(amount).toFixed(3)} g`;
      }

      if (currency === "USDT") {
        return `${Number(amount).toFixed(2)} USDT`;
      }

      return `PKR ${Number(amount).toLocaleString("en-PK", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    []
  );

  // ========================================================
  // STATUS COLOR
  // ========================================================

  const getStatusColor = useCallback((status: WithdrawStatus) => {
    switch (status) {
      case "approved":
        return "text-green-400 bg-green-500/10 border-green-500/30";

      case "rejected":
        return "text-red-400 bg-red-500/10 border-red-500/30";

      default:
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    }
  }, []);

  // ========================================================
  // STATUS ICON
  // ========================================================

  const getStatusIcon = useCallback((status: WithdrawStatus) => {
    switch (status) {
      case "approved":
        return CheckCircle;

      case "rejected":
        return XCircle;

      default:
        return Clock;
    }
  }, []);
    // =====================================================
  // LOAD WITHDRAW STATISTICS (V18 PRODUCTION FIX)
  // =====================================================

  const loadStatistics = useCallback(async () => {
    try {
      const session = getSession();

      if (!session?.token) {
        logout();
        return;
      }

      const response = await fetch(
        `${API}/api/gold/admin/withdraws/statistics`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const result: StatsResponse = await response.json();

      console.log("WITHDRAW STATS:", result);

      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load withdraw statistics."
        );
      }

      setStats(
        result.stats || {
          pendingCount: 0,
          approvedCount: 0,
          rejectedCount: 0,
          totalCount: 0,
          pendingAmount: 0,
          approvedAmount: 0,
          rejectedAmount: 0,
          totalAmount: 0,
        }
      );
    } catch (error: any) {
      console.error("LOAD STATS ERROR:", error);

      setStats({
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        totalCount: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        rejectedAmount: 0,
        totalAmount: 0,
      });

      setMessage(error.message || "Unable to load statistics.");
      setMessageType("error");
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (checkingSession) return;

    loadStatistics();
  }, [checkingSession, loadStatistics]);
    // =====================================================
  // LOAD ALL WITHDRAW REQUESTS (V18 PRODUCTION FIX)
  // =====================================================

  const loadWithdraws = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      const session = getSession();

      if (!session?.token) {
        logout();
        return;
      }

      const response = await fetch(
        `${API}/api/gold/admin/withdraws/all`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const result: WithdrawResponse = await response.json();

      console.log("WITHDRAW RESPONSE:", result);

      // Unauthorized
      if (response.status === 401) {
        logout();
        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load withdraw requests."
        );
      }

      setWithdraws(
        Array.isArray(result.withdrawals)
          ? result.withdrawals
          : []
      );

    } catch (error: any) {
      console.error("LOAD WITHDRAWS ERROR:", error);

      setWithdraws([]);

      setMessage(
        error.message || "Failed to load withdraw requests."
      );

      setMessageType("error");

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // =====================================================
  // LOAD DASHBOARD DATA
  // =====================================================

  useEffect(() => {
    if (checkingSession) return;

    loadStatistics();
    loadWithdraws();
  }, [checkingSession, loadStatistics, loadWithdraws]);

  // =====================================================
  // REFRESH PAGE
  // =====================================================

  const refreshWithdraws = useCallback(async () => {
    try {
      setRefreshing(true);
      setMessage("");
      setMessageType("");

      await Promise.all([
        loadStatistics(),
        loadWithdraws(),
      ]);

      setMessage("Withdraw manager refreshed successfully.");
      setMessageType("success");

    } catch (error: any) {
      console.error("REFRESH ERROR:", error);

      setMessage(error.message || "Refresh failed.");
      setMessageType("error");

    } finally {
      setRefreshing(false);
    }
  }, [loadStatistics, loadWithdraws]);

  // =====================================================
  // CLEAR SUCCESS / ERROR MESSAGE
  // =====================================================

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);
    // =====================================================
  // SEARCH + FILTERED WITHDRAW LIST
  // =====================================================

  const filteredWithdraws = useMemo(() => {
    return withdraws.filter((withdraw) => {
      const searchMatch =
        search.trim() === "" ||
        withdraw.username.toLowerCase().includes(search.toLowerCase()) ||
        withdraw.email?.toLowerCase().includes(search.toLowerCase()) ||
        withdraw.walletAddress?.toLowerCase().includes(search.toLowerCase()) ||
        withdraw.accountNumber?.includes(search);

      const statusMatch =
        statusFilter === "all" || withdraw.status === statusFilter;

      const currencyMatch =
        currencyFilter === "all" || withdraw.currency === currencyFilter;

      return searchMatch && statusMatch && currencyMatch;
    });
  }, [withdraws, search, statusFilter, currencyFilter]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredWithdraws.length / pageSize)
  );

  const paginatedWithdraws = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredWithdraws.slice(start, start + pageSize);
  }, [filteredWithdraws, currentPage]);

  // =====================================================
  // PAGE CHANGE
  // =====================================================

  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      setCurrentPage(page);
    },
    [totalPages]
  );

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  // =====================================================
  // RESET PAGE WHEN FILTER CHANGES
  // =====================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, currencyFilter]);

  // =====================================================
  // SUMMARY COUNTS
  // =====================================================

  const pendingWithdraws = useMemo(
    () => withdraws.filter((w) => w.status === "pending"),
    [withdraws]
  );

  const approvedWithdraws = useMemo(
    () => withdraws.filter((w) => w.status === "approved"),
    [withdraws]
  );

  const rejectedWithdraws = useMemo(
    () => withdraws.filter((w) => w.status === "rejected"),
    [withdraws]
  );

  // =====================================================
  // TOTAL AMOUNTS
  // =====================================================

  const pendingAmount = useMemo(
    () =>
      pendingWithdraws.reduce((sum, item) => sum + Number(item.amount), 0),
    [pendingWithdraws]
  );

  const approvedAmount = useMemo(
    () =>
      approvedWithdraws.reduce((sum, item) => sum + Number(item.amount), 0),
    [approvedWithdraws]
  );

  const rejectedAmount = useMemo(
    () =>
      rejectedWithdraws.reduce((sum, item) => sum + Number(item.amount), 0),
    [rejectedWithdraws]
  );

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
          <h2 className="text-xl font-bold text-yellow-400">
            Loading Withdraw Manager...
          </h2>
          <p className="mt-2 text-gray-500">
            Verifying administrator session...
          </p>
        </div>
      </main>
    );
  }

  // =====================================================
  // APPROVE WITHDRAW REQUEST (V18 PRODUCTION FIX)
  // =====================================================

  const approveWithdraw = useCallback(
    async (withdrawId: string) => {
      try {
        setRefreshing(true);
        setMessage("");
        setMessageType("");

        const session = getSession();

        if (!session?.token) {
          logout();
          return;
        }

        const response = await fetch(
          `${API}/api/gold/admin/withdraws/approve/${withdrawId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${session.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const result = await response.json();

        console.log("APPROVE RESPONSE:", result);

        if (response.status === 401) {
          logout();
          return;
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to approve withdraw.");
        }

        setMessage("Withdraw request approved successfully.");
        setMessageType("success");

        await Promise.all([
          loadStatistics(),
          loadWithdraws(),
        ]);
      } catch (error: any) {
        console.error("APPROVE ERROR:", error);

        setMessage(error.message || "Approval failed.");
        setMessageType("error");
      } finally {
        setRefreshing(false);
      }
    },
    [loadStatistics, loadWithdraws]
  );

  // =====================================================
  // REJECT WITHDRAW REQUEST (V18 PRODUCTION FIX)
  // =====================================================

  const rejectWithdraw = useCallback(
    async (withdrawId: string) => {
      try {
        setRefreshing(true);
        setMessage("");
        setMessageType("");

        const session = getSession();

        if (!session?.token) {
          logout();
          return;
        }

        const reason = window.prompt(
          "Enter rejection reason:",
          "Withdraw request rejected by admin."
        );

        if (reason === null) {
          setRefreshing(false);
          return;
        }

        const response = await fetch(
          `${API}/api/gold/admin/withdraws/reject/${withdrawId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${session.token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reason: reason.trim(),
            }),
          }
        );

        const result = await response.json();

        console.log("REJECT RESPONSE:", result);

        if (response.status === 401) {
          logout();
          return;
        }

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to reject withdraw.");
        }

        setMessage("Withdraw request rejected successfully.");
        setMessageType("success");

        await Promise.all([
          loadStatistics(),
          loadWithdraws(),
        ]);
      } catch (error: any) {
        console.error("REJECT ERROR:", error);

        setMessage(error.message || "Reject failed.");
        setMessageType("error");
      } finally {
        setRefreshing(false);
      }
    },
    [loadStatistics, loadWithdraws]
  );

  // =====================================================
  // MANUAL REFRESH
  // =====================================================

  const handleRefresh = useCallback(async () => {
    await refreshWithdraws();
  }, [refreshWithdraws]);      
  
// =====================================================
// PAGE UI STARTS HERE
// =====================================================

return (
  <main className="min-h-screen bg-black text-white">
    <div className="mx-auto max-w-7xl px-4 py-6">

      {/* ===================================================== */}
      {/* PAGE HEADER */}
      {/* ===================================================== */}

      <div className="mb-8 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <Link
                href="/admin/dashboard"
                className="rounded-xl bg-zinc-900 p-2 text-yellow-400 hover:bg-zinc-800"
              >
                <ArrowLeft size={20}/>
              </Link>

              <div>
                <h1 className="text-3xl font-bold text-yellow-400">
                  Withdraw Manager
                </h1>

                <p className="mt-1 text-gray-400">
                  GoldTrade V18 Enterprise Administration Panel
                </p>
              </div>

            </div>

            <p className="mt-4 text-sm text-gray-500">
              Logged in as{" "}
              <span className="font-semibold text-white">
                {admin?.username}
              </span>
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:opacity-50"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

        </div>

      </div>

      {/* ===================================================== */}
      {/* SUCCESS / ERROR MESSAGE */}
      {/* ===================================================== */}

      {message && (
        <div
          className={`mb-6 rounded-2xl border p-4 ${
            messageType === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {message}
        </div>
      )}

      {/* ===================================================== */}
      {/* NETWORK WARNING */}
      {/* ===================================================== */}

      {!isOnline && (
        <div className="mb-6 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 text-orange-400">
          No internet connection detected. Dashboard may not update.
        </div>
      )}

      {/* ===================================================== */}
      {/* STATISTICS CARDS */}
      {/* ===================================================== */}

      <section className="mb-8">

        <h2 className="mb-5 text-2xl font-bold text-white">
          Withdraw Overview
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {/* Pending */}

          <div className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <Clock className="text-yellow-400" size={28}/>
              <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
                Pending
              </span>
            </div>

            <p className="mt-4 text-sm text-gray-400">
              Pending Requests
            </p>

            <h3 className="mt-2 text-3xl font-bold text-yellow-400">
              {stats.pendingCount}
            </h3>

            <p className="mt-2 text-xs text-gray-500">
              PKR {stats.pendingAmount.toLocaleString()}
            </p>
          </div>

          {/* Approved */}

          <div className="rounded-3xl border border-green-500/20 bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <CheckCircle className="text-green-400" size={28}/>
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">
                Approved
              </span>
            </div>

            <p className="mt-4 text-sm text-gray-400">
              Approved Requests
            </p>

            <h3 className="mt-2 text-3xl font-bold text-green-400">
              {stats.approvedCount}
            </h3>

            <p className="mt-2 text-xs text-gray-500">
              PKR {stats.approvedAmount.toLocaleString()}
            </p>
          </div>

          {/* Rejected */}

          <div className="rounded-3xl border border-red-500/20 bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <XCircle className="text-red-400" size={28}/>
              <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-400">
                Rejected
              </span>
            </div>

            <p className="mt-4 text-sm text-gray-400">
              Rejected Requests
            </p>

            <h3 className="mt-2 text-3xl font-bold text-red-400">
              {stats.rejectedCount}
            </h3>

            <p className="mt-2 text-xs text-gray-500">
              PKR {stats.rejectedAmount.toLocaleString()}
            </p>
          </div>

          {/* Total */}

          <div className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <Wallet className="text-blue-400" size={28}/>
              <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
                Total
              </span>
            </div>

            <p className="mt-4 text-sm text-gray-400">
              Total Withdraw Volume
            </p>

            <h3 className="mt-2 text-3xl font-bold text-blue-400">
              {stats.totalCount}
            </h3>

            <p className="mt-2 text-xs text-gray-500">
              PKR {stats.totalAmount.toLocaleString()}
            </p>
          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* SEARCH + FILTERS */}
      {/* ===================================================== */}

      <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

        <div className="mb-6 flex items-center gap-3">
          <Filter className="text-yellow-400" size={22}/>
          <h2 className="text-xl font-bold text-white">
            Search & Filters
          </h2>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Search User / Wallet
            </label>

            <div className="relative">

              <Search
                className="absolute left-3 top-3 text-gray-500"
                size={18}
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Username, Email, Wallet..."
                className="w-full rounded-xl border border-zinc-700 bg-black py-3 pl-10 pr-4 text-white outline-none focus:border-yellow-400"
              />

            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Withdraw Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-gray-400">
              Currency
            </label>

            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value as any)}
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
            >
              <option value="all">All Currency</option>
              <option value="PKR">PKR</option>
              <option value="USDT">USDT</option>
              <option value="GOLD">GOLD</option>
            </select>
          </div>

        </div>

      </section>      {/* ===================================================== */}
      {/* WITHDRAW REQUESTS TABLE */}
      {/* PART 2/5 */}
      {/* ===================================================== */}

      <section className="mb-8">

        <div className="mb-5 flex items-center justify-between">

          <h2 className="text-2xl font-bold text-white">
            Withdraw Requests
          </h2>

          <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-gray-300">
            {filteredWithdraws.length} Requests
          </span>

        </div>

        <div className="overflow-x-auto rounded-3xl border border-zinc-800 bg-zinc-950">

          <table className="min-w-full text-sm">

            <thead className="bg-zinc-900 text-gray-400">

              <tr>
                <th className="px-5 py-4 text-left">User</th>
                <th className="px-5 py-4 text-left">Currency</th>
                <th className="px-5 py-4 text-left">Amount</th>
                <th className="px-5 py-4 text-left">Wallet / Bank</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Date</th>
                <th className="px-5 py-4 text-center">Actions</th>
              </tr>

            </thead>

            <tbody>

              {paginatedWithdraws.length === 0 ? (

                <tr>

                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No withdraw requests found.
                  </td>

                </tr>

              ) : (

                paginatedWithdraws.map((withdraw) => {

                  const StatusIcon = getStatusIcon(withdraw.status);

                  return (

                    <tr
                      key={withdraw._id}
                      className="border-t border-zinc-800 transition hover:bg-zinc-900/40"
                    >

                      {/* USER */}

                      <td className="px-5 py-4 align-top">

                        <p className="font-semibold text-white">
                          {withdraw.username}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {withdraw.email || "No Email"}
                        </p>

                      </td>

                      {/* CURRENCY */}

                      <td className="px-5 py-4 align-top">

                        <div className="flex items-center gap-2">

                          {withdraw.currency === "PKR" && (
                            <DollarSign
                              size={18}
                              className="text-green-400"
                            />
                          )}

                          {withdraw.currency === "USDT" && (
                            <Coins
                              size={18}
                              className="text-cyan-400"
                            />
                          )}

                          {withdraw.currency === "GOLD" && (
                            <Gem
                              size={18}
                              className="text-yellow-400"
                            />
                          )}

                          <span className="font-medium text-white">
                            {withdraw.currency}
                          </span>

                        </div>

                      </td>

                      {/* AMOUNT */}

                      <td className="px-5 py-4 align-top">

                        <span className="font-semibold text-yellow-400">
                          {formatAmount(
                            withdraw.amount,
                            withdraw.currency
                          )}
                        </span>

                      </td>

                      {/* WALLET / BANK */}

                      <td className="px-5 py-4 align-top">

                        {withdraw.currency === "PKR" ? (

                          <div className="space-y-1">

                            <p className="font-medium text-white">
                              {withdraw.bankName || "Bank Not Available"}
                            </p>

                            <p className="text-xs text-gray-400">
                              {withdraw.accountTitle || "Account Title"}
                            </p>

                            <p className="text-xs text-gray-500">
                              {withdraw.accountNumber || "Account Number"}
                            </p>

                          </div>

                        ) : (

                          <div className="space-y-1">

                            <p className="font-medium text-white">
                              Wallet Address
                            </p>

                            <p className="max-w-[220px] truncate text-xs text-gray-400">
                              {withdraw.walletAddress || "Wallet Not Available"}
                            </p>

                          </div>

                        )}

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4 align-top">

                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusColor(
                            withdraw.status
                          )}`}
                        >

                          <StatusIcon size={14}/>

                          {withdraw.status.toUpperCase()}

                        </span>

                      </td>

                      {/* DATE */}

                      <td className="px-5 py-4 align-top text-gray-400">

                        {formatDate(withdraw.createdAt)}

                      </td>

                      {/* ACTION BUTTONS */}

                      <td className="px-5 py-4 align-top">

                        {withdraw.status === "pending" ? (

                          <div className="flex items-center justify-center gap-2">
                                                        <button
                              onClick={() => approveWithdraw(withdraw._id)}
                              disabled={refreshing}
                              className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Approve
                            </button>

                            <button
                              onClick={() => rejectWithdraw(withdraw._id)}
                              disabled={refreshing}
                              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Reject
                            </button>

                          </div>

                        ) : (
                          <div className="text-center text-xs font-medium text-gray-500">
                            Completed
                          </div>
                        )}

                      </td>

                    </tr>

                  );
                })

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ===================================================== */}
      {/* TABLE SUMMARY */}
      {/* ===================================================== */}

      <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl bg-yellow-500/10 p-5">
            <p className="text-xs uppercase tracking-wide text-yellow-300">
              Pending Requests
            </p>

            <h3 className="mt-2 text-2xl font-bold text-yellow-400">
              {pendingWithdraws.length}
            </h3>
          </div>

          <div className="rounded-2xl bg-green-500/10 p-5">
            <p className="text-xs uppercase tracking-wide text-green-300">
              Approved Requests
            </p>

            <h3 className="mt-2 text-2xl font-bold text-green-400">
              {approvedWithdraws.length}
            </h3>
          </div>

          <div className="rounded-2xl bg-red-500/10 p-5">
            <p className="text-xs uppercase tracking-wide text-red-300">
              Rejected Requests
            </p>

            <h3 className="mt-2 text-2xl font-bold text-red-400">
              {rejectedWithdraws.length}
            </h3>
          </div>

          <div className="rounded-2xl bg-blue-500/10 p-5">
            <p className="text-xs uppercase tracking-wide text-blue-300">
              Total Requests
            </p>

            <h3 className="mt-2 text-2xl font-bold text-blue-400">
              {filteredWithdraws.length}
            </h3>
          </div>

        </div>

      </section>      {/* ===================================================== */}
      {/* PAGINATION */}
      {/* PART 4/5 */}
      {/* ===================================================== */}

      <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          {/* Left Side */}

          <div>

            <h3 className="text-lg font-bold text-white">
              Pagination
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              Showing{" "}
              <span className="font-semibold text-yellow-400">
                {paginatedWithdraws.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-yellow-400">
                {filteredWithdraws.length}
              </span>{" "}
              withdraw requests.
            </p>

          </div>

          {/* Right Side */}

          <div className="flex items-center gap-3">

            <button
              onClick={previousPage}
              disabled={currentPage === 1}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-white transition hover:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <div className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-bold text-black">
              Page {currentPage} / {totalPages}
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-white transition hover:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>

          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* WITHDRAW SUMMARY */}
      {/* ===================================================== */}

      <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-2xl font-bold text-white">
            Withdraw Summary
          </h2>

          <span className="rounded-full bg-yellow-500/10 px-3 py-1 text-sm text-yellow-400">
            Enterprise Overview
          </span>

        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          {/* Pending */}

          <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">

            <p className="text-xs uppercase tracking-wide text-yellow-300">
              Pending Amount
            </p>

            <h3 className="mt-2 text-2xl font-bold text-yellow-400">
              PKR {pendingAmount.toLocaleString()}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {pendingWithdraws.length} pending requests
            </p>

          </div>

          {/* Approved */}

          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">

            <p className="text-xs uppercase tracking-wide text-green-300">
              Approved Amount
            </p>

            <h3 className="mt-2 text-2xl font-bold text-green-400">
              PKR {approvedAmount.toLocaleString()}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {approvedWithdraws.length} approved requests
            </p>

          </div>

          {/* Rejected */}

          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">

            <p className="text-xs uppercase tracking-wide text-red-300">
              Rejected Amount
            </p>

            <h3 className="mt-2 text-2xl font-bold text-red-400">
              PKR {rejectedAmount.toLocaleString()}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {rejectedWithdraws.length} rejected requests
            </p>

          </div>

          {/* Total */}

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

            <p className="text-xs uppercase tracking-wide text-blue-300">
              Total Withdraw Volume
            </p>

            <h3 className="mt-2 text-2xl font-bold text-blue-400">
              PKR {stats.totalAmount.toLocaleString()}
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              {stats.totalCount} total requests
            </p>

          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* ENTERPRISE ANALYTICS */}
      {/* ===================================================== */}

      <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-2xl font-bold text-white">
            Enterprise Analytics
          </h2>

          <span className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-gray-300">
            Live Overview
          </span>

        </div>

        <div className="grid gap-5 lg:grid-cols-3">

          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5">

            <p className="text-xs uppercase tracking-wide text-gray-500">
              Pending Withdrawals
            </p>

            <h3 className="mt-3 text-3xl font-bold text-yellow-400">
              {pendingWithdraws.length}
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Awaiting admin approval.
            </p>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5">

            <p className="text-xs uppercase tracking-wide text-gray-500">
              Approved Withdrawals
            </p>

            <h3 className="mt-3 text-3xl font-bold text-green-400">
              {approvedWithdraws.length}
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Successfully processed withdrawals.
            </p>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-black/40 p-5">

            <p className="text-xs uppercase tracking-wide text-gray-500">
              Total Withdraw Requests
            </p>

            <h3 className="mt-3 text-3xl font-bold text-blue-400">
              {filteredWithdraws.length}
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              All PKR, USDT and GOLD withdrawal requests.
            </p>

          </div>

        </div>

      </section>      {/* ===================================================== */}
      {/* ADMIN NAVIGATION */}
      {/* ===================================================== */}

      <section className="mb-8 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

        <h2 className="mb-6 text-2xl font-bold text-yellow-400">
          Admin Navigation
        </h2>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

          {[
            {
              title: "Dashboard",
              href: "/admin/dashboard",
            },
            {
              title: "Deposits",
              href: "/admin/deposits",
            },
            {
              title: "Wallet Manager",
              href: "/admin/wallet",
            },
            {
              title: "Transactions",
              href: "/admin/transactions",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-zinc-700 bg-black/40 p-4 text-center font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-400"
            >
              {item.title}
            </Link>
          ))}

        </div>

      </section>

      {/* ===================================================== */}
      {/* FOOTER */}
      {/* ===================================================== */}

      <footer className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h2 className="text-xl font-bold text-yellow-400">
              GoldTrade V18 Enterprise
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              Withdraw Management Center • Production Edition
            </p>

            <p className="mt-1 text-xs text-gray-600">
              Render Backend • Vercel Frontend • MongoDB Atlas • JWT Secure
            </p>

          </div>

          <div className="text-sm text-gray-400 lg:text-right">

            <p>
              Administrator:{" "}
              <span className="font-semibold text-white">
                {admin?.username || "Admin"}
              </span>
            </p>

            <p className="mt-1">
              Total Requests:{" "}
              <span className="font-semibold text-yellow-400">
                {stats.totalCount}
              </span>
            </p>

            <p className="mt-1">
              Pending Requests:{" "}
              <span className="font-semibold text-orange-400">
                {stats.pendingCount}
              </span>
            </p>

          </div>

        </div>

        <div className="my-6 border-t border-zinc-800"></div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-xl bg-black/40 p-4">
            <p className="text-xs uppercase text-gray-500">
              Pending
            </p>

            <p className="mt-2 text-lg font-bold text-yellow-400">
              {pendingWithdraws.length}
            </p>
          </div>

          <div className="rounded-xl bg-black/40 p-4">
            <p className="text-xs uppercase text-gray-500">
              Approved
            </p>

            <p className="mt-2 text-lg font-bold text-green-400">
              {approvedWithdraws.length}
            </p>
          </div>

          <div className="rounded-xl bg-black/40 p-4">
            <p className="text-xs uppercase text-gray-500">
              Rejected
            </p>

            <p className="mt-2 text-lg font-bold text-red-400">
              {rejectedWithdraws.length}
            </p>
          </div>

          <div className="rounded-xl bg-black/40 p-4">
            <p className="text-xs uppercase text-gray-500">
              Total Volume
            </p>

            <p className="mt-2 text-lg font-bold text-blue-400">
              PKR {stats.totalAmount.toLocaleString()}
            </p>
          </div>

        </div>

        <div className="mt-8 border-t border-zinc-800 pt-5 text-center">

          <p className="text-sm text-gray-500">
            © 2026 GoldTrade V18 Enterprise. All Rights Reserved.
          </p>

          <p className="mt-2 text-xs text-gray-600">
            Version 18.0.0 • Withdraw Manager • Production Ready
          </p>

        </div>

      </footer>

    </div>
  </main>
);
}