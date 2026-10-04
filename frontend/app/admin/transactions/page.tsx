
  "use client";

// =====================================================
// GoldTrade V18 Enterprise
// ADMIN TRANSACTIONS MANAGER
// UPPER PORTION — PART 1/3
// =====================================================

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  Coins,
  Search,
  RefreshCw,
  History,
  CheckCircle,
  Clock,
  XCircle,
  MinusCircle,
  PlusCircle,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com";

// =====================================================
// TYPES
// =====================================================

type UITransactionType =
  | "Deposit"
  | "Withdraw"
  | "Credit"
  | "Debit";

interface TransactionItem {
  _id: string;

  username: string;

  walletType:
    | "PKR"
    | "GOLD"
    | "USDT";

  transactionType:
    | UITransactionType
    | string;

  amount: number;

  status?:
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Failed"
    | "Completed"
    | string;

  transactionId?: string;

  referenceId?: string;

  note?: string;

  admin?: string;

  adminUsername?: string;

  transactionMode?:
    | "CREDIT"
    | "DEBIT"
    | "RELEASE"
    | string;

  paymentMethod?: string;

  balanceBefore?: number;

  balanceAfter?: number;

  createdAt: string;
}

interface TransactionStatistics {
  totalTransactions: number;

  totalDeposits: number;

  totalWithdraws: number;

  totalCredits: number;

  totalDebits: number;

  totalPKR: number;

  totalGold: number;

  totalUSDT: number;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AdminTransactionsPage() {

  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] =
    useState("");

  const [adminName, setAdminName] =
    useState("Administrator");

  // ===================================================
  // DATA
  // ===================================================

  const [transactions, setTransactions] =
    useState<TransactionItem[]>([]);

