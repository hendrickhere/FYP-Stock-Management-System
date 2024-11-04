const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");

const Vendor = sequelize.define("vendors", {
  vendor_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true,
  },
  vendor_sn: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  vendor_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  contact_person: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone_number: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  status_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "users",
      key: "user_id",
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: "created_at",
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: "updated_at",
  },
});

module.exports = Vendor;
