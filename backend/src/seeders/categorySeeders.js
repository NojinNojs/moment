// Seeder file for creating default categories
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const chalk = require('chalk');
const loadEnv = require('../config/dotenv');

// Load environment variables
loadEnv();

// Default income categories (advanced set)
const incomeCategories = [
  {
    name: 'Salary',
    type: 'income',
    icon: 'briefcase',
    color: '#4CAF50',
    description: 'Regular income from employment',
    isDefault: true,
    order: 1
  },
  {
    name: 'Freelance',
    type: 'income',
    icon: 'code',
    color: '#2196F3',
    description: 'Income from freelance work or side jobs',
    isDefault: true,
    order: 2
  },
  {
    name: 'Investment',
    type: 'income',
    icon: 'trending-up',
    color: '#9C27B0',
    description: 'Returns from stocks, bonds, mutual funds, etc.',
    isDefault: true,
    order: 3
  },
  {
    name: 'Gift',
    type: 'income',
    icon: 'gift',
    color: '#E91E63',
    description: 'Money received as a gift',
    isDefault: true,
    order: 4
  },
  {
    name: 'Refund',
    type: 'income',
    icon: 'refresh-cw',
    color: '#FF9800',
    description: 'Refunded money from returns or reimbursements',
    isDefault: true,
    order: 5
  },
  {
    name: 'Bonus',
    type: 'income',
    icon: 'award',
    color: '#CDDC39',
    description: 'Performance bonuses and incentives',
    isDefault: true,
    order: 6
  },
  {
    name: 'Allowance',
    type: 'income',
    icon: 'credit-card',
    color: '#009688',
    description: 'Regular allowances and benefits',
    isDefault: true,
    order: 7
  },
  {
    name: 'Holiday Bonus',
    type: 'income',
    icon: 'calendar',
    color: '#FF5722',
    description: 'Holiday and religious festival bonuses (Eid, Christmas, etc.)',
    isDefault: true,
    order: 8
  },
  {
    name: 'Small Business',
    type: 'income',
    icon: 'shopping-cart',
    color: '#795548',
    description: 'Income from small business or side hustle',
    isDefault: true,
    order: 9
  },
  {
    name: 'Rental',
    type: 'income',
    icon: 'home',
    color: '#3F51B5',
    description: 'Income from property or asset rentals',
    isDefault: true,
    order: 10
  },
  {
    name: 'Dividend',
    type: 'income',
    icon: 'pie-chart',
    color: '#673AB7',
    description: 'Dividend payments from investments',
    isDefault: true,
    order: 11
  },
  {
    name: 'Pension',
    type: 'income',
    icon: 'clock',
    color: '#607D8B',
    description: 'Retirement or pension payments',
    isDefault: true,
    order: 12
  },
  {
    name: 'Asset Sale',
    type: 'income',
    icon: 'dollar-sign',
    color: '#FFC107',
    description: 'Income from selling assets',
    isDefault: true,
    order: 13
  },
  {
    name: 'Inheritance',
    type: 'income',
    icon: 'file-text',
    color: '#9E9E9E',
    description: 'Money received as inheritance',
    isDefault: true,
    order: 14
  },
  {
    name: 'Other',
    type: 'income',
    icon: 'plus-circle',
    color: '#607D8B',
    description: 'Other income sources',
    isDefault: true,
    order: 15
  }
];

