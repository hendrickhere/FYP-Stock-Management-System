const { Model, DataTypes, Sequelize } = require('sequelize');

class ProductAlias extends Model {
    static init(sequelize) {
        return super.init({
            alias_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            product_uuid: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'product_uuid'
                }
            },
            alias_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            source: {
                type: DataTypes.STRING,
                allowNull: true
            },
            confidence: {
                type: DataTypes.FLOAT,
                allowNull: false,
                defaultValue: 1.0
            },
            is_verified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        }, {
            sequelize,
            modelName: 'ProductAlias',
            tableName: 'product_aliases',
            timestamps: true,
            underscored: true
        });
    }
}

module.exports = ProductAlias;