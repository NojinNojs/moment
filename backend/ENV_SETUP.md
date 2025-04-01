# Environment Setup Guide for Moment API

This document provides detailed instructions for configuring environment variables for the Moment API backend. Proper environment configuration is essential for both development and production environments.

## 📚 Table of Contents

- [Quick Start](#quick-start)
- [Understanding Environment Files](#understanding-environment-files)
- [Required Environment Variables](#required-environment-variables)
- [Manual Setup](#manual-setup)
- [Environment Selection](#environment-selection)
- [Advanced Configuration](#advanced-configuration)
  - [Database Configuration](#database-configuration)
  - [Authentication Settings](#authentication-settings)
  - [API Configuration](#api-configuration)
  - [Security Settings](#security-settings)
  - [Logging Configuration](#logging-configuration)
- [Automated Environment Scripts](#automated-environment-scripts)
- [Production Environment Setup](#production-environment-setup)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## ⚡ Quick Start

The fastest way to set up your environment is to use the provided setup script:

```bash
# Interactive setup (recommended for first-time setup)
npm run setup-env

# Or set up a specific environment directly
npm run setup-dev   # Development environment
npm run setup-prod  # Production environment
npm run setup-test  # Test environment
```

The script will guide you through setting up all necessary configuration variables with sensible defaults.

## 📑 Understanding Environment Files

The application uses multiple `.env` files to configure different environments:

- `.env` - Default configuration file (loaded for all environments)
- `.env.development` - Development-specific configuration (overrides defaults)
- `.env.production` - Production-specific configuration (overrides defaults)
- `.env.test` - Testing-specific configuration (overrides defaults)

The environment loader prioritizes environment-specific files over the default `.env` file based on the current `NODE_ENV` value.

## 🔑 Required Environment Variables

These variables are required for the application to function properly:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | Yes |
| `PORT` | Server port number | `3000` | Yes |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/momentdb` | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | `a-random-32-character-string` | Yes |
| `JWT_EXPIRE` | JWT token expiration time | `30d` | Yes |
| `CORS_ORIGIN` | Allowed origins for CORS | `*` or `https://example.com` | Yes |
| `LOG_LEVEL` | Logging level | `debug`, `info`, `warn`, `error` | Yes |
| `API_PREFIX` | API route prefix | `/api` | Yes |
| `API_VERSION` | API version | `v1` | Yes |

## 🛠️ Manual Setup

If you prefer to set up your environment manually:

1. **Copy the template file**
   ```bash
   cp .env.example .env
   ```

2. **Edit the environment file**
   ```bash
   # Using your preferred text editor
   nano .env
   
   # Or using VS Code
   code .env
   ```

3. **Create environment-specific configuration files** (optional)
   ```bash
   # For development
   cp .env .env.development
   
   # For production
   cp .env .env.production
   
   # For testing
   cp .env .env.test
   ```

4. **Customize each environment file** as needed

## 🔄 Environment Selection

The application automatically selects the appropriate environment based on the `NODE_ENV` environment variable:

```bash
# Start the server in development mode
NODE_ENV=development npm run dev

# Start the server in production mode
NODE_ENV=production npm start

# Run tests in test environment
NODE_ENV=test npm test
```

You can also set the environment in your `.env` file, but command-line settings will take precedence.

## ⚙️ Advanced Configuration

### Database Configuration

```bash
# MongoDB connection string (local)
MONGO_URI=mongodb://localhost:27017/momentdb

# MongoDB connection string (Atlas)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/momentdb?retryWrites=true&w=majority

# Database options
MONGO_DEBUG=false           # Log database queries (development only)
MONGO_POOL_SIZE=10          # Connection pool size
```

### Authentication Settings

```bash
# JWT configuration
JWT_SECRET=your-secret-key-at-least-32-characters-long
JWT_EXPIRE=30d              # Token expiration (30 days)
JWT_COOKIE_EXPIRE=30        # Cookie expiration in days

# Token settings
TOKEN_TYPE=Bearer           # Token type in Authorization header
REFRESH_TOKEN_EXPIRE=60d    # Refresh token expiration (if used)
```

### API Configuration

```bash
# API settings
API_PREFIX=/api             # API route prefix
API_VERSION=v1              # API version
API_TIMEOUT=30000           # Request timeout in milliseconds
API_RATE_LIMIT=100          # Rate limit (requests per window)
API_RATE_LIMIT_WINDOW=15    # Rate limit window in minutes
```

### Security Settings

```bash
# CORS configuration
CORS_ORIGIN=http://localhost:5173  # Allowed origin(s)
CORS_METHODS=GET,POST,PUT,DELETE   # Allowed methods
CORS_CREDENTIALS=true              # Allow credentials

# Security settings
ENABLE_HELMET=true                 # Enable Helmet security headers
ENABLE_RATE_LIMIT=true             # Enable rate limiting
TRUST_PROXY=1                      # Trust proxy hop count (for reverse proxies)
```

### Logging Configuration

```bash
# Logging settings
LOG_LEVEL=debug            # Log level (debug, info, warn, error)
LOG_FORMAT=combined        # Log format (combined, common, dev, short, tiny)
LOG_DIR=./logs             # Log directory
LOG_FILE=app.log           # Log file name
LOG_MAX_SIZE=10m           # Maximum log file size
LOG_MAX_FILES=5            # Maximum number of log files
```

## 🤖 Automated Environment Scripts

The application provides several scripts to manage environment variables:

```bash
# Initialize all environment files
npm run init-env

# Set up for development
npm run setup-dev

# Set up for production
npm run setup-prod

# Set up for testing
npm run setup-test

# Run environment validation
npm run validate-env
```

These scripts automatically create and configure environment files with appropriate defaults.

## 🌐 Production Environment Setup

For production environments, additional security measures are recommended:

1. **Use an environment manager** (like PM2) to set environment variables
2. **Use a secrets manager** for sensitive information (like database credentials)
3. **Generate a strong JWT secret key**:
   ```bash
   # Generate a secure random key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
4. **Set appropriate CORS settings** to restrict access to your frontend domains
5. **Enable all security features**:
   ```bash
   ENABLE_HELMET=true
   ENABLE_RATE_LIMIT=true
   ENABLE_CORS=true
   ENABLE_CSRF=true
   ENABLE_XSS_PROTECTION=true
   ```

## ❓ Troubleshooting

If you encounter environment-related issues:

1. **Verify file existence**
   ```bash
   # Check if environment files exist
   ls -la .env*
   ```

2. **Validate environment variables**
   ```bash
   # Print current environment settings (excluding secrets)
   npm run print-env
   ```

3. **Check for syntax errors** in your .env files:
   - No spaces around `=` sign
   - No quotes unless they're part of the value
   - No trailing commas

4. **Common problems and solutions**:

   | Problem | Solution |
   |---------|----------|
   | MongoDB connection error | Check if MongoDB is running and connection string is correct |
   | JWT token verification fails | Make sure JWT_SECRET is consistent across restarts |
   | CORS errors | Add your frontend URL to CORS_ORIGIN |
   | Environment variables not loading | Check file names and NODE_ENV setting |

5. **Regenerate configuration** if needed:
   ```bash
   npm run setup-env -- --force
   ```

## 🔒 Security Best Practices

To ensure your application's security:

1. **Never commit .env files** to version control
   - Add `.env*` to your `.gitignore` file
   - Only commit `.env.example` with placeholder values

2. **Use different secrets** for development and production
   - Generate unique keys for each environment
   - Never share production secrets

3. **Rotate secrets regularly**
   - Change JWT_SECRET periodically
   - Update database credentials on a schedule

4. **Use specific CORS settings** in production
   ```bash
   # Specify exact domains instead of wildcards
   CORS_ORIGIN=https://yourapp.com,https://admin.yourapp.com
   ```

5. **Implement proper access control**
   - Limit access to API endpoints based on user roles
   - Use the principle of least privilege

By following these guidelines, you'll ensure a secure and properly configured API environment. 