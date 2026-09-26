// =====================================================
// GoldTrade V18 Authentication Helper
// =====================================================

export interface GoldTradeUser {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
}

export const getToken = () => {
  if (typeof window === "undefined") return null;

  return (
    localStorage.getItem("goldtrade_token") ||
    sessionStorage.getItem("goldtrade_token")
  );
};

export const getUser = (): GoldTradeUser | null => {
  if (typeof window === "undefined") return null;

  const data =
    localStorage.getItem("goldtrade_user") ||
    sessionStorage.getItem("goldtrade_user");

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const saveSession = (
  token: string,
  user: GoldTradeUser,
  remember = true
) => {
  localStorage.clear();
  sessionStorage.clear();

  const storage = remember ? localStorage : sessionStorage;

  storage.setItem("goldtrade_token", token);
  storage.setItem("goldtrade_user", JSON.stringify(user));
  storage.setItem("goldtrade_role", user.role);
};

export const logout = () => {
  localStorage.clear();
  sessionStorage.clear();
};