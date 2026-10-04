"use client";
// ======================================================
// GoldTrade V18 Enterprise
// ADMIN WITHDRAW MANAGER
// frontend/app/admin/withdraw/page.tsx
// ======================================================
import { useCallback, useEffect, useMemo, useState, } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Search, Wallet, CheckCircle, XCircle, Clock, Trash2, Eye, Copy, AlertTriangle, X, Ban, CheckSquare, Square, ChevronDown, } from "lucide-react";
// ======================================================
// API
// ======================================================
const API = process.env.NEXT_PUBLIC_API_URL ||
    "https://goldtrade-2.onrender.com";
// ======================================================
// TYPES
// ======================================================
type WalletType = "PKR" | "USDT" | "GOLD";
type WithdrawStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "PROCESSING" | string;
interface WalletSnapshot {
    pkrBalance?: number;
    usdtBalance?: number;
    goldBalance?: number;
    lockedPkr?: number;
    lockedUsdt?: number;
    lockedGold?: number;
}
interface WithdrawRequest {
    _id: string;
    userId?: string;
    username?: string;
    fullName?: string;
    email?: string;
    walletType?: WalletType | string;
    amount?: number;
    requestAmount?: number;
    adminAmount?: number;
    currency?: string;
    paymentMethod?: string;
    receiverName?: string;
    receiverAccount?: string;
    receiverWalletAddress?: string;
    accountName?: string;
    accountNumber?: string;
    walletAddress?: string;
    bankName?: string;
    iban?: string;
    network?: string;
    transactionId?: string;
    referenceId?: string;
    note?: string;
    rejectReason?: string;
    rejectionReason?: string;
    status?: WithdrawStatus;
    walletBefore?: WalletSnapshot;
    walletAfter?: WalletSnapshot;
    approvedBy?: string;
    approvedByUsername?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedByUsername?: string;
    rejectedAt?: string;
    cancelledAt?: string;
    createdAt?: string;
    updatedAt?: string;
}
interface WithdrawResponse {
    success: boolean;
    message?: string;
    withdrawals?: WithdrawRequest[];
    withdrawal?: WithdrawRequest;
    count?: number;
}
interface StatsResponse {
    success: boolean;
    message?: string;
    stats?: {
        total?: number;
        pending?: number;
        approved?: number;
        rejected?: number;
        cancelled?: number;
        pendingAmount?: number;
        approvedAmount?: number;
        rejectedAmount?: number;
        cancelledAmount?: number;
    };
}
// ======================================================
// HELPERS
// ======================================================
const normalizeStatus = (status?: string): string => {
    return String(status || "")
        .trim()
        .toUpperCase();
};
const normalizeWalletType = (wallet?: string): string => {
    return String(wallet || "PKR")
        .trim()
        .toUpperCase();
};
const getWithdrawAmount = (withdraw: WithdrawRequest): number => {
    const amount = withdraw.adminAmount ??
        withdraw.requestAmount ??
        withdraw.amount ??
        0;
    const number = Number(amount);
    return Number.isFinite(number)
        ? number
        : 0;
};
const formatAmount = (amount: number, walletType?: string): string => {
    const type = normalizeWalletType(walletType);
    if (type === "USDT") {
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
        });
    }
    if (type === "GOLD") {
        return amount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
        });
    }
    return amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};
