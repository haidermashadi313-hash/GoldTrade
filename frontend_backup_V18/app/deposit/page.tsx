"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Copy,
  CheckCircle,
  XCircle,
  Loader2,
  ShieldCheck,
  Wallet,
  RefreshCw,
  Clock,
} from "lucide-react";

// ===========================================
// GOLDTRADE PRODUCTION API
// ===========================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-api.onrender.com";

// ===========================================
// TYPES
// ===========================================

interface PaymentSettings {
  usdtWallet: {
    network: string;
    walletAddress: string;
    qrCode: string;
  };

  bank: {
    bankName: string;
    accountTitle: string;
    accountNumber: string;
    iban: string;
    qrCode: string;
  };

  easyPaisa: {
    accountTitle: string;
    mobileNumber: string;
    qrCode: string;
  };

  nayaPay: {
    accountTitle: string;
    mobileNumber: string;
    qrCode: string;
  };

  usdtBuyRate: number;
  usdtSellRate: number;
}

interface DepositHistory {
  _id: string;
  amount: number;
  status: string;
  walletType: string;
  screenshot?: string;
  createdAt: string;
}

// ===========================================
// COMPONENT
// ===========================================

export default function DepositPage() {
  // -------------------------------
  // TOKEN
  // -------------------------------

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  // -------------------------------
  // STATES
  // -------------------------------

  const [paymentSettings, setPaymentSettings] =
    useState<PaymentSettings | null>(null);

  const [amount, setAmount] = useState("");
  const [walletType, setWalletType] = useState("USDT");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [depositHistory, setDepositHistory] =
    useState<DepositHistory[]>([]);

  // -------------------------------
  // COPY WALLET ADDRESS
  // -------------------------------

  const copyWallet = () => {
    if (!paymentSettings?.usdtWallet.walletAddress) return;

    navigator.clipboard.writeText(
      paymentSettings.usdtWallet.walletAddress
    );

    alert("Wallet Address Copied Successfully.");
  };

  // -------------------------------
  // FILE SELECT
  // -------------------------------

  const handleFile = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  // -------------------------------
  // LOAD PAYMENT SETTINGS
  // -------------------------------

  const loadPaymentSettings = async () => {
    try {
      const res = await fetch(
        `${API}/api/gold/admin/payment-settings`
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setPaymentSettings(data.settings);
      }
    } catch (err) {
      console.error("Payment Settings Error:", err);
    }
  };

  // -------------------------------
  // LOAD USER DEPOSITS
  // -------------------------------

  const loadDeposits = async () => {
    if (!token) return;

    try {
      const res = await fetch(`${API}/api/deposit`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDepositHistory(data.deposits || []);
      }
    } catch (err) {
      console.error("Deposit History Error:", err);
    }
  };

  // -------------------------------
  // PAGE LOAD
  // -------------------------------

  useEffect(() => {
    const init = async () => {
      setPageLoading(true);

      await loadPaymentSettings();
      await loadDeposits();

      setPageLoading(false);
    };

    init();
  }, []);
    // ==========================================
  // SUBMIT DEPOSIT (PRODUCTION READY)
  // ==========================================

  const submitDeposit = async () => {
    // Validation
    if (!token) {
      alert("Please login first.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid deposit amount.");
      return;
    }

    if (!selectedFile) {
      alert("Please upload payment screenshot.");
      return;
    }

    try {
      setLoading(true);

      // Create FormData
      const formData = new FormData();

      formData.append("amount", amount);
      formData.append("walletType", walletType);
      formData.append("screenshot", selectedFile);

      // API Request
      const response = await fetch(`${API}/api/deposit`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Read JSON safely
      const data = await response.json();

      if (response.ok && data.success) {
        alert("🎉 Deposit submitted successfully. Waiting for admin approval.");

        // Reset Form
        setAmount("");
        setSelectedFile(null);
        setPreview("");

        // Refresh History
        await loadDeposits();

        return;
      }

      alert(data.message || "Deposit submission failed.");
    } catch (err) {
      console.error("Deposit Error:", err);
      alert("Server Error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // STATUS COLOR
  // ==========================================

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "text-green-400 bg-green-500/10 border-green-500";

      case "rejected":
        return "text-red-400 bg-red-500/10 border-red-500";

      default:
        return "text-yellow-400 bg-yellow-500/10 border-yellow-500";
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (pageLoading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <Loader2 className="animate-spin mr-3" size={24} />
        Loading Deposit Center...
      </main>
    );
  }
    return (
    <main className="min-h-screen bg-black text-white">
      {/* HEADER */}

      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-yellow-500">
        <div className="max-w-6xl mx-auto px-5 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-yellow-400">
              Deposit USDT TRC20
            </h1>

            <p className="text-gray-400 text-sm mt-1">
              Deposit funds securely and upload your payment proof.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="bg-zinc-900 border border-yellow-500 hover:bg-yellow-500 hover:text-black px-4 py-2 rounded-xl flex items-center gap-2 font-semibold"
          >
            <ArrowLeft size={18} />
            Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8 grid lg:grid-cols-2 gap-8">

        {/* LEFT SIDE */}

        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-6">

          <h2 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center gap-3">
            <Wallet size={24} />
            Payment Details
          </h2>

          {/* USDT WALLET */}

          <div className="bg-black rounded-2xl border border-green-500 p-5 mb-6">
            <p className="text-green-400 text-sm mb-2">
              USDT Network
            </p>

            <h3 className="font-bold text-xl">
              {paymentSettings?.usdtWallet.network || "TRC20"}
            </h3>

            <p className="text-gray-400 text-sm mt-4">
              Wallet Address
            </p>

            <div className="mt-2 bg-zinc-900 border border-zinc-700 rounded-xl p-3 break-all font-mono text-sm text-white">
              {paymentSettings?.usdtWallet.walletAddress ||
                "Wallet not configured."}
            </div>

            <button
              onClick={copyWallet}
              className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
            >
              <Copy size={18} />
              Copy Wallet Address
            </button>
          </div>

          {/* QR CODE */}

          <div className="bg-black rounded-2xl border border-yellow-500 p-5">
            <p className="text-gray-300 mb-4 font-semibold">
              Scan QR Code
            </p>

            {paymentSettings?.usdtWallet.qrCode ? (
              <img
                src={paymentSettings.usdtWallet.qrCode}
                alt="USDT QR Code"
                className="w-60 h-60 object-contain rounded-xl mx-auto bg-white p-3"
              />
            ) : (
              <div className="h-60 flex items-center justify-center text-gray-500 border border-dashed border-zinc-700 rounded-xl">
                QR Code Not Uploaded
              </div>
            )}
          </div>

          {/* SECURITY */}

          <div className="mt-6 bg-green-500/10 border border-green-500 rounded-2xl p-4">
            <div className="flex gap-3 items-center text-green-400">
              <ShieldCheck />
              <span className="font-bold">
                
              </span>
            </div>

            <ul className="text-sm text-gray-300 mt-3 space-y-2">
              <li>• Send USDT only on TRC20 Network.</li>
              <li>• Upload a clear payment screenshot.</li>
              <li>• Deposits are manually verified by admin.</li>
              <li>• Approval usually takes 5–30 minutes.</li>
            </ul>
          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-6">

          <h2 className="text-2xl font-bold text-yellow-400 mb-6">
            Submit Deposit
          </h2>

          {/* Amount */}

          <div className="mb-5">
            <label className="block mb-2 text-gray-400">
              Deposit Amount (PKR / USDT)
            </label>

            <input
              type="number"
              placeholder="Enter Deposit Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-black border border-yellow-500 rounded-xl p-4 outline-none focus:border-yellow-400"
            />
          </div>

          {/* Wallet Type */}

          <div className="mb-5">
            <label className="block mb-2 text-gray-400">
              Wallet Type
            </label>

            <select
              value={walletType}
              onChange={(e) => setWalletType(e.target.value)}
              className="w-full bg-black border border-yellow-500 rounded-xl p-4 outline-none"
            >
              <option value="USDT">USDT Wallet</option>
              <option value="PKR">PKR Wallet</option>
              <option value="GOLD">Gold Wallet</option>
            </select>
          </div>

          {/* Screenshot Upload */}

          <div className="mb-6">

            <label className="block mb-3 text-gray-400">
              Upload Payment Screenshot
            </label>

            <label className="border-2 border-dashed border-yellow-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-800 transition">

              <Upload className="text-yellow-400 mb-3" size={40} />

              <span className="text-sm text-gray-300">
                Click here to choose screenshot
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />

            </label>

            {preview && (
              <div className="mt-5">
                <img
                  src={preview}
                  alt="Preview"
                  className="rounded-2xl border border-yellow-500 w-full max-h-72 object-cover"
                />
              </div>
            )}
          </div>

          {/* Submit */}

          <button
            onClick={submitDeposit}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-xl font-bold flex justify-center items-center gap-3 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Submitting Deposit...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Submit Deposit
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500 mt-4">
            After submitting, your request will appear in Admin Deposit Center.
          </p>

        </div>

      </div>      {/* ==========================================
          DEPOSIT HISTORY
      ========================================== */}

      <div className="max-w-6xl mx-auto px-5 pb-10">

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

            <div>
              <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-3">
                <Clock size={24}/>
                Deposit History
              </h2>

              <p className="text-gray-400 text-sm mt-1">
                Your recent deposit requests and approval status.
              </p>
            </div>

            <button
              onClick={loadDeposits}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
            >
              <RefreshCw size={18}/>
              Refresh
            </button>

          </div>

          {/* EMPTY HISTORY */}

          {depositHistory.length === 0 ? (

            <div className="text-center py-14 border border-dashed border-zinc-700 rounded-2xl">

              <Clock size={42} className="mx-auto text-gray-600 mb-4"/>

              <p className="text-gray-500 text-lg">
                No Deposit History Found
              </p>

              <p className="text-gray-600 text-sm mt-2">
                Submit your first deposit to see history here.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {depositHistory.map((deposit) => (

                <div
                  key={deposit._id}
                  className="bg-black border border-zinc-700 rounded-2xl p-5 hover:border-yellow-500 transition"
                >

                  <div className="flex justify-between items-start flex-wrap gap-4">

                    <div>

                      <p className="text-gray-400 text-sm">
                        Deposit Amount
                      </p>

                      <h3 className="text-3xl font-bold text-green-400 mt-1">
                        PKR {Number(deposit.amount).toLocaleString()}
                      </h3>

                      <p className="text-gray-500 text-sm mt-3">
                        Wallet Type :{" "}
                        <span className="text-yellow-400 font-semibold">
                          {deposit.walletType || "USDT"}
                        </span>
                      </p>

                      <p className="text-gray-500 text-sm mt-2">
                        Date :{" "}
                        <span className="text-white">
                          {formatDate(deposit.createdAt)}
                        </span>
                      </p>

                    </div>

                    {/* STATUS */}

                    <div>

                      <span
                        className={`px-4 py-2 rounded-full border text-sm font-bold ${getStatusColor(
                          deposit.status
                        )}`}
                      >
                        {deposit.status.toUpperCase()}
                      </span>

                    </div>

                  </div>

                  {/* SCREENSHOT */}

                  {deposit.screenshot && (

                    <div className="mt-5">

                      <p className="text-gray-400 text-sm mb-3">
                        Uploaded Payment Screenshot
                      </p>

                      <img
                        src={
                          deposit.screenshot.startsWith("http")
                            ? deposit.screenshot
                            : `${API}/${deposit.screenshot}`
                        }
                        alt="Deposit Screenshot"
                        className="rounded-xl border border-yellow-500 w-full max-h-60 object-cover cursor-pointer hover:opacity-90"
                        onClick={() => {
                          const screenshot = deposit.screenshot;

                          if (!screenshot) return;

                          setPreview(
                            screenshot.startsWith("http")
                              ? screenshot
                              : `${API}/${screenshot}`
                          );
                        }}
                      />

                    </div>

                  )}

                </div>

              ))}

            </div>

          )}

        </div>

        {/* ==========================================
            STATUS SUMMARY
        ========================================== */}

        <div className="grid md:grid-cols-3 gap-5 mt-10">

          {/* Pending */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <div className="flex items-center gap-3 mb-3">
              <Clock className="text-yellow-400"/>
              <span className="font-bold text-yellow-400">
                Pending Deposits
              </span>
            </div>

            <h3 className="text-4xl font-black text-yellow-300">
              {
                depositHistory.filter(
                  (d) => d.status.toLowerCase() === "pending"
                ).length
              }
            </h3>

          </div>

          {/* Approved */}

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">

            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="text-green-400"/>
              <span className="font-bold text-green-400">
                Approved Deposits
              </span>
            </div>

            <h3 className="text-4xl font-black text-green-300">
              {
                depositHistory.filter(
                  (d) => d.status.toLowerCase() === "approved"
                ).length
              }
            </h3>

          </div>

          {/* Rejected */}

          <div className="bg-zinc-900 border border-red-600 rounded-2xl p-5">

            <div className="flex items-center gap-3 mb-3">
              <XCircle className="text-red-400"/>
              <span className="font-bold text-red-400">
                Rejected Deposits
              </span>
            </div>

            <h3 className="text-4xl font-black text-red-300">
              {
                depositHistory.filter(
                  (d) => d.status.toLowerCase() === "rejected"
                ).length
              }
            </h3>

          </div>

        </div>

      </div>

      {/* ==========================================
          IMAGE PREVIEW MODAL
      ========================================== */}

      {preview && (

        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">

          <div className="relative max-w-5xl w-full">

            <button
              onClick={() => setPreview("")}
              className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-500 rounded-full p-3"
            >
              <XCircle size={28}/>
            </button>

            <img
              src={preview}
              alt="Deposit Preview"
              className="w-full rounded-3xl border-2 border-yellow-500 max-h-[90vh] object-contain"
            />

          </div>

        </div>

      )}      {/* ==========================================
          LIVE STATUS
      ========================================== */}

      <div className="max-w-6xl mx-auto px-5 pb-10">
        <div className="grid md:grid-cols-3 gap-5">

          <div className="bg-zinc-900 border border-green-600 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="text-green-400" />
              <span className="font-bold text-green-400">
                Deposit System
              </span>
            </div>

            <p className="text-gray-300 text-sm">
              Manual verification enabled.
            </p>

            <p className="text-gray-500 text-xs mt-2">
              Every deposit is reviewed before wallet credit.
            </p>
          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Wallet className="text-cyan-400" />
              <span className="font-bold text-cyan-400">
                Wallet Credit
              </span>
            </div>

            <p className="text-gray-300 text-sm">
              USDT / PKR / Gold Wallet Supported.
            </p>

            <p className="text-gray-500 text-xs mt-2">
              Admin credits wallet after approval.
            </p>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <RefreshCw className="text-yellow-400" />
              <span className="font-bold text-yellow-400">
                Live Sync
              </span>
            </div>

            <p className="text-gray-300 text-sm">
              Deposit history updates automatically.
            </p>

            <p className="text-gray-500 text-xs mt-2">
              Refreshes every 15 seconds.
            </p>
          </div>

        </div>
      </div>

      {/* ==========================================
          FOOTER
      ========================================== */}

      <footer className="border-t border-zinc-800 py-8 mt-10 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-5 text-center">

          <h3 className="text-yellow-400 font-bold text-xl">
            GoldTrade Pakistan
          </h3>

          <p className="text-gray-400 mt-2">
            Secure Gold • USDT TRC20 • Wallet Deposit Platform
          </p>

          <p className="text-gray-600 text-sm mt-3">
            All deposits are verified manually by GoldTrade Admin Team.
          </p>

          <p className="text-gray-700 text-xs mt-4">
            © 2026 GoldTrade Pakistan — All Rights Reserved.
          </p>

        </div>
      </footer>

    </main>
  );
}