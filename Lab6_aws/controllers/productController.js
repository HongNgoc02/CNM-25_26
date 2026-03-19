// controllers/productController.js
const Product = require('../models/productModel');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

exports.listProducts = async (req, res) => {
    try {
        // 1. Lấy toàn bộ data từ AWS về trước
        let products = await Product.getAll();
        
        // 2. Lấy từ khóa từ ô input (name="keyword")
        const keyword = req.query.keyword; 

        if (keyword) {
            const lowKey = keyword.toLowerCase();
            // Lọc mảng products dựa trên tên hoặc ID
            products = products.filter(p => 
                (p.name && p.name.toLowerCase().includes(lowKey)) || 
                (p.id && p.id.toLowerCase().includes(lowKey))
            );
        }

        // 3. Sắp xếp lại ID cho đẹp (như bạn yêu cầu lúc trước)
        products.sort((a, b) => a.id.localeCompare(b.id));

        // 4. TRUYỀN MẢNG ĐÃ LỌC (products) VÀO VIEW
        res.render('products/index', { 
            products: products, // Đây là mảng đã lọc
            keyword: keyword || '' 
        });

    } catch (err) {
        console.error("Lỗi tìm kiếm:", err);
        res.status(500).send("Lỗi hệ thống");
    }
};

exports.showCreateForm = (req, res) => res.render('products/create');

exports.createProduct = async (req, res) => {
    try {
        // Lấy các giá trị từ Form
        const { id, name, price, unit_in_stock } = req.body;
        
        // Kiểm tra nếu không có ID thì báo lỗi ngay tại đây cho dễ nhìn
        if (!id) {
            return res.status(400).send("Bạn chưa nhập mã sản phẩm (ID)");
        }

        const url_image = req.file ? `/uploads/${req.file.filename}` : "";

        const newProduct = {
            id: id, // Đây là giá trị bạn nhập từ Form
            name: name,
            price: Number(price),
            unit_in_stock: Number(unit_in_stock),
            url_image: url_image
        };

        // Gửi dữ liệu lên AWS
        await Product.save(newProduct);
        
        console.log("Đã lưu thành công sản phẩm:", id);
        res.redirect('/');
    } catch (err) {
        console.error("Lỗi AWS chi tiết:", err);
        res.status(500).send("Lỗi AWS: " + err.message);
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        
        // 1. Lấy thông tin sản phẩm để biết tên ảnh
        const product = await Product.getById(id);
        
        // 2. Tìm và xóa ảnh
        if (product && product.url_image) {
            const fileName = path.basename(product.url_image);
            const imagePath = path.join(__dirname, '../public/uploads', fileName);
            
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log("Đã dọn dẹp ảnh:", fileName);
            }
        }
        
        // 3. Xóa dữ liệu trên AWS
        await Product.delete(id);
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Lỗi khi xóa: " + err.message);
    }
};

// Xem chi tiết
// Hàm xem chi tiết sản phẩm
exports.getDetail = async (req, res) => {
    try {
        const id = req.params.id;
        // Gọi hàm getById từ Model để lấy 1 sản phẩm từ DynamoDB
        const product = await Product.getById(id);
        
        if (!product) {
            return res.status(404).send("Không tìm thấy sản phẩm này trên hệ thống.");
        }
        
        // Render ra trang detail.ejs và truyền dữ liệu sang
        res.render('products/detail', { product });
    } catch (err) {
        res.status(500).send("Lỗi khi tải chi tiết sản phẩm: " + err.message);
    }
};

// Hiển thị form Sửa
exports.showEditForm = async (req, res) => {
    try {
        // Lấy thông tin sản phẩm từ AWS dựa vào ID trên URL
        const product = await Product.getById(req.params.id);
        if (!product) return res.status(404).send("Không tìm thấy sản phẩm");
        
        // Render file edit.ejs và truyền dữ liệu product sang
        res.render('products/edit', { product });
    } catch (err) {
        res.status(500).send("Lỗi tải thông tin: " + err.message);
    }
};

// Xử lý khi nhấn nút "Cập nhật"
exports.updateProduct = async (req, res) => {
    try {
        const { id, name, price, unit_in_stock, old_image } = req.body;
        let url_image = old_image; // Mặc định giữ đường dẫn ảnh cũ

        // Nếu người dùng CÓ chọn upload ảnh mới
        if (req.file) {
            url_image = `/uploads/${req.file.filename}`; // Cập nhật đường dẫn mới vào DB

            // Bắt đầu quy trình xóa ảnh cũ
            if (old_image) {
                // path.basename('/uploads/abc.jpg') sẽ chỉ lấy 'abc.jpg'
                const oldFileName = path.basename(old_image); 
                // Ghép nối đường dẫn tuyệt đối an toàn trên Windows
                const oldImagePath = path.join(__dirname, '../public/uploads', oldFileName);

                // Kiểm tra xem file có tồn tại thật trong ổ cứng không rồi mới xóa
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                    console.log("Đã xóa vật lý ảnh cũ:", oldFileName);
                }
            }
        }

        const updatedData = {
            id: id,
            name: name,
            price: Number(price),
            unit_in_stock: Number(unit_in_stock),
            url_image: url_image
        };

        // Lưu vào AWS DynamoDB
        await Product.save(updatedData); 
        res.redirect('/');
    } catch (err) {
        console.error("Lỗi cập nhật:", err);
        res.status(500).send("Lỗi cập nhật sản phẩm: " + err.message);
    }
};