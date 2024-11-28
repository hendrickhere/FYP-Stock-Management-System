'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('purchase_order_items', 'tax', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    });

    await queryInterface.changeColumn('purchase_order_items', 'discount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00
    });

    await queryInterface.changeColumn('purchase_order_items', 'total_price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('purchase_order_items', 'tax', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    await queryInterface.changeColumn('purchase_order_items', 'discount', {
      type: Sequelize.FLOAT,
      allowNull: true
    });

    await queryInterface.changeColumn('purchase_order_items', 'total_price', {
      type: Sequelize.FLOAT,
      allowNull: false
    });
  }
};
