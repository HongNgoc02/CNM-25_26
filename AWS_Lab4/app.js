// app.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// --- CẤU HÌNH AWS SDK V3 ---
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Khởi tạo Client
const dbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dbClient);
const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Cấu hình App
const app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.urlencoded({ extended: true })); // Để đọc dữ liệu từ Form

// Cấu hình Upload ảnh (Multer)
const storage = multer.memoryStorage(); // Lưu ảnh vào RAM tạm thời trước khi đẩy lên S3
const upload = multer({ storage: storage });

// --- CÁC ROUTE (CHỨC NĂNG) ---

// 1. Trang chủ - Hiện danh sách sản phẩm (READ)
app.get('/', async (req, res) => {
    try {
        const command = new ScanCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME
        });
        const response = await docClient.send(command);

        res.render('index', { products: response.Items || [] });
    } catch (error) {
        console.error("Lỗi lấy dữ liệu:", error);
        res.status(500).send("Lỗi Server: " + error.message);
    }
});

// 2. Xử lý Thêm sản phẩm (CREATE)
app.post('/add', upload.single('image'), async (req, res) => {
    try {
        const { name, price, quantity } = req.body;
        const imageFile = req.file;
        const newId = uuidv4();
        let imageUrl = '';

        // Nếu có ảnh -> Upload lên S3
        if (imageFile) {
            const imageKey = `${newId}-${imageFile.originalname}`;
            const uploadParams = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: imageKey,
                Body: imageFile.buffer,
                ContentType: imageFile.mimetype,
            };
            await s3Client.send(new PutObjectCommand(uploadParams));
            // Tạo URL truy cập ảnh
            imageUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageKey}`;
        }

        // Lưu thông tin vào DynamoDB
        const newItem = {
            id: newId,
            name: name,
            price: Number(price),
            quantity: Number(quantity),
            url_image: imageUrl
        };

        await docClient.send(new PutCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: newItem
        }));

        res.redirect('/'); // Quay về trang chủ
    } catch (error) {
        console.error("Lỗi thêm mới:", error);
        res.status(500).send(error.message);
    }
});

// 3. Xử lý Xóa sản phẩm (DELETE)
app.post('/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await docClient.send(new DeleteCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: { id: id }
        }));
        res.redirect('/');
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Chạy Server
app.listen(3000, () => {
    console.log('Server đang chạy tại http://localhost:3000');
});