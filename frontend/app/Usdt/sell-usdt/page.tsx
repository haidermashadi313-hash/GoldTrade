"use client";

// =======================================================
// GoldTrade V18 - sell Usdt PAGE
// PART 1/6
// Imports • Types • States • API
// =======================================================

import { useEffect, useMemo, useState } from "react";

// =======================================================
// API URL
// =======================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =======================================================
// TYPES
// =======================================================

type NetworkType = "TRC20" | "BEP20" | "ERC20";

interface walletResponse {
  success: boolean;
  Wallet: {
    PkrBalance: number;
    UsdtBalance: number;
    goldBalance: number;
  };
}

interface RateResponse {
  success: boolean;
  currency: string;
  rate: number;
}

interface sellRequestResponse {
  success: boolean;
  message: string;
}

// =======================================================
// COMPONENT
// =======================================================

export default function sellUsdtPage() {
  // =====================================================
  // USER AUTH
  // =====================================================

  const [username] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("username") || ""
      : ""
  );

  const [token] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : ""
  );

  // =====================================================
  // Wallet BALANCES
  // =====================================================

  const [Wallet, setwallet] = useState({
    PkrBalance: 0,
    UsdtBalance: 0,
    goldBalance: 0,
  });

  // =====================================================
  // LIVE Usdt RATE
  // =====================================================

  const [rate, setRate] = useState(280);

  // =====================================================
  // sell FORM STATE
  // =====================================================

  const [UsdtAmount, setUsdtAmount] = useState("");
  const [walletAddress, setwalletAddress] = useState("");
  const [network, setNetwork] = useState<NetworkType>("TRC20");

  // Payment receive method
  const [receiveMethod, setReceiveMethod] = useState("Pkr Wallet");

  // =====================================================
  // UI STATE
  // =====================================================

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // sell CALCULATOR
  // =====================================================

  const PkrAmount = useMemo(() => {
    const amount = Number(UsdtAmount || 0);
    return amount * rate;
  }, [UsdtAmount, rate]);

  // =====================================================
  // LOAD LIVE RATE
  // GET /api/Usdt/rate
  // =====================================================

  const loadRate = async () => {
    try {
      const response = await fetch(`${API}/api/Usdt/rate`);
      const data: RateResponse = await response.json();

      if (response.ok && data.success) {
        setRate(Number(data.rate));
      }
    } catch (error) {
      console.error("Usdt RATE ERROR:", error);
    }
  };

  // =====================================================
  // LOAD USER Wallet
  // GET /api/Wallet/:username
  // =====================================================

  const loadwallet = async () => {
    if (!username || !token) {
      setLoading(false);
      setErrorMessage("Please login again.");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/Wallet/${username}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: walletResponse = await response.json();

      if (response.ok && data.success) {
        setwallet({
          PkrBalance: Number(data.Wallet?.PkrBalance || 0),
          UsdtBalance: Number(data.Wallet?.UsdtBalance || 0),
          goldBalance: Number(data.Wallet?.goldBalance || 0),
        });
      }
    } catch (error) {
      console.error("LOAD Wallet ERROR:", error);
    }
  };

  // =====================================================
  // INITIAL PAGE LOAD
  // =====================================================

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);

      await Promise.all([
        loadRate(),
        loadwallet(),
      ]);

      setLoading(false);
    };

    initialize();
  }, []);

  // =====================================================
  // AUTO CLEAR ALERTS
  // =====================================================

  useEffect(() => {
    if (!successMessage && !errorMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
      setErrorMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  // =====================================================
  // VALIDATION HELPERS
  // =====================================================

  const iswalletAddressValid = useMemo(() => {
    return walletAddress.trim().length >= 20;
  }, [walletAddress]);

  const isAmountValid = useMemo(() => {
    const amount = Number(UsdtAmount);
    return !isNaN(amount) && amount > 0;
  }, [UsdtAmount]);

  const hasEnoughUsdt = useMemo(() => {
    return Wallet.UsdtBalance >= Number(UsdtAmount || 0);
  }, [Wallet.UsdtBalance, UsdtAmount]);

  // =====================================================
  // sell SUMMARY
  // =====================================================

  const sellSummary = useMemo(() => {
    const amount = Number(UsdtAmount || 0);

    return {
      Usdt: amount,
      rate,
      totalPkr: PkrAmount,
      remainingUsdt: Math.max(Wallet.UsdtBalance - amount, 0),
    };
  }, [Wallet.UsdtBalance, UsdtAmount, rate, PkrAmount]);

  // =====================================================
  // QUICK sell AMOUNTS
  // =====================================================

  const quickAmounts = [10, 25, 50, 100, 250, 500];

  const selectQuickAmount = (amount: number) => {
    setUsdtAmount(String(amount));
  };

  // =====================================================
  // INPUT HANDLER (NUMBERS ONLY)
  // =====================================================

  const handleUsdtAmountChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;

    if (value === "") {
      setUsdtAmount("");
      return;
    }

    if (/^\d*\.?\d*$/.test(value)) {
      setUsdtAmount(value);
    }
  };

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    setUsdtAmount("");
    setwalletAddress("");
    setNetwork("TRC20");
    setReceiveMethod("Pkr Wallet");
  };

  // =====================================================
  // VALIDATE sell REQUEST
  // =====================================================

  const validatesellForm = (): boolean => {
    setErrorMessage("");

    if (!username || !token) {
      setErrorMessage("Please login again.");
      return false;
    }

    if (!isAmountValid) {
      setErrorMessage("Enter a valid Usdt amount.");
      return false;
    }

    if (!hasEnoughUsdt) {
      setErrorMessage("Insufficient Usdt Wallet balance.");
      return false;
    }

    if (!iswalletAddressValid) {
      setErrorMessage("Enter a valid Usdt Wallet address.");
      return false;
    }

    return true;
  };

  // =====================================================
  // SUBMIT sell REQUEST
  // POST /api/Usdt/sell
  // =====================================================

  const handlesellRequest = async () => {
    if (!validatesellForm()) return;

    try {
      setSubmitting(true);
      setSuccessMessage("");
      setErrorMessage("");

      const payload = {
        username,
        UsdtAmount: Number(UsdtAmount),
        PkrAmount: Number(PkrAmount),
        walletAddress: walletAddress.trim(),
        network,
      };

      const response = await fetch(`${API}/api/Usdt/sell`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: sellRequestResponse = await response.json();

      // ================= SUCCESS =================

      if (response.ok && data.success) {
        setSuccessMessage(
          data.message || "Usdt sell Request submitted successfully."
        );

        // Reset form
        resetForm();

        // Refresh Wallet & live rate
        await Promise.all([
          loadwallet(),
          loadRate(),
        ]);

        return;
      }

      // ================= API ERROR =================

      throw new Error(
        data.message || "Unable to submit sell Request."
      );

    } catch (error: any) {
      console.error("sell REQUEST ERROR:", error);

      setErrorMessage(
        error.message || "Something went wrong while submitting request."
      );

    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // REFRESH PAGE DATA
  // =====================================================

  const refreshwallet = async () => {
    setLoading(true);

    try {
      await Promise.all([
        loadwallet(),
        loadRate(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RECEIVE METHOD INFO
  // =====================================================

  const receiveMethodInfo = useMemo(() => {
    switch (receiveMethod) {
      case "Pkr Wallet":
        return "Pkr will be credited directly into your GoldTrade Pkr Wallet after admin approval.";

      default:
        return "Pkr will be credited into your GoldTrade Pkr Wallet after approval.";
    }
  }, [receiveMethod]);

  // =====================================================
  // JSX START
  // PART 4/6
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* ===================================================== */}
        {/* PAGE HEADER */}
        {/* ===================================================== */}

        <div className="mb-6 rounded-3xl bg-gradient-to-r from-red-700 via-orange-600 to-amber-500 p-6 text-white shadow-xl">

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div>
              <h1 className="text-3xl font-bold">
                sell Usdt
              </h1>

              <p className="mt-2 text-orange-100">
                GoldTrade V18 • Secure Digital Wallet
              </p>

              <p className="mt-2 text-sm text-orange-200">
                sell your Usdt securely and receive Pkr directly into your GoldTrade Wallet.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshwallet}
              disabled={loading}
              className="rounded-xl bg-white px-5 py-3 font-semibold text-red-700 transition hover:bg-orange-50 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Wallet"}
            </button>

          </div>

        </div>

        {/* ===================================================== */}
        {/* SUCCESS / ERROR ALERTS */}
        {/* ===================================================== */}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-300 bg-green-100 p-4 text-green-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-300 bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        {/* ===================================================== */}
        {/* PAGE LOADING */}
        {/* ===================================================== */}

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-xl">

            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-600 border-t-transparent"></div>

            <p className="text-gray-600">
              Loading Wallet Information...
            </p>

          </div>
        ) : (
          <>

            {/* ===================================================== */}
            {/* Wallet BALANCE CARDS */}
            {/* ===================================================== */}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

              {/* Pkr Wallet */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Pkr Wallet
                </p>

                <h2 className="mt-2 text-2xl font-bold text-green-600">
                  Rs. {Wallet.PkrBalance.toLocaleString()}
                </h2>
              </div>

              {/* Usdt Wallet */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Usdt Wallet
                </p>

                <h2 className="mt-2 text-2xl font-bold text-cyan-700">
                  {Wallet.UsdtBalance.toFixed(2)} Usdt
                </h2>
              </div>

              {/* Gold Wallet */}

              <div className="rounded-2xl bg-white p-5 shadow-lg">
                <p className="text-sm text-gray-500">
                  Gold Wallet
                </p>

                <h2 className="mt-2 text-2xl font-bold text-yellow-600">
                  {Wallet.goldBalance.toFixed(4)} g
                </h2>
              </div>

              {/* Live Rate */}

              <div className="rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 p-5 text-white shadow-lg">
                <p className="text-sm text-orange-100">
                  Live Usdt sell Rate
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Pkr {rate}
                </h2>

                <p className="mt-2 text-xs text-orange-100">
                  1 Usdt = {rate} Pkr
                </p>
              </div>

            </div>

            {/* ===================================================== */}
            {/* sell CALCULATOR */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-5 text-2xl font-bold text-gray-800">
                sell Usdt Calculator
              </h2>

              <div className="grid gap-6 lg:grid-cols-2">

                {/* LEFT SIDE */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-600">
                    Usdt Amount to sell
                  </label>

                  <input
                    type="text"
                    value={UsdtAmount}
                    onChange={handleUsdtAmountChange}
                    placeholder="Enter Usdt amount"
                    className="w-full rounded-xl border border-gray-300 p-4 text-lg outline-none transition focus:border-red-500"
                  />

                  {/* QUICK AMOUNTS */}

                  <div className="mt-4 flex flex-wrap gap-2">

                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => selectQuickAmount(amount)}
                        className="rounded-lg bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-600 hover:text-white"
                      >
                        {amount} Usdt
                      </button>
                    ))}

                  </div>

                  {/* Wallet Validation */}

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Available Usdt
                      </span>

                      <span className="font-bold text-cyan-700">
                        {Wallet.UsdtBalance.toFixed(2)} Usdt
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Wallet Status
                      </span>

                      <span
                        className={`font-semibold ${
                          hasEnoughUsdt
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {hasEnoughUsdt
                          ? "Sufficient Balance"
                          : "Insufficient Balance"}
                      </span>
                    </div>

                  </div>

                </div>

                {/* RIGHT SIDE */}

                <div className="rounded-2xl bg-slate-50 p-5">

                  <h3 className="mb-4 text-lg font-bold text-gray-700">
                    sell Summary
                  </h3>

                  <div className="space-y-3">

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        selling Usdt
                      </span>

                      <span className="font-semibold">
                        {sellSummary.Usdt.toFixed(2)} Usdt
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Live sell Rate
                      </span>

                      <span className="font-semibold">
                        Pkr {sellSummary.rate}
                      </span>
                    </div>

                    <div className="flex justify-between border-t pt-3">
                      <span className="font-semibold text-gray-700">
                        Pkr You Will Receive
                      </span>

                      <span className="text-xl font-bold text-green-600">
                        Rs. {sellSummary.totalPkr.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">
                        Remaining Usdt Wallet
                      </span>

                      <span
                        className={`font-semibold ${
                          hasEnoughUsdt
                            ? "text-cyan-700"
                            : "text-red-600"
                        }`}
                      >
                        {sellSummary.remainingUsdt.toFixed(2)} Usdt
                      </span>
                    </div>

                  </div>

                </div>

              </div>

            </div>
                        <div className="mt-6 grid gap-6 lg:grid-cols-2">

              {/* RECEIVE METHOD */}

              <div className="rounded-3xl bg-white p-6 shadow-xl">

                <h2 className="mb-5 text-xl font-bold text-gray-800">
                  Receive Pkr Into
                </h2>

                <div className="space-y-3">

                  {["Pkr Wallet"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setReceiveMethod(method)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        receiveMethod === method
                          ? "border-red-600 bg-red-50 text-red-700"
                          : "border-gray-300 hover:border-red-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">

                        <span className="font-semibold">
                          {method}
                        </span>

                        {receiveMethod === method && (
                          <span className="font-bold text-red-600">
                            ✓
                          </span>
                        )}

                      </div>

                    </button>
                  ))}

                </div>

                <div className="mt-5 rounded-xl bg-orange-50 p-4">

                  <p className="text-sm font-semibold text-orange-700">
                    Receive Information
                  </p>

                  <p className="mt-2 text-sm text-gray-700">
                    {receiveMethodInfo}
                  </p>

                </div>

              </div>

              {/* NETWORK SELECTION */}

              <div className="rounded-3xl bg-white p-6 shadow-xl">

                <h2 className="mb-5 text-xl font-bold text-gray-800">
                  Select Usdt Network
                </h2>

                <div className="space-y-3">

                  {(["TRC20", "BEP20", "ERC20"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setNetwork(item)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        network === item
                          ? "border-red-600 bg-red-50 text-red-700"
                          : "border-gray-300 hover:border-red-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">

                        <span className="font-semibold">
                          {item}
                        </span>

                        {network === item && (
                          <span className="font-bold text-red-600">
                            ✓
                          </span>
                        )}

                      </div>

                    </button>
                  ))}

                </div>

                <div className="mt-5 rounded-xl bg-red-50 p-4">

                  <p className="text-sm font-semibold text-red-700">
                    Selected Network
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-red-700">
                    {network}
                  </h3>

                  <p className="mt-2 text-xs text-red-500">
                    Use the same blockchain network from which you will transfer Usdt.
                  </p>

                </div>

              </div>

            </div>

            {/* ===================================================== */}
            {/* USER Usdt Wallet ADDRESS */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-5 text-xl font-bold text-gray-800">
                Your Usdt Wallet Address
              </h2>

              <label className="mb-2 block text-sm font-semibold text-gray-600">
                Sender Wallet Address ({network})
              </label>

              <textarea
                rows={3}
                value={walletAddress}
                onChange={(e) => setwalletAddress(e.target.value)}
                placeholder={`Enter your ${network} Wallet address`}
                className="w-full rounded-xl border border-gray-300 p-4 outline-none transition focus:border-red-500"
              />

              <div className="mt-3 flex items-center justify-between">

                <span className="text-xs text-gray-500">
                  Minimum 20 characters required.
                </span>

                <span
                  className={`text-xs font-semibold ${
                    iswalletAddressValid
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {iswalletAddressValid
                    ? "Wallet Address Valid"
                    : "Wallet Address Invalid"}
                </span>

              </div>

            </div>

            {/* ===================================================== */}
            {/* sell REQUEST SUMMARY */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-5 text-xl font-bold text-gray-800">
                sell Request Summary
              </h2>

              <div className="space-y-3">

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Username
                  </span>

                  <span className="font-semibold text-gray-800">
                    {username}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    selling Usdt
                  </span>

                  <span className="font-semibold text-red-700">
                    {sellSummary.Usdt.toFixed(2)} Usdt
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Live Rate
                  </span>

                  <span className="font-semibold">
                    Pkr {rate}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Network
                  </span>

                  <span className="font-semibold text-orange-600">
                    {network}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Receive Method
                  </span>

                  <span className="font-semibold text-indigo-600">
                    {receiveMethod}
                  </span>
                </div>

                <div className="border-t pt-3">

                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-700">
                      Pkr You Will Receive
                    </span>

                    <span className="text-2xl font-bold text-green-600">
                      Rs. {sellSummary.totalPkr.toLocaleString()}
                    </span>
                  </div>

                </div>

              </div>

            </div>
                        <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">

              <h2 className="mb-5 text-xl font-bold text-gray-800">
                Submit sell Request
              </h2>

              <div className="rounded-2xl bg-slate-50 p-5">

                <div className="space-y-3">

                  <div className="flex justify-between">
                    <span className="text-gray-600">Usdt Amount</span>
                    <span className="font-bold text-red-700">
                      {sellSummary.Usdt.toFixed(2)} Usdt
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Live sell Rate</span>
                    <span className="font-semibold">
                      Pkr {sellSummary.rate}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Network</span>
                    <span className="font-semibold text-orange-600">
                      {network}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Receive Method</span>
                    <span className="font-semibold text-indigo-600">
                      {receiveMethod}
                    </span>
                  </div>

                  <div className="border-t pt-3">

                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-700">
                        Pkr You Will Receive
                      </span>

                      <span className="text-2xl font-bold text-green-600">
                        Rs. {sellSummary.totalPkr.toLocaleString()}
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              {/* SUBMIT BUTTON */}

              <button
                type="button"
                onClick={handlesellRequest}
                disabled={submitting}
                className={`mt-6 w-full rounded-2xl py-4 text-lg font-bold text-white transition ${
                  submitting
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                }`}
              >
                {submitting
                  ? "Submitting sell Request..."
                  : "Submit sell Request"}
              </button>

              <p className="mt-4 text-center text-sm text-gray-500">
                Your sell request will remain <strong>Pending</strong> until GoldTrade Ai-verfies your Usdt transfer.
              </p>

            </div>

            {/* ===================================================== */}
            {/* IMPORTANT NOTICE */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-6">

              <h2 className="mb-4 text-xl font-bold text-amber-700">
                Important Before Sending Usdt
              </h2>

              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Send Usdt only using the selected network.</li>
                <li>• The Wallet address must match the selected blockchain network.</li>
                <li>• Wrong network transfers cannot be recovered.</li>
                <li>• Admin will verify the blockchain transaction before approval.</li>
                <li>• Pkr will be credited after successful verification.</li>
              </ul>

            </div>

            {/* ===================================================== */}
            {/* SECURITY NOTICE */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl border border-green-200 bg-green-50 p-6">

              <h2 className="mb-4 text-xl font-bold text-green-700">
                GoldTrade Security Notice
              </h2>

              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Every sell request is securely stored in GoldTrade V18.</li>
                <li>• Wallet balances update only after Admin approval.</li>
                <li>• Every Credit and Debit entry is automatically added to Wallet history.</li>
                <li>• Your Pkr Wallet is credited after successful verification.</li>
                <li>• All transaction timestamps are permanently recorded.</li>
              </ul>

            </div>

            {/* ===================================================== */}
            {/* sell PROCESS */}
            {/* ===================================================== */}

            <div className="mt-6 rounded-3xl border border-blue-200 bg-blue-50 p-6">

              <h2 className="mb-4 text-xl font-bold text-blue-700">
                sell Usdt Process
              </h2>

              <div className="grid gap-4 md:grid-cols-2">

                <div className="rounded-xl bg-white p-4">
                  <p className="font-semibold text-blue-700">
                    Step 1
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    Enter the amount of Usdt you want to sell.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="font-semibold text-blue-700">
                    Step 2
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    Select the blockchain network you will use.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="font-semibold text-blue-700">
                    Step 3
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    Submit your sell request from your GoldTrade account.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="font-semibold text-blue-700">
                    Step 4
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    After Ai-verification, Pkr is credited to your Pkr Wallet automatically.
                  </p>
                </div>

              </div>

            </div>

            {/* ===================================================== */}
            {/* FOOTER */}
            {/* ===================================================== */}

            <div className="mt-10 border-t pt-6 text-center">

              <h3 className="text-lg font-bold text-slate-700">
                GoldTrade Enterprise sell Usdt
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Pkr • Usdt • Gold • Secure Digital Trading Wallet
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Powered by GoldTrade Enterprise Secure Wallet Infrastructure
              </p>

            </div>

          </>
        )}

      </div>
    </div>
  );
}