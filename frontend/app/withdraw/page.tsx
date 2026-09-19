"use client";

import { useEffect, useState } from "react";
import {
  wallet,
  ArrowUpRight,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

// ==========================================
// GoldTrade API V18
// ==========================================
const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ==========================================
// TYPES
// ==========================================
interface WithdrawItem {
  _id: string;
  requestAmount: number;
  adminAmount: number;
  currency: string;
  paymentMethod: string;
  accountTitle: string;
  accountNumber: string;
  bankName: string;
  network: string;
  note: string;
  adminNote: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
}

export default function WithdrawPage() {

  // ================= USER SESSION =================
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");

  // ================= wallet =================
  const [walletBalance, setwalletBalance] = useState(0);

  // ================= FORM =================
  const [requestAmount, setRequestAmount] = useState("");
  const [currency, setCurrency] = useState("Pkr");
  const [paymentMethod, setPaymentMethod] = useState("JazzCash");

  const [accountTitle, setAccountTitle] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [note, setNote] = useState("");

  // ================= UI =================
  const [loadingwallet, setLoadingwallet] = useState(true);
  const [loadinghistory, setLoadinghistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [history, sethistory] = useState<WithdrawItem[]>([]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  // ==========================================
  // LOAD SESSION
  // ==========================================
  useEffect(() => {
    const jwt = localStorage.getItem("token");
    const user = localStorage.getItem("username");

    if (!jwt || !user) {
      window.location.href = "/login";
      return;
    }

    setToken(jwt);
    setUsername(user);
  }, []);

  // ==========================================
// LOAD wallet BALANCE (100% FIXED V18)
// ==========================================
const loadwallet = async () => {
  const jwt = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  if (!jwt || !username) return;

  try {
    setLoadingwallet(true);

    const response = await fetch(`${API}/api/users/${username}`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      cache: "no-store",
    });

    const result = await response.json();

    console.log("USER API RESPONSE:", result);

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to load wallet.");
    }

    // API response uses "data"
    setwalletBalance(Number(result.data?.walletBalance ?? 0));

  } catch (err) {
    console.error("wallet Error:", err);
    setwalletBalance(0);
  } finally {
    setLoadingwallet(false);
  }
};

  // ==========================================
  // LOAD WITHDRAW history
  // ==========================================
  const loadhistory = async () => {
    const jwt = localStorage.getItem("token");

    if (!jwt) return;

    try {
      setLoadinghistory(true);

      const response = await fetch(
        `${API}/api/withdraw/history`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        sethistory(data.data || []);
      }

    } catch (err) {
      console.error("Withdraw history Error:", err);
    } finally {
      setLoadinghistory(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadwallet();
      loadhistory();
    }
  }, [token]);
    // ==========================================
  // SUBMIT WITHDRAW REQUEST
  // ==========================================
  const handleWithdraw = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setMessage("");

    const amount = Number(requestAmount);

    if (!amount || amount <= 0) {
      setMessageType("error");
      setMessage("Enter a valid withdraw amount.");
      return;
    }

    if (amount > walletBalance) {
      setMessageType("error");
      setMessage("Withdraw amount is greater than wallet balance.");
      return;
    }

    if (!accountTitle.trim() || !accountNumber.trim()) {
      setMessageType("error");
      setMessage("Account title and account number are required.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API}/api/withdraw`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          requestAmount: amount,
          currency,
          paymentMethod,
          accountTitle,
          accountNumber,
          bankName,
          network,
          note,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Withdraw request failed.");
      }

      setMessageType("success");
      setMessage("Withdraw request submitted successfully.");

      // Reset Form
      setRequestAmount("");
      setAccountTitle("");
      setAccountNumber("");
      setBankName("");
      setNetwork("TRC20");
      setNote("");

      // Refresh wallet + history
      loadwallet();
      loadhistory();

    } catch (err: any) {
      console.error(err);

      setMessageType("error");
      setMessage(err.message || "Unable to submit withdraw request.");
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // UI START
  // ==========================================
  return (
    <div className="min-h-screen bg-black text-white p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">

        <div>
          <h1 className="text-4xl font-black text-yellow-400">
            Withdraw wallet
          </h1>

          <p className="text-gray-400 mt-1">
            Welcome back, {username}
          </p>
        </div>

        <button
          onClick={() => {
            loadwallet();
            loadhistory();
          }}
          className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-5 py-3 rounded-xl flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Refresh
        </button>

      </div>

      {/* wallet CARD */}
      <div className="border border-green-500 rounded-3xl bg-zinc-900 p-6 mb-10">

        <div className="flex items-center gap-4">

          <wallet className="text-green-400" size={38} />

          <div>
            <p className="text-gray-400 text-sm">Available wallet Balance</p>

            <h2 className="text-4xl font-black text-green-400 mt-1">
              Pkr {walletBalance.toLocaleString()}
            </h2>
          </div>

        </div>

      </div>

      {/* SUCCESS / ERROR MESSAGE */}
      {message && (
        <div
          className={`mb-6 rounded-xl px-4 py-4 font-semibold ${
            messageType === "success"
              ? "bg-green-700/30 border border-green-500 text-green-300"
              : "bg-red-700/30 border border-red-500 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {/* WITHDRAW FORM */}
      <form
        onSubmit={handleWithdraw}
        className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 space-y-5"
      >

        <h2 className="text-2xl font-black text-yellow-400 mb-4">
          Request Withdrawal
        </h2>

        {/* Amount */}
        <div>
          <label className="text-sm text-gray-300 mb-2 block">
            Withdraw Amount
          </label>

          <input
            type="number"
            placeholder="Enter Amount"
            value={requestAmount}
            onChange={(e) => setRequestAmount(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="text-sm text-gray-300 mb-2 block">
            Currency
          </label>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3"
          >
            <option value="Pkr">Pkr</option>
            <option value="Usdt">Usdt</option>
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="text-sm text-gray-300 mb-2 block">
            Withdraw Method
          </label>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3"
          >
            <option value="JazzCash">JazzCash</option>
            <option value="EasyPaisa">EasyPaisa</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Binance">Binance Usdt</option>
          </select>
        </div>

        {/* Account Title */}
        <div>
          <label className="text-sm text-gray-300 mb-2 block">
            Account Title
          </label>

          <input
            value={accountTitle}
            onChange={(e) => setAccountTitle(e.target.value)}
            placeholder="Syed Hussnain Haider"
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none"
          />
        </div>

        {/* Account Number */}
        <div>
          <label className="text-sm text-gray-300 mb-2 block">
            Account Number
          </label>

          <input
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="03116041995"
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none"
          />
        </div>

        {/* Bank Name */}
        <div>
          <label className="text-sm text-gray-300 mb-2 block">
            Bank / wallet Name
          </label>

          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Meezan Bank / JazzCash / Binance"
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none"
          />
        </div>

        {/* Network */}
        {currency === "Usdt" && (
          <div>
            <label className="text-sm text-gray-300 mb-2 block">
              Usdt Network
            </label>

            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3"
            >
              <option value="TRC20">TRC20</option>
              <option value="BEP20">BEP20</option>
              <option value="ERC20">ERC20</option>
            </select>
          </div>
        )}

        {/* Note */}
        <div>
          <label className="text-sm text-gray-300 mb-2 block">
            Note (Optional)
          </label>

          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any note for admin..."
            className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none"
          />
        </div>

        {/* Submit */}
        <button
          disabled={submitting}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl text-lg flex justify-center items-center gap-3 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <RefreshCw className="animate-spin" size={20} />
              Processing...
            </>
          ) : (
            <>
              <ArrowUpRight size={22} />
              Submit Withdraw Request
            </>
          )}
        </button>

      </form>      {/* ==========================================
          WITHDRAW history
      ========================================== */}

      <div className="mt-12 bg-zinc-900 border border-cyan-500 rounded-3xl p-6">

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">

          <h2 className="text-2xl font-black text-cyan-400">
            Withdraw history
          </h2>

          <button
            onClick={loadhistory}
            className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </div>

        {loadinghistory ? (

          <div className="text-center py-10 text-gray-400">
            Loading history...
          </div>

        ) : history.length === 0 ? (

          <div className="text-center py-10 text-gray-500">
            No withdrawal requests found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              <thead className="border-b border-zinc-700 text-yellow-400">

                <tr className="text-left">
                  <th className="py-3">Amount</th>
                  <th className="py-3">Method</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Admin Note</th>
                  <th className="py-3">Date</th>
                </tr>

              </thead>

              <tbody>

                {history.map((item) => (

                  <tr
                    key={item._id}
                    className="border-b border-zinc-800 hover:bg-zinc-800/40"
                  >

                    {/* Amount */}
                    <td className="py-4 font-bold text-green-400">
                      {item.currency}{" "}
                      {Number(item.requestAmount).toLocaleString()}
                    </td>

                    {/* Payment Method */}
                    <td className="py-4">
                      <div className="font-semibold">
                        {item.paymentMethod}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        {item.accountNumber}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4">

                      {item.status === "Pending" && (
                        <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs flex items-center gap-2 w-fit">
                          <Clock size={14} />
                          Pending
                        </span>
                      )}

                      {item.status === "Approved" && (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs flex items-center gap-2 w-fit">
                          <CheckCircle size={14} />
                          Approved
                        </span>
                      )}

                      {item.status === "Rejected" && (
                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs flex items-center gap-2 w-fit">
                          <XCircle size={14} />
                          Rejected
                        </span>
                      )}

                    </td>

                    {/* Admin Note */}
                    <td className="py-4 text-gray-300">
                      {item.adminNote || "-"}
                    </td>

                    {/* Date */}
                    <td className="py-4 text-gray-400 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString()}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}