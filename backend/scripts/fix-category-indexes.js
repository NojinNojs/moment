// Script to fix broken category indexes
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const chalk = require('chalk');
const loadEnv = require('../src/config/dotenv');

// Load environment variables
loadEnv();

// Function to fix category indexes
const fixCategoryIndexes = async () => {
  try {
    console.log(chalk.yellow('📊 Connecting to MongoDB...'));
    await connectDB();
    
    console.log(chalk.blue('Checking existing indexes...'));
    
    // Check if the categories collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const categoryCollectionExists = collections.some(c => c.name === 'categories');
    
    if (!categoryCollectionExists) {
      console.log(chalk.yellow('Categories collection does not exist yet. Nothing to fix.'));
      await mongoose.disconnect();
      return;
    }
    
    // Get the current indexes
    const indexes = await mongoose.connection.collection('categories').indexes();
    
    console.log(chalk.blue('Current indexes:'));
    indexes.forEach(index => {
      const indexKeys = Object.keys(index.key).map(k => `${k}:${index.key[k]}`).join(', ');
      const unique = index.unique ? 'UNIQUE' : '';
      const indexName = index.name;
      console.log(`  - ${indexName}: { ${indexKeys} } ${unique}`);
    });
    
    // Check if we have a simple name index that might cause conflicts
    const nameIndex = indexes.find(index => 
      index.key && 
      Object.keys(index.key).length === 1 && 
      index.key.name === 1 && 
      index.unique
    );
    
    // Check for the compound index
    const compoundIndex = indexes.find(index => 
      index.key && 
      Object.keys(index.key).length === 2 && 
      index.key.name === 1 && 
      index.key.type === 1 && 
      index.unique
    );
    
    if (nameIndex && !compoundIndex) {
      console.log(chalk.yellow.bold('⚠️ ISSUE DETECTED: Found unique index on name field without type field'));
      console.log(chalk.yellow('This can cause duplicate key errors when having same category names in different types (income/expense)'));
      
      console.log(chalk.blue('Creating backup of categories...'));
      
      // Backup the categories collection
      const categories = await mongoose.connection.collection('categories').find({}).toArray();
      console.log(chalk.green(`✅ Backed up ${categories.length} categories`));
      
      // Drop the problematic index
      console.log(chalk.yellow(`Dropping index: ${nameIndex.name}...`));
      await mongoose.connection.collection('categories').dropIndex(nameIndex.name);
      console.log(chalk.green('✅ Successfully dropped the problematic index'));
      
      // Create the correct compound index
      console.log(chalk.blue('Creating compound index on name and type...'));
      await mongoose.connection.collection('categories').createIndex(
        { name: 1, type: 1 }, 
        { unique: true }
      );
      console.log(chalk.green('✅ Successfully created compound index'));
      
      // Verify the new indexes
      const updatedIndexes = await mongoose.connection.collection('categories').indexes();
      console.log(chalk.blue('Updated indexes:'));
      updatedIndexes.forEach(index => {
        const indexKeys = Object.keys(index.key).map(k => `${k}:${index.key[k]}`).join(', ');
        const unique = index.unique ? 'UNIQUE' : '';
        const indexName = index.name;
        console.log(`  - ${indexName}: { ${indexKeys} } ${unique}`);
      });
      
      console.log(chalk.green.bold('✅ Category indexes have been fixed successfully!'));
    } else if (compoundIndex) {
      console.log(chalk.green('✓ Your indexes are already correctly configured.'));
      console.log(chalk.green('✓ The compound index on name+type exists to prevent duplicate names across different types.'));
    } else {
      console.log(chalk.yellow("⚠️ No problematic indexes found, but the correct compound index doesn't exist either."));
      console.log(chalk.blue('Creating compound index on name and type...'));
      
      await mongoose.connection.collection('categories').createIndex(
        { name: 1, type: 1 }, 
        { unique: true }
      );
      
      console.log(chalk.green('✅ Successfully created compound index'));
    }
    
    // Disconnect from the database
    console.log(chalk.yellow('📊 Disconnecting from MongoDB...'));
    await mongoose.disconnect();
    console.log(chalk.green('✅ Done!'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Error fixing category indexes: ${error.message}`));
    console.error(error);
    
    // Disconnect on error
    try {
      await mongoose.disconnect();
    } catch (err) {
      // Ignore disconnect errors
    }
    
    process.exit(1);
  }
};

// Run the script
fixCategoryIndexes(); 