const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const multer = require('multer'); // Thư viện upload
const path = require('path');

// Cấu hình nơi lưu ảnh và tên ảnh
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/uploads/'); // Lưu vào thư mục này
    },
    filename: function (req, file, cb) {
        // Đặt tên file = Thời gian hiện tại + đuôi file gốc (ví dụ: .jpg)
        // Để tránh trùng tên
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

router.get('/', productController.index);

// Thêm middleware upload.single('image') để xử lý file có name="image"
router.post('/save', upload.single('image'), productController.save);

router.post('/delete', productController.delete);

module.exports = router;