"use client";
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
  process.env.NEXT_PUBLIC_API_URL ||  "https://goldtrade-2.onrender.com";
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
// LOAD ALL DEPOSITS
// =====================================================

const loadDeposits = async () => {
  if (!token) return;

  try {
    setLoading(true);

    const response = await fetch(
      `${API}/api/deposit/admin/all?page=1&limit=100`,
      {
        method: "GET",
        headers: getHeaders(),
        cache: "no-store",
      }
    );

    const data = await response.json();

    console.log("DEPOSITS API:", data);

    // ================================================
    // AUTH / ADMIN ERROR
    // ================================================

    if (response.status === 401) {
      throw new Error("Authentication required. Please login again.");
    }

    if (response.status === 403) {
      throw new Error(
        data.message || "Admin permission required."
      );
    }

    // ================================================
    // API ERROR
    // ================================================

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to load deposits."
      );
    }

    // ================================================
    // DEPOSIT LIST
    // ================================================

    const list: DepositRequest[] = Array.isArray(data.deposits)
      ? data.deposits
      : [];

    console.log("DEPOSITS COUNT:", list.length);

    setDeposits(list);
    setFilteredDeposits(list);

  } catch (error) {
    console.error("LOAD DEPOSITS ERROR:", error);

    setDeposits([]);
    setFilteredDeposits([]);

    setMessageType("error");

    setMessage(
      error instanceof Error
        ? error.message
        : "Failed to load deposit requests."
    );
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
      `${API}/api/deposit/statistics`,
      {
        method: "GET",
        headers: getHeaders(),
        cache: "no-store",
      }
    );

    const data = await response.json();

    console.log("DEPOSIT STATS:", data);

    // ================================================
    // AUTH / ADMIN ERROR
    // ================================================

    if (response.status === 401) {
      console.error(
        "STATISTICS AUTH ERROR:",
        data.message
      );
      return;
    }

    if (response.status === 403) {
      console.error(
        "STATISTICS ADMIN ERROR:",
        data.message
      );
      return;
    }

    // ================================================
    // SUCCESS
    // ================================================

    if (response.ok && data.success) {
      const stats = data.statistics || {};

      setStatistics({
        totalRequests: Number(
          stats.totalRequests ?? 0
        ),

        pendingRequests: Number(
          stats.pendingRequests ?? 0
        ),

        approvedRequests: Number(
          stats.approvedRequests ?? 0
        ),

        rejectedRequests: Number(
          stats.rejectedRequests ?? 0
        ),

        pendingAmount: Number(
          stats.pendingAmount ?? 0
        ),

        approvedAmount: Number(
          stats.approvedAmount ?? 0
        ),

        rejectedAmount: Number(
          stats.rejectedAmount ?? 0
        ),

        totalPKR: Number(
          stats.totalPKR ?? 0
        ),

        totalGold: Number(
          stats.totalGold ?? 0
        ),

        totalUSDT: Number(
          stats.totalUSDT ?? 0
        ),
      });

      return;
    }

    console.error(
      "STATISTICS API ERROR:",
      data.message || "Unable to load statistics."
    );

  } catch (error) {
    console.error(
      "LOAD STATISTICS ERROR:",
      error
    );
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
  const keyword = search.trim().toLowerCase();

  if (!keyword) {
    setFilteredDeposits(deposits);
    return;
  }

  const filtered = deposits.filter((deposit) => {
    const username =
      deposit.username?.toLowerCase() || "";

    const email =
      deposit.email?.toLowerCase() || "";

    const userId =
      deposit.userId?.toLowerCase() || "";

    const transactionId =
      deposit.transactionId?.toLowerCase() || "";

    const walletType =
      deposit.walletType?.toLowerCase() || "";

    const status =
      deposit.status?.toLowerCase() || "";

    return (
      username.includes(keyword) ||
      email.includes(keyword) ||
      userId.includes(keyword) ||
      transactionId.includes(keyword) ||
      walletType.includes(keyword) ||
      status.includes(keyword)
    );
  });

  setFilteredDeposits(filtered);

}, [search, deposits]);

// =====================================================
// REFRESH PAGE
// =====================================================

