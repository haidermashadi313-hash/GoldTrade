"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Wallet,
  DollarSign,
  TrendingDown,
  RefreshCcw,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function SellUSDTPage() {
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

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [sellPrice, setSellPrice] = useState(1);
  const [amount, setAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  const [accountName, setAccountName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BINANCE");
  const [walletAddress, setWalletAddress] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [note, setNote] = useState("");

  const [historyLoading, setHistoryLoading] = useState(false);
  const [sellHistory, setSellHistory] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [sellSuccess, setSellSuccess] = useState(false);
  const [orderData, setOrderData] = useState<{
    orderId?: string;
    status?: string;
    amount?: number;
    total?: number;
  } | null>(null);

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

  const loadSellPrice = async () => {
    try {
      const response = await fetch(`${API}/api/settings/market`, {
        method: "GET",
        headers,
      });

      const data = await response.json();

      if (data.success) {
        setSellPrice(
          Number(data.data.sellUsdtPrice || data.data.sellPrice || 1)
        );
      }
    } catch (error) {
      console.error("Sell Price Error:", error);
    }
  };

  const loadSellHistory = async () => {
    try {
      setHistoryLoading(true);

      const response = await fetch(
        `${API}/api/gold/usdt/sell/history/${username}`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await response.json();

      if (data.success) {
        setSellHistory(data.orders || data.data?.orders || []);
      }
    } catch (error) {
      console.error("Sell History Error:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadWallet(), loadSellPrice(), loadSellHistory()]);
      setLastUpdate(new Date().toLocaleTimeString());
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadWallet(),
        loadSellPrice(),
        loadSellHistory(),
      ]);
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
    };

    loadData();
  }, [username, token]);

  const totalReceive = useMemo(() => {
    const qty = Number(amount);
    if (!qty || qty <= 0) return 0;
    return qty * sellPrice;
  }, [amount, sellPrice]);

  useEffect(() => {
    const qty = Number(amount);

    if (!amount) {
      setErrorMessage("");
      return;
    }

    if (qty < 10) {
      setErrorMessage("Minimum Sell Amount is 10 USDT.");
      return;
    }

    if (qty > walletBalance) {
      setErrorMessage("Insufficient Wallet Balance.");
      return;
    }

    setErrorMessage("");
  }, [amount, walletBalance]);

  const handleSellUSDT = async () => {
    const qty = Number(amount);

    if (!amount || qty < 10) {
      setErrorMessage("Minimum Sell Amount is 10 USDT.");
      return;
    }

    if (qty > walletBalance) {
      setErrorMessage("Insufficient Wallet Balance.");
      return;
    }

    if (!accountName.trim() || !walletAddress.trim()) {
      setErrorMessage(
        "Please provide your account holder name and wallet/account number."
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        username,
        amount: qty,
        price: sellPrice,
        total: totalReceive,
        paymentMethod,
        walletAddress,
        network,
        accountName,
        note,
      };

      const response = await fetch(`${API}/api/gold/usdt/sell`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success || data.message) {
        setSellSuccess(true);
        setOrderData({
          orderId: data.data?.orderId || data.orderId || "N/A",
          status: data.data?.status || data.status || "Pending",
          amount: data.data?.amount ?? qty,
          total: data.data?.total ?? totalReceive,
        });
        setAmount("");
        await loadSellHistory();
      } else {
        setErrorMessage(data.message || "Unable to submit sell request.");
      }
    } catch (error) {
      console.error("Sell Request Error:", error);
      setErrorMessage("Something went wrong while submitting your sell request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-30 bg-zinc-900 border-b border-yellow-500 px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ArrowLeft
            size={24}
            className="text-yellow-400 cursor-pointer"
            onClick={() => history.back()}
          />

          <div>
            <h1 className="text-2xl font-black text-yellow-400">Sell USDT</h1>
            <p className="text-xs text-zinc-400">GoldTrade V18</p>
          </div>
        </div>

        <button
          onClick={refreshData}
          disabled={refreshing}
          className="text-yellow-400"
        >
          <RefreshCcw className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="max-w-xl mx-auto p-5 space-y-6">
        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="text-green-400" />
            <span className="text-zinc-300 font-semibold">Wallet Balance</span>
          </div>

          <h2 className="text-4xl font-black text-green-400">
            {loading ? "Loading..." : `${walletBalance.toFixed(2)} USDT`}
          </h2>

          <p className="text-zinc-500 mt-2 text-sm">Last Updated : {lastUpdate}</p>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="text-red-400" />
            <span className="font-semibold">Current Sell Price</span>
          </div>

          <h2 className="text-4xl font-black text-yellow-300">${sellPrice}</h2>

          <p className="text-zinc-500 text-sm mt-2">
            Live market price from Admin Panel.
          </p>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-4">
          <h2 className="text-xl font-bold text-yellow-400">Sell USDT Amount</h2>

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
            <span>Minimum Sell</span>
            <span className="text-yellow-400 font-semibold">10 USDT</span>
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

        <div className="rounded-3xl bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600 text-black p-6 space-y-5">
          <h2 className="text-2xl font-black">Sell Summary</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/10 rounded-2xl p-4">
              <p className="text-sm opacity-70">You Sell</p>
              <h3 className="text-2xl font-black">{Number(amount || 0).toFixed(2)}</h3>
              <p className="text-sm font-semibold">USDT</p>
            </div>

            <div className="bg-black/10 rounded-2xl p-4">
              <p className="text-sm opacity-70">Sell Price</p>
              <h3 className="text-2xl font-black">${sellPrice.toFixed(2)}</h3>
              <p className="text-sm font-semibold">Per USDT</p>
            </div>
          </div>

          <div className="border-t border-black/20 pt-4 space-y-3">
            <div className="flex justify-between text-base">
              <span>USDT Amount</span>
              <span className="font-bold">{Number(amount || 0).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base">
              <span>Market Sell Price</span>
              <span className="font-bold">${sellPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold border-t border-black/20 pt-3">
              <span>You Will Receive</span>
              <span className="text-green-900 text-2xl">
                ${totalReceive.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-4">
          <h2 className="text-lg font-bold text-yellow-400">Quick Sell</h2>

          <div className="grid grid-cols-4 gap-3">
            {[25, 50, 100, 250].map((value) => (
              <button
                key={value}
                onClick={() => setAmount(String(value))}
                className="rounded-xl border border-yellow-500 py-3 text-sm font-bold text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all"
              >
                {value}
              </button>
            ))}
          </div>

          <button
            onClick={() => setAmount(walletBalance.toFixed(2))}
            className="w-full rounded-xl bg-green-600 hover:bg-green-500 py-3 font-bold transition-all"
          >
            Sell Full Balance ({walletBalance.toFixed(2)} USDT)
          </button>
        </div>

        <div className="bg-blue-950 border border-blue-500 rounded-2xl p-4">
          <h3 className="text-blue-300 font-bold mb-2">Sell USDT Instructions</h3>

          <ul className="list-disc pl-5 space-y-2 text-sm text-blue-100">
            <li>Minimum sell amount is 10 USDT.</li>
            <li>Live sell price is controlled from the Admin Dashboard.</li>
            <li>Your request will remain Pending until admin approval.</li>
            <li>Approved requests automatically update your wallet history.</li>
          </ul>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-5">
          <h2 className="text-xl font-bold text-yellow-400">Receive Payment Details</h2>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Account Holder Name</label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Syed Hussnain Haider"
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none focus:border-yellow-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none focus:border-yellow-500"
            >
              <option value="BINANCE">Binance Wallet</option>
              <option value="BANK">Bank Account</option>
              <option value="ABA">ABA Bank Cambodia</option>
              <option value="PAYONEER">Payoneer</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">
              Wallet Address / Account Number
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="TRC20 Wallet / Bank Account Number"
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none focus:border-yellow-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">USDT Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none focus:border-yellow-500"
            >
              <option value="TRC20">TRC20</option>
              <option value="BEP20">BEP20</option>
              <option value="ERC20">ERC20</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-400">Note (Optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Example: Please send payment to my Binance wallet."
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 outline-none resize-none focus:border-yellow-500"
            />
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-green-600 p-5 space-y-4">
          <h2 className="text-xl font-bold text-green-400">Sell Request Preview</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Username</span>
              <span>{username}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">USDT Amount</span>
              <span>{Number(amount || 0).toFixed(2)} USDT</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Sell Price</span>
              <span>${sellPrice.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Payment Method</span>
              <span>{paymentMethod}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Network</span>
              <span>{network}</span>
            </div>

            <div className="border-t border-zinc-700 pt-3 flex justify-between text-lg font-bold">
              <span>You Will Receive</span>
              <span className="text-green-400">${totalReceive.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {sellSuccess && orderData && (
          <div className="bg-green-900 border border-green-500 rounded-3xl p-6 space-y-5 mt-8">
            <h2 className="text-2xl font-black text-green-300">
              Sell Request Submitted
            </h2>

            <p className="text-green-100">
              Your request has been sent to the admin successfully.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black rounded-xl p-3">
                <p className="text-zinc-500 text-xs">Order ID</p>
                <p className="font-bold text-green-400">{orderData.orderId}</p>
              </div>

              <div className="bg-black rounded-xl p-3">
                <p className="text-zinc-500 text-xs">Status</p>
                <p className="font-bold text-yellow-400">{orderData.status}</p>
              </div>

              <div className="bg-black rounded-xl p-3">
                <p className="text-zinc-500 text-xs">Sell Amount</p>
                <p className="font-bold">{orderData.amount} USDT</p>
              </div>

              <div className="bg-black rounded-xl p-3">
                <p className="text-zinc-500 text-xs">Receive</p>
                <p className="font-bold text-green-400">${orderData.total}</p>
              </div>
            </div>

            <div className="bg-black border border-green-700 rounded-xl p-4">
              <p className="text-green-300 font-semibold">Waiting For Admin Approval</p>
              <p className="text-zinc-400 text-sm mt-2">
                Your USDT will remain locked until the admin approves the payment.
              </p>
            </div>

            <button
              onClick={() => {
                setSellSuccess(false);
                setOrderData(null);
              }}
              className="w-full py-3 rounded-xl bg-green-500 text-black font-bold"
            >
              Close
            </button>
          </div>
        )}

        <div className="mt-10 bg-zinc-900 border border-zinc-700 rounded-3xl p-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-yellow-400">Sell History</h2>
            <button
              onClick={loadSellHistory}
              className="text-yellow-400 text-sm hover:text-yellow-300"
            >
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <p className="text-zinc-400">Loading sell history...</p>
          ) : sellHistory.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-zinc-500">No Sell Transactions Yet.</p>
            </div>
          ) : (
            sellHistory.map((order) => (
              <div
                key={order._id}
                className="bg-black border border-zinc-800 rounded-2xl p-4 mb-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-green-400">{order.amount} USDT</h3>
                    <p className="text-zinc-500 text-xs mt-1">{order.orderId}</p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === "Approved"
                        ? "bg-green-700 text-green-200"
                        : order.status === "Rejected"
                          ? "bg-red-700 text-red-200"
                          : "bg-yellow-700 text-yellow-100"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Sell Price</p>
                    <p>${order.price}</p>
                  </div>

                  <div>
                    <p className="text-zinc-500">Receive Amount</p>
                    <p className="text-green-400 font-bold">${order.total}</p>
                  </div>

                  <div>
                    <p className="text-zinc-500">Payment Method</p>
                    <p>{order.paymentMethod}</p>
                  </div>

                  <div>
                    <p className="text-zinc-500">Network</p>
                    <p>{order.network}</p>
                  </div>
                </div>

                <div className="border-t border-zinc-800 mt-4 pt-3 text-xs text-zinc-500">
                  Submitted: {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={handleSellUSDT}
          disabled={
            submitting ||
            Number(amount) < 10 ||
            Number(amount) > walletBalance
          }
          className="w-full rounded-3xl bg-yellow-500 hover:bg-yellow-400 text-black py-4 text-lg font-black transition-all disabled:bg-zinc-700 disabled:text-zinc-500"
        >
          {submitting ? "Submitting Sell Request..." : "Sell USDT Now"}
        </button>

        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-blue-300">Live Market Status</h3>
              <p className="text-sm text-zinc-400 mt-1">
                Sell Price updates automatically from Admin Dashboard.
              </p>
            </div>

            <div className="text-right">
              <p className="text-green-400 text-xl font-black">${sellPrice.toFixed(2)}</p>
              <p className="text-xs text-zinc-500">Updated {lastUpdate}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-yellow-600 rounded-3xl p-5 space-y-3">
          <h3 className="text-yellow-400 text-lg font-bold">Sell USDT Rules</h3>

          <div className="space-y-3 text-sm text-zinc-300">
            <div className="flex gap-3">
              <span className="text-yellow-400">1.</span>
              <p>Minimum sell amount is 10 USDT.</p>
            </div>

            <div className="flex gap-3">
              <span className="text-yellow-400">2.</span>
              <p>Sell price is controlled by the GoldTrade Admin Dashboard.</p>
            </div>

            <div className="flex gap-3">
              <span className="text-yellow-400">3.</span>
              <p>
                Your request will remain <span className="text-yellow-300 font-semibold">Pending</span> until verified by Admin.
              </p>
            </div>

            <div className="flex gap-3">
              <span className="text-yellow-400">4.</span>
              <p>
                After approval, payment will be sent to your selected Binance Wallet or Bank Account.
              </p>
            </div>

            <div className="flex gap-3">
              <span className="text-yellow-400">5.</span>
              <p>Rejected requests will not deduct your USDT balance.</p>
            </div>
          </div>
        </div>

        <div className="bg-red-950 border border-red-500 rounded-3xl p-5">
          <h3 className="text-red-400 font-bold mb-2">Security Notice</h3>
          <p className="text-red-100 text-sm leading-6">
            Double-check your Binance Wallet Address or Bank Account before submitting a sell request.
            GoldTrade cannot automatically recover payments sent to an incorrect address.
          </p>
        </div>

        {submitting && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 flex flex-col items-center gap-5 w-80">
              <div className="h-16 w-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />

              <h2 className="text-xl font-bold text-yellow-400">
                Processing Sell Request
              </h2>

              <p className="text-zinc-400 text-center text-sm">
                Please wait while we securely submit your USDT sell request.
              </p>
            </div>
          </div>
        )}

        <div className="py-10 text-center text-zinc-600 text-sm">
          <p className="font-semibold text-yellow-500">GoldTrade V18</p>
          <p className="mt-2">Secure USDT Buy • Sell • Deposit • Withdraw</p>
          <p className="mt-1">Powered by GoldTrade Admin Panel</p>
        </div>
      </div>
    </div>
  );
}