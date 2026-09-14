"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-api.onrender.com";

interface Transaction {
  _id: string;
  type: string;
  createdAt: string;
  note?: string;
  amount: number;
  asset: string;
  status: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API}/api/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-yellow-400">
          Transaction History
        </h1>

        <button
          onClick={loadTransactions}
          className="bg-yellow-500 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
        >
          <RefreshCw size={18}/>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-yellow-400">
          Loading Transactions...
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No Transactions Found.
        </div>
      ) : (
        <div className="space-y-4">

          {transactions.map((tx) => (
            <div
              key={tx._id}
              className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5 flex justify-between items-center"
            >

              <div className="flex items-center gap-4">

                {tx.type === "Deposit" ? (
                  <ArrowDownCircle className="text-green-400" size={34}/>
                ) : (
                  <ArrowUpCircle className="text-red-400" size={34}/>
                )}

                <div>
                  <h3 className="font-bold text-lg">{tx.type}</h3>

                  <p className="text-gray-400 text-sm">
                    {new Date(tx.createdAt).toLocaleString()}
                  </p>

                  <p className="text-xs text-gray-500">{tx.note}</p>
                </div>

              </div>

              <div className="text-right">

                <h3 className="text-xl font-black text-yellow-400">
                  {tx.amount} {tx.asset}
                </h3>

                <span
                  className={`text-sm font-bold ${
                    tx.status === "Approved"
                      ? "text-green-400"
                      : tx.status === "Rejected"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}
                >
                  {tx.status}
                </span>

              </div>

            </div>
          ))}

        </div>
      )}

    </main>
  );
}