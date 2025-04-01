// Script to drop all categories from the database
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Category = require('../src/models/Category');
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
    rl.question(chalk.red.bold('⚠️ WARNING: This will delete ALL categories from the database. Are you sure? (yes/no): '), (answer) => {
      resolve(answer.trim().toLowerCase() === 'yes');
    });
  });
};

// Function to drop all categories
const dropCategories = async () => {
  try {
    console.log(chalk.yellow('📊 Connecting to MongoDB...'));
    await connectDB();
    
    // Get count before deletion
    const countBefore = await Category.countDocuments();
    
    if (countBefore === 0) {
      console.log(chalk.yellow('No categories found in the database. Nothing to delete.'));
      await mongoose.disconnect();
      process.exit(0);
      return;
    }
    
    console.log(chalk.blue(`Found ${countBefore} categories in the database.`));
    
    // Ask for confirmation
    const confirmed = await askForConfirmation();
    
    if (!confirmed) {
      console.log(chalk.yellow('Operation canceled by user.'));
      await mongoose.disconnect();
      process.exit(0);
      return;
    }
    
    // Delete all categories
    console.log(chalk.yellow('Deleting all categories...'));
    const result = await Category.deleteMany({});
    
    console.log(chalk.green(`✅ Successfully deleted ${result.deletedCount} categories from the database.`));
    
    // Disconnect from database
    console.log(chalk.yellow('📊 Disconnecting from MongoDB...'));
    await mongoose.disconnect();
    rl.close();
    console.log(chalk.green('✅ Done!'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Error dropping categories: ${error.message}`));
    console.error(error);
    
    // Disconnect on error
    await mongoose.disconnect();
    rl.close();
    process.exit(1);
  }
};

// Run the script
dropCategories(); 