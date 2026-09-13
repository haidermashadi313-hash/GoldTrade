"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Wallet,
  CircleDollarSign,
  RefreshCw,
  Copy,
  CheckCircle,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface PaymentMethod {
  _id?: string;
  name: string;
  type: "BANK" | "EASYPAISA" | "NAYAPAY" | "USDT";
  accountName: string;
  accountNumber: string;
  network?: string;
  qrCode?: string;
}

export default function BuyUsdtPage() {
  const [username, setUsername] = useState("");
  const [walletBalance, setWalletBalance] = useState(0);

  const [walletAddress, setWalletAddress] = useState("");
  const [pkrAmount, setPkrAmount] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);

  const [buyRate, setBuyRate] = useState(282.4);

  const [network, setNetwork] = useState("TRC20");
  const [loading, setLoading] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      name: "Meezan Bank",
      type: "BANK",
      accountName: "GoldTrade Pvt Ltd",
      accountNumber: "0300123456789",
    },
    {
      name: "EasyPaisa",
      type: "EASYPAISA",
      accountName: "GoldTrade Pvt Ltd",
      accountNumber: "03123456789",
    },
    {
      name: "NayaPay",
      type: "NAYAPAY",
      accountName: "GoldTrade Pvt Ltd",
      accountNumber: "03211234567",
    },
    {
      name: "USDT TRC20",
      type: "USDT",
      accountName: "GoldTrade Wallet",
      accountNumber: "TGOLDTRADETRC20XXXXXXXXXXXXXXX",
      network: "TRC20",
    },
  ]);

  const [selectedMethod, setSelectedMethod] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("username");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    if (savedUser) {
      setUsername(savedUser);
      loadData(savedUser);
    }
  }, []);

  const loadData = async (user: string) => {
    try {
      const walletRes = await fetch(`${API}/api/wallets/${user}`);

      if (walletRes.ok) {
        const wallet = await walletRes.json();
        setWalletBalance(wallet.walletBalance || 0);
      }

      const rateRes = await fetch(`${API}/api/usdt/rate`);

      if (rateRes.ok) {
        const rate = await rateRes.json();

        if (rate.success) {
          setBuyRate(rate.rate.buyRate);
        }
      }

      const paymentRes = await fetch(
        `${API}/api/admin/payment-settings`
      );

      if (paymentRes.ok) {
        const payment = await paymentRes.json();

        if (payment.success && payment.methods?.length) {
          setPaymentMethods(payment.methods);
        }
      }

    } catch (err) {
      console.log(err);
    }
  };

  const usdtAmount = useMemo(() => {
    return Number(pkrAmount) > 0
      ? Number(pkrAmount) / buyRate
      : 0;
  }, [pkrAmount, buyRate]);

  const selectedPayment = paymentMethods[selectedMethod];

  const copyNumber = () => {
    navigator.clipboard.writeText(selectedPayment.accountNumber);
    alert("Copied.");
  };

  const submitRequest = async () => {
    if (!walletAddress || !pkrAmount || !receipt) {
      alert("Please complete all fields.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("username", username);
      formData.append("walletAddress", walletAddress);
      formData.append("network", network);
      formData.append("paymentMethod", selectedPayment.type);
      formData.append("pkrAmount", pkrAmount);
      formData.append("usdtAmount", usdtAmount.toFixed(2));
      formData.append("receipt", receipt);

      const res = await fetch(`${API}/api/usdt/buy`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("USDT Buy Request Submitted.");

        setWalletAddress("");
        setPkrAmount("");
        setReceipt(null);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Server Error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-6">

      {/* HEADER */}

      <div className="flex justify-between items-center flex-wrap gap-4 mb-8">

        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-yellow-400"
        >
          <ArrowLeft size={20}/>
          Dashboard
        </Link>

        <button
          onClick={() => loadData(username)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl flex items-center gap-2"
        >
          <RefreshCw size={18}/>
          Refresh Rate
        </button>

      </div>

      <h1 className="text-4xl font-black text-yellow-400 mb-2">
        Buy USDT (TRC20)
      </h1>

      <p className="text-gray-400 mb-8">
        Buy USDT securely through GoldTrade Enterprise.
      </p>

      {/* TOP CARDS */}

      <div className="grid md:grid-cols-2 gap-6 mb-8">

        <div className="bg-zinc-900 border border-green-500 rounded-3xl p-6">

          <div className="flex items-center gap-3 mb-4">
            <Wallet className="text-green-400"/>
            <h2 className="font-bold text-xl text-green-400">
              Wallet Balance
            </h2>
          </div>

          <h1 className="text-4xl font-black">
            PKR {walletBalance.toLocaleString()}
          </h1>

        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-700 rounded-3xl p-6 text-black">

          <div className="flex items-center gap-3 mb-4">
            <CircleDollarSign size={30}/>
            <h2 className="font-bold text-xl">
              Live Buy Rate
            </h2>
          </div>

          <h1 className="text-5xl font-black">
            PKR {buyRate}
          </h1>

          <p className="opacity-80 mt-2">
            1 USDT = PKR {buyRate}
          </p>

        </div>

      </div>

      {/* PAYMENT METHOD */}

      <div className="bg-zinc-900 border border-cyan-500 rounded-3xl p-6 mb-8">

        <h2 className="text-2xl font-black text-cyan-400 mb-5">
          Choose Payment Method
        </h2>

        <div className="grid md:grid-cols-2 gap-4">

          {paymentMethods.map((method, index) => (
            <button
              key={index}
              onClick={() => setSelectedMethod(index)}
              className={`border rounded-2xl p-4 text-left transition ${
                selectedMethod === index
                  ? "border-yellow-500 bg-yellow-500/10"
                  : "border-zinc-700 bg-black hover:border-yellow-500"
              }`}
            >
              <h3 className="font-bold text-lg text-yellow-400">
                {method.name}
              </h3>

              <p className="text-gray-400 mt-2">
                {method.accountName}
              </p>
            </button>
          ))}

        </div>

        {/* PAYMENT DETAILS */}

        <div className="mt-6 bg-black border border-yellow-500 rounded-2xl p-5">

          <div className="flex justify-between items-center flex-wrap gap-3">

            <div>
              <h3 className="text-xl font-bold text-yellow-400">
                {selectedPayment.name}
              </h3>

              <p className="text-gray-400 mt-2">
                {selectedPayment.accountName}
              </p>
            </div>

            <button
              onClick={copyNumber}
              className="bg-yellow-500 text-black px-4 py-2 rounded-xl flex items-center gap-2"
            >
              <Copy size={16}/>
              Copy
            </button>

          </div>

          <div className="mt-4 bg-zinc-900 rounded-xl p-4 break-all">
            {selectedPayment.accountNumber}
          </div>

          {selectedPayment.type === "USDT" && (
            <p className="text-cyan-400 mt-3">
              Network : {selectedPayment.network}
            </p>
          )}

        </div>

      </div>

      {/* BUY FORM */}

      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 space-y-5">

        <div>
          <label className="text-sm text-gray-400">
            Username
          </label>

          <input
            disabled
            value={username}
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">
            Your TRC20 Wallet Address
          </label>

          <input
            value={walletAddress}
            onChange={(e) =>
              setWalletAddress(e.target.value)
            }
            placeholder="TXXXXXXXXXXXXXX"
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2"
          />
        </div>

        {/* NETWORK */}

        <div>
          <label className="text-sm text-gray-400">
            USDT Network
          </label>

          <div className="grid grid-cols-3 gap-3 mt-3">

            {["TRC20", "BEP20", "ERC20"].map((item) => (
              <button
                key={item}
                onClick={() => setNetwork(item)}
                className={`rounded-xl py-3 font-bold border ${
                  network === item
                    ? "bg-cyan-500 text-black border-cyan-500"
                    : "border-zinc-700 bg-black text-white"
                }`}
              >
                {item}
              </button>
            ))}

          </div>

        </div>

        <div>
          <label className="text-sm text-gray-400">
            PKR Amount
          </label>

          <input
            type="number"
            value={pkrAmount}
            onChange={(e) =>
              setPkrAmount(e.target.value)
            }
            placeholder="5000"
            className="w-full bg-black border border-zinc-700 rounded-xl p-3 mt-2"
          />
        </div>

        {/* CALCULATOR */}

        <div className="bg-zinc-800 rounded-3xl border border-cyan-500 p-6">

          <div className="flex items-center gap-3 mb-4">
            <Wallet className="text-cyan-400"/>
            <h2 className="font-black text-cyan-400 text-xl">
              You Will Receive
            </h2>
          </div>

          <h1 className="text-5xl font-black">
            {usdtAmount.toFixed(2)} USDT
          </h1>

          <div className="mt-4 space-y-2 text-gray-400">

            <div className="flex justify-between">
              <span>Buy Rate</span>
              <span>PKR {buyRate}</span>
            </div>

            <div className="flex justify-between">
              <span>Network</span>
              <span>{network}</span>
            </div>

            <div className="flex justify-between">
              <span>Payment Method</span>
              <span>{selectedPayment.name}</span>
            </div>

          </div>

        </div>

        {/* RECEIPT */}

        <div>

          <label className="text-sm text-gray-400">
            Upload Payment Receipt
          </label>

          <div className="border-2 border-dashed border-yellow-500 rounded-3xl p-6 text-center mt-2">

            <Upload
              className="mx-auto text-yellow-400 mb-4"
              size={40}
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setReceipt(e.target.files?.[0] || null)
              }
            />

            {receipt && (
              <div className="mt-5">

                <img
                  src={URL.createObjectURL(receipt)}
                  alt="Receipt"
                  className="mx-auto rounded-xl max-h-48"
                />

                <p className="text-green-400 mt-3 flex justify-center items-center gap-2">
                  <CheckCircle size={18}/>
                  {receipt.name}
                </p>

              </div>
            )}

          </div>

        </div>

        {/* SUBMIT */}

        <button
          onClick={submitRequest}
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl text-xl font-black transition"
        >
          {loading
            ? "Submitting Request..."
            : "Submit Buy USDT Request"}
        </button>

      </div>

      {/* FOOTER */}

      <div className="mt-10 bg-zinc-900 border border-green-500 rounded-3xl p-6">

        <h2 className="text-2xl font-black text-green-400 mb-4">
          GoldTrade Security Notice
        </h2>

        <ul className="space-y-2 text-gray-400 text-sm">
          <li>• Send payment only to GoldTrade official accounts.</li>
          <li>• Upload a clear payment screenshot.</li>
          <li>• USDT requests require Admin approval.</li>
          <li>• Approved USDT will appear in your wallet automatically.</li>
        </ul>

      </div>

    </main>
  );
}