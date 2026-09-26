// ==========================================================
// GoldTrade V18 Enterprise
// frontend/lib/api.ts
// Single Production API Config
// ==========================================================

// Production Render Backend
export const API =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://goldtrade-2.onrender.com";

// API Helper
export const api = (path: string) => `${API}${path}`;

// Default Headers
export const jsonHeaders = {
  "Content-Type": "application/json",
};

// JWT Headers
export const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});