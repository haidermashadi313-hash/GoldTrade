"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Landmark,
  Smartphone,
  Search,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface WithdrawRequest {
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

export default function AdminWithdrawPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState("");

  // Per-request admin notes
  const [adminNotes, setAdminNotes] = useState<
    Record<string, string>
  >({});

  // Search + Filter (Part 8 ready)
  const [searchUsername, setSearchUsername] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchWithdraws = async () => {
    try {
      setRefreshing(true);

      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${API}/api/admin/withdraw`,
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  // Dashboard Stats
  const stats = useMemo(() => {
    return {
      pending: withdraws.filter(
        (w) => w.status === "Pending"
      ).length,

      approved: withdraws.filter(
        (w) => w.status === "Approved"
      ).length,

      rejected: withdraws.filter(
        (w) => w.status === "Rejected"
      ).length,

      totalAmount: withdraws
        .filter((w) => w.status === "Approved")
        .reduce((sum, w) => sum + w.amount, 0),
    };
  }, [withdraws]);

  const filteredWithdraws = useMemo(() => {
    return withdraws.filter((item) => {
      const usernameMatch = item.username
        .toLowerCase()
        .includes(searchUsername.toLowerCase());

      const statusMatch =
        statusFilter === "ALL"
          ? true
          : item.status === statusFilter;

      return usernameMatch && statusMatch;
    });
  }, [withdraws, searchUsername, statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center text-yellow-400 text-2xl font-black">
        Loading Withdraw Dashboard...
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
          onClick={fetchWithdraws}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
        >
          <RefreshCw size={18}/>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>

      </div>

      <h1 className="text-4xl font-black text-yellow-400 mb-2">
        Withdraw Approval Center
      </h1>

      <p className="text-gray-400 mb-8">
        Manual withdrawal approval, rejection and wallet management.
      </p>

      {/* DASHBOARD CARDS */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
          <Clock className="text-yellow-400 mb-3"/>
          <p className="text-gray-400 text-sm">Pending</p>

          <h2 className="text-3xl font-black text-yellow-400">
            {stats.pending}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">
          <CheckCircle className="text-green-400 mb-3"/>
          <p className="text-gray-400 text-sm">Approved</p>

          <h2 className="text-3xl font-black text-green-400">
            {stats.approved}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-5">
          <XCircle className="text-red-400 mb-3"/>
          <p className="text-gray-400 text-sm">Rejected</p>

          <h2 className="text-3xl font-black text-red-400">
            {stats.rejected}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-5">
          <Wallet className="text-cyan-400 mb-3"/>
          <p className="text-gray-400 text-sm">
            Total Approved Amount
          </p>

          <h2 className="text-3xl font-black text-cyan-400">
            PKR {stats.totalAmount.toLocaleString()}
          </h2>
        </div>

      </div>

      {/* SEARCH + STATUS FILTER */}

      <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-5 mb-8">

        <h2 className="text-xl font-black text-cyan-400 mb-5 flex items-center gap-2">
          <Search size={20}/>
          Search & Status Filter
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input
            type="text"
            placeholder="Search Username..."
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            className="bg-black border border-zinc-700 rounded-xl p-3 outline-none focus:border-cyan-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-black border border-zinc-700 rounded-xl p-3 outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

        </div>

      </div>      {/* ================= WITHDRAW REQUESTS TABLE ================= */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

          <h2 className="text-3xl font-black text-yellow-400">
            Withdrawal Requests
          </h2>

          <span className="bg-yellow-500 text-black px-4 py-2 rounded-full font-bold">
            {filteredWithdraws.length} Requests
          </span>

        </div>

        {filteredWithdraws.length === 0 ? (

          <div className="py-16 text-center">

            <Clock className="mx-auto text-gray-600 mb-4" size={60}/>

            <h3 className="text-2xl font-bold text-gray-400">
              No Withdrawal Requests Found
            </h3>

            <p className="text-gray-500 mt-2">
              Pending withdrawal requests will appear here.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto rounded-xl">

            <table className="w-full">

              <thead className="bg-black text-yellow-400 uppercase text-sm">
                <tr>
                  <th className="px-4 py-4 text-left">User</th>
                  <th className="px-4 py-4 text-left">Amount</th>
                  <th className="px-4 py-4 text-left">Method</th>
                  <th className="px-4 py-4 text-left">Account Details</th>
                  <th className="px-4 py-4 text-left">Status</th>
                  <th className="px-4 py-4 text-left">Date</th>
                  <th className="px-4 py-4 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredWithdraws.map((item) => (

                  <tr
                    key={item._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                  >

                    {/* USERNAME */}

                    <td className="px-4 py-5 font-semibold text-white">
                      {item.username}
                    </td>

                    {/* AMOUNT */}

                    <td className="px-4 py-5 font-bold text-green-400">
                      PKR {item.amount.toLocaleString()}
                    </td>

                    {/* PAYMENT METHOD */}

                    <td className="px-4 py-5">
                      <span className="bg-zinc-800 px-3 py-1 rounded-full text-sm">
                        {item.paymentMethod.replace("_", " ")}
                      </span>
                    </td>

                    {/* ACCOUNT DETAILS */}

                    <td className="px-4 py-5 text-sm text-gray-300">

                      {item.paymentMethod === "BANK" ? (

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Landmark size={15} className="text-cyan-400"/>
                            {item.bankName}
                          </div>

                          <div>{item.accountTitle}</div>
                          <div>{item.accountNumber}</div>

                          {item.iban && (
                            <div className="text-gray-500">
                              IBAN: {item.iban}
                            </div>
                          )}
                        </div>

                      ) : item.paymentMethod === "USDT_TRC20" ? (

                        <div className="space-y-1">
                          <div>{item.network}</div>

                          <div className="break-all text-cyan-400">
                            {item.walletAddress}
                          </div>
                        </div>

                      ) : (

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Smartphone size={15} className="text-cyan-400"/>
                            {item.paymentMethod}
                          </div>

                          <div>{item.accountTitle}</div>
                          <div>{item.accountNumber}</div>
                        </div>

                      )}

                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-5">

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.status === "Approved"
                            ? "bg-green-600 text-white"
                            : item.status === "Rejected"
                            ? "bg-red-600 text-white"
                            : "bg-yellow-500 text-black"
                        }`}
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

                    {/* ACTIONS */}

                    <td className="px-4 py-5">

                      {item.status === "Pending" ? (

                        <div className="flex flex-col gap-3">

                          {/* Admin Note */}

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
                                const token =
                                  localStorage.getItem("token");

                                await axios.put(
                                  `${API}/api/admin/withdraw/${item._id}/approve`,
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

                                alert("Withdrawal Approved Successfully.");

                                fetchWithdraws();

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
                                const token =
                                  localStorage.getItem("token");

                                await axios.put(
                                  `${API}/api/admin/withdraw/${item._id}/reject`,
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

                                alert("Withdrawal Rejected Successfully.");

                                fetchWithdraws();

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

                      ) : (

                        <div className="text-sm text-gray-400 space-y-2">

                          <p>
                            <span className="text-gray-500">
                              Admin Note:
                            </span>
                          </p>

                          <div
                            className={`rounded-lg p-3 ${
                              item.status === "Approved"
                                ? "bg-green-900/30 border border-green-700"
                                : "bg-red-900/30 border border-red-700"
                            }`}
                          >
                            {item.adminNote || "No admin note."}
                          </div>

                          {item.receiptImage && (
                            <button
                              onClick={() =>
                                setSelectedReceipt(
                                  `${API}${item.receiptImage}`
                                )
                              }
                              className="bg-cyan-500 hover:bg-cyan-400 text-black px-3 py-2 rounded-lg flex items-center gap-2 font-bold"
                            >
                              <Eye size={16}/>
                              View Receipt
                            </button>
                          )}

                        </div>

                      )}

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
                Withdrawal Payment Receipt
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
              alt="Withdrawal Receipt"
              className="rounded-2xl w-full max-h-[650px] object-contain border border-zinc-700"
            />

          </div>

        </div>

      )}

      {/* ================= FOOTER ================= */}

      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        GoldTrade V17 Enterprise • Admin Withdraw Approval Dashboard
      </div>

    </main>
  );
}