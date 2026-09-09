"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Wallet,
  CircleDollarSign,
  RefreshCw,
} from "lucide-react";

const API = "http://localhost:5000";

// Temporary Rate (Admin Settings se baad me ayegi)
const USDT_RATE = 282.4;

export default function BuyUsdtPage() {
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [pkrAmount, setPkrAmount] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("username");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (savedUser) {
      setUsername(savedUser);
    }
  }, []);

  const usdtAmount =
    Number(pkrAmount) > 0 ? Number(pkrAmount) / USDT_RATE : 0;

  const submitRequest = async () => {
    if (!walletAddress || !pkrAmount || !receipt) {
      alert("Please fill all fields.");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("walletAddress", walletAddress);
    formData.append("pkrAmount", pkrAmount);
    formData.append("usdtAmount", usdtAmount.toFixed(2));
    formData.append("receipt", receipt);

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/usdt/buy`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("USDT Buy Request Submitted Successfully.");

        setWalletAddress("");
        setPkrAmount("");
        setReceipt(null);
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

        <button
          className="bg-yellow-500 text-black px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <RefreshCw size={18}/>
          Live Rate
        </button>

      </div>

      <h1 className="text-4xl font-bold text-yellow-400 mb-2">
        Buy USDT (TRC20)
      </h1>

      <p className="text-gray-400 mb-8">
        Network: TRC20 • GoldTrade Official Wallet
      </p>

      {/* Live Rate Card */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-3xl p-6 text-black mb-8">

        <div className="flex items-center gap-3 mb-3">
          <CircleDollarSign size={32}/>
          <h2 className="text-2xl font-bold">
            Live TRC20 USDT Rate
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
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 space-y-5">

        <div>
          <label className="text-gray-400 text-sm">Username</label>

          <input
            value={username}
            disabled
            className="w-full bg-black border border-gray-700 rounded-xl p-3 mt-2"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">
            TRC20 Wallet Address
          </label>

          <input
            placeholder="Enter Your TRC20 Wallet"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 mt-2"
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">
            PKR Amount
          </label>

          <input
            type="number"
            placeholder="5000"
            value={pkrAmount}
            onChange={(e) => setPkrAmount(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl p-3 mt-2"
          />
        </div>

        <div className="bg-zinc-800 rounded-2xl p-5 border border-cyan-500">

          <div className="flex items-center gap-3 mb-3">
            <Wallet className="text-cyan-400"/>
            <h3 className="text-xl font-bold text-cyan-400">
              You Will Receive
            </h3>
          </div>

          <p className="text-4xl font-bold">
            {usdtAmount.toFixed(2)} USDT
          </p>

          <p className="text-gray-400 mt-2">
            TRC20 Network
          </p>

        </div>

        {/* Upload Receipt */}
        <div>

          <label className="text-gray-400 text-sm">
            Upload Payment Screenshot
          </label>

          <div className="mt-2 border-2 border-dashed border-yellow-500 rounded-2xl p-6 text-center">

            <Upload
              className="mx-auto text-yellow-400 mb-3"
              size={36}
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setReceipt(e.target.files?.[0] || null)
              }
            />

            {receipt && (
              <p className="text-green-400 mt-3">
                {receipt.name}
              </p>
            )}

          </div>

        </div>

        <button
          onClick={submitRequest}
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-2xl text-lg"
        >
          {loading ? "Submitting..." : "Submit Buy Request"}
        </button>

      </div>

      {/* Deposit Wallet */}
      <div className="mt-10 bg-zinc-900 border border-green-500 rounded-3xl p-6">

        <h2 className="text-green-400 text-2xl font-bold mb-3">
          GoldTrade TRC20 Wallet
        </h2>

        <p className="break-all text-sm text-gray-300">
          TGOLDTRADETRC20WALLETADDRESSXXXXXXXXXXXXXX
        </p>

        <p className="mt-3 text-gray-400">
          Send USDT only on TRC20 Network.
        </p>

      </div>

    </main>
  );
}