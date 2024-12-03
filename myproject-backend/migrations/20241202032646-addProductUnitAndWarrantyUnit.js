'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("warranties", "start_date");
    await queryInterface.removeColumn("warranties", "end_date");

    await queryInterface.addColumn("warranties", "duration", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 12, 
    });

    await queryInterface.createTable("product_units", {
      product_unit_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      serial_number: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "product_id",
        },
      },
      date_of_purchase: {
        type: Sequelize.DATE,
      },
      date_of_sale: {
        type: Sequelize.DATE,
      },
      warranty_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "warranties",
          key: "warranty_id",
        },
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
    await queryInterface.createTable('warranty_units', {
      warranty_unit_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      product_unit_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'product_units',
          key: 'product_unit_id'
        }
      },
      warranty_id: {
        type: Sequelize.INTEGER, 
        allowNull: false, 
        references: {
          model: "warranties", 
          key: "warranty_id"
        }
      },
      warranty_start: {
        type: Sequelize.DATE,
        allowNull: false
      },
      warranty_end: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'ACTIVE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Rollback: remove the new column and add back the old ones
    await queryInterface.removeColumn("warranties", "duration");

    await queryInterface.addColumn("warranties", "start_date", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("warranties", "end_date", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.dropTable("product_units");
    await queryInterface.dropTable('warranty_units');
  },
};