const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "goldtrade/receipts",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    public_id: `receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  }),
});

// Image Filter
const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG/JPG/JPEG/WebP images are allowed."));
  }
};

// Upload Middleware
module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});