  const [statistics, setStatistics] =
    useState<TransactionStatistics>({
      totalTransactions: 0,
      totalDeposits: 0,
      totalWithdraws: 0,
      totalCredits: 0,
      totalDebits: 0,
      totalPKR: 0,
      totalGold: 0,
      totalUSDT: 0,
    });

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] =
    useState("");

  // ===================================================
  // FILTERS
  // ===================================================

  const [walletFilter, setWalletFilter] =
    useState<
      "ALL" | "PKR" | "GOLD" | "USDT"
    >("ALL");

  const [typeFilter, setTypeFilter] =
    useState<
      | "ALL"
      | "Deposit"
      | "Withdraw"
      | "Credit"
      | "Debit"
    >("ALL");

  const [statusFilter, setStatusFilter] =
    useState<
      | "ALL"
      | "Pending"
      | "Approved"
      | "Rejected"
      | "Failed"
    >("ALL");

  // ===================================================
  // TOKEN LOAD
  // ===================================================

  useEffect(() => {
    const savedToken =
      localStorage.getItem("token");

    if (!savedToken) {
      window.location.href =
        "/login";

      return;
    }

    setToken(savedToken);
  }, []);

  // ===================================================
  // REQUEST HEADERS
  // ===================================================

  const adminHeaders = useMemo(
    () => ({
      Authorization:
        `Bearer ${token}`,

      "Content-Type":
        "application/json",
    }),
    [token]
  );

  // ===================================================
  // FORMAT MONEY
  // ===================================================

  const formatMoney = (
    value: number = 0
  ) => {
    const safeValue =
      Number(value);

    return (
      Number.isFinite(safeValue)
        ? safeValue
        : 0
    ).toLocaleString(
      "en-PK",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }
    );
  };

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "--";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "--";
    }

    return parsed.toLocaleString(
      "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // ===================================================
  // NORMALIZE TRANSACTION TYPE
  // ===================================================

  const normalizeTransactionType = (
    transaction: any
  ): UITransactionType => {

    const rawType =
      String(
        transaction?.transactionType ||
          ""
      )
        .trim()
        .toUpperCase();

    const mode =
      String(
        transaction?.transactionMode ||
          ""
      )
        .trim()
        .toUpperCase();

    // =================================================
    // DEPOSIT
    // =================================================

    if (
      rawType.startsWith(
        "DEPOSIT"
      )
    ) {
      return "Deposit";
    }

    // =================================================
    // WITHDRAW
    // =================================================

    if (
      rawType.startsWith(
        "WITHDRAW"
      )
    ) {
      return "Withdraw";
    }

    // =================================================
    // CREDIT
    // =================================================

    if (
      mode === "CREDIT" ||
      rawType === "ADMIN_CREDIT" ||
      rawType === "CREDIT"
    ) {
      return "Credit";
    }

    // =================================================
    // DEBIT
    // =================================================

    if (
      mode === "DEBIT" ||
      rawType === "ADMIN_DEBIT" ||
      rawType === "DEBIT"
    ) {
      return "Debit";
    }

    // =================================================
    // DEFAULT
    // =================================================

    return "Debit";
  };

  // ===================================================
  // NORMALIZE STATUS
  // ===================================================

  const normalizeStatus = (
    value: any
  ): string => {

    const status =
      String(value || "")
        .trim()
        .toUpperCase();

    if (
      status === "COMPLETED" ||
      status === "SUCCESS" ||
      status === "APPROVED"
    ) {
      return "Approved";
    }

    if (
      status === "PENDING"
    ) {
      return "Pending";
    }

    if (
      status === "REJECTED"
    ) {
      return "Rejected";
    }

    if (
      status === "FAILED"
    ) {
      return "Failed";
    }

    return (
      String(value || "")
        .trim() ||
      "Pending"
    );
  };

  // ===================================================
  // NORMALIZE TRANSACTION
  // ===================================================

  const normalizeTransaction = (
    item: any
  ): TransactionItem => {

    const rawAmount =
      Number(item?.amount || 0);

    return {
      ...item,

      _id: String(
        item?._id ||
          item?.id ||
          ""
      ),

      username: String(
        item?.username ||
          ""
      ),

      walletType:
        String(
          item?.walletType ||
            "PKR"
        )
          .trim()
          .toUpperCase() as
          | "PKR"
          | "GOLD"
          | "USDT",

      transactionType:
        normalizeTransactionType(
          item
        ),

      amount:
        Number.isFinite(
          rawAmount
        )
          ? rawAmount
          : 0,

      status:
        normalizeStatus(
          item?.status
        ),

      transactionId:
        item?.transactionId
          ? String(
              item.transactionId
            )
          : undefined,

      referenceId:
        item?.referenceId
          ? String(
              item.referenceId
            )
          : undefined,

      note:
        item?.note
          ? String(item.note)
          : undefined,

      admin:
        item?.admin
          ? String(item.admin)
          : undefined,

      adminUsername:
        item?.adminUsername
          ? String(
              item.adminUsername
            )
          : undefined,

      transactionMode:
        item?.transactionMode
          ? String(
              item.transactionMode
            ).toUpperCase()
          : undefined,

      paymentMethod:
        item?.paymentMethod
          ? String(
              item.paymentMethod
            )
          : undefined,

      balanceBefore:
        Number.isFinite(
          Number(
            item?.balanceBefore
          )
        )
          ? Number(
              item.balanceBefore
            )
          : undefined,

      balanceAfter:
        Number.isFinite(
          Number(
            item?.balanceAfter
          )
        )
          ? Number(
              item.balanceAfter
            )
          : undefined,

      createdAt:
        item?.createdAt ||
        new Date().toISOString(),
    };
  };

   // ===================================================
  // LOAD TRANSACTIONS DASHBOARD
  // ===================================================

  const loadTransactionsDashboard =
    async () => {

      if (!token) return;

      try {
        setLoading(true);
        setRefreshing(false);
        setError("");

        // =================================================
        // API REQUESTS
        // =================================================

        const [
          transactionsRes,
          statisticsRes,
        ] = await Promise.all([

          // ===============================================
          // ADMIN TRANSACTIONS
          // ===============================================

          fetch(
            `${API}/api/transactions/admin`,
            {
              method: "GET",
              headers:
                adminHeaders,
              cache:
                "no-store",
            }
          ),

          // ===============================================
          // ADMIN TRANSACTION STATS
          // ===============================================

          fetch(
            `${API}/api/transactions/admin/stats`,
            {
              method: "GET",
              headers:
                adminHeaders,
              cache:
                "no-store",
            }
          ),
        ]);

        // =================================================
        // SAFE JSON PARSING
        // =================================================

        let transactionsData: any =
          null;

        let statisticsData: any =
          null;

        try {
          transactionsData =
            await transactionsRes.json();
        } catch {
          transactionsData = null;
        }

        try {
          statisticsData =
            await statisticsRes.json();
        } catch {
          statisticsData = null;
        }

        console.log(
          "TRANSACTIONS API:",
          transactionsData
        );

        console.log(
          "TRANSACTION STATISTICS API:",
          statisticsData
        );

        // =================================================
        // TRANSACTIONS
        // =================================================

        let normalizedTransactions:
          TransactionItem[] = [];

        if (
          transactionsRes.ok &&
          transactionsData?.success
        ) {

          const rawTransactions =
            Array.isArray(
              transactionsData?.transactions
            )
              ? transactionsData.transactions
              : [];

          normalizedTransactions =
            rawTransactions.map(
              normalizeTransaction
            );

          setTransactions(
            normalizedTransactions
          );

        } else {

          setTransactions([]);

          setError(
            transactionsData?.message ||
              "Unable to load transactions."
          );
        }

        // =================================================
        // STATISTICS
        // =================================================

        if (
          statisticsRes.ok &&
          statisticsData?.success
        ) {

          const overview =
            statisticsData?.overview ||
            {};

          const walletSummary =
            statisticsData?.walletSummary ||
            {};

          // ===============================================
          // CALCULATE TYPE COUNTS FROM ACTUAL TRANSACTIONS
          // ===============================================

          const deposits =
            normalizedTransactions.filter(
              (transaction) =>
                transaction.transactionType ===
                "Deposit"
            ).length;

          const withdraws =
            normalizedTransactions.filter(
              (transaction) =>
                transaction.transactionType ===
                "Withdraw"
            ).length;

          const credits =
            normalizedTransactions.filter(
              (transaction) =>
                transaction.transactionType ===
                "Credit"
            ).length;

          const debits =
            normalizedTransactions.filter(
              (transaction) =>
                transaction.transactionType ===
                "Debit"
            ).length;

          // ===============================================
          // WALLET TOTALS
          // ===============================================

          const totalPKR =
            Number(
              walletSummary?.PKR?.amount ||
                0
            );

          const totalGold =
            Number(
              walletSummary?.GOLD?.amount ||
                0
            );

          const totalUSDT =
            Number(
              walletSummary?.USDT?.amount ||
                0
            );

          // ===============================================
          // FINAL STATISTICS
          // ===============================================

          setStatistics({
            totalTransactions:
              Number(
                overview?.totalTransactions ||
                  transactionsData?.pagination
                    ?.totalTransactions ||
                  normalizedTransactions.length ||
                  0
              ),

            totalDeposits:
              deposits,

            totalWithdraws:
              withdraws,

            totalCredits:
              credits,

            totalDebits:
              debits,

            totalPKR:
              Number.isFinite(
                totalPKR
              )
                ? totalPKR
                : 0,

            totalGold:
              Number.isFinite(
                totalGold
              )
                ? totalGold
                : 0,

            totalUSDT:
              Number.isFinite(
                totalUSDT
              )
                ? totalUSDT
                : 0,
          });

        } else {

          setStatistics({
            totalTransactions:
              normalizedTransactions.length,

            totalDeposits: 0,
            totalWithdraws: 0,
            totalCredits: 0,
            totalDebits: 0,
            totalPKR: 0,
            totalGold: 0,
            totalUSDT: 0,
          });
        }

      } catch (err: any) {

        console.error(
          "LOAD TRANSACTIONS ERROR:",
          err
        );

        setTransactions([]);

        setError(
          err?.message ||
            "Unable to load transactions dashboard."
        );

      } finally {

        setLoading(false);
        setRefreshing(false);
      }
    };

  // ===================================================
  // REFRESH
  // ===================================================

  const refreshTransactions =
    async () => {

      setRefreshing(true);

      await loadTransactionsDashboard();
    };

  // ===================================================
  // ADMIN AUTH CHECK
  // ===================================================

  useEffect(() => {

    if (!token) return;

    const checkAdmin =
      async () => {

        try {

          const response =
            await fetch(
              `${API}/api/auth/check`,
              {
                method: "GET",

                headers:
                  adminHeaders,

                cache:
                  "no-store",
              }
            );

          // =============================================
          // SAFE JSON
          // =============================================

          let data: any = null;

          try {
            data =
              await response.json();
          } catch {
            data = null;
          }

          console.log(
            "ADMIN AUTH RESPONSE:",
            data
          );

          // =============================================
          // AUTH FAILED
          // =============================================

          if (
            !response.ok ||
            !data?.success
          ) {

            console.warn(
              "Admin authentication check failed."
            );

            localStorage.removeItem(
              "token"
            );

            window.location.href =
              "/login";

            return;
          }

          // =============================================
          // USER
          // =============================================

          const user =
            data?.user;

          // =============================================
          // ADMIN ROLE
          // =============================================

          if (
            !user ||
            String(
              user.role || ""
            ).toLowerCase() !==
              "admin"
          ) {

            console.warn(
              "Admin access denied."
            );

            localStorage.removeItem(
              "token"
            );

            window.location.href =
              "/login";

            return;
          }

          // =============================================
          // ADMIN NAME
          // =============================================

          setAdminName(
            user.username ||
              "Administrator"
          );

        } catch (err) {

          console.error(
            "ADMIN AUTH CHECK ERROR:",
            err
          );
        }
      };

    checkAdmin();

  }, [
    token,
    adminHeaders,
  ]);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {

    if (!token) return;

    loadTransactionsDashboard();

  }, [token]);
    
  // ===================================================
  // FILTERED TRANSACTIONS
  // ===================================================

  const filteredTransactions =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      return transactions.filter(
        (transaction) => {

          // =============================================
          // SEARCH
          // =============================================

          const matchesSearch =
            !query ||

            String(
              transaction.username ||
                ""
            )
              .toLowerCase()
              .includes(query) ||

            String(
              transaction.transactionId ||
                ""
            )
              .toLowerCase()
              .includes(query) ||

            String(
              transaction.referenceId ||
                ""
            )
              .toLowerCase()
              .includes(query);

          if (!matchesSearch) {
            return false;
          }

          // =============================================
          // WALLET FILTER
          // =============================================

          if (
            walletFilter !== "ALL" &&
            transaction.walletType !==
              walletFilter
          ) {
            return false;
          }

          // =============================================
          // TYPE FILTER
          // =============================================

          if (
            typeFilter !== "ALL" &&
            transaction.transactionType !==
              typeFilter
          ) {
            return false;
          }

          // =============================================
          // STATUS FILTER
          // =============================================

          if (
            statusFilter !== "ALL" &&
            transaction.status !==
              statusFilter
          ) {
            return false;
          }

          return true;
        }
      );

    }, [
      transactions,
      search,
      walletFilter,
      typeFilter,
      statusFilter,
    ]);

  // ===================================================
  // FILTER RESET
  // ===================================================

  const clearFilters = () => {

    setSearch("");

    setWalletFilter(
      "ALL"
    );

    setTypeFilter(
      "ALL"
    );

    setStatusFilter(
      "ALL"
    );
  };

  // ===================================================
  // FILTERED SUMMARY
  // ===================================================

  const filteredSummary =
    useMemo(() => {

      let deposits = 0;
      let withdrawals = 0;
      let credits = 0;
      let debits = 0;

      let pending = 0;
      let approved = 0;
      let rejected = 0;

      filteredTransactions.forEach(
        (transaction) => {

          const type =
            transaction.transactionType;

          const status =
            transaction.status;

          // ===========================================
          // TYPES
          // ===========================================

          if (
            type === "Deposit"
          ) {
            deposits++;
          }

          if (
            type === "Withdraw"
          ) {
            withdrawals++;
          }

          if (
            type === "Credit"
          ) {
            credits++;
          }

          if (
            type === "Debit"
          ) {
            debits++;
          }

          // ===========================================
          // STATUS
          // ===========================================

          if (
            status === "Pending"
          ) {
            pending++;
          }

          if (
            status === "Approved" ||
            status === "Completed"
          ) {
            approved++;
          }

          if (
            status === "Rejected" ||
            status === "Failed"
          ) {
            rejected++;
          }
        }
      );

      return {
        total:
          filteredTransactions.length,

        deposits,

        withdrawals,

        credits,

        debits,

        pending,

        approved,

        rejected,
      };

    }, [
      filteredTransactions,
    ]);

  // ===================================================
  // STATUS CLASS
  // ===================================================

  const getStatusClass = (
    status: string
  ) => {

    switch (status) {

      case "Approved":
      case "Completed":
        return (
          "bg-green-500/10 " +
          "text-green-400 " +
          "border-green-500/20"
        );

      case "Pending":
        return (
          "bg-yellow-500/10 " +
          "text-yellow-400 " +
          "border-yellow-500/20"
        );

      case "Rejected":
      case "Failed":
        return (
          "bg-red-500/10 " +
          "text-red-400 " +
          "border-red-500/20"
        );

      default:
        return (
          "bg-gray-500/10 " +
          "text-gray-400 " +
          "border-gray-500/20"
        );
    }
  };

  // ===================================================
  // TRANSACTION CLASS
  // ===================================================

  const getTransactionClass = (
    type: string
  ) => {

    switch (type) {

      case "Deposit":
        return "text-green-400";

      case "Withdraw":
        return "text-red-400";

      case "Credit":
        return "text-blue-400";

      case "Debit":
        return "text-orange-400";

      case "Buy Gold":
      case "Sell Gold":
        return "text-yellow-400";

      case "Buy USDT":
      case "Sell USDT":
        return "text-cyan-400";

      default:
        return "text-gray-400";
    }
  };

  // ===================================================
  // WALLET COLOR
  // ===================================================

  const getWalletColor = (
    walletType: string
  ) => {

    switch (
      walletType.toUpperCase()
    ) {

      case "PKR":
        return "text-green-400";

      case "USDT":
        return "text-cyan-400";

      case "GOLD":
        return "text-yellow-400";

      default:
        return "text-gray-400";
    }
  };

  // ===================================================
  // TRANSACTION ICON
  // ===================================================

  const getTransactionIcon = (
    type: string
  ) => {

    switch (type) {

      case "Deposit":
        return ArrowDownCircle;

      case "Withdraw":
        return ArrowUpCircle;

      case "Credit":
        return PlusCircle;

      case "Debit":
        return MinusCircle;

      default:
        return History;
    }
  };

  // ===================================================
  // FILTERED STATISTICS
  // ===================================================

  const filteredStatistics =
    useMemo(() => {

      const total =
        filteredTransactions.length;

      const completed =
        filteredTransactions.filter(
          (transaction) =>
            transaction.status ===
              "Completed" ||
            transaction.status ===
              "Approved"
        ).length;

      const pending =
        filteredTransactions.filter(
          (transaction) =>
            transaction.status ===
            "Pending"
        ).length;

      const rejected =
        filteredTransactions.filter(
          (transaction) =>
            transaction.status ===
              "Rejected" ||
            transaction.status ===
              "Failed"
        ).length;

      return {
        total,

        completed,

        pending,

        rejected,

        deposits:
          filteredSummary.deposits,

        withdraws:
          filteredSummary.withdrawals,

        credits:
          filteredSummary.credits,

        debits:
          filteredSummary.debits,
      };

    }, [
      filteredTransactions,
      filteredSummary,
    ]);

  // ===================================================
  // RECENT TRANSACTIONS
  // ===================================================

  const recentTransactions =
    useMemo(() => {

      return [
        ...transactions,
      ]
        .sort(
          (a, b) =>
            new Date(
              b.createdAt
            ).getTime() -
            new Date(
              a.createdAt
            ).getTime()
        )
        .slice(0, 5);

    }, [
      transactions,
    ]);

  // ===================================================
  // COUNTS
  // ===================================================

  const pendingCount =
    transactions.filter(
      (transaction) =>
        transaction.status ===
        "Pending"
    ).length;

  const approvedCount =
    transactions.filter(
      (transaction) =>
        transaction.status ===
          "Approved" ||
        transaction.status ===
          "Completed"
    ).length;

  const rejectedCount =
    transactions.filter(
      (transaction) =>
        transaction.status ===
          "Rejected" ||
        transaction.status ===
          "Failed"
    ).length;

  // ===================================================
  // AUTO CLEAR MESSAGE
  // ===================================================

  useEffect(() => {

    if (!message) return;

    const timer =
      setTimeout(() => {
        setMessage("");
      }, 5000);

    return () =>
      clearTimeout(timer);

  }, [message]);

  // ===================================================
  // AUTO CLEAR ERROR
  // ===================================================

  useEffect(() => {

    if (!error) return;

    const timer =
      setTimeout(() => {
        setError("");
      }, 8000);

    return () =>
      clearTimeout(timer);

  }, [error]);

