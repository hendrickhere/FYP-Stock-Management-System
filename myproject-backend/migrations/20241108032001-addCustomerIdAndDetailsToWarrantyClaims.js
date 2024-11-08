'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('warranty_claims');
    
    const columnsToAdd = [];

    // Check and add customer_id if it doesn't exist
    if (!tableInfo.customer_id) {
      columnsToAdd.push(
        queryInterface.addColumn('warranty_claims', 'customer_id', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'customers',
            key: 'customer_id'
          },
          onDelete: 'CASCADE'
        })
      );
    }

    // Check and add claim_type if it doesn't exist
    if (!tableInfo.claim_type) {
      columnsToAdd.push(
        queryInterface.addColumn('warranty_claims', 'claim_type', {
          type: Sequelize.STRING(50)
        })
      );
    }

    // Check and add priority if it doesn't exist
    if (!tableInfo.priority) {
      columnsToAdd.push(
        queryInterface.addColumn('warranty_claims', 'priority', {
          type: Sequelize.STRING(20)
        })
      );
    }

    // Check and add assigned_to if it doesn't exist
    if (!tableInfo.assigned_to) {
      columnsToAdd.push(
        queryInterface.addColumn('warranty_claims', 'assigned_to', {
          type: Sequelize.INTEGER
        })
      );
    }

    // Add indexes if there are any new columns
    if (columnsToAdd.length > 0) {
      try {
        columnsToAdd.push(
          queryInterface.addIndex('warranty_claims', ['customer_id'], {
            name: 'idx_warranty_claims_customer'
          })
        );

        columnsToAdd.push(
          queryInterface.addIndex('warranty_claims', ['assigned_to'], {
            name: 'idx_warranty_claims_assignee'
          })
        );
      } catch (error) {
        console.log('Indexes might already exist:', error.message);
      }
    }

    // Execute all pending changes
    if (columnsToAdd.length > 0) {
      await Promise.all(columnsToAdd);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('warranty_claims', 'idx_warranty_claims_customer');
      await queryInterface.removeIndex('warranty_claims', 'idx_warranty_claims_assignee');
    } catch (error) {
      console.log('Indexes might not exist:', error.message);
    }

    const tableInfo = await queryInterface.describeTable('warranty_claims');
    
    if (tableInfo.customer_id) {
      await queryInterface.removeColumn('warranty_claims', 'customer_id');
    }
    if (tableInfo.claim_type) {
      await queryInterface.removeColumn('warranty_claims', 'claim_type');
    }
    if (tableInfo.priority) {
      await queryInterface.removeColumn('warranty_claims', 'priority');
    }
    if (tableInfo.assigned_to) {
      await queryInterface.removeColumn('warranty_claims', 'assigned_to');
    }
  }
};