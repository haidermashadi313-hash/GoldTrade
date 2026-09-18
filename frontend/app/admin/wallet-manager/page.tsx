"use client";

import { useEffect, useState } from "react";
import {
  wallet,
  Search,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  User,
} from "lucide-react";

// ==========================================
// API URL
// ==========================================
const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==========================================
// USER TYPE
// ==========================================
interface walletUser {
  PkrBalance: number;
  goldBalance: number;
  UsdtBalance: number;
  _id: string;
  username: string;
  email: string;
  walletBalance: number;
  totalDeposit: number;
  totalWithdraw: number;
  role: string;
  status: string;
}

// ==========================================
// PAGE
// ==========================================
export default function walletManagerPage() {
  const [token, setToken] = useState("");

  const [users, setUsers] = useState<walletUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<walletUser[]>([]);

  const [search, setSearch] = useState("");
  const [walletTypes, setwalletTypes] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  // Manual adjustment
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  // ==========================================
// LOAD TOKEN
// ==========================================
useEffect(() => {
  const jwt = localStorage.getItem("token");

  if (!jwt) {
    window.location.href = "/login";
    return;
  }

  setToken(jwt);
}, []);

useEffect(() => {
  if (token) {
    loadUsers();
  }
}, [token]);

  // ==========================================
// LOAD wallet USERS (FINAL GOLDTRADE V18)
// ==========================================
const loadUsers = async () => {
  if (!token) return;

  try {
    console.log("🔄 1. loadUsers started");

    setLoading(true);
    setMessage("");

    const response = await fetch(`${API}/api/admin/wallet/all`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    console.log("📡 2. API Status:", response.status);

    const result = await response.json();

    console.log("✅ 3. ADMIN wallet RESPONSE:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load wallet users.");
    }

    // ==========================================
// BACKEND → FRONTEND wallet MAPPING (FINAL FIX)
// ==========================================

const wallets: walletUser[] = (
  Array.isArray(result.wallets) ? result.wallets : []
).map((user: any) => ({
  ...user,

  // Pkr wallet
  walletBalance: Number(
    user.walletBalance ??
    user.PkrBalance ??
    user.Pkr ??
    0
  ),

  // Gold wallet
  goldBalance: Number(
    user.goldBalance ??
    user.gold ??
    0
  ),

  // Usdt wallet
  UsdtBalance: Number(
    user.UsdtBalance ??
    user.Usdt ??
    0
  ),
}));

setUsers(wallets);
setFilteredUsers(wallets);

console.log("Loaded wallets:", wallets);

  } catch (err: any) {
    console.error("❌ LOAD USERS ERROR:", err);

    setUsers([]);
    setFilteredUsers([]);

    setMessageType("error");
    setMessage(err.message || "Failed to load wallet users.");
  } finally {
    console.log("🏁 4. Loading Finished");
    setLoading(false);
  }
};
    // ==========================================
  // SEARCH FILTER
  // ==========================================
  useEffect(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      setFilteredUsers(users);
      return;
    }

    setFilteredUsers(
      users.filter(
        (user) =>
          user.username.toLowerCase().includes(keyword) ||
          user.email.toLowerCase().includes(keyword)
      )
    );
  }, [search, users]);

  // ==========================================
  // REFRESH USERS
  // ==========================================
  const refreshUsers = () => {
    setMessage("");
    loadUsers();
  };

  // ==========================================
