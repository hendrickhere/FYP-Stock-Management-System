const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const { Op } = require('sequelize');
const { ValidationException } = require('../../../errors/validationError');
const { ProductNotFoundException, ProductUnitNotFoundException } = require('../../../errors/notFoundException');
const { DatabaseOperationException } = require('../../../errors/operationError');

// Mock DB setup
const mockDb = {
  sequelize: {
    transaction: sinon.stub()
  },
  Product: {
    findOne: sinon.stub(),
    findAll: sinon.stub(),
    increment: sinon.stub(),
    decrement: sinon.stub()
  },
  ProductUnit: {
    findOne: sinon.stub(),
    findAll: sinon.stub(),
    findAndCountAll: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub()
  },
  Warranty: {
    findOne: sinon.stub()
  },
  WarrantyUnit: {
    create: sinon.stub(),
    findAll: sinon.stub()
  },
  PurchaseOrderItem: {
    findOne: sinon.stub(),
    decrement: sinon.stub()
  }
};

// Mock the models before importing ProductService
jest.mock('../../../models', () => mockDb);

// Mock services
jest.mock('../../../service/warrantyService', () => ({
  getWarrantiesByProduct: jest.fn()
}));

jest.mock('../../../service/purchaseService', () => ({
  getPurchaseOrderItem: jest.fn()
}));

jest.mock('../../../service/salesService', () => ({
  getSalesOrderItem: jest.fn()
}));

const WarrantyService = require('../../../service/warrantyService');
const PurchaseService = require('../../../service/purchaseService');
const SalesService = require('../../../service/salesService');
const ProductService = require('../../../service/productService');

