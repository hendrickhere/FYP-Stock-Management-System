'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('users', 'refresh_token', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    } catch (error) {
      console.log('Migration up error:', error);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('users', 'refresh_token');
    } catch (error) {
      // Column might not exist, which is fine in down migration
      console.log('Migration down error:', error);
    }
  }
};