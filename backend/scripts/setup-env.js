#!/usr/bin/env node

/**
 * Environment Configuration Setup Script
 * 
 * This script helps to set up environment configuration files
 * for different environments (development, production, test).
 * 
 * Usage: 
 *   npm run setup-env [environment]
 * 
 * Example:
 *   npm run setup-env development
 *   npm run setup-env production
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Define environment presets
const ENV_PRESETS = {
  development: {
    NODE_ENV: 'development',
    PORT: '3000',
    MONGO_URI: 'mongodb://localhost:27017/momentdb',
    JWT_SECRET: generateRandomString(32),
    JWT_EXPIRE: '30d',
    CORS_ORIGIN: '*',
    LOG_LEVEL: 'debug',
    API_PREFIX: '/api',
    API_VERSION: 'v1',
    API_KEY: generateRandomString(32),
    RATE_LIMIT_MAX: '100',
    CSRF_PROTECTION: 'true'
  },
  production: {
    NODE_ENV: 'production',
    PORT: '3000',
    MONGO_URI: 'mongodb+srv://<username>:<password>@<cluster>/<dbname>',
    JWT_SECRET: generateRandomString(32),
    JWT_EXPIRE: '7d',
    CORS_ORIGIN: '',
    LOG_LEVEL: 'info',
    API_PREFIX: '/api',
    API_VERSION: 'v1',
    API_KEY: generateRandomString(48),
    RATE_LIMIT_MAX: '60',
    CSRF_PROTECTION: 'true'
  },
  test: {
    NODE_ENV: 'test',
    PORT: '3001',
    MONGO_URI: 'mongodb://localhost:27017/momentdb_test',
    JWT_SECRET: 'test_jwt_secret',
    JWT_EXPIRE: '1d',
    CORS_ORIGIN: '*',
    LOG_LEVEL: 'error',
    API_PREFIX: '/api',
    API_VERSION: 'v1',
    API_KEY: 'test_api_key',
    RATE_LIMIT_MAX: '1000',
    CSRF_PROTECTION: 'false'
  }
};

// Root directory of the project
const rootDir = path.resolve(__dirname, '..');

// Utility function to generate a random string (for JWT secrets and API keys)
function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Ask the user for input
 * @param {string} question - The question to ask
 * @param {string} defaultValue - Default value if user provides no input
 * @returns {Promise<string>} - User's answer
 */
function ask(question, defaultValue = '') {
  return new Promise((resolve) => {
    const defaultText = defaultValue ? ` (default: ${defaultValue})` : '';
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultValue);
    });
  });
}

/**
 * Generate an environment file
 * @param {Object} config - Environment configuration object
 * @param {string} filePath - Path to save the configuration file
 */
function generateEnvFile(config, filePath) {
  let envContent = '# Environment Configuration\n';
  envContent += `# Generated on ${new Date().toISOString()}\n\n`;

  for (const [key, value] of Object.entries(config)) {
    envContent += `${key}=${value}\n`;
  }

  fs.writeFileSync(filePath, envContent);
  console.log(`✅ Environment file created at: ${filePath}`);
}

/**
 * Main function to run the setup
 */
async function run() {
  try {
    console.log('\n🔧 Moment API - Environment Setup\n');

    // Get environment from command line args or prompt user
    let environment = process.argv[2];
    if (!environment || !ENV_PRESETS[environment]) {
      console.log('Available environments:');
      Object.keys(ENV_PRESETS).forEach(env => console.log(`  - ${env}`));
      environment = await ask('Select environment', 'development');
      
      if (!ENV_PRESETS[environment]) {
        console.error(`❌ Invalid environment: ${environment}`);
        process.exit(1);
      }
    }

    const config = { ...ENV_PRESETS[environment] };
    console.log(`\nSetting up ${environment} environment...\n`);

    // Ask for values or use defaults
    config.PORT = await ask('Port number', config.PORT);
    
    if (environment === 'production') {
      console.log('\n🔐 MongoDB Connection (for production, use your MongoDB Atlas connection string)');
      config.MONGO_URI = await ask('MongoDB URI', config.MONGO_URI);
    } else {
      config.MONGO_URI = await ask('MongoDB URI', config.MONGO_URI);
    }
    
    const useRandomSecret = await ask('Generate random JWT secret? (yes/no)', 'yes');
    if (useRandomSecret.toLowerCase() !== 'yes') {
      config.JWT_SECRET = await ask('JWT Secret', 'your_jwt_secret_key');
    }
    
    if (environment === 'production') {
      console.log('\n📡 CORS Configuration');
      console.log('For multiple origins, use comma-separated values (e.g., http://localhost:3000,https://yourapp.com)');
      config.CORS_ORIGIN = await ask('CORS Origins', 'https://yourapp.com');
    }

    const useRandomApiKey = await ask('Generate random API key? (yes/no)', 'yes');
    if (useRandomApiKey.toLowerCase() !== 'yes') {
      config.API_KEY = await ask('API Key', 'your_api_key_here');
    }

    config.RATE_LIMIT_MAX = await ask('Maximum requests per IP (per 15 minutes)', config.RATE_LIMIT_MAX);
    config.CSRF_PROTECTION = await ask('Enable CSRF Protection? (true/false)', config.CSRF_PROTECTION);

    // Create the .env file
    const envFilePath = path.join(rootDir, '.env');
    generateEnvFile(config, envFilePath);

    // Create additional environment-specific file
    const envSpecificFilePath = path.join(rootDir, `.env.${environment}`);
    generateEnvFile(config, envSpecificFilePath);

    console.log('\n✨ Environment setup complete!');
    console.log(`\nYou can now run your application in ${environment} mode.`);
    console.log('\nTo start the server:');
    console.log(`  npm run ${environment === 'production' ? 'start' : 'dev'}`);
    
  } catch (error) {
    console.error('\n❌ Error setting up environment:', error);
  } finally {
    rl.close();
  }
}

// Run the script
run(); 