/**
 * Supabase Environment Setup Script for VoteHub
 * 
 * This script helps you set up Supabase environment variables.
 * It takes your Supabase URL and API key as arguments and updates the .env file.
 * 
 * Usage:
 * node setup-supabase-env.js your-project-url.supabase.co your-anon-key
 * 
 * Prerequisites:
 * - Node.js installed
 * - A Supabase project created
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const [,, supabaseUrl, supabaseKey] = process.argv;

// Validate input
if (!supabaseUrl || !supabaseKey) {
  console.error('\x1b[31mError: Missing arguments!\x1b[0m');
  console.log('\nUsage:');
  console.log('  node setup-supabase-env.js your-project-url.supabase.co your-anon-key\n');
  console.log('Where:');
  console.log('  - your-project-url.supabase.co is your Supabase project URL');
  console.log('  - your-anon-key is your Supabase anon/public key\n');
  console.log('You can find these values in your Supabase dashboard under:');
  console.log('Project Settings > API > Project URL and anon key\n');
  process.exit(1);
}

// Format URL correctly
const formattedUrl = supabaseUrl.startsWith('https://') 
  ? supabaseUrl 
  : `https://${supabaseUrl}`;

// Create .env content
const envContent = `PORT=5000
SUPABASE_URL=${formattedUrl}
SUPABASE_KEY=${supabaseKey}
JWT_SECRET=noelregis_voting_app_secret_key
JWT_EXPIRE=30d
`;

// Path to .env file
const envPath = path.join(__dirname, 'server', '.env');

// Write to .env file
try {
  fs.writeFileSync(envPath, envContent);
  console.log('\x1b[32mSuccess! Environment variables set up for Supabase.\x1b[0m');
  console.log(`\nEnvironment file created at: ${envPath}`);
  console.log('\nNext steps:');
  console.log('1. Set up your Supabase database tables by running the SQL in server/setup-supabase.js');
  console.log('2. Start the server: cd server && npm start');
  console.log('3. Start the client: cd client && npm start\n');
} catch (err) {
  console.error('\x1b[31mError writing .env file:\x1b[0m', err.message);
  process.exit(1);
} 