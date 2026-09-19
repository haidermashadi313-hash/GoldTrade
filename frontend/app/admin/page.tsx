"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Search,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://goldtrade-api.onrender.com";

// ========================================
// TYPES
// ========================================

interface WithdrawRequest {
  _id: string;
  username: string;
  amount: number;
  paymentMethod: string;
  accountNumber: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

export default function AdminWithdrawPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // ========================================
  // LOAD WITHDRAW REQUESTS
  // ========================================

  const loadWithdraws = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/withdraws`,
        {
          headers,
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setWithdraws(data.withdraws || []);
      } else {
        setWithdraws([]);
      }
    } catch (err) {
      console.error("Withdraw Load Error:", err);
      setWithdraws([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadWithdraws();
    } else {
      setLoading(false);
    }
  }, []);

  // ========================================
  // APPROVE / REJECT
  // ========================================

  const updateStatus = async (
    id: string,
    status: "Approved" | "Rejected"
  ) => {
    try {
      const response = await fetch(
        `${API}/api/admin/withdraws/${id}/${status.toLowerCase()}`,
        {
          method: "PUT",
          headers,
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await loadWithdraws();
      } else {
        alert(data.message || "Action failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Server Error");
    }
  };

  // ========================================
  // FILTER
  // ========================================

  const filteredWithdraws = useMemo(() => {
    return withdraws.filter((item) => {
      const searchMatch =
        item.username
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        item.accountNumber
          .toLowerCase()
          .includes(search.toLowerCase());

      const statusMatch =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [withdraws, search, statusFilter]);

  // ========================================
  // SUMMARY
  // ========================================

  const pendingCount = withdraws.filter(
    (item) => item.status === "Pending"
  ).length;

  const approvedAmount = withdraws
    .filter((item) => item.status === "Approved")
    .reduce((sum, item) => sum + item.amount, 0);

  const rejectedCount = withdraws.filter(
    (item) => item.status === "Rejected"
  ).length;  // ========================================
  // LOADING SCREEN
  // ========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading Withdraw Requests...
      </main>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <Wallet size={38} />
              Withdraw Manager
            </h1>

            <p className="text-gray-400 mt-2">
              Approve or reject user withdrawal requests.
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
              onClick={loadWithdraws}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </header>

        {/* ================= SUMMARY ================= */}

        <section className="grid md:grid-cols-3 gap-5">

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
            <p className="text-gray-400">Pending Requests</p>

            <h2 className="text-3xl font-black text-yellow-400 mt-2">
              {pendingCount}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6">
            <p className="text-gray-400">Approved Amount</p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              PKR {approvedAmount.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-6">
            <p className="text-gray-400">Rejected Requests</p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              {rejectedCount}
            </h2>
          </div>

        </section>

        {/* ================= SEARCH & FILTER ================= */}

        <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">

          <div className="grid md:grid-cols-2 gap-4">

            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-gray-500"
                size={18}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username or account..."
                className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3"
            >
              <option value="ALL">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

          </div>

        </section>

        {/* ================= TABLE ================= */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            Withdraw Requests
          </h2>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>
                <tr className="border-b border-zinc-700 text-cyan-400">
                  <th className="p-3">User</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Account</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredWithdraws.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-gray-500"
                    >
                      No withdrawal requests found.
                    </td>
                  </tr>
                ) : (
                  filteredWithdraws.map((item) => (
                    <tr
                      key={item._id}
                      className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                    >

                      <td className="p-3 font-semibold text-yellow-400">
                        {item.username}
                      </td>

                      <td className="p-3">{item.paymentMethod}</td>

                      <td className="p-3 text-gray-300">
                        {item.accountNumber}
                      </td>

                      <td className="p-3 text-green-400 font-bold">
                        PKR {item.amount.toLocaleString()}
                      </td>

                      <td className="p-3">
                        {item.status === "Pending" && (
                          <span className="flex items-center gap-2 text-yellow-400 font-semibold">
                            <Clock size={16} />
                            Pending
                          </span>
                        )}

                        {item.status === "Approved" && (
                          <span className="flex items-center gap-2 text-green-400 font-semibold">
                            <CheckCircle size={16} />
                            Approved
                          </span>
                        )}

                        {item.status === "Rejected" && (
                          <span className="flex items-center gap-2 text-red-400 font-semibold">
                            <XCircle size={16} />
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-gray-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>

                      <td className="p-3">

                        {item.status === "Pending" ? (

                          <div className="flex gap-2 justify-center">

                            <button
                              onClick={() =>
                                updateStatus(item._id, "Approved")
                              }
                              className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-semibold"
                            >
                              Approve
                            </button>

                            <button
                              onClick={() =>
                                updateStatus(item._id, "Rejected")
                              }
                              className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-semibold"
                            >
                              Reject
                            </button>

                          </div>

                        ) : (
                          <span className="text-gray-500 text-sm">
                            Completed
                          </span>
                        )}

                      </td>

                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>
    </main>
  );
}


