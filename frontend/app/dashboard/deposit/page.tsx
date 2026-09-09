"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Upload, CheckCircle } from "lucide-react";

const API = "http://localhost:5000";

export default function DepositPage() {
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Easypaisa");
  const [transactionId, setTransactionId] = useState("");

  const [receipt, setReceipt] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Payment Details
  const paymentInfo = {
    easypaisa: "PK65TMFB0000000095319127",

    // Yahan apna NayaPay IBAN paste karna
    nayapay: "PASTE_YOUR_NEW_NAYAPAY_IBAN_HERE",

    bankName: "Bank Al Habib",
    iban: "PK14BAHL5022004400811203",

    // USDT TRC20 Wallet
    usdt: "TLhFyxTjhBWBVHDDatdFHnLaSpv4VPrLTz",
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied Successfully ✅");
  };

  // Load Deposit History
  const loadHistory = async () => {
    try {
      const res = await fetch(`${API}/api/deposit`);
      const data = await res.json();

      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Submit Deposit
  const submitDeposit = async () => {
    if (!receipt) {
      alert("Upload payment screenshot first.");
      return;
    }

    const formData = new FormData();

    formData.append("username", username);
    formData.append("amount", amount);
    formData.append("method", method);
    formData.append("transactionId", transactionId);
    formData.append("receipt", receipt);

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/deposit`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("Deposit Submitted Successfully 🎉");

        setUsername("");
        setAmount("");
        setMethod("Easypaisa");
        setTransactionId("");
        setReceipt(null);
        setPreview("");

        loadHistory();
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Server Error");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">

      {/* Back Button */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-yellow-400 mb-8 hover:text-yellow-300"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </Link>

      {/* Heading */}
      <h1 className="text-4xl font-bold text-yellow-400 mb-2">
        Deposit Funds
      </h1>

      <p className="text-gray-400 mb-8">
        Choose your preferred payment method and upload your payment receipt.
      </p>

      {/* Payment Methods */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Easypaisa */}
        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">
          <h2 className="text-2xl text-green-400 font-bold mb-4">
            Easypaisa
          </h2>

          <p className="text-gray-400 mb-2">IBAN</p>

          <p className="break-all font-semibold text-lg">
            {paymentInfo.easypaisa}
          </p>

          <button
            onClick={() => copyText(paymentInfo.easypaisa)}
            className="w-full mt-5 bg-green-500 hover:bg-green-400 text-black py-3 rounded-xl font-bold flex justify-center gap-2"
          >
            <Copy size={18} />
            Copy IBAN
          </button>
        </div>

        {/* NayaPay */}
        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">
          <h2 className="text-2xl text-red-400 font-bold mb-4">
            NayaPay
          </h2>

          <p className="text-gray-400 mb-2">IBAN</p>

          <p className="break-all font-semibold text-lg">
            {paymentInfo.nayapay}
          </p>

          <button
            onClick={() => copyText(paymentInfo.nayapay)}
            className="w-full mt-5 bg-red-500 hover:bg-red-400 text-white py-3 rounded-xl font-bold flex justify-center gap-2"
          >
            <Copy size={18} />
            Copy IBAN
          </button>
        </div>

        {/* Bank Al Habib */}
        <div className="bg-zinc-900 border border-blue-500 rounded-3xl p-6">
          <h2 className="text-2xl text-blue-400 font-bold mb-4">
            Bank Al Habib
          </h2>

          <p className="text-gray-400 mb-2">
            {paymentInfo.bankName}
          </p>

          <p className="break-all font-semibold text-lg">
            {paymentInfo.iban}
          </p>

          <button
            onClick={() => copyText(paymentInfo.iban)}
            className="w-full mt-5 bg-blue-500 hover:bg-blue-400 text-white py-3 rounded-xl font-bold flex justify-center gap-2"
          >
            <Copy size={18} />
            Copy IBAN
          </button>
        </div>

        {/* USDT TRC20 */}
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
          <h2 className="text-2xl text-yellow-400 font-bold mb-4">
            USDT TRC20
          </h2>

          <p className="text-sm text-gray-400 mb-3">
            Tron Network (TRC20)
          </p>

          {/* QR Image */}
          <img
            src="/usdt-trc20.png"
            alt="USDT TRC20 QR"
            className="w-full rounded-xl bg-white p-2"
          />

          <p className="text-gray-400 mt-5 mb-2">
            Wallet Address
          </p>

          <p className="break-all font-semibold text-sm">
            {paymentInfo.usdt}
          </p>

          <button
            onClick={() => copyText(paymentInfo.usdt)}
            className="w-full mt-5 bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold flex justify-center gap-2"
          >
            <Copy size={18} />
            Copy Wallet Address
          </button>
        </div>

      </div>

      {/* Deposit Form */}
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mt-10">

        <h2 className="text-2xl text-yellow-400 font-bold mb-6">
          Submit Deposit Receipt
        </h2>

        <div className="grid gap-4">

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="bg-black border border-yellow-500 rounded-xl p-3"
          />

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Deposit Amount"
            type="number"
            className="bg-black border border-yellow-500 rounded-xl p-3"
          />

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="bg-black border border-yellow-500 rounded-xl p-3"
          >
            <option>Easypaisa</option>
            <option>NayaPay</option>
            <option>Bank Al Habib</option>
            <option>USDT TRC20</option>
          </select>

          <input
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="Transaction ID"
            className="bg-black border border-yellow-500 rounded-xl p-3"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (!e.target.files?.length) return;

              const file = e.target.files[0];
              setReceipt(file);
              setPreview(URL.createObjectURL(file));
            }}
            className="bg-black border border-yellow-500 rounded-xl p-3"
          />

          {preview && (
            <img
              src={preview}
              alt="Receipt Preview"
              className="rounded-xl border border-yellow-500 w-full md:w-72"
            />
          )}

          <button
            onClick={submitDeposit}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold flex justify-center gap-2"
          >
            <Upload size={20} />
            {loading ? "Submitting..." : "Submit Deposit Screenshot"}
          </button>

          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={20} />
            Deposit requests are reviewed within 5–15 minutes.
          </div>

        </div>
      </div>

      {/* Deposit History */}
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mt-10">

        <h2 className="text-2xl text-yellow-400 font-bold mb-5">
          Recent Deposit History
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full text-left">

            <thead className="border-b border-yellow-500 text-yellow-400">
              <tr>
                <th className="py-3">User</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    No Deposits Yet
                  </td>
                </tr>
              ) : (
                history.map((item: any) => (
                  <tr key={item._id} className="border-b border-zinc-800">

                    <td className="py-4">{item.username}</td>

                    <td>PKR {item.amount}</td>

                    <td>{item.method}</td>

                    <td>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-bold ${
                          item.status === "Approved"
                            ? "bg-green-500 text-black"
                            : item.status === "Rejected"
                            ? "bg-red-500 text-white"
                            : "bg-yellow-500 text-black"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

    </main>
  );
}