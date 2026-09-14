// GOLDTRADE V17 ENTERPRISE API SERVICE
// Frontend -> Backend Connection


const API =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

// Generic API Request
export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const response = await fetch(`${API}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "GoldTrade API Error");
  }

  return data;
}

// Login API
export const loginUser = (email: string, password: string) =>
  apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

// Signup API
export const signupUser = (payload: any) =>
  apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Dashboard APIs
export const getUser = (username: string) =>
  apiFetch(`/api/users/${username}`);

export const getMarket = () =>
  apiFetch("/api/settings/market");

export const getGoldHistory = (username: string) =>
  apiFetch(`/api/gold/history/${username}`);

export const getTransactions = (username: string) =>
  apiFetch(`/api/transactions/${username}`);

export default API;