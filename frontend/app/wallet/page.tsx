"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Wallet,
  Coins,
  DollarSign,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  UserCircle,
} from "lucide-react";

const API = "http://localhost:5000";

// ======================================
// TYPES
// ======================================

interface UserWallet {
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
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserWallet[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWallet | null>(null);

  const [search, setSearch] = useState("");

  const [walletType, setWalletType] = useState("PKR");
  const [action, setAction] = useState("credit");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");

  const adminName =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || "Admin"
      : "Admin";

  // ======================================
  // LOAD USERS
  // ======================================

  const loadUsers = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/users`);
      const data = await res.json();

      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.log(err);
      alert("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ======================================
  // SEARCH USERS
  // ======================================

  const filteredUsers = useMemo(() => {
    if (!search) return users;

    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, users]);

  // ======================================
  // UPDATE WALLET
  // ======================================

  const updateWallet = async () => {
    if (!selectedUser) {
      return alert("Select user first.");
    }

    if (amount <= 0) {
      return alert("Enter valid amount.");
    }

    let endpoint = "pkr";

    if (walletType === "USDT") endpoint = "usdt";
    if (walletType === "GOLD") endpoint = "gold";

    const res = await fetch(
      `${API}/api/wallets/${endpoint}/${selectedUser._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          action,
          reason,
          updatedBy: adminName,
        }),
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("Wallet Updated Successfully.");

      setAmount(0);
      setReason("");
      loadUsers();

