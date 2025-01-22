const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const { DB_CONFIG } = require(__dirname + "/../config/app.config.js");
const config = DB_CONFIG[env];
const sequelize = require('../config/db-config');
const db = {};

// If database is disabled, return mock db object
if (process.env.INITIALIZE_DB === 'false') {
    console.log('Database initialization skipped, using mock models');
    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
    // Add mock models
    const mockModel = {
        findAll: () => Promise.resolve([]),
        findOne: () => Promise.resolve(null),
        create: (data) => Promise.resolve(data),
        update: () => Promise.resolve([1]),
        destroy: () => Promise.resolve(1)
    };
    // Add commonly used models
    db.User = mockModel;
    db.Organization = mockModel;
    db.Product = mockModel;
    db.Order = mockModel;
    module.exports = db;
    return;
}

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
    const model = require(path.join(__dirname, file))(sequelize, Sequelize);
    db[model.name] = model;
  });

// Load associations after all models are loaded
const associationPath = path.join(__dirname, 'association.js');
if (fs.existsSync(associationPath)) {
  require(associationPath)(db);
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;