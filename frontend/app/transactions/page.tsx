"use client";

/* ==========================================================
   GoldTrade V18 Enterprise
   User Transaction History
   Linux + Render + Next.js 15 Compatible
   ========================================================== */

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  RefreshCw,
  Search,
  Wallet,
  Coins,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

// ==========================================================
// API
// ==========================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com";

// ==========================================================
// TYPES
// ==========================================================

interface TransactionItem {
  _id: string;

  username: string;

  walletType:
    | "PKR"
    | "GOLD"
    | "USDT";

  transactionType: string;

  // CREDIT = wallet credited
  // DEBIT = wallet debited
  // RELEASE = rejected/cancelled,
  // wallet balance unchanged
  transactionMode:
    | "CREDIT"
    | "DEBIT"
    | "RELEASE"
    | string;

  amount: number;

  balanceBefore: number;

  balanceAfter: number;

  paymentMethod?: string;

  referenceId?: string;

  transactionId?: string;

  note?: string;

  status:
    | "Pending"
    | "Approved"
    | "Completed"
    | "Rejected"
    | "Failed"
    | string;

  createdAt: string;
}

// ==========================================================
// COMPONENT
// ==========================================================

export default function TransactionsPage() {
  // ========================================================
  // STATES
  // ========================================================

  const [token, setToken] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [transactions, setTransactions] =
    useState<TransactionItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [walletFilter, setWalletFilter] =
    useState<
      "ALL" | "PKR" | "GOLD" | "USDT"
    >("ALL");

  const [statusFilter, setStatusFilter] =
    useState<
      | "ALL"
      | "Pending"
      | "Approved"
      | "Completed"
      | "Rejected"
      | "Failed"
    >("ALL");

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<
      "success" | "error"
    >("success");

  // ========================================================
  // LOAD AUTH DATA
  // ========================================================

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const savedToken =
      localStorage.getItem(
        "token"
      ) || "";

    /*
     * Support both possible username
     * storage keys.
     */
    const savedUsername =
      localStorage.getItem(
        "username"
      ) ||
      localStorage.getItem(
        "userName"
      ) ||
      "";

    setToken(savedToken);

    setUsername(
      savedUsername.trim()
    );

    if (!savedToken) {
      setLoading(false);
      return;
    }

    /*
     * Username is required by:
     * GET /api/transactions/history/:username
     *
     * If username is not stored yet,
     * we stop safely instead of making
     * an invalid API request.
     */
    if (!savedUsername.trim()) {
      setLoading(false);

      setMessageType("error");

      setMessage(
        "Unable to load transaction history: username not found."
      );
    }
  }, []);

  // ========================================================
  // REQUEST HEADERS
  // ========================================================

  const headers = useMemo(
    () => ({
      Authorization:
        `Bearer ${token}`,

      "Content-Type":
        "application/json",
    }),
    [token]
  );
    // ========================================================
  // NORMALIZE TRANSACTION
  // ========================================================

  const normalizeTransaction = (
    item: any
  ): TransactionItem => {
    const walletType =
      String(
        item?.walletType ||
          "PKR"
      )
        .trim()
        .toUpperCase();

    const rawMode =
      String(
        item?.transactionMode ||
          ""
      )
        .trim()
        .toUpperCase();

    const rawStatus =
      String(
        item?.status ||
          "Pending"
      )
        .trim();

    return {
      ...item,

      _id: String(
        item?._id ||
          item?.id ||
          ""
      ),

      username: String(
        item?.username ||
          username ||
          ""
      ),

      walletType:
        (
          walletType === "GOLD" ||
          walletType === "USDT"
            ? walletType
            : "PKR"
        ) as
          | "PKR"
          | "GOLD"
          | "USDT",

      transactionType:
        String(
          item?.transactionType ||
            ""
        ),

      transactionMode:
        (
          rawMode === "CREDIT" ||
          rawMode === "DEBIT" ||
          rawMode === "RELEASE"
            ? rawMode
            : rawMode
        ) as
          | "CREDIT"
          | "DEBIT"
          | "RELEASE"
          | string,

      amount:
        Number.isFinite(
          Number(item?.amount)
        )
          ? Number(item.amount)
          : 0,

      balanceBefore:
        Number.isFinite(
          Number(
            item?.balanceBefore
          )
        )
          ? Number(
              item.balanceBefore
            )
          : 0,

      balanceAfter:
        Number.isFinite(
          Number(
            item?.balanceAfter
          )
        )
          ? Number(
              item.balanceAfter
            )
          : 0,

      paymentMethod:
        item?.paymentMethod
          ? String(
              item.paymentMethod
            )
          : undefined,

      referenceId:
        item?.referenceId
          ? String(
              item.referenceId
            )
          : undefined,

      transactionId:
        item?.transactionId
          ? String(
              item.transactionId
            )
          : undefined,

      note:
        item?.note
          ? String(item.note)
          : undefined,

      status:
        rawStatus as
          | "Pending"
          | "Approved"
          | "Completed"
          | "Rejected"
          | "Failed"
          | string,

      createdAt:
        item?.createdAt ||
        new Date().toISOString(),
    };
  };

  // ========================================================
  // LOAD TRANSACTIONS
  // ========================================================

  const loadTransactions =
    async () => {
      const safeUsername =
        username.trim();

      if (
        !token ||
        !safeUsername
      ) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        setMessage("");

        const response =
          await fetch(
            `${API}/api/transactions/history/${encodeURIComponent(
              safeUsername
            )}`,
            {
              method: "GET",

              headers,

              cache:
                "no-store",
            }
          );

        // ==================================================
        // SAFE RESPONSE PARSING
        // ==================================================

        let data: any = null;

        try {
          data =
            await response.json();
        } catch {
          throw new Error(
            "Invalid response received from transaction API."
          );
        }

        console.log(
          "USER TRANSACTIONS API:",
          data
        );

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              `Unable to load transactions. (${response.status})`
          );
        }

        // ==================================================
        // SAFE TRANSACTION ARRAY
        // ==================================================

        const safeTransactions =
          Array.isArray(
            data?.transactions
          )
            ? data.transactions
            : [];

        // ==================================================
        // NORMALIZE
        // ==================================================

        const normalizedTransactions =
          safeTransactions.map(
            normalizeTransaction
          );

        setTransactions(
          normalizedTransactions
        );

      } catch (error) {
        console.error(
          "TRANSACTION LOAD ERROR:",
          error
        );

        setTransactions([]);

        setMessageType(
          "error"
        );

        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to load transaction history."
        );
      } finally {
        setLoading(false);
      }
    };

  // ========================================================
  // INITIAL LOAD
  // ========================================================

  useEffect(() => {
    if (
      !token ||
      !username
    ) {
      return;
    }

    loadTransactions();

    // loadTransactions intentionally
    // depends on token + username.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    token,
    username,
  ]);
    // ========================================================
  // FILTER TRANSACTIONS
  // ========================================================

  const filteredTransactions =
    useMemo(() => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      return transactions.filter(
        (item) => {
          // ==============================================
          // SEARCH VALUES
          // ==============================================

          const transactionType =
            String(
              item.transactionType ||
                ""
            ).toLowerCase();

          const walletType =
            String(
              item.walletType ||
                ""
            ).toLowerCase();

          const note =
            String(
              item.note || ""
            ).toLowerCase();

          const paymentMethod =
            String(
              item.paymentMethod ||
                ""
            ).toLowerCase();

          const transactionId =
            String(
              item.transactionId ||
                ""
            ).toLowerCase();

          const referenceId =
            String(
              item.referenceId ||
                ""
            ).toLowerCase();

          const transactionMode =
            String(
              item.transactionMode ||
                ""
            ).toLowerCase();

          const status =
            String(
              item.status ||
                ""
            ).toLowerCase();

          // ==============================================
          // SEARCH
          // ==============================================

          const searchMatch =
            !searchValue ||

            transactionType.includes(
              searchValue
            ) ||

            transactionMode.includes(
              searchValue
            ) ||

            walletType.includes(
              searchValue
            ) ||

            status.includes(
              searchValue
            ) ||

            note.includes(
              searchValue
            ) ||

            paymentMethod.includes(
              searchValue
            ) ||

            transactionId.includes(
              searchValue
            ) ||

            referenceId.includes(
              searchValue
            );

          // ==============================================
          // WALLET
          // ==============================================

          const walletMatch =
            walletFilter ===
              "ALL" ||
            item.walletType ===
              walletFilter;

          // ==============================================
          // STATUS
          // ==============================================

          const statusMatch =
            statusFilter ===
              "ALL" ||
            item.status ===
              statusFilter;

          return (
            searchMatch &&
            walletMatch &&
            statusMatch
          );
        }
      );
    }, [
      transactions,
      search,
      walletFilter,
      statusFilter,
    ]);

  // ========================================================
  // SUMMARY CALCULATIONS
  // ========================================================

  const totalTransactions =
    filteredTransactions.length;

  // ========================================================
  // CREDIT
  // ========================================================

  const totalCredits =
    filteredTransactions.filter(
      (item) =>
        item.transactionMode ===
        "CREDIT"
    ).length;

  // ========================================================
  // DEBIT
  // ========================================================

  const totalDebits =
    filteredTransactions.filter(
      (item) =>
        item.transactionMode ===
        "DEBIT"
    ).length;

  // ========================================================
  // RELEASE
  // ========================================================

  const totalReleases =
    filteredTransactions.filter(
      (item) =>
        item.transactionMode ===
        "RELEASE"
    ).length;

  // ========================================================
  // PENDING
  // ========================================================

  const pendingTransactions =
    filteredTransactions.filter(
      (item) =>
        item.status ===
        "Pending"
    ).length;

  // ========================================================
  // COMPLETED / APPROVED
  // ========================================================

  const completedTransactions =
    filteredTransactions.filter(
      (item) =>
        item.status ===
          "Completed" ||
        item.status ===
          "Approved"
    ).length;

  // ========================================================
  // REJECTED
  // ========================================================

  const rejectedTransactions =
    filteredTransactions.filter(
      (item) =>
        item.status ===
        "Rejected"
    ).length;

  // ========================================================
  // FAILED
  // ========================================================

  const failedTransactions =
    filteredTransactions.filter(
      (item) =>
        item.status ===
        "Failed"
    ).length;

  // ========================================================
  // TOTAL CREDIT AMOUNTS
  // ========================================================

  const totalCreditAmount =
    filteredTransactions
      .filter(
        (item) =>
          item.transactionMode ===
          "CREDIT"
      )
      .reduce(
        (total, item) =>
          total +
          Number(
            item.amount || 0
          ),
        0
      );

  // ========================================================
  // TOTAL DEBIT AMOUNTS
  // ========================================================

  const totalDebitAmount =
    filteredTransactions
      .filter(
        (item) =>
          item.transactionMode ===
          "DEBIT"
      )
      .reduce(
        (total, item) =>
          total +
          Number(
            item.amount || 0
          ),
        0
      );

  // ========================================================
  // WALLET COUNTS
  // ========================================================

  const pkrTransactions =
    filteredTransactions.filter(
      (item) =>
        item.walletType ===
        "PKR"
    ).length;

  const goldTransactions =
    filteredTransactions.filter(
      (item) =>
        item.walletType ===
        "GOLD"
    ).length;

  const usdtTransactions =
    filteredTransactions.filter(
      (item) =>
        item.walletType ===
        "USDT"
    ).length;
    
    /* ==========================================================
   LOADING SCREEN
========================================================== */

