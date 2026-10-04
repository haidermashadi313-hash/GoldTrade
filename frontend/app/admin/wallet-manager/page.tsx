"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ArrowLeft,
  RefreshCw,
  Search,
  Wallet,
  Coins,
  DollarSign,
  Save,
  User,
  ShieldCheck,
} from "lucide-react";

// =======================================================
// API URL
// Render + Local Compatible
// =======================================================

const API = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com"
).replace(/\/+$/, "");


// =======================================================
// TYPES
// =======================================================

interface WalletUser {
  _id: string;

  username: string;

  email: string;

  role: "user" | "admin";

  status: "Active" | "Blocked";

  // =====================================================
  // WALLET BALANCES
  // Supports current + legacy field names
  // =====================================================

  walletBalance?: number;

  pkrBalance?: number;

  PkrBalance?: number;

  WalletBalance?: number;

  goldBalance?: number;

  usdtBalance?: number;

  UsdtBalance?: number;

  // =====================================================
  // WALLET STATUS
  // =====================================================

  walletFrozen?: boolean;

  isFrozen?: boolean;

  createdAt?: string;
}


// =======================================================
// PAGE
// =======================================================

export default function WalletManagerPage() {

  // =====================================================
  // TOKEN
  // Supports current + legacy login storage
  // =====================================================

  const token =
    typeof window !== "undefined"
      ? (
          localStorage.getItem(
            "goldtrade_token"
          ) ||
          localStorage.getItem(
            "token"
          ) ||
          ""
        )
      : "";


  // =====================================================
  // AUTH HEADERS
  // =====================================================

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };


  // =====================================================
  // STATES
  // =====================================================

  const [users, setUsers] =
    useState<WalletUser[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [reason, setReason] =
    useState("");

  const [selectedUser, setSelectedUser] =
    useState<WalletUser | null>(null);


  // =====================================================
  // WALLET ADJUSTMENTS
  //
  // Positive = CREDIT
  // Negative = DEBIT
  //
  // Example:
  // 5000  = +5000 credit
  // -2000 = -2000 debit
  // =====================================================

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [goldBalance, setGoldBalance] =
    useState(0);

  const [usdtBalance, setUsdtBalance] =
    useState(0);


  // =====================================================
  // FREEZE
  // =====================================================

  const [walletFrozen, setWalletFrozen] =
    useState(false);


  // =====================================================
  // SEARCH
  // =====================================================

  const [search, setSearch] =
    useState("");


  // =====================================================
  // LOAD USERS
  // =====================================================

  const loadUsers = async () => {
    try {
      setLoading(true);

      // =================================================
      // AUTH CHECK
      // =================================================

      if (!token) {
        console.error(
          "WALLET MANAGER: Admin token missing."
        );

        setUsers([]);

        if (
          typeof window !== "undefined"
        ) {
          window.location.href =
            "/login";
        }

        return;
      }

      // =================================================
      // API REQUEST
      // =================================================

      const response = await fetch(
        `${API}/api/admin/users`,
        {
          method: "GET",
          headers,
          cache: "no-store",
        }
      );

      // =================================================
      // SAFE RESPONSE PARSING
      // =================================================

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        users?: Array<
          Record<string, unknown>
        >;
        message?: string;
      } = {
        success: false,
      };

      if (responseText.trim()) {
        try {
          data = JSON.parse(
            responseText
          );
        } catch (parseError) {
          console.error(
            "WALLET USERS JSON ERROR:",
            parseError
          );

          throw new Error(
            "Wallet users API returned invalid JSON."
          );
        }
      }

      console.log(
        "WALLET USERS RESPONSE:",
        data
      );

      // =================================================
      // AUTH ERROR
      // =================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        console.error(
          "WALLET MANAGER AUTH ERROR:",
          data
        );

        setUsers([]);

        if (
          typeof window !== "undefined"
        ) {
          localStorage.removeItem(
            "goldtrade_token"
          );

          localStorage.removeItem(
            "token"
          );

          window.location.href =
            "/login";
        }

        return;
      }

      // =================================================
      // ROUTE NOT FOUND
      // =================================================

      if (response.status === 404) {
        console.error(
          "WALLET USERS ROUTE NOT FOUND:",
          `${API}/api/admin/users`
        );

        setUsers([]);

        return;
      }

      // =================================================
      // HTTP / API ERROR
      // =================================================

      if (
        !response.ok ||
        !data.success
      ) {
        console.error(
          "Wallet Users API:",
          data
        );

        setUsers([]);

        return;
      }

      // =================================================
      // NORMALIZE USERS
      // =================================================

      const rawUsers =
        Array.isArray(data.users)
          ? data.users
          : [];

      const safeUsers: WalletUser[] =
        rawUsers
          .map(
            (
              user
            ): WalletUser | null => {

              const id =
                String(
                  user._id ?? ""
                ).trim();

              if (!id) {
                return null;
              }

              const username =
                String(
                  user.username ?? ""
                ).trim();

              const email =
                String(
                  user.email ?? ""
                ).trim();

              // =========================================
              // PKR
              // Current + legacy compatibility
              // =========================================

              const pkrBalance =
                Number(
                  user.pkrBalance ??
                    user.walletBalance ??
                    user.PkrBalance ??
                    user.WalletBalance ??
                    0
                );

              // =========================================
              // GOLD
              // =========================================

              const goldBalance =
                Number(
                  user.goldBalance ?? 0
                );

              // =========================================
              // USDT
              // =========================================

              const usdtBalance =
                Number(
                  user.usdtBalance ??
                    user.UsdtBalance ??
                    0
                );

              // =========================================
              // FROZEN STATUS
              // Current + legacy compatibility
              // =========================================

              const frozen =
                Boolean(
                  user.isFrozen ??
                    user.walletFrozen ??
                    false
                );

              // =========================================
              // ROLE
              // =========================================

              const role =
                user.role === "admin"
                  ? "admin"
                  : "user";

              // =========================================
              // STATUS
              // =========================================

              const status =
                user.status ===
                "Blocked"
                  ? "Blocked"
                  : "Active";

              return {
                _id: id,

                username,

                email,

                role,

                status,

                walletBalance:
                  Number.isFinite(
                    pkrBalance
                  )
                    ? pkrBalance
                    : 0,

                pkrBalance:
                  Number.isFinite(
                    pkrBalance
                  )
                    ? pkrBalance
                    : 0,

                goldBalance:
                  Number.isFinite(
                    goldBalance
                  )
                    ? goldBalance
                    : 0,

                usdtBalance:
                  Number.isFinite(
                    usdtBalance
                  )
                    ? usdtBalance
                    : 0,

                walletFrozen:
                  frozen,

                isFrozen:
                  frozen,

                createdAt:
                  String(
                    user.createdAt ??
                      ""
                  ),
              };
            }
          )
          .filter(
            (
              user
            ): user is WalletUser =>
              user !== null
          );

      // =================================================
      // SAVE USERS
      // =================================================

      setUsers(
        safeUsers
      );

    } catch (error: unknown) {

      console.error(
        "LOAD USERS ERROR:",
        error
      );

      setUsers([]);

    } finally {

      setLoading(false);

    }
  };

  // =======================================================
