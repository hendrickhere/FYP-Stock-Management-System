const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");
const User = require("./user.js");

const Customer = sequelize.define(
    "customers",
    {
        customer_id: {
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true, 
            allowNull: false, 
        }, 
        customer_uuid: {
            type: DataTypes.UUID, 
            defaultValue: sequelize.literal('uuid_generate_v4()'),
        }, 
        customer_name: {
            type: DataTypes.STRING,
            allowNull: false,
        }, 
        customer_email: {
            type: DataTypes.STRING, 
            allowNull: false, 
        }, 
        customer_designation: {
            type: DataTypes.STRING, 
            allowNull: true, 
            defaultValue: "Mr"
        }, 
        customer_contact: {
            type: DataTypes.STRING, 
            allowNull: false,
        }, 
        customer_company: {
            type: DataTypes.STRING,
            allowNull: false,
        }, 
        billing_address: {
            type: DataTypes.STRING, 
            allowNull: false, 
        }, 
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "users",
                key: "user_id"
            },
        },
        shipping_address: {
            type: DataTypes.STRING, 
            allowNull: false, 
        },
        createdAt: {
            field: "created_at",
            type: DataTypes.DATE, 
            allowNull: false, 
            defaultValue: DataTypes.NOW,
        },
        updatedAt: {
            field: "updated_at",
            type: DataTypes.DATE, 
            allowNull: false, 
            defaultValue: DataTypes.NOW,
        }
    },
    {
        timestamps: true,
    }
)


module.exports = Customer; 