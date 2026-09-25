"use client";

// =====================================================
// GoldTrade V18 Enterprise
// Withdraw PKR Page
// PART 1/8 (Production Ready)
// Next.js 15 + TypeScript + JWT + Tailwind
// =====================================================

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Wallet,
  Banknote,
  Landmark,
  Smartphone,
  Bitcoin,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Copy,
  CreditCard,
  Clock3,
  XCircle,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||  "https://goldtrade-2.onrender.com";

// =====================================================
// TYPES
// =====================================================

interface UserData {
  username: string;
  fullName: string;
  email: string;
  role: string;
}

interface WalletData {
  pkrBalance: number;
  goldBalance: number;
  usdtBalance: number;
}

interface WithdrawMethod {
  _id?: string;

  method: "BANK" | "JAZZCASH" | "EASYPAISA" | "BINANCE";

  title: string;

  enabled: boolean;

  network?: string;

  minWithdraw?: number;

  maxWithdraw?: number;
}

interface WithdrawHistory {
  _id: string;

  amount: number;

  withdrawMethod: string;

  accountTitle: string;

  accountNumber: string;

  status: "PENDING" | "APPROVED" | "REJECTED";

  createdAt: string;

  note?: string;
}

interface WithdrawPayload {
  amount: number;

  withdrawMethod: string;

  accountTitle: string;

  accountNumber: string;

  iban?: string;

  network?: string;
}

// =====================================================
// COMPONENT
// =====================================================

