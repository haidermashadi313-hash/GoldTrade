"use client";

// =====================================================
// GoldTrade V18 Enterprise Signup Page
// Production Version (Vercel + Render + MongoDB)
// PART 1/6
// =====================================================

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  CheckCircle,
} from "lucide-react";

// =====================================================
// API CONFIGURATION (Render Production)
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com";

// =====================================================
// COMPONENT START
// =====================================================

export default function SignupPage() {
  // =============================
  // FORM STATES
  // =============================

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // =============================
  // UI STATES
  // =============================

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  // =============================
  // MESSAGE STATES
  // =============================

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =====================================================
  // SIGNUP FUNCTION (PRODUCTION)
  // =====================================================

  const signup = async () => {
    // Reset Messages
    setSuccessMessage("");
    setErrorMessage("");

    // -----------------------------
    // Validation
    // -----------------------------
    if (
      !username.trim() ||
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    if (username.trim().length < 3) {
      setErrorMessage("Username must contain at least 3 characters.");
      return;
    }

    const emailRegex =
      /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!agree) {
      setErrorMessage("Please accept Terms & Conditions.");
      return;
    }

    // -----------------------------
    // Send Signup Request
    // -----------------------------
    try {
      setLoading(true);

      console.log("GoldTrade Signup API:", `${API}/api/auth/signup`);

      const response = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      console.log("Signup Status:", response.status);
      console.log("Signup Response:", data);

      if (response.ok && data.success) {
        setSuccessMessage(
          "Account created successfully! Redirecting to Login..."
        );

        // Clear Form
        setUsername("");
        setFullName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setAgree(false);

        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);

        return;
      }

      setErrorMessage(
        data.message || "Unable to create account. Please try again."
      );
    } catch (error) {
      console.error("Signup Error:", error);

      setErrorMessage(
        "Cannot connect to GoldTrade server. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black flex items-center justify-center px-5 py-10">

      <div className="w-full max-w-md bg-zinc-900 border border-yellow-500 rounded-3xl shadow-2xl p-8">

        {/* =======================================
            HEADER
        ======================================= */}

        <div className="flex justify-center mb-4">
          <ShieldCheck size={56} className="text-yellow-400" />
        </div>

        <h1 className="text-center text-3xl font-bold text-yellow-400">
          GoldTrade V18
        </h1>

        <p className="text-center text-gray-400 mt-2 mb-6">
          Create your secure Gold, PKR & USDT Wallet account.
        </p>

        {/* =======================================
            SUCCESS MESSAGE
        ======================================= */}

        {successMessage && (
          <div className="mb-5 bg-green-900/30 border border-green-500 rounded-xl p-3 flex items-start gap-3">
            <CheckCircle className="text-green-400 mt-0.5" size={20} />
            <p className="text-green-300 text-sm">{successMessage}</p>
          </div>
        )}

        {/* =======================================
            ERROR MESSAGE
        ======================================= */}

        {errorMessage && (
          <div className="mb-5 bg-red-900/30 border border-red-500 rounded-xl p-3">
            <p className="text-red-300 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* =======================================
            FULL NAME
        ======================================= */}

        <div className="relative mb-4">
          <User
            size={18}
            className="absolute left-4 top-4 text-gray-500"
          />

          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-yellow-500 transition"
          />
        </div>

        {/* =======================================
            USERNAME
        ======================================= */}

        <div className="relative mb-4">
          <User
            size={18}
            className="absolute left-4 top-4 text-gray-500"
          />

          <input
            type="text"
            placeholder="Username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-yellow-500 transition"
          />
        </div>

        {/* =======================================
            EMAIL ADDRESS
        ======================================= */}

        <div className="relative mb-5">
          <Mail
            size={18}
            className="absolute left-4 top-4 text-gray-500"
          />

          <input
            type="email"
            placeholder="Email Address"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-yellow-500 transition"
          />
        </div>

              {/* =======================================
            PASSWORD
        ======================================= */}

        <div className="relative mb-4">
          <Lock
            size={18}
            className="absolute left-4 top-4 text-gray-500"
          />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl py-3 pl-11 pr-12 text-white outline-none focus:border-yellow-500 transition"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3 text-gray-400 hover:text-yellow-400 transition"
          >
            {showPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        {/* Password Requirements */}

        <div className="mb-5 bg-black border border-zinc-700 rounded-xl p-3">
          <p className="text-xs text-gray-400 mb-2 font-semibold">
            Password Requirements
          </p>

          <ul className="space-y-1 text-xs">
            <li
              className={`flex items-center gap-2 ${
                password.length >= 6
                  ? "text-green-400"
                  : "text-gray-500"
              }`}
            >
              <CheckCircle size={14} />
              Minimum 6 characters
            </li>

            <li
              className={`flex items-center gap-2 ${
                /[A-Z]/.test(password)
                  ? "text-green-400"
                  : "text-gray-500"
              }`}
            >
              <CheckCircle size={14} />
              One uppercase letter (recommended)
            </li>

            <li
              className={`flex items-center gap-2 ${
                /[0-9]/.test(password)
                  ? "text-green-400"
                  : "text-gray-500"
              }`}
            >
              <CheckCircle size={14} />
              One number (recommended)
            </li>
          </ul>
        </div>

        {/* =======================================
            CONFIRM PASSWORD
        ======================================= */}

        <div className="relative mb-5">
          <Lock
            size={18}
            className="absolute left-4 top-4 text-gray-500"
          />

          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full rounded-xl py-3 pl-11 pr-12 text-white outline-none transition border ${
              confirmPassword && password !== confirmPassword
                ? "bg-black border-red-500 focus:border-red-500"
                : "bg-black border-gray-700 focus:border-yellow-500"
            }`}
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            className="absolute right-4 top-3 text-gray-400 hover:text-yellow-400 transition"
          >
            {showConfirmPassword ? (
              <EyeOff size={20} />
            ) : (
              <Eye size={20} />
            )}
          </button>
        </div>

        {/* Password Match Status */}

        {confirmPassword && (
          <div className="mb-6">
            {password === confirmPassword ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle size={16} />
                Passwords match.
              </div>
            ) : (
              <div className="text-red-400 text-sm">
                Passwords do not match.
              </div>
            )}
          </div>
        )}

              {/* =======================================
            TERMS & CONDITIONS
        ======================================= */}

        <div className="mb-6 rounded-xl border border-zinc-700 bg-black p-4">

          <label className="flex items-start gap-3 cursor-pointer">

            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-4 w-4 accent-yellow-500"
            />

            <span className="text-sm text-gray-300 leading-6">
              I agree to the{" "}
              <span className="font-semibold text-yellow-400">
                GoldTrade Terms & Conditions
              </span>{" "}
              and{" "}
              <span className="font-semibold text-yellow-400">
                Privacy Policy
              </span>.
            </span>

          </label>

        </div>

        {/* =======================================
            CREATE ACCOUNT BUTTON
        ======================================= */}

        <button
          type="button"
          onClick={signup}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-yellow-500 py-3 font-bold text-black transition-all duration-300 hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
        >

          {loading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <ShieldCheck size={20} />
              Create GoldTrade Account
            </>
          )}

        </button>

        {/* =======================================
            SECURITY MESSAGE
        ======================================= */}

        <div className="mt-5 rounded-xl border border-green-700 bg-green-900/20 p-3">

          <div className="flex items-start gap-3">

            <ShieldCheck
              size={18}
              className="mt-0.5 text-green-400"
            />

            <div>
              <p className="text-sm font-semibold text-green-400">
                Enterprise Security Enabled
              </p>

              <p className="mt-1 text-xs leading-5 text-gray-400">
                Your account is protected with JWT authentication,
                encrypted passwords, and secure wallet protection powered
                by GoldTrade V18 Enterprise.
              </p>
            </div>

          </div>

        </div>

              {/* =======================================
            LOGIN LINK
        ======================================= */}

        <div className="mt-8 border-t border-zinc-700 pt-6 text-center">

          <p className="text-gray-400 text-sm">
            Already have a GoldTrade account?
          </p>

          <Link
            href="/login"
            className="mt-2 inline-block font-bold text-yellow-400 transition hover:text-yellow-300 hover:underline"
          >
            Login Here
          </Link>

        </div>

        {/* =======================================
            ENTERPRISE FEATURES
        ======================================= */}

        <div className="mt-6 rounded-xl border border-zinc-700 bg-black p-4">

          <h3 className="mb-3 text-center text-sm font-semibold text-yellow-400">
            GoldTrade V18 Enterprise Features
          </h3>

          <div className="space-y-2 text-xs text-gray-400">

            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" />
              PKR Wallet Management
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" />
              Gold Buy & Sell Trading
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" />
              USDT TRC20 Buy & Sell
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" />
              Secure Deposit & Withdraw System
            </div>

            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-400" />
              Enterprise Wallet Security
            </div>

          </div>

        </div>

        {/* =======================================
            FOOTER
        ======================================= */}

        <div className="mt-8 border-t border-zinc-800 pt-5 text-center">

          <p className="text-xs text-gray-500">
            GoldTrade V18 Enterprise
          </p>

          <p className="mt-1 text-xs text-gray-600">
            Secure Gold • PKR Wallet • USDT TRC20 Platform
          </p>

          <p className="mt-2 text-xs text-gray-600">
            © 2026 GoldTrade Enterprise. All Rights Reserved.
          </p>

        </div>

      </div>
    </main>
  );
}