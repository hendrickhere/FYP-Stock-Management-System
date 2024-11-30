'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("appointments", "created_at", {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.fn("NOW"),
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("appointments", "created_at");
  }
};
