'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'product_units', 
      'product_units_serial_number_key'
    );

    await queryInterface.addConstraint('product_units', {
      fields: ['product_id', 'serial_number'],
      type: 'unique',
      name: 'product_units_product_serial_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint(
      'product_units', 
      'product_units_product_serial_unique'
    );

    await queryInterface.addConstraint('product_units', {
      fields: ['serial_number'],
      type: 'unique',
      name: 'product_units_serial_number_key'
    });
  }
};