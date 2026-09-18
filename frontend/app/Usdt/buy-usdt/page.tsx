"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

// =====================================================
// GOLDTRADE V18 BUY Usdt PAGE
// PART 1/8
// Imports + API + Types + States
// =====================================================

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

type NetworkType = "TRC20" | "BEP20" | "ERC20";
type PaymentMethod = "Wallet Transfer" | "Bank Transfer";

interface WalletData {
  username?: string;
  PkrBalance: number;
  UsdtBalance: number;
  goldBalance: number;
}

interface WalletResponse {
  success: boolean;
  wallet: WalletData;
}

interface RateResponse {
  success: boolean;
  currency: string;
  rate: number;
  buyRate?: number;
  sellRate?: number;
}

interface HistoryItem {
  _id?: string;
  type: string;
  amount: number;
  price: number;
  network: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

interface BuyResponse {
  success: boolean;
  message: string;
}

// =====================================================
// COMPONENT START
// =====================================================

export default function BuyUsdtPage() {

// ==========================================
// USER INFO
// ==========================================

const [username, setUsername] = useState("");
const [token, setToken] = useState("");
const [mounted, setMounted] = useState(false);
// ==========================================
// LOAD USER FROM LOCAL STORAGE
// ==========================================

useEffect(() => {
  if (typeof window === "undefined") return;

  setUsername(localStorage.getItem("username") || "");
  setToken(localStorage.getItem("token") || "");
  setMounted(true);
}, []);

  // ==========================================
  // LOADING STATES
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [buyLoading, setBuyLoading] = useState(false);

  // ==========================================
  // ERROR / SUCCESS
  // ==========================================

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // LIVE RATE
  // ==========================================

  const [rate, setRate] = useState<number>(0);

  // ==========================================
  // WALLET DATA
  // ==========================================

  const [wallet, setWallet] = useState<WalletData>({
    PkrBalance: 0,
    UsdtBalance: 0,
    goldBalance: 0,
  });

  // ==========================================
  // BUY FORM
  // ==========================================

  const [amountPkr, setAmountPkr] = useState<number>(0);

  const [network, setNetwork] =
    useState<NetworkType>("TRC20");

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("Wallet Transfer");

  const [walletAddress, setWalletAddress] =
    useState("");

  const [note, setNote] = useState("");

  // ==========================================
  // HISTORY
  // ==========================================

  const [transactions, setTransactions] =
    useState<HistoryItem[]>([]);

  // ==========================================
  // CALCULATED Usdt
  // ==========================================

  const UsdtAmount = useMemo(() => {
    if (!rate || amountPkr <= 0) return 0;
    return Number((amountPkr / rate).toFixed(4));
  }, [amountPkr, rate]);

  const portfolioValue = useMemo(() => {
    return Number((wallet.UsdtBalance * rate).toFixed(2));
  }, [wallet.UsdtBalance, rate]);

  // =====================================================
  // PART 2/8
  // LOAD RATE + WALLET + HISTORY
  // =====================================================

  // ==========================================
  // LOAD LIVE Usdt RATE
  // GET /api/Usdt/rate
  // ==========================================

  const loadRate = async () => {
    try {
      const response = await fetch(`${API}/api/Usdt/rate`);

      if (!response.ok) {
        throw new Error(`Rate API failed (${response.status})`);
      }

      const data: RateResponse = await response.json();

      if (data.success) {
        setRate(Number(data.rate));
      }
    } catch (error) {
      console.error("Usdt RATE ERROR:", error);
      setErrorMessage("Unable to load Usdt rate.");
    }
  };

  // ==========================================
  // LOAD USER WALLET
  // GET /api/wallet/:username
  // ==========================================

  const loadWallet = async (
    currentUsername: string,
    currentToken: string
  ) => {
    try {
      const response = await fetch(
        `${API}/api/wallet/${currentUsername}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Wallet API failed (${response.status})`);
      }

      const data: WalletResponse = await response.json();

      if (data.success) {
        setWallet(data.wallet);
      }
    } catch (error) {
      console.error("LOAD WALLET ERROR:", error);
      setErrorMessage("Unable to load wallet.");
    }
  };

