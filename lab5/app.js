const express = require('express');
const bodyParser = require('body-parser');
const productRoutes = require('./routes/productRoutes');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', './views');

// Cấu hình thư mục Public chứa ảnh upload
app.use(express.static('public')); 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/', productRoutes);

app.listen(PORT, () => {
    console.log(`Server chạy tại: http://localhost:${PORT}`);
});