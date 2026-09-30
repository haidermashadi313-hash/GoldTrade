// ============================================================
// GOLDTRADE V18
// DEPOSIT API FOUNDATION
// frontend/lib/deposit-api.ts
// ============================================================

/**
 * Central Deposit API helper.
 *
 * IMPORTANT:
 * All Deposit pages should use this file instead of
 * repeating fetch/auth/API logic.
 */

// ============================================================
// API URL
// ============================================================

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com";

export const API = RAW_API_URL.replace(/\/+$/, "");

// ============================================================
// TYPES
// ============================================================

export type WalletType = "PKR" | "USDT";

export type DepositStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type PaymentMethodType =
  | "BANK"
  | "JAZZCASH"
  | "EASYPAISA"
  | "BINANCE"
  | string;

// ============================================================
// PAYMENT METHOD
// ============================================================

export interface DepositPaymentMethod {
  _id?: string;

  method: PaymentMethodType;

  title?: string;

  accountTitle?: string;

  accountName?: string;

  accountNumber?: string;

  iban?: string;

  bankName?: string;

  network?: string;

  qrImage?: string;

  qrCode?: string;

  instructions?: string;

  enabled: boolean;
}

// ============================================================
// DEPOSIT SETTINGS
// ============================================================

export interface DepositSettings {
  depositsEnabled: boolean;

  minimumDeposit: number;

  maximumDeposit: number;

  receiptRequired: boolean;

  paymentMethods: DepositPaymentMethod[];

  // Compatibility aliases
  methods?: DepositPaymentMethod[];

  updatedAt?: string;
}

// ============================================================
// WALLET
// ============================================================

export interface DepositWallet {
  pkrBalance: number;

  usdtBalance: number;

  goldBalance: number;

  lockedPkr?: number;

  lockedUsdt?: number;

  availablePkr?: number;

  availableUsdt?: number;
}

// ============================================================
// DEPOSIT RECORD
// ============================================================

export interface DepositRecord {
  id: string;

  _id: string;

  userId?: string;

  username?: string;

  walletType: WalletType;

  amount: number;

  currency?: string;

  network?: string;

  paymentMethod: string;

  senderName?: string;

  senderAccount?: string;

  receiverAccount?: string;

  transactionId?: string;

  referenceId?: string;

  receiptUploaded?: boolean;

  receiptImage?: string;

  screenshot?: string;

  status: DepositStatus;

  note?: string;

  rejectReason?: string;

  walletBefore?: DepositWallet | null;

  walletAfter?: DepositWallet | null;

  approvedBy?: string;

  approvedByUsername?: string;

  approvedAt?: string;

  rejectedBy?: string;

  rejectedByUsername?: string;

  rejectedAt?: string;

  createdAt: string;

  updatedAt?: string;
}

// ============================================================
// PAGINATION
// ============================================================

export interface DepositPagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

// ============================================================
// API RESPONSE
// ============================================================

export interface DepositApiResponse<T = unknown> {
  success: boolean;

  message?: string;

  data?: T;

  settings?: DepositSettings;

  methods?: DepositPaymentMethod[];

  history?: DepositRecord[];

  deposits?: DepositRecord[];

  deposit?: DepositRecord;

  wallet?: DepositWallet;

  pagination?: DepositPagination;

  error?: string;
}

// ============================================================
// CREATE DEPOSIT INPUT
// ============================================================

export interface CreateDepositInput {
  walletType: WalletType;

  amount: number;

  paymentMethod: string;

  transactionId?: string;

  referenceId?: string;

  senderName?: string;

  senderAccount?: string;

  receiverAccount?: string;

  network?: string;

  note?: string;

  screenshot?: File | null;
}

// ============================================================
// REJECT DEPOSIT INPUT
// ============================================================

export interface RejectDepositInput {
  rejectReason?: string;

  note?: string;
}

// ============================================================
// BULK ACTION INPUT
// ============================================================

