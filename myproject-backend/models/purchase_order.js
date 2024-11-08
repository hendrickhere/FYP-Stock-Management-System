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