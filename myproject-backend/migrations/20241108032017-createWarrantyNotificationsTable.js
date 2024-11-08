'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('warranty_notifications', {
      notification_id: {
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
      notification_type: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      notification_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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

    await queryInterface.addIndex('warranty_notifications', ['warranty_id'], {
      name: 'idx_warranty_notifications_warranty'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('warranty_notifications');
  }
};