"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
  Landmark,
  Eye,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface WithdrawHistory {
  _id: string;
  username: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  bankName?: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  walletAddress?: string;
  network?: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNote?: string;
  receiptImage?: string;
  transactionId?: string;
  createdAt: string;
}

export default function WithdrawHistoryPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);

  const [withdraws, setWithdraws] = useState<WithdrawHistory[]>([]);
  const [filter, setFilter] = useState("ALL");

  const [selectedReceipt, setSelectedReceipt] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("username");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (savedUser) {
      setUsername(savedUser);
      loadHistory(savedUser);
    }
  }, []);

  const loadHistory = async (user: string) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API}/api/withdraw/history/${user}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setWithdraws(res.data.withdraws || []);

    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWithdraws = useMemo(() => {
    if (filter === "ALL") return withdraws;

    return withdraws.filter((item) => item.status === filter);
  }, [withdraws, filter]);

  const stats = useMemo(() => {
    return {
      totalAmount: withdraws.reduce(
        (sum, item) => sum + item.amount,
        0
      ),

      pending: withdraws.filter(
        (item) => item.status === "Pending"
      ).length,

      approved: withdraws.filter(
        (item) => item.status === "Approved"
      ).length,

      rejected: withdraws.filter(
        (item) => item.status === "Rejected"
      ).length,
    };
  }, [withdraws]);

  const statusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-600 text-white";
      case "Rejected":
        return "bg-red-600 text-white";
      default:
        return "bg-yellow-500 text-black";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center text-yellow-400 text-2xl font-black">
        Loading Withdraw History...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <Link
          href="/withdraw"
          className="flex items-center gap-2 text-yellow-400"
        >
          <ArrowLeft size={20}/>
          Withdraw
        </Link>

        <button
          onClick={() => loadHistory(username)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl flex items-center gap-2 font-bold"
        >
          <RefreshCw size={18}/>
          Refresh
        </button>

      </div>

      <h1 className="text-4xl font-black text-yellow-400 mb-2">
        Withdraw History
      </h1>

      <p className="text-gray-400 mb-8">
        Track all your withdrawal requests and payment status.
      </p>

      {/* DASHBOARD STATS */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-5">
          <Wallet className="text-cyan-400 mb-3"/>
          <p className="text-gray-400 text-sm">
            Total Withdraw
          </p>

          <h2 className="text-3xl font-black text-cyan-400">
            PKR {stats.totalAmount.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
          <Clock className="text-yellow-400 mb-3"/>
          <p className="text-gray-400 text-sm">
            Pending
          </p>

          <h2 className="text-3xl font-black text-yellow-400">
            {stats.pending}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">
          <CheckCircle className="text-green-400 mb-3"/>
          <p className="text-gray-400 text-sm">
            Approved
          </p>

          <h2 className="text-3xl font-black text-green-400">
            {stats.approved}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-5">
          <XCircle className="text-red-400 mb-3"/>
          <p className="text-gray-400 text-sm">
            Rejected
          </p>

          <h2 className="text-3xl font-black text-red-400">
            {stats.rejected}
          </h2>
        </div>

      </div>

      {/* STATUS FILTER */}

      <div className="flex flex-wrap gap-3 mb-8">

        {["ALL", "Pending", "Approved", "Rejected"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-5 py-3 rounded-full font-bold transition ${
              filter === status
                ? "bg-yellow-500 text-black"
                : "bg-zinc-900 border border-zinc-700 hover:border-yellow-500"
            }`}
          >
            {status}
          </button>
        ))}

      </div>
            {/* ================= WITHDRAW TABLE ================= */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-black text-yellow-400">
            Withdrawal Requests
          </h2>

          <span className="bg-yellow-500 text-black px-4 py-2 rounded-full font-bold">
            {filteredWithdraws.length} Records
          </span>
        </div>

        {filteredWithdraws.length === 0 ? (
          <div className="py-16 text-center">

            <Clock className="mx-auto text-gray-600 mb-4" size={60} />

            <h3 className="text-2xl font-bold text-gray-400">
              No Withdrawal History
            </h3>

            <p className="text-gray-500 mt-2">
              Your withdrawal requests will appear here after submission.
            </p>

          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">

            <table className="w-full">

              <thead className="bg-black text-yellow-400 uppercase text-sm">
                <tr>
                  <th className="px-4 py-4 text-left">Amount</th>
                  <th className="px-4 py-4 text-left">Method</th>
                  <th className="px-4 py-4 text-left">Account</th>
                  <th className="px-4 py-4 text-left">Status</th>
                  <th className="px-4 py-4 text-left">Receipt</th>
                  <th className="px-4 py-4 text-left">Date</th>
                </tr>
              </thead>

              <tbody>

                {filteredWithdraws.map((item) => (

                  <tr
                    key={item._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                  >

                    {/* Amount */}

                    <td className="px-4 py-5 font-bold text-green-400">
                      PKR {item.amount.toLocaleString()}
                    </td>

                    {/* Payment Method */}

                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">

                        <Landmark size={18} className="text-cyan-400"/>

                        <span className="font-medium">
                          {item.paymentMethod.replace("_", " ")}
                        </span>

                      </div>
                    </td>

                    {/* Account */}

                    <td className="px-4 py-5 text-sm text-gray-300">
                      <div className="font-semibold">
                        {item.accountTitle}
                      </div>

                      <div>{item.accountNumber}</div>

                      {item.bankName && (
                        <div className="text-gray-500">
                          {item.bankName}
                        </div>
                      )}

                      {item.network && (
                        <div className="text-cyan-400">
                          {item.network}
                        </div>
                      )}
                    </td>

                    {/* Status */}

                    <td className="px-4 py-5">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>

                    </td>

                    {/* Receipt */}

                    <td className="px-4 py-5">

                      {item.receiptImage ? (
                        <button
                          onClick={() =>
                            setSelectedReceipt(`${API}${item.receiptImage}`)
                          }
                          className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-2 rounded-lg flex items-center gap-2 font-bold"
                        >
                          <Eye size={16}/>
                          View
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          Waiting
                        </span>
                      )}

                    </td>

                    {/* Date */}

                    <td className="px-4 py-5 text-gray-400 text-sm">
                      {new Date(item.createdAt).toLocaleDateString("en-GB")}
                      <br/>
                      {new Date(item.createdAt).toLocaleTimeString("en-GB")}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ================= ADMIN NOTES TIMELINE ================= */}

      {filteredWithdraws.length > 0 && (

        <div className="mt-10 bg-zinc-900 border border-cyan-500 rounded-3xl p-6">

          <h2 className="text-2xl font-black text-cyan-400 mb-6">
            Withdrawal Timeline
          </h2>

          <div className="space-y-5">

            {filteredWithdraws.map((item) => (

              <div
                key={item._id}
                className="bg-black border border-zinc-800 rounded-2xl p-5"
              >

                <div className="flex justify-between items-start flex-wrap gap-4">

                  <div>
                    <h3 className="text-xl font-bold text-green-400">
                      PKR {item.amount.toLocaleString()}
                    </h3>

                    <p className="text-gray-400">
                      {item.paymentMethod.replace("_", " ")}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor(
                      item.status
                    )}`}
                  >
                    {item.status}
                  </span>

                </div>

                <div className="mt-5 grid md:grid-cols-2 gap-4 text-sm">

                  <div>
                    <span className="text-gray-500">Account Title</span>

                    <p>{item.accountTitle}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">Account Number</span>

                    <p>{item.accountNumber}</p>
                  </div>

                  {item.bankName && (
                    <div>
                      <span className="text-gray-500">Bank Name</span>

                      <p>{item.bankName}</p>
                    </div>
                  )}

                  {item.walletAddress && (
                    <div>
                      <span className="text-gray-500">Wallet Address</span>

                      <p className="break-all">{item.walletAddress}</p>
                    </div>
                  )}

                </div>

                {/* Transaction ID */}

                {item.transactionId && (
                  <div className="mt-4 bg-zinc-900 border border-zinc-700 rounded-xl p-3">
                    <span className="text-gray-500 text-xs">
                      Transaction ID
                    </span>

                    <p className="text-cyan-400 break-all font-mono text-sm mt-1">
                      {item.transactionId}
                    </p>
                  </div>
                )}

                {/* Admin Note */}

                <div className="mt-5 border-t border-zinc-800 pt-4">

                  <span className="text-gray-500 text-sm">
                    Admin Note
                  </span>

                  <div
                    className={`mt-2 rounded-xl p-4 text-sm ${
                      item.status === "Approved"
                        ? "bg-green-900/30 border border-green-600"
                        : item.status === "Rejected"
                        ? "bg-red-900/30 border border-red-600"
                        : "bg-yellow-900/30 border border-yellow-600"
                    }`}
                  >
                    {item.adminNote?.trim()
                      ? item.adminNote
                      : item.status === "Pending"
                      ? "Waiting for admin approval."
                      : "No admin note available."}
                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}

      {/* ================= RECEIPT VIEWER MODAL ================= */}

      {selectedReceipt && (

        <div className="fixed inset-0 bg-black/90 z-50 flex justify-center items-center p-6">

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5 max-w-3xl w-full">

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-2xl font-black text-yellow-400">
                Payment Receipt
              </h2>

              <button
                onClick={() => setSelectedReceipt("")}
                className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl font-bold"
              >
                Close
              </button>

            </div>

            <img
              src={selectedReceipt}
              alt="Payment Receipt"
              className="rounded-2xl w-full max-h-[650px] object-contain border border-zinc-700"
            />

          </div>

        </div>

      )}

      {/* ================= FOOTER ================= */}

      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        GoldTrade V17 Enterprise • Withdraw History Module
      </div>

    </main>
  );
}