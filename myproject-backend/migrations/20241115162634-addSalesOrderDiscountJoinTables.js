'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('sales_order_discounts', {
      sales_order_discount_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      sales_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'sales_orders',
          key: 'sales_order_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      discount_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'discounts',
          key: 'discount_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      applied_discount_rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Storing the rate at time of application'
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
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
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('sales_order_discounts');
  }
};
