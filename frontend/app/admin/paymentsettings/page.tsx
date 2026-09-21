"use client";

/* ==========================================================
   GoldTrade V18 Enterprise
   Admin Payment Settings (PART 1/3)
   Linux + Render + Vercel Compatible
========================================================== */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Save,
  CreditCard,
  Landmark,
  Wallet,
  Coins,
} from "lucide-react";

/* ==========================================================
   API URL
========================================================== */

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-cky2.onrender.com";

/* ==========================================================
   TYPES
========================================================== */

interface PaymentSettings {
  jazzCashNumber: string;
  jazzCashTitle: string;

  easypaisaNumber: string;
  easypaisaTitle: string;

  bankName: string;
  bankAccountTitle: string;
  bankAccountNumber: string;
  iban: string;

  usdtTRC20: string;
  usdtBEP20: string;
  usdtERC20: string;

  goldWalletAddress: string;
  goldWalletTitle: string;

  jazzCashQR: string;
  easypaisaQR: string;
  binanceQR: string;

  jazzCashEnabled: boolean;
  easypaisaEnabled: boolean;
  bankEnabled: boolean;
  usdtEnabled: boolean;
  goldEnabled: boolean;
}

/* ==========================================================
   DEFAULT SETTINGS
========================================================== */

const defaultSettings: PaymentSettings = {
  jazzCashNumber: "",
  jazzCashTitle: "",

  easypaisaNumber: "",
  easypaisaTitle: "",

  bankName: "",
  bankAccountTitle: "",
  bankAccountNumber: "",
  iban: "",

  usdtTRC20: "",
  usdtBEP20: "",
  usdtERC20: "",

  goldWalletAddress: "",
  goldWalletTitle: "",

  jazzCashQR: "",
  easypaisaQR: "",
  binanceQR: "",

  jazzCashEnabled: true,
  easypaisaEnabled: true,
  bankEnabled: true,
  usdtEnabled: true,
  goldEnabled: true,
};

/* ==========================================================
   COMPONENT
========================================================== */