// CREDIT wallet (FINAL V18)
// ==========================================
const handleCredit = async (user: walletUser) => {
  try {
    const amount = Number(amounts[user._id] || 0);
    const walletType = walletTypes[user._id] || "Pkr";

    console.log("CREDIT CLICK", {
      username: user.username,
      walletType,
      amount,
    });

    if (amount <= 0) {
      setMessageType("error");
      setMessage("Enter a valid credit amount.");
      return;
    }

    const response = await fetch(`${API}/api/admin/wallet/credit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: user.username,
        walletType,
        amount,
        note: notes[user._id] || "",
      }),
    });

    const result = await response.json();

    console.log("CREDIT RESPONSE:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "wallet credit failed.");
    }

    setMessageType("success");
    setMessage(result.message);

    setAmounts((prev) => ({ ...prev, [user._id]: "" }));
    setNotes((prev) => ({ ...prev, [user._id]: "" }));

    await loadUsers();

  } catch (err: any) {
    console.error("CREDIT ERROR:", err);

    setMessageType("error");
    setMessage(err.message || "wallet credit failed.");
  }
};

  // ==========================================
// DEBIT wallet (FINAL V18 FIX)
// ==========================================
const handleDebit = async (
  username: string,
  walletType: string,
  amount: number,
  note: string
) => {
  try {
    if (!amount || amount <= 0) {
      setMessageType("error");
      setMessage("Enter a valid debit amount.");
      return;
    }

    const response = await fetch(`${API}/api/admin/wallet/debit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username,
        walletType,
        amount: Number(amount),
        note,
      }),
    });

    const result = await response.json();

    console.log("DEBIT RESPONSE:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "wallet debit failed.");
    }

    setMessageType("success");
    setMessage(result.message);

    // wallet list refresh
    loadUsers();
  } catch (err: any) {
    console.error("DEBIT ERROR:", err);

    setMessageType("error");
    setMessage(err.message || "wallet debit failed.");
  }
};
// ==========================================
// PAGE UI START (PART 1/3)
// ==========================================
return (
  <div className="min-h-screen bg-black text-white p-6">

    {/* ================= HEADER ================= */}
    <div className="flex justify-between items-center mb-8 flex-wrap gap-4">

      <div>
        <h1 className="text-4xl font-black text-yellow-400">
          wallet Manager
        </h1>

        <p className="text-gray-400 mt-2">
          GoldTrade V18 • Manual Pkr / GOLD / Usdt wallet Control
        </p>
      </div>

      <button
        onClick={refreshUsers}
        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2"
      >
        <RefreshCw size={18} />
        Refresh
      </button>

    </div>

    {/* ================= SUCCESS / ERROR MESSAGE ================= */}
    {message && (
      <div
        className={`mb-6 rounded-xl px-4 py-3 font-semibold ${
          messageType === "success"
            ? "bg-green-600/20 border border-green-500 text-green-400"
            : "bg-red-600/20 border border-red-500 text-red-400"
        }`}
      >
        {message}
      </div>
    )}

    {/* ================= SEARCH BAR ================= */}
    <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-4 mb-8">

      <div className="flex items-center gap-3">

        <Search size={20} className="text-cyan-400" />

        <input
          type="text"
          placeholder="Search username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none w-full text-white placeholder:text-gray-500"
        />

      </div>

    </div>

    {/* ================= USERS TABLE ================= */}
    <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">

      <h2 className="text-2xl font-black text-yellow-400 mb-6">
        wallet Users
      </h2>

      {loading ? (

        <div className="text-center py-10 text-gray-400">
          Loading users...
        </div>

      ) : filteredUsers.length === 0 ? (

        <div className="text-center py-10 text-gray-500">
          No users found.
        </div>

      ) : (

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1450px] text-sm">

            <thead className="border-b border-zinc-700 text-yellow-400">

              <tr className="text-left">
                <th className="py-3 px-2">User</th>
                <th className="py-3 px-2">Pkr wallet</th>
                <th className="py-3 px-2">Gold wallet</th>
                <th className="py-3 px-2">Usdt wallet</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">wallet Action</th>

              </tr>

            </thead>

            

            <tbody>
              {filteredUsers.map((user) => (
    
                 <tr key={user._id} className="border-b border-zinc-800 hover:bg-zinc-800/40">
                <td className="py-4 px-2">
                <div className="flex items-center gap-3">
               <User size={28} className="text-cyan-400" />

               <div>
               <div className="font-bold text-cyan-400">
                {user.username}
               </div>

              <div className="text-xs text-gray-500">
               {user.email}
              </div>
           </div>
         </div>
        </td>

      <td className="py-4 px-2">
        <div className="font-bold text-green-400 text-lg">
          Pkr {Number(user.walletBalance || user.PkrBalance || 0).toLocaleString()}
        </div>
      </td>

      <td className="py-4 px-2">
        <div className="font-bold text-yellow-400 text-lg">
          {Number(user.goldBalance || user.goldBalance || 0).toLocaleString()} g
        </div>
      </td>

      <td className="py-4 px-2">
        <div className="font-bold text-cyan-400 text-lg">
          {Number(user.UsdtBalance || 0).toLocaleString()} Usdt
        </div>
      </td>
       <td className="py-4 px-2">
        {user.status === "Active" ? (
          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
            Active
          </span>
        ) : (
          <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
            Suspended
          </span>
        )}
      </td>
                  {/* ==========================================
    wallet ACTION COLUMN (V18 FINAL BUG FREE)
========================================== */}

<td className="py-4 px-2 align-top">
  <div className="flex flex-col gap-3 w-60">

    {/* wallet Type */}
    <select
      value={walletTypes[user._id] || "Pkr"}
      onChange={(e) =>
        setwalletTypes((prev) => ({
          ...prev,
          [user._id]: e.target.value,
        }))
      }
      className="bg-black border border-cyan-500 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-400"
    >
      <option value="Pkr">Pkr wallet</option>
      <option value="GOLD">Gold wallet</option>
      <option value="Usdt">Usdt wallet</option>
    </select>

    {/* Amount */}
    <input
      type="number"
      min="0"
      step="0.01"
      value={amounts[user._id] || ""}
      onChange={(e) =>
        setAmounts((prev) => ({
          ...prev,
          [user._id]: e.target.value,
        }))
      }
      placeholder="Enter amount"
      className="bg-black border border-yellow-500 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-400"
    />

    {/* Admin Note */}
    <textarea
      rows={2}
      value={notes[user._id] || ""}
      onChange={(e) =>
        setNotes((prev) => ({
          ...prev,
          [user._id]: e.target.value,
        }))
      }
      placeholder="Admin note..."
      className="bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none resize-none focus:border-cyan-500"
    />

    {/* Credit / Debit Buttons */}
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => handleCredit(user)}
        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 px-3 py-2 rounded-lg text-white font-semibold transition-all"
      >
        <PlusCircle size={16} />
        Credit
      </button>

      <button
        type="button"
        onClick={() =>
          handleDebit(
            user.username,
            walletTypes[user._id] || "Pkr",
            Number(amounts[user._id] || 0),
            notes[user._id] || ""
          )
        }
        className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg text-white font-semibold transition-all"
      >
        <MinusCircle size={16} />
        Debit
      </button>
    </div>

    {/* wallet Preview */}
    <div className="border-t border-zinc-800 pt-2 text-xs text-gray-400">
      <div className="flex justify-between">
        <span>Selected wallet</span>

        <span className="font-semibold text-cyan-400">
          {walletTypes[user._id] || "Pkr"}
        </span>
      </div>

      <div className="flex justify-between mt-2">
        <span>Current Balance</span>

        <span className="font-semibold text-white">
          {walletTypes[user._id] === "GOLD"
            ? `${Number(user.goldBalance || 0).toLocaleString()} g`
            : walletTypes[user._id] === "Usdt"
            ? `${Number(user.UsdtBalance || 0).toLocaleString()} Usdt`
            : `Pkr ${Number(user.PkrBalance || 0).toLocaleString()}`}
        </span>
      </div>
    </div>

  </div>
</td>
                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>

  </div>
);
}