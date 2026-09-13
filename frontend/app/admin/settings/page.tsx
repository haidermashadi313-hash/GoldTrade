// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/settings/page.tsx
// SECTION 1/10
// IMPORTS + TYPES + STATES
// =====================================================

"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Settings,
  Bell,
  Shield,
  Lock,
  Globe,
  Moon,
  Sun,
  Wallet,
  CreditCard,
  RefreshCw,
  Save,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Mail,
  KeyRound,
  Languages,
  Eye,
  EyeOff,
  Database,
  Fingerprint,
  BadgeCheck,
  Coins,
  UserCog,
  Palette,
  Clock,
} from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";

/* ==========================================================
   TYPES
========================================================== */

interface SettingsData {
  language: string;
  currency: string;
  timezone: string;
  theme: "dark" | "light" | "gold";
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  hideWalletBalance: boolean;
  hideGoldBalance: boolean;
  sessionTimeout: number;
}

interface SecurityStatus {
  emailVerified: boolean;
  phoneVerified: boolean;
  kycVerified: boolean;
  passwordLastChanged: string;
  activeDevices: number;
}

/* ==========================================================
   COMPONENT
========================================================== */

export default function SettingsPage() {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : "";

  /* ================= STATES ================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState<SettingsData>({
    language: "English",
    currency: "PKR",
    timezone: "Asia/Karachi",
    theme: "gold",
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    securityAlerts: true,
    marketingEmails: false,
    twoFactorEnabled: false,
    biometricEnabled: false,
    hideWalletBalance: false,
    hideGoldBalance: false,
    sessionTimeout: 30,
  });

  const [security, setSecurity] = useState<SecurityStatus>({
    emailVerified: false,
    phoneVerified: false,
    kycVerified: false,
    passwordLastChanged: "",
    activeDevices: 1,
  });

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [passwordVisibility, setPasswordVisibility] = useState(false);

  const sessionTimeoutLabel = useMemo(() => {
    return `${settings.sessionTimeout} Minutes`;
  }, [settings.sessionTimeout]);// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/settings/page.tsx
// SECTION 2/10
// API FUNCTIONS + SAVE SETTINGS + TOGGLE FUNCTIONS + LOGOUT
// =====================================================

  /* ==========================================================
     LOAD SETTINGS FROM API
  ========================================================== */

  const loadSettings = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API}/api/settings/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSettings({
          language: data.settings.language || "English",
          currency: data.settings.currency || "PKR",
          timezone: data.settings.timezone || "Asia/Karachi",
          theme: data.settings.theme || "gold",
          emailNotifications: data.settings.emailNotifications,
          smsNotifications: data.settings.smsNotifications,
          pushNotifications: data.settings.pushNotifications,
          securityAlerts: data.settings.securityAlerts,
          marketingEmails: data.settings.marketingEmails,
          twoFactorEnabled: data.settings.twoFactorEnabled,
          biometricEnabled: data.settings.biometricEnabled,
          hideWalletBalance: data.settings.hideWalletBalance,
          hideGoldBalance: data.settings.hideGoldBalance,
          sessionTimeout: data.settings.sessionTimeout || 30,
        });

        setSecurity({
          emailVerified: data.security.emailVerified,
          phoneVerified: data.security.phoneVerified,
          kycVerified: data.security.kycVerified,
          passwordLastChanged: data.security.passwordLastChanged,
          activeDevices: data.security.activeDevices,
        });
      }
    } catch (error) {
      console.error("Settings Load Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadSettings();
    }
  }, [token]);

  /* ==========================================================
     SAVE SETTINGS
  ========================================================== */

  const saveSettings = async () => {
    try {
      setSaving(true);

      const response = await fetch(`${API}/api/settings/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (data.success) {
        alert("Settings Updated Successfully.");
      } else {
        alert(data.message || "Unable to update settings.");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     GENERIC TOGGLE FUNCTION
  ========================================================== */

  const toggleSetting = (key: keyof SettingsData) => {
    const value = settings[key];

    if (typeof value === "boolean") {
      setSettings((prev) => ({
        ...prev,
        [key]: !value,
      }));
    }
  };

  /* ==========================================================
     UPDATE SELECT VALUES
  ========================================================== */

  const updateSetting = (
    key: keyof SettingsData,
    value: string | number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* ==========================================================
     RESET SETTINGS TO DEFAULT
  ========================================================== */

  const resetSettings = () => {
    const confirmReset = confirm(
      "Reset all settings to GoldTrade default values?"
    );

    if (!confirmReset) return;

    setSettings({
      language: "English",
      currency: "PKR",
      timezone: "Asia/Karachi",
      theme: "gold",
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      securityAlerts: true,
      marketingEmails: false,
      twoFactorEnabled: false,
      biometricEnabled: false,
      hideWalletBalance: false,
      hideGoldBalance: false,
      sessionTimeout: 30,
    });
  };

  /* ==========================================================
     LOGOUT CURRENT SESSION
  ========================================================== */

  const logoutCurrentSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  /* ==========================================================
     LOGOUT ALL DEVICES
  ========================================================== */

  const logoutAllDevices = async () => {
    try {
      const confirmed = confirm(
        "Logout from all active GoldTrade devices?"
      );

      if (!confirmed) return;

      await fetch(`${API}/api/settings/logout-all`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      localStorage.clear();
      window.location.href = "/login";
    } catch (error) {
      console.error(error);
    }
  };

  /* ==========================================================
     DELETE ACCOUNT REQUEST
  ========================================================== */

  const requestDeleteAccount = async () => {
    try {
      const confirmed = confirm(
        "This will submit an account deletion request. Continue?"
      );

      if (!confirmed) return;

      const response = await fetch(`${API}/api/settings/delete-account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        alert("Account deletion request submitted.");
        setShowDeleteModal(false);
      } else {
        alert(data.message || "Request failed.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  /* ==========================================================
     PASSWORD LAST UPDATED
  ========================================================== */

  const passwordUpdatedDate = useMemo(() => {
    if (!security.passwordLastChanged) return "Never";

    return new Date(
      security.passwordLastChanged
    ).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [security.passwordLastChanged]);

  /* ==========================================================
     SECURITY SCORE
  ========================================================== */

  const securityScore = useMemo(() => {
    let score = 0;

    if (security.emailVerified) score += 20;
    if (security.phoneVerified) score += 20;
    if (security.kycVerified) score += 25;
    if (settings.twoFactorEnabled) score += 20;
    if (settings.biometricEnabled) score += 15;

    return score;
  }, [security, settings]);

  /* ==========================================================
     SECURITY LEVEL LABEL
  ========================================================== */

  const securityLevel = useMemo(() => {
    if (securityScore >= 90) return "Excellent";
    if (securityScore >= 70) return "Strong";
    if (securityScore >= 50) return "Average";
    return "Weak";
  }, [securityScore]);// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/settings/page.tsx
// SECTION 3/10
// HEADER + SECURITY SCORE + QUICK SETTINGS DASHBOARD
// =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400">
        <RefreshCw className="animate-spin mr-3" size={28} />
        Loading Settings...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">

        {/* ================= PAGE HEADER ================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">

          <div>

            <h1 className="text-5xl font-black text-yellow-400 flex items-center gap-3">
              <Settings size={42} />
              Account Settings
            </h1>

            <p className="text-gray-400 mt-2">
              Manage your GoldTrade preferences, security, notifications,
              privacy and account settings.
            </p>

          </div>

          <div className="flex gap-3 flex-wrap">

            <button
              onClick={loadSettings}
              disabled={saving}
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={saving ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-black flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Changes"}
            </button>

          </div>

        </div>

        {/* ================= SECURITY SCORE ================= */}

        <div className="bg-gradient-to-r from-green-900 via-black to-green-900 border border-green-600 rounded-3xl p-8 mb-10">

          <div className="grid lg:grid-cols-2 gap-8 items-center">

            <div>

              <div className="flex items-center gap-3 mb-4">

                <Shield className="text-green-400" size={32} />

                <h2 className="text-3xl font-black text-green-400">
                  Account Security Score
                </h2>

              </div>

              <p className="text-gray-300 mb-6">
                GoldTrade continuously checks your account security based on
                verification, password protection, KYC and authentication.
              </p>

              <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden">

                <div
                  className="bg-green-500 h-4 rounded-full transition-all duration-700"
                  style={{ width: `${securityScore}%` }}
                />

              </div>

              <div className="flex justify-between mt-3 text-sm">

                <span className="text-gray-400">
                  Security Score
                </span>

                <span className="font-bold text-green-400">
                  {securityScore}% ({securityLevel})
                </span>

              </div>

            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="bg-black border border-green-600 rounded-2xl p-5 text-center">

                <BadgeCheck className="mx-auto text-green-400 mb-3" size={28} />

                <p className="text-gray-400 text-xs">
                  Email Verified
                </p>

                <h3 className="text-xl font-black text-green-400 mt-2">
                  {security.emailVerified ? "YES" : "NO"}
                </h3>

              </div>

              <div className="bg-black border border-cyan-600 rounded-2xl p-5 text-center">

                <Smartphone className="mx-auto text-cyan-400 mb-3" size={28} />

                <p className="text-gray-400 text-xs">
                  Phone Verified
                </p>

                <h3 className="text-xl font-black text-cyan-400 mt-2">
                  {security.phoneVerified ? "YES" : "NO"}
                </h3>

              </div>

              <div className="bg-black border border-purple-600 rounded-2xl p-5 text-center">

                <Fingerprint className="mx-auto text-purple-400 mb-3" size={28} />

                <p className="text-gray-400 text-xs">
                  Two Factor Auth
                </p>

                <h3 className="text-xl font-black text-purple-400 mt-2">
                  {settings.twoFactorEnabled ? "ON" : "OFF"}
                </h3>

              </div>

              <div className="bg-black border border-yellow-500 rounded-2xl p-5 text-center">

                <Shield className="mx-auto text-yellow-400 mb-3" size={28} />

                <p className="text-gray-400 text-xs">
                  KYC Status
                </p>

                <h3 className="text-xl font-black text-yellow-400 mt-2">
                  {security.kycVerified ? "VERIFIED" : "PENDING"}
                </h3>

              </div>

            </div>

          </div>

        </div>

        {/* ================= QUICK SETTINGS ================= */}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6">

            <Palette className="text-yellow-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">
              Current Theme
            </p>

            <h3 className="text-2xl font-black text-yellow-400 mt-2 capitalize">
              {settings.theme}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6">

            <Languages className="text-cyan-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">
              Language
            </p>

            <h3 className="text-2xl font-black text-cyan-400 mt-2">
              {settings.language}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6">

            <CreditCard className="text-green-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">
              Currency
            </p>

            <h3 className="text-2xl font-black text-green-400 mt-2">
              {settings.currency}
            </h3>

          </div>

          <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-6">

            <Clock className="text-orange-400 mb-4" size={30} />

            <p className="text-gray-400 text-sm">
              Session Timeout
            </p>

            <h3 className="text-2xl font-black text-orange-400 mt-2">
              {sessionTimeoutLabel}
            </h3>

          </div>

        </div>

        {/* ================= SETTINGS OVERVIEW ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-6">

            <UserCog className="text-blue-400" size={28} />

            <h2 className="text-3xl font-black text-blue-400">
              Settings Overview
            </h2>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <Bell className="text-green-400 mb-3" size={24} />

              <p className="text-gray-400 text-sm">
                Notifications Enabled
              </p>

              <h3 className="text-3xl font-black text-green-400 mt-2">
                {[
                  settings.emailNotifications,
                  settings.smsNotifications,
                  settings.pushNotifications,
                  settings.securityAlerts,
                ].filter(Boolean).length}
              </h3>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <Shield className="text-purple-400 mb-3" size={24} />

              <p className="text-gray-400 text-sm">
                Active Devices
              </p>

              <h3 className="text-3xl font-black text-purple-400 mt-2">
                {security.activeDevices}
              </h3>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <KeyRound className="text-yellow-400 mb-3" size={24} />

              <p className="text-gray-400 text-sm">
                Password Updated
              </p>

              <h3 className="text-lg font-black text-yellow-400 mt-2">
                {passwordUpdatedDate}
              </h3>

            </div>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/settings/page.tsx
// SECTION 4/10
// APP PREFERENCES + LANGUAGE + THEME + CURRENCY + TIMEZONE
// =====================================================

        {/* ================= APP PREFERENCES ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Palette className="text-yellow-400" size={28} />

            <h2 className="text-3xl font-black text-yellow-400">
              Application Preferences
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {/* Language */}

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Preferred Language
              </label>

              <select
                value={settings.language}
                onChange={(e) => updateSetting("language", e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              >
                <option>English</option>
                <option>Roman Urdu</option>
                <option>Urdu</option>
                <option>Arabic</option>
                <option>Khmer</option>
              </select>

            </div>

            {/* Currency */}

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Default Currency
              </label>

              <select
                value={settings.currency}
                onChange={(e) => updateSetting("currency", e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              >
                <option>PKR</option>
                <option>USD</option>
                <option>AED</option>
                <option>KHR</option>
                <option>USDT</option>
              </select>

            </div>

            {/* Time Zone */}

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Time Zone
              </label>

              <select
                value={settings.timezone}
                onChange={(e) => updateSetting("timezone", e.target.value)}
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              >
                <option>Asia/Karachi</option>
                <option>Asia/Dubai</option>
                <option>Asia/Phnom_Penh</option>
                <option>UTC</option>
              </select>

            </div>

            {/* Theme */}

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                GoldTrade Theme
              </label>

              <select
                value={settings.theme}
                onChange={(e) =>
                  updateSetting(
                    "theme",
                    e.target.value as "gold" | "dark" | "light"
                  )
                }
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-yellow-500 outline-none"
              >
                <option value="gold">Gold & Black (Enterprise)</option>
                <option value="dark">Dark Mode</option>
                <option value="light">Light Mode</option>
              </select>

            </div>

          </div>

        </div>

        {/* ================= THEME PREVIEW ================= */}

        <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            {settings.theme === "light" ? (
              <Sun className="text-yellow-400" size={28} />
            ) : (
              <Moon className="text-orange-400" size={28} />
            )}

            <h2 className="text-3xl font-black text-orange-400">
              Theme Preview
            </h2>

          </div>

          <div className="grid md:grid-cols-3 gap-5">

            <div
              className={`rounded-2xl border p-5 ${
                settings.theme === "gold"
                  ? "bg-black border-yellow-500"
                  : "bg-zinc-900 border-zinc-700"
              }`}
            >

              <div className="w-full h-20 bg-yellow-500 rounded-xl mb-4" />

              <p className="text-yellow-400 font-bold">
                GoldTrade Enterprise
              </p>

              <p className="text-gray-400 text-sm mt-2">
                Official Gold & Black theme.
              </p>

            </div>

            <div
              className={`rounded-2xl border p-5 ${
                settings.theme === "dark"
                  ? "bg-zinc-900 border-white"
                  : "bg-zinc-900 border-zinc-700"
              }`}
            >

              <div className="w-full h-20 bg-zinc-700 rounded-xl mb-4" />

              <p className="font-bold">Dark Mode</p>

              <p className="text-gray-400 text-sm mt-2">
                Modern dark appearance.
              </p>

            </div>

            <div
              className={`rounded-2xl border p-5 ${
                settings.theme === "light"
                  ? "bg-white border-yellow-500 text-black"
                  : "bg-zinc-900 border-zinc-700"
              }`}
            >

              <div className="w-full h-20 bg-gray-200 rounded-xl mb-4" />

              <p className="font-bold">Light Mode</p>

              <p className="text-sm mt-2">
                Clean light interface.
              </p>

            </div>

          </div>

        </div>

        {/* ================= DISPLAY SETTINGS ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Eye className="text-cyan-400" size={28} />

            <h2 className="text-3xl font-black text-cyan-400">
              Display Settings
            </h2>

          </div>

          <div className="space-y-5">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div>

                <h3 className="font-bold text-white">
                  Hide Wallet Balance
                </h3>

                <p className="text-gray-400 text-sm">
                  Hide wallet amount on Dashboard and Wallet pages.
                </p>

              </div>

              <button
                onClick={() => toggleSetting("hideWalletBalance")}
                className={`px-5 py-2 rounded-full text-sm font-bold ${
                  settings.hideWalletBalance
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >
                {settings.hideWalletBalance ? "ON" : "OFF"}
              </button>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div>

                <h3 className="font-bold text-white">
                  Hide Gold Balance
                </h3>

                <p className="text-gray-400 text-sm">
                  Hide Gold quantity from Portfolio and Dashboard.
                </p>

              </div>

              <button
                onClick={() => toggleSetting("hideGoldBalance")}
                className={`px-5 py-2 rounded-full text-sm font-bold ${
                  settings.hideGoldBalance
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >
                {settings.hideGoldBalance ? "ON" : "OFF"}
              </button>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div>

                <h3 className="font-bold text-white">
                  Show Portfolio Values
                </h3>

                <p className="text-gray-400 text-sm">
                  Display Gold, PKR Wallet and USDT portfolio values.
                </p>

              </div>

              <button className="px-5 py-2 rounded-full bg-green-600 text-sm font-bold">
                Enabled
              </button>

            </div>

          </div>

        </div>

        {/* ================= SESSION TIMEOUT ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Clock className="text-purple-400" size={28} />

            <h2 className="text-3xl font-black text-purple-400">
              Session Timeout
            </h2>

          </div>

          <div className="bg-black border border-zinc-700 rounded-2xl p-6">

            <div className="flex justify-between mb-4">

              <span className="text-gray-400">
                Auto Logout After
              </span>

              <span className="text-purple-400 font-bold">
                {sessionTimeoutLabel}
              </span>

            </div>

            <input
              type="range"
              min="5"
              max="120"
              step="5"
              value={settings.sessionTimeout}
              onChange={(e) =>
                updateSetting(
                  "sessionTimeout",
                  Number(e.target.value)
                )
              }
              className="w-full accent-purple-500"
            />

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>5 Minutes</span>
              <span>60 Minutes</span>
              <span>120 Minutes</span>
            </div>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/settings/page.tsx
// SECTION 5/10
// NOTIFICATION SETTINGS + EMAIL + SMS + PUSH + PRICE ALERTS
// =====================================================

        {/* ================= NOTIFICATION SETTINGS ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Bell className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Notification Settings
            </h2>

          </div>

          <p className="text-gray-400 mb-8">
            Choose which notifications you want to receive from GoldTrade.
          </p>

          <div className="space-y-5">

            {/* Email Notifications */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">
                <Mail className="text-blue-400" size={24} />

                <div>
                  <h3 className="font-bold text-white">
                    Email Notifications
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Receive account updates via email.
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleSetting("emailNotifications")}
                className={`px-5 py-2 rounded-full font-bold ${
                  settings.emailNotifications
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >
                {settings.emailNotifications ? "ON" : "OFF"}
              </button>

            </div>

            {/* SMS Notifications */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">
                <Smartphone className="text-cyan-400" size={24} />

                <div>
                  <h3 className="font-bold text-white">
                    SMS Notifications
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Receive deposit, withdrawal and OTP SMS alerts.
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleSetting("smsNotifications")}
                className={`px-5 py-2 rounded-full font-bold ${
                  settings.smsNotifications
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >
                {settings.smsNotifications ? "ON" : "OFF"}
              </button>

            </div>

            {/* Push Notifications */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">
                <Bell className="text-yellow-400" size={24} />

                <div>
                  <h3 className="font-bold text-white">
                    Push Notifications
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Instant mobile & web notifications from GoldTrade.
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleSetting("pushNotifications")}
                className={`px-5 py-2 rounded-full font-bold ${
                  settings.pushNotifications
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >
                {settings.pushNotifications ? "ON" : "OFF"}
              </button>

            </div>

            {/* Security Alerts */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">
                <Shield className="text-red-400" size={24} />

                <div>
                  <h3 className="font-bold text-white">
                    Security Alerts
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Login alerts, password changes and device activity.
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleSetting("securityAlerts")}
                className={`px-5 py-2 rounded-full font-bold ${
                  settings.securityAlerts
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >
                {settings.securityAlerts ? "ON" : "OFF"}
              </button>

            </div>

            {/* Marketing Emails */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">
                <Mail className="text-purple-400" size={24} />

                <div>
                  <h3 className="font-bold text-white">
                    Promotions & Marketing Emails
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Receive GoldTrade bonus campaigns and promotional offers.
                  </p>
                </div>
              </div>

              <button
                onClick={() => toggleSetting("marketingEmails")}
                className={`px-5 py-2 rounded-full font-bold ${
                  settings.marketingEmails
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >
                {settings.marketingEmails ? "ON" : "OFF"}
              </button>

            </div>

          </div>

        </div>

        {/* ================= GOLD PRICE ALERTS ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Coins className="text-yellow-400" size={28} />

            <h2 className="text-3xl font-black text-yellow-400">
              Gold Price Alerts
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Notify me when Gold price increases above
              </label>

              <input
                type="number"
                placeholder="300000"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
              />

              <button className="mt-5 w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold">
                Save Increase Alert
              </button>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <label className="block text-gray-400 text-sm mb-2">
                Notify me when Gold price drops below
              </label>

              <input
                type="number"
                placeholder="285000"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
              />

              <button className="mt-5 w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold">
                Save Drop Alert
              </button>

            </div>

          </div>

          <div className="bg-black border border-zinc-700 rounded-2xl p-5 mt-6">

            <h3 className="font-bold text-yellow-400 mb-4">
              Quick Alert Presets
            </h3>

            <div className="grid md:grid-cols-4 gap-4">

              {["1%", "2%", "3%", "5%"].map((item) => (
                <button
                  key={item}
                  className="bg-zinc-800 hover:bg-yellow-500 hover:text-black rounded-xl py-3 font-bold transition"
                >
                  {item} Change
                </button>
              ))}

            </div>

          </div>

        </div>

        {/* ================= DAILY MARKET ALERTS ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Globe className="text-blue-400" size={28} />

            <h2 className="text-3xl font-black text-blue-400">
              Daily Market Alerts
            </h2>

          </div>

          <div className="space-y-5">

            {[
              {
                title: "Morning Gold Market Report",
                desc: "Receive today's opening Gold price every morning.",
              },
              {
                title: "Evening Gold Market Summary",
                desc: "Receive closing Gold price and market summary.",
              },
              {
                title: "International Gold News",
                desc: "Important global Gold market news notifications.",
              },
              {
                title: "USD / PKR Exchange Alerts",
                desc: "Receive Dollar rate alerts affecting Gold prices.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center"
              >

                <div>

                  <h3 className="font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    {item.desc}
                  </p>

                </div>

                <button className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-full font-bold">
                  Enabled
                </button>

              </div>
            ))}

          </div>

        </div>

        {/* ================= ALERT HISTORY ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Clock className="text-purple-400" size={28} />

            <h2 className="text-3xl font-black text-purple-400">
              Notification History
            </h2>

          </div>

          <div className="space-y-4">

            {[
              {
                title: "Deposit Approved",
                time: "Today • 02:45 PM",
              },
              {
                title: "Gold Price Increased by 2.1%",
                time: "Today • 11:20 AM",
              },
              {
                title: "Withdrawal Request Approved",
                time: "Yesterday • 08:10 PM",
              },
              {
                title: "New Login From Chrome Windows",
                time: "Yesterday • 10:40 AM",
              },
            ].map((alert) => (
              <div
                key={alert.title}
                className="bg-black border border-zinc-700 rounded-xl p-4 flex justify-between items-center"
              >

                <div>

                  <p className="font-semibold text-white">
                    {alert.title}
                  </p>

                  <p className="text-gray-500 text-sm mt-1">
                    {alert.time}
                  </p>

                </div>

                <CheckCircle2 className="text-green-400" size={20} />

              </div>
            ))}

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/settings/page.tsx
// SECTION 6/10
// SECURITY SETTINGS + PASSWORD + TWO FACTOR + BIOMETRIC
// =====================================================

        {/* ================= SECURITY SETTINGS ================= */}

        <div className="bg-zinc-900 border border-red-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Shield className="text-red-400" size={28} />

            <h2 className="text-3xl font-black text-red-400">
              Security Settings
            </h2>

          </div>

          <div className="space-y-5">

            {/* Two Factor Authentication */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">

                <Fingerprint className="text-purple-400" size={24} />

                <div>

                  <h3 className="font-bold text-white">
                    Two-Factor Authentication (2FA)
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Protect your account with OTP verification during login.
                  </p>

                </div>

              </div>

              <button
                onClick={() => toggleSetting("twoFactorEnabled")}
                className={`px-5 py-2 rounded-full font-bold transition ${
                  settings.twoFactorEnabled
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >
                {settings.twoFactorEnabled ? "Enabled" : "Enable"}
              </button>

            </div>

            {/* Biometric Authentication */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">

                <Fingerprint className="text-cyan-400" size={24} />

                <div>

                  <h3 className="font-bold text-white">
                    Biometric Authentication
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Use Face ID or Fingerprint on supported mobile devices.
                  </p>

                </div>

              </div>

              <button
                onClick={() => toggleSetting("biometricEnabled")}
                className={`px-5 py-2 rounded-full font-bold transition ${
                  settings.biometricEnabled
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >
                {settings.biometricEnabled ? "Enabled" : "Enable"}
              </button>

            </div>

            {/* Security Alerts */}

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">

              <div className="flex items-center gap-4">

                <AlertTriangle className="text-yellow-400" size={24} />

                <div>

                  <h3 className="font-bold text-white">
                    Critical Security Alerts
                  </h3>

                  <p className="text-gray-400 text-sm">
                    Receive alerts for unknown logins and password changes.
                  </p>

                </div>

              </div>

              <button
                onClick={() => toggleSetting("securityAlerts")}
                className={`px-5 py-2 rounded-full font-bold transition ${
                  settings.securityAlerts
                    ? "bg-green-600"
                    : "bg-zinc-700"
                }`}
              >
                {settings.securityAlerts ? "ON" : "OFF"}
              </button>

            </div>

          </div>

        </div>

        {/* ================= PASSWORD MANAGEMENT ================= */}

        <div className="bg-zinc-900 border border-orange-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <KeyRound className="text-orange-400" size={28} />

            <h2 className="text-3xl font-black text-orange-400">
              Password Management
            </h2>

          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Current Password
              </label>

              <div className="relative">

                <input
                  type={passwordVisibility ? "text" : "password"}
                  placeholder="Enter current password"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-white focus:border-orange-500 outline-none"
                />

                <button
                  type="button"
                  onClick={() => setPasswordVisibility(!passwordVisibility)}
                  className="absolute right-4 top-3 text-gray-400 hover:text-white"
                >
                  {passwordVisibility ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>

              </div>

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                New Password
              </label>

              <input
                type="password"
                placeholder="Enter new password"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none"
              />

            </div>

            <div>

              <label className="block text-gray-400 text-sm mb-2">
                Confirm Password
              </label>

              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none"
              />

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <p className="text-gray-400 text-sm">
                Password Last Changed
              </p>

              <h3 className="text-xl font-black text-orange-400 mt-2">
                {passwordUpdatedDate}
              </h3>

              <p className="text-gray-500 text-sm mt-3">
                Update your password every 90 days for better security.
              </p>

            </div>

          </div>

          <button className="w-full mt-8 bg-orange-500 hover:bg-orange-400 text-black py-4 rounded-2xl font-black text-lg">
            Update Password
          </button>

        </div>

        {/* ================= SECURITY STATUS ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <BadgeCheck className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Verification Status
            </h2>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="bg-black border border-green-600 rounded-2xl p-5 text-center">

              <Mail className="mx-auto text-green-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">Email</p>

              <h3 className="font-black text-green-400 mt-2">
                {security.emailVerified ? "Verified" : "Pending"}
              </h3>

            </div>

            <div className="bg-black border border-cyan-600 rounded-2xl p-5 text-center">

              <Smartphone className="mx-auto text-cyan-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">Phone</p>

              <h3 className="font-black text-cyan-400 mt-2">
                {security.phoneVerified ? "Verified" : "Pending"}
              </h3>

            </div>

            <div className="bg-black border border-yellow-500 rounded-2xl p-5 text-center">

              <Shield className="mx-auto text-yellow-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">KYC</p>

              <h3 className="font-black text-yellow-400 mt-2">
                {security.kycVerified ? "Verified" : "Pending"}
              </h3>

            </div>

            <div className="bg-black border border-purple-600 rounded-2xl p-5 text-center">

              <Fingerprint className="mx-auto text-purple-400 mb-3" size={26} />

              <p className="text-gray-400 text-sm">2FA</p>

              <h3 className="font-black text-purple-400 mt-2">
                {settings.twoFactorEnabled ? "Enabled" : "Disabled"}
              </h3>

            </div>

          </div>

        </div>

        {/* ================= SECURITY RECOMMENDATIONS ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <AlertTriangle className="text-yellow-400" size={28} />

            <h2 className="text-3xl font-black text-yellow-400">
              Security Recommendations
            </h2>

          </div>

          <div className="space-y-4">

            {[
              "Enable Two-Factor Authentication for every login.",
              "Verify both your email and mobile number.",
              "Complete KYC verification for unlimited transactions.",
              "Use a strong password with letters, numbers and symbols.",
              "Remove inactive devices from your account regularly.",
              "Never share OTP or recovery codes with anyone.",
            ].map((tip) => (
              <div
                key={tip}
                className="bg-black border border-zinc-700 rounded-xl p-4 flex items-start gap-3"
              >

                <CheckCircle2 className="text-green-400 mt-1" size={18} />

                <p className="text-gray-300 text-sm">{tip}</p>

              </div>
            ))}

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/settings/page.tsx
// SECTION 7/10
// PRIVACY SETTINGS + LOGIN SESSIONS + CONNECTED DEVICES
// =====================================================

        {/* ================= PRIVACY SETTINGS ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Eye className="text-cyan-400" size={28} />

            <h2 className="text-3xl font-black text-cyan-400">
              Privacy Settings
            </h2>
          </div>

          <div className="space-y-5">

            {[
              {
                key: "hideWalletBalance",
                title: "Hide Wallet Balance",
                desc: "Hide wallet amount throughout the application."
              },
              {
                key: "hideGoldBalance",
                title: "Hide Gold Balance",
                desc: "Hide Gold holdings from dashboard and portfolio."
              },
              {
                key: "marketingEmails",
                title: "Private Referral Profile",
                desc: "Hide referral information from public profile."
              }
            ].map((item) => (
              <div
                key={item.title}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold text-white">
                    {item.title}
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    {item.desc}
                  </p>
                </div>

                <button
                  onClick={() =>
                    toggleSetting(item.key as keyof SettingsData)
                  }
                  className={`px-5 py-2 rounded-full font-bold ${
                    settings[item.key as keyof SettingsData]
                      ? "bg-green-600"
                      : "bg-zinc-700"
                  }`}
                >
                  {settings[item.key as keyof SettingsData] ? "ON" : "OFF"}
                </button>
              </div>
            ))}

          </div>

        </div>

        {/* ================= LOGIN SESSIONS ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Smartphone className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Login Sessions
            </h2>
          </div>

          <div className="space-y-4">

            {[
              {
                device: "Chrome • Windows 11",
                location: "Islamabad, Pakistan",
                status: "Current Session",
                color: "green"
              },
              {
                device: "GoldTrade Android App",
                location: "Lahore, Pakistan",
                status: "Trusted Device",
                color: "blue"
              },
              {
                device: "Safari • iPhone",
                location: "Dubai, UAE",
                status: "Trusted Device",
                color: "blue"
              },
              {
                device: "Chrome • MacBook",
                location: "Phnom Penh, Cambodia",
                status: "Inactive",
                color: "red"
              }
            ].map((session, index) => (
              <div
                key={index}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>

                  <h3 className="font-bold text-white">
                    {session.device}
                  </h3>

                  <p className="text-gray-400 text-sm mt-1">
                    {session.location}
                  </p>

                  <p className="text-gray-500 text-xs mt-2">
                    Last Active: Today • 09:45 PM
                  </p>

                </div>

                <div className="flex gap-3 items-center">

                  <span
                    className={`px-4 py-2 rounded-full text-xs font-bold ${
                      session.color === "green"
                        ? "bg-green-600"
                        : session.color === "blue"
                        ? "bg-blue-600"
                        : "bg-red-600"
                    }`}
                  >
                    {session.status}
                  </span>

                  {session.status !== "Current Session" && (
                    <button className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-xl text-sm font-bold">
                      Remove
                    </button>
                  )}

                </div>

              </div>
            ))}

          </div>

          <button
            onClick={logoutAllDevices}
            className="w-full mt-8 bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black text-lg"
          >
            Logout From All Devices
          </button>

        </div>

        {/* ================= CONNECTED DEVICES ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Database className="text-purple-400" size={28} />

            <h2 className="text-3xl font-black text-purple-400">
              Connected Devices
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            {[
              {
                name: "Windows Laptop",
                browser: "Google Chrome",
                trusted: true
              },
              {
                name: "Android Phone",
                browser: "GoldTrade Mobile App",
                trusted: true
              },
              {
                name: "iPhone 15 Pro",
                browser: "Safari Browser",
                trusted: true
              },
              {
                name: "MacBook Air",
                browser: "Chrome Browser",
                trusted: false
              }
            ].map((device, index) => (
              <div
                key={index}
                className="bg-black border border-zinc-700 rounded-2xl p-5"
              >

                <div className="flex justify-between items-center mb-3">

                  <h3 className="font-bold text-white">
                    {device.name}
                  </h3>

                  {device.trusted ? (
                    <BadgeCheck className="text-green-400" size={20} />
                  ) : (
                    <AlertTriangle className="text-red-400" size={20} />
                  )}

                </div>

                <p className="text-gray-400 text-sm">
                  {device.browser}
                </p>

                <button className="mt-5 w-full bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold">
                  Disconnect Device
                </button>

              </div>
            ))}

          </div>

        </div>

        {/* ================= API SECURITY ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Database className="text-yellow-400" size={28} />

            <h2 className="text-3xl font-black text-yellow-400">
              API Security
            </h2>
          </div>

          <div className="space-y-5">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <p className="text-gray-400 text-sm mb-2">
                API Access Token
              </p>

              <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-yellow-400 font-mono break-all">
                ************JWT_ACCESS_TOKEN************
              </div>

              <button className="mt-4 bg-yellow-500 hover:bg-yellow-400 text-black px-5 py-2 rounded-xl font-bold">
                Regenerate API Token
              </button>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">

              <h3 className="font-bold text-white mb-3">
                API Security Status
              </h3>

              <div className="space-y-3 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-400">JWT Authentication</span>
                  <span className="text-green-400 font-bold">Enabled</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">HTTPS Required</span>
                  <span className="text-green-400 font-bold">Enabled</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Token Expiry</span>
                  <span className="text-yellow-400 font-bold">24 Hours</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">Refresh Token</span>
                  <span className="text-green-400 font-bold">Enabled</span>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/settings/page.tsx
// SECTION 8/10
// WALLET SETTINGS + PAYMENT METHODS + TRADING PREFERENCES
// =====================================================

        {/* ================= WALLET SETTINGS ================= */}

        <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Wallet className="text-yellow-400" size={28} />

            <h2 className="text-3xl font-black text-yellow-400">
              Wallet Settings
            </h2>
          </div>

          <div className="space-y-5">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">Default Deposit Currency</h3>
                <p className="text-gray-400 text-sm">
                  Choose your preferred deposit currency.
                </p>
              </div>

              <select
                value={settings.currency}
                onChange={(e) => updateSetting("currency", e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white"
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="USDT">USDT</option>
              </select>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">Auto Refresh Wallet</h3>
                <p className="text-gray-400 text-sm">
                  Automatically refresh wallet balances every minute.
                </p>
              </div>

              <button className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-full font-bold">
                Enabled
              </button>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">Hide Small Balances</h3>
                <p className="text-gray-400 text-sm">
                  Hide wallets with balance below PKR 100.
                </p>
              </div>

              <button className="bg-zinc-700 hover:bg-zinc-600 px-5 py-2 rounded-full font-bold">
                OFF
              </button>
            </div>

          </div>

        </div>

        {/* ================= PAYMENT METHODS ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <CreditCard className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Payment Methods
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            {[
              { name: "Meezan Bank", status: "Primary", color: "green" },
              { name: "HBL Bank", status: "Secondary", color: "blue" },
              { name: "JazzCash", status: "Active", color: "purple" },
              { name: "EasyPaisa", status: "Active", color: "orange" },
            ].map((bank, index) => (
              <div
                key={index}
                className="bg-black border border-zinc-700 rounded-2xl p-5"
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-white">{bank.name}</h3>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      bank.color === "green"
                        ? "bg-green-600"
                        : bank.color === "blue"
                        ? "bg-blue-600"
                        : bank.color === "purple"
                        ? "bg-purple-600"
                        : "bg-orange-500 text-black"
                    }`}
                  >
                    {bank.status}
                  </span>
                </div>

                <button className="w-full mt-3 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold">
                  Manage Payment Method
                </button>
              </div>
            ))}

          </div>

          <button className="w-full mt-8 bg-green-600 hover:bg-green-500 py-4 rounded-2xl font-black text-lg">
            Add New Payment Method
          </button>

        </div>

        {/* ================= TRADING PREFERENCES ================= */}

        <div className="bg-zinc-900 border border-blue-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Coins className="text-blue-400" size={28} />

            <h2 className="text-3xl font-black text-blue-400">
              Trading Preferences
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Default Buy Unit
              </label>

              <select className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white">
                <option>1 Gram</option>
                <option>5 Gram</option>
                <option>10 Gram</option>
                <option>1 Tola</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Default Sell Unit
              </label>

              <select className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white">
                <option>1 Gram</option>
                <option>5 Gram</option>
                <option>10 Gram</option>
                <option>1 Tola</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Price Refresh Interval
              </label>

              <select className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white">
                <option>5 Seconds</option>
                <option>10 Seconds</option>
                <option>15 Seconds</option>
                <option>30 Seconds</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">
                Default Order Type
              </label>

              <select className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white">
                <option>Market Order</option>
                <option>Limit Order</option>
              </select>
            </div>

          </div>

          <button className="w-full mt-8 bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-lg">
            Save Trading Preferences
          </button>

        </div>

        {/* ================= AUTO BUY / SELL SETTINGS ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Database className="text-purple-400" size={28} />

            <h2 className="text-3xl font-black text-purple-400">
              Auto Buy / Sell Settings
            </h2>
          </div>

          <div className="space-y-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">Enable Auto Buy</h3>
                <p className="text-gray-400 text-sm">
                  Automatically buy Gold when your target price is reached.
                </p>
              </div>

              <button className="bg-zinc-700 hover:bg-zinc-600 px-5 py-2 rounded-full font-bold">
                OFF
              </button>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">Enable Auto Sell</h3>
                <p className="text-gray-400 text-sm">
                  Automatically sell Gold at your target price.
                </p>
              </div>

              <button className="bg-zinc-700 hover:bg-zinc-600 px-5 py-2 rounded-full font-bold">
                OFF
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Auto Buy Target Price (PKR)
                </label>

                <input
                  type="number"
                  placeholder="Enter Buy Price"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Auto Sell Target Price (PKR)
                </label>

                <input
                  type="number"
                  placeholder="Enter Sell Price"
                  className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white"
                />
              </div>

            </div>

            <button className="w-full bg-purple-600 hover:bg-purple-500 py-4 rounded-2xl font-black text-lg">
              Save Auto Trading Rules
            </button>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/settings/page.tsx
// SECTION 9/10
// DATA EXPORT + ACCOUNT RECOVERY + PRIVACY + DANGER ZONE
// =====================================================

        {/* ================= DATA EXPORT & BACKUP ================= */}

        <div className="bg-zinc-900 border border-cyan-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Database className="text-cyan-400" size={28} />

            <h2 className="text-3xl font-black text-cyan-400">
              Data Export & Backup
            </h2>
          </div>

          <p className="text-gray-400 mb-6">
            Download a secure copy of your GoldTrade account information.
          </p>

          <div className="grid lg:grid-cols-2 gap-6">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <h3 className="font-bold text-cyan-400 mb-2">
                Export Wallet History
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                Download deposits, withdrawals and transfers in CSV format.
              </p>

              <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-bold">
                Export CSV
              </button>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <h3 className="font-bold text-cyan-400 mb-2">
                Export Trading History
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                Download Gold Buy/Sell transaction history.
              </p>

              <button className="w-full bg-cyan-600 hover:bg-cyan-500 py-3 rounded-xl font-bold">
                Export Trading CSV
              </button>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <h3 className="font-bold text-cyan-400 mb-2">
                Download Account Backup
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                Backup profile, KYC status and settings as JSON.
              </p>

              <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold">
                Download Backup
              </button>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <h3 className="font-bold text-cyan-400 mb-2">
                Restore Backup
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                Upload a previously downloaded GoldTrade backup file.
              </p>

              <label className="block w-full cursor-pointer bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl text-center font-bold">
                Upload Backup File
                <input type="file" className="hidden" accept=".json" />
              </label>
            </div>

          </div>

        </div>

        {/* ================= ACCOUNT RECOVERY ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <KeyRound className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Account Recovery
            </h2>
          </div>

          <div className="space-y-5">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">
                  Recovery Email
                </h3>

                <p className="text-gray-400 text-sm">
                  {security.emailVerified
                    ? "Verified recovery email is configured."
                    : "No verified recovery email configured."}
                </p>
              </div>

              <button className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-xl font-bold">
                Update Email
              </button>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white">
                  Recovery Phone Number
                </h3>

                <p className="text-gray-400 text-sm">
                  {security.phoneVerified
                    ? "Verified recovery phone number is configured."
                    : "No verified recovery phone configured."}
                </p>
              </div>

              <button className="bg-cyan-600 hover:bg-cyan-500 px-5 py-2 rounded-xl font-bold">
                Update Phone
              </button>
            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-3">
                Recovery Phrase
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                Store your recovery phrase safely. It helps recover your account if you lose access.
              </p>

              <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold">
                Generate Recovery Phrase
              </button>
            </div>

          </div>

        </div>

        {/* ================= PRIVACY CONTROLS ================= */}

        <div className="bg-zinc-900 border border-purple-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <Eye className="text-purple-400" size={28} />

            <h2 className="text-3xl font-black text-purple-400">
              Privacy Controls
            </h2>
          </div>

          <div className="space-y-5">

            {[
              {
                title: "Hide Wallet Balance",
                desc: "Hide wallet balance across the application."
              },
              {
                title: "Hide Gold Portfolio",
                desc: "Hide Gold holdings from dashboard and reports."
              },
              {
                title: "Hide Referral Code",
                desc: "Prevent referral code from appearing publicly."
              },
              {
                title: "Allow Personalized Offers",
                desc: "Receive offers based on your trading activity."
              }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-black border border-zinc-700 rounded-2xl p-5 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-bold text-white">{item.title}</h3>

                  <p className="text-gray-400 text-sm mt-1">
                    {item.desc}
                  </p>
                </div>

                <button className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-full font-bold">
                  Enabled
                </button>
              </div>
            ))}

          </div>

        </div>

        {/* ================= DANGER ZONE ================= */}

        <div className="bg-zinc-900 border border-red-700 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">
            <AlertTriangle className="text-red-500" size={30} />

            <h2 className="text-3xl font-black text-red-500">
              Danger Zone
            </h2>
          </div>

          <div className="space-y-6">

            <div className="bg-black border border-red-700 rounded-2xl p-5">

              <h3 className="font-bold text-red-400 text-lg mb-2">
                Logout Current Session
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                Logout from this device only.
              </p>

              <button
                onClick={logoutCurrentSession}
                className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold"
              >
                Logout Current Device
              </button>

            </div>

            <div className="bg-black border border-red-700 rounded-2xl p-5">

              <h3 className="font-bold text-red-400 text-lg mb-2">
                Logout All Devices
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                End every active GoldTrade session immediately.
              </p>

              <button
                onClick={logoutAllDevices}
                className="bg-red-700 hover:bg-red-600 px-6 py-3 rounded-xl font-bold"
              >
                Logout Everywhere
              </button>

            </div>

            <div className="bg-black border border-red-700 rounded-2xl p-5">

              <h3 className="font-bold text-red-400 text-lg mb-2">
                Delete GoldTrade Account
              </h3>

              <p className="text-gray-400 text-sm mb-4">
                Permanently request deletion of your account after admin verification.
              </p>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="bg-red-700 hover:bg-red-600 px-6 py-3 rounded-xl font-bold"
              >
                Request Account Deletion
              </button>

            </div>

          </div>

        </div>

        {/* ================= NEXT SECTION STARTS HERE ================= */}// =====================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: frontend/app/settings/page.tsx
// SECTION 10/10
// SAVE SETTINGS + RESET + MODALS + FOOTER + CLOSE COMPONENT
// =====================================================

        {/* ================= SAVE SETTINGS PANEL ================= */}

        <div className="bg-gradient-to-r from-yellow-900 via-black to-yellow-900 border border-yellow-500 rounded-3xl p-8 mb-10">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

            <div>

              <h2 className="text-4xl font-black text-yellow-400">
                Save GoldTrade Settings
              </h2>

              <p className="text-gray-300 mt-3 max-w-2xl">
                Your preferences are securely saved in MongoDB and protected
                with JWT authentication. Changes apply across Dashboard,
                Wallet, Trading and Mobile App.
              </p>

            </div>

            <div className="flex flex-col gap-4 min-w-[250px]">

              <button
                onClick={saveSettings}
                disabled={saving}
                className="bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Save size={22} />

                {saving ? "Saving..." : "Save All Settings"}
              </button>

              <button
                onClick={resetSettings}
                className="bg-zinc-800 hover:bg-zinc-700 py-4 rounded-2xl font-black text-white"
              >
                Reset To Default
              </button>

            </div>

          </div>

        </div>

        {/* ================= LOGOUT MODAL ================= */}

        {showLogoutModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">

            <div className="bg-zinc-900 border border-red-600 rounded-3xl p-8 w-full max-w-md">

              <div className="flex items-center gap-3 mb-5">

                <AlertTriangle className="text-red-500" size={30} />

                <h2 className="text-2xl font-black text-red-500">
                  Logout Account
                </h2>

              </div>

              <p className="text-gray-300 mb-8">
                Are you sure you want to logout from this device?
              </p>

              <div className="flex gap-4">

                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold"
                >
                  Cancel
                </button>

                <button
                  onClick={logoutCurrentSession}
                  className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold"
                >
                  Logout
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ================= DELETE ACCOUNT MODAL ================= */}

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">

            <div className="bg-zinc-900 border border-red-700 rounded-3xl p-8 w-full max-w-lg">

              <div className="flex items-center gap-3 mb-5">

                <AlertTriangle className="text-red-500" size={30} />

                <h2 className="text-2xl font-black text-red-500">
                  Delete GoldTrade Account
                </h2>

              </div>

              <p className="text-gray-300 mb-5">
                This action will permanently request deletion of your GoldTrade
                account after administrator verification.
              </p>

              <div className="bg-red-950 border border-red-700 rounded-2xl p-5 mb-6">

                <p className="text-red-300 text-sm">
                  Warning:
                </p>

                <ul className="text-red-200 text-sm mt-3 space-y-2">
                  <li>• Wallet balances will become inaccessible.</li>
                  <li>• Trading history will be archived.</li>
                  <li>• Referral rewards will be removed.</li>
                  <li>• This request cannot be cancelled after approval.</li>
                </ul>

              </div>

              <div className="flex gap-4">

                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold"
                >
                  Cancel
                </button>

                <button
                  onClick={requestDeleteAccount}
                  className="flex-1 bg-red-700 hover:bg-red-600 py-3 rounded-xl font-bold"
                >
                  Confirm Delete
                </button>

              </div>

            </div>

          </div>
        )}

        {/* ================= SETTINGS SUMMARY ================= */}

        <div className="bg-zinc-900 border border-green-600 rounded-3xl p-6 mb-10">

          <div className="flex items-center gap-3 mb-8">

            <CheckCircle2 className="text-green-400" size={28} />

            <h2 className="text-3xl font-black text-green-400">
              Settings Summary
            </h2>

          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 text-center">

              <Palette className="mx-auto text-yellow-400 mb-3" size={24} />

              <p className="text-gray-400 text-sm">Theme</p>

              <h3 className="text-xl font-black capitalize text-yellow-400 mt-2">
                {settings.theme}
              </h3>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 text-center">

              <Languages className="mx-auto text-cyan-400 mb-3" size={24} />

              <p className="text-gray-400 text-sm">Language</p>

              <h3 className="text-xl font-black text-cyan-400 mt-2">
                {settings.language}
              </h3>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 text-center">

              <CreditCard className="mx-auto text-green-400 mb-3" size={24} />

              <p className="text-gray-400 text-sm">Currency</p>

              <h3 className="text-xl font-black text-green-400 mt-2">
                {settings.currency}
              </h3>

            </div>

            <div className="bg-black border border-zinc-700 rounded-2xl p-5 text-center">

              <Shield className="mx-auto text-purple-400 mb-3" size={24} />

              <p className="text-gray-400 text-sm">Security Level</p>

              <h3 className="text-xl font-black text-purple-400 mt-2">
                {securityLevel}
              </h3>

            </div>

          </div>

        </div>

        {/* ================= FOOTER ================= */}

        <footer className="border-t border-zinc-800 pt-8 pb-6">

          <div className="grid md:grid-cols-3 gap-6">

            <div>

              <h3 className="text-2xl font-black text-yellow-400">
                GoldTrade V17 Enterprise
              </h3>

              <p className="text-gray-400 mt-2">
                Pakistan Digital Gold Trading Platform
              </p>

            </div>

            <div>

              <p className="text-gray-400 text-sm">
                Settings Module
              </p>

              <p className="text-white font-semibold mt-2">
                Notifications • Security • Wallet • Privacy • Trading
              </p>

            </div>

            <div className="md:text-right">

              <p className="text-gray-400 text-sm">
                Security Status
              </p>

              <p className="text-green-400 font-semibold mt-2">
                JWT Protected • MongoDB Stored • Enterprise Ready
              </p>

            </div>

          </div>

          <div className="border-t border-zinc-800 mt-8 pt-5 text-center text-gray-500 text-sm">

            © 2026 GoldTrade Pakistan. All Rights Reserved.

          </div>

        </footer>

      </div>
    </main>
  );
}