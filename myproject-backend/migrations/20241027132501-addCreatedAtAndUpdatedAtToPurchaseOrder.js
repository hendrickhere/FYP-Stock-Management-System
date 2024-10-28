'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("purchase_orders", "created_at", {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn("NOW"),
    });
    await queryInterface.addColumn("purchase_orders", "updated_at", {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn("NOW"),
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("purchase_orders", "created_at");
    await queryInterface.removeColumn("purchase_orders", "updated_at");
  }
};