// LOAD ON START
// =======================================================

useEffect(() => {
  if (!token) {
    window.location.href = "/login";
    return;
  }

  void loadUsers();

  // loadUsers is intentionally called once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


// =======================================================
// SEARCH USERS
// =======================================================

const filteredUsers = useMemo(() => {
  const text = search
    .trim()
    .toLowerCase();

  if (!text) {
    return users;
  }

  return users.filter((user) => {
    const username = String(
      user.username || ""
    ).toLowerCase();

    const email = String(
      user.email || ""
    ).toLowerCase();

    return (
      username.includes(text) ||
      email.includes(text)
    );
  });
}, [users, search]);


// =======================================================
// SELECT USER
// =======================================================

const selectUser = (
  user: WalletUser
) => {
  setSelectedUser(user);

  // =====================================================
  // IMPORTANT:
  // These are ADJUSTMENT fields.
  // They must NOT contain the user's current balance.
  //
  // +10000 = credit 10,000
  // -2000  = debit 2,000
  // =====================================================

  setWalletBalance(0);
  setGoldBalance(0);
  setUsdtBalance(0);

  // =====================================================
  // LOAD CURRENT FREEZE STATUS
  // =====================================================

  setWalletFrozen(
    Boolean(
      user.walletFrozen ??
      user.isFrozen ??
      false
    )
  );

  // =====================================================
  // CLEAR ADMIN NOTE
  // =====================================================

  setReason("");
};


// =======================================================
// UPDATE PKR + GOLD + USDT WALLET
// =======================================================

const updateWallet = async () => {
  // =====================================================
  // USER VALIDATION
  // =====================================================

  if (!selectedUser) {
    alert(
      "Please select a user first."
    );
    return;
  }

  // =====================================================
  // READ ADJUSTMENTS
  //
  // Positive = CREDIT
  // Negative = DEBIT
  // =====================================================

  const pkrAdjustment =
    Number(walletBalance);

  const goldAdjustment =
    Number(goldBalance);

  const usdtAdjustment =
    Number(usdtBalance);

  // =====================================================
  // NUMBER VALIDATION
  // =====================================================

  if (
    !Number.isFinite(
      pkrAdjustment
    ) ||
    !Number.isFinite(
      goldAdjustment
    ) ||
    !Number.isFinite(
      usdtAdjustment
    )
  ) {
    alert(
      "Please enter valid numeric wallet adjustments."
    );
    return;
  }

  // =====================================================
  // CHECK WHETHER ANYTHING CHANGED
  // =====================================================

  if (
    pkrAdjustment === 0 &&
    goldAdjustment === 0 &&
    usdtAdjustment === 0
  ) {
    alert(
      "Please enter a PKR, Gold or USDT adjustment."
    );
    return;
  }

  // =====================================================
  // ADMIN NOTE
  // =====================================================

  const adminNote =
    reason.trim();


    // ===================================================
// VALIDATE
// ===================================================

if (
  !Number.isFinite(pkrAdjustment) ||
  !Number.isFinite(goldAdjustment) ||
  !Number.isFinite(usdtAdjustment)
) {
  alert(
    "Invalid wallet amount."
  );

  return;
}

const hasBalanceChanges =
  pkrAdjustment !== 0 ||
  goldAdjustment !== 0 ||
  usdtAdjustment !== 0;

if (!hasBalanceChanges) {
  alert(
    "Please enter a PKR, Gold or USDT adjustment."
  );

  return;
}

try {
  setSaving(true);

  const requests: Promise<Response>[] =
    [];

  // =================================================
  // PKR
  // =================================================

  if (pkrAdjustment !== 0) {
    const endpoint =
      pkrAdjustment > 0
        ? `${API}/api/wallet/admin/credit`
        : `${API}/api/wallet/admin/debit`;

    requests.push(
      fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },

          body: JSON.stringify({
            userId:
              selectedUser._id,

            walletType:
              "PKR",

            amount:
              Math.abs(
                pkrAdjustment
              ),

            note:
              reason.trim() ||
              "Admin PKR Wallet Update",
          }),
        }
      )
    );
  }


  // =================================================
  // GOLD
  // =================================================

  if (goldAdjustment !== 0) {
    const endpoint =
      goldAdjustment > 0
        ? `${API}/api/wallet/admin/credit`
        : `${API}/api/wallet/admin/debit`;

    requests.push(
      fetch(
        endpoint,
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },

          body: JSON.stringify({
            userId:
              selectedUser._id,

            walletType:
              "GOLD",

            amount:
              Math.abs(
                goldAdjustment
              ),

            note:
              reason.trim() ||
              "Admin Gold Wallet Update",
          }),
        }
      )
    );
  }
  // =================================================
