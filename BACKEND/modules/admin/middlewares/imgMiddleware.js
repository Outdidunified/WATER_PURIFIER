// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// // Correct path to save files inside frontend/admin/public/assets2/img/products

// const uploadPath = path.join(__dirname, '..', '..', '..', '..', 'upload', 'img',);

// // Create directory if it doesn't exist

// if (!fs.existsSync(uploadPath)) {
//     fs.mkdirSync(uploadPath, { recursive: true });
// }

// // Configure Multer storage

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => cb(null, uploadPath),
//     filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
// });

// const upload = multer({ storage });

// module.exports = {
//     upload,
// };

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define upload paths
const imageUploadPath = path.join(__dirname, '..', '..', '..', '..', 'upload', 'img');
const pdfUploadPath = path.join(__dirname, '..', '..', '..', '..', 'upload', 'pdf');

// Create directories if not exist
if (!fs.existsSync(imageUploadPath)) fs.mkdirSync(imageUploadPath, { recursive: true });
if (!fs.existsSync(pdfUploadPath)) fs.mkdirSync(pdfUploadPath, { recursive: true });

// Configure dynamic destination based on mimetype
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const mimeType = file.mimetype;

        if (mimeType === 'application/pdf') {
            cb(null, pdfUploadPath); // PDF goes to /upload/pdf
        } else if (mimeType.startsWith('image/')) {
            cb(null, imageUploadPath); // Images go to /upload/img
        } else {
            cb(new Error('Unsupported file type'), false);
        }
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

module.exports = {
    upload,
};
