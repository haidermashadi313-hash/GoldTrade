"use client";

// =====================================================
// GoldTrade V18 Enterprise
// Admin Withdraw Manager (PART 1/5)
// Production Version
// =====================================================

import { useEffect, useMemo, useState } from "react";

import {
  Wallet,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Coins,
  User,
  Calendar,
  FileText,
  Trash2,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

interface WithdrawRequest {
  _id: string;

  userId: string;

  username: string;

  email?: string;

  walletType: "PKR" | "GOLD" | "USDT";

  amount: number;

  requestAmount?: number;

  adminAmount?: number;

  walletAddress?: string;

  transactionId?: string;

  screenshot?: string;

  status: "Pending" | "Approved" | "Rejected";

  adminNote?: string;

  createdAt: string;

  approvedAt?: string;

  rejectedAt?: string;
}

interface WithdrawStatistics {
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalRequests: number;

  pendingAmount: number;
  approvedAmount: number;
  rejectedAmount: number;

  totalPKR: number;
  totalGold: number;
  totalUSDT: number;
}

// =====================================================
// DEFAULT STATISTICS
// =====================================================

const defaultStatistics: WithdrawStatistics = {
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
  totalRequests: 0,

  pendingAmount: 0,
  approvedAmount: 0,
  rejectedAmount: 0,

  totalPKR: 0,
  totalGold: 0,
  totalUSDT: 0,
};

// =====================================================
// COMPONENT START
// =====================================================

export default function AdminWithdrawPage() {

  // =====================================================
  // STATES
  // =====================================================

  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);

  const [statistics, setStatistics] =
    useState<WithdrawStatistics>(defaultStatistics);

  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [selectedWithdraw, setSelectedWithdraw] =
    useState<WithdrawRequest | null>(null);

  const [adminNote, setAdminNote] = useState("");

  const [adminAmount, setAdminAmount] = useState("");

  // =====================================================
  // AUTH HEADERS
  // =====================================================

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // =====================================================
  // FORMAT HELPERS
  // =====================================================

  const formatMoney = (value: number) =>
    Number(value || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  const getWalletColor = (wallet?: string) => {
     const walletType = String(wallet || "PKR").toUpperCase();
     switch (walletType) {
      case "PKR":
        return "text-green-400";

      case "GOLD":
        return "text-yellow-400";

      case "USDT":
        return "text-cyan-400";

      default:
        return "text-white";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-600/20 text-green-400 border border-green-500/30";

      case "Rejected":
        return "bg-red-600/20 text-red-400 border border-red-500/30";

      default:
        return "bg-yellow-600/20 text-yellow-400 border border-yellow-500/30";
    }
  };
    // =====================================================
  // LOAD WITHDRAW STATISTICS
  // =====================================================

  const loadStatistics = async () => {
    try {
      const response = await fetch(
        `${API}/api/admin/withdraws/statistics`,
        {
          headers: getHeaders(),
          cache: "no-store",
        }
      );

      const result = await response.json();

      console.log("WITHDRAW STATS:", result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load withdraw statistics."
        );
      }

      setStatistics(result.statistics);

    } catch (error: any) {
      console.error("LOAD WITHDRAW STATS ERROR:", error);

      setMessage(error.message);
      setMessageType("error");
    }
  };

  // =====================================================
  // LOAD ALL WITHDRAW REQUESTS
  // =====================================================

  const loadWithdraws = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/withdraws/all`,
        {
          headers: getHeaders(),
          cache: "no-store",
        }
      );

      const result = await response.json();

      console.log("WITHDRAW RESPONSE:", result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load withdraw requests."
        );
      }

      setWithdraws(result.withdrawals || []);

    } catch (error: any) {
      console.error("LOAD WITHDRAWS ERROR:", error);

      setWithdraws([]);
      setMessage(error.message);
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REFRESH PAGE
  // =====================================================

  const refreshPage = async () => {
    await Promise.all([
      loadStatistics(),
      loadWithdraws(),
    ]);
  };

  // =====================================================
  // OPEN / CLOSE DETAILS MODAL
  // =====================================================

  const openWithdrawDetails = (withdraw: WithdrawRequest) => {
    setSelectedWithdraw(withdraw);

    setAdminNote(withdraw.adminNote || "");

    setAdminAmount(
      String(
        withdraw.adminAmount ??
          withdraw.requestAmount ??
          withdraw.amount
      )
    );
  };

  const closeWithdrawDetails = () => {
    setSelectedWithdraw(null);
    setAdminNote("");
    setAdminAmount("");
  };

  // =====================================================
  // APPROVE WITHDRAW
  // =====================================================

  const approveWithdraw = async () => {
    if (!selectedWithdraw) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/withdraws/${selectedWithdraw._id}/approve`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            adminAmount: Number(adminAmount),
            adminNote,
          }),
        }
      );

      const result = await response.json();

      console.log("APPROVE RESPONSE:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message);
      }

      setMessage(result.message);
      setMessageType("success");

      closeWithdrawDetails();

      await refreshPage();

    } catch (error: any) {
      console.error("APPROVE WITHDRAW ERROR:", error);

      setMessage(error.message);
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REJECT WITHDRAW
  // =====================================================

  const rejectWithdraw = async () => {
    if (!selectedWithdraw) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/withdraws/${selectedWithdraw._id}/reject`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            adminNote,
          }),
        }
      );

      const result = await response.json();

      console.log("REJECT RESPONSE:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message);
      }

      setMessage(result.message);
      setMessageType("success");

      closeWithdrawDetails();

      await refreshPage();

    } catch (error: any) {
      console.error("REJECT WITHDRAW ERROR:", error);

      setMessage(error.message);
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE WITHDRAW REQUEST
  // =====================================================

  const deleteWithdraw = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this withdraw request?"
    );

    if (!confirmed) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/withdraws/${id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      const result = await response.json();

      console.log("DELETE RESPONSE:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.message);
      }

      setMessage(result.message);
      setMessageType("success");

      await refreshPage();

    } catch (error: any) {
      console.error("DELETE WITHDRAW ERROR:", error);

      setMessage(error.message);
      setMessageType("error");

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SEARCH FILTER
  // =====================================================

  const filteredWithdraws = useMemo(() => {
    return withdraws.filter((withdraw) => {
      const keyword = search.toLowerCase();

      return (
        withdraw.username?.toLowerCase().includes(keyword) ||
        withdraw.email?.toLowerCase().includes(keyword) ||
        withdraw.walletType?.toLowerCase().includes(keyword)
      );
    });
  }, [withdraws, search]);

  // =====================================================
  // PAGE LOAD
  // =====================================================

  useEffect(() => {
    refreshPage();
  }, []);
    // =====================================================
  // PAGE UI START
  // =====================================================

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6">

      {/* ========================================== */}
      {/* PAGE HEADER */}
      {/* ========================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

        <div>
          <h1 className="text-3xl font-bold text-yellow-400">
            GoldTrade V18 • Admin Withdraw Manager
          </h1>

          <p className="text-gray-400 mt-2">
            Manage PKR, GOLD and USDT withdraw requests from users.
          </p>
        </div>

        <button
          onClick={refreshPage}
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-5 py-3 rounded-xl transition"
        >
          <RefreshCw size={18} />
          Refresh Withdraws
        </button>

      </div>

      {/* ========================================== */}
      {/* SUCCESS / ERROR MESSAGE */}
      {/* ========================================== */}

      {message && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 border font-medium ${
            messageType === "success"
              ? "bg-green-600/20 border-green-500 text-green-300"
              : "bg-red-600/20 border-red-500 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* ========================================== */}
      {/* STATISTICS CARDS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* Pending */}

        <div className="rounded-2xl bg-[#111827] border border-yellow-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <Clock className="text-yellow-400" size={28} />

            <span className="text-xs font-semibold text-yellow-400">
              PENDING
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Pending Withdraw Requests
          </p>

          <h2 className="text-3xl font-bold text-yellow-300 mt-2">
            {statistics.pendingRequests}
          </h2>

          <p className="text-yellow-400 mt-2 text-sm">
            PKR {formatMoney(statistics.pendingAmount)}
          </p>

        </div>

        {/* Approved */}

        <div className="rounded-2xl bg-[#111827] border border-green-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <CheckCircle className="text-green-400" size={28} />

            <span className="text-xs font-semibold text-green-400">
              APPROVED
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Approved Withdraw Requests
          </p>

          <h2 className="text-3xl font-bold text-green-400 mt-2">
            {statistics.approvedRequests}
          </h2>

          <p className="text-green-400 mt-2 text-sm">
            PKR {formatMoney(statistics.approvedAmount)}
          </p>

        </div>

        {/* Rejected */}

        <div className="rounded-2xl bg-[#111827] border border-red-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <XCircle className="text-red-400" size={28} />

            <span className="text-xs font-semibold text-red-400">
              REJECTED
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Rejected Withdraw Requests
          </p>

          <h2 className="text-3xl font-bold text-red-400 mt-2">
            {statistics.rejectedRequests}
          </h2>

          <p className="text-red-400 mt-2 text-sm">
            PKR {formatMoney(statistics.rejectedAmount)}
          </p>

        </div>

        {/* Total */}

        <div className="rounded-2xl bg-[#111827] border border-purple-600/30 p-5">

          <div className="flex justify-between items-center mb-3">
            <Wallet className="text-purple-400" size={28} />

            <span className="text-xs font-semibold text-purple-400">
              TOTAL
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Total Withdraw Requests
          </p>

          <h2 className="text-3xl font-bold text-purple-400 mt-2">
            {statistics.totalRequests}
          </h2>

          <p className="text-purple-300 mt-2 text-sm">
            All Wallet Requests
          </p>

        </div>

      </div>

      {/* ========================================== */}
      {/* WALLET SUMMARY CARDS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        {/* PKR */}

        <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <DollarSign className="text-green-400" size={24} />

            <span className="text-green-400 text-xs font-semibold">
              PKR
            </span>
          </div>

          <h3 className="text-2xl font-bold text-green-400">
            PKR {formatMoney(statistics.totalPKR)}
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Total PKR Withdraw Amount
          </p>

        </div>

        {/* GOLD */}

        <div className="rounded-2xl bg-[#111827] border border-yellow-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <Coins className="text-yellow-400" size={24} />

            <span className="text-yellow-400 text-xs font-semibold">
              GOLD
            </span>
          </div>

          <h3 className="text-2xl font-bold text-yellow-400">
            {statistics.totalGold.toFixed(3)} Gold
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Total Gold Withdraw Amount
          </p>

        </div>

        {/* USDT */}

        <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-5">

          <div className="flex justify-between items-center mb-2">
            <Wallet className="text-cyan-400" size={24} />

            <span className="text-cyan-400 text-xs font-semibold">
              USDT
            </span>
          </div>

          <h3 className="text-2xl font-bold text-cyan-400">
            {statistics.totalUSDT.toFixed(2)} USDT
          </h3>

          <p className="text-gray-400 text-sm mt-2">
            Total USDT Withdraw Amount
          </p>

        </div>

      </div>

      {/* ========================================== */}
      {/* SEARCH BAR */}
      {/* ========================================== */}

      <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">

        <div className="relative">

          <Search
            size={20}
            className="absolute left-4 top-3.5 text-gray-500"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username..."
            className="w-full bg-[#1F2937] border border-gray-600 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-yellow-500 transition"
          />

        </div>

      </div>

      {/* ========================================== */}
      {/* WITHDRAW REQUEST TABLE STARTS */}
      {/* ========================================== */}

      <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden">

        <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">

          <h2 className="text-xl font-bold text-cyan-400">
            Withdraw Requests ({filteredWithdraws.length})
          </h2>

          <Wallet className="text-cyan-400" />

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px]">

            <thead className="bg-[#1F2937] text-gray-300 text-sm">

              <tr>
                <th className="text-left px-5 py-4">User</th>
                <th className="text-center">Wallet</th>
                <th className="text-center">Amount</th>
                <th className="text-center">Wallet Address</th>
                <th className="text-center">Status</th>
                <th className="text-center">Date</th>
                <th className="text-center">Actions</th>
              </tr>

            </thead>

            <tbody>
                            {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-gray-400"
                  >
                    Loading withdraw requests...
                  </td>
                </tr>
              ) : filteredWithdraws.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-red-300"
                  >
                    No withdraw requests found.
                  </td>
                </tr>
              ) : (
                filteredWithdraws.map((withdraw) => (
                  <tr
                    key={withdraw._id}
                    className="border-b border-gray-800 hover:bg-[#1B2435] transition"
                  >
                    {/* USER */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 font-semibold text-white">
                        <User size={16} className="text-cyan-400" />
                        {withdraw.username}
                      </div>

                      <p className="text-sm text-gray-400 mt-1">
                        {withdraw.email || "No Email"}
                      </p>
                    </td>

                    {/* WALLET TYPE */}

                    <td className="text-center">
                      <span
                        className={`font-bold ${getWalletColor(
                          withdraw.walletType
                        )}`}
                      >
                        {withdraw.walletType}
                      </span>
                    </td>

                    {/* AMOUNT */}

                    <td className="text-center font-semibold">
                      {withdraw.walletType === "PKR" && (
                        <span className="text-green-400">
                          PKR{" "}
                          {formatMoney(
                            Number(withdraw.adminAmount ?? withdraw.amount)
                          )}
                        </span>
                      )}

                      {withdraw.walletType === "GOLD" && (
                        <span className="text-yellow-400">
                          {Number(
                            withdraw.adminAmount ?? withdraw.amount
                          ).toFixed(3)}{" "}
                          Gold
                        </span>
                      )}

                      {withdraw.walletType === "USDT" && (
                        <span className="text-cyan-400">
                          {Number(
                            withdraw.adminAmount ?? withdraw.amount
                          ).toFixed(2)}{" "}
                          USDT
                        </span>
                      )}
                    </td>

                    {/* WALLET ADDRESS */}

                    <td className="text-center text-gray-300">
                      {withdraw.walletAddress ? (
                        <span className="text-xs bg-gray-700 px-3 py-1 rounded-lg break-all">
                          {withdraw.walletAddress}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">
                          Not Provided
                        </span>
                      )}
                    </td>

                    {/* STATUS */}

                    <td className="text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          withdraw.status
                        )}`}
                      >
                        {withdraw.status}
                      </span>
                    </td>

                    {/* DATE */}

                    <td className="text-center text-gray-300 text-sm">
                      <div className="flex flex-col items-center gap-1">
                        <Calendar size={14} className="text-gray-500" />
                        {formatDate(withdraw.createdAt)}
                      </div>
                    </td>

                    {/* ACTIONS */}

                    <td className="px-4 py-4">
                      <div className="flex flex-wrap justify-center gap-2">
                        <button
                          onClick={() => openWithdrawDetails(withdraw)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition"
                        >
                          Details
                        </button>

                        {withdraw.status === "Pending" && (
                          <button
                            onClick={() => openWithdrawDetails(withdraw)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                        )}
                                                {/* REJECT */}

                        {withdraw.status === "Pending" && (
                          <button
                            onClick={() => openWithdrawDetails(withdraw)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        )}

                        {/* DELETE */}

                        {withdraw.status !== "Approved" && (
                          <button
                            onClick={() => deleteWithdraw(withdraw._id)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              )}
                          </tbody>

          </table>

        </div>

      </div>

      {/* ========================================== */}
      {/* WITHDRAW DETAILS MODAL */}
      {/* ========================================== */}

      {selectedWithdraw && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-2xl rounded-3xl bg-[#111827] border border-cyan-500/30 shadow-2xl overflow-hidden">

            {/* Header */}

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">

              <div>
                <h2 className="text-2xl font-bold text-cyan-400">
                  Withdraw Details
                </h2>

                <p className="text-sm text-gray-400 mt-1">
                  Review user withdraw request before approval.
                </p>
              </div>

              <button
                onClick={closeWithdrawDetails}
                className="text-gray-400 hover:text-red-400 transition"
              >
                <XCircle size={28} />
              </button>

            </div>

            {/* Modal Body */}

            <div className="p-6 space-y-5">

              {/* User Information */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-[#1F2937] rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2">Username</p>

                  <h3 className="text-white font-semibold">
                    {selectedWithdraw.username}
                  </h3>

                  <p className="text-sm text-gray-400 mt-1">
                    {selectedWithdraw.email || "No Email"}
                  </p>
                </div>

                <div className="bg-[#1F2937] rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2">Wallet Type</p>

                  <span
                    className={`text-lg font-bold ${getWalletColor(
                      selectedWithdraw.walletType
                    )}`}
                  >
                    {selectedWithdraw.walletType}
                  </span>
                </div>

              </div>

              {/* Request Amount */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="bg-[#1F2937] rounded-xl p-4">

                  <p className="text-xs text-gray-400 mb-2">
                    Requested Amount
                  </p>

                  <h3 className="text-2xl font-bold text-cyan-400">

                    {selectedWithdraw.walletType === "PKR" &&
                      `PKR ${formatMoney(Number(selectedWithdraw.amount))}`}

                    {selectedWithdraw.walletType === "GOLD" &&
                      `${Number(selectedWithdraw.amount).toFixed(3)} Gold`}

                    {selectedWithdraw.walletType === "USDT" &&
                      `${Number(selectedWithdraw.amount).toFixed(2)} USDT`}

                  </h3>

                </div>

                <div className="bg-[#1F2937] rounded-xl p-4">

                  <p className="text-xs text-gray-400 mb-2">
                    Request Date
                  </p>

                  <h3 className="text-white font-semibold">
                    {formatDate(selectedWithdraw.createdAt)}
                  </h3>

                </div>

              </div>

              {/* Wallet Address */}

              <div className="bg-[#1F2937] rounded-xl p-4">

                <p className="text-xs text-gray-400 mb-2">
                  Wallet Address
                </p>

                <div className="flex items-center justify-between gap-3">

                  <span className="text-cyan-300 break-all text-sm">
                    {selectedWithdraw.walletAddress || "Not Provided"}
                  </span>

                  {selectedWithdraw.walletAddress && (
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedWithdraw.walletAddress ?? ""
                        )
                      }
                      className="bg-cyan-500 hover:bg-cyan-600 text-black px-3 py-2 rounded-lg text-xs font-semibold"
                    >
                      Copy
                    </button>
                  )}

                </div>

              </div>

              {/* Transaction ID */}

              <div className="bg-[#1F2937] rounded-xl p-4">

                <p className="text-xs text-gray-400 mb-2">
                  Transaction ID
                </p>

                <span className="text-yellow-300 break-all text-sm">
                  {selectedWithdraw.transactionId || "Not Provided"}
                </span>

              </div>

              {/* Status */}

              <div className="bg-[#1F2937] rounded-xl p-4 flex items-center justify-between">

                <div>

                  <p className="text-xs text-gray-400 mb-2">
                    Current Status
                  </p>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      selectedWithdraw.status
                    )}`}
                  >
                    {selectedWithdraw.status}
                  </span>

                </div>

                <FileText className="text-cyan-400" size={28} />

              </div>

              {/* Screenshot */}

              <div>

                <p className="text-sm text-gray-400 mb-3">
                  Payment Screenshot
                </p>

                {selectedWithdraw.screenshot ? (
                  <img
                    src={selectedWithdraw.screenshot}
                    alt="Withdraw Screenshot"
                    className="w-full rounded-2xl border border-gray-700 object-contain max-h-80"
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-600 p-8 text-center text-gray-500">
                    No screenshot uploaded.
                  </div>
                )}

              </div>

              {/* Admin Amount */}

              <div>

                <label className="block text-sm text-gray-400 mb-2">
                  Admin Approved Amount
                </label>

                <input
                  type="number"
                  value={adminAmount}
                  onChange={(e) => setAdminAmount(e.target.value)}
                  className="w-full rounded-xl bg-[#1F2937] border border-gray-600 p-4 outline-none focus:border-cyan-500 transition"
                />

              </div>

              {/* Admin Note */}

              <div>

                <label className="block text-sm text-gray-400 mb-2">
                  Admin Note
                </label>

                <textarea
                  rows={4}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Write approval or rejection note..."
                  className="w-full rounded-xl bg-[#1F2937] border border-gray-600 p-4 outline-none resize-none focus:border-cyan-500 transition"
                />

              </div>            </div>

            {/* ========================================== */}
            {/* MODAL FOOTER BUTTONS */}
            {/* ========================================== */}

            <div className="border-t border-gray-700 px-6 py-5 flex flex-wrap justify-end gap-3">

              {/* CLOSE */}

              <button
                onClick={closeWithdrawDetails}
                className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-3 rounded-xl font-semibold transition"
              >
                Close
              </button>

              {/* REJECT */}

              {selectedWithdraw.status === "Pending" && (
                <button
                  disabled={loading}
                  onClick={rejectWithdraw}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
                >
                  <XCircle size={18} />
                  Reject Withdraw
                </button>
              )}

              {/* APPROVE */}

              {selectedWithdraw.status === "Pending" && (
                <button
                  disabled={loading}
                  onClick={approveWithdraw}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
                >
                  <CheckCircle size={18} />
                  Approve Withdraw
                </button>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* LOADING OVERLAY */}
      {/* ========================================== */}

      {loading && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">

          <div className="bg-[#111827] border border-cyan-500/30 rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-2xl">

            <RefreshCw
              size={36}
              className="text-cyan-400 animate-spin"
            />

            <div className="text-center">

              <h3 className="text-lg font-bold text-cyan-400">
                GoldTrade V18 Enterprise
              </h3>

              <p className="text-sm text-gray-300 mt-1">
                Processing withdraw request...
              </p>

            </div>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* FOOTER */}
      {/* ========================================== */}

      <footer className="mt-10 border-t border-gray-800 pt-6">

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          <div>

            <h3 className="text-cyan-400 font-bold text-lg">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-sm text-gray-500">
              Admin Withdraw Management Panel
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-gray-400">

            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              Wallet Integration Active
            </div>

            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-cyan-400" />
              PKR • GOLD • USDT
            </div>

            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="text-yellow-400" />
              Live Refresh Enabled
            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}