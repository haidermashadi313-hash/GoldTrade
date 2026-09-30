"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Wallet,
  DollarSign,
  Save,
  RefreshCw,
  Shield,
  TrendingUp,
  TrendingDown,
  Settings,
  Search,
  CheckCircle,
  XCircle,
  Activity,
  Coins,
  ArrowUpDown,
} from "lucide-react";

// =====================================================
// API URL
// =====================================================

const getApiUrl = (): string => {
  const configuredAPI =
    process.env.NEXT_PUBLIC_API_URL?.trim() || "";

  // Local development
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0"
    ) {
      return "http://localhost:5000";
    }

    // Production / Vercel
    return (
      configuredAPI ||
      "https://goldtrade-2.onrender.com"
    ).replace(/\/+$/, "");
  }

  return (
    configuredAPI ||
    "https://goldtrade-2.onrender.com"
  ).replace(/\/+$/, "");
};

const API = getApiUrl();

// =====================================================
// TYPES
// =====================================================

interface UsdtSettings {
  _id?: string;

  buyPrice: number;
  sellPrice: number;

  usdtPriceUSD: number;
  usdToPkr: number;

  network: "TRC20" | "BEP20" | "ERC20";

  marketStatus: "OPEN" | "CLOSED";
  tradingEnabled: boolean;

  minimumBuy: number;
  minimumSell: number;

  maximumBuy: number;
  maximumSell: number;

  walletAddress: string;

  updatedAt?: string;
}

interface UsdtStatistics {
  currentBuyPrice: number;
  currentSellPrice: number;

  spread: number;

  tradingEnabled: boolean;
  marketStatus: "OPEN" | "CLOSED";
}

// =====================================================
// COMPONENT
// =====================================================

