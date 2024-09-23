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
    { name: 'thumbnail', maxCount: 1 }, // Make sure the form field name is 'thumbnail'
    { name: 'images', maxCount: 3 }     // Make sure the form field name is 'images'
]);

module.exports = upload;
