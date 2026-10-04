"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Wallet,
  CreditCard,
  Copy,
  Save,
  RefreshCw,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  DollarSign,
  Coins,
  Plus,
  Trash2,
  Power,
  Settings,
} from "lucide-react";

// ============================================================
// GOLDTRADE V18
// ADMIN PAYMENT SETTINGS
// PART 1/8
// ============================================================
//
// IMPORTANT:
// - Payment Methods -> /api/payment-settings/admin/deposit
// - General Deposit Settings -> /api/deposit/settings
// - Admin authentication -> Bearer token
// - No old payment API is used
// ============================================================


// ============================================================
// API URL
// ============================================================

const API = (() => {
  const configuredAPI =
    process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredAPI) {
    return configuredAPI.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname =
      window.location.hostname;

    // Local development
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0"
    ) {
      return "http://localhost:5000";
    }

    // Production
    //
    // IMPORTANT:
    // NEXT_PUBLIC_API_URL should normally be set
    // in Vercel environment variables.
    //
    return "https://goldtrade-2.onrender.com";
  }

  return "https://goldtrade-2.onrender.com";
})();


// ============================================================
// PAYMENT METHOD TYPES
// ============================================================

interface BackendPaymentMethod {
  _id?: string;

  method: string;

  title: string;

  enabled: boolean;

  accountTitle?: string;

  accountNumber?: string;

  iban?: string;

  walletAddress?: string;

  network?: string;

  qrImage?: string;
}


interface DepositPaymentMethod {
  _id?: string;

  // Display name
  type: string;

  // Backend accountTitle
  accountName: string;

  // Backend accountNumber
  accountNumber: string;

  // Backend qrImage
  qrCode: string;

  // Frontend-only informational field
  instructions: string;

  enabled: boolean;

  // Backend method
  method?: string;

  // Backend title
  title?: string;

  iban?: string;

  walletAddress?: string;

  network?: string;
}


// ============================================================
// DEPOSIT SETTINGS
// ============================================================

interface DepositSettings {
  depositsEnabled: boolean;

  minimumDeposit: number;

  maximumDeposit: number;

  methods: DepositPaymentMethod[];

  paymentMethods: DepositPaymentMethod[];

  total: number;

  updatedAt?: string;
}


// ============================================================
// STATISTICS
// ============================================================

interface PaymentStatistics {
  totalMethods: number;

  activeMethods: number;

  inactiveMethods: number;

  depositsEnabled: boolean;

  minimumDeposit: number;

  maximumDeposit: number;
}


// ============================================================
// EMPTY PAYMENT METHOD
// ============================================================

const createEmptyMethod =
  (): DepositPaymentMethod => ({
    type: "",

    accountName: "",

    accountNumber: "",

    qrCode: "",

    instructions: "",

    enabled: true,

    method: "",

    title: "",

    iban: "",

    walletAddress: "",

    network: "",
  });


// ============================================================
// DEFAULT SETTINGS
// ============================================================

const createDefaultSettings =
  (): DepositSettings => ({
    depositsEnabled: true,

    minimumDeposit: 1000,

    maximumDeposit: 10000000,

    methods: [],

    paymentMethods: [],

    total: 0,
  });


// ============================================================
// DEFAULT STATISTICS
// ============================================================

const createDefaultStatistics =
  (): PaymentStatistics => ({
    totalMethods: 0,

    activeMethods: 0,

    inactiveMethods: 0,

    depositsEnabled: true,

    minimumDeposit: 1000,

    maximumDeposit: 10000000,
  });


// ============================================================
// COMPONENT
// ============================================================

