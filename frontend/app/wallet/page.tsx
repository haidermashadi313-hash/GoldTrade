"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";

import { useRouter } from "next/navigation";

import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  CreditCard,
  History,
  Receipt,
  ShieldCheck,
  Landmark,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Clock,
  ChevronRight,
} from "lucide-react";

// ==========================================================
// API URL
// ==========================================================

const API = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com"
).replace(/\/+$/, "");

// ==========================================================
// TYPES
// ==========================================================

interface UserSession {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
}

interface WalletData {
  wallet: number;
  pkrBalance: number;
  usdtBalance: number;
  goldBalance: number;
}

interface Deposit {
  _id: string;
  username: string;
  amount: number;
  method: string;
  status: string;
  receipt?: string;
  createdAt: string;
}

interface Withdraw {
  _id: string;
  username: string;
  amount: number;
  method: string;
  walletAddress: string;
  status: string;
  createdAt: string;
}

interface WalletResponse {
  success: boolean;
  wallet?: WalletData;
  deposits?: Deposit[];
  withdrawals?: Withdraw[];
  message?: string;
}

// ==========================================================
// SESSION HELPERS
// ==========================================================

const getSession = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const token =
    localStorage.getItem("goldtrade_token") ||
    sessionStorage.getItem("goldtrade_token");

  const user =
    localStorage.getItem("goldtrade_user") ||
    sessionStorage.getItem("goldtrade_user");

  if (!token || !user) {
    return null;
  }

  try {
    return {
      token,
      user: JSON.parse(user) as UserSession,
    };
  } catch {
    return null;
  }
};

// ==========================================================
// CLEAR SESSION
// ==========================================================

const clearSession = () => {
  if (typeof window === "undefined") {
    return;
  }

  const keys = [
    "goldtrade_token",
    "goldtrade_user",
    "goldtrade_role",
    "goldtrade_username",
    "goldtrade_email",
  ];

  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

// ==========================================================
// COMPONENT
// ==========================================================

export default function WalletPage() {
  const router = useRouter();

  // ========================================================
  // CURRENCY FORMATTER
  // ========================================================

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  }

  // ========================================================
  // AUTH / SESSION STATES
  // ========================================================

  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  const [userRole, setUserRole] =
    useState<"user" | "admin">("user");

  const [authChecked, setAuthChecked] =
    useState(false);

  // ========================================================
  // WALLET STATES
  // ========================================================

  const [walletBalance, setWalletBalance] =
    useState<number>(0);

  const [pkrBalance, setPkrBalance] =
    useState<number>(0);

  const [usdtBalance, setUsdtBalance] =
    useState<number>(0);

  const [goldBalance, setGoldBalance] =
    useState<number>(0);

  // ========================================================
  // HISTORY STATES
  // ========================================================

  const [deposits, setDeposits] =
    useState<Deposit[]>([]);

  const [withdrawals, setWithdrawals] =
    useState<Withdraw[]>([]);

  // ========================================================
  // DEPOSIT FORM STATES
  // ========================================================

  const [depositAmount, setDepositAmount] =
    useState<string>("");

  const [depositMethod, setDepositMethod] =
    useState<string>("ABA Bank");

  const [receiptImage, setReceiptImage] =
    useState<File | null>(null);

  // ========================================================
  // WITHDRAW FORM STATES
  // ========================================================

  const [withdrawAmount, setWithdrawAmount] =
    useState<string>("");

  const [withdrawMethod, setWithdrawMethod] =
    useState<string>("PKR Bank");

  const [withdrawAddress, setWithdrawAddress] =
    useState<string>("");

  // ========================================================
  // SEARCH / FILTER STATES
  // ========================================================

  const [searchHistory, setSearchHistory] =
    useState<string>("");

  const [historyFilter, setHistoryFilter] =
    useState<"all" | "deposit" | "withdraw">("all");

  // ========================================================
  // UI STATES
  // ========================================================

  const [loading, setLoading] =
    useState<boolean>(true);

  const [walletLoading, setWalletLoading] =
    useState<boolean>(false);

  const [depositLoading, setDepositLoading] =
    useState<boolean>(false);

  const [withdrawLoading, setWithdrawLoading] =
    useState<boolean>(false);

  const [refreshLoading, setRefreshLoading] =
    useState<boolean>(false);

  const [successMessage, setSuccessMessage] =
    useState<string>("");

  const [errorMessage, setErrorMessage] =
    useState<string>("");

  const [lastRefresh, setLastRefresh] =
    useState<Date | null>(null);

  const [isOnline, setIsOnline] =
    useState<boolean>(true);

  // ========================================================
  // LOADING TEXT
  // ========================================================

  const loadingText = useMemo(() => {
    if (walletLoading) {
      return "Loading wallet...";
    }

    if (depositLoading) {
      return "Loading deposits...";
    }

    if (withdrawLoading) {
      return "Loading withdrawals...";
    }

    if (refreshLoading) {
      return "Refreshing wallet...";
    }

    return "Loading GoldTrade Wallet...";
  }, [
    walletLoading,
    depositLoading,
    withdrawLoading,
    refreshLoading,
  ]);

// ========================================================
// SESSION INITIALIZER
// ========================================================

const initializeSession = useCallback(() => {
  const session = getSession();

  if (!session) {
    clearSession();
    router.replace("/login");
    return null;
  }

  setToken(session.token);
  setUsername(session.user.username);
  setUserEmail(session.user.email);
  setUserRole(session.user.role);
  setAuthChecked(true);

  return session;
}, [router]);

// ========================================================
// LAST REFRESH LABEL
// ========================================================

const lastRefreshLabel = useMemo(() => {
  if (!lastRefresh) {
    return "Not refreshed yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(lastRefresh);
}, [lastRefresh]);

// ========================================================
// WALLET STATUS CLASS
// ========================================================

const walletStatusClass = useMemo(() => {
  return isOnline
    ? "bg-green-500/20 text-green-400 border border-green-500/30"
    : "bg-red-500/20 text-red-400 border border-red-500/30";
}, [isOnline]);

// ========================================================
// WALLET HEALTH
// ========================================================

const walletHealth = useMemo(() => {
  return isOnline ? "Healthy" : "Offline";
}, [isOnline]);

// ========================================================
// TOTAL WALLET VALUE
// ========================================================

const totalWalletValue = useMemo(() => {
  return (
    Number(walletBalance || 0) +
    Number(pkrBalance || 0) +
    Number(usdtBalance || 0) * 3000 +
    Number(goldBalance || 0) * 6000
  );
}, [
  walletBalance,
  pkrBalance,
  usdtBalance,
  goldBalance,
]);

// ========================================================
// LOGOUT
// ========================================================

const handleLogout = useCallback(() => {
  clearSession();
  router.replace("/login");
}, [router]);

// ========================================================
// GO TO DEPOSIT
// ========================================================

const goDeposit = useCallback(() => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}, []);

// ========================================================
// GO TO WITHDRAW
// ========================================================

const goWithdraw = useCallback(() => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}, []);

