// Script to initialize categories from API endpoints
const axios = require('axios');
const chalk = require('chalk');
const loadEnv = require('../src/config/dotenv');
const figlet = require('figlet');

// Load environment variables
loadEnv();

// Define categories to be created
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

// Display welcome message
console.log(
  chalk.blue(
    figlet.textSync('Initialize Categories', { font: 'Standard' })
  )
);
console.log(chalk.yellow('=================================================='));
console.log(chalk.yellow('  This script will initialize default categories   '));
console.log(chalk.yellow('==================================================\n'));

// Determine which category set to use based on environment variable
const useAdvancedCategories = process.env.USE_ADVANCED_CATEGORIES === 'true';
const selectedIncomeCategories = useAdvancedCategories ? incomeCategories : basicIncomeCategories;
const selectedExpenseCategories = useAdvancedCategories ? expenseCategories : basicExpenseCategories;

console.log(chalk.blue(`Using ${useAdvancedCategories ? 'advanced' : 'basic'} category set (${selectedIncomeCategories.length} income, ${selectedExpenseCategories.length} expense categories)`));

// Function to create admin user
const createAdminUser = async () => {
  try {
    console.log(chalk.yellow('Creating admin user for API access...'));

    // Use environment variables for admin credentials
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Password123!';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    // Create admin user via API
    const response = await axios.post(`http://localhost:${process.env.PORT || 5000}/api/v1/auth/register`, {
      name: adminName,
      email: adminEmail,
      password: adminPassword,
    });

    console.log(chalk.green('✅ Admin user created successfully'));
    return response.data.token;
  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data.message.includes('already exists')) {
      console.log(chalk.blue('ℹ️ Admin user already exists, attempting to login...'));
      
      // Login instead
      try {
        const loginResponse = await axios.post(`http://localhost:${process.env.PORT || 5000}/api/v1/auth/login`, {
          email: process.env.ADMIN_EMAIL || 'admin@example.com',
          password: process.env.ADMIN_PASSWORD || 'Password123!',
        });
        
        console.log(chalk.green('✅ Logged in as admin user'));
        return loginResponse.data.token;
      } catch (loginError) {
        console.error(chalk.red('❌ Error logging in:'), loginError.response?.data?.message || loginError.message);
        throw new Error('Failed to authenticate');
      }
    } else {
      console.error(chalk.red('❌ Error creating admin user:'), error.response?.data?.message || error.message);
      throw new Error('Failed to create admin user');
    }
  }
};

// Function to create categories
const createCategories = async (token) => {
  const config = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const baseUrl = `http://localhost:${process.env.PORT || 5000}/api/v1/categories`;
  
  console.log(chalk.yellow('\nChecking for existing categories...'));
  
  try {
    // Get existing categories
    const response = await axios.get(baseUrl, config);
    const existingCategories = response.data.data;
    
    console.log(chalk.blue(`Found ${existingCategories.length} existing categories`));
    
    // Extract names of existing categories
    const existingNames = new Set();
    existingCategories.forEach(cat => {
      existingNames.add(`${cat.name}-${cat.type}`);
    });
    
    // Create missing income categories
    console.log(chalk.yellow('\nProcessing income categories...'));
    let createdCount = 0;
    
    for (const category of selectedIncomeCategories) {
      const key = `${category.name}-${category.type}`;
      if (!existingNames.has(key)) {
        try {
          await axios.post(baseUrl, category, config);
          console.log(chalk.green(`✅ Created income category: ${category.name}`));
          createdCount++;
        } catch (error) {
          console.error(chalk.red(`❌ Error creating ${category.name}:`), error.response?.data?.message || error.message);
        }
      } else {
        console.log(chalk.blue(`ℹ️ Income category already exists: ${category.name}`));
      }
    }
    
    // Create missing expense categories
    console.log(chalk.yellow('\nProcessing expense categories...'));
    
    for (const category of selectedExpenseCategories) {
      const key = `${category.name}-${category.type}`;
      if (!existingNames.has(key)) {
        try {
          await axios.post(baseUrl, category, config);
          console.log(chalk.green(`✅ Created expense category: ${category.name}`));
          createdCount++;
        } catch (error) {
          console.error(chalk.red(`❌ Error creating ${category.name}:`), error.response?.data?.message || error.message);
        }
      } else {
        console.log(chalk.blue(`ℹ️ Expense category already exists: ${category.name}`));
      }
    }
    
    // Summary
    if (createdCount > 0) {
      console.log(chalk.green(`\n✅ Created ${createdCount} new categories`));
    } else {
      console.log(chalk.blue('\nℹ️ All categories already exist, nothing to create'));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Error fetching categories:'), error.response?.data?.message || error.message);
  }
};

// Main function to run the script
const run = async () => {
  try {
    // Check if auto-seeding is disabled
    if (process.env.AUTO_SEED_CATEGORIES === 'false') {
      console.log(chalk.yellow('⚠️ Auto-seeding categories is disabled in environment configuration.'));
      console.log(chalk.yellow('Set AUTO_SEED_CATEGORIES=true in your .env file to enable.'));
      return;
    }

    console.log(chalk.yellow('Waiting for the API server to be ready...'));
    console.log(chalk.yellow('Make sure the server is running on the configured port'));
    console.log(chalk.yellow(`(default: http://localhost:${process.env.PORT || 5000})\n`));
    
    // Small delay to make sure the server is up
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create admin user and get token
    const token = await createAdminUser();
    
    // Create categories
    await createCategories(token);
    
    console.log(chalk.green.bold('\n✅ Category initialization complete!'));
    console.log(chalk.yellow('\nYou can now use these categories in your application.'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Initialization failed:'), error.message);
    console.log(chalk.yellow('\nPlease check if:'));
    console.log(chalk.yellow('1. The API server is running'));
    console.log(chalk.yellow('2. The MongoDB connection is working'));
    console.log(chalk.yellow('3. The server port matches your configuration'));
  }
};

// Execute the script
run(); 