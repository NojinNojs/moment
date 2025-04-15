#!/usr/bin/env node

/**
 * Frontend Environment Setup Script
 * 
 * This script helps to set up the frontend environment configuration
 * for different environments (local development or production).
 * It copies the API key from the backend environment if available.
 * 
 * Usage:
 *   node scripts/setup-env.js
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

// Handle ES Module dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root directories
const frontendRoot = path.resolve(__dirname, '..');
const backendRoot = path.resolve(frontendRoot, '..', 'backend');

// Environment file paths
const frontendEnvExample = path.join(frontendRoot, '.env.example');
// const frontendEnvLocal = path.join(frontendRoot, '.env.local'); // Output path determined later
const backendEnvFile = path.join(backendRoot, '.env'); // We primarily check the main backend .env for API key

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
 * Read backend API key from .env file
 * @returns {string|null} API key or null if not found
 */
function readBackendApiKey() {
  try {
    // Prioritize backend .env, as it's often used for local dev consistency
    if (fs.existsSync(backendEnvFile)) {
      const envContent = fs.readFileSync(backendEnvFile, 'utf8');
      const apiKeyMatch = envContent.match(/^API_KEY=(.+)$/m); // Use multiline match
      if (apiKeyMatch && apiKeyMatch[1]) {
        return apiKeyMatch[1].trim();
      }
    }
    // Optional: Could add logic here to check backend/.env.production if needed,
    // but typically API key should be consistent or managed via deployment envs.
    return null;
  } catch (error) {
    console.error(chalk.red('Error reading backend API key:'), error.message);
    return null;
  }
}

/**
 * Generate random API key
 * @returns {string} Random API key
 */
function generateRandomApiKey(length = 32) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

/**
 * Create frontend environment file
 * @param {Object} config - Environment configuration
 * @param {string} filePath - The full path for the output .env file
 */
function createFrontendEnvFile(config, filePath) {
  let envContent = '# Frontend Environment Variables\n';
  envContent += `# Generated for ${path.basename(filePath)} on ${new Date().toISOString()}\n\n`;

  for (const [key, value] of Object.entries(config)) {
    // Ensure values containing spaces are quoted if necessary, although typical for .env
    const formattedValue = String(value).includes(' ') ? `"${value}"` : value;
    envContent += `${key}=${formattedValue}\n`;
  }

  fs.writeFileSync(filePath, envContent);
  console.log(chalk.green(`✅ Environment file created at: ${filePath}`));
}

/**
 * Read frontend .env.example file
 * @returns {Object} Environment configuration from the example file
 */