if (loading) {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400 text-xl font-bold">
      <RefreshCw className="animate-spin mr-3" size={26} />
      Loading Transaction History...
    </main>
  );
}

/* ==========================================================
   PAGE START
========================================================== */

return (
  <main className="min-h-screen bg-black text-white p-6">
    <div className="max-w-7xl mx-auto space-y-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="flex flex-wrap justify-between items-center gap-4">

        <div>

          <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
            <Wallet size={38} />
            Transaction History
          </h1>

          <p className="text-gray-400 mt-2">
            Complete PKR, Gold and USDT transaction history.
          </p>

        </div>

        <button
          type="button"
          onClick={loadTransactions}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold transition"
        >
          <RefreshCw size={18} />
          Refresh
        </button>

      </header>


      {/* =====================================================
          MESSAGE
      ===================================================== */}

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


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* TOTAL */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

          <p className="text-gray-400 text-sm">
            Total Transactions
          </p>

          <h2 className="text-3xl font-black text-cyan-400 mt-2">
            {totalTransactions}
          </h2>

        </div>


        {/* CREDIT */}

        <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <p className="text-gray-400 text-sm">
              Credit Transactions
            </p>

            <ArrowDownLeft
              size={20}
              className="text-green-400"
            />

          </div>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            {totalCredits}
          </h2>

        </div>


        {/* DEBIT */}

        <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <p className="text-gray-400 text-sm">
              Debit Transactions
            </p>

            <ArrowUpRight
              size={20}
              className="text-red-400"
            />

          </div>

          <h2 className="text-3xl font-black text-red-400 mt-2">
            {totalDebits}
          </h2>

        </div>


        {/* PENDING */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

          <div className="flex items-center justify-between">

            <p className="text-gray-400 text-sm">
              Pending Transactions
            </p>

            <Clock
              size={20}
              className="text-yellow-400"
            />

          </div>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            {pendingTransactions}
          </h2>

        </div>

      </section>


      {/* =====================================================
          SEARCH + FILTER
      ===================================================== */}

      <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">

        <div className="grid md:grid-cols-3 gap-4">

          {/* SEARCH */}

          <div className="relative">

            <Search
              className="absolute left-3 top-3 text-gray-500"
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transaction type or note..."
              className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-yellow-500"
            />

          </div>


          {/* WALLET FILTER */}

          <select
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
            className="bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
          >
            <option value="ALL">All Wallets</option>
            <option value="PKR">PKR Wallet</option>
            <option value="GOLD">Gold Wallet</option>
            <option value="USDT">USDT Wallet</option>
          </select>


          {/* STATUS FILTER */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as
                  | "ALL"
                  | "Pending"
                  | "Completed"
                  | "Rejected"
                  | "Failed"
              )
            }
            className="bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
          >
            <option value="ALL">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Rejected">Rejected</option>
            <option value="Failed">Failed</option>
          </select>

        </div>

      </section>     
       {/* =====================================================
          TRANSACTION LEDGER
      ===================================================== */}

      <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-black text-cyan-400">
            Transaction Ledger
          </h2>

          <button
            type="button"
            onClick={loadTransactions}
            className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </div>


        {filteredTransactions.length === 0 ? (

          <div className="text-center py-12 text-gray-500">
            No transactions found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left min-w-[1100px]">

              <thead>

                <tr className="border-b border-zinc-700 text-cyan-400">

                  <th className="p-3">Wallet</th>
                  <th className="p-3">Transaction</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Before</th>
                  <th className="p-3">After</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Date</th>

                </tr>

              </thead>


              <tbody>

                {filteredTransactions.map((item) => (

                  <tr
                    key={item._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                  >

                    {/* =========================================
                        WALLET
                    ========================================= */}

                    <td className="p-3">

                      <div className="flex items-center gap-2">

                        {item.walletType === "PKR" && (
                          <Wallet
                            size={18}
                            className="text-green-400"
                          />
                        )}

                        {item.walletType === "GOLD" && (
                          <Coins
                            size={18}
                            className="text-yellow-400"
                          />
                        )}

                        {item.walletType === "USDT" && (
                          <DollarSign
                            size={18}
                            className="text-blue-400"
                          />
                        )}

                        <span className="font-semibold">
                          {item.walletType}
                        </span>

                      </div>

                    </td>


                    {/* =========================================
                        TYPE
                    ========================================= */}

                    <td className="p-3">

                      <div>

                        <p className="font-bold text-yellow-400">
                          {item.transactionType.replaceAll("_", " ")}
                        </p>

                        <p className="text-xs text-gray-500">
                          {item.paymentMethod || "GoldTrade Enterprise"}
                        </p>

                        {item.note && (
                          <p className="text-xs text-gray-400 mt-1">
                            {item.note}
                          </p>
                        )}

                      </div>

                    </td>


                    {/* =========================================
                        CREDIT / DEBIT
                    ========================================= */}

                    <td className="p-3">

                      {item.transactionMode === "CREDIT" ? (

                        <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">

                          <ArrowDownLeft size={15} />

                          CREDIT

                        </span>

                      ) : (

                        <span className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">

                          <ArrowUpRight size={15} />

                          DEBIT

                        </span>

                      )}

                    </td>


                    {/* =========================================
                        AMOUNT
                    ========================================= */}

                    <td className="p-3 font-bold">

                      {item.walletType === "PKR" ? (

                        <span
                          className={
                            item.transactionMode === "CREDIT"
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          PKR {Number(item.amount).toLocaleString()}
                        </span>

                      ) : item.walletType === "GOLD" ? (

                        <span
                          className={
                            item.transactionMode === "CREDIT"
                              ? "text-yellow-400"
                              : "text-orange-400"
                          }
                        >
                          {Number(item.amount).toFixed(2)} g
                        </span>

                      ) : (

                        <span
                          className={
                            item.transactionMode === "CREDIT"
                              ? "text-blue-400"
                              : "text-red-400"
                          }
                        >
                          {Number(item.amount).toFixed(2)} USDT
                        </span>

                      )}

                    </td>


                    {/* =========================================
                        BALANCE BEFORE
                    ========================================= */}

                    <td className="p-3 text-gray-300">

                      {item.walletType === "PKR"
                        ? `PKR ${Number(item.balanceBefore).toLocaleString()}`
                        : item.walletType === "GOLD"
                        ? `${Number(item.balanceBefore).toFixed(2)} g`
                        : `${Number(item.balanceBefore).toFixed(2)} USDT`}

                    </td>


                    {/* =========================================
                        BALANCE AFTER
                    ========================================= */}

                    <td className="p-3 text-green-400 font-semibold">

                      {item.walletType === "PKR"
                        ? `PKR ${Number(item.balanceAfter).toLocaleString()}`
                        : item.walletType === "GOLD"
                        ? `${Number(item.balanceAfter).toFixed(2)} g`
                        : `${Number(item.balanceAfter).toFixed(2)} USDT`}

                    </td>


                    {/* =========================================
                        STATUS
                    ========================================= */}

                    <td className="p-3">

                      {item.status === "Completed" && (

                        <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">

                          <CheckCircle size={15} />

                          Completed

                        </span>

                      )}


                      {item.status === "Pending" && (

                        <span className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">

                          <Clock size={15} />

                          Pending

                        </span>

                      )}


                      {item.status === "Rejected" && (

                        <span className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">

                          <XCircle size={15} />

                          Rejected

                        </span>

                      )}


                      {item.status === "Failed" && (

                        <span className="inline-flex items-center gap-2 bg-red-700/20 text-red-500 px-3 py-1 rounded-full text-sm font-bold">

                          <XCircle size={15} />

                          Failed

                        </span>

                      )}

                    </td>


                    {/* =========================================
                        DATE
                    ========================================= */}

                    <td className="p-3 whitespace-nowrap text-gray-400 text-sm">

                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : "N/A"}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* =====================================================
          MOBILE TRANSACTION HISTORY
      ===================================================== */}

      <section className="lg:hidden space-y-4">

        <h2 className="text-2xl font-black text-cyan-400">
          Mobile Transaction History
        </h2>


        {filteredTransactions.length === 0 ? (

          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 text-center text-gray-500">
            No transactions found.
          </div>

        ) : (

          filteredTransactions.map((item) => (

            <div
              key={`mobile-${item._id}`}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4"
            >

              {/* ================= TOP ROW ================= */}

              <div className="flex justify-between items-center">

                <div className="flex items-center gap-3">

                  {item.walletType === "PKR" && (
                    <Wallet
                      size={24}
                      className="text-green-400"
                    />
                  )}

                  {item.walletType === "GOLD" && (
                    <Coins
                      size={24}
                      className="text-yellow-400"
                    />
                  )}

                  {item.walletType === "USDT" && (
                    <DollarSign
                      size={24}
                      className="text-blue-400"
                    />
                  )}

                  <div>

                    <p className="font-bold text-yellow-400">
                      {item.transactionType.replaceAll("_", " ")}
                    </p>

                    <p className="text-xs text-gray-500">
                      {item.walletType} Wallet
                    </p>

                  </div>

                </div>


                {/* STATUS */}

                {item.status === "Completed" && (

                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                    Completed
                  </span>

                )}

                {item.status === "Pending" && (

                  <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold">
                    Pending
                  </span>

                )}

                {item.status === "Rejected" && (

                  <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                    Rejected
                  </span>

                )}

                {item.status === "Failed" && (

                  <span className="bg-red-700/20 text-red-500 px-3 py-1 rounded-full text-xs font-bold">
                    Failed
                  </span>

                )}

              </div>


              {/* ================= AMOUNT ================= */}

              <div className="bg-black rounded-xl p-4">

                <p className="text-xs text-gray-500 mb-2">
                  Transaction Amount
                </p>

                <div className="flex items-center gap-3">

                  {item.transactionMode === "CREDIT" ? (

                    <ArrowDownLeft
                      className="text-green-400"
                      size={24}
                    />

                  ) : (

                    <ArrowUpRight
                      className="text-red-400"
                      size={24}
                    />

                  )}

                  <h3
                    className={`text-xl font-black ${
                      item.transactionMode === "CREDIT"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >

                    {item.walletType === "PKR"
                      ? `PKR ${Number(item.amount).toLocaleString()}`
                      : item.walletType === "GOLD"
                      ? `${Number(item.amount).toFixed(2)} g`
                      : `${Number(item.amount).toFixed(2)} USDT`}

                  </h3>

                </div>

                <p className="text-xs text-gray-500 mt-2">
                  {item.transactionMode}
                </p>

              </div>


              {/* ================= BALANCE INFO ================= */}

              <div className="grid grid-cols-2 gap-3">

                <div className="bg-zinc-800 rounded-xl p-3">

                  <p className="text-xs text-gray-500">
                    Balance Before
                  </p>

                  <p className="font-bold text-white mt-1">

                    {item.walletType === "PKR"
                      ? `PKR ${Number(item.balanceBefore).toLocaleString()}`
                      : item.walletType === "GOLD"
                      ? `${Number(item.balanceBefore).toFixed(2)} g`
                      : `${Number(item.balanceBefore).toFixed(2)} USDT`}

                  </p>

                </div>


                <div className="bg-zinc-800 rounded-xl p-3">

                  <p className="text-xs text-gray-500">
                    Balance After
                  </p>

                  <p className="font-bold text-green-400 mt-1">

                    {item.walletType === "PKR"
                      ? `PKR ${Number(item.balanceAfter).toLocaleString()}`
                      : item.walletType === "GOLD"
                      ? `${Number(item.balanceAfter).toFixed(2)} g`
                      : `${Number(item.balanceAfter).toFixed(2)} USDT`}

                  </p>

                </div>

              </div>


              {/* ================= PAYMENT INFO ================= */}

              <div className="space-y-2">

                <div className="flex justify-between text-sm">

                  <span className="text-gray-500">
                    Payment Method
                  </span>

                  <span className="text-white font-medium">
                    {item.paymentMethod || "GoldTrade"}
                  </span>

                </div>


                {item.note && (

                  <div className="flex justify-between text-sm">

                    <span className="text-gray-500">
                      Note
                    </span>

                    <span className="text-gray-300 text-right">
                      {item.note}
                    </span>

                  </div>

                )}

              </div>


              {/* ================= DATE ================= */}

              <div className="border-t border-zinc-800 pt-3">

                <div className="flex items-center gap-2 text-xs text-gray-500">

                  <Clock size={14} />

                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString()
                    : "N/A"}

                </div>

              </div>

            </div>

          ))

        )}

      </section>      {/* =====================================================
          TRANSACTION SUMMARY
      ===================================================== */}

      <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">

        <h2 className="text-2xl font-black text-purple-400 mb-6">
          Wallet Transaction Summary
        </h2>

        <div className="grid md:grid-cols-3 gap-5">

          {/* =================================================
              PKR
          ================================================= */}

          <div className="bg-black rounded-xl p-5 border border-green-600">

            <div className="flex items-center gap-3 mb-3">

              <Wallet
                className="text-green-400"
                size={22}
              />

              <h3 className="font-bold text-green-400">
                PKR Wallet
              </h3>

            </div>

            <p className="text-gray-400 text-sm">
              Transactions
            </p>

            <p className="text-2xl font-black text-green-400 mt-2">

              {
                filteredTransactions.filter(
                  (item) => item.walletType === "PKR"
                ).length
              }

            </p>

          </div>


          {/* =================================================
              GOLD
          ================================================= */}

          <div className="bg-black rounded-xl p-5 border border-yellow-600">

            <div className="flex items-center gap-3 mb-3">

              <Coins
                className="text-yellow-400"
                size={22}
              />

              <h3 className="font-bold text-yellow-400">
                Gold Wallet
              </h3>

            </div>

            <p className="text-gray-400 text-sm">
              Transactions
            </p>

            <p className="text-2xl font-black text-yellow-400 mt-2">

              {
                filteredTransactions.filter(
                  (item) => item.walletType === "GOLD"
                ).length
              }

            </p>

          </div>


          {/* =================================================
              USDT
          ================================================= */}

          <div className="bg-black rounded-xl p-5 border border-blue-600">

            <div className="flex items-center gap-3 mb-3">

              <DollarSign
                className="text-blue-400"
                size={22}
              />

              <h3 className="font-bold text-blue-400">
                USDT Wallet
              </h3>

            </div>

            <p className="text-gray-400 text-sm">
              Transactions
            </p>

            <p className="text-2xl font-black text-blue-400 mt-2">

              {
                filteredTransactions.filter(
                  (item) => item.walletType === "USDT"
                ).length
              }

            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          ENTERPRISE SECURITY NOTICE
      ===================================================== */}

      <section className="bg-zinc-900 border border-red-600 rounded-2xl p-6">

        <h2 className="text-2xl font-black text-red-400 mb-5">
          Enterprise Transaction Security
        </h2>

        <div className="space-y-4 text-gray-300">

          <div className="flex gap-3 items-start">

            <CheckCircle
              className="text-green-400 mt-1"
              size={18}
            />

            <p>
              Every Deposit, Withdraw, Buy, Sell and Wallet update is permanently recorded.
            </p>

          </div>


          <div className="flex gap-3 items-start">

            <CheckCircle
              className="text-green-400 mt-1"
              size={18}
            />

            <p>
              Transaction History is a read-only audit ledger for users.
            </p>

          </div>


          <div className="flex gap-3 items-start">

            <CheckCircle
              className="text-green-400 mt-1"
              size={18}
            />

            <p>
              Wallet balances cannot be edited from this page.
            </p>

          </div>


          <div className="flex gap-3 items-start">

            <CheckCircle
              className="text-green-400 mt-1"
              size={18}
            />

            <p>
              Admin actions create audit records inside the Enterprise Ledger.
            </p>

          </div>


          <div className="flex gap-3 items-start">

            <CheckCircle
              className="text-green-400 mt-1"
              size={18}
            />

            <p>
              All timestamps use server time and remain available for future reports.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          INFORMATION PANEL
      ===================================================== */}

      <section className="bg-zinc-900 border border-cyan-600 rounded-2xl p-6">

        <h2 className="text-2xl font-black text-cyan-400 mb-5">
          Transaction Status Guide
        </h2>

        <div className="grid md:grid-cols-2 gap-4">


          {/* =================================================
              COMPLETED
          ================================================= */}

          <div className="bg-black rounded-xl p-4 border border-green-700">

            <div className="flex items-center gap-2 text-green-400 font-bold">

              <CheckCircle size={18} />

              Completed

            </div>

            <p className="text-sm text-gray-400 mt-2">
              Transaction successfully processed.
            </p>

          </div>


          {/* =================================================
              PENDING
          ================================================= */}

          <div className="bg-black rounded-xl p-4 border border-yellow-700">

            <div className="flex items-center gap-2 text-yellow-400 font-bold">

              <Clock size={18} />

              Pending

            </div>

            <p className="text-sm text-gray-400 mt-2">
              Waiting for admin verification or processing.
            </p>

          </div>


          {/* =================================================
              REJECTED
          ================================================= */}

          <div className="bg-black rounded-xl p-4 border border-red-700">

            <div className="flex items-center gap-2 text-red-400 font-bold">

              <XCircle size={18} />

              Rejected

            </div>

            <p className="text-sm text-gray-400 mt-2">
              Request rejected by administrator.
            </p>

          </div>


          {/* =================================================
              FAILED
          ================================================= */}

          <div className="bg-black rounded-xl p-4 border border-red-900">

            <div className="flex items-center gap-2 text-red-500 font-bold">

              <XCircle size={18} />

              Failed

            </div>

            <p className="text-sm text-gray-400 mt-2">
              Transaction failed due to validation or processing error.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center">

        <h3 className="text-yellow-400 font-black text-xl">
          GoldTrade V18 Enterprise
        </h3>

        <p className="text-gray-400 mt-2">
          User Transaction Audit Ledger
        </p>


        <div className="flex flex-wrap justify-center gap-3 mt-5">

          <span className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold">
            PKR Wallet
          </span>

          <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-semibold">
            Gold Wallet
          </span>

          <span className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-sm font-semibold">
            USDT Wallet
          </span>

        </div>


        <p className="text-gray-500 text-xs mt-6">
          GoldTrade Enterprise Ledger • Secure • Auditable • Read Only
        </p>

      </footer>

    </div>
  </main>
);
}