export default function PaymentSettingsPage() {

  // ==========================================================
  // AUTH
  // ==========================================================

  const [token, setToken] =
    useState<string>("");


  // ==========================================================
  // ADMIN NAME
  // ==========================================================

  const [adminName, setAdminName] =
    useState<string>("Administrator");


  // ==========================================================
  // MAIN SETTINGS
  // ==========================================================

  const [settings, setSettings] =
    useState<DepositSettings>(
      createDefaultSettings()
    );


  // ==========================================================
  // NEW / EDIT PAYMENT METHOD
  // ==========================================================

  const [newMethod, setNewMethod] =
    useState<DepositPaymentMethod>(
      createEmptyMethod()
    );


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const [statistics, setStatistics] =
    useState<PaymentStatistics>(
      createDefaultStatistics()
    );


  // ==========================================================
  // UI STATES
  // ==========================================================

  const [loading, setLoading] =
    useState<boolean>(true);

  const [refreshing, setRefreshing] =
    useState<boolean>(false);

  const [saving, setSaving] =
    useState<boolean>(false);


  // ==========================================================
  // MESSAGE
  // ==========================================================

  const [message, setMessage] =
    useState<string>("");

  const [messageType, setMessageType] =
    useState<"success" | "error">(
      "success"
    );


  // ==========================================================
  // ERROR
  // ==========================================================

  const [error, setError] =
    useState<string>("");


  // ==========================================================
  // SEARCH
  // ==========================================================

  const [search, setSearch] =
    useState<string>("");


  // ==========================================================
  // EDIT INDEX
  // ==========================================================

  const [editingIndex, setEditingIndex] =
    useState<number | null>(null);


  // ==========================================================
  // ADD FORM
  // ==========================================================

  const [showAddForm, setShowAddForm] =
    useState<boolean>(false);


  // ==========================================================
  // TOKEN LOAD
  // ==========================================================

  useEffect(() => {
    try {
      const savedToken =
        localStorage
          .getItem("token")
          ?.trim() || "";

      if (!savedToken) {
        window.location.href =
          "/login";

        return;
      }

      setToken(savedToken);

    } catch (err) {
      console.error(
        "PAYMENT SETTINGS TOKEN ERROR:",
        err
      );

      window.location.href =
        "/login";
    }
  }, []);


  // ==========================================================
  // ADMIN REQUEST HEADERS
  // ==========================================================

  const adminHeaders = useMemo(
    () => ({
      Authorization: token
        ? `Bearer ${token}`
        : "",

      "Content-Type":
        "application/json",
    }),
    [token]
  );


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (
    date?: string
  ): string => {
    if (!date) {
      return "--";
    }

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
      "en-GB",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };


  // ==========================================================
  // COPY TEXT
  // ==========================================================

  const copyText = async (
    value: string
  ) => {
    const text =
      String(value || "")
        .trim();

    if (!text) {
      setMessage(
        "Nothing to copy."
      );

      setMessageType("error");

      return;
    }

    try {
      await navigator.clipboard
        .writeText(text);

      setMessage(
        "Copied successfully."
      );

      setMessageType(
        "success"
      );

    } catch (err) {
      console.error(
        "COPY ERROR:",
        err
      );

      setMessage(
        "Unable to copy."
      );

      setMessageType(
        "error"
      );
    }
  };


    // ============================================================
  // PART 2/8
  // BACKEND NORMALIZATION + LOAD SYSTEM
  // ============================================================


  // ============================================================
  // NORMALIZE BACKEND PAYMENT METHOD
  // ============================================================

  const normalizeBackendMethod = (
    method: BackendPaymentMethod
  ): DepositPaymentMethod => {

    const backendMethod =
      String(method?.method || "")
        .trim()
        .toUpperCase();

    const displayTitle =
      String(
        method?.title ||
          method?.method ||
          ""
      ).trim();

    // ----------------------------------------------------------
    // BINANCE / CRYPTO
    // ----------------------------------------------------------

    const accountNumber =
      backendMethod === "BINANCE"
        ? String(
            method?.walletAddress ||
              method?.accountNumber ||
              ""
          ).trim()
        : String(
            method?.accountNumber ||
              ""
          ).trim();


    // ----------------------------------------------------------
    // RETURN FRONTEND FORMAT
    // ----------------------------------------------------------

    return {
      _id: method?._id,

      type:
        backendMethod === "BANK"
          ? "Bank Transfer"
          : backendMethod === "JAZZCASH"
          ? "JazzCash"
          : backendMethod === "EASYPAISA"
          ? "EasyPaisa"
          : backendMethod === "BINANCE"
          ? "Binance USDT"
          : displayTitle,

      accountName:
        String(
          method?.accountTitle ||
            ""
        ).trim(),

      accountNumber,

      qrCode:
        String(
          method?.qrImage ||
            ""
        ).trim(),

      instructions: "",

      enabled:
        method?.enabled === true,

      method:
        backendMethod,

      title:
        displayTitle,

      iban:
        String(
          method?.iban ||
            ""
        ).trim(),

      walletAddress:
        String(
          method?.walletAddress ||
            ""
        ).trim(),

      network:
        String(
          method?.network ||
            ""
        ).trim(),
    };
  };


  // ============================================================
  // NORMALIZE FRONTEND METHOD
  // ============================================================

  const normalizeMethod = (
    method: Partial<DepositPaymentMethod> = {}
  ): DepositPaymentMethod => {

    return {
      _id:
        method._id,

      type:
        String(
          method.type ??
            ""
        ).trim(),

      accountName:
        String(
          method.accountName ??
            ""
        ).trim(),

      accountNumber:
        String(
          method.accountNumber ??
            ""
        ).trim(),

      qrCode:
        String(
          method.qrCode ??
            ""
        ).trim(),

      instructions:
        String(
          method.instructions ??
            ""
        ).trim(),

      enabled:
        method.enabled !== false,

      method:
        String(
          method.method ??
            ""
        )
          .trim()
          .toUpperCase(),

      title:
        String(
          method.title ??
            ""
        ).trim(),

      iban:
        String(
          method.iban ??
            ""
        ).trim(),

      walletAddress:
        String(
          method.walletAddress ??
            ""
        ).trim(),

      network:
        String(
          method.network ??
            ""
        ).trim(),
    };
  };


  // ============================================================
  // NORMALIZE COMPLETE SETTINGS
  // ============================================================

  const normalizeSettings = (
    data: any
  ): DepositSettings => {

    // ----------------------------------------------------------
    // API CAN RETURN:
    //
    // {
    //   settings: {...}
    // }
    //
    // OR DIRECT SETTINGS
    // ----------------------------------------------------------

    const source =
      data?.settings &&
      typeof data.settings === "object"
        ? data.settings
        : data || {};


    // ----------------------------------------------------------
    // V18 PAYMENT SETTINGS
    //
    // Backend field:
    // depositMethods
    // ----------------------------------------------------------

    const backendMethods:
      BackendPaymentMethod[] =
      Array.isArray(
        source.depositMethods
      )
        ? source.depositMethods
        : [];


    // ----------------------------------------------------------
    // CONVERT BACKEND -> FRONTEND
    // ----------------------------------------------------------

    const methods =
      backendMethods
        .filter(
          (method) =>
            method &&
            typeof method ===
              "object"
        )
        .map(
          (method) =>
            normalizeBackendMethod(
              method
            )
        )
        .filter(
          (method) =>
            method.type.length > 0
        );


    // ----------------------------------------------------------
    // MINIMUM DEPOSIT
    // ----------------------------------------------------------

    const minimumDepositValue =
      Number(
        source.minimumDeposit
      );

    const minimumDeposit =
      Number.isFinite(
        minimumDepositValue
      ) &&
      minimumDepositValue > 0
        ? minimumDepositValue
        : 1000;


    // ----------------------------------------------------------
    // MAXIMUM DEPOSIT
    // ----------------------------------------------------------

    const maximumDepositValue =
      Number(
        source.maximumDeposit
      );

    const maximumDeposit =
      Number.isFinite(
        maximumDepositValue
      ) &&
      maximumDepositValue > 0
        ? maximumDepositValue
        : 10000000;


    // ----------------------------------------------------------
    // RETURN CLEAN STATE
    // ----------------------------------------------------------

    return {
      depositsEnabled:
        source.depositsEnabled !== false,

      minimumDeposit,

      maximumDeposit,

      methods,

      paymentMethods: [
        ...methods,
      ],

      total:
        methods.length,

      updatedAt:
        typeof source.updatedAt ===
        "string"
          ? source.updatedAt
          : undefined,
    };
  };


  // ============================================================
  // LOAD PAYMENT SETTINGS
  //
  // GET
  // /api/payment-settings/admin/all
  // ============================================================

  const loadPaymentSettings =
    async () => {

      if (!token) {
        return;
      }


      try {

        setError("");


        // ------------------------------------------------------
        // REQUEST
        // ------------------------------------------------------

        const response =
          await fetch(
            `${API}/api/payment-settings/admin/all`,
            {
              method: "GET",

              headers:
                adminHeaders,

              cache:
                "no-store",
            }
          );


        // ------------------------------------------------------
        // SAFE JSON
        // ------------------------------------------------------

        let data: any = {};

        try {

          data =
            await response.json();

        } catch {

          data = {};

        }


        console.log(
          "V18 ADMIN PAYMENT SETTINGS:",
          data
        );


        // ------------------------------------------------------
        // TOKEN EXPIRED
        // ------------------------------------------------------

        if (
          response.status ===
          401
        ) {

          localStorage.removeItem(
            "token"
          );

          setToken("");

          window.location.href =
            "/login";

          return;
        }


        // ------------------------------------------------------
        // ADMIN ACCESS DENIED
        // ------------------------------------------------------

        if (
          response.status ===
          403
        ) {

          throw new Error(
            data?.message ||
              "Admin access required."
          );
        }


        // ------------------------------------------------------
        // HTTP ERROR
        // ------------------------------------------------------

        if (!response.ok) {

          throw new Error(
            data?.message ||
              `Request failed with status ${response.status}.`
          );
        }


        // ------------------------------------------------------
        // API ERROR
        // ------------------------------------------------------

        if (
          data &&
          data.success === false
        ) {

          throw new Error(
            data?.message ||
              "Unable to load payment settings."
          );
        }


        // ------------------------------------------------------
        // NORMALIZE
        // ------------------------------------------------------

        const normalized =
          normalizeSettings(
            data
          );


        // ------------------------------------------------------
        // UPDATE MAIN STATE
        // ------------------------------------------------------

        setSettings(
          normalized
        );


        // ------------------------------------------------------
        // CALCULATE STATISTICS
        // ------------------------------------------------------

        const activeMethods =
          normalized.methods.filter(
            (method) =>
              method.enabled ===
              true
          ).length;


        const inactiveMethods =
          Math.max(
            0,
            normalized.methods.length -
              activeMethods
          );


        // ------------------------------------------------------
        // UPDATE STATISTICS
        // ------------------------------------------------------

        setStatistics({
          totalMethods:
            normalized.methods.length,

          activeMethods,

          inactiveMethods,

          depositsEnabled:
            normalized.depositsEnabled,

          minimumDeposit:
            normalized.minimumDeposit,

          maximumDeposit:
            normalized.maximumDeposit,
        });


        // ------------------------------------------------------
        // CLEAR ERROR
        // ------------------------------------------------------

        setError("");

      } catch (
        err: any
      ) {

        console.error(
          "LOAD PAYMENT SETTINGS ERROR:",
          err
        );


        setError(
          err?.message ||
            "Unable to load payment settings."
        );
      }
    };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    if (!token) {
      return;
    }


    let mounted =
      true;


    const initialize =
      async () => {

        try {

          if (mounted) {
            setLoading(true);
          }


          await loadPaymentSettings();

        } catch (err) {

          console.error(
            "INITIAL PAYMENT SETTINGS ERROR:",
            err
          );

        } finally {

          if (mounted) {
            setLoading(false);
          }

        }
      };


    initialize();


    return () => {
      mounted = false;
    };

  }, [token]);


  // ============================================================
  // REFRESH PAYMENT SETTINGS
  // ============================================================

  const refreshPaymentSettings =
    async () => {

      if (!token) {

        setMessage(
          "Please login again."
        );

        setMessageType(
          "error"
        );

        return;
      }


      try {

        setRefreshing(true);

        setError("");


        await loadPaymentSettings();


        setMessage(
          "Payment settings refreshed successfully."
        );

        setMessageType(
          "success"
        );

      } catch (
        err: any
      ) {

        console.error(
          "REFRESH PAYMENT SETTINGS ERROR:",
          err
        );


        setMessage(
          err?.message ||
            "Unable to refresh payment settings."
        );

        setMessageType(
          "error"
        );

      } finally {

        setRefreshing(false);

      }
    };


  // ============================================================
  // AUTO CLEAR MESSAGE
  // ============================================================

  useEffect(() => {

    if (!message) {
      return;
    }


    const timer =
      window.setTimeout(
        () => {
          setMessage("");
        },
        4000
      );


    return () => {
      window.clearTimeout(
        timer
      );
    };

  }, [message]);


  // ============================================================
  // UPDATE NEW PAYMENT METHOD
  // ============================================================

  const updateNewMethod = (
    field:
      keyof DepositPaymentMethod,
    value:
      string | boolean
  ) => {

    setNewMethod(
      (previous) => ({
        ...previous,

        [field]:
          value,
      })
    );
  };


  // =====================================================
