"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Wallet,
  DollarSign,
  ArrowUpCircle,
  RefreshCcw,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function WithdrawUSDTPage() {
  /* ==========================================================
     USER AUTH
  ========================================================== */

  const username =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || ""
      : "";

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  /* ==========================================================
     STATES
  ========================================================== */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawPrice, setWithdrawPrice] = useState(1);

  const [amount, setAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  /* ==========================================================
     LOAD USER WALLET
  ========================================================== */

  const loadWallet = async () => {
    try {
      const response = await fetch(`${API}/api/users/${username}`, {
        method: "GET",
        headers,
      });

      const data = await response.json();

      if (data.success) {
        setWalletBalance(Number(data.data.walletBalance || 0));
      }
    } catch (error) {
      console.error("Wallet Error:", error);
    }
  };

  /* ==========================================================
     LOAD WITHDRAW PRICE
  ========================================================== */

  const loadWithdrawPrice = async () => {
    try {
      const response = await fetch(`${API}/api/settings/market`, {
        method: "GET",
        headers,
      });

      const data = await response.json();

      if (data.success) {
        setWithdrawPrice(
          Number(
            data.data.withdrawUsdtPrice ||
              data.data.sellUsdtPrice ||
              data.data.sellPrice ||
              1
          )
        );
      }
    } catch (error) {
      console.error("Withdraw Price Error:", error);
    }
  };

  /* ==========================================================
     REFRESH DATA
  ========================================================== */

  const refreshData = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        loadWallet(),
        loadWithdrawPrice(),
      ]);

      setLastUpdate(new Date().toLocaleTimeString());
    } finally {
      setRefreshing(false);
    }
  };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        loadWallet(),
        loadWithdrawPrice(),
      ]);

      setLastUpdate(new Date().toLocaleTimeString());

      setLoading(false);
    };

    loadData();
  }, []);

  /* ==========================================================
     CALCULATE WITHDRAW VALUE
  ========================================================== */

  const totalWithdraw = useMemo(() => {
    const qty = Number(amount);

    if (!qty || qty <= 0) return 0;

    return qty * withdrawPrice;
  }, [amount, withdrawPrice]);

  /* ==========================================================
     VALIDATION
  ========================================================== */

  useEffect(() => {
    const qty = Number(amount);

    if (!amount) {
      setErrorMessage("");
      return;
    }

    if (qty < 10) {
      setErrorMessage("Minimum Withdraw Amount is 10 USDT.");
      return;
    }

    if (qty > walletBalance) {
      setErrorMessage("Insufficient Wallet Balance.");
      return;
    }

    setErrorMessage("");
  }, [amount, walletBalance]);

  /* ==========================================================
     PAYMENT FORM STATE
  ========================================================== */

  const [paymentMethod, setPaymentMethod] = useState("BINANCE");
  const [walletAddress, setWalletAddress] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ibanNumber, setIbanNumber] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawOrder, setWithdrawOrder] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);

  /* ==========================================================
     WITHDRAW ACTIONS
  ========================================================== */

  const refreshWalletBalance = async () => {
    await loadWallet();
    setLastUpdate(new Date().toLocaleTimeString());
  };

  const loadWithdrawHistory = async () => {
    if (!username) return;

    setHistoryLoading(true);

    try {
      const endpoints = [
        `${API}/api/withdrawals/user/${username}`,
        `${API}/api/withdrawals?username=${encodeURIComponent(username)}`,
      ];

      let response: Response | null = null;
      let payload: any = null;

      for (const endpoint of endpoints) {
        try {
          response = await fetch(endpoint, {
            method: "GET",
            headers,
          });

          payload = await response.json();

          if (response.ok) break;
        } catch {
          response = null;
        }
      }

      if (payload?.success) {
        setWithdrawHistory(Array.isArray(payload.data) ? payload.data : []);
      } else {
        setWithdrawHistory([]);
      }
    } catch (error) {
      console.error("Withdraw History Error:", error);
      setWithdrawHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleWithdrawUSDT = async () => {
    const qty = Number(amount);

    if (!qty || qty < 10) {
      setWithdrawError("Minimum Withdraw Amount is 10 USDT.");
      return;
    }

    if (qty > walletBalance) {
      setWithdrawError("Insufficient Wallet Balance.");
      return;
    }

    if (!confirmWithdraw) {
      setWithdrawError("Please confirm the withdrawal details before submitting.");
      return;
    }

    if (paymentMethod === "BINANCE" && !walletAddress.trim()) {
      setWithdrawError("Please enter your Binance wallet address.");
      return;
    }

    if (
      paymentMethod === "BANK_AL_HABIB" &&
      (!accountName.trim() || !accountNumber.trim() || !ibanNumber.trim())
    ) {
      setWithdrawError("Please complete all Bank Al Habib details.");
      return;
    }

    if (
      paymentMethod === "EASYPAISA" &&
      (!accountName.trim() || !accountNumber.trim())
    ) {
      setWithdrawError("Please complete all Easypaisa details.");
      return;
    }

    setSubmitting(true);
    setWithdrawError("");

    try {
      const payload = {
        username,
        amount: qty,
        paymentMethod,
        walletAddress: walletAddress.trim(),
        network,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        ibanNumber: ibanNumber.trim(),
        note: paymentNote.trim(),
        price: withdrawPrice,
        total: totalWithdraw,
      };

      const endpoints = [
        `${API}/api/withdrawals`,
        `${API}/api/withdrawals/create`,
      ];

      let response: Response | null = null;
      let data: any = null;

      for (const endpoint of endpoints) {
        response = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        data = await response.json();

        if (response.ok) break;

        if (response.status !== 404) break;
      }

      if (response?.ok && (data?.success !== false)) {
        const order = data?.data || {};

        setWithdrawOrder({
          orderId: order.orderId || `WD-${Date.now()}`,
          status: order.status || "Pending",
          amount: Number(order.amount ?? qty),
          paymentMethod: order.paymentMethod || paymentMethod,
          total: Number(order.total ?? totalWithdraw),
        });

        setWithdrawSuccess(true);
        setWalletBalance((prev) => Math.max(0, prev - qty));
        await refreshWalletBalance();
        await loadWithdrawHistory();
      } else {
        setWithdrawError(data?.message || "Unable to submit withdrawal request.");
      }
    } catch (error) {
      console.error("Withdraw Error:", error);
      setWithdrawError("Something went wrong while submitting your withdrawal request.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (username) {
      loadWithdrawHistory();
    }
  }, [username]);

  /* ==========================================================
     PAGE UI START
  ========================================================== */

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HEADER */}

      <div className="sticky top-0 z-30 bg-zinc-900 border-b border-yellow-500 px-5 py-4 flex justify-between items-center">

        <div className="flex items-center gap-3">

          <ArrowLeft
            size={24}
            className="text-yellow-400 cursor-pointer"
            onClick={() => history.back()}
          />

          <div>
            <h1 className="text-2xl font-black text-yellow-400">
              Withdraw USDT
            </h1>

            <p className="text-xs text-zinc-400">
              GoldTrade V18
            </p>
          </div>

        </div>

        <button
          onClick={refreshData}
          disabled={refreshing}
          className="text-yellow-400"
        >
          <RefreshCcw
            className={refreshing ? "animate-spin" : ""}
          />
        </button>

      </div>

      <div className="max-w-xl mx-auto p-5 space-y-6">

        {/* WALLET CARD */}

        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5">

          <div className="flex items-center gap-3 mb-3">

            <Wallet className="text-green-400" />

            <span className="text-zinc-300 font-semibold">
              Wallet Balance
            </span>

          </div>

          <h2 className="text-4xl font-black text-green-400">
            {loading
              ? "Loading..."
              : `${walletBalance.toFixed(2)} USDT`}
          </h2>

          <p className="text-zinc-500 mt-2 text-sm">
            Last Updated : {lastUpdate}
          </p>

        </div>

        {/* WITHDRAW PRICE CARD */}

        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5">

          <div className="flex items-center gap-3 mb-2">

            <ArrowUpCircle className="text-red-400" />

            <span className="font-semibold">
              Current Withdraw Price
            </span>

          </div>

          <h2 className="text-4xl font-black text-yellow-300">
            ${withdrawPrice.toFixed(2)}
          </h2>

          <p className="text-zinc-500 text-sm mt-2">
            Live withdraw price from Admin Dashboard.
          </p>

        </div>

        {/* WITHDRAW AMOUNT */}

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-4">

          <h2 className="text-xl font-bold text-yellow-400">
            Withdraw Amount
          </h2>

          <label className="block text-zinc-300 text-sm font-medium">
            Enter USDT Amount
          </label>

          <div className="flex items-center bg-black border border-zinc-700 rounded-2xl px-4 py-4">

            <DollarSign className="text-yellow-400 mr-3" size={22} />

            <input
              type="number"
              inputMode="decimal"
              min="10"
              step="0.01"
              placeholder="Minimum 10 USDT"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent outline-none w-full text-xl text-white placeholder:text-zinc-600"
            />

          </div>

          <div className="flex justify-between text-sm text-zinc-400">

            <span>Minimum Withdraw</span>

            <span className="text-yellow-400 font-semibold">
              10 USDT
            </span>

          </div>

          <div className="flex justify-between text-sm text-zinc-400">

            <span>Available Balance</span>

            <span className="text-green-400 font-semibold">
              {walletBalance.toFixed(2)} USDT
            </span>

          </div>

          {errorMessage && (
            <div className="bg-red-900 border border-red-500 rounded-xl p-3 text-red-200 text-sm font-medium">
              {errorMessage}
            </div>
          )}

        </div>

        {/* WITHDRAW SUMMARY */}

        <div className="rounded-3xl bg-gradient-to-r from-red-500 via-orange-500 to-red-600 text-black p-6 space-y-5">

          <h2 className="text-2xl font-black">
            Withdraw Summary
          </h2>

          <div className="grid grid-cols-2 gap-4">

            <div className="bg-black/10 rounded-2xl p-4">

              <p className="text-sm opacity-70">
                You Withdraw
              </p>

              <h3 className="text-2xl font-black">
                {Number(amount || 0).toFixed(2)}
              </h3>

              <p className="text-sm font-semibold">
                USDT
              </p>

            </div>

            <div className="bg-black/10 rounded-2xl p-4">

              <p className="text-sm opacity-70">
                Withdraw Price
              </p>

              <h3 className="text-2xl font-black">
                ${withdrawPrice.toFixed(2)}
              </h3>

              <p className="text-sm font-semibold">
                Per USDT
              </p>

            </div>

          </div>

          <div className="border-t border-black/20 pt-4 space-y-3">

            <div className="flex justify-between text-base">

              <span>USDT Amount</span>

              <span className="font-bold">
                {Number(amount || 0).toFixed(2)}
              </span>

            </div>

            <div className="flex justify-between text-base">

              <span>Withdraw Price</span>

              <span className="font-bold">
                ${withdrawPrice.toFixed(2)}
              </span>

            </div>

            <div className="flex justify-between text-lg font-bold border-t border-black/20 pt-3">

              <span>You Will Receive</span>

              <span className="text-green-900 text-2xl">
                ${totalWithdraw.toFixed(2)}
              </span>

            </div>

          </div>

        </div>

        { /* Payment method UI */ }
        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-5">
          <h2 className="text-xl font-bold text-yellow-400">Select Payment Method</h2>

          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "BINANCE", label: "Binance" },
              { value: "BANK_AL_HABIB", label: "Al Habib Bank" },
              { value: "EASYPAISA", label: "Easypaisa" },
            ].map((method) => (
              <button
                key={method.value}
                type="button"
                onClick={() => setPaymentMethod(method.value)}
                className={`rounded-xl py-3 text-xs font-bold transition-all border ${
                  paymentMethod === method.value
                    ? "bg-yellow-500 text-black border-yellow-500"
                    : "bg-black border-zinc-700 text-zinc-300 hover:border-yellow-500"
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {paymentMethod === "BINANCE" && (
          <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5 space-y-5">
            <h3 className="text-lg font-bold text-yellow-400">Binance Wallet Details</h3>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Binance Wallet Address</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Paste Binance USDT Wallet Address"
                className="w-full rounded-xl bg-black border border-zinc-700 p-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">USDT Network</label>
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="w-full rounded-xl bg-black border border-zinc-700 p-3 outline-none focus:border-yellow-500"
              >
                <option value="TRC20">TRC20</option>
                <option value="BEP20">BEP20</option>
                <option value="ERC20">ERC20</option>
              </select>
            </div>

            <div className="bg-black border border-zinc-700 rounded-xl p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Selected Network</span>
                <span className="text-green-400 font-semibold">{network}</span>
              </div>
            </div>
          </div>
        )}

        {paymentMethod === "BANK_AL_HABIB" && (
          <div className="bg-zinc-900 rounded-3xl border border-green-600 p-5 space-y-5">
            <h3 className="text-lg font-bold text-green-400">Bank Al Habib Account Details</h3>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Account Holder Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter Account Holder Name"
                className="w-full rounded-xl bg-black border border-zinc-700 p-3 outline-none focus:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Enter Bank Al Habib Account Number"
                className="w-full rounded-xl bg-black border border-zinc-700 p-3 outline-none focus:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">IBAN Number</label>
              <input
                type="text"
                value={ibanNumber}
                onChange={(e) => setIbanNumber(e.target.value.toUpperCase())}
                placeholder="PK36BAHL0001234567890123"
                className="w-full rounded-xl bg-black border border-zinc-700 p-3 uppercase outline-none focus:border-green-500"
              />
            </div>
          </div>
        )}

        {paymentMethod === "EASYPAISA" && (
          <div className="bg-zinc-900 rounded-3xl border border-emerald-600 p-5 space-y-5">
            <h3 className="text-lg font-bold text-emerald-400">Easypaisa Account Details</h3>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Account Holder Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Enter Easypaisa Account Holder Name"
                className="w-full rounded-xl bg-black border border-zinc-700 p-3 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-zinc-400">Easypaisa Mobile Number</label>
              <input
                type="tel"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="03XXXXXXXXX"
                className="w-full rounded-xl bg-black border border-zinc-700 p-3 outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-4">
          <h3 className="text-lg font-bold text-yellow-400">Withdrawal Note (Optional)</h3>
          <textarea
            rows={3}
            value={paymentNote}
            onChange={(e) => setPaymentNote(e.target.value)}
            placeholder="Example: Send payment to my Bank Al Habib account after approval."
            className="w-full rounded-xl bg-black border border-zinc-700 p-3 outline-none resize-none focus:border-yellow-500"
          />
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmWithdraw}
              onChange={(e) => setConfirmWithdraw(e.target.checked)}
              className="mt-1 h-5 w-5 accent-yellow-500"
            />

            <span className="text-sm text-zinc-300 leading-6">
              I confirm that the payment information provided above is correct. I understand that GoldTrade is not responsible for payments sent to incorrect wallet addresses, bank accounts, IBAN numbers, or Easypaisa numbers entered by me.
            </span>
          </label>

          {withdrawError && (
            <div className="rounded-xl border border-red-500 bg-red-950 p-3 text-sm text-red-200">
              {withdrawError}
            </div>
          )}
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-red-600 p-5 space-y-5">
          <h2 className="text-xl font-bold text-red-400">Withdraw Request Preview</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Username</span>
              <span>{username}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Withdraw Amount</span>
              <span>{Number(amount || 0).toFixed(2)} USDT</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Withdraw Price</span>
              <span>${withdrawPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Payment Method</span>
              <span>{paymentMethod.replaceAll("_", " ")}</span>
            </div>

            {paymentMethod === "BINANCE" && (
              <>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Network</span>
                  <span>{network}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">Wallet Address</span>
                  <span className="truncate ml-3">{walletAddress || "-"}</span>
                </div>
              </>
            )}

            {paymentMethod === "BANK_AL_HABIB" && (
              <>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Account Holder</span>
                  <span>{accountName || "-"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">Account Number</span>
                  <span>{accountNumber || "-"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">IBAN</span>
                  <span className="truncate ml-3">{ibanNumber || "-"}</span>
                </div>
              </>
            )}

            {paymentMethod === "EASYPAISA" && (
              <>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Account Holder</span>
                  <span>{accountName || "-"}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-400">Mobile Number</span>
                  <span>{accountNumber || "-"}</span>
                </div>
              </>
            )}

            <div className="border-t border-zinc-700 pt-3 flex justify-between text-lg font-bold">
              <span>You Will Receive</span>
              <span className="text-green-400">${totalWithdraw.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-950 border border-blue-600 rounded-3xl p-5 space-y-4">
          <h2 className="text-lg font-bold text-blue-300">Withdrawal Rules</h2>
          <div className="space-y-3 text-sm text-blue-100">
            <div className="flex gap-3"><span className="font-bold text-blue-300">1.</span><p>Minimum withdrawal amount is 10 USDT.</p></div>
            <div className="flex gap-3"><span className="font-bold text-blue-300">2.</span><p>Your wallet balance must be sufficient before submitting.</p></div>
            <div className="flex gap-3"><span className="font-bold text-blue-300">3.</span><p>All withdrawal requests require manual approval from GoldTrade Admin.</p></div>
            <div className="flex gap-3"><span className="font-bold text-blue-300">4.</span><p>Payments are sent only to the payment details provided below.</p></div>
            <div className="flex gap-3"><span className="font-bold text-blue-300">5.</span><p>Incorrect Bank Account, IBAN, Easypaisa number or Wallet Address may delay payment.</p></div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleWithdrawUSDT}
          disabled={
            submitting ||
            Number(amount) < 10 ||
            Number(amount) > walletBalance ||
            !confirmWithdraw
          }
          className="w-full py-4 rounded-3xl bg-red-500 hover:bg-red-400 text-white font-black text-lg transition-all disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          {submitting ? "Submitting Withdrawal Request..." : "Submit Withdrawal Request"}
        </button>

        <div className="bg-zinc-900 rounded-3xl border border-red-700 p-5 space-y-4">
          <h2 className="text-lg font-bold text-red-400">Final Withdraw Request</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Withdraw Amount</span>
              <span>{Number(amount || 0).toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Payment Method</span>
              <span>{paymentMethod.replaceAll("_", " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Withdraw Price</span>
              <span>${withdrawPrice.toFixed(2)}</span>
            </div>
            <div className="border-t border-zinc-700 pt-3 flex justify-between font-bold text-lg">
              <span>You Will Receive</span>
              <span className="text-green-400">${totalWithdraw.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {submitting && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-red-500 rounded-3xl p-8 flex flex-col items-center gap-5 w-80">
              <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              <h2 className="text-xl font-bold text-red-400">Processing Withdrawal</h2>
              <p className="text-zinc-400 text-center text-sm">
                Please wait while your USDT withdrawal request is securely submitted.
              </p>
            </div>
          </div>
        )}

        {withdrawSuccess && withdrawOrder && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
            <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 w-full max-w-md space-y-5">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center text-4xl">✅</div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-green-400">Withdrawal Submitted Successfully</h2>
                <p className="text-zinc-400 text-sm">Your withdrawal request has been sent to GoldTrade Admin for verification.</p>
              </div>

              <div className="bg-black rounded-2xl border border-zinc-700 p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Order ID</span>
                  <span className="text-green-400 font-bold">{withdrawOrder.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <span className="px-3 py-1 rounded-full bg-yellow-600 text-yellow-100 text-xs font-bold">{withdrawOrder.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Withdraw Amount</span>
                  <span>{withdrawOrder.amount} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Payment Method</span>
                  <span>{withdrawOrder.paymentMethod.replaceAll("_", " ")}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-700 pt-3">
                  <span className="text-zinc-500">You Will Receive</span>
                  <span className="text-green-400 font-bold text-lg">${withdrawOrder.total}</span>
                </div>
              </div>

              <div className="bg-blue-950 border border-blue-500 rounded-xl p-4 text-sm text-blue-100">
                Your withdrawal request is pending admin approval. Payment will be processed after verification.
              </div>

              <button
                type="button"
                onClick={() => {
                  setWithdrawSuccess(false);
                  setWithdrawOrder(null);
                }}
                className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold transition-all"
              >
                Done
              </button>
            </div>
          </div>
        )}

        <div className="bg-zinc-900 rounded-3xl border border-yellow-600 p-5 space-y-5">
          <h2 className="text-xl font-bold text-yellow-400">Withdrawal Verification Status</h2>
          <div className="flex items-center justify-between bg-black rounded-xl border border-zinc-700 p-4">
            <div>
              <p className="text-zinc-500 text-sm">Current Status</p>
              <h3 className="text-yellow-400 text-lg font-bold">Waiting For Admin Approval</h3>
            </div>
            <div className="w-14 h-14 rounded-full bg-yellow-600 flex items-center justify-center text-2xl">⏳</div>
          </div>

          <div className="space-y-3 text-sm text-zinc-300">
            <div className="flex justify-between"><span>Payment Method</span><span>{paymentMethod.replaceAll("_", " ")}</span></div>
            <div className="flex justify-between"><span>Withdraw Amount</span><span>{Number(amount || 0).toFixed(2)} USDT</span></div>
            <div className="flex justify-between"><span>Estimated Payment</span><span className="text-green-400 font-bold">${totalWithdraw.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Verification Time</span><span className="text-yellow-400">5 – 30 Minutes</span></div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-green-700 p-5 space-y-4">
          <h2 className="text-xl font-bold text-green-400">Live Withdrawal Status</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black rounded-xl p-4">
              <p className="text-zinc-500 text-xs">Wallet Balance</p>
              <p className="text-green-400 font-black text-xl mt-1">{walletBalance.toFixed(2)} USDT</p>
            </div>
            <div className="bg-black rounded-xl p-4">
              <p className="text-zinc-500 text-xs">Withdraw Price</p>
              <p className="text-yellow-400 font-black text-xl mt-1">${withdrawPrice.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-black rounded-xl border border-zinc-700 p-4 space-y-3">
            <div className="flex justify-between"><span className="text-zinc-500">Payment Method</span><span>{paymentMethod.replaceAll("_", " ")}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Current Request</span><span className="text-yellow-400">Pending Verification</span></div>
            <div className="flex justify-between border-t border-zinc-700 pt-3"><span className="text-zinc-500">Expected Receive</span><span className="text-green-400 font-bold">${totalWithdraw.toFixed(2)}</span></div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5 space-y-4">
          <h2 className="text-lg font-bold text-yellow-400">Refresh Wallet Balance</h2>
          <p className="text-sm text-zinc-400">Tap this button to refresh your wallet balance.</p>
          <button type="button" onClick={refreshWalletBalance} className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-all">
            Refresh Wallet
          </button>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-yellow-400">Withdraw History</h2>
            <button type="button" onClick={loadWithdrawHistory} className="text-yellow-400 text-sm hover:text-yellow-300 transition-all">Refresh</button>
          </div>

          {historyLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="animate-pulse bg-black border border-zinc-800 rounded-2xl p-4 space-y-3">
                  <div className="h-4 bg-zinc-700 rounded w-1/3" />
                  <div className="h-3 bg-zinc-700 rounded w-2/3" />
                  <div className="h-3 bg-zinc-700 rounded w-full" />
                </div>
              ))}
            </div>
          ) : withdrawHistory.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-zinc-500 text-sm">No Withdrawal Requests Yet.</p>
            </div>
          ) : (
            withdrawHistory.map((withdraw: any) => (
              <div key={withdraw._id} className="bg-black border border-zinc-800 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-red-400 font-bold">{withdraw.amount} USDT</h3>
                    <p className="text-xs text-zinc-500 mt-1">{withdraw.orderId}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    withdraw.status === "Approved"
                      ? "bg-green-700 text-green-200"
                      : withdraw.status === "Rejected"
                        ? "bg-red-700 text-red-200"
                        : "bg-yellow-700 text-yellow-100"
                  }`}>
                    {withdraw.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Payment Method</p>
                    <p>{withdraw.paymentMethod.replaceAll("_", " ")}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Withdraw Price</p>
                    <p>${withdraw.price}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Withdraw Value</p>
                    <p className="text-green-400 font-semibold">${withdraw.total}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Network</p>
                    <p>{withdraw.network || "-"}</p>
                  </div>
                </div>

                {withdraw.paymentMethod === "BANK_AL_HABIB" && (
                  <div className="bg-zinc-900 border border-green-700 rounded-xl p-3 text-sm space-y-2">
                    <p className="text-green-400 font-semibold">Bank Al Habib Details</p>
                    <p><span className="text-zinc-500">Account Holder:</span> {withdraw.accountName}</p>
                    <p><span className="text-zinc-500">Account Number:</span> {withdraw.accountNumber}</p>
                    <p className="break-all"><span className="text-zinc-500">IBAN:</span> {withdraw.ibanNumber}</p>
                  </div>
                )}

                {withdraw.paymentMethod === "EASYPAISA" && (
                  <div className="bg-zinc-900 border border-emerald-700 rounded-xl p-3 text-sm space-y-2">
                    <p className="text-emerald-400 font-semibold">Easypaisa Details</p>
                    <p><span className="text-zinc-500">Account Holder:</span> {withdraw.accountName}</p>
                    <p><span className="text-zinc-500">Mobile Number:</span> {withdraw.accountNumber}</p>
                  </div>
                )}

                {withdraw.paymentMethod === "BINANCE" && (
                  <div className="bg-zinc-900 border border-yellow-700 rounded-xl p-3 text-sm space-y-2">
                    <p className="text-yellow-400 font-semibold">Binance Wallet</p>
                    <p className="break-all"><span className="text-zinc-500">Wallet Address:</span> {withdraw.walletAddress}</p>
                    <p><span className="text-zinc-500">Network:</span> {withdraw.network}</p>
                  </div>
                )}

                <div className="border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                  Requested On : {new Date(withdraw.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-red-700 p-5 space-y-5">
          <h2 className="text-xl font-bold text-red-400">Withdrawal Activity Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black rounded-2xl p-4 text-center border border-zinc-700">
              <p className="text-zinc-500 text-xs">Wallet Balance</p>
              <h3 className="text-2xl font-black text-green-400 mt-2">{walletBalance.toFixed(2)}</h3>
              <p className="text-xs text-zinc-500">USDT Available</p>
            </div>
            <div className="bg-black rounded-2xl p-4 text-center border border-zinc-700">
              <p className="text-zinc-500 text-xs">Current Withdraw Price</p>
              <h3 className="text-2xl font-black text-yellow-400 mt-2">${withdrawPrice.toFixed(2)}</h3>
              <p className="text-xs text-zinc-500">Live Market</p>
            </div>
          </div>

          <div className="bg-black rounded-2xl border border-zinc-700 p-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Selected Payment Method</span><span>{paymentMethod.replaceAll("_", " ")}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Withdraw Amount</span><span>{Number(amount || 0).toFixed(2)} USDT</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Estimated Receive</span><span className="text-green-400 font-semibold">${totalWithdraw.toFixed(2)}</span></div>
            <div className="flex justify-between border-t border-zinc-700 pt-3"><span className="text-zinc-500">Last Updated</span><span className="text-yellow-400">{lastUpdate}</span></div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-yellow-600 p-5 space-y-5">
          <h2 className="text-xl font-bold text-yellow-400">Admin Verification Timeline</h2>
          <div className="space-y-5">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">✓</div>
              <div>
                <h3 className="font-semibold text-green-400">Step 1 — Withdrawal Submitted</h3>
                <p className="text-sm text-zinc-400">Your withdrawal request has been successfully submitted.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold">2</div>
              <div>
                <h3 className="font-semibold text-yellow-400">Step 2 — Admin Review</h3>
                <p className="text-sm text-zinc-400">GoldTrade Admin verifies your wallet balance and payment information.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">3</div>
              <div>
                <h3 className="font-semibold text-blue-400">Step 3 — Payment Processing</h3>
                <p className="text-sm text-zinc-400">Payment is transferred to your selected Binance Wallet, Bank Al Habib account or Easypaisa wallet.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">4</div>
              <div>
                <h3 className="font-semibold text-purple-400">Step 4 — Completed</h3>
                <p className="text-sm text-zinc-400">Wallet history updates automatically after approval.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-green-700 p-5 space-y-4">
          <h2 className="text-lg font-bold text-green-400">Refresh Wallet & Withdrawal History</h2>
          <p className="text-sm text-zinc-400">If your withdrawal has been approved, refresh your wallet balance and withdrawal history.</p>
          <button type="button" onClick={async () => { await refreshWalletBalance(); await loadWithdrawHistory(); }} className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold transition-all">
            Refresh Wallet & History
          </button>
        </div>

        <div className="bg-red-950 border border-red-500 rounded-3xl p-5 space-y-5">
          <h2 className="text-xl font-bold text-red-400">Withdrawal Security Rules</h2>
          <div className="space-y-4 text-sm text-red-100">
            <div className="flex gap-3"><span>🔒</span><p>Double-check your Binance Wallet Address before submitting a withdrawal request.</p></div>
            <div className="flex gap-3"><span>🔒</span><p>Verify your Bank Al Habib Account Number and IBAN carefully.</p></div>
            <div className="flex gap-3"><span>🔒</span><p>Verify your Easypaisa mobile number before submitting.</p></div>
            <div className="flex gap-3"><span>🔒</span><p>GoldTrade is not responsible for payments sent to incorrect wallet addresses, bank accounts, IBAN numbers, or Easypaisa numbers.</p></div>
            <div className="flex gap-3"><span>🔒</span><p>All withdrawals are manually verified for security and fraud prevention.</p></div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5 space-y-5">
          <h2 className="text-xl font-bold text-yellow-400">GoldTrade Withdrawal Support</h2>
          <div className="bg-black rounded-2xl border border-zinc-700 p-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Support Status</span><span className="text-green-400 font-semibold">24/7 Available</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Withdrawal Verification</span><span className="text-yellow-400 font-semibold">5 – 30 Minutes</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Payment Processing</span><span className="text-blue-400 font-semibold">After Admin Approval</span></div>
          </div>
          <div className="bg-yellow-950 border border-yellow-600 rounded-xl p-4 text-sm text-yellow-100">
            Please keep your Order ID safe until your withdrawal is completed. If payment is delayed, provide your Order ID to GoldTrade Support.
          </div>
        </div>

        <div className="bg-red-950 border border-red-500 rounded-3xl p-5 space-y-4">
          <h2 className="text-red-400 text-lg font-bold">Important Withdrawal Reminder</h2>
          <div className="space-y-3 text-sm text-red-100">
            <div className="flex gap-3"><span>⚠️</span><p>Double-check your Binance Wallet Address before submitting.</p></div>
            <div className="flex gap-3"><span>⚠️</span><p>Verify your Bank Al Habib IBAN and Account Number carefully.</p></div>
            <div className="flex gap-3"><span>⚠️</span><p>Verify your Easypaisa mobile number before requesting withdrawal.</p></div>
            <div className="flex gap-3"><span>⚠️</span><p>GoldTrade cannot recover payments sent to incorrect payment details entered by the user.</p></div>
            <div className="flex gap-3"><span>⚠️</span><p>Withdrawals remain pending until approved by the GoldTrade Admin Dashboard.</p></div>
          </div>
        </div>

        <div className="bg-blue-950 border border-blue-600 rounded-3xl p-5 space-y-4">
          <h2 className="text-blue-300 text-lg font-bold">Withdrawal Information</h2>
          <div className="space-y-3 text-sm text-blue-100">
            <div className="flex justify-between"><span>Minimum Withdrawal</span><span className="font-semibold">10 USDT</span></div>
            <div className="flex justify-between"><span>Verification Time</span><span className="font-semibold">5–30 Minutes</span></div>
            <div className="flex justify-between"><span>Wallet Refresh</span><span className="font-semibold">After Approval</span></div>
            <div className="flex justify-between"><span>Payment Status</span><span className="font-semibold text-yellow-300">Manual Verification</span></div>
          </div>
        </div>

        <div className="py-12 text-center text-zinc-500">
          <h2 className="text-yellow-500 font-black text-xl">GoldTrade V18</h2>
          <p className="mt-2 text-sm">Secure USDT Buy • Sell • Deposit • Withdraw Platform</p>
          <p className="text-xs mt-3">Pakistan Payment Methods • Binance • Bank Al Habib • Easypaisa</p>
          <div className="mt-6 border-t border-zinc-800 pt-4 text-xs text-zinc-600">© 2026 GoldTrade V18 — All Rights Reserved.</div>
        </div>
      </div>
    </div>
  );
}
