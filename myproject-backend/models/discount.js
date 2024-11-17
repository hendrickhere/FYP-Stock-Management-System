const { Model, DataTypes, Sequelize } = require('sequelize');

class Discount extends Model {
   static init(sequelize) {
       return super.init({
           discount_id: {
               type: DataTypes.INTEGER,
               primaryKey: true,
               autoIncrement: true,
               allowNull: false,
           },
           discount_name: {
               type: DataTypes.STRING,
               allowNull: false,
           },
           discount_rate: {
               type: DataTypes.FLOAT,
               allowNull: false,
           },
           discount_status: {
               type: DataTypes.INTEGER,
               allowNull: false,
               defaultValue: 1,
           },
           description: {
               type: DataTypes.STRING,
               allowNull: true,
           },
           discount_start: {
               type: DataTypes.DATE,
               allowNull: false,
               defaultValue: Sequelize.fn('NOW'),
           },
           discount_end: {
               type: DataTypes.DATE,
               allowNull: true,
           },
           organization_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "organizations",
                key: "organization_id"
            }, 
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
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
           modelName: 'Discount',
           tableName: 'discounts',
           timestamps: true,
           underscored: true
       });
   }
}

module.exports = Discount;