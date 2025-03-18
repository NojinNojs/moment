// This file loads environment variables from a .env file into process.env
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

/**
 * Load environment variables from .env files
 * Priority order:
 * 1. .env.{NODE_ENV} (e.g. .env.development, .env.production)
 * 2. .env (default fallback)
 */
const loadEnv = () => {
  // Determine which environment file to load based on NODE_ENV
  const environment = process.env.NODE_ENV || 'development';
  console.log(`Current environment: ${environment}`);
  
  // Define possible environment file paths
  const envPaths = [
    path.resolve(process.cwd(), `.env.${environment}`), // Environment-specific file (first priority)
    path.resolve(process.cwd(), '.env')                 // Default fallback file
  ];
  
  // Try to load environment variables from the first file that exists
  let loaded = false;
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const result = dotenv.config({ path: envPath });
      
      if (result.error) {
        console.warn(`Warning: Error loading ${envPath}:`, result.error);
        continue;
      }
      
      console.log(`Environment variables loaded from ${path.basename(envPath)}`);
      loaded = true;
      break;
    }
  }
  
  // No environment file found - log warning but continue
  if (!loaded) {
    console.warn('Warning: No environment file found! Using existing environment variables.');
    console.warn('Run `npm run setup-env` to create your environment configuration.');
    // We don't exit the process here, allowing the app to continue with existing environment variables
  }
  
  // Validate required environment variables
  const requiredVars = ['PORT', 'MONGO_URI', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Error: Missing required environment variables:', missingVars.join(', '));
    console.error('Please run `npm run setup-env` to configure your environment.');
    process.exit(1);
  }
};

module.exports = loadEnv; 