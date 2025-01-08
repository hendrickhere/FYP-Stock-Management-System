'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('warranty_claims', 'organization_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'organizations',
        key: 'organization_id'
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('warranty_claims', 'organization_id');
  }
};