export interface BulkDepositInput {
  depositIds: string[];
}

// ============================================================
// AUTH
// ============================================================

export function getAuthToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    ""
  );
}

// ============================================================
// AUTH HEADERS
// ============================================================

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

// ============================================================
// JSON HEADERS
// ============================================================

export function getJsonHeaders(): HeadersInit {
  return {
    ...getAuthHeaders(),

    Accept: "application/json",

    "Content-Type": "application/json",
  };
}

// ============================================================
// SAFE JSON PARSER
// ============================================================

export async function parseApiResponse<T = any>(
  response: Response
): Promise<DepositApiResponse<T>> {
  const contentType =
    response.headers.get("content-type") || "";

  if (
    contentType.includes("application/json")
  ) {
    try {
      return (await response.json()) as DepositApiResponse<T>;
    } catch {
      return {
        success: false,

        message:
          "Server returned invalid JSON response.",
      };
    }
  }

  const text = await response.text();

  return {
    success: false,

    message:
      text ||
      `Server returned HTTP ${response.status}.`,
  };
}

// ============================================================
// AUTH ERROR
// ============================================================

export function isUnauthorized(
  response: Response
): boolean {
  return response.status === 401;
}

// ============================================================
// REDIRECT LOGIN
// ============================================================

export function redirectToLogin(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("token");

  localStorage.removeItem("accessToken");

  localStorage.removeItem("jwt");

  window.location.replace("/login");
}

// ============================================================
// GENERIC API ERROR
// ============================================================

export function getApiErrorMessage(
  data: DepositApiResponse,
  fallback = "Something went wrong."
): string {
  return (
    data?.message ||
    data?.error ||
    fallback
  );
}

// ============================================================
// NORMALIZE STATUS
// ============================================================

export function normalizeDepositStatus(
  status: unknown
): DepositStatus {
  const value = String(status || "")
    .trim()
    .toUpperCase();

  switch (value) {
    case "APPROVED":
    case "COMPLETED":
      return "APPROVED";

    case "REJECTED":
    case "DECLINED":
      return "REJECTED";

    case "CANCELLED":
    case "CANCELED":
      return "CANCELLED";

    case "PENDING":
    default:
      return "PENDING";
  }
}

// ============================================================
// NORMALIZE WALLET TYPE
// ============================================================

export function normalizeWalletType(
  value: unknown
): WalletType {
  return String(value || "")
    .trim()
    .toUpperCase() === "USDT"
    ? "USDT"
    : "PKR";
}

// ============================================================
// NORMALIZE NUMBER
// ============================================================

