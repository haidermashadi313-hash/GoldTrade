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
// API CONFIG
// ======================================================

const getApiUrl = () => {
  if (typeof window === "undefined") {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      "https://goldtrade-2.onrender.com"
    );
  }

  const hostname = window.location.hostname;

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1"
  ) {
    return "http://localhost:5000";
  }

  return (
    process.env.NEXT_PUBLIC_API_URL ||
    "https://goldtrade-2.onrender.com"
  ).replace(/\/+$/, "");
};

const API = getApiUrl();

// ======================================================
// BUY REQUEST API
// ======================================================
//
// This page is currently a manual-payment/request page.
// Keep the existing backend endpoint until the new
// USDT request route is implemented.
//

const BUY_REQUEST_API =
  process.env.NEXT_PUBLIC_USDT_BUY_REQUEST_API ||
  `${API}/api/gold/admin/Usdt`;

// ======================================================
// TYPES
// ======================================================

interface WalletResponse {
  success?: boolean;

  wallet?: {
    walletBalance?: number;
    pkrBalance?: number;
    usdtBalance?: number;
    rate?: number;
  };

  Wallet?: {
    WalletBalance?: number;
    PkrBalance?: number;
    UsdtBalance?: number;
    rate?: number;
  };

  walletBalance?: number;
  pkrBalance?: number;
  usdtBalance?: number;

  rate?: number;
  buyRate?: number;

  marketStatus?: string;
  tradingEnabled?: boolean;

  message?: string;
}

interface BuyResponse {
  success?: boolean;
  message?: string;

  transaction?: {
    usdtAmount?: number;
    UsdtAmount?: number;
    rate?: number;
    totalPkr?: number;
    status?: string;
  };

  wallet?: {
    walletBalance?: number;
    usdtBalance?: number;
  };

  Wallet?: {
    WalletBalance?: number;
    UsdtBalance?: number;
  };
}

// ======================================================
// PAGE
// ======================================================

