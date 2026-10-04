"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  Wallet,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";

// =====================================================
// GOLDTRADE V18
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-api.onrender.com";

// =====================================================
// TYPES
// =====================================================

interface WalletHistory {
  _id: string;

  username: string;

  walletType: "PKR" | "Gold" | "USDT" | string;

  action: "Credit" | "Debit";

  amount: number;

  previousBalance: number;

  newBalance: number;

  reason: string;

  createdAt: string;

  admin?: string;
}

// =====================================================
// PAGE
// =====================================================

export default function WalletHistoryPage() {
  // ===================================================
  // STATE
  // ===================================================

  const [history, setHistory] = useState<WalletHistory[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [filterWallet, setFilterWallet] =
    useState("ALL");

  const [filterAction, setFilterAction] =
    useState("ALL");

  // ===================================================
  // TOKEN
  // ===================================================

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  // ===================================================
  // AUTH HEADERS
  // ===================================================

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // ===================================================
  // LOAD WALLET HISTORY
  // ===================================================

  const loadHistory = async () => {
    try {
      setLoading(true);

      // =================================================
      // IMPORTANT
      //
      // GoldTrade V18 admin wallet-history endpoint
      // =================================================

      const response = await fetch(
        `${API}/api/admin/wallet/history/all`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

      // =================================================
      // READ RESPONSE SAFELY
      // =================================================

      const data = await response.json();

      console.log(
        "WALLET HISTORY RESPONSE:",
        data
      );

      // =================================================
      // AUTH ERROR
      // =================================================

      if (response.status === 401) {
        localStorage.removeItem("token");

        window.location.replace("/login");

        return;
      }

      // =================================================
      // SERVER ERROR
      // =================================================

      if (!response.ok) {
        console.error(
          "Wallet History API Error:",
          data
        );

        setHistory([]);

        return;
      }

      // =================================================
      // RESPONSE SUCCESS CHECK
      // =================================================

      if (!data?.success) {
        console.error(
          "Wallet History Request Failed:",
          data?.message
        );

        setHistory([]);

        return;
      }

      // =================================================
      // BACKEND MAY RETURN:
      //
      // history
      // transactions
      // =================================================

      const rawHistory =
        Array.isArray(data?.history)
          ? data.history
          : Array.isArray(data?.transactions)
          ? data.transactions
          : [];

      // =================================================
      // NORMALIZE BACKEND DATA
      //
      // Backend wallet-history records can use:
      //
      // type
      // transactionType
      // action
      //
      // Frontend UI uses:
      //
      // action = Credit / Debit
      // reason
      // =================================================

      const normalizedHistory: WalletHistory[] =
        rawHistory.map(
          (item: any) => {
            // -------------------------------------------
            // ACTION
            // -------------------------------------------

            const rawAction =
              String(
                item?.action ||
                  item?.type ||
                  item?.transactionMode ||
                  ""
              )
                .trim()
                .toUpperCase();

            const action =
              rawAction === "DEBIT" ||
              rawAction === "DEDUCT" ||
              rawAction === "WITHDRAW" ||
              rawAction === "WITHDRAWAL"
                ? "Debit"
                : "Credit";

            // -------------------------------------------
            // WALLET TYPE
            // -------------------------------------------

            const rawWallet =
              String(
                item?.walletType ||
                  "PKR"
              ).trim();

            let walletType =
              rawWallet;

            if (
              rawWallet.toUpperCase() ===
              "GOLD"
            ) {
              walletType = "Gold";
            } else if (
              rawWallet.toUpperCase() ===
              "USDT"
            ) {
              walletType = "USDT";
            } else if (
              rawWallet.toUpperCase() ===
              "PKR"
            ) {
              walletType = "PKR";
            }

            // -------------------------------------------
            // AMOUNT
            // -------------------------------------------

            const amount =
              Number(
                item?.amount ??
                  item?.WalletAmount ??
                  item?.walletAmount ??
                  0
              );

            // -------------------------------------------
            // PREVIOUS BALANCE
            // -------------------------------------------

            const previousBalance =
              Number(
                item?.previousBalance ??
                  item?.balanceBefore ??
                  0
              );

            // -------------------------------------------
            // NEW BALANCE
            // -------------------------------------------

            const newBalance =
              Number(
                item?.newBalance ??
                  item?.balanceAfter ??
                  0
              );

            // -------------------------------------------
            // REASON
            // -------------------------------------------

            const reason =
              String(
                item?.reason ??
                  item?.note ??
                  item?.description ??
                  item?.transactionType ??
                  ""
              );

            // -------------------------------------------
            // ADMIN
            // -------------------------------------------

            const admin =
              item?.adminUsername ||
              item?.admin ||
              item?.createdBy ||
              "Admin";

            // -------------------------------------------
            // FINAL OBJECT
            // -------------------------------------------

            return {
              _id:
                String(
                  item?._id ||
                    item?.id ||
                    `${Date.now()}-${Math.random()}`
                ),

              username:
                String(
                  item?.username ||
                    item?.user?.username ||
                    "Unknown"
                ),

              walletType,

              action,

              amount,

              previousBalance,

              newBalance,

              reason,

              createdAt:
                item?.createdAt ||
                item?.date ||
                new Date().toISOString(),

              admin,
            };
          }
        );

      // =================================================
      // SAVE HISTORY
      // =================================================

      setHistory(
        normalizedHistory
      );
    } catch (err) {
      console.error(
        "Wallet History Error:",
        err
      );

      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (token) {
      loadHistory();
    } else {
      setLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===================================================
  // FILTERS
  // ===================================================

  const filteredHistory = useMemo(() => {
    return history.filter(
      (item) => {
        const searchValue =
          search
            .trim()
            .toLowerCase();

        const username =
          String(
            item.username || ""
          ).toLowerCase();

        const reason =
          String(
            item.reason || ""
          ).toLowerCase();

        const searchMatch =
          !searchValue ||
          username.includes(
            searchValue
          ) ||
          reason.includes(
            searchValue
          );

        const walletMatch =
          filterWallet === "ALL" ||
          item.walletType ===
            filterWallet;

        const actionMatch =
          filterAction === "ALL" ||
          item.action ===
            filterAction;

        return (
          searchMatch &&
          walletMatch &&
          actionMatch
        );
      }
    );
  }, [
    history,
    search,
    filterWallet,
    filterAction,
  ]);

  // ===================================================
  // SUMMARY
  // ===================================================

  const totalCredit =
    filteredHistory
      .filter(
        (item) =>
          item.action === "Credit"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      );

  const totalDebit =
    filteredHistory
      .filter(
        (item) =>
          item.action === "Debit"
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount || 0
          ),
        0
      );

  // ===================================================
  // LOADING SCREEN
  // ===================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw
          className="animate-spin mr-3"
          size={26}
        />

        Loading Wallet History...
      </main>
    );
  }

    // ===================================================
  // UI
  // ===================================================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}

        <header className="flex flex-wrap items-center justify-between gap-4">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">

              <Wallet size={38} />

              Wallet History

            </h1>

            <p className="text-gray-400 mt-2">
              Complete PKR, Gold and USDT wallet transaction history.
            </p>

          </div>

          <div className="flex gap-3">

            <Link
              href="/admin-dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />

              Dashboard
            </Link>

            <button
              onClick={loadHistory}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-3 rounded-xl flex items-center gap-2 font-bold disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

          </div>

        </header>

        {/* Summary Cards */}

        <section className="grid md:grid-cols-3 gap-5">

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-6">

            <p className="text-gray-400">
              Total Credits
            </p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              Pkr{" "}
              {totalCredit.toLocaleString()}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-6">

            <p className="text-gray-400">
              Total Debits
            </p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              Pkr{" "}
              {totalDebit.toLocaleString()}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

            <p className="text-gray-400">
              Total Records
            </p>

            <h2 className="text-3xl font-black text-yellow-400 mt-2">
              {filteredHistory.length}
            </h2>

          </div>

        </section>

        {/* Search & Filters */}

        <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">

          <div className="grid md:grid-cols-3 gap-4">

            <div className="relative">

              <Search
                className="absolute left-3 top-3 text-gray-500"
                size={18}
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search username or reason..."
                className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-yellow-500"
              />

            </div>

            <select
              value={filterWallet}
              onChange={(e) =>
                setFilterWallet(
                  e.target.value
                )
              }
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3"
            >

              <option value="ALL">
                All Wallets
              </option>

              <option value="PKR">
                PKR Wallet
              </option>

              <option value="Gold">
                Gold Wallet
              </option>

              <option value="USDT">
                USDT Wallet
              </option>

            </select>

            <select
              value={filterAction}
              onChange={(e) =>
                setFilterAction(
                  e.target.value
                )
              }
              className="bg-black border border-zinc-700 rounded-xl px-4 py-3"
            >

              <option value="ALL">
                All Actions
              </option>

              <option value="Credit">
                Credit
              </option>

              <option value="Debit">
                Debit
              </option>

            </select>

          </div>

        </section>

        {/* History Table */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-cyan-400 mb-5">
            Wallet Transactions
          </h2>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead>

                <tr className="border-b border-zinc-700 text-cyan-400">

                  <th className="p-3">
                    User
                  </th>

                  <th className="p-3">
                    Wallet
                  </th>

                  <th className="p-3">
                    Action
                  </th>

                  <th className="p-3">
                    Amount
                  </th>

                  <th className="p-3">
                    Previous
                  </th>

                  <th className="p-3">
                    New Balance
                  </th>

                  <th className="p-3">
                    Reason
                  </th>

                  <th className="p-3">
                    Date
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredHistory.length === 0 ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="p-6 text-center text-gray-500"
                    >
                      No wallet history found.
                    </td>

                  </tr>

                ) : (

                  filteredHistory.map(
                    (item) => (

                      <tr
                        key={item._id}
                        className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                      >

                        <td className="p-3 font-semibold text-yellow-400">
                          {item.username}
                        </td>

                        <td className="p-3">

                          <span className="bg-zinc-800 px-3 py-1 rounded-full text-sm">
                            {item.walletType}
                          </span>

                        </td>

                        <td className="p-3">

                          {item.action === "Credit" ? (

                            <span className="flex items-center gap-2 text-green-400 font-semibold">

                              <CheckCircle
                                size={16}
                              />

                              Credit

                            </span>

                          ) : (

                            <span className="flex items-center gap-2 text-red-400 font-semibold">

                              <XCircle
                                size={16}
                              />

                              Debit

                            </span>

                          )}

                        </td>

                        <td
                          className={`p-3 font-bold ${
                            item.action ===
                            "Credit"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          Pkr{" "}
                          {Number(
                            item.amount || 0
                          ).toLocaleString()}
                        </td>

                        <td className="p-3 text-gray-400">
                          Pkr{" "}
                          {Number(
                            item.previousBalance ||
                              0
                          ).toLocaleString()}
                        </td>

                        <td className="p-3 text-cyan-400 font-semibold">
                          Pkr{" "}
                          {Number(
                            item.newBalance ||
                              0
                          ).toLocaleString()}
                        </td>

                        <td className="p-3 text-gray-300">
                          {item.reason || "-"}
                        </td>

                        <td className="p-3 text-gray-500 whitespace-nowrap">
                          {item.createdAt
                            ? new Date(
                                item.createdAt
                              ).toLocaleString()
                            : "-"}
                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>
    </main>
  );
}