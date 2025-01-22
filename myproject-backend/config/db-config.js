const { Sequelize } = require('sequelize');
const { DB_CONFIG } = require('./app.config');

// Check if database should be initialized
const shouldInitializeDb = process.env.INITIALIZE_DB !== 'false';

// Get the configuration for the current environment
const env = process.env.NODE_ENV || 'development';
const config = DB_CONFIG[env];

let sequelize = null;

if (shouldInitializeDb) {
    // Create Sequelize instance
    sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        {
            host: config.host,
            dialect: config.dialect,
            logging: console.log,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            },
            dialectOptions: {
                statement_timeout: 30000,
                idle_in_transaction_session_timeout: 30000
            }
        }
    );

    // Test the connection
    sequelize
        .authenticate()
        .then(() => {
            console.log('Database connection established successfully.');
        })
        .catch(err => {
            console.error('Unable to connect to the database:', err);
        });
} else {
    console.log('Database initialization skipped');
    // Create a mock sequelize object with basic functionality
    sequelize = {
        authenticate: () => Promise.resolve(),
        sync: () => Promise.resolve(),
        define: () => ({
            findAll: () => Promise.resolve([]),
            findOne: () => Promise.resolve(null),
            create: (data) => Promise.resolve(data),
            update: () => Promise.resolve([1]),
            destroy: () => Promise.resolve(1)
        })
    };
}

module.exports = sequelize;