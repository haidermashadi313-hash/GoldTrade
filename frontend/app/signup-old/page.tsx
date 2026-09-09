import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-6 text-white">
      <div className="w-full max-w-md bg-zinc-900 border border-yellow-500 rounded-3xl p-8">
        <h1 className="text-3xl font-bold text-yellow-400 text-center mb-6">
          Create GoldTrade Account
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 rounded-xl bg-black border border-gray-700"
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full p-3 rounded-xl bg-black border border-gray-700"
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl bg-black border border-gray-700"
          />

          <input
            type="text"
            placeholder="Referral Code (Optional)"
            className="w-full p-3 rounded-xl bg-black border border-gray-700"
          />

          <button className="w-full bg-yellow-400 text-black py-3 rounded-xl font-bold">
            Create Account
          </button>

          <p className="text-center text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="text-yellow-400 font-semibold">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}