// Default expense categories (advanced set)
const expenseCategories = [
  {
    name: 'Food & Dining',
    type: 'expense',
    icon: 'coffee',
    color: '#FF5722',
    description: 'Groceries, restaurants, and food delivery',
    isDefault: true,
    order: 1
  },
  {
    name: 'Transportation',
    type: 'expense',
    icon: 'car',
    color: '#3F51B5',
    description: 'Public transit, rideshares, fuel, and vehicle maintenance',
    isDefault: true,
    order: 2
  },
  {
    name: 'Housing',
    type: 'expense',
    icon: 'home',
    color: '#795548',
    description: 'Rent, mortgage, property taxes, and home repairs',
    isDefault: true,
    order: 3
  },
  {
    name: 'Utilities',
    type: 'expense',
    icon: 'zap',
    color: '#FFC107',
    description: 'Electricity, water, gas, and other home utilities',
    isDefault: true,
    order: 4
  },
  {
    name: 'Internet & Phone',
    type: 'expense',
    icon: 'wifi',
    color: '#2196F3',
    description: 'Internet, mobile data, and phone bills',
    isDefault: true,
    order: 5
  },
  {
    name: 'Healthcare',
    type: 'expense',
    icon: 'activity',
    color: '#F44336',
    description: 'Doctor visits, medications, and health insurance',
    isDefault: true,
    order: 6
  },
  {
    name: 'Entertainment',
    type: 'expense',
    icon: 'film',
    color: '#673AB7',
    description: 'Movies, music, games, and subscriptions',
    isDefault: true,
    order: 7
  },
  {
    name: 'Shopping',
    type: 'expense',
    icon: 'shopping-bag',
    color: '#E91E63',
    description: 'Clothing, electronics, and other retail purchases',
    isDefault: true,
    order: 8
  },
  {
    name: 'Online Shopping',
    type: 'expense',
    icon: 'globe',
    color: '#4CAF50',
    description: 'Purchases from online marketplaces and e-commerce',
    isDefault: true,
    order: 9
  },
  {
    name: 'Travel',
    type: 'expense',
    icon: 'map',
    color: '#009688',
    description: 'Flights, hotels, and vacation expenses',
    isDefault: true,
    order: 10
  },
  {
    name: 'Education',
    type: 'expense',
    icon: 'book',
    color: '#2196F3',
    description: 'Tuition, books, courses, and educational materials',
    isDefault: true,
    order: 11
  },
  {
    name: 'Children Education',
    type: 'expense',
    icon: 'book-open',
    color: '#3F51B5',
    description: 'School fees, supplies, and educational expenses for children',
    isDefault: true,
    order: 12
  },
  {
    name: 'Debt Payment',
    type: 'expense',
    icon: 'credit-card',
    color: '#FF9800',
    description: 'Credit card payments, loan installments, and other debt repayments',
    isDefault: true,
    order: 13
  },
  {
    name: 'Charitable Giving',
    type: 'expense',
    icon: 'heart',
    color: '#E91E63',
    description: 'Donations, religious contributions, and charity',
    isDefault: true,
    order: 14
  },
  {
    name: 'Family Support',
    type: 'expense',
    icon: 'users',
    color: '#9C27B0',
    description: 'Financial support for family members',
    isDefault: true,
    order: 15
  },
  {
    name: 'Tax',
    type: 'expense',
    icon: 'file',
    color: '#607D8B',
    description: 'Income tax, property tax, and other taxes',
    isDefault: true,
    order: 16
  },
  {
    name: 'Insurance',
    type: 'expense',
    icon: 'shield',
    color: '#673AB7',
    description: 'Life, health, vehicle, and other insurance premiums',
    isDefault: true,
    order: 17
  },
  {
    name: 'Subscriptions',
    type: 'expense',
    icon: 'repeat',
    color: '#CDDC39',
    description: 'Regular subscription services and memberships',
    isDefault: true,
    order: 18
  },
  {
    name: 'Personal Care',
    type: 'expense',
    icon: 'user',
    color: '#9C27B0',
    description: 'Haircuts, cosmetics, and personal grooming',
    isDefault: true,
    order: 19
  },
  {
    name: 'Vehicle Maintenance',
    type: 'expense',
    icon: 'tool',
    color: '#FF5722',
    description: 'Car repairs, maintenance, and vehicle-related expenses',
    isDefault: true,
    order: 20
  },
  {
    name: 'Home Furnishing',
    type: 'expense',
    icon: 'package',
    color: '#795548',
    description: 'Furniture, appliances, and home goods',
    isDefault: true,
    order: 21
  },
  {
    name: 'Clothing',
    type: 'expense',
    icon: 'scissors',
    color: '#9E9E9E',
    description: 'Clothing, shoes, and accessories',
    isDefault: true,
    order: 22
  },
  {
    name: 'Electronics',
    type: 'expense',
    icon: 'smartphone',
    color: '#212121',
    description: 'Gadgets, computers, and electronic devices',
    isDefault: true,
    order: 23
  },
  {
    name: 'Hobbies',
    type: 'expense',
    icon: 'camera',
    color: '#00BCD4',
    description: 'Expenses related to personal interests and hobbies',
    isDefault: true,
    order: 24
  },
  {
    name: 'Social Events',
    type: 'expense',
    icon: 'clipboard',
    color: '#8BC34A',
    description: 'Weddings, celebrations, and social gatherings',
    isDefault: true,
    order: 25
  },
  {
    name: 'Other',
    type: 'expense',
    icon: 'plus-circle',
    color: '#607D8B',
    description: 'Miscellaneous expenses',
    isDefault: true,
    order: 26
  }
];

