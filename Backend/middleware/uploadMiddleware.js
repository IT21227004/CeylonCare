const multer = require("multer");
const path = require("path");
const fs = require("fs");

const profilePhotosPath = path.join(__dirname, "../uploads/profilePhotos");
if (!fs.existsSync(profilePhotosPath)) {
  fs.mkdirSync(profilePhotosPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profilePhotosPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (["image/jpeg", "image/png", "image/jpg"].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and JPG formats are supported"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
