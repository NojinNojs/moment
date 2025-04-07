// This file is the entry point of the application, starting the Express server.
const app = require('./app');
const chalk = require('chalk');
const figlet = require('figlet');
const connectDB = require('./config/db');
const loadEnv = require('./config/dotenv');
const getRoutesList = require('./utils/getRoutesList');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

// Import user routes
const userRoutes = require('./routes/userRoutes');

// Load environment variables only once
loadEnv();

// Single database connection for the entire app - no console log here as it's already logged in connectDB
connectDB().then(async (connection) => {
  // Seed categories only if enabled in environment
  if (process.env.AUTO_SEED_CATEGORIES === 'true') {
    try {
      console.log(chalk.yellow('🌱 Running category seeders...'));
      const seedCategories = require('./seeders/categorySeeders');
      const success = await seedCategories();
      
      if (success) {
        console.log(chalk.green('✅ Categories seeded successfully!'));
      } else {
        console.log(chalk.yellow('⚠️ Categories seeder completed with warnings.'));
      }
    } catch (error) {
      console.error(chalk.red(`❌ Error running category seeder: ${error.message}`));
    }
  } else {
    console.log(chalk.yellow('ℹ️ Auto-seeding categories is disabled'));
  }

  // Add user routes
  app.use('/api/users', userRoutes);

  // Create HTTP server
  const server = http.createServer(app);

  // Set up WebSocket server
  const wss = new WebSocket.Server({ noServer: true });

  // Store active connections by userId
  const userConnections = new Map();

  // WebSocket connection handler
  wss.on('connection', (ws, request) => {
    let userId = request.userId;
    console.log(`WebSocket connection established for user: ${userId}`);
    
    // Store connection
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId).add(ws);
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`Received message from user ${userId}:`, data);
        
        // Handle preference update messages
        if (data.type === 'preference_update') {
          // Broadcast to all other sessions of the same user
          broadcastToUser(userId, ws, {
            type: 'preference_updated',
            preference: data.preference,
            value: data.value
          });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle connection close
    ws.on('close', () => {
      console.log(`WebSocket connection closed for user: ${userId}`);
      if (userConnections.has(userId)) {
        userConnections.get(userId).delete(ws);
        if (userConnections.get(userId).size === 0) {
          userConnections.delete(userId);
        }
      }
    });
  });

  // Helper function to broadcast to all connections of a user except the sender
  function broadcastToUser(userId, sender, data) {
    if (userConnections.has(userId)) {
      const connections = userConnections.get(userId);
      const message = JSON.stringify(data);
      
      for (const connection of connections) {
        if (connection !== sender && connection.readyState === WebSocket.OPEN) {
          connection.send(message);
        }
      }
    }
  }

  // Handle WebSocket upgrade
  server.on('upgrade', (request, socket, head) => {
    // Get token from query params
    const url = new URL(request.url, `http://${request.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      request.userId = decoded.id;
      
      // Upgrade the connection to WebSocket
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  // Start the server once database is connected
  startServer(server, process.env.PORT || 3000);
}).catch(err => {
  console.error(chalk.red('❌ Failed to connect to MongoDB: ') + chalk.bold.red(err.message));
  process.exit(1);
});

// Modify the app.listen part to use the HTTP server instead
function startServer(server, port) {
  return new Promise((resolve, reject) => {
    server.listen(port, () => {
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
      console.log(`${chalk.green('✅')} ${chalk.bold.yellow('Server URL:')} ${chalk.bold.blue(`http://localhost:${port}`)}`);
      console.log(`${chalk.green('✅')} ${chalk.bold.yellow('API Docs:')} ${chalk.bold.blue(`http://localhost:${port}${process.env.API_PREFIX || '/api'}/docs`)}`);
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
      resolve();
    });
    
    server.on('error', (error) => {
      reject(error);
    });
  });
} 