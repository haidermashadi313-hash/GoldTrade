"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
  Wallet,
} from "lucide-react";

const API = "http://localhost:5000";

interface Deposit {
  _id: string;
  username: string;
  amount: number;
  method: string;
  transactionId: string;
  receiptImage: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

export default function AdminDepositPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [previewImage, setPreviewImage] = useState("");

  // ===============================
  // Load Deposits
  // ===============================
  const fetchDeposits = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/deposit`);
      const data = await res.json();

      if (data.success) {
        setDeposits(data.data);
      }
    } catch (err) {
      console.log(err);
      alert("Failed to load deposits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, []);

  // ===============================
  // Approve / Reject
  // ===============================
  const updateStatus = async (
    id: string,
    status: "Approved" | "Rejected"
  ) => {
    try {
      const res = await fetch(`${API}/api/deposit/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Deposit ${status} Successfully ✅`);
        fetchDeposits();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Server Error");
    }
  };

  // ===============================
  // Search Filter
  // ===============================
  const filtered = useMemo(() => {
    return deposits.filter((item) => {
      const value = search.toLowerCase();

      return (
        item.username.toLowerCase().includes(value) ||
        item.transactionId.toLowerCase().includes(value)
      );
    });
  }, [deposits, search]);

  // ===============================
  // Statistics
  // ===============================
  const totalAmount = deposits.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const pending = deposits.filter(
    (d) => d.status === "Pending"
  ).length;

  const approved = deposits.filter(
    (d) => d.status === "Approved"
  ).length;

  const rejected = deposits.filter(
    (d) => d.status === "Rejected"
  ).length;

  return (
    <main className="min-h-screen bg-black text-white p-8">

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <div>
          <Link
            href="/admin"
            className="flex items-center gap-2 text-yellow-400 mb-3"
          >
            <ArrowLeft size={18} />
            Back to Admin Dashboard
          </Link>

          <h1 className="text-4xl font-bold text-yellow-400">
            Deposit Approval Manager
          </h1>

          <p className="text-gray-400 mt-2">
            Review and approve customer deposits.
          </p>
        </div>

        <button
          onClick={fetchDeposits}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
        >
          <RefreshCw size={18} />
          Refresh
        </button>

      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-5 mb-8">

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
          <Wallet className="text-yellow-400 mb-2" size={28} />

          <p className="text-gray-400">Total Deposits</p>

          <h2 className="text-3xl font-bold text-yellow-400">
            {deposits.length}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">
          <CheckCircle className="text-green-400 mb-2" size={28} />

          <p className="text-gray-400">Approved</p>

          <h2 className="text-3xl font-bold text-green-400">
            {approved}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-5">
          <Clock className="text-orange-400 mb-2" size={28} />

          <p className="text-gray-400">Pending</p>

          <h2 className="text-3xl font-bold text-orange-400">
            {pending}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-5">
          <XCircle className="text-red-400 mb-2" size={28} />

          <p className="text-gray-400">Rejected</p>

          <h2 className="text-3xl font-bold text-red-400">
            {rejected}
          </h2>
        </div>

      </div>

      {/* Total Amount */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-3xl p-6 mb-8 text-black">
        <p className="font-semibold">Total Deposit Amount</p>

        <h2 className="text-4xl font-bold mt-2">
          PKR {totalAmount.toLocaleString()}
        </h2>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search
          className="absolute left-4 top-3 text-gray-500"
          size={18}
        />

        <input
          placeholder="Search Username or Transaction ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-yellow-500 rounded-xl py-3 pl-11 pr-4 outline-none"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-3xl border border-yellow-500 bg-zinc-900 p-4">

        <table className="w-full">

          <thead className="text-yellow-400 border-b border-yellow-500">
            <tr>
              <th className="py-3 text-left">User</th>
              <th className="text-left">Amount</th>
              <th className="text-left">Method</th>
              <th className="text-left">Transaction ID</th>
              <th className="text-left">Receipt</th>
              <th className="text-left">Status</th>
              <th className="text-left">Date</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-10">
                  Loading Deposits...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-10 text-gray-500"
                >
                  No Deposit Records Found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-zinc-800"
                >
                  <td className="py-5">
                    <p className="font-semibold text-white">
                      {item.username}
                    </p>
                  </td>

                  <td className="text-yellow-300 font-bold">
                    PKR {item.amount.toLocaleString()}
                  </td>

                  <td>{item.method}</td>

                  <td className="text-xs text-gray-400">
                    {item.transactionId}
                  </td>

                  {/* Receipt */}
                  <td>
                    <button
                      onClick={() =>
                        setPreviewImage(
                          `${API}/uploads/receipts/${item.receiptImage}`
                        )
                      }
                      className="relative"
                    >
                      <img
                        src={`${API}/uploads/receipts/${item.receiptImage}`}
                        alt="receipt"
                        className="w-20 h-20 rounded-xl object-cover border border-yellow-500"
                      />

                      <div className="absolute inset-0 bg-black/40 rounded-xl flex justify-center items-center opacity-0 hover:opacity-100 transition">
                        <Eye size={24} className="text-white" />
                      </div>
                    </button>
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === "Approved"
                          ? "bg-green-600"
                          : item.status === "Rejected"
                          ? "bg-red-600"
                          : "bg-yellow-500 text-black"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>

                  {/* Action */}
                  <td className="text-center">
                    {item.status === "Pending" ? (
                      <div className="flex gap-2 justify-center">

                        <button
                          onClick={() =>
                            updateStatus(item._id, "Approved")
                          }
                          className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-lg flex gap-2 items-center text-sm font-bold"
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(item._id, "Rejected")
                          }
                          className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg flex gap-2 items-center text-sm font-bold"
                        >
                          <XCircle size={16} />
                          Reject
                        </button>

                      </div>
                    ) : (
                      <span className="text-gray-500 font-semibold">
                        Completed
                      </span>
                    )}
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 p-6">
          <div className="relative max-w-3xl w-full">

            <button
              onClick={() => setPreviewImage("")}
              className="absolute -top-12 right-0 bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg font-bold"
            >
              Close
            </button>

            <img
              src={previewImage}
              alt="Receipt Preview"
              className="rounded-2xl border-2 border-yellow-500 w-full max-h-[90vh] object-contain"
            />

          </div>
        </div>
      )}
    </main>
  );
}