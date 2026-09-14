"use client";

import { Wallet, RefreshCcw } from "lucide-react";

interface WalletCardProps {
  balance: number;
  loading: boolean;
  onRefresh: () => void;
}

export default function WalletCard({
  balance,
  loading,
  onRefresh,
}: WalletCardProps) {
  return (
    <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-5">

      <div className="flex justify-between items-center mb-3">

        <div className="flex items-center gap-3">
          <Wallet className="text-green-400" size={26} />
          <h2 className="text-lg font-bold text-yellow-400">
            USDT Wallet Balance
          </h2>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="text-yellow-400 hover:text-yellow-300"
        >
          <RefreshCcw
            size={20}
            className={loading ? "animate-spin" : ""}
          />
        </button>

      </div>

      <p className="text-zinc-400 text-sm">
        Available Balance
      </p>

      <h1 className="text-4xl font-black text-green-400 mt-2">
        {loading ? "Loading..." : `${balance.toFixed(2)} USDT`}
      </h1>

      <div className="mt-4 bg-black border border-zinc-700 rounded-xl p-3">

        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Status</span>
          <span className="text-green-400 font-semibold">
            Active Wallet
          </span>
        </div>

      </div>

    </div>
  );
}
