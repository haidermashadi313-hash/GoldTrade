"use client";

// =====================================================
// GoldTrade V18 Enterprise
// Admin Deposit Manager
// PART 1/6
// =====================================================

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  DollarSign,
  Coins,
  Wallet,
  User,
  Calendar,
  FileText,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

interface DepositRequest {
  _id: string;

  userId: string;
  username: string;
  email?: string;

  walletType: "PKR" | "GOLD" | "USDT";

  amount: number;

  transactionId?: string;

  status: "Pending" | "Approved" | "Rejected";

  screenshot?: string;

  adminNote?: string;

  approvedBy?: string;
  rejectedBy?: string;

  createdAt: string;
}

interface DepositStatistics {
  totalRequests: number;

  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;

  pendingAmount: number;
  approvedAmount: number;
  rejectedAmount: number;

  totalPKR: number;
  totalGold: number;
  totalUSDT: number;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AdminDepositPage() {
  const router = useRouter();

  // =====================================================
  // TOKEN
  // =====================================================

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("token") || "";
  }, []);

  // =====================================================
  // STATES
  // =====================================================

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [filteredDeposits, setFilteredDeposits] =
    useState<DepositRequest[]>([]);

  const [statistics, setStatistics] =
    useState<DepositStatistics>({
      totalRequests: 0,

      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,

      pendingAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0,

      totalPKR: 0,
      totalGold: 0,
      totalUSDT: 0,
    });

  const [search, setSearch] = useState("");

  const [selectedDeposit, setSelectedDeposit] =
    useState<DepositRequest | null>(null);

  const [adminNote, setAdminNote] = useState("");

  // =====================================================
  // AUTH HEADERS
  // =====================================================

  const getHeaders = () => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  });

  // =====================================================
  // LOAD PENDING DEPOSITS
  // =====================================================

  const loadDeposits = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch(`${API}/api/admin/deposits`, {
        method: "GET",
        headers: getHeaders(),
        cache: "no-store",
      });

      const data = await response.json();

      console.log("DEPOSITS API:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load deposits."
        );
      }

      const list: DepositRequest[] = data.deposits || [];

      setDeposits(list);
      setFilteredDeposits(list);

    } catch (error) {
      console.error("LOAD DEPOSITS ERROR:", error);

      setDeposits([]);
      setFilteredDeposits([]);

      setMessageType("error");
      setMessage("Failed to load deposit requests.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD STATISTICS
  // =====================================================

  const loadStatistics = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API}/api/admin/deposits/statistics`,
        {
          method: "GET",
          headers: getHeaders(),
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("DEPOSIT STATS:", data);

      if (response.ok && data.success) {
        setStatistics(data.statistics);
      }

    } catch (error) {
      console.error("LOAD STATISTICS ERROR:", error);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    loadDeposits();
    loadStatistics();

  }, [token]);

  // =====================================================
  // SEARCH FILTER
  // =====================================================

  useEffect(() => {
    if (!search.trim()) {
      setFilteredDeposits(deposits);
      return;
    }

    const keyword = search.toLowerCase();

    setFilteredDeposits(
      deposits.filter((deposit) =>
        deposit.username
          ?.toLowerCase()
          .includes(keyword)
      )
    );

  }, [search, deposits]);
    // =====================================================
  // REFRESH PAGE
  // =====================================================

  const refreshPage = async () => {
    await Promise.all([
      loadDeposits(),
      loadStatistics(),
    ]);

    setMessageType("success");
    setMessage("Deposit list refreshed successfully.");
  };

  // =====================================================
  // OPEN / CLOSE DETAILS MODAL
  // =====================================================

  const openDepositDetails = (deposit: DepositRequest) => {
    setSelectedDeposit(deposit);
    setAdminNote(deposit.adminNote || "");
  };

  const closeDepositDetails = () => {
    setSelectedDeposit(null);
    setAdminNote("");
  };

  // =====================================================
  // APPROVE DEPOSIT
  // =====================================================

  const approveDeposit = async () => {
    if (!selectedDeposit) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/deposits/${selectedDeposit._id}/approve`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            adminNote,
          }),
        }
      );

      const data = await response.json();

      console.log("APPROVE RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to approve deposit."
        );
      }

      setMessageType("success");
      setMessage("Deposit approved successfully.");

      closeDepositDetails();

      await Promise.all([
        loadDeposits(),
        loadStatistics(),
      ]);

    } catch (error) {
      console.error("APPROVE ERROR:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Deposit approval failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REJECT DEPOSIT
  // =====================================================

  const rejectDeposit = async () => {
    if (!selectedDeposit) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/deposits/${selectedDeposit._id}/reject`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            adminNote,
          }),
        }
      );

      const data = await response.json();

      console.log("REJECT RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to reject deposit."
        );
      }

      setMessageType("success");
      setMessage("Deposit rejected successfully.");

      closeDepositDetails();

      await Promise.all([
        loadDeposits(),
        loadStatistics(),
      ]);

    } catch (error) {
      console.error("REJECT ERROR:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Deposit rejection failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE DEPOSIT
  // =====================================================

  const deleteDeposit = async (depositId: string) => {
    const ok = window.confirm(
      "Delete this deposit request?"
    );

    if (!ok) return;

    try {
      const response = await fetch(
        `${API}/api/admin/deposits/${depositId}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Delete failed."
        );
      }

      setMessageType("success");
      setMessage("Deposit request deleted.");

      await Promise.all([
        loadDeposits(),
        loadStatistics(),
      ]);

    } catch (error) {
      console.error("DELETE ERROR:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete deposit."
      );
    }
  };

  // =====================================================
  // FORMATTERS
  // =====================================================

  const formatMoney = (value: number) =>
    Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

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

  const getWalletColor = (wallet: string) => {
    switch (wallet) {
      case "PKR":
        return "text-green-400";

      case "GOLD":
        return "text-yellow-400";

      case "USDT":
        return "text-cyan-400";

      default:
        return "text-white";
    }
  };// =====================================================
