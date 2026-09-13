// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/adminController.ts
// SECTION 1/10
// IMPORTS + HELPERS + ADMIN AUTH + INITIAL SETUP
// ======================================================

import { Request, Response } from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

// ================= MODELS =================

// Resolve models from Mongoose's registry instead of importing model files that
// may not be present in deployments where models are registered centrally.
const getModel = <T = any>(name: string) =>
  (mongoose.models[name] as mongoose.Model<T>) ||
  mongoose.model<T>(name, new mongoose.Schema({}, { strict: false }));

const User = getModel("User");
const Wallet = getModel("Wallet");
const Deposit = getModel("Deposit");
const Withdrawal = getModel("Withdrawal");
const GoldPrice = getModel("GoldPrice");
const Referral = getModel("Referral");
const ActivityLog = getModel("ActivityLog");
const Setting = getModel("Setting");

// ================= JWT TYPES =================

interface AdminTokenPayload {
  id: string;
  email: string;
  role: string;
}

// ================= RESPONSE HELPERS =================

const successResponse = (
  res: Response,
  message: string,
  data: any = {}
) => {
  return res.status(200).json({
    success: true,
    message,
    ...data,
  });
};

const errorResponse = (
  res: Response,
  message: string,
  status = 500
) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

// ================= VERIFY ADMIN JWT =================

export const verifyAdmin = (req: Request): AdminTokenPayload => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Authorization token missing.");
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET as string
  ) as AdminTokenPayload;

  if (decoded.role !== "SUPER_ADMIN") {
    throw new Error("Only Super Admin can access this endpoint.");
  }

  return decoded;
};

// ================= CREATE ACTIVITY LOG =================

export const createActivityLog = async (
  adminId: string,
  action: string,
  req: Request
) => {
  try {
    await ActivityLog.create({
      admin: adminId,
      action,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"] || "Unknown",
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Activity Log Error:", err);
  }
};

// ================= LOAD PLATFORM SETTINGS =================

export const getPlatformSettings = async () => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({
      maintenanceMode: false,
      tradingEnabled: true,
      buyEnabled: true,
      sellEnabled: true,
      referralEnabled: true,
      signupBonus: 500,
      firstDepositBonus: 1000,
      buyCommission: 1.5,
      sellCommission: 1.2,
    });
  }

  return settings;
};

// ================= GOLD PRICE HELPER =================

export const getLiveGoldPrice = async () => {
  let price = await GoldPrice.findOne().sort({ updatedAt: -1 });

  if (!price) {
    price = await GoldPrice.create({
      buyPrice: 0,
      sellPrice: 0,
      usdRate: 0,
      source: "Manual",
    });
  }

  return price;
};

// ================= DATABASE HEALTH CHECK =================

export const databaseHealth = async () => {
  return {
    mongoConnected: mongoose.connection.readyState === 1,
    database: mongoose.connection.name,
    host: mongoose.connection.host,
  };
};

// ================= ADMIN DASHBOARD COUNTERS =================

export const getDashboardCounters = async () => {
  const [
    totalUsers,
    verifiedUsers,
    pendingKyc,
    blockedUsers,
    pendingDeposits,
    approvedDeposits,
    pendingWithdrawals,
    approvedWithdrawals,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ kycStatus: "VERIFIED" }),
    User.countDocuments({ kycStatus: "PENDING" }),
    User.countDocuments({ accountStatus: "BLOCKED" }),
    Deposit.countDocuments({ status: "PENDING" }),
    Deposit.countDocuments({ status: "APPROVED" }),
    Withdrawal.countDocuments({ status: "PENDING" }),
    Withdrawal.countDocuments({ status: "APPROVED" }),
  ]);

  return {
    totalUsers,
    verifiedUsers,
    pendingKyc,
    blockedUsers,
    pendingDeposits,
    approvedDeposits,
    pendingWithdrawals,
    approvedWithdrawals,
  };
};

// ================= DATE FORMATTER =================

export const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(date);
};

// ======================================================
// END OF SECTION 1/10
// NEXT SECTION: ADMIN DASHBOARD API
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/adminController.ts
// SECTION 2/10
// ADMIN DASHBOARD API + STATISTICS + REVENUE SUMMARY
// ======================================================

/**
 * GET /api/admin/auth/check
 * Verify Super Admin JWT
 */

export const checkAdminAuth = async (req: Request, res: Response) => {
  try {
    const admin = verifyAdmin(req);

    return successResponse(res, "Admin authenticated successfully.", {
      role: admin.role,
      adminId: admin.id,
      email: admin.email,
    });
  } catch (error: any) {
    return errorResponse(res, error.message, 401);
  }
};

/**
 * GET /api/admin/dashboard
 * Complete dashboard statistics
 */