// ========================================================
// NETWORK STATUS
// ========================================================

useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
  };

  const handleOffline = () => {
    setIsOnline(false);
  };

  // Set initial network status correctly.
  setIsOnline(navigator.onLine);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}, []);

// ========================================================
// AUTH CHECK
// ========================================================

useEffect(() => {
  if (typeof window === "undefined") {
    return;
  }

  const session = initializeSession();

  if (!session) {
    return;
  }

  console.log(
    "WALLET SESSION:",
    session.user.username
  );

  setLoading(false);
}, [initializeSession]);

// ========================================================
// LOAD WALLET
// ========================================================

const loadWallet = useCallback(
  async (
    currentUsername: string,
    currentToken: string
  ) => {
    if (!currentUsername || !currentToken) {
      return;
    }

    try {
      setWalletLoading(true);
      setErrorMessage("");

      const normalizedUsername =
        currentUsername.trim().toLowerCase();

      const walletUrl =
        `${API}/api/wallet/${encodeURIComponent(
          normalizedUsername
        )}`;

      const response = await fetch(walletUrl, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        cache: "no-store",
      });

      // ==================================================
      // AUTH ERROR
      // ==================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        clearSession();

        setToken("");
        setUsername("");
        setAuthChecked(false);

        router.replace("/login");

        return;
      }

      // ==================================================
      // SAFE JSON RESPONSE
      // ==================================================

      const responseText = await response.text();

      let data: WalletResponse = {
        success: false,
      };

      if (responseText.trim()) {
        try {
          data = JSON.parse(
            responseText
          ) as WalletResponse;
        } catch {
          throw new Error(
            "Wallet API returned invalid JSON."
          );
        }
      }

      console.log("WALLET RESPONSE:", data);

      // ==================================================
      // API ROUTE NOT FOUND
      // ==================================================

      if (response.status === 404) {
        throw new Error(
          data.message ||
            `Wallet API route not found: ${walletUrl}`
        );
      }

      // ==================================================
      // API ERROR
      // ==================================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Wallet API failed with status ${response.status}.`
        );
      }

      // ==================================================
      // API SUCCESS CHECK
      // ==================================================

      if (!data.success) {
        throw new Error(
          data.message ||
            "Wallet API failed."
        );
      }

      // ==================================================
      // WALLET DATA
      // ==================================================

      const wallet: WalletData =
        data.wallet || {
          wallet: 0,
          pkrBalance: 0,
          usdtBalance: 0,
          goldBalance: 0,
        };

      // ==================================================
      // UPDATE BALANCES
      // ==================================================

      setWalletBalance(
        Number(wallet.wallet ?? 0)
      );

      setPkrBalance(
        Number(wallet.pkrBalance ?? 0)
      );

      setUsdtBalance(
        Number(wallet.usdtBalance ?? 0)
      );

      setGoldBalance(
        Number(wallet.goldBalance ?? 0)
      );

      // ==================================================
      // UPDATE HISTORY IF INCLUDED
      // ==================================================

      if (Array.isArray(data.deposits)) {
        setDeposits(data.deposits);
      }

      if (Array.isArray(data.withdrawals)) {
        setWithdrawals(data.withdrawals);
      }

      // ==================================================
      // LAST REFRESH
      // ==================================================

      setLastRefresh(new Date());
    } catch (error: unknown) {
      console.error(
        "LOAD WALLET ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Unable to load wallet.";

      setErrorMessage(message);

      // Do NOT overwrite existing balances
      // with zero when the API temporarily fails.
    } finally {
      setWalletLoading(false);
      setLoading(false);
    }
  },
  [router]
);

// ========================================================
// LOAD DEPOSIT HISTORY
// ========================================================

const loadDepositHistory = useCallback(
  async (
    currentUsername: string,
    currentToken: string
  ) => {
    if (!currentUsername || !currentToken) {
      return;
    }

    const safeUsername = String(currentUsername)
      .trim()
      .toLowerCase();

    if (!safeUsername) {
      setErrorMessage(
        "Username is missing. Please login again."
      );
      return;
    }

    try {
      setDepositLoading(true);
      setErrorMessage("");

      const historyUrl =
        `${API}/api/deposit/history/` +
        encodeURIComponent(safeUsername);

      const response = await fetch(historyUrl, {
        method: "GET",

        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        cache: "no-store",
      });

      // ==================================================
      // AUTH ERROR
      // ==================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        clearSession();

        setToken("");
        setUsername("");
        setAuthChecked(false);

        router.replace("/login");

        return;
      }

      // ==================================================
      // SAFE RESPONSE PARSING
      // ==================================================

      const responseText = await response.text();

      let data: {
        success?: boolean;
        deposits?: Deposit[];
        message?: string;
        error?: string;
      } = {
        success: false,
      };

      if (responseText.trim()) {
        try {
          data = JSON.parse(responseText) as {
            success?: boolean;
            deposits?: Deposit[];
            message?: string;
            error?: string;
          };
        } catch {
          throw new Error(
            "Deposit history API returned invalid JSON."
          );
        }
      }

      console.log(
        "DEPOSIT HISTORY:",
        data
      );

      // ==================================================
      // ROUTE NOT FOUND
      // ==================================================

      if (response.status === 404) {
        throw new Error(
          data.message ||
            `Deposit history API route not found: ${historyUrl}`
        );
      }

      // ==================================================
      // HTTP ERROR
      // ==================================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Deposit history request failed with status ${response.status}.`
        );
      }

      // ==================================================
      // API ERROR
      // ==================================================

      if (!data.success) {
        throw new Error(
          data.message ||
            "Unable to load deposit history."
        );
      }

      // ==================================================
      // UPDATE DEPOSITS
      // ==================================================

      setDeposits(
        Array.isArray(data.deposits)
          ? data.deposits
          : []
      );
    } catch (error: unknown) {
      console.error(
        "DEPOSIT HISTORY ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Deposit history failed.";

      setErrorMessage(message);

      // API fail hone par existing history ko
      // unnecessarily blank nahi karte.
    } finally {
      setDepositLoading(false);
    }
  },
  [router]
);

