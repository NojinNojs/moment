// This file is the entry point of the application, starting the Express server.
const app = require('./app');
const http = require('http');

const PORT = process.env.PORT || 3000;

// Function to find an available port
const startServer = (port) => {
  const server = http.createServer(app);
  
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.log(`Port ${port} is already in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', error);
    }
  });
  
  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

startServer(PORT); 