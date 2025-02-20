const { Model, DataTypes, Sequelize } = require('sequelize');

class Warranty extends Model {
    static init(sequelize) {
        return super.init(
          {
            warranty_id: {
              primaryKey: true,
              allowNull: false,
              autoIncrement: true,
              type: DataTypes.INTEGER,
            },
            product_id: {
              type: DataTypes.INTEGER,
              allowNull: false,
              references: {
                model: "products",
                key: "product_id",
              },
            },
            organization_id: {
              type: DataTypes.INTEGER,
              allowNull: false,
              references: {
                model: "organizations",
                key: "organization_id",
              },
            },
            created_by: {
              type: DataTypes.INTEGER,
              allowNull: false,
              references: {
                model: "users",
                key: "user_id",
              },
            },
            last_modified_by: {
              type: DataTypes.INTEGER,
              allowNull: true,
              references: {
                model: "users",
                key: "user_id",
              },
            },
            warranty_type: {
              type: DataTypes.INTEGER,
              allowNull: false,
              validate: {
                isIn: [[1, 2]], // 1 for consumer, 2 for manufacturer
              },
            },
            consumer: {
              type: DataTypes.VIRTUAL,
              get() {
                return this.warranty_type === 1;
              },
            },
            manufacturer: {
              type: DataTypes.VIRTUAL,
              get() {
                return this.warranty_type === 2;
              },
            },
            warranty_number: {
              type: DataTypes.STRING(50),  
              allowNull: false, 
            },
            description: {
              type: DataTypes.STRING,
              allowNull: true,
            },
            terms: {
              type: DataTypes.STRING(255),
              allowNull: true,
            },
            duration: {
              type: DataTypes.INTEGER,
              allowNull: false,
              defaultValue: 12,
            },
          },
          {
            sequelize,
            modelName: "Warranty",
            tableName: "warranties",
            timestamps: true,
            underscored: true,
          }
        );
    }

    // Instance methods
    // isActive() {
    //     const currentDate = new Date();
    //     return currentDate >= this.start_date && currentDate <= this.end_date;
    // }

    // isExpiringSoon(days = 30) {
    //     const currentDate = new Date();
    //     const expiryThreshold = new Date();
    //     expiryThreshold.setDate(currentDate.getDate() + days);
    //     return this.end_date <= expiryThreshold && this.end_date > currentDate;
    // }

    // // Static methods
    // static async findActiveWarranties() {
    //     const currentDate = new Date();
    //     return this.findAll({
    //         where: {
    //             start_date: {
    //                 [Sequelize.Op.lte]: currentDate
    //             },
    //             end_date: {
    //                 [Sequelize.Op.gte]: currentDate
    //             }
    //         },
    //         include: ['product']
    //     });
    // }

    // static async findExpiringSoon(days = 30) {
    //     const currentDate = new Date();
    //     const expiryThreshold = new Date();
    //     expiryThreshold.setDate(currentDate.getDate() + days);
        
    //     return this.findAll({
    //         where: {
    //             end_date: {
    //                 [Sequelize.Op.lte]: expiryThreshold,
    //                 [Sequelize.Op.gt]: currentDate
    //             }
    //         },
    //         include: ['product']
    //     });
    // }
}

module.exports = Warranty;