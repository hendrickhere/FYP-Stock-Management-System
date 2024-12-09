'use strict';

const { DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("product_units", "sales_order_item_id", {
      type: Sequelize.INTEGER, 
      allowNull: true, 
      references: {
        model: "sales_order_items",
        key: "sales_order_item_id"
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE"
    });

    await queryInterface.addColumn("product_units", "is_sold", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down (queryInterface, Sequelize) {
   await queryInterface.removeColumn("product_units", "sales_order_item_id");
   await queryInterface.removeColumn("product_units", "is_sold")
  }
};
