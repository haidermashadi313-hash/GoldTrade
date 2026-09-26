// ==========================================================
// GoldTrade V18 Enterprise
// frontend/lib/auth.ts
// FINAL Production Version
// Render + Vercel + Linux + JWT Safe
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

  // Remove old session first
  clearSession();

  const storage = remember ? localStorage : sessionStorage;

  const normalizedUser: GoldTradeUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role:
      String(user.role).trim().toLowerCase() === "admin"
        ? "admin"
        : "user",
  };

  storage.setItem("goldtrade_token", token);
  storage.setItem("goldtrade_user", JSON.stringify(normalizedUser));
  storage.setItem("goldtrade_username", normalizedUser.username);
  storage.setItem("goldtrade_email", normalizedUser.email);
  storage.setItem("goldtrade_role", normalizedUser.role);
}

// ==========================================================
// GET SESSION
// ==========================================================

export function getSession(): GoldTradeSession | null {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("goldtrade_token") ||
    sessionStorage.getItem("goldtrade_token");

  const userString =
    localStorage.getItem("goldtrade_user") ||
    sessionStorage.getItem("goldtrade_user");

  if (!token || !userString) {
    clearSession();
    return null;
  }

  try {
    const parsedUser = JSON.parse(userString);

    const user: GoldTradeUser = {
      id: parsedUser.id || "",
      username: parsedUser.username || "",
      email: parsedUser.email || "",
      role:
        String(parsedUser.role || "").trim().toLowerCase() === "admin"
          ? "admin"
          : "user",
    };

    if (!user.username || !user.role) {
      clearSession();
      return null;
    }

    return {
      token,
      user,
    };
  } catch (error) {
    console.error("Session Parse Error:", error);
    clearSession();
    return null;
  }
}

// ==========================================================
// HELPERS
// ==========================================================

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

export function getToken(): string | null {
  return getSession()?.token || null;
}

export function getUser(): GoldTradeUser | null {
  return getSession()?.user || null;
}

export function isAdmin(): boolean {
  return getSession()?.user.role === "admin";
}

// ==========================================================
// CLEAR SESSION
// ==========================================================

export function clearSession(): void {
  if (typeof window === "undefined") return;

  const keys = [
    "goldtrade_token",
    "goldtrade_user",
    "goldtrade_role",
    "goldtrade_username",
    "goldtrade_email",
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