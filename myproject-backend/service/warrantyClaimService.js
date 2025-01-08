const { WarrantyClaim, Warranty, ProductUnit, User, WarrantyUnit, Customer, SalesOrder, SalesOrderInventory, Product, sequelize } = require("../models");
const { ProductUnitNotFoundException, WarrantyUnitNotFoundException, WarrantyNotFoundException, OrganizationNotFoundException } = require("../errors/notFoundException");
const { ValidationException } = require("../errors/validationError");
const { ExpiredWarrantyError } = require("../errors/warrantyError");
const UserService = require("./userService");
const { CLAIM_STATUS } = require('../models/warrantyConstants');
const OrganizationService = require("../service/organizationService");

class WarrantyClaimService {
  async createClaim(claimData) {
    const transaction = await sequelize.transaction();
    try {
      const createdUser = await UserService.getUserByUsernameAsync(claimData.created_by);
      const productUnit = await ProductUnit.findOne({
        where: {
          product_unit_id: claimData.product_unit_id,
          is_sold: true
        },
        include: [{
          model: SalesOrderInventory,
          as: "salesOrderItem",
          include: [{
            model: SalesOrder,
            include: [{
              model: Customer,
              attributes: ['customer_id']
            }]
          }]
        }]
      });
      if (!productUnit) {
        throw new ProductUnitNotFoundException([claimData.product_unit_id]);
      }

      const warranty = await Warranty.findOne({
        where: {
          product_id: claimData.product_id,
          warranty_type: 1
        },
        attributes: ["warranty_id"]
      });

      if (!warranty) {
        throw new WarrantyNotFoundException(claimData.product_id);
      }

      const warrantyUnit = await WarrantyUnit.findOne({
        where: {
          product_unit_id: claimData.product_unit_id,
          warranty_id: warranty.warranty_id,
          status: 'ACTIVE'
        },
        attributes: ["warranty_end", "warranty_unit_id"]
      });

      if (!warrantyUnit) {
        throw new WarrantyUnitNotFoundException(productUnit.product_unit_id);
      }

      console.log(warrantyUnit.warranty_id);

      const currentDate = new Date();
      if (currentDate > warrantyUnit.warranty_end) {
        throw new ExpiredWarrantyError(warrantyUnit.warranty_end);
      }

      const claim = await WarrantyClaim.create({
        warranty_unit_id: warrantyUnit.warranty_unit_id,
        warranty_id: warranty.warranty_id,
        customer_id: productUnit.salesOrderItem.SalesOrder.Customer.customer_id,
        resolution_details: claimData.resolution_details || null,
        claim_type: claimData.claim_type,
        priority: claimData.priority || 1,
        assigned_to: claimData.assigned_to,
        organization_id: createdUser.organization_id,
        created_by: createdUser.user_id,
        claim_status: CLAIM_STATUS.PENDING
      }, { transaction });

      await transaction.commit();
      return claim;
    } catch (error) {
      await transaction.rollback();

      if (error instanceof ProductUnitNotFoundException ||
        error instanceof WarrantyUnitNotFoundException ||
        error instanceof ExpiredWarrantyError) {
        throw error;
      }

      if (error.name === 'SequelizeValidationError') {
        throw new Error('Invalid claim data: ' + error.message);
      }

      console.error('Error creating warranty claim:', error);
      throw new Error('Failed to create warranty claim');
    }
  }

  async getClaimsByOrganizationId(organization_id, assignee, status, pageNumber, pageSize) {
    try {
      const organization = await OrganizationService.getOrganization(organization_id);

      if (!organization) {
        throw OrganizationNotFoundException(organization_id);
      }

      const whereClause = {
        organization_id: organization_id
      };

      if (assignee !== '0' && assignee !== 0) {
        whereClause.assigned_to = assignee;
      }

      if (status !== '0' && status !== 0) {
        whereClause.claim_status = status;
      }

      const claims = await WarrantyClaim.findAll({
        where: whereClause,
        attributes: [
          "claim_id",
          "date_of_claim",
          "claim_status",
          "resolution_details",
          "claim_type",
          "priority",
          "created_at"
        ],
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['user_id', 'username', 'email'],
            foreignKey: 'created_by'
          },
          {
            model: User,
            as: 'modifier',
            attributes: ['user_id', 'username', 'email'],
            foreignKey: 'last_modified_by'
          },
          {
            model: User,
            as: 'assignee',
            attributes: ['user_id', 'username', 'email'],
            foreignKey: 'assigned_to'
          },
          {
            model: WarrantyUnit,
            foreignKey: 'warranty_unit_id',
            attributes: ["warranty_start", "warranty_end"],
            include: [
              {
                model: ProductUnit,
                foreignKey: 'product_unit_id',
                attributes: ["serial_number"],
                include: [
                  {
                    model: Product,
                    foreignKey: 'product_id',
                    attributes: ["product_name", "sku_number", "product_id"]
                  }
                ]
              }

            ]
          }
        ],
        order: [
          ['created_at', 'DESC']
        ]
      });

      return claims;
    } catch (err) {
      throw err;
    }
  }

  async updateClaimStatus(claimId, updateData) {
    const transaction = await sequelize.transaction();

    try {
      const claim = await warranty_claims.findByPk(claimId);
      if (!claim) {
        throw new Error("Claim not found");
      }

      await claim.update({
        claim_status: updateData.claim_status,
        resolution_details: updateData.resolution_details,
        priority: updateData.priority,
        assigned_to: updateData.assigned_to,
        last_modified_by: updateData.last_modified_by
      }, { transaction });

      await transaction.commit();
      return claim;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async reassignClaim(claimId, newAssigneeId, modifiedBy) {
    const transaction = await sequelize.transaction();

    try {
      const [claim, assignee] = await Promise.all([
        warranty_claims.findByPk(claimId),
        users.findByPk(newAssigneeId)
      ]);

      if (!claim) {
        throw new Error("Claim not found");
      }

      if (!assignee) {
        throw new Error("Assignee not found");
      }

      await claim.update({
        assigned_to: newAssigneeId,
        last_modified_by: modifiedBy
      }, { transaction });

      await transaction.commit();
      return claim;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getPendingClaims() {
    try {
      return await warranty_claims.findAll({
        where: { claim_status: 1 }, // Pending status
        include: [{
          model: warranties,
          as: 'warranty',
          include: ['product']
        }],
        order: [
          ['priority', 'DESC'],
          ['date_of_claim', 'ASC']
        ]
      });
    } catch (error) {
      throw error;
    }
  }

  async getClaimsByWarranty(warrantyId) {
    try {
      return await warranty_claims.findAll({
        where: { warranty_id: warrantyId },
        include: [{
          model: warranties,
          as: 'warranty',
          include: ['product']
        }],
        order: [['date_of_claim', 'DESC']]
      });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new WarrantyClaimService();