  // =====================================================
  // LOAD BUY HISTORY
  // GET /api/Usdt/history/:username
  // =====================================================

  const loadHistory = async (
    currentUsername: string,
    currentToken: string
  ) => {
    try {
      const response = await fetch(
        `${API}/api/Usdt/history/${currentUsername}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`History API failed (${response.status})`);
      }

      const data = await response.json();

      if (data.success) {
        setTransactions(data.history || []);
      }
    } catch (error) {
      console.error("LOAD HISTORY ERROR:", error);
    }
  };

  // =====================================================
  // LOAD COMPLETE DASHBOARD
  // =====================================================

  const loadDashboard = async (
    currentUsername: string,
    currentToken: string
  ) => {
    if (!currentUsername || !currentToken) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await Promise.all([
        loadRate(),
        loadWallet(currentUsername, currentToken),
        loadHistory(currentUsername, currentToken),
      ]);
    } catch (error) {
      console.error("BUY Usdt DASHBOARD ERROR:", error);
      setErrorMessage("Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REFRESH DASHBOARD
  // =====================================================

  const refreshWallet = async () => {
    if (!username || !token) return;

    await loadDashboard(username, token);
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    if (!username || !token) {
      setLoading(false);
      setErrorMessage("Please login first.");
      return;
    }

    loadDashboard(username, token);
  }, [username, token]);

  // =====================================================
  // AUTO CLEAR SUCCESS MESSAGE
  // =====================================================

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [successMessage]);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-PK", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (amount: number) => {
    return Number(amount || 0).toLocaleString("en-PK");
  };

  // =====================================================
  // NETWORK LIST
  // =====================================================

  const networkOptions: NetworkType[] = [
    "TRC20",
    "BEP20",
    "ERC20",
  ];
    // =====================================================
  // PART 4/8
  // BUY Usdt REQUEST
  // POST /api/Usdt/buy
  // =====================================================

  const submitBuyRequest = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!username || !token) {
      setErrorMessage("Please login first.");
      return;
    }

    if (amountPkr <= 0) {
      setErrorMessage("Enter Pkr amount.");
      return;
    }

    if (UsdtAmount <= 0) {
      setErrorMessage("Invalid Usdt amount.");
      return;
    }

    if (!walletAddress.trim()) {
      setErrorMessage("Enter your Usdt wallet address.");
      return;
    }

    if (paymentMethod === "Wallet Transfer" && wallet.PkrBalance < amountPkr) {
      setErrorMessage("Insufficient Pkr wallet balance.");
      return;
    }

    setBuyLoading(true);

    try {
      const response = await fetch(`${API}/api/Usdt/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username,
          amountPkr,
          UsdtAmount,
          rate,
          network,
          paymentMethod,
          walletAddress,
          note,
        }),
      });

      const data: BuyResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Buy request failed.");
      }

      setSuccessMessage(data.message || "Buy request submitted successfully.");

      // Reset form
      setAmountPkr(0);
      setWalletAddress("");
      setNote("");
      setNetwork("TRC20");
      setPaymentMethod("Wallet Transfer");

      // Reload dashboard after successful request
      await Promise.all([
        loadWallet(username, token),
        loadHistory(username, token),
      ]);
    } catch (error: any) {
      console.error("BUY Usdt ERROR:", error);
      setErrorMessage(error.message || "Unable to submit buy request.");
    } finally {
      setBuyLoading(false);
    }
  };

  // =====================================================
  // RESET BUY FORM
  // =====================================================

  const resetBuyForm = () => {
    setAmountPkr(0);
    setWalletAddress("");
    setNote("");
    setNetwork("TRC20");
    setPaymentMethod("Wallet Transfer");
    setErrorMessage("");
    setSuccessMessage("");
  };  // =====================================================
  // PART 5/8
  // RETURN START + HEADER + WALLET CARDS
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="bg-gradient-to-r from-cyan-700 via-blue-700 to-indigo-700 text-white shadow-xl">
        <div className="mx-auto max-w-7xl px-6 py-8">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>
              <p className="text-cyan-200 text-sm font-medium uppercase tracking-widest">
                GoldTrade Wallet
              </p>

              <h1 className="mt-2 text-4xl font-bold">
                Buy Usdt
              </h1>

              <p className="mt-2 text-blue-100">
                Purchase Usdt instantly using your Pkr wallet or bank transfer.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              <Link
                href="/wallet"
                className="rounded-xl bg-white/20 px-5 py-3 text-sm font-semibold backdrop-blur hover:bg-white/30"
              >
                ← Wallet
              </Link>

              <Link
                href="/Usdt"
                className="rounded-xl bg-white/20 px-5 py-3 text-sm font-semibold backdrop-blur hover:bg-white/30"
              >
                Usdt Dashboard
              </Link>

              <button
                onClick={refreshWallet}
                disabled={loading}
                className="rounded-xl bg-green-500 px-5 py-3 text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? "Refreshing..." : "Refresh Wallet"}
              </button>

            </div>

          </div>

        </div>
      </div>

      {/* ==========================================
          PAGE CONTAINER
      ========================================== */}

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">

        {/* ==========================================
            ERROR MESSAGE
        ========================================== */}

        {errorMessage && (
          <div className="rounded-xl border border-red-300 bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {/* ==========================================
            SUCCESS MESSAGE
        ========================================== */}

        {successMessage && (
          <div className="rounded-xl border border-green-300 bg-green-100 p-4 text-green-700">
            {successMessage}
          </div>
        )}

        {/* ==========================================
            WALLET CARDS
        ========================================== */}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">

          {/* Pkr Wallet */}

          <div className="rounded-3xl bg-white p-6 shadow-lg border-l-8 border-green-500">

            <p className="text-gray-500 text-sm uppercase tracking-wide">
              Pkr Wallet
            </p>

            <h2 className="mt-3 text-3xl font-bold text-green-600">
              Rs. {formatCurrency(wallet.PkrBalance)}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Available balance for Usdt purchases.
            </p>

          </div>

          {/* Usdt Wallet */}

          <div className="rounded-3xl bg-white p-6 shadow-lg border-l-8 border-cyan-500">

            <p className="text-gray-500 text-sm uppercase tracking-wide">
              Usdt Wallet
            </p>

            <h2 className="mt-3 text-3xl font-bold text-cyan-600">
              {wallet.UsdtBalance.toFixed(4)} Usdt
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Current Usdt balance.
            </p>

          </div>

          {/* GOLD Wallet */}

          <div className="rounded-3xl bg-white p-6 shadow-lg border-l-8 border-yellow-500">

            <p className="text-gray-500 text-sm uppercase tracking-wide">
              Gold Wallet
            </p>

            <h2 className="mt-3 text-3xl font-bold text-yellow-600">
              {wallet.goldBalance.toFixed(4)} g
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Your GoldTrade balance.
            </p>

          </div>

          {/* Live Rate */}

          <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white shadow-xl">

            <p className="text-cyan-100 text-sm uppercase tracking-wide">
              Live Usdt Rate
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              Rs. {formatCurrency(rate)}
            </h2>

            <p className="mt-2 text-sm text-cyan-100">
              Updated from GoldTrade server.
            </p>

          </div>

        </div>

        {/* ==========================================
            PORTFOLIO VALUE CARD
        ========================================== */}

        <div className="rounded-3xl bg-gradient-to-r from-indigo-700 to-blue-700 p-8 text-white shadow-xl">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <p className="text-blue-200 uppercase text-sm tracking-widest">
                Estimated Usdt Portfolio
              </p>

              <h2 className="mt-2 text-4xl font-bold">
                Rs. {formatCurrency(portfolioValue)}
              </h2>

              <p className="mt-2 text-blue-100">
                Current value of your Usdt wallet at the live market rate.
              </p>

            </div>

            <div className="rounded-2xl bg-white/20 px-6 py-4 backdrop-blur">

              <p className="text-sm text-blue-100">
                Logged in as
              </p>

              <h3 className="text-2xl font-bold">
                {username || "Guest"}
              </h3>

            </div>

          </div>

        </div>

                {/* ==========================================
            BUY Usdt FORM
        ========================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

          {/* ==========================================
              BUY FORM CARD
          ========================================== */}

          <div className="xl:col-span-2 rounded-3xl bg-white p-8 shadow-lg">

            <div className="mb-6">
              <h2 className="text-3xl font-bold text-slate-800">
                Buy Usdt
              </h2>

              <p className="mt-2 text-slate-500">
                Enter Pkr amount and submit a Usdt purchase request.
              </p>
            </div>

            <div className="space-y-6">

              {/* Pkr Amount */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Pkr Amount
                </label>

                <input
                  type="number"
                  min={0}
                  value={amountPkr || ""}
                  onChange={(e) =>
                    setAmountPkr(Number(e.target.value))
                  }
                  placeholder="Enter Pkr amount"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-lg outline-none focus:border-cyan-500"
                />
              </div>

              {/* Live Conversion */}

              <div className="rounded-2xl bg-cyan-50 p-5">

                <div className="flex items-center justify-between">

                  <span className="font-medium text-slate-700">
                    Live Rate
                  </span>

                  <span className="font-bold text-cyan-700">
                    Rs. {formatCurrency(rate)}
                  </span>

                </div>

                <div className="mt-4 flex items-center justify-between">

                  <span className="font-medium text-slate-700">
                    You Will Receive
                  </span>

                  <span className="text-3xl font-bold text-green-600">
                    {UsdtAmount.toFixed(4)} Usdt
                  </span>

                </div>

              </div>

              {/* Network */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Network
                </label>

                <select
                  value={network}
                  onChange={(e) =>
                    setNetwork(e.target.value as NetworkType)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                >
                  {networkOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Method
                </label>

                <div className="grid grid-cols-2 gap-4">

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod("Wallet Transfer")
                    }
                    className={`rounded-xl border px-4 py-3 font-semibold transition ${
                      paymentMethod === "Wallet Transfer"
                        ? "border-cyan-600 bg-cyan-600 text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    Wallet Transfer
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setPaymentMethod("Bank Transfer")
                    }
                    className={`rounded-xl border px-4 py-3 font-semibold transition ${
                      paymentMethod === "Bank Transfer"
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    }`}
                  >
                    Bank Transfer
                  </button>

                </div>
              </div>

              {/* Wallet Address */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Your Usdt Wallet Address
                </label>

                <textarea
                  rows={3}
                  value={walletAddress}
                  onChange={(e) =>
                    setWalletAddress(e.target.value)
                  }
                  placeholder="Paste your TRC20 / BEP20 / ERC20 wallet address..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Note */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Note (Optional)
                </label>

                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) =>
                    setNote(e.target.value)
                  }
                  placeholder="Write an optional note..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-500"
                />
              </div>

              {/* Action Buttons */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                <button
                  type="button"
                  disabled={buyLoading}
                  onClick={submitBuyRequest}
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-700 px-6 py-4 text-lg font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {buyLoading
                    ? "Submitting Request..."
                    : "Buy Usdt Now"}
                </button>

                <button
                  type="button"
                  onClick={resetBuyForm}
                  className="rounded-xl border border-slate-300 px-6 py-4 text-lg font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Reset Form
                </button>

              </div>

            </div>

          </div>

          {/* ==========================================
              PURCHASE SUMMARY CARD
          ========================================== */}

          <div className="rounded-3xl bg-white p-8 shadow-lg">

            <h3 className="mb-6 text-2xl font-bold text-slate-800">
              Purchase Summary
            </h3>

            <div className="space-y-5">

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Payment Method
                </span>

                <span className="font-bold text-slate-700">
                  {paymentMethod}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Selected Network
                </span>

                <span className="font-bold text-slate-700">
                  {network}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Pkr Amount
                </span>

                <span className="font-bold text-green-600">
                  Rs. {formatCurrency(amountPkr)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Usdt Receive
                </span>

                <span className="text-xl font-bold text-cyan-600">
                  {UsdtAmount.toFixed(4)} Usdt
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Live Rate
                </span>

                <span className="font-bold text-slate-700">
                  Rs. {formatCurrency(rate)}
                </span>
              </div>

              <hr />

              <div className="rounded-2xl bg-slate-100 p-5">

                <p className="text-sm text-slate-500">
                  Available Pkr Wallet
                </p>

                <h2 className="mt-2 text-3xl font-bold text-green-600">
                  Rs. {formatCurrency(wallet.PkrBalance)}
                </h2>

              </div>

              <div className="rounded-2xl bg-cyan-50 p-5">

                <p className="text-sm text-slate-500">
                  Current Usdt Wallet
                </p>

                <h2 className="mt-2 text-3xl font-bold text-cyan-600">
                  {wallet.UsdtBalance.toFixed(4)} Usdt
                </h2>

              </div>

            </div>

          </div>

        </div>

                {/* ==========================================
            BUY Usdt TRANSACTION HISTORY
        ========================================== */}

        <div className="rounded-3xl bg-white p-8 shadow-lg">

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-3xl font-bold text-slate-800">
                Buy Usdt History
              </h2>

              <p className="mt-1 text-slate-500">
                Your latest Buy Usdt requests and approval status.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshWallet}
              className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white hover:bg-cyan-700"
            >
              Refresh History
            </button>

          </div>

          {/* Empty State */}

          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 py-14 text-center">

              <div className="text-6xl">📄</div>

              <h3 className="mt-4 text-xl font-semibold text-slate-700">
                No Buy Usdt Transactions
              </h3>

              <p className="mt-2 text-slate-500">
                Your Buy Usdt history will appear here after submitting a request.
              </p>

            </div>
          ) : (

            <div className="overflow-x-auto rounded-2xl border border-slate-200">

              <table className="min-w-full">

                <thead className="bg-slate-100">

                  <tr className="text-left text-sm uppercase text-slate-600">

                    <th className="px-4 py-3">Date</th>

                    <th className="px-4 py-3">Network</th>

                    <th className="px-4 py-3">Pkr</th>

                    <th className="px-4 py-3">Usdt</th>

                    <th className="px-4 py-3">Rate</th>

                    <th className="px-4 py-3">Payment</th>

                    <th className="px-4 py-3 text-center">Status</th>

                  </tr>

                </thead>

                <tbody>

                  {transactions.map((tx) => (

                    <tr
                      key={tx._id || tx.createdAt}
                      className="border-t border-slate-200 hover:bg-slate-50"
                    >

                      {/* Date */}

                      <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                        {formatDate(tx.createdAt)}
                      </td>

                      {/* Network */}

                      <td className="px-4 py-4">
                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">
                          {tx.network}
                        </span>
                      </td>

                      {/* Pkr */}

                      <td className="px-4 py-4 font-semibold text-green-600 whitespace-nowrap">
                        Rs. {formatCurrency(tx.amount)}
                      </td>

                      {/* Usdt */}

                      <td className="px-4 py-4 font-bold text-cyan-700 whitespace-nowrap">
                        {(tx.amount / tx.price).toFixed(4)} Usdt
                      </td>

                      {/* Rate */}

                      <td className="px-4 py-4 whitespace-nowrap">
                        Rs. {formatCurrency(tx.price)}
                      </td>

                      {/* Payment */}

                      <td className="px-4 py-4 whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>

                      {/* Status */}

                      <td className="px-4 py-4 text-center">

                        {tx.status === "approved" && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            Approved
                          </span>
                        )}

                        {tx.status === "pending" && (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                            Pending
                          </span>
                        )}

                        {tx.status === "rejected" && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            Rejected
                          </span>
                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* ==========================================
            QUICK ACTION BUTTONS
        ========================================== */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <Link
            href="/Usdt"
            className="rounded-2xl bg-cyan-600 p-5 text-center text-white shadow-lg transition hover:bg-cyan-700"
          >
            <div className="mb-2 text-3xl">🏠</div>

            <h3 className="font-bold text-lg">
              Usdt Dashboard
            </h3>

            <p className="mt-1 text-sm text-cyan-100">
              Back to Usdt dashboard.
            </p>
          </Link>

          <Link
            href="/Usdt/sell-Usdt"
            className="rounded-2xl bg-indigo-600 p-5 text-center text-white shadow-lg transition hover:bg-indigo-700"
          >
            <div className="mb-2 text-3xl">💸</div>

            <h3 className="font-bold text-lg">
              Sell Usdt
            </h3>

            <p className="mt-1 text-sm text-indigo-100">
              Sell Usdt using your wallet.
            </p>
          </Link>

          <Link
            href="/wallet"
            className="rounded-2xl bg-green-600 p-5 text-center text-white shadow-lg transition hover:bg-green-700"
          >
            <div className="mb-2 text-3xl">👛</div>

            <h3 className="font-bold text-lg">
              Wallet
            </h3>

            <p className="mt-1 text-sm text-green-100">
              View Pkr, Usdt and Gold wallet.
            </p>
          </Link>

        </div>

                {/* ==========================================
            BUY Usdt INFORMATION
        ========================================== */}

        <div className="rounded-3xl bg-gradient-to-r from-cyan-700 to-blue-700 p-8 text-white shadow-xl">

          <h2 className="text-3xl font-bold">
            GoldTrade V18 — Buy Usdt Guide
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <h3 className="mb-2 font-bold text-lg">
                Wallet Transfer
              </h3>

              <p className="text-cyan-100 text-sm leading-6">
                Buy Usdt instantly using your available Pkr Wallet balance.
                Your request is submitted to the GoldTrade admin for approval.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
              <h3 className="mb-2 font-bold text-lg">
                Bank Transfer
              </h3>

              <p className="text-cyan-100 text-sm leading-6">
                Select Bank Transfer if you want to purchase Usdt using an
                external bank payment. The admin will verify your payment before
                crediting Usdt.
              </p>
            </div>

          </div>

          <div className="mt-6 rounded-2xl bg-white/10 p-5 backdrop-blur">

            <p className="text-cyan-100 text-sm">
              Supported Networks
            </p>

            <div className="mt-3 flex flex-wrap gap-3">

              <span className="rounded-full bg-green-500 px-4 py-2 text-sm font-semibold">
                TRC20
              </span>

              <span className="rounded-full bg-yellow-500 px-4 py-2 text-sm font-semibold text-black">
                BEP20
              </span>

              <span className="rounded-full bg-purple-500 px-4 py-2 text-sm font-semibold">
                ERC20
              </span>

            </div>

          </div>

        </div>

        {/* ==========================================
            FOOTER
        ========================================== */}

        <div className="pb-10 pt-4 text-center">

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} GoldTrade Wallet —1ST Pakistan Wallet
            Wallet for Pkr, GOLD & Usdt.
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Buy requests are processed after AI verifications Program.
          
          </p>

        </div>

      </div>
    </div>
  );
}