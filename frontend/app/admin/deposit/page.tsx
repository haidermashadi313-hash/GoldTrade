"use client";

/* ==========================================================
   GoldTrade V18 Enterprise
   Admin Deposit Manager (PART 1/4)
   Linux + Render + Vercel Compatible
========================================================== */

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
  ImageIcon,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-cky2.onrender.com";

/* ==========================================================
   TYPES
========================================================== */

interface DepositRequest {
  _id: string;
  username: string;
  requestAmount: number;
  paymentMethod: "JazzCash" | "Easypaisa" | "Bank" | "USDT";
  transactionId: string;
  receiptImage?: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNote?: string;
  reviewedAt?: string;
  createdAt: string;
}

/* ==========================================================
   COMPONENT
========================================================== */

export default function AdminDepositsPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  /* ================= STATES ================= */

  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  /* ==========================================================
     LOAD ALL DEPOSITS
  ========================================================== */

  const loadDeposits = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(`${API}/api/deposit/admin`, {
        headers,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load deposits.");
      }

      setDeposits(data.deposits || []);
    } catch (error) {
      console.error("LOAD DEPOSITS:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadDeposits();
    } else {
      setLoading(false);
    }
  }, []);

  /* ==========================================================
     SEARCH + FILTER
  ========================================================== */

  const filteredDeposits = useMemo(() => {
    return deposits.filter((deposit) => {
      const usernameMatch =
        deposit.username
          .toLowerCase()
          .includes(search.toLowerCase());

      const statusMatch =
        statusFilter === "ALL"
          ? true
          : deposit.status === statusFilter;

      return usernameMatch && statusMatch;
    });
  }, [deposits, search, statusFilter]);
    /* ==========================================================
     APPROVE DEPOSIT (STATUS ONLY)
     NO WALLET CREDIT
  ========================================================== */

  const approveDeposit = async (id: string) => {
    try {
      setProcessingId(id);
      setMessage("");

      const response = await fetch(
        `${API}/api/deposit/admin/${id}/approve`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            adminNote: "Deposit approved by admin.",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to approve deposit.");
      }

      setMessageType("success");
      setMessage("Deposit approved successfully.");

      await loadDeposits();

    } catch (error) {
      console.error("APPROVE ERROR:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to approve deposit."
      );
    } finally {
      setProcessingId("");
    }
  };

  /* ==========================================================
     REJECT DEPOSIT (STATUS ONLY)
     NO WALLET DEBIT
  ========================================================== */

  const rejectDeposit = async (id: string) => {
    try {
      setProcessingId(id);
      setMessage("");

      const response = await fetch(
        `${API}/api/deposit/admin/${id}/reject`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            adminNote: "Deposit rejected by admin.",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to reject deposit.");
      }

      setMessageType("success");
      setMessage("Deposit rejected successfully.");

      await loadDeposits();

    } catch (error) {
      console.error("REJECT ERROR:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to reject deposit."
      );
    } finally {
      setProcessingId("");
    }
  };

  /* ==========================================================
     SUMMARY CARDS
  ========================================================== */

  const pendingCount = deposits.filter(
    (item) => item.status === "Pending"
  ).length;

  const approvedCount = deposits.filter(
    (item) => item.status === "Approved"
  ).length;

  const rejectedCount = deposits.filter(
    (item) => item.status === "Rejected"
  ).length;

  const pendingAmount = deposits
    .filter((item) => item.status === "Pending")
    .reduce((sum, item) => sum + Number(item.requestAmount || 0), 0);

  const approvedAmount = deposits
    .filter((item) => item.status === "Approved")
    .reduce((sum, item) => sum + Number(item.requestAmount || 0), 0);

  /* ==========================================================
     LOADING SCREEN
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400 text-xl font-bold">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading Deposit Manager...
      </main>
    );
  }

  /* ==========================================================
     PAGE START
  ========================================================== */

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap justify-between items-center gap-4">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <Wallet size={38} />
              Deposit Manager
            </h1>

            <p className="text-gray-400 mt-2">
              Review, approve or reject user deposit requests.
            </p>

          </div>

          <div className="flex gap-3">

            <Link
              href="/admin-dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <button
              type="button"
              onClick={loadDeposits}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

          </div>

        </header>

        {/* ================= SUCCESS / ERROR MESSAGE ================= */}

        {message && (
          <div
            className={`rounded-xl px-4 py-3 font-semibold ${
              messageType === "success"
                ? "bg-green-600/20 border border-green-500 text-green-400"
                : "bg-red-600/20 border border-red-500 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {/* ================= SUMMARY CARDS ================= */}

        <section className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Total Requests
            </p>

            <h2 className="text-3xl font-black text-cyan-400 mt-2">
              {deposits.length}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Pending
            </p>

            <h2 className="text-3xl font-black text-yellow-400 mt-2">
              {pendingCount}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Approved
            </p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              {approvedCount}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Rejected
            </p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              {rejectedCount}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-emerald-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Approved Amount
            </p>

            <h2 className="text-xl font-black text-emerald-400 mt-2">
              PKR {approvedAmount.toLocaleString()}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              Pending: PKR {pendingAmount.toLocaleString()}
            </p>

          </div>

        </section>

        {/* ================= SEARCH + FILTER ================= */}

        <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">

          <div className="grid md:grid-cols-2 gap-4">

            <div className="relative">

              <Search
                className="absolute left-3 top-3 text-gray-500"
                size={18}
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username..."
                className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-yellow-500"
              />

            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
            >
              <option value="ALL">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

          </div>

        </section>
                <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-cyan-400 mb-6">
            Deposit Requests
          </h2>

          {filteredDeposits.length === 0 ? (

            <div className="text-center py-12 text-gray-500">
              No deposit requests found.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left min-w-[980px]">

                <thead>

                  <tr className="border-b border-zinc-700 text-cyan-400">

                    <th className="p-3">User</th>

                    <th className="p-3">Method</th>

                    <th className="p-3">Amount</th>

                    <th className="p-3">Transaction ID</th>

                    <th className="p-3">Receipt</th>

                    <th className="p-3">Status</th>

                    <th className="p-3">Date</th>

                    <th className="p-3 text-center">Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredDeposits.map((deposit) => (

                    <tr
                      key={deposit._id}
                      className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                    >

                      {/* USER */}

                      <td className="p-3">

                        <div className="space-y-1">

                          <p className="font-bold text-yellow-400">
                            {deposit.username}
                          </p>

                          <p className="text-xs text-gray-500">
                            {deposit._id.slice(-8).toUpperCase()}
                          </p>

                        </div>

                      </td>

                      {/* PAYMENT METHOD */}

                      <td className="p-3 whitespace-nowrap">

                        <span className="bg-zinc-800 px-3 py-1 rounded-lg text-sm font-semibold">
                          {deposit.paymentMethod}
                        </span>

                      </td>

                      {/* AMOUNT */}

                      <td className="p-3 whitespace-nowrap">

                        <span className="text-green-400 font-bold text-lg">
                          PKR {Number(deposit.requestAmount).toLocaleString()}
                        </span>

                      </td>

                      {/* TRANSACTION ID */}

                      <td className="p-3">

                        <p className="text-sm text-gray-300 break-all">
                          {deposit.transactionId || "N/A"}
                        </p>

                      </td>

                      {/* RECEIPT */}

                      <td className="p-3 whitespace-nowrap">

                        {deposit.receiptImage ? (

                          <a
                            href={deposit.receiptImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 px-3 py-2 rounded-lg text-sm font-semibold"
                          >
                            <ImageIcon size={15} />
                            View Receipt
                          </a>

                        ) : (

                          <span className="text-gray-500 text-sm">
                            No Receipt
                          </span>

                        )}

                      </td>

                      {/* STATUS */}

                      <td className="p-3 whitespace-nowrap">

                        {deposit.status === "Pending" && (

                          <span className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
                            <Clock size={15} />
                            Pending
                          </span>

                        )}

                        {deposit.status === "Approved" && (

                          <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                            <CheckCircle size={15} />
                            Approved
                          </span>

                        )}

                        {deposit.status === "Rejected" && (

                          <span className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                            <XCircle size={15} />
                            Rejected
                          </span>

                        )}

                      </td>

                      {/* DATE */}

                      <td className="p-3 whitespace-nowrap text-gray-400 text-sm">

                        {deposit.createdAt
                          ? new Date(deposit.createdAt).toLocaleString()
                          : "N/A"}

                      </td>

                      {/* ACTION BUTTONS */}

                      <td className="p-3">

                        {deposit.status === "Pending" ? (

                          <div className="flex flex-col gap-2 min-w-[130px]">

                            {/* APPROVE */}

                            <button
                              type="button"
                              disabled={processingId === deposit._id}
                              onClick={() => approveDeposit(deposit._id)}
                              className={`rounded-lg py-2 text-sm font-bold transition ${
                                processingId === deposit._id
                                  ? "bg-green-800 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-500"
                              }`}
                            >
                              {processingId === deposit._id
                                ? "Processing..."
                                : "Approve"}
                            </button>

                            {/* REJECT */}

                            <button
                              type="button"
                              disabled={processingId === deposit._id}
                              onClick={() => rejectDeposit(deposit._id)}
                              className={`rounded-lg py-2 text-sm font-bold transition ${
                                processingId === deposit._id
                                  ? "bg-red-800 cursor-not-allowed"
                                  : "bg-red-600 hover:bg-red-500"
                              }`}
                            >
                              {processingId === deposit._id
                                ? "Processing..."
                                : "Reject"}
                            </button>

                          </div>

                        ) : (

                          <div className="text-center">

                            <span className="text-xs text-gray-500 font-semibold">
                              Completed
                            </span>

                            {deposit.reviewedAt && (
                              <p className="text-xs text-gray-600 mt-2">
                                {new Date(
                                  deposit.reviewedAt
                                ).toLocaleString()}
                              </p>
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

        </section>
                <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-yellow-400 mb-5">
            Admin Deposit Rules
          </h2>

          <div className="space-y-4 text-gray-300">

            <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
              <h3 className="font-bold text-green-400 mb-2">
                Deposit Approval Policy
              </h3>

              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Every deposit request is created with <strong>Pending</strong> status.</li>

                <li>Admin must verify receipt image and transaction ID.</li>

                <li>Admin can only <strong>Approve</strong> or <strong>Reject</strong> the request.</li>

                <li>Approved deposits remain in history permanently.</li>

                <li>Rejected deposits also remain in history for audit purposes.</li>
              </ul>
            </div>

            <div className="bg-red-950/30 border border-red-700 rounded-xl p-4">
              <h3 className="font-bold text-red-400 mb-2">
                Enterprise Security Rule (LOCKED)
              </h3>

              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Deposit approval does NOT change PKR wallet balance.</li>

                <li>Deposit approval does NOT change Gold wallet balance.</li>

                <li>Deposit approval does NOT change USDT wallet balance.</li>

                <li>Wallet balances are managed only inside <strong>Wallet Manager</strong>.</li>

                <li>This architecture prevents accidental wallet credits.</li>
              </ul>
            </div>

          </div>

        </section>

        {/* ===================================================== */}
        {/* QUICK STATISTICS */}
        {/* ===================================================== */}

        <section className="grid md:grid-cols-3 gap-5">

          <div className="bg-zinc-900 border border-yellow-500 rounded-xl p-5">

            <p className="text-gray-400 text-sm mb-2">
              Pending Amount
            </p>

            <h3 className="text-2xl font-black text-yellow-400">
              PKR {pendingAmount.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-xl p-5">

            <p className="text-gray-400 text-sm mb-2">
              Approved Amount
            </p>

            <h3 className="text-2xl font-black text-green-400">
              PKR {approvedAmount.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-cyan-500 rounded-xl p-5">

            <p className="text-gray-400 text-sm mb-2">
              Last Refresh
            </p>

            <h3 className="text-lg font-bold text-cyan-400">
              {new Date().toLocaleTimeString()}
            </h3>

          </div>

        </section>

        {/* ===================================================== */}
        {/* FOOTER */}
        {/* ===================================================== */}

        <footer className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center">

          <h3 className="text-xl font-black text-yellow-400">
            GoldTrade V18 Enterprise
          </h3>

          <p className="text-gray-400 mt-2">
            Deposit Manager • Enterprise Administration Module
          </p>

          <p className="text-gray-500 text-sm mt-3">
            Linux Safe • Render Ready • Vercel Ready • MongoDB Ready
          </p>

          <p className="text-green-400 text-sm mt-4 font-semibold">
            Wallet balances are never modified from Deposit Manager.
          </p>

        </footer>

      </div>
    </main>
  );
}