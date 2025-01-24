const { expect, sinon, mockDb } = require('../../helpers/jest.setup');
const DiscountService = require('../../../service/discountService');
const DiscountError = require('../../../errors/discountError');

describe('DiscountService Unit Tests', () => {
  beforeEach(() => {
    sinon.restore();
  });

  describe('createDiscount', () => {
    const validDiscountData = {
      organizationId: 1,
      discountName: 'New Year Sale',
      discountRate: 10,
      description: 'New Year Special Discount'
    };

    it('should create a discount successfully', async () => {
      const mockDiscount = {
        dataValues: {
          id: 1,
          organization_id: validDiscountData.organizationId,
          discount_name: validDiscountData.discountName,
          discount_rate: validDiscountData.discountRate,
          description: validDiscountData.description,
          discount_status: 1
        }
      };

      mockDb.Organization.findOne.resolves({ id: 1 });
      mockDb.Discount.create.resolves(mockDiscount);

      const result = await DiscountService.createDiscount(validDiscountData);
      expect(result).to.deep.equal(mockDiscount.dataValues);
    });

    it('should throw error for invalid discount rate format', async () => {
      const invalidData = { ...validDiscountData, discountRate: 'invalid' };
      mockDb.Organization.findOne.resolves({ id: 1 });

      try {
        await DiscountService.createDiscount(invalidData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(DiscountError);
        expect(error.message).to.equal('Discount rate must be a valid number');
      }
    });

    it('should throw error for negative discount rate', async () => {
      const invalidData = { ...validDiscountData, discountRate: -10 };
      mockDb.Organization.findOne.resolves({ id: 1 });

      try {
        await DiscountService.createDiscount(invalidData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(DiscountError);
        expect(error.message).to.equal('Discount rate cannot be negative');
      }
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database error');
      mockDb.Organization.findOne.resolves({ id: 1 });
      mockDb.Discount.create.rejects(dbError);

      try {
        await DiscountService.createDiscount(validDiscountData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(DiscountError);
        expect(error.message).to.equal('Database error occurred while creating discount');
      }
    });
  });

  describe('getDiscounts', () => {
    it('should return all active discounts for an organization', async () => {
      const mockDiscounts = [
        { 
          dataValues: { 
            discount_id: 1, 
            discount_name: 'New Year Sale', 
            discount_rate: 10,
            description: 'New Year Special Discount',
            discount_status: 1
          }
        }
      ];

      mockDb.Organization.findOne.resolves({ id: 1 });
      mockDb.Discount.findAll.resolves(mockDiscounts);

      const result = await DiscountService.getDiscounts(1);
      expect(result).to.deep.equal(mockDiscounts.map(d => d.dataValues));
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database error');
      mockDb.Organization.findOne.resolves({ id: 1 });
      mockDb.Discount.findAll.rejects(dbError);

      try {
        await DiscountService.getDiscounts(1);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(DiscountError);
        expect(error.message).to.equal('Database error occurred while retrieving discounts');
      }
    });
  });

  describe('updateDiscount', () => {
    const updateData = {
      discount_name: 'Updated Sale',
      discount_rate: 20
    };

    it('should update discount successfully', async () => {
      const mockDiscount = {
        dataValues: {
          id: 1,
          ...updateData,
          discount_status: 1
        },
        update: sinon.stub().resolves(),
        reload: sinon.stub().resolves()
      };

      mockDb.Discount.findByPk.resolves(mockDiscount);

      const result = await DiscountService.updateDiscount(1, updateData);
      expect(result.id).to.equal(1);
      expect(mockDiscount.update).to.have.been.calledWith(updateData);
    });

    it('should throw error for non-existent discount', async () => {
      mockDb.Discount.findByPk.resolves(null);

      try {
        await DiscountService.updateDiscount(999, updateData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(DiscountError);
        expect(error.message).to.equal('Discount not found');
      }
    });

    it('should throw error for negative discount rate', async () => {
      const mockDiscount = {
        dataValues: {
          id: 1,
          discount_status: 1
        }
      };

      mockDb.Discount.findByPk.resolves(mockDiscount);

      try {
        await DiscountService.updateDiscount(1, { discount_rate: -20 });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(DiscountError);
        expect(error.message).to.equal('Discount rate cannot be negative');
      }
    });
  });

  describe('deleteDiscount', () => {
    it('should soft delete discount successfully', async () => {
      const mockDiscount = {
        discount_status: 1,
        update: sinon.stub().resolves()
      };

      mockDb.Discount.findByPk.resolves(mockDiscount);

      const result = await DiscountService.deleteDiscount(1);
      expect(result).to.deep.equal({ success: true });
      expect(mockDiscount.update).to.have.been.calledWith({ discount_status: 0 });
    });

    it('should return success for already deleted discount', async () => {
      const mockDiscount = {
        discount_status: 0,
        update: sinon.stub().resolves()
      };

      mockDb.Discount.findByPk.resolves(mockDiscount);

      const result = await DiscountService.deleteDiscount(1);
      expect(result).to.deep.equal({ success: true });
      expect(mockDiscount.update).to.not.have.been.called;
    });

    it('should return success for non-existent discount', async () => {
      mockDb.Discount.findByPk.resolves(null);

      const result = await DiscountService.deleteDiscount(999);
      expect(result).to.deep.equal({ success: true });
    });

    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database error');
      mockDb.Discount.findByPk.rejects(dbError);

      try {
        await DiscountService.deleteDiscount(1);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(DiscountError);
        expect(error.message).to.equal('Database error occurred while deleting discount');
      }
    });
  });
});