// Basic categories (smaller set) for when USE_ADVANCED_CATEGORIES is false
const basicIncomeCategories = [
  {
    name: 'Salary',
    type: 'income',
    icon: 'briefcase',
    color: '#4CAF50',
    description: 'Regular income from employment',
    isDefault: true,
    order: 1
  },
  {
    name: 'Freelance',
    type: 'income',
    icon: 'code',
    color: '#2196F3',
    description: 'Income from freelance work or side jobs',
    isDefault: true,
    order: 2
  },
  {
    name: 'Investment',
    type: 'income',
    icon: 'trending-up',
    color: '#9C27B0',
    description: 'Returns from investments',
    isDefault: true,
    order: 3
  },
  {
    name: 'Bonus',
    type: 'income',
    icon: 'award',
    color: '#CDDC39',
    description: 'Bonuses and incentives',
    isDefault: true,
    order: 4
  },
  {
    name: 'Other',
    type: 'income',
    icon: 'plus-circle',
    color: '#607D8B',
    description: 'Other income sources',
    isDefault: true,
    order: 5
  }
];

const basicExpenseCategories = [
  {
    name: 'Food & Dining',
    type: 'expense',
    icon: 'coffee',
    color: '#FF5722',
    description: 'Groceries, restaurants, and food delivery',
    isDefault: true,
    order: 1
  },
  {
    name: 'Transportation',
    type: 'expense',
    icon: 'car',
    color: '#3F51B5',
    description: 'Public transit, rideshares, and fuel',
    isDefault: true,
    order: 2
  },
  {
    name: 'Housing',
    type: 'expense',
    icon: 'home',
    color: '#795548',
    description: 'Rent, mortgage, and utilities',
    isDefault: true,
    order: 3
  },
  {
    name: 'Entertainment',
    type: 'expense',
    icon: 'film',
    color: '#673AB7',
    description: 'Movies, music, games, and entertainment',
    isDefault: true,
    order: 4
  },
  {
    name: 'Shopping',
    type: 'expense',
    icon: 'shopping-bag',
    color: '#E91E63',
    description: 'Retail purchases',
    isDefault: true,
    order: 5
  },
  {
    name: 'Healthcare',
    type: 'expense',
    icon: 'activity',
    color: '#F44336',
    description: 'Medical expenses',
    isDefault: true,
    order: 6
  },
  {
    name: 'Education',
    type: 'expense',
    icon: 'book',
    color: '#2196F3',
    description: 'Educational expenses',
    isDefault: true,
    order: 7
  },
  {
    name: 'Bills & Utilities',
    type: 'expense',
    icon: 'zap',
    color: '#FFC107',
    description: 'Recurring bills and utilities',
    isDefault: true,
    order: 8
  },
  {
    name: 'Other',
    type: 'expense',
    icon: 'plus-circle',
    color: '#607D8B',
    description: 'Miscellaneous expenses',
    isDefault: true,
    order: 9
  }
];

// Helper function to display categories in a table format
const displayCategoriesTable = async () => {
  try {
    // Get all categories from the database
    const allCategories = await Category.find().sort({ type: 1, order: 1 });
    
    if (allCategories.length === 0) {
      console.log(chalk.yellow('No categories found in the database.'));
      return;
    }
    
    // Split categories by type
    const incomeCategories = allCategories.filter(cat => cat.type === 'income');
    const expenseCategories = allCategories.filter(cat => cat.type === 'expense');
    
    // Print income categories table
    console.log('\n' + chalk.bgGreen.black(' INCOME CATEGORIES ') + '\n');
    console.log(chalk.white('┌───────┬────────────────────────┬─────────────┬────────────┐'));
    console.log(chalk.white('│ Order │ Name                   │ Icon        │ Color      │'));
    console.log(chalk.white('├───────┼────────────────────────┼─────────────┼────────────┤'));
    
    incomeCategories.forEach(cat => {
      const order = cat.order.toString().padEnd(5);
      const name = cat.name.padEnd(22);
      const icon = cat.icon.padEnd(11);
      const color = cat.color.padEnd(10);
      console.log(chalk.white(`│ ${order}│ ${name}│ ${icon}│ ${color}│`));
    });
    
    console.log(chalk.white('└───────┴────────────────────────┴─────────────┴────────────┘'));
    
    // Print expense categories table
    console.log('\n' + chalk.bgRed.black(' EXPENSE CATEGORIES ') + '\n');
    console.log(chalk.white('┌───────┬────────────────────────┬─────────────┬────────────┐'));
    console.log(chalk.white('│ Order │ Name                   │ Icon        │ Color      │'));
    console.log(chalk.white('├───────┼────────────────────────┼─────────────┼────────────┤'));
    
    expenseCategories.forEach(cat => {
      const order = cat.order.toString().padEnd(5);
      const name = cat.name.padEnd(22);
      const icon = cat.icon.padEnd(11);
      const color = cat.color.padEnd(10);
      console.log(chalk.white(`│ ${order}│ ${name}│ ${icon}│ ${color}│`));
    });
    
    console.log(chalk.white('└───────┴────────────────────────┴─────────────┴────────────┘'));
    console.log(chalk.blue(`\nTotal: ${allCategories.length} categories (${incomeCategories.length} income, ${expenseCategories.length} expense)`));
    
  } catch (error) {
    console.error(chalk.red(`❌ Error displaying categories: ${error.message}`));
  }
};