export function toSafeNumber(
  value: unknown,
  fallback = 0
): number {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

// ============================================================
// NORMALIZE PAYMENT METHOD
// ============================================================

export function normalizePaymentMethod(
  value: any
): DepositPaymentMethod {
  return {
    _id: value?._id,

    method: String(
      value?.method ||
        value?.type ||
        ""
    ).trim(),

    title: String(
      value?.title ||
        value?.name ||
        value?.method ||
        value?.type ||
        ""
    ).trim(),

    accountTitle: String(
      value?.accountTitle ||
        value?.accountName ||
        ""
    ).trim(),

    accountName: String(
      value?.accountName ||
        value?.accountTitle ||
        ""
    ).trim(),

    accountNumber: String(
      value?.accountNumber ||
        ""
    ).trim(),

    iban: String(
      value?.iban || ""
    ).trim(),

    bankName: String(
      value?.bankName || ""
    ).trim(),

    network: String(
      value?.network || ""
    ).trim(),

    qrImage:
      value?.qrImage ||
      "",

    qrCode:
      value?.qrCode ||
      "",

    instructions: String(
      value?.instructions || ""
    ).trim(),

    enabled:
      value?.enabled !== false,
  };
}

// ============================================================
// NORMALIZE DEPOSIT
// ============================================================

export function normalizeDeposit(
  value: any
): DepositRecord {
  return {
    id: String(
      value?.id ||
        value?._id ||
        ""
    ),

    _id: String(
      value?._id ||
        value?.id ||
        ""
    ),

    userId:
      value?.userId
        ? String(value.userId)
        : undefined,

    username:
      value?.username || undefined,

    walletType:
      normalizeWalletType(
        value?.walletType
      ),

    amount:
      toSafeNumber(
        value?.amount
      ),

    currency:
      value?.currency ||
      undefined,

    network:
      value?.network ||
      "",

    paymentMethod:
      String(
        value?.paymentMethod ||
          value?.method ||
          ""
      ),

    senderName:
      value?.senderName ||
      "",

    senderAccount:
      value?.senderAccount ||
      "",

    receiverAccount:
      value?.receiverAccount ||
      "",

    transactionId:
      value?.transactionId ||
      "",

    referenceId:
      value?.referenceId ||
      "",

    receiptUploaded:
      value?.receiptUploaded === true,

    receiptImage:
      value?.receiptImage ||
      "",

    screenshot:
      value?.screenshot ||
      value?.receiptImage ||
      "",

    status:
      normalizeDepositStatus(
        value?.status
      ),

    note:
      value?.note ||
      "",

    rejectReason:
      value?.rejectReason ||
      "",

    walletBefore:
      value?.walletBefore ||
      null,

    walletAfter:
      value?.walletAfter ||
      null,

    approvedBy:
      value?.approvedBy ||
      undefined,

    approvedByUsername:
      value?.approvedByUsername ||
      undefined,

    approvedAt:
      value?.approvedAt ||
      undefined,

    rejectedBy:
      value?.rejectedBy ||
      undefined,

    rejectedByUsername:
      value?.rejectedByUsername ||
      undefined,

    rejectedAt:
      value?.rejectedAt ||
      undefined,

    createdAt:
      value?.createdAt ||
      new Date().toISOString(),

    updatedAt:
      value?.updatedAt ||
      undefined,
  };
}

// ============================================================
// NORMALIZE SETTINGS
// ============================================================

export function normalizeDepositSettings(
  value: any
): DepositSettings {
  const rawMethods =
    Array.isArray(value?.paymentMethods)
      ? value.paymentMethods
      : Array.isArray(value?.methods)
      ? value.methods
      : Array.isArray(value?.depositPaymentMethods)
      ? value.depositPaymentMethods
      : [];

  const paymentMethods =
    rawMethods
      .map(normalizePaymentMethod)
      .filter(
        (method: { enabled: any; method: string | any[]; }) =>
          method.enabled &&
          method.method.length > 0
      );

  return {
    depositsEnabled:
      value?.depositsEnabled !== false,

    minimumDeposit:
      toSafeNumber(
        value?.minimumDeposit,
        0
      ),

    maximumDeposit:
      toSafeNumber(
        value?.maximumDeposit,
        0
      ),

    receiptRequired:
      value?.receiptRequired !== false,

    paymentMethods,

    methods: paymentMethods,

    updatedAt:
      value?.updatedAt ||
      undefined,
  };
}

// ============================================================
// GET DEPOSIT SETTINGS
// ============================================================

export async function getDepositSettings(): Promise<{
  response: Response;

  data: DepositApiResponse;

}> {
  const response = await fetch(
    `${API}/api/deposit/settings`,
    {
      method: "GET",

      headers: {
        ...getAuthHeaders(),

        Accept:
          "application/json",
      },

      cache: "no-store",
    }
  );

  const data =
    await parseApiResponse(response);

  return {
    response,
    data,
  };
}

// ============================================================
// GET USER DEPOSIT HISTORY
// ============================================================

export async function getDepositHistory(
  page = 1,
  limit = 20
): Promise<{
  response: Response;

  data: DepositApiResponse;
}> {
  const safePage =
    Math.max(
      Number(page) || 1,
      1
    );

  const safeLimit =
    Math.min(
      Math.max(
        Number(limit) || 20,
        1
      ),
      100
    );

  const response = await fetch(
    `${API}/api/deposit/history?page=${safePage}&limit=${safeLimit}`,
    {
      method: "GET",

      headers: {
        ...getAuthHeaders(),

        Accept:
          "application/json",
      },

      cache: "no-store",
    }
  );

  const data =
    await parseApiResponse(response);

  return {
    response,
    data,
  };
}

// ============================================================
// CREATE DEPOSIT
// ============================================================

export async function createDeposit(
  input: CreateDepositInput
): Promise<{
  response: Response;

  data: DepositApiResponse;
}> {
  const formData =
    new FormData();

  formData.append(
    "walletType",
    input.walletType
  );

  formData.append(
    "amount",
    String(input.amount)
  );

  formData.append(
    "paymentMethod",
    input.paymentMethod
  );

  if (input.transactionId) {
    formData.append(
      "transactionId",
      input.transactionId
    );
  }

  if (input.referenceId) {
    formData.append(
      "referenceId",
      input.referenceId
    );
  }

  if (input.senderName) {
    formData.append(
      "senderName",
      input.senderName
    );
  }

  if (input.senderAccount) {
    formData.append(
      "senderAccount",
      input.senderAccount
    );
  }

  if (input.receiverAccount) {
    formData.append(
      "receiverAccount",
      input.receiverAccount
    );
  }

  if (input.network) {
    formData.append(
      "network",
      input.network
    );
  }

  if (input.note) {
    formData.append(
      "note",
      input.note
    );
  }

  // IMPORTANT:
  // Backend upload.single("screenshot")
  // expects exactly this field name.
  if (input.screenshot) {
    formData.append(
      "screenshot",
      input.screenshot
    );
  }

  const response = await fetch(
    `${API}/api/deposit/create`,
    {
      method: "POST",

      headers:
        getAuthHeaders(),

      body: formData,

      cache: "no-store",
    }
  );

  const data =
    await parseApiResponse(response);

  return {
    response,
    data,
  };
}

// ============================================================
// ADMIN — GET ALL DEPOSITS
// ============================================================

export async function getAdminDeposits(
  params: {
    page?: number;

    limit?: number;

    status?: DepositStatus | "ALL";

    search?: string;
  } = {}
): Promise<{
  response: Response;

  data: DepositApiResponse;
}> {
  const page =
    Math.max(
      Number(params.page) || 1,
      1
    );

  const limit =
    Math.min(
      Math.max(
        Number(params.limit) || 20,
        1
      ),
      100
    );

  const query =
    new URLSearchParams();

  query.set(
    "page",
    String(page)
  );

  query.set(
    "limit",
    String(limit)
  );

  if (
    params.status &&
    params.status !== "ALL"
  ) {
    query.set(
      "status",
      params.status
    );
  }

  if (
    params.search?.trim()
  ) {
    query.set(
      "search",
      params.search.trim()
    );
  }

  const response = await fetch(
    `${API}/api/deposit/admin/all?${query.toString()}`,
    {
      method: "GET",

      headers: {
        ...getAuthHeaders(),

        Accept:
          "application/json",
      },

      cache: "no-store",
    }
  );

  const data =
    await parseApiResponse(response);

  return {
    response,
    data,
  };
}

// ============================================================
// ADMIN — GET PENDING DEPOSITS
// ============================================================

export async function getPendingDeposits(
  params: {
    page?: number;

    limit?: number;
  } = {}
): Promise<{
  response: Response;

  data: DepositApiResponse;
}> {
  const page =
    Math.max(
      Number(params.page) || 1,
      1
    );

  const limit =
    Math.min(
      Math.max(
        Number(params.limit) || 20,
        1
      ),
      100
    );

  const response = await fetch(
    `${API}/api/deposit/admin/pending?page=${page}&limit=${limit}`,
    {
      method: "GET",

      headers: {
        ...getAuthHeaders(),

        Accept:
          "application/json",
      },

      cache: "no-store",
    }
  );

  const data =
    await parseApiResponse(response);

  return {
    response,
    data,
  };
}

// ============================================================
// ADMIN — APPROVE
// ============================================================

export async function approveDeposit(
  depositId: string
): Promise<{
  response: Response;

  data: DepositApiResponse;
}> {
  const id =
    String(depositId || "")
      .trim();

  if (!id) {
    throw new Error(
      "Deposit ID is required."
    );
  }

  const response = await fetch(
    `${API}/api/deposit/${encodeURIComponent(id)}/approve`,
    {
      method: "PATCH",

      headers:
        getJsonHeaders(),

      body: JSON.stringify({}),

      cache: "no-store",
    }
  );

  const data =
    await parseApiResponse(response);

  return {
    response,
    data,
  };
}

// ============================================================
// ADMIN — REJECT
// ============================================================

export async function rejectDeposit(
  depositId: string,
  input: RejectDepositInput = {}
): Promise<{
  response: Response;

  data: DepositApiResponse;
}> {
  const id =
    String(depositId || "")
      .trim();

  if (!id) {
    throw new Error(
      "Deposit ID is required."
    );
  }

  const response = await fetch(
    `${API}/api/deposit/${encodeURIComponent(id)}/reject`,
    {
      method: "PATCH",

      headers:
        getJsonHeaders(),

      body: JSON.stringify({
        rejectReason:
          input.rejectReason ||
          "Deposit rejected by admin.",

        ...(input.note !== undefined
          ? {
              note: input.note,
            }
          : {}),
      }),

      cache: "no-store",
    }
  );

  const data =
    await parseApiResponse(response);

  return {
    response,
    data,
  };
}

// ============================================================
// ADMIN — BULK APPROVE
// ============================================================

export async function bulkApproveDeposits(
  depositIds: string[]
): Promise<{
  response: Response;

  data: DepositApiResponse;
}> {
  const ids =
    depositIds
      .map((id) =>
        String(id || "").trim()
      )
      .filter(Boolean);

  if (!ids.length) {
    throw new Error(
      "Select at least one deposit."
    );
  }

  const response = await fetch(
    `${API}/api/deposit/admin/bulk-approve`,
    {
      method: "PATCH",

      headers:
        getJsonHeaders(),

      body: JSON.stringify({
        depositIds: ids,
      }),

      cache: "no-store",
    }
  );

  const data =
    await parseApiResponse(response);

  return {
    response,
    data,
  };
}

// ============================================================
// ADMIN — BULK REJECT
// ============================================================

export async function bulkRejectDeposits(
  depositIds: string[],
  rejectReason = "Deposit rejected by admin."
): Promise<{
  response: Response;

  data: DepositApiResponse;
}> {
  const ids =
    depositIds
      .map((id) =>
        String(id || "").trim()
      )
      .filter(Boolean);

  if (!ids.length) {
    throw new Error(
      "Select at least one deposit."
    );
  }

  const response = await fetch(
    `${API}/api/deposit/admin/bulk-reject`,
    {
      method: "PATCH",

      headers:
        getJsonHeaders(),

      body: JSON.stringify({
        depositIds: ids,

        rejectReason,
      }),

      cache: "no-store",
    }
  );

  const data =
    await parseApiResponse(response);

  return {
    response,
    data,
  };
}

// ============================================================
// EXPORT DEFAULT API
// ============================================================

export default {
  API,

  getAuthToken,

  getAuthHeaders,

  getJsonHeaders,

  getDepositSettings,

  getDepositHistory,

  createDeposit,

  getAdminDeposits,

  getPendingDeposits,

  approveDeposit,

  rejectDeposit,

  bulkApproveDeposits,

  bulkRejectDeposits,
};