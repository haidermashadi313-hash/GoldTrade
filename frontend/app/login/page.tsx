"use client";

// ==========================================================
// GoldTrade V18 Enterprise
// frontend/app/login/page.tsx
// PART 1/8
// Production Ready (Render + Vercel + Linux)
// ==========================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { saveSession, getSession } from "@/lib/auth";

// ==========================================================
// API CONFIG
// ==========================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-api.onrender.com";

// ==========================================================
// TYPES
// ==========================================================

interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  accessToken?: string;
  jwt?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: "user" | "admin";
  };
}

// ==========================================================
// LOGIN COMPONENT
// ==========================================================

export default function LoginPage() {
  const router = useRouter();

  // ========================================================
  // FORM STATE
  // ========================================================

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // ========================================================
  // UI STATE
  // ========================================================

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ========================================================
  // PAGE TITLE
  // ========================================================

  useEffect(() => {
    document.title = "Login • GoldTrade V18 Enterprise";
  }, []);

  // ========================================================
  // PASSWORD TOGGLE
  // ========================================================

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // ========================================================
  // RESET FORM
  // ========================================================

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setErrorMessage("");
    setSuccessMessage("");
    setShowPassword(false);
  };
    // ========================================================
  // SESSION CHECK (Production Fix)
  // ========================================================

  useEffect(() => {
    const session = getSession();

    if (session?.token && session?.user) {
      if (session.user.role === "admin") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
      return;
    }

    setCheckingSession(false);
  }, [router]);

  // ========================================================
  // NETWORK STATUS
  // ========================================================

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateNetworkStatus();

    window.addEventListener("online", updateNetworkStatus);
    window.addEventListener("offline", updateNetworkStatus);

    return () => {
      window.removeEventListener("online", updateNetworkStatus);
      window.removeEventListener("offline", updateNetworkStatus);
    };
  }, []);

  // ========================================================
  // AUTO CLEAR ALERTS
  // ========================================================

  useEffect(() => {
    if (!errorMessage) return;

    const timer = setTimeout(() => {
      setErrorMessage("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [errorMessage]);

  useEffect(() => {
    if (!successMessage) return;

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [successMessage]);

  // ========================================================
  // LOADING SCREEN
  // ========================================================

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mx-auto mb-5 h-14 w-14 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent"></div>

          <h2 className="text-2xl font-bold text-yellow-400">
            GoldTrade V18
          </h2>

          <p className="mt-2 text-gray-400">
            Checking secure session...
          </p>
        </div>
      </main>
    );
  }
    // ========================================================
  // LOGIN HANDLER (JWT + Render Production)
  // ========================================================

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // -------------------------------
      // VALIDATION
      // -------------------------------

      if (!username.trim()) {
        throw new Error("Username or Email is required.");
      }

      if (!password.trim()) {
        throw new Error("Password is required.");
      }

      // -------------------------------
      // API REQUEST WITH TIMEOUT
      // -------------------------------

      const controller = new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);

      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
        }),
      });

      clearTimeout(timeout);

      const data: LoginResponse = await response.json();

      console.log("LOGIN RESPONSE:", data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid username or password.");
      }

      // -------------------------------
      // GET JWT TOKEN
      // -------------------------------

      const jwtToken =
        data.token ||
        data.accessToken ||
        data.jwt;

      if (!jwtToken || !data.user) {
        throw new Error("JWT token not received from server.");
      }

      // -------------------------------
      // SAVE SESSION
      // -------------------------------

      saveSession(
        {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
        },
        jwtToken,
        rememberMe
      );

      setSuccessMessage("Login successful. Redirecting...");

      // -------------------------------
      // REDIRECT
      // -------------------------------

      setTimeout(() => {
        if (data.user?.role === "admin") {
          router.replace("/admin/dashboard");
        } else {
          router.replace("/dashboard");
        }
      }, 600);

    } catch (error: any) {
      console.error("LOGIN ERROR:", error);

      if (error.name === "AbortError") {
        setErrorMessage("Request timed out. Please try again.");
      } else {
        setErrorMessage(
          error.message || "Unable to login. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };
    // ========================================================
  // ENTER KEY SUPPORT
  // ========================================================

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  // ========================================================
  // FORM VALIDATION HELPERS
  // ========================================================

  const usernameError =
    username.trim().length === 0 && errorMessage
      ? "Username or Email is required."
      : "";

  const passwordError =
    password.trim().length === 0 && errorMessage
      ? "Password is required."
      : "";

  // ========================================================
  // INPUT HELPERS
  // ========================================================

  const handleUsernameChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setUsername(e.target.value);

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPassword(e.target.value);

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  // ========================================================
  // CONNECTION WARNING
  // ========================================================

  const connectionWarning = !isOnline
    ? "No internet connection. Please check your network."
    : "";
      // ========================================================
  // LOGIN PAGE UI START (PART 5/8)
  // ========================================================

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-yellow-500/20 bg-zinc-950 p-8 shadow-2xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-yellow-400">
            GoldTrade V18
          </h1>

          <p className="mt-2 text-gray-400">
            Enterprise Trading Platform
          </p>
        </div>

        {/* Offline Warning */}
        {connectionWarning && (
          <div className="mb-4 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-sm text-orange-400">
            {connectionWarning}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
            {successMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* Username */}
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Username / Email
            </label>

            <input
              type="text"
              value={username}
              onChange={handleUsernameChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter username or email"
              autoComplete="username"
              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400"
            />

            {usernameError && (
              <p className="mt-2 text-xs text-red-400">
                {usernameError}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm text-gray-300">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 pr-16 text-white outline-none focus:border-yellow-400"
              />

              <button
                type="button"
                onClick={togglePassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-yellow-400 hover:text-yellow-300"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {passwordError && (
              <p className="mt-2 text-xs text-red-400">
                {passwordError}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-600 bg-black text-yellow-400"
              />

              Remember Me
            </label>

            <Link
              href="/forgot-password"
              className="text-yellow-400 hover:text-yellow-300"
            >
              Forgot Password?
            </Link>
          </div>
                    {/* ======================================================== */}
          {/* LOGIN BUTTON */}
          {/* ======================================================== */}

          <button
            type="submit"
            disabled={loading || !isOnline}
            className="flex w-full items-center justify-center rounded-xl bg-yellow-500 py-3 font-semibold text-black transition duration-200 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                Signing In...
              </>
            ) : (
              "Login to GoldTrade"
            )}
          </button>
        </form>

        {/* ======================================================== */}
        {/* DIVIDER */}
        {/* ======================================================== */}

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800"></div>

          <span className="text-xs uppercase tracking-widest text-gray-500">
            OR
          </span>

          <div className="h-px flex-1 bg-zinc-800"></div>
        </div>

        {/* ======================================================== */}
        {/* SIGNUP CARD */}
        {/* ======================================================== */}

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
          <p className="text-sm text-gray-400">
            Don't have a GoldTrade account?
          </p>

          <Link
            href="/signup"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-yellow-500 py-3 font-semibold text-yellow-400 transition hover:bg-yellow-500 hover:text-black"
          >
            Create New Account
          </Link>
        </div>

        {/* ======================================================== */}
        {/* QUICK LINKS */}
        {/* ======================================================== */}

        <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
          <Link
            href="/forgot-password"
            className="hover:text-yellow-400"
          >
            Forgot Password?
          </Link>

          <Link
            href="/signup"
            className="hover:text-yellow-400"
          >
            Register
          </Link>
        </div>
                {/* ======================================================== */}
        {/* SUPPORT CARD */}
        {/* ======================================================== */}

        <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
          <h3 className="mb-2 text-center text-sm font-semibold text-blue-400">
            Need Help?
          </h3>

          <p className="text-center text-xs text-gray-400">
            Contact GoldTrade Support if you have login, deposit, withdrawal or
            trading issues.
          </p>

          <a
            href="https://t.me/GoldTradeSupport"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex w-full items-center justify-center rounded-xl border border-blue-500 py-2 text-sm font-medium text-blue-400 transition hover:bg-blue-500 hover:text-white"
          >
            Contact Support
          </a>
        </div>

        {/* ======================================================== */}
        {/* SECURITY INFO */}
        {/* ======================================================== */}

        <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
              🔒
            </div>

            <div>
              <p className="text-sm font-semibold text-green-400">
                Secure Authentication
              </p>

              <p className="text-xs text-gray-400">
                JWT Protected • HTTPS • Render Backend • Vercel Frontend
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* VERSION INFO */}
        {/* ======================================================== */}

        <div className="mt-8 border-t border-zinc-800 pt-5 text-center">
          <p className="text-xs font-semibold text-yellow-400">
            GoldTrade V18 Enterprise
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Version 18.0.0 Production
          </p>

          <p className="mt-2 text-xs text-gray-600">
            Secure JWT Authentication • Render Backend • Vercel Frontend
          </p>

          <p className="mt-2 text-[11px] text-gray-600">
            © 2026 GoldTrade Enterprise. All Rights Reserved.
          </p>
        </div>
              </div>
    </main>
  );
}