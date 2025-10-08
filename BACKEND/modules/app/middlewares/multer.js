const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create directories if they don't exist
const createDirIfNotExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Create the upload directories
const uploadDir = path.join(process.cwd(), '..', 'upload', 'technician');
createDirIfNotExists(uploadDir);
createDirIfNotExists(path.join(uploadDir, 'before'));
createDirIfNotExists(path.join(uploadDir, 'after'));

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine destination based on field name
        let dest = uploadDir;
        if (file.fieldname === 'image_before_service') {
            dest = path.join(uploadDir, 'before');
        } else if (file.fieldname === 'image_after_service') {
            dest = path.join(uploadDir, 'after');
        }
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        // Create a unique filename with original extension
        // Use technician_id and task_id in the filename to make it more identifiable
        const technician_id = req.body.technician_id || 'unknown';
        const task_id = req.body.task_id || 'unknown';
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        
        // Create a more structured filename
        cb(null, `${file.fieldname}-task${task_id}-tech${technician_id}-${timestamp}${ext}`);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    console.log('📥 Incoming file upload:');
    console.log('➡️ fieldname:', file.fieldname);
    console.log('➡️ originalname:', file.originalname);
    console.log('➡️ mimetype:', file.mimetype);

    if (file.mimetype.startsWith('image/')) {
        console.log('✅ Accepted');
        cb(null, true);
    } else {
        console.error('❌ Rejected - Only image files are allowed!');
        cb(new Error('Only image files are allowed!'), false);
    }
};


// Create the multer instance with configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

module.exports = upload;