describe('ProductService Unit Tests', () => {
  let transactionStub;
  const TEST_USERNAME = 'testuser';
  const TEST_PRODUCT_ID = '123e4567-e89b-12d3-a456-426614174000';
  const TEST_SERIAL_NUMBER = 'SN123456789';

  beforeEach(() => {
    sinon.reset();
    jest.clearAllMocks();
    transactionStub = {
      commit: sinon.stub().resolves(),
      rollback: sinon.stub().resolves()
    };
    mockDb.sequelize.transaction.resolves(transactionStub);
  });

  describe('addProductUnit', () => {
    const validProductData = {
      product_id: TEST_PRODUCT_ID,
      units: [
        { serialNumber: TEST_SERIAL_NUMBER }
      ]
    };

    const mockPurchaseOrderItem = {
      purchase_order_item_id: 1,
      unregistered_quantity: 1
    };

    const mockWarranty = {
      warranty_id: 1,
      manufacturer: [{
        warranty_id: 1,
        duration: 12
      }]
    };

    it('should add product unit successfully', async () => {
      WarrantyService.getWarrantiesByProduct.mockResolvedValue(mockWarranty);
      PurchaseService.getPurchaseOrderItem.mockResolvedValue(mockPurchaseOrderItem);
      mockDb.ProductUnit.findOne.resolves(null);
      mockDb.ProductUnit.create.resolves({ product_unit_id: 1 });
      mockDb.WarrantyUnit.create.resolves({});
      mockDb.PurchaseOrderItem.decrement.resolves();
      mockDb.Product.increment.resolves();

      await ProductService.addProductUnit(1, [validProductData], TEST_USERNAME);
    });

    it('should throw error when serial number already exists', async () => {
      WarrantyService.getWarrantiesByProduct.mockResolvedValue(mockWarranty);
      PurchaseService.getPurchaseOrderItem.mockResolvedValue(mockPurchaseOrderItem);
      mockDb.ProductUnit.findOne.resolves({ product_unit_id: 1 });

      try {
        await ProductService.addProductUnit(1, [validProductData], TEST_USERNAME);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(ValidationException);
        expect(error.message).to.include('Serial numbers already exist');
      }
    });
  });

  describe('sellProductUnit', () => {
    const mockProducts = [{
      product_id: TEST_PRODUCT_ID,
      units: [{ serialNumber: TEST_SERIAL_NUMBER }]
    }];

    const mockSalesOrderItem = {
      unregistered_quantity: 1
    };

    it('should sell product units successfully', async () => {
      WarrantyService.getWarrantiesByProduct.mockResolvedValue({});
      SalesService.getSalesOrderItem.mockResolvedValue(mockSalesOrderItem);

      await ProductService.sellProductUnit(1, mockProducts);
    });

    it('should throw error when trying to register more units than available', async () => {
      const invalidProducts = [{
        product_id: TEST_PRODUCT_ID,
        units: [
          { serialNumber: TEST_SERIAL_NUMBER },
          { serialNumber: 'SN987654321' }
        ]
      }];

      WarrantyService.getWarrantiesByProduct.mockResolvedValue({});
      SalesService.getSalesOrderItem.mockResolvedValue({ unregistered_quantity: 1 });

      let error;
      try {
        await ProductService.sellProductUnit(1, invalidProducts);
        expect.fail('Should have thrown an error');
      } catch (err) {
        error = err;
      }
      expect(error).to.not.be.undefined;
      expect(error).to.be.instanceOf(Error);
    });
  });

  describe('getProductUnit', () => {
    const mockProductUnits = [{
      serial_number: TEST_SERIAL_NUMBER,
      product_unit_id: 1
    }];

    it('should return product units when found', async () => {
      mockDb.ProductUnit.findAll.resolves(mockProductUnits);

      const result = await ProductService.getProductUnit(1, TEST_PRODUCT_ID);
      expect(result).to.deep.equal(mockProductUnits);
    });

    it('should return empty array when no units found', async () => {
      mockDb.ProductUnit.findAll.resolves([]);

      const result = await ProductService.getProductUnit(1, TEST_PRODUCT_ID);
      expect(result).to.deep.equal([]);
    });
  });

  describe('getProductUnitWithSerialNumber', () => {
    const mockProductUnit = {
      product_unit_id: 1,
      serial_number: TEST_SERIAL_NUMBER,
      is_sold: false,
      dataValues: {
        product_unit_id: 1,
        serial_number: TEST_SERIAL_NUMBER,
        is_sold: false
      }
    };

    it('should return product unit when found', async () => {
      mockDb.ProductUnit.findOne.resolves(mockProductUnit);

      const result = await ProductService.getProductUnitWithSerialNumber(TEST_SERIAL_NUMBER);
      expect(result).to.deep.equal(mockProductUnit.dataValues);
    });

    it('should throw ProductUnitNotFoundException when not found', async () => {
      mockDb.ProductUnit.findOne.resolves(null);

      try {
        await ProductService.getProductUnitWithSerialNumber(TEST_SERIAL_NUMBER);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(ProductUnitNotFoundException);
      }
    });

    it('should throw error when serial number is empty', async () => {
      try {
        await ProductService.getProductUnitWithSerialNumber('');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Serial number is required');
      }
    });
  });

  describe('getProductUnitsWithProductId', () => {
    it('should return product units with pagination', async () => {
      const mockProduct = { product_id: 1, status_id: 1 };
      const mockProductUnits = {
        count: 2,
        rows: [
          { serial_number: TEST_SERIAL_NUMBER },
          { serial_number: 'SN987654321' }
        ]
      };

      mockDb.Product.findOne.resolves(mockProduct);
      mockDb.ProductUnit.findAndCountAll.resolves(mockProductUnits);

      const result = await ProductService.getProductUnitsWithProductId(TEST_PRODUCT_ID, 1, 10, '');
      expect(result.productUnits).to.deep.equal(mockProductUnits.rows);
      expect(result.pagination).to.exist;
    });

    it('should filter product units by search term', async () => {
      const mockProduct = { product_id: 1, status_id: 1 };
      const mockProductUnits = {
        count: 1,
        rows: [{ serial_number: TEST_SERIAL_NUMBER }]
      };

      mockDb.Product.findOne.resolves(mockProduct);
      mockDb.ProductUnit.findAndCountAll.resolves(mockProductUnits);

      const result = await ProductService.getProductUnitsWithProductId(TEST_PRODUCT_ID, 1, 10, TEST_SERIAL_NUMBER);
      expect(result.productUnits).to.deep.equal(mockProductUnits.rows);
    });

    it('should throw ProductNotFoundException when product not found', async () => {
      mockDb.Product.findOne.resolves(null);

      let error;
      try {
        await ProductService.getProductUnitsWithProductId(TEST_PRODUCT_ID, 1, 10, '');
        expect.fail('Should have thrown an error');
      } catch (err) {
        error = err;
      }
      expect(error).to.not.be.undefined;
      const errorString = error.toString();
      expect(errorString).to.include('ProductNotFoundException');
    });
  });

  describe('getExpiringProducts', () => {
    it('should return expiring products', async () => {
      const currentDate = new Date('2025-01-24');
      const twoMonthsFromNow = new Date('2025-03-24');

      const mockExpiringProducts = [{
        product_id: 1,
        product_name: 'Test Product',
        product_stock: 10,
        expiry_date: twoMonthsFromNow,
        sku_number: 'SKU123',
        brand: 'Test Brand'
      }];

      mockDb.Product.findAll.resolves(mockExpiringProducts);

      const result = await ProductService.getExpiringProducts();

      // Verify the query parameters
      const findAllCall = mockDb.Product.findAll.getCall(0);
      const queryOptions = findAllCall.args[0];

      // Check that the query is correctly structured
      expect(queryOptions.where).to.deep.include({
        is_expiry_goods: true,
        product_stock: {
          [Op.gt]: 0
        }
      });

      // Check that expiry_date conditions are present
      expect(queryOptions.where.expiry_date[Op.and]).to.have.lengthOf(3);

      // Verify attributes
      expect(queryOptions.attributes).to.deep.equal([
        'product_id',
        'product_name',
        'product_stock',
        'expiry_date',
        'sku_number',
        'brand'
      ]);

      // Verify ordering
      expect(queryOptions.order).to.deep.equal([['expiry_date', 'ASC']]);

      // Verify returned data
      expect(result).to.deep.equal(mockExpiringProducts);
    });
  });
});