export default function AdminUsdtPage() {
  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState<string>("");
  const [adminName, setAdminName] =
    useState<string>("Administrator");

  // ===================================================
  // SETTINGS
  // ===================================================

  const [settings, setSettings] =
    useState<UsdtSettings>({
      buyPrice: 0,
      sellPrice: 0,

      usdtPriceUSD: 1,
      usdToPkr: 0,

      network: "TRC20",

      marketStatus: "OPEN",
      tradingEnabled: true,

      minimumBuy: 10,
      minimumSell: 10,

      maximumBuy: 100000,
      maximumSell: 100000,

      walletAddress: "",

      updatedAt: undefined,
    });

  // ===================================================
  // STATISTICS
  // ===================================================

  const [statistics, setStatistics] =
    useState<UsdtStatistics>({
      currentBuyPrice: 0,
      currentSellPrice: 0,
      spread: 0,
      tradingEnabled: true,
      marketStatus: "OPEN",
    });

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] =
    useState<boolean>(true);

  const [refreshing, setRefreshing] =
    useState<boolean>(false);

  const [saving, setSaving] =
    useState<boolean>(false);

  const [message, setMessage] =
    useState<string>("");

  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  const [error, setError] =
    useState<string>("");

  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] =
    useState<string>("");

  // ===================================================
  // TOKEN LOAD
  // ===================================================

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedToken =
      localStorage.getItem("token")?.trim() || "";

    if (!savedToken) {
      window.location.replace("/admin/login");
      return;
    }

    setToken(savedToken);
  }, []);

  // ===================================================
  // REQUEST HEADERS
  // ===================================================

  const adminHeaders = useMemo(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }, [token]);

  // ===================================================
  // FORMATTERS
  // ===================================================

  const formatMoney = (
    value: number | string | null | undefined
  ): string => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return "0.00";
    }

    return numericValue.toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatUsdt = (
    value: number | string | null | undefined
  ): string => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return "0.00";
    }

    return numericValue.toFixed(2);
  };

  const formatDate = (
    date?: string | null
  ): string => {
    if (!date) {
      return "--";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "--";
    }

    return parsedDate.toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // ===================================================
  // UPDATE FIELD
  // ===================================================

  const updateField = (
    field: keyof UsdtSettings,
    value: string | number | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear old error when user changes a field
    if (error) {
      setError("");
    }

    // Clear old success/error message
    if (message) {
      setMessage("");
    }
  };

  // ===================================================
  // SAFE NUMBER
  // ===================================================

  const toNumber = (
    value: unknown,
    fallback = 0
  ): number => {
    const numericValue = Number(value);

    return Number.isFinite(numericValue)
      ? numericValue
      : fallback;
  };

  // ===================================================
  // SAFE STRING
  // ===================================================

  const toSafeString = (
    value: unknown,
    fallback = ""
  ): string => {
    if (
      value === null ||
      value === undefined
    ) {
      return fallback;
    }

    return String(value);
  };

  // ===================================================
  // MESSAGE HELPER
  // ===================================================

  const showMessage = (
    text: string,
    type: "success" | "error" = "success"
  ) => {
    setMessage(text);
    setMessageType(type);
  };

  // ===================================================
  // CLEAR MESSAGE
  // ===================================================

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = window.setTimeout(() => {
      setMessage("");
    }, 5000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  // ===================================================
  // API ERROR HANDLER
  // ===================================================

  const handleUnauthorized = (
    status: number,
    apiMessage?: string
  ): boolean => {
    if (
      status === 401 ||
      status === 403
    ) {
      setError(
        apiMessage ||
          "Administrator authentication required."
      );

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.setTimeout(() => {
          window.location.replace("/admin/login");
        }, 700);
      }

      return true;
    }

    return false;
  };
// ===================================================
// LIVE SPREAD
// ===================================================

const liveSpread = useMemo(() => {
  const buy = Number(settings.buyPrice);
  const sell = Number(settings.sellPrice);

  if (!Number.isFinite(buy) || !Number.isFinite(sell)) {
    return 0;
  }

  return Math.max(0, buy - sell);
}, [settings.buyPrice, settings.sellPrice]);

// ===================================================
// SEARCH FILTERS
// ===================================================

const keyword = search.trim().toLowerCase();

const showPriceSection =
  keyword === "" ||
  "buy sell usdt price usd pkr spread"
    .includes(keyword);

const showLimitSection =
  keyword === "" ||
  "minimum maximum limit trading"
    .includes(keyword);

const showWalletSection =
  keyword === "" ||
  "wallet address trc20 bep20 erc20 network"
    .includes(keyword);

const showMarketSection =
  keyword === "" ||
  "market open closed trading enable status"
    .includes(keyword);

// ===================================================
// LOAD USDT SETTINGS
// ===================================================

const loadUsdtSettings = async (
  isRefresh = false
): Promise<void> => {
  if (!token) {
    setLoading(false);
    return;
  }

  try {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    // =================================================
    // FETCH BOTH ENDPOINTS
    // =================================================

    const [settingsRes, dashboardRes] =
      await Promise.all([
        fetch(`${API}/api/admin/usdt/settings`, {
          method: "GET",
          headers: adminHeaders,
          cache: "no-store",
        }),

        fetch(`${API}/api/admin/usdt/dashboard`, {
          method: "GET",
          headers: adminHeaders,
          cache: "no-store",
        }),
      ]);

    // =================================================
    // SAFE JSON PARSING
    // =================================================

    const settingsData =
      await settingsRes.json().catch(() => null);

    const dashboardData =
      await dashboardRes.json().catch(() => null);

    console.log(
      "USDT SETTINGS RESPONSE:",
      settingsData
    );

    console.log(
      "USDT DASHBOARD RESPONSE:",
      dashboardData
    );

    // =================================================
    // AUTHORIZATION CHECK
    // =================================================

    if (
      handleUnauthorized(
        settingsRes.status,
        settingsData?.message
      )
    ) {
      return;
    }

    if (
      dashboardRes.status === 401 ||
      dashboardRes.status === 403
    ) {
      handleUnauthorized(
        dashboardRes.status,
        dashboardData?.message
      );
      return;
    }

    // =================================================
    // NORMALIZE SETTINGS
    // =================================================

    const serverSettings =
      settingsData?.settings ||
      settingsData?.data?.settings ||
      settingsData?.data ||
      null;

    // =================================================
    // LOAD MAIN SETTINGS
    // =================================================

    if (
      settingsRes.ok &&
      settingsData?.success &&
      serverSettings
    ) {
      const buyPrice = toNumber(
        serverSettings.buyPrice,
        0
      );

      const sellPrice = toNumber(
        serverSettings.sellPrice,
        0
      );

      const usdtPriceUSD = toNumber(
        serverSettings.usdtPriceUSD,
        1
      );

      const usdToPkr = toNumber(
        serverSettings.usdToPkr,
        0
      );

      const minimumBuy = toNumber(
        serverSettings.minimumBuy,
        10
      );

      const minimumSell = toNumber(
        serverSettings.minimumSell,
        10
      );

      const maximumBuy = toNumber(
        serverSettings.maximumBuy,
        100000
      );

      const maximumSell = toNumber(
        serverSettings.maximumSell,
        100000
      );

      const network =
        serverSettings.network === "BEP20" ||
        serverSettings.network === "ERC20" ||
        serverSettings.network === "TRC20"
          ? serverSettings.network
          : "TRC20";

      const marketStatus =
        serverSettings.marketStatus === "CLOSED"
          ? "CLOSED"
          : "OPEN";

      const tradingEnabled =
        serverSettings.tradingEnabled !== false;

      const walletAddress =
        toSafeString(
          serverSettings.walletAddress,
          ""
        );

      setSettings({
        _id: serverSettings._id,

        buyPrice,
        sellPrice,

        usdtPriceUSD,
        usdToPkr,

        network,

        marketStatus,
        tradingEnabled,

        minimumBuy,
        minimumSell,

        maximumBuy,
        maximumSell,

        walletAddress,

        updatedAt:
          serverSettings.updatedAt ||
          serverSettings.updated_at ||
          undefined,
      });

      // =================================================
      // UPDATE STATISTICS FROM SETTINGS
      // =================================================

      setStatistics({
        currentBuyPrice: buyPrice,
        currentSellPrice: sellPrice,

        spread: Math.max(
          0,
          buyPrice - sellPrice
        ),

        marketStatus,
        tradingEnabled,
      });

      setError("");
    } else {
      const settingsError =
        settingsData?.message ||
        "Unable to load USDT settings.";

      setError(settingsError);
    }

    // =================================================
    // DASHBOARD / STATISTICS
    // =================================================

    const dashboard =
      dashboardData?.dashboard ||
      dashboardData?.data?.dashboard ||
      dashboardData?.settings ||
      dashboardData?.data ||
      null;

    if (
      dashboardRes.ok &&
      dashboardData?.success &&
      dashboard
    ) {
      const dashboardBuyPrice =
        toNumber(
          dashboard.buyPrice,
          toNumber(
            serverSettings?.buyPrice,
            0
          )
        );

      const dashboardSellPrice =
        toNumber(
          dashboard.sellPrice,
          toNumber(
            serverSettings?.sellPrice,
            0
          )
        );

      const calculatedSpread = Math.max(
        0,
        dashboardBuyPrice -
          dashboardSellPrice
      );

      const dashboardSpread =
        Number.isFinite(
          Number(dashboard.spread)
        )
          ? Number(dashboard.spread)
          : calculatedSpread;

      const dashboardMarketStatus =
        dashboard.marketStatus === "CLOSED"
          ? "CLOSED"
          : dashboard.marketStatus === "OPEN"
          ? "OPEN"
          : serverSettings?.marketStatus ===
            "CLOSED"
          ? "CLOSED"
          : "OPEN";

      const dashboardTradingEnabled =
        dashboard.tradingEnabled !== undefined
          ? Boolean(
              dashboard.tradingEnabled
            )
          : serverSettings?.tradingEnabled !==
            false;

      setStatistics({
        currentBuyPrice:
          dashboardBuyPrice,

        currentSellPrice:
          dashboardSellPrice,

        spread: Math.max(
          0,
          dashboardSpread
        ),

        marketStatus:
          dashboardMarketStatus,

        tradingEnabled:
          dashboardTradingEnabled,
      });
    }

    // =================================================
    // DASHBOARD FAILED BUT SETTINGS WORKED
    // =================================================

    if (
      !dashboardRes.ok &&
      settingsRes.ok &&
      serverSettings
    ) {
      console.warn(
        "USDT dashboard endpoint unavailable:",
        dashboardData?.message ||
          `HTTP ${dashboardRes.status}`
      );

      // Main settings are already loaded,
      // therefore don't replace the whole page
      // with an error.
    }
  } catch (err: unknown) {
    console.error(
      "LOAD USDT SETTINGS ERROR:",
      err
    );

    const errorMessage =
      err instanceof Error
        ? err.message
        : "Unable to load USDT settings.";

    setError(errorMessage);

    showMessage(
      errorMessage,
      "error"
    );
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};

// ===================================================
// REFRESH USDT SETTINGS
// ===================================================

const refreshUsdtSettings = async () => {
  if (!token) {
    showMessage(
      "Authentication token not available.",
      "error"
    );
    return;
  }

  await loadUsdtSettings(true);
};

// ===================================================
// ADMIN AUTH CHECK
// ===================================================

const checkAdminAuth = async (): Promise<boolean> => {
  if (!token) {
    return false;
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

    const data = await response
      .json()
      .catch(() => null);

    console.log("ADMIN AUTH:", data);

    // ===============================================
    // UNAUTHORIZED
    // ===============================================

    if (
      response.status === 401 ||
      response.status === 403 ||
      !response.ok ||
      !data?.success
    ) {
      const authMessage =
        data?.message ||
        "Administrator authentication required.";

      setError(authMessage);

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");

        window.setTimeout(() => {
          window.location.replace("/admin/login");
        }, 500);
      }

      return false;
    }

    // ===============================================
    // ROLE CHECK
    // ===============================================

    const role =
      data?.user?.role ||
      data?.admin?.role ||
      "";

    if (
      role &&
      String(role).toLowerCase() !== "admin"
    ) {
      setError(
        "Administrator access is required."
      );

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");

        window.setTimeout(() => {
          window.location.replace("/admin/login");
        }, 500);
      }

      return false;
    }

    // ===============================================
    // ADMIN NAME
    // ===============================================

    setAdminName(
      data?.user?.username ||
        data?.user?.name ||
        data?.admin?.username ||
        data?.admin?.name ||
        "Administrator"
    );

    return true;
  } catch (error: unknown) {
    console.error(
      "ADMIN AUTH ERROR:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "Unable to verify administrator authentication."
    );

    return false;
  }
};

