'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("sales_orders", "organization_id", {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      defaultValue: null,
      referenes: {
        model: "organizations",
        key: "organization_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("sales_orders", "organization_id");
  }
};
