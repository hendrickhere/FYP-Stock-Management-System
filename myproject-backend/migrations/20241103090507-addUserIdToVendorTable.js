'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn("vendors", "user_id", {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      defaultValue: null,
      referenes: {
        model: "users",
        key: "user_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn("vendors", "user_id");
  }
};
