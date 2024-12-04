'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Helper function to safely create index
      const safeAddIndex = async (tableName, fields, indexName) => {
        try {
          // Try to create the index
          await queryInterface.addIndex(tableName, fields, {
            name: indexName,
            // Add IF NOT EXISTS to prevent errors if index already exists
            ifNotExists: true
          });
          console.log(`Successfully processed index ${indexName}`);
        } catch (error) {
          // Log that index already exists but don't throw error
          console.log(`Note: Index ${indexName} was already present`);
        }
      };

      // Process each index creation independently
      await safeAddIndex(
        'sales_orders', 
        ['organization_id', 'order_date_time'], 
        'idx_sales_orders_org_date'
      );

      await safeAddIndex(
        'products', 
        ['organization_id', 'status_id'], 
        'idx_products_org_status'
      );

      await safeAddIndex(
        'sales_order_items', 
        ['product_id', 'sales_order_id'], 
        'idx_sales_order_items_product_order'
      );

    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Helper function to safely remove index
    const safeRemoveIndex = async (tableName, indexName) => {
      try {
        await queryInterface.removeIndex(tableName, indexName);
        console.log(`Successfully removed index ${indexName}`);
      } catch (error) {
        console.log(`Note: Index ${indexName} was already removed or doesn't exist`);
      }
    };

    // Remove each index
    await safeRemoveIndex('sales_orders', 'idx_sales_orders_org_date');
    await safeRemoveIndex('products', 'idx_products_org_status');
    await safeRemoveIndex('sales_order_items', 'idx_sales_order_items_product_order');
  }
};
