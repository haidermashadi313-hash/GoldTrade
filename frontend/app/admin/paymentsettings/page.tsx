"use client";

// =====================================================
// GoldTrade V18 Enterprise
// PAYMENT SETTINGS MANAGER
// PART 1/6
// Production Version
// Folder: frontend/app/admin/paymentsetting/page.tsx
// =====================================================

import { useEffect, useMemo, useState } from "react";

import {
  Wallet,
  Landmark,
  Building2,
  CreditCard,
  Copy,
  Save,
  RefreshCw,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  DollarSign,
  Coins,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// =====================================================
// TYPES
// =====================================================

interface PaymentSettings {
  _id?: string;

  // Bank Details
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;

  // Easypaisa
  easypaisaName: string;
  easypaisaNumber: string;

  // JazzCash
  jazzcashName: string;
  jazzcashNumber: string;

  // Binance
  usdtNetwork: string;
  usdtAddress: string;

  // Gold
  goldWalletAddress: string;

  // Status
  depositsEnabled: boolean;
  withdrawsEnabled: boolean;

  updatedAt?: string;
}

interface PaymentStatistics {
  totalBankAccounts: number;
  totalWalletAddresses: number;
  depositsEnabled: boolean;
  withdrawsEnabled: boolean;
}

// =====================================================
// COMPONENT
// =====================================================

export default function PaymentSettingsPage() {

  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState("");
  const [adminName, setAdminName] =
    useState("Administrator");

  // ===================================================
  // SETTINGS DATA
  // ===================================================

  const [settings, setSettings] =
    useState<PaymentSettings>({
      bankName: "",
      accountTitle: "",
      accountNumber: "",
      iban: "",

      easypaisaName: "",
      easypaisaNumber: "",

      jazzcashName: "",
      jazzcashNumber: "",

      usdtNetwork: "TRC20",
      usdtAddress: "",

      goldWalletAddress: "",

      depositsEnabled: true,
      withdrawsEnabled: true,
    });

  const [statistics, setStatistics] =
    useState<PaymentStatistics>({
      totalBankAccounts: 1,
      totalWalletAddresses: 2,
      depositsEnabled: true,
      withdrawsEnabled: true,
    });

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const [error, setError] = useState("");

  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] = useState("");

  // ===================================================
  // TOKEN LOAD
  // ===================================================

  useEffect(() => {
    const savedToken = localStorage.getItem("token");

    if (!savedToken) {
      window.location.href = "/login";
      return;
    }

    setToken(savedToken);
  }, []);

  // ===================================================
  // REQUEST HEADERS
  // ===================================================

  const adminHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (date?: string) => {
    if (!date) return "--";

    return new Date(date).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ===================================================
  // COPY TO CLIPBOARD
  // ===================================================

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);

      setMessage("Copied successfully.");
      setMessageType("success");
    } catch {
      setMessage("Unable to copy.");
      setMessageType("error");
    }
  };

  // ===================================================
  // SEARCH FILTER
  // ===================================================

  const searchKeyword = search.trim().toLowerCase();

  const showBankSection =
    searchKeyword === "" ||
    "bank account iban accounttitle".includes(searchKeyword);

  const showEasyPaisaSection =
    searchKeyword === "" ||
    "easypaisa ep wallet mobile".includes(searchKeyword);

  const showJazzCashSection =
    searchKeyword === "" ||
    "jazzcash jc wallet mobile".includes(searchKeyword);

  const showUsdtSection =
    searchKeyword === "" ||
    "usdt trc20 bep20 binance crypto".includes(searchKeyword);

  const showGoldSection =
    searchKeyword === "" ||
    "gold wallet address".includes(searchKeyword);
      // ===================================================
  // LOAD PAYMENT SETTINGS
  // ===================================================

  const loadPaymentSettings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      setRefreshing(false);
      setError("");

      const [settingsRes, statisticsRes] = await Promise.all([
        fetch(`${API}/api/admin/payment-settings`, {
          headers: adminHeaders,
          cache: "no-store",
        }),

        fetch(`${API}/api/admin/payment-settings/statistics`, {
          headers: adminHeaders,
          cache: "no-store",
        }),
      ]);

      const settingsData = await settingsRes.json();
      const statisticsData = await statisticsRes.json();

      console.log("PAYMENT SETTINGS:", settingsData);
      console.log("PAYMENT STATISTICS:", statisticsData);

      // SETTINGS
      if (settingsRes.ok && settingsData.success) {
        setSettings({
          bankName: settingsData.settings.bankName || "",
          accountTitle: settingsData.settings.accountTitle || "",
          accountNumber: settingsData.settings.accountNumber || "",
          iban: settingsData.settings.iban || "",

          easypaisaName: settingsData.settings.easypaisaName || "",
          easypaisaNumber: settingsData.settings.easypaisaNumber || "",

          jazzcashName: settingsData.settings.jazzcashName || "",
          jazzcashNumber: settingsData.settings.jazzcashNumber || "",

          usdtNetwork:
            settingsData.settings.usdtNetwork || "TRC20",

          usdtAddress: settingsData.settings.usdtAddress || "",

          goldWalletAddress:
            settingsData.settings.goldWalletAddress || "",

          depositsEnabled:
            settingsData.settings.depositsEnabled ?? true,

          withdrawsEnabled:
            settingsData.settings.withdrawsEnabled ?? true,

          updatedAt: settingsData.settings.updatedAt,
        });
      } else {
        setError(
          settingsData.message ||
            "Unable to load payment settings."
        );
      }

      // STATISTICS
      if (statisticsRes.ok && statisticsData.success) {
        setStatistics(statisticsData.statistics);
      }

    } catch (err: any) {
      console.error("LOAD PAYMENT SETTINGS ERROR:", err);

      setError(
        err.message || "Unable to load payment settings."
      );

    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // REFRESH PAYMENT SETTINGS
  // ===================================================

  const refreshPaymentSettings = async () => {
    setRefreshing(true);
    await loadPaymentSettings();
  };

  // ===================================================
  // ADMIN AUTH CHECK
  // ===================================================

  const checkAdminAuth = async () => {
    if (!token) return;

    try {
      const response = await fetch(
        `${API}/api/admin/auth/check`,
        {
          headers: adminHeaders,
          cache: "no-store",
        }
      );

      const data = await response.json();

      console.log("ADMIN AUTH:", data);

      if (!response.ok || !data.success) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      setAdminName(data.user?.username || "Administrator");

    } catch (error) {
      console.error("ADMIN AUTH ERROR:", error);
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (!token) return;

    checkAdminAuth();
    loadPaymentSettings();
  }, [token]);

  // ===================================================
  // AUTO CLEAR MESSAGE
  // ===================================================

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [message]);
    // ===================================================
  // UPDATE INPUT VALUE
  // ===================================================

  const updateField = (
    field: keyof PaymentSettings,
    value: string | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ===================================================
  // TOGGLE DEPOSITS
  // ===================================================

  const toggleDeposits = () => {
    setSettings((prev) => ({
      ...prev,
      depositsEnabled: !prev.depositsEnabled,
    }));
  };

  // ===================================================
  // TOGGLE WITHDRAWS
  // ===================================================

  const toggleWithdraws = () => {
    setSettings((prev) => ({
      ...prev,
      withdrawsEnabled: !prev.withdrawsEnabled,
    }));
  };

  // ===================================================
  // SAVE PAYMENT SETTINGS
  // PUT /api/admin/payment-settings
  // ===================================================

  const savePaymentSettings = async () => {
    if (!token) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        `${API}/api/admin/payment-settings`,
        {
          method: "PUT",
          headers: adminHeaders,
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      console.log("SAVE PAYMENT SETTINGS:", data);

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to save payment settings."
        );
      }

      setSettings((prev) => ({
        ...prev,
        updatedAt: data.settings?.updatedAt || new Date().toISOString(),
      }));

      setMessage("Payment settings updated successfully.");
      setMessageType("success");

      await loadPaymentSettings();

    } catch (err: any) {
      console.error("SAVE PAYMENT SETTINGS ERROR:", err);

      setMessage(
        err.message || "Unable to save payment settings."
      );
      setMessageType("error");

    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // RESET SETTINGS
  // ===================================================

  const resetPaymentSettings = () => {
    loadPaymentSettings();

    setMessage("Payment settings restored.");
    setMessageType("success");
  };

  // ===================================================
  // LAST UPDATED LABEL
  // ===================================================

  const lastUpdatedLabel = useMemo(() => {
    return settings.updatedAt
      ? formatDate(settings.updatedAt)
      : "Never Updated";
  }, [settings.updatedAt]);
    // =====================================================
  // PAGE UI START
  // =====================================================

  return (
    <div className="min-h-screen bg-[#0B1120] text-white p-6">

      {/* ========================================== */}
      {/* HEADER */}
      {/* ========================================== */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div>
          <h1 className="text-3xl font-bold text-yellow-400">
            GoldTrade V18 • Enterprise Payment Settings
          </h1>

          <p className="text-gray-400 mt-2">
            Manage Bank, Easypaisa, JazzCash, USDT and Gold payment details.
          </p>

          <p className="text-gray-500 text-sm mt-1">
            Logged in as{" "}
            <span className="text-green-400 font-semibold">
              {adminName}
            </span>
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">

          <button
            onClick={refreshPaymentSettings}
            disabled={refreshing}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black font-semibold px-5 py-3 rounded-xl transition"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            onClick={savePaymentSettings}
            disabled={saving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-xl transition"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Settings"}
          </button>

        </div>

      </div>

      {/* ========================================== */}
      {/* SUCCESS / ERROR MESSAGE */}
      {/* ========================================== */}

      {message && (
        <div
          className={`mb-6 rounded-xl px-4 py-3 border ${
            messageType === "success"
              ? "bg-green-600/20 border-green-500 text-green-300"
              : "bg-red-600/20 border-red-500 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl px-4 py-3 border border-red-600 bg-red-600/10 text-red-300">
          {error}
        </div>
      )}

      {/* ========================================== */}
      {/* STATISTICS CARDS */}
      {/* ========================================== */}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        {/* BANK */}

        <div className="rounded-2xl bg-[#111827] border border-blue-600/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <Landmark className="text-blue-400" size={28} />
            <span className="text-xs font-semibold text-blue-400">
              BANK
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Bank Accounts
          </p>

          <h2 className="text-3xl font-bold text-blue-400 mt-2">
            {statistics.totalBankAccounts}
          </h2>
        </div>

        {/* CRYPTO */}

        <div className="rounded-2xl bg-[#111827] border border-cyan-600/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <Wallet className="text-cyan-400" size={28} />
            <span className="text-xs font-semibold text-cyan-400">
              CRYPTO
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Wallet Addresses
          </p>

          <h2 className="text-3xl font-bold text-cyan-400 mt-2">
            {statistics.totalWalletAddresses}
          </h2>
        </div>

        {/* DEPOSITS */}

        <div className="rounded-2xl bg-[#111827] border border-green-600/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <CheckCircle className="text-green-400" size={28} />
            <span className="text-xs font-semibold text-green-400">
              DEPOSITS
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Deposit Module
          </p>

          <h2 className="text-xl font-bold text-green-400 mt-2">
            {settings.depositsEnabled ? "Enabled" : "Disabled"}
          </h2>
        </div>

        {/* WITHDRAWS */}

        <div className="rounded-2xl bg-[#111827] border border-red-600/30 p-5">
          <div className="flex justify-between items-center mb-3">
            <XCircle className="text-red-400" size={28} />
            <span className="text-xs font-semibold text-red-400">
              WITHDRAWS
            </span>
          </div>

          <p className="text-gray-400 text-sm">
            Withdraw Module
          </p>

          <h2 className="text-xl font-bold text-red-400 mt-2">
            {settings.withdrawsEnabled ? "Enabled" : "Disabled"}
          </h2>
        </div>

      </div>

      {/* ========================================== */}
      {/* SEARCH */}
      {/* ========================================== */}

      <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">

        <div className="relative">

          <Search
            size={20}
            className="absolute left-4 top-3.5 text-gray-500"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Bank, Easypaisa, JazzCash, USDT, Gold..."
            className="w-full bg-[#1F2937] border border-gray-600 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-yellow-500 transition"
          />

        </div>

      </div>

      {/* ========================================== */}
      {/* PAYMENT STATUS TOGGLES */}
      {/* ========================================== */}

      <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

        <h2 className="text-xl font-bold text-yellow-400 mb-5">
          Payment Module Controls
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          {/* DEPOSIT TOGGLE */}

          <div className="flex items-center justify-between rounded-xl bg-[#1F2937] p-5 border border-green-500/20">

            <div>
              <p className="text-white font-semibold">
                Deposit Requests
              </p>

              <p className="text-gray-400 text-sm">
                Enable or disable new deposits.
              </p>
            </div>

            <button
              onClick={toggleDeposits}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                settings.depositsEnabled
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              {settings.depositsEnabled ? "ON" : "OFF"}
            </button>

          </div>

          {/* WITHDRAW TOGGLE */}

          <div className="flex items-center justify-between rounded-xl bg-[#1F2937] p-5 border border-red-500/20">

            <div>
              <p className="text-white font-semibold">
                Withdraw Requests
              </p>

              <p className="text-gray-400 text-sm">
                Enable or disable new withdrawals.
              </p>
            </div>

            <button
              onClick={toggleWithdraws}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                settings.withdrawsEnabled
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              {settings.withdrawsEnabled ? "ON" : "OFF"}
            </button>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* PAYMENT SETTINGS FORMS START */}
      {/* ========================================== */}

      <div className="space-y-8">        {/* ========================================== */}
        {/* BANK ACCOUNT SETTINGS */}
        {/* ========================================== */}

        {showBankSection && (
          <div className="rounded-2xl bg-[#111827] border border-blue-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <Landmark className="text-blue-400" size={28} />
              <h2 className="text-2xl font-bold text-blue-400">
                Bank Account Details
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Bank Name
                </label>

                <input
                  value={settings.bankName}
                  onChange={(e) =>
                    updateField("bankName", e.target.value)
                  }
                  placeholder="HBL / UBL / Meezan Bank"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Account Title
                </label>

                <input
                  value={settings.accountTitle}
                  onChange={(e) =>
                    updateField("accountTitle", e.target.value)
                  }
                  placeholder="Syed Hussnain Haider"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Account Number
                </label>

                <div className="flex gap-2">

                  <input
                    value={settings.accountNumber}
                    onChange={(e) =>
                      updateField("accountNumber", e.target.value)
                    }
                    placeholder="0000-123456789"
                    className="flex-1 bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                  />

                  <button
                    onClick={() =>
                      copyText(settings.accountNumber)
                    }
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4"
                  >
                    <Copy size={18} />
                  </button>

                </div>

              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  IBAN
                </label>

                <div className="flex gap-2">

                  <input
                    value={settings.iban}
                    onChange={(e) =>
                      updateField("iban", e.target.value)
                    }
                    placeholder="PK36XXXX0000000000000000"
                    className="flex-1 bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-blue-500 outline-none"
                  />

                  <button
                    onClick={() => copyText(settings.iban)}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-4"
                  >
                    <Copy size={18} />
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* EASYPAISA SETTINGS */}
        {/* ========================================== */}

        {showEasyPaisaSection && (
          <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <Wallet className="text-green-400" size={28} />
              <h2 className="text-2xl font-bold text-green-400">
                Easypaisa Settings
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Easypaisa Account Name
                </label>

                <input
                  value={settings.easypaisaName}
                  onChange={(e) =>
                    updateField("easypaisaName", e.target.value)
                  }
                  placeholder="Account Holder Name"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Easypaisa Number
                </label>

                <div className="flex gap-2">

                  <input
                    value={settings.easypaisaNumber}
                    onChange={(e) =>
                      updateField("easypaisaNumber", e.target.value)
                    }
                    placeholder="03XXXXXXXXX"
                    className="flex-1 bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-green-500 outline-none"
                  />

                  <button
                    onClick={() =>
                      copyText(settings.easypaisaNumber)
                    }
                    className="bg-green-600 hover:bg-green-700 rounded-xl px-4"
                  >
                    <Copy size={18} />
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* JAZZCASH SETTINGS */}
        {/* ========================================== */}

        {showJazzCashSection && (
          <div className="rounded-2xl bg-[#111827] border border-purple-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-purple-400" size={28} />
              <h2 className="text-2xl font-bold text-purple-400">
                JazzCash Settings
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  JazzCash Account Name
                </label>

                <input
                  value={settings.jazzcashName}
                  onChange={(e) =>
                    updateField("jazzcashName", e.target.value)
                  }
                  placeholder="JazzCash Holder Name"
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  JazzCash Number
                </label>

                <div className="flex gap-2">

                  <input
                    value={settings.jazzcashNumber}
                    onChange={(e) =>
                      updateField("jazzcashNumber", e.target.value)
                    }
                    placeholder="03XXXXXXXXX"
                    className="flex-1 bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-purple-500 outline-none"
                  />

                  <button
                    onClick={() =>
                      copyText(settings.jazzcashNumber)
                    }
                    className="bg-purple-600 hover:bg-purple-700 rounded-xl px-4"
                  >
                    <Copy size={18} />
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* USDT SETTINGS */}
        {/* ========================================== */}

        {showUsdtSection && (
          <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="text-cyan-400" size={28} />
              <h2 className="text-2xl font-bold text-cyan-400">
                USDT Wallet Settings
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  USDT Network
                </label>

                <select
                  value={settings.usdtNetwork}
                  onChange={(e) =>
                    updateField("usdtNetwork", e.target.value)
                  }
                  className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none"
                >
                  <option value="TRC20">TRC20</option>
                  <option value="BEP20">BEP20</option>
                  <option value="ERC20">ERC20</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  USDT Wallet Address
                </label>

                <div className="flex gap-2">

                  <input
                    value={settings.usdtAddress}
                    onChange={(e) =>
                      updateField("usdtAddress", e.target.value)
                    }
                    placeholder="TXXXXXXXXXXXXXXXXXXXXXXXX"
                    className="flex-1 bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none"
                  />

                  <button
                    onClick={() =>
                      copyText(settings.usdtAddress)
                    }
                    className="bg-cyan-600 hover:bg-cyan-700 rounded-xl px-4"
                  >
                    <Copy size={18} />
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* GOLD WALLET SETTINGS */}
        {/* ========================================== */}

        {showGoldSection && (
          <div className="rounded-2xl bg-[#111827] border border-yellow-600/20 p-6">

            <div className="flex items-center gap-3 mb-6">
              <Coins className="text-yellow-400" size={28} />
              <h2 className="text-2xl font-bold text-yellow-400">
                Gold Wallet Settings
              </h2>
            </div>

            <label className="block text-sm text-gray-300 mb-2">
              Gold Wallet Address
            </label>

            <div className="flex gap-2">

              <input
                value={settings.goldWalletAddress}
                onChange={(e) =>
                  updateField(
                    "goldWalletAddress",
                    e.target.value
                  )
                }
                placeholder="Gold wallet address"
                className="flex-1 bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-yellow-500 outline-none"
              />

              <button
                onClick={() =>
                  copyText(settings.goldWalletAddress)
                }
                className="bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl px-4"
              >
                <Copy size={18} />
              </button>

            </div>

            <p className="text-gray-500 text-sm mt-3">
              This address will be shown to users for Gold deposits and withdrawals.
            </p>

          </div>
        )}        {/* ========================================== */}
        {/* LAST UPDATED CARD */}
        {/* ========================================== */}

        <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h2 className="text-xl font-bold text-yellow-400 mb-2">
                Payment Settings Information
              </h2>

              <p className="text-gray-400 text-sm">
                Last Updated
              </p>

              <p className="text-green-400 font-semibold mt-1">
                {lastUpdatedLabel}
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">

              <button
                onClick={resetPaymentSettings}
                className="bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-xl font-semibold transition"
              >
                Reset Changes
              </button>

              <button
                onClick={savePaymentSettings}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-60 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
              >
                <Save size={18} />
                {saving ? "Saving..." : "Save Payment Settings"}
              </button>

            </div>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* LOADING OVERLAY */}
      {/* ========================================== */}

      {(loading || saving) && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center">

          <div className="bg-[#111827] border border-yellow-500/30 rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-2xl">

            <RefreshCw
              size={36}
              className="animate-spin text-yellow-400"
            />

            <h3 className="text-xl font-bold text-yellow-400">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-300">
              {saving
                ? "Saving payment settings..."
                : "Loading payment settings..."}
            </p>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* FOOTER */}
      {/* ========================================== */}

      <footer className="mt-12 border-t border-gray-800 pt-6">

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">

          <div>

            <h3 className="text-yellow-400 font-bold text-lg">
              GoldTrade V18 Enterprise
            </h3>

            <p className="text-gray-500 text-sm">
              Payment Settings Management Module
            </p>

          </div>

          <div className="flex flex-wrap gap-5 text-sm text-gray-400">

            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-400" />
              Secure Payment Configuration
            </div>

            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-blue-400" />
              Bank + Easypaisa + JazzCash
            </div>

            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-cyan-400" />
              USDT Wallet Management
            </div>

            <div className="flex items-center gap-2">
              <Coins size={16} className="text-yellow-400" />
              Gold Wallet Management
            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}