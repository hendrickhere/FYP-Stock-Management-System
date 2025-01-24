const db = require('../models');
const DiscountError = require('../errors/discountError');
const { Op } = require('sequelize');

class DiscountService {
  static async createDiscount({ organizationId, discountName, discountRate, description }) {
    try {
      if (isNaN(parseFloat(discountRate))) {
        throw new DiscountError('Discount rate must be a valid number', 'INVALID_INPUT', 400);
      }

      if (parseFloat(discountRate) < 0) {
        throw new DiscountError('Discount rate cannot be negative', 'INVALID_INPUT', 400);
      }

      const organization = await db.Organization.findOne({
        where: { organization_id: organizationId }
      });

      if (!organization) {
        throw new DiscountError('Organization not found', 'NOT_FOUND', 404);
      }

      const discount = await db.Discount.create({
        organization_id: organizationId,
        discount_name: discountName,
        discount_rate: discountRate,
        description: description,
        discount_status: 1
      });

      return discount.dataValues;
    } catch (error) {
      if (error instanceof DiscountError) {
        throw error;
      }
      throw new DiscountError('Database error occurred while creating discount', 'INTERNAL_SERVER_ERROR', 500);
    }
  }

  static async getDiscounts(organizationId, includeExpire = false) {
    try {
      const organization = await db.Organization.findOne({
        where: { organization_id: organizationId }
      });

      if (!organization) {
        throw new DiscountError('Organization not found', 'NOT_FOUND', 404);
      }

      const currentDate = new Date();
      let whereCondition = {
        organization_id: organizationId,
        discount_status: 1
      };

      if (!includeExpire) {
        whereCondition = {
          ...whereCondition,
          [Op.or]: [
            { discount_end: null },
            { discount_end: { [Op.gt]: currentDate } }
          ]
        };
      }

      const discounts = await db.Discount.findAll({
        where: whereCondition,
        attributes: [
          'discount_id',
          'discount_name',
          'discount_rate',
          'description',
          'discount_start',
          'discount_end'
        ],
        order: [['created_at', 'DESC']]
      });

      return discounts.map(discount => discount.dataValues);
    } catch (error) {
      if (error instanceof DiscountError) {
        throw error;
      }
      throw new DiscountError('Database error occurred while retrieving discounts', 'INTERNAL_SERVER_ERROR', 500);
    }
  }

  static async updateDiscount(discountId, updateData) {
    try {
      const discount = await db.Discount.findByPk(discountId);

      if (!discount) {
        throw new DiscountError('Discount not found', 'NOT_FOUND', 404);
      }

      if (updateData.discount_rate && parseFloat(updateData.discount_rate) < 0) {
        throw new DiscountError('Discount rate cannot be negative', 'INVALID_INPUT', 400);
      }

      await discount.update(updateData);
      await discount.reload();

      return discount.dataValues;
    } catch (error) {
      if (error instanceof DiscountError) {
        throw error;
      }
      throw new DiscountError('Database error occurred while updating discount', 'INTERNAL_SERVER_ERROR', 500);
    }
  }

  static async deleteDiscount(discountId) {
    try {
      const discount = await db.Discount.findByPk(discountId);

      // If discount doesn't exist or is already deleted, return success
      if (!discount || discount.discount_status === 0) {
        return { success: true };
      }

      // Soft delete by updating discount_status to 0
      await discount.update({ discount_status: 0 });
      return { success: true };
    } catch (error) {
      if (error instanceof DiscountError) {
        throw error;
      }
      throw new DiscountError('Database error occurred while deleting discount', 'INTERNAL_SERVER_ERROR', 500);
    }
  }
}

module.exports = DiscountService;