const refreshPage = async () => {
  try {
    setMessage("");

    await Promise.all([
      loadDeposits(),
      loadStatistics(),
    ]);

    setMessageType("success");
    setMessage(
      "Deposit list refreshed successfully."
    );

  } catch (error) {
    console.error(
      "REFRESH PAGE ERROR:",
      error
    );

    setMessageType("error");
    setMessage(
      "Unable to refresh deposit data."
    );
  }
};

// =====================================================
// OPEN DEPOSIT DETAILS
// =====================================================

const openDepositDetails = (
  deposit: DepositRequest
) => {
  setSelectedDeposit(deposit);
  setAdminNote(deposit.adminNote || "");
};

// =====================================================
// CLOSE DEPOSIT DETAILS
// =====================================================

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
      `${API}/api/deposit/${selectedDeposit._id}/approve`,
      {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          adminNote: adminNote.trim(),
        }),
      }
    );

    const data = await response.json();

    console.log(
      "APPROVE RESPONSE:",
      data
    );

    // ================================================
    // AUTH ERROR
    // ================================================

    if (response.status === 401) {
      throw new Error(
        "Authentication required. Please login again."
      );
    }

    // ================================================
    // ADMIN ERROR
    // ================================================

    if (response.status === 403) {
      throw new Error(
        data.message ||
          "Admin permission required."
      );
    }

    // ================================================
    // API ERROR
    // ================================================

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Unable to approve deposit."
      );
    }

    // ================================================
    // SUCCESS
    // ================================================

    setMessageType("success");

    setMessage(
      "Deposit approved successfully."
    );

    closeDepositDetails();

    await Promise.all([
      loadDeposits(),
      loadStatistics(),
    ]);

  } catch (error) {
    console.error(
      "APPROVE ERROR:",
      error
    );

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
      `${API}/api/deposit/${selectedDeposit._id}/reject`,
      {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          adminNote: adminNote.trim(),
        }),
      }
    );

    const data = await response.json();

    console.log(
      "REJECT RESPONSE:",
      data
    );

    // ================================================
    // AUTH ERROR
    // ================================================

    if (response.status === 401) {
      throw new Error(
        "Authentication required. Please login again."
      );
    }

    // ================================================
    // ADMIN ERROR
    // ================================================

    if (response.status === 403) {
      throw new Error(
        data.message ||
          "Admin permission required."
      );
    }

    // ================================================
    // API ERROR
    // ================================================

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Unable to reject deposit."
      );
    }

    // ================================================
    // SUCCESS
    // ================================================

    setMessageType("success");

    setMessage(
      "Deposit rejected successfully."
    );

    closeDepositDetails();

    await Promise.all([
      loadDeposits(),
      loadStatistics(),
    ]);

  } catch (error) {
    console.error(
      "REJECT ERROR:",
      error
    );

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
// CANCEL DEPOSIT
// =====================================================
// V18 does NOT use DELETE for deposits.
// The backend provides PATCH /:id/cancel.
// We keep the function name deleteDeposit so your
// existing UI buttons do not need to be changed.
// =====================================================

const deleteDeposit = async (
  depositId: string
) => {
  const ok = window.confirm(
    "Cancel this deposit request?"
  );

  if (!ok) return;

  try {
    setLoading(true);

    const response = await fetch(
      `${API}/api/deposit/${depositId}/cancel`,
      {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({
          adminNote: "Cancelled by admin.",
        }),
      }
    );

    const data = await response.json();

    console.log(
      "CANCEL RESPONSE:",
      data
    );

    // ================================================
    // AUTH ERROR
    // ================================================

    if (response.status === 401) {
      throw new Error(
        "Authentication required. Please login again."
      );
    }

    // ================================================
    // ADMIN ERROR
    // ================================================

    if (response.status === 403) {
      throw new Error(
        data.message ||
          "Admin permission required."
      );
    }

    // ================================================
    // API ERROR
    // ================================================

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Unable to cancel deposit."
      );
    }

    // ================================================
    // SUCCESS
    // ================================================

    setMessageType("success");

    setMessage(
      "Deposit request cancelled successfully."
    );

    if (
      selectedDeposit?._id === depositId
    ) {
      closeDepositDetails();
    }

    await Promise.all([
      loadDeposits(),
      loadStatistics(),
    ]);

  } catch (error) {
    console.error(
      "CANCEL ERROR:",
      error
    );

    setMessageType("error");

    setMessage(
      error instanceof Error
        ? error.message
        : "Unable to cancel deposit."
    );

  } finally {
    setLoading(false);
  }
};

