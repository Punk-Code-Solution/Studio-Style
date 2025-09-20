// Vercel PostgreSQL Fix
// This file ensures pg module is properly loaded for Vercel deployment

const { Client } = require('pg');

// Test connection to ensure pg is working
async function testPgConnection() {
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    await client.connect();
    console.log('✅ PostgreSQL connection test successful');
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ PostgreSQL connection test failed:', error.message);
    return false;
  }
}

module.exports = {
  testPgConnection
};
