"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface GoldPriceAPI {
  buyPrice: number;
  sellPrice: number;
  tradingEnabled: boolean;
  marketStatus: string;
}

interface ChartPoint {
  time: string;
  buyPrice: number;
  sellPrice: number;
}

const GoldChart: React.FC = () => {
  const [market, setMarket] = useState<GoldPriceAPI>({
    buyPrice: 0,
    sellPrice: 0,
    tradingEnabled: false,
    marketStatus: "CLOSED",
  });

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // FETCH LIVE GOLD PRICE
  // ==========================================
  const fetchPrice = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/gold/price"
      );

      const data = res.data;

      setMarket(data);

      const now = new Date();

      const time = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setChartData((prev) => {
        const updated = [
          ...prev,
          {
            time,
            buyPrice: data.buyPrice,
            sellPrice: data.sellPrice,
          },
        ];

        // Keep only last 20 points
        return updated.slice(-20);
      });

      setLoading(false);
    } catch (err) {
      console.error("Gold Price Error:", err);
    }
  };

  // ==========================================
  // AUTO REFRESH EVERY 30 SECONDS
  // ==========================================
  useEffect(() => {
    fetchPrice();

    const interval = setInterval(fetchPrice, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-black text-yellow-400 rounded-3xl p-8 text-center font-bold text-xl">
        Loading Live Gold Market...
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mt-8">

      {/* HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <div>
          <h2 className="text-3xl font-black text-yellow-400">
            LIVE GOLD MARKET
          </h2>

          <p className="text-gray-400 mt-2">
            Auto Refresh Every 30 Seconds
          </p>
        </div>

        <button
          onClick={fetchPrice}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl transition"
        >
          Refresh Price
        </button>

      </div>

      {/* LIVE PRICE CARDS */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        <div className="bg-black rounded-2xl p-5 border border-green-500">
          <p className="text-gray-400 text-sm">BUY PRICE</p>

          <h3 className="text-3xl font-black text-green-400 mt-2">
            PKR {market.buyPrice.toLocaleString()}
          </h3>

          <p className="text-xs text-gray-500 mt-2">
            Per Gram
          </p>
        </div>

        <div className="bg-black rounded-2xl p-5 border border-red-500">
          <p className="text-gray-400 text-sm">SELL PRICE</p>

          <h3 className="text-3xl font-black text-red-400 mt-2">
            PKR {market.sellPrice.toLocaleString()}
          </h3>

          <p className="text-xs text-gray-500 mt-2">
            Per Gram
          </p>
        </div>

        <div className="bg-black rounded-2xl p-5 border border-blue-500">
          <p className="text-gray-400 text-sm">MARKET STATUS</p>

          <h3
            className={`text-3xl font-black mt-2 ${
              market.marketStatus === "OPEN"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {market.marketStatus}
          </h3>
        </div>

        <div className="bg-black rounded-2xl p-5 border border-yellow-500">
          <p className="text-gray-400 text-sm">TRADING</p>

          <h3
            className={`text-3xl font-black mt-2 ${
              market.tradingEnabled
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {market.tradingEnabled ? "LIVE" : "OFF"}
          </h3>
        </div>

      </div>

            {/* ================= LIVE PRICE CHART ================= */}

      <div className="bg-black rounded-3xl border border-zinc-700 p-5 mb-8">

        <h3 className="text-2xl font-black text-yellow-400 mb-5">
          Gold Buy vs Sell Price (Live)
        </h3>

        <div className="w-full h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#2e2e2e" strokeDasharray="3 3" />

              <XAxis
                dataKey="time"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
              />

              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                domain={["auto", "auto"]}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "1px solid #EAB308",
                  borderRadius: "12px",
                  color: "#fff",
                }}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="buyPrice"
                name="Buy Price"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />

              <Line
                type="monotone"
                dataKey="sellPrice"
                name="Sell Price"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ================= MARKET SUMMARY ================= */}

      <div className="grid md:grid-cols-2 gap-6">

        <div className="bg-black rounded-3xl border border-green-500 p-6">

          <h3 className="text-2xl font-black text-green-400 mb-4">
            Buy Market
          </h3>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span className="text-gray-400">Current Buy Price</span>

              <span className="text-green-400 font-bold text-xl">
                PKR {market.buyPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Market Status</span>

              <span className="text-green-400 font-bold">
                {market.marketStatus}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Trading</span>

              <span className="text-green-400 font-bold">
                {market.tradingEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

          </div>

        </div>

        <div className="bg-black rounded-3xl border border-red-500 p-6">

          <h3 className="text-2xl font-black text-red-400 mb-4">
            Sell Market
          </h3>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span className="text-gray-400">Current Sell Price</span>

              <span className="text-red-400 font-bold text-xl">
                PKR {market.sellPrice.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Spread</span>

              <span className="text-yellow-400 font-bold">
                PKR {(market.buyPrice - market.sellPrice).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Last Update</span>

              <span className="text-white font-bold">
                {chartData.length > 0
                  ? chartData[chartData.length - 1].time
                  : "--:--"}
              </span>
            </div>

          </div>

        </div>

      </div>

      {/* ================= GOLD MARKET INFO ================= */}

      <div className="mt-8 bg-zinc-800 rounded-3xl p-6 border border-yellow-500">

        <h3 className="text-2xl font-black text-yellow-400 mb-5">
          Gold Market Insights
        </h3>

        <div className="grid md:grid-cols-3 gap-5">

          <div className="bg-black rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-2">
              Live Buy Price
            </p>

            <h4 className="text-2xl font-black text-green-400">
              PKR {market.buyPrice.toLocaleString()}
            </h4>
          </div>

          <div className="bg-black rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-2">
              Live Sell Price
            </p>

            <h4 className="text-2xl font-black text-red-400">
              PKR {market.sellPrice.toLocaleString()}
            </h4>
          </div>

          <div className="bg-black rounded-xl p-5">
            <p className="text-gray-400 text-sm mb-2">
              Buy/Sell Difference
            </p>

            <h4 className="text-2xl font-black text-yellow-400">
              PKR {(market.buyPrice - market.sellPrice).toLocaleString()}
            </h4>
          </div>

        </div>

      </div>

      {/* ================= FOOTER ================= */}

      <div className="mt-12 border-t border-zinc-700 pt-6 text-center text-gray-500 text-sm">

        GoldTrade Enterprise V18 • Live Gold Price Chart

        <div className="mt-2">
          Auto Refresh Every <span className="text-yellow-400 font-bold">30 Seconds</span>
        </div>

      </div>

    </div>
  );
};

export default GoldChart;