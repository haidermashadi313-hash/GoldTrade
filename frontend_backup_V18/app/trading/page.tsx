"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  DollarSign,
  Activity,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Flame,
  Search,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

/* ==========================================================
   TYPES
========================================================== */

interface WalletData {
  walletBalance: number;
  goldBalance: number;
  usdtBalance: number;
}

interface MarketData {
  livePrice: number;
  buyPrice: number;
  sellPrice: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  change24h: number;
}

interface TradeHistory {
  _id: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  total: number;
  createdAt: string;
}

/* ==========================================================
   COMPONENT START
========================================================== */

export default function TradingPage() {

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  /* ================= STATES ================= */

  const [loading, setLoading] = useState(true);

  const [wallet, setWallet] = useState<WalletData>({
    walletBalance: 0,
    goldBalance: 0,
    usdtBalance: 0,
  });

  const [market, setMarket] = useState<MarketData>({
    livePrice: 35000,
    buyPrice: 35200,
    sellPrice: 34850,
    high24h: 35650,
    low24h: 34420,
    volume24h: 1250,
    change24h: 2.15,
  });

  const [tradeHistory, setTradeHistory] =
    useState<TradeHistory[]>([]);

  const [quantity, setQuantity] = useState("");
  const [tradeLoading, setTradeLoading] = useState(false);
  const [confirmTrade, setConfirmTrade] = useState(false);
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");

  const [marketPrice, setMarketPrice] = useState(35000);

  /* ==========================================================
     LOAD MARKET & WALLET
  ========================================================== */

  const loadTradingDashboard = async () => {
    try {
      setLoading(true);

      const walletRes = await fetch(`${API}/api/wallet/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const walletData = await walletRes.json();

      if (walletData.success) {
        setWallet(walletData.wallet);
      }

      const marketRes = await fetch(`${API}/api/trading/market`);

      const marketData = await marketRes.json();

      if (marketData.success) {
        setMarket(marketData.market);
        setMarketPrice(marketData.market.livePrice);
      }

      const historyRes = await fetch(`${API}/api/trading/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const historyData = await historyRes.json();

      if (historyData.success) {
        setTradeHistory(historyData.history);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadTradingDashboard();
    }
  }, [token]);

  /* ==========================================================
     CALCULATIONS
  ========================================================== */

  const totalCost = useMemo(() => {
    if (!quantity) return 0;

    return Number(quantity) * market.buyPrice;
  }, [quantity, market.buyPrice]);

  const totalSell = useMemo(() => {
    if (!quantity) return 0;

    return Number(quantity) * market.sellPrice;
  }, [quantity, market.sellPrice]);

  const portfolioValue = useMemo(() => {
    return (
      wallet.walletBalance +
      wallet.goldBalance * market.livePrice +
      wallet.usdtBalance * 285
    );
  }, [wallet, market]);

  const marketTrend = useMemo(() => {
    const points: { price: number; hour: string }[] = [];
    const now = new Date();

    for (let index = 0; index < 24; index++) {
      const hour = new Date(now);
      hour.setHours(now.getHours() - 23 + index, 0, 0, 0);
      const progress = index / 23;
      const price =
        market.low24h +
        (market.high24h - market.low24h) * progress * 0.75 +
        Math.sin(index * 1.7) * market.livePrice * 0.012;

      points.push({
        price: index === 23 ? market.livePrice : price,
        hour: `${String(hour.getHours()).padStart(2, "0")}:00`,
      });
    }

    return points;
  }, [market]);

  const lowestPoint = Math.min(...marketTrend.map((point) => point.price));
  const highestPoint = Math.max(...marketTrend.map((point) => point.price));

  /* ==========================================================
     SEARCH HISTORY
  ========================================================== */

  const [historySearch, setHistorySearch] = useState("");

  const filteredHistory = useMemo(() => {
    const search = historySearch.toLowerCase();

    return tradeHistory.filter((trade) =>
      trade.type.toLowerCase().includes(search) ||
      trade.price.toString().includes(search) ||
      trade.quantity.toString().includes(search)
    );
  }, [tradeHistory, historySearch]);

  /* ==========================================================
     PROFIT / LOSS CALCULATIONS
  ========================================================== */

  const profitLoss = useMemo(() => {
    const currentGoldValue = wallet.goldBalance * market.livePrice;
    const investedValue = wallet.goldBalance * market.buyPrice;
    const profit = currentGoldValue - investedValue;

    return {
      currentGoldValue,
      investedValue,
      profit,
      percent:
        investedValue === 0
          ? 0
          : Number(((profit / investedValue) * 100).toFixed(2)),
    };
  }, [wallet.goldBalance, market]);

  /* ==========================================================
     BUY GOLD
  ========================================================== */

  const buyGold = async () => {
    if (!quantity) return alert("Enter Gold Quantity.");

    try {
      setTradeLoading(true);

      const response = await fetch(
        `${API}/api/trading/buy`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: Number(quantity),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Gold Purchased Successfully.");
        setQuantity("");
        loadTradingDashboard();
      }

    } finally {
      setTradeLoading(false);
    }
  };

  /* ==========================================================
     SELL GOLD
  ========================================================== */

  const sellGold = async () => {
    if (!quantity) return alert("Enter Gold Quantity.");

    try {
      setTradeLoading(true);

      const response = await fetch(
        `${API}/api/trading/sell`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity: Number(quantity),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Gold Sold Successfully.");
        setQuantity("");
        loadTradingDashboard();
      }

    } finally {
      setTradeLoading(false);
    }
  };

  const confirmTradeAction = async () => {
    setConfirmTrade(false);

    if (tradeType === "BUY") {
      await buyGold();
    } else {
      await sellGold();
    }
  };

  /* ==========================================================
     LOADING SCREEN
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3"/>
        Loading Gold Market...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto">

        {/* ================= HEADER ================= */}

        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">

          <div>

            <h1 className="text-5xl font-black text-yellow-400 flex items-center gap-3">
              <Flame size={42}/>
              Gold Trading Market
            </h1>

            <p className="text-gray-400 mt-2">
              Buy • Sell • Live Gold Price
            </p>

          </div>

          <button
            onClick={loadTradingDashboard}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl font-bold flex items-center gap-2"
          >
            <RefreshCw size={18}/>
            Refresh Market
          </button>

        </div>

        {/* ================= WALLET CARDS ================= */}

        <div className="grid md:grid-cols-3 gap-5 mb-10">

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

            <Wallet className="text-yellow-400 mb-3"/>

            <p className="text-gray-400 text-sm">PKR Wallet</p>

            <h2 className="text-3xl font-black text-yellow-400 mt-2">
              PKR {wallet.walletBalance.toLocaleString()}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

            <Coins className="text-green-400 mb-3"/>

            <p className="text-gray-400 text-sm">Gold Balance</p>

            <h2 className="text-3xl font-black text-green-400 mt-2">
              {wallet.goldBalance.toFixed(4)} g
            </h2>

          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6">

            <DollarSign className="text-cyan-400 mb-3"/>

            <p className="text-gray-400 text-sm">USDT Balance</p>

            <h2 className="text-3xl font-black text-cyan-400 mt-2">
              {wallet.usdtBalance.toFixed(2)} USDT
            </h2>

          </div>

        </div>

        {/* ================= LIVE MARKET ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6">

            <div>

              <h2 className="text-3xl font-black text-yellow-400">
                Live Gold Market
              </h2>

              <p className="text-gray-400">
                Updated Every Refresh
              </p>

            </div>

            <div className="bg-green-600 px-4 py-2 rounded-full font-bold flex items-center gap-2">
              <Activity size={18}/>
              LIVE
            </div>

          </div>

          <div className="grid md:grid-cols-4 gap-5">

            <div className="bg-black border border-yellow-500 rounded-2xl p-5 text-center">
              <p className="text-gray-400 text-sm">Live Price</p>

              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                PKR {market.livePrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-green-600 rounded-2xl p-5 text-center">
              <ArrowUpRight className="mx-auto text-green-400 mb-2"/>
              <p className="text-gray-400 text-sm">Buy Price</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR {market.buyPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-red-600 rounded-2xl p-5 text-center">
              <ArrowDownRight className="mx-auto text-red-400 mb-2"/>
              <p className="text-gray-400 text-sm">Sell Price</p>

              <h3 className="text-3xl font-black text-red-400 mt-2">
                PKR {market.sellPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-cyan-600 rounded-2xl p-5 text-center">
              {market.change24h >= 0 ? (
                <TrendingUp className="mx-auto text-green-400 mb-2"/>
              ) : (
                <TrendingDown className="mx-auto text-red-400 mb-2"/>
              )}

              <p className="text-gray-400 text-sm">24H Change</p>

              <h3
                className={`text-3xl font-black mt-2 ${
                  market.change24h >= 0
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {market.change24h}%
              </h3>
            </div>

          </div>

        </div>

        {/* ================= BUY / SELL CALCULATOR ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">

            <Calculator className="text-yellow-400"/>

            <h2 className="text-3xl font-black text-yellow-400">
              Buy / Sell Calculator
            </h2>

          </div>

          <label className="text-gray-400 text-sm">
            Gold Quantity (Gram)
          </label>

          <input
            type="number"
            placeholder="Example: 2.5"
            value={quantity}
            onChange={(e)=>setQuantity(e.target.value)}
            className="w-full bg-black border border-yellow-500 rounded-xl p-4 mt-2 text-xl"
          />

          <div className="grid md:grid-cols-2 gap-5 mt-6">

            <div className="bg-black border border-green-600 rounded-2xl p-5">
              <p className="text-gray-400 text-sm">Buy Total</p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                PKR {totalCost.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-red-600 rounded-2xl p-5">
              <p className="text-gray-400 text-sm">Sell Total</p>

              <h3 className="text-3xl font-black text-red-400 mt-2">
                PKR {totalSell.toLocaleString()}
              </h3>
            </div>

          </div>

          <div className="flex gap-4 mt-8">

            <button
              disabled={tradeLoading}
              onClick={buyGold}
              className="flex-1 bg-green-600 hover:bg-green-500 py-4 rounded-xl font-black text-lg"
            >
              Buy Gold
            </button>

            <button
              disabled={tradeLoading}
              onClick={sellGold}
              className="flex-1 bg-red-600 hover:bg-red-500 py-4 rounded-xl font-black text-lg"
            >
              Sell Gold
            </button>

          </div>

        </div>

        {/* ================= MARKET STATISTICS ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-cyan-400" />

            <h2 className="text-3xl font-black text-cyan-400">
              Market Statistics
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-5">

            <div className="bg-black border border-green-600 rounded-2xl p-5 text-center">
              <TrendingUp className="mx-auto text-green-400 mb-3" />

              <p className="text-gray-400 text-sm">24H High</p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {market.high24h.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-red-600 rounded-2xl p-5 text-center">
              <TrendingDown className="mx-auto text-red-400 mb-3" />

              <p className="text-gray-400 text-sm">24H Low</p>

              <h3 className="text-2xl font-black text-red-400 mt-2">
                PKR {market.low24h.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-blue-600 rounded-2xl p-5 text-center">
              <Coins className="mx-auto text-blue-400 mb-3" />
              <h3 className="text-2xl font-black text-blue-400 mt-2">
                {market.volume24h.toLocaleString()} g
              </h3>
            </div>

            <div className="bg-black border border-yellow-500 rounded-2xl p-5 text-center">
              <DollarSign className="mx-auto text-yellow-400 mb-3" />

              <p className="text-gray-400 text-sm">Current Spread</p>

              <h3 className="text-2xl font-black text-yellow-400 mt-2">
                PKR {(market.buyPrice - market.sellPrice).toLocaleString()}
              </h3>
            </div>

          </div>

        </div>

        {/* ================= LIVE PRICE TREND CHART ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6">

            <div>
              <h2 className="text-3xl font-black text-yellow-400">
                Live Gold Price Trend
              </h2>

              <p className="text-gray-400">
                Last 24 Hours Price Movement
              </p>
            </div>

            <span className="bg-green-600 px-4 py-2 rounded-full font-bold">
              LIVE
            </span>

          </div>

          <div className="bg-black rounded-3xl p-6 overflow-x-auto">

            <div className="flex items-end gap-2 h-64 min-w-[800px]">

              {marketTrend.map((point, index) => {
                const range = highestPoint - lowestPoint;
                const height = range === 0
                  ? 100
                  : ((point.price - lowestPoint) / range) * 200;

                return (
                  <div
                    key={index}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={`w-4 rounded-full ${
                        point.price >= market.livePrice
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                      style={{
                        height: `${height + 20}px`,
                      }}
                    />

                    <span className="text-[10px] text-gray-500">
                      {point.hour}
                    </span>
                  </div>
                );
              })}

            </div>

          </div>

          <div className="grid md:grid-cols-3 gap-5 mt-6">

            <div className="bg-black border border-green-600 rounded-2xl p-5 text-center">
              <p className="text-gray-400 text-sm">Highest Today</p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {highestPoint.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-red-600 rounded-2xl p-5 text-center">
              <p className="text-gray-400 text-sm">Lowest Today</p>

              <h3 className="text-2xl font-black text-red-400 mt-2">
                PKR {lowestPoint.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-cyan-600 rounded-2xl p-5 text-center">
              <p className="text-gray-400 text-sm">Current Market Price</p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                PKR {market.livePrice.toLocaleString()}
              </h3>
            </div>

          </div>

        </div>

        {/* ================= BUY / SELL CONFIRMATION MODAL ================= */}

        {confirmTrade && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-6">

            <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 w-full max-w-md">

              <h2 className="text-3xl font-black text-yellow-400 mb-6 text-center">
                Confirm {tradeType === "BUY" ? "Buy" : "Sell"} Gold
              </h2>

              <div className="space-y-4 mb-6">

                <div className="bg-black border border-zinc-700 rounded-xl p-4 flex justify-between">
                  <span className="text-gray-400">Quantity</span>
                  <span className="font-bold text-white">{quantity} g</span>
                </div>

                <div className="bg-black border border-zinc-700 rounded-xl p-4 flex justify-between">
                  <span className="text-gray-400">Price / Gram</span>

                  <span className="font-bold text-yellow-400">
                    PKR{" "}
                    {tradeType === "BUY"
                      ? market.buyPrice.toLocaleString()
                      : market.sellPrice.toLocaleString()}
                  </span>
                </div>

                <div className="bg-black border border-zinc-700 rounded-xl p-4 flex justify-between">
                  <span className="text-gray-400">Total Amount</span>

                  <span className="font-black text-green-400 text-xl">
                    PKR{" "}
                    {tradeType === "BUY"
                      ? totalCost.toLocaleString()
                      : totalSell.toLocaleString()}
                  </span>
                </div>

              </div>

              <div className="flex gap-3">

                <button
                  onClick={() => setConfirmTrade(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold"
                >
                  Cancel
                </button>

                <button
                  disabled={tradeLoading}
                  onClick={confirmTradeAction}
                  className={`flex-1 py-3 rounded-xl font-black ${
                    tradeType === "BUY"
                      ? "bg-green-600 hover:bg-green-500"
                      : "bg-red-600 hover:bg-red-500"
                  }`}
                >
                  {tradeType === "BUY"
                    ? "Confirm Buy"
                    : "Confirm Sell"}
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ================= TRADING HISTORY ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

            <div>
              <h2 className="text-3xl font-black text-blue-400">
                Trading History
              </h2>

              <p className="text-gray-400">
                Buy & Sell Transactions
              </p>
            </div>

            <span className="bg-blue-600 px-4 py-2 rounded-full font-bold">
              {tradeHistory.length} Trades
            </span>

          </div>

          <div className="relative mb-6">

            <Search className="absolute left-4 top-4 text-gray-500"/>

            <input
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              placeholder="Search Buy / Sell / Quantity..."
              className="w-full bg-black border border-blue-600 rounded-xl py-3 pl-12 pr-4 text-white"
            />

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-black text-blue-400">

                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Date</th>
                </tr>

              </thead>

              <tbody>

                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      No Trading History
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((trade) => (
                    <tr
                      key={trade._id}
                      className="border-b border-zinc-800 hover:bg-black"
                    >
                      <td className="p-3">
                        {trade.type === "BUY" ? (
                          <span className="bg-green-600 px-3 py-1 rounded-full text-xs font-bold">
                            BUY
                          </span>
                        ) : (
                          <span className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold">
                            SELL
                          </span>
                        )}
                      </td>

                      <td className="p-3 font-bold">
                        {trade.quantity} g
                      </td>

                      <td className="p-3 text-yellow-400 font-bold">
                        PKR {trade.price.toLocaleString()}
                      </td>

                      <td className="p-3 text-cyan-400 font-bold">
                        PKR {trade.total.toLocaleString()}
                      </td>

                      <td className="p-3 text-gray-400 text-sm">
                        {new Date(trade.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

        </div>

        {/* ================= PROFIT & LOSS CARDS ================= */}

        <div className="grid md:grid-cols-3 gap-5 mb-10">

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

            <TrendingUp className="text-green-400 mb-3"/>

            <p className="text-gray-400 text-sm">
              Current Gold Value
            </p>

            <h3 className="text-3xl font-black text-green-400 mt-2">
              PKR {profitLoss.currentGoldValue.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

            <Coins className="text-yellow-400 mb-3"/>

            <p className="text-gray-400 text-sm">
              Invested Value
            </p>

            <h3 className="text-3xl font-black text-yellow-400 mt-2">
              PKR {profitLoss.investedValue.toLocaleString()}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6">

            <DollarSign className="text-cyan-400 mb-3"/>

            <p className="text-gray-400 text-sm">
              Profit / Loss
            </p>

            <h3
              className={`text-3xl font-black mt-2 ${
                profitLoss.profit >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              PKR {profitLoss.profit.toLocaleString()}
            </h3>

            <p
              className={`mt-3 font-bold ${
                profitLoss.profit >= 0
                  ? "text-green-300"
                  : "text-red-300"
              }`}
            >
              {profitLoss.percent}%
            </p>

          </div>

        </div>

        {/* ================= RECENT ACTIVITY ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <h2 className="text-3xl font-black text-purple-400 mb-6">
            Recent Trading Activity
          </h2>

          <div className="space-y-4">

            {tradeHistory.slice(0, 5).map((trade) => (
              <div
                key={trade._id}
                className="bg-black border border-zinc-700 rounded-xl p-4 flex justify-between items-center"
              >
                <div>

                  <p className="font-bold text-white">
                    {trade.type === "BUY" ? "Bought Gold" : "Sold Gold"}
                  </p>

                  <p className="text-gray-500 text-sm">
                    {trade.quantity} Gram
                  </p>

                </div>

                <div className="text-right">

                  <p
                    className={`font-bold ${
                      trade.type === "BUY"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    PKR {trade.total.toLocaleString()}
                  </p>

                  <p className="text-gray-500 text-xs">
                    {new Date(trade.createdAt).toLocaleString()}
                  </p>

                </div>

              </div>
            ))}

          </div>

        </div>

        {/* ================= MARKET INSIGHTS ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <h2 className="text-3xl font-black text-yellow-400 mb-6">
            Gold Market Insights
          </h2>

          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-black border border-green-600 rounded-2xl p-5">
              <p className="text-gray-400 text-sm">
                Best Buy Price Today
              </p>

              <h3 className="text-2xl font-black text-green-400 mt-2">
                PKR {market.buyPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-red-600 rounded-2xl p-5">
              <p className="text-gray-400 text-sm">
                Best Sell Price Today
              </p>

              <h3 className="text-2xl font-black text-red-400 mt-2">
                PKR {market.sellPrice.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-cyan-600 rounded-2xl p-5">
              <p className="text-gray-400 text-sm">
                Highest Price Today
              </p>

              <h3 className="text-2xl font-black text-cyan-400 mt-2">
                PKR {market.high24h.toLocaleString()}
              </h3>
            </div>

            <div className="bg-black border border-orange-500 rounded-2xl p-5">
              <p className="text-gray-400 text-sm">
                Lowest Price Today
              </p>

              <h3 className="text-2xl font-black text-orange-400 mt-2">
                PKR {market.low24h.toLocaleString()}
              </h3>
            </div>

          </div>

        </div>

        {/* ================= FOOTER ================= */}

        <footer className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-6">

          <div className="grid md:grid-cols-3 gap-6">

            <div>

              <h3 className="text-xl font-black text-yellow-400">
                GoldTrade Market
              </h3>

              <p className="text-gray-400 mt-2">
                Buy • Sell • Live Gold Trading Platform
              </p>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                Last Market Refresh
              </p>

              <p className="text-cyan-400 font-bold mt-2">
                {new Date().toLocaleString()}
              </p>

            </div>

            <div className="text-right">

              <p className="text-gray-400 text-sm">
                Version
              </p>

              <p className="text-green-400 font-black text-xl mt-2">
                GoldTrade V17 Enterprise
              </p>

            </div>

          </div>

          <div className="border-t border-zinc-700 mt-6 pt-4 text-center text-gray-500 text-sm">
            © 2026 GoldTrade international — Live Trading Dashboard
          </div>

        </footer>

      </div>
    </main>
  );
}