// =====================================================
// FORMATTERS
// =====================================================

const formatMoney = (value: number | string | null | undefined) => {
  const numericValue = Number(value ?? 0);

  if (!Number.isFinite(numericValue)) {
    return "0.00";
  }

  return numericValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// =====================================================
// FORMAT DATE
// =====================================================

const formatDate = (
  date: string | Date | null | undefined
) => {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

// =====================================================
// STATUS COLOR
// =====================================================

const getStatusColor = (
  status: string | null | undefined
) => {
  switch (String(status || "").toLowerCase()) {
    case "approved":
      return (
        "bg-green-600/20 text-green-400 " +
        "border border-green-500/30"
      );

    case "rejected":
      return (
        "bg-red-600/20 text-red-400 " +
        "border border-red-500/30"
      );

    case "cancelled":
    case "canceled":
      return (
        "bg-gray-600/20 text-gray-400 " +
        "border border-gray-500/30"
      );

    case "pending":
    default:
      return (
        "bg-yellow-600/20 text-yellow-400 " +
        "border border-yellow-500/30"
      );
  }
};

// =====================================================
// WALLET COLOR
// =====================================================

const getWalletColor = (
  wallet: string | null | undefined
) => {
  switch (String(wallet || "").toUpperCase()) {
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
// =====================================================
// PAGE UI START
// GOLDTRADE V18 ENTERPRISE ADMIN DEPOSIT MANAGER
// PART 1/2
// =====================================================

return (
  <div className="min-h-screen bg-[#0B1120] text-white p-4 md:p-6">

    {/* =================================================
        HEADER
    ================================================= */}

    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-yellow-400">
          GoldTrade V18 • Admin Deposit Manager
        </h1>

        <p className="text-gray-400 mt-2">
          Manage PKR, GOLD and USDT deposit requests from users.
        </p>
      </div>

      <button
        type="button"
        onClick={refreshPage}
        disabled={loading}
        className="flex items-center justify-center gap-2
          bg-yellow-500 hover:bg-yellow-600
          disabled:opacity-60 disabled:cursor-not-allowed
          text-black font-semibold px-5 py-3 rounded-xl
          transition"
      >
        <RefreshCw
          size={18}
          className={loading ? "animate-spin" : ""}
        />

        {loading ? "Refreshing..." : "Refresh Deposits"}
      </button>

    </div>

    {/* =================================================
        SUCCESS / ERROR MESSAGE
    ================================================= */}

    {message && (
      <div
        className={`mb-6 rounded-xl border px-4 py-3 font-medium ${
          messageType === "success"
            ? "bg-green-600/20 border-green-500 text-green-300"
            : "bg-red-600/20 border-red-500 text-red-300"
        }`}
      >
        <div className="flex items-center justify-between gap-4">

          <span>{message}</span>

          <button
            type="button"
            onClick={() => setMessage("")}
            className="text-gray-400 hover:text-white text-sm"
          >
            ×
          </button>

        </div>
      </div>
    )}

    {/* =================================================
        STATISTICS CARDS
    ================================================= */}

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

      {/* ================= PENDING ================= */}

      <div className="rounded-2xl bg-[#111827] border border-yellow-600/30 p-5">

        <div className="flex justify-between items-center mb-3">

          <Clock
            className="text-yellow-400"
            size={28}
          />

          <span className="text-xs font-semibold text-yellow-400">
            PENDING
          </span>

        </div>

        <p className="text-gray-400 text-sm">
          Pending Deposit Requests
        </p>

        <h2 className="text-3xl font-bold text-yellow-300 mt-2">
          {Number(statistics.pendingRequests || 0)}
        </h2>

        <p className="text-yellow-400 mt-2 text-sm">
          PKR {formatMoney(statistics.pendingAmount)}
        </p>

      </div>

      {/* ================= APPROVED ================= */}

      <div className="rounded-2xl bg-[#111827] border border-green-600/30 p-5">

        <div className="flex justify-between items-center mb-3">

          <CheckCircle
            className="text-green-400"
            size={28}
          />

          <span className="text-xs font-semibold text-green-400">
            APPROVED
          </span>

        </div>

        <p className="text-gray-400 text-sm">
          Approved Deposit Requests
        </p>

        <h2 className="text-3xl font-bold text-green-400 mt-2">
          {Number(statistics.approvedRequests || 0)}
        </h2>

        <p className="text-green-400 mt-2 text-sm">
          PKR {formatMoney(statistics.approvedAmount)}
        </p>

      </div>

      {/* ================= REJECTED ================= */}

      <div className="rounded-2xl bg-[#111827] border border-red-600/30 p-5">

        <div className="flex justify-between items-center mb-3">

          <XCircle
            className="text-red-400"
            size={28}
          />

          <span className="text-xs font-semibold text-red-400">
            REJECTED
          </span>

        </div>

        <p className="text-gray-400 text-sm">
          Rejected Deposit Requests
        </p>

        <h2 className="text-3xl font-bold text-red-400 mt-2">
          {Number(statistics.rejectedRequests || 0)}
        </h2>

        <p className="text-red-400 mt-2 text-sm">
          PKR {formatMoney(statistics.rejectedAmount)}
        </p>

      </div>

      {/* ================= TOTAL ================= */}

      <div className="rounded-2xl bg-[#111827] border border-purple-600/30 p-5">

        <div className="flex justify-between items-center mb-3">

          <Wallet
            className="text-purple-400"
            size={28}
          />

          <span className="text-xs font-semibold text-purple-400">
            TOTAL
          </span>

        </div>

        <p className="text-gray-400 text-sm">
          Total Deposit Requests
        </p>

        <h2 className="text-3xl font-bold text-purple-400 mt-2">
          {Number(statistics.totalRequests || 0)}
        </h2>

        <p className="text-purple-300 mt-2 text-sm">
          All Wallet Requests
        </p>

      </div>

    </div>

    {/* =================================================
        WALLET SUMMARY
    ================================================= */}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

      {/* ================= PKR ================= */}

      <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-5">

        <div className="flex justify-between items-center mb-2">

          <DollarSign
            className="text-green-400"
            size={24}
          />

          <span className="text-green-400 text-xs font-semibold">
            PKR
          </span>

        </div>

        <h3 className="text-2xl font-bold text-green-400">
          PKR {formatMoney(statistics.totalPKR)}
        </h3>

        <p className="text-gray-400 text-sm mt-2">
          Total PKR Deposit Amount
        </p>

      </div>

      {/* ================= GOLD ================= */}

      <div className="rounded-2xl bg-[#111827] border border-yellow-600/20 p-5">

        <div className="flex justify-between items-center mb-2">

          <Coins
            className="text-yellow-400"
            size={24}
          />

          <span className="text-yellow-400 text-xs font-semibold">
            GOLD
          </span>

        </div>

        <h3 className="text-2xl font-bold text-yellow-400">
          {Number(statistics.totalGold || 0).toFixed(3)} Gold
        </h3>

        <p className="text-gray-400 text-sm mt-2">
          Total Gold Deposit Amount
        </p>

      </div>

      {/* ================= USDT ================= */}

      <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-5">

        <div className="flex justify-between items-center mb-2">

          <Wallet
            className="text-cyan-400"
            size={24}
          />

          <span className="text-cyan-400 text-xs font-semibold">
            USDT
          </span>

        </div>

        <h3 className="text-2xl font-bold text-cyan-400">
          {Number(statistics.totalUSDT || 0).toFixed(2)} USDT
        </h3>

        <p className="text-gray-400 text-sm mt-2">
          Total USDT Deposit Amount
        </p>

      </div>

    </div>

    {/* =================================================
        SEARCH BAR
    ================================================= */}

    <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">

      <div className="relative">

        <Search
          size={20}
          className="absolute left-4 top-3.5 text-gray-500"
        />

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search username, email, transaction ID..."
          className="
            w-full
            bg-[#1F2937]
            border border-gray-600
            rounded-xl
            py-3
            pl-12
            pr-4
            text-white
            placeholder-gray-500
            outline-none
            focus:border-yellow-500
            transition
          "
        />

      </div>

      {search.trim() && (
        <p className="text-xs text-gray-500 mt-3">
          Showing {filteredDeposits.length} matching deposit request
          {filteredDeposits.length === 1 ? "" : "s"}.
        </p>
      )}

    </div>

    {/* =================================================
        DEPOSIT TABLE
    ================================================= */}

    <div className="rounded-2xl border border-gray-700 bg-[#111827] overflow-hidden">

      {/* ================= TABLE HEADER ================= */}

      <div className="px-5 md:px-6 py-5 border-b border-gray-700 flex justify-between items-center">

        <div>
          <h2 className="text-xl font-bold text-yellow-400">
            Deposit Requests ({filteredDeposits.length})
          </h2>

          <p className="text-xs text-gray-500 mt-1">
            GoldTrade V18 deposit management
          </p>
        </div>

        <Clock
          className="text-yellow-400"
          size={22}
        />

      </div>

      {/* ================= TABLE SCROLL ================= */}

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1100px]">

          <thead className="bg-[#1F2937] text-gray-300 text-sm">

            <tr>

              <th className="text-left px-5 py-4">
                User
              </th>

              <th className="text-center px-4 py-4">
                Wallet
              </th>

              <th className="text-center px-4 py-4">
                Amount
              </th>

              <th className="text-center px-4 py-4">
                Transaction ID
              </th>

              <th className="text-center px-4 py-4">
                Status
              </th>

              <th className="text-center px-4 py-4">
                Date
              </th>

              <th className="text-center px-4 py-4">
                Actions
              </th>

            </tr>

          </thead>

          {/* ================= TABLE BODY ================= */}

          <tbody>

            {/* ================= LOADING ================= */}

            {loading ? (
              <tr>

                <td
                  colSpan={7}
                  className="py-14 text-center text-gray-400"
                >

                  <div className="flex flex-col items-center gap-3">

                    <RefreshCw
                      size={30}
                      className="text-yellow-400 animate-spin"
                    />

                    <span>
                      Loading deposit requests...
                    </span>

                  </div>

                </td>

              </tr>

            ) : filteredDeposits.length === 0 ? (

              /* ================= EMPTY ================= */

              <tr>

                <td
                  colSpan={7}
                  className="py-14 text-center"
                >

                  <div className="flex flex-col items-center gap-2">

                    <FileText
                      size={34}
                      className="text-gray-600"
                    />

                    <p className="text-gray-400">
                      No deposit requests found.
                    </p>

                    {search.trim() && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="text-yellow-400 hover:text-yellow-300 text-sm"
                      >
                        Clear search
                      </button>
                    )}

                  </div>

                </td>

              </tr>

            ) : (

              /* ================= DEPOSIT ROWS ================= */

              filteredDeposits.map((deposit) => {

                const normalizedStatus =
                  String(deposit.status || "").toLowerCase();

                const isPending =
                  normalizedStatus === "pending";

                const isApproved =
                  normalizedStatus === "approved";

                return (
                  <tr
                    key={deposit._id}
                    className="
                      border-b border-gray-800
                      hover:bg-[#1B2435]
                      transition
                    "
                  >

                    {/* ================= USER ================= */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2 font-semibold text-white">

                        <User
                          size={16}
                          className="text-yellow-400"
                        />

                        <span>
                          {deposit.username || "Unknown User"}
                        </span>

                      </div>

                      <p className="text-xs text-gray-400 mt-1">
                        {deposit.email || "No Email"}
                      </p>

                    </td>

                    {/* ================= WALLET ================= */}

                    <td className="text-center px-4">

                      <span
                        className={`font-bold ${getWalletColor(
                          deposit.walletType
                        )}`}
                      >
                        {deposit.walletType || "—"}
                      </span>

                    </td>

                    {/* ================= AMOUNT ================= */}

                    <td className="text-center px-4 font-semibold">

                      {String(deposit.walletType).toUpperCase() === "PKR" && (
                        <span className="text-green-400">
                          PKR {formatMoney(Number(deposit.amount || 0))}
                        </span>
                      )}

                      {String(deposit.walletType).toUpperCase() === "GOLD" && (
                        <span className="text-yellow-400">
                          {Number(deposit.amount || 0).toFixed(3)} Gold
                        </span>
                      )}

                      {String(deposit.walletType).toUpperCase() === "USDT" && (
                        <span className="text-cyan-400">
                          {Number(deposit.amount || 0).toFixed(2)} USDT
                        </span>
                      )}

                      {!["PKR", "GOLD", "USDT"].includes(
                        String(deposit.walletType).toUpperCase()
                      ) && (
                        <span className="text-gray-400">
                          {formatMoney(Number(deposit.amount || 0))}
                        </span>
                      )}

                    </td>

                    {/* ================= TRANSACTION ID ================= */}

                    <td className="text-center px-4">

                      {deposit.transactionId ? (
                        <span
                          className="
                            inline-block
                            max-w-[220px]
                            bg-gray-700
                            text-yellow-300
                            text-xs
                            px-3
                            py-1
                            rounded-lg
                            break-all
                          "
                        >
                          {deposit.transactionId}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">
                          Not Provided
                        </span>
                      )}

                    </td>

                    {/* ================= STATUS ================= */}

                    <td className="text-center px-4">

                      <span
                        className={`
                          inline-flex
                          items-center
                          px-3
                          py-1
                          rounded-full
                          text-xs
                          font-semibold
                          ${getStatusColor(deposit.status)}
                        `}
                      >
                        {deposit.status || "Pending"}
                      </span>

                    </td>

                    {/* ================= DATE ================= */}

                    <td className="text-center px-4 text-sm text-gray-300">

                      <div className="flex flex-col items-center gap-1">

                        <Calendar
                          size={14}
                          className="text-gray-500"
                        />

                        {formatDate(deposit.createdAt)}

                      </div>

                    </td>

                    {/* ================= ACTIONS ================= */}

                    <td className="px-4 py-4">

                      <div className="flex flex-wrap justify-center gap-2">

                        {/* DETAILS */}

                        <button
                          type="button"
                          onClick={() =>
                            openDepositDetails(deposit)
                          }
                          className="
                            bg-blue-600
                            hover:bg-blue-700
                            text-white
                            px-3
                            py-2
                            rounded-lg
                            text-xs
                            font-semibold
                            transition
                          "
                        >
                          Details
                        </button>

                        {/* APPROVE */}

                        {isPending && (
                          <button
                            type="button"
                            onClick={() =>
                              openDepositDetails(deposit)
                            }
                            className="
                              bg-green-600
                              hover:bg-green-700
                              text-white
                              px-3
                              py-2
                              rounded-lg
                              text-xs
                              font-semibold
                              flex
                              items-center
                              gap-1
                              transition
                            "
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                        )}

                        {/* REJECT */}

                        {isPending && (
                          <button
                            type="button"
                            onClick={() =>
                              openDepositDetails(deposit)
                            }
                            className="
                              bg-red-600
                              hover:bg-red-700
                              text-white
                              px-3
                              py-2
                              rounded-lg
                              text-xs
                              font-semibold
                              flex
                              items-center
                              gap-1
                              transition
                            "
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        )}

                        {/* CANCEL */}

                        {isPending && (
                          <button
                            type="button"
                            onClick={() =>
                              deleteDeposit(deposit._id)
                            }
                            className="
                              bg-gray-700
                              hover:bg-gray-600
                              text-white
                              px-3
                              py-2
                              rounded-lg
                              text-xs
                              font-semibold
                              transition
                            "
                          >
                            Cancel
                          </button>
                        )}

                        {/* NO ACTION MESSAGE */}

                        {isApproved && (
                          <span className="text-xs text-gray-600 px-2 py-2">
                            Completed
                          </span>
                        )}

                      </div>

                    </td>

                  </tr>
                );
              })

            )}

          </tbody>

        </table>

      </div>

    </div>

        {/* =================================================
        DEPOSIT DETAILS MODAL
    ================================================= */}

    {selectedDeposit && (
      <div
        className="
          fixed
          inset-0
          z-50
          bg-black/80
          backdrop-blur-sm
          flex
          items-center
          justify-center
          p-4
          overflow-y-auto
        "
      >

        <div
          className="
            w-full
            max-w-2xl
            my-8
            rounded-3xl
            bg-[#111827]
            border
            border-yellow-500/30
            shadow-2xl
            overflow-hidden
          "
        >

          {/* ==========================================
              MODAL HEADER
          ========================================== */}

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
              type="button"
              onClick={closeDepositDetails}
              className="
                text-gray-400
                hover:text-red-400
                transition
              "
              aria-label="Close deposit details"
            >
              <XCircle size={28} />
            </button>

          </div>

          {/* ==========================================
              MODAL BODY
          ========================================== */}

          <div className="p-6 space-y-5">

            {/* ========================================
                USER INFORMATION
            ======================================== */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* USER */}

              <div className="bg-[#1F2937] rounded-xl p-4">

                <p className="text-xs text-gray-400 mb-2">
                  Username
                </p>

                <h3 className="text-white font-semibold">
                  {selectedDeposit.username || "Unknown User"}
                </h3>

                <p className="text-sm text-gray-400 mt-1">
                  {selectedDeposit.email || "No Email"}
                </p>

              </div>

              {/* WALLET */}

              <div className="bg-[#1F2937] rounded-xl p-4">

                <p className="text-xs text-gray-400 mb-2">
                  Wallet Type
                </p>

                <span
                  className={`text-lg font-bold ${getWalletColor(
                    selectedDeposit.walletType
                  )}`}
                >
                  {selectedDeposit.walletType || "—"}
                </span>

              </div>

            </div>

            {/* ========================================
                AMOUNT + DATE
            ======================================== */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* AMOUNT */}

              <div className="bg-[#1F2937] rounded-xl p-4">

                <p className="text-xs text-gray-400 mb-2">
                  Deposit Amount
                </p>

                <h3 className="text-2xl font-bold">

                  {String(
                    selectedDeposit.walletType
                  ).toUpperCase() === "PKR" && (
                    <span className="text-green-400">
                      PKR{" "}
                      {formatMoney(
                        Number(
                          selectedDeposit.amount || 0
                        )
                      )}
                    </span>
                  )}

                  {String(
                    selectedDeposit.walletType
                  ).toUpperCase() === "GOLD" && (
                    <span className="text-yellow-400">
                      {Number(
                        selectedDeposit.amount || 0
                      ).toFixed(3)}{" "}
                      Gold
                    </span>
                  )}

                  {String(
                    selectedDeposit.walletType
                  ).toUpperCase() === "USDT" && (
                    <span className="text-cyan-400">
                      {Number(
                        selectedDeposit.amount || 0
                      ).toFixed(2)}{" "}
                      USDT
                    </span>
                  )}

                </h3>

              </div>

              {/* DATE */}

              <div className="bg-[#1F2937] rounded-xl p-4">

                <p className="text-xs text-gray-400 mb-2">
                  Request Date
                </p>

                <h3 className="text-white font-semibold">
                  {formatDate(
                    selectedDeposit.createdAt
                  )}
                </h3>

              </div>

            </div>

            {/* ========================================
                TRANSACTION ID
            ======================================== */}

            <div className="bg-[#1F2937] rounded-xl p-4">

              <p className="text-xs text-gray-400 mb-2">
                Transaction ID
              </p>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

                <span className="text-yellow-300 break-all text-sm">
                  {selectedDeposit.transactionId ||
                    "Not Provided"}
                </span>

                {selectedDeposit.transactionId && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(
                          selectedDeposit.transactionId || ""
                        );

                        setMessageType("success");
                        setMessage(
                          "Transaction ID copied."
                        );
                      } catch (error) {
                        console.error(
                          "COPY TRANSACTION ID ERROR:",
                          error
                        );

                        setMessageType("error");
                        setMessage(
                          "Unable to copy transaction ID."
                        );
                      }
                    }}
                    className="
                      bg-yellow-500
                      hover:bg-yellow-600
                      text-black
                      px-3
                      py-2
                      rounded-lg
                      text-xs
                      font-semibold
                      transition
                      whitespace-nowrap
                    "
                  >
                    Copy Transaction ID
                  </button>
                )}

              </div>

            </div>

            {/* ========================================
                CURRENT STATUS
            ======================================== */}

            <div className="bg-[#1F2937] rounded-xl p-4 flex items-center justify-between gap-4">

              <div>

                <p className="text-xs text-gray-400 mb-2">
                  Current Status
                </p>

                <span
                  className={`
                    inline-flex
                    px-3
                    py-1
                    rounded-full
                    text-xs
                    font-semibold
                    ${getStatusColor(
                      selectedDeposit.status
                    )}
                  `}
                >
                  {selectedDeposit.status || "Pending"}
                </span>

              </div>

              <FileText
                size={28}
                className="text-yellow-400"
              />

            </div>

            {/* ========================================
                PAYMENT SCREENSHOT
            ======================================== */}

            <div>

              <p className="text-sm text-gray-400 mb-3">
                Payment Screenshot
              </p>

              {selectedDeposit.screenshot ? (

                <div className="rounded-2xl overflow-hidden border border-gray-700 bg-black/20">

                  <img
                    src={selectedDeposit.screenshot}
                    alt="Deposit payment screenshot"
                    className="
                      w-full
                      rounded-2xl
                      object-contain
                      max-h-[420px]
                    "
                  />

                </div>

              ) : (

                <div
                  className="
                    border
                    border-dashed
                    border-gray-600
                    rounded-2xl
                    p-10
                    text-center
                    text-gray-500
                  "
                >
                  No payment screenshot uploaded.
                </div>

              )}

            </div>

            {/* ========================================
                ADMIN NOTE
            ======================================== */}

            <div>

              <label
                htmlFor="admin-deposit-note"
                className="block text-sm text-gray-400 mb-2"
              >
                Admin Note
              </label>

              <textarea
                id="admin-deposit-note"
                rows={4}
                value={adminNote}
                onChange={(e) =>
                  setAdminNote(e.target.value)
                }
                placeholder="Write approval, rejection or cancellation note..."
                className="
                  w-full
                  rounded-xl
                  bg-[#1F2937]
                  border
                  border-gray-600
                  p-4
                  text-white
                  placeholder-gray-500
                  outline-none
                  resize-none
                  focus:border-yellow-500
                  transition
                "
              />

            </div>

          </div>

          {/* ==========================================
              MODAL FOOTER
          ========================================== */}

          <div
            className="
              border-t
              border-gray-700
              px-6
              py-5
              flex
              flex-wrap
              justify-end
              gap-3
            "
          >

            {/* CLOSE */}

            <button
              type="button"
              onClick={closeDepositDetails}
              disabled={loading}
              className="
                bg-gray-700
                hover:bg-gray-600
                disabled:opacity-60
                text-white
                px-5
                py-3
                rounded-xl
                font-semibold
                transition
              "
            >
              Close
            </button>

            {/* CANCEL */}

            {String(
              selectedDeposit.status
            ).toLowerCase() === "pending" && (
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  deleteDeposit(
                    selectedDeposit._id
                  )
                }
                className="
                  bg-gray-600
                  hover:bg-gray-500
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  text-white
                  px-5
                  py-3
                  rounded-xl
                  font-semibold
                  transition
                "
              >
                Cancel Deposit
              </button>
            )}

            {/* REJECT */}

            {String(
              selectedDeposit.status
            ).toLowerCase() === "pending" && (
              <button
                type="button"
                disabled={loading}
                onClick={rejectDeposit}
                className="
                  bg-red-600
                  hover:bg-red-700
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  text-white
                  px-5
                  py-3
                  rounded-xl
                  font-semibold
                  flex
                  items-center
                  gap-2
                  transition
                "
              >
                <XCircle size={18} />
                Reject Deposit
              </button>
            )}

            {/* APPROVE */}

            {String(
              selectedDeposit.status
            ).toLowerCase() === "pending" && (
              <button
                type="button"
                disabled={loading}
                onClick={approveDeposit}
                className="
                  bg-green-600
                  hover:bg-green-700
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  text-white
                  px-5
                  py-3
                  rounded-xl
                  font-semibold
                  flex
                  items-center
                  gap-2
                  transition
                "
              >
                <CheckCircle size={18} />
                Approve Deposit
              </button>
            )}

          </div>

        </div>

      </div>
    )}

    {/* =================================================
        GLOBAL LOADING OVERLAY
    ================================================= */}

    {loading && (
      <div
        className="
          fixed
          inset-0
          z-[100]
          bg-black/70
          backdrop-blur-sm
          flex
          items-center
          justify-center
          p-4
        "
      >

        <div
          className="
            bg-[#111827]
            border
            border-yellow-500/30
            rounded-2xl
            px-8
            py-6
            flex
            flex-col
            items-center
            gap-4
            shadow-2xl
          "
        >

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

    {/* =================================================
        FOOTER
    ================================================= */}

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

        <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-gray-400">

          <div className="flex items-center gap-2">
            <CheckCircle
              size={16}
              className="text-green-400"
            />
            Wallet Integration Active
          </div>

          <div className="flex items-center gap-2">
            <Wallet
              size={16}
              className="text-cyan-400"
            />
            PKR • GOLD • USDT
          </div>

          <div className="flex items-center gap-2">
            <RefreshCw
              size={16}
              className="text-yellow-400"
            />
            Live Refresh Enabled
          </div>

        </div>

      </div>

    </footer>

  </div>
);
}