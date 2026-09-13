"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

// ==============================================
// GOLDTRADE V17 API CONFIG
// ==============================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// ==============================================
// TYPES
// ==============================================

interface DepositInfo {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  easypaisa: string;
  jazzcash: string;
  usdtWallet: string;
  qrCode: string;
}

interface DepositHistory {
  _id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  transactionId: string;
}

export default function DepositPage() {
  const [username, setUsername] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [method, setMethod] = useState("Bank Transfer");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const [depositInfo, setDepositInfo] = useState<DepositInfo>({
    bankName: "Meezan Bank",
    accountTitle: "GoldTrade Pvt Ltd",
    accountNumber: "12345678901234",
    iban: "PK12MEZN0001234567890123",
    easypaisa: "03001234567",
    jazzcash: "03001234567",
    usdtWallet: "TQ8nxxxxxxxxxxxxxxxxxxxxxxxx",
    qrCode: "",
  });

  const [history, setHistory] = useState<DepositHistory[]>([]);

  // ==============================================
  // LOAD USERNAME
  // ==============================================

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUsername(localStorage.getItem("username") || "hashi90");
    }
  }, []);

  // ==============================================
  // LOAD DEPOSIT SETTINGS + HISTORY
  // ==============================================

  const fetchDepositData = async () => {
    if (!username) return;

    try {
      setLoading(true);

      const [settingsRes, historyRes] = await Promise.all([
        axios.get(`${API}/api/deposit/settings`),
        axios.get(`${API}/api/deposit/history/${username}`),
      ]);

      if (settingsRes.data.success) {
        setDepositInfo(settingsRes.data.settings);
      }

      if (historyRes.data.success) {
        setHistory(historyRes.data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!username) return;
    fetchDepositData();
  }, [username]);

  // ==============================================
  // TOTAL PENDING DEPOSIT
  // ==============================================

  const pendingAmount = useMemo(() => {
    return history
      .filter((item) => item.status === "Pending")
      .reduce((sum, item) => sum + item.amount, 0);
  }, [history]);

  // ==============================================
  // SUBMIT DEPOSIT REQUEST
  // ==============================================

  const submitDeposit = async () => {
    if (!amount || Number(amount) < 1000) {
      setMessage("Minimum deposit is PKR 1000.");
      setMessageType("error");
      return;
    }

    if (!transactionId.trim()) {
      setMessage("Transaction ID is required.");
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);

      const res = await axios.post(`${API}/api/deposit/create`, {
        username,
        amount: Number(amount),
        method,
        transactionId,
      });

      if (res.data.success) {
        setMessage("Deposit request submitted successfully.");
        setMessageType("success");

        setAmount("");
        setTransactionId("");

        fetchDepositData();
      } else {
        setMessage(res.data.message);
        setMessageType("error");
      }
    } catch (err: any) {
      setMessage(
        err.response?.data?.message || "Deposit submission failed."
      );
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center text-yellow-400 text-2xl font-bold">
        Loading Deposit Dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white p-6">

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <div>
          <h1 className="text-5xl font-black text-yellow-400">
            DEPOSIT FUNDS
          </h1>

          <p className="text-gray-400 mt-2">
            Add balance into your GoldTrade PKR Wallet.
          </p>
        </div>

        <button
          onClick={fetchDepositData}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold"
        >
          Refresh
        </button>

      </div>

      {/* SUCCESS / ERROR */}

      {message && (
        <div
          className={`mb-6 rounded-xl p-4 font-semibold ${
            messageType === "success"
              ? "bg-green-600 text-white"
              : "bg-red-700 text-white"
          }`}
        >
          {message}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="grid md:grid-cols-3 gap-5 mb-8">

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Pending Deposits</p>

          <h2 className="text-3xl font-black text-yellow-400 mt-2">
            PKR {pendingAmount.toLocaleString()}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Deposit Method</p>

          <h2 className="text-3xl font-black text-green-400 mt-2">
            {method}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
          <p className="text-gray-400 text-sm">Minimum Deposit</p>

          <h2 className="text-3xl font-black text-cyan-400 mt-2">
            PKR 1,000
          </h2>
        </div>

      </div>
            {/* ============================================== */}
      {/* PAYMENT DETAILS */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-yellow-400 mb-6">
          Payment Details
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Bank */}

          <div className="bg-black rounded-2xl border border-zinc-700 p-5 space-y-3">
            <h3 className="text-xl font-black text-green-400">
              🏦 Bank Transfer
            </h3>

            <p><span className="text-gray-400">Bank:</span> {depositInfo.bankName}</p>
            <p><span className="text-gray-400">Account Title:</span> {depositInfo.accountTitle}</p>
            <p><span className="text-gray-400">Account Number:</span> {depositInfo.accountNumber}</p>
            <p><span className="text-gray-400">IBAN:</span> {depositInfo.iban}</p>
          </div>

          {/* EasyPaisa */}

          <div className="bg-black rounded-2xl border border-zinc-700 p-5 space-y-3">
            <h3 className="text-xl font-black text-green-400">
              📱 EasyPaisa
            </h3>

            <p>{depositInfo.easypaisa}</p>
          </div>

          {/* JazzCash */}

          <div className="bg-black rounded-2xl border border-zinc-700 p-5 space-y-3">
            <h3 className="text-xl font-black text-red-400">
              💳 JazzCash
            </h3>

            <p>{depositInfo.jazzcash}</p>
          </div>

          {/* USDT */}

          <div className="bg-black rounded-2xl border border-zinc-700 p-5 space-y-3">
            <h3 className="text-xl font-black text-cyan-400">
              ₮ USDT TRC20 Wallet
            </h3>

            <p className="break-all">{depositInfo.usdtWallet}</p>
          </div>

        </div>

      </div>

      {/* ============================================== */}
      {/* QR CODE */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-cyan-400 mb-6">
          Deposit QR Code
        </h2>

        {depositInfo.qrCode ? (
          <div className="flex justify-center">
            <img
              src={depositInfo.qrCode}
              alt="Deposit QR"
              className="rounded-2xl w-72 border border-zinc-700"
            />
          </div>
        ) : (
          <div className="flex justify-center items-center h-56 rounded-2xl border border-dashed border-zinc-600 text-gray-500">
            QR Code Not Uploaded
          </div>
        )}

      </div>

      {/* ============================================== */}
      {/* DEPOSIT FORM */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-green-500 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-green-400 mb-6">
          Submit Deposit Request
        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          <div>
            <label className="text-gray-300 mb-2 block">
              Deposit Amount (PKR)
            </label>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Minimum 1000 PKR"
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-green-500"
            />
          </div>

          <div>
            <label className="text-gray-300 mb-2 block">
              Payment Method
            </label>

            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-green-500"
            >
              <option>Bank Transfer</option>
              <option>EasyPaisa</option>
              <option>JazzCash</option>
              <option>USDT TRC20</option>
            </select>
          </div>

        </div>

        <div className="mt-5">
          <label className="text-gray-300 mb-2 block">
            Transaction ID / Reference Number
          </label>

          <input
            type="text"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Enter bank transaction reference..."
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-green-500"
          />
        </div>

        <button
          onClick={submitDeposit}
          disabled={submitting}
          className="w-full mt-8 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xl font-black py-4 rounded-2xl transition"
        >
          {submitting ? "Submitting Deposit..." : "SUBMIT DEPOSIT REQUEST"}
        </button>

      </div>

      {/* ============================================== */}
      {/* DEPOSIT HISTORY */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-8 mb-10">

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h2 className="text-3xl font-black text-blue-400">
            Deposit History
          </h2>

          <span className="text-gray-400">
            {history.length} Record(s)
          </span>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No Deposit History Found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full">

              <thead className="bg-black text-blue-400 uppercase text-sm">
                <tr>
                  <th className="px-4 py-4 text-left">Amount</th>
                  <th className="px-4 py-4 text-left">Method</th>
                  <th className="px-4 py-4 text-left">Transaction ID</th>
                  <th className="px-4 py-4 text-left">Status</th>
                  <th className="px-4 py-4 text-left">Date</th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-zinc-700 hover:bg-zinc-800"
                  >
                    <td className="px-4 py-4 text-green-400 font-bold">
                      PKR {item.amount.toLocaleString()}
                    </td>

                    <td className="px-4 py-4">
                      {item.method}
                    </td>

                    <td className="px-4 py-4 text-cyan-400">
                      {item.transactionId}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.status === "Approved"
                            ? "bg-green-600 text-white"
                            : item.status === "Rejected"
                            ? "bg-red-600 text-white"
                            : "bg-yellow-500 text-black"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-gray-400 text-sm">
                      {new Date(item.createdAt).toLocaleDateString("en-GB")}
                      <br />
                      {new Date(item.createdAt).toLocaleTimeString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

      {/* ============================================== */}
      {/* DEPOSIT INSTRUCTIONS */}
      {/* ============================================== */}

      <div className="bg-zinc-900 border border-yellow-600 rounded-3xl p-8 mb-10">

        <h2 className="text-3xl font-black text-yellow-400 mb-6">
          Deposit Instructions
        </h2>

        <ul className="space-y-3 text-gray-300">
          <li>✅ Minimum Deposit Amount: PKR 1,000.</li>
          <li>✅ Transfer funds using Bank, EasyPaisa, JazzCash or USDT.</li>
          <li>✅ Enter the exact Transaction ID after payment.</li>
          <li>✅ Deposit requests are reviewed by Admin before approval.</li>
          <li>✅ Approved deposits are added automatically into your PKR Wallet.</li>
          <li>⏱ Processing time: 5–30 minutes after verification.</li>
        </ul>

      </div>

      {/* ============================================== */}
      {/* FOOTER */}
      {/* ============================================== */}

      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">

        <p className="font-semibold text-yellow-400 mb-2">
          GoldTrade V17 Enterprise Deposit Module
        </p>

        <p>Secure PKR Wallet Funding • Bank • EasyPaisa • JazzCash • USDT</p>

        <p className="mt-2">
          Powered by GoldTrade Enterprise Backend API
        </p>

      </div>

    </div>
  );
}