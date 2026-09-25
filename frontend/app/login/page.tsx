"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

// ==========================================
// API URL (GoldTrade V18 FINAL)
// ==========================================

const API =
  process.env.NEXT_PUBLIC_API_URL || "https://goldtrade-2.onrender.com";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  // ==========================================
  // CHECK EXISTING LOGIN (FIXED)
  // ==========================================

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Redirect ONLY if token exists
    if (token && role === "admin") {
      router.replace("/admin-dashboard");
    } else if (token && role === "user") {
      router.replace("/dashboard");
    }
  }, [router]);

// ==========================================
// LOGIN FUNCTION (GoldTrade V18 FINAL)
// Render + Vercel Production
// ==========================================

const handleLogin = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  setLoading(true);
  setMessage("");
  setMessageType("error");

  try {
    const loginValue = username.trim().toLowerCase();

    console.log("LOGIN API:", `${API}/api/auth/login`);
    console.log("LOGIN USER:", loginValue);

    const response = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: loginValue, // username OR email
        password: password.trim(),
      }),
    });

    // Safe JSON parse
    let data: any = {};

    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid response received from backend.");
    }

    console.log("LOGIN STATUS:", response.status);
    console.log("LOGIN RESPONSE:", data);

    // Backend error
    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
        data.error ||
        `Login failed (${response.status})`
      );
    }

    // ==========================
    // JWT Token
    // ==========================
    const token =
      data.token ||
      data.accessToken ||
      data.jwt ||
      data.data?.token;

    if (!token) {
      throw new Error("JWT token not received from backend.");
    }

    // ==========================
    // User Object
    // ==========================
    const user = data.user || {};

    // Remove old session
    localStorage.clear();

    // Save session
    localStorage.setItem("token", token);
    localStorage.setItem("userId", user.id || user._id || "");
    localStorage.setItem("username", user.username || "");
    localStorage.setItem("email", user.email || "");
    localStorage.setItem(
      "role",
      (user.role || "user").toLowerCase()
    );

    // Wallet (optional)
    if (data.wallet) {
      localStorage.setItem(
        "pkrBalance",
        String(data.wallet.pkrBalance ?? 0)
      );

      localStorage.setItem(
        "goldBalance",
        String(data.wallet.goldBalance ?? 0)
      );

      localStorage.setItem(
        "usdtBalance",
        String(data.wallet.usdtBalance ?? 0)
      );
    }

    setMessageType("success");
    setMessage("Login successful. Redirecting...");

    console.log("LOGIN SUCCESS");
    console.log("ROLE:", user.role);

    // Redirect after success
    setTimeout(() => {
      if ((user.role || "").toLowerCase() === "admin") {
        router.replace("/admin-dashboard");
      } else {
        router.replace("/dashboard");
      }
    }, 800);

  } catch (error: any) {
    console.error("LOGIN ERROR:", error);

    localStorage.clear();

    setMessageType("error");
    setMessage(
      error?.message || "Unable to connect to GoldTrade server."
    );
  } finally {
    setLoading(false);
  }
};

    // ==========================================
  // LOGIN PAGE UI
  // ==========================================

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-zinc-900 border border-yellow-500 rounded-3xl p-8 shadow-2xl">

        {/* LOGO */}
        <div className="flex flex-col items-center mb-8">
          <ShieldCheck size={70} className="text-yellow-400 mb-4" />

          <h1 className="text-4xl font-black text-yellow-400">
            GoldTrade V18
          </h1>

          <p className="text-gray-400 mt-2 text-center">
            Secure Trading Platform Login
          </p>
        </div>

        {/* SUCCESS / ERROR MESSAGE */}
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

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* USERNAME */}
          <div>
            <label className="block text-yellow-400 font-semibold mb-2">
              Username or Email
            </label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username or email"
              autoComplete="username"
              required
              className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-500"
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
                autoComplete="current-password"
                required
                className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-white outline-none focus:border-yellow-500"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400"
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-lg transition ${
              loading
                ? "bg-yellow-700 text-black cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-400 text-black"
            }`}
          >
            {loading ? "Signing In..." : "Login to GoldTrade"}
          </button>
        </form>

        {/* SIGNUP LINK */}
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?
          </p>

          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="mt-2 text-yellow-400 hover:text-yellow-300 font-semibold underline"
          >
            Create New Account
          </button>
        </div>

        {/* DEMO ACCOUNT */}
        <div className="mt-8 border border-zinc-700 rounded-2xl p-4 bg-black/40">
          <h3 className="text-yellow-400 font-bold text-center mb-3">
            Demo Admin Account
          </h3>

          <div className="space-y-2 text-sm">

            <div className="flex justify-between">
              <span className="text-gray-400">Username</span>
              <span className="text-green-400 font-semibold">hashi</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Password</span>
              <span className="text-white font-semibold">********</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">Role</span>
              <span className="text-yellow-400 font-semibold">
                Administrator
              </span>
            </div>

          </div>
        </div>

        {/* SECURITY NOTE */}
        <div className="mt-6 bg-zinc-800 border border-cyan-600 rounded-xl p-4">
          <p className="text-cyan-400 text-center text-sm">
            GoldTrade Secure Login • JWT Protected • MongoDB Connected
          </p>
        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center text-xs text-gray-500 space-y-2">
          <p>© 2026 GoldTrade Enterprise Trading Platform</p>
          <p>PKR • Gold • USDT Wallet System</p>
          <p>Powered by GoldTrade Enterprise V18</p>
        </div>

      </div>
    </main>
  );
}