// PART 3/8 — PAYMENT METHOD MANAGEMENT
// =====================================================

// =====================================================
// ADD / UPDATE PAYMENT METHOD
// =====================================================

const addPaymentMethod = () => {
  // ---------------------------------------------------
  // NORMALIZE FORM DATA
  // ---------------------------------------------------

  const method = normalizeMethod(newMethod);

  const type = method.type.trim();
  const accountName = method.accountName.trim();
  const accountNumber = method.accountNumber.trim();

  // ---------------------------------------------------
  // BASIC VALIDATION
  // ---------------------------------------------------

  if (!type) {
    setMessage("Payment method name is required.");
    setMessageType("error");
    return;
  }

  if (!accountName) {
    setMessage("Account name / title is required.");
    setMessageType("error");
    return;
  }

  if (!accountNumber && !method.walletAddress) {
    setMessage(
      "Account number or wallet address is required."
    );
    setMessageType("error");
    return;
  }

  // ---------------------------------------------------
  // NORMALIZE METHOD NAME
  // ---------------------------------------------------

  const normalizedType = type
    .toLowerCase()
    .trim();

  // ---------------------------------------------------
  // DUPLICATE CHECK
  // ---------------------------------------------------

  const duplicate = settings.methods.some(
    (item, index) => {
      if (
        editingIndex !== null &&
        index === editingIndex
      ) {
        return false;
      }

      return (
        String(item.type || "")
          .toLowerCase()
          .trim() === normalizedType
      );
    }
  );

  if (duplicate) {
    setMessage(
      "This payment method already exists."
    );
    setMessageType("error");
    return;
  }

  // ---------------------------------------------------
  // UPDATE EXISTING METHOD
  // ---------------------------------------------------

  if (editingIndex !== null) {
    setSettings((prev) => {
      if (
        editingIndex < 0 ||
        editingIndex >= prev.methods.length
      ) {
        return prev;
      }

      const methods = [...prev.methods];

      methods[editingIndex] = {
        ...method,
        _id:
          method._id ||
          prev.methods[editingIndex]?._id,
      };

      return {
        ...prev,
        methods,
        paymentMethods: [...methods],
        total: methods.length,
      };
    });

    setMessage(
      "Payment method updated locally. Click Save Payment Methods."
    );
    setMessageType("success");
  }

  // ---------------------------------------------------
  // ADD NEW METHOD
  // ---------------------------------------------------

  else {
    setSettings((prev) => {
      const methods = [
        ...prev.methods,
        method,
      ];

      return {
        ...prev,
        methods,
        paymentMethods: [...methods],
        total: methods.length,
      };
    });

    setMessage(
      "Payment method added. Click Save Payment Methods."
    );
    setMessageType("success");
  }

  // ---------------------------------------------------
  // RESET FORM
  // ---------------------------------------------------

  setNewMethod(createEmptyMethod());
  setEditingIndex(null);
  setShowAddForm(false);
};

// =====================================================
// EDIT PAYMENT METHOD
// =====================================================

const editPaymentMethod = (
  index: number
) => {
  if (
    index < 0 ||
    index >= settings.methods.length
  ) {
    return;
  }

  const method = settings.methods[index];

  if (!method) {
    return;
  }

  setNewMethod({
    ...method,
  });

  setEditingIndex(index);
  setShowAddForm(true);
  setMessage("");
  setMessageType("success");

  // ---------------------------------------------------
  // SCROLL TO FORM
  // ---------------------------------------------------

  window.setTimeout(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, 50);
};

// =====================================================
// CANCEL ADD / EDIT
// =====================================================

const cancelEdit = () => {
  setNewMethod(createEmptyMethod());
  setEditingIndex(null);
  setShowAddForm(false);
  setMessage("");
  setMessageType("success");
};

// =====================================================
// DELETE PAYMENT METHOD
// =====================================================

const deletePaymentMethod = (
  index: number
) => {
  if (
    index < 0 ||
    index >= settings.methods.length
  ) {
    return;
  }

  const method = settings.methods[index];

  if (!method) {
    return;
  }

  const methodName =
    method.type || "this payment method";

  const confirmed = window.confirm(
    `Delete "${methodName}" payment method?`
  );

  if (!confirmed) {
    return;
  }

  setSettings((prev) => {
    const methods = prev.methods.filter(
      (_, itemIndex) =>
        itemIndex !== index
    );

    return {
      ...prev,
      methods,
      paymentMethods: [...methods],
      total: methods.length,
    };
  });

  // ---------------------------------------------------
  // FIX EDIT INDEX AFTER DELETE
  // ---------------------------------------------------

  if (editingIndex === index) {
    setNewMethod(createEmptyMethod());
    setEditingIndex(null);
    setShowAddForm(false);
  } else if (
    editingIndex !== null &&
    editingIndex > index
  ) {
    setEditingIndex(
      editingIndex - 1
    );
  }

  setMessage(
    "Payment method removed locally. Click Save Payment Methods."
  );
  setMessageType("success");
};

