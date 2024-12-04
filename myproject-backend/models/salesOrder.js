const { Model, DataTypes, Sequelize } = require('sequelize');

class SalesOrder extends Model {
    static init(sequelize) {
        return super.init({
            sales_order_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            sales_order_uuid: {
                type: DataTypes.UUID,
                defaultValue: Sequelize.fn('uuid_generate_v4'),
                unique: true,
            },
            order_date_time: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            expected_shipment_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            payment_terms: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            delivery_method: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            status_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            subtotal: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            grand_total: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
            },
            discount_amount: {
                type: DataTypes.DECIMAL(10, 2), 
                allowNull: true, 
            },
            total_tax: {
                type: DataTypes.DECIMAL(10, 2), 
                allowNull: true,
            }
        }, {
            sequelize,
            modelName: 'SalesOrder',
            tableName: 'sales_orders',
            // Add timestamps for better tracking
            timestamps: true,
            createdAt: 'created_at',
            updatedAt: 'updated_at',
            underscored: true,
            // Add index configuration
            indexes: [
                {
                    name: 'idx_sales_orders_date',
                    fields: ['order_date_time'],
                    using: 'BRIN'
                }
            ]
        });
    }
}

module.exports = SalesOrder;