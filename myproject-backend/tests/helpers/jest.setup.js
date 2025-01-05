const chai = require('chai');
const sinonChai = require('sinon-chai');
const { Sequelize } = require('sequelize');

// Configure chai
chai.use(sinonChai);
const { expect } = chai;

// Create a test database connection
const sequelize = new Sequelize('sqlite::memory:', {
    logging: false
});

module.exports = {
    expect,
    sequelize
};
