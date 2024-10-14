const { DataTypes } = require("sequelize");
const sequelize = require("../db-config");

const WarrantyClaim = sequelize.define("warranty_claims", {
    claim_id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.INTEGER,
        autoIncrement: true
    },
    warranty_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: "warranties",
            key: "warranty_id"
        }
    },
    date_of_claim: {
        type: DataTypes.DATE,
        allowNull: false
    },
    claim_status: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    resolution_details: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
});

export default WarrantyClaim; 