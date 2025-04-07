/**
 * PostgreSQL Environment Setup Script for VoteHub
 * 
 * This script helps you set up the PostgreSQL connection string environment variable.
 * 
 * Usage:
 * node setup-postgres-env.js your-password
 * 
 * Prerequisites:
 * - Node.js installed
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const [,, password] = process.argv;

// Validate input
if (!password) {
  console.error('\x1b[31mError: Missing password argument!\x1b[0m');
  console.log('\nUsage:');
  console.log('  node setup-postgres-env.js your-password\n');
  console.log('Where:');
  console.log('  - your-password is your PostgreSQL database password\n');
  process.exit(1);
}

// Create .env content with the direct PostgreSQL connection
const envContent = `PORT=5000
DATABASE_URL=postgresql://postgres:${password}@db.onqdltwevkeeptipypjl.supabase.co:5432/postgres
SUPABASE_URL=https://onqdltwevkeeptipypjl.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET=noelregis_voting_app_secret_key
JWT_EXPIRE=30d
`;

// Path to .env file
const envPath = path.join(__dirname, 'server', '.env');

// Write to .env file
try {
  fs.writeFileSync(envPath, envContent);
  console.log('\x1b[32mSuccess! Environment variables set up for PostgreSQL.\x1b[0m');
  console.log(`\nEnvironment file created at: ${envPath}`);
  console.log('\nNext steps:');
  console.log('1. Run the SQL script to set up the database tables:');
  console.log('   Copy the SQL from server/setup-supabase.js and run it in your database');
  console.log('2. Install the pg package: cd server && npm install pg');
  console.log('3. Start the server: cd server && npm start');
  console.log('4. Start the client: cd client && npm start\n');
} catch (err) {
  console.error('\x1b[31mError writing .env file:\x1b[0m', err.message);
  process.exit(1);
} 