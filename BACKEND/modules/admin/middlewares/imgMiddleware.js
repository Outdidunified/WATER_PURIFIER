const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Correct path to save files inside frontend/admin/public/assets2/img/products
const uploadPath = path.join(__dirname, '..', '..', '..', '..', 'upload', 'img',);

// Create directory if it doesn't exist
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });

module.exports = {
    upload,
};
