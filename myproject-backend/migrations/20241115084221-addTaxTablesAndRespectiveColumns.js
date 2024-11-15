'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('taxes', {
      tax_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      tax_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      tax_rate: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      tax_status: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      description: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.addColumn('sales_orders', 'subtotal', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      after: 'status_id'
    });

    await queryInterface.addColumn('sales_orders', 'total_tax', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      after: 'subtotal'
    });

    await queryInterface.addColumn('sales_orders', 'grand_total', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      after: 'total_tax'
    });
    await queryInterface.addColumn('purchase_orders', 'subtotal', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      after: 'status_id'
    });

    await queryInterface.addColumn('purchase_orders', 'total_tax', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      after: 'subtotal'
    });

    await queryInterface.addColumn('purchase_orders', 'grand_total', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      after: 'total_tax'
    });

    await queryInterface.createTable('sales_order_taxes', {
      sales_order_tax_id: {
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
      tax_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'taxes',
          key: 'tax_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      applied_tax_rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Storing the rate at time of application'
      },
      tax_amount: {
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

    await queryInterface.addIndex('sales_order_taxes', ['sales_order_id']);
    await queryInterface.addIndex('sales_order_taxes', ['tax_id']);

    await queryInterface.createTable('purchase_order_taxes', {
      purchase_order_tax_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      purchase_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'purchase_orders',
          key: 'purchase_order_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      tax_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'taxes',
          key: 'tax_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      applied_tax_rate: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Storing the rate at time of application'
      },
      tax_amount: {
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

    await queryInterface.addIndex('purchase_order_taxes', ['purchase_order_id']);
    await queryInterface.addIndex('purchase_order_taxes', ['tax_id']);
  },



  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('taxes');
    await queryInterface.dropTable('sales_order_taxes');
    await queryInterface.dropTable('purchase_order_taxes');
    await queryInterface.removeColumn('sales_orders', 'subtotal');
    await queryInterface.removeColumn('sales_orders', 'total_tax');
    await queryInterface.removeColumn('sales_orders', 'grand_total');
  }
};