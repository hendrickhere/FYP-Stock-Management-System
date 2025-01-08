'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('warranty_claims', 'warranty_unit_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'warranty_units',
        key: 'warranty_unit_id'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('warranty_claims', 'warranty_unit_id');
  }
};
