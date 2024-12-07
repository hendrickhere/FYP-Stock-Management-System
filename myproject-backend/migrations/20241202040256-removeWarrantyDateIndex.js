'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('warranties', 'idx_warranties_dates');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addIndex('warranties', ['start_date', 'end_date'], {
      name: 'idx_warranties_dates'
    });
  }
};