// Helper function to fix the category collection indexes if needed
const fixCategoryIndexes = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Not connected yet
      return false;
    }

    console.log(chalk.yellow('📊 Checking and fixing category collection indexes...'));
    
    // Get the current indexes
    const indexes = await mongoose.connection.collections.categories?.listIndexes().toArray();
    
    // If no indexes exist yet, nothing to fix
    if (!indexes || indexes.length === 0) {
      return false;
    }
    
    // Check if we have a simple name index that might cause conflicts
    const hasNameIndex = indexes.some(index => 
      index.key && 
      Object.keys(index.key).length === 1 && 
      index.key.name === 1 && 
      index.unique
    );
    
    // Check if we already have the correct compound index
    const hasCompoundIndex = indexes.some(index => 
      index.key && 
      Object.keys(index.key).length === 2 && 
      index.key.name === 1 && 
      index.key.type === 1 && 
      index.unique
    );
    
    // If we have a name index but no compound index, we need to fix it
    if (hasNameIndex && !hasCompoundIndex) {
      console.log(chalk.yellow('⚠️ Detected incorrect name index that may cause conflicts.'));
      console.log(chalk.yellow('📊 Dropping and recreating indexes...'));
      
      try {
        // Drop all indexes and recreate them
        await mongoose.connection.collections.categories?.dropIndexes();
        console.log(chalk.green('✅ Successfully dropped all category indexes.'));
        
        // The model will recreate the correct indexes automatically
        return true;
      } catch (error) {
        console.error(chalk.red(`❌ Error fixing category indexes: ${error.message}`));
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error(chalk.red(`❌ Error checking category indexes: ${error.message}`));
    return false;
  }
};

