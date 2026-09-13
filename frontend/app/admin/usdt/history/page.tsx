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
  CircleDollarSign,
  Wallet,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface USDTTransaction {
  _id: string;
  transactionType: "BUY" | "SELL";
  paymentMethod: string;
  usdtAmount: number;
  pkrAmount: number;
  rate: number;
  status: "Pending" | "Approved" | "Rejected";
  adminNote?: string;
  createdAt: string;
}

export default function USDTHistoryPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<USDTTransaction[]>([]);
  const [filter, setFilter] = useState("ALL");

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

      const res = await axios.get(
        `${API}/api/usdt/history/${user}`
      );

      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (filter === "ALL") return transactions;

    return transactions.filter((item) => item.status === filter);
  }, [transactions, filter]);

  // Dashboard Stats
  const stats = useMemo(() => {
    return {
      totalBuy: transactions
        .filter((t) => t.transactionType === "BUY")
        .reduce((sum, t) => sum + t.usdtAmount, 0),

      totalSell: transactions
        .filter((t) => t.transactionType === "SELL")
        .reduce((sum, t) => sum + t.usdtAmount, 0),

      pending: transactions.filter((t) => t.status === "Pending").length,

      approved: transactions.filter((t) => t.status === "Approved").length,

      rejected: transactions.filter((t) => t.status === "Rejected").length,
    };
  }, [transactions]);

  const statusBadge = (status: string) => {
    if (status === "Approved")
      return "bg-green-600 text-white";

    if (status === "Rejected")
      return "bg-red-600 text-white";

    return "bg-yellow-500 text-black";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-yellow-400 text-2xl font-black">
        Loading USDT History...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-yellow-400"
        >
          <ArrowLeft size={20}/>
          Dashboard
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
        USDT Transaction History
      </h1>

      <p className="text-gray-400 mb-8">
        Buy USDT • Sell USDT • Approval Timeline
      </p>

      {/* DASHBOARD CARDS */}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-5 mb-10">

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">
          <CircleDollarSign className="text-green-400 mb-3"/>
          <p className="text-gray-400 text-sm">Total Bought</p>

          <h2 className="text-3xl font-black text-green-400">
            {stats.totalBuy.toFixed(2)}
          </h2>

          <p className="text-xs text-gray-500 mt-1">USDT</p>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-5">
          <Wallet className="text-red-400 mb-3"/>
          <p className="text-gray-400 text-sm">Total Sold</p>

          <h2 className="text-3xl font-black text-red-400">
            {stats.totalSell.toFixed(2)}
          </h2>

          <p className="text-xs text-gray-500 mt-1">USDT</p>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
          <Clock className="text-yellow-400 mb-3"/>
          <p className="text-gray-400 text-sm">Pending</p>

          <h2 className="text-3xl font-black text-yellow-400">
            {stats.pending}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-5">
          <CheckCircle className="text-green-400 mb-3"/>
          <p className="text-gray-400 text-sm">Approved</p>

          <h2 className="text-3xl font-black text-green-400">
            {stats.approved}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-5">
          <XCircle className="text-red-400 mb-3"/>
          <p className="text-gray-400 text-sm">Rejected</p>

          <h2 className="text-3xl font-black text-red-400">
            {stats.rejected}
          </h2>
        </div>

      </div>

      {/* FILTER TABS */}

      <div className="flex flex-wrap gap-3 mb-8">

        {["ALL", "Pending", "Approved", "Rejected"].map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-5 py-3 rounded-full font-bold transition ${
              filter === item
                ? "bg-yellow-500 text-black"
                : "bg-zinc-900 border border-zinc-700 text-white hover:border-yellow-500"
            }`}
          >
            {item}
          </button>
        ))}

      </div>
            {/* ================= TRANSACTION TABLE ================= */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-black text-yellow-400">
            Transaction History
          </h2>

          <span className="bg-yellow-500 text-black px-4 py-2 rounded-full font-bold">
            {filteredTransactions.length} Records
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center">
            <CircleDollarSign
              className="mx-auto text-gray-600 mb-4"
              size={60}
            />

            <h3 className="text-2xl font-bold text-gray-400">
              No Transactions Found
            </h3>

            <p className="text-gray-500 mt-2">
              Your USDT Buy/Sell requests will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full">

              <thead className="bg-black text-yellow-400 uppercase text-sm">
                <tr>
                  <th className="px-4 py-4 text-left">Type</th>
                  <th className="px-4 py-4 text-left">USDT</th>
                  <th className="px-4 py-4 text-left">PKR</th>
                  <th className="px-4 py-4 text-left">Rate</th>
                  <th className="px-4 py-4 text-left">Payment</th>
                  <th className="px-4 py-4 text-left">Status</th>
                  <th className="px-4 py-4 text-left">Date</th>
                </tr>
              </thead>

              <tbody>

                {filteredTransactions.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                  >
                    {/* BUY / SELL */}

                    <td className="px-4 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.transactionType === "BUY"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {item.transactionType}
                      </span>
                    </td>

                    {/* USDT */}

                    <td className="px-4 py-5 font-bold text-cyan-400">
                      {item.usdtAmount.toFixed(2)} USDT
                    </td>

                    {/* PKR */}

                    <td className="px-4 py-5 font-bold text-green-400">
                      PKR{" "}
                      {item.pkrAmount.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* RATE */}

                    <td className="px-4 py-5 text-gray-300">
                      PKR {item.rate}
                    </td>

                    {/* PAYMENT */}

                    <td className="px-4 py-5">
                      <span className="bg-zinc-800 px-3 py-1 rounded-full text-sm">
                        {item.paymentMethod}
                      </span>
                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* DATE */}

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

      {/* ================= TIMELINE / ADMIN NOTES ================= */}

      {filteredTransactions.length > 0 && (
        <div className="mt-10 bg-zinc-900 border border-cyan-500 rounded-3xl p-6">

          <h2 className="text-2xl font-black text-cyan-400 mb-6">
            Approval Timeline
          </h2>

          <div className="space-y-5">

            {filteredTransactions.map((item) => (
              <div
                key={item._id}
                className="border border-zinc-800 rounded-2xl p-5 bg-black"
              >
                <div className="flex justify-between items-start flex-wrap gap-4">

                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.transactionType === "BUY"
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {item.transactionType}
                      </span>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${statusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">
                      {item.usdtAmount.toFixed(2)} USDT
                    </h3>

                    <p className="text-gray-400">
                      PKR{" "}
                      {item.pkrAmount.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div className="text-right text-gray-400 text-sm">
                    {new Date(item.createdAt).toLocaleDateString("en-GB")}
                    <br/>
                    {new Date(item.createdAt).toLocaleTimeString("en-GB")}
                  </div>

                </div>

                <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm">

                  <div>
                    <span className="text-gray-500">Payment Method</span>

                    <p className="font-semibold">
                      {item.paymentMethod}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">Exchange Rate</span>

                    <p className="font-semibold">
                      PKR {item.rate}
                    </p>
                  </div>

                </div>

                {/* ADMIN NOTE */}

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
                      : "No admin note provided."}
                  </div>

                </div>

              </div>
            ))}

          </div>

        </div>
      )}

      {/* ================= SUMMARY ================= */}

      <div className="mt-10 bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-3xl p-6 text-black">

        <h2 className="text-2xl font-black mb-5">
          GoldTrade USDT Summary
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          <div>
            <p className="text-black/70 text-sm">
              Total Buy Volume
            </p>

            <h3 className="text-3xl font-black">
              {stats.totalBuy.toFixed(2)} USDT
            </h3>
          </div>

          <div>
            <p className="text-black/70 text-sm">
              Total Sell Volume
            </p>

            <h3 className="text-3xl font-black">
              {stats.totalSell.toFixed(2)} USDT
            </h3>
          </div>

          <div>
            <p className="text-black/70 text-sm">
              Total Requests
            </p>

            <h3 className="text-3xl font-black">
              {transactions.length}
            </h3>
          </div>

        </div>

      </div>

      {/* ================= FOOTER ================= */}

      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        GoldTrade V17 Enterprise • USDT Buy/Sell History
      </div>

    </main>
  );
}