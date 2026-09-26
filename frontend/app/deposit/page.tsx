"use client";

// =====================================================
// GoldTrade V18 Enterprise
// Deposit PKR Page
// =====================================================

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wallet,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Shield,
  CreditCard,
  Landmark,
  Smartphone,
  Bitcoin,
  RefreshCw,
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

interface PaymentMethod {
  _id?: string;

  method: "BANK" | "JAZZCASH" | "EASYPAISA" | "BINANCE";

  title: string;
  accountTitle: string;
  accountNumber: string;

  iban?: string;
  bankName?: string;
  network?: string;

  qrImage?: string;

  enabled: boolean;
}

interface DepositHistory {
  _id: string;

  amount: number;

  paymentMethod: string;

  transactionId: string;

  status: "PENDING" | "APPROVED" | "REJECTED";

  createdAt: string;

  receipt?: string;
}

interface DepositPayload {
  amount: number;

  paymentMethod: string;

  transactionId: string;

  receipt: string;
}

// =====================================================
// COMPONENT
// =====================================================

export default function DepositPage() {
  const router = useRouter();

  // =====================================================
  // AUTH
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
  // WALLET
  // =====================================================

  const [wallet, setWallet] = useState<WalletData>({
    pkrBalance: 0,
    goldBalance: 0,
    usdtBalance: 0,
  });

  // =====================================================
  // PAYMENT METHODS
  // =====================================================

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod | null>(null);

  // =====================================================
  // DEPOSIT FORM
  // =====================================================

  const [amount, setAmount] = useState("");

  const [transactionId, setTransactionId] = useState("");

  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [receiptPreview, setReceiptPreview] = useState("");

  // =====================================================
  // HISTORY
  // =====================================================

  const [depositHistory, setDepositHistory] = useState<DepositHistory[]>([]);

  // =====================================================
  // UI STATES
  // =====================================================

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // AUTH HEADERS
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

// ==========================================================
// DEPOSIT AUTH CHECK (GOLDTRADE V18 PRODUCTION)
// ==========================================================

useEffect(() => {
  if (typeof window === "undefined") return;

  const storedToken = window.localStorage.getItem("token");
  const storedUsername = window.localStorage.getItem("username") || "";
  const storedUser = window.localStorage.getItem("user");

  if (!storedToken) {
    router.replace("/login");
    return;
  }

  setToken(storedToken);
  setUsername(storedUsername);

  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser) as Partial<UserData>;
      setUser((current) => ({
        ...current,
        ...parsedUser,
        username: parsedUser.username || storedUsername,
      }));
      if (!storedUsername && parsedUser.username) {
        setUsername(parsedUser.username);
      }
    } catch {
      // The session endpoint will populate the user profile.
    }
  }
}, []);

  // =====================================================
  // VERIFY USER SESSION
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

      router.replace("/login");

      return false;
    }
  }, [token, router]);

  // =====================================================
  // PAGE INITIALIZER
  // =====================================================

  useEffect(() => {
    if (!token) return;

    verifySession();
  }, [token, verifySession]);

  // =====================================================
  // COPY ACCOUNT NUMBER
  // =====================================================

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);

      setSuccessMessage("Copied successfully.");

      setTimeout(() => setSuccessMessage(""), 2500);
    } catch {
      setErrorMessage("Unable to copy.");
    }
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");

    router.replace("/login");
  }, [router]);

  // =====================================================
  // TOTAL DEPOSIT COUNT
  // =====================================================

  const totalDeposits = useMemo(() => {
    return depositHistory.length;
  }, [depositHistory]);

  // =====================================================
  // TOTAL APPROVED
  // =====================================================

  const approvedDeposits = useMemo(() => {
    return depositHistory.filter(
      (item) => item.status === "APPROVED"
    ).length;
  }, [depositHistory]);

  // =====================================================
  // TOTAL PENDING
  // =====================================================

  const pendingDeposits = useMemo(() => {
    return depositHistory.filter(
      (item) => item.status === "PENDING"
    ).length;
  }, [depositHistory]);

// =====================================================
// LOAD USER WALLET
// Backend: GET /api/wallet/balance
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

    console.log("PKR WALLET:", data);

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
// LOAD PAYMENT SETTINGS
// Backend: GET /api/payment-settings/deposit
// =====================================================

const loadPaymentMethods = useCallback(async () => {
  if (!token) return;

  try {
    const response = await fetch(`${API}/api/payment-settings/deposit`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    console.log("PAYMENT SETTINGS:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load payment methods.");
    }

    const methods: PaymentMethod[] = (data.methods || [])
      .filter((item: any) => item.enabled === true)
      .map((item: any) => ({
        _id: item._id,

        method: item.method,

        title: item.title,

        accountTitle: item.accountTitle,

        accountNumber: item.accountNumber,

        iban: item.iban || "",

        bankName: item.bankName || "",

        network: item.network || "",

        qrImage: item.qrImage || "",

        enabled: item.enabled,
      }));

    setPaymentMethods(methods);

    if (methods.length > 0) {
      setSelectedMethod(methods[0]);
    }
  } catch (err: any) {
    console.error("PAYMENT SETTINGS ERROR:", err);

    setErrorMessage(err.message || "Payment methods unavailable.");
  }
}, [token]);

