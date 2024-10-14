const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");
const { database_name } = require("../env");

const Invoice = sequelize.define("invoices", {
    invoice_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    sales_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "sales_orders",
            key: "sales_order_id"
        }
    },
    date_issued: {
        type: DataTypes.DATE,
        allowNull: false
    },
    due_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    total_amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
});

export default Invoice; 