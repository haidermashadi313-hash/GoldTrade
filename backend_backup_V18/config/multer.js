const multer = require("multer");
const path = require("path");
const { v4: uuid } = require("uuid");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/receipts");
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);

    cb(null, uuid() + ext);
  },
});

const upload = multer({ storage });

module.exports = upload;