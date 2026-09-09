"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";

const API = "http://localhost:5000";

export default function WithdrawPage() {
  const username =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || "qqq"
      : "qqq";

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Easypaisa");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const submitWithdraw = async () => {
    if (!amount || !accountNumber) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          amount,
          method,
          accountNumber,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Withdraw request submitted.");

        setAmount("");
        setAccountNumber("");
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

      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-yellow-400 mb-8"
      >
        <ArrowLeft size={20}/>
        Back Dashboard
      </Link>

      <h1 className="text-4xl text-yellow-400 font-bold mb-8">
        Withdraw Funds
      </h1>

      <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6">

        <div className="grid gap-5">

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Withdraw Amount"
            type="number"
            className="bg-black border border-red-500 rounded-xl p-3"
          />

          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="bg-black border border-red-500 rounded-xl p-3"
          >
            <option>Easypaisa</option>
            <option>NayaPay</option>
            <option>Bank Al Habib</option>
            <option>USDT BEP20</option>
          </select>

          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="Account / Wallet Number"
            className="bg-black border border-red-500 rounded-xl p-3"
          />

          <button
            onClick={submitWithdraw}
            disabled={loading}
            className="bg-red-500 hover:bg-red-400 text-white rounded-xl py-3 font-bold flex justify-center gap-2"
          >
            <Send size={20}/>
            {loading ? "Submitting..." : "Submit Withdraw Request"}
          </button>

        </div>

      </div>

    </main>
  );
}