const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");

const Receipt = sequelize.define("receipts", {
    receipt_id: {
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true
    },
    sales_order_id:{
        allowNull: false,
        type: DataTypes.INTEGER,
        references:{
            model: "sales_orders",
            key: "sales_order_id"
        }
    },
    date_issued:{
        type: DataTypes.DATE,
        allowNull: false
    },
    payment_method: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

export default Receipt; 