// ===================================================
// PAGE UI
// ===================================================

return (
  <main className="min-h-screen bg-black text-white">

    {/* =================================================
        PAGE CONTAINER
    ================================================= */}

    <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10">

              <History
                size={23}
                className="text-yellow-400"
              />

            </div>

            <div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Transaction Management
              </h1>

              <p className="mt-1 text-sm text-gray-400">
                Monitor and manage all platform transactions
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            HEADER ACTIONS
        ================================================= */}

        <div className="flex flex-wrap items-center gap-3">

          <button
            type="button"
            onClick={refreshTransactions}
            disabled={
              loading ||
              refreshing
            }
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:border-yellow-500/30 hover:bg-yellow-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >

            <RefreshCw
              size={17}
              className={
                loading ||
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {loading ||
            refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </div>

      </div>

      {/* =================================================
          SUCCESS MESSAGE
      ================================================= */}

      {message && (

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">

          <CheckCircle
            size={18}
            className="mt-0.5 shrink-0 text-green-400"
          />

          <span>
            {message}
          </span>

        </div>

      )}

      {/* =================================================
          ERROR MESSAGE
      ================================================= */}

      {error && (

        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">

          <XCircle
            size={18}
            className="mt-0.5 shrink-0 text-red-400"
          />

          <span>
            {error}
          </span>

        </div>

      )}

      {/* =================================================
          STATISTICS SECTION
      ================================================= */}

      <section className="mb-8">

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-white">
              Transaction Overview
            </h2>

            <p className="text-sm text-gray-500">
              Current transaction activity and status summary
            </p>

          </div>

          <div className="text-xs text-gray-500">
            {adminName
              ? `Admin: ${adminName}`
              : "Administrator"}
          </div>

        </div>

        {/* =================================================
            STATISTICS GRID
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm text-gray-400">
                  Total Transactions
                </p>

                <p className="mt-2 text-2xl font-bold text-white">
                  {filteredTransactions.length.toLocaleString()}
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">

                <History
                  size={19}
                  className="text-yellow-400"
                />

              </div>

            </div>

          </div>

          {/* COMPLETED */}

          <div className="rounded-2xl border border-green-500/10 bg-green-500/[0.03] p-5">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm text-gray-400">
                  Completed
                </p>

                <p className="mt-2 text-2xl font-bold text-green-400">
                  {approvedCount.toLocaleString()}
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">

                <CheckCircle
                  size={19}
                  className="text-green-400"
                />

              </div>

            </div>

          </div>

          {/* PENDING */}

          <div className="rounded-2xl border border-yellow-500/10 bg-yellow-500/[0.03] p-5">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm text-gray-400">
                  Pending
                </p>

                <p className="mt-2 text-2xl font-bold text-yellow-400">
                  {pendingCount.toLocaleString()}
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">

                <Clock
                  size={19}
                  className="text-yellow-400"
                />

              </div>

            </div>

          </div>

          {/* REJECTED */}

          <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-5">

            <div className="flex items-start justify-between gap-4">

              <div>

                <p className="text-sm text-gray-400">
                  Rejected / Failed
                </p>

                <p className="mt-2 text-2xl font-bold text-red-400">
                  {rejectedCount.toLocaleString()}
                </p>

              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">

                <XCircle
                  size={19}
                  className="text-red-400"
                />

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          WALLET TOTALS
      ================================================= */}

      <section className="mb-8">

        <div className="mb-4">

          <h2 className="text-lg font-semibold text-white">
            Wallet Summary
          </h2>

          <p className="text-sm text-gray-500">
            Transaction totals grouped by wallet
          </p>

        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {/* PKR */}

          <div className="rounded-2xl border border-green-500/10 bg-white/[0.03] p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">

                <Wallet
                  size={19}
                  className="text-green-400"
                />

              </div>

              <div>

                <p className="text-sm text-gray-400">
                  PKR Wallet
                </p>

                <p className="mt-1 text-lg font-semibold text-green-400">

                  {formatMoney(
                    Number(
                      statistics?.totalPKR ??
                      0
                    )
                  )}{" "}
                  PKR

                </p>

              </div>

            </div>

          </div>

          {/* USDT */}

          <div className="rounded-2xl border border-cyan-500/10 bg-white/[0.03] p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10">

                <Coins
                  size={19}
                  className="text-cyan-400"
                />

              </div>

              <div>

                <p className="text-sm text-gray-400">
                  USDT Wallet
                </p>

                <p className="mt-1 text-lg font-semibold text-cyan-400">

                  {formatMoney(
                    Number(
                      statistics?.totalUSDT ??
                      0
                    )
                  )}{" "}
                  USDT

                </p>

              </div>

            </div>

          </div>

          {/* GOLD */}

          <div className="rounded-2xl border border-yellow-500/10 bg-white/[0.03] p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">

                <Coins
                  size={19}
                  className="text-yellow-400"
                />

              </div>

              <div>

                <p className="text-sm text-gray-400">
                  Gold Wallet
                </p>

                <p className="mt-1 text-lg font-semibold text-yellow-400">

                  {formatMoney(
                    Number(
                      statistics?.totalGold ??
                      0
                    )
                  )}{" "}
                  GOLD

                </p>

              </div>

            </div>

          </div>

        </div>

      </section>
            {/* =================================================
          FILTERS SECTION
      ================================================= */}

      <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-white">
              Transaction Filters
            </h2>

            <p className="text-sm text-gray-500">
              Search and filter transaction records
            </p>

          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-300"
          >

            <XCircle size={15} />

            Clear Filters

          </button>

        </div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="mb-5">

          <label
            htmlFor="transaction-search"
            className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500"
          >
            Search
          </label>

          <div className="relative">

            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              id="transaction-search"
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search username, transaction ID or reference ID..."
              className="w-full rounded-xl border border-white/10 bg-black/30 py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-yellow-500/40"
            />

          </div>

        </div>

        {/* =================================================
            FILTER GRID
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* WALLET */}

          <div>

            <label
              htmlFor="wallet-filter"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Wallet
            </label>

            <select
              id="wallet-filter"
              value={walletFilter}
              onChange={(e) =>
                setWalletFilter(
                  e.target.value as
                    | "ALL"
                    | "PKR"
                    | "GOLD"
                    | "USDT"
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-500/40"
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

          </div>

          {/* TYPE */}

          <div>

            <label
              htmlFor="type-filter"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Transaction Type
            </label>

            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value as
                    | "ALL"
                    | "Deposit"
                    | "Withdraw"
                    | "Credit"
                    | "Debit"
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-500/40"
            >

              <option value="ALL">
                All Types
              </option>

              <option value="Deposit">
                Deposit
              </option>

              <option value="Withdraw">
                Withdraw
              </option>

              <option value="Credit">
                Credit
              </option>

              <option value="Debit">
                Debit
              </option>

            </select>

          </div>

          {/* STATUS */}

          <div>

            <label
              htmlFor="status-filter"
              className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-500"
            >
              Status
            </label>

            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as
                    | "ALL"
                    | "Pending"
                    | "Approved"
                    | "Rejected"
                    | "Failed"
                )
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none transition focus:border-yellow-500/40"
            >

              <option value="ALL">
                All Statuses
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Approved">
                Approved
              </option>

              <option value="Rejected">
                Rejected
              </option>

            </select>

          </div>

        </div>

      </section>

      {/* =================================================
          FILTER SUMMARY
      ================================================= */}

      <section className="mb-8">

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-white">
              Filtered Results
            </h2>

            <p className="text-sm text-gray-500">
              Summary of transactions matching the current filters
            </p>

          </div>

          <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300">

            Showing{" "}

            <span className="font-semibold text-white">
              {filteredTransactions.length}
            </span>{" "}

            transactions

          </div>

        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">

          {/* TOTAL */}

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">

            <p className="text-xs text-gray-500">
              Total
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {filteredTransactions.length}
            </p>

          </div>

          {/* DEPOSITS */}

          <div className="rounded-xl border border-green-500/10 bg-green-500/[0.03] p-4">

            <p className="text-xs text-gray-500">
              Deposits
            </p>

            <p className="mt-1 text-xl font-bold text-green-400">
              {filteredStatistics.deposits}
            </p>

          </div>

          {/* WITHDRAWALS */}

          <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4">

            <p className="text-xs text-gray-500">
              Withdrawals
            </p>

            <p className="mt-1 text-xl font-bold text-red-400">
              {filteredStatistics.withdraws}
            </p>

          </div>

          {/* CREDITS */}

          <div className="rounded-xl border border-blue-500/10 bg-blue-500/[0.03] p-4">

            <p className="text-xs text-gray-500">
              Credits
            </p>

            <p className="mt-1 text-xl font-bold text-blue-400">
              {filteredStatistics.credits}
            </p>

          </div>

          {/* DEBITS */}

          <div className="rounded-xl border border-orange-500/10 bg-orange-500/[0.03] p-4">

            <p className="text-xs text-gray-500">
              Debits
            </p>

            <p className="mt-1 text-xl font-bold text-orange-400">
              {filteredStatistics.debits}
            </p>

          </div>

          {/* PENDING */}

          <div className="rounded-xl border border-yellow-500/10 bg-yellow-500/[0.03] p-4">

            <p className="text-xs text-gray-500">
              Pending
            </p>

            <p className="mt-1 text-xl font-bold text-yellow-400">
              {pendingCount}
            </p>

          </div>

          {/* APPROVED */}

          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-4">

            <p className="text-xs text-gray-500">
              Approved
            </p>

            <p className="mt-1 text-xl font-bold text-emerald-400">
              {approvedCount}
            </p>

          </div>

          {/* REJECTED */}

          <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-4">

            <p className="text-xs text-gray-500">
              Rejected
            </p>

            <p className="mt-1 text-xl font-bold text-red-400">
              {rejectedCount}
            </p>

          </div>

        </div>

      </section>

      {/* =================================================
          TRANSACTIONS TABLE
      ================================================= */}

      <section className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

        <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-white">
              All Transactions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Complete transaction records
            </p>

          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">

            <span>
              Total:
            </span>

            <span className="font-semibold text-gray-300">
              {transactions.length}
            </span>

          </div>

        </div>

        {/* =================================================
            TABLE WRAPPER
        ================================================= */}

        <div className="overflow-x-auto">

          {loading ? (

            <div className="flex min-h-[300px] items-center justify-center px-6 py-12">

              <div className="flex flex-col items-center gap-4">

                <RefreshCw
                  size={28}
                  className="animate-spin text-yellow-400"
                />

                <p className="text-sm text-gray-500">
                  Loading transactions...
                </p>

              </div>

            </div>

          ) : filteredTransactions.length === 0 ? (

            <div className="flex min-h-[300px] items-center justify-center px-6 py-12">

              <div className="flex max-w-md flex-col items-center text-center">

                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">

                  <Search
                    size={24}
                    className="text-gray-500"
                  />

                </div>

                <h3 className="text-base font-semibold text-white">
                  No Transactions Found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  No transaction records match the current search or filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-300"
                >
                  Clear Filters
                </button>

              </div>

            </div>

          ) : (

            <table className="min-w-[1200px] w-full text-left">

              <thead>

                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">

                  <th className="px-5 py-4 font-medium">
                    Transaction
                  </th>

                  <th className="px-5 py-4 font-medium">
                    User
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Type
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Wallet
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Amount
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Status
                  </th>

                  <th className="px-5 py-4 font-medium">
                    Date
                  </th>

                  <th className="px-5 py-4 text-right font-medium">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-white/5">

                {filteredTransactions.map(
                  (transaction) => {

                    const TransactionIcon =
                      getTransactionIcon(
                        transaction.transactionType
                      );

                    return (

                      <tr
                        key={
                          transaction._id ||
                          transaction.transactionId ||
                          `${transaction.username}-${transaction.createdAt}`
                        }
                        className="transition hover:bg-white/[0.025]"
                      >

                        {/* =================================
                            TRANSACTION
                        ================================= */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">

                              <TransactionIcon
                                size={17}
                                className="text-gray-400"
                              />

                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-sm font-medium text-white">

                                {transaction.transactionId ||
                                  transaction._id ||
                                  "—"}

                              </p>

                              <p className="mt-1 truncate text-xs text-gray-500">

                                {transaction.referenceId ||
                                  "No reference"}

                              </p>

                            </div>

                          </div>

                        </td>

                        {/* =================================
                            USER
                        ================================= */}

                        <td className="px-5 py-4">

                          <div className="min-w-[140px]">

                            <p className="text-sm font-medium text-white">

                              {transaction.username ||
                                "Unknown"}

                            </p>

                          </div>

                        </td>

                        {/* =================================
                            TYPE
                        ================================= */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getTransactionClass(
                              transaction.transactionType
                            )}`}
                          >

                            {transaction.transactionType}

                          </span>

                        </td>

                        {/* =================================
                            WALLET
                        ================================= */}

                        <td className="px-5 py-4">

                          <span
                            className={`text-sm font-semibold ${getWalletColor(
                              transaction.walletType
                            )}`}
                          >

                            {transaction.walletType ||
                              "—"}

                          </span>

                        </td>

                        {/* =================================
                            AMOUNT
                        ================================= */}

                        <td className="px-5 py-4">

                          <div className="min-w-[120px]">

                            <p
                              className={`text-sm font-semibold ${
                                transaction.transactionMode ===
                                "DEBIT"
                                  ? "text-red-400"
                                  : transaction.transactionMode ===
                                    "CREDIT"
                                  ? "text-green-400"
                                  : "text-white"
                              }`}
                            >

                              {transaction.transactionMode ===
                              "DEBIT"
                                ? "-"
                                : transaction.transactionMode ===
                                  "CREDIT"
                                ? "+"
                                : ""}

                              {formatMoney(
                                Number(
                                  transaction.amount ||
                                  0
                                )
                              )}

                            </p>

                            {transaction.transactionMode && (

                              <p className="mt-1 text-[11px] uppercase tracking-wide text-gray-600">
                                {transaction.transactionMode}
                              </p>

                            )}

                          </div>

                        </td>

                        {/* =================================
                            STATUS
                        ================================= */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                              transaction.status ||
                                "Unknown"
                            )}`}
                          >

                            {transaction.status ||
                              "Unknown"}

                          </span>

                        </td>

                        {/* =================================
                            DATE
                        ================================= */}

                        <td className="px-5 py-4">

                          <div className="min-w-[145px]">

                            <p className="text-sm text-gray-300">

                              {formatDate(
                                transaction.createdAt
                              )}

                            </p>

                            {transaction.paymentMethod && (

                              <p className="mt-1 truncate text-xs text-gray-600">
                                {transaction.paymentMethod}
                              </p>

                            )}

                          </div>

                        </td>

                        {/* =================================
                            ACTION
                        ================================= */}

                        <td className="px-5 py-4 text-right">

                          <button
                            type="button"
                            disabled={
                              !transaction._id
                            }
                            onClick={() => {

                              if (
                                transaction._id
                              ) {

                                window.location.href =
                                  `/admin/transactions/${transaction._id}`;

                              }

                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-yellow-500/30 hover:bg-yellow-500/10 hover:text-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
                          >

                            <History
                              size={15}
                            />

                            View

                          </button>

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          )}

        </div>

      </section>

            {/* =================================================
          RECENT TRANSACTIONS
      ================================================= */}

      {recentTransactions.length > 0 && (

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">

          <div className="mb-4 flex items-center gap-2">

            <History
              size={20}
              className="text-yellow-400"
            />

            <div>

              <h2 className="text-lg font-semibold text-white">
                Recent Activity
              </h2>

              <p className="text-sm text-gray-500">
                Latest transaction activity
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">

            {recentTransactions
              .slice(0, 5)
              .map(
                (transaction) => (

                  <div
                    key={`recent-${transaction._id}`}
                    className="rounded-xl border border-white/10 bg-black/40 p-4"
                  >

                    {/* =====================================
                        TOP ROW
                    ===================================== */}

                    <div className="flex items-center justify-between">

                      <span
                        className={`text-sm font-semibold ${getWalletColor(
                          transaction.walletType
                        )}`}
                      >
                        {transaction.walletType}
                      </span>

                      <span className="text-xs text-gray-600">
                        {formatDate(
                          transaction.createdAt
                        )}
                      </span>

                    </div>

                    {/* =====================================
                        USER
                    ===================================== */}

                    <p className="mt-3 truncate font-semibold text-white">
                      {transaction.username ||
                        "--"}
                    </p>

                    {/* =====================================
                        TYPE + AMOUNT
                    ===================================== */}

                    <div className="mt-2 flex items-center justify-between gap-3">

                      <span
                        className={`text-xs ${getTransactionClass(
                          transaction.transactionType
                        )} border-none bg-transparent`}
                      >
                        {transaction.transactionType}
                      </span>

                      <span
                        className={`font-bold ${
                          transaction.transactionMode ===
                          "DEBIT"
                            ? "text-red-400"
                            : transaction.transactionMode ===
                              "CREDIT"
                            ? "text-green-400"
                            : "text-gray-200"
                        }`}
                      >

                        {transaction.transactionMode ===
                        "DEBIT"
                          ? "-"
                          : transaction.transactionMode ===
                            "CREDIT"
                          ? "+"
                          : ""}

                        {formatMoney(
                          Number(
                            transaction.amount ||
                            0
                          )
                        )}

                      </span>

                    </div>

                    {/* =====================================
                        STATUS
                    ===================================== */}

                    <div className="mt-3">

                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-medium ${getStatusClass(
                          transaction.status ||
                            "Unknown"
                        )}`}
                      >
                        {transaction.status ||
                          "Unknown"}
                      </span>

                    </div>

                  </div>

                )
              )}

          </div>

        </section>

      )}

    </div>

  </main>
);
}