// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/admin/page.tsx
// SECTION 1/10
// IMPORTS + TYPES + ADMIN STATES
// =====================================================

"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Shield,
  Gift,
  Users,
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Save,
  Settings,
  Bell,
  UserCheck,
  UserX,
  BadgeCheck,
  AlertTriangle,
  Activity,
  BarChart3,
  Database,
  Eye,
  Filter,
  Calendar,
  LogOut,
  Globe,
  KeyRound,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Download,
  Upload,
  Trash2,
  Pencil,
  PlusCircle,
  Lock,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

// =====================================================
// TYPES
// =====================================================

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingKyc: number;
  blockedUsers: number;

  totalDeposits: number;
  pendingDeposits: number;
  approvedDeposits: number;

  totalWithdrawals: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;

  todayRevenue: number;
  totalRevenue: number;

  liveGoldPrice: number;
  usdRate: number;
}

interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;

  country: string;
  city: string;

  walletBalance: number;
  goldBalance: number;

  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  accountStatus: "ACTIVE" | "BLOCKED";

  createdAt: string;
}

interface DepositRequest {
  _id: string;

  userName: string;
  email: string;

  amount: number;
  paymentMethod: string;

  screenshot: string;

  status: "PENDING" | "APPROVED" | "REJECTED";

  createdAt: string;
}

interface WithdrawalRequest {
  _id: string;

  userName: string;
  email: string;

  amount: number;
  paymentMethod: string;

  accountTitle: string;
  accountNumber: string;

  status: "PENDING" | "APPROVED" | "REJECTED";

  createdAt: string;
}

interface GoldPriceControl {
  buyPrice: number;
  sellPrice: number;
  usdRate: number;

  lastUpdated: string;
}

interface ReferralStats {
  totalReferralBonus: number;
  paidReferralBonus: number;
  pendingReferralBonus: number;
}

interface ActivityLog {
  _id: string;

  action: string;
  user: string;

  ip: string;

  createdAt: string;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AdminPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  // ================= STATES =================

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingKyc: 0,
    blockedUsers: 0,

    totalDeposits: 0,
    pendingDeposits: 0,
    approvedDeposits: 0,

    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    approvedWithdrawals: 0,

    todayRevenue: 0,
    totalRevenue: 0,

    liveGoldPrice: 0,
    usdRate: 0,
  });

  const [users, setUsers] = useState<AdminUser[]>([]);

  const [depositRequests, setDepositRequests] = useState<
    DepositRequest[]
  >([]);

  const [withdrawRequests, setWithdrawRequests] = useState<
    WithdrawalRequest[]
  >([]);

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [goldControl, setGoldControl] =
    useState<GoldPriceControl>({
      buyPrice: 0,
      sellPrice: 0,
      usdRate: 0,
      lastUpdated: "",
    });

  const [referralStats, setReferralStats] =
    useState<ReferralStats>({
      totalReferralBonus: 0,
      paidReferralBonus: 0,
      pendingReferralBonus: 0,
    });

  // ================= FILTERS =================

  const [searchUser, setSearchUser] = useState("");

  const [kycFilter, setKycFilter] = useState("ALL");

  const [depositFilter, setDepositFilter] = useState("PENDING");

  const [withdrawFilter, setWithdrawFilter] = useState("PENDING");

  const [selectedUser, setSelectedUser] =
    useState<AdminUser | null>(null);

  const [showUserModal, setShowUserModal] = useState(false);

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ================= SUMMARY =================

  const pendingApprovals = useMemo(() => {
    return (
      stats.pendingDeposits +
      stats.pendingWithdrawals +
      stats.pendingKyc
    );
  }, [stats]);

  const verifiedPercentage = useMemo(() => {
    if (stats.totalUsers === 0) return 0;

    return Math.round(
      (stats.verifiedUsers / stats.totalUsers) * 100
    );
  }, [stats]);

  const activeUsers = useMemo(() => {
    return stats.totalUsers - stats.blockedUsers;
  }, [stats]);

  const totalTransactions = useMemo(() => {
    return stats.totalDeposits + stats.totalWithdrawals;
  }, [stats]);

  const totalPendingAmount = useMemo(() => {
    return (
      stats.pendingDeposits +
      stats.pendingWithdrawals
    );
  }, [stats]);

