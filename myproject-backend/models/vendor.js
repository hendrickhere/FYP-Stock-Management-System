const { Model, DataTypes, Sequelize } = require('sequelize');

class Vendor extends Model {
    static init(sequelize) {
        return super.init({
            vendor_id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true,
            },
            vendor_sn: {
                type: DataTypes.STRING(50),
                allowNull: false,
            },
            vendor_name: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            contact_person: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            phone_number: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            address: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            status_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 1,
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
            modelName: 'Vendor',
            tableName: 'vendors',
            timestamps: true,
            underscored: true
        });
    }
}

module.exports = Vendor;