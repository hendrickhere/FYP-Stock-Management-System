const db = require('../models');
const TaxError = require('../errors/taxError');

class TaxService {
  static async createTax({ organizationId, taxName, taxRate, description }) {
    try {
      if (isNaN(parseFloat(taxRate))) {
        throw new TaxError('Tax rate must be a valid number', 'INVALID_INPUT', 400);
      }

      if (parseFloat(taxRate) < 0) {
        throw new TaxError('Tax rate cannot be negative', 'INVALID_INPUT', 400);
      }

      const organization = await db.Organization.findOne({
        where: { organization_id: organizationId }
      });

      if (!organization) {
        throw new TaxError('Organization not found', 'NOT_FOUND', 404);
      }

      const tax = await db.Tax.create({
        organization_id: organizationId,
        tax_name: taxName,
        tax_rate: taxRate,
        description: description,
        tax_status: 1
      });

      return tax.dataValues;
    } catch (error) {
      if (error instanceof TaxError) {
        throw error;
      }
      throw new TaxError('Database error occurred while creating tax', 'INTERNAL_SERVER_ERROR', 500);
    }
  }

  static async getTaxes(organizationId) {
    try {
      const organization = await db.Organization.findOne({
        where: { organization_id: organizationId }
      });

      if (!organization) {
        throw new TaxError('Organization not found', 'NOT_FOUND', 404);
      }

      const taxes = await db.Tax.findAll({
        where: {
          organization_id: organizationId,
          tax_status: 1
        },
        order: [["created_at", "DESC"]]
      });

      return taxes.map(tax => tax.dataValues);
    } catch (error) {
      if (error instanceof TaxError) {
        throw error;
      }
      throw new TaxError('Database error occurred while retrieving taxes', 'INTERNAL_SERVER_ERROR', 500);
    }
  }

  static async updateTax(taxId, updateData) {
    try {
      const tax = await db.Tax.findByPk(taxId);

      if (!tax) {
        throw new TaxError('Tax not found', 'NOT_FOUND', 404);
      }

      if (updateData.tax_rate && parseFloat(updateData.tax_rate) < 0) {
        throw new TaxError('Tax rate cannot be negative', 'INVALID_INPUT', 400);
      }

      await tax.update(updateData);
      await tax.reload();

      return tax.dataValues;
    } catch (error) {
      if (error instanceof TaxError) {
        throw error;
      }
      throw new TaxError('Database error occurred while updating tax', 'INTERNAL_SERVER_ERROR', 500);
    }
  }

  static async deleteTax(taxId) {
    try {
      const tax = await db.Tax.findByPk(taxId);

      // If tax doesn't exist or is already deleted, return success
      if (!tax || tax.tax_status === 0) {
        return { success: true };
      }

      // Soft delete by updating tax_status to 0
      await tax.update({ tax_status: 0 });
      return { success: true };
    } catch (error) {
      if (error instanceof TaxError) {
        throw error;
      }
      throw new TaxError('Database error occurred while deleting tax', 'INTERNAL_SERVER_ERROR', 500);
    }
  }
}

module.exports = TaxService;
