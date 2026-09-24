"use client";

/* ==========================================================
   GoldTrade V18 Enterprise
   User Withdraw Page
   Linux + Render + Vercel Compatible
========================================================== */

import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ArrowUpRight,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com";

/* ==========================================================
   TYPES
========================================================== */

interface WithdrawRequest {
  _id: string;
  withdrawAmount: number;
  walletType: "PKR" | "GOLD" | "USDT";
  paymentMethod: "JazzCash" | "Easypaisa" | "Bank" | "USDT";
  accountTitle: string;
  accountNumber: string;
  transactionId?: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNote?: string;
  createdAt: string;
}

/* ==========================================================
   COMPONENT
========================================================== */

export default function WithdrawPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const username =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  /* ================= STATES ================= */

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [walletType, setWalletType] =
    useState<"PKR" | "GOLD" | "USDT">("PKR");

  const [paymentMethod, setPaymentMethod] =
    useState<"JazzCash" | "Easypaisa" | "Bank" | "USDT">("JazzCash");

  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const [history, setHistory] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  /* ==========================================================
     LOAD HISTORY
  ========================================================== */

  const loadHistory = async () => {
    try {
      const response = await fetch(
        `${API}/api/withdraw/history/${username}`,
        { headers }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load history.");
      }

      setHistory(data.history || []);
    } catch (error) {
      console.error("WITHDRAW HISTORY:", error);

      setMessageType("error");
      setMessage("Unable to load withdraw history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && username) {
      loadHistory();
    } else {
      setLoading(false);
    }
  }, []);

  /* ==========================================================
     HISTORY SUMMARY
  ========================================================== */

  const pendingCount = useMemo(
    () => history.filter((item) => item.status === "Pending").length,
    [history]
  );

  const approvedCount = useMemo(
    () => history.filter((item) => item.status === "Approved").length,
    [history]
  );

  const rejectedCount = useMemo(
    () => history.filter((item) => item.status === "Rejected").length,
    [history]
  );
    /* ==========================================================
     SUBMIT WITHDRAW REQUEST
  ========================================================== */

  const submitWithdraw = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setMessage("");

    const amount = Number(withdrawAmount);

    if (!amount || amount <= 0) {
      setMessageType("error");
      setMessage("Enter a valid withdraw amount.");
      return;
    }

    if (!accountTitle.trim()) {
      setMessageType("error");
      setMessage("Account title is required.");
      return;
    }

    if (!accountNumber.trim()) {
      setMessageType("error");
      setMessage("Account number or wallet is required.");
      return;
    }

    try {
      setSending(true);

      const response = await fetch(`${API}/api/withdraw`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          withdrawAmount: amount,
          walletType,
          paymentMethod,
          accountTitle: accountTitle.trim(),
          accountNumber: accountNumber.trim(),
          iban: iban.trim(),
          walletAddress: walletAddress.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Withdraw request failed."
        );
      }

      setMessageType("success");
      setMessage(
        "Withdraw request submitted successfully."
      );

      // Reset Form
      setWithdrawAmount("");
      setWalletType("PKR");
      setPaymentMethod("JazzCash");
      setAccountTitle("");
      setAccountNumber("");
      setIban("");
      setWalletAddress("");

      await loadHistory();

    } catch (error) {
      console.error("SUBMIT WITHDRAW:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit withdraw request."
      );
    } finally {
      setSending(false);
    }
  };

  /* ==========================================================
     LOADING SCREEN
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400 text-xl font-bold">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading Withdraw Manager...
      </main>
    );
  }

  /* ==========================================================
     PAGE START
  ========================================================== */

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap justify-between items-center gap-4">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <ArrowUpRight size={38} />
              Withdraw Funds
            </h1>

            <p className="text-gray-400 mt-2">
              Submit PKR, Gold and USDT withdraw requests securely.
            </p>

          </div>

          <button
            type="button"
            onClick={loadHistory}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
          >
            <RefreshCw size={18} />
            Refresh History
          </button>

        </header>

        {/* ================= MESSAGE ================= */}

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

        {/* ================= SUMMARY CARDS ================= */}

        <section className="grid md:grid-cols-3 gap-5">

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Pending Requests
            </p>

            <h2 className="text-3xl font-black text-yellow-400 mt-2">
              {pendingCount}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Approved Requests
            </p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              {approvedCount}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Rejected Requests
            </p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              {rejectedCount}
            </h2>

          </div>

        </section>

        {/* ===================================================== */}
        {/* WITHDRAW REQUEST FORM */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-yellow-400 mb-6">
            Create Withdraw Request
          </h2>

          <form
            onSubmit={submitWithdraw}
            className="space-y-5"
          >            {/* ================= WITHDRAW AMOUNT ================= */}

            <div>
              <label className="block mb-2 text-green-400 font-semibold">
                Withdraw Amount
              </label>

              <input
                type="number"
                min="1"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter withdraw amount"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-green-500"
                required
              />
            </div>

            {/* ================= WALLET TYPE ================= */}

            <div>
              <label className="block mb-2 text-yellow-400 font-semibold">
                Wallet Type
              </label>

              <select
                value={walletType}
                onChange={(e) =>
                  setWalletType(
                    e.target.value as "PKR" | "GOLD" | "USDT"
                  )
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              >
                <option value="PKR">PKR Wallet</option>
                <option value="GOLD">Gold Wallet</option>
                <option value="USDT">USDT Wallet</option>
              </select>
            </div>

            {/* ================= PAYMENT METHOD ================= */}

            <div>
              <label className="block mb-2 text-cyan-400 font-semibold">
                Payment Method
              </label>

              <select
                value={paymentMethod}
                onChange={(e) =>
                  setPaymentMethod(
                    e.target.value as
                      | "JazzCash"
                      | "Easypaisa"
                      | "Bank"
                      | "USDT"
                  )
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-500"
              >
                <option value="JazzCash">JazzCash</option>
                <option value="Easypaisa">Easypaisa</option>
                <option value="Bank">Bank Transfer</option>
                <option value="USDT">USDT Wallet</option>
              </select>
            </div>

            {/* ================= ACCOUNT TITLE ================= */}

            <div>
              <label className="block mb-2 text-white font-semibold">
                Account Title
              </label>

              <input
                type="text"
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                placeholder="Enter account holder name"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-white"
                required
              />
            </div>

            {/* ================= ACCOUNT NUMBER ================= */}

            <div>
              <label className="block mb-2 text-white font-semibold">
                Account Number / Wallet
              </label>

              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="03XXXXXXXXX / Wallet Address"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-white"
                required
              />
            </div>

            {/* ================= BANK IBAN ================= */}

            {paymentMethod === "Bank" && (
              <div>
                <label className="block mb-2 text-green-400 font-semibold">
                  IBAN Number
                </label>

                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  placeholder="PK00XXXX0000000000000000"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-green-500"
                />
              </div>
            )}

            {/* ================= USDT ADDRESS ================= */}

            {paymentMethod === "USDT" && (
              <div>
                <label className="block mb-2 text-blue-400 font-semibold">
                  USDT Wallet Address
                </label>

                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="TRC20 / BEP20 Wallet Address"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>
            )}

            {/* ================= SUBMIT BUTTON ================= */}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-700 disabled:cursor-not-allowed text-black py-3 rounded-xl font-bold transition"
            >
              {sending
                ? "Submitting Withdraw Request..."
                : "Submit Withdraw Request"}
            </button>

          </form>

        </section>

        {/* ===================================================== */}
        {/* WITHDRAW HISTORY */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-black text-cyan-400">
              Withdraw History
            </h2>

            <button
              type="button"
              onClick={loadHistory}
              className="bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

          </div>

          {history.length === 0 ? (

            <div className="text-center py-10 text-gray-500">
              No withdraw requests found.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left min-w-[900px]">

                <thead>

                  <tr className="border-b border-zinc-700 text-cyan-400">

                    <th className="p-3">Amount</th>
                    <th className="p-3">Wallet</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Account</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>

                  </tr>

                </thead>

                <tbody>

                  {history.map((item) => (

                    <tr
                      key={item._id}
                      className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                    >

                      <td className="p-3 text-green-400 font-bold whitespace-nowrap">
                        {item.walletType === "PKR"
                          ? `PKR ${Number(item.withdrawAmount).toLocaleString()}`
                          : item.walletType === "GOLD"
                          ? `${Number(item.withdrawAmount).toFixed(2)} g`
                          : `${Number(item.withdrawAmount).toFixed(2)} USDT`}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {item.walletType}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {item.paymentMethod}
                      </td>

                      <td className="p-3 break-all">
                        <div>
                          <p className="font-semibold text-white">
                            {item.accountTitle}
                          </p>

                          <p className="text-xs text-gray-500">
                            {item.accountNumber}
                          </p>
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">

                        {item.status === "Pending" && (
                          <span className="inline-flex items-center gap-2 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-bold">
                            <Clock size={15} />
                            Pending
                          </span>
                        )}

                        {item.status === "Approved" && (
                          <span className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-bold">
                            <CheckCircle size={15} />
                            Approved
                          </span>
                        )}

                        {item.status === "Rejected" && (
                          <span className="inline-flex items-center gap-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                            <XCircle size={15} />
                            Rejected
                          </span>
                        )}

                      </td>

                      <td className="p-3 whitespace-nowrap text-gray-500 text-sm">
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

        {/* ===================================================== */}
        {/* ENTERPRISE SECURITY NOTICE */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-red-600 rounded-2xl p-6">

          <h3 className="text-xl font-black text-red-400 mb-4">
            Withdraw Security Policy
          </h3>

          <ul className="space-y-3 text-gray-300 list-disc pl-5">

            <li>Every withdraw request starts with <strong>Pending</strong> status.</li>

            <li>Admin verifies the request before approval.</li>

            <li>Approval changes request status only.</li>

            <li>No PKR, Gold or USDT wallet balance is deducted automatically.</li>

            <li>Wallet Manager is the only module allowed to debit balances.</li>

            <li>Every request remains permanently in history for audit purposes.</li>

          </ul>

        </section>

        {/* ===================================================== */}
        {/* FOOTER */}
        {/* ===================================================== */}

        <footer className="text-center py-8">

          <h3 className="text-yellow-400 font-black text-xl">
            GoldTrade V18 Enterprise
          </h3>

          <p className="text-gray-500 mt-2">
            Secure Withdraw Request System
          </p>

          <p className="text-green-400 text-sm mt-3 font-semibold">
            Enterprise Rule: Withdraw Manager never updates wallet balances.
          </p>

        </footer>

      </div>

    </main>
  );
}