"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Wallet,
  RefreshCcw,
  History,
  TrendingUp,
  TrendingDown,
  ArrowDownCircle,
  ArrowUpCircle,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export default function USDTHistoryPage() {
  const username =
    typeof window !== "undefined"
      ? localStorage.getItem("username") || ""
      : "";

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [lastUpdate, setLastUpdate] = useState("");

  const [buyHistory, setBuyHistory] = useState<any[]>([]);
  const [sellHistory, setSellHistory] = useState<any[]>([]);
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  const loadWallet = async () => {
    try {
      const response = await fetch(`${API}/api/users/${username}`, {
        method: "GET",
        headers,
      });

      const data = await response.json();

      if (data.success) {
        setWalletBalance(Number(data.data.walletBalance || 0));
      }
    } catch (error) {
      console.error("Wallet Error:", error);
    }
  };

  const loadBuyHistory = async () => {
    try {
      const response = await fetch(`${API}/api/gold/history/${username}`, {
        method: "GET",
        headers,
      });

      const data = await response.json();

      if (data.success) {
        const buyOrders = (data.data || []).filter(
          (item: any) => item.type === "BUY"
        );
        setBuyHistory(buyOrders);
      }
    } catch (error) {
      console.error("Buy History Error:", error);
    }
  };

  const loadSellHistory = async () => {
    try {
      const response = await fetch(`${API}/api/gold/history/${username}`, {
        method: "GET",
        headers,
      });

      const data = await response.json();

      if (data.success) {
        const sellOrders = (data.data || []).filter(
          (item: any) => item.type === "SELL"
        );
        setSellHistory(sellOrders);
      }
    } catch (error) {
      console.error("Sell History Error:", error);
    }
  };

  const loadDepositHistory = async () => {
    try {
      const response = await fetch(
        `${API}/api/gold/usdt/deposit/history/${username}`,
        { method: "GET", headers }
      );

      const data = await response.json();

      if (data.success) {
        setDepositHistory(data.history || []);
      }
    } catch (error) {
      console.error("Deposit History Error:", error);
    }
  };

  const loadWithdrawHistory = async () => {
    try {
      const response = await fetch(
        `${API}/api/gold/usdt/withdraw/history/${username}`,
        { method: "GET", headers }
      );

      const data = await response.json();

      if (data.success) {
        setWithdrawHistory(data.history || []);
      }
    } catch (error) {
      console.error("Withdraw History Error:", error);
    }
  };

  const refreshHistory = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        loadWallet(),
        loadBuyHistory(),
        loadSellHistory(),
        loadDepositHistory(),
        loadWithdrawHistory(),
      ]);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Refresh History Error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const refreshAllHistory = async () => {
    await refreshHistory();
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadWallet(),
        loadBuyHistory(),
        loadSellHistory(),
        loadDepositHistory(),
        loadWithdrawHistory(),
      ]);
      setLastUpdate(new Date().toLocaleTimeString());
      setLoading(false);
    };

    if (username) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [username, token]);

  const totalBuy = useMemo(
    () => buyHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [buyHistory]
  );

  const totalSell = useMemo(
    () => sellHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [sellHistory]
  );

  const totalDeposit = useMemo(
    () =>
      depositHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [depositHistory]
  );

  const totalWithdraw = useMemo(
    () =>
      withdrawHistory.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [withdrawHistory]
  );

  const allHistory = useMemo(() => {
    const buy = buyHistory.map((item: any) => ({ ...item, historyType: "BUY" }));
    const sell = sellHistory.map((item: any) => ({ ...item, historyType: "SELL" }));
    const deposit = depositHistory.map((item: any) => ({
      ...item,
      historyType: "DEPOSIT",
    }));
    const withdraw = withdrawHistory.map((item: any) => ({
      ...item,
      historyType: "WITHDRAW",
    }));

    return [...buy, ...sell, ...deposit, ...withdraw].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [buyHistory, sellHistory, depositHistory, withdrawHistory]);

  const filteredHistory = useMemo(() => {
    let records = [...allHistory];

    if (activeTab !== "ALL") {
      records = records.filter((item: any) => item.historyType === activeTab);
    }

    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      records = records.filter((item: any) => {
        const values = [
          item.orderId,
          item.transactionId,
          item.historyType,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        return values.some((value) => value.includes(keyword));
      });
    }

    return records;
  }, [allHistory, activeTab, searchText]);

  const historyStats = useMemo(() => {
    const approved = filteredHistory.filter(
      (item: any) => item.status === "Approved"
    ).length;

    const pending = filteredHistory.filter(
      (item: any) => item.status === "Pending" || !item.status
    ).length;

    const rejected = filteredHistory.filter(
      (item: any) => item.status === "Rejected"
    ).length;

    return {
      approved,
      pending,
      rejected,
      total: filteredHistory.length,
    };
  }, [filteredHistory]);

  const openTransactionModal = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const closeTransactionModal = () => {
    setSelectedTransaction(null);
    setShowTransactionModal(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-30 bg-zinc-900 border-b border-yellow-500 px-5 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <ArrowLeft
            size={24}
            className="text-yellow-400 cursor-pointer"
            onClick={() => history.back()}
          />

          <div>
            <h1 className="text-2xl font-black text-yellow-400">USDT History</h1>
            <p className="text-xs text-zinc-400">GoldTrade V18</p>
          </div>
        </div>

        <button
          onClick={refreshHistory}
          disabled={refreshing}
          className="text-yellow-400"
          aria-label="Refresh transaction history"
        >
          <RefreshCcw className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="max-w-xl mx-auto p-5 space-y-6">
        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="text-green-400" />
            <span className="text-zinc-300 font-semibold">Wallet Balance</span>
          </div>

          <h2 className="text-4xl font-black text-green-400">
            {loading ? "Loading..." : `${walletBalance.toFixed(2)} USDT`}
          </h2>

          <p className="text-zinc-500 mt-2 text-sm">Last Updated : {lastUpdate}</p>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5">
          <div className="flex items-center gap-3">
            <History className="text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold text-yellow-400">
                Transaction History
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Buy • Sell • Deposit • Withdraw History
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded-2xl border border-green-600 p-4">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <TrendingUp size={18} />
              <span className="text-sm font-semibold">Total Buy</span>
            </div>
            <h3 className="text-2xl font-black">{totalBuy.toFixed(2)}</h3>
            <p className="text-xs text-zinc-500">USDT Purchased</p>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-red-600 p-4">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <TrendingDown size={18} />
              <span className="text-sm font-semibold">Total Sell</span>
            </div>
            <h3 className="text-2xl font-black">{totalSell.toFixed(2)}</h3>
            <p className="text-xs text-zinc-500">USDT Sold</p>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-blue-600 p-4">
            <div className="flex items-center gap-2 text-blue-400 mb-2">
              <ArrowDownCircle size={18} />
              <span className="text-sm font-semibold">Total Deposit</span>
            </div>
            <h3 className="text-2xl font-black">{totalDeposit.toFixed(2)}</h3>
            <p className="text-xs text-zinc-500">USDT Deposited</p>
          </div>

          <div className="bg-zinc-900 rounded-2xl border border-yellow-600 p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <ArrowUpCircle size={18} />
              <span className="text-sm font-semibold">Total Withdraw</span>
            </div>
            <h3 className="text-2xl font-black">{totalWithdraw.toFixed(2)}</h3>
            <p className="text-xs text-zinc-500">USDT Withdrawn</p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5">
          <h2 className="text-lg font-bold text-yellow-400 mb-4">History Records</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-black rounded-xl p-4">
              <p className="text-green-400 text-2xl font-black">{buyHistory.length}</p>
              <p className="text-xs text-zinc-500">Buy Orders</p>
            </div>
            <div className="bg-black rounded-xl p-4">
              <p className="text-red-400 text-2xl font-black">{sellHistory.length}</p>
              <p className="text-xs text-zinc-500">Sell Orders</p>
            </div>
            <div className="bg-black rounded-xl p-4">
              <p className="text-blue-400 text-2xl font-black">{depositHistory.length}</p>
              <p className="text-xs text-zinc-500">Deposit Requests</p>
            </div>
            <div className="bg-black rounded-xl p-4">
              <p className="text-yellow-400 text-2xl font-black">{withdrawHistory.length}</p>
              <p className="text-xs text-zinc-500">Withdraw Requests</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-4">
          <h2 className="text-lg font-bold text-yellow-400">Search Transaction</h2>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by Order ID or Transaction ID"
            className="w-full rounded-2xl bg-black border border-zinc-700 p-4 outline-none text-white placeholder:text-zinc-600 focus:border-yellow-500"
          />
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-5">
          <h2 className="text-lg font-bold text-yellow-400">Filter Transactions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              "ALL",
              "BUY",
              "SELL",
              "DEPOSIT",
              "WITHDRAW",
            ].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-xl py-3 font-bold transition-all border ${
                  activeTab === tab
                    ? "bg-yellow-500 text-black border-yellow-500"
                    : "bg-black border-zinc-700 text-zinc-300 hover:border-yellow-500"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-blue-700 p-5 space-y-4">
          <h2 className="text-lg font-bold text-blue-400">Current Filter</h2>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Selected Category</span>
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-bold">
              {activeTab}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Records Found</span>
            <span className="text-green-400 font-bold">{filteredHistory.length}</span>
          </div>
        </div>

        {filteredHistory.length === 0 && !loading && (
          <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-8 text-center">
            <History size={50} className="mx-auto text-zinc-600 mb-4" />
            <h2 className="text-lg font-bold text-zinc-300">No Transactions Found</h2>
            <p className="text-sm text-zinc-500 mt-2">
              No transaction matches your selected filter or search keyword.
            </p>
          </div>
        )}

        <div className="bg-zinc-900 rounded-3xl border border-yellow-600 p-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-yellow-400">Transaction List</h2>
              <p className="text-sm text-zinc-400">Showing {filteredHistory.length} records</p>
            </div>

            <button
              onClick={refreshAllHistory}
              className="text-yellow-400 text-sm hover:text-yellow-300"
            >
              Refresh
            </button>
          </div>
        </div>

        {filteredHistory.length > 0 && (
          <div className="space-y-4">
            {filteredHistory.map((item: any) => (
              <div
                key={item._id || `${item.historyType}-${item.orderId}-${item.createdAt}`}
                className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        item.historyType === "BUY"
                          ? "bg-green-900 text-green-400"
                          : item.historyType === "SELL"
                          ? "bg-red-900 text-red-400"
                          : item.historyType === "DEPOSIT"
                          ? "bg-blue-900 text-blue-400"
                          : "bg-yellow-900 text-yellow-400"
                      }`}
                    >
                      {item.historyType === "BUY" && <TrendingUp size={22} />}
                      {item.historyType === "SELL" && <TrendingDown size={22} />}
                      {item.historyType === "DEPOSIT" && <ArrowDownCircle size={22} />}
                      {item.historyType === "WITHDRAW" && <ArrowUpCircle size={22} />}
                    </div>

                    <div>
                      <h3
                        className={`font-bold text-lg ${
                          item.historyType === "BUY"
                            ? "text-green-400"
                            : item.historyType === "SELL"
                            ? "text-red-400"
                            : item.historyType === "DEPOSIT"
                            ? "text-blue-400"
                            : "text-yellow-400"
                        }`}
                      >
                        {item.historyType} USDT
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Order ID: {item.orderId || "N/A"}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-zinc-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black rounded-xl p-3">
                    <p className="text-zinc-500 text-xs">Amount</p>
                    <h3
                      className={`text-xl font-black mt-1 ${
                        item.historyType === "BUY"
                          ? "text-green-400"
                          : item.historyType === "SELL"
                          ? "text-red-400"
                          : item.historyType === "DEPOSIT"
                          ? "text-blue-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {Number(item.amount || 0).toFixed(2)} USDT
                    </h3>
                  </div>

                  <div className="bg-black rounded-xl p-3">
                    <p className="text-zinc-500 text-xs">Status</p>
                    <div className="mt-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          item.status === "Approved"
                            ? "bg-green-700 text-green-200"
                            : item.status === "Rejected"
                            ? "bg-red-700 text-red-200"
                            : "bg-yellow-700 text-yellow-100"
                        }`}
                      >
                        {item.status || "Pending"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-black rounded-2xl border border-zinc-800 p-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Transaction Type</span>
                    <span>{item.historyType}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-500">Price</span>
                    <span>${Number(item.price || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-zinc-500">Total Value</span>
                    <span className="text-green-400 font-semibold">
                      ${Number(item.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {(item.historyType === "DEPOSIT" || item.historyType === "WITHDRAW") && (
                  <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-4 space-y-3 text-sm">
                    {item.network && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Network</span>
                        <span className="text-blue-400 font-semibold">{item.network}</span>
                      </div>
                    )}

                    {item.paymentMethod && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Payment Method</span>
                        <span className="text-yellow-400 font-semibold">
                          {item.paymentMethod.replaceAll("_", " ")}
                        </span>
                      </div>
                    )}

                    {item.transactionId && (
                      <div className="space-y-1">
                        <p className="text-zinc-500 text-xs">Transaction ID</p>
                        <p className="break-all text-green-400">{item.transactionId}</p>
                      </div>
                    )}
                  </div>
                )}

                {item.historyType === "DEPOSIT" && item.screenshot && (
                  <div className="space-y-3">
                    <p className="text-blue-400 text-sm font-semibold">Payment Screenshot</p>
                    <img
                      src={item.screenshot}
                      alt="Deposit Screenshot"
                      className="w-full rounded-2xl border border-zinc-700 object-cover"
                    />
                  </div>
                )}

                <button
                  onClick={() => openTransactionModal(item)}
                  className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-all"
                >
                  View Transaction Details
                </button>

                <div className="border-t border-zinc-800 pt-3 flex justify-between text-xs text-zinc-500">
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5 space-y-5">
          <h2 className="text-xl font-bold text-yellow-400">Transaction Status Dashboard</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black rounded-2xl border border-green-600 p-4 text-center">
              <p className="text-green-400 text-xs uppercase">Approved</p>
              <h3 className="text-3xl font-black text-green-400 mt-2">
                {historyStats.approved}
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-yellow-600 p-4 text-center">
              <p className="text-yellow-400 text-xs uppercase">Pending</p>
              <h3 className="text-3xl font-black text-yellow-400 mt-2">
                {historyStats.pending}
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-red-600 p-4 text-center">
              <p className="text-red-400 text-xs uppercase">Rejected</p>
              <h3 className="text-3xl font-black text-red-400 mt-2">
                {historyStats.rejected}
              </h3>
            </div>

            <div className="bg-black rounded-2xl border border-blue-600 p-4 text-center">
              <p className="text-blue-400 text-xs uppercase">Total Records</p>
              <h3 className="text-3xl font-black text-blue-400 mt-2">
                {historyStats.total}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-blue-700 p-5 space-y-5">
          <h2 className="text-xl font-bold text-blue-400">Recent Activity Timeline</h2>

          {filteredHistory.slice(0, 5).map((item: any) => (
            <div
              key={`timeline-${item._id || item.orderId || item.createdAt}`}
              className="flex gap-4 items-start border-b border-zinc-800 pb-4 last:border-none"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  item.historyType === "BUY"
                    ? "bg-green-700"
                    : item.historyType === "SELL"
                    ? "bg-red-700"
                    : item.historyType === "DEPOSIT"
                    ? "bg-blue-700"
                    : "bg-yellow-700"
                }`}
              >
                {item.historyType === "BUY" && <TrendingUp size={18} />}
                {item.historyType === "SELL" && <TrendingDown size={18} />}
                {item.historyType === "DEPOSIT" && <ArrowDownCircle size={18} />}
                {item.historyType === "WITHDRAW" && <ArrowUpCircle size={18} />}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-white">
                    {item.historyType} — {Number(item.amount || 0).toFixed(2)} USDT
                  </h3>

                  <span
                    className={`text-xs font-bold ${
                      item.status === "Approved"
                        ? "text-green-400"
                        : item.status === "Rejected"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {item.status || "Pending"}
                  </span>
                </div>

                <p className="text-zinc-500 text-xs mt-1">Order ID : {item.orderId}</p>
                <p className="text-zinc-500 text-xs mt-1">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-green-700 p-5 space-y-5">
          <h2 className="text-xl font-bold text-green-400">Wallet Activity Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Current Wallet Balance</span>
              <span className="text-green-400 font-bold">
                {walletBalance.toFixed(2)} USDT
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Total Purchased</span>
              <span className="text-green-400">{totalBuy.toFixed(2)} USDT</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Total Sold</span>
              <span className="text-red-400">{totalSell.toFixed(2)} USDT</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Total Deposited</span>
              <span className="text-blue-400">{totalDeposit.toFixed(2)} USDT</span>
            </div>

            <div className="flex justify-between border-t border-zinc-700 pt-3">
              <span className="text-zinc-500">Total Withdrawn</span>
              <span className="text-yellow-400">{totalWithdraw.toFixed(2)} USDT</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-purple-700 p-5 space-y-5">
          <h2 className="text-xl font-bold text-purple-400">Deposit & Withdraw Analytics</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black rounded-xl p-4 text-center">
              <p className="text-blue-400 text-xs">Deposit Requests</p>
              <h3 className="text-2xl font-black text-blue-400">{depositHistory.length}</h3>
            </div>

            <div className="bg-black rounded-xl p-4 text-center">
              <p className="text-yellow-400 text-xs">Withdraw Requests</p>
              <h3 className="text-2xl font-black text-yellow-400">{withdrawHistory.length}</h3>
            </div>
          </div>

          <div className="bg-black rounded-xl p-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Successful Deposits</span>
              <span className="text-green-400">
                {depositHistory.filter((item: any) => item.status === "Approved").length}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Successful Withdrawals</span>
              <span className="text-green-400">
                {withdrawHistory.filter((item: any) => item.status === "Approved").length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-zinc-700 p-5 space-y-4">
          <h2 className="text-lg font-bold text-yellow-400">Transaction Status Guide</h2>

          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-green-500"></span>
              <p>
                <span className="text-green-400 font-semibold">Approved</span>{" "}
                — Transaction completed successfully.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
              <p>
                <span className="text-yellow-400 font-semibold">Pending</span>{" "}
                — Waiting for GoldTrade Admin verification.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full bg-red-500"></span>
              <p>
                <span className="text-red-400 font-semibold">Rejected</span>{" "}
                — Transaction was rejected by the Admin.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-blue-700 p-5 space-y-4">
          <h2 className="text-lg font-bold text-blue-400">Today's Activity Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Total Transactions</span>
              <span className="text-white font-semibold">{filteredHistory.length}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Last Updated</span>
              <span className="text-yellow-400">{lastUpdate}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Active Filter</span>
              <span className="text-blue-400">{activeTab}</span>
            </div>
          </div>
        </div>

        {showTransactionModal && selectedTransaction && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-yellow-500 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-5">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-yellow-400">Transaction Details</h2>
                <button
                  onClick={closeTransactionModal}
                  className="text-red-400 text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-black rounded-2xl border border-zinc-700 p-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Transaction Type</span>
                  <span className="font-semibold text-yellow-400">
                    {selectedTransaction.historyType}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">Order ID</span>
                  <span className="text-green-400 font-semibold">
                    {selectedTransaction.orderId}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">Amount</span>
                  <span>{Number(selectedTransaction.amount || 0).toFixed(2)} USDT</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">Price</span>
                  <span>${Number(selectedTransaction.price || 0).toFixed(2)}</span>
                </div>

                <div className="flex justify-between border-t border-zinc-700 pt-3">
                  <span className="text-zinc-500">Total Value</span>
                  <span className="text-green-400 font-bold">
                    ${Number(selectedTransaction.total || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  <span
                    className={`font-semibold ${
                      selectedTransaction.status === "Approved"
                        ? "text-green-400"
                        : selectedTransaction.status === "Rejected"
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {selectedTransaction.status || "Pending"}
                  </span>
                </div>

                {selectedTransaction.network && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Network</span>
                    <span className="text-blue-400 font-semibold">
                      {selectedTransaction.network}
                    </span>
                  </div>
                )}

                {selectedTransaction.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Payment Method</span>
                    <span className="text-yellow-400 font-semibold">
                      {selectedTransaction.paymentMethod.replaceAll("_", " ")}
                    </span>
                  </div>
                )}

                {selectedTransaction.transactionId && (
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-xs">Transaction ID (TXID)</p>
                    <div className="bg-zinc-950 rounded-xl border border-zinc-700 p-3 break-all text-green-400 text-xs">
                      {selectedTransaction.transactionId}
                    </div>
                  </div>
                )}

                {selectedTransaction.screenshot && (
                  <div className="space-y-2">
                    <p className="text-zinc-500 text-xs">Payment Screenshot</p>
                    <img
                      src={selectedTransaction.screenshot}
                      alt="Deposit Screenshot"
                      className="w-full rounded-2xl border border-zinc-700 object-cover"
                    />
                  </div>
                )}

                <div className="border-t border-zinc-700 pt-3 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Created Date</span>
                    <span>{new Date(selectedTransaction.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-500">Created Time</span>
                    <span>{new Date(selectedTransaction.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={closeTransactionModal}
                className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-all"
              >
                Close Details
              </button>
            </div>
          </div>
        )}

        {(loading || refreshing) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8 flex flex-col items-center gap-5 w-80">
              <div className="h-16 w-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-xl font-bold text-yellow-400">Loading History</h2>
              <p className="text-zinc-400 text-center text-sm">
                Refreshing your GoldTrade transaction history...
              </p>
            </div>
          </div>
        )}

        <div className="bg-red-950 border border-red-500 rounded-3xl p-5 space-y-4">
          <h2 className="text-red-400 text-lg font-bold">History Security Reminder</h2>
          <div className="space-y-3 text-sm text-red-100">
            <div className="flex gap-3">
              <span>🔒</span>
              <p>Never share your Order ID with unknown people.</p>
            </div>
            <div className="flex gap-3">
              <span>🔒</span>
              <p>Keep your Transaction ID (TXID) safe until the transaction is completed.</p>
            </div>
            <div className="flex gap-3">
              <span>🔒</span>
              <p>Deposit screenshots are stored only for verification purposes.</p>
            </div>
            <div className="flex gap-3">
              <span>🔒</span>
              <p>Withdraw requests remain pending until approved by GoldTrade Admin.</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-950 border border-blue-600 rounded-3xl p-5 space-y-4">
          <h2 className="text-blue-300 text-lg font-bold">Transaction Information</h2>
          <div className="space-y-3 text-sm text-blue-100">
            <div className="flex justify-between">
              <span>Buy Transactions</span>
              <span className="font-semibold text-green-400">{buyHistory.length}</span>
            </div>

            <div className="flex justify-between">
              <span>Sell Transactions</span>
              <span className="font-semibold text-red-400">{sellHistory.length}</span>
            </div>

            <div className="flex justify-between">
              <span>Deposit Transactions</span>
              <span className="font-semibold text-blue-400">{depositHistory.length}</span>
            </div>

            <div className="flex justify-between">
              <span>Withdraw Transactions</span>
              <span className="font-semibold text-yellow-400">{withdrawHistory.length}</span>
            </div>

            <div className="flex justify-between border-t border-blue-700 pt-3">
              <span>Total History Records</span>
              <span className="font-bold text-white">{allHistory.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-yellow-500 p-5 space-y-4">
          <h2 className="text-yellow-400 text-lg font-bold">Quick Actions</h2>

          <button
            onClick={refreshAllHistory}
            className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition-all"
          >
            Refresh Transaction History
          </button>

          <button
            onClick={() => history.back()}
            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all border border-zinc-700"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="bg-zinc-900 rounded-3xl border border-green-600 p-5 space-y-5">
          <h2 className="text-green-400 text-lg font-bold">GoldTrade Support</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">History Sync</span>
              <span className="text-green-400 font-semibold">Automatic</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Deposit Verification</span>
              <span className="text-yellow-400 font-semibold">5–30 Minutes</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Withdraw Verification</span>
              <span className="text-yellow-400 font-semibold">5–30 Minutes</span>
            </div>

            <div className="flex justify-between">
              <span className="text-zinc-500">Support Availability</span>
              <span className="text-green-400 font-semibold">24 / 7</span>
            </div>
          </div>
        </div>

        <div className="py-12 text-center text-zinc-500">
          <h2 className="text-yellow-500 font-black text-xl">GoldTrade V18</h2>
          <p className="mt-2 text-sm">
            Secure USDT Buy • Sell • Deposit • Withdraw Platform
          </p>
          <p className="text-xs mt-3">
            Complete Transaction History • Live Wallet Records • Admin Verified
          </p>
          <div className="mt-6 border-t border-zinc-800 pt-4 text-xs text-zinc-600">
            © 2026 GoldTrade V18 — All Rights Reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
