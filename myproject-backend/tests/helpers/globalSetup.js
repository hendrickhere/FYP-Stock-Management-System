const { Sequelize } = require('sequelize');
const { DB_CONFIG } = require('../../config/app.config');

module.exports = async () => {
    process.env.NODE_ENV = 'test';

    const testConfig = DB_CONFIG.test;
    
    const sequelize = new Sequelize(
        testConfig.database,
        testConfig.username,
        testConfig.password,
        {
            host: testConfig.host,
            dialect: testConfig.dialect,
            logging: false 
        }
    );

    try {
        await sequelize.authenticate();
        console.log('✓ Test database connection verified');

        await sequelize.sync({ force: true });
        console.log('✓ Test database tables reset and synchronized');

    } catch (error) {
        console.error('❌ Test database setup failed:', error);
        throw error;
    } finally {
        await sequelize.close();
        console.log('✓ Database connection closed');
    }
};