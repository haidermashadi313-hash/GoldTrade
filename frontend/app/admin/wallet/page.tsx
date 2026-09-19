"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  DollarSign,
  Landmark,
  RefreshCw,
  Wallet,
} from "lucide-react";

// ===============================
// API URL (Production Safe)
// ===============================
const API =
  process.env.NEXT_PUBLIC_API_URL || "https://goldtrade-api.onrender.com";

// ===============================
// TYPES
// ===============================

interface WalletData {
  walletBalance: number;
  goldBalance: number;
  usdtBalance: number;
  walletFrozen: boolean;
}

interface WalletTransaction {
  _id: string;
  transactionType?: string;
  type?: string;
  amountPkr?: number;
  amount?: number;
  status: string;
  provider?: string;
  createdAt: string;
}

interface MarketSettings {
  buyGoldPrice: number;
  sellGoldPrice: number;
}

// ===============================
// DEFAULT VALUES
// ===============================

const emptyWallet: WalletData = {
  walletBalance: 0,
  goldBalance: 0,
  usdtBalance: 0,
  walletFrozen: false,
};

const defaultSettings: MarketSettings = {
  buyGoldPrice: 31250,
  sellGoldPrice: 30980,
};

// ===============================
// WALLET PAGE
// ===============================

export default function WalletPage() {
  const [token] = useState(() =>
    typeof window === "undefined"
      ? ""
      : localStorage.getItem("token") || ""
  );

  const [wallet, setWallet] = useState<WalletData>(emptyWallet);
  const [settings, setSettings] =
    useState<MarketSettings>(defaultSettings);

  const [transactions, setTransactions] = useState<
    WalletTransaction[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] =
    useState(false);

  const [transactionSearch, setTransactionSearch] =
    useState("");

  // Deposit
  const [depositAmount, setDepositAmount] = useState(1000);
  const [depositMethod, setDepositMethod] =
    useState("BANK");
  const [depositImage, setDepositImage] =
    useState<File | null>(null);

  const [depositLoading, setDepositLoading] =
    useState(false);

  const [uploadingDeposit, setUploadingDeposit] =
    useState(false);

  // Withdraw
  const [withdrawAmount, setWithdrawAmount] =
    useState(1000);

  const [withdrawMethod, setWithdrawMethod] =
    useState("BANK");

  const [withdrawAccount, setWithdrawAccount] =
    useState("");

  const [withdrawLoading, setWithdrawLoading] =
    useState(false);

  // ===============================
  // AUTH HEADER
  // ===============================

  const authHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  // ===============================
  // LOAD WALLET
  // ===============================

  const loadWallet = async () => {
    try {
      setLoading(true);

      const [walletResponse, goldResponse] = await Promise.all([
        fetch(`${API}/api/wallet/balance`, {
          headers: authHeaders(),
        }),
        fetch(`${API}/api/gold/price`),
      ]);

      const walletData = await walletResponse.json();
      const goldData = await goldResponse.json();

      if (walletResponse.ok) {
        setWallet({
          walletBalance: walletData.walletBalance || 0,
          goldBalance: walletData.goldBalance || 0,
          usdtBalance: walletData.usdtBalance || 0,
          walletFrozen: walletData.walletFrozen || false,
        });
      }

      if (goldResponse.ok) {
        setSettings({
          buyGoldPrice: goldData.buyPrice || 31250,
          sellGoldPrice: goldData.sellPrice || 30980,
        });
      }
    } catch (err) {
      console.error("Wallet Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // LOAD TRANSACTIONS
  // ===============================

  const loadTransactions = async () => {
    try {
      setTransactionLoading(true);

      const response = await fetch(
        `${API}/api/transactions/history`,
        {
          headers: authHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions || []);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("Transaction Error:", err);
      setTransactions([]);
    } finally {
      setTransactionLoading(false);
    }
  };

  // ===============================
  // INITIAL LOAD
  // ===============================

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    loadWallet();
    loadTransactions();
  }, [token]);

  // ===============================
  // API REQUEST HELPER
  // ===============================

  const submitRequest = async (
    url: string,
    body: BodyInit,
    isForm = false
  ) => {
    const response = await fetch(`${API}${url}`, {
      method: "POST",
      headers: isForm
        ? authHeaders()
        : {
            ...authHeaders(),
            "Content-Type": "application/json",
          },
      body,
    });

    return response.json();
  };

  // ===============================
  // CREATE DEPOSIT
  // ===============================

  const createDepositRequest = async () => {
    if (depositAmount <= 0) return;

    try {
      setDepositLoading(true);

      const data = await submitRequest(
        "/api/deposit",
        JSON.stringify({
          requestAmount: depositAmount,
          paymentMethod: depositMethod,
        })
      );

      if (data.success) {
        await loadWallet();
        await loadTransactions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDepositLoading(false);
    }
  };

  // ===============================
  // UPLOAD DEPOSIT PROOF
  // ===============================

  const uploadDepositProof = async () => {
    if (!depositImage) return;

    try {
      setUploadingDeposit(true);

      const formData = new FormData();
      formData.append("receiptImage", depositImage);
      formData.append(
        "requestAmount",
        String(depositAmount)
      );
      formData.append(
        "paymentMethod",
        depositMethod
      );

      const data = await submitRequest(
        "/api/deposit",
        formData,
        true
      );

      if (data.success) {
        setDepositImage(null);
        await loadTransactions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingDeposit(false);
    }
  };

  // ===============================
  // SUBMIT WITHDRAW
  // ===============================

  const submitWithdrawal = async () => {
    if (
      withdrawAmount < 500 ||
      withdrawAmount > wallet.walletBalance ||
      !withdrawAccount.trim()
    )
      return;

    try {
      setWithdrawLoading(true);

      const data = await submitRequest(
        "/api/withdraw",
        JSON.stringify({
          requestAmount: withdrawAmount,
          paymentMethod: withdrawMethod,
          accountNumber: withdrawAccount,
        })
      );

      if (data.success) {
        setWithdrawAccount("");
        await loadWallet();
        await loadTransactions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWithdrawLoading(false);
    }
  };

  // ===============================
  // CALCULATIONS
  // ===============================

  const goldValue =
    wallet.goldBalance * settings.sellGoldPrice;

  const usdtValue =
    wallet.usdtBalance * 285;

  const totalPortfolio =
    wallet.walletBalance + goldValue + usdtValue;

  const filteredTransactions = transactions.filter(
    (transaction) =>
      `${transaction.transactionType || transaction.type || ""} ${
        transaction.status
      } ${transaction.provider || ""}`
        .toLowerCase()
        .includes(transactionSearch.toLowerCase())
  );  // ===============================
  // LOADING SCREEN
  // ===============================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading Wallet...
      </main>
    );
  }

  // ===============================
  // UI
  // ===============================

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <Wallet size={38} />
              My Wallet
            </h1>

            <p className="text-gray-400 mt-2">
              Manage PKR, Gold and USDT balances securely.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <button
              onClick={() => {
                loadWallet();
                loadTransactions();
              }}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </header>

        {/* Wallet Status */}
        <section
          className={`rounded-2xl p-5 border ${
            wallet.walletFrozen
              ? "bg-red-950 border-red-500"
              : "bg-green-950 border-green-500"
          }`}
        >
          <h2 className="text-xl font-bold">
            {wallet.walletFrozen ? "Wallet Frozen" : "Wallet Active"}
          </h2>

          <p className="text-gray-300 mt-2">
            {wallet.walletFrozen
              ? "Your wallet is temporarily restricted."
              : "Your wallet is active and ready for Gold & USDT trading."}
          </p>
        </section>

        {/* Balance Cards */}
        <section className="grid md:grid-cols-3 gap-5">
          <BalanceCard
            icon={<Wallet size={30} />}
            label="PKR Balance"
            value={`PKR ${wallet.walletBalance.toLocaleString()}`}
            color="text-green-400"
          />

          <BalanceCard
            icon={<Coins size={30} />}
            label="Gold Balance"
            value={`${wallet.goldBalance.toFixed(2)} g`}
            color="text-yellow-400"
          />

          <BalanceCard
            icon={<DollarSign size={30} />}
            label="USDT Balance"
            value={wallet.usdtBalance.toFixed(2)}
            color="text-blue-400"
          />
        </section>

        {/* Portfolio */}
        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6 flex justify-between items-center">
          <div>
            <p className="text-gray-400">Total Portfolio Value</p>

            <h2 className="text-4xl font-black text-purple-400 mt-2">
              PKR {Math.round(totalPortfolio).toLocaleString()}
            </h2>

            <p className="text-sm text-gray-500 mt-2">
              Gold Rate : PKR {settings.sellGoldPrice.toLocaleString()} / Gram
            </p>
          </div>

          <Landmark className="text-purple-400" size={42} />
        </section>

        {/* Deposit & Withdraw */}
        <section className="grid lg:grid-cols-2 gap-6">

          <ActionPanel title="Deposit Funds" color="green">

            <input
              type="number"
              min={1}
              value={depositAmount}
              onChange={(e) =>
                setDepositAmount(Number(e.target.value))
              }
              className="input"
              placeholder="Deposit Amount"
            />

            <select
              value={depositMethod}
              onChange={(e) => setDepositMethod(e.target.value)}
              className="input"
            >
              <option value="BANK">Bank Transfer</option>
              <option value="USDT">USDT</option>
              <option value="BINANCE">Binance Pay</option>
            </select>

            <button
              disabled={depositLoading}
              onClick={createDepositRequest}
              className="action-button bg-green-600"
            >
              {depositLoading ? "Submitting..." : "Submit Deposit"}
            </button>

            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={(e) =>
                setDepositImage(e.target.files?.[0] || null)
              }
            />

            <button
              disabled={uploadingDeposit || !depositImage}
              onClick={uploadDepositProof}
              className="action-button bg-yellow-500 text-black"
            >
              {uploadingDeposit
                ? "Uploading..."
                : "Upload Deposit Proof"}
            </button>

          </ActionPanel>

          <ActionPanel title="Withdraw Funds" color="red">

            <input
              type="number"
              min={500}
              value={withdrawAmount}
              onChange={(e) =>
                setWithdrawAmount(Number(e.target.value))
              }
              className="input"
              placeholder="Withdraw Amount"
            />

            <select
              value={withdrawMethod}
              onChange={(e) => setWithdrawMethod(e.target.value)}
              className="input"
            >
              <option value="BANK">Bank Transfer</option>
              <option value="USDT">USDT</option>
            </select>

            <input
              value={withdrawAccount}
              onChange={(e) => setWithdrawAccount(e.target.value)}
              placeholder="Bank Account / Wallet Address"
              className="input"
            />

            <button
              disabled={withdrawLoading}
              onClick={submitWithdrawal}
              className="action-button bg-red-600"
            >
              {withdrawLoading
                ? "Submitting..."
                : "Submit Withdrawal"}
            </button>

          </ActionPanel>
        </section>

        {/* Transaction History */}
        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6">

          <div className="flex flex-wrap justify-between gap-4 mb-5">
            <h2 className="text-2xl font-black text-cyan-400">
              Transaction History
            </h2>

            <input
              value={transactionSearch}
              onChange={(e) =>
                setTransactionSearch(e.target.value)
              }
              placeholder="Search transactions..."
              className="input max-w-sm"
            />
          </div>

          {transactionLoading ? (
            <p className="text-gray-400">
              Loading transactions...
            </p>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-700 text-cyan-400">
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-5 text-center text-gray-500"
                      >
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr
                        key={tx._id}
                        className="border-b border-zinc-800"
                      >
                        <td className="p-3">
                          {tx.transactionType ||
                            tx.type ||
                            "TRANSACTION"}
                        </td>

                        <td className="p-3 font-semibold text-green-400">
                          PKR{" "}
                          {(
                            tx.amountPkr ??
                            tx.amount ??
                            0
                          ).toLocaleString()}
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              tx.status === "Approved" ||
                              tx.status === "Completed"
                                ? "bg-green-600"
                                : tx.status === "Rejected"
                                ? "bg-red-600"
                                : "bg-yellow-500 text-black"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>

                        <td className="p-3 text-gray-400">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

// ===============================
// BALANCE CARD
// ===============================

function BalanceCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6">
      <div className={`${color} mb-4`}>{icon}</div>

      <p className="text-gray-400">{label}</p>

      <h2 className={`text-3xl font-black mt-2 ${color}`}>
        {value}
      </h2>
    </div>
  );
}

// ===============================
// ACTION PANEL
// ===============================

function ActionPanel({
  title,
  color,
  children,
}: {
  title: string;
  color: "green" | "red";
  children: React.ReactNode;
}) {
  const border =
    color === "green"
      ? "border-green-500"
      : "border-red-500";

  const heading =
    color === "green"
      ? "text-green-400"
      : "text-red-400";

  return (
    <section
      className={`bg-zinc-900 border ${border} rounded-2xl p-6 space-y-4`}
    >
      <h2 className={`text-2xl font-black ${heading}`}>
        {title}
      </h2>

      {children}
    </section>
  );
}


