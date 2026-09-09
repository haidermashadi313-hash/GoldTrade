"use client";

import Link from "next/link";
import { ArrowLeft, Gift, CheckCircle, Trophy, Users } from "lucide-react";

export default function TasksPage() {
  const tasks = [
    { title: "Daily Check-In", reward: "PKR 100", status: "Available" },
    { title: "Watch Training Video", reward: "PKR 250", status: "Available" },
    { title: "Invite One Friend", reward: "PKR 400", status: "Pending" },
    { title: "Complete First Deposit", reward: "PKR 500", status: "Completed" },
  ];

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-yellow-400 mb-8"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </Link>

      <h1 className="text-4xl font-bold text-yellow-400 mb-2">
        Daily Reward Tasks
      </h1>

      <p className="text-gray-400 mb-8">
        Complete tasks every day and earn bonus rewards.
      </p>

      {/* Reward Summary */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
          <Gift className="text-yellow-400 mb-3" size={30} />
          <p className="text-gray-400">Today's Rewards</p>
          <h2 className="text-3xl font-bold text-yellow-400">PKR 850</h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
          <CheckCircle className="text-green-400 mb-3" size={30} />
          <p className="text-gray-400">Completed Tasks</p>
          <h2 className="text-3xl font-bold text-green-400">1 / 4</h2>
        </div>

        <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
          <Trophy className="text-yellow-400 mb-3" size={30} />
          <p className="text-gray-400">Bonus Level</p>
          <h2 className="text-3xl font-bold text-yellow-400">Gold</h2>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-5">
        {tasks.map((task, index) => (
          <div
            key={index}
            className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5 flex justify-between items-center hover:shadow-lg hover:shadow-yellow-500/20 transition"
          >
            <div>
              <h3 className="text-xl font-bold">{task.title}</h3>
              <p className="text-gray-400 mt-1">Reward: {task.reward}</p>
            </div>

            <button
              className={`px-6 py-2 rounded-xl font-bold ${
                task.status === "Completed"
                  ? "bg-green-500 text-black"
                  : task.status === "Pending"
                  ? "bg-gray-700 text-gray-300"
                  : "bg-yellow-500 text-black hover:bg-yellow-400"
              }`}
            >
              {task.status}
            </button>
          </div>
        ))}
      </div>

      {/* Referral Bonus */}
      <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mt-10">
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-yellow-400" size={30} />
          <h2 className="text-2xl font-bold text-yellow-400">
            Referral Program
          </h2>
        </div>

        <p className="text-gray-300 mb-3">
          Invite friends and earn **PKR 400** for every successful signup.
        </p>

        <div className="bg-black border border-yellow-500 rounded-xl p-4 mb-4">
          <p className="text-gray-400 text-sm">Your Referral Code</p>
          <h2 className="text-2xl font-bold text-yellow-400">
            GOLDHASHI400
          </h2>
        </div>

        <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold">
          Copy Referral Code
        </button>
      </div>
    </main>
  );
}