"use client";

// =====================================================
// GoldTrade V18 Enterprise
// Deposit PKR Page
// PART 1/3
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
// API URL
// =====================================================

const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com";

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
  | "USDT_ERC20";

interface PaymentMethod {
  _id?: string;

  method: PaymentMethodType | string;

  title: string;

  accountTitle: string;

  accountNumber: string;

  iban?: string;

  bankName?: string;

  walletAddress?: string;

  network?: string;

  qrImage?: string;

  enabled: boolean;
}

type DepositStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "Pending"
  | "Approved"
  | "Rejected";

interface DepositHistory {
  _id: string;

  amount: number;

  paymentMethod: string;

  transactionId: string;

  status: DepositStatus;

  createdAt: string;

  receipt?: string;

  receiptImage?: string;

  adminNote?: string;

  approvedAt?: string;

  rejectedAt?: string;
}

interface DepositPayload {
  amount: number;

  paymentMethod: string;

  transactionId: string;

  receipt: string;
}

// =====================================================
// COMPONENT
// =====================================================

export default function DepositPage() {
  const router = useRouter();

  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] =
    useState("");

  const [username, setUsername] =
    useState("");

  const [user, setUser] =
    useState<UserData>({
      username: "",
      fullName: "",
      email: "",
      role: "user",
    });

  // ===================================================
  // WALLET
  // ===================================================

  const [wallet, setWallet] =
    useState<WalletData>({
      pkrBalance: 0,
      goldBalance: 0,
      usdtBalance: 0,
    });

  // ===================================================
  // PAYMENT METHODS
  // ===================================================

  const [paymentMethods, setPaymentMethods] =
    useState<PaymentMethod[]>([]);

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod | null>(null);

  // ===================================================
  // DEPOSIT FORM
  // ===================================================

  const [amount, setAmount] =
    useState("");

  const [transactionId, setTransactionId] =
    useState("");

  const [receiptFile, setReceiptFile] =
    useState<File | null>(null);

  const [receiptPreview, setReceiptPreview] =
    useState("");
    
    // =====================================================
   // RECEIPT PREVIEW STATE
   // =====================================================

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

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  // ===================================================
  // AUTH HEADERS
  // ===================================================

  const getHeaders = useCallback(() => {
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
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
      window.localStorage.getItem("token");

    const storedUsername =
      window.localStorage.getItem(
        "username"
      ) || "";

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
            storedUsername,
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
  // VERIFY USER SESSION
  // GET /api/auth/check
  // ===================================================

  const verifySession =
    useCallback(async () => {
      if (!token) {
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
                  `Bearer ${token}`,
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
          !response.ok ||
          !data?.success
        ) {
          localStorage.removeItem(
            "token"
          );

          localStorage.removeItem(
            "username"
          );

          localStorage.removeItem(
            "role"
          );

          router.replace("/login");

          return false;
        }

        const sessionUser =
          data.user || {};

        setUser({
          username:
            sessionUser.username ||
            username,

          fullName:
            sessionUser.fullName ||
            sessionUser.username ||
            username,

          email:
            sessionUser.email || "",

          role:
            sessionUser.role ||
            "user",
        });

        if (
          !username &&
          sessionUser.username
        ) {
          setUsername(
            sessionUser.username
          );
        }

        return true;
      } catch (error) {
        console.error(
          "AUTH ERROR:",
          error
        );

        router.replace("/login");

        return false;
      }
    }, [token, username, router]);

  // ===================================================
  // VERIFY SESSION WHEN TOKEN AVAILABLE
  // ===================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    verifySession();
  }, [token, verifySession]);

  // ===================================================
  // COPY
  // ===================================================

  const copyToClipboard =
    useCallback(
      async (text: string) => {
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
        } catch {
          setErrorMessage(
            "Unable to copy."
          );
        }
      },
      []
    );

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout =
    useCallback(() => {
      localStorage.removeItem(
        "token"
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

      router.replace("/login");
    }, [router]);

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
            .toUpperCase() ===
          "APPROVED"
      ).length;
    }, [depositHistory]);

  const pendingDeposits =
    useMemo(() => {
      return depositHistory.filter(
        (item) =>
          String(item.status)
            .toUpperCase() ===
          "PENDING"
      ).length;
    }, [depositHistory]);

    // =====================================================
  // LOAD USER WALLET
  // GET /api/wallet/balance
  // =====================================================

  const loadWallet =
    useCallback(async () => {
      if (!token) {
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
                  `Bearer ${token}`,
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

        setWallet({
          pkrBalance: Number(
            data.pkrBalance ??
              data.balance ??
              data.wallet?.pkrBalance ??
              data.wallet?.pkr ??
              0
          ),

          goldBalance: Number(
            data.goldBalance ??
              data.wallet?.goldBalance ??
              data.wallet?.gold ??
              0
          ),

          usdtBalance: Number(
            data.usdtBalance ??
              data.wallet?.usdtBalance ??
              data.wallet?.usdt ??
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
    }, [token, logout]);

  // =====================================================
  // LOAD PAYMENT METHODS
  // SOURCE OF TRUTH:
  // GET /api/payment-settings/deposit
  // =====================================================

  const loadPaymentMethods =
    useCallback(async () => {
      if (!token) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API}/api/payment-settings/deposit`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
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
          "V18 USER PAYMENT SETTINGS:",
          data
        );

        // -----------------------------------------------
        // AUTH EXPIRED
        // -----------------------------------------------

        if (
          response.status === 401
        ) {
          logout();
          return;
        }

        // -----------------------------------------------
        // API ERROR
        // -----------------------------------------------

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              `Unable to load payment methods. HTTP ${response.status}.`
          );
        }

        // -----------------------------------------------
        // NORMALIZE METHODS
        // -----------------------------------------------

        const methods: PaymentMethod[] =
          Array.isArray(
            data?.methods
          )
            ? data.methods
                .filter(
                  (item: any) =>
                    item &&
                    item.enabled === true
                )
                .map(
                  (item: any) => ({
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
                          ""
                      ).trim(),

                    enabled:
                      item.enabled === true,
                  })
                )
                .filter(
                  (item: PaymentMethod) =>
                    item.method.length > 0
                )
            : [];

        console.log(
          "V18 ENABLED METHODS:",
          methods
        );

        setPaymentMethods(
          methods
        );

        // -----------------------------------------------
        // SELECT METHOD
        // -----------------------------------------------

        setSelectedMethod(
          (current) => {
            if (
              methods.length === 0
            ) {
              return null;
            }

            if (current) {
              const existing =
                methods.find(
                  (item) =>
                    item.method ===
                    current.method
                );

              if (existing) {
                return existing;
              }
            }

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
    }, [token, logout]);

  // =====================================================
  // LOAD DEPOSIT HISTORY
  // GET /api/deposit/history/:username
  // =====================================================

  const loadDepositHistory =
    useCallback(async () => {
      if (
        !token ||
        !username
      ) {
        return;
      }

      try {
        const response =
          await fetch(
            `${API}/api/deposit/history/${encodeURIComponent(
              username
            )}`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
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
              `Unable to load deposit history. HTTP ${response.status}.`
          );
        }

        const rawHistory =
          Array.isArray(
            data.history
          )
            ? data.history
            : Array.isArray(
                data.deposits
              )
            ? data.deposits
            : [];

        const history: DepositHistory[] =
          rawHistory.map(
            (item: any) => ({
              _id:
                item._id,

              amount:
                Number(
                  item.amount ??
                    item.requestAmount ??
                    0
                ),

              paymentMethod:
                String(
                  item.paymentMethod ||
                    item.method ||
                    ""
                ),

              transactionId:
                String(
                  item.transactionId ||
                    item.reference ||
                    ""
                ),

              status:
                item.status ||
                "PENDING",

              createdAt:
                item.createdAt ||
                new Date().toISOString(),

              receipt:
                item.receipt ||
                "",

              receiptImage:
                item.receiptImage ||
                item.receipt ||
                "",

              adminNote:
                item.adminNote ||
                item.note ||
                "",

              approvedAt:
                item.approvedAt,

              rejectedAt:
                item.rejectedAt,
            })
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
            "History unavailable."
        );
      }
    }, [
      token,
      username,
      logout,
    ]);

  // =====================================================
  // REFRESH COMPLETE PAGE
  // =====================================================

  const refreshDepositPage =
    useCallback(async () => {
      if (!token) {
        return;
      }

      try {
        setRefreshing(true);

        setErrorMessage("");

        await Promise.all([
          loadWallet(),
          loadPaymentMethods(),
          loadDepositHistory(),
        ]);

        console.log(
          "V18 Deposit page refreshed."
        );
      } catch (error: any) {
        console.error(
          "DEPOSIT REFRESH ERROR:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Refresh failed."
        );
      } finally {
        setRefreshing(false);
      }
    }, [
      token,
      loadWallet,
      loadPaymentMethods,
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

          const valid =
            await verifySession();

          if (
            !valid ||
            !mounted
          ) {
            return;
          }

          await Promise.all([
            loadWallet(),
            loadPaymentMethods(),
            loadDepositHistory(),
          ]);

          if (mounted) {
            console.log(
              "V18 Deposit page initialized."
            );
          }
        } catch (error: any) {
          console.error(
            "INITIAL DEPOSIT LOAD ERROR:",
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
    loadPaymentMethods,
    loadDepositHistory,
  ]);

  // =====================================================
  // AUTO REFRESH
  // =====================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const timer =
      window.setInterval(() => {
        refreshDepositPage();
      }, 60000);

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
          !method.enabled
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

        // -----------------------------------------------
        // IMAGE ONLY
        // -----------------------------------------------

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          setErrorMessage(
            "Please upload JPG, JPEG or PNG image."
          );

          event.target.value = "";

          return;
        }

        // -----------------------------------------------
        // MAX 5 MB
        // -----------------------------------------------

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

        setReceiptFile(
          file
        );

        const reader =
          new FileReader();

        reader.onloadend = () => {
          setReceiptPreview(
            String(
              reader.result || ""
            )
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

      setErrorMessage("");

      setSuccessMessage("");
    }, []);

  // =====================================================
  // VALIDATE DEPOSIT FORM
  // =====================================================

  const validateDepositForm =
    useCallback(() => {
      setErrorMessage("");

      // -----------------------------------------------
      // PAYMENT METHOD
      // -----------------------------------------------

      if (!selectedMethod) {
        setErrorMessage(
          "Please select a payment method."
        );

        return false;
      }

      // -----------------------------------------------
      // AMOUNT
      // -----------------------------------------------

      const numericAmount =
        Number(amount);

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

      // -----------------------------------------------
      // MINIMUM
      // -----------------------------------------------

      if (
        numericAmount < 500
      ) {
        setErrorMessage(
          "Minimum PKR deposit is 500."
        );

        return false;
      }

      // -----------------------------------------------
      // MAXIMUM
      // -----------------------------------------------

      if (
        numericAmount >
        5000000
      ) {
        setErrorMessage(
          "Maximum PKR deposit is 5,000,000."
        );

        return false;
      }

      // -----------------------------------------------
      // TRANSACTION ID
      // -----------------------------------------------

      if (
        !transactionId.trim()
      ) {
        setErrorMessage(
          "Transaction ID is required."
        );

        return false;
      }

      if (
        transactionId
          .trim()
          .length < 5
      ) {
        setErrorMessage(
          "Transaction ID is too short."
        );

        return false;
      }

      // -----------------------------------------------
      // RECEIPT
      // -----------------------------------------------

      if (
        !receiptFile ||
        !receiptPreview
      ) {
        setErrorMessage(
          "Please upload payment receipt."
        );

        return false;
      }

      return true;
    }, [
      selectedMethod,
      amount,
      transactionId,
      receiptFile,
      receiptPreview,
    ]);

  // =====================================================
  // SUBMIT DEPOSIT
  //
  // POST /api/deposit/create
  //
  // IMPORTANT:
  // This creates a PENDING request only.
  // It does NOT credit the wallet.
  // =====================================================

  const submitDeposit =
    useCallback(async () => {
      if (
        submitting
      ) {
        return;
      }

      if (
        !validateDepositForm()
      ) {
        return;
      }

      if (!selectedMethod) {
        return;
      }

      try {
        setSubmitting(true);

        setErrorMessage("");
        setSuccessMessage("");

        const payload: DepositPayload = {
          amount:
            Number(amount),

          paymentMethod:
            String(
              selectedMethod.method
            ).trim(),

          transactionId:
            transactionId.trim(),

          receipt:
            receiptPreview,
        };

        console.log(
          "V18 DEPOSIT SUBMIT:",
          {
            ...payload,
            receipt:
              payload.receipt
                ? "[IMAGE DATA]"
                : "",
          }
        );

        const response =
          await fetch(
            `${API}/api/deposit/create`,
            {
              method: "POST",

              headers:
                getHeaders(),

              body:
                JSON.stringify(
                  payload
                ),
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
          "V18 DEPOSIT RESPONSE:",
          data
        );

        // ---------------------------------------------
        // AUTH
        // ---------------------------------------------

        if (
          response.status === 401
        ) {
          logout();
          return;
        }

        // ---------------------------------------------
        // ERROR
        // ---------------------------------------------

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Deposit request failed."
          );
        }

        // ---------------------------------------------
        // SUCCESS
        // ---------------------------------------------

        setSuccessMessage(
          data.message ||
            "Deposit request submitted successfully. Awaiting admin verification."
        );

        // ---------------------------------------------
        // RESET FORM
        // ---------------------------------------------

        setAmount("");

        setTransactionId("");

        setReceiptFile(null);

        setReceiptPreview("");

        // ---------------------------------------------
        // REFRESH HISTORY
        // ---------------------------------------------

        await Promise.all([
          loadWallet(),
          loadDepositHistory(),
        ]);
      } catch (error: any) {
        console.error(
          "V18 DEPOSIT SUBMIT ERROR:",
          error
        );

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
      amount,
      transactionId,
      receiptPreview,
      getHeaders,
      logout,
      loadWallet,
      loadDepositHistory,
    ]);

  // =====================================================
  // QUICK AMOUNT BUTTONS
  // =====================================================

  const quickAmounts = [
    500,
    1000,
    5000,
    10000,
    25000,
    50000,
  ];

  const selectQuickAmount =
    useCallback(
      (value: number) => {
        setAmount(
          String(value)
        );

        setErrorMessage("");
      },
      []
    );

  // =====================================================
  // CLEAR FORM
  // =====================================================

  const clearForm =
    useCallback(() => {
      setAmount("");

      setTransactionId("");

      setReceiptFile(null);

      setReceiptPreview("");

      setErrorMessage("");

      setSuccessMessage("");
    }, []);

  // =====================================================
  // FILE SIZE FORMAT
  // =====================================================

  const formatFileSize =
    useCallback(
      (size: number) => {
        if (
          size < 1024
        ) {
          return `${size} B`;
        }

        if (
          size <
          1024 * 1024
        ) {
          return `${(
            size / 1024
          ).toFixed(1)} KB`;
        }

        return `${(
          size /
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
              ).toUpperCase() ===
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
              ).toUpperCase() ===
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
              ).toUpperCase() ===
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

      return {
        totalApprovedAmount,

        totalPendingAmount,

        totalRejectedAmount,

        totalRequests:
          depositHistory.length,
      };
    }, [depositHistory]);

  // =====================================================
  // HELPER: METHOD DISPLAY NAME
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
            return method.method;
        }
      },
      []
    );


