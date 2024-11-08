const { Model, DataTypes, Sequelize } = require('sequelize');

class Customer extends Model {
  static init(sequelize) {
    return super.init({
      customer_id: {
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true, 
        allowNull: false, 
      }, 
      customer_uuid: {
        type: DataTypes.UUID, 
        defaultValue: Sequelize.fn('uuid_generate_v4'), 
      }, 
      customer_name: {
        type: DataTypes.STRING,
        allowNull: false,
      }, 
      customer_email: {
        type: DataTypes.STRING, 
        allowNull: false, 
      }, 
      customer_designation: {
        type: DataTypes.STRING, 
        allowNull: true, 
        defaultValue: "Mr"
      }, 
      customer_contact: {
        type: DataTypes.STRING, 
        allowNull: false,
      }, 
      customer_company: {
        type: DataTypes.STRING,
        allowNull: false,
      }, 
      billing_address: {
        type: DataTypes.STRING, 
        allowNull: false, 
      }, 
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id"
        },
      },
      shipping_address: {
        type: DataTypes.STRING, 
        allowNull: false, 
      },
      created_at: {
        type: DataTypes.DATE, 
        allowNull: false, 
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: DataTypes.DATE, 
        allowNull: false, 
        defaultValue: Sequelize.fn('NOW'),
      }
    }, {
      sequelize,
      modelName: 'Customer',
      tableName: 'customers',
      timestamps: true,
      underscored: true  // handle the created_at/updated_at field naming
    });
  }
}

module.exports = Customer;