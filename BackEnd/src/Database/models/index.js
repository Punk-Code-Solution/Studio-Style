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
let config;
try {
  config = require(__dirname + '/../config/config.json')[env];
} catch (configError) {
  console.warn('⚠️ Could not load config.json, will use DATABASE_URL or environment variables');
  config = null;
}
const db = {};

// Create Sequelize instance
let sequelize;

// Debug environment variables
console.log('Environment:', env);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);

try {
  // Prioritize DATABASE_URL if available (works for both production and Vercel deployments)
  if (process.env.DATABASE_URL) {
    console.log('📊 Using DATABASE_URL');
    
    try {
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
          },
          connectTimeout: 60000,
          requestTimeout: 60000,
          connectionTimeout: 60000
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 60000,
          idle: 10000
        },
        logging: false,
        define: {
          timestamps: false
        }
      });
    } catch (urlError) {
      console.error('❌ Error parsing DATABASE_URL:', urlError.message);
      throw urlError;
    }
  } else if (config && config.database && config.username && config.password) {
    console.log('🏠 Using local configuration from config.json');
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  } else {
    console.error('❌ No valid database configuration found');
    console.error('Expected DATABASE_URL environment variable or valid config.json');
    // Create a minimal sequelize instance to prevent crashes
    sequelize = new Sequelize('dummy', 'dummy', 'dummy', {
      dialect: 'postgres',
      logging: false,
      pool: { max: 0, min: 0 }
    });
    console.warn('⚠️ Using dummy database connection. Set DATABASE_URL or proper config.');
  }
  
  console.log('✅ Sequelize instance created successfully');
} catch (error) {
  console.error('❌ Failed to create Sequelize instance:', error.message);
  console.error('Full error:', error);
  // Don't throw in production to prevent function crashes
  // Create a minimal sequelize instance
  sequelize = new Sequelize('dummy', 'dummy', 'dummy', {
    dialect: 'postgres',
    logging: false,
    pool: { max: 0, min: 0 }
  });
  console.warn('⚠️ Using fallback dummy connection. Database operations may fail.');
}

try {
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
      try {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        if (model && model.name) {
          db[model.name] = model;
        }
      } catch (modelError) {
        console.error(`❌ Error loading model ${file}:`, modelError.message);
        // Continue loading other models
      }
    });

  Object.keys(db).forEach(modelName => {
    try {
      if (db[modelName].associate) {
        db[modelName].associate(db);
      }
    } catch (associateError) {
      console.error(`❌ Error associating model ${modelName}:`, associateError.message);
      // Continue with other models
    }
  });
} catch (loadError) {
  console.error('❌ Error loading models:', loadError.message);
  console.error('Full error:', loadError);
  // Continue - db object will have sequelize and Sequelize even if models fail
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
