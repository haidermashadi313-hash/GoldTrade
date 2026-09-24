"use client";

/* ==========================================================
   GoldTrade V18 Enterprise
   User Deposit Page (PART 1/3)
   Linux + Render + Vercel Compatible
========================================================== */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  CreditCard,
  RefreshCw,
  Upload,
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

interface PaymentSettings {
  jazzCashNumber: string;
  jazzCashTitle: string;

  easypaisaNumber: string;
  easypaisaTitle: string;

  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  iban: string;

  usdtTRC20: string;
  usdtBEP20: string;
  usdtERC20: string;

  jazzCashEnabled: boolean;
  easypaisaEnabled: boolean;
  bankEnabled: boolean;
  usdtEnabled: boolean;
}

interface DepositItem {
  _id: string;
  requestAmount: number;
  paymentMethod: string;
  transactionId: string;
  receiptImage: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

/* ==========================================================
   COMPONENT
========================================================== */

export default function DepositPage() {
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

  /* ==========================================================
     STATES
  ========================================================== */

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [settings, setSettings] =
    useState<PaymentSettings | null>(null);

  const [history, setHistory] = useState<DepositItem[]>([]);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("JazzCash");
  const [transactionId, setTransactionId] = useState("");
  const [receiptImage, setReceiptImage] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  /* ==========================================================
     LOAD PAYMENT SETTINGS
  ========================================================== */

  const loadPaymentSettings = async () => {
    try {
      const response = await fetch(
        `${API}/api/payment-settings`
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error(error);
    }
  };

  /* ==========================================================
     LOAD USER HISTORY
  ========================================================== */

  const loadHistory = async () => {
    if (!username || !token) return;

    try {
      const response = await fetch(
        `${API}/api/deposit/history/${username}`,
        { headers }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setHistory(data.deposits || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      await Promise.all([
        loadPaymentSettings(),
        loadHistory(),
      ]);

      setLoading(false);
    };

    init();
  }, []);
    /* ==========================================================
     SUBMIT DEPOSIT REQUEST
  ========================================================== */

  const submitDeposit = async () => {
    try {
      setSubmitting(true);
      setMessage("");

      if (!amount || Number(amount) <= 0) {
        throw new Error("Please enter a valid deposit amount.");
      }

      if (!transactionId.trim()) {
        throw new Error("Transaction ID is required.");
      }

      const response = await fetch(`${API}/api/deposit`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          requestAmount: Number(amount),
          paymentMethod,
          transactionId: transactionId.trim(),
          receiptImage: receiptImage.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Deposit request failed.");
      }

      setMessageType("success");
      setMessage("Deposit request submitted successfully.");

      // Reset Form
      setAmount("");
      setTransactionId("");
      setReceiptImage("");
      setPaymentMethod("JazzCash");

      await loadHistory();

    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Deposit request failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ==========================================================
     LOADING SCREEN
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading Deposit Page...
      </main>
    );
  }

  /* ==========================================================
     PAGE START
  ========================================================== */

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-6xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap justify-between items-center gap-4">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <Wallet size={36} />
              Deposit Funds
            </h1>

            <p className="text-gray-400 mt-2">
              Submit your PKR or USDT deposit request for admin approval.
            </p>

          </div>

          <Link
            href="/dashboard"
            className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
          >
            <ArrowLeft size={18} />
            Dashboard
          </Link>

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

        {/* ===================================================== */}
        {/* PAYMENT DETAILS */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">

          <h2 className="flex items-center gap-2 text-2xl font-black text-green-400 mb-6">
            <CreditCard size={24} />
            Company Payment Details
          </h2>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* JazzCash */}

            {settings?.jazzCashEnabled && (
              <div className="bg-black border border-zinc-700 rounded-xl p-5">

                <h3 className="text-yellow-400 font-bold text-lg mb-4">
                  JazzCash
                </h3>

                <div className="space-y-2 text-sm">

                  <p className="text-gray-400">Number</p>

                  <p className="text-white font-semibold break-all">
                    {settings.jazzCashNumber || "Not Available"}
                  </p>

                  <p className="text-gray-400 mt-3">Account Title</p>

                  <p className="text-white font-semibold">
                    {settings.jazzCashTitle || "Not Available"}
                  </p>

                </div>

              </div>
            )}

            {/* Easypaisa */}

            {settings?.easypaisaEnabled && (
              <div className="bg-black border border-zinc-700 rounded-xl p-5">

                <h3 className="text-green-400 font-bold text-lg mb-4">
                  Easypaisa
                </h3>

                <div className="space-y-2 text-sm">

                  <p className="text-gray-400">Number</p>

                  <p className="text-white font-semibold break-all">
                    {settings.easypaisaNumber || "Not Available"}
                  </p>

                  <p className="text-gray-400 mt-3">Account Title</p>

                  <p className="text-white font-semibold">
                    {settings.easypaisaTitle || "Not Available"}
                  </p>

                </div>

              </div>
            )}

            {/* Bank */}

            {settings?.bankEnabled && (
              <div className="bg-black border border-zinc-700 rounded-xl p-5 lg:col-span-2">

                <h3 className="text-cyan-400 font-bold text-lg mb-4">
                  Bank Account
                </h3>

                <div className="grid md:grid-cols-2 gap-4 text-sm">

                  <div>
                    <p className="text-gray-400">Bank Name</p>
                    <p className="font-semibold">{settings.bankName}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Account Title</p>
                    <p className="font-semibold">{settings.bankAccountTitle}</p>
                  </div>

                  <div>
                    <p className="text-gray-400">Account Number</p>
                    <p className="font-semibold break-all">
                      {settings.bankAccountNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">IBAN</p>
                    <p className="font-semibold break-all">
                      {settings.iban}
                    </p>
                  </div>

                </div>

              </div>
            )}

            {/* USDT */}

            {settings?.usdtEnabled && (
              <div className="bg-black border border-zinc-700 rounded-xl p-5 lg:col-span-2">

                <h3 className="text-blue-400 font-bold text-lg mb-4">
                  USDT Wallet Addresses
                </h3>

                <div className="space-y-4 text-sm">

                  <div>
                    <p className="text-gray-400">TRC20</p>
                    <p className="font-semibold break-all">
                      {settings.usdtTRC20 || "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">BEP20</p>
                    <p className="font-semibold break-all">
                      {settings.usdtBEP20 || "Not Available"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">ERC20</p>
                    <p className="font-semibold break-all">
                      {settings.usdtERC20 || "Not Available"}
                    </p>
                  </div>

                </div>

              </div>
            )}

          </div>

        </section>

        {/* ===================================================== */}
        {/* DEPOSIT REQUEST FORM */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-yellow-400 mb-6">
            Submit Deposit Request
          </h2>

          <div className="grid lg:grid-cols-2 gap-5">

            {/* Amount */}

            <div>

              <label className="block mb-2 text-green-400 font-semibold">
                Deposit Amount (PKR)
              </label>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter deposit amount"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              />

            </div>

            {/* Payment Method */}

            <div>

              <label className="block mb-2 text-yellow-400 font-semibold">
                Payment Method
              </label>

              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              >
                {settings?.jazzCashEnabled && (
                  <option value="JazzCash">JazzCash</option>
                )}

                {settings?.easypaisaEnabled && (
                  <option value="Easypaisa">Easypaisa</option>
                )}

                {settings?.bankEnabled && (
                  <option value="Bank">Bank Transfer</option>
                )}

                {settings?.usdtEnabled && (
                  <option value="USDT">USDT</option>
                )}
              </select>

            </div>

            {/* Transaction ID */}

            <div className="lg:col-span-2">

              <label className="block mb-2 text-cyan-400 font-semibold">
                Transaction ID / Reference Number
              </label>

              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter transaction reference number"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-500"
              />

            </div>

            {/* Receipt URL */}

            <div className="lg:col-span-2">

              <label className="block mb-2 text-purple-400 font-semibold">
                Receipt Image URL
              </label>

              <div className="relative">

                <Upload
                  size={18}
                  className="absolute left-3 top-3 text-purple-400"
                />

                <input
                  type="text"
                  value={receiptImage}
                  onChange={(e) => setReceiptImage(e.target.value)}
                  placeholder="Paste receipt image URL"
                  className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-purple-500"
                />

              </div>

              {receiptImage && (
                <img
                  src={receiptImage}
                  alt="Receipt Preview"
                  className="mt-4 rounded-xl border border-zinc-700 bg-white w-full max-h-72 object-contain"
                />
              )}

            </div>

          </div>

          {/* Submit Button */}

          <button
            type="button"
            disabled={submitting}
            onClick={submitDeposit}
            className={`mt-8 w-full py-4 rounded-xl font-bold text-lg transition ${
              submitting
                ? "bg-yellow-700 cursor-not-allowed text-black"
                : "bg-yellow-500 hover:bg-yellow-400 text-black"
            }`}
          >
            {submitting
              ? "Submitting Deposit..."
              : "Submit Deposit Request"}
          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            Every deposit request requires admin approval before processing.
          </p>

        </section>
                <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-black text-cyan-400">
              Deposit History
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

            <div className="text-center py-12 text-gray-500">
              No deposit history found.
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-left">

                <thead>

                  <tr className="border-b border-zinc-700 text-cyan-400">

                    <th className="p-3">Amount</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Transaction ID</th>
                    <th className="p-3">Receipt</th>
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

                      {/* Amount */}
                      <td className="p-3 text-green-400 font-bold whitespace-nowrap">
                        PKR {Number(item.requestAmount).toLocaleString()}
                      </td>

                      {/* Method */}
                      <td className="p-3 text-white whitespace-nowrap">
                        {item.paymentMethod}
                      </td>

                      {/* TXN */}
                      <td className="p-3 text-gray-300 break-all">
                        {item.transactionId || "N/A"}
                      </td>

                      {/* Receipt */}
                      <td className="p-3 whitespace-nowrap">
                        {item.receiptImage ? (
                          <a
                            href={item.receiptImage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 underline"
                          >
                            View Receipt
                          </a>
                        ) : (
                          <span className="text-gray-500">
                            No Receipt
                          </span>
                        )}
                      </td>

                      {/* Status */}
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

                      {/* Date */}
                      <td className="p-3 text-gray-500 whitespace-nowrap">
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
        {/* IMPORTANT NOTICE */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

          <h3 className="text-yellow-400 font-bold text-lg mb-3">
            Deposit Policy
          </h3>

          <ul className="space-y-2 text-sm text-gray-300 list-disc pl-5">

            <li>Every deposit request is submitted with <strong>Pending</strong> status.</li>

            <li>Admin can only <strong>Approve</strong> or <strong>Reject</strong> the request.</li>

            <li>Approval does <strong>NOT</strong> automatically add PKR, Gold or USDT into your wallet.</li>

            <li>Wallet balances are managed only from <strong>Admin Wallet Manager</strong>.</li>

            <li>Receipt image and transaction ID help the admin verify your payment.</li>

          </ul>

        </section>

        {/* ===================================================== */}
        {/* FOOTER */}
        {/* ===================================================== */}

        <footer className="text-center py-8">

          <p className="text-yellow-400 font-bold text-lg">
            GoldTrade V18 Enterprise
          </p>

          <p className="text-gray-500 text-sm mt-2">
            PKR • Gold • USDT Secure Deposit System
          </p>

        </footer>

      </div>

    </main>
  );
}