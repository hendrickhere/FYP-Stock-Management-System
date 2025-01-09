const { Model, DataTypes, Sequelize } = require('sequelize');

class ProductUnitReturn extends Model {
    static init(sequelize) {
        return super.init({
            product_unit_return_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            product_unit_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'product_units',
                    key: 'product_unit_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            return_record_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'return_records',
                    key: 'return_record_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            refund_amount: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            refunded_tax: {
                type: DataTypes.FLOAT,
                allowNull: false,
            }
        }, {
            sequelize,
            modelName: 'ProductUnitReturn',
            tableName: 'product_unit_returns',
            timestamps: true,
            underscored: true
        });
    }
}

module.exports = ProductUnitReturn;

