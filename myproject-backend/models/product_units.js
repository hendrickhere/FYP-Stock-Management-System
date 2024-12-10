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
            // Add the new source_type field
            source_type: {
              type: DataTypes.ENUM('PURCHASE_ORDER', 'INITIAL_STOCK'),
              allowNull: false,
              defaultValue: 'PURCHASE_ORDER'
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
              allowNull: true,  
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
            indexes: [
              {
                unique: true,
                fields: ['product_id', 'serial_number'],
                name: 'product_units_product_serial_unique'
              }
            ],
            // Add model validations
            validate: {
              sourceTypeCheck() {
                if (this.source_type === 'PURCHASE_ORDER' && !this.purchase_order_item_id) {
                  throw new Error('Purchase order item ID is required when source type is PURCHASE_ORDER');
                }
                if (this.source_type === 'INITIAL_STOCK' && this.purchase_order_item_id !== null) {
                  throw new Error('Purchase order item ID must be null when source type is INITIAL_STOCK');
                }
              }
            }
          }
        );
    }
}

module.exports = ProductUnit;