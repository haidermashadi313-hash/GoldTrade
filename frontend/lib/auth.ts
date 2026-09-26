// ==========================================================
// GoldTrade V18 Enterprise
// frontend/lib/auth.ts
// Production Version (Render + Vercel + JWT Safe)
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

  const storage = remember ? localStorage : sessionStorage;

  // Clear old session first
  clearSession();

  storage.setItem("goldtrade_token", token);
  storage.setItem("goldtrade_user", JSON.stringify(user));
  storage.setItem("goldtrade_username", user.username);
  storage.setItem("goldtrade_email", user.email);
  storage.setItem("goldtrade_role", user.role);
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
    const user: GoldTradeUser = JSON.parse(userString);

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
// IS LOGGED IN
// ==========================================================

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

// ==========================================================
// GET TOKEN
// ==========================================================

export function getToken(): string | null {
  return getSession()?.token || null;
}

// ==========================================================
// GET USER
// ==========================================================

export function getUser(): GoldTradeUser | null {
  return getSession()?.user || null;
}

// ==========================================================
// CLEAR SESSION (LOGOUT FIX)
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
// LOGOUT (PRODUCTION FIX)
// ==========================================================

export function logout(): void {
  clearSession();

  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
}