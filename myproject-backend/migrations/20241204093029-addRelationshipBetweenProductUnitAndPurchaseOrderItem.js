'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("product_units", "purchase_order_item_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "purchase_order_items",
        key: "purchase_order_item_id"
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("product_units", "purchase_order_item_id");
  }
};
