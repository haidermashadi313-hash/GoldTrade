"use client";

// =======================================================
// GoldTrade V18 - ADMIN Usdt PAGE (PART 1/8)
// Imports • Types • API • React States
// =======================================================

import { useEffect, useMemo, useState } from "react";

// =======================================================
// API URL
// =======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =======================================================
// TYPES
// =======================================================

type OrderStatus = "Pending" | "Approved" | "Rejected";

type OrderType = "buy" | "sell";

type FilterStatus =
  | "ALL"
  | "Pending"
  | "Approved"
  | "Rejected";

type FilterType =
  | "ALL"
  | "buy"
  | "sell";

interface UsdtOrder {
  _id: string;

  username: string;

  type: OrderType;

  status: OrderStatus;

  network: "TRC20" | "BEP20" | "ERC20";

  UsdtAmount: number;

  PkrAmount: number;

  WalletAddress: string;

  receiptImage?: string;

  processedBy?: string;

  processedAt?: string;

  createdAt: string;
}

interface OrdersResponse {
  success: boolean;

  totalOrders: number;

  orders: UsdtOrder[];
}

// =======================================================
// COMPONENT
// =======================================================

export default function AdminUsdtPage() {

  // =====================================================
  // ADMIN TOKEN
  // =====================================================

  const [token] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : ""
  );

  // =====================================================
  // PAGE LOADING
  // =====================================================

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] = useState("");

  // =====================================================
  // ORDERS
  // =====================================================

  const [orders, setOrders] = useState<UsdtOrder[]>([]);

  // =====================================================
  // SEARCH & FILTER
  // =====================================================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<FilterStatus>("ALL");

  const [typeFilter, setTypeFilter] =
    useState<FilterType>("ALL");

  // =====================================================
  // RECEIPT PREVIEW
  // =====================================================

  const [selectedReceipt, setSelectedReceipt] =
    useState("");

  // =====================================================
  // SUCCESS / ERROR MESSAGE
  // =====================================================

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // =====================================================
  // SUMMARY COUNTERS
  // =====================================================

  const summary = useMemo(() => {
    return {
      total: orders.length,

      pending: orders.filter(
        (item) => item.status === "Pending"
      ).length,

      approved: orders.filter(
        (item) => item.status === "Approved"
      ).length,

      rejected: orders.filter(
        (item) => item.status === "Rejected"
      ).length,
    };
  }, [orders]);

    // =====================================================
  // LOAD ALL Usdt ORDERS
  // GET /api/Usdt
  // =====================================================

  const loadOrders = async () => {
    if (!token) {
      setLoading(false);
      setErrorMessage("Admin token missing. Please login again.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`${API}/api/Usdt`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data: OrdersResponse = await response.json();

      // ================= SUCCESS =================

      if (response.ok && data.success) {
        setOrders(data.orders || []);
        return;
      }

      // ================= EMPTY LIST (NO 404 BUG) =================

      if (response.status === 404) {
        setOrders([]);
        return;
      }

      throw new Error("Unable to load Usdt orders.");

    } catch (error: any) {
      console.error("LOAD Usdt ORDERS ERROR:", error);

      setOrders([]);

      setErrorMessage(
        error.message || "Unable to load Usdt orders."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REFRESH ORDERS
  // =====================================================

  const refreshOrders = async () => {
    await loadOrders();
  };

  // =====================================================
  // PAGE LOAD
  // =====================================================

  useEffect(() => {
    loadOrders();
  }, []);

  // =====================================================
  // AUTO CLEAR SUCCESS / ERROR MESSAGES
  // =====================================================

  useEffect(() => {
    if (!successMessage && !errorMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  // =====================================================
  // RECEIPT IMAGE URL
  // =====================================================

  const getReceiptUrl = (fileName?: string) => {
    if (!fileName) return "";

    return `${API}/uploads/Usdt/${fileName}`;
  };

  // =====================================================
  // OPEN / CLOSE RECEIPT PREVIEW
  // =====================================================

  const openReceipt = (fileName?: string) => {
    if (!fileName) return;
    setSelectedReceipt(getReceiptUrl(fileName));
  };

  const closeReceipt = () => {
    setSelectedReceipt("");
  };

    // =====================================================
  // UPDATE ORDER STATUS
  // PUT /api/Usdt/:id
  // =====================================================

  const updateOrderStatus = async (
    orderId: string,
    status: "Approved" | "Rejected"
  ) => {
    if (!token) {
      setErrorMessage("Admin token missing. Please login again.");
      return;
    }

    try {
      setActionLoading(orderId);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`${API}/api/Usdt/${orderId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Unable to ${status.toLowerCase()} order.`);
      }

      // Success Message
      setSuccessMessage(
        status === "Approved"
          ? "Usdt order approved successfully."
          : "Usdt order rejected successfully."
      );

      // Reload latest orders
      await loadOrders();

    } catch (error: any) {
      console.error(`${status} ORDER ERROR:`, error);

      setErrorMessage(
        error.message || `Unable to ${status.toLowerCase()} order.`
      );

    } finally {
      setActionLoading("");
    }
  };

  // =====================================================
  // APPROVE ORDER
  // =====================================================

  const approveOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, "Approved");
  };

  // =====================================================
  // REJECT ORDER
  // =====================================================

  const rejectOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, "Rejected");
  };

  // =====================================================
  // CHECK BUTTON LOADING
  // =====================================================

  const isProcessing = (orderId: string) => {
    return actionLoading === orderId;
  };

  // =====================================================
  // STATUS BADGE COLORS
  // =====================================================

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-700 border border-green-300";

      case "Rejected":
        return "bg-red-100 text-red-700 border border-red-300";

      default:
        return "bg-yellow-100 text-yellow-700 border border-yellow-300";
    }
  };

  // =====================================================
  // ORDER TYPE BADGE COLORS
  // =====================================================

  const getTypeBadge = (type: OrderType) => {
    return type === "buy"
      ? "bg-blue-100 text-blue-700 border border-blue-300"
      : "bg-purple-100 text-purple-700 border border-purple-300";
  };

    // =====================================================
  // SEARCH + FILTER ORDERS
  // =====================================================

  const filteredOrders = useMemo(() => {
    let data = [...orders];

    // ---------------- STATUS FILTER ----------------

    if (statusFilter !== "ALL") {
      data = data.filter((item) => item.status === statusFilter);
    }

    // ---------------- buy / sell FILTER ----------------

    if (typeFilter !== "ALL") {
      data = data.filter((item) => item.type === typeFilter);
    }

    // ---------------- SEARCH USERNAME / NETWORK / STATUS ----------------

    if (search.trim()) {
      const keyword = search.toLowerCase();

      data = data.filter((item) => {
        return (
          item.username.toLowerCase().includes(keyword) ||
          item.network.toLowerCase().includes(keyword) ||
          item.status.toLowerCase().includes(keyword) ||
          item.type.toLowerCase().includes(keyword) ||
          item.UsdtAmount.toString().includes(keyword) ||
          item.PkrAmount.toString().includes(keyword)
        );
      });
    }

    // ---------------- NEWEST FIRST ----------------

    return data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  }, [orders, search, statusFilter, typeFilter]);

  // =====================================================
  // FILTER SUMMARY
  // =====================================================

  const visibleSummary = useMemo(() => {
    return {
      total: filteredOrders.length,

      buy: filteredOrders.filter((item) => item.type === "buy")
        .length,

      sell: filteredOrders.filter((item) => item.type === "sell")
        .length,

      pending: filteredOrders.filter(
        (item) => item.status === "Pending"
      ).length,

      approved: filteredOrders.filter(
        (item) => item.status === "Approved"
      ).length,

      rejected: filteredOrders.filter(
        (item) => item.status === "Rejected"
      ).length,
    };
  }, [filteredOrders]);

  // =====================================================
  // FILTER HANDLERS
  // =====================================================

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
  };

  const handleStatusFilter = (value: FilterStatus) => {
    setStatusFilter(value);
  };

  const handleTypeFilter = (value: FilterType) => {
    setTypeFilter(value);
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const formatTime = (date: string) => {
    try {
      return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "-";
    }
  };

  // =====================================================
  // FORMAT AMOUNTS
  // =====================================================

  const formatPkr = (value: number) =>
    new Intl.NumberFormat("en-PK", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);

  const formatUsdt = (value: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  // =====================================================
  // COPY Wallet ADDRESS
  // =====================================================

  const copyWallet = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setSuccessMessage("Wallet address copied successfully.");
    } catch {
      setErrorMessage("Unable to copy Wallet address.");
    }
  };

  // =====================================================
  // HAS DATA
  // =====================================================

  const hasOrders = filteredOrders.length > 0;

    // =====================================================
  // JSX UI START
  // PART 5/8
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ===================================================== */}
        {/* PAGE HEADER */}
        {/* ===================================================== */}

        <div className="mb-6 rounded-3xl bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-600 p-6 text-white shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h1 className="text-3xl font-bold">
                Admin Usdt Orders
              </h1>

              <p className="mt-2 text-blue-100">
                GoldTrade V18 • Manage buy & sell Requests
              </p>

              <p className="mt-2 text-sm text-blue-200">
                Approve, Reject and Review every Usdt transaction securely.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshOrders}
              disabled={loading}
              className="rounded-xl bg-white px-5 py-3 font-semibold text-indigo-700 transition hover:bg-blue-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Orders"}
            </button>

          </div>
        </div>

        {/* ===================================================== */}
        {/* SUCCESS MESSAGE */}
        {/* ===================================================== */}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-300 bg-green-100 p-4 text-green-700">
            {successMessage}
          </div>
        )}

        {/* ===================================================== */}
        {/* ERROR MESSAGE */}
        {/* ===================================================== */}

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {/* ===================================================== */}
        {/* PAGE LOADING */}
        {/* ===================================================== */}

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-lg">

            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>

            <p className="text-gray-600">
              Loading Usdt Orders...
            </p>

          </div>
        ) : (
          <>

            {/* ===================================================== */}
            {/* SUMMARY CARDS */}
            {/* ===================================================== */}

            <div className="grid gap-4 md:grid-cols-4">

              {/* Total Orders */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Total Orders
                </p>

                <h2 className="mt-2 text-2xl font-bold text-indigo-700">
                  {summary.total}
                </h2>
              </div>

              {/* Pending */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Pending
                </p>

                <h2 className="mt-2 text-2xl font-bold text-yellow-600">
                  {summary.pending}
                </h2>
              </div>

              {/* Approved */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Approved
                </p>

                <h2 className="mt-2 text-2xl font-bold text-green-600">
                  {summary.approved}
                </h2>
              </div>

              {/* Rejected */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Rejected
                </p>

                <h2 className="mt-2 text-2xl font-bold text-red-600">
                  {summary.rejected}
                </h2>
              </div>

            </div>

            {/* ===================================================== */}
            {/* buy / sell SUMMARY */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Orders Overview
                  </h3>

                  <p className="text-sm text-gray-500">
                    Live buy & sell Request Summary
                  </p>
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-xl bg-gray-200 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-300"
                >
                  Clear Filters
                </button>

              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">

                {/* buy */}

                <div className="rounded-xl bg-blue-50 p-4">

                  <p className="text-sm text-blue-600">
                    buy Requests
                  </p>

                  <h4 className="text-2xl font-bold text-blue-700">
                    {visibleSummary.buy}
                  </h4>

                </div>

                {/* sell */}

                <div className="rounded-xl bg-purple-50 p-4">

                  <p className="text-sm text-purple-600">
                    sell Requests
                  </p>

                  <h4 className="text-2xl font-bold text-purple-700">
                    {visibleSummary.sell}
                  </h4>

                </div>

              </div>

            </div>
                        {/* ===================================================== */}
            {/* SEARCH & FILTER SECTION */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg">

              <div className="grid gap-4 lg:grid-cols-3">

                {/* SEARCH USERNAME */}

                <div className="lg:col-span-2">

                  <label className="mb-2 block text-sm font-semibold text-gray-600">
                    Search Username / Network / Amount
                  </label>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search username, TRC20, buy, sell, amount..."
                    className="w-full rounded-xl border border-gray-300 p-4 outline-none transition focus:border-indigo-500"
                  />

                </div>

                {/* REFRESH BUTTON */}

                <div className="flex items-end">

                  <button
                    type="button"
                    onClick={refreshOrders}
                    className="w-full rounded-xl bg-indigo-600 py-4 font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Refresh Orders
                  </button>

                </div>

              </div>

              {/* ===================================================== */}
              {/* STATUS FILTER */}
              {/* ===================================================== */}

              <div className="mt-6">

                <label className="mb-3 block text-sm font-semibold text-gray-600">
                  Filter By Status
                </label>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">

                  {(["ALL", "Pending", "Approved", "Rejected"] as FilterStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusFilter(status)}
                        className={`rounded-xl p-3 font-semibold transition ${
                          statusFilter === status
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-300 bg-white text-gray-700 hover:border-indigo-400"
                        }`}
                      >
                        {status}
                      </button>
                    )
                  )}

                </div>

              </div>

              {/* ===================================================== */}
              {/* buy / sell FILTER */}
              {/* ===================================================== */}

              <div className="mt-6">

                <label className="mb-3 block text-sm font-semibold text-gray-600">
                  Filter By Order Type
                </label>

                <div className="grid grid-cols-3 gap-3">

                  {(["ALL", "buy", "sell"] as FilterType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTypeFilter(type)}
                      className={`rounded-xl p-3 font-semibold transition ${
                        typeFilter === type
                          ? "bg-purple-600 text-white"
                          : "border border-gray-300 bg-white text-gray-700 hover:border-purple-400"
                      }`}
                    >
                      {type}
                    </button>
                  ))}

                </div>

              </div>

              {/* ===================================================== */}
              {/* ACTIVE FILTER SUMMARY */}
              {/* ===================================================== */}

              <div className="mt-6 rounded-xl bg-slate-50 p-4">

                <div className="grid gap-4 md:grid-cols-4">

                  <div>
                    <p className="text-sm text-gray-500">Search</p>

                    <h4 className="font-bold text-indigo-700">
                      {search || "None"}
                    </h4>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Status</p>

                    <h4 className="font-bold text-yellow-600">
                      {statusFilter}
                    </h4>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Type</p>

                    <h4 className="font-bold text-purple-600">
                      {typeFilter}
                    </h4>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Results</p>

                    <h4 className="font-bold text-green-600">
                      {filteredOrders.length}
                    </h4>
                  </div>

                </div>

              </div>

            </div>

            {/* ===================================================== */}
            {/* RECEIPT PREVIEW MODAL */}
            {/* ===================================================== */}

            {selectedReceipt && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

                <div className="w-full max-w-3xl rounded-3xl bg-white p-5 shadow-2xl">

                  <div className="mb-4 flex items-center justify-between">

                    <h2 className="text-xl font-bold text-gray-800">
                      Payment Receipt Preview
                    </h2>

                    <button
                      type="button"
                      onClick={closeReceipt}
                      className="rounded-full bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
                    >
                      Close
                    </button>

                  </div>

                  <img
                    src={selectedReceipt}
                    alt="Usdt Receipt"
                    className="max-h-[70vh] w-full rounded-2xl object-contain"
                  />

                </div>

              </div>
            )}

            {/* ===================================================== */}
            {/* ORDERS TABLE STARTS IN PART 7 */}
            {/* ===================================================== */}

            {hasOrders && (
              <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-xl">
                                {/* ===================================================== */}
                {/* DESKTOP TABLE */}
                {/* ===================================================== */}

                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">

                    <thead className="bg-slate-800 text-white">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Network</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Usdt</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Pkr</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Receipt</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>

                    <tbody>

                      {filteredOrders.map((order, index) => (
                        <tr
                          key={order._id}
                          className={`border-b transition hover:bg-slate-50 ${
                            index % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }`}
                        >

                          {/* USER */}

                          <td className="px-4 py-4 align-top">
                            <p className="font-bold text-gray-700">
                              {order.username}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {formatDate(order.createdAt)}
                            </p>

                            <p className="text-xs text-gray-500">
                              {formatTime(order.createdAt)}
                            </p>
                          </td>

                          {/* buy / sell */}

                          <td className="px-4 py-4 align-top">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getTypeBadge(
                                order.type
                              )}`}
                            >
                              {order.type}
                            </span>
                          </td>

                          {/* NETWORK */}

                          <td className="px-4 py-4 align-top">
                            <span className="rounded-lg bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                              {order.network}
                            </span>
                          </td>

                          {/* Usdt */}

                          <td className="px-4 py-4 text-right align-top">
                            <p className="font-bold text-blue-700">
                              {formatUsdt(order.UsdtAmount)}
                            </p>

                            <p className="text-xs text-gray-500">
                              Usdt
                            </p>
                          </td>

                          {/* Pkr */}

                          <td className="px-4 py-4 text-right align-top">
                            <p className="font-bold text-green-700">
                              Rs. {formatPkr(order.PkrAmount)}
                            </p>
                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-4 align-top">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadge(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>

                            {order.processedBy && (
                              <p className="mt-2 text-xs text-gray-500">
                                By: {order.processedBy}
                              </p>
                            )}
                          </td>

                          {/* RECEIPT */}

                          <td className="px-4 py-4 align-top">

                            {order.receiptImage ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openReceipt(order.receiptImage)
                                }
                                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                              >
                                View Receipt
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">
                                No Receipt
                              </span>
                            )}

                          </td>

                          {/* ACTION BUTTONS */}

                          <td className="px-4 py-4 align-top">

                            <div className="flex flex-col gap-2">

                              <button
                                type="button"
                                disabled={
                                  order.status !== "Pending" ||
                                  isProcessing(order._id)
                                }
                                onClick={() =>
                                  approveOrder(order._id)
                                }
                                className={`rounded-lg py-2 text-xs font-bold transition ${
                                  order.status !== "Pending"
                                    ? "cursor-not-allowed bg-gray-200 text-gray-500"
                                    : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                              >
                                {isProcessing(order._id)
                                  ? "Processing..."
                                  : "Approve"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  order.status !== "Pending" ||
                                  isProcessing(order._id)
                                }
                                onClick={() =>
                                  rejectOrder(order._id)
                                }
                                className={`rounded-lg py-2 text-xs font-bold transition ${
                                  order.status !== "Pending"
                                    ? "cursor-not-allowed bg-gray-200 text-gray-500"
                                    : "bg-red-600 text-white hover:bg-red-700"
                                }`}
                              >
                                {isProcessing(order._id)
                                  ? "Processing..."
                                  : "Reject"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  copyWallet(order.WalletAddress)
                                }
                                className="rounded-lg bg-slate-700 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                              >
                                Copy Wallet
                              </button>

                            </div>

                          </td>

                        </tr>
                      ))}

                    </tbody>

                  </table>
                </div>

                {/* ===================================================== */}
                {/* MOBILE CARDS */}
                {/* ===================================================== */}

                <div className="border-t bg-slate-50 p-4 lg:hidden">

                  <h3 className="mb-4 text-lg font-bold text-gray-700">
                    Mobile Orders View
                  </h3>

                  <div className="space-y-4">

                    {filteredOrders.map((order) => (
                      <div
                        key={`mobile-${order._id}`}
                        className="rounded-2xl border bg-white p-4 shadow-sm"
                      >

                        <div className="mb-3 flex items-center justify-between">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getTypeBadge(
                              order.type
                            )}`}
                          >
                            {order.type}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadge(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>

                        </div>

                        <h4 className="font-bold text-gray-700">
                          {order.username}
                        </h4>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3">

                          <div className="rounded-lg bg-blue-50 p-3">
                            <p className="text-xs text-blue-600">
                              Usdt
                            </p>

                            <p className="font-bold text-blue-700">
                              {formatUsdt(order.UsdtAmount)}
                            </p>
                          </div>

                          <div className="rounded-lg bg-green-50 p-3">
                            <p className="text-xs text-green-600">
                              Pkr
                            </p>

                            <p className="font-bold text-green-700">
                              Rs. {formatPkr(order.PkrAmount)}
                            </p>
                          </div>

                        </div>

                        <div className="mt-3 rounded-lg bg-orange-50 p-3">

                          <p className="text-xs text-orange-600">
                            Network
                          </p>

                          <p className="font-bold text-orange-700">
                            {order.network}
                          </p>

                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">

                          {order.receiptImage && (
                            <button
                              type="button"
                              onClick={() =>
                                openReceipt(order.receiptImage)
                              }
                              className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                            >
                              View Receipt
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              copyWallet(order.WalletAddress)
                            }
                            className="rounded-lg bg-slate-700 px-3 py-2 text-xs font-semibold text-white"
                          >
                            Copy Wallet
                          </button>

                        </div>

                        {order.status === "Pending" && (
                          <div className="mt-4 grid grid-cols-2 gap-2">

                            <button
                              type="button"
                              disabled={isProcessing(order._id)}
                              onClick={() =>
                                approveOrder(order._id)
                              }
                              className="rounded-lg bg-green-600 py-2 text-sm font-bold text-white"
                            >
                              {isProcessing(order._id)
                                ? "..."
                                : "Approve"}
                            </button>

                            <button
                              type="button"
                              disabled={isProcessing(order._id)}
                              onClick={() =>
                                rejectOrder(order._id)
                              }
                              className="rounded-lg bg-red-600 py-2 text-sm font-bold text-white"
                            >
                              {isProcessing(order._id)
                                ? "..."
                                : "Reject"}
                            </button>

                          </div>
                        )}

                      </div>
                    ))}

                  </div>

                </div>
                                {/* ===================================================== */}
                {/* TABLE FOOTER SUMMARY */}
                {/* ===================================================== */}

                <div className="border-t bg-slate-100 px-6 py-4">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>
                      <p className="text-sm text-gray-500">
                        Showing Orders
                      </p>

                      <h3 className="text-lg font-bold text-gray-700">
                        {visibleSummary.total} Order(s)
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm">

                      <div className="rounded-xl bg-blue-100 px-4 py-2">
                        <span className="font-semibold text-blue-700">
                          buy:
                        </span>{" "}
                        {visibleSummary.buy}
                      </div>

                      <div className="rounded-xl bg-purple-100 px-4 py-2">
                        <span className="font-semibold text-purple-700">
                          sell:
                        </span>{" "}
                        {visibleSummary.sell}
                      </div>

                      <div className="rounded-xl bg-green-100 px-4 py-2">
                        <span className="font-semibold text-green-700">
                          Approved:
                        </span>{" "}
                        {visibleSummary.approved}
                      </div>

                      <div className="rounded-xl bg-yellow-100 px-4 py-2">
                        <span className="font-semibold text-yellow-700">
                          Pending:
                        </span>{" "}
                        {visibleSummary.pending}
                      </div>

                      <div className="rounded-xl bg-red-100 px-4 py-2">
                        <span className="font-semibold text-red-700">
                          Rejected:
                        </span>{" "}
                        {visibleSummary.rejected}
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* ===================================================== */}
            {/* EMPTY STATE */}
            {/* ===================================================== */}

            {!hasOrders && (
              <div className="mt-6 rounded-3xl bg-white p-12 text-center shadow-lg">

                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100">
                  <span className="text-5xl">📋</span>
                </div>

                <h2 className="mt-6 text-2xl font-bold text-gray-700">
                  No Usdt Orders Found
                </h2>

                <p className="mt-3 text-gray-500">
                  buy and sell requests submitted by users will appear here.
                </p>

                <button
                  type="button"
                  onClick={refreshOrders}
                  className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
                >
                  Refresh Orders
                </button>

              </div>
            )}

            {/* ===================================================== */}
            {/* ADMIN INFORMATION */}
            {/* ===================================================== */}

            <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5">

              <h3 className="mb-3 text-lg font-bold text-blue-700">
                Admin Usdt Order Management
              </h3>

              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Approve buy requests after verifying payment receipt.</li>
                <li>• Approve sell requests after verifying Wallet transfer.</li>
                <li>• Rejected orders remain visible for audit history.</li>
                <li>• Every approval updates Wallet Balance automatically.</li>
                <li>• Pkr and Usdt Wallet history is created automatically.</li>
              </ul>

            </div>

            {/* ===================================================== */}
            {/* SECURITY NOTICE */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">

              <h3 className="mb-2 text-lg font-bold text-green-700">
                GoldTrade V18 Secure Admin Panel
              </h3>

              <p className="text-sm leading-6 text-gray-700">
                Every admin approval or rejection is securely logged inside
                GoldTrade V18. Wallet balances, transaction history and order
                status are synchronized automatically after each action.
              </p>

            </div>

            {/* ===================================================== */}
            {/* FOOTER */}
            {/* ===================================================== */}

            <div className="mt-10 border-t pt-6 text-center">

              <h4 className="text-lg font-bold text-slate-700">
                GoldTrade V18 Admin Dashboard
              </h4>

              <p className="mt-2 text-sm text-gray-500">
                Pkr • Usdt • Gold • Wallet Management
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Secure • Fast • Professional Digital Trading Platform
              </p>

            </div>

          </>
        )}

      </div>
    </div>
  );
}