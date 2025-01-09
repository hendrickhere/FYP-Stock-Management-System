'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('return_records', 'organization_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      references: {
        model: 'organizations',
        key: 'organization_id'
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('return_records', 'organization_id');
  }
};
