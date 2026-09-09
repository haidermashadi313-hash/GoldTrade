"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  CircleDollarSign,
  RefreshCw,
  Landmark,
  Smartphone,
  SendHorizontal,
} from "lucide-react";

const API = "http://localhost:5000";

// Temporary Live Rate (Settings se baad me ayegi)
const USDT_RATE = 282.4;

export default function SellUsdtPage() {
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Easypaisa");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("username");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (savedUser) setUsername(savedUser);
  }, []);

  // PKR Calculator
  const pkrAmount =
    Number(usdtAmount) > 0
      ? Number(usdtAmount) * USDT_RATE
      : 0;

  const submitSell = async () => {
    if (
      !walletAddress ||
      !usdtAmount ||
      !accountNumber ||
      !accountName
    ) {
      alert("Please fill all fields.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/usdt/sell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username,
          walletAddress,
          usdtAmount: Number(usdtAmount),
          pkrAmount: Number(pkrAmount.toFixed(2)),
          paymentMethod,
          accountNumber,
          accountName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Sell Request Submitted Successfully.");

        setWalletAddress("");
        setUsdtAmount("");
        setAccountNumber("");
        setAccountName("");
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Server Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">

        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-yellow-400"
        >
          <ArrowLeft size={18}/>
          Dashboard
        </Link>

        <button className="bg-yellow-500 text-black px-4 py-2 rounded-xl flex gap-2 items-center">
          <RefreshCw size={18}/>
          Live Rate
        </button>

      </div>

      <h1 className="text-4xl font-bold text-yellow-400 mb-2">
        Sell USDT (TRC20)
      </h1>

      <p className="text-gray-400 mb-8">
        Sell your TRC20 USDT and receive PKR.
      </p>

      {/* Live Rate */}
      <div className="bg-gradient-to-r from-green-500 to-green-700 rounded-3xl p-6 text-black mb-8">

        <div className="flex items-center gap-3 mb-3">
          <CircleDollarSign size={32}/>
          <h2 className="text-2xl font-bold">
            Live USDT Sell Rate
          </h2>
        </div>

        <h3 className="text-5xl font-bold">
          PKR {USDT_RATE}
        </h3>

        <p className="mt-2 opacity-80">
          1 USDT = PKR {USDT_RATE}
        </p>

      </div>

      {/* Form */}
      <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6 space-y-5">

        <div>
          <label className="text-gray-400 text-sm">Username</label>

          <input
            disabled
            value={username}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 mt-2"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">
            Your TRC20 Wallet Address
          </label>

          <input
            placeholder="Enter TRC20 Wallet Address"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 mt-2"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">
            USDT Amount
          </label>

          <input
            type="number"
            placeholder="20"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 mt-2"
          />
        </div>

        {/* PKR Receive */}
        <div className="bg-zinc-800 rounded-2xl border border-yellow-500 p-5">

          <div className="flex items-center gap-3 mb-3">
            <Wallet className="text-yellow-400"/>
            <h3 className="text-xl font-bold text-yellow-400">
              You Will Receive
            </h3>
          </div>

          <h2 className="text-4xl font-bold text-yellow-300">
            PKR {pkrAmount.toLocaleString()}
          </h2>

          <p className="text-gray-400 mt-2">
            Amount will be transferred after admin approval.
          </p>

        </div>

        {/* Payment Method */}
        <div>

          <label className="text-gray-400 text-sm">
            Receive Payment In
          </label>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 mt-2"
          >
            <option>Easypaisa</option>
            <option>JazzCash</option>
            <option>NayaPay</option>
            <option>Bank Account</option>
          </select>

        </div>

        <div>

          <label className="text-gray-400 text-sm">
            Account Number
          </label>

          <input
            placeholder="03XXXXXXXXX / Bank Account"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 mt-2"
          />

        </div>

        <div>

          <label className="text-gray-400 text-sm">
            Account Holder Name
          </label>

          <input
            placeholder="Enter Account Name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 mt-2"
          />

        </div>

        <button
          onClick={submitSell}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl flex justify-center items-center gap-3"
        >
          <SendHorizontal size={20}/>
          {loading ? "Submitting..." : "Submit Sell Request"}
        </button>

      </div>

      {/* Payment Methods */}
      <div className="grid md:grid-cols-2 gap-5 mt-10">

        <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5 flex gap-4 items-center">

          <Smartphone className="text-green-400" size={34}/>

          <div>
            <h3 className="font-bold text-green-400">
              Easypaisa / JazzCash
            </h3>

            <p className="text-gray-400 text-sm">
              Receive PKR instantly after approval.
            </p>
          </div>

        </div>

        <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5 flex gap-4 items-center">

          <Landmark className="text-blue-400" size={34}/>

          <div>
            <h3 className="font-bold text-blue-400">
              Bank Transfer
            </h3>

            <p className="text-gray-400 text-sm">
              Receive payment directly in your bank account.
            </p>
          </div>

        </div>

      </div>

      {/* Notice */}
      <div className="mt-10 bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

        <h3 className="text-yellow-400 font-bold mb-3">
          GoldTrade Sell Process
        </h3>

        <ul className="list-disc ml-5 text-gray-300 space-y-2">
          <li>Submit your TRC20 USDT sell request.</li>
          <li>Admin verifies your request.</li>
          <li>USDT wallet is debited after approval.</li>
          <li>PKR payment is sent to your selected account.</li>
        </ul>

      </div>

    </main>
  );
}