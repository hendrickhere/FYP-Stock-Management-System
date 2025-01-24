const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(sinonChai);
chai.use(chaiAsPromised);

const expect = chai.expect;

const mockSequelize = {
  transaction: sinon.stub()
};

const mockDb = {
  sequelize: mockSequelize,
  Organization: {
    findOne: sinon.stub(),
    findByPk: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    destroy: sinon.stub(),
    findAll: sinon.stub()
  },
  Tax: {
    findOne: sinon.stub(),
    findByPk: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    destroy: sinon.stub(),
    findAll: sinon.stub()
  },
  Discount: {
    findOne: sinon.stub(),
    findByPk: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    destroy: sinon.stub(),
    findAll: sinon.stub()
  },
  User: {
    findOne: sinon.stub(),
    findByPk: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    destroy: sinon.stub(),
    findAll: sinon.stub()
  },
  SalesOrder: {
    findOne: sinon.stub(),
    findByPk: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    destroy: sinon.stub(),
    findAll: sinon.stub()
  },
  SalesOrderInventory: {
    findOne: sinon.stub(),
    findByPk: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    destroy: sinon.stub(),
    findAll: sinon.stub()
  },
  ReturnRecord: {
    findOne: sinon.stub(),
    findByPk: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    destroy: sinon.stub(),
    findAll: sinon.stub(),
    findAndCountAll: sinon.stub()
  },
  ProductUnitReturn: {
    findOne: sinon.stub(),
    findByPk: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    destroy: sinon.stub(),
    findAll: sinon.stub()
  },
  ProductUnit: {
    findOne: sinon.stub(),
    findByPk: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    destroy: sinon.stub(),
    findAll: sinon.stub()
  },
  Product: {
    findOne: sinon.stub(),
    findByPk: sinon.stub(),
    create: sinon.stub(),
    update: sinon.stub(),
    destroy: sinon.stub(),
    findAll: sinon.stub()
  },
  Sequelize: {
    Op: {
      or: 'or',
      gt: 'gt',
      lt: 'lt',
      eq: 'eq',
      ne: 'ne',
      in: 'in',
      notIn: 'notIn',
      like: 'like',
      notLike: 'notLike',
      between: 'between',
      notBetween: 'notBetween',
      and: 'and'
    }
  }
};

jest.mock('../../models', () => mockDb);

afterEach(() => {
  Object.values(mockDb).forEach(model => {
    if (model && typeof model === 'object') {
      Object.values(model).forEach(method => {
        if (method && typeof method === 'function' && typeof method.reset === 'function') {
          method.reset();
        }
      });
    }
  });
});

module.exports = {
  expect,
  sinon,
  mockDb
};
