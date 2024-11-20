'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('product_aliases', {
      alias_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      product_uuid: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'product_uuid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      alias_name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      source: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Source of this alias (e.g., invoice, manual entry)'
      },
      confidence: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 1.0
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    await queryInterface.addIndex('product_aliases', ['alias_name']);
    await queryInterface.addIndex('product_aliases', ['product_uuid']);
    await queryInterface.addIndex('product_aliases', ['alias_name', 'product_uuid'], {
      unique: true,
      name: 'unique_alias_per_product'
    });

    await queryInterface.createTable('match_history', {
      history_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      product_uuid: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'product_uuid'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      original_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Original name from invoice/document'
      },
      matched_name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Name of the matched product'
      },
      match_type: {
        type: Sequelize.ENUM('exact', 'fuzzy', 'manual'),
        allowNull: false
      },
      confidence: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      invoice_quantity: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      invoice_unit_price: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      invoice_total_price: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      is_correct: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',   
          key: 'user_id'
        }
      },
      review_notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      source_document: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Reference to source invoice/document'
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
    await queryInterface.addIndex('match_history', ['product_uuid']);
    await queryInterface.addIndex('match_history', ['original_name']);
    await queryInterface.addIndex('match_history', ['created_at']);    
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('product_aliases');
    await queryInterface.dropTable('match_history');
  }
};
