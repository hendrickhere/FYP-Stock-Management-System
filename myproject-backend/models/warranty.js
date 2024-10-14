const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");

const Warranty = sequelize.define("warranties", {
    warranty_id: {
        primaryKey: true,
        allowNull: false,
        autoIncrement: true,
        type: DataTypes.INTEGER,
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references:{
            model: "products",
            key: "product_id"
        }
    },
    warranty_type: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_date:{
        type: DataTypes.DATE,
        allowNull: false
    },
    terms: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
});

export default Warranty;