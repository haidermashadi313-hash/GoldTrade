export const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const apiUrl = (path: string) => `${API}${path}`;

export const getHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});