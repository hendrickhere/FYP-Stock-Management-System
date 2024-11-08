const { Model, DataTypes, Sequelize } = require('sequelize');
const { CLAIM_STATUS } = require('./warrantyConstants');

class WarrantyClaim extends Model {
    static init(sequelize) {
        return super.init({
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
            customer_id: {  
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "customers",
                    key: "customer_id"
                }
            },
            created_by: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id"
                }
            },
            last_modified_by: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "user_id"
                }
            },
            date_of_claim: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            claim_status: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    isIn: [[1, 2, 3, 4]], // 1: pending, 2: approved, 3: rejected, 4: resolved
                },
                defaultValue: CLAIM_STATUS.PENDING
            },
            resolution_details: {
                type: DataTypes.STRING(255),
                allowNull: false
            },
            claim_type: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            priority: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            assigned_to: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "users",
                    key: "user_id"
                }
            }
        }, {
            sequelize,
            modelName: 'WarrantyClaim',
            tableName: 'warranty_claims',
            timestamps: true,
            underscored: true,
            indexes: [
                {
                    name: 'idx_warranty_claims_warranty_id',
                    fields: ['warranty_id']
                },
                {
                    name: 'idx_warranty_claims_customer',  
                    fields: ['customer_id']
                },
                {
                    name: 'idx_warranty_claims_status',
                    fields: ['claim_status']
                }
            ]
        });
    }

    // Instance methods
    isPending() {
        return this.claim_status === CLAIM_STATUS.PENDING;
    }

    isApproved() {
        return this.claim_status === CLAIM_STATUS.APPROVED;
    }

    isRejected() {
        return this.claim_status === CLAIM_STATUS.REJECTED;
    }

    isResolved() {
        return this.claim_status === CLAIM_STATUS.RESOLVED;
    }

    // Static methods
    static async findPendingClaims() {
        return this.findAll({
            where: {
                claim_status: CLAIM_STATUS.PENDING
            },
            include: [
                {
                    model: Warranty,
                    as: 'warranty',
                    include: ['product']
                },
                {
                    model: Customer,
                    as: 'customer'
                }
            ]
        });
    }
}

module.exports = WarrantyClaim;