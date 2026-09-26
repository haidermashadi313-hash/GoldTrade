export interface GoldTradeUser {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
}

export function getSession() {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("goldtrade_token") ||
    sessionStorage.getItem("goldtrade_token");

  const userString =
    localStorage.getItem("goldtrade_user") ||
    sessionStorage.getItem("goldtrade_user");

  if (!token || !userString) return null;

  try {
    const user: GoldTradeUser = JSON.parse(userString);

    return {
      token,
      user,
    };
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem("goldtrade_token");
  localStorage.removeItem("goldtrade_user");
  localStorage.removeItem("goldtrade_role");
  localStorage.removeItem("goldtrade_username");
  localStorage.removeItem("goldtrade_email");

  sessionStorage.removeItem("goldtrade_token");
  sessionStorage.removeItem("goldtrade_user");
  sessionStorage.removeItem("goldtrade_role");
  sessionStorage.removeItem("goldtrade_username");
  sessionStorage.removeItem("goldtrade_email");
}