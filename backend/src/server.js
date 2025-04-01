// This file is the entry point of the application, starting the Express server.
const app = require('./app');
const chalk = require('chalk');
const figlet = require('figlet');
const connectDB = require('./config/db');
const loadEnv = require('./config/dotenv');
const getRoutesList = require('./utils/getRoutesList');

// Load environment variables
loadEnv();

// Single database connection for the entire app
console.log(chalk.yellow('📊 Connecting to MongoDB...'));
connectDB().then(async () => {
  console.log(chalk.green('✅ MongoDB Connected: ') + chalk.bold.green('localhost ✓'));
  
  // Run category seeder if needed (after connection is established)
  if (global.runCategorySeedersAfterConnection === true) {
    try {
      const seedCategories = require('./seeders/categorySeeders');
      const success = await seedCategories();
      
      if (success) {
        console.log(chalk.green('✅ Categories seeder completed successfully!'));
      } else {
        console.log(chalk.yellow('⚠️ Categories seeder completed with errors.'));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error running category seeder: ${error.message}`));
    }
  }
}).catch(err => {
  console.error(chalk.red('❌ Failed to connect to MongoDB: ') + chalk.bold.red(err.message));
  process.exit(1);
});

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
  
  // Get the list of available routes using our utility function
  const routes = getRoutesList(app, {
    apiPrefix: process.env.API_PREFIX || '/api',
    apiVersion: process.env.API_VERSION || 'v1'
  });
  
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