// =====================================================
// TOGGLE PAYMENT METHOD
// =====================================================

const togglePaymentMethod = (
  index: number
) => {
  if (
    index < 0 ||
    index >= settings.methods.length
  ) {
    return;
  }

  setSettings((prev) => {
    const methods = prev.methods.map(
      (method, itemIndex) => {
        if (itemIndex !== index) {
          return method;
        }

        return {
          ...method,
          enabled: !method.enabled,
        };
      }
    );

    return {
      ...prev,
      methods,
      paymentMethods: [...methods],
      total: methods.length,
    };
  });

  setMessage(
    "Payment method status changed locally. Click Save Payment Methods."
  );
  setMessageType("success");
};

// =====================================================
// TOGGLE ALL DEPOSITS
// =====================================================

const toggleDeposits = () => {
  setSettings((prev) => ({
    ...prev,
    depositsEnabled:
      !prev.depositsEnabled,
  }));

  setMessage(
    "Deposit status changed locally."
  );
  setMessageType("success");
};

// =====================================================
// UPDATE DEPOSIT LIMIT
// =====================================================

const updateDepositLimit = (
  field:
    | "minimumDeposit"
    | "maximumDeposit",
  value: string
) => {
  // ---------------------------------------------------
  // EMPTY VALUE
  // ---------------------------------------------------

  if (value.trim() === "") {
    setSettings((prev) => ({
      ...prev,
      [field]: 0,
    }));

    return;
  }

  // ---------------------------------------------------
  // NUMERIC VALUE
  // ---------------------------------------------------

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return;
  }

  setSettings((prev) => ({
    ...prev,
    [field]: Math.max(
      0,
      numericValue
    ),
  }));
};

// =====================================================
// CONVERT FRONTEND METHOD → BACKEND V18 METHOD
// =====================================================

const convertToV18Method = (
  item: DepositPaymentMethod
): BackendPaymentMethod => {
  const displayType = String(
    item.type || ""
  )
    .trim()
    .toUpperCase();

  // ---------------------------------------------------
  // BANK TRANSFER
  // ---------------------------------------------------

  if (
    displayType === "BANK TRANSFER" ||
    displayType === "BANK"
  ) {
    return {
      _id: item._id,

      method: "BANK",

      title:
        item.title ||
        "Bank Transfer",

      enabled:
        item.enabled !== false,

      accountTitle:
        item.accountName || "",

      accountNumber:
        item.accountNumber || "",

      iban:
        item.iban || "",

      walletAddress: "",

      network: "",

      qrImage:
        item.qrCode || "",
    };
  }

  // ---------------------------------------------------
  // JAZZCASH
  // ---------------------------------------------------

  if (
    displayType === "JAZZ CASH" ||
    displayType === "JAZZCASH"
  ) {
    return {
      _id: item._id,

      method: "JAZZCASH",

      title:
        item.title ||
        "JazzCash",

      enabled:
        item.enabled !== false,

      accountTitle:
        item.accountName || "",

      accountNumber:
        item.accountNumber || "",

      iban: "",

      walletAddress: "",

      network: "",

      qrImage:
        item.qrCode || "",
    };
  }

  // ---------------------------------------------------
  // EASYPAISA
  // ---------------------------------------------------

  if (
    displayType === "EASY PAISA" ||
    displayType === "EASYPAISA"
  ) {
    return {
      _id: item._id,

      method: "EASYPAISA",

      title:
        item.title ||
        "EasyPaisa",

      enabled:
        item.enabled !== false,

      accountTitle:
        item.accountName || "",

      accountNumber:
        item.accountNumber || "",

      iban: "",

      walletAddress: "",

      network: "",

      qrImage:
        item.qrCode || "",
    };
  }

  // ---------------------------------------------------
  // BINANCE / USDT
  // ---------------------------------------------------

  if (
    displayType === "BINANCE" ||
    displayType === "BINANCE USDT" ||
    displayType === "USDT"
  ) {
    const walletAddress =
      item.walletAddress ||
      item.accountNumber ||
      "";

    return {
      _id: item._id,

      method: "BINANCE",

      title:
        item.title ||
        "Binance USDT",

      enabled:
        item.enabled !== false,

      accountTitle:
        item.accountName || "",

      accountNumber:
        walletAddress,

      iban: "",

      walletAddress,

      network:
        item.network || "",

      qrImage:
        item.qrCode || "",
    };
  }

  // ---------------------------------------------------
  // GENERIC PAYMENT METHOD
  // ---------------------------------------------------

  const genericMethod =
    displayType
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50);

  return {
    _id: item._id,

    method:
      genericMethod ||
      "OTHER",

    title:
      item.title ||
      item.type ||
      "Payment Method",

    enabled:
      item.enabled !== false,

    accountTitle:
      item.accountName || "",

    accountNumber:
      item.accountNumber || "",

    iban:
      item.iban || "",

    walletAddress:
      item.walletAddress || "",

    network:
      item.network || "",

    qrImage:
      item.qrCode || "",
  };
};

// =====================================================
// VALIDATE PAYMENT METHODS BEFORE SAVE
// =====================================================

const validatePaymentMethods = (
  methods: DepositPaymentMethod[]
): string | null => {
  if (!Array.isArray(methods)) {
    return "Payment methods data is invalid.";
  }

  const seen = new Set<string>();

  for (let index = 0; index < methods.length; index++) {
    const item = methods[index];

    const type = String(
      item.type || ""
    ).trim();

    const accountName = String(
      item.accountName || ""
    ).trim();

    const accountNumber = String(
      item.accountNumber || ""
    ).trim();

    const walletAddress = String(
      item.walletAddress || ""
    ).trim();

    if (!type) {
      return `Payment method #${index + 1} name is required.`;
    }

    if (!accountName) {
      return `Account title is required for "${type}".`;
    }

    if (
      !accountNumber &&
      !walletAddress
    ) {
      return `Account number or wallet address is required for "${type}".`;
    }

    const duplicateKey = type
      .toLowerCase()
      .trim();

    if (seen.has(duplicateKey)) {
      return `Duplicate payment method "${type}".`;
    }

    seen.add(duplicateKey);
  }

  return null;
};

// =====================================================
// PART 4/8 — BACKEND SAVE SYSTEM
// =====================================================

// =====================================================
// SAFE RESPONSE JSON
// =====================================================

const readResponseJSON = async (
  response: Response
): Promise<any> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

// =====================================================
// HANDLE AUTH FAILURE
// =====================================================

const handleAuthFailure = (
  response: Response
): boolean => {
  if (response.status === 401) {
    localStorage.removeItem("token");

    setToken("");

    window.location.href = "/login";

    return true;
  }

  return false;
};

// =====================================================
// SAVE PAYMENT METHODS
// PATCH /api/payment-settings/admin/deposit
// =====================================================

