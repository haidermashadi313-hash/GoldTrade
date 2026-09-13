"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Wallet,
  ArrowLeft,
  RefreshCw,
  Search,
  User,
  DollarSign,
  Coins,
  Gem,
  PlusCircle,
  MinusCircle,
  Save,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-api.onrender.com";

interface WalletUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  status: string;

  walletBalance: number;
  usdtBalance: number;
  goldBalance: number;
}

export default function WalletManagerPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [users, setUsers] = useState<WalletUser[]>([]);
  const [search, setSearch] = useState("");

  const [selectedUser, setSelectedUser] =
    useState<WalletUser | null>(null);

  const [walletType, setWalletType] =
    useState("PKR");

  const [action, setAction] =
    useState("credit");

  const [amount, setAmount] = useState("");

  const [reason, setReason] = useState("");

  // =====================================
  // LOAD USERS
  // =====================================

  const loadUsers = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${API}/api/admin/wallet/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // =====================================
  // SEARCH USERS
  // =====================================

  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        user.username
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        user.email
          .toLowerCase()
          .includes(search.toLowerCase())
    );
  }, [users, search]);

  // =====================================
  // UPDATE WALLET
  // =====================================

  const updateWallet = async () => {
    if (!selectedUser) {
      return alert("Please select a user.");
    }

    if (!amount || Number(amount) <= 0) {
      return alert("Enter valid amount.");
    }

    if (!reason.trim()) {
      return alert("Reason is required.");
    }

    try {
      setSaving(true);

      const res = await fetch(
        `${API}/api/admin/wallet/update`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            userId: selectedUser._id,
            walletType,
            action,
            amount: Number(amount),
            reason,
          }),
        }
      );

      const data = await res.json();

      alert(data.message);

      if (data.success) {
        setAmount("");
        setReason("");
        loadUsers();
      }
    } catch (err) {
      console.log(err);
      alert("Wallet update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex justify-center items-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" />
        Loading Wallet Manager...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

        {/* HEADER */}

        <div className="flex justify-between items-center mb-8">

          <div>

            <h1 className="text-4xl font-black text-yellow-400 flex items-center gap-3">
              <Wallet size={38}/>
              Wallet Manager
            </h1>

            <p className="text-gray-400 mt-2">
              Admin can Credit (+) or Debit (-) PKR, USDT and Gold Wallets.
            </p>

          </div>

          <Link
            href="/admin"
            className="bg-zinc-900 border border-yellow-500 px-5 py-3 rounded-xl hover:bg-yellow-500 hover:text-black flex items-center gap-2"
          >
            <ArrowLeft size={18}/>
            Dashboard
          </Link>

        </div>

        {/* SEARCH */}

        <div className="relative mb-8">

          <Search
            className="absolute left-4 top-3 text-gray-500"
            size={18}
          />

          <input
            placeholder="Search Username or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-yellow-500 rounded-xl py-3 pl-11 pr-4 outline-none"
          />

        </div>        {/* =======================================================
            USER SELECTION
        ======================================================== */}

        <div className="mb-10">

          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              <User size={24}/>
              Select User
            </h2>

            <button
              onClick={loadUsers}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2"
            >
              <RefreshCw size={16}/>
              Refresh Users
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

            {filteredUsers.length === 0 ? (
              <div className="col-span-full bg-zinc-900 border border-red-500 rounded-2xl p-8 text-center">
                <p className="text-red-400 font-semibold">
                  No users found.
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`text-left rounded-3xl border p-5 transition-all ${
                    selectedUser?._id === user._id
                      ? "border-yellow-400 bg-yellow-500/10"
                      : "border-zinc-700 bg-zinc-900 hover:border-yellow-500"
                  }`}
                >
                  <div className="flex justify-between items-center mb-4">

                    <div className="w-12 h-12 rounded-full bg-yellow-500 flex justify-center items-center text-black font-black text-lg">
                      {user.username.charAt(0).toUpperCase()}
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        user.status === "Active"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {user.status}
                    </span>

                  </div>

                  <h3 className="text-xl font-bold text-white">
                    {user.username}
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    {user.email}
                  </p>

                  <p className="text-yellow-400 text-xs mt-3 uppercase">
                    {user.role}
                  </p>

                </button>
              ))
            )}

          </div>

        </div>

        {/* =======================================================
            SELECTED USER WALLET
        ======================================================== */}

        {selectedUser && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">

              <div>

                <h2 className="text-3xl font-black text-yellow-400">
                  {selectedUser.username}
                </h2>

                <p className="text-gray-400">
                  {selectedUser.email}
                </p>

              </div>

              <span className="bg-yellow-500 text-black px-4 py-2 rounded-full font-bold">
                Selected User
              </span>

            </div>

            {/* Wallet Balance Cards */}

            <div className="grid md:grid-cols-3 gap-5">

              {/* PKR Wallet */}

              <div className="bg-gradient-to-br from-green-900 to-green-700 rounded-3xl p-5 border border-green-500">

                <div className="flex justify-between items-center mb-3">
                  <DollarSign className="text-green-300" size={30}/>
                  <span className="bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                    PKR
                  </span>
                </div>

                <p className="text-green-100 text-sm">
                  PKR Wallet Balance
                </p>

                <h3 className="text-3xl font-black text-white mt-2">
                  PKR {selectedUser.walletBalance.toLocaleString()}
                </h3>

              </div>

              {/* USDT Wallet */}

              <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-3xl p-5 border border-blue-500">

                <div className="flex justify-between items-center mb-3">
                  <Coins className="text-blue-300" size={30}/>
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    USDT
                  </span>
                </div>

                <p className="text-blue-100 text-sm">
                  USDT Wallet Balance
                </p>

                <h3 className="text-3xl font-black text-white mt-2">
                  {selectedUser.usdtBalance.toFixed(2)} USDT
                </h3>

              </div>

              {/* Gold Wallet */}

              <div className="bg-gradient-to-br from-yellow-900 to-yellow-700 rounded-3xl p-5 border border-yellow-500">

                <div className="flex justify-between items-center mb-3">
                  <Gem className="text-yellow-300" size={30}/>
                  <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                    GOLD
                  </span>
                </div>

                <p className="text-yellow-100 text-sm">
                  Gold Wallet Balance
                </p>

                <h3 className="text-3xl font-black text-white mt-2">
                  {selectedUser.goldBalance.toFixed(2)} g
                </h3>

              </div>

            </div>

            {/* Summary */}

            <div className="mt-8 bg-black rounded-2xl p-5 border border-zinc-700">

              <h3 className="text-yellow-400 font-bold mb-4">
                Wallet Summary
              </h3>

              <div className="grid md:grid-cols-3 gap-4 text-center">

                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">PKR Wallet</p>
                  <p className="text-green-400 text-xl font-bold mt-2">
                    PKR {selectedUser.walletBalance.toLocaleString()}
                  </p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">USDT Wallet</p>
                  <p className="text-blue-400 text-xl font-bold mt-2">
                    {selectedUser.usdtBalance.toFixed(2)}
                  </p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Gold Wallet</p>
                  <p className="text-yellow-400 text-xl font-bold mt-2">
                    {selectedUser.goldBalance.toFixed(2)} g
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}        {/* =======================================================
            ADMIN WALLET CREDIT / DEBIT PANEL
        ======================================================== */}

        {selectedUser && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

            <div className="flex items-center gap-3 mb-6">
              <Wallet className="text-yellow-400" size={30}/>
              <h2 className="text-2xl font-bold text-yellow-400">
                Admin Wallet Adjustment
              </h2>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-4 mb-6">
              <p className="text-yellow-300 font-semibold">
                Selected User: {selectedUser.username}
              </p>
              <p className="text-gray-400 text-sm">
                {selectedUser.email}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">

              {/* Wallet Type */}

              <div>
                <label className="block text-gray-400 mb-2">
                  Wallet Type
                </label>

                <select
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value)}
                  className="w-full bg-black border border-yellow-500 rounded-xl p-3 outline-none"
                >
                  <option value="PKR">PKR Wallet</option>
                  <option value="USDT">USDT Wallet</option>
                  <option value="GOLD">Gold Wallet</option>
                </select>
              </div>

              {/* Action */}

              <div>
                <label className="block text-gray-400 mb-2">
                  Wallet Action
                </label>

                <div className="grid grid-cols-2 gap-3">

                  <button
                    onClick={() => setAction("credit")}
                    className={`rounded-xl py-3 font-bold flex items-center justify-center gap-2 transition ${
                      action === "credit"
                        ? "bg-green-600 border border-green-400"
                        : "bg-zinc-800 border border-zinc-700"
                    }`}
                  >
                    <PlusCircle size={18}/>
                    Credit
                  </button>

                  <button
                    onClick={() => setAction("debit")}
                    className={`rounded-xl py-3 font-bold flex items-center justify-center gap-2 transition ${
                      action === "debit"
                        ? "bg-red-600 border border-red-400"
                        : "bg-zinc-800 border border-zinc-700"
                    }`}
                  >
                    <MinusCircle size={18}/>
                    Debit
                  </button>

                </div>
              </div>

            </div>

            {/* Amount */}

            <div className="mt-6">
              <label className="block text-gray-400 mb-2">
                Amount
              </label>

              <input
                type="number"
                min="0"
                step={walletType === "GOLD" ? "0.01" : "1"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={
                  walletType === "GOLD"
                    ? "Enter Gold grams..."
                    : "Enter amount..."
                }
                className="w-full bg-black border border-yellow-500 rounded-xl p-3 outline-none"
              />
            </div>

            {/* Reason */}

            <div className="mt-6">
              <label className="block text-gray-400 mb-2">
                Reason (Required)
              </label>

              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Example: Cashback bonus, Manual adjustment, Penalty, Deposit correction..."
                className="w-full bg-black border border-yellow-500 rounded-xl p-3 outline-none"
              />
            </div>

            {/* Preview */}

            <div className="mt-6 bg-black rounded-2xl border border-zinc-700 p-5">

              <h3 className="text-yellow-400 font-bold mb-4">
                Wallet Update Preview
              </h3>

              <div className="grid md:grid-cols-2 gap-4">

                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">User</p>
                  <p className="font-bold text-white mt-1">
                    {selectedUser.username}
                  </p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Wallet</p>
                  <p className="font-bold text-yellow-400 mt-1">
                    {walletType}
                  </p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Action</p>

                  <p
                    className={`font-bold mt-1 ${
                      action === "credit"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {action === "credit"
                      ? "➕ Credit Wallet"
                      : "➖ Debit Wallet"}
                  </p>
                </div>

                <div className="bg-zinc-900 rounded-xl p-4">
                  <p className="text-gray-400 text-sm">Amount</p>

                  <p className="font-bold text-white mt-1">
                    {amount || 0}{" "}
                    {walletType === "GOLD" ? "Gram" : walletType}
                  </p>
                </div>

              </div>

            </div>

            {/* Update Button */}

            <button
              onClick={updateWallet}
              disabled={saving}
              className={`w-full mt-8 rounded-2xl py-4 text-lg font-bold flex justify-center items-center gap-3 transition ${
                action === "credit"
                  ? "bg-green-600 hover:bg-green-500"
                  : "bg-red-600 hover:bg-red-500"
              } disabled:opacity-50`}
            >
              {action === "credit" ? (
                <PlusCircle size={22}/>
              ) : (
                <MinusCircle size={22}/>
              )}

              {saving
                ? "Updating Wallet..."
                : action === "credit"
                ? "Credit Wallet"
                : "Debit Wallet"}
            </button>

          </div>
        )}        {/* =======================================================
            WALLET TRANSACTION HISTORY (ADMIN ONLY)
        ======================================================== */}

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

            <h2 className="text-2xl font-bold text-blue-400 flex items-center gap-2">
              <RefreshCw size={24}/>
              Wallet Transaction History
            </h2>

            <button
              onClick={loadUsers}
              className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2"
            >
              <RefreshCw size={16}/>
              Refresh Wallets
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead className="bg-zinc-950 border-b border-blue-500">

                <tr className="text-blue-400 text-sm">

                  <th className="text-left p-3">User</th>

                  <th className="text-left p-3">Wallet</th>

                  <th className="text-left p-3">Action</th>

                  <th className="text-left p-3">Balance</th>

                  <th className="text-left p-3">Status</th>

                </tr>

              </thead>

              <tbody>

                {filteredUsers.map((user) => (

                  <tr
                    key={user._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                  >

                    <td className="p-3">

                      <div className="font-semibold">
                        {user.username}
                      </div>

                      <div className="text-xs text-gray-500">
                        {user.email}
                      </div>

                    </td>

                    <td className="p-3">

                      <div className="space-y-1 text-sm">

                        <div className="text-green-400">
                          PKR {user.walletBalance.toLocaleString()}
                        </div>

                        <div className="text-blue-400">
                          {user.usdtBalance.toFixed(2)} USDT
                        </div>

                        <div className="text-yellow-400">
                          {user.goldBalance.toFixed(2)} Gram
                        </div>

                      </div>

                    </td>

                    <td className="p-3">

                      <div className="flex gap-2 flex-wrap">

                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                          ➕ Credit
                        </span>

                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                          ➖ Debit
                        </span>

                      </div>

                    </td>

                    <td className="p-3">

                      <div className="text-xs text-gray-300">
                        Live Wallet Balance
                      </div>

                    </td>

                    <td className="p-3">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          user.status === "Active"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {user.status}
                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* =======================================================
            SECURITY NOTICE
        ======================================================== */}

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6 mb-8">

          <h2 className="text-xl font-bold text-red-400 mb-3">
            🔒 Admin Security Rules
          </h2>

          <div className="space-y-3 text-sm text-gray-300">

            <p>✅ Only Admin can access Wallet Manager.</p>

            <p>✅ Every wallet update requires a reason.</p>

            <p>✅ PKR, USDT and GOLD wallet updates are logged.</p>

            <p>✅ Users cannot access Credit / Debit APIs.</p>

            <p>✅ Every update is stored in Wallet History with Admin ID.</p>

          </div>

        </div>

        {/* =======================================================
            SAVE / UPDATE FOOTER
        ======================================================== */}

        <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex flex-col md:flex-row justify-between items-center gap-5">

            <div>

              <h2 className="text-3xl font-black text-black">
                GoldTrade Wallet Manager
              </h2>

              <p className="text-black/80 mt-2">
                Manual wallet adjustments are available only for administrators.
              </p>

            </div>

            <button
              onClick={updateWallet}
              disabled={saving || !selectedUser}
              className="bg-black hover:bg-zinc-900 text-yellow-400 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 disabled:opacity-50"
            >
              <Save size={22}/>

              {saving
                ? "Updating Wallet..."
                : action === "credit"
                ? "Credit Wallet"
                : "Debit Wallet"}
            </button>

          </div>

        </div>

        {/* =======================================================
            FOOTER
        ======================================================== */}

        <div className="text-center border-t border-zinc-800 pt-8 pb-10">

          <h2 className="text-xl font-bold text-yellow-400">
            GoldTrade Admin Wallet Control Center
          </h2>

          <p className="text-gray-500 mt-2">
            Production Version V9 • Wallet Credit / Debit Manager
          </p>

          <p className="text-gray-600 text-sm mt-1">
            PKR Wallet • USDT Wallet • Gold Wallet • Wallet History
          </p>

        </div>

      </div>

    </main>
  );
}