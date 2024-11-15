const { Model, DataTypes, Sequelize } = require('sequelize');
class Tax extends Model {
    static init(sequelize) {
        return super.init(
          {
            tax_id: {
              type: DataTypes.INTEGER,
              primaryKey: true,
              allowNull: false,
              autoIncrement: true,
            },
            tax_name: {
              type: DataTypes.STRING(50),
              allowNull: false,
            },
            tax_rate: {
              type: DataTypes.FLOAT,
              allowNull: false,
            },
            tax_status: {
              type: DataTypes.INTEGER,
              allowNull: false,
            },
            description: {
              type: DataTypes.STRING(255),
              allowNull: false,
            },
            organization_id: {
              type: DataTypes.INTEGER,
              allowNull: false,
              references: {
                model: "organizations",
                key: "organization_id",
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
            },
          },
          {
            sequelize,
            modelName: "Tax",
            tableName: "taxes",
            timestamps: true,
            underscored: true,
          }
        );
    }
}

module.exports = Tax;