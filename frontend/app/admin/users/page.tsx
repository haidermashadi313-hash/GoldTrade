"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Users,
  Search,
  RefreshCw,
  UserCheck,
  UserX,
  Wallet,
  Coins,
  DollarSign,
  Shield,
  Trash2,
  Edit,
  Save,
  XCircle,
  Eye,
  Mail,
  Calendar,
} from "lucide-react";

// =====================================================
// API URL
// GOLDTRADE V18
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com";

// =====================================================
// TYPES
// =====================================================

interface UserWallet {
  pkr: number;
  gold: number;
  usdt: number;
}

interface AdminUser {
  _id: string;

  username: string;
  email: string;
  role: string;

  status: "Active" | "Frozen";

  isActive?: boolean;
  isFrozen?: boolean;
  isVerified?: boolean;

  wallet?: UserWallet;

  pkrBalance?: number;
  goldBalance?: number;
  usdtBalance?: number;

  createdAt: string;
  updatedAt?: string;
}

interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  frozenUsers: number;

  totalPKR: number;
  totalGold: number;
  totalUSDT: number;
}

// =====================================================
// COMPONENT
// =====================================================

export default function AdminUsersPage() {
  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState("");

  const [adminName, setAdminName] =
    useState("Administrator");

  // ===================================================
  // USERS
  // ===================================================

  const [users, setUsers] =
    useState<AdminUser[]>([]);

  const [statistics, setStatistics] =
    useState<UserStatistics>({
      totalUsers: 0,
      activeUsers: 0,
      frozenUsers: 0,
      totalPKR: 0,
      totalGold: 0,
      totalUSDT: 0,
    });

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error">(
      "success"
    );

  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] =
    useState("");

  // ===================================================
  // SELECTED USER
  // ===================================================

  const [selectedUser, setSelectedUser] =
    useState<AdminUser | null>(null);

  const [walletModalOpen, setWalletModalOpen] =
    useState(false);

  // ===================================================
  // EDIT WALLET VALUES
  // ===================================================

  const [editPKR, setEditPKR] =
    useState(0);

  const [editGold, setEditGold] =
    useState(0);

  const [editUSDT, setEditUSDT] =
    useState(0);

    // ===================================================
  // VIEW USER
  // ===================================================

  const [viewUser, setViewUser] =
    useState<AdminUser | null>(null);

  // ===================================================
  // TOKEN LOAD
  // ===================================================

  useEffect(() => {
    const savedToken =
      localStorage.getItem("token");

    if (!savedToken) {
      window.location.href = "/login";
      return;
    }

    setToken(savedToken);
  }, []);

  // ===================================================
  // REQUEST HEADERS
  // ===================================================

  const adminHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }),
    [token]
  );

  // ===================================================
  // SAFE NUMBER
  // ===================================================

  const toNumber = (value: unknown): number => {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  };

  // ===================================================
  // FORMAT MONEY
  // ===================================================

  const formatMoney = (
    value: number = 0
  ): string => {
    return toNumber(value).toLocaleString(
      "en-PK",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    );
  };

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (
    date?: string
  ): string => {
    if (!date) {
      return "--";
    }

    const parsedDate = new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "--";
    }

    return parsedDate.toLocaleString(
      "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // ===================================================
  // GET PKR BALANCE
  // ===================================================

  const getPKR = (
    user: AdminUser
  ): number => {
    return toNumber(
      user.wallet?.pkr ??
        user.pkrBalance ??
        0
    );
  };

  // ===================================================
  // GET GOLD BALANCE
  // ===================================================

  const getGold = (
    user: AdminUser
  ): number => {
    return toNumber(
      user.wallet?.gold ??
        user.goldBalance ??
        0
    );
  };

  // ===================================================
  // GET USDT BALANCE
  // ===================================================

  const getUSDT = (
    user: AdminUser
  ): number => {
    return toNumber(
      user.wallet?.usdt ??
        user.usdtBalance ??
        0
    );
  };
    // ===================================================
  // FILTER USERS
  // ===================================================

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return users;
    }

    return users.filter((user) => {
      const username = String(
        user.username ?? ""
      ).toLowerCase();

      const email = String(
        user.email ?? ""
      ).toLowerCase();

      const role = String(
        user.role ?? ""
      ).toLowerCase();

      return (
        username.includes(keyword) ||
        email.includes(keyword) ||
        role.includes(keyword)
      );
    });
  }, [users, search]);

  // ===================================================
  // USER STATUS
  // ===================================================

  const getUserStatus = (
    user: AdminUser
  ): "Active" | "Frozen" => {
    if (
      user.isFrozen ||
      user.isActive === false ||
      user.status === "Frozen"
    ) {
      return "Frozen";
    }

    return "Active";
  };

  // ===================================================
  // TOKEN EXPIRY / AUTH FAILURE
  // ===================================================

  const handleUnauthorized = () => {
    localStorage.removeItem("token");

    setToken("");

    window.location.href = "/login";
  };

  // ===================================================
  // LOAD USERS + STATISTICS
  // ===================================================

  const loadUsersDashboard = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [usersRes, statisticsRes] =
        await Promise.all([
          fetch(
            `${API}/api/admin/users`,
            {
              method: "GET",
              headers: adminHeaders,
              cache: "no-store",
            }
          ),

          fetch(
            `${API}/api/admin/users/statistics`,
            {
              method: "GET",
              headers: adminHeaders,
              cache: "no-store",
            }
          ),
        ]);

      // ==================================================
      // SAFE JSON PARSING
      // ==================================================

      let usersData: any = {};
      let statisticsData: any = {};

      try {
        usersData = await usersRes.json();
      } catch (jsonError) {
        console.error(
          "USERS API JSON ERROR:",
          jsonError
        );
      }

      try {
        statisticsData =
          await statisticsRes.json();
      } catch (jsonError) {
        console.error(
          "STATISTICS API JSON ERROR:",
          jsonError
        );
      }

      // ==================================================
      // DEBUG
      // ==================================================

      console.log(
        "USERS API:",
        usersData
      );

      console.log(
        "USER STATISTICS API:",
        statisticsData
      );

      // ==================================================
      // AUTHORIZATION FAILURE
      // ==================================================

      if (
        usersRes.status === 401 ||
        usersRes.status === 403 ||
        statisticsRes.status === 401 ||
        statisticsRes.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      // ==================================================
      // USERS
      // ==================================================

      if (
        usersRes.ok &&
        usersData?.success === true &&
        Array.isArray(usersData?.users)
      ) {
        setUsers(usersData.users);
      } else {
        setUsers([]);

        const usersMessage =
          usersData?.message ||
          `Unable to load users. (${usersRes.status})`;

        setError(usersMessage);
      }

      // ==================================================
      // STATISTICS
      // ==================================================

      if (
        statisticsRes.ok &&
        statisticsData?.success === true
      ) {
        const stats =
          statisticsData?.statistics || {};

        setStatistics({
          totalUsers: toNumber(
            stats.totalUsers
          ),

          activeUsers: toNumber(
            stats.activeUsers
          ),

          frozenUsers: toNumber(
            stats.frozenUsers
          ),

          totalPKR: toNumber(
            stats.totalPKR
          ),

          totalGold: toNumber(
            stats.totalGold
          ),

          totalUSDT: toNumber(
            stats.totalUSDT
          ),
        });
      } else {
        // Statistics failure should not
        // destroy already-loaded users.

        setStatistics({
          totalUsers: 0,
          activeUsers: 0,
          frozenUsers: 0,
          totalPKR: 0,
          totalGold: 0,
          totalUSDT: 0,
        });

        console.error(
          "STATISTICS API ERROR:",
          statisticsData?.message ||
            `Request failed with status ${statisticsRes.status}`
        );
      }
    } catch (error: unknown) {
      console.error(
        "LOAD USERS ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to load users."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
    // ===================================================
  // REFRESH USERS
  // ===================================================

  const refreshUsers = async () => {
    if (!token) {
      return;
    }

    setRefreshing(true);

    try {
      await loadUsersDashboard();
    } catch (error) {
      console.error(
        "REFRESH USERS ERROR:",
        error
      );

      setRefreshing(false);
    }
  };

  // ===================================================
  // ADMIN AUTH CHECK
  // ===================================================

  const checkAdminAuth = async () => {
    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/admin/auth/check`,
        {
          method: "GET",
          headers: adminHeaders,
          cache: "no-store",
        }
      );

      let data: any = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          "ADMIN AUTH JSON ERROR:",
          jsonError
        );
      }

      console.log(
        "ADMIN AUTH:",
        data
      );

      // =================================================
      // UNAUTHORIZED
      // =================================================

      if (
        response.status === 401 ||
        response.status === 403 ||
        !response.ok ||
        data?.success !== true
      ) {
        handleUnauthorized();
        return;
      }

      // =================================================
      // ADMIN NAME
      // =================================================

      setAdminName(
        data?.user?.username ||
          data?.user?.fullName ||
          "Administrator"
      );
    } catch (error) {
      console.error(
        "ADMIN AUTH ERROR:",
        error
      );
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    checkAdminAuth();
    loadUsersDashboard();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ===================================================
  // CLEAR MESSAGE
  // ===================================================

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage("");
    }, 4000);

    return () => {
      clearTimeout(timer);
    };
  }, [message]);

  // ===================================================
  // OPEN WALLET EDIT MODAL
  // ===================================================

  const openWalletModal = (
    user: AdminUser
  ) => {
    setSelectedUser(user);

    setEditPKR(
      getPKR(user)
    );

    setEditGold(
      getGold(user)
    );

    setEditUSDT(
      getUSDT(user)
    );

    setWalletModalOpen(true);
  };

  // ===================================================
  // CLOSE WALLET MODAL
  // ===================================================

  const closeWalletModal = () => {
    setWalletModalOpen(false);

    setSelectedUser(null);

    setEditPKR(0);
    setEditGold(0);
    setEditUSDT(0);
  };

  // ===================================================
  // OPEN USER VIEW
  // ===================================================

  const openUserView = (
    user: AdminUser
  ) => {
    setViewUser(user);
  };

  // ===================================================
  // CLOSE USER VIEW
  // ===================================================

  const closeUserView = () => {
    setViewUser(null);
  };

    // ===================================================
  // UPDATE USER WALLET
  // POST /api/admin/users/:id/wallet
  // ===================================================

  const updateUserWallet = async () => {
    if (!selectedUser) {
      return;
    }

    const pkr = Number(editPKR);
    const gold = Number(editGold);
    const usdt = Number(editUSDT);

    // =================================================
    // VALIDATE WALLET VALUES
    // =================================================

    if (
      !Number.isFinite(pkr) ||
      !Number.isFinite(gold) ||
      !Number.isFinite(usdt)
    ) {
      setMessage(
        "Wallet values must be valid numbers."
      );

      setMessageType("error");

      return;
    }

    if (
      pkr < 0 ||
      gold < 0 ||
      usdt < 0
    ) {
      setMessage(
        "Wallet values cannot be negative."
      );

      setMessageType("error");

      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/admin/users/${selectedUser._id}/wallet`,
        {
          method: "POST",
          headers: adminHeaders,
          body: JSON.stringify({
            pkr,
            gold,
            usdt,
          }),
        }
      );

      // =================================================
      // SAFE JSON RESPONSE
      // =================================================

      let data: any = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          "UPDATE WALLET JSON ERROR:",
          jsonError
        );
      }

      // =================================================
      // AUTHORIZATION
      // =================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      // =================================================
      // API ERROR
      // =================================================

      if (
        !response.ok ||
        data?.success !== true
      ) {
        throw new Error(
          data?.message ||
            `Wallet update failed. (${response.status})`
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      setMessage(
        "Wallet updated successfully."
      );

      setMessageType("success");

      closeWalletModal();

      await loadUsersDashboard();
    } catch (error: unknown) {
      console.error(
        "UPDATE WALLET ERROR:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Wallet update failed."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };
    // ===================================================
  // FREEZE / UNFREEZE USER
  // POST /api/admin/users/:id/status
  // ===================================================

  const updateUserStatus = async (
    userId: string,
    status: "Active" | "Frozen"
  ) => {
    if (!userId) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/users/${userId}/status`,
        {
          method: "POST",
          headers: adminHeaders,
          body: JSON.stringify({
            status,
          }),
        }
      );

      // =================================================
      // SAFE JSON RESPONSE
      // =================================================

      let data: any = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          "STATUS JSON ERROR:",
          jsonError
        );
      }

      // =================================================
      // AUTHORIZATION
      // =================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      // =================================================
      // API ERROR
      // =================================================

      if (
        !response.ok ||
        data?.success !== true
      ) {
        throw new Error(
          data?.message ||
            `Status update failed. (${response.status})`
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      setMessage(
        `User ${status.toLowerCase()} successfully.`
      );

      setMessageType("success");

      await loadUsersDashboard();
    } catch (error: unknown) {
      console.error(
        "STATUS UPDATE ERROR:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Status update failed."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // DELETE USER
  // DELETE /api/admin/users/:id
  // ===================================================

  const deleteUser = async (
    userId: string
  ) => {
    if (!userId) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this user permanently?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API}/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: adminHeaders,
        }
      );

      // =================================================
      // SAFE JSON RESPONSE
      // =================================================

      let data: any = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        console.error(
          "DELETE USER JSON ERROR:",
          jsonError
        );
      }

      // =================================================
      // AUTHORIZATION
      // =================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleUnauthorized();
        return;
      }

      // =================================================
      // API ERROR
      // =================================================

      if (
        !response.ok ||
        data?.success !== true
      ) {
        throw new Error(
          data?.message ||
            `Delete failed. (${response.status})`
        );
      }

      // =================================================
      // SUCCESS
      // =================================================

      setMessage(
        "User deleted successfully."
      );

      setMessageType("success");

      // If deleted user was currently selected,
      // clear selected/view state.

      if (
        selectedUser?._id === userId
      ) {
        closeWalletModal();
      }

      if (
        viewUser?._id === userId
      ) {
        closeUserView();
      }

      await loadUsersDashboard();
    } catch (error: unknown) {
      console.error(
        "DELETE USER ERROR:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Delete failed."
      );

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // USER STATUS BADGE
  // ===================================================

  const getUserStatusClass = (
    status?: string
  ): string => {
    const normalizedStatus = String(
      status || "Active"
    )
      .trim()
      .toLowerCase();

    if (
      normalizedStatus === "frozen"
    ) {
      return "text-red-400 bg-red-500/10 border border-red-500/30";
    }

    return "text-green-400 bg-green-500/10 border border-green-500/30";
  };

  // ===================================================
  // ROLE BADGE
  // ===================================================

  const getRoleClass = (
    role?: string
  ): string => {
    const normalizedRole = String(
      role || ""
    )
      .trim()
      .toLowerCase();

    if (
      normalizedRole === "admin"
    ) {
      return "text-red-400 bg-red-500/10 border border-red-500/30";
    }

    return "text-blue-400 bg-blue-500/10 border border-blue-500/30";
  };
  
  // ===================================================
  // PAGE UI
  // ===================================================

  return (
    <main className="min-h-screen bg-black text-white">

      {/* =================================================
          PAGE CONTAINER
      ================================================= */}

      <div className="mx-auto w-full max-w-[1800px] px-4 py-6 sm:px-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                <Users
                  size={24}
                  className="text-yellow-400"
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  User Management
                </h1>

                <p className="mt-1 text-sm text-gray-400">
                  Manage users, wallets and account status
                </p>
              </div>

            </div>
          </div>

          <div className="flex items-center gap-3">

            <div className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 sm:block">
              <p className="text-xs text-gray-500">
                Administrator
              </p>

              <p className="text-sm font-semibold text-white">
                {adminName}
              </p>
            </div>

            <button
              type="button"
              onClick={refreshUsers}
              disabled={refreshing || loading}
              className="flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              messageType === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >

            {messageType === "success" ? (
              <UserCheck size={18} />
            ) : (
              <XCircle size={18} />
            )}

            <span>{message}</span>

            <button
              type="button"
              onClick={() =>
                setMessage("")
              }
              className="ml-auto opacity-70 transition hover:opacity-100"
            >
              <XCircle size={17} />
            </button>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-sm text-red-400">

            <XCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-semibold">
                Unable to load users
              </p>

              <p className="mt-1 text-red-300/80">
                {error}
              </p>
            </div>

          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {/* TOTAL USERS */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-400">
                  Total Users
                </p>

                <p className="mt-2 text-3xl font-bold text-white">
                  {statistics.totalUsers.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-blue-500/10 p-3">
                <Users
                  size={22}
                  className="text-blue-400"
                />
              </div>

            </div>
          </div>

          {/* ACTIVE USERS */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-400">
                  Active Users
                </p>

                <p className="mt-2 text-3xl font-bold text-green-400">
                  {statistics.activeUsers.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-green-500/10 p-3">
                <UserCheck
                  size={22}
                  className="text-green-400"
                />
              </div>

            </div>
          </div>

          {/* FROZEN USERS */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-400">
                  Frozen Users
                </p>

                <p className="mt-2 text-3xl font-bold text-red-400">
                  {statistics.frozenUsers.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl bg-red-500/10 p-3">
                <UserX
                  size={22}
                  className="text-red-400"
                />
              </div>

            </div>
          </div>

          {/* TOTAL PKR */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-400">
                  Total PKR
                </p>

                <p className="mt-2 text-2xl font-bold text-yellow-400">
                  {formatMoney(
                    statistics.totalPKR
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-yellow-500/10 p-3">
                <DollarSign
                  size={22}
                  className="text-yellow-400"
                />
              </div>

            </div>
          </div>

          {/* TOTAL GOLD */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-400">
                  Total Gold
                </p>

                <p className="mt-2 text-2xl font-bold text-orange-400">
                  {formatMoney(
                    statistics.totalGold
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-orange-500/10 p-3">
                <Coins
                  size={22}
                  className="text-orange-400"
                />
              </div>

            </div>
          </div>

          {/* TOTAL USDT */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-400">
                  Total USDT
                </p>

                <p className="mt-2 text-2xl font-bold text-emerald-400">
                  {formatMoney(
                    statistics.totalUSDT
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-500/10 p-3">
                <Wallet
                  size={22}
                  className="text-emerald-400"
                />
              </div>

            </div>
          </div>

        </section>
                {/* =================================================
            SEARCH / FILTER BAR
        ================================================= */}

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="relative w-full lg:max-w-xl">

              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search username, email or role..."
                className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-yellow-500/50"
              />

            </div>

            <div className="flex items-center justify-between gap-4 text-sm">

              <span className="text-gray-500">
                Showing
              </span>

              <span className="font-semibold text-white">
                {filteredUsers.length}
              </span>

              <span className="text-gray-500">
                of
              </span>

              <span className="font-semibold text-white">
                {users.length}
              </span>

              <span className="text-gray-500">
                users
              </span>

            </div>

          </div>

        </section>

        {/* =================================================
            USERS TABLE
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">

          <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-lg font-bold text-white">
                All Users
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                User accounts and wallet balances
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield size={15} />
              Admin Access
            </div>

          </div>

          {loading && users.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center">

              <div className="flex flex-col items-center gap-3 text-gray-400">

                <RefreshCw
                  size={28}
                  className="animate-spin text-yellow-400"
                />

                <p className="text-sm">
                  Loading users...
                </p>

              </div>

            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex min-h-[300px] items-center justify-center px-6 text-center">

              <div>

                <Users
                  size={40}
                  className="mx-auto mb-4 text-gray-600"
                />

                <h3 className="text-lg font-semibold text-gray-300">
                  No users found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {search
                    ? "Try a different search."
                    : "There are no users available."}
                </p>

              </div>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-[1150px] w-full">

                <thead>
                  <tr className="border-b border-white/10 bg-black/20 text-left">

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      User
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Role
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      PKR
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      GOLD
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      USDT
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Created
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">

                  {filteredUsers.map(
                    (user) => {
                      const userStatus =
                        user.isFrozen
                          ? "Frozen"
                          : user.status ||
                            "Active";

                      return (
                        <tr
                          key={user._id}
                          className="transition hover:bg-white/[0.025]"
                        >

                          {/* USER */}

                          <td className="px-5 py-5">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/10 text-sm font-bold text-yellow-400">
                                {String(
                                  user.username ||
                                    "U"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">

                                <p className="truncate font-semibold text-white">
                                  {user.username}
                                </p>

                                <p className="mt-1 flex items-center gap-1 truncate text-xs text-gray-500">

                                  <Mail
                                    size={12}
                                  />

                                  {user.email ||
                                    "--"}

                                </p>

                              </div>

                            </div>

                          </td>

                          {/* ROLE */}

                          <td className="px-5 py-5">

                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRoleClass(
                                user.role
                              )}`}
                            >
                              {String(
                                user.role ||
                                  "USER"
                              ).toUpperCase()}
                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-5">

                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getUserStatusClass(
                                userStatus
                              )}`}
                            >
                              {userStatus}
                            </span>

                          </td>

                          {/* PKR */}

                          <td className="px-5 py-5 text-right">

                            <span className="font-semibold text-yellow-400">
                              {formatMoney(
                                getPKR(
                                  user
                                )
                              )}
                            </span>

                          </td>

                          {/* GOLD */}

                          <td className="px-5 py-5 text-right">

                            <span className="font-semibold text-orange-400">
                              {formatMoney(
                                getGold(
                                  user
                                )
                              )}
                            </span>

                          </td>

                          {/* USDT */}

                          <td className="px-5 py-5 text-right">

                            <span className="font-semibold text-emerald-400">
                              {formatMoney(
                                getUSDT(
                                  user
                                )
                              )}
                            </span>

                          </td>

                          {/* CREATED */}

                          <td className="px-5 py-5">

                            <div className="flex items-center gap-2 text-xs text-gray-400">

                              <Calendar
                                size={14}
                                className="text-gray-600"
                              />

                              {formatDate(
                                user.createdAt
                              )}

                            </div>

                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-5">

                            <div className="flex items-center justify-end gap-2">

                              {/* VIEW */}

                              <button
                                type="button"
                                onClick={() =>
                                  openUserView(
                                    user
                                  )
                                }
                                title="View user"
                                className="rounded-lg border border-white/10 bg-white/5 p-2 text-gray-300 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                              >
                                <Eye
                                  size={16}
                                />
                              </button>

                              {/* WALLET */}

                              <button
                                type="button"
                                onClick={() =>
                                  openWalletModal(
                                    user
                                  )
                                }
                                title="Edit wallet"
                                className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-2 text-yellow-400 transition hover:bg-yellow-500/10"
                              >
                                <Edit
                                  size={16}
                                />
                              </button>

                              {/* STATUS */}

                              <button
                                type="button"
                                onClick={() =>
                                  updateUserStatus(
                                    user._id,
                                    userStatus ===
                                      "Frozen"
                                      ? "Active"
                                      : "Frozen"
                                  )
                                }
                                title={
                                  userStatus ===
                                  "Frozen"
                                    ? "Unfreeze user"
                                    : "Freeze user"
                                }
                                className={`rounded-lg border p-2 transition ${
                                  userStatus ===
                                  "Frozen"
                                    ? "border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/10"
                                    : "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                                }`}
                              >
                                {userStatus ===
                                "Frozen" ? (
                                  <UserCheck
                                    size={16}
                                  />
                                ) : (
                                  <UserX
                                    size={16}
                                  />
                                )}
                              </button>

                              {/* DELETE */}

                              <button
                                type="button"
                                onClick={() =>
                                  deleteUser(
                                    user._id
                                  )
                                }
                                title="Delete user"
                                className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-red-400 transition hover:bg-red-500/10"
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </div>
            {/* =================================================
          WALLET EDIT MODAL
      ================================================= */}

      {walletModalOpen && selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeWalletModal();
            }
          }}
        >

          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">

              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-yellow-500/10 p-3">
                  <Wallet
                    size={21}
                    className="text-yellow-400"
                  />
                </div>

                <div>
                  <h2 className="font-bold text-white">
                    Edit User Wallet
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {selectedUser.username}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={closeWalletModal}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
              >
                <XCircle size={20} />
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="space-y-5 p-5">

              {/* USER INFO */}

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-500/10 font-bold text-yellow-400">
                    {String(
                      selectedUser.username ||
                        "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">

                    <p className="truncate font-semibold text-white">
                      {selectedUser.username}
                    </p>

                    <p className="truncate text-xs text-gray-500">
                      {selectedUser.email ||
                        "--"}
                    </p>

                  </div>

                </div>

              </div>

              {/* PKR */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-300">
                  PKR Balance
                </label>

                <div className="relative">

                  <DollarSign
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editPKR}
                    onChange={(event) =>
                      setEditPKR(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-white outline-none transition focus:border-yellow-500/50"
                  />

                </div>

              </div>

              {/* GOLD */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Gold Balance
                </label>

                <div className="relative">

                  <Coins
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.000001"
                    value={editGold}
                    onChange={(event) =>
                      setEditGold(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-white outline-none transition focus:border-orange-500/50"
                  />

                </div>

              </div>

              {/* USDT */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-300">
                  USDT Balance
                </label>

                <div className="relative">

                  <Wallet
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editUSDT}
                    onChange={(event) =>
                      setEditUSDT(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-4 text-white outline-none transition focus:border-emerald-500/50"
                  />

                </div>

              </div>

              {/* WARNING */}

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3">

                <p className="text-xs leading-5 text-yellow-300/80">
                  Wallet values will be updated according to
                  the values entered above. Make sure the
                  amounts are correct before saving.
                </p>

              </div>

            </div>

            {/* MODAL FOOTER */}

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 px-5 py-5 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={closeWalletModal}
                disabled={loading}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={updateUserWallet}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loading ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={17} />
                    Save Wallet
                  </>
                )}

              </button>

            </div>

          </div>

        </div>
      )}
            {/* =================================================
          USER DETAILS MODAL
      ================================================= */}

      {viewUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeUserView();
            }
          }}
        >

          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/10 font-bold text-blue-400">
                  {String(
                    viewUser.username || "U"
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h2 className="font-bold text-white">
                    User Details
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {viewUser.username}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={closeUserView}
                className="rounded-lg p-2 text-gray-500 transition hover:bg-white/5 hover:text-white"
              >
                <XCircle size={20} />
              </button>

            </div>

            {/* BODY */}

            <div className="space-y-5 p-5">

              {/* ACCOUNT INFORMATION */}

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">

                <div className="mb-4 flex items-center gap-2">

                  <Shield
                    size={17}
                    className="text-blue-400"
                  />

                  <h3 className="font-semibold text-white">
                    Account Information
                  </h3>

                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                  <div>
                    <p className="text-xs text-gray-500">
                      Username
                    </p>

                    <p className="mt-1 font-medium text-white">
                      {viewUser.username}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Email
                    </p>

                    <p className="mt-1 break-all font-medium text-white">
                      {viewUser.email ||
                        "--"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Role
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRoleClass(
                        viewUser.role
                      )}`}
                    >
                      {String(
                        viewUser.role ||
                          "USER"
                      ).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Status
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getUserStatusClass(
                        viewUser.isFrozen
                          ? "Frozen"
                          : viewUser.status
                      )}`}
                    >
                      {viewUser.isFrozen
                        ? "Frozen"
                        : viewUser.status ||
                          "Active"}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Created At
                    </p>

                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-300">

                      <Calendar
                        size={14}
                        className="text-gray-500"
                      />

                      {formatDate(
                        viewUser.createdAt
                      )}

                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      User ID
                    </p>

                    <p className="mt-1 break-all font-mono text-xs text-gray-400">
                      {viewUser._id}
                    </p>
                  </div>

                </div>

              </div>

              {/* WALLET INFORMATION */}

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">

                <div className="mb-4 flex items-center gap-2">

                  <Wallet
                    size={17}
                    className="text-yellow-400"
                  />

                  <h3 className="font-semibold text-white">
                    Wallet Information
                  </h3>

                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                  {/* PKR */}

                  <div className="rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-4">

                    <div className="mb-2 flex items-center gap-2">

                      <DollarSign
                        size={16}
                        className="text-yellow-400"
                      />

                      <span className="text-xs text-gray-500">
                        PKR
                      </span>

                    </div>

                    <p className="text-lg font-bold text-yellow-400">
                      {formatMoney(
                        getPKR(
                          viewUser
                        )
                      )}
                    </p>

                  </div>

                  {/* GOLD */}

                  <div className="rounded-xl border border-orange-500/10 bg-orange-500/5 p-4">

                    <div className="mb-2 flex items-center gap-2">

                      <Coins
                        size={16}
                        className="text-orange-400"
                      />

                      <span className="text-xs text-gray-500">
                        GOLD
                      </span>

                    </div>

                    <p className="text-lg font-bold text-orange-400">
                      {formatMoney(
                        getGold(
                          viewUser
                        )
                      )}
                    </p>

                  </div>

                  {/* USDT */}

                  <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">

                    <div className="mb-2 flex items-center gap-2">

                      <Wallet
                        size={16}
                        className="text-emerald-400"
                      />

                      <span className="text-xs text-gray-500">
                        USDT
                      </span>

                    </div>

                    <p className="text-lg font-bold text-emerald-400">
                      {formatMoney(
                        getUSDT(
                          viewUser
                        )
                      )}
                    </p>

                  </div>

                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-5 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={() => {
                  closeUserView();
                  openWalletModal(
                    viewUser
                  );
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-3 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/10"
              >
                <Edit size={16} />
                Edit Wallet
              </button>

              <button
                type="button"
                onClick={closeUserView}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-gray-300 transition hover:bg-white/10"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}