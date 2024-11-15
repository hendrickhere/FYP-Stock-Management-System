const { Model, DataTypes, Sequelize } = require('sequelize');

class PurchaseOrder extends Model {
    static init(sequelize) {
        return super.init({
            purchase_order_id: {
                primaryKey: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
            },
            vendor_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "vendors",
                    key: "vendor_id",
                },
            },
            order_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            total_amount: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            status_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
            },
            delivered_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            delivery_method: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            payment_terms: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                },
            },
            subtotal: {
                type: DataTypes.DECIMAL(10,2),
                allowNull: false,
                defaultValue: 0.00
            },
            total_tax: {
                type: DataTypes.DECIMAL(10,2),
                allowNull: false,
                defaultValue: 0.00
            },
            grand_total: {
                type: DataTypes.DECIMAL(10,2),
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
            modelName: 'PurchaseOrder',
            tableName: 'purchase_orders',
            timestamps: true,
            underscored: true
        });
    }
}

module.exports = PurchaseOrder;