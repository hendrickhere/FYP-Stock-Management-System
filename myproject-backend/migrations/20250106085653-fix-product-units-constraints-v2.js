'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // First, temporarily drop all related constraints
      await queryInterface.sequelize.query(
        `DO $$ 
         BEGIN
           -- Drop foreign key constraint
           IF EXISTS (
             SELECT 1 
             FROM information_schema.table_constraints 
             WHERE constraint_name = 'product_units_purchase_order_item_id_fkey'
           ) THEN
             ALTER TABLE product_units 
             DROP CONSTRAINT product_units_purchase_order_item_id_fkey;
           END IF;
           
           -- Drop check constraints
           IF EXISTS (
             SELECT 1 
             FROM information_schema.check_constraints 
             WHERE constraint_name = 'check_source'
           ) THEN
             ALTER TABLE product_units 
             DROP CONSTRAINT check_source;
           END IF;
         END $$;`,
        { transaction }
      );

      // Modify the column to explicitly allow NULL
      await queryInterface.sequelize.query(
        `ALTER TABLE product_units 
         ALTER COLUMN purchase_order_item_id DROP NOT NULL;`,
        { transaction }
      );

      // Add back the foreign key with NULL allowed
      await queryInterface.sequelize.query(
        `ALTER TABLE product_units 
         ADD CONSTRAINT product_units_purchase_order_item_id_fkey 
         FOREIGN KEY (purchase_order_item_id) 
         REFERENCES purchase_order_items(purchase_order_item_id);`,
        { transaction }
      );

      // Add back the check constraint
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
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Revert changes in reverse order
      await queryInterface.sequelize.query(
        `ALTER TABLE product_units DROP CONSTRAINT IF EXISTS check_source;`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE product_units DROP CONSTRAINT IF EXISTS product_units_purchase_order_item_id_fkey;`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE product_units 
         ALTER COLUMN purchase_order_item_id SET NOT NULL;`,
        { transaction }
      );

      await queryInterface.sequelize.query(
        `ALTER TABLE product_units 
         ADD CONSTRAINT product_units_purchase_order_item_id_fkey 
         FOREIGN KEY (purchase_order_item_id) 
         REFERENCES purchase_order_items(purchase_order_item_id);`,
        { transaction }
      );
    });
  }
};