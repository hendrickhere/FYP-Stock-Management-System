const { Model, DataTypes, Sequelize } = require('sequelize');

class Appointment extends Model {
    static init(sequelize) {
        return super.init(
          {
            appointment_id: {
              type: DataTypes.INTEGER,
              primaryKey: true,
              allowNull: false,
              autoIncrement: true,
            },
            appointment_sn: {
              type: DataTypes.STRING(50),
              allowNull: false,
            },
            customer_id: {
              type: DataTypes.INTEGER,
              allowNull: false,
              references: {
                model: "customers",
                key: "customer_id",
              },
            },
            service_type: {
              type: DataTypes.STRING(255),
              allowNull: false,
            },
            appointment_date: {
              type: DataTypes.DATEONLY,
              allowNull: false,
            },
            time_slot: {
              type: DataTypes.TIME,
              allowNull: false,
            },
            technician: {
              type: DataTypes.STRING(255),
              allowNull: true,
            },
            status: {
              type: DataTypes.STRING(50),
              allowNull: true,
            },
            location: {
              type: DataTypes.TEXT,
              allowNull: true,
            },
            user_id: {
              type: DataTypes.INTEGER,
              allowNull: false,
              referenes: {
                model: "users",
                key: "user_id",
              },
              onDelete: "CASCADE",
              onUpdate: "CASCADE",
            },
            created_at: {
              type: DataTypes.DATE, 
              allowNull: false, 
              defaultValue: Sequelize.fn("NOW"),
            }
          },
          {
            sequelize,
            modelName: "Appointment",referenes: {
                model: "users",
                key: "user_id",
              },
            tableName: "appointments",
            timestamps: false,
            underscored: true,
          }
        );
    }
}

module.exports = Appointment;