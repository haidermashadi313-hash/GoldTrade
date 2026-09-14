"use client";

import { ArrowDownCircle, ArrowUpCircle, Coins, Wallet } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Deposit",
      icon: Wallet,
      link: "/deposit",
      color: "bg-green-600",
    },
    {
      title: "Withdraw",
      icon: ArrowDownCircle,
      link: "/withdraw",
      color: "bg-red-600",
    },
    {
      title: "Buy Gold",
      icon: Coins,
      link: "/gold",
      color: "bg-yellow-500 text-black",
    },
    {
      title: "Sell Gold",
      icon: ArrowUpCircle,
      link: "/gold",
      color: "bg-blue-600",
    },
  ];

  return (
    <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-6">
      <h2 className="text-yellow-400 text-xl font-bold mb-5">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 gap-4">
        {actions.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.title}
              onClick={() => (window.location.href = item.link)}
              className={`${item.color} rounded-xl p-4 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition`}
            >
              <Icon size={20} />
              {item.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}