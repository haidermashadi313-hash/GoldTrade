"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  DollarSign,
  RefreshCw,
  Upload,
  QrCode,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Copy,
} from "lucide-react";
import Link from "next/link";

// ======================================================
// API URL (GoldTrade V18)
// ======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://https://goldtrade-cky2.onrender.com";

// ======================================================
// TYPES
// ======================================================

interface WalletResponse {
  success: boolean;

  Wallet?: {
    WalletBalance?: number;
    PkrBalance?: number;
    UsdtBalance?: number;
    rate?: number;
  };

  rate?: number;
  message?: string;
}

interface buyResponse {
  success: boolean;
  message: string;

  transaction?: {
    UsdtAmount: number;
    rate: number;
    totalPkr: number;
    status: string;
  };

  Wallet?: {
    WalletBalance: number;
    UsdtBalance: number;
  };
}

interface UsdtRequest {
  _id: string;
  amount: number | string;
}

// ======================================================
// PAGE
// ======================================================

export default function buyUsdtPage() {
  // -------------------------
  // User
  // -------------------------

  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");

  // -------------------------
  // Wallet Balances
  // -------------------------

  const [WalletBalance, setWalletBalance] = useState(0);
  const [UsdtBalance, setUsdtBalance] = useState(0);
  const [rate, setRate] = useState(280);

  // -------------------------
  // buy Form
  // -------------------------

  const [UsdtAmount, setUsdtAmount] = useState("");
  const [WalletAddress, setWalletAddress] = useState("");
  const [txHash, setTxHash] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  // -------------------------
  // UI
  // -------------------------

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  // ======================================================
  // ADMIN / USER HEADERS
  // ======================================================

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  // ======================================================
  // LOAD TOKEN
  // ======================================================

  useEffect(() => {
    const jwt = localStorage.getItem("token");
    const user = localStorage.getItem("username");

    if (!jwt || !user) {
      window.location.href = "/login";
      return;
    }

    setToken(jwt);
    setUsername(user);
  }, []);

  // ======================================================
// LOAD USER Wallet + LIVE RATE (FINAL V18 FIX)
// ======================================================

const loadWallet = async () => {
  if (!username || !token) return;

  try {
    setLoading(true);

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    const response = await fetch(
      `${API}/api/Wallet/${username}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      }
    );

    const result: WalletResponse = await response.json();

    console.log("buy Usdt Wallet:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Unable to load Wallet.");
    }

    // ================= SAFE VALUES =================

    setWalletBalance(
      Number(
        result.Wallet?.WalletBalance ??
        result.Wallet?.PkrBalance ??
        0
      )
    );

    setUsdtBalance(
      Number(
        result.Wallet?.UsdtBalance ??
        0
      )
    );

    setRate(
      Number(
        result.rate ??
        result.Wallet?.rate ??
        280
      )
    );

  } catch (err: any) {
    console.error("buy Wallet ERROR:", err);

    setWalletBalance(0);
    setUsdtBalance(0);
    setRate(280);

    setMessageType("error");
    setMessage(err.message || "Unable to load Wallet.");
  } finally {
    setLoading(false);
  }
};

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    if (username && token) {
      loadWallet();
    }
  }, [username, token]);

  // ======================================================
  // AUTO REFRESH Wallet
  // ======================================================

  useEffect(() => {
    if (!username || !token) return;

    const timer = setInterval(() => {
      loadWallet();
    }, 15000);

    return () => clearInterval(timer);
  }, [username, token]);

  // ======================================================
  // CALCULATE TOTAL Pkr
  // ======================================================

  const totalPkr = useMemo(() => {
    return Number(UsdtAmount || 0) * rate;
  }, [UsdtAmount, rate]);
    // ======================================================
  // COMPANY Usdt Wallet DETAILS (V18)
  // ======================================================

  const companyWallet = {
    network: "TRC20",
    address: "TQ9xH8ExampleWalletAddress1234567890",
    accountName: "GoldTrade Official Wallet",
  };

  // ======================================================
  // COPY Wallet ADDRESS
  // ======================================================

  const copyWalletAddress = async () => {
    try {
      await navigator.clipboard.writeText(companyWallet.address);

      setMessageType("success");
      setMessage("Wallet address copied successfully.");
    } catch {
      setMessageType("error");
      setMessage("Unable to copy Wallet address.");
    }
  };

  // ======================================================
  // REFRESH Wallet BUTTON
  // ======================================================

  const refreshWallet = () => {
    loadWallet();
  };

  // ======================================================
  // buy Usdt FUNCTION (FINAL V18)
  // ======================================================

  const handlebuyUsdt = async () => {
    try {
      setSubmitting(true);
      setMessage("");

      // -----------------------------
      // Validation
      // -----------------------------

      if (!UsdtAmount || Number(UsdtAmount) <= 0) {
        throw new Error("Enter a valid Usdt amount.");
      }

      if (!WalletAddress.trim()) {
        throw new Error("Please enter your TRC20 Wallet address.");
      }

      if (!receipt) {
        throw new Error("Please upload payment receipt.");
      }

      // -----------------------------
      // Prepare FormData
      // -----------------------------

      const formData = new FormData();

      formData.append("username", username);
      formData.append("UsdtAmount", UsdtAmount);
      formData.append("WalletAddress", WalletAddress.trim());
      formData.append("txHash", txHash.trim());

      if (receipt) {
        formData.append("receipt", receipt);
      }

      // -----------------------------
      // API Call
      // -----------------------------

      const response = await fetch(`${API}/api/gold/admin/Usdt`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const result: buyResponse = await response.json();

      console.log("buy Usdt RESPONSE:", result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit buy request."
        );
      }

      // -----------------------------
      // Success
      // -----------------------------

      setMessageType("success");
      setMessage(result.message || "Usdt request submitted.");

      // Reset Form
      setUsdtAmount("");
      setWalletAddress("");
      setTxHash("");
      setReceipt(null);

      // Refresh Wallet
      await loadWallet();

    } catch (err: any) {
      console.error("buy Usdt ERROR:", err);

      setMessageType("error");
      setMessage(err.message || "Usdt purchase failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // AUTO CLEAR SUCCESS / ERROR MESSAGE
  // ======================================================

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [message]);

  // ======================================================
  // RECEIPT FILE NAME
  // ======================================================

  const receiptFileName = useMemo(() => {
    return receipt ? receipt.name : "";
  }, [receipt]);
    // ======================================================
  // PAGE UI START (FINAL V18)
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-green-400">
        <RefreshCw className="animate-spin mr-3" size={28} />
        Loading Wallet...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pb-16">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-green-600">

        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">

          <div>
            <Link
              href="/Usdt"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Back to Usdt Dashboard
            </Link>

            <h1 className="text-4xl font-black text-green-400 mt-2">
              buy Usdt
            </h1>

            <p className="text-gray-400 mt-2">
              Purchase Usdt securely using your Pkr Wallet.
            </p>
          </div>

          <button
            onClick={refreshWallet}
            className="bg-green-500 hover:bg-green-400 text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh Wallet
          </button>

        </div>

      </div>

      {/* ======================================================
          PAGE BODY
      ====================================================== */}

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ================= SUCCESS / ERROR MESSAGE ================= */}

        {message && (
          <div
            className={`mb-8 rounded-2xl border px-5 py-4 flex items-center gap-3 ${
              messageType === "success"
                ? "bg-green-600/10 border-green-500 text-green-400"
                : "bg-red-600/10 border-red-500 text-red-400"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle size={22} />
            ) : (
              <AlertCircle size={22} />
            )}

            <span className="font-semibold">{message}</span>
          </div>
        )}

        {/* ======================================================
            Wallet SUMMARY CARDS
        ====================================================== */}

        <div className="grid lg:grid-cols-3 gap-5 mb-10">

          {/* Pkr Wallet */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

            <Wallet className="text-yellow-400 mb-4" size={34} />

            <p className="text-gray-400 text-sm">
              Pkr Wallet Balance
            </p>

            <h2 className="text-4xl font-black text-yellow-400 mt-3">
              Pkr {WalletBalance.toLocaleString()}
            </h2>

          </div>

          {/* Usdt Wallet */}

          <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">

            <DollarSign className="text-green-400 mb-4" size={34} />

            <p className="text-gray-400 text-sm">
              Current Usdt Balance
            </p>

            <h2 className="text-4xl font-black text-green-400 mt-3">
              {UsdtBalance.toLocaleString()} Usdt
            </h2>

          </div>

          {/* Live Rate */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">

            <QrCode className="text-cyan-400 mb-4" size={34} />

            <p className="text-gray-400 text-sm">
              Live Usdt Rate
            </p>

            <h2 className="text-4xl font-black text-cyan-400 mt-3">
              Pkr {rate.toLocaleString()}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              1 Usdt = Pkr {rate.toLocaleString()}
            </p>

          </div>

        </div>

        {/* ======================================================
            ENTER Usdt AMOUNT
        ====================================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-green-400 mb-5">
            Enter Usdt Amount
          </h2>

          <div className="relative">

            <DollarSign
              className="absolute left-4 top-4 text-green-400"
              size={24}
            />

            <input
              type="number"
              min="1"
              value={UsdtAmount}
              onChange={(e) => setUsdtAmount(e.target.value)}
              placeholder="Enter Usdt Amount"
              className="w-full bg-black border border-green-500 rounded-2xl py-4 pl-12 pr-5 text-2xl font-bold outline-none focus:border-green-400"
            />

          </div>

        </div>

        {/* ======================================================
            ORDER SUMMARY
        ====================================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-green-400 mb-6">
            Order Summary
          </h2>

          <div className="space-y-4 text-lg">

            <div className="flex justify-between border-b border-zinc-700 pb-3">
              <span className="text-gray-400">Usdt Amount</span>

              <span className="font-bold text-white">
                {Number(UsdtAmount || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-700 pb-3">
              <span className="text-gray-400">Rate</span>

              <span className="font-bold text-cyan-400">
                Pkr {rate.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between pt-2">
              <span className="text-2xl font-bold text-green-400">
                Total Pkr
              </span>

              <span className="text-3xl font-black text-green-400">
                Pkr {totalPkr.toLocaleString()}
              </span>
            </div>

          </div>

        </div>        {/* ======================================================
            COMPANY PAYMENT Wallet (TRC20)
        ====================================================== */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mb-8">

          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">

            <div>
              <h2 className="text-2xl font-bold text-cyan-400">
                Company Usdt Wallet
              </h2>

              <p className="text-gray-400 mt-1">
                Send payment only through TRC20 Network.
              </p>
            </div>

            <span className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-full text-sm font-semibold">
              Network : {companyWallet.network}
            </span>

          </div>

          {/* Wallet Address */}

          <div className="bg-black border border-cyan-500 rounded-2xl p-5 mb-5">

            <p className="text-gray-400 text-sm mb-2">
              Wallet Address
            </p>

            <p className="text-cyan-300 font-bold break-all text-lg">
              {companyWallet.address}
            </p>

            <button
              onClick={copyWalletAddress}
              className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-xl flex items-center gap-2 font-bold"
            >
              <Copy size={18} />
              Copy Wallet Address
            </button>

          </div>

          {/* QR Code */}

          <div className="bg-black border border-zinc-700 rounded-2xl p-5">

            <h3 className="text-cyan-400 font-semibold mb-4">
              Scan QR Code
            </h3>

            <div className="flex justify-center">

              <div className="bg-white rounded-2xl p-5">

                <QrCode size={180} color="black" />

              </div>

            </div>

            <p className="text-center text-gray-500 text-sm mt-4">
              Scan this QR code using Binance, Trust Wallet, TronLink,
              or any TRC20 compatible Wallet.
            </p>

          </div>

        </div>

        {/* ======================================================
            USER RECEIVING Wallet
        ====================================================== */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-yellow-400 mb-5">
            Your Receiving Wallet
          </h2>

          <p className="text-gray-400 mb-4">
            Enter your personal TRC20 Wallet where GoldTrade will send Usdt.
          </p>

          <input
            type="text"
            value={WalletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="Enter Your TRC20 Wallet Address"
            className="w-full bg-black border border-yellow-500 rounded-2xl p-4 text-white outline-none focus:border-yellow-400"
          />

        </div>

        {/* ======================================================
            TRANSACTION HASH
        ====================================================== */}

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-purple-400 mb-5">
            Transaction Hash (Optional)
          </h2>

          <p className="text-gray-400 mb-4">
            Paste your blockchain transaction hash if available.
          </p>

          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="Paste Transaction Hash"
            className="w-full bg-black border border-purple-500 rounded-2xl p-4 text-white outline-none focus:border-purple-400"
          />

        </div>

        {/* ======================================================
            PAYMENT RECEIPT
        ====================================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 mb-10">

          <h2 className="text-2xl font-bold text-green-400 mb-5">
            Upload Payment Receipt
          </h2>

          <p className="text-gray-400 mb-5">
            Upload your payment screenshot after sending Usdt payment.
            Accepted formats: JPG, JPEG, PNG (Maximum 5MB).
          </p>

          <label className="w-full cursor-pointer border-2 border-dashed border-green-500 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-green-500/5 transition">

            <Upload size={48} className="text-green-400 mb-3" />

            <span className="text-green-400 font-semibold">
              Click here to upload receipt
            </span>

            <span className="text-gray-500 text-sm mt-2">
              JPG 鈥?PNG 鈥?JPEG
            </span>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/png,image/jpeg"
              onChange={(e) =>
                setReceipt(e.target.files?.[0] || null)
              }
              className="hidden"
            />

          </label>

          {/* Uploaded File */}

          {receipt && (
            <div className="mt-5 bg-green-600/10 border border-green-500 rounded-xl p-4">

              <p className="text-green-400 font-semibold">
                Receipt Selected
              </p>

              <p className="text-white mt-2 break-all">
                {receiptFileName}
              </p>

            </div>
          )}

        </div>        {/* ======================================================
            Wallet VALIDATION
        ====================================================== */}

        {Number(UsdtAmount || 0) > 0 &&
          totalPkr > WalletBalance && (
            <div className="bg-red-600/10 border border-red-500 rounded-3xl p-5 mb-8">

              <div className="flex items-center gap-3 mb-3">
                <AlertCircle size={26} className="text-red-400" />

                <h2 className="text-xl font-bold text-red-400">
                  Insufficient Pkr Wallet Balance
                </h2>
              </div>

              <p className="text-red-300">
                Required Pkr:{" "}
                <span className="font-bold">
                  {totalPkr.toLocaleString()}
                </span>
              </p>

              <p className="text-red-300 mt-2">
                Available Pkr:{" "}
                <span className="font-bold">
                  {WalletBalance.toLocaleString()}
                </span>
              </p>

            </div>
          )}

        {/* ======================================================
            PURCHASE RULES
        ====================================================== */}

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-blue-400 mb-5">
            Purchase Rules
          </h2>

          <ul className="space-y-3 text-gray-300 text-sm">

            <li>鈥?Send payment only to the official GoldTrade TRC20 Wallet.</li>

            <li>鈥?Upload a clear payment screenshot.</li>

            <li>鈥?Wallet address must be a valid TRC20 address.</li>

            <li>鈥?Receipt image size must be less than 5 MB.</li>

            <li>鈥?Admin verifies payment before approving your request.</li>

            <li>鈥?Approved requests will automatically credit your Usdt Wallet.</li>

          </ul>

        </div>

        {/* ======================================================
            PAYMENT SUMMARY
        ====================================================== */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-yellow-400 mb-6">
            Payment Summary
          </h2>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span className="text-gray-400">buying Usdt</span>

              <span className="font-bold text-white">
                {Number(UsdtAmount || 0).toLocaleString()} Usdt
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Exchange Rate</span>

              <span className="font-bold text-cyan-400">
                Pkr {rate.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Your Pkr Wallet</span>

              <span className="font-bold text-yellow-400">
                Pkr {WalletBalance.toLocaleString()}
              </span>
            </div>

            <div className="border-t border-zinc-700 pt-4 flex justify-between">

              <span className="text-xl font-bold text-green-400">
                Total Payable
              </span>

              <span className="text-3xl font-black text-green-400">
                Pkr {totalPkr.toLocaleString()}
              </span>

            </div>

          </div>

        </div>

        {/* ======================================================
            buy BUTTON
        ====================================================== */}

        <button
          type="button"
          disabled={
            submitting ||
            Number(UsdtAmount || 0) <= 0 ||
            totalPkr > WalletBalance
          }
          onClick={handlebuyUsdt}
          className={`w-full rounded-3xl py-5 text-xl font-black transition flex items-center justify-center gap-3 ${
            submitting
              ? "bg-zinc-700 cursor-not-allowed"
              : totalPkr > WalletBalance
              ? "bg-red-600 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-400 text-black"
          }`}
        >
          {submitting ? (
            <>
              <RefreshCw size={24} className="animate-spin" />
              Processing buy Request...
            </>
          ) : (
            <>
              <CheckCircle size={24} />
              buy Usdt NOW
            </>
          )}
        </button>

        {/* ======================================================
            SECURITY NOTICE
        ====================================================== */}

        <div className="bg-zinc-900 border border-emerald-500 rounded-3xl p-6 mt-8">

          <h2 className="text-2xl font-bold text-emerald-400 mb-5">
            GoldTrade Security Notice
          </h2>

          <div className="space-y-3 text-sm text-gray-300">

            <p>
              鈥?Every Usdt request is manually verified by GoldTrade Admin.
            </p>

            <p>
              鈥?Never send funds to any Wallet other than the official company Wallet.
            </p>

            <p>
              鈥?Fake receipts or invalid Wallet addresses may result in request rejection.
            </p>

            <p>
              鈥?Approved Usdt requests are credited directly into your GoldTrade Wallet.
            </p>

          </div>

        </div>        {/* ======================================================
            SUPPORT INFORMATION
        ====================================================== */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mt-8 mb-8">

          <h2 className="text-2xl font-bold text-cyan-400 mb-5">
            Need Help?
          </h2>

          <div className="space-y-4 text-gray-300">

            <div className="flex justify-between border-b border-zinc-700 pb-3">
              <span>Network</span>
              <span className="font-bold text-cyan-400">
                TRC20 (Usdt)
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-700 pb-3">
              <span>Payment Verification</span>
              <span className="font-bold text-green-400">
                Manual Admin Approval
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-700 pb-3">
              <span>Processing Time</span>
              <span className="font-bold text-yellow-400">
                1鈥?5 Minutes
              </span>
            </div>

            <div className="flex justify-between">
              <span>Status</span>
              <span className="font-bold text-green-400">
                Online
              </span>
            </div>

          </div>

        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 mt-8">

          <div className="grid md:grid-cols-3 gap-6">

            <div className="bg-black rounded-2xl border border-green-700 p-5 text-center">

              <Wallet size={32} className="mx-auto text-green-400 mb-3" />

              <p className="text-gray-400 text-sm">
                Wallet Balance
              </p>

              <h3 className="text-2xl font-bold text-green-400 mt-2">
                Pkr {WalletBalance.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black rounded-2xl border border-cyan-700 p-5 text-center">

              <DollarSign size={32} className="mx-auto text-cyan-400 mb-3" />

              <p className="text-gray-400 text-sm">
                Live Usdt Rate
              </p>

              <h3 className="text-2xl font-bold text-cyan-400 mt-2">
                Pkr {rate.toLocaleString()}
              </h3>

            </div>

            <div className="bg-black rounded-2xl border border-yellow-700 p-5 text-center">

              <CheckCircle size={32} className="mx-auto text-yellow-400 mb-3" />

              <p className="text-gray-400 text-sm">
                Auto Refresh
              </p>

              <h3 className="text-xl font-bold text-yellow-400 mt-2">
                Every 15 Seconds
              </h3>

            </div>

          </div>

          <div className="border-t border-zinc-700 mt-6 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">

            <div className="text-sm text-gray-400">
              GoldTrade V18 鈥?Secure Usdt buy System
            </div>

            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <RefreshCw size={16} />
              Wallet Sync Active
            </div>

          </div>

        </div>

      </div>
    </main>
  );
}

async function loadUsdtRequests(): Promise<unknown[]> {
  const response = await fetch(`${API}/api/gold/admin/Usdt`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
    },
  });

  const result = await response.json();

  if (!response.ok || result?.success === false) {
    throw new Error(result?.message || "Unable to load Usdt requests.");
  }

  return Array.isArray(result) ? result : result?.requests || [];
}
function loadWallet() {
  throw new Error("Function not implemented.");
}



