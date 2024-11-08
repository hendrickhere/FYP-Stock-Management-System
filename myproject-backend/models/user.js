const { Model, DataTypes } = require('sequelize');

class User extends Model {
    static init(sequelize) {
        return super.init({
            user_id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            organization_id: {
                type: DataTypes.INTEGER,
                references: {
                    model: "organizations",
                    key: "organization_id"
                }
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password_hash: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            role: {
                type: DataTypes.STRING,
                allowNull: false
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
            refreshToken: {
                type: DataTypes.TEXT,
                allowNull: true,
                field: 'refresh_token'
            },
        }, {
            sequelize,
            modelName: 'User',
            tableName: 'users',
            timestamps: false,
            underscored: true
        });
    }
}

module.exports = User;