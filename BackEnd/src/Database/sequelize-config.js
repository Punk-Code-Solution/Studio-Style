// Sequelize configuration for Vercel
const { Sequelize } = require('sequelize');

function createSequelizeInstance() {
  const env = process.env.NODE_ENV || 'development';
  
  console.log('🔧 Creating Sequelize instance for environment:', env);
  
  if (env === 'production' && process.env.DATABASE_URL) {
    console.log('📊 Using DATABASE_URL for production');
    
    // Parse DATABASE_URL to extract components
    const url = new URL(process.env.DATABASE_URL);
    
    return new Sequelize({
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
        acquire: 30000,
        idle: 10000
      },
      logging: false,
      define: {
        timestamps: false
      }
    });
  } else {
    console.log('🏠 Using local configuration');
    const config = require('./config/config.json')[env];
    return new Sequelize(config.database, config.username, config.password, config);
  }
}

module.exports = createSequelizeInstance;
