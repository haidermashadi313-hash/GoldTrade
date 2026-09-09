"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Coins,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  History,
} from "lucide-react";

const API = "http://localhost:5000";

// =====================================
// TYPES
// =====================================

interface UserData {
  username: string;
  walletBalance: number;
  goldBalance: number;
  goldAveragePrice: number;
  goldProfitLoss: number;
}

interface MarketData {
  goldPriceUSD: number;
  usdToPkr: number;
  buyGoldPrice: number;
  sellGoldPrice: number;
  goldSpread: number;
  goldTradingEnabled: boolean;
}

interface GoldTrade {
  _id: string;
  tradeType: "BUY" | "SELL";
  grams: number;
  totalPKR: number;
  pricePerGram: number;
  profit: number;
  createdAt: string;
}

export default function GoldPage() {
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<UserData>({
    username: "",
    walletBalance: 0,
    goldBalance: 0,
    goldAveragePrice: 0,
    goldProfitLoss: 0,
  });

  const [market, setMarket] = useState<MarketData>({
    goldPriceUSD: 0,
    usdToPkr: 0,
    buyGoldPrice: 0,
    sellGoldPrice: 0,
    goldSpread: 0,
    goldTradingEnabled: true,
  });

  const [history, setHistory] = useState<GoldTrade[]>([]);

  const [buyGram, setBuyGram] = useState(1);
  const [sellGram, setSellGram] = useState(1);

  const [processing, setProcessing] = useState(false);

  // =====================================
  // LOAD DATA
  // =====================================

  const loadPage = async () => {
    try {
      setLoading(true);

      const username = localStorage.getItem("username");

      if (!username) {
        window.location.href = "/login";
        return;
      }

      const [userRes, marketRes, historyRes] = await Promise.all([
        fetch(`${API}/api/users/${username}`),
        fetch(`${API}/api/settings/market`),
        fetch(`${API}/api/gold/history/${username}`),
      ]);

      const userData = await userRes.json();
      const marketData = await marketRes.json();
      const historyData = await historyRes.json();

      if (userData.success) setUser(userData.data);
      if (marketData.success) setMarket(marketData.data);
      if (historyData.success) setHistory(historyData.data);
    } catch (err) {
      console.error(err);
      alert("Unable to load Gold Market.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();

    const interval = setInterval(loadPage, 15000);
    return () => clearInterval(interval);
  }, []);

  // =====================================
  // LIVE CALCULATIONS
  // =====================================

  const buyTotal = useMemo(() => {
    return buyGram * market.buyGoldPrice;
  }, [buyGram, market.buyGoldPrice]);

  const sellTotal = useMemo(() => {
    return sellGram * market.sellGoldPrice;
  }, [sellGram, market.sellGoldPrice]);

  const livePortfolio = useMemo(() => {
    return user.goldBalance * market.sellGoldPrice;
  }, [user.goldBalance, market.sellGoldPrice]);

  const liveProfit = useMemo(() => {
    return (
      (market.sellGoldPrice - user.goldAveragePrice) *
      user.goldBalance
    );
  }, [market.sellGoldPrice, user]);

  // =====================================
  // BUY GOLD
  // =====================================

  const buyGold = async () => {
    if (!market.goldTradingEnabled) {
      return alert("Gold Trading Disabled.");
    }

    if (buyGram <= 0) {
      return alert("Enter valid grams.");
    }

    setProcessing(true);

    try {
      const res = await fetch(`${API}/api/gold/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: user.username,
          grams: buyGram,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Gold Purchased Successfully!\n${buyGram} Gram`);
        setBuyGram(1);
        loadPage();
      } else {
        alert(data.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  // =====================================
  // SELL GOLD
  // =====================================

  const sellGold = async () => {
    if (!market.goldTradingEnabled) {
      return alert("Gold Trading Disabled.");
    }

    if (sellGram <= 0) {
      return alert("Enter valid grams.");
    }

    setProcessing(true);

    try {
      const res = await fetch(`${API}/api/gold/sell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: user.username,
          grams: sellGram,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(
          `Gold Sold Successfully!\nProfit PKR ${Number(
            data.profit
          ).toFixed(2)}`
        );

        setSellGram(1);
        loadPage();
      } else {
        alert(data.message);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" />
        Loading Gold Market...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* LIVE MARKET */}

        <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400 rounded-3xl p-8 text-black mb-8">

          <div className="flex justify-between items-center">

            <div>

              <p className="font-semibold">LIVE GOLD PRICE</p>

              <h1 className="text-5xl font-bold mt-2">
                ${market.goldPriceUSD.toFixed(2)}
              </h1>

              <p className="mt-2 text-lg">
                USD → PKR : {market.usdToPkr}
              </p>

            </div>

            <Coins size={90} />

          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-8">

            <div className="bg-green-700 rounded-2xl p-5 text-white">

              <p>BUY PRICE / Gram</p>

              <h2 className="text-3xl font-bold mt-2">
                PKR {market.buyGoldPrice.toLocaleString()}
              </h2>

            </div>

            <div className="bg-red-700 rounded-2xl p-5 text-white">

              <p>SELL PRICE / Gram</p>

              <h2 className="text-3xl font-bold mt-2">
                PKR {market.sellGoldPrice.toLocaleString()}
              </h2>

            </div>

          </div>

        </div>

        {/* PORTFOLIO */}

        <div className="grid md:grid-cols-4 gap-5 mb-10">

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
            <Wallet className="text-green-400 mb-3" size={30} />
            <p className="text-gray-400">PKR Wallet</p>
            <h2 className="text-2xl font-bold text-green-400">
              PKR {user.walletBalance.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
            <Coins className="text-yellow-400 mb-3" size={30} />
            <p className="text-gray-400">Gold Holdings</p>
            <h2 className="text-2xl font-bold text-yellow-400">
              {user.goldBalance.toFixed(2)} g
            </h2>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
            <TrendingUp className="text-cyan-400 mb-3" size={30} />
            <p className="text-gray-400">Portfolio Value</p>
            <h2 className="text-2xl font-bold text-cyan-400">
              PKR {livePortfolio.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
            {liveProfit >= 0 ? (
              <TrendingUp className="text-green-400 mb-3" size={30} />
            ) : (
              <TrendingDown className="text-red-400 mb-3" size={30} />
            )}

            <p className="text-gray-400">Live Profit / Loss</p>

            <h2
              className={`text-2xl font-bold ${
                liveProfit >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              PKR {liveProfit.toLocaleString()}
            </h2>

          </div>

        </div>

        {/* BUY / SELL PANELS */}

        <div className="grid lg:grid-cols-2 gap-8 mb-10">

          {/* BUY PANEL */}

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-5">
              <ArrowDownCircle className="text-green-400" size={28} />
              <h2 className="text-2xl font-bold text-green-400">
                Buy Gold
              </h2>
            </div>

            <label className="text-gray-400">Gold Amount (Gram)</label>

            <input
              type="number"
              value={buyGram}
              min={0.1}
              step={0.1}
              onChange={(e) => setBuyGram(Number(e.target.value))}
              className="w-full bg-black border border-gray-700 rounded-xl p-4 mt-2 mb-5"
            />

            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Buy Price / Gram</span>
                <span>PKR {market.buyGoldPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Total Amount</span>
                <span className="text-yellow-400 font-bold">
                  PKR {buyTotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Wallet Balance</span>
                <span>PKR {user.walletBalance.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={buyGold}
              disabled={processing}
              className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-bold"
            >
              {processing ? "Processing..." : "Buy Gold Now"}
            </button>

          </div>

          {/* SELL PANEL */}

          <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6">

            <div className="flex items-center gap-3 mb-5">
              <ArrowUpCircle className="text-red-400" size={28} />
              <h2 className="text-2xl font-bold text-red-400">
                Sell Gold
              </h2>
            </div>

            <label className="text-gray-400">Sell Amount (Gram)</label>

            <input
              type="number"
              value={sellGram}
              min={0.1}
              step={0.1}
              onChange={(e) => setSellGram(Number(e.target.value))}
              className="w-full bg-black border border-gray-700 rounded-xl p-4 mt-2 mb-5"
            />

            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Sell Price / Gram</span>
                <span>PKR {market.sellGoldPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>You Receive</span>
                <span className="text-yellow-400 font-bold">
                  PKR {sellTotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Available Gold</span>
                <span>{user.goldBalance.toFixed(2)} g</span>
              </div>
            </div>

            <button
              onClick={sellGold}
              disabled={processing}
              className="w-full bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-bold"
            >
              {processing ? "Processing..." : "Sell Gold Now"}
            </button>

          </div>

        </div>
                {/* LIVE PROFIT SUMMARY */}

        <div className="grid md:grid-cols-3 gap-6 mb-10">

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">
            <p className="text-gray-400">Average Buy Price</p>

            <h2 className="text-3xl font-bold text-yellow-400 mt-2">
              PKR {user.goldAveragePrice.toLocaleString()}
            </h2>
          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6">
            <p className="text-gray-400">Current Portfolio Value</p>

            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              PKR {livePortfolio.toLocaleString(undefined,{
                maximumFractionDigits:0,
              })}
            </h2>
          </div>

          <div
            className={`rounded-3xl p-6 border ${
              liveProfit >= 0
                ? "bg-green-950 border-green-600"
                : "bg-red-950 border-red-600"
            }`}
          >
            <p className="text-gray-300">Live Profit / Loss</p>

            <h2
              className={`text-3xl font-bold mt-2 ${
                liveProfit >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              PKR {liveProfit.toLocaleString(undefined,{
                maximumFractionDigits:0,
              })}
            </h2>

            <p className="mt-3 text-sm text-gray-400">
              Total Realized Profit
            </p>

            <h3
              className={`text-xl font-bold ${
                user.goldProfitLoss >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              PKR {user.goldProfitLoss.toLocaleString()}
            </h3>
          </div>

        </div>

        {/* GOLD TRADE HISTORY */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-3">
              <History size={24}/>
              Gold Trading History
            </h2>

            <button
              onClick={loadPage}
              className="bg-yellow-500 text-black px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <RefreshCw size={16}/>
              Refresh
            </button>

          </div>

          {history.length === 0 ? (

            <div className="text-center py-10 text-gray-500">
              No Gold Trading History Found
            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="border-b border-yellow-600 text-yellow-400">

                  <tr className="text-left">
                    <th className="py-3">Type</th>
                    <th>Gram</th>
                    <th>Price/Gram</th>
                    <th>Total</th>
                    <th>Profit</th>
                    <th>Date</th>
                  </tr>

                </thead>

                <tbody>

                  {history.map((trade) => (

                    <tr
                      key={trade._id}
                      className="border-b border-zinc-800 hover:bg-zinc-800 transition"
                    >

                      <td className="py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            trade.tradeType === "BUY"
                              ? "bg-green-700 text-white"
                              : "bg-red-700 text-white"
                          }`}
                        >
                          {trade.tradeType}
                        </span>

                      </td>

                      <td>{trade.grams.toFixed(2)} g</td>

                      <td>
                        PKR {trade.pricePerGram.toLocaleString()}
                      </td>

                      <td>
                        PKR {trade.totalPKR.toLocaleString()}
                      </td>

                      <td>

                        <span
                          className={
                            trade.profit >= 0
                              ? "text-green-400 font-bold"
                              : "text-red-400 font-bold"
                          }
                        >
                          PKR {trade.profit.toLocaleString()}
                        </span>

                      </td>

                      <td>
                        {new Date(
                          trade.createdAt
                        ).toLocaleString()}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

        {/* GOLD HOLDINGS SUMMARY */}

        <div className="grid lg:grid-cols-2 gap-6 mb-12">

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

            <h2 className="text-xl font-bold text-yellow-400 mb-5">
              Gold Holdings Summary
            </h2>

            <div className="space-y-4">

              <SummaryRow
                label="Gold Holdings"
                value={`${user.goldBalance.toFixed(2)} g`}
              />

              <SummaryRow
                label="Average Buy Price"
                value={`PKR ${user.goldAveragePrice.toLocaleString()}`}
              />

              <SummaryRow
                label="Current Sell Price"
                value={`PKR ${market.sellGoldPrice.toLocaleString()}`}
              />

              <SummaryRow
                label="Portfolio Value"
                value={`PKR ${livePortfolio.toLocaleString(undefined,{
                  maximumFractionDigits:0,
                })}`}
              />

            </div>

          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6">

            <h2 className="text-xl font-bold text-cyan-400 mb-5">
              Live Market Summary
            </h2>

            <div className="space-y-4">

              <SummaryRow
                label="Gold Price USD"
                value={`$ ${market.goldPriceUSD}`}
              />

              <SummaryRow
                label="USD → PKR"
                value={market.usdToPkr.toString()}
              />

              <SummaryRow
                label="Spread"
                value={`${market.goldSpread}%`}
              />

              <SummaryRow
                label="Trading Status"
                value={
                  market.goldTradingEnabled
                    ? "LIVE"
                    : "CLOSED"
                }
                color={
                  market.goldTradingEnabled
                    ? "green"
                    : "red"
                }
              />

            </div>

          </div>

        </div>

      </div>
    </main>
  );
}

// =====================================
// SUMMARY ROW COMPONENT
// =====================================

interface SummaryRowProps {
  label: string;
  value: string;
  color?: "green" | "red";
}

function SummaryRow({
  label,
  value,
  color,
}: SummaryRowProps) {
  return (
    <div className="flex justify-between items-center border-b border-zinc-800 pb-3">

      <span className="text-gray-400">{label}</span>

      <span
        className={`font-bold ${
          color === "green"
            ? "text-green-400"
            : color === "red"
            ? "text-red-400"
            : "text-white"
        }`}
      >
        {value}
      </span>

    </div>
  );
}