// =====================================================
// LOAD DEPOSIT HISTORY
// Backend: GET /api/deposit/history/:username
// =====================================================

const loadDepositHistory = useCallback(async () => {
  if (!token || !username) return;

  try {
    const response = await fetch(
      `${API}/api/deposit/history/${username}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    const data = await response.json();

    console.log("DEPOSIT HISTORY:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load deposit history.");
    }

    const history: DepositHistory[] = (data.history || []).map((item: any) => ({
      _id: item._id,

      amount: Number(item.amount),

      paymentMethod: item.paymentMethod,

      transactionId: item.transactionId,

      status: item.status,

      receipt: item.receipt || "",

      createdAt: item.createdAt,
    }));

    setDepositHistory(history);
  } catch (err: any) {
    console.error("DEPOSIT HISTORY ERROR:", err);

    setErrorMessage(err.message || "History unavailable.");
  }
}, [token, username]);

// =====================================================
// REFRESH COMPLETE PAGE
// =====================================================

const refreshDepositPage = useCallback(async () => {
  if (!token) return;

  try {
    setRefreshing(true);
    setErrorMessage("");

    await Promise.all([
      loadWallet(),
      loadPaymentMethods(),
      loadDepositHistory(),
    ]);

    console.log("Deposit page refreshed.");
  } catch (err: any) {
    console.error(err);

    setErrorMessage(err.message || "Refresh failed.");
  } finally {
    setRefreshing(false);
  }
}, [
  token,
  loadWallet,
  loadPaymentMethods,
  loadDepositHistory,
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
        loadPaymentMethods(),
        loadDepositHistory(),
      ]);

      console.log("Deposit page loaded successfully.");
    } catch (err: any) {
      console.error("INITIAL LOAD ERROR:", err);

      setErrorMessage(err.message || "Unable to initialize deposit page.");
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
  loadPaymentMethods,
  loadDepositHistory,
]);

// =====================================================
// AUTO REFRESH EVERY 60 SECONDS
// =====================================================

useEffect(() => {
  if (!token) return;

  const timer = setInterval(() => {
    refreshDepositPage();
  }, 60000);

  return () => clearInterval(timer);
}, [token, refreshDepositPage]);

// =====================================================
// PAYMENT METHOD HELPERS
// =====================================================

const selectPaymentMethod = useCallback((method: PaymentMethod) => {
  setSelectedMethod(method);
}, []);

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
      return "text-gray-300 border-gray-600 bg-gray-700/10";
  }
}, []);

// =====================================================
// DATE FORMATTER
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
// RECEIPT IMAGE SELECT
// =====================================================

const handleReceiptChange = useCallback(
  (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    setSuccessMessage("");

    const file = event.target.files?.[0];

    if (!file) return;

    // Only Images
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload JPG, JPEG or PNG image.");
      return;
    }

    // Max 5 MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Receipt image must be less than 5MB.");
      return;
    }

    setReceiptFile(file);

    const reader = new FileReader();

    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };

    reader.readAsDataURL(file);
  },
  []
);

// =====================================================
// REMOVE RECEIPT
// =====================================================

const removeReceipt = useCallback(() => {
  setReceiptFile(null);
  setReceiptPreview("");
}, []);

// =====================================================
// VALIDATE FORM
// =====================================================

const validateDepositForm = useCallback(() => {
  setErrorMessage("");

  if (!selectedMethod) {
    setErrorMessage("Please select a payment method.");
    return false;
  }

  const numericAmount = Number(amount);

  if (!amount || isNaN(numericAmount)) {
    setErrorMessage("Enter a valid deposit amount.");
    return false;
  }

  if (numericAmount < 500) {
    setErrorMessage("Minimum PKR deposit is 500.");
    return false;
  }

  if (numericAmount > 5000000) {
    setErrorMessage("Maximum PKR deposit is 5,000,000.");
    return false;
  }

  if (!transactionId.trim()) {
    setErrorMessage("Transaction ID is required.");
    return false;
  }

  if (transactionId.trim().length < 5) {
    setErrorMessage("Transaction ID is too short.");
    return false;
  }

  if (!receiptPreview) {
    setErrorMessage("Please upload payment receipt.");
    return false;
  }

  return true;
}, [amount, transactionId, receiptPreview, selectedMethod]);

// =====================================================
// CREATE DEPOSIT REQUEST
// Backend : POST /api/deposit/create
// =====================================================

const submitDeposit = useCallback(async () => {
  if (!validateDepositForm()) return;

  try {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload: DepositPayload = {
      amount: Number(amount),
      paymentMethod: selectedMethod!.method,
      transactionId: transactionId.trim(),
      receipt: receiptPreview,
    };

    const response = await fetch(`${API}/api/deposit/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("DEPOSIT RESPONSE:", data);

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Deposit request failed.");
    }

    setSuccessMessage(
      data.message || "Deposit submitted successfully."
    );

    // Reset Form
    setAmount("");
    setTransactionId("");
    setReceiptFile(null);
    setReceiptPreview("");

    // Reload Wallet + History
    await Promise.all([
      loadWallet(),
      loadDepositHistory(),
    ]);
  } catch (err: any) {
    console.error("DEPOSIT ERROR:", err);

    setErrorMessage(err.message || "Unable to submit deposit.");
  } finally {
    setSubmitting(false);
  }
}, [
  amount,
  transactionId,
  receiptPreview,
  selectedMethod,
  validateDepositForm,
  getHeaders,
  loadWallet,
  loadDepositHistory,
]);

