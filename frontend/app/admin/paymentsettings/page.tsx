"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Wallet,
  Landmark,
  Building2,
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

// =====================================================
// API URL
// GOLDTRADE V18
// =====================================================

const API = (() => {
  const configuredAPI =
    process.env.NEXT_PUBLIC_API_URL?.trim();

  if (configuredAPI) {
    return configuredAPI.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0"
    ) {
      return "http://localhost:5000";
    }

    return "https://goldtrade-2.onrender.com";
  }

  return "https://goldtrade-2.onrender.com";
})();

// =====================================================
// V18 BACKEND PAYMENT METHOD
// =====================================================

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

// =====================================================
// FRONTEND PAYMENT METHOD
// =====================================================

interface DepositPaymentMethod {
  _id?: string;

  type: string;

  accountName: string;

  accountNumber: string;

  qrCode: string;

  instructions: string;

  enabled: boolean;

  // V18 fields
  method?: string;

  title?: string;

  iban?: string;

  walletAddress?: string;

  network?: string;
}

// =====================================================
// DEPOSIT SETTINGS
// =====================================================

interface DepositSettings {
  depositsEnabled: boolean;

  minimumDeposit: number;

  maximumDeposit: number;

  methods: DepositPaymentMethod[];

  paymentMethods?: DepositPaymentMethod[];

  total?: number;

  updatedAt?: string;
}

// =====================================================
// STATISTICS
// =====================================================

interface PaymentStatistics {
  totalMethods: number;

  activeMethods: number;

  inactiveMethods: number;

  depositsEnabled: boolean;

  minimumDeposit: number;

  maximumDeposit: number;
}

// =====================================================
// EMPTY METHOD
// =====================================================

