// Script to reset all categories (drop and reseed)
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Category = require('../src/models/Category');
const seedCategories = require('../src/seeders/categorySeeders');
const chalk = require('chalk');
const loadEnv = require('../src/config/dotenv');
const readline = require('readline');

// Load environment variables
loadEnv();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for confirmation
const askForConfirmation = () => {
  return new Promise((resolve) => {
    rl.question(chalk.red.bold('⚠️ WARNING: This will delete ALL categories and reseed them. Continue? (yes/no): '), (answer) => {
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
};

// Function to reset categories
const resetCategories = async () => {
  try {
    console.log(chalk.yellow('📊 Connecting to MongoDB...'));
    await connectDB();
    
    // Get count before deletion
    const countBefore = await Category.countDocuments();
    console.log(chalk.blue(`Found ${countBefore} existing categories in the database.`));
    
    // Ask for confirmation
    const confirmed = await askForConfirmation();
    
    if (!confirmed) {
      console.log(chalk.yellow('Operation canceled by user.'));
      await mongoose.disconnect();
      rl.close();
      process.exit(0);
      return;
    }
    
    // Delete all categories
    console.log(chalk.yellow('Deleting all categories...'));
    
    try {
      // Drop the entire collection (removes all indexes too)
      await mongoose.connection.collections.categories?.drop();
      console.log(chalk.green('✅ Successfully dropped categories collection.'));
    } catch (err) {
      // Collection might not exist yet
      console.log(chalk.yellow('Categories collection does not exist, skipping drop.'));
    }
    
    // Wait a moment before reseeding
    console.log(chalk.yellow('Preparing to reseed categories...'));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Seed fresh categories
    console.log(chalk.yellow('Seeding fresh categories...'));
    const success = await seedCategories();
    
    if (success) {
      console.log(chalk.green('✅ Categories reset completed successfully!'));
    } else {
      console.log(chalk.red('❌ Error during category reseeding.'));
    }
    
    // Disconnect from database
    console.log(chalk.yellow('📊 Disconnecting from MongoDB...'));
    await mongoose.disconnect();
    rl.close();
    console.log(chalk.green('✅ Done!'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Error resetting categories: ${error.message}`));
    console.error(error);
    
    // Disconnect on error
    await mongoose.disconnect();
    rl.close();
    process.exit(1);
  }
};

// Run the script
resetCategories(); 