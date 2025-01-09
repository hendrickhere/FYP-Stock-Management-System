'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('organizations', 'organization_address', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Default Address' // Remove this after migration if needed
    });

    await queryInterface.addColumn('organizations', 'organization_email', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'default@email.com' // Remove this after migration if needed
    });

    await queryInterface.addColumn('organizations', 'organization_bank', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Default Bank' // Remove this after migration if needed
    });

    await queryInterface.addColumn('organizations', 'orgnaization_account_number', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Default Account' // Remove this after migration if needed
    });

    await queryInterface.addColumn('organizations', 'organization_routing_number', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'Default Routing' // Remove this after migration if needed
    });
    await queryInterface.addColumn('sales_orders', 'is_sales_order_edited', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('organizations', 'organization_address');
    await queryInterface.removeColumn('organizations', 'organization_email');
    await queryInterface.removeColumn('organizations', 'organization_bank');
    await queryInterface.removeColumn('organizations', 'orgnaization_account_number');
    await queryInterface.removeColumn('organizations', 'organization_routing_number');
    await queryInterface.removeColumn('sales_orders', 'is_sales_order_edited');
  }
};
