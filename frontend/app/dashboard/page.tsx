"use client";

import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Wallet,
  Coins,
  TrendingUp,
  Bitcoin,
  Star,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">

      {/* ================= HERO ================= */}
      <section className="bg-gradient-to-b from-black via-zinc-900 to-black py-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

          <div>
            <span className="bg-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-bold">
              GoldTrade Pakistan • Premium Trading Platform
            </span>

            <h1 className="text-5xl lg:text-7xl font-black text-yellow-400 mt-6 leading-tight">
              Buy Gold & USDT
              <br />
              Securely.
            </h1>

            <p className="text-gray-300 text-lg mt-6 leading-8">
              Trade Gold, Deposit Funds, Withdraw Instantly, Buy & Sell USDT TRC20
              with complete wallet management.
            </p>

            <div className="flex gap-4 mt-10 flex-wrap">

              <Link
                href="/signup"
                className="bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-4 rounded-2xl font-bold flex items-center gap-2"
              >
                Create Account
                <ArrowRight size={20}/>
              </Link>

              <Link
                href="/login"
                className="border border-yellow-500 text-yellow-400 px-8 py-4 rounded-2xl font-bold hover:bg-yellow-500 hover:text-black transition"
              >
                Login
              </Link>

            </div>
          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-8">

            <h2 className="text-yellow-400 text-2xl font-bold mb-6">
              Live Market Overview
            </h2>

            <div className="space-y-5">

              <div className="flex justify-between">
                <span>24K Gold</span>
                <span className="text-green-400 font-bold">
                  PKR 350,000
                </span>
              </div>

              <div className="flex justify-between">
                <span>22K Gold</span>
                <span className="text-green-400 font-bold">
                  PKR 321,000
                </span>
              </div>

              <div className="flex justify-between">
                <span>USDT (TRC20)</span>
                <span className="text-green-400 font-bold">
                  PKR 281.50
                </span>
              </div>

              <div className="flex justify-between">
                <span>Wallet Status</span>
                <span className="text-yellow-400 font-bold">
                  Live
                </span>
              </div>

            </div>

            <div className="bg-black rounded-2xl p-5 mt-8 border border-green-500">
              <p className="text-gray-400 text-sm">
                Your Wallet Balance
              </p>

              <h2 className="text-4xl text-green-400 font-bold mt-2">
                PKR 0
              </h2>

              <p className="text-xs text-gray-500 mt-2">
                Available after login.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ================= FEATURES ================= */}

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">

          <h2 className="text-center text-4xl font-bold text-yellow-400 mb-14">
            Why Choose GoldTrade?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            {[
              {
                icon: Wallet,
                title: "Secure Wallet",
                desc: "PKR Wallet + USDT Wallet Management.",
              },
              {
                icon: Coins,
                title: "Live Gold Prices",
                desc: "24K, 22K, 21K & 18K Live Gold Market.",
              },
              {
                icon: Bitcoin,
                title: "USDT TRC20",
                desc: "Buy & Sell USDT with instant requests.",
              },
              {
                icon: ShieldCheck,
                title: "Safe Deposits",
                desc: "Admin approval with secure payment verification.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6"
              >
                <item.icon className="text-yellow-400 mb-4" size={36}/>

                <h3 className="text-xl font-bold mb-2">
                  {item.title}
                </h3>

                <p className="text-gray-400">{item.desc}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* ================= LIVE GOLD ================= */}

      <section className="bg-zinc-950 py-20 px-6">

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

          <div>

            <h2 className="text-4xl font-bold text-yellow-400 mb-6">
              Live Gold Market
            </h2>

            <p className="text-gray-300 leading-8">
              Track live gold prices inside GoldTrade and calculate Gold in Gram
              or Tola instantly.
            </p>

            <Link
              href="/dashboard/market"
              className="inline-flex mt-8 bg-yellow-500 text-black px-6 py-3 rounded-xl font-bold gap-2 items-center"
            >
              <TrendingUp size={20}/>
              Open Gold Market
            </Link>

          </div>

          <div className="bg-black border border-yellow-500 rounded-3xl p-8 space-y-4">

            {[
              ["24K Gold", "PKR 350,000"],
              ["22K Gold", "PKR 321,000"],
              ["21K Gold", "PKR 306,500"],
              ["18K Gold", "PKR 262,500"],
            ].map(([title, price]) => (
              <div
                key={title}
                className="flex justify-between bg-zinc-900 rounded-xl p-4"
              >
                <span>{title}</span>

                <span className="text-green-400 font-bold">{price}</span>
              </div>
            ))}

          </div>

        </div>

      </section>

      {/* ================= HOW IT WORKS ================= */}

      <section className="py-20 px-6">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-center text-4xl font-bold text-yellow-400 mb-14">
            How GoldTrade Works
          </h2>

          <div className="grid md:grid-cols-4 gap-6">

            {[
              "Create Account",
              "Deposit Funds",
              "Admin Approval",
              "Trade Gold & USDT",
            ].map((step, index) => (
              <div
                key={step}
                className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-yellow-500 text-black flex items-center justify-center text-2xl font-bold mx-auto mb-5">
                  {index + 1}
                </div>

                <h3 className="font-bold text-xl">{step}</h3>
              </div>
            ))}

          </div>

        </div>

      </section>

      {/* ================= BENEFITS ================= */}

      <section className="bg-zinc-950 py-20 px-6">

        <div className="max-w-6xl mx-auto">

          <h2 className="text-center text-4xl font-bold text-yellow-400 mb-14">
            Platform Benefits
          </h2>

          <div className="grid md:grid-cols-2 gap-8">

            {[
              "Instant Deposit Approval",
              "Wallet Balance Updates",
              "USDT TRC20 Support",
              "Secure Withdrawal Requests",
              "Live Gold Calculator",
              "Transaction History",
              "Admin Manager Dashboard",
              "Mobile Responsive Interface",
            ].map((item) => (
              <div
                key={item}
                className="flex gap-4 bg-zinc-900 border border-yellow-500 rounded-2xl p-5 items-center"
              >
                <CheckCircle className="text-green-400" size={28}/>
                <span className="text-lg">{item}</span>
              </div>
            ))}

          </div>

        </div>

      </section>

      {/* ================= TESTIMONIAL ================= */}

      <section className="py-20 px-6">

        <div className="max-w-5xl mx-auto text-center">

          <Star className="mx-auto text-yellow-400 mb-5" size={48}/>

          <h2 className="text-4xl font-bold text-yellow-400">
            Trusted Digital Gold & Crypto Platform
          </h2>

          <p className="text-gray-300 mt-6 text-lg leading-8">
            GoldTrade is designed for secure wallet management, gold investment,
            USDT TRC20 trading and premium customer experience.
          </p>

        </div>

      </section>

      {/* ================= CTA ================= */}

      <section className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-black py-20 px-6">

        <div className="max-w-5xl mx-auto text-center">

          <h2 className="text-5xl font-black">
            Start Trading with GoldTrade Today
          </h2>

          <p className="mt-6 text-lg">
            Join GoldTrade and access secure deposits, withdrawals,
            Gold Market and USDT TRC20 trading.
          </p>

          <div className="flex justify-center gap-5 mt-10 flex-wrap">

            <Link
              href="/signup"
              className="bg-black text-yellow-400 px-8 py-4 rounded-2xl font-bold"
            >
              Create Free Account
            </Link>

            <Link
              href="/login"
              className="border border-black px-8 py-4 rounded-2xl font-bold"
            >
              Login
            </Link>

          </div>

        </div>

      </section>

      {/* ================= FOOTER ================= */}

      <footer className="border-t border-yellow-500 py-8 text-center text-gray-500">
        © 2026 GoldTrade Pakistan • Premium Gold & USDT TRC20 Wallet Platform
      </footer>

    </main>
  );
}