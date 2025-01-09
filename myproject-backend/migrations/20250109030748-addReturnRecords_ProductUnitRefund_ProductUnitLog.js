'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('return_records', {
      return_record_id: {
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
      return_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      refund_amount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      reason: {
        type: Sequelize.STRING,
        allowNull: false
      },
      processed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      refunded_tax: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
    await queryInterface.createTable('product_unit_returns', {
      product_unit_return_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      product_unit_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'product_units',
          key: 'product_unit_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      return_record_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'return_records',
          key: 'return_record_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      refund_amount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      refunded_tax: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
    await queryInterface.createTable('product_unit_logs', {
      product_unit_log_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      product_unit_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'product_units',
          key: 'product_unit_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status_change: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('product_unit_logs');
    await queryInterface.dropTable('product_unit_returns');
    await queryInterface.dropTable('return_records');
  }
};
