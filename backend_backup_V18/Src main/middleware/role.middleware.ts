// ======================================================
// GOLDTRADE V17 ENTERPRISE
// SECTION 4/10
// ROLE BASED AUTHORIZATION MIDDLEWARE
// ======================================================

import { Request, Response, NextFunction } from "express";
import User from "../models/User";

// ------------------------------------------------------
// USER ACCOUNT STATUS CHECK
// ------------------------------------------------------

export const checkAccountStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.accountStatus === "SUSPENDED") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended.",
      });
    }

    if (user.accountStatus === "BLOCKED") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked.",
      });
    }

    if (String(user.accountStatus) === "INACTIVE") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ------------------------------------------------------
// ALLOW SPECIFIC ROLES
// ------------------------------------------------------

export const authorizeRoles =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied.",
      });
    }

    next();
  };

// ------------------------------------------------------
// ADMIN ONLY
// ------------------------------------------------------

export const adminOnly = authorizeRoles(
  "ADMIN",
  "SUPER_ADMIN"
);

// ------------------------------------------------------
// SUPER ADMIN ONLY
// ------------------------------------------------------

export const superAdminOnly = authorizeRoles(
  "SUPER_ADMIN"
);

// ------------------------------------------------------
// USER OR ADMIN
// ------------------------------------------------------

export const userOrAdmin = authorizeRoles(
  "USER",
  "ADMIN",
  "SUPER_ADMIN"
);

// ======================================================
// PERMISSION MATRIX
// ======================================================

export const Permissions = {
  USER: [
    "BUY_GOLD",
    "SELL_GOLD",
    "VIEW_PORTFOLIO",
    "CREATE_WALLET",
    "WITHDRAW",
    "DEPOSIT",
  ],

  ADMIN: [
    "VIEW_USERS",
    "APPROVE_KYC",
    "MANAGE_TRADES",
    "VIEW_TRANSACTIONS",
    "FREEZE_ACCOUNT",
    "UPDATE_GOLD_PRICE",
  ],

  SUPER_ADMIN: [
    "ALL_ACCESS",
    "MANAGE_ADMINS",
    "SYSTEM_SETTINGS",
    "DELETE_USER",
    "EXPORT_REPORTS",
    "VIEW_AUDIT_LOGS",
  ],
};

// ======================================================
// CHECK PERMISSION
// ======================================================

export const hasPermission = (
  role: string,
  permission: string
) => {
  if (role === "SUPER_ADMIN") return true;

  const rolePermissions =
    Permissions[role as keyof typeof Permissions] || [];

  return rolePermissions.includes(permission);
};

// Middleware

export const requirePermission =
  (permission: string) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission for this action.",
      });
    }

    next();
  };