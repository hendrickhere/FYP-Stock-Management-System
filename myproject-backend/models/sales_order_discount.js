const { Model, DataTypes, Sequelize } = require('sequelize');

class SalesOrderDiscount extends Model {
   static init(sequelize) {
       return super.init({
           sales_order_discount_id: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
               allowNull: false,
           },
           sales_order_id: {
               type: DataTypes.INTEGER,
               allowNull: false,
               references: {
                   model: 'sales_orders',
                   key: 'sales_order_id'
               },
           },
           discount_id: {
               type: DataTypes.INTEGER,
               allowNull: false,
               references: {
                   model: 'discounts', 
                   key: 'discount_id'
               },
           },
           applied_discount_rate: {
               type: DataTypes.DECIMAL(10, 2),
               allowNull: false,
               comment: 'Storing the rate at time of application'
           },
           discount_amount: {
               type: DataTypes.DECIMAL(10, 2),
               allowNull: false,
               defaultValue: 0.00
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
           },
       }, {
           sequelize,
           modelName: 'SalesOrderDiscount',
           tableName: 'sales_order_discounts',
           timestamps: true,
           underscored: true
       });
   }
}

module.exports = SalesOrderDiscount;