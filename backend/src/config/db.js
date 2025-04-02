// This file is responsible for setting up the connection to the MongoDB database using Mongoose.
const mongoose = require('mongoose');
const chalk = require('chalk');

// Track connection state to avoid duplicate logs and connections
let isConnecting = false;
let connectionAttemptLogged = false;
let connectionErrorLogged = false;

const connectDB = async () => {
  try {
    // If already connected, return the existing connection
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    // If already attempting to connect, don't start another connection
    if (isConnecting) {
      return mongoose.connection;
    }
    
    // Set connecting flag
    isConnecting = true;
    
    // Only log connection attempt once
    if (!connectionAttemptLogged) {
      console.log(chalk.yellow('📊 Connecting to MongoDB...'));
      connectionAttemptLogged = true;
    }
    
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are no longer needed in mongoose 6+
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
      
      // Add connection options to prevent timeouts
      serverSelectionTimeoutMS: 10000, // Timeout for server selection
      socketTimeoutMS: 45000, // How long the socket can be idle before closing
      connectTimeoutMS: 10000, // Timeout for initial connection
      maxPoolSize: 50, // Maximum number of connections in the pool
    });
    
    // Reset connecting flag
    isConnecting = false;
    connectionErrorLogged = false;
    
    // Only log connection success if not already logged
    console.log(chalk.green.bold('✅ MongoDB Connected: ') + 
                chalk.blue.underline(`${conn.connection.host}`) + 
                chalk.green(' ✓'));
                
    return conn;
  } catch (error) {
    // Reset connecting flag on error
    isConnecting = false;
    
    // Only log the error once to avoid flooding the console
    if (!connectionErrorLogged) {
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
      
      console.log(chalk.yellow('⚠️ Warning: The application will continue to run without database access.'));
      console.log(chalk.yellow('   Some features may not work correctly.'));
      console.log(chalk.yellow('   Please make sure MongoDB is running and try again.'));
      
      connectionErrorLogged = true;
    }
    
    // Return the mongoose connection in its current state instead of exiting
    return mongoose.connection;
  }
};

module.exports = connectDB; 