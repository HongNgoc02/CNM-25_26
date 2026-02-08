const ProductModel = require('../models/productModel');

exports.index = async (req, res) => {
    try {
        const data = await ProductModel.getAll();
        const products = data.Items ? data.Items.sort((a, b) => b.id - a.id) : [];
        res.render('index', { products: products });
    } catch (error) {
        res.status(500).send("Lỗi: " + error.message);
    }
};

exports.save = async (req, res) => {
    try {
        // 1. Thêm quantity vào dòng lấy dữ liệu
        const { name, price, quantity } = req.body; 
        
        const autoId = Date.now().toString();

        let imagePath = '';
        if (req.file) {
            imagePath = '/uploads/' + req.file.filename;
        }

        const newProduct = {
            id: autoId, 
            name: name,
            price: Number(price), 
            quantity: Number(quantity), // 2. Thêm dòng này để lưu số lượng (ép kiểu số)
            url_image: imagePath 
        };

        await ProductModel.create(newProduct);
        res.redirect('/'); 
    } catch (error) {
        res.status(500).send("Lỗi thêm: " + error.message);
    }
};

exports.delete = async (req, res) => {
    try {
        const id = req.body.id;
        await ProductModel.delete(id);
        res.redirect('/');
    } catch (error) {
        res.status(500).send("Lỗi xóa: " + error.message);
    }
};