// =====================================================
// QUICK AMOUNT BUTTONS
// =====================================================

const quickAmounts = [500, 1000, 5000, 10000, 25000, 50000];

const selectQuickAmount = useCallback((value: number) => {
  setAmount(String(value));
}, []);

// =====================================================
// CLEAR FORM
// =====================================================

const clearForm = useCallback(() => {
  setAmount("");
  setTransactionId("");
  setReceiptFile(null);
  setReceiptPreview("");
  setErrorMessage("");
  setSuccessMessage("");
}, []);

// =====================================================
// FILE SIZE FORMAT
// =====================================================

const formatFileSize = useCallback((size: number) => {
  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}, []);

// =====================================================
// DEPOSIT SUMMARY
// =====================================================

const depositSummary = useMemo(() => {
  const totalApprovedAmount = depositHistory
    .filter((item) => item.status === "APPROVED")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalPendingAmount = depositHistory
    .filter((item) => item.status === "PENDING")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    totalApprovedAmount,
    totalPendingAmount,
    totalRequests: depositHistory.length,
  };
}, [depositHistory]);

// =====================================================
// PAGE HEADER
// =====================================================

const DepositHeader = () => (
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-8">

    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 mb-3 transition"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <h1 className="text-4xl font-bold text-green-400">
        Deposit PKR
      </h1>

      <p className="text-gray-400 mt-2">
        Add funds into your GoldTrade PKR Wallet securely.
      </p>
    </div>

    <button
      onClick={refreshDepositPage}
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
  <div className="rounded-3xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-400 text-black p-7 mb-8 shadow-xl">

    <div className="flex justify-between items-start">

      <div>
        <p className="uppercase tracking-widest text-sm font-semibold">
          Current PKR Wallet Balance
        </p>

        <h2 className="text-5xl font-bold mt-3">
          PKR {formatMoney(wallet.pkrBalance)}
        </h2>

        <p className="mt-3 text-black/70">
          Available Balance
        </p>
      </div>

      <Wallet size={42} />

    </div>

  </div>
);

// =====================================================
// PAYMENT METHOD SELECTOR
// =====================================================

const PaymentMethodsSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

    <h2 className="text-2xl font-bold text-yellow-400 mb-5">
      Select Payment Method
    </h2>

    <div className="grid md:grid-cols-2 gap-5">

      {paymentMethods.map((method) => {
        const Icon = getMethodIcon(method.method);

        const active =
          selectedMethod?.method === method.method;

        return (
          <button
            key={method.method}
            onClick={() => selectPaymentMethod(method)}
            className={`text-left rounded-2xl border p-5 transition ${
              active
                ? "border-green-500 bg-green-500/10"
                : "border-gray-700 hover:border-yellow-500"
            }`}
          >
            <div className="flex justify-between items-center mb-4">

              <Icon
                className="text-yellow-400"
                size={30}
              />

              {active && (
                <CheckCircle className="text-green-400" />
              )}

            </div>

            <h3 className="font-bold text-lg">
              {method.title}
            </h3>

            <p className="text-gray-400 text-sm mt-2">
              {method.accountTitle}
            </p>

            <p className="text-green-400 mt-2 font-semibold">
              {method.accountNumber}
            </p>

            {method.bankName && (
              <p className="text-gray-500 text-xs mt-2">
                {method.bankName}
              </p>
            )}

            {method.network && (
              <p className="text-cyan-400 text-xs mt-2">
                {method.network}
              </p>
            )}

          </button>
        );
      })}

    </div>

  </div>
);

// =====================================================
// SELECTED PAYMENT DETAILS
// =====================================================

