const { Model, DataTypes, Sequelize } = require('sequelize');

class Shipment extends Model {
    static init(sequelize) {
        return super.init({
            shipment_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true,
            },
            sales_order_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "sales_orders",
                    key: "sales_order_id"
                }
            },
            tracking_number: {
                type: DataTypes.STRING(255),
                allowNull: true,
                defaultValue: ""
            },
            status: {
                type: DataTypes.INTEGER,
                allowNull: false,
            }
        }, {
            sequelize,
            modelName: 'Shipment',
            tableName: 'shipments',
            timestamps: false,
            underscored: true
        });
    }
}

module.exports = Shipment;