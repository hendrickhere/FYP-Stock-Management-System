const { Model, DataTypes } = require('sequelize');

class WarrantyNotification extends Model {
    static init(sequelize) {
        return super.init({
            notification_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            warranty_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "warranties",
                    key: "warranty_id"
                }
            },
            notification_type: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            notification_date: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            is_read: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        }, {
            sequelize,
            modelName: 'WarrantyNotification',
            tableName: 'warranty_notifications',
            timestamps: true,
            underscored: true,
            indexes: [
                {
                    name: 'idx_warranty_notification_warranty',
                    fields: ['warranty_id']
                },
                {
                    name: 'idx_warranty_notification_date',
                    fields: ['notification_date']
                },
                {
                    name: 'idx_warranty_notification_status',
                    fields: ['is_read']
                }
            ]
        });
    }
}

module.exports = WarrantyNotification;