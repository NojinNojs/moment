// This file is responsible for setting up the connection to the MongoDB database using Mongoose.
const mongoose = require('mongoose');
const chalk = require('chalk');

const connectDB = async () => {
  try {
    console.log(chalk.yellow('📊 Connecting to MongoDB...'));
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are no longer needed in mongoose 6+
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
    });
    
    console.log(chalk.green.bold('✅ MongoDB Connected: ') + 
                chalk.blue.underline(`${conn.connection.host}`) + 
                chalk.green(' ✓'));
                
    return conn;
  } catch (error) {
    console.error(chalk.red.bold('❌ MongoDB Connection Error: ') + chalk.red(error.message));
    
    // Print more detailed error for common issues
    if (error.code === 18) {
      console.error(chalk.yellow('Authentication failed - check username/password in MONGO_URI'));
    } else if (error.code === 'ENOTFOUND') {
      console.error(chalk.yellow('Server not found - check hostname in MONGO_URI'));
    } else if (error.message.includes('bad auth')) {
      console.error(chalk.yellow('Authorization failed - check database name and credentials'));
    } else if (error.message.includes('already exists with different case')) {
      console.error(chalk.yellow('Database name case sensitivity issue - ensure consistent database naming'));
    }
    
    process.exit(1);
  }
};

module.exports = connectDB; 