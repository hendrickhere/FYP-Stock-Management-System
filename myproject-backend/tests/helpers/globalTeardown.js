const { Sequelize } = require('sequelize');
const { DB_CONFIG } = require('../../config/app.config');

async function teardownTestEnvironment() {
    console.log('Test environment teardown complete');
}

module.exports = teardownTestEnvironment;