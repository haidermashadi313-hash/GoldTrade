const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
  return jwt.sign(
    {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

const verifyToken = async (req, res, next) => {
  try {
    const bearer = req.headers.authorization;

    if (!bearer || !bearer.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token missing.",
      });
    }

    const token = bearer.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid user.",
      });
    }

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = {
  generateToken,
  verifyToken,
};