      setSelectedUser(data.data);
    } else {
      alert(data.message);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-yellow-400 flex justify-center items-center">
        <RefreshCw className="animate-spin mr-3" />
        Loading Wallet Manager...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}

      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-yellow-500">

        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <div>

            <h1 className="text-3xl font-bold text-yellow-400">
              Wallet Manager
            </h1>

            <p className="text-gray-400 text-sm">
              PKR • TRC20 • Gold Wallet Control
            </p>

          </div>

          <button
            onClick={loadUsers}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* SEARCH */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

          <label className="text-gray-400">
            Search Username / Email
          </label>

          <div className="flex gap-3 mt-3">

            <div className="relative flex-1">

              <Search
                className="absolute left-4 top-4 text-gray-500"
                size={20}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user..."
                className="w-full bg-black border border-gray-700 rounded-xl p-4 pl-12"
              />

            </div>

          </div>

        </div>

        {/* USERS LIST */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <h2 className="text-xl font-bold text-yellow-400 mb-5">
            Select User
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">

            {filteredUsers.map((user) => (

              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`rounded-2xl p-4 border text-left transition ${
                  selectedUser?._id === user._id
                    ? "border-yellow-400 bg-yellow-500/10"
                    : "border-zinc-700 bg-zinc-950 hover:border-yellow-600"
                }`}
              >

                <div className="flex items-center gap-3 mb-3">

                  <UserCircle className="text-yellow-400" />

                  <div>

                    <h3 className="font-bold text-yellow-300">
                      {user.username}
                    </h3>

                    <p className="text-xs text-gray-400">
                      {user.email}
                    </p>

                  </div>

                </div>

                <p className="text-green-400 text-sm">
                  PKR {user.walletBalance.toLocaleString()}
                </p>

                <p className="text-cyan-400 text-sm">
                  {user.usdtBalance.toFixed(2)} USDT
                </p>

                <p className="text-yellow-400 text-sm">
                  {user.goldBalance.toFixed(2)} g Gold
                </p>

              </button>

            ))}

          </div>

        </div>

        {/* SELECTED USER */}

        {selectedUser && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

            <div className="flex justify-between items-center mb-6">

              <div>

                <h2 className="text-2xl font-bold text-yellow-400">
                  {selectedUser.username}
                </h2>

                <p className="text-gray-400">
                  {selectedUser.email}
                </p>

              </div>

              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
                  selectedUser.status === "Active"
                    ? "bg-green-700 text-white"
                    : "bg-red-700 text-white"
                }`}
              >
                {selectedUser.status}
              </span>

            </div>

            <div className="grid md:grid-cols-3 gap-5 mb-8">

              <WalletCard
                title="PKR Wallet"
                value={`PKR ${selectedUser.walletBalance.toLocaleString()}`}
                color="green"
                icon={<Wallet size={28} />}
              />

              <WalletCard
                title="USDT Wallet"
                value={`${selectedUser.usdtBalance.toFixed(2)} USDT`}
                color="cyan"
                icon={<DollarSign size={28} />}
              />

              <WalletCard
                title="Gold Wallet"
                value={`${selectedUser.goldBalance.toFixed(2)} g`}
                color="yellow"
                icon={<Coins size={28} />}
              />

            </div>

            {/* WALLET TYPE */}

            <div className="grid md:grid-cols-2 gap-6 mb-6">

              <div>

                <label className="text-gray-400">Wallet Type</label>

                <select
                  value={walletType}
                  onChange={(e) => setWalletType(e.target.value)}
                  className="w-full mt-2 bg-black border border-gray-700 rounded-xl p-4"
                >
                  <option value="PKR">PKR Wallet</option>
                  <option value="USDT">TRC20 USDT Wallet</option>
                  <option value="GOLD">Gold Wallet (Gram)</option>
                </select>

              </div>

              <div>

                <label className="text-gray-400">Action</label>

                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full mt-2 bg-black border border-gray-700 rounded-xl p-4"
                >
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>

              </div>

            </div>

            {/* AMOUNT */}

            <label className="text-gray-400">
              {walletType === "GOLD"
                ? "Gold Amount (Gram)"
                : "Amount"}
            </label>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-black border border-gray-700 rounded-xl p-4 mt-2 mb-6"
              placeholder="Enter Amount"
            />

            {/* REASON */}

            <label className="text-gray-400">
              Reason (Optional)
            </label>

            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-xl p-4 mt-2 mb-6"
              placeholder="Example: Bonus / Manual Deposit / Correction"
            />
                        {/* UPDATE BUTTON */}

            <button
              onClick={updateWallet}
              className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 ${
                action === "credit"
                  ? "bg-green-600 hover:bg-green-500"
                  : "bg-red-600 hover:bg-red-500"
              }`}
            >
              {action === "credit" ? (
                <ArrowDownCircle size={22} />
              ) : (
                <ArrowUpCircle size={22} />
              )}

              {action === "credit"
                ? `Credit ${walletType} Wallet`
                : `Debit ${walletType} Wallet`}
            </button>

          </div>
        )}

        {/* ================= USERS WALLET TABLE ================= */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-3">
              <Wallet size={24}/>
              Live Wallet Balances
            </h2>

            <button
              onClick={loadUsers}
              className="bg-yellow-500 text-black px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
            >
              <RefreshCw size={18}/>
              Refresh
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-yellow-600 text-yellow-400">

                <tr className="text-left">
                  <th className="py-3">User</th>
                  <th>PKR Wallet</th>
                  <th>USDT Wallet</th>
                  <th>Gold Wallet</th>
                  <th>Status</th>
                  <th>Role</th>
                </tr>

              </thead>

              <tbody>

                {filteredUsers.map((user) => (

                  <tr
                    key={user._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                  >

                    <td className="py-4">

                      <div>
                        <p className="font-semibold text-yellow-300">
                          {user.username}
                        </p>

                        <p className="text-xs text-gray-400">
                          {user.email}
                        </p>
                      </div>

                    </td>

                    <td className="text-green-400 font-bold">
                      PKR {user.walletBalance.toLocaleString()}
                    </td>

                    <td className="text-cyan-400 font-bold">
                      {user.usdtBalance.toFixed(2)} USDT
                    </td>

                    <td className="text-yellow-400 font-bold">
                      {user.goldBalance.toFixed(2)} g
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

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

        {/* ================= QUICK ACTIONS ================= */}

        <section className="grid md:grid-cols-3 gap-6 mb-12">

          <QuickCard
            title="Wallet History"
            desc="View complete wallet credit/debit history."
            href="/transactions"
            icon={<History size={32}/>}
            color="yellow"
          />

          <QuickCard
            title="User Manager"
            desc="Block users and change user roles."
            href="/admin/users"
            icon={<UserCircle size={32}/>}
            color="cyan"
          />

          <QuickCard
            title="Admin Dashboard"
            desc="Return to GoldTrade admin dashboard."
            href="/admin"
            icon={<Wallet size={32}/>}
            color="green"
          />

        </section>

      </div>
    </main>
  );
}

/* ==========================================================
   REUSABLE COMPONENTS
========================================================== */

type WalletColor = "green" | "yellow" | "cyan";

interface WalletCardProps {
  title: string;
  value: string;
  color: WalletColor;
  icon: React.ReactNode;
}

function WalletCard({
  title,
  value,
  color,
  icon,
}: WalletCardProps) {
  const border = {
    green: "border-green-600 text-green-400",
    yellow: "border-yellow-500 text-yellow-400",
    cyan: "border-cyan-500 text-cyan-400",
  };

  return (
    <div
      className={`bg-zinc-950 rounded-3xl border ${border[color]} p-5`}
    >
      <div className="mb-4">{icon}</div>

      <p className="text-gray-400 text-sm">{title}</p>

      <h3 className="text-2xl font-bold mt-2 break-words">
        {value}
      </h3>
    </div>
  );
}

interface QuickCardProps {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  color: WalletColor;
}

function QuickCard({
  title,
  desc,
  href,
  icon,
  color,
}: QuickCardProps) {
  const border = {
    green: "border-green-600 text-green-400",
    yellow: "border-yellow-500 text-yellow-400",
    cyan: "border-cyan-500 text-cyan-400",
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