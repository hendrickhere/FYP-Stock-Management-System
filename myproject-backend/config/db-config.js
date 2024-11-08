const { Sequelize } = require('sequelize');
const { DB_CONFIG } = require('./app.config');

// Get the configuration for the current environment
const env = process.env.NODE_ENV || 'development';
const config = DB_CONFIG[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: console.log 
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

module.exports = sequelize;