const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");

const Appointment = sequelize.define("appointments", {
  appointment_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true,
  },
  appointment_sn: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  customer_id: {
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: "customers",
      key: "customer_id",
    },
  },
  service_type: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  appointment_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time_slot: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  technician: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  location: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports=Appointment; 
