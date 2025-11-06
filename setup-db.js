'use strict';

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Error: DATABASE_URL not found in .env file');
  console.error('Please create a .env file with DATABASE_URL=postgres://username:password@localhost:5432/salesdb');
  process.exit(1);
}

// Parse the database name from the connection string
function parseDatabaseName(url) {
  try {
    const urlObj = new URL(url);
    const dbName = urlObj.pathname.slice(1); // Remove leading '/'
    return { dbName, baseUrl: url.replace(`/${dbName}`, '/postgres') };
  } catch (err) {
    // Fallback: try to extract from string
    const match = url.match(/\/\/([^\/]+)\/(.+)$/);
    if (match) {
      const dbName = match[2].split('?')[0]; // Remove query params
      const baseUrl = url.replace(`/${dbName}`, '/postgres');
      return { dbName, baseUrl };
    }
    throw new Error('Could not parse DATABASE_URL');
  }
}

async function createDatabaseIfNotExists(baseUrl, dbName) {
  const adminPool = new Pool({ connectionString: baseUrl });
  try {
    const result = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    
    if (result.rows.length === 0) {
      console.log(`Creating database "${dbName}"...`);
      // Escape database name: wrap in double quotes and escape any quotes inside
      const escapedDbName = `"${dbName.replace(/"/g, '""')}"`;
      await adminPool.query(`CREATE DATABASE ${escapedDbName}`);
      console.log(`✅ Database "${dbName}" created.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } finally {
    await adminPool.end();
  }
}

async function setupDatabase() {
  let pool;
  try {
    const { dbName, baseUrl } = parseDatabaseName(connectionString);
    
    // First, create the database if it doesn't exist
    await createDatabaseIfNotExists(baseUrl, dbName);
    
    // Now connect to the target database
    pool = new Pool({ connectionString });
    
    console.log('Reading db.sql...');
    const sqlPath = path.join(__dirname, 'db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Connecting to database...');
    await pool.query('SELECT 1'); // Test connection
    
    console.log('Executing schema...');
    await pool.query(sql);
    
    console.log('✅ Database schema created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error setting up database:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('\nMake sure PostgreSQL is running and DATABASE_URL is correct.');
    } else if (err.code === '3D000') {
      console.error('\nDatabase does not exist and could not be created. Check PostgreSQL permissions.');
    }
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
}

setupDatabase();

