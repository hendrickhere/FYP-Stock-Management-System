"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      "purchase_order_items",
      "unregistered_quantity",
      {
        type: Sequelize.INTEGER,
        allowNull: false,
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.deleteColumn(
      "purchase_order_items",
      "unregistered_quantity"
    );
  },
};
