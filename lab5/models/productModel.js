const { docClient } = require('../config/db');
const TABLE_NAME = "Products"; 

const ProductModel = {
    // Lấy toàn bộ danh sách
    getAll: async () => {
        const params = { TableName: TABLE_NAME };
        return await docClient.scan(params).promise();
    },

    // Thêm hoặc Cập nhật (Nếu trùng ID nó sẽ đè lên -> Update)
    create: async (item) => {
        const params = {
            TableName: TABLE_NAME,
            Item: item
        };
        return await docClient.put(params).promise();
    },

    // Xóa theo ID
    delete: async (id) => {
        const params = {
            TableName: TABLE_NAME,
            Key: {
                "id": id
            }
        };
        return await docClient.delete(params).promise();
    }
};

module.exports = ProductModel;