const savePaymentMethods = async () => {
  if (!token) {
    setMessage(
      "Admin authentication token is missing."
    );

    setMessageType("error");

    return;
  }

  // ---------------------------------------------------
  // VALIDATE CURRENT METHODS
  // ---------------------------------------------------

  const validationError =
    validatePaymentMethods(
      settings.methods
    );

  if (validationError) {
    setMessage(validationError);

    setMessageType("error");

    return;
  }

  // ---------------------------------------------------
  // CONVERT FRONTEND → BACKEND V18
  // ---------------------------------------------------

  const depositMethods =
    settings.methods.map(
      convertToV18Method
    );

  try {
    setSaving(true);

    setMessage("");

    setError("");

    // -------------------------------------------------
    // SAVE TO PAYMENT SETTINGS API
    // -------------------------------------------------

    const response = await fetch(
      `${API}/api/payment-settings/admin/deposit`,
      {
        method: "PATCH",

        headers: adminHeaders,

        body: JSON.stringify({
          depositMethods,
        }),
      }
    );

    // -------------------------------------------------
    // AUTH FAILURE
    // -------------------------------------------------

    if (handleAuthFailure(response)) {
      return;
    }

    // -------------------------------------------------
    // READ BACKEND RESPONSE
    // -------------------------------------------------

    const data =
      await readResponseJSON(
        response
      );

    // -------------------------------------------------
    // FORBIDDEN
    // -------------------------------------------------

    if (response.status === 403) {
      throw new Error(
        data?.message ||
          "Admin access required."
      );
    }

    // -------------------------------------------------
    // BACKEND ERROR
    // -------------------------------------------------

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Unable to save payment methods (${response.status}).`
      );
    }

    if (data?.success === false) {
      throw new Error(
        data?.message ||
          "Payment methods could not be saved."
      );
    }

    // -------------------------------------------------
    // IMPORTANT:
    // RELOAD FROM DATABASE AFTER SAVE
    // -------------------------------------------------

    await loadPaymentSettings();

    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    setMessage(
      data?.message ||
        "Payment methods saved successfully."
    );

    setMessageType("success");
  } catch (saveError) {
    console.error(
      "SAVE PAYMENT METHODS ERROR:",
      saveError
    );

    const errorMessage =
      saveError instanceof Error
        ? saveError.message
        : "Unable to save payment methods.";

    setError(errorMessage);

    setMessage(errorMessage);

    setMessageType("error");
  } finally {
    setSaving(false);
  }
};

// =====================================================
// VALIDATE GENERAL DEPOSIT SETTINGS
// =====================================================

const validateDepositSettings = ():
  | string
  | null => {
  const minimumDeposit =
    Number(settings.minimumDeposit);

  const maximumDeposit =
    Number(settings.maximumDeposit);

  // ---------------------------------------------------
  // MINIMUM VALIDATION
  // ---------------------------------------------------

  if (
    !Number.isFinite(
      minimumDeposit
    ) ||
    minimumDeposit <= 0
  ) {
    return "Minimum deposit must be greater than 0.";
  }

  // ---------------------------------------------------
  // MAXIMUM VALIDATION
  // ---------------------------------------------------

  if (
    !Number.isFinite(
      maximumDeposit
    ) ||
    maximumDeposit <= 0
  ) {
    return "Maximum deposit must be greater than 0.";
  }

  // ---------------------------------------------------
  // RANGE VALIDATION
  // ---------------------------------------------------

  if (
    minimumDeposit >
    maximumDeposit
  ) {
    return "Minimum deposit cannot be greater than maximum deposit.";
  }

  return null;
};

// =====================================================
// SAVE GENERAL DEPOSIT SETTINGS
// PATCH /api/deposit/settings
// =====================================================

const saveDepositSettings = async () => {
  if (!token) {
    setMessage(
      "Admin authentication token is missing."
    );

    setMessageType("error");

    return;
  }

  // ---------------------------------------------------
  // VALIDATE LIMITS
  // ---------------------------------------------------

  const validationError =
    validateDepositSettings();

  if (validationError) {
    setMessage(validationError);

    setMessageType("error");

    return;
  }

  try {
    setSaving(true);

    setMessage("");

    setError("");

    // -------------------------------------------------
    // REQUEST PAYLOAD
    // -------------------------------------------------

    const payload = {
      depositsEnabled:
        Boolean(
          settings.depositsEnabled
        ),

      minimumDeposit:
        Number(
          settings.minimumDeposit
        ),

      maximumDeposit:
        Number(
          settings.maximumDeposit
        ),
    };

    // -------------------------------------------------
    // SAVE GENERAL SETTINGS
    // -------------------------------------------------

    const response = await fetch(
      `${API}/api/deposit/settings`,
      {
        method: "PATCH",

        headers: adminHeaders,

        body: JSON.stringify(
          payload
        ),
      }
    );

    // -------------------------------------------------
    // AUTH FAILURE
    // -------------------------------------------------

    if (handleAuthFailure(response)) {
      return;
    }

    // -------------------------------------------------
    // READ RESPONSE
    // -------------------------------------------------

    const data =
      await readResponseJSON(
        response
      );

    // -------------------------------------------------
    // FORBIDDEN
    // -------------------------------------------------

    if (response.status === 403) {
      throw new Error(
        data?.message ||
          "Admin access required."
      );
    }

    // -------------------------------------------------
    // BACKEND ERROR
    // -------------------------------------------------

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Unable to save deposit settings (${response.status}).`
      );
    }

    if (data?.success === false) {
      throw new Error(
        data?.message ||
          "Deposit settings could not be saved."
      );
    }

    // -------------------------------------------------
    // UPDATE LOCAL STATE FROM RESPONSE
    // -------------------------------------------------

    const responseSettings =
      data?.settings ||
      data?.data ||
      null;

    if (responseSettings) {
      setSettings((prev) => ({
        ...prev,

        depositsEnabled:
          typeof responseSettings
            .depositsEnabled ===
          "boolean"
            ? responseSettings
                .depositsEnabled
            : prev.depositsEnabled,

        minimumDeposit:
          Number.isFinite(
            Number(
              responseSettings
                .minimumDeposit
            )
          )
            ? Number(
                responseSettings
                  .minimumDeposit
              )
            : prev.minimumDeposit,

        maximumDeposit:
          Number.isFinite(
            Number(
              responseSettings
                .maximumDeposit
            )
          )
            ? Number(
                responseSettings
                  .maximumDeposit
              )
            : prev.maximumDeposit,
      }));
    }

    // -------------------------------------------------
    // SUCCESS
    // -------------------------------------------------

    setMessage(
      data?.message ||
        "Deposit settings saved successfully."
    );

    setMessageType("success");
  } catch (saveError) {
    console.error(
      "SAVE DEPOSIT SETTINGS ERROR:",
      saveError
    );

    const errorMessage =
      saveError instanceof Error
        ? saveError.message
        : "Unable to save deposit settings.";

    setError(errorMessage);

    setMessage(errorMessage);

    setMessageType("error");
  } finally {
    setSaving(false);
  }
};

// =====================================================
// SAVE EVERYTHING
// PAYMENT METHODS + GENERAL DEPOSIT SETTINGS
// LOCAL + PRODUCTION SAFE
// =====================================================