// USDT
// =================================================

if (usdtAdjustment !== 0) {
  const endpoint =
    usdtAdjustment > 0
      ? `${API}/api/wallet/admin/credit`
      : `${API}/api/wallet/admin/debit`;

  requests.push(
    fetch(
      endpoint,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type":
            "application/json",
          Accept:
            "application/json",
        },

        body: JSON.stringify({
          userId:
            selectedUser._id,

          walletType:
            "USDT",

          amount:
            Math.abs(
              usdtAdjustment
            ),

          note:
            reason.trim() ||
            "Admin USDT Wallet Update",
        }),
      }
    )
  );
}


// =================================================
// PROCESS WALLET REQUESTS
// =================================================

if (requests.length > 0) {
  const responses =
    await Promise.all(
      requests
    );

  for (
    const response
    of responses
  ) {
    const responseText =
      await response.text();

    let data: {
      success?: boolean;
      message?: string;
    } = {
      success: false,
    };

    if (responseText.trim()) {
      try {
        data =
          JSON.parse(
            responseText
          );
      } catch {
        throw new Error(
          "Invalid response received from wallet API."
        );
      }
    }

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
          `Wallet update failed with status ${response.status}.`
      );
    }
  }
}


// =================================================
// FREEZE / UNFREEZE
// =================================================

