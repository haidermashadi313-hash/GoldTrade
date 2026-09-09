"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Calculator,
  Coins,
} from "lucide-react";

export default function GoldMarketPage() {
  const [gold24k, setGold24k] = useState(350000);
  const [gold22k, setGold22k] = useState(321000);
  const [gold21k, setGold21k] = useState(306500);
  const [gold18k, setGold18k] = useState(262500);

  const [amount, setAmount] = useState("");
  const [grams, setGrams] = useState(0);
  const [tola, setTola] = useState(0);

  // Demo live price movement
  const refreshPrice = () => {
    const random = Math.floor(Math.random() * 3000) - 1500;

    const latest24 = gold24k + random;
    setGold24k(latest24);
    setGold22k(Math.round(latest24 * 0.917));
    setGold21k(Math.round(latest24 * 0.876));
    setGold18k(Math.round(latest24 * 0.75));
  };

  useEffect(() => {
    const timer = setInterval(refreshPrice, 15000);
    return () => clearInterval(timer);
  });

  const calculateGold = () => {
    if (!amount) return;

    const value = Number(amount);

    const gramPrice = gold24k / 11.664;

    setGrams(Number((value / gramPrice).toFixed(3)));
    setTola(Number((value / gold24k).toFixed(4)));
  };

  const GoldCard = ({
    title,
    price,
    color,
  }: {
    title: string;
    price: number;
    color: string;
  }) => (
    <div className={`rounded-3xl p-6 border ${color} bg-zinc-900`}>
      <div className="flex justify-between items-center mb-3">
        <Coins className="text-yellow-400" size={28} />
        <TrendingUp className="text-green-400" size={20} />
      </div>

      <h3 className="text-xl font-bold text-yellow-400">{title}</h3>

      <p className="text-gray-400 mt-2">Price Per Tola</p>

      <h2 className="text-3xl font-bold mt-3 text-white">
        PKR {price.toLocaleString()}
      </h2>

      <p className="text-green-400 text-sm mt-2">
        Live Market • Updated every 15 sec
      </p>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white p-8">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">
        <div>
          <Link
            href="/dashboard"
            className="text-yellow-400 flex items-center gap-2 mb-3"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>

          <h1 className="text-4xl font-bold text-yellow-400">
            Live Gold Market
          </h1>

          <p className="text-gray-400 mt-2">
            GoldTrade Premium Live Gold Prices (Demo Live Update)
          </p>
        </div>

        <button
          onClick={refreshPrice}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl flex items-center gap-2 font-bold"
        >
          <RefreshCw size={18} />
          Refresh Price
        </button>
      </div>

      {/* Gold Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <GoldCard
          title="24K Gold"
          price={gold24k}
          color="border-yellow-500"
        />

        <GoldCard
          title="22K Gold"
          price={gold22k}
          color="border-orange-500"
        />

        <GoldCard
          title="21K Gold"
          price={gold21k}
          color="border-amber-500"
        />

        <GoldCard
          title="18K Gold"
          price={gold18k}
          color="border-green-500"
        />
      </div>

      {/* Calculator */}
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8">

        <div className="flex items-center gap-3 mb-6">
          <Calculator className="text-yellow-400" size={30} />

          <h2 className="text-3xl font-bold text-yellow-400">
            Gold Calculator
          </h2>
        </div>

        <p className="text-gray-400 mb-6">
          Enter PKR amount to calculate how much 24K Gold you can buy.
        </p>

        <input
          type="number"
          placeholder="Enter PKR Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-black border border-yellow-500 rounded-xl p-4 mb-5"
        />

        <button
          onClick={calculateGold}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold"
        >
          Calculate Gold
        </button>

        {grams > 0 && (
          <div className="grid md:grid-cols-2 gap-5 mt-8">

            <div className="bg-black border border-green-500 rounded-2xl p-5">
              <p className="text-gray-400">Gold Weight</p>

              <h2 className="text-4xl font-bold text-green-400 mt-2">
                {grams} Gram
              </h2>
            </div>

            <div className="bg-black border border-blue-500 rounded-2xl p-5">
              <p className="text-gray-400">Equivalent</p>

              <h2 className="text-4xl font-bold text-blue-400 mt-2">
                {tola} Tola
              </h2>
            </div>

          </div>
        )}
      </div>

      {/* Market Information */}
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mt-10">

        <h2 className="text-2xl font-bold text-yellow-400 mb-6">
          Gold Market Information
        </h2>

        <div className="grid md:grid-cols-2 gap-5">

          <div className="bg-black border border-zinc-700 rounded-2xl p-5">
            <p className="text-gray-400">Current Market Trend</p>

            <h3 className="text-green-400 text-3xl font-bold mt-2">
              Bullish ▲
            </h3>
          </div>

          <div className="bg-black border border-zinc-700 rounded-2xl p-5">
            <p className="text-gray-400">Last Refresh</p>

            <h3 className="text-yellow-400 text-2xl font-bold mt-2">
              Every 15 Seconds
            </h3>
          </div>

          <div className="bg-black border border-zinc-700 rounded-2xl p-5">
            <p className="text-gray-400">Currency</p>

            <h3 className="text-white text-2xl font-bold mt-2">
              Pakistani Rupee (PKR)
            </h3>
          </div>

          <div className="bg-black border border-zinc-700 rounded-2xl p-5">
            <p className="text-gray-400">Market Status</p>

            <h3 className="text-green-400 text-2xl font-bold mt-2">
              Live
            </h3>
          </div>

        </div>

      </div>
    </main>
  );
}