// ================= NEXT SECTION STARTS HERE =================// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/admin/page.tsx
// SECTION 2/10
// ADMIN AUTH + API FUNCTIONS + DASHBOARD DATA LOADING
// =====================================================

  /* ==========================================================
     ADMIN AUTHENTICATION
  ========================================================== */

  const adminHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const checkAdminAccess = async () => {
    try {
      const response = await fetch(`${API}/api/admin/auth/check`, {
        headers: adminHeaders,
      });

      if (!response.ok) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const data = await response.json();

      if (!data.success || data.role !== "SUPER_ADMIN") {
        alert("Unauthorized Admin Access");
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Admin Auth Error:", error);
      window.location.href = "/login";
    }
  };

  /* ==========================================================
     LOAD DASHBOARD STATISTICS
  ========================================================== */

  const loadDashboardStats = async () => {
    try {
      const response = await fetch(`${API}/api/admin/dashboard`, {
        headers: adminHeaders,
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setReferralStats(data.referrals);
        setGoldControl(data.goldPrice);
      }
    } catch (error) {
      console.error("Dashboard Stats Error:", error);
    }
  };

  /* ==========================================================
     LOAD USERS
  ========================================================== */

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API}/api/admin/users`, {
        headers: adminHeaders,
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Users Error:", error);
    }
  };

  /* ==========================================================
     LOAD DEPOSITS
  ========================================================== */

  const loadDeposits = async () => {
    try {
      const response = await fetch(`${API}/api/admin/deposits`, {
        headers: adminHeaders,
      });

      const data = await response.json();

      if (data.success) {
        setDepositRequests(data.deposits);
      }
    } catch (error) {
      console.error("Deposits Error:", error);
    }
  };

  /* ==========================================================
     LOAD WITHDRAWALS
  ========================================================== */

  const loadWithdrawals = async () => {
    try {
      const response = await fetch(`${API}/api/admin/withdrawals`, {
        headers: adminHeaders,
      });

      const data = await response.json();

      if (data.success) {
        setWithdrawRequests(data.withdrawals);
      }
    } catch (error) {
      console.error("Withdrawals Error:", error);
    }
  };

  /* ==========================================================
     LOAD ACTIVITY LOGS
  ========================================================== */

  const loadActivityLogs = async () => {
    try {
      const response = await fetch(`${API}/api/admin/activity`, {
        headers: adminHeaders,
      });

      const data = await response.json();

      if (data.success) {
        setActivityLogs(data.logs);
      }
    } catch (error) {
      console.error("Activity Logs Error:", error);
    }
  };

  /* ==========================================================
     REFRESH COMPLETE DASHBOARD
  ========================================================== */

  const refreshDashboard = async () => {
    try {
      setLoading(true);

      await Promise.all([
        loadDashboardStats(),
        loadUsers(),
        loadDeposits(),
        loadWithdrawals(),
        loadActivityLogs(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    checkAdminAccess();
    refreshDashboard();
  }, []);

  /* ==========================================================
     SEARCH USERS
  ========================================================== */

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = searchUser.toLowerCase();

      const matchesSearch =
        user.fullName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword) ||
        user.phone.includes(keyword);

      const matchesKyc =
        kycFilter === "ALL"
          ? true
          : user.kycStatus === kycFilter;

      return matchesSearch && matchesKyc;
    });
  }, [users, searchUser, kycFilter]);

  /* ==========================================================
     FILTER DEPOSITS
  ========================================================== */

  const filteredDeposits = useMemo(() => {
    if (depositFilter === "ALL") return depositRequests;

    return depositRequests.filter(
      (item) => item.status === depositFilter
    );
  }, [depositRequests, depositFilter]);

  /* ==========================================================
     FILTER WITHDRAWALS
  ========================================================== */

  const filteredWithdrawals = useMemo(() => {
    if (withdrawFilter === "ALL") return withdrawRequests;

    return withdrawRequests.filter(
      (item) => item.status === withdrawFilter
    );
  }, [withdrawRequests, withdrawFilter]);

  /* ==========================================================
     USER MODAL
  ========================================================== */

  const openUserModal = (user: AdminUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setSelectedUser(null);
    setShowUserModal(false);
  };

// ================= NEXT SECTION STARTS HERE =================// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/admin/page.tsx
// SECTION 3/10
// ADMIN HEADER + LIVE DASHBOARD + REVENUE + GOLD PRICE
// =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={28} />
        Loading GoldTrade Admin Dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* ================= ADMIN HEADER ================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">

          <div>

            <h1 className="text-5xl font-black text-yellow-400 flex items-center gap-3">
              <Shield size={42} />
              GoldTrade Admin Panel
            </h1>

            <p className="text-gray-400 mt-2">
              Enterprise Super Admin Dashboard • Pakistan Digital Gold Trading Platform
            </p>

          </div>

          <div className="flex gap-3 flex-wrap">

            <button
              onClick={refreshDashboard}
              disabled={loading}
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
              Refresh Dashboard
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="bg-red-600 hover:bg-red-500 px-5 py-3 rounded-xl font-bold flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>

        </div>

        {/* ================= LIVE STATUS BAR ================= */}

        <div className="bg-gradient-to-r from-yellow-900 via-black to-yellow-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="text-center">

              <p className="text-gray-400 text-sm">Live Gold Buy Price</p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                PKR {goldControl.buyPrice.toLocaleString()}
              </h3>

            </div>

            <div className="text-center">

              <p className="text-gray-400 text-sm">Live Gold Sell Price</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR {goldControl.sellPrice.toLocaleString()}
              </h3>

            </div>

            <div className="text-center">

              <p className="text-gray-400 text-sm">USD / PKR Rate</p>

              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                {goldControl.usdRate}
              </h3>

            </div>

            <div className="text-center">

              <p className="text-gray-400 text-sm">Last Updated</p>

              <h3 className="text-lg font-black text-orange-400 mt-2">
                {goldControl.lastUpdated || "Live"}
              </h3>

            </div>

          </div>

        </div>

        {/* ================= DASHBOARD STATS ================= */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

          <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6">

            <Users className="text-blue-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">Total Users</p>

            <h3 className="text-4xl font-black text-blue-400 mt-2">
              {stats.totalUsers.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

            <BadgeCheck className="text-green-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">Verified Users</p>

            <h3 className="text-4xl font-black text-green-400 mt-2">
              {stats.verifiedUsers.toLocaleString()}
            </h3>

            <p className="text-green-300 text-sm mt-3">
              {verifiedPercentage}% Verified
            </p>

          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

            <Clock className="text-yellow-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">Pending KYC</p>

            <h3 className="text-4xl font-black text-yellow-400 mt-2">
              {stats.pendingKyc}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">

            <UserX className="text-red-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">Blocked Users</p>

            <h3 className="text-4xl font-black text-red-400 mt-2">
              {stats.blockedUsers}
            </h3>

          </div>

        </div>

        {/* ================= REVENUE STATS ================= */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

            <DollarSign className="text-green-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">Today's Revenue</p>

            <h3 className="text-3xl font-black text-green-400 mt-2">
              PKR {stats.todayRevenue.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6">

            <TrendingUp className="text-cyan-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">Total Revenue</p>

            <h3 className="text-3xl font-black text-cyan-400 mt-2">
              PKR {stats.totalRevenue.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6">

            <Banknote className="text-blue-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">Total Deposits</p>

            <h3 className="text-3xl font-black text-blue-400 mt-2">
              PKR {stats.totalDeposits.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">

            <ArrowDownRight className="text-red-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">Total Withdrawals</p>

            <h3 className="text-3xl font-black text-red-400 mt-2">
              PKR {stats.totalWithdrawals.toLocaleString()}
            </h3>

          </div>

        </div>

        {/* ================= TRANSACTION OVERVIEW ================= */}

        <div className="grid lg:grid-cols-2 gap-6 mb-10">

          <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-6">

              <Activity className="text-purple-400" size={28} />

              <h2 className="text-2xl font-black text-purple-400">
                Pending Approvals
              </h2>

            </div>

            <div className="space-y-5">

              <div className="flex justify-between items-center">

                <span className="text-gray-400">
                  Pending Deposits
                </span>

                <span className="font-black text-yellow-400 text-xl">
                  {stats.pendingDeposits}
                </span>

              </div>

              <div className="flex justify-between items-center">

                <span className="text-gray-400">
                  Pending Withdrawals
                </span>

                <span className="font-black text-red-400 text-xl">
                  {stats.pendingWithdrawals}
                </span>

              </div>

              <div className="flex justify-between items-center">

                <span className="text-gray-400">
                  Pending KYC Requests
                </span>

                <span className="font-black text-blue-400 text-xl">
                  {stats.pendingKyc}
                </span>

              </div>

              <div className="border-t border-zinc-700 pt-4 flex justify-between items-center">

                <span className="font-bold">
                  Total Pending
                </span>

                <span className="font-black text-orange-400 text-2xl">
                  {pendingApprovals}
                </span>

              </div>

            </div>

          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-6">

              <BarChart3 className="text-orange-400" size={28} />

              <h2 className="text-2xl font-black text-orange-400">
                Platform Overview
              </h2>

            </div>

            <div className="space-y-5">

              <div className="flex justify-between items-center">

                <span className="text-gray-400">
                  Active Users
                </span>

                <span className="font-black text-green-400 text-xl">
                  {activeUsers}
                </span>

              </div>

              <div className="flex justify-between items-center">

                <span className="text-gray-400">
                  Total Transactions
                </span>

                <span className="font-black text-cyan-400 text-xl">
                  {totalTransactions}
                </span>

              </div>

              <div className="flex justify-between items-center">

                <span className="text-gray-400">
                  Pending Amount
                </span>

                <span className="font-black text-yellow-400 text-xl">
                  PKR {totalPendingAmount.toLocaleString()}
                </span>

              </div>

              <div className="flex justify-between items-center">

                <span className="text-gray-400">
                  Live Gold Price
                </span>

                <span className="font-black text-yellow-400 text-xl">
                  PKR {stats.liveGoldPrice.toLocaleString()}
                </span>

              </div>

            </div>

          </div>

        </div>

        {/* ================= QUICK ADMIN ACTIONS ================= */}

        <div className="bg-zinc-900 border border-indigo-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Settings className="text-indigo-400" size={28} />

            <h2 className="text-2xl font-black text-indigo-400">
              Quick Admin Actions
            </h2>

          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <button className="bg-green-600 hover:bg-green-500 rounded-2xl p-5 font-black flex flex-col items-center gap-3">
              <UserCheck size={30} />
              Approve KYC
            </button>

            <button className="bg-blue-600 hover:bg-blue-500 rounded-2xl p-5 font-black flex flex-col items-center gap-3">
              <CreditCard size={30} />
              Review Deposits
            </button>

            <button className="bg-red-600 hover:bg-red-500 rounded-2xl p-5 font-black flex flex-col items-center gap-3">
              <Wallet size={30} />
              Review Withdrawals
            </button>

            <button className="bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl p-5 font-black flex flex-col items-center gap-3">
              <Coins size={30} />
              Update Gold Price
            </button>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/admin/page.tsx
// SECTION 4/10
// USER MANAGEMENT + SEARCH + KYC + BLOCK/UNBLOCK + WALLET EDIT
// =====================================================

        {/* ================= USER MANAGEMENT HEADER ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-3 mb-2">
                <Users className="text-blue-400" size={30} />

                <h2 className="text-3xl font-black text-blue-400">
                  User Management
                </h2>
              </div>

              <p className="text-gray-400">
                Search users, verify KYC, block accounts and manage wallet balances.
              </p>

            </div>

            <div className="text-right">

              <p className="text-gray-400 text-sm">
                Total Active Users
              </p>

              <h3 className="text-3xl font-black text-green-400">
                {activeUsers.toLocaleString()}
              </h3>

            </div>

          </div>

        </div>

        {/* ================= SEARCH & FILTER ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-8">

          <div className="grid lg:grid-cols-3 gap-5">

            {/* Search */}

            <div className="relative">

              <Search
                className="absolute left-4 top-3 text-gray-500"
                size={20}
              />

              <input
                type="text"
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Search by name, email or phone..."
                className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-cyan-500 outline-none"
              />

            </div>

            {/* KYC Filter */}

            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none"
            >
              <option value="ALL">All KYC Status</option>
              <option value="PENDING">Pending KYC</option>
              <option value="VERIFIED">Verified KYC</option>
              <option value="REJECTED">Rejected KYC</option>
            </select>

            {/* Refresh */}

            <button
              onClick={loadUsers}
              className="bg-cyan-600 hover:bg-cyan-500 rounded-xl py-3 font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh Users
            </button>

          </div>

        </div>

        {/* ================= USERS TABLE ================= */}

        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-4 mb-10 overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead className="text-gray-400 text-sm border-b border-zinc-700">

              <tr>
                <th className="text-left py-4 px-3">User</th>
                <th className="text-left py-4 px-3">Wallet</th>
                <th className="text-left py-4 px-3">Gold</th>
                <th className="text-left py-4 px-3">KYC</th>
                <th className="text-left py-4 px-3">Status</th>
                <th className="text-left py-4 px-3">Joined</th>
                <th className="text-center py-4 px-3">Actions</th>
              </tr>

            </thead>

            <tbody>

              {filteredUsers.map((user) => (

                <tr
                  key={user._id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/50"
                >

                  <td className="py-4 px-3">

                    <div>

                      <p className="font-bold text-white">
                        {user.fullName}
                      </p>

                      <p className="text-gray-400 text-sm">
                        {user.email}
                      </p>

                      <p className="text-gray-500 text-xs">
                        {user.phone}
                      </p>

                    </div>

                  </td>

                  <td className="py-4 px-3 text-green-400 font-bold">
                    PKR {user.walletBalance.toLocaleString()}
                  </td>

                  <td className="py-4 px-3 text-yellow-400 font-bold">
                    {user.goldBalance.toFixed(4)} g
                  </td>

                  <td className="py-4 px-3">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.kycStatus === "VERIFIED"
                          ? "bg-green-600"
                          : user.kycStatus === "PENDING"
                          ? "bg-yellow-500 text-black"
                          : "bg-red-600"
                      }`}
                    >
                      {user.kycStatus}
                    </span>

                  </td>

                  <td className="py-4 px-3">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.accountStatus === "ACTIVE"
                          ? "bg-green-600"
                          : "bg-red-600"
                      }`}
                    >
                      {user.accountStatus}
                    </span>

                  </td>

                  <td className="py-4 px-3 text-gray-400 text-sm">
                    {new Date(user.createdAt).toLocaleDateString("en-PK")}
                  </td>

                  <td className="py-4 px-3">

                    <div className="flex gap-2 justify-center flex-wrap">

                      <button
                        onClick={() => openUserModal(user)}
                        className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg"
                      >
                        <Eye size={18} />
                      </button>

                      <button className="bg-green-600 hover:bg-green-500 p-2 rounded-lg">
                        <BadgeCheck size={18} />
                      </button>

                      <button className="bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-lg">
                        <Pencil size={18} />
                      </button>

                      <button className="bg-red-600 hover:bg-red-500 p-2 rounded-lg">
                        <UserX size={18} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {/* ================= USER DETAILS MODAL ================= */}

        {showUserModal && selectedUser && (

          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-5">

            <div className="bg-zinc-900 border border-blue-600 rounded-3xl w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto">

              <div className="flex justify-between items-center mb-6">

                <h2 className="text-3xl font-black text-blue-400">
                  User Details
                </h2>

                <button
                  onClick={closeUserModal}
                  className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-lg"
                >
                  <XCircle size={22} />
                </button>

              </div>

              <div className="grid md:grid-cols-2 gap-6">

                <div className="bg-black border border-zinc-700 rounded-2xl p-5">
                  <p className="text-gray-400 text-sm">Full Name</p>
                  <p className="font-bold mt-2">{selectedUser.fullName}</p>
                </div>

                <div className="bg-black border border-zinc-700 rounded-2xl p-5">
                  <p className="text-gray-400 text-sm">Email</p>
                  <p className="font-bold mt-2 break-all">{selectedUser.email}</p>
                </div>

                <div className="bg-black border border-zinc-700 rounded-2xl p-5">
                  <p className="text-gray-400 text-sm">Phone</p>
                  <p className="font-bold mt-2">{selectedUser.phone}</p>
                </div>

                <div className="bg-black border border-zinc-700 rounded-2xl p-5">
                  <p className="text-gray-400 text-sm">Location</p>
                  <p className="font-bold mt-2">
                    {selectedUser.city}, {selectedUser.country}
                  </p>
                </div>

                <div className="bg-black border border-green-700 rounded-2xl p-5">
                  <p className="text-gray-400 text-sm">Wallet Balance</p>

                  <input
                    type="number"
                    defaultValue={selectedUser.walletBalance}
                    className="mt-3 w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-green-400 font-bold outline-none"
                  />
                </div>

                <div className="bg-black border border-yellow-700 rounded-2xl p-5">
                  <p className="text-gray-400 text-sm">Gold Balance (Gram)</p>

                  <input
                    type="number"
                    step="0.0001"
                    defaultValue={selectedUser.goldBalance}
                    className="mt-3 w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-yellow-400 font-bold outline-none"
                  />
                </div>

              </div>

              {/* ACTION BUTTONS */}

              <div className="grid md:grid-cols-2 gap-4 mt-8">

                <button className="bg-green-600 hover:bg-green-500 py-3 rounded-xl font-black flex items-center justify-center gap-2">
                  <BadgeCheck size={20} />
                  Verify KYC
                </button>

                <button className="bg-red-600 hover:bg-red-500 py-3 rounded-xl font-black flex items-center justify-center gap-2">
                  <UserX size={20} />
                  Block User
                </button>

                <button className="bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-black flex items-center justify-center gap-2">
                  <Wallet size={20} />
                  Update Wallet
                </button>

                <button className="bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-black flex items-center justify-center gap-2">
                  <Save size={20} />
                  Save Changes
                </button>

              </div>

            </div>

          </div>

        )}

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/admin/page.tsx
// SECTION 5/10
// DEPOSIT MANAGEMENT + APPROVE / REJECT + SCREENSHOT REVIEW
// =====================================================

        {/* ================= DEPOSIT MANAGEMENT HEADER ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="text-green-400" size={30} />

                <h2 className="text-3xl font-black text-green-400">
                  Deposit Management
                </h2>
              </div>

              <p className="text-gray-400">
                Review user deposit requests, payment screenshots and approve or reject deposits.
              </p>

            </div>

            <div className="text-right">

              <p className="text-gray-400 text-sm">Pending Deposits</p>

              <h3 className="text-3xl font-black text-yellow-400">
                {stats.pendingDeposits}
              </h3>

            </div>

          </div>

        </div>

        {/* ================= DEPOSIT FILTERS ================= */}

        <div className="bg-zinc-900 border border-green-700 rounded-3xl p-6 mb-8">

          <div className="grid lg:grid-cols-3 gap-5">

            <div className="relative">

              <Search
                className="absolute left-4 top-3 text-gray-500"
                size={20}
              />

              <input
                type="text"
                placeholder="Search Deposit User..."
                className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-green-500 outline-none"
              />

            </div>

            <select
              value={depositFilter}
              onChange={(e) => setDepositFilter(e.target.value)}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-green-500 outline-none"
            >
              <option value="ALL">All Deposits</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              onClick={loadDeposits}
              className="bg-green-600 hover:bg-green-500 rounded-xl py-3 font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh Deposits
            </button>

          </div>

        </div>

        {/* ================= DEPOSIT SUMMARY CARDS ================= */}

        <div className="grid md:grid-cols-3 gap-5 mb-8">

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <Clock className="text-yellow-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">Pending Deposits</p>

            <h3 className="text-3xl font-black text-yellow-400 mt-2">
              {stats.pendingDeposits}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">

            <CheckCircle2 className="text-green-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">Approved Deposits</p>

            <h3 className="text-3xl font-black text-green-400 mt-2">
              {stats.approvedDeposits}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-blue-600 rounded-2xl p-5">

            <DollarSign className="text-blue-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">Total Deposit Volume</p>

            <h3 className="text-3xl font-black text-blue-400 mt-2">
              PKR {stats.totalDeposits.toLocaleString()}
            </h3>

          </div>

        </div>

        {/* ================= DEPOSIT TABLE ================= */}

        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-4 mb-10 overflow-x-auto">

          <table className="w-full min-w-[1200px]">

            <thead className="border-b border-zinc-700 text-gray-400 text-sm">

              <tr>
                <th className="text-left py-4 px-3">User</th>
                <th className="text-left py-4 px-3">Amount</th>
                <th className="text-left py-4 px-3">Payment</th>
                <th className="text-left py-4 px-3">Screenshot</th>
                <th className="text-left py-4 px-3">Status</th>
                <th className="text-left py-4 px-3">Date</th>
                <th className="text-center py-4 px-3">Actions</th>
              </tr>

            </thead>

            <tbody>

              {filteredDeposits.map((deposit) => (

                <tr
                  key={deposit._id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/40"
                >

                  <td className="py-4 px-3">

                    <div>

                      <p className="font-bold">{deposit.userName}</p>

                      <p className="text-gray-400 text-sm">
                        {deposit.email}
                      </p>

                    </div>

                  </td>

                  <td className="py-4 px-3 text-green-400 font-black">
                    PKR {deposit.amount.toLocaleString()}
                  </td>

                  <td className="py-4 px-3 text-gray-300">
                    {deposit.paymentMethod}
                  </td>

                  <td className="py-4 px-3">

                    <button className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                      <Eye size={16} />
                      View Screenshot
                    </button>

                  </td>

                  <td className="py-4 px-3">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        deposit.status === "APPROVED"
                          ? "bg-green-600"
                          : deposit.status === "PENDING"
                          ? "bg-yellow-500 text-black"
                          : "bg-red-600"
                      }`}
                    >
                      {deposit.status}
                    </span>

                  </td>

                  <td className="py-4 px-3 text-gray-400 text-sm">
                    {new Date(deposit.createdAt).toLocaleDateString("en-PK")}
                  </td>

                  <td className="py-4 px-3">

                    <div className="flex gap-2 justify-center flex-wrap">

                      <button className="bg-green-600 hover:bg-green-500 p-2 rounded-lg">
                        <CheckCircle2 size={18} />
                      </button>

                      <button className="bg-red-600 hover:bg-red-500 p-2 rounded-lg">
                        <XCircle size={18} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {/* ================= QUICK APPROVAL PANEL ================= */}

        <div className="bg-zinc-900 border border-emerald-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <CheckCircle2 className="text-emerald-400" size={28} />

            <h2 className="text-2xl font-black text-emerald-400">
              Quick Deposit Approval
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <p className="text-gray-400 text-sm mb-2">
                Deposit Request ID
              </p>

              <input
                type="text"
                placeholder="Enter Deposit ID"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <p className="text-gray-400 text-sm mb-2">
                Deposit Amount
              </p>

              <input
                type="number"
                placeholder="Enter Amount"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
              />

            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">

            <button className="bg-green-600 hover:bg-green-500 py-3 rounded-xl font-black flex items-center justify-center gap-2">
              <CheckCircle2 size={20} />
              Approve Deposit
            </button>

            <button className="bg-red-600 hover:bg-red-500 py-3 rounded-xl font-black flex items-center justify-center gap-2">
              <XCircle size={20} />
              Reject Deposit
            </button>

          </div>

        </div>

        {/* ================= BANK ACCOUNT DETAILS ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Banknote className="text-blue-400" size={28} />

            <h2 className="text-2xl font-black text-blue-400">
              Official Deposit Accounts
            </h2>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            {[
              {
                bank: "Meezan Bank",
                title: "GoldTrade Pakistan Pvt Ltd",
                account: "1234567890123456",
              },
              {
                bank: "HBL Bank",
                title: "GoldTrade Pakistan Pvt Ltd",
                account: "9876543210123456",
              },
              {
                bank: "JazzCash",
                title: "GoldTrade Wallet",
                account: "03001234567",
              },
              {
                bank: "EasyPaisa",
                title: "GoldTrade Wallet",
                account: "03111234567",
              },
            ].map((bank) => (
              <div
                key={bank.bank}
                className="bg-black border border-zinc-700 rounded-2xl p-5"
              >

                <h3 className="font-bold text-blue-400">
                  {bank.bank}
                </h3>

                <p className="text-gray-400 text-sm mt-3">
                  Account Title
                </p>

                <p className="font-semibold">{bank.title}</p>

                <p className="text-gray-400 text-sm mt-3">
                  Account Number
                </p>

                <p className="font-mono text-green-400">
                  {bank.account}
                </p>

              </div>
            ))}

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/admin/page.tsx
// SECTION 6/10
// WITHDRAWAL MANAGEMENT + APPROVE / REJECT + PAYMENT QUEUE
// =====================================================

        {/* ================= WITHDRAWAL MANAGEMENT HEADER ================= */}

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-3 mb-2">
                <Wallet className="text-red-400" size={30} />

                <h2 className="text-3xl font-black text-red-400">
                  Withdrawal Management
                </h2>
              </div>

              <p className="text-gray-400">
                Verify withdrawal requests, payment details and approve or reject user withdrawals.
              </p>

            </div>

            <div className="text-right">

              <p className="text-gray-400 text-sm">Pending Withdrawals</p>

              <h3 className="text-3xl font-black text-yellow-400">
                {stats.pendingWithdrawals}
              </h3>

            </div>

          </div>

        </div>

        {/* ================= WITHDRAWAL FILTERS ================= */}

        <div className="bg-zinc-900 border border-red-700 rounded-3xl p-6 mb-8">

          <div className="grid lg:grid-cols-3 gap-5">

            <div className="relative">

              <Search
                className="absolute left-4 top-3 text-gray-500"
                size={20}
              />

              <input
                type="text"
                placeholder="Search Withdrawal User..."
                className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:border-red-500 outline-none"
              />

            </div>

            <select
              value={withdrawFilter}
              onChange={(e) => setWithdrawFilter(e.target.value)}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-red-500 outline-none"
            >
              <option value="ALL">All Withdrawals</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <button
              onClick={loadWithdrawals}
              className="bg-red-600 hover:bg-red-500 rounded-xl py-3 font-bold flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh Withdrawals
            </button>

          </div>

        </div>

        {/* ================= WITHDRAWAL SUMMARY ================= */}

        <div className="grid md:grid-cols-3 gap-5 mb-8">

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <Clock className="text-yellow-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">Pending Requests</p>

            <h3 className="text-3xl font-black text-yellow-400 mt-2">
              {stats.pendingWithdrawals}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">

            <CheckCircle2 className="text-green-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">Approved Withdrawals</p>

            <h3 className="text-3xl font-black text-green-400 mt-2">
              {stats.approvedWithdrawals}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-2xl p-5">

            <DollarSign className="text-red-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">Total Withdrawal Volume</p>

            <h3 className="text-3xl font-black text-red-400 mt-2">
              PKR {stats.totalWithdrawals.toLocaleString()}
            </h3>

          </div>

        </div>

        {/* ================= WITHDRAWAL TABLE ================= */}

        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-4 mb-10 overflow-x-auto">

          <table className="w-full min-w-[1300px]">

            <thead className="border-b border-zinc-700 text-gray-400 text-sm">

              <tr>
                <th className="text-left py-4 px-3">User</th>
                <th className="text-left py-4 px-3">Amount</th>
                <th className="text-left py-4 px-3">Method</th>
                <th className="text-left py-4 px-3">Account Details</th>
                <th className="text-left py-4 px-3">Status</th>
                <th className="text-left py-4 px-3">Date</th>
                <th className="text-center py-4 px-3">Actions</th>
              </tr>

            </thead>

            <tbody>

              {filteredWithdrawals.map((withdrawal) => (

                <tr
                  key={withdrawal._id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/40"
                >

                  <td className="py-4 px-3">

                    <div>

                      <p className="font-bold">{withdrawal.userName}</p>

                      <p className="text-gray-400 text-sm">
                        {withdrawal.email}
                      </p>

                    </div>

                  </td>

                  <td className="py-4 px-3 text-red-400 font-black">
                    PKR {withdrawal.amount.toLocaleString()}
                  </td>

                  <td className="py-4 px-3">
                    {withdrawal.paymentMethod}
                  </td>

                  <td className="py-4 px-3">

                    <div>

                      <p className="font-semibold">
                        {withdrawal.accountTitle}
                      </p>

                      <p className="font-mono text-gray-400 text-sm">
                        {withdrawal.accountNumber}
                      </p>

                    </div>

                  </td>

                  <td className="py-4 px-3">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        withdrawal.status === "APPROVED"
                          ? "bg-green-600"
                          : withdrawal.status === "PENDING"
                          ? "bg-yellow-500 text-black"
                          : "bg-red-600"
                      }`}
                    >
                      {withdrawal.status}
                    </span>

                  </td>

                  <td className="py-4 px-3 text-gray-400 text-sm">
                    {new Date(withdrawal.createdAt).toLocaleDateString("en-PK")}
                  </td>

                  <td className="py-4 px-3">

                    <div className="flex gap-2 justify-center flex-wrap">

                      <button className="bg-green-600 hover:bg-green-500 p-2 rounded-lg">
                        <CheckCircle2 size={18} />
                      </button>

                      <button className="bg-red-600 hover:bg-red-500 p-2 rounded-lg">
                        <XCircle size={18} />
                      </button>

                      <button className="bg-blue-600 hover:bg-blue-500 p-2 rounded-lg">
                        <Eye size={18} />
                      </button>

                    </div>

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {/* ================= QUICK WITHDRAWAL APPROVAL ================= */}

        <div className="bg-zinc-900 border border-orange-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <CheckCircle2 className="text-orange-400" size={28} />

            <h2 className="text-2xl font-black text-orange-400">
              Quick Withdrawal Approval
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <p className="text-gray-400 text-sm mb-2">
                Withdrawal Request ID
              </p>

              <input
                type="text"
                placeholder="Enter Withdrawal ID"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <p className="text-gray-400 text-sm mb-2">
                Approved Amount
              </p>

              <input
                type="number"
                placeholder="Enter Approved Amount"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
              />

            </div>

          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">

            <button className="bg-green-600 hover:bg-green-500 py-3 rounded-xl font-black flex items-center justify-center gap-2">
              <CheckCircle2 size={20} />
              Approve Withdrawal
            </button>

            <button className="bg-red-600 hover:bg-red-500 py-3 rounded-xl font-black flex items-center justify-center gap-2">
              <XCircle size={20} />
              Reject Withdrawal
            </button>

          </div>

        </div>

        {/* ================= BANK ACCOUNT VERIFICATION ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Banknote className="text-blue-400" size={28} />

            <h2 className="text-2xl font-black text-blue-400">
              Bank Account Verification
            </h2>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            {[
              {
                title: "Meezan Bank",
                desc: "Verify IBAN, Account Title and Account Number before payment.",
              },
              {
                title: "HBL Bank",
                desc: "Confirm beneficiary name and account number.",
              },
              {
                title: "JazzCash",
                desc: "Verify registered JazzCash mobile number.",
              },
              {
                title: "EasyPaisa",
                desc: "Verify EasyPaisa account ownership before transfer.",
              },
            ].map((bank) => (
              <div
                key={bank.title}
                className="bg-black border border-zinc-700 rounded-2xl p-5"
              >

                <h3 className="font-bold text-blue-400">
                  {bank.title}
                </h3>

                <p className="text-gray-400 text-sm mt-3">
                  {bank.desc}
                </p>

                <button className="w-full mt-5 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold">
                  Verify Account
                </button>

              </div>
            ))}

          </div>

        </div>

        {/* ================= BULK PAYMENT QUEUE ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Upload className="text-purple-400" size={28} />

            <h2 className="text-2xl font-black text-purple-400">
              Bulk Payment Queue
            </h2>

          </div>

          <div className="bg-black border border-zinc-700 rounded-2xl p-6">

            <div className="grid md:grid-cols-3 gap-5 mb-6">

              <div>

                <p className="text-gray-400 text-sm">Pending Queue</p>

                <h3 className="text-3xl font-black text-yellow-400 mt-2">
                  {stats.pendingWithdrawals}
                </h3>

              </div>

              <div>

                <p className="text-gray-400 text-sm">Estimated Amount</p>

                <h3 className="text-3xl font-black text-red-400 mt-2">
                  PKR {stats.pendingWithdrawals.toLocaleString()}
                </h3>

              </div>

              <div>

                <p className="text-gray-400 text-sm">Ready For Payment</p>

                <h3 className="text-3xl font-black text-green-400 mt-2">
                  {stats.pendingWithdrawals}
                </h3>

              </div>

            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <button className="bg-purple-600 hover:bg-purple-500 py-3 rounded-xl font-black">
                Approve All Pending
              </button>

              <button className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-black">
                Export Payment List
              </button>

            </div>

          </div>

        </div>

        {/* ================= PAYMENT HISTORY ================= */}

        <div className="bg-zinc-900 border border-green-700 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <FileText className="text-green-400" size={28} />

            <h2 className="text-2xl font-black text-green-400">
              Payment History
            </h2>

          </div>

          <div className="space-y-4">

            {[
              {
                user: "Ali Khan",
                amount: "PKR 120,000",
                method: "Meezan Bank",
                date: "Today • 06:20 PM",
              },
              {
                user: "Ahmed Raza",
                amount: "PKR 58,500",
                method: "JazzCash",
                date: "Today • 03:45 PM",
              },
              {
                user: "Sara Noor",
                amount: "PKR 250,000",
                method: "HBL Bank",
                date: "Yesterday • 09:10 PM",
              },
            ].map((payment) => (
              <div
                key={`${payment.user}-${payment.date}`}
                className="bg-black border border-zinc-700 rounded-xl p-4 flex justify-between items-center"
              >

                <div>

                  <p className="font-semibold text-white">
                    {payment.user}
                  </p>

                  <p className="text-gray-400 text-sm">
                    {payment.method}
                  </p>

                </div>

                <div className="text-right">

                  <p className="font-bold text-green-400">
                    {payment.amount}
                  </p>

                  <p className="text-gray-500 text-xs">
                    {payment.date}
                  </p>

                </div>

              </div>
            ))}

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/admin/page.tsx
// SECTION 7/10
// LIVE GOLD PRICE CONTROL + TRADING CONTROL + MARKET SETTINGS
// =====================================================

        {/* ================= GOLD PRICE CONTROL HEADER ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-3 mb-2">
                <Coins className="text-yellow-400" size={30} />
                <h2 className="text-3xl font-black text-yellow-400">
                  Live Gold Price Control
                </h2>
              </div>

              <p className="text-gray-400">
                Update Gold Buy/Sell prices instantly across Dashboard, Trading, Wallet and Mobile App.
              </p>

            </div>

            <button className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-black flex items-center gap-2">
              <RefreshCw size={18} />
              Sync Live Market
            </button>

          </div>

        </div>

        {/* ================= LIVE PRICE CARDS ================= */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <TrendingUp className="text-yellow-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">Live Buy Price</p>

            <h3 className="text-3xl font-black text-yellow-400 mt-2">
              PKR {goldControl.buyPrice.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">

            <TrendingDown className="text-green-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">Live Sell Price</p>

            <h3 className="text-3xl font-black text-green-400 mt-2">
              PKR {goldControl.sellPrice.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-2xl p-5">

            <Globe className="text-cyan-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">USD / PKR Rate</p>

            <h3 className="text-3xl font-black text-cyan-400 mt-2">
              {goldControl.usdRate}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">

            <Clock className="text-orange-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">Last Updated</p>

            <h3 className="text-lg font-black text-orange-400 mt-2">
              {goldControl.lastUpdated || "Live"}
            </h3>

          </div>

        </div>

        {/* ================= UPDATE GOLD PRICES ================= */}

        <div className="bg-zinc-900 border border-yellow-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Pencil className="text-yellow-400" size={28} />

            <h2 className="text-2xl font-black text-yellow-400">
              Update Gold Market Prices
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Gold Buy Price (PKR)
              </label>

              <input
                type="number"
                value={goldControl.buyPrice}
                onChange={(e) =>
                  setGoldControl((prev) => ({
                    ...prev,
                    buyPrice: Number(e.target.value),
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-yellow-400 font-bold outline-none focus:border-yellow-500"
              />

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Gold Sell Price (PKR)
              </label>

              <input
                type="number"
                value={goldControl.sellPrice}
                onChange={(e) =>
                  setGoldControl((prev) => ({
                    ...prev,
                    sellPrice: Number(e.target.value),
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-green-400 font-bold outline-none focus:border-green-500"
              />

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                USD / PKR Exchange Rate
              </label>

              <input
                type="number"
                value={goldControl.usdRate}
                onChange={(e) =>
                  setGoldControl((prev) => ({
                    ...prev,
                    usdRate: Number(e.target.value),
                  }))
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-cyan-400 font-bold outline-none focus:border-cyan-500"
              />

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Market Spread (PKR)
              </label>

              <input
                type="number"
                value={goldControl.sellPrice - goldControl.buyPrice}
                readOnly
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-orange-400 font-bold"
              />

            </div>

          </div>

          <button className="w-full mt-8 bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3">
            <Save size={22} />
            Update Live Gold Prices
          </button>

        </div>

        {/* ================= MARKET SPREAD CONTROL ================= */}

        <div className="bg-zinc-900 border border-orange-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <BarChart3 className="text-orange-400" size={28} />

            <h2 className="text-2xl font-black text-orange-400">
              Market Spread Configuration
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Buy Commission (%)
              </label>

              <input
                type="number"
                defaultValue={1.5}
                step="0.1"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Sell Commission (%)
              </label>

              <input
                type="number"
                defaultValue={1.2}
                step="0.1"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Minimum Trading Amount (PKR)
              </label>

              <input
                type="number"
                defaultValue={5000}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Maximum Trading Amount (PKR)
              </label>

              <input
                type="number"
                defaultValue={5000000}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white"
              />

            </div>

          </div>

          <button className="w-full mt-8 bg-orange-500 hover:bg-orange-400 text-black py-4 rounded-2xl font-black">
            Save Market Spread Settings
          </button>

        </div>

        {/* ================= TRADING CONTROL ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Activity className="text-green-400" size={28} />

            <h2 className="text-2xl font-black text-green-400">
              Trading Controls
            </h2>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            {[
              {
                title: "Enable Buy Orders",
                description: "Allow all users to buy Gold instantly.",
                enabled: true,
              },
              {
                title: "Enable Sell Orders",
                description: "Allow all users to sell Gold instantly.",
                enabled: true,
              },
              {
                title: "Enable Instant Trading",
                description: "Execute market orders immediately.",
                enabled: true,
              },
              {
                title: "Pause Complete Trading",
                description: "Temporarily stop all Gold trading.",
                enabled: false,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center"
              >

                <div>

                  <h3 className="font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    {item.description}
                  </p>

                </div>

                <button
                  className={`px-5 py-2 rounded-full font-bold ${
                    item.enabled
                      ? "bg-green-600"
                      : "bg-red-600"
                  }`}
                >
                  {item.enabled ? "Enabled" : "Paused"}
                </button>

              </div>
            ))}

          </div>

        </div>

        {/* ================= TRADING SESSION CONTROL ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Calendar className="text-blue-400" size={28} />

            <h2 className="text-2xl font-black text-blue-400">
              Trading Session Configuration
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Market Opens At
              </label>

              <input
                type="time"
                defaultValue="09:00"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white"
              />

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Market Closes At
              </label>

              <input
                type="time"
                defaultValue="23:00"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white"
              />

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Market Time Zone
              </label>

              <select className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white">
                <option>Asia/Karachi</option>
                <option>Asia/Dubai</option>
                <option>Asia/Phnom_Penh</option>
                <option>UTC</option>
              </select>

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Weekend Trading
              </label>

              <select className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white">
                <option>Enabled</option>
                <option>Disabled</option>
              </select>

            </div>

          </div>

          <button className="w-full mt-8 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-lg">
            Save Trading Session Settings
          </button>

        </div>

        {/* ================= EMERGENCY TRADING CONTROLS ================= */}

        <div className="bg-zinc-900 border border-red-700 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <AlertTriangle className="text-red-500" size={28} />

            <h2 className="text-2xl font-black text-red-500">
              Emergency Trading Controls
            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-5">

            <button className="bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black">
              Pause All Trading
            </button>

            <button className="bg-orange-500 hover:bg-orange-400 text-black py-4 rounded-2xl font-black">
              Pause Buy Orders
            </button>

            <button className="bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black">
              Pause Sell Orders
            </button>

            <button className="bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black md:col-span-3">
              Resume Complete Trading
            </button>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/admin/page.tsx
// SECTION 8/10
// REFERRAL MANAGEMENT + COMMISSION + PROMO CODES + BONUS
// =====================================================

        {/* ================= REFERRAL MANAGEMENT HEADER ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-3 mb-2">
                <Users className="text-purple-400" size={30} />
                <h2 className="text-3xl font-black text-purple-400">
                  Referral & Commission Management
                </h2>
              </div>

              <p className="text-gray-400">
                Control referral rewards, affiliate commissions and promotional bonus campaigns.
              </p>

            </div>

            <div className="text-right">

              <p className="text-gray-400 text-sm">
                Total Referral Bonus Paid
              </p>

              <h3 className="text-3xl font-black text-green-400">
                PKR {referralStats.paidReferralBonus.toLocaleString()}
              </h3>

            </div>

          </div>

        </div>

        {/* ================= REFERRAL SUMMARY ================= */}

        <div className="grid md:grid-cols-3 gap-5 mb-8">

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">

            <DollarSign className="text-green-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">
              Total Referral Rewards
            </p>

            <h3 className="text-3xl font-black text-green-400 mt-2">
              PKR {referralStats.totalReferralBonus.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <Clock className="text-yellow-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">
              Pending Referral Rewards
            </p>

            <h3 className="text-3xl font-black text-yellow-400 mt-2">
              PKR {referralStats.pendingReferralBonus.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-purple-600 rounded-2xl p-5">

            <CheckCircle2 className="text-purple-400 mb-3" size={28} />

            <p className="text-gray-400 text-sm">
              Paid Referral Rewards
            </p>

            <h3 className="text-3xl font-black text-purple-400 mt-2">
              PKR {referralStats.paidReferralBonus.toLocaleString()}
            </h3>

          </div>

        </div>

        {/* ================= REFERRAL SETTINGS ================= */}

        <div className="bg-zinc-900 border border-indigo-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Settings className="text-indigo-400" size={28} />

            <h2 className="text-2xl font-black text-indigo-400">
              Referral Reward Configuration
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Signup Referral Bonus (PKR)
              </label>

              <input
                type="number"
                defaultValue={500}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-green-400 font-bold outline-none"
              />

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                First Deposit Referral Bonus (PKR)
              </label>

              <input
                type="number"
                defaultValue={1000}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-green-400 font-bold outline-none"
              />

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Gold Purchase Referral Commission (%)
              </label>

              <input
                type="number"
                defaultValue={2}
                step="0.5"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-yellow-400 font-bold outline-none"
              />

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Maximum Referral Reward (PKR)
              </label>

              <input
                type="number"
                defaultValue={50000}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-orange-400 font-bold outline-none"
              />

            </div>

          </div>

          <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-lg">
            Save Referral Settings
          </button>

        </div>

        {/* ================= PROMO CODE MANAGEMENT ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <PlusCircle className="text-cyan-400" size={28} />

            <h2 className="text-2xl font-black text-cyan-400">
              Promo Code Management
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">

            <input
              type="text"
              placeholder="Promo Code (Example: GOLD500)"
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
            />

            <input
              type="number"
              placeholder="Bonus Amount (PKR)"
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
            />

            <input
              type="date"
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
            />

            <select className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white">
              <option>Signup Bonus</option>
              <option>Deposit Bonus</option>
              <option>Festival Bonus</option>
              <option>Trading Cashback</option>
            </select>

          </div>

          <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl font-black text-lg">
            Create Promo Code
          </button>

          {/* Existing Promo Codes */}

          <div className="mt-10 space-y-4">

            {[
              { code: "GOLD500", amount: 500, status: "ACTIVE" },
              { code: "WELCOME1000", amount: 1000, status: "ACTIVE" },
              { code: "EIDBONUS", amount: 1500, status: "EXPIRED" },
            ].map((promo) => (
              <div
                key={promo.code}
                className="bg-black border border-zinc-700 rounded-xl p-4 flex justify-between items-center"
              >

                <div>

                  <p className="font-bold text-cyan-400">
                    {promo.code}
                  </p>

                  <p className="text-gray-400 text-sm">
                    PKR {promo.amount}
                  </p>

                </div>

                <div className="flex gap-3 items-center">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      promo.status === "ACTIVE"
                        ? "bg-green-600"
                        : "bg-red-600"
                    }`}
                  >
                    {promo.status}
                  </span>

                  <button className="bg-yellow-500 hover:bg-yellow-400 text-black p-2 rounded-lg">
                    <Pencil size={18} />
                  </button>

                  <button className="bg-red-600 hover:bg-red-500 p-2 rounded-lg">
                    <Trash2 size={18} />
                  </button>

                </div>

              </div>
            ))}

          </div>

        </div>

        {/* ================= AFFILIATE COMMISSION PANEL ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <TrendingUp className="text-green-400" size={28} />

            <h2 className="text-2xl font-black text-green-400">
              Affiliate Commission Panel
            </h2>

          </div>

          <div className="grid md:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Level 1 Commission (%)
              </label>

              <input
                type="number"
                defaultValue={5}
                step="0.5"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Level 2 Commission (%)
              </label>

              <input
                type="number"
                defaultValue={2}
                step="0.5"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Level 3 Commission (%)
              </label>

              <input
                type="number"
                defaultValue={1}
                step="0.5"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Minimum Withdrawal Commission (PKR)
              </label>

              <input
                type="number"
                defaultValue={1000}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white"
              />

            </div>

          </div>

          <button className="w-full mt-8 bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black text-lg">
            Save Affiliate Commission
          </button>

        </div>

        {/* ================= BONUS CAMPAIGN MANAGER ================= */}

        <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Gift className="text-orange-400" size={28} />

            <h2 className="text-2xl font-black text-orange-400">
              Bonus Campaign Manager
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-6">

            <input
              type="text"
              placeholder="Campaign Title"
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white"
            />

            <input
              type="number"
              placeholder="Bonus Amount (PKR)"
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white"
            />

            <input
              type="date"
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white"
            />

            <select className="bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white">
              <option>All Users</option>
              <option>Verified Users</option>
              <option>New Users</option>
              <option>Premium Users</option>
            </select>

          </div>

          <button className="w-full bg-orange-500 hover:bg-orange-400 text-black py-4 rounded-2xl font-black text-lg">
            Launch Bonus Campaign
          </button>

        </div>

        {/* ================= TOP REFERRAL LEADERBOARD ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <BarChart3 className="text-yellow-400" size={28} />

            <h2 className="text-2xl font-black text-yellow-400">
              Top Referral Leaderboard
            </h2>

          </div>

          <div className="space-y-4">

            {[
              {
                name: "Ali Khan",
                referrals: 52,
                reward: 25500,
              },
              {
                name: "Sara Noor",
                referrals: 39,
                reward: 18200,
              },
              {
                name: "Ahmed Raza",
                referrals: 28,
                reward: 14450,
              },
            ].map((user, index) => (
              <div
                key={user.name}
                className="bg-black border border-zinc-700 rounded-xl p-4 flex justify-between items-center"
              >

                <div className="flex items-center gap-4">

                  <div className="bg-yellow-500 text-black h-10 w-10 rounded-full flex items-center justify-center font-black">
                    {index + 1}
                  </div>

                  <div>

                    <p className="font-bold text-white">
                      {user.name}
                    </p>

                    <p className="text-gray-400 text-sm">
                      {user.referrals} Successful Referrals
                    </p>

                  </div>

                </div>

                <p className="font-black text-green-400">
                  PKR {user.reward.toLocaleString()}
                </p>

              </div>
            ))}

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/admin/page.tsx
// SECTION 9/10
// REPORTS + ANALYTICS + REVENUE + ACTIVITY LOGS + EXPORTS
// =====================================================

        {/* ================= REPORTS HEADER ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-8">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

            <div>

              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="text-cyan-400" size={30} />
                <h2 className="text-3xl font-black text-cyan-400">
                  Reports & Analytics Center
                </h2>
              </div>

              <p className="text-gray-400">
                View platform performance, revenue reports, user growth and activity logs.
              </p>

            </div>

            <button className="bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-xl font-black flex items-center gap-2">
              <RefreshCw size={18} />
              Refresh Reports
            </button>

          </div>

        </div>

        {/* ================= REVENUE ANALYTICS ================= */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">
            <DollarSign className="text-green-400 mb-3" size={28} />
            <p className="text-gray-400 text-sm">Today's Revenue</p>
            <h3 className="text-3xl font-black text-green-400 mt-2">
              PKR {stats.todayRevenue.toLocaleString()}
            </h3>
          </div>

          <div className="bg-zinc-900 border border-blue-600 rounded-2xl p-5">
            <TrendingUp className="text-blue-400 mb-3" size={28} />
            <p className="text-gray-400 text-sm">Total Revenue</p>
            <h3 className="text-3xl font-black text-blue-400 mt-2">
              PKR {stats.totalRevenue.toLocaleString()}
            </h3>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <CreditCard className="text-yellow-400 mb-3" size={28} />
            <p className="text-gray-400 text-sm">Deposit Volume</p>
            <h3 className="text-3xl font-black text-yellow-400 mt-2">
              PKR {stats.totalDeposits.toLocaleString()}
            </h3>
          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-2xl p-5">
            <Wallet className="text-red-400 mb-3" size={28} />
            <p className="text-gray-400 text-sm">Withdrawal Volume</p>
            <h3 className="text-3xl font-black text-red-400 mt-2">
              PKR {stats.totalWithdrawals.toLocaleString()}
            </h3>
          </div>

        </div>

        {/* ================= MONTHLY REVENUE TABLE ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Calendar className="text-green-400" size={28} />
            <h2 className="text-2xl font-black text-green-400">
              Monthly Revenue Report
            </h2>
          </div>

          <table className="w-full">
            <thead className="border-b border-zinc-700 text-gray-400">
              <tr>
                <th className="text-left py-3">Month</th>
                <th className="text-left py-3">Revenue</th>
                <th className="text-left py-3">Growth</th>
              </tr>
            </thead>

            <tbody>

              {[
                ["January", "PKR 8,400,000", "+6%"],
                ["February", "PKR 9,200,000", "+9%"],
                ["March", "PKR 10,150,000", "+10%"],
                ["April", "PKR 11,000,000", "+8%"],
                ["May", "PKR 12,400,000", "+12%"],
                ["June", "PKR 13,850,000", "+11%"],
              ].map((row) => (
                <tr key={row[0]} className="border-b border-zinc-800">
                  <td className="py-3">{row[0]}</td>
                  <td className="py-3 text-green-400 font-bold">{row[1]}</td>
                  <td className="py-3 text-cyan-400">{row[2]}</td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

        {/* ================= USER ANALYTICS ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Users className="text-blue-400" size={28} />
            <h2 className="text-2xl font-black text-blue-400">
              User Analytics
            </h2>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 text-center">
              <Users className="mx-auto text-blue-400 mb-3" size={26} />
              <p className="text-gray-400 text-sm">Total Users</p>
              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {stats.totalUsers}
              </h3>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 text-center">
              <BadgeCheck className="mx-auto text-green-400 mb-3" size={26} />
              <p className="text-gray-400 text-sm">Verified Users</p>
              <h3 className="text-3xl font-black text-green-400 mt-2">
                {stats.verifiedUsers}
              </h3>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 text-center">
              <Clock className="mx-auto text-yellow-400 mb-3" size={26} />
              <p className="text-gray-400 text-sm">Pending KYC</p>
              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                {stats.pendingKyc}
              </h3>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 text-center">
              <UserX className="mx-auto text-red-400 mb-3" size={26} />
              <p className="text-gray-400 text-sm">Blocked Users</p>
              <h3 className="text-3xl font-black text-red-400 mt-2">
                {stats.blockedUsers}
              </h3>
            </div>

          </div>

        </div>

        {/* ================= TRANSACTION REPORT ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Database className="text-purple-400" size={28} />
            <h2 className="text-2xl font-black text-purple-400">
              Transaction Analytics
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <p className="text-gray-400 text-sm mb-2">
                Total Deposits Processed
              </p>

              <h3 className="text-3xl font-black text-green-400">
                {stats.approvedDeposits}
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                Successfully completed deposits.
              </p>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <p className="text-gray-400 text-sm mb-2">
                Total Withdrawals Processed
              </p>

              <h3 className="text-3xl font-black text-red-400">
                {stats.approvedWithdrawals}
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                Successfully completed withdrawals.
              </p>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <p className="text-gray-400 text-sm mb-2">
                Pending Transactions
              </p>

              <h3 className="text-3xl font-black text-yellow-400">
                {pendingApprovals}
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                Waiting for admin approval.
              </p>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <p className="text-gray-400 text-sm mb-2">
                Platform Transactions
              </p>

              <h3 className="text-3xl font-black text-cyan-400">
                {totalTransactions}
              </h3>

              <p className="text-gray-500 text-sm mt-2">
                Total processed transactions.
              </p>
            </div>

          </div>

        </div>

        {/* ================= ACTIVITY LOGS ================= */}

        <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Activity className="text-orange-400" size={28} />
            <h2 className="text-2xl font-black text-orange-400">
              Admin Activity Logs
            </h2>
          </div>

          <div className="space-y-4">

            {activityLogs.length === 0 ? (
              <div className="bg-black border border-zinc-700 rounded-xl p-5 text-center text-gray-400">
                No recent activity logs available.
              </div>
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log._id}
                  className="bg-black border border-zinc-700 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                >

                  <div>

                    <p className="font-bold text-white">{log.action}</p>

                    <p className="text-gray-400 text-sm">
                      {log.user}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-orange-400 text-sm">{log.ip}</p>

                    <p className="text-gray-500 text-xs">
                      {new Date(log.createdAt).toLocaleString("en-PK")}
                    </p>

                  </div>

                </div>
              ))
            )}

          </div>

        </div>

        {/* ================= EXPORT CENTER ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Download className="text-yellow-400" size={28} />
            <h2 className="text-2xl font-black text-yellow-400">
              Export Reports Center
            </h2>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            <button className="bg-green-600 hover:bg-green-500 rounded-2xl p-5 font-black flex flex-col items-center gap-3">
              <Download size={30} />
              Export Users CSV
            </button>

            <button className="bg-blue-600 hover:bg-blue-500 rounded-2xl p-5 font-black flex flex-col items-center gap-3">
              <Download size={30} />
              Export Deposits CSV
            </button>

            <button className="bg-purple-600 hover:bg-purple-500 rounded-2xl p-5 font-black flex flex-col items-center gap-3">
              <Download size={30} />
              Export Withdrawals CSV
            </button>

            <button className="bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl p-5 font-black flex flex-col items-center gap-3">
              <FileText size={30} />
              Export Revenue PDF
            </button>

          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-6">

            <button className="bg-cyan-600 hover:bg-cyan-500 rounded-2xl p-5 font-black flex items-center justify-center gap-3">
              <Download size={22} />
              Export Trading History
            </button>

            <button className="bg-orange-500 hover:bg-orange-400 text-black rounded-2xl p-5 font-black flex items-center justify-center gap-3">
              <Download size={22} />
              Export Activity Logs
            </button>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/admin/page.tsx
// SECTION 10/10
// ADMIN SETTINGS + ROLE MANAGEMENT + MAINTENANCE + FOOTER
// =====================================================

        {/* ================= ADMIN SETTINGS ================= */}

        <div className="bg-zinc-900 border border-indigo-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Settings className="text-indigo-400" size={28} />

            <h2 className="text-3xl font-black text-indigo-400">
              Admin Settings
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Platform Name
              </label>

              <input
                type="text"
                defaultValue="GoldTrade Pakistan"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Support Email
              </label>

              <input
                type="email"
                defaultValue="support@goldtrade.pk"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                WhatsApp Support Number
              </label>

              <input
                type="text"
                defaultValue="+92 300 1234567"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Default Currency
              </label>

              <select className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white">
                <option>PKR</option>
                <option>USD</option>
                <option>AED</option>
              </select>

            </div>

          </div>

          <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3">
            <Save size={22} />
            Save Admin Settings
          </button>

        </div>

        {/* ================= ROLE MANAGEMENT ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Shield className="text-purple-400" size={28} />

            <h2 className="text-3xl font-black text-purple-400">
              Admin Role Management
            </h2>

          </div>

          <div className="space-y-4">

            {[
              {
                role: "SUPER_ADMIN",
                permission: "Full access to entire GoldTrade platform."
              },
              {
                role: "FINANCE_MANAGER",
                permission: "Manage deposits, withdrawals and revenue reports."
              },
              {
                role: "KYC_MANAGER",
                permission: "Approve or reject KYC verification requests."
              },
              {
                role: "SUPPORT_AGENT",
                permission: "View users and support tickets only."
              }
            ].map((role) => (
              <div
                key={role.role}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center"
              >

                <div>

                  <h3 className="font-bold text-purple-400">
                    {role.role}
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    {role.permission}
                  </p>

                </div>

                <button className="bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-xl font-bold">
                  Edit Role
                </button>

              </div>
            ))}

          </div>

        </div>

        {/* ================= SECURITY SETTINGS ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Lock className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Security Settings
            </h2>

          </div>

          <div className="space-y-5">

            {[
              "Enable Admin Two-Factor Authentication",
              "Require Email Verification for New Users",
              "Enable Withdrawal OTP Verification",
              "Enable Device Login Notifications",
              "Enable Login Activity Tracking",
              "Enable Admin IP Whitelist"
            ].map((setting) => (
              <div
                key={setting}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center"
              >

                <p className="font-semibold text-white">
                  {setting}
                </p>

                <button className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-full font-bold">
                  Enabled
                </button>

              </div>
            ))}

          </div>

        </div>

        {/* ================= SYSTEM MAINTENANCE ================= */}

        <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Database className="text-orange-400" size={28} />

            <h2 className="text-3xl font-black text-orange-400">
              System Maintenance
            </h2>

          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <button className="bg-orange-500 hover:bg-orange-400 text-black py-4 rounded-2xl font-black">
              Enable Maintenance Mode
            </button>

            <button className="bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black">
              Disable Maintenance Mode
            </button>

            <button className="bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black">
              Clear Cache
            </button>

            <button className="bg-purple-600 hover:bg-purple-500 py-4 rounded-2xl font-black">
              Restart Background Jobs
            </button>

            <button className="bg-cyan-600 hover:bg-cyan-500 py-4 rounded-2xl font-black">
              Backup MongoDB Database
            </button>

            <button className="bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black">
              Download System Backup
            </button>

          </div>

        </div>

        {/* ================= DATABASE STATUS ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <Activity className="text-cyan-400" size={28} />

            <h2 className="text-3xl font-black text-cyan-400">
              System Health Monitor
            </h2>

          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">

            {[
              ["MongoDB", "Connected", "green"],
              ["JWT Authentication", "Secure", "green"],
              ["Gold Price API", "Online", "green"],
              ["Payment Gateway", "Operational", "green"]
            ].map(([service, status, color]) => (
              <div
                key={service}
                className="bg-black border border-zinc-700 rounded-2xl p-5 text-center"
              >

                <Activity
                  className={`mx-auto mb-3 ${
                    color === "green"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                  size={26}
                />

                <p className="text-gray-400 text-sm">
                  {service}
                </p>

                <h3
                  className={`font-black text-xl mt-2 ${
                    color === "green"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {status}
                </h3>

              </div>
            ))}

          </div>

        </div>

        {/* ================= LOGOUT MODAL ================= */}

        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">

            <div className="bg-zinc-900 border border-red-600 rounded-3xl p-8 w-full max-w-md">

              <div className="flex items-center gap-3 mb-5">

                <AlertTriangle className="text-red-500" size={30} />

                <h2 className="text-2xl font-black text-red-500">
                  Logout Admin
                </h2>

              </div>

              <p className="text-gray-300 mb-8">
                Are you sure you want to logout from GoldTrade Admin Panel?
              </p>

              <div className="flex gap-4">

                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold"
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    window.location.href = "/login";
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold"
                >
                  Logout
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ================= SAVE ADMIN PANEL ================= */}

        <div className="bg-gradient-to-r from-yellow-900 via-black to-yellow-900 border border-yellow-500 rounded-3xl p-8 mb-10">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div>

              <h2 className="text-4xl font-black text-yellow-400">
                Save GoldTrade Admin Configuration
              </h2>

              <p className="text-gray-300 mt-3 max-w-2xl">
                Save security settings, Gold price controls, referral configuration,
                payment settings and system preferences.
              </p>

            </div>

            <button
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-2xl font-black text-lg disabled:opacity-50 flex items-center gap-3 justify-center"
            >
              <Save size={22} />
              {saving ? "Saving..." : "Save All Configuration"}
            </button>

          </div>

        </div>

        {/* ================= FOOTER ================= */}

        <footer className="border-t border-zinc-800 pt-8 pb-6">

          <div className="grid md:grid-cols-3 gap-6">

            <div>

              <h3 className="text-2xl font-black text-yellow-400">
                GoldTrade V17 Enterprise
              </h3>

              <p className="text-gray-400 mt-2">
                Pakistan Digital Gold Trading Platform
              </p>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                Enterprise Admin Panel
              </p>

              <p className="text-white font-semibold mt-2">
                Users • Wallet • Trading • KYC • Reports • Security
              </p>

            </div>

            <div className="md:text-right">

              <p className="text-gray-400 text-sm">
                Platform Status
              </p>

              <p className="text-green-400 font-semibold mt-2">
                Enterprise Ready • MongoDB • JWT Protected
              </p>

            </div>

          </div>

          <div className="border-t border-zinc-800 mt-8 pt-5 text-center text-gray-500 text-sm">
            © 2026 GoldTrade Pakistan. Enterprise Admin Dashboard.
          </div>

        </footer>

      </div>
    </main>
  );
}