"use client";

import { useEffect, useState } from "react";
import {
  RefreshCw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  wallet,
  User,
} from "lucide-react";

// ======================================================
// API CONFIG (V18 FINAL)
// ======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ======================================================
// TYPES
// ======================================================

interface DepositRequest {
  _id: string;

  username: string;
  fullName?: string;
  email?: string;

  amount: number;
  currency?: "Pkr" | "Usdt";

  paymentMethod?: string;
  accountNumber?: string;

  receiptImage?: string;
  transactionId?: string;

  status: "Pending" | "Approved" | "Rejected";

  adminNote?: string;
  createdAt: string;
  approvedAt?: string;
}

// ======================================================
// PAGE
// ======================================================

export default function AdminDepositPage() {
  // ================= AUTH =================

  const [token, setToken] = useState("");

  // ================= LOADING =================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ================= DATA =================

  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [filteredDeposits, setFilteredDeposits] = useState<
    DepositRequest[]
  >([]);

  // ================= SEARCH =================

  const [search, setSearch] = useState("");

  // ================= DASHBOARD =================

  const [pendingAmount, setPendingAmount] = useState(0);
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  // ================= ADMIN NOTES =================

  const [adminNotes, setAdminNotes] = useState<
    Record<string, string>
  >({});

  // ================= MESSAGE =================

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  // ======================================================
  // ADMIN HEADERS
  // ======================================================

  const getAdminHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  // ======================================================
  // LOAD TOKEN
  // ======================================================

  useEffect(() => {
    const jwt = localStorage.getItem("token");

    if (!jwt) {
      window.location.href = "/login";
      return;
    }

    setToken(jwt);
  }, []);
  // ======================================================
// LOAD DEPOSIT REQUESTS (FINAL V18)
// ======================================================

const loadDeposits = async () => {
  if (!token) return;

  try {
    setLoading(true);
    setRefreshing(true);
    setMessage("");

    const response = await fetch(`${API}/api/deposit`, {
      method: "GET",
      headers: getAdminHeaders(),
      cache: "no-store",
    });

    const result = await response.json();

    console.log("DEPOSIT RESPONSE:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load deposit requests.");
    }

    // Support different backend response names
    const list: DepositRequest[] = Array.isArray(result.deposits)
      ? result.deposits
      : Array.isArray(result.requests)
      ? result.requests
      : Array.isArray(result.data)
      ? result.data
      : [];

    // Save data
    setDeposits(list);
    setFilteredDeposits(list);

    // ================= DASHBOARD TOTALS =================

    const pending = list.filter((item) => item.status === "Pending");
    const approved = list.filter((item) => item.status === "Approved");
    const rejected = list.filter((item) => item.status === "Rejected");

    setPendingAmount(
      pending.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    );

    setApprovedAmount(
      approved.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    );

    setRejectedCount(rejected.length);

    // ================= DEFAULT ADMIN NOTES =================

    const notes: Record<string, string> = {};

    list.forEach((item) => {
      notes[item._id] = item.adminNote || "";
    });

    setAdminNotes(notes);

  } catch (err: any) {
    console.error("LOAD DEPOSIT ERROR:", err);

    setDeposits([]);
    setFilteredDeposits([]);

    setMessageType("error");
    setMessage(err.message || "Failed to load deposits.");

  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

// ======================================================
// INITIAL LOAD
// ======================================================

useEffect(() => {
  if (token) {
    loadDeposits();
  }
}, [token]);

// ======================================================
// AUTO REFRESH EVERY 15 SECONDS
// ======================================================

useEffect(() => {
  if (!token) return;

  const timer = setInterval(() => {
    loadDeposits();
  }, 15000);

  return () => clearInterval(timer);
}, [token]);

// ======================================================
// SEARCH FILTER
// ======================================================

useEffect(() => {
  if (!search.trim()) {
    setFilteredDeposits(deposits);
    return;
  }

  const keyword = search.trim().toLowerCase();

  const filtered = deposits.filter((item) => {
    return (
      (item.username || "").toLowerCase().includes(keyword) ||
      (item.fullName || "").toLowerCase().includes(keyword) ||
      (item.email || "").toLowerCase().includes(keyword)
    );
  });

  setFilteredDeposits(filtered);
}, [search, deposits]);

// ======================================================
// REFRESH BUTTON
// ======================================================

const refreshData = () => {
  loadDeposits();
};
// ======================================================
// APPROVE DEPOSIT (FINAL V18)
// ======================================================

const handleApprove = async (deposit: DepositRequest) => {
  try {
    setRefreshing(true);
    setMessage("");

    const response = await fetch(
      `${API}/api/deposit/${deposit._id}/approve`,
      {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          adminNote:
            adminNotes[deposit._id] || "Deposit approved by admin.",
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to approve deposit.");
    }

    setMessageType("success");
    setMessage(
      `Pkr ${Number(deposit.amount).toLocaleString()} credited to ${deposit.username}.`
    );

    // Reload updated data
    await loadDeposits();

  } catch (err: any) {
    console.error("APPROVE DEPOSIT ERROR:", err);

    setMessageType("error");
    setMessage(err.message || "Deposit approval failed.");

  } finally {
    setRefreshing(false);
  }
};

// ======================================================
// REJECT DEPOSIT (FINAL V18)
// ======================================================

const handleReject = async (deposit: DepositRequest) => {
  try {
    setRefreshing(true);
    setMessage("");

    const response = await fetch(
      `${API}/api/deposit/${deposit._id}/reject`,
      {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          adminNote:
            adminNotes[deposit._id] || "Deposit rejected by admin.",
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to reject deposit.");
    }

    setMessageType("success");
    setMessage(`Deposit request rejected for ${deposit.username}.`);

    await loadDeposits();

  } catch (err: any) {
    console.error("REJECT DEPOSIT ERROR:", err);

    setMessageType("error");
    setMessage(err.message || "Deposit rejection failed.");

  } finally {
    setRefreshing(false);
  }
};

// ======================================================
// AUTO CLEAR SUCCESS / ERROR MESSAGE
// ======================================================

useEffect(() => {
  if (!message) return;

  const timer = setTimeout(() => {
    setMessage("");
  }, 3000);

  return () => clearTimeout(timer);
}, [message]);
// ======================================================
// PAGE UI START (FINAL V18)
// ======================================================

return (
  <div className="min-h-screen bg-black text-white p-6">


    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-5 mb-8">

      <div>
        <h1 className="text-4xl font-black text-yellow-400">
          Admin Deposit Panel
        </h1>

        <p className="text-gray-400 mt-2">
          GoldTrade V18 • Pkr Deposit Approval Management
        </p>

        <p className="text-sm text-gray-500 mt-1">
          wallet Credit + Transaction history Synchronization Enabled
        </p>
      </div>

      <button
        onClick={refreshData}
        disabled={refreshing}
        className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition"
      >
        <RefreshCw
          size={18}
          className={refreshing ? "animate-spin" : ""}
        />
        {refreshing ? "Refreshing..." : "Refresh Deposits"}
      </button>

    </div>

    {/* ====================================================== */}
    {/* SUCCESS / ERROR MESSAGE */}
    {/* ====================================================== */}

    {message && (
      <div
        className={`mb-6 rounded-xl px-4 py-3 border font-semibold ${
          messageType === "success"
            ? "bg-green-500/10 border-green-500 text-green-400"
            : "bg-red-500/10 border-red-500 text-red-400"
        }`}
      >
        {message}
      </div>
    )}

    {/* ====================================================== */}
    {/* DASHBOARD CARDS */}
    {/* ====================================================== */}

    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

      {/* Pending Pkr */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-4">
          <Clock className="text-yellow-400" size={34} />

          <span className="text-xs text-yellow-400 font-semibold uppercase">
            Pending
          </span>
        </div>

        <h2 className="text-3xl font-black text-yellow-400">
          Pkr {pendingAmount.toLocaleString()}
        </h2>

        <p className="text-gray-500 text-sm mt-2">
          Pending Deposit Amount
        </p>

      </div>

      {/* Approved Pkr */}

      <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-4">
          <CheckCircle className="text-green-400" size={34} />

          <span className="text-xs text-green-400 font-semibold uppercase">
            Approved
          </span>
        </div>

        <h2 className="text-3xl font-black text-green-400">
          Pkr {approvedAmount.toLocaleString()}
        </h2>

        <p className="text-gray-500 text-sm mt-2">
          Approved Deposit Amount
        </p>

      </div>

      {/* Rejected */}

      <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-4">
          <XCircle className="text-red-400" size={34} />

          <span className="text-xs text-red-400 font-semibold uppercase">
            Rejected
          </span>
        </div>

        <h2 className="text-3xl font-black text-red-400">
          {rejectedCount}
        </h2>

        <p className="text-gray-500 text-sm mt-2">
          Rejected Deposit Requests
        </p>

      </div>

      {/* Total Requests */}

      <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-4">
          <wallet className="text-cyan-400" size={34} />

          <span className="text-xs text-cyan-400 font-semibold uppercase">
            Total Requests
          </span>
        </div>

        <h2 className="text-3xl font-black text-cyan-400">
          {deposits.length}
        </h2>

        <p className="text-gray-500 text-sm mt-2">
          Total Deposit Requests
        </p>

      </div>

    </div>

    {/* ====================================================== */}
    {/* SEARCH BAR */}
    {/* ====================================================== */}

    <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5 mb-8">

      <div className="flex items-center gap-3">

        <Search className="text-yellow-400" size={20} />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Username, Full Name or Email..."
          className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500"
        />

      </div>

      <div className="mt-3 text-xs text-gray-500">
        Showing {filteredDeposits.length} of {deposits.length} deposit requests.
      </div>

    </div>

    {/* ====================================================== */}
    {/* DEPOSIT TABLE STARTS HERE (PART 5/6) */}
    {/* ====================================================== */}

    <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">

      <h2 className="text-2xl font-black text-yellow-400 mb-6">
        Pkr Deposit Requests
      </h2>      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <RefreshCw className="animate-spin mx-auto mb-3" size={28} />
          Loading Deposit Requests...
        </div>
      ) : filteredDeposits.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No Deposit Requests Found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-sm">
            <thead className="border-b border-zinc-700 text-yellow-400">
              <tr className="text-left">
                <th className="py-3 px-2">User</th>
                <th className="py-3 px-2">Amount</th>
                <th className="py-3 px-2">Method</th>
                <th className="py-3 px-2">Account</th>
                <th className="py-3 px-2">Receipt</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Admin Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredDeposits.map((deposit) => (
                <tr
                  key={deposit._id}
                  className="border-b border-zinc-800 hover:bg-zinc-800/40 transition"
                >
                  {/* USER */}
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <User size={20} className="text-yellow-400" />

                      <div>
                        <p className="font-bold text-yellow-300">
                          {deposit.username}
                        </p>

                        {deposit.fullName && (
                          <p className="text-xs text-gray-400">
                            {deposit.fullName}
                          </p>
                        )}

                        {deposit.email && (
                          <p className="text-xs text-gray-500">
                            {deposit.email}
                          </p>
                        )}

                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(deposit.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* AMOUNT */}
                  <td className="py-4 px-2">
                    <div className="font-bold text-green-400 text-lg">
                      Pkr {Number(deposit.amount).toLocaleString()}
                    </div>

                    <div className="text-xs text-gray-500">
                      {deposit.currency || "Pkr"}
                    </div>
                  </td>

                  {/* PAYMENT METHOD */}
                  <td className="py-4 px-2">
                    <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-xs font-semibold">
                      {deposit.paymentMethod || "Bank Transfer"}
                    </span>
                  </td>

                  {/* ACCOUNT NUMBER */}
                  <td className="py-4 px-2">
                    <div className="text-yellow-300 break-all max-w-[180px]">
                      {deposit.accountNumber || "-"}
                    </div>

                    {deposit.transactionId && (
                      <div className="text-xs text-gray-500 mt-2 break-all">
                        TX: {deposit.transactionId}
                      </div>
                    )}
                  </td>

                  {/* RECEIPT IMAGE */}
                  <td className="py-4 px-2">
                    {deposit.receiptImage ? (
                      <a
                        href={`${API}/uploads/deposits/${deposit.receiptImage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline hover:text-cyan-300"
                      >
                        View Receipt
                      </a>
                    ) : (
                      <span className="text-gray-500">No Receipt</span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="py-4 px-2">
                    {deposit.status === "Pending" && (
                      <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                        Pending
                      </span>
                    )}

                    {deposit.status === "Approved" && (
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                        Approved
                      </span>
                    )}

                    {deposit.status === "Rejected" && (
                      <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                        Rejected
                      </span>
                    )}
                  </td>

                  {/* ADMIN ACTION */}
                  <td className="py-4 px-2">
                    {deposit.status === "Pending" ? (
                      <div className="flex flex-col gap-3 w-60">
                        {/* Admin Note */}
                        <textarea
                          rows={2}
                          value={adminNotes[deposit._id] ?? ""}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({
                              ...prev,
                              [deposit._id]: e.target.value,
                            }))
                          }
                          placeholder="Admin note..."
                          className="bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white resize-none outline-none focus:border-yellow-500"
                        />

                        {/* Buttons */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(deposit)}
                            className="flex-1 bg-green-600 hover:bg-green-500 rounded-lg py-2 font-bold transition"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReject(deposit)}
                            className="flex-1 bg-red-600 hover:bg-red-500 rounded-lg py-2 font-bold transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : deposit.status === "Approved" ? (
                      <div className="text-green-400 text-xs font-semibold">
                        ✅ Deposit Approved

                        {deposit.approvedAt && (
                          <div className="text-gray-500 mt-1">
                            {new Date(deposit.approvedAt).toLocaleString()}
                          </div>
                        )}

                        {deposit.adminNote && (
                          <div className="text-gray-400 mt-2">
                            {deposit.adminNote}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-red-400 text-xs font-semibold">
                        ❌ Deposit Rejected

                        {deposit.adminNote && (
                          <div className="text-gray-400 mt-2">
                            {deposit.adminNote}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}      {/* ====================================================== */}
      {/* EMPTY STATE */}
      {/* ====================================================== */}

      {!loading && filteredDeposits.length === 0 && (
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-12 text-center mt-8">
          <wallet size={60} className="mx-auto text-yellow-400 mb-5" />

          <h2 className="text-3xl font-black text-yellow-400 mb-3">
            No Deposit Requests Found
          </h2>

          <p className="text-gray-500">
            There are currently no pending, approved or rejected deposit requests.
          </p>
        </div>
      )}

      {/* ====================================================== */}
      {/* FOOTER SUMMARY */}
      {/* ====================================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mt-8">

        <div className="grid md:grid-cols-4 gap-5">

          {/* Total Requests */}

          <div className="bg-black rounded-2xl p-4 border border-cyan-600 text-center">
            <p className="text-gray-400 text-sm">Total Requests</p>

            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              {deposits.length}
            </h3>
          </div>

          {/* Pending */}

          <div className="bg-black rounded-2xl p-4 border border-yellow-600 text-center">
            <p className="text-gray-400 text-sm">Pending Pkr</p>

            <h3 className="text-3xl font-bold text-yellow-400 mt-2">
              Pkr {pendingAmount.toLocaleString()}
            </h3>
          </div>

          {/* Approved */}

          <div className="bg-black rounded-2xl p-4 border border-green-600 text-center">
            <p className="text-gray-400 text-sm">Approved Pkr</p>

            <h3 className="text-3xl font-bold text-green-400 mt-2">
              Pkr {approvedAmount.toLocaleString()}
            </h3>
          </div>

          {/* Rejected */}

          <div className="bg-black rounded-2xl p-4 border border-red-600 text-center">
            <p className="text-gray-400 text-sm">Rejected Requests</p>

            <h3 className="text-3xl font-bold text-red-400 mt-2">
              {rejectedCount}
            </h3>
          </div>

        </div>

        {/* ====================================================== */}
        {/* SYSTEM STATUS */}
        {/* ====================================================== */}

        <div className="border-t border-zinc-700 mt-6 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">

          <div className="text-sm text-gray-400">
            GoldTrade V18 • Admin Deposit Management System
          </div>

          <div className="flex items-center gap-2 text-green-400 font-semibold">
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />

            Live wallet Synchronization Enabled
          </div>

        </div>

      </div>

    </div>

  </div>
  );
}