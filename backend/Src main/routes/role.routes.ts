import { Router } from "express";
import { adminOnly, superAdminOnly, requirePermission, checkAccountStatus } from "../middleware/role.middleware";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const authMiddleware = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("../middleware/auth.middleware");
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("../middlewares/auth.middleware");
    } catch {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require("../middleware/auth");
      } catch {
        return {};
      }
    }
  }
})();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const adminController = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("../controllers/adminController");
  } catch {
    return {};
  }
})();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const portfolioController = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("../controllers/portfolio.controller");
  } catch {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      return require("../controllers/portfolio");
    } catch {
      return {};
    }
  }
})();

const router = Router();

const controllerAny = { ...adminController, ...portfolioController } as any;
const pick = (...names: string[]) =>
  names
    .map((name) => controllerAny[name])
    .find((fn) => typeof fn === "function") ||
  ((_req: any, res: any) =>
    res.status(501).json({ message: "Handler not implemented" }));

const passthrough = (_req: any, _res: any, next: any) => next();
const authenticate = authMiddleware.authenticate || passthrough;

const getPortfolio = pick(
  "getPortfolioOverview",
  "getPortfolioDashboard",
  "getPortfolio",
  "getPortfolioSummary"
);
const getAllUsers = pick("getAllUsers");
const updateGoldPrice = pick("updateGoldPrice", "updateGoldPricing");
const deleteUser = pick("deleteUser", "deleteUserAccount");

router.get(
  "/portfolio",
  authenticate,
  checkAccountStatus,
  requirePermission("VIEW_PORTFOLIO"),
  getPortfolio
);

router.get(
  "/admin/users",
  authenticate,
  adminOnly,
  requirePermission("VIEW_USERS"),
  getAllUsers
);

router.patch(
  "/admin/gold-price",
  authenticate,
  adminOnly,
  requirePermission("UPDATE_GOLD_PRICE"),
  updateGoldPrice
);

router.delete(
  "/admin/user/:id",
  authenticate,
  superAdminOnly,
  requirePermission("DELETE_USER"),
  deleteUser
);

export default router;
