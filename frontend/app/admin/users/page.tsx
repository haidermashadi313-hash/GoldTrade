"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ShieldCheck,
  User,
  Wallet,
  Bitcoin,
  Ban,
  CheckCircle,
  Crown,
  Trash2,
  History,
} from "lucide-react";

const API = "http://localhost:5000";

interface UserData {
  _id: string;
  username: string;
  email: string;
  walletBalance: number;
  usdtBalance: number;
  role: string;
  status: string;
  createdAt: string;
}

interface HistoryItem {
  type: string;
  wallet: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyUser, setHistoryUser] = useState("");

  // -----------------------------
  // Load Users
  // -----------------------------
  const loadUsers = async () => {
    setLoading(true);

    const res = await fetch(`${API}/api/users`);
    const data = await res.json();

    if (data.success) {
      setUsers(data.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // -----------------------------
  // Search
  // -----------------------------
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();

      return (
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search]);

  // -----------------------------
  // Update Status
  // -----------------------------
  const updateStatus = async (
    id: string,
    status: string
  ) => {
    const res = await fetch(
      `${API}/api/users/${id}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      }
    );

    const data = await res.json();

    if (data.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? data.data : u
        )
      );
    } else {
      alert(data.message);
    }
  };

  // -----------------------------
  // Update Role
  // -----------------------------
  const updateRole = async (
    id: string,
    role: string
  ) => {
    const res = await fetch(
      `${API}/api/users/${id}/role`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      }
    );

    const data = await res.json();

    if (data.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? data.data : u
        )
      );
    }
  };

  // -----------------------------
  // Delete User
  // -----------------------------
  const deleteUser = async (id: string) => {
    const ok = confirm(
      "Delete this user permanently?"
    );

    if (!ok) return;

    const res = await fetch(
      `${API}/api/users/${id}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json();

    if (data.success) {
      setUsers((prev) =>
        prev.filter((u) => u._id !== id)
      );

      alert("User deleted.");
    } else {
      alert(data.message);
    }
  };

  // -----------------------------
  // Wallet History
  // -----------------------------
  const loadHistory = async (username: string) => {
    const res = await fetch(
      `${API}/api/users/${username}/history`
    );

    const data = await res.json();

    if (data.success) {
      setHistory(data.data);
      setHistoryUser(username);
    }
  };

  // -----------------------------
  // Summary
  // -----------------------------
  const totalWallet = users.reduce(
    (a, b) => a + b.walletBalance,
    0
  );

  const totalUSDT = users.reduce(
    (a, b) => a + b.usdtBalance,
    0
  );

  const activeUsers = users.filter(
    (u) => u.status === "Active"
  ).length;

  return (
    <main className="min-h-screen bg-black text-white p-8">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <div>
          <h1 className="text-4xl font-bold text-yellow-400 flex items-center gap-3">
            <ShieldCheck size={32}/>
            Admin Users Manager
          </h1>

          <p className="text-gray-400 mt-2">
            GoldTrade Finance & User Control Center
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="bg-yellow-500 text-black px-5 py-3 rounded-xl flex gap-2 font-bold"
        >
          <RefreshCw size={18}/>
          Refresh
        </button>

      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-5 mb-8">

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">
          <Wallet className="text-green-400 mb-3"/>
          <p>Total PKR Wallet</p>
          <h2 className="text-2xl font-bold text-green-400">
            PKR {totalWallet.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-5">
          <Bitcoin className="text-cyan-400 mb-3"/>
          <p>Total TRC20 Wallet</p>
          <h2 className="text-2xl font-bold text-cyan-400">
            {totalUSDT} USDT
          </h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
          <User className="text-yellow-400 mb-3"/>
          <p>Total Users</p>
          <h2 className="text-2xl font-bold text-yellow-400">
            {users.length}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-5">
          <CheckCircle className="text-blue-400 mb-3"/>
          <p>Active Users</p>
          <h2 className="text-2xl font-bold text-blue-400">
            {activeUsers}
          </h2>
        </div>

      </div>

      {/* Search */}
      <div className="relative mb-8">

        <Search className="absolute left-3 top-3 text-gray-500"/>

        <input
          placeholder="Search username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-yellow-500 rounded-xl p-3 pl-10"
        />

      </div>

      {/* Users Table */}
      <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5 overflow-x-auto">

        <table className="w-full">

          <thead className="border-b border-yellow-500 text-yellow-400">
            <tr className="text-left">
              <th>User</th>
              <th>Wallet</th>
              <th>USDT</th>
              <th>Status</th>
              <th>Role</th>
              <th>Finance</th>
              <th>History</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-10 text-center"
                >
                  Loading...
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className="border-b border-zinc-800"
                >

                  <td className="py-5">
                    <p className="font-bold">
                      {user.username}
                    </p>

                    <p className="text-xs text-gray-500">
                      {user.email}
                    </p>
                  </td>

                  <td className="text-green-400 font-bold">
                    PKR {user.walletBalance.toLocaleString()}
                  </td>

                  <td className="text-cyan-400 font-bold">
                    {user.usdtBalance} USDT
                  </td>

                  <td>
                    {user.status === "Active" ? (
                      <button
                        onClick={() =>
                          updateStatus(
                            user._id,
                            "Blocked"
                          )
                        }
                        className="bg-green-600 px-3 py-2 rounded-lg flex items-center gap-2"
                      >
                        <CheckCircle size={16}/>
                        Active
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          updateStatus(
                            user._id,
                            "Active"
                          )
                        }
                        className="bg-red-600 px-3 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Ban size={16}/>
                        Blocked
                      </button>
                    )}
                  </td>

                  <td>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        updateRole(
                          user._id,
                          e.target.value
                        )
                      }
                      className="bg-black border border-yellow-500 rounded-lg p-2"
                    >
                      <option value="user">
                        User
                      </option>

                      <option value="manager">
                        Manager
                      </option>

                      <option value="admin">
                        Admin
                      </option>
                    </select>
                  </td>

                  <td>
                    <button
                      onClick={() =>
                        (window.location.href = `/admin/wallets?user=${user.username}`)
                      }
                      className="bg-yellow-500 text-black px-3 py-2 rounded-lg font-semibold"
                    >
                      Manage Wallet
                    </button>
                  </td>

                  <td>
                    <button
                      onClick={() =>
                        loadHistory(user.username)
                      }
                      className="bg-blue-600 px-3 py-2 rounded-lg flex gap-2 items-center"
                    >
                      <History size={16}/>
                      View
                    </button>
                  </td>

                  <td>
                    <button
                      onClick={() =>
                        deleteUser(user._id)
                      }
                      className="bg-red-600 px-3 py-2 rounded-lg"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

      {/* History Drawer */}
      {historyUser && (
        <div className="mt-10 bg-zinc-900 border border-blue-500 rounded-3xl p-6">

          <h2 className="text-2xl font-bold text-blue-400 mb-5">
            Wallet History — {historyUser}
          </h2>

          {history.length === 0 ? (
            <p className="text-gray-500">
              No wallet history.
            </p>
          ) : (
            <div className="space-y-3">

              {history.map((item, index) => (
                <div
                  key={index}
                  className="bg-black border border-zinc-700 rounded-xl p-4 flex justify-between items-center"
                >

                  <div>

                    <p className="font-semibold">
                      {item.type}
                    </p>

                    <p className="text-xs text-gray-500">
                      {item.wallet}
                    </p>

                    <p className="text-xs text-yellow-400">
                      {item.reason || "No Reason"}
                    </p>

                  </div>

                  <div className="text-right">

                    <p
                      className={`font-bold ${
                        item.type.includes("Credit")
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {item.type.includes("Credit")
                        ? "+"
                        : "-"}
                      {item.amount}
                    </p>

                    <p className="text-xs text-gray-500">
                      {new Date(
                        item.createdAt
                      ).toLocaleString()}
                    </p>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      )}

    </main>
  );
}