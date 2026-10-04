"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Wallet,
  DollarSign,
  ArrowLeft,
  RefreshCw,
  Upload,
  Copy,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// ======================================================
// API URL (GoldTrade V18)
// ======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://https://goldtrade-2.onrender.com";

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

interface sellResponse {
  success: boolean;
  message: string;
  Wallet?: {
    WalletBalance: number;
    UsdtBalance: number;
  };
}

// ======================================================
// PAGE
// ======================================================

export default function sellUsdtPage() {
  // User Info
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");

  // Wallet Balances
  const [WalletBalance, setWalletBalance] = useState(0);
  const [UsdtBalance, setUsdtBalance] = useState(0);
  const [rate, setRate] = useState(280);

  // sell Form
  const [UsdtAmount, setUsdtAmount] = useState("");
  const [txHash, setTxHash] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  // UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  // ======================================================
  // COMPANY Wallet (TRC20 ONLY)
  // ======================================================

  const companyWallet = {
    network: "TRC20",
    address: "TQ9xH8ExampleWalletAddress1234567890",
  };

  // ======================================================
  // HEADERS
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
  // LOAD Wallet + LIVE RATE
  // ======================================================

  const loadWallet = async () => {
    if (!username || !token) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/Wallet/${username}`,
        {
          method: "GET",
          headers: getHeaders(),
          cache: "no-store",
        }
      );

      const result: WalletResponse = await response.json();

      console.log("sell Usdt Wallet:", result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to load Wallet."
        );
      }

      setWalletBalance(
        Number(
          result.Wallet?.WalletBalance ??
            result.Wallet?.PkrBalance ??
            0
        )
      );

      setUsdtBalance(
        Number(result.Wallet?.UsdtBalance ?? 0)
      );

      setRate(
        Number(result.rate ?? result.Wallet?.rate ?? 280)
      );
    } catch (err: any) {
      console.error("sell Wallet ERROR:", err);

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
  // LIVE Pkr CALCULATION
  // ======================================================

  const totalPkr = useMemo(() => {
    return Number(UsdtAmount || 0) * rate;
  }, [UsdtAmount, rate]);

  // ======================================================
  // COPY COMPANY Wallet ADDRESS
  // ======================================================

  const copyWalletAddress = async () => {
    try {
      await navigator.clipboard.writeText(companyWallet.address);

      setMessageType("success");
      setMessage("Company Wallet address copied.");
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
  // sell Usdt FUNCTION (FINAL V18)
  // ======================================================

  const handlesellUsdt = async () => {
    try {
      setSubmitting(true);
      setMessage("");

      // -----------------------------
      // Validation
      // -----------------------------

      if (!UsdtAmount || Number(UsdtAmount) <= 0) {
        throw new Error("Enter a valid Usdt amount.");
      }

      if (Number(UsdtAmount) > UsdtBalance) {
        throw new Error("Insufficient Usdt Wallet balance.");
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
      formData.append("PkrAmount", String(totalPkr));
      formData.append("WalletAddress", companyWallet.address);
      formData.append("network", companyWallet.network);
      formData.append("txHash", txHash.trim());

      if (receipt) {
        formData.append("receipt", receipt);
      }

      // -----------------------------
      // API Call
      // -----------------------------

      const response = await fetch(`${API}/api/Usdt/sell`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });

      const result: sellResponse = await response.json();

      console.log("sell Usdt RESPONSE:", result);

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || "Unable to submit sell request."
        );
      }

      // -----------------------------
      // Success
      // -----------------------------

      setMessageType("success");
      setMessage(result.message || "Usdt sell Request Submitted.");

      // Reset Form
      setUsdtAmount("");
      setTxHash("");
      setReceipt(null);

      // Refresh Wallet
      await loadWallet();

    } catch (err: any) {
      console.error("sell Usdt ERROR:", err);

      setMessageType("error");
      setMessage(err.message || "Usdt sell request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  // ======================================================
  // AUTO CLEAR MESSAGE
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
      <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400">
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

      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-cyan-600">

        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">

          <div>

            <Link
              href="/Usdt"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              <ArrowLeft size={16} />
              Back to Usdt Dashboard
            </Link>

            <h1 className="text-4xl font-black text-cyan-400 mt-2">
              sell Usdt
            </h1>

            <p className="text-gray-400 mt-2">
              sell your Usdt and receive Pkr in your GoldTrade Wallet.
            </p>

          </div>

          <button
            onClick={refreshWallet}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2"
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

        {/* ======================================================
            SUCCESS / ERROR MESSAGE
        ====================================================== */}

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
              Available Usdt Balance
            </p>

            <h2 className="text-4xl font-black text-green-400 mt-3">
              {UsdtBalance.toLocaleString()} Usdt
            </h2>

          </div>

          {/* Live sell Rate */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">

            <DollarSign className="text-cyan-400 mb-4" size={34} />

            <p className="text-gray-400 text-sm">
              Live sell Rate
            </p>

            <h2 className="text-4xl font-black text-cyan-400 mt-3">
              Pkr {rate.toLocaleString()}
            </h2>

            <p className="text-xs text-gray-500 mt-2">
              You receive Pkr according to the current GoldTrade sell rate.
            </p>

          </div>

        </div>

        {/* ======================================================
            sell Usdt FORM
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
              placeholder="Enter Usdt Amount to sell"
              className="w-full bg-black border border-green-500 rounded-2xl py-4 pl-12 pr-5 text-2xl font-bold outline-none focus:border-green-400"
            />

          </div>

          <p className="text-gray-500 text-sm mt-4">
            Maximum sell Amount: {UsdtBalance.toLocaleString()} Usdt
          </p>

        </div>

        {/* ======================================================
            ORDER SUMMARY
        ====================================================== */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-cyan-400 mb-6">
            sell Order Summary
          </h2>

          <div className="space-y-4 text-lg">

            <div className="flex justify-between border-b border-zinc-700 pb-3">
              <span className="text-gray-400">selling Usdt</span>

              <span className="font-bold text-white">
                {Number(UsdtAmount || 0).toLocaleString()} Usdt
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-700 pb-3">
              <span className="text-gray-400">sell Rate</span>

              <span className="font-bold text-cyan-400">
                Pkr {rate.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-b border-zinc-700 pb-3">
              <span className="text-gray-400">Current Usdt Balance</span>

              <span className="font-bold text-green-400">
                {UsdtBalance.toLocaleString()} Usdt
              </span>
            </div>

            <div className="flex justify-between pt-3">

              <span className="text-2xl font-bold text-yellow-400">
                You Will Receive
              </span>

              <span className="text-3xl font-black text-yellow-400">
                Pkr {totalPkr.toLocaleString()}
              </span>

            </div>

          </div>

        </div>        {/* ======================================================
            COMPANY Wallet ADDRESS (TRC20 ONLY)
        ====================================================== */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mb-8">

          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">

            <div>
              <h2 className="text-2xl font-bold text-cyan-400">
                Company Usdt Wallet
              </h2>

              <p className="text-gray-400 mt-1">
                Send your Usdt only to the official GoldTrade TRC20 Wallet.
              </p>
            </div>

            <span className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-full text-sm font-semibold">
              TRC20 NETWORK
            </span>

          </div>

          {/* Wallet Address Card */}

          <div className="bg-black border border-cyan-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm mb-2">
              Official Company Wallet Address
            </p>

            <div className="bg-zinc-900 border border-cyan-700 rounded-xl p-4 mb-4">

              <p className="text-cyan-300 text-lg font-bold break-all">
                {companyWallet.address}
              </p>

            </div>

            <button
              type="button"
              onClick={copyWalletAddress}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-4 py-3 rounded-xl flex items-center gap-2"
            >
              <Copy size={18} />
              Copy Wallet Address
            </button>

          </div>

          {/* Network Info */}

          <div className="mt-5 bg-cyan-500/10 border border-cyan-500 rounded-2xl p-4">

            <div className="flex justify-between items-center mb-3">

              <span className="text-gray-400">
                Blockchain Network
              </span>

              <span className="text-cyan-400 font-bold">
                TRC20
              </span>

            </div>

            <div className="flex justify-between items-center">

              <span className="text-gray-400">
                Wallet Owner
              </span>

              <span className="text-white font-semibold">
                GoldTrade Official Wallet
              </span>

            </div>

          </div>

        </div>

        {/* ======================================================
            TRANSACTION HASH
        ====================================================== */}

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-purple-400 mb-5">
            Transaction Hash (Optional)
          </h2>

          <p className="text-gray-400 mb-4">
            Paste your TRC20 transaction hash after sending Usdt.
          </p>

          <input
            type="text"
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder="Paste TRC20 Transaction Hash"
            className="w-full bg-black border border-purple-500 rounded-2xl p-4 text-white outline-none focus:border-purple-400"
          />

        </div>

        {/* ======================================================
            PAYMENT RECEIPT UPLOAD
        ====================================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 mb-10">

          <h2 className="text-2xl font-bold text-green-400 mb-5">
            Upload Payment Receipt
          </h2>

          <p className="text-gray-400 mb-5">
            Upload a screenshot of your TRC20 transfer receipt.
          </p>

          <label className="w-full cursor-pointer border-2 border-dashed border-green-500 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-green-500/5 transition">

            <Upload size={48} className="text-green-400 mb-3" />

            <span className="text-green-400 font-semibold">
              Click Here To Upload Receipt
            </span>

            <span className="text-gray-500 text-sm mt-2">
              JPG 鈥?JPEG 鈥?PNG 鈥?Max 5 MB
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

          {/* Selected Receipt */}

          {receipt && (
            <div className="mt-5 bg-green-600/10 border border-green-500 rounded-2xl p-4">

              <div className="flex items-center gap-3">

                <CheckCircle size={22} className="text-green-400" />

                <div>

                  <p className="text-green-400 font-semibold">
                    Receipt Uploaded Successfully
                  </p>

                  <p className="text-white text-sm break-all mt-1">
                    {receiptFileName}
                  </p>

                </div>

              </div>

            </div>
          )}

        </div>        {/* ======================================================
            Usdt BALANCE VALIDATION
        ====================================================== */}

        {Number(UsdtAmount || 0) > UsdtBalance && (
          <div className="bg-red-600/10 border border-red-500 rounded-3xl p-5 mb-8">

            <div className="flex items-center gap-3 mb-3">
              <AlertCircle size={26} className="text-red-400" />

              <h2 className="text-xl font-bold text-red-400">
                Insufficient Usdt Wallet Balance
              </h2>
            </div>

            <p className="text-red-300">
              Available Usdt Balance:{" "}
              <span className="font-bold">
                {UsdtBalance.toLocaleString()} Usdt
              </span>
            </p>

            <p className="text-red-300 mt-2">
              Requested sell Amount:{" "}
              <span className="font-bold">
                {Number(UsdtAmount || 0).toLocaleString()} Usdt
              </span>
            </p>

          </div>
        )}

        {/* ======================================================
            sell RULES
        ====================================================== */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-yellow-400 mb-5">
            sell Usdt Rules
          </h2>

          <ul className="space-y-3 text-gray-300 text-sm">

            <li>鈥?Send Usdt only to the official GoldTrade TRC20 Wallet.</li>

            <li>鈥?Upload a valid payment receipt after sending Usdt.</li>

            <li>鈥?Transaction Hash is optional but recommended.</li>

            <li>鈥?Admin will verify the payment before approval.</li>

            <li>鈥?Approved requests will credit Pkr into your Wallet.</li>

            <li>鈥?Rejected requests will not credit Pkr.</li>

          </ul>

        </div>

        {/* ======================================================
            PAYMENT SUMMARY
        ====================================================== */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-cyan-400 mb-6">
            Payment Summary
          </h2>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span className="text-gray-400">selling Usdt</span>

              <span className="font-bold text-white">
                {Number(UsdtAmount || 0).toLocaleString()} Usdt
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Current sell Rate</span>

              <span className="font-bold text-cyan-400">
                Pkr {rate.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Available Usdt Balance</span>

              <span className="font-bold text-green-400">
                {UsdtBalance.toLocaleString()} Usdt
              </span>
            </div>

            <div className="border-t border-zinc-700 pt-4 flex justify-between">

              <span className="text-xl font-bold text-yellow-400">
                You Will Receive
              </span>

              <span className="text-3xl font-black text-yellow-400">
                Pkr {totalPkr.toLocaleString()}
              </span>

            </div>

          </div>

        </div>

        {/* ======================================================
            sell Usdt BUTTON
        ====================================================== */}

        <button
          type="button"
          onClick={handlesellUsdt}
          disabled={
            submitting ||
            Number(UsdtAmount || 0) <= 0 ||
            Number(UsdtAmount || 0) > UsdtBalance
          }
          className={`w-full rounded-3xl py-5 text-xl font-black transition flex items-center justify-center gap-3 ${
            submitting
              ? "bg-zinc-700 cursor-not-allowed"
              : Number(UsdtAmount || 0) > UsdtBalance
              ? "bg-red-600 cursor-not-allowed"
              : "bg-cyan-500 hover:bg-cyan-400 text-black"
          }`}
        >
          {submitting ? (
            <>
              <RefreshCw size={24} className="animate-spin" />
              Processing sell Request...
            </>
          ) : (
            <>
              <DollarSign size={24} />
              sell Usdt NOW
            </>
          )}
        </button>

        {/* ======================================================
            SECURITY NOTICE
        ====================================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 mt-8">

          <h2 className="text-2xl font-bold text-green-400 mb-5">
            GoldTrade Security Notice
          </h2>

          <div className="space-y-3 text-sm text-gray-300">

            <p>鈥?Send Usdt only through the TRC20 network.</p>

            <p>鈥?Double-check the company Wallet address before sending.</p>

            <p>鈥?Upload a clear payment receipt for faster approval.</p>

            <p>鈥?Pkr Wallet is credited only after admin approval.</p>

            <p>鈥?Fake receipts or incorrect transfers may result in rejection.</p>

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
              <span>Estimated Processing Time</span>
              <span className="font-bold text-yellow-400">
                1鈥?5 Minutes
              </span>
            </div>

            <div className="flex justify-between">
              <span>System Status</span>
              <span className="font-bold text-green-400">
                Online
              </span>
            </div>

          </div>

        </div>

        {/* ======================================================
            FOOTER DASHBOARD
        ====================================================== */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mt-8">

          <div className="grid md:grid-cols-3 gap-5">

            {/* Pkr Wallet */}

            <div className="bg-black border border-yellow-700 rounded-2xl p-5 text-center">

              <Wallet size={32} className="mx-auto text-yellow-400 mb-3" />

              <p className="text-gray-400 text-sm">
                Pkr Wallet Balance
              </p>

              <h3 className="text-2xl font-bold text-yellow-400 mt-2">
                Pkr {WalletBalance.toLocaleString()}
              </h3>

            </div>

            {/* Usdt Wallet */}

            <div className="bg-black border border-green-700 rounded-2xl p-5 text-center">

              <DollarSign size={32} className="mx-auto text-green-400 mb-3" />

              <p className="text-gray-400 text-sm">
                Available Usdt
              </p>

              <h3 className="text-2xl font-bold text-green-400 mt-2">
                {UsdtBalance.toLocaleString()} Usdt
              </h3>

            </div>

            {/* Live Rate */}

            <div className="bg-black border border-cyan-700 rounded-2xl p-5 text-center">

              <RefreshCw size={32} className="mx-auto text-cyan-400 mb-3" />

              <p className="text-gray-400 text-sm">
                Live sell Rate
              </p>

              <h3 className="text-2xl font-bold text-cyan-400 mt-2">
                Pkr {rate.toLocaleString()}
              </h3>

            </div>

          </div>

          {/* Auto Refresh Status */}

          <div className="border-t border-zinc-700 mt-6 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">

            <div className="text-sm text-gray-400">
              GoldTrade V18 鈥?Secure Usdt sell System
            </div>

            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <RefreshCw size={16} />
              Wallet Sync Active (Every 15 Seconds)
            </div>

          </div>

        </div>

      </div>

    </main>
  );
}


