"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  CircleDollarSign,
  Eye,
  RefreshCw,
  Search,
  Calendar,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface USDTRequest {
  _id: string;
  username: string;
  transactionType: "BUY" | "SELL";
  paymentMethod: string;
  pkrAmount: number;
  usdtAmount: number;
  rate: number;
  status: "Pending" | "Approved" | "Rejected";
  walletAddress?: string;
  accountTitle?: string;
  accountNumber?: string;
  bankName?: string;
  receiptImage?: string;
  adminNote?: string;
  createdAt: string;
}

export default function AdminUsdtPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [requests, setRequests] = useState<USDTRequest[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState("");

  // Individual admin notes
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  // Search & Filter
  const [searchUsername, setSearchUsername] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchRequests = async () => {
    try {
      setRefreshing(true);

      const token = localStorage.getItem("token");

      const res = await axios.get(`${API}/api/usdt/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setRequests(res.data.transactions || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ================= FILTERED REQUESTS =================

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const usernameMatch = item.username
        .toLowerCase()
        .includes(searchUsername.toLowerCase());

      const statusMatch =
        statusFilter === "ALL"
          ? true
          : item.status === statusFilter;

      const itemDate = new Date(item.createdAt);

      const fromMatch =
        !fromDate || itemDate >= new Date(fromDate);

      const toMatch =
        !toDate ||
        itemDate <= new Date(`${toDate}T23:59:59`);

      return (
        usernameMatch &&
        statusMatch &&
        fromMatch &&
        toMatch
      );
    });
  }, [requests, searchUsername, statusFilter, fromDate, toDate]);

  // ================= DASHBOARD STATS =================

  const totalBuy = useMemo(
    () =>
      requests.filter((item) => item.transactionType === "BUY").length,
    [requests]
  );

  const totalSell = useMemo(
    () =>
      requests.filter((item) => item.transactionType === "SELL").length,
    [requests]
  );

  const totalBuyVolume = useMemo(
    () =>
      requests
        .filter((item) => item.transactionType === "BUY")
        .reduce((sum, item) => sum + item.usdtAmount, 0),
    [requests]
  );

  const totalSellVolume = useMemo(
    () =>
      requests
        .filter((item) => item.transactionType === "SELL")
        .reduce((sum, item) => sum + item.usdtAmount, 0),
    [requests]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center text-yellow-400 text-2xl font-black">
        Loading USDT Admin Dashboard...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white p-6">

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 text-yellow-400"
        >
          <ArrowLeft size={20}/>
          Admin Dashboard
        </Link>

        <button
          onClick={fetchRequests}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
        >
          <RefreshCw size={18}/>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

      </div>

      <h1 className="text-4xl font-black text-yellow-400 mb-2">
        USDT Approval Center
      </h1>

      <p className="text-gray-400 mb-8">
        Buy USDT • Sell USDT • Manual Approval Dashboard
      </p>

      {/* DASHBOARD CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <Wallet className="text-green-400 mb-3" size={32}/>
          <p className="text-gray-400 text-sm">Pending BUY</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            {totalBuy}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <CircleDollarSign className="text-red-400 mb-3" size={32}/>
          <p className="text-gray-400 text-sm">Pending SELL</p>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            {totalSell}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
          <CheckCircle className="text-cyan-400 mb-3" size={32}/>
          <p className="text-gray-400 text-sm">BUY Volume</p>

          <h2 className="text-3xl font-black text-cyan-400 mt-2">
            {totalBuyVolume.toFixed(2)} USDT
          </h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <Clock className="text-yellow-400 mb-3" size={32}/>
          <p className="text-gray-400 text-sm">SELL Volume</p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {totalSellVolume.toFixed(2)} USDT
          </h2>
        </div>

      </div>
            {/* ================= SEARCH & FILTER ================= */}

      <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-5 mb-8">

        <h2 className="text-xl font-black text-cyan-400 mb-5 flex items-center gap-2">
          <Search size={20}/>
          Search & Filter Requests
        </h2>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* Username Search */}

          <input
            type="text"
            placeholder="Search Username..."
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            className="bg-black border border-zinc-700 rounded-xl p-3 focus:border-cyan-500 outline-none"
          />

          {/* Status */}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-zinc-700 rounded-xl p-3 focus:border-cyan-500 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* From Date */}

          <div className="flex items-center bg-black border border-zinc-700 rounded-xl px-3">
            <Calendar size={18} className="text-cyan-400 mr-2"/>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent w-full py-3 outline-none"
            />
          </div>

          {/* To Date */}

          <div className="flex items-center bg-black border border-zinc-700 rounded-xl px-3">
            <Calendar size={18} className="text-cyan-400 mr-2"/>

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent w-full py-3 outline-none"
            />
          </div>

        </div>

        <button
          onClick={() => {
            setSearchUsername("");
            setStatusFilter("ALL");
            setFromDate("");
            setToDate("");
          }}
          className="mt-5 bg-red-600 hover:bg-red-500 px-5 py-2 rounded-xl font-bold"
        >
          Clear Filters
        </button>

      </div>

      {/* ================= PENDING REQUESTS TABLE ================= */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

          <h2 className="text-3xl font-black text-yellow-400">
            Pending USDT Requests
          </h2>

          <span className="bg-yellow-500 text-black px-4 py-2 rounded-full font-bold">
            {filteredRequests.length} Results
          </span>

        </div>

        {filteredRequests.length === 0 ? (

          <div className="py-16 text-center">

            <Clock className="mx-auto text-gray-500 mb-4" size={60}/>

            <h3 className="text-2xl font-bold text-gray-400">
              No Matching Requests
            </h3>

            <p className="text-gray-500 mt-2">
              Try another username or change your filters.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto rounded-xl">

            <table className="w-full">

              <thead className="bg-black text-yellow-400 uppercase text-sm">
                <tr>
                  <th className="px-4 py-4 text-left">User</th>
                  <th className="px-4 py-4 text-left">Type</th>
                  <th className="px-4 py-4 text-left">USDT</th>
                  <th className="px-4 py-4 text-left">PKR</th>
                  <th className="px-4 py-4 text-left">Payment</th>
                  <th className="px-4 py-4 text-left">Receipt</th>
                  <th className="px-4 py-4 text-left">Date</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredRequests.map((item) => (

                  <tr
                    key={item._id}
                    className="border-b border-zinc-700 hover:bg-zinc-800 transition"
                  >

                    {/* USERNAME */}

                    <td className="px-4 py-5 font-semibold text-white">
                      {item.username}
                    </td>

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

                    <td className="px-4 py-5 text-cyan-400 font-bold">
                      {item.usdtAmount.toFixed(2)} USDT
                    </td>

                    {/* PKR */}

                    <td className="px-4 py-5 text-green-400 font-bold">
                      PKR {item.pkrAmount.toLocaleString()}
                    </td>

                    {/* PAYMENT */}

                    <td className="px-4 py-5">
                      {item.paymentMethod}
                    </td>

                    {/* RECEIPT */}

                    <td className="px-4 py-5">

                      {item.receiptImage ? (

                        <button
                          onClick={() =>
                            setSelectedReceipt(`${API}${item.receiptImage}`)
                          }
                          className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-2 rounded-lg flex items-center gap-2"
                        >
                          <Eye size={16}/>
                          View
                        </button>

                      ) : (
                        <span className="text-gray-500 text-sm">
                          No Receipt
                        </span>
                      )}

                    </td>

                    {/* DATE */}

                    <td className="px-4 py-5 text-gray-400 text-sm">
                      {new Date(item.createdAt).toLocaleDateString("en-GB")}
                      <br/>
                      {new Date(item.createdAt).toLocaleTimeString("en-GB")}
                    </td>

                    {/* ACTIONS */}

                    <td className="px-4 py-5">

                      <div className="flex flex-col gap-3">

                        <textarea
                          rows={2}
                          placeholder="Admin Note..."
                          value={adminNotes[item._id] || ""}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({
                              ...prev,
                              [item._id]: e.target.value,
                            }))
                          }
                          className="bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm resize-none"
                        />

                        {/* APPROVE */}

                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("token");

                              await axios.put(
                                `${API}/api/usdt/${item._id}/approve`,
                                {
                                  adminNote:
                                    adminNotes[item._id] || "",
                                },
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              );

                              fetchRequests();

                              alert(
                                `${item.transactionType} Approved Successfully`
                              );

                            } catch (err) {
                              console.log(err);
                              alert("Approval Failed.");
                            }
                          }}
                          className="bg-green-600 hover:bg-green-500 text-white rounded-lg py-2 flex items-center justify-center gap-2 font-bold"
                        >
                          <CheckCircle size={18}/>
                          Approve
                        </button>

                        {/* REJECT */}

                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("token");

                              await axios.put(
                                `${API}/api/usdt/${item._id}/reject`,
                                {
                                  adminNote:
                                    adminNotes[item._id] || "",
                                },
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              );

                              fetchRequests();

                              alert(
                                `${item.transactionType} Rejected Successfully`
                              );

                            } catch (err) {
                              console.log(err);
                              alert("Reject Failed.");
                            }
                          }}
                          className="bg-red-600 hover:bg-red-500 text-white rounded-lg py-2 flex items-center justify-center gap-2 font-bold"
                        >
                          <XCircle size={18}/>
                          Reject
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

      {/* ================= RECEIPT VIEWER MODAL ================= */}

      {selectedReceipt && (

        <div className="fixed inset-0 bg-black/90 z-50 flex justify-center items-center p-6">

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5 max-w-3xl w-full">

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-2xl font-black text-yellow-400">
                Receipt Viewer
              </h2>

              <button
                onClick={() => setSelectedReceipt("")}
                className="bg-red-500 hover:bg-red-400 px-4 py-2 rounded-xl font-bold"
              >
                Close
              </button>

            </div>

            <img
              src={selectedReceipt}
              alt="Receipt"
              className="rounded-2xl w-full max-h-[650px] object-contain border border-zinc-700"
            />

          </div>

        </div>

      )}

      {/* ================= FOOTER ================= */}

      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        GoldTrade V17 Enterprise • USDT Admin Approval Dashboard
      </div>

    </main>
  );
}