// PAGE UI START (GOLDTRADE V18 ENTERPRISE FINAL)
// =====================================================

return (
  <div className="min-h-screen bg-[#0B1120] text-white p-6">

    {/* ================= HEADER ================= */}

    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

      <div>
        <h1 className="text-3xl font-bold text-yellow-400">
          GoldTrade V18 • Admin Deposit Manager
        </h1>

        <p className="text-gray-400 mt-2">
          Manage PKR, GOLD and USDT deposit requests from users.
        </p>
      </div>

      <button
        onClick={refreshPage}
        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-5 py-3 rounded-xl transition"
      >
        <RefreshCw size={18} />
        Refresh Deposits
      </button>

    </div>

    {/* ================= SUCCESS / ERROR MESSAGE ================= */}

    {message && (
      <div
        className={`mb-6 rounded-xl border px-4 py-3 font-medium ${
          messageType === "success"
            ? "bg-green-600/20 border-green-500 text-green-300"
            : "bg-red-600/20 border-red-500 text-red-300"
        }`}
      >
        {message}
      </div>
    )}

    {/* ================= STATISTICS CARDS ================= */}

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
          Pending Deposit Requests
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
          Approved Deposit Requests
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
          Rejected Deposit Requests
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
          Total Deposit Requests
        </p>

        <h2 className="text-3xl font-bold text-purple-400 mt-2">
          {statistics.totalRequests}
        </h2>

        <p className="text-purple-300 mt-2 text-sm">
          All Wallet Requests
        </p>
      </div>

    </div>

    {/* ================= WALLET SUMMARY ================= */}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

      {/* PKR */}
      <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-5">
        <div className="flex justify-between items-center mb-2">
          <DollarSign className="text-green-400" size={24} />
          <span className="text-green-400 text-xs font-semibold">PKR</span>
        </div>

        <h3 className="text-2xl font-bold text-green-400">
          PKR {formatMoney(statistics.totalPKR)}
        </h3>

        <p className="text-gray-400 text-sm mt-2">
          Total PKR Deposit Amount
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
          Total Gold Deposit Amount
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
          Total USDT Deposit Amount
        </p>
      </div>

    </div>

    {/* ================= SEARCH BAR ================= */}

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

    {/* ================= DEPOSIT TABLE ================= */}

    <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden">

      <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">

        <h2 className="text-xl font-bold text-yellow-400">
          Deposit Requests ({filteredDeposits.length})
        </h2>

        <Clock className="text-yellow-400" />

      </div>

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1100px]">

          <thead className="bg-[#1F2937] text-gray-300 text-sm">

            <tr>
              <th className="text-left px-5 py-4">User</th>
              <th className="text-center">Wallet</th>
              <th className="text-center">Amount</th>
              <th className="text-center">Transaction ID</th>
              <th className="text-center">Status</th>
              <th className="text-center">Date</th>
              <th className="text-center">Actions</th>
            </tr>

          </thead>

          <tbody>{loading ? (
  <tr>
    <td colSpan={7} className="py-12 text-center text-gray-400">
      Loading deposit requests...
    </td>
  </tr>
) : filteredDeposits.length === 0 ? (
  <tr>
    <td colSpan={7} className="py-12 text-center text-red-300">
      No deposit requests found.
    </td>
  </tr>
) : (
  filteredDeposits.map((deposit) => (
    <tr
      key={deposit._id}
      className="border-b border-gray-800 hover:bg-[#1B2435] transition"
    >
      {/* USER */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2 font-semibold text-white">
          <User size={16} className="text-yellow-400" />
          {deposit.username}
        </div>

        <p className="text-xs text-gray-400 mt-1">
          {deposit.email || "No Email"}
        </p>
      </td>

      {/* WALLET */}
      <td className="text-center">
        <span
          className={`font-bold ${getWalletColor(deposit.walletType)}`}
        >
          {deposit.walletType}
        </span>
      </td>

      {/* AMOUNT */}
      <td className="text-center font-semibold">
        {deposit.walletType === "PKR" && (
          <span className="text-green-400">
            PKR {formatMoney(Number(deposit.amount))}
          </span>
        )}

        {deposit.walletType === "GOLD" && (
          <span className="text-yellow-400">
            {Number(deposit.amount).toFixed(3)} Gold
          </span>
        )}

        {deposit.walletType === "USDT" && (
          <span className="text-cyan-400">
            {Number(deposit.amount).toFixed(2)} USDT
          </span>
        )}
      </td>

      {/* TRANSACTION ID */}
      <td className="text-center">
        {deposit.transactionId ? (
          <span className="bg-gray-700 text-yellow-300 text-xs px-3 py-1 rounded-lg break-all">
            {deposit.transactionId}
          </span>
        ) : (
          <span className="text-xs text-gray-500">
            Not Provided
          </span>
        )}
      </td>

      {/* STATUS */}
      <td className="text-center">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
            deposit.status
          )}`}
        >
          {deposit.status}
        </span>
      </td>

      {/* DATE */}
      <td className="text-center text-sm text-gray-300">
        <div className="flex flex-col items-center gap-1">
          <Calendar size={14} className="text-gray-500" />
          {formatDate(deposit.createdAt)}
        </div>
      </td>

      {/* ACTIONS */}
      <td className="px-4 py-4">
        <div className="flex flex-wrap justify-center gap-2">

          {/* DETAILS */}
          <button
            onClick={() => openDepositDetails(deposit)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold transition"
          >
            Details
          </button>

          {/* APPROVE */}
          {deposit.status === "Pending" && (
            <button
              onClick={() => openDepositDetails(deposit)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <CheckCircle size={14} />
              Approve
            </button>
          )}

          {/* REJECT */}
          {deposit.status === "Pending" && (
            <button
              onClick={() => openDepositDetails(deposit)}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <XCircle size={14} />
              Reject
            </button>
          )}

          {/* DELETE */}
          {deposit.status !== "Approved" && (
            <button
              onClick={() => deleteDeposit(deposit._id)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs transition"
            >
              Delete
            </button>
          )}

        </div>
      </td>
    </tr>
    )))}
      </tbody>

        </table>

      </div>

    </div>

    {/* ========================================== */}
    {/* DEPOSIT DETAILS MODAL STARTS HERE */}
    {/* ========================================== */}

    {selectedDeposit && (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">

        <div className="w-full max-w-2xl rounded-3xl bg-[#111827] border border-yellow-500/30 shadow-2xl overflow-hidden">

          {/* Modal Header */}

          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-700">

            <div>

              <h2 className="text-2xl font-bold text-yellow-400">
                Deposit Details
              </h2>

              <p className="text-sm text-gray-400 mt-1">
                Review user deposit before approval or rejection.
              </p>

            </div>

            <button
              onClick={closeDepositDetails}
              className="text-gray-400 hover:text-red-400 transition"
            >
              <XCircle size={28} />
            </button>

          </div>

          {/* Modal Body */}

          <div className="p-6 space-y-5">            {/* ========================================== */}
            {/* USER INFORMATION */}
            {/* ========================================== */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="bg-[#1F2937] rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2">Username</p>

                <h3 className="text-white font-semibold">
                  {selectedDeposit.username}
                </h3>

                <p className="text-sm text-gray-400 mt-1">
                  {selectedDeposit.email || "No Email"}
                </p>
              </div>

              <div className="bg-[#1F2937] rounded-xl p-4">
                <p className="text-xs text-gray-400 mb-2">Wallet Type</p>

                <span
                  className={`text-lg font-bold ${getWalletColor(
                    selectedDeposit.walletType
                  )}`}
                >
                  {selectedDeposit.walletType}
                </span>
              </div>

            </div>

            {/* ========================================== */}
            {/* AMOUNT + DATE */}
            {/* ========================================== */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="bg-[#1F2937] rounded-xl p-4">

                <p className="text-xs text-gray-400 mb-2">
                  Deposit Amount
                </p>

                <h3 className="text-2xl font-bold text-green-400">

                  {selectedDeposit.walletType === "PKR" &&
                    `PKR ${formatMoney(Number(selectedDeposit.amount))}`}

                  {selectedDeposit.walletType === "GOLD" &&
                    `${Number(selectedDeposit.amount).toFixed(3)} Gold`}

                  {selectedDeposit.walletType === "USDT" &&
                    `${Number(selectedDeposit.amount).toFixed(2)} USDT`}

                </h3>

              </div>

              <div className="bg-[#1F2937] rounded-xl p-4">

                <p className="text-xs text-gray-400 mb-2">
                  Request Date
                </p>

                <h3 className="text-white font-semibold">
                  {formatDate(selectedDeposit.createdAt)}
                </h3>

              </div>

            </div>

            {/* ========================================== */}
            {/* TRANSACTION ID */}
            {/* ========================================== */}

            <div className="bg-[#1F2937] rounded-xl p-4">

              <p className="text-xs text-gray-400 mb-2">
                Transaction ID
              </p>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

                <span className="text-yellow-300 break-all text-sm">
                  {selectedDeposit.transactionId || "Not Provided"}
                </span>

                {selectedDeposit.transactionId && (
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        selectedDeposit.transactionId!
                      )
                    }
                    className="bg-yellow-500 hover:bg-yellow-600 text-black px-3 py-2 rounded-lg text-xs font-semibold transition"
                  >
                    Copy Transaction ID
                  </button>
                )}

              </div>

            </div>

            {/* ========================================== */}
            {/* CURRENT STATUS */}
            {/* ========================================== */}

            <div className="bg-[#1F2937] rounded-xl p-4 flex items-center justify-between">

              <div>

                <p className="text-xs text-gray-400 mb-2">
                  Current Status
                </p>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    selectedDeposit.status
                  )}`}
                >
                  {selectedDeposit.status}
                </span>

              </div>

              <FileText size={28} className="text-yellow-400" />

            </div>

            {/* ========================================== */}
            {/* PAYMENT SCREENSHOT */}
            {/* ========================================== */}

            <div>

              <p className="text-sm text-gray-400 mb-3">
                Payment Screenshot
              </p>

              {selectedDeposit.screenshot ? (
                <img
                  src={selectedDeposit.screenshot}
                  alt="Deposit Screenshot"
                  className="w-full rounded-2xl border border-gray-700 object-contain max-h-[420px]"
                />
              ) : (
                <div className="border border-dashed border-gray-600 rounded-2xl p-10 text-center text-gray-500">
                  No payment screenshot uploaded.
                </div>
              )}

            </div>

            {/* ========================================== */}
            {/* ADMIN NOTE */}
            {/* ========================================== */}

            <div>

              <label className="block text-sm text-gray-400 mb-2">
                Admin Note
              </label>

              <textarea
                rows={4}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Write approval or rejection note..."
                className="w-full rounded-xl bg-[#1F2937] border border-gray-600 p-4 outline-none resize-none focus:border-yellow-500 transition"
              />

            </div>          </div>

          {/* ========================================== */}
          {/* MODAL FOOTER BUTTONS */}
          {/* ========================================== */}

          <div className="border-t border-gray-700 px-6 py-5 flex flex-wrap justify-end gap-3">

            {/* Close */}

            <button
              onClick={closeDepositDetails}
              className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-3 rounded-xl font-semibold transition"
            >
              Close
            </button>

            {/* Reject */}

            {selectedDeposit.status === "Pending" && (
              <button
                disabled={loading}
                onClick={rejectDeposit}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
              >
                <XCircle size={18} />
                Reject Deposit
              </button>
            )}

            {/* Approve */}

            {selectedDeposit.status === "Pending" && (
              <button
                disabled={loading}
                onClick={approveDeposit}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
              >
                <CheckCircle size={18} />
                Approve Deposit
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

        <div className="bg-[#111827] border border-yellow-500/30 rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-2xl">

          <RefreshCw
            size={36}
            className="text-yellow-400 animate-spin"
          />

          <div className="text-center">

            <h3 className="text-lg font-bold text-yellow-400">
              GoldTrade Enterprise
            </h3>

            <p className="text-sm text-gray-300 mt-1">
              Processing deposit request...
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

          <h3 className="text-yellow-400 font-bold text-lg">
            GoldTrade Enterprise
          </h3>

          <p className="text-sm text-gray-500">
            Admin Deposit Management Panel
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