const SelectedPaymentDetails = () => {
  if (!selectedMethod) return null;

  return (
    <div className="rounded-2xl bg-[#111827] border border-green-500/20 p-6 mb-8">

      <div className="flex justify-between items-center mb-6">

        <h2 className="text-2xl font-bold text-green-400">
          Payment Details
        </h2>

        <Shield className="text-green-400" />
      </div>

      <div className="space-y-5">

        <div>
          <p className="text-gray-400 text-sm">
            Account Title
          </p>

          <h3 className="font-semibold text-lg mt-1">
            {selectedMethod.accountTitle}
          </h3>
        </div>

        <div className="flex justify-between items-center bg-[#1F2937] rounded-xl p-4">

          <div>
            <p className="text-gray-400 text-sm">
              Account Number
            </p>

            <h3 className="text-green-400 text-lg font-bold mt-1">
              {selectedMethod.accountNumber}
            </h3>
          </div>

          <button
            onClick={() =>
              copyToClipboard(selectedMethod.accountNumber)
            }
            className="bg-green-500 hover:bg-green-600 text-black p-3 rounded-lg transition"
          >
            <Copy size={18} />
          </button>

        </div>

        {selectedMethod.iban && (
          <div className="flex justify-between items-center bg-[#1F2937] rounded-xl p-4">

            <div>
              <p className="text-gray-400 text-sm">
                IBAN
              </p>

              <h3 className="text-white mt-1 font-medium">
                {selectedMethod.iban}
              </h3>
            </div>

            <button
              onClick={() =>
                copyToClipboard(selectedMethod.iban!)
              }
              className="bg-yellow-500 hover:bg-yellow-600 text-black p-3 rounded-lg transition"
            >
              <Copy size={18} />
            </button>

          </div>
        )}

      </div>

    </div>
  );
};

// =====================================================
// DEPOSIT FORM
// =====================================================

const DepositFormSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

    <h2 className="text-2xl font-bold text-green-400 mb-6">
      Deposit Information
    </h2>

    {/* AMOUNT */}

    <div className="mb-6">

      <label className="block text-gray-300 mb-2">
        Deposit Amount (PKR)
      </label>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter Amount"
        className="w-full bg-[#1F2937] border border-gray-600 rounded-xl p-4 text-white outline-none focus:border-green-400"
      />

    </div>

    {/* QUICK AMOUNTS */}

    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">

      {quickAmounts.map((item) => (
        <button
          key={item}
          onClick={() => selectQuickAmount(item)}
          className="bg-[#1F2937] hover:bg-green-500 hover:text-black rounded-xl py-3 font-semibold transition"
        >
          {item.toLocaleString()}
        </button>
      ))}

    </div>

    {/* TRANSACTION ID */}

    <div className="mb-6">

      <label className="block text-gray-300 mb-2">
        Transaction ID / Reference Number
      </label>

      <input
        type="text"
        value={transactionId}
        onChange={(e) =>
          setTransactionId(e.target.value)
        }
        placeholder="Enter Transaction Reference"
        className="w-full bg-[#1F2937] border border-gray-600 rounded-xl p-4 text-white outline-none focus:border-yellow-400"
      />

    </div>

    {/* INFO BOX */}

    <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">

      <div className="flex gap-3 items-start">

        <AlertCircle className="text-yellow-400 mt-1" />

        <div className="text-sm text-gray-300 space-y-1">
          <p>
            Minimum Deposit:{" "}
            <span className="text-green-400 font-semibold">
              PKR 500
            </span>
          </p>

          <p>
            Maximum Deposit:{" "}
            <span className="text-green-400 font-semibold">
              PKR 5,000,000
            </span>
          </p>

          <p>
            Deposit requests are reviewed automatically.
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
        <CheckCircle className="text-green-400" />
        <p className="text-green-300">
          {successMessage}
        </p>
      </div>
    )}

    {errorMessage && (
      <div className="mb-6 rounded-xl border border-red-500 bg-red-500/10 p-4 flex items-center gap-3">
        <AlertCircle className="text-red-400" />
        <p className="text-red-300">
          {errorMessage}
        </p>
      </div>
    )}

  </>
);

// =====================================================
// PART 5/8
// Receipt Upload + QR Payment Card + Submit Button
// GoldTrade V18 Enterprise (Production)
// =====================================================

// =====================================================
// QR PAYMENT CARD
// =====================================================

