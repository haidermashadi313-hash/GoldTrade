"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Crown,
  Lock,
  Ban,
  Eye,
  LogOut,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

/* ============================================
   TYPES
============================================ */

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;

  walletBalance: number;
  usdtBalance: number;
  goldBalance: number;

  cashbackEarned: number;
  referralBonus: number;
  goldProfitLoss: number;

  vipLevel: "Standard" | "Silver" | "Gold" | "Diamond";

  status: "Active" | "Blocked";
  walletFrozen: boolean;

  totalDeposit: number;
  totalWithdraw: number;

  createdAt: string;
}

export default function AdminUsersPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  const role =
    typeof window !== "undefined"
      ? localStorage.getItem("role")
      : "";

  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [walletType, setWalletType] = useState("PKR");
  const [walletAction, setWalletAction] = useState("add");
  const [walletAmount, setWalletAmount] = useState("");
  const [walletReason, setWalletReason] = useState("");

  const [vipLevel, setVipLevel] = useState<User["vipLevel"]>("Standard");
  const [historyLoading, setHistoryLoading] = useState(false);

  const [userHistory, setUserHistory] = useState({
    trades: [],
    deposits: [],
    withdrawals: [],
    cashback: [],
    referrals: [],
  });

  /* ============================================
     LOAD USERS
  ============================================ */

  const loadUsers = async () => {
    try {
      setLoading(true);

      if (!token) {
        window.location.href = "/login";
        return;
      }

      if (role !== "admin") {
        alert("Admin access only.");
        window.location.href = "/dashboard";
        return;
      }

      const response = await fetch(`${API}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
      } else {
        alert(data.message || "Unable to load users.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while loading users.");
    } finally {
      setLoading(false);
    }
  };

  const updateWallet = async () => {
    if (!selectedUser) return;

    const amount = Number(walletAmount);

    if (!walletAmount || Number.isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!walletReason.trim()) {
      alert("Please provide an admin reason.");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/admin/users/${selectedUser._id}/wallet`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletType,
            action: walletAction,
            amount,
            reason: walletReason,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Wallet update successful.");
        setWalletAmount("");
        setWalletReason("");
        await loadUsers();
        setSelectedUser({ ...selectedUser });
      } else {
        alert(data.message || "Unable to update wallet.");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to update wallet.");
    }
  };

  const toggleWalletFreeze = async () => {
    if (!selectedUser) return;

    const action = selectedUser.walletFrozen ? "unfreeze" : "freeze";

    if (!confirm(`Are you sure you want to ${action} this wallet?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/admin/users/${selectedUser._id}/freeze`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(`Wallet ${action}d successfully.`);
        await loadUsers();
        setSelectedUser({
          ...selectedUser,
          walletFrozen: !selectedUser.walletFrozen,
        });
      } else {
        alert(data.message || "Unable to update wallet status.");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to update wallet status.");
    }
  };

  const toggleUserBlock = async () => {
    if (!selectedUser) return;

    const action =
      selectedUser.status === "Blocked" ? "unblock" : "block";

    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/admin/users/${selectedUser._id}/block`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(`User ${action}ed successfully.`);
        await loadUsers();
        setSelectedUser({
          ...selectedUser,
          status:
            selectedUser.status === "Blocked"
              ? "Active"
              : "Blocked",
        });
      } else {
        alert(data.message || "Unable to update account status.");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to update account status.");
    }
  };

  const loadUserHistory = async (userId: string) => {
    try {
      setHistoryLoading(true);

      const response = await fetch(
        `${API}/api/admin/users/${userId}/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setUserHistory({
          trades: data.trades || [],
          deposits: data.deposits || [],
          withdrawals: data.withdrawals || [],
          cashback: data.cashback || [],
          referrals: data.referrals || [],
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateVipLevel = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `${API}/api/admin/users/${selectedUser._id}/vip`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ vipLevel }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("VIP Level Updated Successfully.");
        await loadUsers();
        setSelectedUser({ ...selectedUser, vipLevel });
      } else {
        alert(data.message || "Unable to update VIP level.");
      }
    } catch (err) {
      console.error(err);
      alert("Unable to update VIP level.");
    }
  };

  /* ============================================
     PAGE LOAD
  ============================================ */

  useEffect(() => {
    loadUsers();
  }, []);

  /* ============================================
     AUTO REFRESH EVERY 30 SEC
  ============================================ */

  useEffect(() => {
    const interval = setInterval(loadUsers, 30000);

    return () => clearInterval(interval);
  }, []);

  /* ============================================
     SEARCH USERS
  ============================================ */

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const keyword = search.toLowerCase();

      return (
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  /* ============================================
     PAGINATION
  ============================================ */

  const totalPages = Math.ceil(
    filteredUsers.length / usersPerPage
  );

  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  /* ============================================
     USER STATISTICS
  ============================================ */

  const statistics = useMemo(() => {
    return {
      totalUsers: users.length,

      activeUsers: users.filter(
        (u) => u.status === "Active"
      ).length,

      blockedUsers: users.filter(
        (u) => u.status === "Blocked"
      ).length,

      frozenWallets: users.filter(
        (u) => u.walletFrozen
      ).length,

      vipUsers: users.filter(
        (u) => u.vipLevel !== "Standard"
      ).length,
    };
  }, [users]);

  /* ============================================
     LOGOUT
  ============================================ */

  const logoutAdmin = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  useEffect(() => {
    if (selectedUser) {
      setVipLevel(selectedUser.vipLevel);
      loadUserHistory(selectedUser._id);
    }
  }, [selectedUser]);

  /* ============================================
     LOADING SCREEN
  ============================================ */

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" />
        Loading User Manager...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* PAGE HEADER */}

        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">

          <div>
            <h1 className="text-4xl font-black text-yellow-400">
              User Manager
            </h1>

            <p className="text-gray-400 mt-2">
              Manage GoldTrade users, wallets and VIP accounts.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              onClick={loadUsers}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw size={18}/>
              Refresh
            </button>

            <button
              onClick={logoutAdmin}
              className="bg-red-600 hover:bg-red-500 px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <LogOut size={18}/>
              Logout
            </button>

          </div>

        </div>

        {/* SEARCH BAR */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-4 mb-8">

          <div className="flex items-center gap-3">

            <Search className="text-yellow-400"/>

            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by username or email..."
              className="w-full bg-transparent outline-none text-white placeholder:text-gray-500"
            />

          </div>

        </div>

        {/* ================= USER STATISTICS ================= */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          {/* Total Users */}
          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Users className="text-yellow-400" size={30}/>
              <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                TOTAL
              </span>
            </div>

            <p className="text-gray-400 text-sm">Registered Users</p>

            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              {statistics.totalUsers}
            </h2>
          </div>

          {/* Active Users */}
          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <ShieldCheck className="text-green-400" size={30}/>
              <span className="bg-green-600 px-2 py-1 rounded-full text-xs font-bold">
                ACTIVE
              </span>
            </div>

            <p className="text-gray-400 text-sm">Active Accounts</p>

            <h2 className="text-4xl font-black text-green-400 mt-2">
              {statistics.activeUsers}
            </h2>
          </div>

          {/* Blocked Users */}
          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Ban className="text-red-400" size={30}/>
              <span className="bg-red-600 px-2 py-1 rounded-full text-xs font-bold">
                BLOCKED
              </span>
            </div>

            <p className="text-gray-400 text-sm">Blocked Accounts</p>

            <h2 className="text-4xl font-black text-red-400 mt-2">
              {statistics.blockedUsers}
            </h2>
          </div>

          {/* Frozen Wallets */}
          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Lock className="text-cyan-400" size={30}/>
              <span className="bg-cyan-600 px-2 py-1 rounded-full text-xs font-bold">
                FROZEN
              </span>
            </div>

            <p className="text-gray-400 text-sm">Frozen Wallets</p>

            <h2 className="text-4xl font-black text-cyan-400 mt-2">
              {statistics.frozenWallets}
            </h2>
          </div>

        </div>

        {/* ================= VIP + WALLET ANALYTICS ================= */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

          {/* VIP Users */}
          <div className="bg-zinc-900 border border-yellow-400 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Crown className="text-yellow-400" size={30}/>
              <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                VIP
              </span>
            </div>

            <p className="text-gray-400 text-sm">Silver • Gold • Diamond</p>

            <h2 className="text-4xl font-black text-yellow-400 mt-2">
              {statistics.vipUsers}
            </h2>
          </div>

          {/* Total PKR Wallet */}
          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Wallet className="text-green-400" size={30}/>
              <span className="bg-green-600 px-2 py-1 rounded-full text-xs font-bold">
                PKR
              </span>
            </div>

            <p className="text-gray-400 text-sm">Total Wallet Balance</p>

            <h2 className="text-2xl font-black text-green-400 mt-2">
              PKR{" "}
              {users
                .reduce((sum, user) => sum + (user.walletBalance ?? 0), 0)
                .toLocaleString()}
            </h2>
          </div>

          {/* Total Gold Holdings */}
          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Wallet className="text-orange-400" size={30}/>
              <span className="bg-orange-600 px-2 py-1 rounded-full text-xs font-bold">
                GOLD
              </span>
            </div>

            <p className="text-gray-400 text-sm">Total Gold Holdings</p>

            <h2 className="text-2xl font-black text-orange-400 mt-2">
              {users
                .reduce((sum, user) => sum + (user.goldBalance ?? 0), 0)
                .toFixed(2)}{" "}
              Gram
            </h2>
          </div>

          {/* Total USDT */}
          <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">
            <div className="flex justify-between items-center mb-3">
              <Wallet className="text-blue-400" size={30}/>
              <span className="bg-blue-600 px-2 py-1 rounded-full text-xs font-bold">
                USDT
              </span>
            </div>

            <p className="text-gray-400 text-sm">Total USDT Holdings</p>

            <h2 className="text-2xl font-black text-blue-400 mt-2">
              {users
                .reduce((sum, user) => sum + (user.usdtBalance ?? 0), 0)
                .toFixed(2)}{" "}
              USDT
            </h2>
          </div>

        </div>

        {/* ================= PLATFORM SUMMARY ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Users className="text-yellow-400" size={30}/>
            <h2 className="text-3xl font-black text-yellow-400">
              GoldTrade User Summary
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="bg-black rounded-xl p-4 border border-zinc-700">
              <p className="text-gray-400 text-sm">Total Deposits</p>
              <h3 className="text-xl font-bold text-green-400 mt-2">
                PKR{" "}
                {users
                  .reduce((sum, user) => sum + (user.totalDeposit ?? 0), 0)
                  .toLocaleString()}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-4 border border-zinc-700">
              <p className="text-gray-400 text-sm">Total Withdrawals</p>
              <h3 className="text-xl font-bold text-red-400 mt-2">
                PKR{" "}
                {users
                  .reduce((sum, user) => sum + (user.totalWithdraw ?? 0), 0)
                  .toLocaleString()}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-4 border border-zinc-700">
              <p className="text-gray-400 text-sm">Cashback Paid</p>
              <h3 className="text-xl font-bold text-pink-400 mt-2">
                PKR{" "}
                {users
                  .reduce((sum, user) => sum + (user.cashbackEarned ?? 0), 0)
                  .toLocaleString()}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-4 border border-zinc-700">
              <p className="text-gray-400 text-sm">Referral Bonus Paid</p>
              <h3 className="text-xl font-bold text-cyan-400 mt-2">
                PKR{" "}
                {users
                  .reduce((sum, user) => sum + (user.referralBonus ?? 0), 0)
                  .toLocaleString()}
              </h3>
            </div>

          </div>

        </div>        {/* ================= USERS TABLE ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

            <div>
              <h2 className="text-3xl font-black text-yellow-400">
                GoldTrade Users
              </h2>

              <p className="text-gray-400">
                {filteredUsers.length} Users Found
              </p>
            </div>

            <span className="bg-yellow-500 text-black px-4 py-2 rounded-full font-bold">
              Page {currentPage} / {totalPages || 1}
            </span>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1050px]">

              <thead className="bg-black text-yellow-400">

                <tr className="text-left">

                  <th className="p-3">User</th>
                  <th className="p-3">Wallet</th>
                  <th className="p-3">Gold</th>
                  <th className="p-3">VIP</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Wallet Lock</th>
                  <th className="p-3">Joined</th>
                  <th className="p-3 text-center">Action</th>

                </tr>

              </thead>

              <tbody>

                {currentUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (

                    <tr
                      key={user._id}
                      className="border-b border-zinc-800 hover:bg-black transition"
                    >

                      {/* USER */}

                      <td className="p-3">

                        <div className="flex flex-col">

                          <span className="font-bold text-white">
                            {user.username}
                          </span>

                          <span className="text-gray-400 text-xs">
                            {user.email}
                          </span>

                        </div>

                      </td>

                      {/* PKR WALLET */}

                      <td className="p-3">

                        <span className="font-bold text-green-400">
                          PKR {(user.walletBalance ?? 0).toLocaleString()}
                        </span>

                      </td>

                      {/* GOLD */}

                      <td className="p-3">

                        <span className="font-bold text-yellow-400">
                          {(user.goldBalance ?? 0).toFixed(2)} g
                        </span>

                      </td>

                      {/* VIP */}

                      <td className="p-3">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold
                            ${
                              user.vipLevel === "Diamond"
                                ? "bg-cyan-500 text-black"
                                : user.vipLevel === "Gold"
                                ? "bg-yellow-500 text-black"
                                : user.vipLevel === "Silver"
                                ? "bg-gray-300 text-black"
                                : "bg-zinc-700 text-white"
                            }
                          `}
                        >
                          {user.vipLevel}
                        </span>

                      </td>

                      {/* ACCOUNT STATUS */}

                      <td className="p-3">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold
                            ${
                              user.status === "Blocked"
                                ? "bg-red-600 text-white"
                                : "bg-green-600 text-white"
                            }
                          `}
                        >
                          {user.status}
                        </span>

                      </td>

                      {/* WALLET FREEZE */}

                      <td className="p-3">

                        {user.walletFrozen ? (
                          <span className="bg-cyan-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Frozen
                          </span>
                        ) : (
                          <span className="bg-green-700 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Active
                          </span>
                        )}

                      </td>

                      {/* JOIN DATE */}

                      <td className="p-3 text-gray-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* ACTION */}

                      <td className="p-3 text-center">

                        <button
                          onClick={() => setSelectedUser(user)}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 mx-auto"
                        >
                          <Eye size={16}/>
                          View
                        </button>

                      </td>

                    </tr>

                  ))
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ================= PAGINATION ================= */}

        <div className="flex justify-center items-center gap-2 mb-10 flex-wrap">

          <button
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage((prev) => Math.max(prev - 1, 1))
            }
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-4 py-2 rounded-lg text-white font-bold"
          >
            Previous
          </button>

          {Array.from({ length: totalPages || 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded-lg font-bold ${
                currentPage === i + 1
                  ? "bg-yellow-500 text-black"
                  : "bg-zinc-800 hover:bg-zinc-700 text-white"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, totalPages)
              )
            }
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 px-4 py-2 rounded-lg text-white font-bold"
          >
            Next
          </button>

        </div>        {/* ================= USER DETAIL MODAL ================= */}

        {selectedUser && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">

            <div className="bg-zinc-900 border border-yellow-500 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">

              {/* Header */}

              <div className="flex justify-between items-center p-6 border-b border-zinc-700">

                <div>
                  <h2 className="text-3xl font-black text-yellow-400">
                    User Details
                  </h2>

                  <p className="text-gray-400 mt-1">
                    Complete GoldTrade User Profile
                  </p>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg font-bold"
                >
                  Close
                </button>

              </div>

              <div className="p-6 space-y-6">

                {/* Profile Card */}

                <div className="bg-black border border-yellow-500 rounded-3xl p-6">

                  <div className="flex items-center gap-5 flex-wrap">

                    <div className="w-24 h-24 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-black text-4xl font-black">
                        {selectedUser.username.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex-1">

                      <h3 className="text-3xl font-black text-yellow-400">
                        {selectedUser.username}
                      </h3>

                      <p className="text-gray-400">
                        {selectedUser.email}
                      </p>

                      <div className="flex gap-3 mt-3 flex-wrap">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            selectedUser.status === "Blocked"
                              ? "bg-red-600 text-white"
                              : "bg-green-600 text-white"
                          }`}
                        >
                          {selectedUser.status}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            selectedUser.walletFrozen
                              ? "bg-cyan-600 text-white"
                              : "bg-green-700 text-white"
                          }`}
                        >
                          {selectedUser.walletFrozen
                            ? "Wallet Frozen"
                            : "Wallet Active"}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            selectedUser.vipLevel === "Diamond"
                              ? "bg-cyan-500 text-black"
                              : selectedUser.vipLevel === "Gold"
                              ? "bg-yellow-500 text-black"
                              : selectedUser.vipLevel === "Silver"
                              ? "bg-gray-300 text-black"
                              : "bg-zinc-700 text-white"
                          }`}
                        >
                          VIP {selectedUser.vipLevel}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

                {/* Wallet Overview */}

                <div>

                  <h3 className="text-2xl font-black text-yellow-400 mb-4">
                    Wallet Overview
                  </h3>

                  <div className="grid md:grid-cols-3 gap-5">

                    <div className="bg-black border border-green-600 rounded-2xl p-5">

                      <p className="text-gray-400 text-sm">
                        PKR Wallet
                      </p>

                      <h2 className="text-3xl font-black text-green-400 mt-2">
                        PKR {(selectedUser.walletBalance ?? 0).toLocaleString()}
                      </h2>

                    </div>

                    <div className="bg-black border border-blue-600 rounded-2xl p-5">

                      <p className="text-gray-400 text-sm">
                        USDT Wallet
                      </p>

                      <h2 className="text-3xl font-black text-blue-400 mt-2">
                        {(selectedUser.usdtBalance ?? 0).toFixed(2)} USDT
                      </h2>

                    </div>

                    <div className="bg-black border border-yellow-600 rounded-2xl p-5">

                      <p className="text-gray-400 text-sm">
                        Gold Wallet
                      </p>

                      <h2 className="text-3xl font-black text-yellow-400 mt-2">
                        {(selectedUser.goldBalance ?? 0).toFixed(2)} Gram
                      </h2>

                    </div>

                  </div>

                </div>

                {/* Rewards */}

                <div>

                  <h3 className="text-2xl font-black text-pink-400 mb-4">
                    Rewards & Earnings
                  </h3>

                  <div className="grid md:grid-cols-3 gap-5">

                    <div className="bg-black border border-pink-500 rounded-2xl p-5">

                      <p className="text-gray-400 text-sm">
                        Cashback Earned
                      </p>

                      <h2 className="text-2xl font-black text-pink-400 mt-2">
                        PKR {(selectedUser.cashbackEarned ?? 0).toLocaleString()}
                      </h2>

                    </div>

                    <div className="bg-black border border-cyan-500 rounded-2xl p-5">

                      <p className="text-gray-400 text-sm">
                        Referral Bonus
                      </p>

                      <h2 className="text-2xl font-black text-cyan-400 mt-2">
                        PKR {(selectedUser.referralBonus ?? 0).toLocaleString()}
                      </h2>

                    </div>

                    <div className="bg-black border border-purple-500 rounded-2xl p-5">

                      <p className="text-gray-400 text-sm">
                        Trading Profit / Loss
                      </p>

                      <h2
                        className={`text-2xl font-black mt-2 ${
                          (selectedUser.goldProfitLoss ?? 0) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        PKR {(selectedUser.goldProfitLoss ?? 0).toLocaleString()}
                      </h2>

                    </div>

                  </div>

                </div>

                {/* Deposit / Withdraw Summary */}
{/* ================= WALLET MANAGER ================= */}

<div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">

  <h3 className="text-2xl font-black text-green-400 mb-5">
    Admin Wallet Manager
  </h3>

  <div className="grid md:grid-cols-2 gap-5">

    {/* Wallet Type */}

    <div>
      <label className="block text-sm text-gray-400 mb-2">
        Wallet Type
      </label>

      <select
        value={walletType}
        onChange={(e) => setWalletType(e.target.value)}
        className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
      >
        <option value="PKR">PKR Wallet</option>
        <option value="USDT">USDT Wallet</option>
        <option value="GOLD">Gold Wallet</option>
      </select>
    </div>

    {/* Action */}

    <div>
      <label className="block text-sm text-gray-400 mb-2">
        Wallet Action
      </label>

      <select
        value={walletAction}
        onChange={(e) => setWalletAction(e.target.value)}
        className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
      >
        <option value="add">➕ Add Balance</option>
        <option value="minus">➖ Minus Balance</option>
      </select>
    </div>

    {/* Amount */}

    <div>
      <label className="block text-sm text-gray-400 mb-2">
        Amount
      </label>

      <input
        type="number"
        value={walletAmount}
        onChange={(e) => setWalletAmount(e.target.value)}
        placeholder="Enter amount"
        className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
      />
    </div>

    {/* Reason */}

    <div>
      <label className="block text-sm text-gray-400 mb-2">
        Admin Reason
      </label>

      <input
        type="text"
        value={walletReason}
        onChange={(e) => setWalletReason(e.target.value)}
        placeholder="Example: Cashback adjustment"
        className="w-full bg-black border border-zinc-700 rounded-xl p-3 text-white"
      />
    </div>

  </div>

  {/* Buttons */}

  <div className="flex gap-4 mt-6 flex-wrap">

    <button
      onClick={updateWallet}
      className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl font-bold"
    >
      Save Wallet Update
    </button>

    <button
      onClick={() => {
        setWalletAmount("");
        setWalletReason("");
      }}
      className="bg-zinc-700 hover:bg-zinc-600 px-6 py-3 rounded-xl font-bold"
    >
      Reset
    </button>

  </div>

</div>
                <div>

                  <h3 className="text-2xl font-black text-yellow-400 mb-4">
                    Financial Summary
                  </h3>

                  <div className="grid md:grid-cols-2 gap-5">

                    <div className="bg-black border border-green-600 rounded-2xl p-5">

                      <p className="text-gray-400 text-sm">
                        Total Deposits
                      </p>

                      <h2 className="text-3xl font-black text-green-400 mt-2">
                        PKR {(selectedUser.totalDeposit ?? 0).toLocaleString()}
                      </h2>

                    </div>

                    <div className="bg-black border border-red-600 rounded-2xl p-5">

                      <p className="text-gray-400 text-sm">
                        Total Withdrawals
                      </p>

                      <h2 className="text-3xl font-black text-red-400 mt-2">
                        PKR {(selectedUser.totalWithdraw ?? 0).toLocaleString()}
                      </h2>

                    </div>

                  </div>

                </div>

                {/* Account Information */}

                <div>

                  <h3 className="text-2xl font-black text-yellow-400 mb-4">
                    Account Information
                  </h3>

                  <div className="grid md:grid-cols-2 gap-5">

                    <div className="bg-black rounded-xl p-4 border border-zinc-700">
                      <p className="text-gray-400 text-sm">Role</p>
                      <h3 className="font-bold capitalize mt-1">
                        {selectedUser.role}
                      </h3>
                    </div>

                    <div className="bg-black rounded-xl p-4 border border-zinc-700">
                      <p className="text-gray-400 text-sm">VIP Level</p>
                      <h3 className="font-bold text-yellow-400 mt-1">
                        {selectedUser.vipLevel}
                      </h3>
                    </div>

                    <div className="bg-black rounded-xl p-4 border border-zinc-700">
                      <p className="text-gray-400 text-sm">
                        Account Status
                      </p>
                      <h3 className="font-bold mt-1">
                        {selectedUser.status}
                      </h3>
                    </div>

                    <div className="bg-black rounded-xl p-4 border border-zinc-700">
                      <p className="text-gray-400 text-sm">
                        Wallet Status
                      </p>
                      <h3 className="font-bold mt-1">
                        {selectedUser.walletFrozen
                          ? "Frozen"
                          : "Active"}
                      </h3>
                    </div>

                    <div className="bg-black rounded-xl p-4 border border-zinc-700 md:col-span-2">
                      <p className="text-gray-400 text-sm">
                        Account Created
                      </p>
                      <h3 className="font-bold mt-1">
                        {new Date(selectedUser.createdAt).toLocaleString()}
                      </h3>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
)}        {/* ================= QUICK ACTION CENTER ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-yellow-400" size={30}/>
            <h2 className="text-3xl font-black text-yellow-400">
              Admin Quick Actions
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <Link
              href="/admin/dashboard"
              className="bg-black border border-yellow-500 rounded-2xl p-5 hover:bg-zinc-800 transition"
            >
              <ShieldCheck className="text-yellow-400 mb-3" size={28}/>
              <h3 className="font-bold text-yellow-400">
                Dashboard
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                Return to Admin Dashboard.
              </p>
            </Link>

            <Link
              href="/admin/deposits"
              className="bg-black border border-green-500 rounded-2xl p-5 hover:bg-zinc-800 transition"
            >
              <Wallet className="text-green-400 mb-3" size={28}/>
              <h3 className="font-bold text-green-400">
                Deposit Manager
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                Approve pending deposits.
              </p>
            </Link>

            <Link
              href="/admin/withdrawals"
              className="bg-black border border-red-500 rounded-2xl p-5 hover:bg-zinc-800 transition"
            >
              <Wallet className="text-red-400 mb-3" size={28}/>
              <h3 className="font-bold text-red-400">
                Withdrawal Manager
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                Approve pending withdrawals.
              </p>
            </Link>

            <Link
              href="/admin/settings"
              className="bg-black border border-blue-500 rounded-2xl p-5 hover:bg-zinc-800 transition"
            >
              <Crown className="text-blue-400 mb-3" size={28}/>
              <h3 className="font-bold text-blue-400">
                Platform Settings
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                Gold prices, cashback, VIP and Lucky Draw.
              </p>
            </Link>

          </div>

        </div>

        {/* ================= EXPORT USERS ================= */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center flex-wrap gap-4">

            <div>
              <h2 className="text-2xl font-black text-cyan-400">
                Export Users
              </h2>

              <p className="text-gray-400">
                Download all registered users as CSV.
              </p>
            </div>

            <button
              onClick={() => {
                const headers = [
                  "Username",
                  "Email",
                  "VIP",
                  "Wallet PKR",
                  "USDT",
                  "Gold Gram",
                  "Status",
                  "Wallet Frozen",
                ];

                const rows = users.map((u) => [
                  u.username,
                  u.email,
                  u.vipLevel,
                  u.walletBalance,
                  u.usdtBalance,
                  u.goldBalance,
                  u.status,
                  u.walletFrozen ? "Yes" : "No",
                ]);

                const csv = [
                  headers.join(","),
                  ...rows.map((r) => r.join(",")),
                ].join("\n");

                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });

                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");

                link.href = url;
                link.download = "GoldTrade_Users.csv";
                link.click();

                URL.revokeObjectURL(url);
              }}
              className="bg-cyan-600 hover:bg-cyan-500 px-6 py-3 rounded-xl font-bold"
            >
              Export CSV
            </button>

          </div>

        </div>

        {/* ================= ADMIN TOOLS ================= */}

        <div className="grid md:grid-cols-2 gap-6 mb-10">

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

            <h3 className="text-2xl font-black text-green-400 mb-4">
              Refresh Platform
            </h3>

            <p className="text-gray-400 mb-5">
              Reload latest users and balances from the server.
            </p>

            <button
              onClick={loadUsers}
              className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold flex justify-center items-center gap-2"
            >
              <RefreshCw size={18}/>
              Refresh Users
            </button>

          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">

            <h3 className="text-2xl font-black text-red-400 mb-4">
              Logout Administrator
            </h3>

            <p className="text-gray-400 mb-5">
              End current administrator session securely.
            </p>

            <button
              onClick={logoutAdmin}
              className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold flex justify-center items-center gap-2"
            >
              <LogOut size={18}/>
              Secure Logout
            </button>

          </div>

        </div>

        {/* ================= SYSTEM SUMMARY ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <h2 className="text-3xl font-black text-yellow-400 mb-6">
            GoldTrade User Management Summary
          </h2>

          <div className="grid md:grid-cols-3 gap-5">

            <div className="bg-black rounded-xl p-5 border border-yellow-500">
              <p className="text-gray-400 text-sm">Registered Users</p>
              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                {statistics.totalUsers}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-green-600">
              <p className="text-gray-400 text-sm">VIP Members</p>
              <h3 className="text-3xl font-black text-green-400 mt-2">
                {statistics.vipUsers}
              </h3>
            </div>

            <div className="bg-black rounded-xl p-5 border border-cyan-600">
              <p className="text-gray-400 text-sm">Frozen Wallets</p>
              <h3 className="text-3xl font-black text-cyan-400 mt-2">
                {statistics.frozenWallets}
              </h3>
            </div>

          </div>

        </div>

        {/* ================= FOOTER ================= */}

        <footer className="border-t border-yellow-500 pt-8 pb-6">

          <div className="grid md:grid-cols-3 gap-6 mb-8">

            <div>
              <h3 className="text-yellow-400 font-black text-2xl mb-3">
                GoldTrade Admin
              </h3>

              <p className="text-gray-400 text-sm">
                User Management Control Panel for GoldTrade Platform.
              </p>
            </div>

            <div>
              <h3 className="text-yellow-400 font-bold mb-3">
                Administrator Tools
              </h3>

              <ul className="space-y-2 text-sm text-gray-400">
                <li>User Manager</li>
                <li>Wallet Manager</li>
                <li>VIP Manager</li>
                <li>Freeze / Block Control</li>
                <li>Trading History Viewer</li>
              </ul>
            </div>

            <div>
              <h3 className="text-yellow-400 font-bold mb-3">
                Security
              </h3>

              <ul className="space-y-2 text-sm text-gray-400">
                <li>JWT Protected</li>
                <li>Admin Role Protected</li>
                <li>Wallet Audit Ready</li>
                <li>Live User Refresh</li>
              </ul>
            </div>

          </div>

          <div className="border-t border-zinc-700 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">

            <p className="text-gray-500 text-sm">
              © 2026 GoldTrade User Manager — Production Version V12
            </p>

            <div className="flex gap-4 text-sm">

              <Link
                href="/admin/dashboard"
                className="text-gray-400 hover:text-yellow-400"
              >
                Dashboard
              </Link>

              <Link
                href="/admin/settings"
                className="text-gray-400 hover:text-yellow-400"
              >
                Settings
              </Link>

              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-yellow-400"
              >
                User Dashboard
              </Link>

            </div>

          </div>

        </footer>

      </div>
    </main>
  );
}