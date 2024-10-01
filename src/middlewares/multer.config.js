const multer = require('multer');
const { storage } = require('./cloudinary.config'); 
const path = require('path');

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

const upload = multer({
    storage: storage,  // Use Cloudinary storage
    limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB limit
    fileFilter: fileFilter
}).fields([
    { name: 'thumbnail', maxCount: 1 }, 
    { name: 'image1', maxCount: 1 },    
    { name: 'image2', maxCount: 1 },    
    { name: 'image3', maxCount: 1 },    
    { name: 'image4', maxCount: 1 }     
]);

module.exports = upload;
