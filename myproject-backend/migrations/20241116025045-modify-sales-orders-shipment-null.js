const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('sales_orders', 'expected_shipment_date', {
      type: DataTypes.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('sales_orders', 'expected_shipment_date', {
      type: DataTypes.DATE,
      allowNull: false
    });
  }
};