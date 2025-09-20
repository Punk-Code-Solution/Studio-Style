'use strict';

// Force import of pg module for Vercel compatibility
try {
  require('pg');
  console.log('✅ pg module loaded successfully');
} catch (error) {
  console.warn('Warning: pg module not found, using fallback');
  console.error('pg import error:', error.message);
}

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const createSequelizeInstance = require('./sequelize-config');

const db = {};

// Create Sequelize instance using the new configuration
let sequelize;
try {
  sequelize = createSequelizeInstance();
  console.log('✅ Sequelize instance created successfully');
} catch (error) {
  console.error('❌ Failed to create Sequelize instance:', error.message);
  throw error;
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
