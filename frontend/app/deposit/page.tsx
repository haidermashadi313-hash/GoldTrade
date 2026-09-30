"use client";

// =====================================================
// GoldTrade V18 Enterprise
// Deposit PKR Page
// PART 1/10
// =====================================================

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Wallet,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  Loader2,
  Copy,
  Shield,
  CreditCard,
  Landmark,
  Smartphone,
  Bitcoin,
  RefreshCw,
} from "lucide-react";

// =====================================================
// CENTRAL DEPOSIT API HELPER
// =====================================================

import {
  API,
  createDeposit,
  getDepositHistory,
  getDepositSettings,
  getAuthToken,
  getApiErrorMessage,
  isUnauthorized,
  redirectToLogin,
  normalizeDeposit,
  normalizeDepositSettings,
  normalizePaymentMethod,
  toSafeNumber,
} from "@/lib/deposit-api";

// =====================================================
// TYPES
// =====================================================

interface UserData {
  username: string;
  fullName: string;
  email: string;
  role: string;
}

interface WalletData {
  pkrBalance: number;
  goldBalance: number;
  usdtBalance: number;
}

type PaymentMethodType =
  | "BANK"
  | "JAZZCASH"
  | "EASYPAISA"
  | "BINANCE"
  | "USDT_BEP20"
  | "USDT_ERC20"
  | string;

interface PaymentMethod {
  _id?: string;

  method: PaymentMethodType;

  title: string;

  accountTitle: string;

  accountName?: string;

  accountNumber: string;

  iban?: string;

  bankName?: string;

  walletAddress?: string;

  network?: string;

  qrImage?: string;

  qrCode?: string;

  instructions?: string;

  enabled: boolean;
}

type DepositStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

interface DepositHistory {
  _id: string;

  amount: number;

  paymentMethod: string;

  transactionId: string;

  status: DepositStatus;

  createdAt: string;

  receipt?: string;

  receiptImage?: string;

  screenshot?: string;

  adminNote?: string;

  note?: string;

  rejectReason?: string;

  approvedAt?: string;

  rejectedAt?: string;
}

// =====================================================
// COMPONENT
// =====================================================

export default function DepositPage() {
  const router = useRouter();

  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState("");

  const [username, setUsername] = useState("");

  const [user, setUser] = useState<UserData>({
    username: "",
    fullName: "",
    email: "",
    role: "user",
  });

  // ===================================================
  // WALLET
  // ===================================================

  const [wallet, setWallet] = useState<WalletData>({
    pkrBalance: 0,
    goldBalance: 0,
    usdtBalance: 0,
  });

  // ===================================================
  // PAYMENT SETTINGS
  // ===================================================

  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>([]);

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod | null>(null);

  const [depositsEnabled, setDepositsEnabled] =
    useState(true);

  const [minimumDeposit, setMinimumDeposit] =
    useState(500);

  const [maximumDeposit, setMaximumDeposit] =
    useState(5000000);

  const [receiptRequired, setReceiptRequired] =
    useState(true);

  // ===================================================
  // DEPOSIT FORM
  // ===================================================

  const [amount, setAmount] = useState("");

  const [transactionId, setTransactionId] =
    useState("");

  const [receiptFile, setReceiptFile] =
    useState<File | null>(null);

  const [receiptPreview, setReceiptPreview] =
    useState("");

  // ===================================================
  // RECEIPT PREVIEW MODAL
  // ===================================================

  const [previewReceipt, setPreviewReceipt] =
    useState<string | null>(null);

  // ===================================================
  // HISTORY
  // ===================================================

  const [depositHistory, setDepositHistory] =
    useState<DepositHistory[]>([]);

  // ===================================================
  // UI
  // ===================================================

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ===================================================
  // API TOKEN
  // ===================================================

  const getCurrentToken = useCallback(() => {
    if (token) {
      return token;
    }

    return getAuthToken();
  }, [token]);

  // ===================================================
  // FORMAT MONEY
  // ===================================================

  const formatMoney = useCallback(
    (value: number) => {
      return Number(value || 0).toLocaleString(
        "en-PK",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      );
    },
    []
  );

  // ===================================================
  // AUTH / SESSION LOAD
  // ===================================================

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedToken =
      window.localStorage.getItem("token") ||
      window.localStorage.getItem("accessToken") ||
      window.localStorage.getItem("jwt") ||
      "";

    const storedUsername =
      window.localStorage.getItem("username") ||
      "";

    const storedUser =
      window.localStorage.getItem("user");

    if (!storedToken) {
      router.replace("/login");
      return;
    }

    setToken(storedToken);
    setUsername(storedUsername);

    if (storedUser) {
      try {
        const parsedUser =
          JSON.parse(
            storedUser
          ) as Partial<UserData>;

        setUser((current) => ({
          ...current,
          ...parsedUser,

          username:
            parsedUser.username ||
            storedUsername ||
            current.username,

          fullName:
            parsedUser.fullName ||
            parsedUser.username ||
            current.fullName,

          email:
            parsedUser.email ||
            current.email,

          role:
            parsedUser.role ||
            current.role ||
            "user",
        }));

        if (
          !storedUsername &&
          parsedUser.username
        ) {
          setUsername(
            parsedUser.username
          );
        }
      } catch (error) {
        console.warn(
          "Stored user data could not be parsed.",
          error
        );
      }
    }
  }, [router]);

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout = useCallback(() => {
    if (
      typeof window !==
      "undefined"
    ) {
      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "accessToken"
      );

      localStorage.removeItem(
        "jwt"
      );

      localStorage.removeItem(
        "username"
      );

      localStorage.removeItem(
        "role"
      );

      localStorage.removeItem(
        "user"
      );
    }

    router.replace("/login");
  }, [router]);

  // ===================================================
  // VERIFY USER SESSION
  // GET /api/auth/check
  // ===================================================

  const verifySession =
    useCallback(async () => {
      const activeToken =
        getCurrentToken();

      if (!activeToken) {
        return false;
      }

      try {
        const response =
          await fetch(
            `${API}/api/auth/check`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${activeToken}`,

                Accept:
                  "application/json",
              },

              cache: "no-store",
            }
          );

        let data: any = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (
          response.status === 401 ||
          !response.ok ||
          !data?.success
        ) {
          logout();
          return false;
        }

        const sessionUser =
          data?.user || {};

        const resolvedUsername =
          String(
            sessionUser.username ||
              username ||
              ""
          ).trim();

        setUser({
          username:
            resolvedUsername,

          fullName:
            String(
              sessionUser.fullName ||
                sessionUser.username ||
                resolvedUsername ||
                ""
            ).trim(),

          email:
            String(
              sessionUser.email ||
                ""
            ).trim(),

          role:
            String(
              sessionUser.role ||
                "user"
            ).trim(),
        });

        if (
          !username &&
          resolvedUsername
        ) {
          setUsername(
            resolvedUsername
          );
        }

        return true;
      } catch (error) {
        console.error(
          "AUTH ERROR:",
          error
        );

        logout();
        return false;
      }
    }, [
      getCurrentToken,
      username,
      logout,
    ]);

  // ===================================================
  // VERIFY SESSION WHEN TOKEN AVAILABLE
  // ===================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    verifySession();
  }, [
    token,
    verifySession,
  ]);

  // ===================================================
  // COPY TO CLIPBOARD
  // ===================================================

  const copyToClipboard =
    useCallback(
      async (value: string) => {
        const text =
          String(value || "").trim();

        if (!text) {
          return;
        }

        try {
          await navigator.clipboard.writeText(
            text
          );

          setSuccessMessage(
            "Copied successfully."
          );

          setTimeout(() => {
            setSuccessMessage("");
          }, 2500);
        } catch (error) {
          console.error(
            "COPY ERROR:",
            error
          );

          setErrorMessage(
            "Unable to copy."
          );
        }
      },
      []
    );

  // ===================================================
  // COUNTERS
  // ===================================================

  const totalDeposits =
    useMemo(() => {
      return depositHistory.length;
    }, [depositHistory]);

  const approvedDeposits =
    useMemo(() => {
      return depositHistory.filter(
        (item) =>
          String(item.status)
            .trim()
            .toUpperCase() ===
          "APPROVED"
      ).length;
    }, [depositHistory]);

  const pendingDeposits =
    useMemo(() => {
      return depositHistory.filter(
        (item) =>
          String(item.status)
            .trim()
            .toUpperCase() ===
          "PENDING"
      ).length;
    }, [depositHistory]);

  const rejectedDeposits =
    useMemo(() => {
      return depositHistory.filter(
        (item) =>
          String(item.status)
            .trim()
            .toUpperCase() ===
          "REJECTED"
      ).length;
    }, [depositHistory]);

  // ===================================================
  // LOAD USER WALLET
  // GET /api/wallet/balance
  // ===================================================

  const loadWallet =
    useCallback(async () => {
      const activeToken =
        getCurrentToken();

      if (!activeToken) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API}/api/wallet/balance`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${activeToken}`,

                Accept:
                  "application/json",
              },

              cache: "no-store",
            }
          );

        let data: any = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        console.log(
          "V18 PKR WALLET:",
          data
        );

        if (
          response.status === 401
        ) {
          logout();
          return;
        }

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Unable to load wallet."
          );
        }

        const source =
          data?.wallet ||
          data?.data?.wallet ||
          {};

        setWallet({
          pkrBalance:
            toSafeNumber(
              data?.pkrBalance ??
                data?.balance ??
                source?.pkrBalance ??
                source?.pkr ??
                data?.data?.pkrBalance ??
                0
            ),

          goldBalance:
            toSafeNumber(
              data?.goldBalance ??
                source?.goldBalance ??
                source?.gold ??
                data?.data?.goldBalance ??
                0
            ),

          usdtBalance:
            toSafeNumber(
              data?.usdtBalance ??
                source?.usdtBalance ??
                source?.usdt ??
                data?.data?.usdtBalance ??
                0
            ),
        });
      } catch (error: any) {
        console.error(
          "LOAD WALLET ERROR:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Wallet unavailable."
        );
      }
    }, [
      getCurrentToken,
      logout,
    ]);

  // ===================================================
  // FILE HELPER
  // ===================================================

  const clearReceiptState =
    useCallback(() => {
      setReceiptFile(null);
      setReceiptPreview("");
    }, []);

  // =====================================================
// LOAD PAYMENT SETTINGS
//
// SOURCE OF TRUTH:
// GET /api/deposit/payment-settings
// =====================================================

const loadPaymentSettings =
  useCallback(async () => {
    const activeToken =
      getCurrentToken();

    if (!activeToken) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API}/api/deposit/payment-settings`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${activeToken}`,

              Accept:
                "application/json",
            },

            cache: "no-store",
          }
        );

      let data: any = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      console.log(
        "V18 USER DEPOSIT PAYMENT SETTINGS:",
        data
      );

      // =================================================
      // AUTH EXPIRED
      // =================================================

      if (
        response.status === 401
      ) {
        logout();
        return;
      }

      // =================================================
      // API ERROR
      // =================================================

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            `Unable to load payment settings. HTTP ${response.status}.`
        );
      }

      // =================================================
      // SETTINGS SOURCE
      // =================================================

      const settingsSource =
        data?.settings ||
        data?.data?.settings ||
        data ||
        {};

      // =================================================
      // NORMALIZE SETTINGS
      // =================================================

      const normalizedSettings =
        normalizeDepositSettings(
          {
            ...settingsSource,

            paymentMethods:
              data?.paymentMethods ||
              data?.methods ||
              settingsSource?.paymentMethods ||
              settingsSource?.methods ||
              [],
          }
        );

      // =================================================
      // DEPOSIT ENABLED
      // =================================================

      setDepositsEnabled(
        normalizedSettings
          .depositsEnabled !== false
      );

      // =================================================
      // MINIMUM DEPOSIT
      // =================================================

      const backendMinimum =
        Number(
          normalizedSettings.minimumDeposit
        );

      if (
        Number.isFinite(
          backendMinimum
        ) &&
        backendMinimum > 0
      ) {
        setMinimumDeposit(
          backendMinimum
        );
      }

      // =================================================
      // MAXIMUM DEPOSIT
      // =================================================

      const backendMaximum =
        Number(
          normalizedSettings.maximumDeposit
        );

      if (
        Number.isFinite(
          backendMaximum
        ) &&
        backendMaximum > 0
      ) {
        setMaximumDeposit(
          backendMaximum
        );
      }

      // =================================================
      // RECEIPT REQUIRED
      // =================================================

      setReceiptRequired(
        normalizedSettings
          .receiptRequired !== false
      );

      // =================================================
      // PAYMENT METHODS
      // =================================================

      const rawMethods =
        Array.isArray(
          normalizedSettings.paymentMethods
        )
          ? normalizedSettings.paymentMethods
          : [];

      const methods: PaymentMethod[] =
        rawMethods
          .map(
            (item: any) =>
              normalizePaymentMethod(
                item
              )
          )
          .filter(
            (
              item: any
            ) =>
              item &&
              item.enabled === true &&
              String(
                item.method || ""
              ).trim().length > 0
          )
          .map(
            (
              item: any
            ): PaymentMethod => ({
              _id:
                item._id,

              method:
                String(
                  item.method ||
                    ""
                )
                  .trim()
                  .toUpperCase(),

              title:
                String(
                  item.title ||
                    item.method ||
                    ""
                ).trim(),

              accountTitle:
                String(
                  item.accountTitle ||
                    item.accountName ||
                    ""
                ).trim(),

              accountName:
                String(
                  item.accountName ||
                    item.accountTitle ||
                    ""
                ).trim(),

              accountNumber:
                String(
                  item.accountNumber ||
                    ""
                ).trim(),

              iban:
                String(
                  item.iban ||
                    ""
                ).trim(),

              bankName:
                String(
                  item.bankName ||
                    ""
                ).trim(),

              walletAddress:
                String(
                  item.walletAddress ||
                    item.accountNumber ||
                    ""
                ).trim(),

              network:
                String(
                  item.network ||
                    ""
                ).trim(),

              qrImage:
                String(
                  item.qrImage ||
                    item.qrCode ||
                    ""
                ).trim(),

              qrCode:
                String(
                  item.qrCode ||
                    item.qrImage ||
                    ""
                ).trim(),

              instructions:
                String(
                  item.instructions ||
                    ""
                ).trim(),

              enabled:
                item.enabled === true,
            })
          );

      console.log(
        "V18 ENABLED PAYMENT METHODS:",
        methods
      );

      setPaymentMethods(
        methods
      );

      // =================================================
      // SELECT PAYMENT METHOD
      // =================================================

      setSelectedMethod(
        (current) => {
          if (
            methods.length === 0
          ) {
            return null;
          }

          // ---------------------------------------------
          // Keep current method if it still exists
          // ---------------------------------------------

          if (current) {
            const existing =
              methods.find(
                (item) =>
                  String(
                    item.method
                  ).toUpperCase() ===
                  String(
                    current.method
                  ).toUpperCase()
              );

            if (existing) {
              return existing;
            }
          }

          // ---------------------------------------------
          // Otherwise select first enabled method
          // ---------------------------------------------

          return methods[0];
        }
      );
    } catch (error: any) {
      console.error(
        "V18 PAYMENT SETTINGS ERROR:",
        error
      );

      setPaymentMethods([]);

      setSelectedMethod(null);

      setErrorMessage(
        error?.message ||
          "Payment methods unavailable."
      );
    }
  }, [
    getCurrentToken,
    logout,
  ]);

// =====================================================
// LOAD DEPOSIT HISTORY
//
// GET /api/deposit/history/:username
// =====================================================

const loadDepositHistory =
  useCallback(async () => {
    const activeToken =
      getCurrentToken();

    const activeUsername =
      String(
        username ||
          user.username ||
          ""
      ).trim();

    if (
      !activeToken ||
      !activeUsername
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API}/api/deposit/history/${encodeURIComponent(
            activeUsername
          )}`,
          {
            method: "GET",

            headers: {
              Authorization:
                `Bearer ${activeToken}`,

              Accept:
                "application/json",
            },

            cache: "no-store",
          }
        );

      let data: any = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      console.log(
        "V18 DEPOSIT HISTORY:",
        data
      );

      // =================================================
      // AUTH EXPIRED
      // =================================================

      if (
        response.status === 401
      ) {
        logout();
        return;
      }

      // =================================================
      // API ERROR
      // =================================================

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          data?.message ||
            `Unable to load deposit history. HTTP ${response.status}.`
        );
      }

      // =================================================
      // HISTORY SOURCE
      // =================================================

      const rawHistory =
        Array.isArray(
          data?.history
        )
          ? data.history
          : Array.isArray(
              data?.deposits
            )
          ? data.deposits
          : Array.isArray(
              data?.data?.history
            )
          ? data.data.history
          : Array.isArray(
              data?.data?.deposits
            )
          ? data.data.deposits
          : [];

      // =================================================
      // NORMALIZE HISTORY
      // =================================================

      const history: DepositHistory[] =
        rawHistory.map(
          (item: any) => {
            const normalized =
              normalizeDeposit(
                item
              );

            return {
              _id:
                String(
                  normalized._id ||
                    normalized.id ||
                    item?._id ||
                    item?.id ||
                    ""
                ),

              amount:
                Number(
                  normalized.amount ||
                    item?.amount ||
                    item?.requestAmount ||
                    0
                ),

              paymentMethod:
                String(
                  normalized.paymentMethod ||
                    item?.paymentMethod ||
                    item?.method ||
                    ""
                ).trim(),

              transactionId:
                String(
                  normalized.transactionId ||
                    item?.transactionId ||
                    item?.referenceId ||
                    item?.reference ||
                    ""
                ).trim(),

              status:
                normalized.status ||
                item?.status ||
                "PENDING",

              createdAt:
                normalized.createdAt ||
                item?.createdAt ||
                new Date().toISOString(),

              receipt:
                normalized.screenshot ||
                normalized.receiptImage ||
                item?.screenshot ||
                item?.receiptImage ||
                item?.receipt ||
                "",

              receiptImage:
                normalized.receiptImage ||
                normalized.screenshot ||
                item?.receiptImage ||
                item?.screenshot ||
                item?.receipt ||
                "",

              screenshot:
                normalized.screenshot ||
                item?.screenshot ||
                item?.receiptImage ||
                "",

              adminNote:
                item?.adminNote ||
                item?.note ||
                normalized.note ||
                "",

              note:
                item?.note ||
                normalized.note ||
                "",

              rejectReason:
                item?.rejectReason ||
                normalized.rejectReason ||
                "",

              approvedAt:
                item?.approvedAt ||
                normalized.approvedAt,

              rejectedAt:
                item?.rejectedAt ||
                normalized.rejectedAt,
            };
          }
        );

      // =================================================
      // SORT — NEWEST FIRST
      // =================================================

      history.sort(
        (
          a,
          b
        ) => {
          const dateA =
            new Date(
              a.createdAt
            ).getTime();

          const dateB =
            new Date(
              b.createdAt
            ).getTime();

          return (
            dateB - dateA
          );
        }
      );

      setDepositHistory(
        history
      );
    } catch (error: any) {
      console.error(
        "V18 DEPOSIT HISTORY ERROR:",
        error
      );

      setDepositHistory([]);

      setErrorMessage(
        error?.message ||
          "Deposit history unavailable."
      );
    }
  }, [
    getCurrentToken,
    username,
    user.username,
    logout,
  ]);