// ========================================================
// SUBMIT DEPOSIT
// ========================================================

const submitDeposit = async () => {
  // ======================================================
  // AUTH VALIDATION
  // ======================================================

  if (!token || !username) {
    setErrorMessage(
      "Authentication session is missing. Please login again."
    );
    return;
  }

  // ======================================================
  // AMOUNT VALIDATION
  // ======================================================

  const amount = Number(depositAmount);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    setErrorMessage(
      "Please enter a valid deposit amount."
    );
    return;
  }

  // ======================================================
  // RECEIPT VALIDATION
  // ======================================================

  if (!receiptImage) {
    setErrorMessage(
      "Please upload a payment receipt."
    );
    return;
  }

  // ======================================================
  // FILE SIZE VALIDATION
  // ======================================================

  const maxReceiptSize =
    10 * 1024 * 1024;

  if (receiptImage.size > maxReceiptSize) {
    setErrorMessage(
      "Receipt image must be less than 10 MB."
    );
    return;
  }

  try {
    setDepositLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    // ====================================================
    // FORM DATA
    // ====================================================

    const formData = new FormData();

    formData.append(
      "username",
      username.trim().toLowerCase()
    );

    formData.append(
      "amount",
      String(amount)
    );

    formData.append(
      "method",
      depositMethod
    );

    formData.append(
      "receipt",
      receiptImage,
      receiptImage.name
    );

    // ====================================================
    // CREATE DEPOSIT
    // ====================================================

    const createUrl =
      `${API}/api/deposit/create`;

    const response = await fetch(createUrl, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },

      // IMPORTANT:
      // Content-Type manually set nahi karna.
      // Browser FormData ka multipart boundary
      // automatically set karega.

      body: formData,
    });

    // ====================================================
    // AUTH ERROR
    // ====================================================

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      clearSession();

      setToken("");
      setUsername("");
      setAuthChecked(false);

      router.replace("/login");

      return;
    }

    // ====================================================
    // SAFE RESPONSE PARSING
    // ====================================================

    const responseText =
      await response.text();

    let data: {
      success?: boolean;
      message?: string;
      error?: string;
    } = {
      success: false,
    };

    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText) as {
          success?: boolean;
          message?: string;
          error?: string;
        };
      } catch {
        throw new Error(
          "Deposit API returned invalid JSON."
        );
      }
    }

    console.log(
      "DEPOSIT RESPONSE:",
      data
    );

    // ====================================================
    // ROUTE NOT FOUND
    // ====================================================

    if (response.status === 404) {
      throw new Error(
        data.message ||
          `Deposit API route not found: ${createUrl}`
      );
    }

    // ====================================================
    // HTTP ERROR
    // ====================================================

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          `Deposit request failed with status ${response.status}.`
      );
    }

    // ====================================================
    // API ERROR
    // ====================================================

    if (!data.success) {
      throw new Error(
        data.message ||
          "Deposit request failed."
      );
    }

    // ====================================================
    // SUCCESS
    // ====================================================

    setSuccessMessage(
      "Deposit request submitted successfully."
    );

    setDepositAmount("");
    setReceiptImage(null);

    // ====================================================
    // REFRESH WALLET + HISTORY
    // ====================================================

    await Promise.all([
      loadWallet(
        username,
        token
      ),

      loadDepositHistory(
        username,
        token
      ),
    ]);
  } catch (error: unknown) {
    console.error(
      "DEPOSIT ERROR:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Deposit request failed.";

    setErrorMessage(message);
  } finally {
    setDepositLoading(false);
  }
};

// ========================================================
// RECEIPT FILE SELECT
// ========================================================

const handleReceiptSelect = (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file =
    event.target.files?.[0];

  if (!file) {
    return;
  }

  // ======================================================
  // FILE TYPE VALIDATION
  // ======================================================

  if (
    !file.type ||
    !file.type.startsWith("image/")
  ) {
    setReceiptImage(null);

    setErrorMessage(
      "Please select a valid receipt image."
    );

    // Allow selecting the same file again.
    event.target.value = "";

    return;
  }

  // ======================================================
  // FILE SIZE VALIDATION
  // ======================================================

  const maxSize =
    10 * 1024 * 1024;

  if (file.size > maxSize) {
    setReceiptImage(null);

    setErrorMessage(
      "Receipt image must be less than 10 MB."
    );

    // Allow selecting the same file again.
    event.target.value = "";

    return;
  }

  // ======================================================
  // SAVE FILE
  // ======================================================

  setReceiptImage(file);
  setErrorMessage("");
};

// ========================================================
// RECEIPT PREVIEW
// ========================================================

const receiptPreview = useMemo(() => {
  if (!receiptImage) {
    return "";
  }

  try {
    return URL.createObjectURL(
      receiptImage
    );
  } catch (error) {
    console.error(
      "RECEIPT PREVIEW ERROR:",
      error
    );

    return "";
  }
}, [receiptImage]);

// ========================================================
// RECEIPT PREVIEW CLEANUP
// ========================================================

useEffect(() => {
  return () => {
    if (receiptPreview) {
      URL.revokeObjectURL(
        receiptPreview
      );
    }
  };
}, [receiptPreview]);

// ========================================================
// LOAD WITHDRAW HISTORY
// ========================================================

