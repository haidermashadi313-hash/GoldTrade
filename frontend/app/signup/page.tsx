"use client";

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
} from "lucide-react";

// ===============================
// GoldTrade API
// ===============================
const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://GoldTrade-api.onrender.com";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);

  const signup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      return alert("Please fill all fields.");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match.");
    }

    if (password.length < 6) {
      return alert("Password must be at least 6 characters.");
    }

    if (!agree) {
      return alert("Please accept Terms & Conditions.");
    }

    try {
      setLoading(true);

      // 馃憞 Backend signup endpoint
      const response = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      let data: { message?: string } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      console.log("Signup Status:", response.status);
      console.log("Signup Response:", data);

      if (response.ok) {
        alert("馃帀 Account Created Successfully!");
        window.location.href = "/login";
        return;
      }

      if (response.status === 404) {
        alert(
          "Signup API not found. Check backend route /api/auth/signup on Render."
        );
        return;
      }

      alert(data.message || "Signup failed.");
    } catch (err) {
      console.error("Signup Error:", err);
      alert("Cannot connect to GoldTrade server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md bg-zinc-900 border border-yellow-500 rounded-3xl p-8 shadow-2xl">

        <div className="flex justify-center mb-4">
          <ShieldCheck size={52} className="text-yellow-400" />
        </div>

        <h1 className="text-3xl text-yellow-400 font-bold text-center">
          GoldTrade Signup
        </h1>

        <p className="text-center text-gray-400 mt-2 mb-8">
          Create your secure GoldTrade Wallet account.
        </p>

        <div className="relative mb-4">
          <User size={18} className="absolute left-4 top-4 text-gray-500" />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-yellow-500"
          />
        </div>

        <div className="relative mb-4">
          <Mail size={18} className="absolute left-4 top-4 text-gray-500" />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-yellow-500"
          />
        </div>

        <div className="relative mb-4">
          <Lock size={18} className="absolute left-4 top-4 text-gray-500" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl py-3 pl-11 pr-12 text-white outline-none focus:border-yellow-500"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3 text-gray-400 hover:text-yellow-400"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="relative mb-5">
          <Lock size={18} className="absolute left-4 top-4 text-gray-500" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white outline-none focus:border-yellow-500"
          />
        </div>

        <label className="flex items-start gap-3 mb-6 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1 accent-yellow-500"
          />

          <span>
            I agree to the{" "}
            <span className="text-yellow-400">GoldTrade Terms & Conditions</span>{" "}
            and Privacy Policy.
          </span>
        </label>

        <button
          onClick={signup}
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold flex justify-center items-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>

        <div className="mt-8 text-center">
          <p className="text-gray-400">Already have an account?</p>

          <Link
            href="/login"
            className="text-yellow-400 font-bold hover:underline"
          >
            Login Here
          </Link>
        </div>

        <div className="mt-8 border-t border-zinc-700 pt-4 text-center">
          <p className="text-xs text-gray-500">
            GoldTrade Pakistan 鈥?Secure Gold & Usdt TRC20 Platform
          </p>
        </div>

      </div>
    </main>
  );
}


