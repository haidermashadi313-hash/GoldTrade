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
  Wallet,
  Clock,
  Landmark,
} from "lucide-react";

const API = "http://localhost:5000";

interface Withdraw {
  _id: string;
  username: string;
  amount: number;
  method: string;
  accountNumber: string;
  accountName: string;
  receiptImage?: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

export default function AdminWithdrawPage() {
  const [withdraws, setWithdraws] = useState<Withdraw[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  // ===============================
  // Load Withdraw Requests
  // ===============================
  const fetchWithdraws = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/api/withdraw`);
      const data = await res.json();

      if (data.success) {
        setWithdraws(data.data);
      }
    } catch (err) {
      console.log(err);
      alert("Failed to load withdrawals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdraws();
  }, []);

  // ===============================
  // Approve / Reject
  // ===============================
  const updateStatus = async (
    id: string,
    status: "Approved" | "Rejected"
  ) => {
    try {
      const res = await fetch(`${API}/api/withdraw/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`Withdrawal ${status} Successfully ✅`);
        fetchWithdraws();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Server Error");
    }
  };

  // ===============================
  // Search
  // ===============================
  const filtered = useMemo(() => {
    return withdraws.filter((item) => {
      const value = search.toLowerCase();

      return (
        item.username.toLowerCase().includes(value) ||
        item.accountNumber.toLowerCase().includes(value)
      );
    });
  }, [withdraws, search]);

  // ===============================
  // Statistics
  // ===============================
  const totalAmount = withdraws.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const pending = withdraws.filter(
    (d) => d.status === "Pending"
  ).length;

  const approved = withdraws.filter(
    (d) => d.status === "Approved"
  ).length;

  const rejected = withdraws.filter(
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
            Withdraw Approval Manager
          </h1>

          <p className="text-gray-400 mt-2">
            Review and approve customer withdrawal requests.
          </p>
        </div>

        <button
          onClick={fetchWithdraws}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
        >
          <RefreshCw size={18} />
          Refresh
        </button>

      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-5 mb-8">

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">
          <Wallet className="text-yellow-400 mb-2" size={28}/>
          <p className="text-gray-400">Total Requests</p>
          <h2 className="text-3xl font-bold text-yellow-400">
            {withdraws.length}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-5">
          <CheckCircle className="text-green-400 mb-2" size={28}/>
          <p className="text-gray-400">Approved</p>
          <h2 className="text-3xl font-bold text-green-400">
            {approved}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-5">
          <Clock className="text-orange-400 mb-2" size={28}/>
          <p className="text-gray-400">Pending</p>
          <h2 className="text-3xl font-bold text-orange-400">
            {pending}
          </h2>
        </div>

        <div className="bg-zinc-900 border border-red-500 rounded-3xl p-5">
          <XCircle className="text-red-400 mb-2" size={28}/>
          <p className="text-gray-400">Rejected</p>
          <h2 className="text-3xl font-bold text-red-400">
            {rejected}
          </h2>
        </div>

      </div>

      {/* Total Amount */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-3xl p-6 mb-8">

        <p className="text-red-100 font-semibold">
          Total Withdrawal Amount
        </p>

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
          placeholder="Search Username or Account Number..."
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
              <th className="text-left py-3">User</th>
              <th className="text-left">Amount</th>
              <th className="text-left">Method</th>
              <th className="text-left">Account Details</th>
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
                  Loading Withdraw Requests...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  No Withdraw Requests Found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item._id}
                  className="border-b border-zinc-800"
                >
                  <td className="py-5 font-semibold">
                    {item.username}
                  </td>

                  <td className="text-red-400 font-bold">
                    PKR {item.amount.toLocaleString()}
                  </td>

                  <td>{item.method}</td>

                  {/* Account */}
                  <td>
                    <div className="flex items-start gap-2">
                      <Landmark
                        size={18}
                        className="text-yellow-400 mt-1"
                      />

                      <div>
                        <p className="font-semibold">
                          {item.accountName}
                        </p>

                        <p className="text-xs text-gray-400">
                          {item.accountNumber}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Receipt */}
                  <td>
                    {item.receiptImage ? (
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
                    ) : (
                      <span className="text-gray-500 text-sm">
                        No Receipt
                      </span>
                    )}
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
                          className="bg-green-600 hover:bg-green-500 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-bold"
                        >
                          <CheckCircle size={16}/>
                          Approve
                        </button>

                        <button
                          onClick={() =>
                            updateStatus(item._id, "Rejected")
                          }
                          className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-bold"
                        >
                          <XCircle size={16}/>
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

      {/* Receipt Preview Modal */}
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