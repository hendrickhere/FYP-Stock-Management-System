const { Model, DataTypes, Sequelize } = require('sequelize');

class WarrantyUnit extends Model {
    static init(sequelize) {
        return super.init(
            {
                warranty_unit_id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                },
                product_unit_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: "product_units",
                        key: "product_unit_id",
                    },
                },
                warranty_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: "warranties",
                        key: "warranty_id",
                    },
                },
                warranty_start: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                warranty_end: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                status: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    defaultValue: 'ACTIVE',
                },
                created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.fn("NOW"),
                },
                updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.fn("NOW"),
                }
            },
            {
                sequelize,
                modelName: "WarrantyUnit",
                tableName: "warranty_units",
                timestamps: false,
                underscored: true,
            }
        );
    }
}

module.exports = WarrantyUnit; 