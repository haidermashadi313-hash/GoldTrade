"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  History,
  DollarSign,
  LogOut,
  User,
} from "lucide-react";

const API = "http://localhost:5000";

// ===============================
// TYPES
// ===============================
interface UserData {
  _id: string;
  username: string;
  email: string;
  walletBalance: number;
  usdtBalance: number;
  goldBalance: number;
  goldAveragePrice: number;
  goldProfitLoss: number;
  totalDeposit: number;
  totalWithdraw: number;
}

interface MarketData {
  goldPriceUSD: number;
  usdToPkr: number;
  usdtRate: number;
  buyGoldPrice: number;
  sellGoldPrice: number;
  goldSpread: number;
  goldTradingEnabled: boolean;
}

interface TradeHistory {
  _id: string;
  tradeType: "BUY" | "SELL";
  grams: number;
  totalPKR: number;
  pricePerGram: number;
  createdAt: string;
}

interface Transaction {
  _id: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
  reason: string;
}

export default function DashboardPage() {
  // ===============================
  // STATES
  // ===============================

  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<UserData>({
    _id: "",
    username: "",
    email: "",
    walletBalance: 0,
    usdtBalance: 0,
    goldBalance: 0,
    goldAveragePrice: 0,
    goldProfitLoss: 0,
    totalDeposit: 0,
    totalWithdraw: 0,
  });

  const [market, setMarket] = useState<MarketData>({
    goldPriceUSD: 0,
    usdToPkr: 0,
    usdtRate: 0,
    buyGoldPrice: 0,
    sellGoldPrice: 0,
    goldSpread: 0,
    goldTradingEnabled: true,
  });

  const [goldHistory, setGoldHistory] = useState<TradeHistory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [lastUpdate, setLastUpdate] = useState("");

  // ===============================
  // LOAD DATA
  // ===============================

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const username = localStorage.getItem("username");

      if (!username) {
        window.location.href = "/login";
        return;
      }

      const [
        userRes,
        marketRes,
        goldRes,
        transactionRes,
      ] = await Promise.all([
        fetch(`${API}/api/users/${username}`),
        fetch(`${API}/api/settings/market`),
        fetch(`${API}/api/gold/history/${username}`),
        fetch(`${API}/api/transactions/${username}`),
      ]);

      const userData = await userRes.json();
      const marketData = await marketRes.json();
      const goldData = await goldRes.json();
      const transactionData = await transactionRes.json();

      if (userData.success) setUser(userData.data);
      if (marketData.success) setMarket(marketData.data);
      if (goldData.success) setGoldHistory(goldData.data);
      if (transactionData.success)
        setTransactions(transactionData.data);

      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error(error);
      alert("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 15000);

    return () => clearInterval(interval);
  }, []);

  // ===============================
  // LIVE CALCULATIONS
  // ===============================

  const portfolioValue = useMemo(() => {
    return user.goldBalance * market.sellGoldPrice;
  }, [user.goldBalance, market.sellGoldPrice]);

  const liveProfit = useMemo(() => {
    return (
      (market.sellGoldPrice - user.goldAveragePrice) *
      user.goldBalance
    );
  }, [market.sellGoldPrice, user]);

  const totalAssets = useMemo(() => {
    return (
      user.walletBalance +
      portfolioValue +
      user.usdtBalance * market.usdtRate
    );
  }, [portfolioValue, user, market]);

  // ===============================
  // LOGOUT
  // ===============================

  const logout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // ===============================
  // LOADING
  // ===============================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" />
        Loading GoldTrade Dashboard...
      </main>
    );
  }

  // ===============================
  // UI
  // ===============================

  return (
    <main className="min-h-screen bg-black text-white">

      {/* HEADER */}

      <div className="sticky top-0 z-50 bg-zinc-950 border-b border-yellow-500">

        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <div>
            <h1 className="text-3xl font-bold text-yellow-400">
              GoldTrade
            </h1>

            <p className="text-gray-400 text-sm">
              Welcome back, {user.username}
            </p>
          </div>

          <div className="flex gap-3">

            <button
              onClick={loadDashboard}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>

        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* LIVE GOLD MARKET */}

        <section className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400 rounded-3xl p-8 text-black mb-10 shadow-lg">

          <div className="flex justify-between items-center">

            <div>

              <p className="font-semibold tracking-widest">
                LIVE GOLD MARKET
              </p>

              <h2 className="text-5xl font-bold mt-2">
                ${market.goldPriceUSD.toFixed(2)}
              </h2>

              <p className="mt-3 text-lg">
                USD/PKR : {market.usdToPkr}
              </p>

              <p className="text-sm mt-2">
                Last Updated : {lastUpdate}
              </p>

            </div>

            <Coins size={80} />

          </div>

          <div className="grid md:grid-cols-3 gap-5 mt-8">

            <div className="bg-green-700 rounded-2xl p-5 text-white">

              <p className="text-sm">BUY GOLD</p>

              <h3 className="text-3xl font-bold mt-2">
                PKR {market.buyGoldPrice.toLocaleString()}
              </h3>

            </div>

            <div className="bg-red-700 rounded-2xl p-5 text-white">

              <p className="text-sm">SELL GOLD</p>

              <h3 className="text-3xl font-bold mt-2">
                PKR {market.sellGoldPrice.toLocaleString()}
              </h3>

            </div>

            <div className="bg-zinc-900 rounded-2xl p-5 text-yellow-300">

              <p className="text-sm">USDT RATE</p>

              <h3 className="text-3xl font-bold mt-2">
                PKR {market.usdtRate}
              </h3>

            </div>

          </div>

        </section>

        {/* WALLET CARDS */}

        <section className="grid md:grid-cols-4 gap-5 mb-10">

          <DashboardCard
            title="PKR Wallet"
            value={`PKR ${user.walletBalance.toLocaleString()}`}
            color="green"
            icon={<Wallet size={28} />}
          />

          <DashboardCard
            title="USDT Wallet"
            value={`${user.usdtBalance.toFixed(2)} USDT`}
            color="cyan"
            icon={<DollarSign size={28} />}
          />

          <DashboardCard
            title="Gold Holdings"
            value={`${user.goldBalance.toFixed(2)} g`}
            color="yellow"
            icon={<Coins size={28} />}
          />

          <DashboardCard
            title="Total Assets"
            value={`PKR ${totalAssets.toLocaleString(undefined,{
              maximumFractionDigits:0
            })}`}
            color="purple"
            icon={<TrendingUp size={28} />}
          />

        </section>

        {/* PORTFOLIO */}

        <section className="grid md:grid-cols-3 gap-6 mb-10">

          <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-6">

            <p className="text-gray-400 mb-2">
              Portfolio Value
            </p>

            <h2 className="text-4xl font-bold text-yellow-400">
              PKR {portfolioValue.toLocaleString(undefined,{
                maximumFractionDigits:0
              })}
            </h2>

          </div>

          <div className="bg-zinc-900 rounded-3xl border border-green-600 p-6">

            <p className="text-gray-400 mb-2">
              Average Buy Price
            </p>

            <h2 className="text-4xl font-bold text-green-400">
              PKR {user.goldAveragePrice.toLocaleString()}
            </h2>

          </div>

          <div className={`rounded-3xl p-6 border ${
            liveProfit >=0
              ? "bg-green-950 border-green-600"
              : "bg-red-950 border-red-600"
          }`}>

            <p className="text-gray-300 mb-2">
              Live Profit / Loss
            </p>

            <h2 className={`text-4xl font-bold ${
              liveProfit >=0
                ? "text-green-400"
                : "text-red-400"
            }`}>
              PKR {liveProfit.toLocaleString(undefined,{
                maximumFractionDigits:0
              })}
            </h2>

            <div className="mt-3 flex items-center gap-2">

              {liveProfit >=0 ? (
                <ArrowUpCircle className="text-green-400" />
              ) : (
                <ArrowDownCircle className="text-red-400" />
              )}

              <span>
                {liveProfit >=0 ? "Profit" : "Loss"}
              </span>

            </div>

          </div>

        </section>
                {/* QUICK ACTION BUTTONS */}

        <section className="grid md:grid-cols-4 gap-4 mb-10">

          <button
            onClick={() => (window.location.href = "/gold")}
            className="bg-yellow-500 hover:bg-yellow-400 text-black rounded-2xl p-5 font-bold flex items-center justify-center gap-3"
          >
            <Coins size={24} />
            Buy / Sell Gold
          </button>

          <button
            onClick={() => (window.location.href = "/deposit")}
            className="bg-green-600 hover:bg-green-500 rounded-2xl p-5 font-bold flex items-center justify-center gap-3"
          >
            <ArrowDownCircle size={24} />
            Deposit
          </button>

          <button
            onClick={() => (window.location.href = "/withdraw")}
            className="bg-red-600 hover:bg-red-500 rounded-2xl p-5 font-bold flex items-center justify-center gap-3"
          >
            <ArrowUpCircle size={24} />
            Withdraw
          </button>

          <button
            onClick={() => (window.location.href = "/transactions")}
            className="bg-blue-700 hover:bg-blue-600 rounded-2xl p-5 font-bold flex items-center justify-center gap-3"
          >
            <History size={24} />
            History
          </button>

        </section>

        {/* GOLD TRADE HISTORY */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold text-yellow-400">
              Recent Gold Trades
            </h2>

            <Coins className="text-yellow-400" />
          </div>

          {goldHistory.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No Gold Trades Yet
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="border-b border-yellow-600 text-yellow-400">

                  <tr className="text-left">

                    <th className="py-3">Type</th>
                    <th>Grams</th>
                    <th>Price/Gram</th>
                    <th>Total PKR</th>
                    <th>Date</th>

                  </tr>

                </thead>

                <tbody>

                  {goldHistory.slice(0, 8).map((trade) => (

                    <tr
                      key={trade._id}
                      className="border-b border-zinc-800 hover:bg-zinc-800"
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

                      <td>{trade.grams} g</td>

                      <td>
                        PKR{" "}
                        {trade.pricePerGram.toLocaleString()}
                      </td>

                      <td>
                        PKR{" "}
                        {trade.totalPKR.toLocaleString()}
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

        </section>

        {/* TRANSACTION HISTORY */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex justify-between items-center mb-5">

            <h2 className="text-2xl font-bold text-yellow-400">
              Recent Transactions
            </h2>

            <History className="text-yellow-400" />

          </div>

          {transactions.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No Transactions Available
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="border-b border-yellow-600 text-yellow-400">

                  <tr className="text-left">

                    <th className="py-3">Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Reason</th>
                    <th>Date</th>

                  </tr>

                </thead>

                <tbody>

                  {transactions.slice(0, 10).map((tx) => (

                    <tr
                      key={tx._id}
                      className="border-b border-zinc-800 hover:bg-zinc-800"
                    >

                      <td className="py-4">{tx.type}</td>

                      <td>
                        PKR{" "}
                        {Number(tx.amount).toLocaleString()}
                      </td>

                      <td>

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold ${
                            tx.status === "Completed" ||
                            tx.status === "Credit"
                              ? "bg-green-700 text-white"
                              : tx.status === "Pending"
                              ? "bg-yellow-600 text-black"
                              : "bg-red-700 text-white"
                          }`}
                        >
                          {tx.status}
                        </span>

                      </td>

                      <td className="max-w-[250px] truncate">
                        {tx.reason || "-"}
                      </td>

                      <td>
                        {new Date(
                          tx.createdAt
                        ).toLocaleString()}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ACCOUNT SUMMARY */}

        <section className="grid md:grid-cols-3 gap-6 mb-12">

          <div className="bg-zinc-900 rounded-3xl border border-green-600 p-6">

            <p className="text-gray-400">Total Deposit</p>

            <h2 className="text-3xl font-bold text-green-400 mt-2">
              PKR{" "}
              {user.totalDeposit.toLocaleString()}
            </h2>

          </div>

          <div className="bg-zinc-900 rounded-3xl border border-red-600 p-6">

            <p className="text-gray-400">Total Withdraw</p>

            <h2 className="text-3xl font-bold text-red-400 mt-2">
              PKR{" "}
              {user.totalWithdraw.toLocaleString()}
            </h2>

          </div>

          <div className="bg-zinc-900 rounded-3xl border border-cyan-600 p-6">

            <p className="text-gray-400">Total Gold Profit</p>

            <h2
              className={`text-3xl font-bold mt-2 ${
                user.goldProfitLoss >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              PKR{" "}
              {user.goldProfitLoss.toLocaleString()}
            </h2>

          </div>

        </section>

      </div>
    </main>
  );
}

/* ===========================================================
   REUSABLE CARD COMPONENT
=========================================================== */

type CardColor =
  | "green"
  | "yellow"
  | "cyan"
  | "purple";

interface DashboardCardProps {
  title: string;
  value: string;
  color: CardColor;
  icon: React.ReactNode;
}

function DashboardCard({
  title,
  value,
  color,
  icon,
}: DashboardCardProps) {
  const borderColor =
    color === "green"
      ? "border-green-600 text-green-400"
      : color === "yellow"
      ? "border-yellow-500 text-yellow-400"
      : color === "cyan"
      ? "border-cyan-500 text-cyan-400"
      : "border-purple-500 text-purple-400";

  return (
    <div
      className={`bg-zinc-900 rounded-3xl border ${borderColor} p-5`}
    >
      <div className="flex justify-between items-center mb-4">
        {icon}
      </div>

      <p className="text-gray-400 text-sm">{title}</p>

      <h3 className="text-2xl font-bold mt-2 break-words">
        {value}
      </h3>
    </div>
  );
}