const QRPaymentCard = () => {
  if (!selectedMethod) return null;

  return (
    <div className="rounded-2xl bg-[#111827] border border-cyan-500/20 p-6 mb-8">

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-cyan-400">
          Scan QR & Pay
        </h2>

        <Shield className="text-cyan-400" size={24} />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center">

        {/* QR IMAGE */}

        <div className="w-56 h-56 rounded-2xl bg-white flex items-center justify-center overflow-hidden">

          {selectedMethod.qrImage ? (
            <img
              src={selectedMethod.qrImage}
              alt="Payment QR"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center text-gray-500">
              <ImageIcon size={48} className="mx-auto mb-2" />
              QR Not Available
            </div>
          )}

        </div>

        {/* ACCOUNT DETAILS */}

        <div className="flex-1 space-y-4 w-full">

          <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">
              Payment Method
            </p>

            <h3 className="text-xl font-semibold text-white mt-1">
              {selectedMethod.title}
            </h3>
          </div>

          <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">
              Account Title
            </p>

            <h3 className="text-green-400 font-semibold mt-1">
              {selectedMethod.accountTitle}
            </h3>
          </div>

          <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700 flex justify-between items-center">

            <div>
              <p className="text-gray-400 text-sm">
                Account Number
              </p>

              <h3 className="text-white font-semibold mt-1 break-all">
                {selectedMethod.accountNumber}
              </h3>
            </div>

            <button
              onClick={() =>
                copyToClipboard(selectedMethod.accountNumber)
              }
              className="bg-green-500 hover:bg-green-600 text-black p-3 rounded-lg transition"
            >
              <Copy size={18} />
            </button>

          </div>

          {selectedMethod.iban && (
            <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700 flex justify-between items-center">

              <div>
                <p className="text-gray-400 text-sm">
                  IBAN
                </p>

                <h3 className="text-white font-semibold mt-1 break-all">
                  {selectedMethod.iban}
                </h3>
              </div>

              <button
                onClick={() =>
                  copyToClipboard(selectedMethod.iban!)
                }
                className="bg-yellow-500 hover:bg-yellow-600 text-black p-3 rounded-lg transition"
              >
                <Copy size={18} />
              </button>

            </div>
          )}

          {selectedMethod.network && (
            <div className="bg-[#1F2937] rounded-xl p-4 border border-cyan-500/20">
              <p className="text-gray-400 text-sm">
                Binance Network
              </p>

              <h3 className="text-cyan-400 font-semibold mt-1">
                {selectedMethod.network}
              </h3>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

// =====================================================
// RECEIPT UPLOAD SECTION
// =====================================================

const ReceiptUploadSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

    <h2 className="text-2xl font-bold text-yellow-400 mb-6">
      Upload Payment Receipt
    </h2>

    {/* FILE INPUT */}

    <label className="cursor-pointer block border-2 border-dashed border-gray-600 hover:border-yellow-400 rounded-2xl p-8 transition">

      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={handleReceiptChange}
      />

      <div className="flex flex-col items-center text-center">

        <Upload className="text-yellow-400 mb-4" size={44} />

        <p className="text-white font-semibold">
          Click here to upload receipt
        </p>

        <p className="text-gray-500 text-sm mt-2">
          JPG / JPEG / PNG only • Max Size 5 MB
        </p>

      </div>

    </label>

    {/* PREVIEW */}

    {receiptPreview && (
      <div className="mt-6">

        <div className="flex justify-between items-center mb-3">

          <h3 className="text-green-400 font-semibold">
            Receipt Preview
          </h3>

          <button
            onClick={removeReceipt}
            className="text-red-400 hover:text-red-300 text-sm transition"
          >
            Remove
          </button>

        </div>

        <div className="rounded-2xl overflow-hidden border border-green-500/20 bg-black">

          <img
            src={receiptPreview}
            alt="Receipt Preview"
            className="w-full object-contain max-h-[450px]"
          />

        </div>

        {receiptFile && (
          <div className="mt-3 flex justify-between items-center text-sm text-gray-400">

            <span>{receiptFile.name}</span>

            <span>{formatFileSize(receiptFile.size)}</span>

          </div>
        )}

      </div>
    )}

    {/* NOTE */}

    <div className="mt-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">

      <div className="flex gap-3 items-start">

        <AlertCircle className="text-yellow-400 mt-1" />

        <div className="space-y-1 text-sm text-gray-300">

          <p>Upload a clear screenshot of your payment receipt.</p>

          <p>
            The receipt must contain the transaction ID/reference number.
          </p>

          <p>
            
          </p>

        </div>

      </div>

    </div>

  </div>
);

// =====================================================
// SUBMIT BUTTON SECTION
// =====================================================

const SubmitDepositSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-green-500/20 p-6 mb-8">

    <div className="space-y-4">

      {/* SUMMARY */}

      <div className="grid md:grid-cols-3 gap-4">

        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">

          <p className="text-gray-400 text-sm">
            Deposit Amount
          </p>

          <h3 className="text-green-400 text-xl font-bold mt-1">
            PKR {formatMoney(Number(amount || 0))}
          </h3>

        </div>

        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">

          <p className="text-gray-400 text-sm">
            Payment Method
          </p>

          <h3 className="text-white text-lg font-semibold mt-1">
            {selectedMethod?.title || "Select Method"}
          </h3>

        </div>

        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">

          <p className="text-gray-400 text-sm">
            Transaction ID
          </p>

          <h3 className="text-cyan-400 text-lg font-semibold mt-1 break-all">
            {transactionId || "Not Entered"}
          </h3>

        </div>

      </div>

      {/* ACTION BUTTONS */}

      <div className="grid md:grid-cols-2 gap-4 pt-2">

        <button
          onClick={submitDeposit}
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-60 py-4 rounded-xl font-bold text-lg transition flex justify-center items-center gap-3"
        >
          {submitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Submitting Deposit...
            </>
          ) : (
            <>
              <Upload size={20} />
              Submit Deposit
            </>
          )}
        </button>

        <button
          onClick={clearForm}
          disabled={submitting}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 py-4 rounded-xl font-bold text-lg transition"
        >
          Clear Form
        </button>

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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center">

      <div className="bg-[#111827] rounded-3xl border border-yellow-500/30 px-8 py-7 flex flex-col items-center gap-4">

        <Loader2
          className="animate-spin text-yellow-400"
          size={42}
        />

        <h2 className="text-yellow-400 text-xl font-bold">
          Loading Deposit Page...
        </h2>

        <p className="text-gray-400 text-center text-sm">
          Connecting to GoldTrade Enterprise Wallet
        </p>

      </div>

    </div>
  );
};

