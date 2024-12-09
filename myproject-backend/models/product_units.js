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
              allowNull: true,
              type: DataTypes.INTEGER,
              references: {
                model: "warranties",
                key: "warranty_id",
              },
            },
            purchase_order_item_id: {
              type: DataTypes.INTEGER,
              allowNull: false,
              references: {
                model: "purchase_order_items",
                key: "purchase_order_item_id",
              },
            },
            sales_order_item_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "sales_order_items",
                    key: "sales_order_item_id",
                },
                onDelete: "CASCADE",
                onUpdate: "CASCADE",
            },
            is_sold: {
              type: DataTypes.BOOLEAN,
              allowNull: false,
              defaultValue: false,
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
            modelName: "ProductUnit",
            tableName: "product_units",
            timestamps: false,
            underscored: true,
          }
        );
    }
}

module.exports = ProductUnit; 