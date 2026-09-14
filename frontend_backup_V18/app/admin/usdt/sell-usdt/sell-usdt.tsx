"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wallet,
  CircleDollarSign,
  RefreshCw,
  Send,
  CheckCircle,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface WalletInfo {
  walletBalance: number;
  usdtBalance: number;
}

export default function SellUsdtPage() {
  const [username, setUsername] = useState("");
  const [wallet, setWallet] = useState<WalletInfo>({
    walletBalance: 0,
    usdtBalance: 0,
  });

  const [sellRate, setSellRate] = useState(281.2);
  const [loading, setLoading] = useState(false);

  const [usdtAmount, setUsdtAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK");

  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("username");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (savedUser) {
      setUsername(savedUser);
      loadData(savedUser);
    }
  }, []);

  const loadData = async (user: string) => {
    try {
      const [walletRes, rateRes] = await Promise.all([
        fetch(`${API}/api/wallets/${user}`),
        fetch(`${API}/api/usdt/rate`),
      ]);

      if (walletRes.ok) {
        const walletData = await walletRes.json();

        setWallet({
          walletBalance: walletData.walletBalance || 0,
          usdtBalance: walletData.usdtBalance || 0,
        });
      }

      if (rateRes.ok) {
        const rateData = await rateRes.json();

        if (rateData.success) {
          setSellRate(rateData.rate.sellRate);
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const pkrAmount = useMemo(() => {
    return Number(usdtAmount || 0) * sellRate;
  }, [usdtAmount, sellRate]);

  const submitSellRequest = async () => {
    if (!usdtAmount || !accountTitle || !accountNumber) {
      alert("Please fill all required fields.");
      return;
    }

    if (Number(usdtAmount) > wallet.usdtBalance) {
      alert("Insufficient USDT Balance.");
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
          usdtAmount,
          pkrAmount,
          paymentMethod,
          accountTitle,
          accountNumber,
          bankName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Sell USDT request submitted successfully.");

        setUsdtAmount("");
        setAccountTitle("");
        setAccountNumber("");
        setBankName("");
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
    <main className="min-h-screen bg-black text-white p-6">

      {/* Header */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-yellow-400"
        >
          <ArrowLeft size={20}/>
          Dashboard
        </Link>

        <button
          onClick={() => loadData(username)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <RefreshCw size={18}/>
          Refresh
        </button>

      </div>

      <h1 className="text-4xl font-black text-red-400 mb-2">
        Sell USDT
      </h1>

      <p className="text-gray-400 mb-8">
        Convert your USDT into PKR wallet after Admin approval.
      </p>

      {/* Wallet Cards */}

      <div className="grid md:grid-cols-2 gap-6 mb-8">

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">

          <div className="flex items-center gap-3 mb-3">
            <Wallet className="text-cyan-400"/>
            <h2 className="font-bold text-xl text-cyan-400">
              USDT Wallet
            </h2>
          </div>

          <h1 className="text-4xl font-black">
            {wallet.usdtBalance.toFixed(2)} USDT
          </h1>

        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-3xl p-6">

          <div className="flex items-center gap-3 mb-3">
            <CircleDollarSign size={30}/>
            <h2 className="font-bold text-xl">
              Live Sell Rate
            </h2>
          </div>

          <h1 className="text-5xl font-black">
            PKR {sellRate}
          </h1>

          <p className="opacity-80 mt-2">
            1 USDT = PKR {sellRate}
          </p>

        </div>

      </div>

      {/* Sell Form */}

      <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6 space-y-5">

        <div>
          <label className="text-gray-400 text-sm">
            Username
          </label>

          <input
            value={username}
            disabled
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">
            USDT Amount
          </label>

          <input
            type="number"
            placeholder="100"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2"
          />
        </div>

        {/* Calculator */}

        <div className="bg-zinc-800 rounded-3xl border border-green-500 p-6">

          <div className="flex items-center gap-3 mb-3">
            <CircleDollarSign className="text-green-400"/>
            <h2 className="font-bold text-green-400 text-xl">
              You Will Receive
            </h2>
          </div>

          <h1 className="text-5xl font-black text-green-400">
            PKR {pkrAmount.toLocaleString()}
          </h1>

          <div className="mt-4 text-gray-400 space-y-2">

            <div className="flex justify-between">
              <span>Sell Rate</span>
              <span>PKR {sellRate}</span>
            </div>

            <div className="flex justify-between">
              <span>USDT Selling</span>
              <span>{usdtAmount || 0} USDT</span>
            </div>

          </div>

        </div>

        {/* Payment Method */}

        <div>

          <label className="text-gray-400 text-sm">
            Receive Payment Via
          </label>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2"
          >
            <option value="BANK">Bank Account</option>
            <option value="EASYPAISA">EasyPaisa</option>
            <option value="NAYAPAY">NayaPay</option>
          </select>

        </div>

        {paymentMethod === "BANK" && (
          <div>

            <label className="text-gray-400 text-sm">
              Bank Name
            </label>

            <input
              placeholder="Meezan Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2"
            />

          </div>
        )}

        <div>

          <label className="text-gray-400 text-sm">
            Account Title
          </label>

          <input
            placeholder="Your Account Name"
            value={accountTitle}
            onChange={(e) => setAccountTitle(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2"
          />

        </div>

        <div>

          <label className="text-gray-400 text-sm">
            Account / Mobile Number
          </label>

          <input
            placeholder="03XXXXXXXXX / Bank Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2"
          />

        </div>

        {/* Submit */}

        <button
          onClick={submitSellRequest}
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-4 rounded-2xl text-xl flex items-center justify-center gap-3"
        >
          <Send size={22}/>
          {loading
            ? "Submitting Request..."
            : "Submit Sell USDT Request"}
        </button>

      </div>

      {/* Information */}

      <div className="mt-8 bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

        <h2 className="text-yellow-400 text-2xl font-black mb-4">
          Sell Process
        </h2>

        <div className="space-y-3 text-gray-300">

          <div className="flex gap-3 items-start">
            <CheckCircle className="text-green-400 mt-1"/>
            <p>Enter the amount of USDT you want to sell.</p>
          </div>

          <div className="flex gap-3 items-start">
            <CheckCircle className="text-green-400 mt-1"/>
            <p>Select how you want to receive PKR.</p>
          </div>

          <div className="flex gap-3 items-start">
            <CheckCircle className="text-green-400 mt-1"/>
            <p>Your request will remain Pending until Admin approval.</p>
          </div>

          <div className="flex gap-3 items-start">
            <CheckCircle className="text-green-400 mt-1"/>
            <p>After approval, PKR will be added to your GoldTrade Wallet.</p>
          </div>

        </div>

      </div>

    </main>
  );
}