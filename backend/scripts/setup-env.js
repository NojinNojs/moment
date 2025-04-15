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
    CSRF_PROTECTION: 'true',
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'Password123!',
    ADMIN_NAME: 'Admin User',
    AUTO_SEED_CATEGORIES: 'true',
    USE_ADVANCED_CATEGORIES: 'true',
    // ML Service Configuration
    ML_SERVICE_URL: 'http://localhost:8000',
    ML_REQUEST_TIMEOUT: '5000',
    ENABLE_ML_CACHE: 'true',
    ML_CONFIDENCE_THRESHOLD: '0.7',
    ML_LOGGING: 'true'
  },
  production: {
    NODE_ENV: 'production',
    PORT: '3000', // Heroku sets this automatically
    MONGO_URI: 'mongodb+srv://<username>:<password>@<cluster>/<dbname>',
    JWT_SECRET: generateRandomString(32),
    JWT_EXPIRE: '7d',
    CORS_ORIGIN: '*', // Update this with your Vercel frontend URL
    LOG_LEVEL: 'info',
    API_PREFIX: '/api',
    API_VERSION: 'v1',
    API_KEY: generateRandomString(48),
    RATE_LIMIT_MAX: '60',
    CSRF_PROTECTION: 'false', // Initially disabled for ease of setup
    ADMIN_EMAIL: 'admin@yourdomain.com',
    ADMIN_PASSWORD: generateRandomString(12),
    ADMIN_NAME: 'Admin User',
    AUTO_SEED_CATEGORIES: 'false',
    USE_ADVANCED_CATEGORIES: 'true',
    // Heroku specific configuration
    TRUST_PROXY: 'true',
    TRUST_PROXY_HOPS: '1',
    // ML Service Configuration
    ML_SERVICE_URL: 'http://ml-service:8000', // Usually a Docker service name in production
    ML_REQUEST_TIMEOUT: '3000',
    ENABLE_ML_CACHE: 'true',
    ML_CONFIDENCE_THRESHOLD: '0.75',
    ML_LOGGING: 'true'
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
    CSRF_PROTECTION: 'false',
    ADMIN_EMAIL: 'admin@test.com',
    ADMIN_PASSWORD: 'test_password',
    ADMIN_NAME: 'Test Admin',
    AUTO_SEED_CATEGORIES: 'true',
    USE_ADVANCED_CATEGORIES: 'false',
    // ML Service Configuration
    ML_SERVICE_URL: 'http://localhost:8000',
    ML_REQUEST_TIMEOUT: '1000',
    ENABLE_ML_CACHE: 'false', // Disable cache for tests
    ML_CONFIDENCE_THRESHOLD: '0.5',
    ML_LOGGING: 'false'
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
    config.PORT = await ask('Port number (Note: Heroku will override this)', config.PORT);
    
    if (environment === 'production') {
      console.log('\n🔐 MongoDB Connection (for production, use your MongoDB Atlas connection string)');
      config.MONGO_URI = await ask('MongoDB URI', config.MONGO_URI);
      
      console.log('\n🚀 Heroku Configuration');
      config.TRUST_PROXY = await ask('Enable Trust Proxy for Heroku? (true/false)', 'true');
      config.TRUST_PROXY_HOPS = await ask('Trust Proxy Hops', '1');
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
    
    // Admin user settings
    console.log('\n👤 Admin User Configuration');
    config.ADMIN_EMAIL = await ask('Admin Email', config.ADMIN_EMAIL);
    
    const useRandomAdminPassword = await ask('Generate random admin password? (yes/no)', environment === 'production' ? 'yes' : 'no');
    if (useRandomAdminPassword.toLowerCase() === 'yes') {
      config.ADMIN_PASSWORD = generateRandomString(12);
      console.log(`Generated admin password: ${config.ADMIN_PASSWORD}`);
      console.log('⚠️ Please save this password securely as it won\'t be shown again');
    } else {
      config.ADMIN_PASSWORD = await ask('Admin Password', config.ADMIN_PASSWORD);
    }
    
    config.ADMIN_NAME = await ask('Admin Name', config.ADMIN_NAME);
    
    // Category configuration
    console.log('\n📊 Category Configuration');
    config.AUTO_SEED_CATEGORIES = await ask('Auto-seed categories on startup? (true/false)', config.AUTO_SEED_CATEGORIES);
    config.USE_ADVANCED_CATEGORIES = await ask('Use advanced category set? (true/false)', config.USE_ADVANCED_CATEGORIES);

    // ML Service configuration
    console.log('\n🧠 ML Service Configuration');
    config.ML_SERVICE_URL = await ask('ML Service URL', config.ML_SERVICE_URL);
    config.ML_REQUEST_TIMEOUT = await ask('ML Request Timeout (ms)', config.ML_REQUEST_TIMEOUT);
    config.ENABLE_ML_CACHE = await ask('Enable ML Prediction Cache? (true/false)', config.ENABLE_ML_CACHE);
    config.ML_CONFIDENCE_THRESHOLD = await ask('ML Confidence Threshold (0.0-1.0)', config.ML_CONFIDENCE_THRESHOLD);
    config.ML_LOGGING = await ask('Enable ML Specific Logging? (true/false)', config.ML_LOGGING);

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