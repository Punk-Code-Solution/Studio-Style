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
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

// Create Sequelize instance
let sequelize;

// Debug environment variables
console.log('Environment:', env);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);

try {
  if (env === 'production' && process.env.DATABASE_URL) {
    console.log('📊 Using DATABASE_URL for production');
    
    // Parse DATABASE_URL to extract components
    const url = new URL(process.env.DATABASE_URL);
    
    sequelize = new Sequelize({
      database: url.pathname.slice(1), // Remove leading slash
      username: url.username,
      password: url.password,
      host: url.hostname,
      port: url.port || 5432,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 60000,
        idle: 10000
      },
      dialectOptions: {
        connectTimeout: 60000,
        requestTimeout: 60000,
        connectionTimeout: 60000
      },
      logging: false,
      define: {
        timestamps: false
      }
    });
  } else {
    console.log('🏠 Using local configuration');
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }
  
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
