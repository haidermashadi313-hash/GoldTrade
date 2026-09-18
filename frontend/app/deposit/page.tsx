"use client";

import { useEffect, useState } from "react";
import { Upload, Wallet, RefreshCw, CheckCircle, Clock, XCircle } from "lucide-react";

// ==========================================
// GOLDTRADE API V18
// ==========================================
const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==========================================
// TYPES
// ==========================================
interface DepositItem {
  _id: string;
  requestAmount: number;
  adminAmount: number;
  currency: string;
  paymentMethod: string;
  senderName: string;
  senderAccount: string;
  transactionId: string;
  receiptImage: string;
  note: string;
  status: "Pending" | "Approved" | "Rejected";
  adminNote: string;
  createdAt: string;
}

export default function DepositPage() {
  // ==========================================
  // USER SESSION
  // ==========================================
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");

  // ==========================================
  // FORM STATES
  // ==========================================
  const [requestAmount, setRequestAmount] = useState("");
  const [currency, setCurrency] = useState("Pkr");
  const [paymentMethod, setPaymentMethod] = useState("JazzCash");

  const [senderName, setSenderName] = useState("");
  const [senderAccount, setSenderAccount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");

  const [receiptImage, setReceiptImage] = useState("");

  // ==========================================
  // UI STATES
  // ==========================================
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadinghistory, setLoadinghistory] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  const [history, sethistory] = useState<DepositItem[]>([]);

  // ==========================================
  // LOAD USER SESSION
  // ==========================================
  useEffect(() => {

    const savedToken = localStorage.getItem("token");
    const savedUsername = localStorage.getItem("username");

    if (!savedToken || !savedUsername) {
      window.location.href = "/login";
      return;
    }

    setToken(savedToken);
    setUsername(savedUsername);

  }, []);

  // ==========================================
  // FETCH DEPOSIT history
  // ==========================================
  const loadhistory = async () => {

    const jwt = localStorage.getItem("token");

    if (!jwt) return;

    try {

      setLoadinghistory(true);

      const response = await fetch(
        `${API}/api/deposit/history`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        sethistory(data.data || []);
      }

    } catch (err) {
      console.error("history Error:", err);
    } finally {
      setLoadinghistory(false);
    }

  };

  useEffect(() => {
    if (token) loadhistory();
  }, [token]);

  // ==========================================
  // CLOUDINARY RECEIPT UPLOAD
  // ==========================================
  const uploadReceipt = async (
    file: File
  ) => {

    try {

      setUploading(true);
      setMessage("");

      const formData = new FormData();

      formData.append("file", file);

      formData.append(
        "upload_preset",
        "goldtrade_receipts"
      );

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message || "Upload failed."
        );
      }

      setReceiptImage(data.secure_url);

      setMessageType("success");
      setMessage("Receipt uploaded successfully.");

    } catch (err: any) {

      setMessageType("error");
      setMessage(err.message);

    } finally {

      setUploading(false);

    }

  };
    // ==========================================
  // SUBMIT DEPOSIT
  // ==========================================
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();

    const jwt = localStorage.getItem("token");

    if (!jwt) {
      setMessageType("error");
      setMessage("Please login again.");
      return;
    }

    if (!requestAmount || Number(requestAmount) <= 0) {
      setMessageType("error");
      setMessage("Enter a valid deposit amount.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const response = await fetch(`${API}/api/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          requestAmount: Number(requestAmount),
          currency,
          paymentMethod,
          senderName,
          senderAccount,
          transactionId,
          receiptImage,
          note,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Deposit failed.");
      }

      setMessageType("success");
      setMessage("Deposit request submitted successfully.");

      // Reset Form
      setRequestAmount("");
      setSenderName("");
      setSenderAccount("");
      setTransactionId("");
      setReceiptImage("");
      setNote("");

      loadhistory();

    } catch (err: any) {
      setMessageType("error");
      setMessage(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // PAGE UI START
  // ==========================================
  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-5xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 flex justify-between items-center flex-wrap gap-4">

          <div>
            <h1 className="text-4xl font-black text-yellow-400">
              Deposit wallet
            </h1>

            <p className="text-gray-400 mt-2">
              Welcome, <span className="text-yellow-400">{username}</span>
            </p>
          </div>

          <Wallet className="w-14 h-14 text-yellow-400" />

        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`rounded-2xl border p-4 ${
              messageType === "success"
                ? "border-green-500 bg-green-900/30 text-green-300"
                : "border-red-500 bg-red-900/30 text-red-300"
            }`}
          >
            {message}
          </div>
        )}

        {/* DEPOSIT FORM */}
        <form
          onSubmit={handleDeposit}
          className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 space-y-5"
        >

          <h2 className="text-2xl font-bold text-yellow-400">
            Submit Deposit Request
          </h2>

          {/* Currency */}
          <div>
            <label className="block mb-2 text-gray-300 font-semibold">
              Currency
            </label>

            <div className="grid grid-cols-2 gap-3">

              <button
                type="button"
                onClick={() => setCurrency("Pkr")}
                className={`rounded-xl py-3 font-bold ${
                  currency === "Pkr"
                    ? "bg-yellow-500 text-black"
                    : "bg-zinc-800 border border-zinc-700"
                }`}
              >
                Pkr wallet
              </button>

              <button
                type="button"
                onClick={() => setCurrency("Usdt")}
                className={`rounded-xl py-3 font-bold ${
                  currency === "Usdt"
                    ? "bg-cyan-500 text-black"
                    : "bg-zinc-800 border border-zinc-700"
                }`}
              >
                Usdt wallet
              </button>

            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block mb-2 text-gray-300 font-semibold">
              Deposit Amount
            </label>

            <input
              type="number"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              placeholder="Enter Amount"
              className="w-full rounded-xl bg-black border border-zinc-700 px-4 py-3 focus:border-yellow-500 outline-none"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block mb-2 text-gray-300 font-semibold">
              Payment Method
            </label>

            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full rounded-xl bg-black border border-zinc-700 px-4 py-3 focus:border-yellow-500 outline-none"
            >
              <option>JazzCash</option>
              <option>EasyPaisa</option>
              <option>Bank Transfer</option>
              <option>ABA Bank</option>
              <option>Binance</option>
              <option>Usdt</option>
              <option>Other</option>
            </select>
          </div>

          {/* Sender Name */}
          <div>
            <label className="block mb-2 text-gray-300 font-semibold">
              Sender Name
            </label>

            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your Name"
              className="w-full rounded-xl bg-black border border-zinc-700 px-4 py-3 focus:border-yellow-500 outline-none"
            />
          </div>

          {/* Sender Account */}
          <div>
            <label className="block mb-2 text-gray-300 font-semibold">
              Sender Account / Phone
            </label>

            <input
              type="text"
              value={senderAccount}
              onChange={(e) => setSenderAccount(e.target.value)}
              placeholder="03XXXXXXXXX"
              className="w-full rounded-xl bg-black border border-zinc-700 px-4 py-3 focus:border-yellow-500 outline-none"
            />
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block mb-2 text-gray-300 font-semibold">
              Transaction ID
            </label>

            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl bg-black border border-zinc-700 px-4 py-3 focus:border-yellow-500 outline-none"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block mb-2 text-gray-300 font-semibold">
              Note
            </label>

            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional note..."
              className="w-full rounded-xl bg-black border border-zinc-700 px-4 py-3 focus:border-yellow-500 outline-none resize-none"
            />
          </div>
                    {/* Receipt Upload */}
          <div>
            <label className="block mb-2 text-gray-300 font-semibold">
              Payment Receipt
            </label>

            <label className="flex items-center justify-center gap-3 cursor-pointer border-2 border-dashed border-yellow-500 rounded-2xl p-5 bg-black hover:bg-zinc-950 transition">

              <Upload className="text-yellow-400 w-6 h-6" />

              <span className="text-yellow-300 font-semibold">
                {uploading
                  ? "Uploading..."
                  : receiptImage
                  ? "Receipt Uploaded ✔"
                  : "Upload Receipt Image"}
              </span>

              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    uploadReceipt(e.target.files[0]);
                  }
                }}
              />
            </label>

            {receiptImage && (
              <img
                src={receiptImage}
                alt="Receipt"
                className="mt-4 rounded-2xl border border-yellow-500 w-full max-h-72 object-cover"
              />
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black text-lg transition flex justify-center items-center gap-3 disabled:bg-zinc-700 disabled:text-gray-400"
          >
            {submitting && (
              <RefreshCw className="animate-spin w-5 h-5" />
            )}

            {submitting
              ? "Submitting Deposit..."
              : "SUBMIT DEPOSIT REQUEST"}
          </button>

        </form>

        {/* Deposit history */}
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

            <h2 className="text-2xl font-black text-yellow-400">
              Deposit history
            </h2>

            <button
              onClick={loadhistory}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

          </div>

          {loadinghistory ? (

            <div className="text-center text-gray-400 py-10">
              Loading deposit history...
            </div>

          ) : history.length === 0 ? (

            <div className="text-center text-gray-500 py-10">
              No deposit requests found.
            </div>

          ) : (

            <div className="space-y-5">

              {history.map((deposit) => (

                <div
                  key={deposit._id}
                  className="bg-black border border-zinc-700 rounded-2xl p-5 space-y-3"
                >

                  <div className="flex justify-between items-center flex-wrap gap-3">

                    <div>

                      <h3 className="text-xl font-bold text-yellow-400">
                        {deposit.currency || "Pkr"}{" "}
                        {Number(
                          deposit.requestAmount ??
                          0
                        ).toLocaleString()}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {new Date(deposit.createdAt).toLocaleString()}
                      </p>

                    </div>

                    {deposit.status === "Pending" && (
                      <span className="bg-yellow-600/20 text-yellow-400 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold">
                        <Clock size={16} />
                        Pending
                      </span>
                    )}

                    {deposit.status === "Approved" && (
                      <span className="bg-green-600/20 text-green-400 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle size={16} />
                        Approved
                      </span>
                    )}

                    {deposit.status === "Rejected" && (
                      <span className="bg-red-600/20 text-red-400 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold">
                        <XCircle size={16} />
                        Rejected
                      </span>
                    )}

                  </div>

                  <div className="grid md:grid-cols-2 gap-3 text-sm">

                    <p>
                      <span className="text-gray-500">Payment Method:</span>{" "}
                      {deposit.paymentMethod}
                    </p>

                    <p>
                      <span className="text-gray-500">Sender:</span>{" "}
                      {deposit.senderName || "-"}
                    </p>

                    <p>
                      <span className="text-gray-500">Account:</span>{" "}
                      {deposit.senderAccount || "-"}
                    </p>

                    <p>
                      <span className="text-gray-500">Transaction ID:</span>{" "}
                      {deposit.transactionId || "-"}
                    </p>

                  </div>

                  {deposit.note && (
                    <div className="text-sm text-gray-300">
                      <span className="text-gray-500">Note:</span>{" "}
                      {deposit.note}
                    </div>
                  )}

                  {deposit.adminAmount > 0 && (
                    <div className="text-green-400 text-sm font-semibold">
                      wallet Credited: {deposit.adminAmount.toLocaleString()} {deposit.currency}
                    </div>
                  )}

                  {deposit.adminNote && (
                    <div className="text-cyan-400 text-sm">
                      Admin Note: {deposit.adminNote}
                    </div>
                  )}

                  {deposit.receiptImage && (
                    <img
                      src={deposit.receiptImage}
                      alt="Receipt"
                      className="rounded-xl border border-yellow-500 max-h-60 object-cover w-full"
                    />
                  )}

                </div>

              ))}

            </div>

          )}

        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 border-t border-zinc-800 pt-6">

          <p>Deposit wallet</p>

          <p className="mt-2 text-green-400">
            JWT Authentication • GoldTrade Server.
          </p>

        </div>

      </div>

    </main>
  );
}