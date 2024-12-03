const { Model, DataTypes, Sequelize } = require('sequelize');

class ProductUnit extends Model {
    static init(sequelize) {
        return super.init(
            {
                product_unit_id: {
                    type: DataTypes.INTEGER,
                    primaryKey: true,
                    allowNull: false,
                    autoIncrement: true,
                },
                serial_number: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true,
                },
                product_id: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    references: {
                        model: "products",
                        key: "product_id",
                    },
                },
                date_of_purchase: {
                    type: DataTypes.DATE,
                },
                date_of_sale: {
                    type: DataTypes.DATE,
                },
                warranty_id: {
                    type: DataTypes.INTEGER,
                    references: {
                        model: "warranties",
                        key: "warranty_id",
                    },
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
                modelName: "ProductUnit",
                tableName: "product_units",
                timestamps: false,
                underscored: true,
            }
        );
    }
}

module.exports = ProductUnit; 