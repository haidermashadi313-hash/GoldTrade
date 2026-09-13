import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

interface PortfolioData {
  goldBalance: number;
  averageBuyPrice: number;
  currentPrice: number;
  totalInvested: number;
  totalSold: number;
  transactions: Transaction[];
}

interface Transaction {
  _id: string;
  type: "BUY" | "SELL";
  grams: number;
  amount: number;
  createdAt: string;
}

const GoldPortfolio: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:5000/api/gold/portfolio"
      );

      setPortfolio(res.data);
    } catch {
      // Demo Data
      setPortfolio({
        goldBalance: 18.75,
        averageBuyPrice: 101.2,
        currentPrice: 108.45,
        totalInvested: 1897.5,
        totalSold: 420,
        transactions: [
          {
            _id: "TX001",
            type: "BUY",
            grams: 5,
            amount: 505,
            createdAt: "2026-09-10T12:30:00Z",
          },
          {
            _id: "TX002",
            type: "BUY",
            grams: 8.75,
            amount: 885.5,
            createdAt: "2026-09-11T14:10:00Z",
          },
          {
            _id: "TX003",
            type: "SELL",
            grams: 2,
            amount: 216.9,
            createdAt: "2026-09-12T09:15:00Z",
          },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const currentValue = useMemo(() => {
    if (!portfolio) return 0;
    return portfolio.goldBalance * portfolio.currentPrice;
  }, [portfolio]);

  const profit = useMemo(() => {
    if (!portfolio) return 0;
    return currentValue - portfolio.totalInvested + portfolio.totalSold;
  }, [portfolio, currentValue]);

  const profitPercent = useMemo(() => {
    if (!portfolio || portfolio.totalInvested === 0) return 0;
    return (profit / portfolio.totalInvested) * 100;
  }, [portfolio, profit]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <h2 className="text-2xl text-yellow-400 font-bold">
          Loading Portfolio...
        </h2>
      </div>
    );
  }

  if (!portfolio) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-5">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-black text-yellow-400">
              Gold Portfolio
            </h1>
            <p className="text-zinc-400">
              Track your gold investment and earnings.
            </p>
          </div>

          <button
            onClick={fetchPortfolio}
            className="bg-yellow-500 text-black px-5 py-3 rounded-xl font-bold hover:bg-yellow-400"
          >
            Refresh
          </button>
        </div>

        {/* Main Portfolio Card */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-3xl p-8 text-black">
          <p className="uppercase text-sm font-bold opacity-70">
            Total Gold Holdings
          </p>

          <h2 className="text-5xl font-black mt-2">
            {portfolio.goldBalance.toFixed(3)} g
          </h2>

          <div className="mt-5 flex flex-wrap gap-6">
            <div>
              <p className="text-sm">Current Value</p>
              <h3 className="text-3xl font-black">
                ${currentValue.toFixed(2)}
              </h3>
            </div>

            <div>
              <p className="text-sm">Current Gold Price</p>
              <h3 className="text-3xl font-black">
                ${portfolio.currentPrice.toFixed(2)}
              </h3>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-5">

          <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">
            <p className="text-zinc-400 text-sm">Average Buy Price</p>
            <h3 className="text-2xl font-black text-yellow-400">
              ${portfolio.averageBuyPrice.toFixed(2)}
            </h3>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">
            <p className="text-zinc-400 text-sm">Total Invested</p>
            <h3 className="text-2xl font-black text-blue-400">
              ${portfolio.totalInvested.toFixed(2)}
            </h3>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">
            <p className="text-zinc-400 text-sm">Total Sold</p>
            <h3 className="text-2xl font-black text-red-400">
              ${portfolio.totalSold.toFixed(2)}
            </h3>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800">
            <p className="text-zinc-400 text-sm">Profit / Loss</p>

            <h3
              className={`text-2xl font-black ${
                profit >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              ${profit.toFixed(2)}
            </h3>

            <p
              className={`text-sm ${
                profit >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {profitPercent.toFixed(2)}%
            </p>
          </div>

        </div>

        {/* Portfolio Progress */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
          <div className="flex justify-between mb-3">
            <span>Gold Holdings</span>
            <span>{portfolio.goldBalance.toFixed(2)} / 100 g</span>
          </div>

          <div className="w-full bg-zinc-800 rounded-full h-4 overflow-hidden">
            <div
              className="bg-yellow-500 h-4 rounded-full"
              style={{
                width: `${Math.min(portfolio.goldBalance, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Investment Overview */}
        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 space-y-4">
            <h2 className="text-xl font-bold text-yellow-400">
              Investment Overview
            </h2>

            <div className="flex justify-between">
              <span className="text-zinc-400">Gold Owned</span>
              <span>{portfolio.goldBalance.toFixed(3)} g</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Market Price</span>
              <span>${portfolio.currentPrice.toFixed(2)} / g</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Average Cost</span>
              <span>${portfolio.averageBuyPrice.toFixed(2)} / g</span>
            </div>

            <div className="flex justify-between font-bold text-lg">
              <span>Portfolio Value</span>
              <span className="text-green-400">
                ${currentValue.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 space-y-4">
            <h2 className="text-xl font-bold text-yellow-400">
              Performance
            </h2>

            <div className="flex justify-between">
              <span className="text-zinc-400">Invested Amount</span>
              <span>${portfolio.totalInvested.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Sold Amount</span>
              <span>${portfolio.totalSold.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Net Profit</span>

              <span
                className={
                  profit >= 0 ? "text-green-400" : "text-red-400"
                }
              >
                ${profit.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-400">Return %</span>

              <span
                className={
                  profit >= 0 ? "text-green-400" : "text-red-400"
                }
              >
                {profitPercent.toFixed(2)}%
              </span>
            </div>
          </div>

        </div>

        {/* Recent Transactions */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-5">
            Recent Transactions
          </h2>

          <div className="space-y-4">
            {portfolio.transactions.map((tx) => (
              <div
                key={tx._id}
                className="flex justify-between items-center bg-zinc-800 rounded-2xl p-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tx.type === "BUY"
                          ? "bg-yellow-500 text-black"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {tx.type}
                    </span>

                    <span className="text-zinc-300 text-sm">
                      #{tx._id}
                    </span>
                  </div>

                  <p className="text-zinc-500 text-sm mt-1">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-lg">
                    {tx.grams.toFixed(3)} g
                  </p>

                  <p className="text-green-400">
                    ${tx.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GoldPortfolio;
