"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  Wallet,
  Clock3,
  Landmark,
  AlertTriangle,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-api.onrender.com";

interface WithdrawRequest {
  _id: string;
  amount: number;
  method: string;
  accountNumber: string;
  accountName: string;
  status: "Pending" | "Approved" | "Rejected";
  receiptImage?: string;
  createdAt: string;

  userId?: {
    _id: string;
    username: string;
    email: string;
    walletBalance: number;
    usdtBalance: number;
    goldBalance: number;
  };
}

export default function AdminWithdrawPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  const [debitAmount, setDebitAmount] = useState("");
  const [reason, setReason] = useState("Withdraw Approved");

  // ================= LOAD WITHDRAWS =================

  const loadWithdraws = async () => {
    try {
      setRefreshing(true);

      const res = await fetch(`${API}/api/withdraw`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setWithdraws(data.data || []);
      } else {
        alert(data.message || "Failed to load withdrawals.");
      }
    } catch (err) {
      console.log(err);
      alert("Server connection failed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWithdraws();

    const timer = setInterval(loadWithdraws, 15000);
    return () => clearInterval(timer);
  }, []);

  // ================= SEARCH FILTER =================

  const filtered = useMemo(() => {
    return withdraws.filter((item) => {
      const username = item.userId?.username || "";

      return (
        username.toLowerCase().includes(search.toLowerCase()) ||
        item.accountNumber.includes(search)
      );
    });
  }, [withdraws, search]);  // ================= APPROVE + MANUAL WALLET DEBIT =================

  const approveWithdraw = async (withdraw: WithdrawRequest) => {
    const amount = Number(debitAmount);

    if (!amount || amount <= 0) {
      alert("Please enter a valid debit amount.");
      return;
    }

    if (amount > Number(withdraw.amount)) {
      alert("Debit amount cannot be greater than requested amount.");
      return;
    }

    const walletBalance = Number(withdraw.userId?.walletBalance || 0);

    if (amount > walletBalance) {
      alert(
        `Insufficient Wallet Balance!\n\nWallet Balance: PKR ${walletBalance.toLocaleString()}`
      );
      return;
    }

    try {
      const res = await fetch(
        `${API}/api/withdraw/approve/${withdraw._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            reason,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Withdrawal Approved & Wallet Debited Successfully ✅");

        setDebitAmount("");
        setReason("Withdraw Approved");

        loadWithdraws();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Approval Failed.");
    }
  };

  // ================= REJECT WITHDRAW =================

  const rejectWithdraw = async (withdraw: WithdrawRequest) => {
    const ok = confirm("Reject this withdrawal request?");
    if (!ok) return;

    try {
      const res = await fetch(
        `${API}/api/withdraw/reject/${withdraw._id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: "Withdraw Rejected by Admin",
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Withdrawal Rejected ❌");
        loadWithdraws();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Reject Failed.");
    }
  };

  // ================= LIVE STATS =================

  const totalAmount = filtered.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );

  const pending = filtered.filter(
    (item) => item.status === "Pending"
  ).length;

  const approved = filtered.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejected = filtered.filter(
    (item) => item.status === "Rejected"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex justify-center items-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3"/>
        Loading Withdraw Requests...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ================= HEADER ================= */}

      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-yellow-500">

        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">

          <div>
            <Link
              href="/admin"
              className="text-yellow-400 hover:text-yellow-300 flex items-center gap-2 text-sm mb-2"
            >
              <ArrowLeft size={16}/>
              Back to Admin Dashboard
            </Link>

            <h1 className="text-4xl font-black text-yellow-400">
              Withdraw Approval Manager
            </h1>

            <p className="text-gray-400 mt-2">
              Review, approve and manually debit customer withdrawal requests.
            </p>
          </div>

          <button
            onClick={loadWithdraws}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ================= DASHBOARD STATS ================= */}

        <div className="grid md:grid-cols-4 gap-5 mb-8">

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <Wallet className="text-yellow-400 mb-2"/>
            <p className="text-gray-400 text-sm">Total Requests</p>
            <h2 className="text-3xl font-bold text-yellow-400 mt-2">
              {filtered.length}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">
            <CheckCircle className="text-green-400 mb-2"/>
            <p className="text-gray-400 text-sm">Approved</p>
            <h2 className="text-3xl font-bold text-green-400 mt-2">
              {approved}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-2xl p-5">
            <Clock3 className="text-orange-400 mb-2"/>
            <p className="text-gray-400 text-sm">Pending</p>
            <h2 className="text-3xl font-bold text-orange-400 mt-2">
              {pending}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-red-600 rounded-2xl p-5">
            <XCircle className="text-red-400 mb-2"/>
            <p className="text-gray-400 text-sm">Rejected</p>
            <h2 className="text-3xl font-bold text-red-400 mt-2">
              {rejected}
            </h2>
          </div>

        </div>

        {/* ================= TOTAL WITHDRAW AMOUNT ================= */}

        <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-500 rounded-3xl p-6 mb-8">

          <p className="text-red-100 text-sm">
            Total Withdrawal Amount
          </p>

          <h2 className="text-5xl font-black mt-2">
            PKR {totalAmount.toLocaleString()}
          </h2>

        </div>

        {/* ================= SEARCH ================= */}

        <div className="relative mb-8">

          <Search
            size={18}
            className="absolute left-4 top-4 text-gray-500"
          />

          <input
            placeholder="Search Username or Account Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-yellow-500 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-yellow-400"
          />

        </div>

        {/* Withdraw Cards Section starts in Section 3 */}        {/* ================= WITHDRAW REQUESTS ================= */}

        <div className="space-y-8">

          {filtered.map((withdraw) => {

            const walletBalance = Number(withdraw.userId?.walletBalance || 0);

            const debit = Number(debitAmount || 0);

            const remainingBalance =
              walletBalance - debit > 0
                ? walletBalance - debit
                : 0;

            return (
              <div
                key={withdraw._id}
                className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6"
              >
                <div className="grid lg:grid-cols-2 gap-8">

                  {/* ================= LEFT SIDE ================= */}

                  <div>

                    <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                      {withdraw.userId?.username}
                    </h2>

                    <p className="text-gray-400 mb-5">
                      {withdraw.userId?.email}
                    </p>

                    <div className="space-y-3 text-sm">

                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Withdraw Amount
                        </span>

                        <span className="text-red-400 font-bold text-lg">
                          PKR {withdraw.amount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Payment Method
                        </span>

                        <span className="text-cyan-400 font-semibold">
                          {withdraw.method}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Account Holder
                        </span>

                        <span className="font-semibold">
                          {withdraw.accountName}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Account Number
                        </span>

                        <span className="font-semibold">
                          {withdraw.accountNumber}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Wallet Balance
                        </span>

                        <span className="text-green-400 font-bold">
                          PKR {walletBalance.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          Request Time
                        </span>

                        <span className="text-gray-300">
                          {new Date(withdraw.createdAt).toLocaleString()}
                        </span>
                      </div>

                    </div>

                    {/* Receipt */}

                    <div className="mt-6">

                      {withdraw.receiptImage ? (
                        <button
                          onClick={() =>
                            setPreviewImage(
                              `${API}/uploads/receipts/${withdraw.receiptImage}`
                            )
                          }
                          className="relative group"
                        >
                          <img
                            src={`${API}/uploads/receipts/${withdraw.receiptImage}`}
                            className="rounded-2xl border border-yellow-500 w-full max-h-60 object-cover"
                            alt="Receipt"
                          />

                          <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">

                            <Eye size={34} className="text-white"/>

                          </div>
                        </button>
                      ) : (
                        <div className="border border-dashed border-zinc-700 rounded-2xl p-10 text-center text-gray-500">
                          No Receipt Uploaded
                        </div>
                      )}

                    </div>

                  </div>

                  {/* ================= RIGHT SIDE ================= */}

                  <div className="space-y-5">

                    {/* Status */}

                    <div
                      className={`rounded-xl p-4 border ${
                        withdraw.status === "Approved"
                          ? "border-green-600 bg-green-900/20"
                          : withdraw.status === "Rejected"
                          ? "border-red-600 bg-red-900/20"
                          : "border-orange-500 bg-orange-900/20"
                      }`}
                    >

                      <div className="flex items-center gap-3">

                        {withdraw.status === "Approved" ? (
                          <CheckCircle className="text-green-400"/>
                        ) : withdraw.status === "Rejected" ? (
                          <XCircle className="text-red-400"/>
                        ) : (
                          <Clock3 className="text-orange-400"/>
                        )}

                        <div>

                          <p className="text-gray-400 text-sm">
                            Withdrawal Status
                          </p>

                          <h3 className="text-xl font-bold">
                            {withdraw.status}
                          </h3>

                        </div>

                      </div>

                    </div>

                    {/* Manual Debit */}

                    {withdraw.status === "Pending" && (
                      <div className="bg-black border border-red-600 rounded-2xl p-5 space-y-5">

                        <div className="flex items-center gap-2 text-red-400 font-bold text-lg">
                          <Wallet size={22}/>
                          Manual Wallet Debit
                        </div>

                        {/* Debit Amount */}

                        <div>

                          <label className="block text-gray-400 mb-2">
                            Debit Amount (PKR)
                          </label>

                          <input
                            type="number"
                            value={debitAmount}
                            onChange={(e) =>
                              setDebitAmount(e.target.value)
                            }
                            placeholder="Enter amount..."
                            className="w-full bg-zinc-900 border border-red-500 rounded-xl p-3 outline-none"
                          />

                          <p className="text-xs text-gray-500 mt-2">
                            Admin can debit less or more after verification.
                          </p>

                        </div>

                        {/* Reason */}

                        <div>

                          <label className="block text-gray-400 mb-2">
                            Approval Reason
                          </label>

                          <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) =>
                              setReason(e.target.value)
                            }
                            className="w-full bg-zinc-900 border border-yellow-500 rounded-xl p-3 outline-none"
                          />

                        </div>

                        {/* Wallet Summary */}

                        <div className="bg-zinc-900 border border-cyan-500 rounded-xl p-4 space-y-3">

                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Requested
                            </span>

                            <span className="text-cyan-400 font-bold">
                              PKR {withdraw.amount.toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Debit Wallet
                            </span>

                            <span className="text-red-400 font-bold">
                              PKR {Number(debitAmount || 0).toLocaleString()}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">
                              Remaining Balance
                            </span>

                            <span className="text-green-400 font-bold">
                              PKR {remainingBalance.toLocaleString()}
                            </span>
                          </div>

                        </div>

                        {/* Validation Warning */}

                        {Number(debitAmount || 0) > walletBalance && (
                          <div className="bg-red-900/30 border border-red-600 rounded-xl p-4 flex gap-3">

                            <AlertTriangle className="text-red-400"/>

                            <div>

                              <p className="font-bold text-red-400">
                                Insufficient Wallet Balance
                              </p>

                              <p className="text-sm text-red-300">
                                Wallet Balance:
                                PKR {walletBalance.toLocaleString()}
                              </p>

                            </div>

                          </div>
                        )}

                        {/* Action Buttons */}

                        <div className="grid md:grid-cols-2 gap-4">

                          <button
                            onClick={() => approveWithdraw(withdraw)}
                            className="bg-green-600 hover:bg-green-500 rounded-xl py-3 font-bold flex justify-center items-center gap-2"
                          >
                            <CheckCircle size={20}/>
                            Approve + Debit Wallet
                          </button>

                          <button
                            onClick={() => rejectWithdraw(withdraw)}
                            className="bg-red-600 hover:bg-red-500 rounded-xl py-3 font-bold flex justify-center items-center gap-2"
                          >
                            <XCircle size={20}/>
                            Reject Withdrawal
                          </button>

                        </div>

                      </div>
                    )}                    {/* ================= COMPLETED STATUS ================= */}

                    {withdraw.status !== "Pending" && (
                      <div
                        className={`rounded-2xl p-5 border ${
                          withdraw.status === "Approved"
                            ? "border-green-600 bg-green-900/20"
                            : "border-red-600 bg-red-900/20"
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          {withdraw.status === "Approved" ? (
                            <CheckCircle className="text-green-400" size={26} />
                          ) : (
                            <XCircle className="text-red-400" size={26} />
                          )}

                          <h3
                            className={`text-xl font-bold ${
                              withdraw.status === "Approved"
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            Withdrawal {withdraw.status}
                          </h3>
                        </div>

                        <p className="text-gray-300 text-sm mb-4">
                          This request has already been processed by the admin.
                        </p>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-zinc-900 rounded-xl p-3">
                            <p className="text-gray-500 mb-1">
                              Requested Amount
                            </p>

                            <p className="font-bold text-red-400 text-lg">
                              PKR {withdraw.amount.toLocaleString()}
                            </p>
                          </div>

                          <div className="bg-zinc-900 rounded-xl p-3">
                            <p className="text-gray-500 mb-1">
                              Wallet Balance
                            </p>

                            <p className="font-bold text-green-400 text-lg">
                              PKR {Number(withdraw.userId?.walletBalance || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>

                </div>

              </div>
            );
          })}

          {/* ================= EMPTY STATE ================= */}

          {filtered.length === 0 && (
            <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-12 text-center">
              <Wallet size={60} className="mx-auto text-yellow-400 mb-5" />

              <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                No Withdrawal Requests Found
              </h2>

              <p className="text-gray-500">
                There are currently no withdrawal requests matching your search.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* ================= RECEIPT PREVIEW MODAL ================= */}

      {previewImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-5">

          <div className="relative max-w-4xl w-full">

            <button
              onClick={() => setPreviewImage("")}
              className="absolute -top-12 right-0 bg-red-600 hover:bg-red-500 px-5 py-2 rounded-lg font-bold"
            >
              Close
            </button>

            <img
              src={previewImage}
              alt="Receipt Preview"
              className="rounded-2xl border-2 border-yellow-500 w-full max-h-[90vh] object-contain bg-black"
            />

          </div>

        </div>
      )}

    </main>
  );
}