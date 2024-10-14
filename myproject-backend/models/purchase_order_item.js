const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");

const PurhcaseOrderItem = sequelize.define("purchase_order_items", {
    purchase_order_item_id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.INTEGER,
        autoIncrement: true
    },
    purchase_order_id: {
        type: DataTypes.INTEGER,
        references:{
            model: "purchase_orders",
            key: "purchase_order_id"
        }
    },
    product_id: {
        type: DataTypes.INTEGER,
        references: {
            model: "products",
            key: "product_id"
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tax: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    discount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    total_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
    }
});

export default PurhcaseOrderItem;