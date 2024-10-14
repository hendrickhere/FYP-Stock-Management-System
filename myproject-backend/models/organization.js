const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");

const Organization = sequelize.define(
    "organizations",
    {
        organization_id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        }, 
        organization_uuid: {
            type: DataTypes.UUID, 
            defaultValue: sequelize.literal('uuid_generate_v4()'),
            unique: true, 
            allowNull: false,
        }, 
        organization_name: {
            type: DataTypes.STRING, 
            allowNull: false, 
        }, 
    },
    {
        timestamps: true
    },
)

module.exports = Organization;