const saveAllPaymentSettings = async () => {

  // ---------------------------------------------------
  // AUTH CHECK
  // ---------------------------------------------------

  if (!token) {
    setMessage(
      "Admin authentication token is missing."
    );

    setMessageType("error");

    return;
  }

  // ---------------------------------------------------
  // VALIDATE PAYMENT METHODS
  // ---------------------------------------------------

  const methodValidation =
    validatePaymentMethods(
      settings.methods
    );

  if (methodValidation) {
    setError(methodValidation);

    setMessage(
      methodValidation
    );

    setMessageType("error");

    return;
  }

  // ---------------------------------------------------
  // VALIDATE DEPOSIT SETTINGS
  // ---------------------------------------------------

  const depositValidation =
    validateDepositSettings();

  if (depositValidation) {
    setError(depositValidation);

    setMessage(
      depositValidation
    );

    setMessageType("error");

    return;
  }

  // ---------------------------------------------------
  // BUILD V18 PAYMENT METHODS
  // ---------------------------------------------------

  const depositMethods =
    settings.methods.map(
      convertToV18Method
    );

  try {

    setSaving(true);

    setMessage("");

    setError("");

    // =================================================
    // STEP 1 — SAVE PAYMENT METHODS
    // =================================================

    const methodsResponse =
      await fetch(
        `${API}/api/payment-settings/admin/deposit`,
        {
          method: "PATCH",

          headers: {
            ...adminHeaders,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            depositMethods,
          }),

          cache: "no-store",
        }
      );

    // -------------------------------------------------
    // AUTH FAILURE
    // -------------------------------------------------

    if (
      handleAuthFailure(
        methodsResponse
      )
    ) {
      return;
    }

    // -------------------------------------------------
    // READ RESPONSE
    // -------------------------------------------------

    const methodsData =
      await readResponseJSON(
        methodsResponse
      );

    // -------------------------------------------------
    // ADMIN ACCESS
    // -------------------------------------------------

    if (
      methodsResponse.status === 403
    ) {
      throw new Error(
        methodsData?.message ||
        "Admin access required."
      );
    }

    // -------------------------------------------------
    // SAVE ERROR
    // -------------------------------------------------

    if (
      !methodsResponse.ok ||
      methodsData?.success === false
    ) {
      throw new Error(
        methodsData?.message ||
        methodsData?.error ||
        `Payment methods save failed (${methodsResponse.status}).`
      );
    }

    // =================================================
    // STEP 2 — SAVE GENERAL DEPOSIT SETTINGS
    // =================================================

    const depositResponse =
      await fetch(
        `${API}/api/deposit/settings`,
        {
          method: "PATCH",

          headers: {
            ...adminHeaders,
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            depositsEnabled:
              Boolean(
                settings.depositsEnabled
              ),

            minimumDeposit:
              Number(
                settings.minimumDeposit
              ),

            maximumDeposit:
              Number(
                settings.maximumDeposit
              ),
          }),

          cache: "no-store",
        }
      );

    // -------------------------------------------------
    // AUTH FAILURE
    // -------------------------------------------------

    if (
      handleAuthFailure(
        depositResponse
      )
    ) {
      return;
    }

    // -------------------------------------------------
    // READ RESPONSE
    // -------------------------------------------------

    const depositData =
      await readResponseJSON(
        depositResponse
      );

    // -------------------------------------------------
    // ADMIN ACCESS
    // -------------------------------------------------

    if (
      depositResponse.status === 403
    ) {
      throw new Error(
        depositData?.message ||
        "Admin access required."
      );
    }

    // -------------------------------------------------
    // SAVE ERROR
    // -------------------------------------------------

    if (
      !depositResponse.ok ||
      depositData?.success === false
    ) {
      throw new Error(
        depositData?.message ||
        depositData?.error ||
        `Deposit settings save failed (${depositResponse.status}).`
      );
    }

    // =================================================
    // STEP 3 — RELOAD FROM DATABASE
    // =================================================

    await loadPaymentSettings();

    // =================================================
    // SUCCESS
    // =================================================

    setError("");

    setMessage(
      "All payment settings saved successfully."
    );

    setMessageType(
      "success"
    );

  } catch (saveError) {

    // =================================================
    // ERROR HANDLING
    // =================================================

    console.error(
      "SAVE ALL PAYMENT SETTINGS ERROR:",
      saveError
    );

    const errorMessage =
      saveError instanceof Error
        ? saveError.message
        : "Unable to save payment settings.";

    setError(
      errorMessage
    );

    setMessage(
      errorMessage
    );

    setMessageType(
      "error"
    );

  } finally {

    // =================================================
    // STOP SAVING
    // =================================================

    setSaving(false);
  }
};

  // =====================================================
  // PART 5/8 — MAIN UI / HEADER / STATISTICS
  // =====================================================

  // =====================================================
  // SEARCHED PAYMENT METHODS
  // =====================================================

  const filteredMethods = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) {
      return settings.methods.map(
        (method, index) => ({
          method,
          originalIndex: index,
        })
      );
    }

    return settings.methods
      .map((method, index) => ({
        method,
        originalIndex: index,
      }))
      .filter(({ method }) => {
        const searchable = [
          method.type,
          method.accountName,
          method.accountNumber,
          method.instructions,
          method.method,
          method.title,
          method.iban,
          method.walletAddress,
          method.network,
        ]
          .map((value) =>
            String(value || "")
          )
          .join(" ")
          .toLowerCase();

        return searchable.includes(
          keyword
        );
      });
  }, [
    settings.methods,
    search,
  ]);

  // =====================================================
  // LAST UPDATED
  // =====================================================

  const lastUpdatedLabel = useMemo(() => {
    if (!settings.updatedAt) {
      return "Never Updated";
    }

    return formatDate(
      settings.updatedAt
    );
  }, [
    settings.updatedAt,
  ]);

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw
            size={42}
            className="animate-spin text-yellow-400"
          />

          <p className="text-gray-400">
            Loading payment settings...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

          <div>
            <div className="flex items-center gap-3">

              <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/30">
                <Settings
                  size={28}
                  className="text-yellow-400"
                />
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-black">
                  Payment Settings
                </h1>

                <p className="text-gray-400 text-sm mt-1">
                  Manage deposit payment methods
                </p>
              </div>

            </div>
          </div>

          <div className="flex flex-wrap gap-3">

            {/* REFRESH */}

            <button
              type="button"
              onClick={
                refreshPaymentSettings
              }
              disabled={
                refreshing ||
                saving
              }
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-yellow-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* SAVE ALL */}

            <button
              type="button"
              onClick={
                saveAllPaymentSettings
              }
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />

              {saving
                ? "Saving..."
                : "Save All Settings"}
            </button>

          </div>
        </div>

        {/* =================================================
            SUCCESS / ERROR MESSAGE
        ================================================= */}

        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 flex items-center gap-3 ${
              messageType === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {messageType === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}

            <span className="font-medium">
              {message}
            </span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* =================================================
            STATISTICS CARDS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* TOTAL */}

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-gray-500 text-sm">
                  Total Methods
                </p>

                <p className="text-2xl font-black mt-1">
                  {statistics.totalMethods}
                </p>
              </div>

              <CreditCard
                className="text-yellow-400"
                size={28}
              />
            </div>
          </div>

          {/* ACTIVE */}

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-gray-500 text-sm">
                  Active
                </p>

                <p className="text-2xl font-black text-green-400 mt-1">
                  {statistics.activeMethods}
                </p>
              </div>

              <CheckCircle
                className="text-green-400"
                size={28}
              />
            </div>
          </div>

          {/* INACTIVE */}

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-gray-500 text-sm">
                  Inactive
                </p>

                <p className="text-2xl font-black text-red-400 mt-1">
                  {statistics.inactiveMethods}
                </p>
              </div>

              <XCircle
                className="text-red-400"
                size={28}
              />
            </div>
          </div>

          {/* DEPOSITS STATUS */}

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-gray-500 text-sm">
                  Deposits
                </p>

                <p
                  className={`text-2xl font-black mt-1 ${
                    settings.depositsEnabled
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {settings.depositsEnabled
                    ? "ON"
                    : "OFF"}
                </p>
              </div>

              <Power
                className={
                  settings.depositsEnabled
                    ? "text-green-400"
                    : "text-red-400"
                }
                size={28}
              />
            </div>
          </div>

        </div>

        {/* =================================================
            GENERAL DEPOSIT SETTINGS
        ================================================= */}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 mb-8">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

            <div>
              <h2 className="text-xl font-bold">
                General Deposit Settings
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Control deposit availability and limits.
              </p>
            </div>

            {/* DEPOSIT TOGGLE */}

            <button
              type="button"
              onClick={
                toggleDeposits
              }
              disabled={saving}
              className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
                settings.depositsEnabled
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              } disabled:opacity-50`}
            >
              <Power size={18} />

              <span className="font-bold">
                {settings.depositsEnabled
                  ? "Deposits Enabled"
                  : "Deposits Disabled"}
              </span>
            </button>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* MINIMUM */}

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Minimum Deposit
              </label>

              <div className="relative">
                <DollarSign
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    settings.minimumDeposit
                  }
                  onChange={(e) =>
                    updateDepositLimit(
                      "minimumDeposit",
                      e.target.value
                    )
                  }
                  className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-yellow-500 transition"
                  placeholder="Minimum deposit"
                />
              </div>
            </div>

            {/* MAXIMUM */}

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Maximum Deposit
              </label>

              <div className="relative">
                <DollarSign
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    settings.maximumDeposit
                  }
                  onChange={(e) =>
                    updateDepositLimit(
                      "maximumDeposit",
                      e.target.value
                    )
                  }
                  className="w-full bg-black border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-yellow-500 transition"
                  placeholder="Maximum deposit"
                />
              </div>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-5 border-t border-zinc-800">

            <div className="text-sm text-gray-500">
              Last updated:{" "}
              <span className="text-gray-300">
                {lastUpdatedLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={
                saveDepositSettings
              }
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-yellow-500 transition font-semibold disabled:opacity-50"
            >
              <Save size={18} />

              {saving
                ? "Saving..."
                : "Save Deposit Settings"}
            </button>

          </div>

        </div>

        {/* =================================================
            PAYMENT METHODS SECTION HEADER
        ================================================= */}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">

          <div>
            <h2 className="text-xl md:text-2xl font-bold">
              Payment Methods
            </h2>

            <p className="text-gray-500 text-sm mt-1">
              Add and manage the payment methods users can use for deposits.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewMethod(
                createEmptyMethod()
              );

              setEditingIndex(null);

              setShowAddForm(true);

              setMessage("");

              window.setTimeout(() => {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
              }, 50);
            }}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50"
          >
            <Plus size={18} />

            Add Payment Method
          </button>

        </div>
                {/* =================================================
            SEARCH PAYMENT METHODS
        ================================================= */}

        <div className="mb-6">

          <div className="relative">

            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search payment methods..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-yellow-500 transition"
            />

          </div>

        </div>

        {/* =================================================
            PAYMENT METHODS CONTAINER
        ================================================= */}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">

          {/* =================================================
              SECTION HEADER
          ================================================= */}

          <div className="p-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <h2 className="text-xl font-bold">
                Payment Methods
              </h2>

              <p className="text-gray-500 text-sm mt-1">
                Last updated:{" "}
                {lastUpdatedLabel}
              </p>

            </div>

            <button
              type="button"
              onClick={() => {
                setNewMethod(
                  createEmptyMethod()
                );

                setEditingIndex(null);

                setShowAddForm(true);

                setMessage("");

                window.setTimeout(() => {
                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }, 50);
              }}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={18} />

              Add Payment Method
            </button>

          </div>
                    {/* =================================================
              ADD / EDIT PAYMENT METHOD FORM
          ================================================= */}

          {showAddForm && (
            <div className="p-5 border-b border-zinc-800 bg-black/30">

              <div className="flex items-center justify-between mb-5">

                <h3 className="text-lg font-bold">
                  {editingIndex !== null
                    ? "Edit Payment Method"
                    : "Add Payment Method"}
                </h3>

                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* PAYMENT METHOD */}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Payment Method
                  </label>

                  <input
                    type="text"
                    value={newMethod.type}
                    onChange={(e) =>
                      updateNewMethod(
                        "type",
                        e.target.value
                      )
                    }
                    placeholder="Bank Transfer / JazzCash / EasyPaisa / Binance USDT"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 transition"
                  />
                </div>

                {/* ACCOUNT NAME */}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Account Name
                  </label>

                  <input
                    type="text"
                    value={newMethod.accountName}
                    onChange={(e) =>
                      updateNewMethod(
                        "accountName",
                        e.target.value
                      )
                    }
                    placeholder="Account holder name"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 transition"
                  />
                </div>

                {/* ACCOUNT NUMBER / WALLET */}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Account Number / Wallet Address
                  </label>

                  <input
                    type="text"
                    value={
                      newMethod.accountNumber
                    }
                    onChange={(e) =>
                      updateNewMethod(
                        "accountNumber",
                        e.target.value
                      )
                    }
                    placeholder="Account number or wallet address"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 transition"
                  />
                </div>

                {/* IBAN */}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    IBAN
                  </label>

                  <input
                    type="text"
                    value={
                      newMethod.iban || ""
                    }
                    onChange={(e) =>
                      updateNewMethod(
                        "iban",
                        e.target.value
                      )
                    }
                    placeholder="Optional IBAN"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 transition"
                  />
                </div>

                {/* NETWORK */}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Network
                  </label>

                  <input
                    type="text"
                    value={
                      newMethod.network || ""
                    }
                    onChange={(e) =>
                      updateNewMethod(
                        "network",
                        e.target.value
                      )
                    }
                    placeholder="TRC20 / ERC20 / BEP20"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 transition"
                  />
                </div>

                {/* QR IMAGE */}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    QR Image URL
                  </label>

                  <input
                    type="text"
                    value={
                      newMethod.qrCode || ""
                    }
                    onChange={(e) =>
                      updateNewMethod(
                        "qrCode",
                        e.target.value
                      )
                    }
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 transition"
                  />
                </div>

              </div>

              {/* INSTRUCTIONS */}

              <div className="mt-4">

                <label className="block text-sm text-gray-400 mb-2">
                  Instructions
                </label>

                <textarea
                  value={
                    newMethod.instructions ||
                    ""
                  }
                  onChange={(e) =>
                    updateNewMethod(
                      "instructions",
                      e.target.value
                    )
                  }
                  placeholder="Optional payment instructions"
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 resize-none transition"
                />

              </div>

              {/* ENABLE / DISABLE */}

              <div className="mt-4 flex items-center gap-3">

                <button
                  type="button"
                  onClick={() =>
                    updateNewMethod(
                      "enabled",
                      !newMethod.enabled
                    )
                  }
                  className={`relative w-12 h-6 rounded-full transition ${
                    newMethod.enabled
                      ? "bg-green-500"
                      : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                      newMethod.enabled
                        ? "left-7"
                        : "left-1"
                    }`}
                  />
                </button>

                <span className="text-sm text-gray-300">
                  {newMethod.enabled
                    ? "Enabled"
                    : "Disabled"}
                </span>

              </div>

              {/* FORM ACTIONS */}

              <div className="flex flex-wrap gap-3 mt-6">

                <button
                  type="button"
                  onClick={
                    addPaymentMethod
                  }
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={18} />

                  {editingIndex !== null
                    ? "Update Method"
                    : "Add Method"}
                </button>

                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-5 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>

              </div>

            </div>
          )}

          {/* =================================================
              PAYMENT METHODS LIST
          ================================================= */}

          <div className="divide-y divide-zinc-800">

            {/* EMPTY STATE */}

            {filteredMethods.length === 0 && (
              <div className="p-10 text-center">

                <CreditCard
                  size={42}
                  className="mx-auto text-gray-600 mb-4"
                />

                <p className="text-gray-400">
                  No payment methods found.
                </p>

                {search.trim() && (
                  <p className="text-gray-600 text-sm mt-2">
                    Try another search term.
                  </p>
                )}

              </div>
            )}

            {/* METHODS */}

            {filteredMethods.map(
              ({
                method,
                originalIndex,
              }) => (
                <div
                  key={
                    method._id ||
                    `${method.type}-${originalIndex}`
                  }
                  className="p-5 hover:bg-white/[0.02] transition"
                >

                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                    {/* METHOD INFORMATION */}

                    <div className="flex items-start gap-4 min-w-0">

                      <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 shrink-0">

                        <CreditCard
                          size={24}
                          className="text-yellow-400"
                        />

                      </div>

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-bold text-lg break-words">
                            {method.type}
                          </h3>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              method.enabled
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                            }`}
                          >
                            {method.enabled
                              ? "ACTIVE"
                              : "INACTIVE"}
                          </span>

                        </div>

                        <p className="text-gray-500 text-sm mt-1">
                          {method.accountName}
                        </p>

                        <p className="text-green-400 font-mono text-sm mt-2 break-all">
                          {method.accountNumber ||
                            method.walletAddress ||
                            "—"}
                        </p>

                        {method.iban && (
                          <p className="text-cyan-400 font-mono text-xs mt-2 break-all">
                            IBAN: {method.iban}
                          </p>
                        )}

                        {method.network && (
                          <p className="text-yellow-400 text-xs mt-2">
                            Network: {method.network}
                          </p>
                        )}

                        {method.instructions && (
                          <p className="text-gray-500 text-xs mt-2 max-w-2xl whitespace-pre-wrap">
                            {method.instructions}
                          </p>
                        )}

                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-wrap gap-2 shrink-0">

                      {/* TOGGLE */}

                      <button
                        type="button"
                        onClick={() =>
                          togglePaymentMethod(
                            originalIndex
                          )
                        }
                        disabled={saving}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition ${
                          method.enabled
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-zinc-800 text-gray-300 border border-zinc-700"
                        } disabled:opacity-50`}
                      >
                        <Power size={17} />

                        {method.enabled
                          ? "ON"
                          : "OFF"}
                      </button>

                      {/* EDIT */}

                      <button
                        type="button"
                        onClick={() =>
                          editPaymentMethod(
                            originalIndex
                          )
                        }
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition disabled:opacity-50"
                      >
                        <Settings size={17} />

                        Edit
                      </button>

                      {/* DELETE */}

                      <button
                        type="button"
                        onClick={() =>
                          deletePaymentMethod(
                            originalIndex
                          )
                        }
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition disabled:opacity-50"
                      >
                        <Trash2 size={17} />

                        Delete
                      </button>

                    </div>

                  </div>

                  {/* QR PREVIEW */}

                  {method.qrCode && (
                    <div className="mt-5 flex items-center gap-4">

                      <img
                        src={method.qrCode}
                        alt={`${method.type} QR`}
                        className="w-24 h-24 object-contain rounded-xl bg-white p-2 border border-zinc-700"
                      />

                      <div>

                        <p className="text-sm text-gray-400">
                          QR Code
                        </p>

                        <p className="text-xs text-gray-600 mt-1">
                          Payment QR configured
                        </p>

                      </div>

                    </div>
                  )}

                  {/* COPY BUTTONS */}

                  <div className="mt-4 flex flex-wrap gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          method.accountNumber ||
                            method.walletAddress ||
                            ""
                        )
                      }
                      disabled={
                        !(
                          method.accountNumber ||
                          method.walletAddress
                        )
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-gray-300 hover:text-white transition text-sm disabled:opacity-40"
                    >
                      <Copy size={15} />

                      Copy Account
                    </button>

                    {method.iban && (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            method.iban || ""
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-gray-300 hover:text-white transition text-sm"
                      >
                        <Copy size={15} />

                        Copy IBAN
                      </button>
                    )}

                    {method.walletAddress && (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            method.walletAddress ||
                              ""
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-gray-300 hover:text-white transition text-sm"
                      >
                        <Copy size={15} />

                        Copy Wallet
                      </button>
                    )}

                  </div>

                </div>
              )
            )}

          </div>
                    {/* =================================================
              FINAL SAVE BAR
          ================================================= */}

          <div className="mt-6 p-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

              {/* SAVE INFORMATION */}

              <div>

                <div className="flex items-center gap-2">

                  <Shield
                    size={18}
                    className="text-yellow-400"
                  />

                  <h3 className="font-bold text-white">
                    Save Payment Settings
                  </h3>

                </div>

                <p className="text-sm text-gray-500 mt-1">
                  Save all payment methods and deposit
                  settings to the GoldTrade V18 backend.
                </p>

                {settings.updatedAt && (
                  <p className="text-xs text-gray-600 mt-2">
                    Last updated:{" "}
                    {new Date(settings.updatedAt).toLocaleString()}
                  </p>
                )}

              </div>

              {/* SAVE BUTTON */}

              <button
                type="button"
                onClick={saveAllPaymentSettings}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-yellow-500 text-black font-extrabold hover:bg-yellow-400 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[190px]"
              >

                {saving ? (
                  <>
                    <RefreshCw
                      size={18}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />

                    Save All Settings
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          PAGE FOOTER
      ===================================================== */}

      <div className="mt-6 text-center text-xs text-gray-600">

        <p>
          GoldTrade V18 Payment Settings
        </p>

        <p className="mt-1">
          Admin-only configuration panel
        </p>

      </div>

    </div>
  );
}