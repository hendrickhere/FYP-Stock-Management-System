'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('warranty_history', {
      history_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      warranty_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'warranties',
          key: 'warranty_id'
        },
        onDelete: 'CASCADE'
      },
      action_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      action_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      action_by: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      details: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('warranty_history', ['warranty_id'], {
      name: 'idx_warranty_history_warranty'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('warranty_history');
  }
};