await updateFreezeStatus();


// =================================================
// SUCCESS
// =================================================

alert(
  hasBalanceChanges
    ? "Wallet updated successfully."
    : "Wallet status updated successfully."
);


// =================================================
// RELOAD USERS
// =================================================

await loadUsers();


// =================================================
// RESET INPUTS
// =================================================

setWalletBalance(0);
setGoldBalance(0);
setUsdtBalance(0);
setReason("");


// =================================================
// KEEP SELECTED USER
// =================================================

setSelectedUser(
  (current) =>
    current
      ? {
          ...current,
          walletFrozen,
          isFrozen: walletFrozen,
        }
      : null
);


// =================================================
// ERROR HANDLING
// =================================================

} catch (error: unknown) {

  console.error(
    "WALLET UPDATE ERROR:",
    error
  );

  alert(
    error instanceof Error
      ? error.message
      : "Unable to update wallet."
  );


// =================================================
// FINALLY
// =================================================

} finally {

  setSaving(false);

}
};

 // =====================================================
// FREEZE / UNFREEZE WALLET
// =====================================================

const updateFreezeStatus = async () => {
  if (!selectedUser) {
    return;
  }

  const response = await fetch(
    `${API}/api/wallet/admin/freeze`,
    {
      method: "POST",

      headers: {
        ...headers,
        "Content-Type": "application/json",
        Accept: "application/json",
      },

      body: JSON.stringify({
        userId: selectedUser._id,
        frozen: Boolean(walletFrozen),
      }),
    }
  );

  let data: any = null;

  const rawText = await response.text();

  try {
    data = rawText
      ? JSON.parse(rawText)
      : null;
  } catch {
    throw new Error(
      "Invalid response received from freeze wallet API."
    );
  }

  if (
    !response.ok ||
    !data?.success
  ) {
    throw new Error(
      data?.message ||
        `Freeze wallet failed (${response.status}).`
    );
  }
};

// =======================================================
// SUMMARY
// =======================================================

const totalUsers =
  users.length;

const totalPKR =
  users.reduce(
    (sum, user) =>
      sum +
      Number(
        user.pkrBalance ??
          user.walletBalance ??
          user.PkrBalance ??
          user.WalletBalance ??
          0
      ),
    0
  );

const totalGold =
  users.reduce(
    (sum, user) =>
      sum +
      Number(
        user.goldBalance ?? 0
      ),
    0
  );

const totalUSDT =
  users.reduce(
    (sum, user) =>
      sum +
      Number(
        user.usdtBalance ??
          user.UsdtBalance ??
          0
      ),
    0
  );