function readFrontendEnvExample() {
  try {
    if (fs.existsSync(frontendEnvExample)) {
      const envContent = fs.readFileSync(frontendEnvExample, 'utf8');
      const configMap = {};
      
      envContent.split(/\r?\n/).forEach(line => { // Handle different line endings
        // Skip comments and empty lines
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=').trim(); // Handle values with '='
          if (key && value) {
            // Remove surrounding quotes if present
            configMap[key.trim()] = value.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
          }
        }
      });
      
      return configMap;
    }
    console.warn(chalk.yellow(`⚠️ Could not find ${frontendEnvExample}. Using empty base config.`));
    return {};
  } catch (error) {
    console.error(chalk.red('Error reading frontend env example:'), error.message);
    return {};
  }
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.cyan('\n🔧 Frontend Environment Setup\n'));
  
  // Ask for target environment
  const targetEnv = await ask('Which environment to set up? (local / production)', 'local');
  if (targetEnv.toLowerCase() !== 'local' && targetEnv.toLowerCase() !== 'production') {
    console.error(chalk.red('❌ Invalid environment. Please choose "local" or "production".'));
    process.exit(1);
  }

  const isProduction = targetEnv.toLowerCase() === 'production';
  const outputFileName = isProduction ? '.env.production' : '.env.local';
  const outputFilePath = path.join(frontendRoot, outputFileName);
  
  console.log(chalk.yellow(`\nSetting up for ${chalk.bold(targetEnv)} environment... Output file: ${chalk.cyan(outputFileName)}\n`));

  // Read frontend .env.example for defaults
  const config = readFrontendEnvExample();
  
  // --- API Key Setup ---
  console.log(chalk.blue('🔑 API Key Configuration'));
  const backendApiKey = readBackendApiKey(); // Reads from backend/.env primarily
  
  if (backendApiKey) {
    console.log(chalk.green('   ✅ Found backend API key in backend/.env'));
    config.VITE_API_KEY = backendApiKey;
  } else {
    console.log(chalk.yellow('   ⚠️ Backend API key not found in backend/.env'));
    
    const useGeneratedKey = await ask('   Generate a random API key for frontend? (yes/no)', 'yes');
    
    if (useGeneratedKey.toLowerCase() === 'yes') {
      config.VITE_API_KEY = generateRandomApiKey();
      console.log(chalk.green('   ✅ Generated random API key'));
      
      // Warning if we had to generate a key
      console.log(chalk.yellow('   ⚠️ Ensure this API key matches the key used by your backend environment:'));
      console.log(chalk.cyan(`      VITE_API_KEY=${config.VITE_API_KEY}`));
      if (!isProduction && fs.existsSync(backendEnvFile)) {
         console.log(chalk.yellow(`      You might need to update API_KEY in ${backendEnvFile}`));
      } else if (isProduction) {
         console.log(chalk.yellow(`      Ensure the API_KEY in your production backend environment matches.`));
      }

    } else {
      config.VITE_API_KEY = await ask('   Enter the API key to use for the frontend');
      if (!config.VITE_API_KEY) {
        console.error(chalk.red('❌ API Key cannot be empty. Exiting.'));
        process.exit(1);
      }
       console.log(chalk.yellow('   ⚠️ Ensure this manually entered API key matches the key expected by your backend.'));
    }
  }
  
  // --- API URL Setup ---
  console.log(chalk.blue('\n🔗 API URL Configuration'));
  const defaultApiUrl = isProduction 
    ? (config.VITE_API_URL && config.VITE_API_URL !== 'http://localhost:3000/api/v1' ? config.VITE_API_URL : 'https://your-app-name.herokuapp.com/api/v1') 
    : (config.VITE_API_URL || 'http://localhost:3000/api/v1');
  config.VITE_API_URL = await ask(`   Enter API URL for ${targetEnv}`, defaultApiUrl);
  
  if (isProduction) {
    console.log(chalk.yellow('   ⚠️ If using Heroku, your backend URL should look like: https://your-app-name.herokuapp.com/api/v1'));
  }
  
  // --- Other Configurations ---
  console.log(chalk.blue('\n⚙️ Other Configurations'));
  config.VITE_APP_NAME = await ask(`   Enter App Name`, config.VITE_APP_NAME || 'Moment');
  config.VITE_ENABLE_DARK_MODE = await ask(`   Enable Dark Mode by default? (true/false)`, config.VITE_ENABLE_DARK_MODE || 'true');
  config.VITE_MAX_UPLOAD_SIZE = await ask(`   Max Upload Size (bytes)`, config.VITE_MAX_UPLOAD_SIZE || '5242880');
  // Add more prompts here if needed, potentially based on isProduction flag

  // Create frontend env file
  createFrontendEnvFile(config, outputFilePath);
  
  console.log(chalk.green(`\n✅ Frontend ${targetEnv} environment setup complete!`));
  console.log(chalk.yellow(`   Review the generated file: ${outputFilePath}`));
  if (isProduction) {
     console.log(chalk.yellow(`   Ensure all values in ${outputFileName} are correct for your production deployment.`));
  } else {
     console.log(chalk.yellow(`   You can now run ${chalk.cyan('npm run dev')}`));
  }
  console.log(''); // Newline for cleaner exit
  
  rl.close();
}

// Run the script
main().catch(error => {
  console.error(chalk.red('\n❌ Error setting up environment:'), error);
  process.exit(1);
}); 