const loadWithdrawHistory = useCallback(
  async (
    currentUsername: string,
    currentToken: string
  ) => {
    const safeUsername = String(currentUsername)
      .trim()
      .toLowerCase();

    if (!safeUsername || !currentToken) {
      return;
    }

    try {
      setWithdrawLoading(true);
      setErrorMessage("");

      // ==================================================
      // WITHDRAW HISTORY API
      // Backend route:
      // GET /api/withdraw/history
      // ==================================================

      const historyUrl =
        `${API}/api/withdraw/history`;

      const response = await fetch(
        historyUrl,
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${currentToken}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          cache: "no-store",
        }
      );

      // ==================================================
      // AUTH ERROR
      // ==================================================

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        clearSession();

        setToken("");
        setUsername("");
        setAuthChecked(false);

        router.replace("/login");

        return;
      }

      // ==================================================
      // SAFE RESPONSE PARSING
      // ==================================================

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        withdrawals?: Withdraw[];
        message?: string;
        error?: string;
      } = {
        success: false,
      };

      if (responseText.trim()) {
        try {
          data = JSON.parse(
            responseText
          ) as {
            success?: boolean;
            withdrawals?: Withdraw[];
            message?: string;
            error?: string;
          };
        } catch (parseError) {
          console.error(
            "WITHDRAW HISTORY JSON PARSE ERROR:",
            parseError
          );

          throw new Error(
            "Withdraw history API returned invalid JSON."
          );
        }
      }

      console.log(
        "WITHDRAW HISTORY RESPONSE:",
        data
      );

      // ==================================================
      // ROUTE NOT FOUND
      // ==================================================

      if (response.status === 404) {
        throw new Error(
          data.message ||
            `Withdraw history API route not found: ${historyUrl}`
        );
      }

      // ==================================================
      // HTTP ERROR
      // ==================================================

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Withdraw history API failed with status ${response.status}.`
        );
      }

      // ==================================================
      // APPLICATION ERROR
      // ==================================================

      if (!data.success) {
        throw new Error(
          data.message ||
            "Unable to load withdraw history."
        );
      }

      // ==================================================
      // UPDATE WITHDRAW HISTORY
      // ==================================================

      if (Array.isArray(data.withdrawals)) {
        setWithdrawals(data.withdrawals);
      } else {
        setWithdrawals([]);
      }
    } catch (error: unknown) {
      console.error(
        "WITHDRAW HISTORY ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Withdraw history failed.";

      setErrorMessage(message);

      // Keep existing withdrawal history
      // if the API temporarily fails.
    } finally {
      setWithdrawLoading(false);
    }
  },
  [router]
);

// ========================================================
// DEPOSIT SUMMARY
// ========================================================

const totalDeposited = useMemo(() => {
  return deposits
    .filter(
      (item) =>
        String(item.status || "").toLowerCase() ===
        "approved"
    )
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );
}, [deposits]);

const pendingDeposits = useMemo(() => {
  return deposits
    .filter(
      (item) =>
        String(item.status || "").toLowerCase() ===
        "pending"
    )
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );
}, [deposits]);

const recentDeposits = useMemo(() => {
  return [...deposits]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 10);
}, [deposits]);

// ========================================================
// DEPOSIT STATUS
// ========================================================

const getDepositStatusBadge = (
  status: string
): string => {
  switch (
    String(status || "").toLowerCase()
  ) {
    case "approved":
    case "success":
      return "bg-green-500/20 text-green-400 border border-green-500/30";

    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";

    case "rejected":
    case "failed":
    case "cancelled":
      return "bg-red-500/20 text-red-400 border border-red-500/30";

    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
};

// ========================================================
// WITHDRAW SUMMARY
// ========================================================

const totalWithdrawn = useMemo(() => {
  return withdrawals
    .filter(
      (item) =>
        String(item.status || "").toLowerCase() ===
        "approved"
    )
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );
}, [withdrawals]);

const pendingWithdrawals = useMemo(() => {
  return withdrawals
    .filter(
      (item) =>
        String(item.status || "").toLowerCase() ===
        "pending"
    )
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );
}, [withdrawals]);

const recentWithdrawals = useMemo(() => {
  return [...withdrawals]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    )
    .slice(0, 10);
}, [withdrawals]);

// ========================================================
// WITHDRAW STATUS
// ========================================================

const getWithdrawStatusBadge = (
  status: string
): string => {
  switch (
    String(status || "").toLowerCase()
  ) {
    case "approved":
    case "success":
      return "bg-green-500/20 text-green-400 border border-green-500/30";

    case "pending":
      return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";

    case "rejected":
    case "failed":
    case "cancelled":
      return "bg-red-500/20 text-red-400 border border-red-500/30";

    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
};

// ========================================================
// SEARCH / FILTER — HOOK SAFE
// IMPORTANT:
// NO useMemo HERE
// ========================================================

const historyQuery = searchHistory
  .trim()
  .toLowerCase();

const filteredDeposits = deposits.filter(
  (deposit) => {
    const matchesQuery =
      !historyQuery ||
      [
        deposit.method || "",
        deposit.status || "",
        String(deposit.amount ?? 0),
        deposit.createdAt
          ? new Date(
              deposit.createdAt
            ).toLocaleString()
          : "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(historyQuery);

    const matchesType =
      historyFilter === "all" ||
      historyFilter === "deposit";

    return (
      matchesQuery &&
      matchesType
    );
  }
);

const filteredWithdrawals =
  withdrawals.filter(
    (withdraw) => {
      const matchesQuery =
        !historyQuery ||
        [
          withdraw.method || "",
          withdraw.status || "",
          withdraw.walletAddress || "",
          String(withdraw.amount ?? 0),
          withdraw.createdAt
            ? new Date(
                withdraw.createdAt
              ).toLocaleString()
            : "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(historyQuery);

      const matchesType =
        historyFilter === "all" ||
        historyFilter === "withdraw";

      return (
        matchesQuery &&
        matchesType
      );
    }
  );

// ========================================================
// REFRESH DEPOSIT HISTORY
// ========================================================

const refreshDeposits = async () => {
  if (!username || !token) {
    setErrorMessage(
      "Authentication session is missing. Please login again."
    );
    return;
  }

  try {
    setRefreshLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    await loadDepositHistory(
      username,
      token
    );

    setSuccessMessage(
      "Deposit history refreshed."
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 2000);
  } catch (error: unknown) {
    console.error(
      "REFRESH DEPOSIT ERROR:",
      error
    );

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Unable to refresh deposit history."
    );
  } finally {
    setRefreshLoading(false);
  }
};

// ========================================================
// SUBMIT WITHDRAW REQUEST
// ========================================================

const submitWithdraw = async () => {
  // ======================================================
  // AUTH VALIDATION
  // ======================================================

  if (!token || !username) {
    setErrorMessage(
      "Authentication session is missing. Please login again."
    );
    return;
  }

  // ======================================================
  // AMOUNT VALIDATION
  // ======================================================

  const amount = Number(
    withdrawAmount
  );

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    setErrorMessage(
      "Please enter a valid withdraw amount."
    );
    return;
  }

  // ======================================================
  // ADDRESS VALIDATION
  // ======================================================

  const safeWithdrawAddress =
    withdrawAddress.trim();

  if (!safeWithdrawAddress) {
    setErrorMessage(
      "Please enter bank account or wallet address."
    );
    return;
  }

  // ======================================================
  // BALANCE VALIDATION
  // ======================================================

  const availableBalance =
    Number(pkrBalance || 0);

  if (
    !Number.isFinite(availableBalance) ||
    availableBalance <= 0
  ) {
    setErrorMessage(
      "Insufficient PKR balance."
    );
    return;
  }

  if (amount > availableBalance) {
    setErrorMessage(
      "Insufficient PKR balance."
    );
    return;
  }

  try {
    setWithdrawLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    // ====================================================
    // WITHDRAW API
    // ====================================================

    const withdrawUrl =
      `${API}/api/withdraw/create`;

    const response = await fetch(
      withdrawUrl,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify({
          username:
            username.trim().toLowerCase(),
          amount,
          method: withdrawMethod,
          walletAddress:
            safeWithdrawAddress,
        }),
      }
    );

    // ====================================================
    // AUTH ERROR
    // ====================================================

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      clearSession();

      setToken("");
      setUsername("");
      setAuthChecked(false);

      router.replace("/login");

      return;
    }

    // ====================================================
    // SAFE RESPONSE PARSING
    // ====================================================

    const responseText =
      await response.text();

    let data: {
      success?: boolean;
      message?: string;
      error?: string;
      withdrawal?: Withdraw;
    } = {
      success: false,
    };

    if (responseText.trim()) {
      try {
        data = JSON.parse(
          responseText
        ) as {
          success?: boolean;
          message?: string;
          error?: string;
          withdrawal?: Withdraw;
        };
      } catch (parseError) {
        console.error(
          "WITHDRAW JSON PARSE ERROR:",
          parseError
        );

        throw new Error(
          "Withdraw API returned invalid JSON."
        );
      }
    }

    console.log(
      "WITHDRAW RESPONSE:",
      data
    );

    // ====================================================
    // ROUTE NOT FOUND
    // ====================================================

    if (response.status === 404) {
      throw new Error(
        data.message ||
          data.error ||
          `Withdraw API route not found: ${withdrawUrl}`
      );
    }

    // ====================================================
    // HTTP ERROR
    // ====================================================

    if (!response.ok) {
      throw new Error(
        data.message ||
          data.error ||
          `Withdraw request failed with status ${response.status}.`
      );
    }

    // ====================================================
    // APPLICATION ERROR
    // ====================================================

    if (!data.success) {
      throw new Error(
        data.message ||
          "Withdraw request failed."
      );
    }

    // ====================================================
    // SUCCESS
    // ====================================================

    setSuccessMessage(
      "Withdraw request submitted successfully. Waiting for admin approval."
    );

    setWithdrawAmount("");
    setWithdrawAddress("");

    // ====================================================
    // REFRESH WALLET + WITHDRAW HISTORY
    // ====================================================

    await Promise.all([
      loadWallet(
        username,
        token
      ),

      loadWithdrawHistory(
        username,
        token
      ),
    ]);
  } catch (error: unknown) {
    console.error(
      "WITHDRAW ERROR:",
      error
    );

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Withdraw request failed."
    );
  } finally {
    setWithdrawLoading(false);
  }
};

// ========================================================
// REFRESH WITHDRAW HISTORY
// ========================================================

const refreshWithdrawHistory = async () => {
  if (!username || !token) {
    setErrorMessage(
      "Authentication session is missing. Please login again."
    );
    return;
  }

  try {
    setRefreshLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    await loadWithdrawHistory(
      username,
      token
    );

    setSuccessMessage(
      "Withdraw history refreshed."
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 2000);
  } catch (error: unknown) {
    console.error(
      "REFRESH WITHDRAW ERROR:",
      error
    );

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Unable to refresh withdraw history."
    );
  } finally {
    setRefreshLoading(false);
  }
};

// ========================================================
// REFRESH WALLET DASHBOARD
// ========================================================

const refreshDashboard = async () => {
  if (!username || !token) {
    setErrorMessage(
      "Authentication session is missing. Please login again."
    );
    return;
  }

  try {
    setRefreshLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    await Promise.all([
      loadWallet(
        username,
        token
      ),

      loadDepositHistory(
        username,
        token
      ),

      loadWithdrawHistory(
        username,
        token
      ),
    ]);

    setLastRefresh(
      new Date()
    );

    setSuccessMessage(
      "Wallet dashboard refreshed."
    );

    setTimeout(() => {
      setSuccessMessage("");
    }, 2000);
  } catch (error: unknown) {
    console.error(
      "REFRESH DASHBOARD ERROR:",
      error
    );

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "Unable to refresh wallet dashboard."
    );
  } finally {
    setRefreshLoading(false);
  }
};

// ========================================================
// INITIAL DATA LOAD
// ========================================================

useEffect(() => {
  if (!authChecked) {
    return;
  }

  if (!username || !token) {
    return;
  }

  let cancelled = false;

  const loadInitialData = async () => {
    try {
      if (cancelled) {
        return;
      }

      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await Promise.all([
        loadWallet(
          username,
          token
        ),

        loadDepositHistory(
          username,
          token
        ),

        loadWithdrawHistory(
          username,
          token
        ),
      ]);

      if (!cancelled) {
        setLastRefresh(
          new Date()
        );
      }
    } catch (error: unknown) {
      console.error(
        "INITIAL WALLET LOAD ERROR:",
        error
      );

      if (!cancelled) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load wallet."
        );
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  void loadInitialData();

  return () => {
    cancelled = true;
  };
}, [
  authChecked,
  username,
  token,
  loadWallet,
  loadDepositHistory,
  loadWithdrawHistory,
]);

// ==========================================================
// LOADING SCREEN
// ==========================================================

if (loading) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <Loader2
        className="mb-5 h-12 w-12 animate-spin text-yellow-400"
        aria-label="Loading"
      />

      <h2 className="text-xl font-semibold text-yellow-400">
        GoldTrade Enterprise Wallet
      </h2>

      <p className="mt-2 text-gray-400">
        {loadingText}
      </p>
    </div>
  );
}
// ==========================================================
// MAIN WALLET UI
// ==========================================================

return (

  <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6 lg:px-8">

    {/* ======================================================
        WALLET HEADER
    ====================================================== */}

    <section className="mb-8 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        {/* HEADER INFO */}

        <div>

          <h1 className="text-3xl font-bold text-yellow-400">
            GoldTrade Wallet
          </h1>

          <p className="mt-2 text-gray-400">
            Welcome back{" "}
            <span className="font-semibold text-white">
              {username}
            </span>
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Last Refresh : {lastRefreshLabel}
          </p>

          <div className="mt-3">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${walletStatusClass}`}
            >
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>

        </div>

        {/* HEADER ACTIONS */}

        <div className="flex flex-wrap gap-3">

          <button
            type="button"
            onClick={refreshDashboard}
            disabled={refreshLoading}
            className="flex items-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}

            Refresh Wallet
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition hover:bg-red-700"
          >
            Logout
          </button>

        </div>

      </div>

    </section>

    {/* SUCCESS MESSAGE */}

    {successMessage && (
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-green-400">

        <CheckCircle2 className="h-5 w-5 shrink-0" />

        <span>{successMessage}</span>

      </div>
    )}

    {/* ERROR MESSAGE */}

    {errorMessage && (
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">

        <AlertCircle className="h-5 w-5 shrink-0" />

        <span>{errorMessage}</span>

      </div>
    )}

    {/* ======================================================
        WALLET BALANCE CARDS
    ====================================================== */}

    <section className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">

      {/* WALLET BALANCE */}

      <div className="rounded-3xl border border-yellow-500/20 bg-zinc-950 p-5">

        <Wallet className="mb-4 h-8 w-8 text-yellow-400" />

        <p className="text-sm text-gray-400">
          Wallet Balance
        </p>

        <h2 className="mt-2 text-3xl font-bold text-yellow-400">
          PKR {formatCurrency(walletBalance)}
        </h2>

      </div>

      {/* PKR BALANCE */}

      <div className="rounded-3xl border border-green-500/20 bg-zinc-950 p-5">

        <CreditCard className="mb-4 h-8 w-8 text-green-400" />

        <p className="text-sm text-gray-400">
          PKR Balance
        </p>

        <h2 className="mt-2 text-3xl font-bold text-green-400">
          PKR {formatCurrency(pkrBalance)}
        </h2>

      </div>

      {/* USDT BALANCE */}

      <div className="rounded-3xl border border-blue-500/20 bg-zinc-950 p-5">

        <Wallet className="mb-4 h-8 w-8 text-blue-400" />

        <p className="text-sm text-gray-400">
          USDT Balance
        </p>

        <h2 className="mt-2 text-3xl font-bold text-blue-400">
          {formatCurrency(usdtBalance)} USDT
        </h2>

      </div>

      {/* GOLD BALANCE */}

      <div className="rounded-3xl border border-orange-500/20 bg-zinc-950 p-5">

        <ShieldCheck className="mb-4 h-8 w-8 text-orange-400" />

        <p className="text-sm text-gray-400">
          Gold Balance
        </p>

        <h2 className="mt-2 text-3xl font-bold text-orange-400">
          {formatCurrency(goldBalance)} Gram
        </h2>

      </div>

    </section>

    {/* ======================================================
        PORTFOLIO SUMMARY
    ====================================================== */}

    <section className="mb-10 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

        {/* PORTFOLIO VALUE */}

        <div>

          <p className="text-gray-400">
            Total Wallet Value
          </p>

          <h2 className="mt-3 text-4xl font-bold text-yellow-400">
            PKR {formatCurrency(totalWalletValue)}
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Wallet Status:{" "}
            <span className="font-semibold text-yellow-400">
              {walletHealth}
            </span>
          </p>

        </div>

        {/* WALLET STATUS */}

        <div>

          <span
            className={`rounded-full px-5 py-3 text-sm font-semibold ${walletStatusClass}`}
          >
            {isOnline
              ? "Wallet Online"
              : "Wallet Offline"}
          </span>

        </div>

      </div>

      {/* PORTFOLIO DETAILS */}

      <div className="mt-8 grid gap-4 md:grid-cols-3">

        {/* PKR WALLET */}

        <div className="rounded-2xl border border-zinc-800 bg-black p-4">

          <p className="text-sm text-gray-400">
            PKR Wallet
          </p>

          <p className="mt-2 text-2xl font-bold text-yellow-400">
            PKR {formatCurrency(walletBalance)}
          </p>

        </div>

        {/* AVAILABLE PKR */}

        <div className="rounded-2xl border border-zinc-800 bg-black p-4">

          <p className="text-sm text-gray-400">
            Available PKR
          </p>

          <p className="mt-2 text-2xl font-bold text-green-400">
            PKR {formatCurrency(pkrBalance)}
          </p>

        </div>

        {/* LAST UPDATED */}

        <div className="rounded-2xl border border-zinc-800 bg-black p-4">

          <p className="text-sm text-gray-400">
            Last Updated
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-400">
            {lastRefreshLabel}
          </p>

        </div>

      </div>

    </section>

    {/* ======================================================
        QUICK ACTIONS
    ====================================================== */}

    <section className="mb-10 grid gap-4 md:grid-cols-2">

      {/* DEPOSIT */}

      <button
        type="button"
        onClick={goDeposit}
        className="rounded-2xl bg-green-600 p-5 text-white transition hover:bg-green-700"
      >

        <ArrowDownCircle className="mx-auto mb-3 h-10 w-10" />

        <p className="font-semibold">
          Deposit PKR
        </p>

        <p className="mt-1 text-sm text-green-100">
          Add funds to your wallet
        </p>

      </button>

      {/* WITHDRAW */}

      <button
        type="button"
        onClick={goWithdraw}
        className="rounded-2xl bg-red-600 p-5 text-white transition hover:bg-red-700"
      >

        <ArrowUpCircle className="mx-auto mb-3 h-10 w-10" />

        <p className="font-semibold">
          Withdraw PKR
        </p>

        <p className="mt-1 text-sm text-red-100">
          Submit withdrawal request
        </p>

      </button>

    </section>

    {/* ======================================================
        MANUAL PKR DEPOSIT
    ====================================================== */}

    <section className="mb-10 rounded-3xl border border-green-500/20 bg-zinc-950 p-6">

      {/* DEPOSIT HEADER */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-green-400">
            Manual PKR Deposit
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Upload your payment receipt after sending funds.
          </p>

        </div>

        <Receipt className="h-8 w-8 text-green-400" />

      </div>

      <div className="grid gap-5 md:grid-cols-2">

        {/* DEPOSIT AMOUNT */}

        <div>

          <label className="mb-2 block text-sm text-gray-300">
            Deposit Amount (PKR)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={depositAmount}
            onChange={(e) =>
              setDepositAmount(e.target.value)
            }
            placeholder="Enter PKR Amount"
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-green-500"
          />

        </div>

        {/* PAYMENT METHOD */}

        <div>

          <label className="mb-2 block text-sm text-gray-300">
            Payment Method
          </label>

          <select
            value={depositMethod}
            onChange={(e) =>
              setDepositMethod(e.target.value)
            }
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-green-500"
          >

            <option value="ABA Bank">
              ABA Bank
            </option>

            <option value="Binance">
              Binance
            </option>

            <option value="Cash App">
              Cash App
            </option>

            <option value="Bank Transfer">
              Bank Transfer
            </option>

          </select>

        </div>

      </div>

      <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-black p-5">

        <h3 className="mb-3 font-semibold text-yellow-400">
          Payment Details
        </h3>

        <div className="space-y-2 text-sm text-gray-300">

          <p>
            <strong>ABA Bank:</strong>{" "}
            GoldTrade Enterprise
          </p>

          <p>
            <strong>Account Number:</strong>{" "}
            000-000-000000
          </p>

          <p>
            <strong>Binance UID:</strong>{" "}
            123456789
          </p>

          <p>
            <strong>Cash App:</strong>{" "}
            $GoldTradePKR
          </p>

        </div>

      </div>

      <div className="mt-6">

        <label className="mb-3 block text-sm text-gray-300">
          Upload Receipt
        </label>

        <input
          type="file"
          accept="image/*"
          onChange={handleReceiptSelect}
          className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white"
        />

        {/* RECEIPT SELECTED */}

        {receiptImage && (
          <div className="mt-3 rounded-xl border border-green-500/20 bg-black p-3">

            <p className="text-sm text-green-400">
              Receipt Selected
            </p>

            <p className="mt-1 break-all text-sm text-gray-300">
              {receiptImage.name}
            </p>

          </div>
        )}

        {/* RECEIPT PREVIEW */}

        {receiptPreview && (
          <div className="mt-5">

            <p className="mb-2 text-sm text-gray-400">
              Receipt Preview
            </p>

            <img
              src={receiptPreview}
              alt="Receipt Preview"
              className="max-h-80 rounded-2xl border border-green-500/20 object-contain"
            />

          </div>
        )}

      </div>

      <button
        type="button"
        onClick={submitDeposit}
        disabled={depositLoading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >

        {depositLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Uploading Deposit...
          </>
        ) : (
          <>
            <ArrowDownCircle className="h-5 w-5" />
            Submit Deposit
          </>
        )}

      </button>

    </section>    <section className="mb-10 grid gap-5 md:grid-cols-2">

      {/* APPROVED DEPOSITS */}

      <div className="rounded-2xl border border-green-500/20 bg-zinc-950 p-5">

        <p className="text-sm text-gray-400">
          Approved Deposits
        </p>

        <h3 className="mt-2 text-3xl font-bold text-green-400">
          PKR {formatCurrency(totalDeposited)}
        </h3>

      </div>

      {/* PENDING DEPOSITS */}

      <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">

        <p className="text-sm text-gray-400">
          Pending Deposits
        </p>

        <h3 className="mt-2 text-3xl font-bold text-yellow-400">
          PKR {formatCurrency(pendingDeposits)}
        </h3>

      </div>

    </section>

    {/* ======================================================
        DEPOSIT HISTORY
    ====================================================== */}

    <section className="mb-10 rounded-3xl border border-yellow-500/20 bg-zinc-950 p-6">

      {/* HISTORY HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h2 className="text-2xl font-bold text-yellow-400">
            Deposit History
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Latest deposit requests
          </p>

        </div>

        {/* REFRESH BUTTON */}

        <button
          type="button"
          onClick={refreshDeposits}
          disabled={refreshLoading}
          className="flex items-center justify-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
        >

          {refreshLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Refresh

        </button>

      </div>

      {depositLoading ? (

        // LOADING

        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
        </div>

      ) : filteredDeposits.length === 0 ? (

        // EMPTY STATE

        <div className="rounded-xl border border-zinc-800 bg-black p-6 text-center text-gray-500">
          No Deposit History Found.
        </div>

      ) : (

        // DEPOSIT LIST

        <div className="space-y-4">

          {filteredDeposits.map((deposit) => (

            <div
              key={deposit._id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-black p-5 md:flex-row md:items-center md:justify-between"
            >

              {/* DEPOSIT INFO */}

              <div>

                <h3 className="text-lg font-semibold text-white">
                  PKR {formatCurrency(deposit.amount)}
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  {deposit.method}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {new Date(
                    deposit.createdAt
                  ).toLocaleString()}
                </p>

              </div>

              {/* DEPOSIT STATUS */}

              <span
                className={`w-fit rounded-full px-4 py-2 text-xs font-semibold ${getDepositStatusBadge(
                  deposit.status
                )}`}
              >
                {deposit.status}
              </span>

            </div>

          ))}

        </div>

      )}

    </section>

    {/* ======================================================
        WITHDRAW PKR
    ====================================================== */}

    <section className="mb-10 rounded-3xl border border-red-500/20 bg-zinc-950 p-6">

      {/* WITHDRAW HEADER */}

      <div className="mb-6 flex items-center justify-between">

        <div>

          <h2 className="text-2xl font-bold text-red-400">
            Withdraw PKR
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Submit a withdrawal request. Admin approval is required.
          </p>

        </div>

        <CreditCard className="h-8 w-8 text-red-400" />

      </div>

      <div className="grid gap-5 md:grid-cols-2">

        {/* WITHDRAW AMOUNT */}

        <div>

          <label className="mb-2 block text-sm text-gray-300">
            Withdraw Amount (PKR)
          </label>

          <input
            type="number"
            min="0"
            step="0.01"
            value={withdrawAmount}
            onChange={(e) =>
              setWithdrawAmount(e.target.value)
            }
            placeholder="Enter PKR Amount"
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
          />

        </div>

        {/* WITHDRAW METHOD */}

        <div>

          <label className="mb-2 block text-sm text-gray-300">
            Withdraw Method
          </label>

          <select
            value={withdrawMethod}
            onChange={(e) =>
              setWithdrawMethod(e.target.value)
            }
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
          >

            <option value="PKR Bank">
              PKR Bank
            </option>

            <option value="ABA Bank">
              ABA Bank
            </option>

            <option value="Binance USDT">
              Binance USDT
            </option>

            <option value="Cash App">
              Cash App
            </option>

          </select>

        </div>

      </div>

      <div className="mt-6">

        <label className="mb-2 block text-sm text-gray-300">
          Bank Account / Wallet Address
        </label>

        <textarea
          rows={3}
          value={withdrawAddress}
          onChange={(e) =>
            setWithdrawAddress(e.target.value)
          }
          placeholder="Enter your Bank Account / ABA / Binance Wallet Address"
          className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
        />

      </div>

      <div className="mt-6 rounded-2xl border border-green-500/20 bg-black p-5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm text-gray-400">
              Available PKR Balance
            </p>

            <h3 className="mt-2 text-3xl font-bold text-green-400">
              PKR {formatCurrency(pkrBalance)}
            </h3>

          </div>

          <Landmark className="h-10 w-10 text-green-400" />

        </div>

      </div>

      <button
        type="button"
        onClick={submitWithdraw}
        disabled={withdrawLoading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >

        {withdrawLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Sending Withdraw Request...
          </>
        ) : (
          <>
            <ArrowUpCircle className="h-5 w-5" />
            Submit Withdraw Request
          </>
        )}

      </button>

    </section>
    {/* ======================================================
        WITHDRAW SUMMARY
    ====================================================== */}

    <section className="mb-10 grid gap-5 md:grid-cols-2">

      {/* APPROVED WITHDRAWALS */}

      <div className="rounded-2xl border border-red-500/20 bg-zinc-950 p-5">

        <p className="text-sm text-gray-400">
          Approved Withdrawals
        </p>

        <h3 className="mt-2 text-3xl font-bold text-red-400">
          PKR {formatCurrency(totalWithdrawn)}
        </h3>

      </div>

      {/* PENDING WITHDRAWALS */}

      <div className="rounded-2xl border border-yellow-500/20 bg-zinc-950 p-5">

        <p className="text-sm text-gray-400">
          Pending Withdrawals
        </p>

        <h3 className="mt-2 text-3xl font-bold text-yellow-400">
          PKR {formatCurrency(pendingWithdrawals)}
        </h3>

      </div>

    </section>

    {/* ======================================================
        WITHDRAW HISTORY
    ====================================================== */}

    <section className="mb-10 rounded-3xl border border-red-500/20 bg-zinc-950 p-6">

      {/* HISTORY HEADER */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h2 className="text-2xl font-bold text-red-400">
            Withdraw History
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Latest withdrawal requests.
          </p>

        </div>

        {/* REFRESH BUTTON */}

        <button
          type="button"
          onClick={refreshWithdrawHistory}
          disabled={refreshLoading}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >

          {refreshLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}

          Refresh

        </button>

      </div>

      {/* ====================================================
          HISTORY CONTENT
      ==================================================== */}

      {withdrawLoading ? (

        // LOADING

        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-red-400" />
        </div>

      ) : filteredWithdrawals.length === 0 ? (

        // EMPTY STATE

        <div className="rounded-xl border border-zinc-800 bg-black p-6 text-center text-gray-500">
          No Withdraw History Found.
        </div>

      ) : (

        // WITHDRAW LIST

        <div className="space-y-4">

          {filteredWithdrawals.map((withdraw) => (

            <div
              key={withdraw._id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-black p-5 md:flex-row md:items-center md:justify-between"
            >

              {/* WITHDRAW INFO */}

              <div>

                <h3 className="text-lg font-semibold text-white">
                  PKR {formatCurrency(withdraw.amount)}
                </h3>

                <p className="mt-1 text-sm text-gray-400">
                  {withdraw.method}
                </p>

                <p className="mt-1 break-all text-xs text-gray-500">
                  {withdraw.walletAddress}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {new Date(
                    withdraw.createdAt
                  ).toLocaleString()}
                </p>

              </div>

              {/* WITHDRAW STATUS */}

              <span
                className={`w-fit rounded-full px-4 py-2 text-xs font-semibold ${getWithdrawStatusBadge(
                  withdraw.status
                )}`}
              >
                {withdraw.status}
              </span>

            </div>

          ))}

        </div>

      )}

    </section>

    {/* ======================================================
        WALLET FOOTER
    ====================================================== */}

    <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">

      <div className="flex flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">

        <div>

          <p className="text-sm font-semibold text-gray-300">
            GoldTrade Enterprise Wallet
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Secure wallet dashboard for deposits and withdrawals.
          </p>

        </div>

        <div
          className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${walletStatusClass}`}
        >
          {walletHealth}
        </div>

      </div>

    </section>

  </main>
);
}