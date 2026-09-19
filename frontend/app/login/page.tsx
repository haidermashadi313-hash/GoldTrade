"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://goldtrade-api.onrender.com";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
    // ==========================================
  // LOGIN FUNCTION (GoldTrade V18 FINAL)
  // ==========================================
  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setMessage("");

    if (!username.trim() || !password.trim()) {
      setMessageType("error");
      setMessage("Username and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed.");
      }

      // ==========================================
      // SUPPORT MULTIPLE JWT RESPONSE FORMATS
      // ==========================================
      const jwtToken =
        data.token ||
        data.accessToken ||
        data.jwt ||
        data.data?.token;

      if (!jwtToken) {
        throw new Error("JWT token not received from server.");
      }

      if (!data.user) {
        throw new Error("User data not received from server.");
      }

      // ==========================================
      // SAVE LOGIN DATA
      // ==========================================
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("username", data.user.username || "");
      localStorage.setItem("email", data.user.email || "");
      localStorage.setItem("userId", data.user._id || "");

      // 猸?IMPORTANT: SAVE USER ROLE
      const userRole = String(
        data.user.role || "user"
      ).toLowerCase();

      localStorage.setItem("role", userRole);

      console.log("LOGIN SUCCESS:", {
        username: data.user.username,
        role: userRole,
      });

      setMessageType("success");
      setMessage("Login successful. Redirecting...");

      // ==========================================
      // REDIRECT BY ROLE
      // ==========================================
      setTimeout(() => {
        if (userRole === "admin") {
          window.location.href = "/admin-dashboard";
        } else {
          window.location.href = "/dashboard";
        }
      }, 600);

    } catch (err: any) {
      console.error("LOGIN ERROR:", err);

      setMessageType("error");
      setMessage(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };
    // ==========================================
  // LOGIN PAGE UI
  // ==========================================
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">

      <div className="w-full max-w-md bg-zinc-900 border border-yellow-500 rounded-3xl p-8 shadow-2xl">

        {/* ================= LOGO ================= */}
        <div className="flex flex-col items-center mb-8">

          <ShieldCheck size={70} className="text-yellow-400 mb-4" />

          <h1 className="text-4xl font-black text-yellow-400">
            GoldTrade V18
          </h1>

          <p className="text-gray-400 mt-2 text-center">
            Secure Trading Platform Login
          </p>

        </div>

        {/* ================= MESSAGE ================= */}
        {message && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-center font-semibold ${
              messageType === "success"
                ? "bg-green-600/20 border border-green-500 text-green-400"
                : "bg-red-600/20 border border-red-500 text-red-400"
            }`}
          >
            {message}
          </div>
        )}

        {/* ================= LOGIN FORM ================= */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* USERNAME */}
          <div>

            <label className="block text-yellow-400 font-semibold mb-2">
              Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
              autoComplete="username"
            />

          </div>

          {/* PASSWORD */}
          <div>

            <label className="block text-yellow-400 font-semibold mb-2">
              Password
            </label>

            <div className="relative">

              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-white outline-none focus:border-yellow-500"
                autoComplete="current-password"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

          </div>          {/* ================= LOGIN BUTTON ================= */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-lg transition-all ${
              loading
                ? "bg-yellow-700 cursor-not-allowed text-black"
                : "bg-yellow-500 hover:bg-yellow-400 text-black"
            }`}
          >
            {loading ? "Signing In..." : "Login to GoldTrade"}
          </button>

        </form>

        {/* ================= DEMO ACCOUNTS ================= */}
        <div className="mt-8 border border-zinc-700 rounded-2xl p-4 bg-black/40">

          <h3 className="text-yellow-400 font-bold mb-3 text-center">
            GoldTrade Demo Accounts
          </h3>

          <div className="space-y-3 text-sm">

            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <span className="text-gray-400">Admin Login</span>
              <span className="text-green-400 font-semibold">hashi</span>
            </div>

            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <span className="text-gray-400">Password</span>
              <span className="text-white font-semibold">********</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Role</span>
              <span className="text-yellow-400 font-semibold">Administrator</span>
            </div>

          </div>

        </div>

        {/* ================= SECURITY NOTE ================= */}
        <div className="mt-6 bg-zinc-800 border border-cyan-600 rounded-xl p-4">

          <p className="text-cyan-400 text-sm text-center">
             GoldTrade V18 Secure Login
          </p>

        </div>

        {/* ================= FOOTER ================= */}
        <div className="mt-8 text-center">

          <p className="text-gray-500 text-sm">
            漏 2026 GoldTrade 鈥?Enterprise Trading Platform
          </p>

          <p className="text-gray-600 text-xs mt-2">
            Pkr 鈥?Gold 鈥?Usdt Wallet System
          </p>

        </div>      </div>

    </div>
  );
}


