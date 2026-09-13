"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  ArrowLeft,
  Wallet,
  CircleDollarSign,
  RefreshCw,
  Send,
  Landmark,
  Smartphone,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface WalletData {
  walletBalance: number;
  usdtBalance: number;
}

interface PaymentSettings {
  usdtSellRate: number;
}

export default function SellUsdtPage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const [wallet, setWallet] = useState<WalletData>({
    walletBalance: 0,
    usdtBalance: 0,
  });

  const [sellRate, setSellRate] = useState(281.2);

  const [usdtAmount, setUsdtAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("BANK");

  const [bankName, setBankName] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // Load user + rates
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
        axios.get(`${API}/api/wallets/${user}`),
        axios.get(`${API}/api/admin/payment-settings`),
      ]);

      setWallet({
        walletBalance: walletRes.data.walletBalance || 0,
        usdtBalance: walletRes.data.usdtBalance || 0,
      });

      const settings: PaymentSettings = rateRes.data.settings;

      setSellRate(settings.usdtSellRate);

    } catch (err) {
      console.log(err);
    }
  };

  // PKR Calculation
  const pkrReceive = useMemo(() => {
    return Number(usdtAmount || 0) * sellRate;
  }, [usdtAmount, sellRate]);

  // Submit Sell Request
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

      const token = localStorage.getItem("token");

      const res = await axios.post(
        `${API}/api/usdt/sell`,
        {
          username,
          usdtAmount: Number(usdtAmount),
          pkrAmount: Number(pkrReceive.toFixed(2)),
          paymentMethod,
          bankName,
          accountTitle,
          accountNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        alert("Sell USDT Request Submitted.");

        setUsdtAmount("");
        setAccountTitle("");
        setAccountNumber("");
        setBankName("");

        loadData(username);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Server Error");
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
          className="bg-yellow-500 text-black px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <RefreshCw size={18}/>
          Refresh
        </button>

      </div>

      <h1 className="text-4xl font-black text-red-400 mb-2">
        Sell USDT
      </h1>

      <p className="text-gray-400 mb-8">
        Convert your USDT into PKR after Admin approval.
      </p>

      {/* Wallet Cards */}

      <div className="grid md:grid-cols-2 gap-6 mb-8">

        <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6">
          <Wallet className="text-cyan-400 mb-3"/>
          <p className="text-gray-400 text-sm">Available USDT Balance</p>

          <h2 className="text-4xl font-black text-cyan-400">
            {wallet.usdtBalance.toFixed(2)} USDT
          </h2>
        </div>

        <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-3xl p-6">
          <CircleDollarSign className="mb-3"/>
          <p className="text-white/80 text-sm">Live Sell Rate</p>

          <h2 className="text-5xl font-black">
            PKR {sellRate}
          </h2>

          <p className="text-white/80 mt-2">
            1 USDT = PKR {sellRate}
          </p>
        </div>

      </div>      {/* ================= SELL FORM ================= */}

      <div className="bg-zinc-900 border border-red-500 rounded-3xl p-6 space-y-6">

        {/* USDT Amount */}

        <div>
          <label className="text-gray-400 text-sm">
            USDT Amount
          </label>

          <input
            type="number"
            placeholder="100"
            value={usdtAmount}
            onChange={(e) => setUsdtAmount(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2 focus:border-red-500 outline-none"
          />
        </div>

        {/* Payment Method */}

        <div>
          <label className="text-gray-400 text-sm mb-3 block">
            Receive Payment Method
          </label>

          <div className="grid grid-cols-3 gap-3">

            {["BANK", "EASYPAISA", "NAYAPAY"].map((item) => (
              <button
                key={item}
                onClick={() => setPaymentMethod(item)}
                className={`rounded-xl py-3 font-bold border transition ${
                  paymentMethod === item
                    ? "bg-yellow-500 text-black border-yellow-500"
                    : "bg-black border-zinc-700 hover:border-yellow-500"
                }`}
              >
                {item}
              </button>
            ))}

          </div>

        </div>

        {/* Bank Name */}

        {paymentMethod === "BANK" && (
          <div>
            <label className="text-gray-400 text-sm flex items-center gap-2">
              <Landmark size={16}/>
              Bank Name
            </label>

            <input
              placeholder="Meezan Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2 focus:border-red-500 outline-none"
            />
          </div>
        )}

        {/* Account Title */}

        <div>
          <label className="text-gray-400 text-sm flex items-center gap-2">
            <Wallet size={16}/>
            Account Title
          </label>

          <input
            placeholder="Your Account Title"
            value={accountTitle}
            onChange={(e) => setAccountTitle(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2 focus:border-red-500 outline-none"
          />
        </div>

        {/* Account Number */}

        <div>
          <label className="text-gray-400 text-sm flex items-center gap-2">
            <Smartphone size={16}/>
            {paymentMethod === "BANK"
              ? "Bank Account Number"
              : "Mobile Number"}
          </label>

          <input
            placeholder="03XXXXXXXXX"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2 focus:border-red-500 outline-none"
          />
        </div>

        {/* Live Calculator */}

        <div className="bg-zinc-800 border border-green-500 rounded-3xl p-6">

          <div className="flex items-center gap-3 mb-4">
            <CircleDollarSign className="text-green-400"/>
            <h2 className="text-xl font-black text-green-400">
              Live PKR Calculator
            </h2>
          </div>

          <div className="space-y-3">

            <div className="flex justify-between text-gray-400">
              <span>Sell Rate</span>
              <span>PKR {sellRate}</span>
            </div>

            <div className="flex justify-between text-gray-400">
              <span>Selling USDT</span>
              <span>{Number(usdtAmount || 0).toFixed(2)} USDT</span>
            </div>

            <div className="border-t border-zinc-700 pt-4 flex justify-between items-center">
              <span className="text-lg text-white font-semibold">
                You Will Receive
              </span>

              <span className="text-3xl font-black text-green-400">
                PKR {pkrReceive.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

          </div>

        </div>

        {/* Submit Button */}

        <button
          onClick={submitSellRequest}
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-black py-4 rounded-2xl text-xl flex items-center justify-center gap-3 transition"
        >
          <Send size={22}/>
          {loading ? "Submitting Request..." : "Submit Sell USDT Request"}
        </button>

      </div>

      {/* ================= INFO CARD ================= */}

      <div className="mt-10 bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

        <h2 className="text-yellow-400 text-2xl font-black mb-5">
          GoldTrade Sell USDT Process
        </h2>

        <div className="space-y-4 text-gray-300">

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold">
              1
            </div>

            <p>Enter the amount of USDT you want to sell.</p>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold">
              2
            </div>

            <p>Select your payment method (Bank, EasyPaisa or NayaPay).</p>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold">
              3
            </div>

            <p>Submit your sell request for manual admin approval.</p>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold">
              4
            </div>

            <p>
              After approval, USDT will be deducted from your wallet and PKR
              will be credited to your GoldTrade wallet.
            </p>
          </div>

        </div>

      </div>

      {/* ================= FOOTER ================= */}

      <div className="mt-12 border-t border-zinc-800 pt-6 text-center text-gray-500 text-sm">
        GoldTrade V17 Enterprise • Secure USDT Sell Module
      </div>

    </main>
  );
}