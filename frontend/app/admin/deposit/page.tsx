"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Wallet,
  Image as ImageIcon,
  Eye,
  Clock3,
  ShieldCheck,
} from "lucide-react";
interface PaymentSettings {
  usdtBuyRate: number;
  usdtSellRate: number;

  bank: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    qrCode: string;
  };

  easyPaisa: {
    accountTitle: string;
    mobileNumber: string;
    qrCode: string;
  };

  nayaPay: {
    accountTitle: string;
    mobileNumber: string;
    qrCode: string;
  };

  usdtWallet: {
    network: string;
    walletAddress: string;
    qrCode: string;
  };
}

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const [paymentSettings, setPaymentSettings] =
  useState<PaymentSettings | null>(null);

const [selectedMethod, setSelectedMethod] =
  useState("BANK");



// ==============================
// TYPES
// ==============================

interface DepositUser {
  username: string;
  email: string;
}

interface Deposit {
  _id: string;
  amount: number;
  status: string;
  walletType?: string;
  approvedAmount?: number;
  screenshot?: string;
  createdAt: string;
  userId: DepositUser;
}
const loadPaymentSettings = async () => {
  try {
    const res = await fetch(
      `${API}/api/admin/payment-settings`
    );

    const data = await res.json();

    if (data.success) {
      setPaymentSettings(data.settings);
    }

  } catch (err) {
    console.log(err);
  }
};
export default function AdminDepositPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [walletType, setWalletType] = useState("PKR");
  const [creditAmount, setCreditAmount] = useState("");
  const [reason, setReason] = useState("Deposit Verified");

  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [previewImage, setPreviewImage] = useState("");

  // ==============================
  // LOAD DEPOSITS
  // ==============================

  const loadDeposits = async () => {
    try {
      setRefreshing(true);

      const res = await fetch(`${API}/api/deposit`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setDeposits(data.deposits || []);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Unable to load deposits.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
useEffect(() => {
  loadPaymentSettings();
}, []);

  // ==============================
  // SEARCH FILTER
  // ==============================

  const filteredDeposits = useMemo(() => {
    return deposits.filter((deposit) => {
      const username =
        deposit.userId?.username?.toLowerCase() || "";

      const email =
        deposit.userId?.email?.toLowerCase() || "";

      return (
        username.includes(search.toLowerCase()) ||
        email.includes(search.toLowerCase())
      );
    });
  }, [deposits, search]);

  // ==============================
  // APPROVE + CREDIT
  // ==============================

  const approveDeposit = async (deposit: Deposit) => {
    if (!creditAmount) {
      alert("Enter credit amount.");
      return;
    }

    if (!reason.trim()) {
      alert("Reason required.");
      return;
    }

    try {
      const res = await fetch(
        `${API}/api/deposit/approve-credit/${deposit._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletType,
            creditAmount: Number(creditAmount),
            reason,
          }),
        }
      );

      const data = await res.json();

      alert(data.message);

      setCreditAmount("");
      setReason("Deposit Verified");

      loadDeposits();
    } catch (err) {
      console.log(err);
      alert("Approval failed.");
    }
  };

  // ==============================
  // REJECT DEPOSIT
  // ==============================

  const rejectDeposit = async (deposit: Deposit) => {
    const ok = confirm(
      "Reject this deposit permanently?"
    );

    if (!ok) return;

    try {
      const res = await fetch(
        `${API}/api/deposit/reject/${deposit._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      alert(data.message);

      loadDeposits();
    } catch (err) {
      console.log(err);
      alert("Reject failed.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex justify-center items-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" />
        Loading Deposit Approval Center...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}

      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-yellow-500">

        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

          <div>

            <h1 className="text-4xl font-black text-yellow-400">
              Deposit Approval Center
            </h1>

            <p className="text-gray-400 mt-1">
              Review, verify and credit customer deposits manually.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={loadDeposits}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing ? "animate-spin" : ""
                }
              />
              Refresh
            </button>

            <Link
              href="/admin"
              className="bg-zinc-900 border border-yellow-500 hover:bg-yellow-500 hover:text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18}/>
              Dashboard
            </Link>

          </div>

        </div>

      </div>

      {/* SEARCH */}

      <div className="max-w-7xl mx-auto px-6 py-8">

        <div className="relative mb-8">

          <Search
            size={20}
            className="absolute left-4 top-4 text-gray-500"
          />

          <input
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-yellow-500 rounded-2xl py-4 pl-12 pr-5 outline-none focus:border-yellow-400"
          />

        </div>        {/* ===================== STATS ===================== */}

        <div className="grid md:grid-cols-4 gap-5 mb-8">

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <p className="text-gray-400 text-sm">Total Requests</p>
            <h2 className="text-3xl font-bold text-yellow-400 mt-2">
              {filteredDeposits.length}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">
            <p className="text-gray-400 text-sm">Pending</p>
            <h2 className="text-3xl font-bold text-green-400 mt-2">
              {filteredDeposits.filter((d) => d.status === "Pending").length}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-blue-600 rounded-2xl p-5">
            <p className="text-gray-400 text-sm">Approved</p>
            <h2 className="text-3xl font-bold text-blue-400 mt-2">
              {filteredDeposits.filter((d) => d.status === "Approved").length}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-2xl p-5">
            <p className="text-gray-400 text-sm">Rejected</p>
            <h2 className="text-3xl font-bold text-red-400 mt-2">
              {filteredDeposits.filter((d) => d.status === "Rejected").length}
            </h2>
          </div>

        </div>

        {/* ===================== DEPOSIT CARDS ===================== */}

        <div className="space-y-8">

          {filteredDeposits.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              No Deposit Requests Found.
            </div>
          )}

          {filteredDeposits.map((deposit) => (

            <div
              key={deposit._id}
              className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6"
            >

              <div className="grid lg:grid-cols-2 gap-8">

                {/* LEFT PANEL */}

                <div>

                  <div className="flex justify-between items-center mb-4">

                    <div>

                      <h2 className="text-2xl font-bold text-yellow-400">
                        {deposit.userId?.username}
                      </h2>

                      <p className="text-gray-400">
                        {deposit.userId?.email}
                      </p>

                    </div>

                    <div
                      className={`px-4 py-2 rounded-full text-sm font-bold ${
                        deposit.status === "Approved"
                          ? "bg-green-600 text-white"
                          : deposit.status === "Rejected"
                          ? "bg-red-600 text-white"
                          : "bg-yellow-500 text-black"
                      }`}
                    >
                      {deposit.status}
                    </div>

                  </div>

                  <div className="bg-black rounded-2xl border border-zinc-700 p-5 space-y-3">

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Deposit Amount</span>
                      <span className="font-bold text-[#22C55E]">
                        PKR {Number(deposit.amount).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Requested Wallet</span>
                      <span className="font-medium">
                        {deposit.walletType || "PKR"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Requested At</span>
                      <span className="font-medium">
                        {new Date(deposit.createdAt).toLocaleString()}
                      </span>
                    </div>

                  </div>

                  {/* SCREENSHOT PREVIEW */}

                  {deposit.screenshot ? (
                    <div className="mt-6">

                      <p className="text-gray-400 mb-3 flex items-center gap-2">
                        <ImageIcon size={18}/>
                        Payment Screenshot
                      </p>

                      <button
                        type="button"
                        className="block w-full rounded-xl overflow-hidden"
                        onClick={() =>
                          setPreviewImage(
                            `${API}/${deposit.screenshot}`
                          )
                        }
                      >
                        <img
                          src={`${API}/${deposit.screenshot}`}
                          alt="Deposit Screenshot"
                          className="rounded-xl border border-yellow-500 w-full h-60 object-cover cursor-pointer hover:opacity-90"
                        />
                      </button>

                    </div>
                  ) : (
                    <div className="mt-6 border border-dashed border-zinc-700 rounded-xl p-8 text-center text-gray-500">
                      No Screenshot Uploaded
                    </div>
                  )}

                </div>

                {/* RIGHT PANEL */}

                <div className="bg-black rounded-3xl border border-yellow-500 p-6">

                  <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-2">
                    <Wallet size={24}/>
                    Approve + Credit Wallet
                  </h3>

                  {/* Wallet Type */}

                  <div className="mb-5">

                    <label className="text-gray-400 block mb-2">
                      Credit Wallet
                    </label>

                    <select
                      value={walletType}
                      onChange={(e) => setWalletType(e.target.value)}
                      className="w-full bg-zinc-900 border border-yellow-500 rounded-xl p-3 outline-none"
                    >
                      <option value="PKR">PKR Wallet</option>
                      <option value="USDT">USDT Wallet</option>
                      <option value="GOLD">Gold Wallet</option>
                    </select>

                  </div>

                  {/* Credit Amount */}

                  <div className="mb-5">

                    <label className="text-gray-400 block mb-2">
                      Credit Amount
                    </label>

                    <input
                      type="number"
                      placeholder="Enter amount..."
                      value={creditAmount}
                      onChange={(e) =>
                        setCreditAmount(e.target.value)
                      }
                      className="w-full bg-zinc-900 border border-green-600 rounded-xl p-3 outline-none"
                    />

                    <p className="text-xs text-gray-500 mt-2">
                      Example: User deposited 20,000 but admin can credit
                      19,500 after verification.
                    </p>

                  </div>

                  {/* Reason */}

                  <div className="mb-6">

                    <label className="text-gray-400 block mb-2">
                      Approval Reason
                    </label>

                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Deposit Verified / Manual Adjustment..."
                      className="w-full bg-zinc-900 border border-yellow-500 rounded-xl p-3 outline-none resize-none"
                    />

                  </div>

                  {/* Buttons */}

                  {deposit.status === "Pending" ? (

                    <div className="space-y-4">

                      <button
                        onClick={() => approveDeposit(deposit)}
                        className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-4 font-bold flex justify-center items-center gap-3"
                      >
                        <CheckCircle size={22}/>
                        Approve + Credit Wallet
                      </button>

                      <button
                        onClick={() => rejectDeposit(deposit)}
                        className="w-full bg-red-600 hover:bg-red-500 rounded-xl py-4 font-bold flex justify-center items-center gap-3"
                      >
                        <XCircle size={22}/>
                        Reject Deposit
                      </button>

                    </div>

                  ) : (

                    <div className="border border-green-600 rounded-xl p-4 text-center text-green-400 font-bold">
                      Deposit Already {deposit.status}
                    </div>

                  )}

                </div>

              </div>

            </div>

          ))}

        </div>        {/* ================= IMAGE PREVIEW MODAL ================= */}

        {previewImage && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-6">

            <div className="relative max-w-4xl w-full">

              <button
                onClick={() => setPreviewImage("")}
                className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-500 rounded-full p-3"
              >
                <XCircle size={28} />
              </button>

              <img
                src={previewImage}
                alt="Deposit Screenshot Preview"
                className="w-full rounded-3xl border-2 border-yellow-500 max-h-[90vh] object-contain"
              />

            </div>

          </div>
        )}

        {/* ================= RECENT DEPOSIT HISTORY ================= */}

        <div className="mt-14 bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-3">
              <Clock3 size={24}/>
              Recent Deposit History
            </h2>

            <span className="text-sm text-gray-400">
              Last 10 Deposit Requests
            </span>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="border-b border-yellow-600 text-yellow-400">

                <tr className="text-left">
                  <th className="py-3">User</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Wallet</th>
                  <th>Date</th>
                </tr>

              </thead>

              <tbody>

                {filteredDeposits.slice(0, 10).map((deposit) => (

                  <tr
                    key={deposit._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                  >

                    <td className="py-4">
                      <div className="font-semibold text-yellow-300">
                        {deposit.userId?.username}
                      </div>

                      <div className="text-xs text-gray-500">
                        {deposit.userId?.email}
                      </div>
                    </td>

                    <td className="text-green-400 font-bold">
                      PKR {Number(deposit.amount).toLocaleString()}
                    </td>

                    <td>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          deposit.status === "Approved"
                            ? "bg-green-700 text-white"
                            : deposit.status === "Rejected"
                            ? "bg-red-700 text-white"
                            : "bg-yellow-500 text-black"
                        }`}
                      >
                        {deposit.status}
                      </span>

                    </td>

                    <td>
                      <span className="text-cyan-400 font-semibold">
                        {deposit.walletType || "PKR"}
                      </span>
                    </td>

                    <td className="text-gray-400 text-sm">
                      {new Date(deposit.createdAt).toLocaleString()}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* ================= SYSTEM STATUS ================= */}

        <div className="mt-12 grid md:grid-cols-3 gap-5">

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">

            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="text-green-400"/>
              <span className="font-bold text-green-400">
                Deposit System
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Manual Approval Enabled
            </p>

          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-2xl p-5">

            <div className="flex items-center gap-3 mb-3">
              <Wallet className="text-cyan-400"/>
              <span className="font-bold text-cyan-400">
                Wallet Credit
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Admin Controlled Wallet Credit
            </p>

          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <div className="flex items-center gap-3 mb-3">
              <RefreshCw className="text-yellow-400"/>
              <span className="font-bold text-yellow-400">
                Live Sync
              </span>
            </div>

            <p className="text-gray-400 text-sm">
              Auto Refresh Every 15 Seconds
            </p>

          </div>

        </div>

        {/* ================= FOOTER ================= */}

        <div className="mt-14 border-t border-zinc-700 pt-8 text-center">

          <h3 className="text-yellow-400 font-bold text-lg">
            GoldTrade Pakistan Admin Panel
          </h3>

          <p className="text-gray-500 mt-2">
            Premium Gold • USDT TRC20 • Wallet Management Platform
          </p>

          <p className="text-xs text-gray-600 mt-4">
            © 2026 GoldTrade Pakistan — Deposit Approval Center
          </p>

        </div>

      </div>
    </main>
  );
}