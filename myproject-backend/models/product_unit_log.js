const { Model, DataTypes, Sequelize } = require('sequelize');

class ProductUnitLog extends Model {
    static init(sequelize) {
        return super.init({
            product_unit_log_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            product_unit_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'product_units',
                    key: 'product_unit_id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            status_change: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            changed_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                },
            }
        }, {
            sequelize,
            modelName: 'ProductUnitLog',
            tableName: 'product_unit_logs',
            timestamps: true,
            underscored: true
        });
    }
}

module.exports = ProductUnitLog;

