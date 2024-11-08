const { warranty_claims, warranties, products, users } = require("../models");
const sequelize = require("../config/app.config");

class WarrantyClaimService {
  async createClaim(claimData) {
    const transaction = await sequelize.transaction();
    
    try {
      const warranty = await warranties.findByPk(claimData.warranty_id);
      if (!warranty) {
        throw new Error("Warranty not found");
      }

      if (!warranty.isActive()) {
        throw new Error("Warranty expired");
      }

      const claim = await warranty_claims.create({
        warranty_id: claimData.warranty_id,
        customer_id: claimData.customer_id,
        resolution_details: claimData.resolution_details,
        claim_type: claimData.claim_type,
        priority: claimData.priority || 1,
        assigned_to: claimData.assigned_to,
        created_by: claimData.created_by,
        claim_status: 1 // Pending status
      }, { transaction });

      await transaction.commit();
      return claim;
    } catch (error) {
      await transaction.rollback();
      throw error;
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