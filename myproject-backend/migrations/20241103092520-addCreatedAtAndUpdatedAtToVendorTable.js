'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("vendors", "created_at", {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn("NOW"),
    });
    await queryInterface.addColumn("vendors", "updated_at", {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn("NOW"),
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("vendors", "created_at");
    await queryInterface.removeColumn("vendors", "updated_at");
  }
};
