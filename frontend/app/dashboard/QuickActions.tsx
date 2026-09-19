"use client";

import { Wallet, ArrowUpRight, ArrowDownLeft, Coins } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      title: "Deposit",
      icon: Wallet,
      link: "/deposit",
      color: "bg-green-600 hover:bg-green-700 text-white",
    },
    {
      title: "Withdraw",
      icon: ArrowDownLeft,
      link: "/withdraw",
      color: "bg-red-600 hover:bg-red-700 text-white",
    },
    {
      title: "Buy Gold",
      icon: Coins,
      link: "/gold",
      color: "bg-yellow-500 hover:bg-yellow-400 text-black",
    },
    {
      title: "Sell Gold",
      icon: ArrowUpRight,
      link: "/gold",
      color: "bg-blue-600 hover:bg-blue-700 text-white",
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
              className={`${item.color} rounded-xl p-4 font-semibold flex items-center justify-center gap-2 transition duration-200`}
            >
              <Icon size={20} />
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