export default function WithdrawPage() {
  const router = useRouter();

  // =====================================================
  // AUTH STATE
  // =====================================================

  const [token, setToken] = useState("");

  const [username, setUsername] = useState("");

  const [user, setUser] = useState<UserData>({
    username: "",
    fullName: "",
    email: "",
    role: "user",
  });

  // =====================================================
  // WALLET STATE
  // =====================================================

  const [wallet, setWallet] = useState<WalletData>({
    pkrBalance: 0,
    goldBalance: 0,
    usdtBalance: 0,
  });

  // =====================================================
  // WITHDRAW METHODS
  // =====================================================

  const [withdrawMethods, setWithdrawMethods] =
    useState<WithdrawMethod[]>([]);

  const [selectedMethod, setSelectedMethod] =
    useState<WithdrawMethod | null>(null);

  // =====================================================
  // WITHDRAW FORM
  // =====================================================

  const [amount, setAmount] = useState("");

  const [accountTitle, setAccountTitle] = useState("");

  const [accountNumber, setAccountNumber] = useState("");

  const [iban, setIban] = useState("");

  const [network, setNetwork] = useState("TRC20");

  // =====================================================
  // HISTORY
  // =====================================================

  const [withdrawHistory, setWithdrawHistory] =
    useState<WithdrawHistory[]>([]);

  // =====================================================
  // UI STATE
  // =====================================================

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // JWT HEADERS
  // =====================================================

  const getHeaders = useCallback(() => {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [token]);

  // =====================================================
  // FORMAT PKR
  // =====================================================

  const formatMoney = useCallback((value: number) => {
    return Number(value || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, []);

  // =====================================================
  // LOAD TOKEN
  // =====================================================

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUsername = localStorage.getItem("username");

    if (!savedToken || !savedUsername) {
      router.replace("/login");
      return;
    }

    setToken(savedToken);
    setUsername(savedUsername);
  }, [router]);

  // =====================================================
  // VERIFY SESSION
  // Backend: GET /api/auth/check
  // =====================================================

  const verifySession = useCallback(async () => {
    if (!token) return false;

    try {
      const response = await fetch(`${API}/api/auth/check`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        localStorage.clear();
        router.replace("/login");
        return false;
      }

      setUser({
        username: data.user.username,
        fullName:
          data.user.fullName ||
          data.user.username,
        email: data.user.email,
        role: data.user.role,
      });

      return true;
    } catch (err) {
      console.error("AUTH ERROR:", err);

      localStorage.clear();
      router.replace("/login");

      return false;
    }
  }, [token, router]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = useCallback(() => {
    localStorage.clear();
    router.replace("/login");
  }, [router]);

  // =====================================================
  // COPY TEXT
  // =====================================================

  const copyToClipboard = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);

      setSuccessMessage("Copied successfully.");

      setTimeout(() => setSuccessMessage(""), 2500);
    } catch {
      setErrorMessage("Unable to copy.");
    }
  }, []);

  // =====================================================
  // WITHDRAW SUMMARY
  // =====================================================

  const totalWithdrawRequests = useMemo(() => {
    return withdrawHistory.length;
  }, [withdrawHistory]);

  const approvedWithdraws = useMemo(() => {
    return withdrawHistory.filter(
      (item) => item.status === "APPROVED"
    ).length;
  }, [withdrawHistory]);

  const pendingWithdraws = useMemo(() => {
    return withdrawHistory.filter(
      (item) => item.status === "PENDING"
    ).length;
  }, [withdrawHistory]);

  const rejectedWithdraws = useMemo(() => {
    return withdrawHistory.filter(
      (item) => item.status === "REJECTED"
    ).length;
  }, [withdrawHistory]);

  const totalApprovedAmount = useMemo(() => {
    return withdrawHistory
      .filter((item) => item.status === "APPROVED")
      .reduce((sum, item) => sum + Number(item.amount), 0);
  }, [withdrawHistory]);

  // =====================================================
  // QUICK AMOUNTS
  // =====================================================

  const quickAmounts = [
    1000,
    5000,
    10000,
    25000,
    50000,
    100000,
  ];

  const selectQuickAmount = useCallback((value: number) => {
    setAmount(String(value));
  }, []);

  // =====================================================
  // METHOD ICON
  // =====================================================

  const getMethodIcon = useCallback((method: string) => {
    switch (method) {
      case "BANK":
        return Landmark;

      case "JAZZCASH":
        return Smartphone;

      case "EASYPAISA":
        return Smartphone;

      case "BINANCE":
        return Bitcoin;

      default:
        return CreditCard;
    }
  }, []);

  // =====================================================
  // STATUS COLOR
  // =====================================================

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "APPROVED":
        return "text-green-400 border-green-500 bg-green-500/10";

      case "PENDING":
        return "text-yellow-400 border-yellow-500 bg-yellow-500/10";

      case "REJECTED":
        return "text-red-400 border-red-500 bg-red-500/10";

      default:
        return "text-gray-400 border-gray-700 bg-gray-700/10";
    }
  }, []);

  // =====================================================
  // DATE FORMAT
  // =====================================================

  const formatDate = useCallback((date: string) => {
    return new Date(date).toLocaleString("en-PK", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

// =====================================================
// PART 2/8
// Wallet API + Withdraw Methods API + Withdraw History API
// GoldTrade V18 Enterprise (Production)
// =====================================================

// =====================================================
// LOAD USER WALLET
// Backend : GET /api/wallet/balance
// =====================================================

const loadWallet = useCallback(async () => {
  if (!token) return;

  try {
    const response = await fetch(`${API}/api/wallet/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    console.log("WITHDRAW WALLET:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load wallet.");
    }

    setWallet({
      pkrBalance: Number(data.pkrBalance ?? data.balance ?? 0),
      goldBalance: Number(data.goldBalance ?? 0),
      usdtBalance: Number(data.usdtBalance ?? 0),
    });
  } catch (err: any) {
    console.error("LOAD WALLET ERROR:", err);

    setErrorMessage(err.message || "Wallet unavailable.");
  }
}, [token]);

// =====================================================
// LOAD WITHDRAW METHODS
// Backend : GET /api/payment-settings/withdraw
// =====================================================

const loadWithdrawMethods = useCallback(async () => {
  if (!token) return;

  try {
    const response = await fetch(`${API}/api/payment-settings/withdraw`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    console.log("WITHDRAW METHODS:", data);

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to load withdraw methods."
      );
    }

    const methods: WithdrawMethod[] = (data.methods || [])
      .filter((item: any) => item.enabled === true)
      .map((item: any) => ({
        _id: item._id,
        method: item.method,
        title: item.title,
        enabled: item.enabled,
        network: item.network || "TRC20",
        minWithdraw: Number(item.minWithdraw ?? 500),
        maxWithdraw: Number(item.maxWithdraw ?? 5000000),
      }));

    setWithdrawMethods(methods);

    if (methods.length > 0) {
      setSelectedMethod(methods[0]);

      if (methods[0].network) {
        setNetwork(methods[0].network!);
      }
    }
  } catch (err: any) {
    console.error("WITHDRAW METHODS ERROR:", err);

    setErrorMessage(err.message || "Withdraw methods unavailable.");
  }
}, [token]);

// =====================================================
// LOAD USER WITHDRAW HISTORY
// Backend : GET /api/withdraw/history/:username
// =====================================================

const loadWithdrawHistory = useCallback(async () => {
  if (!token || !username) return;

  try {
    const response = await fetch(
      `${API}/api/withdraw/history/${username}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    console.log("WITHDRAW HISTORY:", data);

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Unable to load withdraw history."
      );
    }

    const history: WithdrawHistory[] = (data.history || []).map(
      (item: any) => ({
        _id: item._id,
        amount: Number(item.amount),
        withdrawMethod: item.withdrawMethod,
        accountTitle: item.accountTitle,
        accountNumber: item.accountNumber,
        status: item.status,
        note: item.note || "",
        createdAt: item.createdAt,
      })
    );

    setWithdrawHistory(history);
  } catch (err: any) {
    console.error("WITHDRAW HISTORY ERROR:", err);

    setErrorMessage(err.message || "Withdraw history unavailable.");
  }
}, [token, username]);

// =====================================================
// REFRESH COMPLETE PAGE
// =====================================================

const refreshWithdrawPage = useCallback(async () => {
  if (!token) return;

  try {
    setRefreshing(true);
    setErrorMessage("");

    await Promise.all([
      loadWallet(),
      loadWithdrawMethods(),
      loadWithdrawHistory(),
    ]);

    console.log("Withdraw page refreshed.");
  } catch (err: any) {
    console.error(err);

    setErrorMessage(err.message || "Refresh failed.");
  } finally {
    setRefreshing(false);
  }
}, [
  token,
  loadWallet,
  loadWithdrawMethods,
  loadWithdrawHistory,
]);

// =====================================================
// INITIAL PAGE LOAD
// =====================================================

useEffect(() => {
  if (!token || !username) return;

  const initializePage = async () => {
    try {
      setLoading(true);

      const valid = await verifySession();

      if (!valid) return;

      await Promise.all([
        loadWallet(),
        loadWithdrawMethods(),
        loadWithdrawHistory(),
      ]);

      console.log("Withdraw page loaded successfully.");
    } catch (err: any) {
      console.error("INITIAL LOAD ERROR:", err);

      setErrorMessage(
        err.message || "Unable to initialize withdraw page."
      );
    } finally {
      setLoading(false);
    }
  };

  initializePage();
}, [
  token,
  username,
  verifySession,
  loadWallet,
  loadWithdrawMethods,
  loadWithdrawHistory,
]);

// =====================================================
// AUTO REFRESH EVERY 60 SECONDS
// =====================================================

useEffect(() => {
  if (!token) return;

  const timer = setInterval(() => {
    refreshWithdrawPage();
  }, 60000);

  return () => clearInterval(timer);
}, [token, refreshWithdrawPage]);

// =====================================================
// SELECT WITHDRAW METHOD
// =====================================================

const selectWithdrawMethod = useCallback((method: WithdrawMethod) => {
  setSelectedMethod(method);

  if (method.network) {
    setNetwork(method.network);
  }
}, []);

// =====================================================
// WITHDRAW LIMITS
// =====================================================

const withdrawLimits = useMemo(() => {
  return {
    minimum: Number(selectedMethod?.minWithdraw ?? 500),
    maximum: Number(selectedMethod?.maxWithdraw ?? 5000000),
  };
}, [selectedMethod]);

// =====================================================
// AVAILABLE BALANCE CHECK
// =====================================================

const availableBalance = useMemo(() => {
  return Number(wallet.pkrBalance || 0);
}, [wallet]);

// =====================================================
// MAX WITHDRAW BUTTON
// =====================================================

const withdrawMaximumBalance = useCallback(() => {
  setAmount(String(Math.floor(availableBalance)));
}, [availableBalance]);

// =====================================================
// CLEAR FORM
// =====================================================

const clearWithdrawForm = useCallback(() => {
  setAmount("");
  setAccountTitle("");
  setAccountNumber("");
  setIban("");
  setNetwork(selectedMethod?.network || "TRC20");
  setSuccessMessage("");
  setErrorMessage("");
}, [selectedMethod]);

// =====================================================
// PART 3/8
// Withdraw Validation + Submit Withdraw API
// GoldTrade V18 Enterprise (Production)
// =====================================================

// =====================================================
// VALIDATE WITHDRAW FORM
// =====================================================

const validateWithdrawForm = useCallback(() => {
  setErrorMessage("");

  if (!selectedMethod) {
    setErrorMessage("Please select a withdraw method.");
    return false;
  }

  const withdrawAmount = Number(amount);

  if (!amount || isNaN(withdrawAmount)) {
    setErrorMessage("Enter a valid withdraw amount.");
    return false;
  }

  if (withdrawAmount < withdrawLimits.minimum) {
    setErrorMessage(
      `Minimum withdraw is PKR ${formatMoney(withdrawLimits.minimum)}.`
    );
    return false;
  }

  if (withdrawAmount > withdrawLimits.maximum) {
    setErrorMessage(
      `Maximum withdraw is PKR ${formatMoney(withdrawLimits.maximum)}.`
    );
    return false;
  }

  if (withdrawAmount > availableBalance) {
    setErrorMessage("Insufficient PKR wallet balance.");
    return false;
  }

  if (!accountTitle.trim()) {
    setErrorMessage("Account title is required.");
    return false;
  }

  if (!accountNumber.trim()) {
    setErrorMessage("Account number is required.");
    return false;
  }

  if (selectedMethod.method === "BANK") {
    if (!iban.trim()) {
      setErrorMessage("IBAN is required for bank withdrawal.");
      return false;
    }
  }

  if (selectedMethod.method === "BINANCE") {
    if (!network.trim()) {
      setErrorMessage("Please select Binance network.");
      return false;
    }
  }

  return true;
}, [
  amount,
  accountTitle,
  accountNumber,
  iban,
  network,
  selectedMethod,
  withdrawLimits,
  availableBalance,
  formatMoney,
]);

// =====================================================
// SUBMIT WITHDRAW REQUEST
// Backend : POST /api/withdraw/create
// =====================================================

const submitWithdraw = useCallback(async () => {
  if (!validateWithdrawForm()) return;

  try {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload: WithdrawPayload = {
      amount: Number(amount),
      withdrawMethod: selectedMethod!.method,
      accountTitle: accountTitle.trim(),
      accountNumber: accountNumber.trim(),
      iban: iban.trim(),
      network,
    };

    const response = await fetch(`${API}/api/withdraw/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("WITHDRAW RESPONSE:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Withdraw request failed.");
    }

    setSuccessMessage(
      data.message || "Withdraw request submitted successfully."
    );

    clearWithdrawForm();

    await Promise.all([
      loadWallet(),
      loadWithdrawHistory(),
    ]);
  } catch (err: any) {
    console.error("WITHDRAW ERROR:", err);

    setErrorMessage(
      err.message || "Unable to submit withdraw request."
    );
  } finally {
    setSubmitting(false);
  }
}, [
  amount,
  accountTitle,
  accountNumber,
  iban,
  network,
  selectedMethod,
  validateWithdrawForm,
  getHeaders,
  clearWithdrawForm,
  loadWallet,
  loadWithdrawHistory,
]);

// =====================================================
// QUICK ACTIONS
// =====================================================

const withdrawHalfBalance = useCallback(() => {
  const value = Math.floor(availableBalance / 2);
  setAmount(String(value));
}, [availableBalance]);

const withdrawQuarterBalance = useCallback(() => {
  const value = Math.floor(availableBalance / 4);
  setAmount(String(value));
}, [availableBalance]);

const withdrawFullBalance = useCallback(() => {
  const value = Math.floor(availableBalance);
  setAmount(String(value));
}, [availableBalance]);

// =====================================================
// NETWORK OPTIONS
// =====================================================

const networkOptions = [
  "TRC20",
  "ERC20",
  "BEP20",
];

// =====================================================
// WITHDRAW SUMMARY
// =====================================================

const withdrawSummary = useMemo(() => {
  const approvedAmount = withdrawHistory
    .filter((item) => item.status === "APPROVED")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const pendingAmount = withdrawHistory
    .filter((item) => item.status === "PENDING")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const rejectedAmount = withdrawHistory
    .filter((item) => item.status === "REJECTED")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    approvedAmount,
    pendingAmount,
    rejectedAmount,
    totalRequests: withdrawHistory.length,
  };
}, [withdrawHistory]);

// =====================================================
// PART 4/8
// Withdraw Form UI + Payment Method Cards
// GoldTrade V18 Enterprise (Production)
// =====================================================

// =====================================================
// PAGE HEADER
// =====================================================

const WithdrawHeader = () => (
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-8">

    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 mb-3 transition"
      >
        <ArrowLeft size={18}/>
        Back to Dashboard
      </button>

      <h1 className="text-4xl font-bold text-red-400">
        Withdraw PKR
      </h1>

      <p className="text-gray-400 mt-2">
        Withdraw funds securely from your GoldTrade PKR Wallet.
      </p>
    </div>

    <button
      onClick={refreshWithdrawPage}
      disabled={refreshing}
      className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black px-5 py-3 rounded-xl font-semibold transition"
    >
      <RefreshCw
        size={18}
        className={refreshing ? "animate-spin" : ""}
      />

      Refresh
    </button>

  </div>
);

// =====================================================
// WALLET SUMMARY CARD
// =====================================================

const WalletSummaryCard = () => (
  <div className="rounded-3xl bg-gradient-to-r from-red-500 via-orange-500 to-red-400 text-white p-7 mb-8 shadow-xl">

    <div className="flex justify-between items-start">

      <div>
        <p className="uppercase tracking-widest text-sm font-semibold text-red-100">
          Available PKR Wallet Balance
        </p>

        <h2 className="text-5xl font-bold mt-3">
          PKR {formatMoney(wallet.pkrBalance)}
        </h2>

        <p className="mt-3 text-red-100">
          Available for Withdrawal
        </p>
      </div>

      <Wallet size={42}/>

    </div>

  </div>
);

// =====================================================
// WITHDRAW METHOD CARDS
// =====================================================

const WithdrawMethodsSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

    <h2 className="text-2xl font-bold text-yellow-400 mb-5">
      Select Withdraw Method
    </h2>

    <div className="grid md:grid-cols-2 gap-5">

      {withdrawMethods.map((method) => {
        const Icon = getMethodIcon(method.method);

        const active =
          selectedMethod?.method === method.method;

        return (
          <button
            key={method.method}
            onClick={() => selectWithdrawMethod(method)}
            className={`rounded-2xl p-5 border text-left transition ${
              active
                ? "border-red-500 bg-red-500/10"
                : "border-gray-700 hover:border-yellow-500"
            }`}
          >
            <div className="flex justify-between items-center mb-4">

              <Icon size={30} className="text-yellow-400"/>

              {active && (
                <CheckCircle className="text-green-400"/>
              )}

            </div>

            <h3 className="text-lg font-bold text-white">
              {method.title}
            </h3>

            <div className="mt-4 space-y-2 text-sm text-gray-400">

              <div className="flex justify-between">
                <span>Minimum</span>

                <span className="text-green-400 font-semibold">
                  PKR {formatMoney(Number(method.minWithdraw || 500))}
                </span>
              </div>

              <div className="flex justify-between">
                <span>Maximum</span>

                <span className="text-green-400 font-semibold">
                  PKR {formatMoney(Number(method.maxWithdraw || 5000000))}
                </span>
              </div>

            </div>

            {method.network && (
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                <Bitcoin size={14}/>
                {method.network}
              </div>
            )}

          </button>
        );
      })}

    </div>

  </div>
);

// =====================================================
// WITHDRAW FORM
// =====================================================

const WithdrawFormSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

    <h2 className="text-2xl font-bold text-red-400 mb-6">
      Withdraw Information
    </h2>

    {/* Amount */}

    <div className="mb-6">

      <label className="block text-gray-300 mb-2">
        Withdraw Amount (PKR)
      </label>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter withdraw amount"
        className="w-full bg-[#1F2937] border border-gray-600 rounded-xl p-4 text-white outline-none focus:border-red-400"
      />

    </div>

    {/* Quick Buttons */}

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">

      {quickAmounts.map((value) => (
        <button
          key={value}
          onClick={() => selectQuickAmount(value)}
          className="bg-[#1F2937] hover:bg-red-500 hover:text-white rounded-xl py-3 font-semibold transition"
        >
          {value.toLocaleString()}
        </button>
      ))}

    </div>

    {/* Wallet Buttons */}

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">

      <button
        onClick={withdrawQuarterBalance}
        className="bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500 hover:text-black rounded-xl py-3 font-semibold transition"
      >
        25%
      </button>

      <button
        onClick={withdrawHalfBalance}
        className="bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500 hover:text-black rounded-xl py-3 font-semibold transition"
      >
        50%
      </button>

      <button
        onClick={withdrawMaximumBalance}
        className="bg-green-500/10 border border-green-500/20 hover:bg-green-500 hover:text-black rounded-xl py-3 font-semibold transition"
      >
        Max
      </button>

      <button
        onClick={withdrawFullBalance}
        className="bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500 hover:text-white rounded-xl py-3 font-semibold transition"
      >
        Full Balance
      </button>

    </div>

    {/* Available Balance */}

    <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-5 mb-8">

      <div className="flex justify-between items-center">

        <div>
          <p className="text-gray-400 text-sm">
            Available Wallet Balance
          </p>

          <h3 className="text-green-400 text-2xl font-bold mt-1">
            PKR {formatMoney(wallet.pkrBalance)}
          </h3>
        </div>

        <Wallet className="text-green-400" size={34}/>

      </div>

    </div>

    {/* Account Title */}

    <div className="mb-6">

      <label className="block text-gray-300 mb-2">
        Account Title
      </label>

      <input
        type="text"
        value={accountTitle}
        onChange={(e) => setAccountTitle(e.target.value)}
        placeholder="Enter account title"
        className="w-full bg-[#1F2937] border border-gray-600 rounded-xl p-4 text-white outline-none focus:border-yellow-400"
      />

    </div>

    {/* Account Number */}

    <div className="mb-6">

      <label className="block text-gray-300 mb-2">
        Account Number / Wallet Address
      </label>

      <input
        type="text"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value)}
        placeholder="Enter account number or wallet address"
        className="w-full bg-[#1F2937] border border-gray-600 rounded-xl p-4 text-white outline-none focus:border-yellow-400"
      />

    </div>

    {/* Bank IBAN */}

    {selectedMethod?.method === "BANK" && (
      <div className="mb-6">

        <label className="block text-gray-300 mb-2">
          Bank IBAN
        </label>

        <input
          type="text"
          value={iban}
          onChange={(e) => setIban(e.target.value)}
          placeholder="Enter IBAN"
          className="w-full bg-[#1F2937] border border-gray-600 rounded-xl p-4 text-white outline-none focus:border-yellow-400"
        />

      </div>
    )}

    {/* Binance Network */}

    {selectedMethod?.method === "BINANCE" && (
      <div className="mb-6">

        <label className="block text-gray-300 mb-2">
          Binance Network
        </label>

        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          className="w-full bg-[#1F2937] border border-gray-600 rounded-xl p-4 text-white outline-none focus:border-cyan-400"
        >
          {networkOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

      </div>
    )}

    {/* Withdraw Limits */}

    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-5">

      <div className="flex gap-3 items-start">

        <AlertCircle className="text-red-400 mt-1"/>

        <div className="space-y-2 text-sm text-gray-300">

          <p>
            Minimum Withdraw :
            <span className="text-green-400 font-semibold ml-2">
              PKR {formatMoney(withdrawLimits.minimum)}
            </span>
          </p>

          <p>
            Maximum Withdraw :
            <span className="text-green-400 font-semibold ml-2">
              PKR {formatMoney(withdrawLimits.maximum)}
            </span>
          </p>

          <p>
            Withdraw requests remain <span className="text-yellow-400">Pending</span> until approved by Admin.
          </p>

        </div>

      </div>

    </div>

  </div>
);

// =====================================================
// SUCCESS & ERROR ALERTS
// =====================================================

const MessageAlerts = () => (
  <>
    {successMessage && (
      <div className="mb-6 rounded-xl border border-green-500 bg-green-500/10 p-4 flex items-center gap-3">
        <CheckCircle className="text-green-400"/>
        <p className="text-green-300">{successMessage}</p>
      </div>
    )}

    {errorMessage && (
      <div className="mb-6 rounded-xl border border-red-500 bg-red-500/10 p-4 flex items-center gap-3">
        <AlertCircle className="text-red-400"/>
        <p className="text-red-300">{errorMessage}</p>
      </div>
    )}
  </>
);

// =====================================================
// PART 5/8
// Withdraw Destination Cards + Submit Section
// GoldTrade V18 Enterprise (Production)
// =====================================================

// =====================================================
// WITHDRAW DESTINATION CARD
// =====================================================

const WithdrawDestinationCard = () => {
  if (!selectedMethod) return null;

  const Icon = getMethodIcon(selectedMethod.method);

  return (
    <div className="rounded-2xl bg-[#111827] border border-cyan-500/20 p-6 mb-8">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cyan-400">
          Withdraw Destination
        </h2>

        <Icon className="text-cyan-400" size={28}/>
      </div>

      <div className="space-y-5">

        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">

          <p className="text-gray-400 text-sm">
            Withdraw Method
          </p>

          <h3 className="text-white font-bold text-lg mt-1">
            {selectedMethod.title}
          </h3>

        </div>

        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">

          <p className="text-gray-400 text-sm">
            Account Holder Name
          </p>

          <h3 className="text-green-400 font-semibold mt-1 break-all">
            {accountTitle || "Not Entered"}
          </h3>

        </div>

        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700 flex justify-between items-center">

          <div>
            <p className="text-gray-400 text-sm">
              Account Number / Wallet Address
            </p>

            <h3 className="text-white font-semibold mt-1 break-all">
              {accountNumber || "Not Entered"}
            </h3>
          </div>

          {accountNumber && (
            <button
              onClick={() => copyToClipboard(accountNumber)}
              className="bg-green-500 hover:bg-green-600 text-black p-3 rounded-lg transition"
            >
              <Copy size={18}/>
            </button>
          )}

        </div>

        {selectedMethod.method === "BANK" && (
          <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700 flex justify-between items-center">

            <div>
              <p className="text-gray-400 text-sm">
                IBAN
              </p>

              <h3 className="text-white font-semibold mt-1 break-all">
                {iban || "Not Entered"}
              </h3>
            </div>

            {iban && (
              <button
                onClick={() => copyToClipboard(iban)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black p-3 rounded-lg transition"
              >
                <Copy size={18}/>
              </button>
            )}

          </div>
        )}

        {selectedMethod.method === "BINANCE" && (
          <div className="bg-[#1F2937] rounded-xl p-4 border border-cyan-500/20">

            <p className="text-gray-400 text-sm">
              Binance Network
            </p>

            <h3 className="text-cyan-400 font-bold text-lg mt-1">
              {network}
            </h3>

          </div>
        )}

      </div>

    </div>
  );
};

// =====================================================
// WITHDRAW SUMMARY CARD
// =====================================================

const WithdrawSummaryCard = () => (
  <div className="rounded-2xl bg-[#111827] border border-red-500/20 p-6 mb-8">

    <h2 className="text-2xl font-bold text-red-400 mb-6">
      Withdrawal Summary
    </h2>

    <div className="grid md:grid-cols-2 gap-5">

      <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">

        <p className="text-gray-400 text-sm">
          Withdraw Amount
        </p>

        <h3 className="text-red-400 text-2xl font-bold mt-2">
          PKR {formatMoney(Number(amount || 0))}
        </h3>

      </div>

      <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">

        <p className="text-gray-400 text-sm">
          Available Balance
        </p>

        <h3 className="text-green-400 text-2xl font-bold mt-2">
          PKR {formatMoney(wallet.pkrBalance)}
        </h3>

      </div>

      <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">

        <p className="text-gray-400 text-sm">
          Withdraw Method
        </p>

        <h3 className="text-white text-lg font-semibold mt-2">
          {selectedMethod?.title || "Not Selected"}
        </h3>

      </div>

      <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">

        <p className="text-gray-400 text-sm">
          Destination Account
        </p>

        <h3 className="text-cyan-400 text-lg font-semibold mt-2 break-all">
          {accountNumber || "Not Entered"}
        </h3>

      </div>

    </div>

  </div>
);

// =====================================================
// CONFIRMATION INFORMATION
// =====================================================

const WithdrawConfirmationInfo = () => (
  <div className="rounded-2xl bg-[#111827] border border-yellow-500/20 p-6 mb-8">

    <div className="flex items-start gap-4">

      <Clock3 className="text-yellow-400 mt-1"/>

      <div className="space-y-2">

        <h3 className="text-yellow-400 font-bold text-lg">
          Withdrawal Verification
        </h3>

        <p className="text-gray-300 text-sm">
          Every withdrawal request is manually reviewed by GoldTrade Admin.
        </p>

        <ul className="text-gray-400 text-sm space-y-2 mt-3">

          <li>• Status will remain Pending until approved.</li>

          <li>• Approved requests deduct balance from your PKR Wallet.</li>

          <li>• Rejected requests do not deduct your wallet balance.</li>

          <li>• Make sure account details are correct before submitting.</li>

        </ul>

      </div>

    </div>

  </div>
);

// =====================================================
// SUBMIT WITHDRAW SECTION
// =====================================================

const SubmitWithdrawSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-green-500/20 p-6 mb-8">

    <div className="space-y-5">

      <div className="grid md:grid-cols-2 gap-5">

        <button
          onClick={submitWithdraw}
          disabled={submitting}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 py-4 rounded-xl font-bold text-lg transition flex justify-center items-center gap-3"
        >
          {submitting ? (
            <>
              <Loader2 size={20} className="animate-spin"/>
              Processing Withdrawal...
            </>
          ) : (
            <>
              <Banknote size={20}/>
              Submit Withdrawal
            </>
          )}
        </button>

        <button
          onClick={clearWithdrawForm}
          disabled={submitting}
          className="bg-gray-700 hover:bg-gray-600 disabled:opacity-60 py-4 rounded-xl font-bold text-lg transition"
        >
          Clear Form
        </button>

      </div>

      {/* Wallet Warning */}

      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">

        <div className="flex gap-3 items-start">

          <AlertCircle className="text-red-400 mt-1"/>

          <div className="text-sm text-gray-300 space-y-1">

            <p>
              Current Wallet Balance:
              <span className="text-green-400 font-semibold ml-2">
                PKR {formatMoney(wallet.pkrBalance)}
              </span>
            </p>

            <p>
              Requested Withdraw:
              <span className="text-red-400 font-semibold ml-2">
                PKR {formatMoney(Number(amount || 0))}
              </span>
            </p>

            <p>
              Remaining Balance After Approval:
              <span className="text-cyan-400 font-semibold ml-2">
                PKR{" "}
                {formatMoney(
                  Math.max(wallet.pkrBalance - Number(amount || 0), 0)
                )}
              </span>
            </p>

          </div>

        </div>

      </div>

    </div>

  </div>
);

// =====================================================
// LOADING OVERLAY
// =====================================================

const LoadingOverlay = () => {
  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999] flex items-center justify-center">

      <div className="bg-[#111827] border border-red-500/20 rounded-3xl px-8 py-8 flex flex-col items-center gap-4">

        <Loader2
          className="animate-spin text-red-400"
          size={40}
        />

        <h2 className="text-red-400 font-bold text-xl">
          Loading Withdrawal Page...
        </h2>

        <p className="text-gray-400 text-sm text-center">
          Connecting to GoldTrade Enterprise Wallet
        </p>

      </div>

    </div>
  );
};

// =====================================================
// PART 6/8
// Withdraw Statistics + History Summary + Status Cards
// GoldTrade V18 Enterprise (Production)
// =====================================================

// =====================================================
// WITHDRAW STATISTICS CARDS
// =====================================================

const WithdrawStatisticsSection = () => (
  <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

    {/* Total Requests */}

    <div className="rounded-2xl bg-[#111827] border border-cyan-500/20 p-5">

      <div className="flex justify-between items-center mb-4">
        <Wallet className="text-cyan-400" size={28}/>
        <span className="text-xs text-cyan-400 font-semibold uppercase">
          Total
        </span>
      </div>

      <p className="text-gray-400 text-sm">
        Withdraw Requests
      </p>

      <h2 className="text-3xl font-bold text-cyan-400 mt-3">
        {withdrawSummary.totalRequests}
      </h2>

    </div>

    {/* Approved */}

    <div className="rounded-2xl bg-[#111827] border border-green-500/20 p-5">

      <div className="flex justify-between items-center mb-4">
        <CheckCircle className="text-green-400" size={28}/>
        <span className="text-xs text-green-400 font-semibold uppercase">
          Approved
        </span>
      </div>

      <p className="text-gray-400 text-sm">
        Approved Withdrawals
      </p>

      <h2 className="text-3xl font-bold text-green-400 mt-3">
        {approvedWithdraws}
      </h2>

      <p className="text-green-300 text-sm mt-3">
        PKR {formatMoney(withdrawSummary.approvedAmount)}
      </p>

    </div>

    {/* Pending */}

    <div className="rounded-2xl bg-[#111827] border border-yellow-500/20 p-5">

      <div className="flex justify-between items-center mb-4">
        <Clock3 className="text-yellow-400" size={28}/>
        <span className="text-xs text-yellow-400 font-semibold uppercase">
          Pending
        </span>
      </div>

      <p className="text-gray-400 text-sm">
        Pending Withdrawals
      </p>

      <h2 className="text-3xl font-bold text-yellow-400 mt-3">
        {pendingWithdraws}
      </h2>

      <p className="text-yellow-300 text-sm mt-3">
        PKR {formatMoney(withdrawSummary.pendingAmount)}
      </p>

    </div>

    {/* Rejected */}

    <div className="rounded-2xl bg-[#111827] border border-red-500/20 p-5">

      <div className="flex justify-between items-center mb-4">
        <XCircle className="text-red-400" size={28}/>
        <span className="text-xs text-red-400 font-semibold uppercase">
          Rejected
        </span>
      </div>

      <p className="text-gray-400 text-sm">
        Rejected Withdrawals
      </p>

      <h2 className="text-3xl font-bold text-red-400 mt-3">
        {rejectedWithdraws}
      </h2>

      <p className="text-red-300 text-sm mt-3">
        PKR {formatMoney(withdrawSummary.rejectedAmount)}
      </p>

    </div>

  </div>
);

// =====================================================
// HISTORY SUMMARY STRIP
// =====================================================

const WithdrawSummaryStrip = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

      <div>
        <p className="text-gray-400 text-xs uppercase">
          Total Requests
        </p>

        <h3 className="text-cyan-400 text-2xl font-bold mt-2">
          {withdrawSummary.totalRequests}
        </h3>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase">
          Approved Amount
        </p>

        <h3 className="text-green-400 text-xl font-bold mt-2">
          PKR {formatMoney(withdrawSummary.approvedAmount)}
        </h3>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase">
          Pending Amount
        </p>

        <h3 className="text-yellow-400 text-xl font-bold mt-2">
          PKR {formatMoney(withdrawSummary.pendingAmount)}
        </h3>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase">
          Wallet Balance
        </p>

        <h3 className="text-purple-400 text-xl font-bold mt-2">
          PKR {formatMoney(wallet.pkrBalance)}
        </h3>
      </div>

    </div>

  </div>
);

// =====================================================
// WITHDRAW HISTORY HEADER
// =====================================================

const WithdrawHistoryHeader = () => (
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-6">

    <div>

      <h2 className="text-3xl font-bold text-yellow-400">
        Withdraw History
      </h2>

      <p className="text-gray-400 mt-2">
        View all withdrawal requests and their approval status.
      </p>

    </div>

    <button
      onClick={refreshWithdrawPage}
      disabled={refreshing}
      className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black px-5 py-3 rounded-xl font-semibold transition"
    >
      <RefreshCw
        size={18}
        className={refreshing ? "animate-spin" : ""}
      />

      Refresh History

    </button>

  </div>
);

// =====================================================
// STATUS BADGE
// =====================================================

const WithdrawStatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center justify-center px-4 py-2 rounded-full border text-xs font-bold ${getStatusColor(status)}`}
  >
    {status}
  </span>
);

// =====================================================
// EMPTY HISTORY CARD
// =====================================================

const EmptyWithdrawHistoryCard = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 py-16 text-center">

    <Wallet className="mx-auto text-gray-500 mb-5" size={56}/>

    <h2 className="text-2xl font-bold text-gray-300">
      No Withdraw History Found
    </h2>

    <p className="text-gray-500 mt-3">
      Your withdrawal requests will appear here after submission.
    </p>

  </div>
);

// =====================================================
// APPROVAL PROCESS INFO CARD
// =====================================================

const WithdrawApprovalInfo = () => (
  <div className="rounded-2xl bg-[#111827] border border-blue-500/20 p-6 mb-8">

    <div className="flex items-start gap-4">

      <Shield className="text-blue-400 mt-1"/>

      <div>

        <h3 className="text-blue-400 font-bold text-lg mb-3">
          Withdrawal Approval Process
        </h3>

        <ul className="space-y-2 text-gray-300 text-sm">

          <li>• Submit withdrawal request.</li>

          <li>• Request status becomes Pending.</li>

          <li>• GoldTrade Admin verifies wallet balance.</li>

          <li>• Approved requests deduct PKR from wallet.</li>

          <li>• Rejected requests keep your wallet balance unchanged.</li>

        </ul>

      </div>

    </div>

  </div>
);

// =====================================================
// WITHDRAW BALANCE INFORMATION
// =====================================================

const WalletInformationCard = () => (
  <div className="rounded-2xl bg-[#111827] border border-green-500/20 p-6 mb-8">

    <h2 className="text-xl font-bold text-green-400 mb-5">
      Wallet Overview
    </h2>

    <div className="grid md:grid-cols-3 gap-5">

      <div className="bg-[#1F2937] rounded-xl p-5 border border-gray-700">

        <p className="text-gray-400 text-sm">
          PKR Balance
        </p>

        <h3 className="text-green-400 text-2xl font-bold mt-2">
          PKR {formatMoney(wallet.pkrBalance)}
        </h3>

      </div>

      <div className="bg-[#1F2937] rounded-xl p-5 border border-gray-700">

        <p className="text-gray-400 text-sm">
          Gold Balance
        </p>

        <h3 className="text-yellow-400 text-2xl font-bold mt-2">
          {wallet.goldBalance.toFixed(3)} g
        </h3>

      </div>

      <div className="bg-[#1F2937] rounded-xl p-5 border border-gray-700">

        <p className="text-gray-400 text-sm">
          USDT Balance
        </p>

        <h3 className="text-cyan-400 text-2xl font-bold mt-2">
          {wallet.usdtBalance.toFixed(2)} USDT
        </h3>

      </div>

    </div>

  </div>
);

// =====================================================
// PART 7/8
// Withdraw History Table + Mobile Cards + Status Timeline
// GoldTrade V18 Enterprise (Production)
// =====================================================

// =====================================================
// DETAILS MODAL
// =====================================================

const [selectedWithdraw, setSelectedWithdraw] =
  useState<WithdrawHistory | null>(null);

const WithdrawDetailsModal = () => {
  if (!selectedWithdraw) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="bg-[#111827] rounded-3xl border border-gray-700 w-full max-w-2xl overflow-hidden">

        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-700">

          <h2 className="text-xl font-bold text-cyan-400">
            Withdrawal Details
          </h2>

          <button
            onClick={() => setSelectedWithdraw(null)}
            className="bg-red-600 hover:bg-red-700 w-9 h-9 rounded-full flex items-center justify-center"
          >
            ✕
          </button>

        </div>

        <div className="p-6 space-y-5">

          <div className="grid md:grid-cols-2 gap-5">

            <div className="bg-[#1F2937] rounded-xl p-4">

              <p className="text-gray-400 text-sm">Amount</p>

              <h3 className="text-red-400 text-2xl font-bold mt-1">
                PKR {formatMoney(selectedWithdraw.amount)}
              </h3>

            </div>

            <div className="bg-[#1F2937] rounded-xl p-4">

              <p className="text-gray-400 text-sm">Status</p>

              <div className="mt-2">
                <WithdrawStatusBadge status={selectedWithdraw.status}/>
              </div>

            </div>

          </div>

          <div className="bg-[#1F2937] rounded-xl p-4">

            <p className="text-gray-400 text-sm">Withdraw Method</p>

            <h3 className="text-cyan-400 font-semibold mt-2">
              {selectedWithdraw.withdrawMethod}
            </h3>

          </div>

          <div className="bg-[#1F2937] rounded-xl p-4">

            <p className="text-gray-400 text-sm">Account Holder</p>

            <h3 className="text-white font-semibold mt-2">
              {selectedWithdraw.accountTitle}
            </h3>

          </div>

          <div className="bg-[#1F2937] rounded-xl p-4 flex justify-between items-center">

            <div>
              <p className="text-gray-400 text-sm">Account Number</p>

              <h3 className="text-green-400 font-semibold mt-2 break-all">
                {selectedWithdraw.accountNumber}
              </h3>
            </div>

            <button
              onClick={() =>
                copyToClipboard(selectedWithdraw.accountNumber)
              }
              className="bg-green-500 hover:bg-green-600 text-black p-3 rounded-lg transition"
            >
              <Copy size={18}/>
            </button>

          </div>

          <div className="bg-[#1F2937] rounded-xl p-4">

            <p className="text-gray-400 text-sm">Submitted On</p>

            <h3 className="text-white font-medium mt-2">
              {formatDate(selectedWithdraw.createdAt)}
            </h3>

          </div>

          {selectedWithdraw.note && (
            <div className="bg-[#1F2937] rounded-xl p-4 border border-yellow-500/20">

              <p className="text-gray-400 text-sm">Admin Note</p>

              <p className="text-yellow-300 mt-2">
                {selectedWithdraw.note}
              </p>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

// =====================================================
// STATUS TIMELINE
// =====================================================

const WithdrawStatusTimeline = ({ status }: { status: string }) => {
  const pending = status === "PENDING";
  const approved = status === "APPROVED";
  const rejected = status === "REJECTED";

  return (
    <div className="flex items-center gap-2">

      <div
        className={`w-3 h-3 rounded-full ${
          pending
            ? "bg-yellow-400"
            : approved
            ? "bg-green-400"
            : "bg-red-400"
        }`}
      />

      <div className="w-10 h-[2px] bg-gray-600"/>

      <div
        className={`w-3 h-3 rounded-full ${
          approved
            ? "bg-green-400"
            : rejected
            ? "bg-red-400"
            : "bg-gray-600"
        }`}
      />

      <div className="w-10 h-[2px] bg-gray-600"/>

      <div
        className={`w-3 h-3 rounded-full ${
          rejected ? "bg-red-400" : "bg-gray-600"
        }`}
      />

    </div>
  );
};

// =====================================================
// MOBILE HISTORY CARD
// =====================================================

const WithdrawHistoryCard = ({
  item,
}: {
  item: WithdrawHistory;
}) => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-4">

    <div className="flex justify-between items-start mb-4">

      <div>
        <p className="text-gray-400 text-xs uppercase">
          {item.withdrawMethod}
        </p>

        <h3 className="text-red-400 text-xl font-bold mt-1">
          PKR {formatMoney(item.amount)}
        </h3>

      </div>

      <WithdrawStatusBadge status={item.status}/>

    </div>

    <div className="space-y-3 text-sm">

      <div>
        <p className="text-gray-500">Account Holder</p>
        <p className="text-white">{item.accountTitle}</p>
      </div>

      <div>
        <p className="text-gray-500">Account Number</p>
        <p className="text-cyan-400 break-all">
          {item.accountNumber}
        </p>
      </div>

      <div>
        <p className="text-gray-500">Submitted On</p>
        <p className="text-white">
          {formatDate(item.createdAt)}
        </p>
      </div>

      <WithdrawStatusTimeline status={item.status}/>

      <button
        onClick={() => setSelectedWithdraw(item)}
        className="w-full mt-3 bg-[#1F2937] hover:bg-[#374151] border border-gray-600 rounded-xl py-3 font-semibold transition"
      >
        View Details
      </button>

    </div>

  </div>
);

// =====================================================
// DESKTOP HISTORY TABLE
// =====================================================

const WithdrawHistoryTable = () => {
  if (withdrawHistory.length === 0) {
    return <EmptyWithdrawHistoryCard />;
  }

  return (
    <div className="rounded-2xl bg-[#111827] border border-gray-700 overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-[#1F2937] text-gray-300 text-sm uppercase">

            <tr>
              <th className="text-left px-5 py-4">Amount</th>
              <th className="text-left px-5 py-4">Method</th>
              <th className="text-left px-5 py-4">Account</th>
              <th className="text-left px-5 py-4">Status</th>
              <th className="text-left px-5 py-4">Date</th>
              <th className="text-left px-5 py-4">Details</th>
            </tr>

          </thead>

          <tbody>

            {withdrawHistory.map((item) => (
              <tr
                key={item._id}
                className="border-t border-gray-700 hover:bg-[#182233] transition"
              >

                <td className="px-5 py-5 whitespace-nowrap">
                  <p className="text-red-400 text-lg font-bold">
                    PKR {formatMoney(item.amount)}
                  </p>
                </td>

                <td className="px-5 py-5 whitespace-nowrap">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                    {item.withdrawMethod}
                  </span>
                </td>

                <td className="px-5 py-5">

                  <div>
                    <p className="text-white font-medium">
                      {item.accountTitle}
                    </p>

                    <p className="text-gray-400 text-sm break-all mt-1">
                      {item.accountNumber}
                    </p>
                  </div>

                </td>

                <td className="px-5 py-5">

                  <div className="space-y-2">
                    <WithdrawStatusBadge status={item.status}/>
                    <WithdrawStatusTimeline status={item.status}/>
                  </div>

                </td>

                <td className="px-5 py-5 whitespace-nowrap">

                  <p className="text-gray-400 text-sm">
                    {formatDate(item.createdAt)}
                  </p>

                </td>

                <td className="px-5 py-5">

                  <button
                    onClick={() => setSelectedWithdraw(item)}
                    className="bg-[#1F2937] hover:bg-[#374151] border border-gray-600 rounded-lg px-4 py-2 text-sm transition"
                  >
                    View
                  </button>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
};

// =====================================================
// RESPONSIVE HISTORY SECTION
// =====================================================

const WithdrawHistorySection = () => (
  <div className="mb-10">

    <WithdrawHistoryHeader />

    <WithdrawSummaryStrip />

    {/* Desktop */}

    <div className="hidden lg:block">
      <WithdrawHistoryTable />
    </div>

    {/* Mobile */}

    <div className="lg:hidden">

      {withdrawHistory.length === 0 ? (
        <EmptyWithdrawHistoryCard />
      ) : (
        withdrawHistory.map((item) => (
          <WithdrawHistoryCard key={item._id} item={item}/>
        ))
      )}

    </div>

    <WithdrawDetailsModal />

  </div>
);

// =====================================================
// STATUS GUIDE CARD
// =====================================================

const WithdrawStatusGuide = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

    <h3 className="text-xl font-bold text-yellow-400 mb-5">
      Withdrawal Status Guide
    </h3>

    <div className="space-y-4">

      <div className="flex items-center gap-4">
        <div className="w-4 h-4 rounded-full bg-yellow-400"/>

        <div>
          <p className="font-semibold text-yellow-400">Pending</p>

          <p className="text-gray-400 text-sm">
            Waiting for admin approval.
          </p>
        </div>

      </div>

      <div className="flex items-center gap-4">
        <div className="w-4 h-4 rounded-full bg-green-400"/>

        <div>
          <p className="font-semibold text-green-400">Approved</p>

          <p className="text-gray-400 text-sm">
            PKR deducted and withdrawal completed.
          </p>
        </div>

      </div>

      <div className="flex items-center gap-4">
        <div className="w-4 h-4 rounded-full bg-red-400"/>

        <div>
          <p className="font-semibold text-red-400">Rejected</p>

          <p className="text-gray-400 text-sm">
            Withdrawal rejected and wallet remains unchanged.
          </p>
        </div>

      </div>

    </div>

  </div>
);

// =====================================================
// PART 8/8
// FINAL PAGE RETURN + FOOTER + SUCCESS / ERROR TOAST
// GoldTrade V18 Enterprise (Production Final)
// =====================================================

// =====================================================
// SUCCESS TOAST
// =====================================================

const SuccessToast = () => {
  if (!successMessage) return null;

  return (
    <div className="fixed top-6 right-6 z-[999] bg-green-600 border border-green-400 text-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3 animate-pulse">
      <CheckCircle size={22} />
      <div>
        <p className="font-bold">Withdrawal Submitted</p>
        <p className="text-sm text-green-100">{successMessage}</p>
      </div>
    </div>
  );
};

// =====================================================
// ERROR TOAST
// =====================================================

const ErrorToast = () => {
  if (!errorMessage) return null;

  return (
    <div className="fixed top-24 right-6 z-[999] bg-red-600 border border-red-400 text-white rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-3">
      <AlertCircle size={22} />
      <div>
        <p className="font-bold">Withdrawal Failed</p>
        <p className="text-sm text-red-100">{errorMessage}</p>
      </div>
    </div>
  );
};

// =====================================================
// FOOTER
// =====================================================

const WithdrawFooter = () => (
  <footer className="mt-16 border-t border-gray-800 pt-8 pb-10">

    <div className="grid md:grid-cols-2 gap-8">

      {/* LEFT */}

      <div>
        <h2 className="text-red-400 font-bold text-xl">
          GoldTrade V18 Enterprise
        </h2>

        <p className="text-gray-400 mt-3 text-sm leading-6">
          Withdraw PKR securely from your GoldTrade Wallet.
          Every withdrawal request is reviewed and approved by the Admin
          before funds are processed.
        </p>
      </div>

      {/* RIGHT */}

      <div className="space-y-3 text-sm">

        <div className="flex items-center gap-3 text-green-400">
          <Shield size={18}/>
          JWT Protected Withdrawal System
        </div>

        <div className="flex items-center gap-3 text-red-400">
          <Banknote size={18}/>
          Secure PKR Withdrawal Processing
        </div>

        <div className="flex items-center gap-3 text-yellow-400">
          <Clock3 size={18}/>
          Manual Admin Verification
        </div>

        <div className="flex items-center gap-3 text-cyan-400">
          <RefreshCw size={18}/>
          Live Wallet Synchronization
        </div>

      </div>

    </div>

    <div className="border-t border-gray-800 mt-8 pt-5 text-center text-gray-500 text-sm">

      © {new Date().getFullYear()} GoldTrade V18 Enterprise

      <div className="mt-2">
        Powered by Next.js • Render Backend • MongoDB • JWT Authentication
      </div>

    </div>

  </footer>
);

// =====================================================
// MAIN PAGE RETURN
// =====================================================

return (
  <main className="min-h-screen bg-[#0B1120] text-white">

    {/* Loading Overlay */}

    <LoadingOverlay />

    {/* Toasts */}

    <SuccessToast />

    <ErrorToast />

    {/* Page Container */}

    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

      {/* Header */}

      <WithdrawHeader />

      {/* Wallet Summary */}

      <WalletSummaryCard />

      {/* Alerts */}

      <MessageAlerts />

      {/* Withdraw Methods */}

      <WithdrawMethodsSection />

      {/* Withdraw Form */}

      <WithdrawFormSection />

      {/* Destination Preview */}

      <WithdrawDestinationCard />

      {/* Summary */}

      <WithdrawSummaryCard />

      {/* Approval Info */}

      <WithdrawConfirmationInfo />

      {/* Submit Button */}

      <SubmitWithdrawSection />

      {/* Statistics */}

      <WithdrawStatisticsSection />

      {/* Wallet Overview */}

      <WalletInformationCard />

      {/* Approval Process */}

      <WithdrawApprovalInfo />

      {/* Status Guide */}

      <WithdrawStatusGuide />

      {/* History */}

      <WithdrawHistorySection />

      {/* Footer */}

      <WithdrawFooter />

    </div>

  </main>
);
  }