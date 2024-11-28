'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('warranties', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'user_id' },
      defaultValue: 1 
    });

    await queryInterface.addColumn('warranties', 'last_modified_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'user_id' }
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('warranties', 'created_by');
    await queryInterface.removeColumn('warranties', 'last_modified_by');
  }
};