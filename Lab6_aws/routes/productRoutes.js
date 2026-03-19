const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const productController = require('../controllers/productController');

// Cấu hình Multer để lưu ảnh vào thư mục public/uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Định nghĩa các đường dẫn
router.get('/', productController.listProducts);
router.get('/create', productController.showCreateForm);
router.post('/create', upload.single('url_image'), productController.createProduct);
router.post('/delete/:id', productController.deleteProduct);
router.get('/detail/:id', productController.getDetail);
// Thêm route xem chi tiết (GET)
router.get('/detail/:id', productController.getDetail);
router.get('/edit/:id', productController.showEditForm);
router.post('/edit', upload.single('url_image'), productController.updateProduct);


module.exports = router;