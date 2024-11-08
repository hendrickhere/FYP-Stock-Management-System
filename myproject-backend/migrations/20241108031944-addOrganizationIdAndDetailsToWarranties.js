'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('warranties');
    
    const columnsToAdd = [];

    // Check and add organization_id if it doesn't exist
    if (!tableInfo.organization_id) {
      columnsToAdd.push(
        queryInterface.addColumn('warranties', 'organization_id', {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'organization_id'
          },
          onDelete: 'CASCADE'
        })
      );
    }

    // Check and add notification_sent if it doesn't exist
    if (!tableInfo.notification_sent) {
      columnsToAdd.push(
        queryInterface.addColumn('warranties', 'notification_sent', {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        })
      );
    }

    // Check and add warranty_number if it doesn't exist
    if (!tableInfo.warranty_number) {
      columnsToAdd.push(
        queryInterface.addColumn('warranties', 'warranty_number', {
          type: Sequelize.STRING(50)
        })
      );
    }

    // Check and add description if it doesn't exist
    if (!tableInfo.description) {
      columnsToAdd.push(
        queryInterface.addColumn('warranties', 'description', {
          type: Sequelize.TEXT
        })
      );
    }

    // Add indexes if there are any new columns
    if (columnsToAdd.length > 0) {
      columnsToAdd.push(
        queryInterface.addIndex('warranties', ['organization_id'], {
          name: 'idx_warranties_organization'
        })
      );

      columnsToAdd.push(
        queryInterface.addIndex('warranties', ['start_date', 'end_date'], {
          name: 'idx_warranties_dates'
        })
      );
    }

    // Execute all pending changes
    if (columnsToAdd.length > 0) {
      await Promise.all(columnsToAdd);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('warranties', 'idx_warranties_organization');
      await queryInterface.removeIndex('warranties', 'idx_warranties_dates');
    } catch (error) {
      console.log('Indexes might not exist:', error.message);
    }

    const tableInfo = await queryInterface.describeTable('warranties');
    
    if (tableInfo.organization_id) {
      await queryInterface.removeColumn('warranties', 'organization_id');
    }
    if (tableInfo.notification_sent) {
      await queryInterface.removeColumn('warranties', 'notification_sent');
    }
    if (tableInfo.warranty_number) {
      await queryInterface.removeColumn('warranties', 'warranty_number');
    }
    if (tableInfo.description) {
      await queryInterface.removeColumn('warranties', 'description');
    }
  }
};