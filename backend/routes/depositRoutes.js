const express = require("express");
const router = express.Router();

const Deposit = require("../models/Deposit");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const WalletTransaction = require("../models/WalletTransaction");

const { verifyToken } = require("../middleware/authMiddleware");

// =======================================
// GET ALL DEPOSITS (ADMIN)
// =======================================
router.get("/", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    const deposits = await Deposit.find()
      .sort({ createdAt: -1 })
      .populate("userId", "username email");

    res.json({
      success: true,
      deposits,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================================
// APPROVE + CREDIT DEPOSIT
// =======================================
router.post("/approve-credit/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    const { walletType, creditAmount, reason } = req.body;

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    if (deposit.status === "Approved") {
      return res.status(400).json({
        success: false,
        message: "Deposit already approved.",
      });
    }

    const user = await User.findById(deposit.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const amount = Number(creditAmount);

    let previousBalance = 0;
    let newBalance = 0;

    if (walletType === "PKR") {
      previousBalance = user.walletBalance;
      newBalance = previousBalance + amount;
      user.walletBalance = newBalance;
      user.totalDeposit += amount;
    }

    if (walletType === "USDT") {
      previousBalance = user.usdtBalance;
      newBalance = previousBalance + amount;
      user.usdtBalance = newBalance;
    }

    if (walletType === "GOLD") {
      previousBalance = user.goldBalance;
      newBalance = previousBalance + amount;
      user.goldBalance = newBalance;
    }

    await user.save();

    deposit.status = "Approved";
    deposit.approvedBy = req.user._id;
    deposit.approvedAmount = amount;
    deposit.walletType = walletType;
    deposit.approvedAt = new Date();

    await deposit.save();

    await WalletTransaction.create({
      user: user._id,
      admin: req.user._id,
      walletType,
      action: "credit",
      amount,
      previousBalance,
      newBalance,
      reason,
    });

    await Transaction.create({
      userId: user._id,
      username: user.username,
      type: "Deposit Credit",
      amount,
      status: "Completed",
      description: reason,
    });

    res.json({
      success: true,
      message: "Deposit Approved & Wallet Credited.",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// =======================================
// REJECT DEPOSIT
// =======================================
router.post("/reject/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin only.",
      });
    }

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return res.status(404).json({
        success: false,
        message: "Deposit not found.",
      });
    }

    deposit.status = "Rejected";
    deposit.rejectedBy = req.user._id;
    deposit.rejectedAt = new Date();

    await deposit.save();

    res.json({
      success: true,
      message: "Deposit Rejected.",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

module.exports = router;"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Wallet,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-api.onrender.com";

export default function AdminDepositPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deposits, setDeposits] = useState([]);

  const [walletType, setWalletType] = useState("PKR");
  const [creditAmount, setCreditAmount] = useState("");
  const [reason, setReason] = useState("Deposit Approved");

  const loadDeposits = async () => {
    try {
      const res = await fetch(`${API}/api/deposit`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setDeposits(data.deposits);
      }

      setLoading(false);
    } catch (err) {
      alert("Unable to load deposits.");
    }
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const filtered = useMemo(() => {
    return deposits.filter((item) =>
      item.userId?.username
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [deposits, search]);

  const approveCredit = async (deposit) => {
    const res = await fetch(
      `${API}/api/deposit/approve-credit/${deposit._id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletType,
          creditAmount,
          reason,
        }),
      }
    );

    const data = await res.json();

    alert(data.message);

    loadDeposits();
  };

  const rejectDeposit = async (deposit) => {
    const res = await fetch(
      `${API}/api/deposit/reject/${deposit._id}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();

    alert(data.message);

    loadDeposits();
  };

  if (loading)
    return (
      <main className="min-h-screen bg-black flex justify-center items-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" />
        Loading Deposits...
      </main>
    );

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex justify-between items-center mb-8">

          <div>
            <h1 className="text-4xl font-black text-yellow-400">
              Deposit Approval Center
            </h1>

            <p className="text-gray-400 mt-2">
              Approve + Credit / Reject Deposit Requests
            </p>
          </div>

          <Link
            href="/admin"
            className="bg-zinc-800 border border-yellow-500 px-5 py-3 rounded-xl flex items-center gap-2 hover:bg-yellow-500 hover:text-black"
          >
            <ArrowLeft size={18}/>
            Dashboard
          </Link>

        </div>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-3 text-gray-500" />

          <input
            placeholder="Search username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-yellow-500 rounded-xl py-3 pl-12 pr-4"
          />
        </div>        <div className="space-y-8">

          {filtered.map((deposit) => (

            <div
              key={deposit._id}
              className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6"
            >

              <div className="grid lg:grid-cols-2 gap-8">

                {/* LEFT */}

                <div>

                  <h2 className="text-2xl font-bold text-yellow-400">
                    {deposit.userId?.username}
                  </h2>

                  <p className="text-gray-400">
                    {deposit.userId?.email}
                  </p>

                  <div className="mt-5 space-y-2">

                    <p>
                      Amount :
                      <span className="text-green-400 font-bold ml-2">
                        PKR {deposit.amount}
                      </span>
                    </p>

                    <p>
                      Status :
                      <span className="text-yellow-400 font-bold ml-2">
                        {deposit.status}
                      </span>
                    </p>

                  </div>

                  {deposit.screenshot && (
                    <img
                      src={`${API}/${deposit.screenshot}`}
                      className="rounded-2xl mt-5 border border-yellow-500 w-full"
                    />
                  )}

                </div>

                {/* RIGHT */}

                <div className="space-y-5">

                  <label className="block text-gray-400">
                    Wallet Type
                  </label>

                  <select
                    value={walletType}
                    onChange={(e) =>
                      setWalletType(e.target.value)
                    }
                    className="w-full bg-black border border-yellow-500 rounded-xl p-3"
                  >
                    <option value="PKR">PKR Wallet</option>
                    <option value="USDT">USDT Wallet</option>
                    <option value="GOLD">Gold Wallet</option>
                  </select>

                  <label className="block text-gray-400">
                    Credit Amount
                  </label>

                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) =>
                      setCreditAmount(e.target.value)
                    }
                    placeholder="Enter amount..."
                    className="w-full bg-black border border-yellow-500 rounded-xl p-3"
                  />

                  <label className="block text-gray-400">
                    Reason
                  </label>

                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(e) =>
                      setReason(e.target.value)
                    }
                    className="w-full bg-black border border-yellow-500 rounded-xl p-3"
                  />

                  <button
                    onClick={() => approveCredit(deposit)}
                    className="w-full bg-green-600 hover:bg-green-500 rounded-xl py-3 font-bold flex justify-center items-center gap-2"
                  >
                    <CheckCircle size={20}/>
                    Approve + Credit Wallet
                  </button>

                  <button
                    onClick={() => rejectDeposit(deposit)}
                    className="w-full bg-red-600 hover:bg-red-500 rounded-xl py-3 font-bold flex justify-center items-center gap-2"
                  >
                    <XCircle size={20}/>
                    Reject Deposit
                  </button>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>
    </main>
  );
}