export default function BuyUsdtPage() {
  // ====================================================
  // USER / AUTH
  // ====================================================

  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");

  // ====================================================
  // WALLET
  // ====================================================

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [usdtBalance, setUsdtBalance] =
    useState(0);

  const [rate, setRate] =
    useState(280);

  // ====================================================
  // MARKET
  // ====================================================

  const [tradingEnabled, setTradingEnabled] =
    useState(true);

  const [marketStatus, setMarketStatus] =
    useState<"OPEN" | "CLOSED">("OPEN");

  // ====================================================
  // BUY FORM
  // ====================================================

  const [usdtAmount, setUsdtAmount] =
    useState("");

  const [walletAddress, setWalletAddress] =
    useState("");

  const [txHash, setTxHash] =
    useState("");

  const [receipt, setReceipt] =
    useState<File | null>(null);

  // ====================================================
  // UI
  // ====================================================

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  // ====================================================
  // COMPANY WALLET
  // ====================================================

  const companyWalletAddress =
    process.env.NEXT_PUBLIC_USDT_COMPANY_ADDRESS ||
    "";

  const companyWallet = {
    network: "TRC20",
    address: companyWalletAddress,
    accountName: "GoldTrade Official Wallet",
  };
    // ====================================================
  // AUTH HEADERS
  // ====================================================

  const getHeaders = (): HeadersInit => {
    const currentToken =
      token ||
      (typeof window !== "undefined"
        ? localStorage.getItem("token") || ""
        : "");

    return {
      Authorization: `Bearer ${currentToken}`,
      "Content-Type": "application/json",
    };
  };

  // ====================================================
  // LOAD AUTH
  // ====================================================

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedToken =
      localStorage.getItem("token") || "";

    const storedUsername =
      localStorage.getItem("username") || "";

    if (!storedToken) {
      window.location.href = "/login";
      return;
    }

    setToken(storedToken);
    setUsername(storedUsername);
  }, []);

  // ====================================================
  // LOAD WALLET
  // ====================================================

  const loadWallet = async () => {
    if (!username || !token) {
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API}/api/wallet/${encodeURIComponent(
          username
        )}`,
        {
          method: "GET",
          headers: getHeaders(),
          cache: "no-store",
        }
      );

      const result: WalletResponse =
        await response
          .json()
          .catch(() => ({}));

      console.log(
        "Admin USDT Buy Wallet:",
        result
      );

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Unable to load wallet."
        );
      }

      // ==================================================
      // WALLET DATA
      // ==================================================

      const walletObject =
        result.wallet ||
        result.Wallet ||
        {};

      const walletBalanceValue = Number(
        result.walletBalance ??
          result.pkrBalance ??
          ("walletBalance" in walletObject
            ? walletObject.walletBalance
            : undefined) ??
          ("pkrBalance" in walletObject
            ? walletObject.pkrBalance
            : undefined) ??
          result.Wallet?.WalletBalance ??
          result.Wallet?.PkrBalance ??
          0
      );

      const usdtBalanceValue = Number(
        result.usdtBalance ??
          ("usdtBalance" in walletObject
            ? walletObject.usdtBalance
            : undefined) ??
          result.Wallet?.UsdtBalance ??
          0
      );

      // ==================================================
      // RATE
      // ==================================================

      const rateValue = Number(
        result.rate ??
          result.buyRate ??
          walletObject.rate ??
          result.Wallet?.rate ??
          280
      );

      // ==================================================
      // MARKET STATUS
      // ==================================================

      const normalizedStatus =
        String(
          result.marketStatus ||
            "OPEN"
        ).toUpperCase();

      setMarketStatus(
        normalizedStatus === "CLOSED"
          ? "CLOSED"
          : "OPEN"
      );

      setTradingEnabled(
        result.tradingEnabled ??
          true
      );

      // ==================================================
      // SAFE SET
      // ==================================================

      setWalletBalance(
        Number.isFinite(
          walletBalanceValue
        )
          ? walletBalanceValue
          : 0
      );

      setUsdtBalance(
        Number.isFinite(
          usdtBalanceValue
        )
          ? usdtBalanceValue
          : 0
      );

      setRate(
        Number.isFinite(rateValue) &&
          rateValue > 0
          ? rateValue
          : 280
      );
    } catch (error) {
      console.error(
        "Admin USDT Buy Wallet Error:",
        error
      );

      setWalletBalance(0);
      setUsdtBalance(0);
      setRate(280);

      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load wallet."
      );
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // INITIAL WALLET LOAD
  // ====================================================

  useEffect(() => {
    if (!username || !token) {
      return;
    }

    loadWallet();
  }, [username, token]);
    // ====================================================
  // AUTO REFRESH
  // ====================================================

  useEffect(() => {
    if (!username || !token) {
      return;
    }

    const timer = window.setInterval(() => {
      loadWallet();
    }, 15000);

    return () => {
      window.clearInterval(timer);
    };
  }, [username, token]);

  // ====================================================
  // SAFE USDT AMOUNT
  // ====================================================

  const numericUsdtAmount =
    Number(usdtAmount || 0);

  const safeUsdtAmount =
    Number.isFinite(
      numericUsdtAmount
    ) && numericUsdtAmount > 0
      ? numericUsdtAmount
      : 0;

  // ====================================================
  // TOTAL PKR
  // ====================================================

  const totalPkr = useMemo(() => {
    const total =
      safeUsdtAmount * rate;

    return Number.isFinite(total)
      ? total
      : 0;
  }, [
    safeUsdtAmount,
    rate,
  ]);

  // ====================================================
  // MARKET CHECK
  // ====================================================

  const marketOpen =
    marketStatus === "OPEN";

  const tradingAvailable =
    tradingEnabled &&
    marketOpen;

  // ====================================================
  // BALANCE CHECK
  // ====================================================

  const enoughBalance =
    walletBalance >= totalPkr &&
    totalPkr > 0;

  // ====================================================
  // FORM VALIDATION
  // ====================================================

  const validateForm = () => {
    setMessage("");

    // -----------------------------------------------
    // Market
    // -----------------------------------------------

    if (!tradingEnabled) {
      setMessageType("error");
      setMessage(
        "USDT trading is currently disabled by admin."
      );
      return false;
    }

    if (!marketOpen) {
      setMessageType("error");
      setMessage(
        "USDT market is currently closed."
      );
      return false;
    }

    // -----------------------------------------------
    // Amount
    // -----------------------------------------------

    if (
      !Number.isFinite(
        numericUsdtAmount
      ) ||
      numericUsdtAmount < 1
    ) {
      setMessageType("error");
      setMessage(
        "Minimum USDT amount is 1 USDT."
      );
      return false;
    }

    // -----------------------------------------------
    // Rate
    // -----------------------------------------------

    if (
      !Number.isFinite(rate) ||
      rate <= 0
    ) {
      setMessageType("error");
      setMessage(
        "USDT rate is currently unavailable."
      );
      return false;
    }

    // -----------------------------------------------
    // Wallet balance
    // -----------------------------------------------

    if (!enoughBalance) {
      setMessageType("error");
      setMessage(
        "Insufficient PKR wallet balance."
      );
      return false;
    }

    // -----------------------------------------------
    // Receiving wallet
    // -----------------------------------------------

    if (!walletAddress.trim()) {
      setMessageType("error");
      setMessage(
        "Please enter your TRC20 receiving wallet address."
      );
      return false;
    }

    // -----------------------------------------------
    // Basic TRON address validation
    // -----------------------------------------------

    if (
      !/^T[a-zA-Z0-9]{33}$/.test(
        walletAddress.trim()
      )
    ) {
      setMessageType("error");
      setMessage(
        "Please enter a valid TRC20 wallet address."
      );
      return false;
    }

    // -----------------------------------------------
    // Receipt
    // -----------------------------------------------

    if (!receipt) {
      setMessageType("error");
      setMessage(
        "Please upload your payment receipt."
      );
      return false;
    }

    // -----------------------------------------------
    // File type
    // -----------------------------------------------

    const allowedTypes = [
      "image/jpeg",
      "image/png",
    ];

    if (
      !allowedTypes.includes(
        receipt.type
      )
    ) {
      setMessageType("error");
      setMessage(
        "Receipt must be JPG, JPEG or PNG."
      );
      return false;
    }

    // -----------------------------------------------
    // File size 5MB
    // -----------------------------------------------

    const maxFileSize =
      5 * 1024 * 1024;

    if (
      receipt.size >
      maxFileSize
    ) {
      setMessageType("error");
      setMessage(
        "Receipt file must be smaller than 5MB."
      );
      return false;
    }

    // -----------------------------------------------
    // Company wallet
    // -----------------------------------------------

    if (!companyWallet.address) {
      setMessageType("error");
      setMessage(
        "Company USDT payment wallet is not configured."
      );
      return false;
    }

    return true;
  };

  // ====================================================
  // REFRESH BUTTON
  // ====================================================

  const refreshWallet = async () => {
    await loadWallet();
  };

  // ====================================================
  // COPY COMPANY WALLET
  // ====================================================

  const copyWalletAddress = async () => {
    if (!companyWallet.address) {
      setMessageType("error");
      setMessage(
        "Company wallet address is not configured."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(
        companyWallet.address
      );

      setMessageType("success");
      setMessage(
        "Company wallet address copied successfully."
      );
    } catch (error) {
      console.error(error);

      setMessageType("error");
      setMessage(
        "Unable to copy wallet address."
      );
    }
  };
    // ====================================================
  // BUY USDT REQUEST
  // ====================================================

  const handleBuyUsdt = async () => {
    if (submitting) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const currentToken =
        token ||
        localStorage.getItem("token") ||
        "";

      if (!currentToken) {
        throw new Error(
          "Authentication token not found."
        );
      }

      // ==================================================
      // FORM DATA
      // ==================================================

      const formData =
        new FormData();

      formData.append(
        "username",
        username
      );

      formData.append(
        "usdtAmount",
        String(
          Number(
            numericUsdtAmount.toFixed(8)
          )
        )
      );

      // Legacy backend compatibility
      formData.append(
        "UsdtAmount",
        String(
          Number(
            numericUsdtAmount.toFixed(8)
          )
        )
      );

      formData.append(
        "walletAddress",
        walletAddress.trim()
      );

      // Legacy backend compatibility
      formData.append(
        "WalletAddress",
        walletAddress.trim()
      );

      formData.append(
        "txHash",
        txHash.trim()
      );

      formData.append(
        "network",
        "TRC20"
      );

      formData.append(
        "rate",
        String(rate)
      );

      formData.append(
        "totalPkr",
        String(totalPkr)
      );

      formData.append(
        "receipt",
        receipt as File
      );

      // ==================================================
      // API
      // ==================================================

      const response =
        await fetch(
          BUY_REQUEST_API,
          {
            method: "POST",

            headers: {
              Authorization: `Bearer ${currentToken}`,
            },

            body: formData,
          }
        );

      const result: BuyResponse =
        await response
          .json()
          .catch(() => ({}));

      console.log(
        "Admin USDT Buy Response:",
        result
      );

      if (
        !response.ok ||
        result.success === false
      ) {
        throw new Error(
          result.message ||
            "Unable to submit USDT buy request."
        );
      }

      // ==================================================
      // SUCCESS
      // ==================================================

      setMessageType("success");

      setMessage(
        result.message ||
          "USDT buy request submitted successfully."
      );

      // ==================================================
      // RESET FORM
      // ==================================================

      setUsdtAmount("");
      setWalletAddress("");
      setTxHash("");
      setReceipt(null);

      // ==================================================
      // REFRESH WALLET
      // ==================================================

      await loadWallet();
    } catch (error) {
      console.error(
        "Admin USDT Buy Error:",
        error
      );

      setMessageType("error");

      setMessage(
        error instanceof Error
          ? error.message
          : "USDT purchase request failed."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ====================================================
  // AUTO CLEAR MESSAGE
  // ====================================================

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setMessage("");
      }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  // ====================================================
  // RECEIPT NAME
  // ====================================================

  const receiptFileName =
    receipt?.name || "";

  // ====================================================
  // LOADING SCREEN
  // ====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-green-400">

        <RefreshCw
          className="animate-spin mr-3"
          size={28}
        />

        Loading USDT Buy...
      </div>
    );
  }

  // ====================================================
  // PAGE
  // ====================================================

  return (
    <main className="min-h-screen bg-black text-white pb-16">

      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-green-600">

        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">

          <div>

            <Link
              href="/admin/usdt"
              className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 text-sm font-medium"
            >
              <ArrowLeft size={16} />

              Back to Admin USDT
            </Link>

            <h1 className="text-4xl font-black text-green-400 mt-2">
              Buy USDT
            </h1>

            <p className="text-gray-400 mt-2">
              Submit and manage a USDT purchase request.
            </p>

          </div>

          <button
            type="button"
            onClick={refreshWallet}
            disabled={loading}
            className="bg-green-500 hover:bg-green-400 disabled:bg-zinc-700 text-black disabled:text-gray-400 font-bold px-5 py-3 rounded-xl flex items-center gap-2"
          >

            <RefreshCw
              size={18}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh Wallet

          </button>

        </div>

      </div>
            {/* ==================================================
          PAGE BODY
      ================================================== */}

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ==================================================
            MESSAGE
        ================================================== */}

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

            <span className="font-semibold">
              {message}
            </span>

          </div>
        )}

        {/* ==================================================
            MARKET STATUS
        ================================================== */}

        <div
          className={`mb-8 rounded-2xl border p-5 ${
            tradingAvailable
              ? "bg-green-950 border-green-500"
              : "bg-red-950 border-red-500"
          }`}
        >

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>

              <h2 className="text-xl font-bold">
                {tradingAvailable
                  ? "USDT Trading Available"
                  : "USDT Trading Unavailable"}
              </h2>

              <p className="text-gray-400 mt-1">
                {tradingEnabled
                  ? marketOpen
                    ? "USDT purchase requests are currently available."
                    : "USDT market is currently closed."
                  : "USDT trading has been disabled by admin."}
              </p>

            </div>

            <span
              className={`px-4 py-2 rounded-full font-bold ${
                tradingAvailable
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {tradingEnabled
                ? marketStatus
                : "DISABLED"}
            </span>

          </div>

        </div>

        {/* ==================================================
            WALLET SUMMARY
        ================================================== */}

        <div className="grid lg:grid-cols-3 gap-5 mb-10">

          {/* PKR */}

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

            <Wallet
              className="text-yellow-400 mb-4"
              size={34}
            />

            <p className="text-gray-400 text-sm">
              PKR Wallet Balance
            </p>

            <h2 className="text-4xl font-black text-yellow-400 mt-3">

              PKR{" "}
              {walletBalance.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 2,
                }
              )}

            </h2>

          </div>

          {/* USDT */}

          <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">

            <DollarSign
              className="text-green-400 mb-4"
              size={34}
            />

            <p className="text-gray-400 text-sm">
              Current USDT Balance
            </p>

            <h2 className="text-4xl font-black text-green-400 mt-3">

              {usdtBalance.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 8,
                }
              )}{" "}
              USDT

            </h2>

          </div>

          {/* RATE */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">

            <QrCode
              className="text-cyan-400 mb-4"
              size={34}
            />

            <p className="text-gray-400 text-sm">
              Live USDT Buy Rate
            </p>

            <h2 className="text-4xl font-black text-cyan-400 mt-3">

              PKR{" "}
              {rate.toLocaleString(
                undefined,
                {
                  maximumFractionDigits: 4,
                }
              )}

            </h2>

            <p className="text-xs text-gray-500 mt-2">
              1 USDT = PKR{" "}
              {rate.toLocaleString()}
            </p>

          </div>

        </div>

        {/* ==================================================
            USDT AMOUNT
        ================================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-green-400 mb-5">
            Enter USDT Amount
          </h2>

          <div className="relative">

            <DollarSign
              className="absolute left-4 top-4 text-green-400"
              size={24}
            />

            <input
              type="number"
              min="1"
              step="0.01"
              value={usdtAmount}
              onChange={(e) => {
                setUsdtAmount(
                  e.target.value
                );

                setMessage("");
              }}
              placeholder="Enter USDT Amount"
              className="w-full bg-black border border-green-500 rounded-2xl py-4 pl-12 pr-5 text-2xl font-bold outline-none focus:border-green-400"
            />

          </div>

          <p className="text-gray-500 text-sm mt-3">
            Minimum purchase amount: 1 USDT
          </p>

        </div>

        {/* ==================================================
            ORDER SUMMARY
        ================================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-green-400 mb-6">
            Order Summary
          </h2>

          <div className="space-y-4 text-lg">

            <div className="flex justify-between border-b border-zinc-700 pb-3 gap-4">

              <span className="text-gray-400">
                USDT Amount
              </span>

              <span className="font-bold text-white">
                {safeUsdtAmount.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 8,
                  }
                )}
              </span>

            </div>

            <div className="flex justify-between border-b border-zinc-700 pb-3 gap-4">

              <span className="text-gray-400">
                Rate
              </span>

              <span className="font-bold text-cyan-400">
                PKR{" "}
                {rate.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 4,
                  }
                )}
              </span>

            </div>

            <div className="flex justify-between border-b border-zinc-700 pb-3 gap-4">

              <span className="text-gray-400">
                Available PKR
              </span>

              <span className="font-bold text-yellow-400">
                PKR{" "}
                {walletBalance.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </span>

            </div>

            <div className="flex justify-between pt-2 gap-4">

              <span className="text-2xl font-bold text-green-400">
                Total PKR
              </span>

              <span className="text-3xl font-black text-green-400">
                PKR{" "}
                {totalPkr.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </span>

            </div>

          </div>

        </div>
                {/* ==================================================
            COMPANY PAYMENT WALLET
        ================================================== */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mb-8">

          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">

            <div>

              <h2 className="text-2xl font-bold text-cyan-400">
                Company USDT Wallet
              </h2>

              <p className="text-gray-400 mt-1">
                Send payment only through the TRC20 network.
              </p>

            </div>

            <span className="bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-full text-sm font-semibold">
              Network: TRC20
            </span>

          </div>

          {/* WALLET ADDRESS */}

          <div className="bg-black border border-cyan-500 rounded-2xl p-5 mb-5">

            <p className="text-gray-400 text-sm mb-2">
              Wallet Address
            </p>

            {companyWallet.address ? (
              <>
                <p className="text-cyan-300 font-bold break-all text-lg">
                  {companyWallet.address}
                </p>

                <button
                  type="button"
                  onClick={copyWalletAddress}
                  className="mt-4 bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-xl flex items-center gap-2 font-bold"
                >
                  <Copy size={18} />
                  Copy Wallet Address
                </button>
              </>
            ) : (
              <div className="text-yellow-400">
                Company USDT wallet is not configured.
              </div>
            )}

          </div>

          {/* QR */}

          <div className="bg-black border border-zinc-700 rounded-2xl p-5">

            <h3 className="text-cyan-400 font-semibold mb-4">
              Payment QR
            </h3>

            <div className="flex justify-center">

              <div className="bg-white rounded-2xl p-5">

                <QrCode
                  size={180}
                  color="black"
                />

              </div>

            </div>

            <p className="text-center text-gray-500 text-sm mt-4">
              Use a TRC20-compatible wallet for payment.
            </p>

            {!companyWallet.address && (
              <p className="text-center text-red-400 text-sm mt-2">
                Configure NEXT_PUBLIC_USDT_COMPANY_ADDRESS before production use.
              </p>
            )}

          </div>

        </div>

        {/* ==================================================
            RECEIVING WALLET
        ================================================== */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-yellow-400 mb-5">
            Your Receiving Wallet
          </h2>

          <p className="text-gray-400 mb-4">
            Enter the personal TRC20 wallet where the approved USDT will be sent.
          </p>

          <input
            type="text"
            value={walletAddress}
            onChange={(e) => {
              setWalletAddress(
                e.target.value
              );

              setMessage("");
            }}
            placeholder="Enter your TRC20 wallet address"
            className="w-full bg-black border border-yellow-500 rounded-2xl p-4 text-white outline-none focus:border-yellow-400"
          />

          <p className="text-gray-500 text-sm mt-3">
            TRON/TRC20 addresses normally start with "T".
          </p>

        </div>

        {/* ==================================================
            TRANSACTION HASH
        ================================================== */}

        <div className="bg-zinc-900 border border-purple-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-purple-400 mb-5">
            Transaction Hash
            <span className="text-sm text-gray-500 ml-2">
              Optional
            </span>
          </h2>

          <p className="text-gray-400 mb-4">
            Paste the blockchain transaction hash if available.
          </p>

          <input
            type="text"
            value={txHash}
            onChange={(e) =>
              setTxHash(
                e.target.value
              )
            }
            placeholder="Paste transaction hash"
            className="w-full bg-black border border-purple-500 rounded-2xl p-4 text-white outline-none focus:border-purple-400"
          />

        </div>
                {/* ==================================================
            PAYMENT RECEIPT
        ================================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 mb-10">

          <h2 className="text-2xl font-bold text-green-400 mb-5">
            Upload Payment Receipt
          </h2>

          <p className="text-gray-400 mb-5">
            Upload a clear payment screenshot.
            Accepted formats: JPG, JPEG, PNG.
            Maximum size: 5MB.
          </p>

          <label className="w-full cursor-pointer border-2 border-dashed border-green-500 rounded-2xl p-8 flex flex-col items-center justify-center hover:bg-green-500/5 transition">

            <Upload
              size={48}
              className="text-green-400 mb-3"
            />

            <span className="text-green-400 font-semibold">
              Click here to upload receipt
            </span>

            <span className="text-gray-500 text-sm mt-2">
              JPG • PNG • JPEG • Max 5MB
            </span>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,image/png,image/jpeg"
              onChange={(e) => {
                const file =
                  e.target.files?.[0] ||
                  null;

                if (!file) {
                  setReceipt(null);
                  return;
                }

                const allowedTypes = [
                  "image/jpeg",
                  "image/png",
                ];

                if (
                  !allowedTypes.includes(
                    file.type
                  )
                ) {
                  setReceipt(null);
                  setMessageType("error");
                  setMessage(
                    "Only JPG, JPEG and PNG files are allowed."
                  );
                  return;
                }

                if (
                  file.size >
                  5 * 1024 * 1024
                ) {
                  setReceipt(null);
                  setMessageType("error");
                  setMessage(
                    "Receipt must be smaller than 5MB."
                  );
                  return;
                }

                setReceipt(file);
                setMessage("");
              }}
              className="hidden"
            />

          </label>

          {receipt && (
            <div className="mt-5 bg-green-600/10 border border-green-500 rounded-xl p-4">

              <div className="flex items-center gap-2 text-green-400">

                <CheckCircle size={20} />

                <p className="font-semibold">
                  Receipt Selected
                </p>

              </div>

              <p className="text-white mt-2 break-all">
                {receiptFileName}
              </p>

              <p className="text-gray-500 text-sm mt-1">
                {(receipt.size / 1024 / 1024).toFixed(
                  2
                )}{" "}
                MB
              </p>

            </div>
          )}

        </div>

        {/* ==================================================
            BALANCE VALIDATION
        ================================================== */}

        {safeUsdtAmount > 0 &&
          totalPkr >
            walletBalance && (
            <div className="bg-red-600/10 border border-red-500 rounded-3xl p-5 mb-8">

              <div className="flex items-center gap-3 mb-3">

                <AlertCircle
                  size={26}
                  className="text-red-400"
                />

                <h2 className="text-xl font-bold text-red-400">
                  Insufficient PKR Wallet Balance
                </h2>

              </div>

              <p className="text-red-300">
                Required PKR:{" "}
                <span className="font-bold">
                  PKR{" "}
                  {totalPkr.toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </p>

              <p className="text-red-300 mt-2">
                Available PKR:{" "}
                <span className="font-bold">
                  PKR{" "}
                  {walletBalance.toLocaleString(
                    undefined,
                    {
                      maximumFractionDigits: 2,
                    }
                  )}
                </span>
              </p>

            </div>
          )}

        {/* ==================================================
            PURCHASE RULES
        ================================================== */}

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-blue-400 mb-5">
            Purchase Rules
          </h2>

          <ul className="space-y-3 text-gray-300 text-sm">

            <li>
              • Send payment only to the official GoldTrade TRC20 wallet.
            </li>

            <li>
              • Upload a clear payment screenshot.
            </li>

            <li>
              • Your receiving address must be a valid TRC20 address.
            </li>

            <li>
              • Receipt image must be less than 5MB.
            </li>

            <li>
              • Payment requests require server-side verification.
            </li>

            <li>
              • Approved requests can credit the USDT balance according to backend rules.
            </li>

          </ul>

        </div>

        {/* ==================================================
            PAYMENT SUMMARY
        ================================================== */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-8">

          <h2 className="text-2xl font-bold text-yellow-400 mb-6">
            Payment Summary
          </h2>

          <div className="space-y-4">

            <div className="flex justify-between gap-4">

              <span className="text-gray-400">
                Buying USDT
              </span>

              <span className="font-bold text-white">
                {safeUsdtAmount.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 8,
                  }
                )}{" "}
                USDT
              </span>

            </div>

            <div className="flex justify-between gap-4">

              <span className="text-gray-400">
                Exchange Rate
              </span>

              <span className="font-bold text-cyan-400">
                PKR{" "}
                {rate.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 4,
                  }
                )}
              </span>

            </div>

            <div className="flex justify-between gap-4">

              <span className="text-gray-400">
                Your PKR Wallet
              </span>

              <span className="font-bold text-yellow-400">
                PKR{" "}
                {walletBalance.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </span>

            </div>

            <div className="border-t border-zinc-700 pt-4 flex justify-between gap-4">

              <span className="text-xl font-bold text-green-400">
                Total Payable
              </span>

              <span className="text-3xl font-black text-green-400">
                PKR{" "}
                {totalPkr.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </span>

            </div>

          </div>

        </div>

        {/* ==================================================
            BUY BUTTON
        ================================================== */}

        <button
          type="button"
          disabled={
            submitting ||
            !tradingAvailable ||
            safeUsdtAmount < 1 ||
            totalPkr >
              walletBalance ||
            !walletAddress.trim() ||
            !receipt ||
            !companyWallet.address
          }
          onClick={handleBuyUsdt}
          className={`w-full rounded-3xl py-5 text-xl font-black transition flex items-center justify-center gap-3 ${
            submitting
              ? "bg-zinc-700 cursor-not-allowed"
              : !tradingAvailable
              ? "bg-zinc-700 cursor-not-allowed"
              : totalPkr >
                walletBalance
              ? "bg-red-600 cursor-not-allowed"
              : !receipt ||
                !walletAddress.trim()
              ? "bg-zinc-700 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-400 text-black"
          }`}
        >

          {submitting ? (
            <>
              <RefreshCw
                size={24}
                className="animate-spin"
              />

              Processing Buy Request...
            </>
          ) : !tradingAvailable ? (
            <>
              <AlertCircle size={24} />

              USDT Trading Unavailable
            </>
          ) : totalPkr >
            walletBalance ? (
            <>
              <AlertCircle size={24} />

              Insufficient PKR Balance
            </>
          ) : (
            <>
              <CheckCircle size={24} />

              Submit USDT Buy Request
            </>
          )}

        </button>
                {/* ==================================================
            SECURITY NOTICE
        ================================================== */}

        <div className="bg-zinc-900 border border-emerald-500 rounded-3xl p-6 mt-8">

          <h2 className="text-2xl font-bold text-emerald-400 mb-5">
            GoldTrade Security Notice
          </h2>

          <div className="space-y-3 text-sm text-gray-300">

            <p>
              • Every USDT request is processed through the authenticated GoldTrade account.
            </p>

            <p>
              • Never send funds to an address other than the configured official company wallet.
            </p>

            <p>
              • Invalid wallet addresses or unsupported receipts can cause the request to be rejected.
            </p>

            <p>
              • Server-side validation remains authoritative for balances, rates and transaction approval.
            </p>

          </div>

        </div>

        {/* ==================================================
            SUPPORT INFORMATION
        ================================================== */}

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mt-8 mb-8">

          <h2 className="text-2xl font-bold text-cyan-400 mb-5">
            Need Help?
          </h2>

          <div className="space-y-4 text-gray-300">

            <div className="flex justify-between border-b border-zinc-700 pb-3 gap-4">

              <span>
                Network
              </span>

              <span className="font-bold text-cyan-400">
                TRC20
              </span>

            </div>

            <div className="flex justify-between border-b border-zinc-700 pb-3 gap-4">

              <span>
                Payment Verification
              </span>

              <span className="font-bold text-green-400">
                Server / Admin Verification
              </span>

            </div>

            <div className="flex justify-between border-b border-zinc-700 pb-3 gap-4">

              <span>
                Wallet Sync
              </span>

              <span className="font-bold text-yellow-400">
                Every 15 Seconds
              </span>

            </div>

            <div className="flex justify-between gap-4">

              <span>
                Market
              </span>

              <span
                className={`font-bold ${
                  tradingAvailable
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {tradingAvailable
                  ? "OPEN"
                  : "UNAVAILABLE"}
              </span>

            </div>

          </div>

        </div>

        {/* ==================================================
            FOOTER
        ================================================== */}

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 mt-8">

          <div className="grid md:grid-cols-3 gap-6">

            {/* WALLET */}

            <div className="bg-black rounded-2xl border border-green-700 p-5 text-center">

              <Wallet
                size={32}
                className="mx-auto text-green-400 mb-3"
              />

              <p className="text-gray-400 text-sm">
                Wallet Balance
              </p>

              <h3 className="text-2xl font-bold text-green-400 mt-2">
                PKR{" "}
                {walletBalance.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 2,
                  }
                )}
              </h3>

            </div>

            {/* RATE */}

            <div className="bg-black rounded-2xl border border-cyan-700 p-5 text-center">

              <DollarSign
                size={32}
                className="mx-auto text-cyan-400 mb-3"
              />

              <p className="text-gray-400 text-sm">
                Live USDT Rate
              </p>

              <h3 className="text-2xl font-bold text-cyan-400 mt-2">
                PKR{" "}
                {rate.toLocaleString(
                  undefined,
                  {
                    maximumFractionDigits: 4,
                  }
                )}
              </h3>

            </div>

            {/* AUTO REFRESH */}

            <div className="bg-black rounded-2xl border border-yellow-700 p-5 text-center">

              <CheckCircle
                size={32}
                className="mx-auto text-yellow-400 mb-3"
              />

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
              GoldTrade V18 — Secure USDT Buy Request
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