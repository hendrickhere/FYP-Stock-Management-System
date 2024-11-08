const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const { DB_CONFIG } = require(__dirname + "/../config/app.config.js");
const config = DB_CONFIG[env];
const sequelize = require('../config/db-config');
const db = {};

console.log('Files in directory:', fs.readdirSync(__dirname));
// Load all models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 && 
      file !== basename && 
      file !== 'association.js' &&  // Exclude association file from initial load
      file.slice(-3) === '.js' &&
      !file.includes('.test.js') // Exclude test files
    );
  })
  .forEach(file => {
      console.log(`Loading model from file: ${file}`);
      const Model = require(path.join(__dirname, file));
      if (typeof Model === 'function') {
        const model = Model.init(sequelize);
        const modelName = Model.name;
        db[modelName] = model;
        console.log(`Model ${modelName} loaded and initialized:`, !!db[modelName]);
      }
    });

console.log('\nVerifying loaded models:');
['User', 'Customer', 'SalesOrder', 'Product', 'Organization', 'SalesOrderInventory'].forEach(modelName => {
  console.log(`${modelName} model loaded:`, !!db[modelName]);
});

// Load associations after all models are initialized
require('./association')(db);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Test the database connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = db;