const frozenWallets =
  users.filter(
    (user) =>
      Boolean(
        user.isFrozen ??
          user.walletFrozen ??
          false
      )
  ).length;
  
  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-yellow-400 text-xl font-bold">

        <RefreshCw
          className="animate-spin mr-3"
          size={26}
        />

        Loading Wallet Manager...

      </main>
    );

  }
    // =======================================================
  // PAGE START
  // =======================================================

  return (

    <main className="min-h-screen bg-black text-white p-6">

      <div className="max-w-7xl mx-auto space-y-8">

        {/* ================= HEADER ================= */}

        <header className="flex flex-wrap justify-between items-center gap-4">

          <div>

            <h1 className="flex items-center gap-3 text-4xl font-black text-yellow-400">

              <Wallet size={38} />

              Wallet Manager

            </h1>

            <p className="text-gray-400 mt-2">
              Manage PKR, Gold and USDT balances for GoldTrade users.
            </p>

          </div>

          <div className="flex gap-3">

            <Link
              href="/admin-dashboard"
              className="bg-zinc-800 hover:bg-zinc-700 px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >

              <ArrowLeft size={18} />

              Dashboard

            </Link>

            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={loading || saving}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black px-5 py-3 rounded-xl flex items-center gap-2 font-bold"
            >

              <RefreshCw size={18} />

              Refresh

            </button>

          </div>

        </header>

        {/* ================= SUMMARY ================= */}

        <section className="grid md:grid-cols-2 lg:grid-cols-5 gap-5">

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Total Users
            </p>

            <h2 className="text-3xl font-black text-cyan-400 mt-2">
              {totalUsers}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Total PKR
            </p>

            <h2 className="text-xl font-black text-green-400 mt-2">
              PKR{" "}
              {Number(
                totalPKR
              ).toLocaleString()}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-yellow-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Total Gold
            </p>

            <h2 className="text-xl font-black text-yellow-400 mt-2">
              {Number(
                totalGold
              ).toFixed(2)}{" "}
              g
            </h2>

          </div>

          <div className="bg-zinc-900 border border-blue-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Total USDT
            </p>

            <h2 className="text-xl font-black text-blue-400 mt-2">
              {Number(
                totalUSDT
              ).toFixed(2)}
            </h2>

          </div>

          <div className="bg-zinc-900 border border-red-500 rounded-2xl p-5">

            <p className="text-gray-400 text-sm">
              Frozen Wallets
            </p>

            <h2 className="text-3xl font-black text-red-400 mt-2">
              {frozenWallets}
            </h2>

          </div>

        </section>

        {/* ================= SEARCH ================= */}

        <section className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">

          <div className="relative">

            <Search
              className="absolute left-3 top-3 text-gray-500"
              size={18}
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search username or email..."
              className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-yellow-500"
            />

          </div>

        </section>

        {/* ================= USER LIST + EDIT PANEL ================= */}

        <section className="grid lg:grid-cols-2 gap-6">

          {/* ================= USER LIST ================= */}

          <div className="bg-zinc-900 border border-cyan-500 rounded-2xl p-5">

            <h2 className="text-2xl font-black text-cyan-400 mb-5">
              Users
            </h2>

            <div className="space-y-3 max-h-[620px] overflow-y-auto">

              {filteredUsers.length === 0 ? (

                <div className="text-center py-10 text-gray-500">
                  No users found.
                </div>

              ) : (

                filteredUsers.map(
                  (user) => (

                    <button
                      key={user._id}
                      type="button"
                      onClick={() =>
                        selectUser(user)
                      }
                      className={`w-full text-left rounded-xl border p-4 transition-all ${
                        selectedUser?._id ===
                        user._id
                          ? "border-yellow-500 bg-yellow-500/10"
                          : "border-zinc-700 hover:border-yellow-500 hover:bg-zinc-800"
                      }`}
                    >

                      {/* USER HEADER */}

                      <div className="flex justify-between items-center">

                        <div>

                          <p className="font-bold text-yellow-400">
                            {user.username}
                          </p>

                          <p className="text-xs text-gray-400 break-all">
                            {user.email}
                          </p>

                        </div>

                        {user.role === "admin" ? (

                          <ShieldCheck
                            className="text-cyan-400"
                            size={22}
                          />

                        ) : (

                          <User
                            className="text-cyan-400"
                            size={22}
                          />

                        )}

                      </div>

                      {/* WALLET SUMMARY */}

                      <div className="grid grid-cols-3 gap-2 mt-4 text-xs">

                        <div className="bg-zinc-800 rounded-lg p-2 text-center">

                          <p className="text-gray-500">
                            PKR
                          </p>

                          <p className="text-green-400 font-bold">
                            {Number(
                              user.walletBalance ??
                              0
                            ).toLocaleString()}
                          </p>

                        </div>

                        <div className="bg-zinc-800 rounded-lg p-2 text-center">

                          <p className="text-gray-500">
                            Gold
                          </p>

                          <p className="text-yellow-400 font-bold">
                            {Number(
                              user.goldBalance ??
                              0
                            ).toFixed(2)}
                          </p>

                        </div>

                        <div className="bg-zinc-800 rounded-lg p-2 text-center">

                          <p className="text-gray-500">
                            USDT
                          </p>

                          <p className="text-blue-400 font-bold">
                            {Number(
                              user.usdtBalance ??
                              0
                            ).toFixed(2)}
                          </p>

                        </div>

                      </div>

                      {/* STATUS */}

                      <div className="flex justify-between items-center mt-3 text-xs">

                        <span
                          className={`px-3 py-1 rounded-full font-semibold ${
                            user.status === "Active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {user.status}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full font-semibold ${
                            user.walletFrozen
                              ? "bg-red-500/20 text-red-400"
                              : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          {user.walletFrozen
                            ? "Frozen"
                            : "Wallet Active"}
                        </span>

                      </div>

                    </button>

                  )
                )

              )}

            </div>

          </div>

          {/* ================= WALLET EDIT PANEL ================= */}

          <div className="bg-zinc-900 border border-green-500 rounded-2xl p-5">

            <h2 className="text-2xl font-black text-green-400 mb-5">
              Wallet Editor
            </h2>

            {!selectedUser ? (

              <div className="flex flex-col items-center justify-center h-[620px] text-center text-gray-500">

                <Wallet
                  size={55}
                  className="mb-4 opacity-40"
                />

                <p className="text-lg font-semibold">
                  Select a user to edit wallet balances.
                </p>

              </div>

            ) : (

              <div className="space-y-5">

                {/* SELECTED USER */}

                <div className="bg-zinc-800 rounded-xl p-4">

                  <p className="text-xs text-gray-500 uppercase">
                    Selected User
                  </p>

                  <h3 className="text-xl font-bold text-yellow-400 mt-1">
                    {selectedUser.username}
                  </h3>

                  <p className="text-gray-400 text-sm break-all">
                    {selectedUser.email}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedUser.role === "admin"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-zinc-700 text-gray-300"
                      }`}
                    >
                      {selectedUser.role.toUpperCase()}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        selectedUser.status === "Active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {selectedUser.status}
                    </span>

                  </div>

                </div>
                                {/* ================= PKR ================= */}

                <div>

                  <label className="block mb-2 text-green-400 font-semibold">
                    PKR Wallet (+ Credit / − Debit)
                  </label>

                  <div className="relative">

                    <DollarSign
                      size={18}
                      className="absolute left-3 top-3 text-green-400"
                    />

                    <input
                      type="number"
                      value={walletBalance}
                      onChange={(e) =>
                        setWalletBalance(
                          Number(
                            e.target.value
                          ) || 0
                        )
                      }
                      placeholder="Example: 5000 or -2000"
                      className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-green-500"
                    />

                  </div>

                </div>

                {/* ================= GOLD ================= */}

                <div>

                  <label className="block mb-2 text-yellow-400 font-semibold">
                    Gold Balance (+ Credit / − Debit)
                  </label>

                  <div className="relative">

                    <Coins
                      size={18}
                      className="absolute left-3 top-3 text-yellow-400"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={goldBalance}
                      onChange={(e) =>
                        setGoldBalance(
                          Number(
                            e.target.value
                          ) || 0
                        )
                      }
                      placeholder="Example: 2.5 or -1.0"
                      className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-yellow-500"
                    />

                  </div>

                </div>

                {/* ================= USDT ================= */}

                <div>

                  <label className="block mb-2 text-blue-400 font-semibold">
                    USDT Balance (+ Credit / − Debit)
                  </label>

                  <div className="relative">

                    <Wallet
                      size={18}
                      className="absolute left-3 top-3 text-blue-400"
                    />

                    <input
                      type="number"
                      step="0.01"
                      value={usdtBalance}
                      onChange={(e) =>
                        setUsdtBalance(
                          Number(
                            e.target.value
                          ) || 0
                        )
                      }
                      placeholder="Example: 100 or -25"
                      className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 outline-none focus:border-blue-500"
                    />

                  </div>

                </div>

                {/* ================= REASON ================= */}

                <div>

                  <label className="block mb-2 text-cyan-400 font-semibold">
                    Reason / Admin Note
                  </label>

                  <input
                    type="text"
                    value={reason}
                    onChange={(e) =>
                      setReason(
                        e.target.value
                      )
                    }
                    placeholder="Example: Bonus, Correction, Manual Credit"
                    className="w-full bg-black border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-cyan-500"
                  />

                </div>

                {/* ================= FREEZE WALLET ================= */}

                <div className="flex items-center justify-between bg-zinc-800 rounded-xl p-4">

                  <div>

                    <p className="font-semibold text-white">
                      Freeze Wallet
                    </p>

                    <p className="text-sm text-gray-500">
                      Disable deposits, withdrawals and trading.
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setWalletFrozen(
                        (current) =>
                          !current
                      )
                    }
                    className={`px-5 py-2 rounded-xl font-bold transition ${
                      walletFrozen
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {walletFrozen
                      ? "Frozen"
                      : "Active"}
                  </button>

                </div>

                {/* ================= LIVE PREVIEW ================= */}

                <div className="bg-black border border-zinc-700 rounded-xl p-4">

                  <h4 className="text-sm text-gray-400 mb-3">
                    Wallet Update Preview
                  </h4>

                  <div className="grid grid-cols-3 gap-3 text-center">

                    <div className="bg-zinc-900 rounded-lg p-3">

                      <p className="text-gray-500 text-xs">
                        PKR
                      </p>

                      <p
                        className={`font-bold mt-1 ${
                          walletBalance > 0
                            ? "text-green-400"
                            : walletBalance < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {walletBalance > 0
                          ? "+"
                          : ""}

                        {Number(
                          walletBalance
                        ).toLocaleString()}
                      </p>

                    </div>

                    <div className="bg-zinc-900 rounded-lg p-3">

                      <p className="text-gray-500 text-xs">
                        Gold
                      </p>

                      <p
                        className={`font-bold mt-1 ${
                          goldBalance > 0
                            ? "text-green-400"
                            : goldBalance < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {goldBalance > 0
                          ? "+"
                          : ""}

                        {Number(
                          goldBalance
                        ).toFixed(2)}{" "}
                        g
                      </p>

                    </div>

                    <div className="bg-zinc-900 rounded-lg p-3">

                      <p className="text-gray-500 text-xs">
                        USDT
                      </p>

                      <p
                        className={`font-bold mt-1 ${
                          usdtBalance > 0
                            ? "text-green-400"
                            : usdtBalance < 0
                            ? "text-red-400"
                            : "text-gray-400"
                        }`}
                      >
                        {usdtBalance > 0
                          ? "+"
                          : ""}

                        {Number(
                          usdtBalance
                        ).toFixed(2)}
                      </p>

                    </div>

                  </div>

                </div>

                {/* ================= SAVE BUTTON ================= */}

                <button
                  type="button"
                  disabled={
                    saving ||
                    !selectedUser
                  }
                  onClick={() =>
                    void updateWallet()
                  }
                  className={`w-full py-4 rounded-xl font-bold text-lg transition flex items-center justify-center gap-2 ${
                    saving
                      ? "bg-yellow-700 text-black cursor-not-allowed"
                      : "bg-yellow-500 hover:bg-yellow-400 text-black"
                  }`}
                >

                  <Save size={20} />

                  {saving
                    ? "Saving Wallet..."
                    : "Save Wallet Changes"}

                </button>

              </div>

            )}

          </div>

        </section>

      </div>

    </main>

  );

}