// dotenv.js
// This file loads environment variables from a .env file into process.env

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const loadEnv = () => {
  // Determine which environment file to load based on NODE_ENV
  const environment = process.env.NODE_ENV || 'development';
  console.log(`Current environment: ${environment}`);
  
  const envFile = environment === 'production' ? '.env.prod' : '.env.dev';
  const envPath = path.resolve(process.cwd(), envFile);
  
  // Check if the file exists
  if (fs.existsSync(envPath)) {
    // Load environment variables from the file
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
      throw result.error;
    }
    
    console.log(`Environment variables loaded from ${envFile}`);
  } else {
    console.error(`Error: ${envFile} not found!`);
    process.exit(1);
  }
};

module.exports = loadEnv; 