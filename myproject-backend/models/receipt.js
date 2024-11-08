const { Model, DataTypes, Sequelize } = require('sequelize');

class Receipt extends Model {
    static init(sequelize) {
        return super.init({
            receipt_id: {
                primaryKey: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true
            },
            sales_order_id: {
                allowNull: false,
                type: DataTypes.INTEGER,
                references: {
                    model: "sales_orders",
                    key: "sales_order_id"
                }
            },
            date_issued: {
                type: DataTypes.DATE,
                allowNull: false
            },
            payment_method: {
                type: DataTypes.STRING,
                allowNull: false
            }
        }, {
            sequelize,
            modelName: 'Receipt',
            tableName: 'receipts',
            timestamps: false,
            underscored: true
        });
    }
}

module.exports = Receipt;