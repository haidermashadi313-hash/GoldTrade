"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Users,
  Shield,
  ShieldCheck,
  ShieldX,
  Wallet,
  Coins,
  DollarSign,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://goldtrade-api.onrender.com";

// ========================================
// TYPES
// ========================================

interface UserData {
  _id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  status: "Active" | "Blocked" | "Suspended";
  walletBalance: number;
  goldBalance: number;
  usdtBalance: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // ========================================
  // LOAD USERS
  // ========================================

  const loadUsers = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API}/api/admin/users`, {
        headers,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Users Load Error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, []);

  // ========================================
  // SEARCH + FILTER
  // ========================================

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchMatch =
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const roleMatch =
        roleFilter === "ALL" || user.role === roleFilter;

      const statusMatch =
        statusFilter === "ALL" || user.status === statusFilter;

      return searchMatch && roleMatch && statusMatch;
    });
  }, [users, search, roleFilter, statusFilter]);

  // ========================================
  // BLOCK / UNBLOCK USER
  // ========================================

  const updateStatus = async (
    id: string,
    status: "Active" | "Blocked"
  ) => {
    try {
      const response = await fetch(
        `${API}/api/admin/users/${id}/status`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await loadUsers();
      } else {
        alert(data.message || "Status update failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
  };

  // ========================================
  // CHANGE ROLE
  // ========================================

  const updateRole = async (
    id: string,
    role: "user" | "admin"
  ) => {
    try {
      const response = await fetch(
        `${API}/api/admin/users/${id}/role`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ role }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await loadUsers();
      } else {
        alert(data.message || "Role update failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
  };

  // ========================================
  // SUMMARY
  // ========================================

  const totalUsers = users.length;
  const activeUsers = users.filter(
    (user) => user.status === "Active"
  ).length;
  const blockedUsers = users.filter(
    (user) => user.status === "Blocked"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading Users...
      </main>
    );
  }  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <Users size={38} />
              User Management
            </h1>

            <p className="text-gray-400 mt-2">
              Manage GoldTrade V18 users, roles, wallets and account status.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin-dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <button
              onClick={loadUsers}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </header>

        {/* ================= SUMMARY CARDS ================= */}

        <section className="grid md:grid-cols-3 gap-5">
          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">
            <p className="text-gray-400">Total Users</p>

            <h2 className="text-3xl font-black text-cyan-400 mt-2">
              {totalUsers}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
            <p className="text-gray-400">Active Users</p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              {activeUsers}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-6">
            <p className="text-gray-400">Blocked Users</p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              {blockedUsers}
            </h2>
          </div>
        </section>

        {/* ================= SEARCH + FILTER ================= */}

        <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
          <div className="grid md:grid-cols-3 gap-4">

            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-gray-500"
                size={18}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username or email..."
                className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3"
            >
              <option value="ALL">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3"
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Blocked">Blocked</option>
              <option value="Suspended">Suspended</option>
            </select>

          </div>
        </section>

        {/* ================= USERS TABLE ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Registered Users
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-zinc-700 text-yellow-400">
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">PKR</th>
                  <th className="p-3">Gold</th>
                  <th className="p-3">USDT</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-6 text-center text-gray-500"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                    >

                      {/* User */}
                      <td className="p-3">
                        <p className="font-bold text-yellow-400">
                          {user.username}
                        </p>

                        <p className="text-xs text-gray-400">
                          {user.email}
                        </p>
                      </td>

                      {/* Role */}
                      <td className="p-3">
                        {user.role === "admin" ? (
                          <span className="flex items-center gap-2 text-cyan-400 font-semibold">
                            <ShieldCheck size={16} />
                            Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-gray-300 font-semibold">
                            <Shield size={16} />
                            User
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        {user.status === "Active" ? (
                          <span className="text-green-400 font-semibold">
                            Active
                          </span>
                        ) : (
                          <span className="text-red-400 font-semibold">
                            Blocked
                          </span>
                        )}
                      </td>

                      {/* Wallets */}
                      <td className="p-3 text-green-400 font-semibold">
                        <div className="flex items-center gap-2">
                          <Wallet size={16} />
                          {user.walletBalance.toLocaleString()}
                        </div>
                      </td>

                      <td className="p-3 text-yellow-400 font-semibold">
                        <div className="flex items-center gap-2">
                          <Coins size={16} />
                          {user.goldBalance.toFixed(2)}
                        </div>
                      </td>

                      <td className="p-3 text-blue-400 font-semibold">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} />
                          {user.usdtBalance.toFixed(2)}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="p-3 text-gray-500 whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2 justify-center">

                          {/* Role */}
                          {user.role === "user" ? (
                            <button
                              onClick={() =>
                                updateRole(user._id, "admin")
                              }
                              className="bg-cyan-600 hover:bg-cyan-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                              <ShieldCheck size={14} />
                              Make Admin
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                updateRole(user._id, "user")
                              }
                              className="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                              <Shield size={14} />
                              Make User
                            </button>
                          )}

                          {/* Status */}
                          {user.status === "Active" ? (
                            <button
                              onClick={() =>
                                updateStatus(user._id, "Blocked")
                              }
                              className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                              <ShieldX size={14} />
                              Block
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                updateStatus(user._id, "Active")
                              }
                              className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
                            >
                              <ShieldCheck size={14} />
                              Unblock
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>

        </section>

      </div>
    </main>
  );
}


