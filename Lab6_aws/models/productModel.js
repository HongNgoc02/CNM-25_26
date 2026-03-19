// models/productModel.js
const db = require('../config/dynamodb');
const { ScanCommand, PutCommand, GetCommand, DeleteCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const TABLE_NAME = "Products";

const Product = {
    getAll: async () => {
        const data = await db.send(new ScanCommand({ TableName: TABLE_NAME }));
        return data.Items;
    },
    getById: async (id) => {
        const data = await db.send(new GetCommand({ TableName: TABLE_NAME, Key: { id } }));
        return data.Item;
    },
    save: async (product) => {
        return await db.send(new PutCommand({ TableName: TABLE_NAME, Item: product }));
    },
    delete: async (id) => {
        return await db.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
    },
    update: async (id, updatedData) => {
    const params = {
        TableName: "Products",
        Item: { id, ...updatedData } // PutCommand sẽ ghi đè nếu trùng ID (cập nhật)
    };
    return await db.send(new PutCommand(params));
}
};

module.exports = Product;