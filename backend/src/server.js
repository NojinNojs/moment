// This file is the entry point of the application, starting the Express server.
const app = require('./app');
const chalk = require('chalk');
const figlet = require('figlet');
const connectDB = require('./config/db');
const loadEnv = require('./config/dotenv');

// Load environment variables
loadEnv();

// Connect to the database - single connection for the entire app
connectDB();

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  // Generate ASCII art for "Moment API"
  const asciiArt = figlet.textSync('Moment API', {
    font: 'Big',
    horizontalLayout: 'full',
    verticalLayout: 'default',
    width: 100,
    whitespaceBreak: true
  });

  // Print a beautiful server start message
  console.log('\n' + chalk.cyan(asciiArt));
  console.log('\n' + chalk.bold('------------------------------------------------------'));
  console.log(`${chalk.green('✅')} ${chalk.bold.yellow('Server')} running in ${chalk.bold.magenta(process.env.NODE_ENV)} mode`);
  console.log(`${chalk.green('✅')} ${chalk.bold.yellow('Server URL:')} ${chalk.bold.blue(`http://localhost:${PORT}`)}`);
  console.log(`${chalk.green('✅')} ${chalk.bold.yellow('API Docs:')} ${chalk.bold.blue(`http://localhost:${PORT}${process.env.API_PREFIX || '/api'}/docs`)}`);
  console.log(`${chalk.green('✅')} ${chalk.bold.yellow('API Version:')} ${chalk.bold.green(process.env.API_VERSION || 'v1')}`);
  console.log(`${chalk.green('✅')} ${chalk.bold.yellow('MongoDB:')} ${chalk.bold.green('Connected')}`);
  console.log(chalk.bold('------------------------------------------------------') + '\n');
  
  const routes = [
    { path: `${process.env.API_PREFIX || '/api'}${process.env.API_VERSION ? '/' + process.env.API_VERSION : ''}/auth/register`, method: 'POST', description: 'Register a new user' },
    { path: `${process.env.API_PREFIX || '/api'}${process.env.API_VERSION ? '/' + process.env.API_VERSION : ''}/auth/login`, method: 'POST', description: 'Authenticate user & get token' },
    { path: `${process.env.API_PREFIX || '/api'}${process.env.API_VERSION ? '/' + process.env.API_VERSION : ''}/auth/me`, method: 'GET', description: 'Get current user profile' },
    { path: `${process.env.API_PREFIX || '/api'}/docs`, method: 'GET', description: 'API Documentation' },
    { path: `${process.env.API_PREFIX || '/api'}/health`, method: 'GET', description: 'Health Check' }
  ];
  
  console.log(chalk.bold.yellow('Available Routes:'));
  routes.forEach(route => {
    console.log(`  ${chalk.bold.green(route.method.padEnd(8))} ${chalk.bold.blue(route.path.padEnd(40))} ${chalk.dim(route.description)}`);
  });
  console.log('\n' + chalk.bold.yellow('Press CTRL+C to stop the server') + '\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(chalk.red.bold('\n❌ Error: ') + chalk.red(err.message));
  console.error(chalk.red(err.stack) + '\n');
  // Close server & exit process
  server.close(() => process.exit(1));
}); 