export default function PaymentSettingsPage() {
  const [settings, setSettings] =
    useState<PaymentSettings>(defaultSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "success" | "error"
  >("success");

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token") || ""
      : "";

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  /* ==========================================================
     LOAD PAYMENT SETTINGS
  ========================================================== */

  const loadSettings = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `${API}/api/payment-settings/admin`,
        {
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to load payment settings."
        );
      }

      setSettings({
        ...defaultSettings,
        ...data.settings,
      });

    } catch (error) {
      console.error("LOAD PAYMENT SETTINGS:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, []);
    /* ==========================================================
     SAVE PAYMENT SETTINGS
  ========================================================== */

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        `${API}/api/payment-settings`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to save payment settings."
        );
      }

      setSettings({
        ...defaultSettings,
        ...data.settings,
      });

      setMessageType("success");
      setMessage("Payment settings saved successfully.");

    } catch (error) {
      console.error("SAVE PAYMENT SETTINGS:", error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Server connection failed."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     INPUT HELPER
  ========================================================== */

  const updateField = (
    field: keyof PaymentSettings,
    value: string | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* ==========================================================
     LOADING SCREEN
  ========================================================== */

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={26} />
        Loading Payment Settings...
      </main>
    );
  }

  /* ==========================================================
     PAGE UI START
  ========================================================== */

  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap items-center justify-between gap-4">

          <div>
            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">
              <CreditCard size={38} />
              Payment Settings
            </h1>

            <p className="text-gray-400 mt-2">
              Configure JazzCash, Easypaisa, Bank, USDT and Gold payment methods.
            </p>
          </div>

          <div className="flex gap-3">

            <Link
              href="/admin-dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <ArrowLeft size={18} />
              Dashboard
            </Link>

            <button
              type="button"
              onClick={loadSettings}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >
              <RefreshCw size={18} />
              Refresh
            </button>

          </div>

        </header>

        {/* ================= MESSAGE ================= */}

        {message && (
          <div
            className={`rounded-xl px-4 py-3 font-semibold ${
              messageType === "success"
                ? "bg-green-600/20 border border-green-500 text-green-400"
                : "bg-red-600/20 border border-red-500 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {/* ===================================================== */}
        {/* PKR PAYMENT METHODS */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-green-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-green-400 mb-6">
            PKR Payment Methods
          </h2>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* JazzCash */}

            <div className="bg-black border border-zinc-700 rounded-xl p-5 space-y-4">

              <div className="flex items-center justify-between">
                <h3 className="font-bold text-yellow-400">
                  JazzCash
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "jazzCashEnabled",
                      !settings.jazzCashEnabled
                    )
                  }
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    settings.jazzCashEnabled
                      ? "bg-green-600"
                      : "bg-red-600"
                  }`}
                >
                  {settings.jazzCashEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <input
                type="text"
                placeholder="JazzCash Number"
                value={settings.jazzCashNumber}
                onChange={(e) =>
                  updateField("jazzCashNumber", e.target.value)
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
              />

              <input
                type="text"
                placeholder="Account Title"
                value={settings.jazzCashTitle}
                onChange={(e) =>
                  updateField("jazzCashTitle", e.target.value)
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
              />

            </div>

            {/* Easypaisa */}

            <div className="bg-black border border-zinc-700 rounded-xl p-5 space-y-4">

              <div className="flex items-center justify-between">
                <h3 className="font-bold text-green-400">
                  Easypaisa
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      "easypaisaEnabled",
                      !settings.easypaisaEnabled
                    )
                  }
                  className={`px-3 py-1 rounded-lg text-sm font-bold ${
                    settings.easypaisaEnabled
                      ? "bg-green-600"
                      : "bg-red-600"
                  }`}
                >
                  {settings.easypaisaEnabled ? "Enabled" : "Disabled"}
                </button>
              </div>

              <input
                type="text"
                placeholder="Easypaisa Number"
                value={settings.easypaisaNumber}
                onChange={(e) =>
                  updateField("easypaisaNumber", e.target.value)
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
              />

              <input
                type="text"
                placeholder="Account Title"
                value={settings.easypaisaTitle}
                onChange={(e) =>
                  updateField("easypaisaTitle", e.target.value)
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
              />

            </div>

          </div>

          {/* ================= BANK ACCOUNT ================= */}

          <div className="mt-8 bg-black border border-zinc-700 rounded-xl p-5">

            <div className="flex items-center justify-between mb-5">

              <h3 className="flex items-center gap-2 font-bold text-cyan-400">
                <Landmark size={22} />
                Bank Account
              </h3>

              <button
                type="button"
                onClick={() =>
                  updateField("bankEnabled", !settings.bankEnabled)
                }
                className={`px-3 py-1 rounded-lg text-sm font-bold ${
                  settings.bankEnabled
                    ? "bg-green-600"
                    : "bg-red-600"
                }`}
              >
                {settings.bankEnabled ? "Enabled" : "Disabled"}
              </button>

            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <input
                type="text"
                placeholder="Bank Name"
                value={settings.bankName}
                onChange={(e) =>
                  updateField("bankName", e.target.value)
                }
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
              />

              <input
                type="text"
                placeholder="Account Title"
                value={settings.bankAccountTitle}
                onChange={(e) =>
                  updateField(
                    "bankAccountTitle",
                    e.target.value
                  )
                }
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
              />

              <input
                type="text"
                placeholder="Account Number"
                value={settings.bankAccountNumber}
                onChange={(e) =>
                  updateField(
                    "bankAccountNumber",
                    e.target.value
                  )
                }
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
              />

              <input
                type="text"
                placeholder="IBAN"
                value={settings.iban}
                onChange={(e) =>
                  updateField("iban", e.target.value)
                }
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3"
              />

            </div>

          </div>

        </section>
                {/* ===================================================== */}
        {/* USDT PAYMENT WALLETS */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-blue-500 rounded-2xl p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="flex items-center gap-3 text-2xl font-black text-blue-400">
              <Wallet size={26} />
              USDT Wallets
            </h2>

            <button
              type="button"
              onClick={() =>
                updateField("usdtEnabled", !settings.usdtEnabled)
              }
              className={`px-3 py-1 rounded-lg text-sm font-bold ${
                settings.usdtEnabled
                  ? "bg-green-600"
                  : "bg-red-600"
              }`}
            >
              {settings.usdtEnabled ? "Enabled" : "Disabled"}
            </button>

          </div>

          <div className="space-y-4">

            <div>
              <label className="block mb-2 text-blue-300 font-semibold">
                TRC20 Wallet Address
              </label>

              <input
                type="text"
                value={settings.usdtTRC20}
                onChange={(e) =>
                  updateField("usdtTRC20", e.target.value)
                }
                placeholder="Enter TRC20 Wallet Address"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block mb-2 text-blue-300 font-semibold">
                BEP20 Wallet Address
              </label>

              <input
                type="text"
                value={settings.usdtBEP20}
                onChange={(e) =>
                  updateField("usdtBEP20", e.target.value)
                }
                placeholder="Enter BEP20 Wallet Address"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block mb-2 text-blue-300 font-semibold">
                ERC20 Wallet Address
              </label>

              <input
                type="text"
                value={settings.usdtERC20}
                onChange={(e) =>
                  updateField("usdtERC20", e.target.value)
                }
                placeholder="Enter ERC20 Wallet Address"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

          </div>

        </section>

        {/* ===================================================== */}
        {/* GOLD PAYMENT WALLET */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="flex items-center gap-3 text-2xl font-black text-yellow-400">
              <Coins size={26} />
              Gold Wallet
            </h2>

            <button
              type="button"
              onClick={() =>
                updateField("goldEnabled", !settings.goldEnabled)
              }
              className={`px-3 py-1 rounded-lg text-sm font-bold ${
                settings.goldEnabled
                  ? "bg-green-600"
                  : "bg-red-600"
              }`}
            >
              {settings.goldEnabled ? "Enabled" : "Disabled"}
            </button>

          </div>

          <div className="space-y-4">

            <div>
              <label className="block mb-2 text-yellow-300 font-semibold">
                Gold Wallet Title
              </label>

              <input
                type="text"
                value={settings.goldWalletTitle}
                onChange={(e) =>
                  updateField("goldWalletTitle", e.target.value)
                }
                placeholder="Company Gold Wallet"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block mb-2 text-yellow-300 font-semibold">
                Gold Wallet Address
              </label>

              <textarea
                rows={3}
                value={settings.goldWalletAddress}
                onChange={(e) =>
                  updateField("goldWalletAddress", e.target.value)
                }
                placeholder="Gold Wallet Address"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 resize-none"
              />

            </div>

          </div>

        </section>

        {/* ===================================================== */}
        {/* QR IMAGE LINKS */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-purple-500 rounded-2xl p-6">

          <h2 className="text-2xl font-black text-purple-400 mb-6">
            QR Code Images
          </h2>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* JazzCash QR */}

            <div className="bg-black border border-zinc-700 rounded-xl p-4">

              <label className="block mb-2 text-yellow-400 font-semibold">
                JazzCash QR URL
              </label>

              <input
                type="text"
                value={settings.jazzCashQR}
                onChange={(e) =>
                  updateField("jazzCashQR", e.target.value)
                }
                placeholder="https://..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2"
              />

              {settings.jazzCashQR && (
                <img
                  src={settings.jazzCashQR}
                  alt="JazzCash QR"
                  className="mt-4 w-full h-40 object-contain rounded-lg bg-white"
                />
              )}

            </div>

            {/* Easypaisa QR */}

            <div className="bg-black border border-zinc-700 rounded-xl p-4">

              <label className="block mb-2 text-green-400 font-semibold">
                Easypaisa QR URL
              </label>

              <input
                type="text"
                value={settings.easypaisaQR}
                onChange={(e) =>
                  updateField("easypaisaQR", e.target.value)
                }
                placeholder="https://..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2"
              />

              {settings.easypaisaQR && (
                <img
                  src={settings.easypaisaQR}
                  alt="Easypaisa QR"
                  className="mt-4 w-full h-40 object-contain rounded-lg bg-white"
                />
              )}

            </div>

            {/* Binance QR */}

            <div className="bg-black border border-zinc-700 rounded-xl p-4">

              <label className="block mb-2 text-blue-400 font-semibold">
                Binance QR URL
              </label>

              <input
                type="text"
                value={settings.binanceQR}
                onChange={(e) =>
                  updateField("binanceQR", e.target.value)
                }
                placeholder="https://..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2"
              />

              {settings.binanceQR && (
                <img
                  src={settings.binanceQR}
                  alt="Binance QR"
                  className="mt-4 w-full h-40 object-contain rounded-lg bg-white"
                />
              )}

            </div>

          </div>

        </section>

        {/* ===================================================== */}
        {/* SAVE BUTTON */}
        {/* ===================================================== */}

        <section className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">

          <button
            type="button"
            disabled={saving}
            onClick={saveSettings}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition ${
              saving
                ? "bg-yellow-700 cursor-not-allowed text-black"
                : "bg-yellow-500 hover:bg-yellow-400 text-black"
            }`}
          >
            <Save size={22} />

            {saving ? "Saving Payment Settings..." : "Save Payment Settings"}

          </button>

          <p className="text-center text-gray-500 text-sm mt-4">
            GoldTrade V18 Enterprise • Payment Settings Module
          </p>

        </section>

      </div>
    </main>
  );
}