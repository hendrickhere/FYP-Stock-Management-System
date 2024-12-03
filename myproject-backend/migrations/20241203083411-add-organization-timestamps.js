'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('organizations');
    
    const changes = [];
    
    if (!tableInfo.created_at) {
      changes.push(
        queryInterface.addColumn('organizations', 'created_at', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        })
      );
    }

    if (!tableInfo.updated_at) {
      changes.push(
        queryInterface.addColumn('organizations', 'updated_at', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW')
        })
      );
    }

    return Promise.all(changes);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('organizations', 'created_at'),
      queryInterface.removeColumn('organizations', 'updated_at')
    ]);
  }
};