"use client";

// ==========================================================
// GoldTrade V18 Enterprise Login Page
// PART 1/8
// Next.js 15 + TypeScript + Render + Vercel Production
// ==========================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Send,
} from "lucide-react";

// ==========================================================
// API CONFIG
// ==========================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com";

// ==========================================================
// CONTACT DETAILS (Change anytime)
// ==========================================================

const SUPPORT = {
  telegram: "@Zoyakhan03",
  telegramLink: "https://t.me/Zoyakhan03",

  whatsapp: "+6282146651034",
  whatsappLink: "https://wa.me/6282146651034",
};

// ==========================================================
// TYPES
// ==========================================================

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;

  user?: {
    id: string;
    username: string;
    email: string;
    role: "admin" | "user";

    wallet: number;
    pkrBalance: number;
    usdtBalance: number;
    goldBalance: number;

    fullName?: string;
  };
}

// ==========================================================
// COMPONENT
// ==========================================================

export default function LoginPage() {
  const router = useRouter();

  // ----------------------------
  // FORM STATE
  // ----------------------------

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // ----------------------------
  // UI STATE
  // ----------------------------

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [rememberMe, setRememberMe] = useState(true);

 // ==========================================================
// AUTO LOGIN CHECK (LOOP FIX)
// ==========================================================

useEffect(() => {
  // Browser me hi run kare
  if (typeof window === "undefined") return;

  try {
    const localToken = localStorage.getItem("goldtrade_token");
    const sessionToken = sessionStorage.getItem("goldtrade_token");

    const token = localToken || sessionToken;

    if (!token) return;

    const userData =
      localStorage.getItem("goldtrade_user") ||
      sessionStorage.getItem("goldtrade_user");

    if (!userData) return;

    const user = JSON.parse(userData);

    // Sirf login page par hi redirect karo
    if (window.location.pathname === "/login") {
      if (user.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  } catch (error) {
    console.error("AUTO LOGIN CHECK ERROR:", error);

    localStorage.removeItem("goldtrade_token");
    localStorage.removeItem("goldtrade_user");
    localStorage.removeItem("goldtrade_role");

    sessionStorage.removeItem("goldtrade_token");
    sessionStorage.removeItem("goldtrade_user");
    sessionStorage.removeItem("goldtrade_role");
  }
}, []);

// ==========================================================
// SAVE LOGIN SESSION
// ==========================================================

const saveSession = (data: LoginResponse) => {
  if (!data.token || !data.user) return;

  // Purani session remove
  localStorage.removeItem("goldtrade_token");
  localStorage.removeItem("goldtrade_user");
  localStorage.removeItem("goldtrade_role");

  sessionStorage.removeItem("goldtrade_token");
  sessionStorage.removeItem("goldtrade_user");
  sessionStorage.removeItem("goldtrade_role");

  const storage = rememberMe ? localStorage : sessionStorage;

  storage.setItem("goldtrade_token", data.token);
  storage.setItem("goldtrade_user", JSON.stringify(data.user));
  storage.setItem("goldtrade_role", data.user.role);
  storage.setItem("goldtrade_username", data.user.username);
  storage.setItem("goldtrade_email", data.user.email);
};

// ==========================================================
// LOGIN HANDLER (PRODUCTION FIX)
// ==========================================================

const handleLogin = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  setErrorMessage("");
  setSuccessMessage("");

  if (!username.trim()) {
    setErrorMessage("Please enter your username or email.");
    return;
  }

  if (!password.trim()) {
    setErrorMessage("Please enter your password.");
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim().toLowerCase(),
        password,
      }),
    });

    const data: LoginResponse = await response.json();

    console.log("LOGIN RESPONSE:", data);

    if (!response.ok || !data.success || !data.user) {
      throw new Error(data.message || "Login failed.");
    }

    // Save JWT + User
    saveSession(data);

    setSuccessMessage("Login successful. Redirecting...");

    // Loading animation
    await new Promise((resolve) => setTimeout(resolve, 700));

    if (data.user.role === "admin") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/dashboard");
    }
  } catch (error: any) {
    console.error("LOGIN ERROR:", error);

    setErrorMessage(error.message || "Login failed.");
  } finally {
    setLoading(false);
  }
};

  // ==========================================================
  // ENTER KEY LOGIN
  // ==========================================================

  const handleEnterKey = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const form = document.getElementById(
        "goldtrade-login-form"
      ) as HTMLFormElement | null;

      form?.requestSubmit();
    }
  };

  // ==========================================================
  // CLEAR ALERTS
  // ==========================================================

  useEffect(() => {
    if (!errorMessage && !successMessage) return;

    const timer = setTimeout(() => {
      setErrorMessage("");
      setSuccessMessage("");
    }, 5000);

    return () => clearTimeout(timer);
  }, [errorMessage, successMessage]);
    // ==========================================================
  // UI START
  // ==========================================================

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md">

        {/* ========================= LOGO ========================= */}

        <div className="text-center mb-8">
          <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-2xl shadow-yellow-500/30">

            <ShieldCheck className="h-10 w-10 text-black" />

          </div>

          <h1 className="mt-5 text-4xl font-bold text-white tracking-wide">
            GoldTrade V18
          </h1>

          <p className="mt-2 text-slate-400 text-sm">
            Enterprise Trading Platform
          </p>
        </div>

        {/* ========================= LOGIN CARD ========================= */}

        <div className="rounded-3xl border border-yellow-500/20 bg-slate-900/70 backdrop-blur-xl shadow-2xl overflow-hidden">

          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 px-6 py-5">
            <h2 className="text-center text-black font-bold text-xl">
              Secure Account Login
            </h2>

            <p className="text-center text-black/80 text-sm mt-1">
              Login with your GoldTrade account.
            </p>
          </div>

          <div className="p-6">

            {/* ========================= ERROR ========================= */}

            {errorMessage && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />

                <div>
                  <p className="font-semibold text-red-300">
                    Login Failed
                  </p>

                  <p className="text-red-200 text-sm mt-1">
                    {errorMessage}
                  </p>
                </div>

              </div>
            )}

            {/* ========================= SUCCESS ========================= */}

            {successMessage && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">

                <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" />

                <div>
                  <p className="font-semibold text-green-300">
                    Success
                  </p>

                  <p className="text-green-200 text-sm mt-1">
                    {successMessage}
                  </p>
                </div>

              </div>
            )}

            {/* ========================= LOGIN FORM ========================= */}

            <form
              id="goldtrade-login-form"
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* ================= USERNAME ================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Username or Email
                </label>

                <div className="relative">

                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-yellow-400" />

                  <input
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={handleEnterKey}
                    placeholder="Enter username or email"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-4 text-white outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/30"
                  />

                </div>

              </div>

              {/* ================= PASSWORD ================= */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>

                <div className="relative">

                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-yellow-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleEnterKey}
                    placeholder="Enter password"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-12 pr-12 text-white outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/30"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-yellow-400 transition"
                  >
                    {showPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>

                </div>

              </div>
                            {/* ================= REMEMBER ME ================= */}

              <div className="flex items-center justify-between">

                <label className="flex items-center gap-3 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-yellow-500 bg-slate-900 text-yellow-500 focus:ring-yellow-500"
                  />

                  <span className="text-sm text-slate-300">
                    Remember Me
                  </span>

                </label>

                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition"
                >
                  Forgot Password?
                </button>

              </div>

              {/* ================= LOGIN BUTTON ================= */}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-600 py-3 font-bold text-black transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    Login Securely
                  </>
                )}
              </button>

            </form>

            {/* ================= CREATE ACCOUNT ================= */}

            <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/40 p-5">

              <p className="text-center text-sm text-slate-300">
                Don't have a GoldTrade account?
              </p>

              <button
                type="button"
                onClick={() => router.push("/signup")}
                className="mt-4 w-full rounded-xl border border-yellow-500 py-3 font-semibold text-yellow-400 transition hover:bg-yellow-500 hover:text-black"
              >
                Create New Account
              </button>

            </div>

            {/* ================= CONTACT SUPPORT ================= */}

            <div className="mt-8 rounded-2xl border border-cyan-500/20 bg-slate-950/60 p-5">

              <h3 className="mb-4 text-center text-lg font-bold text-cyan-300">
                Need Help? Contact GoldTrade Support
              </h3>

              {/* Telegram */}

              <a
                href={SUPPORT.telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 flex items-center justify-between rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 transition hover:bg-sky-500/20"
              >
                <div className="flex items-center gap-3">

                  <Send className="h-6 w-6 text-sky-400" />

                  <div>
                    <p className="text-sm text-slate-300">
                      Telegram Support
                    </p>

                    <p className="font-semibold text-sky-300">
                      {SUPPORT.telegram}
                    </p>
                  </div>

                </div>

                <span className="text-xs font-semibold text-sky-300">
                  Open
                </span>
              </a>

              {/* WhatsApp */}

              <a
                href={SUPPORT.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 transition hover:bg-green-500/20"
              >
                <div className="flex items-center gap-3">

                  <MessageCircle className="h-6 w-6 text-green-400" />

                  <div>
                    <p className="text-sm text-slate-300">
                      WhatsApp Support
                    </p>

                    <p className="font-semibold text-green-300">
                      {SUPPORT.whatsapp}
                    </p>
                  </div>

                </div>

                <span className="text-xs font-semibold text-green-300">
                  Chat Now
                </span>
              </a>

              <p className="mt-4 text-center text-xs text-slate-500">
                Our support team is available 24/7 to help with login,
                deposits, withdrawals, wallet issues and account verification.
              </p>

            </div>

            {/* ================= SECURITY NOTICE ================= */}

            <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4">

              <div className="flex items-start gap-3">

                <ShieldCheck className="mt-0.5 h-5 w-5 text-yellow-400" />

                <div>

                  <p className="font-semibold text-yellow-300">
                    GoldTrade Enterprise Security
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-300">
                    Your login is protected using JWT authentication,
                    encrypted passwords (bcrypt), HTTPS API requests and
                    secure MongoDB storage.
                  </p>

                </div>

              </div>

            </div>
                        {/* ================= LIVE SERVER STATUS ================= */}

            <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />

                  <div>
                    <p className="font-semibold text-emerald-300">
                      GoldTrade Network Status
                    </p>

                    <p className="text-xs text-slate-300 mt-1">
                      Authentication • Wallet • Deposit • Withdraw • USDT • Gold
                    </p>
                  </div>

                </div>

                <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-black">
                  ONLINE
                </span>

              </div>

            </div>

            {/* ================= CONTACT FOOTER ================= */}

            <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/50 p-5">

              <p className="text-center text-sm font-semibold text-white">
                Need Immediate Assistance?
              </p>

              <p className="mt-2 text-center text-xs text-slate-400">
                Contact our support team anytime for deposits, withdrawals,
                wallet issues, verification or account recovery.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">

                <a
                  href={SUPPORT.telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 transition hover:bg-sky-500/20"
                >
                  <Send className="mb-2 h-7 w-7 text-sky-400" />

                  <span className="text-sm font-semibold text-sky-300">
                    Telegram
                  </span>

                  <span className="mt-1 text-xs text-slate-400">
                    {SUPPORT.telegram}
                  </span>
                </a>

                <a
                  href={SUPPORT.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center rounded-xl border border-green-500/30 bg-green-500/10 p-4 transition hover:bg-green-500/20"
                >
                  <MessageCircle className="mb-2 h-7 w-7 text-green-400" />

                  <span className="text-sm font-semibold text-green-300">
                    WhatsApp
                  </span>

                  <span className="mt-1 text-xs text-slate-400">
                    {SUPPORT.whatsapp}
                  </span>
                </a>

              </div>

            </div>

            {/* ================= LEGAL LINKS ================= */}

            <div className="mt-8 border-t border-slate-800 pt-6">

              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">

                <button
                  type="button"
                  onClick={() => router.push("/terms")}
                  className="hover:text-yellow-400 transition"
                >
                  Terms of Service
                </button>

                <span>•</span>

                <button
                  type="button"
                  onClick={() => router.push("/privacy")}
                  className="hover:text-yellow-400 transition"
                >
                  Privacy Policy
                </button>

                <span>•</span>

                <button
                  type="button"
                  onClick={() => router.push("/contact")}
                  className="hover:text-yellow-400 transition"
                >
                  Contact Us
                </button>

              </div>

              <p className="mt-6 text-center text-xs text-slate-600">
                © {new Date().getFullYear()} GoldTrade V18 Enterprise.
                All rights reserved.
              </p>

              <p className="mt-2 text-center text-[11px] text-slate-700">
                Secure Trading Platform • JWT Authentication • MongoDB Atlas • Render Cloud
              </p>

            </div>

          </div>

        </div>
                {/* ==========================================================
            FLOATING SUPPORT BUTTONS
            ========================================================== */}

        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">

          {/* WhatsApp Floating Button */}

          <a
            href={SUPPORT.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-2xl shadow-green-500/30 transition hover:scale-110 hover:bg-green-400"
            title="Chat on WhatsApp"
          >
            <MessageCircle className="h-7 w-7 text-white transition group-hover:scale-110" />
          </a>

          {/* Telegram Floating Button */}

          <a
            href={SUPPORT.telegramLink}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 shadow-2xl shadow-sky-500/30 transition hover:scale-110 hover:bg-sky-400"
            title="Contact on Telegram"
          >
            <Send className="h-7 w-7 text-white transition group-hover:scale-110" />
          </a>

        </div>

        {/* ==========================================================
            LIVE NETWORK STATUS
            ========================================================== */}

        <div className="fixed left-4 top-4 z-40 hidden rounded-full border border-emerald-500/30 bg-black/80 px-4 py-2 backdrop-blur-lg md:flex items-center gap-3">

          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-xs font-semibold text-emerald-300">
            GoldTrade Network Online
          </span>

        </div>

        {/* ==========================================================
            VERSION BADGE
            ========================================================== */}

        <div className="fixed right-4 top-4 z-40 hidden rounded-full border border-yellow-500/20 bg-black/80 px-4 py-2 backdrop-blur-lg md:flex items-center gap-2">

          <ShieldCheck className="h-4 w-4 text-yellow-400" />

          <span className="text-xs font-semibold text-yellow-300">
            V18 Enterprise
          </span>

        </div>

        {/* ==========================================================
            MAINTENANCE / SYSTEM NOTICE
            ========================================================== */}

        <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">

          <div className="flex items-start gap-3">

            <ShieldCheck className="mt-0.5 h-5 w-5 text-blue-400" />

            <div>

              <h4 className="text-sm font-semibold text-blue-300">
                System Notice
              </h4>

              <p className="mt-2 text-xs leading-5 text-slate-300">
                GoldTrade V18 Enterprise is protected using encrypted JWT
                authentication, secure MongoDB storage, HTTPS API communication,
                Render Cloud backend and Vercel frontend deployment.
              </p>

            </div>

          </div>

        </div>

        {/* ==========================================================
            HELP DESK CARD
            ========================================================== */}

        <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 p-5">

          <h4 className="text-center text-lg font-bold text-yellow-300">
            GoldTrade Help Desk
          </h4>

          <p className="mt-3 text-center text-sm text-slate-300 leading-6">
            If you're unable to login, receive deposits, withdraw funds,
            verify your wallet, or access your account dashboard,
            our support team is available 24/7.
          </p>

          <div className="mt-5 flex flex-col gap-3">

            <a
              href={SUPPORT.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl bg-sky-500/20 px-4 py-3 transition hover:bg-sky-500/30"
            >
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-sky-400" />
                <span className="text-sm font-medium text-sky-300">
                  Telegram Support
                </span>
              </div>

              <span className="text-xs text-sky-300">
                {SUPPORT.telegram}
              </span>
            </a>

            <a
              href={SUPPORT.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl bg-green-500/20 px-4 py-3 transition hover:bg-green-500/30"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-green-400" />
                <span className="text-sm font-medium text-green-300">
                  WhatsApp Support
                </span>
              </div>

              <span className="text-xs text-green-300">
                {SUPPORT.whatsapp}
              </span>
            </a>

          </div>

        </div>
                {/* ==========================================================
            LOGIN TIPS
            ========================================================== */}

        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950/50 p-5">

          <h3 className="mb-4 text-center text-lg font-bold text-yellow-400">
            Login Tips
          </h3>

          <ul className="space-y-3 text-sm text-slate-300">

            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-400" />
              Use the same username or email you registered with.
            </li>

            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-400" />
              Passwords are case-sensitive. Check Capital / Small letters.
            </li>

            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-400" />
              Make sure your internet connection is active before signing in.
            </li>

            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-400" />
              Keep “Remember Me” enabled only on your personal device.
            </li>

            <li className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-400" />
              Never share your password, OTP or JWT token with anyone.
            </li>

          </ul>

        </div>

        {/* ==========================================================
            FREQUENTLY ASKED QUESTIONS
            ========================================================== */}

        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-950/50 p-5">

          <h3 className="mb-5 text-center text-lg font-bold text-cyan-300">
            Frequently Asked Questions
          </h3>

          <div className="space-y-4">

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h4 className="font-semibold text-white">
                I forgot my password.
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                Click the <span className="text-yellow-400">Forgot Password</span> button
                or contact GoldTrade Support using Telegram or WhatsApp for account recovery.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h4 className="font-semibold text-white">
                Deposit is not showing in my wallet.
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                Upload your payment receipt. Deposits are verified manually by the
                GoldTrade Admin Team before wallet credit.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h4 className="font-semibold text-white">
                Withdrawal is pending.
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                Withdrawals remain pending until reviewed and approved by an administrator.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h4 className="font-semibold text-white">
                Login shows “Invalid username or password”.
              </h4>

              <p className="mt-2 text-sm text-slate-400">
                Check your username, email and password carefully. If the issue continues,
                contact GoldTrade Support with your username.
              </p>
            </div>

          </div>

        </div>

        {/* ==========================================================
            ACCOUNT RECOVERY
            ========================================================== */}

        <div className="mt-8 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">

          <h3 className="text-center text-lg font-bold text-purple-300">
            Account Recovery
          </h3>

          <p className="mt-3 text-center text-sm leading-6 text-slate-300">
            If you lose access to your account, contact our verification team with
            your username and registered email address.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">

            <a
              href={SUPPORT.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-sky-500/20 p-4 text-center transition hover:bg-sky-500/30"
            >
              <Send className="mx-auto mb-2 h-6 w-6 text-sky-400" />

              <p className="text-sm font-semibold text-sky-300">
                Telegram Recovery
              </p>
            </a>

            <a
              href={SUPPORT.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-green-500/20 p-4 text-center transition hover:bg-green-500/30"
            >
              <MessageCircle className="mx-auto mb-2 h-6 w-6 text-green-400" />

              <p className="text-sm font-semibold text-green-300">
                WhatsApp Recovery
              </p>
            </a>

          </div>

        </div>

        {/* ==========================================================
            ACCOUNT VERIFICATION HELP
            ========================================================== */}

        <div className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-5">

          <h3 className="text-center text-lg font-bold text-yellow-300">
            Account Verification Support
          </h3>

          <p className="mt-3 text-center text-sm text-slate-300 leading-6">
            For Deposit, Withdrawal, Wallet, Gold or USDT verification,
            please include the following details when contacting support.
          </p>

          <div className="mt-5 space-y-3 text-sm text-slate-300">

            <div className="rounded-xl bg-slate-900 p-3">
              • Username
            </div>

            <div className="rounded-xl bg-slate-900 p-3">
              • Registered Email Address
            </div>

            <div className="rounded-xl bg-slate-900 p-3">
              • Deposit / Withdrawal Transaction ID
            </div>

            <div className="rounded-xl bg-slate-900 p-3">
              • Payment Receipt Screenshot
            </div>

          </div>

        </div>

        {/* ==========================================================
            SECURITY WARNING
            ========================================================== */}

        <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">

          <div className="flex items-start gap-3">

            <AlertCircle className="mt-1 h-6 w-6 text-red-400" />

            <div>

              <h3 className="font-bold text-red-300">
                Security Warning
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                GoldTrade Support will never ask for your password, OTP,
                JWT token or private wallet keys.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Contact support only through the official Telegram or WhatsApp
                shown on this page.
              </p>

            </div>

          </div>

        </div>

        {/* ==========================================================
            PERFORMANCE READY BANNER
            ========================================================== */}

        <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-5">

          <div className="flex items-center gap-4">

            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />

            <div>

              <h3 className="font-bold text-emerald-300">
                Enterprise Performance Ready
              </h3>

              <p className="mt-1 text-xs text-slate-300">
                Optimized for Render Cloud • Vercel • MongoDB Atlas • PM2 • Ubuntu Linux.
              </p>

            </div>

          </div>

        </div>
                {/* ==========================================================
            FINAL SUPPORT FOOTER
            ========================================================== */}

        <div className="mt-10 rounded-3xl border border-slate-700 bg-slate-900/50 p-6 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-600">
            <ShieldCheck className="h-8 w-8 text-black" />
          </div>

          <h3 className="text-xl font-bold text-white">
            GoldTrade V18 Enterprise
          </h3>

          <p className="mt-2 text-sm text-slate-400">
            Secure Gold • USDT • PKR Trading Platform
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">

            <a
              href={SUPPORT.telegramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Telegram Support
            </a>

            <a
              href={SUPPORT.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-green-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-400"
            >
              WhatsApp Support
            </a>

          </div>

          <div className="mt-6 border-t border-slate-700 pt-6">

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 md:grid-cols-4">

              <div>
                <p className="font-semibold text-yellow-400">Wallet</p>
                <p>Secure Balance</p>
              </div>

              <div>
                <p className="font-semibold text-yellow-400">Deposits</p>
                <p>Manual Verification</p>
              </div>

              <div>
                <p className="font-semibold text-yellow-400">Withdrawals</p>
                <p>Admin Approval</p>
              </div>

              <div>
                <p className="font-semibold text-yellow-400">USDT & Gold</p>
                <p>Enterprise Trading</p>
              </div>

            </div>

          </div>

          <div className="mt-6 rounded-xl bg-slate-950/70 p-4">

            <p className="text-xs leading-6 text-slate-400">
              GoldTrade uses encrypted JWT authentication, bcrypt password hashing,
              MongoDB Atlas secure storage, HTTPS communication and Render Cloud deployment.
            </p>

            <p className="mt-3 text-xs text-slate-500">
              Keep your password private and contact support only through the official
              Telegram and WhatsApp listed above.
            </p>

          </div>

        </div>

        {/* ==========================================================
            COPYRIGHT
            ========================================================== */}

        <footer className="mt-10 text-center">

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} GoldTrade V18 Enterprise.
          </p>

          <p className="mt-2 text-xs text-slate-600">
            Render Cloud • Vercel • MongoDB Atlas • JWT • PM2 • Ubuntu Linux
          </p>

          <p className="mt-4 text-xs text-slate-700">
            Version 18.0 Enterprise Production Build
          </p>

        </footer>

      </div>

    </main>
  );
}