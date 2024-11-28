'use strict';

/** 
 * This migration updates the products table to:
 * 1. Make dimension-related fields nullable for purchase order processing
 * 2. Convert price/cost fields to more precise decimal types
 * 3. Add appropriate default values for required fields
 * 4. Ensure data integrity during type conversions
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // We'll use a transaction to ensure all changes succeed or none do
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Step 1: Make dimension-related fields nullable
        // These fields may not be available when creating products from purchase orders
        await queryInterface.changeColumn('products', 'dimensions', {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, { transaction });

        await queryInterface.changeColumn('products', 'dimensions_unit', {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, { transaction });

        await queryInterface.changeColumn('products', 'weight_unit', {
          type: Sequelize.STRING(255),
          allowNull: true,
        }, { transaction });

        // Step 2: Convert price and cost to DECIMAL for precise currency calculations
        // Using USING clause to safely convert existing data
        await queryInterface.sequelize.query(`
          ALTER TABLE products 
          ALTER COLUMN price TYPE DECIMAL(10,2) USING price::numeric(10,2),
          ALTER COLUMN cost TYPE DECIMAL(10,2) USING cost::numeric(10,2)
        `, { transaction });

        // Step 3: Add default value for is_expiry_goods
        await queryInterface.changeColumn('products', 'is_expiry_goods', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }, { transaction });

        // Step 4: Ensure proper default timestamp behavior
        await queryInterface.sequelize.query(`
          ALTER TABLE products 
          ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
          ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP
        `, { transaction });

      } catch (error) {
        // Log the error for debugging
        console.error('Migration failed:', error);
        throw error; // Re-throw to trigger rollback
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert all changes in reverse order
    return queryInterface.sequelize.transaction(async (transaction) => {
      try {
        // Step 1: Revert dimension fields back to NOT NULL
        await queryInterface.changeColumn('products', 'dimensions', {
          type: Sequelize.STRING(255),
          allowNull: false,
        }, { transaction });

        await queryInterface.changeColumn('products', 'dimensions_unit', {
          type: Sequelize.STRING(255),
          allowNull: false,
        }, { transaction });

        await queryInterface.changeColumn('products', 'weight_unit', {
          type: Sequelize.STRING(255),
          allowNull: false,
        }, { transaction });

        // Step 2: Revert price and cost back to double precision
        await queryInterface.sequelize.query(`
          ALTER TABLE products 
          ALTER COLUMN price TYPE double precision USING price::double precision,
          ALTER COLUMN cost TYPE double precision USING cost::double precision
        `, { transaction });

        // Step 3: Remove default value from is_expiry_goods
        await queryInterface.changeColumn('products', 'is_expiry_goods', {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: null
        }, { transaction });

        // Step 4: Revert timestamp defaults
        await queryInterface.sequelize.query(`
          ALTER TABLE products 
          ALTER COLUMN created_at DROP DEFAULT,
          ALTER COLUMN updated_at DROP DEFAULT
        `, { transaction });

      } catch (error) {
        console.error('Migration rollback failed:', error);
        throw error;
      }
    });
  }
};
