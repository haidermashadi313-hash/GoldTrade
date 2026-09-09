"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Loader2,
} from "lucide-react";

const API = "http://localhost:5000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.message || "Invalid login credentials.");
        return;
      }

      // Save Login Session
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.user.username);
      localStorage.setItem("role", data.user.role);

      alert(`Welcome ${data.user.username} ✅`);

      // Redirect by role
      if (data.user.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.log(err);
      alert("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-5">
      <div className="w-full max-w-md bg-zinc-900 border border-yellow-500 rounded-3xl p-8 shadow-2xl">

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <ShieldCheck size={52} className="text-yellow-400" />
        </div>

        <h1 className="text-3xl font-bold text-yellow-400 text-center">
          GoldTrade Login
        </h1>

        <p className="text-center text-gray-400 mt-2 mb-8">
          Login to access your wallet and trading dashboard.
        </p>

        {/* Email */}
        <div className="relative mb-5">
          <Mail
            size={18}
            className="absolute left-4 top-4 text-gray-500"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl py-3 pl-11 pr-4 outline-none focus:border-yellow-500"
          />
        </div>

        {/* Password */}
        <div className="relative mb-6">
          <Lock
            size={18}
            className="absolute left-4 top-4 text-gray-500"
          />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-xl py-3 pl-11 pr-12 outline-none focus:border-yellow-500"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-3 text-gray-400 hover:text-yellow-400"
          >
            {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
          </button>
        </div>

        {/* Login Button */}
        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </button>

        {/* Footer */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-gray-400">
            Don't have an account?
          </p>

          <Link
            href="/signup"
            className="text-yellow-400 font-bold hover:underline"
          >
            Create GoldTrade Account
          </Link>
        </div>

        <div className="mt-8 border-t border-zinc-700 pt-4 text-center">
          <p className="text-xs text-gray-500">
            GoldTrade Pakistan • Secure Gold & USDT TRC20 Platform
          </p>
        </div>

      </div>
    </main>
  );
}