// =====================================================
// PART 6/8
// Deposit Statistics + Deposit History Header + Activity Cards
// GoldTrade V18 Enterprise (Production)
// =====================================================

// =====================================================
// DEPOSIT STATISTICS CARDS
// =====================================================

const DepositStatisticsSection = () => (
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
        Deposit Requests
      </p>

      <h2 className="text-3xl font-bold text-cyan-400 mt-3">
        {depositSummary.totalRequests}
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
        Approved Deposits
      </p>

      <h2 className="text-3xl font-bold text-green-400 mt-3">
        {approvedDeposits}
      </h2>

      <p className="text-green-300 text-sm mt-3">
        PKR {formatMoney(depositSummary.totalApprovedAmount)}
      </p>

    </div>

    {/* Pending */}

    <div className="rounded-2xl bg-[#111827] border border-yellow-500/20 p-5">

      <div className="flex justify-between items-center mb-4">
        <Loader2 className="text-yellow-400" size={28}/>
        <span className="text-xs text-yellow-400 font-semibold uppercase">
          Pending
        </span>
      </div>

      <p className="text-gray-400 text-sm">
        Pending Deposits
      </p>

      <h2 className="text-3xl font-bold text-yellow-400 mt-3">
        {pendingDeposits}
      </h2>

      <p className="text-yellow-300 text-sm mt-3">
        PKR {formatMoney(depositSummary.totalPendingAmount)}
      </p>

    </div>

    {/* Wallet Balance */}

    <div className="rounded-2xl bg-[#111827] border border-purple-500/20 p-5">

      <div className="flex justify-between items-center mb-4">
        <Shield className="text-purple-400" size={28}/>
        <span className="text-xs text-purple-400 font-semibold uppercase">
          Wallet
        </span>
      </div>

      <p className="text-gray-400 text-sm">
        Current Balance
      </p>

      <h2 className="text-3xl font-bold text-purple-400 mt-3">
        PKR {formatMoney(wallet.pkrBalance)}
      </h2>

    </div>

  </div>
);

// =====================================================
// DEPOSIT HISTORY HEADER
// =====================================================

