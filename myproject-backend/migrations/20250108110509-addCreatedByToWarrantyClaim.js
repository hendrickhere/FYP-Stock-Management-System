'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('warranty_claims', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id'
      }
    });
    await queryInterface.addColumn('warranty_claims', 'created_at', {
      type: Sequelize.DATE,
      allowNull: false,
    });
    await queryInterface.addColumn('warranty_claims', 'updated_at', {
      type: Sequelize.DATE,
      allowNull: false,
    });
    await queryInterface.addColumn('warranty_claims', 'last_modified_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'user_id'
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('warranty_claims', 'created_by');
    await queryInterface.removeColumn('warranty_claims', 'created_at');
    await queryInterface.removeColumn('warranty_claims', 'updated_at');
    await queryInterface.removeColumn('warranty_claims', 'last_modified_by');
  }
};
