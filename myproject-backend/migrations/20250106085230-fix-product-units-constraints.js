'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // We need to wrap all operations in a transaction
    return queryInterface.sequelize.transaction(async (transaction) => {
      // First drop the duplicate foreign key constraints
      await queryInterface.sequelize.query(
        `ALTER TABLE product_units 
         DROP CONSTRAINT IF EXISTS product_units_purchase_order_item_id_fkey1,
         DROP CONSTRAINT IF EXISTS product_units_purchase_order_item_id_fkey2;`,
        { transaction }
      );

      // Drop the original foreign key constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE product_units 
         DROP CONSTRAINT IF EXISTS product_units_purchase_order_item_id_fkey;`,
        { transaction }
      );

      // Add back the single foreign key constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE product_units 
         ADD CONSTRAINT product_units_purchase_order_item_id_fkey 
         FOREIGN KEY (purchase_order_item_id) 
         REFERENCES purchase_order_items(purchase_order_item_id);`,
        { transaction }
      );

      // Recreate the check constraint
      await queryInterface.sequelize.query(
        `ALTER TABLE product_units DROP CONSTRAINT IF EXISTS check_source;`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE product_units 
         ADD CONSTRAINT check_source 
         CHECK (
           (source_type = 'PURCHASE_ORDER' AND purchase_order_item_id IS NOT NULL) OR 
           (source_type = 'INITIAL_STOCK' AND purchase_order_item_id IS NULL)
         );`,
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert changes in case of rollback
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Drop the new constraints
      await queryInterface.sequelize.query(
        `ALTER TABLE product_units 
         DROP CONSTRAINT IF EXISTS check_source,
         DROP CONSTRAINT IF EXISTS product_units_purchase_order_item_id_fkey;`,
        { transaction }
      );

      // Recreate the original constraints
      await queryInterface.sequelize.query(
        `ALTER TABLE product_units 
         ADD CONSTRAINT product_units_purchase_order_item_id_fkey 
         FOREIGN KEY (purchase_order_item_id) 
         REFERENCES purchase_order_items(purchase_order_item_id),
         ADD CONSTRAINT product_units_purchase_order_item_id_fkey1
         FOREIGN KEY (purchase_order_item_id) 
         REFERENCES purchase_order_items(purchase_order_item_id),
         ADD CONSTRAINT product_units_purchase_order_item_id_fkey2
         FOREIGN KEY (purchase_order_item_id) 
         REFERENCES purchase_order_items(purchase_order_item_id);`,
        { transaction }
      );
    });
  }
};