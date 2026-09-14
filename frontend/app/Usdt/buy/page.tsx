"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, DollarSign, Wallet, TrendingUp } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function BuyUSDTPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [buyPrice, setBuyPrice] = useState(1);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [buySuccess, setBuySuccess] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [note, setNote] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);
  const [buyHistory, setBuyHistory] = useState<any[]>([]);

  const username =
    typeof window !== "undefined" ? window.localStorage.getItem("username") || "" : "";

  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") || "" : "";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const loadWallet = async () => {
    if (!username) return;

    try {
      const res = await fetch(`${API}/api/users/${username}`, {
        headers,
      });

      const data = await res.json();

      if (data.success) {
        setWalletBalance(Number(data.data.walletBalance || 0));
      }
    } catch (err) {
      console.error("Wallet Error:", err);
    }
  };

  const loadPrice = async () => {
    try {
      const res = await fetch(`${API}/api/settings/market`, {
        headers,
      });

      const data = await res.json();

      if (data.success) {
        setBuyPrice(Number(data.data.buyUsdtPrice || data.data.buyPrice || 1));
      }
    } catch (err) {
      console.error("Price Error:", err);
    }
  };

  const loadBuyHistory = async () => {
    if (!username) return;

    try {
      setHistoryLoading(true);

      const response = await fetch(`${API}/api/gold/usdt/history/${username}`, {
        headers,
      });

      const data = await response.json();

      if (data.success) {
        setBuyHistory(data.orders || []);
      }
    } catch (error) {
      console.error("Buy history error:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadWallet();
    loadPrice();
    loadBuyHistory();
  }, [username, token]);

  const total = useMemo(() => {
    const qty = Number(amount);

    if (!qty || qty <= 0) return 0;

    return qty * buyPrice;
  }, [amount, buyPrice]);

  const uploadPaymentProof = async () => {
    if (!paymentProof) return "";

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", paymentProof);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "goldtrade"
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          process.env.NEXT_PUBLIC_CLOUDINARY_NAME
        }/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) throw new Error("Image upload failed.");

      const url = data.secure_url || "";
      setPaymentProofUrl(url);
      return url;
    } catch (error) {
      console.error("Upload Error:", error);
      alert("Unable to upload screenshot.");
      return "";
    } finally {
      setUploading(false);
    }
  };

  const handleBuyUSDT = async () => {
    setErrorMessage("");

    const qty = Number(amount);

    if (!qty || isNaN(qty)) {
      setErrorMessage("Please enter a valid USDT amount.");
      return;
    }

    if (qty < 10) {
      setErrorMessage("Minimum Buy Amount is 10 USDT.");
      return;
    }

    if (qty > walletBalance) {
      setErrorMessage("Insufficient Wallet Balance.");
      return;
    }

    try {
      setSubmitting(true);

      const proofUrl = paymentProof ? await uploadPaymentProof() : paymentProofUrl;

      if (paymentProof && !proofUrl) {
        setErrorMessage("Payment screenshot upload failed. Please try again.");
        return;
      }

      const response = await fetch(`${API}/api/gold/usdt/buy`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          username,
          amount: qty,
          price: buyPrice,
          total,
          note,
          transactionId,
          paymentProof: proofUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to submit buy request.");
      }

      if (data.success) {
        setOrderData(data.order);
        setBuySuccess(true);
        setAmount("");
        setNote("");
        setTransactionId("");
        setPaymentProof(null);
        setPaymentProofUrl("");
        await loadWallet();
        await loadBuyHistory();
      } else {
        setErrorMessage(data.message || "Buy request failed.");
      }
    } catch (error: any) {
      console.error("BUY ERROR:", error);
      setErrorMessage(error.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-20 bg-zinc-900 border-b border-yellow-500 p-4 flex items-center gap-3">
        <ArrowLeft
          className="cursor-pointer text-yellow-400"
          onClick={() => history.back()}
        />

        <h1 className="text-2xl font-bold text-yellow-400">Buy USDT</h1>
      </div>

      <div className="max-w-xl mx-auto p-5 space-y-6">
        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="text-green-400" />
            <span className="text-zinc-300">Wallet Balance</span>
          </div>

          <h2 className="text-4xl font-black text-green-400">
            ${walletBalance.toFixed(2)}
          </h2>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-yellow-400" />
            <span>Current Buy Price</span>
          </div>

          <h2 className="text-3xl font-bold text-yellow-300">${buyPrice}</h2>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-3">
          <label className="block text-zinc-300 font-semibold">Enter USDT Amount</label>

          <div className="flex items-center bg-black rounded-xl border border-zinc-600 px-4 py-3">
            <DollarSign className="text-yellow-400 mr-2" />
            <input
              type="number"
              placeholder="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent outline-none w-full text-xl"
            />
          </div>

          <p className="text-zinc-500 text-sm">Minimum Buy: 10 USDT</p>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-3xl text-black p-6">
          <p className="font-semibold text-lg">Total Payable</p>
          <h2 className="text-4xl font-black">${total.toFixed(2)}</h2>
          <p className="mt-2 font-medium">{amount || 0} USDT × ${buyPrice}</p>
        </div>

        {Number(amount) > walletBalance && (
          <div className="bg-red-900 border border-red-500 p-4 rounded-xl">
            Insufficient Wallet Balance.
          </div>
        )}

        {Number(amount) > 0 && Number(amount) < 10 && (
          <div className="bg-orange-900 border border-orange-500 p-4 rounded-xl">
            Minimum purchase is 10 USDT.
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-3">
          <h3 className="text-lg font-bold text-yellow-400">Payment Note (Optional)</h3>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Example: Binance payment completed..."
            className="w-full rounded-xl bg-black border border-zinc-700 p-3 outline-none text-white resize-none"
          />
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5 space-y-4">
          <h3 className="text-xl font-bold text-yellow-400">Binance USDT Payment</h3>
          <p className="text-zinc-400 text-sm">
            Scan QR using Binance and transfer the exact amount.
          </p>

          <img
            src="/images/binance-qr.png"
            alt="Binance QR"
            className="w-56 h-56 object-cover rounded-xl mx-auto border border-yellow-500"
          />

          <div className="bg-black rounded-xl p-4 border border-zinc-700">
            <p className="text-zinc-500 text-xs">Binance Wallet</p>
            <p className="text-green-400 font-bold break-all">
              TDK38X1JK83LSJDK8388ABCD9911
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 space-y-4">
          <h3 className="text-lg font-bold text-yellow-400">Payment Information</h3>

          <input
            type="text"
            placeholder="Binance Transaction ID"
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className="w-full bg-black rounded-xl border border-zinc-700 p-3 outline-none"
          />

          <div className="border-2 border-dashed border-zinc-600 rounded-2xl p-5">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.length) {
                  setPaymentProof(e.target.files[0]);
                }
              }}
            />

            <p className="text-zinc-500 text-sm mt-3">Upload Binance payment screenshot.</p>

            {paymentProof && (
              <p className="text-green-400 mt-2 text-sm">Selected: {paymentProof.name}</p>
            )}

            {uploading && <p className="text-yellow-400 mt-2">Uploading Screenshot...</p>}
          </div>
        </div>

        {errorMessage && (
          <div className="bg-red-900 border border-red-500 rounded-xl p-4 text-red-200">
            {errorMessage}
          </div>
        )}

        <button
          onClick={handleBuyUSDT}
          disabled={submitting || Number(amount) < 10 || Number(amount) > walletBalance}
          className="w-full py-4 rounded-2xl bg-yellow-500 text-black font-bold text-lg disabled:bg-zinc-700 disabled:text-zinc-500 transition-all"
        >
          {submitting ? "Submitting Buy Request..." : "Buy USDT Now"}
        </button>

        {buySuccess && orderData && (
          <div className="bg-green-900 border border-green-500 rounded-3xl p-6 mt-6 space-y-5">
            <h2 className="text-2xl font-black text-green-300">
              Buy Request Submitted Successfully
            </h2>

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
                <p className="text-zinc-500 text-xs">Amount</p>
                <p className="font-bold">{orderData.amount} USDT</p>
              </div>

              <div className="bg-black rounded-xl p-3">
                <p className="text-zinc-500 text-xs">Price</p>
                <p className="font-bold">${orderData.price}</p>
              </div>

              <div className="bg-black rounded-xl p-3 col-span-2">
                <p className="text-zinc-500 text-xs">Total Payable</p>
                <p className="text-2xl font-black text-green-400">${orderData.total}</p>
              </div>
            </div>

            <div className="bg-black border border-green-700 rounded-xl p-4">
              <p className="text-green-300 font-bold">Waiting For Admin Approval</p>
              <p className="text-zinc-400 text-sm mt-2">
                Your Buy USDT request has been created successfully. Admin will verify the
                payment and approve your order.
              </p>
            </div>

            <button
              onClick={() => {
                setBuySuccess(false);
                setOrderData(null);
              }}
              className="w-full py-3 rounded-xl bg-green-500 text-black font-bold"
            >
              Close
            </button>
          </div>
        )}

        <div className="mt-10 bg-zinc-900 rounded-3xl border border-zinc-700 p-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-yellow-400">Buy USDT History</h2>
            <button onClick={loadBuyHistory} className="text-yellow-400 text-sm">
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <p className="text-zinc-400">Loading history...</p>
          ) : buyHistory.length === 0 ? (
            <p className="text-zinc-500">No Buy Transactions Yet.</p>
          ) : (
            buyHistory.map((order) => (
              <div
                key={order._id}
                className="bg-black rounded-2xl border border-zinc-800 p-4 mb-4"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-bold text-green-400">{order.amount} USDT</h3>
                    <p className="text-zinc-500 text-xs">{order.orderId}</p>
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
                    <p className="text-zinc-500">Price</p>
                    <p>${order.price}</p>
                  </div>

                  <div>
                    <p className="text-zinc-500">Total</p>
                    <p>${order.total}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-zinc-500">Transaction ID</p>
                    <p>{order.transactionId || "-"}</p>
                  </div>
                </div>

                {order.paymentProof && (
                  <img
                    src={order.paymentProof}
                    className="rounded-xl mt-4 border border-zinc-700 max-h-52 object-cover"
                    alt="Payment Proof"
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
