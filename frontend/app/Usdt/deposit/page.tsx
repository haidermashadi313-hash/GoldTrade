"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { ArrowDownCircle, ArrowLeft, Copy, RefreshCcw, Upload, Wallet } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
const MINIMUM = 10;
const ADDRESS = "TDK38X1JK83LSJDK8388ABCD9911TRC20";

type Deposit = {
  _id: string;
  amount: number;
  transactionId: string;
  status: string;
  createdAt: string;
};

export default function DepositUSDTPage() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [balance, setBalance] = useState(0);
  const [price, setPrice] = useState(1);
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [history, setHistory] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<Deposit | null>(null);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);
  const total = (Number(amount) || 0) * price;

  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
    setUsername(localStorage.getItem("username") || "");
  }, []);

  const loadWallet = async () => {
    if (!username || !token) return;
    const response = await fetch(`${API}/api/users/${encodeURIComponent(username)}`, { headers });
    const data = await response.json();
    if (response.status === 401) {
      localStorage.clear();
      window.location.replace("/login");
      return;
    }
    if (data.success) setBalance(Number(data.data?.walletBalance || data.data?.balance || 0));
  };

  const loadPrice = async () => {
    const response = await fetch(`${API}/api/settings/market`, { headers });
    const data = await response.json();
    if (data.success) setPrice(Number(data.data?.depositUsdtPrice || data.data?.buyUsdtPrice || 1));
  };

  const loadHistory = async () => {
    if (!token) return;
    try {
      setHistoryLoading(true);
      const response = await fetch(`${API}/api/deposit`, { headers });
      const data = await response.json();
      if (response.ok && data.success) setHistory(data.deposits || []);
    } catch (loadError) {
      console.error("Deposit history error:", loadError);
    } finally {
      setHistoryLoading(false);
    }
  };

  const refresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadWallet(), loadPrice(), loadHistory()]);
    } catch (loadError) {
      console.error("Deposit refresh error:", loadError);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void (async () => {
      setLoading(true);
      await refresh();
      setLoading(false);
    })();
  }, [token, username]);

  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("Please upload an image only.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }
    setError("");
    setFile(selected);
    setFileUrl("");
  };

  const uploadFile = async () => {
    if (!file) return "";
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    if (!cloudName) throw new Error("Cloudinary is not configured.");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || "goldtrade");
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || !data.secure_url) throw new Error(data.error?.message || "Image upload failed.");
      setFileUrl(data.secure_url);
      return data.secure_url as string;
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setError("");
    const quantity = Number(amount);
    if (!quantity || quantity < MINIMUM) {
      setError(`Minimum deposit amount is ${MINIMUM} USDT.`);
      return;
    }
    if (transactionId.trim().length < 8) {
      setError("Enter a valid transaction ID.");
      return;
    }
    if (!file) {
      setError("Please upload your payment screenshot.");
      return;
    }
    if (!confirmed) {
      setError("Confirm that you sent the exact amount before submitting.");
      return;
    }
    try {
      setSubmitting(true);
      const screenshot = fileUrl || await uploadFile();
      const response = await fetch(`${API}/api/deposit`, {
        method: "POST",
        headers,
        body: JSON.stringify({ amount: quantity, walletType: "USDT", transactionId: transactionId.trim(), screenshot, paymentNote: note.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Deposit request failed.");
      setSuccess(data.deposit);
      setAmount("");
      setTransactionId("");
      setNote("");
      setFile(null);
      setFileUrl("");
      setConfirmed(false);
      await loadHistory();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Deposit request failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-yellow-500 bg-zinc-950 px-5 py-4">
        <button aria-label="Go back" onClick={() => window.history.back()} className="text-yellow-400"><ArrowLeft /></button>
        <div className="text-center"><h1 className="text-2xl font-black text-yellow-400">Deposit USDT</h1><p className="text-xs text-zinc-500">GoldTrade secure deposit</p></div>
        <button aria-label="Refresh" onClick={() => void refresh()} disabled={refreshing} className="text-yellow-400"><RefreshCcw className={refreshing ? "animate-spin" : ""} /></button>
      </header>
      <div className="mx-auto max-w-xl space-y-5 p-5">
        <section className="rounded-3xl border border-yellow-500 bg-zinc-900 p-5"><div className="mb-3 flex items-center gap-3 text-zinc-300"><Wallet className="text-green-400" /> Wallet balance</div><p className="text-4xl font-black text-green-400">{loading ? "Loading..." : `${balance.toFixed(2)} USDT`}</p></section>
        <section className="rounded-3xl border border-cyan-700 bg-zinc-900 p-5"><div className="mb-2 flex items-center gap-3 text-zinc-300"><ArrowDownCircle className="text-cyan-400" /> Current deposit price</div><p className="text-3xl font-black text-yellow-300">${price.toFixed(2)}</p></section>
        <section className="space-y-4 rounded-3xl border border-yellow-500 bg-zinc-900 p-5"><h2 className="text-xl font-bold text-yellow-400">Send USDT on TRC20</h2><p className="text-sm text-zinc-400">Send the exact amount to the official address, then submit your transaction details.</p><div className="rounded-2xl border border-zinc-700 bg-black p-4"><p className="text-xs text-zinc-500">Receiving address</p><p className="mt-2 break-all font-semibold text-green-400">{ADDRESS}</p><button onClick={() => void navigator.clipboard.writeText(ADDRESS)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-yellow-500 py-3 font-bold text-black"><Copy size={18} /> Copy address</button></div><label className="block text-sm font-semibold text-zinc-300">USDT amount<div className="mt-2 flex items-center rounded-2xl border border-zinc-700 bg-black px-4"><span className="text-yellow-400">$</span><input type="number" min={MINIMUM} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Minimum 10 USDT" className="w-full bg-transparent p-4 text-xl outline-none" /></div></label><p className="text-right text-sm text-zinc-500">Total value: <strong className="text-yellow-300">${total.toFixed(2)}</strong></p></section>
        <section className="space-y-4 rounded-3xl border border-zinc-700 bg-zinc-900 p-5"><h2 className="text-xl font-bold text-yellow-400">Payment information</h2><label className="block text-sm text-zinc-400">Transaction ID *<input value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="Paste transaction ID" className="mt-2 w-full rounded-xl border border-zinc-700 bg-black p-3 outline-none focus:border-yellow-500" /></label><label className="block text-sm text-zinc-400">Payment note (optional)<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-2 w-full resize-none rounded-xl border border-zinc-700 bg-black p-3 outline-none focus:border-yellow-500" /></label><label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-yellow-500 p-6 text-center"><Upload className="mb-2 text-yellow-400" /><span className="font-semibold">Upload payment screenshot</span><span className="text-xs text-zinc-500">PNG, JPG, or WEBP up to 5 MB</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseFile} className="hidden" /></label>{file && <p className="truncate text-sm text-green-400">Selected: {file.name}</p>}<label className="flex gap-3 text-sm leading-6 text-zinc-300"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1 h-5 w-5 accent-yellow-500" /> I confirm that I sent the exact amount to the official GoldTrade TRC20 address.</label>{error && <p role="alert" className="rounded-xl border border-red-500 bg-red-950 p-3 text-sm text-red-200">{error}</p>}<button onClick={() => void submit()} disabled={submitting || uploading} className="w-full rounded-2xl bg-yellow-500 py-4 font-black text-black disabled:bg-zinc-700 disabled:text-zinc-500">{submitting || uploading ? "Processing..." : "Submit deposit request"}</button></section>
        <section className="space-y-4 rounded-3xl border border-zinc-700 bg-zinc-900 p-5"><div className="flex justify-between"><h2 className="text-xl font-bold text-yellow-400">Recent deposits</h2><button onClick={() => void loadHistory()} className="text-sm text-yellow-400">Refresh</button></div>{historyLoading ? <p className="text-zinc-500">Loading...</p> : history.length === 0 ? <p className="text-zinc-500">No deposit requests yet.</p> : history.slice(0, 5).map((deposit) => <article key={deposit._id} className="rounded-2xl border border-zinc-800 bg-black p-4"><div className="flex justify-between"><strong className="text-green-400">{deposit.amount} USDT</strong><span className="text-yellow-400">{deposit.status}</span></div><p className="mt-2 truncate text-xs text-zinc-500">{deposit.transactionId}</p><p className="mt-2 text-xs text-zinc-600">{new Date(deposit.createdAt).toLocaleString()}</p></article>)}</section>
      </div>
      {success && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"><div className="w-full max-w-md space-y-4 rounded-3xl border border-green-500 bg-zinc-900 p-6"><h2 className="text-2xl font-black text-green-400">Deposit submitted</h2><p className="text-sm text-zinc-300">Your request is waiting for admin verification.</p><p>Amount: <strong>{success.amount} USDT</strong></p><button onClick={() => setSuccess(null)} className="w-full rounded-xl bg-green-500 py-3 font-bold text-black">Done</button></div></div>}
    </main>
  );
}
