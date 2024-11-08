const { Model, DataTypes, Sequelize } = require('sequelize');

class Invoice extends Model {
    static init(sequelize) {
        return super.init({
            invoice_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            sales_order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "sales_orders",
                    key: "sales_order_id"
                }
            },
            date_issued: {
                type: DataTypes.DATE,
                allowNull: false
            },
            due_date: {
                type: DataTypes.DATE,
                allowNull: false
            },
            total_amount: {
                type: DataTypes.FLOAT,
                allowNull: false
            },
        }, {
            sequelize,
            modelName: 'Invoice',
            tableName: 'invoices',
            timestamps: false,
            underscored: true
        });
    }
}

module.exports = Invoice;