const formatDate = (value?: string): string => {
    if (!value) {
        return "-";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }
    return date.toLocaleString();
};
const getWalletBadgeClass = (wallet?: string): string => {
    const type = normalizeWalletType(wallet);
    if (type === "USDT") {
        return "border border-green-500/30 bg-green-500/10 text-green-400";
    }
    if (type === "GOLD") {
        return "border border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
    }
    return "border border-blue-500/30 bg-blue-500/10 text-blue-400";
};
const getStatusClass = (status?: string): string => {
    const normalized = normalizeStatus(status);
    if (normalized === "APPROVED") {
        return "border border-green-500/30 bg-green-500/10 text-green-400";
    }
    if (normalized === "REJECTED") {
        return "border border-red-500/30 bg-red-500/10 text-red-400";
    }
    if (normalized === "CANCELLED") {
        return "border border-gray-500/30 bg-gray-500/10 text-gray-400";
    }
    if (normalized === "PROCESSING") {
        return "border border-blue-500/30 bg-blue-500/10 text-blue-400";
    }
    return "border border-yellow-500/30 bg-yellow-500/10 text-yellow-400";
};
// ======================================================
// PAGE
// ======================================================
export default function AdminWithdrawPage() {
    // ====================================================
    // STATE
    // ====================================================
    const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState<"success" | "error" | "">("");
    const [searchHistory, setSearchHistory] = useState("");
    const [historyFilter, setHistoryFilter] = useState("ALL");
    const [walletFilter, setWalletFilter] = useState("ALL");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [processingBulk, setProcessingBulk] = useState(false);
    const [selectedWithdraw, setSelectedWithdraw] = useState<WithdrawRequest | null>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<WithdrawRequest | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<WithdrawRequest | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [stats, setStats] = useState<StatsResponse["stats"]>({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        pendingAmount: 0,
        approvedAmount: 0,
        rejectedAmount: 0,
        cancelledAmount: 0,
    });
    // ====================================================
    // SESSION
    // ====================================================
    const getToken = useCallback(() => {
        if (typeof window ===
            "undefined") {
            return "";
        }
        return (localStorage.getItem("token") ||
            "");
    }, []);
    // ====================================================
    // LOGOUT
    // ====================================================
    const logout = useCallback(() => {
        if (typeof window !==
            "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }
        window.location.href =
            "/login";
    }, []);
    // ====================================================
    // AUTH HEADERS
    // ====================================================
    const getHeaders = useCallback(() => {
        const token = getToken();
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        };
    }, [getToken]);
        // LOAD ALL WITHDRAW REQUESTS
    // GET /api/gold/admin/withdraws/admin/all
    // ====================================================
    const loadWithdraws = useCallback(async () => {
        try {
            setLoading(true);
            setMessage("");
            setMessageType("");

            const token = getToken();

            if (!token) {
                logout();
                return;
            }

            const response = await fetch(
                `${API}/api/gold/admin/withdraws/admin/all`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    cache: "no-store",
                }
            );

            let result: WithdrawResponse = {
                success: false,
            };

            try {
                result = await response.json();
            } catch (jsonError) {
                console.error(
                    "WITHDRAW JSON ERROR:",
                    jsonError
                );
            }

            console.log(
                "WITHDRAW RESPONSE:",
                result
            );

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                logout();
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Unable to load withdraw requests."
                );
            }

            setWithdraws(
                Array.isArray(result.withdrawals)
                    ? result.withdrawals
                    : []
            );

            setSelectedIds([]);
            setMessage("");
            setMessageType("");
        } catch (error) {
            console.error(
                "LOAD WITHDRAWS ERROR:",
                error
            );

            setWithdraws([]);

            setMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to load withdraw requests."
            );

            setMessageType("error");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getToken, logout]);

    // ====================================================
    // LOAD WITHDRAW STATISTICS
    // GET /api/gold/admin/withdraws/admin/stats
    // ====================================================

    const loadStatistics = useCallback(async () => {
        try {
            const token = getToken();

            if (!token) {
                return;
            }

            const response = await fetch(
                `${API}/api/gold/admin/withdraws/admin/stats`,
                {
                    method: "GET",
                    headers: getHeaders(),
                    cache: "no-store",
                }
            );

            let result: StatsResponse = {
                success: false,
            };

            try {
                result = await response.json();
            } catch (jsonError) {
                console.error(
                    "WITHDRAW STATS JSON ERROR:",
                    jsonError
                );
            }

            console.log(
                "WITHDRAW STATS:",
                result
            );

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                logout();
                return;
            }

            if (
                response.ok &&
                result.success &&
                result.stats
            ) {
                setStats({
                    total:
                        result.stats.total ?? 0,

                    pending:
                        result.stats.pending ?? 0,

                    approved:
                        result.stats.approved ?? 0,

                    rejected:
                        result.stats.rejected ?? 0,

                    cancelled:
                        result.stats.cancelled ?? 0,

                    pendingAmount:
                        result.stats.pendingAmount ?? 0,

                    approvedAmount:
                        result.stats.approvedAmount ?? 0,

                    rejectedAmount:
                        result.stats.rejectedAmount ?? 0,

                    cancelledAmount:
                        result.stats.cancelledAmount ?? 0,
                });
            }
        } catch (error) {
            console.error(
                "LOAD WITHDRAW STATS ERROR:",
                error
            );
        }
    }, [
        getHeaders,
        getToken,
        logout,
    ]);

    // ====================================================
    // REFRESH ALL
    // ====================================================

    const refreshWithdraws = useCallback(async () => {
        setRefreshing(true);

        await Promise.all([
            loadWithdraws(),
            loadStatistics(),
        ]);
    }, [
        loadWithdraws,
        loadStatistics,
    ]);

    // ====================================================
    // INITIAL LOAD
    // ====================================================

    useEffect(() => {
        const loadInitialData = async () => {
            await Promise.all([
                loadWithdraws(),
                loadStatistics(),
            ]);
        };

        loadInitialData();
    }, [
        loadWithdraws,
        loadStatistics,
    ]);

        // FILTERED WITHDRAWALS
    // ====================================================

    const filteredWithdraws = useMemo(() => {
        const query = searchHistory
            .trim()
            .toLowerCase();

        return withdraws.filter((withdraw) => {
            const status = normalizeStatus(
                withdraw.status
            );

            const wallet = normalizeWalletType(
                withdraw.walletType
            );

            const username = String(
                withdraw.username || ""
            ).toLowerCase();

            const email = String(
                withdraw.email || ""
            ).toLowerCase();

            const account = String(
                withdraw.accountNumber ||
                withdraw.receiverAccount ||
                ""
            ).toLowerCase();

            const reference = String(
                withdraw.referenceId || ""
            ).toLowerCase();

            const searchMatch =
                !query ||
                username.includes(query) ||
                email.includes(query) ||
                account.includes(query) ||
                reference.includes(query);

            const statusMatch =
                historyFilter === "ALL" ||
                status === historyFilter;

            const walletMatch =
                walletFilter === "ALL" ||
                wallet === walletFilter;

            return (
                searchMatch &&
                statusMatch &&
                walletMatch
            );
        });
    }, [
        withdraws,
        searchHistory,
        historyFilter,
        walletFilter,
    ]);

    // ====================================================
    // PENDING WITHDRAWALS
    // ====================================================

    const pendingWithdraws = useMemo(
        () =>
            withdraws.filter(
                (withdraw) =>
                    normalizeStatus(
                        withdraw.status
                    ) === "PENDING"
            ),
        [withdraws]
    );

    // ====================================================
    // SELECTED PENDING
    // ====================================================

    const selectedPendingIds = useMemo(() => {
        return selectedIds.filter((id) =>
            pendingWithdraws.some(
                (withdraw) =>
                    withdraw._id === id
            )
        );
    }, [
        selectedIds,
        pendingWithdraws,
    ]);

    // ====================================================
    // TOTAL FILTERED
    // ====================================================

    const filteredAmount = useMemo(() => {
        return filteredWithdraws.reduce(
            (total, withdraw) =>
                total +
                getWithdrawAmount(withdraw),
            0
        );
    }, [filteredWithdraws]);

    // ====================================================
    // SELECT / UNSELECT
    // ====================================================

    const toggleSelection = useCallback(
        (id: string) => {
            setSelectedIds((current) =>
                current.includes(id)
                    ? current.filter(
                        (item) =>
                            item !== id
                    )
                    : [
                        ...current,
                        id,
                    ]
            );
        },
        []
    );

    // ====================================================
    // SELECT ALL FILTERED PENDING
    // ====================================================

    const toggleSelectAll = useCallback(() => {
        const filteredPendingIds =
            filteredWithdraws
                .filter(
                    (withdraw) =>
                        normalizeStatus(
                            withdraw.status
                        ) === "PENDING"
                )
                .map(
                    (withdraw) =>
                        withdraw._id
                );

        if (
            filteredPendingIds.length === 0
        ) {
            return;
        }

        const allSelected =
            filteredPendingIds.every(
                (id) =>
                    selectedIds.includes(id)
            );

        if (allSelected) {
            setSelectedIds((current) =>
                current.filter(
                    (id) =>
                        !filteredPendingIds.includes(
                            id
                        )
                )
            );
        } else {
            setSelectedIds((current) => [
                ...new Set([
                    ...current,
                    ...filteredPendingIds,
                ]),
            ]);
        }
    }, [
        filteredWithdraws,
        selectedIds,
    ]);

        // APPROVE SINGLE WITHDRAWAL
    // POST /admin/:withdrawId/approve
    // ====================================================

    const approveWithdrawal = useCallback(
        async (withdraw: WithdrawRequest) => {
            try {
                setProcessingId(
                    withdraw._id
                );

                setMessage("");
                setMessageType("");

                const token = getToken();

                if (!token) {
                    logout();
                    return;
                }

                const response = await fetch(
                    `${API}/api/gold/admin/withdraws/admin/${withdraw._id}/approve`,
                    {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify({}),
                    }
                );

                const result =
                    await response.json();

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    logout();
                    return;
                }

                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.message ||
                        "Unable to approve withdrawal."
                    );
                }

                setMessage(
                    "Withdrawal approved successfully."
                );

                setMessageType("success");

                setSelectedIds((current) =>
                    current.filter(
                        (id) =>
                            id !== withdraw._id
                    )
                );

                await Promise.all([
                    loadWithdraws(),
                    loadStatistics(),
                ]);
            } catch (error) {
                console.error(
                    "APPROVE WITHDRAW ERROR:",
                    error
                );

                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to approve withdrawal."
                );

                setMessageType("error");
            } finally {
                setProcessingId(null);
            }
        },
        [
            getHeaders,
            getToken,
            loadStatistics,
            loadWithdraws,
            logout,
        ]
    );

    // ====================================================
    // OPEN REJECT MODAL
    // ====================================================

    const openRejectModal = useCallback(
        (withdraw: WithdrawRequest) => {
            setRejectTarget(withdraw);
            setRejectReason("");
            setShowRejectModal(true);
        },
        []
    );

    // ====================================================
    // REJECT SINGLE WITHDRAWAL
    // POST /admin/:withdrawId/reject
    // ====================================================

    const rejectWithdrawal = useCallback(
        async () => {
            if (!rejectTarget) {
                return;
            }

            try {
                setProcessingId(
                    rejectTarget._id
                );

                const reason =
                    rejectReason.trim() ||
                    "Rejected by admin.";

                const token = getToken();

                if (!token) {
                    logout();
                    return;
                }

                const response = await fetch(
                    `${API}/api/gold/admin/withdraws/admin/${rejectTarget._id}/reject`,
                    {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify({
                            reason,
                        }),
                    }
                );

                const result =
                    await response.json();

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    logout();
                    return;
                }

                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.message ||
                        "Unable to reject withdrawal."
                    );
                }

                setShowRejectModal(false);
                setRejectTarget(null);
                setRejectReason("");

                setMessage(
                    "Withdrawal rejected successfully."
                );

                setMessageType("success");

                setSelectedIds((current) =>
                    current.filter(
                        (id) =>
                            id !==
                            rejectTarget._id
                    )
                );

                await Promise.all([
                    loadWithdraws(),
                    loadStatistics(),
                ]);
            } catch (error) {
                console.error(
                    "REJECT WITHDRAW ERROR:",
                    error
                );

                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to reject withdrawal."
                );

                setMessageType("error");
            } finally {
                setProcessingId(null);
            }
        },
        [
            getHeaders,
            getToken,
            loadStatistics,
            loadWithdraws,
            logout,
            rejectReason,
            rejectTarget,
        ]
    );

    // ====================================================
    // OPEN DELETE MODAL
    // ====================================================

    const openDeleteModal = useCallback(
        (withdraw: WithdrawRequest) => {
            setDeleteTarget(withdraw);
            setShowDeleteModal(true);
        },
        []
    );

        // DELETE /admin/:withdrawId
    // ====================================================

    const deleteWithdrawal = useCallback(
        async () => {
            if (!deleteTarget) {
                return;
            }

            try {
                setProcessingId(
                    deleteTarget._id
                );

                const token = getToken();

                if (!token) {
                    logout();
                    return;
                }

                const response = await fetch(
                    `${API}/api/gold/admin/withdraws/admin/${deleteTarget._id}`,
                    {
                        method: "DELETE",
                        headers: getHeaders(),
                    }
                );

                const result =
                    await response.json();

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    logout();
                    return;
                }

                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.message ||
                        "Unable to delete withdrawal."
                    );
                }

                setShowDeleteModal(false);
                setDeleteTarget(null);

                setMessage(
                    "Withdrawal deleted successfully."
                );

                setMessageType("success");

                setSelectedIds((current) =>
                    current.filter(
                        (id) =>
                            id !==
                            deleteTarget._id
                    )
                );

                await Promise.all([
                    loadWithdraws(),
                    loadStatistics(),
                ]);
            } catch (error) {
                console.error(
                    "DELETE WITHDRAW ERROR:",
                    error
                );

                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to delete withdrawal."
                );

                setMessageType("error");
            } finally {
                setProcessingId(null);
            }
        },
        [
            deleteTarget,
            getHeaders,
            getToken,
            loadStatistics,
            loadWithdraws,
            logout,
        ]
    );

    // ====================================================
    // BULK APPROVE
    // POST /admin/bulk-approve
    // ====================================================

    const bulkApprove = useCallback(
        async () => {
            if (
                selectedPendingIds.length ===
                0
            ) {
                setMessage(
                    "Please select at least one pending withdrawal."
                );

                setMessageType("error");

                return;
            }

            try {
                setProcessingBulk(true);

                const token = getToken();

                if (!token) {
                    logout();
                    return;
                }

                const response = await fetch(
                    `${API}/api/gold/admin/withdraws/admin/bulk-approve`,
                    {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify({
                            withdrawalIds:
                                selectedPendingIds,
                        }),
                    }
                );

                const result =
                    await response.json();

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    logout();
                    return;
                }

                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.message ||
                        "Unable to bulk approve withdrawals."
                    );
                }

                setMessage(
                    result.message ||
                    "Bulk withdrawal approval completed."
                );

                setMessageType("success");
                setSelectedIds([]);

                await Promise.all([
                    loadWithdraws(),
                    loadStatistics(),
                ]);
            } catch (error) {
                console.error(
                    "BULK APPROVE WITHDRAW ERROR:",
                    error
                );

                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to bulk approve withdrawals."
                );

                setMessageType("error");
            } finally {
                setProcessingBulk(false);
            }
        },
        [
            getHeaders,
            getToken,
            loadStatistics,
            loadWithdraws,
            logout,
            selectedPendingIds,
        ]
    );

        // POST /admin/bulk-reject
    // ====================================================

    const bulkReject = useCallback(
        async () => {
            if (
                selectedPendingIds.length ===
                0
            ) {
                setMessage(
                    "Please select at least one pending withdrawal."
                );

                setMessageType("error");

                return;
            }

            const reason = window.prompt(
                "Enter rejection reason:",
                "Bulk withdrawal rejection."
            );

            if (reason === null) {
                return;
            }

            try {
                setProcessingBulk(true);

                const token = getToken();

                if (!token) {
                    logout();
                    return;
                }

                const response = await fetch(
                    `${API}/api/gold/admin/withdraws/admin/bulk-reject`,
                    {
                        method: "POST",
                        headers: getHeaders(),
                        body: JSON.stringify({
                            withdrawalIds:
                                selectedPendingIds,
                            reason:
                                reason.trim() ||
                                "Bulk withdrawal rejection.",
                        }),
                    }
                );

                const result =
                    await response.json();

                if (
                    response.status === 401 ||
                    response.status === 403
                ) {
                    logout();
                    return;
                }

                if (
                    !response.ok ||
                    !result.success
                ) {
                    throw new Error(
                        result.message ||
                        "Unable to bulk reject withdrawals."
                    );
                }

                setMessage(
                    result.message ||
                    "Bulk withdrawal rejection completed."
                );

                setMessageType("success");
                setSelectedIds([]);

                await Promise.all([
                    loadWithdraws(),
                    loadStatistics(),
                ]);
            } catch (error) {
                console.error(
                    "BULK REJECT WITHDRAW ERROR:",
                    error
                );

                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Unable to bulk reject withdrawals."
                );

                setMessageType("error");
            } finally {
                setProcessingBulk(false);
            }
        },
        [
            getHeaders,
            getToken,
            loadStatistics,
            loadWithdraws,
            logout,
            selectedPendingIds,
        ]
    );

    // ====================================================
    // COPY TEXT
    // ====================================================

    const copyText = useCallback(
        async (value: string) => {
            try {
                await navigator.clipboard.writeText(
                    value
                );

                setMessage(
                    "Copied successfully."
                );

                setMessageType("success");

                window.setTimeout(() => {
                    setMessage("");
                    setMessageType("");
                }, 1500);
            } catch (error) {
                console.error(
                    "COPY ERROR:",
                    error
                );
            }
        },
        []
    );

    // ====================================================
    // OPEN DETAILS
    // ====================================================

    const openDetails = useCallback(
        (withdraw: WithdrawRequest) => {
            setSelectedWithdraw(withdraw);
            setShowDetails(true);
        },
        []
    );

    // ====================================================
    // HEADER SELECTION STATE
    // ====================================================

    const allFilteredPendingSelected =
        useMemo(() => {
            const ids =
                filteredWithdraws
                    .filter(
                        (withdraw) =>
                            normalizeStatus(
                                withdraw.status
                            ) === "PENDING"
                    )
                    .map(
                        (withdraw) =>
                            withdraw._id
                    );

            return (
                ids.length > 0 &&
                ids.every((id) =>
                    selectedIds.includes(id)
                )
            );
        }, [
            filteredWithdraws,
            selectedIds,
        ]);

    // ====================================================
    // LOADING SCREEN
    // IMPORTANT: AFTER ALL HOOKS
    // ====================================================

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="flex items-center gap-3 text-yellow-400">
                    <RefreshCw
                        size={26}
                        className="animate-spin"
                    />

                    <span className="font-semibold">
                        Loading Withdraw Requests...
                    </span>
                </div>
            </main>
        );
    }

        // PAGE UI
    // ====================================================

    return (
        <main className="min-h-screen bg-black text-white">

            <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                    <div>

                        <div className="mb-2 flex items-center gap-3">

                            <Wallet
                                size={32}
                                className="text-yellow-400"
                            />

                            <h1 className="text-3xl font-black text-yellow-400 sm:text-4xl">
                                Withdraw Manager
                            </h1>

                        </div>

                        <p className="text-sm text-zinc-400 sm:text-base">
                            Manage user withdrawal requests,
                            approvals and rejections.
                        </p>

                    </div>

                    <div className="flex flex-wrap gap-3">

                        <Link
                            href="/admin/dashboard"
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-zinc-800"
                        >
                            <ArrowLeft size={17} />
                            Dashboard
                        </Link>

                        <button
                            type="button"
                            onClick={refreshWithdraws}
                            disabled={refreshing}
                            className="inline-flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-400 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />

                            Refresh
                        </button>

                    </div>

                </header>

                {/* ==================================================
                    MESSAGE
                ================================================== */}

                {message && (
                    <div
                        className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                            messageType === "success"
                                ? "border-green-500/30 bg-green-500/10 text-green-400"
                                : "border-red-500/30 bg-red-500/10 text-red-400"
                        }`}
                    >

                        {messageType === "success" ? (
                            <CheckCircle
                                size={20}
                                className="mt-0.5 shrink-0"
                            />
                        ) : (
                            <AlertTriangle
                                size={20}
                                className="mt-0.5 shrink-0"
                            />
                        )}

                        <span className="text-sm font-medium">
                            {message}
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                setMessage("");
                                setMessageType("");
                            }}
                            className="ml-auto"
                        >
                            <X size={18} />
                        </button>

                    </div>
                )}

                {/* ==================================================
                    STATISTICS
                ================================================== */}

                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">

                        <div className="mb-3 flex items-center justify-between">

                            <span className="text-sm text-zinc-400">
                                Total
                            </span>

                            <Wallet
                                size={20}
                                className="text-blue-400"
                            />

                        </div>

                        <div className="text-3xl font-black">
                            {stats?.total ?? 0}
                        </div>

                    </div>

                    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5">

                        <div className="mb-3 flex items-center justify-between">

                            <span className="text-sm text-zinc-400">
                                Pending
                            </span>

                            <Clock
                                size={20}
                                className="text-yellow-400"
                            />

                        </div>

                        <div className="text-3xl font-black text-yellow-400">
                            {stats?.pending ?? 0}
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                            {formatAmount(
                                Number(
                                    stats?.pendingAmount ?? 0
                                )
                            )}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">

                        <div className="mb-3 flex items-center justify-between">

                            <span className="text-sm text-zinc-400">
                                Approved
                            </span>

                            <CheckCircle
                                size={20}
                                className="text-green-400"
                            />

                        </div>

                        <div className="text-3xl font-black text-green-400">
                            {stats?.approved ?? 0}
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                            {formatAmount(
                                Number(
                                    stats?.approvedAmount ?? 0
                                )
                            )}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">

                        <div className="mb-3 flex items-center justify-between">

                            <span className="text-sm text-zinc-400">
                                Rejected
                            </span>

                            <XCircle
                                size={20}
                                className="text-red-400"
                            />

                        </div>

                        <div className="text-3xl font-black text-red-400">
                            {stats?.rejected ?? 0}
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                            {formatAmount(
                                Number(
                                    stats?.rejectedAmount ?? 0
                                )
                            )}
                        </p>

                    </div>

                    <div className="rounded-2xl border border-zinc-700 bg-zinc-950 p-5">

                        <div className="mb-3 flex items-center justify-between">

                            <span className="text-sm text-zinc-400">
                                Cancelled
                            </span>

                            <Ban
                                size={20}
                                className="text-zinc-400"
                            />

                        </div>

                        <div className="text-3xl font-black text-zinc-300">
                            {stats?.cancelled ?? 0}
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                            {formatAmount(
                                Number(
                                    stats?.cancelledAmount ?? 0
                                )
                            )}
                        </p>

                    </div>

                </section>

                                <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:p-5">

                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center">

                        <div className="relative flex-1">

                            <Search
                                size={19}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                            />

                            <input
                                type="text"
                                value={searchHistory}
                                onChange={(event) =>
                                    setSearchHistory(
                                        event.target.value
                                    )
                                }
                                placeholder="Search username, email, account or reference..."
                                className="w-full rounded-xl border border-zinc-700 bg-black py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-500/60"
                            />

                        </div>

                        <div className="relative min-w-[170px]">

                            <select
                                value={historyFilter}
                                onChange={(event) =>
                                    setHistoryFilter(
                                        event.target.value
                                    )
                                }
                                className="w-full appearance-none rounded-xl border border-zinc-700 bg-black px-4 py-3 pr-10 text-sm text-white outline-none focus:border-yellow-500/60"
                            >
                                <option value="ALL">
                                    All Status
                                </option>

                                <option value="PENDING">
                                    Pending
                                </option>

                                <option value="APPROVED">
                                    Approved
                                </option>

                                <option value="REJECTED">
                                    Rejected
                                </option>

                                <option value="CANCELLED">
                                    Cancelled
                                </option>
                            </select>

                            <ChevronDown
                                size={17}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                            />

                        </div>

                        <div className="relative min-w-[150px]">

                            <select
                                value={walletFilter}
                                onChange={(event) =>
                                    setWalletFilter(
                                        event.target.value
                                    )
                                }
                                className="w-full appearance-none rounded-xl border border-zinc-700 bg-black px-4 py-3 pr-10 text-sm text-white outline-none focus:border-yellow-500/60"
                            >
                                <option value="ALL">
                                    All Wallets
                                </option>

                                <option value="PKR">
                                    PKR
                                </option>

                                <option value="USDT">
                                    USDT
                                </option>

                                <option value="GOLD">
                                    GOLD
                                </option>
                            </select>

                            <ChevronDown
                                size={17}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                            />

                        </div>

                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">

                        <span>
                            Showing{" "}
                            <strong className="text-white">
                                {filteredWithdraws.length}
                            </strong>{" "}
                            requests
                        </span>

                        <span>
                            Filtered Amount:{" "}
                            <strong className="text-yellow-400">
                                {formatAmount(
                                    filteredAmount
                                )}
                            </strong>
                        </span>

                    </div>

                </section>

                {/* ==================================================
                    BULK ACTION BAR
                ================================================== */}

                <section className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-4">

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex items-center gap-3">

                            <button
                                type="button"
                                onClick={toggleSelectAll}
                                disabled={
                                    filteredWithdraws.filter(
                                        (withdraw) =>
                                            normalizeStatus(
                                                withdraw.status
                                            ) === "PENDING"
                                    ).length === 0
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {allFilteredPendingSelected ? (
                                    <CheckSquare
                                        size={18}
                                        className="text-yellow-400"
                                    />
                                ) : (
                                    <Square
                                        size={18}
                                        className="text-zinc-500"
                                    />
                                )}

                                Select Pending
                            </button>

                            <span className="text-sm text-zinc-400">
                                Selected:{" "}
                                <strong className="text-white">
                                    {selectedPendingIds.length}
                                </strong>
                            </span>

                        </div>

                        <div className="flex flex-wrap gap-3">

                            <button
                                type="button"
                                onClick={bulkApprove}
                                disabled={
                                    processingBulk ||
                                    selectedPendingIds.length === 0
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {processingBulk ? (
                                    <RefreshCw
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <CheckCircle size={17} />
                                )}

                                Bulk Approve
                            </button>

                            <button
                                type="button"
                                onClick={bulkReject}
                                disabled={
                                    processingBulk ||
                                    selectedPendingIds.length === 0
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                {processingBulk ? (
                                    <RefreshCw
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <XCircle size={17} />
                                )}

                                Bulk Reject
                            </button>

                        </div>

                    </div>

                </section>

                                <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1250px] text-left">

                            <thead className="border-b border-zinc-800 bg-zinc-900/80">

                                <tr>

                                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Select
                                    </th>

                                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        User
                                    </th>

                                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Wallet
                                    </th>

                                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Amount
                                    </th>

                                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Payment
                                    </th>

                                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Destination
                                    </th>

                                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Status
                                    </th>

                                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Date
                                    </th>

                                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-zinc-500">
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-zinc-900">

                                {filteredWithdraws.length === 0 ? (
                                    <tr>

                                        <td
                                            colSpan={9}
                                            className="px-6 py-16 text-center"
                                        >
                                            <div className="flex flex-col items-center gap-3 text-zinc-500">

                                                <Wallet size={42} />

                                                <p className="text-sm">
                                                    No withdrawal requests found.
                                                </p>

                                            </div>
                                        </td>

                                    </tr>
                                ) : (
                                    filteredWithdraws.map(
                                        (withdraw) => {
                                            const status =
                                                normalizeStatus(
                                                    withdraw.status
                                                );

                                            const walletType =
                                                normalizeWalletType(
                                                    withdraw.walletType
                                                );

                                            const amount =
                                                getWithdrawAmount(
                                                    withdraw
                                                );

                                            const isPending =
                                                status ===
                                                "PENDING";

                                            const isProcessing =
                                                processingId ===
                                                withdraw._id;

                                            const destination =
                                                withdraw.walletAddress ||
                                                withdraw.receiverWalletAddress ||
                                                withdraw.accountNumber ||
                                                withdraw.receiverAccount ||
                                                withdraw.iban ||
                                                "-";

                                            return (
                                                <tr
                                                    key={withdraw._id}
                                                    className="transition hover:bg-zinc-900/50"
                                                >

                                                    <td className="px-4 py-4">

                                                        {isPending ? (
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleSelection(
                                                                        withdraw._id
                                                                    )
                                                                }
                                                                className="text-zinc-400 hover:text-yellow-400"
                                                            >
                                                                {selectedIds.includes(
                                                                    withdraw._id
                                                                ) ? (
                                                                    <CheckSquare
                                                                        size={19}
                                                                        className="text-yellow-400"
                                                                    />
                                                                ) : (
                                                                    <Square
                                                                        size={19}
                                                                    />
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <span className="text-zinc-700">
                                                                —
                                                            </span>
                                                        )}

                                                    </td>

                                                    <td className="px-4 py-4">

                                                        <div className="min-w-[150px]">

                                                            <div className="font-bold text-white">
                                                                {withdraw.username ||
                                                                    "-"}
                                                            </div>

                                                            <div className="mt-1 text-xs text-zinc-500">
                                                                {withdraw.fullName ||
                                                                    withdraw.email ||
                                                                    withdraw.userId ||
                                                                    ""}
                                                            </div>

                                                        </div>

                                                    </td>

                                                    <td className="px-4 py-4">

                                                        <span
                                                            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${getWalletBadgeClass(
                                                                walletType
                                                            )}`}
                                                        >
                                                            {walletType}
                                                        </span>

                                                    </td>

                                                    <td className="px-4 py-4">

                                                        <div className="font-bold text-white">
                                                            {formatAmount(
                                                                amount,
                                                                walletType
                                                            )}
                                                        </div>

                                                        <div className="mt-1 text-xs text-zinc-600">
                                                            {withdraw.currency ||
                                                                walletType}
                                                        </div>

                                                    </td>

                                                    <td className="px-4 py-4">

                                                        <div className="text-sm text-white">
                                                            {withdraw.paymentMethod ||
                                                                "-"}
                                                        </div>

                                                        {withdraw.network && (
                                                            <div className="mt-1 text-xs text-zinc-500">
                                                                {withdraw.network}
                                                            </div>
                                                        )}

                                                    </td>

                                                    <td className="max-w-[220px] px-4 py-4">

                                                        <div className="truncate text-sm text-zinc-300">
                                                            {destination}
                                                        </div>

                                                    </td>

                                                    <td className="px-4 py-4">

                                                        <span
                                                            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${getStatusClass(
                                                                status
                                                            )}`}
                                                        >
                                                            {status ||
                                                                "UNKNOWN"}
                                                        </span>

                                                    </td>

                                                    <td className="whitespace-nowrap px-4 py-4 text-xs text-zinc-500">
                                                        {formatDate(
                                                            withdraw.createdAt
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">

                                                        <div className="flex justify-end gap-2">

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDetails(
                                                                        withdraw
                                                                    )
                                                                }
                                                                className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-300 transition hover:border-blue-500/50 hover:text-blue-400"
                                                                title="View details"
                                                            >
                                                                <Eye size={17} />
                                                            </button>

                                                            {isPending && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            approveWithdrawal(
                                                                                withdraw
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            isProcessing ||
                                                                            processingBulk
                                                                        }
                                                                        className="rounded-lg bg-green-600 p-2 text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"
                                                                        title="Approve"
                                                                    >
                                                                        {isProcessing ? (
                                                                            <RefreshCw
                                                                                size={17}
                                                                                className="animate-spin"
                                                                            />
                                                                        ) : (
                                                                            <CheckCircle
                                                                                size={17}
                                                                            />
                                                                        )}
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openRejectModal(
                                                                                withdraw
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            isProcessing ||
                                                                            processingBulk
                                                                        }
                                                                        className="rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                                                        title="Reject"
                                                                    >
                                                                        <XCircle size={17} />
                                                                    </button>
                                                                </>
                                                            )}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openDeleteModal(
                                                                        withdraw
                                                                    )
                                                                }
                                                                disabled={
                                                                    isProcessing ||
                                                                    processingBulk
                                                                }
                                                                className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={17} />
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                </section>

                {/* ==================================================
                    DETAILS MODAL
                ================================================== */}

                {showDetails &&
                    selectedWithdraw && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

                            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">

                                <div className="sticky top-0 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-5 py-4">

                                    <div>

                                        <h2 className="text-xl font-black text-yellow-400">
                                            Withdrawal Details
                                        </h2>

                                        <p className="mt-1 text-xs text-zinc-500">
                                            {selectedWithdraw._id}
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowDetails(false)
                                        }
                                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>

                                </div>

                                <div className="grid gap-4 p-5 sm:grid-cols-2">

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                                        <p className="text-xs text-zinc-500">
                                            Username
                                        </p>

                                        <p className="mt-1 font-bold">
                                            {selectedWithdraw.username ||
                                                "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                                        <p className="text-xs text-zinc-500">
                                            Email
                                        </p>

                                        <p className="mt-1 break-all font-bold">
                                            {selectedWithdraw.email ||
                                                "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                                        <p className="text-xs text-zinc-500">
                                            Wallet Type
                                        </p>

                                        <p className="mt-1 font-bold text-yellow-400">
                                            {normalizeWalletType(
                                                selectedWithdraw.walletType
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                                        <p className="text-xs text-zinc-500">
                                            Amount
                                        </p>

                                        <p className="mt-1 font-bold">
                                            {formatAmount(
                                                getWithdrawAmount(
                                                    selectedWithdraw
                                                ),
                                                selectedWithdraw.walletType
                                            )}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                                        <p className="text-xs text-zinc-500">
                                            Payment Method
                                        </p>

                                        <p className="mt-1 font-bold">
                                            {selectedWithdraw.paymentMethod ||
                                                "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4">
                                        <p className="text-xs text-zinc-500">
                                            Network
                                        </p>

                                        <p className="mt-1 font-bold">
                                            {selectedWithdraw.network ||
                                                "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4 sm:col-span-2">

                                        <div className="flex items-center justify-between gap-3">

                                            <div>

                                                <p className="text-xs text-zinc-500">
                                                    Destination
                                                </p>

                                                <p className="mt-1 break-all font-bold text-zinc-200">
                                                    {selectedWithdraw.walletAddress ||
                                                        selectedWithdraw.receiverWalletAddress ||
                                                        selectedWithdraw.accountNumber ||
                                                        selectedWithdraw.receiverAccount ||
                                                        selectedWithdraw.iban ||
                                                        "-"}
                                                </p>

                                            </div>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    copyText(
                                                        String(
                                                            selectedWithdraw.walletAddress ||
                                                            selectedWithdraw.receiverWalletAddress ||
                                                            selectedWithdraw.accountNumber ||
                                                            selectedWithdraw.receiverAccount ||
                                                            selectedWithdraw.iban ||
                                                            ""
                                                        )
                                                    )
                                                }
                                                className="shrink-0 rounded-lg border border-zinc-700 p-2 text-zinc-400 hover:text-yellow-400"
                                            >
                                                <Copy size={17} />
                                            </button>

                                        </div>

                                    </div>

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4">

                                        <p className="text-xs text-zinc-500">
                                            Status
                                        </p>

                                        <span
                                            className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${getStatusClass(
                                                selectedWithdraw.status
                                            )}`}
                                        >
                                            {normalizeStatus(
                                                selectedWithdraw.status
                                            )}
                                        </span>

                                    </div>

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4">

                                        <p className="text-xs text-zinc-500">
                                            Reference ID
                                        </p>

                                        <p className="mt-1 break-all font-bold">
                                            {selectedWithdraw.referenceId ||
                                                "-"}
                                        </p>

                                    </div>

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4 sm:col-span-2">

                                        <p className="text-xs text-zinc-500">
                                            Note
                                        </p>

                                        <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-300">
                                            {selectedWithdraw.note ||
                                                selectedWithdraw.rejectionReason ||
                                                selectedWithdraw.rejectReason ||
                                                "-"}
                                        </p>

                                    </div>

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4">

                                        <p className="text-xs text-zinc-500">
                                            Created
                                        </p>

                                        <p className="mt-1 text-sm font-semibold">
                                            {formatDate(
                                                selectedWithdraw.createdAt
                                            )}
                                        </p>

                                    </div>

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4">

                                        <p className="text-xs text-zinc-500">
                                            Updated
                                        </p>

                                        <p className="mt-1 text-sm font-semibold">
                                            {formatDate(
                                                selectedWithdraw.updatedAt
                                            )}
                                        </p>

                                    </div>

                                </div>

                                <div className="flex justify-end border-t border-zinc-800 px-5 py-4">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowDetails(false)
                                        }
                                        className="rounded-xl bg-zinc-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-700"
                                    >
                                        Close
                                    </button>

                                </div>

                            </div>

                        </div>
                    )}

                                {showRejectModal &&
                    rejectTarget && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

                            <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl">

                                <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">

                                    <div>

                                        <h2 className="text-xl font-black text-red-400">
                                            Reject Withdrawal
                                        </h2>

                                        <p className="mt-1 text-xs text-zinc-500">
                                            {rejectTarget.username ||
                                                rejectTarget._id}
                                        </p>

                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowRejectModal(false)
                                        }
                                        className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>

                                </div>

                                <div className="space-y-4 p-5">

                                    <div className="rounded-xl border border-zinc-800 bg-black p-4">

                                        <p className="text-xs text-zinc-500">
                                            Withdrawal Amount
                                        </p>

                                        <p className="mt-1 font-bold text-white">
                                            {formatAmount(
                                                getWithdrawAmount(
                                                    rejectTarget
                                                ),
                                                rejectTarget.walletType
                                            )}{" "}
                                            {normalizeWalletType(
                                                rejectTarget.walletType
                                            )}
                                        </p>

                                    </div>

                                    <div>

                                        <label className="mb-2 block text-sm font-semibold text-zinc-300">
                                            Rejection Reason
                                        </label>

                                        <textarea
                                            value={rejectReason}
                                            onChange={(event) =>
                                                setRejectReason(
                                                    event.target.value
                                                )
                                            }
                                            rows={5}
                                            placeholder="Enter rejection reason..."
                                            className="w-full resize-none rounded-xl border border-zinc-700 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-red-500/60"
                                        />

                                    </div>

                                    <div className="flex justify-end gap-3">

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowRejectModal(false);
                                                setRejectTarget(null);
                                                setRejectReason("");
                                            }}
                                            className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-800"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            onClick={rejectWithdrawal}
                                            disabled={
                                                processingId ===
                                                rejectTarget._id
                                            }
                                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processingId ===
                                            rejectTarget._id ? (
                                                <RefreshCw
                                                    size={17}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <XCircle size={17} />
                                            )}

                                            Reject
                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>
                    )}

                {/* ==================================================
                    DELETE MODAL
                ================================================== */}

                {showDeleteModal &&
                    deleteTarget && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

                            <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-zinc-950 shadow-2xl">

                                <div className="border-b border-zinc-800 px-5 py-4">

                                    <h2 className="text-xl font-black text-red-400">
                                        Delete Withdrawal
                                    </h2>

                                </div>

                                <div className="space-y-4 p-5">

                                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">

                                        <p className="text-sm text-zinc-300">
                                            Are you sure you want to delete this withdrawal request?
                                        </p>

                                        <p className="mt-2 font-bold text-white">
                                            {deleteTarget.username ||
                                                "-"}
                                        </p>

                                        <p className="mt-1 text-sm text-yellow-400">
                                            {formatAmount(
                                                getWithdrawAmount(
                                                    deleteTarget
                                                ),
                                                deleteTarget.walletType
                                            )}{" "}
                                            {normalizeWalletType(
                                                deleteTarget.walletType
                                            )}
                                        </p>

                                    </div>

                                    <div className="flex justify-end gap-3">

                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowDeleteModal(false);
                                                setDeleteTarget(null);
                                            }}
                                            className="rounded-xl border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-zinc-800"
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            type="button"
                                            onClick={deleteWithdrawal}
                                            disabled={
                                                processingId ===
                                                deleteTarget._id
                                            }
                                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {processingId ===
                                            deleteTarget._id ? (
                                                <RefreshCw
                                                    size={17}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Trash2 size={17} />
                                            )}

                                            Delete
                                        </button>

                                    </div>

                                </div>

                            </div>

                        </div>
                    )}

            </div>

        </main>
    );
}