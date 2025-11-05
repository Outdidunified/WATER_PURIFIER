const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Folder to store uploaded .bin files
const uploadDir = path.join(__dirname, '../firmware');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer for binary uploads
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// POST /api/upload
// router.post('/upload', upload.single('binFile'), async (req, res) => {
//     try {
//         const fileName = req.file.filename;
//         const fileURL = `${req.protocol}://${req.hostname}:${process.env.PORT || 3030}/firmware/${encodeURIComponent(fileName)}`;

//         res.json({ success: true, url: fileURL });
//     } catch (err) {
//         console.error('Upload error:', err);
//         res.status(500).json({ error: err.message });
//     }
// });

router.post('/upload', upload.single('binFile'), async (req, res) => {
    try {
        const fileName = req.file.filename;
        const baseURL = `${req.protocol}://${req.hostname}:${process.env.PORT || 3030}`;
        const fileURL = `${baseURL}/firmware/${encodeURIComponent(fileName)}`;
        const viewURL = `${baseURL}/view/${encodeURIComponent(fileName)}`;

        res.json({ success: true, fileURL, viewURL });
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
