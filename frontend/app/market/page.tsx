"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Coins,
  DollarSign,
  Bitcoin,
  TrendingUp,
  Activity,
  Wallet,
  Clock,
  BarChart3,
  Calculator,
} from "lucide-react";

const API = "http://localhost:5000";

interface MarketData {
  goldPriceUSD: number;
  usdToPkr: number;
  usdtRate: number;
  goldSpread: number;
  buyGoldPrice: number;
  sellGoldPrice: number;
  trc20Wallet: string;
  trc20Qr: string;
}

export default function MarketPage() {
  const [market, setMarket] = useState<MarketData>({
    goldPriceUSD: 0,
    usdToPkr: 0,
    usdtRate: 0,
    goldSpread: 0,
    buyGoldPrice: 0,
    sellGoldPrice: 0,
    trc20Wallet: "",
    trc20Qr: "",
  });

  const [loading, setLoading] = useState(false);
  const [gram, setGram] = useState(1);

  // Live Load
  const loadMarket = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/settings/market`);
      const data = await res.json();

      if (data.success) {
        setMarket(data.data);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarket();

    const interval = setInterval(loadMarket, 30000);

    return () => clearInterval(interval);
  }, []);

  // Calculator
  const goldBuyPKR =
    gram * market.buyGoldPrice * market.usdToPkr;

  const goldSellPKR =
    gram * market.sellGoldPrice * market.usdToPkr;

  return (
    <main className="min-h-screen bg-black text-white">

      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#ca8a0420,transparent_40%)] pointer-events-none"/>

      <div className="relative p-8">

        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-10">

          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300"
          >
            <ArrowLeft size={20}/>
            Dashboard
          </Link>

          <button
            onClick={loadMarket}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
            Refresh Market
          </button>

        </div>

        {/* Title */}
        <div className="mb-10">

          <h1 className="text-5xl font-black text-yellow-400">
            LIVE GOLD MARKET
          </h1>

          <p className="text-gray-400 mt-2 text-lg">
            GoldTrade Premium Trading Center • Auto Refresh Every 30 Seconds
          </p>

        </div>

        {/* Live Cards */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6 mb-10">

          {/* Gold */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-yellow-400 to-yellow-700 text-black shadow-2xl">
            <Coins size={34}/>
            <p className="mt-3 font-semibold">
              Live Gold Price
            </p>

            <h2 className="text-3xl font-black mt-2">
              ${market.goldPriceUSD.toFixed(2)}
            </h2>

            <p className="mt-3 text-sm">
              XAU/USD
            </p>
          </div>

          {/* USD PKR */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl">
            <DollarSign size={34}/>
            <p className="mt-3 text-sm text-blue-100">
              USD / PKR
            </p>

            <h2 className="text-3xl font-black mt-2">
              {market.usdToPkr.toFixed(2)}
            </h2>
          </div>

          {/* USDT */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-green-500 to-green-700 shadow-2xl">
            <Bitcoin size={34}/>
            <p className="mt-3 text-sm text-green-100">
              TRC20 USDT Rate
            </p>

            <h2 className="text-3xl font-black mt-2">
              PKR {market.usdtRate.toFixed(2)}
            </h2>
          </div>

          {/* Market */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-purple-500 to-purple-700 shadow-2xl">
            <Activity size={34}/>
            <p className="mt-3 text-sm text-purple-100">
              Market Status
            </p>

            <h2 className="text-3xl font-black mt-2 text-green-300">
              OPEN
            </h2>

            <p className="mt-3 text-xs flex items-center gap-2">
              <Clock size={14}/>
              Auto Refresh 30 Seconds
            </p>
          </div>

        </div>

        {/* Buy Sell Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">

          <div className="bg-zinc-900 border border-green-500 rounded-3xl p-8">

            <TrendingUp className="text-green-400 mb-4" size={34}/>

            <p className="text-green-400 font-bold">
              BUY GOLD
            </p>

            <h2 className="text-4xl font-black text-white mt-3">
              ${market.buyGoldPrice.toFixed(2)}
            </h2>

            <p className="text-gray-400 mt-3">
              GoldTrade Buy Price (Spread Included)
            </p>

          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-3xl p-8">

            <TrendingUp className="text-red-400 rotate-180 mb-4" size={34}/>

            <p className="text-red-400 font-bold">
              SELL GOLD
            </p>

            <h2 className="text-4xl font-black text-white mt-3">
              ${market.sellGoldPrice.toFixed(2)}
            </h2>

            <p className="text-gray-400 mt-3">
              GoldTrade Sell Price (Spread Included)
            </p>

          </div>

        </div>

        {/* Gold Calculator */}
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">

          <div className="flex items-center gap-3 mb-6">

            <Calculator className="text-yellow-400" size={32}/>

            <h2 className="text-3xl font-bold text-yellow-400">
              Gold Calculator
            </h2>

          </div>

          <label className="text-gray-400">
            Gold Weight (Gram)
          </label>

          <input
            type="number"
            value={gram}
            onChange={(e) => setGram(Number(e.target.value))}
            className="w-full bg-black border border-yellow-500 rounded-xl p-4 mt-2 text-xl"
          />

          <div className="grid md:grid-cols-2 gap-6 mt-8">

            <div className="bg-black rounded-2xl border border-green-500 p-6">

              <p className="text-green-400">
                Buy Gold Price
              </p>

              <h2 className="text-3xl font-black mt-3 text-white">
                PKR {goldBuyPKR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h2>

              <p className="text-gray-500 mt-3">
                {gram} Gram × Buy Rate
              </p>

            </div>

            <div className="bg-black rounded-2xl border border-red-500 p-6">

              <p className="text-red-400">
                Sell Gold Price
              </p>

              <h2 className="text-3xl font-black mt-3 text-white">
                PKR {goldSellPKR.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h2>

              <p className="text-gray-500 mt-3">
                {gram} Gram × Sell Rate
              </p>

            </div>

          </div>

        </div>

        {/* Market Analytics */}
        <div className="grid lg:grid-cols-2 gap-6 mb-10">

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8">

            <BarChart3 className="text-yellow-400 mb-4" size={34}/>

            <h3 className="text-2xl font-bold text-yellow-400 mb-5">
              Market Analytics
            </h3>

            <div className="space-y-5">

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Gold Spread
                </span>

                <span className="text-white font-bold">
                  {market.goldSpread}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Buy Difference
                </span>

                <span className="text-green-400 font-bold">
                  +${(market.buyGoldPrice - market.goldPriceUSD).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Sell Difference
                </span>

                <span className="text-red-400 font-bold">
                  -${(market.goldPriceUSD - market.sellGoldPrice).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">
                  Market Currency
                </span>

                <span className="text-yellow-400 font-bold">
                  USD / PKR
                </span>
              </div>

            </div>

          </div>

          {/* Wallet */}
          <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-8">

            <Wallet className="text-cyan-400 mb-4" size={34}/>

            <h3 className="text-2xl font-bold text-cyan-400 mb-5">
              GoldTrade TRC20 Wallet
            </h3>

            <div className="bg-black rounded-xl p-4 border border-cyan-500 break-all text-sm text-cyan-300">
              {market.trc20Wallet || "Wallet Not Added Yet"}
            </div>

            {market.trc20Qr && (
              <img
                src={`${API}/uploads/settings/${market.trc20Qr}`}
                alt="QR"
                className="w-52 h-52 mt-6 rounded-2xl border border-cyan-500"
              />
            )}

            <p className="text-gray-500 mt-5">
              Deposit USDT only using TRC20 Network.
            </p>

          </div>

        </div>

        {/* Live Chart Placeholder */}
        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="text-yellow-400"/>
            <h2 className="text-3xl font-bold text-yellow-400">
              Gold Price Trend
            </h2>
          </div>

          <div className="h-72 rounded-2xl bg-gradient-to-r from-yellow-900/20 via-yellow-500/10 to-yellow-900/20 flex items-center justify-center border border-yellow-700">
            <div className="text-center">
              <BarChart3 size={60} className="mx-auto text-yellow-400 mb-4"/>
              <p className="text-xl font-semibold text-yellow-400">
                Live Gold Chart Coming in GoldTrade V3.5
              </p>
              <p className="text-gray-500 mt-2">
                TradingView Style Live Candle Chart
              </p>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-5">

          <Link
            href="/buy-usdt"
            className="bg-green-600 hover:bg-green-500 rounded-3xl p-6 text-center font-bold text-xl"
          >
            Buy TRC20 USDT
          </Link>

          <Link
            href="/sell-usdt"
            className="bg-red-600 hover:bg-red-500 rounded-3xl p-6 text-center font-bold text-xl"
          >
            Sell TRC20 USDT
          </Link>

          <Link
            href="/dashboard"
            className="bg-yellow-500 hover:bg-yellow-400 text-black rounded-3xl p-6 text-center font-bold text-xl"
          >
            Back Dashboard
          </Link>

        </div>

      </div>

    </main>
  );
}