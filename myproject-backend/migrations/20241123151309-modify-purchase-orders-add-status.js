'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add status enumeration
    await queryInterface.addColumn('purchase_orders', 'order_status', {
      type: Sequelize.ENUM('pending', 'delivered', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
      after: 'status_id'
    });

    // Add index for performance
    await queryInterface.addIndex('purchase_orders', ['order_status']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('purchase_orders', ['order_status']);
    await queryInterface.removeColumn('purchase_orders', 'order_status');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_purchase_orders_order_status;');
  }
};