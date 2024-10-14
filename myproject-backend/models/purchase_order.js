const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");

const PurchaseOrder = sequelize.define("purchase_orders", {
    purchase_order_id: {
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true
    },
    vendor_id:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: "vendors",
            key: "vendor_id"
        }
    },
    order_date: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    total_amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    status_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
    },
    delivered_date: {
        type: DataTypes.DATE,
        allowNull: false, 
    }
});

export default PurchaseOrder;