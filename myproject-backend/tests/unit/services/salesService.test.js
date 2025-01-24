const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { SalesError } = require('../../../errors/salesError');

// Mock DB setup
const mockDb = {
  sequelize: {
    transaction: sinon.stub()
  },
  User: {
    findOne: sinon.stub(),
    findAll: sinon.stub()
  },
  Product: {
    findOne: sinon.stub(),
    findAll: sinon.stub(),
    update: sinon.stub()
  },
  Customer: {
    findOne: sinon.stub()
  },
  SalesOrder: {
    findOne: sinon.stub(),
    findAll: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    destroy: sinon.stub()
  },
  SalesOrderInventory: {
    findAll: sinon.stub(),
    create: sinon.stub(),
    destroy: sinon.stub()
  },
  SalesOrderTax: {
    destroy: sinon.stub(),
    bulkCreate: sinon.stub()
  },
  SalesOrderDiscount: {
    destroy: sinon.stub(),
    bulkCreate: sinon.stub()
  },
  ReturnRecord: {
    findAndCountAll: sinon.stub()
  },
  ProductUnitReturn: {
    findAll: sinon.stub()
  }
};

// Helper function for Sequelize model mocks
const createSequelizeModelMock = (data) => ({
  ...data,
  update: sinon.stub().resolves([1]),
  destroy: sinon.stub().resolves(1),
  increment: sinon.stub().resolves(),
  decrement: sinon.stub().resolves(),
  get: sinon.stub().returns(data),
  dataValues: data
});

// Mock the models before importing SalesService
jest.mock('../../../models', () => mockDb);

const SalesService = require('../../../service/salesService');

