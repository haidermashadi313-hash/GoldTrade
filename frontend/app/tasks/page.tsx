"use client";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle,
  Gift,
  Trophy,
  Users,
} from "lucide-react";

/* ==========================================================
   TYPES
========================================================== */

type TaskStatus =
  | "Available"
  | "Pending"
  | "Completed";

interface Task {
  title: string;
  reward: string;
  status: TaskStatus;
}

/* ==========================================================
   TASK DATA
========================================================== */

const tasks: Task[] = [
  {
    title: "Daily Check-In",
    reward: "Pkr 100",
    status: "Available",
  },
  {
    title: "Watch Training Video",
    reward: "Pkr 250",
    status: "Available",
  },
  {
    title: "Invite One Friend",
    reward: "Pkr 400",
    status: "Pending",
  },
  {
    title: "Complete First Deposit",
    reward: "Pkr 500",
    status: "Completed",
  },
];

/* ==========================================================
   HELPER FUNCTIONS
========================================================== */

const getTaskButtonClass = (
  status: TaskStatus
) => {
  if (status === "Completed") {
    return "bg-green-500 text-black";
  }

  if (status === "Pending") {
    return "bg-gray-700 text-gray-300";
  }

  return "bg-yellow-500 text-black hover:bg-yellow-400";
};

/* ==========================================================
   TASK CARD
========================================================== */

function TaskCard({
  task,
}: {
  task: Task;
}) {
  return (
    <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5 flex justify-between items-center hover:shadow-lg hover:shadow-yellow-500/20 transition">
      <div>
        <h3 className="text-xl font-bold">
          {task.title}
        </h3>

        <p className="text-gray-400 mt-1">
          Reward: {task.reward}
        </p>
      </div>

      <button
        type="button"
        className={`px-6 py-2 rounded-xl font-bold ${getTaskButtonClass(
          task.status
        )}`}
      >
        {task.status}
      </button>
    </div>
  );
}

/* ==========================================================
   REWARD SUMMARY CARD
========================================================== */

function RewardSummaryCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">
      {icon}

      <p className="text-gray-400">
        {label}
      </p>

      <h2
        className={`text-3xl font-bold ${valueClass}`}
      >
        {value}
      </h2>
    </div>
  );
}

/* ==========================================================
   REWARD SUMMARY
========================================================== */

function RewardSummary() {
  return (
    <div className="grid md:grid-cols-3 gap-6 mb-10">
      <RewardSummaryCard
        icon={
          <Gift
            className="text-yellow-400 mb-3"
            size={30}
          />
        }
        label="Today's Rewards"
        value="Pkr 850"
        valueClass="text-yellow-400"
      />

      <RewardSummaryCard
        icon={
          <CheckCircle
            className="text-green-400 mb-3"
            size={30}
          />
        }
        label="Completed Tasks"
        value="1 / 4"
        valueClass="text-green-400"
      />

      <RewardSummaryCard
        icon={
          <Trophy
            className="text-yellow-400 mb-3"
            size={30}
          />
        }
        label="Bonus Level"
        value="Gold"
        valueClass="text-yellow-400"
      />
    </div>
  );
}

/* ==========================================================
   TASK LIST
========================================================== */

function TaskList() {
  return (
    <div className="space-y-5">
      {tasks.map((task) => (
        <TaskCard
          key={task.title}
          task={task}
        />
      ))}
    </div>
  );
}

/* ==========================================================
   REFERRAL PROGRAM
========================================================== */

function ReferralProgram() {
  const referralCode = "GOLDHASHI400";

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(
        referralCode
      );

      alert(
        "Referral code copied successfully."
      );
    } catch (error) {
      console.error(
        "Unable to copy referral code:",
        error
      );

      alert(
        "Unable to copy referral code."
      );
    }
  };

  return (
    <div className="bg-zinc-900 border border-yellow-500 rounded-3xl p-6 mt-10">
      <div className="flex items-center gap-3 mb-4">
        <Users
          className="text-yellow-400"
          size={30}
        />

        <h2 className="text-2xl font-bold text-yellow-400">
          Referral Program
        </h2>
      </div>

      <p className="text-gray-300 mb-3">
        Invite friends and earn{" "}
        <strong>Pkr 400</strong> for every
        successful signup.
      </p>

      <div className="bg-black border border-yellow-500 rounded-xl p-4 mb-4">
        <p className="text-gray-400 text-sm">
          Your Referral Code
        </p>

        <h2 className="text-2xl font-bold text-yellow-400">
          {referralCode}
        </h2>
      </div>

      <button
        type="button"
        onClick={copyReferralCode}
        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3 rounded-xl font-bold"
      >
        Copy Referral Code
      </button>
    </div>
  );
}

/* ==========================================================
   PAGE
========================================================== */

export default function TasksPage() {
  return (
    <main className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* ==================================================
            BACK TO DASHBOARD
        ================================================== */}

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-yellow-400 mb-8"
        >
          <ArrowLeft size={20} />

          Back to Dashboard
        </Link>

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">
            Daily Reward Tasks
          </h1>

          <p className="text-gray-400">
            Complete tasks every day and earn
            bonus rewards.
          </p>
        </div>

        {/* ==================================================
            REWARD SUMMARY
        ================================================== */}

        <RewardSummary />

        {/* ==================================================
            TASK LIST
        ================================================== */}

        <TaskList />

        {/* ==================================================
            REFERRAL PROGRAM
        ================================================== */}

        <ReferralProgram />
      </div>
    </main>
  );
}