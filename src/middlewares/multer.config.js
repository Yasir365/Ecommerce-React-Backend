const multer = require('multer');
const path = require('path');

// Set storage engine
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Directory to save images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // File name convention
    }
});

// File validation (optional)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);

    if (extName && mimeType) {
        return cb(null, true);
    } else {
        cb('Error: Images only!');
    }
};

// Initialize multer with storage and file filter
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
    fileFilter: fileFilter
}).fields([
    { name: 'thumbnail', maxCount: 1 }, // Thumbnail field
    { name: 'image1', maxCount: 1 },    // Image field 1
    { name: 'image2', maxCount: 1 },    // Image field 2
    { name: 'image3', maxCount: 1 }     // Image field 3
    { name: 'image4', maxCount: 1 }     // Image field 3
]);

module.exports = upload;
