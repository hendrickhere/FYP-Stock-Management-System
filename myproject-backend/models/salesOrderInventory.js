const { Model, DataTypes, Sequelize } = require('sequelize');

class SalesOrderInventory extends Model {
    static init(sequelize) {
        return super.init({
            sales_order_item_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            sales_order_item_uuid: {
                type: DataTypes.UUID,
                defaultValue: Sequelize.fn('uuid_generate_v4'),
                unique: true,
            },
            sales_order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            product_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "products",
                    key: "product_id",
                },
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            price: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            discounted_price: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
            status_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        }, {
            sequelize,
            modelName: 'SalesOrderInventory',
            tableName: 'sales_order_items',
            timestamps: false,
            underscored: true,
            indexes: [
                        {
                            name: 'idx_sales_order_items_composite',
                            fields: ['sales_order_id', 'product_id'],
                            using: 'BTREE'
                        }
                    ]
        });
    }
}

module.exports = SalesOrderInventory;