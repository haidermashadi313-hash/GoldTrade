// ==========================================================
// GoldTrade V18 Enterprise
// frontend/lib/auth.ts
// IQ1000 FINAL - Session + JWT + Vercel + Render
// ==========================================================

export interface GoldTradeUser {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
}

export interface GoldTradeSession {
  token: string;
  user: GoldTradeUser;
}

// ==========================================================
// SAVE SESSION
// ==========================================================

export function saveSession(
  user: GoldTradeUser,
  token: string,
  remember: boolean = true
): void {
  if (typeof window === "undefined") return;

  clearSession();

  const storage = remember ? localStorage : sessionStorage;

  const normalizedUser: GoldTradeUser = {
    id: user.id || "",
    username: user.username || "",
    email: user.email || "",
    role:
      String(user.role).trim().toLowerCase() === "admin"
        ? "admin"
        : "user",
  };

  // Primary keys
  storage.setItem("goldtrade_token", token);
  storage.setItem("goldtrade_user", JSON.stringify(normalizedUser));

  // Compatibility keys (old pages)
  storage.setItem("token", token);
  storage.setItem("username", normalizedUser.username);
  storage.setItem("email", normalizedUser.email);
  storage.setItem("role", normalizedUser.role);

  storage.setItem("goldtrade_username", normalizedUser.username);
  storage.setItem("goldtrade_email", normalizedUser.email);
  storage.setItem("goldtrade_role", normalizedUser.role);
}

// ==========================================================
// GET SESSION
// ==========================================================

export function getSession(): GoldTradeSession | null {
  if (typeof window === "undefined") return null;

  try {
    const token =
      localStorage.getItem("goldtrade_token") ||
      sessionStorage.getItem("goldtrade_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    const userString =
      localStorage.getItem("goldtrade_user") ||
      sessionStorage.getItem("goldtrade_user");

    // Old compatibility
    const username =
      localStorage.getItem("username") ||
      sessionStorage.getItem("username");

    const email =
      localStorage.getItem("email") ||
      sessionStorage.getItem("email");

    const role =
      localStorage.getItem("role") ||
      sessionStorage.getItem("role");

    if (!token) return null;

    // New session format
    if (userString) {
      const parsedUser = JSON.parse(userString);

      return {
        token,
        user: {
          id: parsedUser.id || "",
          username: parsedUser.username || "",
          email: parsedUser.email || "",
          role:
            String(parsedUser.role).trim().toLowerCase() === "admin"
              ? "admin"
              : "user",
        },
      };
    }

    // Old session format
    if (username) {
      return {
        token,
        user: {
          id: "",
          username,
          email: email || "",
          role:
            String(role).trim().toLowerCase() === "admin"
              ? "admin"
              : "user",
        },
      };
    }

    return null;
  } catch (error) {
    console.error("Session Parse Error:", error);
    clearSession();
    return null;
  }
}

// ==========================================================
// HELPERS
// ==========================================================

export const isLoggedIn = (): boolean => getSession() !== null;

export const getToken = (): string | null =>
  getSession()?.token || null;

export const getUser = (): GoldTradeUser | null =>
  getSession()?.user || null;

export const isAdmin = (): boolean =>
  getSession()?.user.role === "admin";

// ==========================================================
// CLEAR SESSION
// ==========================================================

export function clearSession(): void {
  if (typeof window === "undefined") return;

  const keys = [
    // New keys
    "goldtrade_token",
    "goldtrade_user",
    "goldtrade_role",
    "goldtrade_username",
    "goldtrade_email",

    // Old keys
    "token",
    "username",
    "email",
    "role",
  ];

  keys.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}

// ==========================================================
// LOGOUT
// ==========================================================

export function logout(): void {
  clearSession();

  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
}