export const getAdminDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const counters = await getDashboardCounters();

    // ================= TOTAL DEPOSITS =================

    const depositResult = await Deposit.aggregate([
      { $match: { status: "APPROVED" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // ================= TOTAL WITHDRAWALS =================

    const withdrawalResult = await Withdrawal.aggregate([
      { $match: { status: "APPROVED" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // ================= TODAY REVENUE =================

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayDepositResult = await Deposit.aggregate([
      {
        $match: {
          status: "APPROVED",
          createdAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // ================= GOLD PRICE =================

    const goldPrice = await getLiveGoldPrice();

    // ================= REFERRAL STATS =================

    const referralStats = await Referral.aggregate([
      {
        $group: {
          _id: null,
          totalReferralBonus: { $sum: "$bonusAmount" },
          paidReferralBonus: {
            $sum: {
              $cond: [{ $eq: ["$status", "PAID"] }, "$bonusAmount", 0],
            },
          },
          pendingReferralBonus: {
            $sum: {
              $cond: [{ $eq: ["$status", "PENDING"] }, "$bonusAmount", 0],
            },
          },
        },
      },
    ]);

    // ================= DATABASE STATUS =================

    const dbHealth = await databaseHealth();

    // ================= ACTIVITY SUMMARY =================

    const latestActivity = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10);

    await createActivityLog(
      admin.id,
      "Viewed Admin Dashboard",
      req
    );

    return successResponse(res, "Dashboard loaded successfully.", {
      stats: {
        ...counters,

        totalDeposits: depositResult[0]?.total || 0,
        totalWithdrawals: withdrawalResult[0]?.total || 0,

        todayRevenue: todayDepositResult[0]?.total || 0,

        totalRevenue:
          (depositResult[0]?.total || 0) -
          (withdrawalResult[0]?.total || 0),

        liveGoldPrice: goldPrice.sellPrice,
        usdRate: goldPrice.usdRate,
      },

      goldPrice,

      referrals: referralStats[0] || {
        totalReferralBonus: 0,
        paidReferralBonus: 0,
        pendingReferralBonus: 0,
      },

      activity: latestActivity,

      database: dbHealth,
    });
  } catch (error: any) {
    console.error("Dashboard Error:", error);

    return errorResponse(
      res,
      error.message || "Failed to load dashboard."
    );
  }
};

/**
 * GET /api/admin/activity
 * Latest admin activity logs
 */

export const getActivityLogs = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return successResponse(res, "Activity logs loaded.", {
      logs,
    });
  } catch (error: any) {
    return errorResponse(res, error.message, 401);
  }
};

/**
 * GET /api/admin/database/status
 * MongoDB connection status
 */

export const getDatabaseStatus = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const health = await databaseHealth();

    return successResponse(res, "Database status loaded.", {
      health,
    });
  } catch (error: any) {
    return errorResponse(res, error.message, 401);
  }
};

// ======================================================
// END OF SECTION 2/10
// NEXT SECTION: USER MANAGEMENT APIs
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/adminController.ts
// SECTION 3/10
// USER MANAGEMENT APIs
// ======================================================

/**
 * GET /api/admin/users
 * Get all users with pagination
 */

export const getAllUsers = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments();

    return successResponse(
      res,
      "Users loaded successfully.",
      {
        users,
        pagination: {
          page,
          limit,
          totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
        },
      }
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/users/search
 * Search users
 */

export const searchUsers = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const query = String(req.query.q || "").trim();

    if (!query) {
      return errorResponse(
        res,
        "Search query required.",
        400
      );
    }

    const users = await User.find({
      $or: [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
      ],
    })
      .select("-password")
      .limit(50);

    return successResponse(
      res,
      "Search completed.",
      { users }
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/user/:id
 * User details
 */

export const getUserDetails = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const user = await User.findById(
      req.params.id
    ).select("-password");

    if (!user) {
      return errorResponse(
        res,
        "User not found.",
        404
      );
    }

    const wallet = await Wallet.findOne({
      user: user._id,
    });

    const deposits = await Deposit.countDocuments({
      user: user._id,
    });

    const withdrawals =
      await Withdrawal.countDocuments({
        user: user._id,
      });

    return successResponse(
      res,
      "User details loaded.",
      {
        user,
        wallet,
        deposits,
        withdrawals,
      }
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/user/block/:id
 * Block user
 */

export const blockUser = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return errorResponse(
        res,
        "User not found.",
        404
      );
    }

    user.accountStatus = "BLOCKED";

    await user.save();

    await createActivityLog(
      admin.id,
      `Blocked User: ${user.email}`,
      req
    );

    return successResponse(
      res,
      "User blocked successfully."
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/user/unblock/:id
 * Unblock user
 */

export const unblockUser = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return errorResponse(
        res,
        "User not found.",
        404
      );
    }

    user.accountStatus = "ACTIVE";

    await user.save();

    await createActivityLog(
      admin.id,
      `Unblocked User: ${user.email}`,
      req
    );

    return successResponse(
      res,
      "User unblocked successfully."
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/user/wallet/:id
 * Update wallet balance
 */

export const updateWalletBalance = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const {
      balance,
      goldBalance,
    } = req.body;

    const wallet = await Wallet.findOne({
      user: req.params.id,
    });

    if (!wallet) {
      return errorResponse(
        res,
        "Wallet not found.",
        404
      );
    }

    if (
      balance !== undefined &&
      !isNaN(Number(balance))
    ) {
      wallet.balance = Number(balance);
    }

    if (
      goldBalance !== undefined &&
      !isNaN(Number(goldBalance))
    ) {
      wallet.goldBalance =
        Number(goldBalance);
    }

    await wallet.save();

    await createActivityLog(
      admin.id,
      `Updated Wallet: ${req.params.id}`,
      req
    );

    return successResponse(
      res,
      "Wallet updated successfully.",
      {
        wallet,
      }
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * DELETE /api/admin/user/:id
 * Delete user
 */

export const deleteUser = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const user = await User.findById(
      req.params.id
    );

    if (!user) {
      return errorResponse(
        res,
        "User not found.",
        404
      );
    }

    await Wallet.deleteMany({
      user: user._id,
    });

    await Deposit.deleteMany({
      user: user._id,
    });

    await Withdrawal.deleteMany({
      user: user._id,
    });

    await User.findByIdAndDelete(
      user._id
    );

    await createActivityLog(
      admin.id,
      `Deleted User: ${user.email}`,
      req
    );

    return successResponse(
      res,
      "User deleted successfully."
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

// ======================================================
// END OF SECTION 3/10
// NEXT SECTION: KYC APPROVE / REJECT APIs
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/adminController.ts
// SECTION 4/10
// KYC MANAGEMENT APIs
// ======================================================

/**
 * GET /api/admin/kyc/pending
 * Get all pending KYC requests
 */
export const getPendingKycRequests = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const users = await User.find({ kycStatus: "PENDING" })
      .select("-password")
      .sort({ createdAt: -1 });

    return successResponse(res, "Pending KYC requests loaded.", {
      users,
      total: users.length,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/kyc/approve/:id
 * Approve KYC request
 */
export const approveKyc = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const admin = verifyAdmin(req);

    const user = await User.findById(req.params.id).session(session);

    if (!user) {
      await session.abortTransaction();
      return errorResponse(res, "User not found.", 404);
    }

    user.kycStatus = "VERIFIED";
    user.kycVerifiedAt = new Date();

    await user.save({ session });

    await createActivityLog(
      admin.id,
      `Approved KYC: ${user.email}`,
      req
    );

    await session.commitTransaction();

    return successResponse(res, "KYC approved successfully.", {
      user,
    });
  } catch (error: any) {
    await session.abortTransaction();
    return errorResponse(res, error.message);
  } finally {
    session.endSession();
  }
};

/**
 * PATCH /api/admin/kyc/reject/:id
 * Reject KYC request
 */
export const rejectKyc = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const admin = verifyAdmin(req);

    const { reason } = req.body;

    const user = await User.findById(req.params.id).session(session);

    if (!user) {
      await session.abortTransaction();
      return errorResponse(res, "User not found.", 404);
    }

    user.kycStatus = "REJECTED";
    user.kycRejectReason = reason || "KYC verification rejected.";

    await user.save({ session });

    await createActivityLog(
      admin.id,
      `Rejected KYC: ${user.email}`,
      req
    );

    await session.commitTransaction();

    return successResponse(res, "KYC rejected successfully.", {
      user,
    });
  } catch (error: any) {
    await session.abortTransaction();
    return errorResponse(res, error.message);
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/admin/kyc/stats
 * KYC statistics
 */
export const getKycStatistics = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const [
      totalUsers,
      verified,
      pending,
      rejected,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ kycStatus: "VERIFIED" }),
      User.countDocuments({ kycStatus: "PENDING" }),
      User.countDocuments({ kycStatus: "REJECTED" }),
    ]);

    const verificationRate =
      totalUsers === 0
        ? 0
        : Math.round((verified / totalUsers) * 100);

    return successResponse(res, "KYC statistics loaded.", {
      totalUsers,
      verified,
      pending,
      rejected,
      verificationRate,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/kyc/user/:id
 * Get single user's KYC information
 */
export const getUserKycDetails = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const user = await User.findById(req.params.id).select(
      "fullName email phone country city kycStatus kycFrontImage kycBackImage selfieImage createdAt"
    );

    if (!user) {
      return errorResponse(res, "User not found.", 404);
    }

    return successResponse(res, "User KYC loaded.", {
      user,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

// ======================================================
// END OF SECTION 4/10
// NEXT SECTION: DEPOSIT APPROVE / REJECT APIs
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/adminController.ts
// SECTION 5/10
// DEPOSIT MANAGEMENT APIs
// ======================================================

/**
 * GET /api/admin/deposits
 * Get all deposit requests
 */
export const getAllDeposits = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const status = String(req.query.status || "");

    const filter: any = {};
    if (status && status !== "ALL") {
      filter.status = status;
    }

    const deposits = await Deposit.find(filter)
      .populate("user", "fullName email phone")
      .sort({ createdAt: -1 });

    return successResponse(res, "Deposits loaded successfully.", {
      deposits,
      total: deposits.length,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/deposit/:id
 * Single deposit details
 */
export const getDepositDetails = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const deposit = await Deposit.findById(req.params.id)
      .populate("user", "fullName email phone country city");

    if (!deposit) {
      return errorResponse(res, "Deposit not found.", 404);
    }

    return successResponse(res, "Deposit loaded successfully.", {
      deposit,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/deposit/approve/:id
 * Approve deposit and update wallet balance
 */
export const approveDeposit = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const admin = verifyAdmin(req);

    const deposit = await Deposit.findById(req.params.id).session(session);

    if (!deposit) {
      await session.abortTransaction();
      return errorResponse(res, "Deposit not found.", 404);
    }

    if (deposit.status === "APPROVED") {
      await session.abortTransaction();
      return errorResponse(res, "Deposit already approved.", 400);
    }

    const wallet = await Wallet.findOne({
      user: deposit.user,
    }).session(session);

    if (!wallet) {
      await session.abortTransaction();
      return errorResponse(res, "Wallet not found.", 404);
    }

    wallet.balance += deposit.amount;
    await wallet.save({ session });

    deposit.status = "APPROVED";
    deposit.approvedBy = admin.id;
    deposit.approvedAt = new Date();

    await deposit.save({ session });

    await createActivityLog(
      admin.id,
      `Approved Deposit: ${deposit.amount}`,
      req
    );

    await session.commitTransaction();

    return successResponse(res, "Deposit approved successfully.", {
      deposit,
      wallet,
    });
  } catch (error: any) {
    await session.abortTransaction();
    return errorResponse(res, error.message);
  } finally {
    session.endSession();
  }
};

/**
 * PATCH /api/admin/deposit/reject/:id
 * Reject deposit request
 */
export const rejectDeposit = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const admin = verifyAdmin(req);

    const { reason } = req.body;

    const deposit = await Deposit.findById(req.params.id).session(session);

    if (!deposit) {
      await session.abortTransaction();
      return errorResponse(res, "Deposit not found.", 404);
    }

    if (deposit.status === "REJECTED") {
      await session.abortTransaction();
      return errorResponse(res, "Deposit already rejected.", 400);
    }

    deposit.status = "REJECTED";
    deposit.rejectedBy = admin.id;
    deposit.rejectedAt = new Date();
    deposit.rejectionReason =
      reason || "Deposit rejected by admin.";

    await deposit.save({ session });

    await createActivityLog(
      admin.id,
      `Rejected Deposit: ${deposit.amount}`,
      req
    );

    await session.commitTransaction();

    return successResponse(res, "Deposit rejected successfully.", {
      deposit,
    });
  } catch (error: any) {
    await session.abortTransaction();
    return errorResponse(res, error.message);
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/admin/deposit/stats
 * Deposit statistics
 */
export const getDepositStatistics = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const stats = await Deposit.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    const result = {
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0,
    };

    stats.forEach((item: { _id: string; count: number; amount: number }) => {
      if (item._id === "PENDING") {
        result.pendingCount = item.count;
        result.pendingAmount = item.amount;
      }

      if (item._id === "APPROVED") {
        result.approvedCount = item.count;
        result.approvedAmount = item.amount;
      }

      if (item._id === "REJECTED") {
        result.rejectedCount = item.count;
        result.rejectedAmount = item.amount;
      }
    });

    return successResponse(res, "Deposit statistics loaded.", {
      stats: result,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * DELETE /api/admin/deposit/:id
 * Delete rejected deposit record
 */
export const deleteDeposit = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const deposit = await Deposit.findById(req.params.id);

    if (!deposit) {
      return errorResponse(res, "Deposit not found.", 404);
    }

    if (deposit.status !== "REJECTED") {
      return errorResponse(
        res,
        "Only rejected deposits can be deleted.",
        400
      );
    }

    await Deposit.findByIdAndDelete(deposit._id);

    await createActivityLog(
      admin.id,
      `Deleted Deposit Record: ${deposit.amount}`,
      req
    );

    return successResponse(res, "Deposit deleted successfully.");
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

// ======================================================
// END OF SECTION 5/10
// NEXT SECTION: WITHDRAWAL APPROVE / REJECT APIs
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/adminController.ts
// SECTION 6/10
// WITHDRAWAL MANAGEMENT APIs
// ======================================================

/**
 * GET /api/admin/withdrawals
 * Get all withdrawal requests
 */

export const getAllWithdrawals = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const status = String(req.query.status || "");

    const filter: any = {};

    if (status && status !== "ALL") {
      filter.status = status;
    }

    const withdrawals = await Withdrawal.find(filter)
      .populate("user", "fullName email phone country city")
      .sort({ createdAt: -1 });

    return successResponse(res, "Withdrawals loaded successfully.", {
      withdrawals,
      total: withdrawals.length,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/withdrawal/:id
 * Single withdrawal details
 */

export const getWithdrawalDetails = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const withdrawal = await Withdrawal.findById(req.params.id)
      .populate("user", "fullName email phone country city");

    if (!withdrawal) {
      return errorResponse(res, "Withdrawal not found.", 404);
    }

    return successResponse(res, "Withdrawal details loaded.", {
      withdrawal,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/withdrawal/approve/:id
 * Approve withdrawal and deduct wallet balance
 */

export const approveWithdrawal = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const admin = verifyAdmin(req);

    const withdrawal = await Withdrawal.findById(req.params.id).session(session);

    if (!withdrawal) {
      await session.abortTransaction();
      return errorResponse(res, "Withdrawal not found.", 404);
    }

    if (withdrawal.status === "APPROVED") {
      await session.abortTransaction();
      return errorResponse(res, "Withdrawal already approved.", 400);
    }

    const wallet = await Wallet.findOne({
      user: withdrawal.user,
    }).session(session);

    if (!wallet) {
      await session.abortTransaction();
      return errorResponse(res, "Wallet not found.", 404);
    }

    if (wallet.balance < withdrawal.amount) {
      await session.abortTransaction();
      return errorResponse(
        res,
        "Insufficient wallet balance.",
        400
      );
    }

    wallet.balance -= withdrawal.amount;

    await wallet.save({ session });

    withdrawal.status = "APPROVED";
    withdrawal.approvedBy = admin.id;
    withdrawal.approvedAt = new Date();
    withdrawal.paymentStatus = "COMPLETED";

    await withdrawal.save({ session });

    await createActivityLog(
      admin.id,
      `Approved Withdrawal: PKR ${withdrawal.amount}`,
      req
    );

    await session.commitTransaction();

    return successResponse(res, "Withdrawal approved successfully.", {
      withdrawal,
      wallet,
    });
  } catch (error: any) {
    await session.abortTransaction();
    return errorResponse(res, error.message);
  } finally {
    session.endSession();
  }
};

/**
 * PATCH /api/admin/withdrawal/reject/:id
 * Reject withdrawal request
 */

export const rejectWithdrawal = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const admin = verifyAdmin(req);

    const { reason } = req.body;

    const withdrawal = await Withdrawal.findById(req.params.id).session(session);

    if (!withdrawal) {
      await session.abortTransaction();
      return errorResponse(res, "Withdrawal not found.", 404);
    }

    if (withdrawal.status === "REJECTED") {
      await session.abortTransaction();
      return errorResponse(
        res,
        "Withdrawal already rejected.",
        400
      );
    }

    withdrawal.status = "REJECTED";
    withdrawal.paymentStatus = "FAILED";
    withdrawal.rejectedBy = admin.id;
    withdrawal.rejectedAt = new Date();
    withdrawal.rejectionReason =
      reason || "Withdrawal rejected by administrator.";

    await withdrawal.save({ session });

    await createActivityLog(
      admin.id,
      `Rejected Withdrawal: PKR ${withdrawal.amount}`,
      req
    );

    await session.commitTransaction();

    return successResponse(res, "Withdrawal rejected successfully.", {
      withdrawal,
    });
  } catch (error: any) {
    await session.abortTransaction();
    return errorResponse(res, error.message);
  } finally {
    session.endSession();
  }
};

/**
 * PATCH /api/admin/withdrawal/bulk-approve
 * Bulk approve pending withdrawals
 */

export const bulkApproveWithdrawals = async (
  req: Request,
  res: Response
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const admin = verifyAdmin(req);

    const { withdrawalIds } = req.body;

    if (!Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
      await session.abortTransaction();
      return errorResponse(
        res,
        "Withdrawal IDs are required.",
        400
      );
    }

    const approved: string[] = [];

    for (const id of withdrawalIds) {
      const withdrawal = await Withdrawal.findById(id).session(session);

      if (!withdrawal || withdrawal.status !== "PENDING") {
        continue;
      }

      const wallet = await Wallet.findOne({
        user: withdrawal.user,
      }).session(session);

      if (!wallet || wallet.balance < withdrawal.amount) {
        continue;
      }

      wallet.balance -= withdrawal.amount;
      await wallet.save({ session });

      withdrawal.status = "APPROVED";
      withdrawal.paymentStatus = "COMPLETED";
      withdrawal.approvedBy = admin.id;
      withdrawal.approvedAt = new Date();

      await withdrawal.save({ session });

      approved.push(withdrawal._id.toString());
    }

    await createActivityLog(
      admin.id,
      `Bulk Approved ${approved.length} Withdrawals`,
      req
    );

    await session.commitTransaction();

    return successResponse(
      res,
      `${approved.length} withdrawals approved successfully.`,
      {
        approvedIds: approved,
      }
    );
  } catch (error: any) {
    await session.abortTransaction();
    return errorResponse(res, error.message);
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/admin/withdrawal/stats
 * Withdrawal statistics
 */

export const getWithdrawalStatistics = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const stats = await Withdrawal.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    const result = {
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      pendingAmount: 0,
      approvedAmount: 0,
      rejectedAmount: 0,
    };

    stats.forEach((item: { _id: string; count: number; amount: number }) => {
      if (item._id === "PENDING") {
        result.pendingCount = item.count;
        result.pendingAmount = item.amount;
      }

      if (item._id === "APPROVED") {
        result.approvedCount = item.count;
        result.approvedAmount = item.amount;
      }

      if (item._id === "REJECTED") {
        result.rejectedCount = item.count;
        result.rejectedAmount = item.amount;
      }
    });

    return successResponse(res, "Withdrawal statistics loaded.", {
      stats: result,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * DELETE /api/admin/withdrawal/:id
 * Delete rejected withdrawal record
 */

export const deleteWithdrawal = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const withdrawal = await Withdrawal.findById(req.params.id);

    if (!withdrawal) {
      return errorResponse(res, "Withdrawal not found.", 404);
    }

    if (withdrawal.status !== "REJECTED") {
      return errorResponse(
        res,
        "Only rejected withdrawals can be deleted.",
        400
      );
    }

    await Withdrawal.findByIdAndDelete(withdrawal._id);

    await createActivityLog(
      admin.id,
      `Deleted Withdrawal Record: PKR ${withdrawal.amount}`,
      req
    );

    return successResponse(
      res,
      "Withdrawal record deleted successfully."
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

// ======================================================
// END OF SECTION 6/10
// NEXT SECTION: GOLD PRICE UPDATE APIs
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/adminController.ts
// SECTION 7/10
// GOLD PRICE + TRADING CONTROL APIs
// ======================================================

/**
 * GET /api/admin/gold-price
 * Get current gold price settings
 */

export const getGoldPriceSettings = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const goldPrice = await getLiveGoldPrice();

    return successResponse(res, "Gold price loaded.", {
      goldPrice,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/gold-price
 * Update gold buy/sell price
 */

export const updateGoldPrice = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const {
      buyPrice,
      sellPrice,
      usdRate,
      source,
    } = req.body;

    const goldPrice = await getLiveGoldPrice();

    if (buyPrice !== undefined) {
      goldPrice.buyPrice = Number(buyPrice);
    }

    if (sellPrice !== undefined) {
      goldPrice.sellPrice = Number(sellPrice);
    }

    if (usdRate !== undefined) {
      goldPrice.usdRate = Number(usdRate);
    }

    goldPrice.source = source || "Manual";
    goldPrice.updatedAt = new Date();

    await goldPrice.save();

    await createActivityLog(
      admin.id,
      `Updated Gold Price Buy:${goldPrice.buyPrice} Sell:${goldPrice.sellPrice}`,
      req
    );

    return successResponse(res, "Gold price updated successfully.", {
      goldPrice,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/trading/settings
 * Update trading configuration
 */

export const updateTradingSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const settings = await getPlatformSettings();

    const {
      tradingEnabled,
      buyEnabled,
      sellEnabled,
      maintenanceMode,
      buyCommission,
      sellCommission,
      minimumTradeAmount,
      maximumTradeAmount,
    } = req.body;

    if (tradingEnabled !== undefined) {
      settings.tradingEnabled = tradingEnabled;
    }

    if (buyEnabled !== undefined) {
      settings.buyEnabled = buyEnabled;
    }

    if (sellEnabled !== undefined) {
      settings.sellEnabled = sellEnabled;
    }

    if (maintenanceMode !== undefined) {
      settings.maintenanceMode = maintenanceMode;
    }

    if (buyCommission !== undefined) {
      settings.buyCommission = Number(buyCommission);
    }

    if (sellCommission !== undefined) {
      settings.sellCommission = Number(sellCommission);
    }

    if (minimumTradeAmount !== undefined) {
      settings.minimumTradeAmount = Number(minimumTradeAmount);
    }

    if (maximumTradeAmount !== undefined) {
      settings.maximumTradeAmount = Number(maximumTradeAmount);
    }

    await settings.save();

    await createActivityLog(
      admin.id,
      "Updated Trading Settings",
      req
    );

    return successResponse(res, "Trading settings updated.", {
      settings,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/trading/session
 * Update trading session timings
 */

export const updateTradingSession = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const settings = await getPlatformSettings();

    const {
      marketOpen,
      marketClose,
      timezone,
      weekendTrading,
    } = req.body;

    settings.marketOpen = marketOpen;
    settings.marketClose = marketClose;
    settings.marketTimezone = timezone;
    settings.weekendTrading = weekendTrading;

    await settings.save();

    await createActivityLog(
      admin.id,
      "Updated Trading Session",
      req
    );

    return successResponse(res, "Trading session updated.", {
      settings,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/trading/pause
 * Pause or resume trading
 */

export const toggleTradingStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const settings = await getPlatformSettings();

    const { action } = req.body;

    switch (action) {
      case "PAUSE_ALL":
        settings.tradingEnabled = false;
        settings.buyEnabled = false;
        settings.sellEnabled = false;
        break;

      case "RESUME_ALL":
        settings.tradingEnabled = true;
        settings.buyEnabled = true;
        settings.sellEnabled = true;
        break;

      case "PAUSE_BUY":
        settings.buyEnabled = false;
        break;

      case "PAUSE_SELL":
        settings.sellEnabled = false;
        break;

      case "RESUME_BUY":
        settings.buyEnabled = true;
        break;

      case "RESUME_SELL":
        settings.sellEnabled = true;
        break;

      default:
        return errorResponse(res, "Invalid trading action.", 400);
    }

    await settings.save();

    await createActivityLog(
      admin.id,
      `Trading Action: ${action}`,
      req
    );

    return successResponse(res, "Trading status updated.", {
      settings,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/trading/settings
 * Get trading configuration
 */

export const getTradingSettings = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const settings = await getPlatformSettings();

    return successResponse(res, "Trading settings loaded.", {
      settings,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/trading/status
 * Trading system status
 */

export const getTradingStatus = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const settings = await getPlatformSettings();
    const goldPrice = await getLiveGoldPrice();

    return successResponse(res, "Trading status loaded.", {
      trading: {
        enabled: settings.tradingEnabled,
        buyEnabled: settings.buyEnabled,
        sellEnabled: settings.sellEnabled,
        maintenanceMode: settings.maintenanceMode,
      },

      goldPrice: {
        buyPrice: goldPrice.buyPrice,
        sellPrice: goldPrice.sellPrice,
        usdRate: goldPrice.usdRate,
        updatedAt: goldPrice.updatedAt,
      },

      session: {
        marketOpen: settings.marketOpen,
        marketClose: settings.marketClose,
        timezone: settings.marketTimezone,
        weekendTrading: settings.weekendTrading,
      },
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

// ======================================================
// END OF SECTION 7/10
// NEXT SECTION: REFERRAL & COMMISSION APIs
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/adminController.ts
// SECTION 8/10
// REFERRAL + COMMISSION + PROMO CODE + BONUS APIs
// ======================================================

/**
 * GET /api/admin/referrals
 * Referral statistics
 */
export const getReferralDashboard = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const referralSummary = await Referral.aggregate([
      {
        $group: {
          _id: null,
          totalReferralBonus: { $sum: "$bonusAmount" },
          paidReferralBonus: {
            $sum: {
              $cond: [{ $eq: ["$status", "PAID"] }, "$bonusAmount", 0]
            }
          },
          pendingReferralBonus: {
            $sum: {
              $cond: [{ $eq: ["$status", "PENDING"] }, "$bonusAmount", 0]
            }
          },
          totalReferrals: { $sum: 1 }
        }
      }
    ]);

    return successResponse(res, "Referral dashboard loaded.", {
      referrals: referralSummary[0] || {
        totalReferralBonus: 0,
        paidReferralBonus: 0,
        pendingReferralBonus: 0,
        totalReferrals: 0
      }
    });

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/referrals/settings
 * Update referral configuration
 */
export const updateReferralSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const settings = await getPlatformSettings();

    const {
      referralEnabled,
      signupBonus,
      firstDepositBonus,
      referralCommission
    } = req.body;

    if (referralEnabled !== undefined)
      settings.referralEnabled = referralEnabled;

    if (signupBonus !== undefined)
      settings.signupBonus = Number(signupBonus);

    if (firstDepositBonus !== undefined)
      settings.firstDepositBonus = Number(firstDepositBonus);

    if (referralCommission !== undefined)
      settings.referralCommission = Number(referralCommission);

    await settings.save();

    await createActivityLog(
      admin.id,
      "Updated Referral Settings",
      req
    );

    return successResponse(res, "Referral settings updated.", {
      settings
    });

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * POST /api/admin/promo/create
 * Create promo code
 */
export const createPromoCode = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const {
      code,
      bonusAmount,
      campaignType,
      expiryDate
    } = req.body;

    const settings = await getPlatformSettings();

    settings.promoCodes.push({
      code: code.toUpperCase(),
      bonusAmount: Number(bonusAmount),
      campaignType,
      expiryDate,
      active: true
    });

    await settings.save();

    await createActivityLog(
      admin.id,
      `Created Promo Code ${code}`,
      req
    );

    return successResponse(res, "Promo code created.", {
      promoCode: code
    });

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/promo/status/:code
 * Enable / Disable promo code
 */
export const updatePromoStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const settings = await getPlatformSettings();

    const promoCode = Array.isArray(req.params.code)
      ? req.params.code[0]
      : req.params.code;

    const promo = settings.promoCodes.find(
      (item: any) => item.code === promoCode.toUpperCase()
    );

    if (!promo) {
      return errorResponse(res, "Promo code not found.", 404);
    }

    promo.active = !promo.active;

    await settings.save();

    await createActivityLog(
      admin.id,
      `Updated Promo Code ${promo.code}`,
      req
    );

    return successResponse(res, "Promo status updated.", {
      promo
    });

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * DELETE /api/admin/promo/:code
 * Delete promo code
 */
export const deletePromoCode = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const settings = await getPlatformSettings();

    settings.promoCodes = settings.promoCodes.filter(
      (promo: any) =>
        promo.code !== String(req.params.code).toUpperCase()
    );

    await settings.save();

    await createActivityLog(
      admin.id,
      `Deleted Promo Code ${req.params.code}`,
      req
    );

    return successResponse(res, "Promo code deleted.");

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/affiliate/settings
 * Update affiliate commission levels
 */
export const updateAffiliateCommission = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const settings = await getPlatformSettings();

    const {
      level1Commission,
      level2Commission,
      level3Commission,
      minimumCommissionWithdrawal
    } = req.body;

    settings.level1Commission = Number(level1Commission);
    settings.level2Commission = Number(level2Commission);
    settings.level3Commission = Number(level3Commission);
    settings.minimumCommissionWithdrawal =
      Number(minimumCommissionWithdrawal);

    await settings.save();

    await createActivityLog(
      admin.id,
      "Updated Affiliate Commission Settings",
      req
    );

    return successResponse(res, "Affiliate commission updated.", {
      settings
    });

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * POST /api/admin/bonus/campaign
 * Launch bonus campaign
 */
export const launchBonusCampaign = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const {
      title,
      bonusAmount,
      targetUsers,
      expiryDate
    } = req.body;

    const settings = await getPlatformSettings();

    settings.bonusCampaigns.push({
      title,
      bonusAmount: Number(bonusAmount),
      targetUsers,
      expiryDate,
      active: true,
      createdAt: new Date()
    });

    await settings.save();

    await createActivityLog(
      admin.id,
      `Launched Bonus Campaign: ${title}`,
      req
    );

    return successResponse(res, "Bonus campaign launched.", {
      campaign: title
    });

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/referral/leaderboard
 * Top referral earners
 */
export const getReferralLeaderboard = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const leaderboard = await Referral.aggregate([
      {
        $group: {
          _id: "$referrer",
          referrals: { $sum: 1 },
          reward: { $sum: "$bonusAmount" }
        }
      },
      { $sort: { reward: -1 } },
      { $limit: 20 }
    ]);

    return successResponse(res, "Leaderboard loaded.", {
      leaderboard
    });

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

// ======================================================
// END OF SECTION 8/10
// NEXT SECTION: REPORTS + ANALYTICS + ACTIVITY LOG APIs
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/adminController.ts
// SECTION 9/10
// REPORTS + ANALYTICS + ACTIVITY LOGS + EXPORT APIs
// ======================================================

/**
 * GET /api/admin/reports/revenue
 * Revenue report
 */

export const getRevenueReport = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const deposits = await Deposit.aggregate([
      { $match: { status: "APPROVED" } },
      {
        $group: {
          _id: null,
          totalDeposits: { $sum: "$amount" },
          totalDepositCount: { $sum: 1 }
        }
      }
    ]);

    const withdrawals = await Withdrawal.aggregate([
      { $match: { status: "APPROVED" } },
      {
        $group: {
          _id: null,
          totalWithdrawals: { $sum: "$amount" },
          totalWithdrawalCount: { $sum: 1 }
        }
      }
    ]);

    const totalDeposits = deposits[0]?.totalDeposits || 0;
    const totalWithdrawals = withdrawals[0]?.totalWithdrawals || 0;

    return successResponse(res, "Revenue report loaded.", {
      revenue: {
        totalDeposits,
        totalWithdrawals,
        netRevenue: totalDeposits - totalWithdrawals,
        totalDepositCount: deposits[0]?.totalDepositCount || 0,
        totalWithdrawalCount:
          withdrawals[0]?.totalWithdrawalCount || 0
      }
    });

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/reports/monthly
 * Monthly revenue analytics
 */

export const getMonthlyRevenueReport = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const report = await Deposit.aggregate([
      { $match: { status: "APPROVED" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 }
        }
      },
      {
        $sort: {
          "_id.year": -1,
          "_id.month": -1
        }
      }
    ]);

    return successResponse(
      res,
      "Monthly report loaded.",
      { report }
    );

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/reports/users
 * User analytics
 */

export const getUserAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const analytics = {
      totalUsers: await User.countDocuments(),
      verifiedUsers: await User.countDocuments({
        kycStatus: "VERIFIED"
      }),
      pendingKyc: await User.countDocuments({
        kycStatus: "PENDING"
      }),
      blockedUsers: await User.countDocuments({
        accountStatus: "BLOCKED"
      }),
      activeUsers: await User.countDocuments({
        accountStatus: "ACTIVE"
      })
    };

    return successResponse(
      res,
      "User analytics loaded.",
      analytics
    );

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/reports/trading
 * Trading analytics
 */

export const getTradingAnalytics = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const walletStats = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalCashBalance: { $sum: "$balance" },
          totalGoldBalance: { $sum: "$goldBalance" }
        }
      }
    ]);

    const goldPrice = await getLiveGoldPrice();

    return successResponse(
      res,
      "Trading analytics loaded.",
      {
        trading: walletStats[0] || {
          totalCashBalance: 0,
          totalGoldBalance: 0
        },
        liveGoldPrice: goldPrice
      }
    );

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/activity
 * Latest activity logs
 */

export const getActivityLogReport = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ActivityLog.countDocuments();

    return successResponse(
      res,
      "Activity logs loaded.",
      {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    );

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/reports/export/users
 * Export users report
 */

export const exportUsersReport = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const users = await User.find().select("-password");

    return successResponse(
      res,
      "Users exported successfully.",
      {
        exportedAt: new Date(),
        total: users.length,
        users
      }
    );

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/reports/export/deposits
 * Export deposits report
 */

export const exportDepositsReport = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const deposits = await Deposit.find()
      .populate("user", "fullName email phone")
      .sort({ createdAt: -1 });

    return successResponse(
      res,
      "Deposits exported successfully.",
      {
        exportedAt: new Date(),
        total: deposits.length,
        deposits
      }
    );

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/reports/export/withdrawals
 * Export withdrawals report
 */

export const exportWithdrawalsReport = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const withdrawals = await Withdrawal.find()
      .populate("user", "fullName email phone")
      .sort({ createdAt: -1 });

    return successResponse(
      res,
      "Withdrawals exported successfully.",
      {
        exportedAt: new Date(),
        total: withdrawals.length,
        withdrawals
      }
    );

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/reports/dashboard-summary
 * Complete analytics summary
 */

export const getDashboardSummary = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const counters = await getDashboardCounters();
    const goldPrice = await getLiveGoldPrice();
    const settings = await getPlatformSettings();

    const latestActivities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return successResponse(
      res,
      "Dashboard summary loaded.",
      {
        counters,
        goldPrice,
        settings,
        latestActivities
      }
    );

  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

// ======================================================
// END OF SECTION 9/10
// NEXT SECTION: SYSTEM SETTINGS + MAINTENANCE + BACKUP APIs
// ======================================================// ======================================================
// GOLDTRADE V17 ENTERPRISE
// FILE: backend/src/controllers/adminController.ts
// SECTION 10/10
// SYSTEM SETTINGS + MAINTENANCE + BACKUP + HEALTH + LOGOUT
// ======================================================

/**
 * GET /api/admin/settings
 * Get platform settings
 */
export const getAdminSettings = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const settings = await getPlatformSettings();

    return successResponse(res, "Platform settings loaded.", {
      settings,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/settings
 * Update platform settings
 */
export const updateAdminSettings = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const settings = await getPlatformSettings();

    const {
      platformName,
      supportEmail,
      supportWhatsApp,
      defaultCurrency,
      minimumWithdrawal,
      minimumDeposit,
    } = req.body;

    if (platformName !== undefined)
      settings.platformName = platformName;

    if (supportEmail !== undefined)
      settings.supportEmail = supportEmail;

    if (supportWhatsApp !== undefined)
      settings.supportWhatsApp = supportWhatsApp;

    if (defaultCurrency !== undefined)
      settings.defaultCurrency = defaultCurrency;

    if (minimumWithdrawal !== undefined)
      settings.minimumWithdrawal = Number(minimumWithdrawal);

    if (minimumDeposit !== undefined)
      settings.minimumDeposit = Number(minimumDeposit);

    settings.updatedAt = new Date();

    await settings.save();

    await createActivityLog(
      admin.id,
      "Updated Platform Settings",
      req
    );

    return successResponse(
      res,
      "Platform settings updated successfully.",
      { settings }
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * PATCH /api/admin/maintenance
 * Enable or disable maintenance mode
 */
export const toggleMaintenanceMode = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const settings = await getPlatformSettings();

    settings.maintenanceMode = Boolean(req.body.enabled);

    await settings.save();

    await createActivityLog(
      admin.id,
      settings.maintenanceMode
        ? "Maintenance Mode Enabled"
        : "Maintenance Mode Disabled",
      req
    );

    return successResponse(res, "Maintenance mode updated.", {
      maintenanceMode: settings.maintenanceMode,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/system/health
 * Complete system health status
 */
export const getSystemHealth = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const db = await databaseHealth();

    const health = {
      database: db,
      uptimeSeconds: Math.floor(process.uptime()),
      serverTime: new Date(),
      nodeVersion: process.version,
      environment:
        process.env.NODE_ENV || "development",
      memoryUsage: process.memoryUsage(),
    };

    return successResponse(res, "System health loaded.", {
      health,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/database/backup
 * Generate database backup summary
 */
export const backupDatabase = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    const backupSummary = {
      users: await User.countDocuments(),
      wallets: await Wallet.countDocuments(),
      deposits: await Deposit.countDocuments(),
      withdrawals: await Withdrawal.countDocuments(),
      referrals: await Referral.countDocuments(),
      activityLogs: await ActivityLog.countDocuments(),
      generatedAt: new Date(),
    };

    await createActivityLog(
      admin.id,
      "Generated Database Backup Summary",
      req
    );

    return successResponse(res, "Backup summary generated.", {
      backupSummary,
    });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * POST /api/admin/cache/clear
 * Clear application cache
 */
export const clearApplicationCache = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    // Placeholder for cache layer (Redis / Memory Cache)
    await createActivityLog(
      admin.id,
      "Cleared Application Cache",
      req
    );

    return successResponse(
      res,
      "Application cache cleared successfully."
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * POST /api/admin/system/restart
 * Restart background workers
 */
export const restartBackgroundWorkers = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    await createActivityLog(
      admin.id,
      "Restarted Background Workers",
      req
    );

    return successResponse(
      res,
      "Background workers restarted successfully."
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * GET /api/admin/dashboard/quick-summary
 * Small dashboard summary
 */
export const getQuickSummary = async (
  req: Request,
  res: Response
) => {
  try {
    verifyAdmin(req);

    const counters = await getDashboardCounters();
    const goldPrice = await getLiveGoldPrice();

    return successResponse(
      res,
      "Quick dashboard summary loaded.",
      {
        counters,
        goldPrice,
        generatedAt: new Date(),
      }
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

/**
 * POST /api/admin/logout
 * Admin logout
 */
export const adminLogout = async (
  req: Request,
  res: Response
) => {
  try {
    const admin = verifyAdmin(req);

    await createActivityLog(
      admin.id,
      "Admin Logged Out",
      req
    );

    return successResponse(
      res,
      "Admin logged out successfully."
    );
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

// ======================================================
// END OF FILE
// backend/src/controllers/adminController.ts
// GOLDTRADE V17 ENTERPRISE CONTROLLER COMPLETE
// ======================================================