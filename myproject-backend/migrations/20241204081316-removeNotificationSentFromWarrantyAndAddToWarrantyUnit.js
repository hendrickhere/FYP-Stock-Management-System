'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn("warranties", "notification_sent", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false, 
    });
    await queryInterface.addColumn("warranty_units", "notification_sent", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false, 
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn("warranties", "notification_sent", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false, 
    });
    await queryInterface.removeColumn("warranty_units", "notification_sent", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false, 
    });
  }
};
