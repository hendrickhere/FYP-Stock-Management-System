'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.renameColumn('organizations', 'orgnaization_account_number', 'organization_account_number');

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameColumn('organizations', 'organization_account_number', 'orgnaization_account_number');

  }
};
