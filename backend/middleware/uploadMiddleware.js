const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../uploads/deposits");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },

  filename(req, file, cb) {
    const name =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PNG/JPG/WebP images allowed."));
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});