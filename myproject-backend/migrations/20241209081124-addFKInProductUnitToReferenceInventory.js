'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("product_units", "source_type", {
      type: Sequelize.ENUM('PURCHASE_ORDER', 'INITIAL_STOCK'),
      allowNull: false,
      defaultValue: 'PURCHASE_ORDER'
    });

    await queryInterface.changeColumn("product_units", "purchase_order_item_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_order_items',
        key: 'purchase_order_item_id'
      }
    });

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
    await queryInterface.sequelize.query(`
      ALTER TABLE product_units 
      DROP CONSTRAINT check_source
    `);

    await queryInterface.changeColumn("product_units", "purchase_order_item_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'purchase_order_items',
        key: 'purchase_order_item_id'
      }
    });

    await queryInterface.removeColumn('product_units', 'source_type');
    await queryInterface.sequelize.query(`
      DROP TYPE enum_product_units_source_type
    `);
  }
};