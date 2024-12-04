'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, let's check if the columns already exist to avoid errors
    const tableInfo = await queryInterface.describeTable('sales_orders');
    const changes = [];
    
    // Check and add created_at if it doesn't exist
    if (!tableInfo.created_at) {
      changes.push(queryInterface.addColumn('sales_orders', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        // Using CURRENT_TIMESTAMP to match your other migrations' style
      }));
    }
    
    // Check and add updated_at if it doesn't exist
    if (!tableInfo.updated_at) {
      changes.push(queryInterface.addColumn('sales_orders', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        // Using CURRENT_TIMESTAMP to maintain consistency with your codebase
      }));
    }

    // Execute all necessary changes
    if (changes.length > 0) {
      return Promise.all(changes);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Reverting the changes if needed
    const tableInfo = await queryInterface.describeTable('sales_orders');
    const changes = [];

    // Only attempt to remove columns if they exist
    if (tableInfo.created_at) {
      changes.push(queryInterface.removeColumn('sales_orders', 'created_at'));
    }
    if (tableInfo.updated_at) {
      changes.push(queryInterface.removeColumn('sales_orders', 'updated_at'));
    }

    if (changes.length > 0) {
      return Promise.all(changes);
    }
  }
};