// Function to seed categories
const seedCategories = async () => {
  try {
    // Check if auto-seeding is disabled
    if (process.env.AUTO_SEED_CATEGORIES === 'false') {
      console.log(chalk.yellow('⚠️ Auto-seeding categories is disabled in environment configuration.'));
      console.log(chalk.yellow('Set AUTO_SEED_CATEGORIES=true in your .env file to enable.'));
      // Only exit if running as standalone script
      if (require.main === module) {
        process.exit(0);
      }
      return;
    }

    // Determine which category set to use based on environment variable
    const useAdvancedCategories = process.env.USE_ADVANCED_CATEGORIES === 'true';
    const selectedIncomeCategories = useAdvancedCategories ? incomeCategories : basicIncomeCategories;
    const selectedExpenseCategories = useAdvancedCategories ? expenseCategories : basicExpenseCategories;

    console.log(chalk.blue(`Using ${useAdvancedCategories ? 'advanced' : 'basic'} category set (${selectedIncomeCategories.length} income, ${selectedExpenseCategories.length} expense categories)`));
  
    // Connect to MongoDB (only if not already connected)
    const connectionState = mongoose.connection.readyState;
    if (connectionState !== 1) { // 1 means connected
      console.log(chalk.yellow('📊 Connecting to MongoDB...'));
      await connectDB();
    }
    
    // Check and fix category indexes if needed
    await fixCategoryIndexes();
    
    console.log(chalk.yellow('📊 Checking for existing categories...'));
    
    // Check if we already have categories
    const existingCount = await Category.countDocuments();
    
    // If there are existing categories with the same name but different types, we need to fix them
    if (existingCount > 0) {
      // Find all existing categories
      console.log(chalk.blue(`${existingCount} categories found. Checking for duplicates and missing categories...`));
      
      // Map to avoid duplicates based on name+type
      const existingCategoriesMap = new Map();
      
      // Get all existing categories
      const existingCategories = await Category.find();
      existingCategories.forEach(cat => {
        existingCategoriesMap.set(`${cat.name}-${cat.type}`, cat);
      });
      
      // Process income categories
      let addedCount = 0;
      let updatedCount = 0;
      
      // Process income categories
      for (const category of selectedIncomeCategories) {
        const key = `${category.name}-${category.type}`;
        const existingCategory = existingCategoriesMap.get(key);
        
        if (!existingCategory) {
          // Category doesn't exist, create it
          try {
            await Category.create(category);
            addedCount++;
            console.log(chalk.green(`✅ Added new income category: ${category.name}`));
          } catch (error) {
            console.error(chalk.red(`❌ Error adding income category ${category.name}: ${error.message}`));
          }
        } else {
          // Category exists, update if needed
          const needsUpdate = (
            existingCategory.icon !== category.icon ||
            existingCategory.color !== category.color ||
            existingCategory.description !== category.description ||
            existingCategory.order !== category.order ||
            existingCategory.isDefault !== category.isDefault
          );
          
          if (needsUpdate) {
            try {
              await Category.findByIdAndUpdate(existingCategory._id, {
                icon: category.icon,
                color: category.color,
                description: category.description,
                order: category.order,
                isDefault: category.isDefault
              });
              updatedCount++;
              console.log(chalk.blue(`ℹ️ Updated income category: ${category.name}`));
            } catch (error) {
              console.error(chalk.red(`❌ Error updating income category ${category.name}: ${error.message}`));
            }
          }
        }
      }
      
      // Process expense categories
      for (const category of selectedExpenseCategories) {
        const key = `${category.name}-${category.type}`;
        const existingCategory = existingCategoriesMap.get(key);
        
        if (!existingCategory) {
          // Category doesn't exist, create it
          try {
            await Category.create(category);
            addedCount++;
            console.log(chalk.green(`✅ Added new expense category: ${category.name}`));
          } catch (error) {
            console.error(chalk.red(`❌ Error adding expense category ${category.name}: ${error.message}`));
          }
        } else {
          // Category exists, update if needed
          const needsUpdate = (
            existingCategory.icon !== category.icon ||
            existingCategory.color !== category.color ||
            existingCategory.description !== category.description ||
            existingCategory.order !== category.order ||
            existingCategory.isDefault !== category.isDefault
          );
          
          if (needsUpdate) {
            try {
              await Category.findByIdAndUpdate(existingCategory._id, {
                icon: category.icon,
                color: category.color,
                description: category.description,
                order: category.order,
                isDefault: category.isDefault
              });
              updatedCount++;
              console.log(chalk.blue(`ℹ️ Updated expense category: ${category.name}`));
            } catch (error) {
              console.error(chalk.red(`❌ Error updating expense category ${category.name}: ${error.message}`));
            }
          }
        }
      }
      
      if (addedCount === 0 && updatedCount === 0) {
        console.log(chalk.blue('✓ All categories are up to date, no changes needed.'));
      } else {
        console.log(chalk.green(`✅ Added ${addedCount} new categories and updated ${updatedCount} existing categories.`));
      }
    } else {
      // No categories exist, add all defaults
      console.log(chalk.yellow('No categories found. Creating default categories...'));
      
      let successCount = 0;
      let errorCount = 0;
      
      // Add income categories one by one for better error handling
      for (const category of selectedIncomeCategories) {
        try {
          await Category.create(category);
          successCount++;
          console.log(chalk.green(`✅ Added income category: ${category.name}`));
        } catch (error) {
          errorCount++;
          console.error(chalk.red(`❌ Error adding income category ${category.name}: ${error.message}`));
        }
      }
      
      // Add expense categories one by one for better error handling
      for (const category of selectedExpenseCategories) {
        try {
          await Category.create(category);
          successCount++;
          console.log(chalk.green(`✅ Added expense category: ${category.name}`));
        } catch (error) {
          errorCount++;
          console.error(chalk.red(`❌ Error adding expense category ${category.name}: ${error.message}`));
        }
      }
      
      if (errorCount === 0) {
        console.log(chalk.green.bold(`✅ Successfully added ${successCount} default categories`));
      } else {
        console.log(chalk.yellow(`⚠️ Added ${successCount} categories with ${errorCount} errors`));
      }
    }
    
    // Display categories in a table
    await displayCategoriesTable();
    
    console.log(chalk.green('✅ Categories seeding completed!'));
    
    // Only exit if running as standalone script
    if (require.main === module) {
      process.exit(0);
    }
    
    return true; // Return success
  } catch (error) {
    console.error(chalk.red(`❌ Error seeding categories: ${error.message}`));
    console.error(error);
    
    // Only exit if running as standalone script
    if (require.main === module) {
      process.exit(1);
    }
    
    return false; // Return failure
  }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedCategories();
}

// Export the function for programmatic usage
module.exports = seedCategories; 