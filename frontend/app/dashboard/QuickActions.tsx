"use client";

import { useRouter } from "next/navigation";
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      title: "Deposit PKR",
      icon: ArrowDownCircle,
      color: "from-green-600 to-green-500",
      path: "/wallet/deposit",
    },
    {
      title: "Withdraw PKR",
      icon: ArrowUpCircle,
      color: "from-red-600 to-red-500",
      path: "/wallet/withdraw",
    },
    {
      title: "Deposit USDT",
      icon: DollarSign,
      color: "from-cyan-600 to-cyan-500",
      path: "/usdt/deposit",
    },
    {
      title: "Withdraw USDT",
      icon: Wallet,
      color: "from-purple-600 to-purple-500",
      path: "/usdt/withdraw",
    },
    {
      title: "Buy Gold",
      icon: Coins,
      color: "from-yellow-500 to-amber-400",
      path: "/gold/buy",
    },
    {
      title: "Sell Gold",
      icon: TrendingUp,
      color: "from-orange-600 to-orange-500",
      path: "/gold/sell",
    },
  ];

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-cyan-400">
            Quick Actions
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Deposit, Withdraw, Buy & Sell directly from your wallet.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              onClick={() => router.push(action.path)}
              className={`bg-gradient-to-r ${action.color}
                rounded-2xl p-5
                text-white
                shadow-lg
                hover:scale-105
                transition-all
                duration-300
                flex flex-col
                items-center
                justify-center
                gap-3
                min-h-[130px]`}
            >
              <Icon size={36} strokeWidth={2.5} />

              <span className="text-sm md:text-base font-bold text-center">
                {action.title}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
  }