// =====================================================
// REFRESH COMPLETE DEPOSIT PAGE
// =====================================================

const refreshDepositPage =
  useCallback(async () => {
    const activeToken =
      getCurrentToken();

    if (!activeToken) {
      return;
    }

    try {
      setRefreshing(true);

      setErrorMessage("");

      await Promise.all([
        loadWallet(),
        loadPaymentSettings(),
        loadDepositHistory(),
      ]);

      console.log(
        "V18 Deposit page refreshed successfully."
      );
    } catch (error: any) {
      console.error(
        "V18 DEPOSIT REFRESH ERROR:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Unable to refresh deposit page."
      );
    } finally {
      setRefreshing(false);
    }
  }, [
    getCurrentToken,
    loadWallet,
    loadPaymentSettings,
    loadDepositHistory,
  ]);

// =====================================================
// INITIAL PAGE LOAD
// =====================================================

useEffect(() => {
  if (
    !token ||
    !username
  ) {
    return;
  }

  let mounted = true;

  const initializePage =
    async () => {
      try {
        if (!mounted) {
          return;
        }

        setLoading(true);

        setErrorMessage("");

        // ---------------------------------------------
        // VERIFY SESSION FIRST
        // ---------------------------------------------

        const valid =
          await verifySession();

        if (
          !valid ||
          !mounted
        ) {
          return;
        }

        // ---------------------------------------------
        // LOAD PAGE DATA
        // ---------------------------------------------

        await Promise.all([
          loadWallet(),
          loadPaymentSettings(),
          loadDepositHistory(),
        ]);

        if (mounted) {
          console.log(
            "V18 Deposit page initialized successfully."
          );
        }
      } catch (error: any) {
        console.error(
          "V18 INITIAL DEPOSIT LOAD ERROR:",
          error
        );

        if (mounted) {
          setErrorMessage(
            error?.message ||
              "Unable to initialize deposit page."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

  initializePage();

  return () => {
    mounted = false;
  };
}, [
  token,
  username,
  verifySession,
  loadWallet,
  loadPaymentSettings,
  loadDepositHistory,
]);

// =====================================================
// AUTO REFRESH
//
// Every 60 seconds
// =====================================================

useEffect(() => {
  if (!token) {
    return;
  }

  const timer =
    window.setInterval(
      () => {
        refreshDepositPage();
      },
      60000
    );

  return () => {
    window.clearInterval(
      timer
    );
  };
}, [
  token,
  refreshDepositPage,
]);

// =====================================================
// PAYMENT METHOD SELECT
// =====================================================

const selectPaymentMethod =
  useCallback(
    (method: PaymentMethod) => {
      if (
        !method ||
        method.enabled !== true
      ) {
        return;
      }

      setSelectedMethod(
        method
      );

      setErrorMessage("");

      setSuccessMessage("");
    },
    []
  );

// =====================================================
// PAYMENT METHOD ICON
// =====================================================

const getMethodIcon =
  useCallback(
    (method: string) => {
      switch (
        String(method || "")
          .trim()
          .toUpperCase()
      ) {
        case "BANK":
          return Landmark;

        case "JAZZCASH":
          return Smartphone;

        case "EASYPAISA":
          return Smartphone;

        case "BINANCE":
        case "USDT_BEP20":
        case "USDT_ERC20":
          return Bitcoin;

        default:
          return CreditCard;
      }
    },
    []
  );

// =====================================================
// STATUS COLOR
// =====================================================

const getStatusColor =
  useCallback(
    (status: string) => {
      switch (
        String(status || "")
          .trim()
          .toUpperCase()
      ) {
        case "APPROVED":
          return "text-green-400 border-green-500 bg-green-500/10";

        case "PENDING":
          return "text-yellow-400 border-yellow-500 bg-yellow-500/10";

        case "REJECTED":
          return "text-red-400 border-red-500 bg-red-500/10";

        case "CANCELLED":
        case "CANCELED":
          return "text-gray-400 border-gray-500 bg-gray-500/10";

        default:
          return "text-gray-300 border-gray-600 bg-gray-700/10";
      }
    },
    []
  );

// =====================================================
// DATE FORMAT
// =====================================================

const formatDate =
  useCallback(
    (date: string) => {
      const parsed =
        new Date(date);

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return "--";
      }

      return parsed.toLocaleString(
        "en-PK",
        {
          year: "numeric",

          month: "short",

          day: "2-digit",

          hour: "2-digit",

          minute: "2-digit",
        }
      );
    },
    []
  );

// =====================================================
// RECEIPT IMAGE SELECT
// =====================================================

const handleReceiptChange =
  useCallback(
    (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      setErrorMessage("");

      setSuccessMessage("");

      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      // ---------------------------------------------
      // IMAGE ONLY
      // ---------------------------------------------

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        setErrorMessage(
          "Please upload a JPG, JPEG or PNG image."
        );

        event.target.value = "";

        return;
      }

      // ---------------------------------------------
      // MAX 5 MB
      // ---------------------------------------------

      if (
        file.size >
        5 * 1024 * 1024
      ) {
        setErrorMessage(
          "Receipt image must be less than 5MB."
        );

        event.target.value = "";

        return;
      }

      // ---------------------------------------------
      // STORE FILE
      // ---------------------------------------------

      setReceiptFile(
        file
      );

      // ---------------------------------------------
      // CREATE PREVIEW
      // ---------------------------------------------

      const reader =
        new FileReader();

      reader.onloadend = () => {
        setReceiptPreview(
          String(
            reader.result || ""
          )
        );
      };

      reader.onerror = () => {
        setReceiptFile(null);

        setReceiptPreview("");

        setErrorMessage(
          "Unable to read receipt image."
        );
      };

      reader.readAsDataURL(
        file
      );
    },
    []
  );

// =====================================================
// REMOVE RECEIPT
// =====================================================

const removeReceipt =
  useCallback(() => {
    setReceiptFile(null);

    setReceiptPreview("");

    setPreviewReceipt(null);

    setErrorMessage("");

    setSuccessMessage("");
  }, []);

// =====================================================
// VALIDATE DEPOSIT FORM
// =====================================================

const validateDepositForm =
  useCallback(() => {
    setErrorMessage("");

    // =================================================
    // DEPOSITS ENABLED
    // =================================================

    if (!depositsEnabled) {
      setErrorMessage(
        "Deposits are currently disabled. Please try again later."
      );

      return false;
    }

    // =================================================
    // PAYMENT METHOD
    // =================================================

    if (!selectedMethod) {
      setErrorMessage(
        "Please select a payment method."
      );

      return false;
    }

    if (
      selectedMethod.enabled !== true
    ) {
      setErrorMessage(
        "The selected payment method is currently unavailable."
      );

      return false;
    }

    // =================================================
    // AMOUNT
    // =================================================

    const numericAmount =
      Number(
        String(amount)
          .replace(/,/g, "")
          .trim()
      );

    if (
      !amount ||
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      setErrorMessage(
        "Enter a valid deposit amount."
      );

      return false;
    }

    // =================================================
    // INTEGER / DECIMAL SAFETY
    // =================================================

    if (
      numericAmount <= 0
    ) {
      setErrorMessage(
        "Deposit amount must be greater than zero."
      );

      return false;
    }

    // =================================================
    // MINIMUM DEPOSIT
    // =================================================

    if (
      minimumDeposit > 0 &&
      numericAmount <
        minimumDeposit
    ) {
      setErrorMessage(
        `Minimum PKR deposit is ${formatMoney(
          minimumDeposit
        )}.`
      );

      return false;
    }

    // =================================================
    // MAXIMUM DEPOSIT
    // =================================================

    if (
      maximumDeposit > 0 &&
      numericAmount >
        maximumDeposit
    ) {
      setErrorMessage(
        `Maximum PKR deposit is ${formatMoney(
          maximumDeposit
        )}.`
      );

      return false;
    }

    // =================================================
    // TRANSACTION ID
    // =================================================

    const cleanTransactionId =
      transactionId.trim();

    if (
      !cleanTransactionId
    ) {
      setErrorMessage(
        "Transaction ID is required."
      );

      return false;
    }

    if (
      cleanTransactionId.length <
      5
    ) {
      setErrorMessage(
        "Transaction ID is too short."
      );

      return false;
    }

    if (
      cleanTransactionId.length >
      150
    ) {
      setErrorMessage(
        "Transaction ID is too long."
      );

      return false;
    }

    // =================================================
    // RECEIPT
    // =================================================

    if (
      receiptRequired
    ) {
      if (
        !receiptFile
      ) {
        setErrorMessage(
          "Please upload payment receipt."
        );

        return false;
      }

      if (
        !receiptPreview
      ) {
        setErrorMessage(
          "Receipt preview could not be generated."
        );

        return false;
      }
    }

    // =================================================
    // RECEIPT FILE SAFETY
    // =================================================

    if (
      receiptFile
    ) {
      if (
        !receiptFile.type.startsWith(
          "image/"
        )
      ) {
        setErrorMessage(
          "Receipt must be an image file."
        );

        return false;
      }

      if (
        receiptFile.size >
        5 * 1024 * 1024
      ) {
        setErrorMessage(
          "Receipt image must be less than 5MB."
        );

        return false;
      }
    }

    return true;
  }, [
    depositsEnabled,
    selectedMethod,
    amount,
    minimumDeposit,
    maximumDeposit,
    transactionId,
    receiptRequired,
    receiptFile,
    receiptPreview,
    formatMoney,
  ]);

// =====================================================
// SUBMIT DEPOSIT
//
// POST /api/deposit/create
//
// IMPORTANT:
//
// 1. walletType = PKR
// 2. multipart/form-data
// 3. receipt field = screenshot
// 4. browser automatically creates multipart boundary
// 5. wallet is NOT credited here
// 6. request goes into pending/admin verification
// =====================================================

const submitDeposit =
  useCallback(async () => {
    // =================================================
    // PREVENT DOUBLE SUBMIT
    // =================================================

    if (
      submitting
    ) {
      return;
    }

    // =================================================
    // VALIDATE
    // =================================================

    if (
      !validateDepositForm()
    ) {
      return;
    }

    if (
      !selectedMethod
    ) {
      return;
    }

    const activeToken =
      getCurrentToken();

    if (
      !activeToken
    ) {
      logout();
      return;
    }

    try {
      setSubmitting(true);

      setErrorMessage("");

      setSuccessMessage("");

      // =================================================
      // CLEAN VALUES
      // =================================================

      const numericAmount =
        Number(
          String(amount)
            .replace(/,/g, "")
            .trim()
        );

      const cleanPaymentMethod =
        String(
          selectedMethod.method ||
            ""
        )
          .trim()
          .toUpperCase();

      const cleanTransactionId =
        transactionId.trim();

      // =================================================
      // FORM DATA
      //
      // DO NOT manually set Content-Type.
      // Browser will add multipart boundary.
      // =================================================

      const formData =
        new FormData();

      // -------------------------------------------------
      // WALLET TYPE
      // -------------------------------------------------

      formData.append(
        "walletType",
        "PKR"
      );

      // -------------------------------------------------
      // AMOUNT
      // -------------------------------------------------

      formData.append(
        "amount",
        String(
          numericAmount
        )
      );

      // -------------------------------------------------
      // PAYMENT METHOD
      // -------------------------------------------------

      formData.append(
        "paymentMethod",
        cleanPaymentMethod
      );

      // -------------------------------------------------
      // TRANSACTION ID
      // -------------------------------------------------

      formData.append(
        "transactionId",
        cleanTransactionId
      );

      // -------------------------------------------------
      // RECEIPT
      //
      // Backend expects:
      // upload.single("screenshot")
      // -------------------------------------------------

      if (
        receiptFile
      ) {
        formData.append(
          "screenshot",
          receiptFile
        );
      }

      // =================================================
      // OPTIONAL COMPATIBILITY DATA
      // =================================================

      if (
        selectedMethod.network
      ) {
        formData.append(
          "network",
          String(
            selectedMethod.network
          ).trim()
        );
      }

      // =================================================
      // DEBUG
      // =================================================

      console.log(
        "V18 DEPOSIT SUBMIT:",
        {
          walletType:
            "PKR",

          amount:
            numericAmount,

          paymentMethod:
            cleanPaymentMethod,

          transactionId:
            cleanTransactionId,

          screenshot:
            receiptFile
              ? {
                  name:
                    receiptFile.name,

                  type:
                    receiptFile.type,

                  size:
                    receiptFile.size,
                }
              : null,
        }
      );

      // =================================================
      // SEND REQUEST
      // =================================================

      const response =
        await fetch(
          `${API}/api/deposit/create`,
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${activeToken}`,

              Accept:
                "application/json",
            },

            body:
              formData,

            cache: "no-store",
          }
        );

      // =================================================
      // PARSE RESPONSE
      // =================================================

      let data: any = {};

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";

      if (
        contentType.includes(
          "application/json"
        )
      ) {
        try {
          data =
            await response.json();
        } catch {
          data = {};
        }
      } else {
        const text =
          await response.text();

        data = {
          success: false,
          message:
            text ||
            `Server returned HTTP ${response.status}.`,
        };
      }

      console.log(
        "V18 DEPOSIT RESPONSE:",
        data
      );

      // =================================================
      // AUTH EXPIRED
      // =================================================

      if (
        response.status === 401
      ) {
        logout();
        return;
      }

      // =================================================
      // API ERROR
      // =================================================

      if (
        !response.ok ||
        !data?.success
      ) {
        throw new Error(
          getApiErrorMessage(
            data,
            "Deposit request failed."
          )
        );
      }

      // =================================================
      // SUCCESS MESSAGE
      // =================================================

      setSuccessMessage(
        data?.message ||
          "Deposit request submitted successfully. Awaiting admin verification."
      );

      // =================================================
      // RESET FORM
      // =================================================

      setAmount("");

      setTransactionId("");

      setReceiptFile(
        null
      );

      setReceiptPreview("");

      setPreviewReceipt(
        null
      );

      // =================================================
      // REFRESH DATA
      // =================================================

      await Promise.all([
        loadWallet(),
        loadDepositHistory(),
      ]);
    } catch (error: any) {
      console.error(
        "V18 DEPOSIT SUBMIT ERROR:",
        error
      );

      // -----------------------------------------------
      // NETWORK ERROR
      // -----------------------------------------------

      if (
        error instanceof TypeError
      ) {
        setErrorMessage(
          "Unable to connect to the GoldTrade server."
        );

        return;
      }

      // -----------------------------------------------
      // NORMAL ERROR
      // -----------------------------------------------

      setErrorMessage(
        error?.message ||
          "Unable to submit deposit."
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    validateDepositForm,
    selectedMethod,
    getCurrentToken,
    logout,
    amount,
    transactionId,
    receiptFile,
    loadWallet,
    loadDepositHistory,
  ]);

// =====================================================
// QUICK AMOUNT VALUES
// =====================================================

const quickAmounts =
  useMemo(() => {
    const defaults = [
      500,
      1000,
      5000,
      10000,
      25000,
      50000,
    ];

    const minimum =
      Number(
        minimumDeposit || 0
      );

    const maximum =
      Number(
        maximumDeposit || 0
      );

    return defaults.filter(
      (value) => {
        if (
          minimum > 0 &&
          value < minimum
        ) {
          return false;
        }

        if (
          maximum > 0 &&
          value > maximum
        ) {
          return false;
        }

        return true;
      }
    );
  }, [
    minimumDeposit,
    maximumDeposit,
  ]);

// =====================================================
// SELECT QUICK AMOUNT
// =====================================================

const selectQuickAmount =
  useCallback(
    (value: number) => {
      if (
        !Number.isFinite(
          value
        )
      ) {
        return;
      }

      if (
        minimumDeposit > 0 &&
        value <
          minimumDeposit
      ) {
        setErrorMessage(
          `Minimum deposit is ${formatMoney(
            minimumDeposit
          )}.`
        );

        return;
      }

      if (
        maximumDeposit > 0 &&
        value >
          maximumDeposit
      ) {
        setErrorMessage(
          `Maximum deposit is ${formatMoney(
            maximumDeposit
          )}.`
        );

        return;
      }

      setAmount(
        String(value)
      );

      setErrorMessage("");

      setSuccessMessage("");
    },
    [
      minimumDeposit,
      maximumDeposit,
      formatMoney,
    ]
  );

// =====================================================
// CLEAR FORM
// =====================================================

const clearForm =
  useCallback(() => {
    setAmount("");

    setTransactionId("");

    setReceiptFile(
      null
    );

    setReceiptPreview("");

    setPreviewReceipt(
      null
    );

    setErrorMessage("");

    setSuccessMessage("");
  }, []);

// =====================================================
// FILE SIZE FORMAT
// =====================================================

const formatFileSize =
  useCallback(
    (size: number) => {
      const safeSize =
        Number(size || 0);

      if (
        safeSize < 1024
      ) {
        return `${safeSize} B`;
      }

      if (
        safeSize <
        1024 * 1024
      ) {
        return `${(
          safeSize / 1024
        ).toFixed(1)} KB`;
      }

      return `${(
        safeSize /
        (1024 * 1024)
      ).toFixed(2)} MB`;
    },
    []
  );

// =====================================================
// DEPOSIT SUMMARY
// =====================================================

const depositSummary =
  useMemo(() => {
    const totalApprovedAmount =
      depositHistory
        .filter(
          (item) =>
            String(
              item.status
            )
              .trim()
              .toUpperCase() ===
            "APPROVED"
        )
        .reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.amount ||
                0
            ),
          0
        );

    const totalPendingAmount =
      depositHistory
        .filter(
          (item) =>
            String(
              item.status
            )
              .trim()
              .toUpperCase() ===
            "PENDING"
        )
        .reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.amount ||
                0
            ),
          0
        );

    const totalRejectedAmount =
      depositHistory
        .filter(
          (item) =>
            String(
              item.status
            )
              .trim()
              .toUpperCase() ===
            "REJECTED"
        )
        .reduce(
          (
            sum,
            item
          ) =>
            sum +
            Number(
              item.amount ||
                0
            ),
          0
        );

    const totalRequestedAmount =
      depositHistory.reduce(
        (
          sum,
          item
        ) =>
          sum +
          Number(
            item.amount ||
              0
          ),
        0
      );

    return {
      totalRequests:
        depositHistory.length,

      totalApprovedAmount,

      totalPendingAmount,

      totalRejectedAmount,

      totalRequestedAmount,
    };
  }, [
    depositHistory,
  ]);

// =====================================================
// FORM VALIDATION STATUS
// =====================================================

const isDepositReady =
  useMemo(() => {
    const numericAmount =
      Number(
        String(amount)
          .replace(/,/g, "")
          .trim()
      );

    const validAmount =
      Number.isFinite(
        numericAmount
      ) &&
      numericAmount > 0 &&
      (
        minimumDeposit <= 0 ||
        numericAmount >=
          minimumDeposit
      ) &&
      (
        maximumDeposit <= 0 ||
        numericAmount <=
          maximumDeposit
      );

    const validMethod =
      Boolean(
        selectedMethod &&
        selectedMethod.enabled
      );

    const validTransaction =
      transactionId.trim()
        .length >= 5;

    const validReceipt =
      receiptRequired
        ? Boolean(
            receiptFile &&
            receiptPreview
          )
        : true;

    return Boolean(
      depositsEnabled &&
      validMethod &&
      validAmount &&
      validTransaction &&
      validReceipt &&
      !submitting
    );
  }, [
    amount,
    minimumDeposit,
    maximumDeposit,
    selectedMethod,
    transactionId,
    receiptRequired,
    receiptFile,
    receiptPreview,
    depositsEnabled,
    submitting,
  ]);

// =====================================================
// HELPER: PAYMENT METHOD DISPLAY NAME
// =====================================================

const getPaymentMethodName =
  useCallback(
    (method: PaymentMethod) => {
      if (
        method.title?.trim()
      ) {
        return method.title;
      }

      switch (
        String(
          method.method
        )
          .trim()
          .toUpperCase()
      ) {
        case "BANK":
          return "Bank Transfer";

        case "JAZZCASH":
          return "JazzCash";

        case "EASYPAISA":
          return "EasyPaisa";

        case "BINANCE":
          return "Binance USDT";

        case "USDT_BEP20":
          return "USDT BEP20";

        case "USDT_ERC20":
          return "USDT ERC20";

        default:
          return String(
            method.method || ""
          );
      }
    },
    []
  );

// =====================================================
// PAGE HEADER
// =====================================================

const DepositHeader = () => (
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-8">
    <div>
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 mb-3 transition"
      >
        <ArrowLeft size={18} />

        Back to Dashboard
      </button>

      <h1 className="text-4xl font-bold text-green-400">
        Deposit PKR
      </h1>

      <p className="text-gray-400 mt-2">
        Add funds into your GoldTrade PKR Wallet securely.
      </p>
    </div>

    <button
      type="button"
      onClick={refreshDepositPage}
      disabled={refreshing}
      className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black px-5 py-3 rounded-xl font-semibold transition"
    >
      <RefreshCw
        size={18}
        className={
          refreshing
            ? "animate-spin"
            : ""
        }
      />

      Refresh
    </button>
  </div>
);

// =====================================================
// WALLET SUMMARY CARD
// =====================================================

const WalletSummaryCard = () => (
  <div className="rounded-3xl bg-gradient-to-r from-green-500 via-emerald-500 to-green-400 text-black p-7 mb-8 shadow-xl">
    <div className="flex justify-between items-start">
      <div>
        <p className="uppercase tracking-widest text-sm font-semibold">
          Current PKR Wallet Balance
        </p>

        <h2 className="text-5xl font-bold mt-3">
          PKR {formatMoney(wallet.pkrBalance)}
        </h2>

        <p className="mt-3 text-black/70">
          Available Balance
        </p>
      </div>

      <Wallet size={42} />
    </div>
  </div>
);

// =====================================================
// DEPOSIT STATUS / SETTINGS NOTICE
// =====================================================

const DepositSettingsNotice = () => {
  if (
    depositsEnabled
  ) {
    return (
      <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-5 mb-8">
        <div className="flex items-start gap-3">
          <CheckCircle
            className="text-green-400 mt-1 shrink-0"
            size={22}
          />

          <div>
            <h3 className="font-bold text-green-400">
              PKR Deposits Available
            </h3>

            <p className="text-gray-300 text-sm mt-2">
              You can submit a deposit request using one of
              the available payment methods.
            </p>

            <div className="flex flex-wrap gap-4 mt-3 text-sm">
              <span className="text-gray-400">
                Minimum:
                <strong className="text-green-400 ml-1">
                  PKR {formatMoney(minimumDeposit)}
                </strong>
              </span>

              <span className="text-gray-400">
                Maximum:
                <strong className="text-green-400 ml-1">
                  PKR {formatMoney(maximumDeposit)}
                </strong>
              </span>

              <span className="text-gray-400">
                Receipt:
                <strong className="text-yellow-400 ml-1">
                  {receiptRequired
                    ? "Required"
                    : "Optional"}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-red-500/10 border border-red-500/40 p-6 mb-8">
      <div className="flex items-start gap-3">
        <AlertCircle
          className="text-red-400 mt-1 shrink-0"
          size={24}
        />

        <div>
          <h2 className="text-xl font-bold text-red-400">
            Deposits Currently Disabled
          </h2>

          <p className="text-gray-400 mt-2">
            PKR deposits are temporarily unavailable.
            Please try again later.
          </p>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// PAYMENT METHOD SELECTOR
// =====================================================

const PaymentMethodsSection = () => {
  if (
    paymentMethods.length === 0
  ) {
    return (
      <div className="rounded-2xl bg-[#111827] border border-red-500/40 p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="text-red-400 mt-1 shrink-0"
            size={24}
          />

          <div>
            <h2 className="text-xl font-bold text-red-400">
              No Payment Method Available
            </h2>

            <p className="text-gray-400 mt-2">
              No active payment method is currently available.
              Please contact support or try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-yellow-400">
            Select Payment Method
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Select the account where you sent your PKR payment.
          </p>
        </div>

        <span className="text-green-400 text-sm font-semibold">
          {paymentMethods.length} Available
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {paymentMethods.map(
          (method) => {
            const Icon =
              getMethodIcon(
                method.method
              );

            const active =
              selectedMethod?.method ===
              method.method;

            const displayAccount =
              method.accountNumber ||
              method.walletAddress ||
              "";

            return (
              <button
                type="button"
                key={
                  method._id ||
                  `${method.method}-${method.title}`
                }
                onClick={() =>
                  selectPaymentMethod(
                    method
                  )
                }
                disabled={
                  method.enabled !== true
                }
                className={`text-left rounded-2xl border p-5 transition ${
                  active
                    ? "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/5"
                    : "border-gray-700 hover:border-yellow-500 bg-[#0F172A]"
                } ${
                  method.enabled !== true
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                }`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Icon
                      className="text-yellow-400"
                      size={26}
                    />
                  </div>

                  {active && (
                    <CheckCircle
                      className="text-green-400"
                      size={24}
                    />
                  )}
                </div>

                <h3 className="font-bold text-lg text-white">
                  {getPaymentMethodName(
                    method
                  )}
                </h3>

                {method.accountTitle && (
                  <p className="text-gray-400 text-sm mt-2">
                    {method.accountTitle}
                  </p>
                )}

                {displayAccount && (
                  <p className="text-green-400 mt-2 font-semibold break-all">
                    {displayAccount}
                  </p>
                )}

                {method.bankName && (
                  <p className="text-gray-500 text-xs mt-2">
                    {method.bankName}
                  </p>
                )}

                {method.network && (
                  <p className="text-cyan-400 text-xs mt-2">
                    Network: {method.network}
                  </p>
                )}

                {method.iban && (
                  <p className="text-gray-500 text-xs mt-2 break-all">
                    IBAN: {method.iban}
                  </p>
                )}
              </button>
            );
          }
        )}
      </div>
    </div>
  );
};

// =====================================================
// SELECTED PAYMENT DETAILS
// =====================================================

const SelectedPaymentDetails = () => {
  if (
    !selectedMethod
  ) {
    return null;
  }

  const accountValue =
    selectedMethod.accountNumber ||
    selectedMethod.walletAddress ||
    "";

  return (
    <div className="rounded-2xl bg-[#111827] border border-green-500/20 p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-green-400">
            Payment Details
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Send your payment to the following account.
          </p>
        </div>

        <Shield
          className="text-green-400"
          size={24}
        />
      </div>

      <div className="space-y-5">
        {selectedMethod.accountTitle && (
          <div className="bg-[#1F2937] rounded-xl p-4">
            <p className="text-gray-400 text-sm">
              Account Title
            </p>

            <h3 className="font-semibold text-lg mt-1 text-white">
              {selectedMethod.accountTitle}
            </h3>
          </div>
        )}

        {accountValue && (
          <div className="flex justify-between items-center bg-[#1F2937] rounded-xl p-4 gap-4">
            <div className="min-w-0">
              <p className="text-gray-400 text-sm">
                {selectedMethod.walletAddress
                  ? "Wallet Address"
                  : "Account Number"}
              </p>

              <h3 className="text-green-400 text-lg font-bold mt-1 break-all">
                {accountValue}
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  accountValue
                )
              }
              className="shrink-0 bg-green-500 hover:bg-green-600 text-black p-3 rounded-lg transition"
              title="Copy"
            >
              <Copy size={18} />
            </button>
          </div>
        )}

        {selectedMethod.bankName && (
          <div className="bg-[#1F2937] rounded-xl p-4">
            <p className="text-gray-400 text-sm">
              Bank Name
            </p>

            <h3 className="text-white mt-1 font-semibold">
              {selectedMethod.bankName}
            </h3>
          </div>
        )}

        {selectedMethod.iban && (
          <div className="flex justify-between items-center bg-[#1F2937] rounded-xl p-4 gap-4">
            <div className="min-w-0">
              <p className="text-gray-400 text-sm">
                IBAN
              </p>

              <h3 className="text-white mt-1 font-medium break-all">
                {selectedMethod.iban}
              </h3>
            </div>

            <button
              type="button"
              onClick={() =>
                copyToClipboard(
                  selectedMethod.iban || ""
                )
              }
              className="shrink-0 bg-yellow-500 hover:bg-yellow-600 text-black p-3 rounded-lg transition"
              title="Copy IBAN"
            >
              <Copy size={18} />
            </button>
          </div>
        )}

        {selectedMethod.network && (
          <div className="bg-[#1F2937] rounded-xl p-4">
            <p className="text-gray-400 text-sm">
              Network
            </p>

            <h3 className="text-cyan-400 mt-1 font-semibold">
              {selectedMethod.network}
            </h3>
          </div>
        )}

        {selectedMethod.instructions && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-blue-400 text-sm font-semibold mb-2">
              Payment Instructions
            </p>

            <p className="text-gray-300 text-sm whitespace-pre-line">
              {selectedMethod.instructions}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================================
// DEPOSIT FORM
// =====================================================

const DepositFormSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">
    <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-green-400">
          Deposit Information
        </h2>

        <p className="text-gray-500 text-sm mt-1">
          Enter the exact amount and payment reference.
        </p>
      </div>

      <div className="text-left sm:text-right">
        <p className="text-gray-500 text-xs uppercase">
          Deposit Range
        </p>

        <p className="text-green-400 font-semibold mt-1">
          PKR {formatMoney(minimumDeposit)}
          {" - "}
          PKR {formatMoney(maximumDeposit)}
        </p>
      </div>
    </div>

    {/* ================================================
        AMOUNT
        ================================================ */}

    <div className="mb-6">
      <label
        htmlFor="deposit-amount"
        className="block text-gray-300 mb-2 font-medium"
      >
        Deposit Amount (PKR)
      </label>

      <div className="relative">
        <input
          id="deposit-amount"
          type="number"
          min={
            minimumDeposit > 0
              ? minimumDeposit
              : undefined
          }
          max={
            maximumDeposit > 0
              ? maximumDeposit
              : undefined
          }
          step="1"
          value={amount}
          disabled={
            !depositsEnabled ||
            submitting
          }
          onChange={(
            event
          ) => {
            setAmount(
              event.target.value
            );

            setErrorMessage("");

            setSuccessMessage("");
          }}
          placeholder="Enter amount"
          className="w-full bg-[#1F2937] border border-gray-600 rounded-xl p-4 pr-20 text-white outline-none focus:border-green-400 disabled:opacity-50"
        />

        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
          PKR
        </span>
      </div>
    </div>

    {/* ================================================
        QUICK AMOUNTS
        ================================================ */}

    {quickAmounts.length > 0 && (
      <div className="mb-8">
        <p className="text-gray-400 text-sm mb-3">
          Quick Amount
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {quickAmounts.map(
            (item) => (
              <button
                type="button"
                key={item}
                disabled={
                  !depositsEnabled ||
                  submitting
                }
                onClick={() =>
                  selectQuickAmount(
                    item
                  )
                }
                className="bg-[#1F2937] hover:bg-green-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3 font-semibold transition border border-gray-700 hover:border-green-400"
              >
                {item.toLocaleString(
                  "en-PK"
                )}
              </button>
            )
          )}
        </div>
      </div>
    )}

    {/* ================================================
        TRANSACTION ID
        ================================================ */}

    <div className="mb-6">
      <label
        htmlFor="transaction-id"
        className="block text-gray-300 mb-2 font-medium"
      >
        Transaction ID / Reference Number
      </label>

      <input
        id="transaction-id"
        type="text"
        maxLength={150}
        value={transactionId}
        disabled={
          !depositsEnabled ||
          submitting
        }
        onChange={(
          event
        ) => {
          setTransactionId(
            event.target.value
          );

          setErrorMessage("");

          setSuccessMessage("");
        }}
        placeholder="Enter transaction/reference ID"
        className="w-full bg-[#1F2937] border border-gray-600 rounded-xl p-4 text-white outline-none focus:border-yellow-400 disabled:opacity-50"
      />

      <p className="text-gray-500 text-xs mt-2">
        Enter the transaction/reference number exactly as shown on your payment receipt.
      </p>
    </div>

    {/* ================================================
        SETTINGS INFORMATION
        ================================================ */}

    <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">
      <div className="flex gap-3 items-start">
        <AlertCircle
          className="text-yellow-400 mt-1 shrink-0"
          size={20}
        />

        <div className="text-sm text-gray-300 space-y-2">
          <p>
            Minimum Deposit:
            <span className="text-green-400 font-semibold ml-1">
              PKR {formatMoney(minimumDeposit)}
            </span>
          </p>

          <p>
            Maximum Deposit:
            <span className="text-green-400 font-semibold ml-1">
              PKR {formatMoney(maximumDeposit)}
            </span>
          </p>

          <p>
            Receipt:
            <span className="text-yellow-400 font-semibold ml-1">
              {receiptRequired
                ? "Required"
                : "Optional"}
            </span>
          </p>

          <p className="text-gray-400 pt-1">
            Your deposit request will remain pending until
            Admin verifies the payment.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// =====================================================
// QR PAYMENT CARD
// =====================================================

const QRPaymentCard = () => {
  if (
    !selectedMethod
  ) {
    return null;
  }

  const accountValue =
    selectedMethod.accountNumber ||
    selectedMethod.walletAddress ||
    "";

  return (
    <div className="rounded-2xl bg-[#111827] border border-cyan-500/20 p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400">
            Scan QR & Pay
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Scan the QR code if one is available.
          </p>
        </div>

        <Shield
          className="text-cyan-400"
          size={24}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* QR */}
        <div className="w-56 h-56 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0">
          {selectedMethod.qrImage ||
          selectedMethod.qrCode ? (
            <img
              src={
                selectedMethod.qrImage ||
                selectedMethod.qrCode ||
                ""
              }
              alt={`${getPaymentMethodName(
                selectedMethod
              )} payment QR`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center text-gray-500 px-4">
              <ImageIcon
                size={48}
                className="mx-auto mb-2"
              />

              <p className="text-sm">
                QR Not Available
              </p>
            </div>
          )}
        </div>

        {/* DETAILS */}
        <div className="flex-1 space-y-4 w-full">
          <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">
              Payment Method
            </p>

            <h3 className="text-xl font-semibold text-white mt-1">
              {getPaymentMethodName(
                selectedMethod
              )}
            </h3>
          </div>

          {selectedMethod.accountTitle && (
            <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">
              <p className="text-gray-400 text-sm">
                Account Title
              </p>

              <h3 className="text-green-400 font-semibold mt-1">
                {selectedMethod.accountTitle}
              </h3>
            </div>
          )}

          {accountValue && (
            <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700 flex justify-between items-center gap-4">
              <div className="min-w-0">
                <p className="text-gray-400 text-sm">
                  {selectedMethod.walletAddress
                    ? "Wallet Address"
                    : "Account Number"}
                </p>

                <h3 className="text-white font-semibold mt-1 break-all">
                  {accountValue}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    accountValue
                  )
                }
                className="shrink-0 bg-green-500 hover:bg-green-600 text-black p-3 rounded-lg transition"
                title="Copy"
              >
                <Copy size={18} />
              </button>
            </div>
          )}

          {selectedMethod.iban && (
            <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700 flex justify-between items-center gap-4">
              <div className="min-w-0">
                <p className="text-gray-400 text-sm">
                  IBAN
                </p>

                <h3 className="text-white font-semibold mt-1 break-all">
                  {selectedMethod.iban}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    selectedMethod.iban || ""
                  )
                }
                className="shrink-0 bg-yellow-500 hover:bg-yellow-600 text-black p-3 rounded-lg transition"
                title="Copy IBAN"
              >
                <Copy size={18} />
              </button>
            </div>
          )}

          {selectedMethod.network && (
            <div className="bg-[#1F2937] rounded-xl p-4 border border-cyan-500/20">
              <p className="text-gray-400 text-sm">
                Network
              </p>

              <h3 className="text-cyan-400 font-semibold mt-1">
                {selectedMethod.network}
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// RECEIPT UPLOAD
// =====================================================

const ReceiptUploadSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">
    <div className="flex flex-col sm:flex-row justify-between gap-3 mb-6">
      <div>
        <h2 className="text-2xl font-bold text-yellow-400">
          Upload Payment Receipt
        </h2>

        <p className="text-gray-500 text-sm mt-1">
          {receiptRequired
            ? "A payment receipt is required."
            : "You may upload a payment receipt if available."}
        </p>
      </div>

      {receiptRequired && (
        <span className="text-xs text-yellow-400 border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 rounded-full h-fit">
          Required
        </span>
      )}
    </div>

    <label
      className={`cursor-pointer block border-2 border-dashed rounded-2xl p-8 transition ${
        submitting ||
        !depositsEnabled
          ? "border-gray-700 opacity-50 cursor-not-allowed"
          : "border-gray-600 hover:border-yellow-400"
      }`}
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        disabled={
          submitting ||
          !depositsEnabled
        }
        onChange={
          handleReceiptChange
        }
      />

      <div className="flex flex-col items-center text-center">
        <Upload
          className="text-yellow-400 mb-4"
          size={44}
        />

        <p className="text-white font-semibold">
          Click here to upload receipt
        </p>

        <p className="text-gray-500 text-sm mt-2">
          JPG / JPEG / PNG only • Max Size 5 MB
        </p>
      </div>
    </label>

    {receiptPreview && (
      <div className="mt-6">
        <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center mb-3">
          <div>
            <h3 className="text-green-400 font-semibold">
              Receipt Preview
            </h3>

            {receiptFile && (
              <p className="text-gray-500 text-xs mt-1">
                {receiptFile.name}
                {" • "}
                {formatFileSize(
                  receiptFile.size
                )}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                setPreviewReceipt(
                  receiptPreview
                )
              }
              className="text-cyan-400 hover:text-cyan-300 text-sm transition"
            >
              View Full
            </button>

            <button
              type="button"
              onClick={
                removeReceipt
              }
              disabled={
                submitting
              }
              className="text-red-400 hover:text-red-300 disabled:opacity-50 text-sm transition"
            >
              Remove
            </button>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-green-500/20 bg-black">
          <img
            src={receiptPreview}
            alt="Payment receipt preview"
            className="w-full object-contain max-h-[450px]"
          />
        </div>
      </div>
    )}
  </div>
);

// =====================================================
// SUBMIT DEPOSIT SECTION
// =====================================================

const SubmitDepositSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-green-500/20 p-6 mb-8">
    <div className="space-y-4">

      {/* =================================================
          DEPOSIT SUMMARY
          ================================================= */}

      <div className="grid md:grid-cols-3 gap-4">

        {/* AMOUNT */}
        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">
            Deposit Amount
          </p>

          <h3 className="text-green-400 text-xl font-bold mt-1">
            PKR{" "}
            {formatMoney(
              Number(
                String(amount || "")
                  .replace(/,/g, "")
                  .trim() || 0
              )
            )}
          </h3>
        </div>

        {/* PAYMENT METHOD */}
        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">
            Payment Method
          </p>

          <h3 className="text-white text-lg font-semibold mt-1">
            {selectedMethod
              ? getPaymentMethodName(
                  selectedMethod
                )
              : "Select Method"}
          </h3>
        </div>

        {/* TRANSACTION ID */}
        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">
            Transaction ID
          </p>

          <h3 className="text-cyan-400 text-lg font-semibold mt-1 break-all">
            {transactionId.trim() ||
              "Not Entered"}
          </h3>
        </div>
      </div>

      {/* =================================================
          VALIDATION SUMMARY
          ================================================= */}

      <div className="grid sm:grid-cols-2 gap-4">

        <div className="rounded-xl bg-[#1F2937] border border-gray-700 p-4">
          <p className="text-gray-500 text-xs uppercase">
            Deposit Range
          </p>

          <p className="text-gray-200 font-semibold mt-1">
            PKR {formatMoney(minimumDeposit)}
            {" - "}
            PKR {formatMoney(maximumDeposit)}
          </p>
        </div>

        <div className="rounded-xl bg-[#1F2937] border border-gray-700 p-4">
          <p className="text-gray-500 text-xs uppercase">
            Receipt
          </p>

          <p
            className={`font-semibold mt-1 ${
              receiptFile
                ? "text-green-400"
                : receiptRequired
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
          >
            {receiptFile
              ? "Uploaded"
              : receiptRequired
              ? "Required"
              : "Optional"}
          </p>
        </div>
      </div>

      {/* =================================================
          IMPORTANT WORKFLOW
          ================================================= */}

      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
        <div className="flex gap-3 items-start">

          <Shield
            className="text-blue-400 mt-1 shrink-0"
            size={20}
          />

          <div className="text-sm text-gray-300">
            <p>
              After submission, your deposit request will
              be marked as
              <span className="text-yellow-400 font-semibold">
                {" "}PENDING
              </span>
              .
            </p>

            <p className="mt-1">
              Admin will manually verify your payment
              before approving or rejecting the request.
            </p>

            <p className="mt-1 text-gray-500">
              Wallet credit is processed according to the
              backend approval process.
            </p>
          </div>
        </div>
      </div>

      {/* =================================================
          DEPOSIT DISABLED WARNING
          ================================================= */}

      {!depositsEnabled && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle
              className="text-red-400 shrink-0"
              size={21}
            />

            <p className="text-red-300 text-sm">
              Deposits are currently disabled.
            </p>
          </div>
        </div>
      )}

      {/* =================================================
          BUTTONS
          ================================================= */}

      <div className="grid md:grid-cols-2 gap-4 pt-2">

        {/* SUBMIT */}
        <button
          type="button"
          onClick={submitDeposit}
          disabled={
            submitting ||
            !depositsEnabled ||
            !selectedMethod ||
            !isDepositReady
          }
          className="bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg transition flex justify-center items-center gap-3"
        >
          {submitting ? (
            <>
              <Loader2
                size={20}
                className="animate-spin"
              />

              Submitting Deposit...
            </>
          ) : (
            <>
              <Upload size={20} />

              Submit Deposit
            </>
          )}
        </button>

        {/* CLEAR */}
        <button
          type="button"
          onClick={clearForm}
          disabled={submitting}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg transition"
        >
          Clear Form
        </button>
      </div>

      {/* =================================================
          READY STATUS
          ================================================= */}

      <div className="flex items-center justify-center gap-2 pt-2">

        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isDepositReady
              ? "bg-green-400"
              : "bg-gray-600"
          }`}
        />

        <p
          className={`text-xs ${
            isDepositReady
              ? "text-green-400"
              : "text-gray-500"
          }`}
        >
          {isDepositReady
            ? "Deposit is ready to submit."
            : "Complete all required fields before submitting."}
        </p>
      </div>
    </div>
  </div>
);

// =====================================================
// LOADING OVERLAY
// =====================================================

const LoadingOverlay = () => {
  if (!loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-[#111827] rounded-3xl border border-yellow-500/30 px-8 py-7 flex flex-col items-center gap-4 max-w-sm w-full">

        <Loader2
          className="animate-spin text-yellow-400"
          size={42}
        />

        <h2 className="text-yellow-400 text-xl font-bold text-center">
          Loading Deposit Page...
        </h2>

        <p className="text-gray-400 text-center text-sm">
          Connecting to GoldTrade Enterprise Wallet
        </p>
      </div>
    </div>
  );
};

// =====================================================
// DEPOSIT STATISTICS
// =====================================================

const DepositStatisticsSection = () => (
  <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

    {/* TOTAL */}
    <div className="rounded-2xl bg-[#111827] border border-cyan-500/20 p-5">
      <div className="flex justify-between items-center mb-4">

        <Wallet
          className="text-cyan-400"
          size={28}
        />

        <span className="text-xs text-cyan-400 font-semibold uppercase">
          Total
        </span>
      </div>

      <p className="text-gray-400 text-sm">
        Deposit Requests
      </p>

      <h2 className="text-3xl font-bold text-cyan-400 mt-3">
        {depositSummary.totalRequests}
      </h2>

      <p className="text-gray-500 text-xs mt-2">
        PKR{" "}
        {formatMoney(
          depositSummary.totalRequestedAmount
        )}
      </p>
    </div>

    {/* APPROVED */}
    <div className="rounded-2xl bg-[#111827] border border-green-500/20 p-5">
      <div className="flex justify-between items-center mb-4">

        <CheckCircle
          className="text-green-400"
          size={28}
        />

        <span className="text-xs text-green-400 font-semibold uppercase">
          Approved
        </span>
      </div>

      <p className="text-gray-400 text-sm">
        Approved Deposits
      </p>

      <h2 className="text-3xl font-bold text-green-400 mt-3">
        {approvedDeposits}
      </h2>

      <p className="text-green-300 text-sm mt-3">
        PKR{" "}
        {formatMoney(
          depositSummary.totalApprovedAmount
        )}
      </p>
    </div>

    {/* PENDING */}
    <div className="rounded-2xl bg-[#111827] border border-yellow-500/20 p-5">
      <div className="flex justify-between items-center mb-4">

        <Loader2
          className="text-yellow-400"
          size={28}
        />

        <span className="text-xs text-yellow-400 font-semibold uppercase">
          Pending
        </span>
      </div>

      <p className="text-gray-400 text-sm">
        Pending Deposits
      </p>

      <h2 className="text-3xl font-bold text-yellow-400 mt-3">
        {pendingDeposits}
      </h2>

      <p className="text-yellow-300 text-sm mt-3">
        PKR{" "}
        {formatMoney(
          depositSummary.totalPendingAmount
        )}
      </p>
    </div>

    {/* WALLET */}
    <div className="rounded-2xl bg-[#111827] border border-purple-500/20 p-5">
      <div className="flex justify-between items-center mb-4">

        <Shield
          className="text-purple-400"
          size={28}
        />

        <span className="text-xs text-purple-400 font-semibold uppercase">
          Wallet
        </span>
      </div>

      <p className="text-gray-400 text-sm">
        Current Balance
      </p>

      <h2 className="text-3xl font-bold text-purple-400 mt-3">
        PKR {formatMoney(wallet.pkrBalance)}
      </h2>
    </div>
  </div>
);

// =====================================================
// DEPOSIT HISTORY HEADER
// =====================================================

const DepositHistoryHeader = () => (
  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 mb-6">

    <div>
      <h2 className="text-3xl font-bold text-yellow-400">
        Deposit History
      </h2>

      <p className="text-gray-400 mt-2">
        View your deposit requests and their approval status.
      </p>
    </div>

    <button
      type="button"
      onClick={refreshDepositPage}
      disabled={refreshing}
      className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black px-5 py-3 rounded-xl font-semibold transition"
    >
      <RefreshCw
        size={18}
        className={
          refreshing
            ? "animate-spin"
            : ""
        }
      />

      Refresh History
    </button>
  </div>
);

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({
  status,
}: {
  status: string;
}) => {
  const color =
    getStatusColor(
      status
    );

  return (
    <span
      className={`inline-flex items-center justify-center px-4 py-2 rounded-full border text-xs font-bold ${color}`}
    >
      {String(status || "UNKNOWN").toUpperCase()}
    </span>
  );
};

// =====================================================
// HISTORY SUMMARY STRIP
// =====================================================

const HistorySummaryStrip = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">

      {/* TOTAL */}
      <div>
        <p className="text-gray-400 text-xs uppercase">
          Total Deposits
        </p>

        <h3 className="text-cyan-400 text-2xl font-bold mt-2">
          {depositSummary.totalRequests}
        </h3>
      </div>

      {/* APPROVED */}
      <div>
        <p className="text-gray-400 text-xs uppercase">
          Approved Amount
        </p>

        <h3 className="text-green-400 text-xl font-bold mt-2">
          PKR{" "}
          {formatMoney(
            depositSummary.totalApprovedAmount
          )}
        </h3>
      </div>

      {/* PENDING */}
      <div>
        <p className="text-gray-400 text-xs uppercase">
          Pending Amount
        </p>

        <h3 className="text-yellow-400 text-xl font-bold mt-2">
          PKR{" "}
          {formatMoney(
            depositSummary.totalPendingAmount
          )}
        </h3>
      </div>

      {/* WALLET */}
      <div>
        <p className="text-gray-400 text-xs uppercase">
          Wallet Balance
        </p>

        <h3 className="text-purple-400 text-xl font-bold mt-2">
          PKR{" "}
          {formatMoney(
            wallet.pkrBalance
          )}
        </h3>
      </div>

    </div>
  </div>
);

// =====================================================
// EMPTY HISTORY
// =====================================================

const EmptyHistoryCard = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 py-16 px-6 text-center">

    <Wallet
      className="mx-auto text-gray-500 mb-5"
      size={56}
    />

    <h2 className="text-2xl font-bold text-gray-300">
      No Deposit History Found
    </h2>

    <p className="text-gray-500 mt-3">
      Your submitted deposit requests will appear here.
    </p>

    <button
      type="button"
      onClick={refreshDepositPage}
      disabled={refreshing}
      className="mt-6 inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-60 text-black px-5 py-3 rounded-xl font-semibold transition"
    >
      <RefreshCw
        size={17}
        className={
          refreshing
            ? "animate-spin"
            : ""
        }
      />

      Refresh
    </button>
  </div>
);

// =====================================================
// ACTIVITY INFORMATION
// =====================================================

const DepositActivityInfo = () => (
  <div className="rounded-2xl bg-[#111827] border border-blue-500/20 p-6 mb-8">

    <div className="flex items-start gap-4">

      <AlertCircle
        className="text-blue-400 mt-1 shrink-0"
        size={22}
      />

      <div>
        <h3 className="text-blue-400 font-bold text-lg mb-3">
          Deposit Approval Process
        </h3>

        <ul className="space-y-2 text-gray-300 text-sm">

          <li>
            • Send the payment using the selected payment method.
          </li>

          <li>
            • Enter the exact amount you paid.
          </li>

          <li>
            • Enter the correct transaction/reference ID.
          </li>

          <li>
            • Upload a clear payment receipt screenshot.
          </li>

          <li>
            • Admin will manually verify and Approve or Reject the request.
          </li>

          <li>
            • Wallet credit occurs after approval according to the backend approval process.
          </li>

        </ul>
      </div>
    </div>
  </div>
);

// =====================================================
// RECEIPT PREVIEW MODAL
// =====================================================

const ReceiptPreviewModal = () => {
  if (
    !previewReceipt
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">

      <div className="relative bg-[#111827] rounded-3xl border border-gray-700 max-w-3xl w-full overflow-hidden shadow-2xl">

        {/* CLOSE */}
        <button
          type="button"
          onClick={() =>
            setPreviewReceipt(
              null
            )
          }
          className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition"
          aria-label="Close receipt preview"
        >
          ✕
        </button>

        {/* IMAGE */}
        <div className="p-2 bg-black">
          <img
            src={previewReceipt}
            alt="Deposit Receipt"
            className="w-full max-h-[80vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
};

// =====================================================
// STATUS TIMELINE
// =====================================================

const DepositStatusTimeline = ({
  status,
}: {
  status: string;
}) => {
  const normalized =
    String(
      status || ""
    )
      .trim()
      .toUpperCase();

  const approved =
    normalized === "APPROVED";

  const rejected =
    normalized === "REJECTED";

  const pending =
    normalized === "PENDING";

  return (
    <div className="flex items-center gap-2">

      <div
        className={`w-3 h-3 rounded-full ${
          pending
            ? "bg-yellow-400"
            : approved
            ? "bg-green-400"
            : rejected
            ? "bg-red-400"
            : "bg-gray-600"
        }`}
      />

      <div className="h-[2px] w-10 bg-gray-600" />

      <div
        className={`w-3 h-3 rounded-full ${
          approved
            ? "bg-green-400"
            : rejected
            ? "bg-red-400"
            : "bg-gray-600"
        }`}
      />

      <div className="h-[2px] w-10 bg-gray-600" />

      <div
        className={`w-3 h-3 rounded-full ${
          rejected
            ? "bg-red-400"
            : approved
            ? "bg-green-400"
            : "bg-gray-600"
        }`}
      />

    </div>
  );
};

// =====================================================
// SINGLE HISTORY CARD
// =====================================================

const DepositHistoryCard = ({
  item,
}: {
  item: DepositHistory;
}) => {
  const receipt =
    item.receipt ||
    item.receiptImage ||
    item.screenshot ||
    "";

  return (
    <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-4">

      {/* HEADER */}
      <div className="flex justify-between items-start gap-4 mb-4">

        <div className="min-w-0">
          <p className="text-gray-400 text-xs uppercase">
            {item.paymentMethod ||
              "Payment"}
          </p>

          <h3 className="text-green-400 text-xl font-bold mt-1">
            PKR{" "}
            {formatMoney(
              item.amount
            )}
          </h3>
        </div>

        <StatusBadge
          status={
            item.status
          }
        />
      </div>

      {/* DETAILS */}
      <div className="space-y-3 text-sm">

        <div>
          <p className="text-gray-500">
            Transaction ID
          </p>

          <p className="text-white break-all mt-1">
            {item.transactionId ||
              "--"}
          </p>
        </div>

        <div>
          <p className="text-gray-500">
            Submitted
          </p>

          <p className="text-white mt-1">
            {formatDate(
              item.createdAt
            )}
          </p>
        </div>

        <DepositStatusTimeline
          status={
            item.status
          }
        />

        {/* ADMIN NOTE */}
        {(item.adminNote ||
          item.note ||
          item.rejectReason) && (
          <div className="rounded-xl bg-[#1F2937] p-3 border border-gray-700">

            <p className="text-gray-500 text-xs">
              Admin Note
            </p>

            <p className="text-gray-300 mt-1">
              {item.adminNote ||
                item.note ||
                item.rejectReason}
            </p>

          </div>
        )}

        {/* RECEIPT */}
        {receipt && (
          <button
            type="button"
            onClick={() =>
              setPreviewReceipt(
                receipt
              )
            }
            className="mt-3 w-full bg-[#1F2937] hover:bg-[#374151] border border-gray-600 rounded-xl py-3 flex items-center justify-center gap-2 transition"
          >
            <ImageIcon
              size={18}
            />

            View Receipt
          </button>
        )}

      </div>
    </div>
  );
};

// =====================================================
// PART 6/10
// DESKTOP HISTORY TABLE
// =====================================================

const DepositHistoryTable = () => {
  if (depositHistory.length === 0) {
    return <EmptyHistoryCard />;
  }

  return (
    <div className="rounded-2xl bg-[#111827] border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#1F2937] text-gray-300 text-sm uppercase">
            <tr>
              <th className="text-left px-5 py-4">
                Amount
              </th>

              <th className="text-left px-5 py-4">
                Method
              </th>

              <th className="text-left px-5 py-4">
                Transaction ID
              </th>

              <th className="text-left px-5 py-4">
                Status
              </th>

              <th className="text-left px-5 py-4">
                Receipt
              </th>

              <th className="text-left px-5 py-4">
                Date
              </th>
            </tr>
          </thead>

          <tbody>
            {depositHistory.map((item) => {
              const receipt =
                item.receipt ||
                item.receiptImage ||
                "";

              return (
                <tr
                  key={item._id}
                  className="border-t border-gray-700 hover:bg-[#182233] transition"
                >
                  {/* ============================= */}
                  {/* AMOUNT */}
                  {/* ============================= */}

                  <td className="px-5 py-5 whitespace-nowrap">
                    <p className="font-bold text-green-400 text-lg">
                      PKR{" "}
                      {formatMoney(item.amount)}
                    </p>
                  </td>

                  {/* ============================= */}
                  {/* PAYMENT METHOD */}
                  {/* ============================= */}

                  <td className="px-5 py-5 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                      {item.paymentMethod}
                    </span>
                  </td>

                  {/* ============================= */}
                  {/* TRANSACTION ID */}
                  {/* ============================= */}

                  <td className="px-5 py-5">
                    <p className="text-white font-medium break-all">
                      {item.transactionId || "--"}
                    </p>
                  </td>

                  {/* ============================= */}
                  {/* STATUS */}
                  {/* ============================= */}

                  <td className="px-5 py-5">
                    <div className="space-y-2">
                      <StatusBadge
                        status={item.status}
                      />

                      <DepositStatusTimeline
                        status={item.status}
                      />
                    </div>
                  </td>

                  {/* ============================= */}
                  {/* RECEIPT */}
                  {/* ============================= */}

                  <td className="px-5 py-5">
                    {receipt ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewReceipt(receipt)
                        }
                        className="bg-[#1F2937] hover:bg-[#374151] border border-gray-600 rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition"
                      >
                        <ImageIcon size={16} />

                        View
                      </button>
                    ) : (
                      <span className="text-gray-500 text-sm">
                        No Receipt
                      </span>
                    )}
                  </td>

                  {/* ============================= */}
                  {/* DATE */}
                  {/* ============================= */}

                  <td className="px-5 py-5 whitespace-nowrap">
                    <p className="text-gray-400 text-sm">
                      {formatDate(item.createdAt)}
                    </p>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// =====================================================
// RESPONSIVE HISTORY SECTION
// =====================================================

const DepositHistorySection = () => (
  <div className="mb-10">

    {/* ============================= */}
    {/* HISTORY HEADER */}
    {/* ============================= */}

    <DepositHistoryHeader />

    {/* ============================= */}
    {/* SUMMARY */}
    {/* ============================= */}

    <HistorySummaryStrip />

    {/* ============================= */}
    {/* DESKTOP TABLE */}
    {/* ============================= */}

    <div className="hidden lg:block">
      <DepositHistoryTable />
    </div>

    {/* ============================= */}
    {/* MOBILE CARDS */}
    {/* ============================= */}

    <div className="lg:hidden">
      {depositHistory.length === 0 ? (
        <EmptyHistoryCard />
      ) : (
        depositHistory.map((item) => (
          <DepositHistoryCard
            key={item._id}
            item={item}
          />
        ))
      )}
    </div>

    {/* ============================= */}
    {/* RECEIPT PREVIEW */}
    {/* ============================= */}

    <ReceiptPreviewModal />
  </div>
);


// =====================================================
// DEPOSIT STATUS LEGEND
// =====================================================

const DepositStatusLegend = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">

    <h3 className="text-xl font-bold text-yellow-400 mb-5">
      Deposit Status Guide
    </h3>

    <div className="space-y-4">

      {/* ============================= */}
      {/* PENDING */}
      {/* ============================= */}

      <div className="flex items-center gap-4">
        <div className="w-4 h-4 rounded-full bg-yellow-400 shrink-0" />

        <div>
          <p className="font-semibold text-yellow-400">
            Pending
          </p>

          <p className="text-gray-400 text-sm">
            Waiting for Admin verification.
          </p>
        </div>
      </div>

      {/* ============================= */}
      {/* APPROVED */}
      {/* ============================= */}

      <div className="flex items-center gap-4">
        <div className="w-4 h-4 rounded-full bg-green-400 shrink-0" />

        <div>
          <p className="font-semibold text-green-400">
            Approved
          </p>

          <p className="text-gray-400 text-sm">
            Admin approved the deposit and the
            corresponding wallet credit is processed.
          </p>
        </div>
      </div>

      {/* ============================= */}
      {/* REJECTED */}
      {/* ============================= */}

      <div className="flex items-center gap-4">
        <div className="w-4 h-4 rounded-full bg-red-400 shrink-0" />

        <div>
          <p className="font-semibold text-red-400">
            Rejected
          </p>

          <p className="text-gray-400 text-sm">
            Admin rejected the deposit request.
          </p>
        </div>
      </div>

    </div>
  </div>
);


// =====================================================
// SUCCESS / ERROR ALERTS
// =====================================================

const MessageAlerts = () => (
  <>
    {/* ============================= */}
    {/* SUCCESS MESSAGE */}
    {/* ============================= */}

    {successMessage && (
      <div className="mb-6 rounded-xl border border-green-500 bg-green-500/10 p-4 flex items-center gap-3">

        <CheckCircle
          className="text-green-400 shrink-0"
          size={22}
        />

        <p className="text-green-300">
          {successMessage}
        </p>
      </div>
    )}

    {/* ============================= */}
    {/* ERROR MESSAGE */}
    {/* ============================= */}

    {errorMessage && (
      <div className="mb-6 rounded-xl border border-red-500 bg-red-500/10 p-4 flex items-center gap-3">

        <AlertCircle
          className="text-red-400 shrink-0"
          size={22}
        />

        <p className="text-red-300">
          {errorMessage}
        </p>
      </div>
    )}
  </>
);


// =====================================================
// SUCCESS TOAST
// =====================================================

const SuccessToast = () => {
  if (!successMessage) {
    return null;
  }

  return (
    <div className="fixed top-6 right-6 z-[999] max-w-md bg-green-600 text-white rounded-2xl shadow-2xl px-5 py-4 border border-green-400 flex items-start gap-3">

      <CheckCircle
        size={22}
        className="text-white shrink-0 mt-0.5"
      />

      <div>
        <p className="font-bold">
          Deposit Submitted
        </p>

        <p className="text-sm text-green-100 mt-1">
          {successMessage}
        </p>
      </div>
    </div>
  );
};


// =====================================================
// ERROR TOAST
// =====================================================

const ErrorToast = () => {
  if (!errorMessage) {
    return null;
  }

  return (
    <div className="fixed top-24 right-6 z-[999] max-w-md bg-red-600 text-white rounded-2xl shadow-2xl px-5 py-4 border border-red-400 flex items-start gap-3">

      <AlertCircle
        size={22}
        className="text-white shrink-0 mt-0.5"
      />

      <div>
        <p className="font-bold">
          Deposit Error
        </p>

        <p className="text-sm text-red-100 mt-1">
          {errorMessage}
        </p>
      </div>
    </div>
  );
};


// =====================================================
// PART 7/10
// DEPOSIT FOOTER
// =====================================================

const DepositFooter = () => (
  <footer className="mt-16 border-t border-gray-800 pt-8 pb-10">

    <div className="grid md:grid-cols-2 gap-8">

      {/* ============================= */}
      {/* BRAND / DESCRIPTION */}
      {/* ============================= */}

      <div>
        <h2 className="text-yellow-400 font-bold text-xl">
          GoldTrade Enterprise
        </h2>

        <p className="text-gray-400 mt-3 text-sm leading-6">
          Deposit PKR securely into your GoldTrade Wallet.
          Every deposit request is reviewed before wallet
          credit is processed.
        </p>
      </div>

      {/* ============================= */}
      {/* SECURITY / PROCESS FEATURES */}
      {/* ============================= */}

      <div className="space-y-3 text-sm">

        <div className="flex items-center gap-3 text-green-400">
          <Shield size={18} />

          <span>
            JWT Protected Deposit System
          </span>
        </div>

        <div className="flex items-center gap-3 text-cyan-400">
          <Wallet size={18} />

          <span>
            PKR Wallet Credit After Admin Approval
          </span>
        </div>

        <div className="flex items-center gap-3 text-yellow-400">
          <CheckCircle size={18} />

          <span>
            Manual Payment Verification
          </span>
        </div>

        <div className="flex items-center gap-3 text-purple-400">
          <RefreshCw size={18} />

          <span>
            Live Wallet Synchronization
          </span>
        </div>

      </div>
    </div>

    {/* ============================= */}
    {/* COPYRIGHT */}
    {/* ============================= */}

    <div className="border-t border-gray-800 mt-8 pt-5 text-center text-gray-500 text-sm">

      <p>
        © {new Date().getFullYear()} GoldTrade Enterprise
      </p>

      <div className="mt-2">
        Powered by Flex.inc
      </div>

    </div>
  </footer>
);


// =====================================================
// FINAL PAGE RETURN
// =====================================================

return (
  <main className="min-h-screen bg-[#0B1120] text-white">

    {/* ================================================= */}
    {/* LOADING OVERLAY */}
    {/* ================================================= */}

    <LoadingOverlay />

    {/* ================================================= */}
    {/* SUCCESS TOAST */}
    {/* ================================================= */}

    <SuccessToast />

    {/* ================================================= */}
    {/* ERROR TOAST */}
    {/* ================================================= */}

    <ErrorToast />

    {/* ================================================= */}
    {/* MAIN CONTAINER */}
    {/* ================================================= */}

    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

      {/* ================================================= */}
      {/* PAGE HEADER */}
      {/* ================================================= */}

      <DepositHeader />

      {/* ================================================= */}
      {/* WALLET SUMMARY */}
      {/* ================================================= */}

      <WalletSummaryCard />

      {/* ================================================= */}
      {/* ALERTS */}
      {/* ================================================= */}

      <MessageAlerts />

      {/* ================================================= */}
      {/* PAYMENT METHODS */}
      {/* ================================================= */}

      <PaymentMethodsSection />

      {/* ================================================= */}
      {/* SELECTED PAYMENT DETAILS */}
      {/* ================================================= */}

      <SelectedPaymentDetails />

      {/* ================================================= */}
      {/* QR PAYMENT */}
      {/* ================================================= */}

      <QRPaymentCard />

      {/* ================================================= */}
      {/* DEPOSIT FORM */}
      {/* ================================================= */}

      <DepositFormSection />

      {/* ================================================= */}
      {/* RECEIPT UPLOAD */}
      {/* ================================================= */}

      <ReceiptUploadSection />

      {/* ================================================= */}
      {/* SUBMIT DEPOSIT */}
      {/* ================================================= */}

      <SubmitDepositSection />

      {/* ================================================= */}
      {/* STATISTICS */}
      {/* ================================================= */}

      <DepositStatisticsSection />

      {/* ================================================= */}
      {/* PROCESS INFORMATION */}
      {/* ================================================= */}

      <DepositActivityInfo />

      {/* ================================================= */}
      {/* STATUS GUIDE */}
      {/* ================================================= */}

      <DepositStatusLegend />

      {/* ================================================= */}
      {/* DEPOSIT HISTORY */}
      {/* ================================================= */}

      <DepositHistorySection />

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <DepositFooter />

    </div>
  </main>
);


return (
  <main className="min-h-screen bg-[#0B1120] text-white">

    <LoadingOverlay />

    <SuccessToast />

    <ErrorToast />

    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

      <DepositHeader />

      <WalletSummaryCard />

      <MessageAlerts />

      <PaymentMethodsSection />

      <SelectedPaymentDetails />

      <QRPaymentCard />

      <DepositFormSection />

      <ReceiptUploadSection />

      <SubmitDepositSection />

      <DepositStatisticsSection />

      <DepositActivityInfo />

      <DepositStatusLegend />

      <DepositHistorySection />

      <DepositFooter />

    </div>
  </main>
);
}


// =====================================================
// PAGE COMPLETE
// =====================================================