// ===================================================
// INITIAL LOAD
// ===================================================

useEffect(() => {
  if (!token) {
    return;
  }

  let cancelled = false;

  const initializePage = async () => {
    try {
      setLoading(true);
      setError("");

      const authenticated =
        await checkAdminAuth();

      if (
        !authenticated ||
        cancelled
      ) {
        return;
      }

      await loadUsdtSettings(false);
    } catch (error: unknown) {
      if (cancelled) {
        return;
      }

      console.error(
        "USDT INITIAL LOAD ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to initialize USDT settings."
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  initializePage();

  return () => {
    cancelled = true;
  };
}, [token]);

// ===================================================
// AUTO CLEAR MESSAGE
// ===================================================

useEffect(() => {
  if (!message) {
    return;
  }

  const timer = window.setTimeout(() => {
    setMessage("");
  }, 5000);

  return () => {
    window.clearTimeout(timer);
  };
}, [message]);

// ===================================================
// TOGGLE MARKET STATUS
// ===================================================

const toggleMarketStatus = () => {
  setSettings((prev) => {
    const nextStatus =
      prev.marketStatus === "OPEN"
        ? "CLOSED"
        : "OPEN";

    return {
      ...prev,
      marketStatus: nextStatus,
    };
  });

  setMessage("");
  setError("");
};

// ===================================================
// TOGGLE USDT TRADING
// ===================================================

const toggleTrading = () => {
  setSettings((prev) => ({
    ...prev,
    tradingEnabled:
      !prev.tradingEnabled,
  }));

  setMessage("");
  setError("");
};

// ===================================================
// AUTO CALCULATE SELL PRICE
// Keeps minimum spread of 0.50 PKR
// ===================================================

useEffect(() => {
  const buyPrice = Number(
    settings.buyPrice
  );

  const sellPrice = Number(
    settings.sellPrice
  );

  if (
    !Number.isFinite(buyPrice) ||
    buyPrice <= 0
  ) {
    return;
  }

  const minimumSpread = 0.5;

  const currentSpread =
    buyPrice - sellPrice;

  if (
    !Number.isFinite(sellPrice) ||
    sellPrice >= buyPrice ||
    currentSpread < minimumSpread
  ) {
    const calculatedSellPrice =
      Math.max(
        0,
        buyPrice - minimumSpread
      );

    setSettings((prev) => {
      // Prevent unnecessary state updates
      if (
        Number(prev.sellPrice) ===
        calculatedSellPrice
      ) {
        return prev;
      }

      return {
        ...prev,
        sellPrice:
          calculatedSellPrice,
      };
    });
  }
}, [settings.buyPrice, settings.sellPrice]);

// ===================================================
// SAVE USDT SETTINGS
// PUT /api/admin/usdt/settings
// ===================================================

const saveUsdtSettings = async () => {
  if (!token) {
    showMessage(
      "Authentication token not available.",
      "error"
    );
    return;
  }

  try {
    setSaving(true);
    setError("");
    setMessage("");

    // ===============================================
    // NORMALIZE VALUES
    // ===============================================

    const buyPrice = toNumber(
      settings.buyPrice,
      0
    );

    const sellPrice = toNumber(
      settings.sellPrice,
      0
    );

    const usdtPriceUSD = toNumber(
      settings.usdtPriceUSD,
      1
    );

    const usdToPkr = toNumber(
      settings.usdToPkr,
      0
    );

    const minimumBuy = toNumber(
      settings.minimumBuy,
      0
    );

    const minimumSell = toNumber(
      settings.minimumSell,
      0
    );

    const maximumBuy = toNumber(
      settings.maximumBuy,
      0
    );

    const maximumSell = toNumber(
      settings.maximumSell,
      0
    );

    const walletAddress =
      settings.walletAddress
        ?.trim() || "";

    // ===============================================
    // VALIDATION
    // ===============================================

    if (
      !Number.isFinite(buyPrice) ||
      buyPrice <= 0
    ) {
      throw new Error(
        "USDT buy price must be greater than 0."
      );
    }

    if (
      !Number.isFinite(sellPrice) ||
      sellPrice <= 0
    ) {
      throw new Error(
        "USDT sell price must be greater than 0."
      );
    }

    const spread =
      buyPrice - sellPrice;

    if (spread < 0.5) {
      throw new Error(
        "Minimum USDT spread must be 0.50 PKR."
      );
    }

    if (
      !Number.isFinite(usdtPriceUSD) ||
      usdtPriceUSD <= 0
    ) {
      throw new Error(
        "USDT USD price must be greater than 0."
      );
    }

    if (
      !Number.isFinite(usdToPkr) ||
      usdToPkr <= 0
    ) {
      throw new Error(
        "USD to PKR rate must be greater than 0."
      );
    }

    if (
      !Number.isFinite(minimumBuy) ||
      minimumBuy <= 0
    ) {
      throw new Error(
        "Minimum buy amount must be greater than 0."
      );
    }

    if (
      !Number.isFinite(minimumSell) ||
      minimumSell <= 0
    ) {
      throw new Error(
        "Minimum sell amount must be greater than 0."
      );
    }

    if (
      !Number.isFinite(maximumBuy) ||
      maximumBuy <= 0
    ) {
      throw new Error(
        "Maximum buy amount must be greater than 0."
      );
    }

    if (
      !Number.isFinite(maximumSell) ||
      maximumSell <= 0
    ) {
      throw new Error(
        "Maximum sell amount must be greater than 0."
      );
    }

    if (maximumBuy < minimumBuy) {
      throw new Error(
        "Maximum buy amount cannot be less than minimum buy amount."
      );
    }

    if (maximumSell < minimumSell) {
      throw new Error(
        "Maximum sell amount cannot be less than minimum sell amount."
      );
    }

    if (
      !["TRC20", "BEP20", "ERC20"].includes(
        settings.network
      )
    ) {
      throw new Error(
        "Invalid USDT network selected."
      );
    }

    // ===============================================
    // PAYLOAD
    // ===============================================

    const payload = {
      buyPrice,
      sellPrice,

      usdtPriceUSD,
      usdToPkr,

      network: settings.network,

      marketStatus:
        settings.marketStatus,

      tradingEnabled:
        Boolean(settings.tradingEnabled),

      minimumBuy,
      minimumSell,

      maximumBuy,
      maximumSell,

      walletAddress,
    };

    console.log(
      "SAVE USDT PAYLOAD:",
      payload
    );

    // ===============================================
    // API REQUEST
    // ===============================================

    const response = await fetch(
      `${API}/api/admin/usdt/settings`,
      {
        method: "PUT",
        headers: adminHeaders,
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const data = await response
      .json()
      .catch(() => null);

    console.log(
      "SAVE USDT SETTINGS:",
      data
    );

    // ===============================================
    // AUTH ERROR
    // ===============================================

    if (
      handleUnauthorized(
        response.status,
        data?.message
      )
    ) {
      return;
    }

    // ===============================================
    // API ERROR
    // ===============================================

    if (
      !response.ok ||
      !data?.success
    ) {
      throw new Error(
        data?.message ||
          `Failed to save USDT settings. HTTP ${response.status}`
      );
    }

    // ===============================================
    // SERVER SETTINGS
    // ===============================================

    const savedSettings =
      data?.settings ||
      data?.data?.settings ||
      data?.data ||
      null;

    if (savedSettings) {
      setSettings((prev) => ({
        ...prev,

        _id:
          savedSettings._id ||
          prev._id,

        buyPrice: toNumber(
          savedSettings.buyPrice,
          buyPrice
        ),

        sellPrice: toNumber(
          savedSettings.sellPrice,
          sellPrice
        ),

        usdtPriceUSD: toNumber(
          savedSettings.usdtPriceUSD,
          usdtPriceUSD
        ),

        usdToPkr: toNumber(
          savedSettings.usdToPkr,
          usdToPkr
        ),

        network:
          savedSettings.network ||
          settings.network,

        marketStatus:
          savedSettings.marketStatus ||
          settings.marketStatus,

        tradingEnabled:
          savedSettings.tradingEnabled ??
          settings.tradingEnabled,

        minimumBuy: toNumber(
          savedSettings.minimumBuy,
          minimumBuy
        ),

        minimumSell: toNumber(
          savedSettings.minimumSell,
          minimumSell
        ),

        maximumBuy: toNumber(
          savedSettings.maximumBuy,
          maximumBuy
        ),

        maximumSell: toNumber(
          savedSettings.maximumSell,
          maximumSell
        ),

        walletAddress:
          savedSettings.walletAddress ??
          walletAddress,

        updatedAt:
          savedSettings.updatedAt ||
          new Date().toISOString(),
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        buyPrice,
        sellPrice,
        usdtPriceUSD,
        usdToPkr,
        minimumBuy,
        minimumSell,
        maximumBuy,
        maximumSell,
        walletAddress,
        updatedAt:
          new Date().toISOString(),
      }));
    }

    // ===============================================
    // UPDATE LIVE STATISTICS
    // ===============================================

    setStatistics({
      currentBuyPrice: buyPrice,
      currentSellPrice: sellPrice,

      spread: Math.max(
        0,
        spread
      ),

      marketStatus:
        settings.marketStatus,

      tradingEnabled:
        Boolean(settings.tradingEnabled),
    });

    // ===============================================
    // SUCCESS
    // ===============================================

    showMessage(
      "USDT settings updated successfully.",
      "success"
    );

    // ===============================================
    // RELOAD FROM SERVER
    // ===============================================

    await loadUsdtSettings(false);
  } catch (error: unknown) {
    console.error(
      "SAVE USDT SETTINGS ERROR:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to save USDT settings.";

    setError(errorMessage);

    showMessage(
      errorMessage,
      "error"
    );
  } finally {
    setSaving(false);
  }
};

// ===================================================
// RESET USDT SETTINGS
// ===================================================

const resetUsdtSettings = async () => {
  if (!token) {
    showMessage(
      "Authentication token not available.",
      "error"
    );
    return;
  }

  try {
    setError("");

    await loadUsdtSettings(false);

    showMessage(
      "USDT settings restored from server.",
      "success"
    );
  } catch (error: unknown) {
    console.error(
      "RESET USDT SETTINGS ERROR:",
      error
    );

    showMessage(
      error instanceof Error
        ? error.message
        : "Unable to restore USDT settings.",
      "error"
    );
  }
};

// ===================================================
// LAST UPDATED LABEL
// ===================================================

const lastUpdatedLabel = useMemo(() => {
  if (!settings.updatedAt) {
    return "Never Updated";
  }

  return formatDate(
    settings.updatedAt
  );
}, [settings.updatedAt]);

// =====================================================
// PAGE UI START
// =====================================================

return (
  <div className="min-h-screen bg-[#0B1120] text-white p-4 sm:p-6">

    {/* ========================================== */}
    {/* HEADER */}
    {/* ========================================== */}

    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-cyan-400 break-words">
          GoldTrade V18 • Enterprise USDT Manager
        </h1>

        <p className="text-gray-400 mt-2 text-sm sm:text-base">
          Manage live USDT prices, wallet network, trading status and limits.
        </p>

        <p className="text-gray-500 text-sm mt-1">
          Logged in as{" "}
          <span className="text-green-400 font-semibold">
            {adminName || "Administrator"}
          </span>
        </p>
      </div>

      <div className="flex gap-3 flex-wrap">

        {/* REFRESH */}

        <button
          type="button"
          onClick={refreshUsdtSettings}
          disabled={refreshing || saving}
          className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold px-5 py-3 rounded-xl transition"
        >
          <RefreshCw
            size={18}
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

        {/* SAVE */}

        <button
          type="button"
          onClick={saveUsdtSettings}
          disabled={saving || loading}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-5 py-3 rounded-xl transition"
        >
          <Save size={18} />

          {saving
            ? "Saving..."
            : "Save Settings"}
        </button>

      </div>
    </div>

    {/* ========================================== */}
    {/* SUCCESS / ERROR MESSAGE */}
    {/* ========================================== */}

    {message && (
      <div
        role="alert"
        className={`mb-6 rounded-xl px-4 py-3 border ${
          messageType === "success"
            ? "bg-green-600/20 border-green-500 text-green-300"
            : "bg-red-600/20 border-red-500 text-red-300"
        }`}
      >
        {message}
      </div>
    )}

    {error && (
      <div
        role="alert"
        className="mb-6 rounded-xl px-4 py-3 border border-red-600 bg-red-600/10 text-red-300"
      >
        {error}
      </div>
    )}

    {/* ========================================== */}
    {/* LIVE USDT PRICE CARDS */}
    {/* ========================================== */}

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

      {/* BUY PRICE */}

      <div className="rounded-2xl bg-[#111827] border border-green-600/30 p-5">

        <div className="flex justify-between items-center mb-3">
          <TrendingUp
            className="text-green-400"
            size={28}
          />

          <span className="text-xs font-semibold text-green-400">
            BUY PRICE
          </span>
        </div>

        <p className="text-gray-400 text-sm">
          Current Buy USDT Price
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-green-400 mt-2">
          PKR{" "}
          {formatMoney(
            statistics.currentBuyPrice
          )}
        </h2>

      </div>

      {/* SELL PRICE */}

      <div className="rounded-2xl bg-[#111827] border border-red-600/30 p-5">

        <div className="flex justify-between items-center mb-3">
          <TrendingDown
            className="text-red-400"
            size={28}
          />

          <span className="text-xs font-semibold text-red-400">
            SELL PRICE
          </span>
        </div>

        <p className="text-gray-400 text-sm">
          Current Sell USDT Price
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-red-400 mt-2">
          PKR{" "}
          {formatMoney(
            statistics.currentSellPrice
          )}
        </h2>

      </div>

      {/* SPREAD */}

      <div className="rounded-2xl bg-[#111827] border border-blue-600/30 p-5">

        <div className="flex justify-between items-center mb-3">
          <ArrowUpDown
            className="text-blue-400"
            size={28}
          />

          <span className="text-xs font-semibold text-blue-400">
            SPREAD
          </span>
        </div>

        <p className="text-gray-400 text-sm">
          Buy / Sell Difference
        </p>

        <h2 className="text-2xl sm:text-3xl font-bold text-blue-400 mt-2">
          PKR{" "}
          {formatMoney(liveSpread)}
        </h2>

      </div>

      {/* MARKET */}

      <div className="rounded-2xl bg-[#111827] border border-purple-600/30 p-5">

        <div className="flex justify-between items-center mb-3">
          <Activity
            className="text-purple-400"
            size={28}
          />

          <span className="text-xs font-semibold text-purple-400">
            MARKET
          </span>
        </div>

        <p className="text-gray-400 text-sm">
          USDT Market Status
        </p>

        <h2
          className={`text-xl sm:text-2xl font-bold mt-2 ${
            settings.marketStatus === "OPEN"
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {settings.marketStatus}
        </h2>

      </div>

    </div>

    {/* ========================================== */}
    {/* USD / PKR / NETWORK */}
    {/* ========================================== */}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

      {/* USDT USD */}

      <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-5">

        <div className="flex justify-between items-center mb-2">
          <DollarSign
            className="text-cyan-400"
            size={24}
          />

          <span className="text-cyan-400 text-xs font-semibold">
            USDT USD
          </span>
        </div>

        <h3 className="text-2xl font-bold text-cyan-400">
          $
          {formatUsdt(
            settings.usdtPriceUSD
          )}
        </h3>

        <p className="text-gray-400 text-sm mt-2">
          Current USDT Value
        </p>

      </div>

      {/* USD TO PKR */}

      <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-5">

        <div className="flex justify-between items-center mb-2">
          <Coins
            className="text-green-400"
            size={24}
          />

          <span className="text-green-400 text-xs font-semibold">
            USD → PKR
          </span>
        </div>

        <h3 className="text-2xl font-bold text-green-400">
          {formatMoney(
            settings.usdToPkr
          )}
        </h3>

        <p className="text-gray-400 text-sm mt-2">
          Exchange Rate
        </p>

      </div>

      {/* NETWORK */}

      <div className="rounded-2xl bg-[#111827] border border-orange-600/20 p-5">

        <div className="flex justify-between items-center mb-2">
          <Wallet
            className="text-orange-400"
            size={24}
          />

          <span className="text-orange-400 text-xs font-semibold">
            NETWORK
          </span>
        </div>

        <h3 className="text-2xl font-bold text-orange-400">
          {settings.network}
        </h3>

        <p className="text-gray-400 text-sm mt-2">
          Active Wallet Network
        </p>

      </div>

    </div>

    {/* ========================================== */}
    {/* SEARCH */}
    {/* ========================================== */}

    <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">

      <div className="relative">

        <Search
          size={20}
          className="absolute left-4 top-3.5 text-gray-500"
        />

        <input
          type="search"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search USDT Price, Network, Wallet, Market..."
          className="w-full bg-[#1F2937] border border-gray-600 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-cyan-500 transition"
        />

        {search.trim() && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-2.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm"
          >
            Clear
          </button>
        )}

      </div>

    </div>

    {/* ========================================== */}
    {/* MARKET CONTROL PANEL */}
    {/* ========================================== */}

    <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

      <div className="flex items-center gap-3 mb-5">
        <Activity
          className="text-cyan-400"
          size={24}
        />

        <h2 className="text-xl font-bold text-cyan-400">
          USDT Market Controls
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* MARKET STATUS */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-[#1F2937] p-5 border border-purple-500/20">

          <div>
            <p className="font-semibold text-white">
              USDT Market Status
            </p>

            <p className="text-gray-400 text-sm mt-1">
              Open or close USDT market.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleMarketStatus}
            disabled={saving || loading}
            className={`px-5 py-2.5 rounded-full font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${
              settings.marketStatus === "OPEN"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            {settings.marketStatus}
          </button>

        </div>

        {/* TRADING */}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl bg-[#1F2937] p-5 border border-green-500/20">

          <div>
            <p className="font-semibold text-white">
              USDT Trading
            </p>

            <p className="text-gray-400 text-sm mt-1">
              Enable or disable USDT Buy/Sell.
            </p>
          </div>

          <button
            type="button"
            onClick={toggleTrading}
            disabled={saving || loading}
            className={`px-5 py-2.5 rounded-full font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed ${
              settings.tradingEnabled
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-600 hover:bg-gray-500 text-gray-300"
            }`}
          >
            {settings.tradingEnabled
              ? "ON"
              : "OFF"}
          </button>

        </div>

      </div>

    </div>

    {/* ========================================== */}
    {/* USDT SETTINGS FORMS START */}
    {/* ========================================== */}

    <div className="space-y-8">
            {/* ========================================== */}
      {/* USDT BUY / SELL PRICE SETTINGS */}
      {/* ========================================== */}

      {showPriceSection && (
        <div className="rounded-2xl bg-[#111827] border border-cyan-600/20 p-6">

          <div className="flex items-center gap-3 mb-6">
            <TrendingUp
              className="text-cyan-400"
              size={28}
            />

            <h2 className="text-xl sm:text-2xl font-bold text-cyan-400">
              USDT Buy / Sell Prices
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* BUY PRICE */}

            <div>
              <label
                htmlFor="usdt-buy-price"
                className="block text-sm text-gray-300 mb-2"
              >
                Buy USDT Price (PKR)
              </label>

              <input
                id="usdt-buy-price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={settings.buyPrice}
                onChange={(e) =>
                  updateField(
                    "buyPrice",
                    e.target.value === ""
                      ? 0
                      : Number(e.target.value)
                  )
                }
                placeholder="Enter Buy Price"
                className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-cyan-500 outline-none transition"
              />

              <p className="text-cyan-400 text-xs mt-2">
                Price users pay when buying USDT.
              </p>
            </div>

            {/* SELL PRICE */}

            <div>
              <label
                htmlFor="usdt-sell-price"
                className="block text-sm text-gray-300 mb-2"
              >
                Sell USDT Price (PKR)
              </label>

              <input
                id="usdt-sell-price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={settings.sellPrice}
                onChange={(e) =>
                  updateField(
                    "sellPrice",
                    e.target.value === ""
                      ? 0
                      : Number(e.target.value)
                  )
                }
                placeholder="Enter Sell Price"
                className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-red-500 outline-none transition"
              />

              <p className="text-red-400 text-xs mt-2">
                Price users receive when selling USDT.
              </p>
            </div>

          </div>

          {/* LIVE SPREAD */}

          <div className="mt-6 bg-[#1F2937] rounded-xl p-5 border border-blue-600/20">

            <div className="flex justify-between items-center gap-4">

              <div>
                <p className="text-gray-400 text-sm">
                  Current Spread
                </p>

                <h3 className="text-2xl font-bold text-blue-400 mt-1">
                  PKR{" "}
                  {formatMoney(liveSpread)}
                </h3>
              </div>

              <ArrowUpDown
                className="text-blue-400 shrink-0"
                size={32}
              />

            </div>

            <p className="text-gray-500 text-sm mt-3">
              Spread = Buy Price − Sell Price
            </p>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* USD PRICE + EXCHANGE RATE */}
      {/* ========================================== */}

      {showPriceSection && (
        <div className="rounded-2xl bg-[#111827] border border-green-600/20 p-6">

          <div className="flex items-center gap-3 mb-6">
            <DollarSign
              className="text-green-400"
              size={28}
            />

            <h2 className="text-xl sm:text-2xl font-bold text-green-400">
              USDT USD & Exchange Rate
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* USD PRICE */}

            <div>
              <label
                htmlFor="usdt-usd-price"
                className="block text-sm text-gray-300 mb-2"
              >
                USDT Price (USD)
              </label>

              <input
                id="usdt-usd-price"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={settings.usdtPriceUSD}
                onChange={(e) =>
                  updateField(
                    "usdtPriceUSD",
                    e.target.value === ""
                      ? 0
                      : Number(e.target.value)
                  )
                }
                placeholder="1.00"
                className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-green-500 outline-none transition"
              />

              <p className="text-gray-500 text-xs mt-2">
                Standard USDT value in USD.
              </p>
            </div>

            {/* USD TO PKR */}

            <div>
              <label
                htmlFor="usd-to-pkr"
                className="block text-sm text-gray-300 mb-2"
              >
                USD to PKR Rate
              </label>

              <input
                id="usd-to-pkr"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={settings.usdToPkr}
                onChange={(e) =>
                  updateField(
                    "usdToPkr",
                    e.target.value === ""
                      ? 0
                      : Number(e.target.value)
                  )
                }
                placeholder="Enter Exchange Rate"
                className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-green-500 outline-none transition"
              />

              <p className="text-gray-500 text-xs mt-2">
                Current USD to PKR exchange rate.
              </p>
            </div>

          </div>

          {/* LIVE CONVERSION */}

          <div className="mt-6 bg-[#1F2937] rounded-xl p-5 border border-green-500/20">

            <div className="flex justify-between items-center gap-4">

              <div>
                <p className="text-gray-400 text-sm">
                  Estimated PKR Value
                </p>

                <h3 className="text-2xl font-bold text-green-400 mt-1">
                  PKR{" "}
                  {formatMoney(
                    Number(
                      settings.usdtPriceUSD
                    ) *
                      Number(
                        settings.usdToPkr
                      )
                  )}
                </h3>
              </div>

              <Coins
                className="text-green-400 shrink-0"
                size={30}
              />

            </div>

            <p className="text-gray-500 text-sm mt-3">
              Live conversion using USD exchange rate.
            </p>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* NETWORK & WALLET SETTINGS */}
      {/* ========================================== */}

      {showWalletSection && (
        <div className="rounded-2xl bg-[#111827] border border-orange-600/20 p-6">

          <div className="flex items-center gap-3 mb-6">
            <Wallet
              className="text-orange-400"
              size={28}
            />

            <h2 className="text-xl sm:text-2xl font-bold text-orange-400">
              Wallet Network Settings
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* NETWORK */}

            <div>
              <label
                htmlFor="usdt-network"
                className="block text-sm text-gray-300 mb-2"
              >
                Active USDT Network
              </label>

              <select
                id="usdt-network"
                value={settings.network}
                onChange={(e) =>
                  updateField(
                    "network",
                    e.target.value as
                      | "TRC20"
                      | "BEP20"
                      | "ERC20"
                  )
                }
                className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-orange-500 outline-none transition"
              >
                <option value="TRC20">
                  TRC20
                </option>

                <option value="BEP20">
                  BEP20
                </option>

                <option value="ERC20">
                  ERC20
                </option>
              </select>

              <p className="text-gray-500 text-xs mt-2">
                Select the active USDT wallet network.
              </p>
            </div>

            {/* WALLET ADDRESS */}

            <div>
              <label
                htmlFor="usdt-wallet-address"
                className="block text-sm text-gray-300 mb-2"
              >
                Wallet Address
              </label>

              <textarea
                id="usdt-wallet-address"
                value={settings.walletAddress}
                onChange={(e) =>
                  updateField(
                    "walletAddress",
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Enter USDT Wallet Address"
                className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 resize-none focus:border-orange-500 outline-none transition"
              />

              <p className="text-gray-500 text-xs mt-2">
                Wallet address used for the selected network.
              </p>
            </div>

          </div>

          {/* WALLET PREVIEW */}

          <div className="mt-6 bg-[#1F2937] rounded-xl p-5 border border-orange-500/20">

            <p className="text-gray-400 text-sm mb-2">
              Current Deposit Wallet
            </p>

            <p className="text-orange-300 break-all font-mono text-sm">
              {settings.walletAddress?.trim() ||
                "No wallet address configured."}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500/10 border border-orange-500/30 px-4 py-2 text-orange-300 text-sm font-semibold">
              <Wallet size={16} />

              Network:{" "}
              {settings.network}
            </div>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* USDT TRADING LIMITS */}
      {/* ========================================== */}

      {showLimitSection && (
        <div className="rounded-2xl bg-[#111827] border border-purple-600/20 p-6">

          <div className="flex items-center gap-3 mb-6">
            <Settings
              className="text-purple-400"
              size={28}
            />

            <h2 className="text-xl sm:text-2xl font-bold text-purple-400">
              USDT Trading Limits
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">

            {/* MIN BUY */}

            <div>
              <label
                htmlFor="minimum-buy"
                className="block text-sm text-gray-300 mb-2"
              >
                Minimum Buy USDT
              </label>

              <input
                id="minimum-buy"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={settings.minimumBuy}
                onChange={(e) =>
                  updateField(
                    "minimumBuy",
                    e.target.value === ""
                      ? 0
                      : Number(e.target.value)
                  )
                }
                className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition"
              />
            </div>

            {/* MIN SELL */}

            <div>
              <label
                htmlFor="minimum-sell"
                className="block text-sm text-gray-300 mb-2"
              >
                Minimum Sell USDT
              </label>

              <input
                id="minimum-sell"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={settings.minimumSell}
                onChange={(e) =>
                  updateField(
                    "minimumSell",
                    e.target.value === ""
                      ? 0
                      : Number(e.target.value)
                  )
                }
                className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition"
              />
            </div>

            {/* MAX BUY */}

            <div>
              <label
                htmlFor="maximum-buy"
                className="block text-sm text-gray-300 mb-2"
              >
                Maximum Buy USDT
              </label>

              <input
                id="maximum-buy"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={settings.maximumBuy}
                onChange={(e) =>
                  updateField(
                    "maximumBuy",
                    e.target.value === ""
                      ? 0
                      : Number(e.target.value)
                  )
                }
                className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition"
              />
            </div>

            {/* MAX SELL */}

            <div>
              <label
                htmlFor="maximum-sell"
                className="block text-sm text-gray-300 mb-2"
              >
                Maximum Sell USDT
              </label>

              <input
                id="maximum-sell"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={settings.maximumSell}
                onChange={(e) =>
                  updateField(
                    "maximumSell",
                    e.target.value === ""
                      ? 0
                      : Number(e.target.value)
                  )
                }
                className="w-full bg-[#1F2937] border border-gray-600 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition"
              />
            </div>

          </div>

          {/* LIMIT SUMMARY */}

          <div className="grid md:grid-cols-2 gap-5 mt-6">

            <div className="bg-[#1F2937] rounded-xl p-5 border border-green-600/20">

              <p className="text-gray-400 text-sm">
                Buy Range
              </p>

              <h3 className="text-lg sm:text-xl font-bold text-green-400 mt-2 break-words">
                {formatUsdt(
                  settings.minimumBuy
                )}{" "}
                USDT →{" "}
                {formatUsdt(
                  settings.maximumBuy
                )}{" "}
                USDT
              </h3>

            </div>

            <div className="bg-[#1F2937] rounded-xl p-5 border border-red-600/20">

              <p className="text-gray-400 text-sm">
                Sell Range
              </p>

              <h3 className="text-lg sm:text-xl font-bold text-red-400 mt-2 break-words">
                {formatUsdt(
                  settings.minimumSell
                )}{" "}
                USDT →{" "}
                {formatUsdt(
                  settings.maximumSell
                )}{" "}
                USDT
              </h3>

            </div>

          </div>

        </div>
      )}
            {/* ========================================== */}
      {/* MARKET SUMMARY */}
      {/* ========================================== */}

      {showMarketSection && (
        <div className="rounded-2xl bg-[#111827] border border-blue-600/20 p-6">

          <div className="flex items-center gap-3 mb-6">
            <Shield
              className="text-blue-400"
              size={28}
            />

            <h2 className="text-xl sm:text-2xl font-bold text-blue-400">
              USDT Market Summary
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            {/* MARKET STATUS */}

            <div className="bg-[#1F2937] rounded-xl p-5 border border-blue-500/20">

              <p className="text-gray-400 text-sm">
                Market Status
              </p>

              <h3
                className={`text-2xl font-bold mt-2 ${
                  settings.marketStatus === "OPEN"
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {settings.marketStatus}
              </h3>

            </div>

            {/* TRADING STATUS */}

            <div className="bg-[#1F2937] rounded-xl p-5 border border-green-500/20">

              <p className="text-gray-400 text-sm">
                Trading Module
              </p>

              <h3
                className={`text-2xl font-bold mt-2 ${
                  settings.tradingEnabled
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {settings.tradingEnabled
                  ? "ENABLED"
                  : "DISABLED"}
              </h3>

            </div>

          </div>

          {/* LIVE MARKET OVERVIEW */}

          <div className="mt-6 bg-[#1F2937] rounded-xl p-5 border border-cyan-500/20">

            <p className="text-gray-400 text-sm mb-4">
              Live Market Overview
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

              {/* BUY */}

              <div>
                <p className="text-xs text-gray-500">
                  BUY
                </p>

                <p className="text-green-400 font-bold text-lg mt-1">
                  PKR{" "}
                  {formatMoney(
                    settings.buyPrice
                  )}
                </p>
              </div>

              {/* SELL */}

              <div>
                <p className="text-xs text-gray-500">
                  SELL
                </p>

                <p className="text-red-400 font-bold text-lg mt-1">
                  PKR{" "}
                  {formatMoney(
                    settings.sellPrice
                  )}
                </p>
              </div>

              {/* SPREAD */}

              <div>
                <p className="text-xs text-gray-500">
                  SPREAD
                </p>

                <p className="text-blue-400 font-bold text-lg mt-1">
                  PKR{" "}
                  {formatMoney(
                    liveSpread
                  )}
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================== */}
      {/* NO SEARCH RESULTS */}
      {/* ========================================== */}

      {!showPriceSection &&
        !showLimitSection &&
        !showWalletSection &&
        !showMarketSection && (
          <div className="rounded-2xl bg-[#111827] border border-gray-700 p-8 text-center">

            <Search
              size={40}
              className="mx-auto text-gray-600 mb-4"
            />

            <h3 className="text-xl font-bold text-gray-300">
              No matching settings found
            </h3>

            <p className="text-gray-500 mt-2">
              Try searching for price, wallet, network,
              limits, market or trading.
            </p>

            <button
              type="button"
              onClick={() => setSearch("")}
              className="mt-5 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition"
            >
              Clear Search
            </button>

          </div>
        )}

      {/* ========================================== */}
      {/* LAST UPDATED CARD */}
      {/* ========================================== */}

      <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6">

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

          <div>
            <h2 className="text-xl font-bold text-cyan-400 mb-2">
              USDT Settings Information
            </h2>

            <p className="text-gray-400 text-sm">
              Last Updated
            </p>

            <p className="text-green-400 font-semibold mt-1">
              {lastUpdatedLabel}
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">

            {/* RESET */}

            <button
              type="button"
              onClick={resetUsdtSettings}
              disabled={
                loading ||
                refreshing ||
                saving
              }
              className="bg-gray-700 hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3 rounded-xl font-semibold transition"
            >
              Reset Changes
            </button>

            {/* SAVE */}

            <button
              type="button"
              onClick={saveUsdtSettings}
              disabled={
                saving ||
                loading
              }
              className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition"
            >
              <Save size={18} />

              {saving
                ? "Saving..."
                : "Save USDT Settings"}
            </button>

          </div>

        </div>

      </div>

    </div>

    {/* ========================================== */}
    {/* LOADING / SAVING OVERLAY */}
    {/* ========================================== */}

    {(loading || saving) && (
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

        <div className="w-full max-w-sm bg-[#111827] border border-cyan-500/30 rounded-2xl px-8 py-7 flex flex-col items-center gap-4 shadow-2xl">

          <RefreshCw
            size={36}
            className="animate-spin text-cyan-400"
          />

          <h3 className="text-xl font-bold text-cyan-400 text-center">
            GoldTrade V18 Enterprise
          </h3>

          <p className="text-gray-300 text-center">
            {saving
              ? "Saving USDT settings..."
              : "Loading USDT settings..."}
          </p>

        </div>

      </div>
    )}

    {/* ========================================== */}
    {/* FOOTER */}
    {/* ========================================== */}

    <footer className="mt-12 border-t border-gray-800 pt-6 pb-4">

      <div className="flex flex-col lg:flex-row justify-between items-center gap-5">

        <div className="text-center lg:text-left">

          <h3 className="text-cyan-400 font-bold text-lg">
            GoldTrade V18 Enterprise
          </h3>

          <p className="text-gray-500 text-sm">
            USDT Trading Management Module
          </p>

        </div>

        <div className="flex flex-wrap justify-center gap-4 sm:gap-5 text-sm text-gray-400">

          <div className="flex items-center gap-2">
            <Shield
              size={16}
              className="text-green-400"
            />

            Secure USDT Configuration
          </div>

          <div className="flex items-center gap-2">
            <Wallet
              size={16}
              className="text-cyan-400"
            />

            TRC20 • BEP20 • ERC20 Networks
          </div>

          <div className="flex items-center gap-2">
            <TrendingUp
              size={16}
              className="text-green-400"
            />

            Buy / Sell Price Engine
          </div>

          <div className="flex items-center gap-2">
            <Activity
              size={16}
              className="text-blue-400"
            />

            Market Open / Closed Control
          </div>

        </div>

      </div>

    </footer>

  </div>
);
}
