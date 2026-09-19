"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  Search,
  RefreshCw,
  User,
  DollarSign,
  Coins,
  Save,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://goldtrade-api.onrender.com";

// ========================================
// TYPES
// ========================================

interface UserWallet {
  _id: string;
  username: string;
  email: string;
  walletBalance: number;
  goldBalance: number;
  usdtBalance: number;
  walletFrozen: boolean;
}

export default function WalletManagerPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [users, setUsers] = useState<UserWallet[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] =
    useState<UserWallet | null>(null);

  const [walletBalance, setWalletBalance] = useState(0);
  const [goldBalance, setGoldBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [walletFrozen, setWalletFrozen] = useState(false);

  const [saving, setSaving] = useState(false);

  // ========================================
  // LOAD USERS
  // ========================================

  const loadUsers = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/users`,
        {
          headers,
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Wallet Manager Error:", err);
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
  // SEARCH USERS
  // ========================================

  const filteredUsers = useMemo(() => {
    return users.filter((user) =>
      `${user.username} ${user.email}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [users, search]);

  // ========================================
  // SELECT USER
  // ========================================

  const selectUser = (user: UserWallet) => {
    setSelectedUser(user);
    setWalletBalance(user.walletBalance);
    setGoldBalance(user.goldBalance);
    setUsdtBalance(user.usdtBalance);
    setWalletFrozen(user.walletFrozen);
  };

  // ========================================
  // UPDATE WALLET
  // ========================================

  const updateWallet = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);

      const response = await fetch(
        `${API}/api/admin/wallet/update/${selectedUser._id}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            walletBalance,
            goldBalance,
            usdtBalance,
            walletFrozen,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await loadUsers();
        alert("Wallet updated successfully.");
      } else {
        alert(data.message || "Wallet update failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading Wallet Manager...
      </main>
    );
  }  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <Wallet size={38} />
              Wallet Manager
            </h1>

            <p className="text-gray-400 mt-2">
              Manage PKR, Gold & USDT wallet balances for all users.
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

        {/* ================= SEARCH ================= */}
        <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
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
        </section>

        {/* ================= USER LIST + EDIT PANEL ================= */}

        <section className="grid lg:grid-cols-2 gap-6">

          {/* USER LIST */}
          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">
            <h2 className="text-2xl font-black text-cyan-400 mb-5">
              Users
            </h2>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">

              {filteredUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No users found.
                </p>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => selectUser(user)}
                    className={`w-full text-left rounded-xl border p-4 transition ${
                      selectedUser?._id === user._id
                        ? "border-yellow-500 bg-yellow-500/10"
                        : "border-zinc-700 hover:border-yellow-500"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-yellow-400">
                          {user.username}
                        </p>

                        <p className="text-sm text-gray-400">
                          {user.email}
                        </p>
                      </div>

                      <User className="text-cyan-400" size={22} />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-4 text-xs">

                      <div className="bg-zinc-800 rounded-lg p-2 text-center">
                        <p className="text-gray-500">PKR</p>

                        <p className="text-green-400 font-bold">
                          {user.walletBalance.toLocaleString()}
                        </p>
                      </div>

                      <div className="bg-zinc-800 rounded-lg p-2 text-center">
                        <p className="text-gray-500">Gold</p>

                        <p className="text-yellow-400 font-bold">
                          {user.goldBalance.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-zinc-800 rounded-lg p-2 text-center">
                        <p className="text-gray-500">USDT</p>

                        <p className="text-blue-400 font-bold">
                          {user.usdtBalance.toFixed(2)}
                        </p>
                      </div>

                    </div>
                  </button>
                ))
              )}

            </div>
          </div>

          {/* EDIT PANEL */}
          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

            <h2 className="text-2xl font-black text-green-400 mb-5">
              Wallet Editor
            </h2>

            {!selectedUser ? (
              <div className="text-center py-16 text-gray-500">
                Select a user to edit wallet balances.
              </div>
            ) : (
              <div className="space-y-5">

                <div className="bg-zinc-800 rounded-xl p-4">
                  <p className="text-sm text-gray-500">Selected User</p>

                  <h3 className="text-xl font-bold text-yellow-400 mt-1">
                    {selectedUser.username}
                  </h3>

                  <p className="text-gray-400 text-sm">
                    {selectedUser.email}
                  </p>
                </div>

                {/* PKR */}
                <div>
                  <label className="block mb-2 text-green-400 font-semibold">
                    PKR Wallet Balance
                  </label>

                  <div className="relative">
                    <DollarSign
                      className="absolute left-3 top-3 text-green-400"
                      size={18}
                    />

                    <input
                      type="number"
                      value={walletBalance}
                      onChange={(e) =>
                        setWalletBalance(Number(e.target.value))
                      }
                      className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3"
                    />
                  </div>
                </div>

                {/* GOLD */}
                <div>
                  <label className="block mb-2 text-yellow-400 font-semibold">
                    Gold Balance (grams)
                  </label>

                  <div className="relative">
                    <Coins
                      className="absolute left-3 top-3 text-yellow-400"
                      size={18}
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={goldBalance}
                      onChange={(e) =>
                        setGoldBalance(Number(e.target.value))
                      }
                      className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3"
                    />
                  </div>
                </div>

                {/* USDT */}
                <div>
                  <label className="block mb-2 text-blue-400 font-semibold">
                    USDT Balance
                  </label>

                  <div className="relative">
                    <Wallet
                      className="absolute left-3 top-3 text-blue-400"
                      size={18}
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={usdtBalance}
                      onChange={(e) =>
                        setUsdtBalance(Number(e.target.value))
                      }
                      className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3"
                    />
                  </div>
                </div>

                {/* Freeze Wallet */}
                <div className="flex items-center justify-between bg-zinc-800 rounded-xl p-4">
                  <div>
                    <p className="font-semibold">Freeze Wallet</p>

                    <p className="text-sm text-gray-500">
                      Block deposits, withdrawals and trading.
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      setWalletFrozen(!walletFrozen)
                    }
                    className={`px-4 py-2 rounded-xl font-bold transition ${
                      walletFrozen
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {walletFrozen ? "Frozen" : "Active"}
                  </button>
                </div>

                {/* Save Button */}
                <button
                  disabled={saving}
                  onClick={updateWallet}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl flex items-center justify-center gap-3 font-bold transition"
                >
                  <Save size={18} />

                  {saving
                    ? "Saving Changes..."
                    : "Save Wallet Changes"}
                </button>

              </div>
            )}

          </div>

        </section>

      </div>
    </main>
  );
}


