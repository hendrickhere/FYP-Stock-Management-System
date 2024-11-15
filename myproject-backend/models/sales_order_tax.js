const { Model, DataTypes, Sequelize } = require('sequelize');

class SalesOrderTax extends Model {
    static init(sequelize) {
        return super.init({
            sales_order_tax_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            sales_order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'sales_orders',
                    key: 'sales_order_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            tax_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'taxes',
                    key: 'tax_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            },
            applied_tax_rate: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                comment: 'Storing the rate at time of application'
            },
            tax_amount: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0.00
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        }, {
            sequelize,
            modelName: 'SalesOrderTax',
            tableName: 'sales_order_taxes',
            timestamps: true,
            underscored: true
        });
    }
}

module.exports = SalesOrderTax;