const createEmptyMethod = (): DepositPaymentMethod => ({
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

// =====================================================
// COMPONENT
// =====================================================

export default function PaymentSettingsPage() {
  // ===================================================
  // AUTH
  // ===================================================

  const [token, setToken] = useState("");

  const [adminName, setAdminName] =
    useState("Administrator");

  // ===================================================
  // SETTINGS
  // ===================================================

  const [settings, setSettings] =
    useState<DepositSettings>({
      depositsEnabled: true,

      minimumDeposit: 1000,

      maximumDeposit: 10000000,

      methods: [],

      paymentMethods: [],

      total: 0,
    });

  // ===================================================
  // NEW PAYMENT METHOD
  // ===================================================

  const [newMethod, setNewMethod] =
    useState<DepositPaymentMethod>(
      createEmptyMethod()
    );

  // ===================================================
  // STATISTICS
  // ===================================================

  const [statistics, setStatistics] =
    useState<PaymentStatistics>({
      totalMethods: 0,

      activeMethods: 0,

      inactiveMethods: 0,

      depositsEnabled: true,

      minimumDeposit: 1000,

      maximumDeposit: 10000000,
    });

  // ===================================================
  // UI STATES
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  const [error, setError] =
    useState("");

  // ===================================================
  // SEARCH
  // ===================================================

  const [search, setSearch] =
    useState("");

  // ===================================================
  // EDITING
  // ===================================================

  const [editingIndex, setEditingIndex] =
    useState<number | null>(null);

  // ===================================================
  // FORM VISIBILITY
  // ===================================================

  const [showAddForm, setShowAddForm] =
    useState(false);

  // ===================================================
  // TOKEN LOAD
  // ===================================================

  useEffect(() => {
    try {
      const savedToken =
        localStorage.getItem("token")?.trim() || "";

      if (!savedToken) {
        window.location.href = "/login";
        return;
      }

      setToken(savedToken);
    } catch (err) {
      console.error("TOKEN LOAD ERROR:", err);

      window.location.href = "/login";
    }
  }, []);

  // ===================================================
  // REQUEST HEADERS
  // ===================================================

  const adminHeaders = useMemo(
    () => ({
      Authorization: token
        ? `Bearer ${token}`
        : "",

      "Content-Type": "application/json",
    }),
    [token]
  );

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (date?: string) => {
    if (!date) {
      return "--";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "--";
    }

    return parsed.toLocaleString("en-GB", {
      dateStyle: "medium",

      timeStyle: "short",
    });
  };

  // ===================================================
  // COPY TEXT
  // ===================================================

  const copyText = async (value: string) => {
    const text = String(value || "").trim();

    if (!text) {
      setMessage("Nothing to copy.");

      setMessageType("error");

      return;
    }

    try {
      await navigator.clipboard.writeText(text);

      setMessage("Copied successfully.");

      setMessageType("success");
    } catch (err) {
      console.error("COPY ERROR:", err);

      setMessage("Unable to copy.");

      setMessageType("error");
    }
  };

  // ===================================================
  // NORMALIZE BACKEND METHOD
  // ===================================================

  const normalizeBackendMethod = (
    method: BackendPaymentMethod
  ): DepositPaymentMethod => {
    const backendMethod =
      String(method.method || "")
        .trim()
        .toUpperCase();

    const displayTitle =
      String(
        method.title ||
          method.method ||
          ""
      ).trim();

    const accountNumber =
      backendMethod === "BINANCE"
        ? String(
            method.walletAddress ||
              method.accountNumber ||
              ""
          ).trim()
        : String(
            method.accountNumber || ""
          ).trim();

    return {
      _id: method._id,

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

      accountName: String(
        method.accountTitle || ""
      ).trim(),

      accountNumber,

      qrCode: String(
        method.qrImage || ""
      ).trim(),

      instructions: "",

      enabled: method.enabled === true,

      method: backendMethod,

      title: displayTitle,

      iban: String(
        method.iban || ""
      ).trim(),

      walletAddress: String(
        method.walletAddress || ""
      ).trim(),

      network: String(
        method.network || ""
      ).trim(),
    };
  };

  // ===================================================
  // NORMALIZE FRONTEND METHOD
  // ===================================================

  const normalizeMethod = (
    method: Partial<DepositPaymentMethod> = {}
  ): DepositPaymentMethod => {
    return {
      _id: method._id,

      type: String(
        method.type ?? ""
      ).trim(),

      accountName: String(
        method.accountName ?? ""
      ).trim(),

      accountNumber: String(
        method.accountNumber ?? ""
      ).trim(),

      qrCode: String(
        method.qrCode ?? ""
      ).trim(),

      instructions: String(
        method.instructions ?? ""
      ).trim(),

      enabled:
        method.enabled !== false,

      method: String(
        method.method ?? ""
      )
        .trim()
        .toUpperCase(),

      title: String(
        method.title ?? ""
      ).trim(),

      iban: String(
        method.iban ?? ""
      ).trim(),

      walletAddress: String(
        method.walletAddress ?? ""
      ).trim(),

      network: String(
        method.network ?? ""
      ).trim(),
    };
  };

  // ===================================================
  // NORMALIZE SETTINGS
  // ===================================================

  const normalizeSettings = (
    data: any
  ): DepositSettings => {
    const source =
      data?.settings &&
      typeof data.settings === "object"
        ? data.settings
        : data || {};

    // -------------------------------------------------
    // V18 DEPOSIT METHODS
    // -------------------------------------------------

    const backendMethods: BackendPaymentMethod[] =
      Array.isArray(
        source.depositMethods
      )
        ? source.depositMethods
        : [];

    const methods =
      backendMethods
        .filter(
          (method) =>
            method &&
            typeof method === "object"
        )
        .map(
          (
            method
          ) =>
            normalizeBackendMethod(
              method
            )
        )
        .filter(
          (method) =>
            method.type.length > 0
        );

    // -------------------------------------------------
    // DEPOSIT LIMITS
    // -------------------------------------------------

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

    // -------------------------------------------------
    // RETURN
    // -------------------------------------------------

    return {
      depositsEnabled:
        source.depositsEnabled !== false,

      minimumDeposit,

      maximumDeposit,

      methods,

      paymentMethods: [
        ...methods,
      ],

      total: methods.length,

      updatedAt:
        typeof source.updatedAt ===
        "string"
          ? source.updatedAt
          : undefined,
    };
  };

  // ===================================================
  // LOAD V18 PAYMENT SETTINGS
  // GET /api/payment-settings/admin/all
  // ===================================================

  const loadPaymentSettings =
    async () => {
      if (!token) {
        return;
      }

      try {
        setError("");

        const response =
          await fetch(
            `${API}/api/payment-settings/admin/all`,
            {
              method: "GET",

              headers: adminHeaders,

              cache: "no-store",
            }
          );

        // ---------------------------------------------
        // SAFE JSON
        // ---------------------------------------------

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

        // ---------------------------------------------
        // AUTH EXPIRED
        // ---------------------------------------------

        if (
          response.status === 401
        ) {
          localStorage.removeItem(
            "token"
          );

          setToken("");

          window.location.href =
            "/login";

          return;
        }

        // ---------------------------------------------
        // ADMIN ACCESS
        // ---------------------------------------------

        if (
          response.status === 403
        ) {
          throw new Error(
            data?.message ||
              "Admin access required."
          );
        }

        // ---------------------------------------------
        // HTTP ERROR
        // ---------------------------------------------

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Request failed with status ${response.status}.`
          );
        }

        // ---------------------------------------------
        // API ERROR
        // ---------------------------------------------

        if (
          data &&
          data.success === false
        ) {
          throw new Error(
            data.message ||
              "Unable to load payment settings."
          );
        }

        // ---------------------------------------------
        // NORMALIZE
        // ---------------------------------------------

        const normalized =
          normalizeSettings(data);

        // ---------------------------------------------
        // UPDATE SETTINGS
        // ---------------------------------------------

        setSettings(
          normalized
        );

        // ---------------------------------------------
        // STATISTICS
        // ---------------------------------------------

        const activeMethods =
          normalized.methods.filter(
            (method) =>
              method.enabled === true
          ).length;

        const inactiveMethods =
          Math.max(
            0,
            normalized.methods.length -
              activeMethods
          );

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

        setError("");
      } catch (err: any) {
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

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    let mounted = true;

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

  // ===================================================
  // REFRESH
  // ===================================================

  const refreshPaymentSettings =
    async () => {
      if (!token) {
        setMessage(
          "Please login again."
        );

        setMessageType("error");

        return;
      }

      try {
        setRefreshing(true);

        setError("");

        await loadPaymentSettings();

        setMessage(
          "Payment settings refreshed."
        );

        setMessageType("success");
      } catch (err: any) {
        console.error(
          "REFRESH PAYMENT SETTINGS ERROR:",
          err
        );

        setMessage(
          err?.message ||
            "Unable to refresh payment settings."
        );

        setMessageType("error");
      } finally {
        setRefreshing(false);
      }
    };

  // ===================================================
  // AUTO CLEAR MESSAGE
  // ===================================================

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setMessage("");
      }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);

  // ===================================================
  // UPDATE NEW METHOD
  // ===================================================

  const updateNewMethod = (
    field: keyof DepositPaymentMethod,
    value: string | boolean
  ) => {
    setNewMethod((prev) => ({
      ...prev,

      [field]: value,
    }));
  };
  // =====================================================
// ADD / UPDATE PAYMENT METHOD
// =====================================================

const addPaymentMethod = () => {
  const method = normalizeMethod(newMethod);

  // ---------------------------------------------------
  // VALIDATE METHOD NAME
  // ---------------------------------------------------

  if (!method.type) {
    setMessage(
      "Payment method name is required."
    );

    setMessageType("error");

    return;
  }

  // ---------------------------------------------------
  // VALIDATE ACCOUNT NAME
  // ---------------------------------------------------

  if (!method.accountName) {
    setMessage(
      "Account name is required."
    );

    setMessageType("error");

    return;
  }

  // ---------------------------------------------------
  // VALIDATE ACCOUNT NUMBER
  // ---------------------------------------------------

  if (!method.accountNumber) {
    setMessage(
      "Account number / wallet address is required."
    );

    setMessageType("error");

    return;
  }

  // ---------------------------------------------------
  // NORMALIZE METHOD NAME
  // ---------------------------------------------------

  const normalizedType =
    method.type
      .toLowerCase()
      .trim();

  // ---------------------------------------------------
  // DUPLICATE CHECK
  // ---------------------------------------------------

  const duplicate =
    settings.methods.some(
      (item, index) => {
        if (
          editingIndex !== null &&
          index === editingIndex
        ) {
          return false;
        }

        return (
          String(
            item.type || ""
          )
            .toLowerCase()
            .trim() ===
          normalizedType
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
  // UPDATE EXISTING
  // ---------------------------------------------------

  if (editingIndex !== null) {
    setSettings((prev) => {
      if (
        editingIndex < 0 ||
        editingIndex >=
          prev.methods.length
      ) {
        return prev;
      }

      const methods = [
        ...prev.methods,
      ];

      methods[editingIndex] = {
        ...method,

        _id:
          method._id ||
          prev.methods[
            editingIndex
          ]?._id,
      };

      return {
        ...prev,

        methods,

        paymentMethods: [
          ...methods,
        ],

        total: methods.length,
      };
    });

    setMessage(
      "Payment method updated locally. Click Save Payment Methods."
    );

    setMessageType("success");
  }

  // ---------------------------------------------------
  // ADD NEW
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

        paymentMethods: [
          ...methods,
        ],

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

  setNewMethod(
    createEmptyMethod()
  );

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

  const method =
    settings.methods[index];

  if (!method) {
    return;
  }

  setNewMethod({
    ...method,
  });

  setEditingIndex(index);

  setShowAddForm(true);

  setMessage("");

  // ---------------------------------------------------
  // SCROLL TO TOP
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
  setNewMethod(
    createEmptyMethod()
  );

  setEditingIndex(null);

  setShowAddForm(false);

  setMessage("");
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

  const method =
    settings.methods[index];

  if (!method) {
    return;
  }

  const methodName =
    method.type ||
    "this payment method";

  const confirmed =
    window.confirm(
      `Delete "${methodName}" payment method?`
    );

  if (!confirmed) {
    return;
  }

  setSettings((prev) => {
    const methods =
      prev.methods.filter(
        (_, itemIndex) =>
          itemIndex !== index
      );

    return {
      ...prev,

      methods,

      paymentMethods: [
        ...methods,
      ],

      total: methods.length,
    };
  });

  // ---------------------------------------------------
  // EDITING STATE
  // ---------------------------------------------------

  if (editingIndex === index) {
    setNewMethod(
      createEmptyMethod()
    );

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
  setSettings((prev) => {
    if (
      index < 0 ||
      index >= prev.methods.length
    ) {
      return prev;
    }

    const methods =
      prev.methods.map(
        (method, itemIndex) => {
          if (
            itemIndex !== index
          ) {
            return method;
          }

          return {
            ...method,

            enabled:
              !method.enabled,
          };
        }
      );

    return {
      ...prev,

      methods,

      paymentMethods: [
        ...methods,
      ],

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
  if (
    value.trim() === ""
  ) {
    setSettings((prev) => ({
      ...prev,

      [field]: 0,
    }));

    return;
  }

  const numericValue =
    Number(value);

  if (
    !Number.isFinite(
      numericValue
    )
  ) {
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
// CONVERT FRONTEND METHOD → V18 METHOD
// =====================================================

const convertToV18Method = (
  item: DepositPaymentMethod
): BackendPaymentMethod => {
  const displayType =
    String(
      item.type || ""
    )
      .trim()
      .toUpperCase();

  // ---------------------------------------------------
  // BANK
  // ---------------------------------------------------

  if (
    displayType ===
      "BANK TRANSFER" ||
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

      walletAddress:
        "",

      network:
        "",

      qrImage:
        item.qrCode || "",
    };
  }

  // ---------------------------------------------------
  // JAZZCASH
  // ---------------------------------------------------

  if (
    displayType ===
      "JAZZ CASH" ||
    displayType ===
      "JAZZCASH"
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

      iban:
        "",

      walletAddress:
        "",

      network:
        "",

      qrImage:
        item.qrCode || "",
    };
  }

  // ---------------------------------------------------
  // EASYPAISA
  // ---------------------------------------------------

  if (
    displayType ===
      "EASY PAISA" ||
    displayType ===
      "EASYPAISA"
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

      iban:
        "",

      walletAddress:
        "",

      network:
        "",

      qrImage:
        item.qrCode || "",
    };
  }

  // ---------------------------------------------------
  // BINANCE / USDT
  // ---------------------------------------------------

  if (
    displayType.includes(
      "BINANCE"
    ) ||
    displayType.includes(
      "USDT"
    )
  ) {
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
        "",

      iban:
        "",

      walletAddress:
        item.walletAddress ||
        item.accountNumber ||
        "",

      network:
        item.network ||
        "TRC20",

      qrImage:
        item.qrCode || "",
    };
  }

  // ---------------------------------------------------
  // GENERIC METHOD
  // ---------------------------------------------------

  return {
    _id: item._id,

    method:
      displayType.replace(
        /[^A-Z0-9_]/g,
        "_"
      ),

    title:
      item.title ||
      item.type ||
      displayType,

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
// VALIDATE PAYMENT METHODS
// =====================================================

const validatePaymentMethods = (
  methods: DepositPaymentMethod[]
) => {
  // ---------------------------------------------------
  // MAX METHODS
  // ---------------------------------------------------

  if (methods.length > 20) {
    return "Maximum 20 payment methods are allowed.";
  }

  // ---------------------------------------------------
  // REQUIRED FIELDS
  // ---------------------------------------------------

  for (const method of methods) {
    if (!method.type.trim()) {
      return "Every payment method must have a name.";
    }

    if (!method.accountName.trim()) {
      return `Account name is required for "${method.type}".`;
    }

    if (!method.accountNumber.trim()) {
      return `Account number / wallet address is required for "${method.type}".`;
    }
  }

  // ---------------------------------------------------
  // DUPLICATE CHECK
  // ---------------------------------------------------

  const methodNames =
    new Set<string>();

  for (const method of methods) {
    const normalized =
      method.type
        .trim()
        .toLowerCase();

    if (
      methodNames.has(
        normalized
      )
    ) {
      return `Duplicate payment method: "${method.type}".`;
    }

    methodNames.add(
      normalized
    );
  }

  return null;
};

// =====================================================
// SAVE PAYMENT METHODS
// V18
// PATCH /api/payment-settings/admin/deposit
// =====================================================

const savePaymentMethods =
  async () => {
    if (!token) {
      setMessage(
        "Please login again."
      );

      setMessageType("error");

      return;
    }

    // -------------------------------------------------
    // NORMALIZE
    // -------------------------------------------------

    const methods =
      settings.methods
        .map((method) =>
          normalizeMethod(
            method
          )
        )
        .filter(
          (method) =>
            method.type.length > 0
        );

    // -------------------------------------------------
    // VALIDATE
    // -------------------------------------------------

    const validationError =
      validatePaymentMethods(
        methods
      );

    if (validationError) {
      setMessage(
        validationError
      );

      setMessageType("error");

      return;
    }

    // -------------------------------------------------
    // CONVERT TO V18
    // -------------------------------------------------

    const depositMethods =
      methods.map(
        (method) =>
          convertToV18Method(
            method
          )
      );

    try {
      setSaving(true);

      setError("");

      // -----------------------------------------------
      // V18 ADMIN ENDPOINT
      // -----------------------------------------------

      const response =
        await fetch(
          `${API}/api/payment-settings/admin/deposit`,
          {
            method: "PATCH",

            headers:
              adminHeaders,

            body: JSON.stringify({
              depositMethods,
            }),

            cache: "no-store",
          }
        );

      // -----------------------------------------------
      // SAFE JSON
      // -----------------------------------------------

      let data: any = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      console.log(
        "V18 ADMIN PAYMENT SAVE:",
        data
      );

      // -----------------------------------------------
      // AUTH EXPIRED
      // -----------------------------------------------

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          "token"
        );

        setToken("");

        window.location.href =
          "/login";

        return;
      }

      // -----------------------------------------------
      // ADMIN ACCESS
      // -----------------------------------------------

      if (
        response.status === 403
      ) {
        throw new Error(
          data?.message ||
            "Admin access required."
        );
      }

      // -----------------------------------------------
      // HTTP ERROR
      // -----------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to save payment methods. HTTP ${response.status}.`
        );
      }

      // -----------------------------------------------
      // API ERROR
      // -----------------------------------------------

      if (
        data &&
        data.success === false
      ) {
        throw new Error(
          data?.message ||
            "Failed to save payment methods."
        );
      }

      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------

      setMessage(
        "Payment methods saved successfully."
      );

      setMessageType(
        "success"
      );

      // -----------------------------------------------
      // RELOAD FROM MONGODB
      // -----------------------------------------------

      await loadPaymentSettings();
    } catch (err: any) {
      console.error(
        "SAVE PAYMENT METHODS ERROR:",
        err
      );

      const errorMessage =
        err?.message ||
        "Unable to save payment methods.";

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
      setSaving(false);
    }
  };  // =====================================================
  // SAVE GENERAL DEPOSIT SETTINGS
  //
  // NOTE:
  // Payment methods are NOT saved here.
  // Payment methods use:
  // PATCH /api/payment-settings/admin/deposit
  //
  // General limits still use:
  // PATCH /api/deposit/settings
  // =====================================================

  const saveDepositSettings = async () => {
    if (!token) {
      setMessage("Please login again.");
      setMessageType("error");
      return;
    }

    // ---------------------------------------------------
    // NORMALIZE VALUES
    // ---------------------------------------------------

    const minimumDeposit = Number(
      settings.minimumDeposit
    );

    const maximumDeposit = Number(
      settings.maximumDeposit
    );

    // ---------------------------------------------------
    // VALIDATE NUMBERS
    // ---------------------------------------------------

    if (
      !Number.isFinite(
        minimumDeposit
      ) ||
      !Number.isFinite(
        maximumDeposit
      )
    ) {
      setMessage(
        "Deposit limits must contain valid numbers."
      );

      setMessageType("error");

      return;
    }

    // ---------------------------------------------------
    // POSITIVE VALIDATION
    // ---------------------------------------------------

    if (
      minimumDeposit <= 0 ||
      maximumDeposit <= 0
    ) {
      setMessage(
        "Deposit limits must be greater than zero."
      );

      setMessageType("error");

      return;
    }

    // ---------------------------------------------------
    // MIN / MAX VALIDATION
    // ---------------------------------------------------

    if (
      minimumDeposit >
      maximumDeposit
    ) {
      setMessage(
        "Minimum deposit cannot be greater than maximum deposit."
      );

      setMessageType("error");

      return;
    }

    try {
      setSaving(true);
      setError("");

      const response =
        await fetch(
          `${API}/api/deposit/settings`,
          {
            method: "PATCH",

            headers: adminHeaders,

            body: JSON.stringify({
              depositsEnabled:
                Boolean(
                  settings.depositsEnabled
                ),

              minimumDeposit,

              maximumDeposit,
            }),

            cache: "no-store",
          }
        );

      // -------------------------------------------------
      // SAFE JSON
      // -------------------------------------------------

      let data: any = {};

      try {
        data =
          await response.json();
      } catch {
        data = {};
      }

      console.log(
        "SAVE GENERAL DEPOSIT SETTINGS:",
        data
      );

      // -------------------------------------------------
      // AUTH
      // -------------------------------------------------

      if (
        response.status === 401
      ) {
        localStorage.removeItem(
          "token"
        );

        setToken("");

        window.location.href =
          "/login";

        return;
      }

      // -------------------------------------------------
      // ADMIN
      // -------------------------------------------------

      if (
        response.status === 403
      ) {
        throw new Error(
          data?.message ||
            "Admin access required."
        );
      }

      // -------------------------------------------------
      // HTTP ERROR
      // -------------------------------------------------

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Failed to save deposit settings. HTTP ${response.status}.`
        );
      }

      // -------------------------------------------------
      // API ERROR
      // -------------------------------------------------

      if (
        data &&
        data.success === false
      ) {
        throw new Error(
          data?.message ||
            "Failed to save deposit settings."
        );
      }

      // -------------------------------------------------
      // UPDATE LOCAL STATE
      // -------------------------------------------------

      setSettings((prev) => ({
        ...prev,

        depositsEnabled:
          Boolean(
            data?.settings
              ?.depositsEnabled ??
              prev.depositsEnabled
          ),

        minimumDeposit:
          Number(
            data?.settings
              ?.minimumDeposit ??
              minimumDeposit
          ),

        maximumDeposit:
          Number(
            data?.settings
              ?.maximumDeposit ??
              maximumDeposit
          ),

        updatedAt:
          data?.settings
            ?.updatedAt ||
          new Date().toISOString(),
      }));

      // -------------------------------------------------
      // UPDATE STATISTICS
      // -------------------------------------------------

      setStatistics((prev) => ({
        ...prev,

        depositsEnabled:
          Boolean(
            data?.settings
              ?.depositsEnabled ??
              settings.depositsEnabled
          ),

        minimumDeposit:
          Number(
            data?.settings
              ?.minimumDeposit ??
              minimumDeposit
          ),

        maximumDeposit:
          Number(
            data?.settings
              ?.maximumDeposit ??
              maximumDeposit
          ),
      }));

      setMessage(
        "Deposit settings saved successfully."
      );

      setMessageType(
        "success"
      );

      // -------------------------------------------------
      // REFRESH SERVER STATE
      // -------------------------------------------------

      await loadPaymentSettings();
    } catch (err: any) {
      console.error(
        "SAVE DEPOSIT SETTINGS ERROR:",
        err
      );

      const errorMessage =
        err?.message ||
        "Unable to save deposit settings.";

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
      setSaving(false);
    }
  };

  // =====================================================
  // SAVE EVERYTHING
  //
  // FINAL V18 FLOW
  //
  // 1. Save payment methods
  // 2. Save general deposit settings
  // 3. Reload MongoDB state
  // =====================================================

  const saveAllSettings = async () => {
    if (!token) {
      setMessage(
        "Please login again."
      );

      setMessageType(
        "error"
      );

      return;
    }

    // ---------------------------------------------------
    // VALIDATE DEPOSIT LIMITS
    // ---------------------------------------------------

    const minimumDeposit =
      Number(
        settings.minimumDeposit
      );

    const maximumDeposit =
      Number(
        settings.maximumDeposit
      );

    if (
      !Number.isFinite(
        minimumDeposit
      ) ||
      !Number.isFinite(
        maximumDeposit
      )
    ) {
      setMessage(
        "Deposit limits must contain valid numbers."
      );

      setMessageType(
        "error"
      );

      return;
    }

    if (
      minimumDeposit <= 0 ||
      maximumDeposit <= 0
    ) {
      setMessage(
        "Deposit limits must be greater than zero."
      );

      setMessageType(
        "error"
      );

      return;
    }

    if (
      minimumDeposit >
      maximumDeposit
    ) {
      setMessage(
        "Minimum deposit cannot be greater than maximum deposit."
      );

      setMessageType(
        "error"
      );

      return;
    }

    // ---------------------------------------------------
    // NORMALIZE PAYMENT METHODS
    // ---------------------------------------------------

    const methods =
      settings.methods
        .map((method) =>
          normalizeMethod(
            method
          )
        )
        .filter(
          (method) =>
            method.type.length > 0
        );

    // ---------------------------------------------------
    // VALIDATE METHODS
    // ---------------------------------------------------

    const validationError =
      validatePaymentMethods(
        methods
      );

    if (validationError) {
      setMessage(
        validationError
      );

      setMessageType(
        "error"
      );

      return;
    }

    try {
      setSaving(true);

      setError("");

      // =================================================
      // STEP 1
      // SAVE PAYMENT METHODS
      // =================================================

      const depositMethods =
        methods.map(
          (method) =>
            convertToV18Method(
              method
            )
        );

      const methodsResponse =
        await fetch(
          `${API}/api/payment-settings/admin/deposit`,
          {
            method: "PATCH",

            headers:
              adminHeaders,

            body: JSON.stringify({
              depositMethods,
            }),

            cache: "no-store",
          }
        );

      // -------------------------------------------------
      // SAFE JSON
      // -------------------------------------------------

      let methodsData: any = {};

      try {
        methodsData =
          await methodsResponse.json();
      } catch {
        methodsData = {};
      }

      console.log(
        "SAVE ALL - V18 PAYMENT METHODS:",
        methodsData
      );

      // -------------------------------------------------
      // AUTH
      // -------------------------------------------------

      if (
        methodsResponse.status ===
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

      // -------------------------------------------------
      // ADMIN
      // -------------------------------------------------

      if (
        methodsResponse.status ===
        403
      ) {
        throw new Error(
          methodsData?.message ||
            "Admin access required."
        );
      }

      // -------------------------------------------------
      // ERROR
      // -------------------------------------------------

      if (
        !methodsResponse.ok
      ) {
        throw new Error(
          methodsData?.message ||
            `Failed to save payment methods. HTTP ${methodsResponse.status}.`
        );
      }

      if (
        methodsData &&
        methodsData.success === false
      ) {
        throw new Error(
          methodsData?.message ||
            "Failed to save payment methods."
        );
      }

      // =================================================
      // STEP 2
      // SAVE GENERAL SETTINGS
      // =================================================

      const settingsResponse =
        await fetch(
          `${API}/api/deposit/settings`,
          {
            method: "PATCH",

            headers:
              adminHeaders,

            body: JSON.stringify({
              depositsEnabled:
                Boolean(
                  settings.depositsEnabled
                ),

              minimumDeposit,

              maximumDeposit,
            }),

            cache: "no-store",
          }
        );

      // -------------------------------------------------
      // SAFE JSON
      // -------------------------------------------------

      let settingsData: any = {};

      try {
        settingsData =
          await settingsResponse.json();
      } catch {
        settingsData = {};
      }

      console.log(
        "SAVE ALL - GENERAL SETTINGS:",
        settingsData
      );

      // -------------------------------------------------
      // AUTH
      // -------------------------------------------------

      if (
        settingsResponse.status ===
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

      // -------------------------------------------------
      // ADMIN
      // -------------------------------------------------

      if (
        settingsResponse.status ===
        403
      ) {
        throw new Error(
          settingsData?.message ||
            "Admin access required."
        );
      }

      // -------------------------------------------------
      // ERROR
      // -------------------------------------------------

      if (
        !settingsResponse.ok
      ) {
        throw new Error(
          settingsData?.message ||
            `Failed to save deposit settings. HTTP ${settingsResponse.status}.`
        );
      }

      if (
        settingsData &&
        settingsData.success === false
      ) {
        throw new Error(
          settingsData?.message ||
            "Failed to save deposit settings."
        );
      }

      // =================================================
      // STEP 3
      // RELOAD FROM MONGODB
      // =================================================

      await loadPaymentSettings();

      // =================================================
      // SUCCESS
      // =================================================

      setMessage(
        "All payment settings saved successfully."
      );

      setMessageType(
        "success"
      );
    } catch (err: any) {
      console.error(
        "SAVE ALL SETTINGS ERROR:",
        err
      );

      const errorMessage =
        err?.message ||
        "Unable to save payment settings.";

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
      setSaving(false);
    }
  };

  // =====================================================
  // SEARCHED METHODS
  // =====================================================

  const filteredMethods =
    useMemo(() => {
      const keyword =
        search
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
        .map(
          (method, index) => ({
            method,
            originalIndex: index,
          })
        )
        .filter(
          ({
            method,
          }) => {
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
              .map(
                (value) =>
                  String(
                    value || ""
                  )
              )
              .join(" ")
              .toLowerCase();

            return searchable.includes(
              keyword
            );
          }
        );
    }, [
      settings.methods,
      search,
    ]);

  // =====================================================
  // LAST UPDATED
  // =====================================================

  const lastUpdatedLabel =
    useMemo(() => {
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
  // LOADING STATE
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
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6 lg:p-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="max-w-7xl mx-auto">

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

            <button
              type="button"
              onClick={
                refreshPaymentSettings
              }
              disabled={
                refreshing ||
                saving
              }
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-yellow-500 transition disabled:opacity-50"
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

            <button
              type="button"
              onClick={
                saveAllSettings
              }
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition disabled:opacity-50"
            >
              <Save size={18} />

              {saving
                ? "Saving..."
                : "Save All Settings"}
            </button>

          </div>

        </div>

        {/* =================================================
            MESSAGES
        ================================================= */}

        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 flex items-center gap-3 ${
              messageType ===
              "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {messageType ===
            "success" ? (
              <CheckCircle
                size={20}
              />
            ) : (
              <XCircle
                size={20}
              />
            )}

            <span className="font-medium">
              {message}
            </span>
          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">
                  Total Methods
                </p>

                <p className="text-2xl font-black mt-1">
                  {
                    statistics.totalMethods
                  }
                </p>
              </div>

              <CreditCard
                className="text-yellow-400"
                size={28}
              />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">
                  Active
                </p>

                <p className="text-2xl font-black text-green-400 mt-1">
                  {
                    statistics.activeMethods
                  }
                </p>
              </div>

              <CheckCircle
                className="text-green-400"
                size={28}
              />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">
                  Inactive
                </p>

                <p className="text-2xl font-black text-red-400 mt-1">
                  {
                    statistics.inactiveMethods
                  }
                </p>
              </div>

              <XCircle
                className="text-red-400"
                size={28}
              />
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">
                  Deposits
                </p>

                <p
                  className={`text-2xl font-black mt-1 ${
                    statistics.depositsEnabled
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {statistics.depositsEnabled
                    ? "ON"
                    : "OFF"}
                </p>
              </div>

              <Wallet
                className="text-yellow-400"
                size={28}
              />
            </div>
          </div>

        </div>

        {/* =================================================
            SEARCH
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-4 text-white outline-none focus:border-yellow-500"
            />

          </div>

        </div>

        {/* =================================================
            PAYMENT METHODS
        ================================================= */}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">

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

                setEditingIndex(
                  null
                );

                setShowAddForm(
                  true
                );

                window.setTimeout(
                  () => {
                    window.scrollTo(
                      {
                        top: 0,
                        behavior:
                          "smooth",
                      }
                    );
                  },
                  50
                );
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-500 font-bold transition"
            >
              <Plus size={18} />

              Add Payment Method
            </button>

          </div>

          {/* =================================================
              ADD / EDIT FORM
          ================================================= */}

          {showAddForm && (
            <div className="p-5 border-b border-zinc-800 bg-black/30">

              <div className="flex items-center justify-between mb-5">

                <h3 className="text-lg font-bold">
                  {editingIndex !==
                  null
                    ? "Edit Payment Method"
                    : "Add Payment Method"}
                </h3>

                <button
                  type="button"
                  onClick={
                    cancelEdit
                  }
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </button>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* METHOD */}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Payment Method
                  </label>

                  <input
                    type="text"
                    value={
                      newMethod.type
                    }
                    onChange={(e) =>
                      updateNewMethod(
                        "type",
                        e.target.value
                      )
                    }
                    placeholder="Bank Transfer / JazzCash / EasyPaisa / Binance USDT"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
                  />
                </div>

                {/* ACCOUNT NAME */}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Account Name
                  </label>

                  <input
                    type="text"
                    value={
                      newMethod.accountName
                    }
                    onChange={(e) =>
                      updateNewMethod(
                        "accountName",
                        e.target.value
                      )
                    }
                    placeholder="Account holder name"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
                  />
                </div>

                {/* ACCOUNT / WALLET */}

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
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
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
                      newMethod.iban ||
                      ""
                    }
                    onChange={(e) =>
                      updateNewMethod(
                        "iban",
                        e.target.value
                      )
                    }
                    placeholder="Optional IBAN"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
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
                      newMethod.network ||
                      ""
                    }
                    onChange={(e) =>
                      updateNewMethod(
                        "network",
                        e.target.value
                      )
                    }
                    placeholder="TRC20 / ERC20 / BEP20"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
                  />
                </div>

                {/* QR */}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    QR Image URL
                  </label>

                  <input
                    type="text"
                    value={
                      newMethod.qrCode
                    }
                    onChange={(e) =>
                      updateNewMethod(
                        "qrCode",
                        e.target.value
                      )
                    }
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500"
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
                    newMethod.instructions
                  }
                  onChange={(e) =>
                    updateNewMethod(
                      "instructions",
                      e.target.value
                    )
                  }
                  placeholder="Optional payment instructions"
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 outline-none focus:border-yellow-500 resize-none"
                />

              </div>

              {/* ENABLED */}

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
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition"
                >
                  <CheckCircle
                    size={18}
                  />

                  {editingIndex !==
                  null
                    ? "Update Method"
                    : "Add Method"}
                </button>

                <button
                  type="button"
                  onClick={
                    cancelEdit
                  }
                  className="px-5 py-3 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>

              </div>

            </div>
          )}

          {/* =================================================
              METHODS LIST
          ================================================= */}

          <div className="divide-y divide-zinc-800">

            {filteredMethods.length ===
              0 && (
              <div className="p-10 text-center">

                <CreditCard
                  size={42}
                  className="mx-auto text-gray-600 mb-4"
                />

                <p className="text-gray-400">
                  No payment methods found.
                </p>

              </div>
            )}

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

                    {/* METHOD INFO */}

                    <div className="flex items-start gap-4">

                      <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">

                        <CreditCard
                          size={24}
                          className="text-yellow-400"
                        />

                      </div>

                      <div>

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-bold text-lg">
                            {
                              method.type
                            }
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
                          {
                            method.accountName
                          }
                        </p>

                        <p className="text-green-400 font-mono text-sm mt-2 break-all">
                          {
                            method.accountNumber
                          }
                        </p>

                        {method.iban && (
                          <p className="text-cyan-400 font-mono text-xs mt-2 break-all">
                            IBAN:{" "}
                            {
                              method.iban
                            }
                          </p>
                        )}

                        {method.network && (
                          <p className="text-yellow-400 text-xs mt-2">
                            Network:{" "}
                            {
                              method.network
                            }
                          </p>
                        )}

                      </div>

                    </div>

                    {/* ACTIONS */}

                    <div className="flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          togglePaymentMethod(
                            originalIndex
                          )
                        }
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition ${
                          method.enabled
                            ? "bg-green-500/10 text-green-400 border border-green-500/20"
                            : "bg-zinc-800 text-gray-300 border border-zinc-700"
                        }`}
                      >
                        <Power
                          size={17}
                        />

                        {method.enabled
                          ? "ON"
                          : "OFF"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          editPaymentMethod(
                            originalIndex
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition"
                      >
                        <Settings
                          size={17}
                        />

                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deletePaymentMethod(
                            originalIndex
                          )
                        }
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition"
                      >
                        <Trash2
                          size={17}
                        />

                        Delete
                      </button>

                    </div>

                  </div>

                  {/* QR */}

                  {method.qrCode && (
                    <div className="mt-5 flex items-center gap-4">

                      <img
                        src={
                          method.qrCode
                        }
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

                  {/* COPY */}

                  <div className="mt-4 flex flex-wrap gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        copyText(
                          method.accountNumber
                        )
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-gray-300 hover:text-white transition text-sm"
                    >
                      <Copy
                        size={15}
                      />

                      Copy Account
                    </button>

                    {method.iban && (
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            method.iban ||
                              ""
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-gray-300 hover:text-white transition text-sm"
                      >
                        <Copy
                          size={15}
                        />

                        Copy IBAN
                      </button>
                    )}

                  </div>

                </div>
              )
            )}

          </div>

          {/* =================================================
              SAVE BAR
          ================================================= */}

          <div className="p-5 border-t border-zinc-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <p className="font-bold">
                {settings.methods.length}{" "}
                payment method
                {settings.methods.length ===
                1
                  ? ""
                  : "s"}
              </p>

              <p className="text-sm text-gray-500">
                Changes are local until saved.
              </p>

            </div>

            <div className="flex flex-wrap gap-3">

              <button
                type="button"
                onClick={
                  savePaymentMethods
                }
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-green-600 hover:bg-green-500 font-bold transition disabled:opacity-50"
              >
                <Save size={18} />

                {saving
                  ? "Saving..."
                  : "Save Payment Methods"}
              </button>

              <button
                type="button"
                onClick={
                  saveDepositSettings
                }
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold transition disabled:opacity-50"
              >
                <DollarSign
                  size={18}
                />

                Save Deposit Limits
              </button>

            </div>

          </div>

        </div>

        {/* =================================================
            DEPOSIT CONTROL
        ================================================= */}

        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div className="flex items-center gap-4">

              <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <Wallet
                  size={25}
                  className="text-yellow-400"
                />
              </div>

              <div>

                <h2 className="font-bold text-lg">
                  Deposit System
                </h2>

                <p className="text-sm text-gray-500">
                  Enable or disable deposits globally.
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={
                toggleDeposits
              }
              className={`relative w-16 h-8 rounded-full transition ${
                settings.depositsEnabled
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full transition ${
                  settings.depositsEnabled
                    ? "left-9"
                    : "left-1"
                }`}
              />
            </button>

          </div>

        </div>

        {/* =================================================
            DEPOSIT LIMITS
        ================================================= */}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">

            <label className="block text-sm text-gray-400 mb-2">
              Minimum Deposit
            </label>

            <div className="relative">

              <DollarSign
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="number"
                min="0"
                value={
                  settings.minimumDeposit
                }
                onChange={(e) =>
                  updateDepositLimit(
                    "minimumDeposit",
                    e.target.value
                  )
                }
                className="w-full bg-black border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:border-yellow-500"
              />

            </div>

          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">

            <label className="block text-sm text-gray-400 mb-2">
              Maximum Deposit
            </label>

            <div className="relative">

              <Coins
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
              />

              <input
                type="number"
                min="0"
                value={
                  settings.maximumDeposit
                }
                onChange={(e) =>
                  updateDepositLimit(
                    "maximumDeposit",
                    e.target.value
                  )
                }
                className="w-full bg-black border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-white outline-none focus:border-yellow-500"
              />

            </div>

          </div>

        </div>

        {/* =================================================
            SECURITY
        ================================================= */}

        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-5">

          <div className="flex items-start gap-4">

            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <Shield
                size={24}
                className="text-green-400"
              />
            </div>

            <div>

              <h3 className="font-bold">
                V18 Payment Settings
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Payment methods are stored through the
                V18 payment-settings API and loaded
                directly from MongoDB.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}