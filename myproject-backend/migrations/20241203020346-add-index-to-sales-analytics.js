'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add indices for optimizing analytics queries
    await queryInterface.addIndex(
      'sales_orders',
      ['order_date_time'],
      {
        name: 'idx_sales_orders_date',
        // Using BRIN index since time-series data tends to be naturally ordered
        using: 'BRIN'
      }
    );

    await queryInterface.addIndex(
      'sales_order_items',
      ['product_id', 'sales_order_id'],
      {
        name: 'idx_sales_order_items_composite'
      }
    );

    // Ensure order_date_time has proper default
    await queryInterface.changeColumn(
      'sales_orders',
      'order_date_time',
      {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the indices in reverse order
    await queryInterface.removeIndex('sales_order_items', 'idx_sales_order_items_composite');
    await queryInterface.removeIndex('sales_orders', 'idx_sales_orders_date');

    // Revert the column changes
    await queryInterface.changeColumn(
      'sales_orders',
      'order_date_time',
      {
        type: Sequelize.DATE,
        allowNull: false
      }
    );
  }
};