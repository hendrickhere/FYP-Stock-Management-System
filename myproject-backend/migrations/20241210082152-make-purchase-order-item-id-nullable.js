'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First remove the check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE product_units 
      DROP CONSTRAINT check_source
    `);

    // Make the column nullable
    await queryInterface.changeColumn("product_units", "purchase_order_item_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_order_items',
        key: 'purchase_order_item_id'
      }
    });

    // Add back the check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE product_units 
      ADD CONSTRAINT check_source 
      CHECK (
        (source_type = 'PURCHASE_ORDER' AND purchase_order_item_id IS NOT NULL) OR 
        (source_type = 'INITIAL_STOCK' AND purchase_order_item_id IS NULL)
      )
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE product_units 
      DROP CONSTRAINT check_source
    `);

    // Make the column not nullable again
    await queryInterface.changeColumn("product_units", "purchase_order_item_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'purchase_order_items',
        key: 'purchase_order_item_id'
      }
    });

    // Add back the check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE product_units 
      ADD CONSTRAINT check_source 
      CHECK (
        (source_type = 'PURCHASE_ORDER' AND purchase_order_item_id IS NOT NULL) OR 
        (source_type = 'INITIAL_STOCK' AND purchase_order_item_id IS NULL)
      )
    `);
  }
};