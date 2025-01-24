const { expect, sinon, mockDb } = require('../../helpers/jest.setup');
const TaxService = require('../../../service/taxService');
const TaxError = require('../../../errors/taxError');

describe('TaxService Unit Tests', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('createTax', () => {
    const validTaxData = {
      organizationId: 1,
      taxName: 'GST',
      taxRate: 7,
      description: 'Goods and Services Tax'
    };

    it('should create a tax successfully', async () => {
      const mockTax = {
        dataValues: {
          id: 1,
          organization_id: validTaxData.organizationId,
          tax_name: validTaxData.taxName,
          tax_rate: validTaxData.taxRate,
          description: validTaxData.description,
          tax_status: 1
        }
      };

      mockDb.Organization.findOne.resolves({ id: 1 });
      mockDb.Tax.create.resolves(mockTax);

      const result = await TaxService.createTax(validTaxData);
      expect(result).to.deep.equal(mockTax.dataValues);
    });

    it('should throw error for invalid tax rate format', async () => {
      const invalidData = { ...validTaxData, taxRate: 'invalid' };
      mockDb.Organization.findOne.resolves({ id: 1 });

      try {
        await TaxService.createTax(invalidData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(TaxError);
        expect(error.message).to.equal('Tax rate must be a valid number');
      }
    });

    it('should throw error for negative tax rate', async () => {
      const invalidData = { ...validTaxData, taxRate: -10 };
      mockDb.Organization.findOne.resolves({ id: 1 });

      try {
        await TaxService.createTax(invalidData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(TaxError);
        expect(error.message).to.equal('Tax rate cannot be negative');
      }
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database error');
      mockDb.Organization.findOne.resolves({ id: 1 });
      mockDb.Tax.create.rejects(dbError);

      try {
        await TaxService.createTax(validTaxData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(TaxError);
        expect(error.message).to.equal('Database error occurred while creating tax');
      }
    });
  });

  describe('getTaxes', () => {
    it('should return all active taxes for an organization', async () => {
      const mockTaxes = [
        { 
          dataValues: { 
            tax_id: 1, 
            tax_name: 'GST', 
            tax_rate: 7,
            description: 'Goods and Services Tax',
            tax_status: 1
          }
        }
      ];

      mockDb.Organization.findOne.resolves({ id: 1 });
      mockDb.Tax.findAll.resolves(mockTaxes);

      const result = await TaxService.getTaxes(1);
      expect(result).to.deep.equal(mockTaxes.map(t => t.dataValues));
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database error');
      mockDb.Organization.findOne.resolves({ id: 1 });
      mockDb.Tax.findAll.rejects(dbError);

      try {
        await TaxService.getTaxes(1);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(TaxError);
        expect(error.message).to.equal('Database error occurred while retrieving taxes');
      }
    });
  });

  describe('updateTax', () => {
    const updateData = {
      tax_name: 'Updated Tax',
      tax_rate: 8
    };

    it('should update tax successfully', async () => {
      const mockTax = {
        dataValues: {
          id: 1,
          ...updateData,
          tax_status: 1
        },
        update: sinon.stub().resolves(),
        reload: sinon.stub().resolves()
      };

      mockDb.Tax.findByPk.resolves(mockTax);

      const result = await TaxService.updateTax(1, updateData);
      expect(result.id).to.equal(1);
      expect(mockTax.update).to.have.been.calledWith(updateData);
    });

    it('should throw error for non-existent tax', async () => {
      mockDb.Tax.findByPk.resolves(null);

      try {
        await TaxService.updateTax(999, updateData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(TaxError);
        expect(error.message).to.equal('Tax not found');
      }
    });

    it('should throw error for negative tax rate', async () => {
      const mockTax = {
        dataValues: {
          id: 1,
          tax_status: 1
        }
      };

      mockDb.Tax.findByPk.resolves(mockTax);

      try {
        await TaxService.updateTax(1, { tax_rate: -20 });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(TaxError);
        expect(error.message).to.equal('Tax rate cannot be negative');
      }
    });
  });

  describe('deleteTax', () => {
    it('should soft delete tax successfully', async () => {
      const mockTax = {
        tax_status: 1,
        update: sinon.stub().resolves()
      };

      mockDb.Tax.findByPk.resolves(mockTax);

      const result = await TaxService.deleteTax(1);
      expect(result).to.deep.equal({ success: true });
      expect(mockTax.update).to.have.been.calledWith({ tax_status: 0 });
    });

    it('should return success for already deleted tax', async () => {
      const mockTax = {
        tax_status: 0,
        update: sinon.stub().resolves()
      };

      mockDb.Tax.findByPk.resolves(mockTax);

      const result = await TaxService.deleteTax(1);
      expect(result).to.deep.equal({ success: true });
      expect(mockTax.update).to.not.have.been.called;
    });

    it('should return success for non-existent tax', async () => {
      mockDb.Tax.findByPk.resolves(null);

      const result = await TaxService.deleteTax(999);
      expect(result).to.deep.equal({ success: true });
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database error');
      mockDb.Tax.findByPk.rejects(dbError);

      try {
        await TaxService.deleteTax(1);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(TaxError);
        expect(error.message).to.equal('Database error occurred while deleting tax');
      }
    });
  });
});