const DepositHistoryHeader = () => (
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-6">

    <div>

      <h2 className="text-3xl font-bold text-yellow-400">
        Deposit History
      </h2>

      <p className="text-gray-400 mt-2">
        View all your previous deposit requests and their approval status.
      </p>

    </div>

    <button
      onClick={refreshDepositPage}
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

const StatusBadge = ({ status }: { status: string }) => {
  const color = getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center justify-center px-4 py-2 rounded-full border text-xs font-bold ${color}`}
    >
      {status}
    </span>
  );
};

// =====================================================
// HISTORY SUMMARY STRIP
// =====================================================

const HistorySummaryStrip = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

      <div>
        <p className="text-gray-400 text-xs uppercase">
          Total Deposits
        </p>

        <h3 className="text-cyan-400 text-2xl font-bold mt-2">
          {depositSummary.totalRequests}
        </h3>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase">
          Approved Amount
        </p>

        <h3 className="text-green-400 text-xl font-bold mt-2">
          PKR {formatMoney(depositSummary.totalApprovedAmount)}
        </h3>
      </div>

      <div>
        <p className="text-gray-400 text-xs uppercase">
          Pending Amount
        </p>

        <h3 className="text-yellow-400 text-xl font-bold mt-2">
          PKR {formatMoney(depositSummary.totalPendingAmount)}
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
// EMPTY HISTORY CARD
// =====================================================

const EmptyHistoryCard = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 py-16 text-center">

    <Wallet className="mx-auto text-gray-500 mb-5" size={56}/>

    <h2 className="text-2xl font-bold text-gray-300">
      No Deposit History Found
    </h2>

    <p className="text-gray-500 mt-3">
      Your submitted deposit requests will appear here after submission.
    </p>

  </div>
);

// =====================================================
// ACTIVITY INFORMATION CARD
// =====================================================

const DepositActivityInfo = () => (
  <div className="rounded-2xl bg-[#111827] border border-blue-500/20 p-6 mb-8">

    <div className="flex items-start gap-4">

      <AlertCircle className="text-blue-400 mt-1"/>

      <div>

        <h3 className="text-blue-400 font-bold text-lg mb-3">
          Deposit Approval Process
        </h3>

        <ul className="space-y-2 text-gray-300 text-sm">

          <li>• Submit payment after sending PKR.</li>

          <li>• Upload a clear payment receipt screenshot.</li>

          <li>• Enter the correct transaction/reference ID.</li>

          <li>• Automatically approved deposits are credited to your PKR Wallet.</li>

        </ul>

      </div>

    </div>

  </div>
);

// =====================================================
// PART 7/8
// Deposit History Table + Receipt Preview + Status Timeline
// GoldTrade V18 Enterprise (Production)
// =====================================================

// =====================================================
// RECEIPT PREVIEW MODAL
// =====================================================

const [previewReceipt, setPreviewReceipt] = useState<string | null>(null);

const ReceiptPreviewModal = () => {
  if (!previewReceipt) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="relative bg-[#111827] rounded-3xl border border-gray-700 max-w-3xl w-full overflow-hidden">

        <button
          onClick={() => setPreviewReceipt(null)}
          className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 w-10 h-10 rounded-full flex items-center justify-center"
        >
          ✕
        </button>

        <img
          src={previewReceipt}
          alt="Deposit Receipt"
          className="w-full max-h-[80vh] object-contain bg-black"
        />

      </div>

    </div>
  );
};

// =====================================================
// STATUS TIMELINE
// =====================================================

const DepositStatusTimeline = ({ status }: { status: string }) => {
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

      <div className="h-[2px] w-10 bg-gray-600" />

      <div
        className={`w-3 h-3 rounded-full ${
          approved
            ? "bg-green-400"
            : rejected
            ? "bg-red-400"
            : "bg-gray-600"
        }`}
      />

      <div className="h-[2px] w-10 bg-gray-600" />

      <div
        className={`w-3 h-3 rounded-full ${
          rejected ? "bg-red-400" : "bg-gray-600"
        }`}
      />

    </div>
  );
};

// =====================================================
// SINGLE HISTORY CARD (Mobile)
// =====================================================

const DepositHistoryCard = ({
  item,
}: {
  item: DepositHistory;
}) => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-4">

    <div className="flex justify-between items-start mb-4">

      <div>
        <p className="text-gray-400 text-xs uppercase">
          {item.paymentMethod}
        </p>

        <h3 className="text-green-400 text-xl font-bold mt-1">
          PKR {formatMoney(item.amount)}
        </h3>
      </div>

      <StatusBadge status={item.status} />

    </div>

    <div className="space-y-3 text-sm">

      <div>
        <p className="text-gray-500">Transaction ID</p>
        <p className="text-white break-all">{item.transactionId}</p>
      </div>

      <div>
        <p className="text-gray-500">Submitted</p>
        <p className="text-white">{formatDate(item.createdAt)}</p>
      </div>

      <DepositStatusTimeline status={item.status} />

      {item.receipt && (
        <button
          onClick={() => setPreviewReceipt(item.receipt!)}
          className="mt-3 w-full bg-[#1F2937] hover:bg-[#374151] border border-gray-600 rounded-xl py-3 flex items-center justify-center gap-2 transition"
        >
          <ImageIcon size={18} />
          View Receipt
        </button>
      )}

    </div>

  </div>
);

// =====================================================
// DESKTOP HISTORY TABLE
// =====================================================

const DepositHistoryTable = () => {
  if (depositHistory.length === 0) {
    return <EmptyHistoryCard />;
  }

  return (
    <div className="rounded-2xl bg-[#111827] border border-gray-700 overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full">

          <thead className="bg-[#1F2937] text-gray-300 text-sm uppercase">

            <tr>
              <th className="text-left px-5 py-4">Amount</th>
              <th className="text-left px-5 py-4">Method</th>
              <th className="text-left px-5 py-4">Transaction ID</th>
              <th className="text-left px-5 py-4">Status</th>
              <th className="text-left px-5 py-4">Receipt</th>
              <th className="text-left px-5 py-4">Date</th>
            </tr>

          </thead>

          <tbody>

            {depositHistory.map((item) => (
              <tr
                key={item._id}
                className="border-t border-gray-700 hover:bg-[#182233] transition"
              >

                {/* Amount */}

                <td className="px-5 py-5 whitespace-nowrap">
                  <p className="font-bold text-green-400 text-lg">
                    PKR {formatMoney(item.amount)}
                  </p>
                </td>

                {/* Method */}

                <td className="px-5 py-5 whitespace-nowrap">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                    {item.paymentMethod}
                  </span>
                </td>

                {/* Transaction ID */}

                <td className="px-5 py-5">
                  <p className="text-white font-medium break-all">
                    {item.transactionId}
                  </p>
                </td>

                {/* Status */}

                <td className="px-5 py-5">
                  <div className="space-y-2">
                    <StatusBadge status={item.status} />
                    <DepositStatusTimeline status={item.status} />
                  </div>
                </td>

                {/* Receipt */}

                <td className="px-5 py-5">

                  {item.receipt ? (
                    <button
                      onClick={() =>
                        setPreviewReceipt(item.receipt!)
                      }
                      className="bg-[#1F2937] hover:bg-[#374151] border border-gray-600 rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition"
                    >
                      <ImageIcon size={16} />
                      View
                    </button>
                  ) : (
                    <span className="text-gray-500 text-sm">
                      No Receipt
                    </span>
                  )}

                </td>

                {/* Date */}

                <td className="px-5 py-5 whitespace-nowrap">
                  <p className="text-gray-400 text-sm">
                    {formatDate(item.createdAt)}
                  </p>
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

const DepositHistorySection = () => (
  <div className="mb-10">

    <DepositHistoryHeader />

    <HistorySummaryStrip />

    {/* Desktop Table */}

    <div className="hidden lg:block">
      <DepositHistoryTable />
    </div>

    {/* Mobile Cards */}

    <div className="lg:hidden">

      {depositHistory.length === 0 ? (
        <EmptyHistoryCard />
      ) : (
        depositHistory.map((item) => (
          <DepositHistoryCard key={item._id} item={item} />
        ))
      )}

    </div>

    <ReceiptPreviewModal />

  </div>
);

// =====================================================
// DEPOSIT STATUS LEGEND
// =====================================================

const DepositStatusLegend = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

    <h3 className="text-xl font-bold text-yellow-400 mb-5">
      Deposit Status Guide
    </h3>

    <div className="space-y-4">

      <div className="flex items-center gap-4">
        <div className="w-4 h-4 rounded-full bg-yellow-400" />

        <div>
          <p className="font-semibold text-yellow-400">Pending</p>
          <p className="text-gray-400 text-sm">
            Waiting for admin verification.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-4 h-4 rounded-full bg-green-400" />

        <div>
          <p className="font-semibold text-green-400">Approved</p>
          <p className="text-gray-400 text-sm">
            Deposit approved and credited to your PKR Wallet.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-4 h-4 rounded-full bg-red-400" />

        <div>
          <p className="font-semibold text-red-400">Rejected</p>
          <p className="text-gray-400 text-sm">
            Deposit rejected. Contact support if needed.
          </p>
        </div>
      </div>

    </div>

  </div>
);

// =====================================================
// PART 8/8
// FINAL PAGE RETURN + FOOTER + LOADING + SUCCESS TOAST
// GoldTrade V18 Enterprise (Production Final)
// =====================================================

// =====================================================
// SUCCESS TOAST
// =====================================================

const SuccessToast = () => {
  if (!successMessage) return null;

  return (
    <div className="fixed top-6 right-6 z-[999] bg-green-600 text-white rounded-2xl shadow-2xl px-5 py-4 border border-green-400 flex items-center gap-3 animate-pulse">
      <CheckCircle size={22} className="text-white" />
      <div>
        <p className="font-bold">Deposit Submitted</p>
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
    <div className="fixed top-24 right-6 z-[999] bg-red-600 text-white rounded-2xl shadow-2xl px-5 py-4 border border-red-400 flex items-center gap-3">
      <AlertCircle size={22} className="text-white" />
      <div>
        <p className="font-bold">Deposit Failed</p>
        <p className="text-sm text-red-100">{errorMessage}</p>
      </div>
    </div>
  );
};

// =====================================================
// FOOTER
// =====================================================

const DepositFooter = () => (
  <footer className="mt-16 border-t border-gray-800 pt-8 pb-10">

    <div className="grid md:grid-cols-2 gap-8">

      {/* LEFT */}

      <div>
        <h2 className="text-yellow-400 font-bold text-xl">
          GoldTrade Enterprise
        </h2>

        <p className="text-gray-400 mt-3 text-sm leading-6">
          Deposit PKR securely into your GoldTrade Wallet.
        
          crediting funds to your wallet Automatically.
        </p>
      </div>

      {/* RIGHT */}

      <div className="space-y-3 text-sm">

        <div className="flex items-center gap-3 text-green-400">
          <Shield size={18}/>
          JWT Protected Deposit System
        </div>

        <div className="flex items-center gap-3 text-cyan-400">
          <Wallet size={18}/>
          PKR Wallet Credit After Approval.
        </div>

        <div className="flex items-center gap-3 text-yellow-400">
          <CheckCircle size={18}/>
          Deposit verified Automatically.
        </div>

        <div className="flex items-center gap-3 text-purple-400">
          <RefreshCw size={18}/>
          Live Wallet Synchronization
        </div>

      </div>

    </div>

    <div className="border-t border-gray-800 mt-8 pt-5 text-center text-gray-500 text-sm">

      © {new Date().getFullYear()} GoldTrade Enterprise

      <div className="mt-2">
        Powered by Flex.inc
      </div>

    </div>

  </footer>
);

// =====================================================
// MAIN PAGE RETURN
// =====================================================

return (
  <main className="min-h-screen bg-[#0B1120] text-white">

    {/* Loading */}

    <LoadingOverlay />

    {/* Toasts */}

    <SuccessToast />

    <ErrorToast />

    {/* Container */}

    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

      {/* Header */}

      <DepositHeader />

      {/* Wallet Balance */}

      <WalletSummaryCard />

      {/* Alerts */}

      <MessageAlerts />

      {/* Payment Methods */}

      <PaymentMethodsSection />

      {/* Selected Payment Details */}

      <SelectedPaymentDetails />

      {/* QR Code */}

      <QRPaymentCard />

      {/* Deposit Form */}

      <DepositFormSection />

      {/* Receipt Upload */}

      <ReceiptUploadSection />

      {/* Submit */}

      <SubmitDepositSection />

      {/* Deposit Statistics */}

      <DepositStatisticsSection />

      {/* Deposit Information */}

      <DepositActivityInfo />

      {/* Status Legend */}

      <DepositStatusLegend />

      {/* History */}

      <DepositHistorySection />

      {/* Footer */}

      <DepositFooter />

    </div>

  </main>
);
}