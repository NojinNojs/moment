#!/usr/bin/env node

/**
 * Frontend Environment Setup Script
 * 
 * This script helps to set up the frontend environment configuration
 * by copying the API key from the backend environment.
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
const frontendEnvLocal = path.join(frontendRoot, '.env.local');
const backendEnvFile = path.join(backendRoot, '.env');

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
    if (fs.existsSync(backendEnvFile)) {
      const envContent = fs.readFileSync(backendEnvFile, 'utf8');
      const apiKeyMatch = envContent.match(/API_KEY=(.+)(\r?\n|$)/);
      if (apiKeyMatch && apiKeyMatch[1]) {
        return apiKeyMatch[1];
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading backend API key:', error.message);
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
 * Create frontend .env.local file
 * @param {Object} config - Environment configuration
 */
function createFrontendEnvFile(config) {
  let envContent = '# Frontend Environment Variables\n';
  envContent += `# Generated on ${new Date().toISOString()}\n\n`;

  for (const [key, value] of Object.entries(config)) {
    envContent += `${key}=${value}\n`;
  }

  fs.writeFileSync(frontendEnvLocal, envContent);
  console.log(chalk.green(`✅ Environment file created at: ${frontendEnvLocal}`));
}

/**
 * Read frontend .env.example file
 * @returns {Object} Environment configuration
 */
function readFrontendEnvExample() {
  try {
    if (fs.existsSync(frontendEnvExample)) {
      const envContent = fs.readFileSync(frontendEnvExample, 'utf8');
      const configMap = {};
      
      envContent.split('\n').forEach(line => {
        // Skip comments and empty lines
        if (line.trim() && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value) {
            configMap[key.trim()] = value.trim();
          }
        }
      });
      
      return configMap;
    }
    return {};
  } catch (error) {
    console.error('Error reading frontend env example:', error.message);
    return {};
  }
}

/**
 * Main function
 */
async function main() {
  console.log(chalk.cyan('\n🔧 Frontend Environment Setup\n'));
  
  // Read frontend .env.example
  const config = readFrontendEnvExample();
  
  // Read backend API key
  const backendApiKey = readBackendApiKey();
  
  if (backendApiKey) {
    console.log(chalk.green('✅ Found backend API key'));
    config.VITE_API_KEY = backendApiKey;
  } else {
    console.log(chalk.yellow('⚠️ Backend API key not found'));
    
    const useGeneratedKey = await ask('Generate a random API key? (yes/no)', 'yes');
    
    if (useGeneratedKey.toLowerCase() === 'yes') {
      config.VITE_API_KEY = generateRandomApiKey();
      console.log(chalk.green('✅ Generated random API key'));
      
      // Warning if we had to generate a key and backend exists
      if (fs.existsSync(backendRoot)) {
        console.log(chalk.yellow('⚠️ Make sure to update your backend .env file with this API key:'));
        console.log(chalk.cyan(`   API_KEY=${config.VITE_API_KEY}`));
      }
    } else {
      config.VITE_API_KEY = await ask('Enter API key');
    }
  }
  
  // Ask for API URL
  config.VITE_API_URL = await ask('API URL', config.VITE_API_URL);
  
  // Ask for other configuration
  config.VITE_APP_NAME = await ask('App Name', config.VITE_APP_NAME);
  config.VITE_ENABLE_DARK_MODE = await ask('Enable Dark Mode? (true/false)', config.VITE_ENABLE_DARK_MODE);
  
  // Create frontend .env.local file
  createFrontendEnvFile(config);
  
  console.log(chalk.green('\n✅ Frontend environment setup complete!\n'));
  
  rl.close();
}

// Run the script
main().catch(error => {
  console.error(chalk.red('\n❌ Error setting up environment:'), error);
  process.exit(1);
}); 