// =====================================================
// PART 4/4
// GoldTrade V18 Enterprise
// Deposit UI - Header / Wallet / Payment Methods
// =====================================================

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
        className={refreshing ? "animate-spin" : ""}
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
// PAYMENT METHOD SELECTOR
// =====================================================

const PaymentMethodsSection = () => {
  if (paymentMethods.length === 0) {
    return (
      <div className="rounded-2xl bg-[#111827] border border-red-500/40 p-6 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle
            className="text-red-400 mt-1"
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
      <h2 className="text-2xl font-bold text-yellow-400 mb-5">
        Select Payment Method
      </h2>

      <div className="grid md:grid-cols-2 gap-5">
        {paymentMethods.map((method) => {
          const Icon = getMethodIcon(method.method);

          const active =
            selectedMethod?.method === method.method;

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
                selectPaymentMethod(method)
              }
              className={`text-left rounded-2xl border p-5 transition ${
                active
                  ? "border-green-500 bg-green-500/10"
                  : "border-gray-700 hover:border-yellow-500"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <Icon
                  className="text-yellow-400"
                  size={30}
                />

                {active && (
                  <CheckCircle
                    className="text-green-400"
                    size={24}
                  />
                )}
              </div>

              <h3 className="font-bold text-lg text-white">
                {method.title ||
                  method.method}
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
        })}
      </div>
    </div>
  );
};

// =====================================================
// SELECTED PAYMENT DETAILS
// =====================================================

const SelectedPaymentDetails = () => {
  if (!selectedMethod) {
    return null;
  }

  const accountValue =
    selectedMethod.accountNumber ||
    selectedMethod.walletAddress ||
    "";

  return (
    <div className="rounded-2xl bg-[#111827] border border-green-500/20 p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-green-400">
          Payment Details
        </h2>

        <Shield
          className="text-green-400"
          size={24}
        />
      </div>

      <div className="space-y-5">
        {selectedMethod.accountTitle && (
          <div>
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
                copyToClipboard(accountValue)
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
      </div>
    </div>
  );
};
// =====================================================
// DEPOSIT FORM
// =====================================================

const DepositFormSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-6 mb-8">
    <h2 className="text-2xl font-bold text-green-400 mb-6">
      Deposit Information
    </h2>

    {/* AMOUNT */}
    <div className="mb-6">
      <label
        htmlFor="deposit-amount"
        className="block text-gray-300 mb-2"
      >
        Deposit Amount (PKR)
      </label>

      <input
        id="deposit-amount"
        type="number"
        min="500"
        max="5000000"
        step="1"
        value={amount}
        onChange={(event) => {
          setAmount(event.target.value);
          setErrorMessage("");
        }}
        placeholder="Enter Amount"
        className="w-full bg-[#1F2937] border border-gray-600 rounded-xl p-4 text-white outline-none focus:border-green-400"
      />
    </div>

    {/* QUICK AMOUNTS */}
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
      {quickAmounts.map((item) => (
        <button
          type="button"
          key={item}
          onClick={() =>
            selectQuickAmount(item)
          }
          className="bg-[#1F2937] hover:bg-green-500 hover:text-black rounded-xl py-3 font-semibold transition"
        >
          {item.toLocaleString("en-PK")}
        </button>
      ))}
    </div>

    {/* TRANSACTION ID */}
    <div className="mb-6">
      <label
        htmlFor="transaction-id"
        className="block text-gray-300 mb-2"
      >
        Transaction ID / Reference Number
      </label>

      <input
        id="transaction-id"
        type="text"
        value={transactionId}
        onChange={(event) => {
          setTransactionId(
            event.target.value
          );
          setErrorMessage("");
        }}
        placeholder="Enter Transaction Reference"
        className="w-full bg-[#1F2937] border border-gray-600 rounded-xl p-4 text-white outline-none focus:border-yellow-400"
      />
    </div>

    {/* INFORMATION */}
    <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">
      <div className="flex gap-3 items-start">
        <AlertCircle
          className="text-yellow-400 mt-1 shrink-0"
          size={20}
        />

        <div className="text-sm text-gray-300 space-y-1">
          <p>
            Minimum Deposit:{" "}
            <span className="text-green-400 font-semibold">
              PKR 500
            </span>
          </p>

          <p>
            Maximum Deposit:{" "}
            <span className="text-green-400 font-semibold">
              PKR 5,000,000
            </span>
          </p>

          <p>
            Your request will remain pending until
            Admin verifies your payment.
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
  if (!selectedMethod) {
    return null;
  }

  const accountValue =
    selectedMethod.accountNumber ||
    selectedMethod.walletAddress ||
    "";

  return (
    <div className="rounded-2xl bg-[#111827] border border-cyan-500/20 p-6 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-cyan-400">
          Scan QR & Pay
        </h2>

        <Shield
          className="text-cyan-400"
          size={24}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-center">
        {/* QR */}
        <div className="w-56 h-56 rounded-2xl bg-white flex items-center justify-center overflow-hidden shrink-0">
          {selectedMethod.qrImage ? (
            <img
              src={selectedMethod.qrImage}
              alt={`${selectedMethod.title} payment QR`}
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
              {selectedMethod.title ||
                selectedMethod.method}
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
    <h2 className="text-2xl font-bold text-yellow-400 mb-6">
      Upload Payment Receipt
    </h2>

    <label className="cursor-pointer block border-2 border-dashed border-gray-600 hover:border-yellow-400 rounded-2xl p-8 transition">
      <input
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
        onChange={handleReceiptChange}
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
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-green-400 font-semibold">
            Receipt Preview
          </h3>

          <button
            type="button"
            onClick={removeReceipt}
            className="text-red-400 hover:text-red-300 text-sm transition"
          >
            Remove
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden border border-green-500/20 bg-black">
          <img
            src={receiptPreview}
            alt="Payment receipt preview"
            className="w-full object-contain max-h-[450px]"
          />
        </div>

        {receiptFile && (
          <div className="mt-3 flex flex-col sm:flex-row justify-between gap-2 text-sm text-gray-400">
            <span className="break-all">
              {receiptFile.name}
            </span>

            <span>
              {formatFileSize(
                receiptFile.size
              )}
            </span>
          </div>
        )}
      </div>
    )}

    <div className="mt-6 rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">
      <div className="flex gap-3 items-start">
        <AlertCircle
          className="text-yellow-400 mt-1 shrink-0"
          size={20}
        />

        <div className="space-y-1 text-sm text-gray-300">
          <p>
            Upload a clear screenshot of your payment receipt.
          </p>

          <p>
            The receipt should contain the transaction
            ID/reference number.
          </p>

          <p>
            Admin will verify the receipt before approving
            the deposit.
          </p>
        </div>
      </div>
    </div>
  </div>
);
// =====================================================
// SUBMIT DEPOSIT SECTION
// =====================================================

const SubmitDepositSection = () => (
  <div className="rounded-2xl bg-[#111827] border border-green-500/20 p-6 mb-8">
    <div className="space-y-4">
      {/* SUMMARY */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">
            Deposit Amount
          </p>

          <h3 className="text-green-400 text-xl font-bold mt-1">
            PKR {formatMoney(Number(amount || 0))}
          </h3>
        </div>

        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">
            Payment Method
          </p>

          <h3 className="text-white text-lg font-semibold mt-1">
            {selectedMethod?.title ||
              "Select Method"}
          </h3>
        </div>

        <div className="bg-[#1F2937] rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">
            Transaction ID
          </p>

          <h3 className="text-cyan-400 text-lg font-semibold mt-1 break-all">
            {transactionId ||
              "Not Entered"}
          </h3>
        </div>
      </div>

      {/* IMPORTANT WORKFLOW */}
      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
        <div className="flex gap-3 items-start">
          <Shield
            className="text-blue-400 mt-1 shrink-0"
            size={20}
          />

          <p className="text-sm text-gray-300">
            After submission, your deposit will be marked
            <span className="text-yellow-400 font-semibold">
              {" "}PENDING
            </span>
            . Admin will manually verify your payment and
            then Approve or Reject the request.
          </p>
        </div>
      </div>

      {/* BUTTONS */}
      <div className="grid md:grid-cols-2 gap-4 pt-2">
        <button
          type="button"
          onClick={submitDeposit}
          disabled={
            submitting ||
            !selectedMethod
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

        <button
          type="button"
          onClick={clearForm}
          disabled={submitting}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed py-4 rounded-xl font-bold text-lg transition"
        >
          Clear Form
        </button>
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center">
      <div className="bg-[#111827] rounded-3xl border border-yellow-500/30 px-8 py-7 flex flex-col items-center gap-4">
        <Loader2
          className="animate-spin text-yellow-400"
          size={42}
        />

        <h2 className="text-yellow-400 text-xl font-bold">
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
    </div>

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
    getStatusColor(status);

  return (
    <span
      className={`inline-flex items-center justify-center px-4 py-2 rounded-full border text-xs font-bold ${color}`}
    >
      {String(status).toUpperCase()}
    </span>
  );
};

// =====================================================
// HISTORY SUMMARY STRIP
// =====================================================

const HistorySummaryStrip = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-8">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      <div>
        <p className="text-gray-400 text-xs uppercase">
          Total Deposits
        </p>

        <h3 className="text-cyan-400 text-2xl font-bold mt-2">
          {depositSummary.totalRequests}
        </h3>
      </div>

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

      <div>
        <p className="text-gray-400 text-xs uppercase">
          Wallet Balance
        </p>

        <h3 className="text-purple-400 text-xl font-bold mt-2">
          PKR {formatMoney(wallet.pkrBalance)}
        </h3>
      </div>
    </div>
  </div>
);

// =====================================================
// EMPTY HISTORY
// =====================================================

const EmptyHistoryCard = () => (
  <div className="rounded-2xl bg-[#111827] border border-gray-700 py-16 text-center">
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
  if (!previewReceipt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#111827] rounded-3xl border border-gray-700 max-w-3xl w-full overflow-hidden">
        <button
          type="button"
          onClick={() =>
            setPreviewReceipt(null)
          }
          className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          aria-label="Close receipt preview"
        >
          ✕
        </button>

        <img
          src={previewReceipt}
          alt="Deposit Receipt"
          className="w-full max-h-[80vh] object-contain bg-black"
        />
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
    String(status || "")
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
    "";

  return (
    <div className="rounded-2xl bg-[#111827] border border-gray-700 p-5 mb-4">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="min-w-0">
          <p className="text-gray-400 text-xs uppercase">
            {item.paymentMethod}
          </p>

          <h3 className="text-green-400 text-xl font-bold mt-1">
            PKR {formatMoney(item.amount)}
          </h3>
        </div>

        <StatusBadge
          status={item.status}
        />
      </div>

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
          status={item.status}
        />

        {item.adminNote && (
          <div className="rounded-xl bg-[#1F2937] p-3 border border-gray-700">
            <p className="text-gray-500 text-xs">
              Admin Note
            </p>

            <p className="text-gray-300 mt-1">
              {item.adminNote}
            </p>
          </div>
        )}

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
            <ImageIcon size={18} />

            View Receipt
          </button>
        )}
      </div>
    </div>
  );
};

// =====================================================
// DESKTOP HISTORY TABLE
// =====================================================

const DepositHistoryTable = () => {
  if (
    depositHistory.length === 0
  ) {
    return (
      <EmptyHistoryCard />
    );
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
            {depositHistory.map(
              (item) => {
                const receipt =
                  item.receipt ||
                  item.receiptImage ||
                  "";

                return (
                  <tr
                    key={
                      item._id
                    }
                    className="border-t border-gray-700 hover:bg-[#182233] transition"
                  >
                    <td className="px-5 py-5 whitespace-nowrap">
                      <p className="font-bold text-green-400 text-lg">
                        PKR{" "}
                        {formatMoney(
                          item.amount
                        )}
                      </p>
                    </td>

                    <td className="px-5 py-5 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
                        {item.paymentMethod}
                      </span>
                    </td>

                    <td className="px-5 py-5">
                      <p className="text-white font-medium break-all">
                        {item.transactionId ||
                          "--"}
                      </p>
                    </td>

                    <td className="px-5 py-5">
                      <div className="space-y-2">
                        <StatusBadge
                          status={
                            item.status
                          }
                        />

                        <DepositStatusTimeline
                          status={
                            item.status
                          }
                        />
                      </div>
                    </td>

                    <td className="px-5 py-5">
                      {receipt ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewReceipt(
                              receipt
                            )
                          }
                          className="bg-[#1F2937] hover:bg-[#374151] border border-gray-600 rounded-lg px-3 py-2 text-sm flex items-center gap-2 transition"
                        >
                          <ImageIcon
                            size={16}
                          />

                          View
                        </button>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          No Receipt
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-5 whitespace-nowrap">
                      <p className="text-gray-400 text-sm">
                        {formatDate(
                          item.createdAt
                        )}
                      </p>
                    </td>
                  </tr>
                );
              }
            )}
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
    <DepositHistoryHeader />

    <HistorySummaryStrip />

    <div className="hidden lg:block">
      <DepositHistoryTable />
    </div>

    <div className="lg:hidden">
      {depositHistory.length === 0 ? (
        <EmptyHistoryCard />
      ) : (
        depositHistory.map(
          (item) => (
            <DepositHistoryCard
              key={item._id}
              item={item}
            />
          )
        )
      )}
    </div>

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
// FOOTER
// =====================================================

const DepositFooter = () => (
  <footer className="mt-16 border-t border-gray-800 pt-8 pb-10">
    <div className="grid md:grid-cols-2 gap-8">
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

      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-3 text-green-400">
          <Shield size={18} />
          JWT Protected Deposit System
        </div>

        <div className="flex items-center gap-3 text-cyan-400">
          <Wallet size={18} />
          PKR Wallet Credit After Admin Approval
        </div>

        <div className="flex items-center gap-3 text-yellow-400">
          <CheckCircle size={18} />
          Manual Payment Verification
        </div>

        <div className="flex items-center gap-3 text-purple-400">
          <RefreshCw size={18} />
          Live Wallet Synchronization
        </div>
      </div>
    </div>

    <div className="border-t border-gray-800 mt-8 pt-5 text-center text-gray-500 text-sm">
      © {new Date().getFullYear()} GoldTrade Enterprise

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
    {/* Loading */}
    <LoadingOverlay />

    {/* Toasts */}
    <SuccessToast />
    <ErrorToast />

    {/* MAIN CONTAINER */}
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {/* Header */}
      <DepositHeader />

      {/* Wallet */}
      <WalletSummaryCard />

      {/* Alerts */}
      <MessageAlerts />

      {/* Payment Methods */}
      <PaymentMethodsSection />

      {/* Selected Payment Details */}
      <SelectedPaymentDetails />

      {/* QR */}
      <QRPaymentCard />

      {/* Deposit Form */}
      <DepositFormSection />

      {/* Receipt */}
      <ReceiptUploadSection />

      {/* Submit */}
      <SubmitDepositSection />

      {/* Statistics */}
      <DepositStatisticsSection />

      {/* Process Information */}
      <DepositActivityInfo />

      {/* Status Guide */}
      <DepositStatusLegend />

      {/* History */}
      <DepositHistorySection />

      {/* Footer */}
      <DepositFooter />
    </div>
  </main>
);
}