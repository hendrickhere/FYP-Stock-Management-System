const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");

const Product = sequelize.define(
    "products",
    {
        product_id:{
            type: DataTypes.INTEGER, 
            autoIncrement: true,
            primaryKey: true,
            allowNull: false, 
        },
        product_uuid : {
            type: DataTypes.UUID, 
            defaultValue: sequelize.literal('uuid_generate_v4()'),
            unique: true, 
        },
        product_name: {
            type: DataTypes.STRING,
            allowNull: false,   
        },
        product_stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        sku_number:{
            type: DataTypes.INTEGER,
            allowNull: true, 
        }, 
        unit: {
            type: DataTypes.STRING,
            allowNull: false,
        }, 
        brand: {
            type: DataTypes.STRING, 
            allowNull: true, 
        }, 
        dimensions: {
            type: DataTypes.STRING, 
            allowNull: false, 
        }, 
        dimensions_unit: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        manufacturer: {
            type: DataTypes.STRING, 
            allowNull: false,
        }, 
        weight: {
            type: DataTypes.FLOAT, 
            allowNull: true, 
        },
        weight_unit: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        is_expiry_goods: {
            type: DataTypes.BOOLEAN, 
            allowNull: false, 
        }, 
        expiry_date: {
            type: DataTypes.DATE, 
            allowNull: true, 
        },
        status_id:{
            type: DataTypes.INTEGER, 
            allowNull: false
        },
        price: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true, 
        },
        images: {
            type: DataTypes.JSONB,
            allowNull: true, 
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at', 
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'updated_at',
        },
    },
    {
        timestamps: true,
    }
)



module.exports = Product; 
