const { Model, DataTypes, Sequelize } = require('sequelize');

class PurchaseOrderItem extends Model {
    static init(sequelize) {
        return super.init({
            purchase_order_item_id: {
                primaryKey: true,
                allowNull: false,
                type: DataTypes.INTEGER,
                autoIncrement: true
            },
            purchase_order_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: "purchase_orders",
                    key: "purchase_order_id"
                }
            },
            product_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: "products",
                    key: "product_id"
                }
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            tax: {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: 0
            },
            discount: {
                type: DataTypes.FLOAT,
                allowNull: true,
                defaultValue: 0
            },
            total_price: {
                type: DataTypes.FLOAT,
                allowNull: false,
            }
        }, {
            sequelize,
            modelName: 'PurchaseOrderItem',
            tableName: 'purchase_order_items',
            timestamps: false,
            underscored: true
        });
    }
}

module.exports = PurchaseOrderItem;