"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coins, DollarSign, Landmark, RefreshCw, wallet } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface walletData {
  walletBalance: number;
  goldBalance: number;
  UsdtBalance: number;
  walletFrozen: boolean;
}

interface walletTransaction {
  _id: string;
  transactionType?: string;
  type?: string;
  amountPkr?: number;
  amount?: number;
  status: string;
  provider?: string;
  createdAt: string;
}

interface Settings {
  buyGoldPrice: number;
  sellGoldPrice: number;
}

const emptywallet: walletData = { walletBalance: 0, goldBalance: 0, UsdtBalance: 0, walletFrozen: false };
const defaultSettings: Settings = { buyGoldPrice: 31250, sellGoldPrice: 30980 };

export default function walletPage() {
  const [token] = useState(() => typeof window === "undefined" ? "" : localStorage.getItem("token") || "");
  const [wallet, setwallet] = useState(emptywallet);
  const [settings, setSettings] = useState(defaultSettings);
  const [transactions, setTransactions] = useState<walletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [depositAmount, setDepositAmount] = useState(1000);
  const [depositMethod, setDepositMethod] = useState("BANK");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositImage, setDepositImage] = useState<File | null>(null);
  const [uploadingDeposit, setUploadingDeposit] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(1000);
  const [withdrawMethod, setWithdrawMethod] = useState("BANK");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

 const loadwallet = async () => {
  try {
    setLoading(true);

    const [walletResponse, priceResponse] = await Promise.all([
      fetch(`${API}/api/wallet/balance`, {
        headers: authHeaders(),
      }),
      fetch(`${API}/api/gold/price`),
    ]);

    const walletData = await walletResponse.json();
    const priceData = await priceResponse.json();

    if (walletResponse.ok) {
      setwallet({
        walletBalance: walletData.walletBalance || 0,
        goldBalance: walletData.goldBalance || 0,
        UsdtBalance: walletData.UsdtBalance || 0,
        walletFrozen: walletData.walletFrozen || false,
      });
    }

    if (priceResponse.ok) {
      setSettings({
        buyGoldPrice: priceData.buyPrice || 31250,
        sellGoldPrice: priceData.sellPrice || 30980,
      });
    }
  } catch (error) {
    console.error("wallet Load Error:", error);
  } finally {
    setLoading(false);
  }
};

  const loadTransactions = async () => {
  try {
    setTransactionLoading(true);

    const response = await fetch(`${API}/api/transactions/history`, {
      headers: authHeaders(),
    });

    const data = await response.json();

    if (response.ok) {
      setTransactions(data.transactions || []);
    } else {
      setTransactions([]);
    }
  } catch (error) {
    console.error("Transaction Error:", error);
    setTransactions([]);
  } finally {
    setTransactionLoading(false);
  }
};

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadwallet();
      void loadTransactions();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submitRequest = async (url: string, body: BodyInit, isForm = false) => {
    const response = await fetch(`${API}${url}`, {
      method: "POST",
      headers: isForm ? authHeaders() : { ...authHeaders(), "Content-Type": "application/json" },
      body,
    });
    return response.json();
  };

  const createDepositRequest = async () => {
    if (depositAmount <= 0) return;
    try {
      setDepositLoading(true);
      const data = await submitRequest("/api/deposit/create", JSON.stringify({ amount: depositAmount, method: depositMethod }));
      if (data.success) {
        await loadwallet();
        await loadTransactions();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setDepositLoading(false);
    }
  };

  const uploadDepositProof = async () => {
    if (!depositImage) return;
    try {
      setUploadingDeposit(true);
      const formData = new FormData();
      formData.append("image", depositImage);
      formData.append("amount", String(depositAmount));
      formData.append("method", depositMethod);
      const data = await submitRequest("/api/deposit/upload-proof", formData, true);
      if (data.success) {
        setDepositImage(null);
        await loadTransactions();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingDeposit(false);
    }
  };

  const submitWithdrawal = async () => {
    if (withdrawAmount < 500 || withdrawAmount > wallet.walletBalance || !withdrawAccount.trim()) return;
    try {
      setWithdrawLoading(true);
      const data = await submitRequest("/api/withdrawals/create", JSON.stringify({ amount: withdrawAmount, method: withdrawMethod, account: withdrawAccount }));
      if (data.success) {
        setWithdrawAccount("");
        await loadwallet();
        await loadTransactions();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const goldValue = wallet.goldBalance * settings.sellGoldPrice;
  const UsdtValue = wallet.UsdtBalance * 285;
  const totalPortfolio = wallet.walletBalance + goldValue + UsdtValue;
  const filteredTransactions = transactions.filter((transaction) =>
    `${transaction.transactionType || transaction.type || ""} ${transaction.status} ${transaction.provider || ""}`
      .toLowerCase()
      .includes(transactionSearch.toLowerCase()),
  );

  if (loading) {
    return <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400"><RefreshCw className="animate-spin mr-3" />Loading wallet...</main>;
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center flex-wrap gap-4">
          <div><h1 className="text-4xl font-black text-yellow-400 flex items-center gap-3"><wallet size={38} />My wallet</h1><p className="text-gray-400 mt-2">Manage Pkr, gold, and Usdt balances.</p></div>
          <div className="flex gap-3"><Link href="/dashboard" className="bg-zinc-800 px-4 py-3 rounded-xl flex items-center gap-2 font-bold"><ArrowLeft size={18} />Dashboard</Link><button onClick={() => { void loadwallet(); void loadTransactions(); }} className="bg-yellow-500 text-black px-4 py-3 rounded-xl flex items-center gap-2 font-bold"><RefreshCw size={18} />Refresh</button></div>
        </header>
        <div className={`rounded-2xl p-4 border ${wallet.walletFrozen ? "bg-red-950 border-red-500" : "bg-green-950 border-green-500"}`}><strong>{wallet.walletFrozen ? "wallet Frozen" : "wallet Active"}</strong><p className="text-sm text-gray-300 mt-1">{wallet.walletFrozen ? "wallet actions are currently restricted." : "Your wallet is ready for trading."}</p></div>
        <section className="grid md:grid-cols-3 gap-5"><BalanceCard icon={<wallet />} label="Pkr Balance" value={`Pkr ${wallet.walletBalance.toLocaleString()}`} color="text-green-400" /><BalanceCard icon={<Coins />} label="Gold Balance" value={`${wallet.goldBalance.toFixed(2)} g`} color="text-yellow-400" /><BalanceCard icon={<DollarSign />} label="Usdt Balance" value={wallet.UsdtBalance.toFixed(2)} color="text-blue-400" /></section>
        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6 flex items-center justify-between"><div><p className="text-gray-400">Total Portfolio Value</p><h2 className="text-4xl font-black text-purple-400 mt-2">Pkr {Math.round(totalPortfolio).toLocaleString()}</h2></div><Landmark className="text-purple-400" size={36} /></section>
        <section className="grid lg:grid-cols-2 gap-6"><ActionPanel title="Deposit Funds" color="green"><input type="number" min="1" value={depositAmount} onChange={(event) => setDepositAmount(Number(event.target.value))} className="input" /><select value={depositMethod} onChange={(event) => setDepositMethod(event.target.value)} className="input"><option value="BANK">Bank Transfer</option><option value="Usdt">Usdt</option><option value="BINANCE">Binance Pay</option></select><button disabled={depositLoading} onClick={() => void createDepositRequest()} className="action-button bg-green-600">{depositLoading ? "Submitting..." : "Submit Deposit"}</button><input type="file" accept="image/*" onChange={(event) => setDepositImage(event.target.files?.[0] || null)} className="input" /><button disabled={uploadingDeposit || !depositImage} onClick={() => void uploadDepositProof()} className="action-button bg-yellow-500 text-black">{uploadingDeposit ? "Uploading..." : "Upload Deposit Proof"}</button></ActionPanel><ActionPanel title="Withdraw Funds" color="red"><input type="number" min="500" value={withdrawAmount} onChange={(event) => setWithdrawAmount(Number(event.target.value))} className="input" /><select value={withdrawMethod} onChange={(event) => setWithdrawMethod(event.target.value)} className="input"><option value="BANK">Bank Transfer</option><option value="Usdt">Usdt</option></select><input value={withdrawAccount} onChange={(event) => setWithdrawAccount(event.target.value)} placeholder="Bank account or wallet address" className="input" /><button disabled={withdrawLoading} onClick={() => void submitWithdrawal()} className="action-button bg-red-600">{withdrawLoading ? "Submitting..." : "Submit Withdrawal"}</button></ActionPanel></section>
        <section className="bg-zinc-900 border border-cyan-500 rounded-2xl p-6"><div className="flex justify-between items-center gap-4 mb-5"><h2 className="text-2xl font-black text-cyan-400">Transaction history</h2><input value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} placeholder="Search transactions" className="input max-w-xs" /></div>{transactionLoading ? <p className="text-gray-400">Loading transactions...</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-zinc-700 text-cyan-400"><th className="p-3">Type</th><th className="p-3">Amount</th><th className="p-3">Status</th><th className="p-3">Date</th></tr></thead><tbody>{filteredTransactions.map((transaction) => <tr key={transaction._id} className="border-b border-zinc-800"><td className="p-3">{transaction.transactionType || transaction.type || "TRANSACTION"}</td><td className="p-3">Pkr {(transaction.amountPkr ?? transaction.amount ?? 0).toLocaleString()}</td><td className="p-3">{transaction.status}</td><td className="p-3 text-gray-400">{new Date(transaction.createdAt).toLocaleString()}</td></tr>)}</tbody></table></div>}</section>
      </div>
    </main>
  );
}

function BalanceCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6"><div className={`${color} mb-4`}>{icon}</div><p className="text-gray-400">{label}</p><h2 className={`text-3xl font-black mt-2 ${color}`}>{value}</h2></div>;
}

function ActionPanel({ title, color, children }: { title: string; color: "green" | "red"; children: React.ReactNode }) {
  return <section className={`bg-zinc-900 border border-${color}-500 rounded-2xl p-6 space-y-4`}><h2 className={`text-2xl font-black text-${color}-400`}>{title}</h2>{children}</section>;
}
