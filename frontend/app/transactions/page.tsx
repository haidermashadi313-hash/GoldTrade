"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, History } from "lucide-react";

const API = "http://localhost:5000";

interface Transaction {
  _id: string;
  username: string;
  type: string;
  amount: number;
  method: string;
  status: string;
  transactionId: string;
  createdAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");

  const loadTransactions = async () => {
    try {
      const res = await fetch(`${API}/api/transactions`);
      const data = await res.json();

      if (data.success) {
        setTransactions(data.data);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.username.toLowerCase().includes(search.toLowerCase()) ||
        tx.transactionId.toLowerCase().includes(search.toLowerCase());

      const matchType = type === "All" || tx.type === type;
      const matchStatus = status === "All" || tx.status === status;

      return matchSearch && matchType && matchStatus;
    });
  }, [transactions, search, type, status]);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-yellow-400 flex items-center gap-3">
            <History size={34} />
            Transaction Manager
          </h1>

          <p className="text-gray-400 mt-2">
            All deposits, withdrawals and wallet adjustments.
          </p>
        </div>

        <button
          onClick={loadTransactions}
          className="bg-yellow-500 text-black px-4 py-2 rounded-xl flex items-center gap-2 font-bold"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="relative">
          <Search
            className="absolute left-3 top-3 text-gray-500"
            size={18}
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Username / TX ID"
            className="w-full bg-zinc-900 border border-yellow-500 rounded-xl pl-10 p-3"
          />
        </div>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-zinc-900 border border-yellow-500 rounded-xl p-3"
        >
          <option>All</option>
          <option>Deposit</option>
          <option>Withdraw</option>
          <option>Wallet Adjustment</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-zinc-900 border border-yellow-500 rounded-xl p-3"
        >
          <option>All</option>
          <option>Approved</option>
          <option>Pending</option>
          <option>Rejected</option>
          <option>Credit</option>
          <option>Debit</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
        <table className="w-full">
          <thead className="border-b border-yellow-500 text-yellow-400">
            <tr>
              <th className="py-3 text-left">User</th>
              <th className="text-left">Type</th>
              <th className="text-left">Amount</th>
              <th className="text-left">Method</th>
              <th className="text-left">Status</th>
              <th className="text-left">TX ID</th>
              <th className="text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-8 text-gray-500"
                >
                  No Transactions Found
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr
                  key={tx._id}
                  className="border-b border-zinc-800"
                >
                  <td className="py-4 font-semibold">{tx.username}</td>

                  <td>{tx.type}</td>

                  <td className="text-green-400 font-bold">
                    PKR {tx.amount.toLocaleString()}
                  </td>

                  <td>{tx.method}</td>

                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        tx.status === "Approved" ||
                        tx.status === "Credit"
                          ? "bg-green-600"
                          : tx.status === "Rejected" ||
                            tx.status === "Debit"
                          ? "bg-red-600"
                          : "bg-yellow-500 text-black"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>

                  <td className="text-xs text-gray-400">
                    {tx.transactionId}
                  </td>

                  <td className="text-sm text-gray-400">
                    {new Date(tx.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}