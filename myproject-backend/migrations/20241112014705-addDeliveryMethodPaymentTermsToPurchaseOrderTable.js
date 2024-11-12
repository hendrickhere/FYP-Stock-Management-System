'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("purchase_orders", "delivery_method", {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn("purchase_orders", "payment_terms", {
      type: Sequelize.DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("purchase_orders", "delivery_method");
    await queryInterface.removeColumn("purchase_orders", "payment_terms");
  }
};
