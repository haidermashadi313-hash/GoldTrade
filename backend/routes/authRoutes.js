const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ======================================================
// VERIFY JWT TOKEN (LOGIN REQUIRED)
// ======================================================
const verifyToken = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Login required.",
      });
    }

    token = token.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization token.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by administrator.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("JWT Verify Error:", err.message);

    return res.status(401).json({
      success: false,
      message: "Session expired. Please login again.",
    });
  }
};

// ======================================================
// OPTIONAL AUTH (PUBLIC ROUTES)
// ======================================================
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.headers.authorization;

    if (!token) {
      return next();
    }

    token = token.replace("Bearer ", "").trim();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (user && user.status === "Active") {
      req.user = user;
    }

    next();
  } catch (err) {
    next();
  }
};

// ======================================================
// VERIFY SELF (USER CAN ACCESS OWN ACCOUNT)
// ======================================================
const verifySelf = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized.",
      });
    }

    const username =
      req.params.username ||
      req.body.username ||
      req.query.username;

    if (
      req.user.role === "admin" ||
      req.user.role === "manager"
    ) {
      return next();
    }

    if (req.user.username !== username) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// ADMIN ONLY
// ======================================================
const verifyAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// ADMIN + MANAGER
// ======================================================
const verifyManager = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (
      req.user.role !== "admin" &&
      req.user.role !== "manager"
    ) {
      return res.status(403).json({
        success: false,
        message: "Admin or Manager access required.",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ======================================================
// ROLE HELPER
// ======================================================
const verifyRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Authentication required.",
        });
      }

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Permission denied.",
        });
      }

      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message,
      });
    }
  };
};

// ======================================================
// GENERATE JWT TOKEN
// ======================================================
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// ======================================================
// EXPORTS
// ======================================================
module.exports = {
  verifyToken,
  optionalAuth,
  verifySelf,
  verifyAdmin,
  verifyManager,
  verifyRole,
  generateToken,
};