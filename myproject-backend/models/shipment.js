const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");

const Shipment = sequelize.define("shipments", {
    shipment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    sales_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "sales_orders",
            key: "sales_order_id"
        }
    },
    tracking_number:{
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: ""
    },
    status: {
        type: DataTypes.INTEGER,
        allowNull: false, 
    }
})

export default Shipment;