describe('SalesService Unit Tests', () => {
  let transactionStub;
  const TEST_USERNAME = 'testuser';
  const TEST_UUID = '123e4567-e89b-12d3-a456-426614174000';
  const TEST_MANAGER_PASSWORD = 'validPass123';

  beforeEach(() => {
    // Reset all stubs
    Object.values(mockDb).forEach(mock => {
      if (mock.reset) mock.reset();
    });

    // Setup transaction stub
    transactionStub = {
      commit: sinon.stub().resolves(),
      rollback: sinon.stub().resolves()
    };

    // Setup transaction handling
    mockDb.sequelize.transaction.callsFake(async (fn) => {
      if (fn) {
        return await fn(transactionStub);
      }
      return transactionStub;
    });
  });

  describe('updateSalesOrder', () => {
    const validUpdateData = {
      expected_shipment_date: new Date(),
      payment_terms: 'NET30',
      delivery_method: 'Express'
    };

    it('should update sales order successfully', async () => {
      const hashedPassword = await bcrypt.hash(TEST_MANAGER_PASSWORD, 10);

      mockDb.User.findAll.resolves([{
        role: 'Manager',
        password_hash: hashedPassword
      }]);

      mockDb.User.findOne.resolves({
        user_id: 1,
        organization_id: 1,
        password_hash: hashedPassword
      });

      const mockSalesOrder = createSequelizeModelMock({
        sales_order_id: 1,
        organization_id: 1,
        sales_order_uuid: TEST_UUID,
        items: []
      });

      mockDb.SalesOrder.findOne.resolves(mockSalesOrder);
      mockDb.SalesOrderInventory.findAll.resolves([]);

      const result = await SalesService.updateSalesOrder(
        TEST_USERNAME,
        TEST_UUID,
        validUpdateData,
        TEST_MANAGER_PASSWORD
      );

      expect(result).to.equal(mockSalesOrder);
      expect(mockSalesOrder.update.calledOnce).to.be.true;
    });

    it('should throw error when manager password is invalid', async () => {
      const hashedPassword = await bcrypt.hash('differentpassword', 10);

      mockDb.User.findAll.resolves([{
        role: 'Manager',
        password_hash: hashedPassword
      }]);

      try {
        await SalesService.updateSalesOrder(
          TEST_USERNAME,
          TEST_UUID,
          validUpdateData,
          TEST_MANAGER_PASSWORD
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal("The password doesn't match any manager's password");
      }
    });

    it('should throw error when sales order not found', async () => {
      const hashedPassword = await bcrypt.hash(TEST_MANAGER_PASSWORD, 10);

      mockDb.User.findAll.resolves([{
        role: 'Manager',
        password_hash: hashedPassword
      }]);

      mockDb.User.findOne.resolves({
        user_id: 1,
        organization_id: 1,
        password_hash: hashedPassword
      });

      mockDb.SalesOrder.findOne.resolves(null);

      try {
        await SalesService.updateSalesOrder(
          TEST_USERNAME,
          TEST_UUID,
          validUpdateData,
          TEST_MANAGER_PASSWORD
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Sales order not found');
      }
    });
  });

  describe('deleteSalesOrder', () => {
    it('should delete sales order successfully', async () => {
      const hashedPassword = await bcrypt.hash(TEST_MANAGER_PASSWORD, 10);

      mockDb.User.findAll.resolves([{
        role: 'Manager',
        password_hash: hashedPassword
      }]);

      mockDb.User.findOne.resolves({
        user_id: 1,
        organization_id: 1,
        password_hash: hashedPassword
      });

      mockDb.SalesOrder.findOne.resolves(createSequelizeModelMock({
        sales_order_id: 1,
        organization_id: 1,
        sales_order_uuid: TEST_UUID,
        items: []
      }));

      mockDb.SalesOrderInventory.destroy.resolves(1);
      mockDb.SalesOrderTax.destroy.resolves(1);
      mockDb.SalesOrderDiscount.destroy.resolves(1);

      const result = await SalesService.deleteSalesOrder(
        TEST_USERNAME,
        TEST_UUID,
        TEST_MANAGER_PASSWORD
      );

      expect(result).to.deep.equal({
        success: true,
        message: 'Sales order deleted successfully',
        deletedOrderId: TEST_UUID
      });
    });

    it('should throw error when manager password is invalid', async () => {
      const hashedPassword = await bcrypt.hash('differentpassword', 10);

      mockDb.User.findAll.resolves([{
        role: 'Manager',
        password_hash: hashedPassword
      }]);

      try {
        await SalesService.deleteSalesOrder(
          TEST_USERNAME,
          TEST_UUID,
          TEST_MANAGER_PASSWORD
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal("The password doesn't match any manager's password");
      }
    });

    it('should throw error when sales order not found', async () => {
      const hashedPassword = await bcrypt.hash(TEST_MANAGER_PASSWORD, 10);

      mockDb.User.findAll.resolves([{
        role: 'Manager',
        password_hash: hashedPassword
      }]);

      mockDb.User.findOne.resolves({
        user_id: 1,
        organization_id: 1,
        password_hash: hashedPassword
      });

      mockDb.SalesOrder.findOne.resolves(null);

      try {
        await SalesService.deleteSalesOrder(
          TEST_USERNAME,
          TEST_UUID,
          TEST_MANAGER_PASSWORD
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Sales order not found');
      }
    });
  });

  describe('getSalesOrderByUUID', () => {
    it('should retrieve a sales order successfully', async () => {
      const mockSalesOrder = {
        sales_order_uuid: TEST_UUID,
        organization: {
          organization_name: 'Test Org',
          organization_account_number: '123456',
          organization_address: '123 Test St',
          organization_contact: '12345678',
          organization_bank: 'Test Bank',
          organization_email: 'test@org.com'
        },
        items: [{
          Product: {
            product_name: 'Test Product'
          }
        }],
        Discounts: [{
          SalesOrderDiscount: {
            applied_discount_rate: 10,
            discount_amount: 100
          }
        }],
        Taxes: [{
          SalesOrderTax: {
            applied_tax_rate: 7,
            tax_amount: 70
          }
        }],
        Customer: {
          customer_name: 'Test Customer',
          customer_email: 'test@customer.com',
          customer_company: 'Test Company',
          billing_address: '123 Bill St',
          shipping_address: '123 Ship St',
          customer_contact: '87654321'
        }
      };

      mockDb.SalesOrder.findOne.resolves(mockSalesOrder);

      const result = await SalesService.getSalesOrderByUUID(TEST_UUID);
      expect(result).to.deep.equal(mockSalesOrder);
    });

    it('should throw error when sales order is not found', async () => {
      mockDb.SalesOrder.findOne.resolves(null);

      try {
        await SalesService.getSalesOrderByUUID(TEST_UUID);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(SalesError);
        expect(error.message).to.equal('Sales order not found');
      }
    });
  });

  describe('getSalesOrdersByUUID', () => {
    const validUUIDs = [
      TEST_UUID,
      '987fcdeb-51a2-43d8-b987-654321098000'
    ];

    it('should retrieve multiple sales orders successfully', async () => {
      const mockSalesOrders = validUUIDs.map(uuid => ({
        dataValues: {
          sales_order_uuid: uuid,
          total_amount: 1000
        }
      }));

      mockDb.SalesOrder.findAll.resolves(mockSalesOrders);

      const result = await SalesService.getSalesOrdersByUUID(validUUIDs);
      expect(result).to.deep.equal(mockSalesOrders.map(order => order.dataValues));
    });

    it('should return empty array when no orders found', async () => {
      mockDb.SalesOrder.findAll.resolves([]);
      const result = await SalesService.getSalesOrdersByUUID(validUUIDs);
      expect(result).to.deep.equal([]);
    });
  });

  describe('getSalesOrderTotal', () => {
    it('should calculate sales order total successfully', async () => {
      const mockUser = {
        dataValues: {
          username: TEST_USERNAME,
          organization_id: 1
        }
      };

      const mockSalesOrder = {
        dataValues: {
          sales_order_id: 1,
          sales_order_uuid: TEST_UUID,
          organization_id: 1
        }
      };

      const mockInventories = [
        { price: 100 },
        { price: 200 }
      ];

      mockDb.User.findOne.resolves(mockUser);
      mockDb.SalesOrder.findOne.resolves(mockSalesOrder);
      mockDb.SalesOrderInventory.findAll.resolves(mockInventories);

      const result = await SalesService.getSalesOrderTotal(TEST_USERNAME, TEST_UUID);
      expect(result).to.equal(300);
    });

    it('should throw error when user not found', async () => {
      mockDb.User.findOne.resolves(null);

      try {
        await SalesService.getSalesOrderTotal(TEST_USERNAME, TEST_UUID);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('User not found');
      }
    });

    it('should throw error when sales order not found', async () => {
      const mockUser = {
        dataValues: {
          username: TEST_USERNAME,
          organization_id: 1
        }
      };

      mockDb.User.findOne.resolves(mockUser);
      mockDb.SalesOrder.findOne.resolves(null);

      try {
        await SalesService.getSalesOrderTotal(TEST_USERNAME, TEST_UUID);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal(`No sales order found under user ${TEST_USERNAME}`);
      }
    });
  });

  describe('getSalesOrderReturn', () => {
    const organizationId = 1;
    const pageSize = 10;
    const pageNumber = 1;

    it('should retrieve sales order returns successfully', async () => {
      const mockReturns = {
        count: 2,
        rows: [
          {
            return_id: 1,
            ProductUnitReturns: [{
              ProductUnit: {
                Product: {
                  product_name: 'Test Product 1',
                  sku_number: 'SKU001'
                }
              }
            }]
          },
          {
            return_id: 2,
            ProductUnitReturns: [{
              ProductUnit: {
                Product: {
                  product_name: 'Test Product 2',
                  sku_number: 'SKU002'
                }
              }
            }]
          }
        ]
      };

      mockDb.ReturnRecord.findAndCountAll.resolves(mockReturns);

      const result = await SalesService.getSalesOrderReturn(organizationId, pageSize, pageNumber);
      expect(result).to.have.property('returns');
      expect(result).to.have.property('pagination');
      expect(result.pagination).to.deep.include({
        totalItems: 2,
        totalPages: 1,
        currentPage: 1,
        pageSize: 10,
        hasNextPage: false,
        hasPreviousPage: false
      });
    });

    it('should handle empty returns', async () => {
      const mockReturns = {
        count: 0,
        rows: []
      };

      mockDb.ReturnRecord.findAndCountAll.resolves(mockReturns);

      const result = await SalesService.getSalesOrderReturn(organizationId, pageSize, pageNumber);
      expect(result.returns).to.be.empty;
      expect(result.pagination.totalItems).to.equal(0);
    });
  });

  describe('createSalesOrder', () => {
    const validSalesData = {
      customerUUID: TEST_UUID,
      itemsList: [
        { uuid: '123', quantity: 2, price: 100 },
        { uuid: '456', quantity: 1, price: 200 }
      ],
      expectedShipmentDate: new Date(),
      paymentTerms: 'NET30',
      deliveryMethod: 'Express'
    };

    it('should create a sales order successfully', async () => {
      const mockUser = {
        dataValues: {
          user_id: 1,
          organization_id: 1,
          role: 'Staff'
        }
      };
      const mockCustomer = {
        dataValues: {
          customer_id: 1,
          organization_id: 1
        }
      };
      const mockProduct = {
        dataValues: {
          product_id: 1,
          product_stock: 10,
          organization_id: 1
        }
      };
      const mockSalesOrder = {
        dataValues: {
          sales_order_id: 1,
          sales_order_uuid: 'test-uuid'
        }
      };

      mockDb.User.findOne.resolves(mockUser);
      mockDb.Customer.findOne.resolves(mockCustomer);
      mockDb.Product.findOne.resolves(mockProduct);
      mockDb.SalesOrder.create.resolves(mockSalesOrder);
      mockDb.SalesOrderInventory.create.resolves({});

      const result = await SalesService.createSalesOrder(TEST_USERNAME, validSalesData);
      expect(result.dataValues).to.have.property('sales_order_uuid', 'test-uuid');
    });

    it('should throw error when user not found', async () => {
      mockDb.User.findOne.resolves(null);

      try {
        await SalesService.createSalesOrder(TEST_USERNAME, validSalesData);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('User not found');
      }
    });
  });
});
