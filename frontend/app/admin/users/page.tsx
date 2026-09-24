"use client";

// =====================================================
// GoldTrade V18 Enterprise
// ADMIN USERS MANAGER
// PART 1/6
// Production Version
// =====================================================

import { useEffect, useMemo, useState } from "react";

import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Wallet,
  Coins,
  DollarSign,
  Shield,
  Trash2,
  Edit,
  Save,
  XCircle,
  Eye,
  Mail,
  Calendar,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

interface UserWallet {
  pkr: number;
  gold: number;
  usdt: number;
}

interface AdminUser {
  _id: string;

  username: string;
  email: string;

  role: string;
  status: "Active" | "Frozen";

  wallet?: UserWallet;

  pkrBalance?: number;
  goldBalance?: number;
  usdtBalance?: number;

  createdAt: string;
}

interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  frozenUsers: number;

  totalPKR: number;
  totalGold: number;
  totalUSDT: number;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AdminUsersPage() {

  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState("");

  const [adminName, setAdminName] =
    useState("Administrator");

  // ===================================================
  // USERS
  // ===================================================

  const [users, setUsers] = useState<AdminUser[]>([]);

  const [statistics, setStatistics] =
    useState<UserStatistics>({
      totalUsers: 0,
      activeUsers: 0,
      frozenUsers: 0,

      totalPKR: 0,
      totalGold: 0,
      totalUSDT: 0,
    });

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] = useState("");

  // ===================================================
  // SELECTED USER
  // ===================================================

  const [selectedUser, setSelectedUser] =
    useState<AdminUser | null>(null);

  const [walletModalOpen, setWalletModalOpen] =
    useState(false);

  // ===================================================
  // EDIT WALLET VALUES
  // ===================================================

  const [editPKR, setEditPKR] = useState(0);

  const [editGold, setEditGold] = useState(0);

  const [editUSDT, setEditUSDT] = useState(0);

  // ===================================================
  // TOKEN LOAD
  // ===================================================

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) {
      window.location.href = "/login";
      return;
    }

    setToken(savedToken);
  }, []);

  // ===================================================
  // REQUEST HEADERS
  // ===================================================

  const adminHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  // ===================================================
  // FORMATTERS
  // ===================================================

  const formatMoney = (value: number = 0) =>
    Number(value).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date?: string) => {
    if (!date) return "--";

    return new Date(date).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ===================================================
  // FILTER USERS
  // ===================================================

  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase();

    return users.filter((user) => {
      return (
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);
    // ===================================================
  // LOAD USERS + STATISTICS (PRODUCTION)
  // ===================================================

  const loadUsersDashboard = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setRefreshing(false);
      setError("");

      const [usersRes, statisticsRes] = await Promise.all([
        fetch(`${API}/api/admin/users`, {
          headers: adminHeaders,
          cache: "no-store",
        }),

        fetch(`${API}/api/admin/users/statistics`, {
          headers: adminHeaders,
          cache: "no-store",
        }),
      ]);

      const usersData = await usersRes.json();
      const statisticsData = await statisticsRes.json();

      console.log("USERS API:", usersData);
      console.log("USER STATISTICS API:", statisticsData);

      // USERS
      if (usersRes.ok && usersData.success) {
        setUsers(usersData.users || []);
      } else {
        setUsers([]);
        setError(usersData.message || "Unable to load users.");
      }

      // STATISTICS
      if (statisticsRes.ok && statisticsData.success) {
        setStatistics(statisticsData.statistics);
      } else {
        setStatistics({
          totalUsers: 0,
          activeUsers: 0,
          frozenUsers: 0,
          totalPKR: 0,
          totalGold: 0,
          totalUSDT: 0,
        });
      }

    } catch (error: any) {
      console.error("LOAD USERS ERROR:", error);
      setError(error.message || "Failed to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // REFRESH USERS
  // ===================================================

  const refreshUsers = async () => {
    setRefreshing(true);
    await loadUsersDashboard();
  };

  // ===================================================
  // ADMIN AUTH CHECK
  // ===================================================

  const checkAdminAuth = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API}/api/admin/auth/check`, {
        headers: adminHeaders,
        cache: "no-store",
      });

      const data = await response.json();

      console.log("ADMIN AUTH:", data);

      if (!response.ok || !data.success) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      setAdminName(data.user?.username || "Administrator");

    } catch (error) {
      console.error("ADMIN AUTH ERROR:", error);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (!token) return;

    checkAdminAuth();
    loadUsersDashboard();
  }, [token]);

  // ===================================================
  // CLEAR MESSAGE AFTER 4 SECONDS
  // ===================================================

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [message]);
    // ===================================================
  // OPEN WALLET EDIT MODAL
  // ===================================================

  const openWalletModal = (user: AdminUser) => {
    setSelectedUser(user);

    setEditPKR(Number(user.wallet?.pkr ?? user.pkrBalance ?? 0));
    setEditGold(Number(user.wallet?.gold ?? user.goldBalance ?? 0));
    setEditUSDT(Number(user.wallet?.usdt ?? user.usdtBalance ?? 0));

    setWalletModalOpen(true);
  };

  // ===================================================
  // CLOSE WALLET MODAL
  // ===================================================

  const closeWalletModal = () => {
    setWalletModalOpen(false);
    setSelectedUser(null);

    setEditPKR(0);
    setEditGold(0);
    setEditUSDT(0);
  };

  // ===================================================
  // UPDATE USER WALLET
  // POST /api/admin/users/:id/wallet
  // ===================================================

  const updateUserWallet = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/users/${selectedUser._id}/wallet`,
        {
          method: "POST",
          headers: adminHeaders,
          body: JSON.stringify({
            pkr: Number(editPKR),
            gold: Number(editGold),
            usdt: Number(editUSDT),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Wallet update failed.");
      }

      setMessage("Wallet updated successfully.");
      setMessageType("success");

      closeWalletModal();
      await loadUsersDashboard();

    } catch (error: any) {
      console.error("UPDATE WALLET ERROR:", error);

      setMessage(error.message || "Wallet update failed.");
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // FREEZE / UNFREEZE USER
  // POST /api/admin/users/:id/status
  // ===================================================

  const updateUserStatus = async (
    userId: string,
    status: "Active" | "Frozen"
  ) => {
    try {
      const response = await fetch(
        `${API}/api/admin/users/${userId}/status`,
        {
          method: "POST",
          headers: adminHeaders,
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Status update failed.");
      }

      setMessage(`User ${status.toLowerCase()} successfully.`);
      setMessageType("success");

      await loadUsersDashboard();

    } catch (error: any) {
      console.error("STATUS UPDATE ERROR:", error);

      setMessage(error.message || "Status update failed.");
      setMessageType("error");
    }
  };

  // ===================================================
  // DELETE USER
  // DELETE /api/admin/users/:id
  // ===================================================

  const deleteUser = async (userId: string) => {
    const confirmed = window.confirm(
      "Delete this user permanently?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: adminHeaders,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Delete failed.");
      }

      setMessage("User deleted successfully.");
      setMessageType("success");

      await loadUsersDashboard();

    } catch (error: any) {
      console.error("DELETE USER ERROR:", error);

      setMessage(error.message || "Delete failed.");
      setMessageType("error");
    }
  };

  // ===================================================
  // USER STATUS BADGE
  // ===================================================

  const getUserStatusClass = (status?: string) => {
    if ((status || "Active") === "Frozen") {
      return "text-red-400 bg-red-500/10 border border-red-500/30";
    }

    return "text-green-400 bg-green-500/10 border border-green-500/30";
  };

  // ===================================================
  // ROLE BADGE
  // ===================================================

  const getRoleClass = (role?: string) => {
    if ((role || "").toUpperCase() === "ADMIN") {
      return "text-red-400 bg-red-500/10 border border-red-500/30";
    }

    return "text-blue-400 bg-blue-500/10 border border-blue-500/30";
  };
    // =====================================================
  // PAGE UI START
  // =====================================================

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6">

      {/* ========================================== */}
      {/* PAGE HEADER */}
      {/* ========================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div>
          <h1 className="text-3xl font-bold text-yellow-400">
            GoldTrade V18 • Enterprise User Manager
          </h1>

          <p className="text-gray-400 mt-2">
            Welcome back,
            <span className="text-green-400 font-semibold ml-2">
              {adminName}
            </span>
          </p>

          <p className="text-gray-500 text-sm mt-1">
            Manage users, wallet balances and account status.
          </p>
        </div>

        <button
          onClick={refreshUsers}
          disabled={refreshing}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black font-semibold px-5 py-3 rounded-xl transition"
        >
          <RefreshCw
            size={18}
            className={refreshing ? "animate-spin" : ""}
          />

          {refreshing ? "Refreshing..." : "Refresh Users"}
        </button>

      </div>

      {/* ========================================== */}
      {/* SUCCESS / ERROR MESSAGE */}
      {/* ========================================== */}

      {message && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 border font-medium ${
            messageType === "success"
              ? "bg-green-600/20 border-green-500 text-green-300"
              : "bg-red-600/20 border-red-500 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl px-4 py-3 border border-red-600 bg-red-600/10 text-red-300">
          {error}
        </div>
      )}

      {/* ========================================== */}
      {/* STATISTICS CARDS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* TOTAL USERS */}

        <div className="rounded-2xl bg-[#111827] border border-blue-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <Users className="text-blue-400" size={28} />

            <span className="text-xs font-semibold text-blue-400">
              USERS
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Total Registered Users
          </p>

          <h2 className="text-3xl font-bold text-blue-400 mt-2">
            {statistics.totalUsers}
          </h2>

        </div>

        {/* ACTIVE USERS */}

        <div className="rounded-2xl bg-[#111827] border border-green-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <UserCheck className="text-green-400" size={28} />

            <span className="text-xs font-semibold text-green-400">
              ACTIVE
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Active Accounts
          </p>

          <h2 className="text-3xl font-bold text-green-400 mt-2">
            {statistics.activeUsers}
          </h2>

        </div>

        {/* FROZEN USERS */}

        <div className="rounded-2xl bg-[#111827] border border-red-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <UserX className="text-red-400" size={28} />

            <span className="text-xs font-semibold text-red-400">
              FROZEN
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Frozen Accounts
          </p>

          <h2 className="text-3xl font-bold text-red-400 mt-2">
            {statistics.frozenUsers}
          </h2>

        </div>

        {/* ADMIN */}

        <div className="rounded-2xl bg-[#111827] border border-purple-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <Shield className="text-purple-400" size={28} />

            <span className="text-xs font-semibold text-purple-400">
              ADMIN
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Logged-in Administrator
          </p>

          <h2 className="text-xl font-bold text-purple-400 mt-2 truncate">
            {adminName}
          </h2>

        </div>

      </div>

      {/* ========================================== */}
      {/* WALLET SUMMARY CARDS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        {/* PKR */}

        <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <DollarSign className="text-green-400" size={24} />

            <span className="text-green-400 text-xs font-semibold">
              PKR
            </span>
          </div>

          <h3 className="text-2xl font-bold text-green-400">
            PKR {formatMoney(statistics.totalPKR)}
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Total PKR Wallet Balance
          </p>

        </div>

        {/* GOLD */}

        <div className="rounded-2xl bg-[#111827] border border-yellow-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <Coins className="text-yellow-400" size={24} />

            <span className="text-yellow-400 text-xs font-semibold">
              GOLD
            </span>
          </div>

          <h3 className="text-2xl font-bold text-yellow-400">
            {statistics.totalGold.toFixed(3)} Gold
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Total Gold Wallet Balance
          </p>

        </div>

        {/* USDT */}

        <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <Wallet className="text-cyan-400" size={24} />

            <span className="text-cyan-400 text-xs font-semibold">
              USDT
            </span>
          </div>

          <h3 className="text-2xl font-bold text-cyan-400">
            {statistics.totalUSDT.toFixed(2)} USDT
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Total USDT Wallet Balance
          </p>

        </div>

      </div>

      {/* ========================================== */}
      {/* SEARCH BAR */}
      {/* ========================================== */}

      <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">

        <div className="relative">

          <Search
            size={20}
            className="absolute left-4 top-3.5 text-gray-500"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username or email..."
            className="w-full bg-[#1F2937] border border-gray-600 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-yellow-500 transition"
          />

        </div>

      </div>

      {/* ========================================== */}
      {/* USERS TABLE STARTS HERE */}
      {/* ========================================== */}

      <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden">

        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">

          <h2 className="text-xl font-bold text-yellow-400">
            User Management ({filteredUsers.length})
          </h2>

          <Users className="text-yellow-400" />

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1200px]">

            <thead className="bg-[#1F2937] text-gray-300 text-sm">

              <tr>

                <th className="text-left px-5 py-4">User</th>

                <th className="text-center">Role</th>

                <th className="text-center">Status</th>

                <th className="text-center">PKR</th>

                <th className="text-center">Gold</th>

                <th className="text-center">USDT</th>

                <th className="text-center">Joined</th>

                <th className="text-center">Actions</th>

              </tr>

            </thead>

            <tbody>
                            {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-gray-400"
                  >
                    Loading users...
                  </td>
                </tr>

              ) : filteredUsers.length === 0 ? (

                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-red-300"
                  >
                    No users found.
                  </td>
                </tr>

              ) : (

                filteredUsers.map((user) => (

                  <tr
                    key={user._id}
                    className="border-b border-gray-800 hover:bg-[#1B2435] transition"
                  >

                    {/* USER INFO */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-full bg-yellow-500/20 flex items-center justify-center">

                          <Users
                            size={20}
                            className="text-yellow-400"
                          />

                        </div>

                        <div>

                          <p className="font-semibold text-white">
                            {user.username}
                          </p>

                          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">

                            <Mail size={14} />

                            {user.email}

                          </div>

                        </div>

                      </div>

                    </td>

                    {/* ROLE */}

                    <td className="text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleClass(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>

                    </td>

                    {/* STATUS */}

                    <td className="text-center">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getUserStatusClass(
                          user.status
                        )}`}
                      >
                        {user.status || "Active"}
                      </span>

                    </td>

                    {/* PKR */}

                    <td className="text-center text-green-400 font-semibold">

                      PKR{" "}

                      {formatMoney(
                        Number(
                          user.wallet?.pkr ??
                            user.pkrBalance ??
                            0
                        )
                      )}

                    </td>

                    {/* GOLD */}

                    <td className="text-center text-yellow-400 font-semibold">

                      {Number(
                        user.wallet?.gold ??
                          user.goldBalance ??
                          0
                      ).toFixed(3)}{" "}

                      Gold

                    </td>

                    {/* USDT */}

                    <td className="text-center text-cyan-400 font-semibold">

                      {Number(
                        user.wallet?.usdt ??
                          user.usdtBalance ??
                          0
                      ).toFixed(2)}{" "}

                      USDT

                    </td>

                    {/* JOIN DATE */}

                    <td className="text-center text-gray-400 text-sm">

                      <div className="flex flex-col items-center gap-1">

                        <Calendar
                          size={14}
                          className="text-gray-500"
                        />

                        {formatDate(user.createdAt)}

                      </div>

                    </td>

                    {/* ACTION BUTTONS */}

                    <td className="px-4 py-4">

                      <div className="flex flex-wrap justify-center gap-2">

                        {/* VIEW */}

                        <button
                          onClick={() => setSelectedUser(user)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <Eye size={14} />
                          View
                        </button>

                        {/* EDIT WALLET */}

                        <button
                          onClick={() => openWalletModal(user)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <Edit size={14} />
                          Wallet
                        </button>

                        {/* FREEZE / UNFREEZE */}

                        {user.status === "Frozen" ? (

                          <button
                            onClick={() =>
                              updateUserStatus(
                                user._id,
                                "Active"
                              )
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                          >
                            <UserCheck size={14} />
                            Unfreeze
                          </button>

                        ) : (

                          <button
                            onClick={() =>
                              updateUserStatus(
                                user._id,
                                "Frozen"
                              )
                            }
                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                          >
                            <UserX size={14} />
                            Freeze
                          </button>

                        )}

                        {/* DELETE */}

                        <button
                          onClick={() => deleteUser(user._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))

              )}

            </tbody>
                      </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* WALLET EDIT MODAL */}
      {/* ========================================== */}

      {walletModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">

          <div className="w-full max-w-xl rounded-3xl bg-[#111827] border border-yellow-500/30 shadow-2xl overflow-hidden">

            {/* HEADER */}

            <div className="flex justify-between items-center px-6 py-5 border-b border-gray-700">

              <div>
                <h2 className="text-2xl font-bold text-yellow-400">
                  Edit Wallet Balance
                </h2>

                <p className="text-gray-400 text-sm mt-1">
                  {selectedUser.username}
                </p>
              </div>

              <button
                onClick={closeWalletModal}
                className="text-gray-400 hover:text-red-400 transition"
              >
                <XCircle size={28} />
              </button>

            </div>

            {/* BODY */}

            <div className="p-6 space-y-5">

              {/* USER INFO */}

              <div className="bg-[#1F2937] rounded-xl p-4">

                <p className="text-xs text-gray-400 mb-1">Username</p>

                <h3 className="font-semibold text-white text-lg">
                  {selectedUser.username}
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  {selectedUser.email}
                </p>

              </div>

              {/* PKR */}

              <div>

                <label className="block text-sm text-green-400 mb-2 font-medium">
                  PKR Wallet
                </label>

                <input
                  type="number"
                  value={editPKR}
                  onChange={(e) =>
                    setEditPKR(Number(e.target.value))
                  }
                  className="w-full rounded-xl bg-[#1F2937] border border-gray-600 px-4 py-3 outline-none focus:border-green-500 transition"
                />

              </div>

              {/* GOLD */}

              <div>

                <label className="block text-sm text-yellow-400 mb-2 font-medium">
                  GOLD Wallet
                </label>

                <input
                  type="number"
                  step="0.001"
                  value={editGold}
                  onChange={(e) =>
                    setEditGold(Number(e.target.value))
                  }
                  className="w-full rounded-xl bg-[#1F2937] border border-gray-600 px-4 py-3 outline-none focus:border-yellow-500 transition"
                />

              </div>

              {/* USDT */}

              <div>

                <label className="block text-sm text-cyan-400 mb-2 font-medium">
                  USDT Wallet
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={editUSDT}
                  onChange={(e) =>
                    setEditUSDT(Number(e.target.value))
                  }
                  className="w-full rounded-xl bg-[#1F2937] border border-gray-600 px-4 py-3 outline-none focus:border-cyan-500 transition"
                />

              </div>

            </div>

            {/* FOOTER */}

            <div className="border-t border-gray-700 px-6 py-5 flex justify-end gap-3">

              <button
                onClick={closeWalletModal}
                className="bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-xl font-semibold transition"
              >
                Cancel
              </button>

              <button
                onClick={updateUserWallet}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
              >
                <Save size={18} />
                Save Wallet
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* LOADING OVERLAY */}
      {/* ========================================== */}

      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">

          <div className="bg-[#111827] border border-yellow-500/30 rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-2xl">

            <RefreshCw
              size={36}
              className="animate-spin text-yellow-400"
            />

            <h3 className="text-xl font-bold text-yellow-400">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-300 text-sm">
              Processing request...
            </p>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* FOOTER */}
      {/* ========================================== */}

      <footer className="mt-10 border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">

        <div>

          <h3 className="text-yellow-400 font-bold">
            GoldTrade V18 Enterprise
          </h3>

          <p className="text-gray-500 text-sm">
            Admin User Management Module
          </p>

        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">

          <div className="flex items-center gap-2">
            <Shield size={16} className="text-green-400" />
            Secure User Management
          </div>

          <div className="flex items-center gap-2">
            <Wallet size={16} className="text-cyan-400" />
            PKR / GOLD / USDT Wallet Support
          </div>

          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            Enterprise Admin Panel
          </div>

        </div>

      </footer>

    </div>
  );
}