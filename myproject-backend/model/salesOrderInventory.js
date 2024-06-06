const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");

const SalesOrderInventory = sequelize.define(
    "sales_order_inventory",
    {
        sales_order_inventory_id: {
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true, 
            allowNull: false,
        }, 
        sales_order_inventory_uuid: {
            type: DataTypes.UUID, 
            defaultValue: sequelize.literal('uuid_generate_v4()'),
            unique: true, 
        },
        sales_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          inventory_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
          },
          quantity: {
            type: DataTypes.INTEGER,
            allowNull: false, 
          }
    }, {
        timestamps: false,
    }
)




module.exports = SalesOrderInventory; 