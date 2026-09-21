"use client";

import { useEffect, useState } from "react";
import {
  Wallet,
  RefreshCw,
  Search,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

// ==========================================
// GoldTrade API V18
// ==========================================
const API =
  process.env.NEXT_PUBLIC_API_URL || "https://goldtrade-api.onrender.com";

// ==========================================
// TYPES
// ==========================================
interface WithdrawRequest {
  amount: number;
  userId: any;
  _id: string;
  username: string;
  requestAmount: number;
  adminAmount?: number;
  currency: string;
  paymentMethod: string;
  accountTitle: string;
  accountNumber: string;
  bankName: string;
  network?: string;
  note?: string;
  adminNote?: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

// ==========================================
// PAGE
// ==========================================
export default function AdminWithdrawPage() {
  // ================= AUTH =================
  const [token, setToken] = useState("");

  // ================= DATA =================
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
  const [filteredWithdraws, setFilteredWithdraws] = useState<
    WithdrawRequest[]
  >([]);

  // ================= UI =================
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  // ================= ADMIN INPUTS =================
  const [adminAmounts, setAdminAmounts] = useState<
    Record<string, string>
  >({});

  const [adminNotes, setAdminNotes] = useState<
    Record<string, string>
  >({});

  // ================= DASHBOARD TOTALS =================
  const [pendingTotal, setPendingTotal] = useState(0);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [rejectedTotal, setRejectedTotal] = useState(0);

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
  const jwt = localStorage.getItem("token");

  if (!jwt) {
    window.location.href = "/login";
    return;
  }

  setToken(jwt);
}, []);

  // ==========================================
// LOAD WITHDRAW REQUESTS (FINAL V18 FIX)
// ==========================================
const loadWithdraws = async () => {
  if (!token) return;

  try {
    setLoading(true);
    setMessage("");

    const response = await fetch(
      `${API}/api/admin/withdraws/all`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const result = await response.json();

    console.log("ADMIN WITHDRAW RESPONSE:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load withdraw requests.");
    }

    // API returns withdrawals array
    const list: WithdrawRequest[] = result.withdrawals || result.data || [];

    setWithdraws(list);
    setFilteredWithdraws(list);

    const pending = list.filter((i) => i.status === "Pending");
const approved = list.filter((i) => i.status === "Approved");
const rejected = list.filter((i) => i.status === "Rejected");

setPendingTotal(
  pending.reduce(
    (sum, i) => sum + Number(i.requestAmount ?? i.amount ?? 0),
    0
  )
);

setApprovedTotal(
  approved.reduce(
    (sum, i) =>
      sum +
      Number(i.adminAmount ?? i.requestAmount ?? i.amount ?? 0),
    0
  )
);

setRejectedTotal(rejected.length);

    // Default values for inputs
    const amounts: Record<string, string> = {};
    const notes: Record<string, string> = {};

    list.forEach((item) => {
      amounts[item._id] = String(item.requestAmount || 0);
      notes[item._id] = item.adminNote || "";
    });

    setAdminAmounts(amounts);
    setAdminNotes(notes);
  } catch (err) {
    console.error("LOAD WITHDRAWS ERROR:", err);

    setMessageType("error");
    setMessage(
      err instanceof Error ? err.message : "Failed to load withdraw requests."
    );
  } finally {
    setLoading(false);
  }
};

  // ==========================================
  // INITIAL LOAD
  // ==========================================
  useEffect(() => {
    if (token) {
      loadWithdraws();
    }
  }, [token]);
    // ==========================================
  // APPROVE WITHDRAW REQUEST
  // ==========================================
  const handleApprove = async (item: WithdrawRequest) => {
    try {
      const amount = Number(
        adminAmounts[item._id] ?? item.requestAmount
      );

      if (!amount || amount <= 0) {
        setMessageType("error");
        setMessage("Please enter a valid deduction amount.");
        return;
      }

      const response = await fetch(
        `${API}/api/withdraws/admin/${item._id}/approve`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            adminAmount: amount,
            adminNote: adminNotes[item._id] || "",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Approval failed.");
      }

      setMessageType("success");
      setMessage("Withdraw approved successfully.");

      loadWithdraws();
    } catch (err: any) {
      console.error("APPROVE ERROR:", err);

      setMessageType("error");
      setMessage(err.message || "Unable to approve withdraw.");
    }
  };

  // ==========================================
  // REJECT WITHDRAW REQUEST
  // ==========================================
  const handleReject = async (item: WithdrawRequest) => {
    try {
      const response = await fetch(
        `${API}/api/withdraws/admin/${item._id}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            adminNote:
              adminNotes[item._id] || "Rejected by admin.",
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Reject failed.");
      }

      setMessageType("success");
      setMessage("Withdraw rejected successfully.");

      loadWithdraws();
    } catch (err: any) {
      console.error("REJECT ERROR:", err);

      setMessageType("error");
      setMessage(err.message || "Unable to reject withdraw.");
    }
  };

  // ==========================================
// SEARCH USERNAME FILTER (FINAL FIX)
// ==========================================
useEffect(() => {
  if (!search.trim()) {
    setFilteredWithdraws(withdraws);
    return;
  }

  const keyword = search.trim().toLowerCase();

  const filtered = withdraws.filter((item) =>
    (item.username || "").toLowerCase().includes(keyword)
  );

  setFilteredWithdraws(filtered);
}, [search, withdraws]);
  // ==========================================
  // REFRESH BUTTON
  // ==========================================
  const refreshData = () => {
    setMessage("");
    loadWithdraws();
  };
    // ==========================================
// PAGE UI START (PART 1/2)
// ==========================================
return (
  <div className="min-h-screen bg-black text-white p-6">

    {/* ================= HEADER ================= */}
    <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
      <div>
        <h1 className="text-4xl font-black text-yellow-400">
          Admin Withdraw Panel
        </h1>

        <p className="text-gray-400 mt-2">
          GoldTrade V18 鈥?Manual Wallet Deduction System
        </p>
      </div>

      <button
        onClick={refreshData}
        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2"
      >
        <RefreshCw size={18} />
        Refresh
      </button>
    </div>

    {/* ================= MESSAGE ================= */}
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

    {/* ================= DASHBOARD CARDS ================= */}
    <div className="grid lg:grid-cols-3 gap-5 mb-10">

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
        <div className="flex justify-between items-center">
          <Clock size={34} className="text-yellow-400" />
          <span className="text-yellow-400 font-semibold">
            Pending Withdraw
          </span>
        </div>

        <h2 className="text-4xl font-black text-yellow-400 mt-5">
          Pkr {Number(pendingTotal || 0).toLocaleString()}
        </h2>
      </div>

      <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
        <div className="flex justify-between items-center">
          <CheckCircle size={34} className="text-green-400" />
          <span className="text-green-400 font-semibold">
            Approved Amount
          </span>
        </div>

        <h2 className="text-4xl font-black text-green-400 mt-5">
          Pkr {Number(approvedTotal || 0).toLocaleString()}
        </h2>
      </div>

      <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
        <div className="flex justify-between items-center">
          <XCircle size={34} className="text-red-400" />
          <span className="text-red-400 font-semibold">
            Rejected Requests
          </span>
        </div>

        <h2 className="text-4xl font-black text-red-400 mt-5">
          {rejectedTotal || 0}
        </h2>
      </div>

    </div>

    {/* ================= SEARCH ================= */}
    <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-4 mb-8">
      <div className="flex items-center gap-3">
        <Search size={20} className="text-cyan-400" />

        <input
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none w-full text-white placeholder:text-gray-500"
        />
      </div>
    </div>

    {/* ================= TABLE ================= */}
<div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-5">

  <h2 className="text-2xl font-black text-cyan-400 mb-6">
    Withdraw Requests
  </h2>

  {loading ? (
    <div className="text-center py-10 text-gray-400">
      Loading Withdraw Requests...
    </div>
  ) : filteredWithdraws.length === 0 ? (
    <div className="text-center py-10 text-gray-500">
      No withdraw requests found.
    </div>
  ) : (
    <div className="overflow-x-auto">

      <table className="w-full min-w-[1200px] text-sm">

        <thead className="border-b border-zinc-700 text-yellow-400">
          <tr className="text-left">
            <th className="py-3 px-2">Username</th>
            <th className="py-3 px-2">Request</th>
            <th className="py-3 px-2">Payment</th>
            <th className="py-3 px-2">Account</th>
            <th className="py-3 px-2">Status</th>
            <th className="py-3 px-2">Action</th>
          </tr>
        </thead>

        <tbody>

          {filteredWithdraws.map((item) => (

            <tr
              key={item._id}
              className="border-b border-zinc-800 hover:bg-zinc-800/40"
            >

              {/* USER */}
              <td className="py-4 px-2">
                <div className="font-bold text-cyan-400">
                  {item.username || item.userId?.username || "Unknown User"}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : "-"}
                </div>
              </td>

              {/* REQUEST */}
              <td className="py-4 px-2">
                <div className="font-bold text-green-400 text-lg">
                  {item.currency || "Pkr"}{" "}
                  {Number(item.requestAmount || 0).toLocaleString()}
                </div>

                {item.note && (
                  <div className="text-xs text-gray-500 mt-2">
                    {item.note}
                  </div>
                )}
              </td>

              {/* PAYMENT */}
              <td className="py-4 px-2">
                <div className="font-semibold">
                  {item.paymentMethod || "-"}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  {item.bankName || item.network || "-"}
                </div>
              </td>

              {/* ACCOUNT */}
              <td className="py-4 px-2">
                <div>{item.accountTitle || "-"}</div>

                <div className="text-yellow-400 text-xs mt-1">
                  {item.accountNumber || "-"}
                </div>
              </td>

              {/* STATUS */}
              <td className="py-4 px-2">

                {item.status === "Pending" && (
                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">
                    Pending
                  </span>
                )}

                {item.status === "Approved" && (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                    Approved
                  </span>
                )}

                {item.status === "Rejected" && (
                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-semibold">
                    Rejected
                  </span>
                )}

              </td>

                           <td className="py-4 px-2">

                {item.status === "Pending" ? (

                  <div className="flex flex-col gap-3">

                    {/* Amount Input */}
                    <input
                      type="number"
                      value={adminAmounts[item._id] ?? String(item.requestAmount)}
                      onChange={(e) =>
                        setAdminAmounts((prev) => ({
                          ...prev,
                          [item._id]: e.target.value,
                        }))
                      }
                      placeholder={String(item.requestAmount)}
                      className="w-32 bg-black border border-yellow-500 rounded-lg px-3 py-2 text-white outline-none focus:border-yellow-400"
                    />

                    {/* Admin Note */}
                    <textarea
                      rows={2}
                      value={adminNotes[item._id] ?? ""}
                      onChange={(e) =>
                        setAdminNotes((prev) => ({
                          ...prev,
                          [item._id]: e.target.value,
                        }))
                      }
                      placeholder="Admin note..."
                      className="w-48 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white outline-none resize-none focus:border-cyan-500"
                    />

                    {/* Buttons */}
                    <div className="flex gap-2 flex-wrap">

                      <button
                        type="button"
                        onClick={() => handleApprove(item)}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white font-bold"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => handleReject(item)}
                        className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg text-white font-bold"
                      >
                        Reject
                      </button>

                    </div>

                  </div>

                ) : item.status === "Approved" ? (

                  <div className="text-green-400 text-sm font-semibold">
                    ✅ Deducted: {item.currency || "Pkr"}{" "}
                    {Number(
                      item.adminAmount || item.requestAmount || 0
                    ).toLocaleString()}
                  </div>

                ) : (

                  <div className="text-red-400 text-sm font-semibold">
                    ❌ {item.adminNote || "Withdraw Rejected"}
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

</div>
);
}