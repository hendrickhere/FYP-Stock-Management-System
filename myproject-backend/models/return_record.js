const { Model, DataTypes, Sequelize } = require('sequelize');

class ReturnRecord extends Model {
    static init(sequelize) {
        return super.init({
            return_record_id: {
                primaryKey: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
            },
            sales_order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "sales_orders",
                    key: "sales_order_id",
                },
            },
            return_date: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            refund_amount: {
                type: DataTypes.FLOAT,
                allowNull: false,
            },
            reason: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            processed_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                },
            },
            refunded_tax: {
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
            modelName: 'ReturnRecord',
            tableName: 'return_records',
            timestamps: true,
            underscored: true
        });
    }
}

module.exports = ReturnRecord;