const cloudinary = require("cloudinary").v2;

// =========================================
// CLOUDINARY CONFIGURATION
// GoldTrade V17 Enterprise
// =========================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;