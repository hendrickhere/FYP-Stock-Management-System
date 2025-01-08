const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const { Sequelize } = require('sequelize');

// Configure chai with sinon-chai
chai.use(sinonChai);

const { expect } = chai;

// Create a test database connection
const sequelize = new Sequelize('sqlite::memory:', {
    logging: false
});

// Export test utilities
module.exports = {
    expect,
    sequelize,
    sinon,
    chai
};
